'use client';

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WidgetRenderer from './WidgetRenderer';
import WidgetEditorModal from './WidgetEditorModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Edit3, Trash2 } from 'lucide-react';
import RowEditorModal, { type RowSpec } from './RowEditorModal';
import GroupEditorModal, { type GroupSpecDraft } from './GroupEditorModal';
import DashboardInCanvasHeader from './DashboardInCanvasHeader';
import HeaderEditorModal from './HeaderEditorModal';
import type { Widget, GridConfig, LayoutRow } from './ConfigParser';
import { useStore as useNanoStore } from '@nanostores/react';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { GlobalFilters, DateRangeFilter } from '@/stores/visualBuilderStore';

interface ResponsiveGridCanvasProps {
  widgets: Widget[];
  gridConfig: GridConfig;
  globalFilters?: GlobalFilters;
  viewportMode?: 'desktop' | 'tablet' | 'mobile';
  onLayoutChange?: (widgets: Widget[]) => void;
  headerTitle?: string;
  headerSubtitle?: string;
  onFilterChange?: (filters: GlobalFilters) => void;
  isFilterLoading?: boolean;
  themeName?: import('./ThemeManager').ThemeName;
  // Optional external handler to open editor outside the canvas (prevents grid remount)
  onEdit?: (widget: Widget) => void;
  // Control whether the canvas renders its own sticky header
  renderHeader?: boolean;
  headerConfig?: import('./ConfigParser').HeaderConfig;
}

// Draggable Widget Component
interface DraggableWidgetProps {
  widget: Widget;
  spanClasses: string;
  spanValue: number;
  startValue?: number;
  minHeight: string;
  globalFilters?: GlobalFilters;
  onEdit: (widget: Widget) => void;
  onDuplicate: (widget: Widget) => void;
  onDelete: (widget: Widget) => void;
}

