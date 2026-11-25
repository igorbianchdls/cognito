// Ciclo do orçamento. A regra (VD-01) fica em regras/vendas.ts; aqui só os nomes usados pelo resto do código.
import { SITUACOES_ORCAMENTO, orcamentoEncerrado, situacaoOrcamento, type SituacaoOrcamento } from '../regras/vendas'

export const QUOTE_SITUATIONS = SITUACOES_ORCAMENTO
export type QuoteSituation = SituacaoOrcamento
export const quoteSituation = situacaoOrcamento
export const quoteIsClosed = orcamentoEncerrado
