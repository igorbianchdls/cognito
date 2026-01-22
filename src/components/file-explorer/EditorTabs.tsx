"use client";

import React from 'react';
import type { OpenFile } from './types';
import { X } from 'lucide-react';

type Props = {
  files: OpenFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

export default function EditorTabs({ files, activePath, onSelect, onClose }: Props) {
  if (files.length === 0) {
    return <div className="h-10 border-b px-3 flex items-center text-sm text-gray-500">No file open</div>;
  }
  return (
    <div className="h-10 border-b overflow-x-auto">
      <div className="flex items-stretch h-full">
        {files.map((f) => {
          const isActive = f.path === activePath;
          return (
            <div
              key={f.path}
              className={`flex items-center gap-2 px-3 cursor-pointer border-r text-sm ${
                isActive ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => onSelect(f.path)}
            >
              <span className="truncate max-w-[220px]">{f.name}</span>
              {f.dirty && <span className="text-gray-400">•</span>}
              <button
                className="ml-1 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-200"
                onClick={(e) => { e.stopPropagation(); onClose(f.path); }}
                aria-label={`Close ${f.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

