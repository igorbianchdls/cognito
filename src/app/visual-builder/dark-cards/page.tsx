'use client';

import { KPICard } from '@/components/widgets/KPICard';

export default function DarkCardsPage() {
  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #16191f, #1a1d23)',
    }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dark KPI Cards - 3 Styles x 3 Colors</h1>
        <p className="text-gray-400">9 cards demonstrating 3 different styles, each in 3 color variations</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ===== ESTILO 1: GRADIENTE PURO (3 cores) ===== */}

        {/* Gradiente Azul (original) */}
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
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#ffffff"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* Gradiente Verde */}
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
          kpiContainerBorderColor="rgba(255, 255, 255, 0.05)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#4ade80"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* Gradiente Vermelho */}
        <KPICard
          name="Taxa Conversão"
          currentValue={8.5}
          unit="%"
          backgroundGradient={{
            enabled: true,
            type: 'linear',
            direction: '135deg',
            startColor: '#2e1a1a',
            endColor: '#3e1616'
          }}
          kpiContainerBorderColor="rgba(255, 255, 255, 0.05)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#f87171"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* ===== ESTILO 2: GLASS + GRADIENTE (3 cores) ===== */}

        {/* Glass Azul (original) */}
        <KPICard
          name="Clientes Ativos"
          currentValue={2100}
          backgroundGradient={{
            enabled: true,
            type: 'linear',
            direction: '135deg',
            startColor: 'rgba(26, 26, 46, 0.8)',
            endColor: 'rgba(22, 33, 62, 0.6)'
          }}
          backdropFilter={{
            enabled: true,
            blur: 8
          }}
          kpiContainerBorderColor="rgba(255, 255, 255, 0.15)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#60a5fa"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* Glass Roxo */}
        <KPICard
          name="ROI Mensal"
          currentValue={34.2}
          unit="%"
          backgroundGradient={{
            enabled: true,
            type: 'linear',
            direction: '135deg',
            startColor: 'rgba(46, 26, 46, 0.8)',
            endColor: 'rgba(62, 22, 62, 0.6)'
          }}
          backdropFilter={{
            enabled: true,
            blur: 8
          }}
          kpiContainerBorderColor="rgba(255, 255, 255, 0.15)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#a855f7"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* Glass Laranja */}
        <KPICard
          name="Leads Qualificados"
          currentValue={156}
          backgroundGradient={{
            enabled: true,
            type: 'linear',
            direction: '135deg',
            startColor: 'rgba(46, 36, 26, 0.8)',
            endColor: 'rgba(62, 44, 22, 0.6)'
          }}
          backdropFilter={{
            enabled: true,
            blur: 8
          }}
          kpiContainerBorderColor="rgba(255, 255, 255, 0.15)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#f97316"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* ===== ESTILO 3: GRADIENTE SUTIL + SHADOW (3 cores) ===== */}

        {/* Sutil Cyan (original) */}
        <KPICard
          name="NPS Score"
          currentValue={8.7}
          kpiContainerBackgroundColor="#171923"
          kpiContainerBorderColor="rgba(255, 255, 255, 0.1)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          containerShadowColor="#000000"
          containerShadowOpacity={0.3}
          containerShadowBlur={15}
          containerShadowOffsetX={0}
          containerShadowOffsetY={4}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#06b6d4"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
          kpiContainerClassName="bg-gradient-to-br from-gray-800/50 to-gray-900/50"
        />

        {/* Sutil Pink */}
        <KPICard
          name="Ticket Médio"
          currentValue={450}
          unit="R$"
          kpiContainerBackgroundColor="#231719"
          kpiContainerBorderColor="rgba(255, 255, 255, 0.1)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          containerShadowColor="#000000"
          containerShadowOpacity={0.3}
          containerShadowBlur={15}
          containerShadowOffsetX={0}
          containerShadowOffsetY={4}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#ec4899"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
          kpiContainerClassName="bg-gradient-to-br from-rose-800/50 to-rose-900/50"
        />

        {/* Sutil Amarelo */}
        <KPICard
          name="CAC Médio"
          currentValue={89}
          unit="R$"
          kpiContainerBackgroundColor="#232317"
          kpiContainerBorderColor="rgba(255, 255, 255, 0.1)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          containerShadowColor="#000000"
          containerShadowOpacity={0.3}
          containerShadowBlur={15}
          containerShadowOffsetX={0}
          containerShadowOffsetY={4}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#eab308"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
          kpiContainerClassName="bg-gradient-to-br from-amber-800/50 to-amber-900/50"
        />

      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center space-y-2">
        <p className="text-gray-500 text-sm">
          <strong>Row 1:</strong> Pure Gradient style (Blue, Green, Red) |
          <strong> Row 2:</strong> Glass + Gradient style (Blue, Purple, Orange) |
          <strong> Row 3:</strong> Subtle Gradient + Shadow style (Cyan, Pink, Yellow)
        </p>
        <p className="text-gray-600 text-xs">
          Same styling patterns, different color variations - perfect for consistent yet varied KPI displays
        </p>
      </div>
    </div>
  );
}