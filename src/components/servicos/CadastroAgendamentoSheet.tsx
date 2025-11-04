"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type OS = { id: number; numero_os: string }
type Item = { id: number; nome: string }

export default function CadastroAgendamentoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [ordens, setOrdens] = React.useState<OS[]>([])
  const [tecnicos, setTecnicos] = React.useState<Item[]>([])

  const [ordemId, setOrdemId] = React.useState("")
  const [tecnicoId, setTecnicoId] = React.useState("")
  const [dataAgendada, setDataAgendada] = React.useState("")
  const [dataInicio, setDataInicio] = React.useState("")
  const [dataFim, setDataFim] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!ordemId && !!tecnicoId && !!dataAgendada
  const reset = () => { setOrdemId(""); setTecnicoId(""); setDataAgendada(""); setDataInicio(""); setDataFim(""); setStatus(""); setObservacoes(""); setError(null) }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => { if (!open) return; (async () => {
    const [os, tec] = await Promise.all([
      fetchList<OS>('/api/modulos/servicos/ordens-servico/list'),
      fetchList<Item>('/api/modulos/servicos/tecnicos/list'),
    ])
    setOrdens(os); setTecnicos(tec)
  })() }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('ordem_servico_id', ordemId)
      fd.set('tecnico_id', tecnicoId)
      fd.set('data_agendada', dataAgendada)
      if (dataInicio) fd.set('data_inicio', dataInicio)
      if (dataFim) fd.set('data_fim', dataFim)
      if (status) fd.set('status', status.trim())
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/servicos/agendamentos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false); reset(); if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Agendamento</SheetTitle><SheetDescription>Defina os dados do agendamento</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Ordem de Serviço<span className="text-red-500"> *</span></Label>
                <Select value={ordemId} onValueChange={setOrdemId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a OS" /></SelectTrigger>
                  <SelectContent>{ordens.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.numero_os}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Técnico<span className="text-red-500"> *</span></Label>
                <Select value={tecnicoId} onValueChange={setTecnicoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o técnico" /></SelectTrigger>
                  <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data Agendada<span className="text-red-500"> *</span></Label><Input type="datetime-local" value={dataAgendada} onChange={(e)=>setDataAgendada(e.target.value)} /></div>
              <div><Label>Início</Label><Input type="datetime-local" value={dataInicio} onChange={(e)=>setDataInicio(e.target.value)} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={dataFim} onChange={(e)=>setDataFim(e.target.value)} /></div>
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: agendado, concluído" /></div>
              <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
