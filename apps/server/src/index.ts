import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { WS_CLOSE_CODES } from '@dce/shared';
import type { ClientMessage, ServerMessage } from '@dce/shared';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- room state ---

interface ClientInfo { userName: string; roomId: string | null }

const clientInfo = new WeakMap<WebSocket, ClientInfo>();
const rooms     = new Map<string, Set<WebSocket>>();
const roomSeq   = new Map<string, number>();          // per-room sequence counter

function broadcast(room: Set<WebSocket>, msg: ServerMessage, exclude?: WebSocket) {
  const payload = JSON.stringify(msg);
  room.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

function leaveRoom(ws: WebSocket) {
  const info = clientInfo.get(ws);
  if (!info?.roomId) return;

  const room = rooms.get(info.roomId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) { rooms.delete(info.roomId); roomSeq.delete(info.roomId); }
    else broadcast(room, { type: 'user_left', userName: info.userName });
  }
  info.roomId = null;
}

// --- WebSocket ---

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  clientInfo.set(ws, { userName: '', roomId: null });
  console.log('[ws] client connected');

  ws.on('message', (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());

      if (msg.type === 'join') {
        leaveRoom(ws);                                   // leave any previous room
        const info = clientInfo.get(ws)!;
        info.userName = msg.userName;
        info.roomId   = msg.roomId;

        if (!rooms.has(msg.roomId)) {
          rooms.set(msg.roomId, new Set());
          roomSeq.set(msg.roomId, 0);
        }
        const room = rooms.get(msg.roomId)!;
        room.add(ws);

        // tell the joiner who is already here
        const users = [...room].map((c) => clientInfo.get(c)!.userName);
        ws.send(JSON.stringify({ type: 'room_state', users } satisfies ServerMessage));

        // tell everyone else
        broadcast(room, { type: 'user_joined', userName: msg.userName }, ws);
        console.log(`[room] ${msg.userName} joined ${msg.roomId}`);
      }

      if (msg.type === 'leave') leaveRoom(ws);

      if (msg.type === 'edit') {
        const info = clientInfo.get(ws)!;
        if (!info.roomId) return;
        const room = rooms.get(info.roomId);
        if (room) {
          // seqNum will be properly assigned in the next iteration
          broadcast(room, { type: 'remote_edit', content: msg.content, userName: info.userName, opId: msg.opId, seqNum: 0 }, ws);
        }
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' } satisfies ServerMessage));
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', (code) => {
    leaveRoom(ws);
    const label = code === WS_CLOSE_CODES.NORMAL ? 'normal' : code;
    console.log(`[ws] client disconnected (${label})`);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
});
