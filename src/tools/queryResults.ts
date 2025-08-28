import { tool } from 'ai';
import { z } from 'zod';
import { $lastQueryData } from '@/stores/queryStore';

export const getLastQueryResults = tool({
  description: 'Get data from the last executed SQL query for analysis. Use this when user asks to analyze data after running a SQL query.',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('🔍 Getting last query results for AI analysis');
    
    try {
      const data = $lastQueryData.get();
      
      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'No query results available. Please execute a SQL query first.',
          data: [],
          rowCount: 0
        };
      }

      console.log('✅ Query results retrieved:', data.length, 'rows');
      
      return {
        success: true,
        message: `Retrieved ${data.length} rows from last query execution`,
        data: data,
        rowCount: data.length
      };
    } catch (error) {
      console.error('❌ Error getting query results:', error);
      return {
        success: false,
        message: 'Error retrieving query results',
        data: [],
        rowCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});