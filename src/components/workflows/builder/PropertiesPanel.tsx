"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { Step } from "@/app/workflows/builder/types"
import TriggerForm from "./forms/TriggerForm"
import ActionForm from "./forms/ActionForm"

export default function PropertiesPanel({ step, onChange, onDelete }: { step: Step | null; onChange: (patch: Partial<Step>) => void; onDelete: () => void }) {
  if (!step) {
    return (
      <div className="p-6">
        <h3 className="text-base font-semibold">Propriedades</h3>
        <p className="text-sm text-muted-foreground mt-1">Selecione um passo para editar suas configurações.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-6">
        <div>
          <h3 className="text-base font-semibold">Configurar passo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tipo: {step.type}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDelete}>Remover</Button>
        </div>
      </div>
      <Separator />
      <div className="p-6 space-y-6">
        {step.type === 'trigger' && (
          <TriggerForm value={step} onChange={onChange} />
        )}
        {step.type === 'action' && (
          <ActionForm value={step} onChange={onChange} />
        )}

        {step.type !== 'trigger' && step.type !== 'action' && (
          <div className="text-sm text-muted-foreground">Formulário para "{step.type}" ainda não implementado. Em breve.</div>
        )}
      </div>
    </div>
  )
}

