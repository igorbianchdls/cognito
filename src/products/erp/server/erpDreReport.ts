import { runQuery } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { erpDateSchema } from '@/products/erp/shared/erpTransport'
import { cashAllocationSql } from './erpCashReport'
import { accrualAllocationSql, cmvSql } from './erpFinancialReports'

// DRE estruturada (Fase 2A): os 9 grupos fixos da empresa, categorias financeiras dentro deles e subtotais.
// Competência: títulos pela data de competência (rateios, renegociações e devoluções de venda, como no
// "Resultado por competência"). Caixa: pagamentos pela data, com estornos na própria data.
// Valores com sinal: receita positiva, despesa negativa. Categorias "Não entra na DRE" ficam de fora; categorias
// sem grupo aparecem em "Não classificado" e entram no lucro líquido (o total sempre fecha com o período).

export type DreView = 'competencia' | 'caixa'
type Monthly = Record<string, number>
export type DreCategory = { id: string | null; nome: string; total: number; mensal: Monthly; subcategorias: Array<{ id: string; nome: string; total: number; mensal: Monthly }> }
export type DreGroup = { codigo: number; nome: string; natureza: string; total: number; mensal: Monthly; anterior: number; categorias: DreCategory[] }
export type DreLine =
  | { tipo: 'grupo'; codigo: number }
  | { tipo: 'subtotal'; chave: string; nome: string; total: number; mensal: Monthly; anterior: number }

// Subtotais pela sequência fixa dos códigos; a ordem editável vale dentro de cada bloco.
const BLOCKS: Array<{ codigos: number[]; subtotal: { chave: string; nome: string } }> = [
  { codigos: [1, 2], subtotal: { chave: 'receita_liquida', nome: 'Receita líquida' } },
  { codigos: [3], subtotal: { chave: 'lucro_bruto', nome: 'Lucro bruto' } },
  { codigos: [4, 5, 6], subtotal: { chave: 'resultado_operacional', nome: 'Resultado operacional' } },
  { codigos: [7, 8], subtotal: { chave: 'lucro_antes_ir', nome: 'Lucro antes do IR' } },
  { codigos: [9, 0], subtotal: { chave: 'lucro_liquido', nome: 'Lucro líquido' } },
]
const NOT_CLASSIFIED = { codigo: 0, nome: 'Não classificado', natureza: 'nao_classificado' }

function rowsSql(view: DreView) {
  // Linhas por mês e categoria (com a categoria-pai, quando houver) e o código do grupo da DRE:
  // -1 = não entra na DRE, 0 = não classificado; devoluções de venda vão para as deduções (2).
  const join = `LEFT JOIN erp.categorias c ON c.empresa_id = $1 AND c.id = l.categoria_id
    LEFT JOIN erp.categorias pai ON pai.empresa_id = $1 AND pai.id = c.categoria_pai_id
    LEFT JOIN erp.dre_grupos g ON g.empresa_id = $1 AND g.id = c.dre_grupo_id`
  const select = `SELECT to_char(l.mes, 'YYYY-MM') AS mes,
      CASE WHEN l.grupo_fixo IS NOT NULL THEN l.grupo_fixo WHEN c.fora_dre THEN -1 ELSE coalesce(g.codigo, 0) END AS grupo,
      coalesce(pai.id, c.id)::text AS categoria_id, coalesce(pai.nome, c.nome, l.rotulo, 'Sem categoria') AS categoria,
      CASE WHEN pai.id IS NOT NULL THEN c.id::text END AS subcategoria_id, CASE WHEN pai.id IS NOT NULL THEN c.nome END AS subcategoria,
      sum(l.valor)::numeric(18,2) AS valor
    FROM linhas l ${join}
    GROUP BY 1, 2, 3, 4, 5, 6`
  if (view === 'caixa') return `${cashAllocationSql},
    linhas AS (SELECT date_trunc('month', a.data_pagamento)::date AS mes, a.categoria_id, NULL::text AS rotulo, NULL::int AS grupo_fixo,
      a.amount * a.signal * CASE WHEN a.tipo = 'receber' THEN 1 ELSE -1 END AS valor FROM allocated a)
    ${select}`
  return `${accrualAllocationSql()},
    linhas AS (SELECT date_trunc('month', alocado.data)::date AS mes, alocado.categoria_id, alocado.rotulo,
      CASE WHEN alocado.rotulo IS NOT NULL THEN 2 END AS grupo_fixo,
      CASE WHEN alocado.tipo = 'receita' THEN alocado.valor ELSE -alocado.valor END AS valor FROM alocado
      UNION ALL
      -- CMV: custo das saídas de estoque das vendas (Fase 2D), no grupo de custos.
      SELECT date_trunc('month', cmv.data)::date, NULL::bigint, 'CMV (custo das mercadorias vendidas)', 3, cmv.valor FROM (${cmvSql()}) cmv)
    ${select}`
}

