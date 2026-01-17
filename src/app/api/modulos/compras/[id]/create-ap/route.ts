import { NextRequest } from 'next/server'
import { createApFromCompra } from '@/inngest/compras'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest, context: { params: { id?: string } }) {
  try {
    const idParam = context.params?.id
    const compraId = Number(idParam)
    if (!Number.isFinite(compraId)) {
      return Response.json({ success: false, message: 'id inválido' }, { status: 400 })
    }
    const result = await createApFromCompra(compraId)
    return Response.json({ success: true, ap_id: result.apId })
  } catch (error) {
    console.error('🧾 API /api/modulos/compras/[id]/create-ap error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

