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
      SELECT f.funcionarioid AS id,
             f.nomecompleto   AS nome_completo,
             f.emailcorporativo AS email_corporativo,
             f.telefonecorporativo AS telefone,
             f.status,
             f.datanascimento AS data_nascimento,
             f.cargoid,
             f.departamentoid,
             f.gestordiretoid
      FROM recursoshumanos.funcionarios f
      WHERE f.funcionarioid = $1
      LIMIT 1
    `
    const rows = await runQuery<Record<string, unknown>>(sql, [id])
    const funcionario = rows[0] || null
    if (!funcionario) return Response.json({ success: false, message: 'Funcionário não encontrado' }, { status: 404 })
    return Response.json({ success: true, data: funcionario })
  } catch (error) {
    console.error('GET /api/modulos/rh/funcionarios/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

const FUNC_WHITELIST = new Set([
  'nomecompleto',
  'emailcorporativo',
  'telefonecorporativo',
  'status',
  'datanascimento',
  'cargoid',
  'departamentoid',
  'gestordiretoid',
])

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })

    const body = await req.json() as Record<string, unknown>
    const entries = Object.entries(body).filter(([k, v]) => FUNC_WHITELIST.has(k) && v !== undefined)
    if (entries.length === 0) return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })

    // Validações leves
    const email = body['emailcorporativo'] as string | undefined
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, message: 'emailcorporativo inválido' }, { status: 400 })
    }

    let i = 1
    const sets: string[] = []
    const paramsArr: unknown[] = []
    for (const [key, value] of entries) {
      sets.push(`${key} = $${i}`)
      paramsArr.push(value)
      i += 1
    }
    paramsArr.push(id)

    const sql = `UPDATE recursoshumanos.funcionarios SET ${sets.join(', ')} WHERE funcionarioid = $${i} RETURNING funcionarioid`
    await runQuery(sql, paramsArr)
    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/modulos/rh/funcionarios/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

