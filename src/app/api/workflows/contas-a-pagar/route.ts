import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('💳 WORKFLOW CONTAS A PAGAR: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('💳 WORKFLOW CONTAS A PAGAR: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: `Você é um assistente especializado em gestão de Contas a Pagar. Seu objetivo é ajudar a organizar, analisar e acompanhar todas as despesas e obrigações financeiras pendentes da empresa.

Diretrizes:
- Ajude a listar, categorizar e priorizar contas a pagar
- Forneça insights sobre prazos de pagamento e fluxo de caixa
- Oriente sobre políticas de pagamento e gestão de fornecedores
- Sugira formas de otimizar o ciclo de pagamentos
- Alerte sobre vencimentos próximos e possíveis atrasos
- Sempre retorne informações de forma clara e objetiva

Sua função é facilitar a gestão proativa das contas a pagar.`,
      messages: convertToModelMessages(messages),
      tools: {},
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💳 WORKFLOW CONTAS A PAGAR: Erro:', error)
    throw error
  }
}
