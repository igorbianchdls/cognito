import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'

const id = z.number().int().positive().safe()
const describe = <Schema extends z.ZodTypeAny>(schema: Schema, text: string) => schema.describe(text)
export const classificationItem = z.object({
  registro_id: describe(id, 'ID do título a pagar, não da parcela, desta empresa.'),
  categoria_id: describe(id, 'ID da categoria financeira de despesa ativa e sem subcategorias, retornada pela consulta.'),
}).strict()
export const workflowInputs = {
  conciliacao: z.object({
    transacao_bancaria_id: describe(id, 'ID da movimentação retornado por consultar_conciliacoes.'),
    pagamento_id: describe(id.optional(), 'ID do pagamento sugerido; informe pagamento ou transferência, nunca ambos.'),
    transferencia_financeira_id: describe(id.optional(), 'ID da transferência sugerida, em lugar de pagamento_id.'),
  }).strict().refine(input => Boolean(input.pagamento_id) !== Boolean(input.transferencia_financeira_id), 'Escolha pagamento ou transferência.'),
  classificacao: z.object({ itens: describe(z.array(classificationItem).min(1).max(50).refine(items => new Set(items.map(item => item.registro_id)).size === items.length, 'Não repita títulos.'), 'Um ou até 50 títulos, cada um com sua categoria selecionada.') }).strict(),
  notas: z.object({ venda_ids: describe(z.array(id).min(1).max(50).refine(ids => new Set(ids).size === ids.length, 'Não repita vendas.'), 'IDs das vendas elegíveis, até 50, selecionadas e revisadas. Não informar números comerciais.') }).strict(),
}
export type WorkflowKind = keyof typeof workflowInputs
export type WorkflowInput = z.infer<(typeof workflowInputs)[WorkflowKind]>
export const writeNames: Record<WorkflowKind, string> = { conciliacao: 'conciliar_movimentacao', classificacao: 'classificar_despesas', notas: 'emitir_notas_lote' }
export const workflowCapabilities: Record<WorkflowKind, ErpCapability[]> = {
  conciliacao: ['erp.financeiro.visualizar', 'erp.financeiro.gerenciar'],
  classificacao: ['erp.financeiro.visualizar', 'erp.financeiro.gerenciar'],
  notas: ['erp.vendas.visualizar', 'erp.vendas.gerenciar', 'erp.financeiro.visualizar', 'erp.financeiro.baixar'],
}
export type Fields = Record<string, unknown>
export type WorkflowItem = {
  input: Fields; hash: string; preview: Fields
  status: 'pending' | 'saved' | 'failed' | 'awaiting' | 'unknown'
  result?: Fields; message?: string; code?: string
}
export type WorkflowRow = {
  id: string; empresa_id: number; user_id: number; oauth_client_id: string; integration: string
  operation_key: string; kind: WorkflowKind; input_hash: string; items: WorkflowItem[]
  status: 'pending' | 'approved' | 'completed'; expires_at: string; approved_at: string | null
}
