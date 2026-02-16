import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type TabelaPrecoPayload = {
  nome: string
  descricao?: string | null
  ativo?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TabelaPrecoPayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const descricao = body.descricao ? String(body.descricao).trim() : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)

    const sql = `
      INSERT INTO servicos.tabelas_preco (nome, descricao, ativo)
      VALUES ($1,$2,$3)
      RETURNING id`
    const params = [nome, descricao, ativo]
    const [row] = await runQuery<{ id: number }>(sql, params)
    if (!row?.id) throw new Error('Falha ao criar tabela de preço')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/tabelas-preco POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

