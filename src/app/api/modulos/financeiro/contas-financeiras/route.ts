import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome_conta = String(form.get('nome_conta') || '').trim()
    const tipo_conta = String(form.get('tipo_conta') || '').trim()
    if (!nome_conta) return Response.json({ success: false, message: 'nome_conta é obrigatório' }, { status: 400 })
    if (!tipo_conta) return Response.json({ success: false, message: 'tipo_conta é obrigatório' }, { status: 400 })

    const banco_id_raw = String(form.get('banco_id') || '').trim()
    const agencia = String(form.get('agencia') || '').trim() || null
    const numero_conta = String(form.get('numero_conta') || '').trim() || null
    const pix_chave = String(form.get('pix_chave') || '').trim() || null
    const saldo_inicial_raw = String(form.get('saldo_inicial') || '').trim()
    const data_abertura = String(form.get('data_abertura') || '').trim() || null
    const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'

    const banco_id = banco_id_raw ? Number(banco_id_raw) : null
    const saldo_inicial = saldo_inicial_raw ? Number(saldo_inicial_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.contas_financeiras (
           banco_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, saldo_atual, data_abertura, ativo
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9) RETURNING id`,
        [banco_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, data_abertura, ativo]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar conta financeira')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/contas-financeiras POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

