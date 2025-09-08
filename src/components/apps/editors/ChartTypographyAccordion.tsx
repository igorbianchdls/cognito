'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface ChartTypographyAccordionProps {
  // Axis typography
  axisFontFamily?: string
  axisFontSize?: number
  axisFontWeight?: number
  axisTextColor?: string
  axisLegendFontSize?: number
  axisLegendFontWeight?: number
  
  // Labels typography  
  labelsFontFamily?: string
  labelsFontSize?: number
  labelsFontWeight?: number
  labelsTextColor?: string
  
  // Legends typography
  legendsFontFamily?: string
  legendsFontSize?: number
  legendsFontWeight?: number
  legendsTextColor?: string
  
  // Tooltip typography
  tooltipFontSize?: number
  tooltipFontFamily?: string
  
  onConfigChange: (field: string, value: unknown) => void
}

const fontFamilyOptions = [
  { value: 'Geist, sans-serif', label: 'Geist' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier New' },
]

const fontWeightOptions = [
  { value: 300, label: 'Light (300)' },
  { value: 400, label: 'Regular (400)' },
  { value: 500, label: 'Medium (500)' },
  { value: 600, label: 'Semi Bold (600)' },
  { value: 700, label: 'Bold (700)' },
  { value: 800, label: 'Extra Bold (800)' },
]

export default function ChartTypographyAccordion({
  axisFontFamily = 'Geist, sans-serif',
  axisFontSize = 12,
  axisFontWeight = 400,
  axisTextColor = '#6b7280',
  axisLegendFontSize = 14,
  axisLegendFontWeight = 500,
  labelsFontFamily = 'Geist, sans-serif',
  labelsFontSize = 11,
  labelsFontWeight = 500,
  labelsTextColor = '#1f2937',
  legendsFontFamily = 'Geist, sans-serif',
  legendsFontSize = 12,
  legendsFontWeight = 400,
  legendsTextColor = '#6b7280',
  tooltipFontSize = 12,
  tooltipFontFamily = 'Geist, sans-serif',
  onConfigChange
}: ChartTypographyAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 h-auto font-normal"
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Tipografia do Gráfico</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-6 border-t border-gray-100">
          
          {/* Axis Typography */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Eixos (Axis)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Fonte dos Ticks</label>
                <Select
                  value={axisFontFamily}
                  onValueChange={(value) => onConfigChange('axisFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilyOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Peso dos Ticks</label>
                <Select
                  value={axisFontWeight.toString()}
                  onValueChange={(value) => onConfigChange('axisFontWeight', parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontWeightOptions.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value.toString()}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Tamanho dos Ticks ({axisFontSize}px)
                </label>
                <Slider
                  value={[axisFontSize]}
                  onValueChange={(value) => onConfigChange('axisFontSize', value[0])}
                  min={8}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Tamanho das Legendas ({axisLegendFontSize}px)
                </label>
                <Slider
                  value={[axisLegendFontSize]}
                  onValueChange={(value) => onConfigChange('axisLegendFontSize', value[0])}
                  min={10}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Cor do Texto</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={axisTextColor}
                    onChange={(e) => onConfigChange('axisTextColor', e.target.value)}
                    className="h-7 w-14 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={axisTextColor}
                    onChange={(e) => onConfigChange('axisTextColor', e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="#6b7280"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Labels Typography */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Labels</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Fonte</label>
                <Select
                  value={labelsFontFamily}
                  onValueChange={(value) => onConfigChange('labelsFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilyOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Peso</label>
                <Select
                  value={labelsFontWeight.toString()}
                  onValueChange={(value) => onConfigChange('labelsFontWeight', parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontWeightOptions.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value.toString()}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Tamanho ({labelsFontSize}px)
                </label>
                <Slider
                  value={[labelsFontSize]}
                  onValueChange={(value) => onConfigChange('labelsFontSize', value[0])}
                  min={8}
                  max={18}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Cor do Texto</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={labelsTextColor}
                    onChange={(e) => onConfigChange('labelsTextColor', e.target.value)}
                    className="h-7 w-14 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={labelsTextColor}
                    onChange={(e) => onConfigChange('labelsTextColor', e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="#1f2937"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legends Typography */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Legendas</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Fonte</label>
                <Select
                  value={legendsFontFamily}
                  onValueChange={(value) => onConfigChange('legendsFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilyOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Peso</label>
                <Select
                  value={legendsFontWeight.toString()}
                  onValueChange={(value) => onConfigChange('legendsFontWeight', parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontWeightOptions.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value.toString()}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Tamanho ({legendsFontSize}px)
                </label>
                <Slider
                  value={[legendsFontSize]}
                  onValueChange={(value) => onConfigChange('legendsFontSize', value[0])}
                  min={8}
                  max={18}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Cor do Texto</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={legendsTextColor}
                    onChange={(e) => onConfigChange('legendsTextColor', e.target.value)}
                    className="h-7 w-14 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={legendsTextColor}
                    onChange={(e) => onConfigChange('legendsTextColor', e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="#6b7280"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tooltip Typography */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Tooltip</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Fonte</label>
                <Select
                  value={tooltipFontFamily}
                  onValueChange={(value) => onConfigChange('tooltipFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilyOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Tamanho ({tooltipFontSize}px)
                </label>
                <Slider
                  value={[tooltipFontSize]}
                  onValueChange={(value) => onConfigChange('tooltipFontSize', value[0])}
                  min={10}
                  max={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Preview</label>
            <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-2">
              <div 
                className="text-sm"
                style={{ 
                  fontFamily: axisFontFamily,
                  fontSize: `${axisFontSize}px`,
                  fontWeight: axisFontWeight,
                  color: axisTextColor 
                }}
              >
                📊 Texto dos Eixos (Axis Ticks)
              </div>
              <div 
                className="text-sm"
                style={{ 
                  fontFamily: labelsFontFamily,
                  fontSize: `${labelsFontSize}px`,
                  fontWeight: labelsFontWeight,
                  color: labelsTextColor 
                }}
              >
                🏷️ Labels do Gráfico
              </div>
              <div 
                className="text-sm"
                style={{ 
                  fontFamily: legendsFontFamily,
                  fontSize: `${legendsFontSize}px`,
                  fontWeight: legendsFontWeight,
                  color: legendsTextColor 
                }}
              >
                📝 Legendas do Gráfico
              </div>
              <div 
                className="text-sm bg-white px-2 py-1 rounded border inline-block"
                style={{ 
                  fontFamily: tooltipFontFamily,
                  fontSize: `${tooltipFontSize}px`
                }}
              >
                💬 Tooltip do Gráfico
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}