'use client'

import { useState, useSyncExternalStore } from 'react'

const subscribeToNothing = () => () => {}

import { ProfessionalReportPage } from './ProfessionalReportPage'

// Relatórios que eram vários itens no menu e viraram uma tela com escolha: contas em atraso (a receber / a pagar),
// vendas (por cliente, vendedor ou item) e compras (por fornecedor ou categoria). Os dados são os mesmos de antes.
const variants = {
  'contas-em-atraso': { param: 'lado', label: 'Ver', options: [
    { value: 'receber', label: 'A receber (clientes)', report: 'aging-receber' },
    { value: 'pagar', label: 'A pagar (fornecedores)', report: 'aging-pagar' },
  ] },
  vendas: { param: 'agrupar', label: 'Agrupar por', options: [
    { value: 'cliente', label: 'Cliente', report: 'vendas-clientes' },
    { value: 'vendedor', label: 'Vendedor', report: 'vendas-vendedores' },
    { value: 'item', label: 'Produto ou serviço', report: 'vendas-produtos' },
  ] },
  margem: { param: 'agrupar', label: 'Agrupar por', options: [
    { value: 'venda', label: 'Venda', report: 'margem-vendas' },
    { value: 'item', label: 'Produto ou serviço', report: 'margem-itens' },
    { value: 'cliente', label: 'Cliente', report: 'margem-clientes' },
  ] },
  compras: { param: 'agrupar', label: 'Agrupar por', options: [
    { value: 'fornecedor', label: 'Fornecedor', report: 'compras-fornecedores' },
    { value: 'categoria', label: 'Categoria', report: 'compras-categorias' },
  ] },
} as const

export type GroupedReportId = keyof typeof variants
export function isGroupedReport(value?: string): value is GroupedReportId { return Boolean(value && value in variants) }

export function GroupedReportPage({ id }: { id: GroupedReportId }) {
  const variant = variants[id]
  const [picked, setSelected] = useState<string | null>(null)
  // Endereços antigos chegam com ?lado= ou ?agrupar=; o valor da URL vale até a pessoa escolher outra aba.
  const fromUrl = useSyncExternalStore(subscribeToNothing, () => new URLSearchParams(window.location.search).get(variant.param), () => null)
  const selected = picked ?? (fromUrl && variant.options.some(option => option.value === fromUrl) ? fromUrl : variant.options[0].value)
  const option = variant.options.find(item => item.value === selected) || variant.options[0]
  return <div className="flex min-h-full flex-col gap-4">
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <span className="text-sm text-gray-600">{variant.label}</span>
      <div className="flex rounded-md border border-[#dfdfdc] p-0.5" role="tablist" aria-label={variant.label}>
        {variant.options.map(item => <button key={item.value} role="tab" aria-selected={item.value === option.value}
          className={`rounded px-3 py-1.5 text-sm ${item.value === option.value ? 'bg-[#111] text-white' : 'text-gray-600'}`}
          onClick={() => setSelected(item.value)}>{item.label}</button>)}
      </div>
    </div>
    <ProfessionalReportPage key={option.report} reportId={option.report} />
  </div>
}
