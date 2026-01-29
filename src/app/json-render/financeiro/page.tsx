"use client";

import React, { useCallback, useState } from "react";
import { Renderer } from "@/components/json-render/renderer";
import { registry } from "@/components/json-render/registry";
import { DataProvider, useData } from "@/components/json-render/context";

const FINANCE_TEMPLATE_TEXT = JSON.stringify([
  {
    type: "Theme",
    props: { name: "light" },
    children: [
      { type: "Header", props: { title: "Dashboard Financeiro", subtitle: "Contas a Pagar e Receber", align: "center", controlsPosition: "right", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } }, slicers: [
        { label: "Status", type: "dropdown", storePath: "filters.status", placeholder: "Todos", source: { type: "api", url: "/api/modulos/financeiro/options?field=status&limit=100" }, actionOnChange: { type: "refresh_data" } },
        { label: "Cliente", type: "dropdown", storePath: "filters.cliente_id", placeholder: "Todos", source: { type: "api", url: "/api/modulos/financeiro/options?field=cliente_id&limit=100" }, actionOnChange: { type: "refresh_data" } },
        { label: "Centro de Lucro", type: "list", storePath: "filters.centro_lucro_id", source: { type: "api", url: "/api/modulos/financeiro/options?field=centro_lucro_id&limit=100" }, actionOnChange: { type: "refresh_data" } },
        { label: "Valor do Título", type: "range", prefix: "R$", storeMinPath: "filters.valor_min", storeMaxPath: "filters.valor_max", step: 1, actionOnChange: { type: "refresh_data" } }
      ] } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, childGrow: true }, children: [
        { type: "KPI", props: { title: "AP (Período)", format: "currency", dataQuery: { model: "financeiro.contas_pagar", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 } }, titleStyle: { fontWeight: 600, fontSize: 12, color: "#64748b" }, valueStyle: { fontWeight: 700, fontSize: 24, color: "#0f172a" } } },
        { type: "KPI", props: { title: "AR (Período)", format: "currency", dataQuery: { model: "financeiro.contas_receber", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 } }, titleStyle: { fontWeight: 600, fontSize: 12, color: "#64748b" }, valueStyle: { fontWeight: 700, fontSize: 24, color: "#0f172a" } } }
      ] },

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "AP por Fornecedor", dataQuery: { model: "financeiro.contas_pagar", dimension: "fornecedor", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "AR por Centro de Lucro", dataQuery: { model: "financeiro.contas_receber", dimension: "centro_lucro", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "AP por Categoria (Despesa)", dataQuery: { model: "financeiro.contas_pagar", dimension: "categoria_despesa", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "AP por Centro de Custo", dataQuery: { model: "financeiro.contas_pagar", dimension: "centro_custo", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "SlicerCard", props: { fr: 1, title: "Filtro Centro de Lucro", fields: [
          { label: "Centro de Lucro", type: "list", storePath: "filters.centro_lucro_id", source: { type: "api", url: "/api/modulos/financeiro/options?field=centro_lucro_id&limit=100" }, selectAll: true, search: true }
        ], containerStyle: { borderWidth: 2, borderColor: "#e5e7eb", borderRadius: 12 } } },
        { type: "BarChart", props: { fr: 1, title: "AP por Departamento", dataQuery: { model: "financeiro.contas_pagar", dimension: "departamento", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "AP por Filial", dataQuery: { model: "financeiro.contas_pagar", dimension: "filial", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "AP por Unidade de Negócio", dataQuery: { model: "financeiro.contas_pagar", dimension: "unidade_negocio", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "AR por Categoria (Receita)", dataQuery: { model: "financeiro.contas_receber", dimension: "categoria_receita", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "AR por Cliente", dataQuery: { model: "financeiro.contas_receber", dimension: "cliente", measure: "SUM(valor_liquido)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "LineChart", props: { fr: 3, title: "AP por Mês", dataQuery: { model: "financeiro.contas_pagar", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM')", measure: "SUM(valor_liquido)", filters: { tenant_id: 1, de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 240, nivo: { curve: 'monotoneX', area: true } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "PieChart", props: { fr: 1, title: "AP por Status", dataQuery: { model: "financeiro.contas_pagar", dimension: "status", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "number", height: 240, nivo: { innerRadius: 0.35 } } },
        { type: "PieChart", props: { fr: 1, title: "AR por Status", dataQuery: { model: "financeiro.contas_receber", dimension: "status", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 6 }, format: "number", height: 240, nivo: { innerRadius: 0.35 } } }
      ]}
    ]
  }
], null, 2);

function FinancePlayground() {
  const { setData, getValueByPath } = useData();
  const [jsonText, setJsonText] = useState<string>(FINANCE_TEMPLATE_TEXT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tree, setTree] = useState<any | any[] | null>(() => {
    try { return JSON.parse(FINANCE_TEMPLATE_TEXT); } catch { return null; }
  });

  const onChangeText = useCallback((s: string) => {
    setJsonText(s);
    try { setTree(JSON.parse(s)); setParseError(null) } catch (e: any) { setParseError(e?.message ? String(e.message) : 'Invalid JSON') }
  }, []);

  const onFormat = useCallback(() => {
    try { const t = JSON.parse(jsonText); setJsonText(JSON.stringify(t, null, 2)); setParseError(null) } catch (e: any) { setParseError(e?.message ? String(e.message) : 'Invalid JSON') }
  }, [jsonText]);

  const onReset = useCallback(() => {
    setJsonText(FINANCE_TEMPLATE_TEXT);
    try { setTree(JSON.parse(FINANCE_TEMPLATE_TEXT)); setParseError(null) } catch {}
  }, []);

  const handleAction = useCallback((action: any) => {
    if (action?.type === 'refresh_data') {
      // Os gráficos com dataQuery já se atualizam com o dateRange do Header
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

export default function JsonRenderFinanceiroPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render — Financeiro</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Financeiro com queries no servidor.</p>

        <DataProvider initialData={{ financeiro: { kpis: {}, dashboard: {} } }}>
          <FinancePlayground />
        </DataProvider>
      </div>
    </div>
  );
}
