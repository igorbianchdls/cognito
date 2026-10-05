import { runQuery, withTransaction, runWithErpTransactionClient } from '@/lib/postgres'
import { ErpDomainError } from '../shared/erpErrors'

type Input = { tenantId: number; actorId: number; tipo: string; competencia: string }

/** A claim survives worker termination; business effects and completion commit together. */
export async function runRecoverableErpAutomation(input: Input, work: () => Promise<unknown>) {
  const key = `${input.tipo}:${input.competencia}`
  const claim = await withTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`erp:execution:${input.tenantId}:${key}`])
    const current = await client.query(`SELECT id::text,status,resultado,erro,tentativas,
      iniciado_em > now()-interval '15 minutes' AS lease_active FROM erp.execucoes_automacao
      WHERE empresa_id=$1 AND chave_idempotencia=$2 FOR UPDATE`, [input.tenantId, key])
    const previous = current.rows[0]
    if (previous && (previous.status === 'concluida' || (previous.status === 'processando' && previous.lease_active))) return { claimed: false, record: previous }
    const result = previous ? await client.query(`UPDATE erp.execucoes_automacao SET status='processando',tentativas=tentativas+1,
      iniciado_em=now(),finalizado_em=NULL,erro=NULL,resultado='{}'::jsonb,atualizado_por=$3
      WHERE empresa_id=$1 AND id=$2 RETURNING id::text,tentativas`, [input.tenantId, previous.id, input.actorId])
      : await client.query(`INSERT INTO erp.execucoes_automacao(empresa_id,tipo,competencia,status,tentativas,chave_idempotencia,iniciado_em,criado_por,atualizado_por)
      VALUES($1,$2,$3,'processando',1,$4,now(),$5,$5) RETURNING id::text,tentativas`, [input.tenantId, input.tipo, input.competencia, key, input.actorId])
    return { claimed: true, record: result.rows[0] }
  })
  if (!claim.claimed) return claim.record
  const execution = claim.record
  try {
    return await withTransaction(async client => {
      const owner = await client.query('SELECT status,tentativas FROM erp.execucoes_automacao WHERE empresa_id=$1 AND id=$2 FOR UPDATE', [input.tenantId, execution.id])
      if (owner.rows[0]?.status !== 'processando' || Number(owner.rows[0]?.tentativas) !== Number(execution.tentativas)) throw new ErpDomainError('AUTOMATION_RECLAIMED', 'Esta execução foi retomada por outra tentativa.', 409)
      return runWithErpTransactionClient(client, async () => {
        const result = await work()
        const contractResult = result as { skipped?: unknown[]; remaining?: number } | null
        const incomplete = input.tipo === 'contratos' && (Boolean(contractResult?.skipped?.length) || Number(contractResult?.remaining || 0) > 0)
        const completed = await client.query(`UPDATE erp.execucoes_automacao SET status=$5,resultado=$3::jsonb,
          finalizado_em=now(),atualizado_por=$4,erro=$6 WHERE empresa_id=$1 AND id=$2 RETURNING id::text,status,resultado`,
        [input.tenantId, execution.id, JSON.stringify(result ?? {}), input.actorId, incomplete ? 'falha' : 'concluida', incomplete ? 'Há contratos pendentes. Confira o resultado e execute novamente para continuar o lote.' : null])
        return completed.rows[0]
      })
    })
  } catch (error) {
    await runQuery(`UPDATE erp.execucoes_automacao SET status='falha',erro=$3,finalizado_em=now(),atualizado_por=$4
      WHERE empresa_id=$1 AND id=$2 AND status='processando' AND tentativas=$5`,
    [input.tenantId, execution.id, error instanceof Error ? error.message : 'Falha desconhecida', input.actorId, execution.tentativas])
    throw error
  }
}
