"use client";

export type CommandKind =
  | "addChart"
  | "addKPI"
  | "addWidget"
  | "addGroup"
  | "addSection"
  | "removeSection"
  | "updateArticle"
  | "updateHeader"
  | "updateSection"
  | "createSection"
  | "createArticle"
  | "setDashboard"
  | "deleteWidget"
  | "deleteGroupt"
  | "updateWidget"
  | "updateGroup";

export type BaseCommand<TKind extends CommandKind = CommandKind, TArgs = unknown> = {
  kind: TKind;
  raw: string;
  line: number;
  args: TArgs;
};

export type AddChartArgs = {
  id: string;
  title?: string;
  type?: string; // default 'bar'
  height?: number;
  group?: string; // for DSL grid mode
  row?: string; // for DSL grid-per-row / JSON legacy
  spanD?: number; // grid-per-row
  widthFr?: string; // e.g., '1fr' for group sizing="fr"
  data?: {
    schema?: string;
    table?: string;
    dimension?: string;
    measure?: string;
    agg?: "SUM" | "COUNT" | "AVG" | "MIN" | "MAX" | string;
  };
  style?: { tw?: string };
};

export type AddKPIArgs = {
  id: string;
  title?: string;
  unit?: string;
  height?: number;
  group?: string;
  row?: string;
  spanD?: number;
  widthFr?: string;
  data?: {
    schema?: string;
    table?: string;
    measure?: string;
    agg?: "SUM" | "COUNT" | "AVG" | "MIN" | "MAX" | string;
  };
  style?: { tw?: string };
};

export type AddGroupArgs = {
  id: string;
  title?: string;
  orientation?: "horizontal" | "vertical";
  sizing?: "fr" | "auto";
  colsD?: number;
  gapX?: number;
  gapY?: number;
  children?: string[];
  style?: Record<string, unknown>;
};

export type AddSectionArgs = {
  id: string;
  type: 'kpis' | 'charts';
  colsD?: number;
  colsT?: number;
  colsM?: number;
  gapX?: number;
  gapY?: number;
};

export type UpdateSectionArgs = {
  id: string;
  display?: 'flex' | 'grid';
  gap?: number;
  // Flex
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  // Grid
  gridTemplateColumns?: string;
  // Spacing and container
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
  borderRadius?: number;
};

export type CreateSectionArgs = {
  id: string;
  type: 'kpis' | 'charts';
  style?: Omit<UpdateSectionArgs, 'id'>;
};

export type CreateArticleArgs = {
  sectionId: string;
  id: string;
  type: 'kpi' | 'chart';
  title?: string;
  height?: number;
  widthFr?: number | string;
  // Visual container
  backgroundColor?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
  borderRadius?: number;
  // Chart-only fields
  chartType?: string;
  categories?: string[];
  values?: Array<number>;
};

export type SetDashboardArgs = {
  title?: string;
  subtitle?: string;
  theme?: string;
  dateRange?: { type: string; startDate?: string; endDate?: string };
};

export type Command =
  | BaseCommand<"addChart", AddChartArgs>
  | BaseCommand<"addKPI", AddKPIArgs>
  | BaseCommand<"addWidget", AddWidgetArgs>
  | BaseCommand<"addGroup", AddGroupArgs>
  | BaseCommand<"addSection", AddSectionArgs>
  | BaseCommand<"removeSection", { id: string }>
  | BaseCommand<"updateArticle", { id: string; title?: string; style?: Record<string, unknown> }>
  | BaseCommand<"updateHeader", { title?: string; subtitle?: string }>
  | BaseCommand<"updateSection", UpdateSectionArgs>
  | BaseCommand<"createSection", CreateSectionArgs>
  | BaseCommand<"createArticle", CreateArticleArgs>
  | BaseCommand<"setDashboard", SetDashboardArgs>
  | BaseCommand<"deleteWidget", { id: string }>
  | BaseCommand<"deleteGroupt", { id: string }>
  | BaseCommand<"updateWidget", UpdateWidgetArgs>
  | BaseCommand<"updateGroup", UpdateGroupArgs>;

export type AddWidgetArgs = AddChartArgs & { chartType?: string };

export type UpdateWidgetArgs = {
  id: string;
  title?: string;
  height?: number;
  widthFr?: string;
  type?: string;
  row?: string;
  spanD?: number;
  data?: { schema?: string; table?: string; dimension?: string; measure?: string; agg?: string };
  style?: { tw?: string };
  chartConfig?: { styling?: { colors?: string[] }, margin?: { left?: number; top?: number; bottom?: number }, layout?: string };
};

