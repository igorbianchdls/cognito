import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/postgres';

// Cores predefinidas para séries
const SERIES_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7'
];

type PivotMeasure = 'faturamento' | 'quantidade' | 'pedidos' | 'itens'

interface GroupedRequest {
  schema?: string;
  table: string;
  dimension1: string;  // Label (eixo X)
  dimension2?: string;  // Series (barras agrupadas)
  // Novo: medida de negócio (opcional)
  measure?: PivotMeasure;
  // Compat: ainda aceitar field direto
  field?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
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
      measure,
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

    // Mapear measure → field/agg padrão se informado
    let usedField = field;
    let usedAgg = aggregation;
    if (measure && !field) {
      switch (measure) {
        case 'faturamento':
          usedField = 'item_subtotal';
          usedAgg = usedAgg || 'SUM';
          break;
        case 'quantidade':
          usedField = 'quantidade';
          usedAgg = usedAgg || 'SUM';
          break;
        case 'pedidos':
          // COUNT DISTINCT por pedido
          usedField = 'pedido_id';
          usedAgg = usedAgg || 'COUNT';
          break;
        case 'itens':
          usedField = 'item_id';
          usedAgg = usedAgg || 'COUNT';
          break;
      }
    }

    if (!usedField) {
      return NextResponse.json({ success: false, error: 'Campo de medida não definido (use measure ou field)' }, { status: 400 });
    }

    const isCountDistinct = (measure === 'pedidos') && (usedAgg === 'COUNT');
    const valueExpr = isCountDistinct
      ? `COUNT(DISTINCT "${usedField}")`
      : `${usedAgg}("${usedField}")`;

    const sqlQuery = (dimension2 && dimension2.trim().length > 0)
      ? `SELECT "${dimension1}" as dim1, "${dimension2}" as dim2, ${valueExpr} as value
         FROM ${qualifiedTable}
         WHERE 1=1${dateCondition}
         GROUP BY "${dimension1}", "${dimension2}"
         ORDER BY dim1, value DESC`
      : `SELECT "${dimension1}" as dim1, ${valueExpr} as value
         FROM ${qualifiedTable}
         WHERE 1=1${dateCondition}
         GROUP BY "${dimension1}"
         ORDER BY value DESC
         LIMIT ${limit}`;

    console.log('🔍 Generated SQL:', sqlQuery);

    // Execute query
    const rawData = await runQuery<any>(sqlQuery);

    console.log('📊 Raw query result:', { rowCount: rawData.length, sample: rawData.slice(0, 3) });

    let items: Array<Record<string, string | number>> = [];
    let series: Array<{ key: string; label: string; color: string }> = [];

    if (dimension2 && dimension2.trim().length > 0) {
      const dimension2Totals = rawData.reduce((acc: Record<string, number>, row: any) => {
        acc[row.dim2] = (acc[row.dim2] || 0) + Number(row.value || 0);
        return acc;
      }, {} as Record<string, number>);

      const topDimension2 = Object.entries(dimension2Totals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([key]) => key);

      console.log(`📌 Top ${limit} dimension2 values:`, topDimension2);

      const pivotMap = new Map<string, Record<string, string | number>>();
      rawData.forEach((row: any) => {
        if (!topDimension2.includes(row.dim2)) return;
        if (!pivotMap.has(row.dim1)) pivotMap.set(row.dim1, { label: row.dim1 });
        const item = pivotMap.get(row.dim1)!;
        const safeKey = String(row.dim2).toLowerCase().replace(/[^a-z0-9]/g, '_');
        item[safeKey] = Number(row.value || 0);
      });
      items = Array.from(pivotMap.values());
      series = topDimension2.map((dim2Value, index) => ({
        key: String(dim2Value).toLowerCase().replace(/[^a-z0-9]/g, '_'),
        label: dim2Value,
        color: SERIES_COLORS[index % SERIES_COLORS.length]
      }));
    } else {
      items = rawData.map((row: any) => ({ label: row.dim1, value: Number(row.value || 0) }));
      const labelMap: Record<PivotMeasure, string> = {
        faturamento: 'Faturamento', quantidade: 'Quantidade', pedidos: 'Pedidos', itens: 'Itens'
      };
      const label = measure ? labelMap[measure] : 'Valor';
      series = [{ key: 'value', label, color: SERIES_COLORS[0] }];
    }

    console.log('✅ Pivot result:', {
      itemsCount: items.length,
      seriesCount: series.length,
      sampleItem: items[0],
      series
    });

    return NextResponse.json({ success: true, items, series, sql_query: sqlQuery, metadata: { generatedAt: new Date().toISOString(), dataSource: 'supabase', schema, table, dimension1, dimension2 } });

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
