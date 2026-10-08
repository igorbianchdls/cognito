import type { SQLClient } from '@/lib/postgres'
import { erpToday } from '@/products/erp/server/erpBusinessDate'

export type ErpDocumentNumberType =
  'venda' | 'orcamento' | 'pedido' | 'compra' | 'ordem_servico' | 'contrato' | 'inventario' | 'transferencia_estoque' | 'devolucao'

// Próximo número sequencial por empresa, tipo e ano (ex.: VEN-2026-0001), reservado na mesma transação do
// documento: se ela for desfeita, o número volta a ficar livre só para números manuais (a sequência não repete).
export async function nextDocumentNumber(client: Pick<SQLClient, 'query'>, tenantId: number, type: ErpDocumentNumberType, date?: string | null) {
  const result = await client.query(
    'SELECT erp.proximo_numero(empresa_id => $1, tipo => $2, data => $3::date) AS numero',
    [tenantId, type, date || erpToday()],
  )
  return String(result.rows[0].numero)
}
