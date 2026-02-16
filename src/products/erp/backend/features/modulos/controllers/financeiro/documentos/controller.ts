import { NextRequest } from 'next/server'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  // O schema `documentos` foi removido por decisao do produto (ERP-only).
  // Mantemos a rota para nao quebrar imports, mas ela esta desativada.
  return Response.json(
    { success: false, message: 'Módulo de Documentos foi removido (schema `documentos`).' },
    { status: 410 }
  )
}
