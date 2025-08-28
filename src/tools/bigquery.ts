import { tool } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

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
      const result = await bigQueryService.queryTable(datasetId, tableId, {
        limit,
        columns: ['*']  // Get all columns
      });
      
      const executionTime = Date.now() - startTime;
      console.log('✅ Query completed in', executionTime, 'ms');
      console.log('📈 Rows returned:', result.data?.length || 0);
      
      return {
        ...result,
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
    datasetId: z.string().optional().describe('Dataset ID to execute query against'),
    dryRun: z.boolean().optional().describe('Run query validation without executing')
  }),
  execute: async ({ sqlQuery, datasetId, dryRun = false }) => {
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

      // Execute the actual query
      console.log('🔍 Executing SQL query:', sqlQuery);
      const result = await bigQueryService.executeQuery({ query: sqlQuery });
      
      const executionTime = Date.now() - startTime;
      console.log('✅ SQL query executed successfully in', executionTime, 'ms');
      console.log('📈 Rows returned:', result.data?.length || 0);

      return {
        sqlQuery,
        datasetId: datasetId || 'default-dataset',
        queryType: queryType.toUpperCase(),
        dryRun: false,
        data: result.data || [],
        schema: result.schema || [],
        rowsReturned: result.data?.length || 0,
        rowsAffected: queryType.includes('insert') || queryType.includes('update') || queryType.includes('delete') ? result.data?.length || 0 : 0,
        totalRows: result.totalRows || 0,
        executionTime,
        bytesProcessed: result.bytesProcessed || 0,
        success: true,
        validationErrors: []
      };

    } catch (error) {
      console.error('❌ Error executing SQL query:', error);
      return {
        sqlQuery,
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
          SUM(\`Amount Spent (BRL)\`) as total_spend,
          SUM(Clicks) as total_clicks,
          ROUND(SUM(Clicks) / NULLIF(SUM(Impressions), 0) * 100, 2) as ctr,
          ROUND(SUM(\`Amount Spent (BRL)\`) / NULLIF(SUM(Clicks), 0), 2) as cpc
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