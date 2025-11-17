import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/postgres';

// Cores predefinidas para séries
const SERIES_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7'
];

interface GroupedRequest {
  schema?: string;
  table: string;
  dimension1: string;  // Label (eixo X)
  dimension2: string;  // Series (barras agrupadas)
  field: string;
  aggregation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  limit?: number;
  dateFilter?: {
    type: string;
    startDate?: string;
    endDate?: string;
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 Dashboard Grouped API endpoint called');

  try {
    const body: GroupedRequest = await request.json();
    const {
      schema = 'vendas',
      table,
      dimension1,
      dimension2,
      field,
      aggregation,
      limit = 10,
      dateFilter
    } = body;

    console.log('📥 Grouped API request:', {
      schema, table, dimension1, dimension2, field, aggregation, limit
    });

    // Build qualified table name
    const qualifiedTable = `"${schema}"."${table}"`;

    // Build date filter if provided
    let dateCondition = '';
    if (dateFilter?.startDate && dateFilter?.endDate) {
      dateCondition = ` AND "data_pedido" >= '${dateFilter.startDate}' AND "data_pedido" <= '${dateFilter.endDate}'`;
    }

    // Build SQL query with 2 dimensions
    const sqlQuery = `
      SELECT
        "${dimension1}" as dim1,
        "${dimension2}" as dim2,
        ${aggregation}("${field}") as value
      FROM ${qualifiedTable}
      WHERE 1=1${dateCondition}
      GROUP BY "${dimension1}", "${dimension2}"
      ORDER BY dim1, value DESC
    `;

    console.log('🔍 Generated SQL:', sqlQuery);

    // Execute query
    const rawData = await runQuery<{ dim1: string; dim2: string; value: number }>(sqlQuery);

    console.log('📊 Raw query result:', { rowCount: rawData.length, sample: rawData.slice(0, 3) });

    // Get unique dimension2 values (top N by total value)
    const dimension2Totals = rawData.reduce((acc, row) => {
      acc[row.dim2] = (acc[row.dim2] || 0) + Number(row.value || 0);
      return acc;
    }, {} as Record<string, number>);

    const topDimension2 = Object.entries(dimension2Totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key]) => key);

    console.log(`📌 Top ${limit} dimension2 values:`, topDimension2);

    // Pivot data: create items with dynamic keys
    const pivotMap = new Map<string, Record<string, string | number>>();

    rawData.forEach(row => {
      if (!topDimension2.includes(row.dim2)) return; // Only include top N

      if (!pivotMap.has(row.dim1)) {
        pivotMap.set(row.dim1, { label: row.dim1 });
      }

      const item = pivotMap.get(row.dim1)!;
      // Create safe key (remove spaces, special chars)
      const safeKey = row.dim2.toLowerCase().replace(/[^a-z0-9]/g, '_');
      item[safeKey] = Number(row.value || 0);
    });

    const items = Array.from(pivotMap.values());

    // Generate series dynamically
    const series = topDimension2.map((dim2Value, index) => {
      const safeKey = dim2Value.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return {
        key: safeKey,
        label: dim2Value,
        color: SERIES_COLORS[index % SERIES_COLORS.length]
      };
    });

    console.log('✅ Pivot result:', {
      itemsCount: items.length,
      seriesCount: series.length,
      sampleItem: items[0],
      series
    });

    return NextResponse.json({
      success: true,
      items,
      series,
      sql_query: sqlQuery,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'supabase',
        schema,
        table,
        dimension1,
        dimension2
      }
    });

  } catch (error) {
    console.error('❌ Error in grouped dashboard API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
