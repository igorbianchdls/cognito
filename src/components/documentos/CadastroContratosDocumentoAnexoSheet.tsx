"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (documentoId: number) => void }
type TipoDocumento = { id: number; nome: string; categoria?: string }

export default function CadastroContratosDocumentoAnexoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
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
  const [dataInicio, setDataInicio] = React.useState("")
  const [dataFim, setDataFim] = React.useState("")
  const [prazoMeses, setPrazoMeses] = React.useState("")
  const [renovacaoAutomatica, setRenovacaoAutomatica] = React.useState("false")
  const [valorMensal, setValorMensal] = React.useState("")
  const [objeto, setObjeto] = React.useState("")
  const [clausulasJson, setClausulasJson] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)

  const resetForm = () => {
    setTenantId('1'); setTipoDocumentoId(""); setNumero(""); setDescricao(""); setDataEmissao(""); setValorTotal("")
    setStatus(""); setDataInicio(""); setDataFim(""); setPrazoMeses(""); setRenovacaoAutomatica("false")
    setValorMensal(""); setObjeto(""); setClausulasJson(""); setFile(null)
  }

  const loadTipos = React.useCallback(async () => {
    try {
      const res = await fetch('/api/documentos/tipos?categoria=contratos', { cache: 'no-store' })
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
      fd.set('view', 'contratos')
      if (tenantId) fd.set('tenant_id', tenantId)
      fd.set('tipo_documento_id', tipoDocumentoId)
      if (numero) fd.set('numero', numero)
      if (descricao) fd.set('descricao', descricao)
      if (dataEmissao) fd.set('data_emissao', dataEmissao)
      if (valorTotal) fd.set('valor_total', valorTotal)
      if (status) fd.set('status', status)
      if (dataInicio) fd.set('data_inicio', dataInicio)
      if (dataFim) fd.set('data_fim', dataFim)
      if (prazoMeses) fd.set('prazo_meses', prazoMeses)
      if (renovacaoAutomatica) fd.set('renovacao_automatica', renovacaoAutomatica)
      if (valorMensal) fd.set('valor_mensal', valorMensal)
      if (objeto) fd.set('objeto', objeto)
      if (clausulasJson) fd.set('clausulas_json', clausulasJson)
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
    <BaseCadastroSheet triggerLabel={triggerLabel} title="Cadastrar Contrato c/ Anexo" description="Preencha os campos e anexe o arquivo" widthClassName="max-w-none" onOpenChange={setIsOpen} onSubmit={onSubmit} onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; resetForm(); if (typeof id === 'number') onCreated?.(id) }}>
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} /></div>
      <div><Label>Tipo de Documento</Label><Select onValueChange={setTipoDocumentoId} value={tipoDocumentoId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tipos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Número</Label><Input value={numero} onChange={(e) => setNumero(e.target.value)} /></div>
      <div><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div><Label>Data de Emissão</Label><Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} /></div>
      <div><Label>Valor Total</Label><Input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} /></div>
      <div><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
      <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
      <div><Label>Prazo (meses)</Label><Input type="number" value={prazoMeses} onChange={(e) => setPrazoMeses(e.target.value)} /></div>
      <div><Label>Renovação Automática</Label><Select value={renovacaoAutomatica} onValueChange={setRenovacaoAutomatica}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Não</SelectItem><SelectItem value="true">Sim</SelectItem></SelectContent></Select></div>
      <div><Label>Valor Mensal</Label><Input type="number" step="0.01" value={valorMensal} onChange={(e) => setValorMensal(e.target.value)} /></div>
      <div><Label>Objeto</Label><Input value={objeto} onChange={(e) => setObjeto(e.target.value)} /></div>
      <div><Label>Cláusulas (JSON)</Label><Textarea rows={4} value={clausulasJson} onChange={(e) => setClausulasJson(e.target.value)} /></div>
      <div><Label>Arquivo (obrigatório)</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
    </BaseCadastroSheet>
  )
}
