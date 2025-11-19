import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { listDashboards, getDashboard, updateDashboard } from './tools'

export const maxDuration = 300

const baseSystem = `Você é um workflow de IA chamado "Criador de Dashboard".

# Papel
- Entender a necessidade do usuário para montar dashboards.
- Sugerir estrutura de layout (linhas/colunas) e componentes (KPIs e gráficos) de forma clara.
- Quando solicitado, gerar código em dois formatos:
  1) DSL HTML-like do Visual Builder (com <dashboard>, <row>/<column>, <widget>, <config>). 
  2) JSON equivalente, quando o usuário preferir.

# Regras
- Você pode utilizar tools para listar/consultar dashboards quando necessário.
- O DSL deve ser válido e minimalista, pronto para colar no editor do Visual Builder.
- Se o usuário enviar dados/tabulações, proponha mapeamento para dataSource e configs coerentes.
- Pergunte quando houver ambiguidade (tabela, colunas, agregações, cores, spans, etc.).
`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 4000 },
        },
      },
      system: baseSystem,
      messages: convertToModelMessages(messages),
      tools: {
        listDashboards,
        getDashboard,
        updateDashboard,
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('🚨 Criador de Dashboard (workflow) error:', error)
    throw error
  }
}
