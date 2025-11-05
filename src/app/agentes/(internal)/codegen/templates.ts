import type { Graph } from '@/types/agentes/builder'
import { collectTools, getFirstAgent, getResponseTemplate, stringifyGraph, tsStringLiteral } from './helpers'

export function genAgentTs(graph: Graph, slug: string): string {
  const tools = collectTools(graph)
  const agent = getFirstAgent(graph) || {}
  const template = getResponseTemplate(graph)
  const graphJson = stringifyGraph(graph)
  const sys = tsStringLiteral(agent.systemPrompt || '')
  const model = tsStringLiteral(agent.model || 'anthropic/claude-3-5-sonnet')

  return `// Arquivo gerado automaticamente pelo Agent Builder (não editar manualmente)
// slug: ${slug}
// TODO: conectar com o runner real e registry de ferramentas
"use server";

type ExecOptions = {
  debug?: boolean
}

// Definição do fluxo (Graph) inline
const definition = ${graphJson} as const

// Configuração do agente
const agent = {
  model: "${model}",
  systemPrompt: "${sys}"
}

// Ferramentas usadas neste agente (stubs por enquanto)
const tools = ${JSON.stringify(tools)} as const

// Stub do executor (substituir na próxima fase)
async function executeStub(graph: typeof definition, input: string, opts?: ExecOptions): Promise<{ reply: string }> {
  const prefix = agent.model ? \`Agente (\${agent.model})\` : 'Agente'
  const reply = \`\${prefix}: \${input}\`
  // Aplica template simples
  const out = ${JSON.stringify(template)}.replace('\\{\\{output\\}\\}', reply)
  return { reply: out }
}

export async function runAgent(input: string, options?: ExecOptions) {
  return executeStub(definition, input, options)
}
`
}

export function genRouteTs(slug: string): string {
  return `import { NextResponse } from 'next/server'
import { runAgent } from './agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { message?: string }
    const message = String(body?.message ?? '')
    const result = await runAgent(message)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
`
}

export function genDefinitionJson(graph: Graph): string {
  return stringifyGraph(graph)
}

