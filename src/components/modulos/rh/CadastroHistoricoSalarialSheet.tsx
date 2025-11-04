"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { validateDateRange, validatePositiveNumber } from "@/lib/validators"

type Props = {
  triggerLabel?: string
  onCreated?: (historicoId: number) => void
}

export default function CadastroHistoricoSalarialSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [contratoId, setContratoId] = React.useState("")
  const [salarioBase, setSalarioBase] = React.useState("")
  const [tipoPagamento, setTipoPagamento] = React.useState("")
  const [dataInicioVigencia, setDataInicioVigencia] = React.useState("")
  const [dataFimVigencia, setDataFimVigencia] = React.useState("")

  const resetForm = () => {
    setContratoId("")
    setSalarioBase("")
    setTipoPagamento("")
    setDataInicioVigencia("")
    setDataFimVigencia("")
    setError(null)
  }

  const canSave = !!contratoId && !!salarioBase && !!tipoPagamento && !!dataInicioVigencia

  const onSave = async () => {
    if (!canSave || loading) return

    // Validação de salário positivo
    if (!validatePositiveNumber(salarioBase)) {
      setError('Salário base deve ser maior que zero')
      return
    }

    // Validação de datas
    if (dataFimVigencia) {
      const validation = validateDateRange(dataInicioVigencia, dataFimVigencia)
      if (!validation.valid) {
        setError(validation.message || 'Data fim de vigência deve ser maior ou igual à data início')
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const fd = new FormData()
      fd.set('view', 'historico-salarial')
      fd.set('contratoid', contratoId)
      fd.set('salariobase', salarioBase)
      fd.set('tipodepagamento', tipoPagamento)
      fd.set('datainiciovigencia', dataInicioVigencia)
      if (dataFimVigencia) fd.set('datafimvigencia', dataFimVigencia)

      const res = await fetch('/api/modulos/rh/create', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const historicoId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof historicoId === 'number' && !Number.isNaN(historicoId)) {
        onCreated?.(historicoId)
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
            <SheetTitle>Cadastrar Histórico Salarial</SheetTitle>
            <SheetDescription>Preencha os dados do histórico salarial</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Contrato ID <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={contratoId}
                  onChange={(e) => setContratoId(e.target.value)}
                  placeholder="Digite o ID do contrato"
                />
                <p className="text-xs text-gray-500 mt-1">Informe o ID do contrato ao qual este histórico salarial pertence</p>
              </div>

              <div>
                <Label>Salário Base <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salarioBase}
                  onChange={(e) => setSalarioBase(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Tipo de Pagamento <span className="text-red-500">*</span></Label>
                <Select onValueChange={setTipoPagamento} value={tipoPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="hora">Por Hora</SelectItem>
                    <SelectItem value="comissao">Comissão</SelectItem>
                    <SelectItem value="projeto">Por Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Início Vigência <span className="text-red-500">*</span></Label>
                <Input type="date" value={dataInicioVigencia} onChange={(e) => setDataInicioVigencia(e.target.value)} />
              </div>

              <div>
                <Label>Data Fim Vigência</Label>
                <Input type="date" value={dataFimVigencia} onChange={(e) => setDataFimVigencia(e.target.value)} />
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
