'use client'

// The editor's projects and saved versions.
// Signed in, they are rows in editor.projects / editor.project_versions (the whole project goes in `data`), saved a moment
// after each change. Without Supabase, the offline demo in this browser, with the sample projects.
import { useSyncExternalStore } from 'react'
import { db, localStamp as fromIso, must, persist, remoteMode, type WorkspaceContext } from '@/products/editor/frontend/lib/sync'
import { sampleProjects } from './data'
import { localStamp, type Project } from './types'

export const STORAGE_KEY = 'otto-editor-editor-v1'
const VERSIONS_KEY = 'otto-editor-editor-versions-v1'
const VERSION_LIMIT = 20
export type Version = { at: string; label: string; project: Project }

/** New project ids: rows in the workspace need a uuid. */
export const newProjectId = () => remoteMode ? crypto.randomUUID() : `p-${Date.now().toString(36)}`

// ---------- offline demo ----------

export function readSaved(): Record<string, Project> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}
const readVersions = (): Record<string, Version[]> => { try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? '{}') } catch { return {} } }
const localList = () => {
  const saved = readSaved()
  return [...Object.values(saved).filter(p => !sampleProjects.some(x => x.id === p.id)), ...sampleProjects.map(p => saved[p.id] ?? p)]
}

// ---------- list shared by the projects page and the search ----------

const byDate = (list: Project[]) => [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
let projects: Project[] = remoteMode ? [] : sampleProjects
let loaded = false
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const setList = (list: Project[]) => { projects = byDate(list); listeners.forEach(l => l()) }
function snapshot() {
  if (!loaded && !remoteMode && typeof window !== 'undefined') { loaded = true; projects = byDate(localList()) }
  return projects
}
const serverList = remoteMode ? [] : sampleProjects
export const useProjects = () => useSyncExternalStore(subscribe, snapshot, () => serverList)
export const getProjectList = () => snapshot()

// ---------- workspace (remote) ----------

let ctx: WorkspaceContext | null = null
let ready: () => void
let connected = new Promise<void>(r => { ready = r })
const toProject = (r: { id: string; name: string; data: Project; updated_at: string }): Project => ({ ...r.data, id: r.id, name: r.name, updatedAt: r.data.updatedAt ?? fromIso(r.updated_at) })

export async function connectEditor(next: WorkspaceContext) {
  if (ctx && ctx.ws !== next.ws) { setList([]); connected = new Promise<void>(r => { ready = r }) }
  ctx = next
  ready()
  const { data, error } = await db().from('projects').select('id, name, data, updated_at').eq('workspace_id', next.ws).order('updated_at', { ascending: false })
  if (!error && ctx === next) setList((data ?? []).map(toProject))
}
const uuidish = (id: string) => /^[0-9a-f-]{36}$/i.test(id)

/** The saved copy of a project, if there is one. */
export async function loadProject(id: string): Promise<Project | undefined> {
  if (!remoteMode) return readSaved()[id]
  if (!uuidish(id)) return undefined
  await connected
  const { data } = await db().from('projects').select('id, name, data, updated_at').eq('id', id).maybeSingle()
  return data ? toProject(data) : undefined
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()
/** Saves the project: at once in this browser, a moment after the last change in the workspace. */
export function storeProject(p: Project) {
  if (!remoteMode) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), [p.id]: p })) } catch { /* storage blocked */ }
    if (loaded) setList([...projects.filter(x => x.id !== p.id), p])
    return
  }
  if (!ctx || !uuidish(p.id)) return
  setList([...projects.filter(x => x.id !== p.id), p])
  clearTimeout(timers.get(p.id))
  const c = ctx
  timers.set(p.id, setTimeout(() => {
    timers.delete(p.id)
    void persist(() => must(db().from('projects').upsert({ id: p.id, workspace_id: c.ws, name: p.name, format: p.format, data: p, updated_at: new Date().toISOString() })))
  }, 800))
}

export function deleteProject(id: string) {
  setList(projects.filter(p => p.id !== id))
  if (!remoteMode) { const all = readSaved(); delete all[id]; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)) } catch { /* blocked */ } return }
  clearTimeout(timers.get(id))
  void persist(() => must(db().from('projects').delete().eq('id', id)))
}

// ---------- versions ----------

export async function listVersions(id: string): Promise<Version[]> {
  if (!remoteMode) return readVersions()[id] ?? []
  if (!uuidish(id)) return []
  const { data } = await db().from('project_versions').select('label, data, created_at').eq('project_id', id).order('created_at', { ascending: false }).limit(VERSION_LIMIT)
  return (data ?? []).map(v => ({ at: fromIso(v.created_at), label: v.label, project: v.data as Project }))
}

export async function saveVersion(p: Project, label: string): Promise<Version[]> {
  const v: Version = { at: localStamp(), label, project: p }
  if (!remoteMode) {
    const all = readVersions()
    const list = [v, ...(all[p.id] ?? [])].slice(0, VERSION_LIMIT)
    try { localStorage.setItem(VERSIONS_KEY, JSON.stringify({ ...all, [p.id]: list })) } catch { /* storage full or blocked */ }
    return list
  }
  if (!ctx || !uuidish(p.id)) return [v]
  const c = ctx
  // The project row must exist before its version (a new project may still be waiting for its first save).
  clearTimeout(timers.get(p.id)); timers.delete(p.id)
  await persist(async () => {
    await must(db().from('projects').upsert({ id: p.id, workspace_id: c.ws, name: p.name, format: p.format, data: p, updated_at: new Date().toISOString() }))
    await must(db().from('project_versions').insert({ project_id: p.id, workspace_id: c.ws, label, data: p }))
  })
  return listVersions(p.id)
}
