'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';
import { ThemeManager, type ThemeName } from '@/components/visual-builder/ThemeManager';
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
import { FileText, BarChart3, Palette, Check } from 'lucide-react';

export default function DashboardChatPanel() {
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('dark');
  const visualBuilderState = useStore($visualBuilderState);

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
              {(['light', 'dark', 'blue', 'green', 'corporate'] as ThemeName[]).map((theme) => {
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
              {(['navy', 'slate', 'forest', 'burgundy', 'platinum'] as ThemeName[]).map((theme) => {
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