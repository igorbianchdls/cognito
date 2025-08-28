import { bigQueryService } from '@/services/bigquery';
import type { ExecuteSQLRequest, ExecuteSQLResponse } from '@/components/sql-editor/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('📘 EXECUTE-SQL API: Request recebido');
  
  try {
    const body: ExecuteSQLRequest = await req.json();
    const { sqlQuery } = body;

    if (!sqlQuery?.trim()) {
      console.log('❌ EXECUTE-SQL API: SQL query vazia');
      return Response.json({
        data: [],
        schema: [],
        rowsReturned: 0,
        executionTime: 0,
        success: false,
        error: 'SQL query is required',
        sqlQuery: ''
      } as ExecuteSQLResponse, { status: 400 });
    }

    console.log('📘 EXECUTE-SQL API: Executando SQL:', sqlQuery);

    // Initialize BigQuery service if needed
    if (!bigQueryService['client']) {
      console.log('⚡ EXECUTE-SQL API: Inicializando BigQuery service...');
      await bigQueryService.initialize();
    }

    const startTime = Date.now();
    const result = await bigQueryService.executeQuery({ query: sqlQuery });
    const executionTime = Date.now() - startTime;

    console.log('✅ EXECUTE-SQL API: Query executada com sucesso');
    console.log('📊 EXECUTE-SQL API: Linhas retornadas:', result.data?.length || 0);
    console.log('⏱️ EXECUTE-SQL API: Tempo de execução:', executionTime, 'ms');

    const response: ExecuteSQLResponse = {
      data: result.data || [],
      schema: result.schema || [],
      rowsReturned: result.data?.length || 0,
      executionTime: executionTime,
      bytesProcessed: result.bytesProcessed,
      success: true,
      sqlQuery: sqlQuery
    };

    return Response.json(response);

  } catch (error) {
    console.error('❌ EXECUTE-SQL API ERROR:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');

    const response: ExecuteSQLResponse = {
      data: [],
      schema: [],
      rowsReturned: 0,
      executionTime: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute SQL query',
      sqlQuery: ''
    };

    return Response.json(response, { status: 500 });
  }
}