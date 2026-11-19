'use client'

// The workspace's social accounts and their connection state.
// Signed in, they are rows in social_accounts (one per network for now); the connection itself is still simulated
// until the real Instagram/TikTok login exists. Without Supabase, the offline demo kept in this browser.
import { useSyncExternalStore } from 'react'
import { db, must, onRemoteError, persist, remoteMode, type WorkspaceContext } from '@/products/social/frontend/lib/sync'
import { accounts as base, type Account, type Network } from './data'

export type AccountState = Account & { status: 'conectada' | 'reconectar' | 'desconectada'; connectedAt?: string }
type Overrides = Record<string, { status: AccountState['status']; connectedAt?: string }>
export const networks: Network[] = ['instagram', 'tiktok', 'linkedin', 'youtube']

// ---------- offline demo ----------

const KEY = 'otto-social-accounts-v1'
// The TikTok session "expired" in the sample data, matching the notification about it.
const seed: Overrides = { 'ig-otto': { status: 'conectada', connectedAt: '2026-09-02' }, 'tt-otto': { status: 'reconectar', connectedAt: '2026-09-15' } }
let overrides: Overrides = seed
let loaded = false
function ensure() {
  if (loaded || typeof window === 'undefined' || remoteMode) return
  loaded = true
  try { const raw = localStorage.getItem(KEY); if (raw) overrides = JSON.parse(raw) } catch { /* seed */ }
}
const build = (o: Overrides): AccountState[] => base.map(a => {
  const s = o[a.id]
  const status = s?.status ?? (a.connected ? 'conectada' : 'desconectada')
  return { ...a, status, connected: status !== 'desconectada', connectedAt: s?.connectedAt }
})

// ---------- workspace (remote) ----------

/** A network without an account yet shows as a "not connected" card with this id. */
export const placeholderId = (n: Network) => `nova-${n}`
const placeholder = (network: Network): AccountState => ({ id: placeholderId(network), network, handle: '', name: '', connected: false, status: 'desconectada' })
let rows: AccountState[] = []
let ctx: WorkspaceContext | null = null

const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const emit = () => { cache = null; listeners.forEach(l => l()) }

let cache: AccountState[] | null = null
function snapshot(): AccountState[] {
  if (cache) return cache
  if (remoteMode) cache = networks.map(n => rows.find(r => r.network === n) ?? placeholder(n))
  else { ensure(); cache = build(overrides) }
  return cache
}
const serverList = remoteMode ? networks.map(placeholder) : build(seed)

/** Accounts with their current connection state. "reconectar" still counts as connected for choosing, with a warning. */
export const useAccounts = () => useSyncExternalStore(subscribe, snapshot, () => serverList)
/** Same list outside React (rules, previews). */
export const getAccounts = () => snapshot()

export async function connectAccounts(next: WorkspaceContext) {
  if (ctx?.ws !== next.ws) { rows = []; emit() }
  ctx = next
  await reloadAccounts()
}
export async function reloadAccounts() {
  if (!ctx) return
  const c = ctx
  const { data, error } = await db().from('social_accounts').select('id, network, handle, name, status, connected_at').eq('workspace_id', c.ws).order('created_at')
  if (error || ctx !== c) return
  rows = (data ?? []).map(r => ({ id: r.id, network: r.network, handle: r.handle, name: r.name, status: r.status, connected: r.status !== 'desconectada', connectedAt: r.connected_at?.slice(0, 10) }))
  emit()
}
if (remoteMode && typeof window !== 'undefined') onRemoteError(() => { void reloadAccounts() })

/**
 * Connects (or reconnects / disconnects) an account. In the workspace, connecting a network for the
 * first time creates its row with the handle the person typed. Returns the account's id.
 */
export function setAccountStatus(id: string, status: AccountState['status'], details?: { handle: string; name?: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const connectedAt = status === 'desconectada' ? undefined : today
  if (!remoteMode) {
    overrides = { ...(ensure(), overrides), [id]: { status, connectedAt } }
    try { localStorage.setItem(KEY, JSON.stringify(overrides)) } catch { /* storage blocked */ }
    emit()
    return id
  }
  const c = ctx
  if (!c) return id
  const existing = rows.find(r => r.id === id)
  if (existing) {
    rows = rows.map(r => r.id === id ? { ...r, status, connected: status !== 'desconectada', connectedAt, ...(details ? { handle: details.handle, name: details.name ?? r.name } : {}) } : r)
    emit()
    void persist(() => must(db().from('social_accounts').update({ status, connected_at: connectedAt ? new Date().toISOString() : null, ...(details ? { handle: details.handle, name: details.name ?? existing.name } : {}) }).eq('id', id)))
    return id
  }
  const network = networks.find(n => placeholderId(n) === id)
  if (!network || !details?.handle) return id
  const newId = crypto.randomUUID()
  rows = [...rows, { id: newId, network, handle: details.handle, name: details.name ?? '', status, connected: status !== 'desconectada', connectedAt }]
  emit()
  void persist(() => must(db().from('social_accounts').insert({ id: newId, workspace_id: c.ws, network, handle: details.handle, name: details.name ?? '', status, connected_at: new Date().toISOString() })))
  return newId
}
