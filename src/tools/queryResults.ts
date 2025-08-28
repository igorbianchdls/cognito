import { tool } from 'ai';
import { z } from 'zod';
import { getLastQueryDataWithLog } from '@/stores/queryStore';

export const getLastQueryResults = tool({
  description: 'Get data from the last executed SQL query for analysis. Use this when user asks to analyze data after running a SQL query.',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('🔍 Getting last query results for AI analysis');
    
    try {
      const startTime = Date.now();
      const data = getLastQueryDataWithLog();
      
      if (!data || data.length === 0) {
        return {
          sqlQuery: "Last query results",
          success: false,
          error: "No query results available. Please execute a SQL query first.",
          data: [],
          schema: [],
          rowsReturned: 0,
          executionTime: 0,
          message: 'No cached query results found'
        };
      }

      console.log('✅ Query results retrieved:', data.length, 'rows');
      const executionTime = Date.now() - startTime;
      
      // Generate basic schema from first row
      const schema = data.length > 0 ? Object.keys(data[0]).map(key => ({
        name: key,
        type: typeof data[0][key] === 'number' ? 'NUMERIC' : 'STRING',
        mode: 'NULLABLE'
      })) : [];

      return {
        sqlQuery: "Cached query results from last execution",
        success: true,
        data: data,
        schema: schema,
        rowsReturned: data.length,
        executionTime: executionTime,
        message: `Retrieved ${data.length} rows from cached query results`
      };
    } catch (error) {
      console.error('❌ Error getting query results:', error);
      return {
        sqlQuery: "Last query results",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error retrieving query results',
        data: [],
        schema: [],
        rowsReturned: 0,
        executionTime: 0,
        message: 'Error retrieving cached query results'
      };
    }
  }
});