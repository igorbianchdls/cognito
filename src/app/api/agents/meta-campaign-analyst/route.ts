import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📘 META CAMPAIGN ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📘 META CAMPAIGN ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are MetaCampaignAnalyst AI, a specialized assistant for Facebook and Instagram advertising campaigns, audience targeting, campaign optimization, Meta Ads Manager analysis, and social media advertising strategies.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📘 META CAMPAIGN ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 META CAMPAIGN ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As MetaCampaignAnalyst, focus on Facebook and Instagram advertising aspects:
            
📘 **Analysis Focus:**
- What Meta advertising insights are they seeking?
- What campaign performance metrics need analysis?
- What audience targeting or creative optimization is relevant?
- What Facebook/Instagram ad performance should be examined?
- Are they asking about CPM, CTR, CPC, ROAS, or engagement metrics?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a Meta advertising perspective. Explain what you understand they want and outline your social media advertising approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 META CAMPAIGN ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Meta advertising campaign analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Facebook/Instagram advertising data or social media performance information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain Meta Ads data, social media campaign performance, or engagement metrics
- Look for datasets with names like 'meta_ads', 'facebook_ads', 'instagram', 'social_media', 'campaigns'
- Explain which datasets offer the best Meta advertising insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 META CAMPAIGN ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Meta advertising campaign data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain Facebook/Instagram campaign performance, audience, or creative data.
            
📊 **Focus:**
- Choose the dataset most relevant to Meta advertising from step 2
- Execute getTables with the selected datasetId
- Look for tables with Meta Ads data: campaigns, adsets, ads, audiences, creatives, insights
- Identify tables that contain the social media advertising data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 META CAMPAIGN ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Meta advertising campaign data for performance analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve Meta Ads data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on Meta advertising metrics and KPIs
- Focus on campaign performance, audience analysis, creative optimization, ROAS analysis
- Use appropriate aggregations for social media advertising analysis (impressions, reach, clicks, conversions, etc.)
- Consider time-based analysis for campaign trend identification
            
💡 **Example Approaches:**
- Campaign performance: "SELECT campaign_name, SUM(impressions), SUM(reach), SUM(clicks), SUM(spend), AVG(cpm) FROM project.meta_ads.campaigns GROUP BY campaign_name"
- Audience analysis: "SELECT audience_name, SUM(clicks), SUM(impressions), AVG(ctr), SUM(conversions) FROM project.meta_ads.audiences GROUP BY audience_name"
- Creative performance: "SELECT creative_name, ad_format, SUM(clicks), AVG(ctr), SUM(spend), SUM(conversions) FROM project.meta_ads.creatives GROUP BY creative_name, ad_format"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 META CAMPAIGN ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY META ADVERTISING ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Meta advertising campaign analysis.
            
📘 **Required Meta Campaign Analysis:**
- **Campaign Performance:** Which campaigns drive the best ROAS and engagement rates?
- **Audience Strategy:** What audiences perform best and offer scaling opportunities?
- **Creative Optimization:** Which ad formats and creatives drive the highest CTR and conversions?
- **Budget Allocation:** How should advertising spend be distributed across campaigns and audiences?
- **Platform Performance:** How do Facebook vs Instagram campaigns compare in performance?
            
🎯 **Specific Focus Areas:**
- CPM, CTR, CPC, and ROAS performance analysis
- Audience targeting effectiveness and lookalike performance
- Creative format performance (image, video, carousel, stories)
- Demographic and interest-based audience insights
- Campaign objective optimization (awareness, traffic, conversions)
- Frequency and reach optimization opportunities
            
⚠️ **IMPORTANT:** 
- Focus on actionable Meta advertising insights
- Provide specific recommendations for audience targeting and creative optimization
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving ROAS, reducing CPM, and increasing engagement`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 META CAMPAIGN ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE META ADVERTISING VISUALIZATION
            
Finalize with a visualization that represents Meta advertising insights and social media campaign performance.
            
🎯 **Your Task:**
Create a chart that best represents the Meta advertising insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for Meta advertising analysis (bar charts for campaign performance, pie charts for audience distribution, line charts for trends)
- Focus on key Meta Ads KPIs: ROAS, CPM, CTR, engagement rates, reach, frequency
- Use data from the SQL query in step 4
- Make sure the visualization supports your Meta advertising analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for Meta advertising visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key social media advertising metrics and performance indicators
            
🎨 **Final Touch:**
Provide final Meta advertising optimization recommendations and social media campaign strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ META CAMPAIGN ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('📘 META CAMPAIGN ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}