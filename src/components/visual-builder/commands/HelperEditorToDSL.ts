"use client";

// Utilities to manipulate the HTML-like DSL string used by the Visual Builder.

export type GroupSpec = {
  id: string;
  title?: string;
  orientation?: "horizontal" | "vertical";
  sizing?: "fr" | "auto";
  colsD?: number;
  gapX?: number;
  gapY?: number;
  style?: Record<string, unknown>;
};

export type KPIWidgetSpec = {
  id: string;
  title?: string;
  unit?: string;
  height?: number;
  widthFr?: string; // when group uses sizing="fr"
  data?: { schema?: string; table?: string; measure?: string; agg?: string };
  style?: { tw?: string };
};

export type ChartWidgetSpec = {
  id: string;
  title?: string;
  type?: string; // e.g., bar, line, pie, area, groupedbar etc.
  height?: number;
  widthFr?: string;
  data?: { schema?: string; table?: string; dimension?: string; measure?: string; agg?: string };
  style?: { tw?: string };
};

const dashOpenRe = /<dashboard\b[^>]*>/i;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function escRe(s: string): string {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMeasureExpr(metric?: string, agg?: string): string | undefined {
  const m = (metric || "").trim();
  const a = (agg || "").trim().toUpperCase();
  if (!m) return undefined;
  if (!a) return `SUM(${m})`;
  if (["SUM", "COUNT", "AVG", "MIN", "MAX"].includes(a)) return `${a}(${m})`;
  return `SUM(${m})`;
}

export function normalizeSchemaTable(schema?: string, table?: string): { schema?: string; table?: string } {
  const s = (schema || "").trim();
  const tbl = (table || "").trim();
  if (tbl.includes(".")) {
    const i = tbl.indexOf(".");
    const s2 = tbl.slice(0, i);
    const t2 = tbl.slice(i + 1);
    return { schema: s || s2, table: t2 };
  }
  return { schema: s || undefined, table: tbl || undefined };
}

export function setAttrOnNode(source: string, id: string, name: string, value: string): string {
  const re = new RegExp(`(<(kpi|chart|group)\\b[^>]*\\bid=\"${escRe(id)}\"[^>]*)(\\/?>)`, "gi");
  return source.replace(re, (match, attrs: string, _tag: string, end: string) => {
    const attrRe = new RegExp(`\\b${name}\\=\"[^\"]*\"`);
    let newAttrs = attrs;
    if (attrRe.test(attrs)) newAttrs = attrs.replace(attrRe, `${name}="${escapeHtml(value)}"`);
    else newAttrs = `${attrs} ${name}="${escapeHtml(value)}"`;
    return newAttrs + end;
  });
}

export function setAttrOnDatasource(
  source: string,
  id: string,
  attrs: Record<string, string | undefined>
): string {
  const idRe = new RegExp(`(<(kpi|chart)\\b([^>]*)\\bid=\"${escRe(id)}\"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "i");
  return source.replace(idRe, (match: string, open: string, _tag: string, _attrs: string, inner: string, close: string) => {
    const dsRe = /<datasource\b([^>]*)\/>/i;
    const dsMatch = inner.match(dsRe);
    let dsAttrs = dsMatch?.[1] || "";
    const setAttr = (attrString: string, name: string, value: string | undefined) => {
      if (value == null || value === "") return attrString;
      const re = new RegExp(`(\\b${name}\\=\")[^\"]*(\")`, "i");
      if (re.test(attrString)) return attrString.replace(re, `$1${escapeHtml(value)}$2`);
      return `${attrString} ${name}=\"${escapeHtml(value)}\"`;
    };
    for (const [k, v] of Object.entries(attrs)) dsAttrs = setAttr(dsAttrs, k, v);
    const updatedInner = dsMatch
      ? inner.replace(dsRe, `<datasource${dsAttrs ? " " + dsAttrs : ""} />`)
      : `<datasource${dsAttrs ? " " + dsAttrs : ""} />\n` + inner;
    return open + updatedInner + close;
  });
}

