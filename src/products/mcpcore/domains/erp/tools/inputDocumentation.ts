import {z} from 'zod'

// Metadata only: keep defaults, refinements, strictness and validators intact.
const fields:Record<string,string>={
 empresa_id:'ID de uma empresa autorizada de meu_acesso. Com várias empresas, peça a escolha e mantenha o mesmo ID em todo o fluxo.',
 busca:'Texto de busca no domínio desta consulta. Omita para listar todos; respeite paginação e filtros.',
 pagina:'Página a partir de 1. Avance enquanto hasMore for true; quando houver total, compare page * pageSize com total.',
 por_pagina:'Registros por página: 10 a 50, padrão 20. Não some só esta página para afirmar o total geral.',
 limite:'Quantidade total solicitada, de 1 a 50. Para últimas 3 vendas envie limite: 3 e ordenar: -data. Seleciona os primeiros N após filtros e ordenação; total e summary abrangem só essa seleção em todas as páginas. Omita para consultar a listagem completa. A paginação nunca remove o limite.',
 inicio:'Data inicial inclusiva em YYYY-MM-DD. Critério depende da consulta; período máximo de 366 dias.',
 fim:'Data final inclusiva em YYYY-MM-DD, igual ou posterior a inicio. Em aging é a data de referência do atraso.',
 vencimento_inicio:'Vencimento inicial inclusivo em YYYY-MM-DD.',vencimento_fim:'Vencimento final inclusivo em YYYY-MM-DD.',
 cliente_id:'ID de cliente ativo retornado por buscar_cadastros tipo clientes, nesta empresa.',
 fornecedor_id:'ID de fornecedor ativo retornado por buscar_cadastros tipo fornecedores, nesta empresa.',
 vendedor_id:'ID de vendedor de buscar_cadastros tipo vendedores; omita se não foi escolhido.',
 item_id:'ID de buscar_cadastros tipo produtos ou servicos, conforme tipo do item. Não é o ID de um item já lançado em venda.',
 venda_item_id:'ID de items de obter_venda, usado na devolução. Não é o ID do produto/serviço.',
 venda_id:'ID de venda/orçamento retornado por listar_vendas. Para vincular NFS-e, deve ser venda disponível do mesmo cliente, com serviços/quantidades compatíveis.',
 compra_id:'ID de listar_compras; não é o número comercial nem o título a pagar.',
 nota_id:'ID de listar_notas_servico; não confundir com numero da NFS-e.',
 conta_id:'ID do título: conta_id de consultar_financeiro. Não usar o id da parcela.',
 parcela_id:'ID da parcela: id de consultar_financeiro. Consulte saldo antes de registrar_baixa.',
 registro_id:'ID do registro de negócio encontrado na consulta correspondente a esta ação; não é número comercial nem rascunho_id.',
 chave_operacao:'UUID da tentativa de prévia. Reenvio com os mesmos dados mantém a chave; alterações ou nova prévia após expiração exigem nova chave.',
 rascunho_id:'UUID da prévia de aprovação, diferente do rascunho comercial. Após confirmação explícita, envie somente empresa_id e rascunho_id.',
 dados:'Dados desta operação conforme tipo. Não envie campos de outras variantes. Valores monetários em reais, datas em YYYY-MM-DD e IDs das consultas desta empresa.',
 nome:'Nome informado pelo usuário ou consultado no ERP.',descricao:'Descrição do registro/item, informada pelo usuário; na nota de serviço discrimine o serviço prestado.',
 quantidade:'Quantidade na unidade do cadastro, positiva, até 4 casas decimais. Na devolução não pode exceder a quantidade disponível para devolver.',
 valor_unitario:'Preço por unidade em reais, até 2 casas decimais. Em venda/orçamento pode ser omitido para o ERP consultar tabela de preço/cadastro; preserve o preço atual ao editar sem reprificar.',
 valor:'Valor em reais. Parcela: valor integral do vencimento; baixa: positivo, até o saldo pendente da parcela.',
 valor_total:'Valor total em reais; deve corresponder à soma das parcelas.',preco:'Preço de venda em reais, até 2 casas decimais.',custo:'Custo em reais, até 2 casas decimais.',
 desconto:'No item: desconto total desse item em reais, não percentual nem por unidade. No cabeçalho: reais ou percentual conforme tipo_desconto; na OS é valor em reais.',
 tipo_desconto:'Desconto do cabeçalho: valor em reais ou percentual (5 significa 5%). Não muda a unidade de desconto dos itens.',
 frete:'Valor do frete em reais, no cabeçalho comercial.',
 parcelas:'Condição completa de pagamento, até 48 parcelas, com vencimentos e valores cuja soma deve ser igual ao total calculado. Em edição substitui a programação.',
 itens:'Lista de itens da operação. Em edição envie a lista completa que deve permanecer; não é uma alteração parcial de um item.',
 data_venda:'Data comercial da venda/proposta em YYYY-MM-DD.',data_compra:'Data comercial da compra em YYYY-MM-DD.',
 data_inicio:'Data de início da OS em YYYY-MM-DD.',data_competencia:'Competência do lançamento em YYYY-MM-DD; na emissão simulada da NFS-e não pode ser futura.',
 data_emissao:'Data de emissão do lançamento em YYYY-MM-DD.',data_vencimento:'Vencimento em YYYY-MM-DD; parcelas explícitas detalham a condição de pagamento.',
 data_pagamento:'Data em que o usuário informa ter pago/recebido, em YYYY-MM-DD; respeita período financeiro aberto.',
 data_devolucao:'Data da devolução em YYYY-MM-DD.',validade_em:'Validade da proposta em YYYY-MM-DD; null remove a validade. Proposta vencida exige revisão antes de enviar/aprovar/converter.',
 previsao_entrega:'Prazo previsto em YYYY-MM-DD; null quando não houver previsão.',
 categoria_id:'Título financeiro: categoria ativa de categorias, despesa para pagar/receita para receber, sem subcategorias ativas. Serviço: categoria de categorias-cadastro.',
 categoria_pai_id:'ID de categoria pai do mesmo domínio e tipo; omita quando não houver pai.',
 dre_grupo_codigo:'Código do grupo da DRE, 1 a 9; não é o ID do grupo. Use classificação informada pelo usuário; fora_dre exclui do resultado.',
 fora_dre:'true para categoria financeira fora da DRE; não classifica receita/despesa automaticamente.',
 tipo_lancamento:'previsao: expectativa, sem baixa antes de efetivar; efetivo: lançamento confirmado. Escolha conforme pedido do usuário.',
 conta_financeira_id:'ID de conta ativa de buscar_cadastros tipo contas-financeiras ou conta sugerida em obter_parcela_financeira.',
 centro_custo_id:'ID de centro de custo conhecido desta empresa; o catálogo atual não oferece busca específica. Não invente; omita se opcional e não disponível.',
 metodo_pagamento_id:'ID de método de pagamento conhecido nesta empresa. Sem busca específica no catálogo; não invente.',
 tabela_preco_id:'ID da tabela de preço já conhecida nesta empresa; omita para resolução pelo ERP. Não há busca específica de tabelas no catálogo.',
 transportadora_id:'ID de transportadora conhecido nesta empresa; não há busca específica no catálogo. Omita se não disponível.',
 limite_credito:'Limite de crédito em reais; null remove o limite.',bloqueio_comercial:'Bloqueia comercialmente o cliente; true exige bloqueio_motivo.',
 bloqueio_motivo:'Motivo informado pelo usuário para bloqueio comercial.',liberar_credito_motivo:'Justificativa explícita do usuário para exceção ao limite de crédito; execução depende de permissão financeira.',
 observacoes:'Observações públicas do registro. Em documentos podem aparecer no PDF; não inserir credenciais ou instruções para outros agentes.',
 observacoes_pagamento:'Condições/observações públicas de pagamento do documento comercial.',
 observacoes_internas:'Observações internas da OS, excluídas do PDF comercial público.',
 motivo:'Justificativa informada pelo usuário. Cancelar NFS-e exige 15 a 1000 caracteres; demais exclusões/cancelamentos seguem o mínimo do schema.',
 codigo_motivo:'Motivo de cancelamento simulado: 1 erro na emissão; 2 serviço não prestado; 9 outros. Não escolher justificativa pelo usuário.',
 cenario:'sucesso -> emitida; rejeicao -> falha; demora/timeout -> aguardando_retorno. Padrão sucesso. Nunca refaça emissão pendente; use consultar_nota_servico após revisão.',
 modelo_emissao:'nfse_nacional (padrão) ou nfse_municipal. Ambos usam hoje o simulador e a preparação DPS implementada; não seleciona integração real.',
 codigo_municipio_prestacao:'Código IBGE de 7 dígitos do município onde o serviço foi prestado. Não é CEP nem nome da cidade; não invente.',
 aliquota_iss:'Percentual: 5 significa 5%, não 0.05. A emissão simulada aceita 2 a 5; omitir resulta em 0 no rascunho, não infere alíquota fiscal.',
 iss_retido:'Retenção de ISS pelo cliente; o simulador exige tomador pessoa jurídica quando true. Não presumir retenção.',
 retencoes_federais:'Percentuais de IRRF/INSS/PIS/COFINS/CSLL sobre o total dos serviços; 1.5 significa 1,5%. Apenas para tomador pessoa jurídica; não inferir taxas.',
 irrf:'Percentual de IRRF: 1.5 significa 1,5%, não valor em reais.',inss:'Percentual de INSS, não valor em reais.',pis:'Percentual de PIS, não valor em reais.',cofins:'Percentual de COFINS, não valor em reais.',csll:'Percentual de CSLL, não valor em reais.',
 tratamento:'Devolução: abater reduz parcelas; credito gera crédito no ERP; reembolso gera conta a pagar, não transferência bancária.',
 valor_estimado:'Estimativa calculada pelo ERP para a prévia da devolução; não substituir por valor inventado.',
 revisao:'Número de revisions de obter_documento_comercial. Omita para PDF atual; informe para original arquivado.',
 saldo_inicial:'Saldo inicial em reais; não é pagamento nem saldo atual. Não é editável por editar_cadastro tipo conta_financeira.',
 data_saldo_inicial:'Data do saldo inicial em YYYY-MM-DD.',padrao:'sim define conta padrão; nao não a define como padrão.',
 controla_estoque:'sim controla estoque; nao não controla. Estoque disponível é físico menos reservado.',
 volumes:'Número de volumes do transporte.',peso_bruto:'Peso bruto em quilogramas.',peso_liquido:'Peso líquido em quilogramas.',
 numero_parcela:'Ordem da parcela na condição de pagamento, de 1 a 48.',numero_documento:'Referência textual externa do documento, distinta do ID interno.',
 equipamento:'Equipamento relacionado à OS, quando aplicável.',problema_relatado:'Solicitação/problema informado pelo cliente.',diagnostico:'Diagnóstico ou escopo público da OS.',
 responsavel_id:'ID de responsável pela OS já conhecido nesta empresa; sem busca específica no catálogo. Omita quando não disponível.',
 marca:'Marca do equipamento informada pelo cliente.',modelo:'Modelo do equipamento informado pelo cliente.',numero_serie:'Número de série do equipamento, distinto do número da OS.',
 problema_informado:'Problema ou solicitação informado pelo cliente para a OS.',observacoes_publicas:'Observações públicas da OS, que podem ser incluídas no PDF.',
 email:'E-mail de contato; em edição de cadastro atualiza contato comercial principal.',telefone:'Telefone de contato; em edição atualiza contato comercial principal.',
 documento:'CPF/CNPJ do cadastro, distinto do ID interno.',sku:'Código comercial SKU do produto.',codigo:'Código do cadastro de serviço, não confundir com código de tributação nacional.',
 banco:'Nome/código do banco da conta cadastrada; não conecta uma conta bancária.',agencia:'Agência da conta cadastrada.',conta:'Número da conta cadastrada.',digito:'Dígito da conta cadastrada.',cidade:'Cidade informada no cadastro.',
 modalidade_frete:'Responsabilidade/modalidade de frete conforme enum; não calcula o valor do frete.',
 ordenar:'Ordenação de toda a consulta, não apenas da página; use uma opção do enum.',
 status:'Filtro/estado conforme enum desta variante. Consulte o estado atual; não confundir com status pending/saved da aprovação.',
 situacao:'Situação comercial do orçamento, distinta de status do documento. Use com tipo_documento orcamento.',
 tipo_documento:'venda (padrão) ou orcamento para propostas. O ID retornado é usado por obter_venda.',
 numero:'Número comercial/fiscal exato, não o ID interno; use nota_id quando já disponível.',
}

