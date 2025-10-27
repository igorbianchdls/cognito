"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Step } from "@/app/workflows/builder/types"

export default function TriggerForm({ value, onChange }: { value: Step; onChange: (patch: Partial<Step>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Título do evento</Label>
        <Input value={value.text ?? ''} onChange={(e) => onChange({ text: e.target.value })} placeholder="Ex.: New website form submission" />
      </div>
      <Separator />
      <div className="text-xs text-muted-foreground">Outros campos (App, Evento, Conexão) virão em breve.</div>
    </div>
  )
}

