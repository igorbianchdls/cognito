import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛍️ SHOPIFY ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛍️ SHOPIFY ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are ShopifyAnalyst AI, a specialized assistant for analyzing Shopify store data, sales performance, customer behavior, inventory management, and e-commerce optimization.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🛍️ SHOPIFY ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 SHOPIFY ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As ShopifyAnalyst, focus on e-commerce and Shopify store aspects:
            
🛍️ **Analysis Focus:**
- What e-commerce insights are they seeking?
- What sales performance metrics need analysis?
- What customer behavior patterns should be examined?
- What inventory or product optimization is relevant?
- Are they asking about revenue, conversion rates, customer retention, or product performance?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a Shopify e-commerce perspective. Explain what you understand they want and outline your store optimization approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 SHOPIFY ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for Shopify e-commerce analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain Shopify store data or e-commerce information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain Shopify data, sales, orders, customers, or product data
- Look for datasets with names like 'shopify', 'ecommerce', 'sales', 'orders', 'customers', 'products'
- Explain which datasets offer the best e-commerce insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 SHOPIFY ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain Shopify store data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain e-commerce data: orders, customers, products, inventory.
            
📊 **Focus:**
- Choose the dataset most relevant to Shopify e-commerce from step 2
- Execute getTables with the selected datasetId
- Look for tables with Shopify data: orders, customers, products, line_items, inventory
- Identify tables that contain the e-commerce data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 SHOPIFY ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get Shopify store data for e-commerce analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve Shopify data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on e-commerce metrics and KPIs
- Focus on sales performance, customer analysis, product performance, or inventory insights
- Use appropriate aggregations for e-commerce analysis (revenue, orders, customers, etc.)
- Consider time-based analysis for sales trend identification
            
💡 **Example Approaches:**
- Sales performance: "SELECT DATE(created_at) as date, SUM(total_price), COUNT(*) as orders FROM project.shopify.orders GROUP BY date ORDER BY date"
- Customer analysis: "SELECT customer_id, COUNT(*) as orders, SUM(total_price) as total_spent FROM project.shopify.orders GROUP BY customer_id ORDER BY total_spent DESC"
- Product performance: "SELECT product_title, SUM(quantity), SUM(price * quantity) as revenue FROM project.shopify.line_items GROUP BY product_title ORDER BY revenue DESC"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 SHOPIFY ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY E-COMMERCE ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive Shopify store analysis.
            
🛍️ **Required E-commerce Analysis:**
- **Sales Performance:** What are the revenue trends and seasonal patterns?
- **Customer Insights:** Who are the top customers and what's the retention rate?
- **Product Performance:** Which products drive the most revenue and profit?
- **Conversion Optimization:** What opportunities exist to improve conversion rates?
- **Inventory Management:** What inventory insights can optimize stock levels?
            
🎯 **Specific Focus Areas:**
- Revenue growth and sales trend analysis
- Customer lifetime value and segmentation
- Product performance and bestseller identification
- Average order value and purchase frequency
- Seasonal patterns and promotional effectiveness
- Cart abandonment and conversion funnel analysis
            
⚠️ **IMPORTANT:** 
- Focus on actionable e-commerce insights
- Provide specific recommendations for store optimization and revenue growth
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving sales, customer retention, and profitability`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 SHOPIFY ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE E-COMMERCE VISUALIZATION
            
Finalize with a visualization that represents Shopify store insights and e-commerce performance.
            
🎯 **Your Task:**
Create a chart that best represents the e-commerce insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for e-commerce analysis (line charts for sales trends, bar charts for product performance, pie charts for customer segments)
- Focus on key e-commerce KPIs: revenue, orders, conversion rates, customer metrics, product performance
- Use data from the SQL query in step 4
- Make sure the visualization supports your e-commerce analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for e-commerce visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key e-commerce metrics and performance indicators
            
🎨 **Final Touch:**
Provide final Shopify store optimization recommendations and e-commerce growth strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ SHOPIFY ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('🛍️ SHOPIFY ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}