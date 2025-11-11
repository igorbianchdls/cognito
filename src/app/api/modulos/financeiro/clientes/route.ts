import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ClientePayload = {
  nome: string
  cpf_cnpj?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  observacoes?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ClientePayload> & { cnpj_cpf?: string | null }
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    // Inserção mínima usando colunas existentes: nome_fantasia e cnpj_cpf (quando enviado)
    const insertSql = `
      INSERT INTO entidades.clientes (nome_fantasia, cnpj_cpf)
      VALUES ($1, $2)
      RETURNING id::text AS id,
                COALESCE(nome_fantasia, '')::text AS nome,
                COALESCE(cnpj_cpf, '')::text AS cpf_cnpj
    `.replace(/\n\s+/g, ' ').trim()

    const cnpjCpfRaw = typeof body.cnpj_cpf === 'string' && body.cnpj_cpf
      ? body.cnpj_cpf.trim()
      : (body.cpf_cnpj ? String(body.cpf_cnpj).trim() : '')
    const params = [ nome, cnpjCpfRaw || null ]

    const [row] = await runQuery<{ id: string; nome: string; cpf_cnpj: string }>(insertSql, params)
    if (!row) throw new Error('Falha ao criar cliente')

    return Response.json({ success: true, data: row, message: `Cliente criado: ${row.nome}` })
  } catch (error) {
    console.error('💰 API /api/modulos/financeiro/clientes POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
