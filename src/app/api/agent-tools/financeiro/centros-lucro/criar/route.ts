import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    // Resolve tenant_id: header > env > fallback 1
    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0
      ? hdrTenant
      : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const nome = typeof payload.nome === 'string' ? payload.nome.trim() : ''
    const codigo = typeof payload.codigo === 'string' ? payload.codigo.trim() : null
    const descricao = typeof payload.descricao === 'string' ? payload.descricao.trim() : null
    const ativo = typeof payload.ativo === 'boolean' ? payload.ativo : true
    if (!nome) return Response.json({ ok: false, error: 'nome é obrigatório' }, { status: 400 })

    const dup = await runQuery<{ id: number }>(
      `SELECT id FROM empresa.centros_lucro WHERE tenant_id = $1 AND LOWER(nome) = LOWER($2) LIMIT 1`,
      [tenantId, nome]
    )
    if (dup.length) return Response.json({ ok: false, error: 'Centro de lucro já existe' }, { status: 409 })

    const ins = await runQuery<{ id: number; nome: string; codigo: string | null; descricao: string | null; ativo: boolean }>(
      `INSERT INTO empresa.centros_lucro (tenant_id, codigo, nome, descricao, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, codigo, descricao, ativo`,
      [tenantId, codigo, nome, descricao, ativo]
    )
    const row = ins[0]
    return Response.json({ ok: true, result: { success: true, data: row, message: 'Centro de lucro criado com sucesso' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
