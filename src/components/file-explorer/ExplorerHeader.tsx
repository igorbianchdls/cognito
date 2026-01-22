"use client";

import React from 'react';
import { FilePlus, FolderPlus, RefreshCw } from 'lucide-react';

export default function ExplorerHeader() {
  return (
    <div className="flex items-center justify-between h-10 px-2">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">File Expl.</div>
      <div className="flex items-center gap-1">
        <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-700" title="New File">
          <FilePlus className="w-4 h-4" />
        </button>
        <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-700" title="New Folder">
          <FolderPlus className="w-4 h-4" />
        </button>
        <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-700" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

