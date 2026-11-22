// Receiving events from the otto.js script: which property they belong to, whether the site may send them, and the
// row each one becomes in BigQuery. No IP address is kept: only the country and region the platform reports.
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { EventRow } from './bigquery'

export type Property = { id: string; workspace_id: string; domains: string[] }

const text = (max: number) => z.string().max(max).optional().nullable()
const eventSchema = z.object({
  e: z.string().min(1).max(120).regex(/^[$A-Za-z0-9_.:\- ]+$/),   // event name: $pageview, $identify, criou_venda…
  t: z.string().max(40).optional(),                                // when it happened in the browser (ISO)
  d: z.string().min(1).max(100),                                    // visitor id
  u: text(200),                                                     // signed-in user id, when known
  s: text(100),                                                     // session id
  url: text(2000), title: text(300), ref: text(2000),
  sw: z.number().int().min(0).max(20000).optional(), lang: text(20),
  p: z.record(z.unknown()).optional(),                              // the event's own properties
}).strict()
export const batchSchema = z.object({ k: z.string().regex(/^otto_[0-9a-f]{32}$/), events: z.array(eventSchema).min(1).max(50) }).strict()
export type Batch = z.infer<typeof batchSchema>

export const MAX_BODY = 64 * 1024

/** The site sending must be one of the property's domains (or a subdomain). A property without domains accepts any. */
export function originAllowed(property: Property, origin: string | null) {
  if (!property.domains.length) return true
  if (!origin) return false
  let host: string
  try { host = new URL(origin).hostname.toLowerCase() } catch { return false }
  return property.domains.some(d => { const domain = d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''); return host === domain || host.endsWith('.' + domain) })
}

const BOT = /bot|crawler|spider|crawling|headless|lighthouse|preview|facebookexternalhit|slurp|bingpreview|python-requests|curl\//i
export const isBot = (ua: string) => !ua || BOT.test(ua)

export function parseAgent(ua: string) {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop'
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet'
    : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Outro'
  const os = /windows/i.test(ua) ? 'Windows' : /iphone|ipad|ios/i.test(ua) ? 'iOS' : /mac os/i.test(ua) ? 'macOS' : /android/i.test(ua) ? 'Android' : /linux/i.test(ua) ? 'Linux' : 'Outro'
  return { device, browser, os }
}

function split(url?: string | null) {
  if (!url) return { host: null, path: null, query: new URLSearchParams() }
  try { const u = new URL(url); return { host: u.hostname, path: u.pathname, query: u.searchParams } } catch { return { host: null, path: null, query: new URLSearchParams() } }
}

/** The BigQuery rows for a batch. Times outside the last day (or in the future) use the time it arrived. */
export function toRows(property: Property, batch: Batch, context: { ua: string; country?: string | null; region?: string | null; now?: Date }): EventRow[] {
  const now = context.now ?? new Date()
  const agent = parseAgent(context.ua)
  return batch.events.map(e => {
    const at = e.t ? Date.parse(e.t) : NaN
    const when = Number.isFinite(at) && at > now.getTime() - 86400000 && at < now.getTime() + 300000 ? new Date(at) : now
    const page = split(e.url), from = split(e.ref)
    const utm = (k: string) => page.query.get('utm_' + k)?.slice(0, 200) || null
    const props = e.p ? JSON.stringify(e.p) : null
    return {
      event_id: randomUUID(), property_id: property.id, workspace_id: property.workspace_id, event: e.e,
      timestamp: when.toISOString(), received_at: now.toISOString(),
      distinct_id: e.d, user_id: e.u ?? null, session_id: e.s ?? null,
      url: e.url ?? null, host: page.host, path: page.path, title: e.title ?? null,
      referrer: e.ref ?? null, referrer_host: from.host && from.host !== page.host ? from.host : null,
      utm_source: utm('source'), utm_medium: utm('medium'), utm_campaign: utm('campaign'), utm_content: utm('content'), utm_term: utm('term'),
      ...agent, country: context.country || null, region: context.region || null,
      screen_width: e.sw ?? null, language: e.lang ?? null, properties: props && props.length <= 8192 ? props : null,
    }
  })
}
