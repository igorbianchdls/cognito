import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpQueries } from './queries'
import { outputs } from '../schemas/outputs'
import {toolDescription} from './descriptions'
import {documentInputSchema} from './inputDocumentation'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { PluginError } from '../../../shared/contracts'
import { createServiceInvoiceLinkToken, SERVICE_INVOICE_LINK_TTL_SECONDS, SERVICE_INVOICE_PUBLIC_PATH } from '@/products/erp/server/fiscal/serviceInvoiceLinks'
import { createCommercialLink,COMMERCIAL_LINK_PATH } from '@/products/erp/server/documents/commercialDocumentLinks'
import { QUOTE_SITUATIONS } from '@/products/erp/shared/quoteLifecycle'

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
  // context: domínio do plugin e usuário da conexão, para links absolutos e links temporários assinados.
  execute: (queries: ErpQueries, companyId: number, input: Record<string, unknown>, context: { origin: string; userId: number }) => Promise<unknown>
}
function page(input: Record<string, unknown>) {
  return { query: input.busca as string | undefined, page: input.pagina as number, pageSize: input.por_pagina as number, sort: input.ordenar as string | undefined }
}
function commercialFilters(input:Record<string,unknown>) {
  return Object.fromEntries(['status','situacao','inicio','fim'].filter(k=>input[k]).map(k=>[k,String(input[k])]))
}
const registrationTypes = z.enum(['clientes','fornecedores','vendedores','produtos','servicos','categorias','categorias-cadastro','contas-financeiras'])
const registrationCapabilities = (input:Record<string,unknown>):ErpCapability[] =>
  input.tipo==='contas-financeiras'?['erp.financeiro.visualizar','erp.cadastros.visualizar']:['erp.cadastros.visualizar']
