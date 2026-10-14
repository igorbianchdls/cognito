'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { parseErpResponse } from '../services/erpProfessionalClient'

type Option = { value: string; label: string }
export function ErpAccountingSelect({ value, selectedLabel, kind = 'analitica', exclude, classification, onChange }: {
  value: string; selectedLabel?: string; kind?: 'analitica' | 'sintetica'; exclude?: string;
  classification?: string; onChange: (value: string) => void
}) {
  const [open,setOpen] = useState(false),[query,setQuery] = useState(''),[page,setPage] = useState(1)
  const search = useDeferredValue(query)
  const [options,setOptions] = useState<Option[]>([]),[hasMore,setHasMore] = useState(false)
  const [loading,setLoading] = useState(false),[error,setError] = useState<string | null>(null)
  const [choice,setChoice] = useState<Option | null>(null)
  const chosen = value && value !== 'nenhuma' ? (choice?.value === value ? choice.label : selectedLabel || `Conta selecionada: ${value}`) : 'Sem vínculo'
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true); setError(null); setOptions([])
    const params = new URLSearchParams({tipo:kind,q:search,page:String(page)})
    if (exclude) params.set('excluir',exclude)
    if (classification) params.set('classificacao',classification)
    void fetch(`/api/erp/catalogos/contas-contabeis?${params}`,{cache:'no-store',signal:controller.signal})
      .then(response=>parseErpResponse<{options:Option[];hasMore:boolean}>(response))
      .then(body=>{if(!controller.signal.aborted){setOptions(body.options);setHasMore(body.hasMore)}})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error ? e.message : 'Não foi possível buscar as contas.')})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[open,search,page,kind,exclude,classification])
  return <Popover open={open} onOpenChange={next=>{setOpen(next);if(next){setQuery('');setPage(1)}}}>
    <PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
      <span className="truncate">{chosen}</span><ChevronsUpDown className="ml-2 size-4 shrink-0 text-gray-500" />
    </Button></PopoverTrigger>
    <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-2" align="start">
      <Input aria-label="Buscar conta contábil" placeholder="Buscar por código ou nome" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} />
      <button type="button" className="mt-1 w-full rounded px-2 py-2 text-left text-sm hover:bg-gray-100" onClick={()=>{onChange('nenhuma');setChoice(null);setOpen(false)}}>Sem vínculo</button>
      {loading ? <p className="flex items-center gap-2 p-2 text-sm text-gray-500"><Loader2 className="size-4 animate-spin" />Buscando…</p> : null}
      {error ? <p role="alert" className="p-2 text-sm text-rose-700">{error}</p> : null}
      <div className="max-h-56 overflow-y-auto">
        {!loading && !error && !options.length ? <p className="p-2 text-sm text-gray-500">Nenhuma conta disponível.</p> : null}
        {!loading && !error ? options.map(option=><button type="button" key={option.value} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-gray-100" onClick={()=>{setChoice(option);onChange(option.value);setOpen(false)}}>
          <span className="flex-1">{option.label}</span>{value === option.value ? <Check className="size-4" /> : null}
        </button>) : null}
      </div>
      <div className="mt-1 flex items-center justify-between border-t pt-2">
        <Button type="button" variant="ghost" size="sm" disabled={loading || page === 1} onClick={()=>setPage(page-1)}>Anterior</Button>
        <span className="text-xs text-gray-500">Página {page}</span>
        <Button type="button" variant="ghost" size="sm" disabled={loading || Boolean(error) || !hasMore} onClick={()=>setPage(page+1)}>Próxima</Button>
      </div>
    </PopoverContent>
  </Popover>
}
