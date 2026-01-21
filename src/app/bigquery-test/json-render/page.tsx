"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Renderer } from "@/components/json-render/renderer";
import { registry } from "@/components/json-render/registry";

// Minimal sample tree for MVP (static)
const SAMPLE_TREE = [
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
];

export default function JsonRenderPage() {
  const [data, setData] = useState<{ revenue: number; growth: number }>({ revenue: 125000, growth: 0.15 });

  const handleAction = useCallback((action: any) => {
    const t = action?.type;
    if (t === "refresh_data") {
      // Fake refresh: jitter values slightly
      setData((prev) => ({
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

  const tree = useMemo(() => SAMPLE_TREE, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">JSON Render (MVP)</h1>
        <p className="text-sm text-gray-600 mb-6">Renderização simples via catálogo zod, sem providers/hooks.</p>

        <Renderer tree={tree} registry={registry} data={data} onAction={handleAction} />

        <div className="mt-6 rounded-md bg-white p-4 border border-gray-200">
          <h2 className="text-sm font-medium text-gray-900 mb-2">Dados atuais</h2>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
