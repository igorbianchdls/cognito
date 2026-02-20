"use client";

import React from 'react'
import { Bell, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ChatErrorNotification } from './types'

type Props = {
  notifications: ChatErrorNotification[]
  unreadCount: number
  onMarkAllAsRead: () => void
  onClear: () => void
}

function formatSource(source: string): string {
  if (source === 'api') return 'API'
  if (source === 'sandbox') return 'Sandbox'
  if (source === 'stream') return 'Stream'
  if (source === 'tool') return 'Tool'
  if (source === 'network') return 'Rede'
  return 'Erro'
}

export default function ChatErrorNotificationsButton({ notifications, unreadCount, onMarkAllAsRead, onClear }: Props) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (unreadCount > 0) onMarkAllAsRead()
  }, [open, unreadCount, onMarkAllAsRead])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative text-gray-700 hover:text-black disabled:opacity-50"
          aria-label="Notificações de erro"
          title="Notificações de erro"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle>Notificações de Erro</DialogTitle>
              <DialogDescription>
                {notifications.length > 0
                  ? `${notifications.length} registro(s) de erro do chat`
                  : 'Nenhum erro registrado nesta conversa'}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
              disabled={notifications.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              Sem notificações de erro.
            </div>
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="rounded-md border border-gray-200 p-3 space-y-2 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                    {formatSource(item.source)}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {new Date(item.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="text-sm text-gray-900">{item.message}</div>
                {item.details ? (
                  <details className="rounded-md bg-gray-50 border border-gray-100 p-2">
                    <summary className="cursor-pointer text-xs text-gray-600">Detalhes</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-gray-600">{item.details}</pre>
                  </details>
                ) : null}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
