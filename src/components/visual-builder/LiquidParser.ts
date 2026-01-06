'use client';

export type LiquidParseMode = 'html' | 'grid';

export type ChartTypeBasic = 'bar' | 'line' | 'pie' | 'area';

export interface ChartDataPoint {
  x: string;
  y: number;
  label?: string;
  value?: number;
}

export interface ChartSpec {
  id: string;
  type: ChartTypeBasic;
  title?: string;
  height?: number;
  data: ChartDataPoint[]; // simulated or inline
  mountId: string; // equals id, used to locate in DOM
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
      charts.push({ id, type, title, height, data, mountId: id });
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

