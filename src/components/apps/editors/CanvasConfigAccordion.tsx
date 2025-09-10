'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Palette, Monitor, Grid, Settings, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { CanvasConfig } from '@/types/apps/canvas'
import { getBlendModeDisplayName } from '@/utils/backgroundEffects'
import { canvasHistoryActions } from '@/stores/apps/canvasHistoryStore'

interface CanvasConfigAccordionProps {
  canvasConfig: CanvasConfig
  onConfigChange: (key: string, value: string | number | boolean | [number, number] | Partial<CanvasConfig['breakpoints']>) => void
  onCanvasConfigSet: (config: CanvasConfig) => void
}

export default function CanvasConfigAccordion({
  canvasConfig,
  onConfigChange,
  onCanvasConfigSet
}: CanvasConfigAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleUndo = () => {
    const previousConfig = canvasHistoryActions.undo()
    if (previousConfig) {
      onCanvasConfigSet(previousConfig)
    }
  }

  const handleRedo = () => {
    const nextConfig = canvasHistoryActions.redo()
    if (nextConfig) {
      onCanvasConfigSet(nextConfig)
    }
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when Canvas Config accordion is open
      if (!isOpen) return

      // Ctrl+Z for undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      }
      
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if ((event.ctrlKey && event.key === 'y') || 
          (event.ctrlKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault()
        handleRedo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen]) // Re-add listener when accordion opens/closes

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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canvasHistoryActions.canUndo()}
            className="h-7 w-7 p-0"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canvasHistoryActions.canRedo()}
            className="h-7 w-7 p-0"
            title="Refazer (Ctrl+Y)"
          >
            <Redo className="w-3 h-3" />
          </Button>
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

            {/* Background Image */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="bg-image" className="text-xs font-medium text-gray-600">Imagem de Fundo</label>
              <Input
                id="bg-image"
                type="url"
                value={canvasConfig.backgroundImage || ''}
                onChange={(e) => onConfigChange('backgroundImage', e.target.value)}
                className="h-7 text-xs"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Background Size - só aparece se tiver imagem */}
            {canvasConfig.backgroundImage && (
              <>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-xs font-medium text-gray-600">Tamanho</label>
                  <Select
                    value={canvasConfig.backgroundSize}
                    onValueChange={(value) => onConfigChange('backgroundSize', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cobrir</SelectItem>
                      <SelectItem value="contain">Conter</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="stretch">Esticar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-xs font-medium text-gray-600">Posição</label>
                  <Select
                    value={canvasConfig.backgroundPosition}
                    onValueChange={(value) => onConfigChange('backgroundPosition', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="top">Topo</SelectItem>
                      <SelectItem value="bottom">Baixo</SelectItem>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-xs font-medium text-gray-600">Repetição</label>
                  <Select
                    value={canvasConfig.backgroundRepeat}
                    onValueChange={(value) => onConfigChange('backgroundRepeat', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-repeat">Não repetir</SelectItem>
                      <SelectItem value="repeat">Repetir</SelectItem>
                      <SelectItem value="repeat-x">Repetir X</SelectItem>
                      <SelectItem value="repeat-y">Repetir Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Background Effects */}
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span>Efeitos de Fundo</span>
              </div>
              
              {/* Effect Type */}
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-xs font-medium text-gray-600">Efeito</label>
                <Select
                  value={canvasConfig.backgroundEffect || 'none'}
                  onValueChange={(value) => onConfigChange('backgroundEffect', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="noise">Ruído</SelectItem>
                    <SelectItem value="grain">Granulado</SelectItem>
                    <SelectItem value="dots">Pontos</SelectItem>
                    <SelectItem value="subtle-texture">Textura Sutil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional fields - only show if effect is not 'none' */}
              {canvasConfig.backgroundEffect && canvasConfig.backgroundEffect !== 'none' && (
                <>
                  {/* Effect Opacity */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600">Opacidade</label>
                      <span className="text-xs text-gray-500">{canvasConfig.backgroundEffectOpacity || 10}%</span>
                    </div>
                    <Slider
                      value={[canvasConfig.backgroundEffectOpacity || 10]}
                      onValueChange={(value) => onConfigChange('backgroundEffectOpacity', value[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>1%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Effect Size */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <label className="text-xs font-medium text-gray-600">Tamanho</label>
                    <Select
                      value={canvasConfig.backgroundEffectSize || 'medium'}
                      onValueChange={(value) => onConfigChange('backgroundEffectSize', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Blend Modes */}
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span>Modo de Mistura</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-xs font-medium text-gray-600">Blend Mode</label>
                <Select
                  value={canvasConfig.backgroundBlendMode || 'normal'}
                  onValueChange={(value) => onConfigChange('backgroundBlendMode', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="multiply">Multiplicar</SelectItem>
                    <SelectItem value="screen">Clarear</SelectItem>
                    <SelectItem value="overlay">Sobrepor</SelectItem>
                    <SelectItem value="soft-light">Luz Suave</SelectItem>
                    <SelectItem value="hard-light">Luz Forte</SelectItem>
                    <SelectItem value="color-dodge">Subexposição</SelectItem>
                    <SelectItem value="color-burn">Superexposição</SelectItem>
                    <SelectItem value="darken">Escurecer</SelectItem>
                    <SelectItem value="lighten">Clarear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gradientes */}
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span>Gradientes</span>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">Habilitar Gradiente</label>
                <Switch
                  checked={canvasConfig.gradientEnabled || false}
                  onCheckedChange={(checked) => onConfigChange('gradientEnabled', checked)}
                />
              </div>

              {canvasConfig.gradientEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <label className="text-xs font-medium text-gray-600">Tipo</label>
                    <Select
                      value={canvasConfig.gradientType || 'linear'}
                      onValueChange={(value) => onConfigChange('gradientType', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="conic">Cônico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600">Direção</label>
                      <span className="text-xs text-gray-500">{canvasConfig.gradientDirection || 45}°</span>
                    </div>
                    <Slider
                      value={[canvasConfig.gradientDirection || 45]}
                      onValueChange={(value) => onConfigChange('gradientDirection', value[0])}
                      min={0}
                      max={360}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Cor 1</label>
                      <Input
                        type="color"
                        value={canvasConfig.gradientColors?.[0] || '#3b82f6'}
                        onChange={(e) => {
                          const newColors = [...(canvasConfig.gradientColors || ['#3b82f6', '#8b5cf6'])]
                          newColors[0] = e.target.value
                          onConfigChange('gradientColors', newColors)
                        }}
                        className="h-7 w-full p-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Cor 2</label>
                      <Input
                        type="color"
                        value={canvasConfig.gradientColors?.[1] || '#8b5cf6'}
                        onChange={(e) => {
                          const newColors = [...(canvasConfig.gradientColors || ['#3b82f6', '#8b5cf6'])]
                          newColors[1] = e.target.value
                          onConfigChange('gradientColors', newColors)
                        }}
                        className="h-7 w-full p-1 border rounded"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filtros CSS */}
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span>Filtros CSS</span>
              </div>
              
              {/* Blur */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Desfoque</label>
                  <span className="text-xs text-gray-500">{canvasConfig.blur || 0}px</span>
                </div>
                <Slider
                  value={[canvasConfig.blur || 0]}
                  onValueChange={(value) => onConfigChange('blur', value[0])}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Brilho</label>
                  <span className="text-xs text-gray-500">{canvasConfig.brightness || 100}%</span>
                </div>
                <Slider
                  value={[canvasConfig.brightness || 100]}
                  onValueChange={(value) => onConfigChange('brightness', value[0])}
                  min={50}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Contraste</label>
                  <span className="text-xs text-gray-500">{canvasConfig.contrast || 100}%</span>
                </div>
                <Slider
                  value={[canvasConfig.contrast || 100]}
                  onValueChange={(value) => onConfigChange('contrast', value[0])}
                  min={50}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Saturate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Saturação</label>
                  <span className="text-xs text-gray-500">{canvasConfig.saturate || 100}%</span>
                </div>
                <Slider
                  value={[canvasConfig.saturate || 100]}
                  onValueChange={(value) => onConfigChange('saturate', value[0])}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Hue Rotate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Matiz</label>
                  <span className="text-xs text-gray-500">{canvasConfig.hueRotate || 0}°</span>
                </div>
                <Slider
                  value={[canvasConfig.hueRotate || 0]}
                  onValueChange={(value) => onConfigChange('hueRotate', value[0])}
                  min={0}
                  max={360}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Sepia */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Sépia</label>
                  <span className="text-xs text-gray-500">{canvasConfig.sepia || 0}%</span>
                </div>
                <Slider
                  value={[canvasConfig.sepia || 0]}
                  onValueChange={(value) => onConfigChange('sepia', value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
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
                  value={typeof canvasConfig.responsiveHeight === 'number' ? canvasConfig.responsiveHeight : 900}
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