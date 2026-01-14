"use client";

import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Palette, Type, Layout, Check } from "lucide-react";
import { PRESETS, applyPresetOnCode, detectPresetKey, type PresetKey } from "@/components/visual-builder/CodeThemePresets";
import { BorderManager, type BorderPresetKey } from "@/components/visual-builder/BorderManager";
import { FontManager, type FontPresetKey, type FontSizeKey } from "@/components/visual-builder/FontManager";
import { ThemeManager, type ThemeName } from "@/components/visual-builder/ThemeManager";

type Props = {
  code: string;
  onChange: (next: string) => void;
};

export default function CodeThemeMenu({ code, onChange }: Props) {
  // ===== CSS vars helpers (identical behavior to builder) =====
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
    const rootRe = /:root\s*\{([\s\S]*?)\}/i;
    const rm = styleText.match(rootRe);
    if (!rm) {
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

  const cssVars = useMemo(() => readCssVarsFromDsl(String(code || '')), [code]);
  const normalizeFamily = (s?: string) => (s || '').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim().replace(/^"|"$/g, '')
  const availableFonts = useMemo(() => FontManager.getAvailableFonts(), []);
  const availableFontSizes = useMemo(() => FontManager.getAvailableFontSizes(), []);
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

  const currentThemeName: ThemeName = useMemo<ThemeName>(() => {
    const raw = String(code || '').trim();
    try {
      if (raw.startsWith('<')) {
        const m = raw.match(/<dashboard\b[^>]*\btheme\s*=\s*\"([^\"]+)\"/i);
        if (m && m[1] && ThemeManager.isValidTheme(m[1] as ThemeName)) return m[1] as ThemeName;
        return 'branco';
      }
    } catch {}
    return 'branco';
  }, [code]);

  // Font handlers
  const handleSetStyleFont = useCallback((fontKey: FontPresetKey) => {
    const family = FontManager.getFontFamily(fontKey);
    onChange(writeCssVarsToDsl(code, { '--vb-font-family': family }));
  }, [code, onChange]);
  const handleSetStyleFontSize = useCallback((sizeKey: FontSizeKey) => {
    const px = FontManager.getFontSizeValue(sizeKey) + 'px';
    onChange(writeCssVarsToDsl(code, { '--vb-title-size': px }));
  }, [code, onChange]);
  const handleSetStyleLetterSpacing = useCallback((value: number) => {
    onChange(writeCssVarsToDsl(code, { '--vb-letter-spacing': `${value}em` }));
  }, [code, onChange]);
  const handleSetChartBodyFont = useCallback((fontKey: FontPresetKey) => {
    const family = FontManager.getFontFamily(fontKey);
    onChange(writeCssVarsToDsl(code, { '--vb-chart-font-family': family }));
  }, [code, onChange]);

  // Header preset handlers (auto/light/dark) and colors
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
    return (currentThemeName === 'branco' || currentThemeName === 'cinza-claro') ? 'light' : 'dark';
  };
  const applyHeaderPresetOnCode = (src: string, preset: HeaderPreset): string => {
    const m = getHeaderMatch(src);
    if (!m) return src;
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
    return src.replace(whole, newOpen + nextInner + `</header>`);
  };
  const detectHeaderPreset = (src: string): HeaderPreset => {
    const m = getHeaderMatch(src);
    if (!m) return 'auto';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const s = (m[1] || '').match(styleRe);
    const so = parseInlineStyle(s ? (s[2] || s[3] || '') : '');
    const bg = (so['background-color'] || '').toLowerCase().trim();
    if (bg === '#ffffff' || bg === 'white') return 'light';
    if (bg === '#111827' || bg === '#1f2937') return 'dark';
    return 'auto';
  };
  const headerPresetSelected = useMemo<HeaderPreset>(() => detectHeaderPreset(String(code || '')), [code]);
  const headerColors = useMemo(() => {
    const src = String(code || '');
    const m = getHeaderMatch(src);
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
  }, [code, headerPresetSelected, currentThemeName]);

  const handleApplyPreset = useCallback((key: PresetKey) => {
    onChange(applyPresetOnCode(code, key));
  }, [code, onChange]);
  const handleApplyHeaderPreset = useCallback((preset: HeaderPreset) => {
    onChange(applyHeaderPresetOnCode(code, preset));
  }, [code, onChange, currentThemeName]);
  const handleSetHeaderBgColor = useCallback((hex: string) => {
    const src = String(code || '');
    const m = getHeaderMatch(src); if (!m) return;
    const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const styleM = openAttrs.match(styleRe);
    const so = parseInlineStyle(styleM ? (styleM[2] || styleM[3] || '') : '');
    so['background-color'] = hex;
    const newOpen = setHeaderOpenStyle(openAttrs, so);
    const next = src.replace(whole, newOpen + innerOld + `</header>`);
    onChange(next);
  }, [code, onChange]);
  const handleSetHeaderTitleColor = useCallback((hex: string) => {
    const src = String(code || '');
    const m = getHeaderMatch(src); if (!m) return;
    const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
    const innerNext = setHeaderTextColors(innerOld, hex, undefined);
    const next = src.replace(whole, `<header${openAttrs}>` + innerNext + `</header>`);
    onChange(next);
  }, [code, onChange]);
  const handleSetHeaderSubtitleColor = useCallback((hex: string) => {
    const src = String(code || '');
    const m = getHeaderMatch(src); if (!m) return;
    const whole = m[0]; const openAttrs = m[1] || ''; const innerOld = m[2] || '';
    const innerNext = setHeaderTextColors(innerOld, undefined, hex);
    const next = src.replace(whole, `<header${openAttrs}>` + innerNext + `</header>`);
    onChange(next);
  }, [code, onChange]);

  const selectedPreset = useMemo(() => detectPresetKey(String(code || '')), [code]);
  // ===== Articles (global) style helpers (match builder) =====
  type BorderStyle = 'solid' | 'dashed' | 'dotted';
  type ArticleStyleAggregate = {
    bg?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: BorderStyle;
    borderRadius?: number;
    borderBottomWidth?: number;
    shadow?: boolean;
    titleColor?: string;
    titleSize?: number;
    titleWeight?: string | number;
    paddingTop?: number; paddingRight?: number; paddingBottom?: number; paddingLeft?: number;
    marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number;
    valueColor?: string; valueSize?: number; valueWeight?: string | number;
  };
  const getAllArticles = (src: string): Array<{ whole: string; open: string; inner: string }> => {
    const re = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
    const out: Array<{ whole: string; open: string; inner: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) out.push({ whole: m[0], open: m[1] || '', inner: m[2] || '' });
    return out;
  };
  const parsePxNum = (v?: string) => { if (!v) return undefined; const n = Number(String(v).replace(/px$/,'')); return Number.isNaN(n) ? undefined : n; };
  const parseBox = (v?: string): { t?: number; r?: number; b?: number; l?: number } => {
    if (!v) return {};
    const parts = String(v).trim().split(/\s+/);
    const toN = (x: string) => Number(String(x).replace(/px$/,''));
    if (parts.length === 1) { const n = toN(parts[0]); return Number.isNaN(n) ? {} : { t: n, r: n, b: n, l: n }; }
    if (parts.length === 2) { const v1 = toN(parts[0]); const v2 = toN(parts[1]); if ([v1,v2].some(Number.isNaN)) return {}; return { t: v1, b: v1, r: v2, l: v2 }; }
    if (parts.length === 3) { const v1 = toN(parts[0]); const v2 = toN(parts[1]); const v3 = toN(parts[2]); if ([v1,v2,v3].some(Number.isNaN)) return {}; return { t: v1, r: v2, l: v2, b: v3 }; }
    if (parts.length >= 4) { const v1 = toN(parts[0]); const v2 = toN(parts[1]); const v3 = toN(parts[2]); const v4 = toN(parts[3]); if ([v1,v2,v3,v4].some(Number.isNaN)) return {}; return { t: v1, r: v2, b: v3, l: v4 }; }
    return {};
  };
  const readArticlesAggregate = (src: string): ArticleStyleAggregate => {
    const arts = getAllArticles(src);
    if (!arts.length) return {};
    const { open, inner } = arts[0];
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const s = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    const agg: ArticleStyleAggregate = {};
    if (s['background-color']) agg.bg = s['background-color'];
    if (s['border-color']) agg.borderColor = s['border-color'];
    if (s['border-width']) agg.borderWidth = parsePxNum(s['border-width']);
    if (s['border-style']) agg.borderStyle = s['border-style'] as BorderStyle;
    if (s['border-radius']) agg.borderRadius = parsePxNum(s['border-radius']);
    if (s['border-bottom-width']) agg.borderBottomWidth = parsePxNum(s['border-bottom-width']);
    if (s['box-shadow']) {
      const bxs = String(s['box-shadow']).trim().toLowerCase();
      if (bxs && bxs !== 'none') agg.shadow = true;
    }
    const pbox = parseBox(s['padding']);
    agg.paddingTop = parsePxNum(s['padding-top']) ?? pbox.t;
    agg.paddingRight = parsePxNum(s['padding-right']) ?? pbox.r;
    agg.paddingBottom = parsePxNum(s['padding-bottom']) ?? pbox.b;
    agg.paddingLeft = parsePxNum(s['padding-left']) ?? pbox.l;
    const mbox = parseBox(s['margin']);
    agg.marginTop = parsePxNum(s['margin-top']) ?? mbox.t;
    agg.marginRight = parsePxNum(s['margin-right']) ?? mbox.r;
    agg.marginBottom = parsePxNum(s['margin-bottom']) ?? mbox.b;
    agg.marginLeft = parsePxNum(s['margin-left']) ?? mbox.l;
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
    const pm = inner.match(pRe);
    if (pm) {
      const pmStyleM = pm[1].match(styleRe);
      const ps = parseInlineStyle(pmStyleM ? (pmStyleM[2] || pmStyleM[3] || '') : '');
      if (ps['color']) agg.titleColor = ps['color'];
      if (ps['font-size']) agg.titleSize = parsePxNum(ps['font-size']);
      if (ps['font-weight']) agg.titleWeight = (/^\d+$/.test(ps['font-weight']) ? Number(ps['font-weight']) : ps['font-weight']);
    }
    const kvRe = /<([a-z]+)\b([^>]*?class\s*=\s*(?:"[^"]*\bkpi-value\b[^"]*"|'[^']*\bkpi-value\b[^']*'))[^>]*>([\s\S]*?)<\/\1>/i;
    const kvm = inner.match(kvRe);
    if (kvm) {
      const openKV = kvm[2] || '';
      const stKV = openKV.match(styleRe);
      const kvs = parseInlineStyle(stKV ? (stKV[2] || stKV[3] || '') : '');
      if (kvs['color']) agg.valueColor = kvs['color'];
      if (kvs['font-size']) agg.valueSize = parsePxNum(kvs['font-size']);
      if (kvs['font-weight']) agg.valueWeight = (/^\d+$/.test(kvs['font-weight']) ? Number(kvs['font-weight']) : kvs['font-weight']);
    }
    return agg;
  };
  const articlesAggregate = useMemo(() => readArticlesAggregate(String(code || '')), [code]);
  const borderSelected = useMemo<BorderPresetKey | 'custom'>(() => {
    const bw = articlesAggregate.borderWidth ?? 0;
    const br = articlesAggregate.borderRadius ?? 0;
    const bs = articlesAggregate.borderStyle;
    const bbw = articlesAggregate.borderBottomWidth ?? 0;
    const shadow = articlesAggregate.shadow ?? false;
    if (bbw > 0 && bw === 0) return 'linha-inferior';
    if (bs === 'dashed') return 'suave-tracejada';
    if (bs === 'dotted') return 'pontilhada-minimal';
    if (bw === 0 && shadow) return 'cartao-elevado';
    if (bw === 0) return 'sem-borda';
    if (br > 0) return 'suave';
    return 'acentuada';
  }, [articlesAggregate]);
  const setArticleOpenStyle = (openAttrs: string, mut: (so: Record<string,string>) => void): string => {
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const m = openAttrs.match(styleRe);
    const so = parseInlineStyle(m ? (m[2] || m[3] || '') : '');
    mut(so);
    if (so['padding-top'] || so['padding-right'] || so['padding-bottom'] || so['padding-left']) delete so['padding'];
    if (so['margin-top'] || so['margin-right'] || so['margin-bottom'] || so['margin-left']) delete so['margin'];
    const noStyle = openAttrs.replace(styleRe, '').replace(/\s+$/, '');
    const styleStr = toInlineStyle(so);
    return `${noStyle ? ` ${noStyle}` : ''}${styleStr ? ` style=\"${styleStr}\"` : ''}`;
  };
  const rewriteAllArticles = (src: string, patch: (open: string, inner: string) => { open: string; inner: string }): string => {
    const arts = getAllArticles(src);
    if (!arts.length) return src;
    let next = src;
    for (const a of arts) {
      const out = patch(a.open, a.inner);
      const newWhole = `<article${out.open}>${out.inner}</article>`;
      next = next.replace(a.whole, newWhole);
    }
    return next;
  };
  const setFirstPStyle = (inner: string, mut: (ps: Record<string,string>) => void): string => {
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/i;
    const m = inner.match(pRe); if (!m) return inner;
    const open = m[1] || ''; const body = m[2] || '';
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const ps = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    mut(ps);
    const noStyle = open.replace(styleRe, '').replace(/\s+$/, '');
    const newOpen = `<p${noStyle ? ` ${noStyle}` : ''}${Object.keys(ps).length ? ` style=\"${toInlineStyle(ps)}\"` : ''}>`;
    return inner.replace(m[0], `${newOpen}${body}</p>`);
  };
  const setKpiValueStyle = (inner: string, mut: (ps: Record<string,string>) => void): string => {
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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <span>Tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
                <DropdownMenuItem key={theme} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: preview.primaryColor }} />
                    <div>
                      <div className="font-medium">{preview.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-40">{preview.description}</div>
                    </div>
                  </div>
                  {currentThemeName === theme && (<Check className="w-4 h-4 text-blue-600" />)}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="w-4 h-4 mr-2" />
            Borda
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-72">
            {BorderManager.getAvailableBorders().map((b) => (
              <DropdownMenuItem
                key={b.key}
                className="flex items-center justify-between py-2"
                onClick={() => {
                  const style = BorderManager.getStyle(b.key);
                  const next = rewriteAllArticles(code, (open, inner) => {
                    const newOpen = setArticleOpenStyle(open, (so) => {
                      // Clear all border sides first
                      delete so['border'];
                      delete so['border-color'];
                      delete so['border-width'];
                      delete so['border-style'];
                      delete so['border-top']; delete so['border-right']; delete so['border-left']; delete so['border-bottom'];
                      delete so['border-top-color']; delete so['border-top-width']; delete so['border-top-style'];
                      delete so['border-right-color']; delete so['border-right-width']; delete so['border-right-style'];
                      delete so['border-left-color']; delete so['border-left-width']; delete so['border-left-style'];
                      delete so['border-bottom-color']; delete so['border-bottom-width']; delete so['border-bottom-style'];
                      // Clear any corner backgrounds first
                      delete so['background-image'];
                      delete so['background-size'];
                      delete so['background-position'];
                      delete so['background-repeat'];

                      if (style.sides === 'bottom') {
                        // Only bottom border
                        so['border-bottom-color'] = style.color;
                        so['border-bottom-width'] = `${style.width}px`;
                        so['border-bottom-style'] = style.width > 0 ? (style.borderStyle || 'solid') : 'none';
                        so['border-radius'] = `${style.radius}px`;
                      } else {
                        // All sides
                        so['border-color'] = style.color;
                        so['border-width'] = `${style.width}px`;
                        so['border-style'] = style.width > 0 ? (style.borderStyle || 'solid') : 'none';
                        so['border-radius'] = `${style.radius}px`;
                      }

                      if (style.shadow === false) so['box-shadow'] = 'none';
                      if (style.shadow === true && style.width === 0) {
                        so['box-shadow'] = '0 1px 2px rgba(0,0,0,0.06), 0 1.5px 4px rgba(0,0,0,0.08)';
                      }

                      // Apply colored corner accents (no glow)
                      if (b.key === 'cantos-coloridos') {
                        const c = style.cornerColor || '#3b82f6';
                        const L = (style.cornerLength ?? 12);
                        const T = (style.cornerThickness ?? 2);
                        const horiz = `linear-gradient(${c}, ${c})`;
                        const vert = `linear-gradient(${c}, ${c})`;
                        so['background-image'] = [horiz, vert, horiz, vert, horiz, vert, horiz, vert].join(', ');
                        so['background-position'] = [
                          'top left', 'top left',
                          'top right', 'top right',
                          'bottom left', 'bottom left',
                          'bottom right', 'bottom right',
                        ].join(', ');
                        so['background-size'] = [
                          `${L}px ${T}px`, `${T}px ${L}px`,
                          `${L}px ${T}px`, `${T}px ${L}px`,
                          `${L}px ${T}px`, `${T}px ${L}px`,
                          `${L}px ${T}px`, `${T}px ${L}px`,
                        ].join(', ');
                        so['background-repeat'] = 'no-repeat';
                      }
                    });
                    return { open: newOpen, inner };
                  });
                  onChange(next);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.description}</span>
                </div>
                {borderSelected === b.key && (<Check className="w-4 h-4 text-blue-600" />)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Type className="w-4 h-4 mr-2" />
            Fonte
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Família da Fonte</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableFonts.map((font) => (
                  <DropdownMenuItem key={font.key} className="flex items-center justify-between py-2" onClick={() => handleSetStyleFont(font.key)}>
                    <span style={{ fontFamily: font.family }} className="text-sm">{font.name}</span>
                    {selectedFontKey === font.key && (<Check className="w-4 h-4 text-blue-600" />)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tamanho da Fonte</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableFontSizes.map((size) => (
                  <DropdownMenuItem key={size.key} className="flex items-center justify-between py-2" onClick={() => handleSetStyleFontSize(size.key)}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{size.name}</span>
                      <span className="text-xs text-muted-foreground">{size.value}px • {size.usage}</span>
                    </div>
                    {selectedFontSizeKey === size.key && (<Check className="w-4 h-4 text-blue-600" />)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Letter Spacing</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[-0.05,-0.04,-0.03,-0.02,-0.01,0,0.01,0.02,0.03,0.04,0.05].map(v => (
                  <DropdownMenuItem key={v} className="flex items-center justify-between py-2" onClick={() => handleSetStyleLetterSpacing(v)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{v.toFixed(2)}em</span>
                      <span className="text-xs text-muted-foreground">tracking</span>
                    </div>
                    {Math.abs(selectedLetterSpacingValue - v) < 1e-6 && (<Check className="w-4 h-4 text-blue-600" />)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Chart Body Font</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableFonts.map((font) => (
                  <DropdownMenuItem key={font.key} className="flex items-center justify-between py-2" onClick={() => handleSetChartBodyFont(font.key)}>
                    <span style={{ fontFamily: font.family }} className="text-sm">{font.name}</span>
                    {selectedChartBodyFontKey === font.key && (<Check className="w-4 h-4 text-blue-600" />)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

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
              <div className="flex items-center justify-between gap-2"><span>Fundo</span><input type="color" aria-label="Cor de fundo do cabeçalho" value={headerColors.bg} onChange={(e)=>handleSetHeaderBgColor(e.target.value)} /></div>
              <div className="flex items-center justify-between gap-2"><span>Texto primário</span><input type="color" aria-label="Cor do título do cabeçalho" value={headerColors.title} onChange={(e)=>handleSetHeaderTitleColor(e.target.value)} /></div>
              <div className="flex items-center justify-between gap-2"><span>Texto secundário</span><input type="color" aria-label="Cor do subtítulo do cabeçalho" value={headerColors.subtitle} onChange={(e)=>handleSetHeaderSubtitleColor(e.target.value)} /></div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Articles Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Articles
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[420px]">
            <div className="px-3 py-2 text-xs text-muted-foreground">Container</div>
            <div className="px-3 py-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Fundo</span>
                <input type="color" value={articlesAggregate.bg || '#ffffff'} onChange={(e)=>onChange(rewriteAllArticles(code, (open, inner)=>({ open: setArticleOpenStyle(open, (so)=>{ so['background-color']=e.target.value; }), inner })))} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Borda</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={articlesAggregate.borderColor || '#e5e7eb'} onChange={(e)=>onChange(rewriteAllArticles(code, (open, inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['border-color']=e.target.value; so['border-style']=so['border-style']||'solid'; so['border-width']=so['border-width']||'1px'; }), inner })))} />
                  <input className="w-20 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.borderWidth ?? 1} onChange={(e)=>onChange(rewriteAllArticles(code, (open, inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['border-width']=`${Math.max(0, Math.round(Number(e.target.value||0)))}px`; so['border-style']=so['border-style']||'solid'; }), inner })))} />
                  <input className="w-20 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.borderRadius ?? 12} onChange={(e)=>onChange(rewriteAllArticles(code, (open, inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['border-radius']=`${Math.max(0, Math.round(Number(e.target.value||0)))}px`; }), inner })))} />
                  <select className="w-28 border rounded px-2 py-1" value={articlesAggregate.borderStyle || 'solid'} onChange={(e)=>onChange(rewriteAllArticles(code, (open, inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['border-style']=e.target.value; so['border-width']=so['border-width']||'1px'; }), inner })))}>
                    <option value="solid">solid</option>
                    <option value="dashed">dashed</option>
                    <option value="dotted">dotted</option>
                  </select>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-muted-foreground">Spacing</div>
            <div className="px-3 py-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Padding</span>
                <div className="flex items-center gap-2">
                  <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingTop ?? 12} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['padding-top']=`${Math.max(0,Math.round(Number(e.target.value||0)))}px`; }), inner })))} title="Topo" />
                  <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingRight ?? 12} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['padding-right']=`${Math.max(0,Math.round(Number(e.target.value||0)))}px`; }), inner })))} title="Direita" />
                  <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingBottom ?? 12} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['padding-bottom']=`${Math.max(0,Math.round(Number(e.target.value||0)))}px`; }), inner })))} title="Baixo" />
                  <input className="w-16 border rounded px-2 py-1" type="number" min={0} value={articlesAggregate.paddingLeft ?? 12} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['padding-left']=`${Math.max(0,Math.round(Number(e.target.value||0)))}px`; }), inner })))} title="Esquerda" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Margin</span>
                <div className="flex items-center gap-2">
                  <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginTop ?? 0} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['margin-top']=`${Math.round(Number(e.target.value||0))}px`; }), inner })))} title="Topo" />
                  <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginRight ?? 0} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['margin-right']=`${Math.round(Number(e.target.value||0))}px`; }), inner })))} title="Direita" />
                  <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginBottom ?? 16} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['margin-bottom']=`${Math.round(Number(e.target.value||0))}px`; }), inner })))} title="Baixo" />
                  <input className="w-16 border rounded px-2 py-1" type="number" value={articlesAggregate.marginLeft ?? 0} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open: setArticleOpenStyle(open,(so)=>{ so['margin-left']=`${Math.round(Number(e.target.value||0))}px`; }), inner })))} title="Esquerda" />
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-muted-foreground">Título</div>
            <div className="px-3 py-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Cor</span>
                <input type="color" value={articlesAggregate.titleColor || '#111827'} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open, inner: setFirstPStyle(inner,(ps)=>{ ps['color']=e.target.value; }) })))} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Tamanho</span>
                <input className="w-20 border rounded px-2 py-1" type="number" min={10} value={articlesAggregate.titleSize ?? 16} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open, inner: setFirstPStyle(inner,(ps)=>{ ps['font-size']=`${Math.max(8,Math.round(Number(e.target.value||0)))}px`; }) })))} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Peso</span>
                <select className="w-28 border rounded px-2 py-1" value={String(articlesAggregate.titleWeight ?? '600')} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open, inner: setFirstPStyle(inner,(ps)=>{ ps['font-weight']=String(e.target.value); }) })))}>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">SemiBold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-muted-foreground">Valor (KPI)</div>
            <div className="px-3 py-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Cor</span>
                <input type="color" value={articlesAggregate.valueColor || '#111827'} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open, inner: setKpiValueStyle(inner,(ps)=>{ ps['color']=e.target.value; }) })))} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Tamanho</span>
                <input className="w-20 border rounded px-2 py-1" type="number" min={10} value={articlesAggregate.valueSize ?? 28} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open, inner: setKpiValueStyle(inner,(ps)=>{ ps['font-size']=`${Math.max(8,Math.round(Number(e.target.value||0)))}px`; }) })))} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Peso</span>
                <select className="w-28 border rounded px-2 py-1" value={String(articlesAggregate.valueWeight ?? '700')} onChange={(e)=>onChange(rewriteAllArticles(code,(open,inner)=>({ open, inner: setKpiValueStyle(inner,(ps)=>{ ps['font-weight']=String(e.target.value); }) })))}>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">SemiBold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
