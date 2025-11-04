"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { validateDateRange } from "@/lib/validators"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (contratoId: number) => void
}

type Funcionario = { funcionarioid: number; nomecompleto: string }

const TIPOS_CONTRATO = [
  { value: 'CLT', label: 'CLT' },
  { value: 'PJ', label: 'PJ' },
  { value: 'Estágio', label: 'Estágio' },
  { value: 'Temporário', label: 'Temporário' },
]

export default function CadastroContratoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)
  const [funcionarios, setFuncionarios] = React.useState<Funcionario[]>([])

  const [funcionarioId, setFuncionarioId] = React.useState("")
  const [tipoContrato, setTipoContrato] = React.useState("")
  const [dataAdmissao, setDataAdmissao] = React.useState("")
  const [dataDemissao, setDataDemissao] = React.useState("")
  const [status, setStatus] = React.useState("ativo")

  const resetForm = () => {
    setFuncionarioId("")
    setTipoContrato("")
    setDataAdmissao("")
    setDataDemissao("")
    setStatus("ativo")
  }

  const loadFuncionarios = React.useCallback(async () => {
    try {
      const res = await fetch('/api/modulos/rh/funcionarios/list', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setFuncionarios(json.rows)
      } else {
        setFuncionarios([])
      }
    } catch {
      setFuncionarios([])
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) loadFuncionarios()
  }, [isOpen, loadFuncionarios])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(funcionarioId && tipoContrato && dataAdmissao)) {
      return { success: false, error: 'Preencha funcionário, tipo de contrato e data de admissão' }
    }

    if (dataDemissao) {
      const validation = validateDateRange(dataAdmissao, dataDemissao)
      if (!validation.valid) {
        return { success: false, error: validation.message || 'Data de demissão deve ser maior ou igual à data de admissão' }
      }
    }

    try {
      const fd = new FormData()
      fd.set('view', 'contratos')
      fd.set('funcionarioid', funcionarioId)
      fd.set('tipodecontrato', tipoContrato)
      fd.set('dataadmissao', dataAdmissao)
      if (dataDemissao) fd.set('datademissao', dataDemissao)
      fd.set('status', status)

      const res = await fetch('/api/modulos/rh/create', { method: 'POST', body: fd })
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
      title="Cadastrar Contrato"
      description="Preencha os dados do contrato"
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
        <Label>Funcionário <span className="text-red-500">*</span></Label>
        <Select onValueChange={setFuncionarioId} value={funcionarioId}>
          <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
          <SelectContent>{funcionarios.map(f => <SelectItem key={f.funcionarioid} value={String(f.funcionarioid)}>{f.nomecompleto}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tipo de Contrato <span className="text-red-500">*</span></Label>
        <Select onValueChange={setTipoContrato} value={tipoContrato}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{TIPOS_CONTRATO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status <span className="text-red-500">*</span></Label>
        <Select onValueChange={setStatus} value={status}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="rescindido">Rescindido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Data de Admissão <span className="text-red-500">*</span></Label>
        <Input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} />
      </div>
      <div>
        <Label>Data de Demissão</Label>
        <Input type="date" value={dataDemissao} onChange={(e) => setDataDemissao(e.target.value)} />
      </div>
    </BaseCadastroSheet>
  )
}
