"use client";

import React from 'react';
import {
  IconChartBar,
  IconDots,
  IconFilePlus,
  IconPlayerPlay,
  IconSquareRounded,
} from '@tabler/icons-react';
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
    status === 'error' ? 'Erro' :
    'Off';

  const tone =
    status === 'running' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
    status === 'starting' || status === 'resuming' ? 'border-amber-200 bg-amber-50 text-amber-700' :
    status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' :
    'border-gray-200 bg-gray-50 text-gray-600';

  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${tone}`}>
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
    <div className="ui-text flex h-[44px] w-full items-center justify-between bg-white px-3">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <h1 className="truncate text-[13px] font-semibold leading-none text-gray-900">{title}</h1>
        <SandboxStatusBadge status={sandboxStatus} />
      </div>
      <div className="flex items-center gap-2">
        <ChatErrorNotificationsButton
          notifications={errorNotifications}
          unreadCount={errorNotificationsUnread}
          onMarkAllAsRead={onMarkAllErrorNotificationsRead || (() => {})}
          onClear={onClearErrorNotifications || (() => {})}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="text-gray-700 hover:text-black disabled:opacity-50" disabled={busy} aria-label="Ações do chat">
              <IconDots className="h-4 w-4" stroke={1.75} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handle(onStartSandbox, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
              <IconPlayerPlay className="mr-2 h-4 w-4" stroke={1.75} /> Iniciar computador
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handle(onStopSandbox, !busy && hasSandbox)} className={!hasSandbox || busy ? 'pointer-events-none opacity-50' : ''}>
              <IconSquareRounded className="mr-2 h-4 w-4" stroke={1.75} /> Fechar computador
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handle(onOpenArtifact, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
              <IconChartBar className="mr-2 h-4 w-4" stroke={1.75} /> Abrir Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handle(onWriteFiles, !busy)} className={busy ? 'pointer-events-none opacity-50' : ''}>
              <IconFilePlus className="mr-2 h-4 w-4" stroke={1.75} /> Arquivos no Computador
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
