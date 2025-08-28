import { executarSQL } from '@/tools/bigquery';

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

    console.log('📘 EXECUTE-SQL API: Executando SQL via tool existente:', sqlQuery);

    // Usar a tool existente que já funciona nos agentes (roda no servidor)
    const result = await executarSQL.execute({
      sqlQuery: sqlQuery.trim()
    });

    console.log('✅ EXECUTE-SQL API: Tool executada com sucesso:', result.success);
    console.log('📊 EXECUTE-SQL API: Linhas retornadas:', result.rowsReturned);
    console.log('⏱️ EXECUTE-SQL API: Tempo de execução:', result.executionTime, 'ms');

    return Response.json(result);

  } catch (error) {
    console.error('❌ EXECUTE-SQL API ERROR:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');

    return Response.json({
      sqlQuery: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute SQL query',
      data: [],
      schema: [],
      rowsReturned: 0,
      executionTime: 0
    }, { status: 500 });
  }
}