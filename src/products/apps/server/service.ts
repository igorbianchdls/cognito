import { randomUUID } from 'node:crypto'
import type { z } from 'zod'
import { AppsError, manifestSchema, metadataSchema, validatePackage, type AppFile, type AppPackage, type Bundle, type Catalog } from '../shared/contracts'
import { starter } from '../shared/starter'
import type { Database, Session } from './database'
import { hash, storage, type PackageStore } from './storage'
import { buildReactApp } from './build'
import { appSelect, available, bump, editable, event, expected, getApp, publisher, versions } from './repository'
import { clearPreviewErrors } from './errors'
import { usageOf } from './usage'

export async function catalog(db: Database, s: Session, search: string, filter: string, page: number, sort: string): Promise<Catalog> {
  const where = `a.empresa_id=$1 AND a.nome ILIKE $3 ESCAPE '\\'`
  const args = [s.tenantId, s.sharedUserId, '%' + search.replace(/[\\%_]/g, '\\$&') + '%']
  const rows = (await db.query(`WITH catalogo AS (${appSelect} WHERE ${where}) SELECT
   count(*) FILTER(WHERE excluido_em IS NULL AND arquivado_em IS NULL)::int todos,
   count(*) FILTER(WHERE excluido_em IS NULL AND arquivado_em IS NULL AND publicacao_id IS NOT NULL)::int publicados,
   count(*) FILTER(WHERE excluido_em IS NULL AND arquivado_em IS NULL AND publicacao_id IS NULL)::int construcao,
   count(*) FILTER(WHERE excluido_em IS NULL AND arquivado_em IS NOT NULL)::int arquivados,
   count(*) FILTER(WHERE excluido_em IS NOT NULL)::int lixeira,
   count(*) FILTER(WHERE excluido_em IS NULL AND arquivado_em IS NULL AND favorito)::int favoritos FROM catalogo`, args)).rows[0]
  const condition = filter === 'lixeira' ? 'excluido_em IS NOT NULL' : `excluido_em IS NULL AND ${filter === 'arquivados' ? 'arquivado_em IS NOT NULL' : 'arquivado_em IS NULL'}${filter === 'publicados' ? ' AND publicacao_id IS NOT NULL' : filter === 'construcao' ? ' AND publicacao_id IS NULL' : filter === 'favoritos' ? ' AND favorito' : ''}`
  const apps = (await db.query(`WITH catalogo AS (${appSelect} WHERE ${where}) SELECT * FROM catalogo WHERE ${condition} ORDER BY ${sort === 'nome' ? 'nome ASC' : 'atualizado_em DESC'},id LIMIT 12 OFFSET $4`, [...args, (page - 1) * 12])).rows
  return { apps, total: rows[filter] ?? rows.todos, pagina: page, contadores: rows, podeEditar: s.role !== 'viewer', podePublicar: ['owner', 'admin'].includes(s.role) } as Catalog
}
export async function bundle(db: Database, s: Session, id: string): Promise<Bundle> { return { app: await getApp(db, s, id), versoes: await versions(db, s, id), podeEditar: s.role !== 'viewer', podePublicar: ['owner', 'admin'].includes(s.role), uso: await usageOf(db, s, id) } }

