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

  const clienteOptions = React.useMemo(() => [
    { value: "c1", label: "Cliente A" },
    { value: "c2", label: "Cliente B" },
  ], [])
  const categoriaOptions = React.useMemo(() => [
    { value: "servicos", label: "Serviços" },
    { value: "produtos", label: "Produtos" },
  ], [])
  const vendedorOptions = React.useMemo(() => [
    { value: "u1", label: "Vendedor 1" },
    { value: "u2", label: "Vendedor 2" },
  ], [])
  const produtoOptions = React.useMemo(() => [
    { value: "p1", label: "Diagnóstico e Setup" },
    { value: "p2", label: "Consultoria Mensal" },
    { value: "p3", label: "Treinamento" },
  ], [])

  const formasPagamento = React.useMemo(() => [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto bancário' },
    { value: 'cartao', label: 'Cartão' },
    { value: 'transferencia', label: 'Transferência' },
  ], [])
  const contas = React.useMemo(() => [
    { value: 'rec_f1', label: 'Receba Fácil' },
    { value: 'itau_0001', label: 'Itaú • 0001' },
  ], [])

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

  const handleSalvar = () => {
    // MVP: apenas loga e retorna para lista de pedidos
    console.log("Salvar venda (stub):", { info, items })
    router.push("/modulos/vendas?tab=pedidos")
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
            <Button variant="secondary" onClick={handleSalvarCriarNova}>Salvar e criar nova venda</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSalvar}>Salvar</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