const DraggableWidget = memo(function DraggableWidget({ widget, spanClasses, spanValue, startValue, minHeight, globalFilters, onEdit, onDuplicate, onDelete }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: startValue ? `${startValue} / span ${spanValue}` : `span ${spanValue}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={spanClasses}
    >
      <div
        style={{
          height: minHeight,
          position: 'relative'
        }}
        className="group hover:ring-2 hover:ring-blue-400 rounded-lg transition-all"
      >
        {/* Drag Handle - Left Side */}
        <div
          {...listeners}
          className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-700 text-white px-2 py-1 rounded cursor-grab active:cursor-grabbing"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          ⋮⋮
        </div>

        {/* Actions Menu - Right Side */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800" aria-label="Ações do widget">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(widget); }} className="gap-2">
                <Edit3 className="w-4 h-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDuplicate(widget); }} className="gap-2">
                <Copy className="w-4 h-4" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={(e) => { e.preventDefault(); onDelete(widget); }} className="gap-2">
                <Trash2 className="w-4 h-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <WidgetRenderer widget={widget} globalFilters={globalFilters} />
      </div>
    </div>
  );
});

function ResponsiveGridCanvas({ widgets, gridConfig, globalFilters, viewportMode = 'desktop', onLayoutChange, headerTitle, headerSubtitle, onFilterChange, isFilterLoading, themeName, onEdit, renderHeader = true, headerConfig }: ResponsiveGridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Internal editor state used only when onEdit is not provided by parent
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<RowSpec | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState<GroupSpecDraft | null>(null);
  const visualBuilderState = useNanoStore($visualBuilderState);
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  // Helper: parse group spec directly from current DSL code
  const parseGroupSpecFromDsl = useCallback((dsl: string, gid: string): GroupSpecDraft => {
    const out: GroupSpecDraft = {};
    if (!dsl || typeof dsl !== 'string') return out;
    const re = /<group\b([^>]*)>([\s\S]*?)<\/group>/gi;
    const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
    const parseAttrs = (s: string): Record<string, string> => {
      const map: Record<string, string> = {};
      for (const m of s.matchAll(attrRegex)) map[m[1]] = m[2];
      return map;
    };
    let m: RegExpExecArray | null;
    while ((m = re.exec(dsl)) !== null) {
      const attrsStr = m[1] || '';
      const inner = m[2] || '';
      const attrs = parseAttrs(attrsStr);
      if ((attrs['id'] || '') !== gid) continue;
      // Title from attribute
      if (typeof attrs['title'] === 'string') out.title = attrs['title'];
      // Style JSON block
      const styleMatch = inner.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
      if (styleMatch && styleMatch[1]) {
        try {
          const styleObj = JSON.parse(styleMatch[1].trim()) as Record<string, unknown>;
          const pickStr = (k: string) => (typeof styleObj[k] === 'string' ? (styleObj[k] as string) : undefined);
          const pickNum = (k: string) => (typeof styleObj[k] === 'number' ? (styleObj[k] as number) : undefined);
          out.subtitle = pickStr('subtitle');
          out.backgroundColor = pickStr('backgroundColor');
          out.borderColor = pickStr('borderColor');
          out.borderWidth = pickNum('borderWidth');
          // Title typography
          out.titleFontFamily = pickStr('titleFontFamily');
          out.titleFontSize = pickNum('titleFontSize');
          out.titleFontWeight = (styleObj['titleFontWeight'] as string | number | undefined);
          out.titleColor = pickStr('titleColor');
          out.titleMarginTop = pickNum('titleMarginTop');
          out.titleMarginRight = pickNum('titleMarginRight');
          out.titleMarginBottom = pickNum('titleMarginBottom');
          out.titleMarginLeft = pickNum('titleMarginLeft');
          // Subtitle typography
          out.subtitleFontFamily = pickStr('subtitleFontFamily');
          out.subtitleFontSize = pickNum('subtitleFontSize');
          out.subtitleFontWeight = (styleObj['subtitleFontWeight'] as string | number | undefined);
          out.subtitleColor = pickStr('subtitleColor');
          out.subtitleMarginTop = pickNum('subtitleMarginTop');
          out.subtitleMarginRight = pickNum('subtitleMarginRight');
          out.subtitleMarginBottom = pickNum('subtitleMarginBottom');
          out.subtitleMarginLeft = pickNum('subtitleMarginLeft');
        } catch {
          // ignore invalid style json
        }
      }
      break;
    }
    return out;
  }, []);

  // Handle widget edit
  const handleEditWidget = useCallback((widget: Widget) => {
    if (onEdit) {
      onEdit(widget);
    } else {
      setEditingWidget(widget);
    }
  }, [onEdit]);

  // Row helpers
  const getRowSpecAll = useCallback((rowKey: string): RowSpec => {
    const lr = gridConfig.layout?.rows?.[rowKey];
    const pick = (bp: 'desktop'|'tablet'|'mobile'): { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number } => {
      if (lr && lr[bp]) {
        const s = lr[bp]!;
        return { columns: Math.max(1, s.columns || 1), gapX: s.gapX, gapY: s.gapY, autoRowHeight: (s as any).autoRowHeight };
      }
      // fallback from current canvas getters
      const cols = getColumnsValue(rowKey);
      const gaps = getRowGaps(rowKey);
      return { columns: cols, gapX: gaps.gapX, gapY: gaps.gapY, autoRowHeight: gaps.autoRowHeight };
    };
    return { desktop: pick('desktop'), tablet: pick('tablet'), mobile: pick('mobile') };
  }, [gridConfig]);

  const openRowEditor = useCallback((rowKey: string) => {
    setEditingRowId(rowKey);
    setRowDraft(getRowSpecAll(rowKey));
  }, [getRowSpecAll]);

  const saveRowEditor = useCallback((spec: RowSpec) => {
    if (!editingRowId) return;
    visualBuilderActions.updateRowSpec(editingRowId, spec);
    setEditingRowId(null);
    setRowDraft(null);
  }, [editingRowId]);

  // Handle save widget changes
  const handleSaveWidget = useCallback((updatedWidget: Widget) => {
    if (!onLayoutChange) return;

    const updatedWidgets = widgets.map(w =>
      w.id === updatedWidget.id ? updatedWidget : w
    );
    onLayoutChange(updatedWidgets);
    try { visualBuilderActions.bumpReloadTick(updatedWidget.id); } catch {}
  }, [onLayoutChange, widgets]);

  // Duplicate a widget (clone near original with new id)
  const handleDuplicateWidget = useCallback((w: Widget) => {
    // Gerar novo id único baseado no estado atual
    const existingIds = new Set(widgets.map(x => x.id));
    const base = `${w.id}_copy`;
    let candidate = base;
    let idx = 1;
    while (existingIds.has(candidate)) candidate = `${base}_${idx++}`;

    const code = visualBuilderState.code || '';
    const isDsl = code.trim().startsWith('<');

    if (isDsl) {
      // Duplicar diretamente no DSL para manter store e código em sincronia
      const escapeId = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const idEsc = escapeId(w.id);
      const idNew = candidate;
      const insertAfter = (source: string, original: string, duplicate: string) => source.replace(original, `${original}\n${duplicate}`);
      // Tentar nó pareado primeiro
      const pairRe = new RegExp(`<(?:(kpi|chart))\\b([^>]*)\\bid=\"${idEsc}\"[\\s\\S]*?>[\\s\\S]*?<\\/\\1>`, 'i');
      let m = code.match(pairRe);
      let newCode = code;
      if (m && m[0]) {
        const block = m[0];
        const dup = block.replace(new RegExp(`\\bid=\\"${idEsc}\\"`, 'i'), `id="${idNew}"`);
        newCode = insertAfter(code, block, dup);
      } else {
        // Tentar self-closing
        const selfRe = new RegExp(`<(?:(kpi|chart))\\b([^>]*)\\bid=\"${idEsc}\"[^>]*?\/?>`, 'i');
        m = code.match(selfRe);
        if (m && m[0]) {
          const block = m[0];
          const dup = block.replace(new RegExp(`\\bid=\\"${idEsc}\\"`, 'i'), `id="${idNew}"`);
          newCode = insertAfter(code, block, dup);
        }
      }
      if (newCode !== code) {
        try { visualBuilderActions.updateCode(newCode); } catch {}
      }
      return;
    }

    // Fallback (JSON): duplicar no array e persistir
    const clone: Widget = JSON.parse(JSON.stringify(w));
    clone.id = candidate;
    if (typeof w.order === 'number') clone.order = w.order + 0.01;
    const updated = [] as Widget[];
    for (const it of widgets) {
      updated.push(it);
      if (it.id === w.id) updated.push(clone);
    }
    if (onLayoutChange) onLayoutChange(updated); else try { visualBuilderActions.updateWidgets(updated); } catch {}
  }, [onLayoutChange, widgets, visualBuilderState.code]);

  // Delete a widget with confirmation
  const handleDeleteWidget = useCallback((w: Widget) => {
    const ok = typeof window !== 'undefined' ? window.confirm(`Excluir o widget "${w.title || w.id}"?`) : true;
    if (!ok) return;
    const updated = widgets.filter(x => x.id !== w.id);
    if (onLayoutChange) onLayoutChange(updated);
    else try { visualBuilderActions.updateWidgets(updated); } catch {}
  }, [onLayoutChange, widgets]);

  // Extract theme colors from gridConfig
  const backgroundColor = gridConfig.backgroundColor || '#ffffff';
  const borderColor = gridConfig.borderColor || '#e5e7eb';

  // Advanced container styles (same as original GridCanvas)
  const pad = gridConfig.padding ?? 16;
  const DEFAULT_BORDER_RADIUS = 8; // px, fallback when not provided by config/theme
  const containerStyles = {
    // Background: priority to gradient, fallback to backgroundColor
    background: gridConfig.backgroundGradient?.enabled
      ? `${gridConfig.backgroundGradient.type}-gradient(${gridConfig.backgroundGradient.direction}, ${gridConfig.backgroundGradient.startColor}, ${gridConfig.backgroundGradient.endColor})`
      : backgroundColor,

    // Advanced CSS effects
    opacity: gridConfig.backgroundOpacity,
    backdropFilter: gridConfig.backdropFilter?.enabled
      ? `blur(${gridConfig.backdropFilter.blur}px)`
      : undefined,

    // Border & Shadow
    borderWidth: gridConfig.borderWidth ? `${gridConfig.borderWidth}px` : '1px',
    borderColor: borderColor,
    borderRadius: `${typeof gridConfig.borderRadius === 'number' ? gridConfig.borderRadius : DEFAULT_BORDER_RADIUS}px`,
    boxShadow: gridConfig.containerShadowColor
      ? `${gridConfig.containerShadowOffsetX || 0}px ${gridConfig.containerShadowOffsetY || 4}px ${gridConfig.containerShadowBlur || 8}px rgba(${hexToRgb(gridConfig.containerShadowColor)}, ${gridConfig.containerShadowOpacity || 0.1})`
      : undefined,

    // Spacing
    paddingTop: 0,
    paddingLeft: `${pad}px`,
    paddingRight: `${pad}px`,
    paddingBottom: `${pad}px`,
    margin: gridConfig.margin ? `${gridConfig.margin}px` : undefined,
    letterSpacing: typeof gridConfig.letterSpacing === 'number' ? `${gridConfig.letterSpacing}em` : undefined,
  };

  // Helper function to convert hex to RGB
  function hexToRgb(hex: string): string {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  }

  // Get layout configuration from JSON or use default
  const getLayoutConfig = (): LayoutRow => {
    // If layoutRows are defined in JSON and widget has a row reference, use it
    if (gridConfig.layoutRows && Object.keys(gridConfig.layoutRows).length > 0) {
      // Use the first layout row as default if none specified
      const firstRowKey = Object.keys(gridConfig.layoutRows)[0];
      return gridConfig.layoutRows[firstRowKey];
    }

    // Default fallback layout
    return {
      desktop: 4,
      tablet: 2,
      mobile: 1
    };
  };

  // Adapt widget for responsive layout
  const adaptWidgetForResponsive = (widget: Widget) => {
    let layoutConfig = getLayoutConfig();

    // If widget has a specific row reference, use that layout
    if (widget.row && gridConfig.layoutRows && gridConfig.layoutRows[widget.row]) {
      layoutConfig = gridConfig.layoutRows[widget.row];
    }

    // Use widget's defined spans or calculate from position
    let desktopSpan, tabletSpan, mobileSpan;

    if (widget.span) {
      // Use explicit span configuration
      desktopSpan = widget.span.desktop || 1;
      tabletSpan = widget.span.tablet || 1;
      mobileSpan = widget.span.mobile || 1;
    } else {
      // Fallback: calculate span based on widget width (original logic)
      const w = widget.position?.w ?? 1;
      desktopSpan = w >= 6 ? Math.min(2, layoutConfig.desktop) : 1;
      tabletSpan = w >= 4 ? Math.min(2, layoutConfig.tablet) : 1;
      mobileSpan = 1; // Always 1 on mobile
    }

    // Use explicit order or calculate from position
    const order = widget.order !== undefined
      ? widget.order
      : (widget.position ? (widget.position.y * 12 + widget.position.x) : 0);

    return {
      desktopSpan,
      tabletSpan,
      mobileSpan,
      order,
      layoutConfig
    };
  };

  // Group widgets by row and sort within each group
  const groupWidgetsByRow = () => {
    const groups: { [key: string]: Widget[] } = {};

    widgets.forEach(widget => {
      const row = widget.row || '1'; // Default to row 1 if no row specified
      if (!groups[row]) groups[row] = [];
      groups[row].push(widget);
    });

    // Sort widgets within each group by order
    Object.keys(groups).forEach(row => {
      groups[row].sort((a, b) => {
        const orderA = adaptWidgetForResponsive(a).order;
        const orderB = adaptWidgetForResponsive(b).order;
        return orderA - orderB;
      });
    });

    return groups;
  };
  const widgetGroups = useMemo(groupWidgetsByRow, [widgets, gridConfig.layoutRows]);
  const perColumnMode = gridConfig.layout?.mode === 'grid-per-column';
  const perGridMode = gridConfig.layout?.mode === 'grid';
  const groups = (gridConfig.layout as any)?.groups as Array<{
    id: string;
    title?: string;
    orientation?: 'horizontal'|'vertical';
    grid?: {
      desktop?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      tablet?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      mobile?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      template?: { desktop?: string; tablet?: string; mobile?: string };
    };
    children: string[];
  }> | undefined;

  // --- Row DnD helpers (DSL-first) ---
  const isDsl = (code: string) => code.trim().startsWith('<');
  const getRowsFromDsl = (dsl: string): Array<{ id: string; start: number; end: number; block: string }> => {
    const rows: Array<{ id: string; start: number; end: number; block: string }> = [];
    const re = /<row\b([^>]*)>([\s\S]*?)<\/row>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(dsl)) !== null) {
      const attrs = m[1] || '';
      const idMatch = attrs.match(/\bid=\"([^\"]+)\"/i);
      const id = idMatch ? idMatch[1] : String(rows.length + 1);
      rows.push({ id, start: m.index!, end: m.index! + m[0].length, block: m[0] });
    }
    return rows;
  };
  const getRowOrderFromCode = (): string[] => {
    const code = visualBuilderState.code || '';
    if (!isDsl(code)) {
      // fallback numeric order from groups
      return Object.keys(widgetGroups).sort((a, b) => parseInt(a) - parseInt(b));
    }
    const rows = getRowsFromDsl(code);
    return rows.map(r => r.id);
  };
  const rowOrder = useMemo(() => getRowOrderFromCode(), [visualBuilderState.code, widgetGroups]);

  // --- Group DnD helpers (grid mode) ---
  const getGroupsFromDsl = (dsl: string): Array<{ id: string; start: number; end: number; block: string }> => {
    const arr: Array<{ id: string; start: number; end: number; block: string }> = [];
    const re = /<group\b([^>]*)>([\s\S]*?)<\/group>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(dsl)) !== null) {
      const attrs = m[1] || '';
      const idMatch = attrs.match(/\bid=\"([^\"]+)\"/i);
      const id = idMatch ? idMatch[1] : String(arr.length + 1);
      arr.push({ id, start: m.index!, end: m.index! + m[0].length, block: m[0] });
    }
    return arr;
  };
  const getGroupOrderFromCode = (): string[] => {
    const code = visualBuilderState.code || '';
    if (!isDsl(code)) return Array.isArray(groups) ? groups.map(g => g.id) : [];
    const gs = getGroupsFromDsl(code);
    return gs.map(g => g.id);
  };
  const groupOrder = useMemo(() => getGroupOrderFromCode(), [visualBuilderState.code, groups]);

  const reorderGroupsInDsl = (dsl: string, newOrder: string[]): string => {
    const gs = getGroupsFromDsl(dsl);
    if (gs.length === 0) return dsl;
    const header = dsl.slice(0, gs[0].start);
    const footer = dsl.slice(gs[gs.length - 1].end);
    const byId = new Map(gs.map(g => [g.id, g.block] as const));
    const orderedBlocks = newOrder.map(id => byId.get(id)).filter(Boolean) as string[];
    return header + orderedBlocks.join('\n') + footer;
  };

  const handleGroupDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = [...groupOrder];
    const oldIndex = current.indexOf(String(active.id));
    const newIndex = current.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...current];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    const code = visualBuilderState.code || '';
    if (isDsl(code)) {
      const nextCode = reorderGroupsInDsl(code, next);
      visualBuilderActions.updateCode(nextCode);
    }
  }, [groupOrder, visualBuilderState.code]);

  const reorderRowsInDsl = (dsl: string, newOrder: string[]): string => {
    const rows = getRowsFromDsl(dsl);
    if (rows.length === 0) return dsl;
    const header = dsl.slice(0, rows[0].start);
    const footer = dsl.slice(rows[rows.length - 1].end);
    const byId = new Map(rows.map(r => [r.id, r.block] as const));
    const orderedBlocks = newOrder.map(id => byId.get(id)).filter(Boolean) as string[];
    return header + orderedBlocks.join('\n') + footer;
  };

  const handleRowDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = [...rowOrder];
    const oldIndex = current.indexOf(String(active.id));
    const newIndex = current.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...current];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    const code = visualBuilderState.code || '';
    if (isDsl(code)) {
      const nextCode = reorderRowsInDsl(code, next);
      visualBuilderActions.updateCode(nextCode);
    }
  }, [rowOrder, visualBuilderState.code]);

