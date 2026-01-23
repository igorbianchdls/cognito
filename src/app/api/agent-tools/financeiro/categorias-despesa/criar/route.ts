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

    // Resolve tenant_id
    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const nome = typeof payload.nome === 'string' ? payload.nome.trim() : ''
    if (!nome) return Response.json({ ok: false, error: 'nome é obrigatório' }, { status: 400 })

    const codigo = typeof payload.codigo === 'string' ? payload.codigo.trim() : null
    const descricao = typeof payload.descricao === 'string' ? payload.descricao.trim() : null
    const tipoRaw = typeof payload.tipo === 'string' ? payload.tipo.trim().toLowerCase() : 'operacional'
    const tipo = ['operacional','financeira','outras'].includes(tipoRaw) ? tipoRaw : 'operacional'
    const planoId = (payload.plano_conta_id !== undefined && payload.plano_conta_id !== null) ? Number(payload.plano_conta_id) : null
    const ativo = payload.ativo === undefined ? true : Boolean(payload.ativo)

    // Duplicidade por tenant + nome
    const dup = await runQuery<{ id: number }>(
      `SELECT id FROM financeiro.categorias_despesa WHERE tenant_id = $1 AND LOWER(nome) = LOWER($2) LIMIT 1`,
      [tenantId, nome]
    )
    if (dup.length) return Response.json({ ok: false, error: 'Categoria de despesa já existe' }, { status: 409 })

    const sql = `
      INSERT INTO financeiro.categorias_despesa
        (tenant_id, codigo, nome, descricao, tipo, natureza, plano_conta_id, ativo)
      VALUES ($1,$2,$3,$4,$5,'despesa',$6,$7)
      RETURNING id, tenant_id, codigo, nome, descricao, tipo, natureza, plano_conta_id, ativo, criado_em, atualizado_em
    `.replace(/\n\s+/g, ' ').trim()
    const params = [tenantId, codigo, nome, descricao, tipo, planoId, ativo]
    const [row] = await runQuery<Record<string, unknown>>(sql, params)
    if (!row) throw new Error('Falha ao criar categoria de despesa')
    return Response.json({ ok: true, result: { success: true, data: row, message: 'Categoria de despesa criada com sucesso' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

