import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = { nome: string; descricao?: string | null; tipo_valor?: 'valor' | 'percentual' | 'quantidade'; medida_sql?: string | null; ativo?: boolean }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })
    const descricao = body.descricao ? String(body.descricao).trim() : null
    const tipo_valor = body.tipo_valor && ['valor','percentual','quantidade'].includes(String(body.tipo_valor)) ? String(body.tipo_valor) : 'valor'
    const medida_sql = body.medida_sql ? String(body.medida_sql) : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)
    const sql = `INSERT INTO comercial.tipos_metas (nome, descricao, tipo_valor, medida_sql, ativo) VALUES ($1,$2,$3,$4,$5) RETURNING id`
    const [row] = await runQuery<{ id: number }>(sql, [nome, descricao, tipo_valor, medida_sql, ativo])
    if (!row?.id) throw new Error('Falha ao criar tipo de meta')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

