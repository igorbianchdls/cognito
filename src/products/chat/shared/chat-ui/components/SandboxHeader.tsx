"use client";

import React from 'react';
import { ChevronsLeft, ChevronsRight, ChevronDown, LayoutDashboard, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStore } from '@nanostores/react';
import SandboxTabs from './SandboxTabs';
import StatusBadge from './StatusBadge';
import HeaderActions from './HeaderActions';
import DashboardPicker from './json-render/DashboardPicker';
import { $sandboxActiveTab, sandboxActions } from '@/chat/sandbox';

type Props = {
  onClose?: () => void;
  onExpand?: () => void; // toggles expand/collapse
  expanded?: boolean;
  chatId?: string;
};

export default function SandboxHeader({ onClose, onExpand, expanded, chatId }: Props) {
  const active = useStore($sandboxActiveTab);
  const [dashboardPickerOpen, setDashboardPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (active !== 'dashboard') return;
    setDashboardPickerOpen(true);
    sandboxActions.setActiveTab('preview');
  }, [active]);

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
        <Popover open={dashboardPickerOpen} onOpenChange={setDashboardPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Selecionar dashboard"
              aria-label="Selecionar dashboard"
              className="h-8 px-2 inline-flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" />
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" side="bottom" sideOffset={8} className="w-auto p-2">
            <DashboardPicker
              chatId={chatId}
              compact
              onSelected={() => setDashboardPickerOpen(false)}
            />
          </PopoverContent>
        </Popover>
        <HeaderActions chatId={chatId} />
        {onClose && (
          <button
            type="button"
            aria-label="Fechar computador"
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
