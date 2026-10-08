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
  // context.origin: domínio do plugin, para links absolutos (ex.: PDF da nota) que exigem login no ERP.
  execute: (queries: ErpQueries, companyId: number, input: Record<string, unknown>, context: { origin: string }) => Promise<unknown>
}
function page(input: Record<string, unknown>) {
  return { query: input.busca as string | undefined, page: input.pagina as number, pageSize: input.por_pagina as number, sort: input.ordenar as string | undefined }
}
function commercialFilters(input:Record<string,unknown>) {
  return Object.fromEntries(['status','inicio','fim'].filter(k=>input[k]).map(k=>[k,String(input[k])]))
}
const registrationTypes = z.enum(['clientes','fornecedores','vendedores','produtos','servicos','categorias','categorias-cadastro','contas-financeiras'])
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
    schema: z.object({ ...paging, tipo_documento: z.enum(['venda','orcamento']).default('venda'), ordenar: z.enum(['-data','data','-total','total']).optional().describe('Ordenação de todas as páginas; padrão: mais recentes.'),
      status: z.enum(['rascunho','confirmada','cancelada','faturada']).optional(),inicio:isoDate,fim:isoDate }).strict(),
    capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.page(id,'pedidos', { ...page(input),
      filters: {...commercialFilters(input),...(input.tipo_documento==='orcamento'?{tipo_documento:'orcamento'}:{})} }) },
  { name: 'obter_venda', title: 'Detalhes da venda', output: outputs.sale, description: 'Use para ver itens, valores e vencimentos de uma venda ou orçamento pelo ID retornado por listar_vendas. Retorna até 100 itens.',
    schema: z.object({ empresa_id: company, venda_id: z.number().int().positive() }).strict(), capabilities: ['erp.vendas.visualizar'],
    execute: (q,id,input) => q.sale(id, input.venda_id as number) },
  { name:'listar_compras', title:'Listar compras', output: outputs.page, description:'Use quando o usuário perguntar sobre compras de fornecedores: por número, fornecedor, status ou período do documento.',
    schema:z.object({...paging,status:z.enum(['rascunho','confirmada','parcialmente_recebida','recebida','cancelada']).optional(),inicio:isoDate,fim:isoDate,ordenar:z.enum(['-data','data','-total','total']).optional()}).strict(), capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.page(id,'pedidos-compra',{...page(input),filters:commercialFilters(input)}) },
  { name:'obter_compra', title:'Detalhes da compra', output: outputs.purchase, description:'Use para ver itens, valores e vencimentos de uma compra pelo ID retornado por listar_compras. Retorna até 100 itens.',
    schema:z.object({empresa_id:company,compra_id:z.number().int().positive()}).strict(),capabilities:['erp.compras.visualizar'],
    execute:(q,id,input) => q.purchase(id,input.compra_id as number) },
  {name:'listar_notas_servico',title:'Listar notas de serviço',output:outputs.page,description:'Use quando o usuário perguntar sobre notas fiscais de serviço (NFS-e) simuladas: por número, cliente, situação ou competência, ou para obter o ID usado nas demais tools de nota. Simulação sem validade fiscal.',
    schema:z.object({...paging,status:z.enum(['rascunho','aguardando_retorno','emitida','falha','cancelada']).optional(),inicio:isoDate,fim:isoDate}).strict(),capabilities:['erp.vendas.visualizar'],
    execute:(q,id,input)=>q.serviceInvoices(id,{busca:input.busca as string|undefined,status:input.status as string|undefined,inicio:input.inicio as string|undefined,fim:input.fim as string|undefined,pagina:Number(input.pagina),por_pagina:Number(input.por_pagina)})},
  {name:'obter_nota_servico',title:'Detalhes da nota de serviço',output:outputs.serviceInvoice,description:'Use para ver itens, impostos, retenções, histórico e situação de uma nota de serviço simulada pelo ID de listar_notas_servico. Devolve pdf_url (DANFSe) e, se autorizada, xml_url: links que abrem no navegador com o usuário logado no ERP.',
    schema:z.object({empresa_id:company,nota_id:z.number().int().positive()}).strict(),capabilities:['erp.vendas.visualizar'],
    execute:async(q,id,input,context)=>{const detail=await q.serviceInvoice(id,Number(input.nota_id)),link=(path:unknown)=>path?new URL(String(path),context.origin).toString():null
      const {input:editable,...rest}=detail
      return {...rest,dados_editaveis:editable,record:{...detail.record,pdf_url:link(detail.record.pdf_url),xml_url:link(detail.record.xml_url)}}}},
  { name: 'consultar_financeiro', title: 'Contas a pagar e receber', output: outputs.page, description: 'Use quando o usuário perguntar sobre contas a pagar ou a receber, vencimentos, atrasos ou saldos em aberto. Retorna parcelas; summary considera todas as filtradas. Não efetua pagamentos (registrar_baixa).',
    schema: z.object({ ...paging, tipo: z.enum(['pagar','receber']), status: z.enum(['aberto','pendente','pago','parcial','vencido','cancelado','renegociado']).optional(),
      vencimento_inicio: isoDate, vencimento_fim: isoDate, ordenar: z.enum(['vencimento','-vencimento','-saldo','saldo','-valor']).optional().describe('Ordenação de todas as páginas; padrão: vencimento mais próximo.') }).strict(), capabilities: ['erp.financeiro.visualizar'],
    execute: (q,id,input) => q.page(id,input.tipo === 'pagar' ? 'contas-a-pagar' : 'contas-a-receber', {
      ...page(input), filters: Object.fromEntries(['status','vencimento_inicio','vencimento_fim'].filter(k => input[k]).map(k => [k,String(input[k])])) }) },
  {name:'obter_titulo_financeiro',title:'Detalhes do título financeiro',output:outputs.financialTitle,description:'Use para ver um título a pagar ou receber com todas as parcelas e o histórico, pelo conta_id da listagem. Use este ID para editar_titulo e excluir_titulo, nunca o ID da parcela.',
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),conta_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.financialTitle(id,input.tipo as 'pagar',Number(input.conta_id))},
  {name:'obter_parcela_financeira',title:'Detalhes da parcela',output:outputs.installment,description:'Use para ver uma parcela a pagar ou receber, a composição do saldo e o histórico de pagamentos, antes de registrar_baixa.',
    schema:z.object({empresa_id:company,tipo:z.enum(['pagar','receber']),parcela_id:z.number().int().positive()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.installment(id,input.tipo as 'pagar',Number(input.parcela_id))},
  {name:'listar_anexos',title:'Listar anexos',output:outputs.page,description:'Use quando o usuário pedir os arquivos anexados (PDF, imagem, XML, comprovante de pagamento) de uma conta a pagar ou receber, pagamento, venda, compra, contrato ou ordem de serviço. Devolve um link de download válido por 60 segundos; não guarde nem repita links vencidos.',
    schema:z.object({empresa_id:company,documento:z.enum(['conta_pagar','conta_receber','pagamento','venda','compra','contrato','ordem_servico']),registro_id:z.number().int().positive()}).strict(),
    capabilities:['erp.financeiro.visualizar','erp.vendas.visualizar','erp.compras.visualizar'],
    requiredCapabilities:input=>[['conta_pagar','conta_receber','pagamento'].includes(String(input.documento))?'erp.financeiro.visualizar':input.documento==='compra'?'erp.compras.visualizar':'erp.vendas.visualizar'],
    execute:(q,id,input)=>q.attachments(id,input.documento as 'venda',Number(input.registro_id))},
  {name:'listar_pagamentos',title:'Listar pagamentos',output:outputs.page,description:'Use quando o usuário perguntar sobre pagamentos ou recebimentos já registrados, ou para obter o ID usado em estornar_pagamento.',
    schema:z.object({empresa_id:company,pagina:paging.pagina,por_pagina:paging.por_pagina,tipo:z.enum(['receber','pagar']).optional()}).strict(),capabilities:['erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.payments(id,{page:Number(input.pagina),pageSize:Number(input.por_pagina),type:input.tipo as string|undefined})},
  { name: 'consultar_estoque', title: 'Consultar estoque', output: outputs.page, description: 'Use quando o usuário perguntar quanto há de um produto, reservas ou disponibilidade por local.',
    schema: z.object(paging).strict(), capabilities: ['erp.estoque.visualizar'], execute: (q,id,input) => q.stock(id,page(input)) },
  {name:'analisar_periodo',title:'Indicadores por mês',output:outputs.analysis,description:'Use quando o usuário pedir evolução ou totais mensais de vendas, compras, contas a pagar ou a receber num período de até 366 dias. Vendas e compras consideram documentos confirmados; financeiro considera saldo pendente por vencimento.',
    schema:z.object({empresa_id:company,tipo:z.enum(['vendas','compras','pagar','receber']),inicio:requiredDate,fim:requiredDate}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input=>['erp.relatorios.visualizar',input.tipo==='vendas'?'erp.vendas.visualizar':input.tipo==='compras'?'erp.compras.visualizar':'erp.financeiro.visualizar'],
    execute:(q,id,input)=>q.analysis(id,input.tipo as 'vendas',String(input.inicio),String(input.fim))},
  { name:'consultar_relatorio',title:'Consultar relatório',output:outputs.report,description:'Use quando o usuário pedir margem (margem-vendas, margem-itens, margem-clientes: receita líquida menos custo), orçado × realizado do ano (orcado-realizado), metas de venda e atingimento (metas), a DRE (dre: "tive lucro?", receita líquida, lucro bruto, resultado operacional e lucro líquido pelos 9 grupos, por competência), fluxo de caixa (realizado e previsto, com saldo acumulado: "vou ter caixa?"), contas em atraso por cliente ou fornecedor (aging-receber/aging-pagar: "quem está me devendo?"), resultado por competência ou por caixa, posição financeira, vendas por cliente/vendedor/produto, comissões a pagar por vendedor (comissoes), compras por fornecedor/categoria ou valor do estoque, num período de até 366 dias. No aging, a data final é a data de referência do atraso.',
    schema:z.object({empresa_id:company,tipo:z.enum(['dre','margem-vendas','margem-itens','margem-clientes','orcado-realizado','metas','fluxo-de-caixa','aging-receber','aging-pagar','dre-competencia','dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque','comissoes']),
      inicio:requiredDate,fim:requiredDate,pagina:paging.pagina,por_pagina:paging.por_pagina}).strict(),capabilities:['erp.relatorios.visualizar'],
    requiredCapabilities:input => ['erp.relatorios.visualizar', String(input.tipo).startsWith('vendas-') || String(input.tipo).startsWith('margem-') || input.tipo === 'metas' || input.tipo === 'comissoes' ? 'erp.vendas.visualizar' : String(input.tipo).startsWith('compras-') ? 'erp.compras.visualizar' : input.tipo === 'valor-estoque' ? 'erp.estoque.visualizar' : 'erp.financeiro.visualizar'],
    execute:(q,id,input) => q.report(id,String(input.tipo),String(input.inicio),String(input.fim),page(input)) },
]
export const accessSchema = z.object({ empresa_id: company }).strict()
