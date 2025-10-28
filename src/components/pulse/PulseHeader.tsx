"use client"

import { Search, Calendar, Bell, Plus, Clock } from 'lucide-react'
import React from 'react'

export type DateRangeKey = 'today' | '7d' | '30d' | '90d' | 'month'

type PulseHeaderProps = {
  userName: string
  summary?: React.ReactNode
  lastUpdated?: Date
  label?: string
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  dateRange: DateRangeKey
  onDateRangeChange?: (v: DateRangeKey) => void
  scope?: string
  onScopeChange?: (v: string) => void
  onSubscribe?: () => void
  onCreateAlert?: () => void
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
  label = 'Pulse',
  onSearch,
  searchPlaceholder = 'Buscar métricas',
  dateRange,
  onDateRangeChange,
  scope = 'Minha org',
  onScopeChange,
  onSubscribe,
  onCreateAlert
}: PulseHeaderProps) {
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
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
        <div className="w-full md:w-auto flex items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="pl-9 pr-3 py-2 w-full md:w-72 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => onDateRangeChange?.(e.target.value as DateRangeKey)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="today">Hoje</option>
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
                <option value="month">Este mês</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
              <span className="text-sm text-gray-500">Escopo</span>
              <select
                value={scope}
                onChange={(e) => onScopeChange?.(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="Minha org">Minha org</option>
                <option value="Equipe A">Equipe A</option>
                <option value="Projeto X">Projeto X</option>
              </select>
            </div>
            <button
              onClick={onSubscribe}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              <Bell className="h-4 w-4" /> Assinar resumo
            </button>
            <button
              onClick={onCreateAlert}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" /> Criar alerta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PulseHeader
