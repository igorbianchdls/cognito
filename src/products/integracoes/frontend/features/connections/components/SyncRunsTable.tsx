'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { IntegrationSyncRunWithUi } from '@/products/integracoes/frontend/services/integracoesApi'

type SyncRunsTableProps = {
  runs: IntegrationSyncRunWithUi[]
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function SyncRunsTable({ runs }: SyncRunsTableProps) {
  if (!runs.length) {
    return (
      <Card className="rounded-lg border-dashed bg-[#FAFBFD] py-0 shadow-none">
        <CardContent className="px-4 py-6 text-center text-[13px] text-[#66748D]">
        Nenhuma sincronização registrada ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#E6EAF4]">
      <Table>
        <TableHeader className="bg-[#F7F8FC]">
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Registros</TableHead>
            <TableHead>Finalizado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell>
                <Badge variant="secondary">
                  {run.uiStatus?.label || run.status}
                </Badge>
              </TableCell>
              <TableCell className="text-[#334155]">{run.trigger}</TableCell>
              <TableCell className="text-[#334155]">{run.recordsUpdated}</TableCell>
              <TableCell>{formatDate(run.finishedAt || run.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