export function setConfigOnNode(
  source: string,
  id: string,
  updater: (cfg: Record<string, unknown>) => Record<string, unknown>
): string {
  const reNode = new RegExp(`(<(kpi|chart)\\b[^>]*\\bid=\"${escRe(id)}\"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "i");
  return source.replace(reNode, (match: string, open: string, inner: string, close: string) => {
    const cfgRe = /<config\b[^>]*>([\s\S]*?)<\/config>/i;
    const cfgMatch = inner.match(cfgRe);
    let current: Record<string, unknown> = {};
    if (cfgMatch && cfgMatch[1]) {
      try {
        current = JSON.parse(cfgMatch[1].trim()) as Record<string, unknown>;
      } catch {
        current = {};
      }
    }
    const nextCfg = updater(current);
    const json = JSON.stringify(nextCfg, null, 2);
    if (cfgMatch) inner = inner.replace(cfgRe, `<config>\n${json}\n</config>`);
    else inner = `<config>\n${json}\n</config>\n` + inner;
    return open + inner + close;
  });
}

export function removeWidgetByIdDSL(code: string, id: string): { code: string; removed: number } {
  const esc = escRe(id);
  let removed = 0;
  // Remove paired tags for kpi or chart
  const re = new RegExp(`\n?\s*<((?:kpi|chart))\\b[^>]*\\bid=\"${esc}\"[^>]*>([\\s\\S]*?)<\\/\\1>\s*\n?`, 'gi');
  let next = code;
  let prev;
  do {
    prev = next;
    next = next.replace(re, () => {
      removed++;
      return '';
    });
  } while (next !== prev);
  // Normalize multiple blank lines
  next = next.replace(/\n{3,}/g, '\n\n');
  return { code: next, removed };
}

export function ensureGroupExists(code: string, spec: GroupSpec): { code: string; created: boolean } {
  const { id, title, orientation = "horizontal", sizing = "fr", colsD = 12, gapX = 16, gapY = 16, style } = spec;
  const exists = new RegExp(`<group\\b[^>]*\\bid=\"${escRe(id)}\"`, "i").test(code);
  if (exists) return { code, created: false };

  const styleJson = style && Object.keys(style).length > 0 ? `\n  <style>${JSON.stringify(style)}</style>` : "";
  const groupBlock = `\n  <group id="${escapeHtml(id)}" title="${escapeHtml(title || id)}" sizing="${escapeHtml(
    sizing
  )}" orientation="${escapeHtml(orientation)}" cols-d="${colsD}" gap-x="${gapX}" gap-y="${gapY}">` +
    `${styleJson}\n  </group>\n`;

  // Insert before </dashboard>, or after the opening tag if closing not found
  const closeIdx = code.search(/<\/dashboard>/i);
  if (closeIdx >= 0) {
    return { code: code.slice(0, closeIdx) + groupBlock + code.slice(closeIdx), created: true };
  }
  // Fallback: after <dashboard ...>
  const m = code.match(dashOpenRe);
  if (m && typeof m.index === "number") {
    const insertAt = m.index + m[0].length;
    return { code: code.slice(0, insertAt) + `\n` + groupBlock + code.slice(insertAt), created: true };
  }
  // No dashboard tag found, append
  return { code: code + `\n` + groupBlock, created: true };
}

export function insertKpiInGroup(code: string, groupId: string, spec: KPIWidgetSpec): string {
  const { id, title, unit, height = 150, widthFr = "1fr", data, style } = spec;
  const measure = buildMeasureExpr(data?.measure, data?.agg) || data?.measure || "";
  const norm = normalizeSchemaTable(data?.schema, data?.table);
  const tw = [style?.tw || "", unit ? `kpi:unit:${unit}` : ""].filter(Boolean).join(" ");
  const block =
    `\n    <kpi id="${escapeHtml(id)}" width="${escapeHtml(widthFr)}" height="${height}" title="${escapeHtml(
      title || id
    )}">\n` +
    `      <datasource${norm.schema ? ` schema="${escapeHtml(norm.schema)}"` : ""}${
      norm.table ? ` table="${escapeHtml(norm.table)}"` : ""
    }${measure ? ` measure="${escapeHtml(measure)}"` : ""} />\n` +
    `      <styling tw="${escapeHtml(tw)}" />\n` +
    `    </kpi>\n`;

  const re = new RegExp(`(<group\\b[^>]*\\bid=\"${escRe(groupId)}\"[^>]*>)([\\s\\S]*?)(<\\/group>)`, "i");
  if (!re.test(code)) return code; // group must exist
  return code.replace(re, (match: string, open: string, inner: string, close: string) => {
    return open + inner + block + close;
  });
}

export function insertChartInGroup(code: string, groupId: string, spec: ChartWidgetSpec): string {
  const { id, title, type = "bar", height = 360, widthFr = "1fr", data, style } = spec;
  const measure = buildMeasureExpr(data?.measure, data?.agg) || data?.measure || "";
  const norm = normalizeSchemaTable(data?.schema, data?.table);
  const tw = style?.tw || "";
  const attrs: string[] = [];
  if (data?.dimension) attrs.push(`dimension=\"${escapeHtml(data.dimension)}\"`);
  if (measure) attrs.push(`measure=\"${escapeHtml(measure)}\"`);
  const block =
    `\n    <chart id="${escapeHtml(id)}" type="${escapeHtml(type)}" width="${escapeHtml(widthFr)}" height="${height}" title="${escapeHtml(
      title || id
    )}">\n` +
    `      <datasource${norm.schema ? ` schema="${escapeHtml(norm.schema)}"` : ""}${
      norm.table ? ` table="${escapeHtml(norm.table)}"` : ""
    }${attrs.length ? " " + attrs.join(" ") : ""} />\n` +
    `      <styling tw="${escapeHtml(tw)}" />\n` +
    `    </chart>\n`;

  const re = new RegExp(`(<group\\b[^>]*\\bid=\"${escRe(groupId)}\"[^>]*>)([\\s\\S]*?)(<\\/group>)`, "i");
  if (!re.test(code)) return code;
  return code.replace(re, (match: string, open: string, inner: string, close: string) => {
    return open + inner + block + close;
  });
}

export function setDashboardAttrs(
  code: string,
  attrs: { title?: string; subtitle?: string; theme?: string; dateRange?: { type: string; startDate?: string; endDate?: string } }
): string {
  const m = code.match(dashOpenRe);
  if (!m) return code;
  const openTag = m[0];
  const attrsStr = openTag.slice("<dashboard".length, openTag.length - 1);
  const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
  const kv: Record<string, string> = {};
  for (const match of attrsStr.matchAll(attrRegex)) kv[match[1]] = match[2];
  if (attrs.title != null) kv["title"] = attrs.title;
  if (attrs.subtitle != null) kv["subtitle"] = attrs.subtitle;
  if (attrs.theme != null) kv["theme"] = attrs.theme;
  if (attrs.dateRange) {
    const dr = attrs.dateRange;
    if (dr.type === "custom") {
      kv["date-type"] = "custom";
      if (dr.startDate) kv["date-start"] = dr.startDate;
      if (dr.endDate) kv["date-end"] = dr.endDate;
    } else if (dr.type) {
      kv["date-type"] = dr.type;
      delete kv["date-start"];
      delete kv["date-end"];
    }
  }
  const rebuilt = `<dashboard ${Object.entries(kv)
    .map(([k, v]) => `${k}="${escapeHtml(String(v))}` + `"`)
    .join(" ")}>`;
  return code.replace(openTag, rebuilt);
}
