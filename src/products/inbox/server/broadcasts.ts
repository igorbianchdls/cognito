// Broadcasts: a segment receives a WhatsApp template or an e-mail, a few dozen per minute, from the Inbox tick.
// The browser writes drafts; starting, scheduling, cancelling and every send are the server's (service connection).
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { fill } from '../shared/flows'
import { parseRules, type SegmentRules } from '../shared/segments'
import { previewOf } from '../shared/rules'
import { InboxError, requireWriter, type Db, type Person, type Query } from './db'
import { unseal } from './crypto'
import { EmailError, emailHtml, emailText, sendEmail, sesConfig, type SesConfig } from './email'
import { MetaError, listTemplates, sendTemplate, submitTemplate } from './meta'
import { compileSegment } from './segments'
import { deliver, loadTarget } from './send'
import { UUID } from './http'

export type BroadcastDeps = { service: Query; send?: typeof fetch; ses?: SesConfig | null; baseUrl?: string }
type Broadcast = { id: string; workspace_id: string; name: string; kind: 'whatsapp' | 'email'; channel_id: string | null; template_id: string | null; segment_id: string | null
  rules: unknown; subject: string | null; body: string | null; status: string; scheduled_at: string | null }
type Template = { id: string; channel_id: string; name: string; language: string; category: string; header: string | null; body: string; footer: string | null
  buttons: string[]; variables: string[]; status: string }
type ContactRow = { id: string; name: string; phone: string | null; email: string | null; source: string | null; fields: Record<string, unknown> }

export const MAX_RECIPIENTS = 50000
const BATCH = 40
const baseUrl = (d: BroadcastDeps) => (d.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://cognito-seven.vercel.app').replace(/\/+$/, '')

export const contactVars = (c: ContactRow): Record<string, unknown> =>
  ({ ...c.fields, nome: c.name, primeiro_nome: c.name.split(' ')[0], telefone: c.phone, email: c.email, origem: c.source })
/** {{1}}, {{2}}… of a template body, filled in order. */
export const renderTemplate = (body: string, params: string[]) => body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => params[Number(n) - 1] ?? '')
export const templateParams = (t: Pick<Template, 'variables'>, vars: Record<string, unknown>) =>
  t.variables.map(v => { const x = vars[v]; return x == null ? '' : String(x).slice(0, 200) })

// ---- Opt-out link (e-mail) and words (WhatsApp) ----
function optoutKey() {
  const k = process.env.INBOX_CREDENTIAL_KEY
  if (!k) throw new InboxError('CREDENTIALS_UNAVAILABLE', 'Configuração do servidor incompleta.', 503)
  return k
}
export const optoutToken = (contactId: string) => `${contactId}.${createHmac('sha256', optoutKey()).update('optout:email:' + contactId).digest('base64url').slice(0, 32)}`
export function verifyOptoutToken(token: string | null) {
  const [id, mac] = (token ?? '').split('.')
  if (!id || !mac || !UUID.test(id)) return null
  const want = optoutToken(id).split('.')[1]
  return mac.length === want.length && timingSafeEqual(Buffer.from(mac), Buffer.from(want)) ? id : null
}
/** The e-mail link ("Não quero mais receber"): records the opt-out. */
export async function optOutByToken(service: Query, token: string | null) {
  const id = verifyOptoutToken(token)
  if (!id) return false
  await service(`INSERT INTO inbox.optouts (workspace_id, contact_id, kind, reason) SELECT workspace_id, id, 'email', 'Link no e-mail' FROM inbox.contacts WHERE id = $1
    ON CONFLICT (contact_id, kind) DO NOTHING`, [id])
  return true
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[.!]+$/, '')
const STOP_WORDS = new Set(['sair', 'parar', 'stop', 'descadastrar', 'nao quero mais receber'])
/**
 * A WhatsApp customer who answers SAIR (or PARAR, STOP…) stops getting broadcasts; VOLTAR undoes it.
 * Returns true when the message was this (the automations then leave it alone).
 */
