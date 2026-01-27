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
      { type: "Header", props: { title: "Dashboard de Compras", subtitle: "Principais indicadores e cortes", align: "center" } },
      { type: "Card", props: { title: "KPIs de Compras" }, children: [
        { type: "Div", props: { direction: "row", gap: 12, justify: "between", align: "center" }, children: [
          { type: "Kpi", props: { label: "Gasto", valuePath: "compras.kpis.gasto", format: "currency" } },
          { type: "Kpi", props: { label: "Fornecedores", valuePath: "compras.kpis.fornecedores", format: "number" } },
          { type: "Kpi", props: { label: "Pedidos", valuePath: "compras.kpis.pedidos", format: "number" } },
          { type: "Kpi", props: { label: "Transações", valuePath: "compras.kpis.transacoes", format: "number" } }
        ]}
      ]},

      { type: "Div", props: { direction: "row", gap: 12, justify: "between", align: "start" }, children: [
        { type: "Card", props: { title: "Gasto por Fornecedor" }, children: [
          { type: "BarChart", props: { title: "Fornecedores", dataPath: "compras.dashboard.fornecedores", xKey: "label", yKey: "value", format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "Gasto por Centro de Custo" }, children: [
          { type: "BarChart", props: { title: "Centros de Custo", dataPath: "compras.dashboard.centro_custo", xKey: "label", yKey: "value", format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "Gasto por Filial" }, children: [
          { type: "BarChart", props: { title: "Filiais", dataPath: "compras.dashboard.filiais", xKey: "label", yKey: "value", format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
        ]}
      ]},

      { type: "Div", props: { direction: "row", gap: 12, justify: "between", align: "start" }, children: [
        { type: "Card", props: { title: "Gasto por Categoria" }, children: [
          { type: "BarChart", props: { title: "Categorias", dataPath: "compras.dashboard.categorias", xKey: "label", yKey: "value", format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "Gasto por Projeto" }, children: [
          { type: "BarChart", props: { title: "Projetos", dataPath: "compras.dashboard.projetos", xKey: "label", yKey: "value", format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "Gasto por Departamento" }, children: [
          { type: "BarChart", props: { title: "Departamentos", dataPath: "compras.dashboard.departamentos", xKey: "label", yKey: "value", format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
        ]}
      ]},

      { type: "Card", props: { title: "Pedidos por Status" }, children: [
        { type: "PieChart", props: { title: "Status", dataPath: "compras.dashboard.status", xKey: "label", yKey: "value", format: "number", height: 260, nivo: { innerRadius: 0.35 } } }
      ]}
    ]
  }
], null, 2);

function ComprasPlayground() {
  const { setData } = useData();
  const [jsonText, setJsonText] = useState<string>(COMPRAS_TEMPLATE_TEXT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tree, setTree] = useState<any | any[] | null>(() => {
    try { return JSON.parse(COMPRAS_TEMPLATE_TEXT); } catch { return null; }
  });

  // Fetch compras dashboard (dados reais)
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
        const res = await fetch(`/api/modulos/compras/dashboard?de=${de}&ate=${ate}&limit=8`, { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          setData((prev: any) => ({ ...(prev || {}), compras: { ...(prev?.compras || {}), dashboard: j?.charts || {}, kpis: j?.kpis || {} } }));
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div>
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
          className="w-full min-h-[420px] rounded-md border border-gray-300 bg-white p-3 font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {parseError && (
          <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">{parseError}</div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Preview</h2>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 min-h-[420px]">
          {tree ? (
            <Renderer tree={tree} registry={registry} />
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render — Compras</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Compras com dados reais.</p>

        <DataProvider initialData={{ compras: { dashboard: {}, kpis: {} } }}>
          <ComprasPlayground />
        </DataProvider>
      </div>
    </div>
  );
}

