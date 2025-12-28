import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = { nome: string; email?: string | null; telefone?: string | null; territorio_id?: number | string | null; comissao_padrao?: number | string | null; ativo?: boolean }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })
    const email = body.email ? String(body.email).trim() : null
    const telefone = body.telefone ? String(body.telefone).trim() : null
    const terrId = body.territorio_id !== undefined && body.territorio_id !== null ? Number(body.territorio_id) : null
    const comissao = body.comissao_padrao !== undefined && body.comissao_padrao !== null ? Number(body.comissao_padrao) : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)
    const sql = `INSERT INTO comercial.vendedores (nome, email, telefone, territorio_id, comissao_padrao, ativo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`
    const [row] = await runQuery<{ id: number }>(sql, [nome, email, telefone, terrId, comissao, ativo])
    if (!row?.id) throw new Error('Falha ao criar vendedor')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

