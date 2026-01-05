// Utilities to manipulate the HTML-like Liquid/HTML string used by the Visual Builder.

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

export function removeGroupByIdDSL(code: string, id: string): { code: string; removed: number } {
  const esc = escRe(id);
  let removed = 0;
  const re = new RegExp(`\n?\s*<(group)\\b[^>]*\\bid=\"${esc}\"[^>]*>([\\s\\S]*?)<\\/\\1>\s*\n?`, 'gi');
  let next = code;
  let prev;
  do {
    prev = next;
    next = next.replace(re, () => {
      removed++;
      return '';
    });
  } while (next !== prev);
  next = next.replace(/\n{3,}/g, '\n\n');
  return { code: next, removed };
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
  // Leave title/subtitle handling to <header> upsert (Liquid-first)
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

// Upsert <header> tag with title/subtitle (and simple style attrs) right after <dashboard ...>
export function upsertHeaderTag(
  code: string,
  data: { title?: string; subtitle?: string; [k: string]: unknown }
): string {
  const m = code.match(dashOpenRe);
  if (!m) return code;
  const dashOpen = m[0];
  const start = (m.index || 0) + dashOpen.length;
  const post = code.slice(start);

  const esc = (v: unknown) => escapeHtml(String(v));
  const t = (data.title ?? '').toString().trim();
  const s = (data.subtitle ?? '').toString().trim();

  // Container attrs (kebab-case)
  const headerAttrs: string[] = [];
  const pushHeader = (k: string, v: unknown) => { if (v !== undefined && v !== '') headerAttrs.push(`${k}="${esc(v)}"`); };
  pushHeader('background-color', (data as any).backgroundColor);
  pushHeader('border-color', (data as any).borderColor);
  pushHeader('border-width', (data as any).borderWidth);
  pushHeader('border-style', (data as any).borderStyle);
  if (typeof (data as any).showDatePicker === 'boolean') pushHeader('show-date-picker', (data as any).showDatePicker ? 'true' : 'false');

  // h1/h2 attrs (kebab-case)
  const h1Attrs: string[] = [];
  const h2Attrs: string[] = [];
  const pushH1 = (k: string, v: unknown) => { if (v !== undefined && v !== '') h1Attrs.push(`${k}="${esc(v)}"`); };
  const pushH2 = (k: string, v: unknown) => { if (v !== undefined && v !== '') h2Attrs.push(`${k}="${esc(v)}"`); };
  pushH1('font-family', (data as any).titleFontFamily);
  pushH1('font-size', (data as any).titleFontSize);
  pushH1('font-weight', (data as any).titleFontWeight);
  pushH1('color', (data as any).titleColor);
  pushH1('letter-spacing', (data as any).titleLetterSpacing);
  pushH1('line-height', (data as any).titleLineHeight);
  pushH1('text-align', (data as any).titleTextAlign);
  pushH1('text-transform', (data as any).titleTextTransform);
  pushH1('margin-top', (data as any).titleMarginTop);
  pushH1('margin-right', (data as any).titleMarginRight);
  pushH1('margin-bottom', (data as any).titleMarginBottom);
  pushH1('margin-left', (data as any).titleMarginLeft);
  pushH2('font-family', (data as any).subtitleFontFamily);
  pushH2('font-size', (data as any).subtitleFontSize);
  pushH2('font-weight', (data as any).subtitleFontWeight);
  pushH2('color', (data as any).subtitleColor);
  pushH2('letter-spacing', (data as any).subtitleLetterSpacing);
  pushH2('line-height', (data as any).subtitleLineHeight);
  pushH2('text-align', (data as any).subtitleTextAlign);
  pushH2('text-transform', (data as any).subtitleTextTransform);
  pushH2('margin-top', (data as any).subtitleMarginTop);
  pushH2('margin-right', (data as any).subtitleMarginRight);
  pushH2('margin-bottom', (data as any).subtitleMarginBottom);
  pushH2('margin-left', (data as any).subtitleMarginLeft);

  const titles: string[] = [];
  if (t) titles.push(`    <h1${h1Attrs.length ? ' ' + h1Attrs.join(' ') : ''}>${esc(t)}</h1>`);
  if (s) titles.push(`    <h2${h2Attrs.length ? ' ' + h2Attrs.join(' ') : ''}>${esc(s)}</h2>`);
  // Optional <datepicker>
  const dp: string[] = [];
  const pushDp = (k: string, v: unknown) => { if (v !== undefined && v !== '') dp.push(`${k}="${esc(v)}` + `"`); };
  pushDp('type', (data as any).datePickerType);
  pushDp('start', (data as any).datePickerStart);
  pushDp('end', (data as any).datePickerEnd);
  pushDp('align', (data as any).datePickerAlign);
  pushDp('variant', (data as any).datePickerVariant);
  pushDp('size', (data as any).datePickerSize);
  if (typeof (data as any).datePickerMonths === 'number') pushDp('number-of-months', (data as any).datePickerMonths);
  if (typeof (data as any).datePickerQuickPresets === 'boolean') pushDp('quick-presets', (data as any).datePickerQuickPresets ? 'true' : 'false');
  pushDp('locale', (data as any).datePickerLocale);
  pushDp('format', (data as any).datePickerFormat);
  const hasDp = dp.length || (data as any).showDatePicker;
  const blocks: string[] = [];
  if (titles.length) blocks.push(`  <div class=\"header-titles\">\n${titles.join('\n')}\n  </div>`);
  if (hasDp) blocks.push(`  <div class=\"header-actions\">\n    <datepicker${dp.length ? ' ' + dp.join(' ') : ''}></datepicker>\n  </div>`);
  const tag = `<header${headerAttrs.length ? ' ' + headerAttrs.join(' ') : ''}>\n${blocks.join('\n')}\n</header>`;

  // Replace existing <header .../> or <header ...>...</header>
  const rePair = /<header\b[^>]*>[\s\S]*?<\/header>/i;
  const reSelf = /<header\b[^>]*\/>/i;
  if (rePair.test(code)) return code.replace(rePair, tag);
  if (reSelf.test(code)) return code.replace(reSelf, tag);
  // Insert after optional immediate <style> block or comments
  const earlyStyle = post.match(/^\s*(?:<!--[\s\S]*?-->\s*)*(<style\b[\s\S]*?<\/style>)/i);
  if (earlyStyle && typeof earlyStyle.index === 'number') {
    const insertAt = start + (earlyStyle.index + earlyStyle[0].length);
    return code.slice(0, insertAt) + `\n  ${tag}\n` + code.slice(insertAt);
  }
  // Default: directly after <dashboard>
  return code.slice(0, start) + `\n  ${tag}\n` + code.slice(start);
}

// Ensure a <section data-type="..." id="..."> exists; if not, create an empty one before </dashboard>
export function ensureSectionExists(
  code: string,
  spec: { id: string; type: 'kpis' | 'charts'; colsD?: number; colsT?: number; colsM?: number; gapX?: number; gapY?: number }
): { code: string; created: boolean } {
  const { id, type, colsD = 3, colsT = 2, colsM = 1, gapX = 16, gapY = 16 } = spec;
  const exists = new RegExp(`<section\\b[^>]*\\bid=\"${escRe(id)}\"`, 'i').test(code);
  if (exists) return { code, created: false };
  const block = `\n  <section data-type="${escapeHtml(type)}" id="${escapeHtml(id)}" data-cols-d="${colsD}" data-cols-t="${colsT}" data-cols-m="${colsM}" data-gap-x="${gapX}" data-gap-y="${gapY}">\n  </section>\n`;
  const closeIdx = code.search(/<\/dashboard>/i);
  if (closeIdx >= 0) return { code: code.slice(0, closeIdx) + block + code.slice(closeIdx), created: true };
  const m = code.match(dashOpenRe);
  if (m && typeof m.index === 'number') {
    const insertAt = m.index + m[0].length;
    return { code: code.slice(0, insertAt) + `\n` + block + code.slice(insertAt), created: true };
  }
  return { code: code + `\n` + block, created: true };
}

// Insert KPI <article> into a section by id
export function insertKpiInSection(
  code: string,
  sectionId: string,
  spec: KPIWidgetSpec
): string {
  const { id, title, unit, height = 150, data } = spec;
  const measure = buildMeasureExpr(data?.measure, data?.agg) || data?.measure || '';
  const norm = normalizeSchemaTable(data?.schema, data?.table);
  const unitToken = unit ? ` kpi:unit:${unit}` : '';
  const article = `\n    <article id="${escapeHtml(id)}" data-height="${height}">\n      <h1>${escapeHtml(title || id)}</h1>\n      <h2>{{ schema: ${escapeHtml(norm.schema || '')}; table: ${escapeHtml(norm.table || '')};${measure ? ` measure: ${escapeHtml(measure)}` : ''} }}</h2>\n    </article>\n`;
  const re = new RegExp(`(<section\\b[^>]*\\bid=\"${escRe(sectionId)}\"[^>]*>)([\\s\\S]*?)(<\\/section>)`, 'i');
  if (!re.test(code)) return code;
  return code.replace(re, (match: string, open: string, inner: string, close: string) => {
    // Append styling tw to <main> not used in KPI; keep simple
    return open + inner + article + close;
  });
}

// Insert Chart <article> into a section by id
export function insertChartInSection(
  code: string,
  sectionId: string,
  spec: ChartWidgetSpec
): string {
  const { id, title, type = 'bar', height = 360, data, style } = spec;
  const measure = buildMeasureExpr(data?.measure, data?.agg) || data?.measure || '';
  const norm = normalizeSchemaTable(data?.schema, data?.table);
  const tw = style?.tw || '';
  const article = `\n    <article id="${escapeHtml(id)}" data-height="${height}">\n      <h1>${escapeHtml(title || id)}</h1>\n      <main chart="${escapeHtml(type)}">\n        {{ schema: ${escapeHtml(norm.schema || '')}; table: ${escapeHtml(norm.table || '')};${data?.dimension ? ` dimension: ${escapeHtml(data.dimension)}` : ''}${measure ? `; measure: ${escapeHtml(measure)}` : ''} }}\n        ${tw ? `<style>{\"tw\": \"${escapeHtml(tw)}\"}</style>` : ''}\n      </main>\n    </article>\n`;
  const re = new RegExp(`(<section\\b[^>]*\\bid=\"${escRe(sectionId)}\"[^>]*>)([\\s\\S]*?)(<\\/section>)`, 'i');
  if (!re.test(code)) return code;
  return code.replace(re, (match: string, open: string, inner: string, close: string) => open + inner + article + close);
}

export function removeSectionByIdDSL(code: string, id: string): { code: string; removed: number } {
  const esc = escRe(id);
  let removed = 0;
  const re = new RegExp(`\n?\s*<(section)\\b[^>]*\\bid=\"${esc}\"[^>]*>[\\s\\S]*?<\\/\\1>\s*\n?`, 'gi');
  let next = code;
  let prev;
  do {
    prev = next;
    next = next.replace(re, () => {
      removed++;
      return '';
    });
  } while (next !== prev);
  next = next.replace(/\n{3,}/g, '\n\n');
  return { code: next, removed };
}

export function updateArticleTitleByIdDSL(
  code: string,
  args: { id: string; title: string }
): { code: string; updated: boolean } {
  const id = args.id;
  const title = args.title;
  const esc = escRe(id);
  const re = new RegExp(`(<article\\b[^>]*\\b(?:data-id|id)=\\"${esc}\\"[^>]*>)([\\s\\S]*?)(<\\/article>)`, 'i');
  const m = code.match(re);
  if (!m) return { code, updated: false };
  const open = m[1];
  let inner = m[2];
  const close = m[3];
  const h1Re = /<h1\b[^>]*>[\s\S]*?<\/h1>/i;
  if (h1Re.test(inner)) {
    inner = inner.replace(h1Re, `<h1>${escapeHtml(title)}</h1>`);
  } else {
    inner = `<h1>${escapeHtml(title)}</h1>\n` + inner;
  }
  return { code: code.replace(re, open + inner + close), updated: true };
}

export function setOrInsertStylingTw(code: string, id: string, tw: string): string {
  const reNode = new RegExp(`(<(kpi|chart)\\b[^>]*\\bid=\"${escRe(id)}\"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'i');
  return code.replace(reNode, (match: string, open: string, _tag: string, inner: string, close: string) => {
    const stRe = /<styling\b([^>]*)\/>/i;
    const stMatch = inner.match(stRe);
    if (stMatch) {
      // update tw in existing styling tag
      let attrs = stMatch[1] || '';
      // Extract existing tw value if any
      const twRe = /\btw=\"([^\"]*)\"/i;
      const m = attrs.match(twRe);
      if (m) {
        const current = m[1] || '';
        // Replace existing bg: token if present; otherwise append
        const hasBg = /(?:^|\s)bg:\S+/.test(current);
        const nextTw = hasBg ? current.replace(/(?:^|\s)bg:\S+/, (seg) => seg.replace(/bg:\S+/, `bg:${tw.replace(/^.*bg:/,'').trim()}`)) : (current + (current.trim() ? ' ' : '') + tw);
        attrs = attrs.replace(twRe, `tw=\"${escapeHtml(nextTw)}\"`);
      } else {
        attrs = `${attrs} tw=\"${escapeHtml(tw)}\"`;
      }
      inner = inner.replace(stRe, `<styling${attrs ? ' ' + attrs.trim() : ''} />`);
    } else {
      inner = inner.trimEnd() + `\n      <styling tw=\"${escapeHtml(tw)}\" />`;
    }
    return open + inner + close;
  });
}

