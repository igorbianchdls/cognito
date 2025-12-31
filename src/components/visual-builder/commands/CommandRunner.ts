"use client";

import type {
  Command,
  AddGroupArgs,
  AddKPIArgs,
  AddChartArgs,
  SetDashboardArgs,
} from "./CommandParser";
import {
  ensureGroupExists,
  insertKpiInGroup,
  insertChartInGroup,
  setDashboardAttrs,
  buildMeasureExpr,
  normalizeSchemaTable,
} from "./HelperEditorToDSL";

export type RunDiagnostics = Array<{ ok: boolean; message: string; line?: number }>;

export function isDsl(code: string): boolean {
  return String(code || "").trim().startsWith("<");
}

export function runCommands(code: string, commands: Command[]): { nextCode: string; diagnostics: RunDiagnostics } {
  let next = String(code || "");
  const diags: RunDiagnostics = [];
  const dsl = isDsl(next);

  for (const cmd of commands) {
    try {
      switch (cmd.kind) {
        case "addGroup": {
          const args = cmd.args as AddGroupArgs;
          if (dsl) {
            const { code: updated, created } = ensureGroupExists(next, {
              id: args.id,
              title: args.title,
              orientation: args.orientation || "horizontal",
              sizing: args.sizing || "fr",
              colsD: args.colsD ?? 12,
              gapX: args.gapX ?? 16,
              gapY: args.gapY ?? 16,
              style: args.style,
            });
            next = updated;
            diags.push({ ok: true, message: created ? `Grupo '${args.id}' criado.` : `Grupo '${args.id}' já existia.`, line: cmd.line });
          } else {
            // JSON path: not implemented for groups in MVP
            diags.push({ ok: false, message: "addGroup ainda não suportado para JSON.", line: cmd.line });
          }
          break;
        }
        case "addKPI": {
          const args = cmd.args as AddKPIArgs;
          if (dsl) {
            const groupId = args.group || "kpis";
            // ensure group exists
            next = ensureGroupExists(next, { id: groupId, title: groupId }).code;
            next = insertKpiInGroup(next, groupId, {
              id: args.id,
              title: args.title,
              unit: args.unit,
              height: args.height ?? 150,
              widthFr: args.widthFr || "1fr",
              data: args.data,
              style: args.style,
            });
            diags.push({ ok: true, message: `KPI '${args.id}' adicionado ao grupo '${groupId}'.`, line: cmd.line });
          } else {
            // JSON path: append widget
            try {
              const root = JSON.parse(next || "{}") as any;
              const widgets = Array.isArray(root.widgets) ? root.widgets : [];
              const ds = args.data || {};
              const norm = normalizeSchemaTable(ds.schema, ds.table);
              const measure = ds.measure || buildMeasureExpr(ds.measure, ds.agg) || undefined;
              widgets.push({
                id: args.id,
                type: "kpi",
                title: args.title,
                heightPx: args.height ?? 150,
                ...(args.row ? { row: args.row } : {}),
                ...(args.spanD ? { span: { desktop: args.spanD } } : {}),
                dataSource: {
                  schema: norm.schema,
                  table: norm.table,
                  measure,
                },
                kpiConfig: args.unit ? { unit: args.unit } : undefined,
              });
              root.widgets = widgets;
              next = JSON.stringify(root, null, 2);
              diags.push({ ok: true, message: `KPI '${args.id}' adicionado (JSON).`, line: cmd.line });
            } catch (e) {
              diags.push({ ok: false, message: `Falha ao mutar JSON: ${(e as Error).message}`, line: cmd.line });
            }
          }
          break;
        }
        case "addChart": {
          const args = cmd.args as AddChartArgs;
          if (dsl) {
            const groupId = args.group || "charts";
            next = ensureGroupExists(next, { id: groupId, title: groupId }).code;
            next = insertChartInGroup(next, groupId, {
              id: args.id,
              title: args.title,
              type: args.type || "bar",
              height: args.height ?? 360,
              widthFr: args.widthFr || "1fr",
              data: { schema: args.data?.schema, table: args.data?.table, dimension: args.data?.dimension, measure: args.data?.measure, agg: args.data?.agg },
              style: args.style,
            });
            diags.push({ ok: true, message: `Chart '${args.id}' adicionado ao grupo '${groupId}'.`, line: cmd.line });
          } else {
            // JSON path
            try {
              const root = JSON.parse(next || "{}") as any;
              const widgets = Array.isArray(root.widgets) ? root.widgets : [];
              const ds = args.data || {};
              const norm = normalizeSchemaTable(ds.schema, ds.table);
              const measure = ds.measure || buildMeasureExpr(ds.measure, ds.agg) || undefined;
              widgets.push({
                id: args.id,
                type: args.type || "bar",
                title: args.title,
                heightPx: args.height ?? 360,
                ...(args.row ? { row: args.row } : {}),
                ...(args.spanD ? { span: { desktop: args.spanD } } : {}),
                dataSource: {
                  schema: norm.schema,
                  table: norm.table,
                  dimension: args.data?.dimension,
                  measure,
                  aggregation: ds.agg,
                },
              });
              root.widgets = widgets;
              next = JSON.stringify(root, null, 2);
              diags.push({ ok: true, message: `Chart '${args.id}' adicionado (JSON).`, line: cmd.line });
            } catch (e) {
              diags.push({ ok: false, message: `Falha ao mutar JSON: ${(e as Error).message}`, line: cmd.line });
            }
          }
          break;
        }
        case "setDashboard": {
          const args = cmd.args as SetDashboardArgs;
          if (dsl) {
            next = setDashboardAttrs(next, args);
            diags.push({ ok: true, message: `Atributos do dashboard atualizados.`, line: cmd.line });
          } else {
            try {
              const root = JSON.parse(next || "{}") as any;
              if (args.title !== undefined) root.dashboardTitle = args.title;
              if (args.subtitle !== undefined) root.dashboardSubtitle = args.subtitle;
              if (args.theme !== undefined) root.theme = args.theme;
              // dateRange in JSON not standardized; skip
              next = JSON.stringify(root, null, 2);
              diags.push({ ok: true, message: `Dashboard atualizado (JSON).`, line: cmd.line });
            } catch (e) {
              diags.push({ ok: false, message: `Falha ao mutar JSON: ${(e as Error).message}`, line: cmd.line });
            }
          }
          break;
        }
        // No default: the switch is exhaustive over Command['kind'].
        }
    } catch (e) {
      diags.push({ ok: false, message: `Erro ao executar: ${(e as Error).message}`, line: cmd.line });
    }
  }

  return { nextCode: next, diagnostics: diags };
}
