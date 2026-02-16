"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ColumnActionsTarget = {
  fieldId: string | null
  label: string
  type: string
  required?: boolean
}

type ColumnActionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableId: string
  target: ColumnActionsTarget | null
  onChanged?: () => void | Promise<void>
  onError?: (message: string) => void
}

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "bool", label: "Booleano" },
  { value: "date", label: "Data" },
  { value: "json", label: "JSON" },
  { value: "select", label: "Seleção" },
  { value: "multi_select", label: "Multi-seleção" },
  { value: "link", label: "Link" },
] as const

async function parseJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export default function ColumnActionsDialog({
  open,
  onOpenChange,
  tableId,
  target,
  onChanged,
  onError,
}: ColumnActionsDialogProps) {
  const [renameValue, setRenameValue] = useState("")
  const [typeValue, setTypeValue] = useState("text")
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingType, setIsSavingType] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManageField = Boolean(target?.fieldId && tableId)

  useEffect(() => {
    setRenameValue(target?.label || "")
    setTypeValue((target?.type || "text").toLowerCase())
    setIsSavingName(false)
    setIsSavingType(false)
    setIsDuplicating(false)
    setIsDeleting(false)
  }, [target, open])

  const runChanged = async () => {
    if (!onChanged) return
    await onChanged()
  }

  const saveRename = async () => {
    if (!canManageField || !target?.fieldId) return
    const next = renameValue.trim()
    if (!next) {
      onError?.("Nome do campo não pode ficar vazio")
      return
    }
    setIsSavingName(true)
    try {
      const res = await fetch(`/api/airtable/tables/${tableId}/fields`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: target.fieldId, name: next }),
      })
      const json = await parseJson(res)
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`)
      await runChanged()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Falha ao renomear campo")
    } finally {
      setIsSavingName(false)
    }
  }

  const saveType = async () => {
    if (!canManageField || !target?.fieldId) return
    setIsSavingType(true)
    try {
      const res = await fetch(`/api/airtable/tables/${tableId}/fields`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: target.fieldId, type: typeValue }),
      })
      const json = await parseJson(res)
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`)
      await runChanged()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Falha ao alterar tipo do campo")
    } finally {
      setIsSavingType(false)
    }
  }

  const duplicateField = async () => {
    if (!canManageField || !target) return
    setIsDuplicating(true)
    try {
      const suffix = Date.now().toString().slice(-4)
      const copyName = `${target.label} copia ${suffix}`
      const res = await fetch(`/api/airtable/tables/${tableId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: copyName, type: target.type, required: Boolean(target.required) }),
      })
      const json = await parseJson(res)
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`)
      await runChanged()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Falha ao duplicar campo")
    } finally {
      setIsDuplicating(false)
    }
  }

  const deleteField = async () => {
    if (!canManageField || !target?.fieldId) return
    const confirmed = window.confirm(`Excluir o campo "${target.label}"? Esta ação remove os valores dessa coluna.`)
    if (!confirmed) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/airtable/tables/${tableId}/fields`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: target.fieldId }),
      })
      const json = await parseJson(res)
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`)
      await runChanged()
      onOpenChange(false)
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Falha ao excluir campo")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ações da coluna</DialogTitle>
          <DialogDescription>Configure a coluna selecionada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Campo:</span> {target?.label || "-"}
          </div>
          <div className="text-sm">
            <span className="font-medium">Tipo atual:</span> {target?.type || "-"}
          </div>

          {!canManageField ? (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Este campo não suporta ações avançadas ainda.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Renomear campo</label>
                <div className="flex items-center gap-2">
                  <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                  <Button size="sm" onClick={saveRename} disabled={isSavingName || !renameValue.trim()}>
                    Salvar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alterar tipo</label>
                <div className="flex items-center gap-2">
                  <Select value={typeValue} onValueChange={setTypeValue}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={saveType} disabled={isSavingType}>
                    Aplicar
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={duplicateField} disabled={isDuplicating}>
                  Duplicar campo
                </Button>
                <Button size="sm" variant="destructive" onClick={deleteField} disabled={isDeleting}>
                  Excluir campo
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

