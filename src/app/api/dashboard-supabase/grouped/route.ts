import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/postgres';

// Cores predefinidas para séries
const SERIES_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7'
];

// Removed unused: PivotMeasure

interface GroupedRequest {
  schema?: string;
  table: string;
  dimension1: string;  // Label (eixo X)
  dimension2?: string;  // Series (barras agrupadas)
  // Medida: pode ser semântica (faturamento/quantidade/pedidos/itens),
  // um nome de coluna simples (SUM aplicado por padrão),
  // ou uma expressão com funções (ex.: SUM(item_subtotal)/COUNT_DISTINCT(pedido_id))
  measure?: string;
  // Novos campos: quando informados sem dimension2, retornamos duas séries (meta e realizado)
  measureGoal?: string;
  measureActual?: string;
  // Compat: ainda aceitar field direto
  field?: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  limit?: number;
  // dateFilter padronizado, mas também aceitamos filters.dateRange
  dateFilter?: {
    type: string;
    startDate?: string;
    endDate?: string;
  };
  where?: string;
  // Drill simples: filtro por uma dimensão/valor
  filter?: { dim: string; value: string };
}

// Helper para calcular intervalo de datas a partir de um tipo
function calculateDateRange(filter: { type: string; startDate?: string; endDate?: string } | undefined) {
  if (!filter) return undefined as undefined | { startDate: string; endDate: string };
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
    case 'last_7_days': {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      return { startDate: formatDate(d), endDate: formatDate(today) };
    }
    case 'last_14_days': {
      const d = new Date(today);
      d.setDate(today.getDate() - 13);
      return { startDate: formatDate(d), endDate: formatDate(today) };
    }
    case 'last_30_days': {
      const d = new Date(today);
      d.setDate(today.getDate() - 29);
      return { startDate: formatDate(d), endDate: formatDate(today) };
    }
    case 'last_90_days': {
      const d = new Date(today);
      d.setDate(today.getDate() - 89);
      return { startDate: formatDate(d), endDate: formatDate(today) };
    }
    case 'current_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(first), endDate: formatDate(today) };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case 'custom': {
      return { startDate: filter.startDate || formatDate(today), endDate: filter.endDate || formatDate(today) };
    }
    default: {
      const d = new Date(today);
      d.setDate(today.getDate() - 29);
      return { startDate: formatDate(d), endDate: formatDate(today) };
    }
  }
}

