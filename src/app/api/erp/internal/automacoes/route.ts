import { NextResponse } from 'next/server'

import { runQuery } from '@/lib/postgres'
import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { runErpAutomation } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'
export const maxDuration = 300

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

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET nao configurado.' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 })
  }
  try {
    const tenants = await runQuery<{ tenant_id: number; actor_id: number }>(
      `SELECT DISTINCT ON (memberships.tenant_id) memberships.tenant_id, memberships.user_id AS actor_id
       FROM shared.tenant_memberships memberships
       WHERE memberships.status = 'active' AND memberships.role IN ('owner', 'admin')
       ORDER BY memberships.tenant_id, CASE memberships.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, memberships.user_id`,
    )
    const competence = new Date().toISOString().slice(0, 10)
    const results: AutomationResult[] = []
    for (let index = 0; index < tenants.length; index += tenantConcurrency) {
      const batch = tenants.slice(index, index + tenantConcurrency)
      const batchResults = await Promise.all(batch.map((tenant) => runTenantAutomations(tenant, competence)))
      results.push(...batchResults.flat())
    }
    return NextResponse.json({
      competence,
      tenants: tenants.length,
      executions: results.length,
      failures: results.filter((result) => result.status === 'falha').length,
      results,
    })
  } catch (error) { return erpErrorResponse(error) }
}
