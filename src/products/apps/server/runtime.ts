import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { AppsError, manifestSchema, recordSchema, uuid, validateData } from '../shared/contracts'
import type { Database, Session } from './database'
import { available, editable, event, getApp, versions } from './repository'
import { loadPackage } from './service'
import { storage, type PackageStore } from './storage'
import { validateStatic } from './publishing'

export type BrowserSession = Session & { browserSession: string }
const claimsSchema = z.object({ empresa: z.number(), usuario: z.number(), sessao: z.string(), app: uuid, versao: uuid, publicacao: uuid, exp: z.number() }).strict()
function secret() { const key = process.env.APPS_RUNTIME_SECRET ?? process.env.CLERK_SECRET_KEY; if (!key || key.length < 24) throw new AppsError('UNAVAILABLE', 'A execução de Apps não está configurada.', 503); return key }
function mac(value: string) { return createHmac('sha256', secret()).update('apps-runtime-v1:' + value).digest('base64url') }
function same(a: string, b: string) { const aa = Buffer.from(a), bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb) }
function readToken(token: string, s: BrowserSession, id: string) {
  try {
    const [body, signature, rest] = token.split('.')
    if (rest || !same(signature ?? '', mac(body))) throw Error()
    const c = claimsSchema.parse(JSON.parse(Buffer.from(body, 'base64url').toString()))
    if (c.empresa !== s.tenantId || c.usuario !== s.sharedUserId || c.sessao !== mac(s.browserSession) || c.app !== id || c.exp < Date.now()) throw Error()
    return c
  } catch { throw new AppsError('RUNTIME_EXPIRED', 'Esta sessão do app expirou. Abra o app novamente.', 409) }
}
export async function openRuntime(db: Database, s: BrowserSession, appId: string, preview: boolean, requestedVersion?: string, store: PackageStore = storage) {
  const app = await getApp(db, s, appId); available(app)
  if (preview) editable(s)
  const vs = await versions(db, s, appId)
  const v = preview ? (requestedVersion ? vs.find(v => v.id === requestedVersion) : vs[0]) : vs.find(v => v.id === app.versao_publicada_id)
  if (!v || !preview && !app.publicacao_id) throw new AppsError('NOT_PUBLISHED', 'Este app ainda não está publicado.', 409)
  const pacote = await loadPackage(db, s, appId, v.id, store); validateStatic(pacote)
  const body = JSON.stringify({ empresa: s.tenantId, usuario: s.sharedUserId, sessao: mac(s.browserSession), app: appId, versao: v.id, publicacao: app.publicacao_id, exp: Date.now() + 30 * 60_000 })
  const encoded = Buffer.from(body).toString('base64url')
  return { app, pacote, versaoId: v.id, modo: preview ? 'previa' : 'publicado', token: preview ? null : encoded + '.' + mac(encoded) }
}
export const runtimeDataSchema = z.object({ token: z.string().max(4000), colecao: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/), operacao: z.enum(['listar', 'salvar', 'excluir']), pagina: z.number().int().min(1).max(10000).default(1), registro: recordSchema.optional(), id: uuid.optional(), expectedVersion: z.number().int().positive().optional() }).strict()
export async function dataOperation(db: Database, s: BrowserSession, appId: string, input: z.infer<typeof runtimeDataSchema>) {
  const c = readToken(input.token, s, appId), app = await getApp(db, s, appId, input.operacao !== 'listar')
  available(app)
  if (app.publicacao_id !== c.publicacao || app.versao_publicada_id !== c.versao) throw new AppsError('RUNTIME_CHANGED', 'O app foi atualizado ou retirado de publicação. Abra-o novamente.', 409)
  const version = (await versions(db, s, appId)).find(v => v.id === c.versao)!
  const collection = version.manifesto.colecoes.find(v => v.chave === input.colecao)
  if (!collection) throw new AppsError('NOT_FOUND', 'Coleção não encontrada.', 404)
  if (input.operacao === 'listar') {
    const total = (await db.query('SELECT count(*)::int total FROM apps.registros WHERE empresa_id=$1 AND app_id=$2 AND colecao_id=$3 AND excluido_em IS NULL', [s.tenantId, appId, collection.id])).rows[0].total
    const registros = (await db.query('SELECT id,dados,versao_concorrencia FROM apps.registros WHERE empresa_id=$1 AND app_id=$2 AND colecao_id=$3 AND excluido_em IS NULL ORDER BY criado_em,id LIMIT 50 OFFSET $4', [s.tenantId, appId, collection.id, (input.pagina - 1) * 50])).rows
    return { registros, total, pagina: input.pagina }
  }
  editable(s)
  if (input.operacao === 'excluir') {
    if (!input.id || !input.expectedVersion) throw new AppsError('INVALID_DATA', 'Informe o registro e sua revisão.')
    const result = await db.query('UPDATE apps.registros SET excluido_em=now(),atualizado_em=now(),atualizado_por=$6,versao_concorrencia=versao_concorrencia+1 WHERE empresa_id=$1 AND app_id=$2 AND colecao_id=$3 AND id=$4 AND versao_concorrencia=$5 AND excluido_em IS NULL RETURNING id', [s.tenantId, appId, collection.id, input.id, input.expectedVersion, s.sharedUserId])
    if (!result.rows[0]) throw new AppsError('VERSION_CONFLICT', 'O registro mudou ou foi removido. Recarregue os dados.', 409)
    await event(db, s, appId, 'registro_excluido'); return { ok: true }
  }
  if (!input.registro) throw new AppsError('INVALID_DATA', 'Informe os dados do registro.')
  const record = input.registro, data = validateData(collection, record.dados)
  let result
  if (record.id) {
    if (!record.expectedVersion) throw new AppsError('INVALID_DATA', 'Informe a revisão do registro.')
    result = await db.query('UPDATE apps.registros SET dados=$6::jsonb,versao_concorrencia=versao_concorrencia+1,atualizado_em=now(),atualizado_por=$7 WHERE empresa_id=$1 AND app_id=$2 AND colecao_id=$3 AND id=$4 AND versao_concorrencia=$5 AND excluido_em IS NULL RETURNING id,dados,versao_concorrencia', [s.tenantId, appId, collection.id, record.id, record.expectedVersion, JSON.stringify(data), s.sharedUserId])
  } else result = await db.query('INSERT INTO apps.registros(empresa_id,app_id,colecao_id,dados,criado_por,atualizado_por) VALUES($1,$2,$3,$4::jsonb,$5,$5) RETURNING id,dados,versao_concorrencia', [s.tenantId, appId, collection.id, JSON.stringify(data), s.sharedUserId])
  if (!result.rows[0]) throw new AppsError('VERSION_CONFLICT', 'O registro mudou. Recarregue os dados.', 409)
  await event(db, s, appId, 'registro_salvo'); return { registro: result.rows[0] }
}

/** Manifest that authorizes Tables access: the published version (token) or, in preview, the version being edited. */
export async function runtimeManifest(db: Database, s: BrowserSession, appId: string, input: { token?: string; versao?: string }) {
  const app = await getApp(db, s, appId); available(app)
  if (input.token) {
    const c = readToken(input.token, s, appId)
    if (app.publicacao_id !== c.publicacao || app.versao_publicada_id !== c.versao) throw new AppsError('RUNTIME_CHANGED', 'O app foi atualizado ou retirado de publicação. Abra-o novamente.', 409)
    return manifestSchema.parse((await versions(db, s, appId)).find(v => v.id === c.versao)!.manifesto)
  }
  editable(s)
  const version = (await versions(db, s, appId)).find(v => v.id === input.versao)
  if (!version) throw new AppsError('NOT_FOUND', 'Versão não encontrada.', 404)
  return manifestSchema.parse(version.manifesto)
}
