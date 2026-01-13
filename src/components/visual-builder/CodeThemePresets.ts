"use client";

// Shared helpers and preset theming functions extracted from visual-builder/page.tsx

// --- Helpers ---
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

// --- Presets and APIs ---
export type PresetKey = 'clean-light' | 'clean-dark' | 'minimal-cards';
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

export const PRESETS: Preset[] = [
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

export function applyPresetOnCode(code: string, key: PresetKey): string {
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

export function detectPresetKey(code: string): PresetKey | 'custom' {
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

