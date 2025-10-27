"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Step } from "@/app/workflows/builder/types"

export default function ActionForm({ value, onChange }: { value: Step; onChange: (patch: Partial<Step>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Descrição da ação</Label>
        <Input value={value.text ?? ''} onChange={(e) => onChange({ text: e.target.value })} placeholder="Ex.: Add a new record" />
      </div>
      <Separator />
      <div className="text-xs text-muted-foreground">Campos de App/Operação e mapeamentos virão em breve.</div>
    </div>
  )
}

