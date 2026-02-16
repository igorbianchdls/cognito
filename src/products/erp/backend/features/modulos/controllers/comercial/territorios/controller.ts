import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = { nome: string; descricao?: string | null; territorio_pai_id?: number | string | null; ativo?: boolean }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })
    const descricao = body.descricao ? String(body.descricao).trim() : null
    const paiId = body.territorio_pai_id !== undefined && body.territorio_pai_id !== null ? Number(body.territorio_pai_id) : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)
    const sql = `INSERT INTO comercial.territorios (nome, descricao, territorio_pai_id, ativo) VALUES ($1,$2,$3,$4) RETURNING id`
    const [row] = await runQuery<{ id: number }>(sql, [nome, descricao, paiId, ativo])
    if (!row?.id) throw new Error('Falha ao criar território')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

