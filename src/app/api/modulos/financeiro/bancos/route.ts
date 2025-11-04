import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome_banco = String(form.get('nome_banco') || '').trim()
    if (!nome_banco) return Response.json({ success: false, message: 'nome_banco é obrigatório' }, { status: 400 })

    const numero_banco = String(form.get('numero_banco') || '').trim() || null
    const agencia = String(form.get('agencia') || '').trim() || null
    const endereco = String(form.get('endereco') || '').trim() || null
    const imagem_url = String(form.get('imagem_url') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.bancos (nome_banco, numero_banco, agencia, endereco, imagem_url)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [nome_banco, numero_banco, agencia, endereco, imagem_url]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar banco')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/bancos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

