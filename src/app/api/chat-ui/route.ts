import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

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
- criarGrafico: Create visualizations and charts (requires datasetId, tableId, chartType, xColumn, yColumn)
- retrieveResult: Search documents using RAG (requires query parameter) - retrieves relevant documents from vector database
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

Always call the appropriate tool rather than asking for more parameters. Use multiple tools in sequence when helpful (e.g., getData then interpretarDados, executarSQL then criarGrafico, or criarTabela then getData).`,
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
            
            // Query table data using BigQuery service
            console.log('🔍 Querying table data...');
            const startTime = Date.now();
            const result = await bigQueryService.queryTable(datasetId, tableId, {
              limit,
              columns: ['*']  // Get all columns
            });
            
            const executionTime = Date.now() - startTime;
            console.log('✅ Table data retrieved:', result.data.length, 'rows');
            
            return {
              data: result.data,           // Array of row objects
              schema: result.schema,       // Column definitions
              totalRows: result.totalRows, // Total rows in table
              executionTime,
              datasetId,
              tableId,
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
        description: 'Create data visualizations and charts from BigQuery data',
        inputSchema: z.object({
          datasetId: z.string().describe('The dataset ID'),
          tableId: z.string().describe('The table ID'),
          chartType: z.enum(['bar', 'line', 'pie', 'scatter', 'area']).describe('Type of chart to create'),
          xColumn: z.string().describe('Column for X-axis'),
          yColumn: z.string().describe('Column for Y-axis'),
          title: z.string().optional().describe('Chart title')
        }),
        execute: async ({ datasetId, tableId, chartType, xColumn, yColumn, title }) => {
          // Mock chart data
          const chartData = {
            bar: [
              { x: 'Jan', y: 4500, label: 'Janeiro' },
              { x: 'Feb', y: 5200, label: 'Fevereiro' },
              { x: 'Mar', y: 4800, label: 'Março' },
              { x: 'Apr', y: 6100, label: 'Abril' },
              { x: 'May', y: 5900, label: 'Maio' }
            ],
            line: [
              { x: '2024-01', y: 150000 },
              { x: '2024-02', y: 162000 },
              { x: '2024-03', y: 158000 },
              { x: '2024-04', y: 175000 },
              { x: '2024-05', y: 182000 }
            ],
            pie: [
              { label: 'São Paulo', value: 35, color: '#3b82f6' },
              { label: 'Rio de Janeiro', value: 25, color: '#ef4444' },
              { label: 'Belo Horizonte', value: 15, color: '#22c55e' },
              { label: 'Salvador', value: 12, color: '#f59e0b' },
              { label: 'Outros', value: 13, color: '#8b5cf6' }
            ],
            scatter: [
              { x: '10', y: 45, label: 'Ponto 1' },
              { x: '20', y: 65, label: 'Ponto 2' },
              { x: '30', y: 40, label: 'Ponto 3' },
              { x: '40', y: 80, label: 'Ponto 4' },
              { x: '50', y: 75, label: 'Ponto 5' }
            ],
            area: [
              { x: 'Q1', y: 3200 },
              { x: 'Q2', y: 4100 },
              { x: 'Q3', y: 3800 },
              { x: 'Q4', y: 4500 },
              { x: 'Q5', y: 4200 }
            ]
          };

          return {
            chartData: chartData[chartType] || chartData.bar,
            chartType,
            title: title || `${yColumn} por ${xColumn}`,
            xColumn,
            yColumn,
            datasetId,
            tableId,
            metadata: {
              totalDataPoints: chartData[chartType]?.length || 0,
              generatedAt: new Date().toISOString(),
              executionTime: Math.floor(Math.random() * 800) + 200
            },
            success: true
          };
        },
      }),
      retrieveResult: tool({
        description: 'Retrieve results from RAG search - searches documents in vector database',
        inputSchema: z.object({
          query: z.string().describe('Search query to find relevant documents'),
          resultId: z.string().optional().describe('The result ID to retrieve'),
          queryId: z.string().optional().describe('The query ID to retrieve'),
          resultType: z.enum(['analysis', 'chart', 'dashboard', 'query', 'rag']).optional().describe('Type of result to retrieve')
        }),
        execute: async ({ query, resultId, queryId, resultType = 'rag' }) => {
          // Mock RAG search - simulate vector database search
          const mockDocuments = [
            {
              id: 'doc_001',
              title: 'BigQuery Performance Best Practices',
              url: 'https://cloud.google.com/bigquery/docs/best-practices-performance-overview',
              content: 'Best practices for optimizing BigQuery query performance including partitioning, clustering, and query optimization techniques.',
              snippet: 'Use partitioning and clustering to improve query performance. Avoid SELECT * queries.',
              relevanceScore: 0.95
            },
            {
              id: 'doc_002', 
              title: 'Data Analytics with SQL',
              url: 'https://example.com/sql-analytics',
              content: 'Complete guide to performing data analytics using SQL queries with practical examples.',
              snippet: 'SQL analytics enables data-driven insights through aggregations, window functions, and CTEs.',
              relevanceScore: 0.87
            },
            {
              id: 'doc_003',
              title: 'Machine Learning on BigQuery',
              url: 'https://cloud.google.com/bigquery-ml/docs/introduction',
              content: 'Introduction to BigQuery ML for creating and executing machine learning models.',
              snippet: 'BigQuery ML enables data scientists to build ML models using SQL queries.',
              relevanceScore: 0.79
            },
            {
              id: 'doc_004',
              title: 'Data Visualization Techniques',
              url: 'https://example.com/data-viz',
              content: 'Best practices for creating effective data visualizations and dashboards.',
              snippet: 'Choose the right chart type based on your data and audience needs.',
              relevanceScore: 0.72
            }
          ];

          // Simulate vector search by filtering documents based on query relevance
          const searchQuery = query?.toLowerCase() || '';
          const relevantDocs = mockDocuments
            .filter(doc => 
              doc.title.toLowerCase().includes(searchQuery) ||
              doc.content.toLowerCase().includes(searchQuery) ||
              searchQuery.split(' ').some(term => 
                doc.title.toLowerCase().includes(term) || 
                doc.content.toLowerCase().includes(term)
              )
            )
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3); // Top 3 most relevant

          // If no query provided, fall back to cached results
          if (!query) {
            const cachedResults: Record<string, {
              type: string;
              data: Record<string, unknown>;
            }> = {
              'result_001': {
                type: 'analysis',
                data: {
                  dataset: 'ecommerce_data',
                  table: 'customers',
                  insights: ['Customer growth rate: +15%', 'Top segment: Young professionals'],
                  generatedAt: '2024-08-10T10:30:00Z'
                }
              }
            };

            const result = cachedResults[resultId || queryId || 'result_001'];
            return {
              resultId: resultId || queryId,
              resultType,
              result: result || { message: 'Result not found' },
              retrievedAt: new Date().toISOString(),
              success: !!result,
              sources: []
            };
          }

          // Generate AI response based on found documents
          const response = relevantDocs.length > 0 
            ? `Based on the search for "${query}", I found ${relevantDocs.length} relevant documents. ${relevantDocs[0]?.snippet || 'Here are the key insights from the retrieved documents.'}`
            : `No relevant documents found for "${query}". Please try a different search query.`;
          
          return {
            resultId: `rag_${Date.now()}`,
            resultType: 'rag',
            result: {
              type: 'rag',
              query,
              response,
              documentsFound: relevantDocs.length,
              data: { 
                message: response,
                searchQuery: query,
                totalDocuments: mockDocuments.length,
                relevantDocuments: relevantDocs.length
              }
            },
            sources: relevantDocs.map(doc => ({
              id: doc.id,
              title: doc.title,
              url: doc.url,
              snippet: doc.snippet,
              relevanceScore: doc.relevanceScore
            })),
            retrievedAt: new Date().toISOString(),
            success: true
          };
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