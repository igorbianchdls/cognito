'use client'

import { useState } from 'react'
import { BarChart3, CircleDollarSign, FileText, LayoutDashboard, Package, ReceiptText, Search, ShoppingCart, Users } from 'lucide-react'

import { productViews } from '@/assets/landingpages/otto/landingContent'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Visão geral' },
  { icon: Users, label: 'Clientes' },
  { icon: ShoppingCart, label: 'Vendas' },
  { icon: Package, label: 'Compras' },
  { icon: CircleDollarSign, label: 'A receber' },
  { icon: ReceiptText, label: 'A pagar' },
]

const toneClasses = {
  info: 'text-[#1d5fbf]',
  neutral: 'text-[#505650]',
  positive: 'text-[#23743a]',
  warning: 'text-[#9a6416]',
}

export function ProductShowcase() {
  const [activeId, setActiveId] = useState<(typeof productViews)[number]['id']>('financeiro')
  const active = productViews.find((view) => view.id === activeId) ?? productViews[0]

  return (
    <div id="produto" className="scroll-mt-24">
      <div className="mb-7 overflow-x-auto border-b border-[#dfe3df]">
        <div className="flex min-w-max gap-7" role="tablist" aria-label="Áreas do produto">
          {productViews.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeId === view.id}
              onClick={() => setActiveId(view.id)}
              className={`border-b-2 px-0 pb-3 text-sm font-medium transition-colors ${activeId === view.id ? 'border-[#181818] text-[#181818]' : 'border-transparent text-[#747a74] hover:text-[#303530]'}`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-3 md:grid-cols-[1fr_1.15fr] md:items-end">
        <h2 className="max-w-[520px] text-[30px] font-medium leading-[1.2] text-[#181818] sm:text-[38px]">{active.title}</h2>
        <p className="max-w-[560px] text-[15px] leading-7 text-[#626862] md:justify-self-end">{active.description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#dfe3df] bg-white shadow-[0_28px_80px_-52px_rgba(30,50,34,0.38)]">
        <div className="flex h-14 items-center border-b border-[#e5e8e4] bg-[#fbfcfb] px-4 sm:px-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#252825]">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#181818] text-[10px] font-semibold text-white">O</span>
            Otto
          </div>
          <div className="ml-auto hidden h-8 w-[220px] items-center gap-2 rounded-md border border-[#e1e4e0] bg-white px-3 text-xs text-[#929792] sm:flex">
            <Search className="h-3.5 w-3.5" />
            Buscar na empresa
          </div>
          <div className="ml-3 grid h-8 w-8 place-items-center rounded-md bg-[#edf4ee] text-xs font-medium text-[#31543a]">IS</div>
        </div>

        <div className="grid md:grid-cols-[168px_minmax(0,1fr)]">
          <aside className="hidden border-r border-[#e5e8e4] bg-[#f7f8f6] p-3 md:block">
            <p className="px-2 pb-3 pt-1 text-[10px] font-medium uppercase text-[#929792]">ERP</p>
            <div className="grid gap-1">
              {sidebarItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className={`flex h-9 items-center gap-2.5 rounded-md px-2 text-xs font-medium ${index === 0 ? 'bg-white text-[#181818] shadow-sm' : 'text-[#696f69]'}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="min-w-0 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-medium text-[#202320]">Visão geral</p>
                <p className="mt-1 text-xs text-[#858b85]">Atualizado agora</p>
              </div>
              <button type="button" className="hidden h-9 items-center gap-2 rounded-md border border-[#dfe3df] px-3 text-xs font-medium text-[#4d534d] sm:flex">
                <BarChart3 className="h-3.5 w-3.5" />
                Ver relatório
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 border-y border-[#e5e8e4] lg:grid-cols-4">
              {active.metrics.map((metric, index) => (
                <div key={metric.label} className={`min-w-0 px-3 py-4 sm:px-4 ${index % 2 ? '' : 'border-r border-[#e5e8e4]'} ${index === 1 ? 'lg:border-r' : ''} ${index === 2 ? 'border-r border-[#e5e8e4]' : ''} ${index > 1 ? 'border-t border-[#e5e8e4] lg:border-t-0' : ''}`}>
                  <p className="truncate text-[11px] text-[#7b817b]">{metric.label}</p>
                  <p className={`mt-2 truncate text-lg font-medium sm:text-xl ${toneClasses[metric.tone]}`}>{metric.value}</p>
                  <p className="mt-1 truncate text-[10px] text-[#929792]">{metric.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#dfe3df]">
                    {active.columns.map((column) => <th key={column} className="px-3 py-3 text-[11px] font-medium text-[#7a807a] last:text-right">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {active.rows.map((row) => (
                    <tr key={row[0]} className="border-b border-[#edf0ed] last:border-0">
                      {row.map((cell, index) => (
                        <td key={`${row[0]}-${cell}`} className={`px-3 py-3.5 text-xs ${index === 0 ? 'font-medium text-[#252825]' : 'text-[#686e68]'} ${index === row.length - 1 ? 'text-right font-medium text-[#303530]' : ''}`}>
                          {index === 2 ? <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#52a668]" />{cell}</span> : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
