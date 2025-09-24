'use client';

import { KPICard } from '@/components/widgets/KPICard';

export default function CircuitMetalPage() {
  return (
    <div className="min-h-screen p-8" style={{
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #0f0f0f)',
    }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Circuit Metal Effects - 6 Variations</h1>
        <p className="text-gray-400">Futuristic metallic cards with circuit-inspired designs</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* Card 1 - Silver Circuit */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Silver Circuit</h3>
          <KPICard
            name="Total Revenue"
            currentValue={847000}
            unit="$"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1a1a1a',
              endColor: '#2d2d2d'
            }}
            kpiContainerBorderColor="rgba(192, 192, 192, 0.6)"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={8}
            kpiContainerPadding={24}
            containerShadowColor="rgba(192, 192, 192, 0.3)"
            containerShadowOpacity={0.8}
            containerShadowBlur={15}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(220, 220, 220, 0.8)"
            kpiValueColor="#c0c0c0"
            kpiValueFontSize={28}
            kpiValueFontWeight={700}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 2 - Copper Circuit */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Copper Circuit</h3>
          <KPICard
            name="Active Users"
            currentValue={12500}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1a0f0a',
              endColor: '#2d1a0f'
            }}
            kpiContainerBorderColor="rgba(184, 115, 51, 0.7)"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={8}
            kpiContainerPadding={24}
            containerShadowColor="rgba(184, 115, 51, 0.4)"
            containerShadowOpacity={0.9}
            containerShadowBlur={18}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(220, 160, 120, 0.8)"
            kpiValueColor="#b87333"
            kpiValueFontSize={28}
            kpiValueFontWeight={700}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 3 - Gold Circuit */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Gold Circuit</h3>
          <KPICard
            name="Conversion Rate"
            currentValue={34.2}
            unit="%"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1a1a0a',
              endColor: '#2d2d0f'
            }}
            kpiContainerBorderColor="rgba(255, 215, 0, 0.6)"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={8}
            kpiContainerPadding={24}
            containerShadowColor="rgba(255, 215, 0, 0.3)"
            containerShadowOpacity={0.8}
            containerShadowBlur={20}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(255, 235, 180, 0.8)"
            kpiValueColor="#ffd700"
            kpiValueFontSize={28}
            kpiValueFontWeight={700}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 4 - Steel Circuit */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Steel Circuit</h3>
          <KPICard
            name="Server Uptime"
            currentValue={99.9}
            unit="%"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#0f0f0f',
              endColor: '#2a2a2a'
            }}
            kpiContainerBorderColor="rgba(169, 169, 169, 0.7)"
            kpiContainerBorderWidth={3}
            kpiContainerBorderRadius={8}
            kpiContainerPadding={24}
            containerShadowColor="rgba(169, 169, 169, 0.4)"
            containerShadowOpacity={1.0}
            containerShadowBlur={12}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(200, 200, 200, 0.9)"
            kpiValueColor="#a9a9a9"
            kpiValueFontSize={28}
            kpiValueFontWeight={700}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 5 - Chrome Circuit */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Chrome Circuit</h3>
          <KPICard
            name="API Calls"
            currentValue={2340000}
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '45deg',
              startColor: 'rgba(255, 255, 255, 0.05)',
              endColor: '#1a1a1a'
            }}
            kpiContainerBorderColor="rgba(220, 220, 220, 0.8)"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={8}
            kpiContainerPadding={24}
            containerShadowColor="rgba(255, 255, 255, 0.2)"
            containerShadowOpacity={0.7}
            containerShadowBlur={25}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(240, 240, 240, 0.8)"
            kpiValueColor="#dcdcdc"
            kpiValueFontSize={28}
            kpiValueFontWeight={700}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

        {/* Card 6 - Titanium Circuit */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 text-center">Titanium Circuit</h3>
          <KPICard
            name="Response Time"
            currentValue={45}
            unit="ms"
            backgroundGradient={{
              enabled: true,
              type: 'linear',
              direction: '135deg',
              startColor: '#1c1c1c',
              endColor: '#2f2f2f'
            }}
            kpiContainerBorderColor="rgba(176, 196, 222, 0.6)"
            kpiContainerBorderWidth={2}
            kpiContainerBorderRadius={8}
            kpiContainerPadding={24}
            containerShadowColor="rgba(176, 196, 222, 0.3)"
            containerShadowOpacity={0.8}
            containerShadowBlur={16}
            containerShadowOffsetX={0}
            containerShadowOffsetY={0}
            kpiNameColor="rgba(210, 210, 220, 0.8)"
            kpiValueColor="#b0c4de"
            kpiValueFontSize={28}
            kpiValueFontWeight={700}
            kpiNameFontSize={14}
            success={true}
          />
        </div>

      </div>

      {/* Circuit Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10 10h80v80h-80z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              <circle cx="20" cy="20" r="2" fill="currentColor"/>
              <circle cx="80" cy="20" r="2" fill="currentColor"/>
              <circle cx="20" cy="80" r="2" fill="currentColor"/>
              <circle cx="80" cy="80" r="2" fill="currentColor"/>
              <path d="M20 20h60M20 80h60M20 20v60M80 20v60" stroke="currentColor" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" className="text-gray-600"/>
        </svg>
      </div>

      {/* Comparison Info */}
      <div className="mt-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
            <h4 className="font-semibold text-white mb-2">Precious Metals</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#c0c0c0'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#b87333'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#ffd700'}}></div>
            </div>
            <p className="text-gray-500 text-xs">Silver, Copper, Gold - Classic metallic finishes</p>
          </div>
          <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
            <h4 className="font-semibold text-white mb-2">Industrial Metals</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#a9a9a9'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#dcdcdc'}}></div>
              <div className="w-4 h-4 rounded" style={{backgroundColor: '#b0c4de'}}></div>
            </div>
            <p className="text-gray-500 text-xs">Steel, Chrome, Titanium - Modern industrial look</p>
          </div>
          <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
            <h4 className="font-semibold text-white mb-2">Circuit Elements</h4>
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded border border-gray-500"></div>
              <div className="w-4 h-4 rounded bg-gray-600"></div>
              <div className="w-4 h-4 rounded bg-gray-500"></div>
            </div>
            <p className="text-gray-500 text-xs">Borders, shadows, gradients - Tech-inspired design</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Circuit Metal effects - Futuristic metallic finishes with tech-inspired design elements
        </p>
      </div>
    </div>
  );
}