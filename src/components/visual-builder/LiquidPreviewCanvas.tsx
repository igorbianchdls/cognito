"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LiquidParser } from "@/components/visual-builder/LiquidParser";
import { QueryEngine } from "@/components/visual-builder/QueryEngine";
import type { GlobalFilters } from "@/stores/visualBuilderStore";
import type { VBNivoThemeState } from "@/stores/visualBuilderNivoStore";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { PieChart } from "@/components/charts/PieChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";
import SectionEditorModal from "@/components/visual-builder/SectionEditorModal";
import ChartEditorModal from "@/components/visual-builder/ChartEditorModal";
import KpiEditorModal from "@/components/visual-builder/KpiEditorModal";

// Local shapes matching the modals' "initial" and "onSave" payloads
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
  backgroundColor?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
  borderRadius?: number;
  widthFr?: number;
};

type ChartInitial = {
  titleText: string;
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  backgroundColor?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
  borderRadius?: number;
  widthFr?: number;
  // query and chartProps intentionally omitted in preview minimal mode
};

type LiquidPreviewCanvasProps = {
  code: string;
  globalFilters?: GlobalFilters;
  defaults?: Partial<VBNivoThemeState>;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
  onChangeCode?: (next: string) => void;
};

const DEFAULTS: VBNivoThemeState = {
  enableGridX: false,
  enableGridY: true,
  showLegend: true,
  animate: true,
  motionConfig: "gentle",
  gridColor: "#f1f5f9",
  gridStrokeWidth: 1,
  axisFontFamily: "var(--vb-chart-font-family), Geist Mono, monospace",
  axisFontSize: 12,
  axisFontWeight: 400,
  axisTextColor: "#6b7280",
  axisLegendFontSize: 14,
  axisLegendFontWeight: 500,
  labelsFontFamily: "var(--vb-chart-font-family), Geist Mono, monospace",
  labelsFontSize: 11,
  labelsFontWeight: 500,
  labelsTextColor: "#1f2937",
  legendsFontFamily: "var(--vb-chart-font-family), Geist Mono, monospace",
  legendsFontSize: 12,
  legendsFontWeight: 400,
  legendsTextColor: "#6b7280",
  tooltipFontSize: 12,
  tooltipFontFamily: "var(--vb-chart-font-family), Geist Mono, monospace",
};