export async function handleOptOutWord(d: { service: Query; send?: typeof fetch }, c: { workspaceId: string; contactId: string; conversationId: string; channelKind: string; text: string }) {
  if (c.channelKind !== 'whatsapp' && c.channelKind !== 'teste') return false
  const word = norm(c.text)
  let reply: string | null = null
  if (STOP_WORDS.has(word)) {
    await d.service(`INSERT INTO inbox.optouts (workspace_id, contact_id, kind, reason) VALUES ($1, $2, 'whatsapp', 'Respondeu ' || $3) ON CONFLICT (contact_id, kind) DO NOTHING`,
      [c.workspaceId, c.contactId, word.toUpperCase().slice(0, 30)])
    reply = 'Pronto, você não vai mais receber nossas mensagens em massa. Se mudar de ideia, envie VOLTAR.'
  } else if (word === 'voltar') {
    const removed = await d.service(`DELETE FROM inbox.optouts WHERE contact_id = $1 AND kind = 'whatsapp' RETURNING 1`, [c.contactId])
    if (!removed.length) return false
    reply = 'Combinado! Você voltou a receber nossas mensagens.'
  }
  if (!reply) return false
  await deliver(d.service, await loadTarget(d.service, c.conversationId), { texto: reply }, { send: d.send }).catch(() => undefined)
  return true
}

