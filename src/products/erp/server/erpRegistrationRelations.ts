import type { SQLClient } from '@/lib/postgres'
import { parseRegistrationRelations } from '@/products/erp/shared/registrationContracts'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'

// Parent version and lock protect the entire registration, including its children.
export async function saveRegistrationRelations(client: SQLClient, tenantId: number, entityId: number, actorId: number, values: Record<string, unknown>) {
  const normalized = { ...values }
  // Older API/tool clients send a single contact. Translate it without discarding
  // other contacts or bypassing the same validation/version lock used by the UI.
  if (values.contatos === undefined && (values.email !== undefined || values.telefone !== undefined)) {
    const existing = await client.query(`SELECT id::text,nome,coalesce(cargo,'') cargo,coalesce(email,'') email,
      coalesce(telefone,'') telefone,whatsapp,finalidades,principais FROM erp.entidades_contatos
      WHERE empresa_id=$1 AND entidade_id=$2 AND ativo ORDER BY ('comercial'=ANY(principais)) DESC,id FOR UPDATE`, [tenantId,entityId])
    const rows = existing.rows
    const selected = { nome: String(values.nome || 'Contato principal'), cargo:'', email:'', telefone:'', whatsapp:false,
      finalidades:['comercial'], principais:['comercial'], ...rows[0],
      ...(values.email !== undefined ? {email:String(values.email ?? '').trim()} : {}),
      ...(values.telefone !== undefined ? {telefone:String(values.telefone ?? '').trim()} : {}) }
    normalized.contatos = selected.email || selected.telefone ? [selected,...rows.slice(1)] : rows.slice(1)
  }
  const parsed = parseRegistrationRelations(normalized)
  const snapshots: Record<string, unknown> = {}
  for (const key of ['contatos','enderecos'] as const) {
    const rows = parsed[key]
    if (rows === undefined) continue // An omitted collection is preserved.
    const table = key === 'contatos' ? 'entidades_contatos' : 'entidades_enderecos'
    const before = await client.query(`SELECT * FROM erp.${table} WHERE empresa_id=$1 AND entidade_id=$2 AND ativo FOR UPDATE`, [tenantId,entityId])
    const owned = new Set(before.rows.map(r => String(r.id)))
    for (const row of rows) if (row.id && !owned.has(row.id)) throw new ErpDomainError('INVALID_REFERENCE', 'Contato ou endereço não pertence a este cadastro.', 422)
    // Release principal assignments before applying swaps; retain removed rows for history.
    await client.query(`UPDATE erp.${table} SET ativo=false, principais='{}' WHERE empresa_id=$1 AND entidade_id=$2 AND ativo`, [tenantId,entityId])
    for (const row of rows) {
      const { id, ...fields } = row
      const names = Object.keys(fields)
      const parameters: unknown[] = [tenantId,entityId,...Object.entries(fields).map(([name,value]) =>
        key === 'enderecos' && (name === 'logradouro' || name === 'cidade') && value === '' ? null : value)]
      if (id) {
        parameters.push(id)
        await client.query(`UPDATE erp.${table} SET ${names.map((name,i)=>`${name}=$${i+3}`).join(',')}, ativo=true WHERE empresa_id=$1 AND entidade_id=$2 AND id=$${parameters.length}`,parameters)
      } else {
        parameters.push(actorId)
        await client.query(`INSERT INTO erp.${table} (empresa_id,entidade_id,${names.join(',')},criado_por) VALUES (${parameters.map((_,i)=>`$${i+1}`).join(',')})`,parameters)
      }
    }
    const after = await client.query(`SELECT * FROM erp.${table} WHERE empresa_id=$1 AND entidade_id=$2 AND ativo ORDER BY id`, [tenantId,entityId])
    snapshots[key] = { antes: before.rows, depois: after.rows }
  }
  return snapshots
}
