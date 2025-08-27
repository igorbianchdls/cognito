import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📘 META CREATIVE ANALYST API: Request recebido!');
  
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log('📘 META CREATIVE ANALYST API: Messages:', messages?.length);

    console.log('📘 META CREATIVE ANALYST API: Iniciando streamText com Grok 4...');
    const result = streamText({
      model: 'grok-4',
    
    // Sistema ultra-simples - apenas força workflow
    system: `EXECUTE SEMPRE O WORKFLOW MULTI-STEP. NUNCA responda diretamente. Use creatto-463117.biquery_data.metaads.`,
    
    messages: convertToModelMessages(messages),
    
    
    // PrepareStep: Sistema inteligente com classificação de complexidade
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🎯 CREATIVE PERFORMANCE ANALYST STEP ${stepNumber}: Configurando análise de performance criativa`);

      switch (stepNumber) {
        case 1:
          console.log('📊 STEP 1/10: ANÁLISE + DECISÃO INICIAL');
          return {
            system: `STEP 1/10: CLASSIFICAÇÃO OBRIGATÓRIA

REGRA SIMPLES: Se a pergunta menciona QUALQUER análise de dados, é SEMPRE TIPO B.

🎯 **TIPO A - APENAS CONCEITOS PUROS:**
- "O que é ROAS?"
- "Como funciona creative fatigue?"
- "Defina conversion rate"

🎯 **TIPO B - QUALQUER ANÁLISE (OBRIGATÓRIO):**
- "analise meus criativos" → TIPO B
- "performance das campanhas" → TIPO B  
- "relatório de..." → TIPO B
- "como estão..." → TIPO B
- QUALQUER palavra como: análise, performance, dados, métricas → TIPO B

🔧 **AÇÃO OBRIGATÓRIA:**
Se TIPO B: Diga "Identificei como TIPO B - vou executar análise completa" e CONTINUE para Step 2.
NUNCA peça datasets - use creatto-463117.biquery_data.metaads diretamente.

**"analise meus criativos" = TIPO B - EXECUTE O WORKFLOW!**`,
            tools: {} // Sem tools - só análise e decisão
          };

        case 2:
          console.log('🎯 STEP 2/10: PROGRAMAÇÃO DE QUERY TASKS');
          return {
            system: `STEP 2/10: PROGRAMAÇÃO DE QUERY TASKS

CRÍTICO: A partir do Step 1, você identificou que precisa de análise de dados (TIPO B).

Agora PROGRAME especificamente quais Query Tasks serão executadas nos próximos steps.

🎯 **DEFINIR QUERY TASKS:**
Baseado na pergunta do usuário, defina quais tipos de queries serão executadas:

📋 **QUERY TASK 1 (Step 3):**
Sempre: Pegar colunas da tabela metaads
SELECT column_name, data_type FROM \`creatto-463117.biquery_data.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name = 'metaads';

📋 **QUERY TASK 2 (Step 5):**
Definir se precisará e qual tipo:
- Performance geral de criativos
- Análise temporal específica
- Correlações entre elementos criativos
- Outras análises baseadas na pergunta

📋 **QUERY TASK 3 (Step 7):**
Definir se precisará e qual tipo:
- Query complementar para aprofundar achados
- Análise de segmentação específica
- Verificação de padrões identificados

📋 **QUERY TASK 4 (Step 9):**
Definir se precisará e qual tipo:
- Query final de consolidação
- Validação de insights principais

🔧 **INSTRUÇÃO:**
Explique ao usuário exatamente quais Query Tasks você definiu para executar baseado na pergunta dele, sem executar as queries ainda.

**EXEMPLO:** "Baseado na sua pergunta sobre performance de criativos, programei: Task 1 - Pegar colunas, Task 2 - Performance geral por criativo, Task 3 - Análise temporal dos top performers. Vou executar essas queries em sequência nos próximos steps."`,
            tools: {} // Sem tools - só programação/planejamento
          };

        case 3:
          console.log('🎯 STEP 3/10: EXECUTAR QUERY TASK 1');
          return {
            system: `STEP 3/10: EXECUTAR QUERY TASK 1

Execute EXATAMENTE a Query Task 1 programada no Step 2:

🎯 **QUERY TASK 1 OBRIGATÓRIA:**
SELECT 
  column_name,
  data_type
FROM \`creatto-463117.biquery_data.INFORMATION_SCHEMA.COLUMNS\`
WHERE table_name = 'metaads';

📊 **Objetivo:**
- Identifique todas as colunas disponíveis na tabela metaads
- Analise os tipos de dados de cada coluna
- Prepare contexto para próximas Query Tasks programadas

**IMPORTANTE:** 
- Execute EXATAMENTE esta query
- Use sempre \`creatto-463117.biquery_data.metaads\` nas próximas queries
- APENAS execute - análise será feita no próximo step`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };

        case 4:
          console.log('🎯 STEP 4/10: ANÁLISE + GRÁFICO CRIATIVO 1');
          return {
            system: `STEP 4/10: ANÁLISE + GRÁFICO CRIATIVO 1

Analise os dados da Query 1 e determine próximos passos.

🎨 **Análise estratégica dos dados:**
- Compare conversion rates entre criativos
- Identifique top performers vs underperformers
- Detecte oportunidades de scaling (high conversion rate)
- Analise efficiency ranking por tipo criativo
- Sinalize patterns de creative fatigue

🔧 **Processo:**
1. Analise os dados JSON obtidos no Step 3
2. Identifique patterns de performance criativa
3. Gere insights estratégicos sobre optimization
4. Destaque criativos candidatos a scaling ou refresh

📊 **Visualização opcional:**
Crie gráfico se os dados forem visuais por natureza e agregarem valor aos insights.

🔄 **Próxima etapa:**
- Se dados responderam completamente à pergunta → Pule para Step 10 (resumo)
- Se identificou patterns interessantes que precisam investigação → Continue para Step 5
- Se precisa de análise temporal ou correlações → Continue para Step 5`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };

        case 5:
          console.log('🎯 STEP 5/10: EXECUTAR QUERY TASK 2');
          return {
            system: `STEP 5/10: EXECUTAR QUERY TASK 2

Execute a Query Task 2 programada no Step 2.

🎯 **EXECUTE APENAS SE:**
A Query Task 2 foi definida no Step 2 como necessária

🎨 **Query Task 2:**
FROM \`creatto-463117.biquery_data.metaads\`

Execute a query programada no Step 2 baseada na pergunta do usuário:
- Performance geral de criativos
- Análise temporal específica  
- Correlações entre elementos criativos
- Ou outro tipo definido no Step 2

**IMPORTANTE:** 
- Use as colunas identificadas no Step 3
- FROM obrigatório: \`creatto-463117.biquery_data.metads\`
- APENAS execute a query - análise será feita no próximo step`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };

        case 6:
          console.log('🎯 STEP 6/10: ANÁLISE + GRÁFICO CRIATIVO 2');
          return {
            system: `STEP 6/10: ANÁLISE + GRÁFICO CRIATIVO 2

Analise os dados da Query 2 e determine se precisa continuar.

🎨 **Análise estratégica complementar:**
- Correlacione com findings do Step 4 para insights mais ricos
- Identifique causas raíz de creative performance patterns
- Desenvolva recomendações criativas mais específicas
- Aprofunde análise temporal e correlações

🔧 **Processo:**
1. Analise os dados JSON obtidos no Step 5
2. Correlacione com insights anteriores do Step 4
3. Identifique padrões criativos mais profundos
4. Desenvolva insights estratégicos complementares

🎨 **Análises especializadas:**
- Temporal analysis dos top performers
- Creative frequency vs conversion patterns
- Creative lifecycle performance
- Element attribution analysis

📊 **Visualização opcional:**
Crie gráfico se agregar valor estratégico aos insights criativos.

🔄 **Próxima etapa:**
- Se tem insights suficientes para recomendações → Pule para Step 10 (resumo)
- Se descobriu patterns que precisam investigação mais profunda → Continue para Step 7`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };

        case 7:
          console.log('🎯 STEP 7/10: EXECUTAR QUERY TASK 3');
          return {
            system: `STEP 7/10: EXECUTAR QUERY TASK 3

Execute a Query Task 3 programada no Step 2.

💡 **EXECUTE APENAS SE:**
A Query Task 3 foi definida no Step 2 como necessária

🎨 **Query Task 3:**
FROM \`creatto-463117.biquery_data.metaads\`

Execute a query programada no Step 2:
- Query complementar para aprofundar achados
- Análise de segmentação específica
- Verificação de padrões identificados
- Ou outro tipo definido no Step 2

**IMPORTANTE:** 
- Use insights dos Steps 4 e 6 para guiar esta query
- FROM obrigatório: \`creatto-463117.biquery_data.metads\`
- APENAS execute a query - análise será feita no próximo step`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };

        case 8:
          console.log('🎯 STEP 8/10: ANÁLISE + GRÁFICO CRIATIVO 3');
          return {
            system: `STEP 8/10: ANÁLISE + GRÁFICO CRIATIVO 3

Análise final dos dados da Query 3 e preparação para conclusão.

🎨 **Análise estratégica final:**
- Integre insights com achados dos steps anteriores (4 e 6)
- Consolide creative performance patterns
- Prepare foundation para recomendações de optimization
- Quantifique impact potential das opportunities identificadas

🔧 **Processo:**
1. Analise os dados JSON obtidos no Step 7
2. Integre com todos os insights anteriores
3. Consolide todos os padrões criativos identificados
4. Prepare insights finais para o resumo executivo

🎨 **Consolidação estratégica:**
- Creative rotation opportunities com impact quantificado
- Scaling readiness dos top performers
- Risk assessment de underperformers
- Timeline para creative refresh implementation
- Expected conversion impact das mudanças propostas

📊 **Visualização final opcional:**
Crie gráfico final se agregar clareza aos insights consolidados.

🔄 **Próxima etapa:**
- Se análise está completa e tem recomendações sólidas → Pule para Step 10 (resumo)
- Se precisa validar insights-chave ou quantificar impact → Continue para Step 9`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };

        case 9:
          console.log('🎯 STEP 9/10: EXECUTAR QUERY TASK 4');
          return {
            system: `STEP 9/10: EXECUTAR QUERY TASK 4

Execute a Query Task 4 programada no Step 2.

✨ **EXECUTE APENAS SE:**
A Query Task 4 foi definida no Step 2 como necessária

🎨 **Query Task 4:**
FROM \`creatto-463117.biquery_data.metaads\`

Execute a query de consolidação programada no Step 2:
- Query final de consolidação
- Validação de insights principais
- Quantificação de impact estimates
- Ou outro tipo definido no Step 2

**IMPORTANTE:** 
- Use todos os insights dos Steps anteriores (4, 6, 8)
- FROM obrigatório: \`creatto-463117.biquery_data.metads\`
- Prepare dados para o resumo executivo do Step 10`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };

        case 10:
          console.log('🎯 STEP 10/10: RESUMO EXECUTIVO + CREATIVE STRATEGIC RECOMMENDATIONS');
          return {
            system: `STEP 10/10: RESUMO EXECUTIVO + CREATIVE STRATEGIC RECOMMENDATIONS

Consolide TODOS os insights criativos dos steps anteriores em síntese executiva focada em conversion impact e creative ROI optimization.

📋 **RESUMO EXECUTIVO CRIATIVO OBRIGATÓRIO:**

**Para CONTEXTUAL:** Responda diretamente baseado no contexto criativo da conversa anterior.

**Para SIMPLES/COMPLEXA:** Gere resumo em markdown padrão consolidando análise criativa completa.

🎯 **ESTRUTURA DO RESUMO CRIATIVO:**

**KEY CREATIVE FINDINGS (3-5 insights principais):**
- Creative performance highlights: melhores e piores performing creatives
- Creative efficiency gaps: mismatches entre spend e conversion rate
- Scaling opportunities: criativos ready para budget increase
- Creative fatigue trends: momentum e consistency patterns
- Element attribution: quais elementos criativos convertem melhor

**STRATEGIC CREATIVE RECOMMENDATIONS (priorizadas por conversion impact):**
- Creative rotation strategy: quais criativos refresh e quando
- Scaling strategy: quais criativos aumentar budget e em quanto
- Creative optimization actions: elementos para teste/ajuste
- Creative refresh timeline: when implementar cada recommendation
- A/B testing roadmap: próximos testes criativos prioritários

**CREATIVE BUSINESS IMPACT:**
- Conversion rate improvement potential das mudanças propostas
- ROAS criativo improvement esperado
- Creative fatigue risk assessment e mitigation strategies
- Success metrics criativas para tracking
- Expected revenue impact das creative optimizations

🔧 **PROCESS:**
1. Para análises criativas SIMPLES/COMPLEXA, gere resumo em markdown padrão sem tool calls
2. Para CONTEXTUAL, responda diretamente sem tools
3. Estruture creative recommendations por priority e expected conversion impact
4. Include quantified creative impact estimates quando possível
5. End com clear next steps criativos e success metrics

**FOQUE EM:**
- Conversion outcomes criativos, não apenas métricas
- Actionable creative recommendations com timelines
- Quantified creative impact quando possível
- Creative strategic priorities, não tactical details
- Creative ROI e scaling opportunities baseadas em performance real`,
            tools: {}
          };

        default:
          console.log(`⚠️ CREATIVE PERFORMANCE ANALYST STEP ${stepNumber}: Configuração padrão`);
          return {
            system: `Análise de performance de criativos Facebook/Meta Ads com foco em conversion rate e creative optimization.`,
            tools: {}
          };
      }
    },
    
    // StopWhen inteligente baseado na classificação de complexidade
    stopWhen: stepCountIs(10),
    tools: {
      // Apenas tools específicas necessárias
      executarSQL: bigqueryTools.executarSQL,
      criarGrafico: analyticsTools.criarGrafico,
    },
  });

    console.log('📘 META CREATIVE ANALYST API: streamText criado, retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ META CREATIVE ANALYST API ERROR:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}