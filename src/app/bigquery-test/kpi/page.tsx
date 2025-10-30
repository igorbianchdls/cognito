"use client"

import KPICard from '@/components/widgets/KPICard'

export default function BigQueryKPIDemoPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">KPIs (Mock) — BigQuery Test</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          success
          name="Receita do mês"
          currentValue={125000}
          unit="R$"
          timeRange="Últimos 30 dias"
          kpiContainerBackgroundColor="#ffffff"
          kpiContainerBorderColor="#e5e7eb"
          kpiContainerBorderAccentColor="#cbd5e1"
          kpiValueFontSize={28}
          kpiNameColor="#6b7280"
        />
        <KPICard
          success
          name="Taxa de conversão"
          currentValue={4.8}
          unit="%"
          timeRange="Últimos 30 dias"
          kpiContainerBackgroundColor="#ffffff"
          kpiContainerBorderColor="#e5e7eb"
          kpiContainerBorderAccentColor="#cbd5e1"
          kpiValueFontSize={28}
          kpiNameColor="#6b7280"
        />
        <KPICard
          success
          name="Novos clientes"
          currentValue={87}
          unit=""
          timeRange="Últimos 30 dias"
          kpiContainerBackgroundColor="#ffffff"
          kpiContainerBorderColor="#e5e7eb"
          kpiContainerBorderAccentColor="#cbd5e1"
          kpiValueFontSize={28}
          kpiNameColor="#6b7280"
        />
      </div>
    </div>
  )
}

