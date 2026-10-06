import { z } from 'zod'
import { requiredDate } from '../tools/catalog'
import { financialTitleCreateSchema, financialTitleEditSchema } from '@/products/erp/shared/financialTitleContracts'

const id=z.number().int().positive(), name=z.string().trim().min(1).max(200)
const text=z.string().trim().max(2000), money=z.number().finite().min(0).max(100000000).multipleOf(0.01)
const person=z.object({nome:name,tipo:z.enum(['fisica','juridica']).default('fisica'),documento:z.string().trim().max(30).optional(),email:z.string().email().max(254).optional(),telefone:z.string().trim().max(30).optional()}).strict()
const service=z.object({nome:name,codigo:z.string().trim().max(60).optional(),descricao:text.optional(),preco:money,custo:money.default(0),categoria_id:id.optional()}).strict()
const category=z.object({nome:name,tipo:z.enum(['receita','despesa','produto','servico','geral','cliente','fornecedor']),descricao:text.optional()}).strict()
const account=z.object({nome:name,tipo:z.enum(['caixa','banco','carteira','cartao','outro']),banco:z.string().trim().max(100).optional(),agencia:z.string().trim().max(30).optional(),conta:z.string().trim().max(60).optional(),digito:z.string().trim().max(10).optional(),saldo_inicial:money.default(0),data_saldo_inicial:requiredDate,padrao:z.enum(['sim','nao']).default('nao')}).strict()
export const commercialItems=z.array(z.object({tipo:z.enum(['produto','servico']),item_id:id,quantidade:z.number().finite().positive().max(100000).multipleOf(0.0001),valor_unitario:money.refine(v=>v>0),desconto:money.default(0)}).strict()).min(1).max(50)
export const saleData=z.object({cliente_id:id,data_venda:requiredDate,data_vencimento:requiredDate,itens:commercialItems,observacoes:text.optional()}).strict()
const purchase=z.object({fornecedor_id:id,data_compra:requiredDate,data_vencimento:requiredDate,itens:commercialItems,observacoes:text.optional()}).strict()
function financial(side:'pagar'|'receber') { return financialTitleCreateSchema(side).innerType() }
function financialEdit(side:'pagar'|'receber') { return financialTitleEditSchema(side).innerType().extend({registro_id:id}).strict() }
function operation<T extends string,S extends z.ZodTypeAny>(tipo:T,dados:S){return z.object({tipo:z.literal(tipo),dados}).strict()}
function patch<S extends z.ZodRawShape>(schema:z.ZodObject<S>){return schema.partial().extend({registro_id:id}).strict().refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteração.')}
const deletion=z.object({registro_id:id,motivo:z.string().trim().min(3).max(1000)}).strict()
export const expandedSchemas=[
  operation('fornecedor',person),operation('vendedor',person),operation('servico',service),operation('categoria',category),operation('conta_financeira',account),
  operation('editar_fornecedor',patch(person.omit({email:true,telefone:true}).extend({status:z.enum(['ativo','inativo']).optional()}))),operation('editar_vendedor',patch(person.omit({email:true,telefone:true}).extend({status:z.enum(['ativo','inativo']).optional()}))),operation('editar_servico',patch(service)),operation('editar_categoria',patch(category)),
  // O saldo inicial de uma conta com movimentos não pode ser reescrito.
  operation('editar_conta_financeira',patch(account.omit({saldo_inicial:true,data_saldo_inicial:true}))),
  operation('compra',purchase),operation('editar_compra',purchase.extend({registro_id:id}).strict()),
  operation('editar_venda',saleData.extend({registro_id:id}).strict()),operation('editar_orcamento',saleData.extend({registro_id:id}).strict()),
  operation('conta_pagar',financial('pagar')),operation('conta_receber',financial('receber')),
  operation('editar_conta_pagar',financialEdit('pagar')),operation('editar_conta_receber',financialEdit('receber')),
  ...(['excluir_cliente','excluir_fornecedor','excluir_vendedor','excluir_produto','excluir_servico','excluir_categoria','excluir_conta_financeira','excluir_venda','excluir_orcamento','excluir_compra','excluir_conta_pagar','excluir_conta_receber'] as const).map(tipo=>operation(tipo,deletion)),
] as const

export { operationLabels } from './labels'
