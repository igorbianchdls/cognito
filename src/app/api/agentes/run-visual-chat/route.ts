import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint desativado. Use /chat com as tools crud, drive e email.',
    },
    { status: 410 }
  )
}
