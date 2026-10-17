import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { withTablesTransaction } from '@/products/tables/server/database'
import { AppsError, manifestSchema, SLUG_PATTERN, uuid, type Access, type App } from '../shared/contracts'
import { transaction, withAppsControlTransaction, type Database, type Session } from './database'
import { available, bump, event, getApp, publisher, versions } from './repository'
import { secret } from './runtime'
import { loadBuild, loadPackage } from './service'
import { validateStatic } from './publishing'
import { tablesOperation, type TablesRequest, type TablesTransaction } from './tablesSource'

// Public apps: anyone with /p/<endereco> opens the published version, without login. Requests run
// with the permissions of the administrator who made the app public, limited to what the
// published manifest declares in visitantes. Every failure looks the same to the visitor.
const UNAVAILABLE = () => new AppsError('NOT_FOUND', 'Este link não está disponível.', 404)

export function slugify(name: string, appId: string) {
  const slug = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/, '')
  return slug.length >= 3 ? slug : `app-${appId.slice(0, 8)}`
}
export async function readAccess(db: Database, s: Session, appId: string): Promise<Access | null> {
  const row = (await db.query('SELECT modo,slug,definido_por,definido_em FROM apps.acessos WHERE empresa_id=$1 AND app_id=$2', [s.tenantId, appId])).rows[0]
  return row ? { modo: row.modo, endereco: row.slug, definido_por: Number(row.definido_por), definido_em: row.definido_em } : null
}
/** Address for a public app: the requested one, the current one, or one made from the name. */
export async function chooseAddress(db: Database, s: Session, app: App, requested?: string) {
  const taken = async (slug: string) => (await db.query('SELECT apps.endereco_em_uso($1,$2) usado', [slug, app.id])).rows[0].usado as boolean
  if (requested) {
    if (!SLUG_PATTERN.test(requested)) throw new AppsError('INVALID_ADDRESS', 'Use de 3 a 60 letras minúsculas, números ou hífens, sem hífen no começo ou no fim.')
    if (await taken(requested)) throw new AppsError('ADDRESS_TAKEN', `O endereço "${requested}" já está em uso. Escolha outro.`, 409)
    return requested
  }
  if (app.endereco) return app.endereco
  const base = slugify(app.nome, app.id)
  for (const slug of [base, `${base}-${app.id.slice(0, 4)}`, `${base}-${app.id.slice(0, 8)}`]) if (!(await taken(slug))) return slug
  throw new AppsError('ADDRESS_TAKEN', 'Não encontrei um endereço livre. Informe um endereço.', 409)
}
export async function setAccess(db: Database, s: Session, appId: string, modo: 'privado' | 'publico', slug: string) {
  publisher(s)
  await db.query('INSERT INTO apps.acessos(empresa_id,app_id,modo,slug,definido_por) VALUES($1,$2,$3,$4,$5) ON CONFLICT(empresa_id,app_id) DO UPDATE SET modo=excluded.modo,slug=excluded.slug,definido_por=excluded.definido_por,definido_em=now()', [s.tenantId, appId, modo, slug, s.sharedUserId])
  await bump(db, s, appId); await event(db, s, appId, modo === 'publico' ? 'acesso_publico' : 'acesso_privado')
}
/** Who can do what without login, from the published manifest, for previews and summaries. */
export function visitorSummary(manifest: unknown) {
  const m = manifestSchema.parse(manifest)
  return m.tabelas.filter(t => t.visitantes).flatMap(t => [
    ...(t.visitantes!.ler ? [`ver em ${t.chave}: ${t.visitantes!.ler.join(', ')}`] : []),
    ...(t.visitantes!.criar ? [`criar em ${t.chave}: ${t.visitantes!.criar.join(', ')}`] : []),
  ])
}

// ---- Visitor runtime ---------------------------------------------------------------------------
export type PublicDependencies = { control: typeof withAppsControlTransaction; apps: typeof transaction; tables: TablesTransaction }
export const publicDependencies: PublicDependencies = { control: withAppsControlTransaction, apps: transaction, tables: withTablesTransaction }
const claimsSchema = z.object({ empresa: z.number(), app: uuid, versao: uuid, publicacao: uuid, endereco: z.string(), visitante: uuid, exp: z.number() }).strict()
const mac = (value: string) => createHmac('sha256', secret()).update('apps-public-v1:' + value).digest('base64url')
const same = (a: string, b: string) => { const aa = Buffer.from(a), bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb) }

