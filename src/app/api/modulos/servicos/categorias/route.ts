import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CategoriaPayload = {
  nome: string
  descricao?: string | null
  categoria_pai_id?: number | string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CategoriaPayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const descricao = body.descricao ? String(body.descricao).trim() : null
    const paiId = body.categoria_pai_id !== undefined && body.categoria_pai_id !== null ? Number(body.categoria_pai_id) : null

    const sql = `
      INSERT INTO servicos.categorias_servicos (nome, descricao, categoria_pai_id)
      VALUES ($1,$2,$3)
      RETURNING id`
    const params = [nome, descricao, paiId]
    const [row] = await runQuery<{ id: number }>(sql, params)
    if (!row?.id) throw new Error('Falha ao criar categoria de serviço')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/categorias POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

