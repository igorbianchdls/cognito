import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import { getCrmOportunidades, getCrmAtividades } from '@/tools/crmTools'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('📇 CRM AGENT: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('📇 CRM AGENT: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: `Você é um assistente de CRM. Liste e analise dados de CRM (oportunidades e atividades) usando as ferramentas disponíveis. 

Diretrizes:
- Para pipeline e forecast de fechamento → use getCrmOportunidades com filtros (datas, estágio, probabilidade, valor, responsável, q)
- Para follow-ups e produtividade → use getCrmAtividades com filtros (datas, status, tipo, responsável, vínculo)
- Sempre retorne de forma objetiva. Peça refinamento de filtros se for amplo demais.
`,
      messages: convertToModelMessages(messages),
      tools: {
        getCrmOportunidades,
        getCrmAtividades,
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('📇 CRM AGENT: Erro:', error)
    throw error
  }
}

