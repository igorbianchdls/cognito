// Sales from Hotmart, Kiwify, Eduzz and Stripe: each platform's webhook is checked (its own signature scheme), read
// into one shape, matched to a contact by e-mail or phone, stored, and handed to the automations (compra, reembolso,
// carrinho abandonado). Formats follow each platform's documentation; anything unknown is ignored, never thrown.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { InboxError, requireWriter, type Db, type Person, type Query } from './db'
import { seal, unseal } from './crypto'
import { onEvent } from './flows'
import { wonFromPurchase } from './deals'

export type Provider = 'hotmart' | 'kiwify' | 'eduzz' | 'stripe'
export type SaleEvent = {
  kind: 'aprovada' | 'pendente' | 'reembolsada' | 'cancelada' | 'chargeback' | 'carrinho'
  externalId: string; product: string | null; amount: number | null; currency: string; checkoutUrl?: string | null; at: Date
  customer: { name: string | null; email: string | null; phone: string | null }
}

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : {})
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null)
const num = (v: unknown) => { const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN; return Number.isFinite(n) ? n : null }
const date = (v: unknown) => { const d = typeof v === 'number' ? new Date(v > 1e12 ? v : v * 1000) : typeof v === 'string' ? new Date(v) : new Date(NaN); return isNaN(d.getTime()) ? new Date() : d }
const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }
const hmac = (alg: 'sha1' | 'sha256', key: string, data: string) => createHmac(alg, key).update(data, 'utf8').digest('hex')

export class SignatureError extends Error {}

