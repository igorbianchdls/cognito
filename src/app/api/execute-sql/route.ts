import { bigQueryService } from '@/services/bigquery';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { sqlQuery } = await req.json();
    
    if (!sqlQuery) {
      return Response.json({ success: false, error: 'SQL query is required' }, { status: 400 });
    }

    await bigQueryService.initialize();
    const result = await bigQueryService.executeQuery({ query: sqlQuery });
    
    return Response.json({
      data: result.data || [],
      schema: result.schema || [],
      success: true
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Query failed'
    }, { status: 500 });
  }
}