import { AlertCircle, CheckCircle2, Clock3, Info } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { IntegrationEventWithUi } from '@/products/integracoes/frontend/services/integracoesApi'

type IntegrationEventTimelineProps = {
  events: IntegrationEventWithUi[]
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

function EventIcon({ severity }: { severity: IntegrationEventWithUi['severity'] }) {
  if (severity === 'error') return <AlertCircle className="h-4 w-4 text-[#DC2626]" />
  if (severity === 'warning') return <Info className="h-4 w-4 text-[#B45309]" />
  if (severity === 'info') return <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
  return <Clock3 className="h-4 w-4 text-[#64748B]" />
}

export default function IntegrationEventTimeline({ events }: IntegrationEventTimelineProps) {
  if (!events.length) {
    return (
      <Card className="rounded-lg border-dashed bg-[#FAFBFD] py-0 shadow-none">
        <CardContent className="px-4 py-5 text-[13px] text-[#66748D]">
        Nenhum evento operacional registrado.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="rounded-lg bg-white py-0 shadow-none">
          <CardContent className="flex gap-3 p-3">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F3F6FB]">
            <EventIcon severity={event.severity} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="text-[13px] font-semibold text-[#24304A]">{event.uiEventType?.label || event.eventType}</div>
              <div className="text-[12px] text-[#98A4BA]">{formatDate(event.createdAt)}</div>
            </div>
            <div className="mt-1 text-[13px] leading-5 text-[#66748D]">{event.message}</div>
            {event.actor ? <div className="mt-1 text-[12px] text-[#98A4BA]">Origem: {event.actor}</div> : null}
          </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
