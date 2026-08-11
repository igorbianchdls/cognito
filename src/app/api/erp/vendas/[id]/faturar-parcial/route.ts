import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    { error: 'Esta rota foi descontinuada. Use /atender-parcial para a operacao de estoque.' },
    { status: 410 },
  )
}
