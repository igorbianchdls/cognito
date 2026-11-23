// The automation engine. Inbound messages, comments and (later) purchases start flows through their triggers; a run
// walks the published graph block by block, sending through the conversation's channel, and stops to wait for an
// answer (buttons, questions) or for time (the tick wakes it up). Runs with the service connection: no person.
import { fill, isOpen, type FlowNode, type Graph, type Hours, type Rule, type TriggerKind } from '../shared/flows'
import type { ChannelKind } from '../shared/rules'
import { InboxError, type Query } from './db'
import { deliver, loadTarget } from './send'
import { unseal } from './crypto'
import { replyToComment } from './meta'

export type EngineDeps = { service: Query; send?: typeof fetch; now?: () => Date }
type Run = { id: string; workspace_id: string; flow_id: string; contact_id: string; conversation_id: string | null; node_id: string | null; status: string; vars: Record<string, unknown>; steps: number }
type Trigger = { id: string; flow_id: string; kind: TriggerKind; channel_id: string | null; config: Record<string, unknown> }

const MAX_STEPS_PER_CALL = 50, MAX_STEPS_PER_RUN = 500
const LIVE = `('ativo', 'esperando_resposta', 'aguardando')`
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

async function event(d: EngineDeps, run: Pick<Run, 'workspace_id' | 'flow_id' | 'id'>, nodeId: string | null, kind: string, detail?: string) {
  await d.service('INSERT INTO inbox.flow_events (workspace_id, flow_id, run_id, node_id, kind, detail) VALUES ($1, $2, $3, $4, $5, $6)',
    [run.workspace_id, run.flow_id, run.id, nodeId, kind, detail?.slice(0, 500) ?? null])
}

async function graphOf(d: EngineDeps, flowId: string) {
  const [f] = await d.service<{ graph: Graph | null; status: string }>('SELECT graph, status FROM inbox.flows WHERE id = $1', [flowId])
  return f?.status === 'ativo' && f.graph ? f.graph : null
}

