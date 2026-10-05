import { withTransaction } from '@/lib/postgres'
import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { ErpDomainError } from '../../shared/erpErrors'
import {
  DASHBOARDS,
  DASHBOARD_IDS,
  dashboardRecordsSchema,
  dashboardToday,
  type DashboardId,
  type DashboardRecord,
  type DashboardRecordsFilters,
  type DashboardRecordsResponse,
} from '../../shared/dashboardContracts'
import type { ErpAccessContext } from '../erpAccess'
import type { ErpCapability } from '../../shared/professionalContracts'
import { financialRows } from '../erpReadQueries'
import { cashAllocationSql } from '../erpCashReport'
import { accountBalancesSql, cashMovementsSql } from './common'

const sourceConfig: Record<
  DashboardRecordsFilters['source'],
  { title: string; capability: ErpCapability; criterion: string }
> = {
  vendas: {
    title: 'Vendas confirmadas',
    capability: 'erp.vendas.visualizar',
    criterion: 'Vendas confirmadas ou faturadas, pela data da venda.',
  },
  orcamentos: {
    title: 'Orçamentos emitidos',
    capability: 'erp.vendas.visualizar',
    criterion: 'Orçamentos não cancelados, pela data de emissão.',
  },
  compras: {
    title: 'Compras confirmadas',
    capability: 'erp.compras.visualizar',
    criterion: 'Compras confirmadas, parcialmente recebidas ou recebidas, pela data da compra.',
  },
  pagar: {
    title: 'Contas a pagar',
    capability: 'erp.financeiro.visualizar',
    criterion:
      'Saldo pendente das parcelas por vencimento; exclui pagos, cancelados e renegociados.',
  },
  receber: {
    title: 'Contas a receber',
    capability: 'erp.financeiro.visualizar',
    criterion:
      'Saldo pendente das parcelas por vencimento; exclui pagos, cancelados e renegociados.',
  },
  contas: {
    title: 'Saldos por conta financeira',
    capability: 'erp.financeiro.visualizar',
    criterion:
      'Saldo inicial, pagamentos, adiantamentos e transferências concluídas até a referência.',
  },
  estoque: {
    title: 'Posição do estoque',
    capability: 'erp.estoque.visualizar',
    criterion:
      'Posição atual por produto/local. Reposição agrega a disponibilidade em todos os locais do produto.',
  },
  movimentos: {
    title: 'Movimentações de estoque',
    capability: 'erp.estoque.visualizar',
    criterion:
      'Movimentos pela data operacional ou data de ocorrência; transferências entre locais estão incluídas.',
  },
  pagamentos: {
    title: 'Movimentos do resultado',
    capability: 'erp.relatorios.visualizar',
    criterion:
      'Caixa realizado por pagamento/estorno, distribuído por rateio. Pagamentos têm sinal negativo.',
  },
  ordens: {
    title: 'Ordens de serviço',
    capability: 'erp.vendas.visualizar',
    criterion: 'Ordens abertas na posição atual; concluídas pela data de conclusão.',
  },
  contratos: {
    title: 'Contratos vigentes',
    capability: 'erp.vendas.visualizar',
    criterion:
      'Contratos ativos com versão efetivada e vigente na referência. Valor por ciclo contratado.',
  },
}
const sourcePanels: Record<DashboardRecordsFilters['source'], DashboardId[]> = {
  vendas: ['visao-geral', 'vendas'],
  orcamentos: ['vendas'],
  compras: ['visao-geral', 'compras'],
  pagar: ['visao-geral', 'financeiro'],
  receber: ['visao-geral', 'financeiro'],
  contas: ['visao-geral', 'financeiro'],
  estoque: ['visao-geral', 'estoque'],
  movimentos: ['estoque'],
  pagamentos: ['resultados'],
  ordens: ['visao-geral', 'servicos'],
  contratos: ['servicos'],
}
type Definition = {
  sql: string
  dimensions?: Partial<Record<NonNullable<DashboardRecordsFilters['dimension']>, string>>
  statuses?: DashboardRecordsFilters['status'][]
  format?: 'number' | 'currency'
}
function definition(input: DashboardRecordsFilters): Definition {
  const source = input.source
  const itemDimension =
    input.dimension === 'produto'
      ? 'produto_id'
      : input.dimension === 'servico'
        ? 'servico_id'
        : null
  const saleValue =
    source === 'vendas' && itemDimension
      ? `coalesce((SELECT sum(i.total*d.total/nullif(d.subtotal,0)) FROM erp.vendas_itens i WHERE i.empresa_id=$1 AND i.venda_id=d.id AND i.excluido_em IS NULL AND i.${itemDimension}=$DIM::bigint),0)`
      : 'd.total'
  if (source === 'vendas' || source === 'orcamentos')
    return {
      sql: `SELECT d.id::text id,d.numero label,e.nome${source === 'vendas' && itemDimension ? "||' · valor dos itens selecionados'" : ''} detail,d.data_venda date,d.status,${saleValue} value,d.cliente_id,d.vendedor_id FROM erp.vendas d JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=d.cliente_id WHERE d.empresa_id=$1 AND d.excluido_em IS NULL AND ${source === 'vendas' ? "d.tipo_documento='venda' AND d.status IN ('confirmada','faturada')" : "d.tipo_documento='orcamento' AND d.status<>'cancelada'"}`,
      dimensions: {
        cliente: 'cliente_id',
        vendedor: 'vendedor_id',
        produto:
          'EXISTS(SELECT 1 FROM erp.vendas_itens i WHERE i.empresa_id=$1 AND i.venda_id=r.id::bigint AND i.excluido_em IS NULL AND i.produto_id=$DIM::bigint)',
        servico:
          'EXISTS(SELECT 1 FROM erp.vendas_itens i WHERE i.empresa_id=$1 AND i.venda_id=r.id::bigint AND i.excluido_em IS NULL AND i.servico_id=$DIM::bigint)',
      },
    }
  if (source === 'compras')
    return {
      sql: `SELECT d.id::text id,d.numero label,e.nome detail,d.data_compra date,d.status,d.total value,d.fornecedor_id,d.categoria_id FROM erp.compras d JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=d.fornecedor_id WHERE d.empresa_id=$1 AND d.excluido_em IS NULL AND d.tipo_movimento='compra' AND d.status IN ('confirmada','parcialmente_recebida','recebida')`,
      dimensions: { fornecedor: 'fornecedor_id', categoria: 'categoria_id' },
      statuses: ['confirmada', 'parcialmente_recebida'],
    }
  if (source === 'pagar' || source === 'receber')
    return {
      sql: `SELECT r.id::text id,r.descricao label,concat_ws(' · ',r.${source === 'pagar' ? 'fornecedor' : 'cliente'},'Parcela '||r.parcela,r.numero_documento) detail,r.vencimento date,CASE WHEN r.vencimento<$4::date THEN 'vencido' ELSE r.status END status,r.saldo value,t.${source === 'pagar' ? 'fornecedor_id' : 'cliente_id'},t.categoria_id,r.conta_id FROM (${financialRows(source)}) r JOIN erp.contas_${source} t ON t.empresa_id=$1 AND t.id=r.conta_id WHERE r.saldo>0 AND r.status NOT IN ('cancelado','renegociado','pago') ${source === 'pagar' ? "AND ($5::boolean OR t.tipo_lancamento='efetivo')" + (input.status === 'previsao' ? " AND t.tipo_lancamento='previsao'" : '') : ''}`,
      dimensions:
        source === 'pagar'
          ? { fornecedor: 'fornecedor_id', categoria: 'categoria_id' }
          : { cliente: 'cliente_id', categoria: 'categoria_id' },
      statuses: ['vencido', 'previsao'],
    }
  if (source === 'contas')
    return {
      sql: `SELECT a.id::text id,a.nome label,'Saldo até '||$4::text detail,NULL::date date,'atual'::text status,a.saldo value FROM (WITH cash AS (${cashMovementsSql}) ${accountBalancesSql.replaceAll('$6', '$4')}) a`,
    }
  if (source === 'estoque') {
    const base = `SELECT s.id,s.produto_id,s.local_estoque_id,p.nome,p.estoque_minimo,l.nome local,s.quantidade_fisica,s.quantidade_reservada,s.quantidade_fisica-s.quantidade_reservada disponivel,s.quantidade_fisica*s.custo_medio valor FROM erp.saldos_estoque s JOIN erp.produtos p ON p.empresa_id=$1 AND p.id=s.produto_id AND p.excluido_em IS NULL JOIN erp.locais_estoque l ON l.empresa_id=$1 AND l.id=s.local_estoque_id WHERE s.empresa_id=$1`
    if (input.status === 'reposicao' || input.status === 'produtos')
      return {
        sql: `SELECT produto_id::text id,min(nome) label,'Mínimo: '||max(estoque_minimo)||' · físico: '||sum(quantidade_fisica)||' · reservado: '||sum(quantidade_reservada) detail,NULL::date date,'${input.status}'::text status,${input.status === 'reposicao' ? 'sum(disponivel)' : 'sum(valor)'} value,produto_id FROM (${base}) s GROUP BY produto_id ${input.status === 'reposicao' ? 'HAVING sum(disponivel)<max(estoque_minimo)' : ''}`,
        dimensions: { produto: 'produto_id' },
        statuses: ['reposicao', 'produtos'],
        format: input.status === 'reposicao' ? 'number' : 'currency',
      }
    return {
      sql: `SELECT id::text id,nome label,local||' · físico: '||quantidade_fisica||' · reservado: '||quantidade_reservada||' · disponível: '||disponivel detail,NULL::date date,'atual'::text status,valor value,produto_id,local_estoque_id FROM (${base}) s ${input.status === 'reservas' ? 'WHERE quantidade_reservada>0' : ''}`,
      dimensions: { produto: 'produto_id', local: 'local_estoque_id' },
      statuses: ['reservas'],
    }
  }
  if (source === 'movimentos')
    return {
      sql: `SELECT m.id::text id,p.nome label,l.nome||' · '||replace(m.origem_tipo,'_',' ') detail,coalesce(m.data_operacional,(m.ocorrido_em AT TIME ZONE 'America/Fortaleza')::date) date,CASE WHEN m.quantidade>0 THEN 'entrada' ELSE 'saida' END status,m.quantidade value,m.produto_id,m.local_estoque_id FROM erp.movimentacoes_estoque m JOIN erp.produtos p ON p.empresa_id=$1 AND p.id=m.produto_id JOIN erp.locais_estoque l ON l.empresa_id=$1 AND l.id=m.local_estoque_id WHERE m.empresa_id=$1`,
      dimensions: { produto: 'produto_id', local: 'local_estoque_id' },
      statuses: ['entrada', 'saida'],
      format: 'number',
    }
  if (source === 'pagamentos')
    return {
      sql: `${cashAllocationSql.replaceAll('BETWEEN $2 AND $3', "BETWEEN coalesce($2::date,'0001-01-01'::date) AND coalesce($3::date,$4::date)")} SELECT a.id::text||'-'||a.allocation_id id,'Pagamento '||a.id label,coalesce(c.nome,'Sem categoria')||' · '||coalesce(cc.nome,'Sem centro de custo') detail,a.data_pagamento date,a.tipo status,a.amount*a.signal*CASE WHEN a.tipo='receber' THEN 1 ELSE -1 END value,a.categoria_id,a.centro_custo_id FROM allocated a LEFT JOIN erp.categorias c ON c.empresa_id=$1 AND c.id=a.categoria_id LEFT JOIN erp.centros_custo cc ON cc.empresa_id=$1 AND cc.id=a.centro_custo_id`,
      dimensions: { categoria: 'categoria_id', centro: 'centro_custo_id' },
      statuses: ['receber', 'pagar'],
    }
  if (source === 'ordens')
    return {
      sql: `SELECT o.id::text id,o.numero label,coalesce(o.problema_informado,'Ordem de serviço') detail,${input.status === 'concluida' ? "(o.concluida_em AT TIME ZONE 'America/Fortaleza')::date" : 'o.previsao_entrega'} date,o.status,o.total value FROM erp.ordens_servico o WHERE o.empresa_id=$1 AND o.excluido_em IS NULL ${input.status === 'concluida' ? "AND o.status='concluida'" : "AND o.status NOT IN ('concluida','cancelada')"}${input.status === 'vencido' ? ' AND o.previsao_entrega<$4::date' : ''}`,
      statuses: ['abertas', 'vencido', 'concluida'],
    }
  return {
    sql: `SELECT c.id::text id,c.numero label,c.descricao||' · '||v.periodicidade detail,c.proxima_geracao_em date,c.status,coalesce((SELECT sum(i.total) FROM erp.contratos_vendas_itens i WHERE i.empresa_id=$1 AND i.contrato_versao_id=v.id),0) value FROM erp.contratos_vendas c JOIN LATERAL(SELECT * FROM erp.contratos_vendas_versoes v WHERE v.empresa_id=$1 AND v.contrato_id=c.id AND v.status='efetivada' AND v.vigencia_inicio<=$4::date AND (v.vigencia_fim IS NULL OR v.vigencia_fim>=$4::date) ORDER BY v.vigencia_inicio DESC,v.numero DESC LIMIT 1) v ON true WHERE c.empresa_id=$1 AND c.excluido_em IS NULL AND c.status='ativo' AND c.data_inicio<=$4::date AND (c.data_fim IS NULL OR c.data_fim>=$4::date) ${input.status === 'mensal' ? "AND v.periodicidade='mensal'" : ''}`,
    statuses: ['mensal'],
  }
}
export async function loadDashboardRecords(
  session: ErpAccessContext,
  id: DashboardId,
  raw: DashboardRecordsFilters,
): Promise<DashboardRecordsResponse> {
  const context = getErpDatabaseContext(),
    input = dashboardRecordsSchema.parse(raw)
  if (!DASHBOARD_IDS.includes(id) || !sourcePanels[input.source].includes(id))
    throw new ErpDomainError('NOT_FOUND', 'Origem indisponível neste dashboard.', 404)
  if (
    context?.tenantId !== session.tenantId ||
    context.userId !== session.sharedUserId ||
    !DASHBOARDS[id].capabilities.every((c) => session.capabilities.includes(c)) ||
    !session.capabilities.includes(sourceConfig[input.source].capability) ||
    (input.source === 'pagamentos' && !session.capabilities.includes('erp.financeiro.visualizar'))
  )
    throw new ErpDomainError(
      'ACCESS_DENIED',
      'Seu perfil não permite consultar estes registros.',
      403,
    )
  const def = definition(input),
    reference = dashboardToday(),
    params: unknown[] = [
      session.tenantId,
      input.from || null,
      input.to || null,
      reference,
      input.includeForecast,
    ]
  if (input.status && !def.statuses?.includes(input.status))
    throw new ErpDomainError('VALIDATION_ERROR', 'Status indisponível nesta consulta.', 422)
  let sql = def.sql,
    where =
      'WHERE ($2::date IS NULL OR r.date>=$2::date) AND ($3::date IS NULL OR r.date<=$3::date)'
  if (
    input.status &&
    !['previsao', 'reposicao', 'reservas', 'produtos', 'abertas', 'mensal'].includes(
      input.status,
    ) &&
    !(input.source === 'ordens' && input.status === 'vencido')
  )
    where += ` AND r.status=$${params.push(input.status)}`
  if (input.id) where += ` AND r.id=$${params.push(input.id)}`
  if (input.dimension) {
    const expr = def.dimensions?.[input.dimension]
    if (!expr)
      throw new ErpDomainError('VALIDATION_ERROR', 'Dimensão indisponível nesta consulta.', 422)
    if (expr.includes('$DIM')) {
      if (input.dimensionId === 'sem')
        throw new ErpDomainError('VALIDATION_ERROR', 'Identificador inválido.', 422)
      const parameter = '$' + params.push(input.dimensionId)
      where += ' AND ' + expr.replaceAll('$DIM', parameter)
      sql = sql.replaceAll('$DIM', parameter)
    } else
      where +=
        input.dimensionId === 'sem'
          ? ` AND r.${expr} IS NULL`
          : ` AND r.${expr}=$${params.push(input.dimensionId)}::bigint`
  }
  const offset = params.push((input.page - 1) * input.pageSize),
    limit = params.push(input.pageSize)
  return withTransaction(async (client) => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const result = await client.query(
      `WITH limites AS (SELECT $2::date,$3::date,$4::date,$5::boolean), source AS (${sql}), filtered AS MATERIALIZED(SELECT r.* FROM source r ${where}), page AS (SELECT id,label,detail,date::text date,status,value FROM filtered ORDER BY date NULLS LAST,id LIMIT $${limit} OFFSET $${offset}) SELECT (SELECT count(*) FROM filtered) total,(SELECT coalesce(sum(value),0) FROM filtered) total_value,(SELECT coalesce(jsonb_agg(page),'[]') FROM page) records`,
      params,
    )
    const data = result.rows[0]
    return {
      title: sourceConfig[input.source].title,
      criterion: sourceConfig[input.source].criterion,
      reference,
      filters: input,
      total: Number(data.total),
      totalValue: Number(data.total_value),
      format: def.format || 'currency',
      records: (data.records as DashboardRecord[]).map((r) => ({ ...r, value: Number(r.value) })),
    }
  })
}
