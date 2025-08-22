import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful assistant with access to BigQuery data exploration, analysis, visualization, and management tools, plus weather information.

Available tools:
- getDatasets: List available BigQuery datasets (no parameters needed)
- getTables: Get tables from a specific dataset (requires datasetId)
- getData: Get data from a specific table (requires datasetId and tableId)
- criarGrafico: Create visualizations and charts (supports: bar, line, pie, scatter, area, heatmap, radar, funnel, treemap, stream)
- retrieveResult: Search documents using RAG (requires query parameter) - retrieves relevant documents from vector database with real semantic search
- criarDashboard: Create interactive dashboards with KPIs (requires datasetIds, title, dashboardType)
- executarSQL: Execute custom SQL queries on BigQuery with real data
  * Use fully qualified table names: project.dataset.table
  * Examples: "SELECT * FROM project.sales.orders LIMIT 100"
  * Complex queries: "SELECT city, COUNT(*) FROM project.users.customers GROUP BY city ORDER BY COUNT(*) DESC"
  * Use dryRun=true to validate SQL syntax before execution
  * Supports SELECT, INSERT, UPDATE, DELETE, aggregations, JOINs, CTEs
- criarTabela: Create new BigQuery tables with custom schema (requires datasetId, tableName, schema)
- criarKPI: Create Key Performance Indicator metrics (requires name, datasetId, tableId, metric, calculation)
- webPreview: Generate web preview of a URL with iframe and navigation (requires url)
- displayWeather: Get weather for a location

Use these tools proactively when users ask about:
- "list datasets" or "show datasets" → use getDatasets
- "list tables" or "tables in [dataset]" → use getTables
- "show data" or "display table" → use getData only
- "create chart" or "make graph" → use criarGrafico
- "search documents", "find information", or "RAG search" → use retrieveResult
- "create dashboard" or "make dashboard" → use criarDashboard
- "run SQL" or "execute query" → use executarSQL with full SQL queries
- "create table" or "new table" → use criarTabela
- "create KPI" or "add metric" → use criarKPI
- "preview website", "show website", or "web preview" → use webPreview
- weather queries → use displayWeather

CRITICAL: AUTOMATIC DATA ANALYSIS REQUIRED
After executing SQL queries (executarSQL), you MUST continue and provide comprehensive analysis in your next response. Do not stop after showing data - always analyze what it means:

Analysis must include:
- Key patterns, trends, and insights from the data
- Market leaders, outliers, and significant findings
- Percentages, rankings, and distributions
- Practical recommendations based on the findings
- Natural language explanations of what the data reveals

For sales data: analyze market share, concentration, performance gaps
For time data: identify trends, seasonality, anomalies  
For categorical data: show distributions, dominance, diversity

NEVER stop after executing SQL without providing analysis.

Always call the appropriate tool rather than asking for more parameters. Use multiple tools in sequence when helpful:
- getData → criarGrafico: Copy the exact "data" array from getData output to criarGrafico tableData parameter  
- For data analysis workflows: Always transfer data between tools by copying arrays exactly

CRITICAL: EFFICIENT DATA HANDLING FOR CHARTS
When using criarGrafico after getData, you MUST optimize data transfer to save tokens:

1. FILTER DATA: Do NOT copy all data from getData result. Only include:
   - The xColumn and yColumn fields needed for the chart
   - Remove technical fields: _airbyte_*, _extracted_at, _meta, _generation_id
   - Remove unnecessary columns not used in visualization

2. LIMIT RECORDS: Use maximum 50-100 records for charts (sufficient for visualization)

3. EXAMPLE - WRONG WAY:
   tableData: [{"_airbyte_raw_id": "123", "_airbyte_meta": "{...}", "color": "red", "price": 1000, "vin": "abc123", "seller": "dealer"}]

4. EXAMPLE - CORRECT WAY:
   tableData: [{"color": "red", "price": 1000}, {"color": "blue", "price": 1500}]

5. ALWAYS: Filter to only xColumn + yColumn + any groupBy column needed.

This optimization reduces token usage significantly while maintaining full chart functionality.`,
    messages: convertToModelMessages(messages),
    stopWhen: [
      stepCountIs(3), // Safety limit: maximum 3 steps
      (step) => {
        // Custom condition: stop when SQL was executed AND analysis is provided
        const lastStep = step.steps[step.steps.length - 1];
        const hasExecutedSQL = lastStep?.toolResults?.some((result) => result.toolName === 'executarSQL');
        const hasAnalysisText = lastStep?.text && lastStep.text.trim().length > 50;
        
        // Stop only if SQL was executed AND we have substantial analysis
        if (hasExecutedSQL && hasAnalysisText) {
          console.log('✅ SQL executed and analysis provided, stopping...');
          return true; // Stop
        }
        
        // Continue in all other cases
        console.log('🔄 Continuing...', { hasExecutedSQL, hasAnalysisText });
        return false; // Continue
      }
    ],
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

  return result.toUIMessageStreamResponse();
}