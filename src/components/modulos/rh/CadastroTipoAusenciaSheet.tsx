"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (tipoAusenciaId: number) => void
}

export default function CadastroTipoAusenciaSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [nome, setNome] = React.useState("")
  const [descontaSaldoFerias, setDescontaSaldoFerias] = React.useState(false)

  const resetForm = () => {
    setNome("")
    setDescontaSaldoFerias(false)
  }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) {
      return { success: false, error: 'Nome do tipo de ausência é obrigatório' }
    }

    try {
      const fd = new FormData()
      fd.set('view', 'tipos-ausencia')
      fd.set('nome', nome.trim())
      fd.set('descontadosaldodeferias', String(descontaSaldoFerias))

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
      title="Cadastrar Tipo de Ausência"
      description="Preencha os dados do tipo de ausência"
      widthClassName="max-w-md"
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
        <Label>Tipo de Ausência <span className="text-red-500">*</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Férias, Licença Médica" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="desconta-ferias" checked={descontaSaldoFerias} onCheckedChange={(checked) => setDescontaSaldoFerias(checked === true)} />
        <Label htmlFor="desconta-ferias" className="cursor-pointer">Desconta do saldo de férias</Label>
      </div>
    </BaseCadastroSheet>
  )
}
