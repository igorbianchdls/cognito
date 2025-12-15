"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { validateCNPJFormat } from "@/lib/validators"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

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
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

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
  }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!razaoSocial.trim()) return { success: false, error: 'Razão social é obrigatória' }

    if (cnpj && !validateCNPJFormat(cnpj)) {
      return { success: false, error: 'CNPJ inválido. Use o formato ##.###.###/####-## ou apenas números' }
    }

    try {
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
      title="Cadastrar Empresa"
      description="Preencha os dados cadastrais da empresa"
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
        <Label>Razão Social <span className="text-red-500">*</span></Label>
        <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Ex: Empresa LTDA" />
      </div>
      <div>
        <Label>Nome Fantasia</Label>
        <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Ex: Minha Empresa" />
      </div>
      <div>
        <Label>CNPJ</Label>
        <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
      </div>
      <div>
        <Label>Inscrição Estadual</Label>
        <Input value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} />
      </div>
      <div>
        <Label>Regime Tributário</Label>
        <Select onValueChange={setRegimeTributario} value={regimeTributario}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{REGIMES_TRIBUTARIOS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Estado</Label>
        <Select onValueChange={setEstado} value={estado}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
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
    </BaseCadastroSheet>
  )
}
