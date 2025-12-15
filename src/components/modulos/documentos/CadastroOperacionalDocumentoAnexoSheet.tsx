"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (documentoId: number) => void
}

type TipoDocumento = { id: number; nome: string; categoria?: string }

export default function CadastroOperacionalDocumentoAnexoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
  const [tipos, setTipos] = React.useState<TipoDocumento[]>([])

  const [tenantId, setTenantId] = React.useState<string>('1')
  const [tipoDocumentoId, setTipoDocumentoId] = React.useState<string>("")
  const [numero, setNumero] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [dataEmissao, setDataEmissao] = React.useState("")
  const [valorTotal, setValorTotal] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [responsavelId, setResponsavelId] = React.useState("")
  const [localExecucao, setLocalExecucao] = React.useState("")
  const [dataExecucao, setDataExecucao] = React.useState("")
  const [checklistJson, setChecklistJson] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)

  const resetForm = () => {
    setTenantId('1'); setTipoDocumentoId(""); setNumero(""); setDescricao(""); setDataEmissao(""); setValorTotal("")
    setStatus(""); setResponsavelId(""); setLocalExecucao(""); setDataExecucao(""); setChecklistJson(""); setObservacoes(""); setFile(null)
  }

  const loadTipos = React.useCallback(async () => {
    try {
      const res = await fetch('/api/documentos/tipos?categoria=operacional', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        const rows = json.rows as Array<{ id: number | string; nome: string; categoria?: string | null }>
        setTipos(rows.map((r) => ({ id: Number(r.id), nome: String(r.nome), categoria: r.categoria ? String(r.categoria) : undefined })))
      } else setTipos([])
    } catch { setTipos([]) }
  }, [])

  React.useEffect(() => { if (isOpen) loadTipos() }, [isOpen, loadTipos])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(file && tipoDocumentoId)) return { success: false, error: 'Selecione o tipo de documento e anexe um arquivo.' }
    try {
      const fd = new FormData()
      fd.set('view', 'operacional')
      if (tenantId) fd.set('tenant_id', tenantId)
      fd.set('tipo_documento_id', tipoDocumentoId)
      if (numero) fd.set('numero', numero)
      if (descricao) fd.set('descricao', descricao)
      if (dataEmissao) fd.set('data_emissao', dataEmissao)
      if (valorTotal) fd.set('valor_total', valorTotal)
      if (status) fd.set('status', status)
      if (responsavelId) fd.set('responsavel_id', responsavelId)
      if (localExecucao) fd.set('local_execucao', localExecucao)
      if (dataExecucao) fd.set('data_execucao', dataExecucao)
      if (checklistJson) fd.set('checklist_json', checklistJson)
      if (observacoes) fd.set('observacoes', observacoes)
      if (file) fd.set('file', file)

      const res = await fetch('/api/documentos/create-with-anexo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      createdIdRef.current = Number.isNaN(Number(json?.documento_id)) ? null : Number(json?.documento_id)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet triggerLabel={triggerLabel} title="Cadastrar Documento Operacional c/ Anexo" description="Preencha os campos e anexe o arquivo" widthClassName="max-w-none" onOpenChange={setIsOpen} onSubmit={onSubmit} onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; resetForm(); if (typeof id === 'number') onCreated?.(id) }}>
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} /></div>
      <div><Label>Tipo de Documento</Label><Select onValueChange={setTipoDocumentoId} value={tipoDocumentoId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tipos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Número</Label><Input value={numero} onChange={(e) => setNumero(e.target.value)} /></div>
      <div><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div><Label>Data de Emissão</Label><Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} /></div>
      <div><Label>Valor Total</Label><Input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} /></div>
      <div><Label>Responsável ID</Label><Input value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} /></div>
      <div><Label>Local de Execução</Label><Input value={localExecucao} onChange={(e) => setLocalExecucao(e.target.value)} /></div>
      <div><Label>Data Execução</Label><Input type="date" value={dataExecucao} onChange={(e) => setDataExecucao(e.target.value)} /></div>
      <div><Label>Checklist (JSON)</Label><Textarea rows={4} value={checklistJson} onChange={(e) => setChecklistJson(e.target.value)} /></div>
      <div><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
      <div><Label>Arquivo (obrigatório)</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
    </BaseCadastroSheet>
  )
}
