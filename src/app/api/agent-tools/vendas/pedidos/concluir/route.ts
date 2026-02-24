import { NextRequest } from 'next/server'
import { handlePedidoAction } from '@/app/api/agent-tools/_shared/pedidosActions'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handlePedidoAction(req, 'venda', 'concluir')
}
