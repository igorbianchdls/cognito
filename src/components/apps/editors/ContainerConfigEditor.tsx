'use client'

import type { DroppedWidget, ContainerConfig } from '@/types/apps/droppedWidget'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Slider } from '@/components/ui/slider'

// Helper function to convert hex color + opacity to RGBA
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface ContainerConfigEditorProps {
  selectedWidget: DroppedWidget
  containerConfig: ContainerConfig
  onContainerConfigChange: (field: string, value: unknown) => void
}

// Default container configuration for consistent fallbacks
const DEFAULT_CONTAINER_CONFIG = {
  backgroundColor: '#ffffff',
  backgroundOpacity: 1,
  borderColor: '#e5e7eb',
  borderOpacity: 1,
  borderWidth: 1,
  borderRadius: 8
}

export default function ContainerConfigEditor({ 
  selectedWidget, 
  containerConfig, 
  onContainerConfigChange 
}: ContainerConfigEditorProps) {
  
  if (!selectedWidget) {
    return null
  }

  // Ensure we always have valid values for the inputs
  const safeContainerConfig = {
    backgroundColor: containerConfig.backgroundColor || DEFAULT_CONTAINER_CONFIG.backgroundColor,
    backgroundOpacity: containerConfig.backgroundOpacity ?? DEFAULT_CONTAINER_CONFIG.backgroundOpacity,
    borderColor: containerConfig.borderColor || DEFAULT_CONTAINER_CONFIG.borderColor,
    borderOpacity: containerConfig.borderOpacity ?? DEFAULT_CONTAINER_CONFIG.borderOpacity,
    borderWidth: containerConfig.borderWidth ?? DEFAULT_CONTAINER_CONFIG.borderWidth,
    borderRadius: containerConfig.borderRadius ?? DEFAULT_CONTAINER_CONFIG.borderRadius,
  }

  console.log('📦 ContainerConfigEditor render:', {
    widgetId: selectedWidget.i,
    rawContainerConfig: containerConfig,
    safeContainerConfig,
    hasContainerConfig: !!selectedWidget.config?.containerConfig
  })

  return (
    <div className="border-t pt-4 mt-4">
      
      <Accordion type="multiple" className="w-full space-y-2">
        {/* Visual & Colors */}
        <AccordionItem value="container-visual">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            🎨 Container Visual & Colors
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Background */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Background</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
                        style={{ backgroundColor: safeContainerConfig.backgroundColor }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = safeContainerConfig.backgroundColor;
                          input.onchange = (e) => {
                            console.log('🎨 Background color change:', (e.target as HTMLInputElement).value)
                            onContainerConfigChange('backgroundColor', (e.target as HTMLInputElement).value)
                          };
                          input.click();
                        }}
                      />
                      <input
                        type="text"
                        value={safeContainerConfig.backgroundColor.replace('#', '').toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value.replace('#', '');
                          if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                            onContainerConfigChange('backgroundColor', `#${hex}`);
                          }
                        }}
                        className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(safeContainerConfig.backgroundOpacity * 100)}
                        onChange={(e) => {
                          const opacity = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
                          onContainerConfigChange('backgroundOpacity', opacity);
                        }}
                        className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Border */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Border</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
                        style={{ backgroundColor: safeContainerConfig.borderColor }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = safeContainerConfig.borderColor;
                          input.onchange = (e) => onContainerConfigChange('borderColor', (e.target as HTMLInputElement).value);
                          input.click();
                        }}
                      />
                      <input
                        type="text"
                        value={safeContainerConfig.borderColor.replace('#', '').toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value.replace('#', '');
                          if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                            onContainerConfigChange('borderColor', `#${hex}`);
                          }
                        }}
                        className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(safeContainerConfig.borderOpacity * 100)}
                        onChange={(e) => {
                          const opacity = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
                          onContainerConfigChange('borderOpacity', opacity);
                        }}
                        className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[safeContainerConfig.borderWidth]}
                      onValueChange={([value]) => onContainerConfigChange('borderWidth', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 min-w-[40px] text-right">{safeContainerConfig.borderWidth} px</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[safeContainerConfig.borderRadius]}
                      onValueChange={([value]) => onContainerConfigChange('borderRadius', value)}
                      max={50}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 min-w-[40px] text-right">{safeContainerConfig.borderRadius} px</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}