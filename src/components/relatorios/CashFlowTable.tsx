"use client"

import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Node = { id: string; name: string; valuesByPeriod?: Record<string, number>; children?: Node[] }

const PERIODS_DEFAULT = [
  { key: '2025-01', label: 'Janeiro' },
  { key: '2025-02', label: 'Fevereiro' },
  { key: '2025-03', label: 'Março' },
]

const DATA: Node[] = [
  {
    id: 'operacional', name: 'Atividades Operacionais', children: [
      { id: 'receb-clientes', name: 'Recebimentos de clientes', valuesByPeriod: { '2025-01': 68_000, '2025-02': 70_000, '2025-03': 66_000 } },
      { id: 'pag-fornec', name: 'Pagamentos a fornecedores', valuesByPeriod: { '2025-01': -42_000, '2025-02': -43_000, '2025-03': -41_000 } },
      { id: 'salarios', name: 'Pagamentos de salários', valuesByPeriod: { '2025-01': -18_000, '2025-02': -18_000, '2025-03': -17_500 } },
      { id: 'impostos', name: 'Pagamento de impostos', valuesByPeriod: { '2025-01': -5_000, '2025-02': -5_200, '2025-03': -4_800 } },
    ]
  },
  {
    id: 'investimento', name: 'Atividades de Investimento', children: [
      { id: 'capex', name: 'Aquisição de imobilizado', valuesByPeriod: { '2025-01': -2_500, '2025-02': -1_000, '2025-03': -3_000 } },
      { id: 'intangible', name: 'Aquisição de intangível', valuesByPeriod: { '2025-01': -500, '2025-02': -600, '2025-03': -400 } },
    ]
  },
  {
    id: 'financiamento', name: 'Atividades de Financiamento', children: [
      { id: 'novos-emprestimos', name: 'Obtenção de empréstimos', valuesByPeriod: { '2025-01': 10_000, '2025-02': 0, '2025-03': 0 } },
      { id: 'amortizacoes', name: 'Amortizações', valuesByPeriod: { '2025-01': -2_000, '2025-02': -2_000, '2025-03': -2_000 } },
      { id: 'juros', name: 'Pagamento de juros', valuesByPeriod: { '2025-01': -800, '2025-02': -800, '2025-03': -900 } },
      { id: 'dividendos', name: 'Dividendos pagos', valuesByPeriod: { '2025-01': 0, '2025-02': 0, '2025-03': -1_500 } },
    ]
  },
]

function currency(n: number) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function valueFor(n: Node, k: string): number { return n.children?.length ? n.children.reduce((a, c) => a + valueFor(c, k), 0) : Number(n.valuesByPeriod?.[k] ?? 0) }
function total(n: Node, keys: string[]): number { return keys.reduce((a, k) => a + valueFor(n, k), 0) }

interface Props { periods?: { key: string; label: string }[] }

export default function CashFlowTable({ periods = PERIODS_DEFAULT }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const rows = useMemo(() => flatten(DATA, expanded), [expanded])
  function flatten(nodes: Node[], open: Set<string>, depth = 0): Array<{ node: Node; depth: number }> {
    const out: Array<{ node: Node; depth: number }> = []
    for (const n of nodes) {
      out.push({ node: n, depth })
      const isOpen = open.has(n.id)
      if (n.children && n.children.length && isOpen) out.push(...flatten(n.children, open, depth + 1))
    }
    return out
  }

  const chave = periods.map(p => p.key)

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Conta</TableHead>
            {periods.map(p => <TableHead key={p.key} className="text-right">{p.label}</TableHead>)}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ node, depth }) => {
            const has = Boolean(node.children?.length)
            const indent = depth * 20
            const tot = total(node, chave)
            const neg = tot < 0
            return (
              <TableRow key={node.id} className={has ? 'bg-gray-50' : ''}>
                <TableCell>
                  <div className="flex items-center" style={{ paddingLeft: indent }}>
                    {has ? (
                      <button type="button" onClick={() => toggle(node.id)} className="mr-2 text-gray-600 hover:text-gray-900">
                        {expanded.has(node.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    ) : <span className="mr-6" />}
                    <span className={has ? 'font-medium' : ''}>{node.name}</span>
                  </div>
                </TableCell>
                {periods.map(p => {
                  const v = valueFor(node, p.key)
                  return <TableCell key={p.key} className="text-right" style={{ color: v < 0 ? '#dc2626' : undefined }}>{currency(v)}</TableCell>
                })}
                <TableCell className="text-right" style={{ color: neg ? '#dc2626' : undefined }}>{currency(tot)}</TableCell>
              </TableRow>
            )
          })}
          {/* Variação líquida de caixa por período */}
          <TableRow>
            <TableCell className="font-semibold text-gray-900">Variação Líquida de Caixa</TableCell>
            {periods.map(p => {
              const delta = DATA.reduce((acc, n) => acc + valueFor(n, p.key), 0)
              return <TableCell key={p.key} className="text-right font-semibold text-gray-900">{currency(delta)}</TableCell>
            })}
            <TableCell className="text-right font-semibold text-gray-900">{currency(DATA.reduce((t, n) => t + total(n, chave), 0))}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

