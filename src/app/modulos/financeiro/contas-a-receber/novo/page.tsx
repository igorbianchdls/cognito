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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import PaymentConditionHeader, { type PaymentConditionConfig } from '@/components/modulos/financeiro/contas-a-receber/PaymentConditionHeader'
import ParcelasEditor, { type Parcela } from '@/components/modulos/financeiro/contas-a-receber/ParcelasEditor'
import { addDays } from '@/lib/date-utils'

export default function NovaReceitaPage() {
  const router = useRouter()

  const [dataCompetencia, setDataCompetencia] = React.useState('')
  const [cliente, setCliente] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [valor, setValor] = React.useState('')
  const [habilitarRateio, setHabilitarRateio] = React.useState(false)
  const [categoria, setCategoria] = React.useState('')
  const [centroCusto, setCentroCusto] = React.useState('')
  const [codigoReferencia, setCodigoReferencia] = React.useState('')

  const [repetirLancamento, setRepetirLancamento] = React.useState(false)
  // Condição de pagamento (cabeçalho)
  const [cond, setCond] = React.useState<PaymentConditionConfig>({ parcelas: 1, primeiroVenc: '', intervaloDias: 30, formaPadrao: '', contaPadrao: '' })
  // Parcelas
  const [parcelas, setParcelas] = React.useState<Parcela[]>([])
  const [recebido, setRecebido] = React.useState(false)
  const [informarNSU, setInformarNSU] = React.useState(false)
  const [nsu, setNsu] = React.useState('')
  const [observacoes, setObservacoes] = React.useState('')
  const [tab, setTab] = React.useState('obs')

  function onSalvar() {
    // UI-only: apenas demonstração
    console.log('Salvar (stub):', {
      dataCompetencia, cliente, descricao, valor, habilitarRateio, categoria, centroCusto, codigoReferencia,
      repetirLancamento, cond, parcelas, recebido, informarNSU, nsu, observacoes,
    })
    router.push('/modulos/financeiro?tab=contas-a-receber')
  }

  // Options (mock UI-only)
  const formasPagamento = React.useMemo(() => [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'transferencia', label: 'Transferência' },
  ], [])
  const contas = React.useMemo(() => [
    { value: 'b1', label: 'PagHiper banco 001' },
    { value: 'b2', label: 'Banco 2 - 0002' },
  ], [])

  // Helpers
  const totalValor = React.useMemo(() => {
    const raw = valor.replace(/\./g, '').replace(/,/g, '.')
    const n = Number(raw)
    return isNaN(n) ? 0 : n
  }, [valor])

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

  // Recalcular quando mudar condicoes ou total
  React.useEffect(() => { recalcFromConfig(cond, totalValor) }, [cond.parcelas, cond.primeiroVenc, cond.intervaloDias, totalValor])

  const onChangeParcel = (idx: number, patch: Partial<Parcela>) => {
    setParcelas((prev) => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))
  }

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
                  <PageHeader title="Nova Receita" subtitle="Preencha as informações para criar a conta a receber" />
                </div>

                <div className="space-y-4">
                  {/* Informações do lançamento */}
                  <Card className="p-4 mx-1">
                    <div className="text-sm font-semibold text-slate-800 mb-3">Informações do lançamento</div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs text-slate-600">Data de competência *</Label>
                        <Input type="date" value={dataCompetencia} onChange={(e) => setDataCompetencia(e.target.value)} />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-xs text-slate-600">Cliente</Label>
                        <Select value={cliente} onValueChange={setCliente}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Cliente A</SelectItem>
                            <SelectItem value="2">Cliente B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-xs text-slate-600">Descrição *</Label>
                        <Input placeholder="Descrição da receita" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-slate-600">Valor *</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">R$</span>
                          <Input placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
                        </div>
                      </div>

                      <div className="md:col-span-2 flex items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={habilitarRateio} onCheckedChange={setHabilitarRateio} />
                          <Label className="text-xs text-slate-600">Habilitar rateio</Label>
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs text-slate-600">Categoria</Label>
                        <Select value={categoria} onValueChange={setCategoria}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cat1">Vendas</SelectItem>
                            <SelectItem value="cat2">Serviços</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs text-slate-600">Centro de custo</Label>
                        <Select value={centroCusto} onValueChange={setCentroCusto}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cc1">Geral</SelectItem>
                            <SelectItem value="cc2">Projeto X</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-slate-600">Código de referência</Label>
                        <Input value={codigoReferencia} onChange={(e) => setCodigoReferencia(e.target.value)} />
                      </div>
                    </div>
                  </Card>

                  {/* Condição de pagamento */}
                  <Card className="p-4 mx-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-slate-800">Condição de pagamento</div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-600">Repetir lançamento?</Label>
                        <Switch checked={repetirLancamento} onCheckedChange={setRepetirLancamento} />
                      </div>
                    </div>

                    <PaymentConditionHeader
                      config={cond}
                      onChange={(patch) => setCond((prev) => ({ ...prev, ...patch }))}
                      formasPagamento={formasPagamento}
                      contas={contas}
                    />

                    <div className="mt-5">
                      <ParcelasEditor
                        total={totalValor}
                        parcelas={parcelas}
                        onChangeParcel={onChangeParcel}
                        formasPagamento={formasPagamento}
                        contas={contas}
                        formaPadrao={cond.formaPadrao}
                        contaPadrao={cond.contaPadrao}
                      />
                    </div>
                  </Card>

                  {/* Observações / Anexo */}
                  <Card className="p-4 mx-1">
                    <Tabs value={tab} onValueChange={setTab}>
                      <TabsList className="mb-3">
                        <TabsTrigger value="obs">Observações</TabsTrigger>
                        <TabsTrigger value="anexo">Anexo</TabsTrigger>
                      </TabsList>
                      <TabsContent value="obs">
                        <Label className="text-xs text-slate-600">Observações</Label>
                        <textarea
                          className="mt-1 w-full min-h-[120px] rounded border border-gray-300 bg-white p-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-400/40"
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
                    <Link href="/modulos/financeiro?tab=contas-a-receber" className="inline-flex">
                      <Button variant="outline">Voltar</Button>
                    </Link>
                    <Button onClick={onSalvar} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
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
