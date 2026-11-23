// Teams: who gets a new conversation (round-robin among the available members of the channel's team), the response-time
// alert (SLA) and the rating asked when a conversation is closed. Runs with the service connection (webhook and tick).
import type { Query } from './db'
import { deliver, loadTarget } from './send'
import { windowOpen, type ChannelKind } from '../shared/rules'

export const DEFAULT_CSAT = 'Como você avalia nosso atendimento? Responda com uma nota de 1 a 5.'
export const CSAT_OPTIONS = ['5 - Excelente', '4 - Bom', '3 - Regular', '2 - Ruim', '1 - Péssimo']

/**
 * A conversation without an assignee goes to its team (or the channel's team); when the team distributes automatically,
 * to the available member who received one longest ago. Returns the person chosen, if any.
 */
export async function routeConversation(service: Query, conversationId: string) {
  const [c] = await service<{ assignee: string | null; team_id: string | null; channel_team: string | null }>(`SELECT c.assignee, c.team_id, ch.team_id AS channel_team
    FROM inbox.conversations c JOIN inbox.channels ch ON ch.id = c.channel_id WHERE c.id = $1`, [conversationId])
  if (!c || c.assignee) return null
  const teamId = c.team_id ?? c.channel_team
  if (!teamId) return null
  if (!c.team_id) await service('UPDATE inbox.conversations SET team_id = $2 WHERE id = $1 AND team_id IS NULL', [conversationId, teamId])
  const [team] = await service<{ auto_assign: boolean }>('SELECT auto_assign FROM inbox.teams WHERE id = $1', [teamId])
  if (!team?.auto_assign) return null
  const [picked] = await service<{ user_id: string }>(`UPDATE inbox.team_members m SET last_assigned_at = clock_timestamp()
    WHERE (m.team_id, m.user_id) = (SELECT team_id, user_id FROM inbox.team_members WHERE team_id = $1 AND available
      ORDER BY last_assigned_at NULLS FIRST, user_id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING m.user_id`, [teamId])
  if (!picked) return null
  const done = await service('UPDATE inbox.conversations SET assignee = $2 WHERE id = $1 AND assignee IS NULL RETURNING 1', [conversationId, picked.user_id])
  return done.length ? picked.user_id : null
}

/** Minute work: a note in each conversation whose customer has waited past the team's (or the company's) limit. */
export async function slaAlerts(service: Query) {
  const late = await service<{ id: string; workspace_id: string; minutes: number }>(`UPDATE inbox.conversations c SET sla_alerted_at = now()
    FROM (SELECT c2.id, coalesce(t.sla_minutes, s.sla_minutes) AS minutes FROM inbox.conversations c2
      LEFT JOIN inbox.teams t ON t.id = c2.team_id LEFT JOIN inbox.settings s ON s.workspace_id = c2.workspace_id
      WHERE c2.waiting_since IS NOT NULL AND c2.sla_alerted_at IS NULL AND c2.status <> 'fechada'
        AND coalesce(t.sla_minutes, s.sla_minutes) IS NOT NULL
        AND c2.waiting_since < now() - make_interval(mins => coalesce(t.sla_minutes, s.sla_minutes))
      LIMIT 200) x
    WHERE c.id = x.id RETURNING c.id, c.workspace_id, x.minutes`)
  for (const c of late) {
    await service('INSERT INTO inbox.notes (workspace_id, conversation_id, body, author) VALUES ($1, $2, $3, NULL)',
      [c.workspace_id, c.id, `⏰ Prazo de resposta passou: o cliente está esperando há mais de ${c.minutes} min.`])
  }
  return { alertas: late.length }
}

/** Minute work: asks for a rating in conversations closed in the last hour (when the company turned it on). */
export async function askRatings(d: { service: Query; send?: typeof fetch }) {
  const due = await d.service<{ id: string; csat_text: string | null; kind: ChannelKind; last_inbound_at: string | null }>(`SELECT c.id, s.csat_text, ch.kind, c.last_inbound_at
    FROM inbox.conversations c JOIN inbox.settings s ON s.workspace_id = c.workspace_id AND s.csat_enabled JOIN inbox.channels ch ON ch.id = c.channel_id
    WHERE c.status = 'fechada' AND c.closed_at > now() - interval '1 hour' AND c.closed_at < now() - interval '1 minute'
      AND (c.rating_requested_at IS NULL OR c.rating_requested_at < c.closed_at)
      AND NOT EXISTS (SELECT 1 FROM inbox.ratings r WHERE r.conversation_id = c.id AND r.created_at > now() - interval '1 day')
    ORDER BY c.closed_at LIMIT 50`)
  let n = 0
  for (const c of due) {
    // Mark first: a slow send must not make the next tick ask again.
    await d.service('UPDATE inbox.conversations SET rating_requested_at = clock_timestamp() WHERE id = $1', [c.id])
    if (!windowOpen(c.kind, c.last_inbound_at)) continue
    const r = await deliver(d.service, await loadTarget(d.service, c.id), { texto: c.csat_text?.trim() || DEFAULT_CSAT, botoes: CSAT_OPTIONS }, { send: d.send }).catch(() => null)
    if (r && r.status !== 'falhou') n++
  }
  return { avaliacoes_pedidas: n }
}

/**
 * The customer's answer to the rating question (within a day): stored with who attended, thanked, and the conversation
 * stays closed. Returns true when the message was this.
 */
export async function handleRating(d: { service: Query; send?: typeof fetch }, c: { conversationId: string; contactId: string; text: string }) {
  const m = /^\s*([1-5])(?:\s|$|\s*-|\s*⭐)/.exec(c.text)
  if (!m) return false
  const [conv] = await d.service<{ workspace_id: string; assignee: string | null; team_id: string | null }>(`SELECT workspace_id, assignee, team_id FROM inbox.conversations c
    WHERE id = $1 AND rating_requested_at > now() - interval '1 day'
      AND NOT EXISTS (SELECT 1 FROM inbox.ratings r WHERE r.conversation_id = c.id AND r.created_at > c.rating_requested_at)`, [c.conversationId])
  if (!conv) return false
  await d.service('INSERT INTO inbox.ratings (workspace_id, conversation_id, contact_id, assignee, team_id, score) VALUES ($1, $2, $3, $4, $5, $6)',
    [conv.workspace_id, c.conversationId, c.contactId, conv.assignee, conv.team_id, Number(m[1])])
  await deliver(d.service, await loadTarget(d.service, c.conversationId), { texto: 'Obrigado pela avaliação! 💙' }, { send: d.send }).catch(() => undefined)
  await d.service(`UPDATE inbox.conversations SET status = 'fechada', unread = 0 WHERE id = $1`, [c.conversationId])
  // rating_requested_at stays as is: the rating now exists after it, so another number is a normal message.
  return true
}