type Row = { mes: string; grupo: number; categoria_id: string | null; categoria: string; subcategoria_id: string | null; subcategoria: string | null; valor: string }
const add = (target: Monthly, mes: string, value: number) => { target[mes] = Math.round(((target[mes] || 0) + value) * 100) / 100 }
const round = (value: number) => Math.round(value * 100) / 100

function previousPeriod(from: string, to: string) {
  const start = new Date(`${from}T12:00:00Z`), end = new Date(`${to}T12:00:00Z`)
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const prevEnd = new Date(start.getTime() - 86400000), prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000)
  return { from: prevStart.toISOString().slice(0, 10), to: prevEnd.toISOString().slice(0, 10) }
}

export async function dreReport(tenantId: number, input: { inicio: string; fim: string; visao?: string }) {
  const view: DreView = input.visao === 'caixa' ? 'caixa' : 'competencia'
  if (!erpDateSchema.safeParse(input.inicio).success || !erpDateSchema.safeParse(input.fim).success || input.inicio > input.fim)
    throw new ErpDomainError('VALIDATION_ERROR', 'Informe um período válido para a DRE.', 422)
  if ((new Date(input.fim).getTime() - new Date(input.inicio).getTime()) / 86400000 > 731)
    throw new ErpDomainError('VALIDATION_ERROR', 'A DRE aceita até 24 meses por consulta.', 422)
  const previous = previousPeriod(input.inicio, input.fim)
  const sql = rowsSql(view)
  const [groupsRows, rows, previousRows] = await Promise.all([
    runQuery<{ codigo: number; nome: string; natureza: string; ordem: number }>('SELECT codigo, nome, natureza, ordem FROM erp.dre_grupos WHERE empresa_id = $1 ORDER BY ordem, codigo', [tenantId]),
    runQuery<Row>(sql, [tenantId, input.inicio, input.fim]),
    runQuery<Row>(sql, [tenantId, previous.from, previous.to]),
  ])

  const groups = new Map<number, DreGroup>()
  for (const group of [...groupsRows, { ...NOT_CLASSIFIED, ordem: 99 }])
    groups.set(Number(group.codigo), { codigo: Number(group.codigo), nome: group.nome, natureza: group.natureza, total: 0, mensal: {}, anterior: 0, categorias: [] })
  const months = new Set<string>()
  let outsideDre = 0
  for (const row of rows) {
    const value = Number(row.valor), groupCode = Number(row.grupo)
    if (groupCode === -1) { outsideDre = round(outsideDre + value); continue }
    const group = groups.get(groupCode)!
    months.add(row.mes)
    group.total = round(group.total + value); add(group.mensal, row.mes, value)
    let category = group.categorias.find(item => item.id === row.categoria_id && item.nome === row.categoria)
    if (!category) group.categorias.push(category = { id: row.categoria_id, nome: row.categoria, total: 0, mensal: {}, subcategorias: [] })
    category.total = round(category.total + value); add(category.mensal, row.mes, value)
    if (row.subcategoria_id) {
      let sub = category.subcategorias.find(item => item.id === row.subcategoria_id)
      if (!sub) category.subcategorias.push(sub = { id: row.subcategoria_id, nome: row.subcategoria || '', total: 0, mensal: {} })
      sub.total = round(sub.total + value); add(sub.mensal, row.mes, value)
    }
  }
  for (const row of previousRows) {
    const groupCode = Number(row.grupo)
    if (groupCode !== -1) groups.get(groupCode)!.anterior = round(groups.get(groupCode)!.anterior + Number(row.valor))
  }
  for (const group of groups.values()) {
    group.categorias.sort((a, b) => Math.abs(b.total) - Math.abs(a.total) || a.nome.localeCompare(b.nome))
    for (const category of group.categorias) category.subcategorias.sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  }

  // Estrutura de exibição: grupos de cada bloco (na ordem da empresa) seguidos do subtotal acumulado.
  const ordered = [...groupsRows].sort((a, b) => a.ordem - b.ordem || a.codigo - b.codigo).map(g => Number(g.codigo))
  const lines: DreLine[] = []
  const running = { total: 0, mensal: {} as Monthly, anterior: 0 }
  const subtotals: Record<string, number> = {}
  for (const block of BLOCKS) {
    const codes = [...ordered.filter(code => block.codigos.includes(code)), ...(block.codigos.includes(0) ? [0] : [])]
    for (const code of codes) {
      const group = groups.get(code)!
      // "Não classificado" só aparece quando houver valor.
      if (code === 0 && !group.categorias.length && !group.anterior) continue
      lines.push({ tipo: 'grupo', codigo: code })
      running.total = round(running.total + group.total); running.anterior = round(running.anterior + group.anterior)
      for (const [mes, value] of Object.entries(group.mensal)) add(running.mensal, mes, value)
    }
    subtotals[block.subtotal.chave] = running.total
    lines.push({ tipo: 'subtotal', ...block.subtotal, total: running.total, mensal: { ...running.mensal }, anterior: running.anterior })
  }

  return {
    visao: view, inicio: input.inicio, fim: input.fim, anterior: previous,
    meses: [...months].sort(),
    grupos: [...groups.values()],
    linhas: lines,
    subtotais: subtotals,
    // Base dos percentuais: receita líquida do período.
    base_percentual: subtotals.receita_liquida,
    nao_classificado: groups.get(0)!.total,
    fora_dre: outsideDre,
  }
}

