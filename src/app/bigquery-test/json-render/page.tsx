"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Renderer } from "@/components/json-render/renderer";
import { registry } from "@/components/json-render/registry";
import { DataProvider, useData } from "@/components/json-render/context";

// Example JSON tree (as text)
const SAMPLE_TREE_TEXT = JSON.stringify([
  {
    type: "Card",
    props: { title: "KPIs" },
    children: [
      { type: "Metric", props: { label: "Receita", valuePath: "revenue", format: "currency" } },
      { type: "Metric", props: { label: "Crescimento", valuePath: "growth", format: "percent" } },
      { type: "Button", props: { label: "Atualizar", action: { type: "refresh_data" } } },
    ],
  },
  {
    type: "Card",
    props: { title: "Ações" },
    children: [
      { type: "Button", props: { label: "Exportar PDF", action: { type: "export_report" } } },
    ],
  },
], null, 2);

function Playground() {
  const { data, setData } = useData();
  const [jsonText, setJsonText] = useState<string>(SAMPLE_TREE_TEXT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tree, setTree] = useState<any | any[] | null>(() => {
    try { return JSON.parse(SAMPLE_TREE_TEXT); } catch { return null; }
  });

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

        <DataProvider initialData={{ revenue: 125000, growth: 0.15 }}>
          <Playground />
        </DataProvider>
      </div>
    </div>
  );
}
