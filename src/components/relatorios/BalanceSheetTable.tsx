"use client"

import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Node = {
  id: string
  name: string
  valuesByPeriod?: Record<string, number>
  children?: Node[]
}

function currency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function valueFor(node: Node, key: string): number {
  if (node.children && node.children.length) return node.children.reduce((a, c) => a + valueFor(c, key), 0)
  return Number(node.valuesByPeriod?.[key] ?? 0)
}

function total(node: Node, keys: string[]): number {
  return keys.reduce((acc, k) => acc + valueFor(node, k), 0)
}

const DATA: Node[] = [
  {
    id: 'ativo',
    name: 'Ativo',
    children: [
      {
        id: 'ativo-circ', name: 'Ativo Circulante', children: [
          { id: 'caixa', name: 'Caixa e Equivalentes', valuesByPeriod: { '2025-01': 120_000, '2025-02': 118_000, '2025-03': 125_000 } },
          { id: 'clientes', name: 'Clientes', valuesByPeriod: { '2025-01': 80_000, '2025-02': 82_000, '2025-03': 79_000 } },
          { id: 'estoques', name: 'Estoques', valuesByPeriod: { '2025-01': 55_000, '2025-02': 57_000, '2025-03': 56_000 } },
        ]
      },
      {
        id: 'ativo-nc', name: 'Ativo Não Circulante', children: [
          { id: 'imobilizado', name: 'Imobilizado', valuesByPeriod: { '2025-01': 150_000, '2025-02': 149_500, '2025-03': 149_000 } },
          { id: 'intangivel', name: 'Intangível', valuesByPeriod: { '2025-01': 30_000, '2025-02': 31_000, '2025-03': 31_000 } },
        ]
      }
    ]
  },
  {
    id: 'passivo',
    name: 'Passivo',
    children: [
      {
        id: 'passivo-circ', name: 'Passivo Circulante', children: [
          { id: 'fornecedores', name: 'Fornecedores', valuesByPeriod: { '2025-01': 70_000, '2025-02': 72_000, '2025-03': 73_000 } },
          { id: 'obr-trab', name: 'Obrigações Trabalhistas', valuesByPeriod: { '2025-01': 22_000, '2025-02': 21_000, '2025-03': 23_000 } },
        ]
      },
      {
        id: 'passivo-nc', name: 'Passivo Não Circulante', children: [
          { id: 'emprestimos', name: 'Empréstimos e Financiamentos', valuesByPeriod: { '2025-01': 95_000, '2025-02': 94_000, '2025-03': 93_000 } },
        ]
      }
    ]
  },
  {
    id: 'pl',
    name: 'Patrimônio Líquido',
    children: [
      { id: 'capital', name: 'Capital Social', valuesByPeriod: { '2025-01': 180_000, '2025-02': 180_000, '2025-03': 180_000 } },
      { id: 'reservas', name: 'Reservas', valuesByPeriod: { '2025-01': 35_000, '2025-02': 35_000, '2025-03': 35_000 } },
      { id: 'lucros', name: 'Lucros Acumulados', valuesByPeriod: { '2025-01': 75_000, '2025-02': 79_500, '2025-03': 82_000 } },
    ]
  }
]

interface Props { periods?: { key: string; label: string }[] }

export default function BalanceSheetTable({ periods = [
  { key: '2025-01', label: 'Janeiro' },
  { key: '2025-02', label: 'Fevereiro' },
  { key: '2025-03', label: 'Março' },
] }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const rows = useMemo(() => flatten(DATA, expanded), [expanded])

  function flatten(nodes: Node[], open: Set<string>, depth = 0, visible = true): Array<{ node: Node; depth: number }> {
    const out: Array<{ node: Node; depth: number }> = []
    for (const n of nodes) {
      if (!visible) continue
      out.push({ node: n, depth })
      const isOpen = open.has(n.id)
      if (n.children && n.children.length && isOpen) out.push(...flatten(n.children, open, depth + 1, true))
    }
    return out
  }

  const ativo = DATA.find(n => n.id === 'ativo')!
  const passivo = DATA.find(n => n.id === 'passivo')!
  const pl = DATA.find(n => n.id === 'pl')!

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
            const has = Boolean(node.children && node.children.length)
            const indent = depth * 20
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
                {periods.map(p => (
                  <TableCell key={p.key} className="text-right">{currency(valueFor(node, p.key))}</TableCell>
                ))}
                <TableCell className="text-right">{currency(total(node, periods.map(p => p.key)))}</TableCell>
              </TableRow>
            )
          })}
          {/* Totais de validação: Ativo vs Passivo+PL */}
          <TableRow>
            <TableCell className="font-semibold text-gray-900">Total Ativo</TableCell>
            {periods.map(p => <TableCell key={p.key} className="text-right font-semibold text-gray-900">{currency(valueFor(ativo, p.key))}</TableCell>)}
            <TableCell className="text-right font-semibold text-gray-900">{currency(total(ativo, periods.map(p => p.key)))}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-gray-900">Total Passivo + PL</TableCell>
            {periods.map(p => <TableCell key={p.key} className="text-right font-semibold text-gray-900">{currency(valueFor(passivo, p.key) + valueFor(pl, p.key))}</TableCell>)}
            <TableCell className="text-right font-semibold text-gray-900">{currency(total(passivo, periods.map(p => p.key)) + total(pl, periods.map(p => p.key)))}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

