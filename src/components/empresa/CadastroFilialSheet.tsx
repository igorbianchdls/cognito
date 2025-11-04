"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { validateCNPJFormat } from "@/lib/validators"

type Props = {
  triggerLabel?: string
  onCreated?: (filialId: number) => void
}

type Empresa = { id: number; razao_social: string; nome_fantasia?: string }

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function CadastroFilialSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])

  const [empresaId, setEmpresaId] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [cnpj, setCnpj] = React.useState("")
  const [inscricaoEstadual, setInscricaoEstadual] = React.useState("")
  const [endereco, setEndereco] = React.useState("")
  const [cidade, setCidade] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [pais, setPais] = React.useState("Brasil")
  const [matriz, setMatriz] = React.useState(false)
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setEmpresaId("")
    setCodigo("")
    setNome("")
    setCnpj("")
    setInscricaoEstadual("")
    setEndereco("")
    setCidade("")
    setEstado("")
    setPais("Brasil")
    setMatriz(false)
    setAtivo(true)
    setError(null)
  }

  const loadEmpresas = React.useCallback(async () => {
    try {
      const res = await fetch('/api/empresa/empresas/list', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setEmpresas(json.rows)
      } else {
        setEmpresas([])
      }
    } catch {
      setEmpresas([])
    }
  }, [])

  React.useEffect(() => {
    if (open) loadEmpresas()
  }, [open, loadEmpresas])

  const canSave = !!empresaId && !!codigo.trim() && !!nome.trim()

  const onSave = async () => {
    if (!canSave || loading) return

    // Validações
    if (cnpj && !validateCNPJFormat(cnpj)) {
      setError('CNPJ inválido. Use o formato ##.###.###/####-## ou apenas números')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const fd = new FormData()
      fd.set('view', 'filiais')
      fd.set('empresa_id', empresaId)
      fd.set('codigo', codigo.trim())
      fd.set('nome', nome.trim())
      if (cnpj) fd.set('cnpj', cnpj.replace(/\D/g, ''))
      if (inscricaoEstadual) fd.set('inscricao_estadual', inscricaoEstadual.trim())
      if (endereco) fd.set('endereco', endereco.trim())
      if (cidade) fd.set('cidade', cidade.trim())
      if (estado) fd.set('estado', estado)
      if (pais) fd.set('pais', pais.trim())
      fd.set('matriz', String(matriz))
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/empresa/create', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const filialId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof filialId === 'number' && !Number.isNaN(filialId)) {
        onCreated?.(filialId)
      }
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
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Filial</SheetTitle>
            <SheetDescription>Preencha os dados da filial</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Empresa <span className="text-red-500">*</span></Label>
                <Select onValueChange={setEmpresaId} value={empresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Código <span className="text-red-500">*</span></Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: FIL001" />
              </div>

              <div>
                <Label>Nome <span className="text-red-500">*</span></Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Filial São Paulo" />
              </div>

              <div>
                <Label>CNPJ</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>

              <div>
                <Label>Inscrição Estadual</Label>
                <Input value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, complemento" />
              </div>

              <div>
                <Label>Cidade</Label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>

              <div>
                <Label>Estado</Label>
                <Select onValueChange={setEstado} value={estado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>País</Label>
                <Input value={pais} onChange={(e) => setPais(e.target.value)} />
              </div>

              <div className="md:col-span-2 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="matriz" checked={matriz} onCheckedChange={(checked) => setMatriz(checked === true)} />
                  <Label htmlFor="matriz" className="cursor-pointer">É matriz</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
                  <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
                </div>
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
