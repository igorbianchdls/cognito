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
import type { BarChartConfig } from '@/stores/apps/barChartStore'
import type { LineChartConfig } from '@/stores/apps/lineChartStore'

type ChartStyling =
  | BarChartConfig['styling']
  | LineChartConfig['styling']

interface ChartTitleSubtitleAccordionProps {
  styling: ChartStyling
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
                  Top: {styling?.titleMarginTop ?? 0}px
                </div>
                <Slider
                  value={[styling?.titleMarginTop ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titleMarginTop', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {styling?.titleMarginRight ?? 0}px
                </div>
                <Slider
                  value={[styling?.titleMarginRight ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titleMarginRight', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {styling?.titleMarginBottom ?? 4}px
                </div>
                <Slider
                  value={[styling?.titleMarginBottom ?? 4]}
                  onValueChange={(value) => onConfigChange('styling.titleMarginBottom', value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {styling?.titleMarginLeft ?? 0}px
                </div>
                <Slider
                  value={[styling?.titleMarginLeft ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titleMarginLeft', value[0])}
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
                  Top: {styling?.titlePaddingTop ?? 0}px
                </div>
                <Slider
                  value={[styling?.titlePaddingTop ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titlePaddingTop', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {styling?.titlePaddingRight ?? 0}px
                </div>
                <Slider
                  value={[styling?.titlePaddingRight ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titlePaddingRight', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {styling?.titlePaddingBottom ?? 0}px
                </div>
                <Slider
                  value={[styling?.titlePaddingBottom ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titlePaddingBottom', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {styling?.titlePaddingLeft ?? 0}px
                </div>
                <Slider
                  value={[styling?.titlePaddingLeft ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.titlePaddingLeft', value[0])}
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
                  Top: {styling?.subtitleMarginTop ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitleMarginTop ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitleMarginTop', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {styling?.subtitleMarginRight ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitleMarginRight ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitleMarginRight', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {styling?.subtitleMarginBottom ?? 16}px
                </div>
                <Slider
                  value={[styling?.subtitleMarginBottom ?? 16]}
                  onValueChange={(value) => onConfigChange('styling.subtitleMarginBottom', value[0])}
                  max={40}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {styling?.subtitleMarginLeft ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitleMarginLeft ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitleMarginLeft', value[0])}
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
                  Top: {styling?.subtitlePaddingTop ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitlePaddingTop ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitlePaddingTop', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Right: {styling?.subtitlePaddingRight ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitlePaddingRight ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitlePaddingRight', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Bottom: {styling?.subtitlePaddingBottom ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitlePaddingBottom ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitlePaddingBottom', value[0])}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Left: {styling?.subtitlePaddingLeft ?? 0}px
                </div>
                <Slider
                  value={[styling?.subtitlePaddingLeft ?? 0]}
                  onValueChange={(value) => onConfigChange('styling.subtitlePaddingLeft', value[0])}
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
                value={styling?.titleClassName || ''}
                onChange={(e) => onConfigChange('styling.titleClassName', e.target.value)}
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
                value={styling?.subtitleClassName || ''}
                onChange={(e) => onConfigChange('styling.subtitleClassName', e.target.value)}
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