"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (departamentoId: number) => void
}

type Empresa = { id: number; razao_social: string; nome_fantasia?: string }

export default function CadastroDepartamentoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])

  const [empresaId, setEmpresaId] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [responsavel, setResponsavel] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setEmpresaId("")
    setCodigo("")
    setNome("")
    setResponsavel("")
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

    try {
      const fd = new FormData()
      fd.set('view', 'departamentos')
      fd.set('empresa_id', empresaId)
      fd.set('codigo', codigo.trim())
      fd.set('nome', nome.trim())
      if (responsavel) fd.set('responsavel', responsavel.trim())
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
      title="Cadastrar Departamento"
      description="Preencha os dados do departamento"
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
        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: DEPT001" />
      </div>
      <div>
        <Label>Nome <span className="text-red-500">*</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Financeiro" />
      </div>
      <div className="md:col-span-2">
        <Label>Responsável</Label>
        <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Ex: João Silva" />
      </div>
      <div className="md:col-span-2 flex items-center space-x-2">
        <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
        <Label htmlFor="ativo" className="cursor-pointer">Departamento ativo</Label>
      </div>
    </BaseCadastroSheet>
  )
}
