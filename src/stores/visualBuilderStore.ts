'use client'

import { atom } from 'nanostores'
import { ConfigParser } from '@/components/visual-builder/ConfigParser'
import type { Widget, GridConfig, ParseResult } from '@/components/visual-builder/ConfigParser'

// Re-export types for use in other components
export type { Widget, GridConfig } from '@/components/visual-builder/ConfigParser'

// Tipos para filtros globais
export type DateRangeType = 'today' | 'yesterday' | 'last_7_days' | 'last_14_days' | 'last_30_days' | 'last_90_days' | 'current_month' | 'last_month' | 'custom';

export interface DateRangeFilter {
  type: DateRangeType;
  startDate?: string;
  endDate?: string;
}

export interface GlobalFilters {
  dateRange: DateRangeFilter;
}

// Estado da store
interface VisualBuilderState {
  widgets: Widget[]
  gridConfig: GridConfig
  code: string
  parseErrors: ParseResult['errors']
  isValid: boolean
  globalFilters: GlobalFilters
  dashboardTitle?: string
  dashboardSubtitle?: string
}

// Helper: compact specific sections inside a JSON string to one line
const compactJsonSections = (code: string): string => {
  const collapse = (match: string) =>
    match
      .replace(/\n\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\{\s+/g, '{ ')
      .replace(/\s+\}/g, ' }')
      .replace(/,\s+/g, ', ');

  return code
    .replace(/("config"\s*:\s*\{[\s\S]*?\})/g, collapse)
    .replace(/("dataSource"\s*:\s*\{[\s\S]*?\})/g, collapse)
    .replace(/("span"\s*:\s*\{[\s\S]*?\})/g, collapse)
    .replace(/("styling"\s*:\s*\{[\s\S]*?\})/g, collapse);
};

// Helper: compact layoutRows block to a single line
const compactLayoutRows = (code: string): string => {
  try {
    const parsed: unknown = JSON.parse(code);
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { layoutRows?: unknown }).layoutRows &&
      typeof (parsed as { layoutRows?: unknown }).layoutRows === 'object'
    ) {
      const pretty = JSON.stringify(parsed, null, 2);
      const start = pretty.indexOf('"layoutRows"');
      if (start === -1) return code;
      const braceStart = pretty.indexOf('{', start);
      if (braceStart === -1) return code;
      let i = braceStart;
      let depth = 0;
      for (; i < pretty.length; i++) {
        const ch = pretty[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      if (depth !== 0) return code;
      const end = i; // index of matching closing brace
      const inline = `"layoutRows": ${JSON.stringify((parsed as { layoutRows: unknown }).layoutRows)}`;
      return pretty.slice(0, start) + inline + pretty.slice(end + 1);
    }
    return code;
  } catch {
    return code;
  }
};

// Helper: reorder widget keys so id,type,row,span,heightPx come first
const reorderWidgetKeysInCode = (code: string): string => {
  try {
    const parsed: unknown = JSON.parse(code);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { widgets?: unknown }).widgets)
    ) {
      const root = parsed as { widgets: Array<Record<string, unknown>>; [k: string]: unknown };
      const desired = ['id', 'type', 'row', 'span', 'heightPx'] as const;
      root.widgets = root.widgets.map((w) => {
        if (!w || typeof w !== 'object') return w;
        const newW: Record<string, unknown> = {};
        // Add desired keys first if present
        for (const key of desired) {
          if (Object.prototype.hasOwnProperty.call(w, key)) newW[key] = (w as Record<string, unknown>)[key];
        }
        // Preserve original order for the rest
        for (const key of Object.keys(w)) {
          if (!desired.includes(key as typeof desired[number])) {
            newW[key] = (w as Record<string, unknown>)[key];
          }
        }
        return newW;
      });
      return JSON.stringify(root, null, 2);
    }
    return code;
  } catch {
    return code;
  }
};

// Helper: compact widget header lines (id, type, row, span, heightPx) into one line
const compactWidgetHeaders = (code: string): string => {
  // This expects the ordered keys to be the first lines inside each widget object
  return code.replace(/\{\s*\n\s*"id": [^,\n]+,\s*\n\s*"type": [^,\n]+,\s*\n\s*"row": [^,\n]+,\s*\n\s*"span": \{[\s\S]*?\},\s*\n\s*"heightPx": [^,\n]+,/g, (m) => m.replace(/\n\s*/g, ' '));
};

