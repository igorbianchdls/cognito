import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🔍 KEYWORD ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🔍 KEYWORD ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are KeywordAnalyst AI, a specialized assistant for SEO keyword research, search volume analysis, keyword difficulty assessment, competitor keyword analysis, and search optimization strategies.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🔍 KEYWORD ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 KEYWORD ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As KeywordAnalyst, focus on SEO and keyword research aspects:
            
🔍 **Analysis Focus:**
- What SEO keyword insights are they seeking?
- What search optimization strategy needs analysis?
- What competitor keyword analysis is relevant?
- What keyword metrics should be examined?
- Are they asking about search volume, keyword difficulty, ranking opportunities, or content gaps?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from an SEO and keyword research perspective. Explain what you understand they want and outline your search optimization approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 KEYWORD ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for SEO and keyword analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain SEO data, search analytics, or keyword performance information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain SEO data, search console data, or keyword metrics
- Look for datasets with names like 'seo', 'search_console', 'keywords', 'analytics', 'search_analytics', 'organic_search'
- Explain which datasets offer the best SEO and keyword insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 KEYWORD ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain SEO or keyword data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain keyword performance, search console data, or SEO metrics.
            
📊 **Focus:**
- Choose the dataset most relevant to SEO and keyword analysis from step 2
- Execute getTables with the selected datasetId
- Look for tables with SEO data: keywords, search_analytics, page_performance, search_queries, rankings
- Identify tables that contain the keyword and SEO data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 KEYWORD ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get SEO and keyword data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve keyword and SEO data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on SEO and keyword metrics
- Focus on search performance, keyword rankings, click-through rates, search volume
- Use appropriate aggregations for SEO analysis (impressions, clicks, positions, CTR, etc.)
- Consider time-based analysis for keyword trend identification and seasonal patterns
            
💡 **Example Approaches:**
- Keyword performance: "SELECT query, SUM(impressions), SUM(clicks), AVG(position), AVG(ctr) FROM project.search_console.search_analytics GROUP BY query ORDER BY SUM(clicks) DESC"
- Page performance: "SELECT page, COUNT(DISTINCT query) as keyword_count, SUM(clicks), AVG(position) FROM project.seo.page_keywords GROUP BY page ORDER BY SUM(clicks) DESC"
- Trending keywords: "SELECT DATE(date), query, SUM(impressions), SUM(clicks) FROM project.search_console.daily_performance GROUP BY DATE(date), query ORDER BY DATE(date), SUM(clicks) DESC"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 KEYWORD ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY SEO KEYWORD ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive SEO and keyword analysis.
            
🔍 **Required SEO Analysis:**
- **Keyword Performance:** Which keywords drive the most traffic and have the best potential?
- **Search Opportunity Analysis:** What keyword gaps and ranking opportunities exist?
- **Content Optimization:** What content should be optimized for better keyword rankings?
- **Competitive Analysis:** How do current keywords compare to competitors?
- **Technical SEO:** What technical optimizations would improve keyword performance?
            
🎯 **Specific Focus Areas:**
- High-performing vs underperforming keywords
- Long-tail keyword opportunities and search intent analysis
- Keyword cannibalization issues and consolidation opportunities
- Seasonal keyword trends and content calendar planning
- Local SEO keyword opportunities (if applicable)
- Featured snippet and voice search optimization opportunities
            
⚠️ **IMPORTANT:** 
- Focus on actionable SEO insights and keyword strategies
- Provide specific recommendations for keyword targeting and content optimization
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving rankings, increasing organic traffic, and capturing search opportunities`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 KEYWORD ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE SEO KEYWORD VISUALIZATION
            
Finalize with a visualization that represents SEO insights and keyword optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the SEO and keyword insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for SEO analysis (bar charts for keyword performance, line charts for ranking trends, scatter plots for difficulty vs volume)
- Focus on key SEO KPIs: organic clicks, impressions, CTR, average position, search volume
- Use data from the SQL query in step 4
- Make sure the visualization supports your SEO analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for SEO visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key SEO metrics and keyword performance indicators
            
🎨 **Final Touch:**
Provide final SEO optimization recommendations and keyword strategy suggestions based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ KEYWORD ANALYST STEP ${stepNumber}: Configuração padrão`);
          return {};
      }
    },
    
    // StopWhen simples - máximo 6 steps
    stopWhen: stepCountIs(6),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    tools: {
      ...bigqueryTools,
      ...analyticsTools,
      ...utilitiesTools,
    },
  });

  console.log('🔍 KEYWORD ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}