import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { ORDER_BY_WHITELIST } from './query/orderByWhitelist'
import { parseContabilidadeRequest } from './query/parseContabilidadeRequest'
import { maybeHandleContabilidadeKpisView } from './views/kpis'
import { maybeHandleContabilidadeDreTabelaView } from './views/dreTabela'
import { maybeHandleContabilidadeDreSummaryView } from './views/dreSummary'
import { maybeHandleContabilidadeBpSummaryView } from './views/bpSummary'
import { maybeHandleContabilidadeDreComparisonView } from './views/dreComparison'
import { maybeHandleContabilidadeBpComparisonView } from './views/bpComparison'
import { maybeHandleContabilidadeOrcamentosView } from './views/orcamentos'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const {
      view,
      de,
      ate,
      cliente_id,
      fornecedor_id,
      page,
      pageSize,
      offset,
      orderBy,
      orderDir,
    } = parseContabilidadeRequest(searchParams, ORDER_BY_WHITELIST)
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })
    }

    // Montagem de SQL por view
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`)
      params.push(value)
      idx += 1
    }

    let baseSql = ''
    let whereDateCol = ''
    let selectSql = ''

    const kpisResponse = await maybeHandleContabilidadeKpisView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (kpisResponse) return kpisResponse
    const dreTabelaResponse = await maybeHandleContabilidadeDreTabelaView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (dreTabelaResponse) return dreTabelaResponse
    const dreSummaryResponse = await maybeHandleContabilidadeDreSummaryView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (dreSummaryResponse) return dreSummaryResponse
    const bpSummaryResponse = await maybeHandleContabilidadeBpSummaryView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (bpSummaryResponse) return bpSummaryResponse
    const dreComparisonResponse = await maybeHandleContabilidadeDreComparisonView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (dreComparisonResponse) return dreComparisonResponse
    const bpComparisonResponse = await maybeHandleContabilidadeBpComparisonView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (bpComparisonResponse) return bpComparisonResponse
    const orcamentosResponse = await maybeHandleContabilidadeOrcamentosView({
      parsed: { view, de, ate, cliente_id, fornecedor_id, page, pageSize, offset, orderBy, orderDir },
    })
    if (orcamentosResponse) return orcamentosResponse

    // Balanço Patrimonial em tabela simples (Ativo, Passivo, PL)
    if (view === 'balanco-tabela') {
      const sql = `
        SELECT
          secao,
          codigo_conta,
          conta_contabil,
          saldo
        FROM (
          -- ATIVO (1): debito - credito
          SELECT
            1 AS ordem,
            'Ativo' AS secao,
            pc.codigo AS codigo_conta,
            pc.nome   AS conta_contabil,
            COALESCE(SUM(lcl.debito), 0) - COALESCE(SUM(lcl.credito), 0) AS saldo
          FROM contabilidade.plano_contas pc
          LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
            ON lcl.conta_id = pc.id
          LEFT JOIN contabilidade.lancamentos_contabeis lc
            ON lc.id = lcl.lancamento_id
           AND lc.origem_tabela IN (
             'financeiro.contas_pagar',
             'financeiro.contas_receber',
             'financeiro.pagamentos_efetuados',
             'financeiro.pagamentos_recebidos'
           )
          WHERE pc.codigo LIKE '1%'
          GROUP BY pc.codigo, pc.nome

          UNION ALL

          -- PASSIVO (2): credito - debito (pra ficar positivo)
          SELECT
            2 AS ordem,
            'Passivo' AS secao,
            pc.codigo AS codigo_conta,
            pc.nome   AS conta_contabil,
            COALESCE(SUM(lcl.credito), 0) - COALESCE(SUM(lcl.debito), 0) AS saldo
          FROM contabilidade.plano_contas pc
          LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
            ON lcl.conta_id = pc.id
          LEFT JOIN contabilidade.lancamentos_contabeis lc
            ON lc.id = lcl.lancamento_id
           AND lc.origem_tabela IN (
             'financeiro.contas_pagar',
             'financeiro.contas_receber',
             'financeiro.pagamentos_efetuados',
             'financeiro.pagamentos_recebidos'
           )
          WHERE pc.codigo LIKE '2%'
          GROUP BY pc.codigo, pc.nome

          UNION ALL

          -- PATRIMÔNIO (3): credito - debito (positivo)
          SELECT
            3 AS ordem,
            'Patrimônio Líquido' AS secao,
            pc.codigo AS codigo_conta,
            pc.nome   AS conta_contabil,
            COALESCE(SUM(lcl.credito), 0) - COALESCE(SUM(lcl.debito), 0) AS saldo
          FROM contabilidade.plano_contas pc
          LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
            ON lcl.conta_id = pc.id
          LEFT JOIN contabilidade.lancamentos_contabeis lc
            ON lc.id = lcl.lancamento_id
           AND lc.origem_tabela IN (
             'financeiro.contas_pagar',
             'financeiro.contas_receber',
             'financeiro.pagamentos_efetuados',
             'financeiro.pagamentos_recebidos'
           )
          WHERE pc.codigo LIKE '3%'
          GROUP BY pc.codigo, pc.nome
        ) t
        ORDER BY ordem, codigo_conta`;

      const rows = await runQuery<{ secao: string; codigo_conta: string; conta_contabil: string; saldo: number }>(sql, [])
      return Response.json({ success: true, view, rows, sql }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // Balanço Patrimonial real
    if (view === 'balanco-patrimonial') {
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const firstDay = `${y}-${m}-01`
      const from = de || firstDay
      const to = ate || new Date().toISOString().slice(0, 10)

      // Query para ATIVO (Circulante + Não Circulante)
      const ativoSql = `
        WITH base AS (
          SELECT
            lc.data_lancamento::date AS data_lancamento,
            pc.codigo,
            pc.nome,
            pc.tipo_conta,
            pc.aceita_lancamento,
            COALESCE(lcl.debito,0) AS debito,
            COALESCE(lcl.credito,0) AS credito
          FROM contabilidade.plano_contas pc
          LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON pc.id = lcl.conta_id
          LEFT JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
          WHERE pc.codigo ~ '^1\\.1' OR pc.codigo ~ '^1\\.2'
        ),
        inicial AS (
          SELECT codigo, nome, tipo_conta,
            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                THEN (credito - debito)
                ELSE (debito - credito)
            END) AS saldo_inicial
          FROM base
          WHERE (data_lancamento < $1::date OR data_lancamento IS NULL) AND aceita_lancamento = TRUE
          GROUP BY codigo, nome, tipo_conta
        ),
        movimentos AS (
          SELECT codigo, nome, tipo_conta,
            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                THEN (credito - debito)
                ELSE (debito - credito)
            END) AS movimentos
          FROM base
          WHERE (data_lancamento BETWEEN $1::date AND $2::date OR data_lancamento IS NULL) AND aceita_lancamento = TRUE
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
              WHEN f.codigo ~ '^1\\.1' THEN 'Ativo Circulante'
              WHEN f.codigo ~ '^1\\.2' THEN 'Ativo Não Circulante'
            END AS grupo
          FROM final f
        )
        SELECT * FROM classificados WHERE grupo IS NOT NULL
        ORDER BY codigo::text COLLATE "C"`;

      // Query para PASSIVO (Circulante + Não Circulante)
      const passivoSql = `
        WITH base AS (
          SELECT
            lc.data_lancamento::date AS data_lancamento,
            pc.codigo,
            pc.nome,
            pc.tipo_conta,
            pc.aceita_lancamento,
            COALESCE(lcl.debito,0) AS debito,
            COALESCE(lcl.credito,0) AS credito
          FROM contabilidade.plano_contas pc
          LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON pc.id = lcl.conta_id
          LEFT JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
          WHERE pc.codigo ~ '^2\\.1' OR pc.codigo ~ '^2\\.2'
        ),
        inicial AS (
          SELECT codigo, nome, tipo_conta,
            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                THEN (credito - debito)
                ELSE (debito - credito)
            END) AS saldo_inicial
          FROM base
          WHERE (data_lancamento < $1::date OR data_lancamento IS NULL) AND aceita_lancamento = TRUE
          GROUP BY codigo, nome, tipo_conta
        ),
        movimentos AS (
          SELECT codigo, nome, tipo_conta,
            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                THEN (credito - debito)
                ELSE (debito - credito)
            END) AS movimentos
          FROM base
          WHERE (data_lancamento BETWEEN $1::date AND $2::date OR data_lancamento IS NULL) AND aceita_lancamento = TRUE
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
              WHEN f.codigo ~ '^2\\.1' THEN 'Passivo Circulante'
              WHEN f.codigo ~ '^2\\.2' THEN 'Passivo Não Circulante'
            END AS grupo
          FROM final f
        )
        SELECT * FROM classificados WHERE grupo IS NOT NULL
        ORDER BY codigo::text COLLATE "C"`;

      // Query para PATRIMÔNIO LÍQUIDO
      const plSql = `
        WITH base AS (
          SELECT
            lc.data_lancamento::date AS data_lancamento,
            pc.codigo,
            pc.nome,
            pc.tipo_conta,
            pc.aceita_lancamento,
            COALESCE(lcl.debito,0) AS debito,
            COALESCE(lcl.credito,0) AS credito
          FROM contabilidade.plano_contas pc
          LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON pc.id = lcl.conta_id
          LEFT JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
          WHERE pc.codigo ~ '^3\\.'
        ),
        inicial AS (
          SELECT codigo, nome, tipo_conta,
            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                THEN (credito - debito)
                ELSE (debito - credito)
            END) AS saldo_inicial
          FROM base
          WHERE (data_lancamento < $1::date OR data_lancamento IS NULL) AND aceita_lancamento = TRUE
          GROUP BY codigo, nome, tipo_conta
        ),
        movimentos AS (
          SELECT codigo, nome, tipo_conta,
            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                THEN (credito - debito)
                ELSE (debito - credito)
            END) AS movimentos
          FROM base
          WHERE (data_lancamento BETWEEN $1::date AND $2::date OR data_lancamento IS NULL) AND aceita_lancamento = TRUE
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
            'Patrimônio Líquido' AS grupo
          FROM final f
        )
        SELECT * FROM classificados WHERE grupo IS NOT NULL
        ORDER BY codigo::text COLLATE "C"`;

      // Executar as 3 queries em paralelo
      type BPRow = { codigo: string; nome: string; tipo_conta: string; saldo_final: number; grupo: string }
      const [ativoRows, passivoRows, plRows] = await Promise.all([
        runQuery<BPRow>(ativoSql, [from, to]),
        runQuery<BPRow>(passivoSql, [from, to]),
        runQuery<BPRow>(plSql, [from, to])
      ])

      // Resultado do período (Receitas - Custos/Despesas) dentro do intervalo [from..to]
      // Receita do período (contas 4.x)
      const receitaSql = `
        SELECT COALESCE(SUM(lcl.credito - lcl.debito),0) AS receita
        FROM contabilidade.lancamentos_contabeis lc
        JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
        JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
        WHERE lc.data_lancamento BETWEEN $1::date AND $2::date
          AND pc.aceita_lancamento = TRUE
          AND pc.codigo LIKE '4.%'`;
      const receitaRows = await runQuery<{ receita: number }>(receitaSql, [from, to])
      const receitaPeriodo = Number(receitaRows[0]?.receita || 0)

      // Despesa do período (contas 5.x e 6.x)
      const despesaSql = `
        SELECT COALESCE(SUM(lcl.debito - lcl.credito),0) AS despesa
        FROM contabilidade.lancamentos_contabeis lc
        JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
        JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
        WHERE lc.data_lancamento BETWEEN $1::date AND $2::date
          AND pc.aceita_lancamento = TRUE
          AND (pc.codigo LIKE '5.%' OR pc.codigo LIKE '6.%')`;
      const despesaRows = await runQuery<{ despesa: number }>(despesaSql, [from, to])
      const despesaPeriodo = Number(despesaRows[0]?.despesa || 0)

      // Resultado = Receita - Despesa
      const resultadoPeriodo = receitaPeriodo - despesaPeriodo

      const toLinha = (r: { codigo: string; nome: string; saldo_final: number }) => ({ conta: `${r.codigo} ${r.nome}`, valor: Number(r.saldo_final || 0) })
      const groupBy = (list: BPRow[]): { [k: string]: { nome: string; linhas: { conta: string; valor: number }[] } } => {
        const out: Record<string, { nome: string; linhas: { conta: string; valor: number }[] }> = {}
        for (const r of list) {
          const key = r.grupo
          if (!out[key]) out[key] = { nome: key, linhas: [] }
          out[key].linhas.push(toLinha(r))
        }
        return out
      }
      const ativos = Object.values(groupBy(ativoRows))
      const passivos = Object.values(groupBy(passivoRows))
      const pls = Object.values(groupBy(plRows))

      // Adicionar Resultado ao Patrimônio Líquido
      if (resultadoPeriodo !== 0) {
        pls.push({
          nome: 'Resultado do Período',
          linhas: [
            { conta: 'Resultado do Exercício', valor: resultadoPeriodo }
          ]
        })
      }

      return Response.json({
        success: true,
        view,
        from,
        to,
        ativo: ativos,
        passivo: passivos,
        pl: pls,
        sql: 'ok',
        params: JSON.stringify([from, to])
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (view === 'dre-structure') {
      // Somente estrutura de contas da DRE (Receita, Custo, Despesa), sem valores
      type PC = { id: number; nome: string; conta_pai_id: number | null; tipo_conta: string; codigo?: string | null }
      const rows = await runQuery<PC>(
        `SELECT id, nome, conta_pai_id, tipo_conta, codigo
           FROM contabilidade.plano_contas
          WHERE tipo_conta IN ('Receita','Custo','Despesa')
          ORDER BY codigo::text COLLATE "C"`
      )

      function buildTree(type: 'Receita' | 'Custo' | 'Despesa') {
        const list = rows.filter(r => r.tipo_conta === type)
        const nodeMap = new Map<number, { id: string; name: string; children: any[] }>()
        for (const r of list) nodeMap.set(r.id, { id: `pc-${r.id}`, name: String(r.nome || ''), children: [] })
        const roots: any[] = []
        for (const r of list) {
          const n = nodeMap.get(r.id)!
          const pid = r.conta_pai_id
          if (pid && nodeMap.has(pid)) nodeMap.get(pid)!.children.push(n)
          else roots.push(n)
        }
        return roots
      }

      const nodes = [
        { id: 'receita', name: 'Receita', children: buildTree('Receita') },
        { id: 'custo', name: 'Custo', children: buildTree('Custo') },
        { id: 'despesa', name: 'Despesa', children: buildTree('Despesa') },
      ]

      return Response.json({ success: true, view, periods: [], nodes }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (view === 'dre-sum') {
      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1

      // Período
      if (de) { conditions.push(`lc.data_lancamento >= $${idx++}::date`); params.push(de) }
      if (ate) { conditions.push(`lc.data_lancamento <= $${idx++}::date`); params.push(ate) }

      // Origem opcional: ap, contas_pagar, financeiro.contas_pagar, cr, contas_receber, pagamentos_efetuados, pagamentos_recebidos
      const origemParam = (searchParams.get('origem') || '').toLowerCase()
      let origemClause = ''
      let specialOriginFilter = ''
      let tipoLista: Array<'Receita' | 'Custo' | 'Despesa'> = ['Receita', 'Custo', 'Despesa']
      const mapOrigem = (o: string) => {
        if (o === 'ap' || o === 'contas_pagar' || o === 'financeiro.contas_pagar') return 'financeiro.contas_pagar'
        if (o === 'cr' || o === 'contas_receber' || o === 'financeiro.contas_receber') return 'financeiro.contas_receber'
        if (o === 'pagamentos_efetuados' || o === 'financeiro.pagamentos_efetuados') return 'financeiro.pagamentos_efetuados'
        if (o === 'pagamentos_recebidos' || o === 'financeiro.pagamentos_recebidos') return 'financeiro.pagamentos_recebidos'
        return ''
      }
      const origemTb = mapOrigem(origemParam)
      if (origemTb) {
        origemClause = `lc.origem_tabela = '${origemTb}'`
        // Para AP: só Custo/Despesa; para CR: só Receita; para pagamentos: pode haver despesas/receitas financeiras
        if (origemTb === 'financeiro.contas_pagar') tipoLista = ['Custo', 'Despesa']
        else if (origemTb === 'financeiro.contas_receber') tipoLista = ['Receita']
        else tipoLista = ['Receita', 'Custo', 'Despesa']
      }
      // Não adiciona origemClause diretamente nos conditions para permitir fallback via lf.tipo; usa specialOriginFilter abaixo
      if (origemTb === 'financeiro.contas_pagar') {
        specialOriginFilter = `AND (lc.origem_tabela = 'financeiro.contas_pagar' OR (lf.id IS NOT NULL AND lf.tipo = 'conta_a_pagar'))`
      } else if (origemTb === 'financeiro.contas_receber') {
        specialOriginFilter = `AND (lc.origem_tabela = 'financeiro.contas_receber' OR (lf.id IS NOT NULL AND lf.tipo = 'conta_a_receber'))`
      } else if (origemTb) {
        // Para pagamentos_* não há vínculo com lancamentos_financeiros; mantém filtro direto
        specialOriginFilter = `AND lc.origem_tabela = '${origemTb}'`
      }

      const where = conditions.length ? `AND ${conditions.join(' AND ')}` : ''
      const tipoIn = tipoLista.map(t => `'${t}'`).join(',')
      const sumExpr = origemTb === 'financeiro.contas_pagar'
        ? `SUM(COALESCE(lcl.debito,0))`
        : origemTb === 'financeiro.contas_receber'
          ? `SUM(COALESCE(lcl.credito,0))`
          : `SUM(CASE WHEN pc.tipo_conta = 'Receita'
                     THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
                     WHEN pc.tipo_conta IN ('Custo','Despesa')
                     THEN (COALESCE(lcl.debito,0) - COALESCE(lcl.credito,0))
                     ELSE 0 END)`

      const sql = `
        SELECT lcl.conta_id,
               ${sumExpr} AS valor
          FROM contabilidade.lancamentos_contabeis lc
          LEFT JOIN financeiro.lancamentos_financeiros lf ON lf.id = lc.lancamento_financeiro_id
          JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
          JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
         WHERE pc.tipo_conta IN (${tipoIn})
           ${where}
           ${specialOriginFilter}
         GROUP BY lcl.conta_id`

      const rows = await runQuery<{ conta_id: number; valor: number | null }>(sql, params)
      return Response.json({ success: true, view, rows, sql, params: JSON.stringify(params) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (view === 'dre') {
      // DRE real a partir de lançamentos contábeis
      // Janela de período
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const firstDay = `${y}-${m}-01`
      const from = de || firstDay
      const to = ate || new Date().toISOString().slice(0, 10)

      const dreSql = `
        WITH canon AS (
          SELECT MIN(id) AS id
          FROM contabilidade.lancamentos_contabeis
          WHERE data_lancamento::date BETWEEN $1::date AND $2::date
          GROUP BY tenant_id, COALESCE(lancamento_financeiro_id, id)
        ),
        base AS (
          SELECT 
            lc.data_lancamento::date AS data_lancamento,
            DATE_TRUNC('month', lc.data_lancamento)::date AS periodo,
            pc.codigo,
            pc.tipo_conta,
            COALESCE(lcl.debito,0) AS debito,
            COALESCE(lcl.credito,0) AS credito
          FROM canon ch
          JOIN contabilidade.lancamentos_contabeis lc ON lc.id = ch.id
          JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
          JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
        )
        SELECT 
          TO_CHAR(periodo, 'YYYY-MM') AS periodo_key,
          CASE 
            WHEN codigo LIKE '4.1.%' THEN 'receita_operacional'
            WHEN codigo LIKE '4.2.%' THEN 'receita_outros'
            WHEN codigo LIKE '5.1.%' THEN 'cogs'
            WHEN codigo LIKE '5.2.%' THEN 'custos_operacionais'
            WHEN codigo LIKE '6.1.%' THEN 'despesas_adm'
            WHEN codigo LIKE '6.2.%' THEN 'despesas_comerciais'
            WHEN codigo LIKE '6.3.%' THEN 'despesas_financeiras'
            ELSE NULL
          END AS grupo,
          SUM(
            CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
              THEN (credito - debito)
              ELSE (debito - credito)
            END
          ) AS valor
        FROM base
        GROUP BY 1,2
        ORDER BY 1,2
      `
      const dreRows = await runQuery<{ periodo_key: string; grupo: string | null; valor: number }>(dreSql, [from, to])
      // Construir períodos (ordenados)
      const periodKeys = Array.from(new Set(dreRows.map(r => r.periodo_key))).sort()
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      const periods = periodKeys.map(k => {
        const [yy, mm] = k.split('-')
        const label = `${months[Number(mm)-1]}/${yy}`
        return { key: k, label }
      })

      const byGroup: Record<string, Record<string, number>> = {}
      for (const r of dreRows) {
        if (!r.grupo) continue
        if (!byGroup[r.grupo]) byGroup[r.grupo] = {}
        byGroup[r.grupo][r.periodo_key] = Number(r.valor || 0)
      }

      // Montar árvore DRE (mínima e coerente com seu plano)
      const node = (id: string, name: string, key: string) => ({ id, name, valuesByPeriod: byGroup[key] || {} })
      const data = [
        {
          id: 'receita',
          name: 'Receita',
          children: [
            node('receita-operacionais', 'Receitas Operacionais', 'receita_operacional'),
            node('receita-outras', 'Receitas Financeiras e Outras', 'receita_outros'),
          ],
        },
        {
          id: 'cogs',
          name: 'Custos dos Produtos/Operacionais (COGS)',
          children: [
            node('cogs-cmv', 'CMV (5.1)', 'cogs'),
            node('cogs-op', 'Custos Operacionais/Logística (5.2)', 'custos_operacionais'),
          ],
        },
        {
          id: 'opex',
          name: 'Despesas Operacionais',
          children: [
            node('desp-adm', 'Administrativas (6.1)', 'despesas_adm'),
            node('desp-com', 'Comerciais e Marketing (6.2)', 'despesas_comerciais'),
            node('desp-fin', 'Financeiras (6.3)', 'despesas_financeiras'),
          ],
        },
      ]

      return Response.json({
        success: true,
        view,
        periods,
        nodes: data,
        sql: dreRows.length ? 'ok' : 'sem movimentos',
        params: JSON.stringify([from, to]),
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (view === 'lancamentos') {
      whereDateCol = 'lc.data_lancamento'
      if (cliente_id) push('lc.cliente_id =', cliente_id)
      if (fornecedor_id) push('lc.fornecedor_id =', fornecedor_id)
      const headerWhere = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const chLimit = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
      const paramsWithPage = [...params, pageSize, offset]
      const listSql = `WITH ch AS (
                         SELECT lc.id
                         FROM contabilidade.lancamentos_contabeis lc
                         ${headerWhere}
                         ORDER BY lc.id DESC
                         ${chLimit}
                       )
                       SELECT lc.id AS lancamento_id,
                              lc.data_lancamento,
                              lc.historico,
                              lc.origem_tabela,
                              lc.origem_id,
                              lc.cliente_id,
                              lc.fornecedor_id,
                              lc.conta_financeira_id,
                              lc.total_debitos,
                              lc.total_creditos,
                              lcl.id AS linha_id,
                              lcl.conta_id,
                              lcl.debito,
                              lcl.credito,
                              lcl.historico AS historico_linha,
                              lcl.criado_em
                       FROM ch
                       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = ch.id
                       LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
                       ORDER BY lc.id DESC, lcl.id ASC`;
      const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)
      const totalSql = `SELECT COUNT(*)::int AS total FROM contabilidade.lancamentos_contabeis lc ${headerWhere}`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const total = totalRows[0]?.total ?? 0
      return Response.json({ success: true, view, page, pageSize, total, rows, sql: listSql, params: JSON.stringify(paramsWithPage) }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'plano-contas') {
      baseSql = `FROM contabilidade.plano_contas pc
                 LEFT JOIN contabilidade.plano_contas pai ON pai.id = pc.conta_pai_id`
      selectSql = `SELECT
                    pc.id,
                    pc.codigo,
                    pc.nome,
                    CASE LEFT(pc.codigo, 1)
                      WHEN '1' THEN 'Ativo'
                      WHEN '2' THEN 'Passivo'
                      WHEN '3' THEN 'Patrimônio Líquido'
                      WHEN '4' THEN 'Receita'
                      WHEN '5' THEN 'Custo'
                      WHEN '6' THEN 'Despesa'
                      ELSE 'Outro'
                    END AS grupo_principal,
                    pc.nivel,
                    pc.aceita_lancamento,
                    pai.codigo AS codigo_pai,
                    pai.nome AS conta_pai,
                    pc.criado_em,
                    pc.atualizado_em`
      whereDateCol = 'pc.criado_em'
      // Filtros opcionais: aceita_lancamento, tipo, q
      const aceitaParam = (searchParams.get('aceita_lancamento') || '').toLowerCase()
      if (aceitaParam === '1' || aceitaParam === 'true' || aceitaParam === 'yes') {
        conditions.push('pc.aceita_lancamento = TRUE')
      }
      const tipoParam = searchParams.get('tipo') || ''
      if (tipoParam) {
        const allowed = ['Ativo','Passivo','Patrimônio Líquido','Receita','Custo','Despesa']
        const tipos = tipoParam.split(/[|,]/).map(s => s.trim()).filter(s => allowed.includes(s))
        if (tipos.length) {
          const ph = tipos.map((_t, i0) => `$${idx + i0}`).join(',')
          conditions.push(`pc.tipo_conta IN (${ph})`)
          for (const t of tipos) params.push(t)
          idx += tipos.length
        }
      }
      const q = searchParams.get('q') || ''
      if (q) {
        conditions.push(`(pc.codigo ILIKE $${idx} OR pc.nome ILIKE $${idx + 1})`)
        params.push(`%${q}%`, `%${q}%`)
        idx += 2
      }
    } else if (view === 'categorias') {
      baseSql = `FROM contabilidade.plano_contas_categorias pcc`
      selectSql = `SELECT
                    pcc.id,
                    pcc.codigo,
                    pcc.nome,
                    pcc.tipo,
                    pcc.nivel,
                    pcc.categoria_pai_id,
                    pcc.ordem,
                    pcc.ativo,
                    pcc.criado_em`
      whereDateCol = 'pcc.criado_em'
    } else if (view === 'segmentos') {
      baseSql = `FROM contabilidade.plano_contas_segmentos pcs`
      selectSql = `SELECT
                    pcs.id,
                    pcs.codigo,
                    pcs.nome,
                    pcs.ordem,
                    pcs.separador,
                    pcs.ativo,
                    pcs.criado_em`
      whereDateCol = 'pcs.criado_em'
    } else if (view === 'centros-de-custo') {
      baseSql = `FROM contabilidade.centros_custo cc`
      selectSql = `SELECT
                    cc.id,
                    cc.codigo,
                    cc.nome,
                    CASE WHEN cc.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                    cc.criado_em,
                    cc.atualizado_em`
      whereDateCol = 'cc.criado_em'
    } else if (view === 'centros-de-lucro') {
      baseSql = `FROM contabilidade.centros_lucro cl`
      selectSql = `SELECT
                    cl.id,
                    cl.codigo,
                    cl.nome,
                    CASE WHEN cl.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                    cl.criado_em,
                    cl.atualizado_em`
      whereDateCol = 'cl.criado_em'
  } else if (view === 'regras-contabeis') {
      baseSql = `FROM contabilidade.regras_contabeis r
                 LEFT JOIN contabilidade.plano_contas d ON r.conta_debito_id = d.id
                 LEFT JOIN contabilidade.plano_contas c ON r.conta_credito_id = c.id`
      selectSql = `SELECT
                    r.id,
                    r.origem,
                    r.subtipo,
                    r.plano_conta_id,
                    r.conta_debito_id,
                    d.codigo AS codigo_conta_debito,
                    d.nome AS conta_debito,
                    r.conta_credito_id,
                    c.codigo AS codigo_conta_credito,
                    c.nome AS conta_credito,
                    r.descricao,
                    r.criado_em,
                    r.atualizado_em`
      whereDateCol = 'r.criado_em'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de) push(`${whereDateCol} >=`, de)
    if (ate) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    let defaultOrder = ''
    if (view === 'plano-contas') defaultOrder = 'ORDER BY pc.codigo::text COLLATE "C"'
    else if (view === 'categorias') defaultOrder = 'ORDER BY pcc.tipo ASC, pcc.nivel ASC, pcc.ordem ASC'
    else if (view === 'segmentos') defaultOrder = 'ORDER BY pcs.ordem ASC'
    else if (view === 'centros-de-custo') defaultOrder = 'ORDER BY cc.codigo ASC'
    else if (view === 'centros-de-lucro') defaultOrder = 'ORDER BY cl.codigo ASC'
    else if (view === 'regras-contabeis') defaultOrder = `ORDER BY CASE 
                                                                WHEN r.origem = 'contas_a_pagar' THEN 1
                                                                WHEN r.origem = 'pagamentos_efetuados' THEN 2
                                                                WHEN r.origem = 'contas_a_receber' THEN 3
                                                                WHEN r.origem = 'pagamentos_recebidos' THEN 4
                                                                ELSE 5
                                                              END, r.id ASC`

    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : defaultOrder
    const limitOffsetClause = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffsetClause}`.replace(/\s+$/m, '').trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(totalSql, params)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify(paramsWithPage),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📊 API /api/modulos/contabilidade error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
