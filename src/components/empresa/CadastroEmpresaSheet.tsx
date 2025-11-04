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
  onCreated?: (empresaId: number) => void
}

const REGIMES_TRIBUTARIOS = [
  { value: 'simples', label: 'Simples Nacional' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
]

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function CadastroEmpresaSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [razaoSocial, setRazaoSocial] = React.useState("")
  const [nomeFantasia, setNomeFantasia] = React.useState("")
  const [cnpj, setCnpj] = React.useState("")
  const [inscricaoEstadual, setInscricaoEstadual] = React.useState("")
  const [regimeTributario, setRegimeTributario] = React.useState("")
  const [endereco, setEndereco] = React.useState("")
  const [cidade, setCidade] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [pais, setPais] = React.useState("Brasil")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setRazaoSocial("")
    setNomeFantasia("")
    setCnpj("")
    setInscricaoEstadual("")
    setRegimeTributario("")
    setEndereco("")
    setCidade("")
    setEstado("")
    setPais("Brasil")
    setAtivo(true)
    setError(null)
  }

  const canSave = !!razaoSocial.trim()

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
      fd.set('view', 'dados')
      fd.set('razao_social', razaoSocial.trim())
      if (nomeFantasia) fd.set('nome_fantasia', nomeFantasia.trim())
      if (cnpj) fd.set('cnpj', cnpj.replace(/\D/g, ''))
      if (inscricaoEstadual) fd.set('inscricao_estadual', inscricaoEstadual.trim())
      if (regimeTributario) fd.set('regime_tributario', regimeTributario)
      if (endereco) fd.set('endereco', endereco.trim())
      if (cidade) fd.set('cidade', cidade.trim())
      if (estado) fd.set('estado', estado)
      if (pais) fd.set('pais', pais.trim())
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/empresa/create', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const empresaId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof empresaId === 'number' && !Number.isNaN(empresaId)) {
        onCreated?.(empresaId)
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
            <SheetTitle>Cadastrar Empresa</SheetTitle>
            <SheetDescription>Preencha os dados cadastrais da empresa</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Razão Social <span className="text-red-500">*</span></Label>
                <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Ex: Empresa LTDA" />
              </div>

              <div>
                <Label>Nome Fantasia</Label>
                <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Ex: Minha Empresa" />
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

              <div>
                <Label>Regime Tributário</Label>
                <Select onValueChange={setRegimeTributario} value={regimeTributario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIMES_TRIBUTARIOS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Endereço</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, complemento" />
              </div>

              <div>
                <Label>Cidade</Label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>

              <div>
                <Label>País</Label>
                <Input value={pais} onChange={(e) => setPais(e.target.value)} />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
                <Label htmlFor="ativo" className="cursor-pointer">Empresa ativa</Label>
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
