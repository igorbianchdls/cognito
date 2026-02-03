"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

type Config = {
  fontFamily: string;
  fontSize: number; // px
  letterSpacingEm: number; // em units (e.g., -0.02)
  fontWeight: number; // 400..700
  paddingY: number; // px
  itemColor: string;
  bgColor: string;
  iconSize: number; // px
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
  // Geist (como pedido)
  fontFamily: FONT_OPTIONS.find(f => f.value === 'Geist')?.css || FONT_OPTIONS[0].css,
  // Tamanho da fonte 14px
  fontSize: 14,
  // Espaçamento -0.02 (em)
  letterSpacingEm: -0.02,
  fontWeight: 500,
  paddingY: 2,
  // Cor da fonte RGB(100,100,100)
  itemColor: "#646464",
  // Fundo RGB(253,253,253)
  bgColor: "#fdfdfd",
  // Tamanho dos ícones 14px
  iconSize: 14,
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
    fontWeight: cfg.fontWeight as React.CSSProperties["fontWeight"],
    letterSpacing: `${cfg.letterSpacingEm}em`,
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
                <label className="block text-gray-600 mb-1">Peso da fonte</label>
                <select className="w-full border rounded px-2 py-1" value={cfg.fontWeight}
                  onChange={(e)=> setCfg(c => ({ ...c, fontWeight: Number(e.target.value || 500) }))}>
                  <option value={400}>Regular (400)</option>
                  <option value={500}>Medium (500)</option>
                  <option value={600}>Semibold (600)</option>
                  <option value={700}>Bold (700)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Espaçamento entre caracteres (letter-spacing, em)</label>
              <input type="number" min={-0.1} max={0.25} step={0.005} className="w-full border rounded px-2 py-1" value={cfg.letterSpacingEm}
                onChange={(e)=> setCfg(c => ({ ...c, letterSpacingEm: Number(e.target.value || 0) }))} />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Tamanho dos ícones (px)</label>
              <input type="number" min={10} max={32} step={1} className="w-full border rounded px-2 py-1" value={cfg.iconSize}
                onChange={(e)=> setCfg(c => ({ ...c, iconSize: Number(e.target.value || 12) }))} />
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
            <SidebarProvider>
              <SidebarShadcn
                bgColor={cfg.bgColor}
                itemTextColor={cfg.itemColor}
                itemTextStyle={itemTextStyle}
                iconSizePx={cfg.iconSize}
                showHeaderTrigger={false}
                className="h-full"
              />
              {/* Inset placeholder to satisfy layout; preview only */}
              <SidebarInset className="h-full" />
            </SidebarProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
