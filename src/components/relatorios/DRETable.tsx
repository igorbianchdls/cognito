"use client"

import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type DRENode = {
  id: string
  name: string
  value?: number
  children?: DRENode[]
}

function formatCurrencyBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function computeNodeValue(node: DRENode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + computeNodeValue(child), 0)
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
      { id: 'receita-produtos', name: 'Receita de Produtos', value: 180_000 },
      { id: 'receita-servicos', name: 'Receita de Serviços', value: 45_000 },
      { id: 'devolucoes-descontos', name: '(-) Devoluções e Descontos', value: -5_000 },
    ],
  },
  {
    id: 'cogs',
    name: 'Custo dos Produtos Vendidos (CPV/COGS)',
    children: [
      { id: 'materia-prima', name: 'Matéria-prima', value: -60_000 },
      { id: 'frete-insumos', name: 'Frete e Insumos', value: -8_500 },
      { id: 'mao-de-obra', name: 'Mão de obra direta', value: -22_500 },
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
          { id: 'midia-paga', name: 'Mídia Paga', value: -12_000 },
          { id: 'comissoes', name: 'Comissões', value: -6_500 },
          { id: 'eventos', name: 'Eventos', value: -2_000 },
        ],
      },
      {
        id: 'geral-adm',
        name: 'Geral e Administrativo',
        children: [
          { id: 'salarios', name: 'Salários e Encargos', value: -28_000 },
          { id: 'escritorio', name: 'Custos de Escritório', value: -3_000 },
          { id: 'servicos-terceiros', name: 'Serviços de Terceiros', value: -4_200 },
        ],
      },
      { id: 'pesquisa-desenvolvimento', name: 'Pesquisa e Desenvolvimento (P&D)', value: -7_500 },
    ],
  },
  {
    id: 'resultado-financeiro',
    name: 'Resultado Financeiro',
    children: [
      { id: 'desp-fin', name: 'Despesas Financeiras', value: -3_400 },
      { id: 'rec-fin', name: 'Receitas Financeiras', value: 1_200 },
    ],
  },
]

interface DRETableProps {
  data?: DRENode[]
}

export default function DRETable({ data = DEFAULT_DATA }: DRETableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>())

  const rows = useMemo(() => flatten(data, expanded), [data, expanded])

  const totalRevenue = useMemo(() => {
    const receita = data.find((n) => n.id === 'receita')
    return receita ? computeNodeValue(receita) : 0
  }, [data])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isExpandable = (node: DRENode) => Boolean(node.children && node.children.length > 0)

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-3/5">Conta</TableHead>
            <TableHead className="w-2/5 text-right">Valor (R$)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ node, depth }) => {
            const hasChildren = isExpandable(node)
            const value = computeNodeValue(node)
            const isSection = hasChildren
            const indent = depth * 20
            const isNegative = value < 0
            return (
              <TableRow key={node.id} className={isSection ? 'bg-gray-50' : ''}>
                <TableCell className="text-gray-800">
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
                    <span className={isSection ? 'font-medium' : ''}>{node.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={isSection ? 'font-medium' : ''} style={{ color: isNegative ? '#dc2626' : undefined }}>
                    {formatCurrencyBRL(value)}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
          {/* Total (opcional): Receita total em destaque */}
          <TableRow>
            <TableCell className="font-semibold text-gray-900">Receita Total</TableCell>
            <TableCell className="text-right font-semibold text-gray-900">{formatCurrencyBRL(totalRevenue)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

