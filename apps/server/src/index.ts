import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { WS_CLOSE_CODES } from '@dce/shared';
import type { WsMessage } from '@dce/shared';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('[ws] client connected');

  ws.on('message', (data) => {
    try {
      const msg: WsMessage = JSON.parse(data.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' } satisfies WsMessage));
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', (code) => {
    const label = code === WS_CLOSE_CODES.NORMAL ? 'normal' : code;
    console.log(`[ws] client disconnected (${label})`);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
});
