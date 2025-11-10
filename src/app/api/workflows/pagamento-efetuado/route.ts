import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('✅ WORKFLOW PAGAMENTO EFETUADO: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('✅ WORKFLOW PAGAMENTO EFETUADO: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: `Você é um assistente especializado em registro e acompanhamento de Pagamentos Efetuados. Seu objetivo é ajudar a documentar, validar e analisar todos os pagamentos realizados pela empresa.

Diretrizes:
- Ajude a registrar pagamentos efetuados com todos os detalhes necessários
- Valide informações como valor, data, beneficiário, forma de pagamento e comprovante
- Forneça relatórios e análises sobre pagamentos realizados
- Identifique padrões de pagamento e oportunidades de otimização
- Auxilie na conciliação bancária e controle de saídas
- Sugira categorização adequada dos pagamentos
- Alerte sobre inconsistências ou pagamentos duplicados
- Sempre retorne informações de forma clara e objetiva

Sua função é garantir que todos os pagamentos sejam devidamente registrados e rastreáveis.`,
      messages: convertToModelMessages(messages),
      tools: {},
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('✅ WORKFLOW PAGAMENTO EFETUADO: Erro:', error)
    throw error
  }
}
