"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'
import PageHeader from '@/components/modulos/PageHeader'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import EntryInfoCard, { type EntryInfoValues } from '@/components/modulos/financeiro/shared/EntryInfoCard'
import PaymentConditionHeader, { type PaymentConditionConfig } from '@/components/modulos/financeiro/shared/PaymentConditionHeader'
import ParcelasEditor, { type Parcela } from '@/components/modulos/financeiro/shared/ParcelasEditor'
import { addDays } from '@/lib/date-utils'

export default function NovaDespesaPage() {
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

  const [tenantId, setTenantId] = React.useState<string>('1')
  const [numeroDocumento, setNumeroDocumento] = React.useState<string>('')
  const [dataDocumento, setDataDocumento] = React.useState<string>('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [fornecedorOptions, setFornecedorOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [categoriaDespesaOptions, setCategoriaDespesaOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [centroCustoOptions, setCentroCustoOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [filialOptions, setFilialOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [projetoOptions, setProjetoOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [formasPagamentoOptions, setFormasPagamentoOptions] = React.useState<Array<{ value: string; label: string }>>([])
  const [contaFinanceiraOptions, setContaFinanceiraOptions] = React.useState<Array<{ value: string; label: string }>>([])

  const [repetirLancamento, setRepetirLancamento] = React.useState(false)
  const [cond, setCond] = React.useState<PaymentConditionConfig>({ parcelas: 1, primeiroVenc: '', intervaloDias: 30, formaPadrao: '', contaPadrao: '' })
  const [parcelas, setParcelas] = React.useState<Parcela[]>([])
  const [observacoes, setObservacoes] = React.useState('')
  const [tab, setTab] = React.useState('obs')

  React.useEffect(() => {
    const ac = new AbortController()
    async function load() {
      try {
        const [fRes, catRes, ccRes, filRes, prjRes, mpRes, cfRes] = await Promise.all([
          fetch('/api/modulos/financeiro/fornecedores/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro/categorias-despesa/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/empresa?view=centros-de-custo&pageSize=500', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/empresa?view=filiais&pageSize=500', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro?view=projetos&pageSize=1000', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro/metodos-pagamento/list', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/modulos/financeiro/contas-financeiras/list', { cache: 'no-store', signal: ac.signal }),
        ])
        if (fRes.ok) {
          const j = await fRes.json(); setFornecedorOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (catRes.ok) {
          const j = await catRes.json(); setCategoriaDespesaOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (ccRes.ok) {
          const j = await ccRes.json(); setCentroCustoOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (filRes.ok) {
          const j = await filRes.json(); setFilialOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (prjRes.ok) {
          const j = await prjRes.json(); setProjetoOptions((j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })))
        }
        if (mpRes.ok) {
          const j = await mpRes.json(); const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })); setFormasPagamentoOptions(opts); setCond((prev) => ({ ...prev, formaPadrao: prev.formaPadrao || (opts[0]?.value || '') }))
        }
        if (cfRes.ok) {
          const j = await cfRes.json(); const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome })); setContaFinanceiraOptions(opts); setCond((prev) => ({ ...prev, contaPadrao: prev.contaPadrao || (opts[0]?.value || '') }))
        }
      } catch {}
    }
    load()
    return () => ac.abort()
  }, [])

  async function onSalvar() {
    setError(null)
    setIsSaving(true)
    try {
      const fornecedor = Number(info.entidade)
      if (!fornecedor) throw new Error('Selecione um fornecedor')
      const raw = info.valor.replace(/\./g, '').replace(/,/g, '.')
      const valorNum = Number(raw)
      if (!Number.isFinite(valorNum) || valorNum <= 0) throw new Error('Informe um valor válido')
      const dataVenc = parcelas[0]?.vencimento || ''
      if (!dataVenc) throw new Error('Informe o 1º vencimento')

      const payload = {
        tenant_id: Number(tenantId || '1'),
        fornecedor_id: fornecedor,
        categoria_id: info.categoria ? Number(info.categoria) : null,
        centro_custo_id: info.centro ? Number(info.centro) : null,
        filial_id: info.filial ? Number(info.filial) : null,
        projeto_id: info.projeto ? Number(info.projeto) : null,
        descricao: info.descricao || 'Conta a pagar',
        valor: valorNum,
        data_lancamento: info.dataCompetencia || new Date().toISOString().slice(0,10),
        data_documento: dataDocumento || null,
        numero_documento: numeroDocumento || null,
        data_vencimento: dataVenc,
        status: 'pendente',
      }

      const res = await fetch('/api/modulos/financeiro/contas-a-pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      router.push('/modulos/financeiro?tab=contas-a-pagar')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const formasPagamento = React.useMemo(() => [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'transferencia', label: 'Transferência' },
  ], [])
  const contas = React.useMemo(() => [
    { value: 'b1', label: 'Banco 1 - 0001' },
    { value: 'b2', label: 'Banco 2 - 0002' },
  ], [])

  const totalValor = React.useMemo(() => {
    const raw = info.valor.replace(/\./g, '').replace(/,/g, '.')
    const n = Number(raw)
    return isNaN(n) ? 0 : n
  }, [info.valor])

  function recalcFromConfig(c: PaymentConditionConfig, total: number) {
    const n = Math.max(1, c.parcelas || 1)
    const base = Number((total / n).toFixed(2))
    let residual = Number((total - base * (n - 1)).toFixed(2))
    const list: Parcela[] = []
    for (let i = 0; i < n; i++) {
      const venc = c.primeiroVenc ? addDays(c.primeiroVenc, i * (c.intervaloDias || 30)) : ''
      const val = i === n - 1 ? residual : base
      const perc = total ? Number(((val / total) * 100).toFixed(2)) : 0
      list.push({ index: i + 1, vencimento: venc, valor: val, percentual: perc, forma: '', conta: '', descricao: '' })
    }
    setParcelas(list)
  }
  React.useEffect(() => { recalcFromConfig(cond, totalValor) }, [cond.parcelas, cond.primeiroVenc, cond.intervaloDias, totalValor])
  const onChangeParcel = (idx: number, patch: Partial<Parcela>) => setParcelas((prev) => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div className="mb-3">
                  <PageHeader title="Nova Despesa" subtitle="Preencha as informações para criar a conta a pagar" />
                </div>

                <div className="space-y-4">
                  <EntryInfoCard
                    values={info}
                    onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))}
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
                      <div className="md:col-span-4">
                        <Label className="text-sm text-slate-600">Número do Documento</Label>
                        <Input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="Opcional" />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Data do Documento</Label>
                        <Input type="date" value={dataDocumento} onChange={(e) => setDataDocumento(e.target.value)} />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 mx-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-base font-semibold text-slate-800">Condição de pagamento</div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-slate-600">Repetir lançamento?</Label>
                        {/* Reutilizaremos o switch global quando necessário */}
                      </div>
                    </div>

                    <PaymentConditionHeader
                      config={cond}
                      onChange={(patch) => setCond((prev) => ({ ...prev, ...patch }))}
                      formasPagamento={formasPagamentoOptions}
                      contas={contaFinanceiraOptions}
                    />

                    <div className="mt-5">
                      <ParcelasEditor
                        total={totalValor}
                        parcelas={parcelas}
                        onChangeParcel={onChangeParcel}
                        formasPagamento={formasPagamentoOptions}
                        contas={contaFinanceiraOptions}
                        formaPadrao={cond.formaPadrao}
                        contaPadrao={cond.contaPadrao}
                      />
                    </div>
                  </Card>

                  <Card className="p-4 mx-4">
                    <Tabs value={tab} onValueChange={setTab}>
                      <TabsList className="mb-3">
                        <TabsTrigger value="obs">Observações</TabsTrigger>
                        <TabsTrigger value="anexo">Anexo</TabsTrigger>
                      </TabsList>
                      <TabsContent value="obs">
                        <Label className="text-xs text-slate-600">Observações</Label>
                        <textarea
                          className="mt-1 w-full min-h-[120px] rounded bg-gray-50 border-0 p-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-400/40"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Anotações gerais sobre este lançamento"
                        />
                      </TabsContent>
                      <TabsContent value="anexo">
                        <div className="border-2 border-dashed border-gray-300 bg-white rounded p-6 text-sm text-slate-500">
                          Área de anexo (UI apenas). Arraste arquivos aqui.
                        </div>
                      </TabsContent>
                    </Tabs>
                  </Card>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 left-0 right-0 mt-4 bg-white/80 backdrop-blur border-t border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/modulos/financeiro?tab=contas-a-pagar" className="inline-flex">
                      <Button variant="outline" disabled={isSaving}>Voltar</Button>
                    </Link>
                    <div className="flex items-center gap-3">
                      {error && <div className="text-sm text-red-600">{error}</div>}
                      <Button onClick={onSalvar} className="bg-emerald-600 hover:bg-emerald-700" disabled={isSaving}>{isSaving ? 'Salvando…' : 'Salvar'}</Button>
                    </div>
                  </div>
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
