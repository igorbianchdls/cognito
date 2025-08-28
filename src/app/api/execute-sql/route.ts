import { bigQueryService } from '@/services/bigquery';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('📘 EXECUTE-SQL API: Request recebido');
  
  try {
    const { sqlQuery } = await req.json();

    if (!sqlQuery?.trim()) {
      console.log('❌ EXECUTE-SQL API: SQL query vazia');
      return Response.json({
        sqlQuery: '',
        success: false,
        error: 'SQL query is required',
        data: [],
        schema: [],
        rowsReturned: 0,
        executionTime: 0
      }, { status: 400 });
    }

    console.log('📘 EXECUTE-SQL API: Executando SQL:', sqlQuery);

    // Lógica extraída da tool executarSQL - mesma implementação
    try {
      // Initialize BigQuery service if not already done
      if (!bigQueryService['client']) {
        console.log('⚡ Initializing BigQuery service...');
        await bigQueryService.initialize();
      }

      const queryType = sqlQuery.trim().toLowerCase().split(' ')[0];
      const startTime = Date.now();

      // Execute the actual query
      console.log('🔍 Executing SQL query:', sqlQuery);
      const result = await bigQueryService.executeQuery({ query: sqlQuery });
      
      const executionTime = Date.now() - startTime;
      console.log('✅ SQL query executed successfully in', executionTime, 'ms');
      console.log('📈 Rows returned:', result.data?.length || 0);

      const response = {
        sqlQuery,
        datasetId: 'default-dataset',
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

      return Response.json(response);

    } catch (error) {
      console.error('❌ Error executing SQL query:', error);
      
      const errorResponse = {
        sqlQuery,
        datasetId: 'default-dataset',
        queryType: sqlQuery.trim().toLowerCase().split(' ')[0].toUpperCase(),
        dryRun: false,
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

      return Response.json(errorResponse, { status: 500 });
    }

  } catch (error) {
    console.error('❌ EXECUTE-SQL API ERROR:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');

    return Response.json({
      sqlQuery: '',
      success: false,
      error: error instanceof Error ? error.message : 'Request processing failed',
      data: [],
      schema: [],
      rowsReturned: 0,
      executionTime: 0
    }, { status: 500 });
  }
}