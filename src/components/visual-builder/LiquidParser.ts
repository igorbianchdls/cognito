'use client';

export type LiquidParseMode = 'html' | 'grid';

export type ChartTypeBasic = 'bar' | 'line' | 'pie' | 'area';

export interface ChartDataPoint {
  x: string;
  y: number;
  label?: string;
  value?: number;
}

export interface QueryRule {
  col: string;
  op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'between' | 'like' | string;
  val?: string;
  vals?: string[];
  start?: string | number;
  end?: string | number;
}

export interface QuerySpec {
  schema: string;
  table: string;
  measure: string; // e.g., SUM(valor_total)
  dimension?: string; // optional grouping
  dateColumn?: string; // will apply global date range automatically
  limit?: number;
  orderBy?: string; // value DESC | label ASC
  where?: QueryRule[]; // AND-combined rules (phase 1)
  // New: raw/english attributes for cube-like DSL
  filterRaw?: string;
  rangeRaw?: string;
  from?: string;
  to?: string;
  granularity?: string;
  timezone?: string;
}

export interface ChartSpec {
  id: string;
  type: ChartTypeBasic;
  title?: string;
  height?: number;
  data: ChartDataPoint[]; // simulated or inline
  mountId: string; // equals id, used to locate in DOM
  // Optional query spec (Excel-like), translated to SQL/endpoint by QueryEngine
  querySpec?: QuerySpec;
}

export interface LiquidParseResult {
  mode: LiquidParseMode;
  html: string;
  charts: ChartSpec[];
}

const DEFAULT_HEIGHT = 320;

function parseAttrs(openTag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w[\w-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(openTag)) !== null) {
    const name = m[1];
    const val = (m[3] ?? m[4] ?? m[5] ?? '').trim();
    attrs[name] = val;
  }
  return attrs;
}

function csvToArray(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(',').map(v => v.trim()).filter(Boolean);
}

function simulateData(type: ChartTypeBasic, attrs: Record<string,string>): ChartDataPoint[] {
  // If explicit JSON data provided
  if (attrs['data']) {
    try {
      const parsed = JSON.parse(attrs['data']);
      if (Array.isArray(parsed)) return parsed as ChartDataPoint[];
    } catch {}
  }
  // If categories+values provided
  const cats = csvToArray(attrs['categories']);
  const vals = csvToArray(attrs['values']).map(v => Number(v));
  if (cats.length && vals.length) {
    const data: ChartDataPoint[] = [];
    for (let i = 0; i < Math.min(cats.length, vals.length); i++) {
      data.push({ x: cats[i], y: Number.isFinite(vals[i]) ? vals[i] : 0, label: cats[i], value: Number.isFinite(vals[i]) ? vals[i] : 0 });
    }
    return data;
  }
  // Defaults per type
  if (type === 'line') {
    const labels = ['Jan','Fev','Mar','Abr','Mai'];
    const values = [120, 80, 150, 60, 100];
    return labels.map((l, i) => ({ x: l, y: values[i % values.length], label: l, value: values[i % values.length] }));
  }
  if (type === 'pie') {
    const labels = ['A','B','C','D'];
    const values = [40, 25, 20, 15];
    return labels.map((l, i) => ({ x: l, y: values[i % values.length], label: l, value: values[i % values.length] }));
  }
  // bar / area
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const values = [120, 80, 150, 60, 100];
  return labels.map((l, i) => ({ x: l, y: values[i % values.length], label: l, value: values[i % values.length] }));
}

