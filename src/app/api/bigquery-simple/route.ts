import { BigQuery } from '@google-cloud/bigquery';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'test';
  
  console.log(`🚀 Starting simple BigQuery ${action}...`);
  
  try {
    console.log('📁 Creating BigQuery client with creatto.json...');
    
    const bigquery = new BigQuery({
      keyFilename: './credentials/creatto.json',
      projectId: 'creatto-463117'
    });

    console.log('✅ BigQuery client created successfully');
    
    if (action === 'datasets') {
      console.log('📋 Listing datasets...');
      const [datasets] = await bigquery.getDatasets();
      
      const datasetInfos = await Promise.all(
        datasets.map(async (dataset) => {
          try {
            const [metadata] = await dataset.getMetadata();
            return {
              id: dataset.id,
              friendlyName: metadata.friendlyName,
              description: metadata.description,
              location: metadata.location,
              creationTime: metadata.creationTime ? new Date(parseInt(metadata.creationTime)) : undefined,
            };
          } catch (error) {
            console.warn(`⚠️ Failed to get metadata for dataset ${dataset.id}:`, error);
            return {
              id: dataset.id,
            };
          }
        })
      );
      
      console.log(`🎉 Found ${datasetInfos.length} datasets`);
      return NextResponse.json({ 
        success: true, 
        message: `Encontrados ${datasetInfos.length} datasets`, 
        data: datasetInfos,
        timestamp: new Date().toISOString()
      });
    } else {
      // Teste básico
      console.log('🔍 Executing test query...');
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
    }
    
  } catch (error) {
    console.error('❌ Error in simple BigQuery test:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', (error as any)?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}