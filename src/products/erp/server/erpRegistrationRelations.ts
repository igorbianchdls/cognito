import type { SQLClient } from '@/lib/postgres'
import { parseRegistrationRelations } from '@/products/erp/shared/registrationContracts'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'

// Parent version and lock protect the entire registration, including its children.
export async function saveRegistrationRelations(client: SQLClient, tenantId: number, entityId: number, actorId: number, values: Record<string, unknown>) {
  const parsed = parseRegistrationRelations(values)
  const snapshots: Record<string, unknown> = {}
  for (const key of ['contatos','enderecos'] as const) {
    const rows = parsed[key]
    if (rows === undefined) continue // An omitted collection is preserved.
    const table = key === 'contatos' ? 'entidades_contatos' : 'entidades_enderecos'
    const before = await client.query(`SELECT * FROM erp.${table} WHERE tenant_id=$1 AND entidade_id=$2 AND ativo FOR UPDATE`, [tenantId,entityId])
    const owned = new Set(before.rows.map(r => String(r.id)))
    for (const row of rows) if (row.id && !owned.has(row.id)) throw new ErpDomainError('INVALID_REFERENCE', 'Contato ou endereço não pertence a este cadastro.', 422)
    // Release principal assignments before applying swaps; retain removed rows for history.
    await client.query(`UPDATE erp.${table} SET ativo=false, principais='{}' WHERE tenant_id=$1 AND entidade_id=$2 AND ativo`, [tenantId,entityId])
    for (const row of rows) {
      const { id, ...fields } = row
      const names = Object.keys(fields)
      const parameters: unknown[] = [tenantId,entityId,...Object.values(fields)]
      if (id) {
        parameters.push(id)
        await client.query(`UPDATE erp.${table} SET ${names.map((name,i)=>`${name}=$${i+3}`).join(',')}, ativo=true WHERE tenant_id=$1 AND entidade_id=$2 AND id=$${parameters.length}`,parameters)
      } else {
        parameters.push(actorId)
        await client.query(`INSERT INTO erp.${table} (tenant_id,entidade_id,${names.join(',')},criado_por) VALUES (${parameters.map((_,i)=>`$${i+1}`).join(',')})`,parameters)
      }
    }
    const after = await client.query(`SELECT * FROM erp.${table} WHERE tenant_id=$1 AND entidade_id=$2 AND ativo ORDER BY id`, [tenantId,entityId])
    snapshots[key] = { antes: before.rows, depois: after.rows }
  }
  return snapshots
}
