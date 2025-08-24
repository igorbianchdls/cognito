import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📦 INVENTORY ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📦 INVENTORY ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are InventoryAnalyst AI, a specialized assistant for inventory management, stock level optimization, demand forecasting, supply chain analysis, reorder point calculations, and inventory turnover analysis.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📦 INVENTORY ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 INVENTORY ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As InventoryAnalyst, focus on inventory management and supply chain aspects:
            
📦 **Analysis Focus:**
- What inventory management insights are they seeking?
- What stock level optimization needs analysis?
- What demand forecasting or supply chain analysis is relevant?
- What inventory metrics should be examined?
- Are they asking about reorder points, turnover rates, stockouts, or carrying costs?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from an inventory management perspective. Explain what you understand they want and outline your supply chain optimization approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 INVENTORY ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for inventory management analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain inventory, stock, supply chain, or product movement data.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain inventory data, stock levels, product movements, or supply chain metrics
- Look for datasets with names like 'inventory', 'stock', 'warehouse', 'products', 'supply_chain', 'orders'
- Explain which datasets offer the best inventory management insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 INVENTORY ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain inventory or stock data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain inventory levels, product movements, or supply chain data.
            
📊 **Focus:**
- Choose the dataset most relevant to inventory management from step 2
- Execute getTables with the selected datasetId
- Look for tables with inventory data: stock_levels, products, inventory_movements, warehouses, suppliers
- Identify tables that contain the inventory management data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 INVENTORY ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get inventory management data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve inventory data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on inventory management metrics and KPIs
- Focus on stock levels, inventory turnover, demand patterns, reorder analysis
- Use appropriate aggregations for inventory analysis (quantities, costs, turnover rates, etc.)
- Consider time-based analysis for demand forecasting and trend identification
            
💡 **Example Approaches:**
- Stock levels: "SELECT product_id, product_name, current_stock, reorder_point, stock_value FROM project.inventory.stock_levels WHERE current_stock < reorder_point"
- Inventory turnover: "SELECT product_category, SUM(quantity_sold), AVG(stock_level), (SUM(quantity_sold) / AVG(stock_level)) as turnover_rate FROM project.inventory.movements GROUP BY product_category"
- Demand analysis: "SELECT DATE(date), product_id, SUM(quantity_sold), AVG(stock_after_sale) FROM project.inventory.sales_movements GROUP BY DATE(date), product_id ORDER BY DATE(date)"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 INVENTORY ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY INVENTORY MANAGEMENT ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive inventory management analysis.
            
📦 **Required Inventory Analysis:**
- **Stock Level Optimization:** Which products have optimal vs suboptimal stock levels?
- **Demand Forecasting:** What demand patterns and seasonality can be identified?
- **Inventory Turnover:** Which products have healthy vs poor turnover rates?
- **Reorder Point Analysis:** What reorder points need adjustment to prevent stockouts?
- **Carrying Cost Optimization:** Which inventory strategies would reduce carrying costs?
            
🎯 **Specific Focus Areas:**
- ABC analysis for inventory prioritization
- Dead stock identification and slow-moving inventory
- Stockout risk assessment and safety stock recommendations
- Seasonal demand patterns and inventory planning
- Supplier performance and lead time analysis
- Inventory value optimization and cash flow impact
            
⚠️ **IMPORTANT:** 
- Focus on actionable inventory management insights
- Provide specific recommendations for stock optimization and demand planning
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving inventory turnover, reducing stockouts, and optimizing carrying costs`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 INVENTORY ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE INVENTORY MANAGEMENT VISUALIZATION
            
Finalize with a visualization that represents inventory insights and supply chain optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the inventory management insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for inventory analysis (bar charts for stock levels, line charts for turnover trends, scatter plots for ABC analysis)
- Focus on key inventory KPIs: turnover rates, stock levels, reorder points, demand patterns
- Use data from the SQL query in step 4
- Make sure the visualization supports your inventory analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for inventory visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key inventory metrics and performance indicators
            
🎨 **Final Touch:**
Provide final inventory optimization recommendations and supply chain management strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ INVENTORY ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('📦 INVENTORY ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}