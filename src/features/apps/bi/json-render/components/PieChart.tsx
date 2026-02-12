"use client";

import React from "react";
import { useData } from "@/features/apps/bi/json-render/context";
import { ResponsivePie } from "@nivo/pie";
import { normalizeTitleStyle, normalizeContainerStyle, buildNivoTheme, applyBorderFromCssVars, ensureSurfaceBackground, applyH1FromCssVars } from "@/features/apps/bi/json-render/helpers";
import { useThemeOverrides } from "@/features/apps/bi/json-render/theme/ThemeContext";
import FrameSurface from "@/features/apps/bi/json-render/components/FrameSurface";

type AnyRecord = Record<string, any>;

function formatValue(val: any, fmt: "currency" | "percent" | "number"): string {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return String(val ?? "");
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
    case "percent":
      return `${(n * 100).toFixed(2)}%`;
    default:
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n);
  }
}

function setByPath(prev: AnyRecord, path: string, value: any): AnyRecord {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return prev || {};
  const root: AnyRecord = Array.isArray(prev) ? [...prev] as any : { ...(prev || {}) };
  let curr: AnyRecord = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      curr[key] = value;
    } else {
      const next = curr[key];
      curr[key] = (next && typeof next === "object") ? { ...next } : {};
      curr = curr[key] as AnyRecord;
    }
  }
  return root;
}

function getByPath(data: AnyRecord, path: string): any {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  let curr: any = data;
  for (const key of parts) {
    if (curr == null) return undefined;
    curr = curr[key];
  }
  return curr;
}

function inferFilterField(dimension?: string): string {
  const d = (dimension || '').trim().toLowerCase();
  if (!d) return '';
  const map: Record<string, string> = {
    cliente: 'cliente_id',
    fornecedor: 'fornecedor_id',
    vendedor: 'vendedor_id',
    filial: 'filial_id',
    unidade_negocio: 'unidade_negocio_id',
    canal_venda: 'canal_venda_id',
    categoria_receita: 'categoria_receita_id',
    categoria_despesa: 'categoria_despesa_id',
    centro_lucro: 'centro_lucro_id',
    centro_custo: 'centro_custo_id',
    departamento: 'departamento_id',
    projeto: 'projeto_id',
    territorio: 'territorio_id',
    status: 'status',
  };
  return map[d] || '';
}