// Constrói expressão SQL segura a partir de uma medida DSL
function buildMeasureExpression(measure: string | undefined): string | null {
  if (!measure) return null;
  const s = measure.trim();
  if (!s) return null;
  // EXPRESSÃO com funções
  if (s.includes('(')) {
    let expr = s;
    expr = expr.replace(/COUNT\s*\(\s*\*\s*\)/gi, 'COUNT(*)');
    expr = expr.replace(/COUNT_DISTINCT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'COUNT(DISTINCT "$1")');
    expr = expr.replace(/SUM\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'SUM("$1")');
    expr = expr.replace(/AVG\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'AVG("$1")');
    expr = expr.replace(/MIN\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'MIN("$1")');
    expr = expr.replace(/MAX\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'MAX("$1")');
    expr = expr.replace(/COUNT\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi, 'COUNT("$1")');
    return expr;
  }
  // Coluna simples → SUM por padrão
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    return `SUM("${s}")`;
  }
  return null;
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
      measureGoal,
      measureActual,
      limit = 10,
      dateFilter,
      where,
      filter
    } = body;

    console.log('📥 Grouped API request:', {
      schema, table, dimension1, dimension2, field, aggregation, limit
    });

    // Build qualified table name
    const qualifiedTable = `"${schema}"."${table}"`;

    // Resolver e aplicar filtro de datas
    let dateCondition = '';
    const getDateRangeFromFilters = (f: unknown): { type: string; startDate?: string; endDate?: string } | undefined => {
      if (!f || typeof f !== 'object') return undefined;
      const maybe = (f as { dateRange?: unknown }).dateRange;
      if (!maybe || typeof maybe !== 'object') return undefined;
      const dr = maybe as { type?: unknown; startDate?: unknown; endDate?: unknown };
      if (typeof dr.type !== 'string') return undefined;
      const out: { type: string; startDate?: string; endDate?: string } = { type: dr.type };
      if (typeof dr.startDate === 'string') out.startDate = dr.startDate;
      if (typeof dr.endDate === 'string') out.endDate = dr.endDate;
      return out;
    };
    const incomingDateFilter = dateFilter || getDateRangeFromFilters((body as { filters?: unknown }).filters);
    const dr = calculateDateRange(incomingDateFilter);
    if (dr?.startDate && dr?.endDate) {
      dateCondition = ` AND "data_pedido" >= '${dr.startDate}' AND "data_pedido" <= '${dr.endDate}'`;
    }
    if (filter && filter.dim && typeof filter.value === 'string') {
      // Filtro simples para drill (igualdade)
      const dim = filter.dim.replace(/[^a-zA-Z0-9_]/g, '');
      const val = filter.value.replace(/'/g, "''");
      dateCondition += ` AND "${dim}" = '${val}'`;
    }
    // Optional user WHERE (placeholders)
    if (where && typeof where === 'string' && where.trim().length > 0) {
      const safeWhere = where.replace(/[^a-zA-Z0-9_\s=.'()\-:,]/g, '');
      const replaced = dr
        ? safeWhere
            .replace(/:start_date/gi, `'${dr.startDate}'`)
            .replace(/:end_date/gi, `'${dr.endDate}'`)
        : safeWhere;
      dateCondition += ` AND (${replaced})`;
    }

    // Resolver expressões de medida (para 1 série ou 2 séries)
    const resolveSingleMeasure = (): string | null => {
      let valueExpr: string | null = buildMeasureExpression(measure);
      if (!valueExpr) {
        // Sem expressão → mapear semânticas ou field/aggregation
        if (measure === 'faturamento') valueExpr = 'SUM("item_subtotal")';
        else if (measure === 'quantidade') valueExpr = 'SUM("quantidade")';
        else if (measure === 'pedidos') valueExpr = 'COUNT(DISTINCT "pedido_id")';
        else if (measure === 'itens') valueExpr = 'COUNT(DISTINCT "item_id")';
        else if (field) {
          const agg = String(aggregation || 'SUM').toUpperCase();
          valueExpr = (agg === 'COUNT_DISTINCT') ? `COUNT(DISTINCT "${field}")` : `${agg}("${field}")`;
        } else {
          return null;
        }
      }
      return valueExpr;
    };

    const resolveDualMeasures = (): { goalExpr: string; actualExpr: string } | null => {
      const g = buildMeasureExpression(measureGoal || undefined);
      const a = buildMeasureExpression(measureActual || undefined);
      if (g && a) return { goalExpr: g, actualExpr: a };
      return null;
    };

    let sqlQuery: string;
    // Caso 1: dimension2 informada → multi-séries por segunda dimensão (com 1 medida)
    if (dimension2 && dimension2.trim().length > 0) {
      const valueExpr = resolveSingleMeasure();
      if (!valueExpr) {
        return NextResponse.json({ success: false, error: 'Medida inválida: forneça measure como expressão/coluna, ou use field/aggregation.' }, { status: 400 });
      }
      sqlQuery = `SELECT "${dimension1}" as dim1, "${dimension2}" as dim2, ${valueExpr} as value
         FROM ${qualifiedTable}
         WHERE 1=1${dateCondition}
         GROUP BY "${dimension1}", "${dimension2}"
         ORDER BY dim1, value DESC`;
    } else {
      // Caso 2: sem dimension2 → uma série (measure) OU duas séries (measureGoal/measureActual)
      const dual = resolveDualMeasures();
      if (dual) {
        sqlQuery = `SELECT "${dimension1}" as dim1, ${dual.goalExpr} as meta, ${dual.actualExpr} as realizado
         FROM ${qualifiedTable}
         WHERE 1=1${dateCondition}
         GROUP BY "${dimension1}"
         ORDER BY realizado DESC
         LIMIT ${limit}`;
      } else {
        const valueExpr = resolveSingleMeasure();
        if (!valueExpr) {
          return NextResponse.json({ success: false, error: 'Medida inválida: forneça measure como expressão/coluna, ou use field/aggregation.' }, { status: 400 });
        }
        sqlQuery = `SELECT "${dimension1}" as dim1, ${valueExpr} as value
         FROM ${qualifiedTable}
         WHERE 1=1${dateCondition}
         GROUP BY "${dimension1}"
         ORDER BY value DESC
         LIMIT ${limit}`;
      }
    }

    console.log('🔍 Generated SQL:', sqlQuery);

    // Execute query
    type TwoDimRow = { dim1: string; dim2: string; value: number };
    type OneDimRow = { dim1: string; value: number };
    type DualRow = { dim1: string; meta: number; realizado: number };
    const isDual = !dimension2 && Boolean(measureGoal) && Boolean(measureActual);
    const rawData = await runQuery<TwoDimRow | OneDimRow | DualRow>(sqlQuery);

    console.log('📊 Raw query result:', { rowCount: rawData.length, sample: rawData.slice(0, 3) });

    let items: Array<Record<string, string | number>> = [];
    let series: Array<{ key: string; label: string; color: string }> = [];

    if (dimension2 && dimension2.trim().length > 0) {
      const rows2 = rawData as TwoDimRow[];
      const dimension2Totals = rows2.reduce((acc: Record<string, number>, row) => {
        acc[row.dim2] = (acc[row.dim2] || 0) + Number(row.value || 0);
        return acc;
      }, {} as Record<string, number>);

      const topDimension2 = Object.entries(dimension2Totals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([key]) => key);

      console.log(`📌 Top ${limit} dimension2 values:`, topDimension2);

      const pivotMap = new Map<string, Record<string, string | number>>();
      rows2.forEach((row) => {
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
      if (isDual) {
        const rows = rawData as DualRow[];
        items = rows.map((r) => ({ label: r.dim1, meta: Number(r.meta || 0), realizado: Number(r.realizado || 0) }));
        series = [
          { key: 'meta', label: 'Meta', color: SERIES_COLORS[0] },
          { key: 'realizado', label: 'Realizado', color: SERIES_COLORS[1] }
        ];
      } else {
        const rows1 = rawData as OneDimRow[];
        items = rows1.map((row) => ({ label: row.dim1, value: Number(row.value || 0) }));
        const labelMap: Record<string, string> = {
          faturamento: 'Faturamento', quantidade: 'Quantidade', pedidos: 'Pedidos', itens: 'Itens'
        };
        const label = measure && labelMap[measure] ? labelMap[measure] : 'Valor';
        series = [{ key: 'value', label, color: SERIES_COLORS[0] }];
      }
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
