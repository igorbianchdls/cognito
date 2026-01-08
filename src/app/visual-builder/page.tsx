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
import { QueryEngine } from '@/components/visual-builder/QueryEngine';
import { updateArticleQueryFull } from '@/components/visual-builder/commands/HelperEditorToDSL';

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

    // mount charts with simulated data, then fetch real data if querySpec provided
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

      // If querySpec present, resolve it and re-render with fetched data
      if (spec.querySpec) {
        QueryEngine.resolve(spec.querySpec, visualBuilderState.globalFilters).then((rows) => {
          if (!Array.isArray(rows) || rows.length === 0) return; // keep placeholder if backend returned no rows
          const commonFetched = { ...common, data: rows } as any;
          try {
            switch (spec.type) {
              case 'line': root.render(<LineChart {...commonFetched} />); break;
              case 'pie': root.render(<PieChart {...commonFetched} />); break;
              case 'area': root.render(<AreaChart {...commonFetched} enableArea={true} />); break;
              default: root.render(<BarChart {...commonFetched} />); break;
            }
          } catch { /* ignore render errors */ }
        }).catch(() => { /* ignore errors; keep placeholder */ });
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
        const ps = headerEl.querySelectorAll('p');
        const t = (ps[0]?.textContent?.trim() || headerEl.querySelector('h1')?.textContent?.trim() || '');
        const s = (ps[1]?.textContent?.trim() || '');
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

      // Make articles inside this section sortable (drag to reorder)
      try {
        const articles = Array.from(sec.querySelectorAll(':scope > article')) as HTMLElement[];
        // annotate original DSL index (order in code at render time)
        articles.forEach((art, i) => {
          art.dataset.dslIndex = String(i);
          // Add drag handle button (top-left) shown on hover
          art.style.position = art.style.position || 'relative';
          const handle = document.createElement('button');
          handle.setAttribute('type', 'button');
          handle.textContent = '⇅';
          handle.title = 'Arrastar';
          handle.style.position = 'absolute';
          handle.style.top = '8px';
          handle.style.left = '8px';
          handle.style.zIndex = '50';
          handle.style.padding = '4px 6px';
          handle.style.border = 'none';
          handle.style.borderRadius = '6px';
          handle.style.background = 'rgba(0,0,0,0.85)';
          handle.style.color = '#fff';
          handle.style.cursor = 'grab';
          handle.style.opacity = '0';
          handle.style.transition = 'opacity 120ms ease-in-out';
          handle.setAttribute('draggable', 'true');
          const enterH = () => { handle.style.opacity = '1'; };
          const leaveH = () => { handle.style.opacity = '0'; };
          art.addEventListener('mouseenter', enterH);
          art.addEventListener('mouseleave', leaveH);
          art.appendChild(handle);
          cleanupFns.push(() => {
            try { art.removeEventListener('mouseenter', enterH); } catch {}
            try { art.removeEventListener('mouseleave', leaveH); } catch {}
            try { art.removeChild(handle); } catch {}
          });
          // Drag cursor feedback during drag
          const downH = () => { handle.style.cursor = 'grabbing'; };
          const upH = () => { handle.style.cursor = 'grab'; };
          handle.addEventListener('mousedown', downH);
          window.addEventListener('mouseup', upH);
          cleanupFns.push(() => {
            try { handle.removeEventListener('mousedown', downH); } catch {}
            try { window.removeEventListener('mouseup', upH); } catch {}
          });
        });

        let dragging: HTMLElement | null = null;
        const onDragStart = (e: DragEvent) => {
          const handle = e.currentTarget as HTMLElement;
          const parentArt = handle?.parentElement as HTMLElement | null;
          if (!parentArt || parentArt.tagName.toLowerCase() !== 'article') return;
          dragging = parentArt;
          parentArt.classList.add('vb-dragging');
          try { e.dataTransfer?.setData('text/plain', parentArt.dataset.dslIndex || ''); } catch {}
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        };
        const onDragOver = (e: DragEvent) => {
          e.preventDefault();
          if (!dragging) return;
          const over = e.currentTarget as HTMLElement;
          if (!over || over === dragging) return;
          const rect = over.getBoundingClientRect();
          const before = (e.clientY < rect.top + rect.height / 2);
          const parent = over.parentElement as HTMLElement | null;
          if (!parent) return;
          if (before) parent.insertBefore(dragging, over);
          else parent.insertBefore(dragging, over.nextSibling);
        };
        const onDragEnd = (_e: DragEvent) => {
          if (!dragging) return;
          dragging.classList.remove('vb-dragging');
          // Compute new order from DOM
          const ordered = Array.from(sec.querySelectorAll(':scope > article')) as HTMLElement[];
          const orderIdx = ordered.map(a => a.dataset.dslIndex || '').filter(v => v !== '');
          dragging = null;
          if (!orderIdx.length) return;
          try {
            const src = String(visualBuilderState.code || '');
            const secId = sec.getAttribute('id') || '';
            if (!secId) return;
            const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`<section\\b([^>]*?\\bid=\\\"${esc(secId)}\\\"[^>]*)>([\\s\\S]*?)<\\/section>`, 'i');
            const m = src.match(re);
            if (!m) return;
            const whole = m[0];
            const openAttrs = m[1] || '';
            const innerOld = m[2] || '';
            // Extract article blocks from innerOld
            const articleRe = /<article\b([\s\S]*?)<\/article>/gi;
            const blocks: string[] = [];
            let am: RegExpExecArray | null;
            while ((am = articleRe.exec(innerOld)) !== null) {
              const full = am[0];
              blocks.push(full);
            }
            if (!blocks.length) return;
            // Reorder blocks using the new DOM order (indices map)
            const idxNums = orderIdx.map(s => Number(s)).filter(n => Number.isFinite(n));
            if (idxNums.some(n => n < 0 || n >= blocks.length)) return;
            const newInner = idxNums.map(i => blocks[i]).join('\n');
            const newOpen = `<section${openAttrs}>`;
            const next = src.replace(whole, newOpen + newInner + `</section>`);
            if (next !== src) visualBuilderActions.updateCode(next);
          } catch { /* ignore */ }
        };

        // Attach listeners
        for (const art of articles) {
          const handle = art.querySelector('button[draggable="true"]') as HTMLElement | null;
          if (handle) {
            handle.addEventListener('dragstart', onDragStart as any);
            handle.addEventListener('dragend', onDragEnd as any);
            cleanupFns.push(() => {
              try { handle.removeEventListener('dragstart', onDragStart as any); } catch {}
              try { handle.removeEventListener('dragend', onDragEnd as any); } catch {}
            });
          }
          art.addEventListener('dragover', onDragOver as any);
          cleanupFns.push(() => {
            try { art.removeEventListener('dragover', onDragOver as any); } catch {}
          });
        }
      } catch { /* ignore sortable setup */ }
    }

    // Article menu (Editar, Duplicar, Excluir) for KPI and Chart articles
    const setupArticleMenu = (art: HTMLElement, role: 'kpi' | 'chart') => {
      const sectionEl = art.closest('section[data-role="section"]') as HTMLElement | null;
      const artId = art.getAttribute('id') || '';
      if (!artId) return;
      art.style.position = art.style.position || 'relative';
      // Menu trigger button
      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.textContent = '⋮';
      menuBtn.title = 'Mais ações';
      menuBtn.style.position = 'absolute';
      menuBtn.style.top = '8px';
      menuBtn.style.right = '8px';
      menuBtn.style.zIndex = '60';
      menuBtn.style.padding = '4px 6px';
      menuBtn.style.border = 'none';
      menuBtn.style.borderRadius = '6px';
      menuBtn.style.background = 'rgba(0,0,0,0.85)';
      menuBtn.style.color = '#fff';
      menuBtn.style.cursor = 'pointer';
      menuBtn.style.opacity = '0';
      menuBtn.style.transition = 'opacity 120ms ease-in-out';
      const enter = () => { menuBtn.style.opacity = '1'; };
      const leave = () => { menuBtn.style.opacity = '0'; };
      art.addEventListener('mouseenter', enter);
      art.addEventListener('mouseleave', leave);
      art.appendChild(menuBtn);
      cleanupFns.push(() => {
        try { art.removeEventListener('mouseenter', enter); } catch {}
        try { art.removeEventListener('mouseleave', leave); } catch {}
        try { art.removeChild(menuBtn); } catch {}
      });

      // Popover menu
      const pop = document.createElement('div');
      pop.style.position = 'absolute';
      pop.style.top = '32px';
      pop.style.right = '8px';
      pop.style.zIndex = '70';
      pop.style.background = 'rgba(17,17,17,0.98)';
      pop.style.color = '#fff';
      pop.style.borderRadius = '8px';
      pop.style.padding = '4px';
      pop.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
      pop.style.display = 'none';
      const mkItem = (label: string) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.textContent = label;
        el.style.display = 'block';
        el.style.width = '160px';
        el.style.textAlign = 'left';
        el.style.padding = '8px 10px';
        el.style.border = 'none';
        el.style.background = 'transparent';
        el.style.color = '#fff';
        el.style.borderRadius = '6px';
        el.addEventListener('mouseenter', () => { el.style.background = 'rgba(255,255,255,0.08)'; });
        el.addEventListener('mouseleave', () => { el.style.background = 'transparent'; });
        return el;
      };
      const itemEdit = mkItem('Editar');
      const itemDup = mkItem('Duplicar');
      const itemDel = mkItem('Excluir');
      pop.appendChild(itemEdit); pop.appendChild(itemDup); pop.appendChild(itemDel);
      art.appendChild(pop);
      cleanupFns.push(() => { try { art.removeChild(pop); } catch {} });

      const closePop = () => { pop.style.display = 'none'; };
      const openPop = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); pop.style.display = 'block'; document.addEventListener('click', closePop, { once: true }); };
      menuBtn.addEventListener('click', openPop);
      cleanupFns.push(() => { try { menuBtn.removeEventListener('click', openPop); } catch {} });

      // Helpers
      const getSrc = () => String(visualBuilderState.code || '');
      const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const findSection = (code: string, id: string) => {
        const re = new RegExp(`<section\\b([^>]*?\\bid=\\\"${escRe(id)}\\\"[^>]*)>([\\s\\S]*?)<\\/section>`, 'i');
        const m = code.match(re); return { re, m } as const;
      };
      const findArticle = (code: string, id: string) => {
        const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escRe(id)}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
        const m = code.match(re); return { re, m } as const;
      };
      const genUniqueId = (base: string) => {
        const code = getSrc();
        const has = (idTry: string) => new RegExp(`<article\\b[^>]*\\bid=\\\"${escRe(idTry)}\\\"`).test(code) || new RegExp(`<Chart\\b[^>]*\\bid=\\\"${escRe(idTry)}\\\"`).test(code);
        let attempt = `${base}_copy`;
        let i = 2;
        while (has(attempt)) { attempt = `${base}_${i++}`; if (i > 999) break; }
        return attempt;
      };

      // Edit
      const onEdit = (e: MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); closePop();
        if (role === 'kpi') {
          const titleEl = (art.querySelector('p') || art.querySelector('h1')) as HTMLElement | null;
          const valEl = art.querySelector('.kpi-value');
          const parseStyle = (s: string | null | undefined): Record<string,string> => { const out: Record<string,string> = {}; if (!s) return out; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return out; };
          const tStyle = parseStyle(titleEl?.getAttribute('style'));
          const vStyle = parseStyle(valEl?.getAttribute('style'));
          const num = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
          setKpiModalArticleId(artId);
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
        } else {
          const mount = art.querySelector('[data-liquid-chart]') as HTMLElement | null;
          const chartId = mount?.getAttribute('data-liquid-chart') || '';
          const titleEl = (art.querySelector('p') || art.querySelector('h1')) as HTMLElement | null;
          const parseStyle = (s: string | null | undefined): Record<string,string> => { const out: Record<string,string> = {}; if (!s) return out; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return out; };
          const tStyle = parseStyle(titleEl?.getAttribute('style'));
          const artStyleObj = parseStyle(art.getAttribute('style'));
          const numPx = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
          // Parse query from source code
          const srcCode = getSrc();
          const { m: artMatch } = findArticle(srcCode, artId);
          let qInitial: { schema?: string; table?: string; measure?: string; dimension?: string; timeDimension?: string; from?: string; to?: string; limit?: number; order?: 'value DESC'|'value ASC'|'label ASC'|'label DESC'; where?: Array<{ col: string; op: string; val?: string; vals?: string; start?: string; end?: string }> } | undefined;
          if (artMatch) {
            const inner = artMatch[2] || '';
            const qPair = inner.match(/<query\b([^>]*)>([\s\S]*?)<\/query>/i);
            const qSelf = !qPair ? inner.match(/<query\b([^>]*)\/>/i) : null;
            const attrsStr = (qPair?.[1] || qSelf?.[1] || '').trim();
            const parseAttrs = (s: string): Record<string,string> => { const out: Record<string,string> = {}; const re=/(\w[\w-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g; let m: RegExpExecArray|null; while((m=re.exec(s))!==null){ out[m[1]]=(m[3]??m[4]??m[5]??'').trim(); } return out; };
            const qa = parseAttrs(attrsStr);
            const dimVal = (qa['dimension'] || qa['dimensions'] || qa['dimensao'] || qa['dimensoes'] || '').trim() || undefined;
            const lim = qa['limit'] && !Number.isNaN(Number(qa['limit'])) ? Number(qa['limit']) : undefined;
            const ord = (qa['order'] || qa['orderBy'] || qa['orderby'] || qa['ordenar'] || '').trim() || undefined;
            const timeDim = (qa['timedimension'] || qa['timeDimension'] || qa['datecolumn'] || qa['dateColumn'] || '').trim() || undefined;
            let whereRules: Array<{ col:string; op:string; val?:string; vals?:string; start?:string; end?:string }> | undefined = undefined;
            if (qPair) {
              const innerQ = qPair[2] || '';
              const wMatch = innerQ.match(/<where\b[^>]*>([\s\S]*?)<\/where>/i);
              if (wMatch) {
                const rulesStr = wMatch[1] || '';
                const ruleRe = /<rule\b([^>]*)\/>/gi; let rm: RegExpExecArray | null; const rules: any[] = [];
                while ((rm = ruleRe.exec(rulesStr)) !== null) { const ra = parseAttrs(rm[1] || ''); rules.push({ col: ra['col'] || '', op: ra['op'] || '=', val: ra['val'], vals: ra['vals'], start: ra['start'], end: ra['end'] }) }
                whereRules = rules;
              }
            }
            qInitial = { schema: qa['schema'] || undefined, table: qa['table'] || undefined, measure: (qa['measure'] || qa['measures'] || '').trim() || undefined, dimension: dimVal, timeDimension: timeDim, from: qa['from'] || undefined, to: qa['to'] || undefined, limit: lim, order: (ord as any) || undefined, where: whereRules };
          }
          setChartModalChartId(chartId);
          setChartModalInitial({
            titleText: titleEl?.textContent?.trim() || '',
            titleFontFamily: tStyle['font-family'] || '',
            titleFontSize: (tStyle['font-size'] ? Number(String(tStyle['font-size']).replace(/px$/,'')) : undefined),
            titleFontWeight: tStyle['font-weight'] || undefined,
            titleColor: tStyle['color'] || '#111827',
            backgroundColor: artStyleObj['background-color'] || '',
            opacity: artStyleObj['opacity'] ? Number(artStyleObj['opacity']) : undefined,
            borderColor: artStyleObj['border-color'] || '',
            borderWidth: numPx(artStyleObj['border-width']),
            borderStyle: artStyleObj['border-style'] as any,
            borderRadius: numPx(artStyleObj['border-radius']),
            query: qInitial,
          });
          setChartModalOpen(true);
        }
      };
      itemEdit.addEventListener('click', onEdit);
      cleanupFns.push(() => { try { itemEdit.removeEventListener('click', onEdit); } catch {} });

      // Duplicate
      const onDuplicate = (e: MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); closePop();
        try {
          const src = getSrc();
          const secId = sectionEl?.getAttribute('id') || '';
          if (!secId) return;
          const { m: mSec } = findSection(src, secId);
          if (!mSec) return;
          const secInner = mSec[2] || '';
          const { m: mArt } = findArticle(secInner, artId);
          if (!mArt) return;
          const artOpen = mArt[1] || '';
          let artInner = mArt[2] || '';
          const newArtId = genUniqueId(artId);
          let newArtOpen = artOpen.replace(/(id=\")[^\"]*(\")/i, `$1${newArtId}$2`);
          // Update internal Chart id if present
          const chartMatch = artInner.match(/<Chart\b([^>]*)>/i);
          if (chartMatch) {
            const attrs = chartMatch[1] || '';
            const idAttr = attrs.match(/\bid=\"([^\"]+)\"/i);
            const oldCId = idAttr?.[1];
            if (oldCId) artInner = artInner.replace(/(<Chart\b[^>]*?id=\")[^\"]*(\")/i, `$1${genUniqueId(oldCId)}$2`);
          }
          const artClone = `<article${newArtOpen}>${artInner}</article>`;
          const secInnerNew = secInner.replace(mArt[0], mArt[0] + `\n` + artClone);
          const wholeSec = mSec[0];
          const newSec = wholeSec.replace(secInner, secInnerNew);
          visualBuilderActions.updateCode(src.replace(wholeSec, newSec));
        } catch {}
      };
      itemDup.addEventListener('click', onDuplicate);
      cleanupFns.push(() => { try { itemDup.removeEventListener('click', onDuplicate); } catch {} });

      // Delete
      const onDelete = (e: MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); closePop();
        try {
          const src = getSrc();
          const secId = sectionEl?.getAttribute('id') || '';
          if (!secId) return;
          const { m: mSec } = findSection(src, secId);
          if (!mSec) return;
          const secInner = mSec[2] || '';
          const { m: mArt } = findArticle(secInner, artId);
          if (!mArt) return;
          const secInnerNew = secInner.replace(mArt[0], '').replace(/\n{3,}/g, '\n\n');
          const wholeSec = mSec[0];
          const newSec = wholeSec.replace(secInner, secInnerNew);
          visualBuilderActions.updateCode(src.replace(wholeSec, newSec));
        } catch {}
      };
      itemDel.addEventListener('click', onDelete);
      cleanupFns.push(() => { try { itemDel.removeEventListener('click', onDelete); } catch {} });
    };

    // Apply menu to articles
    const kpiArticles = Array.from(c.querySelectorAll('article[data-role="kpi"]')) as HTMLElement[];
    for (const art of kpiArticles) setupArticleMenu(art, 'kpi');
    const chartArticles = Array.from(c.querySelectorAll('article[data-role="chart"]')) as HTMLElement[];
    for (const art of chartArticles) setupArticleMenu(art, 'chart');

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

      // Compose new header inner HTML using <p> for title and subtitle
      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      let inner = innerOld;
      const styleRe2 = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      // Title (<p>, first p)
      {
        const matches = Array.from(inner.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi));
        const openAttrs = matches[0]?.[1] || inner.match(/<h1\b([^>]*)>/i)?.[1] || '';
        const noStyle = openAttrs.replace(styleRe2, '').replace(/\s+$/, '');
        const titleStyleStr = toStyle(h1Style);
        const newPOpen = `<p${noStyle ? ` ${noStyle}` : ''}${titleStyleStr ? ` style=\"${titleStyleStr}\"` : ''}>`;
        const newTitle = `${newPOpen}${esc(data.title || '')}</p>`;
        if (matches[0]) {
          inner = inner.replace(matches[0][0], newTitle);
        } else if (inner.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)) {
          inner = inner.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i, newTitle);
        } else {
          inner = newTitle + `\n` + inner;
        }
      }
      // Subtitle (<p>, second p)
      {
        const matches = Array.from(inner.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi));
        // target second p if available; else append
        const existing = matches[1]?.[0];
        const openAttrs2 = matches[1]?.[1] || '';
        const noStyle2 = openAttrs2.replace(styleRe2, '').replace(/\s+$/, '');
        const subStyleStr = toStyle(pStyle);
        const newPOpen2 = `<p${noStyle2 ? ` ${noStyle2}` : ''}${subStyleStr ? ` style=\"${subStyleStr}\"` : ''}>`;
        const newSub = `${newPOpen2}${esc(data.subtitle || '')}</p>`;
        if (existing) {
          inner = inner.replace(existing, newSub);
        } else {
          inner = inner + `\n      ${newSub}`;
        }
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
      {/* Global CSS for responsive stacking of sections (outside user Liquid) */}
      <style>{`@media (max-width: 640px){
        section[data-role="section"] { flex-direction: column !important; }
        section[data-role="section"] > article { flex: 1 1 auto !important; }
      }`}</style>
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
            // Replace or insert title (<p>)
            const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const pTitleRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
            const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
            const pTitleStyle: Record<string,string> = {};
            if (out.titleFontFamily) pTitleStyle['font-family'] = String(out.titleFontFamily);
            if (typeof out.titleFontSize === 'number') pTitleStyle['font-size'] = `${out.titleFontSize}px`;
            if (out.titleFontWeight !== undefined) pTitleStyle['font-weight'] = String(out.titleFontWeight);
            if (out.titleColor) pTitleStyle['color'] = String(out.titleColor);
            const newTitleP = `<p style=\"${toStyle(pTitleStyle)}\">${esc(out.titleText || '')}</p>`;
            let inner = innerOld;
            if (pTitleRe.test(inner)) inner = inner.replace(pTitleRe, newTitleP); else inner = newTitleP + `\n` + inner;
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
            let newCode = src.replace(whole, newOpenTag + inner + `</article>`);
            // If query was edited, upsert <query> (and optional <where>) inside the same article
            if (out.query) {
              try {
                const idMatch = openAttrs.match(/\bid\s*=\s*("([^"]+)"|'([^']+)')/i);
                const articleId = (idMatch?.[2] || idMatch?.[3] || '').trim();
                if (articleId) {
                  const q = out.query;
                  const { code: qCode } = updateArticleQueryFull(newCode, {
                    articleId,
                    query: {
                      schema: q.schema,
                      table: q.table,
                      measure: q.measure,
                      dimension: q.dimension,
                      timeDimension: q.timeDimension,
                      from: q.from,
                      to: q.to,
                      limit: typeof q.limit === 'number' ? q.limit : undefined,
                      order: q.order,
                      where: Array.isArray(q.where) ? q.where.map(r => ({ col: r.col || '', op: r.op || '=', val: r.val, vals: r.vals, start: r.start, end: r.end })) : undefined,
                    }
                  });
                  newCode = qCode;
                }
              } catch { /* ignore query upsert errors */ }
            }
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
              // Clean grid-only props when switching to flex
              if (displayValue === 'flex') {
                delete styleObj['grid-template-columns'];
              }
            }
            if (displayValue === 'grid' || wantsGridProps) {
              setIf('grid-template-columns', out.gridTemplateColumns);
              // Clean flex-only props when switching to grid
              if (displayValue === 'grid') {
                delete styleObj['flex-direction'];
                delete styleObj['flex-wrap'];
                delete styleObj['justify-content'];
                delete styleObj['align-items'];
              }
            }
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
            // Build title <p> style
            const pTitleStyle: Record<string,string> = {};
            if (out.titleFontFamily) pTitleStyle['font-family'] = String(out.titleFontFamily);
            if (typeof out.titleFontSize === 'number') pTitleStyle['font-size'] = `${out.titleFontSize}px`;
            if (out.titleFontWeight !== undefined) pTitleStyle['font-weight'] = String(out.titleFontWeight);
            if (out.titleColor) pTitleStyle['color'] = String(out.titleColor);
            // Build value style
            const valStyle: Record<string,string> = {};
            if (out.valueFontFamily) valStyle['font-family'] = String(out.valueFontFamily);
            if (typeof out.valueFontSize === 'number') valStyle['font-size'] = `${out.valueFontSize}px`;
            if (out.valueFontWeight !== undefined) valStyle['font-weight'] = String(out.valueFontWeight);
            if (out.valueColor) valStyle['color'] = String(out.valueColor);
            // Replace or insert h1
            let inner = innerOld;
            const pTitleRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
            const newTitleP = `<p style=\"${toStyle(pTitleStyle)}\">${esc(out.titleText || '')}</p>`;
            if (pTitleRe.test(inner)) inner = inner.replace(pTitleRe, newTitleP);
            else inner = newTitleP + inner;
            // Replace or insert kpi-value
            const kvRe = /<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i;
            const newKV = `<div class=\"kpi-value\" style=\"${toStyle(valStyle)}\">${esc(out.valueText || '')}</div>`;
            if (kvRe.test(inner)) inner = inner.replace(kvRe, newKV);
            else inner = inner.replace(newTitleP, newTitleP + `\n        ${newKV}`);
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
