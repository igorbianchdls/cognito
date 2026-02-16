"use client"

import { useState } from "react"
import { Columns3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "bool", label: "Booleano" },
  { value: "date", label: "Data" },
  { value: "json", label: "JSON" },
] as const

type FieldType = (typeof FIELD_TYPE_OPTIONS)[number]["value"]

type NewFieldDialogButtonProps = {
  disabled?: boolean
  isCreating: boolean
  onCreateField: (input: { name: string; slug?: string; type: FieldType }) => Promise<boolean>
}

export default function NewFieldDialogButton({ disabled, isCreating, onCreateField }: NewFieldDialogButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [type, setType] = useState<FieldType>("text")

  const submit = async () => {
    const nextName = name.trim()
    if (!nextName) return

    const ok = await onCreateField({
      name: nextName,
      slug: slug.trim() || undefined,
      type,
    })

    if (!ok) return

    setOpen(false)
    setName("")
    setSlug("")
    setType("text")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" disabled={disabled}>
          <Columns3 className="h-4 w-4 mr-2" />
          Novo campo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo campo</DialogTitle>
          <DialogDescription>Adicione um campo na tabela atual.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug (opcional)</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isCreating || !name.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
