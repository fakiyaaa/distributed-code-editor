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

// Client → Server
export interface JoinMessage { type: 'join'; roomId: string; userName: string }
export interface LeaveMessage { type: 'leave' }
export interface EditMessage  { type: 'edit'; content: string }
export type ClientMessage = JoinMessage | LeaveMessage | EditMessage | WsMessage;

// Server → Client
export interface RoomStateMessage  { type: 'room_state';   users: string[] }
export interface UserJoinedMessage { type: 'user_joined';  userName: string }
export interface UserLeftMessage   { type: 'user_left';    userName: string }
export interface RemoteEditMessage { type: 'remote_edit';  content: string; userName: string }
export type ServerMessage = RoomStateMessage | UserJoinedMessage | UserLeftMessage | RemoteEditMessage | WsMessage;

/** Runtime constant — also verifies @dce/shared resolves at runtime in compiled server. */
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
} as const;
