import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = {
  codigo: string
  nome: string
  conta_pai_id?: number | string | null
  aceita_lancamento?: boolean
  tipo_conta?: string | null // 'Ativo' | 'Passivo' | 'Patrimônio Líquido' | 'Receita' | 'Despesa' | 'Custo' | etc.
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const codigo = String(body.codigo || '').trim()
    const nome = String(body.nome || '').trim()
    if (!codigo) return Response.json({ success: false, message: 'codigo é obrigatório' }, { status: 400 })
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const contaPaiId = body.conta_pai_id !== undefined && body.conta_pai_id !== null ? Number(body.conta_pai_id) : null
    const aceita = body.aceita_lancamento === undefined ? false : Boolean(body.aceita_lancamento)
    const tipo = body.tipo_conta ? String(body.tipo_conta).trim() : null

    const sql = `
      INSERT INTO contabilidade.plano_contas (codigo, nome, conta_pai_id, aceita_lancamento, tipo_conta)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id`
    const params = [codigo, nome, contaPaiId, aceita, tipo]
    const [row] = await runQuery<{ id: number }>(sql, params)
    if (!row?.id) throw new Error('Falha ao criar plano de contas')
    return Response.json({ success: true, id: row.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

