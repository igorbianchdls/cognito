"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type CadastroFormSheetProps = {
  triggerLabel?: string
}

export default function CadastroFormSheet({ triggerLabel = "Cadastrar" }: CadastroFormSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-none p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar</SheetTitle>
            <SheetDescription>Preencha os campos abaixo (apenas UI)</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="f-titulo">Título</Label>
                <Input id="f-titulo" placeholder="Informe o título" />
              </div>

              <div>
                <Label htmlFor="f-tipo">Tipo</Label>
                <Select>
                  <SelectTrigger id="f-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="op1">Opção 1</SelectItem>
                    <SelectItem value="op2">Opção 2</SelectItem>
                    <SelectItem value="op3">Opção 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="f-valor">Valor</Label>
                <Input id="f-valor" type="number" placeholder="0,00" />
              </div>

              <div>
                <Label htmlFor="f-status">Status</Label>
                <Select>
                  <SelectTrigger id="f-status">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="f-descricao">Descrição</Label>
                <Textarea id="f-descricao" placeholder="Detalhes adicionais" rows={5} />
              </div>
            </div>
          </div>

          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button disabled>Salvar</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

