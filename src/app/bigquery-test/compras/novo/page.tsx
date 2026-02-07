"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BigQueryTestNovaCompraPage() {
  const toLocalISODate = (d: Date) => {
    const tz = d.getTimezoneOffset()
    const local = new Date(d.getTime() - tz * 60000)
    return local.toISOString().slice(0, 10)
  }

  const [tenantId, setTenantId] = React.useState<string>('1')
  const [fornecedorId, setFornecedorId] = React.useState<string>('')
  const [numeroOc, setNumeroOc] = React.useState<string>('')
  const [dataEmissao, setDataEmissao] = React.useState<string>(() => toLocalISODate(new Date()))
  const [dataEntregaPrevista, setDataEntregaPrevista] = React.useState<string>(() => {
    const in7 = new Date()
    in7.setDate(in7.getDate() + 7)
    return toLocalISODate(in7)
  })
  const [observacoes, setObservacoes] = React.useState<string>(() => `Compra de teste criada em ${new Date().toLocaleString('pt-BR')} (BigQuery Test)`) 

  const [produtoId, setProdutoId] = React.useState<string>('')
  const [quantidade, setQuantidade] = React.useState<string>('1')
  const [precoUnitario, setPrecoUnitario] = React.useState<string>('0')
  const [unidade, setUnidade] = React.useState<string>('un')

  const [centroCustoId, setCentroCustoId] = React.useState<string>('')
  const [filialId, setFilialId] = React.useState<string>('')
  const [projetoId, setProjetoId] = React.useState<string>('')
  const [categoriaDespesaId, setCategoriaDespesaId] = React.useState<string>('')

  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Vendas (teste rápido)
  const [vNumeroPedido, setVNumeroPedido] = React.useState<string>(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `PV-${yyyy}${mm}${dd}-${hh}${mi}`
  })
  const [vDataPedido, setVDataPedido] = React.useState<string>(() => toLocalISODate(new Date()))
  const [vClienteId, setVClienteId] = React.useState<string>('')
  const [vCanalId, setVCanalId] = React.useState<string>('')
  const [vValorProdutos, setVValorProdutos] = React.useState<string>('100')
  const [vValorFrete, setVValorFrete] = React.useState<string>('0')
  const [vValorDesconto, setVValorDesconto] = React.useState<string>('0')
  const vendaTotal = React.useMemo(() => {
    const p = Number(vValorProdutos || '0') || 0
    const f = Number(vValorFrete || '0') || 0
    const d = Number(vValorDesconto || '0') || 0
    return (p + f - d).toFixed(2)
  }, [vValorProdutos, vValorFrete, vValorDesconto])
  const [isSavingVenda, setIsSavingVenda] = React.useState(false)
  const [errorVenda, setErrorVenda] = React.useState<string | null>(null)
  const [successVenda, setSuccessVenda] = React.useState<string | null>(null)

  type Opt = { value: string; label: string }
  const [fornecedorOptions, setFornecedorOptions] = React.useState<Opt[]>([])
  const [produtoOptions, setProdutoOptions] = React.useState<Opt[]>([])
  const [centroCustoOptions, setCentroCustoOptions] = React.useState<Opt[]>([])
  const [categoriaDespesaOptions, setCategoriaDespesaOptions] = React.useState<Opt[]>([])
  const [filialOptions, setFilialOptions] = React.useState<Opt[]>([])
  const [projetoOptions, setProjetoOptions] = React.useState<Opt[]>([])
  const [clienteOptions, setClienteOptions] = React.useState<Opt[]>([])
  const [canalOptions, setCanalOptions] = React.useState<Opt[]>([])

  React.useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const [fRes, pRes, ccRes, cdRes, filRes, prjRes, cliRes, canRes] = await Promise.all([
          fetch('/api/modulos/financeiro/fornecedores/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/produtos/produtos/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/empresa?view=centros-de-custo&pageSize=1000&order_by=codigo', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro/categorias-despesa/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/empresa?view=filiais&pageSize=1000&order_by=nome', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro?view=projetos&pageSize=1000&order_by=nome', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/vendas/clientes/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/vendas/canais/list', { cache: 'no-store', signal: ac.signal }),
        ])

        if (fRes.ok) {
          const j = await fRes.json()
          setFornecedorOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (pRes.ok) {
          const j = await pRes.json()
          setProdutoOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (ccRes.ok) {
          const j = await ccRes.json()
          setCentroCustoOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.codigo ? `${r.codigo} - ${r.nome}` : r.nome })))
        }
        if (cdRes.ok) {
          const j = await cdRes.json()
          setCategoriaDespesaOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (filRes.ok) {
          const j = await filRes.json()
          setFilialOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (prjRes.ok) {
          const j = await prjRes.json()
          setProjetoOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (cliRes.ok) {
          const j = await cliRes.json()
          setClienteOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (canRes.ok) {
          const j = await canRes.json()
          setCanalOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
      } catch (err) {
        // silencioso para teste
      }
    })()
    return () => ac.abort()
  }, [])

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
        centro_custo_id: centroCustoId ? Number(centroCustoId) : null,
        filial_id: filialId ? Number(filialId) : null,
        projeto_id: projetoId ? Number(projetoId) : null,
        categoria_despesa_id: categoriaDespesaId ? Number(categoriaDespesaId) : null,
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
      if (j.ap_id) {
        setSuccess(`Compra criada com ID ${j.id}. Conta a pagar criada com ID ${j.ap_id}.`)
      } else {
        setSuccess(`Compra criada com ID ${j.id}. Criando conta a pagar…`)
        try {
          const follow = await fetch(`/api/modulos/compras/${j.id}/create-ap`, { method: 'POST' })
          const jf = await follow.json()
          if (follow.ok && jf?.success && jf?.ap_id) {
            setSuccess(`Compra criada com ID ${j.id}. Conta a pagar criada com ID ${jf.ap_id}.`)
          } else {
            setError(jf?.message || 'Falha ao criar conta a pagar')
          }
        } catch (err) {
          setError('Falha ao criar conta a pagar')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  async function onSalvarVenda() {
    setErrorVenda(null)
    setSuccessVenda(null)
    setIsSavingVenda(true)
    try {
      const cliente = Number(vClienteId)
      const canal = Number(vCanalId)
      if (!cliente) throw new Error('Selecione um cliente')
      if (!canal) throw new Error('Selecione um canal de venda')
      const total = Number(vendaTotal)
      if (!Number.isFinite(total) || total <= 0) throw new Error('Valor total inválido')

      const fd = new FormData()
      fd.set('tenant_id', tenantId || '1')
      fd.set('numero_pedido', vNumeroPedido || `PV-${Date.now()}`)
      fd.set('cliente_id', String(cliente))
      fd.set('canal_venda_id', String(canal))
      fd.set('data_pedido', vDataPedido)
      fd.set('valor_total', String(total))
      if (vValorProdutos) fd.set('valor_produtos', String(Number(vValorProdutos) || 0))
      if (vValorFrete) fd.set('valor_frete', String(Number(vValorFrete) || 0))
      if (vValorDesconto) fd.set('valor_desconto', String(Number(vValorDesconto) || 0))
      fd.set('status', 'CONFIRMADO')

      const res = await fetch('/api/modulos/vendas/pedidos', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      if (j.cr_id) {
        setSuccessVenda(`Venda criada com ID ${j.id}. Conta a receber criada com ID ${j.cr_id}.`)
      } else {
        setSuccessVenda(`Venda criada com ID ${j.id}. Criando conta a receber…`)
        try {
          const follow = await fetch(`/api/modulos/vendas/pedidos/${j.id}/create-cr`, { method: 'POST' })
          const jf = await follow.json()
          if (follow.ok && jf?.success && jf?.cr_id) {
            setSuccessVenda(`Venda criada com ID ${j.id}. Conta a receber criada com ID ${jf.cr_id}.`)
          } else {
            setErrorVenda(jf?.message || 'Falha ao criar conta a receber')
          }
        } catch (err) {
          setErrorVenda('Falha ao criar conta a receber')
        }
      }
    } catch (e) {
      setErrorVenda(e instanceof Error ? e.message : 'Falha ao salvar venda')
    } finally {
      setIsSavingVenda(false)
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
              <Label className="text-sm text-slate-600">Fornecedor</Label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {fornecedorOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Centro de Custo</Label>
              <Select value={centroCustoId} onValueChange={setCentroCustoId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>
                  {centroCustoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Projeto</Label>
              <Select value={projetoId} onValueChange={setProjetoId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>
                  {projetoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Categoria de Despesa</Label>
              <Select value={categoriaDespesaId} onValueChange={setCategoriaDespesaId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>
                  {categoriaDespesaOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Filial</Label>
              <Select value={filialId} onValueChange={setFilialId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>
                  {filialOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="md:col-span-6">
              <Label className="text-sm text-slate-600">Produto</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {produtoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <a href="/erp/compras?tab=compras">Ver Compras</a>
            </Button>
          </div>
        </Card>

        {/* Venda (teste rápido) */}
        <h2 className="text-xl font-semibold text-slate-900 pt-4">BigQuery Test • Nova Venda</h2>
        <Card className="p-4">
          <div className="text-base font-semibold text-slate-800 mb-3">Dados da Venda (teste rápido)</div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Número Pedido</Label>
              <Input value={vNumeroPedido} onChange={(e) => setVNumeroPedido(e.target.value)} placeholder="PV-..." />
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Cliente</Label>
              <Select value={vClienteId} onValueChange={setVClienteId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clienteOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-slate-600">Canal de Venda</Label>
              <Select value={vCanalId} onValueChange={setVCanalId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {canalOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Data do Pedido</Label>
              <Input type="date" value={vDataPedido} onChange={(e) => setVDataPedido(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Valor Produtos</Label>
              <Input value={vValorProdutos} onChange={(e) => setVValorProdutos(e.target.value)} placeholder="100" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Frete</Label>
              <Input value={vValorFrete} onChange={(e) => setVValorFrete(e.target.value)} placeholder="0" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Desconto</Label>
              <Input value={vValorDesconto} onChange={(e) => setVValorDesconto(e.target.value)} placeholder="0" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-slate-600">Valor Total</Label>
              <Input value={vendaTotal} readOnly />
            </div>
          </div>
        </Card>
        <Card className="p-4 space-y-2">
          {errorVenda && <div className="text-sm text-red-600">{errorVenda}</div>}
          {successVenda && <div className="text-sm text-emerald-700">{successVenda}</div>}
          <div className="flex items-center gap-2">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={onSalvarVenda} disabled={isSavingVenda}>
              {isSavingVenda ? 'Salvando…' : 'Salvar Venda'}
            </Button>
            <Button variant="ghost" asChild>
              <a href="/erp/vendas?tab=pedidos">Ver Vendas</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
