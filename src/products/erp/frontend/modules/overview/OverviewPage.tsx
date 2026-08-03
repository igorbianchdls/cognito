'use client'

import { useCallback, useEffect, useState } from 'react'
import { BanknoteArrowDown, BanknoteArrowUp, ClipboardList, Loader2, RefreshCw, ShoppingBag, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ErpMetricCard } from '@/products/erp/frontend/components/ErpMetricCard'
import { ErpPageHeader } from '@/products/erp/frontend/components/ErpPageHeader'

type Overview = { saldoReceber: number; saldoPagar: number; receberVencido: number; vendasRascunho: number; comprasAbertas: number; clientesAtivos: number }
const empty: Overview = { saldoReceber: 0, saldoPagar: 0, receberVencido: 0, vendasRascunho: 0, comprasAbertas: 0, clientesAtivos: 0 }
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function OverviewPage() {
  const [data, setData] = useState<Overview>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/erp/resumo', { cache: 'no-store' })
      const body = await response.json().catch(() => ({})) as Overview & { error?: string }
      if (!response.ok) throw new Error(body.error || 'Nao foi possivel carregar o resumo.')
      setData(body)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o resumo.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const metrics = [
    { label: 'Saldo a receber', value: currency(data.saldoReceber), detail: 'parcelas em aberto', tone: 'success' as const },
    { label: 'Saldo a pagar', value: currency(data.saldoPagar), detail: 'compromissos em aberto', tone: 'warning' as const },
    { label: 'Recebimentos vencidos', value: currency(data.receberVencido), detail: 'exigem acompanhamento', tone: 'danger' as const },
    { label: 'Clientes ativos', value: String(data.clientesAtivos), detail: 'cadastros disponiveis' },
  ]
  const queues = [
    { label: 'Vendas em rascunho', value: data.vendasRascunho, icon: ShoppingBag, href: '/erp/vendas/pedidos' },
    { label: 'Compras em aberto', value: data.comprasAbertas, icon: ClipboardList, href: '/erp/compras/pedidos-compra' },
    { label: 'Contas a receber', value: currency(data.saldoReceber), icon: BanknoteArrowUp, href: '/erp/financeiro/contas-a-receber' },
    { label: 'Contas a pagar', value: currency(data.saldoPagar), icon: BanknoteArrowDown, href: '/erp/financeiro/contas-a-pagar' },
  ]

  return <div className="flex min-h-full flex-col gap-6">
    <div className="flex items-start justify-between"><ErpPageHeader eyebrow="ERP" title="Visao geral" description="Posicao operacional e financeira atual." /><Button variant="outline" size="icon" title="Atualizar" onClick={() => void load()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}</Button></div>
    {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <ErpMetricCard key={metric.label} metric={metric} />)}</div>
    <section className="border-t pt-5"><div className="mb-4 flex items-center gap-2"><Users className="size-4 text-gray-500" /><h2 className="text-sm font-semibold text-gray-950">Filas de trabalho</h2></div><div className="grid gap-3 md:grid-cols-2">{queues.map((queue) => { const Icon = queue.icon; return <a key={queue.label} href={queue.href} className="flex items-center gap-3 rounded-md border bg-white px-4 py-4 transition-colors hover:bg-gray-50"><div className="flex size-9 items-center justify-center rounded-md bg-gray-100 text-gray-700"><Icon className="size-5" /></div><div className="min-w-0 flex-1 text-sm font-medium text-gray-950">{queue.label}</div><div className="text-base font-semibold text-gray-950">{queue.value}</div></a> })}</div></section>
  </div>
}