// ---- WhatsApp templates ----
const VAR = /^[\p{L}_][\p{L}\p{N}_]{0,39}$/u
const EXAMPLES: Record<string, string> = { primeiro_nome: 'Maria', nome: 'Maria Souza', email: 'maria@exemplo.com', telefone: '+5511999999999', origem: 'instagram' }
/** Problems that Meta would reject anyway, in Portuguese; empty when fine. */
export function templateProblems(t: Pick<Template, 'body' | 'variables' | 'buttons' | 'header' | 'footer'>) {
  const out: string[] = []
  const used = [...t.body.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map(m => Number(m[1]))
  const max = used.length ? Math.max(...used) : 0
  for (let i = 1; i <= max; i++) if (!used.includes(i)) { out.push(`Falta a variável {{${i}}} no texto (use 1, 2, 3… em ordem).`); break }
  if (max !== t.variables.length) out.push(`O texto usa ${max} variável(is), mas ${t.variables.length} foi(ram) escolhida(s).`)
  if (t.variables.some(v => typeof v !== 'string' || !VAR.test(v))) out.push('Nome de variável inválido.')
  if (/^\s*\{\{\d+\}\}|\{\{\d+\}\}\s*$/.test(t.body)) out.push('A Meta não aceita variável no começo ou no fim do texto.')
  if (t.header && /\{\{/.test(t.header)) out.push('O título não pode ter variável.')
  if (t.buttons.some(b => typeof b !== 'string' || !b.trim() || b.length > 25)) out.push('Botões precisam de texto com até 25 caracteres.')
  return out
}
const META_STATUS: Record<string, string> = { APPROVED: 'aprovado', PENDING: 'pendente', IN_APPEAL: 'pendente', REJECTED: 'rejeitado', PAUSED: 'pausado', DISABLED: 'pausado' }

async function channelToken(service: Query, channelId: string) {
  const [cred] = await service<{ token_sealed: string; business_account_id: string | null }>('SELECT token_sealed, business_account_id FROM inbox_private.channel_credentials WHERE channel_id = $1', [channelId])
  if (!cred) throw new InboxError('NO_CREDENTIALS', 'Este canal está sem credencial. Conecte de novo em Canais.', 409)
  return { token: unseal(cred.token_sealed), waba: cred.business_account_id }
}

/** POST /api/inbox/modelos/[id]/enviar: sends the template for Meta's review (the test channel approves at once). */
export async function submitTemplateFor(who: Person, id: string, db: Db, deps: { service: Query; send?: typeof fetch }) {
  if (!UUID.test(id)) throw new InboxError('INVALID', 'Modelo inválido.')
  const t = await db.asPerson(who, async q => {
    await requireWriter(q, who.orgId)
    const [row] = await q<Template & { kind: string }>(`SELECT t.*, c.kind FROM inbox.wa_templates t JOIN inbox.channels c ON c.id = t.channel_id WHERE t.id = $1 AND t.workspace_id = $2`, [id, who.orgId])
    return row
  })
  if (!t) throw new InboxError('NOT_FOUND', 'Modelo não encontrado.', 404)
  if (!['rascunho', 'rejeitado'].includes(t.status)) throw new InboxError('INVALID_STATE', 'Este modelo já foi enviado para a Meta.', 409)
  const problems = templateProblems(t)
  if (problems.length) throw new InboxError('INVALID', problems.join(' '))
  if (t.kind === 'teste') {
    await deps.service(`UPDATE inbox.wa_templates SET status = 'aprovado', reason = NULL WHERE id = $1`, [id])
    return { status: 'aprovado' }
  }
  const { token, waba } = await channelToken(deps.service, t.channel_id)
  if (!waba) throw new InboxError('NO_WABA', 'Falta o ID da conta do WhatsApp Business neste canal. Conecte o canal de novo informando esse ID.', 409)
  try {
    const r = await submitTemplate(deps.send ?? fetch, waba, token, { ...t, examples: t.variables.map(v => EXAMPLES[v] ?? 'exemplo') })
    const status = META_STATUS[r.status] ?? 'pendente'
    await deps.service(`UPDATE inbox.wa_templates SET status = $2, meta_id = $3, reason = NULL WHERE id = $1`, [id, status, r.id])
    return { status }
  } catch (error) {
    if (error instanceof MetaError) throw new InboxError('META', error.message, 502)
    throw error
  }
}

/** POST /api/inbox/modelos/sincronizar { canal_id }: brings Meta's review results. */
export async function syncTemplatesFor(who: Person, channelId: string, db: Db, deps: { service: Query; send?: typeof fetch }) {
  if (!UUID.test(channelId)) throw new InboxError('INVALID', 'Canal inválido.')
  const [ch] = await db.asPerson(who, q => q<{ kind: string }>('SELECT kind FROM inbox.channels WHERE id = $1 AND workspace_id = $2', [channelId, who.orgId]))
  if (!ch) throw new InboxError('NOT_FOUND', 'Canal não encontrado.', 404)
  if (ch.kind !== 'whatsapp') return { atualizados: 0 }
  const { token, waba } = await channelToken(deps.service, channelId)
  if (!waba) return { atualizados: 0 }
  let n = 0
  for (const t of await listTemplates(deps.send ?? fetch, waba, token).catch(e => { throw e instanceof MetaError ? new InboxError('META', e.message, 502) : e })) {
    if (!t.name || !t.language || !t.status) continue
    const rows = await deps.service(`UPDATE inbox.wa_templates SET status = $4, reason = $5, meta_id = coalesce(meta_id, $6)
      WHERE channel_id = $1 AND name = $2 AND language = $3 AND status::text <> $4 RETURNING 1`, [channelId, t.name, t.language, META_STATUS[t.status] ?? 'pendente', t.reason ?? null, t.id ?? null])
    n += rows.length
  }
  return { atualizados: n }
}

// ---- Starting, scheduling, cancelling ----
async function checkReady(service: Query, b: Broadcast, ses: SesConfig | null): Promise<SegmentRules> {
  if (!b.segment_id) throw new InboxError('INVALID', 'Escolha o segmento que vai receber.')
  const [seg] = await service<{ rules: unknown }>('SELECT rules FROM inbox.segments WHERE id = $1 AND workspace_id = $2', [b.segment_id, b.workspace_id])
  if (!seg) throw new InboxError('INVALID', 'O segmento escolhido não existe mais.')
  if (b.kind === 'whatsapp') {
    if (!b.channel_id || !b.template_id) throw new InboxError('INVALID', 'Escolha o número de WhatsApp e o modelo aprovado.')
    const [t] = await service<{ status: string; channel_id: string; kind: string; channel_status: string }>(`SELECT t.status, t.channel_id, c.kind, c.status AS channel_status
      FROM inbox.wa_templates t JOIN inbox.channels c ON c.id = t.channel_id WHERE t.id = $1 AND t.workspace_id = $2`, [b.template_id, b.workspace_id])
    if (!t || t.channel_id !== b.channel_id) throw new InboxError('INVALID', 'O modelo não é deste número.')
    if (t.status !== 'aprovado') throw new InboxError('INVALID', 'O modelo ainda não foi aprovado pela Meta.')
    if (t.channel_status === 'desconectado') throw new InboxError('INVALID', 'Este número foi desconectado. Conecte de novo em Canais.')
  } else {
    if (!b.subject?.trim() || !b.body?.trim()) throw new InboxError('INVALID', 'Escreva o assunto e o texto do e-mail.')
    if (!ses) throw new InboxError('EMAIL_OFF', 'O envio de e-mail ainda não foi ligado no servidor (Amazon SES).', 409)
    const [s] = await service<{ from_email: string | null }>('SELECT from_email FROM inbox.email_settings WHERE workspace_id = $1', [b.workspace_id])
    if (!s?.from_email) throw new InboxError('INVALID', 'Informe o remetente em Disparos → E-mail.')
  }
  try { return parseRules(seg.rules) } catch (e) { throw new InboxError('INVALID', 'Regras do segmento: ' + (e as Error).message) }
}

/** Builds the recipient list from the segment (opted-out and unreachable contacts are kept as "ignorado", with the reason). */
async function materialize(service: Query, b: Broadcast, rules: SegmentRules) {
  const params: unknown[] = b.kind === 'email' ? [b.workspace_id, b.id, b.kind] : [b.workspace_id, b.id, b.kind, b.channel_id]
  const where = compileSegment(rules, params)
  const unreachable = b.kind === 'email' ? 'c.email IS NULL'
    : `c.phone IS NULL AND NOT EXISTS (SELECT 1 FROM inbox.contact_identities i WHERE i.contact_id = c.id AND i.channel_id = $4::uuid)`
  await service(`INSERT INTO inbox.broadcast_recipients (broadcast_id, workspace_id, contact_id, status, error)
    SELECT $2, c.workspace_id, c.id,
      CASE WHEN o.contact_id IS NOT NULL OR ${unreachable} THEN 'ignorado' ELSE 'pendente' END::inbox.recipient_status,
      CASE WHEN o.contact_id IS NOT NULL THEN 'Pediu para não receber' WHEN ${unreachable} THEN ${b.kind === 'email' ? `'Sem e-mail'` : `'Sem telefone'`} END
    FROM inbox.contacts c LEFT JOIN inbox.optouts o ON o.contact_id = c.id AND o.kind = $3::inbox.broadcast_kind
    WHERE c.workspace_id = $1 AND ${where} ORDER BY c.created_at LIMIT ${MAX_RECIPIENTS}
    ON CONFLICT DO NOTHING`, params)
  await service(`UPDATE inbox.broadcasts SET status = 'enviando', started_at = now(), rules = $2, error = NULL WHERE id = $1`, [b.id, rules])
  await refreshCounts(service, b.id)
}

async function refreshCounts(service: Query, id: string) {
  await service(`UPDATE inbox.broadcasts b SET total = x.total, sent = x.sent, failed = x.failed, skipped = x.skipped,
      status = CASE WHEN b.status = 'enviando' AND x.open = 0 THEN 'concluido'::inbox.broadcast_status ELSE b.status END,
      finished_at = CASE WHEN b.status = 'enviando' AND x.open = 0 THEN now() ELSE b.finished_at END
    FROM (SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'enviado')::int AS sent, count(*) FILTER (WHERE status = 'falhou')::int AS failed,
      count(*) FILTER (WHERE status = 'ignorado')::int AS skipped, count(*) FILTER (WHERE status IN ('pendente', 'enviando'))::int AS open
      FROM inbox.broadcast_recipients WHERE broadcast_id = $1) x WHERE b.id = $1`, [id])
}

async function loadOwn(who: Person, id: string, db: Db) {
  if (!UUID.test(id)) throw new InboxError('INVALID', 'Disparo inválido.')
  const b = await db.asPerson(who, async q => {
    await requireWriter(q, who.orgId)
    return (await q<Broadcast>('SELECT * FROM inbox.broadcasts WHERE id = $1 AND workspace_id = $2', [id, who.orgId]))[0]
  })
  if (!b) throw new InboxError('NOT_FOUND', 'Disparo não encontrado.', 404)
  return b
}

/** POST /api/inbox/disparos/[id]/iniciar: sends now, or schedules when scheduled_at is in the future. */
export async function startBroadcast(who: Person, id: string, db: Db, deps: BroadcastDeps) {
  const b = await loadOwn(who, id, db)
  if (b.status !== 'rascunho') throw new InboxError('INVALID_STATE', 'Este disparo já foi iniciado.', 409)
  const rules = await checkReady(deps.service, b, deps.ses === undefined ? sesConfig() : deps.ses)
  if (b.scheduled_at && new Date(b.scheduled_at).getTime() > Date.now() + 30000) {
    const rows = await deps.service(`UPDATE inbox.broadcasts SET status = 'agendado', rules = $2 WHERE id = $1 AND status = 'rascunho' RETURNING 1`, [id, rules])
    if (!rows.length) throw new InboxError('INVALID_STATE', 'Este disparo já foi iniciado.', 409)
    return { status: 'agendado' }
  }
  const claimed = await deps.service(`UPDATE inbox.broadcasts SET status = 'enviando' WHERE id = $1 AND status = 'rascunho' RETURNING 1`, [id])
  if (!claimed.length) throw new InboxError('INVALID_STATE', 'Este disparo já foi iniciado.', 409)
  await materialize(deps.service, b, rules)
  const [row] = await deps.service<{ status: string; total: number; skipped: number }>('SELECT status, total, skipped FROM inbox.broadcasts WHERE id = $1', [id])
  return { status: row.status, total: row.total, ignorados: row.skipped }
}

/** POST /api/inbox/disparos/[id]/cancelar: stops what was not sent yet. */
export async function cancelBroadcast(who: Person, id: string, db: Db, deps: { service: Query }) {
  const b = await loadOwn(who, id, db)
  const rows = await deps.service(`UPDATE inbox.broadcasts SET status = 'cancelado', finished_at = now() WHERE id = $1 AND status IN ('agendado', 'enviando') RETURNING 1`, [b.id])
  if (!rows.length) throw new InboxError('INVALID_STATE', 'Só dá para cancelar um disparo agendado ou em andamento.', 409)
  await deps.service(`UPDATE inbox.broadcast_recipients SET status = 'ignorado', error = 'Disparo cancelado' WHERE broadcast_id = $1 AND status = 'pendente'`, [b.id])
  await refreshCounts(deps.service, b.id)
  return { status: 'cancelado' }
}

// ---- Sending (tick) ----
async function sendWhatsApp(d: BroadcastDeps, b: Broadcast, t: Template, c: ContactRow) {
  const [ch] = await d.service<{ kind: string; external_id: string; status: string }>('SELECT kind, external_id, status FROM inbox.channels WHERE id = $1', [b.channel_id])
  if (!ch || ch.status === 'desconectado') throw new InboxError('CHANNEL_OFF', 'Número desconectado.')
  let [identity] = await d.service<{ external_id: string }>('SELECT external_id FROM inbox.contact_identities WHERE contact_id = $1 AND channel_id = $2 ORDER BY created_at LIMIT 1', [c.id, b.channel_id])
  if (!identity) {
    const external = c.phone ? c.phone.replace(/\D/g, '') : 'contato-' + c.id
    await d.service(`INSERT INTO inbox.contact_identities (workspace_id, contact_id, channel_id, external_id) VALUES ($1, $2, $3, $4) ON CONFLICT (channel_id, external_id) DO NOTHING`,
      [b.workspace_id, c.id, b.channel_id, external])
    ;[identity] = await d.service<{ external_id: string }>('SELECT external_id FROM inbox.contact_identities WHERE contact_id = $1 AND channel_id = $2 LIMIT 1', [c.id, b.channel_id])
    if (!identity) throw new InboxError('DUPLICATE', 'Este telefone está ligado a outro contato.')
  }
  const params = templateParams(t, contactVars(c))
  const text = renderTemplate(t.body, params)
  const [conv] = await d.service<{ id: string }>(`INSERT INTO inbox.conversations (workspace_id, channel_id, contact_id, last_message_at, last_preview) VALUES ($1, $2, $3, now(), $4)
    ON CONFLICT (channel_id, contact_id) DO UPDATE SET last_message_at = now(), last_preview = excluded.last_preview RETURNING id`, [b.workspace_id, b.channel_id, c.id, previewOf('texto', text)])
  const [msg] = await d.service<{ id: string }>(`INSERT INTO inbox.messages (workspace_id, conversation_id, direction, kind, body, status, buttons)
    VALUES ($1, $2, 'saida', 'texto', $3, 'enviando', $4) RETURNING id`, [b.workspace_id, conv.id, text, t.buttons.length ? t.buttons : null])
  try {
    let externalId: string
    if (ch.kind === 'teste') externalId = 'teste.' + randomUUID()
    else externalId = await sendTemplate(d.send ?? fetch, ch.external_id, (await channelToken(d.service, b.channel_id!)).token, identity.external_id, { name: t.name, language: t.language, params })
    await d.service(`UPDATE inbox.messages SET external_id = $2, status = CASE WHEN status = 'enviando' THEN $3::inbox.message_status ELSE status END WHERE id = $1`,
      [msg.id, externalId, ch.kind === 'teste' ? 'entregue' : 'enviada'])
    return { messageId: msg.id, externalId }
  } catch (error) {
    const reason = error instanceof MetaError || error instanceof InboxError ? error.message : 'Falha inesperada ao enviar.'
    await d.service(`UPDATE inbox.messages SET status = 'falhou', error = $2 WHERE id = $1`, [msg.id, reason])
    if (error instanceof MetaError && error.tokenInvalid) await d.service(`UPDATE inbox.channels SET status = 'erro', last_error = $2 WHERE id = $1`, [b.channel_id, 'A Meta recusou o token. Conecte o canal de novo.'])
    throw Object.assign(new InboxError('SEND', reason), { messageId: msg.id })
  }
}

async function sendMail(d: BroadcastDeps, b: Broadcast, c: ContactRow, from: { from_name: string | null; from_email: string; reply_to: string | null; address: string | null }) {
  const ses = d.ses === undefined ? sesConfig() : d.ses
  if (!ses) throw new InboxError('EMAIL_OFF', 'Envio de e-mail desligado no servidor.')
  const vars = contactVars(c)
  const unsubscribeUrl = `${baseUrl(d)}/api/inbox/sair?t=${optoutToken(c.id)}`
  const text = fill(b.body ?? '', vars)
  const name = (from.from_name ?? '').replace(/["\r\n<>]/g, '').trim()
  const externalId = await sendEmail(d.send ?? fetch, ses, {
    from: name ? `"${name}" <${from.from_email}>` : from.from_email, to: c.email!, replyTo: from.reply_to,
    subject: fill(b.subject ?? '', vars).replace(/[\r\n]+/g, ' ').slice(0, 200), html: emailHtml(text, { address: from.address, unsubscribeUrl }),
    text: emailText(text, { address: from.address, unsubscribeUrl }), unsubscribeUrl,
  })
  return { messageId: null, externalId }
}

/** Minute work: starts scheduled broadcasts that are due, then sends the next batch of each one in progress. */
export async function runBroadcasts(d: BroadcastDeps, opts: { budgetMs?: number; batch?: number } = {}) {
  const until = Date.now() + (opts.budgetMs ?? 40000)
  const out = { iniciados: 0, enviados: 0, falhas: 0 }
  // A send interrupted mid-way (server stopped) is not repeated: a duplicate is worse than a miss.
  await d.service(`UPDATE inbox.broadcast_recipients SET status = 'falhou', error = 'Envio interrompido; não repetido para evitar mensagem duplicada.'
    WHERE status = 'enviando' AND sent_at < now() - interval '10 minutes'`)
  const due = await d.service<Broadcast>(`UPDATE inbox.broadcasts SET status = 'enviando' WHERE id IN (
      SELECT id FROM inbox.broadcasts WHERE status = 'agendado' AND scheduled_at <= now() ORDER BY scheduled_at LIMIT 5 FOR UPDATE SKIP LOCKED) RETURNING *`)
  for (const b of due) {
    try { await materialize(d.service, b, await checkReady(d.service, b, d.ses === undefined ? sesConfig() : d.ses)); out.iniciados++ } catch (error) {
      await d.service(`UPDATE inbox.broadcasts SET status = 'erro', error = $2, finished_at = now() WHERE id = $1`, [b.id, (error as Error).message.slice(0, 300)])
    }
  }
  const active = await d.service<Broadcast>(`SELECT * FROM inbox.broadcasts WHERE status = 'enviando' ORDER BY started_at LIMIT 20`)
  for (const b of active) {
    if (Date.now() > until) break
    const claimed = await d.service<{ contact_id: string }>(`UPDATE inbox.broadcast_recipients r SET status = 'enviando', sent_at = now()
      WHERE r.broadcast_id = $1 AND r.contact_id IN (SELECT contact_id FROM inbox.broadcast_recipients WHERE broadcast_id = $1 AND status = 'pendente'
        ORDER BY contact_id LIMIT ${opts.batch ?? BATCH} FOR UPDATE SKIP LOCKED) RETURNING r.contact_id`, [b.id])
    const template = b.kind === 'whatsapp' ? (await d.service<Template>('SELECT * FROM inbox.wa_templates WHERE id = $1', [b.template_id]))[0] : undefined
    const [from] = b.kind === 'email' ? await d.service<{ from_name: string | null; from_email: string; reply_to: string | null; address: string | null }>(
      'SELECT from_name, from_email, reply_to, address FROM inbox.email_settings WHERE workspace_id = $1', [b.workspace_id]) : []
    for (const { contact_id } of claimed) {
      const [c] = await d.service<ContactRow>('SELECT id, name, phone, email, source, fields FROM inbox.contacts WHERE id = $1', [contact_id])
      try {
        if (!c) throw new InboxError('GONE', 'Contato excluído.')
        const optedOut = await d.service(`SELECT 1 FROM inbox.optouts WHERE contact_id = $1 AND kind = $2`, [contact_id, b.kind])
        if (optedOut.length) { await d.service(`UPDATE inbox.broadcast_recipients SET status = 'ignorado', error = 'Pediu para não receber' WHERE broadcast_id = $1 AND contact_id = $2`, [b.id, contact_id]); continue }
        if (b.kind === 'whatsapp' && !template) throw new InboxError('GONE', 'O modelo foi excluído.')
        if (b.kind === 'email' && !from?.from_email) throw new InboxError('GONE', 'Remetente não configurado.')
        const r = b.kind === 'whatsapp' ? await sendWhatsApp(d, b, template!, c) : await sendMail(d, b, c, from!)
        await d.service(`UPDATE inbox.broadcast_recipients SET status = 'enviado', sent_at = now(), message_id = $3, external_id = $4, error = NULL WHERE broadcast_id = $1 AND contact_id = $2`,
          [b.id, contact_id, r.messageId, r.externalId])
        out.enviados++
      } catch (error) {
        const reason = error instanceof InboxError || error instanceof EmailError ? error.message : 'Falha inesperada ao enviar.'
        if (!(error instanceof InboxError || error instanceof EmailError)) console.error(JSON.stringify({ scope: 'inbox', code: 'BROADCAST_SEND_FAILED', message: (error as Error).message }))
        await d.service(`UPDATE inbox.broadcast_recipients SET status = 'falhou', error = $3, message_id = $4 WHERE broadcast_id = $1 AND contact_id = $2`,
          [b.id, contact_id, reason.slice(0, 300), (error as { messageId?: string }).messageId ?? null])
        out.falhas++
      }
      if (Date.now() > until) break
    }
    // Whatever was claimed but not reached goes back to the queue.
    await d.service(`UPDATE inbox.broadcast_recipients SET status = 'pendente', sent_at = NULL WHERE broadcast_id = $1 AND status = 'enviando' AND message_id IS NULL AND external_id IS NULL AND sent_at > now() - interval '5 minutes'
      AND contact_id = ANY($2::uuid[]) AND error IS NULL`, [b.id, claimed.map(x => x.contact_id)])
    await refreshCounts(d.service, b.id)
  }
  return out
}