export default function LiquidPreviewCanvas({ code, globalFilters, defaults, className, style, interactive, onChangeCode }: LiquidPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Root[]>([]);
  // Interactive modal states
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionInitial, setSectionInitial] = useState<import("@/components/visual-builder/SectionEditorModal").SectionEditorInitial>({});
  const sectionEditingIdRef = useRef<string | null>(null);

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiInitial, setKpiInitial] = useState<KpiInitial>({ titleText: '', valueText: '' });
  const kpiEditingArticleIdRef = useRef<string | null>(null);

  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartInitial, setChartInitial] = useState<ChartInitial>({ titleText: '' });
  const chartEditingArticleIdRef = useRef<string | null>(null);
  const chartEditingChartIdRef = useRef<string | null>(null);

  const vb = useMemo<VBNivoThemeState>(() => ({ ...DEFAULTS, ...(defaults || {}) }), [defaults]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Cleanup previous mounts
    for (const r of rootsRef.current) {
      try { r.unmount(); } catch {}
    }
    rootsRef.current = [];
    el.innerHTML = "";

    const parsed = LiquidParser.parse(code);
    if (parsed.mode !== 'html') {
      el.innerHTML = '<div style="padding:12px;color:#6b7280;font-size:12px;">Preview disponível apenas para &lt;dashboard render="html"&gt;…&lt;/dashboard&gt;.</div>';
      return;
    }

    el.innerHTML = parsed.html || '';

    // Mount charts with simulated data first
    for (const spec of parsed.charts) {
      const mount = el.querySelector(`[data-liquid-chart="${spec.id}"]`) as HTMLElement | null;
      if (!mount) continue;
      if (!mount.style.height || mount.style.height === '') mount.style.height = (spec.height && Number.isFinite(spec.height) ? `${spec.height}px` : '320px');
      mount.style.width = mount.style.width || '100%';
      const root = createRoot(mount);
      rootsRef.current.push(root);

      const common: any = {
        data: spec.data,
        enableGridX: vb.enableGridX,
        enableGridY: vb.enableGridY,
        gridColor: vb.gridColor,
        gridStrokeWidth: vb.gridStrokeWidth,
        axisFontFamily: vb.axisFontFamily,
        axisFontSize: vb.axisFontSize,
        axisFontWeight: vb.axisFontWeight,
        axisTextColor: vb.axisTextColor,
        axisLegendFontSize: vb.axisLegendFontSize,
        axisLegendFontWeight: vb.axisLegendFontWeight,
        labelsFontFamily: vb.labelsFontFamily,
        labelsFontSize: vb.labelsFontSize,
        labelsFontWeight: vb.labelsFontWeight,
        labelsTextColor: vb.labelsTextColor,
        legendsFontFamily: vb.legendsFontFamily,
        legendsFontSize: vb.legendsFontSize,
        legendsFontWeight: vb.legendsFontWeight,
        legendsTextColor: vb.legendsTextColor,
        animate: vb.animate,
        motionConfig: vb.motionConfig,
        containerClassName: 'nivo-container',
        containerBorderVariant: 'none',
        containerPadding: 0,
        containerBorderRadius: 0,
        backgroundColor: 'transparent',
        containerBackground: 'transparent',
      };

      switch (spec.type) {
        case 'line': root.render(<LineChart {...common} />); break;
        case 'pie': root.render(<PieChart {...common} />); break;
        case 'area': root.render(<AreaChart {...common} enableArea={true} />); break;
        case 'groupedbar': root.render(<GroupedBarChart data={spec.data as any} />); break;
        default: {
          const barBase: any = {
            containerClassName: 'nivo-container',
            containerBorderVariant: 'none',
            containerPadding: 0,
            containerBorderRadius: 0,
            backgroundColor: 'transparent',
            containerBackground: 'transparent',
          };
          const barProps: any = { ...barBase, ...(spec as any).props, data: spec.data };
          root.render(<BarChart {...barProps} />);
          break;
        }
      }

      // fetch data if querySpec exists
      if (spec.querySpec) {
        QueryEngine.resolve(spec.querySpec, globalFilters as GlobalFilters).then((rows) => {
          if (!Array.isArray(rows) || rows.length === 0) return;
          try {
            switch (spec.type) {
              case 'line': root.render(<LineChart {...common} data={rows} />); break;
              case 'pie': root.render(<PieChart {...common} data={rows} />); break;
              case 'area': root.render(<AreaChart {...common} data={rows} enableArea={true} />); break;
              case 'groupedbar': root.render(<GroupedBarChart data={rows as any} />); break;
              default: {
                const barBase: any = {
                  containerClassName: 'nivo-container',
                  containerBorderVariant: 'none',
                  containerPadding: 0,
                  containerBorderRadius: 0,
                  backgroundColor: 'transparent',
                  containerBackground: 'transparent',
                };
                const barProps: any = { ...barBase, ...(spec as any).props, data: rows };
                root.render(<BarChart {...barProps} />);
                break;
              }
            }
          } catch {}
        }).catch(() => { /* ignore */ });
      }
    }

    // Interactive triggers (edit only)
    const cleanups: Array<() => void> = [];
    if (interactive && parsed.mode === 'html') {
      const parseStyle = (s: string | null | undefined): Record<string, string> => {
        const out: Record<string, string> = {};
        if (!s) return out;
        for (const part of s.split(';')) {
          const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue;
          out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
        }
        return out;
      };
      const numPx = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/, '')) : (v ? Number(v) : undefined));

      // Section overlay
      const sections = Array.from(el.querySelectorAll('section[data-role="section"]')) as HTMLElement[];
      for (const sec of sections) {
        const label = document.createElement('button');
        label.type = 'button'; label.textContent = 'Editar'; label.title = 'Editar';
        Object.assign(label.style, { position: 'absolute', top: '8px', right: '8px', zIndex: '50', background: '#2563eb', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px', opacity: '0', cursor: 'pointer', transition: 'opacity 120ms ease-in-out' });
        sec.style.position = sec.style.position || 'relative';
        const enter = () => { sec.style.outline = '2px solid #2563eb'; label.style.opacity = '1'; };
        const leave = () => { sec.style.outline = ''; label.style.opacity = '0'; };
        const click = (e: MouseEvent) => {
          e.preventDefault(); e.stopPropagation();
          const id = sec.getAttribute('id') || '';
          sectionEditingIdRef.current = id || null;
          const st = parseStyle(sec.getAttribute('style'));
          const computedDisplay = (() => {
            try {
              const v = (sec.style?.display || (typeof window !== 'undefined' ? window.getComputedStyle(sec).display : '') || '').trim();
              return v.includes('grid') ? 'grid' : (v.includes('flex') ? 'flex' : undefined);
            } catch { return undefined; }
          })();
          setSectionInitial({
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
          });
          setSectionModalOpen(true);
        };
        sec.addEventListener('mouseenter', enter);
        sec.addEventListener('mouseleave', leave);
        label.addEventListener('click', click);
        sec.appendChild(label);
        cleanups.push(() => {
          try { sec.removeEventListener('mouseenter', enter); } catch {}
          try { sec.removeEventListener('mouseleave', leave); } catch {}
          try { label.removeEventListener('click', click); } catch {}
          try { sec.removeChild(label); } catch {}
        });
      }

      // Article menu (edit/duplicate/delete)
      const arts = Array.from(el.querySelectorAll('article[data-role]')) as HTMLElement[];
      for (const art of arts) {
        const role = (art.getAttribute('data-role') || '').toLowerCase();
        if (role !== 'kpi' && role !== 'chart') continue;
        art.style.position = art.style.position || 'relative';
        const menuBtn = document.createElement('button');
        Object.assign(menuBtn, { type: 'button' });
        menuBtn.textContent = '⋮'; menuBtn.title = 'Mais ações';
        Object.assign(menuBtn.style, { position: 'absolute', top: '8px', right: '8px', zIndex: '60', padding: '4px 6px', border: 'none', borderRadius: '6px', background: 'rgba(0,0,0,0.85)', color: '#fff', cursor: 'pointer', opacity: '0', transition: 'opacity 120ms ease-in-out' });
        const enter = () => { menuBtn.style.opacity = '1'; };
        const leave = () => { menuBtn.style.opacity = '0'; };
        art.addEventListener('mouseenter', enter);
        art.addEventListener('mouseleave', leave);
        art.appendChild(menuBtn);
        const pop = document.createElement('div');
        Object.assign(pop.style, { position: 'absolute', top: '32px', right: '8px', zIndex: '70', background: 'rgba(17,17,17,0.98)', color: '#fff', borderRadius: '8px', padding: '4px', boxShadow: '0 6px 16px rgba(0,0,0,0.35)', display: 'none' });
        const itemEdit = document.createElement('button');
        Object.assign(itemEdit, { type: 'button' }); itemEdit.textContent = 'Editar';
        Object.assign(itemEdit.style, { display: 'block', width: '160px', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', color: '#fff', borderRadius: '6px' });
        itemEdit.addEventListener('mouseenter', () => { itemEdit.style.background = 'rgba(255,255,255,0.08)'; });
        itemEdit.addEventListener('mouseleave', () => { itemEdit.style.background = 'transparent'; });
        pop.appendChild(itemEdit);

        const itemDuplicate = document.createElement('button');
        Object.assign(itemDuplicate, { type: 'button' }); itemDuplicate.textContent = 'Duplicar';
        Object.assign(itemDuplicate.style, { display: 'block', width: '160px', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', color: '#fff', borderRadius: '6px' });
        itemDuplicate.addEventListener('mouseenter', () => { itemDuplicate.style.background = 'rgba(255,255,255,0.08)'; });
        itemDuplicate.addEventListener('mouseleave', () => { itemDuplicate.style.background = 'transparent'; });
        pop.appendChild(itemDuplicate);

        const itemDelete = document.createElement('button');
        Object.assign(itemDelete, { type: 'button' }); itemDelete.textContent = 'Excluir';
        Object.assign(itemDelete.style, { display: 'block', width: '160px', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', color: '#fff', borderRadius: '6px' });
        itemDelete.addEventListener('mouseenter', () => { itemDelete.style.background = 'rgba(255,255,255,0.08)'; });
        itemDelete.addEventListener('mouseleave', () => { itemDelete.style.background = 'transparent'; });
        pop.appendChild(itemDelete);
        art.appendChild(pop);
        const closePop = () => { pop.style.display = 'none'; };
        const openPop = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); pop.style.display = 'block'; document.addEventListener('click', closePop, { once: true }); };
        menuBtn.addEventListener('click', openPop);
        const onEdit = (e: MouseEvent) => {
          e.preventDefault(); e.stopPropagation(); closePop();
          const artId = art.getAttribute('id') || '';
          const parseS = parseStyle;
          if (role === 'kpi') {
            const titleEl = (art.querySelector('p') || art.querySelector('h1')) as HTMLElement | null;
            const valEl = art.querySelector('.kpi-value') as HTMLElement | null;
            const tStyle = parseS(titleEl?.getAttribute('style'));
            const vStyle = parseS(valEl?.getAttribute('style'));
            const artStyle = parseS(art.getAttribute('style'));
            kpiEditingArticleIdRef.current = artId || null;
            setKpiInitial({
              titleText: titleEl?.textContent?.trim() || '',
              titleFontFamily: tStyle['font-family'] || '',
              titleFontSize: numPx(tStyle['font-size']),
              titleFontWeight: tStyle['font-weight'] || undefined,
              titleColor: tStyle['color'] || '#111827',
              valueText: valEl?.textContent?.trim() || '',
              valueFontFamily: vStyle['font-family'] || '',
              valueFontSize: numPx(vStyle['font-size']),
              valueFontWeight: vStyle['font-weight'] || undefined,
              valueColor: vStyle['color'] || '#111827',
              widthFr: (artStyle['--fr'] ? Number(artStyle['--fr']) : undefined) || 1,
            });
            setKpiModalOpen(true);
          } else {
            const titleEl = (art.querySelector('p') || art.querySelector('h1')) as HTMLElement | null;
            const tStyle = parseS(titleEl?.getAttribute('style'));
            const artStyle = parseS(art.getAttribute('style'));
            const mount = art.querySelector('[data-liquid-chart]') as HTMLElement | null;
            const chartId = mount?.getAttribute('data-liquid-chart') || '';
            chartEditingArticleIdRef.current = artId || null;
            chartEditingChartIdRef.current = chartId || null;
            setChartInitial({
              titleText: titleEl?.textContent?.trim() || '',
              titleFontFamily: tStyle['font-family'] || '',
              titleFontSize: numPx(tStyle['font-size']),
              titleFontWeight: tStyle['font-weight'] || undefined,
              titleColor: tStyle['color'] || '#111827',
              backgroundColor: artStyle['background-color'] || '',
              opacity: artStyle['opacity'] ? Number(artStyle['opacity']) : undefined,
              borderColor: artStyle['border-color'] || '',
              borderWidth: numPx(artStyle['border-width']),
              borderStyle: artStyle['border-style'] as any,
              borderRadius: numPx(artStyle['border-radius']),
              widthFr: (artStyle['--fr'] ? Number(artStyle['--fr']) : undefined) || 1,
            });
            setChartModalOpen(true);
          }
        };
        itemEdit.addEventListener('click', onEdit);

        const onDuplicate = (e: MouseEvent) => {
          e.preventDefault(); e.stopPropagation(); closePop();
          try {
            if (!onChangeCode) return;
            const artId = art.getAttribute('id') || '';
            let chartId: string | undefined;
            if (role === 'chart') {
              const mount = art.querySelector('[data-liquid-chart]') as HTMLElement | null;
              chartId = mount?.getAttribute('data-liquid-chart') || undefined;
            }
            const next = duplicateArticle(code, artId, chartId);
            if (next && next !== code) onChangeCode(next);
          } catch {}
        };
        itemDuplicate.addEventListener('click', onDuplicate);

        const onDelete = (e: MouseEvent) => {
          e.preventDefault(); e.stopPropagation(); closePop();
          try {
            if (!onChangeCode) return;
            const artId = art.getAttribute('id') || '';
            if (typeof window !== 'undefined' && !window.confirm('Excluir este card?')) return;
            const next = deleteArticle(code, artId);
            if (next && next !== code) onChangeCode(next);
          } catch {}
        };
        itemDelete.addEventListener('click', onDelete);
        cleanups.push(() => {
          try { art.removeEventListener('mouseenter', enter); } catch {}
          try { art.removeEventListener('mouseleave', leave); } catch {}
          try { menuBtn.removeEventListener('click', openPop); } catch {}
          try { itemEdit.removeEventListener('click', onEdit); } catch {}
          try { itemDuplicate.removeEventListener('click', onDuplicate); } catch {}
          try { itemDelete.removeEventListener('click', onDelete); } catch {}
          try { art.removeChild(menuBtn); } catch {}
          try { art.removeChild(pop); } catch {}
        });
      }
    }

    return () => {
      for (const r of rootsRef.current) {
        try { r.unmount(); } catch {}
      }
      rootsRef.current = [];
      try { el.innerHTML = ""; } catch {}
      // additional interactive cleanups handled above
    };
  }, [code, globalFilters, vb, interactive]);

  // Minimal rewrites for save
  const deleteArticle = (src: string, articleId: string): string => {
    try {
      const escId = articleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
      const m = src.match(re); if (!m) return src;
      const whole = m[0];
      return src.replace(whole, '');
    } catch { return src; }
  };

  const duplicateArticle = (src: string, articleId: string, chartId?: string): string => {
    try {
      const escId = articleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
      const m = src.match(re); if (!m) return src;
      const whole = m[0]; const openAttrs = m[1] || ''; const inner = m[2] || '';

      const existsArticleId = (id: string) => new RegExp(`<article\\b[^>]*\\bid=\\\"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\"`, 'i').test(src);
      const makeUnique = (base: string) => {
        let n = 2; let candidate = `${base}-copy`;
        if (!existsArticleId(candidate)) return candidate;
        while (existsArticleId(candidate = `${base}-${n}`)) n++;
        return candidate;
      };
      const newArticleId = makeUnique(articleId);

      // Replace article id in open attrs
      const newOpenAttrs = openAttrs.replace(/id\s*=\s*("([^"]*)"|'([^']*)')/i, (_mm, _q, d1, d2) => `id=\"${newArticleId}\"`);

      // Replace chart id if present
      let newInner = inner;
      if (chartId) {
        const existsChartId = (id: string) => new RegExp(`<(?:Chart|chart)\\b[^>]*\\bid=\\\"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\"`, 'i').test(src);
        const makeChartUnique = (base: string) => {
          let n = 2; let candidate = `${base}-copy`;
          if (!existsChartId(candidate)) return candidate;
          while (existsChartId(candidate = `${base}-${n}`)) n++;
          return candidate;
        };
        const newChartId = makeChartUnique(chartId);
        newInner = newInner.replace(new RegExp(`(id\\s*=\\s*")${chartId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\")`, 'gi'), `$1${newChartId}$2`)
                           .replace(new RegExp(`(id\\s*=\\s*')${chartId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\')`, 'gi'), `$1${newChartId}$2`);
      }

      const dupWhole = `<article${newOpenAttrs}>${newInner}</article>`;
      // Insert the duplicate right after the original
      return src.replace(whole, `${whole}\n${dupWhole}`);
    } catch { return src; }
  };

  const rewriteSection = (src: string, id: string, out: import("@/components/visual-builder/SectionEditorModal").SectionEditorInitial) => {
    try {
      const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<section\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/section>`, 'i');
      const m = src.match(re); if (!m) return src;
      const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const parse = (s: string) => { const o: Record<string,string> = {}; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':' ); if (i === -1) continue; o[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return o; };
      const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
      const styleObj = (() => { const ms = openAttrs.match(styleRe); return ms ? parse(ms[2] || ms[3] || '') : {}; })();
      const setIf = (k: string, v?: string | number) => { if (v !== undefined && v !== '') styleObj[k] = String(v); };
      const wantsFlex = out.flexDirection !== undefined || out.flexWrap !== undefined || out.justifyContent !== undefined || out.alignItems !== undefined;
      const wantsGrid = out.gridTemplateColumns !== undefined;
      const display = out.display || (wantsFlex ? 'flex' : (wantsGrid ? 'grid' : undefined));
      setIf('display', display);
      setIf('gap', out.gap !== undefined ? `${out.gap}px` : undefined);
      if (display === 'flex' || wantsFlex) {
        setIf('flex-direction', out.flexDirection);
        setIf('flex-wrap', out.flexWrap);
        setIf('justify-content', out.justifyContent);
        setIf('align-items', out.alignItems);
        if (display === 'flex') delete styleObj['grid-template-columns'];
      }
      if (display === 'grid' || wantsGrid) {
        setIf('grid-template-columns', out.gridTemplateColumns);
        if (display === 'grid') { delete styleObj['flex-direction']; delete styleObj['flex-wrap']; delete styleObj['justify-content']; delete styleObj['align-items']; }
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
      return src.replace(whole, newOpenTag + innerOld + `</section>`);
    } catch { return src; }
  };

  const rewriteKpi = (src: string, id: string, out: KpiInitial) => {
    try {
      const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
      const m = src.match(re); if (!m) return src; const whole = m[0]; const openAttrs = m[1] || ''; let inner = m[2] || '';
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const parse = (s: string) => { const o: Record<string,string> = {}; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':' ); if (i === -1) continue; o[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return o; };
      const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
      const styleObj = (() => { const ms = openAttrs.match(styleRe); return ms ? parse(ms[2] || ms[3] || '') : {}; })();
      if (typeof out.widthFr === 'number' && !Number.isNaN(out.widthFr)) styleObj['--fr'] = String(out.widthFr);
      if (!styleObj['flex']) styleObj['flex'] = 'var(--fr, 1) 1 0%';
      if (!styleObj['min-width']) styleObj['min-width'] = '0';
      const pTitleRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
      const titleStyle: Record<string,string> = {};
      if (out.titleFontFamily) titleStyle['font-family'] = String(out.titleFontFamily);
      if (typeof out.titleFontSize === 'number') titleStyle['font-size'] = `${out.titleFontSize}px`;
      if (out.titleFontWeight !== undefined) titleStyle['font-weight'] = String(out.titleFontWeight);
      if (out.titleColor) titleStyle['color'] = String(out.titleColor);
      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const newTitle = `<p style=\"${toStyle(titleStyle)}\">${esc(out.titleText || '')}</p>`;
      if (pTitleRe.test(inner)) inner = inner.replace(pTitleRe, newTitle); else inner = newTitle + `\n` + inner;
      // KPI value
      inner = inner.replace(/<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i, (_m, tag) => {
        const valStyle: Record<string,string> = {};
        if (out.valueFontFamily) valStyle['font-family'] = String(out.valueFontFamily);
        if (typeof out.valueFontSize === 'number') valStyle['font-size'] = `${out.valueFontSize}px`;
        if (out.valueFontWeight !== undefined) valStyle['font-weight'] = String(out.valueFontWeight);
        if (out.valueColor) valStyle['color'] = String(out.valueColor);
        return `<${tag} class=\"kpi-value\" style=\"${toStyle(valStyle)}\">${esc(out.valueText || '')}</${tag}>`;
      });
      let newOpenAttrs = openAttrs.replace(styleRe, ''); newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
      const newOpenTag = `<article${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
      return src.replace(whole, newOpenTag + inner + `</article>`);
    } catch { return src; }
  };

  const rewriteChartBasic = (src: string, articleId: string, out: ChartInitial) => {
    try {
      const escId = articleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
      const m = src.match(re); if (!m) return src; const whole = m[0]; const openAttrs = m[1] || ''; let inner = m[2] || '';
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const parse = (s: string) => { const o: Record<string,string> = {}; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':' ); if (i === -1) continue; o[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return o; };
      const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
      const styleObj = (() => { const ms = openAttrs.match(styleRe); return ms ? parse(ms[2] || ms[3] || '') : {}; })();
      const setIf = (k: string, v?: string | number) => { if (v !== undefined && v !== '') styleObj[k] = String(v); };
      if (typeof out.widthFr === 'number' && !Number.isNaN(out.widthFr)) styleObj['--fr'] = String(out.widthFr);
      if (!styleObj['flex']) styleObj['flex'] = 'var(--fr, 1) 1 0%';
      if (!styleObj['min-width']) styleObj['min-width'] = '0';
      setIf('background-color', out.backgroundColor);
      setIf('opacity', out.opacity !== undefined ? out.opacity : undefined);
      setIf('border-color', out.borderColor);
      setIf('border-width', out.borderWidth !== undefined ? `${out.borderWidth}px` : undefined);
      setIf('border-style', out.borderStyle);
      setIf('border-radius', out.borderRadius !== undefined ? `${out.borderRadius}px` : undefined);
      let newOpenAttrs = openAttrs.replace(styleRe, ''); newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
      const newOpenTag = `<article${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
      const pTitleRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
      const titleStyle: Record<string,string> = {};
      if (out.titleFontFamily) titleStyle['font-family'] = String(out.titleFontFamily);
      if (typeof out.titleFontSize === 'number') titleStyle['font-size'] = `${out.titleFontSize}px`;
      if (out.titleFontWeight !== undefined) titleStyle['font-weight'] = String(out.titleFontWeight);
      if (out.titleColor) titleStyle['color'] = String(out.titleColor);
      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const newTitle = `<p style=\"${toStyle(titleStyle)}\">${esc(out.titleText || '')}</p>`;
      if (pTitleRe.test(inner)) inner = inner.replace(pTitleRe, newTitle); else inner = newTitle + `\n` + inner;
      return src.replace(whole, newOpenTag + inner + `</article>`);
    } catch { return src; }
  };

  return (
    <>
      <div ref={containerRef} className={className} style={style} />
      {interactive && (
        <>
          <SectionEditorModal
            isOpen={sectionModalOpen}
            initial={sectionInitial}
            onClose={() => setSectionModalOpen(false)}
            onSave={(out) => {
              try {
                if (!onChangeCode) { setSectionModalOpen(false); return; }
                const id = sectionEditingIdRef.current || '';
                if (!id) { setSectionModalOpen(false); return; }
                const next = rewriteSection(code, id, out);
                onChangeCode(next);
              } finally { setSectionModalOpen(false); }
            }}
          />
          <KpiEditorModal
            isOpen={kpiModalOpen}
            initial={kpiInitial}
            onClose={() => setKpiModalOpen(false)}
            onSave={(out) => {
              try {
                if (!onChangeCode) { setKpiModalOpen(false); return; }
                const id = kpiEditingArticleIdRef.current || '';
                if (!id) { setKpiModalOpen(false); return; }
                const next = rewriteKpi(code, id, out);
                onChangeCode(next);
              } finally { setKpiModalOpen(false); }
            }}
          />
          <ChartEditorModal
            isOpen={chartModalOpen}
            initial={chartInitial}
            onClose={() => setChartModalOpen(false)}
            onSave={(out) => {
              try {
                if (!onChangeCode) { setChartModalOpen(false); return; }
                const artId = chartEditingArticleIdRef.current || '';
                if (!artId) { setChartModalOpen(false); return; }
                const next = rewriteChartBasic(code, artId, out);
                onChangeCode(next);
              } finally { setChartModalOpen(false); }
            }}
          />
        </>
      )}
    </>
  );
}
