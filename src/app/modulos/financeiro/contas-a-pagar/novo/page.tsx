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

  const [repetirLancamento, setRepetirLancamento] = React.useState(false)
  const [cond, setCond] = React.useState<PaymentConditionConfig>({ parcelas: 1, primeiroVenc: '', intervaloDias: 30, formaPadrao: '', contaPadrao: '' })
  const [parcelas, setParcelas] = React.useState<Parcela[]>([])
  const [observacoes, setObservacoes] = React.useState('')
  const [tab, setTab] = React.useState('obs')

  function onSalvar() {
    console.log('Salvar (AP stub):', { info, repetirLancamento, cond, parcelas, observacoes })
    router.push('/modulos/financeiro?tab=contas-a-pagar')
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
                    categoryLabel="Categoria"
                    centerLabel="Centro de custo"
                  />

                  <Card className="p-4 mx-3">
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

                  <Card className="p-4 mx-3">
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
