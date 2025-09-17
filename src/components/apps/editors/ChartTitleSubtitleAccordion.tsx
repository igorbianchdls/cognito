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

interface ChartTitleSubtitleAccordionProps {
  styling: Record<string, unknown>
  onConfigChange: (field: string, value: unknown) => void
}

export default function ChartTitleSubtitleAccordion({
  styling,
  onConfigChange
}: ChartTitleSubtitleAccordionProps) {

  // Verificação de segurança
  if (!onConfigChange) {
    console.warn('ChartTitleSubtitleAccordion: onConfigChange callback is missing')
    return null
  }

  return (
    <AccordionItem value="chart-title-subtitle" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        📝 Título e Subtítulo - Espaçamento
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">

        {/* Title Spacing */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Título - Espaçamento</div>

          {/* Title Margins */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Margem do Título</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Top: {(styling?.titleMarginTop as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titleMarginTop as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titleMarginTop', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {(styling?.titleMarginRight as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titleMarginRight as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titleMarginRight', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {(styling?.titleMarginBottom as number) ?? 4}px
                </div>
                <Slider
                  value={[(styling?.titleMarginBottom as number) ?? 4]}
                  onValueChange={(value) => onConfigChange('titleMarginBottom', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {(styling?.titleMarginLeft as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titleMarginLeft as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titleMarginLeft', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Title Paddings */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Padding do Título</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Top: {(styling?.titlePaddingTop as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titlePaddingTop as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titlePaddingTop', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {(styling?.titlePaddingRight as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titlePaddingRight as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titlePaddingRight', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {(styling?.titlePaddingBottom as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titlePaddingBottom as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titlePaddingBottom', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {(styling?.titlePaddingLeft as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.titlePaddingLeft as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('titlePaddingLeft', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle Spacing */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Subtítulo - Espaçamento</div>

          {/* Subtitle Margins */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Margem do Subtítulo</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Top: {(styling?.subtitleMarginTop as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitleMarginTop as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitleMarginTop', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {(styling?.subtitleMarginRight as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitleMarginRight as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitleMarginRight', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {(styling?.subtitleMarginBottom as number) ?? 16}px
                </div>
                <Slider
                  value={[(styling?.subtitleMarginBottom as number) ?? 16]}
                  onValueChange={(value) => onConfigChange('subtitleMarginBottom', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {(styling?.subtitleMarginLeft as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitleMarginLeft as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitleMarginLeft', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Subtitle Paddings */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Padding do Subtítulo</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Top: {(styling?.subtitlePaddingTop as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitlePaddingTop as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitlePaddingTop', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {(styling?.subtitlePaddingRight as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitlePaddingRight as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitlePaddingRight', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {(styling?.subtitlePaddingBottom as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitlePaddingBottom as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitlePaddingBottom', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {(styling?.subtitlePaddingLeft as number) ?? 0}px
                </div>
                <Slider
                  value={[(styling?.subtitlePaddingLeft as number) ?? 0]}
                  onValueChange={(value) => onConfigChange('subtitlePaddingLeft', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tailwind CSS Classes */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">🎨 Classes Tailwind (Precedência Total)</div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Classes Tailwind para o Título
              </label>
              <input
                type="text"
                value={(styling?.titleClassName as string) || ''}
                onChange={(e) => onConfigChange('titleClassName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="text-2xl font-bold text-blue-600 mb-4"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Classes Tailwind para o Subtítulo
              </label>
              <input
                type="text"
                value={(styling?.subtitleClassName as string) || ''}
                onChange={(e) => onConfigChange('subtitleClassName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="text-sm text-gray-600 mb-4"
              />
            </div>

            <div className="text-xs text-gray-400">
              Se preenchido, sobrescreve todas as configurações de espaçamento acima
            </div>
          </div>
        </div>

      </AccordionContent>
    </AccordionItem>
  )
}