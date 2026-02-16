import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome_fantasia = String(form.get('nome_fantasia') || '').trim()
    if (!nome_fantasia) return Response.json({ success: false, message: 'nome_fantasia é obrigatório' }, { status: 400 })

    const razao_social = String(form.get('razao_social') || '').trim() || null
    const cnpj = String(form.get('cnpj') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const cidade = String(form.get('cidade') || '').trim() || null
    const estado = String(form.get('estado') || '').trim() || null
    const pais = String(form.get('pais') || '').trim() || null
    const categoria = String(form.get('categoria') || '').trim() || null
    const imagem_url = String(form.get('imagem_url') || '').trim() || null
    const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO compras.fornecedores (
           nome_fantasia, razao_social, cnpj, telefone, email, cidade, estado, pais, categoria, imagem_url, ativo
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [nome_fantasia, razao_social, cnpj, telefone, email, cidade, estado, pais, categoria, imagem_url, ativo]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar fornecedor')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/fornecedores POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

