import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';
import { agentsetService } from '@/services/agentset';

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
- interpretarDados: Analyze and interpret data with insights and recommendations (requires datasetId, tableId)
- criarGrafico: Create visualizations and charts (supports: bar, line, pie, scatter, area, heatmap, radar, funnel, treemap, stream)
- retrieveResult: Search documents using RAG (requires query parameter) - retrieves relevant documents from vector database with real semantic search
- criarDashboard: Create interactive dashboards with KPIs (requires datasetIds, title, dashboardType)
- executarSQL: Execute custom SQL queries with validation (requires sqlQuery, optional datasetId, dryRun)
- criarTabela: Create new BigQuery tables with custom schema (requires datasetId, tableName, schema)
- criarKPI: Create Key Performance Indicator metrics (requires name, datasetId, tableId, metric, calculation)
- webPreview: Generate web preview of a URL with iframe and navigation (requires url)
- displayWeather: Get weather for a location

Use these tools proactively when users ask about:
- "list datasets" or "show datasets" → use getDatasets
- "list tables" or "tables in [dataset]" → use getTables
- "show data" or "data from [table]" → use getData
- "analyze data" or "interpret data" → use interpretarDados
- "create chart" or "make graph" → use criarGrafico
- "search documents", "find information", or "RAG search" → use retrieveResult
- "create dashboard" or "make dashboard" → use criarDashboard
- "run SQL" or "execute query" → use executarSQL
- "create table" or "new table" → use criarTabela
- "create KPI" or "add metric" → use criarKPI
- "preview website", "show website", or "web preview" → use webPreview
- weather queries → use displayWeather