/** Starts a flow for a contact (stopping any other flow they are in). */
export async function startFlow(d: EngineDeps, o: { flowId: string; workspaceId: string; contactId: string; conversationId: string | null; vars?: Record<string, unknown> }) {
  const graph = await graphOf(d, o.flowId)
  if (!graph?.start) return null
  await d.service(`UPDATE inbox.flow_runs SET status = 'cancelado' WHERE contact_id = $1 AND status IN ${LIVE}`, [o.contactId])
  const [run] = await d.service<Run>(`INSERT INTO inbox.flow_runs (workspace_id, flow_id, contact_id, conversation_id, node_id, vars)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [o.workspaceId, o.flowId, o.contactId, o.conversationId, graph.start, o.vars ?? {}])
  await event(d, run, null, 'iniciou')
  await advance(d, run, graph)
  return run.id
}

async function values(d: EngineDeps, contactId: string) {
  const [c] = await d.service<{ name: string; phone: string | null; email: string | null; fields: Record<string, unknown> }>('SELECT name, phone, email, fields FROM inbox.contacts WHERE id = $1', [contactId])
  if (!c) return {}
  return { ...c.fields, nome: c.name, primeiro_nome: c.name.split(' ')[0], telefone: c.phone, email: c.email }
}

async function say(d: EngineDeps, run: Run, text: string, buttons?: string[]) {
  if (!run.conversation_id) throw new InboxError('NO_CONVERSATION', 'O contato ainda não tem conversa em nenhum canal.', 409)
  const target = await loadTarget(d.service, run.conversation_id)
  const commentId = typeof run.vars.comment_id === 'string' && !run.vars.comment_used ? run.vars.comment_id : undefined
  const result = await deliver(d.service, target, { texto: fill(text, { ...run.vars, ...await values(d, run.contact_id) }), botoes: buttons, commentId }, { send: d.send })
  if (commentId) { run.vars.comment_used = true; await d.service('UPDATE inbox.flow_runs SET vars = $2 WHERE id = $1', [run.id, run.vars]) }
  if (result.status === 'falhou') throw new InboxError('SEND_FAILED', result.erro ?? 'A mensagem não foi enviada.', 502)
}

async function check(d: EngineDeps, run: Run, rule: Rule) {
  switch (rule.tipo) {
    case 'etiqueta': {
      const [r] = await d.service('SELECT 1 FROM inbox.contact_tags WHERE contact_id = $1 AND tag_id = $2', [run.contact_id, rule.etiqueta])
      return rule.tem ? !!r : !r
    }
    case 'campo': {
      const v = (await values(d, run.contact_id) as Record<string, unknown>)[rule.campo]
      const s = v === undefined || v === null ? '' : norm(String(v)), want = norm(rule.valor ?? '')
      return rule.operador === 'existe' ? s !== '' : rule.operador === 'nao_existe' ? s === '' : rule.operador === 'igual' ? s === want : s.includes(want)
    }
    case 'horario': {
      const [s] = await d.service<{ business_hours: Hours; timezone: string }>('SELECT business_hours, timezone FROM inbox.settings WHERE workspace_id = $1', [run.workspace_id])
      const open = isOpen(s?.business_hours ?? null, s?.timezone, d.now?.())
      return rule.dentro ? open : !open
    }
    case 'canal': {
      if (!run.conversation_id) return false
      const [c] = await d.service<{ kind: ChannelKind }>('SELECT ch.kind FROM inbox.conversations c JOIN inbox.channels ch ON ch.id = c.channel_id WHERE c.id = $1', [run.conversation_id])
      return c?.kind === rule.canal
    }
  }
}

const save = (d: EngineDeps, run: Run, fields: { node?: string | null; status: string; wake?: Date | null; error?: string | null }) =>
  d.service(`UPDATE inbox.flow_runs SET node_id = $2, status = $3::inbox.run_status, wake_at = $4, error = $5, steps = $6, vars = $7 WHERE id = $1`,
    [run.id, fields.node === undefined ? run.node_id : fields.node, fields.status, fields.wake ?? null, fields.error ?? null, run.steps, run.vars])

/** Walks from run.node_id until the flow waits or ends. */
async function advance(d: EngineDeps, run: Run, graph: Graph) {
  const byId = new Map(graph.nodes.map(n => [n.id, n]))
  for (let i = 0; i < MAX_STEPS_PER_CALL; i++) {
    const node = run.node_id ? byId.get(run.node_id) : undefined
    if (!node) { await save(d, run, { node: null, status: 'concluido' }); await event(d, run, null, 'concluiu'); return }
    if (++run.steps > MAX_STEPS_PER_RUN) { await save(d, run, { status: 'erro', error: 'A automação passou de 500 passos (laço?).' }); await event(d, run, node.id, 'erro', 'laço'); return }
    await event(d, run, node.id, 'entrou')
    let next: Awaited<ReturnType<typeof step>>
    try {
      next = await step(d, run, node)
    } catch (error) {
      const message = error instanceof InboxError ? error.message : 'Falha inesperada.'
      if (!(error instanceof InboxError)) console.error(JSON.stringify({ scope: 'inbox', code: 'FLOW_STEP_FAILED', run: run.id, message: (error as Error).message }))
      await save(d, run, { status: 'erro', error: message }); await event(d, run, node.id, 'erro', message); return
    }
    if (next === WAIT) return
    if (next === JUMP) { const other = await graphOf(d, run.flow_id); if (!other) { await save(d, run, { status: 'erro', error: 'A automação de destino não está ativa.' }); return } graph = other; byId.clear(); for (const n of other.nodes) byId.set(n.id, n); continue }
    run.node_id = (next as string | null | undefined) ?? null
  }
  await save(d, run, { status: 'ativo' })
}

const WAIT = Symbol('wait'), JUMP = Symbol('jump')

/** Runs one block; returns the next block id, WAIT (stop here) or JUMP (another flow). */
async function step(d: EngineDeps, run: Run, n: FlowNode): Promise<string | null | undefined | typeof WAIT | typeof JUMP> {
  switch (n.type) {
    case 'mensagem':
      await say(d, run, n.texto, n.botoes?.map(b => b.label))
      if (n.botoes?.length) { await save(d, run, { status: 'esperando_resposta' }); return WAIT }
      return n.next
    case 'pergunta':
      await say(d, run, n.texto)
      await save(d, run, { status: 'esperando_resposta' }); return WAIT
    case 'condicao':
      return (await check(d, run, n.regra)) ? n.sim : n.nao
    case 'etiqueta':
      if (n.acao === 'colocar') await d.service(`INSERT INTO inbox.contact_tags (workspace_id, contact_id, tag_id) SELECT $1, $2, id FROM inbox.tags WHERE id = $3 AND workspace_id = $1 ON CONFLICT DO NOTHING`, [run.workspace_id, run.contact_id, n.etiqueta])
      else await d.service('DELETE FROM inbox.contact_tags WHERE contact_id = $1 AND tag_id = $2', [run.contact_id, n.etiqueta])
      return n.next
    case 'campo':
      await d.service(`UPDATE inbox.contacts SET fields = fields || jsonb_build_object($2::text, $3::text) WHERE id = $1`, [run.contact_id, n.campo, fill(n.valor, await values(d, run.contact_id))])
      return n.next
    case 'esperar': {
      const now = d.now?.() ?? new Date()
      await save(d, run, { status: 'aguardando', wake: new Date(now.getTime() + n.minutos * 60000) }); return WAIT
    }
    case 'humano':
      if (n.texto?.trim()) await say(d, run, n.texto)
      if (run.conversation_id) {
        await d.service(`UPDATE inbox.conversations SET status = 'aberta', unread = greatest(unread, 1) WHERE id = $1`, [run.conversation_id])
        const [f] = await d.service<{ name: string }>('SELECT name FROM inbox.flows WHERE id = $1', [run.flow_id])
        await d.service('INSERT INTO inbox.notes (workspace_id, conversation_id, body, author) VALUES ($1, $2, $3, NULL)',
          [run.workspace_id, run.conversation_id, `A automação "${f?.name ?? ''}" passou a conversa para a equipe.`])
      }
      return null
    case 'webhook': {
      const v = await values(d, run.contact_id)
      const ok = await (d.send ?? fetch)(n.url, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ evento: 'automacao', contato_id: run.contact_id, conversa_id: run.conversation_id, contato: v }) }).then(r => r.ok).catch(() => false)
      if (!ok) await event(d, run, n.id, 'erro', 'O link externo não respondeu com sucesso.')
      return n.next
    }
    case 'ir_para': {
      const [f] = await d.service<{ graph: Graph | null; status: string; workspace_id: string }>('SELECT graph, status, workspace_id FROM inbox.flows WHERE id = $1', [n.fluxo])
      if (!f?.graph?.start || f.status !== 'ativo' || f.workspace_id !== run.workspace_id) throw new InboxError('BAD_TARGET', 'A automação de destino não está ativa.', 409)
      run.flow_id = n.fluxo; run.node_id = f.graph.start
      await d.service('UPDATE inbox.flow_runs SET flow_id = $2 WHERE id = $1', [run.id, n.fluxo])
      await event(d, run, null, 'iniciou')
      return JUMP
    }
    case 'ia':
      return (await aiStep?.(d, run)) ?? n.next
    case 'negocio':
      await dealStep?.(d, run, n)
      return n.next
  }
}

/** Filled by later stages (AI and deals) without this module importing them. */
export let aiStep: ((d: EngineDeps, run: Run) => Promise<string | null | undefined>) | undefined
export let dealStep: ((d: EngineDeps, run: Run, n: Extract<FlowNode, { type: 'negocio' }>) => Promise<void>) | undefined
export function registerSteps(steps: { ai?: typeof aiStep; deal?: typeof dealStep }) { if (steps.ai) aiStep = steps.ai; if (steps.deal) dealStep = steps.deal }

const VALID = { email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, telefone: /^\+?[0-9 ()-]{8,20}$/, numero: /^-?[0-9]+([.,][0-9]+)?$/, texto: /\S/ }

/** An answer to the block the run is waiting on. Returns true when it was consumed by the run. */
async function resume(d: EngineDeps, run: Run, text: string) {
  const graph = await graphOf(d, run.flow_id)
  const node = graph?.nodes.find(n => n.id === run.node_id)
  if (!graph || !node) { await save(d, run, { status: 'cancelado' }); return false }
  if (node.type === 'mensagem' && node.botoes?.length) {
    const hit = node.botoes.find(b => norm(b.label) === norm(text)) ?? node.botoes.find(b => norm(text).startsWith(norm(b.label)))
    if (!hit) { await save(d, run, { status: 'concluido' }); await event(d, run, node.id, 'saiu', text); return false }
    await event(d, run, node.id, 'clicou', hit.label)
    run.node_id = hit.next ?? null
  } else if (node.type === 'pergunta') {
    if (node.validar && !VALID[node.validar].test(text.trim())) {
      await say(d, run, node.validar === 'email' ? 'Não entendi o e-mail. Pode mandar de novo? Ex.: nome@email.com' : node.validar === 'telefone' ? 'Não entendi o telefone. Pode mandar com DDD?' : 'Pode responder só com um número?')
      await save(d, run, { status: 'esperando_resposta' })  // keeps waiting for a valid answer
      return true
    }
    const value = text.trim().slice(0, 500)
    await d.service(`UPDATE inbox.contacts SET fields = fields || jsonb_build_object($2::text, $3::text) WHERE id = $1`, [run.contact_id, node.campo, value])
    if (node.campo === 'email' && VALID.email.test(value)) await d.service('UPDATE inbox.contacts SET email = coalesce(email, lower($2)) WHERE id = $1', [run.contact_id, value])
    await event(d, run, node.id, 'respondeu')
    run.node_id = node.next ?? null
  } else { await save(d, run, { status: 'cancelado' }); return false }
  await save(d, run, { status: 'ativo' })
  await advance(d, run, graph)
  return true
}

async function triggersOf(d: EngineDeps, workspaceId: string, kinds: TriggerKind[], channelId: string | null) {
  return d.service<Trigger>(`SELECT t.id, t.flow_id, t.kind, t.channel_id, t.config FROM inbox.triggers t JOIN inbox.flows f ON f.id = t.flow_id
    WHERE t.workspace_id = $1 AND t.active AND f.status = 'ativo' AND t.kind = ANY($2::inbox.trigger_kind[]) AND (t.channel_id IS NULL OR t.channel_id = $3)
    ORDER BY t.created_at`, [workspaceId, kinds, channelId])
}
const words = (c: Record<string, unknown>) => (Array.isArray(c.palavras) ? c.palavras : []).map(w => norm(String(w))).filter(Boolean)
const matches = (c: Record<string, unknown>, text: string) => {
  const ws = words(c), t = norm(text)
  if (!ws.length) return true
  return c.modo === 'igual' ? ws.includes(t) : ws.some(w => t.includes(w))
}

export type InboundCtx = { workspaceId: string; channelId: string; contactId: string; conversationId: string; text: string; isNew: boolean; ref?: string; story?: boolean }

/** A new message from a customer: answer a waiting run, or start the first flow whose trigger matches. */
export async function onInbound(d: EngineDeps, c: InboundCtx) {
  const [waiting] = await d.service<Run>(`UPDATE inbox.flow_runs SET status = 'ativo' WHERE id = (
      SELECT id FROM inbox.flow_runs WHERE contact_id = $1 AND status = 'esperando_resposta' ORDER BY updated_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING *`, [c.contactId])
  if (waiting) {
    if (waiting.conversation_id !== c.conversationId) { waiting.conversation_id = c.conversationId; await d.service('UPDATE inbox.flow_runs SET conversation_id = $2 WHERE id = $1', [waiting.id, c.conversationId]) }
    if (await resume(d, waiting, c.text)) return 'continuou'
  }
  const triggers = await triggersOf(d, c.workspaceId, ['link_ref', 'story', 'palavra_chave', 'primeira_mensagem', 'fora_do_horario'], c.channelId)
  const start = (t: Trigger, vars: Record<string, unknown> = {}) => startFlow(d, { flowId: t.flow_id, workspaceId: c.workspaceId, contactId: c.contactId, conversationId: c.conversationId, vars })
  const text = c.text ?? ''
  // 1. Link or ad with a code: "wa.me/…?text=…CODIGO…" or an Instagram/Messenger referral.
  for (const t of triggers.filter(t => t.kind === 'link_ref')) {
    const code = norm(String(t.config.codigo ?? ''))
    if (code && (norm(c.ref ?? '') === code || norm(text).includes(code))) {
      await d.service('UPDATE inbox.contacts SET source = coalesce(source, $2) WHERE id = $1', [c.contactId, String(t.config.codigo).slice(0, 120)])
      await start(t, { ref: t.config.codigo }); return 'link'
    }
  }
  if (c.ref) await d.service('UPDATE inbox.contacts SET source = coalesce(source, $2) WHERE id = $1', [c.contactId, c.ref.slice(0, 120)])
  if (c.story) for (const t of triggers.filter(t => t.kind === 'story')) if (matches(t.config, text)) { await start(t); return 'story' }
  for (const t of triggers.filter(t => t.kind === 'palavra_chave')) if (words(t.config).length && matches(t.config, text)) { await start(t); return 'palavra' }
  const [live] = await d.service(`SELECT 1 FROM inbox.flow_runs WHERE contact_id = $1 AND status IN ${LIVE}`, [c.contactId])
  if (live) return null
  if (c.isNew) for (const t of triggers.filter(t => t.kind === 'primeira_mensagem')) { await start(t); return 'primeira' }
  const outside = triggers.filter(t => t.kind === 'fora_do_horario')
  if (outside.length) {
    const [s] = await d.service<{ business_hours: Hours; timezone: string }>('SELECT business_hours, timezone FROM inbox.settings WHERE workspace_id = $1', [c.workspaceId])
    if (!isOpen(s?.business_hours ?? null, s?.timezone, d.now?.())) {
      // At most once every 12 hours per contact.
      const [recent] = await d.service(`SELECT 1 FROM inbox.flow_runs r JOIN inbox.triggers t ON t.flow_id = r.flow_id AND t.kind = 'fora_do_horario'
        WHERE r.contact_id = $1 AND r.started_at > now() - interval '12 hours'`, [c.contactId])
      if (!recent) { await start(outside[0]); return 'fora_do_horario' }
    }
  }
  return null
}

export type CommentCtx = { workspaceId: string; channelId: string; channelKind: ChannelKind; contactId: string; conversationId: string; commentId: string; postId?: string; text: string }

/** A comment on a post: the first matching trigger answers in private (and, if set, in public). */
export async function onComment(d: EngineDeps, c: CommentCtx) {
  for (const t of await triggersOf(d, c.workspaceId, ['comentario'], c.channelId)) {
    if (t.config.post && String(t.config.post) !== c.postId) continue
    if (!matches(t.config, c.text)) continue
    const publicReply = typeof t.config.resposta_publica === 'string' ? t.config.resposta_publica.trim() : ''
    if (publicReply && c.channelKind !== 'teste') {
      const [cred] = await d.service<{ token_sealed: string }>('SELECT token_sealed FROM inbox_private.channel_credentials WHERE channel_id = $1', [c.channelId])
      if (cred) await replyToComment(d.send ?? fetch, c.channelKind, unseal(cred.token_sealed), c.commentId, publicReply).catch(error =>
        console.error(JSON.stringify({ scope: 'inbox', code: 'COMMENT_REPLY_FAILED', message: (error as Error).message })))
    }
    await startFlow(d, { flowId: t.flow_id, workspaceId: c.workspaceId, contactId: c.contactId, conversationId: c.conversationId, vars: { comment_id: c.commentId } })
    return true
  }
  return false
}

/** A business event for a contact (compra, reembolso, carrinho_abandonado): starts the first matching flow. */
export async function onEvent(d: EngineDeps, e: { workspaceId: string; kind: 'compra' | 'reembolso' | 'carrinho_abandonado'; contactId: string; product?: string; vars?: Record<string, unknown> }) {
  const [conv] = await d.service<{ id: string; channel_id: string }>(`SELECT id, channel_id FROM inbox.conversations WHERE contact_id = $1 ORDER BY last_inbound_at DESC NULLS LAST LIMIT 1`, [e.contactId])
  for (const t of await triggersOf(d, e.workspaceId, [e.kind], conv?.channel_id ?? null)) {
    if (t.config.produto && e.product && !norm(e.product).includes(norm(String(t.config.produto)))) continue
    return startFlow(d, { flowId: t.flow_id, workspaceId: e.workspaceId, contactId: e.contactId, conversationId: conv?.id ?? null, vars: e.vars })
  }
  return null
}

/** The minute tick: wakes runs whose wait is over and expires answers that never came (3 days). */
export async function wakeRuns(d: EngineDeps, limit = 100) {
  const due = await d.service<Run>(`UPDATE inbox.flow_runs SET status = 'ativo', wake_at = NULL WHERE id IN (
      SELECT id FROM inbox.flow_runs WHERE status = 'aguardando' AND wake_at <= $1 ORDER BY wake_at LIMIT $2 FOR UPDATE SKIP LOCKED) RETURNING *`, [d.now?.() ?? new Date(), limit])
  for (const run of due) {
    const graph = await graphOf(d, run.flow_id)
    const node = graph?.nodes.find(n => n.id === run.node_id)
    if (!graph || !node || node.type !== 'esperar') { await save(d, run, { status: 'cancelado' }); continue }
    run.node_id = node.next ?? null
    await advance(d, run, graph)
  }
  const expired = await d.service(`UPDATE inbox.flow_runs SET status = 'expirado' WHERE status = 'esperando_resposta' AND updated_at < now() - interval '3 days' RETURNING id`)
  return { acordadas: due.length, expiradas: expired.length }
}
