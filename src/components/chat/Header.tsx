"use client";

import React from 'react';
import { MoreHorizontal, Lock, Play, Square, FilePlus2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type HeaderProps = {
  title?: string;
  privacy?: 'Private' | 'Public' | string;
  onStartSandbox?: () => Promise<void> | void;
  onStopSandbox?: () => Promise<void> | void;
  onWriteFiles?: () => Promise<void> | void;
  busy?: boolean;
  hasSandbox?: boolean;
};

export default function Header({ title = 'App from Mockup', privacy = 'Private', onStartSandbox, onStopSandbox, onWriteFiles, busy = false, hasSandbox = false }: HeaderProps) {
  const handle = (fn?: () => Promise<void> | void, enabled = true) => async () => {
    if (!enabled || typeof fn !== 'function') return;
    try { await fn() } catch { /* noop */ }
  };

  return (
    <div className="ui-text flex items-center justify-between px-[var(--ui-pad-x)] py-[var(--ui-pad-y)] bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <h1 className="text-[16px] font-semibold text-gray-900 truncate">{title}</h1>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 bg-white">
          <Lock className="w-3.5 h-3.5" />
          {privacy}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="text-gray-700 hover:text-black disabled:opacity-50" disabled={busy} aria-label="Ações do chat">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handle(onStartSandbox, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
            <Play className="w-4 h-4 mr-2" /> Iniciar sandbox
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handle(onStopSandbox, !busy && hasSandbox)} className={!hasSandbox || busy ? 'pointer-events-none opacity-50' : ''}>
            <Square className="w-4 h-4 mr-2" /> Fechar sandbox
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handle(onWriteFiles, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
            <FilePlus2 className="w-4 h-4 mr-2" /> Arquivos na Sandbox
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
