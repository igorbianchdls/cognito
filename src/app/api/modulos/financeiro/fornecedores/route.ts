import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type FornecedorPayload = {
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  estado?: string | null
  observacoes?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FornecedorPayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const cnpjRaw = body.cnpj ? String(body.cnpj).trim() : ''
    const cnpjDigits = cnpjRaw.replace(/\D/g, '')

    // Duplicidade por CNPJ se fornecido
    if (cnpjDigits) {
      const dupSql = `SELECT 1 FROM entidades.fornecedores WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1 LIMIT 1`
      const dup = await runQuery<{ exists: number }>(dupSql, [cnpjDigits])
      if (dup && dup.length > 0) {
        return Response.json({ success: false, message: 'Fornecedor já cadastrado para este CNPJ' }, { status: 409 })
      }
    }

    // Inserção básica (somente colunas garantidas)
    const insertSql = `
      INSERT INTO entidades.fornecedores (nome, cnpj, email, telefone)
      VALUES ($1, $2, $3, $4)
      RETURNING id::text AS id, COALESCE(nome, '')::text AS nome, COALESCE(cnpj, '')::text AS cnpj, COALESCE(email, '')::text AS email, COALESCE(telefone, '')::text AS telefone
    `.replace(/\n\s+/g, ' ').trim()

    const params = [
      nome,
      cnpjRaw || null,
      body.email ? String(body.email) : null,
      body.telefone ? String(body.telefone) : null,
    ]

    const [row] = await runQuery<{ id: string; nome: string; cnpj: string; email: string | null; telefone: string | null }>(insertSql, params)
    if (!row) throw new Error('Falha ao criar fornecedor')

    return Response.json({ success: true, data: row, message: `Fornecedor criado: ${row.nome}` })
  } catch (error) {
    console.error('💳 API /api/modulos/financeiro/fornecedores POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

