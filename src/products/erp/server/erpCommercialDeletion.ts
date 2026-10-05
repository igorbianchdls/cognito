import { withTransaction } from '@/lib/postgres'
import { archiveCommercialDraft } from './erpCrudRepository'
import { ErpDomainError } from '../shared/erpErrors'

export function deleteCommercialDraft(input: { tenantId: number; actorId: number; type: 'vendas' | 'compras'; id: number; expectedVersion: number; motivo: string }) {
  return withTransaction(async client => {
    const row = (await client.query(`SELECT versao FROM erp.${input.type} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, input.id])).rows[0]
    if (!row) throw new ErpDomainError('NOT_FOUND', 'Documento não disponível nesta empresa.', 404)
    if (Number(row.versao) !== input.expectedVersion) throw new ErpDomainError('VERSION_CONFLICT', 'Este documento mudou. Atualize antes de excluir.', 409, undefined, 'refresh')
    const id = await archiveCommercialDraft(client, input.tenantId, input.actorId, input.type, input.id, input.motivo)
    return { id, deleted: true }
  })
}