// Each file is stored once per company by content hash; a version lists its files. Saving a
// draft only writes contents that changed, inside the same database transaction.
export const fileHash = (f: AppFile) => hash(f.codificacao + '\n' + f.conteudo)
export const packageHash = (p: AppPackage) => hash(JSON.stringify(p.arquivos.map(f => [f.caminho, fileHash(f)])))
export async function saveFiles(db: Database, s: Session, appId: string, versionId: string, input: AppPackage) {
  const p = validatePackage(input)
  await db.query("UPDATE apps.versoes SET versao_formato=2 WHERE empresa_id=$1 AND app_id=$2 AND id=$3 AND estado='rascunho' AND versao_formato<>2", [s.tenantId, appId, versionId])
  await db.query('DELETE FROM apps.versao_arquivos WHERE empresa_id=$1 AND versao_id=$2', [s.tenantId, versionId])
  const store = async (file: Pick<AppFile, 'codificacao' | 'conteudo'>) => {
    const digest = fileHash(file as AppFile)
    await db.query('INSERT INTO apps.conteudos(empresa_id,hash,codificacao,conteudo,tamanho) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [s.tenantId, digest, file.codificacao, file.conteudo, Buffer.byteLength(file.conteudo)])
    return digest
  }
  for (const [position, file] of p.arquivos.entries()) await db.query('INSERT INTO apps.versao_arquivos(empresa_id,app_id,versao_id,caminho,posicao,hash) VALUES($1,$2,$3,$4,$5,$6)', [s.tenantId, appId, versionId, file.caminho, position, await store(file)])
  // React drafts are saved even when they do not compile, so they can be fixed; the error stays on the version.
  let build: { estado: 'ok' | 'erro' | null; erro: string | null; js: string | null; css: string | null } = { estado: null, erro: null, js: null, css: null }
  if (p.manifesto.modelo === 'react') {
    try { const out = await buildReactApp(p); build = { estado: 'ok', erro: null, js: await store({ codificacao: 'utf8', conteudo: out.js }), css: out.css ? await store({ codificacao: 'utf8', conteudo: out.css }) : null } }
    catch (error) { if (!(error instanceof AppsError) || error.code !== 'BUILD_FAILED') throw error; build = { estado: 'erro', erro: error.message, js: null, css: null } }
  }
  await db.query('UPDATE apps.versoes SET build_estado=$4,build_erro=$5,build_js=$6,build_css=$7 WHERE empresa_id=$1 AND app_id=$2 AND id=$3', [s.tenantId, appId, versionId, build.estado, build.erro, build.js, build.css])
  await clearPreviewErrors(db, s, versionId)
  return packageHash(p)
}
/** Compiled JS and CSS of a React version, or null for HTML apps. */
export async function loadBuild(db: Database, s: Session, appId: string, versionId: string) {
  const v = (await db.query('SELECT manifesto,build_estado,build_erro,build_js,build_css FROM apps.versoes WHERE empresa_id=$1 AND app_id=$2 AND id=$3', [s.tenantId, appId, versionId])).rows[0]
  if (!v || v.manifesto?.modelo !== 'react') return null
  if (v.build_estado !== 'ok') throw new AppsError('BUILD_FAILED', v.build_erro ? `O app não compilou:\n${v.build_erro}` : 'Salve o app para compilá-lo.', 422)
  const rows = (await db.query('SELECT hash,conteudo FROM apps.conteudos WHERE empresa_id=$1 AND hash=ANY($2::text[])', [s.tenantId, [v.build_js, v.build_css].filter(Boolean)])).rows
  const content = (hash: string | null) => rows.find(r => r.hash === hash)?.conteudo ?? ''
  return { js: content(v.build_js), css: content(v.build_css) }
}
export async function loadPackage(db: Database, s: Session, appId: string, versionId: string, store: PackageStore = storage) {
  const version = (await db.query('SELECT manifesto,versao_formato FROM apps.versoes WHERE empresa_id=$1 AND app_id=$2 AND id=$3', [s.tenantId, appId, versionId])).rows[0]
  if (!version) throw new AppsError('NOT_FOUND', 'Versão não encontrada.', 404)
  if (version.versao_formato === 2) {
    const files = (await db.query('SELECT f.caminho,c.codificacao,c.conteudo FROM apps.versao_arquivos f JOIN apps.conteudos c ON c.empresa_id=f.empresa_id AND c.hash=f.hash WHERE f.empresa_id=$1 AND f.app_id=$2 AND f.versao_id=$3 ORDER BY f.posicao', [s.tenantId, appId, versionId])).rows
    if (!files.length) throw new AppsError('NO_CONTENT', 'O app ainda não tem arquivos.', 409)
    return validatePackage({ manifesto: manifestSchema.parse(version.manifesto), arquivos: files.map(f => ({ caminho: f.caminho, codificacao: f.codificacao, conteudo: f.conteudo })) })
  }
  // Versions saved before files moved to the database keep a single package in Storage.
  const file = (await db.query("SELECT caminho_storage,hash_conteudo FROM apps.arquivos WHERE empresa_id=$1 AND app_id=$2 AND versao_id=$3 AND finalidade='pacote' AND estado_upload='confirmado' ORDER BY criado_em DESC LIMIT 1", [s.tenantId, appId, versionId])).rows[0]
  if (!file) throw new AppsError('NO_CONTENT', 'O app ainda não tem arquivos.', 409)
  return store.get(file.caminho_storage, file.hash_conteudo)
}
export async function create(db: Database, s: Session, data: z.infer<typeof metadataSchema>, example: boolean, source?: AppPackage, modelo: 'html' | 'react' = 'html') {
  editable(s)
  const appId = randomUUID(), versionId = randomUUID(), p = source ?? starter(randomUUID(), example, modelo)
  const slug = (data.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) || 'app') + '-' + appId.slice(0, 8)
  await db.query('INSERT INTO apps.apps(id,empresa_id,nome,slug,descricao,icone,cor,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)', [appId, s.tenantId, data.nome, slug, data.descricao, data.icone, data.cor, s.sharedUserId])
  await db.query('INSERT INTO apps.versoes(id,empresa_id,app_id,numero,manifesto,versao_formato,criado_por) VALUES($1,$2,$3,1,$4::jsonb,2,$5)', [versionId, s.tenantId, appId, JSON.stringify(p.manifesto), s.sharedUserId])
  await saveFiles(db, s, appId, versionId, p)
  await event(db, s, appId, 'criado'); return getApp(db, s, appId)
}
export async function saveDraft(db: Database, s: Session, id: string, revision: number, input: AppPackage) {
  editable(s); const app = await getApp(db, s, id, true); available(app); expected(app, revision)
  const p = validatePackage(input)
  let version = (await versions(db, s, id)).find(v => v.estado === 'rascunho')
  if (!version) {
    const previous = (await versions(db, s, id))[0], versionId = randomUUID()
    await db.query('INSERT INTO apps.versoes(id,empresa_id,app_id,numero,manifesto,versao_origem_id,versao_formato,criado_por) VALUES($1,$2,$3,$4,$5::jsonb,$6,2,$7)', [versionId, s.tenantId, id, (previous?.numero ?? 0) + 1, JSON.stringify(p.manifesto), previous?.id ?? null, s.sharedUserId])
    version = (await versions(db, s, id)).find(v => v.id === versionId)!
  } else await db.query('UPDATE apps.versoes SET manifesto=$4::jsonb WHERE empresa_id=$1 AND app_id=$2 AND id=$3', [s.tenantId, id, version.id, JSON.stringify(p.manifesto)])
  await saveFiles(db, s, id, version.id, p)
  await bump(db, s, id); await event(db, s, id, 'rascunho_salvo'); return bundle(db, s, id)
}
export async function metadata(db: Database, s: Session, id: string, revision: number, data: z.infer<typeof metadataSchema>) {
  editable(s); const app = await getApp(db, s, id, true); expected(app, revision)
  await db.query('UPDATE apps.apps SET nome=$3,descricao=$4,cor=$5,icone=$6 WHERE empresa_id=$1 AND id=$2', [s.tenantId, id, data.nome, data.descricao, data.cor, data.icone]); await bump(db, s, id); await event(db, s, id, 'dados_alterados'); return getApp(db, s, id)
}
export async function lifecycle(db: Database, s: Session, id: string, revision: number, action: string) {
  editable(s); const app = await getApp(db, s, id, true, true); expected(app, revision)
  // Arquivar ou excluir um app no ar também o retira de publicação: exige a permissão de publicar.
  if ((action === 'arquivar' || action === 'excluir') && app.publicacao_id) publisher(s)
  if (action === 'arquivar' || action === 'excluir') await db.query("UPDATE apps.publicacoes SET estado='encerrada',encerrado_em=now() WHERE empresa_id=$1 AND app_id=$2 AND estado='ativa'", [s.tenantId, id])
  if (action === 'arquivar') await db.query('UPDATE apps.apps SET arquivado_em=now() WHERE empresa_id=$1 AND id=$2', [s.tenantId, id])
  else if (action === 'excluir') await db.query('UPDATE apps.apps SET excluido_em=now() WHERE empresa_id=$1 AND id=$2', [s.tenantId, id])
  else if (action === 'restaurar') await db.query('UPDATE apps.apps SET excluido_em=NULL,arquivado_em=NULL WHERE empresa_id=$1 AND id=$2', [s.tenantId, id])
  else throw new AppsError('INVALID_ACTION', 'Ação inválida.')
  await bump(db, s, id); await event(db, s, id, action); return { ok: true }
}
export async function duplicate(db: Database, s: Session, id: string, store: PackageStore = storage) {
  editable(s); const app = await getApp(db, s, id, true), vs = await versions(db, s, id)
  const p = await loadPackage(db, s, id, vs[0].id, store)
  const ids = new Map(p.manifesto.colecoes.map(c => [c.id, randomUUID()]))
  p.manifesto = manifestSchema.parse({ ...p.manifesto, colecoes: p.manifesto.colecoes.map(c => ({ ...c, id: ids.get(c.id) })) })
  return create(db, s, metadataSchema.parse({ ...Object.fromEntries(['nome', 'descricao', 'cor', 'icone'].map(k => [k, app[k as keyof typeof app]])), nome: app.nome.slice(0, 90) + ' (cópia)' }), false, p)
}
