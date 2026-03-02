"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Undo2, Redo2, RefreshCw, Upload, Palette, Save, Bell, Trash2, Check } from 'lucide-react';
import { $artifactNotifications, $previewJsonrPath, sandboxActions } from '@/chat/sandbox';
import { APPS_COLOR_PRESETS, APPS_HEADER_THEME_OPTIONS, APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions';
import { DASHBOARD_BACKGROUND_PRESET_OPTIONS } from '@/products/bi/json-render/backgrounds/registry';

function IconButton({
  title,
  children,
  onClick,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
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

type ThemeVisualMeta = {
  title: string;
  subtitle: string;
  swatches: string[];
};

const ARTIFACT_THEME_BASE_META: Record<string, ThemeVisualMeta> = {
  light: { title: 'Light', subtitle: 'Neutro e limpo para leitura', swatches: ['#f8fafc', '#e2e8f0', '#94a3b8'] },
  blue: { title: 'Blue', subtitle: 'Interface fria com foco em dados', swatches: ['#eff6ff', '#60a5fa', '#1d4ed8'] },
  dark: { title: 'Dark', subtitle: 'Contraste alto para ambiente escuro', swatches: ['#0f172a', '#334155', '#94a3b8'] },
  black: { title: 'Black', subtitle: 'Visual profundo com destaque forte', swatches: ['#020617', '#111827', '#4b5563'] },
  slate: { title: 'Slate', subtitle: 'Tons grafite equilibrados', swatches: ['#1e293b', '#475569', '#94a3b8'] },
  navy: { title: 'Navy', subtitle: 'Azul corporativo para executivo', swatches: ['#0b1739', '#1d4ed8', '#60a5fa'] },
  sand: { title: 'Sand', subtitle: 'Paleta quente e suave', swatches: ['#fffbeb', '#f59e0b', '#b45309'] },
  charcoal: { title: 'Charcoal', subtitle: 'Cinza carvão discreto', swatches: ['#111827', '#374151', '#9ca3af'] },
  midnight: { title: 'Midnight', subtitle: 'Noite profunda com brilho frio', swatches: ['#020617', '#1e3a8a', '#22d3ee'] },
  metro: { title: 'Metro', subtitle: 'Estilo urbano e direto', swatches: ['#0f172a', '#0ea5e9', '#14b8a6'] },
  aero: { title: 'Aero', subtitle: 'Leve e vibrante com azul claro', swatches: ['#e0f2fe', '#38bdf8', '#0ea5e9'] },
};

const ARTIFACT_THEME_FX_META: Record<string, { title: string; subtitle: string }> = {
  orbital: { title: 'Orbital FX', subtitle: 'Gradiente espacial com brilho ciano' },
  blueprint: { title: 'Blueprint FX', subtitle: 'Estética técnica em azul profundo' },
  aurora: { title: 'Aurora FX', subtitle: 'Mistura viva com tons iridescentes' },
  'matrix-glass': { title: 'Matrix Glass FX', subtitle: 'Vidro escuro com energia neon' },
  'matrix-glass-mono': { title: 'Matrix Mono FX', subtitle: 'Versão monocromática de alto contraste' },
  'matrix-glass-light': { title: 'Matrix Light FX', subtitle: 'Vidro claro com acentos fortes' },
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

const ARTIFACT_THEME_FX_PRESETS: Record<string, {
  backgroundPreset?: string;
  cardStylePreset?: string;
  borderPreset?: string;
  borderColor?: string;
  frameBaseColor?: string;
  frameCornerColor?: string;
  surface?: string;
  h1Color?: string;
  kpiTitleColor?: string;
  kpiValueColor?: string;
  slicerLabelColor?: string;
  slicerOptionColor?: string;
  colorScheme?: string[];
}> = {
  none: { backgroundPreset: undefined, cardStylePreset: 'default', borderPreset: 'hud_classic' },
  orbital: {
    backgroundPreset: 'orbital',
    cardStylePreset: 'glass-dark',
    borderPreset: 'hud_classic',
    borderColor: '#1f2937',
    frameBaseColor: '#1f2937',
    frameCornerColor: '#22d3ee',
    surface: '#0b1114',
    h1Color: '#eaf2f7',
    kpiTitleColor: '#c7d2de',
    kpiValueColor: '#f8fafc',
    slicerLabelColor: '#c7d2de',
    slicerOptionColor: '#eaf2f7',
    colorScheme: ['#22d3ee', '#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#f59e0b'],
  },
  blueprint: {
    backgroundPreset: 'blueprint',
    cardStylePreset: 'glass-dark',
    borderPreset: 'hud_classic',
    borderColor: '#20334a',
    frameBaseColor: '#22384f',
    frameCornerColor: '#38bdf8',
    surface: '#08131f',
    h1Color: '#e7f4ff',
    kpiTitleColor: '#bad6eb',
    kpiValueColor: '#f5fbff',
    slicerLabelColor: '#bad6eb',
    slicerOptionColor: '#e7f4ff',
    colorScheme: ['#38bdf8', '#0ea5e9', '#3b82f6', '#22d3ee', '#a78bfa', '#34d399'],
  },
  aurora: {
    backgroundPreset: 'aurora',
    cardStylePreset: 'glass-dark',
    borderPreset: 'soft_card',
    borderColor: '#2a3342',
    surface: '#0d1118',
    h1Color: '#edf2fb',
    kpiTitleColor: '#c7d2e1',
    kpiValueColor: '#ffffff',
    slicerLabelColor: '#c7d2e1',
    slicerOptionColor: '#edf2fb',
    colorScheme: ['#10b981', '#3b82f6', '#a855f7', '#22d3ee', '#f472b6', '#f59e0b'],
  },
  'matrix-glass': {
    backgroundPreset: 'matrix-glass',
    cardStylePreset: 'glass-dark',
    borderPreset: 'hud_classic',
    borderColor: '#2a2f3a',
    frameBaseColor: '#2a2f3a',
    frameCornerColor: '#8b5cf6',
    surface: '#0c0f15',
    h1Color: '#eef2f7',
    kpiTitleColor: '#cbd5e1',
    kpiValueColor: '#ffffff',
    slicerLabelColor: '#cbd5e1',
    slicerOptionColor: '#eef2f7',
    colorScheme: ['#8b5cf6', '#ec4899', '#10b981', '#60a5fa', '#22d3ee', '#f59e0b'],
  },
  'matrix-glass-mono': {
    backgroundPreset: 'matrix-glass-mono',
    cardStylePreset: 'glass-dark',
    borderPreset: 'hud_classic',
    borderColor: '#1f2937',
    frameBaseColor: '#1f2937',
    frameCornerColor: '#34d399',
    surface: '#0b1114',
    h1Color: '#eaf2f7',
    kpiTitleColor: '#c7d2de',
    kpiValueColor: '#f8fafc',
    slicerLabelColor: '#c7d2de',
    slicerOptionColor: '#eaf2f7',
    colorScheme: ['#34d399', '#10b981', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'],
  },
  'matrix-glass-light': {
    backgroundPreset: 'matrix-glass-light',
    cardStylePreset: 'glass-light',
    borderPreset: 'hud_classic',
    borderColor: '#94a3b8',
    frameBaseColor: '#cbd5e1',
    frameCornerColor: '#2563eb',
    surface: '#ffffff',
    h1Color: '#0f172a',
    kpiTitleColor: '#475569',
    kpiValueColor: '#0f172a',
    slicerLabelColor: '#475569',
    slicerOptionColor: '#0f172a',
    colorScheme: ['#2563eb', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'],
  },
};

const ARTIFACT_THEME_FX_OPTIONS = [
  { value: 'custom', label: '(custom)' },
  { value: 'none', label: 'Nenhum' },
  ...DASHBOARD_BACKGROUND_PRESET_OPTIONS
    .filter((o) => ['orbital', 'blueprint', 'aurora', 'matrix-glass', 'matrix-glass-mono', 'matrix-glass-light'].includes(o.value))
    .map((o) => ({ value: o.value, label: o.label })),
];
const ARTIFACT_THEME_FX_DEFAULT_THEME: Record<string, string> = {
  orbital: 'midnight',
  blueprint: 'navy',
  aurora: 'dark',
  'matrix-glass': 'black',
  'matrix-glass-mono': 'black',
  'matrix-glass-light': 'light',
};

function buildSwatchBackground(swatches: string[]): string {
  const palette = swatches.filter(Boolean).slice(0, 3);
  if (palette.length === 0) return '#cbd5e1';
  if (palette.length === 1) return palette[0];
  if (palette.length === 2) {
    return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[0]} 50%, ${palette[1]} 50%, ${palette[1]} 100%)`;
  }
  return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)`;
}

export default function HeaderActions({ chatId }: HeaderActionsProps) {
  const previewPath = useStore($previewJsonrPath);
  const artifactNotifications = useStore($artifactNotifications);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [themeName, setThemeName] = React.useState<string>('light');
  const [headerTheme, setHeaderTheme] = React.useState<string>('');
  const [themeFxPreset, setThemeFxPreset] = React.useState<string>('custom');
  const [colorPreset, setColorPreset] = React.useState<string>('custom');
  const [borderPreset, setBorderPreset] = React.useState<string>('custom');
  const [error, setError] = React.useState<string | null>(null);
  const [snapshotSaving, setSnapshotSaving] = React.useState(false);
  const [snapshotStatus, setSnapshotStatus] = React.useState<string | null>(null);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const allThemeOptions = React.useMemo(
    () => [
      ...APPS_THEME_OPTIONS,
      ...ARTIFACT_THEME_FX_OPTIONS
        .filter((opt) => opt.value !== 'custom' && opt.value !== 'none')
        .map((opt) => ({ value: `fx:${opt.value}`, label: `${opt.label} (FX)` })),
    ],
    []
  );
  const selectedThemeOption = React.useMemo(
    () => (themeFxPreset !== 'custom' && themeFxPreset !== 'none' ? `fx:${themeFxPreset}` : themeName),
    [themeFxPreset, themeName]
  );
  const themeVisualOptions = React.useMemo(() => {
    return allThemeOptions.map((opt) => {
      if (opt.value.startsWith('fx:')) {
        const fxKey = opt.value.slice(3);
        const fxMeta = ARTIFACT_THEME_FX_META[fxKey] || {
          title: opt.label.replace(/\s*\(FX\)\s*$/i, ''),
          subtitle: 'Preset visual avançado',
        };
        const swatches = ARTIFACT_THEME_FX_PRESETS[fxKey]?.colorScheme?.slice(0, 3) || ['#64748b', '#334155', '#0f172a'];
        return { ...opt, ...fxMeta, swatches };
      }
      const baseMeta = ARTIFACT_THEME_BASE_META[opt.value] || {
        title: opt.label,
        subtitle: 'Tema base do dashboard',
        swatches: ['#e2e8f0', '#94a3b8', '#64748b'],
      };
      return { ...opt, ...baseMeta };
    });
  }, [allThemeOptions]);
  const unreadCount = React.useMemo(
    () => artifactNotifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    [artifactNotifications]
  );

  React.useEffect(() => {
    if (!notifOpen) return;
    sandboxActions.markArtifactNotificationsRead();
  }, [notifOpen]);

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

  const themeFxToPreset = React.useCallback((managersRaw?: any): string => {
    const m = managersRaw && typeof managersRaw === 'object' ? managersRaw : {};
    const bg = String(m.backgroundPreset ?? '');
    const card = String(m.cardStylePreset ?? 'default');
    const borderPreset = borderToPreset(m.border);
    for (const [key, preset] of Object.entries(ARTIFACT_THEME_FX_PRESETS)) {
      const presetBg = String(preset.backgroundPreset ?? '');
      const presetCard = String(preset.cardStylePreset ?? 'default');
      if (bg !== presetBg || card !== presetCard) continue;
      if (preset.borderPreset && borderPreset !== preset.borderPreset) continue;
      return key;
    }
    return 'custom';
  }, [borderToPreset]);

  const applyBorderPresetToTheme = React.useCallback((theme: any, presetKey: string) => {
    const preset = ARTIFACT_BORDER_PRESETS[presetKey];
    if (!preset) return;
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
  }, []);

  const applyThemeFxPresetToTheme = React.useCallback((theme: any, presetKey: string) => {
    const preset = ARTIFACT_THEME_FX_PRESETS[presetKey];
    theme.props.managers = theme.props.managers && typeof theme.props.managers === 'object' ? theme.props.managers : {};
    const m = theme.props.managers;

    if (!preset) {
      if (presetKey && presetKey !== 'none') m.backgroundPreset = presetKey;
      else delete m.backgroundPreset;
      return;
    }

    if (preset.backgroundPreset && preset.backgroundPreset !== 'none') m.backgroundPreset = preset.backgroundPreset;
    else delete m.backgroundPreset;

    if (preset.cardStylePreset && preset.cardStylePreset !== 'default') m.cardStylePreset = preset.cardStylePreset;
    else delete m.cardStylePreset;

    if (preset.surface) m.surface = preset.surface;
    else delete m.surface;

    if (preset.borderPreset) applyBorderPresetToTheme(theme, preset.borderPreset);

    m.border = m.border && typeof m.border === 'object' ? m.border : {};
    if (preset.borderColor) m.border.color = preset.borderColor;
    else delete m.border.color;

    m.border.frame = m.border.frame && typeof m.border.frame === 'object' ? m.border.frame : {};
    if (preset.frameBaseColor) m.border.frame.baseColor = preset.frameBaseColor;
    else delete m.border.frame.baseColor;
    if (preset.frameCornerColor) m.border.frame.cornerColor = preset.frameCornerColor;
    else delete m.border.frame.cornerColor;

    m.h1 = m.h1 && typeof m.h1 === 'object' ? m.h1 : {};
    if (preset.h1Color) m.h1.color = preset.h1Color;
    else delete m.h1.color;

    m.kpi = m.kpi && typeof m.kpi === 'object' ? m.kpi : {};
    m.kpi.title = m.kpi.title && typeof m.kpi.title === 'object' ? m.kpi.title : {};
    m.kpi.value = m.kpi.value && typeof m.kpi.value === 'object' ? m.kpi.value : {};
    if (preset.kpiTitleColor) m.kpi.title.color = preset.kpiTitleColor;
    else delete m.kpi.title.color;
    if (preset.kpiValueColor) m.kpi.value.color = preset.kpiValueColor;
    else delete m.kpi.value.color;

    m.slicer = m.slicer && typeof m.slicer === 'object' ? m.slicer : {};
    m.slicer.label = m.slicer.label && typeof m.slicer.label === 'object' ? m.slicer.label : {};
    m.slicer.option = m.slicer.option && typeof m.slicer.option === 'object' ? m.slicer.option : {};
    if (preset.slicerLabelColor) m.slicer.label.color = preset.slicerLabelColor;
    else delete m.slicer.label.color;
    if (preset.slicerOptionColor) m.slicer.option.color = preset.slicerOptionColor;
    else delete m.slicer.option.color;

    m.color = m.color && typeof m.color === 'object' ? m.color : {};
    if (preset.colorScheme) m.color.scheme = preset.colorScheme;
    else delete m.color.scheme;
  }, [applyBorderPresetToTheme]);

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
      setThemeFxPreset(themeFxToPreset(managers));
      setColorPreset(schemeToPreset(scheme));
      setBorderPreset(borderToPreset(managers?.border));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Erro ao carregar tema');
    } finally {
      setLoading(false);
    }
  }, [borderToPreset, chatId, previewPath, schemeToPreset, themeFxToPreset]);

  React.useEffect(() => {
    if (!open) return;
    void readCurrent();
  }, [open, readCurrent]);

  const persist = React.useCallback(
    async (next: { name?: string; headerTheme?: string; themeFxPreset?: string; colorPreset?: string; borderPreset?: string }) => {
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
        if (typeof next.themeFxPreset === 'string' && next.themeFxPreset !== 'custom') {
          applyThemeFxPresetToTheme(theme, next.themeFxPreset);
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
        setThemeFxPreset(themeFxToPreset(theme.props?.managers));
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
    [applyThemeFxPresetToTheme, borderToPreset, chatId, previewPath, schemeToPreset, themeFxToPreset]
  );

  const saveSnapshot = React.useCallback(async () => {
    if (!chatId) {
      setSnapshotStatus('Chat ausente');
      return;
    }
    setSnapshotSaving(true);
    setSnapshotStatus(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-snapshot', chatId }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; snapshotId?: string };
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Falha ao salvar snapshot');
      setSnapshotStatus('Snapshot salvo');
      if (typeof window !== 'undefined') {
        window.setTimeout(() => setSnapshotStatus((curr) => (curr === 'Snapshot salvo' ? null : curr)), 1800);
      }
    } catch (e: any) {
      setSnapshotStatus(e?.message ? String(e.message) : 'Erro ao salvar snapshot');
    } finally {
      setSnapshotSaving(false);
    }
  }, [chatId]);

  const refreshPreview = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('sandbox-preview-refresh', { detail: { path: previewPath } }));
  }, [previewPath]);

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
              <div className="w-full rounded-md border border-slate-300 bg-white max-h-56 overflow-y-auto">
                {themeVisualOptions.map((opt) => {
                  const selected = selectedThemeOption === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={loading || !chatId || !previewPath}
                      className={`w-full px-2 py-1.5 inline-flex items-center gap-2 border-b last:border-b-0 border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        selected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                      }`}
                      onClick={() => {
                        const next = opt.value;
                        if (next.startsWith('fx:')) {
                          const fx = next.slice(3);
                          const baseTheme = ARTIFACT_THEME_FX_DEFAULT_THEME[fx] || themeName || 'dark';
                          setThemeName(baseTheme);
                          setThemeFxPreset(fx);
                          void persist({ name: baseTheme, themeFxPreset: fx });
                          return;
                        }
                        setThemeName(next);
                        setThemeFxPreset('none');
                        void persist({ name: next, themeFxPreset: 'none' });
                      }}
                    >
                      <span
                        className="h-8 w-8 rounded-md border border-slate-200 shrink-0"
                        style={{ background: buildSwatchBackground(opt.swatches) }}
                      />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block text-xs font-medium text-slate-800 truncate">{opt.title}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{opt.subtitle}</span>
                      </span>
                      {selected ? <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
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
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="relative h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Notificações do Artifact"
            title="Notificações do Artifact"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] leading-4 text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <DialogTitle>Notificações do Artifact</DialogTitle>
                <DialogDescription>
                  {artifactNotifications.length > 0
                    ? `${artifactNotifications.length} erro(s)/aviso(s) do preview`
                    : 'Nenhum erro registrado no Artifact'}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => sandboxActions.clearArtifactNotifications()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                disabled={artifactNotifications.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            </div>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {artifactNotifications.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-500">
                Sem notificações no momento.
              </div>
            ) : artifactNotifications.map((n) => (
              <div key={n.id} className="rounded-md border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {n.source === 'preview' ? 'Preview' : n.source === 'paths' ? 'Arquivos' : n.source === 'theme' ? 'Tema' : 'Snapshot'}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{n.message}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <IconButton title="Atualizar preview" onClick={refreshPreview} disabled={!previewPath}>
        <RefreshCw className="w-4 h-4" />
      </IconButton>
      <IconButton title="Upload">
        <Upload className="w-4 h-4" />
      </IconButton>
      <IconButton title={snapshotSaving ? "Salvando snapshot..." : "Salvar snapshot"} onClick={() => { void saveSnapshot(); }} disabled={!chatId || snapshotSaving}>
        <Save className={`w-4 h-4 ${snapshotSaving ? 'animate-pulse' : ''}`} />
      </IconButton>
      {snapshotStatus && (
        <span className={`ml-1 text-[11px] ${snapshotStatus === 'Snapshot salvo' ? 'text-emerald-700' : 'text-rose-600'}`}>
          {snapshotStatus}
        </span>
      )}
      {/* Deploy button removido */}
    </div>
  );
}
