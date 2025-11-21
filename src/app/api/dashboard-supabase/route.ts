import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/postgres';
import type { DateRangeFilter } from '@/stores/visualBuilderStore';

// Tipo para dados retornados do Supabase
type SupabaseRowData = Record<string, unknown>;

// Helper function to calculate date range
function calculateDateRange(filter: DateRangeFilter): { startDate: string, endDate: string } {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  switch (filter.type) {
    case 'today':
      return { startDate: formatDate(today), endDate: formatDate(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      return { startDate: formatDate(y), endDate: formatDate(y) };
    }
    case 'last_7_days':
      const weekAgo = new Date(today);
      // Inclusivo: hoje e os 6 dias anteriores = 7 dias
      weekAgo.setDate(today.getDate() - 6);
      return {
        startDate: formatDate(weekAgo),
        endDate: formatDate(today)
      };
    case 'last_14_days': {
      const d = new Date(today);
      // Inclusivo: hoje e os 13 dias anteriores = 14 dias
      d.setDate(today.getDate() - 13);
      return { startDate: formatDate(d), endDate: formatDate(today) };
    }
      
    case 'last_30_days':
      const monthAgo = new Date(today);
      // Inclusivo: hoje e os 29 dias anteriores = 30 dias
      monthAgo.setDate(today.getDate() - 29);
      return {
        startDate: formatDate(monthAgo),
        endDate: formatDate(today)
      };
      
    case 'last_90_days':
      const quarterAgo = new Date(today);
      // Inclusivo: hoje e os 89 dias anteriores = 90 dias
      quarterAgo.setDate(today.getDate() - 89);
      return {
        startDate: formatDate(quarterAgo),
        endDate: formatDate(today)
      };
      
    case 'current_month':
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(today)
      };
      
    case 'last_month':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: formatDate(lastMonthStart),
        endDate: formatDate(lastMonthEnd)
      };
      
    case 'custom':
      const customMonthAgo = new Date(today);
      customMonthAgo.setDate(today.getDate() - 30);
      return {
        startDate: filter.startDate || formatDate(customMonthAgo),
        endDate: filter.endDate || formatDate(today)
      };
      
    default:
      const defaultMonthAgo = new Date(today);
      // Inclusivo: hoje e os 29 dias anteriores = 30 dias
      defaultMonthAgo.setDate(today.getDate() - 29);
      return {
        startDate: formatDate(defaultMonthAgo),
        endDate: formatDate(today)
      };
  }
}

