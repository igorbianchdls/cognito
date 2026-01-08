'use client';

import { FontManager, type FontPresetKey } from '@/components/visual-builder/FontManager';

export type GlobalStylePatch = {
  // Current scope: only fontFamily is actively applied.
  // File is designed to be extended for more props later.
  fontFamily?: string;
};

// Replace value of a CSS declaration inside an inline style string.
function replaceCssDeclaration(style: string, prop: string, newValue: string): { style: string; replaced: boolean } {
  const re = new RegExp(`(^|;)\\s*${prop}\\s*:\\s*([^;]+)(;|$)`, 'i');
  if (re.test(style)) {
    const next = style.replace(re, (_m, p1, _old, p3) => `${p1 ? p1 : ''}${p1 ? ' ' : ''}${prop}: ${newValue}${p3 ? p3 : ''}`);
    return { style: next, replaced: true };
  }
  return { style, replaced: false };
}

// Merge (or add if missing) style attribute on a given tag's attribute block
function mergeStyleInTagAttrs(attrs: string, patch: GlobalStylePatch): string {
  const styleAttrRe = /(\sstyle\s*=\s*)("([^"]*)"|'([^']*)')/i;
  const hasStyle = styleAttrRe.test(attrs);
  if (!hasStyle) {
    const parts: string[] = [];
    if (patch.fontFamily) parts.push(`font-family: ${patch.fontFamily}`);
    if (parts.length === 0) return attrs; // nothing to do
    return `${attrs} style="${parts.join('; ')}"`;
  }
  return attrs.replace(styleAttrRe, (_whole, prefix, q, dval, sval) => {
    const quote = q.startsWith('"') ? '"' : "'";
    let styleStr = (dval ?? sval) || '';
    if (patch.fontFamily) {
      const r = replaceCssDeclaration(styleStr, 'font-family', patch.fontFamily);
      styleStr = r.style;
      if (!r.replaced) {
        styleStr = styleStr.trim();
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';';
        styleStr += ` font-family: ${patch.fontFamily}`;
      }
    }
    return `${prefix}${quote}${styleStr}${quote}`;
  });
}

// Ensure the first element with class vb-container has the patch applied at attribute level
function ensureContainerStyle(html: string, patch: GlobalStylePatch): string {
  const re = /<([a-z][^>\s]*)\b([^>]*\bclass\s*=\s*("[^"]*\bvb-container\b[^"]*"|'[^']*\bvb-container\b[^']*')[^>]*)>/i;
  return html.replace(re, (_whole, tag, attrs) => {
    const nextAttrs = mergeStyleInTagAttrs(String(attrs), patch);
    return `<${String(tag)}${nextAttrs}>`;
  });
}

// Replace every inline font-family inside all style attributes across the document
function replaceAllInlineFontFamilies(html: string, fontFamily: string): string {
  const re = /(style\s*=\s*)("([^"]*)"|'([^']*)')/gi;
  return html.replace(re, (_whole, prefix, q, dval, sval) => {
    const quote = q.startsWith('"') ? '"' : "'";
    let styleStr = (dval ?? sval) || '';
    const r = replaceCssDeclaration(styleStr, 'font-family', fontFamily);
    if (r.replaced) {
      return `${prefix}${quote}${r.style}${quote}`;
    }
    // If no font-family in this style, keep it as is
    return `${prefix}${quote}${styleStr}${quote}`;
  });
}

export function setGlobalStyleInHtml(code: string, patch: GlobalStylePatch): string {
  if (!code || typeof code !== 'string') return code;
  let next = String(code);
  if (patch.fontFamily && patch.fontFamily.trim()) {
    next = ensureContainerStyle(next, { fontFamily: patch.fontFamily });
    next = replaceAllInlineFontFamilies(next, patch.fontFamily);
  }
  return next;
}

export function getGlobalStyleFromHtml(code: string): GlobalStylePatch {
  const out: GlobalStylePatch = {};
  if (!code || typeof code !== 'string') return out;
  const styleAttrRe = /style\s*=\s*("([^"]*)"|'([^']*)')/gi;
  // Prefer font-family declared on container
  const containerRe = /<([a-z][^>\s]*)\b([^>]*\bclass\s*=\s*("[^"]*\bvb-container\b[^"]*"|'[^']*\bvb-container\b[^']*')[^>]*)>/i;
  const m = nextMatch(containerRe, code);
  if (m) {
    const attrs = m[2] || '';
    const sm = nextMatch(styleAttrRe, attrs);
    if (sm) {
      const styleStr = sm[2] || sm[3] || '';
      const ff = extractCssDeclaration(styleStr, 'font-family');
      if (ff) out.fontFamily = ff;
    }
  }
  // Fallback: first inline style with font-family
  if (!out.fontFamily) {
    let s: RegExpExecArray | null;
    styleAttrRe.lastIndex = 0;
    while ((s = styleAttrRe.exec(code)) != null) {
      const styleStr = s[2] || s[3] || '';
      const ff = extractCssDeclaration(styleStr, 'font-family');
      if (ff) { out.fontFamily = ff; break; }
    }
  }
  return out;
}

function nextMatch(re: RegExp, s: string): RegExpExecArray | null {
  re.lastIndex = 0;
  return re.exec(s);
}

function extractCssDeclaration(style: string, prop: string): string | undefined {
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
  const m = re.exec(style);
  return m ? m[1].trim() : undefined;
}

// Convenience: apply font by preset key using FontManager
export function setGlobalFontByPresetKey(code: string, fontKey: FontPresetKey): string {
  const family = FontManager.getFontFamily(fontKey);
  return setGlobalStyleInHtml(code, { fontFamily: family });
}

