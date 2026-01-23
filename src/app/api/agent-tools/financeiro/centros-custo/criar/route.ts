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

    const nome = typeof payload.nome === 'string' ? payload.nome.trim() : ''
    const codigo = typeof payload.codigo === 'string' ? payload.codigo.trim() : null
    const descricao = typeof payload.descricao === 'string' ? payload.descricao.trim() : null
    const ativo = typeof payload.ativo === 'boolean' ? payload.ativo : true
    if (!nome) return Response.json({ ok: false, error: 'nome é obrigatório' }, { status: 400 })

    // Checa duplicidade básica por nome
    const dup = await runQuery<{ id: number }>(`SELECT id FROM empresa.centros_custo WHERE LOWER(nome) = LOWER($1) LIMIT 1`, [nome])
    if (dup.length) return Response.json({ ok: false, error: 'Centro de custo já existe' }, { status: 409 })

    const ins = await runQuery<{ id: number; nome: string; codigo: string | null; descricao: string | null; ativo: boolean }>(
      `INSERT INTO empresa.centros_custo (codigo, nome, descricao, ativo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, codigo, descricao, ativo`,
      [codigo, nome, descricao, ativo]
    )
    const row = ins[0]
    return Response.json({ ok: true, data: row, message: 'Centro de custo criado com sucesso' })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