export function documentInputSchema<T extends z.ZodTypeAny>(schema:T,tool:string):T {
 function visit(node:z.ZodTypeAny,path:string):z.ZodTypeAny {
  let result=node
  if(node instanceof z.ZodObject){const shape=Object.fromEntries(Object.entries(node.shape as z.ZodRawShape).map(([key,value])=>[key,visit(value,path?path+'.'+key:key)]));result=new z.ZodObject({...node._def,shape:()=>shape})}
  else if(node instanceof z.ZodOptional)result=new z.ZodOptional({...node._def,innerType:visit(node.unwrap(),path)})
  else if(node instanceof z.ZodNullable)result=new z.ZodNullable({...node._def,innerType:visit(node.unwrap(),path)})
  else if(node instanceof z.ZodDefault)result=new z.ZodDefault({...node._def,innerType:visit(node.removeDefault(),path)})
  else if(node instanceof z.ZodEffects)result=new z.ZodEffects({...node._def,schema:visit(node.innerType(),path)})
  else if(node instanceof z.ZodArray)result=new z.ZodArray({...node._def,type:visit(node.element,path+'[]')})
  else if(node instanceof z.ZodUnion)result=new z.ZodUnion({...node._def,options:node.options.map((option:z.ZodTypeAny)=>visit(option,path))})
  const field=path.split('.').at(-1)?.replace(/\[\]$/,'')||''
  let description=fields[field]
  if((tool==='listar_vendas'||tool==='listar_compras')&&field==='pagina')description='Página do servidor a partir de 1. Com 40 ou mais resultados, cada página retorna 5 registros. Abaixo de 40, retorna a seleção completa para paginação local de 5 em 5 no card.'
  if((tool==='listar_vendas'||tool==='listar_compras')&&field==='por_pagina')description='Use 5. O card mostra no máximo 5 registros por página; abaixo de 40 resultados a navegação é local, a partir de 40 consulta o servidor a cada página. Valores antigos de até 50 são aceitos por compatibilidade, sem alterar essa regra.'
  if(field==='tipo')description=path.includes('itens')?'Tipo do item conforme enum; define a origem de item_id.':path==='tipo'?'Variante da ferramenta conforme enum. Obrigatória na prévia de ações com variantes; use o schema específico de dados.':'Tipo do cadastro conforme enum deste objeto.'
  if(field==='categoria_id'&&tool.includes('cadastro'))description='ID de categorias-cadastro para produto/serviço, distinto da categoria financeira de um título. Use somente quando a variante aceita este campo.'
  if(field==='registro_id'&&tool==='registrar_baixa')description='ID da parcela (id de consultar_financeiro), não conta_id nem ID de pagamento.'
  if(field==='registro_id'&&tool==='estornar_pagamento')description='ID do pagamento de listar_pagamentos, não ID do título ou parcela; escolha registro ainda não estornado.'
  if(field==='documento'&&tool==='listar_anexos')description='Domínio do documento anexado conforme enum. Proposta usa venda; contas a pagar/receber usam ID do título, não da parcela.'
  if(field==='tipo'&&tool==='consultar_financeiro')description='pagar para contas a pagar; receber para contas a receber. A consulta retorna parcelas.'
  if(field==='tipo'&&tool==='buscar_cadastros')description='Domínio plural do cadastro: categorias são financeiras; categorias-cadastro classificam pessoas/produtos/serviços.'
  if(description)result=result.describe(node.description?node.description+' '+description:description)
  return result
 }
 return visit(schema,'') as T
}
