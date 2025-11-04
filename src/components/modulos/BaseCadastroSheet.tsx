"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type BaseCadastroSheetProps = {
  triggerLabel?: string
  title: string
  description?: string
  widthClassName?: string // ex.: "max-w-2xl" | "max-w-3xl"
  submitLabel?: string
  onSubmit: () => Promise<{ success: boolean; error?: string }>
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  children: React.ReactNode
}

export default function BaseCadastroSheet({
  triggerLabel = "Cadastrar",
  title,
  description,
  widthClassName = "max-w-2xl",
  submitLabel = "Salvar",
  onSubmit,
  onOpenChange,
  onSuccess,
  children,
}: BaseCadastroSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next === true) setError(null)
    onOpenChange?.(next)
  }

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await onSubmit()
      if (!res?.success) {
        setError(res?.error || "Falha ao salvar")
        return
      }
      onSuccess?.()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className={`w-screen p-0 ${widthClassName}`}>
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>
            )}
            <div className="grid grid-cols-1 gap-4">
              {children}
            </div>
          </div>

          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline" disabled={loading}>Cancelar</Button>
            </SheetClose>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Salvando…' : submitLabel}</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

