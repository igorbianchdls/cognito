"use client"

import React, { useState } from 'react'
import KPICard from '@/components/widgets/KPICard'
import { UserPlus, Star, Droplet, Timer } from 'lucide-react'

export default function BigQueryKPIDemoPage() {
  const [tilePadding, setTilePadding] = useState<number>(16)
  const [tileIconCircleSize, setTileIconCircleSize] = useState<number>(36)
  const [tileIconSize, setTileIconSize] = useState<number>(28)
  const [tileValuePaddingY, setTileValuePaddingY] = useState<number>(4)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">KPIs (Mock) — BigQuery Test</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">Padding
          <input type="number" className="border rounded px-2 py-1 w-20" value={tilePadding} onChange={(e) => setTilePadding(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">Icon circle
          <input type="number" className="border rounded px-2 py-1 w-20" value={tileIconCircleSize} onChange={(e) => setTileIconCircleSize(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">Icon size
          <input type="number" className="border rounded px-2 py-1 w-20" value={tileIconSize} onChange={(e) => setTileIconSize(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">Value py
          <input type="number" className="border rounded px-2 py-1 w-20" value={tileValuePaddingY} onChange={(e) => setTileValuePaddingY(Number(e.target.value))} />
        </label>
      </div>
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
          tilePadding={tilePadding}
          tileIconCircleSize={tileIconCircleSize}
          tileIconSize={tileIconSize}
          tileValuePaddingY={tileValuePaddingY}
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
          tilePadding={tilePadding}
          tileIconCircleSize={tileIconCircleSize}
          tileIconSize={tileIconSize}
          tileValuePaddingY={tileValuePaddingY}
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
          tilePadding={tilePadding}
          tileIconCircleSize={tileIconCircleSize}
          tileIconSize={tileIconSize}
          tileValuePaddingY={tileValuePaddingY}
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
          tilePadding={tilePadding}
          tileIconCircleSize={tileIconCircleSize}
          tileIconSize={tileIconSize}
          tileValuePaddingY={tileValuePaddingY}
        />
      </div>
    </div>
  )
}
