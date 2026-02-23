import { runQuery } from '@/lib/postgres'
import type { ParsedContabilidadeRequest } from '../query/parseContabilidadeRequest'

type Input = { parsed: ParsedContabilidadeRequest }

export async function maybeHandleContabilidadeOrcamentosView({ parsed }: Input): Promise<Response | null> {
  const { view } = parsed
  if (view !== 'orcamentos') return null

  const sql = `
    SELECT
      o.id            AS orcamento_id,
      o.nome          AS orcamento_nome,
      o.ano           AS orcamento_ano,
      o.versao        AS orcamento_versao,
      o.status        AS orcamento_status,
      o.descricao     AS orcamento_descricao,
      o.criado_em     AS orcamento_criado_em,
      o.atualizado_em AS orcamento_atualizado_em,

      l.id            AS linha_id,
      l.mes           AS linha_mes,
      l.valor_debito  AS valor_debito,
      l.valor_credito AS valor_credito,
      l.observacao    AS linha_observacao,
      l.criado_em     AS linha_criado_em,
      l.atualizado_em AS linha_atualizado_em,

      pc.id           AS plano_conta_id,
      pc.codigo       AS plano_conta_codigo,
      pc.nome         AS plano_conta_nome

    FROM contabilidade.orcamentos_contabeis o
    LEFT JOIN contabilidade.orcamentos_contabeis_linhas l
      ON l.orcamento_id = o.id
    LEFT JOIN contabilidade.plano_contas pc
      ON pc.id = l.conta_id
    ORDER BY
      o.ano DESC,
      o.nome,
      o.versao,
      l.mes,
      pc.codigo`

  const rows = await runQuery<Record<string, unknown>>(sql, [])
  return Response.json({ success: true, view, rows, sql }, { headers: { 'Cache-Control': 'no-store' } })
}
