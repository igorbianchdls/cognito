"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (documentoId: number) => void
}

type TipoDocumento = { id: number; nome: string; categoria?: string }

export default function CadastroFiscalDocumentoAnexoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [tipos, setTipos] = React.useState<TipoDocumento[]>([])

  // Campos básicos
  const [tenantId, setTenantId] = React.useState<string>('1')
  const [tipoDocumentoId, setTipoDocumentoId] = React.useState<string>("")
  const [numero, setNumero] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [dataEmissao, setDataEmissao] = React.useState("")
  const [valorTotal, setValorTotal] = React.useState("")
  const [status, setStatus] = React.useState("")

  // Campos fiscais
  const [cfop, setCfop] = React.useState("")
  const [chaveAcesso, setChaveAcesso] = React.useState("")
  const [naturezaOperacao, setNaturezaOperacao] = React.useState("")
  const [modelo, setModelo] = React.useState("")
  const [serie, setSerie] = React.useState("")
  const [dataAutorizacao, setDataAutorizacao] = React.useState("")
  const [ambiente, setAmbiente] = React.useState("")

  const [file, setFile] = React.useState<File | null>(null)

  const resetForm = () => {
    setTenantId('1')
    setTipoDocumentoId("")
    setNumero("")
    setDescricao("")
    setDataEmissao("")
    setValorTotal("")
    setStatus("")
    setCfop("")
    setChaveAcesso("")
    setNaturezaOperacao("")
    setModelo("")
    setSerie("")
    setDataAutorizacao("")
    setAmbiente("")
    setFile(null)
  }

  const loadTipos = React.useCallback(async () => {
    try {
      const res = await fetch('/api/documentos/tipos?categoria=fiscal', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        const rows = json.rows as Array<{ id: number | string; nome: string; categoria?: string | null }>
        const mapped = rows.map((r) => ({ id: Number(r.id), nome: String(r.nome), categoria: r.categoria != null ? String(r.categoria) : undefined }))
        setTipos(mapped)
      } else {
        setTipos([])
      }
    } catch {
      setTipos([])
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) loadTipos()
  }, [isOpen, loadTipos])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(file && tipoDocumentoId)) {
      return { success: false, error: 'Selecione o tipo de documento e anexe um arquivo.' }
    }
    try {
      const fd = new FormData()
      fd.set('view', 'fiscal')
      if (tenantId) fd.set('tenant_id', tenantId)
      fd.set('tipo_documento_id', tipoDocumentoId)
      if (numero) fd.set('numero', numero)
      if (descricao) fd.set('descricao', descricao)
      if (dataEmissao) fd.set('data_emissao', dataEmissao)
      if (valorTotal) fd.set('valor_total', valorTotal)
      if (status) fd.set('status', status)

      if (cfop) fd.set('cfop', cfop)
      if (chaveAcesso) fd.set('chave_acesso', chaveAcesso)
      if (naturezaOperacao) fd.set('natureza_operacao', naturezaOperacao)
      if (modelo) fd.set('modelo', modelo)
      if (serie) fd.set('serie', serie)
      if (dataAutorizacao) fd.set('data_autorizacao', dataAutorizacao)
      if (ambiente) fd.set('ambiente', ambiente)

      if (file) fd.set('file', file)

      const res = await fetch('/api/documentos/create-with-anexo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      const docId = Number(json?.documento_id)
      createdIdRef.current = Number.isNaN(docId) ? null : docId
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Documento Fiscal c/ Anexo"
      description="Preencha os campos e anexe o arquivo"
      widthClassName="max-w-none"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; resetForm(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Tenant ID</Label>
        <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
      </div>

      <div>
        <Label>Tipo de Documento</Label>
        <Select onValueChange={setTipoDocumentoId} value={tipoDocumentoId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map(t => (
              <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Número</Label>
        <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
      </div>

      <div>
        <Label>Descrição</Label>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>

      <div>
        <Label>Data de Emissão</Label>
        <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
      </div>

      <div>
        <Label>Valor Total</Label>
        <Input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
      </div>

      <div>
        <Label>Status</Label>
        <Input value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      <div>
        <Label>CFOP</Label>
        <Input value={cfop} onChange={(e) => setCfop(e.target.value)} />
      </div>

      <div>
        <Label>Chave de Acesso</Label>
        <Input value={chaveAcesso} onChange={(e) => setChaveAcesso(e.target.value)} />
      </div>

      <div>
        <Label>Natureza da Operação</Label>
        <Input value={naturezaOperacao} onChange={(e) => setNaturezaOperacao(e.target.value)} />
      </div>

      <div>
        <Label>Modelo</Label>
        <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
      </div>

      <div>
        <Label>Série</Label>
        <Input value={serie} onChange={(e) => setSerie(e.target.value)} />
      </div>

      <div>
        <Label>Data Autorização</Label>
        <Input type="datetime-local" value={dataAutorizacao} onChange={(e) => setDataAutorizacao(e.target.value)} />
      </div>

      <div>
        <Label>Ambiente</Label>
        <Input value={ambiente} onChange={(e) => setAmbiente(e.target.value)} />
      </div>

      <div>
        <Label>Arquivo (obrigatório)</Label>
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
    </BaseCadastroSheet>
  )
}
