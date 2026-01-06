'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import { LiquidParser } from '@/components/visual-builder/LiquidParser';
import { createRoot, type Root } from 'react-dom/client';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';

export default function PreviewPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
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
    const c = htmlRef.current;
    if (!c) return;

    // limpar montagens anteriores
    for (const r of reactRootsRef.current) {
      try { r.unmount(); } catch {}
    }
    reactRootsRef.current = [];
    const parsed = LiquidParser.parse(code);
    c.innerHTML = '';
    c.innerHTML = parsed.html;
    for (const spec of parsed.charts) {
      const mount = c.querySelector(`[data-liquid-chart="${spec.id}"]`) as HTMLElement | null;
      if (!mount) continue;
      if (!mount.style.height || mount.style.height === '') mount.style.height = (spec.height && Number.isFinite(spec.height) ? `${spec.height}px` : '320px');
      mount.style.width = mount.style.width || '100%';
      const root = createRoot(mount);
      reactRootsRef.current.push(root);
      const common = { data: spec.data, title: spec.title } as any;
      switch (spec.type) {
        case 'line': root.render(<LineChart {...common} />); break;
        case 'pie': root.render(<PieChart {...common} />); break;
        case 'area': root.render(<AreaChart {...common} enableArea={true} />); break;
        default: root.render(<BarChart {...common} />); break;
      }
    }

    return () => {
      for (const r of reactRootsRef.current) {
        try { r.unmount(); } catch {}
      }
      reactRootsRef.current = [];
      if (htmlRef.current) htmlRef.current.innerHTML = '';
    };
  }, [htmlMode, htmlInner, visualBuilderState.globalFilters]);

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

      {/* Dashboard em tela cheia */}
      <div className="w-full h-[calc(100vh-69px)]">
        {htmlMode ? (
          <div ref={htmlRef} className="w-full overflow-auto p-4" />
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
