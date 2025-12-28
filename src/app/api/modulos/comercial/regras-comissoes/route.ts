import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = {
  nome: string
  descricao?: string | null
  percentual_default?: number | string | null
  percentual_min?: number | string | null
  percentual_max?: number | string | null
  ativo?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })
    const descricao = body.descricao ? String(body.descricao).trim() : null
    const pdef = body.percentual_default !== undefined && body.percentual_default !== null ? Number(body.percentual_default) : null
    const pmin = body.percentual_min !== undefined && body.percentual_min !== null ? Number(body.percentual_min) : null
    const pmax = body.percentual_max !== undefined && body.percentual_max !== null ? Number(body.percentual_max) : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)
    const sql = `INSERT INTO comercial.regras_comissoes (nome, descricao, percentual_default, percentual_min, percentual_max, ativo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`
    const [row] = await runQuery<{ id: number }>(sql, [nome, descricao, pdef, pmin, pmax, ativo])
    if (!row?.id) throw new Error('Falha ao criar regra de comissão')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

