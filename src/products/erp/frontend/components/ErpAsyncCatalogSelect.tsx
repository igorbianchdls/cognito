'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type ErpCatalogRecord = {
  id: string
  nome: string
  documento?: string
  codigo?: string
  unidade?: string
  valor_padrao?: number
  email?: string
  celular?: string
  telefone?: string
  contato_cobranca_emails?: string[]
  contato_cobranca_whatsapp?: string
}

export function ErpAsyncCatalogSelect({ label, type, value, selectedLabel, categoryType, onChange }: {
  label?: string
  type: 'cliente' | 'fornecedor' | 'produto' | 'servico' | 'categoria'
  value: string
  selectedLabel?: string
  categoryType?: string
  onChange: (value: string, record: ErpCatalogRecord) => void
}) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [records, setRecords] = useState<ErpCatalogRecord[]>([])
  const [choiceLabel, setChoiceLabel] = useState(selectedLabel || '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!value) setChoiceLabel('')
    else if (selectedLabel) setChoiceLabel(selectedLabel)
  }, [selectedLabel, value])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const params = new URLSearchParams({ tipo: type, q: deferredQuery, limite: '30' })
    if (categoryType) params.set('categoria_tipo', categoryType)
    setLoading(true)
    fetch(`/api/erp/catalogos/busca?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { records?: ErpCatalogRecord[]; error?: string }
        if (!response.ok) throw new Error(body.error || 'Nao foi possivel buscar o catalogo.')
        setRecords(body.records || [])
      })
      .catch((error) => { if (error instanceof Error && error.name !== 'AbortError') setRecords([]) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [categoryType, deferredQuery, open, type])

  const control = <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
    <Input
      value={open ? query : choiceLabel}
      placeholder={value && !choiceLabel ? `Selecionado: ${value}` : 'Buscar por nome ou codigo'}
      role="combobox"
      aria-expanded={open}
      className="pl-9"
      onFocus={() => { setQuery(''); setOpen(true) }}
      onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
    />
    {open ? <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white p-1 shadow-lg">
      {loading ? <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500"><Loader2 className="size-4 animate-spin" />Buscando</div> : null}
      {!loading && !records.length ? <div className="px-3 py-2 text-sm text-gray-500">Nenhum resultado.</div> : null}
      {!loading ? records.map((record) => {
        const detail = record.documento || record.codigo
        return <button
          key={record.id}
          type="button"
          className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setChoiceLabel(detail ? `${record.nome} - ${detail}` : record.nome)
            setOpen(false)
            onChange(record.id, record)
          }}
        >
          <span className="block text-gray-900">{record.nome}</span>
          {detail ? <span className="block text-xs text-gray-500">{detail}</span> : null}
        </button>
      }) : null}
    </div> : null}
  </div>

  return label ? <div className="grid gap-2"><Label>{label}</Label>{control}</div> : control
}