/** Checks the request came from the platform and reads it. Empty list = an event we don't use (answer 200 anyway). */
export function parseSale(provider: Provider, raw: string, headers: Headers, query: URLSearchParams, secret: string, now = Date.now()): SaleEvent[] {
  if (!secret) throw new SignatureError('Integração sem segredo.')
  let body: Obj
  switch (provider) {
    case 'hotmart': {
      // Hotmart sends its "hottok" in a header; it must be the one in the Hotmart webhook settings.
      if (!same(headers.get('x-hotmart-hottok') ?? '', secret)) throw new SignatureError('Hottok inválido.')
      body = obj(JSON.parse(raw))
      const event = str(body.event) ?? '', data = obj(body.data), purchase = obj(data.purchase), buyer = obj(data.buyer), price = obj(purchase.price)
      const kind = ({ PURCHASE_APPROVED: 'aprovada', PURCHASE_COMPLETE: 'aprovada', PURCHASE_BILLET_PRINTED: 'pendente', PURCHASE_REFUNDED: 'reembolsada',
        PURCHASE_CANCELED: 'cancelada', PURCHASE_CHARGEBACK: 'chargeback', PURCHASE_OUT_OF_SHOPPING_CART: 'carrinho' } as Record<string, SaleEvent['kind'] | undefined>)[event]
      if (!kind) return []
      const externalId = str(purchase.transaction) ?? str(body.id)
      if (!externalId) return []
      return [{ kind, externalId, product: str(obj(data.product).name), amount: num(price.value), currency: str(price.currency_value) ?? 'BRL', at: date(purchase.approved_date ?? body.creation_date),
        checkoutUrl: kind === 'carrinho' ? str(obj(data.checkout).url) ?? null : null,
        customer: { name: str(buyer.name), email: str(buyer.email), phone: str(buyer.checkout_phone) ?? str(buyer.phone) } }]
    }
    case 'kiwify': {
      // Kiwify signs with HMAC-SHA1 of the raw body (the webhook token as key), in ?signature=.
      if (!same(query.get('signature') ?? '', hmac('sha1', secret, raw))) throw new SignatureError('Assinatura inválida.')
      body = obj(JSON.parse(raw))
      if (str(body.checkout_link) && !str(body.order_id)) {
        const id = str(body.id); if (!id) return []
        return [{ kind: 'carrinho', externalId: id, product: str(body.product_name), amount: null, currency: 'BRL', checkoutUrl: str(body.checkout_link), at: date(body.created_at),
          customer: { name: str(body.name), email: str(body.email), phone: str(body.phone) } }]
      }
      const status = str(body.order_status) ?? '', id = str(body.order_id)
      const kind = ({ paid: 'aprovada', approved: 'aprovada', waiting_payment: 'pendente', refunded: 'reembolsada', refused: 'cancelada', chargedback: 'chargeback' } as Record<string, SaleEvent['kind'] | undefined>)[status]
      if (!kind || !id) return []
      const customer = obj(body.Customer), product = obj(body.Product), commissions = obj(body.Commissions)
      const cents = num(commissions.charge_amount) ?? num(commissions.product_base_price)
      return [{ kind, externalId: id, product: str(product.product_name), amount: cents === null ? null : cents / 100, currency: str(commissions.currency) ?? 'BRL', at: date(body.approved_date ?? body.created_at),
        customer: { name: str(customer.full_name) ?? str(customer.first_name), email: str(customer.email), phone: str(customer.mobile) } }]
    }
    case 'eduzz': {
      // Eduzz (MyEduzz webhooks) signs with HMAC-SHA256 of the raw body in x-signature.
      if (!same((headers.get('x-signature') ?? '').replace(/^sha256=/, ''), hmac('sha256', secret, raw))) throw new SignatureError('Assinatura inválida.')
      body = obj(JSON.parse(raw))
      const event = (str(body.event) ?? '').replace(/^myeduzz\./, ''), data = obj(body.data)
      const kind = ({ invoice_paid: 'aprovada', invoice_waiting_payment: 'pendente', invoice_opened: 'pendente', invoice_refunded: 'reembolsada', invoice_canceled: 'cancelada',
        invoice_expired: 'cancelada', cart_abandonment: 'carrinho', invoice_chargeback: 'chargeback' } as Record<string, SaleEvent['kind'] | undefined>)[event]
      const id = str(data.id)
      if (!kind || !id) return []
      const buyer = obj(data.buyer), price = obj(data.price ?? data.paid), item = obj((Array.isArray(data.items) ? data.items : [])[0])
      return [{ kind, externalId: id, product: str(item.name) ?? str(obj(data.product).name), amount: num(price.value), currency: str(price.currency) ?? 'BRL', at: date(data.paidAt ?? data.createdAt ?? body.sentDate),
        checkoutUrl: kind === 'carrinho' ? str(data.checkoutUrl) : null, customer: { name: str(buyer.name), email: str(buyer.email), phone: str(buyer.cellphone) ?? str(buyer.phone) } }]
    }
    case 'stripe': {
      // Stripe-Signature: t=<time>,v1=<HMAC-SHA256 of "t.body">; refuses old deliveries (5 minutes).
      const header = headers.get('stripe-signature') ?? ''
      const t = /t=(\d+)/.exec(header)?.[1], sigs = [...header.matchAll(/v1=([0-9a-f]+)/g)].map(m => m[1])
      if (!t || !sigs.length || Math.abs(now / 1000 - Number(t)) > 300) throw new SignatureError('Assinatura vencida ou ausente.')
      const expected = hmac('sha256', secret, `${t}.${raw}`)
      if (!sigs.some(s => same(s, expected))) throw new SignatureError('Assinatura inválida.')
      body = obj(JSON.parse(raw))
      const type = str(body.type), o = obj(obj(body.data).object)
      const cust = obj(o.customer_details), billing = obj(o.billing_details), meta = obj(o.metadata)
      const customer = { name: str(cust.name) ?? str(billing.name), email: str(cust.email) ?? str(billing.email) ?? str(o.receipt_email), phone: str(cust.phone) ?? str(billing.phone) }
      const amount = (cents: unknown) => { const n = num(cents); return n === null ? null : n / 100 }
      const currency = (str(o.currency) ?? 'brl').toUpperCase(), product = str(meta.produto) ?? str(meta.product) ?? str(o.description)
      if (type === 'checkout.session.completed') return [{ kind: o.payment_status === 'paid' ? 'aprovada' : 'pendente', externalId: str(o.payment_intent) ?? str(o.id)!, product, amount: amount(o.amount_total), currency, at: date(o.created), customer }]
      if (type === 'checkout.session.async_payment_succeeded') return [{ kind: 'aprovada', externalId: str(o.payment_intent) ?? str(o.id)!, product, amount: amount(o.amount_total), currency, at: date(o.created), customer }]
      if (type === 'checkout.session.expired' && customer.email) return [{ kind: 'carrinho', externalId: str(o.id)!, product, amount: amount(o.amount_total), currency, checkoutUrl: str(obj(obj(o.after_expiration).recovery).url), at: date(o.created), customer }]
      if (type === 'charge.refunded') return [{ kind: 'reembolsada', externalId: str(o.payment_intent) ?? str(o.id)!, product, amount: amount(o.amount_refunded), currency, at: date(o.created), customer }]
      if (type === 'charge.dispute.created') return [{ kind: 'chargeback', externalId: str(o.payment_intent) ?? str(o.charge)!, product, amount: amount(o.amount), currency, at: date(o.created), customer }]
      return []
    }
  }
}

