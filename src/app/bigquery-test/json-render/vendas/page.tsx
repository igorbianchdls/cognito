"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Renderer } from "@/components/json-render/renderer";
import { registry } from "@/components/json-render/registry";
import { DataProvider, useData } from "@/components/json-render/context";

const SALES_TEMPLATE_TEXT = JSON.stringify([
  {
    type: "Theme",
    props: { name: "light" },
    children: [
      { type: "Header", props: { title: "Dashboard de Vendas", subtitle: "Principais indicadores e cortes", align: "center", controlsPosition: "right", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "KPI", props: { title: "Vendas", format: "currency", dataQuery: { model: "vendas.pedidos", measure: "SUM(p.valor_total)", filters: { tenant_id: 1 } }, containerStyle: { borderWidth: 2, borderColor: "#0ea5e9", borderRadius: 12 }, titleStyle: { fontWeight: 600, fontSize: 12, color: "#64748b" }, valueStyle: { fontWeight: 700, fontSize: 24, color: "#0f172a" } } },
        { type: "KPI", props: { title: "Pedidos", format: "number", dataQuery: { model: "vendas.pedidos", measure: "COUNT()", filters: { tenant_id: 1 } }, containerStyle: { borderWidth: 2, borderColor: "#22c55e", borderStyle: "dashed", borderRadius: 10 } } },
        { type: "KPI", props: { title: "Ticket Médio", format: "currency", dataQuery: { model: "vendas.pedidos", measure: "AVG(p.valor_total)", filters: { tenant_id: 1 } }, titleStyle: { fontWeight: 600 }, valueStyle: { fontSize: 22 }, containerStyle: { borderWidth: 2, borderColor: "#f59e0b", borderStyle: "dotted", borderRadius: 8 } } },
        { type: "Kpi", props: { label: "Margem Bruta", valuePath: "vendas.kpis.margemBruta", format: "currency", borderless: true } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "PieChart", props: { fr: 1, title: "Canais", titleStyle: { fontFamily: "Barlow", fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: "0.02em", textTransform: "uppercase", padding: 8, textAlign: "left" }, containerStyle: { borderWidth: 2, borderColor: "#0ea5e9", borderRadius: 12 }, dataQuery: { model: "vendas.pedidos", dimension: "canal_venda", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 240, nivo: { innerRadius: 0.35, theme: { labels: { text: { fontFamily: "Avenir", fontSize: 12, fill: "#0f172a" } } } } } },
        { type: "BarChart", props: { fr: 2, title: "Categorias", titleStyle: { fontFamily: "Barlow", fontWeight: 600, fontSize: 14, color: "#334155", padding: 6 }, containerStyle: { borderWidth: 2, borderColor: "#10b981", borderStyle: "dashed", borderRadius: 10 }, dataQuery: { model: "vendas.pedidos", dimension: "categoria_receita", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 240, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "Geist", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "Geist", fontSize: 12, fill: "#0f172a" } } } } } } },
        { type: "SlicerCard", props: { fr: 1, title: "Filtro de Canais", fields: [
          { label: "Canal", type: "list", storePath: "filters.canal_venda_id", source: { type: "api", url: "/api/modulos/vendas/options?field=canal_venda_id&limit=50" }, selectAll: true, search: true, clearable: true }
        ], containerStyle: { borderWidth: 2, borderColor: "#e5e7eb", borderRadius: 12 } } },
        { type: "BarChart", props: { fr: 2, title: "Clientes", containerStyle: { borderWidth: 3, borderColor: "#f59e0b", borderStyle: "solid", borderRadius: 6, boxShadow: "none" }, dataQuery: { model: "vendas.pedidos", dimension: "cliente", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 5 }, format: "currency", height: 240, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "Inter", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "Inter", fontSize: 12, fill: "#0f172a" } } } } } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Vendedores", containerStyle: { borderWidth: 2, borderColor: "#8b5cf6", borderRadius: 10 }, dataQuery: { model: "vendas.pedidos", dimension: "vendedor", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#475569" } }, legend: { text: { fontFamily: "IBM Plex Mono", fontSize: 12, fill: "#0f172a" } } } } } } },
        { type: "BarChart", props: { fr: 1, title: "Filiais", containerStyle: { borderWidth: 2, borderColor: "#ef4444", borderStyle: "dotted", borderRadius: 12 }, dataQuery: { model: "vendas.pedidos", dimension: "filial", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "Libre Baskerville", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "Libre Baskerville", fontSize: 12, fill: "#0f172a" } } } } } } },
        { type: "BarChart", props: { fr: 1, title: "Unidades de Negócio", containerStyle: { borderWidth: 1, borderColor: "#334155", borderStyle: "solid", borderRadius: 8 }, dataQuery: { model: "vendas.pedidos", dimension: "unidade_negocio", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "Space Mono", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "Space Mono", fontSize: 12, fill: "#0f172a" } } } } } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "LineChart", props: { fr: 3, title: "Faturamento por Mês", dataQuery: { model: "vendas.pedidos", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 240, nivo: { curve: 'monotoneX', area: true } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Pedidos por Mês", dataQuery: { model: "vendas.pedidos", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "number", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Ticket Médio por Mês", dataQuery: { model: "vendas.pedidos", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')", measure: "AVG(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 220, nivo: { layout: 'vertical' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Territórios", containerStyle: { borderless: false, borderWidth: 2, borderColor: "#0ea5e9" }, dataQuery: { model: "vendas.pedidos", dimension: "territorio", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "Geist Mono", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "Geist Mono", fontSize: 12, fill: "#0f172a" } } } } } } },
        { type: "BarChart", props: { fr: 1, title: "Serviços/Categorias", containerStyle: { borderWidth: 2, borderColor: "#22c55e" }, dataQuery: { model: "vendas.pedidos", dimension: "categoria_receita", measure: "SUM(itens.subtotal)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "currency", height: 220, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "EB Garamond", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "EB Garamond", fontSize: 12, fill: "#0f172a" } } } } } } },
        { type: "BarChart", props: { fr: 1, title: "Pedidos", borderless: true, dataQuery: { model: "vendas.pedidos", dimension: "canal_venda", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "number", height: 220, nivo: { layout: 'horizontal', theme: { axis: { ticks: { text: { fontFamily: "Avenir", fontSize: 12, fill: "#334155" } }, legend: { text: { fontFamily: "Avenir", fontSize: 12, fill: "#0f172a" } } } } } } }
      ]}
    ]
  }
], null, 2);

function SalesPlayground() {
  const { data, setData, getValueByPath } = useData();
  const [jsonText, setJsonText] = useState<string>(SALES_TEMPLATE_TEXT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tree, setTree] = useState<any | any[] | null>(() => {
    try { return JSON.parse(SALES_TEMPLATE_TEXT); } catch { return null; }
  });

  // Fetch vendas (dados reais): lista + dashboard (kpis)
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const toISO = (d: Date) => d.toISOString().slice(0, 10);
        const de = toISO(firstDay);
        const ate = toISO(lastDay);
        const [listRes, dashRes] = await Promise.allSettled([
          fetch(`/api/modulos/vendas?view=pedidos&page=1&pageSize=1000`, { cache: 'no-store' }),
          fetch(`/api/modulos/vendas/dashboard?de=${de}&ate=${ate}&limit=8`, { cache: 'no-store' }),
        ]);
        if (listRes.status === 'fulfilled' && listRes.value.ok) {
          const j = await listRes.value.json();
          const rows = Array.isArray(j?.rows) ? j.rows : [];
          setData((prev: any) => ({ ...(prev || {}), vendas: { ...(prev?.vendas || {}), pedidos: rows } }));
        }
        if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
          const j = await dashRes.value.json();
          setData((prev: any) => ({ ...(prev || {}), vendas: { ...(prev?.vendas || {}), kpis: j?.kpis || {} } }));
        }
      } catch {}
    }
    load();
    return () => { cancelled = true };
  }, []);

  const handleAction = useCallback((action: any) => {
    if (action?.type === 'refresh_data') {
      (async () => {
        try {
          const dr = getValueByPath('filters.dateRange', undefined) as { from?: string; to?: string } | undefined;
          const de = dr?.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
          const ate = dr?.to || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0,10);
          const [listRes, dashRes] = await Promise.allSettled([
            fetch(`/api/modulos/vendas?view=pedidos&page=1&pageSize=1000`, { cache: 'no-store' }),
            fetch(`/api/modulos/vendas/dashboard?de=${de}&ate=${ate}&limit=8`, { cache: 'no-store' }),
          ]);
          if (listRes.status === 'fulfilled' && listRes.value.ok) {
            const j = await listRes.value.json();
            const rows = Array.isArray(j?.rows) ? j.rows : [];
            setData((prev: any) => ({ ...(prev || {}), vendas: { ...(prev?.vendas || {}), pedidos: rows } }));
          }
          if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
            const j = await dashRes.value.json();
            setData((prev: any) => ({ ...(prev || {}), vendas: { ...(prev?.vendas || {}), kpis: j?.kpis || {} } }));
          }
        } catch {}
      })();
      return;
    }
  }, [getValueByPath, setData]);

  const onChangeText = useCallback((s: string) => {
    setJsonText(s);
    try { setTree(JSON.parse(s)); setParseError(null) } catch (e: any) { setParseError(e?.message ? String(e.message) : 'Invalid JSON') }
  }, []);

  const onFormat = useCallback(() => {
    try { const t = JSON.parse(jsonText); setJsonText(JSON.stringify(t, null, 2)); setParseError(null) } catch (e: any) { setParseError(e?.message ? String(e.message) : 'Invalid JSON') }
  }, [jsonText]);

  const onReset = useCallback(() => {
    setJsonText(SALES_TEMPLATE_TEXT);
    try { setTree(JSON.parse(SALES_TEMPLATE_TEXT)); setParseError(null) } catch {}
  }, []);

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
        <div className="mt-4 rounded-md bg-white p-3 border border-gray-200">
          <h3 className="text-xs font-medium text-gray-900 mb-1">Dados atuais</h3>
          <pre className="text-[11px] text-gray-700 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Preview</h2>
          <div className="text-xs text-gray-500">Ações: Atualizar</div>
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

export default function JsonRenderVendasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render — Vendas</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Vendas com dados reais.</p>

        <DataProvider initialData={{ vendas: { dashboard: {}, kpis: {} } }}>
          <SalesPlayground />
        </DataProvider>
      </div>
    </div>
  );
}
