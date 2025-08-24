import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛒 AMAZON ADS ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛒 AMAZON ADS ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are AmazonAdsAnalyst AI, a specialized assistant for analyzing Amazon Advertising campaigns, keywords performance, bid optimization, and PPC strategies.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🛒 AMAZON ADS ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 AMAZON ADS ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As AmazonAdsAnalyst, focus on Amazon advertising and PPC aspects:
            
🛒 **Analysis Focus:**
- What Amazon Ads insights are they seeking?
- What campaign performance metrics need analysis?
- What keyword optimization opportunities should be examined?
- What bid management strategies are relevant?
- Are they asking about ACOS, TACOS, campaign types, or keyword performance?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from an Amazon Advertising perspective. Explain what you understand they want and outline your PPC optimization approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 AMAZON ADS ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Amazon Ads analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Amazon advertising data or ecommerce performance information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain Amazon Ads data, campaign performance, or keyword data
- Look for datasets with names like 'amazon_ads', 'ppc', 'advertising', 'campaigns', 'sponsored_products'
- Explain which datasets offer the best Amazon advertising insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 AMAZON ADS ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Amazon Ads data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain Amazon advertising performance, campaign, or keyword data.
            
📊 **Focus:**
- Choose the dataset most relevant to Amazon advertising from step 2
- Execute getTables with the selected datasetId
- Look for tables with Amazon Ads data: campaigns, ad_groups, keywords, search_terms, products
- Identify tables that contain the PPC performance data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 AMAZON ADS ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Amazon Ads performance data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve Amazon advertising data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on Amazon Ads metrics and KPIs
- Focus on campaign performance, keyword analysis, ACOS/TACOS optimization
- Use appropriate aggregations for PPC analysis (spend, sales, impressions, clicks, etc.)
- Consider time-based analysis for campaign trend identification
            
💡 **Example Approaches:**
- Campaign performance: "SELECT campaign_name, SUM(spend), SUM(sales), AVG(acos) FROM project.amazon_ads.campaigns GROUP BY campaign_name"
- Keyword analysis: "SELECT keyword, SUM(clicks), SUM(impressions), AVG(cpc), AVG(conversion_rate) FROM project.amazon_ads.keywords GROUP BY keyword"
- Product performance: "SELECT asin, product_title, SUM(sales), SUM(spend), AVG(acos) FROM project.amazon_ads.products GROUP BY asin, product_title"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 AMAZON ADS ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY AMAZON ADS ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Amazon Advertising analysis.
            
🛒 **Required Amazon Ads Analysis:**
- **Campaign Performance:** Which campaigns drive the best ACOS and profitability?
- **Keyword Strategy:** What keywords perform best and offer optimization opportunities?
- **Bid Optimization:** What bid adjustments would improve campaign performance?
- **Budget Allocation:** How should advertising spend be redistributed for better ROI?
- **Product Performance:** Which ASINs/products have the best advertising efficiency?
            
🎯 **Specific Focus Areas:**
- ACOS and TACOS performance analysis
- High-performing vs underperforming keywords
- Campaign type effectiveness (Sponsored Products, Brands, Display)
- Search term analysis and negative keyword opportunities
- Conversion rate and click-through rate optimization
- Seasonal performance and trend analysis
            
⚠️ **IMPORTANT:** 
- Focus on actionable Amazon advertising insights
- Provide specific recommendations for campaign optimization and bid management
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving ACOS, increasing sales, and optimizing spend`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 AMAZON ADS ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE AMAZON ADS VISUALIZATION
            
Finalize with a visualization that represents Amazon Ads insights and campaign performance.
            
🎯 **Your Task:**
Create a chart that best represents the Amazon advertising insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for Amazon Ads analysis (bar charts for campaign performance, scatter plots for ACOS vs Sales, line charts for trends)
- Focus on key Amazon Ads KPIs: ACOS, TACOS, spend, sales, impressions, clicks, conversion rates
- Use data from the SQL query in step 4
- Make sure the visualization supports your Amazon advertising analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for Amazon Ads visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key PPC metrics and performance indicators
            
🎨 **Final Touch:**
Provide final Amazon Ads optimization recommendations and campaign management suggestions based on the complete advertising analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ AMAZON ADS ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('🛒 AMAZON ADS ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}