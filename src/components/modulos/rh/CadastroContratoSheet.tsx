"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { validateDateRange } from "@/lib/validators"

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
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
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
    setError(null)
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
    if (open) loadFuncionarios()
  }, [open, loadFuncionarios])

  const canSave = !!funcionarioId && !!tipoContrato && !!dataAdmissao

  const onSave = async () => {
    if (!canSave || loading) return

    // Validação de datas
    if (dataDemissao) {
      const validation = validateDateRange(dataAdmissao, dataDemissao)
      if (!validation.valid) {
        setError(validation.message || 'Data de demissão deve ser maior ou igual à data de admissão')
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

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
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const contratoId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof contratoId === 'number' && !Number.isNaN(contratoId)) {
        onCreated?.(contratoId)
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
            <SheetTitle>Cadastrar Contrato</SheetTitle>
            <SheetDescription>Preencha os dados do contrato</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Funcionário <span className="text-red-500">*</span></Label>
                <Select onValueChange={setFuncionarioId} value={funcionarioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => (
                      <SelectItem key={f.funcionarioid} value={String(f.funcionarioid)}>
                        {f.nomecompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Contrato <span className="text-red-500">*</span></Label>
                <Select onValueChange={setTipoContrato} value={tipoContrato}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTRATO.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status <span className="text-red-500">*</span></Label>
                <Select onValueChange={setStatus} value={status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
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
