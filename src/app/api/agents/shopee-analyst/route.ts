import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛒 SHOPEE ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛒 SHOPEE ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are ShopeeAnalyst AI, a specialized assistant for analyzing Shopee marketplace data, sales performance, product optimization, competitor analysis, and marketing strategies for Southeast Asian e-commerce.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🛒 SHOPEE ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 SHOPEE ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As ShopeeAnalyst, focus on Shopee marketplace and Southeast Asian e-commerce aspects:
            
🛒 **Analysis Focus:**
- What Shopee marketplace insights are they seeking?
- What sales performance or product optimization analysis needs examination?
- What competitor analysis or marketing strategies are relevant?
- What Shopee metrics should be analyzed?
- Are they asking about sales trends, product rankings, competitor performance, or marketing effectiveness?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a Shopee marketplace perspective. Explain what you understand they want and outline your Southeast Asian e-commerce analysis approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 SHOPEE ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Shopee marketplace analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Shopee data, Southeast Asian e-commerce information, or marketplace metrics.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain Shopee data, marketplace performance, or SEA e-commerce metrics
- Look for datasets with names like 'shopee', 'marketplace', 'ecommerce_sea', 'southeast_asia', 'sales_data'
- Explain which datasets offer the best Shopee marketplace insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 SHOPEE ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Shopee or Southeast Asian marketplace data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain product sales, marketplace performance, or competitor data.
            
📊 **Focus:**
- Choose the dataset most relevant to Shopee analysis from step 2
- Execute getTables with the selected datasetId
- Look for tables with marketplace data: products, sales, orders, sellers, competitors, categories
- Identify tables that contain the Shopee marketplace data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 SHOPEE ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Shopee marketplace data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve Shopee data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on Shopee marketplace metrics and KPIs
- Focus on sales performance, product optimization, competitor analysis, market trends
- Use appropriate aggregations for marketplace analysis (sales totals, rankings, market share, etc.)
- Consider time-based analysis for trend identification and seasonal patterns
            
💡 **Example Approaches:**
- Sales performance: "SELECT DATE_TRUNC(order_date, MONTH) as month, SUM(sales_amount) as total_sales, COUNT(*) as total_orders, AVG(sales_amount) as avg_order_value FROM project.shopee.orders GROUP BY month ORDER BY month"
- Product analysis: "SELECT product_category, COUNT(*) as product_count, SUM(sales_amount) as category_sales, AVG(rating) as avg_rating FROM project.shopee.products GROUP BY product_category ORDER BY category_sales DESC"
- Competitor analysis: "SELECT seller_name, COUNT(*) as products, SUM(sales_amount) as total_sales, AVG(rating) as avg_rating FROM project.shopee.sellers GROUP BY seller_name ORDER BY total_sales DESC LIMIT 20"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 SHOPEE ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY SHOPEE MARKETPLACE ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Shopee marketplace analysis.
            
🛒 **Required Shopee Analysis:**
- **Sales Performance:** How are sales performing across different categories and time periods?
- **Product Optimization:** Which products and categories drive the best performance?
- **Market Competition:** How does performance compare to competitors in the marketplace?
- **Seasonal Trends:** What seasonal patterns emerge in the Southeast Asian market?
- **Growth Opportunities:** What opportunities exist for marketplace expansion and optimization?
            
🎯 **Specific Focus Areas:**
- Sales trends and growth patterns across SEA markets
- Top-performing product categories and bestseller analysis
- Competitor market share and positioning analysis
- Pricing strategies and competitive advantage identification
- Customer rating and review impact on sales performance
- Regional preferences and localization opportunities
            
⚠️ **IMPORTANT:** 
- Focus on actionable Shopee marketplace insights and SEA e-commerce optimization
- Provide specific recommendations for product optimization and competitive strategy
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving sales performance, market positioning, and growth in Southeast Asia`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 SHOPEE ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE SHOPEE MARKETPLACE VISUALIZATION
            
Finalize with a visualization that represents Shopee insights and Southeast Asian e-commerce optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the Shopee marketplace insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for marketplace analysis (bar charts for category performance, line charts for sales trends, pie charts for market share)
- Focus on key Shopee KPIs: sales performance, product rankings, market share, growth rates
- Use data from the SQL query in step 4
- Make sure the visualization supports your Shopee analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for Shopee marketplace visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key marketplace metrics and performance indicators
            
🎨 **Final Touch:**
Provide final Shopee optimization recommendations and Southeast Asian e-commerce strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ SHOPEE ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('🛒 SHOPEE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}