/** The public app behind an address, with the session of the administrator who opened it, if still allowed. */
async function resolve(db: Database, slug: string): Promise<{ session: Session; appId: string }> {
  if (!SLUG_PATTERN.test(slug)) throw UNAVAILABLE()
  const row = (await db.query(`SELECT ac.empresa_id,ac.app_id,ac.definido_por,m.role FROM apps.acessos ac
    JOIN shared.usuarios_empresas m ON m.empresa_id=ac.empresa_id AND m.usuario_id=ac.definido_por JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=ac.empresa_id
    WHERE ac.slug=$1 AND ac.modo='publico' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active' AND m.role IN ('owner','admin')`, [slug])).rows[0]
  if (!row) throw UNAVAILABLE()
  return { session: { tenantId: Number(row.empresa_id), sharedUserId: Number(row.definido_por), role: row.role }, appId: String(row.app_id) }
}
/** Counts the request and refuses it past the limits: per visitor origin and, for new records, per app and day. */
async function limit(db: Database, s: Session, appId: string, origin: string, kind: 'leitura' | 'criacao') {
  const window = (await db.query(`SELECT count(*) FILTER (WHERE origem=$3 AND tipo=$4 AND criado_em>now()-interval '10 minutes')::int origem,
    count(*) FILTER (WHERE tipo='criacao' AND criado_em>now()-interval '1 day')::int criacoes FROM apps.envios_publicos WHERE empresa_id=$1 AND app_id=$2 AND criado_em>now()-interval '1 day'`, [s.tenantId, appId, origin, kind])).rows[0]
  if (window.origem >= (kind === 'criacao' ? 10 : 300) || kind === 'criacao' && window.criacoes >= 500) throw new AppsError('RATE_LIMITED', 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.', 429)
  if (kind === 'criacao') await db.query("DELETE FROM apps.envios_publicos WHERE empresa_id=$1 AND app_id=$2 AND criado_em<now()-interval '1 day'", [s.tenantId, appId])
  await db.query('INSERT INTO apps.envios_publicos(empresa_id,app_id,origem,tipo) VALUES($1,$2,$3,$4)', [s.tenantId, appId, origin, kind])
}
export const visitorOrigin = (ip: string, slug: string) => mac('origem:' + slug + ':' + ip).slice(0, 32)

export async function openPublic(slug: string, origin: string, deps: PublicDependencies = publicDependencies) {
  const { session, appId } = await deps.control(async db => { const r = await resolve(db, slug); await limit(db, r.session, r.appId, origin, 'leitura'); return r })
  return deps.apps(session, false, async db => {
    const app = await getApp(db, session, appId).catch(() => { throw UNAVAILABLE() })
    try { available(app) } catch { throw UNAVAILABLE() }
    if (!app.publicacao_id || !app.versao_publicada_id) throw UNAVAILABLE()
    const pacote = await loadPackage(db, session, appId, app.versao_publicada_id); validateStatic(pacote)
    const compilado = await loadBuild(db, session, appId, app.versao_publicada_id)
    const body = Buffer.from(JSON.stringify({ empresa: session.tenantId, app: appId, versao: app.versao_publicada_id, publicacao: app.publicacao_id, endereco: slug, visitante: randomUUID(), exp: Date.now() + 2 * 3600_000 })).toString('base64url')
    return { app: { id: app.id, nome: app.nome }, pacote, compilado, versaoId: app.versao_publicada_id, modo: 'publico', token: body + '.' + mac(body) }
  })
}

export async function publicTables(slug: string, token: string, input: TablesRequest, origin: string, deps: PublicDependencies = publicDependencies) {
  let claims: z.infer<typeof claimsSchema>
  try {
    const [body, signature, rest] = token.split('.')
    if (rest || !same(signature ?? '', mac(body))) throw Error()
    claims = claimsSchema.parse(JSON.parse(Buffer.from(body, 'base64url').toString()))
    if (claims.endereco !== slug || claims.exp < Date.now()) throw Error()
  } catch { throw new AppsError('RUNTIME_EXPIRED', 'Esta página expirou. Recarregue para continuar.', 409) }
  const { session, appId } = await deps.control(async db => {
    const r = await resolve(db, slug)
    if (r.session.tenantId !== claims.empresa || r.appId !== claims.app) throw UNAVAILABLE()
    await limit(db, r.session, r.appId, origin, input.operacao === 'criar' ? 'criacao' : 'leitura'); return r
  })
  const manifest = await deps.apps(session, false, async db => {
    const app = await getApp(db, session, appId).catch(() => { throw UNAVAILABLE() })
    if (app.excluido_em || app.arquivado_em || app.publicacao_id !== claims.publicacao || app.versao_publicada_id !== claims.versao) throw new AppsError('RUNTIME_CHANGED', 'O app foi atualizado. Recarregue a página.', 409)
    return manifestSchema.parse((await versions(db, session, appId)).find(v => v.id === claims.versao)!.manifesto)
  })
  return tablesOperation(session, manifest, input, deps.tables, true)
}
