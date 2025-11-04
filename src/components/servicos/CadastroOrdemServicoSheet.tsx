"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroOrdemServicoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
  const [clientes, setClientes] = React.useState<Item[]>([])
  const [tecnicos, setTecnicos] = React.useState<Item[]>([])

  const [numeroOs, setNumeroOs] = React.useState("")
  const [clienteId, setClienteId] = React.useState("")
  const [tecnicoId, setTecnicoId] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [prioridade, setPrioridade] = React.useState("")
  const [descricaoProblema, setDescricaoProblema] = React.useState("")
  const [dataAbertura, setDataAbertura] = React.useState("")
  const [dataPrevista, setDataPrevista] = React.useState("")
  const [valorEstimado, setValorEstimado] = React.useState("")
  const [valorFinal, setValorFinal] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const resetForm = () => {
    setNumeroOs(""); setClienteId(""); setTecnicoId(""); setStatus(""); setPrioridade("")
    setDescricaoProblema(""); setDataAbertura(""); setDataPrevista(""); setValorEstimado("")
    setValorFinal(""); setObservacoes("")
  }

  const fetchList = async (url: string): Promise<Item[]> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Item[] : []
    } catch {
      return []
    }
  }

  React.useEffect(() => {
    if (!isOpen) return
    (async () => {
      const [cls, tcs] = await Promise.all([
        fetchList('/api/modulos/servicos/clientes/list'),
        fetchList('/api/modulos/servicos/tecnicos/list'),
      ])
      setClientes(cls); setTecnicos(tcs)
    })()
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(numeroOs.trim() && clienteId && dataAbertura)) {
      return { success: false, error: 'Preencha número da OS, cliente e data de abertura' }
    }

    try {
      const fd = new FormData()
      fd.set('numero_os', numeroOs.trim())
      fd.set('cliente_id', clienteId)
      if (tecnicoId) fd.set('tecnico_responsavel_id', tecnicoId)
      if (status) fd.set('status', status.trim())
      if (prioridade) fd.set('prioridade', prioridade.trim())
      if (descricaoProblema) fd.set('descricao_problema', descricaoProblema.trim())
      fd.set('data_abertura', dataAbertura)
      if (dataPrevista) fd.set('data_prevista', dataPrevista)
      if (valorEstimado) fd.set('valor_estimado', valorEstimado)
      if (valorFinal) fd.set('valor_final', valorFinal)
      if (observacoes) fd.set('observacoes', observacoes.trim())

      const res = await fetch('/api/modulos/servicos/ordens-servico', { method: 'POST', body: fd })
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
      title="Cadastrar Ordem de Serviço"
      description="Defina os dados da OS"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => {
        const id = createdIdRef.current
        createdIdRef.current = null
        resetForm()
        if (typeof id === 'number') onCreated?.(id)
      }}
    >
      <div><Label>Nº OS<span className="text-red-500"> *</span></Label><Input value={numeroOs} onChange={(e) => setNumeroOs(e.target.value)} /></div>
      <div>
        <Label>Cliente<span className="text-red-500"> *</span></Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
          <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Técnico Responsável</Label>
        <Select value={tecnicoId} onValueChange={setTecnicoId}>
          <SelectTrigger><SelectValue placeholder="Selecione o técnico" /></SelectTrigger>
          <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: aberto, em andamento, concluído" /></div>
      <div><Label>Prioridade</Label><Input value={prioridade} onChange={(e) => setPrioridade(e.target.value)} placeholder="ex: baixa, média, alta" /></div>
      <div className="md:col-span-3"><Label>Descrição do Problema</Label><Textarea rows={3} value={descricaoProblema} onChange={(e) => setDescricaoProblema(e.target.value)} /></div>
      <div><Label>Abertura<span className="text-red-500"> *</span></Label><Input type="date" value={dataAbertura} onChange={(e) => setDataAbertura(e.target.value)} /></div>
      <div><Label>Previsão</Label><Input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} /></div>
      <div><Label>Valor Estimado</Label><Input type="number" step="0.01" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} /></div>
      <div><Label>Valor Final</Label><Input type="number" step="0.01" value={valorFinal} onChange={(e) => setValorFinal(e.target.value)} /></div>
      <div className="md:col-span-3"><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
    </BaseCadastroSheet>
  )
}
