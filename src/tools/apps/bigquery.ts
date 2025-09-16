import { tool } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

interface TimelineData {
  total_days: number;
  unique_days: number;
  total_records: number;
  oldest_date: string;
  newest_date: string;
  latest_date: string;
  last_7_days_start: string;
  last_30_days_start: string;
  last_90_days_start: string;
  records_last_7d: number;
  records_last_30d: number;
  records_last_90d: number;
}

export const getDatasets = tool({
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
});

export const getTables = tool({
  description: 'Get list of tables in the biquery_data BigQuery dataset',
  inputSchema: z.object({}),
  execute: async () => {
    const datasetId = "biquery_data";
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
});

export const getData = tool({
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
      const result = await bigQueryService.queryTable(datasetId, tableId, limit);
      
      const executionTime = Date.now() - startTime;
      console.log('✅ Query completed in', executionTime, 'ms');
      console.log('📈 Rows returned:', result.length || 0);
      
      return {
        data: result,
        datasetId,
        tableId,
        executionTime,
        sqlQuery: queryToExecute,
        success: true
      };
    } catch (error) {
      console.error('❌ Error querying table data:', error);
      return {
        data: [],
        schema: [],
        datasetId,
        tableId,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve table data'
      };
    }
  },
});

export const executarSQL = tool({
  description: 'Execute custom SQL queries on BigQuery datasets with syntax validation',
  inputSchema: z.object({
    sqlQuery: z.string().describe('The SQL query to execute'),
    explicacao: z.string().optional().describe('Explicação do que esta query vai analisar'),
    datasetId: z.string().optional().describe('Dataset ID to execute query against'),
    dryRun: z.boolean().optional().describe('Run query validation without executing')
  }),
  execute: async ({ sqlQuery, explicacao, datasetId, dryRun = false }) => {
    console.log('📋 BigQuery executarSQL tool executed:', { sqlQuery, datasetId, dryRun });
    
    try {
      // Initialize BigQuery service if not already done
      if (!bigQueryService['client']) {
        console.log('⚡ Initializing BigQuery service...');
        await bigQueryService.initialize();
      }

      const queryType = sqlQuery.trim().toLowerCase().split(' ')[0];
      const startTime = Date.now();

      if (dryRun) {
        // For dry run, validate the query without executing
        console.log('🔍 Performing dry run validation for query');
        try {
          // Use BigQuery dry run to validate syntax
          const result = await bigQueryService.executeQuery({ 
            query: sqlQuery,
            jobTimeoutMs: 10000 
          });
          
          return {
            sqlQuery,
            explicacao: explicacao,
            datasetId: datasetId || 'validation',
            queryType: queryType.toUpperCase(),
            dryRun: true,
            data: [],
            schema: result.schema || [],
            rowsReturned: 0,
            rowsAffected: 0,
            totalRows: 0,
            executionTime: Date.now() - startTime,
            bytesProcessed: 0,
            success: true,
            validationErrors: [],
            message: 'Query syntax is valid'
          };
        } catch (error) {
          return {
            sqlQuery,
            explicacao: explicacao,
            datasetId: datasetId || 'validation',
            queryType: queryType.toUpperCase(),
            dryRun: true,
            data: [],
            schema: [],
            rowsReturned: 0,
            rowsAffected: 0,
            totalRows: 0,
            executionTime: Date.now() - startTime,
            bytesProcessed: 0,
            success: false,
            validationErrors: [error instanceof Error ? error.message : 'Query validation failed'],
            error: error instanceof Error ? error.message : 'Query validation failed'
          };
        }
      }

      // Don't execute the query - just return it for SQLEditor
      console.log('📝 SQL query generated:', sqlQuery);
      console.log('➡️ Sending to SQLEditor for execution...');

      return {
        sqlQuery,
        explicacao: explicacao,
        datasetId: datasetId || 'default-dataset',
        queryType: queryType.toUpperCase(),
        dryRun: false,
        data: [],
        schema: [],
        rowsReturned: 0,
        rowsAffected: 0,
        totalRows: 0,
        executionTime: 0,
        bytesProcessed: 0,
        success: true,
        validationErrors: [],
        message: 'Query gerada com sucesso. Executando no SQLEditor...'
      };

    } catch (error) {
      console.error('❌ Error executing SQL query:', error);
      return {
        sqlQuery,
        explicacao: explicacao,
        datasetId: datasetId || 'default-dataset',
        queryType: sqlQuery.trim().toLowerCase().split(' ')[0].toUpperCase(),
        dryRun,
        data: [],
        schema: [],
        rowsReturned: 0,
        rowsAffected: 0,
        totalRows: 0,
        executionTime: 0,
        bytesProcessed: 0,
        success: false,
        validationErrors: [],
        error: error instanceof Error ? error.message : 'Failed to execute SQL query'
      };
    }
  },
});

