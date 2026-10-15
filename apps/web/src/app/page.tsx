'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import RoomPanel from '@/components/RoomPanel';
import { useRoom } from '@/hooks/useRoom';
import { useFaultSimulator } from '@/hooks/useFaultSimulator';

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';

const INITIAL_CODE = `// Distributed Code Editor
// Collaborative editing coming soon.

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`;

export default function Home() {
  const [code, setCode] = useState(INITIAL_CODE);
  const suppressRef     = useRef(false);

  const { status, users, join, leave, sendEdit } = useRoom(WS_URL, (content) => {
    suppressRef.current = true;
    setCode(content);
  });

  const { faultySend, config, setConfig } = useFaultSimulator(sendEdit);

  const handleEditorChange = (value: string) => {
    setCode(value);
    if (suppressRef.current) { suppressRef.current = false; return; }
    faultySend(value);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <header className="flex items-center border-b border-gray-700 px-4 py-2">
        <span className="font-mono text-sm font-semibold text-gray-200">
          Distributed Code Editor
        </span>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <CodeEditor value={code} onChange={handleEditorChange} />
        </main>
        <RoomPanel
          status={status}
          users={users}
          onJoin={join}
          onLeave={leave}
          faultConfig={config}
          onFaultChange={setConfig}
        />
      </div>
    </div>
  );
}
