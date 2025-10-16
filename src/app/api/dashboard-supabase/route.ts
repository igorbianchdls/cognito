import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/postgres';

// Tipo para dados retornados do Supabase
type SupabaseRowData = Record<string, unknown>;

// Função para gerar SQL PostgreSQL automaticamente
const generatePostgreSQLQuery = (tipo: string, x: string, y: string, tabela: string, agregacao?: string, schema = 'trafego_pago'): string => {
  const defaultAgregacao = tipo === 'pie' ? 'COUNT' : 'SUM';
  const funcaoAgregacao = agregacao || defaultAgregacao;

  // Build qualified table name for PostgreSQL
  const qualifiedTable = `"${schema}"."${tabela}"`;

  switch (tipo) {
    case 'bar':
    case 'line':
    case 'horizontal-bar':
    case 'area':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT "${x}", COUNT(*) as count FROM ${qualifiedTable} GROUP BY "${x}" ORDER BY "${x}" LIMIT 50`;
      }
      return `SELECT "${x}", ${funcaoAgregacao}("${y}") as value FROM ${qualifiedTable} GROUP BY "${x}" ORDER BY "${x}" LIMIT 50`;
    
    case 'pie':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT "${x}", COUNT(*) as count FROM ${qualifiedTable} GROUP BY "${x}" ORDER BY count DESC LIMIT 10`;
      }
      return `SELECT "${x}", ${funcaoAgregacao}("${y}") as value FROM ${qualifiedTable} GROUP BY "${x}" ORDER BY value DESC LIMIT 10`;
    
    case 'kpi':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT COUNT(*) as total FROM ${qualifiedTable}`;
      }
      return `SELECT ${funcaoAgregacao}("${y}") as total FROM ${qualifiedTable}`;
    
    default:
      return `SELECT "${x}", "${y}" FROM ${qualifiedTable} LIMIT 50`;
  }
};

// Função para processar dados Supabase para formato dos charts
const processDataForChart = (data: SupabaseRowData[], x: string, y: string, tipo: string) => {
  if (tipo === 'kpi') {
    const total = data[0]?.total || 0;
    return { value: Number(total) };
  }

  return data.map(row => ({
    x: String(row[x] || 'N/A'),
    y: Number(row.value || row.count || 0),
    label: String(row[x] || 'N/A'),
    value: Number(row.value || row.count || 0)
  }));
};

export async function POST(request: NextRequest) {
  console.log('🚀 Dashboard Supabase API endpoint called');

  try {
    // Parse request body
    const { type, dataSource } = await request.json();
    const { table, x, y, aggregation, schema = 'trafego_pago' } = dataSource;

    // 📥 Request received log
    console.log('📥 API /dashboard-supabase called with:', {
      type,
      dataSource,
      parsedFields: { table, x, y, aggregation, schema }
    });

    // Check if SUPABASE_DB_URL is configured
    if (!process.env.SUPABASE_DB_URL) {
      console.log('🔧 SUPABASE_DB_URL not configured, returning mock data for demo');
      
      // Return mock data for demonstration
      const mockData = generateMockData(type, x, y, table);
      
      return NextResponse.json({
        success: true,
        data: mockData,
        sql_query: `-- Mock data: SUPABASE_DB_URL not configured\n-- Would execute: ${generatePostgreSQLQuery(type, x, y || 'impressao', table, aggregation, schema)}`,
        totalRecords: Array.isArray(mockData) ? mockData.length : 1,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'mock-demo',
          schema,
          table,
          note: 'Using mock data - configure SUPABASE_DB_URL for real data'
        }
      });
    }

    // Gerar SQL automaticamente para PostgreSQL
    const sqlQuery = generatePostgreSQLQuery(type, x, y || 'impressao', table, aggregation, schema);

    // 🔍 SQL generation log
    console.log('🔍 Generated PostgreSQL:', {
      sqlQuery,
      inputs: { type, x, y: y || 'impressao', table, aggregation, schema },
      defaultAggregation: type === 'pie' ? 'COUNT' : 'SUM'
    });

    // Executar query no Supabase via PostgreSQL
    const rawData = await runQuery<SupabaseRowData>(sqlQuery);

    // 📊 Supabase result log
    console.log('📊 Supabase raw result:', {
      dataLength: rawData.length,
      firstRow: rawData[0],
      lastRow: rawData[rawData.length - 1],
      allData: rawData.slice(0, 3) // First 3 rows for debugging
    });

    // Processar dados para formato dos charts
    const processedData = processDataForChart(rawData, x, y || 'impressao', type);

    // ✅ Data processing log
    console.log('✅ Processed data:', {
      inputType: type,
      outputType: typeof processedData,
      isArray: Array.isArray(processedData),
      processedData: processedData,
      processingInputs: { x, y: y || 'impressao', type }
    });

    const responsePayload = {
      success: true,
      data: processedData,
      sql_query: sqlQuery,
      totalRecords: rawData.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'supabase',
        schema,
        table
      }
    };

    // 📤 Response log
    console.log('📤 API response:', responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('❌ Error in dashboard Supabase API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate mock data for demonstration when SUPABASE_DB_URL is not configured
function generateMockData(type: string, x: string, y: string, table: string) {
  if (type === 'kpi') {
    return { value: Math.floor(Math.random() * 100000) + 50000 };
  }

  const platforms = ['Facebook', 'Google', 'Instagram', 'TikTok'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];
  
  if (x === 'plataforma' || x === 'platform') {
    return platforms.map(platform => ({
      x: platform,
      y: Math.floor(Math.random() * 10000) + 1000,
      label: platform,
      value: Math.floor(Math.random() * 10000) + 1000
    }));
  }
  
  if (x === 'dispositivo' || x === 'device') {
    return devices.map(device => ({
      x: device,
      y: Math.floor(Math.random() * 5000) + 500,
      label: device,
      value: Math.floor(Math.random() * 5000) + 500
    }));
  }
  
  // Default mock data
  return Array.from({ length: 5 }, (_, i) => ({
    x: `Item ${i + 1}`,
    y: Math.floor(Math.random() * 1000) + 100,
    label: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 1000) + 100
  }));
}