'use client';

import { KPICard } from '@/components/widgets/KPICard';

export default function DarkCardsPage() {
  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #16191f, #1a1d23)',
    }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Blue Gradient Cards - 3 Luminosity Effects</h1>
        <p className="text-gray-400">Same blue gradient, 3 different luminous effects to compare</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* Card 1 - Glow Effect (Brilho Externo) */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Glow Effect (External)</h3>
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
            kpiContainerBorderColor="rgba(255, 255, 255, 0.05)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="#60a5fa"
            containerShadowOpacity={0.5}
            containerShadowBlur={20}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#ffffff"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 2 - Neon Border (Borda Luminosa) */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Neon Border</h3>
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
            kpiContainerBorderColor="#60a5fa"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="#60a5fa"
            containerShadowOpacity={0.6}
            containerShadowBlur={15}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#ffffff"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 3 - Inner Glow (Brilho Interno) */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Inner Glow</h3>
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
            kpiContainerBorderColor="rgba(255, 255, 255, 0.1)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#ffffff"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
            kpiContainerClassName="shadow-inner shadow-blue-400/20"
            kpiContainerStyle={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(96,165,250,0.1), 0 2px 8px rgba(0,0,0,0.3)'
            }}
          />
        </div>

      </div>

      {/* Comparison Info */}
      <div className="mt-12 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Glow Effect</h4>
            <p className="text-gray-400 text-sm">
              Brilho externo que "vaza" ao redor do card. Efeito mais dramático e visível.
            </p>
          </div>
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Neon Border</h4>
            <p className="text-gray-400 text-sm">
              Borda brilhante com glow focado. Efeito mais definido e elegante.
            </p>
          </div>
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Inner Glow</h4>
            <p className="text-gray-400 text-sm">
              Brilho interno sutil. Efeito mais refinado e premium.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Same gradient base (#1a1a2e → #16213e) with 3 different luminosity techniques
        </p>
      </div>
    </div>
  );
}