export function setGroupStyleJson(code: string, id: string, partial: Record<string, unknown>): string {
  const reNode = new RegExp(`(<group\\b[^>]*\\bid=\"${escRe(id)}\"[^>]*>)([\\s\\S]*?)(<\\/group>)`, 'i');
  return code.replace(reNode, (match: string, open: string, inner: string, close: string) => {
    const stRe = /<style\b[^>]*>([\s\S]*?)<\/style>/i;
    const m = inner.match(stRe);
    let styleObj: Record<string, unknown> = {};
    if (m && m[1]) {
      try { styleObj = JSON.parse(m[1].trim()); } catch {}
    }
    for (const [k,v] of Object.entries(partial || {})) {
      if (v !== undefined) styleObj[k] = v as unknown;
    }
    const json = JSON.stringify(styleObj);
    if (m) inner = inner.replace(stRe, `<style>${json}</style>`);
    else inner = `\n  <style>${json}</style>` + inner;
    return open + inner + close;
  });
}

export function getWidgetTagKind(code: string, id: string): 'kpi' | 'chart' | undefined {
  const esc = escRe(id);
  const re = new RegExp(`<(?:(kpi|chart))\\b[^>]*\\bid=\"${esc}\"`, 'i');
  const m = code.match(re);
  return (m && (m[1] as 'kpi'|'chart')) || undefined;
}

