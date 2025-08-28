import { bigQueryService } from '@/services/bigquery';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { sqlQuery } = await req.json();
    
    if (!sqlQuery) {
      return Response.json({ success: false, error: 'SQL query is required' }, { status: 400 });
    }

    // Initialize BigQuery service if not already done (same pattern as tools)
    if (!(bigQueryService as any)['client']) {
      console.log('⚡ Initializing BigQuery service for execute-sql...');
      await bigQueryService.initialize();
    }
    
    console.log('🔍 Executing SQL query via execute-sql endpoint:', sqlQuery);
    const result = await bigQueryService.executeQuery({ query: sqlQuery });
    console.log('✅ SQL query executed successfully via execute-sql, rows:', result.data?.length || 0);
    
    return Response.json({
      data: result.data || [],
      schema: result.schema || [],
      success: true
    });

  } catch (error) {
    console.error('❌ Error in execute-sql endpoint:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Query failed'
    }, { status: 500 });
  }
}