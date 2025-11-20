import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 300

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const SYSTEM_PROMPT = `Você é o Analista de Vendas (Simples).
- Responda de forma objetiva e curta.
- Não utilize ferramentas externas.
- Quando precisar, peça ano/mês ou vendedor para contextualizar.
- Foque em explicar tendências, comparar períodos e sugerir próximos passos práticos.`

  const isOverloaded = (err: unknown) => {
    const anyErr = err as { type?: string; message?: string } | undefined
    const t = (anyErr?.type || '').toString().toLowerCase()
    const m = (anyErr?.message || '').toString().toLowerCase()
    return t.includes('overload') || m.includes('overload') || m.includes('rate limit') || m.includes('503') || m.includes('529') || m.includes('timeout')
  }
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  for (let attempt = 1; attempt <= 3; attempt++) {
    const useFallbackModel = attempt === 3
    const modelName = useFallbackModel ? 'claude-3-5-sonnet-20241022' : 'claude-sonnet-4-20250514'
    const thinkingBudget = attempt === 1 ? 8000 : attempt === 2 ? 3000 : undefined
    try {
      const result = streamText({
        model: anthropic(modelName),
        providerOptions: thinkingBudget ? { anthropic: { thinking: { type: 'enabled', budgetTokens: thinkingBudget } } } : {},
        system: SYSTEM_PROMPT,
        messages: convertToModelMessages(messages),
      })
      return result.toUIMessageStreamResponse()
    } catch (err) {
      if (isOverloaded(err) && attempt < 3) {
        await sleep(1000 * attempt)
        continue
      }
      return new Response(JSON.stringify({ success: false, message: 'Falha no agente Analista de Vendas (Simples)', error: err instanceof Error ? err.message : String(err) }), { status: isOverloaded(err) ? 503 : 500 })
    }
  }
}
