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

interface KPISubtitleAccordionProps {
  styling: KPIConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function KPISubtitleAccordion({ 
  styling, 
  onConfigChange 
}: KPISubtitleAccordionProps) {

  // Verificação de segurança
  if (!onConfigChange) {
    console.warn('KPISubtitleAccordion: onConfigChange callback is missing')
    return null
  }

  return (
    <AccordionItem value="kpi-subtitle" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        🏷️ Subtítulo (Nome/Label)
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Typography */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Tipografia</div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Tamanho: {styling?.nameFontSize ?? 14}px
              </div>
              <Slider
                value={[styling?.nameFontSize ?? 14]}
                onValueChange={(value) => onConfigChange('nameFontSize', value[0])}
                max={32}
                min={8}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Peso</div>
              <Select
                value={String(styling?.nameFontWeight ?? 500)}
                onValueChange={(value) => onConfigChange('nameFontWeight', parseInt(value))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semi Bold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Família</div>
              <Select
                value={styling?.nameFontFamily ?? 'inherit'}
                onValueChange={(value) => onConfigChange('nameFontFamily', value)}
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
              value={styling?.nameColor || '#6b7280'}
              onChange={(e) => onConfigChange('nameColor', e.target.value)}
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
                Margin Top: {(styling as Record<string, unknown>)?.subtitleMarginTop ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.subtitleMarginTop as number) ?? 0]}
                onValueChange={(value) => onConfigChange('subtitleMarginTop', value[0])}
                max={40}
                min={0}
                step={2}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Margin Bottom: {(styling as Record<string, unknown>)?.subtitleMarginBottom ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.subtitleMarginBottom as number) ?? 0]}
                onValueChange={(value) => onConfigChange('subtitleMarginBottom', value[0])}
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
                Espaçamento das Letras: {(styling as Record<string, unknown>)?.subtitleLetterSpacing ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.subtitleLetterSpacing as number) ?? 0]}
                onValueChange={(value) => onConfigChange('subtitleLetterSpacing', value[0])}
                max={3}
                min={-1}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Altura da Linha: {(styling as Record<string, unknown>)?.subtitleLineHeight ?? 1.4}
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.subtitleLineHeight as number) ?? 1.4]}
                onValueChange={(value) => onConfigChange('subtitleLineHeight', value[0])}
                max={2}
                min={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Alinhamento do Subtítulo</div>
          
          <div className="flex gap-1">
            {[
              { value: 'left', icon: '⬅️', label: 'Esquerda' },
              { value: 'center', icon: '⬆️', label: 'Centro' },
              { value: 'right', icon: '➡️', label: 'Direita' }
            ].map((align) => (
              <button
                key={align.value}
                onClick={() => onConfigChange('subtitleAlign', align.value)}
                className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                  ((styling as Record<string, unknown>)?.subtitleAlign ?? 'left') === align.value
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