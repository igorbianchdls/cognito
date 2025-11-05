import { NextResponse } from 'next/server'
import type { Graph } from '@/types/agentes/builder'
import { execute } from '@/app/agentes/(internal)/runtime/runner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json() as { graph: Graph; message?: string; temperature?: number }
    if (!body?.graph) return NextResponse.json({ error: 'Missing graph' }, { status: 400 })
    const prompt = String(body?.message ?? '')
    const temperature = typeof body?.temperature === 'number' ? body.temperature : undefined
    const result = await execute(body.graph, prompt, { temperature })
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

