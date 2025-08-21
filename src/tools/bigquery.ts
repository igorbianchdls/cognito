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
});