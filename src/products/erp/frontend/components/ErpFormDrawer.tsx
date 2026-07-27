'use client'

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

function FieldControl({ field }: { field: ErpEntityField }) {
  if (field.type === 'select') {
    return (
      <Select>
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
    return <Textarea placeholder={field.placeholder} className="min-h-[96px] bg-white ring-1 ring-gray-200" />
  }

  return <Input type={field.type} placeholder={field.placeholder} className="bg-white ring-1 ring-gray-200" />
}

export function ErpFormDrawer({
  config,
  open,
  onOpenChange,
}: {
  config: ErpEntityConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-gray-200 px-6 py-5">
          <SheetTitle className="text-lg">Novo {config.singularLabel}</SheetTitle>
          <p className="text-sm leading-6 text-gray-600">
            Preencha os dados principais. A persistencia sera conectada ao Supabase depois da validacao da UI.
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
                <FieldControl field={field} />
              </div>
            ))}
          </div>
        </div>
        <SheetFooter className="border-t border-gray-200 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>Salvar rascunho</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

