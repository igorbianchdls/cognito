"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Props { periods?: { key: string; label: string }[] }

type Row = { id: string; label: string; valuesByPeriod: Record<string, number> }

const DEFAULT_PERIODS = [
  { key: '2025-01', label: 'Janeiro' },
  { key: '2025-02', label: 'Fevereiro' },
  { key: '2025-03', label: 'Março' },
]

const ROWS: Row[] = [
  { id: 'capital', label: 'Capital Social', valuesByPeriod: { '2025-01': 180_000, '2025-02': 180_000, '2025-03': 180_000 } },
  { id: 'reservas', label: 'Reservas', valuesByPeriod: { '2025-01': 35_000, '2025-02': 35_000, '2025-03': 35_000 } },
  { id: 'lucros', label: 'Lucros Acumulados', valuesByPeriod: { '2025-01': 70_000, '2025-02': 74_000, '2025-03': 78_500 } },
]

function currency(n: number) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

export default function DMPLTable({ periods = DEFAULT_PERIODS }: Props) {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5 text-gray-600">Componente do PL</TableHead>
            {periods.map(p => <TableHead key={p.key} className="text-right text-gray-600">{p.label}</TableHead>)}
            <TableHead className="text-right text-gray-600">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-gray-800">{r.label}</TableCell>
              {periods.map(p => <TableCell key={p.key} className="text-right text-gray-700">{currency(r.valuesByPeriod[p.key] || 0)}</TableCell>)}
              <TableCell className="text-right font-medium text-gray-900">{currency(periods.reduce((acc, p) => acc + (r.valuesByPeriod[p.key] || 0), 0))}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold text-gray-900">Patrimônio Líquido Total</TableCell>
            {periods.map(p => (
              <TableCell key={p.key} className="text-right font-semibold text-gray-900">
                {currency(ROWS.reduce((acc, r) => acc + (r.valuesByPeriod[p.key] || 0), 0))}
              </TableCell>
            ))}
            <TableCell className="text-right font-semibold text-gray-900">
              {currency(ROWS.reduce((sum, r) => sum + periods.reduce((acc, p) => acc + (r.valuesByPeriod[p.key] || 0), 0), 0))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
