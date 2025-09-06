'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { KPIConfig } from '@/types/apps/kpiWidgets'

interface KPITitleAccordionProps {
  styling: KPIConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function KPITitleAccordion({ 
  styling, 
  onConfigChange 
}: KPITitleAccordionProps) {

  // Verificação de segurança
  if (!onConfigChange) {
    console.warn('KPITitleAccordion: onConfigChange callback is missing')
    return null
  }

  return (
    <AccordionItem value="kpi-title" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        📝 Título (Valor Principal)
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Typography */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Tipografia</div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Tamanho: {styling?.valueFontSize ?? 36}px
              </div>
              <Slider
                value={[styling?.valueFontSize ?? 36]}
                onValueChange={(value) => onConfigChange('valueFontSize', value[0])}
                max={80}
                min={12}
                step={2}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Peso</div>
              <Select
                value={String(styling?.valueFontWeight ?? 700)}
                onValueChange={(value) => onConfigChange('valueFontWeight', parseInt(value))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Normal</SelectItem>
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
                value={styling?.valueFontFamily ?? 'inherit'}
                onValueChange={(value) => onConfigChange('valueFontFamily', value)}
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

        {/* Color */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Cor</div>
          
          <div>
            <div className="text-xs text-gray-500 mb-1">Cor do Texto</div>
            <input
              type="color"
              value={styling?.valueColor || '#1f2937'}
              onChange={(e) => onConfigChange('valueColor', e.target.value)}
              className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Espaçamento</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Margin Top: {(styling as Record<string, unknown>)?.titleMarginTop ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.titleMarginTop as number) ?? 0]}
                onValueChange={(value) => onConfigChange('titleMarginTop', value[0])}
                max={40}
                min={0}
                step={2}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Margin Bottom: {(styling as Record<string, unknown>)?.titleMarginBottom ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.titleMarginBottom as number) ?? 0]}
                onValueChange={(value) => onConfigChange('titleMarginBottom', value[0])}
                max={40}
                min={0}
                step={2}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Efeitos</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Espaçamento das Letras: {(styling as Record<string, unknown>)?.titleLetterSpacing ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.titleLetterSpacing as number) ?? 0]}
                onValueChange={(value) => onConfigChange('titleLetterSpacing', value[0])}
                max={5}
                min={-2}
                step={0.5}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Altura da Linha: {(styling as Record<string, unknown>)?.titleLineHeight ?? 1.2}
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.titleLineHeight as number) ?? 1.2]}
                onValueChange={(value) => onConfigChange('titleLineHeight', value[0])}
                max={2}
                min={0.8}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Alinhamento do Título</div>
          
          <div className="flex gap-1">
            {[
              { value: 'left', icon: '⬅️', label: 'Esquerda' },
              { value: 'center', icon: '⬆️', label: 'Centro' },
              { value: 'right', icon: '➡️', label: 'Direita' }
            ].map((align) => (
              <button
                key={align.value}
                onClick={() => onConfigChange('titleAlign', align.value)}
                className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                  ((styling as Record<string, unknown>)?.titleAlign ?? 'left') === align.value
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{align.icon}</span>
                {align.label}
              </button>
            ))}
          </div>
        </div>

      </AccordionContent>
    </AccordionItem>
  )
}