// Shared types for the distributed code editor.
// Expand these as features are added.

export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export type WsMessageType = 'ping' | 'pong';

export interface WsMessage {
  type: WsMessageType;
}

/** Runtime constant — also verifies @dce/shared resolves at runtime in compiled server. */
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
} as const;
