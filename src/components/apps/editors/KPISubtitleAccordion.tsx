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
                Tamanho: {styling?.kpiNameFontSize ?? 14}px
              </div>
              <Slider
                value={[styling?.kpiNameFontSize ?? 14]}
                onValueChange={(value) => onConfigChange('kpiNameFontSize', value[0])}
                max={32}
                min={8}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Peso</div>
              <Select
                value={String(styling?.kpiNameFontWeight ?? 500)}
                onValueChange={(value) => onConfigChange('kpiNameFontWeight', parseInt(value))}
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
                value={styling?.kpiNameFontFamily ?? 'inherit'}
                onValueChange={(value) => onConfigChange('kpiNameFontFamily', value)}
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
              value={styling?.kpiNameColor || '#6b7280'}
              onChange={(e) => onConfigChange('kpiNameColor', e.target.value)}
              className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Espaçamento</div>

          {/* Margins */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Margem</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Top: {((styling as Record<string, unknown>)?.kpiNameMarginTop as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNameMarginTop as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNameMarginTop', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {((styling as Record<string, unknown>)?.kpiNameMarginRight as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNameMarginRight as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNameMarginRight', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {((styling as Record<string, unknown>)?.kpiNameMarginBottom as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNameMarginBottom as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNameMarginBottom', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {((styling as Record<string, unknown>)?.kpiNameMarginLeft as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNameMarginLeft as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNameMarginLeft', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Paddings */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Padding</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Top: {((styling as Record<string, unknown>)?.kpiNamePaddingTop as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNamePaddingTop as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNamePaddingTop', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {((styling as Record<string, unknown>)?.kpiNamePaddingRight as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNamePaddingRight as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNamePaddingRight', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {((styling as Record<string, unknown>)?.kpiNamePaddingBottom as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNamePaddingBottom as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNamePaddingBottom', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {((styling as Record<string, unknown>)?.kpiNamePaddingLeft as number) ?? 0}px
                </div>
                <Slider
                  value={[((styling as Record<string, unknown>)?.kpiNamePaddingLeft as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('kpiNamePaddingLeft', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Efeitos</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Espaçamento das Letras: {((styling as Record<string, unknown>)?.kpiNameLetterSpacing as number) ?? 0}px
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.kpiNameLetterSpacing as number) ?? 0]}
                onValueChange={(value) => onConfigChange('kpiNameLetterSpacing', value[0])}
                max={3}
                min={-1}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Altura da Linha: {((styling as Record<string, unknown>)?.kpiNameLineHeight as number) ?? 1.4}
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.kpiNameLineHeight as number) ?? 1.4]}
                onValueChange={(value) => onConfigChange('kpiNameLineHeight', value[0])}
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
                onClick={() => onConfigChange('kpiNameAlign', align.value)}
                className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                  ((styling as Record<string, unknown>)?.kpiNameAlign ?? 'left') === align.value
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

        {/* Tailwind CSS */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">🎨 Tailwind CSS (Precedência Total)</div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Classes Tailwind para o Subtítulo/Nome
            </label>
            <input
              type="text"
              value={((styling as Record<string, unknown>)?.kpiNameClassName as string) || ''}
              onChange={(e) => onConfigChange('kpiNameClassName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="text-sm font-medium text-gray-600 mb-2"
            />
            <div className="text-xs text-gray-400 mt-1">
              Se preenchido, sobrescreve todas as configurações acima
            </div>
          </div>
        </div>

      </AccordionContent>
    </AccordionItem>
  )
}