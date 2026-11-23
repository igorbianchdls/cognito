// Inbox reports for a period: service (response time, ratings, per person), sales by lead source, the pipeline,
// automations/AI and broadcasts. Read "as the person" (row level security), so it serves the screen and the plugin.
import { InboxError, type Db, type Person, type Query } from './db'

const DAY = /^\d{4}-\d{2}-\d{2}$/
/** Period in Brasília time (AAAA-MM-DD, both days included); default: the last 30 days. */
export function period(de?: unknown, ate?: unknown, now = new Date()) {
  const today = new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 10)
  const end = typeof ate === 'string' && DAY.test(ate) ? ate : today
  const start = typeof de === 'string' && DAY.test(de) ? de : new Date(new Date(end + 'T12:00:00Z').getTime() - 29 * 86400_000).toISOString().slice(0, 10)
  if (start > end) throw new InboxError('INVALID', 'A data inicial é depois da final.')
  if ((new Date(end).getTime() - new Date(start).getTime()) / 86400_000 > 366) throw new InboxError('INVALID', 'Escolha um período de até um ano.')
  return { de: start, ate: end, from: `${start}T00:00:00-03:00`, to: `${end}T23:59:59.999-03:00` }
}

const n = (v: unknown) => (v == null ? null : Number(v))
const mins = (v: unknown) => (v == null ? null : Math.round(Number(v) / 6) / 10)

