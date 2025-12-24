"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import EntryInfoCard, { type EntryInfoValues } from "@/components/modulos/financeiro/shared/EntryInfoCard"
import PaymentConditionHeader, { type PaymentConditionConfig } from "@/components/modulos/financeiro/shared/PaymentConditionHeader"
import ParcelasEditor, { type Parcela } from "@/components/modulos/financeiro/shared/ParcelasEditor"
import CompraItemsEditor, { type CompraItem } from "@/components/modulos/compras/CompraItemsEditor"
import { useRouter } from "next/navigation"

export default function NovaCompraForm() {
  const router = useRouter()

  const [info, setInfo] = React.useState<EntryInfoValues>({
    dataCompetencia: '',
    entidade: '', // fornecedor
    descricao: '',
    valor: '',
    habilitarRateio: false,
    categoria: '',
    centro: '',
    codigoReferencia: '',
  })

  const [cond, setCond] = React.useState<PaymentConditionConfig>({ parcelas: 1, primeiroVenc: '', intervaloDias: 30, formaPadrao: '', contaPadrao: '' })
  const [parcelas, setParcelas] = React.useState<Parcela[]>([])
  const [itens, setItens] = React.useState<CompraItem[]>([{ id: String(Date.now()), produto: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }])

  const formasPagamento = React.useMemo(() => [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'cartao', label: 'Cartão' },
  ], [])
  const contas = React.useMemo(() => [
    { value: 'b1', label: 'Banco 1 - 0001' },
    { value: 'b2', label: 'Banco 2 - 0002' },
  ], [])

  const produtoOptions = React.useMemo(() => [
    { value: 'papel_a4', label: 'Papel A4' },
    { value: 'canetas', label: 'Canetas' },
    { value: 'ssd_1tb', label: 'SSD 1TB' },
  ], [])

  const totalItens = React.useMemo(() => itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0), [itens])

  React.useEffect(() => {
    const n = Math.max(1, cond.parcelas || 1)
    const base = Number(((totalItens || 0) / n).toFixed(2))
    let residual = Number(((totalItens || 0) - base * (n - 1)).toFixed(2))
    const list: Parcela[] = []
    for (let i = 0; i < n; i++) {
      const dt = cond.primeiroVenc ? new Date(cond.primeiroVenc) : undefined
      const venc = dt ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + i * (cond.intervaloDias || 30)) : undefined
      const vencStr = venc ? `${venc.getFullYear()}-${String(venc.getMonth()+1).padStart(2,'0')}-${String(venc.getDate()).padStart(2,'0')}` : ''
      const val = i === n - 1 ? residual : base
      const perc = totalItens ? Number(((val / totalItens) * 100).toFixed(2)) : 0
      list.push({ index: i + 1, vencimento: vencStr, valor: val, percentual: perc, forma: '', conta: '', descricao: '' })
    }
    setParcelas(list)
  }, [cond.parcelas, cond.primeiroVenc, cond.intervaloDias, totalItens])

  const onChangeParcel = (idx: number, patch: Partial<Parcela>) => setParcelas((prev) => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))

  function onSalvar() {
    console.log('Salvar (Compra stub):', { info, cond, parcelas, itens })
    router.push('/modulos/compras?tab=compras')
  }

  return (
    <div className="space-y-4">
      <EntryInfoCard
        values={info}
        onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))}
        title="Informações da compra"
        entityLabel="Fornecedor"
        categoryLabel="Categoria"
        centerLabel="Centro de custo"
      />

      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Itens da compra</div>
        <CompraItemsEditor items={itens} onChange={setItens} produtoOptions={produtoOptions} />
      </Card>

      <Card className="p-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold text-slate-800">Condição de pagamento</div>
          <div className="text-sm text-gray-600">Total itens: R$ {totalItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <PaymentConditionHeader
          config={cond}
          onChange={(patch) => setCond((prev) => ({ ...prev, ...patch }))}
          formasPagamento={formasPagamento}
          contas={contas}
        />
        <div className="mt-4">
          <ParcelasEditor
            total={totalItens}
            parcelas={parcelas}
            onChangeParcel={onChangeParcel}
            formasPagamento={formasPagamento}
            contas={contas}
            formaPadrao={cond.formaPadrao}
            contaPadrao={cond.contaPadrao}
          />
        </div>
      </Card>

      <Card className="p-4 mx-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/modulos/compras?tab=compras')}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSalvar}>Salvar</Button>
        </div>
      </Card>
    </div>
  )
}

