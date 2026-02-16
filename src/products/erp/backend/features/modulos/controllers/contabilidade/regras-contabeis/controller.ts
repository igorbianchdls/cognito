import { withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = {
  origem: string
  subtipo?: string | null
  plano_conta_id: number | string
  conta_credito_id: number | string
  // conta_debito_id é redundante: se enviado, será aceito como override; senão, usamos plano_conta_id
  conta_debito_id?: number | string | null
  descricao?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const origem = String(body.origem || '').trim().toLowerCase()
    const subtipo = body.subtipo !== undefined && body.subtipo !== null ? String(body.subtipo).trim() : null
    const plano_conta_id = Number(body.plano_conta_id)
    const conta_credito_id = Number(body.conta_credito_id)
    const conta_debito_id = body.conta_debito_id === null || body.conta_debito_id === undefined
      ? plano_conta_id
      : Number(body.conta_debito_id)
    const descricao = body.descricao !== undefined && body.descricao !== null ? String(body.descricao).trim() : null

    if (!origem) return Response.json({ success: false, message: 'origem é obrigatório' }, { status: 400 })
    if (!Number.isFinite(plano_conta_id) || plano_conta_id <= 0) return Response.json({ success: false, message: 'plano_conta_id inválido' }, { status: 400 })
    if (!Number.isFinite(conta_credito_id) || conta_credito_id <= 0) return Response.json({ success: false, message: 'conta_credito_id inválido' }, { status: 400 })
    if (!Number.isFinite(conta_debito_id) || conta_debito_id <= 0) return Response.json({ success: false, message: 'conta_debito_id inválido (use plano_conta_id ou informe override)' }, { status: 400 })

    const { id } = await withTransaction(async (client) => {
      // valida contas (opcional mas útil)
      const chk = await client.query(
        `SELECT 
           SUM(CASE WHEN id = $1 AND aceita_lancamento THEN 1 ELSE 0 END) as d_ok,
           SUM(CASE WHEN id = $2 AND aceita_lancamento THEN 1 ELSE 0 END) as c_ok
         FROM contabilidade.plano_contas WHERE id IN ($1,$2)`,
        [conta_debito_id, conta_credito_id]
      )
      const d_ok = Number(chk.rows[0]?.d_ok || 0) > 0
      const c_ok = Number(chk.rows[0]?.c_ok || 0) > 0
      if (!d_ok || !c_ok) throw new Error('Contas contábeis inválidas ou não lançáveis')

      const ins = await client.query(
        `INSERT INTO contabilidade.regras_contabeis
           (tenant_id, origem, subtipo, plano_conta_id, conta_debito_id, conta_credito_id, descricao)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [origem, subtipo, plano_conta_id, conta_debito_id, conta_credito_id, descricao]
      )
      return { id: Number(ins.rows[0]?.id) }
    })

    return Response.json({ success: true, id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
