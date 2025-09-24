'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
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
} from '@/components/ui/dropdown-menu';
import { FileText, BarChart3, Palette, Check, Type, Square, Paintbrush } from 'lucide-react';

export default function DashboardChatPanel() {
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('dark');
  const [selectedFont, setSelectedFont] = useState<FontPresetKey>('inter');
  const [selectedFontSize, setSelectedFontSize] = useState<FontSizeKey>('lg');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundPresetKey>('white');
  const [selectedCorporateColor, setSelectedCorporateColor] = useState<ColorPresetKey>('corporate');
  const visualBuilderState = useStore($visualBuilderState);

  // Available backgrounds
  const availableBackgrounds = BackgroundManager.getAvailableBackgrounds();

  // Available corporate color palettes
  const availableColorPalettes = ColorManager.getAvailableColorPalettes();

  // Available fonts and sizes from FontManager
  const availableFonts = FontManager.getAvailableFonts();
  const availableFontSizes = FontManager.getAvailableFontSizes();

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
          <ArtifactTitle>Dashboard Builder</ArtifactTitle>
          <ArtifactDescription>Visual dashboard creation tool</ArtifactDescription>
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

          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <ArtifactAction
                  icon={Palette}
                  tooltip={`Theme: ${ThemeManager.getThemePreview(selectedTheme).name}`}
                  variant="ghost"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Select Theme
              </div>
              <DropdownMenuSeparator />

              {/* Classic Themes */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Classic
              </div>
              {(['light', 'dark', 'blue', 'corporate'] as ThemeName[]).map((theme) => {
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

              <DropdownMenuSeparator />

              {/* Business Themes */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Business
              </div>
              {(['navy', 'slate', 'hightech', 'platinum'] as ThemeName[]).map((theme) => {
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
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <ArtifactAction
                  icon={Type}
                  tooltip={`Font: ${availableFonts.find(f => f.key === selectedFont)?.name || 'Unknown'} (${FontManager.getFontSizeValue(selectedFontSize)}px)`}
                  variant="ghost"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Font Selection Section */}
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Font Family
              </div>
              <DropdownMenuSeparator />

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

              <DropdownMenuSeparator />

              {/* Font Size Selection Section */}
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Title Size
              </div>
              <DropdownMenuSeparator />

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
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Background Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <ArtifactAction
                  icon={Square}
                  tooltip={`Background: ${availableBackgrounds.find(b => b.key === selectedBackground)?.name || 'Unknown'}`}
                  variant="ghost"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Select Background
              </div>
              <DropdownMenuSeparator />

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
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Color Selector - Show for all themes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <ArtifactAction
                  icon={Paintbrush}
                  tooltip={`Color: ${availableColorPalettes.find(c => c.key === selectedCorporateColor)?.name || 'Unknown'}`}
                  variant="ghost"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Select Color Palette
              </div>
              <DropdownMenuSeparator />

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
            </DropdownMenuContent>
          </DropdownMenu>
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
          <div className="h-full bg-gray-50 p-4 overflow-auto">
            <GridCanvas
              widgets={visualBuilderState.widgets}
              gridConfig={visualBuilderState.gridConfig}
              onLayoutChange={handleLayoutChange}
            />
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}