'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { KPIConfig } from '@/types/apps/kpiWidgets'

interface KPICardAccordionProps {
  styling: KPIConfig
  onConfigChange: (field: string, value: unknown) => void
}

export default function KPICardAccordion({ 
  styling, 
  onConfigChange 
}: KPICardAccordionProps) {

  // Verificação de segurança
  if (!onConfigChange) {
    console.warn('KPICardAccordion: onConfigChange callback is missing')
    return null
  }

  return (
    <AccordionItem value="kpi-card" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        🃏 Card
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Background */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Fundo</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Cor de Fundo</div>
              <input
                type="color"
                value={styling?.kpiContainerBackgroundColor || '#ffffff'}
                onChange={(e) => onConfigChange('kpiContainerBackgroundColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Opacidade: {Math.round(((styling as Record<string, unknown>)?.kpiContainerBackgroundOpacity as number ?? 1) * 100)}%
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.kpiContainerBackgroundOpacity as number) ?? 1]}
                onValueChange={(value) => onConfigChange('kpiContainerBackgroundOpacity', value[0])}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Border */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Borda</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Cor da Borda</div>
              <input
                type="color"
                value={styling?.kpiContainerBorderColor || '#e5e7eb'}
                onChange={(e) => onConfigChange('kpiContainerBorderColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Opacidade: {Math.round(((styling as Record<string, unknown>)?.kpiContainerBorderOpacity as number ?? 1) * 100)}%
              </div>
              <Slider
                value={[((styling as Record<string, unknown>)?.kpiContainerBorderOpacity as number) ?? 1]}
                onValueChange={(value) => onConfigChange('kpiContainerBorderOpacity', value[0])}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Largura: {styling?.kpiContainerBorderWidth ?? 1}px
              </div>
              <Slider
                value={[styling?.kpiContainerBorderWidth ?? 1]}
                onValueChange={(value) => onConfigChange('kpiContainerBorderWidth', value[0])}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Arredondamento: {styling?.kpiContainerBorderRadius ?? 8}px
              </div>
              <Slider
                value={[styling?.kpiContainerBorderRadius ?? 8]}
                onValueChange={(value) => onConfigChange('kpiContainerBorderRadius', value[0])}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Sombra</div>
          
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={styling?.kpiContainerShadow ?? false}
              onCheckedChange={(checked) => onConfigChange('kpiContainerShadow', checked)}
            />
            <span className="text-gray-600">Habilitar sombra</span>
          </label>
        </div>

        {/* Layout & Spacing */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Layout</div>
          
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Padding: {styling?.kpiContainerPadding ?? 16}px
            </div>
            <Slider
              value={[styling?.kpiContainerPadding ?? 16]}
              onValueChange={(value) => onConfigChange('kpiContainerPadding', value[0])}
              max={50}
              min={0}
              step={2}
              className="w-full"
            />
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Alinhamento</div>
          
          <div className="flex gap-1">
            {[
              { value: 'left', icon: '⬅️', label: 'Esquerda' },
              { value: 'center', icon: '⬆️', label: 'Centro' },
              { value: 'right', icon: '➡️', label: 'Direita' }
            ].map((align) => (
              <button
                key={align.value}
                onClick={() => onConfigChange('kpiContainerTextAlign', align.value)}
                className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                  (styling?.kpiContainerTextAlign ?? 'left') === align.value
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