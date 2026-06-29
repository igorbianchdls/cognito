'use client'

import { AlertCircle, CheckCircle2, Clock3, PlugZap } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { IntegrationConnectionWithUi } from '@/products/integracoes/frontend/services/integracoesApi'

type ConnectionStatusPanelProps = {
  connections: IntegrationConnectionWithUi[]
  loading?: boolean
}

export default function ConnectionStatusPanel({ connections, loading = false }: ConnectionStatusPanelProps) {
  const connected = connections.filter((connection) => connection.status === 'connected').length
  const pending = connections.filter((connection) => connection.status === 'pending_auth' || connection.status === 'draft').length
  const attention = connections.filter((connection) => connection.status === 'warning' || connection.status === 'error').length

  const items = [
    { label: 'Total', value: connections.length, icon: PlugZap, className: 'text-[#475569]' },
    { label: 'Conectadas', value: connected, icon: CheckCircle2, className: 'text-[#168256]' },
    { label: 'Pendentes', value: pending, icon: Clock3, className: 'text-[#B7791F]' },
    { label: 'Atenção', value: attention, icon: AlertCircle, className: 'text-[#C2410C]' },
  ]

  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="rounded-lg bg-white py-0 shadow-[0_10px_24px_rgba(23,32,58,0.05)]">
            <CardContent className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A4BA]">{item.label}</div>
                <div className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-[#17203A]">
                  {loading ? '-' : item.value}
                </div>
              </div>
              <div className={['grid h-10 w-10 place-items-center rounded-[14px] bg-[#F7F8FC]', item.className].join(' ')}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
