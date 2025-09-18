import { NextRequest, NextResponse } from 'next/server'
import { bigQueryService } from '@/services/bigquery'

// Tipo para dados retornados do BigQuery (copiado de visualization.ts)
type BigQueryRowData = Record<string, unknown>;

// Função para gerar SQL automaticamente (copiada de visualization.ts)
const generateSQL = (tipo: string, x: string, y: string, tabela: string, agregacao?: string): string => {
  const defaultAgregacao = tipo === 'pie' ? 'COUNT' : 'SUM';
  const funcaoAgregacao = agregacao || defaultAgregacao;

  switch (tipo) {
    case 'bar':
    case 'line':
    case 'horizontal-bar':
    case 'area':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
      }
      return `SELECT ${x}, ${funcaoAgregacao}(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
    case 'pie':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY count DESC LIMIT 10`;
      }
      return `SELECT ${x}, ${funcaoAgregacao}(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${funcaoAgregacao}(${y}) DESC LIMIT 10`;
    case 'kpi':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT COUNT(*) as total FROM ${tabela}`;
      }
      return `SELECT ${funcaoAgregacao}(${y}) as total FROM ${tabela}`;
    default:
      return `SELECT ${x}, ${y} FROM ${tabela} LIMIT 50`;
  }
};

// Função para processar dados BigQuery (copiada de visualization.ts)
const processDataForChart = (data: BigQueryRowData[], x: string, y: string, tipo: string) => {
  if (tipo === 'kpi') {
    const total = data[0]?.total || 0;
    return { value: Number(total) };
  }

  return data.map(row => ({
    x: String(row[x] || 'N/A'),
    y: Number(row[y] || row.count || 0),
    label: String(row[x] || 'N/A'),
    value: Number(row[y] || row.count || 0)
  }));
};

export async function POST(request: NextRequest) {
  console.log('🚀 Dashboard BigQuery API endpoint called');

  try {
    // Inicializar BigQuery service se necessário (mesmo padrão /api/bigquery)
    if (!bigQueryService['client']) {
      console.log('⚡ Inicializando BigQuery service...');
      await bigQueryService.initialize();
    }

    // Parse request body
    const { type, dataSource } = await request.json();
    const { table, x, y, aggregation } = dataSource;

    // 📥 Request received log
    console.log('📥 API /dashboard-bigquery called with:', {
      type,
      dataSource,
      parsedFields: { table, x, y, aggregation }
    });

    // Gerar SQL automaticamente (mesmo padrão da tool gerarGrafico)
    const sqlQuery = generateSQL(type, x, y || 'quantity', table, aggregation);

    // 🔍 SQL generation log
    console.log('🔍 Generated SQL:', {
      sqlQuery,
      inputs: { type, x, y: y || 'quantity', table, aggregation },
      defaultAggregation: type === 'pie' ? 'COUNT' : 'SUM'
    });

    // Executar query no BigQuery (mesmo padrão da tool gerarGrafico)
    const result = await bigQueryService.executeQuery({
      query: sqlQuery,
      jobTimeoutMs: 30000
    });

    const rawData = result.data || [];

    // 📊 BigQuery result log
    console.log('📊 BigQuery raw result:', {
      dataLength: rawData.length,
      firstRow: rawData[0],
      lastRow: rawData[rawData.length - 1],
      allData: rawData.slice(0, 3) // First 3 rows for debugging
    });

    // Processar dados para formato dos charts (mesmo padrão da tool gerarGrafico)
    const processedData = processDataForChart(rawData, x, y || 'quantity', type);

    // ✅ Data processing log
    console.log('✅ Processed data:', {
      inputType: type,
      outputType: typeof processedData,
      isArray: Array.isArray(processedData),
      processedData: processedData,
      processingInputs: { x, y: y || 'quantity', type }
    });

    const responsePayload = {
      success: true,
      data: processedData,
      sql: sqlQuery,
      totalRecords: rawData.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'bigquery-dashboard'
      }
    };

    // 📤 Response log
    console.log('📤 API response:', responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('❌ Error in dashboard BigQuery API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}