"use client";

import type {
  Command,
  AddGroupArgs,
  AddKPIArgs,
  AddChartArgs,
  SetDashboardArgs,
  UpdateWidgetArgs,
  UpdateGroupArgs,
} from "./CommandParser";
import {
  ensureGroupExists,
  insertKpiInGroup,
  insertChartInGroup,
  setDashboardAttrs,
  buildMeasureExpr,
  normalizeSchemaTable,
  removeWidgetByIdDSL,
  removeGroupByIdDSL,
  setOrInsertStylingTw,
  setGroupStyleJson,
  setAttrOnNode,
  setAttrOnDatasource,
  setConfigOnNode,
  getWidgetTagKind,
  dedupeWidgetByIdDSL,
  updateWidgetStylingTwAndKpiBg,
} from "./HelperEditorToLiquid";

export type RunDiagnostics = Array<{ ok: boolean; message: string; line?: number }>;

export function isDsl(code: string): boolean {
  return String(code || "").trim().startsWith("<");
}

export function runCommands(code: string, commands: Command[]): { nextCode: string; diagnostics: RunDiagnostics } {
  let next = String(code || "");
  const diags: RunDiagnostics = [];
  const dsl = isDsl(next);
  // Track last declared group id to provide a sensible default target
  let currentGroupId: string | undefined;

  for (const cmd of commands) {
    try {
      switch (cmd.kind) {
        case "addWidget": {
          const args = cmd.args as any;
          const rawType = String(args.type || '').toLowerCase();
          const finalType = rawType === 'chart' ? String(args.chartType || '').toLowerCase() : rawType;
          if (finalType === 'kpi') {
            // Reuse addKPI logic
            if (dsl) {
              const groupId = args.group || currentGroupId || "kpis";
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
              try {
                const root = JSON.parse(next || "{}") as any;
                const widgets = Array.isArray(root.widgets) ? root.widgets : [];
                const ds = args.data || {};
                const norm = normalizeSchemaTable(ds.schema, ds.table);
                const measure = ds.measure || buildMeasureExpr(ds.measure, ds.agg) || undefined;
                widgets.push({
                  id: args.id,
                  type: 'kpi',
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
          } else {
            // Treat as chart
            const chartType = finalType || 'bar';
            if (dsl) {
              const groupId = args.group || currentGroupId || "charts";
              next = ensureGroupExists(next, { id: groupId, title: groupId }).code;
              next = insertChartInGroup(next, groupId, {
                id: args.id,
                title: args.title,
                type: chartType,
                height: args.height ?? 360,
                widthFr: args.widthFr || "1fr",
                data: { schema: args.data?.schema, table: args.data?.table, dimension: args.data?.dimension, measure: args.data?.measure, agg: args.data?.agg },
                style: args.style,
              });
              diags.push({ ok: true, message: `Chart '${args.id}' adicionado ao grupo '${groupId}'.`, line: cmd.line });
            } else {
              try {
                const root = JSON.parse(next || "{}") as any;
                const widgets = Array.isArray(root.widgets) ? root.widgets : [];
                const ds = args.data || {};
                const norm = normalizeSchemaTable(ds.schema, ds.table);
                const measure = ds.measure || buildMeasureExpr(ds.measure, ds.agg) || undefined;
                widgets.push({
                  id: args.id,
                  type: chartType,
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
          }
          break;
        }
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
            currentGroupId = args.id;
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
            const groupId = args.group || currentGroupId || "kpis";
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
            const groupId = args.group || currentGroupId || "charts";
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
        case "deleteWidget": {
          const id = (cmd.args as { id: string }).id;
          if (dsl) {
            const { code: updated, removed } = removeWidgetByIdDSL(next, id);
            next = updated;
            if (removed > 0) diags.push({ ok: true, message: `Widget '${id}' removido (${removed}).`, line: cmd.line });
            else diags.push({ ok: false, message: `Widget '${id}' não encontrado.`, line: cmd.line });
          } else {
            try {
              const root = JSON.parse(next || "{}") as any;
              const before = Array.isArray(root.widgets) ? root.widgets.length : 0;
              if (Array.isArray(root.widgets)) {
                root.widgets = root.widgets.filter((w: any) => w && w.id !== id);
              }
              // Remove from layout groups if present (top-level or inside config)
              const cleanGroups = (container: any) => {
                if (!container || !container.layout || !Array.isArray(container.layout.groups)) return;
                container.layout.groups = container.layout.groups.map((g: any) => {
                  if (Array.isArray(g.children)) g.children = g.children.filter((x: any) => x !== id);
                  return g;
                });
              };
              cleanGroups(root);
              if (root.config && typeof root.config === 'object') cleanGroups(root.config);
              const after = Array.isArray(root.widgets) ? root.widgets.length : 0;
              next = JSON.stringify(root, null, 2);
              if (after < before) diags.push({ ok: true, message: `Widget '${id}' removido (JSON).`, line: cmd.line });
              else diags.push({ ok: false, message: `Widget '${id}' não encontrado (JSON).`, line: cmd.line });
            } catch (e) {
              diags.push({ ok: false, message: `Falha ao mutar JSON: ${(e as Error).message}`, line: cmd.line });
            }
          }
          break;
        }
        case "deleteGroupt": {
          const id = (cmd.args as { id: string }).id;
          if (dsl) {
            const { code: updated, removed } = removeGroupByIdDSL(next, id);
            next = updated;
            if (removed > 0) diags.push({ ok: true, message: `Grupo '${id}' removido (${removed}).`, line: cmd.line });
            else diags.push({ ok: false, message: `Grupo '${id}' não encontrado.`, line: cmd.line });
          } else {
            try {
              const root = JSON.parse(next || "{}") as any;
              const collectChildrenAndRemove = (container: any): string[] => {
                const removedChildren: string[] = [];
                if (!container || !container.layout || !Array.isArray(container.layout.groups)) return removedChildren;
                const groups = container.layout.groups as any[];
                const keep: any[] = [];
                for (const g of groups) {
                  if (g && g.id === id) {
                    if (Array.isArray(g.children)) removedChildren.push(...g.children);
                    // skip (delete)
                  } else keep.push(g);
                }
                container.layout.groups = keep;
                return removedChildren;
              };
              const children: string[] = [];
              children.push(...collectChildrenAndRemove(root));
              if (root.config && typeof root.config === 'object') children.push(...collectChildrenAndRemove(root.config));
              if (Array.isArray(root.widgets) && children.length > 0) {
                const removeSet = new Set(children);
                root.widgets = root.widgets.filter((w: any) => !removeSet.has(w?.id));
              }
              next = JSON.stringify(root, null, 2);
              if (children.length > 0) diags.push({ ok: true, message: `Grupo '${id}' removido com ${children.length} widgets.`, line: cmd.line });
              else diags.push({ ok: false, message: `Grupo '${id}' não encontrado (JSON).`, line: cmd.line });
            } catch (e) {
              diags.push({ ok: false, message: `Falha ao mutar JSON: ${(e as Error).message}`, line: cmd.line });
            }
          }
          break;
        }
        case "updateWidget": {
          const args = cmd.args as UpdateWidgetArgs;
          const id = args.id;
          if (dsl) {
            let updated = false;
            if (typeof args.title === 'string') { next = setAttrOnNode(next, id, 'title', args.title); updated = true; }
            if (typeof args.height === 'number') { next = setAttrOnNode(next, id, 'height', String(args.height)); updated = true; }
            if (typeof args.type === 'string') { next = setAttrOnNode(next, id, 'type', args.type); updated = true; }
            if (typeof args.widthFr === 'string') { next = setAttrOnNode(next, id, 'width', args.widthFr); updated = true; }
            if (args.data && typeof args.data === 'object') {
              const dsAttrs: Record<string, string|undefined> = {};
              if (args.data.schema) dsAttrs.schema = args.data.schema;
              if (args.data.table) dsAttrs.table = args.data.table;
              if (args.data.dimension) dsAttrs.dimension = args.data.dimension;
              if (args.data.measure || args.data.agg) dsAttrs.measure = args.data.measure || buildMeasureExpr(args.data.measure, args.data.agg);
              next = setAttrOnDatasource(next, id, dsAttrs);
              updated = true;
            }
            if (args.style?.tw) {
              next = updateWidgetStylingTwAndKpiBg(next, id, args.style.tw);
              updated = true;
            }
            // Safety: dedupe blocks with same id if any accidental duplication happens
            const ded = dedupeWidgetByIdDSL(next, id);
            if (ded.removed > 0) updated = true;
            next = ded.code;
            diags.push({ ok: updated, message: updated ? `Widget '${id}' atualizado.` : `Nenhuma alteração aplicada ao widget '${id}'.`, line: cmd.line });
          } else {
            try {
              const root = JSON.parse(next || '{}') as any;
              const arr: any[] = Array.isArray(root.widgets) ? root.widgets : [];
              const w = arr.find(w => w && w.id === id);
              if (!w) { diags.push({ ok: false, message: `Widget '${id}' não encontrado (JSON).`, line: cmd.line }); break; }
              let changed = false;
              if (typeof args.title === 'string') { w.title = args.title; changed = true; }
              if (typeof args.height === 'number') { w.heightPx = args.height; changed = true; }
              if (typeof args.widthFr === 'string') { w.widthFr = { ...(w.widthFr || {}), desktop: args.widthFr }; changed = true; }
              if (typeof args.type === 'string') { w.type = args.type; changed = true; }
              if (typeof args.row === 'string') { w.row = args.row; changed = true; }
              if (typeof args.spanD === 'number') { w.span = { ...(w.span || {}), desktop: args.spanD }; changed = true; }
              if (args.data && typeof args.data === 'object') {
                w.dataSource = { ...(w.dataSource || {}) };
                if (args.data.schema) w.dataSource.schema = args.data.schema;
                if (args.data.table) w.dataSource.table = args.data.table;
                if (args.data.dimension) w.dataSource.dimension = args.data.dimension;
                if (args.data.measure) w.dataSource.measure = args.data.measure;
                if (args.data.agg) w.dataSource.aggregation = args.data.agg;
                changed = true;
              }
              if (args.chartConfig && (w.type && typeof w.type === 'string')) {
                const t = String(args.type || w.type).toLowerCase();
                let key: string | undefined = undefined;
                if (['bar','line','pie','area'].includes(t)) key = t + 'Config';
                else if (t === 'groupedbar') key = 'groupedBarConfig';
                if (key) {
                  const prev = w[key] || {};
                  const nextCfg: any = { ...prev };
                  if (args.chartConfig.styling?.colors) {
                    nextCfg.styling = { ...(prev.styling || {}), colors: args.chartConfig.styling.colors };
                  }
                  if (args.chartConfig.margin) {
                    const p = prev.margin || {};
                    nextCfg.margin = { ...p, ...(typeof args.chartConfig.margin.left==='number'?{left:args.chartConfig.margin.left}:{}) , ...(typeof args.chartConfig.margin.top==='number'?{top:args.chartConfig.margin.top}:{}) , ...(typeof args.chartConfig.margin.bottom==='number'?{bottom:args.chartConfig.margin.bottom}:{}) };
                  }
                  if (args.chartConfig.layout) nextCfg.layout = args.chartConfig.layout;
                  w[key] = nextCfg;
                  changed = true;
                }
              }
              next = JSON.stringify(root, null, 2);
              diags.push({ ok: true, message: changed ? `Widget '${id}' atualizado (JSON).` : `Nenhuma alteração aplicada ao widget '${id}' (JSON).`, line: cmd.line });
            } catch (e) {
              diags.push({ ok: false, message: `Falha ao mutar JSON: ${(e as Error).message}`, line: cmd.line });
            }
          }
          break;
        }
        case "updateGroup": {
          const args = cmd.args as UpdateGroupArgs;
          const id = args.id;
          if (dsl) {
            let updated = false;
            if (typeof args.title === 'string') { next = setAttrOnNode(next, id, 'title', args.title); updated = true; }
            if (typeof args.orientation === 'string') { next = setAttrOnNode(next, id, 'orientation', args.orientation); updated = true; }
            if (typeof args.sizing === 'string') { next = setAttrOnNode(next, id, 'sizing', args.sizing); updated = true; }
            if (typeof args.colsD === 'number') { next = setAttrOnNode(next, id, 'cols-d', String(args.colsD)); updated = true; }
            if (typeof args.gapX === 'number') { next = setAttrOnNode(next, id, 'gap-x', String(args.gapX)); updated = true; }
            if (typeof args.gapY === 'number') { next = setAttrOnNode(next, id, 'gap-y', String(args.gapY)); updated = true; }
            if (args.style && typeof args.style === 'object') { next = setGroupStyleJson(next, id, args.style as Record<string, unknown>); updated = true; }
            diags.push({ ok: updated, message: updated ? `Grupo '${id}' atualizado.` : `Nenhuma alteração aplicada ao grupo '${id}'.`, line: cmd.line });
          } else {
            try {
              const root = JSON.parse(next || '{}') as any;
              const applyToContainer = (container: any): boolean => {
                if (!container || !container.layout || !Array.isArray(container.layout.groups)) return false;
                let applied = false;
                for (const g of container.layout.groups) {
                  if (g && g.id === id) {
                    if (typeof args.title === 'string') { g.title = args.title; applied = true; }
                    if (typeof args.orientation === 'string') { g.orientation = args.orientation; applied = true; }
                    // sizing in JSON is implicit via grid; ignore
                    g.grid = g.grid || {};
                    g.grid.desktop = g.grid.desktop || {};
                    if (typeof args.colsD === 'number') { g.grid.desktop.columns = args.colsD; applied = true; }
                    if (typeof args.gapX === 'number') { g.grid.desktop.gapX = args.gapX; applied = true; }
                    if (typeof args.gapY === 'number') { g.grid.desktop.gapY = args.gapY; applied = true; }
                    if (args.style && typeof args.style === 'object') { g.style = { ...(g.style || {}), ...(args.style as any) }; applied = true; }
                  }
                }
                return applied;
              };
              const a = applyToContainer(root);
              const b = root.config && typeof root.config === 'object' ? applyToContainer(root.config) : false;
              next = JSON.stringify(root, null, 2);
              diags.push({ ok: a || b, message: (a || b) ? `Grupo '${id}' atualizado (JSON).` : `Grupo '${id}' não encontrado (JSON).`, line: cmd.line });
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
