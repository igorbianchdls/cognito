import { NextRequest } from 'next/server'

import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure' | 'dimension' | string; dir?: 'asc' | 'desc' }
type DimensionDef = { expr: string; keyExpr?: string; alias: string }
type MeasureDef = { expr: string; alias: string }
type ModelContext = {
  fromSql: string
  dateField: string
  tenantField: string
  dimensions: Map<string, DimensionDef>
  measures: Map<string, MeasureDef>
  filterColumns: Record<string, string>
  qualifyDimensionExpr: (expr: string) => string
  applyExtraFilters?: (params: unknown[], whereParts: string[], filters: Record<string, unknown>) => void
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function normalizeExprKey(v: string): string {
  return v.replace(/\s+/g, '').toLowerCase()
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function addEqOrInFilter(params: unknown[], whereParts: string[], col: string, value: unknown) {
  if (Array.isArray(value)) {
    const arr = value.filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    if (!arr.length) return
    const ph: string[] = []
    for (const item of arr) {
      ph.push(`$${params.length + 1}`)
      params.push(item)
    }
    whereParts.push(`${col} IN (${ph.join(',')})`)
    return
  }

  if (typeof value === 'string' && value.trim()) {
    whereParts.push(`${col} = $${params.length + 1}`)
    params.push(value.trim())
    return
  }

  if (isFiniteNumber(value)) {
    whereParts.push(`${col} = $${params.length + 1}`)
    params.push(value)
  }
}

function buildTokenQualifier(prefix: string, tokens: string[]) {
  return (expr: string) => {
    let out = expr
    for (const token of tokens) {
      out = out.replace(new RegExp(`\\b${token}\\b`, 'g'), `${prefix}.${token}`)
    }
    return out
  }
}

function buildContexts(): Map<string, ModelContext> {
  const pedidosMonthExpr = "TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM')"
  const itensMonthExpr = "TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM')"
  const pagamentosMonthExpr = "TO_CHAR(DATE_TRUNC('month', COALESCE(pg.data_captura, pg.data_autorizacao, p.data_pedido)), 'YYYY-MM')"
  const enviosMonthExpr = "TO_CHAR(DATE_TRUNC('month', COALESCE(e.entregue_em, e.despachado_em, p.data_pedido)), 'YYYY-MM')"
  const taxasMonthExpr = "TO_CHAR(DATE_TRUNC('month', COALESCE(t.competencia_em, p.data_pedido)), 'YYYY-MM')"
  const payoutsMonthExpr = "TO_CHAR(DATE_TRUNC('month', COALESCE(py.data_pagamento, py.periodo_fim, py.periodo_inicio)), 'YYYY-MM')"
  const estoqueMonthExpr = "TO_CHAR(DATE_TRUNC('month', COALESCE(es.capturado_em, es.source_updated_at, es.created_at)), 'YYYY-MM')"

  const pedidos: ModelContext = {
    fromSql: `
      FROM ecommerce.pedidos p
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = p.loja_id
      LEFT JOIN ecommerce.clientes c ON c.id = p.cliente_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'p.data_pedido',
    tenantField: 'p.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(p.plataforma,'—')", keyExpr: "COALESCE(p.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))", keyExpr: 'p.canal_conta_id', alias: 'canal_conta' }],
      ['canal_conta_id', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))", keyExpr: 'p.canal_conta_id', alias: 'canal_conta_id' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))", keyExpr: 'p.loja_id', alias: 'loja' }],
      ['loja_id', { expr: "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))", keyExpr: 'p.loja_id', alias: 'loja_id' }],
      ['status', { expr: "COALESCE(p.status,'—')", keyExpr: "COALESCE(p.status,'—')", alias: 'status' }],
      ['status_pagamento', { expr: "COALESCE(p.status_pagamento,'—')", keyExpr: "COALESCE(p.status_pagamento,'—')", alias: 'status_pagamento' }],
      ['status_fulfillment', { expr: "COALESCE(p.status_fulfillment,'—')", keyExpr: "COALESCE(p.status_fulfillment,'—')", alias: 'status_fulfillment' }],
      ['cliente', { expr: "COALESCE(c.nome, CONCAT('Cliente #', p.cliente_id::text))", keyExpr: 'p.cliente_id', alias: 'cliente' }],
      ['mes', { expr: pedidosMonthExpr, keyExpr: pedidosMonthExpr, alias: 'mes' }],
      ['periodo', { expr: pedidosMonthExpr, keyExpr: pedidosMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['sum(valor_total)', { expr: 'COALESCE(SUM(p.valor_total),0)::float', alias: 'gmv' }],
      ['sum(valor_pago)', { expr: 'COALESCE(SUM(p.valor_pago),0)::float', alias: 'valor_pago' }],
      ['sum(valor_reembolsado)', { expr: 'COALESCE(SUM(p.valor_reembolsado),0)::float', alias: 'valor_reembolsado' }],
      ['sum(valor_liquido_estimado)', { expr: 'COALESCE(SUM(p.valor_liquido_estimado),0)::float', alias: 'valor_liquido_estimado' }],
      ['sum(frete_total)', { expr: 'COALESCE(SUM(p.frete_total),0)::float', alias: 'frete_total' }],
      ['sum(desconto_total)', { expr: 'COALESCE(SUM(p.desconto_total),0)::float', alias: 'desconto_total' }],
      ['sum(taxa_total)', { expr: 'COALESCE(SUM(p.taxa_total),0)::float', alias: 'taxa_total' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'pedidos' }],
      ['avg(valor_total)', { expr: 'COALESCE(AVG(p.valor_total),0)::float', alias: 'ticket_medio' }],
      ['count_distinct(cliente_id)', { expr: 'COUNT(DISTINCT p.cliente_id)::int', alias: 'clientes_unicos' }],
      [
        'casewhencount(*)=0then0elsesum(casewhenp.status=\'cancelado\'then1else0end)::float/count(*)end',
        { expr: "CASE WHEN COUNT(*)=0 THEN 0 ELSE SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END)::float/COUNT(*)::float END::float", alias: 'taxa_cancelamento' },
      ],
      [
        'casewhencount(*)=0then0elsesum(casewhencoalesce(p.valor_reembolsado,0)>0then1else0end)::float/count(*)end',
        { expr: 'CASE WHEN COUNT(*)=0 THEN 0 ELSE SUM(CASE WHEN COALESCE(p.valor_reembolsado,0) > 0 THEN 1 ELSE 0 END)::float/COUNT(*)::float END::float', alias: 'taxa_reembolso' },
      ],
      [
        'casewhensum(p.valor_total)=0then0elsesum(p.valor_liquido_estimado)/sum(p.valor_total)end',
        { expr: 'CASE WHEN COALESCE(SUM(p.valor_total),0)=0 THEN 0 ELSE COALESCE(SUM(p.valor_liquido_estimado),0)::float/NULLIF(SUM(p.valor_total),0)::float END::float', alias: 'margem_liquida_estimada' },
      ],
      [
        'casewhensum(valor_total)=0then0elsesum(taxa_total)/sum(valor_total)end',
        { expr: 'CASE WHEN COALESCE(SUM(p.valor_total),0)=0 THEN 0 ELSE COALESCE(SUM(p.taxa_total),0)::float/NULLIF(SUM(p.valor_total),0)::float END::float', alias: 'fee_rate' },
      ],
    ]),
    filterColumns: {
      plataforma: 'p.plataforma',
      canal_conta_id: 'p.canal_conta_id',
      loja_id: 'p.loja_id',
      status: 'p.status',
      status_pagamento: 'p.status_pagamento',
      status_fulfillment: 'p.status_fulfillment',
      cliente_id: 'p.cliente_id',
    },
    qualifyDimensionExpr: buildTokenQualifier('p', [
      'data_pedido', 'valor_total', 'valor_pago', 'valor_reembolsado', 'valor_liquido_estimado',
      'frete_total', 'desconto_total', 'taxa_total', 'status', 'status_pagamento', 'status_fulfillment',
    ]),
    applyExtraFilters: (params, whereParts, filters) => {
      if (isFiniteNumber(filters.valor_min)) {
        whereParts.push(`p.valor_total >= $${params.length + 1}`)
        params.push(filters.valor_min)
      }
      if (isFiniteNumber(filters.valor_max)) {
        whereParts.push(`p.valor_total <= $${params.length + 1}`)
        params.push(filters.valor_max)
      }
    },
  }

  const itens: ModelContext = {
    fromSql: `
      FROM ecommerce.pedido_itens pi
      LEFT JOIN ecommerce.pedidos p ON p.id = pi.pedido_id
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = p.loja_id
      LEFT JOIN ecommerce.produtos pr ON pr.id = pi.produto_id
      LEFT JOIN ecommerce.produto_variantes pv ON pv.id = pi.produto_variante_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'p.data_pedido',
    tenantField: 'pi.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(p.plataforma,'—')", keyExpr: "COALESCE(p.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))", keyExpr: 'p.canal_conta_id', alias: 'canal_conta' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))", keyExpr: 'p.loja_id', alias: 'loja' }],
      ['produto', { expr: "COALESCE(pr.nome, pi.titulo_item, CONCAT('Produto #', pi.produto_id::text))", keyExpr: 'pi.produto_id', alias: 'produto' }],
      ['produto_id', { expr: "COALESCE(pr.nome, pi.titulo_item, CONCAT('Produto #', pi.produto_id::text))", keyExpr: 'pi.produto_id', alias: 'produto_id' }],
      ['sku', { expr: "COALESCE(pi.sku, pv.sku, '—')", keyExpr: "COALESCE(pi.sku, pv.sku, '—')", alias: 'sku' }],
      ['categoria', { expr: "COALESCE(pr.categoria, 'Sem categoria')", keyExpr: "COALESCE(pr.categoria, 'Sem categoria')", alias: 'categoria' }],
      ['status_item', { expr: "COALESCE(pi.status,'—')", keyExpr: "COALESCE(pi.status,'—')", alias: 'status_item' }],
      ['mes', { expr: itensMonthExpr, keyExpr: itensMonthExpr, alias: 'mes' }],
      ['periodo', { expr: itensMonthExpr, keyExpr: itensMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['sum(valor_total)', { expr: 'COALESCE(SUM(pi.valor_total),0)::float', alias: 'receita_itens' }],
      ['sum(quantidade)', { expr: 'COALESCE(SUM(pi.quantidade),0)::float', alias: 'quantidade' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'linhas' }],
      ['avg(preco_unitario)', { expr: 'COALESCE(AVG(pi.preco_unitario),0)::float', alias: 'preco_medio' }],
      ['avg(valor_total)', { expr: 'COALESCE(AVG(pi.valor_total),0)::float', alias: 'ticket_item' }],
    ]),
    filterColumns: {
      plataforma: 'p.plataforma',
      canal_conta_id: 'p.canal_conta_id',
      loja_id: 'p.loja_id',
      status: 'p.status',
      status_pagamento: 'p.status_pagamento',
      status_fulfillment: 'p.status_fulfillment',
      produto_id: 'pi.produto_id',
      categoria: "COALESCE(pr.categoria, 'Sem categoria')",
    },
    qualifyDimensionExpr: buildTokenQualifier('pi', ['valor_total', 'quantidade', 'preco_unitario']),
  }

  const pagamentos: ModelContext = {
    fromSql: `
      FROM ecommerce.pagamentos pg
      LEFT JOIN ecommerce.pedidos p ON p.id = pg.pedido_id
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = p.loja_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'COALESCE(pg.data_captura, pg.data_autorizacao, p.data_pedido)',
    tenantField: 'pg.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(p.plataforma,'—')", keyExpr: "COALESCE(p.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))", keyExpr: 'p.canal_conta_id', alias: 'canal_conta' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))", keyExpr: 'p.loja_id', alias: 'loja' }],
      ['status', { expr: "COALESCE(pg.status,'—')", keyExpr: "COALESCE(pg.status,'—')", alias: 'status' }],
      ['metodo', { expr: "COALESCE(pg.metodo,'—')", keyExpr: "COALESCE(pg.metodo,'—')", alias: 'metodo' }],
      ['provedor', { expr: "COALESCE(pg.provedor,'—')", keyExpr: "COALESCE(pg.provedor,'—')", alias: 'provedor' }],
      ['mes', { expr: pagamentosMonthExpr, keyExpr: pagamentosMonthExpr, alias: 'mes' }],
      ['periodo', { expr: pagamentosMonthExpr, keyExpr: pagamentosMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['sum(valor_autorizado)', { expr: 'COALESCE(SUM(pg.valor_autorizado),0)::float', alias: 'valor_autorizado' }],
      ['sum(valor_capturado)', { expr: 'COALESCE(SUM(pg.valor_capturado),0)::float', alias: 'valor_capturado' }],
      ['sum(valor_taxa)', { expr: 'COALESCE(SUM(pg.valor_taxa),0)::float', alias: 'valor_taxa' }],
      ['sum(valor_liquido)', { expr: 'COALESCE(SUM(pg.valor_liquido),0)::float', alias: 'valor_liquido' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'transacoes_pagamento' }],
      [
        'casewhencount(*)=0then0elsesum(casewhenpg.statusin(\'captured\',\'partially_refunded\',\'refunded\')then1else0end)::float/count(*)end',
        { expr: "CASE WHEN COUNT(*)=0 THEN 0 ELSE SUM(CASE WHEN pg.status IN ('captured','partially_refunded','refunded') THEN 1 ELSE 0 END)::float/COUNT(*)::float END::float", alias: 'approval_rate' },
      ],
    ]),
    filterColumns: {
      plataforma: 'p.plataforma',
      canal_conta_id: 'p.canal_conta_id',
      loja_id: 'p.loja_id',
      status: 'pg.status',
      metodo: 'pg.metodo',
      status_pagamento: 'p.status_pagamento',
      status_fulfillment: 'p.status_fulfillment',
    },
    qualifyDimensionExpr: buildTokenQualifier('pg', ['valor_autorizado', 'valor_capturado', 'valor_taxa', 'valor_liquido']),
  }

  const envios: ModelContext = {
    fromSql: `
      FROM ecommerce.envios e
      LEFT JOIN ecommerce.pedidos p ON p.id = e.pedido_id
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = p.loja_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'COALESCE(e.entregue_em, e.despachado_em, p.data_pedido)',
    tenantField: 'e.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(p.plataforma,'—')", keyExpr: "COALESCE(p.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))", keyExpr: 'p.canal_conta_id', alias: 'canal_conta' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))", keyExpr: 'p.loja_id', alias: 'loja' }],
      ['status', { expr: "COALESCE(e.status,'—')", keyExpr: "COALESCE(e.status,'—')", alias: 'status' }],
      ['transportadora', { expr: "COALESCE(e.transportadora,'—')", keyExpr: "COALESCE(e.transportadora,'—')", alias: 'transportadora' }],
      ['mes', { expr: enviosMonthExpr, keyExpr: enviosMonthExpr, alias: 'mes' }],
      ['periodo', { expr: enviosMonthExpr, keyExpr: enviosMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['count()', { expr: 'COUNT(*)::int', alias: 'envios' }],
      ['sum(frete_cobrado)', { expr: 'COALESCE(SUM(e.frete_cobrado),0)::float', alias: 'frete_cobrado' }],
      ['sum(frete_custo)', { expr: 'COALESCE(SUM(e.frete_custo),0)::float', alias: 'frete_custo' }],
      [
        'casewhencount(*)=0then0elsesum(casewhene.entregue_emisnotnullande.despachado_emisnotnulland(e.prazo_diasisnullorextract(epochfrom(e.entregue_em-e.despachado_em))/86400.0<=e.prazo_dias)then1else0end)::float/count(*)end',
        { expr: 'CASE WHEN COUNT(*)=0 THEN 0 ELSE SUM(CASE WHEN e.entregue_em IS NOT NULL AND e.despachado_em IS NOT NULL AND (e.prazo_dias IS NULL OR EXTRACT(EPOCH FROM (e.entregue_em - e.despachado_em))/86400.0 <= e.prazo_dias) THEN 1 ELSE 0 END)::float/COUNT(*)::float END::float', alias: 'sla_entrega' },
      ],
      [
        'avg(casewhene.entregue_emisnotnullande.despachado_emisnotnullthenextract(epochfrom(e.entregue_em-e.despachado_em))/3600.0end)',
        { expr: 'COALESCE(AVG(CASE WHEN e.entregue_em IS NOT NULL AND e.despachado_em IS NOT NULL THEN EXTRACT(EPOCH FROM (e.entregue_em - e.despachado_em))/3600.0 END),0)::float', alias: 'tempo_medio_horas' },
      ],
    ]),
    filterColumns: {
      plataforma: 'p.plataforma',
      canal_conta_id: 'p.canal_conta_id',
      loja_id: 'p.loja_id',
      status: 'e.status',
      transportadora: 'e.transportadora',
      status_pagamento: 'p.status_pagamento',
      status_fulfillment: 'p.status_fulfillment',
    },
    qualifyDimensionExpr: buildTokenQualifier('e', ['frete_cobrado', 'frete_custo', 'prazo_dias']),
  }

  const taxas: ModelContext = {
    fromSql: `
      FROM ecommerce.taxas_pedido t
      LEFT JOIN ecommerce.pedidos p ON p.id = t.pedido_id
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = p.loja_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'COALESCE(t.competencia_em, p.data_pedido)',
    tenantField: 't.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(p.plataforma,'—')", keyExpr: "COALESCE(p.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text))", keyExpr: 'p.canal_conta_id', alias: 'canal_conta' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', p.loja_id::text))", keyExpr: 'p.loja_id', alias: 'loja' }],
      ['tipo_taxa', { expr: "COALESCE(t.tipo_taxa,'—')", keyExpr: "COALESCE(t.tipo_taxa,'—')", alias: 'tipo_taxa' }],
      ['mes', { expr: taxasMonthExpr, keyExpr: taxasMonthExpr, alias: 'mes' }],
      ['periodo', { expr: taxasMonthExpr, keyExpr: taxasMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['sum(valor)', { expr: 'COALESCE(SUM(t.valor),0)::float', alias: 'valor_taxas' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'linhas' }],
      ['avg(aliquota)', { expr: 'COALESCE(AVG(t.aliquota),0)::float', alias: 'aliquota_media' }],
      [
        'casewhensum(p.valor_total)=0then0elsesum(t.valor)/sum(p.valor_total)end',
        { expr: 'CASE WHEN COALESCE(SUM(p.valor_total),0)=0 THEN 0 ELSE COALESCE(SUM(t.valor),0)::float/NULLIF(SUM(p.valor_total),0)::float END::float', alias: 'fee_rate_real' },
      ],
    ]),
    filterColumns: {
      plataforma: 'p.plataforma',
      canal_conta_id: 'p.canal_conta_id',
      loja_id: 'p.loja_id',
      tipo_taxa: 't.tipo_taxa',
      status: 'p.status',
      status_pagamento: 'p.status_pagamento',
      status_fulfillment: 'p.status_fulfillment',
    },
    qualifyDimensionExpr: buildTokenQualifier('t', ['valor', 'aliquota']),
  }

  const payouts: ModelContext = {
    fromSql: `
      FROM ecommerce.payouts py
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = py.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = py.loja_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'COALESCE(py.data_pagamento, py.periodo_fim, py.periodo_inicio)',
    tenantField: 'py.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(py.plataforma,'—')", keyExpr: "COALESCE(py.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', py.canal_conta_id::text))", keyExpr: 'py.canal_conta_id', alias: 'canal_conta' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', py.loja_id::text))", keyExpr: 'py.loja_id', alias: 'loja' }],
      ['status', { expr: "COALESCE(py.status,'—')", keyExpr: "COALESCE(py.status,'—')", alias: 'status' }],
      ['mes', { expr: payoutsMonthExpr, keyExpr: payoutsMonthExpr, alias: 'mes' }],
      ['periodo', { expr: payoutsMonthExpr, keyExpr: payoutsMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['sum(valor_bruto)', { expr: 'COALESCE(SUM(py.valor_bruto),0)::float', alias: 'valor_bruto' }],
      ['sum(valor_taxas)', { expr: 'COALESCE(SUM(py.valor_taxas),0)::float', alias: 'valor_taxas' }],
      ['sum(valor_reembolsos)', { expr: 'COALESCE(SUM(py.valor_reembolsos),0)::float', alias: 'valor_reembolsos' }],
      ['sum(valor_liquido)', { expr: 'COALESCE(SUM(py.valor_liquido),0)::float', alias: 'valor_liquido' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'payouts' }],
      [
        'casewhensum(py.valor_bruto)=0then0else(sum(py.valor_taxas)+sum(py.valor_reembolsos))/sum(py.valor_bruto)end',
        { expr: 'CASE WHEN COALESCE(SUM(py.valor_bruto),0)=0 THEN 0 ELSE (COALESCE(SUM(py.valor_taxas),0)::float + COALESCE(SUM(py.valor_reembolsos),0)::float)/NULLIF(SUM(py.valor_bruto),0)::float END::float', alias: 'take_rate' },
      ],
    ]),
    filterColumns: {
      plataforma: 'py.plataforma',
      canal_conta_id: 'py.canal_conta_id',
      loja_id: 'py.loja_id',
      status: 'py.status',
    },
    qualifyDimensionExpr: buildTokenQualifier('py', ['valor_bruto', 'valor_taxas', 'valor_reembolsos', 'valor_liquido']),
  }

  const estoque: ModelContext = {
    fromSql: `
      FROM ecommerce.estoque_saldos es
      LEFT JOIN ecommerce.produtos pr ON pr.id = es.produto_id
      LEFT JOIN ecommerce.canais_contas cc ON cc.id = es.canal_conta_id
      LEFT JOIN ecommerce.lojas l ON l.id = es.loja_id
    `.replace(/\s+/g, ' ').trim(),
    dateField: 'COALESCE(es.capturado_em, es.source_updated_at, es.created_at)',
    tenantField: 'es.tenant_id',
    dimensions: new Map<string, DimensionDef>([
      ['plataforma', { expr: "COALESCE(es.plataforma,'—')", keyExpr: "COALESCE(es.plataforma,'—')", alias: 'plataforma' }],
      ['canal_conta', { expr: "COALESCE(cc.nome_conta, CONCAT('Conta #', es.canal_conta_id::text))", keyExpr: 'es.canal_conta_id', alias: 'canal_conta' }],
      ['loja', { expr: "COALESCE(l.nome, CONCAT('Loja #', es.loja_id::text))", keyExpr: 'es.loja_id', alias: 'loja' }],
      ['produto', { expr: "COALESCE(pr.nome, CONCAT('Produto #', es.produto_id::text))", keyExpr: 'es.produto_id', alias: 'produto' }],
      ['categoria', { expr: "COALESCE(pr.categoria, 'Sem categoria')", keyExpr: "COALESCE(pr.categoria, 'Sem categoria')", alias: 'categoria' }],
      ['status', { expr: "COALESCE(es.status, '—')", keyExpr: "COALESCE(es.status, '—')", alias: 'status' }],
      ['mes', { expr: estoqueMonthExpr, keyExpr: estoqueMonthExpr, alias: 'mes' }],
      ['periodo', { expr: estoqueMonthExpr, keyExpr: estoqueMonthExpr, alias: 'periodo' }],
    ]),
    measures: new Map<string, MeasureDef>([
      ['sum(quantidade_disponivel)', { expr: 'COALESCE(SUM(es.quantidade_disponivel),0)::float', alias: 'qtd_disponivel' }],
      ['sum(quantidade_reservada)', { expr: 'COALESCE(SUM(es.quantidade_reservada),0)::float', alias: 'qtd_reservada' }],
      ['sum(quantidade_total)', { expr: 'COALESCE(SUM(es.quantidade_total),0)::float', alias: 'qtd_total' }],
      ['count()', { expr: 'COUNT(*)::int', alias: 'linhas' }],
      ['count_distinct(produto_variante_id)', { expr: 'COUNT(DISTINCT es.produto_variante_id)::int', alias: 'skus' }],
    ]),
    filterColumns: {
      plataforma: 'es.plataforma',
      canal_conta_id: 'es.canal_conta_id',
      loja_id: 'es.loja_id',
      produto_id: 'es.produto_id',
      categoria: "COALESCE(pr.categoria, 'Sem categoria')",
      status: 'es.status',
    },
    qualifyDimensionExpr: buildTokenQualifier('es', ['quantidade_disponivel', 'quantidade_reservada', 'quantidade_total']),
  }

  return new Map<string, ModelContext>([
    ['ecommerce.pedidos', pedidos],
    ['ecommerce.pedido_itens', itens],
    ['ecommerce.pagamentos', pagamentos],
    ['ecommerce.envios', envios],
    ['ecommerce.taxas_pedido', taxas],
    ['ecommerce.payouts', payouts],
    ['ecommerce.estoque_saldos', estoque],
  ])
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const dq = body?.dataQuery
    if (!isObject(dq)) {
      return Response.json({ success: false, message: 'dataQuery inválido' }, { status: 400 })
    }

    const rawModel = typeof dq.model === 'string' ? dq.model.trim() : ''
    const model = rawModel.toLowerCase().replace(/-/g, '_')
    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim().toLowerCase() : ''
    const dimensionExprOverride = typeof (dq as any).dimensionExpr === 'string' ? String((dq as any).dimensionExpr).trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    if (!measure) {
      return Response.json({ success: false, message: 'Medida obrigatória' }, { status: 400 })
    }

    const contexts = buildContexts()
    const context = contexts.get(model)
    if (!context) {
      return Response.json({ success: false, message: `Model não suportado: ${rawModel}` }, { status: 400 })
    }

    const meas = context.measures.get(normalizeExprKey(measure))
    if (!meas) {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    let dim: DimensionDef | undefined
    if (dimensionExprOverride) {
      const q = context.qualifyDimensionExpr(dimensionExprOverride)
      dim = { expr: q, keyExpr: q, alias: dimension || 'dimension' }
    } else if (dimension) {
      dim = context.dimensions.get(dimension)
      if (!dim) {
        return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
      }
    }

    const tenantId = resolveTenantId(req.headers)
    const rawFilters = isObject(dq.filters) ? dq.filters : {}
    const filters: Record<string, unknown> =
      typeof rawFilters.tenant_id === 'number' ? rawFilters : { ...rawFilters, tenant_id: tenantId }
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 12))

    const params: unknown[] = []
    const whereParts: string[] = []

    if (isFiniteNumber(filters.tenant_id)) {
      whereParts.push(`${context.tenantField} = $${params.length + 1}`)
      params.push(filters.tenant_id)
    }

    if (typeof filters.de === 'string' && filters.de.trim()) {
      whereParts.push(`${context.dateField} >= $${params.length + 1}::date`)
      params.push(filters.de.trim())
    }
    if (typeof filters.ate === 'string' && filters.ate.trim()) {
      whereParts.push(`${context.dateField} <= $${params.length + 1}::date`)
      params.push(filters.ate.trim())
    }

    for (const [filterField, column] of Object.entries(context.filterColumns)) {
      if (Object.prototype.hasOwnProperty.call(filters, filterField)) {
        addEqOrInFilter(params, whereParts, column, filters[filterField])
      }
    }

    context.applyExtraFilters?.(params, whereParts, filters)

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    if (!dim) {
      const sql = `SELECT ${meas.expr} AS value ${context.fromSql} ${whereSql}`.replace(/\s+/g, ' ').trim()
      const rows = await runQuery<Record<string, unknown>>(sql, params)
      return Response.json({ success: true, rows, sql_query: sql, sql_params: params, model })
    }

    const dir = orderBy?.dir && String(orderBy.dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const orderField = orderBy?.field === 'dimension' ? '2' : '3'
    const sql = `
      SELECT ${dim.keyExpr || dim.expr} AS key, ${dim.expr} AS label, ${meas.expr} AS value
      ${context.fromSql}
      ${whereSql}
      GROUP BY 1, 2
      ORDER BY ${orderField} ${dir}
      LIMIT $${params.length + 1}::int
    `.replace(/\s+/g, ' ').trim()
    const execParams = [...params, limit]
    const rows = await runQuery<Record<string, unknown>>(sql, execParams)

    return Response.json({ success: true, rows, sql_query: sql, sql_params: execParams, model })
  } catch (error) {
    console.error('🛍️ API /api/modulos/ecommerce/query error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
