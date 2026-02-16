"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Table } from "lucide-react"

import NexusShell from "@/components/navigation/nexus/NexusShell"
import PageHeader from "@/features/erp/frontend/components/PageHeader"
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

type SchemaRow = { id: string; name: string; description: string | null; created_at: string }

export default function AirtableHomePage() {
  const router = useRouter()
  const [schemas, setSchemas] = useState<SchemaRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/airtable/schemas", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const rows = (json?.rows || []) as SchemaRow[]
      setSchemas(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar schemas")
      setSchemas([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const createSchema = async () => {
    const n = name.trim()
    if (!n) return
    setIsCreating(true)
    try {
      const res = await fetch("/api/airtable/schemas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, description: description.trim() ? description.trim() : null }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`)
      const row = json?.row as { id: string } | undefined
      window.dispatchEvent(new Event("airtable:schema-changed"))
      setOpen(false)
      setName("")
      setDescription("")
      if (row?.id) router.push(`/airtable/${row.id}`)
      else await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar schema")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <NexusShell contentClassName="p-0" outerBg="#f9fafb">
      <div className="h-full flex flex-col">
        <PageHeader
          title="Airtable"
          subtitle="Crie schemas e tabelas no estilo Airtable/Baserow"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo schema
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo schema</DialogTitle>
                  <DialogDescription>Crie um novo schema (base) para organizar suas tabelas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: CRM Interno" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setOpen(false)} disabled={isCreating}>
                    Cancelar
                  </Button>
                  <Button onClick={createSchema} disabled={isCreating || !name.trim()}>
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="flex-1 min-h-0 p-4 md:p-6">
          <div className="bg-white rounded-lg border h-full flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2 text-sm text-muted-foreground">
              <Table className="h-4 w-4" />
              Schemas
            </div>
            <div className="flex-1 min-h-0">
              <div className="p-4 space-y-2">
                {schemas.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum schema ainda. Crie o primeiro.</div>
                ) : (
                  schemas.map((s) => (
                    <button
                      key={s.id}
                      className="w-full text-left rounded-md border px-3 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/airtable/${s.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          {s.description ? (
                            <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : ""}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          {isLoading ? <div className="mt-3 text-sm text-muted-foreground">Carregando...</div> : null}
          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        </div>
      </div>
    </NexusShell>
  )
}
