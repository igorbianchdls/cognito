"use client"

import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, SlidersHorizontal, Eye } from 'lucide-react'
import { $reportsFilters, reportsFiltersActions, type ReportsCadence, type ReportsView } from '@/stores/reportsFiltersStore'

function fmt(d?: Date) {
  return d ? d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
}

export default function ReportsFiltersBar() {
  const state = useStore($reportsFilters)

  const periodLabel = useMemo(() => {
    const from = state.dateRange?.from
    const to = state.dateRange?.to
    if (from && to) return `${fmt(from)} – ${fmt(to)}`
    if (from && !to) return `De ${fmt(from)}`
    if (!from && to) return `Até ${fmt(to)}`
    return 'Período'
  }, [state.dateRange?.from, state.dateRange?.to])

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 px-3 gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{periodLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="p-2">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={state.dateRange?.from ? ({ from: state.dateRange.from, to: state.dateRange.to } as DateRange) : undefined}
              onSelect={(range?: DateRange) => {
                reportsFiltersActions.setDateRange(range ? { from: range.from, to: range.to } : undefined)
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Cadence */}
        <Select value={state.cadence} onValueChange={(v: ReportsCadence) => reportsFiltersActions.setCadence(v)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Cadência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="trimestral">Trimestral</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters (placeholder popover) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 px-3 gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="p-3 w-72">
            <div className="text-sm text-gray-700 mb-2">Filtros rápidos</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Centro de Custo</span>
                <Button variant="outline" size="sm" className="h-7">Selecionar</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Contas</span>
                <Button variant="outline" size="sm" className="h-7">Selecionar</Button>
              </div>
              <div className="text-xs text-gray-500">Em breve: filtros detalhados</div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Report View */}
        <Select value={state.view} onValueChange={(v: ReportsView) => reportsFiltersActions.setView(v)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Report View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="valores">Valores</SelectItem>
            <SelectItem value="percentual">% Receita</SelectItem>
            <SelectItem value="comparativo">Comparativo</SelectItem>
          </SelectContent>
        </Select>

        {/* Visualizar */}
        <Button variant="outline" className="h-9 ml-auto gap-2">
          <Eye className="w-4 h-4" />
          Atualizar visão
        </Button>
      </div>
    </div>
  )
}

