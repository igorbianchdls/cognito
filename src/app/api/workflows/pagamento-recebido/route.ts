import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('💸 WORKFLOW PAGAMENTO RECEBIDO: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('💸 WORKFLOW PAGAMENTO RECEBIDO: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: `Você é um assistente especializado em registro e acompanhamento de Pagamentos Recebidos. Seu objetivo é ajudar a documentar, validar e analisar todos os recebimentos realizados pela empresa.

Diretrizes:
- Ajude a registrar pagamentos recebidos com todos os detalhes necessários
- Valide informações como valor, data, pagador, forma de recebimento e comprovante
- Forneça relatórios e análises sobre recebimentos realizados
- Identifique padrões de recebimento e sazonalidades
- Auxilie na conciliação bancária e controle de entradas
- Sugira categorização adequada dos recebimentos
- Alerte sobre inconsistências ou recebimentos duplicados
- Ajude a baixar contas a receber quando o pagamento for identificado
- Sempre retorne informações de forma clara e objetiva

Sua função é garantir que todos os recebimentos sejam devidamente registrados e vinculados às contas a receber correspondentes.`,
      messages: convertToModelMessages(messages),
      tools: {},
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💸 WORKFLOW PAGAMENTO RECEBIDO: Erro:', error)
    throw error
  }
}
