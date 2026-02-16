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
      SELECT
        id,
        nome_fantasia AS nome_fornecedor,
        imagem_url,
        cnpj,
        email,
        telefone
      FROM entidades.fornecedores
      WHERE id = $1
      LIMIT 1
    `
    const rows = await runQuery<Record<string, unknown>>(sql, [id])
    const fornecedor = rows[0] || null

    if (!fornecedor) {
      return Response.json({ success: false, message: 'Fornecedor não encontrado' }, { status: 404 })
    }

    return Response.json({ success: true, data: fornecedor })
  } catch (error) {
    console.error('GET /api/modulos/financeiro/fornecedores/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

const FORNECEDOR_WHITELIST = new Set([
  'nome_fornecedor',
  'imagem_url',
  'cnpj',
  'email',
  'telefone',
])

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })

    const body = await req.json() as Record<string, unknown>
    const entries = Object.entries(body).filter(([k, v]) => FORNECEDOR_WHITELIST.has(k) && v !== undefined)

    if (entries.length === 0) {
      return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    // Validações simples
    const imagemUrl = body['imagem_url'] as string | undefined
    if (imagemUrl && !(imagemUrl.startsWith('http://') || imagemUrl.startsWith('https://'))) {
      return Response.json({ success: false, message: 'imagem_url deve ser um link http/https' }, { status: 400 })
    }

    let idx = 1
    const sets: string[] = []
    const paramsArr: unknown[] = []
    for (const [key, value] of entries) {
      // Map front-end keys to DB columns
      const column = key === 'nome_fornecedor' ? 'nome_fantasia' : key
      sets.push(`${column} = $${idx}`)
      paramsArr.push(value)
      idx += 1
    }
    if (sets.length === 0) {
      return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }
    paramsArr.push(id)

    const sql = `UPDATE entidades.fornecedores SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`
    await runQuery(sql, paramsArr)

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/modulos/financeiro/fornecedores/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
