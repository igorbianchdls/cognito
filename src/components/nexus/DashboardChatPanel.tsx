'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useStore as useNanoStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import { BackgroundManager, type BackgroundPresetKey } from '@/components/visual-builder/BackgroundManager';
// Removed ColorManager palette UI
import { FontManager, type FontPresetKey, type FontSizeKey } from '@/components/visual-builder/FontManager';
import {
  Artifact,
  ArtifactHeader,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Palette, Check, Type, Square, Monitor, Tablet, Smartphone, ChevronDown, Layout, Save } from 'lucide-react';
import DashboardSaveDialog from '@/components/visual-builder/DashboardSaveDialog';
import { BorderManager, type BorderPresetKey } from '@/components/visual-builder/BorderManager';
import { $headerUi, headerUiActions } from '@/stores/ui/headerUiStore';
import { dashboardsApi, type Dashboard } from '@/stores/dashboardsStore';

export default function DashboardChatPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const headerUi = useNanoStore($headerUi);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('dashboard');
  const [selectedViewport, setSelectedViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedDashboard, setSelectedDashboard] = useState('Dashboard Builder');
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('branco');
  const [selectedFont, setSelectedFont] = useState<FontPresetKey>('barlow');
  const [selectedFontSize, setSelectedFontSize] = useState<FontSizeKey>('lg');
  const [selectedLetterSpacing, setSelectedLetterSpacing] = useState<number>(-0.02);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundPresetKey>('fundo-branco');
  // Colors section states
  const [dashboardBgColor, setDashboardBgColor] = useState<string>('#171717');
  const [cardsBgColor, setCardsBgColor] = useState<string>('#1B1B1B');
  const [chartTitleColor, setChartTitleColor] = useState<string>('#ffffff');
  const [kpiValueColor, setKpiValueColor] = useState<string>('#ffffff');
  const [kpiTitleColor, setKpiTitleColor] = useState<string>('#d1d5db');
  const [selectedBorderType, setSelectedBorderType] = useState<BorderPresetKey>('suave');
  const [borderColor, setBorderColor] = useState<string>('#e5e7eb');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [borderAccentColor, setBorderAccentColor] = useState<string>('#bbb');
  const [borderShadow, setBorderShadow] = useState<boolean>(true);
  // Removed corporate color state (palette UI disabled)
  const visualBuilderState = useNanoStore($visualBuilderState);
  const [showSave, setShowSave] = useState(false);
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [dashboardMeta, setDashboardMeta] = useState<{ title: string; description: string | null } | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashListOpen, setDashListOpen] = useState(false);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [dashboardsLoading, setDashboardsLoading] = useState(false);
  const [dashboardsError, setDashboardsError] = useState<string | null>(null);
  // Update (PUT) states
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateOk, setUpdateOk] = useState(false);

  // Helpers: detect DSL vs JSON
  const isDsl = (code: string) => code.trim().startsWith('<');

  // Parse <style> JSON from DSL
  const readStyleFromDsl = (dsl: string): Record<string, unknown> | null => {
    const m = dsl.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
    if (!m || !m[1]) return null;
    try { return JSON.parse(m[1].trim()) as Record<string, unknown>; } catch { return null; }
  };

  // Ensure <style>{}</style> exists right after <dashboard ...>
  const ensureStyleBlock = (dsl: string): string => {
    if (/<style\b[^>]*>[\s\S]*?<\/style>/i.test(dsl)) return dsl;
    const dashOpen = dsl.match(/<dashboard\b[^>]*>/i);
    if (!dashOpen || dashOpen.index === undefined) return dsl;
    const insertAt = dashOpen.index + dashOpen[0].length;
    const prefix = dsl.slice(0, insertAt);
    const suffix = dsl.slice(insertAt);
    const block = `\n  <style>{}\n  </style>`;
    return prefix + block + suffix;
  };

  // Update <style> JSON with partial keys
  const writeStyleToDsl = (dsl: string, partial: Record<string, unknown>): string => {
    let next = ensureStyleBlock(dsl);
    const re = /<style\b[^>]*>([\s\S]*?)<\/style>/i;
    const m = next.match(re);
    if (!m || m.index === undefined) return dsl;
    let current: Record<string, unknown> = {};
    try { current = m[1] ? JSON.parse(m[1].trim()) : {}; } catch { current = {}; }
    const updated = { ...current, ...partial };
    const json = JSON.stringify(updated, null, 2);
    const replacement = `<style>\n${json}\n</style>`;
    next = next.replace(re, replacement);
    return next;
  };

  // Parse theme name from code (JSON or DSL)
  const getThemeFromCode = (code: string): ThemeName | undefined => {
    if (!code) return undefined;
    if (isDsl(code)) {
      const style = readStyleFromDsl(code);
      if (style && typeof style['theme'] === 'string' && ThemeManager.isValidTheme(style['theme'] as string)) return style['theme'] as ThemeName;
      const m = code.match(/<dashboard\b[^>]*\btheme=\"([^\"]+)\"/i);
      if (m && m[1] && ThemeManager.isValidTheme(m[1])) return m[1] as ThemeName;
      return undefined;
    }
    try {
      const cfg = JSON.parse(code) as { theme?: string };
      return cfg.theme && ThemeManager.isValidTheme(cfg.theme) ? (cfg.theme as ThemeName) : undefined;
    } catch { return undefined; }
  };

  // Update <config> JSON for all widgets in DSL
  const updateWidgetsInDsl = (dsl: string, updater: (cfg: Record<string, unknown>, attrs: Record<string, string>) => Record<string, unknown> | null): string => {
    const parseAttrs = (s: string): Record<string, string> => {
      const map: Record<string, string> = {};
      for (const m of s.matchAll(/(\w[\w-]*)\s*=\s*\"([^\"]*)\"/g)) { map[m[1]] = m[2]; }
      return map;
    };
    const pairRe = /<widget\b([^>]*)>([\s\S]*?)<\/widget>/gi;
    return dsl.replace(pairRe, (full, attrsStr: string, inner: string) => {
      const attrs = parseAttrs(attrsStr || '');
      const cfgMatch = inner.match(/<config\b[^>]*>([\s\S]*?)<\/config>/i);
      if (!cfgMatch || cfgMatch.index === undefined) {
        // no config -> no update
        return full;
      }
      const before = inner.slice(0, cfgMatch.index);
      const after = inner.slice(cfgMatch.index + cfgMatch[0].length);
      let cfg: Record<string, unknown> = {};
      try { cfg = JSON.parse((cfgMatch[1] || '').trim()); } catch { return full; }
      const nextCfg = updater(cfg, attrs);
      if (!nextCfg) return full;
      const newInner = `${before}<config>${JSON.stringify(nextCfg, null, 2)}</config>${after}`;
      return `<widget${attrsStr}>${newInner}</widget>`;
    });
  };

  // Available backgrounds
  const availableBackgrounds = BackgroundManager.getAvailableBackgrounds();
  // Removed unused theme preview

  // Color palette UI removed

  // Available fonts and sizes from FontManager
  const availableFonts = FontManager.getAvailableFonts();
  const availableFontSizes = FontManager.getAvailableFontSizes();
  const [chartBodyFontFamily, setChartBodyFontFamily] = useState<FontPresetKey>('geist');
  const [chartBodyTextColor, setChartBodyTextColor] = useState<string>('#6b7280');

  // Header tooltip without nested template literals
  // Removed unused header tooltip

  // Initialize store on mount
  useEffect(() => {
    visualBuilderActions.initialize();
  }, []);

  // Sync UI selectors from DSL <style> when code is DSL
  useEffect(() => {
    const code = visualBuilderState.code;
    if (!isDsl(code)) return;
    const style = readStyleFromDsl(code);
    if (style) {
      const st = style as Record<string, unknown>;
      const theme = st['theme'];
      if (typeof theme === 'string' && ThemeManager.isValidTheme(theme)) setSelectedTheme(theme as ThemeName);
      const cf = st['customFont'];
      if (typeof cf === 'string' && FontManager.isValidFont(cf)) setSelectedFont(cf as FontPresetKey);
      const cfs = st['customFontSize'];
      if (typeof cfs === 'string' && FontManager.isValidFontSize(cfs)) setSelectedFontSize(cfs as FontSizeKey);
      const ls = st['customLetterSpacing'];
      if (typeof ls === 'number') setSelectedLetterSpacing(ls);
      const bg = st['customBackground'];
      if (typeof bg === 'string' && BackgroundManager.isValidBackground(bg)) setSelectedBackground(bg as BackgroundPresetKey);
      const bt = st['borderType'];
      if (typeof bt === 'string' && BorderManager.isValid(bt)) setSelectedBorderType(bt as BorderPresetKey);
      if (typeof st['borderColor'] === 'string') setBorderColor(st['borderColor'] as string);
      if (typeof st['borderWidth'] === 'number') setBorderWidth(st['borderWidth'] as number);
      if (typeof st['borderRadius'] === 'number') setBorderRadius(st['borderRadius'] as number);
      if (typeof st['borderAccentColor'] === 'string') setBorderAccentColor(st['borderAccentColor'] as string);
      if (typeof st['borderShadow'] === 'boolean') setBorderShadow(st['borderShadow'] as boolean);
      if (typeof st['backgroundColor'] === 'string') setDashboardBgColor(st['backgroundColor'] as string);
      if (typeof st['customChartTextColor'] === 'string') setChartBodyTextColor(st['customChartTextColor'] as string);
      const cbf = st['customChartFontFamily'];
      if (typeof cbf === 'string' && FontManager.isValidFont(cbf)) setChartBodyFontFamily(cbf as FontPresetKey);
    }
  }, [visualBuilderState.code]);

  // Derive dashboardId from URL query (?dashboardId=... or ?dashboard=...)
  useEffect(() => {
    const fromQuery = searchParams?.get('dashboardId') || searchParams?.get('dashboard');
    if (fromQuery && fromQuery !== dashboardId) {
      setDashboardId(fromQuery);
    }
  }, [searchParams, dashboardId]);

  // Load dashboard meta and sourcecode when dashboardId changes
  useEffect(() => {
    const load = async (id: string) => {
      setLoadingDashboard(true);
      setDashboardError(null);
      try {
        const { item } = await dashboardsApi.get(id);
        // Update header meta
        setDashboardMeta({ title: item.title, description: item.description ?? null });
        // Reflect fetched code into editor/renderer
        if (item.sourcecode) {
          visualBuilderActions.updateCode(item.sourcecode);
        }
        // Update dropdown label for now
        setSelectedDashboard(item.title);
      } catch (e) {
        setDashboardError((e as Error).message || 'Falha ao carregar dashboard');
      } finally {
        setLoadingDashboard(false);
      }
    };
    if (dashboardId) load(dashboardId);
  }, [dashboardId]);

  // Load dashboards list when dropdown opens
  useEffect(() => {
    const loadList = async () => {
      setDashboardsLoading(true);
      setDashboardsError(null);
      try {
        const res = await dashboardsApi.list({ limit: 50 });
        setDashboards(res.items);
      } catch (e) {
        setDashboardsError((e as Error).message || 'Falha ao listar dashboards');
      } finally {
        setDashboardsLoading(false);
      }
    };
    if (dashListOpen) loadList();
  }, [dashListOpen]);

  const selectDashboard = (id: string, title?: string) => {
    setDashboardId(id);
    if (title) setSelectedDashboard(title);
    // Persist in URL for refreshes
    try {
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set('dashboardId', id);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    } catch {}
    setDashListOpen(false);
  };

  const handleUpdate = async () => {
    if (!dashboardId) {
      // Se não há dashboard, abra o diálogo de salvar (CREATE)
      setShowSave(true);
      return;
    }
    setUpdating(true);
    setUpdateOk(false);
    setUpdateError(null);
    try {
      const { item } = await dashboardsApi.update(dashboardId, { sourcecode: visualBuilderState.code });
      if (item?.id) {
        setUpdateOk(true);
        // feedback temporário
        setTimeout(() => setUpdateOk(false), 2000);
      }
    } catch (e) {
      setUpdateError((e as Error).message || 'Falha ao atualizar');
    } finally {
      setUpdating(false);
    }
  };

  // Detect current theme from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      if (config.theme && ThemeManager.isValidTheme(config.theme)) {
        setSelectedTheme(config.theme);
      }
    } catch {
      // Invalid JSON, keep current theme
    }
  }, [visualBuilderState.code]);

  

  // Detect current font from code and initialize based on theme
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If custom font is set, use it
      if (config.customFont && FontManager.isValidFont(config.customFont)) {
        setSelectedFont(config.customFont);
      } else if (config.theme) {
        // Otherwise, use theme default font from FontManager
        setSelectedFont(FontManager.getThemeDefaultFont(config.theme));
      }
    } catch {
      // Invalid JSON, keep current font
    }
  }, [visualBuilderState.code]);

  // Detect current font size from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If custom font size is set, use it
      if (config.customFontSize && FontManager.isValidFontSize(config.customFontSize)) {
        setSelectedFontSize(config.customFontSize);
      } else {
        // Otherwise, use default font size
        setSelectedFontSize(FontManager.getDefaultFontSize());
      }
    } catch {
      // Invalid JSON, keep current font size
    }
  }, [visualBuilderState.code]);

  // Detect current letter spacing from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      if (typeof config.customLetterSpacing === 'number') {
        setSelectedLetterSpacing(config.customLetterSpacing);
      } else {
        setSelectedLetterSpacing(-0.02);
      }
    } catch {
      // keep current spacing
    }
  }, [visualBuilderState.code]);

  // Detect current chart body font/color from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      if (config.customChartFontFamily && FontManager.isValidFont(config.customChartFontFamily)) {
        setChartBodyFontFamily(config.customChartFontFamily);
      }
      if (typeof config.customChartTextColor === 'string') {
        setChartBodyTextColor(config.customChartTextColor);
      }
    } catch {}
  }, [visualBuilderState.code]);

  // Detect current background from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If custom background is set, use it
      if (config.customBackground && BackgroundManager.isValidBackground(config.customBackground)) {
        setSelectedBackground(config.customBackground);
      } else {
        // Default background
        setSelectedBackground(BackgroundManager.getDefaultBackground());
      }
      // Dashboard background color (raw)
      if (config.config && typeof config.config.backgroundColor === 'string') {
        setDashboardBgColor(config.config.backgroundColor);
      }
    } catch {
      // Invalid JSON, keep current background
    }
  }, [visualBuilderState.code]);

  // Detect current border from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      if (config.borderType && BorderManager.isValid(config.borderType)) setSelectedBorderType(config.borderType)
      if (typeof config.borderColor === 'string') setBorderColor(config.borderColor)
      if (typeof config.borderWidth === 'number') setBorderWidth(config.borderWidth)
      if (typeof config.borderRadius === 'number') setBorderRadius(config.borderRadius)
      if (typeof config.borderAccentColor === 'string') setBorderAccentColor(config.borderAccentColor)
      if (typeof config.borderShadow === 'boolean') setBorderShadow(config.borderShadow)
    } catch {}
  }, [visualBuilderState.code])

  // Removed corporate color detection (palette UI disabled)

  const handleCodeChange = (newCode: string) => {
    visualBuilderActions.updateCode(newCode);
  };

  // Removed unused handleLayoutChange; pass action directly where needed

  const handleThemeChange = (themeName: ThemeName) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { theme: themeName });
        visualBuilderActions.updateCode(next);
      } else {
        const currentConfig = JSON.parse(code);
        const updatedConfig = { ...currentConfig, theme: themeName };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setSelectedTheme(themeName);

      console.log(`🎨 Theme changed to: ${themeName}`);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const handleFontChange = (fontKey: FontPresetKey) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { customFont: fontKey });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, customFont: fontKey };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setSelectedFont(fontKey);
      console.log('🎨 Font changed to:', fontKey);
    } catch (error) {
      console.error('Error updating font:', error);
    }
  };

  const handleFontSizeChange = (sizeKey: FontSizeKey) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { customFontSize: sizeKey });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, customFontSize: sizeKey };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setSelectedFontSize(sizeKey);
      console.log('🎨 Font size changed to:', sizeKey, `(${FontManager.getFontSizeValue(sizeKey)}px)`);
    } catch (error) {
      console.error('Error updating font size:', error);
    }
  };

  // Colors handlers
  const handleDashboardBgColorChange = (color: string) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { backgroundColor: color });
        visualBuilderActions.updateCode(next);
      } else {
        const cfg = JSON.parse(code);
        const updated = { ...cfg, config: { ...(cfg.config || {}), backgroundColor: color, backgroundGradient: undefined } };
        visualBuilderActions.updateCode(JSON.stringify(updated, null, 2));
      }
      setDashboardBgColor(color);
    } catch (e) {
      console.error('Error updating dashboard background color', e);
    }
  };

  // Update helpers per widget type (typed, without any)
  const setChartContainerBg = (widget: Widget, color: string): Widget => {
    const w = { ...widget };
    switch (w.type) {
      case 'bar':
        {
          const prev = (w.barConfig?.styling ?? {}) as unknown as import('@/stores/apps/barChartStore').BarChartConfig['styling'];
          w.barConfig = {
            ...(w.barConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/barChartStore').BarChartConfig['styling']
          };
        }
        break;
      case 'line':
        {
          const prev = (w.lineConfig?.styling ?? {}) as unknown as import('@/stores/apps/lineChartStore').LineChartConfig['styling'];
          w.lineConfig = {
            ...(w.lineConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/lineChartStore').LineChartConfig['styling']
          };
        }
        break;
      case 'pie':
        {
          const prev = (w.pieConfig?.styling ?? {}) as unknown as import('@/stores/apps/pieChartStore').PieChartConfig['styling'];
          w.pieConfig = {
            ...(w.pieConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/pieChartStore').PieChartConfig['styling']
          };
        }
        break;
      case 'area':
        {
          const prev = (w.areaConfig?.styling ?? {}) as unknown as import('@/stores/apps/areaChartStore').AreaChartConfig['styling'];
          w.areaConfig = {
            ...(w.areaConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/areaChartStore').AreaChartConfig['styling']
          };
        }
        break;
      case 'stackedbar':
        {
          const prev = (w.stackedBarConfig?.styling ?? {}) as unknown as import('@/stores/apps/stackedBarChartStore').StackedBarChartConfig['styling'];
          w.stackedBarConfig = {
            ...(w.stackedBarConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/stackedBarChartStore').StackedBarChartConfig['styling']
          };
        }
        break;
      case 'groupedbar':
        {
          const prev = (w.groupedBarConfig?.styling ?? {}) as unknown as import('@/stores/apps/groupedBarChartStore').GroupedBarChartConfig['styling'];
          w.groupedBarConfig = {
            ...(w.groupedBarConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/groupedBarChartStore').GroupedBarChartConfig['styling']
          };
        }
        break;
      case 'stackedlines':
        {
          const prev = (w.stackedLinesConfig?.styling ?? {}) as unknown as import('@/stores/apps/stackedLinesChartStore').StackedLinesChartConfig['styling'];
          w.stackedLinesConfig = {
            ...(w.stackedLinesConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/stackedLinesChartStore').StackedLinesChartConfig['styling']
          };
        }
        break;
      case 'radialstacked':
        {
          const prev = (w.radialStackedConfig?.styling ?? {}) as unknown as import('@/stores/apps/radialStackedChartStore').RadialStackedChartConfig['styling'];
          w.radialStackedConfig = {
            ...(w.radialStackedConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/radialStackedChartStore').RadialStackedChartConfig['styling']
          };
        }
        break;
      case 'pivotbar':
        {
          const prev = (w.pivotBarConfig?.styling ?? {}) as unknown as import('@/stores/apps/pivotBarChartStore').PivotBarChartConfig['styling'];
          w.pivotBarConfig = {
            ...(w.pivotBarConfig || {}),
            styling: { ...prev, containerBackground: color } as unknown as import('@/stores/apps/pivotBarChartStore').PivotBarChartConfig['styling']
          };
        }
        break;
      case 'kpi':
        w.kpiConfig = { ...(w.kpiConfig || {}), kpiContainerBackgroundColor: color };
        break;
      default:
        break;
    }
    return w;
  };

  const setChartTitleCol = (widget: Widget, color: string): Widget => {
    const w = { ...widget };
    switch (w.type) {
      case 'bar':
        {
          const prev = (w.barConfig?.styling ?? {}) as unknown as import('@/stores/apps/barChartStore').BarChartConfig['styling'];
          w.barConfig = { ...(w.barConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/barChartStore').BarChartConfig['styling'] };
        }
        break;
      case 'line':
        {
          const prev = (w.lineConfig?.styling ?? {}) as unknown as import('@/stores/apps/lineChartStore').LineChartConfig['styling'];
          w.lineConfig = { ...(w.lineConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/lineChartStore').LineChartConfig['styling'] };
        }
        break;
      case 'pie':
        {
          const prev = (w.pieConfig?.styling ?? {}) as unknown as import('@/stores/apps/pieChartStore').PieChartConfig['styling'];
          w.pieConfig = { ...(w.pieConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/pieChartStore').PieChartConfig['styling'] };
        }
        break;
      case 'area':
        {
          const prev = (w.areaConfig?.styling ?? {}) as unknown as import('@/stores/apps/areaChartStore').AreaChartConfig['styling'];
          w.areaConfig = { ...(w.areaConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/areaChartStore').AreaChartConfig['styling'] };
        }
        break;
      case 'stackedbar':
        {
          const prev = (w.stackedBarConfig?.styling ?? {}) as unknown as import('@/stores/apps/stackedBarChartStore').StackedBarChartConfig['styling'];
          w.stackedBarConfig = { ...(w.stackedBarConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/stackedBarChartStore').StackedBarChartConfig['styling'] };
        }
        break;
      case 'groupedbar':
        {
          const prev = (w.groupedBarConfig?.styling ?? {}) as unknown as import('@/stores/apps/groupedBarChartStore').GroupedBarChartConfig['styling'];
          w.groupedBarConfig = { ...(w.groupedBarConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/groupedBarChartStore').GroupedBarChartConfig['styling'] };
        }
        break;
      case 'stackedlines':
        {
          const prev = (w.stackedLinesConfig?.styling ?? {}) as unknown as import('@/stores/apps/stackedLinesChartStore').StackedLinesChartConfig['styling'];
          w.stackedLinesConfig = { ...(w.stackedLinesConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/stackedLinesChartStore').StackedLinesChartConfig['styling'] };
        }
        break;
      case 'radialstacked':
        {
          const prev = (w.radialStackedConfig?.styling ?? {}) as unknown as import('@/stores/apps/radialStackedChartStore').RadialStackedChartConfig['styling'];
          w.radialStackedConfig = { ...(w.radialStackedConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/radialStackedChartStore').RadialStackedChartConfig['styling'] };
        }
        break;
      case 'pivotbar':
        {
          const prev = (w.pivotBarConfig?.styling ?? {}) as unknown as import('@/stores/apps/pivotBarChartStore').PivotBarChartConfig['styling'];
          w.pivotBarConfig = { ...(w.pivotBarConfig || {}), styling: { ...prev, titleColor: color } as unknown as import('@/stores/apps/pivotBarChartStore').PivotBarChartConfig['styling'] };
        }
        break;
    }
    return w;
  };

  const updateAllWidgets = (updater: (widget: Widget) => Widget) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = updateWidgetsInDsl(code, (cfgObj, attrs) => {
          // Build a pseudo widget object to reuse updater logic is complex; instead, map specific common cases
          // Determine type from attrs
          const type = (attrs['type'] || '').toLowerCase();
          type UpdateWidget = {
            type: Widget['type'];
            barConfig?: unknown; lineConfig?: unknown; pieConfig?: unknown; areaConfig?: unknown;
            stackedBarConfig?: unknown; groupedBarConfig?: unknown; stackedLinesConfig?: unknown; radialStackedConfig?: unknown; pivotBarConfig?: unknown;
            kpiConfig?: unknown;
          };
          const w: UpdateWidget = {
            type: type as Widget['type'],
            barConfig: (cfgObj as Record<string, unknown>)['barConfig'],
            lineConfig: (cfgObj as Record<string, unknown>)['lineConfig'],
            pieConfig: (cfgObj as Record<string, unknown>)['pieConfig'],
            areaConfig: (cfgObj as Record<string, unknown>)['areaConfig'],
            stackedBarConfig: (cfgObj as Record<string, unknown>)['stackedBarConfig'],
            groupedBarConfig: (cfgObj as Record<string, unknown>)['groupedBarConfig'],
            stackedLinesConfig: (cfgObj as Record<string, unknown>)['stackedLinesConfig'],
            radialStackedConfig: (cfgObj as Record<string, unknown>)['radialStackedConfig'],
            pivotBarConfig: (cfgObj as Record<string, unknown>)['pivotBarConfig'],
            kpiConfig: (cfgObj as Record<string, unknown>)['kpiConfig'],
          };
          const wUpdated = updater(w as unknown as Widget) as unknown;
          // Merge back into cfgObj
          const out: Record<string, unknown> = { ...cfgObj };
          const keys = ['barConfig','lineConfig','pieConfig','areaConfig','stackedBarConfig','groupedBarConfig','stackedLinesConfig','radialStackedConfig','pivotBarConfig','kpiConfig'] as const;
          const updatedMap = wUpdated as Record<string, unknown>;
          for (const k of keys) {
            const updatedVal = updatedMap[k as string];
            if (updatedVal !== undefined) out[k] = updatedVal;
          }
          return out;
        });
        visualBuilderActions.updateCode(next);
      } else {
        const cfg = JSON.parse(code);
        const widgets: Widget[] = (cfg.widgets || []).map((w: Widget) => updater(w));
        const updated = { ...cfg, widgets };
        visualBuilderActions.updateCode(JSON.stringify(updated, null, 2));
      }
    } catch (e) {
      console.error('Error updating widgets colors', e);
    }
  };

  const handleCardsBgColorChange = (color: string) => {
    setCardsBgColor(color);
    updateAllWidgets((widget) => setChartContainerBg(widget, color));
  };

  const handleChartTitleColorChange = (color: string) => {
    setChartTitleColor(color);
    updateAllWidgets((widget) => setChartTitleCol(widget, color));
  };

  const handleKpiValueColorChange = (color: string) => {
    setKpiValueColor(color);
    updateAllWidgets((widget) => {
      const w = { ...widget };
      if (w.type === 'kpi') {
        w.kpiConfig = { ...(w.kpiConfig || {}), kpiValueColor: color };
      }
      return w;
    });
  };

  const handleKpiTitleColorChange = (color: string) => {
    setKpiTitleColor(color);
    updateAllWidgets((widget) => {
      const w = { ...widget };
      if (w.type === 'kpi') {
        w.kpiConfig = { ...(w.kpiConfig || {}), kpiNameColor: color };
      }
      return w;
    });
  };

  const handleLetterSpacingChange = (value: number) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { customLetterSpacing: value });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, customLetterSpacing: value };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setSelectedLetterSpacing(value);
      console.log('🔤 Letter spacing changed to:', value);
    } catch (error) {
      console.error('Error updating letter spacing:', error);
    }
  };

  const handleChartBodyFontChange = (fontKey: FontPresetKey) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { customChartFontFamily: fontKey });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, customChartFontFamily: fontKey };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setChartBodyFontFamily(fontKey);
      console.log('🅰️ Chart body font changed to:', fontKey);
    } catch (error) {
      console.error('Error updating chart body font:', error);
    }
  };

  const handleChartBodyTextColorChange = (color: string) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { customChartTextColor: color });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, customChartTextColor: color };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setChartBodyTextColor(color);
      console.log('🎨 Chart body text color changed to:', color);
    } catch (error) {
      console.error('Error updating chart body text color:', error);
    }
  };

  const handleBackgroundChange = (backgroundKey: BackgroundPresetKey) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { customBackground: backgroundKey });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, customBackground: backgroundKey };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setSelectedBackground(backgroundKey);
      console.log('🎨 Background changed to:', backgroundKey);
    } catch (error) {
      console.error('Error updating background:', error);
    }
  };

  const handleBorderTypeChange = (type: BorderPresetKey) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { borderType: type });
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code);
        const updatedConfig = { ...config, borderType: type };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      setSelectedBorderType(type);
    } catch (error) {
      console.error('Error updating border type:', error);
    }
  };

  const handleBorderPropChange = (prop: 'borderColor'|'borderWidth'|'borderRadius'|'borderAccentColor'|'borderShadow', value: string | number | boolean) => {
    try {
      const code = visualBuilderState.code;
      if (isDsl(code)) {
        const next = writeStyleToDsl(code, { [prop]: value } as Record<string, unknown>);
        visualBuilderActions.updateCode(next);
      } else {
        const config = JSON.parse(code) as Record<string, unknown>;
        const updatedConfig: Record<string, unknown> = { ...config, [prop]: value };
        visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      }
      if (prop === 'borderColor') setBorderColor(String(value))
      if (prop === 'borderWidth') setBorderWidth(Number(value))
      if (prop === 'borderRadius') setBorderRadius(Number(value))
      if (prop === 'borderAccentColor') setBorderAccentColor(String(value))
      if (prop === 'borderShadow') setBorderShadow(Boolean(value))
    } catch (error) {
      console.error('Error updating border property:', error);
    }
  };

  // Removed handler for corporate color changes

  

  return (
    <Artifact className="h-full">
      <ArtifactHeader className="bg-white">
        <div className="flex items-center gap-2">
          <DropdownMenu open={dashListOpen} onOpenChange={setDashListOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                {dashboardMeta?.title || selectedDashboard}
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64">
              {dashboardsLoading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Carregando...</div>
              )}
              {dashboardsError && (
                <div className="px-3 py-2 text-sm text-red-600">{dashboardsError}</div>
              )}
              {!dashboardsLoading && !dashboardsError && dashboards.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum dashboard encontrado</div>
              )}
              {!dashboardsLoading && !dashboardsError && dashboards.map((d) => (
                <DropdownMenuItem key={d.id} onClick={() => selectDashboard(d.id, d.title)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{d.title}</span>
                    {d.description && <span className="text-xs text-muted-foreground line-clamp-1">{d.description}</span>}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle Dashboard/Editor — ao lado do dropdown (lado esquerdo) */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setActiveTab(activeTab === 'editor' ? 'dashboard' : 'editor')}
            title={activeTab === 'editor' ? 'Ir para Dashboard' : 'Ir para Editor'}
          >
            {activeTab === 'editor' ? (
              <>
                <FileText className="w-4 h-4" />
                <span>Editor</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </>
            )}
          </Button>
        </div>

        {/* Viewport Selector - NO MEIO */}
        <div className="flex items-center gap-1">
          <ArtifactAction
            icon={Monitor}
            onClick={() => setSelectedViewport('desktop')}
            tooltip="Desktop View"
            variant={selectedViewport === 'desktop' ? 'outline' : 'ghost'}
          />
          <ArtifactAction
            icon={Tablet}
            onClick={() => setSelectedViewport('tablet')}
            tooltip="Tablet View"
            variant={selectedViewport === 'tablet' ? 'outline' : 'ghost'}
          />
          <ArtifactAction
            icon={Smartphone}
            onClick={() => setSelectedViewport('mobile')}
            tooltip="Mobile View"
            variant={selectedViewport === 'mobile' ? 'outline' : 'ghost'}
          />
        </div>

        <ArtifactActions>
          {/* Criar (INSERT) */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Criar dashboard"
            onClick={() => setShowSave(true)}
          >
            <Save className="w-4 h-4" />
            <span>Criar</span>
          </Button>
          {/* Atualizar (UPDATE) — visível apenas quando houver dashboardId */}
          {dashboardId && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              title={updating ? 'Atualizando...' : 'Atualizar dashboard'}
              onClick={handleUpdate}
              disabled={updating}
            >
              <Check className="w-4 h-4" />
              <span>{updating ? 'Atualizando...' : 'Atualizar'}</span>
            </Button>
          )}
          {/* Feedback rápido de update */}
          {updateOk && (
            <span className="text-xs text-green-600 px-2">Atualizado</span>
          )}
          {updateError && (
            <span className="text-xs text-red-600 px-2">{updateError}</span>
          )}

          {/* Selector de Tema com mesma UI dos botões */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Tema Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="w-4 h-4 mr-2" />
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(['branco', 'cinza-claro', 'preto', 'cinza-escuro'] as ThemeName[]).map((theme) => {
                    const preview = ThemeManager.getThemePreview(theme);
                    return (
                      <DropdownMenuItem
                        key={theme}
                        onClick={() => handleThemeChange(theme)}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: preview.primaryColor }}
                          />
                          <div>
                            <div className="font-medium">{preview.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-40">
                              {preview.description}
                            </div>
                          </div>
                        </div>
                        {selectedTheme === theme && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Fonte Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Type className="w-4 h-4 mr-2" />
                  Fonte
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {/* Família da Fonte submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Família da Fonte</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFonts.map((font) => (
                        <DropdownMenuItem
                          key={font.key}
                          onClick={() => handleFontChange(font.key)}
                          className="flex items-center justify-between py-2"
                        >
                          <span style={{ fontFamily: font.family }} className="text-sm">
                            {font.name}
                          </span>
                          {selectedFont === font.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Tamanho da Fonte submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Tamanho da Fonte</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFontSizes.map((size) => (
                        <DropdownMenuItem
                          key={size.key}
                          onClick={() => handleFontSizeChange(size.key)}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{size.name}</span>
                            <span className="text-xs text-muted-foreground">{size.value}px • {size.usage}</span>
                          </div>
                          {selectedFontSize === size.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Letter Spacing submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Letter Spacing</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {[-0.05,-0.04,-0.03,-0.02,-0.01,0,0.01,0.02,0.03,0.04,0.05].map(v => (
                        <DropdownMenuItem
                          key={v}
                          onClick={() => handleLetterSpacingChange(v)}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{v.toFixed(2)}em</span>
                            <span className="text-xs text-muted-foreground">tracking</span>
                          </div>
                          {Math.abs(selectedLetterSpacing - v) < 1e-6 && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Chart Body Font Family */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Chart Body Font</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFonts.map((font) => (
                        <DropdownMenuItem
                          key={font.key}
                          onClick={() => handleChartBodyFontChange(font.key)}
                          className="flex items-center justify-between py-2"
                        >
                          <span style={{ fontFamily: font.family }} className="text-sm">
                            {font.name}
                          </span>
                          {chartBodyFontFamily === font.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Header Style Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Layout className="w-4 h-4 mr-2" />
                  Estilo do Cabeçalho
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => headerUiActions.setVariant('auto')} className="flex items-center justify-between py-2">
                    <span>Automático</span>
                    {headerUi.variant === 'auto' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => headerUiActions.setVariant('light')} className="flex items-center justify-between py-2">
                    <span>Claro</span>
                    {headerUi.variant === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => headerUiActions.setVariant('dark')} className="flex items-center justify-between py-2">
                    <span>Escuro</span>
                    {headerUi.variant === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Background Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Square className="w-4 h-4 mr-2" />
                  Fundo
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {availableBackgrounds.map((background) => (
                    <DropdownMenuItem
                      key={background.key}
                      onClick={() => handleBackgroundChange(background.key)}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded border border-gray-200"
                          style={background.previewStyle}
                        />
                        <div>
                          <div className="font-medium text-sm">{background.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {background.description}
                          </div>
                        </div>
                      </div>
                      {selectedBackground === background.key && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Colors Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Square className="w-4 h-4 mr-2" />
                  Cores
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64">
                  <div className="px-3 py-2 text-xs text-muted-foreground">Painel</div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Fundo</span>
                    <input type="color" value={dashboardBgColor} onChange={(e) => handleDashboardBgColorChange(e.target.value)} />
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Cartões</div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Fundo dos Cartões</span>
                    <input type="color" value={cardsBgColor} onChange={(e) => handleCardsBgColorChange(e.target.value)} />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Título do Gráfico</span>
                    <input type="color" value={chartTitleColor} onChange={(e) => handleChartTitleColorChange(e.target.value)} />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Texto do Gráfico</span>
                    <input type="color" value={chartBodyTextColor} onChange={(e) => handleChartBodyTextColorChange(e.target.value)} />
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">KPI</div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Valor do KPI</span>
                    <input type="color" value={kpiValueColor} onChange={(e) => handleKpiValueColorChange(e.target.value)} />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Título do KPI</span>
                    <input type="color" value={kpiTitleColor} onChange={(e) => handleKpiTitleColorChange(e.target.value)} />
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Border Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Square className="w-4 h-4 mr-2" />
                  Borda
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Tipo</div>
                  <DropdownMenuSeparator />
                  {BorderManager.getAvailableBorders().map((b) => (
                    <DropdownMenuItem key={b.key} onClick={() => handleBorderTypeChange(b.key)} className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{b.name}</span>
                        <span className="text-xs text-muted-foreground">{b.description}</span>
                      </div>
                      {selectedBorderType === b.key && <Check className="w-4 h-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Propriedades</div>
                  <div className="px-3 py-2 text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Cor</span>
                      <input type="color" value={borderColor} onChange={(e) => handleBorderPropChange('borderColor', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Largura</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" value={borderWidth} onChange={(e) => handleBorderPropChange('borderWidth', Number(e.target.value))} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Raio</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" value={borderRadius} onChange={(e) => handleBorderPropChange('borderRadius', Number(e.target.value))} />
                    </div>
                    {selectedBorderType === 'acentuada' && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Cor dos cantos</span>
                        <input type="color" value={borderAccentColor} onChange={(e) => handleBorderPropChange('borderAccentColor', e.target.value)} />
                      </div>
                    )}
                    {selectedBorderType === 'suave' && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Sombra</span>
                        <input type="checkbox" checked={borderShadow} onChange={(e) => handleBorderPropChange('borderShadow', e.target.checked)} />
                      </div>
                    )}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Color Palette Submenu removed */}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Compartilhar com mesmo padrão de UI */}
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-black text-white hover:bg-black/90"
            onClick={() => {}}
          >
            <span>Compartilhar</span>
          </Button>
        </ArtifactActions>
      </ArtifactHeader>
      <DashboardSaveDialog
        open={showSave}
        onOpenChange={setShowSave}
        sourcecode={visualBuilderState.code}
        onSaved={(id) => {
          setShowSave(false);
          if (id) {
            // update id and persist in URL
            selectDashboard(id);
          }
        }}
      />

      <ArtifactContent className="p-0 overflow-auto">
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full">
            <MonacoEditor
              value={visualBuilderState.code}
              onChange={handleCodeChange}
              language="json"
              errors={visualBuilderState.parseErrors}
            />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="h-full bg-gray-50 py-2 px-4 overflow-auto">
            {loadingDashboard && (
              <div className="text-sm text-gray-500 mb-2">Carregando dashboard...</div>
            )}
            {dashboardError && (
              <div className="text-sm text-red-600 mb-2">{dashboardError}</div>
            )}
            <ResponsiveGridCanvas
              widgets={visualBuilderState.widgets}
              gridConfig={visualBuilderState.gridConfig}
              viewportMode={selectedViewport}
              onLayoutChange={visualBuilderActions.updateWidgets}
              headerTitle={dashboardMeta?.title || visualBuilderState.dashboardTitle || 'Live Dashboard'}
              headerSubtitle={(dashboardMeta?.description ?? undefined) || visualBuilderState.dashboardSubtitle || 'Real-time visualization with Supabase data'}
              themeName={getThemeFromCode(visualBuilderState.code)}
            />
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}
