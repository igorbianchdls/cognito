"use client";

import React from 'react';
import CodeEditor from './CodeEditor';

type Props = {
  value: string;
  onChange: (value: string) => void;
  language: string;
  path: string;
};

export default function EditorPane({ value, onChange, language, path }: Props) {
  return (
    <div className="h-full grid grid-rows-[auto_1fr] min-h-0">
      <div className="h-9 flex items-center text-xs text-gray-500 px-3 border-b bg-gray-50">
        {path}
      </div>
      <div className="min-h-0">
        <CodeEditor value={value} onChange={onChange} language={language} />
      </div>
    </div>
  );
}

