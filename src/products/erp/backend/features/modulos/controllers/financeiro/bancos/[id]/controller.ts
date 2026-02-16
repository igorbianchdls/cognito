import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })

    const sql = `
      SELECT id, nome_banco, imagem_url, numero_banco, agencia, endereco, criado_em, atualizado_em
      FROM financeiro.bancos
      WHERE id = $1
      LIMIT 1
    `
    const rows = await runQuery<Record<string, unknown>>(sql, [id])
    const banco = rows[0] || null

    if (!banco) {
      return Response.json({ success: false, message: 'Banco não encontrado' }, { status: 404 })
    }

    return Response.json({ success: true, data: banco })
  } catch (error) {
    console.error('GET /api/modulos/financeiro/bancos/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

const BANCO_WHITELIST = new Set([
  'nome_banco',
  'imagem_url',
  'numero_banco',
  'agencia',
  'endereco',
])

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })

    const body = await req.json() as Record<string, unknown>
    const entries = Object.entries(body).filter(([k, v]) => BANCO_WHITELIST.has(k) && v !== undefined)

    if (entries.length === 0) {
      return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const imagemUrl = body['imagem_url'] as string | undefined
    if (imagemUrl && !(imagemUrl.startsWith('http://') || imagemUrl.startsWith('https://'))) {
      return Response.json({ success: false, message: 'imagem_url deve ser um link http/https' }, { status: 400 })
    }

    let idx = 1
    const sets: string[] = []
    const paramsArr: unknown[] = []
    for (const [key, value] of entries) {
      const column = key
      sets.push(`${column} = $${idx}`)
      paramsArr.push(value)
      idx += 1
    }
    paramsArr.push(id)

    const sql = `UPDATE financeiro.bancos SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`
    await runQuery(sql, paramsArr)

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/modulos/financeiro/bancos/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

