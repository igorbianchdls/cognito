import { z } from 'zod'

// Contratos de saída declarados no tools/list. O SDK valida structuredContent contra eles,
// por isso tipos estritos só onde o formato é garantido; os demais campos são documentados.
const row = z.record(z.unknown())
const rows = z.array(row)
const info=(description:string)=>z.unknown().optional().describe(description)
const businessRecord=z.object({
  id:info('ID interno do registro, às vezes textual; converter para número somente quando o schema da próxima tool exigir. Não é número comercial.'),
  numero:info('Número comercial/fiscal do documento, distinto do ID interno.'),
  status:info('Situação do registro de negócio; não confundir com pending/saved da aprovação.'),
  tipo_documento:info('venda ou orcamento; define o fluxo comercial permitido.'),
  situacao:info('Situação comercial da proposta, distinta do status do documento.'),
  total:info('Total monetário do documento em reais; não representa pagamento recebido.'),
  valor_total:info('Valor bruto/original em reais.'),saldo:info('Saldo atualmente pendente em reais, após efeitos financeiros.'),
  conta_id:info('ID do título financeiro; editar/excluir/efetivar usam este ID, não o id da parcela.'),
  valor_pago:info('Dinheiro registrado; outros abatimentos podem reduzir saldo sem compor este campo.'),
  tipo_lancamento:info('previsao é expectativa; efetivo é lançamento confirmado.'),
  origem:info('Origem manual/venda/compra/recorrência; identifica quando edição/exclusão manual não é permitida.'),
  fiscal_status:info('Situação fiscal da venda, separada da confirmação e do atendimento de estoque.'),
  codigo_tributacao_nacional:info('Código fiscal do serviço, 6 dígitos; emissão simulada exige o mesmo código nos itens. Não é codigo do cadastro.'),
  codigo_servico_municipal:info('Código municipal do serviço já cadastrado.'),codigo_nbs:info('Código NBS já cadastrado.'),
  dre_grupo_codigo:info('Código de classificação DRE (1 a 9), distinto de dre_grupo_id; null indica ausência de grupo.'),
  dre_grupo_id:info('ID do grupo DRE ou marcador legado fora/nao_classificado; não enviar como dre_grupo_codigo.'),
  fora_dre:info('Categoria financeira excluída do resultado da DRE.'),
  limite_credito:info('Limite em reais; null significa limite não definido.'),
  bloqueio_comercial:info('Bloqueio cadastrado do cliente (sim/nao no retorno); entrada de edição usa boolean.'),
  tabela_preco_id:info('Tabela de preço cadastrada, para preservar em edição; não inventar ID.'),
  estornado_em:info('Data do estorno; pagamento não deve ser estornado novamente quando preenchido.'),
  estorno_de_pagamento_id:info('ID do pagamento original quando este registro é um estorno.'),
  quantidade_fisica:info('Quantidade física atual na unidade do produto.'),
  quantidade_reservada:info('Quantidade reservada em vendas.'),quantidade_disponivel:info('Quantidade física menos reservada; posição atual, não histórica.'),
  unidade_medida:info('Unidade em que as quantidades devem ser interpretadas.'),local_estoque:info('Local ao qual o saldo de estoque se refere.'),
  pdf_url:info('Link temporário do PDF; pode incluir credencial no token. Renove pela tool correspondente após expiração.'),
  xml_url:info('Link temporário do XML da NFS-e autorizada/cancelada; null quando não disponível.'),
  erro_codigo:info('Código da rejeição/falha da nota, quando presente.'),erro_mensagem:info('Motivo retornado pelo simulador; use para orientar correção, sem afirmar que a nota foi autorizada.'),
  valor_iss:info('ISS calculado em reais, não alíquota percentual.'),retencao_iss:info('ISS retido em reais.'),
  retencoes_federais:info('Total monetário das retenções no record da nota; percentuais de entrada ficam em dados_editaveis.'),
  valor_liquido:info('Bruto menos retenções em reais; não equivale a dinheiro já recebido.'),
}).passthrough()
const businessRows=z.array(businessRecord)
const historyTruncated=z.boolean().optional().describe('true: histórico limitado aos registros retornados; não afirmar que foi examinado todo o histórico.')
const installmentsTruncated=z.boolean().optional().describe('true: condição de pagamento incompleta; edição exige dados completos no ERP.')
export function envelope(data: z.ZodTypeAny) {
  return z.object({ ok: z.literal(true), execution_id: z.string().uuid(), empresa_id: z.number().nullable(), data })
}
export const profileFields = {
  id: z.string().min(1).describe('Identificador estável da conta conectada.'), name: z.string(),
  nickname: z.string().optional(), email: z.string().optional(),
}
export const outputs = {
  access: z.object({
    usuario_id: z.number(),
    empresas: z.array(z.object({ id: z.number(), name: z.string(), profile: z.string(), capabilities: z.array(z.string()) }).passthrough())
      .describe('Empresas autorizadas; use id como empresa_id nas demais tools.'),
    empresa_selecionada: z.number().nullable(),
  }).passthrough(),
  page: z.object({
    records: businessRows.describe('Registros da página atual. Em financeiro id é parcela e conta_id é título; em outras listas id é registro de negócio.'),
    page: info('Página atual, iniciando em 1.'), pageSize: info('Tamanho da página. Havendo total, page * pageSize < total indica continuação mesmo sem hasMore.'),
    total: z.unknown().optional().describe('Total de registros filtrados, quando disponível.'),
    hasMore: z.boolean().optional().describe('Há mais páginas; não afirme totais somando apenas esta página.'),
    summary: row.optional().describe('Totais de todos os registros filtrados, inclusive de outras páginas.'),
  }).passthrough(),
  record: z.object({ record: businessRecord.optional().describe('Seleção de campos do cadastro; ausência de campo não deve ser tratada como valor zero.') }).passthrough(),
  serviceOrder:z.object({record:businessRecord,items:rows.describe('Itens ativos da OS com descrição, quantidade, preço e total.'),history:rows.describe('Eventos de mudança da OS.'),totalItems:z.number(),itemsTruncated:z.boolean().describe('Se true, não reconstruir edição com itens incompletos.')}).passthrough(),
  commercialDocument:z.object({record:z.object({pdf_url:z.string().url(),link_expira_em:z.string(),arquivado:z.boolean()}).passthrough(),revisions:rows,hasMore:z.boolean()}).passthrough(),
  sale: z.object({ sale: businessRecord.describe('Cabeçalho da venda/proposta; preserve campos comerciais ao editar.'), items: rows.describe('id é ID do item da venda (venda_item_id para devolução); item_id é ID do cadastro de produto/serviço.'), totalItems: z.number(), itemsTruncated: z.boolean().describe('true: mais de 100 itens; editar documento completo pelo ERP.'), installments: rows.optional().describe('Até 48 parcelas previstas, com campos para preservar condição de pagamento.'),installmentsTruncated }).passthrough(),
  purchase: z.object({ purchase: businessRecord.describe('Cabeçalho da compra; despesas/descontos ou múltiplas parcelas podem impedir edição pelo chat.'), items: rows.describe('Itens com quantidade_recebida; confirmar compra não recebe mercadoria.'), totalItems: z.number(), itemsTruncated: z.boolean().describe('true: mais de 100 itens; editar documento completo pelo ERP.'), installments: rows.optional().describe('Condição de pagamento retornada, até 48 parcelas.'),installmentsTruncated }).passthrough(),
  financialTitle: z.object({ record: businessRecord.extend({
    tipo_lancamento: z.enum(['previsao','efetivo']).describe('previsao: lançamento ainda previsto; efetivo: lançamento efetivado, elegível para baixa conforme as regras do ERP.'),
  }).passthrough().describe('Cabeçalho do título financeiro, id é conta_id. origem distingue manual de automático.'), installments: rows.optional().describe('id é parcela; vencimento deve virar data_vencimento ao reconstruir edição do título.'), history: rows.optional().describe('Pagamentos/estornos, até 100.'),installmentsTruncated,historyTruncated }).passthrough(),
  installment: z.object({ record: businessRecord.optional().describe('Parcela com saldo atual e conta_financeira_sugerida; id é usado em registrar_baixa.'), history: rows.optional(),historyTruncated }).passthrough(),
  serviceInvoice: z.object({ record: businessRecord, items: rows.describe('Itens e alíquotas da nota; não confundir item da nota com ID do cadastro de serviço.'), totals: row.describe('Tributos/retenções e líquido em reais, não percentuais.'), events: rows.optional().describe('Histórico da nota, limitado aos 100 eventos mais recentes.'),
    dados_editaveis: row.optional().describe('Dados atuais no formato de editar_nota_servico; acrescente registro_id. Só nota em rascunho aceita edição.'),links_expiram_em:info('Expiração ISO dos links pdf_url/xml_url, em 15 minutos.') }).passthrough(),
  analysis: z.object({ tipo: z.string(), inicio: z.string(), fim: z.string(), summary: row.optional().describe('Agregado do período completo.'), records: rows.describe('Série mensal; meses sem registros podem não aparecer.'),criterio:info('Critério de seleção informado pelo ERP; financeiro usa saldo pendente atual por vencimento.') }).passthrough(),
  report: z.object({ report: z.string().describe('Variante de relatório solicitada.'), records: rows.describe('Linhas do relatório/página; não presumir total geral quando summary estiver ausente.'), hasMore: z.boolean().optional().describe('Há mais linhas; continue paginação antes de afirmar resultado completo.'),summary:row.optional().describe('Agregados/avisos somente quando a variante os fornece; formato depende do relatório.') }).passthrough(),
  overview: row.describe('Posição atual geral da empresa, sem filtro de período; não é uma DRE.'),
  draft: z.object({
    rascunho_id: z.string().uuid(), empresa_id: z.number(),
    status: z.enum(['pending','saved','cancelled','expired']).describe('Somente saved com registro_id confirma a execução.'),
    registro_id: z.string().nullable().describe('ID resultante: conversão -> venda/orçamento; devolução -> devolução; baixa -> parcela. Não confundir com rascunho_id da aprovação.'),
    etapa: z.enum(['previa','executado']),
    proposta: row.describe('Dados da operação com totais calculados pelo ERP.'),
    alvo: row.nullable().describe('Estado atual do registro alterado, para comparar antes e depois.'),
    expira_em: z.unknown().describe('Validade da prévia. Expirada ou registro alterado exige nova prévia e nova confirmação.'),
    confirmar: z.object({ tool: z.string(), argumentos: row }).optional()
      .describe('Chamada para executar, somente após confirmação explícita do usuário.'),
  }).passthrough(),
}
