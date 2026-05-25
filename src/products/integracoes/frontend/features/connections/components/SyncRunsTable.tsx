'use client'

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
      <div className="rounded-[16px] border border-dashed border-[#D9DFEB] bg-[#FAFBFD] px-4 py-6 text-center text-[13px] text-[#66748D]">
        Nenhuma sincronização registrada ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E6EAF4]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead className="bg-[#F7F8FC] text-[#66748D]">
          <tr>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Trigger</th>
            <th className="px-4 py-3 font-semibold">Registros</th>
            <th className="px-4 py-3 font-semibold">Finalizado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF1F6] bg-white">
          {runs.map((run) => (
            <tr key={run.id}>
              <td className="px-4 py-3">
                <span className="rounded-full bg-[#F2F4FA] px-2.5 py-1 text-[12px] font-semibold text-[#475569]">
                  {run.uiStatus?.label || run.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[#334155]">{run.trigger}</td>
              <td className="px-4 py-3 text-[#334155]">{run.recordsUpdated}</td>
              <td className="px-4 py-3 text-[#66748D]">{formatDate(run.finishedAt || run.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
