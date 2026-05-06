import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint desativado. Use /chat com as tools disponiveis.',
    },
    { status: 410 }
  )
}
