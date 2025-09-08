'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Type, Palette, Spacing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface TableHeaderAccordionProps {
  headerFontSize?: number
  headerFontFamily?: string
  headerFontWeight?: string
  headerTextColor?: string
  headerBackground?: string
  padding?: number
  onConfigChange: (key: string, value: any) => void
}

export default function TableHeaderAccordion({
  headerFontSize = 14,
  headerFontFamily = 'inherit',
  headerFontWeight = 'medium',
  headerTextColor = '#6b7280',
  headerBackground = '#ffffff',
  padding = 16,
  onConfigChange
}: TableHeaderAccordionProps) {
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
          <span className="font-medium">Cabeçalho da Tabela</span>
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
              <Label htmlFor="header-font-size" className="text-xs">Tamanho da Fonte</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="header-font-size"
                  type="number"
                  value={headerFontSize}
                  onChange={(e) => onConfigChange('headerFontSize', parseInt(e.target.value))}
                  className="h-7 text-xs"
                  min="8"
                  max="32"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>

            {/* Font Family */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label htmlFor="header-font-family" className="text-xs">Fonte</Label>
              <Select
                value={headerFontFamily}
                onValueChange={(value) => onConfigChange('headerFontFamily', value)}
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
              <Label htmlFor="header-font-weight" className="text-xs">Peso da Fonte</Label>
              <Select
                value={headerFontWeight}
                onValueChange={(value) => onConfigChange('headerFontWeight', value)}
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
              <Label htmlFor="header-text-color" className="text-xs">Cor do Texto</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="header-text-color"
                  type="color"
                  value={headerTextColor}
                  onChange={(e) => onConfigChange('headerTextColor', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={headerTextColor}
                  onChange={(e) => onConfigChange('headerTextColor', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#6b7280"
                />
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Palette className="w-3 h-3" />
              <span>Cores</span>
            </div>
            
            {/* Background Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label htmlFor="header-background" className="text-xs">Cor de Fundo</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="header-background"
                  type="color"
                  value={headerBackground}
                  onChange={(e) => onConfigChange('headerBackground', e.target.value)}
                  className="h-7 w-16 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={headerBackground}
                  onChange={(e) => onConfigChange('headerBackground', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {/* Spacing Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Spacing className="w-3 h-3" />
              <span>Espaçamento</span>
            </div>
            
            {/* Padding */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="header-padding" className="text-xs">Padding</Label>
                <span className="text-xs text-gray-500">{padding}px</span>
              </div>
              <Slider
                id="header-padding"
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

          {/* Preview Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Preview</Label>
            <div 
              className="border border-gray-200 rounded p-2 text-center"
              style={{
                fontSize: `${headerFontSize}px`,
                fontFamily: headerFontFamily !== 'inherit' ? headerFontFamily : undefined,
                fontWeight: headerFontWeight !== 'normal' ? headerFontWeight : undefined,
                color: headerTextColor,
                backgroundColor: headerBackground,
                padding: `${padding}px`,
              }}
            >
              Título da Coluna
            </div>
          </div>
        </div>
      )}
    </div>
  )
}