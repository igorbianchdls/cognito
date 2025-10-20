'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TableConfig } from '@/types/apps/tableWidgets'

interface TableTypographyAccordionProps {
  styling: TableConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function TableTypographyAccordion({ 
  styling, 
  onConfigChange 
}: TableTypographyAccordionProps) {

  return (
    <AccordionItem value="table-typography" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        ✍️ Tipografia
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Header Typography */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Tipografia do Cabeçalho</div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">Tamanho</div>
              <div className="text-xs text-gray-500 mb-1">{styling?.headerFontSize || 14}px</div>
              <Slider
                value={[styling?.headerFontSize || 14]}
                onValueChange={(value) => onConfigChange('headerFontSize', value[0])}
                max={20}
                min={10}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Peso</div>
              <Select
                value={styling?.headerFontWeight || 'normal'}
                onValueChange={(value) => onConfigChange('headerFontWeight', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semi Bold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                  <SelectItem value="800">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Família</div>
              <Select
                value={styling?.headerFontFamily || 'inherit'}
                onValueChange={(value) => onConfigChange('headerFontFamily', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Padrão</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="Geist, sans-serif">Geist</SelectItem>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cell Typography */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Tipografia das Células</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Tamanho</div>
              <div className="text-xs text-gray-500 mb-1">{styling?.cellFontSize || styling?.fontSize || 14}px</div>
              <Slider
                value={[styling?.cellFontSize || styling?.fontSize || 14]}
                onValueChange={(value) => onConfigChange('cellFontSize', value[0])}
                max={18}
                min={10}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Cor do Texto</div>
              <input
                type="color"
                value={styling?.cellTextColor || '#1f2937'}
                onChange={(e) => onConfigChange('cellTextColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Peso</div>
              <Select
                value={styling?.cellFontWeight || 'normal'}
                onValueChange={(value) => onConfigChange('cellFontWeight', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semi Bold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Família</div>
              <Select
                value={styling?.cellFontFamily || 'inherit'}
                onValueChange={(value) => onConfigChange('cellFontFamily', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Padrão</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="Geist, sans-serif">Geist</SelectItem>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Line Height & Letter Spacing */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Espaçamento</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Altura da Linha: {styling?.lineHeight || 1.4}
              </div>
              <Slider
                value={[styling?.lineHeight || 1.4]}
                onValueChange={(value) => onConfigChange('lineHeight', value[0])}
                max={2}
                min={1}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Espaçamento das Letras: {styling?.letterSpacing || 0}px
              </div>
              <Slider
                value={[styling?.letterSpacing || 0]}
                onValueChange={(value) => onConfigChange('letterSpacing', value[0])}
                max={2}
                min={-1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Alinhamento Padrão</div>
          <Select
            value={styling?.defaultTextAlign || 'left'}
            onValueChange={(value) => onConfigChange('defaultTextAlign', value)}
          >
            <SelectTrigger className="h-8">
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

      </AccordionContent>
    </AccordionItem>
  )
}