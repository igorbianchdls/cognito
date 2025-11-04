"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type Props = {
  triggerLabel?: string
  onCreated?: (departamentoId: number) => void
}

type Empresa = { id: number; razao_social: string; nome_fantasia?: string }

export default function CadastroDepartamentoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])

  const [empresaId, setEmpresaId] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [responsavel, setResponsavel] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setEmpresaId("")
    setCodigo("")
    setNome("")
    setResponsavel("")
    setAtivo(true)
    setError(null)
  }

  const loadEmpresas = React.useCallback(async () => {
    try {
      const res = await fetch('/api/empresa/empresas/list', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setEmpresas(json.rows)
      } else {
        setEmpresas([])
      }
    } catch {
      setEmpresas([])
    }
  }, [])

  React.useEffect(() => {
    if (open) loadEmpresas()
  }, [open, loadEmpresas])

  const canSave = !!empresaId && !!codigo.trim() && !!nome.trim()

  const onSave = async () => {
    if (!canSave || loading) return

    try {
      setLoading(true)
      setError(null)

      const fd = new FormData()
      fd.set('view', 'departamentos')
      fd.set('empresa_id', empresaId)
      fd.set('codigo', codigo.trim())
      fd.set('nome', nome.trim())
      if (responsavel) fd.set('responsavel', responsavel.trim())
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/empresa/create', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const departamentoId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof departamentoId === 'number' && !Number.isNaN(departamentoId)) {
        onCreated?.(departamentoId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Departamento</SheetTitle>
            <SheetDescription>Preencha os dados do departamento</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="md:col-span-2">
                <Label>Empresa <span className="text-red-500">*</span></Label>
                <Select onValueChange={setEmpresaId} value={empresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Código <span className="text-red-500">*</span></Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: DEPT001" />
              </div>

              <div>
                <Label>Nome <span className="text-red-500">*</span></Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Financeiro" />
              </div>

              <div className="md:col-span-2">
                <Label>Responsável</Label>
                <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Ex: João Silva" />
              </div>

              <div className="md:col-span-2 flex items-center space-x-2">
                <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
                <Label htmlFor="ativo" className="cursor-pointer">Departamento ativo</Label>
              </div>
            </div>

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>

          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={onSave} disabled={!canSave || loading}>
              {loading ? 'Salvando…' : 'Salvar'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
