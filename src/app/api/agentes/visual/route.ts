import { NextResponse } from 'next/server'
import type { Graph } from '@/types/agentes/builder'
import { mapGraphToConfig } from '@/lib/agents/mappers/config'
import { runVisualAgent } from '@/lib/agents/runtime/engine'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { graph: Graph; message?: string }
    if (!body || !body.graph) {
      return NextResponse.json({ error: 'Missing graph' }, { status: 400 })
    }
    const config = mapGraphToConfig(body.graph)
    const message = body.message || 'Olá'
    const result = await runVisualAgent(config, message)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
