import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, any>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const id = Number(payload.id)
    if (!Number.isFinite(id)) return Response.json({ ok: false, error: 'id inválido' }, { status: 400 })

    const fields: Array<{ col: string; val: any }> = []
    const pushIf = (key: string, col: string) => { if (payload[key] !== undefined) fields.push({ col, val: payload[key] }) }
    pushIf('nome', 'nome_fantasia')
    pushIf('nome_fantasia', 'nome_fantasia')
    pushIf('cnpj', 'cnpj')
    pushIf('email', 'email')
    pushIf('telefone', 'telefone')

    if (fields.length === 0) return Response.json({ ok: false, error: 'Nenhum campo válido para atualizar' }, { status: 400 })

    const sets: string[] = []
    const params: any[] = []
    let i = 1
    for (const f of fields) { sets.push(`${f.col} = $${i++}`); params.push(f.val) }
    params.push(id)
    const sql = `UPDATE entidades.fornecedores SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`
    const rows = await runQuery<{ id: number }>(sql, params)
    if (!rows.length) return Response.json({ ok: false, error: 'Não encontrado' }, { status: 404 })
    return Response.json({ ok: true, result: { success: true, message: 'Fornecedor atualizado', data: { id } } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

