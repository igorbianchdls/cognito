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
      { type: "Header", props: { title: "Dashboard de Compras", subtitle: "Principais indicadores e cortes", align: "center", controlsPosition: "right", datePicker: { visible: true, mode: "range", position: "right", storePath: "filters.dateRange", actionOnChange: { type: "refresh_data" }, style: { padding: 6, fontFamily: "Barlow", fontSize: 12 } } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "KPI", props: { title: "Gasto", format: "currency", dataQuery: { model: "compras.compras", measure: "SUM(valor_total)", filters: { tenant_id: 1 } } } },
        { type: "KPI", props: { title: "Fornecedores", format: "number", dataQuery: { model: "compras.compras", measure: "COUNT_DISTINCT(fornecedor_id)", filters: { tenant_id: 1 } } } },
        { type: "KPI", props: { title: "Pedidos", format: "number", dataQuery: { model: "compras.compras", measure: "COUNT_DISTINCT(id)", filters: { tenant_id: 1 } }, valueStyle: { fontSize: 22 } } },
        { type: "KPI", props: { title: "Transações", format: "number", dataQuery: { model: "compras.recebimentos", measure: "COUNT()", filters: { tenant_id: 1 } } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "SlicerCard", props: { fr: 1, title: "Filtro de Fornecedor (Tile)", layout: "horizontal", fields: [
          { label: "Fornecedor", type: "tile-multi", storePath: "filters.fornecedor_id", clearable: true, selectAll: true, source: { type: "api", url: "/api/modulos/compras/options?field=fornecedor_id&limit=100" } }
        ] } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Fornecedores", dataQuery: { model: "compras.compras", dimension: "fornecedor", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Centros de Custo", dataQuery: { model: "compras.compras", dimension: "centro_custo", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } },
        { type: "SlicerCard", props: { fr: 1, title: "Filtro Centro de Custo", fields: [
          { label: "Centro de Custo", type: "list", storePath: "filters.centro_custo_id", source: { type: "api", url: "/api/modulos/compras/options?field=centro_custo_id&limit=100" }, selectAll: true, search: true }
        ] } },
        { type: "BarChart", props: { fr: 1, title: "Filiais", dataQuery: { model: "compras.compras", dimension: "filial", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 240, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Categorias", dataQuery: { model: "compras.compras", dimension: "categoria_despesa", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Projetos", dataQuery: { model: "compras.compras", dimension: "projeto", measure: "SUM(valor_total)", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "currency", height: 220, nivo: { layout: 'horizontal' } } },
        { type: "BarChart", props: { fr: 1, title: "Status (Qtd)", dataQuery: { model: "compras.compras", dimension: "status", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "number", height: 220, nivo: { layout: 'horizontal' } } }
      ]},

      { type: "PieChart", props: { fr: 1, title: "Status (Pizza)", dataQuery: { model: "compras.compras", dimension: "status", measure: "COUNT()", filters: { tenant_id: 1 }, orderBy: { field: "measure", dir: "desc" }, limit: 8 }, format: "number", height: 260, nivo: { innerRadius: 0.35 } } },
      { type: "Div", props: { direction: "row", gap: 12, padding: 16, justify: "start", align: "start", childGrow: true }, children: [
        { type: "BarChart", props: { fr: 1, title: "Gasto por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')", measure: "SUM(valor_total)", filters: { tenant_id: 1, de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Pedidos por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')", measure: "COUNT()", filters: { tenant_id: 1, de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "number", height: 220, nivo: { layout: 'vertical' } } },
        { type: "BarChart", props: { fr: 1, title: "Ticket Médio por Mês", dataQuery: { model: "compras.compras", dimension: "mes", dimensionExpr: "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')", measure: "AVG(valor_total)", filters: { tenant_id: 1, de: "1900-01-01", ate: "2100-12-31" }, orderBy: { field: "dimension", dir: "asc" }, limit: 12 }, format: "currency", height: 220, nivo: { layout: 'vertical' } } }
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
        <ManagersPanel jsonText={jsonText} setJsonText={setJsonText} setTree={setTree} disabled={!!parseError} />
      </div>

      <div className="md:col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Preview</h2>
        </div>
        <div className="rounded-md border border-gray-200 p-0 min-h-[420px]">
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
    <div className="min-h-screen">
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

// Managers Panel (reuso simples — mesma implementação do de Vendas)
type PanelProps = { jsonText: string; setJsonText: (s: string) => void; setTree: (t: any) => void; disabled?: boolean };
function ManagersPanel({ jsonText, setJsonText, setTree, disabled }: PanelProps) {
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'blue', label: 'Blue' },
    { value: 'dark', label: 'Dark' },
    { value: 'black', label: 'Black' },
  ];
  const fontOptions = [
    'Inter, ui-sans-serif, system-ui',
    'Barlow, ui-sans-serif, system-ui',
    'Geist, ui-sans-serif, system-ui',
    'IBM Plex Sans, ui-sans-serif, system-ui',
    'Space Mono, ui-monospace, monospace',
    'Geist Mono, ui-monospace, monospace',
    'IBM Plex Mono, ui-monospace, monospace',
    'system-ui'
  ];
  const borderStyleOptions = ['none','solid','dashed','dotted'] as const;
  const borderWidthOptions = ['0','1','2','3'];
  const borderRadiusOptions = ['0','6','8','12'];
  const borderColorOptions = ['#e5e7eb','#333333','#2563eb','#10b981','#ef4444'];
  const shadowOptions = ['none','sm','md','lg','xl','2xl'];
  const bgOptions = ['#ffffff','#f8fafc','#eff6ff','#000000','#0a0a0a'];
  const surfaceOptions = ['#ffffff','#f1f5f9','#eef2ff','#0b0b0b','#111214'];
  const colorPresets: Record<string, string[]> = {
    sky: ['#38bdf8','#0ea5e9','#0284c7','#0369a1'],
    emerald: ['#34d399','#10b981','#059669','#047857'],
    vibrant: ['#22d3ee','#a78bfa','#34d399','#f59e0b','#ef4444'],
    category10: ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'],
  };
  const h1WeightOptions = ['400','500','600','700'];
  const h1SizeOptions = ['12','14','16','18','20'];
  const h1ColorOptions = ['#111827','#0f172a','#334155','#e5e7eb','#ffffff','#2563eb','#10b981','#ef4444'];
  const h1SpacingOptions = ['-0.05em','-0.04em','-0.03em','-0.02em','-0.01em','0em','0.01em','0.02em','0.03em','0.04em','0.05em'];
  const h1PaddingOptions = ['0','4','6','8','12'];

  function readCurrent(): { name: string; managers: any } {
    try {
      const arr = JSON.parse(jsonText);
      const nodes = Array.isArray(arr) ? arr : [arr];
      const theme = nodes[0] && nodes[0].type === 'Theme' ? nodes[0] : null;
      const name = String(theme?.props?.name || 'light');
      const managers = (theme?.props?.managers && typeof theme.props.managers === 'object') ? theme.props.managers : {};
      return { name, managers };
    } catch { return { name: 'light', managers: {} } }
  }
  function updateTheme(mut: (t: any) => void) {
    try {
      const arr = JSON.parse(jsonText);
      let nodes = Array.isArray(arr) ? arr : [arr];
      if (!nodes[0] || nodes[0].type !== 'Theme') {
        nodes = [{ type: 'Theme', props: { name: 'light' }, children: nodes }];
      }
      const theme = nodes[0];
      if (!theme.props) theme.props = { name: 'light' };
      mut(theme);
      const pretty = JSON.stringify(nodes, null, 2);
      setJsonText(pretty);
      setTree(nodes);
    } catch {}
  }
  const current = readCurrent();
  const schemeToPreset = (arr?: string[]): string => {
    if (!arr) return 'custom';
    for (const [k, v] of Object.entries(colorPresets)) {
      if (v.length === arr.length && v.every((c, i) => c.toLowerCase() === arr[i].toLowerCase())) return k;
    }
    return 'custom';
  };
  const currentPreset = schemeToPreset(current.managers?.color?.scheme);

  return (
    <div className="mt-4 rounded-md bg-white p-3 border border-gray-200">
      <h3 className="text-xs font-medium text-gray-900 mb-2">Aparência (Managers)</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Tema</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.name}
            onChange={(e) => updateTheme((th: any) => { if (!th.props) th.props = {}; th.props.name = e.target.value; })}>
            {themeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Fonte</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.font || ''}
            onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; if (e.target.value) th.props.managers.font = e.target.value; else delete th.props.managers.font; })}>
            <option value="">(padrão do tema)</option>
            {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">Borda</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.border?.style || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.border = th.props.managers.border || {}; const v = e.target.value; if (v) th.props.managers.border.style = v; else delete th.props.managers.border.style; })}>
              <option value="">(padrão)</option>
              {borderStyleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">Largura</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={String(current.managers?.border?.width ?? '')}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.border = th.props.managers.border || {}; const v = e.target.value; if (v !== '') th.props.managers.border.width = Number(v); else delete th.props.managers.border.width; })}>
              <option value="">(padrão)</option>
              {borderWidthOptions.map(w => <option key={w} value={w}>{w}px</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">Raio</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={String(current.managers?.border?.radius ?? '')}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.border = th.props.managers.border || {}; const v = e.target.value; if (v !== '') th.props.managers.border.radius = Number(v); else delete th.props.managers.border.radius; })}>
              <option value="">(padrão)</option>
              {borderRadiusOptions.map(r => <option key={r} value={r}>{r}px</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">Cor</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.border?.color || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.border = th.props.managers.border || {}; const v = e.target.value; if (v) th.props.managers.border.color = v; else delete th.props.managers.border.color; })}>
              <option value="">(padrão)</option>
              {borderColorOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <label className="text-xs text-gray-700 w-20">Sombra</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.border?.shadow || 'none'}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.border = th.props.managers.border || {}; th.props.managers.border.shadow = e.target.value; })}>
              {shadowOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Cores</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={(() => {
            const arr = current.managers?.color?.scheme as string[] | undefined;
            if (!arr) return 'custom';
            for (const [k, v] of Object.entries(colorPresets)) if (v.length === arr.length && v.every((c,i)=>c.toLowerCase()===arr[i].toLowerCase())) return k;
            return 'custom';
          })()}
            onChange={(e) => updateTheme((th: any) => {
              const preset = e.target.value;
              th.props.managers = th.props.managers || {};
              th.props.managers.color = th.props.managers.color || {};
              if (preset === 'custom') delete th.props.managers.color.scheme;
              else th.props.managers.color.scheme = colorPresets[preset];
            })}>
            <option value="custom">(padrão/props)</option>
            {Object.keys(colorPresets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Fundo</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.background || ''}
            onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; const v = e.target.value; if (v) th.props.managers.background = v; else delete th.props.managers.background; })}>
            <option value="">(padrão do tema)</option>
            {bgOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Containers</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.surface || ''}
            onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; const v = e.target.value; if (v) th.props.managers.surface = v; else delete th.props.managers.surface; })}>
            <option value="">(padrão do tema)</option>
            {surfaceOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* H1 Title (charts/slicers) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">H1 Cor</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.h1?.color || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.h1 = th.props.managers.h1 || {}; const v=e.target.value; if (v) th.props.managers.h1.color=v; else delete th.props.managers.h1.color; })}>
              <option value="">(padrão)</option>
              {h1ColorOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">H1 Peso</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.h1?.weight || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.h1 = th.props.managers.h1 || {}; const v=e.target.value; if (v) th.props.managers.h1.weight=v; else delete th.props.managers.h1.weight; })}>
              <option value="">(padrão)</option>
              {h1WeightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">H1 Tam.</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.h1?.size || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.h1 = th.props.managers.h1 || {}; const v=e.target.value; if (v) th.props.managers.h1.size=v; else delete th.props.managers.h1.size; })}>
              <option value="">(padrão)</option>
              {h1SizeOptions.map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">H1 Espaço</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.h1?.letterSpacing || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.h1 = th.props.managers.h1 || {}; const v=e.target.value; if (v) th.props.managers.h1.letterSpacing=v; else delete th.props.managers.h1.letterSpacing; })}>
              <option value="">(padrão)</option>
              {h1SpacingOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">H1 Fonte</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.h1?.font || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.h1 = th.props.managers.h1 || {}; const v=e.target.value; if (v) th.props.managers.h1.font=v; else delete th.props.managers.h1.font; })}>
              <option value="">(padrão)</option>
              {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 w-20">H1 Padding</label>
            <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.h1?.padding || ''}
              onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.h1 = th.props.managers.h1 || {}; const v=e.target.value; if (v) th.props.managers.h1.padding=v; else delete th.props.managers.h1.padding; })}>
              <option value="">(padrão)</option>
              {h1PaddingOptions.map(p => <option key={p} value={p}>{p}px</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
