"use client"

import * as React from "react"
import VendaInfoCard, { type VendaInfoValues } from "@/components/modulos/vendas/VendaInfoCard"
import SaleItemsEditor, { type SaleItem } from "@/components/modulos/vendas/SaleItemsEditor"
import { Button } from "@/components/ui/button"
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

      {/* Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t border-gray-200 mt-4">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="outline" onClick={handleCancelar}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleSalvarCriarNova}>Salvar e criar nova venda</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSalvar}>Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

