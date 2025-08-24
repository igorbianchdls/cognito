import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('💰 CASH FLOW ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('💰 CASH FLOW ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are CashFlowAnalyst AI, a specialized assistant for cash flow analysis, liquidity management, working capital optimization, cash forecasting, payment terms analysis, and financial health assessment.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`💰 CASH FLOW ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 CASH FLOW ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As CashFlowAnalyst, focus on cash flow and liquidity management aspects:
            
💰 **Analysis Focus:**
- What cash flow insights are they seeking?
- What liquidity management or working capital analysis needs examination?
- What cash forecasting or payment terms optimization is relevant?
- What cash flow metrics should be analyzed?
- Are they asking about cash cycles, receivables, payables, or liquidity ratios?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a cash flow and liquidity management perspective. Explain what you understand they want and outline your financial health assessment approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 CASH FLOW ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for cash flow and liquidity analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain cash flow data, payment information, or financial transactions.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain cash flow data, receivables, payables, or transaction records
- Look for datasets with names like 'cash_flow', 'payments', 'receivables', 'payables', 'transactions', 'finance'
- Explain which datasets offer the best cash flow insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 CASH FLOW ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain cash flow or payment data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain cash receipts, payments, receivables, or payables data.
            
📊 **Focus:**
- Choose the dataset most relevant to cash flow analysis from step 2
- Execute getTables with the selected datasetId
- Look for tables with cash flow data: cash_receipts, payments, receivables, payables, bank_transactions
- Identify tables that contain the cash flow data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 CASH FLOW ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get cash flow and liquidity data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve cash flow data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on cash flow and liquidity metrics
- Focus on cash receipts vs payments, working capital, payment cycles, liquidity ratios
- Use appropriate aggregations for cash flow analysis (net cash flow, cumulative totals, etc.)
- Consider time-based analysis for cash flow forecasting and trend identification
            
💡 **Example Approaches:**
- Cash flow summary: "SELECT DATE_TRUNC(date, MONTH) as month, SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END) as inflows, SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END) as outflows, SUM(CASE WHEN type = 'inflow' THEN amount ELSE -amount END) as net_cash_flow FROM project.cashflow.transactions GROUP BY month ORDER BY month"
- Receivables aging: "SELECT aging_bucket, COUNT(*) as count, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM project.finance.receivables GROUP BY aging_bucket ORDER BY aging_bucket"
- Payment terms: "SELECT payment_terms, COUNT(*) as invoices, AVG(days_to_payment) as avg_days, SUM(amount) as total_value FROM project.finance.payments GROUP BY payment_terms ORDER BY avg_days"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 CASH FLOW ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY CASH FLOW ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive cash flow analysis.
            
💰 **Required Cash Flow Analysis:**
- **Cash Flow Performance:** What are the cash inflow and outflow patterns?
- **Liquidity Assessment:** How healthy is the organization's liquidity position?
- **Working Capital Analysis:** How efficiently is working capital being managed?
- **Cash Forecasting:** What future cash flow scenarios can be projected?
- **Payment Optimization:** What opportunities exist for improving cash cycles?
            
🎯 **Specific Focus Areas:**
- Net cash flow trends and seasonal patterns
- Days sales outstanding (DSO) and collection efficiency
- Days payable outstanding (DPO) and payment optimization
- Cash conversion cycle analysis and improvement opportunities
- Liquidity ratios and cash reserve adequacy
- Late payment impact and credit risk assessment
            
⚠️ **IMPORTANT:** 
- Focus on actionable cash flow insights and liquidity improvements
- Provide specific recommendations for working capital optimization
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving cash cycles, reducing collection periods, and optimizing payment terms`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 CASH FLOW ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE CASH FLOW VISUALIZATION
            
Finalize with a visualization that represents cash flow insights and liquidity optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the cash flow insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for cash flow analysis (waterfall charts for cash flow, line charts for trends, bar charts for comparisons)
- Focus on key cash flow KPIs: net cash flow, cash cycles, receivables aging, payment patterns
- Use data from the SQL query in step 4
- Make sure the visualization supports your cash flow analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for cash flow visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key cash flow metrics and liquidity indicators
            
🎨 **Final Touch:**
Provide final cash flow optimization recommendations and liquidity management strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ CASH FLOW ANALYST STEP ${stepNumber}: Configuração padrão`);
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
      ...bigqueryTools,
      ...analyticsTools,
      ...utilitiesTools,
    },
  });

  console.log('💰 CASH FLOW ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}