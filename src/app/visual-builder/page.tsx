'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import DashboardSaveDialog from '@/components/visual-builder/DashboardSaveDialog';
import DashboardOpenDialog from '@/components/visual-builder/DashboardOpenDialog';
import { dashboardsApi, type Dashboard } from '@/stores/dashboardsStore';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { Editor as MonacoRawEditor } from '@monaco-editor/react';
// import VisualBuilderChat from '@/components/visual-builder/VisualBuilderChat';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import DashboardInCanvasHeader from '@/components/visual-builder/DashboardInCanvasHeader';
import WidgetEditorModal from '@/components/visual-builder/WidgetEditorModal';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import { initialDsl, initialDslColumns } from '@/stores/visualBuilderStore';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import type { Widget, GlobalFilters } from '@/stores/visualBuilderStore';

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
  const [patchText, setPatchText] = useState<string>('');
  const [patchStatus, setPatchStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const patchEditorRef = useRef<any>(null);
  const patchMonacoRef = useRef<any>(null);
  const patchDecorationsRef = useRef<string[]>([]);

  // Prefill the Patch Editor with a concrete example based on the current DSL (<dashboard ...>)
  useEffect(() => {
    try {
      if (patchText && patchText.trim().length > 0) return;
      const code = visualBuilderState.code || '';
      const m = code.match(/<dashboard\b[^>]*>/i);
      if (!m) return;
      const openTag = m[0].trim();
      // Replace or insert title="DSL"
      let newTag = openTag;
      if (/\btitle=\"[^\"]*\"/i.test(openTag)) {
        newTag = openTag.replace(/\btitle=\"[^\"]*\"/i, 'title="DSL"');
      } else {
        newTag = openTag.replace(/<dashboard\b/i, '<dashboard title="DSL"');
      }
      const sample = `-${openTag}\n+${newTag}`;
      setPatchText(sample);
    } catch {
      // ignore
    }
  }, [visualBuilderState.code, patchText]);

  // Update Monaco decorations to color lines by +/- prefix
  useEffect(() => {
    const editor = patchEditorRef.current;
    const monaco = patchMonacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel?.();
    if (!model) return;
    const lines = (patchText || '').split(/\r?\n/);
    const decos: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? '';
      const trimmed = raw.trimStart();
      if (/^\-/.test(trimmed) && !/^\-\-\-/.test(trimmed)) {
        decos.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1_000_000),
          options: { inlineClassName: 'vb-line-remove' },
        });
      } else if (/^\+/.test(trimmed) && !/^\+\+\+/.test(trimmed)) {
        decos.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1_000_000),
          options: { inlineClassName: 'vb-line-add' },
        });
      }
    }
    patchDecorationsRef.current = editor.deltaDecorations(patchDecorationsRef.current, decos);
  }, [patchText]);
  const currentThemeName: ThemeName = useMemo<ThemeName>(() => {
    try {
      const cfg = JSON.parse(visualBuilderState.code);
      if (cfg && typeof cfg.theme === 'string' && ThemeManager.isValidTheme(cfg.theme)) return cfg.theme;
    } catch {}
    return 'branco';
  }, [visualBuilderState.code]);

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

  return (
    <div className="min-h-screen bg-gray-50">
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
              onClick={() => visualBuilderActions.updateCode(initialDsl)}
            >
              Exemplo por Linhas
            </button>
            <button
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => visualBuilderActions.updateCode(initialDslColumns)}
            >
              Exemplo por Colunas
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
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configuration Editor</h2>
              <p className="text-sm text-gray-600">Define your widgets with JSON coordinates</p>
            </div>
            {/* Split 50/50: left editor, right chat */}
            <div className="h-[calc(100%-73px)] flex">
              <div className="w-1/2 min-w-[480px] h-full">
                <MonacoEditor
                  value={editorCode}
                  onChange={handleCodeChange}
                  language="json"
                  errors={visualBuilderState.parseErrors}
                />
              </div>
              <div className="w-1/2 min-w-[420px] h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Patch Editor</h2>
                  <p className="text-sm text-gray-600">Cole apenas linhas com - e + para aplicar ao editor da esquerda</p>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <MonacoRawEditor
                    height="100%"
                    language="diff"
                    value={patchText}
                    onChange={(v) => setPatchText(v || '')}
                    onMount={(editor, monaco) => {
                      patchEditorRef.current = editor;
                      patchMonacoRef.current = monaco;
                    }}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                  {(!patchText || patchText.trim().length === 0) && (
                    <pre className="pointer-events-none absolute inset-0 p-4 text-xs text-gray-400 whitespace-pre-wrap">
{`-<dashboard theme="branco" title="Dashboard de Vendas" subtitle="Análise de desempenho comercial" layout-mode="grid-per-row" date-type="last_30_days">
+<dashboard theme="branco" title="DSL" subtitle="Análise de desempenho comercial" layout-mode="grid-per-row" date-type="last_30_days">`}
                    </pre>
                  )}
                </div>
                <div className="border-t p-3 flex items-center gap-2 bg-white">
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      const apply = (code: string, patch: string): { ok: boolean; result?: string; error?: string } => {
                        const lines = (patch || '').split(/\r?\n/);
                        const minus: string[] = [];
                        const plus: string[] = [];
                        for (const l of lines) {
                          if (/^\s*\-/.test(l) && !/^\s*\-\-\-/.test(l)) minus.push(l.replace(/^\s*\-/, ''));
                          else if (/^\s*\+/.test(l) && !/^\s*\+\+\+/.test(l)) plus.push(l.replace(/^\s*\+/, ''));
                        }
                        const original = minus.join('\n');
                        const replacement = plus.join('\n');
                        if (!original) return { ok: false, error: 'Patch inválido: inclua pelo menos uma linha que comece com "-" (conteúdo original).' };
                        const norm = (s: string) => s.replace(/\r\n/g, '\n');
                        let src = norm(code);
                        const orig = norm(original);
                        const idx = src.indexOf(orig);
                        if (idx < 0) return { ok: false, error: 'Bloco original não encontrado no editor da esquerda' };
                        const res = src.slice(0, idx) + replacement + src.slice(idx + orig.length);
                        return { ok: true, result: res };
                      };
                      const out = apply(editorCode, patchText);
                      if (out.ok && out.result) {
                        setEditorCode(out.result);
                        visualBuilderActions.updateCode(out.result);
                        setPatchStatus({ type: 'success', text: 'Patch aplicado ao editor da esquerda.' });
                      } else {
                        setPatchStatus({ type: 'error', text: out.error || 'Falha ao aplicar patch.' });
                      }
                    }}
                  >
                    Aplicar patch
                  </button>
                  {patchStatus?.type === 'success' && (
                    <span className="text-xs text-green-700">{patchStatus.text}</span>
                  )}
                  {patchStatus?.type === 'error' && (
                    <span className="text-xs text-red-700">{patchStatus.text}</span>
                  )}
                </div>
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
            <div
              className="h-[calc(100%-73px)] p-6 overflow-auto"
              ref={scrollRef}
              style={{ overflowAnchor: 'none' }}
            >
              <ResponsiveGridCanvas
                widgets={visualBuilderState.widgets}
                gridConfig={visualBuilderState.gridConfig}
                globalFilters={visualBuilderState.globalFilters}
                viewportMode={viewportMode}
                onLayoutChange={handleLayoutChange}
                headerTitle={visualBuilderState.dashboardTitle || 'Responsive Dashboard'}
                headerSubtitle={visualBuilderState.dashboardSubtitle || 'Preview different device layouts'}
                onFilterChange={handleFilterChange}
                isFilterLoading={isFilterLoading}
                themeName={currentThemeName}
                onEdit={handleOpenEdit}
              />
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

      {/* Global styles for coloring +/- lines in the Patch Editor */}
      <style jsx global>{`
        .vb-line-remove {
          color: #b91c1c !important; /* red-700 */
        }
        .vb-line-add {
          color: #15803d !important; /* green-700 */
        }
      `}</style>
    </div>
  );
}
