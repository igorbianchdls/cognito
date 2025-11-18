'use client';

import { Editor } from '@monaco-editor/react';
import { useState } from 'react';
import type { ParseError } from './ConfigParser';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  errors?: ParseError[];
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'json',
  height = '100%',
  errors = []
}: MonacoEditorProps) {
  const [isValidJson, setIsValidJson] = useState(true);

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      // Validate JSON if language is json
      if (language === 'json') {
        const trimmed = newValue.trim();
        // If DSL (HTML-like), skip JSON validation
        if (trimmed.startsWith('<')) {
          setIsValidJson(true);
        } else {
          try {
            JSON.parse(newValue);
            setIsValidJson(true);
          } catch {
            setIsValidJson(false);
          }
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

  const hasErrors = errors.length > 0;
  const errorCount = errors.filter(e => e.type !== 'warning').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  return (
    <div className="h-full relative flex flex-col">
      {/* Status Bar */}
      <div className={`px-4 py-2 text-xs font-medium border-b ${
        !hasErrors
          ? 'bg-green-50 text-green-700 border-green-200'
          : errorCount > 0
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
      }`}>
        {!hasErrors ? '✓ Valid Configuration' :
         errorCount > 0 ? `✗ ${errorCount} error${errorCount !== 1 ? 's' : ''}${warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}` : ''}` :
         `⚠ ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
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

      {/* Error Panel */}
      {hasErrors && (
        <div className="border-t border-gray-200 bg-gray-50 max-h-32 overflow-y-auto">
          <div className="p-3 space-y-2">
            {errors.map((error, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                error.type === 'syntax' ? 'bg-red-100 text-red-800' :
                error.type === 'validation' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-gray-600">Line {error.line}:</span>
                  <span className="flex-1">{error.message}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    error.type === 'warning' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {error.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
