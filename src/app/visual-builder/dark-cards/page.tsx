'use client';

import { KPICard } from '@/components/widgets/KPICard';

export default function DarkCardsPage() {
  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #16191f, #1a1d23)',
    }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dark KPI Cards Demo</h1>
        <p className="text-gray-400">8 different dark card styles with professional effects</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 - Glass Effect */}
        <KPICard
          name="Receita Total"
          currentValue={1200000}
          unit="R$"
          kpiContainerBackgroundColor="rgba(0, 0, 0, 0.4)"
          backgroundOpacity={0.4}
          backdropFilter={{
            enabled: true,
            blur: 10
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
        />

        {/* Card 2 - Gradient Dark */}
        <KPICard
          name="Vendas Mensais"
          currentValue={847}
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

        {/* Card 3 - Solid + Neon Border */}
        <KPICard
          name="Taxa Conversão"
          currentValue={12.3}
          unit="%"
          kpiContainerBackgroundColor="#1a1d23"
          kpiContainerBorderColor="rgba(255, 100, 100, 0.5)"
          kpiContainerBorderWidth={2}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          containerShadowColor="#ff6464"
          containerShadowOpacity={0.3}
          containerShadowBlur={10}
          containerShadowOffsetX={0}
          containerShadowOffsetY={0}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#ff6464"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
        />

        {/* Card 4 - Glass + Gradient */}
        <KPICard
          name="Clientes Ativos"
          currentValue={2100}
          unit=""
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

        {/* Card 5 - Deep Shadow */}
        <KPICard
          name="ROI Mensal"
          currentValue={34.5}
          unit="%"
          kpiContainerBackgroundColor="#1a1d23"
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          containerShadowColor="#000000"
          containerShadowOpacity={0.5}
          containerShadowBlur={20}
          containerShadowOffsetX={0}
          containerShadowOffsetY={8}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#10b981"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
          kpiContainerClassName="shadow-2xl shadow-black/50"
        />

        {/* Card 6 - Double Border */}
        <KPICard
          name="Leads Qualificados"
          currentValue={156}
          kpiContainerBackgroundColor="#1e1e2e"
          kpiContainerBorderColor="rgba(255, 255, 255, 0.2)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#f59e0b"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
          kpiContainerClassName="ring-1 ring-white/10 ring-offset-2 ring-offset-transparent"
        />

        {/* Card 7 - Variable Transparency */}
        <KPICard
          name="Ticket Médio"
          currentValue={450}
          unit="R$"
          kpiContainerBackgroundColor="rgba(30, 30, 46, 0.9)"
          backgroundOpacity={0.9}
          kpiContainerBorderColor="rgba(255, 255, 255, 0.08)"
          kpiContainerBorderWidth={1}
          kpiContainerBorderRadius={12}
          kpiContainerPadding={24}
          backdropFilter={{
            enabled: true,
            blur: 5
          }}
          kpiNameColor="rgba(255, 255, 255, 0.7)"
          kpiValueColor="#8b5cf6"
          kpiValueFontSize={28}
          kpiValueFontWeight={600}
          kpiNameFontSize={14}
          success={true}
          kpiContainerClassName="hover:bg-opacity-100 transition-all duration-300"
        />

        {/* Card 8 - Subtle Pattern */}
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

      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Each card demonstrates different dark styling techniques: glass effects, gradients, shadows, borders, and transparency
        </p>
      </div>
    </div>
  );
}