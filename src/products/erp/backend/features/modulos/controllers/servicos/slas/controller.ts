import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type SlaPayload = {
  servico_id: number | string
  tempo_estimado?: string | null
  descricao?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SlaPayload>
    const servicoId = body.servico_id !== undefined && body.servico_id !== null ? Number(body.servico_id) : NaN
    if (!Number.isFinite(servicoId)) return Response.json({ success: false, message: 'servico_id é obrigatório' }, { status: 400 })

    const tempo = body.tempo_estimado ? String(body.tempo_estimado).trim() : null
    const descricao = body.descricao ? String(body.descricao).trim() : null

    const sql = `
      INSERT INTO servicos.slas (servico_id, tempo_estimado, descricao)
      VALUES ($1,$2,$3)
      RETURNING id`
    const params = [servicoId, tempo, descricao]
    const [row] = await runQuery<{ id: number }>(sql, params)
    if (!row?.id) throw new Error('Falha ao criar SLA')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/slas POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

