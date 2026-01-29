"use client";

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Undo2, Redo2, ClipboardList, GitBranch, Upload } from 'lucide-react';

function IconButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
            aria-label={title}
            title={title}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <IconButton title="Undo">
        <Undo2 className="w-4 h-4" />
      </IconButton>
      <IconButton title="Redo">
        <Redo2 className="w-4 h-4 text-gray-400" />
      </IconButton>
      <Separator orientation="vertical" className="h-5 mx-2" />
      <IconButton title="Clipboard">
        <ClipboardList className="w-4 h-4" />
      </IconButton>
      <IconButton title="Git">
        <GitBranch className="w-4 h-4" />
      </IconButton>
      <IconButton title="Upload">
        <Upload className="w-4 h-4" />
      </IconButton>
      {/* Deploy button removido */}
    </div>
  );
}
