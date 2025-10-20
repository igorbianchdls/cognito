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
  axisFontFamily,
  axisFontSize,
  axisFontWeight,
  axisTextColor,
  axisLegendFontSize,
  axisLegendFontWeight,
  labelsFontFamily,
  labelsFontSize,
  labelsFontWeight,
  labelsTextColor,
  legendsFontFamily,
  legendsFontSize,
  legendsFontWeight,
  legendsTextColor,
  tooltipFontSize,
  tooltipFontFamily,
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
                  value={axisFontFamily || 'Geist, sans-serif'}
                  onValueChange={(value) => onConfigChange('axisFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione uma fonte" />
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
                  value={(axisFontWeight || 400).toString()}
                  onValueChange={(value) => onConfigChange('axisFontWeight', parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione o peso" />
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
                  Tamanho dos Ticks ({axisFontSize || 12}px)
                </label>
                <Slider
                  value={[axisFontSize || 12]}
                  onValueChange={(value) => onConfigChange('axisFontSize', value[0])}
                  min={8}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Tamanho das Legendas ({axisLegendFontSize || 14}px)
                </label>
                <Slider
                  value={[axisLegendFontSize || 14]}
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
                    value={axisTextColor || '#6b7280'}
                    onChange={(e) => onConfigChange('axisTextColor', e.target.value)}
                    className="h-7 w-14 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={axisTextColor || ''}
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
                  value={labelsFontFamily || 'Geist, sans-serif'}
                  onValueChange={(value) => onConfigChange('labelsFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione uma fonte" />
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
                  value={(labelsFontWeight || 500).toString()}
                  onValueChange={(value) => onConfigChange('labelsFontWeight', parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione o peso" />
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
                  Tamanho ({labelsFontSize || 11}px)
                </label>
                <Slider
                  value={[labelsFontSize || 11]}
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
                    value={labelsTextColor || '#1f2937'}
                    onChange={(e) => onConfigChange('labelsTextColor', e.target.value)}
                    className="h-7 w-14 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={labelsTextColor || ''}
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
                  value={legendsFontFamily || 'Geist, sans-serif'}
                  onValueChange={(value) => onConfigChange('legendsFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione uma fonte" />
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
                  value={(legendsFontWeight || 400).toString()}
                  onValueChange={(value) => onConfigChange('legendsFontWeight', parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione o peso" />
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
                  Tamanho ({legendsFontSize || 12}px)
                </label>
                <Slider
                  value={[legendsFontSize || 12]}
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
                    value={legendsTextColor || '#6b7280'}
                    onChange={(e) => onConfigChange('legendsTextColor', e.target.value)}
                    className="h-7 w-14 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={legendsTextColor || ''}
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
                  value={tooltipFontFamily || 'Geist, sans-serif'}
                  onValueChange={(value) => onConfigChange('tooltipFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione uma fonte" />
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
                  Tamanho ({tooltipFontSize || 12}px)
                </label>
                <Slider
                  value={[tooltipFontSize || 12]}
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
                  fontFamily: axisFontFamily || 'Geist, sans-serif',
                  fontSize: `${axisFontSize || 12}px`,
                  fontWeight: axisFontWeight || 400,
                  color: axisTextColor || '#6b7280'
                }}
              >
                📊 Texto dos Eixos (Axis Ticks)
              </div>
              <div 
                className="text-sm"
                style={{ 
                  fontFamily: labelsFontFamily || 'Geist, sans-serif',
                  fontSize: `${labelsFontSize || 11}px`,
                  fontWeight: labelsFontWeight || 500,
                  color: labelsTextColor || '#1f2937'
                }}
              >
                🏷️ Labels do Gráfico
              </div>
              <div 
                className="text-sm"
                style={{ 
                  fontFamily: legendsFontFamily || 'Geist, sans-serif',
                  fontSize: `${legendsFontSize || 12}px`,
                  fontWeight: legendsFontWeight || 400,
                  color: legendsTextColor || '#6b7280'
                }}
              >
                📝 Legendas do Gráfico
              </div>
              <div 
                className="text-sm bg-white px-2 py-1 rounded border inline-block"
                style={{ 
                  fontFamily: tooltipFontFamily || 'Geist, sans-serif',
                  fontSize: `${tooltipFontSize || 12}px`
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