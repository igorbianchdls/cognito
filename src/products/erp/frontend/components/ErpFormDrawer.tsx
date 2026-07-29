'use client'

import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { ErpEntityConfig, ErpEntityField } from '@/products/erp/shared/types'

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ErpEntityField
  value: string
  onChange: (value: string) => void
}) {
  if (field.type === 'select') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white ring-1 ring-gray-200">
          <SelectValue placeholder={field.placeholder ?? `Selecione ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        value={value}
        placeholder={field.placeholder}
        className="min-h-[96px] bg-white ring-1 ring-gray-200"
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <Input
      value={value}
      type={field.type}
      placeholder={field.placeholder}
      className="bg-white ring-1 ring-gray-200"
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function ErpFormDrawer({
  config,
  open,
  onOpenChange,
  onSubmit,
}: {
  config: ErpEntityConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues({})
    setSaving(false)
  }, [config.id, open])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const missingField = config.fields.find((field) => field.required && !String(values[field.key] || '').trim())
    if (missingField) {
      setError(`${missingField.label} e obrigatorio.`)
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl">
        <form className="flex h-full flex-col" onSubmit={submit}>
          <SheetHeader className="border-b border-gray-200 px-6 py-5">
            <SheetTitle className="text-lg">Novo {config.singularLabel}</SheetTitle>
            <p className="text-sm leading-6 text-gray-600">
              Preencha os dados principais para salvar no ERP.
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-auto px-6 py-5">
            <div className="grid gap-4">
              {config.fields.map((field) => (
                <div key={field.key} className="grid gap-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
                  </Label>
                  <FieldControl
                    field={field}
                    value={values[field.key] || ''}
                    onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
                  />
                </div>
              ))}
              {error ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
          <SheetFooter className="border-t border-gray-200 px-6 py-4">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
