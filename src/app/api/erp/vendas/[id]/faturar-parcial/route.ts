import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return erpFailure('Esta rota foi descontinuada. Use /atender-parcial para a operacao de estoque.', 410)
}
