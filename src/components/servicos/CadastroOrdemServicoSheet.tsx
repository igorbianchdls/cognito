"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroOrdemServicoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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

  const canSave = !!numeroOs.trim() && !!clienteId && !!dataAbertura
  const reset = () => { setNumeroOs(""); setClienteId(""); setTecnicoId(""); setStatus(""); setPrioridade(""); setDescricaoProblema(""); setDataAbertura(""); setDataPrevista(""); setValorEstimado(""); setValorFinal(""); setObservacoes(""); setError(null) }

  const fetchList = async (url: string): Promise<Item[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Item[] : [] } catch { return [] }
  }

  React.useEffect(() => { if (!open) return; (async () => {
    const [cls, tcs] = await Promise.all([
      fetchList('/api/modulos/servicos/clientes/list'),
      fetchList('/api/modulos/servicos/tecnicos/list'),
    ])
    setClientes(cls); setTecnicos(tcs)
  })() }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
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
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false); reset(); if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Ordem de Serviço</SheetTitle><SheetDescription>Defina os dados da OS</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Nº OS<span className="text-red-500"> *</span></Label><Input value={numeroOs} onChange={(e)=>setNumeroOs(e.target.value)} /></div>
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
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: aberto, em andamento, concluído" /></div>
              <div><Label>Prioridade</Label><Input value={prioridade} onChange={(e)=>setPrioridade(e.target.value)} placeholder="ex: baixa, média, alta" /></div>
              <div className="md:col-span-3"><Label>Descrição do Problema</Label><Textarea rows={3} value={descricaoProblema} onChange={(e)=>setDescricaoProblema(e.target.value)} /></div>
              <div><Label>Abertura<span className="text-red-500"> *</span></Label><Input type="date" value={dataAbertura} onChange={(e)=>setDataAbertura(e.target.value)} /></div>
              <div><Label>Previsão</Label><Input type="date" value={dataPrevista} onChange={(e)=>setDataPrevista(e.target.value)} /></div>
              <div><Label>Valor Estimado</Label><Input type="number" step="0.01" value={valorEstimado} onChange={(e)=>setValorEstimado(e.target.value)} /></div>
              <div><Label>Valor Final</Label><Input type="number" step="0.01" value={valorFinal} onChange={(e)=>setValorFinal(e.target.value)} /></div>
              <div className="md:col-span-3"><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
