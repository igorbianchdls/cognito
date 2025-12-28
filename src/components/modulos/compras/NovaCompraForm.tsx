"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import EntryInfoCard, { type EntryInfoValues } from "@/components/modulos/financeiro/shared/EntryInfoCard"
import PaymentConditionHeader, { type PaymentConditionConfig } from "@/components/modulos/financeiro/shared/PaymentConditionHeader"
import ParcelasEditor, { type Parcela } from "@/components/modulos/financeiro/shared/ParcelasEditor"
import CompraItemsEditor, { type CompraItem } from "@/components/modulos/compras/CompraItemsEditor"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [tenantId, setTenantId] = React.useState<string>('1')
  const [numeroOc, setNumeroOc] = React.useState<string>('')
  const [dataEntregaPrevista, setDataEntregaPrevista] = React.useState<string>('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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

  const [produtoOptions, setProdutoOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [fornecedorOptions, setFornecedorOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [centroCustoOptions, setCentroCustoOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [categoriaDespesaOptions, setCategoriaDespesaOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [filialOptions, setFilialOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [projetoOptions, setProjetoOptions] = React.useState<Array<{ value: string; label: string }>>([])

  React.useEffect(() => {
    // Carregar fornecedores
    const ac = new AbortController()
    async function load() {
      try {
        const [fRes, pRes, ccRes, cdRes, filRes, prjRes] = await Promise.all([
          // Fornecedores reais: entidades.fornecedores
          fetch('/api/modulos/financeiro/fornecedores/list', { cache: 'no-store', signal: ac.signal }),
          // Produtos
          fetch('/api/modulos/produtos/produtos/list', { cache: 'no-store', signal: ac.signal }),
          // Centros de custo
          fetch('/api/modulos/empresa?view=centros-de-custo&pageSize=500', { cache: 'no-store', signal: ac.signal }),
          // Categorias de despesa
          fetch('/api/modulos/financeiro/categorias-despesa/list', { cache: 'no-store', signal: ac.signal }),
          // Filiais
          fetch('/api/modulos/empresa?view=filiais&pageSize=500', { cache: 'no-store', signal: ac.signal }),
          // Projetos
          fetch('/api/modulos/financeiro?view=projetos&pageSize=1000', { cache: 'no-store', signal: ac.signal })
        ])
        if (fRes.ok) {
          const j = await fRes.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setFornecedorOptions(opts)
        }
        if (pRes.ok) {
          const j = await pRes.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setProdutoOptions(opts)
        }
        if (ccRes.ok) {
          const j = await ccRes.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setCentroCustoOptions(opts)
        }
        if (cdRes.ok) {
          const j = await cdRes.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setCategoriaDespesaOptions(opts)
        }
        if (filRes.ok) {
          const j = await filRes.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setFilialOptions(opts)
        }
        if (prjRes.ok) {
          const j = await prjRes.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setProjetoOptions(opts)
        }
      } catch {}
    }
    load()
    return () => ac.abort()
  }, [])

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

  async function onSalvar() {
    setError(null)
    setIsSaving(true)
    try {
      const fornecedor = Number(info.entidade)
      if (!fornecedor) throw new Error('Selecione um fornecedor')
      const linhas = itens
        .filter(it => it.produto && Number(it.quantidade) > 0)
        .map(it => ({
          produto_id: Number(it.produto),
          quantidade: Number(it.quantidade),
          unidade_medida: it.unidade,
          preco_unitario: Number(it.valorUnitario),
          total: Number((Number(it.quantidade) * Number(it.valorUnitario)).toFixed(2))
        }))
      if (!linhas.length) throw new Error('Adicione ao menos um item com produto e quantidade')

      const payload = {
        tenant_id: Number(tenantId || '1'),
        fornecedor_id: fornecedor,
        centro_custo_id: info.centro ? Number(info.centro) : null,
        filial_id: info.filial ? Number(info.filial) : null,
        projeto_id: info.projeto ? Number(info.projeto) : null,
        categoria_despesa_id: info.categoria ? Number(info.categoria) : null,
        numero_oc: numeroOc || null,
        data_emissao: info.dataCompetencia || null,
        data_entrega_prevista: dataEntregaPrevista || null,
        status: 'rascunho',
        observacoes: info.descricao || null,
        linhas,
      }
      const res = await fetch('/api/modulos/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      router.push('/modulos/compras?tab=compras')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <EntryInfoCard
        values={info}
        onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))}
        title="Informações da compra"
        entityLabel="Fornecedor"
        categoryLabel="Categoria de Despesa"
        centerLabel="Centro de custo"
        entityOptions={fornecedorOptions}
        categoryOptions={categoriaDespesaOptions}
        centerOptions={centroCustoOptions}
        branchOptions={filialOptions}
        projectOptions={projetoOptions}
      />

      <Card className="p-4 mx-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <Label className="text-sm text-slate-600">Tenant ID</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="1" />
          </div>
          <div className="md:col-span-3">
            <Label className="text-sm text-slate-600">Número OC</Label>
            <Input value={numeroOc} onChange={(e) => setNumeroOc(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="md:col-span-3">
            <Label className="text-sm text-slate-600">Entrega prevista</Label>
            <Input type="date" value={dataEntregaPrevista} onChange={(e) => setDataEntregaPrevista(e.target.value)} />
          </div>
        </div>
      </Card>

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

      <Card className="p-4 mx-4 space-y-2">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/modulos/compras?tab=compras')} disabled={isSaving}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSalvar} disabled={isSaving}>{isSaving ? 'Salvando…' : 'Salvar'}</Button>
        </div>
      </Card>
    </div>
  )
}
