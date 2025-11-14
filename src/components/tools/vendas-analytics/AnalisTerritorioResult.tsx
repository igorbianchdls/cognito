'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type SummaryRow = {
  nivel: number
  nome: string
  vendedor_nome: string | null
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

export default function AnalisTerritorioResult({ success, message, data }: Props) {
  const [expandedTerritories, setExpandedTerritories] = useState<Set<string>>(new Set())

  if (!success || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            Análise de Territórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{message}</p>
        </CardContent>
      </Card>
    )
  }

  const toggleTerritory = (territorio: string) => {
    const newExpanded = new Set(expandedTerritories)
    if (newExpanded.has(territorio)) {
      newExpanded.delete(territorio)
    } else {
      newExpanded.add(territorio)
    }
    setExpandedTerritories(newExpanded)
  }

  const rows = data.summary || []
  const territorios: string[] = []
  const territorioData = new Map<string, { total: number; vendedores: SummaryRow[] }>()

  rows.forEach(row => {
    if (row.nivel === 1) {
      if (!territorios.includes(row.nome)) {
        territorios.push(row.nome)
      }
      if (!territorioData.has(row.nome)) {
        territorioData.set(row.nome, { total: row.faturamento_total, vendedores: [] })
      }
    } else if (row.nivel === 2) {
      const terr = territorioData.get(row.nome)
      if (terr) {
        terr.vendedores.push(row)
      }
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-600" />
          Análise de Territórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {territorios.map(territorio => {
            const data = territorioData.get(territorio)
            if (!data) return null

            const isExpanded = expandedTerritories.has(territorio)

            return (
              <div key={territorio} className="border rounded-lg">
                <button
                  onClick={() => toggleTerritory(territorio)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-semibold">{territorio}</span>
                  </div>
                  <span className="text-green-600 font-bold">
                    {data.total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </button>

                {isExpanded && data.vendedores.length > 0 && (
                  <div className="border-t bg-gray-50">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Vendedor</th>
                          <th className="px-4 py-2 text-right">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.vendedores.map((vendedor, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="px-4 py-2 pl-8">{vendedor.vendedor_nome || 'Sem vendedor'}</td>
                            <td className="px-4 py-2 text-right">
                              {vendedor.faturamento_total.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
