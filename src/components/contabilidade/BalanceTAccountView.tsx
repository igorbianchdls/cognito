"use client"

import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Linha = { conta: string; valor: number }
type Grupo = { nome: string; linhas: Linha[] }

// Mock de dados – ajuste conforme necessário
const MOCK = {
  ativo: [
    { nome: 'Ativo Circulante', linhas: [
      { conta: 'Caixa e Equivalentes de Caixa', valor: 155000 },
      { conta: 'Contas a Receber', valor: 70000 },
      { conta: 'Estoques', valor: 56000 },
    ] },
    { nome: 'Ativo Não Circulante', linhas: [
      { conta: 'Imobilizado', valor: 320000 },
      { conta: 'Intangível', valor: 31000 },
    ] },
  ] as Grupo[],
  passivo: [
    { nome: 'Passivo Circulante', linhas: [
      { conta: 'Fornecedores', valor: 75000 },
      { conta: 'Obrigações Trabalhistas', valor: 23000 },
    ] },
    { nome: 'Passivo Não Circulante', linhas: [
      { conta: 'Empréstimos e Financiamentos', valor: 190000 },
    ] },
  ] as Grupo[],
  pl: [
    { nome: 'Patrimônio Líquido', linhas: [
      { conta: 'Capital Social', valor: 250000 },
      { conta: 'Lucros/Prejuízos Acumulados', valor: 65000 },
    ] },
  ] as Grupo[],
}

function currency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function totalGrupo(g: Grupo) {
  return g.linhas.reduce((acc, l) => acc + (Number(l.valor) || 0), 0)
}
function totalSecao(gs: Grupo[]) {
  return gs.reduce((acc, g) => acc + totalGrupo(g), 0)
}

export default function BalanceTAccountView() {
  const totalAtivo = useMemo(() => totalSecao(MOCK.ativo), [])
  const totalPassivo = useMemo(() => totalSecao(MOCK.passivo), [])
  const totalPL = useMemo(() => totalSecao(MOCK.pl), [])

  const totalDireita = totalPassivo + totalPL
  const emEquilibrio = Math.abs(totalAtivo - totalDireita) < 0.005

  const SecaoTabela = ({ titulo, grupos }: { titulo: string; grupos: Grupo[] }) => (
    <div className="rounded-lg border bg-white">
      <div className="px-4 py-3 border-b text-sm font-semibold text-gray-800">{titulo}</div>
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
              <TableRow key={`g-${titulo}-${g.nome}`}>
                <TableCell colSpan={2} className="bg-gray-50 text-gray-700 font-medium">{g.nome}</TableCell>
              </TableRow>
              {g.linhas.map((l, idx) => (
                <TableRow key={`l-${titulo}-${g.nome}-${idx}`}>
                  <TableCell className="text-gray-800">{l.conta}</TableCell>
                  <TableCell className="text-right text-gray-800">{currency(Number(l.valor) || 0)}</TableCell>
                </TableRow>
              ))}
              <TableRow key={`t-${titulo}-${g.nome}`}>
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
  )

  return (
    <div className="space-y-4">
      {/* Linha superior fixa em 2 colunas (sempre lado a lado) */}
      <div className="overflow-x-auto">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minWidth: 720 }}>
          <div>
            <SecaoTabela titulo="Ativo" grupos={MOCK.ativo} />
          </div>
          <div>
            <SecaoTabela titulo="Passivo" grupos={MOCK.passivo} />
          </div>
        </div>
      </div>

      {/* Linha inferior: Patrimônio Líquido (largura total) */}
      <div className="overflow-x-auto">
        <SecaoTabela titulo="Patrimônio Líquido" grupos={MOCK.pl} />
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
