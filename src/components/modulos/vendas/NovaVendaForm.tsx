"use client"

import * as React from "react"
import VendaInfoCard, { type VendaInfoValues } from "@/components/modulos/vendas/VendaInfoCard"
import SaleItemsEditor, { type SaleItem } from "@/components/modulos/vendas/SaleItemsEditor"
import VendaPagamentoCard from "@/components/modulos/vendas/VendaPagamentoCard"
import type { PaymentConditionConfig } from "@/components/modulos/financeiro/shared/PaymentConditionHeader"
import type { Parcela } from "@/components/modulos/financeiro/shared/ParcelasEditor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function NovaVendaForm() {
  const router = useRouter()

  const [info, setInfo] = React.useState<VendaInfoValues>({
    tipoVenda: "avulsa",
    situacao: "aprovado",
    numeroVenda: "",
    cliente: "",
    canal: "",
    dataVenda: "",
    categoria: "",
    vendedor: "",
  })

  const [items, setItems] = React.useState<SaleItem[]>([
    { id: String(Date.now()), produto: "", detalhes: "", quantidade: 1, valorUnitario: 0 },
  ])

  // Pagamento/parcelas
  const [cond, setCond] = React.useState<PaymentConditionConfig>({ parcelas: 1, primeiroVenc: "", intervaloDias: 30, formaPadrao: "", contaPadrao: "" })
  const [parcelas, setParcelas] = React.useState<Parcela[]>([])

  const [clienteOptions, setClienteOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [canalOptions, setCanalOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [vendedorOptions, setVendedorOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [produtoOptions, setProdutoOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [formasPagamento, setFormasPagamento] = React.useState<Array<{ value: string; label: string }>>([])
  const [contas, setContas] = React.useState<Array<{ value: string; label: string }>>([])

  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const ac = new AbortController()
    async function load() {
      try {
        const [cliRes, canRes, venRes, srvRes, mpRes, cfRes] = await Promise.all([
          fetch('/api/modulos/vendas/clientes/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/vendas/canais/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/vendas/vendedores/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/servicos?view=catalogo&pageSize=1000&order_by=nome', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro/metodos-pagamento/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro/contas-financeiras/list', { cache: 'no-store', signal: ac.signal }),
        ])
        if (cliRes.ok) {
          const j = await cliRes.json(); setClienteOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (canRes.ok) {
          const j = await canRes.json(); setCanalOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (venRes.ok) {
          const j = await venRes.json(); setVendedorOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (srvRes.ok) {
          const j = await srvRes.json(); setProdutoOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (mpRes.ok) {
          const j = await mpRes.json(); const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })); setFormasPagamento(opts); setCond(prev => ({ ...prev, formaPadrao: prev.formaPadrao || (opts[0]?.value || '') }))
        }
        if (cfRes.ok) {
          const j = await cfRes.json(); const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })); setContas(opts); setCond(prev => ({ ...prev, contaPadrao: prev.contaPadrao || (opts[0]?.value || '') }))
        }
      } catch {}
    }
    load();
    return () => ac.abort()
  }, [])

  const vendaTotal = React.useMemo(() => items.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0), [items])

  // Recalcula as parcelas a partir da condição
  React.useEffect(() => {
    const n = Math.max(1, cond.parcelas || 1)
    const base = Number(((vendaTotal || 0) / n).toFixed(2))
    let residual = Number(((vendaTotal || 0) - base * (n - 1)).toFixed(2))
    const list: Parcela[] = []
    for (let i = 0; i < n; i++) {
      const dt = cond.primeiroVenc ? new Date(cond.primeiroVenc) : undefined
      const venc = dt ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + i * (cond.intervaloDias || 30)) : undefined
      const vencStr = venc ? `${venc.getFullYear()}-${String(venc.getMonth()+1).padStart(2,'0')}-${String(venc.getDate()).padStart(2,'0')}` : ''
      const val = i === n - 1 ? residual : base
      const perc = vendaTotal ? Number(((val / vendaTotal) * 100).toFixed(2)) : 0
      list.push({ index: i + 1, vencimento: vencStr, valor: val, percentual: perc, forma: '', conta: '', descricao: '' })
    }
    setParcelas(list)
  }, [cond.parcelas, cond.primeiroVenc, cond.intervaloDias, vendaTotal])

  const onChangeParcel = (idx: number, patch: Partial<Parcela>) => setParcelas((prev) => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))

  const handleSalvar = async () => {
    setError(null)
    setIsSaving(true)
    try {
      if (!info.numeroVenda) throw new Error('Informe o número da venda')
      const clienteId = Number(info.cliente)
      if (!clienteId) throw new Error('Selecione o cliente')
      const canalId = Number(info.canal)
      if (!canalId) throw new Error('Selecione o canal de venda')
      if (!info.dataVenda) throw new Error('Informe a data da venda')
      if (items.length === 0) throw new Error('Adicione ao menos um item')

      const valorTotal = items.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0)

      const fd = new FormData()
      fd.set('numero_pedido', info.numeroVenda)
      fd.set('cliente_id', String(clienteId))
      fd.set('canal_venda_id', String(canalId))
      fd.set('data_pedido', info.dataVenda)
      fd.set('valor_total', String(valorTotal))
      if (info.vendedor) fd.set('usuario_id', String(info.vendedor))
      fd.set('status', info.situacao || 'aprovado')
      fd.set('valor_produtos', String(valorTotal))

      const res = await fetch('/api/modulos/vendas/pedidos', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      router.push("/modulos/vendas?tab=pedidos")
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSalvarCriarNova = () => {
    console.log("Salvar + nova venda (stub):", { info, items })
    // Limpa o formulário para nova venda
    setInfo({ tipoVenda: "avulsa", situacao: "aprovado", numeroVenda: "", cliente: "", dataVenda: "", categoria: "", vendedor: "" })
    setItems([{ id: String(Date.now()), produto: "", detalhes: "", quantidade: 1, valorUnitario: 0 }])
  }

  const handleCancelar = () => {
    router.push("/modulos/vendas?tab=pedidos")
  }

  return (
    <div className="space-y-4">
      <VendaInfoCard
        values={info}
        onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))}
        clienteOptions={clienteOptions}
        canalOptions={canalOptions}
        categoriaOptions={categoriaOptions}
        vendedorOptions={vendedorOptions}
      />

      <SaleItemsEditor
        items={items}
        onChange={setItems}
        produtoOptions={produtoOptions}
      />

      <VendaPagamentoCard
        total={vendaTotal}
        cond={cond}
        onChangeCond={(patch) => setCond((prev) => ({ ...prev, ...patch }))}
        parcelas={parcelas}
        onChangeParcel={onChangeParcel}
        formasPagamento={formasPagamento}
        contas={contas}
      />

      {/* Ações (como última seção) */}
      <Card className="p-4 mx-4 mt-2">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleCancelar}>Cancelar</Button>
          <div className="flex items-center gap-2">
            {error && <span className="text-sm text-red-600 mr-2">{error}</span>}
            <Button variant="secondary" onClick={handleSalvarCriarNova} disabled={isSaving}>Salvar e criar nova venda</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSalvar} disabled={isSaving}>{isSaving ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
