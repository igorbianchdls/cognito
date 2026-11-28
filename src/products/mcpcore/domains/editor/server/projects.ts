// Projects and versions in editor.projects / editor.project_versions, the same rows the editor in the browser uses.
// Every change keeps the previous state as a version (undo) and a new revision, which the open editor notices.
import { randomUUID } from 'node:crypto'
import { PluginError } from '../../../shared/contracts'
import type { Project } from '@/products/editor/frontend/editor/project/types'
import type { DurationOf } from '@/products/editor/frontend/editor/project/ops'
import { fileIds, type FileInfo } from './convert'
import type { Member } from './database'

/** Versions kept per project; the oldest ones go first. */
type Row = { id: string; name: string; data: Project; updated_at: string }

export const toProject = (r: Row): Project => ({ ...r.data, id: r.id, name: r.name, tracks: r.data.tracks ?? [], format: r.data.format ?? '9:16', background: r.data.background ?? '#0b0d12' })

export async function getProject(m: Member, id: string, lock = false) {
  const [row] = await m.db.query<Row>(`SELECT id, name, data, updated_at FROM editor.projects WHERE id = $1 AND workspace_id = $2${lock ? ' FOR UPDATE' : ''}`, [id, m.ws])
  if (!row) throw new PluginError('NOT_FOUND', 'Projeto não encontrado nesta empresa. Use video_listar_projetos.', 404)
  return { project: toProject(row), updatedAt: row.updated_at }
}

export async function filesById(m: Member, ids: string[]): Promise<Map<string, FileInfo>> {
  const valid = ids.filter(id => /^[0-9a-f-]{36}$/i.test(id))
  if (!valid.length) return new Map()
  const rows = await m.db.query<FileInfo>('SELECT id, name, kind, duration::float8 AS duration, width, height FROM drive.files WHERE workspace_id = $1 AND id = ANY($2::uuid[])', [m.ws, valid])
  return new Map(rows.map(r => [r.id, r]))
}

export const durationLookup = (files: Map<string, FileInfo>): DurationOf => id => (id && files.get(id)?.duration) || undefined

export async function insertProject(m: Member, p: Project) {
  const data = { ...p, rev: randomUUID() }
  await m.db.query('INSERT INTO editor.projects (id, workspace_id, name, format, data) VALUES ($1, $2, $3, $4, $5)', [p.id, m.ws, p.name, p.format, data])
}

/** Saves `next` over the project, keeping `before` as a version labelled with what is about to change. */
export async function saveProject(m: Member, before: Project, next: Project, label: string) {
  // Versão automática "antes da mudança" do assistente: entra na mesma poda das automáticas do editor.
  await m.db.query(`INSERT INTO editor.project_versions (project_id, workspace_id, label, data, tipo, nomeada, autor) VALUES ($1, $2, $3, $4, 'antes', false, 'Assistente')`, [before.id, m.ws, label.slice(0, 120), before])
  const data = { ...next, rev: randomUUID(), updatedAt: new Date().toISOString().slice(0, 16) }
  await m.db.query('UPDATE editor.projects SET name = $2, format = $3, data = $4, updated_at = now() WHERE id = $1', [next.id, next.name, next.format, data])
  await m.db.query('SELECT editor.podar_versoes($1)', [before.id])
}

export type EditContext = { files: Map<string, FileInfo>; durationOf: DurationOf }
/**
 * Locks the project, applies `edit` and saves the result with a version of what it was. The files the project uses
 * (and `extraFiles`) are loaded first, for their names and lengths.
 */
export async function editProject<R>(m: Member, id: string, label: string, edit: (p: Project, ctx: EditContext) => { project: Project; result: R }, extraFiles: string[] = []) {
  const { project } = await getProject(m, id, true)
  const files = await filesById(m, [...fileIds(project), ...extraFiles])
  const { project: next, result } = edit(project, { files, durationOf: durationLookup(files) })
  if (next !== project) await saveProject(m, project, next, label)
  return { project: next, files, result, changed: next !== project }
}

/** A file of this company that can go on the timeline. */
export async function mediaFile(m: Member, id: string) {
  const [file] = await m.db.query<FileInfo & { trashed_at: string | null }>(
    'SELECT id, name, kind, duration::float8 AS duration, width, height, trashed_at FROM drive.files WHERE id = $1 AND workspace_id = $2', [id, m.ws])
  if (!file || file.trashed_at) throw new PluginError('NOT_FOUND', 'Arquivo não encontrado no Drive desta empresa. Use video_buscar_arquivos.', 404)
  if (file.kind === 'text') throw new PluginError('INVALID_INPUT', 'Esse arquivo é um documento; use vídeo, imagem ou áudio.', 422)
  return file
}
