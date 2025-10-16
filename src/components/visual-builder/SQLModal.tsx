'use client';

import { useState } from 'react';
import { X, Copy, Database } from 'lucide-react';

interface SQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlQuery: string;
  widgetTitle: string;
}

export default function SQLModal({ isOpen, onClose, sqlQuery, widgetTitle }: SQLModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">SQL Query</h2>
            <span className="text-sm text-gray-500">• {widgetTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                copied 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SQL Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-gray-950 rounded-lg p-4 overflow-auto">
            <pre className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
              {sqlQuery}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Query gerada automaticamente pelo Dashboard Supabase</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}