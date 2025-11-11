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
    const body = (await req.json()) as Partial<ClientePayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const cpfCnpjRaw = body.cpf_cnpj ? String(body.cpf_cnpj).trim() : ''
    const docDigits = cpfCnpjRaw.replace(/\D/g, '')

    if (docDigits) {
      const dupSql = `SELECT 1 FROM entidades.clientes WHERE REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '/', ''), '-', '') = $1 LIMIT 1`
      const dup = await runQuery<{ exists: number }>(dupSql, [docDigits])
      if (dup && dup.length > 0) {
        return Response.json({ success: false, message: 'Cliente já cadastrado para este CPF/CNPJ' }, { status: 409 })
      }
    }

    // Inserção mínima; usa nome_fantasia como nome exibido
    const insertSql = `
      INSERT INTO entidades.clientes (nome_fantasia, cpf_cnpj, email, telefone)
      VALUES ($1, $2, $3, $4)
      RETURNING id::text AS id,
                COALESCE(nome_fantasia, '')::text AS nome,
                COALESCE(cpf_cnpj, '')::text AS cpf_cnpj,
                COALESCE(email, '')::text AS email,
                COALESCE(telefone, '')::text AS telefone
    `.replace(/\n\s+/g, ' ').trim()

    const params = [
      nome,
      cpfCnpjRaw || null,
      body.email ? String(body.email) : null,
      body.telefone ? String(body.telefone) : null,
    ]

    const [row] = await runQuery<{ id: string; nome: string; cpf_cnpj: string; email: string | null; telefone: string | null }>(insertSql, params)
    if (!row) throw new Error('Falha ao criar cliente')

    return Response.json({ success: true, data: row, message: `Cliente criado: ${row.nome}` })
  } catch (error) {
    console.error('💰 API /api/modulos/financeiro/clientes POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

