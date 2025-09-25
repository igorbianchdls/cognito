import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📦 PRODUCT AGENT: Request recebido!');

  try {
    const body = await req.json();
    const { messages } = body;
    console.log('📦 PRODUCT AGENT: Messages:', messages?.length);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: `Você é especialista em análise de produtos de lojas com workflow estruturado obrigatório.

REGRAS CRÍTICAS PARA TOOL CALLS:
⚠️ ATENÇÃO MÁXIMA: Ao chamar qualquer tool com parâmetros array, NUNCA envie como string JSON!
- ✅ CORRETO: insights: [{titulo: "...", dados: "..."}] (array real de objetos)
- ❌ ERRADO: insights: "[{\"titulo\": \"...\", \"dados\": \"...\"}]" (string serializada)
- ❌ NUNCA use JSON.stringify() nos parâmetros de tools
- ❌ NUNCA coloque aspas ao redor de arrays ou objetos nos parâmetros
- ✅ SEMPRE envie arrays como estruturas JavaScript nativas, não strings
CRÍTICO: Este é um erro comum que quebra a validação das tools!

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise produtos", execute automaticamente o workflow completo de 3 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - ANÁLISE POR CATEGORIA:
- Antes de executar executarSQLComDados(), explique de forma detalhada o que você vai fazer
- Execute executarSQLComDados com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    product_category,
    COUNT(DISTINCT purchase_id) as total_purchases,
    SUM(product_price * quantity) as revenue,
    AVG(product_price) as avg_price
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY product_category
ORDER BY revenue DESC"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 2 - ANÁLISE TOP PRODUTOS:
- Execute executarSQLComDados com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    product_name,
    SUM(product_price * quantity) as total_revenue,
    SUM(quantity) as total_sold
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 10"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 3 - INSIGHTS VISUAIS OBRIGATÓRIO:
- OBRIGATÓRIO: Execute gerarInsights seguindo as REGRAS CRÍTICAS estabelecidas acima
- OBRIGATÓRIO: Baseie-se EXCLUSIVAMENTE nos dados REAIS obtidos nos STEP 1 e STEP 2

⚠️ FORMATO EXATO para gerarInsights (aplicando as regras gerais):
```
gerarInsights({
  insights: [    // ← ARRAY real, NÃO string!
    {
      titulo: "CATEGORIA DOMINANTE: Anéis com 39% da receita",
      descricao: "Análise detalhada com números reais...",
      dados: "Receita: R$ 160.771 | Compras: 147 | Preço médio: R$ 582,35",
      importancia: "alta"
    },
    {
      titulo: "TOP PRODUTO: Anel Solitário Diamante com R$ 59.998",
      descricao: "Produto campeão representa 37% da categoria...",
      dados: "Receita: R$ 59.998 | Unidades: 24 | Preço unitário: R$ 2.500",
      importancia: "alta"
    }
    // ... mais 3-4 insights
  ],
  resumo: "Análise completa dos produtos...",
  contexto: "Baseado em análise de produtos do ecommerce - STEP 1 (categorias) e STEP 2 (top produtos)"
})
```

- OBRIGATÓRIO: Crie 4-6 insights cobrindo:
  * CATEGORIA DOMINANTE (importancia: 'alta')
  * TOP PRODUTO individual (importancia: 'alta')
  * CONCENTRAÇÃO vs DIVERSIFICAÇÃO (importancia: 'media')
  * OPORTUNIDADE identificada (importancia: 'media')
  * TICKET MÉDIO por categoria (importancia: 'baixa')
  * RECOMENDAÇÃO estratégica (importancia: 'alta')

🚨 LEMBRETE FINAL: O parâmetro insights é um ARRAY [ ] de objetos, nunca uma string "[ ]"!

IMPORTANTE: Execute os steps OBRIGATORIAMENTE na sequência 1 → 2 → 3. Não pule etapas. Não repita steps. Cada step deve ser executado UMA ÚNICA VEZ na ordem correta.`,
      messages: convertToModelMessages(messages),
      tools: {
        executarSQLComDados: bigqueryTools.executarSQLComDados,
        gerarInsights: bigqueryTools.gerarInsights
      },
      stopWhen: stepCountIs(3),
      prepareStep: async ({ stepNumber }) => {
        console.log(`📦 PRODUCT AGENT: Preparando step ${stepNumber}`);

        if (stepNumber === 1) {
          // Step 1: Only executarSQLComDados allowed
          return {
            activeTools: ['executarSQLComDados'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 2) {
          // Step 2: Only executarSQLComDados allowed
          return {
            activeTools: ['executarSQLComDados'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 3) {
          // Step 3: Only gerarInsights allowed
          return {
            activeTools: ['gerarInsights'],
            toolChoice: 'required'
          };
        }

        return {};
      }
    });

    console.log('📦 PRODUCT AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('📦 PRODUCT AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}