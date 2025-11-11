import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

type LookupRow = { tipo: string; id: string; nome: string }

export const buscarFinanceiroLookups = tool({
  description: 'Lista métodos de pagamento e contas financeiras (com filtro opcional por nome).',
  inputSchema: z.object({
    termo: z.string().optional().describe('Filtro por nome (ILIKE)'),
    tenant_id: z.number().optional().describe('Tenant ID (aplicado apenas em contas financeiras)'),
    limite: z.number().int().positive().max(200).optional().describe('Limite de registros (default 50)')
  }),
  execute: async ({ termo, tenant_id, limite }) => {
    const limitVal = Math.max(1, Math.min(200, limite || 50))
    const params: unknown[] = []
    let idx = 1

    const tenantClause = tenant_id ? ` WHERE cf.tenant_id = $${idx++}` : ''
    if (tenant_id) params.push(tenant_id)

    const termClause = termo ? ` WHERE u.nome ILIKE $${idx++}` : ''
    if (termo) params.push(`%${termo}%`)

    const sql = `
      SELECT * FROM (
        SELECT 'metodo_pagamento'::text AS tipo, id::text AS id, nome::text AS nome
          FROM financeiro.metodos_pagamento
        UNION ALL
        SELECT 'conta_financeira'::text AS tipo, cf.id::text AS id, cf.nome_conta::text AS nome
          FROM financeiro.contas_financeiras cf${tenantClause}
      ) u
      ${termClause}
      ORDER BY u.tipo, u.nome
      LIMIT $${idx}
    `.replace(/\n\s+/g, ' ').trim()
    params.push(limitVal)

    const rows = await runQuery<LookupRow>(sql, params)
    const metodos = rows.filter(r => r.tipo === 'metodo_pagamento').length
    const contas = rows.filter(r => r.tipo === 'conta_financeira').length

    const message = termo
      ? `${contas} contas e ${metodos} métodos para "${termo}"`
      : `${contas} contas financeiras e ${metodos} métodos de pagamento`

    return {
      success: true,
      title: 'Contas e Métodos',
      message,
      rows,
      counts: { contas, metodos }
    }
  }
})

