'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ---- Pure helpers (hoisted) to avoid TDZ in SSR/minified builds ----
function parseInlineStyle(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!s) return out;
  for (const part of s.split(';')) {
    const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue;
    const k = p.slice(0, i).trim(); const v = p.slice(i + 1).trim();
    out[k] = v;
  }
  return out;
}
function toInlineStyle(obj: Record<string, string>): string {
  return Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
}
function getHeaderMatch(dsl: string) { return dsl.match(/<header\b([^>]*)>([\s\S]*?)<\/header>/i); }
function setHeaderOpenStyle(openAttrs: string, styleObj: Record<string,string>): string {
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  let newOpenAttrs = openAttrs.replace(styleRe, '');
  newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
  const styleStr = toInlineStyle(styleObj);
  return `<header${newOpenAttrs}${styleStr ? ` style=\"${styleStr}\"` : ''}>`;
}
function setHeaderTextColors(inner: string, titleColor?: string, subtitleColor?: string): string {
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  const matches = Array.from(inner.matchAll(pRe));
  let next = inner;
  const setColor = (full: string, openAttrs: string, body: string, color?: string) => {
    if (!color) return full;
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const m = openAttrs.match(styleRe);
    const styleStr = m ? (m[2] || m[3] || '') : '';
    const so = parseInlineStyle(styleStr);
    so['color'] = color;
    const noStyle = openAttrs.replace(styleRe, '').replace(/\s+$/, '');
    const newOpen = `<p${noStyle ? ` ${noStyle}` : ''} style=\"${toInlineStyle(so)}\">`;
    return `${newOpen}${body}</p>`;
  };
  if (matches[0]) {
    const full = matches[0][0]; const open = matches[0][1] || ''; const body = matches[0][2] || '';
    const replaced = setColor(full, open, body, titleColor);
    next = next.replace(full, replaced);
  }
  const matches2 = Array.from(next.matchAll(pRe));
  if (matches2[1]) {
    const full = matches2[1][0]; const open = matches2[1][1] || ''; const body = matches2[1][2] || '';
    const replaced = setColor(full, open, body, subtitleColor);
    next = next.replace(full, replaced);
  }
  return next;
}
function getAllArticles(code: string): Array<{ whole: string; open: string; inner: string }> {
  const re = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
  const out: Array<{ whole: string; open: string; inner: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    out.push({ whole: m[0], open: m[1] || '', inner: m[2] || '' });
  }
  return out;
}
function rewriteAllArticles(code: string, patch: (open: string, inner: string) => { open: string; inner: string }): string {
  const arts = getAllArticles(code);
  if (!arts.length) return code;
  let next = code;
  for (const a of arts) {
    const newParts = patch(a.open, a.inner);
    const newWhole = `<article${newParts.open}>${newParts.inner}</article>`;
    next = next.replace(a.whole, newWhole);
  }
  return next;
}
function setArticleOpenStyle(openAttrs: string, mut: (so: Record<string,string>) => void): string {
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  const m = openAttrs.match(styleRe);
  const so = parseInlineStyle(m ? (m[2] || m[3] || '') : '');
  mut(so);
  if (so['padding-top'] || so['padding-right'] || so['padding-bottom'] || so['padding-left']) delete so['padding'];
  if (so['margin-top'] || so['margin-right'] || so['margin-bottom'] || so['margin-left']) delete so['margin'];
  const noStyle = openAttrs.replace(styleRe, '').replace(/\s+$/, '');
  const styleStr = toInlineStyle(so);
  return `${noStyle ? ` ${noStyle}` : ''}${styleStr ? ` style=\"${styleStr}\"` : ''}`;
}
function setFirstPStyle(inner: string, mut: (ps: Record<string,string>) => void): string {
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
  const m = inner.match(pRe);
  if (!m) return inner;
  const open = m[1] || ''; const body = m[2] || '';
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  const sm = open.match(styleRe);
  const ps = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
  mut(ps);
  const noStyle = open.replace(styleRe, '').replace(/\s+$/, '');
  const newOpen = `<p${noStyle ? ` ${noStyle}` : ''}${Object.keys(ps).length ? ` style=\"${toInlineStyle(ps)}\"` : ''}>`;
  return inner.replace(m[0], `${newOpen}${body}</p>`);
}
function setKpiValueStyle(inner: string, mut: (ps: Record<string,string>) => void): string {
  const kvRe = /<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i;
  const m = inner.match(kvRe); if (!m) return inner;
  const tag = m[1]; const open = m[2] || ''; const body = m[3] || '';
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  const sm = open.match(styleRe);
  const ps = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
  mut(ps);
  const noStyle = open.replace(styleRe, '').replace(/\s+$/, '');
  const newOpen = `<${tag}${noStyle ? ` ${noStyle}` : ''}${Object.keys(ps).length ? ` style=\"${toInlineStyle(ps)}\"` : ''}>`;
  return inner.replace(m[0], `${newOpen}${body}</${tag}>`);
}
function updateVbContainerStyle(code: string, mut: (so: Record<string,string>) => void): string {
  if (!code.trim().startsWith('<')) return code;
  const tagRe = /<([a-z][^>\s]*)\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(code)) !== null) {
    const full = m[0];
    const tag = m[1];
    const attrs = m[2] || '';
    const classM = attrs.match(/class\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (!classM) continue;
    const classVal = (classM[2] || classM[3] || '');
    if (!/\bvb-container\b/.test(classVal)) continue;
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = attrs.match(styleRe);
    const so = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    mut(so);
    const noStyle = attrs.replace(styleRe, '').replace(/\s+$/, '');
    const styleStr = toInlineStyle(so);
    const newOpen = `<${tag}${noStyle ? ` ${noStyle}` : ''}${styleStr ? ` style=\"${styleStr}\"` : ''}>`;
    return code.replace(full, newOpen);
  }
  return code;
}

