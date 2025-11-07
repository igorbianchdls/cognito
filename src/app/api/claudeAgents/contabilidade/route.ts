import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { listarLancamentosContabeis, gerarDRE, gerarBalancoPatrimonial } from '@/tools/contabilidadeTools';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📘 CONTABILIDADE AGENT: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📘 CONTABILIDADE AGENT: Messages:', messages?.length);

  const SYSTEM_PROMPT = `Você é um Agente de Contabilidade. Sua função é apoiar em análises contábeis usando DRE, Balanço Patrimonial e Lançamentos. Sempre que precisar consultar dados, use as tools abaixo e, após retornar os resultados, explique achados e próximos passos.

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
- Para Lançamentos: sugira filtros úteis (conta 4.x/5.x/6.x, cliente/fornecedor).`;

  const isOverloaded = (err: unknown) => {
    const anyErr = err as { type?: string; message?: string } | undefined;
    const t = (anyErr?.type || '').toString().toLowerCase();
    const m = (anyErr?.message || '').toString().toLowerCase();
    return (
      t.includes('overload') ||
      m.includes('overload') ||
      m.includes('rate limit') ||
      m.includes('503') ||
      m.includes('529') ||
      m.includes('timeout')
    );
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Tenta com re-tentativas e fallback de modelo/"thinking"
  for (let attempt = 1; attempt <= 3; attempt++) {
    const useFallbackModel = attempt === 3;
    const modelName = useFallbackModel ? 'claude-3-5-sonnet-20241022' : 'claude-sonnet-4-20250514';
    const thinkingBudget = attempt === 1 ? 8000 : attempt === 2 ? 3000 : undefined;

    try {
      const result = streamText({
        model: anthropic(modelName),
        providerOptions: {
          anthropic: thinkingBudget
            ? { thinking: { type: 'enabled', budgetTokens: thinkingBudget } }
            : {},
        },
        system: SYSTEM_PROMPT,
        messages: convertToModelMessages(messages),
        tools: {
          listarLancamentosContabeis,
          gerarDRE,
          gerarBalancoPatrimonial,
        },
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error(`📘 CONTABILIDADE AGENT: tentativa ${attempt} falhou:`, error);
      if (isOverloaded(error) && attempt < 3) {
        // Espera com backoff e tenta de novo
        await sleep(1000 * attempt);
        continue;
      }
      // Erro diferente de sobrecarga, propaga
      if (!isOverloaded(error)) {
        throw error;
      }
    }
  }

  // Todas as tentativas falharam por sobrecarga
  console.error('📘 CONTABILIDADE AGENT: Serviço sobrecarregado após múltiplas tentativas.');
  return Response.json(
    {
      success: false,
      error: 'overloaded',
      message: 'Serviço de IA sobrecarregado no momento. Tente novamente em instantes.',
    },
    { status: 503 }
  );
}
