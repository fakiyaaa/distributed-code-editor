'use client';

import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'typescript',
}: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2,
      }}
    />
  );
}
