import { withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idStr = parts[parts.length - 1]
    const id = Number(idStr)
    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    await withTransaction(async (client) => {
      await client.query(`DELETE FROM financeiro.pagamentos_efetuados_linhas WHERE pagamento_id = $1`, [id])
      await client.query(`DELETE FROM financeiro.pagamentos_efetuados WHERE id = $1`, [id])
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/modulos/financeiro/pagamentos-efetuados/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

