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
  onCreated?: (id: number) => void
}

type Produto = { id: number; nome: string }

export default function CadastroVariacaoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [produtos, setProdutos] = React.useState<Produto[]>([])

  const [produtoId, setProdutoId] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [precoBase, setPrecoBase] = React.useState("")
  const [pesoKg, setPesoKg] = React.useState("")
  const [alturaCm, setAlturaCm] = React.useState("")
  const [larguraCm, setLarguraCm] = React.useState("")
  const [profundidadeCm, setProfundidadeCm] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setProdutoId("")
    setSku("")
    setPrecoBase("")
    setPesoKg("")
    setAlturaCm("")
    setLarguraCm("")
    setProfundidadeCm("")
    setAtivo(true)
    setError(null)
  }

  const canSave = !!produtoId && !!sku.trim()

  const loadProdutos = React.useCallback(async () => {
    try {
      const res = await fetch('/api/modulos/produtos/produtos/list', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) setProdutos(json.rows)
      else setProdutos([])
    } catch {
      setProdutos([])
    }
  }, [])

  React.useEffect(() => { if (open) loadProdutos() }, [open, loadProdutos])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('view', 'variacoes')
      fd.set('produto_pai_id', produtoId)
      fd.set('sku', sku.trim())
      if (precoBase) fd.set('preco_base', precoBase)
      if (pesoKg) fd.set('peso_kg', pesoKg)
      if (alturaCm) fd.set('altura_cm', alturaCm)
      if (larguraCm) fd.set('largura_cm', larguraCm)
      if (profundidadeCm) fd.set('profundidade_cm', profundidadeCm)
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/produtos/create', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false)
      resetForm()
      if (!Number.isNaN(id)) onCreated?.(id)
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
            <SheetTitle>Cadastrar Variação</SheetTitle>
            <SheetDescription>Preencha os dados da variação</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Produto <span className="text-red-500">*</span></Label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>SKU <span className="text-red-500">*</span></Label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: SKU-001" />
              </div>

              <div>
                <Label>Preço Base</Label>
                <Input value={precoBase} onChange={(e) => setPrecoBase(e.target.value)} type="number" step="0.01" placeholder="0,00" />
              </div>

              <div>
                <Label>Peso (kg)</Label>
                <Input value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} type="number" step="0.001" />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input value={alturaCm} onChange={(e) => setAlturaCm(e.target.value)} type="number" step="0.01" />
              </div>
              <div>
                <Label>Largura (cm)</Label>
                <Input value={larguraCm} onChange={(e) => setLarguraCm(e.target.value)} type="number" step="0.01" />
              </div>
              <div>
                <Label>Profundidade (cm)</Label>
                <Input value={profundidadeCm} onChange={(e) => setProfundidadeCm(e.target.value)} type="number" step="0.01" />
              </div>

              <div className="md:col-span-2 flex items-center space-x-2">
                <Checkbox id="ativo" checked={ativo} onCheckedChange={(c) => setAtivo(c === true)} />
                <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
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
