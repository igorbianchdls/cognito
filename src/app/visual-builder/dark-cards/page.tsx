'use client';

import { KPICard } from '@/components/widgets/KPICard';

export default function DarkCardsPage() {
  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #16191f, #1a1d23)',
    }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Inner Glow + Gradient - 9 Color Variations</h1>
        <p className="text-gray-400">Same inner glow technique with 9 different gradient color combinations</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* Card 1 - Inner Glow + Gradient Azul */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Blue Inner Glow</h3>
          <KPICard
            name="Receita Total"
            currentValue={847000}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1a1a2e',
              endColor: '#16213e'
            }}
            kpiContainerBorderColor="rgba(96, 165, 250, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(96, 165, 250, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#60a5fa"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 2 - Inner Glow + Gradient Verde */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Green Inner Glow</h3>
          <KPICard
            name="Vendas Mensais"
            currentValue={1250}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1a2e1a',
              endColor: '#162e21'
            }}
            kpiContainerBorderColor="rgba(74, 222, 128, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(74, 222, 128, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#4ade80"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 3 - Inner Glow + Gradient Roxo */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Purple Inner Glow</h3>
          <KPICard
            name="ROI Mensal"
            currentValue={34.2}
            unit="%"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#2e1a2e',
              endColor: '#3e1632'
            }}
            kpiContainerBorderColor="rgba(168, 85, 247, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(168, 85, 247, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#a855f7"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

      </div>

      {/* Second Row - More Variations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">

        {/* Card 4 - Inner Glow + Gradient Laranja */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Orange Inner Glow</h3>
          <KPICard
            name="Leads Qualificados"
            currentValue={156}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#2e261a',
              endColor: '#3e2e16'
            }}
            kpiContainerBorderColor="rgba(249, 115, 22, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(249, 115, 22, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#f97316"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 5 - Inner Glow + Gradient Cyan */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Cyan Inner Glow</h3>
          <KPICard
            name="NPS Score"
            currentValue={8.7}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1a2e2e',
              endColor: '#16332e'
            }}
            kpiContainerBorderColor="rgba(6, 182, 212, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(6, 182, 212, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#06b6d4"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 6 - Inner Glow + Gradient Pink */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Pink Inner Glow</h3>
          <KPICard
            name="Ticket Médio"
            currentValue={450}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#2e1a26',
              endColor: '#3e1630'
            }}
            kpiContainerBorderColor="rgba(236, 72, 153, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(236, 72, 153, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#ec4899"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

      </div>

      {/* Third Row - Additional Variations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">

        {/* Card 7 - Inner Glow + Gradient Vermelho */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Red Inner Glow</h3>
          <KPICard
            name="Taxa Conversão"
            currentValue={12.8}
            unit="%"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#2e1a1a',
              endColor: '#3e1616'
            }}
            kpiContainerBorderColor="rgba(248, 113, 113, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(248, 113, 113, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#f87171"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 8 - Inner Glow + Gradient Amarelo */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Yellow Inner Glow</h3>
          <KPICard
            name="CAC Médio"
            currentValue={89}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#2e2a1a',
              endColor: '#3e3216'
            }}
            kpiContainerBorderColor="rgba(234, 179, 8, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(234, 179, 8, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#eab308"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 9 - Inner Glow + Gradient Indigo */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Indigo Inner Glow</h3>
          <KPICard
            name="LTV Médio"
            currentValue={2340}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1e1a2e',
              endColor: '#251632'
            }}
            kpiContainerBorderColor="rgba(99, 102, 241, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(99, 102, 241, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#6366f1"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

      </div>

      {/* Comparison Info */}
      <div className="mt-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Row 1: Cool Colors</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-blue-400"></div>
              <div className="w-4 h-4 rounded bg-green-400"></div>
              <div className="w-4 h-4 rounded bg-purple-400"></div>
            </div>
            <p className="text-gray-500 text-xs">Blue, Green, Purple - Professional & trustworthy</p>
          </div>
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Row 2: Vibrant Colors</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-orange-400"></div>
              <div className="w-4 h-4 rounded bg-cyan-400"></div>
              <div className="w-4 h-4 rounded bg-pink-400"></div>
            </div>
            <p className="text-gray-500 text-xs">Orange, Cyan, Pink - Energetic & modern</p>
          </div>
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Row 3: Bold Colors</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-red-400"></div>
              <div className="w-4 h-4 rounded bg-yellow-400"></div>
              <div className="w-4 h-4 rounded bg-indigo-400"></div>
            </div>
            <p className="text-gray-500 text-xs">Red, Yellow, Indigo - Bold & attention-grabbing</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Inner Glow + Gradient combination: subtle inner shadow + matching gradient background + colored border
        </p>
      </div>
    </div>
  );
}