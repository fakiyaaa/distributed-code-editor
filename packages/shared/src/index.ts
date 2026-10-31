// Message protocol for the distributed code editor.
// Both apps/server and apps/web import from here — changing a type
// will surface type errors in both places immediately.

// Placeholder interfaces for future persistence / user accounts
export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  createdAt: string;
}

// Heartbeat — used to keep the connection alive
export type WsMessageType = 'ping' | 'pong';
export interface WsMessage { type: WsMessageType }

// ---- Client → Server ------------------------------------------------

export interface JoinMessage {
  type: 'join';
  roomId: string;
  userName: string;
}

export interface LeaveMessage { type: 'leave' }

export interface EditMessage {
  type: 'edit';
  content: string;  // full document snapshot (not a diff)
  opId: string;     // client-generated ID, used for duplicate detection
}

// Discriminated union — narrow with msg.type === '...'
export type ClientMessage = JoinMessage | LeaveMessage | EditMessage | WsMessage;

// ---- Server → Client ------------------------------------------------

export interface RoomStateMessage {
  type: 'room_state';
  users: string[];  // everyone currently in the room, including the joiner
  seqNum: number;   // current sequence position — client starts its buffer here
}

export interface UserJoinedMessage { type: 'user_joined'; userName: string }
export interface UserLeftMessage   { type: 'user_left';   userName: string }

export interface RemoteEditMessage {
  type: 'remote_edit';
  content: string;   // full document snapshot from the sending client
  userName: string;  // who sent it
  opId: string;      // matches the originating EditMessage
  seqNum: number;    // server-assigned, monotonically increasing per room
}

export type ServerMessage =
  | RoomStateMessage
  | UserJoinedMessage
  | UserLeftMessage
  | RemoteEditMessage
  | WsMessage;