export async function report(q: Query, ws: string, p: ReturnType<typeof period>) {
  const args = [ws, p.from, p.to]
  const [service] = await q<Record<string, unknown>>(`SELECT
      count(*) FILTER (WHERE created_at BETWEEN $2 AND $3) AS novas,
      count(*) FILTER (WHERE closed_at BETWEEN $2 AND $3) AS encerradas,
      count(*) FILTER (WHERE status <> 'fechada') AS em_andamento,
      count(*) FILTER (WHERE status <> 'fechada' AND assignee IS NULL) AS sem_responsavel,
      count(*) FILTER (WHERE status <> 'fechada' AND sla_alerted_at IS NOT NULL) AS atrasadas,
      avg(extract(epoch FROM first_response_at - created_at)) FILTER (WHERE created_at BETWEEN $2 AND $3 AND first_response_at IS NOT NULL) AS primeira_resposta_s,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM first_response_at - created_at)) FILTER (WHERE created_at BETWEEN $2 AND $3 AND first_response_at IS NOT NULL) AS primeira_resposta_mediana_s
    FROM inbox.conversations WHERE workspace_id = $1`, args)
  const [ratings] = await q<Record<string, unknown>>(`SELECT count(*) AS total, avg(score) AS media,
      count(*) FILTER (WHERE score >= 4) AS boas, count(*) FILTER (WHERE score <= 2) AS ruins
    FROM inbox.ratings WHERE workspace_id = $1 AND created_at BETWEEN $2 AND $3`, args)
  const people = await q<Record<string, unknown>>(`SELECT x.who,
      count(*) FILTER (WHERE x.closed) AS encerradas, count(*) FILTER (WHERE x.open) AS em_andamento, avg(x.frt) AS primeira_resposta_s,
      (SELECT avg(r.score) FROM inbox.ratings r WHERE r.workspace_id = $1 AND r.assignee = x.who AND r.created_at BETWEEN $2 AND $3) AS avaliacao,
      (SELECT count(*) FROM inbox.ratings r WHERE r.workspace_id = $1 AND r.assignee = x.who AND r.created_at BETWEEN $2 AND $3) AS avaliacoes
    FROM (SELECT assignee AS who, closed_at BETWEEN $2 AND $3 AS closed, status <> 'fechada' AS open,
            CASE WHEN created_at BETWEEN $2 AND $3 THEN extract(epoch FROM first_response_at - created_at) END AS frt
          FROM inbox.conversations WHERE workspace_id = $1 AND assignee IS NOT NULL) x
    GROUP BY x.who HAVING count(*) FILTER (WHERE x.closed OR x.open) > 0 ORDER BY 2 DESC, 3 DESC LIMIT 50`, args)
  const [sales] = await q<Record<string, unknown>>(`SELECT count(*) FILTER (WHERE status = 'aprovada') AS vendas, coalesce(sum(amount) FILTER (WHERE status = 'aprovada'), 0) AS receita,
      count(*) FILTER (WHERE status IN ('reembolsada', 'chargeback')) AS reembolsos, coalesce(sum(amount) FILTER (WHERE status IN ('reembolsada', 'chargeback')), 0) AS reembolsado,
      count(DISTINCT contact_id) FILTER (WHERE status = 'aprovada') AS compradores
    FROM inbox.purchases WHERE workspace_id = $1 AND occurred_at BETWEEN $2 AND $3`, args)
  const sources = await q<Record<string, unknown>>(`WITH leads AS (
      SELECT coalesce(nullif(source, ''), 'sem origem') AS origem, count(*) AS leads FROM inbox.contacts
      WHERE workspace_id = $1 AND created_at BETWEEN $2 AND $3 GROUP BY 1),
    sold AS (
      SELECT coalesce(nullif(k.source, ''), 'sem origem') AS origem, count(*) AS vendas, coalesce(sum(p.amount), 0) AS receita
      FROM inbox.purchases p JOIN inbox.contacts k ON k.id = p.contact_id
      WHERE p.workspace_id = $1 AND p.status = 'aprovada' AND p.occurred_at BETWEEN $2 AND $3 GROUP BY 1)
    SELECT coalesce(l.origem, s.origem) AS origem, coalesce(l.leads, 0) AS leads, coalesce(s.vendas, 0) AS vendas, coalesce(s.receita, 0) AS receita
    FROM leads l FULL JOIN sold s ON s.origem = l.origem ORDER BY 4 DESC, 2 DESC LIMIT 30`, args)
  const [deals] = await q<Record<string, unknown>>(`SELECT
      count(*) FILTER (WHERE s.kind = 'aberto') AS abertos, coalesce(sum(d.value) FILTER (WHERE s.kind = 'aberto'), 0) AS valor_aberto,
      count(*) FILTER (WHERE s.kind = 'ganho' AND d.closed_at BETWEEN $2 AND $3) AS ganhos, coalesce(sum(d.value) FILTER (WHERE s.kind = 'ganho' AND d.closed_at BETWEEN $2 AND $3), 0) AS valor_ganho,
      count(*) FILTER (WHERE s.kind = 'perdido' AND d.closed_at BETWEEN $2 AND $3) AS perdidos
    FROM inbox.deals d JOIN inbox.pipeline_stages s ON s.id = d.stage_id WHERE d.workspace_id = $1`, args)
  const [flows] = await q<Record<string, unknown>>(`SELECT count(*) FILTER (WHERE kind = 'iniciou') AS iniciadas, count(*) FILTER (WHERE kind = 'concluiu') AS concluidas,
      count(*) FILTER (WHERE kind = 'ia_respondeu') AS ia_respostas, count(*) FILTER (WHERE kind = 'ia_passou') AS ia_passou_para_equipe
    FROM inbox.flow_events WHERE workspace_id = $1 AND created_at BETWEEN $2 AND $3`, args)
  const [bc] = await q<Record<string, unknown>>(`SELECT count(*) AS disparos, coalesce(sum(sent), 0) AS enviados, coalesce(sum(failed), 0) AS falhas, coalesce(sum(skipped), 0) AS ignorados
    FROM inbox.broadcasts WHERE workspace_id = $1 AND started_at BETWEEN $2 AND $3`, args)
  const won = n(deals.ganhos) ?? 0, lost = n(deals.perdidos) ?? 0
  return {
    periodo: { de: p.de, ate: p.ate },
    atendimento: {
      conversas_novas: n(service.novas), encerradas: n(service.encerradas), em_andamento: n(service.em_andamento), sem_responsavel: n(service.sem_responsavel), atrasadas: n(service.atrasadas),
      primeira_resposta_media_min: mins(service.primeira_resposta_s), primeira_resposta_mediana_min: mins(service.primeira_resposta_mediana_s),
    },
    avaliacoes: { total: n(ratings.total), media: ratings.media == null ? null : Math.round(Number(ratings.media) * 10) / 10, boas_4_5: n(ratings.boas), ruins_1_2: n(ratings.ruins) },
    por_responsavel: people.map(r => ({ responsavel_id: String(r.who), encerradas: n(r.encerradas), em_andamento: n(r.em_andamento), primeira_resposta_media_min: mins(r.primeira_resposta_s),
      avaliacao_media: r.avaliacao == null ? null : Math.round(Number(r.avaliacao) * 10) / 10, avaliacoes: n(r.avaliacoes) })),
    vendas: { vendas: n(sales.vendas), receita: n(sales.receita), compradores: n(sales.compradores), reembolsos: n(sales.reembolsos), valor_reembolsado: n(sales.reembolsado) },
    por_origem: sources.map(r => ({ origem: String(r.origem), leads_novos: n(r.leads), vendas: n(r.vendas), receita: n(r.receita) })).filter(r => r.leads_novos || r.vendas),
    negocios: { abertos: n(deals.abertos), valor_em_aberto: n(deals.valor_aberto), ganhos: won, valor_ganho: n(deals.valor_ganho), perdidos: lost,
      taxa_de_ganho: won + lost ? Math.round((won / (won + lost)) * 1000) / 10 : null },
    automacoes: { iniciadas: n(flows.iniciadas), concluidas: n(flows.concluidas), ia_respostas: n(flows.ia_respostas), ia_passou_para_equipe: n(flows.ia_passou_para_equipe) },
    disparos: { disparos: n(bc.disparos), enviados: n(bc.enviados), falhas: n(bc.falhas), ignorados: n(bc.ignorados) },
  }
}
export type InboxReport = Awaited<ReturnType<typeof report>>

/** GET /api/inbox/relatorios?de=&ate= */
export async function reportFor(who: Person, input: { de?: unknown; ate?: unknown }, db: Db) {
  const p = period(input.de, input.ate)
  return db.asPerson(who, q => report(q, who.orgId, p))
}
