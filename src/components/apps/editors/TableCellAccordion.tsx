'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Type, Palette, Move, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface TableCellAccordionProps {
  // Typography
  cellFontSize?: number
  fontSize?: number // backward compatibility
  cellFontFamily?: string
  cellFontWeight?: string
  cellTextColor?: string
  lineHeight?: number
  letterSpacing?: number
  defaultTextAlign?: 'left' | 'center' | 'right' | 'justify'
  
  // Spacing
  padding?: number
  
  // Colors and States
  rowHoverColor?: string
  editingCellColor?: string
  validationErrorColor?: string
  modifiedCellColor?: string
  newRowColor?: string
  
  // Borders
  borderColor?: string
  
  onConfigChange: (key: string, value: string | number) => void
}

export default function TableCellAccordion({
  cellFontSize = 14,
  fontSize = 14,
  cellFontFamily = 'inherit',
  cellFontWeight = 'normal',
  cellTextColor = '#374151',
  lineHeight = 1.5,
  letterSpacing = 0,
  defaultTextAlign = 'left',
  padding = 16,
  rowHoverColor = '#f9fafb',
  editingCellColor = '#fef3c7',
  validationErrorColor = '#fef2f2',
  modifiedCellColor = '#f0f9ff',
  newRowColor = '#f0fdf4',
  borderColor = '#e5e7eb',
  onConfigChange
}: TableCellAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Use cellFontSize if available, fallback to fontSize
  const effectiveFontSize = cellFontSize || fontSize

  return (
    <div className="border border-gray-200 rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 h-auto font-normal"
      >
        <div className="flex items-center gap-2">
          <Square className="w-4 h-4 text-green-500" />
          <span className="font-medium">Células da Tabela</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
          {/* Typography Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="w-3 h-3" />
              <span>Tipografia</span>
            </div>
            
            {/* Font Size */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="cell-font-size" className="text-xs font-medium text-gray-600">Tamanho da Fonte</label>
              <div className="flex items-center gap-1">
                <Input
                  id="cell-font-size"
                  type="number"
                  value={effectiveFontSize}
                  onChange={(e) => onConfigChange('cellFontSize', parseInt(e.target.value))}
                  className="h-7 text-xs"
                  min="8"
                  max="32"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>

            {/* Font Family */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="cell-font-family" className="text-xs font-medium text-gray-600">Fonte</label>
              <Select
                value={cellFontFamily}
                onValueChange={(value) => onConfigChange('cellFontFamily', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Padrão</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Weight */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="cell-font-weight" className="text-xs font-medium text-gray-600">Peso da Fonte</label>
              <Select
                value={cellFontWeight}
                onValueChange={(value) => onConfigChange('cellFontWeight', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="cell-text-color" className="text-xs font-medium text-gray-600">Cor do Texto</label>
              <div className="flex items-center gap-1">
                <Input
                  id="cell-text-color"
                  type="color"
                  value={cellTextColor}
                  onChange={(e) => onConfigChange('cellTextColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={cellTextColor}
                  onChange={(e) => onConfigChange('cellTextColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#374151"
                />
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="line-height" className="text-xs font-medium text-gray-600">Altura da Linha</label>
                <span className="text-xs text-gray-500">{lineHeight}</span>
              </div>
              <Slider
                id="line-height"
                value={[lineHeight]}
                onValueChange={(value) => onConfigChange('lineHeight', value[0])}
                min={0.8}
                max={3}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0.8</span>
                <span>3.0</span>
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="letter-spacing" className="text-xs font-medium text-gray-600">Espaçamento das Letras</label>
                <span className="text-xs text-gray-500">{letterSpacing}px</span>
              </div>
              <Slider
                id="letter-spacing"
                value={[letterSpacing]}
                onValueChange={(value) => onConfigChange('letterSpacing', value[0])}
                min={-2}
                max={5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>-2px</span>
                <span>5px</span>
              </div>
            </div>

            {/* Text Align */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="text-align" className="text-xs font-medium text-gray-600">Alinhamento</label>
              <Select
                value={defaultTextAlign}
                onValueChange={(value) => onConfigChange('defaultTextAlign', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                  <SelectItem value="justify">Justificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Palette className="w-3 h-3" />
              <span>Cores e Estados</span>
            </div>
            
            {/* Row Hover Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="row-hover-color" className="text-xs font-medium text-gray-600">Cor do Hover</label>
              <div className="flex items-center gap-1">
                <Input
                  id="row-hover-color"
                  type="color"
                  value={rowHoverColor}
                  onChange={(e) => onConfigChange('rowHoverColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={rowHoverColor}
                  onChange={(e) => onConfigChange('rowHoverColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#f9fafb"
                />
              </div>
            </div>

            {/* Editing Cell Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="editing-cell-color" className="text-xs font-medium text-gray-600">Cor de Edição</label>
              <div className="flex items-center gap-1">
                <Input
                  id="editing-cell-color"
                  type="color"
                  value={editingCellColor}
                  onChange={(e) => onConfigChange('editingCellColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={editingCellColor}
                  onChange={(e) => onConfigChange('editingCellColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#fef3c7"
                />
              </div>
            </div>

            {/* Modified Cell Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="modified-cell-color" className="text-xs font-medium text-gray-600">Cor Modificada</label>
              <div className="flex items-center gap-1">
                <Input
                  id="modified-cell-color"
                  type="color"
                  value={modifiedCellColor}
                  onChange={(e) => onConfigChange('modifiedCellColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={modifiedCellColor}
                  onChange={(e) => onConfigChange('modifiedCellColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#f0f9ff"
                />
              </div>
            </div>

            {/* Validation Error Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="validation-error-color" className="text-xs font-medium text-gray-600">Cor de Erro</label>
              <div className="flex items-center gap-1">
                <Input
                  id="validation-error-color"
                  type="color"
                  value={validationErrorColor}
                  onChange={(e) => onConfigChange('validationErrorColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={validationErrorColor}
                  onChange={(e) => onConfigChange('validationErrorColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#fef2f2"
                />
              </div>
            </div>

            {/* New Row Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="new-row-color" className="text-xs font-medium text-gray-600">Cor Nova Linha</label>
              <div className="flex items-center gap-1">
                <Input
                  id="new-row-color"
                  type="color"
                  value={newRowColor}
                  onChange={(e) => onConfigChange('newRowColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={newRowColor}
                  onChange={(e) => onConfigChange('newRowColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#f0fdf4"
                />
              </div>
            </div>
          </div>

          {/* Spacing Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Move className="w-3 h-3" />
              <span>Espaçamento</span>
            </div>
            
            {/* Padding */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="cell-padding" className="text-xs font-medium text-gray-600">Padding das Células</label>
                <span className="text-xs text-gray-500">{padding}px</span>
              </div>
              <Slider
                id="cell-padding"
                value={[padding]}
                onValueChange={(value) => onConfigChange('padding', value[0])}
                min={0}
                max={32}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0px</span>
                <span>32px</span>
              </div>
            </div>
          </div>

          {/* Borders Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Square className="w-3 h-3" />
              <span>Bordas</span>
            </div>
            
            {/* Border Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="border-color" className="text-xs font-medium text-gray-600">Cor da Borda</label>
              <div className="flex items-center gap-1">
                <Input
                  id="border-color"
                  type="color"
                  value={borderColor}
                  onChange={(e) => onConfigChange('borderColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={borderColor}
                  onChange={(e) => onConfigChange('borderColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#e5e7eb"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Preview</label>
            <div className="border border-gray-200 rounded overflow-hidden">
              <div 
                className="p-2 text-center border-b"
                style={{
                  fontSize: `${effectiveFontSize}px`,
                  fontFamily: cellFontFamily !== 'inherit' ? cellFontFamily : undefined,
                  fontWeight: cellFontWeight !== 'normal' ? cellFontWeight : undefined,
                  color: cellTextColor,
                  lineHeight: lineHeight,
                  letterSpacing: `${letterSpacing}px`,
                  textAlign: defaultTextAlign,
                  padding: `${padding}px`,
                  borderColor: borderColor,
                }}
              >
                Texto da Célula
              </div>
              <div 
                className="p-1 text-xs text-center"
                style={{ backgroundColor: rowHoverColor }}
              >
                Estado Hover
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}