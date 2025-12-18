import { runQuery, withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idStr = parts[parts.length - 1] || ''
    const id = Number(idStr)
    if (!Number.isFinite(id)) return Response.json({ success: false, message: 'ID inválido' }, { status: 400 })
    const sql = `SELECT id, codigo, nome, descricao, tipo, natureza, categoria_pai_id, plano_conta_id, criado_em, atualizado_em
                   FROM financeiro.categorias_despesa
                  WHERE id = $1
                  LIMIT 1`
    const rows = await runQuery<Record<string, unknown>>(sql, [id])
    if (!rows.length) return Response.json({ success: false, message: 'Categoria não encontrada' }, { status: 404 })
    return Response.json({ success: true, row: rows[0] })
  } catch (error) {
    console.error('GET /api/modulos/financeiro/categorias-despesa/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idStr = parts[parts.length - 1] || ''
    const id = Number(idStr)
    if (!Number.isFinite(id)) return Response.json({ success: false, message: 'ID inválido' }, { status: 400 })
    const body = (await req.json()) as Partial<{
      plano_conta_id?: number | null
      codigo?: string | null
      nome?: string | null
      descricao?: string | null
      tipo?: string | null
      natureza?: string | null
    }>
    const planoId = body.plano_conta_id === null ? null : (body.plano_conta_id !== undefined ? Number(body.plano_conta_id) : undefined)
    // pelo menos um campo deve ser enviado
    if (
      planoId === undefined &&
      body.codigo === undefined &&
      body.nome === undefined &&
      body.descricao === undefined &&
      body.tipo === undefined &&
      body.natureza === undefined
    ) {
      return Response.json({ success: false, message: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const out = await withTransaction(async (client) => {
      if (planoId !== undefined && planoId !== null) {
        // valida plano: existe, aceita_lancamento e tipo contábil permitido (Custo/Despesa)
        const chk = await client.query(
          `SELECT id FROM contabilidade.plano_contas WHERE id = $1 AND aceita_lancamento = TRUE AND tipo_conta IN ('Custo','Despesa') LIMIT 1`,
          [planoId]
        )
        if (!chk.rows.length) throw new Error('Plano de contas inválido para mapeamento (não lançável ou tipo não permitido)')
      }
      // build dynamic update
      const sets: string[] = []
      const params: unknown[] = []
      let i = 1
      if (planoId !== undefined) { sets.push(`plano_conta_id = $${i++}`); params.push(planoId) }
      if (body.codigo !== undefined) { sets.push(`codigo = $${i++}`); params.push(body.codigo) }
      if (body.nome !== undefined) { sets.push(`nome = $${i++}`); params.push(body.nome) }
      if (body.descricao !== undefined) { sets.push(`descricao = $${i++}`); params.push(body.descricao) }
      if (body.tipo !== undefined) { sets.push(`tipo = $${i++}`); params.push(body.tipo) }
      if (body.natureza !== undefined) { sets.push(`natureza = $${i++}`); params.push(body.natureza) }
      sets.push(`atualizado_em = NOW()`)
      const sql = `UPDATE financeiro.categorias_despesa SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`
      params.push(id)
      await client.query(sql, params)
      const res = await client.query(`SELECT id, codigo, nome, descricao, tipo, natureza, categoria_pai_id, plano_conta_id, criado_em, atualizado_em FROM financeiro.categorias_despesa WHERE id = $1`, [id])
      return res.rows[0]
    })

    return Response.json({ success: true, row: out })
  } catch (error) {
    console.error('PATCH /api/modulos/financeiro/categorias-despesa/[id] error:', error)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
