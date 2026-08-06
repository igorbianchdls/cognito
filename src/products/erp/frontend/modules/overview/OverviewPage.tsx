'use client'

import { useCallback, useEffect, useState } from 'react'
import { BanknoteArrowDown, BanknoteArrowUp, ClipboardList, Landmark, Loader2, PackageSearch, RefreshCw, ShoppingBag, Users, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ErpMetricCard } from '@/products/erp/frontend/components/ErpMetricCard'
import { ErpPageHeader } from '@/products/erp/frontend/components/ErpPageHeader'

type Overview = { saldoReceber: number; saldoPagar: number; receberVencido: number; vendasRascunho: number; comprasAbertas: number; clientesAtivos: number }
type ProfessionalOverview = { saldo_receber: number; saldo_pagar: number; receber_vencido: number; pagar_proximos_7_dias: number; vendas_mes: number; compras_mes: number; vendas_mes_anterior: number; compras_mes_anterior: number; saldo_atual: number; margem_bruta_mes: number; produtos_repor: number; conciliacoes_pendentes: number; ordens_abertas: number }
const empty: Overview = { saldoReceber: 0, saldoPagar: 0, receberVencido: 0, vendasRascunho: 0, comprasAbertas: 0, clientesAtivos: 0 }
const professionalEmpty: ProfessionalOverview = { saldo_receber: 0, saldo_pagar: 0, receber_vencido: 0, pagar_proximos_7_dias: 0, vendas_mes: 0, compras_mes: 0, vendas_mes_anterior: 0, compras_mes_anterior: 0, saldo_atual: 0, margem_bruta_mes: 0, produtos_repor: 0, conciliacoes_pendentes: 0, ordens_abertas: 0 }
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function OverviewPage() {
  const [data, setData] = useState<Overview>(empty)
  const [professional, setProfessional] = useState<ProfessionalOverview>(professionalEmpty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [response, professionalResponse] = await Promise.all([
        fetch('/api/erp/resumo', { cache: 'no-store' }),
        fetch('/api/erp/resumo/profissional', { cache: 'no-store' }),
      ])
      const body = await response.json().catch(() => ({})) as Overview & { error?: string }
      const professionalBody = await professionalResponse.json().catch(() => ({})) as ProfessionalOverview & { error?: string | { message?: string } }
      if (!response.ok) throw new Error(body.error || 'Nao foi possivel carregar o resumo.')
      if (!professionalResponse.ok) throw new Error(typeof professionalBody.error === 'string' ? professionalBody.error : professionalBody.error?.message || 'Nao foi possivel carregar os indicadores.')
      setData(body); setProfessional(professionalBody)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o resumo.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const percent = (current: number, previous: number) => previous ? `${current >= previous ? '+' : ''}${(((current - previous) / previous) * 100).toFixed(1)}% contra o mes anterior` : 'sem base no mes anterior'
  const metrics = [
    { label: 'Saldo atual', value: currency(professional.saldo_atual), detail: 'contas financeiras' },
    { label: 'Saldo projetado', value: currency(professional.saldo_atual + professional.saldo_receber - professional.saldo_pagar), detail: 'saldo mais recebimentos menos pagamentos', tone: 'success' as const },
    { label: 'Vendas no mes', value: currency(professional.vendas_mes), detail: percent(professional.vendas_mes, professional.vendas_mes_anterior), tone: 'success' as const },
    { label: 'Compras no mes', value: currency(professional.compras_mes), detail: percent(professional.compras_mes, professional.compras_mes_anterior), tone: 'warning' as const },
    { label: 'Margem bruta', value: currency(professional.margem_bruta_mes), detail: 'vendas menos custo dos itens' },
    { label: 'Recebimentos vencidos', value: currency(professional.receber_vencido), detail: 'exigem acompanhamento', tone: 'danger' as const },
    { label: 'A pagar em 7 dias', value: currency(professional.pagar_proximos_7_dias), detail: 'proximos vencimentos', tone: 'warning' as const },
    { label: 'Clientes ativos', value: String(data.clientesAtivos), detail: 'cadastros disponiveis' },
  ]
  const queues = [
    { label: 'Vendas em rascunho', value: data.vendasRascunho, icon: ShoppingBag, href: '/erp/vendas/pedidos' },
    { label: 'Compras em aberto', value: data.comprasAbertas, icon: ClipboardList, href: '/erp/compras/pedidos-compra' },
    { label: 'Contas a receber', value: currency(data.saldoReceber), icon: BanknoteArrowUp, href: '/erp/financeiro/contas-a-receber' },
    { label: 'Contas a pagar', value: currency(data.saldoPagar), icon: BanknoteArrowDown, href: '/erp/financeiro/contas-a-pagar' },
    { label: 'Reposicao de estoque', value: professional.produtos_repor, icon: PackageSearch, href: '/erp/estoque/posicao-estoque' },
    { label: 'Conciliacoes pendentes', value: professional.conciliacoes_pendentes, icon: Landmark, href: '/erp/financeiro/conciliacao-bancaria' },
    { label: 'Ordens em andamento', value: professional.ordens_abertas, icon: Wrench, href: '/erp/vendas/ordens-servico' },
  ]

  return <div className="flex min-h-full flex-col gap-6">
    <div className="flex items-start justify-between"><ErpPageHeader eyebrow="ERP" title="Visao geral" description="Posicao operacional e financeira atual." /><Button variant="outline" size="icon" title="Atualizar" onClick={() => void load()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}</Button></div>
    {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <ErpMetricCard key={metric.label} metric={metric} />)}</div>
    <section className="border-t pt-5"><div className="mb-4 flex items-center gap-2"><Users className="size-4 text-gray-500" /><h2 className="text-sm font-semibold text-gray-950">Filas de trabalho</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{queues.map((queue) => { const Icon = queue.icon; return <a key={queue.label} href={queue.href} className="flex items-center gap-3 rounded-md border bg-white px-4 py-4 transition-colors hover:bg-gray-50"><div className="flex size-9 items-center justify-center rounded-md bg-gray-100 text-gray-700"><Icon className="size-5" /></div><div className="min-w-0 flex-1 text-sm font-medium text-gray-950">{queue.label}</div><div className="text-base font-semibold text-gray-950">{queue.value}</div></a> })}</div></section>
  </div>
}
