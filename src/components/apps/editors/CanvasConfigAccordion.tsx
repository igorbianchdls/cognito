'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Palette, Monitor, Grid, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { CanvasConfig } from '@/types/apps/canvas'

interface CanvasConfigAccordionProps {
  canvasConfig: CanvasConfig
  onConfigChange: (key: string, value: string | number | boolean | [number, number] | Partial<CanvasConfig['breakpoints']>) => void
}

export default function CanvasConfigAccordion({
  canvasConfig,
  onConfigChange
}: CanvasConfigAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 h-auto font-normal"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Configurações do Canvas</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-6 border-t border-gray-100">
          
          {/* Background Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Palette className="w-3 h-3" />
              <span>Fundo</span>
            </div>
            
            {/* Background Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="bg-color" className="text-xs font-medium text-gray-600">Cor de Fundo</label>
              <div className="flex items-center gap-1">
                <Input
                  id="bg-color"
                  type="color"
                  value={canvasConfig.backgroundColor}
                  onChange={(e) => onConfigChange('backgroundColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={canvasConfig.backgroundColor}
                  onChange={(e) => onConfigChange('backgroundColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {/* Canvas Dimensions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Monitor className="w-3 h-3" />
              <span>Dimensões</span>
            </div>
            
            {/* Canvas Mode */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="canvas-mode" className="text-xs font-medium text-gray-600">Modo</label>
              <Select
                value={canvasConfig.canvasMode}
                onValueChange={(value) => onConfigChange('canvasMode', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsive">Responsivo</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Responsive Height */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="responsive-height" className="text-xs font-medium text-gray-600">Altura Responsiva</label>
              <div className="flex items-center gap-1">
                <Input
                  id="responsive-height"
                  type="number"
                  value={typeof canvasConfig.responsiveHeight === 'number' ? canvasConfig.responsiveHeight : 800}
                  onChange={(e) => onConfigChange('responsiveHeight', parseInt(e.target.value))}
                  className="h-7 text-xs"
                  min="400"
                  max="3000"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>

            {/* Min Height */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="min-height" className="text-xs font-medium text-gray-600">Altura Mínima</label>
              <div className="flex items-center gap-1">
                <Input
                  id="min-height"
                  type="number"
                  value={canvasConfig.minHeight}
                  onChange={(e) => onConfigChange('minHeight', parseInt(e.target.value))}
                  className="h-7 text-xs"
                  min="300"
                  max="2000"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
          </div>

          {/* Grid Layout Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Grid className="w-3 h-3" />
              <span>Layout do Grid</span>
            </div>
            
            {/* Row Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="row-height" className="text-xs font-medium text-gray-600">Altura das Rows</label>
                <span className="text-xs text-gray-500">{canvasConfig.rowHeight}px</span>
              </div>
              <Slider
                id="row-height"
                value={[canvasConfig.rowHeight]}
                onValueChange={(value) => onConfigChange('rowHeight', value[0])}
                min={1}
                max={150}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1px</span>
                <span>150px</span>
              </div>
            </div>

            {/* Container Padding */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">Padding</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={canvasConfig.containerPadding[0]}
                  onChange={(e) => onConfigChange('containerPadding', [parseInt(e.target.value), canvasConfig.containerPadding[1]])}
                  className="h-7 text-xs"
                  min="0"
                  max="100"
                />
                <span className="text-xs text-gray-500">X</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={canvasConfig.containerPadding[1]}
                  onChange={(e) => onConfigChange('containerPadding', [canvasConfig.containerPadding[0], parseInt(e.target.value)])}
                  className="h-7 text-xs"
                  min="0"
                  max="100"
                />
                <span className="text-xs text-gray-500">Y</span>
              </div>
            </div>

            {/* Margin */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">Margem</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={canvasConfig.margin[0]}
                  onChange={(e) => onConfigChange('margin', [parseInt(e.target.value), canvasConfig.margin[1]])}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                />
                <span className="text-xs text-gray-500">X</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={canvasConfig.margin[1]}
                  onChange={(e) => onConfigChange('margin', [canvasConfig.margin[0], parseInt(e.target.value)])}
                  className="h-7 text-xs"
                  min="0"
                  max="50"
                />
                <span className="text-xs text-gray-500">Y</span>
              </div>
            </div>

            {/* Max Rows */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">Máximo de Linhas</label>
              <Input
                type="number"
                value={canvasConfig.maxRows}
                onChange={(e) => onConfigChange('maxRows', parseInt(e.target.value))}
                className="h-7 text-xs"
                min="10"
                max="100"
                step="5"
              />
            </div>

            {/* Number of Columns */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">Número de Colunas</label>
              <Input
                type="number"
                value={canvasConfig.breakpoints.lg}
                onChange={(e) => onConfigChange('breakpoints', { lg: parseInt(e.target.value) })}
                className="h-7 text-xs"
                min="1"
                max="24"
              />
            </div>
          </div>

          {/* Grid Columns (Breakpoints) Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Grid className="w-3 h-3" />
              <span>Colunas do Grid</span>
            </div>
            
            {/* LG */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">LG {`(>1200px)`}</label>
              <Input
                type="number"
                value={canvasConfig.breakpoints.lg}
                onChange={(e) => onConfigChange('breakpoints', { lg: parseInt(e.target.value) })}
                className="h-7 text-xs"
                min="1"
                max="24"
              />
            </div>

            {/* MD */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">MD (996-1200px)</label>
              <Input
                type="number"
                value={canvasConfig.breakpoints.md}
                onChange={(e) => onConfigChange('breakpoints', { md: parseInt(e.target.value) })}
                className="h-7 text-xs"
                min="1"
                max="24"
              />
            </div>

            {/* SM */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">SM (768-996px)</label>
              <Input
                type="number"
                value={canvasConfig.breakpoints.sm}
                onChange={(e) => onConfigChange('breakpoints', { sm: parseInt(e.target.value) })}
                className="h-7 text-xs"
                min="1"
                max="24"
              />
            </div>

            {/* XS */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">XS (480-768px)</label>
              <Input
                type="number"
                value={canvasConfig.breakpoints.xs}
                onChange={(e) => onConfigChange('breakpoints', { xs: parseInt(e.target.value) })}
                className="h-7 text-xs"
                min="1"
                max="12"
              />
            </div>

            {/* XXS */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-xs font-medium text-gray-600">XXS {`(<480px)`}</label>
              <Input
                type="number"
                value={canvasConfig.breakpoints.xxs}
                onChange={(e) => onConfigChange('breakpoints', { xxs: parseInt(e.target.value) })}
                className="h-7 text-xs"
                min="1"
                max="6"
              />
            </div>
          </div>

          {/* Canvas Styling Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Palette className="w-3 h-3" />
              <span>Estilo</span>
            </div>
            
            {/* Border Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="border-radius" className="text-xs font-medium text-gray-600">Border Radius</label>
                <span className="text-xs text-gray-500">{canvasConfig.borderRadius}px</span>
              </div>
              <Slider
                id="border-radius"
                value={[canvasConfig.borderRadius]}
                onValueChange={(value) => onConfigChange('borderRadius', value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0px</span>
                <span>50px</span>
              </div>
            </div>

            {/* Box Shadow */}
            <div className="flex items-center justify-between">
              <label htmlFor="box-shadow" className="text-xs font-medium text-gray-600">Box Shadow</label>
              <Switch
                id="box-shadow"
                checked={canvasConfig.boxShadow}
                onCheckedChange={(checked) => onConfigChange('boxShadow', checked)}
              />
            </div>

            {/* Overflow */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="overflow" className="text-xs font-medium text-gray-600">Overflow</label>
              <Select
                value={canvasConfig.overflow}
                onValueChange={(value) => onConfigChange('overflow', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Visível</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Preview do Canvas</label>
            <div 
              className="border border-gray-200 rounded overflow-hidden p-4 text-center text-xs text-gray-500"
              style={{
                backgroundColor: canvasConfig.backgroundColor,
                borderRadius: `${canvasConfig.borderRadius}px`,
                boxShadow: canvasConfig.boxShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                overflow: canvasConfig.overflow,
                minHeight: '60px'
              }}
            >
              Canvas {canvasConfig.canvasMode} • {canvasConfig.breakpoints.lg} colunas • {canvasConfig.rowHeight}px rows
            </div>
          </div>

        </div>
      )}
    </div>
  )
}