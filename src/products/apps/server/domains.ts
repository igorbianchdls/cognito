import { AppsError } from '../shared/contracts'
import { withAppsControlTransaction, type Database, type Session } from './database'

// Own domains of public apps, served by this Vercel project. Configuration (production env):
// APPS_VERCEL_TOKEN (or VERCEL_TOKEN), APPS_VERCEL_PROJECT_ID and APPS_VERCEL_TEAM_ID.
export const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
const OWN_HOSTS = /(^|\.)(vercel\.app|localhost|vercel-dns\.com)$/i
export type DomainDependencies = { request: (path: string, init?: RequestInit) => Promise<Response> }
export function vercelDependencies(): DomainDependencies {
  const token = process.env.APPS_VERCEL_TOKEN ?? process.env.VERCEL_TOKEN, project = process.env.APPS_VERCEL_PROJECT_ID, team = process.env.APPS_VERCEL_TEAM_ID
  if (!token || !project) throw new AppsError('DOMAINS_UNAVAILABLE', 'Domínio próprio ainda não está configurado neste ambiente (APPS_VERCEL_TOKEN e APPS_VERCEL_PROJECT_ID).', 503)
  return { request: (path, init = {}) => fetch(`https://api.vercel.com${path.replace(':project', encodeURIComponent(project))}${path.includes('?') ? '&' : '?'}${team ? 'teamId=' + encodeURIComponent(team) : ''}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers }, signal: AbortSignal.timeout(15_000) }) }
}

export function normalizeDomain(raw: string) {
  const domain = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '')
  if (!DOMAIN_PATTERN.test(domain)) throw new AppsError('INVALID_DOMAIN', 'Informe só o domínio, como apps.suaempresa.com.br.')
  if (OWN_HOSTS.test(domain)) throw new AppsError('INVALID_DOMAIN', 'Use um domínio da sua empresa, não um endereço da plataforma.')
  return domain
}
/** DNS records the owner of the domain must create, from what Vercel answers. */
export function dnsInstructions(domain: string, verification: { type: string; domain: string; value: string }[] = []) {
  const apex = domain.split('.').length === 2 || /\.(com|net|org|gov|edu)\.br$/.test(domain) && domain.split('.').length === 3
  return [apex ? { tipo: 'A', nome: '@', valor: '76.76.21.21' } : { tipo: 'CNAME', nome: domain.split('.')[0], valor: 'cname.vercel-dns.com' }, ...verification.map(v => ({ tipo: v.type, nome: v.domain, valor: v.value }))]
}

/** Adds the domain to the project and saves it on the app; the app must be public. */
export async function setDomain(db: Database, s: Session, appId: string, raw: string | null, deps: DomainDependencies = vercelDependencies()) {
  const current = (await db.query('SELECT modo,slug,dominio FROM apps.acessos WHERE empresa_id=$1 AND app_id=$2 FOR UPDATE', [s.tenantId, appId])).rows[0]
  if (raw === null) {
    if (!current?.dominio) throw new AppsError('INVALID_STATE', 'O app não tem domínio próprio.', 409)
    await deps.request(`/v9/projects/:project/domains/${encodeURIComponent(String(current.dominio))}`, { method: 'DELETE' }).catch(() => undefined)
    await db.query('UPDATE apps.acessos SET dominio=NULL,definido_por=$3,definido_em=now() WHERE empresa_id=$1 AND app_id=$2', [s.tenantId, appId, s.sharedUserId])
    return { dominio: null }
  }
  if (current?.modo !== 'publico') throw new AppsError('INVALID_STATE', 'Torne o app público antes de ligar um domínio.', 409)
  const domain = normalizeDomain(raw)
  const answer = await deps.request('/v10/projects/:project/domains', { method: 'POST', body: JSON.stringify({ name: domain }) })
  const body = await answer.json().catch(() => ({})) as { verified?: boolean; verification?: { type: string; domain: string; value: string }[]; error?: { code?: string; message?: string } }
  // Already in this project is fine: saving again only repeats the instructions.
  if (!answer.ok && body.error?.code !== 'domain_already_in_use_by_project' && body.error?.code !== 'domain_already_exists') throw new AppsError('DOMAIN_REFUSED', `A Vercel recusou o domínio: ${body.error?.message ?? answer.status}`, 409)
  await db.query('UPDATE apps.acessos SET dominio=$3,definido_por=$4,definido_em=now() WHERE empresa_id=$1 AND app_id=$2', [s.tenantId, appId, domain, s.sharedUserId])
  return { dominio: domain, verificado: Boolean(body.verified), dns: dnsInstructions(domain, body.verification) }
}
/** Whether DNS already points here and the certificate can be issued. */
export async function domainStatus(domain: string, deps: DomainDependencies = vercelDependencies()) {
  const config = await (await deps.request(`/v6/domains/${encodeURIComponent(domain)}/config`)).json().catch(() => ({})) as { misconfigured?: boolean }
  return { dominio: domain, funcionando: config.misconfigured === false }
}

// ---- Routing --------------------------------------------------------------------------------
const cache = new Map<string, { slug: string | null; until: number }>()
/** Public address (slug) behind a host, cached for a minute; null when the host is not an app domain. */
export async function slugForHost(host: string, lookup: (domain: string) => Promise<string | null> = defaultLookup) {
  const domain = host.toLowerCase().replace(/:\d+$/, '')
  if (!DOMAIN_PATTERN.test(domain) || OWN_HOSTS.test(domain)) return null
  const hit = cache.get(domain)
  if (hit && hit.until > Date.now()) return hit.slug
  const slug = await lookup(domain).catch(() => null)
  cache.set(domain, { slug, until: Date.now() + 60_000 })
  if (cache.size > 1000) cache.delete(cache.keys().next().value!)
  return slug
}
async function defaultLookup(domain: string) {
  return withAppsControlTransaction(async db => (await db.query('SELECT apps.endereco_do_dominio($1) slug', [domain])).rows[0]?.slug ?? null)
}
