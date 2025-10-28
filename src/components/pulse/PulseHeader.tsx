"use client"

import { Clock } from 'lucide-react'
import React from 'react'

type PulseHeaderProps = {
  userName: string
  summary?: React.ReactNode
  lastUpdated?: Date
  avatarUrl?: string
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
  avatarUrl,
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
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {greeting}, {userName}
          </h1>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-10 w-10 rounded-full ring-1 ring-gray-200 object-cover shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full ring-1 ring-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium shrink-0">
              {userName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        {(summary || lastUpdated) && (
          <div className="mt-2 text-sm">
            {summary && (
              <p className="text-gray-600 w-full leading-relaxed">{summary}</p>
            )}
            {lastUpdated && (
              <div className="mt-1 inline-flex items-center gap-1 text-gray-500">
                <Clock className="h-4 w-4" /> Atualizado há {formatTimeAgo(lastUpdated)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PulseHeader
