import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

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

    const nome = typeof payload.nome === 'string' ? payload.nome.trim() : ''
    if (!nome) return Response.json({ ok: false, error: 'nome é obrigatório' }, { status: 400 })

    const cpfCnpj = typeof payload.cpf_cnpj === 'string'
      ? payload.cpf_cnpj.trim()
      : (typeof payload.cnpj_cpf === 'string' ? (payload.cnpj_cpf as string).trim() : '')
    const tenant = typeof payload.tenant_id === 'number' && !Number.isNaN(payload.tenant_id as number) ? (payload.tenant_id as number) : 1

    const insertSql = `
      INSERT INTO entidades.clientes (tenant_id, nome_fantasia, cnpj_cpf)
      VALUES ($1, $2, $3)
      RETURNING id::text AS id,
                COALESCE(nome_fantasia, '')::text AS nome,
                COALESCE(cnpj_cpf, '')::text AS cpf_cnpj
    `.replace(/\n\s+/g, ' ').trim()

    const [row] = await runQuery<{ id: string; nome: string; cpf_cnpj: string }>(insertSql, [tenant, nome, cpfCnpj || null])
    if (!row) return Response.json({ ok: false, error: 'Falha ao criar cliente' }, { status: 500 })

    return Response.json({ ok: true, result: { success: true, data: row, message: `Cliente criado: ${row.nome}`, title: 'Cliente Criado' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