export function dedupeWidgetByIdDSL(code: string, id: string): { code: string; removed: number } {
  const esc = escRe(id);
  const re = new RegExp(`<(kpi|chart)\\b[^>]*\\bid=\"${esc}\"[^>]*>[\\s\\S]*?<\\/\\1>`, 'gi');
  const matches = code.match(re) || [];
  if (matches.length <= 1) return { code, removed: 0 };
  // Keep the first occurrence, remove the others
  let removed = 0;
  let firstKept = false;
  const newCode = code.replace(re, (m) => {
    if (!firstKept) { firstKept = true; return m; }
    removed++;
    return '';
  });
  return { code: newCode.replace(/\n{3,}/g, '\n\n'), removed };
}

export function updateWidgetStylingTwAndKpiBg(code: string, id: string, tw: string): string {
  const esc = escRe(id);
  const reBlock = new RegExp(`(<(kpi|chart)\\b[^>]*\\bid=\"${esc}\"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'i');
  const m = code.match(reBlock);
  if (!m) return code;
  const open = m[1];
  let inner = m[3];
  const close = m[4];

  // Find existing styling tag (self-closing or paired)
  const stRe = /<styling\b([^>]*?)(?:\/>|>\s*<\/styling>)/i;
  const stMatch = inner.match(stRe);
  if (stMatch) {
    let attrs = stMatch[1] || '';
    const twRe = /(\btw=\")(.*?)\"/i;
    const mTw = attrs.match(twRe);
    if (mTw) {
      const current = mTw[2] || '';
      const hasBg = /(?:^|\s)bg:\S+/.test(current);
      const bgNew = (tw.match(/(?:^|\s)bg:(\S+)/i)?.[1]) || '';
      let nextTw = current;
      if (bgNew) {
        nextTw = hasBg ? current.replace(/(?:^|\s)bg:\S+/, (seg) => seg.replace(/bg:\S+/, `bg:${bgNew}`)) : (current + (current.trim() ? ' ' : '') + `bg:${bgNew}`);
      } else {
        // merge generic tokens
        nextTw = current + (current.trim() ? ' ' : '') + tw;
      }
      attrs = attrs.replace(twRe, `tw=\"${escapeHtml(nextTw)}\"`);
    } else {
      attrs = `${attrs} tw=\"${escapeHtml(tw)}\"`;
    }
    inner = inner.replace(stRe, `<styling${attrs ? ' ' + attrs.trim() : ''} />`);
  } else {
    inner = inner.trimEnd() + `\n      <styling tw=\"${escapeHtml(tw)}\" />`;
  }

  // If KPI and tw contains bg:..., also set kpiConfig.kpiContainerBackgroundColor in <config>
  const kind = getWidgetTagKind(code, id);
  const bgMatch = tw.match(/(?:^|\s)bg:(\S+)/i);
  if (kind === 'kpi' && bgMatch) {
    const col = bgMatch[1];
    const cfgRe = /<config\b[^>]*>([\s\S]*?)<\/config>/i;
    const hasCfg = inner.match(cfgRe);
    let obj: Record<string, unknown> = {};
    if (hasCfg && hasCfg[1]) { try { obj = JSON.parse(hasCfg[1].trim()); } catch { obj = {}; } }
    const kc = (obj['kpiConfig'] as Record<string, unknown> | undefined) || {};
    kc['kpiContainerBackgroundColor'] = col;
    obj['kpiConfig'] = kc;
    const json = JSON.stringify(obj, null, 2);
    if (hasCfg) inner = inner.replace(cfgRe, `<config>\n${json}\n</config>`);
    else inner = `<config>\n${json}\n</config>\n` + inner;
  }

  return code.replace(reBlock, open + inner + close);
}
