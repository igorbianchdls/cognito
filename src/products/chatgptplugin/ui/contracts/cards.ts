import { z } from 'zod'
import { companySchema } from '../../tools/catalog'

export const cardSources = {
  tabela:['listar_notas_servico','consultar_financeiro','listar_vendas','listar_compras','listar_orcamentos','buscar_cadastros','consultar_estoque','listar_pagamentos','listar_contas_financeiras','consultar_relatorio'],
  detalhes:['obter_nota_servico','obter_cliente','obter_cadastro','obter_venda','obter_compra','obter_parcela_financeira','obter_titulo_financeiro'],
  analise:['analisar_periodo','consultar_relatorio'],
  selecao:['meu_acesso','buscar_cadastros','listar_contas_financeiras'],
  revisao:['obter_rascunho'],
  resultado:['obter_rascunho'],
} as const
export const cardSchema=z.object({
  empresa_id:companySchema,
  card:z.enum(['tabela','detalhes','analise','selecao','revisao','resultado']),
  consulta:z.enum(['listar_notas_servico','obter_nota_servico','consultar_financeiro','listar_vendas','listar_compras','listar_orcamentos','buscar_cadastros','consultar_estoque','listar_pagamentos','listar_contas_financeiras','consultar_relatorio','obter_cliente','obter_cadastro','obter_venda','obter_compra','obter_parcela_financeira','obter_titulo_financeiro','analisar_periodo','meu_acesso','obter_rascunho']),
  parametros:z.record(z.unknown()).default({}).refine(value=>Object.keys(value).length<=16&&!Object.hasOwn(value,'empresa_id'),'Informe empresa_id apenas no nível principal.'),
}).strict()
export type CardRequest=z.infer<typeof cardSchema>
export type CardPayload={
  card:CardRequest['card'];consulta:CardRequest['consulta'];parametros:Record<string,unknown>;
  empresa:{id:number;nome:string}|null;dados:Record<string,unknown>;
}
export const cardDefinition={name:'renderizar_card',title:'Apresentar resultado do ERP',
  description:'Renderizar um card focado no pedido: tabela (consultas paginadas), detalhes (um registro), analise (analisar_periodo ou consultar_relatorio), selecao (cadastros/empresas/contas financeiras), revisao ou resultado (obter_rascunho com rascunho_id). Informe consulta e seus parametros, sem empresa_id dentro de parametros. Dados são consultados no ERP; não envie linhas ou totais inventados. Revisar abre aprovação humana no ERP. Sem abas de outras áreas.',schema:cardSchema}
