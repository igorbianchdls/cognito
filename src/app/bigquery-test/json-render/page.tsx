"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Renderer } from "@/components/json-render/renderer";
import { registry } from "@/components/json-render/registry";
import { DataProvider, useData } from "@/components/json-render/context";

// Example JSON tree (as text)
const SAMPLE_TREE_TEXT = JSON.stringify([
  {
    type: "Theme",
    props: { name: "light" },
    children: [
      { type: "Header", props: { title: "Dashboard (Dados Reais)", subtitle: "Vendas, Compras e Financeiro", align: "center" } },
      { type: "Card", props: { title: "KPIs Financeiros" }, children: [
        { type: "Div", props: { direction: "row", gap: 12, justify: "between", align: "center" }, children: [
          { type: "Kpi", props: { label: "Recebidos (Período)", valuePath: "financeiro.kpis.recebidos_mes", format: "currency" } },
          { type: "Kpi", props: { label: "Pagos (Período)", valuePath: "financeiro.kpis.pagos_mes", format: "currency" } },
          { type: "Kpi", props: { label: "Geração de Caixa", valuePath: "financeiro.kpis.geracao_caixa", format: "currency" } }
        ]},
        { type: "Button", props: { label: "Atualizar", action: { type: "refresh_data" } } }
      ]},
      { type: "Card", props: { title: "Financeiro: AP por Fornecedor" }, children: [
        { type: "BarChart", props: { title: "AP por Fornecedor", dataPath: "financeiro.dashboard.ap.fornecedor", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
      ]},
      { type: "Card", props: { title: "Financeiro: AR por Centro de Lucro" }, children: [
        { type: "BarChart", props: { title: "AR por Centro de Lucro", dataPath: "financeiro.dashboard.ar.centro_lucro", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
      ]},
      { type: "Card", props: { title: "Financeiro: Top Títulos A Pagar" }, children: [
        { type: "BarChart", props: { title: "Top 5 Títulos (AP)", dataPath: "financeiro.dashboard.ap.titulo", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
      ]},
      { type: "Div", props: { direction: "row", gap: 12, justify: "between", align: "start" }, children: [
        { type: "Card", props: { title: "AP por Centro de Custo" }, children: [
          { type: "BarChart", props: { title: "Centros de Custo", dataPath: "financeiro.dashboard.ap.centro_custo", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Categoria (Despesa)" }, children: [
          { type: "BarChart", props: { title: "Categorias de Despesa", dataPath: "financeiro.dashboard.ap.categoria", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Departamento" }, children: [
          { type: "BarChart", props: { title: "Departamentos", dataPath: "financeiro.dashboard.ap.departamento", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]}
      ]},
      { type: "Div", props: { direction: "row", gap: 12, justify: "between", align: "start" }, children: [
        { type: "Card", props: { title: "AR por Categoria (Receita)" }, children: [
          { type: "BarChart", props: { title: "Categorias de Receita", dataPath: "financeiro.dashboard.ar.categoria", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Filial" }, children: [
          { type: "BarChart", props: { title: "Filiais", dataPath: "financeiro.dashboard.ap.filial", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]},
        { type: "Card", props: { title: "AP por Unidade de Negócio" }, children: [
          { type: "BarChart", props: { title: "Unidades de Negócio", dataPath: "financeiro.dashboard.ap.unidade_negocio", xKey: "label", yKey: "value", format: "currency", height: 200, nivo: { layout: 'horizontal' } } }
        ]}
      ]},
      { type: "Card", props: { title: "Vendas: Vendas por Canal" }, children: [
        { type: "PieChart", props: { title: "Canais de Venda", dataPath: "vendas.dashboard.canais", xKey: "label", yKey: "value", format: "currency", height: 220, nivo: { innerRadius: 0.3 } } }
      ]},
      { type: "Card", props: { title: "Compras: Gasto por Fornecedor" }, children: [
        { type: "BarChart", props: { title: "Gasto por Fornecedor", dataPath: "compras.dashboard.fornecedores", xKey: "label", yKey: "value", format: "currency", height: 200 } }
      ]}
    ]
  }
], null, 2);

function Playground() {
  const { data, setData } = useData();
  const [jsonText, setJsonText] = useState<string>(SAMPLE_TREE_TEXT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tree, setTree] = useState<any | any[] | null>(() => {
    try { return JSON.parse(SAMPLE_TREE_TEXT); } catch { return null; }
  });

  // Carrega exemplos reais de APIs (Financeiro e Vendas)
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

        const [finRes, venRes, comRes] = await Promise.allSettled([
          fetch(`/api/modulos/financeiro/dashboard?de=${de}&ate=${ate}&limit=6`, { cache: 'no-store' }),
          fetch(`/api/modulos/vendas/dashboard?de=${de}&ate=${ate}&limit=6`, { cache: 'no-store' }),
          fetch(`/api/modulos/compras/dashboard?de=${de}&ate=${ate}&limit=6`, { cache: 'no-store' }),
        ]);

        const next: Record<string, any> = {};
        if (finRes.status === 'fulfilled' && finRes.value.ok) {
          const j = await finRes.value.json();
          next.financeiro = { ...(data?.financeiro || {}), dashboard: j?.charts || {} };
          if (j?.kpis) next.financeiro.kpis = j.kpis;
        }
        if (venRes.status === 'fulfilled' && venRes.value.ok) {
          const j = await venRes.value.json();
          next.vendas = { ...(data?.vendas || {}), dashboard: j?.charts || {} };
          if (j?.kpis) next.vendas.kpis = j.kpis;
        }
        if (comRes.status === 'fulfilled' && comRes.value.ok) {
          const j = await comRes.value.json();
          next.compras = { ...(data?.compras || {}), dashboard: j?.charts || {} };
          if (j?.kpis) next.compras.kpis = j.kpis;
        }
        if (!cancelled && Object.keys(next).length) {
          setData((prev: any) => ({ ...(prev || {}), ...next }));
        }
      } catch {
        // silencioso
      }
    }
    load();
    return () => { cancelled = true };
  }, []);

  const handleAction = useCallback((action: any) => {
    const t = action?.type;
    if (t === "refresh_data") {
      // Fake refresh: jitter values slightly
      setData((prev: any) => ({
        revenue: Math.round(prev.revenue * (0.98 + Math.random() * 0.04)),
        growth: Math.max(0, Math.min(1, prev.growth + (Math.random() - 0.5) * 0.02)),
      }));
      return;
    }
    if (t === "export_report") {
      // Stub
      alert("Exportar para PDF (stub)");
      return;
    }
    console.warn("Unhandled action:", action);
  }, []);

  const onChangeText = useCallback((s: string) => {
    setJsonText(s);
    try {
      const t = JSON.parse(s);
      setTree(t);
      setParseError(null);
    } catch (e: any) {
      setParseError(e?.message ? String(e.message) : "Invalid JSON");
    }
  }, []);

  const onFormat = useCallback(() => {
    try {
      const t = JSON.parse(jsonText);
      const pretty = JSON.stringify(t, null, 2);
      setJsonText(pretty);
      setParseError(null);
    } catch (e: any) {
      setParseError(e?.message ? String(e.message) : "Invalid JSON");
    }
  }, [jsonText]);

  const onReset = useCallback(() => {
    setJsonText(SAMPLE_TREE_TEXT);
    try { setTree(JSON.parse(SAMPLE_TREE_TEXT)); setParseError(null); } catch {}
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Editor */}
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
          <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
            {parseError}
          </div>
        )}
        <div className="mt-4 rounded-md bg-white p-3 border border-gray-200">
          <h3 className="text-xs font-medium text-gray-900 mb-1">Dados atuais</h3>
          <pre className="text-[11px] text-gray-700 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Preview</h2>
          <div className="text-xs text-gray-500">Ações: Atualizar / Exportar PDF</div>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 min-h-[420px]">
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

export default function JsonRenderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render (MVP)</h1>
        <p className="text-sm text-gray-600 mb-6">Edite o JSON à esquerda e veja o render à direita.</p>

        <DataProvider initialData={{
          revenue: 125000, growth: 0.15,
          salesByMonth: [
            { month: 'Jan', total: 12000 },
            { month: 'Fev', total: 18000 },
            { month: 'Mar', total: 15000 },
            { month: 'Abr', total: 22000 },
            { month: 'Mai', total: 17500 },
          ],
          categoryShare: [
            { category: 'A', value: 0.35 },
            { category: 'B', value: 0.25 },
            { category: 'C', value: 0.20 },
            { category: 'D', value: 0.12 },
            { category: 'E', value: 0.08 },
          ],
          // Namespaces vazios a serem preenchidos pelo fetch em runtime
          financeiro: { dashboard: {} },
          vendas: { dashboard: {} }
        }}>
          <Playground />
        </DataProvider>
      </div>
    </div>
  );
}
