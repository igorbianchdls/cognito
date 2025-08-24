import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🎨 META CREATIVE ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🎨 META CREATIVE ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are MetaCreativeAnalyst AI, a specialized assistant for analyzing Facebook and Instagram ad creatives, image and video performance, creative testing, A/B testing for ads, and creative optimization strategies.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🎨 META CREATIVE ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 META CREATIVE ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As MetaCreativeAnalyst, focus on Facebook and Instagram ad creative optimization aspects:
            
🎨 **Analysis Focus:**
- What creative performance insights are they seeking?
- What ad creative testing or A/B testing analysis needs examination?
- What image or video performance optimization is relevant?
- What creative metrics should be analyzed?
- Are they asking about CTR, engagement rates, creative fatigue, or format performance?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a Meta creative optimization perspective. Explain what you understand they want and outline your creative analysis approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 META CREATIVE ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Meta creative and ad performance analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Facebook/Instagram creative data or ad performance information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain Meta creative data, ad performance, or engagement metrics
- Look for datasets with names like 'meta_creatives', 'facebook_ads', 'instagram_ads', 'ad_creatives', 'creative_performance'
- Explain which datasets offer the best creative optimization insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 META CREATIVE ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Meta creative or ad performance data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain creative assets, ad performance, or A/B testing data.
            
📊 **Focus:**
- Choose the dataset most relevant to Meta creative analysis from step 2
- Execute getTables with the selected datasetId
- Look for tables with creative data: creatives, ad_performance, creative_tests, images, videos, ad_sets
- Identify tables that contain the creative optimization data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 META CREATIVE ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Meta creative and ad performance data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve creative data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on Meta creative performance metrics
- Focus on creative formats, engagement rates, CTR, creative fatigue, A/B testing results
- Use appropriate aggregations for creative analysis (performance by format, creative, etc.)
- Consider time-based analysis for creative performance trends and fatigue detection
            
💡 **Example Approaches:**
- Creative performance: "SELECT creative_id, creative_type, ad_format, SUM(impressions), SUM(clicks), AVG(ctr), SUM(conversions) FROM project.meta_ads.creative_performance GROUP BY creative_id, creative_type, ad_format ORDER BY AVG(ctr) DESC"
- Format analysis: "SELECT ad_format, COUNT(*) as creative_count, AVG(ctr) as avg_ctr, AVG(cpm) as avg_cpm, SUM(conversions) as total_conversions FROM project.meta_creatives.performance GROUP BY ad_format ORDER BY avg_ctr DESC"
- Creative testing: "SELECT test_id, creative_variant, SUM(impressions), AVG(ctr), AVG(conversion_rate), AVG(cpc) FROM project.meta_ads.ab_tests GROUP BY test_id, creative_variant ORDER BY test_id, AVG(ctr) DESC"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 META CREATIVE ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY META CREATIVE ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Meta creative analysis.
            
🎨 **Required Creative Analysis:**
- **Creative Performance:** Which creatives and formats drive the best engagement and conversions?
- **Format Optimization:** What creative formats perform best across different objectives?
- **Creative Fatigue:** Are there signs of creative fatigue and when should creatives be refreshed?
- **A/B Testing Insights:** What A/B testing results reveal about creative preferences?
- **Audience Response:** How do different creatives resonate with various audience segments?
            
🎯 **Specific Focus Areas:**
- Creative format performance analysis (image, video, carousel, collection)
- Click-through rates and engagement metrics by creative type
- Creative longevity and fatigue detection patterns
- A/B testing statistical significance and winner identification
- Visual elements impact on performance (colors, text, imagery)
- Platform-specific performance differences (Facebook vs Instagram)
            
⚠️ **IMPORTANT:** 
- Focus on actionable creative optimization insights
- Provide specific recommendations for creative strategy and testing
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving creative performance, reducing fatigue, and optimizing formats`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 META CREATIVE ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE META CREATIVE VISUALIZATION
            
Finalize with a visualization that represents Meta creative insights and optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the Meta creative insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for creative analysis (bar charts for format comparison, line charts for performance trends, scatter plots for CTR vs conversion)
- Focus on key creative KPIs: CTR, engagement rates, conversion rates, creative fatigue metrics
- Use data from the SQL query in step 4
- Make sure the visualization supports your creative analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for creative visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key creative performance metrics and optimization indicators
            
🎨 **Final Touch:**
Provide final Meta creative optimization recommendations and creative strategy suggestions based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ META CREATIVE ANALYST STEP ${stepNumber}: Configuração padrão`);
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
      // BigQuery tools
      ...bigqueryTools,
      // Analytics tools  
      ...analyticsTools,
      // Utilities tools
      ...utilitiesTools,
    },
  });

  console.log('🎨 META CREATIVE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}