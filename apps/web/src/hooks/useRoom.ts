'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '@dce/shared';

export type RoomStatus = 'idle' | 'connecting' | 'joined' | 'error';

export function useRoom(
  wsUrl: string,
  onRemoteEdit?: (content: string, from: string) => void,
) {
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [users,  setUsers]  = useState<string[]>([]);
  const wsRef               = useRef<WebSocket | null>(null);
  const onRemoteEditRef     = useRef(onRemoteEdit);
  onRemoteEditRef.current   = onRemoteEdit;         // keep ref fresh without re-creating join

  const join = useCallback((roomId: string, userName: string) => {
    wsRef.current?.close();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', roomId, userName } satisfies ClientMessage));
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data as string);
      if (msg.type === 'room_state')  { setUsers(msg.users); setStatus('joined'); }
      if (msg.type === 'user_joined') setUsers((prev) => [...prev, msg.userName]);
      if (msg.type === 'user_left')   setUsers((prev) => prev.filter((u) => u !== msg.userName));
      if (msg.type === 'remote_edit') onRemoteEditRef.current?.(msg.content, msg.userName);
    };

    ws.onclose = () => { setStatus('idle'); setUsers([]); };
    ws.onerror = () => setStatus('error');
  }, [wsUrl]);

  const leave = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'leave' } satisfies ClientMessage));
    wsRef.current.close();
  }, []);

  const sendEdit = useCallback((content: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'edit', content } satisfies ClientMessage));
    }
  }, []);

  useEffect(() => () => { wsRef.current?.close(); }, []);

  return { status, users, join, leave, sendEdit };
}
