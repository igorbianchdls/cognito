"use client";

import React from 'react';
import { MoreHorizontal, Play, Square, FilePlus2, BarChart3 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { SandboxStatus } from '@/chat/sandbox';
import ChatErrorNotificationsButton from '@/products/chat/frontend/features/error-notifications/ChatErrorNotificationsButton';
import type { ChatErrorNotification } from '@/products/chat/frontend/features/error-notifications/types';

function SandboxStatusBadge({ status }: { status: SandboxStatus }) {
  const label =
    status === 'running' ? 'Rodando' :
    status === 'starting' ? 'Iniciando' :
    status === 'resuming' ? 'Retomando' :
    status === 'stopped' ? 'Parado' :
    status === 'error' ? 'Erro' :
    'Off';

  const tone =
    status === 'running' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
    status === 'starting' || status === 'resuming' ? 'border-amber-200 bg-amber-50 text-amber-700' :
    status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' :
    'border-gray-200 bg-gray-50 text-gray-600';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

type HeaderProps = {
  title?: string;
  onStartSandbox?: () => Promise<void> | void;
  onStopSandbox?: () => Promise<void> | void;
  onWriteFiles?: () => Promise<void> | void;
  onOpenArtifact?: () => Promise<void> | void;
  busy?: boolean;
  hasSandbox?: boolean;
  sandboxStatus?: SandboxStatus;
  errorNotifications?: ChatErrorNotification[];
  errorNotificationsUnread?: number;
  onMarkAllErrorNotificationsRead?: () => void;
  onClearErrorNotifications?: () => void;
};

export default function Header({
  title = 'App from Mockup',
  onStartSandbox,
  onStopSandbox,
  onWriteFiles,
  onOpenArtifact,
  busy = false,
  hasSandbox = false,
  sandboxStatus = 'off',
  errorNotifications = [],
  errorNotificationsUnread = 0,
  onMarkAllErrorNotificationsRead,
  onClearErrorNotifications,
}: HeaderProps) {
  const handle = (fn?: () => Promise<void> | void, enabled = true) => async () => {
    if (!enabled || typeof fn !== 'function') return;
    try { await fn() } catch { /* noop */ }
  };

  return (
    <div className="ui-text flex items-center justify-between px-[var(--ui-pad-x)] py-[var(--ui-pad-y)] bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <h1 className="text-[16px] font-semibold text-gray-900 truncate">{title}</h1>
        <SandboxStatusBadge status={sandboxStatus} />
      </div>
      <div className="flex items-center gap-3">
        <ChatErrorNotificationsButton
          notifications={errorNotifications}
          unreadCount={errorNotificationsUnread}
          onMarkAllAsRead={onMarkAllErrorNotificationsRead || (() => {})}
          onClear={onClearErrorNotifications || (() => {})}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="text-gray-700 hover:text-black disabled:opacity-50" disabled={busy} aria-label="Ações do chat">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handle(onStartSandbox, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
              <Play className="w-4 h-4 mr-2" /> Iniciar computador
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handle(onStopSandbox, !busy && hasSandbox)} className={!hasSandbox || busy ? 'pointer-events-none opacity-50' : ''}>
              <Square className="w-4 h-4 mr-2" /> Fechar computador
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handle(onOpenArtifact, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
              <BarChart3 className="w-4 h-4 mr-2" /> Abrir Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handle(onWriteFiles, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
              <FilePlus2 className="w-4 h-4 mr-2" /> Arquivos no Computador
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
