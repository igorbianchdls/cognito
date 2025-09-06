'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import type { TableConfig } from '@/types/apps/tableWidgets'

interface TableAppearanceAccordionProps {
  styling: TableConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function TableAppearanceAccordion({ 
  styling, 
  onConfigChange 
}: TableAppearanceAccordionProps) {

  return (
    <AccordionItem value="table-appearance" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        🎨 Aparência e Cores
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Header Colors */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Cores do Cabeçalho</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Fundo do Cabeçalho</div>
              <input
                type="color"
                value={styling?.headerBackground || '#f9fafb'}
                onChange={(e) => onConfigChange('headerBackground', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Texto do Cabeçalho</div>
              <input
                type="color"
                value={styling?.headerTextColor || '#374151'}
                onChange={(e) => onConfigChange('headerTextColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Row Colors */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Cores das Linhas</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Hover da Linha</div>
              <input
                type="color"
                value={styling?.rowHoverColor || '#f3f4f6'}
                onChange={(e) => onConfigChange('rowHoverColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Cor da Borda</div>
              <input
                type="color"
                value={styling?.borderColor || '#e5e7eb'}
                onChange={(e) => onConfigChange('borderColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Cell Padding */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">
            Padding das Células: {styling?.padding || 12}px
          </div>
          <Slider
            value={[styling?.padding || 12]}
            onValueChange={(value) => onConfigChange('padding', value[0])}
            max={24}
            min={4}
            step={2}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>4px</span>
            <span>24px</span>
          </div>
        </div>

        {/* Editing Colors (when editing is enabled) */}
        {styling?.editableMode && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700">Cores de Edição</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Célula em Edição</div>
                <input
                  type="color"
                  value={styling?.editingCellColor || '#dbeafe'}
                  onChange={(e) => onConfigChange('editingCellColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Erro de Validação</div>
                <input
                  type="color"
                  value={styling?.validationErrorColor || '#fee2e2'}
                  onChange={(e) => onConfigChange('validationErrorColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Célula Modificada</div>
                <input
                  type="color"
                  value={styling?.modifiedCellColor || '#fef3c7'}
                  onChange={(e) => onConfigChange('modifiedCellColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Nova Linha</div>
                <input
                  type="color"
                  value={styling?.newRowColor || '#ecfdf5'}
                  onChange={(e) => onConfigChange('newRowColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Border Styles */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Estilo de Borda</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Espessura: {styling?.borderWidth || 1}px</div>
              <Slider
                value={[styling?.borderWidth || 1]}
                onValueChange={(value) => onConfigChange('borderWidth', value[0])}
                max={5}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Raio da Borda: {styling?.borderRadius || 0}px</div>
              <Slider
                value={[styling?.borderRadius || 0]}
                onValueChange={(value) => onConfigChange('borderRadius', value[0])}
                max={12}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

      </AccordionContent>
    </AccordionItem>
  )
}