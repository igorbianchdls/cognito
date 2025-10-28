"use client"

import { Clock } from 'lucide-react'
import React from 'react'

type PulseHeaderProps = {
  userName: string
  summary?: React.ReactNode
  lastUpdated?: Date
}

function formatTimeAgo(date?: Date): string {
  if (!date) return ''
  const diffMs = Date.now() - date.getTime()
  const mins = Math.max(0, Math.floor(diffMs / 60000))
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  return `${hrs} h`
}

export function PulseHeader({
  userName,
  summary,
  lastUpdated,
}: PulseHeaderProps) {
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  const todayLabel = (() => {
    const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
    return `Hoje, ${fmt.format(new Date())}`
  })()

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <div className="text-lg font-normal text-gray-500">{todayLabel}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mt-1">
          {greeting}, {userName}
        </h1>
        {(summary || lastUpdated) && (
          <div className="mt-2 flex items-center gap-3 flex-wrap text-sm">
            {summary && (
              <p className="text-gray-600 max-w-3xl">{summary}</p>
            )}
            {lastUpdated && (
              <span className="inline-flex items-center gap-1 text-gray-500">
                <Clock className="h-4 w-4" /> Atualizado há {formatTimeAgo(lastUpdated)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PulseHeader