export const LiquidParser = {
  parse(source: string): LiquidParseResult {
    const code = String(source || '').trim();
    // Detect <dashboard ...>
    const dashOpen = code.match(/<dashboard\b([^>]*)>/i);
    const dashClose = code.match(/<\/dashboard>/i);
    const attrs = dashOpen?.[1] || '';
    const isHtmlMode = /\brender\s*=\s*(?:"|')?(?:html|raw)(?:"|')?/i.test(attrs);
    if (!dashOpen || !dashClose || !isHtmlMode) {
      return { mode: 'grid', html: '', charts: [] };
    }
    // Extract inner HTML
    const start = dashOpen.index! + dashOpen[0].length;
    const inner = code.slice(start, code.toLowerCase().indexOf('</dashboard>'));

    // Find <Chart ...>...</Chart> or self-closing
    const charts: ChartSpec[] = [];
    let htmlOut = inner;

    // Helper to replace matched tag with mount div
    const replaceTagWithMount = (full: string, open: string, body: string | undefined) => {
      const a = parseAttrs(open);
      const rawType = (a['type'] || 'bar').toLowerCase();
      const type: ChartTypeBasic = (['bar','line','pie','area'].includes(rawType) ? rawType as ChartTypeBasic : 'bar');
      const id = a['id'] || `chart_${charts.length + 1}`;
      const title = a['title'];
      const height = a['height'] ? Number(a['height']) : undefined;
      const data = simulateData(type, a);

      // Optional <query .../> block inside the Chart body
      let querySpec: QuerySpec | undefined = undefined;
      try {
        const b = String(body || '');
        const qMatch = b.match(/<query\b([^>]*)>([\s\S]*?)<\/query>/i) || b.match(/<query\b([^>]*)\/>/i);
        if (qMatch) {
          const qAttrs = parseAttrs(qMatch[1] || '');
          const schema = String(qAttrs['schema'] || '').trim();
          const table = String(qAttrs['table'] || '').trim();
          // Accept english measure(s)/dimension(s) or legacy measure/dimension
          const mRaw = (qAttrs['measure'] || qAttrs['measures'] || qAttrs['medida'] || qAttrs['medidas'] || '').trim();
          const dRaw = (qAttrs['dimension'] || qAttrs['dimensions'] || qAttrs['dimensao'] || qAttrs['dimensoes'] || '').trim();
          const measure = mRaw.split(',').map(s => s.trim()).filter(Boolean)[0] || '';
          const dimension = (dRaw.split(',').map(s => s.trim()).filter(Boolean)[0] || undefined);
          // time dimension and ranges
          const dateColumn = (qAttrs['timedimension'] || qAttrs['timeDimension'] || qAttrs['datecolumn'] || qAttrs['dateColumn'] || '').trim() || undefined;
          const rangeRaw = (qAttrs['range'] || '').trim() || undefined;
          const from = (qAttrs['from'] || '').trim() || undefined;
          const to = (qAttrs['to'] || '').trim() || undefined;
          const granularity = (qAttrs['granularity'] || '').trim() || undefined;
          const limit = qAttrs['limit'] != null && qAttrs['limit'] !== '' && !Number.isNaN(Number(qAttrs['limit'])) ? Number(qAttrs['limit']) : undefined;
          const orderBy = (qAttrs['order'] || qAttrs['orderBy'] || qAttrs['orderby'] || qAttrs['ordenar'] || '').trim() || undefined;
          const timezone = (qAttrs['timezone'] || '').trim() || undefined;
          const filterRaw = (qAttrs['filter'] || qAttrs['filters'] || qAttrs['filtro'] || qAttrs['filtros'] || '').trim() || undefined;
          const where: QueryRule[] = [];
          const qInner = qMatch[2] || '';
          const whereMatch = qInner.match(/<where\b[^>]*>([\s\S]*?)<\/where>/i);
          if (whereMatch) {
            const wInner = whereMatch[1] || '';
            const ruleRe = /<rule\b([^>]*)\/>/gi;
            let rm: RegExpExecArray | null;
            while ((rm = ruleRe.exec(wInner)) !== null) {
              const rAttrs = parseAttrs(rm[1] || '');
              const col = String(rAttrs['col'] || '').trim();
              const op = String(rAttrs['op'] || '=').trim();
              const val = rAttrs['val'] != null ? String(rAttrs['val']) : undefined;
              const vals = rAttrs['vals'] != null ? String(rAttrs['vals']).split(',').map(s => s.trim()).filter(Boolean) : undefined;
              const start = rAttrs['start'] != null ? String(rAttrs['start']) : undefined;
              const end = rAttrs['end'] != null ? String(rAttrs['end']) : undefined;
              if (col) where.push({ col, op: op as any, ...(val !== undefined ? { val } : {}), ...(vals ? { vals } : {}), ...(start ? { start } : {}), ...(end ? { end } : {}) });
            }
          }
          if (schema && table && measure) {
            querySpec = {
              schema,
              table,
              measure,
              ...(dimension ? { dimension } : {}),
              ...(dateColumn ? { dateColumn } : {}),
              ...(limit ? { limit } : {}),
              ...(orderBy ? { orderBy } : {}),
              ...(where.length ? { where } : {}),
              ...(rangeRaw ? { rangeRaw } : {}),
              ...(from ? { from } : {}),
              ...(to ? { to } : {}),
              ...(granularity ? { granularity } : {}),
              ...(timezone ? { timezone } : {}),
              ...(filterRaw ? { filterRaw } : {}),
            };
          }
        }
      } catch { /* ignore malformed query */ }

      charts.push({ id, type, title, height, data, mountId: id, ...(querySpec ? { querySpec } : {}) });
      // inject mount div with height style if provided
      const style = height && Number.isFinite(height) ? ` style=\"height:${height}px\"` : '';
      return `<div data-liquid-chart=\"${id}\"${style}></div>`;
    };

    // Replace paired tags first
    htmlOut = htmlOut.replace(/<(Chart|chart)\b([^>]*)>([\s\S]*?)<\/\1>/g, (_m, _name, open, body) => replaceTagWithMount(_m, open, body));
    // Then self-closing
    htmlOut = htmlOut.replace(/<(Chart|chart)\b([^>]*)\/>/g, (_m, _name, open) => replaceTagWithMount(_m, open, undefined));

    return { mode: 'html', html: htmlOut, charts };
  }
};
