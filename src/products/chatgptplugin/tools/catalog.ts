import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpQueries } from '../application/erpQueries'
import { outputs } from './outputs'

export const companySchema = z.number().int().positive().optional().describe('Empresa autorizada retornada por meu_acesso. Obrigatória se houver mais de uma empresa.')
const company = companySchema
const paging = { empresa_id: company, busca: z.string().trim().max(200).optional(),
  pagina: z.number().int().min(1).max(10000).default(1), por_pagina: z.number().int().min(10).max(50).default(20) }
export const requiredDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value
}, 'Data inválida.')
const isoDate = requiredDate.optional()
export type ToolDefinition = {
  name: string; title: string; description: string; schema: z.AnyZodObject; output: z.ZodTypeAny
  capabilities: ErpCapability[]
  requiredCapabilities?: (input: Record<string, unknown>) => ErpCapability[]
  execute: (queries: ErpQueries, companyId: number, input: Record<string, unknown>) => Promise<unknown>
}
function page(input: Record<string, unknown>) {
  return { query: input.busca as string | undefined, page: input.pagina as number, pageSize: input.por_pagina as number }
}
function commercialFilters(input:Record<string,unknown>) {
  return Object.fromEntries(['status','inicio','fim'].filter(k=>input[k]).map(k=>[k,String(input[k])]))
}
const registrationTypes = z.enum(['clientes','fornecedores','vendedores','produtos','servicos','categorias','contas-financeiras'])
const registrationCapabilities = (input:Record<string,unknown>):ErpCapability[] =>
  input.tipo==='contas-financeiras'?['erp.financeiro.visualizar','erp.cadastros.visualizar']:['erp.cadastros.visualizar']
