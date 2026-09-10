import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return erpFailure('Esta rota foi descontinuada. Use /atender para a operacao de estoque; a emissao fiscal possui fluxo proprio.', 410)
}
