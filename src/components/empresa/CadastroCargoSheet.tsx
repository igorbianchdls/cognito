"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (cargoId: number) => void
}

type Empresa = { id: number; razao_social: string; nome_fantasia?: string }
type Departamento = { id: number; nome: string; codigo?: string }

const NIVEIS = [
  { value: 'operacional', label: 'Operacional' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'gerencial', label: 'Gerencial' },
  { value: 'diretoria', label: 'Diretoria' },
]

export default function CadastroCargoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [departamentos, setDepartamentos] = React.useState<Departamento[]>([])

  const [empresaId, setEmpresaId] = React.useState("")
  const [departamentoId, setDepartamentoId] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [nivel, setNivel] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setEmpresaId("")
    setDepartamentoId("")
    setCodigo("")
    setNome("")
    setNivel("")
    setDescricao("")
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

  const loadDepartamentos = React.useCallback(async (empId: string) => {
    if (!empId) {
      setDepartamentos([])
      return
    }
    try {
      const res = await fetch(`/api/empresa/departamentos/list?empresa_id=${empId}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setDepartamentos(json.rows)
      } else {
        setDepartamentos([])
      }
    } catch {
      setDepartamentos([])
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) loadEmpresas()
  }, [isOpen, loadEmpresas])

  React.useEffect(() => {
    if (empresaId) {
      loadDepartamentos(empresaId)
      setDepartamentoId("")
    }
  }, [empresaId, loadDepartamentos])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(empresaId && codigo.trim() && nome.trim())) {
      return { success: false, error: 'Preencha empresa, código e nome' }
    }

    try {
      const fd = new FormData()
      fd.set('view', 'cargos')
      fd.set('empresa_id', empresaId)
      if (departamentoId) fd.set('departamento_id', departamentoId)
      fd.set('codigo', codigo.trim())
      fd.set('nome', nome.trim())
      if (nivel) fd.set('nivel', nivel)
      if (descricao) fd.set('descricao', descricao.trim())
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
      title="Cadastrar Cargo"
      description="Preencha os dados do cargo"
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
      <div className="md:col-span-2">
        <Label>Departamento</Label>
        <Select onValueChange={setDepartamentoId} value={departamentoId} disabled={!empresaId}>
          <SelectTrigger><SelectValue placeholder={empresaId ? "Selecione o departamento" : "Selecione uma empresa primeiro"} /></SelectTrigger>
          <SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.codigo ? `${d.codigo} - ${d.nome}` : d.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Código <span className="text-red-500">*</span></Label>
        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: CARGO001" />
      </div>
      <div>
        <Label>Nome <span className="text-red-500">*</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Analista de Sistemas" />
      </div>
      <div className="md:col-span-2">
        <Label>Nível</Label>
        <Select onValueChange={setNivel} value={nivel}>
          <SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger>
          <SelectContent>{NIVEIS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label>Descrição</Label>
        <Textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva as responsabilidades e requisitos do cargo" />
      </div>
      <div className="md:col-span-2 flex items-center space-x-2">
        <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
        <Label htmlFor="ativo" className="cursor-pointer">Cargo ativo</Label>
      </div>
    </BaseCadastroSheet>
  )
}