export type UpdateGroupArgs = {
  id: string;
  title?: string;
  orientation?: "horizontal" | "vertical" | string;
  sizing?: string;
  colsD?: number;
  gapX?: number;
  gapY?: number;
  style?: Record<string, unknown>;
};

export type CommandError = { line: number; message: string; raw?: string };

export type ParseResult = { commands: Command[]; errors: CommandError[] };

function stripComments(input: string): string {
  // remove // comments to end of line, but keep inside strings naive-safe by excluding within quotes via simple state
  const lines = input.split(/\r?\n/);
  return lines
    .map((line) => {
      let inString = false;
      let escape = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') inString = !inString;
        if (!inString && ch === "/" && line[i + 1] === "/") {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join("\n");
}

function splitStatements(input: string): { text: string; line: number }[] {
  const src = input;
  const out: { text: string; line: number }[] = [];
  let start = 0;
  let depth = 0;
  let depthP = 0; // parentheses depth
  let inString = false;
  let escape = false;
  let line = 1;
  let startLine = 1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\n") line++;
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (ch === "(") depthP++;
    else if (ch === ")") depthP = Math.max(0, depthP - 1);
    else if (ch === ";" && depth === 0 && depthP === 0) {
      const stmt = src.slice(start, i).trim();
      if (stmt) out.push({ text: stmt, line: startLine });
      start = i + 1;
      startLine = line;
    }
  }
  const tail = src.slice(start).trim();
  if (tail) out.push({ text: tail, line: startLine });
  return out;
}

function parseArgs(jsonLike: string): any {
  // expect standard JSON; we could relax later if needed
  return JSON.parse(jsonLike);
}

function assignNested(target: any, path: string, value: any) {
  const parts = path.split('.');
  let obj = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!obj[k] || typeof obj[k] !== 'object') obj[k] = {};
    obj = obj[k];
  }
  obj[parts[parts.length - 1]] = value;
}

