// Deals moved by the rest of the Inbox (no person): automations create or move a deal; an approved purchase wins the
// contact's open deals. The screens use the browser client directly (row level security).
import { fill } from '../shared/flows'
import type { Query } from './db'

type RunLike = { workspace_id: string; contact_id: string; vars: Record<string, unknown> }

/** "Criar negócio" block: moves the contact's open deal in that pipeline to the stage, or creates one there. */
export async function dealFromFlow(service: Query, run: RunLike, n: { funil: string; etapa: string; titulo?: string }) {
  const [stage] = await service<{ id: string }>(`SELECT s.id FROM inbox.pipeline_stages s JOIN inbox.pipelines p ON p.id = s.pipeline_id
    WHERE s.id = $1 AND p.id = $2 AND p.workspace_id = $3`, [n.etapa, n.funil, run.workspace_id])
  if (!stage) return
  const moved = await service(`UPDATE inbox.deals d SET stage_id = $1 FROM inbox.pipeline_stages s
    WHERE d.stage_id = s.id AND s.kind = 'aberto' AND d.contact_id = $2 AND d.pipeline_id = $3 RETURNING d.id`, [n.etapa, run.contact_id, n.funil])
  if (moved.length) return
  const [c] = await service<{ name: string; fields: Record<string, unknown>; email: string | null; phone: string | null }>('SELECT name, fields, email, phone FROM inbox.contacts WHERE id = $1', [run.contact_id])
  const title = fill(n.titulo?.trim() || 'Negócio de {{nome}}', { ...run.vars, ...(c?.fields ?? {}), nome: c?.name, primeiro_nome: c?.name.split(' ')[0] }).slice(0, 160) || 'Negócio'
  await service(`INSERT INTO inbox.deals (workspace_id, pipeline_id, stage_id, contact_id, title, position) VALUES ($1, $2, $3, $4, $5, extract(epoch from now()))`,
    [run.workspace_id, n.funil, n.etapa, run.contact_id, title])
}

/** An approved purchase: the contact's open deals go to the first "ganho" stage of their pipeline (value kept or filled). */
export async function wonFromPurchase(service: Query, workspaceId: string, contactId: string, amount: number | null) {
  await service(`UPDATE inbox.deals d SET value = coalesce(d.value, $3),
      stage_id = (SELECT x.id FROM inbox.pipeline_stages x WHERE x.pipeline_id = d.pipeline_id AND x.kind = 'ganho' ORDER BY x.position LIMIT 1)
    FROM inbox.pipeline_stages s
    WHERE d.stage_id = s.id AND s.kind = 'aberto' AND d.contact_id = $1 AND d.workspace_id = $2
      AND EXISTS (SELECT 1 FROM inbox.pipeline_stages x WHERE x.pipeline_id = d.pipeline_id AND x.kind = 'ganho')`, [contactId, workspaceId, amount])
}
