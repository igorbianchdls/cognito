import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpQueries } from '../application/erpQueries'

export const companySchema = z.number().int().positive().optional().describe('Empresa autorizada retornada por meu_acesso. Obrigatoria se houver mais de uma empresa.')
const company = companySchema
const paging = { empresa_id: company, busca: z.string().trim().max(200).optional(),
  pagina: z.number().int().min(1).max(10000).default(1), por_pagina: z.number().int().min(10).max(50).default(20) }
export const requiredDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value
}, 'Data invalida.')
const isoDate = requiredDate.optional()
export type ToolDefinition = {
  name: string; title: string; description: string; schema: z.AnyZodObject
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
export const tools: ToolDefinition[] = [
  {name:'listar_notas_servico',title:'Listar notas de serviço simuladas',description:'Consultar somente NFS-e simuladas, sem validade fiscal, por cliente, número, competência e situação.',schema:z.object({...paging,status:z.enum(['rascunho','aguardando_retorno','emitida','falha','cancelada']).optional(),inicio:isoDate,fim:isoDate}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.serviceInvoices(id,input as {busca?:string;status?:string;pagina?:number;por_pagina?:number})},
  {name:'obter_nota_servico',title:'Detalhes da nota de serviço simulada',description:'Consultar NFS-e simulada, serviços, totais, histórico e caminho autenticado do PDF. Não emite notas reais.',schema:z.object({empresa_id:company,nota_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.serviceInvoice(id,Number(input.nota_id))},
  {name:'validar_nota_servico',title:'Validar nota de serviço simulada',description:'Conferir dados e valores antes de preparar a emissão simulada. Não transmite dados externos.',schema:z.object({empresa_id:company,nota_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.serviceInvoiceValidation(id,Number(input.nota_id))},
  {name:'obter_pdf_nota_servico',title:'PDF demonstrativo da nota de serviço',description:'Obter acesso ao PDF privado, marcado SIMULAÇÃO - SEM VALIDADE FISCAL. O link requer login no ERP.',schema:z.object({empresa_id:company,nota_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.serviceInvoicePdf(id,Number(input.nota_id))},
  {name:'obter_titulo_financeiro',title:'Detalhes do título financeiro',description:'Consultar conta a pagar/receber pelo conta_id retornado na listagem, parcelas e histórico. Para editar/excluir use o ID do título, não o da parcela.',
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),conta_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.financialTitle(id,input.tipo as 'pagar',Number(input.conta_id))},
  {name:'obter_cadastro',title:'Detalhes do cadastro',description:'Consultar cliente, fornecedor, vendedor, produto, serviço, categoria ou conta financeira por ID autorizado.',
    schema:z.object({empresa_id:company,tipo:z.enum(['clientes','fornecedores','vendedores','produtos','servicos','categorias','contas-financeiras']),registro_id:z.number().int().positive()}).strict(),capabilities:['erp.cadastros.visualizar'],
    requiredCapabilities:input=>input.tipo==='contas-financeiras'?['erp.financeiro.visualizar','erp.cadastros.visualizar']:['erp.cadastros.visualizar'],
    execute:(q,id,input)=>q.registration(id,input.tipo as 'clientes',Number(input.registro_id))},
  {name:'obter_parcela_financeira',title:'Detalhes da parcela',description:'Consultar uma parcela a pagar ou receber, sua composição de saldo e histórico de pagamentos. Não efetua baixas.',
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),parcela_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.installment(id,input.tipo as 'pagar',Number(input.parcela_id))},
  {name:'analisar_periodo',title:'Indicadores por período',description:'Agregados completos por mês de vendas/compras confirmadas ou saldos financeiros pendentes por vencimento. Período máximo de 366 dias.',
    schema:z.object({empresa_id:company,tipo:z.enum(['vendas','compras','pagar','receber']),inicio:requiredDate,fim:requiredDate}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input=>['erp.relatorios.visualizar',input.tipo==='vendas'?'erp.vendas.visualizar':input.tipo==='compras'?'erp.compras.visualizar':'erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.analysis(id,input.tipo as 'vendas',String(input.inicio),String(input.fim))},
  {name:'obter_cliente',title:'Consultar cliente',description:'Consultar um cliente por ID nesta empresa.',schema:z.object({empresa_id:company,cliente_id:z.number().int().positive()}).strict(),capabilities:['erp.cadastros.visualizar'],execute:(q,id,input)=>q.customer(id,Number(input.cliente_id))},
  {name:'verificar_fiscal_venda',title:'Verificar dados fiscais da venda',description:'Verificar pendencias fiscais. Nao emite nota fiscal nem autoriza documentos na SEFAZ.',
    schema:z.object({empresa_id:company,venda_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar','erp.cadastros.visualizar'],
    execute:(q,id,input)=>q.fiscal(id,Number(input.venda_id))},
  {name:'listar_contas_financeiras',title:'Listar contas financeiras',description:'Consultar IDs e nomes de contas financeiras ativas para preparar baixas de parcelas.',
    schema:z.object({empresa_id:company}).strict(),capabilities:['erp.financeiro.visualizar'],execute:(q,id)=>q.financialAccounts(id)},
  {name:'listar_pagamentos',title:'Listar pagamentos',description:'Consultar pagamentos e recebimentos, incluindo IDs para preparar estornos com revisao humana.',
    schema:z.object({empresa_id:company,pagina:paging.pagina,por_pagina:paging.por_pagina,tipo:z.enum(['receber','pagar']).optional()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.payments(id,{page:Number(input.pagina),pageSize:Number(input.por_pagina),type:input.tipo as string|undefined})},
  { name: 'resumo_erp', title: 'Resumo do ERP', description: 'Consultar indicadores financeiros, vendas, compras e cadastros da empresa. Requer permissoes de todas essas areas.',
    schema: z.object({ empresa_id: company }).strict(),
    capabilities: ['erp.relatorios.visualizar','erp.financeiro.visualizar','erp.vendas.visualizar','erp.compras.visualizar','erp.cadastros.visualizar'],
    execute: (q, id) => q.overview(id) },
  { name: 'buscar_cadastros', title: 'Buscar cadastros', description: 'Localizar clientes, fornecedores, vendedores, produtos, serviços, categorias e contas financeiras no ERP, com busca e paginação.',
    schema: z.object({ ...paging, tipo: z.enum(['clientes','fornecedores','vendedores','produtos','servicos','categorias','contas-financeiras']),
      status: z.enum(['ativo','inativo']).optional() }).strict(), capabilities: ['erp.cadastros.visualizar'],
    requiredCapabilities:input=>input.tipo==='contas-financeiras'?['erp.financeiro.visualizar','erp.cadastros.visualizar']:['erp.cadastros.visualizar'],
    execute: (q,id,input) => q.page(id,input.tipo as 'clientes', { ...page(input), filters: input.status ? { status: String(input.status) } : {} }) },
  { name: 'listar_vendas', title: 'Listar vendas', description: 'Buscar pedidos de venda por numero, cliente ou status, com paginacao.',
    schema: z.object({ ...paging, status: z.enum(['rascunho','confirmada','cancelada','faturada']).optional(),inicio:isoDate,fim:isoDate }).strict(),
    capabilities: ['erp.vendas.visualizar'], execute: (q,id,input) => q.page(id,'pedidos', { ...page(input), filters: commercialFilters(input) }) },
  { name: 'obter_venda', title: 'Consultar venda', description: 'Consultar uma venda pelo ID retornado por listar_vendas. Retorna dados comerciais e ate 100 itens.',
    schema: z.object({ empresa_id: company, venda_id: z.number().int().positive() }).strict(), capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.sale(id, input.venda_id as number) },
  { name: 'consultar_financeiro', title: 'Consultar financeiro', description: 'Consultar parcelas a pagar ou receber, com busca, periodo de vencimento e paginacao. Nao efetua pagamentos.',
    schema: z.object({ ...paging, tipo: z.enum(['pagar','receber']), status: z.enum(['aberto','pendente','pago','parcial','vencido','cancelado','renegociado']).optional(),
      vencimento_inicio: isoDate, vencimento_fim: isoDate }).strict(), capabilities: ['erp.financeiro.visualizar'],
    execute: (q,id,input) => q.page(id,input.tipo === 'pagar' ? 'contas-a-pagar' : 'contas-a-receber', {
      ...page(input), filters: Object.fromEntries(['status','vencimento_inicio','vencimento_fim'].filter(k => input[k]).map(k => [k,String(input[k])])) }) },
  { name: 'consultar_estoque', title: 'Consultar estoque', description: 'Consultar posicao de estoque, reservas e disponibilidade por produto e local, com busca e paginacao.',
    schema: z.object(paging).strict(), capabilities: ['erp.estoque.visualizar'], execute: (q,id,input) => q.stock(id,page(input)) },
  { name:'listar_compras', title:'Listar compras', description:'Buscar pedidos de compra por numero, fornecedor e status.',
    schema:z.object({...paging,status:z.enum(['rascunho','confirmada','parcialmente_recebida','recebida','cancelada']).optional(),inicio:isoDate,fim:isoDate}).strict(), capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.page(id,'pedidos-compra',{...page(input),filters:commercialFilters(input)}) },
  { name:'obter_compra', title:'Consultar compra', description:'Consultar uma compra e ate 100 itens pelo ID retornado por listar_compras.',
    schema:z.object({empresa_id:company,compra_id:z.number().int().positive()}).strict(),capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.purchase(id,input.compra_id as number) },
  { name:'listar_orcamentos', title:'Listar orcamentos', description:'Consultar apenas documentos do tipo orcamento, com busca e paginacao.',
    schema:z.object(paging).strict(),capabilities:['erp.vendas.visualizar'],
    execute:(q,id,input) => q.page(id,'pedidos',{...page(input),filters:{tipo_documento:'orcamento'}}) },
  { name:'consultar_relatorio',title:'Consultar relatorio',description:'Relatorios do ERP por periodo de ate 366 dias, com paginacao. DRE por caixa e posicao por vencimento.',
    schema:z.object({empresa_id:company,tipo:z.enum(['dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque']),
      inicio:requiredDate,fim:requiredDate,pagina:paging.pagina,por_pagina:paging.por_pagina}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input => ['erp.relatorios.visualizar', String(input.tipo).startsWith('vendas-') ? 'erp.vendas.visualizar' : String(input.tipo).startsWith('compras-') ? 'erp.compras.visualizar' : input.tipo === 'valor-estoque' ? 'erp.estoque.visualizar' : 'erp.financeiro.visualizar'],
    execute:(q,id,input) => q.report(id,String(input.tipo),String(input.inicio),String(input.fim),page(input)) },
]
export const accessSchema = z.object({ empresa_id: company }).strict()
