"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Palette, Type, Layout } from "lucide-react";
import { PRESETS, applyPresetOnCode, detectPresetKey, type PresetKey } from "@/components/visual-builder/CodeThemePresets";
import { FontManager } from "@/components/visual-builder/FontManager";
import { detectHeaderStyles, setHeaderContainerStyle, setHeaderTitleStyle, setHeaderSubtitleStyle } from "@/components/visual-builder/CodeHeaderMutations";

type CodeDesignToolbarProps = {
  code: string;
  onChange: (next: string) => void;
  className?: string;
};

export default function CodeDesignToolbar({ code, onChange, className }: CodeDesignToolbarProps) {
  const preset = useMemo(() => detectPresetKey(code), [code]);
  const styles = useMemo(() => detectHeaderStyles(code), [code]);
  const fonts = useMemo(() => FontManager.getAvailableFonts(), []);
  const fontSizes = useMemo(() => FontManager.getAvailableFontSizes(), []);

  // Local state mirrors (for inputs). We apply immediately on change.
  const [titleColor, setTitleColor] = useState(styles.title['color'] || '#111827');
  const [subtitleColor, setSubtitleColor] = useState(styles.subtitle['color'] || '#6b7280');
  const [headerBg, setHeaderBg] = useState(styles.container['background-color'] || '#ffffff');
  const [borderColor, setBorderColor] = useState(styles.container['border-color'] || '#e5e7eb');
  const [borderWidth, setBorderWidth] = useState<number>(parsePx(styles.container['border-width']) ?? 1);
  const [borderRadius, setBorderRadius] = useState<number>(parsePx(styles.container['border-radius']) ?? 12);

  const titleFontFamily = styles.title['font-family'] || fonts[0]?.family || 'Inter, system-ui, sans-serif';
  const titleFontSize = parsePx(styles.title['font-size']) ?? 18;
  const titleFontWeight = (styles.title['font-weight'] || '700').toString();
  const subtitleFontFamily = styles.subtitle['font-family'] || fonts[0]?.family || 'Inter, system-ui, sans-serif';
  const subtitleFontSize = parsePx(styles.subtitle['font-size']) ?? 14;
  const subtitleFontWeight = (styles.subtitle['font-weight'] || '400').toString();

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {/* Tema */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" className="h-8 px-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" variant="outline">
            <Palette className="w-4 h-4 mr-1" />
            {preset === 'custom' ? 'Tema' : PRESETS.find(p => p.key === preset)?.name || 'Tema'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PRESETS.map((p) => (
            <DropdownMenuItem key={p.key} onClick={() => onChange(applyPresetOnCode(code, p.key as PresetKey))}>
              {p.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Fonte */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" className="h-8 px-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" variant="outline">
            <Type className="w-4 h-4 mr-1" /> Fonte
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[460px]">
          <div className="text-xs text-gray-500 mb-2">Título</div>
          <div className="flex items-center gap-2 mb-3">
            <Select
              value={titleFontFamily}
              onValueChange={(v) => onChange(setHeaderTitleStyle(code, { fontFamily: v }))}
            >
              <SelectTrigger size="sm"><SelectValue placeholder="Fonte" /></SelectTrigger>
              <SelectContent>
                {fonts.map(f => (
                  <SelectItem key={f.key} value={f.family}>{f.name || f.family}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(titleFontSize)}
              onValueChange={(v) => onChange(setHeaderTitleStyle(code, { fontSize: Number(v) }))}
            >
              <SelectTrigger size="sm"><SelectValue placeholder="Tamanho" /></SelectTrigger>
              <SelectContent>
                {fontSizes.map(s => (
                  <SelectItem key={s.key} value={String(s.value)}>{s.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={titleFontWeight}
              onChange={(e) => onChange(setHeaderTitleStyle(code, { fontWeight: e.target.value }))}
              placeholder="Peso"
              className="h-8 w-20"
            />
            <Input
              type="color"
              value={titleColor}
              onChange={(e) => { setTitleColor(e.target.value); onChange(setHeaderTitleStyle(code, { color: e.target.value })); }}
              className="h-8 w-10 p-1"
            />
          </div>

          <div className="text-xs text-gray-500 mb-2 mt-2">Subtítulo</div>
          <div className="flex items-center gap-2">
            <Select
              value={subtitleFontFamily}
              onValueChange={(v) => onChange(setHeaderSubtitleStyle(code, { fontFamily: v }))}
            >
              <SelectTrigger size="sm"><SelectValue placeholder="Fonte" /></SelectTrigger>
              <SelectContent>
                {fonts.map(f => (
                  <SelectItem key={f.key} value={f.family}>{f.name || f.family}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(subtitleFontSize)}
              onValueChange={(v) => onChange(setHeaderSubtitleStyle(code, { fontSize: Number(v) }))}
            >
              <SelectTrigger size="sm"><SelectValue placeholder="Tamanho" /></SelectTrigger>
              <SelectContent>
                {fontSizes.map(s => (
                  <SelectItem key={s.key} value={String(s.value)}>{s.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={subtitleFontWeight}
              onChange={(e) => onChange(setHeaderSubtitleStyle(code, { fontWeight: e.target.value }))}
              placeholder="Peso"
              className="h-8 w-20"
            />
            <Input
              type="color"
              value={subtitleColor}
              onChange={(e) => { setSubtitleColor(e.target.value); onChange(setHeaderSubtitleStyle(code, { color: e.target.value })); }}
              className="h-8 w-10 p-1"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Cabeçalho */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" className="h-8 px-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" variant="outline">
            <Layout className="w-4 h-4 mr-1" /> Cabeçalho
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[520px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Fundo</div>
              <Input type="color" value={headerBg} onChange={(e) => { setHeaderBg(e.target.value); onChange(setHeaderContainerStyle(code, { backgroundColor: e.target.value })); }} className="h-8 w-12 p-1" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Borda</div>
              <div className="flex items-center gap-2">
                <Input type="color" value={borderColor} onChange={(e) => { setBorderColor(e.target.value); onChange(setHeaderContainerStyle(code, { borderColor: e.target.value })); }} className="h-8 w-12 p-1" />
                <Input type="number" min={0} value={borderWidth} onChange={(e) => { const n = Number(e.target.value||0); setBorderWidth(n); onChange(setHeaderContainerStyle(code, { borderWidth: n })); }} className="h-8 w-20" placeholder="largura" />
                <Select onValueChange={(v) => onChange(setHeaderContainerStyle(code, { borderStyle: v }))}>
                  <SelectTrigger size="sm"><SelectValue placeholder="estilo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">solid</SelectItem>
                    <SelectItem value="dashed">dashed</SelectItem>
                    <SelectItem value="dotted">dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Raio</div>
              <Input type="number" min={0} value={borderRadius} onChange={(e) => { const n = Number(e.target.value||0); setBorderRadius(n); onChange(setHeaderContainerStyle(code, { borderRadius: n })); }} className="h-8 w-24" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Padding</div>
              <Input type="number" min={0} placeholder="px" className="h-8 w-24" onChange={(e) => onChange(setHeaderContainerStyle(code, { padding: Number(e.target.value||0) }))} />
            </div>
          </div>
          <div className="mt-3 text-right">
            <Button size="sm" variant="outline" onClick={() => onChange(applyPresetOnCode(code, (preset === 'custom' ? 'clean-light' : preset) as PresetKey))}>Reset para tema</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function parsePx(s?: string): number | undefined {
  if (!s) return undefined;
  const m = String(s).match(/(-?\d+(?:\.\d+)?)px/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}
