'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/products/analytics/frontend/ui'
import type { Hours } from '../shared/flows'
import { deniedMessage, supabase } from './data'

const DAYS = [['seg', 'Segunda'], ['ter', 'Terça'], ['qua', 'Quarta'], ['qui', 'Quinta'], ['sex', 'Sexta'], ['sab', 'Sábado'], ['dom', 'Domingo']] as const
type Day = (typeof DAYS)[number][0]
type Row = { open: boolean; from: string; to: string }
const DEFAULT: Record<Day, Row> = { seg: { open: true, from: '09:00', to: '18:00' }, ter: { open: true, from: '09:00', to: '18:00' }, qua: { open: true, from: '09:00', to: '18:00' },
  qui: { open: true, from: '09:00', to: '18:00' }, sex: { open: true, from: '09:00', to: '18:00' }, sab: { open: false, from: '09:00', to: '13:00' }, dom: { open: false, from: '09:00', to: '13:00' } }

/** When the team answers; automations use it ("fora do horário" trigger and condition). */
export function BusinessHoursCard() {
  const { orgId, isLoaded } = useAuth()
  const [always, setAlways] = useState(true)
  const [rows, setRows] = useState(DEFAULT)
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void supabase().from('settings').select('business_hours').eq('workspace_id', orgId).maybeSingle().then(r => {
      if (!live) return
      const h = r.data?.business_hours as Hours | undefined
      if (!h) return
      setAlways(false)
      setRows(Object.fromEntries(DAYS.map(([d]) => [d, h[d]?.[0] ? { open: true, from: h[d]![0][0], to: h[d]![0][1] } : { ...DEFAULT[d], open: false }])) as Record<Day, Row>)
    })
    return () => { live = false }
  }, [isLoaded, orgId])
  async function save() {
    if (!always && DAYS.some(([d]) => rows[d].open && rows[d].from >= rows[d].to)) return setMessage('Em cada dia aberto, o fim precisa ser depois do início.')
    const business_hours = always ? null : Object.fromEntries(DAYS.filter(([d]) => rows[d].open).map(([d]) => [d, [[rows[d].from, rows[d].to]]]))
    const { error } = await supabase().from('settings').upsert({ workspace_id: orgId, business_hours })
    setMessage(error ? deniedMessage(error, 'Não foi possível salvar.') : 'Horário salvo.')
  }
  return (
    <Card title="Horário de atendimento">
      <p className="mb-3 text-[13px] text-[#666]">Usado pelas automações “Fora do horário” (horário de Brasília).</p>
      <label className="mb-3 flex items-center gap-2 text-[14px]"><input type="checkbox" checked={always} onChange={e => setAlways(e.target.checked)} />Atendemos sempre (24 h)</label>
      {!always ? (
        <div className="grid gap-1.5">
          {DAYS.map(([d, label]) => (
            <div key={d} className="flex items-center gap-2 text-[13px]">
              <label className="flex w-28 items-center gap-2"><input type="checkbox" checked={rows[d].open} onChange={e => setRows({ ...rows, [d]: { ...rows[d], open: e.target.checked } })} />{label}</label>
              <input type="time" value={rows[d].from} disabled={!rows[d].open} onChange={e => setRows({ ...rows, [d]: { ...rows[d], from: e.target.value } })} aria-label={`${label}: início`} className="h-8 rounded-md border border-[#e2e2e2] px-2 disabled:opacity-40" />
              <span>às</span>
              <input type="time" value={rows[d].to} disabled={!rows[d].open} onChange={e => setRows({ ...rows, [d]: { ...rows[d], to: e.target.value } })} aria-label={`${label}: fim`} className="h-8 rounded-md border border-[#e2e2e2] px-2 disabled:opacity-40" />
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => void save()} className="mt-4 h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar horário</button>
      {message ? <p role="status" className="mt-2 text-[13px] text-[#555]">{message}</p> : null}
    </Card>
  )
}
