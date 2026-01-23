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

    const cnpjRaw = typeof payload.cnpj === 'string' ? payload.cnpj.trim() : ''
    const cnpjDigits = cnpjRaw.replace(/\D/g, '')
    if (cnpjDigits) {
      const dupSql = `SELECT 1 FROM entidades.fornecedores WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1 LIMIT 1`
      const dup = await runQuery<{ exists: number }>(dupSql, [cnpjDigits])
      if (dup && dup.length > 0) {
        return Response.json({ ok: false, error: 'Fornecedor já cadastrado para este CNPJ' }, { status: 409 })
      }
    }

    const insertSql = `
      INSERT INTO entidades.fornecedores (nome_fantasia, cnpj, email, telefone)
      VALUES ($1, $2, $3, $4)
      RETURNING id::text AS id, COALESCE(nome_fantasia, '')::text AS nome, COALESCE(cnpj, '')::text AS cnpj, COALESCE(email, '')::text AS email, COALESCE(telefone, '')::text AS telefone
    `.replace(/\n\s+/g, ' ').trim()

    const params = [
      nome,
      cnpjRaw || null,
      payload.email ? String(payload.email) : null,
      payload.telefone ? String(payload.telefone) : null,
    ]

    const [row] = await runQuery<{ id: string; nome: string; cnpj: string; email: string | null; telefone: string | null }>(insertSql, params)
    if (!row) return Response.json({ ok: false, error: 'Falha ao criar fornecedor' }, { status: 500 })

    return Response.json({ ok: true, result: { success: true, data: row, message: `Fornecedor criado: ${row.nome}`, title: 'Fornecedor Criado' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
