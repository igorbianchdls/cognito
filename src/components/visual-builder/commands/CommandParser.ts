"use client";

export type CommandKind =
  | "addChart"
  | "addKPI"
  | "addGroup"
  | "setDashboard";

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

export type SetDashboardArgs = {
  title?: string;
  subtitle?: string;
  theme?: string;
  dateRange?: { type: string; startDate?: string; endDate?: string };
};

export type Command =
  | BaseCommand<"addChart", AddChartArgs>
  | BaseCommand<"addKPI", AddKPIArgs>
  | BaseCommand<"addGroup", AddGroupArgs>
  | BaseCommand<"setDashboard", SetDashboardArgs>;

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
    else if (ch === ";" && depth === 0) {
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

export function parseCommands(text: string): ParseResult {
  const cleaned = stripComments(text || "");
  const stmts = splitStatements(cleaned);
  const errors: CommandError[] = [];
  const commands: Command[] = [];

  for (const { text: stmt, line } of stmts) {
    // Use [\s\S]* instead of dotAll flag to support ES2017 target
    const m = stmt.match(/^(\w+)\s*\(([\s\S]*)\)\s*$/);
    if (!m) {
      errors.push({ line, message: "Sintaxe inválida. Esperado: comando({...})", raw: stmt });
      continue;
    }
    const name = m[1] as CommandKind;
    const argStr = m[2];
    if (!name) {
      errors.push({ line, message: "Comando ausente.", raw: stmt });
      continue;
    }
    let args: any;
    try {
      args = parseArgs(argStr);
    } catch (e) {
      errors.push({ line, message: `JSON inválido nos argumentos: ${(e as Error).message}` });
      continue;
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
    if (lower === "addGroup") {
      if (!args?.id) {
        errors.push({ line, message: "addGroup requer 'id'" });
        continue;
      }
      commands.push({ kind: "addGroup", line, raw: stmt, args: args as AddGroupArgs });
      continue;
    }
    if (lower === "setDashboard") {
      commands.push({ kind: "setDashboard", line, raw: stmt, args: args as SetDashboardArgs });
      continue;
    }

    errors.push({ line, message: `Comando desconhecido: ${name}` });
  }

  return { commands, errors };
}
