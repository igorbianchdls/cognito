'use client';

import { Editor } from '@monaco-editor/react';
import { useState } from 'react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'json',
  height = '100%'
}: MonacoEditorProps) {
  const [isValidJson, setIsValidJson] = useState(true);

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      // Validate JSON if language is json
      if (language === 'json') {
        try {
          JSON.parse(newValue);
          setIsValidJson(true);
        } catch {
          setIsValidJson(false);
        }
      }
      onChange(newValue);
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    theme: 'vs-light',
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on' as const,
    lineHeight: 22,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
    cursorBlinking: 'smooth' as const,
    smoothScrolling: true,
    padding: { top: 16, bottom: 16 },
  };

  return (
    <div className="h-full relative">
      {/* Status Bar */}
      <div className={`absolute top-0 left-0 right-0 z-10 px-4 py-2 text-xs font-medium ${
        isValidJson
          ? 'bg-green-50 text-green-700 border-b border-green-200'
          : 'bg-red-50 text-red-700 border-b border-red-200'
      }`}>
        {isValidJson ? '✓ Valid JSON' : '✗ Invalid JSON syntax'}
      </div>

      {/* Editor */}
      <div className="h-full pt-8">
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleEditorChange}
          options={editorOptions}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                Loading editor...
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}