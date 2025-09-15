import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as analyticsTools from '@/tools/apps/analytics';
import * as visualizationTools from '@/tools/apps/visualization';
import * as utilitiesTools from '@/tools/utilities';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    
    // Sistema inicial básico
    system: `You are a helpful assistant with access to BigQuery data exploration, analysis, visualization, and management tools, plus weather information.`,
    
    messages: convertToModelMessages(messages),
    
    // Enable Claude reasoning/thinking
    providerOptions: {
      anthropic: {
        thinking: { 
          type: 'enabled', 
          budgetTokens: 12000 
        }
      }
    },
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`📊 NEXUS PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 NEXUS STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. Understand their intent and needs:
            
🔍 **Analysis Focus:**
- What type of data are they looking for?
- What kind of analysis do they want?
- What insights might be valuable?
- What visualization would be most helpful?
- Are they asking for trends, comparisons, distributions?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request. Explain what you understand they want and outline your approach to help them.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 NEXUS STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis of the user's request, now explore what datasets are available.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Look for datasets that might be relevant to the user's needs.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets that could contain relevant data
- Explain which datasets seem most promising for the user's request`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 NEXUS STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the tables within the most relevant dataset from your previous exploration.
            
🎯 **Your Task:**
Use getTables to explore tables in the dataset that seems most relevant to the user's request.
            
📊 **Focus:**
- Choose the most appropriate dataset from step 2
- Execute getTables with the selected datasetId
- Identify tables that contain the data the user needs
- Explain your table selection reasoning`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 NEXUS STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to get the specific data the user needs.
            
🎯 **Your Task:**
Use executarSQL to retrieve data based on your exploration in previous steps.
            
📊 **Guidelines:**
- Create appropriate SQL query based on previous dataset/table exploration
- Use fully qualified table names: project.dataset.table
- Focus on getting data relevant to the user's original request
- Consider using LIMIT for performance if getting sample data
- Make sure the query addresses the user's specific needs
            
💡 **Examples:**
- "SELECT * FROM project.sales.orders LIMIT 100"
- "SELECT city, COUNT(*) FROM project.users.customers GROUP BY city ORDER BY COUNT(*) DESC"`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 NEXUS STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY DATA ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive analysis.
            
📊 **Required Analysis:**
- **Key Patterns & Trends:** What patterns do you see in the data?
- **Market Leaders & Outliers:** Who/what stands out? Any anomalies?
- **Percentages & Rankings:** Provide quantitative insights and distributions
- **Practical Recommendations:** What actionable insights can you provide?
- **Natural Language Explanations:** Explain what the data reveals in plain terms
            
🎯 **Specific Focus Areas:**
- For sales data: analyze market share, concentration, performance gaps
- For time data: identify trends, seasonality, anomalies  
- For categorical data: show distributions, dominance, diversity
            
⚠️ **IMPORTANT:** 
- NEVER stop after showing data without analysis
- Do NOT execute more tools - focus only on analyzing existing data
- Provide detailed insights the user can act upon`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 NEXUS STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE VISUALIZATION
            
Finalize with an appropriate visualization using criarGrafico.
            
🎯 **Your Task:**
Create a chart that best represents the data and insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose appropriate chart type (bar, line, pie, scatter, area, etc.)
- Use data from the SQL query in step 4
- Make sure the visualization supports your analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns:
   - xColumn and yColumn fields needed for the chart
   - Remove technical fields: _airbyte_*, _extracted_at, _meta, _generation_id
   - Remove unnecessary columns not used in visualization
            
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
            
3. **EXAMPLE - CORRECT WAY:**
   tableData: [{"category": "A", "value": 1000}, {"category": "B", "value": 1500}]
            
4. **Filter to only:** xColumn + yColumn + any groupBy column needed
            
🎨 **Final Touch:**
Provide final recommendations and conclusions based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ NEXUS STEP ${stepNumber}: Configuração padrão`);
          return {};
      }
    },
    
    // StopWhen simples - máximo 6 steps
    stopWhen: stepCountIs(6),
    tools: {
      // BigQuery tools
      ...bigqueryTools,
      // Analytics tools
      ...analyticsTools,
      // Visualization tools
      ...visualizationTools,
      // Utilities tools
      ...utilitiesTools,
    },
  });

  return result.toUIMessageStreamResponse();
}