import {z} from 'zod'
import {erpDateSchema} from './erpTransport'
import {lineTotal,sumMoney,discountAmount} from './erpMoney'

export const SIMULATION_NOTICE='SIMULAÇÃO - SEM VALIDADE FISCAL'
export const simulationScenarioSchema=z.enum(['sucesso','rejeicao','demora','timeout'])
const amount=z.number().finite().min(0).max(100000000).multipleOf(0.01)
export const serviceInvoiceInputSchema=z.object({
 cliente_id:z.number().int().positive(),venda_id:z.number().int().positive().optional(),
 data_competencia:erpDateSchema,codigo_municipio_prestacao:z.string().regex(/^\d{7}$/),
 modelo_emissao:z.enum(['nfse_municipal','nfse_nacional']).default('nfse_nacional'),
 itens:z.array(z.object({tipo:z.literal('servico').default('servico'),item_id:z.number().int().positive(),
  descricao:z.string().trim().min(3).max(1000),quantidade:z.number().finite().positive().max(100000).multipleOf(0.0001),
  valor_unitario:amount,desconto:amount.default(0)}).strict()).min(1).max(50),
 aliquota_iss:z.number().finite().min(0).max(100).multipleOf(0.0001).default(0),iss_retido:z.boolean().default(false),
 observacoes:z.string().trim().max(2000).default(''),
}).strict()
export type ServiceInvoiceInput=z.input<typeof serviceInvoiceInputSchema>
export const invoiceKeySchema=z.string().trim().min(8).max(200)
export const serviceInvoiceCreateSchema=z.object({chave_operacao:invoiceKeySchema,dados:serviceInvoiceInputSchema}).strict()
export const serviceInvoiceEditSchema=serviceInvoiceCreateSchema.extend({versao:z.number().int().positive()}).strict()
export const serviceInvoiceActionSchema=z.object({chave_operacao:invoiceKeySchema,versao:z.number().int().positive(),
 acao:z.enum(['emitir','consultar','cancelar','excluir']),cenario:simulationScenarioSchema.default('sucesso'),
 motivo:z.string().trim().min(3).max(1000).optional()}).strict()
export type ServiceInvoiceAction=z.input<typeof serviceInvoiceActionSchema>
export function serviceInvoiceTotals(input:ServiceInvoiceInput){
 const data=serviceInvoiceInputSchema.parse(input)
 const items=data.itens.map(item=>({...item,total:lineTotal(item.quantidade,item.valor_unitario,item.desconto)}))
 const total=sumMoney(items.map(i=>i.total))
 const iss=discountAmount(total,data.aliquota_iss,'percentual'),retained=data.iss_retido?iss:0
 return {items,total,base_iss:total,valor_iss:iss,retencao_iss:retained,valor_liquido:sumMoney([total,-retained])}
}