function parseInlineArgs(argStr: string): any {
  const s = String(argStr || '').trim();
  const args: Record<string, unknown> = {};
  if (!s) return args;

  let i = 0;
  let inString = false; // only double quotes considered strings for inline
  let inSingle = false;
  let escape = false;
  let depthB = 0; // {}
  let depthA = 0; // []
  const items: string[] = [];
  let start = 0;
  const pushItem = (end: number) => {
    const raw = s.slice(start, end).trim();
    if (raw) items.push(raw);
  };
  while (i < s.length) {
    const ch = s[i];
    if (escape) { escape = false; i++; continue; }
    if (ch === '\\') { escape = true; i++; continue; }
    if (!inSingle && ch === '"') { inString = !inString; i++; continue; }
    if (!inString && ch === '\'') { inSingle = !inSingle; i++; continue; }
    if (!inString && !inSingle) {
      if (ch === '{') depthB++;
      else if (ch === '}') depthB = Math.max(0, depthB - 1);
      else if (ch === '[') depthA++;
      else if (ch === ']') depthA = Math.max(0, depthA - 1);
      else if (ch === ';' && depthA === 0 && depthB === 0) { pushItem(i); start = i + 1; i++; continue; }
    }
    i++;
  }
  pushItem(s.length);

  const parseValue = (valRaw: string): any => {
    const v = valRaw.trim();
    if (!v) return '';
    // JSON object/array
    if (v.startsWith('{') || v.startsWith('[')) {
      try { return JSON.parse(v); } catch { return v; }
    }
    // quoted string (double or single)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) {
      try { return JSON.parse(v.replace(/^'/, '"').replace(/'$/, '"')); } catch { return v.slice(1, -1); }
    }
    // number
    if (/^[+-]?\d+(?:\.\d+)?$/.test(v)) { const n = Number(v); if (!Number.isNaN(n)) return n; }
    // boolean
    if (v === 'true') return true;
    if (v === 'false') return false;
    // fallback: treat as string (user should quote strings, but be tolerant)
    return v;
  };

  for (const it of items) {
    if (!it) continue;
    // find first ':' at top-level
    let j = 0, pos = -1;
    inString = false; inSingle = false; escape = false; depthB = 0; depthA = 0;
    while (j < it.length) {
      const c = it[j];
      if (escape) { escape = false; j++; continue; }
      if (c === '\\') { escape = true; j++; continue; }
      if (!inSingle && c === '"') { inString = !inString; j++; continue; }
      if (!inString && c === '\'') { inSingle = !inSingle; j++; continue; }
      if (!inString && !inSingle) {
        if (c === '{') depthB++;
        else if (c === '}') depthB = Math.max(0, depthB - 1);
        else if (c === '[') depthA++;
        else if (c === ']') depthA = Math.max(0, depthA - 1);
        else if (c === ':' && depthA === 0 && depthB === 0) { pos = j; break; }
      }
      j++;
    }
    if (pos === -1) continue; // invalid item
    const key = it.slice(0, pos).trim();
    const val = it.slice(pos + 1).trim();
    if (!key) continue;
    assignNested(args, key, parseValue(val));
  }
  return args;
}

export function parseCommands(text: string): ParseResult {
  const cleaned = stripComments(text || "");
  const stmts = splitStatements(cleaned);
  const errors: CommandError[] = [];
  const commands: Command[] = [];

  for (const { text: stmt, line } of stmts) {
    // Use [\s\S]* instead of dotAll flag to support ES2017 target
    const m = stmt.match(/^(\w+)\s*\(([\s\S]*)\)\s*$/);
    if (!m) {
      // Ignore non-matching statements silently to be tolerant with comments or stray semicolons
      continue;
    }
    const name = m[1] as CommandKind;
    const argStr = m[2];
    if (!name) {
      errors.push({ line, message: "Comando ausente.", raw: stmt });
      continue;
    }
    // Special shorthand support for deleteWidget: deleteWidget("id") or deleteWidget(id)
    // Skip shorthand when inline key:value; syntax is used (contains ':')
    if (name === 'deleteWidget') {
      const t = (argStr || '').trim();
      if (!t.startsWith('{') && !t.includes(':')) {
        let idVal = t;
        if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
          idVal = t.slice(1, -1);
        }
        if (idVal) {
          commands.push({ kind: 'deleteWidget', line, raw: stmt, args: { id: idVal } });
          continue;
        }
      }
    }
    // Special shorthand for deleteGroupt("id") or deleteGroupt(id)
    if (name === 'deleteGroupt') {
      const t = (argStr || '').trim();
      if (!t.startsWith('{') && !t.includes(':')) {
        let idVal = t;
        if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
          idVal = t.slice(1, -1);
        }
        if (idVal) {
          commands.push({ kind: 'deleteGroupt', line, raw: stmt, args: { id: idVal } });
          continue;
        }
      }
    }

    let args: any;
    const trimmed = (argStr || '').trim();
    if (!trimmed.startsWith('{')) {
      // inline syntax: key: "value"; key2: 123;
      try {
        args = parseInlineArgs(trimmed);
      } catch (e) {
        errors.push({ line, message: `Sintaxe inline inválida: ${(e as Error).message}` });
        continue;
      }
    } else {
      try {
        args = parseArgs(argStr);
      } catch (e) {
        errors.push({ line, message: `JSON inválido nos argumentos: ${(e as Error).message}` });
        continue;
      }
    }

    // Validate basics per command
    const lower = String(name);
    if (lower === "addChart") {
      if (!args?.id) {
        errors.push({ line, message: "addChart requer 'id'" });
        continue;
      }
      commands.push({ kind: "addChart", line, raw: stmt, args: args as AddChartArgs });
      continue;
    }
    if (lower === "addKPI") {
      if (!args?.id) {
        errors.push({ line, message: "addKPI requer 'id'" });
        continue;
      }
      commands.push({ kind: "addKPI", line, raw: stmt, args: args as AddKPIArgs });
      continue;
    }
    if (lower === "addWidget") {
      if (!args?.id) {
        errors.push({ line, message: "addWidget requer 'id'" });
        continue;
      }
      commands.push({ kind: "addWidget", line, raw: stmt, args: args as AddWidgetArgs });
      continue;
    }
    if (lower === "addGroup") {
      if (!args?.id) {
        errors.push({ line, message: "addGroup requer 'id'" });
        continue;
      }
      commands.push({ kind: "addGroup", line, raw: stmt, args: args as AddGroupArgs });
      continue;
    }
    if (lower === "addSection") {
      if (!args?.id || !args?.type) {
        errors.push({ line, message: "addSection requer 'id' e 'type' (kpis|charts)" });
        continue;
      }
      const ty = String(args.type).toLowerCase();
      if (ty !== 'kpis' && ty !== 'charts') {
        errors.push({ line, message: "addSection 'type' deve ser 'kpis' ou 'charts'" });
        continue;
      }
      commands.push({ kind: "addSection", line, raw: stmt, args: args as AddSectionArgs });
      continue;
    }
    if (lower === "removeSection") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "removeSection requer 'id' (string)" });
        continue;
      }
      commands.push({ kind: "removeSection", line, raw: stmt, args: { id: args.id } });
      continue;
    }
    if (lower === "updateArticle") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "updateArticle requer 'id' (string)" });
        continue;
      }
      const hasTitle = Object.prototype.hasOwnProperty.call(args, 'title');
      const hasStyle = Object.prototype.hasOwnProperty.call(args, 'style');
      if (!hasTitle && !hasStyle) {
        errors.push({ line, message: "updateArticle requer 'title' e/ou 'style'" });
        continue;
      }
      const payload: any = { id: args.id };
      if (hasTitle && typeof args.title === 'string') payload.title = args.title;
      if (hasStyle && typeof args.style === 'object') payload.style = args.style;
      commands.push({ kind: "updateArticle", line, raw: stmt, args: payload });
      continue;
    }
    if (lower === "updateHeader") {
      const hasTitle = args && Object.prototype.hasOwnProperty.call(args, 'title');
      const hasSubtitle = args && Object.prototype.hasOwnProperty.call(args, 'subtitle');
      if (!hasTitle && !hasSubtitle) {
        errors.push({ line, message: "updateHeader requer 'title' e/ou 'subtitle'" });
        continue;
      }
      const payload: { title?: string; subtitle?: string } = {};
      if (hasTitle && typeof args.title === 'string') payload.title = args.title;
      if (hasSubtitle && typeof args.subtitle === 'string') payload.subtitle = args.subtitle;
      commands.push({ kind: "updateHeader", line, raw: stmt, args: payload });
      continue;
    }
    if (lower === "setDashboard") {
      commands.push({ kind: "setDashboard", line, raw: stmt, args: args as SetDashboardArgs });
      continue;
    }

    if (lower === "createSection") {
      if (!args?.id || !args?.type) {
        errors.push({ line, message: "createSection requer 'id' e 'type' (kpis|charts)" });
        continue;
      }
      const ty = String(args.type).toLowerCase();
      if (ty !== 'kpis' && ty !== 'charts') {
        errors.push({ line, message: "createSection 'type' deve ser 'kpis' ou 'charts'" });
        continue;
      }
      commands.push({ kind: "createSection", line, raw: stmt, args: args as CreateSectionArgs });
      continue;
    }
    if (lower === "updateSection") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "updateSection requer 'id' (string)" });
        continue;
      }
      commands.push({ kind: "updateSection", line, raw: stmt, args: args as UpdateSectionArgs });
      continue;
    }
    if (lower === "createArticle") {
      if (!args?.sectionId || !args?.id || !args?.type) {
        errors.push({ line, message: "createArticle requer 'sectionId', 'id' e 'type' (kpi|chart)" });
        continue;
      }
      const ty = String(args.type).toLowerCase();
      if (ty !== 'kpi' && ty !== 'chart') {
        errors.push({ line, message: "createArticle 'type' deve ser 'kpi' ou 'chart'" });
        continue;
      }
      commands.push({ kind: "createArticle", line, raw: stmt, args: args as CreateArticleArgs });
      continue;
    }

    if (lower === "deleteWidget") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "deleteWidget requer 'id' (string)" });
        continue;
      }
      commands.push({ kind: "deleteWidget", line, raw: stmt, args: { id: args.id } });
      continue;
    }
    if (lower === "deleteGroupt") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "deleteGroupt requer 'id' (string)" });
        continue;
      }
      commands.push({ kind: "deleteGroupt", line, raw: stmt, args: { id: args.id } });
      continue;
    }

    if (lower === "updateWidget") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "updateWidget requer 'id' (string)" });
        continue;
      }
      commands.push({ kind: "updateWidget", line, raw: stmt, args: args as UpdateWidgetArgs });
      continue;
    }
    if (lower === "updateGroup") {
      if (!args?.id || typeof args.id !== 'string') {
        errors.push({ line, message: "updateGroup requer 'id' (string)" });
        continue;
      }
      commands.push({ kind: "updateGroup", line, raw: stmt, args: args as UpdateGroupArgs });
      continue;
    }

    errors.push({ line, message: `Comando desconhecido: ${name}` });
  }

  return { commands, errors };
}
