"use client"

import React, { useState } from 'react'
import KPICard from '@/components/widgets/KPICard'
import { UserPlus, Star, Droplet, Timer } from 'lucide-react'

export default function BigQueryKPIDemoPage() {
  const [tilePaddingX, setTilePaddingX] = useState<number>(16)
  const [tilePaddingY, setTilePaddingY] = useState<number>(16)
  const [tileValuePaddingY, setTileValuePaddingY] = useState<number>(4)
  const [borderVariant, setBorderVariant] = useState<'smooth' | 'accent'>('smooth')
  const [tileBorderRadius, setTileBorderRadius] = useState<number>(12)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">KPIs (Mock) — BigQuery Test</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">Padding X
          <input type="number" className="border rounded px-2 py-1 w-20" value={tilePaddingX} onChange={(e) => setTilePaddingX(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">Padding Y
          <input type="number" className="border rounded px-2 py-1 w-20" value={tilePaddingY} onChange={(e) => setTilePaddingY(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">Value py
          <input type="number" className="border rounded px-2 py-1 w-20" value={tileValuePaddingY} onChange={(e) => setTileValuePaddingY(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2">Borda
          <select className="border rounded px-2 py-1" value={borderVariant} onChange={(e) => setBorderVariant(e.target.value as 'smooth' | 'accent')}>
            <option value="smooth">Suave (atual)</option>
            <option value="accent">Cantos acentuados (anterior)</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Radius
          <input type="number" className="border rounded px-2 py-1 w-20" value={tileBorderRadius} onChange={(e) => setTileBorderRadius(Number(e.target.value))} />
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
          tilePaddingX={tilePaddingX}
          tilePaddingY={tilePaddingY}
          tileValuePaddingY={tileValuePaddingY}
          borderVariant={borderVariant}
          tileBorderRadius={tileBorderRadius}
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
          tilePaddingX={tilePaddingX}
          tilePaddingY={tilePaddingY}
          tileValuePaddingY={tileValuePaddingY}
          borderVariant={borderVariant}
          tileBorderRadius={tileBorderRadius}
        />
        <KPICard
          variant="tile"
          success
          name="Week 1 Retention"
          currentValue={4.53}
          unit="%"
          decimals={2}
          changePct={-10.7}
          tilePaddingX={tilePaddingX}
          tilePaddingY={tilePaddingY}
          tileValuePaddingY={tileValuePaddingY}
          borderVariant={borderVariant}
          tileBorderRadius={tileBorderRadius}
        />
        <KPICard
          variant="tile"
          success
          name="Session"
          currentValue={0.9}
          unit="sec"
          decimals={1}
          changePct={29}
          tilePaddingX={tilePaddingX}
          tilePaddingY={tilePaddingY}
          tileValuePaddingY={tileValuePaddingY}
          borderVariant={borderVariant}
          tileBorderRadius={tileBorderRadius}
        />
      </div>
    </div>
  )
}
