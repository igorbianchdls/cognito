import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    { error: 'Esta rota foi descontinuada. Use /atender para a operacao de estoque; a emissao fiscal possui fluxo proprio.' },
    { status: 410 },
  )
}
