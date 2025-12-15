"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type OS = { id: number; numero_os: string }
type Item = { id: number; nome: string }

export default function CadastroAgendamentoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
  const [ordens, setOrdens] = React.useState<OS[]>([])
  const [tecnicos, setTecnicos] = React.useState<Item[]>([])

  const [ordemId, setOrdemId] = React.useState("")
  const [tecnicoId, setTecnicoId] = React.useState("")
  const [dataAgendada, setDataAgendada] = React.useState("")
  const [dataInicio, setDataInicio] = React.useState("")
  const [dataFim, setDataFim] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const resetForm = () => {
    setOrdemId(""); setTecnicoId(""); setDataAgendada(""); setDataInicio("")
    setDataFim(""); setStatus(""); setObservacoes("")
  }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : []
    } catch {
      return [] as T[]
    }
  }

  React.useEffect(() => {
    if (!isOpen) return
    (async () => {
      const [os, tec] = await Promise.all([
        fetchList<OS>('/api/modulos/servicos/ordens-servico/list'),
        fetchList<Item>('/api/modulos/servicos/tecnicos/list'),
      ])
      setOrdens(os); setTecnicos(tec)
    })()
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(ordemId && tecnicoId && dataAgendada)) {
      return { success: false, error: 'Preencha ordem de serviço, técnico e data agendada' }
    }

    try {
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

      if (!res.ok || !json?.success) {
        return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      }

      createdIdRef.current = Number.isNaN(Number(json?.id)) ? null : Number(json?.id)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Agendamento"
      description="Defina os dados do agendamento"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => {
        const id = createdIdRef.current
        createdIdRef.current = null
        resetForm()
        if (typeof id === 'number') onCreated?.(id)
      }}
    >
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
      <div><Label>Data Agendada<span className="text-red-500"> *</span></Label><Input type="datetime-local" value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} /></div>
      <div><Label>Início</Label><Input type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
      <div><Label>Fim</Label><Input type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: agendado, concluído" /></div>
      <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
    </BaseCadastroSheet>
  )
}
