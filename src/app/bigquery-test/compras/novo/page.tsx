"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function BigQueryTestNovaCompraPage() {
  const [tenantId, setTenantId] = React.useState<string>('1')
  const [fornecedorId, setFornecedorId] = React.useState<string>('')
  const [numeroOc, setNumeroOc] = React.useState<string>('')
  const [dataEmissao, setDataEmissao] = React.useState<string>('')
  const [dataEntregaPrevista, setDataEntregaPrevista] = React.useState<string>('')
  const [observacoes, setObservacoes] = React.useState<string>('')

  const [produtoId, setProdutoId] = React.useState<string>('')
  const [quantidade, setQuantidade] = React.useState<string>('1')
  const [precoUnitario, setPrecoUnitario] = React.useState<string>('0')
  const [unidade, setUnidade] = React.useState<string>('un')

  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  async function onSalvar() {
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    try {
      const fornecedor = Number(fornecedorId)
      if (!fornecedor) throw new Error('Informe um fornecedor_id válido')

      const pid = Number(produtoId)
      const qtd = Number(quantidade)
      const preco = Number(precoUnitario)
      if (!pid) throw new Error('Informe um produto_id válido')
      if (!qtd || Number.isNaN(qtd)) throw new Error('Informe uma quantidade válida')
      if (Number.isNaN(preco)) throw new Error('Informe um preço unitário válido')

      const payload = {
        tenant_id: Number(tenantId || '1'),
        fornecedor_id: fornecedor,
        numero_oc: numeroOc || null,
        data_emissao: dataEmissao || null,
        data_entrega_prevista: dataEntregaPrevista || null,
        status: 'rascunho',
        observacoes: observacoes || null,
        linhas: [
          {
            produto_id: pid,
            quantidade: qtd,
            unidade_medida: unidade || 'un',
            preco_unitario: preco,
            total: Number((qtd * preco).toFixed(2)),
          }
        ],
      }

      const res = await fetch('/api/modulos/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      setSuccess(`Compra criada com ID ${j.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">BigQuery Test • Nova Compra</h1>

        <Card className="p-4">
          <div className="text-base font-semibold text-slate-800 mb-3">Dados da Compra (teste rápido)</div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-2">
              <Label className="text-sm text-slate-600">Tenant ID</Label>
              <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="1" />
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Fornecedor ID</Label>
              <Input value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} placeholder="ex: 10" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Número OC</Label>
              <Input value={numeroOc} onChange={(e) => setNumeroOc(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Data Emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Entrega Prevista</Label>
              <Input type="date" value={dataEntregaPrevista} onChange={(e) => setDataEntregaPrevista(e.target.value)} />
            </div>
            <div className="md:col-span-12">
              <Label className="text-sm text-slate-600">Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-base font-semibold text-slate-800 mb-3">Item (mínimo 1)</div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Produto ID</Label>
              <Input value={produtoId} onChange={(e) => setProdutoId(e.target.value)} placeholder="ex: 100" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Quantidade</Label>
              <Input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="ex: 2" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Preço Unitário</Label>
              <Input value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} placeholder="ex: 49.9" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm text-slate-600">Unidade</Label>
              <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="un" />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-emerald-700">{success}</div>}
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/bigquery-test">Voltar</a>
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSalvar} disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Salvar Compra'}
            </Button>
            <Button variant="ghost" asChild>
              <a href="/modulos/compras?tab=compras">Ver Compras</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

