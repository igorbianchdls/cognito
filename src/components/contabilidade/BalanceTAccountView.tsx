"use client"

import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Linha = { conta: string; valor: number }
type Grupo = { nome: string; linhas: Linha[] }

type BalanceData = { ativo: Grupo[]; passivo: Grupo[]; pl: Grupo[] }

function currency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function totalGrupo(g: Grupo) {
  return g.linhas.reduce((acc, l) => acc + (Number(l.valor) || 0), 0)
}
function totalSecao(gs: Grupo[]) {
  return gs.reduce((acc, g) => acc + totalGrupo(g), 0)
}

export default function BalanceTAccountView({ data }: { data: BalanceData }) {
  const ativo = data?.ativo || []
  const passivo = data?.passivo || []
  const pl = data?.pl || []
  const totalAtivo = useMemo(() => totalSecao(ativo), [ativo])
  const totalPassivo = useMemo(() => totalSecao(passivo), [passivo])
  const totalPL = useMemo(() => totalSecao(pl), [pl])

  const totalDireita = totalPassivo + totalPL
  const emEquilibrio = Math.abs(totalAtivo - totalDireita) < 0.005

  const SecaoTabela = ({ titulo, grupos }: { titulo: string; grupos: Grupo[] }) => (
    <div className="rounded-lg border bg-white">
      <div className="px-4 py-3 border-b text-sm font-semibold text-gray-800">{titulo}</div>
      <div className="px-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-gray-600">Conta</TableHead>
            <TableHead className="text-right text-gray-600">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos.map((g) => (
            <>
              <TableRow key={`g-${titulo}-${g.nome}`} style={{ backgroundColor: '#ffffff' }}>
                <TableCell colSpan={2} className="text-gray-700 font-medium">{g.nome}</TableCell>
              </TableRow>
              {g.linhas.map((l, idx) => (
                <TableRow key={`l-${titulo}-${g.nome}-${idx}`} style={{ backgroundColor: '#ffffff' }}>
                  <TableCell className="text-gray-800">{l.conta}</TableCell>
                  <TableCell className="text-right text-gray-800">{currency(Number(l.valor) || 0)}</TableCell>
                </TableRow>
              ))}
              <TableRow key={`t-${titulo}-${g.nome}`} style={{ backgroundColor: '#ffffff' }}>
                <TableCell className="text-right font-semibold text-gray-900">Subtotal</TableCell>
                <TableCell className="text-right font-semibold text-gray-900">{currency(totalGrupo(g))}</TableCell>
              </TableRow>
            </>
          ))}
          <TableRow>
            <TableCell className="text-right font-semibold text-gray-900">Total {titulo}</TableCell>
            <TableCell className="text-right font-semibold text-gray-900">
              {currency(totalSecao(grupos))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 px-4 md:px-6">
      {/* Razonete: Esquerda = Ativo; Direita = Passivo e abaixo Patrimônio Líquido */}
      <div className="overflow-x-auto">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minWidth: 960 }}>
          {/* Coluna esquerda: ATIVO */}
          <div>
            <SecaoTabela titulo="Ativo" grupos={ativo} />
          </div>
          {/* Coluna direita: PASSIVO (acima) + PL (abaixo) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SecaoTabela titulo="Passivo" grupos={passivo} />
            <SecaoTabela titulo="Patrimônio Líquido" grupos={pl} />
          </div>
        </div>
      </div>

      {/* Validação de equilíbrio */}
      <div className="rounded-md border p-3 text-sm flex items-center justify-between">
        <div className="text-gray-700">Validação: Total Ativo = Total Passivo + PL</div>
        <div className="font-semibold" style={{ color: emEquilibrio ? '#15803D' : '#DC2626' }}>
          {currency(totalAtivo)} {emEquilibrio ? '=' : '≠'} {currency(totalDireita)}
        </div>
      </div>
    </div>
  )
}
