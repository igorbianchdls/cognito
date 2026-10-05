import { runQuery } from '@/lib/postgres'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { runErpAutomation } from './erpProfessionalRepository'

const routineTypes = ['contratos', 'recorrencias_financeiras', 'titulos_vencidos', 'indicadores', 'estoque_minimo'] as const
const tenantConcurrency = 4

type AutomationResult = { tenantId: number; routine: string; status: string; error?: string }

async function runTenantAutomations(
  tenant: { tenant_id: number; actor_id: number },
  competence: string,
): Promise<AutomationResult[]> {
  const results: AutomationResult[] = []
  for (const routine of routineTypes) {
    try {
      const result = await runErpAutomation({
        tenantId: tenant.tenant_id,
        actorId: tenant.actor_id,
        tipo: routine,
        competencia: competence,
      })
      results.push({ tenantId: tenant.tenant_id, routine, status: String(result?.status || 'concluida') })
    } catch (error) {
      results.push({
        tenantId: tenant.tenant_id,
        routine,
        status: 'falha',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Falha desconhecida.',
      })
    }
  }
  return results
}


export async function runScheduledErpAutomations() {
    const tenants = await runQuery<{ tenant_id: number; actor_id: number }>(
      `SELECT DISTINCT ON (memberships.tenant_id) memberships.tenant_id, memberships.user_id AS actor_id
       FROM shared.tenant_memberships memberships
       JOIN shared.tenants tenants ON tenants.id=memberships.tenant_id AND tenants.status='active'
       JOIN shared.users users ON users.id=memberships.user_id AND users.clerk_user_id IS NOT NULL
       WHERE memberships.status = 'active' AND memberships.role IN ('owner', 'admin')
       ORDER BY memberships.tenant_id, CASE memberships.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, memberships.user_id`,
    )
    const competence = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Fortaleza'}).format(new Date())
    const results: AutomationResult[] = []
    for (let index = 0; index < tenants.length; index += tenantConcurrency) {
      const batch = tenants.slice(index, index + tenantConcurrency)
      const batchResults = await Promise.allSettled(batch.map((tenant) => runWithErpDatabaseContext(
        { tenantId: tenant.tenant_id, userId: tenant.actor_id },
        () => runTenantAutomations(tenant, competence),
      )))
      batchResults.forEach((result,index) => {
        if(result.status==='fulfilled') results.push(...result.value)
        else results.push({tenantId:batch[index].tenant_id,routine:'empresa',status:'falha',error:result.reason instanceof Error ? result.reason.message.slice(0,500) : 'Falha ao processar a empresa.'})
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
  const records = await runQuery(`SELECT id::text, tipo, competencia, status, tentativas, resultado, erro, iniciado_em, finalizado_em,historico_estados,evento_cobranca_id::text FROM erp.execucoes_automacao WHERE tenant_id = $1 ORDER BY criado_em DESC,id DESC LIMIT 31 OFFSET $2`, [tenantId,(page-1)*30])
  return { records:records.slice(0,30),hasMore:records.length>30 }
}
