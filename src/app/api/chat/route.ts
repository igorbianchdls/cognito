import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

export async function POST(req: Request) {
  console.log('=== CHAT API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A');
  
  try {
    const { messages, files } = await req.json();
    console.log('Messages received:', messages?.length || 0);
    console.log('Files received:', files?.length || 0);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Anthropic API key not configured',
        details: 'Please set ANTHROPIC_API_KEY in your environment variables'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare system message with file context
    let systemMessage = 'Você é um assistente AI útil e amigável. Responda de forma clara e concisa em português brasileiro.';
    
    if (files && files.length > 0) {
      systemMessage += '\n\nVocê tem acesso aos seguintes arquivos enviados pelo usuário:\n\n';
      
      files.forEach((file: { name: string; fileType?: string; size: number; rowCount?: number; columnCount?: number; summary?: string; content?: string }, index: number) => {
        systemMessage += `=== ARQUIVO ${index + 1}: ${file.name} ===\n`;
        systemMessage += `Tipo: ${file.fileType || 'unknown'}\n`;
        systemMessage += `Tamanho: ${file.size} bytes\n`;
        
        if (file.fileType === 'csv' && file.rowCount && file.columnCount) {
          systemMessage += `Dados: ${file.rowCount} linhas, ${file.columnCount} colunas\n`;
        }
        
        if (file.summary) {
          systemMessage += `Resumo: ${file.summary}\n`;
        }
        
        if (file.content) {
          systemMessage += `\nConteúdo:\n${file.content}\n`;
        }
        
        systemMessage += '\n' + '='.repeat(50) + '\n\n';
      });
      
      systemMessage += 'Analise estes arquivos e responda às perguntas do usuário baseado no conteúdo dos documentos. Você pode fazer análises, extrair insights, responder perguntas específicas sobre os dados, ou qualquer outra operação solicitada.';
    }

    console.log('🚀 Starting streamText with multi-step support...');
    
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      stopWhen: stepCountIs(3), // Enable multi-step tool calling (max 3 steps)
      tools: {
        getWeather: tool({
          description: 'Get weather information for a specific location and display it in a beautiful weather card',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            console.log('🌤️ Weather tool executed for:', location);
            const temperature = 72 + Math.floor(Math.random() * 21) - 10;
            return {
              location,
              temperature
            };
          },
        }),
        calculator: tool({
          description: 'Create an interactive calculator for mathematical operations',
          inputSchema: z.object({
            expression: z.string().optional().describe('Optional initial expression to show'),
            result: z.number().optional().describe('Optional initial result to display'),
          }),
          execute: async ({ expression, result }) => {
            console.log('🧮 Calculator tool executed');
            return {
              expression,
              result
            };
          },
        }),
        createChart: tool({
          description: 'Generate interactive charts and graphs from data',
          inputSchema: z.object({
            title: z.string().describe('Title for the chart'),
            data: z.array(z.object({
              label: z.string(),
              value: z.number()
            })).describe('Array of data points with labels and values'),
            type: z.enum(['bar', 'pie', 'line']).default('bar').describe('Type of chart to create')
          }),
          execute: async ({ title, data, type }) => {
            console.log('📊 Chart tool executed:', { title, data, type });
            return {
              title,
              data,
              type
            };
          },
        }),
        getBigQueryDatasets: tool({
          description: 'List all available BigQuery datasets in the project with their information',
          inputSchema: z.object({}),
          execute: async () => {
            console.log('📊 BigQuery datasets tool executed');
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              console.log('🔍 Attempting to list datasets...');
              const datasets = await bigQueryService.listDatasets();
              console.log('✅ Datasets retrieved:', datasets.length);
              
              return {
                success: true,
                datasets
              };
            } catch (error) {
              console.error('❌ Error fetching datasets:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve datasets'
              };
            }
          },
        }),
        getBigQueryTables: tool({
          description: 'List all tables in a specific BigQuery dataset with their metadata',
          inputSchema: z.object({
            datasetId: z.string().describe('The dataset ID to list tables from (e.g., "biquery_data")')
          }),
          execute: async ({ datasetId }) => {
            console.log('📋 BigQuery tables tool executed for dataset:', datasetId);
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              console.log('🔍 Attempting to list tables for dataset:', datasetId);
              const tables = await bigQueryService.listTables(datasetId);
              console.log('✅ Tables retrieved:', tables.length, 'for dataset:', datasetId);
              
              return {
                success: true,
                tables,
                datasetId
              };
            } catch (error) {
              console.error('❌ Error fetching tables:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve tables',
                datasetId
              };
            }
          },
        }),
        getBigQueryTableData: tool({
          description: 'Execute SQL queries on BigQuery tables and display data in a formatted table',
          inputSchema: z.object({
            query: z.string().describe('SQL query to execute (e.g., "SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 20")'),
            limit: z.number().optional().default(20).describe('Maximum number of rows to return')
          }),
          execute: async ({ query, limit = 20 }) => {
            console.log('🔍 BigQuery table data tool executed with query:', query);
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              // Add LIMIT to query if not already present and limit is specified
              let finalQuery = query.trim();
              if (limit && !finalQuery.toLowerCase().includes('limit')) {
                finalQuery += ` LIMIT ${limit}`;
              }
              
              console.log('🚀 Executing query:', finalQuery);
              const startTime = Date.now();
              
              const result = await bigQueryService.executeQuery({
                query: finalQuery,
                location: process.env.BIGQUERY_LOCATION
              });
              
              const executionTime = Date.now() - startTime;
              console.log('✅ Query executed successfully:', {
                rows: result.data.length,
                executionTime: `${executionTime}ms`,
                bytesProcessed: result.bytesProcessed
              });

              // 🔍 DEBUG: Log da estrutura completa do resultado
              console.log('🔍 BigQuery result structure:', {
                hasData: !!result.data,
                dataLength: result.data?.length,
                totalRows: result.totalRows,
                hasSchema: !!result.schema,
                schemaLength: result.schema?.length,
                sampleData: result.data?.slice(0, 2),
                resultKeys: Object.keys(result)
              });
              console.log('🔍 Full result (first 500 chars):', JSON.stringify(result, null, 2).substring(0, 500));
              
              const toolResult = {
                success: true,
                data: result,
                query: finalQuery,
                executionTime
              };
              
              console.log('🔍 Tool result structure:', {
                success: toolResult.success,
                hasData: !!toolResult.data,
                query: toolResult.query,
                executionTime: toolResult.executionTime
              });
              
              return toolResult;
            } catch (error) {
              console.error('❌ Error executing BigQuery:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to execute query',
                query
              };
            }
          },
        }),
        analyzeBigQueryData: tool({
          description: 'Execute SQL queries on BigQuery and return statistical analysis and insights for AI processing',
          inputSchema: z.object({
            query: z.string().describe('SQL query to execute and analyze (e.g., "SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 20")'),
            analysisType: z.enum(['summary', 'statistical', 'trends']).default('summary').describe('Type of analysis to perform')
          }),
          execute: async ({ query, analysisType = 'summary' }) => {
            console.log('🔍 BigQuery analysis tool executed with query:', query, 'type:', analysisType);
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              // Execute query (reuse logic from getBigQueryTableData)
              let finalQuery = query.trim();
              if (!finalQuery.toLowerCase().includes('limit')) {
                finalQuery += ' LIMIT 100'; // Higher limit for analysis
              }
              
              console.log('🚀 Executing query for analysis:', finalQuery);
              const startTime = Date.now();
              
              const result = await bigQueryService.executeQuery({
                query: finalQuery,
                location: process.env.BIGQUERY_LOCATION
              });
              
              const executionTime = Date.now() - startTime;
              console.log('✅ Analysis query executed successfully:', {
                rows: result.data.length,
                executionTime: `${executionTime}ms`
              });

              // Process data for analysis
              const data = result.data;
              if (!data || data.length === 0) {
                return {
                  success: true,
                  analysis: 'No data returned from query - unable to perform analysis.',
                  query: finalQuery,
                  rowCount: 0
                };
              }

              // Get column information
              const columns = Object.keys(data[0]);
              const rowCount = data.length;

              // Basic statistics
              let analysis = '';
              
              if (analysisType === 'summary' || analysisType === 'statistical') {
                analysis += `📊 DATASET SUMMARY:\n`;
                analysis += `• Total rows analyzed: ${rowCount.toLocaleString('pt-BR')}\n`;
                analysis += `• Columns (${columns.length}): ${columns.join(', ')}\n\n`;
                
                // Sample data
                analysis += `📋 SAMPLE DATA (first 3 rows):\n`;
                data.slice(0, 3).forEach((row, i) => {
                  analysis += `Row ${i + 1}: ${JSON.stringify(row)}\n`;
                });
                analysis += '\n';
                
                // Column analysis
                analysis += `🔍 COLUMN ANALYSIS:\n`;
                columns.forEach(col => {
                  const values = data.map(row => row[col]).filter(v => v != null);
                  const uniqueValues = [...new Set(values)];
                  const nullCount = data.length - values.length;
                  
                  analysis += `• ${col}:\n`;
                  analysis += `  - Non-null values: ${values.length}\n`;
                  if (nullCount > 0) analysis += `  - Null values: ${nullCount}\n`;
                  analysis += `  - Unique values: ${uniqueValues.length}\n`;
                  
                  // Type-specific analysis
                  if (values.length > 0) {
                    const firstValue = values[0];
                    if (typeof firstValue === 'number') {
                      const numericValues = values.filter(v => typeof v === 'number') as number[];
                      const min = Math.min(...numericValues);
                      const max = Math.max(...numericValues);
                      const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                      analysis += `  - Range: ${min.toLocaleString('pt-BR')} to ${max.toLocaleString('pt-BR')}\n`;
                      analysis += `  - Average: ${avg.toFixed(2)}\n`;
                    } else if (typeof firstValue === 'string') {
                      const topValues = [...new Set(values)]
                        .map(val => ({ value: val, count: values.filter(v => v === val).length }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 3);
                      analysis += `  - Top values: ${topValues.map(v => `${v.value}(${v.count})`).join(', ')}\n`;
                    }
                  }
                  analysis += '\n';
                });
              }
              
              if (analysisType === 'trends' || analysisType === 'statistical') {
                analysis += `📈 INSIGHTS & PATTERNS:\n`;
                
                // Look for numeric columns for trend analysis
                const numericCols = columns.filter(col => {
                  const values = data.map(row => row[col]).filter(v => v != null && typeof v === 'number');
                  return values.length > 0;
                });
                
                if (numericCols.length > 0) {
                  numericCols.forEach(col => {
                    const numericValues = data.map(row => row[col]).filter(v => v != null && typeof v === 'number') as number[];
                    if (numericValues.length > 1) {
                      const sorted = [...numericValues].sort((a, b) => a - b);
                      const median = sorted[Math.floor(sorted.length / 2)];
                      const q1 = sorted[Math.floor(sorted.length * 0.25)];
                      const q3 = sorted[Math.floor(sorted.length * 0.75)];
                      
                      analysis += `• ${col}: Median=${median}, Q1=${q1}, Q3=${q3}\n`;
                    }
                  });
                } else {
                  analysis += `• No numeric columns found for trend analysis\n`;
                }
                
                // Data quality insights
                const totalCells = rowCount * columns.length;
                const nullCells = columns.reduce((sum, col) => {
                  const nullCount = data.filter(row => row[col] == null).length;
                  return sum + nullCount;
                }, 0);
                const completeness = ((totalCells - nullCells) / totalCells * 100).toFixed(1);
                
                analysis += `• Data completeness: ${completeness}% (${nullCells} null values out of ${totalCells} total cells)\n`;
              }

              const analysisResult = {
                success: true,
                analysis,
                query: finalQuery,
                rowCount,
                columnCount: columns.length,
                executionTime,
                analysisType
              };

              console.log('🔍 Analysis completed:', {
                rowCount,
                columnCount: columns.length,
                analysisLength: analysis.length
              });

              return analysisResult;
            } catch (error) {
              console.error('❌ Error in BigQuery analysis:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to analyze data',
                query,
                analysis: 'Analysis failed due to error.'
              };
            }
          },
        }),
        createBigQueryChart: tool({
          description: 'Create interactive charts from BigQuery data with specified X and Y columns',
          inputSchema: z.object({
            query: z.string().describe('SQL query to get data for chart (e.g., "SELECT * FROM `creatto-463117.biquery_data.car_prices`")'),
            chartType: z.enum(['bar', 'line', 'pie', 'scatter']).describe('Type of chart to create'),
            xColumn: z.string().describe('Column name for X axis'),
            yColumn: z.string().describe('Column name for Y axis (should be numeric for most charts)'),
            title: z.string().optional().describe('Chart title'),
            groupBy: z.string().optional().describe('Optional column to group/aggregate by')
          }),
          execute: async ({ query, chartType, xColumn, yColumn, title, groupBy }) => {
            console.log('📊 BigQuery chart tool executed:', { query, chartType, xColumn, yColumn, title, groupBy });
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }

              // Modify query based on chart requirements
              let chartQuery = query.trim();
              
              // For pie charts or when groupBy is specified, we need aggregation
              if (chartType === 'pie' || groupBy) {
                const aggregateColumn = groupBy || xColumn;
                const valueColumn = yColumn;
                
                // Create aggregation query
                chartQuery = `
                  WITH chart_data AS (${chartQuery})
                  SELECT 
                    ${aggregateColumn} as x_value,
                    ${chartType === 'pie' ? 'COUNT(*)' : `SUM(CAST(${valueColumn} AS FLOAT64))`} as y_value
                  FROM chart_data 
                  WHERE ${aggregateColumn} IS NOT NULL
                  ${chartType === 'pie' ? '' : `AND ${valueColumn} IS NOT NULL`}
                  GROUP BY ${aggregateColumn}
                  ORDER BY y_value DESC
                  LIMIT 50
                `;
              } else {
                // For scatter/line charts, select specific columns
                chartQuery = `
                  WITH chart_data AS (${chartQuery})
                  SELECT 
                    ${xColumn} as x_value,
                    CAST(${yColumn} AS FLOAT64) as y_value
                  FROM chart_data 
                  WHERE ${xColumn} IS NOT NULL AND ${yColumn} IS NOT NULL
                  LIMIT 100
                `;
              }
              
              console.log('🚀 Executing chart query:', chartQuery);
              const startTime = Date.now();
              
              const result = await bigQueryService.executeQuery({
                query: chartQuery,
                location: process.env.BIGQUERY_LOCATION
              });
              
              const executionTime = Date.now() - startTime;
              console.log('✅ Chart query executed successfully:', {
                rows: result.data.length,
                executionTime: `${executionTime}ms`
              });

              // Process data for chart format
              const rawData = result.data;
              if (!rawData || rawData.length === 0) {
                return {
                  success: false,
                  error: 'No data returned from query for chart',
                  query: chartQuery
                };
              }

              // Format data for different chart types
              const chartData = rawData.map(row => ({
                x: String(row.x_value || ''),
                y: Number(row.y_value || 0),
                label: String(row.x_value || ''),
                value: Number(row.y_value || 0)
              }));

              console.log('📊 Chart data processed:', {
                dataPoints: chartData.length,
                sampleData: chartData.slice(0, 3)
              });

              return {
                success: true,
                chartData,
                chartType,
                xColumn,
                yColumn,
                title: title || `${yColumn} by ${xColumn}`,
                query: chartQuery,
                executionTime,
                dataCount: chartData.length
              };
            } catch (error) {
              console.error('❌ Error creating BigQuery chart:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create chart',
                query,
                chartType,
                xColumn,
                yColumn
              };
            }
          },
        }),
        createChartFromTable: tool({
          description: 'Create charts from previously loaded table data without executing new queries - use this when user wants a chart of data that was just shown in a table',
          inputSchema: z.object({
            tableData: z.array(z.record(z.unknown())).describe('Raw table data from the previous BigQuery result (array of row objects)'),
            chartType: z.enum(['bar', 'line', 'pie', 'scatter']).describe('Type of chart to create'),
            xColumn: z.string().describe('Column name for X axis'),
            yColumn: z.string().describe('Column name for Y axis (should be numeric for most charts)'),
            title: z.string().optional().describe('Chart title'),
            groupBy: z.string().optional().describe('Optional column to group/aggregate by - useful for pie charts')
          }),
          execute: async ({ tableData, chartType, xColumn, yColumn, title, groupBy }) => {
            console.log('📊 Chart from table tool executed:', { 
              dataRows: tableData.length, 
              chartType, 
              xColumn, 
              yColumn, 
              title, 
              groupBy 
            });
            
            try {
              if (!tableData || tableData.length === 0) {
                return {
                  success: false,
                  error: 'No table data provided for chart',
                  chartType,
                  xColumn,
                  yColumn
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
                  .slice(0, 50); // Limit to top 50

              } else {
                // For scatter/line charts, use raw data
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
                  .slice(0, 100); // Limit to 100 points for performance
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

              console.log('📊 Chart data processed from table:', {
                originalRows: tableData.length,
                processedPoints: processedData.length,
                sampleData: processedData.slice(0, 3)
              });

              return {
                success: true,
                chartData: processedData,
                chartType,
                xColumn,
                yColumn,
                title: title || `${yColumn} by ${xColumn}`,
                dataCount: processedData.length,
                source: 'table-data'
              };

            } catch (error) {
              console.error('❌ Error creating chart from table data:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create chart from table data',
                chartType,
                xColumn,
                yColumn
              };
            }
          },
        })
      },
    });

    console.log('🚀 Multi-step streaming response with generative UI...');
    
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}