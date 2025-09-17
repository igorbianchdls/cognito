'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContainerBorderStyling {
  backgroundColor?: string
  backgroundOpacity?: number
  backgroundGradient?: {
    enabled: boolean
    type: 'linear' | 'radial' | 'conic'
    direction: string
    startColor: string
    endColor: string
  }
  backdropFilter?: {
    enabled: boolean
    blur: number
  }
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderRadius?: number
  containerPadding?: number
  containerShadowColor?: string
  containerShadowOpacity?: number
  containerShadowBlur?: number
  containerShadowOffsetX?: number
  containerShadowOffsetY?: number
}

interface ContainerBorderAccordionProps {
  styling?: ContainerBorderStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
}

export default function ContainerBorderAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling' 
}: ContainerBorderAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  // Debug log for styling values
  console.log('🖼️ ContainerBorderAccordion Debug:', styling)

  return (
    <AccordionItem value="container-border" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>🖼️</span>
          <span className="text-sm font-medium">Container Border</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3">Chart Container Border</label>
            <p className="text-xs text-gray-500 mb-4">
              Customize the border around the entire chart container including title and subtitle.
            </p>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styling?.backgroundColor ?? '#ffffff'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Background color changed to:', value)
                  onConfigChange(getFieldPath('backgroundColor'), value)
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styling?.backgroundColor ?? '#ffffff'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Background color changed to:', value)
                  onConfigChange(getFieldPath('backgroundColor'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Background Advanced */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-3">Background Advanced</label>

            {/* Background Opacity */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">
                Background Opacity: {Math.round((styling?.backgroundOpacity ?? 1) * 100)}%
              </label>
              <Slider
                value={[styling?.backgroundOpacity ?? 1]}
                onValueChange={(value) => onConfigChange(getFieldPath('backgroundOpacity'), value[0])}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Background Gradient */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={styling?.backgroundGradient?.enabled ?? false}
                  onChange={(e) => {
                    const currentGradient = styling?.backgroundGradient || {
                      enabled: false,
                      type: 'linear' as const,
                      direction: '90deg',
                      startColor: '#3b82f6',
                      endColor: '#8b5cf6'
                    }
                    onConfigChange(getFieldPath('backgroundGradient'), {
                      ...currentGradient,
                      enabled: e.target.checked
                    })
                  }}
                  className="w-4 h-4"
                />
                <label className="text-xs text-gray-500">Enable Gradient</label>
              </div>

              {styling?.backgroundGradient?.enabled && (
                <div className="space-y-3 ml-6">
                  {/* Gradient Type */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <Select
                      value={styling?.backgroundGradient?.type || 'linear'}
                      onValueChange={(value) => {
                        const currentGradient = styling?.backgroundGradient || {
                          enabled: false,
                          type: 'linear' as const,
                          direction: '90deg',
                          startColor: '#3b82f6',
                          endColor: '#8b5cf6'
                        }
                        onConfigChange(getFieldPath('backgroundGradient'), {
                          ...currentGradient,
                          type: value as 'linear' | 'radial' | 'conic'
                        })
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="conic">Conic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gradient Direction */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Direction</label>
                    <input
                      type="text"
                      value={styling?.backgroundGradient?.direction || '90deg'}
                      onChange={(e) => {
                        const currentGradient = styling?.backgroundGradient || {
                          enabled: false,
                          type: 'linear' as const,
                          direction: '90deg',
                          startColor: '#3b82f6',
                          endColor: '#8b5cf6'
                        }
                        onConfigChange(getFieldPath('backgroundGradient'), {
                          ...currentGradient,
                          direction: e.target.value
                        })
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="90deg"
                    />
                  </div>

                  {/* Gradient Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Color</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={styling?.backgroundGradient?.startColor || '#3b82f6'}
                          onChange={(e) => {
                            const currentGradient = styling?.backgroundGradient || {
                              enabled: false,
                              type: 'linear' as const,
                              direction: '90deg',
                              startColor: '#3b82f6',
                              endColor: '#8b5cf6'
                            }
                            onConfigChange(getFieldPath('backgroundGradient'), {
                              ...currentGradient,
                              startColor: e.target.value
                            })
                          }}
                          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={styling?.backgroundGradient?.startColor || '#3b82f6'}
                          onChange={(e) => {
                            const currentGradient = styling?.backgroundGradient || {
                              enabled: false,
                              type: 'linear' as const,
                              direction: '90deg',
                              startColor: '#3b82f6',
                              endColor: '#8b5cf6'
                            }
                            onConfigChange(getFieldPath('backgroundGradient'), {
                              ...currentGradient,
                              startColor: e.target.value
                            })
                          }}
                          className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Color</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={styling?.backgroundGradient?.endColor || '#8b5cf6'}
                          onChange={(e) => {
                            const currentGradient = styling?.backgroundGradient || {
                              enabled: false,
                              type: 'linear' as const,
                              direction: '90deg',
                              startColor: '#3b82f6',
                              endColor: '#8b5cf6'
                            }
                            onConfigChange(getFieldPath('backgroundGradient'), {
                              ...currentGradient,
                              endColor: e.target.value
                            })
                          }}
                          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={styling?.backgroundGradient?.endColor || '#8b5cf6'}
                          onChange={(e) => {
                            const currentGradient = styling?.backgroundGradient || {
                              enabled: false,
                              type: 'linear' as const,
                              direction: '90deg',
                              startColor: '#3b82f6',
                              endColor: '#8b5cf6'
                            }
                            onConfigChange(getFieldPath('backgroundGradient'), {
                              ...currentGradient,
                              endColor: e.target.value
                            })
                          }}
                          className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded"
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Backdrop Filter */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={styling?.backdropFilter?.enabled ?? false}
                  onChange={(e) => {
                    const currentBackdrop = styling?.backdropFilter || {
                      enabled: false,
                      blur: 10
                    }
                    onConfigChange(getFieldPath('backdropFilter'), {
                      ...currentBackdrop,
                      enabled: e.target.checked
                    })
                  }}
                  className="w-4 h-4"
                />
                <label className="text-xs text-gray-500">Enable Backdrop Blur</label>
              </div>

              {styling?.backdropFilter?.enabled && (
                <div className="ml-6">
                  <label className="block text-xs text-gray-500 mb-1">
                    Blur Intensity: {styling?.backdropFilter?.blur || 10}px
                  </label>
                  <Slider
                    value={[styling?.backdropFilter?.blur ?? 10]}
                    onValueChange={(value) => {
                      const currentBackdrop = styling?.backdropFilter || {
                        enabled: false,
                        blur: 10
                      }
                      onConfigChange(getFieldPath('backdropFilter'), {
                        ...currentBackdrop,
                        blur: value[0]
                      })
                    }}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Border Width */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Width</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={styling?.containerBorderWidth ?? 0.5}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  console.log('🖼️ ContainerBorderAccordion: Border width changed to:', value)
                  onConfigChange(getFieldPath('containerBorderWidth'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0.5"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
            </div>
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styling?.containerBorderColor ?? '#cccccc'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Border color changed to:', value)
                  onConfigChange(getFieldPath('containerBorderColor'), value)
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styling?.containerBorderColor ?? '#cccccc'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Border color changed to:', value)
                  onConfigChange(getFieldPath('containerBorderColor'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#cccccc"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={styling?.containerBorderRadius ?? 8}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  console.log('🖼️ ContainerBorderAccordion: Border radius changed to:', value)
                  onConfigChange(getFieldPath('containerBorderRadius'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="8"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
            </div>
          </div>

          {/* Container Padding */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Container Padding</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={styling?.containerPadding ?? 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  console.log('🖼️ ContainerBorderAccordion: Container padding changed to:', value)
                  onConfigChange(getFieldPath('containerPadding'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
            </div>
          </div>

          {/* Container Shadow */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-3">Container Shadow</label>
            
            {/* Shadow Color */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Shadow Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styling?.containerShadowColor ?? '#000000'}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('🖼️ ContainerBorderAccordion: Shadow color changed to:', value)
                    onConfigChange(getFieldPath('containerShadowColor'), value)
                  }}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={styling?.containerShadowColor ?? '#000000'}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('🖼️ ContainerBorderAccordion: Shadow color changed to:', value)
                    onConfigChange(getFieldPath('containerShadowColor'), value)
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Shadow Opacity */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Shadow Opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={styling?.containerShadowOpacity ?? 0.2}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    console.log('🖼️ ContainerBorderAccordion: Shadow opacity changed to:', value)
                    onConfigChange(getFieldPath('containerShadowOpacity'), value)
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="0.2"
                />
                <span className="text-xs text-gray-500 w-8">α</span>
              </div>
            </div>

            {/* Shadow Blur */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Shadow Blur</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  value={styling?.containerShadowBlur ?? 8}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    console.log('🖼️ ContainerBorderAccordion: Shadow blur changed to:', value)
                    onConfigChange(getFieldPath('containerShadowBlur'), value)
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="8"
                />
                <span className="text-xs text-gray-500 w-8">px</span>
              </div>
            </div>

            {/* Shadow Offset X and Y */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset X</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="-20"
                    max="20"
                    step="1"
                    value={styling?.containerShadowOffsetX ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      console.log('🖼️ ContainerBorderAccordion: Shadow offset X changed to:', value)
                      onConfigChange(getFieldPath('containerShadowOffsetX'), value)
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500 w-8">px</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset Y</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="-20"
                    max="20"
                    step="1"
                    value={styling?.containerShadowOffsetY ?? 4}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      console.log('🖼️ ContainerBorderAccordion: Shadow offset Y changed to:', value)
                      onConfigChange(getFieldPath('containerShadowOffsetY'), value)
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="4"
                  />
                  <span className="text-xs text-gray-500 w-8">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-xs">💡</span>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Background:</strong> Color, opacity (0-100%), and gradients</div>
                <div><strong>Gradient:</strong> Linear/radial/conic with custom colors and direction</div>
                <div><strong>Backdrop Blur:</strong> Glassmorphism effect (0-20px blur)</div>
                <div><strong>Border:</strong> Width, color, and radius of the border</div>
                <div><strong>Padding:</strong> Space between border and content (0-20px)</div>
                <div><strong>Shadow:</strong> Color, opacity (0-1), blur (0-20px), and offsets (-20 to 20px)</div>
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}