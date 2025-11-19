import { tool } from 'ai'
import { z } from 'zod'
import { runQuery } from '@/lib/postgres'

// Whitelists
const DATE_COLS = ['data_lancamento', 'data_vencimento', 'linha_data_pagamento'] as const
const TIME_GRAINS = ['month', 'year'] as const
const DIMS = [
  // entidades e cadastros
  'cliente_nome','fornecedor_nome','categoria_nome','natureza_nome',
  'filial_nome','departamento_nome','centro_custo_nome','centro_lucro_nome','projeto_nome',
  // financeiro
  'metodo_pagamento_nome','conta_financeira_nome','nome_banco','numero_banco',
  // status e tipo
  'status','linha_status','tipo','tipo_linha','numero_parcela',
  // datas (permitidas também como dimensões)
  'data_lancamento','data_vencimento','linha_data_pagamento',
] as const

const MEASURES = ['valor_liquido','valor_bruto','juros','multa','desconto','titulos','linhas'] as const

type Grain = typeof TIME_GRAINS[number]
type Dim = typeof DIMS[number]

function buildDateExpr(col: typeof DATE_COLS[number], grain?: Grain) {
  const g = grain === 'year' ? 'year' : 'month'
  const trunc = `date_trunc('${g}', ${col})`
  return g === 'year' ? `to_char(${trunc}, 'YYYY')` : `to_char(${trunc}, 'YYYY-MM')`
}

function buildDimExpr(dim?: Dim, grain?: Grain) {
  if (!dim) return ''
  if (DATE_COLS.includes(dim as any)) return buildDateExpr(dim as any, grain)
  return dim
}

