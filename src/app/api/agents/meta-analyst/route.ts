import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🔍 METAANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🔍 METAANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: 'deepseek/deepseek-v3.1',
    
    // Sistema inicial básico
    system: `You are MetaAnalyst AI, a specialized assistant for analyzing metadata, data structures, and providing insights about data organization and patterns.`,
    
    messages: convertToModelMessages(messages),
    
    // PrepareStep: Define comportamento para cada um dos 6 steps
    prepareStep: ({ stepNumber, steps }) => {
      console.log(`🔍 METAANALYST PREPARE STEP ${stepNumber}: Configurando comportamento`);
      
      switch (stepNumber) {
        case 1:
          console.log('🎯 METAANALYST STEP 1: Configurando para análise da pergunta');
          return {
            system: `STEP 1/6: ANALYZE USER REQUEST
            
Carefully analyze what the user is asking for. As MetaAnalyst, focus on metadata and data structure aspects:
            
🔍 **Analysis Focus:**
- What metadata insights are they seeking?
- What data structures need to be examined?
- What patterns in data organization do they want to understand?
- What schema analysis would be helpful?
- Are they asking about data quality, relationships, or structural patterns?
            
📝 **Your Task:**
Provide a thoughtful analysis of the user's request from a metadata perspective. Explain what you understand they want and outline your approach.
            
⚠️ **IMPORTANT:** Do NOT use any tools yet. Focus only on understanding and planning.`,
            tools: {} // Remove todas as tools - só análise textual
          };
          
        case 2:
          console.log('🎯 METAANALYST STEP 2: Configurando para exploração de datasets');
          return {
            system: `STEP 2/6: EXPLORE AVAILABLE DATASETS
            
Based on your analysis, now explore what datasets are available for metadata analysis.
            
🎯 **Your Task:**
Use getDatasets to discover available BigQuery datasets. Focus on datasets that might reveal interesting metadata patterns.
            
📊 **Focus:**
- Execute getDatasets (no parameters needed)
- Identify datasets with rich metadata potential
- Look for datasets with diverse table structures
- Explain which datasets offer the best metadata insights`,
            tools: {
              getDatasets: bigqueryTools.getDatasets
            }
          };
          
        case 3:
          console.log('🎯 METAANALYST STEP 3: Configurando para exploração de tabelas');
          return {
            system: `STEP 3/6: EXPLORE TABLES IN CHOSEN DATASET
            
Now explore the table structures and metadata within the most relevant dataset.
            
🎯 **Your Task:**
Use getTables to explore tables and their metadata in the selected dataset.
            
📊 **Focus:**
- Choose the dataset with most interesting metadata from step 2
- Execute getTables with the selected datasetId
- Analyze table schemas, field types, and structural patterns
- Identify tables with complex or interesting metadata structures`,
            tools: {
              getTables: bigqueryTools.getTables
            }
          };
          
        case 4:
          console.log('🎯 METAANALYST STEP 4: Configurando para execução de SQL');
          return {
            system: `STEP 4/6: EXECUTE SQL QUERY
            
Now execute a targeted SQL query to extract data for metadata analysis.
            
🎯 **Your Task:**
Use executarSQL to retrieve data that will help analyze metadata patterns and structures.
            
📊 **Guidelines:**
- Create SQL queries that reveal data patterns and structures
- Focus on metadata-relevant queries (data distributions, schema insights)
- Use INFORMATION_SCHEMA queries when possible for metadata analysis
- Consider queries that show data quality, completeness, or structural patterns
            
💡 **Example Approaches:**
- "SELECT column_name, data_type, COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS GROUP BY column_name, data_type"
- Sample data to understand patterns: "SELECT * FROM project.dataset.table LIMIT 100"
- Analyze data distributions and quality patterns`,
            tools: {
              executarSQL: bigqueryTools.executarSQL
            }
          };
          
        case 5:
          console.log('🎯 METAANALYST STEP 5: Configurando para análise obrigatória dos dados');
          return {
            system: `STEP 5/6: MANDATORY METADATA ANALYSIS
            
CRITICAL: You executed SQL queries in the previous step. You MUST now provide comprehensive metadata analysis.
            
📊 **Required Metadata Analysis:**
- **Data Structure Patterns:** What structural patterns emerge from the data?
- **Schema Insights:** What does the schema reveal about data organization?
- **Data Quality Indicators:** What quality patterns can you identify?
- **Metadata Relationships:** How do different data elements relate?
- **Organizational Patterns:** What patterns exist in data naming, types, and structures?
            
🎯 **Specific Focus Areas:**
- Field naming conventions and consistency
- Data type distributions and appropriateness
- Missing data patterns and completeness
- Relational structure and foreign key patterns
- Data validation and constraint insights
            
⚠️ **IMPORTANT:** 
- Focus on metadata and structural insights rather than business insights
- Do NOT execute more tools - focus only on analyzing existing data
- Provide technical recommendations for data structure optimization`,
            tools: {} // Remove todas as tools - força análise textual apenas
          };
          
        case 6:
          console.log('🎯 METAANALYST STEP 6: Configurando para criação de gráfico');
          return {
            system: `STEP 6/6: CREATE METADATA VISUALIZATION
            
Finalize with a visualization that represents metadata patterns and structures.
            
🎯 **Your Task:**
Create a chart that best represents the metadata insights from previous steps.
            
📊 **Chart Guidelines:**
- Choose charts that show structural patterns (bar charts for distributions, etc.)
- Focus on metadata aspects: field types, data quality, schema patterns
- Use data from the SQL query in step 4
- Make sure the visualization supports your metadata analysis from step 5
            
⚡ **CRITICAL: EFFICIENT DATA HANDLING**
Optimize data transfer to save tokens:
            
1. **FILTER DATA:** Only include necessary columns for metadata visualization
2. **LIMIT RECORDS:** Use maximum 50-100 records for charts
3. **Focus on:** metadata-relevant aggregations and patterns
            
🎨 **Final Touch:**
Provide final metadata recommendations and structural insights based on the complete analysis and visualization.`,
            tools: {
              criarGrafico: analyticsTools.criarGrafico
            }
          };
          
        default:
          console.log(`⚠️ METAANALYST STEP ${stepNumber}: Configuração padrão`);
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
      // Utilities tools
      ...utilitiesTools,
    },
  });

  console.log('🔍 METAANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}