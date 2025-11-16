"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState, Fragment } from 'react'

type SummaryRow = {
  nivel: number
  nome: string
  detalhe1_nome: string | null
  detalhe2_nome: string | null
  detalhe3_nome: string | null
  detalhe4_nome: string | null
  valor: number
}

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: unknown[]
  topProdutos: unknown[]
  meta?: {
    measure?: 'faturamento' | 'quantidade' | 'pedidos' | 'itens'
  }
}

interface Props {
  success: boolean
  message: string
  data?: AnalisTerritorioData
}

export default function PivotTableContent({ success, message, data }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  type Node = { total: number; children: Map<string, Node> }
  const { level1Values, tree } = useMemo(() => {
    const level1Values: string[] = []
    const tree = new Map<string, Node>()
    const rows = data?.summary || []

    for (const row of rows) {
      const keys = [row.nome, row.detalhe1_nome, row.detalhe2_nome, row.detalhe3_nome, row.detalhe4_nome]
        .map(v => String(v ?? '—'))
      if (!level1Values.includes(keys[0])) level1Values.push(keys[0])

      let currentMap = tree
      for (let i = 0; i < row.nivel; i++) {
        const key = keys[i]
        if (!currentMap.has(key)) {
          currentMap.set(key, { total: 0, children: new Map() })
        }
        const node = currentMap.get(key)!
        if (i === row.nivel - 1) {
          node.total = Number(row.valor || 0)
        }
        currentMap = node.children
      }
    }

    return { level1Values, tree }
  }, [data])

  const measure = data?.meta?.measure || 'faturamento'

  const toggle = (nome: string) => {
    const next = new Set(expanded)
    if (next.has(nome)) next.delete(nome)
    else next.add(nome)
    setExpanded(next)
  }

  if (!success || !data) {
    return <div className="p-4 text-sm text-red-600">{message}</div>
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[75%]">Dimensão</TableHead>
            <TableHead className="text-right w-[25%]">{measure === 'faturamento' ? 'Faturamento' : 'Valor'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {level1Values.map((dim1) => {
            const info = tree.get(dim1)
            if (!info) return null
            const isOpen = expanded.has(dim1)
            return (
              <Fragment key={`group-${dim1}`}>
                <TableRow className="bg-white">
                  <TableCell className="align-middle">
                    <button
                      type="button"
                      onClick={() => toggle(dim1)}
                      className="inline-flex items-center gap-2 hover:opacity-80"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-semibold">{dim1}</span>
                    </button>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${measure === 'faturamento' ? 'text-green-600' : 'text-slate-700'}`}>
                    {measure === 'faturamento'
                      ? Number(info.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : Number(info.total || 0).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
                {isOpen && (
                  Array.from(info.children.entries())
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([dim2Key, dim2Node]) => {
                      const keyL2 = `${dim1}||${dim2Key}`
                      const openL2 = expanded.has(keyL2)
                      const hasChildrenL3 = dim2Node.children.size > 0
                      return (
                        <Fragment key={`l2-${keyL2}`}>
                          <TableRow className="bg-gray-50/60">
                            <TableCell style={{ paddingLeft: '2rem' }}>
                              {hasChildrenL3 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = new Set(expanded)
                                    if (next.has(keyL2)) next.delete(keyL2); else next.add(keyL2)
                                    setExpanded(next)
                                  }}
                                  className="inline-flex items-center gap-2 hover:opacity-80"
                                >
                                  {openL2 ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span>{dim2Key}</span>
                                </button>
                              ) : (
                                <span className="pl-6 inline-block">{dim2Key}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {measure === 'faturamento'
                                ? Number(dim2Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : Number(dim2Node.total || 0).toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                          {openL2 && (
                            Array.from(dim2Node.children.entries())
                              .sort((a,b)=> b[1].total-a[1].total)
                              .map(([dim3Key, dim3Node]) => {
                                const keyL3 = `${keyL2}||${dim3Key}`
                                const openL3 = expanded.has(keyL3)
                                const hasChildrenL4 = dim3Node.children.size > 0
                                return (
                                  <Fragment key={`l3-${keyL3}`}>
                                    <TableRow className="bg-gray-50/80">
                                      <TableCell style={{ paddingLeft: '3rem' }}>
                                        {hasChildrenL4 ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = new Set(expanded)
                                              if (next.has(keyL3)) next.delete(keyL3); else next.add(keyL3)
                                              setExpanded(next)
                                            }}
                                            className="inline-flex items-center gap-2 hover:opacity-80"
                                          >
                                            {openL3 ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                            <span>{dim3Key}</span>
                                          </button>
                                        ) : (
                                          <span className="pl-6 inline-block">{dim3Key}</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {measure === 'faturamento'
                                          ? Number(dim3Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                          : Number(dim3Node.total || 0).toLocaleString('pt-BR')}
                                      </TableCell>
                                    </TableRow>
                                    {openL3 && (
                                      Array.from(dim3Node.children.entries())
                                        .sort((a,b)=> b[1].total-a[1].total)
                                        .map(([dim4Key, dim4Node]) => {
                                          const keyL4 = `${keyL3}||${dim4Key}`
                                          const openL4 = expanded.has(keyL4)
                                          const hasChildrenL5 = dim4Node.children.size > 0
                                          return (
                                            <Fragment key={`l4-${keyL4}`}>
                                              <TableRow className="bg-gray-50">
                                                <TableCell style={{ paddingLeft: '4rem' }}>
                                                  {hasChildrenL5 ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const next = new Set(expanded)
                                                        if (next.has(keyL4)) next.delete(keyL4); else next.add(keyL4)
                                                        setExpanded(next)
                                                      }}
                                                      className="inline-flex items-center gap-2 hover:opacity-80"
                                                    >
                                                      {openL4 ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                      ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                      )}
                                                      <span>{dim4Key}</span>
                                                    </button>
                                                  ) : (
                                                    <span className="pl-6 inline-block">{dim4Key}</span>
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {measure === 'faturamento'
                                                    ? Number(dim4Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    : Number(dim4Node.total || 0).toLocaleString('pt-BR')}
                                                </TableCell>
                                              </TableRow>
                                              {openL4 && (
                                                Array.from(dim4Node.children.entries())
                                                  .sort((a,b)=> b[1].total-a[1].total)
                                                  .map(([dim5Key, dim5Node]) => (
                                                    <TableRow key={`l5-${keyL4}||${dim5Key}`} className="bg-gray-50">
                                                      <TableCell style={{ paddingLeft: '5rem' }}>{dim5Key}</TableCell>
                                                      <TableCell className="text-right">
                                                        {measure === 'faturamento'
                                                          ? Number(dim5Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                          : Number(dim5Node.total || 0).toLocaleString('pt-BR')}
                                                      </TableCell>
                                                    </TableRow>
                                                  ))
                                              )}
                                            </Fragment>
                                          )
                                        })
                                    )}
                                  </Fragment>
                                )
                              })
                          )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
      {level1Values.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">Nenhum dado encontrado.</div>
      )}
    </div>
  )
}
