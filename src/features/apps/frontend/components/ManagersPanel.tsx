"use client";

import React from "react";

type PanelProps = { jsonText: string; setJsonText: (s: string) => void; setTree: (t: any) => void; disabled?: boolean };

export default function ManagersPanel({ jsonText, setJsonText, setTree, disabled }: PanelProps) {
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'blue', label: 'Blue' },
    { value: 'dark', label: 'Dark' },
    { value: 'black', label: 'Black' },
    { value: 'slate', label: 'Slate' },
    { value: 'navy', label: 'Navy' },
    { value: 'sand', label: 'Sand' },
    { value: 'charcoal', label: 'Charcoal' },
    { value: 'midnight', label: 'Midnight' },
    { value: 'metro', label: 'Metro' },
    { value: 'aero', label: 'Aero' },
  ];
  const headerThemeOptions = [
    { value: '', label: 'Auto' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'contrast', label: 'Contrast' },
    { value: 'surface', label: 'Surface' },
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
  const kpiWeightOptions = ['400','500','600','700'];
  const kpiSizeOptions = ['12','14','16','18','20','22','24'];
  const kpiColorOptions = ['#111827','#0f172a','#334155','#e5e7eb','#ffffff','#2563eb','#10b981','#ef4444'];
  const kpiSpacingOptions = ['-0.05em','-0.04em','-0.03em','-0.02em','-0.01em','0em','0.01em','0.02em','0.03em','0.04em','0.05em'];
  const kpiPaddingOptions = ['0','4','6','8','12'];

  function readCurrent(): { name: string; headerTheme: string; managers: any } {
    try {
      const arr = JSON.parse(jsonText);
      const nodes = Array.isArray(arr) ? arr : [arr];
      const theme = nodes[0] && nodes[0].type === 'Theme' ? nodes[0] : null;
      const name = String(theme?.props?.name || 'light');
      const headerTheme = typeof theme?.props?.headerTheme === 'string' ? theme.props.headerTheme : '';
      const managers = (theme?.props?.managers && typeof theme.props.managers === 'object') ? theme.props.managers : {};
      return { name, headerTheme, managers };
    } catch { return { name: 'light', headerTheme: '', managers: {} } }
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
    } catch {
      // ignore parse errors — UI already shows disabled or error
    }
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
        {/* Tema */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Tema</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.name}
            onChange={(e) => updateTheme((th: any) => { if (!th.props) th.props = {}; th.props.name = e.target.value; })}>
            {themeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Header</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.headerTheme}
            onChange={(e) => updateTheme((th: any) => {
              if (!th.props) th.props = {};
              const v = e.target.value;
              if (v) th.props.headerTheme = v;
              else delete th.props.headerTheme;
            })}>
            {headerThemeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* KPI Title / Value */}
        <div className="mt-2 rounded border border-gray-200 p-2">
          <div className="text-xs font-medium text-gray-700 mb-1">KPI — Título</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Fonte</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.title?.font || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.title = th.props.managers.kpi.title || {}; const v=e.target.value; if (v) th.props.managers.kpi.title.font=v; else delete th.props.managers.kpi.title.font; })}>
                <option value="">(padrão)</option>
                {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Peso</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.title?.weight || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.title = th.props.managers.kpi.title || {}; const v=e.target.value; if (v) th.props.managers.kpi.title.weight=v; else delete th.props.managers.kpi.title.weight; })}>
                <option value="">(padrão)</option>
                {kpiWeightOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Cor</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.title?.color || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.title = th.props.managers.kpi.title || {}; const v=e.target.value; if (v) th.props.managers.kpi.title.color=v; else delete th.props.managers.kpi.title.color; })}>
                <option value="">(padrão)</option>
                {kpiColorOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Espaço</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.title?.letterSpacing || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.title = th.props.managers.kpi.title || {}; const v=e.target.value; if (v) th.props.managers.kpi.title.letterSpacing=v; else delete th.props.managers.kpi.title.letterSpacing; })}>
                <option value="">(padrão)</option>
                {kpiSpacingOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Padding</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.title?.padding || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.title = th.props.managers.kpi.title || {}; const v=e.target.value; if (v) th.props.managers.kpi.title.padding=v; else delete th.props.managers.kpi.title.padding; })}>
                <option value="">(padrão)</option>
                {kpiPaddingOptions.map(p => <option key={p} value={p}>{p}px</option>)}
              </select>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-700 mb-1">KPI — Valor</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Fonte</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.value?.font || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.value = th.props.managers.kpi.value || {}; const v=e.target.value; if (v) th.props.managers.kpi.value.font=v; else delete th.props.managers.kpi.value.font; })}>
                <option value="">(padrão)</option>
                {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Peso</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.value?.weight || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.value = th.props.managers.kpi.value || {}; const v=e.target.value; if (v) th.props.managers.kpi.value.weight=v; else delete th.props.managers.kpi.value.weight; })}>
                <option value="">(padrão)</option>
                {kpiWeightOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Cor</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.value?.color || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.value = th.props.managers.kpi.value || {}; const v=e.target.value; if (v) th.props.managers.kpi.value.color=v; else delete th.props.managers.kpi.value.color; })}>
                <option value="">(padrão)</option>
                {kpiColorOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Espaço</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.value?.letterSpacing || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.value = th.props.managers.kpi.value || {}; const v=e.target.value; if (v) th.props.managers.kpi.value.letterSpacing=v; else delete th.props.managers.kpi.value.letterSpacing; })}>
                <option value="">(padrão)</option>
                {kpiSpacingOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-700 w-20">Padding</label>
              <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.kpi?.value?.padding || ''}
                onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; th.props.managers.kpi = th.props.managers.kpi || {}; th.props.managers.kpi.value = th.props.managers.kpi.value || {}; const v=e.target.value; if (v) th.props.managers.kpi.value.padding=v; else delete th.props.managers.kpi.value.padding; })}>
                <option value="">(padrão)</option>
                {kpiPaddingOptions.map(p => <option key={p} value={p}>{p}px</option>)}
              </select>
            </div>
          </div>
        </div>
        {/* Fonte */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Fonte</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.font || ''}
            onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; if (e.target.value) th.props.managers.font = e.target.value; else delete th.props.managers.font; })}>
            <option value="">(padrão do tema)</option>
            {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        {/* Borda */}
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
        {/* Paleta */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Cores</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={currentPreset}
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
        {/* Fundo Dashboard */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-700 w-20">Fundo</label>
          <select disabled={disabled} className="text-xs border border-gray-300 rounded px-2 py-1" value={current.managers?.background || ''}
            onChange={(e) => updateTheme((th: any) => { th.props.managers = th.props.managers || {}; const v = e.target.value; if (v) th.props.managers.background = v; else delete th.props.managers.background; })}>
            <option value="">(padrão do tema)</option>
            {bgOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Fundo Containers */}
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
