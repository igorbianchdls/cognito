"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = {
  triggerLabel?: string
  onCreated?: (id: number) => void
}

type Item = { id: number; nome: string }

export default function CadastroPedidoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [clientes, setClientes] = React.useState<Item[]>([])
  const [canais, setCanais] = React.useState<Item[]>([])
  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [numeroPedido, setNumeroPedido] = React.useState("")
  const [clienteId, setClienteId] = React.useState("")
  const [canalId, setCanalId] = React.useState("")
  const [vendedorId, setVendedorId] = React.useState("")
  const [dataPedido, setDataPedido] = React.useState("")
  const [valorProdutos, setValorProdutos] = React.useState("")
  const [valorFrete, setValorFrete] = React.useState("")
  const [valorDesconto, setValorDesconto] = React.useState("")
  const [valorTotal, setValorTotal] = React.useState("")
  const [status, setStatus] = React.useState("")

  const canSave = !!numeroPedido.trim() && !!clienteId && !!canalId && !!dataPedido && !!valorTotal

  const resetForm = () => {
    setNumeroPedido("")
    setClienteId("")
    setCanalId("")
    setVendedorId("")
    setDataPedido("")
    setValorProdutos("")
    setValorFrete("")
    setValorDesconto("")
    setValorTotal("")
    setStatus("")
    setError(null)
  }

  const fetchList = async (url: string): Promise<Item[]> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json?.success || !Array.isArray(json?.rows)) return []
      return json.rows as Item[]
    } catch { return [] }
  }

  React.useEffect(() => {
    if (!open) return
    ;(async () => {
      const [cl, ca, ve] = await Promise.all([
        fetchList('/api/modulos/vendas/clientes/list'),
        fetchList('/api/modulos/vendas/canais/list'),
        fetchList('/api/modulos/vendas/vendedores/list'),
      ])
      setClientes(cl)
      setCanais(ca)
      setVendedores(ve)
    })()
  }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('numero_pedido', numeroPedido.trim())
      fd.set('cliente_id', clienteId)
      fd.set('canal_venda_id', canalId)
      if (vendedorId) fd.set('usuario_id', vendedorId)
      fd.set('data_pedido', dataPedido)
      if (valorProdutos) fd.set('valor_produtos', valorProdutos)
      if (valorFrete) fd.set('valor_frete', valorFrete)
      if (valorDesconto) fd.set('valor_desconto', valorDesconto)
      fd.set('valor_total', valorTotal)
      if (status) fd.set('status', status.trim())

      const res = await fetch('/api/modulos/vendas/pedidos', { method: 'POST', body: fd })
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
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Pedido</SheetTitle>
            <SheetDescription>Preencha os dados principais do pedido</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Número do Pedido<span className="text-red-500"> *</span></Label>
                <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} />
              </div>
              <div>
                <Label>Cliente<span className="text-red-500"> *</span></Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canal<span className="text-red-500"> *</span></Label>
                <Select value={canalId} onValueChange={setCanalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {canais.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Vendedor (opcional)</Label>
                <Select value={vendedorId} onValueChange={setVendedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data do Pedido<span className="text-red-500"> *</span></Label>
                <Input type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} />
              </div>
              <div>
                <Label>Status (opcional)</Label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: aberto, faturado" />
              </div>

              <div>
                <Label>Valor Produtos</Label>
                <Input type="number" step="0.01" value={valorProdutos} onChange={(e) => setValorProdutos(e.target.value)} />
              </div>
              <div>
                <Label>Frete</Label>
                <Input type="number" step="0.01" value={valorFrete} onChange={(e) => setValorFrete(e.target.value)} />
              </div>
              <div>
                <Label>Desconto</Label>
                <Input type="number" step="0.01" value={valorDesconto} onChange={(e) => setValorDesconto(e.target.value)} />
              </div>

              <div>
                <Label>Total do Pedido<span className="text-red-500"> *</span></Label>
                <Input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
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
