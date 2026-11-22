'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { periods } from './reports'
import type { Property } from './properties'

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[14px] text-[#6b6b6b]">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </div>
  )
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#ececec] bg-white p-5 ${className}`}>
      {title ? <h2 className="mb-3 text-[14px] font-semibold text-[#111]">{title}</h2> : null}
      {children}
    </section>
  )
}

/** Property and period, in one row above the numbers. */
export function Filters({ properties, current, onProperty, days, onDays }: { properties: Property[]; current: Property; onProperty: (id: string) => void; days?: number; onDays?: (d: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Site ou app" value={current.id} onChange={e => onProperty(e.target.value)}
        className="h-9 rounded-lg border border-[#e2e2e2] bg-white px-3 text-[14px] text-[#111]">
        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {onDays ? (
        <div role="group" aria-label="Período" className="flex rounded-lg border border-[#e2e2e2] bg-white p-0.5">
          {periods.map(p => (
            <button key={p.days} type="button" onClick={() => onDays(p.days)} aria-pressed={days === p.days}
              className={`h-8 rounded-md px-3 text-[13px] ${days === p.days ? 'bg-[#111] text-white' : 'text-[#555] hover:bg-[#f3f3f3]'}`}>{p.label}</button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** What to show while there is nothing to report yet. */
export function Notice({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'error' }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl border p-6 text-[14px] ${tone === 'error' ? 'border-[#f3d2d2] bg-[#fdf6f6] text-[#8a2b2b]' : 'border-[#ececec] bg-white text-[#555]'}`}>{children}</div>
}

export function NoProperty() {
  return <Notice>Nenhum site ou app cadastrado ainda. <Link href="/analytics/sites" className="font-medium text-[#111] underline">Cadastre o primeiro</Link> e cole o código no site.</Notice>
}

export const NotConfigured = () => <Notice>O BigQuery ainda não está conectado. Assim que a conta de serviço do GCP for configurada na Vercel, os eventos passam a ser guardados e os números aparecem aqui.</Notice>

/** A ranked list with a thin bar showing each row's share of the largest. */
export function RankTable({ rows, label, value, valueLabel, empty = 'Sem dados no período.' }: { rows: Record<string, unknown>[] | null; label: string; value: string; valueLabel: string; empty?: string }) {
  if (!rows) return <p className="text-[13px] text-[#888]">Carregando…</p>
  if (!rows.length) return <p className="text-[13px] text-[#888]">{empty}</p>
  const max = Math.max(...rows.map(r => Number(r[value]) || 0), 1)
  return (
    <table className="w-full text-[13px]">
      <thead><tr className="text-left text-[12px] text-[#888]"><th className="pb-2 font-medium">{label}</th><th className="pb-2 text-right font-medium">{valueLabel}</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-[#f3f3f3]">
            <td className="relative py-2 pr-3">
              <span aria-hidden className="absolute inset-y-1 left-0 rounded-[4px] bg-[#2a78d6]/10" style={{ width: `${(Number(r[value]) / max) * 100}%` }} />
              <span className="relative block truncate text-[#222]" title={String(Object.values(r)[0] ?? '')}>{String(Object.values(r)[0] ?? '—')}</span>
            </td>
            <td className="py-2 text-right tabular-nums text-[#222]">{(Number(r[value]) || 0).toLocaleString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
