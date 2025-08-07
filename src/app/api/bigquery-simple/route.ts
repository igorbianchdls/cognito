import { BigQuery } from '@google-cloud/bigquery';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🚀 Starting simple BigQuery test...');
  
  try {
    console.log('📁 Creating BigQuery client with creatto.json...');
    
    const bigquery = new BigQuery({
      keyFilename: './credentials/creatto.json',
      projectId: 'creatto-463117'
    });

    console.log('✅ BigQuery client created successfully');
    console.log('🔍 Executing test query...');

    // Teste básico primeiro
    const query = 'SELECT 1 as test_number, "BigQuery funcionando!" as test_message, CURRENT_TIMESTAMP() as timestamp';
    
    const [job] = await bigquery.createQueryJob({ 
      query,
      location: 'US' 
    });
    
    console.log('⏳ Waiting for query results...');
    const [rows] = await job.getQueryResults();
    
    console.log('🎉 Query executed successfully!');
    console.log('📊 Results:', rows);
    
    return NextResponse.json({ 
      success: true, 
      message: "BigQuery conectado com sucesso!", 
      query_executed: query,
      results: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in simple BigQuery test:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}