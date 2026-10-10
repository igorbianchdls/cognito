import { z } from 'zod'
import { requiredDate } from '../tools/catalog'
import { financialTitleCreateSchema, financialTitleEditSchema } from '@/products/erp/shared/financialTitleContracts'
import { serviceOrderCreateSchema } from '@/products/erp/shared/professionalContracts'

const id=z.number().int().positive(), name=z.string().trim().min(1).max(200)
const text=z.string().trim().max(2000), money=z.number().finite().min(0).max(100000000).multipleOf(0.01)
const person=z.object({nome:name,tipo:z.enum(['fisica','juridica']).default('fisica'),documento:z.string().trim().max(30).optional(),email:z.string().email().max(254).optional(),telefone:z.string().trim().max(30).optional()}).strict()
const service=z.object({nome:name,codigo:z.string().trim().max(60).optional(),descricao:text.optional(),preco:money,custo:money.default(0),categoria_id:id.optional()}).strict()
// Categoria financeira (receita/despesa). Grupo da DRE pelo código (1 receita bruta … 9 impostos sobre o lucro) ou
// fora_dre para o que movimenta dinheiro sem ser resultado (empréstimo, aporte, distribuição de lucros, equipamento).
const category=z.object({nome:name,tipo:z.enum(['receita','despesa']),descricao:text.optional(),categoria_pai_id:id.optional(),
  dre_grupo_codigo:z.number().int().min(1).max(9).optional(),fora_dre:z.boolean().optional()}).strict()
const account=z.object({nome:name,tipo:z.enum(['caixa','banco','carteira','cartao','outro']),banco:z.string().trim().max(100).optional(),agencia:z.string().trim().max(30).optional(),conta:z.string().trim().max(60).optional(),digito:z.string().trim().max(10).optional(),saldo_inicial:money.default(0),data_saldo_inicial:requiredDate,padrao:z.enum(['sim','nao']).default('nao')}).strict()
export const commercialItems=z.array(z.object({tipo:z.enum(['produto','servico']),item_id:id,quantidade:z.number().finite().positive().max(100000).multipleOf(0.0001),valor_unitario:money.refine(v=>v>0),desconto:money.default(0)}).strict()).min(1).max(50)
// Venda e orçamento: sem valor_unitario, o ERP usa a tabela de preço do cliente (ou a padrão) ou o preço do cadastro.
export const saleItems=z.array(z.object({tipo:z.enum(['produto','servico']),item_id:id,descricao:z.string().trim().min(1).max(500).optional(),quantidade:z.number().finite().positive().max(100000).multipleOf(0.0001),valor_unitario:money.refine(v=>v>0).optional(),desconto:money.default(0)}).strict()).min(1).max(50)
export const saleCommercialFields={vendedor_id:id.optional(),tabela_preco_id:id.optional(),transportadora_id:id.optional(),
  modalidade_frete:z.enum(['emitente','destinatario','terceiros','proprio_remetente','proprio_destinatario','sem_frete']).optional(),
  volumes:z.number().int().min(0).max(100000).optional(),peso_bruto:z.number().min(0).max(1e7).optional(),peso_liquido:z.number().min(0).max(1e7).optional()}
export const saleData=z.object({cliente_id:id,data_venda:requiredDate,data_vencimento:requiredDate,itens:saleItems,observacoes:text.optional(),
  validade_em:requiredDate.nullable().optional(),previsao_entrega:requiredDate.nullable().optional(),
  tipo_desconto:z.enum(['valor','percentual']).optional(),desconto:money.optional(),frete:money.optional(),observacoes_pagamento:text.optional(),
  parcelas:z.array(z.object({numero_parcela:z.number().int().min(1).max(48).optional(),data_vencimento:requiredDate,valor:money.refine(v=>v>0),descricao:text.optional(),conta_financeira_id:id.optional(),metodo_pagamento_id:id.optional()}).strict()).min(1).max(48).optional(),
  ...saleCommercialFields}).strict()
const serviceOrder=serviceOrderCreateSchema.omit({status:true,numero:true}).strict()
const serviceOrderTarget=z.object({registro_id:id}).strict()
const purchase=z.object({fornecedor_id:id,data_compra:requiredDate,data_vencimento:requiredDate,itens:commercialItems,observacoes:text.optional()}).strict()
function financial(side:'pagar'|'receber') { return financialTitleCreateSchema(side).innerType() }
function financialEdit(side:'pagar'|'receber') { return financialTitleEditSchema(side).innerType().extend({registro_id:id}).strict() }
function operation<T extends string,S extends z.ZodTypeAny>(tipo:T,dados:S){return z.object({tipo:z.literal(tipo),dados}).strict()}
function patch<S extends z.ZodRawShape>(schema:z.ZodObject<S>){return schema.partial().extend({registro_id:id}).strict().refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteração.')}
const deletion=z.object({registro_id:id,motivo:z.string().trim().min(3).max(1000)}).strict()
export const expandedSchemas=[
  operation('ordem_servico',serviceOrder),operation('editar_ordem_servico',serviceOrder.extend({registro_id:id}).strict()),
  ...(['aprovar_ordem_servico','iniciar_ordem_servico','concluir_ordem_servico','gerar_orcamento_os','gerar_venda_os'] as const).map(tipo=>operation(tipo,serviceOrderTarget)),
  operation('cancelar_ordem_servico',serviceOrderTarget.extend({motivo:z.string().trim().min(3).max(1000)}).strict()),
  ...(['enviar_orcamento','aprovar_orcamento'] as const).map(tipo=>operation(tipo,serviceOrderTarget)),
  ...(['recusar_orcamento','cancelar_orcamento'] as const).map(tipo=>operation(tipo,serviceOrderTarget.extend({motivo:z.string().trim().min(3).max(1000)}).strict())),
  ...(['arquivar_pdf_orcamento','arquivar_pdf_ordem_servico'] as const).map(tipo=>operation(tipo,serviceOrderTarget)),
  operation('fornecedor',person),operation('vendedor',person),operation('servico',service),operation('categoria',category),operation('conta_financeira',account),
  // E-mail e telefone atualizam o contato comercial principal do cadastro.
  operation('editar_fornecedor',patch(person.extend({status:z.enum(['ativo','inativo']).optional()}))),operation('editar_vendedor',patch(person.extend({status:z.enum(['ativo','inativo']).optional()}))),operation('editar_servico',patch(service)),operation('editar_categoria',patch(category)),
  // O saldo inicial de uma conta com movimentos não pode ser reescrito.
  operation('editar_conta_financeira',patch(account.omit({saldo_inicial:true,data_saldo_inicial:true}))),
  operation('compra',purchase),operation('editar_compra',purchase.extend({registro_id:id}).strict()),
  operation('editar_venda',saleData.extend({registro_id:id}).strict()),operation('editar_orcamento',saleData.extend({registro_id:id}).strict()),
  operation('conta_pagar',financial('pagar')),operation('conta_receber',financial('receber')),
  operation('editar_conta_pagar',financialEdit('pagar')),operation('editar_conta_receber',financialEdit('receber')),
  operation('efetivar_conta_pagar',z.object({registro_id:id}).strict()),operation('efetivar_conta_receber',z.object({registro_id:id}).strict()),
  ...(['excluir_cliente','excluir_fornecedor','excluir_vendedor','excluir_produto','excluir_servico','excluir_categoria','excluir_conta_financeira','excluir_venda','excluir_orcamento','excluir_compra','excluir_conta_pagar','excluir_conta_receber'] as const).map(tipo=>operation(tipo,deletion)),
] as const

export { operationLabels } from './labels'
