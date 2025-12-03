'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';

export default function PreviewPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const currentThemeName: ThemeName = (() => {
    try {
      const cfg = JSON.parse(visualBuilderState.code);
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
      </div>
    </div>
  );
}
