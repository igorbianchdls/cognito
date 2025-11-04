"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { validateDateRange, validatePositiveNumber } from "@/lib/validators"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (historicoId: number) => void
}

export default function CadastroHistoricoSalarialSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

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
  }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(contratoId && salarioBase && tipoPagamento && dataInicioVigencia)) {
      return { success: false, error: 'Preencha contrato ID, salário base, tipo de pagamento e data início vigência' }
    }

    if (!validatePositiveNumber(salarioBase)) {
      return { success: false, error: 'Salário base deve ser maior que zero' }
    }

    if (dataFimVigencia) {
      const validation = validateDateRange(dataInicioVigencia, dataFimVigencia)
      if (!validation.valid) {
        return { success: false, error: validation.message || 'Data fim de vigência deve ser maior ou igual à data início' }
      }
    }

    try {
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
      title="Cadastrar Histórico Salarial"
      description="Preencha os dados do histórico salarial"
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
        <Label>Contrato ID <span className="text-red-500">*</span></Label>
        <Input type="number" value={contratoId} onChange={(e) => setContratoId(e.target.value)} placeholder="Digite o ID do contrato" />
        <p className="text-xs text-gray-500 mt-1">Informe o ID do contrato ao qual este histórico salarial pertence</p>
      </div>
      <div>
        <Label>Salário Base <span className="text-red-500">*</span></Label>
        <Input type="number" step="0.01" value={salarioBase} onChange={(e) => setSalarioBase(e.target.value)} placeholder="0.00" />
      </div>
      <div>
        <Label>Tipo de Pagamento <span className="text-red-500">*</span></Label>
        <Select onValueChange={setTipoPagamento} value={tipoPagamento}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
    </BaseCadastroSheet>
  )
}
