'use client'

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactContent,
} from '@/components/ai-elements/artifact'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { useMemo, useState, Fragment } from 'react'

type SummaryRow = {
  nivel: number
  nome: string
  detalhe_nome: string | null
  faturamento_total: number
}

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: unknown[]
  topProdutos: unknown[]
}

interface Props {
  success: boolean
  message: string
  data?: AnalisTerritorioData
}

export default function PivotTable({ success, message, data }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { territorios, mapa } = useMemo(() => {
    const territorios: string[] = []
    const mapa = new Map<string, { total: number; vendedores: SummaryRow[] }>()
    const rows = data?.summary || []

    for (const row of rows) {
      if (row.nivel === 1) {
        if (!territorios.includes(row.nome)) territorios.push(row.nome)
        if (!mapa.has(row.nome)) mapa.set(row.nome, { total: 0, vendedores: [] })
        const agg = mapa.get(row.nome)!
        agg.total = Number(row.faturamento_total || 0)
      } else if (row.nivel === 2) {
        if (!mapa.has(row.nome)) mapa.set(row.nome, { total: 0, vendedores: [] })
        mapa.get(row.nome)!.vendedores.push(row)
      }
    }

    return { territorios, mapa }
  }, [data])

  const toggle = (nome: string) => {
    const next = new Set(expanded)
    if (next.has(nome)) next.delete(nome)
    else next.add(nome)
    setExpanded(next)
  }

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-600" />
          <ArtifactTitle>Análise de Territórios</ArtifactTitle>
        </div>
        <ArtifactDescription className="ml-auto text-right">
          {success ? message : 'Erro ao consultar dados'}
        </ArtifactDescription>
      </ArtifactHeader>

      <ArtifactContent className="p-0">
        {!success || !data ? (
          <div className="p-4 text-sm text-red-600">{message}</div>
        ) : (
          <div className="w-full">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[75%]">Dimensão</TableHead>
                  <TableHead className="text-right w-[25%]">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {territorios.map((t) => {
                  const info = mapa.get(t)
                  if (!info) return null
                  const isOpen = expanded.has(t)
                  return (
                    <Fragment key={`group-${t}`}>
                      <TableRow className="bg-white">
                        <TableCell className="align-middle">
                          <button
                            type="button"
                            onClick={() => toggle(t)}
                            className="inline-flex items-center gap-2 hover:opacity-80"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-semibold">{t}</span>
                          </button>
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {Number(info.total || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </TableCell>
                      </TableRow>
                      {isOpen && info.vendedores.map((v, idx) => (
                        <TableRow key={`vend-${t}-${idx}`} className="bg-gray-50/60">
                          <TableCell className="pl-10">{v.detalhe_nome || '—'}</TableCell>
                          <TableCell className="text-right">
                            {Number(v.faturamento_total || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
            {territorios.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Nenhum dado encontrado.</div>
            )}
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  )
}
