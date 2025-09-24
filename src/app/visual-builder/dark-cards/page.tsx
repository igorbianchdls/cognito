'use client';

import { KPICard } from '@/components/widgets/KPICard';

export default function DarkCardsPage() {
  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #16191f, #1a1d23)',
    }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Blue Gradients - 9 Variations</h1>
        <p className="text-gray-400">Different blue gradient combinations with inner glow effects</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* Card 1 - Navy Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Navy Blue</h3>
          <KPICard
            name="Receita Total"
            currentValue={847000}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.1)',
              endColor: '#1a1a2e'
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

        {/* Card 2 - Royal Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Royal Blue</h3>
          <KPICard
            name="Vendas Mensais"
            currentValue={1250}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.15)',
              endColor: '#1e3a8a'
            }}
            kpiContainerBorderColor="rgba(59, 130, 246, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(59, 130, 246, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#3b82f6"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 3 - Steel Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Steel Blue</h3>
          <KPICard
            name="ROI Mensal"
            currentValue={34.2}
            unit="%"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.1)',
              endColor: '#334155'
            }}
            kpiContainerBorderColor="rgba(148, 163, 184, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(148, 163, 184, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#94a3b8"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 4 - Ocean Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Ocean Blue</h3>
          <KPICard
            name="Leads Qualificados"
            currentValue={156}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.12)',
              endColor: '#1e40af'
            }}
            kpiContainerBorderColor="rgba(37, 99, 235, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(37, 99, 235, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#2563eb"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 5 - Sky Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Sky Blue</h3>
          <KPICard
            name="NPS Score"
            currentValue={8.7}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.1)',
              endColor: '#0c4a6e'
            }}
            kpiContainerBorderColor="rgba(14, 165, 233, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(14, 165, 233, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#0ea5e9"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 6 - Midnight Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Midnight Blue</h3>
          <KPICard
            name="Ticket Médio"
            currentValue={450}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.08)',
              endColor: '#0f172a'
            }}
            kpiContainerBorderColor="rgba(71, 85, 105, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(71, 85, 105, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#475569"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 7 - Indigo Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Indigo Blue</h3>
          <KPICard
            name="Taxa Conversão"
            currentValue={12.8}
            unit="%"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.15)',
              endColor: '#312e81'
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

        {/* Card 8 - Electric Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Electric Blue</h3>
          <KPICard
            name="CAC Médio"
            currentValue={89}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.2)',
              endColor: '#1e3a8a'
            }}
            kpiContainerBorderColor="rgba(37, 99, 235, 0.4)"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(37, 99, 235, 0.3)"
            containerShadowOpacity={0.9}
            containerShadowBlur={12}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#2563eb"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 9 - Deep Blue */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Deep Blue</h3>
          <KPICard
            name="LTV Médio"
            currentValue={2340}
            unit="R$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255,255,255,0.1)',
              endColor: '#0a1525'
            }}
            kpiContainerBorderColor="rgba(59, 130, 246, 0.3)"
            kpiContainerBorderWidth={1}
            kpiContainerBorderRadius={12}
            kpiContainerPadding={24}
            containerShadowColor="rgba(59, 130, 246, 0.2)"
            containerShadowOpacity={0.8}
            containerShadowBlur={8}
            containerShadowOffsetX={0}
            containerShadowOffsetY={2}
            kpiNameColor="rgba(255, 255, 255, 0.7)"
            kpiValueColor="#3b82f6"
            kpiValueFontSize={28}
            kpiValueFontWeight={600}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

      </div>

      {/* Additional Gradient Variations */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Gradient Variations - Different Directions</h2>
        <p className="text-gray-400 text-center mb-8">Same colors, different gradient directions</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Navy Blue Variations */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Navy Blue - Diagonal Opposite</h3>
            <KPICard
              name="Receita Total"
              currentValue={847000}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '225deg',
                startColor: 'rgba(255,255,255,0.1)',
                endColor: '#1a1a2e'
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

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Midnight Blue - Diagonal Opposite</h3>
            <KPICard
              name="Ticket Médio"
              currentValue={450}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '225deg',
                startColor: 'rgba(255,255,255,0.08)',
                endColor: '#0f172a'
              }}
              kpiContainerBorderColor="rgba(71, 85, 105, 0.3)"
              kpiContainerBorderWidth={1}
              kpiContainerBorderRadius={12}
              kpiContainerPadding={24}
              containerShadowColor="rgba(71, 85, 105, 0.2)"
              containerShadowOpacity={0.8}
              containerShadowBlur={8}
              containerShadowOffsetX={0}
              containerShadowOffsetY={2}
              kpiNameColor="rgba(255, 255, 255, 0.7)"
              kpiValueColor="#475569"
              kpiValueFontSize={28}
              kpiValueFontWeight={600}
              kpiNameFontSize={14}
              success={true}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Deep Blue - Diagonal Opposite</h3>
            <KPICard
              name="LTV Médio"
              currentValue={2340}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '225deg',
                startColor: 'rgba(255,255,255,0.1)',
                endColor: '#0a1525'
              }}
              kpiContainerBorderColor="rgba(59, 130, 246, 0.3)"
              kpiContainerBorderWidth={1}
              kpiContainerBorderRadius={12}
              kpiContainerPadding={24}
              containerShadowColor="rgba(59, 130, 246, 0.2)"
              containerShadowOpacity={0.8}
              containerShadowBlur={8}
              containerShadowOffsetX={0}
              containerShadowOffsetY={2}
              kpiNameColor="rgba(255, 255, 255, 0.7)"
              kpiValueColor="#3b82f6"
              kpiValueFontSize={28}
              kpiValueFontWeight={600}
              kpiNameFontSize={14}
              success={true}
            />
          </div>

          {/* Vertical Gradients */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Navy Blue - Vertical</h3>
            <KPICard
              name="Receita Total"
              currentValue={847000}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '180deg',
                startColor: 'rgba(255,255,255,0.1)',
                endColor: '#1a1a2e'
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

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Midnight Blue - Vertical</h3>
            <KPICard
              name="Ticket Médio"
              currentValue={450}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '180deg',
                startColor: 'rgba(255,255,255,0.08)',
                endColor: '#0f172a'
              }}
              kpiContainerBorderColor="rgba(71, 85, 105, 0.3)"
              kpiContainerBorderWidth={1}
              kpiContainerBorderRadius={12}
              kpiContainerPadding={24}
              containerShadowColor="rgba(71, 85, 105, 0.2)"
              containerShadowOpacity={0.8}
              containerShadowBlur={8}
              containerShadowOffsetX={0}
              containerShadowOffsetY={2}
              kpiNameColor="rgba(255, 255, 255, 0.7)"
              kpiValueColor="#475569"
              kpiValueFontSize={28}
              kpiValueFontWeight={600}
              kpiNameFontSize={14}
              success={true}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Deep Blue - Vertical</h3>
            <KPICard
              name="LTV Médio"
              currentValue={2340}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '180deg',
                startColor: 'rgba(255,255,255,0.1)',
                endColor: '#0a1525'
              }}
              kpiContainerBorderColor="rgba(59, 130, 246, 0.3)"
              kpiContainerBorderWidth={1}
              kpiContainerBorderRadius={12}
              kpiContainerPadding={24}
              containerShadowColor="rgba(59, 130, 246, 0.2)"
              containerShadowOpacity={0.8}
              containerShadowBlur={8}
              containerShadowOffsetX={0}
              containerShadowOffsetY={2}
              kpiNameColor="rgba(255, 255, 255, 0.7)"
              kpiValueColor="#3b82f6"
              kpiValueFontSize={28}
              kpiValueFontWeight={600}
              kpiNameFontSize={14}
              success={true}
            />
          </div>

          {/* Horizontal Gradients */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Navy Blue - Horizontal</h3>
            <KPICard
              name="Receita Total"
              currentValue={847000}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '90deg',
                startColor: 'rgba(255,255,255,0.1)',
                endColor: '#1a1a2e'
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

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Midnight Blue - Horizontal</h3>
            <KPICard
              name="Ticket Médio"
              currentValue={450}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '90deg',
                startColor: 'rgba(255,255,255,0.08)',
                endColor: '#0f172a'
              }}
              kpiContainerBorderColor="rgba(71, 85, 105, 0.3)"
              kpiContainerBorderWidth={1}
              kpiContainerBorderRadius={12}
              kpiContainerPadding={24}
              containerShadowColor="rgba(71, 85, 105, 0.2)"
              containerShadowOpacity={0.8}
              containerShadowBlur={8}
              containerShadowOffsetX={0}
              containerShadowOffsetY={2}
              kpiNameColor="rgba(255, 255, 255, 0.7)"
              kpiValueColor="#475569"
              kpiValueFontSize={28}
              kpiValueFontWeight={600}
              kpiNameFontSize={14}
              success={true}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 text-center">Deep Blue - Horizontal</h3>
            <KPICard
              name="LTV Médio"
              currentValue={2340}
              unit="R$"
              backgroundGradient={{
                enabled: true,
                type: 'linear',
                direction: '90deg',
                startColor: 'rgba(255,255,255,0.1)',
                endColor: '#0a1525'
              }}
              kpiContainerBorderColor="rgba(59, 130, 246, 0.3)"
              kpiContainerBorderWidth={1}
              kpiContainerBorderRadius={12}
              kpiContainerPadding={24}
              containerShadowColor="rgba(59, 130, 246, 0.2)"
              containerShadowOpacity={0.8}
              containerShadowBlur={8}
              containerShadowOffsetX={0}
              containerShadowOffsetY={2}
              kpiNameColor="rgba(255, 255, 255, 0.7)"
              kpiValueColor="#3b82f6"
              kpiValueFontSize={28}
              kpiValueFontWeight={600}
              kpiNameFontSize={14}
              success={true}
            />
          </div>

        </div>
      </div>

      {/* Comparison Info */}
      <div className="mt-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Row 1: Classic Blues</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#60a5fa'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#3b82f6'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#94a3b8'}}></div>
            </div>
            <p className="text-gray-500 text-xs">Navy, Royal, Steel - Traditional professional blues</p>
          </div>
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Row 2: Bright Blues</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#2563eb'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#0ea5e9'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#475569'}}></div>
            </div>
            <p className="text-gray-500 text-xs">Ocean, Sky, Midnight - Vibrant corporate blues</p>
          </div>
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Row 3: Deep Blues</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#6366f1'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#2563eb'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#3b82f6'}}></div>
            </div>
            <p className="text-gray-500 text-xs">Indigo, Electric, Deep - Rich and sophisticated</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          All blue gradient variations with inner glow - perfect for consistent yet varied professional dashboards
        </p>
      </div>
    </div>
  );
}