export const analiseFinanceiroPivot = tool({
  description: 'Pivot financeiro (títulos e pagamentos) a partir de financeiro.vw_transacoes_simples, com até 5 dimensões e medidas configuráveis.',
  inputSchema: z.object({
    base: z.enum(['titulos','pagamentos']).default('titulos').optional(),
    tipo: z.enum(['pagar','receber','efetuados','recebidos','ambos']).default('ambos').optional(),
    date_col: z.enum(DATE_COLS).optional(),
    date_grain: z.enum(TIME_GRAINS).optional(),

    nivel1_dim: z.enum(DIMS).optional(),
    nivel1_time_grain: z.enum(TIME_GRAINS).optional(),
    nivel2_dim: z.enum(DIMS).optional(),
    nivel2_time_grain: z.enum(TIME_GRAINS).optional(),
    nivel3_dim: z.enum(DIMS).optional(),
    nivel3_time_grain: z.enum(TIME_GRAINS).optional(),
    nivel4_dim: z.enum(DIMS).optional(),
    nivel4_time_grain: z.enum(TIME_GRAINS).optional(),
    nivel5_dim: z.enum(DIMS).optional(),
    nivel5_time_grain: z.enum(TIME_GRAINS).optional(),

    measure: z.enum(MEASURES).default('valor_liquido').optional(),

    // Filtros
    data_de: z.string().optional(),
    data_ate: z.string().optional(),
    status: z.string().optional(),
    linha_status: z.string().optional(),
    natureza_nome: z.string().optional(),
    cliente_nome: z.string().optional(),
    fornecedor_nome: z.string().optional(),
    categoria_nome: z.string().optional(),
    filial_nome: z.string().optional(),
    departamento_nome: z.string().optional(),
    centro_custo_nome: z.string().optional(),
    centro_lucro_nome: z.string().optional(),
    projeto_nome: z.string().optional(),
    metodo_pagamento_nome: z.string().optional(),
    conta_financeira_nome: z.string().optional(),
    nome_banco: z.string().optional(),
    numero_banco: z.string().optional(),
    tipo_linha: z.string().optional(),
    numero_parcela: z.number().optional(),
    valor_min: z.number().optional(),
    valor_max: z.number().optional(),
    q: z.string().optional(),
    limit_groups: z.number().int().positive().max(1000).optional(),
  }),

  execute: async (input) => {
    try {
      const {
        base = 'titulos', tipo = 'ambos', date_col,
        date_grain,
        nivel1_dim, nivel1_time_grain,
        nivel2_dim, nivel2_time_grain,
        nivel3_dim, nivel3_time_grain,
        nivel4_dim, nivel4_time_grain,
        nivel5_dim, nivel5_time_grain,
        measure = 'valor_liquido',
        data_de, data_ate, status, linha_status, natureza_nome,
        cliente_nome, fornecedor_nome, categoria_nome,
        filial_nome, departamento_nome, centro_custo_nome, centro_lucro_nome, projeto_nome,
        metodo_pagamento_nome, conta_financeira_nome, nome_banco, numero_banco,
        tipo_linha, numero_parcela, valor_min, valor_max, q,
      } = input

      const defaultDateCol = date_col || (base === 'pagamentos' ? 'linha_data_pagamento' : 'data_vencimento')

      const params: unknown[] = []
      let idx = 1
      const push = (expr: string, val: unknown) => { params.push(val); return `${expr} $${idx++}` }
      const conds: string[] = []

      // Filtro por tipo (títulos/pagamentos)
      if (base === 'titulos') {
        if (tipo === 'pagar') conds.push("tipo = 'conta_a_pagar'")
        else if (tipo === 'receber') conds.push("tipo = 'conta_a_receber'")
        else if (tipo === 'ambos') conds.push("tipo IN ('conta_a_pagar','conta_a_receber')")
      } else { // pagamentos
        if (tipo === 'efetuados') conds.push("tipo = 'pagamento_efetuado'")
        else if (tipo === 'recebidos') conds.push("tipo = 'pagamento_recebido'")
        else if (tipo === 'ambos') conds.push("tipo IN ('pagamento_efetuado','pagamento_recebido')")
      }

      // Datas (aplicadas na coluna escolhida)
      if (data_de) conds.push(push(`${defaultDateCol} >=`, data_de))
      if (data_ate) conds.push(push(`${defaultDateCol} <=`, data_ate))

      // Filtros textuais
      const filtersMap: Record<string, string | undefined> = {
        status, linha_status, natureza_nome, cliente_nome, fornecedor_nome, categoria_nome,
        filial_nome, departamento_nome, centro_custo_nome, centro_lucro_nome, projeto_nome,
        metodo_pagamento_nome, conta_financeira_nome, nome_banco, numero_banco, tipo_linha,
      }
      for (const [col, val] of Object.entries(filtersMap)) {
        if (val && val.trim()) conds.push(push(`${col} =`, val.trim()))
      }
      if (typeof numero_parcela === 'number') conds.push(push(`numero_parcela =`, numero_parcela))
      if (typeof valor_min === 'number') conds.push(push(`valor_liquido >=`, valor_min))
      if (typeof valor_max === 'number') conds.push(push(`valor_liquido <=`, valor_max))
      if (q && q.trim()) {
        const term = `%${q.trim()}%`
        const or = [
          push('descricao ILIKE', term),
          push('observacao ILIKE', term),
          push('linha_observacao ILIKE', term),
        ].join(' OR ')
        conds.push(`(${or})`)
      }

      const whereClause = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

      // Dim expressions
      const dim1 = buildDimExpr(nivel1_dim as Dim | undefined, nivel1_time_grain)
      const dim2 = buildDimExpr(nivel2_dim as Dim | undefined, nivel2_time_grain)
      const dim3 = buildDimExpr(nivel3_dim as Dim | undefined, nivel3_time_grain)
      const dim4 = buildDimExpr(nivel4_dim as Dim | undefined, nivel4_time_grain)
      const dim5 = buildDimExpr(nivel5_dim as Dim | undefined, nivel5_time_grain)
      const dims = [dim1, dim2, dim3, dim4, dim5].filter(Boolean)

      // Measure
      let measureExpr = ''
      switch (measure) {
        case 'valor_bruto': measureExpr = 'SUM(valor_bruto)::numeric'; break
        case 'juros': measureExpr = 'SUM(juros)::numeric'; break
        case 'multa': measureExpr = 'SUM(multa)::numeric'; break
        case 'desconto': measureExpr = 'SUM(desconto)::numeric'; break
        case 'titulos': measureExpr = 'COUNT(DISTINCT lancamento_id)::numeric'; break
        case 'linhas': measureExpr = 'COUNT(DISTINCT linha_id)::numeric'; break
        case 'valor_liquido':
        default: measureExpr = 'SUM(valor_liquido)::numeric'
      }

      // GROUPING SETS e nível
      const groupingSets = dims.map((_, i) => `(${dims.slice(0, i + 1).join(', ')})`).join(', ')
      const nivelExpr = dims.length ? dims.map((d) => `(1 - GROUPING(${d}))`).join(' + ') : '0'

      // Labels das dimensões (para meta)
      const dimLabels = {
        nivel1_dim, nivel1_time_grain, nivel2_dim, nivel2_time_grain, nivel3_dim, nivel3_time_grain, nivel4_dim, nivel4_time_grain, nivel5_dim, nivel5_time_grain,
      }

      const selectDims = [
        dim1 ? `${dim1} AS nome` : `NULL::text AS nome`,
        dim2 ? `${dim2} AS detalhe1_nome` : `NULL::text AS detalhe1_nome`,
        dim3 ? `${dim3} AS detalhe2_nome` : `NULL::text AS detalhe2_nome`,
        dim4 ? `${dim4} AS detalhe3_nome` : `NULL::text AS detalhe3_nome`,
        dim5 ? `${dim5} AS detalhe4_nome` : `NULL::text AS detalhe4_nome`,
      ].join(', ')

      // Se não houver dimensões, agregamos tudo
      const groupSql = dims.length ? `GROUP BY GROUPING SETS (${groupingSets})` : ''

      const sql = `
        SELECT
          ${nivelExpr} AS nivel,
          ${selectDims},
          ${measureExpr} AS valor
        FROM financeiro.vw_transacoes_simples
        ${whereClause}
        ${groupSql}
        ORDER BY nome, detalhe1_nome, detalhe2_nome, detalhe3_nome, detalhe4_nome, nivel, valor DESC
      `.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<{ nivel: number; nome: string | null; detalhe1_nome: string | null; detalhe2_nome: string | null; detalhe3_nome: string | null; detalhe4_nome: string | null; valor: number | null }>(sql, params)

      return {
        success: true as const,
        message: `Pivot gerado com ${rows.length} linhas`,
        data: {
          summary: rows.map(r => ({
            nivel: Number(r.nivel || 0),
            nome: r.nome ?? '—',
            detalhe1_nome: r.detalhe1_nome,
            detalhe2_nome: r.detalhe2_nome,
            detalhe3_nome: r.detalhe3_nome,
            detalhe4_nome: r.detalhe4_nome,
            valor: Number(r.valor || 0),
          })),
          topVendedores: [],
          topProdutos: [],
          meta: {
            base, tipo,
            date_col: defaultDateCol, date_grain,
            ...dimLabels,
            measure,
          }
        },
        sql_query: sql,
        sql_params: params,
      }
    } catch (error) {
      return {
        success: false as const,
        message: error instanceof Error ? error.message : 'Erro',
        data: { summary: [], topVendedores: [], topProdutos: [], meta: {} },
      }
    }
  }
})

