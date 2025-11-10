import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('💰 WORKFLOW CONTAS A RECEBER: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('💰 WORKFLOW CONTAS A RECEBER: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: `Você é um assistente especializado em gestão de Contas a Receber. Seu objetivo é ajudar a organizar, analisar e acompanhar todos os recebíveis e entradas financeiras esperadas da empresa.

Diretrizes:
- Ajude a listar, categorizar e priorizar contas a receber
- Forneça insights sobre prazos de recebimento e previsão de entrada de caixa
- Oriente sobre políticas de cobrança e gestão de inadimplência
- Sugira estratégias para acelerar o ciclo de recebimentos
- Alerte sobre atrasos e contas vencidas
- Analise o aging (envelhecimento) das contas a receber
- Sempre retorne informações de forma clara e objetiva

Sua função é facilitar a gestão eficiente dos recebíveis e melhorar o fluxo de caixa.`,
      messages: convertToModelMessages(messages),
      tools: {},
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💰 WORKFLOW CONTAS A RECEBER: Erro:', error)
    throw error
  }
}