// Função para gerar SQL PostgreSQL automaticamente
const generatePostgreSQLQuery = (
  tipo: string, 
  x: string, 
  y: string, 
  tabela: string, 
  agregacao?: string, 
  schema = 'marketing',
  dateFilter?: DateRangeFilter
): string => {
  const defaultAgregacao = tipo === 'pie' ? 'COUNT' : 'SUM';
  const funcaoAgregacaoRaw = agregacao || defaultAgregacao;
  const funcaoAgregacao = String(funcaoAgregacaoRaw).toUpperCase();

  // Build qualified table name for PostgreSQL
  const qualifiedTable = `"${schema}"."${tabela}"`;

  // Build date filter condition (using vendas.vw_pedidos_completo date column)
  let dateCondition = '';
  if (dateFilter) {
    const { startDate, endDate } = calculateDateRange(dateFilter);
    dateCondition = ` AND "data_pedido" >= '${startDate}' AND "data_pedido" <= '${endDate}'`;
  }

  switch (tipo) {
    case 'bar':
    case 'horizontal-bar':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT "${x}", COUNT(*) as count FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY count DESC LIMIT 50`;
      }
      if (funcaoAgregacao === 'COUNT_DISTINCT') {
        return `SELECT "${x}", COUNT(DISTINCT "${y}") as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY value DESC LIMIT 50`;
      }
      return `SELECT "${x}", ${funcaoAgregacao}("${y}") as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY value DESC LIMIT 50`;
    
    case 'line':
    case 'area':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT "${x}", COUNT(*) as count FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY "${x}" LIMIT 50`;
      }
      if (funcaoAgregacao === 'COUNT_DISTINCT') {
        return `SELECT "${x}", COUNT(DISTINCT "${y}") as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY "${x}" LIMIT 50`;
      }
      return `SELECT "${x}", ${funcaoAgregacao}("${y}") as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY "${x}" LIMIT 50`;
    
    case 'pie':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT "${x}", COUNT(*) as count FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY count DESC LIMIT 10`;
      }
      if (funcaoAgregacao === 'COUNT_DISTINCT') {
        return `SELECT "${x}", COUNT(DISTINCT "${y}") as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY value DESC LIMIT 10`;
      }
      return `SELECT "${x}", ${funcaoAgregacao}("${y}") as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY value DESC LIMIT 10`;
    
    case 'kpi':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT COUNT(*) as total FROM ${qualifiedTable} WHERE 1=1${dateCondition}`;
      }
      if (funcaoAgregacao === 'COUNT_DISTINCT') {
        return `SELECT COUNT(DISTINCT "${y}") as total FROM ${qualifiedTable} WHERE 1=1${dateCondition}`;
      }
      return `SELECT ${funcaoAgregacao}("${y}") as total FROM ${qualifiedTable} WHERE 1=1${dateCondition}`;
    
    default:
      return `SELECT "${x}", "${y}" FROM ${qualifiedTable} WHERE 1=1${dateCondition} LIMIT 50`;
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
    const { type, dataSource, filters } = await request.json();
    const { table, x, y, aggregation, schema = 'marketing' } = dataSource;
    const dateFilter = filters?.dateRange;

    // 📥 Request received log
    console.log('📥 API /dashboard-supabase called with:', {
      type,
      dataSource,
      filters,
      parsedFields: { table, x, y, aggregation, schema, dateFilter }
    });

    // Check if SUPABASE_DB_URL is configured
    if (!process.env.SUPABASE_DB_URL) {
      console.log('🔧 SUPABASE_DB_URL not configured, returning mock data for demo');
      
      // Return mock data for demonstration
      const mockData = generateMockData(type, x, y, table);
      
      return NextResponse.json({
        success: true,
        data: mockData,
        sql_query: `-- Mock data: SUPABASE_DB_URL not configured\n-- Would execute: ${generatePostgreSQLQuery(type, x, y || 'impressao', table, aggregation, schema, dateFilter)}`,
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

    // KPIs: calcular período atual vs período anterior
    if (type === 'kpi') {
      const yCol = y || 'impressao';
      // Infer aggregation when not provided: if column looks like an ID or a name, use COUNT_DISTINCT; else SUM.
      let agg = (aggregation || '').toString();
      if (!agg) {
        const lower = String(yCol).toLowerCase();
        agg = (lower.endsWith('_id') || lower.endsWith('id') || lower.endsWith('nome')) ? 'COUNT_DISTINCT' : 'SUM';
      }
      const aggUpper = agg.toUpperCase();
      const aggExpr = (col: string) => (aggUpper === 'COUNT')
        ? 'COUNT(*)'
        : (aggUpper === 'COUNT_DISTINCT') ? `COUNT(DISTINCT "${col}")` : `${aggUpper}("${col}")`;
      const { startDate, endDate } = calculateDateRange(dateFilter || { type: 'last_30_days' });
      const start = new Date(startDate);
      const end = new Date(endDate);
      const ms = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 24 * 3600 * 1000);
      const prevStart = new Date(prevEnd.getTime() - ms);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      const days = Math.max(1, Math.round(ms / (24 * 3600 * 1000)) + 1);
      const comparisonLabel = days === 1 ? 'VS DIA ANTERIOR' : `VS ${days} DIAS ANTERIORES`;

      const qualifiedTable = `"${schema}"."${table}"`;
      const sqlKPI = `WITH current AS (
        SELECT ${aggExpr(yCol)} AS total
        FROM ${qualifiedTable}
        WHERE "data_pedido" >= '${startDate}' AND "data_pedido" <= '${endDate}'
      ), previous AS (
        SELECT ${aggExpr(yCol)} AS total
        FROM ${qualifiedTable}
        WHERE "data_pedido" >= '${fmt(prevStart)}' AND "data_pedido" <= '${fmt(prevEnd)}'
      )
      SELECT current.total AS current_value, previous.total AS previous_value FROM current, previous`;

      const rows = await runQuery<{ current_value: number; previous_value: number }>(sqlKPI);
      const currentVal = Number(rows[0]?.current_value || 0);
      const previousVal = Number(rows[0]?.previous_value || 0);
      const changePct = previousVal ? ((currentVal - previousVal) / Math.abs(previousVal)) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: { value: currentVal, previousValue: previousVal, changePct, comparisonLabel },
        sql_query: sqlKPI,
        totalRecords: 1,
        metadata: { generatedAt: new Date().toISOString(), dataSource: 'supabase', schema, table }
      });
    }

    // Gerar SQL automaticamente para PostgreSQL
    const sqlQuery = generatePostgreSQLQuery(type, x, y || 'impressao', table, aggregation, schema, dateFilter);

    // 🔍 SQL generation log
    console.log('🔍 Generated PostgreSQL:', {
      sqlQuery,
      inputs: { type, x, y: y || 'impressao', table, aggregation, schema, dateFilter },
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
