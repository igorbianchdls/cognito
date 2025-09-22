'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Type, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';

export default function VisualBuilderPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');

  // State para controlar a fonte selecionada
  const [selectedFont, setSelectedFont] = useState<string>('inter');

  // Initialize store on mount
  useEffect(() => {
    visualBuilderActions.initialize();
  }, []);

  // Extrair tema atual do visual builder para inicializar fonte
  useEffect(() => {
    try {
      const parsedCode = JSON.parse(visualBuilderState.code);
      const theme = parsedCode.theme;
      if (theme) {
        // Mapear temas para suas fontes (baseado nos presets do ThemeManager)
        const themeToFont: { [key: string]: string } = {
          'dark': 'inter',
          'light': 'opensans',
          'modern': 'roboto',
          'elegant': 'georgia',
          'vibrant': 'lato',
          'minimal': 'montserrat',
          'ocean': 'arial',
          'sunset': 'segoe',
          'forest': 'playfair',
          'royal': 'merriweather'
        };
        setSelectedFont(themeToFont[theme] || 'inter');
      }
    } catch (error) {
      console.warn('Erro ao extrair tema do código:', error);
    }
  }, [visualBuilderState.code]);

  // Disponível fonts
  const availableFonts = [
    { value: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
    { value: 'opensans', label: 'Open Sans', family: 'Open Sans, sans-serif' },
    { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
    { value: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
    { value: 'lato', label: 'Lato', family: 'Lato, sans-serif' },
    { value: 'montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
    { value: 'arial', label: 'Arial', family: 'Arial, sans-serif' },
    { value: 'segoe', label: 'Segoe UI', family: 'Segoe UI, sans-serif' },
    { value: 'playfair', label: 'Playfair Display', family: 'Playfair Display, serif' },
    { value: 'merriweather', label: 'Merriweather', family: 'Merriweather, serif' }
  ];

  // Handler para mudança de fonte
  const handleFontChange = (fontKey: string) => {
    setSelectedFont(fontKey);

    try {
      // Parse do código atual
      const currentConfig = JSON.parse(visualBuilderState.code);

      // Update font in theme by creating a custom theme override
      const updatedConfig = {
        ...currentConfig,
        customFont: fontKey  // Add custom font override
      };

      // Update the configuration
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));

      console.log('🎨 Font changed to:', fontKey);
    } catch (error) {
      console.error('Erro ao alterar fonte:', error);
    }
  };

  const handleCodeChange = (newCode: string) => {
    visualBuilderActions.updateCode(newCode);
  };

  const handleLayoutChange = (updatedWidgets: Widget[]) => {
    visualBuilderActions.updateWidgets(updatedWidgets);
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

            {/* Font Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Type className="w-4 h-4" />
                  {availableFonts.find(f => f.value === selectedFont)?.label || 'Font'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {availableFonts.map((font) => (
                  <DropdownMenuItem
                    key={font.value}
                    onClick={() => handleFontChange(font.value)}
                    className={selectedFont === font.value ? 'bg-gray-100' : ''}
                  >
                    <span style={{ fontFamily: font.family }} className="text-sm">
                      {font.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Live Dashboard</h2>
              <p className="text-sm text-gray-600">Real-time visualization with BigQuery data</p>
            </div>
            <div className="h-[calc(100%-73px)] p-6 overflow-auto">
              <GridCanvas
                widgets={visualBuilderState.widgets}
                gridConfig={visualBuilderState.gridConfig}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}