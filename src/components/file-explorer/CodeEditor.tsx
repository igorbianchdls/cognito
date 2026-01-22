"use client";

import React from 'react';
import { Editor } from '@monaco-editor/react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
};

export default function CodeEditor({ value, onChange, language = 'typescript', height = '100%' }: Props) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: 'vs-light',
        automaticLayout: true,
        wordWrap: 'on',
        lineHeight: 22,
        fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}

