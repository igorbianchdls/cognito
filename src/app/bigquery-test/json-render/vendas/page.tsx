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
      { type: "Header", props: { title: "Dashboard de Vendas", subtitle: "Principais indicadores e cortes", align: "center" } },
      { type: "Card", props: { title: "KPIs de Vendas" }, children: [
        { type: "Div", props: { direction: "row", gap: 12, justify: "start", align: "start", childGrow: true }, children: [
          { type: "Kpi", props: { label: "Vendas", valuePath: "vendas.kpis.vendas", format: "currency" } },
          { type: "Kpi", props: { label: "Pedidos", valuePath: "vendas.kpis.pedidos", format: "number" } },
          { type: "Kpi", props: { label: "Ticket Médio", valuePath: "vendas.kpis.ticketMedio", format: "currency" } },
          { type: "Kpi", props: { label: "Margem Bruta", valuePath: "vendas.kpis.margemBruta", format: "currency" } }
        ]}
      ]},

      { type: "Div", props: { direction: "row", gap: 12, justify: "start", align: "start", childGrow: true }, children: [
        { type: "PieChart", props: { title: "Canais", dataPath: "vendas.pedidos", xKey: "canal_venda", yKey: "SUM(valor_total)", format: "currency", height: 240, nivo: { innerRadius: 0.35 } } },
        { type: "BarChart", props: { title: "Categorias", dataPath: "vendas.pedidos", xKey: "categoria_receita", yKey: "SUM(valor_total)", format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "Clientes", dataPath: "vendas.pedidos", xKey: "cliente", yKey: "SUM(valor_total)", format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { title: "Vendedores", dataPath: "vendas.pedidos", xKey: "vendedor", yKey: "SUM(valor_total)", format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "Filiais", dataPath: "vendas.pedidos", xKey: "filial", yKey: "SUM(valor_total)", format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "Unidades de Negócio", dataPath: "vendas.pedidos", xKey: "unidade_negocio", yKey: "SUM(valor_total)", format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { title: "Territórios", dataPath: "vendas.pedidos", xKey: "territorio", yKey: "SUM(valor_total)", format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "Serviços/Categorias", dataPath: "vendas.pedidos", xKey: "categoria_receita", yKey: "SUM(valor_total)", format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { title: "Pedidos", dataPath: "vendas.pedidos", xKey: "canal_venda", yKey: "COUNT()", format: "number", height: 220, nivo: { layout: 'horizontal' } } }
      ]}
    ]
  }
], null, 2);

function SalesPlayground() {
  const { data, setData } = useData();
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
      // Poderia refazer o fetch aqui, mantido simples
      return;
    }
  }, []);

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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render — Vendas</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Vendas com dados reais.</p>

        <DataProvider initialData={{ vendas: { dashboard: {}, kpis: {} } }}>
          <SalesPlayground />
        </DataProvider>
      </div>
    </div>
  );
}
