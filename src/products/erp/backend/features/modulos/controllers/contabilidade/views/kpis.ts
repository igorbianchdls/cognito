import { runQuery } from '@/lib/postgres'
import type { ParsedContabilidadeRequest } from '../query/parseContabilidadeRequest'

type KpisInput = {
  parsed: ParsedContabilidadeRequest
}

export async function maybeHandleContabilidadeKpisView({ parsed }: KpisInput): Promise<Response | null> {
  const { view, de, ate } = parsed
  if (view !== 'kpis') return null

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const firstDay = `${y}-${m}-01`
  const from = de || firstDay
  const to = ate || new Date().toISOString().slice(0, 10)

  const bpSql = `
    WITH base AS (
      SELECT 
        lc.data_lancamento::date AS data_lancamento,
        pc.codigo,
        pc.nome,
        pc.tipo_conta,
        pc.aceita_lancamento,
        COALESCE(lcl.debito,0) AS debito,
        COALESCE(lcl.credito,0) AS credito
      FROM contabilidade.lancamentos_contabeis lc
      JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
      JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
    ),
    inicial AS (
      SELECT codigo, nome, tipo_conta,
        SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido') THEN (credito - debito) ELSE (debito - credito) END) AS saldo_inicial
      FROM base
      WHERE data_lancamento < $1::date AND aceita_lancamento = TRUE
      GROUP BY codigo, nome, tipo_conta
    ),
    movimentos AS (
      SELECT codigo, nome, tipo_conta,
        SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido') THEN (credito - debito) ELSE (debito - credito) END) AS movimentos
      FROM base
      WHERE data_lancamento BETWEEN $1::date AND $2::date AND aceita_lancamento = TRUE
      GROUP BY codigo, nome, tipo_conta
    ),
    final AS (
      SELECT 
        COALESCE(i.codigo, m.codigo) AS codigo,
        COALESCE(i.nome, m.nome) AS nome,
        COALESCE(i.tipo_conta, m.tipo_conta) AS tipo_conta,
        COALESCE(i.saldo_inicial,0) AS saldo_inicial,
        COALESCE(m.movimentos,0) AS movimentos,
        COALESCE(i.saldo_inicial,0) + COALESCE(m.movimentos,0) AS saldo_final
      FROM inicial i
      FULL JOIN movimentos m USING (codigo, nome, tipo_conta)
    ),
    classificados AS (
      SELECT
        f.codigo, f.nome, f.tipo_conta, f.saldo_inicial, f.movimentos, f.saldo_final,
        CASE
          WHEN f.codigo ~ '^1\\.1\\.' THEN 'Ativo Circulante'
          WHEN f.codigo ~ '^1\\.2\\.' THEN 'Ativo Não Circulante'
          WHEN f.codigo ~ '^2\\.1\\.' THEN 'Passivo Circulante'
          WHEN f.codigo ~ '^2\\.2\\.' THEN 'Passivo Não Circulante'
          WHEN f.codigo ~ '^3\\.' THEN 'Patrimônio Líquido'
          ELSE NULL
        END AS grupo
      FROM final f
    )
    SELECT grupo, SUM(saldo_final) AS total
    FROM classificados
    WHERE grupo IS NOT NULL
    GROUP BY grupo`

  const grupos = await runQuery<{ grupo: string; total: number | null }>(bpSql, [from, to])
  const sum = (pred: (g: string) => boolean) => grupos.filter(r => pred(r.grupo)).reduce((a, r) => a + Number(r.total || 0), 0)
  const ativoTotal = sum(g => g.startsWith('Ativo'))
  const passivoTotal = sum(g => g.startsWith('Passivo'))
  const acTotal = sum(g => g === 'Ativo Circulante')
  const pcTotal = sum(g => g === 'Passivo Circulante')

  const resultadoSql = `
    SELECT COALESCE(SUM(
      CASE WHEN pc.tipo_conta = 'Receita'
             THEN (lcl.credito - lcl.debito)
           WHEN pc.tipo_conta IN ('Despesa', 'Custo')
             THEN (lcl.debito - lcl.credito) * -1
           ELSE (lcl.debito - lcl.credito) * -1
      END
    ),0) AS resultado
    FROM contabilidade.lancamentos_contabeis lc
    JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
    JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
    WHERE lc.data_lancamento BETWEEN $1::date AND $2::date
      AND pc.aceita_lancamento = TRUE
      AND (pc.codigo LIKE '4.%' OR pc.codigo LIKE '5.%' OR pc.codigo LIKE '6.%')`
  const resRows = await runQuery<{ resultado: number }>(resultadoSql, [from, to])
  const lucro = Number(resRows[0]?.resultado || 0)

  const receitaSql = `
    SELECT COALESCE(SUM(lcl.credito - lcl.debito),0) AS receita
    FROM contabilidade.lancamentos_contabeis lc
    JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
    JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
    WHERE lc.data_lancamento BETWEEN $1::date AND $2::date
      AND pc.aceita_lancamento = TRUE
      AND pc.codigo LIKE '4.%'`
  const recRows = await runQuery<{ receita: number }>(receitaSql, [from, to])
  const receita = Number(recRows[0]?.receita || 0)

  const despesaSql = `
    SELECT COALESCE(SUM(lcl.debito - lcl.credito),0) AS despesa
    FROM contabilidade.lancamentos_contabeis lc
    JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
    JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
    WHERE lc.data_lancamento BETWEEN $1::date AND $2::date
      AND pc.aceita_lancamento = TRUE
      AND (pc.codigo LIKE '5.%' OR pc.codigo LIKE '6.%')`
  const despRows = await runQuery<{ despesa: number }>(despesaSql, [from, to])
  const despesa = Number(despRows[0]?.despesa || 0)

  const capitalDeGiro = acTotal - pcTotal
  const liquidezCorrente = pcTotal !== 0 ? (acTotal / pcTotal) : null
  const endividamento = ativoTotal !== 0 ? (passivoTotal / ativoTotal) : null
  const margemLiquida = receita !== 0 ? (lucro / receita) : null

  return Response.json({
    success: true,
    de: from,
    ate: to,
    kpis: {
      receita,
      despesa,
      lucro,
      margem_liquida: margemLiquida,
      capital_de_giro: capitalDeGiro,
      liquidez_corrente: liquidezCorrente,
      endividamento,
    },
    sql_query: { bpSql, resultadoSql, receitaSql, despesaSql },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
