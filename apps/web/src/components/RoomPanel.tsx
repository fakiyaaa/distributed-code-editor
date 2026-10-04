'use client';

import { useState } from 'react';
import type { RoomStatus } from '@/hooks/useRoom';

const statusLabel: Record<RoomStatus, string> = {
  idle:       'Not connected',
  connecting: 'Connecting…',
  joined:     'Connected',
  error:      'Connection error',
};

interface RoomPanelProps {
  status:  RoomStatus;
  users:   string[];
  onJoin:  (roomId: string, userName: string) => void;
  onLeave: () => void;
}

export default function RoomPanel({ status, users, onJoin, onLeave }: RoomPanelProps) {
  const [roomId,   setRoomId]   = useState('');
  const [userName, setUserName] = useState('');

  const handleJoin = () => {
    if (roomId.trim() && userName.trim()) onJoin(roomId.trim(), userName.trim());
  };

  return (
    <aside className="flex w-56 flex-col gap-4 border-l border-gray-700 bg-gray-800 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Room
      </h2>

      {status !== 'joined' ? (
        <div className="flex flex-col gap-2">
          <input
            className="rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            className="rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button
            className="rounded bg-blue-600 py-1 text-sm font-medium hover:bg-blue-500 disabled:opacity-40"
            onClick={handleJoin}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Joining…' : 'Join'}
          </button>
          {status === 'error' && (
            <p className="text-xs text-red-400">Could not reach server.</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-white">{roomId}</span>
            </p>
            <p className="text-xs text-green-400">{statusLabel[status]}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Users ({users.length})
            </p>
            {users.map((u) => (
              <p key={u} className="truncate text-sm text-gray-200">{u}</p>
            ))}
          </div>

          <button
            className="mt-auto rounded border border-gray-600 py-1 text-xs text-gray-400 hover:border-red-500 hover:text-red-400"
            onClick={onLeave}
          >
            Leave room
          </button>
        </>
      )}
    </aside>
  );
}
