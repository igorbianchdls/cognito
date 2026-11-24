import { z } from 'zod'
import { lineTotal, sumMoney, discountAmount } from '@/products/erp/shared/erpMoney'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { companySchema, requiredDate } from '../tools/catalog'
import { PluginError } from '../../../shared/contracts'
import { expandedSchemas, saleData } from './expandedContracts'
import {serviceInvoiceInputSchema,simulationScenarioSchema,serviceInvoiceTotals,cancellationReasonSchema} from '@/products/erp/shared/serviceInvoiceContracts'

const name = z.string().trim().min(1).max(200)
const money = z.number().finite().min(0).max(100000000).multipleOf(0.01)
// Venda e orçamento compartilham o contrato com a edição (preço opcional, vendedor, tabela e transporte).
const commercial = saleData
export const proposalSchema = z.discriminatedUnion('tipo', [
  z.object({tipo:z.literal('nota_servico'),dados:serviceInvoiceInputSchema}).strict(),
  ...(['suspender_contrato','retomar_contrato','encerrar_contrato','devolver_compra'] as const).map(tipo=>z.object({tipo:z.literal(tipo),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict()),
  z.object({tipo:z.literal('editar_nota_servico'),dados:serviceInvoiceInputSchema.extend({registro_id:z.number().int().positive()}).strict()}).strict(),
  z.object({tipo:z.literal('simular_nota_servico'),dados:z.object({registro_id:z.number().int().positive(),cenario:simulationScenarioSchema.default('sucesso')}).strict()}).strict(),
  z.object({tipo:z.literal('consultar_resultado_nota_servico'),dados:z.object({registro_id:z.number().int().positive()}).strict()}).strict(),
  // Cancelamento no leiaute nacional: código do motivo (1 erro na emissão, 2 serviço não prestado, 9 outros) e justificativa de 15+ caracteres.
  z.object({tipo:z.literal('cancelar_nota_servico'),dados:z.object({registro_id:z.number().int().positive(),codigo_motivo:cancellationReasonSchema.default('9'),motivo:z.string().trim().min(15).max(1000)}).strict()}).strict(),
  z.object({tipo:z.literal('excluir_nota_servico'),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict(),
  ...expandedSchemas,
  // Cliente com documento e endereço principal (comercial e cobrança), suficientes para venda e nota.
  z.object({tipo:z.literal('cliente'),dados:z.object({nome:name,tipo:z.enum(['fisica','juridica']).default('fisica'),documento:z.string().trim().max(30).optional(),
    email:z.string().email().max(254).optional(),telefone:z.string().trim().max(30).optional(),cidade:z.string().trim().max(100).optional(),
    cep:z.string().trim().max(10).optional(),logradouro:z.string().trim().max(200).optional(),numero_endereco:z.string().trim().max(20).optional(),
    complemento:z.string().trim().max(100).optional(),bairro:z.string().trim().max(100).optional(),uf:z.string().trim().length(2).optional()}).strict()}).strict(),
  // Transferência entre duas contas financeiras da empresa (não movimenta banco de verdade).
  z.object({tipo:z.literal('transferencia_financeira'),dados:z.object({conta_origem_id:z.number().int().positive(),conta_destino_id:z.number().int().positive(),
    valor:money.refine(v=>v>0,'Informe um valor maior que zero.'),data:requiredDate,descricao:z.string().trim().max(200).optional()}).strict()
    .refine(d=>d.conta_origem_id!==d.conta_destino_id,'Origem e destino devem ser diferentes.')}).strict(),
  // Entrada, saída ou ajuste manual de estoque de um produto num local.
  z.object({tipo:z.literal('movimento_estoque'),dados:z.object({produto_id:z.number().int().positive(),movimento:z.enum(['entrada','saida','ajuste_entrada','ajuste_saida']),
    quantidade:z.number().finite().positive().max(1000000).multipleOf(0.0001),local_estoque_id:z.number().int().positive().optional(),
    custo_unitario:money.optional(),data:requiredDate.optional(),motivo:z.string().trim().min(3).max(500).optional()}).strict()
    .refine(d=>!d.movimento.startsWith('ajuste')||!!d.motivo,'Ajuste de estoque exige motivo.')}).strict(),
  // Recebimento (total ou parcial) dos itens de uma compra confirmada.
  z.object({tipo:z.literal('receber_compra'),dados:z.object({registro_id:z.number().int().positive(),
    itens:z.array(z.object({item_id:z.number().int().positive(),quantidade:z.number().finite().positive().max(1000000).multipleOf(0.0001),local_estoque_id:z.number().int().positive().optional()}).strict()).min(1).max(100),
    data:requiredDate.optional(),observacoes:z.string().trim().max(2000).optional()}).strict()}).strict(),
  // Contrato de venda recorrente com um produto ou serviço.
  z.object({tipo:z.literal('contrato'),dados:z.object({cliente_id:z.number().int().positive(),descricao:z.string().trim().min(1).max(500),
    produto_id:z.number().int().positive().optional(),servico_id:z.number().int().positive().optional(),quantidade:z.number().finite().positive().max(100000),
    valor_unitario:money,data_inicio:requiredDate,data_fim:requiredDate.optional(),
    periodicidade:z.enum(['semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual']),dia_vencimento:z.number().int().min(1).max(31).default(1),
    numero:z.string().trim().max(60).optional()}).strict()
    .refine(d=>Number(Boolean(d.produto_id))+Number(Boolean(d.servico_id))===1,'Escolha um produto ou um serviço.')
    .refine(d=>!d.data_fim||d.data_fim>=d.data_inicio,'Fim anterior ao início do contrato.')}).strict(),
  z.object({tipo:z.literal('produto'),dados:z.object({nome:name,sku:z.string().trim().max(60).optional(),preco:money,
    controla_estoque:z.enum(['sim','nao']).default('sim')}).strict()}).strict(),
  z.object({tipo:z.literal('orcamento'),dados:commercial}).strict(),
  z.object({tipo:z.literal('venda'),dados:commercial}).strict(),
  z.object({tipo:z.literal('editar_cliente'),dados:z.object({registro_id:z.number().int().positive(),nome:name.optional(),
    tipo:z.enum(['fisica','juridica']).optional(),documento:z.string().trim().max(30).optional(),status:z.enum(['ativo','inativo']).optional(),
    email:z.string().email().max(254).optional(),telefone:z.string().trim().min(8).max(30).optional(),
    limite_credito:money.nullable().optional().describe('Limite de crédito em reais; null remove o limite.'),
    bloqueio_comercial:z.boolean().optional(),bloqueio_motivo:z.string().trim().min(3).max(500).optional(),
    tabela_preco_id:z.number().int().positive().nullable().optional()}).strict()
    .refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteração.')
    .refine(d=>d.bloqueio_comercial!==true||!!d.bloqueio_motivo,'Informe o motivo do bloqueio comercial.')}).strict(),
  z.object({tipo:z.literal('editar_produto'),dados:z.object({registro_id:z.number().int().positive(),nome:name.optional(),
    sku:z.string().trim().max(60).optional(),preco:money.optional(),controla_estoque:z.enum(['sim','nao']).optional(),status:z.enum(['ativo','pausado']).optional()}).strict()
    .refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteração.')}).strict(),
  z.object({tipo:z.literal('confirmar_venda'),dados:z.object({registro_id:z.number().int().positive(),liberar_credito_motivo:z.string().trim().min(3).max(500).optional().describe('Só quando a venda passar do limite de crédito do cliente e o usuário (do financeiro) pedir para liberar.')}).strict()}).strict(),
  ...(['confirmar_compra','cancelar_compra','atender_venda','converter_orcamento'] as const).map(tipo=>z.object({tipo:z.literal(tipo),dados:z.object({registro_id:z.number().int().positive()}).strict()}).strict()),
  // Devolução: itens da venda confirmada e tratamento financeiro; o valor é calculado pelo ERP (estimado na prévia).
  z.object({tipo:z.literal('devolucao_venda'),dados:z.object({registro_id:z.number().int().positive(),tratamento:z.enum(['abater','credito','reembolso']),
    motivo:z.string().trim().min(3).max(1000),itens:z.array(z.object({venda_item_id:z.number().int().positive(),quantidade:z.number().finite().positive().max(100000).multipleOf(0.0001)}).strict()).min(1).max(100),
    data_devolucao:requiredDate.optional(),categoria_id:z.number().int().positive().optional(),data_vencimento:requiredDate.optional(),valor_estimado:money.optional()}).strict()
    .refine(d=>d.tratamento!=='reembolso'||(d.categoria_id&&d.data_vencimento),'Reembolso exige categoria e vencimento.')}).strict(),
  z.object({tipo:z.literal('cancelar_venda'),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict(),
  ...(['receber_parcela','pagar_parcela'] as const).map(tipo=>z.object({tipo:z.literal(tipo),dados:z.object({registro_id:z.number().int().positive(),
    valor:money.refine(v=>v>0),data_pagamento:requiredDate,conta_financeira_id:z.number().int().positive()}).strict()}).strict()),
  z.object({tipo:z.literal('estornar_pagamento'),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict(),
])
export type Proposal = z.infer<typeof proposalSchema>
export const prepareSchema = z.object({empresa_id:companySchema,chave_operacao:z.string().uuid(),proposta:proposalSchema}).strict()
export const draftSchema = z.object({empresa_id:companySchema,rascunho_id:z.string().uuid()}).strict()
export const draftsSchema = z.object({empresa_id:companySchema,pagina:z.number().int().min(1).max(10000).default(1),por_pagina:z.number().int().min(10).max(50).default(20)}).strict()
export function proposalCapability(proposal: Proposal): ErpCapability {
  if(proposal.tipo.includes('conta_pagar')||proposal.tipo.includes('conta_receber')||proposal.tipo.includes('conta_financeira'))return 'erp.financeiro.gerenciar'
  if(['fornecedor','vendedor','servico','categoria','excluir_cliente','excluir_produto'].includes(proposal.tipo)||/^(editar|excluir)_(fornecedor|vendedor|servico|categoria)$/.test(proposal.tipo))return 'erp.cadastros.gerenciar'
  if(proposal.tipo==='compra')return 'erp.compras.gerenciar'
  if (['cliente','produto','editar_cliente','editar_produto'].includes(proposal.tipo)) return 'erp.cadastros.gerenciar'
  if (proposal.tipo.endsWith('_compra')) return 'erp.compras.gerenciar'
  if (proposal.tipo === 'receber_parcela' || proposal.tipo === 'pagar_parcela') return 'erp.financeiro.baixar'
  if (proposal.tipo === 'estornar_pagamento') return 'erp.financeiro.estornar'
  if (proposal.tipo === 'atender_venda') return 'erp.estoque.movimentar'
  return 'erp.vendas.gerenciar'
}
export function proposalCapabilities(proposal:Proposal):ErpCapability[] {
  if(proposal.tipo==='transferencia_financeira')return ['erp.financeiro.gerenciar']
  if(proposal.tipo==='movimento_estoque')return [proposal.dados.movimento.startsWith('ajuste')?'erp.estoque.ajustar':'erp.estoque.movimentar']
  if(proposal.tipo==='receber_compra')return ['erp.compras.gerenciar','erp.estoque.movimentar']
  if(proposal.tipo==='contrato')return ['erp.vendas.gerenciar']
  if(proposal.tipo==='devolver_compra')return ['erp.compras.gerenciar','erp.financeiro.gerenciar','erp.estoque.movimentar']
  if(['excluir_venda','excluir_orcamento','excluir_compra'].includes(proposal.tipo))return [proposalCapability(proposal),'erp.financeiro.visualizar','erp.estoque.visualizar']
  if(/^excluir_(cliente|fornecedor|vendedor|produto|servico|categoria|conta_financeira)$/.test(proposal.tipo))return [proposalCapability(proposal),'erp.cadastros.gerenciar','erp.vendas.visualizar','erp.compras.visualizar','erp.financeiro.visualizar','erp.estoque.visualizar']
  if(proposal.tipo.includes('conta_financeira'))return ['erp.financeiro.gerenciar','erp.cadastros.gerenciar']
  if(proposal.tipo==='devolucao_venda')return ['erp.vendas.gerenciar',proposal.dados.tratamento==='reembolso'?'erp.financeiro.gerenciar':'erp.financeiro.baixar']
  return proposal.tipo === 'atender_venda' ? [proposalCapability(proposal),'erp.vendas.gerenciar'] : [proposalCapability(proposal)]
}
export function proposalEntity(proposal: Proposal): ErpConnectedModuleId {
  const mapping:Partial<Record<Proposal['tipo'],ErpConnectedModuleId>>={fornecedor:'fornecedores',vendedor:'vendedores',servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras',compra:'pedidos-compra',conta_pagar:'contas-a-pagar',conta_receber:'contas-a-receber'}
  if(mapping[proposal.tipo])return mapping[proposal.tipo]!
  return proposal.tipo === 'cliente' ? 'clientes' : proposal.tipo === 'produto' ? 'produtos' : 'pedidos'
}
export function proposalPreview(proposal: Proposal) {
  if(proposal.tipo==='nota_servico'||proposal.tipo==='editar_nota_servico'){
    const {registro_id:_id,...raw}=proposal.dados as Record<string,unknown>
    const totals=serviceInvoiceTotals(serviceInvoiceInputSchema.parse(raw))
    return {tipo:proposal.tipo,dados:{...proposal.dados,itens:totals.items},total:totals.total,modo_operacao:'simulacao',valor_iss:totals.valor_iss,valor_liquido:totals.valor_liquido}
  }
  if(proposal.tipo==='devolucao_venda')return {tipo:proposal.tipo,dados:proposal.dados,...(proposal.dados.valor_estimado!==undefined?{total:proposal.dados.valor_estimado}:{})}
  if(proposal.tipo==='transferencia_financeira')return {tipo:proposal.tipo,dados:proposal.dados,total:proposal.dados.valor}
  if(proposal.tipo==='contrato')return {tipo:proposal.tipo,dados:proposal.dados,total:lineTotal(proposal.dados.quantidade,proposal.dados.valor_unitario,0)}
  if(proposal.tipo==='movimento_estoque'||proposal.tipo==='receber_compra')return {tipo:proposal.tipo,dados:proposal.dados}
  const raw=proposal.dados as Record<string,unknown>
  if('valor_total' in raw && 'parcelas' in raw){try{const parts=raw.parcelas as {valor:number}[];if(sumMoney(parts.map(p=>p.valor))!==raw.valor_total)throw new Error();return {tipo:proposal.tipo,dados:proposal.dados,total:Number(raw.valor_total)}}catch{throw new PluginError('INVALID_INPUT','A soma das parcelas deve ser igual ao valor total.')}}
  if (!('itens' in raw)) return {tipo:proposal.tipo,dados:proposal.dados}
  try {
    const itens = (raw.itens as {quantidade:number;valor_unitario:number;desconto:number}[]).map(item => ({...item,total:lineTotal(item.quantidade,item.valor_unitario,item.desconto)}))
    const subtotal = sumMoney(itens.map(item => item.total))
    const discount = discountAmount(subtotal, Number(raw.desconto || 0), raw.tipo_desconto === 'percentual' ? 'percentual' : 'valor')
    const total = sumMoney([subtotal, -discount, Number(raw.frete || 0)])
    if (total < 0 || (total === 0 && !proposal.tipo.includes('ordem_servico'))) throw new Error('Invalid total')
    if(Array.isArray(raw.parcelas) && sumMoney(raw.parcelas.map(p=>Number(p.valor)))!==total) throw new Error('Installments mismatch')
    return {tipo:proposal.tipo,dados:{...proposal.dados,itens},total}
  } catch { throw new PluginError('INVALID_INPUT','Confira quantidades, preços, descontos, frete e a soma das parcelas.') }
}
export function purchaseValues(values:Record<string,unknown>):Record<string,unknown>{
  return {...values,itens:(values.itens as {tipo:string;item_id:number;desconto:number}[]).map(item=>({...item,[item.tipo==='produto'?'produto_id':'servico_id']:item.item_id,valor_desconto:item.desconto}))}
}
export function proposalValues(proposal: Proposal): Record<string, unknown> {
  if(proposal.tipo==='compra')return {...purchaseValues(proposal.dados),tipo_movimento:'cotacao',gera_financeiro:true,status:'rascunho'}
  if(['fornecedor','vendedor'].includes(proposal.tipo)){const d=proposal.dados as Record<string,unknown>;return {...d,status:'ativo',...(d.email||d.telefone?{contatos:[{nome:d.nome,email:d.email||'',telefone:d.telefone||'',finalidades:['comercial'],principais:['comercial']}]}:{})}}
  if(['servico','categoria','conta_financeira'].includes(proposal.tipo))return {...proposal.dados,status:'ativo'}
  if(proposal.tipo==='cliente'){
    const {cep,logradouro,numero_endereco,complemento,bairro,uf,...d}=proposal.dados
    const hasAddress=[cep,logradouro,numero_endereco,complemento,bairro,uf,d.cidade].some(Boolean)
    return {...d,status:'ativo',
      ...(d.email||d.telefone?{contatos:[{nome:d.nome,email:d.email||'',telefone:d.telefone||'',finalidades:['comercial'],principais:['comercial']}]}:{}),
      ...(hasAddress?{enderecos:[{identificacao:'Principal',logradouro:logradouro||'',numero:numero_endereco||'',complemento:complemento||'',bairro:bairro||'',cidade:d.cidade||'',uf:(uf||'').toUpperCase(),cep:cep||'',finalidades:['comercial','cobranca'],principais:['comercial','cobranca']}]}:{})}
  }
  return {...proposal.dados,...(proposal.tipo === 'produto'
    ? {status:'ativo'} : {tipo_documento:proposal.tipo,status:'rascunho'})}
}