const DraggableRow = memo(function DraggableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-md border-2 border-transparent hover:border-blue-400 hover:border-dashed"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-700 text-white px-2 py-0.5 rounded cursor-grab active:cursor-grabbing text-xs"
      >
        ⇅ Row {id}
      </div>
      {children}
    </div>
  );
});

const DraggableGroup = memo(function DraggableGroup({ id, children, containerStyle }: { id: string; children: React.ReactNode; containerStyle?: React.CSSProperties }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    ...(containerStyle || {}),
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-md border-2 border-transparent hover:border-blue-400 hover:border-dashed"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-700 text-white px-2 py-0.5 rounded cursor-grab active:cursor-grabbing text-xs"
      >
        ⇅ Group {id}
      </div>
      {children}
    </div>
  );
});

  // Helpers for per-column wrappers
  const getTemplateColumnsString = (): string | undefined => {
    const tmpl = gridConfig.layout?.columnsTemplate;
    const str = tmpl ? (viewportMode === 'mobile' ? tmpl.mobile : viewportMode === 'tablet' ? tmpl.tablet : tmpl.desktop) : undefined;
    return str;
  };

  const getColumnIds = (): number[] => {
    const tmpl = getTemplateColumnsString();
    if (tmpl) {
      const count = tmpl.trim().split(/\s+/).length;
      return Array.from({ length: count }, (_, i) => i + 1);
    }
    const inner = gridConfig.layout?.columnsInner ? Object.keys(gridConfig.layout.columnsInner).map(k => Number(k)).filter(n => Number.isFinite(n)) : [];
    if (inner.length > 0) return inner.sort((a, b) => a - b);
    // fallback from widgets
    const starts = widgets.map(w => getStartValue(w) || 1);
    const maxStart = starts.length ? Math.max(...starts) : 1;
    return Array.from({ length: maxStart }, (_, i) => i + 1);
  };

  const getInnerColsForColumn = (colId: number): number => {
    const inner = gridConfig.layout?.columnsInner?.[String(colId)];
    if (inner) {
      const val = viewportMode === 'mobile' ? inner.mobile : viewportMode === 'tablet' ? inner.tablet : inner.desktop;
      if (typeof val === 'number' && val > 0) return val;
    }
    return 1;
  };

  // Handle drag end - reorder widgets within the same row
  const handleDragEnd = useCallback((event: DragEndEvent, rowKey: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onLayoutChange) return;

    // Find widgets in this row
    const rowWidgets = widgetGroups[rowKey];
    const oldIndex = rowWidgets.findIndex(w => w.id === active.id);
    const newIndex = rowWidgets.findIndex(w => w.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder widgets in the row
    const reorderedRowWidgets = [...rowWidgets];
    const [movedWidget] = reorderedRowWidgets.splice(oldIndex, 1);
    reorderedRowWidgets.splice(newIndex, 0, movedWidget);

    // Update order values based on new positions
    const updatedRowWidgets = reorderedRowWidgets.map((widget, index) => ({
      ...widget,
      order: index + 1
    }));

    // Merge with widgets from other rows
    const otherWidgets = widgets.filter(w => (w.row || '1') !== rowKey);
    const updatedWidgets = [...otherWidgets, ...updatedRowWidgets];

    // Call parent callback
    onLayoutChange(updatedWidgets);
  }, [onLayoutChange, widgetGroups, widgets]);

  // Calculate widget height based on heightPx or fallback logic
  const getWidgetHeight = (widget: Widget): string => {
    // Priority 1: Use explicit heightPx if defined
    if (widget.heightPx) {
      return `${widget.heightPx}px`;
    }

    // Priority 2: Default height by widget type
    if (widget.type === 'kpi') {
      return '100px';
    }

    if (['bar', 'line', 'pie', 'area', 'stackedbar', 'groupedbar', 'stackedlines', 'radialstacked', 'pivotbar'].includes(widget.type)) {
      return '500px';
    }

    // Priority 3: Fallback for other widget types
    return '200px';
  };

  // Get span value for widget based on viewportMode
  const getSpanValue = (widget: Widget): number => {
    const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);

    switch (viewportMode) {
      case 'mobile':
        return mobileSpan;
      case 'tablet':
        return tabletSpan;
      case 'desktop':
      default:
        return desktopSpan;
    }
  };

  // Generate CSS classes for widget (only fixed classes)
  const getSpanClasses = (): string => {
    return 'transition-all duration-200';
  };

  // New layout helpers (prefer new layout definition when present)
  const getColumnsValue = (rowKey: string): number => {
    // Prefer new layout per row if provided
    const layoutRows = gridConfig.layout?.rows;
    if (layoutRows && layoutRows[rowKey]) {
      const row = layoutRows[rowKey];
      const spec = viewportMode === 'mobile' ? row.mobile : viewportMode === 'tablet' ? row.tablet : row.desktop;
      if (spec?.columns && spec.columns > 0) return spec.columns;
    }
    // Fallback to legacy layoutRows
    const legacy = gridConfig.layoutRows?.[rowKey] || { desktop: 4, tablet: 2, mobile: 1 };
    switch (viewportMode) {
      case 'mobile':
        return legacy.mobile;
      case 'tablet':
        return legacy.tablet;
      case 'desktop':
      default:
        return legacy.desktop;
    }
  };

  const getRowGaps = (rowKey: string): { gapX: number; gapY: number; autoRowHeight?: number } => {
    const layoutRows = gridConfig.layout?.rows;
    if (layoutRows && layoutRows[rowKey]) {
      const row = layoutRows[rowKey];
      const spec = viewportMode === 'mobile' ? row.mobile : viewportMode === 'tablet' ? row.tablet : row.desktop;
      if (spec) {
        return { gapX: spec.gapX ?? 16, gapY: spec.gapY ?? 0, autoRowHeight: spec.autoRowHeight };
      }
    }
    return { gapX: 16, gapY: 0 };
  };

  // Global helpers for grid-per-column
  const getGlobalColumns = (): number => {
    const cols = gridConfig.layout?.columns;
    if (cols) {
      const spec = viewportMode === 'mobile' ? cols.mobile : viewportMode === 'tablet' ? cols.tablet : cols.desktop;
      if (spec?.columns && spec.columns > 0) return spec.columns;
    }
    return viewportMode === 'desktop' ? 4 : viewportMode === 'tablet' ? 2 : 1;
  };

  const getGlobalGaps = (): { gapX: number; gapY: number; autoRowHeight?: number } => {
    const cols = gridConfig.layout?.columns;
    if (cols) {
      const spec = viewportMode === 'mobile' ? cols.mobile : viewportMode === 'tablet' ? cols.tablet : cols.desktop;
      if (spec) return { gapX: spec.gapX ?? 16, gapY: spec.gapY ?? 0, autoRowHeight: spec.autoRowHeight };
    }
    return { gapX: 16, gapY: 0 };
  };

  const getStartValue = (widget: Widget): number | undefined => {
    const start = widget.gridStart;
    if (!start) return undefined;
    switch (viewportMode) {
      case 'mobile':
        return start.mobile;
      case 'tablet':
        return start.tablet;
      case 'desktop':
      default:
        return start.desktop;
    }
  };

  // Generate grid layout classes for a specific row (only fixed classes)
  const getGridClassesForRow = (): string => {
    // Use inline style gaps; keep minimal classes here
    return 'grid auto-rows-min';
  };

  // Get device-specific styles
  const getDeviceStyles = () => {
    const baseStyles = {
      ...containerStyles,
      border: `${containerStyles.borderWidth} solid ${containerStyles.borderColor}`
    };

    switch (viewportMode) {
      case 'desktop':
        return {
          ...baseStyles,
          width: '100%'
        };
      case 'tablet':
        return {
          ...baseStyles,
          maxWidth: '768px',
          width: '100%',
          margin: '0 auto'
        };
      case 'mobile':
        return {
          ...baseStyles,
          maxWidth: '375px',
          width: '100%',
          margin: '0 auto'
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Grid container */}
      <div
        className="relative overflow-hidden"
        style={getDeviceStyles()}
      >
        {renderHeader && (
          <DashboardInCanvasHeader
            title={headerTitle || 'Dashboard'}
            subtitle={headerSubtitle}
            currentFilter={globalFilters?.dateRange || { type: 'last_30_days' }}
            onFilterChange={(dateRange: DateRangeFilter) => onFilterChange?.({ dateRange })}
            isLoading={!!isFilterLoading}
            containerPadding={gridConfig.padding ?? 16}
            themeName={themeName}
            onEditHeader={() => setShowHeaderEditor(true)}
            onRemoveHeader={() => { try { visualBuilderActions.removeHeaderFromCode(); } catch {} }}
            headerConfig={headerConfig}
          />
        )}
        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-medium mb-2">No widgets configured</h3>
              <p className="text-sm">Add widgets in the JSON editor to see them here</p>
              <p className="text-xs text-gray-400 mt-2">
                This dashboard adapts: 4 columns (desktop) → 2 columns (tablet) → 1 column (mobile)
              </p>
            </div>
          </div>
        )}

        {/* Responsive Grid Layout - Grouped by Rows */}
        {widgets.length > 0 && !perColumnMode && !perGridMode && (
          <div className="px-0 py-4 space-y-2">
            {/* Row editor modal */}
            <RowEditorModal
              rowId={editingRowId || ''}
              open={Boolean(editingRowId && rowDraft)}
              initial={rowDraft || { desktop: { columns: 4 }, tablet: { columns: 2 }, mobile: { columns: 1 } }}
              onClose={() => { setEditingRowId(null); setRowDraft(null); }}
              onSave={saveRowEditor}
            />
            <DndContext collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
              <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
              {rowOrder.map((rowKey) => {
                const rowWidgets = widgetGroups[rowKey];
                const widgetIds = rowWidgets.map(w => w.id);

                return (
                  <DraggableRow id={rowKey} key={`row-${rowKey}`}>
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, rowKey)}
                  >
                    <SortableContext items={widgetIds} strategy={horizontalListSortingStrategy}>
                      {/* Row overlay controls (no layout shift) */}
                      <div className="absolute top-0 left-0 z-20 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-events-none">
                        <button
                          type="button"
                          onClick={() => openRowEditor(rowKey)}
                          className="pointer-events-auto inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-blue-400 text-white shadow-sm"
                          title={`Editar Row ${rowKey}`}
                        >
                          Row {rowKey}
                        </button>
                      </div>
                      <div
                        className={getGridClassesForRow()}
                        style={{
                          gridTemplateColumns: `repeat(${getColumnsValue(rowKey)}, 1fr)`,
                          width: '100%',
                          columnGap: `${getRowGaps(rowKey).gapX}px`,
                          rowGap: `${getRowGaps(rowKey).gapY}px`,
                          gridAutoRows: getRowGaps(rowKey).autoRowHeight ? `${getRowGaps(rowKey).autoRowHeight}px` : undefined,
                        }}
                      >
                        {rowWidgets.map((widget) => (
                          <DraggableWidget
                            key={widget.id}
                            widget={widget}
                            spanClasses={getSpanClasses()}
                            spanValue={getSpanValue(widget)}
                            minHeight={getWidgetHeight(widget)}
                            globalFilters={globalFilters}
                            onEdit={handleEditWidget}
                            onDuplicate={handleDuplicateWidget}
                            onDelete={handleDeleteWidget}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  </DraggableRow>
                );
              })}
              </SortableContext>
            </DndContext>
          </div>
        )}
        {/* Grid mode with groups (sortable) */}
        {widgets.length > 0 && perGridMode && Array.isArray(groups) && groups.length > 0 && (
          <div className="px-0 py-4">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
              <SortableContext items={groupOrder} strategy={verticalListSortingStrategy}>
                {groupOrder.map((groupId) => {
                const group = groups.find(g => g.id === groupId)!;
                  const getGroupTemplate = (): string | undefined => group.grid?.template ? (viewportMode === 'mobile' ? group.grid.template.mobile : viewportMode === 'tablet' ? group.grid.template.tablet : group.grid.template.desktop) : undefined;
                  const getGroupColumns = (): number => {
                    const spec = viewportMode === 'mobile' ? group.grid?.mobile : viewportMode === 'tablet' ? group.grid?.tablet : group.grid?.desktop;
                    return spec?.columns && spec.columns > 0 ? spec.columns : getGlobalColumns();
                  };
                  const getGroupGaps = (): { gapX: number; gapY: number; autoRowHeight?: number } => {
                    const spec = viewportMode === 'mobile' ? group.grid?.mobile : viewportMode === 'tablet' ? group.grid?.tablet : group.grid?.desktop;
                    return { gapX: spec?.gapX ?? getGlobalGaps().gapX, gapY: spec?.gapY ?? getGlobalGaps().gapY, autoRowHeight: spec?.autoRowHeight ?? getGlobalGaps().autoRowHeight };
                  };
                  const groupWidgets = (group.children || [])
                    .map(id => widgets.find(w => w.id === id))
                    .filter(Boolean) as Widget[];
                  const isFrGroup = (group as any).sizing === 'fr';
                  const getGroupFrTemplate = (): string => {
                    const cols: string[] = [];
                    for (const w of groupWidgets) {
                      const fr = viewportMode === 'mobile'
                        ? w.widthFr?.mobile || w.widthFr?.tablet || w.widthFr?.desktop || '1fr'
                        : viewportMode === 'tablet'
                        ? w.widthFr?.tablet || w.widthFr?.desktop || '1fr'
                        : w.widthFr?.desktop || '1fr';
                      cols.push(fr);
                    }
                    return cols.length > 0 ? cols.join(' ') : '1fr';
                  };
                  return (
                    <DraggableGroup id={group.id} key={`group-${group.id}`}
                      containerStyle={(() => {
                        const st = (group as any).style as (Record<string, any> | undefined);
                        if (!st) return undefined;
                        const background = st.backgroundGradient && st.backgroundGradient.enabled
                          ? `${st.backgroundGradient.type || 'linear'}-gradient(${st.backgroundGradient.direction || 'to bottom'}, ${st.backgroundGradient.startColor || '#ffffff'}, ${st.backgroundGradient.endColor || '#f8fafc'})`
                          : st.backgroundColor;
                        const boxShadow = st.containerShadowColor
                          ? `${st.containerShadowOffsetX || 0}px ${st.containerShadowOffsetY || 4}px ${st.containerShadowBlur || 8}px rgba(${typeof st.containerShadowColor === 'string' ? st.containerShadowColor : '0,0,0'}, ${st.containerShadowOpacity ?? 0.1})`
                          : undefined;
                        const padding = typeof st.padding === 'number' ? st.padding : undefined;
                        const margin = typeof st.margin === 'number' ? st.margin : undefined;
                        const borderWidth = typeof st.borderWidth === 'number' ? st.borderWidth : undefined;
                        const borderColor = typeof st.borderColor === 'string' ? st.borderColor : undefined;
                        const borderRadius = typeof st.borderRadius === 'number' ? st.borderRadius : undefined;
                        return {
                          background,
                          boxShadow,
                          padding: typeof padding === 'number' ? `${padding}px` : undefined,
                          margin: typeof margin === 'number' ? `${margin}px` : undefined,
                          borderWidth: typeof borderWidth === 'number' ? `${borderWidth}px` : undefined,
                          borderColor,
                          borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : undefined,
                        } as React.CSSProperties;
                      })()}
                    >
                      {/* Group overlay controls (no layout shift) */}
                      <div className="absolute top-0 left-0 z-20 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-events-none">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGroupId(group.id);
                            const dsl = visualBuilderState.code || '';
                            const parsed = parseGroupSpecFromDsl(dsl, group.id);
                            setGroupDraft(parsed);
                          }}
                          className="pointer-events-auto inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-blue-400 text-white shadow-sm"
                          title={`Editar Group ${group.id}`}
                        >
                          Group {group.id}
                        </button>
                      </div>
                      {group.title && (
                        <div
                          className="px-2"
                          style={{
                            fontFamily: (group as any).style?.titleFontFamily || undefined,
                            fontSize: typeof (group as any).style?.titleFontSize === 'number' ? `${(group as any).style?.titleFontSize}px` : undefined,
                            fontWeight: (group as any).style?.titleFontWeight || undefined,
                            color: (group as any).style?.titleColor || '#4b5563',
                            marginTop: typeof (group as any).style?.titleMarginTop === 'number' ? `${(group as any).style?.titleMarginTop}px` : undefined,
                            marginRight: typeof (group as any).style?.titleMarginRight === 'number' ? `${(group as any).style?.titleMarginRight}px` : undefined,
                            marginBottom: typeof (group as any).style?.titleMarginBottom === 'number' ? `${(group as any).style?.titleMarginBottom}px` : undefined,
                            marginLeft: typeof (group as any).style?.titleMarginLeft === 'number' ? `${(group as any).style?.titleMarginLeft}px` : undefined,
                          }}
                        >
                          {group.title}
                        </div>
                      )}
                      {(group as any).style?.subtitle && (
                        <div
                          className="px-2"
                          style={{
                            color: (group as any).style?.subtitleColor || '#6b7280',
                            fontFamily: (group as any).style?.subtitleFontFamily || undefined,
                            fontSize: typeof (group as any).style?.subtitleFontSize === 'number' ? `${(group as any).style?.subtitleFontSize}px` : undefined,
                            fontWeight: (group as any).style?.subtitleFontWeight || undefined,
                            marginTop: typeof (group as any).style?.subtitleMarginTop === 'number' ? `${(group as any).style?.subtitleMarginTop}px` : undefined,
                            marginRight: typeof (group as any).style?.subtitleMarginRight === 'number' ? `${(group as any).style?.subtitleMarginRight}px` : undefined,
                            marginBottom: typeof (group as any).style?.subtitleMarginBottom === 'number' ? `${(group as any).style?.subtitleMarginBottom}px` : undefined,
                            marginLeft: typeof (group as any).style?.subtitleMarginLeft === 'number' ? `${(group as any).style?.subtitleMarginLeft}px` : undefined,
                          }}
                        >
                          {(group as any).style?.subtitle}
                        </div>
                      )}
                      <div
                        className={getGridClassesForRow()}
                        style={{
                          gridTemplateColumns: (group.orientation === 'vertical' ? `repeat(1, 1fr)` : (isFrGroup ? getGroupFrTemplate() : (getGroupTemplate() || `repeat(${getGroupColumns()}, 1fr)`))),
                          width: '100%',
                          columnGap: `${getGroupGaps().gapX}px`,
                          rowGap: `${getGroupGaps().gapY}px`,
                          gridAutoRows: getGroupGaps().autoRowHeight ? `${getGroupGaps().autoRowHeight}px` : undefined,
                        }}
                      >
                        {groupWidgets.map((widget) => {
                          const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);
                          const spanValue = isFrGroup ? 1 : (viewportMode === 'mobile' ? mobileSpan : viewportMode === 'tablet' ? tabletSpan : desktopSpan);
                          const minHeight = getWidgetHeight(widget);
                          const spanClasses = getSpanClasses();
                          const startValue = isFrGroup ? undefined : getStartValue(widget);
                          return (
                            <DraggableWidget
                              key={widget.id}
                              widget={widget}
                              spanClasses={spanClasses}
                              spanValue={spanValue}
                              startValue={startValue}
                              minHeight={minHeight}
                              globalFilters={globalFilters}
                              onEdit={handleEditWidget}
                              onDuplicate={handleDuplicateWidget}
                              onDelete={handleDeleteWidget}
                            />
                          );
                        })}
                      </div>
                    </DraggableGroup>
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        )}
        {/* Global Grid Layout (grid mode without groups) */}
        {widgets.length > 0 && perGridMode && (!Array.isArray(groups) || groups.length === 0) && (
          <div className="px-0 py-4">
            <div
              className={getGridClassesForRow()}
              style={{
                gridTemplateColumns: getTemplateColumnsString() || `repeat(${getGlobalColumns()}, 1fr)`,
                width: '100%',
                columnGap: `${getGlobalGaps().gapX}px`,
                rowGap: `${getGlobalGaps().gapY}px`,
                gridAutoRows: getGlobalGaps().autoRowHeight ? `${getGlobalGaps().autoRowHeight}px` : undefined,
              }}
            >
              {widgets.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((widget) => {
                const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);
                const spanValue = viewportMode === 'mobile' ? mobileSpan : viewportMode === 'tablet' ? tabletSpan : desktopSpan;
                const minHeight = getWidgetHeight(widget);
                const spanClasses = getSpanClasses();
                const startValue = getStartValue(widget);
                return (
                  <DraggableWidget
                    key={widget.id}
                    widget={widget}
                    spanClasses={spanClasses}
                    spanValue={spanValue}
                    startValue={startValue}
                    minHeight={minHeight}
                    globalFilters={globalFilters}
                    onEdit={handleEditWidget}
                    onDuplicate={handleDuplicateWidget}
                    onDelete={handleDeleteWidget}
                  />
                );
              })}
            </div>
          </div>
        )}
        {widgets.length > 0 && perColumnMode && (
          <div className="px-0 py-4">
            <div
              className={getGridClassesForRow()}
              style={{
                gridTemplateColumns: getTemplateColumnsString() || `repeat(${getGlobalColumns()}, 1fr)`,
                width: '100%',
                columnGap: `${getGlobalGaps().gapX}px`,
                rowGap: `${getGlobalGaps().gapY}px`,
                gridAutoRows: getGlobalGaps().autoRowHeight ? `${getGlobalGaps().autoRowHeight}px` : undefined,
              }}
            >
              {getColumnIds().map((colId) => {
                // Widgets for this column
                const colWidgets = widgets
                  .filter((w) => (getStartValue(w) || 1) === colId)
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                const innerCols = getInnerColsForColumn(colId);
                return (
                  <div key={`col-${colId}`} style={{ gridColumn: `${colId} / span 1` }}>
                    <div
                      className={getGridClassesForRow()}
                      style={{
                        gridTemplateColumns: `repeat(${innerCols}, 1fr)`,
                        width: '100%',
                        columnGap: `${getGlobalGaps().gapX}px`,
                        rowGap: `${getGlobalGaps().gapY}px`,
                      }}
                    >
                      {colWidgets.map((widget) => {
                        const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);
                        const spanValue = viewportMode === 'mobile' ? mobileSpan : viewportMode === 'tablet' ? tabletSpan : desktopSpan;
                        const minHeight = getWidgetHeight(widget);
                        const spanClasses = getSpanClasses();
                        return (
                          <DraggableWidget
                            key={widget.id}
                            widget={widget}
                            spanClasses={spanClasses}
                            spanValue={spanValue}
                            minHeight={minHeight}
                            globalFilters={globalFilters}
                            onEdit={handleEditWidget}
                            onDuplicate={handleDuplicateWidget}
                            onDelete={handleDeleteWidget}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Widget Editor Modal (fallback, only when parent didn't provide onEdit) */}
      {!onEdit && (
        <WidgetEditorModal
          widget={editingWidget}
          isOpen={!!editingWidget}
          onClose={() => setEditingWidget(null)}
          onSave={handleSaveWidget}
        />
      )}
      {/* Group editor modal */}
      <GroupEditorModal
        open={Boolean(editingGroupId && groupDraft)}
        groupId={editingGroupId || ''}
        initial={groupDraft || {}}
        onClose={() => { setEditingGroupId(null); setGroupDraft(null); }}
        onSave={(spec) => {
          if (!editingGroupId) return;
          try { visualBuilderActions.updateGroupSpec(editingGroupId, spec); } catch {}
          setEditingGroupId(null); setGroupDraft(null);
        }}
      />
      <HeaderEditorModal
        isOpen={showHeaderEditor}
        initialTitle={headerTitle}
        initialSubtitle={headerSubtitle}
        onClose={() => setShowHeaderEditor(false)}
        initialConfig={headerConfig}
        onSave={({ title, subtitle, config }) => {
          try { visualBuilderActions.updateHeaderInCode({ title, subtitle, ...(config || {}) }); } catch {}
          setShowHeaderEditor(false);
        }}
      />
    </div>
  );
}

// Shallow props comparator to avoid re-rendering the canvas when opening the modal
const propsAreEqual = (prev: ResponsiveGridCanvasProps, next: ResponsiveGridCanvasProps) => {
  return (
    prev.widgets === next.widgets &&
    prev.gridConfig === next.gridConfig &&
    prev.globalFilters === next.globalFilters &&
    prev.viewportMode === next.viewportMode &&
    prev.headerTitle === next.headerTitle &&
    prev.headerSubtitle === next.headerSubtitle &&
    prev.headerConfig === next.headerConfig &&
    prev.isFilterLoading === next.isFilterLoading &&
    prev.themeName === next.themeName &&
    prev.onEdit === next.onEdit &&
    prev.onFilterChange === next.onFilterChange &&
    prev.onLayoutChange === next.onLayoutChange &&
    prev.renderHeader === next.renderHeader
  );
};

export default memo(ResponsiveGridCanvas, propsAreEqual);
