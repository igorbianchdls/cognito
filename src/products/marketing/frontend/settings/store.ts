'use client'

// User and workspace preferences. Kept in this browser as a cache; signed in, AccountSync loads them from the
// database (profiles, workspaces, user_settings) and saves every change back.
import { useSyncExternalStore } from 'react'
import { remoteMode } from '@/products/marketing/frontend/lib/sync'
import type { NotificationKind } from '../notifications/data'
import type { PostFormat } from '../posts/data'

export type Theme = 'claro' | 'escuro' | 'sistema'
export type Settings = {
  profile: { name: string; role: string; color: string }
  workspace: { name: string; timezone: string; language: string }
  appearance: { theme: Theme; compact: boolean }
  notifications: { kinds: Record<NotificationKind, boolean>; email: boolean; push: boolean; daily: boolean; quietFrom: string; quietTo: string }
  posting: { accountIds: string[]; format: PostFormat; time: string; confirm: boolean; hashtags: string }
}

export const defaults: Settings = {
  profile: { name: 'Igor', role: 'Fundador', color: '#1c1915' },
  workspace: { name: 'Otto ERP', timezone: 'America/Sao_Paulo', language: 'pt-BR' },
  appearance: { theme: 'claro', compact: false },
  notifications: {
    kinds: { publicado: true, erro: true, comentario: true, agendado: true, armazenamento: true, conta: true, plugin: true, arquivos: false },
    email: false, push: true, daily: true, quietFrom: '22:00', quietTo: '07:00',
  },
  posting: { accountIds: remoteMode ? [] : ['ig-otto'], format: 'reel', time: '19:00', confirm: true, hashtags: '' },
}

const KEY = 'otto-social-settings-v1'
let state: Settings = defaults
let loaded = false
const listeners = new Set<() => void>()

function ensure() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Settings>
      // Merge section by section so settings added later get their defaults.
      state = { ...defaults, ...Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, { ...defaults[k as keyof Settings], ...(v as object) }])) } as Settings
    }
  } catch { /* defaults */ }
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getSettings = () => { ensure(); return state }
export const useSettings = () => useSyncExternalStore(subscribe, getSettings, () => defaults)

type RemoteSaver = <K extends keyof Settings>(section: K, value: Settings[K]) => void
let remote: RemoteSaver | null = null
/** Signed in, the profile and workspace sections are also saved to the database (see AccountSync). */
export function setRemoteSaver(fn: RemoteSaver | null) { remote = fn }

export function updateSettings<K extends keyof Settings>(section: K, patch: Partial<Settings[K]>, opts: { fromServer?: boolean } = {}) {
  state = { ...getSettings(), [section]: { ...getSettings()[section], ...patch } }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage blocked */ }
  listeners.forEach(l => l())
  if (!opts.fromServer) remote?.(section, state[section])
}
export function resetSettings() {
  state = defaults
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
  listeners.forEach(l => l())
}

/** Sections saved per person in user_settings.data (profile and workspace have their own tables). */
export const PERSONAL_SECTIONS = ['appearance', 'notifications', 'posting'] as const

/** Every key the app keeps in this browser, for backup and reset. */