// Lançamentos de uma categoria (e das subcategorias dela) no período, para o detalhamento da DRE.
export async function dreEntries(tenantId: number, input: { inicio: string; fim: string; visao?: string; categoriaId?: number | null; devolucoes?: boolean }) {
  const view: DreView = input.visao === 'caixa' ? 'caixa' : 'competencia'
  if (!erpDateSchema.safeParse(input.inicio).success || !erpDateSchema.safeParse(input.fim).success || input.inicio > input.fim)
    throw new ErpDomainError('VALIDATION_ERROR', 'Informe um período válido.', 422)
  const params = [tenantId, input.inicio, input.fim, input.categoriaId ?? null]
  if (input.devolucoes) return runQuery(
    `SELECT d.data_devolucao::text AS data, 'Devolução ' || d.numero AS descricao, e.nome AS pessoa, -d.valor_total AS valor, 'devolucao' AS origem, d.id::text AS id
     FROM erp.devolucoes d JOIN erp.entidades e ON e.empresa_id = d.empresa_id AND e.id = d.cliente_id
     WHERE d.empresa_id = $1 AND d.data_devolucao BETWEEN $2::date AND $3::date ORDER BY d.data_devolucao, d.id LIMIT 300`, params.slice(0, 3))
  // Categoria pedida e subcategorias dela; sem categoria ($4 nulo) = lançamentos sem categoria.
  const inCategory = (column: string) => `(CASE WHEN $4::bigint IS NULL THEN ${column} IS NULL ELSE ${column} IN (
    SELECT id FROM erp.categorias WHERE empresa_id = $1 AND (id = $4 OR categoria_pai_id = $4)) END)`
  if (view === 'caixa') return runQuery(
    `${cashAllocationSql}
     SELECT a.data_pagamento::text AS data, coalesce(cr.descricao, cp.descricao) AS descricao, coalesce(cli.nome, forn.nome) AS pessoa,
       (a.amount * a.signal * CASE WHEN a.tipo = 'receber' THEN 1 ELSE -1 END)::numeric(18,2) AS valor,
       CASE WHEN a.signal < 0 THEN 'estorno' ELSE a.tipo END AS origem, coalesce(cr.id, cp.id)::text AS id
     FROM allocated a JOIN erp.pagamentos p ON p.empresa_id = $1 AND p.id = a.id
     LEFT JOIN erp.contas_receber_parcelas rp ON rp.empresa_id = p.empresa_id AND rp.id = p.conta_receber_parcela_id
     LEFT JOIN erp.contas_receber cr ON cr.empresa_id = rp.empresa_id AND cr.id = rp.conta_receber_id
     LEFT JOIN erp.entidades cli ON cli.empresa_id = cr.empresa_id AND cli.id = cr.cliente_id
     LEFT JOIN erp.contas_pagar_parcelas pp ON pp.empresa_id = p.empresa_id AND pp.id = p.conta_pagar_parcela_id
     LEFT JOIN erp.contas_pagar cp ON cp.empresa_id = pp.empresa_id AND cp.id = pp.conta_pagar_id
     LEFT JOIN erp.entidades forn ON forn.empresa_id = cp.empresa_id AND forn.id = cp.fornecedor_id
     WHERE ${inCategory('a.categoria_id')} AND a.amount <> 0
     ORDER BY a.data_pagamento, a.id LIMIT 300`, params)
  return runQuery(
    `${accrualAllocationSql()}, detalhe AS (
       SELECT t.lado, t.id, t.data_competencia AS data, coalesce(r.categoria_id, t.categoria_id) AS categoria_id, coalesce(r.valor, t.valor_total) AS valor
       FROM titulos t LEFT JOIN erp.rateios_financeiros r ON r.empresa_id = $1 AND r.excluido_em IS NULL
         AND ((t.lado = 'receber' AND r.conta_receber_id = t.id) OR (t.lado = 'pagar' AND r.conta_pagar_id = t.id)))
     SELECT d.data::text AS data, coalesce(cr.descricao, cp.descricao) AS descricao, coalesce(cli.nome, forn.nome) AS pessoa,
       (CASE WHEN d.lado = 'receber' THEN d.valor ELSE -d.valor END)::numeric(18,2) AS valor, d.lado AS origem, d.id::text AS id
     FROM detalhe d
     LEFT JOIN erp.contas_receber cr ON d.lado = 'receber' AND cr.empresa_id = $1 AND cr.id = d.id
     LEFT JOIN erp.entidades cli ON cli.empresa_id = $1 AND cli.id = cr.cliente_id
     LEFT JOIN erp.contas_pagar cp ON d.lado = 'pagar' AND cp.empresa_id = $1 AND cp.id = d.id
     LEFT JOIN erp.entidades forn ON forn.empresa_id = $1 AND forn.id = cp.fornecedor_id
     WHERE ${inCategory('d.categoria_id')}
     ORDER BY d.data, d.id LIMIT 300`, params)
}

// Versão para o chat: uma linha por grupo e subtotal, na ordem da DRE, com % sobre a receita líquida.
export async function dreReportRecords(tenantId: number, input: { inicio: string; fim: string; visao?: string }) {
  const report = await dreReport(tenantId, input)
  const base = report.base_percentual
  const records = report.linhas.map(line => {
    const item = line.tipo === 'grupo' ? report.grupos.find(group => group.codigo === line.codigo)! : line
    const total = item.total
    return {
      linha: line.tipo === 'grupo' ? item.nome : `= ${item.nome}`,
      tipo: line.tipo,
      valor: total,
      percentual_receita_liquida: base ? Math.round(total / base * 1000) / 10 : null,
      periodo_anterior: item.anterior,
      ...(line.tipo === 'grupo' ? { categorias: report.grupos.find(group => group.codigo === line.codigo)!.categorias.slice(0, 8).map(category => ({ nome: category.nome, valor: category.total })) } : {}),
    }
  })
  return { report, records }
}
