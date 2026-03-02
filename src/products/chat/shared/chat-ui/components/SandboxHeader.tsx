"use client";

import React from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import SandboxTabs from './SandboxTabs';
import StatusBadge from './StatusBadge';
import HeaderActions from './HeaderActions';
import { X } from 'lucide-react';
import { readPreviewDebugFlags } from '@/products/chat/shared/chat-ui/components/json-render/previewDebug';

type Props = {
  onClose?: () => void;
  onExpand?: () => void; // toggles expand/collapse
  expanded?: boolean;
  chatId?: string;
};

export default function SandboxHeader({ onClose, onExpand, expanded, chatId }: Props) {
  const [disableHeaderActions, setDisableHeaderActions] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const flags = readPreviewDebugFlags();
      setDisableHeaderActions(Boolean(flags.disableHeaderActions));
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

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
          <SandboxTabs chatId={chatId} />
        </div>
      </div>
      {/* Center: status badge */}
      <div className="hidden sm:block">
        <StatusBadge />
      </div>
      {/* Right: actions + deploy + close */}
      <div className="flex items-center gap-1">
        {!disableHeaderActions && <HeaderActions chatId={chatId} />}
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
