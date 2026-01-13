"use client";

// Mutations and detectors for header styles in Liquid/HTML dashboard code

type BorderStyle = 'solid' | 'dashed' | 'dotted' | string;

export type HeaderContainerPatch = {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: BorderStyle;
  borderRadius?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginBottom?: number;
};

export type HeaderTextPatch = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  letterSpacing?: number;
  lineHeight?: number | string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
};

export type HeaderStylesSnapshot = {
  container: Record<string, string>;
  title: Record<string, string>;
  subtitle: Record<string, string>;
};

// Helpers (string-based)
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

const toInlineStyle = (obj: Record<string, string>): string => {
  return Object.entries(obj).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`${k}:${v}`).join('; ');
};

const getHeaderMatch = (dsl: string) => dsl.match(/<header\b([^>]*)>([\s\S]*?)<\/header>/i);

const setHeaderOpenStyle = (openAttrs: string, styleObj: Record<string,string>): string => {
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  let newOpenAttrs = openAttrs.replace(styleRe, '');
  newOpenAttrs = newOpenAttrs.replace(/\s+$/, '');
  const styleStr = toInlineStyle(styleObj);
  return `<header${newOpenAttrs}${styleStr ? ` style=\"${styleStr}\"` : ''}>`;
};

const withHeaderOpen = (code: string, mut: (open: string, inner: string) => { open: string; inner: string } | null): string => {
  const mh = getHeaderMatch(code);
  if (!mh) return code;
  const whole = mh[0]; const open = mh[1] || ''; const inner = mh[2] || '';
  const res = mut(open, inner);
  if (!res) return code;
  const nextHeader = `${res.open}${res.inner}</header>`;
  return code.replace(whole, nextHeader);
};

const pickUnit = (n?: number) => (typeof n === 'number' ? `${n}px` : undefined);

export function setHeaderContainerStyle(code: string, patch: HeaderContainerPatch): string {
  return withHeaderOpen(code, (open, inner) => {
    const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
    const sm = open.match(styleRe);
    const so = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
    if (patch.backgroundColor !== undefined) so['background-color'] = String(patch.backgroundColor);
    if (patch.borderColor !== undefined) so['border-color'] = String(patch.borderColor);
    if (patch.borderWidth !== undefined) so['border-width'] = pickUnit(patch.borderWidth)!;
    if (patch.borderStyle !== undefined) so['border-style'] = String(patch.borderStyle);
    if (patch.borderRadius !== undefined) so['border-radius'] = pickUnit(patch.borderRadius)!;
    if (patch.padding !== undefined) so['padding'] = pickUnit(patch.padding)!;
    if (patch.paddingTop !== undefined) so['padding-top'] = pickUnit(patch.paddingTop)!;
    if (patch.paddingRight !== undefined) so['padding-right'] = pickUnit(patch.paddingRight)!;
    if (patch.paddingBottom !== undefined) so['padding-bottom'] = pickUnit(patch.paddingBottom)!;
    if (patch.paddingLeft !== undefined) so['padding-left'] = pickUnit(patch.paddingLeft)!;
    if (patch.marginBottom !== undefined) so['margin-bottom'] = pickUnit(patch.marginBottom)!;
    const newOpen = setHeaderOpenStyle(open, so);
    return { open: newOpen, inner };
  });
}

const setNthPStyle = (inner: string, idx: number, patch: HeaderTextPatch): string => {
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  const matches = Array.from(inner.matchAll(pRe));
  if (!matches[idx]) return inner;
  const full = matches[idx][0];
  const open = matches[idx][1] || '';
  const body = matches[idx][2] || '';
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  const sm = open.match(styleRe);
  const ps = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
  if (patch.fontFamily !== undefined) ps['font-family'] = String(patch.fontFamily);
  if (patch.fontSize !== undefined) ps['font-size'] = pickUnit(patch.fontSize)!;
  if (patch.fontWeight !== undefined) ps['font-weight'] = String(patch.fontWeight);
  if (patch.color !== undefined) ps['color'] = String(patch.color);
  if (patch.letterSpacing !== undefined) ps['letter-spacing'] = String(patch.letterSpacing);
  if (patch.lineHeight !== undefined) ps['line-height'] = typeof patch.lineHeight === 'number' ? String(patch.lineHeight) : patch.lineHeight;
  if (patch.marginTop !== undefined) ps['margin-top'] = pickUnit(patch.marginTop)!;
  if (patch.marginRight !== undefined) ps['margin-right'] = pickUnit(patch.marginRight)!;
  if (patch.marginBottom !== undefined) ps['margin-bottom'] = pickUnit(patch.marginBottom)!;
  if (patch.marginLeft !== undefined) ps['margin-left'] = pickUnit(patch.marginLeft)!;
  if (patch.paddingTop !== undefined) ps['padding-top'] = pickUnit(patch.paddingTop)!;
  if (patch.paddingRight !== undefined) ps['padding-right'] = pickUnit(patch.paddingRight)!;
  if (patch.paddingBottom !== undefined) ps['padding-bottom'] = pickUnit(patch.paddingBottom)!;
  if (patch.paddingLeft !== undefined) ps['padding-left'] = pickUnit(patch.paddingLeft)!;
  const noStyle = open.replace(styleRe, '').replace(/\s+$/, '');
  const newOpen = `<p${noStyle ? ` ${noStyle}` : ''}${Object.keys(ps).length ? ` style=\"${toInlineStyle(ps)}\"` : ''}>`;
  const replaced = `${newOpen}${body}</p>`;
  return inner.replace(full, replaced);
};

export function setHeaderTitleStyle(code: string, patch: HeaderTextPatch): string {
  return withHeaderOpen(code, (open, inner) => {
    const nextInner = setNthPStyle(inner, 0, patch);
    return { open, inner: nextInner };
  });
}

export function setHeaderSubtitleStyle(code: string, patch: HeaderTextPatch): string {
  return withHeaderOpen(code, (open, inner) => {
    const nextInner = setNthPStyle(inner, 1, patch);
    return { open, inner: nextInner };
  });
}

export function detectHeaderStyles(code: string): HeaderStylesSnapshot {
  const mh = getHeaderMatch(code);
  const out: HeaderStylesSnapshot = { container: {}, title: {}, subtitle: {} };
  if (!mh) return out;
  const open = mh[1] || '';
  const inner = mh[2] || '';
  const styleRe = /style\s*=\s*("([^"]*)"|'([^']*)')/i;
  const sm = open.match(styleRe);
  out.container = parseInlineStyle(sm ? (sm[2] || sm[3] || '') : '');
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  const matches = Array.from(inner.matchAll(pRe));
  if (matches[0]) {
    const s0 = matches[0][1].match(styleRe);
    out.title = parseInlineStyle(s0 ? (s0[2] || s0[3] || '') : '');
  }
  if (matches[1]) {
    const s1 = matches[1][1].match(styleRe);
    out.subtitle = parseInlineStyle(s1 ? (s1[2] || s1[3] || '') : '');
  }
  return out;
}

