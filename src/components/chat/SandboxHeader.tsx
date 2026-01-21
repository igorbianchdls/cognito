"use client";

import React from 'react';
import { ChevronsRight } from 'lucide-react';
import SandboxTabs from './SandboxTabs';
import StatusBadge from './StatusBadge';
import HeaderActions from './HeaderActions';

export default function SandboxHeader() {
  return (
    <div className="flex items-center justify-between border-b px-3 py-3 bg-white">
      {/* Left group: chevrons + tabs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
          aria-label="Toggle"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
        <div className="overflow-x-auto">
          <SandboxTabs />
        </div>
      </div>
      {/* Center: status badge */}
      <div className="hidden sm:block">
        <StatusBadge />
      </div>
      {/* Right: actions + deploy */}
      <HeaderActions />
    </div>
  );
}
