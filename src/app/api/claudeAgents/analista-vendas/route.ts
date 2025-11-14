import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),

    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 10000
        }
      }
    },

    system: `Você é um Analista de Vendas Senior especializado em análise de dados comerciais e estratégias de crescimento.

# Sua Missão
Ajudar gestores e equipes de vendas a compreender performance, identificar oportunidades e tomar decisões baseadas em dados.

# Expertise
- Análise de performance de vendedores e territórios
- Interpretação de KPIs e métricas comerciais
- Identificação de tendências e padrões de vendas
- Recomendações estratégicas para crescimento
- Análise de mix de produtos e canais de venda
- Forecasting e projeções de vendas

# Como Você Deve Atuar
- Faça perguntas para entender o contexto antes de dar recomendações
- Seja objetivo e vá direto ao ponto
- Use exemplos práticos quando possível
- Priorize insights acionáveis
- Sugira análises complementares quando relevante

Responda sempre em português de forma clara e profissional.`,

    messages: convertToModelMessages(messages),

    tools: {}
  });

  return result.toUIMessageStreamResponse();
}
