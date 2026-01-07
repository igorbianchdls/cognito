'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import DashboardSaveDialog from '@/components/visual-builder/DashboardSaveDialog';
import DashboardOpenDialog from '@/components/visual-builder/DashboardOpenDialog';
import { dashboardsApi, type Dashboard } from '@/stores/dashboardsStore';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import CommandConsole from '@/components/visual-builder/CommandConsole';
// import VisualBuilderChat from '@/components/visual-builder/VisualBuilderChat';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import WidgetEditorModal from '@/components/visual-builder/WidgetEditorModal';
import HeaderEditorModal from '@/components/visual-builder/HeaderEditorModal';
import KpiEditorModal from '@/components/visual-builder/KpiEditorModal';
import ChartEditorModal from '@/components/visual-builder/ChartEditorModal';
import SectionEditorModal from '@/components/visual-builder/SectionEditorModal';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import { initialLiquidGrid } from '@/stores/visualBuilderStore';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import type { Widget, GlobalFilters } from '@/stores/visualBuilderStore';
import { LiquidParser } from '@/components/visual-builder/LiquidParser';
import { createRoot, type Root } from 'react-dom/client';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';

export default function VisualBuilderPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [activeTab, setActiveTab] = useState<'editor' | 'responsive'>('editor');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollTopRef = useRef<number>(0);
  // Local editor draft + debounce timer
  const [editorCode, setEditorCode] = useState<string>(visualBuilderState.code);
  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Patch editor removed; using Command Console instead

  // Patch editor removed
  const currentThemeName: ThemeName = useMemo<ThemeName>(() => {
    const code = String(visualBuilderState.code || '').trim();
    try {
      // Detect DSL (Liquid/HTML-like)
      if (code.startsWith('<')) {
        const m = code.match(/<dashboard\b[^>]*\btheme\s*=\s*\"([^\"]+)\"/i);
        if (m && m[1] && ThemeManager.isValidTheme(m[1] as ThemeName)) return m[1] as ThemeName;
        return 'branco';
      }
      // JSON fallback
      const cfg = JSON.parse(code);
      if (cfg && typeof cfg.theme === 'string' && ThemeManager.isValidTheme(cfg.theme)) return cfg.theme;
    } catch {}
    return 'branco';
  }, [visualBuilderState.code]);

  // Liquid-only editor language
  const monacoLanguage = 'html';

  // Initialize store on mount
  useEffect(() => {
    // Temporarily clear storage to force new widgets to appear
    // TODO: Remove this after testing
    visualBuilderActions.clearStorage();

    visualBuilderActions.initialize(); // Initialize visual builder store
  }, []);

  // Keep local editor value in sync when store changes externally
  useEffect(() => {
    setEditorCode(visualBuilderState.code);
  }, [visualBuilderState.code]);

  const handleCodeChange = (newCode: string) => {
    // Update local editor value immediately
    setEditorCode(newCode);
    // Debounce store update to avoid updates on every keystroke
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
    codeDebounceRef.current = setTimeout(() => {
      visualBuilderActions.updateCode(newCode);
    }, 500);
  };

  const handleLayoutChange = useCallback((updatedWidgets: Widget[]) => {
    visualBuilderActions.updateWidgets(updatedWidgets);
  }, []);

  const handleOpenEdit = useCallback((widget: Widget) => {
    // Capture current scroll position of the scroll container
    prevScrollTopRef.current = scrollRef.current?.scrollTop || 0;
    setEditingWidget(widget);
    // Restore scroll on next frame to neutralize any remount-induced jump
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = prevScrollTopRef.current;
    });
  }, []);

  const handleSaveWidget = (updatedWidget: Widget) => {
    // Update widgets in store
    const updated = visualBuilderState.widgets.map(w =>
      w.id === updatedWidget.id ? updatedWidget : w
    );
    visualBuilderActions.updateWidgets(updated);
    // Force refetch for this widget only
    visualBuilderActions.bumpReloadTick(updatedWidget.id);
    setEditingWidget(null);
    // Restore scroll after store update
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = prevScrollTopRef.current;
    });
  };

  const handleFilterChange = useCallback((filters: GlobalFilters) => {
    setIsFilterLoading(true);
    // Persist into DSL and store
    visualBuilderActions.updateGlobalDateInCode(filters);
    // Simulate loading time for better UX
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 1000);
  }, []);

  // HTML puro no editor/preview interno (aba Responsive)
  const code = String(visualBuilderState.code || '').trim();
  const dashOpen = useMemo(() => code.match(/<dashboard\b([^>]*)>/i), [code]);
  const htmlMode = useMemo(() => {
    if (!code.startsWith('<')) return false;
    const attrs = dashOpen?.[1] || '';
    // aceita render=html, render='html' ou render="html"
    return /\brender\s*=\s*(?:"|')?(?:html|raw)(?:"|')?/i.test(attrs);
  }, [code, dashOpen]);
  const htmlInner = useMemo(() => {
    if (!htmlMode) return '';
    const m = code.match(/<dashboard\b[^>]*>([\s\S]*?)<\/dashboard>/i);
    return m ? m[1] : code;
  }, [htmlMode, code]);
  const htmlRef = useRef<HTMLDivElement>(null);
  const htmlRootsRef = useRef<Root[]>([]);
  const htmlCleanupFnsRef = useRef<Array<() => void>>([]);
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [headerModalData, setHeaderModalData] = useState<{ title: string; subtitle: string }>({ title: '', subtitle: '' });
  const [htmlWidgetModalOpen, setHtmlWidgetModalOpen] = useState(false);
  const [htmlWidgetModal, setHtmlWidgetModal] = useState<Widget | null>(null);
  type KpiInitial = {
    titleText: string;
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: string | number;
    titleColor?: string;
    valueText: string;
    valueFontFamily?: string;
    valueFontSize?: number;
    valueFontWeight?: string | number;
    valueColor?: string;
  };
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalArticleId, setKpiModalArticleId] = useState<string | null>(null);
  const [kpiModalInitial, setKpiModalInitial] = useState<KpiInitial>({ titleText: '', valueText: '' });
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartModalChartId, setChartModalChartId] = useState<string | null>(null);
  const [chartModalInitial, setChartModalInitial] = useState<{ titleText: string; titleFontFamily?: string; titleFontSize?: number; titleFontWeight?: string | number; titleColor?: string; backgroundColor?: string; opacity?: number; borderColor?: string; borderWidth?: number; borderStyle?: 'solid'|'dashed'|'dotted'|''; borderRadius?: number }>({ titleText: '' });
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionModalId, setSectionModalId] = useState<string | null>(null);
  const [sectionModalInitial, setSectionModalInitial] = useState<import('@/components/visual-builder/SectionEditorModal').SectionEditorInitial>({});
  useEffect(() => {
    if (!htmlMode) return;
    if (activeTab !== 'responsive') return;
    const c = htmlRef.current;
    if (!c) return;
    // clear previous mounts
    for (const r of htmlRootsRef.current) { try { r.unmount(); } catch {} }
    htmlRootsRef.current = [];

    const parsed = LiquidParser.parse(code);
    c.innerHTML = '';
    c.innerHTML = parsed.html;

    // mount charts with simulated data
    for (const spec of parsed.charts) {
      const mount = c.querySelector(`[data-liquid-chart="${spec.id}"]`) as HTMLElement | null;
      if (!mount) continue;
      // ensure height
      if (!mount.style.height || mount.style.height === '') mount.style.height = (spec.height && Number.isFinite(spec.height) ? `${spec.height}px` : '320px');
      mount.style.width = mount.style.width || '100%';
      const root = createRoot(mount);
      htmlRootsRef.current.push(root);
      const common = {
        data: spec.data,
        // Strip container styling: no border, radius, background, padding
        containerClassName: 'nivo-container',
        containerBorderVariant: 'none',
        containerPadding: 0,
        containerBorderRadius: 0,
        backgroundColor: 'transparent',
        containerBackground: 'transparent'
      } as any;
      switch (spec.type) {
        case 'line': root.render(<LineChart {...common} />); break;
        case 'pie': root.render(<PieChart {...common} />); break;
        case 'area': root.render(<AreaChart {...common} enableArea={true} />); break;
        default: root.render(<BarChart {...common} />); break;
      }
    }

    // Inject edit triggers (header + articles)
    const cleanupFns: Array<() => void> = [];
    const makeTrigger = (parent: HTMLElement, role: 'header' | 'widget', onClick: () => void) => {
      parent.style.position = parent.style.position || 'relative';
      const btn = document.createElement('button');
      btn.textContent = '✎';
      btn.title = 'Editar';
      btn.setAttribute('type', 'button');
      btn.style.position = 'absolute';
      btn.style.top = '8px';
      btn.style.right = '8px';
      btn.style.zIndex = '50';
      btn.style.padding = '4px 8px';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.background = 'rgba(0,0,0,0.7)';
      btn.style.color = '#fff';
      btn.style.cursor = 'pointer';
      btn.style.opacity = '0';
      btn.style.transition = 'opacity 120ms ease-in-out';
      const enter = () => { btn.style.opacity = '1'; };
      const leave = () => { btn.style.opacity = '0'; };
      const click = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); onClick(); };
      parent.addEventListener('mouseenter', enter);
      parent.addEventListener('mouseleave', leave);
      btn.addEventListener('click', click);
      parent.appendChild(btn);
      cleanupFns.push(() => {
        try { parent.removeEventListener('mouseenter', enter); } catch {}
        try { parent.removeEventListener('mouseleave', leave); } catch {}
        try { btn.removeEventListener('click', click); } catch {}
        try { parent.removeChild(btn); } catch {}
      });
    };

    // Header trigger
    const headerEl = c.querySelector('header.vb-header') as HTMLElement | null;
    if (headerEl) {
      makeTrigger(headerEl, 'header', () => {
        const t = headerEl.querySelector('h1')?.textContent?.trim() || '';
        const s = headerEl.querySelector('p, h2, small')?.textContent?.trim() || '';
        setHeaderModalData({ title: t, subtitle: s });
        setHeaderModalOpen(true);
      });
    }

    // Section triggers (only on section[data-role="section"]) with blue outline + label "Editar"
    const sectionEls = Array.from(c.querySelectorAll('section[data-role="section"]')) as HTMLElement[];
    for (const sec of sectionEls) {
      // Hover outline + label
      sec.style.position = sec.style.position || 'relative';
      const label = document.createElement('div');
      label.textContent = 'Editar';
      label.style.position = 'absolute';
      label.style.top = '-10px';
      label.style.left = '8px';
      label.style.background = '#3b82f6';
      label.style.color = '#fff';
      label.style.padding = '2px 8px';
      label.style.borderRadius = '6px';
      label.style.fontSize = '12px';
      label.style.lineHeight = '1';
      label.style.opacity = '0';
      label.style.transition = 'opacity 120ms ease-in-out';
      label.style.cursor = 'pointer';
      const enter = () => { sec.style.outline = '2px solid #3b82f6'; label.style.opacity = '1'; };
      const leave = () => { sec.style.outline = ''; label.style.opacity = '0'; };
      const click = (e: MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const id = sec.getAttribute('id') || '';
        setSectionModalId(id || null);
        // Collect current styles
        const parse = (s: string | null | undefined) => {
          const out: Record<string,string> = {}; if (!s) return out; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return out;
        };
        const st = parse(sec.getAttribute('style'));
        const numPx = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
        const computedDisplay = (() => {
          try {
            const v = (sec.style?.display || (typeof window !== 'undefined' ? window.getComputedStyle(sec).display : '') || '').trim();
            return v.includes('grid') ? 'grid' : (v.includes('flex') ? 'flex' : undefined);
          } catch { return undefined; }
        })();
        const initial: import('@/components/visual-builder/SectionEditorModal').SectionEditorInitial = {
          display: (st['display'] as any) || computedDisplay,
          gap: numPx(st['gap']),
          flexDirection: (st['flex-direction'] as any) || undefined,
          flexWrap: (st['flex-wrap'] as any) || undefined,
          justifyContent: (st['justify-content'] as any) || undefined,
          alignItems: (st['align-items'] as any) || undefined,
          gridTemplateColumns: st['grid-template-columns'] || undefined,
          padding: numPx(st['padding']),
          margin: numPx(st['margin']),
          backgroundColor: st['background-color'] || undefined,
          opacity: st['opacity'] ? Number(st['opacity']) : undefined,
          borderColor: st['border-color'] || undefined,
          borderWidth: numPx(st['border-width']),
          borderStyle: (st['border-style'] as any) || undefined,
          borderRadius: numPx(st['border-radius'])
        };
        setSectionModalInitial(initial);
        setSectionModalOpen(true);
      };
      sec.addEventListener('mouseenter', enter);
      sec.addEventListener('mouseleave', leave);
      label.addEventListener('click', click);
      sec.appendChild(label);
      cleanupFns.push(() => {
        try { sec.removeEventListener('mouseenter', enter); } catch {}
        try { sec.removeEventListener('mouseleave', leave); } catch {}
        try { label.removeEventListener('click', click); } catch {}
        try { sec.removeChild(label); } catch {}
      });
    }

    // Article triggers (KPI only via data-role="kpi")
    const kpiArticles = Array.from(c.querySelectorAll('article[data-role="kpi"]')) as HTMLElement[];
    for (const art of kpiArticles) {
      makeTrigger(art, 'widget', () => {
        const id = art.getAttribute('id') || 'kpi_temp';
        const titleEl = art.querySelector('h1');
        const valEl = art.querySelector('.kpi-value');
        const parseStyle = (s: string | null | undefined): Record<string,string> => {
          const out: Record<string,string> = {};
          if (!s) return out;
          for (const part of s.split(';')) {
            const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim();
          }
          return out;
        };
        const tStyle = parseStyle(titleEl?.getAttribute('style'));
        const vStyle = parseStyle(valEl?.getAttribute('style'));
        const num = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
        setKpiModalArticleId(id);
        setKpiModalInitial({
          titleText: titleEl?.textContent?.trim() || '',
          titleFontFamily: tStyle['font-family'] || '',
          titleFontSize: num(tStyle['font-size']),
          titleFontWeight: tStyle['font-weight'] || undefined,
          titleColor: tStyle['color'] || '#111827',
          valueText: valEl?.textContent?.trim() || '',
          valueFontFamily: vStyle['font-family'] || '',
          valueFontSize: num(vStyle['font-size']),
          valueFontWeight: vStyle['font-weight'] || undefined,
          valueColor: vStyle['color'] || '#111827',
        });
        setKpiModalOpen(true);
      });
    }

    // Chart triggers (only on article[data-role="chart"]) 
    const chartArticles = Array.from(c.querySelectorAll('article[data-role="chart"]')) as HTMLElement[];
    for (const art of chartArticles) {
      makeTrigger(art, 'widget', () => {
        const mount = art.querySelector('[data-liquid-chart]') as HTMLElement | null;
        const chartId = mount?.getAttribute('data-liquid-chart') || '';
        const titleEl = art.querySelector('h1');
        const parseStyle = (s: string | null | undefined): Record<string,string> => {
          const out: Record<string,string> = {};
          if (!s) return out;
          for (const part of s.split(';')) {
            const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim();
          }
          return out;
        };
        const tStyle = parseStyle(titleEl?.getAttribute('style'));
        const num = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
        // Parse container styles
        const artStyleObj = (() => {
          const s = art.getAttribute('style');
          const out: Record<string,string> = {};
          if (!s) return out;
          for (const part of s.split(';')) {
            const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim();
          }
          return out;
        })();
        const numPx = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
        setChartModalChartId(chartId);
        setChartModalInitial({
          titleText: titleEl?.textContent?.trim() || '',
          titleFontFamily: tStyle['font-family'] || '',
          titleFontSize: num(tStyle['font-size']),
          titleFontWeight: tStyle['font-weight'] || undefined,
          titleColor: tStyle['color'] || '#111827',
          backgroundColor: artStyleObj['background-color'] || '',
          opacity: artStyleObj['opacity'] ? Number(artStyleObj['opacity']) : undefined,
          borderColor: artStyleObj['border-color'] || '',
          borderWidth: numPx(artStyleObj['border-width']),
          borderStyle: (artStyleObj['border-style'] as any) || '',
          borderRadius: numPx(artStyleObj['border-radius']),
        });
        setChartModalOpen(true);
      });
    }

    htmlCleanupFnsRef.current = cleanupFns;

    return () => {
      for (const r of htmlRootsRef.current) { try { r.unmount(); } catch {} }
      htmlRootsRef.current = [];
      for (const fn of htmlCleanupFnsRef.current) { try { fn(); } catch {} }
      htmlCleanupFnsRef.current = [];
      if (htmlRef.current && activeTab === 'responsive') htmlRef.current.innerHTML = '';
    };
  }, [htmlMode, htmlInner, activeTab, code]);

  // Save handler for Header modal in HTML mode: mutate source code header block
  const handleHeaderSave = useCallback((data: { title: string; subtitle: string; config?: import('@/components/visual-builder/ConfigParser').HeaderConfig }) => {
    try {
      const src = String(visualBuilderState.code || '');
      const m = src.match(/<header\b[^>]*>[\s\S]*?<\/header>/i);
      if (!m || !m[0]) { setHeaderModalOpen(false); return; }
      const whole = m[0];
      const openMatch = whole.match(/<header\b([^>]*)>/i);
      const innerMatch = whole.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i);
      const openAttrs = openMatch ? (openMatch[1] || '') : '';
      const innerOld = innerMatch ? (innerMatch[1] || '') : '';

      // Parse existing style from header and merge overrides
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const styleM = openAttrs.match(styleRe);
      const parseStyle = (s: string): Record<string,string> => {
        const out: Record<string,string> = {};
        for (const part of s.split(';')) {
          const p = part.trim(); if (!p) continue;
          const i = p.indexOf(':'); if (i === -1) continue;
          const k = p.slice(0,i).trim(); const v = p.slice(i+1).trim();
          out[k] = v;
        }
        return out;
      };
      const toStyle = (obj: Record<string,string>) => Object.entries(obj).map(([k,v]) => `${k}:${v}`).join('; ');
      const styleObj = styleM ? parseStyle(styleM[2] || styleM[3] || '') : {};
      // Apply container overrides from config
      const cfg = data.config;
      if (cfg?.backgroundColor) styleObj['background-color'] = String(cfg.backgroundColor);
      if (cfg?.borderColor) styleObj['border-color'] = String(cfg.borderColor);
      if (typeof cfg?.borderWidth === 'number') styleObj['border-width'] = `${cfg.borderWidth}px`;
      if (cfg?.borderStyle) styleObj['border-style'] = String(cfg.borderStyle);

      // Rebuild header open tag with merged style (preserve other attrs)
      let newOpenAttrs = openAttrs.replace(styleRe, ''); // strip old style
      newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
      const classRe = /class\s*=\s*("([^"]*)"|'([^']*)')/i;
      if (!classRe.test(newOpenAttrs)) newOpenAttrs = ` class=\"vb-header\"` + newOpenAttrs;
      const newStyleStr = toStyle(styleObj);
      const newOpenTag = `<header${newOpenAttrs}${newStyleStr ? ` style=\"${newStyleStr}\"` : ''}>`;

      // Build H1 style from config (only if style fields provided)
      const h1Style: Record<string,string> = {};
      const titleStyleDirty = Boolean(
        cfg?.titleFontFamily || typeof cfg?.titleFontSize === 'number' || cfg?.titleFontWeight !== undefined || cfg?.titleColor ||
        cfg?.titleMarginTop !== undefined || cfg?.titleMarginRight !== undefined || cfg?.titleMarginBottom !== undefined || cfg?.titleMarginLeft !== undefined
      );
      if (cfg?.titleFontFamily) h1Style['font-family'] = String(cfg.titleFontFamily);
      if (typeof cfg?.titleFontSize === 'number') h1Style['font-size'] = `${cfg.titleFontSize}px`;
      if (cfg?.titleFontWeight !== undefined) h1Style['font-weight'] = String(cfg.titleFontWeight);
      if (cfg?.titleColor) h1Style['color'] = String(cfg.titleColor);
      if (cfg?.titleMarginTop !== undefined || cfg?.titleMarginRight !== undefined || cfg?.titleMarginBottom !== undefined || cfg?.titleMarginLeft !== undefined) {
        const mt = cfg.titleMarginTop ?? 0; const mr = cfg.titleMarginRight ?? 0; const mb = cfg.titleMarginBottom ?? 0; const ml = cfg.titleMarginLeft ?? 0;
        h1Style['margin'] = `${mt}px ${mr}px ${mb}px ${ml}px`;
      }

      // Build subtitle <p> style (only if style fields provided)
      const pStyle: Record<string,string> = {};
      const subtitleStyleDirty = Boolean(
        cfg?.subtitleFontFamily || typeof cfg?.subtitleFontSize === 'number' || cfg?.subtitleFontWeight !== undefined || cfg?.subtitleColor ||
        cfg?.subtitleMarginTop !== undefined || cfg?.subtitleMarginRight !== undefined || cfg?.subtitleMarginBottom !== undefined || cfg?.subtitleMarginLeft !== undefined
      );
      if (cfg?.subtitleFontFamily) pStyle['font-family'] = String(cfg.subtitleFontFamily);
      if (typeof cfg?.subtitleFontSize === 'number') pStyle['font-size'] = `${cfg.subtitleFontSize}px`;
      if (cfg?.subtitleFontWeight !== undefined) pStyle['font-weight'] = String(cfg.subtitleFontWeight);
      if (cfg?.subtitleColor) pStyle['color'] = String(cfg.subtitleColor);
      if (cfg?.subtitleMarginTop !== undefined || cfg?.subtitleMarginRight !== undefined || cfg?.subtitleMarginBottom !== undefined || cfg?.subtitleMarginLeft !== undefined) {
        const mt = cfg.subtitleMarginTop ?? 0; const mr = cfg.subtitleMarginRight ?? 0; const mb = cfg.subtitleMarginBottom ?? 0; const ml = cfg.subtitleMarginLeft ?? 0;
        pStyle['margin'] = `${mt}px ${mr}px ${mb}px ${ml}px`;
      }
      // Padding de título/subtítulo não está no HeaderConfig atual; manter apenas margin

      // Compose new header inner HTML
      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      // Keep existing h1/p opening tag (attrs) if style not dirty; only replace inner text
      const h1Re = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/i;
      const pRe = /<(p|h2|small)\b([^>]*)>([\s\S]*?)<\/\1>/i;
      let inner = innerOld;
      if (titleStyleDirty) {
        const h1Open = inner.match(/<h1\b([^>]*)>/i)?.[1] || '';
        const styleRe2 = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
        const h1NoStyle = h1Open.replace(styleRe2, '').replace(/\s+$/, '');
        const h1StyleStr = toStyle(h1Style);
        const newH1Open = `<h1${h1NoStyle ? ` ${h1NoStyle}` : ''}${h1StyleStr ? ` style=\"${h1StyleStr}\"` : ''}>`;
        inner = h1Re.test(inner) ? inner.replace(h1Re, `${newH1Open}${esc(data.title || '')}</h1>`) : `${newH1Open}${esc(data.title || '')}</h1>\n` + inner;
      } else {
        inner = h1Re.test(inner) ? inner.replace(h1Re, (_m, open) => `<h1${open ? ` ${open}` : ''}>${esc(data.title || '')}</h1>`) : `<h1>${esc(data.title || '')}</h1>\n` + inner;
      }
      if (subtitleStyleDirty) {
        const pOpen = inner.match(/<(p|h2|small)\b([^>]*)>/i)?.[2] || '';
        const styleRe2 = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
        const pNoStyle = pOpen.replace(styleRe2, '').replace(/\s+$/, '');
        const pStyleStr = toStyle(pStyle);
        const newPOpen = `<p${pNoStyle ? ` ${pNoStyle}` : ''}${pStyleStr ? ` style=\"${pStyleStr}\"` : ''}>`;
        inner = pRe.test(inner) ? inner.replace(pRe, `${newPOpen}${esc(data.subtitle || '')}</p>`) : inner + `\n      ${newPOpen}${esc(data.subtitle || '')}</p>`;
      } else {
        inner = pRe.test(inner) ? inner.replace(pRe, (_m, tag, open) => `<${tag}${open ? ` ${open}` : ''}>${esc(data.subtitle || '')}</${tag}>`) : inner + `\n      <p>${esc(data.subtitle || '')}</p>`;
      }
      const newWhole = newOpenTag + inner + `</header>`;
      const newCode = src.replace(whole, newWhole);
      visualBuilderActions.updateCode(newCode);
    } catch {}
    finally {
      setHeaderModalOpen(false);
    }
  }, [visualBuilderState.code]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visual Builder</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create charts and KPIs with coordinates •
              <span className={`ml-2 ${
                visualBuilderState.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {visualBuilderState.isValid ? `${visualBuilderState.widgets.length} widgets` :
                 `${visualBuilderState.parseErrors.filter(e => e.type !== 'warning').length} errors`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => setShowSave(true)}
            >
              Salvar como…
            </button>
            <button
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setShowOpen(true)}
            >
              Abrir…
            </button>
            <button
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => visualBuilderActions.updateCode(`
<dashboard render="html" theme="branco">
  <style>
    .vb-container { padding: 16px; }
    .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 16px; }
    @media (max-width: 1024px) { .row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px)  { .row { grid-template-columns: repeat(1, minmax(0, 1fr)); } }
    .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; color: #111827; }
    .card h3 { margin: 0 0 8px; font-family: Inter, system-ui, sans-serif; font-weight: 600; font-size: 14px; color: #374151; }
    .kpi-value { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
    /* KPIs: flex com frações via --fr (display/gap inline no section) */
    .row.kpis > article { flex: var(--fr, 1) 1 0%; min-width: 0; }
    @media (max-width: 640px) { .row.kpis { flex-direction: column; } .row.kpis > article { flex: 1 1 auto; } }
    /* Charts row using flex with fractional widths via --fr (display/gap inline no section) */
    .row.charts > article { flex: var(--fr, 1) 1 0%; min-width: 0; }
    @media (max-width: 640px) { .row.charts { flex-direction: column; } .row.charts > article { flex: 1 1 auto; } }
  </style>

  <div class="vb-container">
    <header class="vb-header" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:0; margin:-16px -16px 0 -16px;">
      <h1 style="margin:0 0 4px; font-family:Inter, system-ui, sans-serif; font-size:20px; font-weight:700; color:#111827;">Dashboard de Indicadores</h1>
      <p style="margin:0; font-family:Inter, system-ui, sans-serif; font-size:14px; font-weight:400; color:#6b7280;">Visão geral</p>
    </header>
    <section class="row kpis" style="display:flex; gap:16px; margin-bottom:16px;">
      <article id="kpi_vendas" class="card" data-role="kpi" style="--fr:1; background-color:#fff7ed; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas</h1>
        <div class="kpi-value">R$ 124.500</div>
      </article>
      <article id="kpi_pedidos" class="card" data-role="kpi" style="--fr:1; background-color:#ecfeff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Pedidos</h1>
        <div class="kpi-value">830</div>
      </article>
      <article id="kpi_clientes" class="card" data-role="kpi" style="--fr:1; background-color:#f0fdf4; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Clientes</h1>
        <div class="kpi-value">214</div>
      </article>
      <article id="kpi_ticket_medio" class="card" data-role="kpi" style="--fr:1; background-color:#eef2ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Ticket Médio</h1>
        <div class="kpi-value">R$ 150,00</div>
      </article>
    </section>

    <section class="row charts" style="display:flex; gap:16px; margin-bottom:16px;">
      <article class="card" data-role="chart" style="--fr:1; background-color:#fefce8; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Faturamento Mensal</h1>
        <Chart id="fat_mensal" type="line" height="320" />
      </article>
      <article class="card" data-role="chart" style="--fr:2; background-color:#f0f9ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Canal</h1>
        <Chart id="vendas_canal" type="bar" height="320" categories="Loja,Site,WhatsApp" values="120,80,150" />
      </article>
      <article class="card" data-role="chart" style="--fr:1; background-color:#fdf2f8; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px;">
        <h1 style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Participação</h1>
        <Chart id="participacao" type="pie" height="320" />
      </article>
    </section>
  </div>
</dashboard>
              `)}
            >
              Exemplo (HTML)
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export Config
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Import Config
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('editor')}
          >
            📝 Editor
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'responsive'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('responsive')}
          >
            📱 Responsive
          </button>
          
        </div>
      </div>

      {/* Main Content - Tab Based */}
      <div className="h-[calc(100vh-81px-49px)]">
        <DashboardSaveDialog
          open={showSave}
          onOpenChange={setShowSave}
          sourcecode={visualBuilderState.code}
          onSaved={(id) => {
            setShowSave(false)
          }}
        />
        <DashboardOpenDialog
          open={showOpen}
          onOpenChange={setShowOpen}
          onOpen={async (item: Dashboard) => {
            setShowOpen(false)
            try {
              const { item: full } = await dashboardsApi.get(item.id)
              visualBuilderActions.updateCode(full.sourcecode)
            } catch {
              // ignore
            }
          }}
        />
        {/* Editor Tab */
        }
        {activeTab === 'editor' && (
          <div className="h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configuration Editor</h2>
              <p className="text-sm text-gray-600">Defina seu dashboard em Liquid</p>
            </div>
            {/* Split 50/50: left editor, right commands */}
            <div className="h-[calc(100%-73px)] flex">
              <div className="w-1/2 min-w-[480px] h-full">
                <MonacoEditor
                  value={editorCode}
                  onChange={handleCodeChange}
                  language={monacoLanguage}
                  errors={visualBuilderState.parseErrors}
                />
              </div>
              <div className="w-1/2 min-w-[420px] h-full flex flex-col">
                <CommandConsole sourceCode={editorCode} />
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab removed: using only Responsive Grid */}

        {/* Responsive Tab */}
        {activeTab === 'responsive' && (
          <div className="h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Responsive Dashboard</h2>
                  <p className="text-sm text-gray-600">Preview different device layouts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 mr-2">Device:</span>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewportMode === 'desktop'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setViewportMode('desktop')}
                  >
                    💻 Desktop
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewportMode === 'tablet'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setViewportMode('tablet')}
                  >
                    📱 Tablet
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewportMode === 'mobile'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setViewportMode('mobile')}
                  >
                    📱 Mobile
                  </button>

                  {/* Botão Visualizar */}
                  <div className="ml-4 pl-4 border-l border-gray-300">
                    <Link
                      href="/visual-builder/preview"
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      👁️ Visualizar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[calc(100%-73px)] p-6 overflow-auto" ref={scrollRef} style={{ overflowAnchor: 'none' }}>
              {htmlMode ? (
                <div ref={htmlRef} className="w-full" />
              ) : (
                <ResponsiveGridCanvas
                  widgets={visualBuilderState.widgets}
                  gridConfig={visualBuilderState.gridConfig}
                  globalFilters={visualBuilderState.globalFilters}
                  viewportMode={viewportMode}
                  onLayoutChange={handleLayoutChange}
                  headerTitle={visualBuilderState.dashboardTitle || 'Responsive Dashboard'}
                  headerSubtitle={visualBuilderState.dashboardSubtitle || 'Preview different device layouts'}
                  headerConfig={visualBuilderState.headerConfig}
                  onFilterChange={handleFilterChange}
                  isFilterLoading={isFilterLoading}
                  themeName={currentThemeName}
                  onEdit={handleOpenEdit}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor modal lifted to page (prevents grid remount/scroll change) */}
      <WidgetEditorModal
        widget={editingWidget}
        isOpen={!!editingWidget}
        onClose={() => setEditingWidget(null)}
        onSave={handleSaveWidget}
      />

      {/* HTML-mode modals: open-only (no action) */}
      <HeaderEditorModal
        isOpen={headerModalOpen}
        initialTitle={headerModalData.title}
        initialSubtitle={headerModalData.subtitle}
        onClose={() => setHeaderModalOpen(false)}
        onSave={handleHeaderSave}
      />
      <WidgetEditorModal
        widget={htmlWidgetModal}
        isOpen={htmlWidgetModalOpen}
        onClose={() => { setHtmlWidgetModalOpen(false); setHtmlWidgetModal(null); }}
        onSave={() => { setHtmlWidgetModalOpen(false); setHtmlWidgetModal(null); }}
      />
      <ChartEditorModal
        isOpen={chartModalOpen}
        initial={chartModalInitial}
        onClose={() => setChartModalOpen(false)}
        onSave={(out) => {
          try {
            const src = String(visualBuilderState.code || '');
            const chartId = chartModalChartId || '';
            if (!chartId) { setChartModalOpen(false); return; }
            // Find the Chart tag first
            const escId = chartId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const chartTagRe = new RegExp(`<Chart\\b[^>]*\\bid=\\"${escId}\\"`, 'i');
            const mChart = src.match(chartTagRe);
            if (!mChart || mChart.index === undefined) { setChartModalOpen(false); return; }
            const chartIdx = mChart.index;
            // Find surrounding article
            const artStart = src.lastIndexOf('<article', chartIdx);
            const artOpenEnd = src.indexOf('>', artStart);
            const artClose = src.indexOf('</article>', chartIdx);
            if (artStart === -1 || artOpenEnd === -1 || artClose === -1) { setChartModalOpen(false); return; }
            const whole = src.slice(artStart, artClose + 10);
            const openMatch = src.slice(artStart, artOpenEnd + 1).match(/<article\b([^>]*)>/i);
            const openAttrs = openMatch ? (openMatch[1] || '') : '';
            const innerOld = src.slice(artOpenEnd + 1, artClose);
            // Replace or insert h1
            const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const h1Re = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/i;
            const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
            const h1Style: Record<string,string> = {};
            if (out.titleFontFamily) h1Style['font-family'] = String(out.titleFontFamily);
            if (typeof out.titleFontSize === 'number') h1Style['font-size'] = `${out.titleFontSize}px`;
            if (out.titleFontWeight !== undefined) h1Style['font-weight'] = String(out.titleFontWeight);
            if (out.titleColor) h1Style['color'] = String(out.titleColor);
            const newH1 = `<h1 style=\"${toStyle(h1Style)}\">${esc(out.titleText || '')}</h1>`;
            let inner = innerOld;
            if (h1Re.test(inner)) inner = inner.replace(h1Re, newH1); else inner = newH1 + `\n` + inner;
            // Merge container styles
            const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
            const styleM = openAttrs.match(styleRe);
            const parseStyle = (s: string): Record<string,string> => {
              const outS: Record<string,string> = {};
              for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; outS[p.slice(0,i).trim()] = p.slice(i+1).trim(); }
              return outS;
            };
            const styleObj = styleM ? parseStyle(styleM[2] || styleM[3] || '') : {};
            if (out.backgroundColor) styleObj['background-color'] = String(out.backgroundColor);
            if (out.opacity !== undefined) styleObj['opacity'] = String(out.opacity);
            if (out.borderColor) styleObj['border-color'] = String(out.borderColor);
            if (typeof out.borderWidth === 'number') styleObj['border-width'] = `${out.borderWidth}px`;
            if (out.borderStyle) styleObj['border-style'] = String(out.borderStyle);
            if (typeof out.borderRadius === 'number') styleObj['border-radius'] = `${out.borderRadius}px`;
            // rebuild open tag
            let newOpenAttrs = openAttrs.replace(styleRe, '');
            newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
            const newOpenTag = `<article${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
            const newWhole = `<article${openAttrs}>${inner}</article>`;
            const newCode = src.replace(whole, newOpenTag + inner + `</article>`);
            visualBuilderActions.updateCode(newCode);
          } catch {}
          finally {
            setChartModalOpen(false);
          }
        }}
      />
      <SectionEditorModal
        isOpen={sectionModalOpen}
        initial={sectionModalInitial}
        onClose={() => setSectionModalOpen(false)}
        onSave={(out) => {
          try {
            const src = String(visualBuilderState.code || '');
            const id = sectionModalId || '';
            if (!id) { setSectionModalOpen(false); return; }
            const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`<section\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/section>`, 'i');
            const m = src.match(re);
            if (!m) { setSectionModalOpen(false); return; }
            const whole = m[0];
            const openAttrs = m[1] || '';
            const innerOld = m[2] || '';
            const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
            const parse = (s: string) => { const o: Record<string,string> = {}; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; o[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return o; };
            const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
            const styleObj = (() => { const ms = openAttrs.match(styleRe); return ms ? parse(ms[2] || ms[3] || '') : {}; })();
            const setIf = (k: string, v?: string | number) => { if (v !== undefined && v !== '') styleObj[k] = String(v); };
            // Determine intended display if user changed flex/grid-specific props but not display
            const wantsFlexProps = out.flexDirection !== undefined || out.flexWrap !== undefined || out.justifyContent !== undefined || out.alignItems !== undefined;
            const wantsGridProps = out.gridTemplateColumns !== undefined;
            const displayValue = out.display || (wantsFlexProps ? 'flex' : (wantsGridProps ? 'grid' : undefined));
            setIf('display', displayValue);
            setIf('gap', out.gap !== undefined ? `${out.gap}px` : undefined);
            if (displayValue === 'flex' || wantsFlexProps) {
              setIf('flex-direction', out.flexDirection);
              setIf('flex-wrap', out.flexWrap);
              setIf('justify-content', out.justifyContent);
              setIf('align-items', out.alignItems);
            }
            if (displayValue === 'grid' || wantsGridProps) setIf('grid-template-columns', out.gridTemplateColumns);
            setIf('padding', out.padding !== undefined ? `${out.padding}px` : undefined);
            setIf('margin', out.margin !== undefined ? `${out.margin}px` : undefined);
            setIf('background-color', out.backgroundColor);
            setIf('opacity', out.opacity !== undefined ? out.opacity : undefined);
            setIf('border-color', out.borderColor);
            setIf('border-width', out.borderWidth !== undefined ? `${out.borderWidth}px` : undefined);
            setIf('border-style', out.borderStyle);
            setIf('border-radius', out.borderRadius !== undefined ? `${out.borderRadius}px` : undefined);
            let newOpenAttrs = openAttrs.replace(styleRe, ''); newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
            const newOpenTag = `<section${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
            const newCode = src.replace(whole, newOpenTag + innerOld + `</section>`);
            visualBuilderActions.updateCode(newCode);
          } catch {}
          finally { setSectionModalOpen(false); }
        }}
      />
      <KpiEditorModal
        isOpen={kpiModalOpen}
        initial={kpiModalInitial}
        onClose={() => setKpiModalOpen(false)}
        onSave={(out) => {
          try {
            const src = String(visualBuilderState.code || '');
            const id = kpiModalArticleId || '';
            if (!id) { setKpiModalOpen(false); return; }
            const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
            const m = src.match(re);
            if (!m) { setKpiModalOpen(false); return; }
            const whole = m[0];
            const openAttrs = m[1] || '';
            const innerOld = m[2] || '';
            const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
            // Build h1 style
            const h1Style: Record<string,string> = {};
            if (out.titleFontFamily) h1Style['font-family'] = String(out.titleFontFamily);
            if (typeof out.titleFontSize === 'number') h1Style['font-size'] = `${out.titleFontSize}px`;
            if (out.titleFontWeight !== undefined) h1Style['font-weight'] = String(out.titleFontWeight);
            if (out.titleColor) h1Style['color'] = String(out.titleColor);
            // Build value style
            const valStyle: Record<string,string> = {};
            if (out.valueFontFamily) valStyle['font-family'] = String(out.valueFontFamily);
            if (typeof out.valueFontSize === 'number') valStyle['font-size'] = `${out.valueFontSize}px`;
            if (out.valueFontWeight !== undefined) valStyle['font-weight'] = String(out.valueFontWeight);
            if (out.valueColor) valStyle['color'] = String(out.valueColor);
            // Replace or insert h1
            let inner = innerOld;
            const h1Re = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/i;
            const newH1 = `<h1 style=\"${toStyle(h1Style)}\">${esc(out.titleText || '')}</h1>`;
            if (h1Re.test(inner)) inner = inner.replace(h1Re, newH1);
            else inner = newH1 + inner;
            // Replace or insert kpi-value
            const kvRe = /<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i;
            const newKV = `<div class=\"kpi-value\" style=\"${toStyle(valStyle)}\">${esc(out.valueText || '')}</div>`;
            if (kvRe.test(inner)) inner = inner.replace(kvRe, newKV);
            else inner = inner.replace(newH1, newH1 + `\n        ${newKV}`);
            // Merge container styles
            const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
            const styleM = openAttrs.match(styleRe);
            const parseStyle = (s: string): Record<string,string> => {
              const outS: Record<string,string> = {};
              for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; outS[p.slice(0,i).trim()] = p.slice(i+1).trim(); }
              return outS;
            };
            const styleObj = styleM ? parseStyle(styleM[2] || styleM[3] || '') : {};
            if (out.backgroundColor) styleObj['background-color'] = String(out.backgroundColor);
            if (out.opacity !== undefined) styleObj['opacity'] = String(out.opacity);
            if (out.borderColor) styleObj['border-color'] = String(out.borderColor);
            if (typeof out.borderWidth === 'number') styleObj['border-width'] = `${out.borderWidth}px`;
            if (out.borderStyle) styleObj['border-style'] = String(out.borderStyle);
            if (typeof out.borderRadius === 'number') styleObj['border-radius'] = `${out.borderRadius}px`;
            let newOpenAttrs = openAttrs.replace(styleRe, '');
            newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
            const newOpenTag = `<article${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
            const newCode = src.replace(whole, newOpenTag + inner + `</article>`);
            visualBuilderActions.updateCode(newCode);
          } catch {}
          finally {
            setKpiModalOpen(false);
          }
        }}
      />

      
    </div>
  );
}
