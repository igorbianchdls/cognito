import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API is working',
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1'
  })
}