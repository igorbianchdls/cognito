"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = {
  triggerLabel?: string
  onCreated?: (documentoId: number) => void
}

type TipoDocumento = { id: number; nome: string; categoria?: string }

export default function CadastroFiscalDocumentoAnexoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [tipos, setTipos] = React.useState<TipoDocumento[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
    setError(null)
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
    if (open) loadTipos()
  }, [open, loadTipos])

  const canSave = !!file && !!tipoDocumentoId

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
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
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const docId = Number(json?.documento_id)
      setOpen(false)
      resetForm()
      if (typeof docId === 'number' && !Number.isNaN(docId)) onCreated?.(docId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-none p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Documento Fiscal c/ Anexo</SheetTitle>
            <SheetDescription>Preencha os campos e anexe o arquivo</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
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
            </div>

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>

          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={onSave} disabled={!canSave || loading}>
              {loading ? 'Salvando…' : 'Salvar'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
