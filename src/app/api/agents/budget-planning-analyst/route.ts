import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📊 BUDGET PLANNING ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📊 BUDGET PLANNING ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are BudgetPlanningAnalyst AI, a specialized assistant for budget planning, financial forecasting, variance analysis, resource allocation, budget optimization, and strategic financial planning.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📊 BUDGET PLANNING ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 BUDGET PLANNING ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As BudgetPlanningAnalyst, focus on budget planning and financial forecasting aspects:
            
📊 **Analysis Focus:**
- What budget planning insights are they seeking?
- What financial forecasting or variance analysis needs examination?
- What resource allocation optimization is relevant?
- What budget metrics should be analyzed?
- Are they asking about budget vs actual, forecasting, resource planning, or cost optimization?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a budget planning and financial forecasting perspective. Explain what you understand they want and outline your strategic planning approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 BUDGET PLANNING ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for budget planning and financial forecasting analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain budget data, financial planning, or resource allocation information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain budget data, financial forecasts, or planning metrics
- Look for datasets with names like 'budget', 'planning', 'forecast', 'finance', 'expenses', 'resource_allocation'
- Explain which datasets offer the best budget planning insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 BUDGET PLANNING ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain budget or planning data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain budget allocations, financial forecasts, or resource planning data.
            
📊 **Focus:**
- Choose the dataset most relevant to budget planning from step 2
- Execute getTables with the selected datasetId
- Look for tables with budget data: budgets, forecasts, allocations, variances, departments, projects
- Identify tables that contain the budget planning data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 BUDGET PLANNING ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get budget planning and forecasting data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve budget data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on budget planning and forecasting metrics
- Focus on budget vs actual analysis, variance analysis, resource allocation, forecast accuracy
- Use appropriate aggregations for budget analysis (SUM for totals, variance calculations, etc.)
- Consider time-based analysis for budget trend identification and forecast validation
            
💡 **Example Approaches:**
- Budget vs Actual: "SELECT department, budget_amount, actual_amount, (actual_amount - budget_amount) as variance, ((actual_amount - budget_amount) / budget_amount) * 100 as variance_pct FROM project.budget.budget_actual WHERE period = '2024' ORDER BY ABS(variance) DESC"
- Department allocation: "SELECT department, SUM(budget_amount) as total_budget, COUNT(*) as line_items, (SUM(budget_amount) / (SELECT SUM(budget_amount) FROM project.budget.allocations)) * 100 as budget_share FROM project.budget.allocations GROUP BY department ORDER BY total_budget DESC"
- Monthly trends: "SELECT DATE_TRUNC(period, MONTH) as month, SUM(budget_amount), SUM(actual_amount), AVG((actual_amount / budget_amount) * 100) as accuracy FROM project.budget.monthly_data GROUP BY month ORDER BY month"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 BUDGET PLANNING ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY BUDGET PLANNING ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive budget planning analysis.
            
📊 **Required Budget Analysis:**
- **Budget Performance:** How does actual spending compare to planned budgets?
- **Variance Analysis:** What are the significant variances and their root causes?
- **Resource Allocation:** How efficiently are resources allocated across departments/projects?
- **Forecast Accuracy:** How accurate are current forecasting models and projections?
- **Budget Optimization:** What opportunities exist for better budget allocation and cost control?
            
🎯 **Specific Focus Areas:**
- Budget variance analysis by department, project, or category
- Seasonal spending patterns and budget timing optimization
- Resource allocation efficiency and reallocation opportunities
- Forecast accuracy assessment and model improvement suggestions
- Cost center performance and budget responsibility analysis
- Strategic budget recommendations for future planning cycles
            
⚠️ **IMPORTANT:** 
- Focus on actionable budget planning insights and financial optimization
- Provide specific recommendations for budget allocation and variance management
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving forecast accuracy, reducing variances, and optimizing resource allocation`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 BUDGET PLANNING ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE BUDGET PLANNING VISUALIZATION
            
Finalize with a visualization that represents budget insights and planning optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the budget planning insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for budget analysis (waterfall charts for variances, bar charts for allocations, line charts for trends)
- Focus on key budget KPIs: budget vs actual, variances, allocation percentages, forecast accuracy
- Use data from the SQL query in step 4
- Make sure the visualization supports your budget analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for budget visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key budget metrics and planning indicators
            
🎨 **Final Touch:**
Provide final budget optimization recommendations and financial planning strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ BUDGET PLANNING ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('📊 BUDGET PLANNING ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}