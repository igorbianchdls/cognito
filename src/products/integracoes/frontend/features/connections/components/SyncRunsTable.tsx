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
import type { IntegrationEventWithUi } from '@/products/integracoes/frontend/services/integracoesApi'
import { buildSyncProgressSummary } from '@/products/integracoes/frontend/features/connections/lib/syncProgress'

type SyncRunsTableProps = {
  runs: IntegrationSyncRunWithUi[]
  events?: IntegrationEventWithUi[]
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

function progressClassName(tone: ReturnType<typeof buildSyncProgressSummary>['tone']) {
  if (tone === 'danger') return 'text-red-700'
  if (tone === 'warning') return 'text-amber-700'
  if (tone === 'success') return 'text-emerald-700'
  if (tone === 'progress') return 'text-[#2563EB]'
  return 'text-[#66748D]'
}

export default function SyncRunsTable({ runs, events = [] }: SyncRunsTableProps) {
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
            <TableHead>Progresso</TableHead>
            <TableHead>Finalizado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {runs.map((run) => {
            const progress = buildSyncProgressSummary(run, events)
            return (
              <TableRow key={run.id}>
                <TableCell>
                  <Badge variant="secondary">
                    {run.uiStatus?.label || run.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#334155]">{run.trigger}</TableCell>
                <TableCell>
                  <div className={`text-[13px] font-medium ${progressClassName(progress.tone)}`}>
                    {progress.title}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-5 text-[#66748D]">
                    {progress.detail}
                  </div>
                </TableCell>
                <TableCell>{formatDate(run.finishedAt || run.createdAt)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
