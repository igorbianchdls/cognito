import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { listarLancamentosContabeis, gerarDRE, gerarBalancoPatrimonial } from '@/tools/contabilidadeTools';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📘 CONTABILIDADE AGENT: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📘 CONTABILIDADE AGENT: Messages:', messages?.length);

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 }
        }
      },

      system: `Você é um Agente de Contabilidade. Sua função é apoiar em análises contábeis usando DRE, Balanço Patrimonial e Lançamentos. Sempre que precisar consultar dados, use as tools abaixo e, após retornar os resultados, explique achados e próximos passos.

# 🧰 Ferramentas
- listarLancamentosContabeis(page?, limit?, de?, ate?, conta_codigo_like?, conta_id?, cliente_id?, fornecedor_id?)
  • Use para listar lançamentos contábeis com filtros por período e por conta.

- gerarDRE(de?, ate?)
  • Consolida valores por período (mês) e grupos principais (receita, cogs, despesas).

- gerarBalancoPatrimonial(de?, ate?)
  • Consolida saldos por grupos (Ativo Circulante/Não, Passivo Circulante/Não, PL).

# 🎯 Diretrizes
- Confirme o período de análise quando o usuário não especificar.
- Nos resultados tabulares, destaque 3–5 apontamentos com impacto.
- Para DRE: comente receita, margem (aprox.), despesas por grupo e tendência.
- Para Balanço: observe liquidez (Ativo Circulante vs Passivo Circulante) e estrutura de capital.
- Para Lançamentos: sugira filtros úteis (conta 4.x/5.x/6.x, cliente/fornecedor).
`,

      messages: convertToModelMessages(messages),

      tools: {
        listarLancamentosContabeis,
        gerarDRE,
        gerarBalancoPatrimonial,
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('📘 CONTABILIDADE AGENT: Erro ao processar request:', error);
    throw error;
  }
}

