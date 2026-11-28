'use client'

// The editor's projects and saved versions.
// Signed in, they are rows in editor.projects / editor.project_versions (the whole project goes in `data`), saved a moment
// after each change. Without Supabase, the offline demo in this browser, with the sample projects.
import { useSyncExternalStore } from 'react'
import { db, idle, localStamp as fromIso, must, persist, remoteMode, type WorkspaceContext } from '@/products/editor/frontend/lib/sync'
import { sampleProjects } from './data'
import { localStamp, type Project } from './types'

export const STORAGE_KEY = 'otto-editor-editor-v1'
const VERSIONS_KEY = 'otto-editor-editor-versions-v1'

/** New project ids: rows in the workspace need a uuid. */
export const newProjectId = () => remoteMode ? crypto.randomUUID() : `p-${Date.now().toString(36)}`

// ---------- offline demo ----------

export function readSaved(): Record<string, Project> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}
const readVersions = (): Record<string, (Version & { id?: string; tipo?: TipoVersao; nomeada?: boolean })[]> => { try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? '{}') } catch { return {} } }
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
  if (data) revs.set(id, (data.data as Project).rev ?? null)
  return data ? toProject(data) : undefined
}

// ---------- changes made elsewhere (the assistant in ChatGPT or Claude edits the same row) ----------

/** The revision this browser last read or saved, per project; null for a row saved before revisions existed. */
const revs = new Map<string, string | null>()
const externalListeners = new Map<string, Set<(p: Project) => void>>()
/** Calls `listener` with the new project when someone else saves it. */
export function onExternalChange(id: string, listener: (p: Project) => void) {
  const set = externalListeners.get(id) ?? new Set()
  set.add(listener)
  externalListeners.set(id, set)
  return () => { set.delete(listener) }
}
async function reloadExternal(id: string) {
  const { data } = await db().from('projects').select('id, name, data, updated_at').eq('id', id).maybeSingle()
  if (!data) return
  const p = toProject(data)
  revs.set(id, p.rev ?? null)
  setList([...projects.filter(x => x.id !== id), p])
  externalListeners.get(id)?.forEach(l => l(p))
}
/** Looks for a newer save of this project; while this browser has unsaved changes the save itself finds out. */
export async function checkProject(id: string) {
  if (!remoteMode || !uuidish(id) || timers.has(id) || !idle() || !revs.has(id)) return
  const { data } = await db().from('projects').select('rev:data->>rev').eq('id', id).maybeSingle()
  const rev = (data as { rev: string | null } | null)?.rev ?? null
  if (data && rev !== revs.get(id) && !timers.has(id) && idle()) await reloadExternal(id)
}

/**
 * Saves the whole project with a new revision. An existing row is only replaced if it still has the revision this
 * browser knows; otherwise someone else saved in between and their version is loaded instead of overwritten.
 */
async function writeProject(c: WorkspaceContext, p: Project) {
  const rev = crypto.randomUUID()
  const row = { name: p.name, format: p.format, data: { ...p, rev }, updated_at: new Date().toISOString() }
  const known = revs.get(p.id)
  if (known === undefined) {
    await must(db().from('projects').upsert({ id: p.id, workspace_id: c.ws, ...row }))
  } else {
    const update = db().from('projects').update(row).eq('id', p.id)
    const { data, error } = await (known === null ? update.is('data->>rev', null) : update.eq('data->>rev', known)).select('id')
    if (error) throw error
    if (!data?.length) { await reloadExternal(p.id); return false }
  }
  revs.set(p.id, rev)
  return true
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
    void persist(async () => { await writeProject(c, p) })
  }, 800))
}

export function deleteProject(id: string) {
  setList(projects.filter(p => p.id !== id))
  if (!remoteMode) { const all = readSaved(); delete all[id]; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)) } catch { /* blocked */ } return }
  clearTimeout(timers.get(id))
  revs.delete(id)
  void persist(() => must(db().from('projects').delete().eq('id', id)))
}

