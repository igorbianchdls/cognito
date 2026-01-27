"use client";

export type MeasureOp = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';

export type MeasureSpec = {
  op: MeasureOp;
  field?: string; // optional for count()
};

export function getByPath(obj: any, path?: string, fallback?: any): any {
  if (!path) return fallback;
  try {
    const parts = String(path)
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);
    let curr: any = obj;
    for (const p of parts) {
      if (curr == null) return fallback;
      curr = curr[p];
    }
    return curr === undefined ? fallback : curr;
  } catch {
    return fallback;
  }
}

export function parseMeasureSpec(spec?: string | null): MeasureSpec | null {
  if (!spec || typeof spec !== 'string') return null;
  const s = spec.trim();
  // Pattern: OP(field) or OP()
  const m = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*([A-Za-z0-9_\.]*?)\s*\)$/);
  if (!m) return null;
  const opRaw = m[1].toLowerCase();
  const field = m[2] ? m[2].trim() : '';
  let op: MeasureOp | null = null;
  if (opRaw === 'sum') op = 'sum';
  else if (opRaw === 'avg' || opRaw === 'mean') op = 'avg';
  else if (opRaw === 'min') op = 'min';
  else if (opRaw === 'max') op = 'max';
  else if (opRaw === 'count') op = 'count';
  else if (opRaw === 'count_distinct' || opRaw === 'distinct_count') op = 'count_distinct';
  else return null;
  return { op, field: field || undefined };
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const s = v.trim().replace(/\./g, '').replace(/,/g, '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v as any);
  return Number.isFinite(n) ? n : null;
}

export function aggregateByDimension(
  rows: Array<Record<string, unknown>>,
  dimKey: string,
  measureExpr: string
): Array<{ label: string; value: number }> {
  const spec = parseMeasureSpec(measureExpr);
  if (!spec) {
    // Not an aggregate expression; return raw mapping with best-effort number coercion
    return rows.map((r) => ({
      label: String(getByPath(r, dimKey, '—')),
      value: toNumber(getByPath(r, measureExpr)) ?? 0,
    }));
  }

  const field = spec.field;
  const groups = new Map<string, { count: number; sum: number; min: number; max: number; nums: number[]; countField: number; distinct: Set<string> }>();
  for (const r of rows) {
    const key = String(getByPath(r, dimKey, '—'));
    let g = groups.get(key);
    if (!g) {
      g = { count: 0, sum: 0, min: Infinity, max: -Infinity, nums: [], countField: 0, distinct: new Set<string>() };
      groups.set(key, g);
    }
    g.count += 1;
    const fv = field ? getByPath(r, field) : undefined;
    if (spec.op === 'count_distinct' && field) {
      const val = fv == null ? '' : String(fv);
      g.distinct.add(val);
    } else if (spec.op === 'count') {
      if (field) {
        if (fv !== null && fv !== undefined) g.countField += 1;
      }
    } else {
      const n = toNumber(fv);
      if (n != null) {
        g.sum += n;
        if (n < g.min) g.min = n;
        if (n > g.max) g.max = n;
        g.nums.push(n);
      }
    }
  }

  const out: Array<{ label: string; value: number }> = [];
  for (const [label, g] of groups) {
    let value = 0;
    switch (spec.op) {
      case 'sum':
        value = g.sum;
        break;
      case 'avg':
        value = g.nums.length ? g.sum / g.nums.length : 0;
        break;
      case 'min':
        value = g.nums.length ? g.min : 0;
        break;
      case 'max':
        value = g.nums.length ? g.max : 0;
        break;
      case 'count':
        value = field ? g.countField : g.count;
        break;
      case 'count_distinct':
        value = g.distinct.size;
        break;
      default:
        value = 0;
    }
    out.push({ label, value });
  }
  return out;
}

// Normalize title style coming from JSON props
export function normalizeTitleStyle(style?: any): Record<string, any> | undefined {
  if (!style || typeof style !== 'object') return undefined;
  const out: Record<string, any> = {};
  if (style.fontFamily) out.fontFamily = String(style.fontFamily);
  if (style.fontWeight !== undefined) out.fontWeight = style.fontWeight as any;
  if (style.fontSize !== undefined) out.fontSize =
    typeof style.fontSize === 'number' ? `${style.fontSize}px` : String(style.fontSize);
  if (style.color) out.color = String(style.color);
  if (style.letterSpacing !== undefined) out.letterSpacing =
    typeof style.letterSpacing === 'number' ? `${style.letterSpacing}px` : String(style.letterSpacing);
  if (style.textTransform) out.textTransform = String(style.textTransform);
  if (style.padding !== undefined) out.padding =
    typeof style.padding === 'number' ? `${style.padding}px` : String(style.padding);
  if (style.margin !== undefined) out.margin =
    typeof style.margin === 'number' ? `${style.margin}px` : String(style.margin);
  if (style.textAlign) out.textAlign = String(style.textAlign);
  return out;
}

export function normalizeContainerStyle(style?: any, borderless?: boolean): Record<string, any> | undefined {
  if (!style && !borderless) return undefined;
  const out: Record<string, any> = {};
  if (style && typeof style === 'object') {
    if (style.backgroundColor) out.backgroundColor = String(style.backgroundColor);
    if (style.borderColor) out.borderColor = String(style.borderColor);
    if (style.borderStyle) out.borderStyle = String(style.borderStyle);
    if (style.borderWidth !== undefined) out.borderWidth = typeof style.borderWidth === 'number' ? style.borderWidth : String(style.borderWidth);
    if (style.borderRadius !== undefined) out.borderRadius = typeof style.borderRadius === 'number' ? `${style.borderRadius}px` : String(style.borderRadius);
    if (style.boxShadow) out.boxShadow = String(style.boxShadow);
    if (style.padding !== undefined) out.padding = typeof style.padding === 'number' ? `${style.padding}px` : String(style.padding);
    if (style.margin !== undefined) out.margin = typeof style.margin === 'number' ? `${style.margin}px` : String(style.margin);
  }
  if (borderless) out.borderWidth = 0;
  return Object.keys(out).length ? out : undefined;
}

export function buildNivoTheme(input?: any): Record<string, any> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const t: any = {};
  if (input.textColor) t.textColor = String(input.textColor);
  if (input.fontSize !== undefined) t.fontSize = Number(input.fontSize);
  if (input.fontFamily) t.fontFamily = String(input.fontFamily);
  if (input.axis) {
    t.axis = {};
    if (input.axis.ticks) {
      t.axis.ticks = {};
      if (input.axis.ticks.text) t.axis.ticks.text = { ...input.axis.ticks.text };
    }
    if (input.axis.legend) {
      t.axis.legend = {};
      if (input.axis.legend.text) t.axis.legend.text = { ...input.axis.legend.text };
    }
  }
  if (input.labels && input.labels.text) {
    t.labels = { text: { ...input.labels.text } };
  }
  return t;
}
