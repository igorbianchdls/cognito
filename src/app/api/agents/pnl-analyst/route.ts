import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📈 P&L ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📈 P&L ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are P&LAnalyst AI, a specialized assistant for Profit & Loss statement analysis, revenue analysis, cost structure optimization, margin analysis, profitability assessment, and financial performance evaluation.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📈 P&L ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 P&L ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As P&LAnalyst, focus on financial performance and profitability aspects:
            
📈 **Analysis Focus:**
- What P&L or financial performance insights are they seeking?
- What revenue or cost analysis needs examination?
- What profitability metrics should be analyzed?
- What margin optimization is relevant?
- Are they asking about gross margin, operating margin, net profit, cost structure, or revenue trends?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a P&L and financial performance perspective. Explain what you understand they want and outline your financial analysis approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 P&L ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for P&L and financial analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain financial data, revenue, costs, or P&L information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain financial data, revenue, expenses, or profit metrics
- Look for datasets with names like 'finance', 'accounting', 'pnl', 'revenue', 'expenses', 'financial_data'
- Explain which datasets offer the best P&L and financial insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 P&L ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain P&L or financial data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain revenue, expenses, profit, or financial performance data.
            
📊 **Focus:**
- Choose the dataset most relevant to P&L analysis from step 2
- Execute getTables with the selected datasetId
- Look for tables with financial data: revenue, expenses, costs, profit_loss, financial_statements, income_statement
- Identify tables that contain the P&L and financial data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 P&L ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get P&L and financial data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve financial data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on P&L and financial performance metrics
- Focus on revenue analysis, cost structure, margin calculations, profitability trends
- Use appropriate aggregations for financial analysis (SUM for totals, AVG for margins, etc.)
- Consider time-based analysis for financial trend identification and period comparisons
            
💡 **Example Approaches:**
- Revenue analysis: "SELECT DATE_TRUNC(date, MONTH) as month, SUM(revenue), COUNT(*) as transactions, AVG(revenue) as avg_revenue FROM project.finance.revenue GROUP BY month ORDER BY month"
- Cost structure: "SELECT cost_category, SUM(amount), (SUM(amount) / (SELECT SUM(amount) FROM project.finance.expenses)) * 100 as percentage FROM project.finance.expenses GROUP BY cost_category ORDER BY SUM(amount) DESC"
- P&L summary: "SELECT period, SUM(revenue) as total_revenue, SUM(costs) as total_costs, (SUM(revenue) - SUM(costs)) as net_profit, ((SUM(revenue) - SUM(costs)) / SUM(revenue)) * 100 as profit_margin FROM project.finance.pnl GROUP BY period ORDER BY period"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 P&L ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY P&L FINANCIAL ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive P&L and financial analysis.
            
📈 **Required Financial Analysis:**
- **Revenue Performance:** What are the revenue trends and growth patterns?
- **Cost Structure Analysis:** Where are the major cost centers and optimization opportunities?
- **Margin Analysis:** What are the gross, operating, and net profit margins?
- **Profitability Assessment:** Which areas drive profitability vs drain resources?
- **Financial Efficiency:** What operational efficiencies can improve financial performance?
            
🎯 **Specific Focus Areas:**
- Revenue growth trends and seasonal patterns
- Cost category analysis and expense optimization opportunities
- Gross margin analysis by product, service, or segment
- Operating leverage and fixed vs variable cost analysis
- Break-even analysis and contribution margin insights
- Cash flow implications and working capital efficiency
            
⚠️ **IMPORTANT:** 
- Focus on actionable financial insights and profitability improvements
- Provide specific recommendations for cost optimization and revenue enhancement
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving margins, reducing costs, and increasing profitability`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 P&L ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE P&L FINANCIAL VISUALIZATION
            
Finalize with a visualization that represents P&L insights and financial performance optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the P&L and financial insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for financial analysis (waterfall charts for P&L, line charts for trends, pie charts for cost breakdown)
- Focus on key financial KPIs: revenue, costs, margins, profit, ROI, growth rates
- Use data from the SQL query in step 4
- Make sure the visualization supports your financial analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for financial visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key financial metrics and performance indicators
            
🎨 **Final Touch:**
Provide final P&L optimization recommendations and financial strategy suggestions based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ P&L ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('📈 P&L ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}