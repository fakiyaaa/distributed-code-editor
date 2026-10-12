'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, RemoteEditMessage, ServerMessage } from '@dce/shared';

export type RoomStatus = 'idle' | 'connecting' | 'joined' | 'error';

export function useRoom(
  wsUrl: string,
  onRemoteEdit?: (content: string, from: string) => void,
) {
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [users,  setUsers]  = useState<string[]>([]);
  const wsRef               = useRef<WebSocket | null>(null);
  const onRemoteEditRef     = useRef(onRemoteEdit);
  onRemoteEditRef.current   = onRemoteEdit;

  // out-of-order buffering
  const lastAppliedSeq = useRef<number>(0);
  const buffer         = useRef<Map<number, RemoteEditMessage>>(new Map());

  const applyOp = useCallback((op: RemoteEditMessage) => {
    lastAppliedSeq.current = op.seqNum;
    onRemoteEditRef.current?.(op.content, op.userName);
  }, []);

  const flushBuffer = useCallback(() => {
    // apply any buffered ops that are now in order
    let next = lastAppliedSeq.current + 1;
    while (buffer.current.has(next)) {
      applyOp(buffer.current.get(next)!);
      buffer.current.delete(next);
      next = lastAppliedSeq.current + 1;
    }
  }, [applyOp]);

  const handleRemoteEdit = useCallback((op: RemoteEditMessage) => {
    if (op.seqNum <= lastAppliedSeq.current) return;          // duplicate — ignore

    if (op.seqNum === lastAppliedSeq.current + 1) {
      applyOp(op);
      flushBuffer();
    } else {
      buffer.current.set(op.seqNum, op);                      // gap — hold until in order
    }
  }, [applyOp, flushBuffer]);

  const join = useCallback((roomId: string, userName: string) => {
    wsRef.current?.close();
    buffer.current.clear();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', roomId, userName } satisfies ClientMessage));
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data as string);

      if (msg.type === 'room_state') {
        lastAppliedSeq.current = msg.seqNum;   // sync to room's current position
        setUsers(msg.users);
        setStatus('joined');
      }
      if (msg.type === 'user_joined') setUsers((prev) => [...prev, msg.userName]);
      if (msg.type === 'user_left')   setUsers((prev) => prev.filter((u) => u !== msg.userName));
      if (msg.type === 'remote_edit') handleRemoteEdit(msg);
    };

    ws.onclose = () => { setStatus('idle'); setUsers([]); buffer.current.clear(); };
    ws.onerror = () => setStatus('error');
  }, [wsUrl, handleRemoteEdit]);

  const leave = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'leave' } satisfies ClientMessage));
    wsRef.current.close();
  }, []);

  const sendEdit = useCallback((content: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      const opId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      ws.send(JSON.stringify({ type: 'edit', content, opId } satisfies ClientMessage));
    }
  }, []);

  useEffect(() => () => { wsRef.current?.close(); }, []);

  return { status, users, join, leave, sendEdit };
}
