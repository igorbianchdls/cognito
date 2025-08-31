import { tool } from 'ai';
import { z } from 'zod';
import { getLastQueryDataWithLog } from '@/stores/apps/queryStore';

export const getLastQueryResults = tool({
  description: 'Get data from the last executed SQL query for analysis. Use this when user asks to analyze data after running a SQL query.',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('🔍 STEP 1: getLastQueryResults tool starting');
    console.log('🔍 STEP 2: About to call getLastQueryDataWithLog');
    
    try {
      const startTime = Date.now();
      console.log('🔍 STEP 3: Calling getLastQueryDataWithLog...');
      const data = getLastQueryDataWithLog();
      console.log('🔍 STEP 4: Data retrieved from store:', data ? 'HAS DATA' : 'NULL/EMPTY');
      console.log('🔍 STEP 5: Data type check:', typeof data, Array.isArray(data));
      console.log('🔍 STEP 6: Data length check:', data ? data.length : 'N/A');
      
      if (!data || data.length === 0) {
        console.log('🔍 STEP 7: No data found, returning error response');
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

      console.log('🔍 STEP 8: Found data, processing...');
      console.log('✅ Query results retrieved:', data.length, 'rows');
      const executionTime = Date.now() - startTime;
      
      console.log('🔍 STEP 9: Generating schema...');
      // Generate basic schema from first row
      const schema = data.length > 0 ? Object.keys(data[0]).map(key => ({
        name: key,
        type: typeof data[0][key] === 'number' ? 'NUMERIC' : 'STRING',
        mode: 'NULLABLE'
      })) : [];
      
      console.log('🔍 STEP 10: Returning success response with', data.length, 'rows');
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
      console.log('🔍 STEP ERROR: Exception caught in tool execution');
      console.error('❌ Error getting query results:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
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