Always call the appropriate tool rather than asking for more parameters. Use multiple tools in sequence when helpful (e.g., getData then interpretarDados, executarSQL then criarGrafico, or criarTabela then getData).

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
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    tools: {
      webPreview: tool({
        description: 'Generate web preview of a URL with iframe and navigation controls',
        inputSchema: z.object({
          url: z.string().describe('The URL to preview'),
        }),
        execute: async ({ url }) => {
          // Mock web preview data
          const mockPreviewData = {
            'ai-sdk.dev': {
              title: 'AI SDK by Vercel',
              description: 'The AI SDK is a TypeScript toolkit designed to help developers build AI-powered applications with React.',
              favicon: 'https://ai-sdk.dev/favicon.ico',
              screenshot: null,
            },
            'github.com': {
              title: 'GitHub',
              description: 'GitHub is where over 100 million developers shape the future of software, together.',
              favicon: 'https://github.githubassets.com/favicons/favicon.svg',
              screenshot: null,
            },
            'google.com': {
              title: 'Google',
              description: 'Search the world\'s information, including webpages, images, videos and more.',
              favicon: 'https://www.google.com/favicon.ico',
              screenshot: null,
            }
          };

          // Extract domain from URL for mock lookup
          const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          const previewData = mockPreviewData[domain as keyof typeof mockPreviewData] || {
            title: 'Web Preview',
            description: `Preview of ${url}`,
            favicon: null,
            screenshot: null,
          };

          // Validate URL format
          const isValidUrl = /^https?:\/\/.+/.test(url);
          
          return {
            url,
            title: previewData.title,
            description: previewData.description,
            favicon: previewData.favicon,
            screenshot: previewData.screenshot,
            isValidUrl,
            previewAvailable: isValidUrl,
            generatedAt: new Date().toISOString(),
            success: true
          };
        },
      }),
      displayWeather: tool({
        description: 'Get weather information for a specific location and display it in a beautiful weather card',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          // Simulate weather data
          const temperature = 72 + Math.floor(Math.random() * 21) - 10;
          return {
            location,
            temperature
          };
        },
      }),
      getDatasets: tool({
        description: 'Get list of BigQuery datasets available in a project',
        inputSchema: z.object({
          projectId: z.string().optional().describe('The project ID to get datasets from'),
        }),
        execute: async ({ projectId }) => {
          console.log('📊 BigQuery datasets tool executed for nexus');
          try {
            // Initialize BigQuery service if not already done
            if (!bigQueryService['client']) {
              console.log('⚡ Initializing BigQuery service...');
              await bigQueryService.initialize();
            }
            
            console.log('🔍 Attempting to list datasets...');
            const datasets = await bigQueryService.listDatasets();
            console.log('✅ Datasets retrieved:', datasets.length);
            
            // Convert Date objects to strings for component compatibility
            const datasetsWithStringDates = datasets.map(dataset => ({
              ...dataset,
              creationTime: dataset.creationTime ? dataset.creationTime.toISOString() : undefined,
            }));
            
            return {
              datasets: datasetsWithStringDates,
              success: true,
              projectId: projectId || process.env.GOOGLE_PROJECT_ID || 'default-project'
            };
          } catch (error) {
            console.error('❌ Error fetching datasets:', error);
            return {
              datasets: [],
              success: false,
              error: error instanceof Error ? error.message : 'Failed to retrieve datasets',
              projectId: projectId || process.env.GOOGLE_PROJECT_ID || 'default-project'
            };
          }
        },
      }),
      getTables: tool({
        description: 'Get list of tables in a specific BigQuery dataset',
        inputSchema: z.object({
          datasetId: z.string().describe('The dataset ID to get tables from'),
        }),
        execute: async ({ datasetId }) => {
          console.log('📋 BigQuery tables tool executed for nexus, dataset:', datasetId);
          try {
            // Initialize BigQuery service if not already done
            if (!bigQueryService['client']) {
              console.log('⚡ Initializing BigQuery service...');
              await bigQueryService.initialize();
            }
            
            console.log('🔍 Attempting to list tables for dataset:', datasetId);
            const tables = await bigQueryService.listTables(datasetId);
            console.log('✅ Tables retrieved:', tables.length, 'for dataset:', datasetId);
            
            // Convert Date objects to strings for component compatibility
            const tablesWithStringDates = tables.map(table => ({
              ...table,
              creationTime: table.creationTime ? table.creationTime.toISOString() : undefined,
              lastModifiedTime: table.lastModifiedTime ? table.lastModifiedTime.toISOString() : undefined,
            }));
            
            return {
              tables: tablesWithStringDates,
              datasetId,
              success: true
            };
          } catch (error) {
            console.error('❌ Error fetching tables:', error);
            return {
              tables: [],
              datasetId,
              success: false,
              error: error instanceof Error ? error.message : 'Failed to retrieve tables'
            };
          }
        },
      }),
      getData: tool({
        description: 'Get data from a specific BigQuery table',
        inputSchema: z.object({
          datasetId: z.string().describe('The dataset ID'),
          tableId: z.string().describe('The table ID to get data from'),
          limit: z.number().optional().describe('Maximum number of rows to return (default: 100)')
        }),
        execute: async ({ datasetId, tableId, limit = 100 }) => {
          console.log('📊 BigQuery getData tool executed for nexus:', { datasetId, tableId, limit });
          try {
            // Initialize BigQuery service if not already done
            if (!bigQueryService['client']) {
              console.log('⚡ Initializing BigQuery service...');
              await bigQueryService.initialize();
            }
            
            // Construct the query that will be executed (for transparency)
            const projectId = process.env.GOOGLE_PROJECT_ID;
            const queryToExecute = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${limit}`;
            
            console.log('🔍 Querying table data...');
            console.log('📋 SQL Query to execute:', queryToExecute);
            const startTime = Date.now();
            const result = await bigQueryService.queryTable(datasetId, tableId, {
              limit,
              columns: ['*']  // Get all columns
            });
            
            const executionTime = Date.now() - startTime;
            console.log('✅ Table data retrieved:', result.data.length, 'rows');
            
            // 🔍 DEBUG: Log da estrutura completa do resultado
            console.log('🔍 BigQuery result structure:', {
              hasData: !!result.data,
              dataLength: result.data?.length,
              dataType: typeof result.data,
              isArray: Array.isArray(result.data),
              hasSchema: !!result.schema,
              schemaLength: result.schema?.length,
              sampleData: result.data?.[0],
              schemaArray: result.schema,
              totalRows: result.totalRows,
              resultKeys: Object.keys(result)
            });
            
            return {
              data: result.data,           // Array of row objects
              schema: result.schema,       // Column definitions
              totalRows: result.totalRows, // Total rows in table
              executionTime,
              datasetId,
              tableId,
              query: queryToExecute,       // SQL query that was executed (for transparency)
              success: true
            };
          } catch (error) {
            console.error('❌ Error fetching table data:', error);
            return {
              data: [],
              schema: [],
              totalRows: 0,
              executionTime: 0,
              datasetId,
              tableId, 
              success: false,
              error: error instanceof Error ? error.message : 'Failed to retrieve table data'
            };
          }
        },
      }),
      interpretarDados: tool({
        description: 'Analyze and interpret data from a BigQuery table with insights and recommendations',
        inputSchema: z.object({
          datasetId: z.string().describe('The dataset ID'),
          tableId: z.string().describe('The table ID to analyze'),
          analysisType: z.enum(['trends', 'summary', 'insights', 'anomalies']).optional().describe('Type of analysis to perform')
        }),
        execute: async ({ datasetId, tableId, analysisType = 'insights' }) => {
          // Mock analysis based on table
          const analysisResults: Record<string, Record<string, unknown>> = {
            'customers': {
              summary: {
                totalRecords: 150000,
                avgAge: 34.2,
                topCities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
                signupTrend: 'Growing 15% monthly'
              },
              insights: [
                'Customer base is primarily young adults (25-35 years)',
                'Strong concentration in major Brazilian cities',
                'Consistent growth in customer acquisition',
                'Higher engagement in metropolitan areas'
              ],
              recommendations: [
                'Focus marketing on 25-35 demographic',
                'Expand services in secondary cities',
                'Implement referral programs for metropolitan users'
              ]
            },
            'orders': {
              summary: {
                totalOrders: 500000,
                avgOrderValue: 245.50,
                conversionRate: 3.2,
                topProducts: ['Electronics', 'Fashion', 'Home & Garden']
              },
              insights: [
                'Average order value increased 20% in last quarter',
                'Electronics category shows highest profit margins',
                'Weekend orders have 40% higher values',
                'Mobile purchases account for 65% of orders'
              ],
              recommendations: [
                'Promote electronics during peak hours',
                'Optimize mobile checkout experience',
                'Create weekend promotional campaigns'
              ]
            }
          };

          const result = analysisResults[tableId] || {
            summary: { message: 'Analysis completed for unknown table' },
            insights: ['Data patterns identified', 'Statistical analysis performed'],
            recommendations: ['Further analysis recommended']
          };

          return {
            datasetId,
            tableId,
            analysisType,
            analysis: result,
            executionTime: Math.floor(Math.random() * 2000) + 500,
            success: true
          };
        },
      }),
      criarGrafico: tool({
        description: 'Create data visualizations and charts from getData results. CRITICAL INSTRUCTIONS: 1) You MUST first use getData tool to get table data, 2) Copy the EXACT "data" array from getData output, 3) Paste it as tableData parameter - DO NOT make new queries or type data manually',
        inputSchema: z.object({
          tableData: z.array(z.record(z.unknown())).describe('PASTE the exact "data" array from previous getData tool output here. This should be an array of objects like [{col1: value1, col2: value2}, ...]. NEVER type this manually - always copy from getData results.'),
          chartType: z.enum(['bar', 'line', 'pie', 'scatter', 'area', 'heatmap', 'radar', 'funnel', 'treemap', 'stream']).describe('Type of chart to create'),
          xColumn: z.string().describe('Column name for X-axis'),
          yColumn: z.string().describe('Column name for Y-axis (should be numeric for most charts)'),
          title: z.string().optional().describe('Chart title'),
          groupBy: z.string().optional().describe('Optional column to group/aggregate by - useful for pie charts')
        }),
        execute: async ({ tableData, chartType, xColumn, yColumn, title, groupBy }) => {
          console.log('📊 ===== CRIAR GRAFICO DEBUG START =====');
          console.log('📊 Raw parameters received:', { 
            hasTableData: !!tableData,
            tableDataType: typeof tableData,
            isArray: Array.isArray(tableData),
            dataLength: tableData ? tableData.length : 0, 
            chartType, 
            xColumn, 
            yColumn, 
            title, 
            groupBy 
          });
          
          // EXTENSIVE DEBUG: Log complete data structure
          if (tableData) {
            console.log('📊 TableData full structure (first 200 chars):', JSON.stringify(tableData, null, 2).substring(0, 200));
            
            if (Array.isArray(tableData) && tableData.length > 0) {
              console.log('📊 First row complete:', JSON.stringify(tableData[0], null, 2));
              console.log('📊 Available columns:', Object.keys(tableData[0]));
              console.log('📊 Total rows in tableData:', tableData.length);
              console.log('📊 Sample values from first row:');
              Object.entries(tableData[0]).forEach(([key, value]) => {
                console.log(`   - ${key}: ${value} (${typeof value})`);
              });
            } else if (!Array.isArray(tableData)) {
              console.log('❌ CRITICAL ERROR: tableData is not an array!', typeof tableData);
              console.log('📊 Actual tableData value:', tableData);
            } else {
              console.log('❌ CRITICAL ERROR: tableData is empty array');
            }
          } else {
            console.log('❌ CRITICAL ERROR: tableData is null/undefined');
          }
          
          try {
            // ENHANCED VALIDATION with detailed error messages
            if (!tableData) {
              console.error('❌ VALIDATION FAILED: tableData is null/undefined');
              return {
                success: false,
                error: 'ERROR: No tableData provided. You must copy the "data" array from a previous getData tool result and paste it as the tableData parameter. Do not type it manually.',
                chartType,
                xColumn,
                yColumn,
                debugInfo: 'tableData was null/undefined'
              };
            }
            
            if (!Array.isArray(tableData)) {
              console.error('❌ VALIDATION FAILED: tableData is not an array, received:', typeof tableData);
              return {
                success: false,
                error: `ERROR: tableData must be an array, but received ${typeof tableData}. Copy the exact "data" array from getData results.`,
                chartType,
                xColumn,
                yColumn,
                debugInfo: `tableData type: ${typeof tableData}, value: ${JSON.stringify(tableData).substring(0, 100)}`
              };
            }
            
            if (tableData.length === 0) {
              console.error('❌ VALIDATION FAILED: tableData array is empty');
              return {
                success: false,
                error: 'ERROR: tableData array is empty. Make sure to copy the "data" array from a getData result that contains actual data.',
                chartType,
                xColumn,
                yColumn,
                debugInfo: 'tableData was empty array []'
              };
            }

            // Validate columns exist in data
            const firstRow = tableData[0];
            if (!firstRow.hasOwnProperty(xColumn)) {
              return {
                success: false,
                error: `Column '${xColumn}' not found in table data. Available columns: ${Object.keys(firstRow).join(', ')}`,
                chartType,
                xColumn,
                yColumn
              };
            }

            if (!firstRow.hasOwnProperty(yColumn)) {
              return {
                success: false,
                error: `Column '${yColumn}' not found in table data. Available columns: ${Object.keys(firstRow).join(', ')}`,
                chartType,
                xColumn,
                yColumn
              };
            }

            let processedData: Array<{ x: string; y: number; label: string; value: number }> = [];

            // Process data based on chart type and groupBy
            if (chartType === 'pie' || groupBy) {
              const aggregateColumn = groupBy || xColumn;
              const valueColumn = yColumn;

              // Group and aggregate data
              const grouped: Record<string, number> = {};
              
              tableData.forEach(row => {
                const key = String(row[aggregateColumn] || 'Unknown');
                const value = chartType === 'pie' ? 1 : Number(row[valueColumn]) || 0;
                grouped[key] = (grouped[key] || 0) + value;
              });

              // Convert to chart data format and sort by value
              processedData = Object.entries(grouped)
                .map(([key, value]) => ({
                  x: key,
                  y: value,
                  label: key,
                  value: value
                }))
                .sort((a, b) => b.y - a.y)
                .slice(0, 10); // Limit to top 10

            } else {
              // For scatter/line/bar charts, use raw data
              processedData = tableData
                .filter(row => 
                  row[xColumn] != null && 
                  row[yColumn] != null &&
                  !isNaN(Number(row[yColumn]))
                )
                .map((row) => ({
                  x: String(row[xColumn]),
                  y: Number(row[yColumn]) || 0,
                  label: String(row[xColumn]),
                  value: Number(row[yColumn]) || 0
                }))
                .slice(0, 20); // Limit to 20 points for performance
            }

            if (processedData.length === 0) {
              return {
                success: false,
                error: `No valid data points found for chart. Check if column '${yColumn}' contains numeric values.`,
                chartType,
                xColumn,
                yColumn
              };
            }

            console.log('📊 Chart data processed successfully:', {
              originalRows: tableData.length,
              processedPoints: processedData.length,
              sampleProcessedData: processedData.slice(0, 3),
              chartType,
              columnsUsed: { xColumn, yColumn, groupBy }
            });
            console.log('📊 ===== CRIAR GRAFICO DEBUG SUCCESS =====');

            return {
              success: true,
              chartData: processedData,
              chartType,
              xColumn,
              yColumn,
              title: title || `${yColumn} por ${xColumn}`,
              metadata: {
                totalDataPoints: processedData.length,
                generatedAt: new Date().toISOString(),
                executionTime: Date.now() - Date.now(), // Instant since no query
                dataSource: 'table-data'
              }
            };

          } catch (error) {
            console.error('❌ EXCEPTION in criarGrafico:', error);
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.log('📊 ===== CRIAR GRAFICO DEBUG FAILED =====');
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to create chart from table data',
              chartType,
              xColumn,
              yColumn,
              debugInfo: {
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage: error instanceof Error ? error.message : String(error),
                tableDataReceived: !!tableData,
                tableDataType: typeof tableData,
                tableDataLength: tableData ? tableData.length : 'N/A'
              }
            };
          }
        },
      }),
      retrieveResult: tool({
        description: 'Retrieve results from RAG search - searches documents in vector database with real semantic search',
        inputSchema: z.object({
          query: z.string().describe('Search query to find relevant documents'),
          topK: z.number().optional().default(10).describe('Number of most relevant documents to retrieve (1-20)'),
          namespaceId: z.string().optional().describe('Optional specific namespace ID to search in')
        }),
        execute: async ({ query, topK = 10, namespaceId }) => {
          console.log('🔍 RAG search tool executed (Nexus):', { query, topK, namespaceId });
          
          try {
            // Initialize agentset service if not already done
            if (!agentsetService['client']) {
              console.log('⚡ Initializing Agentset service...');
              await agentsetService.initialize();
            }

            // Generate answer using RAG real
            console.log('🤖 Generating RAG answer for query:', query);
            
            const result = await agentsetService.generateAnswer({
              query,
              topK,
              namespaceId
            });

            if (!result.success) {
              console.log('❌ RAG search failed:', result.error);
              return {
                resultId: `rag_${Date.now()}`,
                resultType: 'rag',
                result: {
                  type: 'rag',
                  query,
                  response: `Não foi possível encontrar informações relevantes para "${query}".`,
                  documentsFound: 0,
                  data: {
                    message: result.error || 'Failed to search knowledge base',
                    searchQuery: query,
                    totalDocuments: 0,
                    relevantDocuments: 0
                  }
                },
                sources: [],
                retrievedAt: new Date().toISOString(),
                success: false,
                error: result.error
              };
            }

            console.log('✅ RAG search completed successfully:', {
              query,
              sourcesCount: result.sources?.length || 0,
              hasAnswer: !!result.answer
            });

            return {
              resultId: `rag_${Date.now()}`,
              resultType: 'rag',
              result: {
                type: 'rag',
                query,
                response: result.answer,
                documentsFound: result.sources?.length || 0,
                data: {
                  message: result.answer,
                  searchQuery: query,
                  totalDocuments: result.sources?.length || 0,
                  relevantDocuments: result.sources?.length || 0
                }
              },
              sources: result.sources?.map(source => ({
                id: `src_${Date.now()}_${Math.random()}`,
                title: source.metadata?.title || 'Document',
                url: source.metadata?.url || '#',
                snippet: source.content || source.text || '',
                relevanceScore: source.score || 0
              })) || [],
              retrievedAt: new Date().toISOString(),
              success: true,
              sourcesCount: result.sources?.length || 0
            };

          } catch (error) {
            console.error('❌ Error in RAG search tool:', error);
            return {
              resultId: `rag_${Date.now()}`,
              resultType: 'rag',
              result: {
                type: 'rag',
                query,
                response: `Erro interno ao buscar informações para "${query}".`,
                documentsFound: 0,
                data: {
                  message: 'Internal error occurred during search',
                  searchQuery: query,
                  totalDocuments: 0,
                  relevantDocuments: 0
                }
              },
              sources: [],
              retrievedAt: new Date().toISOString(),
              success: false,
              error: error instanceof Error ? error.message : 'Unknown RAG search error'
            };
          }
        },
      }),
      criarDashboard: tool({
        description: 'Create interactive dashboards with multiple visualizations and KPIs',
        inputSchema: z.object({
          datasetIds: z.array(z.string()).describe('Array of dataset IDs to include'),
          title: z.string().describe('Dashboard title'),
          dashboardType: z.enum(['executive', 'operational', 'analytical']).describe('Type of dashboard'),
          kpis: z.array(z.string()).optional().describe('Key performance indicators to include')
        }),
        execute: async ({ datasetIds, title, dashboardType, kpis = [] }) => {
          // Mock dashboard components
          const dashboardTypes = {
            executive: {
              widgets: [
                {
                  type: 'kpi',
                  title: 'Total Revenue',
                  value: 'R$ 2.4M',
                  trend: '+12%',
                  color: 'green'
                },
                {
                  type: 'kpi',
                  title: 'Active Customers',
                  value: '15.2K',
                  trend: '+8%',
                  color: 'blue'
                },
                {
                  type: 'chart',
                  title: 'Revenue Trend',
                  chartType: 'line',
                  size: 'large'
                }
              ]
            },
            operational: {
              widgets: [
                {
                  type: 'metric',
                  title: 'Orders Today',
                  value: '1,247',
                  target: '1,200'
                },
                {
                  type: 'chart',
                  title: 'Hourly Orders',
                  chartType: 'bar',
                  size: 'medium'
                },
                {
                  type: 'table',
                  title: 'Top Products',
                  rows: 10
                }
              ]
            },
            analytical: {
              widgets: [
                {
                  type: 'chart',
                  title: 'Customer Segmentation',
                  chartType: 'pie',
                  size: 'medium'
                },
                {
                  type: 'chart',
                  title: 'Correlation Analysis',
                  chartType: 'scatter',
                  size: 'large'
                },
                {
                  type: 'insights',
                  title: 'Key Insights',
                  items: ['Pattern A identified', 'Anomaly in dataset B']
                }
              ]
            }
          };

          return {
            dashboardId: `dashboard_${Date.now()}`,
            title,
            dashboardType,
            datasetIds,
            widgets: dashboardTypes[dashboardType].widgets,
            kpis: kpis.length > 0 ? kpis : ['Revenue', 'Growth', 'Conversion'],
            layout: {
              columns: dashboardType === 'executive' ? 2 : 3,
              theme: 'modern',
              autoRefresh: true
            },
            metadata: {
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              version: '1.0'
            },
            success: true
          };
        },
      }),
      executarSQL: tool({
        description: 'Execute custom SQL queries on BigQuery datasets with syntax validation',
        inputSchema: z.object({
          sqlQuery: z.string().describe('The SQL query to execute'),
          datasetId: z.string().optional().describe('Dataset ID to execute query against'),
          dryRun: z.boolean().optional().describe('Run query validation without executing')
        }),
        execute: async ({ sqlQuery, datasetId, dryRun = false }) => {
          // Mock SQL execution with realistic results
          const queryType = sqlQuery.trim().toLowerCase().split(' ')[0];
          const executionTime = Math.floor(Math.random() * 2000) + 300;
          
          const mockResults = {
            select: {
              data: [
                { id: 1, name: 'Ana Silva', city: 'São Paulo', sales: 15000 },
                { id: 2, name: 'João Santos', city: 'Rio de Janeiro', sales: 12500 },
                { id: 3, name: 'Maria Costa', city: 'Belo Horizonte', sales: 18000 },
                { id: 4, name: 'Pedro Lima', city: 'Salvador', sales: 14200 },
                { id: 5, name: 'Carla Oliveira', city: 'Brasília', sales: 16800 }
              ],
              schema: [
                { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
                { name: 'name', type: 'STRING', mode: 'REQUIRED' },
                { name: 'city', type: 'STRING', mode: 'NULLABLE' },
                { name: 'sales', type: 'FLOAT', mode: 'NULLABLE' }
              ],
              rowsReturned: 5,
              rowsAffected: 0,
              totalRows: 150000
            },
            insert: {
              data: [],
              schema: [],
              rowsReturned: 0,
              rowsAffected: Math.floor(Math.random() * 100) + 1,
              totalRows: 0
            },
            update: {
              data: [],
              schema: [],
              rowsReturned: 0,
              rowsAffected: Math.floor(Math.random() * 50) + 1,
              totalRows: 0
            },
            delete: {
              data: [],
              schema: [],
              rowsReturned: 0,
              rowsAffected: Math.floor(Math.random() * 25) + 1,
              totalRows: 0
            }
          };

          const resultType = ['select'].includes(queryType) ? queryType : 'select';
          const result = mockResults[resultType as keyof typeof mockResults];

          return {
            sqlQuery,
            datasetId: datasetId || 'default-dataset',
            queryType: queryType.toUpperCase(),
            dryRun,
            data: result.data,
            schema: result.schema,
            rowsReturned: result.rowsReturned || 0,
            rowsAffected: result.rowsAffected || 0,
            totalRows: result.totalRows,
            executionTime,
            bytesProcessed: Math.floor(Math.random() * 1000000) + 50000,
            success: true,
            validationErrors: dryRun && Math.random() > 0.8 ? ['Syntax warning: Missing semicolon'] : []
          };
        },
      }),
      criarTabela: tool({
        description: 'Create new BigQuery tables with custom schema definition',
        inputSchema: z.object({
          datasetId: z.string().describe('Dataset ID where table will be created'),
          tableName: z.string().describe('Name of the table to create'),
          schema: z.array(z.object({
            name: z.string(),
            type: z.enum(['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP']),
            mode: z.enum(['REQUIRED', 'NULLABLE', 'REPEATED']).optional()
          })).describe('Table schema definition'),
          description: z.string().optional().describe('Table description')
        }),
        execute: async ({ datasetId, tableName, schema, description }) => {
          // Mock table creation
          const tableId = `${tableName}_${Date.now()}`;
          const creationTime = new Date().toISOString();
          
          return {
            datasetId,
            tableName,
            tableId,
            schema: schema.map(col => ({
              ...col,
              mode: col.mode || 'NULLABLE'
            })),
            description: description || `Table created: ${tableName}`,
            location: 'US',
            creationTime,
            lastModifiedTime: creationTime,
            numRows: 0,
            numBytes: 0,
            expirationTime: null,
            labels: {},
            metadata: {
              tableType: 'TABLE',
              createdBy: 'BigQuery Tool',
              version: '1.0'
            },
            success: true
          };
        },
      }),
      criarKPI: tool({
        description: 'Create Key Performance Indicator metrics with calculations and targets',
        inputSchema: z.object({
          name: z.string().describe('KPI name'),
          datasetId: z.string().describe('Source dataset ID'),
          tableId: z.string().describe('Source table ID'),
          metric: z.enum(['sum', 'count', 'avg', 'min', 'max', 'ratio']).describe('Type of calculation'),
          calculation: z.string().describe('Calculation formula or column name'),
          target: z.number().optional().describe('Target value for the KPI'),
          unit: z.string().optional().describe('Unit of measurement (%, $, count, etc)')
        }),
        execute: async ({ name, datasetId, tableId, metric, calculation, target, unit = 'count' }) => {
          // Mock KPI calculation
          const baseValue = Math.floor(Math.random() * 10000) + 1000;
          const currentValue = target ? (baseValue % target) + (target * 0.7) : baseValue;
          const previousValue = currentValue * (0.85 + Math.random() * 0.3);
          
          const kpiData = {
            revenue: { current: 245000, target: 250000, unit: '$' },
            conversion: { current: 3.2, target: 4.0, unit: '%' },
            customers: { current: 15240, target: 18000, unit: 'count' },
            satisfaction: { current: 4.7, target: 5.0, unit: 'rating' }
          };

          const mockKey = Object.keys(kpiData)[Math.floor(Math.random() * Object.keys(kpiData).length)] as keyof typeof kpiData;
          const mockData = kpiData[mockKey];

          return {
            kpiId: `kpi_${Date.now()}`,
            name,
            datasetId,
            tableId,
            metric,
            calculation,
            currentValue: mockData.current,
            previousValue: mockData.current * 0.92,
            target: target || mockData.target,
            unit: unit || mockData.unit,
            change: ((mockData.current - (mockData.current * 0.92)) / (mockData.current * 0.92)) * 100,
            trend: 'increasing',
            status: mockData.current >= (target || mockData.target) ? 'on-target' : 'below-target',
            timeRange: 'last-30-days',
            visualization: {
              chartType: 'gauge',
              color: mockData.current >= (target || mockData.target) ? 'green' : 'orange',
              showTrend: true,
              showTarget: true
            },
            metadata: {
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              refreshRate: 'daily',
              dataSource: `${datasetId}.${tableId}`
            },
            success: true
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}