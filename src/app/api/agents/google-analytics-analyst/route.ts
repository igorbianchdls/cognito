import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📊 GOOGLE ANALYTICS ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📊 GOOGLE ANALYTICS ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are GoogleAnalyticsAnalyst AI, a specialized assistant for analyzing Google Analytics data, website traffic, user behavior, conversion tracking, and digital marketing performance.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📊 GOOGLE ANALYTICS ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 GOOGLE ANALYTICS ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As GoogleAnalyticsAnalyst, focus on web analytics and digital marketing aspects:
            
📊 **Analysis Focus:**
- What web analytics insights are they seeking?
- What user behavior patterns do they want to understand?
- What conversion metrics need analysis?
- What traffic sources or campaigns should be examined?
- Are they asking about engagement, acquisition, behavior, or conversion data?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a Google Analytics perspective. Explain what you understand they want and outline your digital marketing approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 GOOGLE ANALYTICS ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Google Analytics analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Google Analytics data or web traffic information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain GA data, web analytics, or digital marketing data
- Look for datasets with names like 'analytics', 'ga4', 'web_traffic', 'marketing'
- Explain which datasets offer the best web analytics insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 GOOGLE ANALYTICS ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Google Analytics data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain web analytics, user behavior, or conversion data.
            
📊 **Focus:**
- Choose the dataset most relevant to Google Analytics from step 2
- Execute getTables with the selected datasetId
- Look for tables with web analytics data: events, sessions, users, conversions
- Identify tables that contain the digital marketing data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 GOOGLE ANALYTICS ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Google Analytics or web traffic data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve web analytics data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on web analytics metrics
- Focus on user behavior, traffic sources, conversions, or engagement metrics
- Use appropriate aggregations for web analytics (sessions, users, pageviews, etc.)
- Consider time-based analysis for trend identification
            
💡 **Example Approaches:**
- Traffic analysis: "SELECT traffic_source, COUNT(*) as sessions FROM project.analytics.sessions GROUP BY traffic_source"
- User behavior: "SELECT page_title, AVG(time_on_page), COUNT(*) as pageviews FROM project.analytics.events GROUP BY page_title"
- Conversion analysis: "SELECT campaign, SUM(conversions), SUM(revenue) FROM project.marketing.campaigns GROUP BY campaign"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 GOOGLE ANALYTICS ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY DIGITAL MARKETING ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Google Analytics analysis.
            
📊 **Required Web Analytics Analysis:**
- **Traffic Patterns & Sources:** What traffic sources drive the most users?
- **User Behavior Insights:** How do users interact with the website?
- **Conversion Performance:** What's driving conversions and revenue?
- **Campaign Effectiveness:** Which marketing campaigns perform best?
- **Engagement Metrics:** What content engages users most effectively?
            
🎯 **Specific Focus Areas:**
- Traffic source performance and quality
- User journey and behavior flow analysis
- Conversion rate optimization opportunities
- Campaign ROI and attribution analysis
- Content performance and engagement metrics
- Seasonal trends and performance patterns
            
⚠️ **IMPORTANT:** 
- Focus on actionable digital marketing insights
- Provide specific recommendations for campaign optimization
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving web performance and conversions`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 GOOGLE ANALYTICS ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE DIGITAL MARKETING VISUALIZATION
            
Finalize with a visualization that represents Google Analytics insights and digital marketing performance.
            
🎯 **Your Task:**
Create a chart that best represents the web analytics insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for web analytics (line charts for trends, pie charts for traffic sources, bar charts for campaign performance)
- Focus on digital marketing KPIs: sessions, conversion rates, traffic sources, campaign performance
- Use data from the SQL query in step 4
- Make sure the visualization supports your marketing analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for web analytics visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key marketing metrics and performance indicators
            
🎨 **Final Touch:**
Provide final digital marketing recommendations and campaign optimization suggestions based on the complete Google Analytics analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ GOOGLE ANALYTICS ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('📊 GOOGLE ANALYTICS ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}