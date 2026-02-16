"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import PageHeader from "@/products/erp/frontend/components/PageHeader"
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

type AirtableSchemaHeaderProps = {
  schemaName: string | null
  schemaDescription: string | null
  isCreatingTable: boolean
  onBack: () => void
  onCreateTable: (input: { name: string; slug?: string }) => Promise<boolean>
}

export default function AirtableSchemaHeader({
  schemaName,
  schemaDescription,
  isCreatingTable,
  onBack,
  onCreateTable,
}: AirtableSchemaHeaderProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const submit = async () => {
    const nextName = name.trim()
    if (!nextName) return

    const ok = await onCreateTable({
      name: nextName,
      slug: slug.trim() || undefined,
    })

    if (!ok) return

    setOpen(false)
    setName("")
    setSlug("")
  }

  return (
    <PageHeader
      title={schemaName ? `Airtable: ${schemaName}` : "Airtable"}
      subtitle={schemaDescription || "Crie tabelas, campos e registros"}
      className="[&_p]:mb-3"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onBack}>
            Voltar
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova tabela
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova tabela</DialogTitle>
                <DialogDescription>Crie uma tabela dentro deste schema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Clientes" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug (opcional)</label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: clientes" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)} disabled={isCreatingTable}>
                  Cancelar
                </Button>
                <Button onClick={submit} disabled={isCreatingTable || !name.trim()}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  )
}
