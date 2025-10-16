'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import FilterHeader from '@/components/visual-builder/FilterHeader';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget, GlobalFilters } from '@/stores/visualBuilderStore';

export default function VisualBuilderPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard' | 'responsive'>('editor');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    // Temporarily clear storage to force new widgets to appear
    // TODO: Remove this after testing
    visualBuilderActions.clearStorage();

    visualBuilderActions.initialize(); // Initialize visual builder store
  }, []);

  const handleCodeChange = (newCode: string) => {
    visualBuilderActions.updateCode(newCode);
  };

  const handleLayoutChange = (updatedWidgets: Widget[]) => {
    visualBuilderActions.updateWidgets(updatedWidgets);
  };

  const handleFilterChange = (filters: GlobalFilters) => {
    setIsFilterLoading(true);
    visualBuilderActions.updateGlobalFilters(filters);
    
    // Simulate loading time for better UX
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 1000);
  };

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
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
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
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configuration Editor</h2>
              <p className="text-sm text-gray-600">Define your widgets with JSON coordinates</p>
            </div>
            <div className="h-[calc(100%-73px)]">
              <MonacoEditor
                value={visualBuilderState.code}
                onChange={handleCodeChange}
                language="json"
                errors={visualBuilderState.parseErrors}
              />
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="h-full bg-gray-50">
            <div className="border-b border-gray-200 bg-white">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900">Live Dashboard</h2>
                <p className="text-sm text-gray-600">Real-time visualization with Supabase data</p>
              </div>
              
              {/* Filtros Globais */}
              <FilterHeader
                currentFilter={visualBuilderState.globalFilters.dateRange}
                onFilterChange={(dateRange) => handleFilterChange({ dateRange })}
                isLoading={isFilterLoading}
              />
            </div>
            <div className="h-[calc(100%-146px)] p-6 overflow-auto">
              <GridCanvas
                widgets={visualBuilderState.widgets}
                gridConfig={visualBuilderState.gridConfig}
                globalFilters={visualBuilderState.globalFilters}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          </div>
        )}

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
            <div className="h-[calc(100%-73px)] p-6 overflow-auto">
              <ResponsiveGridCanvas
                widgets={visualBuilderState.widgets}
                gridConfig={visualBuilderState.gridConfig}
                globalFilters={visualBuilderState.globalFilters}
                viewportMode={viewportMode}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}