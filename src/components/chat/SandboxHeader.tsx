"use client";

import React from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import SandboxTabs from './SandboxTabs';
import StatusBadge from './StatusBadge';
import HeaderActions from './HeaderActions';
import { X } from 'lucide-react';

type Props = {
  onClose?: () => void;
  onExpand?: () => void; // toggles expand/collapse
  expanded?: boolean;
};

export default function SandboxHeader({ onClose, onExpand, expanded }: Props) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-1 bg-white">
      {/* Left group: chevrons + tabs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
          aria-label={expanded ? 'Collapse to split' : 'Expand'}
          onClick={onExpand}
        >
          {expanded ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </button>
        <div className="overflow-x-auto">
          <SandboxTabs />
        </div>
      </div>
      {/* Center: status badge */}
      <div className="hidden sm:block">
        <StatusBadge />
      </div>
      {/* Right: actions + deploy + close */}
      <div className="flex items-center gap-1">
        <HeaderActions />
        {onClose && (
          <button
            type="button"
            aria-label="Close sandbox"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
