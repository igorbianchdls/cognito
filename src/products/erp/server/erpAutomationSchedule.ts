import { runQuery } from '@/lib/postgres'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { runErpAutomation } from './erpProfessionalRepository'
import { DEFAULT_ERP_TIME_ZONE, businessDay, normalizeTimeZone } from '@/products/erp/shared/businessDate'

const routineTypes = ['contratos', 'recorrencias_financeiras', 'titulos_vencidos', 'indicadores', 'estoque_minimo'] as const
const tenantConcurrency = 4

type AutomationResult = { tenantId: number; routine: string; status: string; error?: string }

async function runTenantAutomations(
  tenant: { empresa_id: number; actor_id: number },
  competence: string,
): Promise<AutomationResult[]> {
  const results: AutomationResult[] = []
  for (const routine of routineTypes) {
    try {
      const result = await runErpAutomation({
        tenantId: tenant.empresa_id,
        actorId: tenant.actor_id,
        tipo: routine,
        competencia: competence,
      })
      results.push({ tenantId: tenant.empresa_id, routine, status: String(result?.status || 'concluida') })
    } catch (error) {
      results.push({
        tenantId: tenant.empresa_id,
        routine,
        status: 'falha',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Falha desconhecida.',
      })
    }
  }
  return results
}


export async function runScheduledErpAutomations() {
    const tenants = await runQuery<{ empresa_id: number; actor_id: number; fuso_horario: string | null }>(
      `SELECT DISTINCT ON (memberships.empresa_id) memberships.empresa_id, memberships.usuario_id AS actor_id,
         to_jsonb(tenants)->>'fuso_horario' AS fuso_horario
       FROM shared.usuarios_empresas memberships
       JOIN shared.empresas tenants ON tenants.id=memberships.empresa_id AND tenants.status='active'
       JOIN shared.usuarios users ON users.id=memberships.usuario_id AND users.clerk_user_id IS NOT NULL
       WHERE memberships.status = 'active' AND memberships.role IN ('owner', 'admin')
       ORDER BY memberships.empresa_id, CASE memberships.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, memberships.usuario_id`,
    )
    // Cada empresa usa o próprio dia; a competência devolvida é a do fuso padrão.
    const now = new Date(), competence = businessDay(DEFAULT_ERP_TIME_ZONE, now)
    const results: AutomationResult[] = []
    for (let index = 0; index < tenants.length; index += tenantConcurrency) {
      const batch = tenants.slice(index, index + tenantConcurrency)
      const batchResults = await Promise.allSettled(batch.map((tenant) => runWithErpDatabaseContext(
        { tenantId: tenant.empresa_id, userId: tenant.actor_id, timeZone: normalizeTimeZone(tenant.fuso_horario) },
        () => runTenantAutomations(tenant, businessDay(tenant.fuso_horario, now)),
      )))
      batchResults.forEach((result,index) => {
        if(result.status==='fulfilled') results.push(...result.value)
        else results.push({tenantId:batch[index].empresa_id,routine:'empresa',status:'falha',error:result.reason instanceof Error ? result.reason.message.slice(0,500) : 'Falha ao processar a empresa.'})
      })
    }
    const failures=results.filter(result=>result.status==='falha').length
    if (failures) console.error(JSON.stringify({scope:'erp.automacoes',competence,failures,tenants:tenants.length,routines:results.filter(result=>result.status==='falha').map(result=>({tenantId:result.tenantId,routine:result.routine}))}))
    return {
      competence,
      tenants: tenants.length,
      executions: results.length,
      failures,
      results,
    }
}

export async function listAutomationExecutions(tenantId:number,page=1) {
  const records = await runQuery(`SELECT id::text, tipo, competencia, status, tentativas, resultado, erro, iniciado_em, finalizado_em,historico_estados,evento_cobranca_id::text FROM erp.execucoes_automacao WHERE empresa_id = $1 ORDER BY criado_em DESC,id DESC LIMIT 31 OFFSET $2`, [tenantId,(page-1)*30])
  // Saúde: rotina sem execução concluída nas últimas 26 h indica agendamento parado (cron, segredo ou falha).
  const latest = await runQuery<{ tipo: string; ultima: string | null }>(`SELECT tipo, max(finalizado_em)::text AS ultima FROM erp.execucoes_automacao
    WHERE empresa_id = $1 AND status = 'concluida' GROUP BY tipo`, [tenantId])
  const lastRun = new Map(latest.map(row => [row.tipo, row.ultima]))
  const limit = Date.now() - 26 * 60 * 60 * 1000
  const atrasadas = routineTypes.filter(tipo => { const last = lastRun.get(tipo); return !last || new Date(last).getTime() < limit })
  return { records:records.slice(0,30),hasMore:records.length>30,saude:{ atrasadas, ultimaExecucao:Object.fromEntries(routineTypes.map(tipo => [tipo, lastRun.get(tipo) ?? null])) } }
}
