"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";

type Config = {
  fontFamily: string;
  fontSize: number; // px
  lineHeight: number; // unitless
  paddingY: number; // px
  itemColor: string;
  bgColor: string;
};

const FONT_OPTIONS: Array<{ label: string; value: string; css: string }> = [
  { label: "Inter", value: "Inter", css: 'var(--font-inter)' },
  { label: "Geist", value: "Geist", css: 'var(--font-geist-sans)' },
  { label: "Barlow", value: "Barlow", css: 'var(--font-barlow), "Barlow", sans-serif' },
  { label: "Space Mono", value: "Space Mono", css: 'var(--font-space-mono), "Space Mono", monospace' },
  { label: "Roboto Mono", value: "Roboto Mono", css: 'var(--font-roboto-mono)' },
  { label: "Avenir", value: "Avenir", css: 'var(--font-avenir), Avenir, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' },
  { label: "EB Garamond", value: "EB Garamond", css: 'var(--font-eb-garamond), "EB Garamond", serif' },
  { label: "Libre Baskerville", value: "Libre Baskerville", css: 'var(--font-libre-baskerville), "Libre Baskerville", serif' },
];

const DEFAULTS: Config = {
  fontFamily: FONT_OPTIONS[0].css,
  fontSize: 13,
  lineHeight: 1.35,
  paddingY: 2,
  itemColor: "#0f172a",
  bgColor: "#f9fafb",
};

export default function SidebarConfiguratorPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);

  // Load/save from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sidebarshadcn-config");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCfg({ ...DEFAULTS, ...parsed });
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("sidebarshadcn-config", JSON.stringify(cfg)); } catch {}
  }, [cfg]);

  const itemTextStyle = useMemo(() => ({
    fontFamily: cfg.fontFamily,
    fontSize: `${cfg.fontSize}px`,
    color: cfg.itemColor,
    lineHeight: cfg.lineHeight,
    paddingTop: `${cfg.paddingY}px`,
    paddingBottom: `${cfg.paddingY}px`,
  } as React.CSSProperties), [cfg]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Configurar Sidebar</h1>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">Fonte dos itens</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={FONT_OPTIONS.find(f => f.css === cfg.fontFamily)?.value || FONT_OPTIONS[0].value}
                onChange={(e) => {
                  const f = FONT_OPTIONS.find(x => x.value === e.target.value) || FONT_OPTIONS[0]
                  setCfg(c => ({ ...c, fontFamily: f.css }))
                }}
              >
                {FONT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">Tamanho da fonte (px)</label>
                <input type="number" min={10} max={20} step={1} className="w-full border rounded px-2 py-1" value={cfg.fontSize}
                  onChange={(e)=> setCfg(c => ({ ...c, fontSize: Number(e.target.value || 13) }))} />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Espaçamento (line-height)</label>
                <input type="number" min={1.0} max={2.0} step={0.05} className="w-full border rounded px-2 py-1" value={cfg.lineHeight}
                  onChange={(e)=> setCfg(c => ({ ...c, lineHeight: Number(e.target.value || 1.35) }))} />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Padding vertical por item (px)</label>
              <input type="number" min={0} max={12} step={1} className="w-full border rounded px-2 py-1" value={cfg.paddingY}
                onChange={(e)=> setCfg(c => ({ ...c, paddingY: Number(e.target.value || 2) }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">Cor da fonte</label>
                <input type="color" className="w-full h-9 border rounded" value={cfg.itemColor}
                  onChange={(e)=> setCfg(c => ({ ...c, itemColor: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Fundo do Sidebar</label>
                <input type="color" className="w-full h-9 border rounded" value={cfg.bgColor}
                  onChange={(e)=> setCfg(c => ({ ...c, bgColor: e.target.value }))} />
              </div>
            </div>

            <div className="pt-2 space-x-2">
              <button className="px-3 py-1.5 rounded border text-sm" onClick={()=> setCfg(DEFAULTS)}>Reset</button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="border-b px-3 py-2 text-sm text-gray-600">Pré-visualização</div>
          <div className="h-[520px]">
            <SidebarShadcn
              bgColor={cfg.bgColor}
              itemTextColor={cfg.itemColor}
              itemTextStyle={itemTextStyle}
              showHeaderTrigger={false}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

