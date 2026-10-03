import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpQueries } from '../application/erpQueries'

const company = z.number().int().positive().optional().describe('Empresa autorizada retornada por meu_acesso. Obrigatoria se houver mais de uma empresa.')
const paging = { empresa_id: company, busca: z.string().trim().max(200).optional(),
  pagina: z.number().int().min(1).max(10000).default(1), por_pagina: z.number().int().min(10).max(50).default(20) }
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value
}, 'Data invalida.').optional()
export type ToolDefinition = {
  name: string; title: string; description: string; schema: z.AnyZodObject
  capabilities: ErpCapability[]
  execute: (queries: ErpQueries, companyId: number, input: Record<string, unknown>) => Promise<unknown>
}
function page(input: Record<string, unknown>) {
  return { query: input.busca as string | undefined, page: input.pagina as number, pageSize: input.por_pagina as number }
}
export const tools: ToolDefinition[] = [
  { name: 'resumo_erp', title: 'Resumo do ERP', description: 'Consultar indicadores financeiros, vendas, compras e cadastros da empresa. Requer permissoes de todas essas areas.',
    schema: z.object({ empresa_id: company }).strict(),
    capabilities: ['erp.relatorios.visualizar','erp.financeiro.visualizar','erp.vendas.visualizar','erp.compras.visualizar','erp.cadastros.visualizar'],
    execute: (q, id) => q.overview(id) },
  { name: 'buscar_cadastros', title: 'Buscar cadastros', description: 'Localizar clientes, fornecedores, produtos ou servicos no ERP, com busca e paginacao.',
    schema: z.object({ ...paging, tipo: z.enum(['clientes','fornecedores','produtos','servicos']),
      status: z.enum(['ativo','inativo']).optional() }).strict(), capabilities: ['erp.cadastros.visualizar'],
    execute: (q,id,input) => q.page(id,input.tipo as 'clientes', { ...page(input), filters: input.status ? { status: String(input.status) } : {} }) },
  { name: 'listar_vendas', title: 'Listar vendas', description: 'Buscar pedidos de venda por numero, cliente ou status, com paginacao.',
    schema: z.object({ ...paging, status: z.enum(['rascunho','confirmado','cancelado','faturado','atendido','parcial']).optional() }).strict(),
    capabilities: ['erp.vendas.visualizar'], execute: (q,id,input) => q.page(id,'pedidos', { ...page(input), filters: input.status ? { status: String(input.status) } : {} }) },
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
]
export const accessSchema = z.object({ empresa_id: company }).strict()