// ---- Theme presets (header + dashboard + articles) ----
type PresetKey = 'clean-light' | 'clean-dark' | 'minimal-cards';
type Preset = {
  key: PresetKey;
  name: string;
  description: string;
  header: { backgroundColor: string; borderColor?: string; borderWidth?: number; borderStyle?: 'solid'|'dashed'|'dotted'; borderRadius?: number; titleColor: string; subtitleColor: string };
  dashboard: { backgroundColor: string };
  articles: {
    backgroundColor: string;
    borderColor?: string; borderWidth?: number; borderStyle?: 'solid'|'dashed'|'dotted'; borderRadius?: number;
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    marginBottom?: number;
    title: { color: string; size: number; weight: string | number };
    value: { color: string; size: number; weight: string | number };
  };
};
const PRESETS: Preset[] = [
  {
    key: 'clean-light',
    name: 'Clean Light',
    description: 'Claro, minimalista, cartões brancos',
    header: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 12, titleColor: '#111827', subtitleColor: '#6b7280' },
    dashboard: { backgroundColor: '#f8fafc' },
    articles: {
      backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 12,
      padding: { top: 12, right: 12, bottom: 12, left: 12 }, marginBottom: 16,
      title: { color: '#111827', size: 16, weight: 600 },
      value: { color: '#111827', size: 28, weight: 700 },
    }
  },
  {
    key: 'clean-dark',
    name: 'Clean Dark',
    description: 'Escuro com alto contraste',
    header: { backgroundColor: '#111827', borderColor: '#374151', borderWidth: 1, borderStyle: 'solid', borderRadius: 12, titleColor: '#f9fafb', subtitleColor: '#9ca3af' },
    dashboard: { backgroundColor: '#0b0f14' },
    articles: {
      backgroundColor: '#1b1b1b', borderColor: '#404040', borderWidth: 1, borderStyle: 'solid', borderRadius: 12,
      padding: { top: 12, right: 12, bottom: 12, left: 12 }, marginBottom: 16,
      title: { color: '#e5e7eb', size: 16, weight: 600 },
      value: { color: '#ffffff', size: 28, weight: 700 },
    }
  },
  {
    key: 'minimal-cards',
    name: 'Minimal (Cards)',
    description: 'Sutil, bordas tracejadas, leve',
    header: { backgroundColor: 'transparent', borderColor: undefined, borderWidth: undefined, borderStyle: undefined, borderRadius: 12, titleColor: '#111827', subtitleColor: '#6b7280' },
    dashboard: { backgroundColor: '#ffffff' },
    articles: {
      backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8,
      padding: { top: 8, right: 8, bottom: 8, left: 8 }, marginBottom: 12,
      title: { color: '#111827', size: 15, weight: 500 },
      value: { color: '#111827', size: 26, weight: 600 },
    }
  }
];
function applyPresetOnCode(code: string, key: PresetKey): string {
  const preset = PRESETS.find(p => p.key === key);
  if (!preset) return code;
  let next = String(code);
  const mh = getHeaderMatch(next);
  if (mh) {
    const whole = mh[0]; const open = mh[1] || ''; const inner = mh[2] || '';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const so = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    so['background-color'] = preset.header.backgroundColor;
    if (preset.header.borderColor) so['border-color'] = preset.header.borderColor; else delete so['border-color'];
    if (preset.header.borderWidth != null) so['border-width'] = `${preset.header.borderWidth}px`; else delete so['border-width'];
    if (preset.header.borderStyle) so['border-style'] = preset.header.borderStyle; else delete so['border-style'];
    if (preset.header.borderRadius != null) so['border-radius'] = `${preset.header.borderRadius}px`; else delete so['border-radius'];
    const newOpen = setHeaderOpenStyle(open, so);
    const newInner = setHeaderTextColors(inner, preset.header.titleColor, preset.header.subtitleColor);
    next = next.replace(whole, newOpen + newInner + `</header>`);
  }
  next = updateVbContainerStyle(next, (so) => {
    so['background-color'] = preset.dashboard.backgroundColor;
  });
  next = rewriteAllArticles(next, (open, inner) => {
    const newOpen = setArticleOpenStyle(open, (so) => {
      so['background-color'] = preset.articles.backgroundColor;
      if (preset.articles.borderColor) so['border-color'] = preset.articles.borderColor; else delete so['border-color'];
      if (preset.articles.borderWidth != null) so['border-width'] = `${preset.articles.borderWidth}px`; else delete so['border-width'];
      if (preset.articles.borderStyle) so['border-style'] = preset.articles.borderStyle; else delete so['border-style'];
      if (preset.articles.borderRadius != null) so['border-radius'] = `${preset.articles.borderRadius}px`; else delete so['border-radius'];
      const pad = preset.articles.padding || {};
      if (pad.top != null) so['padding-top'] = `${pad.top}px`;
      if (pad.right != null) so['padding-right'] = `${pad.right}px`;
      if (pad.bottom != null) so['padding-bottom'] = `${pad.bottom}px`;
      if (pad.left != null) so['padding-left'] = `${pad.left}px`;
      if (preset.articles.marginBottom != null) so['margin-bottom'] = `${preset.articles.marginBottom}px`;
    });
    let newInner = setFirstPStyle(inner, (ps) => {
      ps['color'] = preset.articles.title.color;
      ps['font-size'] = `${preset.articles.title.size}px`;
      ps['font-weight'] = String(preset.articles.title.weight);
    });
    newInner = setKpiValueStyle(newInner, (ps) => {
      ps['color'] = preset.articles.value.color;
      ps['font-size'] = `${preset.articles.value.size}px`;
      ps['font-weight'] = String(preset.articles.value.weight);
    });
    return { open: newOpen, inner: newInner };
  });
  return next;
}
function detectPresetKey(code: string): PresetKey | 'custom' {
  const src = String(code || '');
  const mh = getHeaderMatch(src);
  const headerBg = (() => {
    if (!mh) return undefined;
    const m = (mh[1] || '').match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
    const so = parseInlineStyle(m ? (m[2] || m[3] || '') : '');
    return (so['background-color'] || '').toLowerCase();
  })();
  const containerBg = (() => {
    const tagRe = /<([a-z][^>\s]*)\b([^>]*)>/gi; let m: RegExpExecArray | null;
    while ((m = tagRe.exec(src)) !== null) {
      const attrs = m[2] || '';
      const cm = attrs.match(/class\s*=\s*("([^"]*)"|'([^']*)')/i);
      if (!cm) continue; const cv = (cm[2] || cm[3] || '');
      if (!/\bvb-container\b/.test(cv)) continue;
      const sm = attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
      const so = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
      return (so['background-color'] || '').toLowerCase();
    }
    return undefined;
  })();
  const art = getAllArticles(src)[0];
  const articleBg = (() => {
    if (!art) return undefined;
    const sm = art.open.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
    const so = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    return (so['background-color'] || '').toLowerCase();
  })();
  for (const p of PRESETS) {
    const hb = p.header.backgroundColor.toLowerCase();
    const db = p.dashboard.backgroundColor.toLowerCase();
    const ab = p.articles.backgroundColor.toLowerCase();
    if (headerBg === hb && containerBg === db && articleBg === ab) return p.key;
  }
  return 'custom';
}

import { useStore } from '@nanostores/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Palette, Check, Type, Layout, BarChart3 } from 'lucide-react';
import { FontManager, type FontPresetKey, type FontSizeKey } from '@/components/visual-builder/FontManager';
// import { BackgroundManager, type BackgroundPresetKey } from '@/components/visual-builder/BackgroundManager';
// import { BorderManager, type BorderPresetKey } from '@/components/visual-builder/BorderManager';
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
import { $vbNivoTheme } from '@/stores/visualBuilderNivoStore';
// import { setGlobalFontByPresetKey } from '@/components/visual-builder/helpers/DefaultHtmlStyleHelper';
import { createRoot, type Root } from 'react-dom/client';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { GroupedBarChart } from '@/components/charts/GroupedBarChart';
import { QueryEngine } from '@/components/visual-builder/QueryEngine';
import { updateArticleQueryFull } from '@/components/visual-builder/commands/HelperEditorToDSL';

// New: Comercial (Metas x Realizado) HTML template
const COMERCIAL_DASHBOARD_TEMPLATE = `<dashboard render="html" theme="branco" date-type="custom" date-start="2025-11-01" date-end="2025-12-01" style="border:1px solid red;">
  <div class="vb-container" style="padding: 0; border: 1px solid blue;">
    <header class="vb-header" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin:-16px -16px 16px -16px;">
      <p style="margin:0 0 4px; font-family:Inter, system-ui, sans-serif; font-size:20px; font-weight:700; color:#111827;">Comercial • Metas x Realizado</p>
      <p style="margin:0; font-family:Inter, system-ui, sans-serif; font-size:14px; font-weight:400; color:#6b7280;">Vendedor e Território</p>
    </header>

    <section id="metas_vendedor" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="mxr_fat_vendedor" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Meta x Faturamento (Vendedor)</p>
        <Chart id="mxr_fat_vendedor" type="groupedbar" height="360">
          <query mode="meta-real" scope="vendedor" metric="faturamento" timeDimension="data_pedido" limit="5" />
        </Chart>
      </article>
      <article id="mxr_ticket_vendedor" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Meta x Ticket Médio (Vendedor)</p>
        <Chart id="mxr_ticket_vendedor" type="groupedbar" height="360">
          <query mode="meta-real" scope="vendedor" metric="ticket_medio" timeDimension="data_pedido" limit="5" />
        </Chart>
      </article>
      <article id="mxr_novos_vendedor" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Meta x Novos Clientes (Vendedor)</p>
        <Chart id="mxr_novos_vendedor" type="groupedbar" height="360">
          <query mode="meta-real" scope="vendedor" metric="novos_clientes" timeDimension="data_pedido" limit="5" />
        </Chart>
      </article>
    </section>

    <section id="metas_territorio" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="mxr_fat_territorio" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Meta x Faturamento (Território)</p>
        <Chart id="mxr_fat_territorio" type="groupedbar" height="360">
          <query mode="meta-real" scope="territorio" metric="faturamento" timeDimension="data_pedido" limit="5" />
        </Chart>
      </article>
      <article id="mxr_ticket_territorio" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Meta x Ticket Médio (Território)</p>
        <Chart id="mxr_ticket_territorio" type="groupedbar" height="360">
          <query mode="meta-real" scope="territorio" metric="ticket_medio" timeDimension="data_pedido" limit="5" />
        </Chart>
      </article>
      <article id="mxr_novos_territorio" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Meta x Novos Clientes (Território)</p>
        <Chart id="mxr_novos_territorio" type="groupedbar" height="360">
          <query mode="meta-real" scope="territorio" metric="novos_clientes" timeDimension="data_pedido" limit="5" />
        </Chart>
      </article>
    </section>
  </div>
</dashboard>`;
// New: Sales (Vendas) HTML template for Visual Builder
const SALES_DASHBOARD_TEMPLATE = `<dashboard render="html" theme="branco" date-type="custom" date-start="2025-11-01" date-end="2026-01-31" style="border:1px solid red;">
  <div class="vb-container" style="padding: 0; border: 1px solid blue;">
    <header class="vb-header" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin:-16px -16px 16px -16px;">
      <p style="margin:0 0 4px; font-family:Inter, system-ui, sans-serif; font-size:20px; font-weight:700; color:#111827;">Dashboard de Vendas</p>
      <p style="margin:0; font-family:Inter, system-ui, sans-serif; font-size:14px; font-weight:400; color:#6b7280;">Visão comercial e desempenho</p>
    </header>

    <section id="kpis_vendas" class="row kpis" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="kpi_faturamento" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#f0fdf4; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Faturamento</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">R$ 245.000</div>
      </article>
      <article id="kpi_pedidos_total" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ecfeff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Pedidos</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">1.240</div>
      </article>
      <article id="kpi_ticket" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#eef2ff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Ticket Médio</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">R$ 198,50</div>
      </article>
      <article id="kpi_cogs" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#fff7ed; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">COGS</p>
        <div class="kpi-value" style="font-size:28px; font-weight:700; letter-spacing:-0.02em;">R$ 126.300</div>
      </article>
    </section>

    <section id="charts_v1" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="chart_vendas_vendedor" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Vendedor</p>
        <Chart id="vendas_vendedor" type="bar" height="320">
          <query schema="vendas" table="pedidos" dimension="vendedor" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" where='status in (concluido, pago)' />
        </Chart>
      </article>
      <article id="chart_vendas_canal" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Canal</p>
        <Chart id="vendas_canal" type="pie" height="320">
          <query schema="vendas" table="pedidos" dimension="canal_venda" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
    </section>

    <section id="charts_v2" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="chart_vendas_territorio" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Território</p>
        <Chart id="vendas_territorio" type="bar" height="320">
          <query schema="vendas" table="pedidos" dimension="territorio" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
      <article id="chart_vendas_categoria" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Categorias</p>
        <Chart id="vendas_categoria" type="bar" height="320">
          <query schema="vendas" table="pedidos" dimension="categoria" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
    </section>

    <section id="charts_v3" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-bottom:16px;">
      <article id="chart_top_clientes" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Top 5 Clientes</p>
        <Chart id="top_clientes" type="bar" height="320">
          <query schema="vendas" table="pedidos" dimension="cliente" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
      <article id="chart_vendas_cidade" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Cidade</p>
        <Chart id="vendas_cidade" type="area" height="320">
          <query schema="vendas" table="pedidos" dimension="cidade" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
    </section>
  </div>
</dashboard>`;

