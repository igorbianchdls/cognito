import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as analyticsTools from '@/tools/apps/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('💼 CONTA AZUL ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('💼 CONTA AZUL ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: 'deepseek/deepseek-v3.1-thinking',
    
    // Sistema inicial básico
    system: `You are ContaAzulAnalyst AI, a specialized assistant for analyzing ContaAzul accounting and financial data, cash flow, invoicing, tax compliance, and business financial health for Brazilian businesses.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`💼 CONTA AZUL ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 CONTA AZUL ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/10: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As ContaAzulAnalyst, focus on Brazilian accounting and ContaAzul ERP aspects:
            
💼 **Analysis Focus:**
- What ContaAzul insights are they seeking?
- What Brazilian accounting or tax compliance analysis needs examination?
- What financial health or cash flow optimization is relevant?
- What ContaAzul metrics should be analyzed?
- Are they asking about invoicing, receivables, tax obligations, or business performance?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a ContaAzul and Brazilian business perspective. Explain what you understand they want and outline your accounting/ERP analysis approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 CONTA AZUL ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/10: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for ContaAzul and Brazilian accounting analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain ContaAzul data, Brazilian accounting records, or financial information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain ContaAzul data, accounting records, or Brazilian business metrics
- Look for datasets with names like 'conta_azul', 'accounting', 'invoices', 'receivables', 'brazilian_tax', 'erp'
- Explain which datasets offer the best ContaAzul and Brazilian business insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 CONTA AZUL ANALYST STEP 3: Mapeamento de colunas e tipos');
          return {
            system: `STEP 3/10: MAPEAMENTO DE COLUNAS E TIPOS
            
Execute query SQL para mapear colunas e tipos das tabelas de ContaAzul. APENAS execute a query - NÃO analise os resultados neste step.

📊 **FOCO DO MAPEAMENTO:**
- Use INFORMATION_SCHEMA.COLUMNS para obter estrutura completa das tabelas
- Identifique colunas disponíveis e seus tipos de dados de ContaAzul
- Prepare contexto detalhado para queries nos próximos steps
- Foque na tabela conta_azul que será usada nas análises

🔧 **PROCESSO:**
1. Execute executarSQL() com query de mapeamento de estrutura da tabela conta_azul
2. APENAS execute - sem análise neste step
3. Os dados de estrutura serão usados para construir queries precisas nos próximos steps

**ALWAYS use:** Dataset 'biquery_data' com foco na estrutura da tabela conta_azul

**IMPORTANTE:** Este step mapeia a estrutura. As queries de análise de ContaAzul serão feitas nos próximos steps.`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 4:
          console.log('🎯 CONTA AZUL ANALYST STEP 4: Query 1 - Consulta ContaAzul Principal');
          return {
            system: `STEP 4/10: QUERY 1 - CONSULTA CONTAAZUL PRINCIPAL
            
Execute a primeira query SQL para obter dados ContaAzul. APENAS execute a query - NÃO analise os resultados neste step.
            
💼 **FOCO DA CONSULTA CONTAAZUL:**
- Priorize métricas de contabilidade brasileira: receitas, custos, impostos, fluxo de caixa
- Identifique performance financeira e compliance tributário
- Obtenha dados de faturamento, recebíveis, e obrigações fiscais
- Capture métricas fundamentais de ContaAzul para análise posterior
            
🔧 **PROCESSO:**
1. Execute executarSQL() com query focada na demanda ContaAzul do usuário
2. APENAS execute - sem análise neste step
3. Os dados serão analisados no Step 5

**ALWAYS use:** \`FROM \`creatto-463117.biquery_data.conta_azul\`\`

**IMPORTANTE:** Este é um step de coleta de dados ContaAzul. A análise será feita no Step 5.`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 CONTA AZUL ANALYST STEP 5: Análise dos dados + primeira visualização');
          return {
            system: `STEP 5/10: ANÁLISE DOS DADOS + PRIMEIRA VISUALIZAÇÃO
            
⚠️ CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive ContaAzul and Brazilian business analysis.
            
💼 **Required ContaAzul Analysis:**
- **Business Performance:** How is the business performing financially through ContaAzul data?
- **Cash Flow Health:** What does the receivables and payment data reveal about cash flow?
- **Tax Compliance:** Are there any tax compliance issues or optimization opportunities?
- **Customer Insights:** What customer behavior patterns emerge from the ContaAzul data?
- **Operational Efficiency:** How efficiently is the business operating based on ERP data?
            
📊 **PRIMEIRA VISUALIZAÇÃO OBRIGATÓRIA:**
Crie um gráfico que melhor represente os principais insights ContaAzul encontrados nos dados.

⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Otimize data transfer para economizar tokens - use máximo 50-100 registros para gráficos.
            
⚠️ **IMPORTANT:** 
- Focus on actionable ContaAzul insights and Brazilian business optimization
- Primeira visualização estratégica dos insights principais
- Give concrete suggestions for improving cash flow, tax compliance, and business efficiency`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        case 6:
          console.log('🎯 CONTA AZUL ANALYST STEP 6: Query 2 - Consulta Complementar');
          return {
            system: `STEP 6/10: QUERY 2 - CONSULTA COMPLEMENTAR

Execute segunda query SQL para obter dados complementares baseados nos insights do Step 5. APENAS execute a query - NÃO analise os resultados neste step.

💼 **FOCO DA CONSULTA COMPLEMENTAR:**
- Baseie-se nos insights encontrados no Step 5
- Obtenha dados complementares para deeper ContaAzul analysis
- Foque em correlações, time-series, ou segmentações relevantes
- Capture dados que suportem optimization recommendations

🔧 **PROCESSO:**
1. Execute executarSQL() com query complementar focada nos insights do Step 5
2. APENAS execute - sem análise neste step
3. Os dados complementares serão analisados no próximo step

**ALWAYS use:** \`FROM \`creatto-463117.biquery_data.conta_azul\`\`

**IMPORTANTE:** Este é um step de coleta de dados complementares. A análise será feita no Step 7.`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };

        case 7:
          console.log('🎯 CONTA AZUL ANALYST STEP 7: Análise complementar + segunda visualização');
          return {
            system: `STEP 7/10: ANÁLISE COMPLEMENTAR + SEGUNDA VISUALIZAÇÃO

⚠️ CRITICAL: Você executou query complementar no Step 6. Você DEVE agora analisar esses dados complementares em conjunto com insights anteriores.

🎯 **ANÁLISE COMPLEMENTAR OBRIGATÓRIA:**
- Integre insights da query complementar com análise do Step 5
- Identifique deeper patterns e correlations de ContaAzul performance
- Desenvolva understanding mais rico dos Brazilian business optimization opportunities
- Quantifique impact potential das mudanças propostas

📊 **SEGUNDA VISUALIZAÇÃO:**
Crie segunda visualização complementar que explore aspectos diferentes dos insights ContaAzul.

⚡ **EFFICIENT DATA HANDLING**
Use máximo 50-100 registros para gráficos.

🎯 **REQUIREMENTS:**
- Análise integrada dos dados complementares
- Segunda visualização estratégica
- Deeper ContaAzul optimization insights`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };

        case 8:
          console.log('🎯 CONTA AZUL ANALYST STEP 8: Query 3 - Consulta Final');
          return {
            system: `STEP 8/10: QUERY 3 - CONSULTA FINAL

Execute terceira e última query SQL para validar insights ou obter dados finais necessários para recomendações executivas. APENAS execute a query - NÃO analise os resultados neste step.

🎯 **FOCO DA CONSULTA FINAL:**
- Complete gaps de análise identificados nos steps anteriores
- Valide hipóteses ou quantifique opportunities identificadas
- Obtenha dados finais para sustentar recomendações executivas
- Foque em dados que permitam quantificar ROI das mudanças propostas

🔧 **PROCESSO:**
1. Execute executarSQL() com query final baseada em todos os insights anteriores
2. APENAS execute - sem análise neste step
3. Os dados finais serão analisados no Step 9

**ALWAYS use:** \`FROM \`creatto-463117.biquery_data.conta_azul\`\`

**IMPORTANTE:** Esta é a última coleta de dados. A análise final será feita no Step 9.`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };

        case 9:
          console.log('🎯 CONTA AZUL ANALYST STEP 9: Análise final + terceira visualização');
          return {
            system: `STEP 9/10: ANÁLISE FINAL + TERCEIRA VISUALIZAÇÃO

⚠️ CRITICAL: Você executou query final no Step 8. Você DEVE agora consolidar TODAS as análises e criar visualização final.

🎯 **CONSOLIDAÇÃO FINAL OBRIGATÓRIA:**
- Integre TODOS os insights dos steps 5, 7 e este step
- Consolide ContaAzul patterns em narrative estratégico
- Quantifique impact das Brazilian business optimization opportunities
- Prepare foundation para recomendações executivas do Step 10

📊 **TERCEIRA E FINAL VISUALIZAÇÃO:**
Crie visualização final que sintetiza os principais insights ContaAzul e suporta recomendações executivas.

⚡ **EFFICIENT DATA HANDLING**
Use máximo 50-100 registros para gráficos.

🎯 **REQUIREMENTS:**
- Consolidação de TODOS os insights anteriores
- Terceira visualização estratégica final
- Preparação para recomendações executivas`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };

        case 10:
          console.log('🎯 CONTA AZUL ANALYST STEP 10: Resumo executivo + recomendações estratégicas');
          return {
            system: `STEP 10/10: RESUMO EXECUTIVO + CONTAAZUL STRATEGIC RECOMMENDATIONS
            
Consolide TODOS os insights ContaAzul dos steps anteriores em síntese executiva focada em Brazilian business optimization.
            
📊 **RESUMO EXECUTIVO CONTAAZUL OBRIGATÓRIO:**
- **Business Performance:** Performance financeira geral via dados ContaAzul
- **Cash Flow Health:** Saúde do fluxo de caixa e recebíveis
- **Tax Compliance:** Status de compliance tributário brasileiro
- **Customer Insights:** Padrões de comportamento de clientes
- **Operational Efficiency:** Eficiência operacional via ERP
            
🎯 **STRATEGIC CONTAAZUL RECOMMENDATIONS:**
- Otimização de fluxo de caixa e recebíveis
- Melhorias no compliance tributário brasileiro
- Estratégias de segmentação de clientes
- Otimização de utilização do ERP ContaAzul
- Timeline para implementação das melhorias
            
🎨 **Final Touch:**
Provide final ContaAzul optimization recommendations and Brazilian business management strategies based on the complete analysis and visualization.`,
            tools: {}
          };
          
        default:
          console.log(`⚠️ CONTA AZUL ANALYST STEP ${stepNumber}: Configuração padrão`);
          return {};
      }
    },
    
    // StopWhen simples - máximo 10 steps
    stopWhen: stepCountIs(10),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    tools: {
      // BigQuery tools
      ...bigqueryTools,
      // Analytics tools  
      ...analyticsTools,
      // Utilities tools
      ...utilitiesTools,
    },
  });

  console.log('💼 CONTA AZUL ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}