const cleanPhone = (raw: string | null) => {
  if (!raw) return null
  let d = raw.replace(/\D/g, '')
  if (!raw.trim().startsWith('+') && (d.length === 10 || d.length === 11)) d = '55' + d
  return /^[0-9]{8,15}$/.test(d) ? '+' + d : null
}

/** The contact for a buyer: same e-mail, else same phone, else a new one (named after the buyer). */
async function contactFor(service: Query, workspaceId: string, c: SaleEvent['customer']) {
  const email = c.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email) ? c.email.toLowerCase().slice(0, 200) : null
  const phone = cleanPhone(c.phone)
  if (!email && !phone) return null
  const [found] = await service<{ id: string }>(`SELECT id FROM inbox.contacts WHERE workspace_id = $1 AND ((email IS NOT NULL AND lower(email) = $2) OR (phone IS NOT NULL AND phone = $3))
    ORDER BY (lower(email) = $2) DESC NULLS LAST, created_at LIMIT 1`, [workspaceId, email, phone])
  if (found) {
    await service('UPDATE inbox.contacts SET email = coalesce(email, $2), phone = coalesce(phone, $3) WHERE id = $1', [found.id, email, phone])
    return found.id
  }
  const [made] = await service<{ id: string }>('INSERT INTO inbox.contacts (workspace_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
    [workspaceId, (c.name || email || phone || 'Cliente').slice(0, 120), email, phone])
  return made.id
}

type Integration = { id: string; workspace_id: string; provider: Provider; status: string }

/** Stores what came from the platform and starts the matching automations. Returns what happened, for the log. */
export async function ingestSales(service: Query, integration: Integration, events: SaleEvent[], send?: typeof fetch) {
  const done: string[] = []
  for (const e of events) {
    const contactId = await contactFor(service, integration.workspace_id, e.customer)
    if (!contactId) { done.push('sem_contato'); continue }
    if (e.kind === 'carrinho') {
      const rows = await service(`INSERT INTO inbox.abandoned_carts (workspace_id, integration_id, contact_id, provider, external_id, product, amount, checkout_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (workspace_id, provider, external_id) DO NOTHING RETURNING id`,
      [integration.workspace_id, integration.id, contactId, integration.provider, e.externalId, e.product, e.amount, e.checkoutUrl ?? null, e.at])
      if (rows.length) await onEvent({ service, send }, { workspaceId: integration.workspace_id, kind: 'carrinho_abandonado', contactId, product: e.product ?? undefined,
        vars: { produto: e.product, link_checkout: e.checkoutUrl } })
      done.push(rows.length ? 'carrinho' : 'repetido'); continue
    }
    const [before] = await service<{ status: string }>('SELECT status FROM inbox.purchases WHERE workspace_id = $1 AND provider = $2 AND external_id = $3', [integration.workspace_id, integration.provider, e.externalId])
    await service(`INSERT INTO inbox.purchases (workspace_id, integration_id, contact_id, provider, external_id, product, amount, currency, status, occurred_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (workspace_id, provider, external_id) DO UPDATE SET status = excluded.status,
        product = coalesce(excluded.product, inbox.purchases.product), amount = coalesce(excluded.amount, inbox.purchases.amount)`,
    [integration.workspace_id, integration.id, contactId, integration.provider, e.externalId, e.product, e.amount, e.currency, e.kind, e.at])
    if (before?.status === e.kind) { done.push('repetido'); continue }
    if (e.kind === 'aprovada') {
      await service(`UPDATE inbox.abandoned_carts SET recovered_at = now() WHERE contact_id = $1 AND recovered_at IS NULL`, [contactId])
      await wonFromPurchase(service, integration.workspace_id, contactId, e.amount)
      await onEvent({ service, send }, { workspaceId: integration.workspace_id, kind: 'compra', contactId, product: e.product ?? undefined, vars: { produto: e.product, valor: e.amount } })
    }
    if (e.kind === 'reembolsada' || e.kind === 'chargeback') {
      await onEvent({ service, send }, { workspaceId: integration.workspace_id, kind: 'reembolso', contactId, product: e.product ?? undefined, vars: { produto: e.product } })
    }
    done.push(e.kind)
  }
  await service(`UPDATE inbox.integrations SET last_event_at = now(), last_error = NULL, events = events + $2 WHERE id = $1`, [integration.id, events.length])
  return done
}

