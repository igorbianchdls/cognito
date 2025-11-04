import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contaId = searchParams.get('conta_id')
    const hasFilter = !!contaId
    const base = `FROM crm.contatos ct ${hasFilter ? 'WHERE ct.contaid = $1' : ''}`
    const rows = await runQuery<{ id: number; nome: string; contaid: number }>(
      `SELECT ct.contatoid AS id, (ct.primeironome || ' ' || ct.sobrenome) AS nome, ct.contaid ${base} ORDER BY nome ASC`,
      hasFilter ? [Number(contaId)] : []
    )
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/contatos/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

