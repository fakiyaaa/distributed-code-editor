# Distributed Collaborative Code Editor

A real-time collaborative coding platform where multiple users can join a shared room and edit the same document simultaneously. Built to explore the distributed systems challenges that arise when multiple clients maintain replicas of shared state — specifically how concurrent operations are ordered, how out-of-order delivery is handled, and how the system behaves when the network misbehaves.

---

## How to run it

**Requirements:** Node.js 18+, npm 9+

```bash
# 1. Clone and install
git clone https://github.com/fakiyaaa/distributed-code-editor.git
cd distributed-code-editor
npm install

# 2. Start both apps (builds shared types first, then starts server + frontend)
npm run dev
```

- Frontend: http://localhost:3000
- Server: http://localhost:3001
- Health check: http://localhost:3001/health

To run them separately:

```bash
npm run dev -w apps/server   # terminal 1
npm run dev -w apps/web      # terminal 2
```

---

## How to use it

1. Open http://localhost:3000 in two or more browser tabs
2. Enter the same **Room ID** and different names in each tab, then click Join
3. Type in any tab — changes propagate to all others in real time
4. Open the **Network faults** panel at the bottom of the sidebar to simulate network conditions per client

### Network fault simulator

Each tab has independent fault controls:

| Setting | Range | Effect |
|---|---|---|
| Latency | 0–2000ms | Delays outgoing messages by a fixed amount |
| Drop rate | 0–90% | Randomly drops outgoing messages |
| Duplicate rate | 0–30% | Randomly sends a message twice |

To see out-of-order buffering in action: set latency to 500ms in one tab and type quickly while another user types at the same time. Both editors will eventually converge to the same content.

---

## Project structure

```
distributed-code-editor/
├── apps/
│   ├── web/          # Next.js 15 frontend (Monaco editor, room UI, fault simulator)
│   └── server/       # Node.js + Express + WebSocket server
└── packages/
    └── shared/       # Shared TypeScript types (message protocols)
```

### Key files

| File | What it does |
|---|---|
| `apps/server/src/index.ts` | WebSocket server, room state, sequence counter, op log |
| `apps/web/src/hooks/useRoom.ts` | WebSocket client, out-of-order buffer, sequence tracking |
| `apps/web/src/hooks/useFaultSimulator.ts` | Injects latency, drops, and duplicates into outgoing messages |
| `apps/web/src/components/FaultSimulator.tsx` | UI sliders for fault configuration |
| `packages/shared/src/index.ts` | Message type definitions shared between client and server |

---

## What's implemented

**Real-time sync**
Edits are broadcast as operations over WebSockets to all clients in the same room. Each client maintains a local replica of the document.

**Operation ordering**
The server assigns a monotonically increasing sequence number to every edit. Clients apply operations in sequence order only — if op #5 arrives before op #4, it is held in a buffer until #4 arrives, then both are applied in order.

**Duplicate detection**
Operations with a sequence number already applied are silently discarded. This handles the duplicate delivery fault mode without corrupting the document.

**Operation log**
The server keeps the last 100 operations per room in memory. When a client joins a room, it receives the current sequence number so it knows where the room's history stands.

**Network fault simulation**
Each client can independently simulate latency, message loss, and duplicate delivery to test how the system behaves under degraded network conditions.

---

## Known limitations

- **Last-write-wins:** two users editing the same line simultaneously will lose one change. CRDT-based conflict resolution is the next planned iteration.
- **No server fault tolerance yet:** if the server crashes, clients lose session state. An offline buffer + reconnection protocol is planned.
- **In-memory only:** room state does not persist across server restarts.

---

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Monaco Editor, Tailwind CSS
- **Server:** Node.js, Express, ws (WebSockets), TypeScript
- **Monorepo:** npm workspaces