export default function JsonRenderPieChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const interaction = (element?.props?.interaction as AnyRecord | undefined) || {};
  const clickAsFilter = Boolean(interaction?.clickAsFilter ?? true);
  const clearOnSecondClick = Boolean(interaction?.clearOnSecondClick ?? true);
  const filterFieldFromConfig = typeof interaction?.filterField === "string" ? interaction.filterField.trim() : "";
  const filterStorePathFromConfig = typeof interaction?.storePath === "string" ? interaction.storePath.trim() : "";
  const resolvedFilterField = filterFieldFromConfig || inferFilterField(dq?.dimension);
  const resolvedFilterStorePath = filterStorePathFromConfig || (resolvedFilterField ? `filters.${resolvedFilterField}` : "");
  const shouldClickFilter = clickAsFilter && Boolean(resolvedFilterStorePath);
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!dq || !dq.model || !dq.dimension || !dq.measure) { setServerRows(null); return; }
      try {
        const mod = String(dq.model).split('.')[0];
        const url = `/api/modulos/${mod}/query`;
        const filters = { ...(dq.filters || {}) } as AnyRecord;
        const dr = (data as any)?.filters?.dateRange;
        if (dr && !filters.de && !filters.ate) { if (dr.from) filters.de = dr.from; if (dr.to) filters.ate = dr.to; }
        const globalFilters = (data as any)?.filters;
        if (globalFilters && typeof globalFilters === 'object') {
          for (const [k, v] of Object.entries(globalFilters)) {
            if (k === 'dateRange') continue;
            if (filters[k as any] === undefined) (filters as any)[k] = v as any;
          }
        }
        const body = { dataQuery: { model: dq.model, dimension: dq.dimension, dimensionExpr: dq.dimensionExpr, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const j = await res.json();
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) setServerRows(rows as any);
      } catch (e) { if (!cancelled) setServerRows([]); }
    }
    run();
    return () => { cancelled = true };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters)]);
  const title = element?.props?.title as string | undefined;
  const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
  const height = (element?.props?.height as number | undefined) ?? 220;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const nivo = (element?.props?.nivo as AnyRecord | undefined) || {};
  const titleStyle = applyH1FromCssVars(normalizeTitleStyle((element?.props as AnyRecord)?.titleStyle), theme.cssVars);
  const borderless = Boolean((element?.props as AnyRecord)?.borderless);
  const frame = (element?.props as AnyRecord)?.containerStyle?.frame as AnyRecord | undefined;
  const containerStyle = ensureSurfaceBackground(applyBorderFromCssVars(normalizeContainerStyle((element?.props as AnyRecord)?.containerStyle, borderless), theme.cssVars), theme.cssVars);
  if (containerStyle) (containerStyle as AnyRecord).boxShadow = undefined;

  const pieData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((r) => ({
      id: String((r as AnyRecord).label ?? ''),
      label: String((r as AnyRecord).label ?? ''),
      value: Number((r as AnyRecord).value ?? 0),
      filterKey: (r as AnyRecord).key ?? String((r as AnyRecord).label ?? ''),
    }));
  }, [serverRows]);
  const handleGlobalFilterClick = React.useCallback((datum: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = datum?.data?.filterKey ?? datum?.filterKey ?? datum?.id ?? datum?.label;
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const nextValue = (typeof rawValue === "number" || typeof rawValue === "string") ? rawValue : String(rawValue);
    setData((prev) => {
      const current = getByPath((prev || {}) as AnyRecord, resolvedFilterStorePath);
      const shouldClear = clearOnSecondClick && String(current ?? "") === String(nextValue);
      return setByPath((prev || {}) as AnyRecord, resolvedFilterStorePath, shouldClear ? undefined : nextValue);
    });
  }, [shouldClickFilter, resolvedFilterStorePath, setData, clearOnSecondClick]);

  let managedScheme: string[] | undefined = undefined;
  const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
  if (rawVar) {
    try { managedScheme = JSON.parse(rawVar); }
    catch { managedScheme = rawVar.split(',').map(s => s.trim()).filter(Boolean); }
  }
  const colors = (managedScheme && managedScheme.length)
    ? managedScheme
    : (Array.isArray(colorScheme) ? colorScheme : (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']));

  const margin = {
    top: Number(nivo?.margin?.top ?? 10),
    right: Number(nivo?.margin?.right ?? 10),
    bottom: Number(nivo?.margin?.bottom ?? 10),
    left: Number(nivo?.margin?.left ?? 10),
  };

  const innerRadius = typeof nivo?.innerRadius === 'number' ? nivo.innerRadius : 0;
  const padAngle = typeof nivo?.padAngle === 'number' ? nivo.padAngle : 0.7;
  const cornerRadius = typeof nivo?.cornerRadius === 'number' ? nivo.cornerRadius : 3;
  const activeInnerRadiusOffset = typeof nivo?.activeInnerRadiusOffset === 'number' ? nivo.activeInnerRadiusOffset : 0;
  const activeOuterRadiusOffset = typeof nivo?.activeOuterRadiusOffset === 'number' ? nivo.activeOuterRadiusOffset : 8;
  const enableArcLabels = Boolean(nivo?.enableArcLabels ?? true);
  const arcLabelsSkipAngle = typeof nivo?.arcLabelsSkipAngle === 'number' ? nivo.arcLabelsSkipAngle : 10;
  const arcLabelsTextColor = typeof nivo?.arcLabelsTextColor === 'string' ? nivo.arcLabelsTextColor : '#333333';
  const animate = Boolean(nivo?.animate ?? true);
  const motionConfig = (typeof nivo?.motionConfig === 'string' ? nivo.motionConfig : 'gentle') as any;

  let nivoTheme = buildNivoTheme(nivo?.theme);
  const managerFont = (theme.cssVars || {} as any).fontFamily as string | undefined;
  const fg = (theme.cssVars || {} as any).fg as string | undefined;
  if (managerFont || fg) {
    const t: any = { ...(nivoTheme || {}) };
    if (managerFont) t.fontFamily = managerFont;
    if (!t.textColor && fg) t.textColor = fg;
    t.labels = t.labels || {};
    t.labels.text = { ...(t.labels.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.axis = t.axis || {};
    t.axis.ticks = t.axis.ticks || {};
    t.axis.ticks.text = { ...(t.axis.ticks.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.axis.legend = t.axis.legend || {};
    t.axis.legend.text = { ...(t.axis.legend.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    nivoTheme = t;
  }
  return (
    <FrameSurface style={containerStyle} frame={frame} cssVars={theme.cssVars}>
      {title && <div className="mb-0" style={titleStyle}>{title}</div>}
      <div style={{ height }}>
        <ResponsivePie
          data={pieData}
          margin={margin}
          innerRadius={innerRadius}
          padAngle={padAngle}
          cornerRadius={cornerRadius}
          activeInnerRadiusOffset={activeInnerRadiusOffset}
          activeOuterRadiusOffset={activeOuterRadiusOffset}
          colors={colors as any}
          enableArcLabels={enableArcLabels}
          arcLabelsSkipAngle={arcLabelsSkipAngle}
          arcLabelsTextColor={arcLabelsTextColor}
          tooltip={({ datum }) => (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200">
              <div className="font-medium">{datum.label}</div>
              <div>{formatValue(datum.value, fmt)}</div>
            </div>
          )}
          onClick={shouldClickFilter ? handleGlobalFilterClick : undefined}
          animate={animate}
          motionConfig={motionConfig}
          theme={nivoTheme as any}
        />
      </div>
    </FrameSurface>
  );
}
