"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (id: number) => void
}

type Item = { id: number; nome: string }

export default function CadastroPedidoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

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
    if (!isOpen) return
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
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(numeroPedido.trim() && clienteId && canalId && dataPedido && valorTotal)) {
      return { success: false, error: 'Preencha número, cliente, canal, data e total.' }
    }
    try {
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
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      const id = Number(json?.id)
      createdIdRef.current = Number.isNaN(id) ? null : id
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Pedido"
      description="Preencha os dados principais do pedido"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; resetForm(); if (typeof id === 'number') onCreated?.(id) }}
    >
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
    </BaseCadastroSheet>
  )
}
