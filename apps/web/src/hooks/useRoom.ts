'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '@dce/shared';

export type RoomStatus = 'idle' | 'connecting' | 'joined' | 'error';

export function useRoom(wsUrl: string) {
  const [status, setStatus]   = useState<RoomStatus>('idle');
  const [users,  setUsers]    = useState<string[]>([]);
  const wsRef                 = useRef<WebSocket | null>(null);

  const join = useCallback((roomId: string, userName: string) => {
    wsRef.current?.close();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      const msg: ClientMessage = { type: 'join', roomId, userName };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data as string);
      if (msg.type === 'room_state') { setUsers(msg.users); setStatus('joined'); }
      if (msg.type === 'user_joined') setUsers((prev) => [...prev, msg.userName]);
      if (msg.type === 'user_left')   setUsers((prev) => prev.filter((u) => u !== msg.userName));
    };

    ws.onclose = () => { setStatus('idle'); setUsers([]); };
    ws.onerror = () => setStatus('error');
  }, [wsUrl]);

  const leave = useCallback(() => {
    if (!wsRef.current) return;
    const msg: ClientMessage = { type: 'leave' };
    wsRef.current.send(JSON.stringify(msg));
    wsRef.current.close();
  }, []);

  // clean up on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  return { status, users, join, leave };
}
