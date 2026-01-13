'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import { LiquidParser } from '@/components/visual-builder/LiquidParser';
import SectionEditorModal from '@/components/visual-builder/SectionEditorModal';
import KpiEditorModal from '@/components/visual-builder/KpiEditorModal';
import ChartEditorModal from '@/components/visual-builder/ChartEditorModal';
import { createRoot, type Root } from 'react-dom/client';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';

export default function PreviewPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  // Interactive modals (preview-only)
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
    borderStyle?: 'solid'|'dashed'|'dotted'|'';
    borderRadius?: number;
  };
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionModalInitial, setSectionModalInitial] = useState<import('@/components/visual-builder/SectionEditorModal').SectionEditorInitial>({});
  const sectionEditingIdRef = useRef<string | null>(null);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalInitial, setKpiModalInitial] = useState<KpiInitial>({ titleText: '', valueText: '' });
  const kpiEditingArticleIdRef = useRef<string | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartModalInitial, setChartModalInitial] = useState<ChartInitial>({ titleText: '' });
  const chartEditingArticleIdRef = useRef<string | null>(null);
  const currentThemeName: ThemeName = (() => {
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
  })();

  // Initialize store on mount
  useEffect(() => {
    visualBuilderActions.initialize();
  }, []);

  const handleFilterChange = useCallback((filters: import('@/stores/visualBuilderStore').GlobalFilters) => {
    setIsFilterLoading(true);
    visualBuilderActions.updateGlobalDateInCode(filters);
    setTimeout(() => setIsFilterLoading(false), 600);
  }, []);

  // --- HTML puro (sem parser): renderiza o HTML como-is e troca apenas <chart> por componentes React
  const code = String(visualBuilderState.code || '').trim();
  const dashboardOpen = useMemo(() => code.match(/<dashboard\b([^>]*)>/i), [code]);
  const htmlMode = useMemo(() => {
    if (!code.startsWith('<')) return false;
    const attrs = dashboardOpen?.[1] || '';
    // aceita render=html, render='html' ou render="html"
    return /\brender\s*=\s*(?:"|')?(?:html|raw)(?:"|')?/i.test(attrs);
  }, [code, dashboardOpen]);
  const htmlRef = useRef<HTMLDivElement>(null);
  const reactRootsRef = useRef<Root[]>([]);

  useEffect(() => {
    if (!htmlMode) return;
    const c = htmlRef.current; if (!c) return;
    // cleanup previous
    for (const r of reactRootsRef.current) { try { r.unmount(); } catch {} }
    reactRootsRef.current = [];
    const parsed = LiquidParser.parse(code);
    c.innerHTML = '';
    c.innerHTML = parsed.html;
    // mount charts
    for (const spec of parsed.charts) {
      const mount = c.querySelector(`[data-liquid-chart="${spec.id}"]`) as HTMLElement | null;
      if (!mount) continue; if (!mount.style.height || mount.style.height === '') mount.style.height = (spec.height && Number.isFinite(spec.height) ? `${spec.height}px` : '320px'); mount.style.width = mount.style.width || '100%';
      const root = createRoot(mount); reactRootsRef.current.push(root);
      const common = { data: spec.data, containerClassName: 'nivo-container', containerBorderVariant: 'none', containerPadding: 0, containerBorderRadius: 0, backgroundColor: 'transparent', containerBackground: 'transparent' } as any;
      switch (spec.type) { case 'line': root.render(<LineChart {...common} />); break; case 'pie': root.render(<PieChart {...common} />); break; case 'area': root.render(<AreaChart {...common} enableArea={true} />); break; default: { const barBase = { containerClassName:'nivo-container', containerBorderVariant:'none', containerPadding:0, containerBorderRadius:0, backgroundColor:'transparent', containerBackground:'transparent' } as any; const barProps = { ...barBase, ...(spec as any).props, data: spec.data } as any; root.render(<BarChart {...barProps} />); break; } }
    }
    // interactive triggers
    const parseStyle = (s?: string | null) => { const out: Record<string,string> = {}; if (!s) return out; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; out[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return out; };
    const numPx = (v?: string) => (v && /px$/.test(v) ? Number(v.replace(/px$/,'')) : (v ? Number(v) : undefined));
    const cleanups: Array<() => void> = [];
    // Section edit button
    const sections = Array.from(c.querySelectorAll('section[data-role="section"]')) as HTMLElement[];
    for (const sec of sections) {
      const btn = document.createElement('button'); btn.type='button'; btn.textContent='Editar'; btn.title='Editar'; Object.assign(btn.style,{ position:'absolute', top:'8px', right:'8px', zIndex:'50', background:'#2563eb', color:'#fff', padding:'4px 8px', border:'none', borderRadius:'6px', fontSize:'12px', opacity:'0', cursor:'pointer', transition:'opacity 120ms ease-in-out' }); sec.style.position = sec.style.position || 'relative';
      const enter = () => { sec.style.outline = '2px solid #2563eb'; btn.style.opacity='1'; }; const leave = () => { sec.style.outline=''; btn.style.opacity='0'; };
      const click = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); sectionEditingIdRef.current = sec.getAttribute('id') || ''; const st = parseStyle(sec.getAttribute('style')); const computedDisplay = (()=>{ try{ const v=(sec.style?.display||window.getComputedStyle(sec).display||'').trim(); return v.includes('grid')?'grid':(v.includes('flex')?'flex':undefined);}catch{return undefined;} })(); setSectionModalInitial({ display:(st['display'] as any)||computedDisplay, gap:numPx(st['gap']), flexDirection:(st['flex-direction'] as any)||undefined, flexWrap:(st['flex-wrap'] as any)||undefined, justifyContent:(st['justify-content'] as any)||undefined, alignItems:(st['align-items'] as any)||undefined, gridTemplateColumns: st['grid-template-columns'] || undefined, padding:numPx(st['padding']), margin:numPx(st['margin']), backgroundColor: st['background-color'] || undefined, opacity: st['opacity']?Number(st['opacity']):undefined, borderColor: st['border-color']||undefined, borderWidth: numPx(st['border-width']), borderStyle:(st['border-style'] as any)||undefined, borderRadius:numPx(st['border-radius']) }); setSectionModalOpen(true); };
      sec.addEventListener('mouseenter', enter); sec.addEventListener('mouseleave', leave); btn.addEventListener('click', click); sec.appendChild(btn);
      cleanups.push(()=>{ try{ sec.removeEventListener('mouseenter', enter);}catch{}; try{ sec.removeEventListener('mouseleave', leave);}catch{}; try{ btn.removeEventListener('click', click);}catch{}; try{ sec.removeChild(btn);}catch{}; });
    }
    // Article menu
    const arts = Array.from(c.querySelectorAll('article[data-role]')) as HTMLElement[];
    for (const art of arts) {
      const role = (art.getAttribute('data-role') || '').toLowerCase(); if (role!=='kpi' && role!=='chart') continue; art.style.position = art.style.position || 'relative';
      const trigger = document.createElement('button'); trigger.type='button'; trigger.textContent='⋮'; trigger.title='Mais ações'; Object.assign(trigger.style,{ position:'absolute', top:'8px', right:'8px', zIndex:'60', padding:'4px 6px', border:'none', borderRadius:'6px', background:'rgba(0,0,0,0.85)', color:'#fff', cursor:'pointer', opacity:'0', transition:'opacity 120ms ease-in-out' }); const enter=()=>{trigger.style.opacity='1';}; const leave=()=>{trigger.style.opacity='0';}; art.addEventListener('mouseenter', enter); art.addEventListener('mouseleave', leave); art.appendChild(trigger);
      const pop = document.createElement('div'); Object.assign(pop.style,{ position:'absolute', top:'32px', right:'8px', zIndex:'70', background:'rgba(17,17,17,0.98)', color:'#fff', borderRadius:'8px', padding:'4px', boxShadow:'0 6px 16px rgba(0,0,0,0.35)', display:'none' }); const mkItem=(label:string)=>{ const el=document.createElement('button'); el.type='button'; el.textContent=label; Object.assign(el.style,{display:'block',width:'160px',textAlign:'left',padding:'8px 10px',border:'none',background:'transparent',color:'#fff',borderRadius:'6px'}); el.addEventListener('mouseenter',()=>{el.style.background='rgba(255,255,255,0.08)';}); el.addEventListener('mouseleave',()=>{el.style.background='transparent';}); return el; };
      const itemEdit = mkItem('Editar'); const itemDup = mkItem('Duplicar'); const itemDel = mkItem('Excluir'); pop.appendChild(itemEdit); pop.appendChild(itemDup); pop.appendChild(itemDel); art.appendChild(pop);
      const closePop=()=>{pop.style.display='none';}; const openPop=(e:MouseEvent)=>{ e.preventDefault(); e.stopPropagation(); pop.style.display='block'; document.addEventListener('click', closePop, { once:true }); };
      trigger.addEventListener('click', openPop);
      // helpers for code update
      const getSrc=()=>String(visualBuilderState.code||''); const escRe=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const findSection=(code:string,id:string)=>{ const re=new RegExp(`<section\\b([^>]*?\\bid=\\\"${escRe(id)}\\\"[^>]*)>([\\s\\S]*?)<\\/section>`,'i'); const m=code.match(re); return {re,m} as const; }; const findArticle=(code:string,id:string)=>{ const re=new RegExp(`<article\\b([^>]*?\\bid=\\\"${escRe(id)}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`,'i'); const m=code.match(re); return {re,m} as const; };
      const genUniqueId=(base:string)=>{ const code = getSrc(); const has=(idTry:string)=> new RegExp(`<article\\b[^>]*\\bid=\\\"${escRe(idTry)}\\\"`).test(code) || new RegExp(`<Chart\\b[^>]*\\bid=\\\"${escRe(idTry)}\\\"`).test(code); let attempt=`${base}_copy`; let i=2; while(has(attempt)){ attempt=`${base}_${i++}`; if(i>999) break; } return attempt; };
      // Edit
      itemEdit.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); closePop(); const artId = art.getAttribute('id') || ''; if (role==='kpi') { const titleEl=(art.querySelector('p')||art.querySelector('h1')) as HTMLElement|null; const valEl=art.querySelector('.kpi-value') as HTMLElement|null; const tStyle=parseStyle(titleEl?.getAttribute('style')); const vStyle=parseStyle(valEl?.getAttribute('style')); kpiEditingArticleIdRef.current=artId||null; setKpiModalInitial({ titleText: titleEl?.textContent?.trim()||'', titleFontFamily:tStyle['font-family']||'', titleFontSize: numPx(tStyle['font-size']), titleFontWeight:tStyle['font-weight']||undefined, titleColor:tStyle['color']||'#111827', valueText: valEl?.textContent?.trim()||'', valueFontFamily:vStyle['font-family']||'', valueFontSize:numPx(vStyle['font-size']), valueFontWeight:vStyle['font-weight']||undefined, valueColor:vStyle['color']||'#111827' }); setKpiModalOpen(true); } else { const titleEl=(art.querySelector('p')||art.querySelector('h1')) as HTMLElement|null; const tStyle=parseStyle(titleEl?.getAttribute('style')); const artStyle=parseStyle(art.getAttribute('style')); chartEditingArticleIdRef.current=artId||null; setChartModalInitial({ titleText: titleEl?.textContent?.trim()||'', titleFontFamily:tStyle['font-family']||'', titleFontSize:numPx(tStyle['font-size']), titleFontWeight:tStyle['font-weight']||undefined, titleColor:tStyle['color']||'#111827', backgroundColor:artStyle['background-color']||'', opacity: artStyle['opacity']?Number(artStyle['opacity']):undefined, borderColor:artStyle['border-color']||'', borderWidth:numPx(artStyle['border-width']), borderStyle:artStyle['border-style'] as any, borderRadius:numPx(artStyle['border-radius']) }); setChartModalOpen(true); } });
      // Duplicate
      itemDup.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); closePop(); try { const src=getSrc(); const secEl=art.closest('section[data-role="section"]') as HTMLElement|null; const secId=secEl?.getAttribute('id')||''; if(!secId) return; const {m:mSec}=findSection(src,secId); if(!mSec) return; const secInner=mSec[2]||''; const artId=art.getAttribute('id')||''; const {m:mArt}=findArticle(secInner,artId); if(!mArt) return; const artOpen=mArt[1]||''; let artInner=mArt[2]||''; const newArtId=genUniqueId(artId); let newArtOpen=artOpen.replace(/(id=\")[^\"]*(\")/i, `$1${newArtId}$2`); const chartMatch=artInner.match(/<Chart\b([^>]*)>/i); if(chartMatch){ const idAttr=(chartMatch[1]||'').match(/\bid=\"([^\"]+)\"/i); const oldCId=idAttr?.[1]; if(oldCId) artInner=artInner.replace(/(<Chart\b[^>]*?id=\")[^\"]*(\")/i, `$1${genUniqueId(oldCId)}$2`);} const artClone=`<article${newArtOpen}>${artInner}</article>`; const secInnerNew=secInner.replace(mArt[0], mArt[0]+`\n`+artClone); const newSec=mSec[0].replace(secInner, secInnerNew); visualBuilderActions.updateCode(src.replace(mSec[0], newSec)); } catch {} });
      // Delete
      itemDel.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); closePop(); try { const src=getSrc(); const secEl=art.closest('section[data-role="section"]') as HTMLElement|null; const secId=secEl?.getAttribute('id')||''; if(!secId) return; const {m:mSec}=findSection(src,secId); if(!mSec) return; const secInner=mSec[2]||''; const artId=art.getAttribute('id')||''; const {m:mArt}=findArticle(secInner,artId); if(!mArt) return; const secInnerNew=secInner.replace(mArt[0],''); const newSec=mSec[0].replace(secInner, secInnerNew); visualBuilderActions.updateCode(src.replace(mSec[0], newSec)); } catch {} });
      cleanups.push(()=>{ try{ art.removeEventListener('mouseenter', enter);}catch{}; try{ art.removeEventListener('mouseleave', leave);}catch{}; try{ trigger.removeEventListener('click', openPop);}catch{}; try{ art.removeChild(trigger);}catch{}; try{ art.removeChild(pop);}catch{}; });
    }

    return () => {
      for (const r of reactRootsRef.current) { try { r.unmount(); } catch {} }
      reactRootsRef.current = [];
      if (htmlRef.current) htmlRef.current.innerHTML = '';
      cleanups.forEach(fn => { try { fn(); } catch {} });
    };
  }, [htmlMode, code, visualBuilderState.globalFilters]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header minimalista */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/visual-builder"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            ← Voltar ao Editor
          </Link>

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
          </div>
        </div>
      </div>
      {/* Modals (preview) */}
      <SectionEditorModal
        isOpen={sectionModalOpen}
        initial={sectionModalInitial}
        onClose={() => setSectionModalOpen(false)}
        onSave={(out) => {
          try {
            const id = sectionEditingIdRef.current || '';
            if (!id) { setSectionModalOpen(false); return; }
            const src = String(visualBuilderState.code || '');
            const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`<section\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/section>`, 'i');
            const m = src.match(re); if (!m) { setSectionModalOpen(false); return; }
            const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
            const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
            const parse = (s: string) => { const o: Record<string,string> = {}; for (const part of s.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue; o[p.slice(0,i).trim()] = p.slice(i+1).trim(); } return o; };
            const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
            const styleObj = (() => { const ms = openAttrs.match(styleRe); return ms ? parse(ms[2] || ms[3] || '') : {}; })();
            const setIf = (k: string, v?: string | number) => { if (v !== undefined && v !== '') styleObj[k] = String(v); };
            const wantsFlex = out.flexDirection !== undefined || out.flexWrap !== undefined || out.justifyContent !== undefined || out.alignItems !== undefined;
            const wantsGrid = out.gridTemplateColumns !== undefined; const display = out.display || (wantsFlex ? 'flex' : (wantsGrid ? 'grid' : undefined));
            setIf('display', display); setIf('gap', out.gap !== undefined ? `${out.gap}px` : undefined);
            if (display === 'flex' || wantsFlex) { setIf('flex-direction', out.flexDirection); setIf('flex-wrap', out.flexWrap); setIf('justify-content', out.justifyContent); setIf('align-items', out.alignItems); if (display === 'flex') delete (styleObj as any)['grid-template-columns']; }
            if (display === 'grid' || wantsGrid) { setIf('grid-template-columns', out.gridTemplateColumns); if (display === 'grid') { delete (styleObj as any)['flex-direction']; delete (styleObj as any)['flex-wrap']; delete (styleObj as any)['justify-content']; delete (styleObj as any)['align-items']; } }
            setIf('padding', out.padding !== undefined ? `${out.padding}px` : undefined); setIf('margin', out.margin !== undefined ? `${out.margin}px` : undefined);
            setIf('background-color', out.backgroundColor); setIf('opacity', out.opacity !== undefined ? out.opacity : undefined);
            setIf('border-color', out.borderColor); setIf('border-width', out.borderWidth !== undefined ? `${out.borderWidth}px` : undefined); setIf('border-style', out.borderStyle); setIf('border-radius', out.borderRadius !== undefined ? `${out.borderRadius}px` : undefined);
            let newOpenAttrs = openAttrs.replace(styleRe, ''); newOpenAttrs = newOpenAttrs.replace(/\s+$/, ''); const newOpenTag = `<section${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
            visualBuilderActions.updateCode(src.replace(whole, newOpenTag + innerOld + `</section>`));
          } finally { setSectionModalOpen(false); }
        }}
      />
      <KpiEditorModal
        isOpen={kpiModalOpen}
        initial={kpiModalInitial}
        onClose={() => setKpiModalOpen(false)}
        onSave={(out) => {
          try {
            const id = kpiEditingArticleIdRef.current || '';
            if (!id) { setKpiModalOpen(false); return; }
            const src = String(visualBuilderState.code || '');
            const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
            const m = src.match(re); if (!m) { setKpiModalOpen(false); return; }
            const whole = m[0]; const openAttrs = m[1] || ''; let inner = m[2] || '';
            const pTitleRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i; const toStyle = (obj: Record<string,string>) => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; '); const escHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); const titleStyle: Record<string,string> = {};
            if (out.titleFontFamily) titleStyle['font-family'] = String(out.titleFontFamily); if (typeof out.titleFontSize === 'number') titleStyle['font-size'] = `${out.titleFontSize}px`; if (out.titleFontWeight !== undefined) titleStyle['font-weight'] = String(out.titleFontWeight); if (out.titleColor) titleStyle['color'] = String(out.titleColor);
            const newTitle = `<p style=\"${toStyle(titleStyle)}\">${escHtml(out.titleText || '')}</p>`; if (pTitleRe.test(inner)) inner = inner.replace(pTitleRe, newTitle); else inner = newTitle + `\n` + inner;
            inner = inner.replace(/<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i, (_m, tag) => {
              const valStyle: Record<string,string> = {}; if (out.valueFontFamily) valStyle['font-family'] = String(out.valueFontFamily); if (typeof out.valueFontSize === 'number') valStyle['font-size'] = `${out.valueFontSize}px`; if (out.valueFontWeight !== undefined) valStyle['font-weight'] = String(out.valueFontWeight); if (out.valueColor) valStyle['color'] = String(out.valueColor);
              return `<${tag} class=\"kpi-value\" style=\"${toStyle(valStyle)}\">${escHtml(out.valueText || '')}</${tag}>`;
            });
            visualBuilderActions.updateCode(src.replace(whole, `<article${openAttrs}>${inner}</article>`));
          } finally { setKpiModalOpen(false); }
        }}
      />
      <ChartEditorModal
        isOpen={chartModalOpen}
        initial={chartModalInitial}
        onClose={() => setChartModalOpen(false)}
        onSave={(out) => {
          try {
            const artId = chartEditingArticleIdRef.current || '';
            if (!artId) { setChartModalOpen(false); return; }
            const src = String(visualBuilderState.code || '');
            const escId = artId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`<article\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/article>`, 'i');
            const m = src.match(re); if (!m) { setChartModalOpen(false); return; }
            const whole = m[0]; const openAttrs = m[1] || ''; let inner = m[2] || '';
            const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i; const parse=(s:string)=>{ const o:Record<string,string>={}; for(const part of s.split(';')){ const p=part.trim(); if(!p) continue; const i=p.indexOf(':'); if(i===-1) continue; o[p.slice(0,i).trim()]=p.slice(i+1).trim(); } return o; };
            const toStyle=(obj:Record<string,string>)=>Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
            const styleObj = (()=>{ const ms=openAttrs.match(styleRe); return ms?parse(ms[2]||ms[3]||''):{}})(); const setIf=(k:string,v?:string|number)=>{ if(v!==undefined && v!=='') (styleObj as any)[k]=String(v); };
            setIf('background-color', out.backgroundColor); setIf('opacity', out.opacity !== undefined ? out.opacity : undefined); setIf('border-color', out.borderColor); setIf('border-width', out.borderWidth !== undefined ? `${out.borderWidth}px` : undefined); setIf('border-style', out.borderStyle); setIf('border-radius', out.borderRadius !== undefined ? `${out.borderRadius}px` : undefined);
            let newOpenAttrs = openAttrs.replace(styleRe,''); newOpenAttrs = newOpenAttrs.replace(/\s+$/,''); const newOpenTag = `<article${newOpenAttrs}${Object.keys(styleObj).length ? ` style=\"${toStyle(styleObj)}\"` : ''}>`;
            const pTitleRe=/<p\b([^>]*)>([\s\S]*?)<\/p>/i; const titleStyle:Record<string,string>={}; if(out.titleFontFamily) titleStyle['font-family']=String(out.titleFontFamily); if(typeof out.titleFontSize==='number') titleStyle['font-size']=`${out.titleFontSize}px`; if(out.titleFontWeight!==undefined) titleStyle['font-weight']=String(out.titleFontWeight); if(out.titleColor) titleStyle['color']=String(out.titleColor); const escHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); const newTitle=`<p style=\"${toStyle(titleStyle)}\">${escHtml(out.titleText||'')}</p>`; if(pTitleRe.test(inner)) inner=inner.replace(pTitleRe,newTitle); else inner=newTitle+`\n`+inner;
            visualBuilderActions.updateCode(src.replace(whole, newOpenTag + inner + `</article>`));
          } finally { setChartModalOpen(false); }
        }}
      />

      {/* Dashboard em tela cheia */}
      <div className="w-full h-[calc(100vh-69px)]">
        {htmlMode ? (
          <div ref={htmlRef} className="w-full overflow-auto p-0" />
        ) : (
          <ResponsiveGridCanvas
            widgets={visualBuilderState.widgets}
            gridConfig={visualBuilderState.gridConfig}
            viewportMode={viewportMode}
            headerTitle={visualBuilderState.dashboardTitle || 'Live Dashboard'}
            headerSubtitle={visualBuilderState.dashboardSubtitle || 'Real-time visualization with Supabase data'}
            themeName={currentThemeName}
            globalFilters={visualBuilderState.globalFilters}
            onFilterChange={handleFilterChange}
            isFilterLoading={isFilterLoading}
          />
        )}
      </div>
    </div>
  );
}
