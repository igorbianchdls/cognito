import { withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Item = { produto_id: number | string; incentivo_percentual?: number | string | null; incentivo_valor?: number | string | null; meta_quantidade?: number | string | null }
type PostBody = {
  nome: string
  tipo?: string | null
  descricao?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  ativo?: boolean
  itens?: Item[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })
    const tipo = body.tipo ? String(body.tipo).trim() : null
    const descricao = body.descricao ? String(body.descricao).trim() : null
    const ini = body.data_inicio ? String(body.data_inicio).trim() : null
    const fim = body.data_fim ? String(body.data_fim).trim() : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)
    const itens = Array.isArray(body.itens) ? body.itens as Item[] : []

    const result = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO comercial.campanhas_vendas (nome, tipo, descricao, data_inicio, data_fim, ativo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [nome, tipo, descricao, ini, fim, ativo]
      )
      const id = Number(ins.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar campanha')

      for (const it of itens) {
        const pid = Number(it.produto_id)
        const pperc = it.incentivo_percentual !== undefined && it.incentivo_percentual !== null ? Number(it.incentivo_percentual) : null
        const pval = it.incentivo_valor !== undefined && it.incentivo_valor !== null ? Number(it.incentivo_valor) : null
        const mqt = it.meta_quantidade !== undefined && it.meta_quantidade !== null ? Number(it.meta_quantidade) : null
        if (!Number.isFinite(pid)) continue
        await client.query(
          `INSERT INTO comercial.campanhas_vendas_itens (campanha_id, produto_id, incentivo_percentual, incentivo_valor, meta_quantidade) VALUES ($1,$2,$3,$4,$5)`,
          [id, pid, pperc, pval, mqt]
        )
      }
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

