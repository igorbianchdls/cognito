'use client'

import { useEffect, useMemo, useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

type PedidoRow = {
  valor_total_pedido?: number | string
  data_pedido?: string
  canal_venda?: string
  vendedor?: string
  cliente?: string
  numero_pedido?: string
  status?: string
  cidade_uf?: string
}

function formatBRL(v: unknown) {
  const n = Number(v ?? 0)
  if (isNaN(n)) return String(v ?? '')
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function toDateOnly(d: Date) {
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
function monthKeyFromStr(s?: string) { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : monthKey(d) }
function monthLabel(key: string) { const [y, m] = key.split('-').map(Number); const d = new Date(y, (m || 1) - 1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
function lastMonths(n: number) { const arr: string[] = []; const base = new Date(); for (let i= n-1;i>=0;i--){ const d=new Date(base.getFullYear(), base.getMonth()-i, 1); arr.push(monthKey(d)) } return arr }
function isCompleted(status?: string) { if (!status) return false; const s = status.toLowerCase(); return s.includes('conclu') || s.includes('fatur') || s.includes('pago') || s.includes('final') }

export default function VendasDashboardPage() {
  const [rows, setRows] = useState<PedidoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const url = `/api/modulos/vendas?view=pedidos&page=1&pageSize=1000&de=${de}`
        const res = await fetch(url, { cache: 'no-store' })
        let data: PedidoRow[] = []
        if (res.ok) {
          const j = (await res.json()) as { rows?: unknown[] }
          data = Array.isArray(j?.rows) ? (j.rows as unknown as PedidoRow[]) : []
        }
        if (data.length === 0) {
          // Fallback mock
          const base = new Date()
          const m0 = toDateOnly(base)
          const m1 = toDateOnly(new Date(base.getFullYear(), base.getMonth(), base.getDate()-1))
          const m2 = toDateOnly(new Date(base.getFullYear(), base.getMonth(), base.getDate()-2))
          data = [
            { numero_pedido: '#PED-1003', cliente: 'Cliente ABC', canal_venda: 'E-commerce', vendedor: 'Ana', valor_total_pedido: 5800, status: 'concluído', data_pedido: m0, cidade_uf: 'São Paulo - SP' },
            { numero_pedido: '#PED-1002', cliente: 'Empresa XYZ', canal_venda: 'Marketplace', vendedor: 'Bruno', valor_total_pedido: 3200, status: 'pendente', data_pedido: m0, cidade_uf: 'Rio de Janeiro - RJ' },
            { numero_pedido: '#PED-1001', cliente: 'Distribuidora DEF', canal_venda: 'Representante', vendedor: 'Carla', valor_total_pedido: 7450, status: 'concluído', data_pedido: m1, cidade_uf: 'Belo Horizonte - MG' },
            { numero_pedido: '#PED-0999', cliente: 'Comércio GHI', canal_venda: 'E-commerce', vendedor: 'Ana', valor_total_pedido: 4200, status: 'concluído', data_pedido: m2, cidade_uf: 'Curitiba - PR' },
          ]
        }
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load(); return () => { cancelled = true }
  }, [])

  // KPIs
  const kpis = useMemo(() => {
    const total = rows.reduce((acc, r) => acc + (Number(r.valor_total_pedido) || 0), 0)
    const pedidos = rows.length
    const completos = rows.filter(r => isCompleted(r.status)).length
    const ticket = pedidos > 0 ? total / pedidos : 0
    const conv = pedidos > 0 ? (completos / pedidos) * 100 : 0
    return { total, pedidos, ticket, conv }
  }, [rows])

  // Vendas por Canal / Vendedor / Cliente / Cidade
  const vendasPorCanal = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const k = r.canal_venda || 'Sem canal'
      m.set(k, (m.get(k) || 0) + (Number(r.valor_total_pedido) || 0))
    }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value).slice(0,6)
  }, [rows])
  const vendasPorVendedor = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const k = r.vendedor || 'Sem vendedor'
      m.set(k, (m.get(k) || 0) + (Number(r.valor_total_pedido) || 0))
    }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value).slice(0,6)
  }, [rows])
  const topClientes = useMemo(() => {
    const m = new Map<string, { total: number; pedidos: number }>()
    for (const r of rows) {
      const k = r.cliente || 'Cliente'
      const cur = m.get(k) || { total: 0, pedidos: 0 }
      cur.total += Number(r.valor_total_pedido) || 0; cur.pedidos += 1
      m.set(k, cur)
    }
    return Array.from(m, ([cliente, { total, pedidos }]) => ({ cliente, total, pedidos }))
      .sort((a,b)=>b.total-a.total).slice(0,5)
  }, [rows])
  const vendasPorCidade = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const k = r.cidade_uf || '—'
      m.set(k, (m.get(k) || 0) + (Number(r.valor_total_pedido) || 0))
    }
    return Array.from(m, ([cidade, total]) => ({ cidade, total })).sort((a,b)=>b.total-a.total).slice(0,4)
  }, [rows])
  const pedidosRecentes = useMemo(() => {
    return [...rows]
      .sort((a,b)=> new Date(b.data_pedido || 0).getTime() - new Date(a.data_pedido || 0).getTime())
      .slice(0,3)
  }, [rows])

  // Simple horizontal bars
  function HBars({ items, color }: { items: { label: string; value: number }[]; color: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{formatBRL(it.value)}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: '#ffffff' }}>
        <div style={{ background: 'white', paddingBottom: 16 }}>
          <PageHeader
            title="Dashboard de Vendas"
            subtitle="Visão geral de performance e vendas"
            titleFontFamily="var(--font-crimson-text)"
          />
        </div>

        <div className="flex-1 p-6">
          {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Vendas (6m)</div>
              <div className="text-2xl font-bold text-blue-600">{formatBRL(kpis.total)}</div>
              <div className="text-xs text-gray-400 mt-1">Soma de pedidos</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Ticket Médio</div>
              <div className="text-2xl font-bold text-green-600">{formatBRL(kpis.ticket)}</div>
              <div className="text-xs text-gray-400 mt-1">Total / pedidos</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Pedidos</div>
              <div className="text-2xl font-bold text-purple-600">{kpis.pedidos}</div>
              <div className="text-xs text-gray-400 mt-1">Registros no período</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-orange-600">{kpis.conv.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1">Concluídos / total</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Vendas por Canal</h3>
              <HBars items={vendasPorCanal} color="bg-blue-500" />
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Performance da Equipe</h3>
              <HBars items={vendasPorVendedor} color="bg-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Clientes</h3>
              <div className="space-y-3">
                {topClientes.length === 0 ? (
                  <div className="text-sm text-gray-400">Sem dados</div>
                ) : topClientes.map((c) => (
                  <div key={c.cliente} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium text-sm">{c.cliente}</div>
                      <div className="text-xs text-gray-500">{c.pedidos} pedidos</div>
                    </div>
                    <div className="font-semibold text-blue-600">{formatBRL(c.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Vendas por Cidade/UF</h3>
              <div className="space-y-3">
                {vendasPorCidade.length === 0 ? (
                  <div className="text-sm text-gray-400">Sem dados</div>
                ) : vendasPorCidade.map((x) => (
                  <div key={x.cidade} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-sm">{x.cidade}</span>
                    </div>
                    <span className="font-semibold text-sm">{formatBRL(x.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Pedidos Recentes</h3>
              <div className="space-y-3">
                {pedidosRecentes.length === 0 ? (
                  <div className="text-sm text-gray-400">Sem pedidos recentes</div>
                ) : pedidosRecentes.map((p) => (
                  <div key={p.numero_pedido ?? `${p.cliente}-${p.data_pedido}`} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium text-sm">{p.numero_pedido || 'Pedido'}</div>
                      <div className="text-xs text-gray-500">{p.cliente || '—'} • {new Date(p.data_pedido || '').toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${isCompleted(p.status) ? 'text-green-600' : 'text-orange-600'}`}>{formatBRL(p.valor_total_pedido)}</div>
                      <div className={`text-xs text-right ${isCompleted(p.status) ? 'text-green-600' : 'text-orange-600'}`}>{p.status || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
