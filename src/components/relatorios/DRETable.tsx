"use client"

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore } from '@nanostores/react'
import { $reportsCommands } from '@/stores/reportsUiStore'
import { $tabs } from '@/stores/modulos/financeiroUiStore'

export type DRENode = {
  id: string
  name: string
  value?: number // legacy single total value
  valuesByPeriod?: Record<string, number> // per-period values
  children?: DRENode[]
}

function formatCurrencyBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatCurrencyPretty(n: number): string {
  if (n < 0) return `(${formatCurrencyBRL(Math.abs(n))})`
  return formatCurrencyBRL(n)
}

function computeNodeValue(node: DRENode, periods?: string[]): number {
  // If periods provided, compute total across periods
  if (periods && periods.length > 0) {
    return periods.reduce((acc, p) => acc + computeNodeValueForPeriod(node, p), 0)
  }
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + computeNodeValue(child, periods), 0)
  }
  if (node.valuesByPeriod) {
    return Object.values(node.valuesByPeriod).reduce((a, b) => a + (Number(b) || 0), 0)
  }
  return Number(node.value || 0)
}

function computeNodeValueForPeriod(node: DRENode, periodKey: string): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + computeNodeValueForPeriod(child, periodKey), 0)
  }
  if (node.valuesByPeriod && periodKey in node.valuesByPeriod) {
    return Number(node.valuesByPeriod[periodKey] || 0)
  }
  return Number(node.value || 0)
}

function flatten(nodes: DRENode[], expanded: Set<string>, depth = 0, ancestorsExpanded = true): Array<{ node: DRENode; depth: number }> {
  const rows: Array<{ node: DRENode; depth: number }> = []
  for (const node of nodes) {
    // The node is visible if its ancestors are expanded (or it's root)
    if (!ancestorsExpanded) continue
    rows.push({ node, depth })
    const isOpen = expanded.has(node.id)
    if (node.children && node.children.length > 0 && isOpen) {
      rows.push(...flatten(node.children, expanded, depth + 1, isOpen))
    }
  }
  return rows
}

const DEFAULT_DATA: DRENode[] = [
  {
    id: 'receita',
    name: 'Receita',
    children: [
      { id: 'receita-produtos', name: 'Receita de Produtos', valuesByPeriod: { '2025-01': 60_000, '2025-02': 62_000, '2025-03': 58_000 } },
      { id: 'receita-servicos', name: 'Receita de Serviços', valuesByPeriod: { '2025-01': 15_000, '2025-02': 16_000, '2025-03': 14_000 } },
      { id: 'devolucoes-descontos', name: '(-) Devoluções e Descontos', valuesByPeriod: { '2025-01': -1_700, '2025-02': -1_600, '2025-03': -1_700 } },
    ],
  },
  {
    id: 'cogs',
    name: 'Custo dos Produtos Vendidos (CPV/COGS)',
    children: [
      { id: 'materia-prima', name: 'Matéria-prima', valuesByPeriod: { '2025-01': -20_000, '2025-02': -21_000, '2025-03': -19_000 } },
      { id: 'frete-insumos', name: 'Frete e Insumos', valuesByPeriod: { '2025-01': -2_800, '2025-02': -2_900, '2025-03': -2_800 } },
      { id: 'mao-de-obra', name: 'Mão de obra direta', valuesByPeriod: { '2025-01': -7_500, '2025-02': -7_500, '2025-03': -7_500 } },
    ],
  },
  {
    id: 'opex',
    name: 'Despesas Operacionais (Operating Expenses)',
    children: [
      {
        id: 'vendas-marketing',
        name: 'Vendas e Marketing',
        children: [
          { id: 'midia-paga', name: 'Mídia Paga', valuesByPeriod: { '2025-01': -4_000, '2025-02': -4_200, '2025-03': -3_800 } },
          { id: 'comissoes', name: 'Comissões', valuesByPeriod: { '2025-01': -2_100, '2025-02': -2_200, '2025-03': -2_200 } },
          { id: 'eventos', name: 'Eventos', valuesByPeriod: { '2025-01': -600, '2025-02': -700, '2025-03': -700 } },
        ],
      },
      {
        id: 'geral-adm',
        name: 'Geral e Administrativo',
        children: [
          { id: 'salarios', name: 'Salários e Encargos', valuesByPeriod: { '2025-01': -9_400, '2025-02': -9_400, '2025-03': -9_200 } },
          {
            id: 'escritorio',
            name: 'Custos de Escritório',
            children: [
              { id: 'aluguel', name: 'Aluguel', valuesByPeriod: { '2025-01': -400, '2025-02': -400, '2025-03': -400 } },
              { id: 'conta-luz', name: 'Conta de Luz', valuesByPeriod: { '2025-01': -250, '2025-02': -250, '2025-03': -260 } },
              { id: 'internet', name: 'Internet', valuesByPeriod: { '2025-01': -150, '2025-02': -150, '2025-03': -150 } },
              { id: 'materiais', name: 'Materiais de Escritório', valuesByPeriod: { '2025-01': -200, '2025-02': -200, '2025-03': -190 } },
            ],
          },
          { id: 'servicos-terceiros', name: 'Serviços de Terceiros', valuesByPeriod: { '2025-01': -1_400, '2025-02': -1_400, '2025-03': -1_400 } },
        ],
      },
      { id: 'pesquisa-desenvolvimento', name: 'Pesquisa e Desenvolvimento (P&D)', valuesByPeriod: { '2025-01': -2_500, '2025-02': -2_500, '2025-03': -2_500 } },
    ],
  },
  {
    id: 'resultado-financeiro',
    name: 'Resultado Financeiro',
    children: [
      { id: 'desp-fin', name: 'Despesas Financeiras', valuesByPeriod: { '2025-01': -1_100, '2025-02': -1_100, '2025-03': -1_200 } },
      { id: 'rec-fin', name: 'Receitas Financeiras', valuesByPeriod: { '2025-01': 400, '2025-02': 400, '2025-03': 400 } },
    ],
  },
]

