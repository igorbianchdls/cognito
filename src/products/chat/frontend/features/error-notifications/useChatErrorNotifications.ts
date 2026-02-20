"use client";

import { useCallback, useMemo, useState } from 'react'
import { normalizeChatError, normalizeDetails } from './normalizeError'
import type { ChatErrorNotification, PushChatErrorInput } from './types'

function nextId(): string {
  const maybeCrypto = (globalThis as any)?.crypto
  if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
    return maybeCrypto.randomUUID()
  }
  return `err-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useChatErrorNotifications() {
  const [notifications, setNotifications] = useState<ChatErrorNotification[]>([])

  const pushErrorNotification = useCallback((input: PushChatErrorInput) => {
    const normalized = normalizeChatError(input.error, input.message || 'Erro no chat')
    const explicitDetails = normalizeDetails(input.details)
    const details = explicitDetails || normalized.details

    const next: ChatErrorNotification = {
      id: nextId(),
      createdAt: new Date().toISOString(),
      source: input.source || 'unknown',
      message: normalized.message,
      details,
      read: false,
    }

    setNotifications((prev) => [next, ...prev])
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = useMemo(
    () => notifications.reduce((acc, item) => acc + (item.read ? 0 : 1), 0),
    [notifications]
  )

  return {
    notifications,
    unreadCount,
    pushErrorNotification,
    markAllAsRead,
    clearNotifications,
  }
}
