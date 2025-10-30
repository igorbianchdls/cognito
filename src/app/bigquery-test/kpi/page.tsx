"use client"

import KPICard from '@/components/widgets/KPICard'
import { UserPlus, Star, Droplet, Timer } from 'lucide-react'

export default function BigQueryKPIDemoPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">KPIs (Mock) — BigQuery Test</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          variant="tile"
          success
          name="New Users"
          currentValue={1390}
          unit=""
          abbreviate
          decimals={2}
          changePct={147}
          icon={<UserPlus />}
          iconBg="#fee2e2"
          iconColor="#ef4444"
        />
        <KPICard
          variant="tile"
          success
          name="Unique Users"
          currentValue={1520}
          unit=""
          abbreviate
          decimals={2}
          changePct={53}
          icon={<Star />}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <KPICard
          variant="tile"
          success
          name="Week 1 Retention"
          currentValue={4.53}
          unit="%"
          decimals={2}
          changePct={-10.7}
          icon={<Droplet />}
          iconBg="#dbeafe"
          iconColor="#2563eb"
        />
        <KPICard
          variant="tile"
          success
          name="Session"
          currentValue={0.9}
          unit="sec"
          decimals={1}
          changePct={29}
          icon={<Timer />}
          iconBg="#ffedd5"
          iconColor="#f59e0b"
        />
      </div>
    </div>
  )
}
