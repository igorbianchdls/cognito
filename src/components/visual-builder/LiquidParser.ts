'use client';

export type LiquidParseMode = 'html' | 'grid';

export type ChartTypeBasic = 'bar' | 'line' | 'pie' | 'area' | 'groupedbar';

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
  // Meta x Realizado (optional)
  mode?: string; // 'meta-real'
  scope?: 'vendedor' | 'territorio' | string;
  metric?: 'faturamento' | 'ticket_medio' | 'novos_clientes' | string;
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
  // Local, per-chart props (unified: attributes + <props> block)
  props?: Record<string, unknown>;
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

function stripOuterQuotes(s: string): string {
  const t = String(s || '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseWhereDSL(whereAttr: string | undefined): QueryRule[] {
  const rules: QueryRule[] = [];
  const raw = String(whereAttr || '').trim();
  if (!raw) return rules;
  const parts = raw.split(';').map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    const s = p.replace(/\s+/g, ' ').trim();
    if (!s) continue;
    // in / not in
    let m = s.match(/^([A-Za-z_][\w\.-]*)\s+(not\s+in|in)\s*\((.*)\)$/i);
    if (m) {
      const col = m[1];
      const op = m[2].toLowerCase();
      const inside = m[3];
      const items = inside.split(',').map(v => stripOuterQuotes(v).trim()).filter(Boolean);
      if (col && items.length) {
        rules.push({ col, op, vals: items });
        continue;
      }
    }
    // between a..b
    m = s.match(/^([A-Za-z_][\w\.-]*)\s+between\s+(.+?)\.\.(.+)$/i);
    if (m) {
      const col = m[1];
      const start = stripOuterQuotes(m[2]);
      const end = stripOuterQuotes(m[3]);
      if (col && start && end) {
        rules.push({ col, op: 'between', start, end });
        continue;
      }
    }
    // like pattern
    m = s.match(/^([A-Za-z_][\w\.-]*)\s+like\s+(.+)$/i);
    if (m) {
      const col = m[1];
      const val = stripOuterQuotes(m[2]);
      if (col && val) {
        rules.push({ col, op: 'like', val });
        continue;
      }
    }
    // basic comparators
    m = s.match(/^([A-Za-z_][\w\.-]*)\s*(=|!=|>=|<=|>|<)\s*(.+)$/);
    if (m) {
      const col = m[1];
      const op = m[2];
      const val = stripOuterQuotes(m[3]);
      if (col && op && val !== undefined) {
        rules.push({ col, op, val });
        continue;
      }
    }
    // fallback: ignore malformed rule
  }
  return rules;
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

    // Helper: deep merge (arrays replaced by b)
    const deepMerge = (a: any, b: any): any => {
      if (Array.isArray(a) && Array.isArray(b)) return b;
      if (a && typeof a === 'object' && !Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) {
        const out: any = { ...a };
        for (const k of Object.keys(b)) out[k] = k in out ? deepMerge(out[k], b[k]) : b[k];
        return out;
      }
      return b === undefined ? a : b;
    };

    // Helper: set nested path (e.g. axisBottom.tickRotation)
    const setNested = (obj: any, path: string, value: any) => {
      const parts = path.split('.');
      let curr = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!curr[p] || typeof curr[p] !== 'object') curr[p] = {};
        curr = curr[p];
      }
      curr[parts[parts.length - 1]] = value;
    };

    const coerce = (v: string): any => {
      const t = String(v).trim();
      if (t === '') return t;
      if (/^(true|false)$/i.test(t)) return /^true$/i.test(t);
      if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
      return t;
    };

    const parseMaybeJSON = (raw: string | undefined): any => {
      if (!raw) return undefined;
      const s = String(raw).trim();
      if (!s) return undefined;
      try { return JSON.parse(s); } catch {}
      return undefined;
    };

    const parseColorsAttr = (s: string | undefined): any => {
      if (!s) return undefined;
      const t = String(s).trim();
      if (!t) return undefined;
      if (t.startsWith('[')) {
        try { return JSON.parse(t); } catch { return undefined; }
      }
      if (t.includes(',')) return t.split(',').map(x => x.trim()).filter(Boolean);
      return t; // single string
    };

    const getAttr = (attrs: Record<string,string>, camel: string, kebab?: string) => {
      if (attrs[camel] != null) return attrs[camel];
      if (kebab && attrs[kebab] != null) return attrs[kebab];
      return undefined;
    };

    // Map attributes (shorthands) -> props object
    const buildPropsFromAttrs = (a: Record<string,string>): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      const directKeys = [
        'layout','groupMode','padding','innerPadding','borderRadius','borderWidth','barColor',
        'enableGridX','enableGridY','gridColor','gridStrokeWidth',
        'enableLabel','labelTextColor','labelSkipWidth','labelSkipHeight','labelPosition','labelOffset',
        'animate','motionConfig','showLegend',
        // container & style
        'containerBackground','containerOpacity','containerBackdropFilter','containerFilter','containerBoxShadow','containerBorder','containerTransform','containerTransition',
        'backgroundColor','backgroundOpacity',
        'containerClassName','containerBorderWidth','containerBorderColor','containerBorderAccentColor','containerBorderRadius','containerBorderVariant','containerPadding',
        'translateY','marginBottom',
        // typography common
        'axisFontFamily','axisFontSize','axisFontWeight','axisTextColor','axisLegendFontSize','axisLegendFontWeight',
        'labelsFontFamily','labelsFontSize','labelsFontWeight','labelsTextColor',
        'legendsFontFamily','legendsFontSize','legendsFontWeight','legendsTextColor',
        'tooltipFontSize','tooltipFontFamily',
        // titles
        'title','subtitle',
        'titleMarginTop','titleMarginRight','titleMarginBottom','titleMarginLeft','titlePaddingTop','titlePaddingRight','titlePaddingBottom','titlePaddingLeft',
        'subtitleMarginTop','subtitleMarginRight','subtitleMarginBottom','subtitleMarginLeft','subtitlePaddingTop','subtitlePaddingRight','subtitlePaddingBottom','subtitlePaddingLeft'
      ];
      for (const k of directKeys) {
        const kebab = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        const v = getAttr(a, k, kebab);
        if (v != null && v !== '') (out as any)[k] = coerce(v);
      }

      // colors
      const colorsAttr = getAttr(a, 'colors');
      if (colorsAttr != null && colorsAttr !== '') out['colors'] = parseColorsAttr(colorsAttr);

      // margin (JSON) or specific marginBottom already handled above
      const marginAttr = getAttr(a, 'margin');
      const marginParsed = parseMaybeJSON(marginAttr);
      if (marginParsed && typeof marginParsed === 'object') out['margin'] = marginParsed;

      // axisBottom.*
      const axisBottomMap: Record<string, string> = {
        axisBottomTickSize: 'axisBottom.tickSize',
        axisBottomTickPadding: 'axisBottom.tickPadding',
        axisBottomTickRotation: 'axisBottom.tickRotation',
        axisBottomLegend: 'axisBottom.legend',
        axisBottomLegendOffset: 'axisBottom.legendOffset',
        axisBottomLegendPosition: 'axisBottom.legendPosition'
      };
      for (const ak of Object.keys(axisBottomMap)) {
        const kebab = ak.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        const v = getAttr(a, ak, kebab);
        if (v != null && v !== '') setNested(out, axisBottomMap[ak], coerce(v));
      }

      // axisLeft.*
      const axisLeftMap: Record<string, string> = {
        axisLeftTickSize: 'axisLeft.tickSize',
        axisLeftTickPadding: 'axisLeft.tickPadding',
        axisLeftTickRotation: 'axisLeft.tickRotation',
        axisLeftLegend: 'axisLeft.legend',
        axisLeftLegendOffset: 'axisLeft.legendOffset'
      };
      for (const ak of Object.keys(axisLeftMap)) {
        const kebab = ak.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        const v = getAttr(a, ak, kebab);
        if (v != null && v !== '') setNested(out, axisLeftMap[ak], coerce(v));
      }

      // legends (as JSON)
      const legendsAttr = getAttr(a, 'legends');
      const legendsParsed = parseMaybeJSON(legendsAttr);
      if (legendsParsed !== undefined) out['legends'] = legendsParsed;

      return out;
    };

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
      // Optional props (attributes + <props> block + <nivo/> block)
      let localProps: Record<string, unknown> | undefined = undefined;
      try {
        const b = String(body || '');
        // Parse <props> block (JSON)
        const pMatch = b.match(/<props\b[^>]*>([\s\S]*?)<\/props>/i);
        const propsFromBlock = (() => {
          if (!pMatch) return undefined;
          const inner = (pMatch[1] || '').trim();
          if (!inner) return undefined;
          try { return JSON.parse(inner); } catch { return undefined; }
        })();
        // Parse <nivo .../> block (attributes)
        const nMatchPair = b.match(/<nivo\b([^>]*)>([\s\S]*?)<\/nivo>/i);
        const nMatchSelf = !nMatchPair ? b.match(/<nivo\b([^>]*)\/>/i) : null;
        const nAttrsStr = (nMatchPair?.[1] || nMatchSelf?.[1] || '').trim();
        const propsFromNivo = (() => {
          if (!nAttrsStr) return undefined;
          const na = parseAttrs(nAttrsStr);
          return buildPropsFromAttrs(na);
        })();
        // Parse props attribute (JSON string)
        const propsFromAttr = (() => {
          const raw = a['props'];
          if (!raw) return undefined;
          try { return JSON.parse(raw); } catch { return undefined; }
        })();
        // Parse attribute shorthands
        const propsFromAttrs = buildPropsFromAttrs(a);
        // Merge: attrs -> propsAttr -> propsBlock -> nivo (nivo wins)
        localProps = deepMerge(
          propsFromAttrs,
          deepMerge(
            propsFromAttr,
            deepMerge(propsFromBlock, propsFromNivo)
          )
        );

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
          const mode = (qAttrs['mode'] || '').trim() || undefined;
          const scope = (qAttrs['scope'] || '').trim() || undefined;
          const metric = (qAttrs['metric'] || '').trim() || undefined;
          // New: where DSL in attribute
          const where: QueryRule[] = [];
          const whereAttr = (qAttrs['where'] || '').trim() || undefined;
          if (whereAttr) {
            try { where.push(...parseWhereDSL(whereAttr)); } catch {}
          }
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
          if (schema && table && (measure || mode)) {
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
              ...(mode ? { mode } : {}),
              ...(scope ? { scope } : {}),
              ...(metric ? { metric } : {}),
            };
          }
        }
      } catch { /* ignore malformed query */ }

      charts.push({ id, type, title, height, data, mountId: id, ...(querySpec ? { querySpec } : {}), ...(localProps ? { props: localProps } : {}) });
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
