'use client'

import type { DroppedWidget, ContainerConfig } from '@/types/widget'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

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

export default function ContainerConfigEditor({ 
  selectedWidget, 
  containerConfig, 
  onContainerConfigChange 
}: ContainerConfigEditorProps) {
  
  if (!selectedWidget) {
    return null
  }

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
                    value={containerConfig.backgroundColor || '#ffffff'}
                    onChange={(e) => onContainerConfigChange('backgroundColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={containerConfig.backgroundOpacity ?? 1}
                    onChange={(e) => onContainerConfigChange('backgroundOpacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round((containerConfig.backgroundOpacity ?? 1) * 100)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                  <input
                    type="color"
                    value={containerConfig.borderColor || '#e5e7eb'}
                    onChange={(e) => onContainerConfigChange('borderColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={containerConfig.borderOpacity ?? 1}
                    onChange={(e) => onContainerConfigChange('borderOpacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round((containerConfig.borderOpacity ?? 1) * 100)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={containerConfig.borderWidth || 1}
                    onChange={(e) => onContainerConfigChange('borderWidth', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{containerConfig.borderWidth || 1}px</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={containerConfig.borderRadius || 8}
                    onChange={(e) => onContainerConfigChange('borderRadius', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{containerConfig.borderRadius || 8}px</span>
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
                  backgroundColor: hexToRgba(containerConfig.backgroundColor || '#ffffff', containerConfig.backgroundOpacity ?? 1),
                  borderColor: hexToRgba(containerConfig.borderColor || '#e5e7eb', containerConfig.borderOpacity ?? 1),
                  borderWidth: `${containerConfig.borderWidth || 1}px`,
                  borderRadius: `${containerConfig.borderRadius || 8}px`,
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