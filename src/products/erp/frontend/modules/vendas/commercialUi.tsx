'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'

// Peças comuns às telas comerciais da Fase 1 (tabelas de preço, comissões e devoluções).

export type Option = { id: string; nome: string }

export async function erpJson<T>(url: string, init?: { method?: string; body?: unknown; idempotent?: boolean }): Promise<T> {
  const headers: Record<string, string> = {}
  if (init?.body !== undefined) headers['Content-Type'] = 'application/json'
  if (init?.idempotent) headers['Idempotency-Key'] = crypto.randomUUID()
  return parseErpResponse<T>(await fetch(url, {
    method: init?.method || 'GET', cache: 'no-store', headers,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  }))
}

export const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback
export const currency = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
export const percent = (value: unknown) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
export const dateLabel = (value: unknown) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—'
export const toNumber = (value: string) => value.trim() === '' ? null : Number(value.replace(',', '.'))

export const primaryButtonClass = 'h-11 rounded-md bg-[#c9f20a] px-5 font-medium text-[#142000] shadow-none hover:bg-[#b9df09]'
export const inputClass = 'h-10 w-full rounded-md border border-[#dfdfdc] bg-white px-3 text-sm disabled:opacity-60'

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className || ''}`}><Label className="text-xs font-medium text-gray-600">{label}</Label>{children}</div>
}

export function NativeSelect({ value, onChange, options, placeholder, disabled, label }: {
  value: string; onChange: (value: string) => void; options: Option[]; placeholder?: string; disabled?: boolean; label?: string
}) {
  return <select aria-label={label} className={inputClass} disabled={disabled} value={value} onChange={event => onChange(event.target.value)}>
    {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
    {options.map(option => <option key={option.id} value={option.id}>{option.nome}</option>)}
  </select>
}

export function ErrorBanner({ error }: { error: string | null }) {
  return error ? <div role="alert" className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:mx-8 lg:mx-10">{error}</div> : null
}

export function DialogError({ error }: { error: string | null }) {
  return error ? <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null
}

export function DialogActions({ onCancel, onConfirm, saving, label, disabled, extra }: {
  onCancel: () => void; onConfirm: () => void; saving: boolean; label: string; disabled?: boolean; extra?: ReactNode
}) {
  return <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
    <div>{extra}</div>
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button disabled={saving || disabled} onClick={onConfirm}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{label}</Button>
    </div>
  </div>
}

// Busca de produto, serviço, categoria ou cliente pelo catálogo do ERP (até 30 resultados).
export function CatalogPicker({ type, value, label, onChange, categoryType, placeholder }: {
  type: 'produto' | 'servico' | 'categoria' | 'cliente' | 'fornecedor'; value: Option | null; label?: string
  onChange: (option: Option | null) => void; categoryType?: string; placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ tipo: type, q: query, limite: '30' })
      if (categoryType) params.set('categoria_tipo', categoryType)
      erpJson<{ records: Option[] }>(`/api/erp/catalogos/busca?${params}`)
        .then(result => { if (active) setOptions(result.records) }).catch(() => { if (active) setOptions([]) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [type, query, categoryType])
  const merged = value && !options.some(option => option.id === value.id) ? [value, ...options] : options
  return <div className="grid gap-1.5">
    <input aria-label={label ? `Pesquisar ${label}` : 'Pesquisar'} className={inputClass} placeholder={placeholder || 'Pesquisar…'} value={query} onChange={event => setQuery(event.target.value)} />
    <NativeSelect label={label} value={value?.id || ''} placeholder="Selecione" options={merged}
      onChange={id => onChange(merged.find(option => option.id === id) || null)} />
  </div>
}