export default function VisualBuilderPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const vbNivo = useStore($vbNivoTheme);
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

  // UI-only defaults for dropdown (no handlers)
  const availableFonts = FontManager.getAvailableFonts();
  const availableFontSizes = FontManager.getAvailableFontSizes();
  // CSS-style helpers: ensure <style> exists and update CSS variables
  const isDsl = (code: string) => code.trim().startsWith('<');
  const cssSkeleton = `
    :root {
      --vb-font-family: var(--font-barlow), Barlow, -apple-system, BlinkMacSystemFont, sans-serif;
      --vb-letter-spacing: -0.02em;
      --vb-title-size: 18px;
      --vb-chart-font-family: var(--font-geist), Geist, -apple-system, BlinkMacSystemFont, sans-serif;
      --vb-chart-text-color: #6b7280;
    }

    .vb-container {
      font-family: var(--vb-font-family);
      letter-spacing: var(--vb-letter-spacing);
    }

    .vb-header p,
    .vb-header h1,
    .vb-header h2 {
      font-family: var(--vb-font-family);
    }

    [data-liquid-chart] {
      font-family: var(--vb-chart-font-family);
      color: var(--vb-chart-text-color);
    }

    .vb-header p:first-of-type {
      font-size: var(--vb-title-size);
    }`;
  const ensureStyleBlock = (dsl: string): string => {
    if (/<style\b[^>]*>[\s\S]*?<\/style>/i.test(dsl)) return dsl;
    const dashOpen = dsl.match(/<dashboard\b[^>]*>/i);
    if (!dashOpen || dashOpen.index === undefined) return dsl;
    const insertAt = dashOpen.index + dashOpen[0].length;
    const prefix = dsl.slice(0, insertAt);
    const suffix = dsl.slice(insertAt);
    const block = `\n  <style>\n${cssSkeleton}\n  </style>`;
    return prefix + block + suffix;
  };
  const getStyleContent = (dsl: string): { content: string; start: number; end: number } | null => {
    const re = /<style\b[^>]*>([\s\S]*?)<\/style>/i;
    const m = dsl.match(re);
    if (!m) return null;
    const full = m[0];
    const start = m.index ?? -1;
    if (start < 0) return null;
    return { content: m[1] || '', start, end: start + full.length };
  };
  const upsertCssVar = (styleText: string, varName: string, value: string): string => {
    // Try to find :root { ... }
    const rootRe = /:root\s*\{([\s\S]*?)\}/i;
    const rm = styleText.match(rootRe);
    if (!rm) {
      // Prepend a :root block with our var
      const block = `:root {\n  ${varName}: ${value};\n}`;
      return `${block}\n\n${styleText}`;
    }
    const before = styleText.slice(0, rm.index!);
    const inner = rm[1] || '';
    const after = styleText.slice((rm.index || 0) + rm[0].length);
    const varRe = new RegExp(`(^|\\n)\\s*${varName}\\s*:\\s*[^;]+;`, 'i');
    let newInner: string;
    if (varRe.test(inner)) {
      newInner = inner.replace(varRe, (_m, p1) => `${p1}${varName}: ${value};`);
    } else {
      const trimmed = inner.trimEnd();
      const prefix = trimmed && !/;\s*$/.test(trimmed) ? trimmed + ';' : trimmed;
      newInner = `${prefix}\n  ${varName}: ${value};\n`;
    }
    return `${before}:root {${newInner}}${after}`;
  };
  const writeCssVarsToDsl = (dsl: string, vars: Record<string, string>): string => {
    let next = ensureStyleBlock(dsl);
    const m = getStyleContent(next);
    if (!m) return dsl;
    let style = m.content;
    for (const [k, v] of Object.entries(vars)) {
      style = upsertCssVar(style, k, v);
    }
    const re = /<style\b[^>]*>[\s\S]*?<\/style>/i;
    const replacement = `<style>\n${style}\n  </style>`;
    next = next.replace(re, replacement);
    return next;
  };
  const readCssVarsFromDsl = (dsl: string): Record<string, string> => {
    const out: Record<string, string> = {};
    const m = getStyleContent(dsl);
    if (!m) return out;
    const rootRe = /:root\s*\{([\s\S]*?)\}/i;
    const rm = m.content.match(rootRe);
    const scope = rm ? (rm[1] || '') : m.content;
    const capture = (name: string) => {
      const re = new RegExp(`${name}\\s*:\\s*([^;]+);`, 'i');
      const mm = scope.match(re);
      if (mm && mm[1]) out[name] = mm[1].trim();
    };
    capture('--vb-font-family');
    capture('--vb-letter-spacing');
    capture('--vb-title-size');
    capture('--vb-chart-font-family');
    capture('--vb-chart-text-color');
    return out;
  };
  // Derive current selections from CSS vars
  const cssVars = useMemo(() => readCssVarsFromDsl(String(visualBuilderState.code || '')), [visualBuilderState.code]);
  const normalizeFamily = (s?: string) => (s || '').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim().replace(/^"|"$/g, '')
  const currentFontFamily = normalizeFamily(cssVars['--vb-font-family']);
  const currentChartFamily = normalizeFamily(cssVars['--vb-chart-font-family']);
  const currentTitleSizePx = (cssVars['--vb-title-size'] || '').trim();
  const currentLetterSpacingEm = (cssVars['--vb-letter-spacing'] || '').trim();
  const selectedFontKey: FontPresetKey = useMemo(() => {
    for (const f of availableFonts) {
      if (normalizeFamily(f.family) === currentFontFamily) return f.key;
    }
    return 'barlow';
  }, [availableFonts, currentFontFamily]);
  const selectedChartBodyFontKey: FontPresetKey = useMemo(() => {
    for (const f of availableFonts) {
      if (normalizeFamily(f.family) === currentChartFamily) return f.key;
    }
    return 'geist';
  }, [availableFonts, currentChartFamily]);
  const selectedFontSizeKey: FontSizeKey = useMemo(() => {
    const n = Number((currentTitleSizePx || '').replace(/px$/, ''));
    for (const s of availableFontSizes) {
      if (Math.abs(s.value - n) < 1e-6) return s.key as FontSizeKey;
    }
    return 'lg';
  }, [availableFontSizes, currentTitleSizePx]);
  const selectedLetterSpacingValue: number = useMemo(() => {
    if (/em$/i.test(currentLetterSpacingEm)) {
      const n = Number(currentLetterSpacingEm.replace(/em$/i, ''));
      if (!Number.isNaN(n)) return n;
    }
    return -0.02;
  }, [currentLetterSpacingEm]);
  const chartBodyTextColor = useMemo(() => (cssVars['--vb-chart-text-color'] || '#6b7280'), [cssVars]);

  // ===== Header style helpers (Estilo do Cabeçalho) =====
  type HeaderPreset = 'auto' | 'light' | 'dark';
  const parseInlineStyle = (s: string): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!s) return out;
    for (const part of s.split(';')) {
      const p = part.trim(); if (!p) continue; const i = p.indexOf(':'); if (i === -1) continue;
      const k = p.slice(0, i).trim(); const v = p.slice(i + 1).trim();
      out[k] = v;
    }
    return out;
  };
  const toInlineStyle = (obj: Record<string, string>): string => Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
  const getHeaderMatch = (dsl: string) => dsl.match(/<header\b([^>]*)>([\s\S]*?)<\/header>/i);
  const setHeaderOpenStyle = (openAttrs: string, styleObj: Record<string,string>): string => {
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    let newOpenAttrs = openAttrs.replace(styleRe, '');
    newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
    const styleStr = toInlineStyle(styleObj);
    return `<header${newOpenAttrs}${styleStr ? ` style=\"${styleStr}\"` : ''}>`;
  };
  const setHeaderTextColors = (inner: string, titleColor?: string, subtitleColor?: string): string => {
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    const matches = Array.from(inner.matchAll(pRe));
    let next = inner;
    const setColor = (full: string, openAttrs: string, body: string, color?: string) => {
      if (!color) return full;
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const m = openAttrs.match(styleRe);
      const styleStr = m ? (m[2] || m[3] || '') : '';
      const so = parseInlineStyle(styleStr);
      so['color'] = color;
      const noStyle = openAttrs.replace(styleRe, '').replace(/\s+$/, '');
      const newOpen = `<p${noStyle ? ` ${noStyle}` : ''} style=\"${toInlineStyle(so)}\">`;
      return `${newOpen}${body}</p>`;
    };
    if (matches[0]) {
      const full = matches[0][0]; const open = matches[0][1] || ''; const body = matches[0][2] || '';
      const replaced = setColor(full, open, body, titleColor);
      next = next.replace(full, replaced);
    }
    // Need to re-search after replacement for correct second p boundaries
    const matches2 = Array.from(next.matchAll(pRe));
    if (matches2[1]) {
      const full = matches2[1][0]; const open = matches2[1][1] || ''; const body = matches2[1][2] || '';
      const replaced = setColor(full, open, body, subtitleColor);
      next = next.replace(full, replaced);
    }
    return next;
  };
  const resolvePreset = (preset: HeaderPreset): HeaderPreset => {
    if (preset !== 'auto') return preset;
    // Map theme to light/dark
    return (currentThemeName === 'branco' || currentThemeName === 'cinza-claro') ? 'light' : 'dark';
  };
  const applyHeaderPresetOnCode = (code: string, preset: HeaderPreset): string => {
    if (!isDsl(code)) return code;
    const m = getHeaderMatch(code);
    if (!m) return code;
    const whole = m[0];
    const openAttrs = m[1] || '';
    const innerOld = m[2] || '';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const styleM = openAttrs.match(styleRe);
    const styleObj = parseInlineStyle(styleM ? (styleM[2] || styleM[3] || '') : '');
    const resolved = resolvePreset(preset);
    if (resolved === 'light') {
      styleObj['background-color'] = '#ffffff';
      styleObj['border-color'] = '#e5e7eb';
      styleObj['border-width'] = '1px';
      styleObj['border-style'] = 'solid';
      styleObj['border-radius'] = '12px';
    } else {
      styleObj['background-color'] = '#111827';
      styleObj['border-color'] = '#374151';
      styleObj['border-width'] = '1px';
      styleObj['border-style'] = 'solid';
      styleObj['border-radius'] = '12px';
    }
    const newOpen = setHeaderOpenStyle(openAttrs, styleObj);
    const nextInner = setHeaderTextColors(innerOld,
      resolved === 'light' ? '#111827' : '#f9fafb',
      resolved === 'light' ? '#6b7280' : '#9ca3af'
    );
    return code.replace(whole, newOpen + nextInner + `</header>`);
  };
  const detectHeaderPreset = (code: string): HeaderPreset => {
    const m = getHeaderMatch(code);
    if (!m) return 'auto';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const s = (m[1] || '').match(styleRe);
    const so = parseInlineStyle(s ? (s[2] || s[3] || '') : '');
    const bg = (so['background-color'] || '').toLowerCase().trim();
    if (bg === '#ffffff' || bg === 'white') return 'light';
    if (bg === '#111827' || bg === '#1f2937') return 'dark';
    return 'auto';
  };
  const headerPresetSelected = useMemo<HeaderPreset>(() => detectHeaderPreset(String(visualBuilderState.code || '')), [visualBuilderState.code]);
  const handleApplyHeaderPreset = useCallback((preset: HeaderPreset) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = applyHeaderPresetOnCode(src, preset);
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code, currentThemeName]);

  // Header colors current values (for color pickers)
  const headerColors = useMemo(() => {
    const code = String(visualBuilderState.code || '');
    const m = getHeaderMatch(code);
    const resolved = resolvePreset(headerPresetSelected);
    let bg = resolved === 'light' ? '#ffffff' : '#111827';
    let title = resolved === 'light' ? '#111827' : '#f9fafb';
    let subtitle = resolved === 'light' ? '#6b7280' : '#9ca3af';
    if (m) {
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const s = (m[1] || '').match(styleRe);
      const so = parseInlineStyle(s ? (s[2] || s[3] || '') : '');
      if (so['background-color']) bg = so['background-color'];
      const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
      const ps = Array.from((m[2] || '').matchAll(pRe));
      const colorFromOpen = (open: string) => {
        const mm = open.match(styleRe); const st = mm ? (mm[2] || mm[3] || '') : '';
        const o = parseInlineStyle(st); return o['color'];
      };
      if (ps[0]) { const c = colorFromOpen(ps[0][1] || ''); if (c) title = c; }
      if (ps[1]) { const c = colorFromOpen(ps[1][1] || ''); if (c) subtitle = c; }
    }
    return { bg, title, subtitle };
  }, [visualBuilderState.code, headerPresetSelected]);

  const handleSetHeaderBgColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const m = getHeaderMatch(src); if (!m) return;
      const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const styleM = openAttrs.match(styleRe);
      const so = parseInlineStyle(styleM ? (styleM[2] || styleM[3] || '') : '');
      so['background-color'] = hex;
      const newOpen = setHeaderOpenStyle(openAttrs, so);
      const next = src.replace(whole, newOpen + innerOld + `</header>`);
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetHeaderTitleColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const m = getHeaderMatch(src); if (!m) return;
      const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
      const innerNext = setHeaderTextColors(innerOld, hex, undefined);
      const next = src.replace(whole, `<header${openAttrs}>` + innerNext + `</header>`);
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetHeaderSubtitleColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const m = getHeaderMatch(src); if (!m) return;
      const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
      const innerNext = setHeaderTextColors(innerOld, undefined, hex);
      const next = src.replace(whole, `<header${openAttrs}>` + innerNext + `</header>`);
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);

  // ===== Dashboard (vb-container) helpers =====
  // updateVbContainerStyle now top-level

  const selectedPreset = useMemo(() => detectPresetKey(String(visualBuilderState.code || '')), [visualBuilderState.code]);
  const handleApplyPreset = useCallback((key: PresetKey) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = applyPresetOnCode(src, key);
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  // ===== Articles (global) style helpers =====
  type BorderStyle = 'solid' | 'dashed' | 'dotted';
  type ArticleStyleAggregate = {
    bg?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: BorderStyle;
    borderRadius?: number;
    titleColor?: string;
    titleSize?: number;
    titleWeight?: string | number;
    paddingTop?: number; paddingRight?: number; paddingBottom?: number; paddingLeft?: number;
    marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number;
    valueColor?: string; valueSize?: number; valueWeight?: string | number;
  };
  const getAllArticles = (code: string): Array<{ whole: string; open: string; inner: string }> => {
    const re = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
    const out: Array<{ whole: string; open: string; inner: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      out.push({ whole: m[0], open: m[1] || '', inner: m[2] || '' });
    }
    return out;
  };
  const readArticlesAggregate = (code: string): ArticleStyleAggregate => {
    const arts = getAllArticles(code);
    if (!arts.length) return {};
    const { open, inner } = arts[0];
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const s = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    const agg: ArticleStyleAggregate = {};
    if (s['background-color']) agg.bg = s['background-color'];
    if (s['border-color']) agg.borderColor = s['border-color'];
    if (s['border-width']) { const n = Number(String(s['border-width']).replace(/px$/,'')); if (!Number.isNaN(n)) agg.borderWidth = n; }
    if (s['border-style']) agg.borderStyle = s['border-style'] as BorderStyle;
    if (s['border-radius']) { const n = Number(String(s['border-radius']).replace(/px$/,'')); if (!Number.isNaN(n)) agg.borderRadius = n; }
    // padding/margin parsing
    const parsePx = (v?: string) => {
      if (!v) return undefined; const n = Number(String(v).replace(/px$/,'')); return Number.isNaN(n) ? undefined : n;
    };
    const parseBox = (v?: string): { t?: number; r?: number; b?: number; l?: number } => {
      if (!v) return {};
      const parts = String(v).trim().split(/\s+/);
      const toN = (x: string) => Number(String(x).replace(/px$/,''));
      if (parts.length === 1) {
        const n = toN(parts[0]); return Number.isNaN(n) ? {} : { t: n, r: n, b: n, l: n };
      }
      if (parts.length === 2) {
        const v1 = toN(parts[0]); const v2 = toN(parts[1]);
        if ([v1,v2].some(Number.isNaN)) return {};
        return { t: v1, b: v1, r: v2, l: v2 };
      }
      if (parts.length === 3) {
        const v1 = toN(parts[0]); const v2 = toN(parts[1]); const v3 = toN(parts[2]);
        if ([v1,v2,v3].some(Number.isNaN)) return {};
        return { t: v1, r: v2, l: v2, b: v3 };
      }
      if (parts.length >= 4) {
        const v1 = toN(parts[0]); const v2 = toN(parts[1]); const v3 = toN(parts[2]); const v4 = toN(parts[3]);
        if ([v1,v2,v3,v4].some(Number.isNaN)) return {};
        return { t: v1, r: v2, b: v3, l: v4 };
      }
      return {};
    };
    const pbox = parseBox(s['padding']);
    agg.paddingTop = parsePx(s['padding-top']) ?? pbox.t;
    agg.paddingRight = parsePx(s['padding-right']) ?? pbox.r;
    agg.paddingBottom = parsePx(s['padding-bottom']) ?? pbox.b;
    agg.paddingLeft = parsePx(s['padding-left']) ?? pbox.l;
    const mbox = parseBox(s['margin']);
    agg.marginTop = parsePx(s['margin-top']) ?? mbox.t;
    agg.marginRight = parsePx(s['margin-right']) ?? mbox.r;
    agg.marginBottom = parsePx(s['margin-bottom']) ?? mbox.b;
    agg.marginLeft = parsePx(s['margin-left']) ?? mbox.l;
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
    const pm = inner.match(pRe);
    if (pm) {
      const pmStyleM = pm[1].match(styleRe);
      const ps = parseInlineStyle(pmStyleM ? (pmStyleM[2] || pmStyleM[3] || '') : '');
      if (ps['color']) agg.titleColor = ps['color'];
      if (ps['font-size']) { const n = Number(String(ps['font-size']).replace(/px$/,'')); if (!Number.isNaN(n)) agg.titleSize = n; }
      if (ps['font-weight']) agg.titleWeight = (/^\d+$/.test(ps['font-weight']) ? Number(ps['font-weight']) : ps['font-weight']);
    }
    // kpi-value style
    const kvRe = /<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i;
    const kvm = inner.match(kvRe);
    if (kvm) {
      const openKV = kvm[2] || '';
      const stKV = openKV.match(styleRe);
      const kvs = parseInlineStyle(stKV ? (stKV[2] || stKV[3] || '') : '');
      if (kvs['color']) agg.valueColor = kvs['color'];
      if (kvs['font-size']) { const n = Number(String(kvs['font-size']).replace(/px$/,'')); if (!Number.isNaN(n)) agg.valueSize = n; }
      if (kvs['font-weight']) agg.valueWeight = (/^\d+$/.test(kvs['font-weight']) ? Number(kvs['font-weight']) : kvs['font-weight']);
    }
    return agg;
  };
  const articlesAggregate = useMemo(() => readArticlesAggregate(String(visualBuilderState.code || '')), [visualBuilderState.code]);
  const rewriteAllArticles = (code: string, patch: (open: string, inner: string) => { open: string; inner: string }): string => {
    const arts = getAllArticles(code);
    if (!arts.length) return code;
    let next = code;
    for (const a of arts) {
      const newParts = patch(a.open, a.inner);
      const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
      const styleM = a.open.match(styleRe);
      const so = parseInlineStyle(styleM ? (styleM[2] || styleM[3] || '') : '');
      // Allow patch to have replaced style via returned open string; use it directly
      const newWhole = `<article${newParts.open}>${newParts.inner}</article>`;
      next = next.replace(a.whole, newWhole);
    }
    return next;
  };
  const setArticleOpenStyle = (openAttrs: string, mut: (so: Record<string,string>) => void): string => {
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const m = openAttrs.match(styleRe);
    const so = parseInlineStyle(m ? (m[2] || m[3] || '') : '');
    mut(so);
    // normalize: remove shorthand when edges are set explicitly
    if (so['padding-top'] || so['padding-right'] || so['padding-bottom'] || so['padding-left']) delete so['padding'];
    if (so['margin-top'] || so['margin-right'] || so['margin-bottom'] || so['margin-left']) delete so['margin'];
    const noStyle = openAttrs.replace(styleRe, '').replace(/\s+$/, '');
    const styleStr = toInlineStyle(so);
    return `${noStyle ? ` ${noStyle}` : ''}${styleStr ? ` style=\"${styleStr}\"` : ''}`;
  };
  function setFirstPStyle(inner: string, mut: (ps: Record<string,string>) => void): string {
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
    const m = inner.match(pRe);
    if (!m) return inner;
    const open = m[1] || ''; const body = m[2] || '';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const ps = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    mut(ps);
    const noStyle = open.replace(styleRe, '').replace(/\s+$/, '');
    const newOpen = `<p${noStyle ? ` ${noStyle}` : ''}${Object.keys(ps).length ? ` style=\"${toInlineStyle(ps)}\"` : ''}>`;
    return inner.replace(m[0], `${newOpen}${body}</p>`);
  }
  // Kpi value style helper (used by presets and Articles controls)
  function setKpiValueStyle(inner: string, mut: (ps: Record<string,string>) => void): string {
    const kvRe = /<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i;
    const m = inner.match(kvRe); if (!m) return inner;
    const tag = m[1]; const open = m[2] || ''; const body = m[3] || '';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const ps = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    mut(ps);
    const noStyle = open.replace(styleRe, '').replace(/\s+$/, '');
    const newOpen = `<${tag}${noStyle ? ` ${noStyle}` : ''}${Object.keys(ps).length ? ` style=\"${toInlineStyle(ps)}\"` : ''}>`;
    return inner.replace(m[0], `${newOpen}${body}</${tag}>`);
  }
  // Handlers: background & border
  const handleSetArticlesBgColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so['background-color'] = hex; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesBorderColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so['border-color'] = hex; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesBorderWidth = useCallback((px: number) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so['border-width'] = `${Math.max(0, Math.round(px))}px`; if (!so['border-style']) so['border-style'] = 'solid'; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesBorderRadius = useCallback((px: number) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so['border-radius'] = `${Math.max(0, Math.round(px))}px`; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesBorderStyle = useCallback((style: BorderStyle) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so['border-style'] = style; so['border-width'] = so['border-width'] || '1px'; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  // Handlers: title
  const handleSetArticlesTitleColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open,
        inner: setFirstPStyle(inner, (ps) => { ps['color'] = hex; })
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesTitleSize = useCallback((px: number) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open,
        inner: setFirstPStyle(inner, (ps) => { ps['font-size'] = `${Math.max(8, Math.round(px))}px`; })
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesTitleWeight = useCallback((w: string | number) => {
    try {
      const src = String(visualBuilderState.code || '');
      const val = String(w);
      const next = rewriteAllArticles(src, (open, inner) => ({
        open,
        inner: setFirstPStyle(inner, (ps) => { ps['font-weight'] = val; })
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  // Handlers: padding/margin
  const handleSetArticlesPadding = useCallback((side: 'top'|'right'|'bottom'|'left', px: number) => {
    try {
      const key = `padding-${side}` as const;
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so[key] = `${Math.max(0, Math.round(px))}px`; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesMargin = useCallback((side: 'top'|'right'|'bottom'|'left', px: number) => {
    try {
      const key = `margin-${side}` as const;
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({
        open: setArticleOpenStyle(open, (so) => { so[key] = `${Math.round(px)}px`; }),
        inner
      }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  // Handlers: kpi-value
  const handleSetArticlesValueColor = useCallback((hex: string) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({ open, inner: setKpiValueStyle(inner, (ps)=>{ ps['color'] = hex; }) }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesValueSize = useCallback((px: number) => {
    try {
      const value = `${Math.max(8, Math.round(px))}px`;
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({ open, inner: setKpiValueStyle(inner, (ps)=>{ ps['font-size'] = value; }) }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetArticlesValueWeight = useCallback((w: string | number) => {
    try {
      const src = String(visualBuilderState.code || '');
      const next = rewriteAllArticles(src, (open, inner) => ({ open, inner: setKpiValueStyle(inner, (ps)=>{ ps['font-weight'] = String(w); }) }));
      if (next !== src) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  // UI-only defaults (no state/handlers)
  const currentHeaderStyle = {
    background: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    borderBottomColor: '#e5e7eb',
    datePickerBorderColor: '#e5e7eb',
    fontFamily: 'Inter, system-ui, sans-serif'
  } as const;
  
  const insightsBgColor = '#ffffff';
  const insightsBgOpacity = 1;
  const insightsBorderColor = '#e5e7eb';
  const insightsTitleColor = '#111827';
  const insightsBorderRadius = 8;
  const insightsTitleSize = 18;
  const insightsTitleMargin = 8;
  const insightsCompact = true;

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

  // Handlers: atualizam variáveis CSS dentro do <style>
  const handleSetStyleFont = useCallback((fontKey: import('@/components/visual-builder/FontManager').FontPresetKey) => {
    try {
      const code = String(visualBuilderState.code || '');
      if (!isDsl(code)) return;
      const family = FontManager.getFontFamily(fontKey);
      const next = writeCssVarsToDsl(code, { '--vb-font-family': family });
      if (next !== code) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetStyleFontSize = useCallback((sizeKey: import('@/components/visual-builder/FontManager').FontSizeKey) => {
    try {
      const code = String(visualBuilderState.code || '');
      if (!isDsl(code)) return;
      const px = FontManager.getFontSizeValue(sizeKey) + 'px';
      const next = writeCssVarsToDsl(code, { '--vb-title-size': px });
      if (next !== code) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetStyleLetterSpacing = useCallback((value: number) => {
    try {
      const code = String(visualBuilderState.code || '');
      if (!isDsl(code)) return;
      const next = writeCssVarsToDsl(code, { '--vb-letter-spacing': `${value}em` });
      if (next !== code) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);
  const handleSetChartBodyFont = useCallback((fontKey: import('@/components/visual-builder/FontManager').FontPresetKey) => {
    try {
      const code = String(visualBuilderState.code || '');
      if (!isDsl(code)) return;
      const family = FontManager.getFontFamily(fontKey);
      const next = writeCssVarsToDsl(code, { '--vb-chart-font-family': family });
      if (next !== code) visualBuilderActions.updateCode(next);
    } catch {}
  }, [visualBuilderState.code]);

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
  type ChartModalInitial = {
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
    query?: {
      schema?: string;
      table?: string;
      measure?: string;
      dimension?: string;
      timeDimension?: string;
      from?: string;
      to?: string;
      limit?: number;
      order?: 'value DESC' | 'value ASC' | 'label ASC' | 'label DESC';
      where?: Array<{ col: string; op: string; val?: string; vals?: string; start?: string; end?: string }>;
    };
    // Nivo local props (attributes + <props> merged) for this chart
    chartProps?: Record<string, unknown>;
  };
  const [chartModalInitial, setChartModalInitial] = useState<ChartModalInitial>({ titleText: '' });
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
        // Nivo defaults (global) - used by non-Bar charts for now
        enableGridX: vbNivo.enableGridX,
        enableGridY: vbNivo.enableGridY,
        gridColor: vbNivo.gridColor,
        gridStrokeWidth: vbNivo.gridStrokeWidth,
        axisFontFamily: vbNivo.axisFontFamily,
        axisFontSize: vbNivo.axisFontSize,
        axisFontWeight: vbNivo.axisFontWeight,
        axisTextColor: vbNivo.axisTextColor,
        axisLegendFontSize: vbNivo.axisLegendFontSize,
        axisLegendFontWeight: vbNivo.axisLegendFontWeight,
        labelsFontFamily: vbNivo.labelsFontFamily,
        labelsFontSize: vbNivo.labelsFontSize,
        labelsFontWeight: vbNivo.labelsFontWeight,
        labelsTextColor: vbNivo.labelsTextColor,
        legendsFontFamily: vbNivo.legendsFontFamily,
        legendsFontSize: vbNivo.legendsFontSize,
        legendsFontWeight: vbNivo.legendsFontWeight,
        legendsTextColor: vbNivo.legendsTextColor,
        animate: vbNivo.animate,
        motionConfig: vbNivo.motionConfig,
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
        case 'groupedbar': root.render(<GroupedBarChart data={spec.data as any} />); break;
        default: {
          const barBase = {
            containerClassName: 'nivo-container',
            containerBorderVariant: 'none',
            containerPadding: 0,
            containerBorderRadius: 0,
            backgroundColor: 'transparent',
            containerBackground: 'transparent'
          } as any;
          const barProps = { ...barBase, ...(spec as any).props, data: spec.data } as any;
          root.render(<BarChart {...barProps} />);
          break;
        }
      }

      // If querySpec present, resolve it and re-render with fetched data
      if (spec.querySpec) {
        QueryEngine.resolve(spec.querySpec, visualBuilderState.globalFilters).then((rows) => {
          if (!Array.isArray(rows) || rows.length === 0) return; // keep placeholder if backend returned no rows
          const commonFetched = spec.type === 'groupedbar'
            ? ({ data: rows } as any)
            : ({ ...common, data: rows } as any);
          try {
            switch (spec.type) {
              case 'line': root.render(<LineChart {...commonFetched} />); break;
              case 'pie': root.render(<PieChart {...commonFetched} />); break;
              case 'area': root.render(<AreaChart {...commonFetched} enableArea={true} />); break;
              case 'groupedbar': root.render(<GroupedBarChart {...commonFetched} />); break;
              default: {
                const barBase = {
                  containerClassName: 'nivo-container',
                  containerBorderVariant: 'none',
                  containerPadding: 0,
                  containerBorderRadius: 0,
                  backgroundColor: 'transparent',
                  containerBackground: 'transparent'
                } as any;
                const barProps = { ...barBase, ...(spec as any).props, data: rows } as any;
                root.render(<BarChart {...barProps} />);
                break;
              }
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
          // Parse Chart props (attributes + <props>) for initial modal (best-effort)
          const findChartIn = (s: string): { openAttrs: string; inner: string } | null => {
            const escId = artId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const rePair = new RegExp(`<(?:(?:Chart)|(?:chart))\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)>([\\s\\S]*?)<\\/(?:Chart|chart)>`, 'i');
            const mPair = s.match(rePair);
            if (mPair) return { openAttrs: mPair[1] || '', inner: mPair[2] || '' };
            const reSelf = new RegExp(`<(?:(?:Chart)|(?:chart))\\b([^>]*?\\bid=\\\"${escId}\\\"[^>]*)\\/>`, 'i');
            const mSelf = s.match(reSelf);
            if (mSelf) return { openAttrs: mSelf[1] || '', inner: '' };
            return null;
          };
          const chartFound = findChartIn(artMatch ? (artMatch[2] || '') : '');
          const parseAttrs = (s: string): Record<string,string> => { const out: Record<string,string> = {}; const re=/(\w[\w-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g; let m: RegExpExecArray|null; while((m=re.exec(s))!==null){ out[m[1]]=(m[3]??m[4]??m[5]??'').trim(); } return out; };
          const propsFromAttrs = (attrsStr: string): Record<string, unknown> => {
            const a = parseAttrs(attrsStr);
            const coerce = (v?: string) => { if (v==null || v==='') return undefined; const t=String(v).trim(); if (/^(true|false)$/i.test(t)) return /^true$/i.test(t); if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t); return t; };
            const out: Record<string, unknown> = {};
            if (a['layout']) out['layout'] = a['layout'];
            if (a['groupMode']) out['groupMode'] = a['groupMode'];
            if (a['enableGridX']) out['enableGridX'] = coerce(a['enableGridX']);
            if (a['enableGridY']) out['enableGridY'] = coerce(a['enableGridY']);
            if (a['showLegend']) out['showLegend'] = coerce(a['showLegend']);
            if (a['colors']) {
              const t = a['colors'];
              if (t.startsWith('[')) { try { out['colors'] = JSON.parse(t); } catch {} }
              else if (t.includes(',')) out['colors'] = t.split(',').map(x=>x.trim()).filter(Boolean);
              else out['colors'] = t;
            }
            if (a['axisBottomTickRotation']) out['axisBottom'] = { ...(out['axisBottom'] as any || {}), tickRotation: coerce(a['axisBottomTickRotation']) };
            if (a['axisBottomTickSize']) out['axisBottom'] = { ...(out['axisBottom'] as any || {}), tickSize: coerce(a['axisBottomTickSize']) };
            if (a['axisBottomTickPadding']) out['axisBottom'] = { ...(out['axisBottom'] as any || {}), tickPadding: coerce(a['axisBottomTickPadding']) };
            if (a['axisBottomLegend']) out['axisBottom'] = { ...(out['axisBottom'] as any || {}), legend: a['axisBottomLegend'] };
            if (a['axisBottomLegendOffset']) out['axisBottom'] = { ...(out['axisBottom'] as any || {}), legendOffset: coerce(a['axisBottomLegendOffset']) };
            if (a['axisBottomLegendPosition']) out['axisBottom'] = { ...(out['axisBottom'] as any || {}), legendPosition: a['axisBottomLegendPosition'] };
            if (a['axisLeftTickSize']) out['axisLeft'] = { ...(out['axisLeft'] as any || {}), tickSize: coerce(a['axisLeftTickSize']) };
            if (a['axisLeftTickPadding']) out['axisLeft'] = { ...(out['axisLeft'] as any || {}), tickPadding: coerce(a['axisLeftTickPadding']) };
            if (a['axisLeftTickRotation']) out['axisLeft'] = { ...(out['axisLeft'] as any || {}), tickRotation: coerce(a['axisLeftTickRotation']) };
            if (a['axisLeftLegend']) out['axisLeft'] = { ...(out['axisLeft'] as any || {}), legend: a['axisLeftLegend'] };
            if (a['axisLeftLegendOffset']) out['axisLeft'] = { ...(out['axisLeft'] as any || {}), legendOffset: coerce(a['axisLeftLegendOffset']) };
            if (a['enableLabel']) out['enableLabel'] = coerce(a['enableLabel']);
            if (a['labelPosition']) out['labelPosition'] = a['labelPosition'];
            if (a['labelOffset']) out['labelOffset'] = coerce(a['labelOffset']);
            if (a['labelSkipWidth']) out['labelSkipWidth'] = coerce(a['labelSkipWidth']);
            if (a['labelSkipHeight']) out['labelSkipHeight'] = coerce(a['labelSkipHeight']);
            if (a['labelTextColor']) out['labelTextColor'] = a['labelTextColor'];
            return out;
          };
          const propsFromBlock = (inner: string): Record<string, unknown> => {
            const m = inner.match(/<props\b[^>]*>([\s\S]*?)<\/props>/i); if (!m) return {};
            try { return JSON.parse(m[1] || '{}'); } catch { return {}; }
          };
          const propsFromNivo = (inner: string): Record<string, unknown> => {
            const m = inner.match(/<nivo\b([^>]*)\/>/i) || inner.match(/<nivo\b([^>]*)>([\s\S]*?)<\/nivo>/i);
            if (!m) return {};
            const attrsStr = (m[1] || '').trim();
            return propsFromAttrs(attrsStr);
          };
          const deepMerge = (a:any,b:any):any => { if(Array.isArray(a)&&Array.isArray(b)) return b; if(a&&typeof a==='object'&&!Array.isArray(a) && b&&typeof b==='object'&&!Array.isArray(b)){ const o:any={...a}; for(const k of Object.keys(b)) o[k]=k in o?deepMerge(o[k],b[k]):b[k]; return o;} return b===undefined?a:b; };
          const chartPropsInitial = chartFound
            ? deepMerge(
                propsFromAttrs(chartFound.openAttrs),
                deepMerge(propsFromBlock(chartFound.inner), propsFromNivo(chartFound.inner))
              )
            : {};
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
            chartProps: chartPropsInitial,
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
          <button
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              try { visualBuilderActions.updateCode(COMERCIAL_DASHBOARD_TEMPLATE); } catch {}
            }}
          >
            Template Comercial
          </button>
          <button
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              try { visualBuilderActions.updateCode(SALES_DASHBOARD_TEMPLATE); } catch {}
            }}
          >
            Template Vendas
          </button>
          
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export Config
          </button>
          <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Import Config
          </button>

          {/* Dropdown "Tema" (somente UI, sem handlers) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Tema</span>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
              {/* Presets */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="w-4 h-4 mr-2" />
                  Presets
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72">
                  {PRESETS.map((p) => (
                    <DropdownMenuItem key={p.key} className="flex items-center justify-between py-2" onClick={() => handleApplyPreset(p.key)}>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      </div>
                      {selectedPreset === p.key && <Check className="w-4 h-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

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
                        {currentThemeName === theme && (
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
                  {/* Família da Fonte */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Família da Fonte</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFonts.map((font) => (
                        <DropdownMenuItem key={font.key} className="flex items-center justify-between py-2" onClick={() => handleSetStyleFont(font.key)}>
                          <span style={{ fontFamily: font.family }} className="text-sm">
                            {font.name}
                          </span>
                          {selectedFontKey === font.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Tamanho da Fonte */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Tamanho da Fonte</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFontSizes.map((size) => (
                        <DropdownMenuItem key={size.key} className="flex items-center justify-between py-2" onClick={() => handleSetStyleFontSize(size.key)}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{size.name}</span>
                            <span className="text-xs text-muted-foreground">{size.value}px • {size.usage}</span>
                          </div>
                          {selectedFontSizeKey === size.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Letter Spacing */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Letter Spacing</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {[-0.05,-0.04,-0.03,-0.02,-0.01,0,0.01,0.02,0.03,0.04,0.05].map(v => (
                        <DropdownMenuItem key={v} className="flex items-center justify-between py-2" onClick={() => handleSetStyleLetterSpacing(v)}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{v.toFixed(2)}em</span>
                            <span className="text-xs text-muted-foreground">tracking</span>
                          </div>
                          {Math.abs(selectedLetterSpacingValue - v) < 1e-6 && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Chart Body Font */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Chart Body Font</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFonts.map((font) => (
                        <DropdownMenuItem key={font.key} className="flex items-center justify-between py-2" onClick={() => handleSetChartBodyFont(font.key)}>
                          <span style={{ fontFamily: font.family }} className="text-sm">
                            {font.name}
                          </span>
                          {selectedChartBodyFontKey === font.key && (
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
                  <DropdownMenuItem className="flex items-center justify-between py-2" onClick={() => handleApplyHeaderPreset('auto')}>
                    <span>Automático</span>
                    {headerPresetSelected === 'auto' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center justify-between py-2" onClick={() => handleApplyHeaderPreset('light')}>
                    <span>Claro</span>
                    {headerPresetSelected === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center justify-between py-2" onClick={() => handleApplyHeaderPreset('dark')}>
                    <span>Escuro</span>
                    {headerPresetSelected === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Cores do Cabeçalho</div>
                  <div className="px-3 py-2 text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Fundo</span>
                      <input
                        type="color"
                        aria-label="Cor de fundo do cabeçalho"
                        value={headerColors.bg}
                        onChange={(e)=>handleSetHeaderBgColor(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Texto primário</span>
                      <input
                        type="color"
                        aria-label="Cor do título do cabeçalho"
                        value={headerColors.title}
                        onChange={(e)=>handleSetHeaderTitleColor(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Texto secundário</span>
                      <input
                        type="color"
                        aria-label="Cor do subtítulo do cabeçalho"
                        value={headerColors.subtitle}
                        onChange={(e)=>handleSetHeaderSubtitleColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Fonte do Cabeçalho</div>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Type className="w-4 h-4 mr-2" />
                      Selecionar fonte
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFonts.map((font) => (
                        <DropdownMenuItem key={font.key} className="flex items-center justify-between py-2">
                          <span style={{ fontFamily: font.family }} className="text-sm">
                            {font.name}
                          </span>
                          {currentHeaderStyle.fontFamily === font.family && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              

              

              {/* Articles Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Layout className="w-4 h-4 mr-2" />
                  Articles
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-80">
                  <div className="px-3 py-2 text-xs text-muted-foreground">Cor de Fundo</div>
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm">Fundo</span>
                    <input type="color" value={articlesAggregate.bg || '#ffffff'} onChange={(e)=>handleSetArticlesBgColor(e.target.value)} />
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Borda</div>
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Cor</span>
                      <input type="color" value={articlesAggregate.borderColor || '#e5e7eb'} onChange={(e)=>handleSetArticlesBorderColor(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Largura</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.borderWidth ?? 1} onChange={(e)=>handleSetArticlesBorderWidth(Number(e.target.value||0))} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Raio</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.borderRadius ?? 12} onChange={(e)=>handleSetArticlesBorderRadius(Number(e.target.value||0))} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Estilo</span>
                      <select className="w-28 border rounded px-2 py-1" value={articlesAggregate.borderStyle || 'solid'} onChange={(e)=>handleSetArticlesBorderStyle(e.target.value as any)}>
                        <option value="solid">solid</option>
                        <option value="dashed">dashed</option>
                        <option value="dotted">dotted</option>
                      </select>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Espaçamentos</div>
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Padding</span>
                      <div className="flex items-center gap-2">
                        <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingTop ?? 12} onChange={(e)=>handleSetArticlesPadding('top', Number(e.target.value||0))} title="Topo" />
                        <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingRight ?? 12} onChange={(e)=>handleSetArticlesPadding('right', Number(e.target.value||0))} title="Direita" />
                        <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingBottom ?? 12} onChange={(e)=>handleSetArticlesPadding('bottom', Number(e.target.value||0))} title="Baixo" />
                        <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingLeft ?? 12} onChange={(e)=>handleSetArticlesPadding('left', Number(e.target.value||0))} title="Esquerda" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Margin</span>
                      <div className="flex items-center gap-2">
                        <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginTop ?? 0} onChange={(e)=>handleSetArticlesMargin('top', Number(e.target.value||0))} title="Topo" />
                        <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginRight ?? 0} onChange={(e)=>handleSetArticlesMargin('right', Number(e.target.value||0))} title="Direita" />
                        <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginBottom ?? 16} onChange={(e)=>handleSetArticlesMargin('bottom', Number(e.target.value||0))} title="Baixo" />
                        <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginLeft ?? 0} onChange={(e)=>handleSetArticlesMargin('left', Number(e.target.value||0))} title="Esquerda" />
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Título</div>
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Cor</span>
                      <input type="color" value={articlesAggregate.titleColor || '#111827'} onChange={(e)=>handleSetArticlesTitleColor(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Tamanho</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={10} value={articlesAggregate.titleSize ?? 16} onChange={(e)=>handleSetArticlesTitleSize(Number(e.target.value||0))} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Peso</span>
                      <select className="w-28 border rounded px-2 py-1" value={String(articlesAggregate.titleWeight ?? '600')} onChange={(e)=>handleSetArticlesTitleWeight(e.target.value)}>
                        <option value="400">normal</option>
                        <option value="500">500</option>
                        <option value="600">600</option>
                        <option value="700">bold</option>
                      </select>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-muted-foreground">Valor (KPI)</div>
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Cor</span>
                      <input type="color" value={articlesAggregate.valueColor || '#111827'} onChange={(e)=>handleSetArticlesValueColor(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Tamanho</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={10} value={articlesAggregate.valueSize ?? 28} onChange={(e)=>handleSetArticlesValueSize(Number(e.target.value||0))} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">Peso</span>
                      <select className="w-28 border rounded px-2 py-1" value={String(articlesAggregate.valueWeight ?? '700')} onChange={(e)=>handleSetArticlesValueWeight(e.target.value)}>
                        <option value="400">normal</option>
                        <option value="500">500</option>
                        <option value="600">600</option>
                        <option value="700">bold</option>
                      </select>
                    </div>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              

              {/* Insights Card Style Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Estilo do Insights Card
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-80">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Cores</div>
                  <div className="px-3 py-2 text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Fundo</span>
                      <input type="color" defaultValue={insightsBgColor} disabled />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Transparência</span>
                      <div className="flex items-center gap-2">
                        <input className="w-24 border rounded px-2 py-1" type="number" min={0} max={100} defaultValue={Math.round(insightsBgOpacity * 100)} disabled />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Borda</span>
                      <input type="color" defaultValue={insightsBorderColor} disabled />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Título</span>
                      <input type="color" defaultValue={insightsTitleColor} disabled />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Bordas e Tipografia</div>
                  <div className="px-3 py-2 text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Raio</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={0} max={32} defaultValue={insightsBorderRadius} disabled />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Tam. título</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={10} max={36} defaultValue={insightsTitleSize} disabled />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Margem título</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" min={0} max={24} defaultValue={insightsTitleMargin} disabled />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Compacto</span>
                      <input type="checkbox" defaultChecked={insightsCompact} disabled />
                    </div>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div className="h-[calc(100%-73px)] p-0 overflow-auto" ref={scrollRef} style={{ overflowAnchor: 'none' }}>
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
            // Update <Chart ...> attributes and <props> with Nivo props from modal (local props)
            const parseAttrs = (s: string): Record<string,string> => { const out: Record<string,string> = {}; const re=/(\w[\w-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g; let m: RegExpExecArray|null; while((m=re.exec(s))!==null){ out[m[1]]=(m[3]??m[4]??m[5]??'').trim(); } return out; };
            const buildAttrs = (a: Record<string,string>) => Object.entries(a).map(([k,v])=>`${k}="${v}"`).join(' ');
            const setAttrKV = (attrsStr: string, name: string, value: string | undefined) => {
              if (!value && value !== '') return attrsStr;
              const re = new RegExp(`(\\b${name}\\=\")[^\"]*(\")`, 'i');
              if (re.test(attrsStr)) return attrsStr.replace(re, `$1${value}$2`);
              return `${attrsStr} ${name}="${value}"`;
            };
            // Locate the Chart block inside inner
            const chartPairRe = new RegExp(`<(?:(?:Chart)|(?:chart))\\b([^>]*)>([\\s\\S]*?)<\\/(?:Chart|chart)>`, 'i');
            const chartSelfRe = new RegExp(`<(?:(?:Chart)|(?:chart))\\b([^>]*)\\/>`, 'i');
            let innerNext = inner;
            const applyChartProps = (openAttrsStr: string, chartInner: string): { open: string; inner: string } => {
              const chartProps = (out.chartProps || {}) as Record<string, unknown>;
              // Não escrever mais shorthands no <Chart> — manter attrs originais
              const newAttrsStr = openAttrsStr;

              // Constrói atributos do <nivo /> a partir de chartProps
              const toPairs = (obj: Record<string, unknown>): Record<string, string> => {
                const pairs: Record<string, string> = {};
                const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== '') pairs[k] = String(v); };
                const coerceBool = (v: unknown) => (typeof v === 'boolean' ? v : Boolean(v));

                set('layout', obj['layout']);
                set('groupMode', obj['groupMode']);
                set('padding', obj['padding']);
                set('innerPadding', obj['innerPadding']);
                if (obj['colors']) {
                  const c = obj['colors'] as any;
                  if (Array.isArray(c)) set('colors', JSON.stringify(c)); else set('colors', c);
                }
                set('enableGridX', coerceBool(obj['enableGridX'] as any));
                set('enableGridY', coerceBool(obj['enableGridY'] as any));
                set('showLegend', coerceBool(obj['showLegend'] as any));
                set('gridColor', obj['gridColor']);
                set('gridStrokeWidth', obj['gridStrokeWidth']);
                set('animate', coerceBool(obj['animate'] as any));
                set('motionConfig', obj['motionConfig']);
                set('enableLabel', obj['enableLabel']);
                set('labelPosition', obj['labelPosition']);
                set('labelSkipWidth', obj['labelSkipWidth']);
                set('labelSkipHeight', obj['labelSkipHeight']);
                set('labelTextColor', obj['labelTextColor']);
                set('labelOffset', obj['labelOffset']);

                const ab = (obj['axisBottom'] || {}) as any;
                set('axisBottomTickSize', ab.tickSize);
                set('axisBottomTickPadding', ab.tickPadding);
                set('axisBottomTickRotation', ab.tickRotation);
                set('axisBottomLegend', ab.legend);
                set('axisBottomLegendOffset', ab.legendOffset);
                set('axisBottomLegendPosition', ab.legendPosition);

                const al = (obj['axisLeft'] || {}) as any;
                set('axisLeftTickSize', al.tickSize);
                set('axisLeftTickPadding', al.tickPadding);
                set('axisLeftTickRotation', al.tickRotation);
                set('axisLeftLegend', al.legend);
                set('axisLeftLegendOffset', al.legendOffset);
                return pairs;
              };

              const nivoAttrsObj = toPairs(chartProps);
              const nivoAttrStr = buildAttrs(nivoAttrsObj as Record<string, string>);
              const nivoTag = `<nivo ${nivoAttrStr} />`;

              // Remover <props> legado, se existir
              let newInner = chartInner.replace(/<props\b[^>]*>[\s\S]*?<\/props>/i, '').trimEnd();

              // Upsert <nivo />
              const nivoPairRe = /<nivo\b[^>]*>[\s\S]*?<\/nivo>/i;
              const nivoSelfRe = /<nivo\b[^>]*\/>/i;
              if (nivoPairRe.test(newInner)) newInner = newInner.replace(nivoPairRe, nivoTag);
              else if (nivoSelfRe.test(newInner)) newInner = newInner.replace(nivoSelfRe, nivoTag);
              else newInner = newInner + `\n          ${nivoTag}`;

              return { open: newAttrsStr, inner: newInner };
            };
            if (chartPairRe.test(innerNext)) {
              innerNext = innerNext.replace(chartPairRe, (_m, openAttrsStr: string, chartInner: string) => {
                const { open, inner: ci } = applyChartProps(openAttrsStr, chartInner);
                return `<Chart ${buildAttrs(parseAttrs(open))}>${ci}</Chart>`;
              });
            } else if (chartSelfRe.test(innerNext)) {
              innerNext = innerNext.replace(chartSelfRe, (_m, openAttrsStr: string) => {
                const { open, inner: ci } = applyChartProps(openAttrsStr, '');
                return `<Chart ${buildAttrs(parseAttrs(open))}>${ci}</Chart>`;
              });
            }
            const newWhole = `<article${openAttrs}>${innerNext}</article>`;
            let newCode = src.replace(whole, newOpenTag + innerNext + `</article>`);
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
