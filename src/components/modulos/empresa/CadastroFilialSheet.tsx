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
  onCreated?: (filialId: number) => void
}

type Empresa = { id: number; razao_social: string; nome_fantasia?: string }

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function CadastroFilialSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
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
    if (isOpen) loadEmpresas()
  }, [isOpen, loadEmpresas])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(empresaId && codigo.trim() && nome.trim())) {
      return { success: false, error: 'Preencha empresa, código e nome' }
    }

    if (cnpj && !validateCNPJFormat(cnpj)) {
      return { success: false, error: 'CNPJ inválido. Use o formato ##.###.###/####-## ou apenas números' }
    }

    try {
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
      title="Cadastrar Filial"
      description="Preencha os dados da filial"
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
      <div className="md:col-span-2">
        <Label>Empresa <span className="text-red-500">*</span></Label>
        <Select onValueChange={setEmpresaId} value={empresaId}>
          <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
          <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent>
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
        <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
      </div>
      <div>
        <Label>Inscrição Estadual</Label>
        <Input value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} />
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
        <Label>Estado</Label>
        <Select onValueChange={setEstado} value={estado}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>País</Label>
        <Input value={pais} onChange={(e) => setPais(e.target.value)} />
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="matriz" checked={matriz} onCheckedChange={(checked) => setMatriz(checked === true)} />
          <Label htmlFor="matriz" className="cursor-pointer">É matriz</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
          <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
        </div>
      </div>
    </BaseCadastroSheet>
  )
}
