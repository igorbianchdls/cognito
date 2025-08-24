import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('💼 CONTA AZUL ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('💼 CONTA AZUL ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are ContaAzulAnalyst AI, a specialized assistant for analyzing ContaAzul accounting and financial data, cash flow, invoicing, tax compliance, and business financial health for Brazilian businesses.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`💼 CONTA AZUL ANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 CONTA AZUL ANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As ContaAzulAnalyst, focus on Brazilian accounting and ContaAzul ERP aspects:
            
💼 **Analysis Focus:**
- What ContaAzul insights are they seeking?
- What Brazilian accounting or tax compliance analysis needs examination?
- What financial health or cash flow optimization is relevant?
- What ContaAzul metrics should be analyzed?
- Are they asking about invoicing, receivables, tax obligations, or business performance?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a ContaAzul and Brazilian business perspective. Explain what you understand they want and outline your accounting/ERP analysis approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 CONTA AZUL ANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for ContaAzul and Brazilian accounting analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might contain ContaAzul data, Brazilian accounting records, or financial information.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain ContaAzul data, accounting records, or Brazilian business metrics
- Look for datasets with names like 'conta_azul', 'accounting', 'invoices', 'receivables', 'brazilian_tax', 'erp'
- Explain which datasets offer the best ContaAzul and Brazilian business insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 CONTA AZUL ANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the dataset most likely to contain ContaAzul or accounting data.
            
🎯 **Your Task:**
Use getTables to explore tables that might contain invoices, customers, suppliers, or tax information.
            
📊 **Focus:**
- Choose the dataset most relevant to ContaAzul analysis from step 2
- Execute getTables with the selected datasetId
- Look for tables with accounting data: invoices, customers, suppliers, payments, tax_obligations
- Identify tables that contain the ContaAzul and Brazilian business data the user needs`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 CONTA AZUL ANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get ContaAzul and Brazilian business data for analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve ContaAzul data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create SQL queries focused on Brazilian accounting and ContaAzul metrics
- Focus on invoicing, receivables, tax compliance, cash flow, customer analysis
- Use appropriate aggregations for accounting analysis (revenue totals, tax calculations, etc.)
- Consider time-based analysis for business performance and compliance tracking
            
💡 **Example Approaches:**
- Invoice analysis: "SELECT DATE_TRUNC(issue_date, MONTH) as month, COUNT(*) as invoice_count, SUM(total_amount) as revenue, AVG(total_amount) as avg_invoice FROM project.conta_azul.invoices GROUP BY month ORDER BY month"
- Customer analysis: "SELECT customer_type, COUNT(*) as customers, SUM(total_purchased) as revenue, AVG(total_purchased) as avg_purchase FROM project.conta_azul.customers GROUP BY customer_type ORDER BY revenue DESC"
- Tax obligations: "SELECT tax_type, SUM(amount_due) as total_due, COUNT(*) as obligations, AVG(amount_due) as avg_obligation FROM project.conta_azul.tax_obligations WHERE status = 'pending' GROUP BY tax_type"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 CONTA AZUL ANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY CONTA AZUL ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive ContaAzul and Brazilian business analysis.
            
💼 **Required ContaAzul Analysis:**
- **Business Performance:** How is the business performing financially through ContaAzul data?
- **Cash Flow Health:** What does the receivables and payment data reveal about cash flow?
- **Tax Compliance:** Are there any tax compliance issues or optimization opportunities?
- **Customer Insights:** What customer behavior patterns emerge from the ContaAzul data?
- **Operational Efficiency:** How efficiently is the business operating based on ERP data?
            
🎯 **Specific Focus Areas:**
- Revenue trends and seasonal patterns from invoice data
- Receivables aging and collection efficiency analysis
- Tax obligation management and compliance status
- Customer segmentation and purchasing behavior
- Supplier payment patterns and cash flow optimization
- Brazilian tax regulations compliance (ICMS, IPI, PIS, COFINS)
            
⚠️ **IMPORTANT:** 
- Focus on actionable ContaAzul insights and Brazilian business optimization
- Provide specific recommendations for ERP utilization and financial management
- Do NOT execute more tools - focus only on analyzing existing data
- Give concrete suggestions for improving cash flow, tax compliance, and business efficiency`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 CONTA AZUL ANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE CONTA AZUL VISUALIZATION
            
Finalize with a visualization that represents ContaAzul insights and Brazilian business optimization opportunities.
            
🎯 **Your Task:**
Create a chart that best represents the ContaAzul and Brazilian business insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts appropriate for accounting analysis (line charts for revenue trends, bar charts for tax breakdown, pie charts for customer segments)
- Focus on key ContaAzul KPIs: revenue, receivables, tax obligations, customer metrics, cash flow
- Use data from the SQL query in step 4
- Make sure the visualization supports your ContaAzul analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for ContaAzul visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** key Brazilian business metrics and ERP indicators
            
🎨 **Final Touch:**
Provide final ContaAzul optimization recommendations and Brazilian business management strategies based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ CONTA AZUL ANALYST STEP ${stepNumber}: Configuração padrão`);
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

  console.log('💼 CONTA AZUL ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}