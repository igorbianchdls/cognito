// Saving to Supabase in the background, shared by every store (Spaces, posts, editor, notifications…).
// Pure module (no React). Writes run one after another, so an insert always lands before its update.
import { supabase, supabaseConfigured } from './supabase'

/** True when the app saves to Supabase (signed in with Clerk); false for the offline demo. */
export const remoteMode = supabaseConfigured
export type WorkspaceContext = { ws: string; user: string }
export const db = () => supabase()

type Result = PromiseLike<{ error: unknown }>
let chain: Promise<unknown> = Promise.resolve()
let pending = 0
const errorListeners = new Set<(e: unknown) => void>()
export const onRemoteError = (l: (e: unknown) => void) => { errorListeners.add(l); return () => { errorListeners.delete(l) } }
export const idle = () => pending === 0

/** Queues a write. Resolves when it is saved; on failure the listeners hear about it (stores reload). */
export function persist(run: () => Result | Promise<void>): Promise<void> {
  pending++
  const p = chain.then(async () => {
    const r = await run()
    const error = r && typeof r === 'object' && 'error' in r ? r.error : null
    if (error) throw error
  })
  chain = p.catch(() => undefined).finally(() => { pending-- })
  p.catch(e => { console.error('Editor: falha ao salvar', e); errorListeners.forEach(l => l(e)) })
  return p
}
/** Throws the Supabase error of a step inside a persist() run. */
export async function must(step: PromiseLike<{ error: unknown }>) { const { error } = await step; if (error) throw error }

/** Local "YYYY-MM-DDTHH:mm" ↔ ISO timestamps (the stores keep local strings). */
export const localStamp = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
export const toIso = (local: string) => new Date(local).toISOString()

// ---------- the active workspace ----------

let current: WorkspaceContext | null = null
let resolveReady: (c: WorkspaceContext) => void
let ready = new Promise<WorkspaceContext>(r => { resolveReady = r })
/** Called by AccountSync once the person and their active workspace are known. */
export function setWorkspace(c: WorkspaceContext) {
  if (current && current.ws !== c.ws) ready = new Promise<WorkspaceContext>(r => { resolveReady = r })
  current = c
  resolveReady(c)
}
/** The active workspace, waiting for it if the app is still loading (an early click is saved, not lost). */
export const workspaceReady = () => ready