// Número exato da NFS-e (a busca da lista também casa por cliente e por parte do número).
async function noteIdByNumber(q:ErpQueries,companyId:number,numero:string){
  const page=await q.serviceInvoices(companyId,{busca:numero,por_pagina:50}),match=page.records.find(row=>String(row.numero)===numero)
  if(!match)throw new ErpDomainError('NOT_FOUND','Nota de serviço não encontrada.',404)
  return Number(match.id)
}
const readTools: ToolDefinition[] = [
  {name:'obter_contrato',title:'Detalhes do contrato',output:outputs.record,description:toolDescription('obter_contrato'),schema:z.object({empresa_id:company,registro_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.contract(id,Number(input.registro_id))},
  {name:'listar_ordens_servico',title:'Listar ordens de serviço',output:outputs.page,description:toolDescription('listar_ordens_servico'),schema:z.object({...paging,status:z.enum(['rascunho','orcamento_pendente','aprovada','em_execucao','concluida','cancelada']).optional()}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.serviceOrders({tenantId:id,query:input.busca as string|undefined,status:input.status as string|undefined,page:Number(input.pagina),pageSize:Number(input.por_pagina)})},
  {name:'obter_ordem_servico',title:'Detalhes da ordem de serviço',output:outputs.serviceOrder,description:toolDescription('obter_ordem_servico'),schema:z.object({empresa_id:company,registro_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar'],execute:(q,id,input)=>q.serviceOrder(id,Number(input.registro_id))},
  {name:'obter_documento_comercial',title:'PDF de proposta ou ordem de serviço',output:outputs.commercialDocument,description:toolDescription('obter_documento_comercial'),schema:z.object({empresa_id:company,tipo:z.enum(['orcamento','ordem_servico']),registro_id:z.number().int().positive(),revisao:z.number().int().positive().optional()}).strict(),capabilities:['erp.vendas.visualizar'],execute:async(q,id,input,ctx)=>{
    const tipo=input.tipo as 'orcamento'|'ordem_servico',result=await q.commercialDocument(id,tipo,Number(input.registro_id),input.revisao as number|undefined);
    const link=createCommercialLink({empresa:id,usuario:ctx.userId,tipo,registro:Number(input.registro_id),versao:result.record.versao,...(input.revisao?{revisao:Number(input.revisao)}:{})});
    return {...result,record:{...result.record,pdf_url:new URL(COMMERCIAL_LINK_PATH+link.token,ctx.origin).href,link_expira_em:link.expiresAt}};
  }},
  { name: 'resumo_erp', title: 'Resumo do ERP', output: outputs.overview, description: toolDescription('resumo_erp'),
    schema: z.object({ empresa_id: company }).strict(),
    capabilities: ['erp.relatorios.visualizar','erp.financeiro.visualizar','erp.vendas.visualizar','erp.compras.visualizar','erp.cadastros.visualizar'],
    execute: (q, id) => q.overview(id) },
  { name: 'buscar_cadastros', title: 'Buscar cadastros', output: outputs.page, description: toolDescription('buscar_cadastros'),
    schema: z.object({ ...paging, tipo: registrationTypes, status: z.enum(['ativo','inativo']).optional() }).strict(),
    capabilities: ['erp.cadastros.visualizar'], requiredCapabilities: registrationCapabilities,
    execute: (q,id,input) => q.page(id,input.tipo as 'clientes', { ...page(input), filters: input.status ? { status: String(input.status) } : {} }) },
  {name:'obter_cadastro',title:'Detalhes do cadastro',output:outputs.record,description:toolDescription('obter_cadastro'),
    schema:z.object({empresa_id:company,tipo:registrationTypes,registro_id:z.number().int().positive()}).strict(),
    capabilities:['erp.cadastros.visualizar'],requiredCapabilities:registrationCapabilities,
    execute:(q,id,input)=>q.registration(id,input.tipo as 'clientes',Number(input.registro_id))},
  { name: 'listar_vendas', title: 'Listar vendas e orçamentos', output: outputs.page, description: toolDescription('listar_vendas'),
    schema: z.object({ ...paging, tipo_documento: z.enum(['venda','orcamento']).default('venda'), ordenar: z.enum(['-data','data','-total','total']).optional().describe('Ordenação de todas as páginas; padrão: mais recentes.'),
      status: z.enum(['rascunho','confirmada','cancelada','faturada']).optional(),situacao:z.enum(QUOTE_SITUATIONS).optional().describe('Situação comercial do orçamento; use junto com tipo_documento orcamento.'),inicio:isoDate,fim:isoDate }).strict(),
    capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.page(id,'pedidos', { ...page(input),
      filters: {...commercialFilters(input),...(input.tipo_documento==='orcamento'?{tipo_documento:'orcamento'}:{})} }) },
  { name: 'obter_venda', title: 'Detalhes da venda', output: outputs.sale, description: toolDescription('obter_venda'),
    schema: z.object({ empresa_id: company, venda_id: z.number().int().positive() }).strict(), capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.sale(id, input.venda_id as number) },
  { name:'listar_compras', title:'Listar compras', output: outputs.page, description:toolDescription('listar_compras'),
    schema:z.object({...paging,status:z.enum(['rascunho','confirmada','parcialmente_recebida','recebida','cancelada']).optional(),inicio:isoDate,fim:isoDate,ordenar:z.enum(['-data','data','-total','total']).optional()}).strict(), capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.page(id,'pedidos-compra',{...page(input),filters:commercialFilters(input)}) },
  { name:'obter_compra', title:'Detalhes da compra', output: outputs.purchase, description:toolDescription('obter_compra'),
    schema:z.object({empresa_id:company,compra_id:z.number().int().positive()}).strict(),capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.purchase(id,input.compra_id as number) },
  {name:'listar_notas_servico',title:'Listar notas de serviço',output:outputs.page,description:toolDescription('listar_notas_servico'),
    schema:z.object({...paging,status:z.enum(['rascunho','aguardando_retorno','emitida','falha','cancelada']).optional(),inicio:isoDate,fim:isoDate}).strict(),capabilities:['erp.vendas.visualizar'],
    execute:(q,id,input)=>q.serviceInvoices(id,{busca:input.busca as string|undefined,status:input.status as string|undefined,inicio:input.inicio as string|undefined,fim:input.fim as string|undefined,pagina:Number(input.pagina),por_pagina:Number(input.por_pagina)})},
  {name:'obter_nota_servico',title:'Detalhes da nota de serviço',output:outputs.serviceInvoice,description:toolDescription('obter_nota_servico'),
    schema:z.object({empresa_id:company,nota_id:z.number().int().positive().optional(),numero:z.string().trim().min(1).max(30).optional().describe('Número da NFS-e, quando não tiver o ID.')}).strict(),capabilities:['erp.vendas.visualizar'],
    execute:async(q,id,input,context)=>{if(input.nota_id===undefined&&input.numero===undefined)throw new PluginError('INVALID_INPUT','Informe nota_id ou numero.',400,undefined,[{campo:'nota_id',motivo:'Obrigatório (ou numero)'}])
      const noteId=input.nota_id!==undefined?Number(input.nota_id):await noteIdByNumber(q,id,String(input.numero)),detail=await q.serviceInvoice(id,noteId),link=(kind:'pdf'|'xml',path:unknown)=>path?new URL(SERVICE_INVOICE_PUBLIC_PATH+createServiceInvoiceLinkToken({empresa:id,usuario:context.userId,nota:noteId,tipo:kind}).token,context.origin).toString():null
      const {input:editable,...rest}=detail
      const totals=detail.totals as Record<string,unknown>,issuer=(detail.record.emitente_snapshot||{}) as Record<string,unknown>,place=String(detail.record.codigo_municipio_prestacao||'')
      const federal=['irrf','inss','pis','cofins','csll'].reduce((sum,key)=>sum+Number(totals['retencao_'+key]||0),0)
      return {...rest,dados_editaveis:editable,links_expiram_em:new Date(Date.now()+SERVICE_INVOICE_LINK_TTL_SECONDS*1000).toISOString(),record:{...detail.record,pdf_url:link('pdf',detail.record.pdf_url),xml_url:link('xml',detail.record.xml_url),
        valor_iss:totals.valor_iss,retencao_iss:totals.retencao_iss,retencoes_federais:federal,valor_liquido:totals.valor_liquido,
        local_prestacao:place&&place===String(issuer.codigo_municipio||'')&&issuer.municipio?`${issuer.municipio} (${place})`:place||null}}}},
  { name: 'consultar_financeiro', title: 'Contas a pagar e receber', output: outputs.page, description: toolDescription('consultar_financeiro'),
    schema: z.object({ ...paging, tipo: z.enum(['pagar','receber']), status: z.enum(['aberto','pendente','pago','parcial','vencido','cancelado','renegociado']).optional(),
      vencimento_inicio: isoDate, vencimento_fim: isoDate, ordenar: z.enum(['vencimento','-vencimento','-saldo','saldo','-valor']).optional().describe('Ordenação de todas as páginas; padrão: vencimento mais próximo.') }).strict(), capabilities: ['erp.financeiro.visualizar'],
    execute: (q,id,input) => q.page(id,input.tipo === 'pagar' ? 'contas-a-pagar' : 'contas-a-receber', {
      ...page(input), filters: Object.fromEntries(['status','vencimento_inicio','vencimento_fim'].filter(k => input[k]).map(k => [k,String(input[k])])) }) },
  {name:'obter_titulo_financeiro',title:'Detalhes do título financeiro',output:outputs.financialTitle,description:toolDescription('obter_titulo_financeiro'),
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),conta_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.financialTitle(id,input.tipo as 'pagar',Number(input.conta_id))},
  {name:'obter_parcela_financeira',title:'Detalhes da parcela',output:outputs.installment,description:toolDescription('obter_parcela_financeira'),
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),parcela_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.installment(id,input.tipo as 'pagar',Number(input.parcela_id))},
  {name:'listar_anexos',title:'Listar anexos',output:outputs.page,description:toolDescription('listar_anexos'),
    schema:z.object({empresa_id:company,documento:z.enum(['conta_pagar','conta_receber','pagamento','venda','compra','contrato','ordem_servico']),registro_id:z.number().int().positive()}).strict(),
    capabilities:['erp.financeiro.visualizar','erp.vendas.visualizar','erp.compras.visualizar'],
    requiredCapabilities:input=>[['conta_pagar','conta_receber','pagamento'].includes(String(input.documento))?'erp.financeiro.visualizar':input.documento==='compra'?'erp.compras.visualizar':'erp.vendas.visualizar'],
    execute:(q,id,input)=>q.attachments(id,input.documento as 'venda',Number(input.registro_id))},
  {name:'listar_pagamentos',title:'Listar pagamentos',output:outputs.page,description:toolDescription('listar_pagamentos'),
    schema:z.object({empresa_id:company,pagina:paging.pagina,por_pagina:paging.por_pagina,tipo:z.enum(['receber','pagar']).optional()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.payments(id,{page:Number(input.pagina),pageSize:Number(input.por_pagina),type:input.tipo as string|undefined})},
  { name: 'consultar_estoque', title: 'Consultar estoque', output: outputs.page, description: toolDescription('consultar_estoque'),
    schema: z.object(paging).strict(), capabilities: ['erp.estoque.visualizar'], execute: (q,id,input) => q.stock(id,page(input)) },
  {name:'analisar_periodo',title:'Indicadores por mês',output:outputs.analysis,description:toolDescription('analisar_periodo'),
    schema:z.object({empresa_id:company,tipo:z.enum(['vendas','compras','pagar','receber']),inicio:requiredDate,fim:requiredDate}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input=>['erp.relatorios.visualizar',input.tipo==='vendas'?'erp.vendas.visualizar':input.tipo==='compras'?'erp.compras.visualizar':'erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.analysis(id,input.tipo as 'vendas',String(input.inicio),String(input.fim))},
  { name:'consultar_relatorio',title:'Consultar relatório',output:outputs.report,description:toolDescription('consultar_relatorio'),
    schema:z.object({empresa_id:company,tipo:z.enum(['dre','margem-vendas','margem-itens','margem-clientes','orcado-realizado','metas','fluxo-de-caixa','aging-receber','aging-pagar','dre-competencia','dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque','comissoes']),
      inicio:requiredDate,fim:requiredDate,pagina:paging.pagina,por_pagina:paging.por_pagina}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input => ['erp.relatorios.visualizar', String(input.tipo).startsWith('vendas-') || String(input.tipo).startsWith('margem-') || input.tipo === 'metas' || input.tipo === 'comissoes' ? 'erp.vendas.visualizar' : String(input.tipo).startsWith('compras-') ? 'erp.compras.visualizar' : input.tipo === 'valor-estoque' ? 'erp.estoque.visualizar' : 'erp.financeiro.visualizar'],
    execute:(q,id,input) => q.report(id,String(input.tipo),String(input.inicio),String(input.fim),page(input)) },
]
export const tools:ToolDefinition[]=readTools.map(tool=>({...tool,schema:documentInputSchema(tool.schema,tool.name)}))
export const accessSchema = z.object({ empresa_id: company }).strict()
