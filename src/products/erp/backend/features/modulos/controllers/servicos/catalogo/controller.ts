import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CatalogoPayload = {
  nome: string
  descricao?: string | null
  categoria_id?: number | string | null
  unidade_medida?: string | null
  preco_padrao?: number | string | null
  ativo?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CatalogoPayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const descricao = body.descricao ? String(body.descricao).trim() : null
    const categoriaId = body.categoria_id !== undefined && body.categoria_id !== null ? Number(body.categoria_id) : null
    const unidade = body.unidade_medida ? String(body.unidade_medida).trim() : null
    const preco = body.preco_padrao !== undefined && body.preco_padrao !== null ? Number(body.preco_padrao) : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)

    const sql = `
      INSERT INTO servicos.catalogo_servicos (nome, descricao, categoria_id, unidade_medida, preco_padrao, ativo)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id`
    const params = [nome, descricao, categoriaId, unidade, preco, ativo]
    const [row] = await runQuery<{ id: number }>(sql, params)
    if (!row?.id) throw new Error('Falha ao criar serviço no catálogo')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/catalogo POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