/** The public webhook: finds the integration by the token in the address, checks and stores. */
export async function receiveSale(service: Query, token: string, raw: string, headers: Headers, query: URLSearchParams, send?: typeof fetch) {
  const [integration] = await service<Integration & { secret_sealed: string | null }>(`SELECT i.id, i.workspace_id, i.provider, i.status, s.secret_sealed
    FROM inbox.integrations i LEFT JOIN inbox_private.integration_secrets s ON s.integration_id = i.id WHERE i.token = $1`, [token])
  if (!integration) return { status: 404, done: [] as string[] }
  if (integration.status !== 'ativa') return { status: 200, done: ['pausada'] }
  try {
    const events = parseSale(integration.provider, raw, headers, query, integration.secret_sealed ? unseal(integration.secret_sealed) : '')
    return { status: 200, done: await ingestSales(service, integration, events, send) }
  } catch (error) {
    const message = error instanceof SignatureError ? error.message : error instanceof SyntaxError ? 'Corpo inválido.' : 'Falha ao registrar.'
    await service('UPDATE inbox.integrations SET last_error = $2 WHERE id = $1', [integration.id, message])
    if (!(error instanceof SignatureError || error instanceof SyntaxError)) console.error(JSON.stringify({ scope: 'inbox', code: 'SALE_FAILED', integration: integration.id, message: (error as Error).message }))
    return { status: error instanceof SignatureError ? 401 : error instanceof SyntaxError ? 400 : 500, done: [] }
  }
}

const PROVIDERS: Provider[] = ['hotmart', 'kiwify', 'eduzz', 'stripe']

/** Connects a platform account: the secret is checked for shape and kept sealed; returns the webhook address. */
export async function createIntegration(person: Person, input: { provider?: unknown; nome?: unknown; segredo?: unknown }, db: Db) {
  const provider = PROVIDERS.find(p => p === input.provider)
  if (!provider) throw new InboxError('INVALID', 'Plataforma inválida.')
  const secret = String(input.segredo ?? '').trim()
  if (secret.length < 8 || /\s/.test(secret)) throw new InboxError('INVALID', 'Cole o segredo da plataforma (sem espaços).')
  if (provider === 'stripe' && !secret.startsWith('whsec_')) throw new InboxError('INVALID', 'No Stripe, use o "Signing secret" do endpoint (começa com whsec_).')
  const name = typeof input.nome === 'string' && input.nome.trim() ? input.nome.trim().slice(0, 80) : provider[0].toUpperCase() + provider.slice(1)
  await db.asPerson(person, q => requireWriter(q, person.orgId))
  const sealed = seal(secret)
  const [row] = await db.service<{ id: string; token: string }>('INSERT INTO inbox.integrations (workspace_id, provider, name, created_by) VALUES ($1, $2, $3, $4) RETURNING id, token',
    [person.orgId, provider, name, person.userId])
  await db.service('INSERT INTO inbox_private.integration_secrets (integration_id, secret_sealed) VALUES ($1, $2)', [row.id, sealed])
  return { id: row.id, caminho: `/api/inbox/vendas/${row.token}` }
}

/** Replaces the secret (e.g. after rotating it on the platform). */
export async function updateSecret(person: Person, id: string, secret: string, db: Db) {
  const s = secret.trim()
  if (s.length < 8 || /\s/.test(s)) throw new InboxError('INVALID', 'Cole o segredo da plataforma (sem espaços).')
  await db.asPerson(person, async q => {
    const [row] = await q('SELECT id FROM inbox.integrations WHERE id = $1 AND workspace_id = $2', [id, person.orgId])
    if (!row) throw new InboxError('NOT_FOUND', 'Integração não encontrada.', 404)
    await requireWriter(q, person.orgId)
  })
  await db.service(`INSERT INTO inbox_private.integration_secrets (integration_id, secret_sealed) VALUES ($1, $2)
    ON CONFLICT (integration_id) DO UPDATE SET secret_sealed = excluded.secret_sealed, updated_at = now()`, [id, seal(s)])
  await db.service('UPDATE inbox.integrations SET last_error = NULL WHERE id = $1', [id])
}
