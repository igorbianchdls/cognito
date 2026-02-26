"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Undo2, Redo2, ClipboardList, GitBranch, Upload, Palette } from 'lucide-react';
import { $previewJsonrPath } from '@/chat/sandbox';
import { APPS_COLOR_PRESETS, APPS_HEADER_THEME_OPTIONS, APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions';

function IconButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
            aria-label={title}
            title={title}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function normalizeToThemeTree(parsed: unknown): any[] {
  const nodes = Array.isArray(parsed) ? parsed.slice() : [parsed as any];
  if (!nodes[0] || typeof nodes[0] !== 'object' || (nodes[0] as any).type !== 'Theme') {
    return [
      {
        type: 'Theme',
        props: { name: 'light', headerTheme: 'auto', managers: {} },
        children: nodes,
      },
    ];
  }
  const theme = nodes[0] as any;
  theme.props = theme.props && typeof theme.props === 'object' ? theme.props : {};
  if (!theme.props.name) theme.props.name = 'light';
  if (typeof theme.props.headerTheme !== 'string') theme.props.headerTheme = 'auto';
  if (!theme.props.managers || typeof theme.props.managers !== 'object') theme.props.managers = {};
  return nodes;
}

type HeaderActionsProps = {
  chatId?: string;
};

const ARTIFACT_BORDER_PRESET_OPTIONS = [
  { value: 'hud_classic', label: 'Clássico (cantos)' },
  { value: 'rounded_minimal', label: 'Minimal arredondado' },
  { value: 'soft_card', label: 'Soft card' },
  { value: 'sharp_clean', label: 'Reto clean' },
  { value: 'hud_bold', label: 'HUD forte' },
] as const;

const ARTIFACT_BORDER_PRESETS: Record<string, { style?: string; width?: number; radius?: number; shadow?: string; frame?: null | { variant: 'hud'; cornerSize: number; cornerWidth: number } }> = {
  hud_classic: { style: 'solid', width: 1, radius: 8, shadow: 'none', frame: { variant: 'hud', cornerSize: 8, cornerWidth: 1 } },
  rounded_minimal: { style: 'none', width: 0, radius: 12, shadow: 'none', frame: null },
  soft_card: { style: 'solid', width: 1, radius: 14, shadow: 'md', frame: null },
  sharp_clean: { style: 'solid', width: 1, radius: 0, shadow: 'none', frame: null },
  hud_bold: { style: 'solid', width: 1, radius: 8, shadow: 'sm', frame: { variant: 'hud', cornerSize: 10, cornerWidth: 2 } },
};

export default function HeaderActions({ chatId }: HeaderActionsProps) {
  const previewPath = useStore($previewJsonrPath);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [themeName, setThemeName] = React.useState<string>('light');
  const [headerTheme, setHeaderTheme] = React.useState<string>('');
  const [colorPreset, setColorPreset] = React.useState<string>('custom');
  const [borderPreset, setBorderPreset] = React.useState<string>('custom');
  const [error, setError] = React.useState<string | null>(null);

  const schemeToPreset = React.useCallback((arr?: string[]): string => {
    if (!arr) return 'custom';
    for (const [k, v] of Object.entries(APPS_COLOR_PRESETS)) {
      if (
        v.length === arr.length &&
        v.every((c, i) => c.toLowerCase() === String(arr[i] || '').toLowerCase())
      ) {
        return k;
      }
    }
    return 'custom';
  }, []);

  const borderToPreset = React.useCallback((borderRaw?: any): string => {
    const b = (borderRaw && typeof borderRaw === 'object') ? borderRaw : {};
    const frame = (b.frame && typeof b.frame === 'object') ? b.frame : null;
    const hasFrame = Boolean(frame && (frame.variant || frame.cornerSize !== undefined || frame.cornerWidth !== undefined));
    for (const [key, preset] of Object.entries(ARTIFACT_BORDER_PRESETS)) {
      const sameStyle = String(b.style ?? '') === String(preset.style ?? '');
      const sameWidth = String(b.width ?? '') === String(preset.width ?? '');
      const sameRadius = String(b.radius ?? '') === String(preset.radius ?? '');
      const sameShadow = String(b.shadow ?? '') === String(preset.shadow ?? '');
      if (!sameStyle || !sameWidth || !sameRadius || !sameShadow) continue;
      if (preset.frame == null) {
        if (!hasFrame) return key;
        continue;
      }
      if (!frame) continue;
      const sameFrame =
        String(frame.variant ?? '') === String(preset.frame.variant ?? '') &&
        String(frame.cornerSize ?? '') === String(preset.frame.cornerSize ?? '') &&
        String(frame.cornerWidth ?? '') === String(preset.frame.cornerWidth ?? '');
      if (sameFrame) return key;
    }
    return 'custom';
  }, []);

  const readCurrent = React.useCallback(async () => {
    if (!chatId || !previewPath) {
      setError('chatId/path ausente');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fs-read', chatId, path: previewPath }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; content?: string; error?: string };
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Falha ao ler dashboard');
      const parsed = JSON.parse(String(data.content ?? '[]'));
      const nodes = normalizeToThemeTree(parsed);
      const props = (nodes[0] as any)?.props || {};
      const nextTheme = String(props.name || 'light');
      const rawHeader = typeof props.headerTheme === 'string' ? props.headerTheme : 'auto';
      const managers = props.managers && typeof props.managers === 'object' ? props.managers : {};
      const scheme = Array.isArray(managers?.color?.scheme) ? managers.color.scheme : undefined;
      setThemeName(nextTheme);
      setHeaderTheme(rawHeader === 'auto' ? '' : rawHeader);
      setColorPreset(schemeToPreset(scheme));
      setBorderPreset(borderToPreset(managers?.border));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Erro ao carregar tema');
    } finally {
      setLoading(false);
    }
  }, [borderToPreset, chatId, previewPath, schemeToPreset]);

  React.useEffect(() => {
    if (!open) return;
    void readCurrent();
  }, [open, readCurrent]);

  const persist = React.useCallback(
    async (next: { name?: string; headerTheme?: string; colorPreset?: string; borderPreset?: string }) => {
      if (!chatId || !previewPath) {
        setError('chatId/path ausente');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const readRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fs-read', chatId, path: previewPath }),
        });
        const readData = (await readRes.json().catch(() => ({}))) as { ok?: boolean; content?: string; error?: string };
        if (!readRes.ok || readData.ok === false) throw new Error(readData.error || 'Falha ao ler dashboard');

        const parsed = JSON.parse(String(readData.content ?? '[]'));
        const nodes = normalizeToThemeTree(parsed);
        const theme = nodes[0] as any;
        if (typeof next.name === 'string') theme.props.name = next.name;
        if (typeof next.headerTheme === 'string') {
          theme.props.headerTheme = next.headerTheme ? next.headerTheme : 'auto';
        }
        if (typeof next.colorPreset === 'string') {
          theme.props.managers = theme.props.managers && typeof theme.props.managers === 'object' ? theme.props.managers : {};
          theme.props.managers.color = theme.props.managers.color && typeof theme.props.managers.color === 'object' ? theme.props.managers.color : {};
          if (next.colorPreset && next.colorPreset !== 'custom') {
            theme.props.managers.color.scheme = APPS_COLOR_PRESETS[next.colorPreset];
          } else if (theme.props.managers.color) {
            delete theme.props.managers.color.scheme;
          }
        }
        if (typeof next.borderPreset === 'string' && next.borderPreset !== 'custom') {
          const preset = ARTIFACT_BORDER_PRESETS[next.borderPreset];
          if (preset) {
            theme.props.managers = theme.props.managers && typeof theme.props.managers === 'object' ? theme.props.managers : {};
            theme.props.managers.border = theme.props.managers.border && typeof theme.props.managers.border === 'object' ? theme.props.managers.border : {};
            const border = theme.props.managers.border;
            if (preset.style !== undefined) border.style = preset.style; else delete border.style;
            if (preset.width !== undefined) border.width = preset.width; else delete border.width;
            if (preset.radius !== undefined) border.radius = preset.radius; else delete border.radius;
            if (preset.shadow !== undefined) border.shadow = preset.shadow; else delete border.shadow;
            if (preset.frame) {
              border.frame = border.frame && typeof border.frame === 'object' ? border.frame : {};
              border.frame.variant = preset.frame.variant;
              border.frame.cornerSize = preset.frame.cornerSize;
              border.frame.cornerWidth = preset.frame.cornerWidth;
            } else {
              delete border.frame;
            }
          }
        }

        const writeRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fs-write',
            chatId,
            path: previewPath,
            content: JSON.stringify(nodes, null, 2),
          }),
        });
        const writeData = (await writeRes.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!writeRes.ok || writeData.ok === false) throw new Error(writeData.error || 'Falha ao salvar tema');

        const savedTheme = String(theme.props?.name || 'light');
        const savedHeaderRaw = typeof theme.props?.headerTheme === 'string' ? theme.props.headerTheme : 'auto';
        const savedScheme = Array.isArray(theme.props?.managers?.color?.scheme) ? theme.props.managers.color.scheme : undefined;
        const savedBorder = theme.props?.managers?.border;
        setThemeName(savedTheme);
        setHeaderTheme(savedHeaderRaw === 'auto' ? '' : savedHeaderRaw);
        setColorPreset(schemeToPreset(savedScheme));
        setBorderPreset(borderToPreset(savedBorder));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sandbox-preview-refresh', { detail: { path: previewPath } }));
        }
      } catch (e: any) {
        setError(e?.message ? String(e.message) : 'Erro ao salvar tema');
      } finally {
        setLoading(false);
      }
    },
    [borderToPreset, chatId, previewPath, schemeToPreset]
  );

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-md text-gray-700 hover:bg-gray-100 border border-transparent"
            aria-label="Tema"
            title="Tema"
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">Tema</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-72 p-3">
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-500">Tema do Dashboard Atual</div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Tema</label>
              <select
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-400"
                value={themeName}
                disabled={loading || !chatId || !previewPath}
                onChange={(e) => {
                  const next = e.target.value;
                  setThemeName(next);
                  void persist({ name: next });
                }}
              >
                {APPS_THEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Header</label>
              <select
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-400"
                value={headerTheme}
                disabled={loading || !chatId || !previewPath}
                onChange={(e) => {
                  const next = e.target.value;
                  setHeaderTheme(next);
                  void persist({ headerTheme: next });
                }}
              >
                {APPS_HEADER_THEME_OPTIONS.map((opt) => (
                  <option key={opt.value || 'auto'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Cores</label>
              <select
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-400"
                value={colorPreset}
                disabled={loading || !chatId || !previewPath}
                onChange={(e) => {
                  const next = e.target.value;
                  setColorPreset(next);
                  void persist({ colorPreset: next });
                }}
              >
                <option value="custom">Custom</option>
                {Object.keys(APPS_COLOR_PRESETS).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Borda FX</label>
              <select
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-400"
                value={borderPreset}
                disabled={loading || !chatId || !previewPath}
                onChange={(e) => {
                  const next = e.target.value;
                  setBorderPreset(next);
                  if (next !== 'custom') void persist({ borderPreset: next });
                }}
              >
                <option value="custom">Custom</option>
                {ARTIFACT_BORDER_PRESET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {error && <div className="text-[11px] text-red-600">{error}</div>}
          </div>
        </PopoverContent>
      </Popover>

      <IconButton title="Undo">
        <Undo2 className="w-4 h-4" />
      </IconButton>
      <IconButton title="Redo">
        <Redo2 className="w-4 h-4 text-gray-400" />
      </IconButton>
      <Separator orientation="vertical" className="h-5 mx-2" />
      <IconButton title="Clipboard">
        <ClipboardList className="w-4 h-4" />
      </IconButton>
      <IconButton title="Git">
        <GitBranch className="w-4 h-4" />
      </IconButton>
      <IconButton title="Upload">
        <Upload className="w-4 h-4" />
      </IconButton>
      {/* Deploy button removido */}
    </div>
  );
}
