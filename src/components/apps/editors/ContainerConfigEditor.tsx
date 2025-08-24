'use client'

import type { DroppedWidget, ContainerConfig } from '@/types/widget'
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
      <h4 className="text-sm font-medium text-gray-700 mb-4">📦 Widget Container</h4>
      
      <Accordion type="multiple" className="w-full space-y-2">
        {/* Visual & Colors */}
        <AccordionItem value="container-visual">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            🎨 Container Visual & Colors
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={safeContainerConfig.backgroundColor}
                    onChange={(e) => {
                      console.log('🎨 Background color change:', e.target.value)
                      onContainerConfigChange('backgroundColor', e.target.value)
                    }}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Opacity</label>
                  <Slider
                    value={[safeContainerConfig.backgroundOpacity]}
                    onValueChange={([value]) => onContainerConfigChange('backgroundOpacity', value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(safeContainerConfig.backgroundOpacity * 100)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                  <input
                    type="color"
                    value={safeContainerConfig.borderColor}
                    onChange={(e) => onContainerConfigChange('borderColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Opacity</label>
                  <Slider
                    value={[safeContainerConfig.borderOpacity]}
                    onValueChange={([value]) => onContainerConfigChange('borderOpacity', value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(safeContainerConfig.borderOpacity * 100)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                  <Slider
                    value={[safeContainerConfig.borderWidth]}
                    onValueChange={([value]) => onContainerConfigChange('borderWidth', value)}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{safeContainerConfig.borderWidth}px</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                  <Slider
                    value={[safeContainerConfig.borderRadius]}
                    onValueChange={([value]) => onContainerConfigChange('borderRadius', value)}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{safeContainerConfig.borderRadius}px</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Preview */}
        <AccordionItem value="container-preview">
          <AccordionTrigger className="text-sm font-medium text-gray-700">
            👁️ Container Preview
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p className="text-xs text-gray-600 mb-2">Preview of container styling:</p>
              <div 
                className="w-full h-20 flex items-center justify-center text-sm text-gray-600"
                style={{
                  backgroundColor: hexToRgba(safeContainerConfig.backgroundColor, safeContainerConfig.backgroundOpacity),
                  borderColor: hexToRgba(safeContainerConfig.borderColor, safeContainerConfig.borderOpacity),
                  borderWidth: `${safeContainerConfig.borderWidth}px`,
                  borderRadius: `${safeContainerConfig.borderRadius}px`,
                  borderStyle: 'solid'
                }}
              >
                Widget Container Preview
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}