export const tools: ToolDefinition[] = [
  { name: 'resumo_erp', title: 'Resumo do ERP', output: outputs.overview, description: 'Use quando o usuário pedir uma visão geral da empresa: saldos a pagar e receber, vencidos, vendas em rascunho, compras abertas e clientes ativos. Não use para listas detalhadas. Requer permissão de todas essas áreas.',
    schema: z.object({ empresa_id: company }).strict(),
    capabilities: ['erp.relatorios.visualizar','erp.financeiro.visualizar','erp.vendas.visualizar','erp.compras.visualizar','erp.cadastros.visualizar'],
    execute: (q, id) => q.overview(id) },
  { name: 'buscar_cadastros', title: 'Buscar cadastros', output: outputs.page, description: 'Use quando precisar encontrar clientes, fornecedores, vendedores, produtos, serviços, categorias ou contas financeiras por nome, e para obter os IDs usados nas demais tools. Para registrar baixas, busque contas-financeiras com status ativo.',
    schema: z.object({ ...paging, tipo: registrationTypes, status: z.enum(['ativo','inativo']).optional() }).strict(),
    capabilities: ['erp.cadastros.visualizar'], requiredCapabilities: registrationCapabilities,
    execute: (q,id,input) => q.page(id,input.tipo as 'clientes', { ...page(input), filters: input.status ? { status: String(input.status) } : {} }) },
  {name:'obter_cadastro',title:'Detalhes do cadastro',output:outputs.record,description:'Use quando o usuário pedir os dados completos de um cadastro já localizado (ID de buscar_cadastros).',
    schema:z.object({empresa_id:company,tipo:registrationTypes,registro_id:z.number().int().positive()}).strict(),
    capabilities:['erp.cadastros.visualizar'],requiredCapabilities:registrationCapabilities,
    execute:(q,id,input)=>q.registration(id,input.tipo as 'clientes',Number(input.registro_id))},
  { name: 'listar_vendas', title: 'Listar vendas e orçamentos', output: outputs.page, description: 'Use quando o usuário perguntar sobre vendas ou orçamentos: por número, cliente, status ou período do documento. summary.valor_total inclui todos os filtrados. Use tipo_documento orcamento para orçamentos.',
    schema: z.object({ ...paging, tipo_documento: z.enum(['venda','orcamento']).default('venda'),
      status: z.enum(['rascunho','confirmada','cancelada','faturada']).optional(),inicio:isoDate,fim:isoDate }).strict(),
    capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.page(id,'pedidos', { ...page(input),
      filters: {...commercialFilters(input),...(input.tipo_documento==='orcamento'?{tipo_documento:'orcamento'}:{})} }) },
  { name: 'obter_venda', title: 'Detalhes da venda', output: outputs.sale, description: 'Use para ver itens, valores e vencimentos de uma venda ou orçamento pelo ID retornado por listar_vendas. Retorna até 100 itens.',
    schema: z.object({ empresa_id: company, venda_id: z.number().int().positive() }).strict(), capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.sale(id, input.venda_id as number) },
  { name:'listar_compras', title:'Listar compras', output: outputs.page, description:'Use quando o usuário perguntar sobre compras de fornecedores: por número, fornecedor, status ou período do documento.',
    schema:z.object({...paging,status:z.enum(['rascunho','confirmada','parcialmente_recebida','recebida','cancelada']).optional(),inicio:isoDate,fim:isoDate}).strict(), capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.page(id,'pedidos-compra',{...page(input),filters:commercialFilters(input)}) },
  { name:'obter_compra', title:'Detalhes da compra', output: outputs.purchase, description:'Use para ver itens, valores e vencimentos de uma compra pelo ID retornado por listar_compras. Retorna até 100 itens.',
    schema:z.object({empresa_id:company,compra_id:z.number().int().positive()}).strict(),capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.purchase(id,input.compra_id as number) },
  { name: 'consultar_financeiro', title: 'Contas a pagar e receber', output: outputs.page, description: 'Use quando o usuário perguntar sobre contas a pagar ou a receber, vencimentos, atrasos ou saldos em aberto. Retorna parcelas; summary considera todas as filtradas. Não efetua pagamentos (registrar_baixa).',
    schema: z.object({ ...paging, tipo: z.enum(['pagar','receber']), status: z.enum(['aberto','pendente','pago','parcial','vencido','cancelado','renegociado']).optional(),
      vencimento_inicio: isoDate, vencimento_fim: isoDate }).strict(), capabilities: ['erp.financeiro.visualizar'],
    execute: (q,id,input) => q.page(id,input.tipo === 'pagar' ? 'contas-a-pagar' : 'contas-a-receber', {
      ...page(input), filters: Object.fromEntries(['status','vencimento_inicio','vencimento_fim'].filter(k => input[k]).map(k => [k,String(input[k])])) }) },
  {name:'obter_titulo_financeiro',title:'Detalhes do título financeiro',output:outputs.financialTitle,description:'Use para ver um título a pagar ou receber com todas as parcelas e o histórico, pelo conta_id da listagem. Use este ID para editar_titulo e excluir_titulo, nunca o ID da parcela.',
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),conta_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.financialTitle(id,input.tipo as 'pagar',Number(input.conta_id))},
  {name:'obter_parcela_financeira',title:'Detalhes da parcela',output:outputs.installment,description:'Use para ver uma parcela a pagar ou receber, a composição do saldo e o histórico de pagamentos, antes de registrar_baixa.',
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),parcela_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.installment(id,input.tipo as 'pagar',Number(input.parcela_id))},
  {name:'listar_pagamentos',title:'Listar pagamentos',output:outputs.page,description:'Use quando o usuário perguntar sobre pagamentos ou recebimentos já registrados, ou para obter o ID usado em estornar_pagamento.',
    schema:z.object({empresa_id:company,pagina:paging.pagina,por_pagina:paging.por_pagina,tipo:z.enum(['receber','pagar']).optional()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.payments(id,{page:Number(input.pagina),pageSize:Number(input.por_pagina),type:input.tipo as string|undefined})},
  { name: 'consultar_estoque', title: 'Consultar estoque', output: outputs.page, description: 'Use quando o usuário perguntar quanto há de um produto, reservas ou disponibilidade por local.',
    schema: z.object(paging).strict(), capabilities: ['erp.estoque.visualizar'], execute: (q,id,input) => q.stock(id,page(input)) },
  {name:'analisar_periodo',title:'Indicadores por mês',output:outputs.analysis,description:'Use quando o usuário pedir evolução ou totais mensais de vendas, compras, contas a pagar ou a receber num período de até 366 dias. Vendas e compras consideram documentos confirmados; financeiro considera saldo pendente por vencimento.',
    schema:z.object({empresa_id:company,tipo:z.enum(['vendas','compras','pagar','receber']),inicio:requiredDate,fim:requiredDate}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input=>['erp.relatorios.visualizar',input.tipo==='vendas'?'erp.vendas.visualizar':input.tipo==='compras'?'erp.compras.visualizar':'erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.analysis(id,input.tipo as 'vendas',String(input.inicio),String(input.fim))},
  { name:'consultar_relatorio',title:'Consultar relatório',output:outputs.report,description:'Use quando o usuário pedir DRE por caixa, posição financeira por vencimento, vendas por cliente/vendedor/produto, compras por fornecedor/categoria ou valor do estoque, num período de até 366 dias.',
    schema:z.object({empresa_id:company,tipo:z.enum(['dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque']),
      inicio:requiredDate,fim:requiredDate,pagina:paging.pagina,por_pagina:paging.por_pagina}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input => ['erp.relatorios.visualizar', String(input.tipo).startsWith('vendas-') ? 'erp.vendas.visualizar' : String(input.tipo).startsWith('compras-') ? 'erp.compras.visualizar' : input.tipo === 'valor-estoque' ? 'erp.estoque.visualizar' : 'erp.financeiro.visualizar'],
    execute:(q,id,input) => q.report(id,String(input.tipo),String(input.inicio),String(input.fim),page(input)) },
]
export const accessSchema = z.object({ empresa_id: company }).strict()