interface DRETableProps {
  data?: DRENode[]
  periods?: { key: string; label: string }[]
  namesOnly?: boolean
}

export default function DRETable({ data = DEFAULT_DATA, periods = [
  { key: '2025-01', label: 'Janeiro' },
  { key: '2025-02', label: 'Fevereiro' },
  { key: '2025-03', label: 'Março' },
], namesOnly = false }: DRETableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>())
  const commands = useStore($reportsCommands)
  const tabs = useStore($tabs)

  const rows = useMemo(() => flatten(data, expanded), [data, expanded])

  const totalRevenueByPeriod = useMemo(() => {
    const receita = data.find((n) => n.id === 'receita')
    const map: Record<string, number> = {}
    for (const p of periods) {
      map[p.key] = receita ? computeNodeValueForPeriod(receita, p.key) : 0
    }
    return map
  }, [data, periods])

  const profitByPeriod = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of periods) {
      const receita = computeNodeValueForPeriod(data.find(n => n.id === 'receita') || { id: '', name: '' }, p.key)
      const cogs = computeNodeValueForPeriod(data.find(n => n.id === 'cogs') || { id: '', name: '' }, p.key)
      const opex = computeNodeValueForPeriod(data.find(n => n.id === 'opex') || { id: '', name: '' }, p.key)
      const outros = data.filter(n => !['receita', 'cogs', 'opex'].includes(n.id))
        .reduce((acc, n) => acc + computeNodeValueForPeriod(n, p.key), 0)
      map[p.key] = receita - cogs - opex + outros
    }
    return map
  }, [data, periods])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isExpandable = (node: DRENode) => Boolean(node.children && node.children.length > 0)

  const collectExpandableIds = (nodes: DRENode[], out: Set<string>) => {
    for (const n of nodes) {
      if (n.children && n.children.length) {
        out.add(n.id)
        collectExpandableIds(n.children, out)
      }
    }
  }

  useEffect(() => {
    if (tabs.selected !== 'dre') return
    // Expand all when command triggered
    const set = new Set<string>()
    collectExpandableIds(data, set)
    setExpanded(set)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commands.expandAllCounter, tabs.selected, data])

  // Export CSV when requested and DRE is active
  useEffect(() => {
    if (tabs.selected !== 'dre') return
    if (namesOnly) return
    const header = ['Conta', ...periods.map(p => p.label), 'Total']
    const allRows = flattenAll(data)
    const csvLines: string[] = []
    csvLines.push(header.join(','))
    for (const { node, depth } of allRows) {
      const name = `${' '.repeat(depth * 2)}${node.name}`.replaceAll(',', ' ')
      const vals = periods.map(p => computeNodeValueForPeriod(node, p.key))
      const tot = computeNodeValue(node, periods.map(p => p.key))
      csvLines.push([name, ...vals.map(v => String(v)), String(tot)].join(','))
    }
    // Footer totals
    const receitaTotals = periods.map(p => totalRevenueByPeriod[p.key] || 0)
    csvLines.push(['Receita Total', ...receitaTotals.map(String), String(receitaTotals.reduce((a, b) => a + b, 0))].join(','))
    const profitTotals = periods.map(p => profitByPeriod[p.key] || 0)
    csvLines.push(['Lucro/Prejuízo', ...profitTotals.map(String), String(profitTotals.reduce((a, b) => a + b, 0))].join(','))
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dre.csv'
    a.click()
    URL.revokeObjectURL(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commands.exportCounter, tabs.selected])

  function flattenAll(nodes: DRENode[]): Array<{ node: DRENode; depth: number }> {
    const out: Array<{ node: DRENode; depth: number }> = []
    const walk = (arr: DRENode[], depth = 0) => {
      for (const n of arr) {
        out.push({ node: n, depth })
        if (n.children && n.children.length) walk(n.children, depth + 1)
      }
    }
    walk(nodes, 0)
    return out
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-2/5 text-xs font-semibold uppercase tracking-wide text-gray-600">Conta</TableHead>
            {!namesOnly && periods.map((p) => (
              <TableHead key={p.key} className="text-right text-xs font-semibold uppercase tracking-wide text-gray-600">{p.label}</TableHead>
            ))}
            {!namesOnly && (
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Total</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ node, depth }, idx) => {
            const hasChildren = isExpandable(node)
            const total = namesOnly ? 0 : computeNodeValue(node, periods.map(p => p.key))
            const isSection = hasChildren
            const indent = depth * 20
            const isNegative = total < 0
            const isTopLevel = depth === 0 && isSection
            const rowBg = '#FFFFFF'
            return (
              <TableRow key={node.id} style={{ backgroundColor: rowBg }}>
                <TableCell className={isTopLevel ? 'text-gray-800 font-semibold uppercase tracking-wide text-[12px]' : 'text-gray-800'}>
                  <div className="flex items-center" style={{ paddingLeft: indent }}>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(node.id)}
                        className="mr-2 text-gray-600 hover:text-gray-900"
                        aria-label={expanded.has(node.id) ? 'Recolher' : 'Expandir'}
                      >
                        {expanded.has(node.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    ) : (
                      <span className="mr-6" />
                    )}
                    <span className={isTopLevel ? 'font-semibold' : isSection ? 'font-medium' : ''}>{node.name}</span>
                  </div>
                </TableCell>
                {!namesOnly && periods.map((p) => {
                  const v = computeNodeValueForPeriod(node, p.key)
                  const neg = v < 0
                  return (
                    <TableCell key={p.key} className="text-right text-[13px] text-gray-800">
                      <span className={isTopLevel ? 'font-semibold' : isSection ? 'font-medium' : ''} style={{ color: neg ? '#b91c1c' : '#111827' }}>
                        {formatCurrencyPretty(v)}
                      </span>
                    </TableCell>
                  )
                })}
                {!namesOnly && (
                  <TableCell className="text-right text-[13px] text-gray-800">
                    <span className={isTopLevel ? 'font-semibold' : isSection ? 'font-medium' : ''} style={{ color: isNegative ? '#b91c1c' : '#111827' }}>
                      {formatCurrencyPretty(total)}
                    </span>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
          {!namesOnly && (
            <>
              {/* Totais por período: Receita Total */}
              <TableRow className="border-t">
                <TableCell className="font-semibold text-gray-900">Receita Total</TableCell>
                {periods.map((p) => (
                  <TableCell key={p.key} className="text-right font-semibold text-gray-900">{formatCurrencyPretty(totalRevenueByPeriod[p.key] || 0)}</TableCell>
                ))}
                <TableCell className="text-right font-semibold text-gray-900">
                  {formatCurrencyPretty(Object.values(totalRevenueByPeriod).reduce((a, b) => a + b, 0))}
                </TableCell>
              </TableRow>
              {/* Lucro/Prejuízo: Receita - Despesas (somatório de todos os grupos) */}
              <TableRow className="border-t">
                <TableCell className="font-semibold text-gray-900">Lucro/Prejuízo</TableCell>
                {periods.map((p) => {
                  const v = profitByPeriod[p.key] || 0
                  const neg = v < 0
                  return (
                    <TableCell key={p.key} className="text-right font-semibold" style={{ color: neg ? '#b91c1c' : '#111827' }}>
                      {formatCurrencyPretty(v)}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right font-semibold" style={{ color: (Object.values(profitByPeriod).reduce((a, b) => a + b, 0) < 0) ? '#b91c1c' : '#111827' }}>
                  {formatCurrencyPretty(Object.values(profitByPeriod).reduce((a, b) => a + b, 0))}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