// ---------- versions ----------
// Versões do projeto: as salvas à mão (com nome) e as automáticas (a cada 10 min de edição, antes de grandes mudanças,
// ao exportar e ao sair). As automáticas sem nome são podadas: todas das últimas 24 h, uma por hora até 7 dias, uma por
// dia até 90 dias (no banco, editor.podar_versoes; neste navegador, podar() abaixo, com as mesmas regras).

export type TipoVersao = 'manual' | 'auto' | 'antes' | 'exportacao' | 'restauracao'
export type Version = {
  id: string; at: string; label: string; tipo: TipoVersao; nomeada: boolean
  resumo?: string; duracao?: number; capa?: string; autor?: string; arquivoId?: string
  /** O projeto daquela versão (no banco vem só quando pedido: versionProject). */
  project?: Project
}
export type NovaVersao = Pick<Version, 'label' | 'tipo' | 'resumo' | 'duracao' | 'capa' | 'autor'> & { nomeada?: boolean }
const LIMITE_LOCAL = 120
const podavel = (v: Version) => (v.tipo === 'auto' || v.tipo === 'antes') && !v.nomeada

/** As regras de poda (as mesmas do banco), sobre a lista do mais novo para o mais antigo. */
export function podar(lista: Version[], agora = new Date()): Version[] {
  const horas = (v: Version) => (agora.getTime() - new Date(v.at).getTime()) / 3600000
  const vistos = { hora: new Set<string>(), dia: new Set<string>() }
  return lista.filter(v => {
    if (!podavel(v)) return true
    const h = horas(v), hora = v.at.slice(0, 13), dia = v.at.slice(0, 10)
    const primeiraDaHora = !vistos.hora.has(hora), primeiraDoDia = !vistos.dia.has(dia)
    vistos.hora.add(hora); vistos.dia.add(dia)
    if (h >= 90 * 24) return false
    if (h >= 7 * 24) return primeiraDoDia
    if (h >= 24) return primeiraDaHora
    return true
  })
}

const guardarLocal = (id: string, lista: Version[]) => {
  const all = readVersions()
  try { localStorage.setItem(VERSIONS_KEY, JSON.stringify({ ...all, [id]: lista })) } catch { /* cheio ou bloqueado */ }
}
// Versões antigas (antes de haver tipo) contam como salvas à mão.
const local = (id: string): Version[] => (readVersions()[id] ?? []).map((v, i) => ({ ...v, id: v.id ?? `v${i}-${v.at}`, tipo: v.tipo ?? 'manual', nomeada: v.nomeada ?? true }))

type Linha = { id: string; label: string; tipo: TipoVersao; nomeada: boolean; resumo: string | null; duracao: number | null; capa: string | null; autor: string | null; arquivo_id: string | null; created_at: string }
const COLUNAS = 'id, label, tipo, nomeada, resumo, duracao, capa, autor, arquivo_id, created_at'
const daLinha = (v: Linha): Version => ({ id: v.id, at: fromIso(v.created_at), label: v.label, tipo: v.tipo, nomeada: v.nomeada, resumo: v.resumo ?? undefined,
  duracao: v.duracao ?? undefined, capa: v.capa ?? undefined, autor: v.autor ?? undefined, arquivoId: v.arquivo_id ?? undefined })

/** As versões do projeto, da mais nova para a mais antiga. */
export async function listVersions(id: string): Promise<Version[]> {
  if (!remoteMode) return local(id)
  if (!uuidish(id)) return []
  await connected
  const { data } = await db().from('project_versions').select(COLUNAS).eq('project_id', id).order('created_at', { ascending: false }).limit(300)
  return ((data ?? []) as Linha[]).map(daLinha)
}

