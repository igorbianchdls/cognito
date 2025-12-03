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

// Sanitize a user-provided WHERE snippet and allow date placeholders
const sanitizeWhere = (w?: string) => {
  if (!w) return '';
  return w.replace(/[^a-zA-Z0-9_\s=.'()\-:,]/g, '');
};

// Função para gerar SQL PostgreSQL automaticamente
const generatePostgreSQLQuery = (
  tipo: string, 
  x: string, 
  y: string, 
  tabela: string, 
  agregacao?: string, 
  schema = 'marketing',
  dateFilter?: DateRangeFilter,
  where?: string
): string => {
  const yExpr = buildMeasureExpression(y);

  // Build qualified table name for PostgreSQL
  const qualifiedTable = `"${schema}"."${tabela}"`;

  // Build date filter condition (using vendas.vw_pedidos_completo date column)
  let dateCondition = '';
  if (dateFilter) {
    const { startDate, endDate } = calculateDateRange(dateFilter);
    dateCondition = ` AND "data_pedido" >= '${startDate}' AND "data_pedido" <= '${endDate}'`;
  }
  // Optional user WHERE (placeholders :start_date / :end_date)
  let userWhere = sanitizeWhere(where);
  if (userWhere) {
    if (dateFilter) {
      const { startDate, endDate } = calculateDateRange(dateFilter);
      userWhere = userWhere.replace(/:start_date/gi, startDate).replace(/:end_date/gi, endDate);
    }
    dateCondition += ` AND (${userWhere})`;
  }

  switch (tipo) {
    case 'bar':
    case 'horizontal-bar':
      return `SELECT "${x}", (${yExpr}) as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY value DESC LIMIT 50`;
    
    case 'line':
    case 'area':
      return `SELECT "${x}", (${yExpr}) as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY "${x}" LIMIT 50`;
    
    case 'pie':
      return `SELECT "${x}", (${yExpr}) as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} GROUP BY "${x}" ORDER BY value DESC LIMIT 10`;
    
    case 'kpi':
      return `SELECT (${yExpr}) as total FROM ${qualifiedTable} WHERE 1=1${dateCondition}`;
    
    default:
      return `SELECT "${x}", (${yExpr}) as value FROM ${qualifiedTable} WHERE 1=1${dateCondition} LIMIT 50`;
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
    const { type, dataSource, filters, dateFilter: dateFilterBody } = await request.json();
    const { table, x, y, aggregation, schema = 'marketing', where } = dataSource;
    const dateFilter = dateFilterBody || filters?.dateRange;

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
        sql_query: `-- Mock data: SUPABASE_DB_URL not configured\n-- Would execute: ${generatePostgreSQLQuery(type, x, y || 'impressao', table, aggregation, schema, dateFilter, where)}`,
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
      const expr = buildMeasureExpression(y || 'impressao');
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
        SELECT (${expr}) AS total
        FROM ${qualifiedTable}
        WHERE "data_pedido" >= '${startDate}' AND "data_pedido" <= '${endDate}'
      ), previous AS (
        SELECT (${expr}) AS total
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
    const sqlQuery = generatePostgreSQLQuery(type, x, y || 'impressao', table, aggregation, schema, dateFilter, where);

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
// Build SQL-safe measure expression from a DSL measure string
function buildMeasureExpression(measure: string | undefined, fallbackColumn = 'impressao'): string {
  let s = (measure || '').trim();
  if (!s) {
    return `SUM("${fallbackColumn}")`;
  }
  // If the expression contains parentheses, map functions and quote identifiers
  if (s.includes('(')) {
    // COUNT(*) stays as-is
    s = s.replace(/COUNT\s*\(\s*\*\s*\)/gi, 'COUNT(*)');
    // COUNT_DISTINCT(col) -> COUNT(DISTINCT "col")
    s = s.replace(/COUNT_DISTINCT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'COUNT(DISTINCT "$1")');
    // SUM(col) -> SUM("col")
    s = s.replace(/SUM\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'SUM("$1")');
    // AVG(col) -> AVG("col")
    s = s.replace(/AVG\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'AVG("$1")');
    // MIN(col) -> MIN("col")
    s = s.replace(/MIN\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'MIN("$1")');
    // MAX(col) -> MAX("col")
    s = s.replace(/MAX\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'MAX("$1")');
    // COUNT(col) -> COUNT("col")
    s = s.replace(/COUNT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'COUNT("$1")');
    return s;
  }
  // If it's just a column name, wrap with SUM by default
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    return `SUM("${s}")`;
  }
  // Fallback
  return s;
}