export const getTableSchema = tool({
  description: 'Get complete table schema with all columns and data types from BigQuery',
  inputSchema: z.object({
    tableName: z.string().describe('The table name to get schema from'),
    datasetId: z.string().optional().describe('Dataset ID (default: biquery_data)'),
    projectId: z.string().optional().describe('Project ID (default: creatto-463117)')
  }),
  execute: async ({ tableName, datasetId = 'biquery_data', projectId = 'creatto-463117' }) => {
    console.log('🔍 Getting table schema for:', tableName);
    try {
      // Initialize BigQuery service if not already done
      if (!bigQueryService['client']) {
        console.log('⚡ Initializing BigQuery service...');
        await bigQueryService.initialize();
      }
      
      const query = `
        SELECT column_name, data_type 
        FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.COLUMNS\`
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `;
      
      console.log('🔍 Executing schema query:', query);
      const results = await bigQueryService.executeQuery({ query });
      console.log('✅ Schema retrieved for table:', tableName, 'Columns:', results.data?.length || 0);
      
      return {
        columns: results.data || [],
        success: true,
        tableName: tableName,
        datasetId: datasetId,
        projectId: projectId,
        totalColumns: results.data?.length || 0
      };
    } catch (error) {
      console.error('❌ Error getting table schema:', error);
      return {
        columns: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table schema',
        tableName: tableName,
        datasetId: datasetId,
        projectId: projectId,
        totalColumns: 0
      };
    }
  }
});

export const executarMultiplasSQL = tool({
  description: 'Executa múltiplas queries SQL em paralelo no BigQuery para análises relacionadas',
  inputSchema: z.object({
    queries: z.array(z.object({
      nome: z.string().describe('Nome identificador da query'),
      sqlQuery: z.string().describe('Query SQL a executar'),
      descricao: z.string().optional().describe('Descrição da análise'),
      explicacao: z.string().optional().describe('Explicação do que esta query vai analisar')
    })).describe('Array de queries SQL a executar'),
    datasetId: z.string().optional().describe('Dataset ID (padrão: biquery_data)')
  }),
  execute: async ({ queries, datasetId = 'biquery_data' }) => {
    console.log('📋 Executando múltiplas SQL queries:', { totalQueries: queries.length, datasetId });

    try {
      // Initialize BigQuery service if needed
      if (!bigQueryService['client']) {
        console.log('⚡ Inicializando BigQuery service...');
        await bigQueryService.initialize();
      }

      const startTime = Date.now();

      // Execute all queries in parallel
      const queryPromises = queries.map(async (query, index) => {
        const queryStartTime = Date.now();

        try {
          console.log(`🔍 Executando query ${index + 1}: ${query.nome}`);

          const result = await bigQueryService.executeQuery({
            query: query.sqlQuery,
            jobTimeoutMs: 60000 // 60 seconds timeout
          });

          const queryExecutionTime = Date.now() - queryStartTime;
          console.log(`✅ Query ${index + 1} concluída: ${result.data?.length || 0} registros em ${queryExecutionTime}ms`);

          return {
            nome: query.nome,
            success: true,
            sqlQuery: query.sqlQuery,
            descricao: query.descricao,
            explicacao: query.explicacao,
            data: result.data || [],
            schema: result.schema || [],
            totalRows: result.data?.length || 0,
            executionTime: queryExecutionTime,
            queryType: query.sqlQuery.trim().toLowerCase().split(' ')[0].toUpperCase(),
            metadata: {
              generatedAt: new Date().toISOString(),
              dataSource: 'bigquery-sql',
              datasetId: datasetId
            }
          };
        } catch (error) {
          console.error(`❌ Erro na query ${index + 1} (${query.nome}):`, error);
          return {
            nome: query.nome,
            success: false,
            sqlQuery: query.sqlQuery,
            descricao: query.descricao,
            explicacao: query.explicacao,
            data: [],
            schema: [],
            totalRows: 0,
            executionTime: Date.now() - queryStartTime,
            queryType: query.sqlQuery.trim().toLowerCase().split(' ')[0].toUpperCase(),
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            metadata: {
              generatedAt: new Date().toISOString(),
              dataSource: 'bigquery-sql-error',
              datasetId: datasetId
            }
          };
        }
      });

      // Wait for all queries to complete
      const queryResults = await Promise.all(queryPromises);
      const successfulQueries = queryResults.filter(result => result.success);
      const failedQueries = queryResults.filter(result => !result.success);

      const totalExecutionTime = Date.now() - startTime;
      console.log(`🏁 Múltiplas queries concluídas: ${successfulQueries.length}/${queries.length} sucessos em ${totalExecutionTime}ms`);

      return {
        success: true,
        totalQueries: queries.length,
        successfulQueries: successfulQueries.length,
        failedQueries: failedQueries.length,
        results: queryResults,
        summary: {
          total: queries.length,
          successful: successfulQueries.length,
          failed: failedQueries.length,
          datasetId: datasetId,
          totalExecutionTime: totalExecutionTime
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'bigquery-sql-multiple',
          executionMode: 'parallel'
        }
      };

    } catch (error) {
      console.error('❌ Erro geral na execução de múltiplas queries:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao executar múltiplas queries',
        totalQueries: queries.length,
        successfulQueries: 0,
        failedQueries: queries.length,
        results: [],
        summary: {
          total: queries.length,
          successful: 0,
          failed: queries.length,
          datasetId: datasetId,
          totalExecutionTime: 0
        }
      };
    }
  }
});