/** O projeto guardado numa versão (para a prévia, restaurar ou duplicar). */
export async function versionProject(projectId: string, v: Version): Promise<Project | undefined> {
  if (v.project) return v.project
  if (!remoteMode) return local(projectId).find(x => x.id === v.id)?.project
  const { data } = await db().from('project_versions').select('data').eq('id', v.id).maybeSingle()
  return (data?.data as Project | undefined) ?? undefined
}

/** Guarda uma versão do projeto como está agora e poda as automáticas antigas. */
export async function saveVersion(p: Project, nova: NovaVersao): Promise<Version> {
  const v: Version = { id: remoteMode ? crypto.randomUUID() : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: localStamp(), project: p,
    ...nova, label: nova.label.slice(0, 120), nomeada: nova.nomeada ?? (nova.tipo !== 'auto' && nova.tipo !== 'antes') }
  if (!remoteMode) {
    guardarLocal(p.id, podar([v, ...local(p.id)]).slice(0, LIMITE_LOCAL))
    return v
  }
  if (!ctx || !uuidish(p.id)) return v
  const c = ctx
  // The project row must exist before its version (a new project may still be waiting for its first save).
  clearTimeout(timers.get(p.id)); timers.delete(p.id)
  await persist(async () => {
    if (!(await writeProject(c, p))) return
    await must(db().from('project_versions').insert({ id: v.id, project_id: p.id, workspace_id: c.ws, label: v.label, data: p, tipo: v.tipo, nomeada: v.nomeada,
      resumo: v.resumo?.slice(0, 300) ?? null, duracao: v.duracao ?? null, capa: v.capa ?? null, autor: v.autor?.slice(0, 120) ?? null }))
    await must(db().rpc('podar_versoes', { p_projeto: p.id }))
  })
  return v
}

/** Dá nome a uma versão: com nome, ela não é mais podada. */
export async function renameVersion(projectId: string, versionId: string, label: string) {
  const nome = label.trim().slice(0, 120)
  if (!nome) return
  if (!remoteMode) { guardarLocal(projectId, local(projectId).map(v => v.id === versionId ? { ...v, label: nome, nomeada: true } : v)); return }
  await persist(() => must(db().from('project_versions').update({ label: nome, nomeada: true }).eq('id', versionId)))
}

/** Liga a versão de uma exportação ao arquivo de vídeo gerado. */
export async function linkExport(projectId: string, versionId: string, arquivoId: string) {
  if (!remoteMode) { guardarLocal(projectId, local(projectId).map(v => v.id === versionId ? { ...v, arquivoId } : v)); return }
  await persist(() => must(db().from('project_versions').update({ arquivo_id: arquivoId }).eq('id', versionId)))
}

/** De qual projeto e versão veio cada vídeo exportado (pelo id do arquivo no Drive). */
export async function exportOrigins(fileIds: string[]): Promise<Record<string, { projectId: string; label: string; at: string }>> {
  const saida: Record<string, { projectId: string; label: string; at: string }> = {}
  if (!fileIds.length) return saida
  if (!remoteMode) {
    for (const [projectId, lista] of Object.entries(readVersions())) for (const v of lista) if (v.arquivoId && fileIds.includes(v.arquivoId)) saida[v.arquivoId] = { projectId, label: v.label, at: v.at }
    return saida
  }
  await connected
  const { data } = await db().from('project_versions').select('project_id, label, created_at, arquivo_id').in('arquivo_id', fileIds)
  for (const v of (data ?? []) as { project_id: string; label: string; created_at: string; arquivo_id: string }[]) saida[v.arquivo_id] = { projectId: v.project_id, label: v.label, at: fromIso(v.created_at) }
  return saida
}

/** Guarda um projeto novo já (sem esperar), para abrir em seguida (duplicar uma versão como projeto). */
export async function storeProjectNow(p: Project) {
  if (!remoteMode) { storeProject(p); return }
  if (!ctx || !uuidish(p.id)) return
  setList([...projects.filter(x => x.id !== p.id), p])
  const c = ctx
  await persist(async () => { await writeProject(c, p) })
}
