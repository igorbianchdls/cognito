'use client';

import { useState, useEffect } from 'react';
import { useStore as useNanoStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import ResponsiveGridCanvas from '@/components/visual-builder/ResponsiveGridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
import { BackgroundManager, type BackgroundPresetKey } from '@/components/visual-builder/BackgroundManager';
import { ColorManager, type ColorPresetKey } from '@/components/visual-builder/ColorManager';
import { FontManager, type FontPresetKey, type FontSizeKey } from '@/components/visual-builder/FontManager';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Palette, Check, Type, Square, Paintbrush, Monitor, Tablet, Smartphone, ChevronDown, Layout } from 'lucide-react';
import { BorderManager, type BorderPresetKey } from '@/components/visual-builder/BorderManager';
import { $headerUi, headerUiActions } from '@/stores/ui/headerUiStore';

export default function DashboardChatPanel() {
  const headerUi = useNanoStore($headerUi);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [selectedViewport, setSelectedViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedDashboard, setSelectedDashboard] = useState('Dashboard Builder');
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('branco');
  const [selectedFont, setSelectedFont] = useState<FontPresetKey>('barlow');
  const [selectedFontSize, setSelectedFontSize] = useState<FontSizeKey>('lg');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundPresetKey>('fundo-branco');
  const [selectedBorderType, setSelectedBorderType] = useState<BorderPresetKey>('suave');
  const [borderColor, setBorderColor] = useState<string>('#e5e7eb');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [borderAccentColor, setBorderAccentColor] = useState<string>('#bbb');
  const [borderShadow, setBorderShadow] = useState<boolean>(true);
  const [selectedCorporateColor, setSelectedCorporateColor] = useState<ColorPresetKey>('corporate');
  const visualBuilderState = useNanoStore($visualBuilderState);

  // Available backgrounds
  const availableBackgrounds = BackgroundManager.getAvailableBackgrounds();
  const themePreview = ThemeManager.getThemePreview(selectedTheme);

  // Available corporate color palettes
  const availableColorPalettes = ColorManager.getAvailableColorPalettes();

  // Available fonts and sizes from FontManager
  const availableFonts = FontManager.getAvailableFonts();
  const availableFontSizes = FontManager.getAvailableFontSizes();

  // Header tooltip without nested template literals
  const isLightTheme = selectedTheme === 'branco' || selectedTheme === 'cinza-claro';
  const headerVariantLabel = headerUi.variant === 'auto'
    ? 'Auto (' + (isLightTheme ? 'light' : 'dark') + ')'
    : headerUi.variant;
  const headerTooltip = 'Header: ' + headerVariantLabel;

  // Initialize store on mount
  useEffect(() => {
    visualBuilderActions.initialize();
  }, []);

  // Detect current theme from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      if (config.theme && ThemeManager.isValidTheme(config.theme)) {
        setSelectedTheme(config.theme);
      }
    } catch (error) {
      // Invalid JSON, keep current theme
    }
  }, [visualBuilderState.code]);

  

  // Detect current font from code and initialize based on theme
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If custom font is set, use it
      if (config.customFont && FontManager.isValidFont(config.customFont)) {
        setSelectedFont(config.customFont);
      } else if (config.theme) {
        // Otherwise, use theme default font from FontManager
        setSelectedFont(FontManager.getThemeDefaultFont(config.theme));
      }
    } catch (error) {
      // Invalid JSON, keep current font
    }
  }, [visualBuilderState.code]);

  // Detect current font size from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If custom font size is set, use it
      if (config.customFontSize && FontManager.isValidFontSize(config.customFontSize)) {
        setSelectedFontSize(config.customFontSize);
      } else {
        // Otherwise, use default font size
        setSelectedFontSize(FontManager.getDefaultFontSize());
      }
    } catch (error) {
      // Invalid JSON, keep current font size
    }
  }, [visualBuilderState.code]);

  // Detect current background from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If custom background is set, use it
      if (config.customBackground && BackgroundManager.isValidBackground(config.customBackground)) {
        setSelectedBackground(config.customBackground);
      } else {
        // Default background
        setSelectedBackground(BackgroundManager.getDefaultBackground());
      }
    } catch (error) {
      // Invalid JSON, keep current background
    }
  }, [visualBuilderState.code]);

  // Detect current border from code
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      if (config.borderType && BorderManager.isValid(config.borderType)) setSelectedBorderType(config.borderType)
      if (typeof config.borderColor === 'string') setBorderColor(config.borderColor)
      if (typeof config.borderWidth === 'number') setBorderWidth(config.borderWidth)
      if (typeof config.borderRadius === 'number') setBorderRadius(config.borderRadius)
      if (typeof config.borderAccentColor === 'string') setBorderAccentColor(config.borderAccentColor)
      if (typeof config.borderShadow === 'boolean') setBorderShadow(config.borderShadow)
    } catch {}
  }, [visualBuilderState.code])

  // Detect current corporate color from code and initialize based on theme
  useEffect(() => {
    try {
      const config = JSON.parse(visualBuilderState.code);

      // If corporate color is set, use it
      if (config.corporateColor && ColorManager.isValidPreset(config.corporateColor)) {
        setSelectedCorporateColor(config.corporateColor);
      } else if (config.theme && ColorManager.isValidPreset(config.theme)) {
        // Otherwise, use theme name as default color palette
        setSelectedCorporateColor(config.theme);
      }
    } catch (error) {
      // Invalid JSON, keep current color
    }
  }, [visualBuilderState.code]);

  const handleCodeChange = (newCode: string) => {
    visualBuilderActions.updateCode(newCode);
  };

  const handleLayoutChange = (updatedWidgets: Widget[]) => {
    visualBuilderActions.updateWidgets(updatedWidgets);
  };

  const handleThemeChange = (themeName: ThemeName) => {
    try {
      // Parse current config
      const currentConfig = JSON.parse(visualBuilderState.code);

      // Update with new theme
      const updatedConfig = {
        ...currentConfig,
        theme: themeName
      };

      // Apply to editor
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      setSelectedTheme(themeName);

      console.log(`🎨 Theme changed to: ${themeName}`);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const handleFontChange = (fontKey: FontPresetKey) => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      const updatedConfig = {
        ...config,
        customFont: fontKey
      };
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      setSelectedFont(fontKey);
      console.log('🎨 Font changed to:', fontKey);
    } catch (error) {
      console.error('Error updating font:', error);
    }
  };

  const handleFontSizeChange = (sizeKey: FontSizeKey) => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      const updatedConfig = {
        ...config,
        customFontSize: sizeKey
      };
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      setSelectedFontSize(sizeKey);
      console.log('🎨 Font size changed to:', sizeKey, `(${FontManager.getFontSizeValue(sizeKey)}px)`);
    } catch (error) {
      console.error('Error updating font size:', error);
    }
  };

  const handleBackgroundChange = (backgroundKey: BackgroundPresetKey) => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      const updatedConfig = {
        ...config,
        customBackground: backgroundKey
      };
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      setSelectedBackground(backgroundKey);
      console.log('🎨 Background changed to:', backgroundKey);
    } catch (error) {
      console.error('Error updating background:', error);
    }
  };

  const handleBorderTypeChange = (type: BorderPresetKey) => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      const updatedConfig = {
        ...config,
        borderType: type
      };
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      setSelectedBorderType(type);
    } catch (error) {
      console.error('Error updating border type:', error);
    }
  };

  const handleBorderPropChange = (prop: 'borderColor'|'borderWidth'|'borderRadius'|'borderAccentColor'|'borderShadow', value: string | number | boolean) => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      const updatedConfig = {
        ...config,
        [prop]: value
      };
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      if (prop === 'borderColor') setBorderColor(String(value))
      if (prop === 'borderWidth') setBorderWidth(Number(value))
      if (prop === 'borderRadius') setBorderRadius(Number(value))
      if (prop === 'borderAccentColor') setBorderAccentColor(String(value))
      if (prop === 'borderShadow') setBorderShadow(Boolean(value))
    } catch (error) {
      console.error('Error updating border property:', error);
    }
  };

  const handleCorporateColorChange = (colorKey: ColorPresetKey) => {
    try {
      const config = JSON.parse(visualBuilderState.code);
      const updatedConfig = {
        ...config,
        corporateColor: colorKey
      };
      visualBuilderActions.updateCode(JSON.stringify(updatedConfig, null, 2));
      setSelectedCorporateColor(colorKey);
      console.log('🎨 Corporate color changed to:', colorKey);
    } catch (error) {
      console.error('Error applying corporate color:', error);
    }
  };

  

  return (
    <Artifact className="h-full">
      <ArtifactHeader className="bg-white">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                {selectedDashboard}
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedDashboard('Dashboard Builder')}>
                Dashboard Builder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDashboard('Sales Dashboard')}>
                Sales Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDashboard('Analytics Dashboard')}>
                Analytics Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDashboard('E-commerce Dashboard')}>
                E-commerce Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Viewport Selector - NO MEIO */}
        <div className="flex items-center gap-1">
          <ArtifactAction
            icon={Monitor}
            onClick={() => setSelectedViewport('desktop')}
            tooltip="Desktop View"
            variant={selectedViewport === 'desktop' ? 'outline' : 'ghost'}
          />
          <ArtifactAction
            icon={Tablet}
            onClick={() => setSelectedViewport('tablet')}
            tooltip="Tablet View"
            variant={selectedViewport === 'tablet' ? 'outline' : 'ghost'}
          />
          <ArtifactAction
            icon={Smartphone}
            onClick={() => setSelectedViewport('mobile')}
            tooltip="Mobile View"
            variant={selectedViewport === 'mobile' ? 'outline' : 'ghost'}
          />
        </div>

        <ArtifactActions>
          <ArtifactAction
            icon={FileText}
            onClick={() => setActiveTab('editor')}
            tooltip="Editor"
            variant={activeTab === 'editor' ? 'outline' : 'ghost'}
          />
          <ArtifactAction
            icon={BarChart3}
            onClick={() => setActiveTab('dashboard')}
            tooltip="Dashboard"
            variant={activeTab === 'dashboard' ? 'outline' : 'ghost'}
          />

          {/* Consolidated Tema Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                <Palette className="w-4 h-4" />
                <span>Tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Tema Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="w-4 h-4 mr-2" />
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(['branco', 'cinza-claro', 'preto', 'cinza-escuro'] as ThemeName[]).map((theme) => {
                    const preview = ThemeManager.getThemePreview(theme);
                    return (
                      <DropdownMenuItem
                        key={theme}
                        onClick={() => handleThemeChange(theme)}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: preview.primaryColor }}
                          />
                          <div>
                            <div className="font-medium">{preview.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-40">
                              {preview.description}
                            </div>
                          </div>
                        </div>
                        {selectedTheme === theme && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Fonte Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Type className="w-4 h-4 mr-2" />
                  Fonte
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {/* Font Family nested submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Font Family</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFonts.map((font) => (
                        <DropdownMenuItem
                          key={font.key}
                          onClick={() => handleFontChange(font.key)}
                          className="flex items-center justify-between py-2"
                        >
                          <span style={{ fontFamily: font.family }} className="text-sm">
                            {font.name}
                          </span>
                          {selectedFont === font.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Title Size nested submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Title Size</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableFontSizes.map((size) => (
                        <DropdownMenuItem
                          key={size.key}
                          onClick={() => handleFontSizeChange(size.key)}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{size.name}</span>
                            <span className="text-xs text-muted-foreground">{size.value}px • {size.usage}</span>
                          </div>
                          {selectedFontSize === size.key && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Header Style Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Layout className="w-4 h-4 mr-2" />
                  Header Style
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => headerUiActions.setVariant('auto')} className="flex items-center justify-between py-2">
                    <span>Auto</span>
                    {headerUi.variant === 'auto' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => headerUiActions.setVariant('light')} className="flex items-center justify-between py-2">
                    <span>Light</span>
                    {headerUi.variant === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => headerUiActions.setVariant('dark')} className="flex items-center justify-between py-2">
                    <span>Dark</span>
                    {headerUi.variant === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Background Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Square className="w-4 h-4 mr-2" />
                  Background
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {availableBackgrounds.map((background) => (
                    <DropdownMenuItem
                      key={background.key}
                      onClick={() => handleBackgroundChange(background.key)}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded border border-gray-200"
                          style={background.previewStyle}
                        />
                        <div>
                          <div className="font-medium text-sm">{background.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {background.description}
                          </div>
                        </div>
                      </div>
                      {selectedBackground === background.key && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Border Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Paintbrush className="w-4 h-4 mr-2" />
                  Border
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Tipo</div>
                  <DropdownMenuSeparator />
                  {BorderManager.getAvailableBorders().map((b) => (
                    <DropdownMenuItem key={b.key} onClick={() => handleBorderTypeChange(b.key)} className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{b.name}</span>
                        <span className="text-xs text-muted-foreground">{b.description}</span>
                      </div>
                      {selectedBorderType === b.key && <Check className="w-4 h-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Propriedades</div>
                  <div className="px-3 py-2 text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>Cor</span>
                      <input type="color" value={borderColor} onChange={(e) => handleBorderPropChange('borderColor', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Largura</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" value={borderWidth} onChange={(e) => handleBorderPropChange('borderWidth', Number(e.target.value))} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Raio</span>
                      <input className="w-20 border rounded px-2 py-1" type="number" value={borderRadius} onChange={(e) => handleBorderPropChange('borderRadius', Number(e.target.value))} />
                    </div>
                    {selectedBorderType === 'acentuada' && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Cor dos cantos</span>
                        <input type="color" value={borderAccentColor} onChange={(e) => handleBorderPropChange('borderAccentColor', e.target.value)} />
                      </div>
                    )}
                    {selectedBorderType === 'suave' && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Sombra</span>
                        <input type="checkbox" checked={borderShadow} onChange={(e) => handleBorderPropChange('borderShadow', e.target.checked)} />
                      </div>
                    )}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Color Palette Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Paintbrush className="w-4 h-4 mr-2" />
                  Color Palette
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {availableColorPalettes.map((colorPalette) => (
                    <DropdownMenuItem
                      key={colorPalette.key}
                      onClick={() => handleCorporateColorChange(colorPalette.key)}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: colorPalette.primary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: colorPalette.secondary }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{colorPalette.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {colorPalette.description}
                          </div>
                        </div>
                      </div>
                      {selectedCorporateColor === colorPalette.key && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Outline Button */}
          <Button
            variant="outline"
            className="px-2 py-1 text-xs font-medium"
            onClick={() => {}}
          >
            Preview
          </Button>

          {/* Compartilhar Button */}
          <button
            className="px-2 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
            onClick={() => {}}
          >
            Compartilhar
          </button>
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className="p-0 overflow-auto">
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full">
            <MonacoEditor
              value={visualBuilderState.code}
              onChange={handleCodeChange}
              language="json"
              errors={visualBuilderState.parseErrors}
            />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="h-full bg-gray-50 py-2 px-4 overflow-auto">
            <ResponsiveGridCanvas
              widgets={visualBuilderState.widgets}
              gridConfig={visualBuilderState.gridConfig}
              viewportMode={selectedViewport}
              onLayoutChange={visualBuilderActions.updateWidgets}
              headerTitle={visualBuilderState.dashboardTitle || 'Live Dashboard'}
              headerSubtitle={visualBuilderState.dashboardSubtitle || 'Real-time visualization with Supabase data'}
            />
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}
