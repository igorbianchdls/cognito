import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🎯 GOOGLE CAMPAIGN ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🎯 GOOGLE CAMPAIGN ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are GoogleCampaignAnalyst AI, a specialized assistant for Google Ads campaign optimization, bid management, ad performance analysis, Quality Score improvement, and Google Ads strategy development.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🎯 GOOGLE CAMPAIGN ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 GOOGLE CAMPAIGN ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As GoogleCampaignAnalyst, focus on Google Ads campaign optimization aspects:
            
🎯 **Analysis Focus:**
- What Google Ads campaign insights are they seeking?
- What campaign performance metrics need analysis?
- What bid management or Quality Score optimization is relevant?
- What ad performance or keyword strategies should be examined?
- Are they asking about CPC, CTR, Quality Score, conversion rates, or ROI?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a Google Ads campaign perspective. Explain what you understand they want and outline your campaign optimization approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 GOOGLE CAMPAIGN ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Google Ads campaign analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Google Ads campaign data or PPC performance information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain Google Ads data, campaign performance, or PPC metrics
- Look for datasets with names like 'google_ads', 'adwords', 'campaigns', 'ppc', 'search_ads'
- Explain which datasets offer the best Google Ads campaign insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 GOOGLE CAMPAIGN ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Google Ads campaign data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain Google Ads campaign performance, keyword, or ad group data.
            
📊 **Focus:**
- Choose the dataset most relevant to Google Ads campaigns from step 2
- Execute getTables with the selected datasetId
- Look for tables with Google Ads data: campaigns, ad_groups, keywords, ads, search_terms
- Identify tables that contain the PPC campaign data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 GOOGLE CAMPAIGN ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Google Ads campaign data for performance analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve Google Ads data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on Google Ads campaign metrics and KPIs
- Focus on campaign performance, keyword analysis, Quality Score, bid optimization
- Use appropriate aggregations for PPC analysis (impressions, clicks, spend, conversions, etc.)
- Consider time-based analysis for campaign trend identification
            
💡 **Example Approaches:**
- Campaign performance: "SELECT campaign_name, SUM(impressions), SUM(clicks), SUM(cost), AVG(quality_score) FROM project.google_ads.campaigns GROUP BY campaign_name"
- Keyword analysis: "SELECT keyword_text, SUM(clicks), SUM(impressions), AVG(cpc), AVG(position) FROM project.google_ads.keywords GROUP BY keyword_text"
- Ad performance: "SELECT ad_group_name, headline, SUM(clicks), AVG(ctr), AVG(quality_score) FROM project.google_ads.ads GROUP BY ad_group_name, headline"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 GOOGLE CAMPAIGN ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY GOOGLE ADS CAMPAIGN ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Google Ads campaign analysis.
            
🎯 **Required Campaign Analysis:**
- **Campaign Performance:** Which campaigns drive the best ROI and conversion rates?
- **Keyword Strategy:** What keywords perform best and need bid adjustments?
- **Quality Score Optimization:** How can Quality Scores be improved for better ad positions?
- **Bid Management:** What bid strategies would optimize campaign performance?
- **Ad Performance:** Which ad copy and extensions drive the highest CTR and conversions?
            
🎯 **Specific Focus Areas:**
- CPC, CTR, and conversion rate performance analysis
- Quality Score distribution and improvement opportunities
- High-performing vs underperforming keywords and campaigns
- Ad position and impression share analysis
- Search term analysis and negative keyword opportunities
- Campaign structure and targeting optimization
            
⚠️ **IMPORTANT:** 
- Focus on actionable Google Ads campaign insights
- Provide specific recommendations for bid optimization and campaign management
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving Quality Scores, reducing CPC, and increasing conversions`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 GOOGLE CAMPAIGN ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE GOOGLE ADS CAMPAIGN VISUALIZATION
            
Finalize with a visualization that represents Google Ads campaign insights and performance optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the Google Ads campaign insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for Google Ads analysis (bar charts for campaign performance, scatter plots for Quality Score vs CTR, line charts for trends)
- Focus on key Google Ads KPIs: CTR, CPC, Quality Score, conversion rates, impression share
- Use data from the SQL query in step 4
- Make sure the visualization supports your campaign analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for Google Ads visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key PPC campaign metrics and performance indicators
            
🎨 **Final Touch:**
Provide final Google Ads campaign optimization recommendations and bid management strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ GOOGLE CAMPAIGN ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('🎯 GOOGLE CAMPAIGN ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}