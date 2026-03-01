"use client"

import * as React from 'react'

type UseSandboxAutoSnapshotParams = {
  chatId?: string | null
  enabled?: boolean
  debounceMs?: number
  cooldownMs?: number
  onError?: (error: unknown) => void
}

type UseSandboxAutoSnapshotResult = {
  scheduleAutoSnapshot: (reason?: string) => void
  flushAutoSnapshot: (reason?: string) => Promise<void>
  autoSnapshotSaving: boolean
  autoSnapshotStatus: string | null
}

export function useSandboxAutoSnapshot({
  chatId,
  enabled = true,
  debounceMs = 1200,
  cooldownMs = 15000,
  onError,
}: UseSandboxAutoSnapshotParams): UseSandboxAutoSnapshotResult {
  const [autoSnapshotSaving, setAutoSnapshotSaving] = React.useState(false)
  const [autoSnapshotStatus, setAutoSnapshotStatus] = React.useState<string | null>(null)

  const timerRef = React.useRef<number | null>(null)
  const statusTimerRef = React.useRef<number | null>(null)
  const inFlightRef = React.useRef(false)
  const pendingRef = React.useRef(false)
  const lastSavedAtRef = React.useRef(0)
  const mountedRef = React.useRef(true)
  const chatIdRef = React.useRef<string | null>(chatId ?? null)

  const clearScheduleTimer = React.useCallback(() => {
    if (timerRef.current != null && typeof window !== 'undefined') {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearStatusTimer = React.useCallback(() => {
    if (statusTimerRef.current != null && typeof window !== 'undefined') {
      window.clearTimeout(statusTimerRef.current)
      statusTimerRef.current = null
    }
  }, [])

  const safeSetStatus = React.useCallback(
    (next: string | null, clearAfterMs?: number) => {
      if (!mountedRef.current) return
      setAutoSnapshotStatus(next)
      clearStatusTimer()
      if (next && clearAfterMs && clearAfterMs > 0 && typeof window !== 'undefined') {
        statusTimerRef.current = window.setTimeout(() => {
          if (!mountedRef.current) return
          setAutoSnapshotStatus((curr) => (curr === next ? null : curr))
        }, clearAfterMs)
      }
    },
    [clearStatusTimer]
  )

  const runSnapshotNow = React.useCallback(
    async (reason = 'auto'): Promise<void> => {
      const currentChatId = chatIdRef.current
      if (!enabled || !currentChatId) return

      if (inFlightRef.current) {
        pendingRef.current = true
        return
      }

      const elapsed = Date.now() - lastSavedAtRef.current
      if (elapsed < cooldownMs) {
        pendingRef.current = true
        const wait = Math.max(300, cooldownMs - elapsed)
        clearScheduleTimer()
        if (typeof window !== 'undefined') {
          timerRef.current = window.setTimeout(() => {
            void runSnapshotNow(`${reason}:cooldown`)
          }, wait)
        }
        return
      }

      inFlightRef.current = true
      pendingRef.current = false
      if (mountedRef.current) {
        setAutoSnapshotSaving(true)
        safeSetStatus('Autosalvando snapshot...')
      }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'chat-snapshot', chatId: currentChatId, reason }),
        })
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || 'Falha no autosave de snapshot')
        }
        lastSavedAtRef.current = Date.now()
        safeSetStatus('Auto snapshot salvo', 1800)
      } catch (error) {
        safeSetStatus(error instanceof Error ? error.message : 'Falha no autosave de snapshot', 3000)
        onError?.(error)
      } finally {
        inFlightRef.current = false
        if (mountedRef.current) setAutoSnapshotSaving(false)
        if (pendingRef.current) {
          pendingRef.current = false
          if (typeof window !== 'undefined') {
            timerRef.current = window.setTimeout(() => {
              void runSnapshotNow('pending')
            }, debounceMs)
          }
        }
      }
    },
    [cooldownMs, debounceMs, enabled, onError, clearScheduleTimer, safeSetStatus]
  )

  const scheduleAutoSnapshot = React.useCallback(
    (_reason = 'change') => {
      if (!enabled || !chatIdRef.current) return
      pendingRef.current = true
      clearScheduleTimer()
      if (typeof window !== 'undefined') {
        timerRef.current = window.setTimeout(() => {
          void runSnapshotNow('debounced')
        }, debounceMs)
      }
    },
    [debounceMs, enabled, clearScheduleTimer, runSnapshotNow]
  )

  const flushAutoSnapshot = React.useCallback(
    async (reason = 'flush') => {
      if (!enabled || !chatIdRef.current) return
      clearScheduleTimer()
      pendingRef.current = false
      await runSnapshotNow(reason)
    },
    [enabled, clearScheduleTimer, runSnapshotNow]
  )

  React.useEffect(() => {
    chatIdRef.current = chatId ?? null
  }, [chatId])

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearScheduleTimer()
      clearStatusTimer()
    }
  }, [clearScheduleTimer, clearStatusTimer])

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const onPreviewRefresh = () => {
      scheduleAutoSnapshot('preview-refresh')
    }

    const onAutoSaveHint = () => {
      scheduleAutoSnapshot('hint')
    }

    const onPageHide = () => {
      void flushAutoSnapshot('pagehide')
    }

    window.addEventListener('sandbox-preview-refresh', onPreviewRefresh)
    window.addEventListener('sandbox-autosave-hint', onAutoSaveHint)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.removeEventListener('sandbox-preview-refresh', onPreviewRefresh)
      window.removeEventListener('sandbox-autosave-hint', onAutoSaveHint)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [enabled, flushAutoSnapshot, scheduleAutoSnapshot])

  return {
    scheduleAutoSnapshot,
    flushAutoSnapshot,
    autoSnapshotSaving,
    autoSnapshotStatus,
  }
}