export const getCampaigns = tool({
  description: 'Get campaigns from Meta Ads table with aggregated metrics',
  inputSchema: z.object({
    tableName: z.string().describe('The table name to get campaigns from'),
    datasetId: z.string().optional().describe('Dataset ID (default: biquery_data)'),
    projectId: z.string().optional().describe('Project ID (default: creatto-463117)'),
    limit: z.number().optional().describe('Maximum number of campaigns to return (default: 100)'),
    dateRange: z.object({
      startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      endDate: z.string().optional().describe('End date (YYYY-MM-DD)')
    }).optional().describe('Date range filter'),
    orderBy: z.string().optional().describe('Order by field (default: total_spend DESC)')
  }),
  execute: async ({ 
    tableName, 
    datasetId = 'biquery_data', 
    projectId = 'creatto-463117', 
    limit = 100,
    dateRange,
    orderBy = 'total_spend DESC'
  }) => {
    console.log('🚀 Getting campaigns for table:', tableName);
    try {
      // Initialize BigQuery service if not already done
      if (!bigQueryService['client']) {
        console.log('⚡ Initializing BigQuery service...');
        await bigQueryService.initialize();
      }
      
      let whereClause = '';
      if (dateRange?.startDate || dateRange?.endDate) {
        const conditions = [];
        if (dateRange.startDate) conditions.push(`Date >= '${dateRange.startDate}'`);
        if (dateRange.endDate) conditions.push(`Date <= '${dateRange.endDate}'`);
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
      
      const query = `
        SELECT 
          \`Campaign ID\` as campaign_id,
          \`Campaign Name\` as campaign_name,
          \`Account Name\` as account_name,
          COUNT(DISTINCT Date) as days_active,
          SUM(Impressions) as total_impressions,
          SUM(\`Amount Spent BRL\`) as total_spend,
          SUM(\`Clicks All\`) as total_clicks,
          ROUND(SUM(\`Clicks All\`) / NULLIF(SUM(Impressions), 0) * 100, 2) as ctr,
          ROUND(SUM(\`Amount Spent BRL\`) / NULLIF(SUM(\`Clicks All\`), 0), 2) as cpc
        FROM \`${projectId}.${datasetId}.${tableName}\`
        ${whereClause}
        GROUP BY \`Campaign ID\`, \`Campaign Name\`, \`Account Name\`
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `;
      
      console.log('🔍 Executing campaigns query:', query);
      const results = await bigQueryService.executeQuery({ query });
      console.log('✅ Campaigns retrieved:', results.data?.length || 0);
      
      return {
        campaigns: results.data || [],
        success: true,
        tableName: tableName,
        datasetId: datasetId,
        projectId: projectId,
        totalCampaigns: results.data?.length || 0,
        dateRange: dateRange
      };
    } catch (error) {
      console.error('❌ Error getting campaigns:', error);
      return {
        campaigns: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get campaigns',
        tableName: tableName,
        datasetId: datasetId,
        projectId: projectId,
        totalCampaigns: 0
      };
    }
  }
});

export const planAnalysis = tool({
  description: 'Trigger AI to create intelligent analysis plan based on conversation context',
  inputSchema: z.object({}), // Sem parâmetros - IA usa contexto da conversa
  execute: async () => {
    console.log('🎯 IA Planning analysis using conversation context');

    return {
      success: true,
      message: 'IA deve analisar o contexto da conversa e criar plano de análise personalizado com formato: {numeroAnalises, analises: [{analise, query, visualizacao}]}'
    };
  }
});

export const getTimelineContext = tool({
  description: 'Get intelligent timeline context using table schema to identify date ranges and periods',
  inputSchema: z.object({
    tableName: z.string().describe('Table name to analyze'),
    schema: z.array(z.object({
      column_name: z.string(),
      data_type: z.string()
    })).describe('Table schema from getTableSchema'),
    datasetId: z.string().optional().describe('Dataset ID (default: biquery_data)'),
    projectId: z.string().optional().describe('Project ID (default: creatto-463117)')
  }),
  execute: async ({ tableName, schema, datasetId = 'biquery_data', projectId = 'creatto-463117' }) => {
    console.log('⏰ Getting timeline context for table:', tableName);

    try {
      // STEP 1: Usar schema para encontrar colunas de data
      const dateColumns = schema.filter(col =>
        col.data_type.includes('DATE') ||
        col.data_type.includes('TIMESTAMP') ||
        col.column_name.toLowerCase().includes('date') ||
        col.column_name.toLowerCase().includes('time') ||
        col.column_name.toLowerCase().includes('created') ||
        col.column_name.toLowerCase().includes('updated')
      );

      if (dateColumns.length === 0) {
        return {
          success: false,
          error: 'Nenhuma coluna de data encontrada no schema',
          tableName,
          dateColumns: []
        };
      }

      // Initialize BigQuery service if not already done
      if (!bigQueryService['client']) {
        console.log('⚡ Initializing BigQuery service...');
        await bigQueryService.initialize();
      }

      // STEP 2: Escolher coluna de data principal (primeira encontrada)
      const primaryDateColumn = dateColumns[0].column_name;

      // STEP 3: UMA query para analisar timeline completa
      const timelineQuery = `
        SELECT
          -- Range de datas
          MIN(DATE(${primaryDateColumn})) as oldest_date,
          MAX(DATE(${primaryDateColumn})) as newest_date,
          DATE_DIFF(MAX(DATE(${primaryDateColumn})), MIN(DATE(${primaryDateColumn})), DAY) as total_days,
          COUNT(*) as total_records,
          COUNT(DISTINCT DATE(${primaryDateColumn})) as unique_days,

          -- Períodos inteligentes baseados nos dados reais
          MAX(DATE(${primaryDateColumn})) as latest_date,
          DATE_SUB(MAX(DATE(${primaryDateColumn})), INTERVAL 7 DAY) as last_7_days_start,
          DATE_SUB(MAX(DATE(${primaryDateColumn})), INTERVAL 30 DAY) as last_30_days_start,
          DATE_SUB(MAX(DATE(${primaryDateColumn})), INTERVAL 90 DAY) as last_90_days_start,

          -- Contagem de dados por período
          COUNTIF(DATE(${primaryDateColumn}) >= DATE_SUB(MAX(DATE(${primaryDateColumn})), INTERVAL 7 DAY)) as records_last_7d,
          COUNTIF(DATE(${primaryDateColumn}) >= DATE_SUB(MAX(DATE(${primaryDateColumn})), INTERVAL 30 DAY)) as records_last_30d,
          COUNTIF(DATE(${primaryDateColumn}) >= DATE_SUB(MAX(DATE(${primaryDateColumn})), INTERVAL 90 DAY)) as records_last_90d

        FROM \`${projectId}.${datasetId}.${tableName}\`
        WHERE ${primaryDateColumn} IS NOT NULL
      `;

      console.log('🔍 Executing timeline analysis query:', timelineQuery);
      const startTime = Date.now();

      // STEP 4: Executar query via BigQuery service
      const result = await bigQueryService.executeQuery({ query: timelineQuery });
      const data = (result as unknown as TimelineData[])[0]; // Primeira linha tem todos os dados

      const executionTime = Date.now() - startTime;
      console.log('✅ Timeline analysis completed in', executionTime, 'ms');

      // STEP 5: Processar e retornar contexto inteligente
      const dataQuality = data.total_days > 0 ? (data.unique_days / data.total_days) : 0;

      return {
        success: true,
        tableName,
        datasetId,
        projectId,
        primaryDateColumn,
        executionTime,

        detectedDateColumns: dateColumns,

        timelineOverview: {
          oldestRecord: data.oldest_date,
          newestRecord: data.newest_date,
          totalDays: data.total_days,
          totalRecords: data.total_records,
          uniqueDays: data.unique_days,
          dataQuality: Math.round(dataQuality * 100), // % de dias com dados
          coverageDays: `${data.unique_days} de ${data.total_days} dias com dados`
        },

        suggestedPeriods: {
          last7Days: {
            label: 'Últimos 7 dias',
            start: data.last_7_days_start,
            end: data.latest_date,
            recordCount: data.records_last_7d,
            sqlCondition: `${primaryDateColumn} >= '${data.last_7_days_start}'`,
            recommended: data.records_last_7d > 10
          },
          last30Days: {
            label: 'Últimos 30 dias',
            start: data.last_30_days_start,
            end: data.latest_date,
            recordCount: data.records_last_30d,
            sqlCondition: `${primaryDateColumn} >= '${data.last_30_days_start}'`,
            recommended: data.records_last_30d > 50
          },
          last90Days: {
            label: 'Últimos 90 dias',
            start: data.last_90_days_start,
            end: data.latest_date,
            recordCount: data.records_last_90d,
            sqlCondition: `${primaryDateColumn} >= '${data.last_90_days_start}'`,
            recommended: data.records_last_90d > 100
          }
        },

        recommendations: {
          bestPeriod: data.records_last_30d > 50 ? 'last30Days' : data.records_last_90d > 100 ? 'last90Days' : 'fullRange',
          dataFreshness: data.records_last_7d > 0 ? 'fresh' : 'stale',
          analysisReadiness: data.total_records > 100 ? 'ready' : 'limited',
          suggestedAnalysis: data.records_last_30d > 50 ? 'Dados suficientes para análise dos últimos 30 dias' : 'Recomendado análise de período maior (90+ dias)'
        },

        sqlExamples: {
          recentData: `SELECT * FROM \`${projectId}.${datasetId}.${tableName}\` WHERE ${primaryDateColumn} >= '${data.last_30_days_start}' ORDER BY ${primaryDateColumn} DESC`,
          dailyAggregation: `SELECT DATE(${primaryDateColumn}) as date, COUNT(*) as records FROM \`${projectId}.${datasetId}.${tableName}\` WHERE ${primaryDateColumn} >= '${data.last_30_days_start}' GROUP BY DATE(${primaryDateColumn}) ORDER BY date`,
          fullTimelineOverview: `SELECT DATE(${primaryDateColumn}) as date, COUNT(*) as records FROM \`${projectId}.${datasetId}.${tableName}\` GROUP BY DATE(${primaryDateColumn}) ORDER BY date`
        }
      };

    } catch (error) {
      console.error('❌ Error getting timeline context:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get timeline context',
        tableName,
        dateColumns: []
      };
    }
  }
});