"use client";

import React, { useCallback, useState } from "react";
import { Renderer } from "@/components/json-render/renderer";
import { registry } from "@/components/json-render/registry";
import { DataProvider, useData } from "@/components/json-render/context";

const COMPRAS_TEMPLATE_TEXT = JSON.stringify([
  {
    type: "Theme",
    props: { name: "light" },
    children: [
      { type: "Header", props: { title: "Dashboard de Compras", subtitle: "Principais indicadores e cortes", align: "center", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "Kpi", props: { label: "Gasto", format: "currency", dataQuery: { model: "compras.compras", measure: "SUM(valor_total)", filters: { tenant_id: 1 } }, valueKey: "gasto_total", labelStyle: { fontWeight: 600, fontSize: 12, color: "#64748b" }, valueStyle: { fontWeight: 700, fontSize: 24, color: "#0f172a" } } },
        { type: "Kpi", props: { label: "Fornecedores", format: "number", dataQuery: { model: "compras.compras", measure: "COUNT_DISTINCT(fornecedor_id)", filters: { tenant_id: 1 } }, valueKey: "count" } },
        { type: "Kpi", props: { label: "Pedidos", format: "number", dataQuery: { model: "compras.compras", measure: "COUNT_DISTINCT(id)", filters: { tenant_id: 1 } }, valueKey: "count", valueStyle: { fontSize: 22 } } },
        { type: "Kpi", props: { label: "Transações", format: "number", dataQuery: { model: "compras.recebimentos", measure: "COUNT()", filters: { tenant_id: 1 } }, valueKey: "count" } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Fornecedores", dataQuery: { model: "compras.compras", dimension: "fornecedor", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "fornecedor", yKey: "gasto_total", format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Centros de Custo", dataQuery: { model: "compras.compras", dimension: "centro_custo", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "centro_custo", yKey: "gasto_total", format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Filiais", dataQuery: { model: "compras.compras", dimension: "filial", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "filial", yKey: "gasto_total", format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Categorias", dataQuery: { model: "compras.compras", dimension: "categoria_despesa", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "categoria_despesa", yKey: "gasto_total", format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Projetos", dataQuery: { model: "compras.compras", dimension: "projeto", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "projeto", yKey: "gasto_total", format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Status (Qtd)", dataQuery: { model: "compras.compras", dimension: "status", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "status", yKey: "count", format: "number", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "PieChart", props: { fr: 1, title: "Status (Pizza)", dataQuery: { model: "compras.compras", dimension: "status", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, xKey: "status", yKey: "count", format: "number", height: 260, nivo: { innerRadius: 0.35 } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Gasto por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, xKey: "mes", yKey: "gasto_total", format: "currency", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Pedidos por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, xKey: "mes", yKey: "count", format: "number", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Ticket Médio por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')", measure: "AVG(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, xKey: "mes", yKey: "ticket_medio", format: "currency", height: 220, nivo: { layout: 'vertical' } } }
      ]}
    ]
  }
], null, 2);

function ComprasPlayground() {
  const { setData, getValueByPath } = useData();
  const [jsonText, setJsonText] = useState<string>(COMPRAS_TEMPLATE_TEXT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tree, setTree] = useState<any | any[] | null>(() => {
    try { return JSON.parse(COMPRAS_TEMPLATE_TEXT); } catch { return null; }
  });

  // Fetch compras (dados reais): lista + dashboard (kpis)
  React.useEffect(() => {
    let cancelled = false;
    async function fetchOnce(de?: string, ate?: string) {
      const qsDash = new URLSearchParams();
      if (de) qsDash.set('de', de);
      if (ate) qsDash.set('ate', ate);
      qsDash.set('limit', '8');
      const [listRes, dashRes] = await Promise.allSettled([
        fetch(`/api/modulos/compras?view=compras&page=1&pageSize=1000`, { cache: 'no-store' }),
        fetch(`/api/modulos/compras/dashboard?${qsDash.toString()}`, { cache: 'no-store' })
      ]);
      let charts: any = undefined;
      if (listRes.status === 'fulfilled' && listRes.value.ok) {
        const j = await listRes.value.json();
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) setData((prev: any) => ({ ...(prev || {}), compras: { ...(prev?.compras || {}), compras: rows } }));
      }
      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        const j = await dashRes.value.json();
        charts = j?.charts;
        if (!cancelled) setData((prev: any) => ({ ...(prev || {}), compras: { ...(prev?.compras || {}), kpis: j?.kpis || {} } }));
      }
      return { charts } as any;
    }
    async function load() {
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const toISO = (d: Date) => d.toISOString().slice(0, 10);
        const de = toISO(firstDay);
        const ate = toISO(lastDay);
        const j = await fetchOnce(de, ate);
        const charts = j?.charts as Record<string, any[]> | undefined;
        const hasData = charts ? Object.values(charts).some(arr => Array.isArray(arr) && arr.length > 0) : false;
        if (!hasData) {
          // fallback: busca ampla sem período
          await fetchOnce(undefined, undefined);
        }
      } catch {}
    }
    load();
    return () => { cancelled = true };
  }, [setData]);

  const onChangeText = useCallback((s: string) => {
    setJsonText(s);
    try { setTree(JSON.parse(s)); setParseError(null) } catch (e: any) { setParseError(e?.message ? String(e.message) : 'Invalid JSON') }
  }, []);

  const onFormat = useCallback(() => {
    try { const t = JSON.parse(jsonText); setJsonText(JSON.stringify(t, null, 2)); setParseError(null) } catch (e: any) { setParseError(e?.message ? String(e.message) : 'Invalid JSON') }
  }, [jsonText]);

  const onReset = useCallback(() => {
    setJsonText(COMPRAS_TEMPLATE_TEXT);
    try { setTree(JSON.parse(COMPRAS_TEMPLATE_TEXT)); setParseError(null) } catch {}
  }, []);

  const handleAction = useCallback((action: any) => {
    if (action?.type === 'refresh_data') {
      (async () => {
        try {
          const dr = getValueByPath('filters.dateRange', undefined) as { from?: string; to?: string } | undefined;
          const de = dr?.from;
          const ate = dr?.to;
          // Reusar fetchOnce
          const qsDash = new URLSearchParams();
          if (de) qsDash.set('de', de);
          if (ate) qsDash.set('ate', ate);
          qsDash.set('limit', '8');
          const [listRes, dashRes] = await Promise.allSettled([
            fetch(`/api/modulos/compras?view=compras&page=1&pageSize=1000`, { cache: 'no-store' }),
            fetch(`/api/modulos/compras/dashboard?${qsDash.toString()}`, { cache: 'no-store' })
          ]);
          if (listRes.status === 'fulfilled' && listRes.value.ok) {
            const j = await listRes.value.json();
            const rows = Array.isArray(j?.rows) ? j.rows : [];
            setData((prev: any) => ({ ...(prev || {}), compras: { ...(prev?.compras || {}), compras: rows } }));
          }
          if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
            const j = await dashRes.value.json();
            setData((prev: any) => ({ ...(prev || {}), compras: { ...(prev?.compras || {}), kpis: j?.kpis || {}, dashboard: j?.charts || {} } }));
          }
        } catch {}
      })();
      return;
    }
  }, [getValueByPath, setData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
      <div className="md:col-span-1">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">JSON</h2>
          <div className="flex items-center gap-2">
            <button onClick={onReset} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">Reset</button>
            <button onClick={onFormat} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">Formatar</button>
          </div>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => onChangeText(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[420px] rounded-md border border-gray-300 bg-white p-0 font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {parseError && (
          <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">{parseError}</div>
        )}
      </div>

      <div className="md:col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Preview</h2>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-0 min-h-[420px]">
          {tree ? (
            <Renderer tree={tree} registry={registry} onAction={handleAction} />
          ) : (
            <div className="text-sm text-gray-500">JSON inválido</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JsonRenderComprasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render — Compras</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Compras com dados reais.</p>

        <DataProvider initialData={{ compras: { dashboard: {}, kpis: {} } }}>
          <ComprasPlayground />
        </DataProvider>
      </div>
    </div>
  );
}
