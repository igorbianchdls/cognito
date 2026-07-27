import { IconArrowUpRight, IconCash, IconPackage, IconReceipt, IconUsers } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { ErpMetricCard } from '@/products/erp/frontend/components/ErpMetricCard'
import { ErpPageHeader } from '@/products/erp/frontend/components/ErpPageHeader'

const overviewMetrics = [
  { label: 'Receita prevista', value: 'R$ 284 mil', detail: '+18% vs mes anterior', tone: 'success' as const },
  { label: 'Pedidos abertos', value: '42', detail: '12 aguardando faturamento' },
  { label: 'Estoque critico', value: '9 SKUs', detail: 'reposicao recomendada', tone: 'warning' as const },
  { label: 'Contas vencendo', value: 'R$ 38 mil', detail: 'proximos 7 dias', tone: 'danger' as const },
]

const workQueues = [
  { label: 'Clientes em analise', value: '7', icon: IconUsers },
  { label: 'Pedidos para aprovar', value: '12', icon: IconReceipt },
  { label: 'Produtos sem estoque', value: '9', icon: IconPackage },
  { label: 'Titulos a conciliar', value: '18', icon: IconCash },
]

export function OverviewPage() {
  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ErpPageHeader
          eyebrow="ERP"
          title="Visao geral"
          description="Acompanhe operacao, vendas, estoque e financeiro em uma visao unica antes de conectar dados reais."
        />
        <Button size="sm">
          Abrir relatorio
          <IconArrowUpRight className="size-4" stroke={1.8} />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => <ErpMetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-md border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-normal text-gray-950">Fluxo operacional</h2>
              <p className="mt-1 text-sm text-gray-600">Resumo mockado dos principais movimentos do dia.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {['Pedido recebido', 'Separacao de estoque', 'Faturamento', 'Contas a receber'].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-white text-sm font-semibold text-gray-700 ring-1 ring-gray-200">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-950">{step}</div>
                  <div className="text-xs text-gray-500">{index === 3 ? 'Aguardando conciliacao' : 'Operando dentro do prazo'}</div>
                </div>
                <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${86 - index * 14}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold tracking-normal text-gray-950">Filas de trabalho</h2>
          <div className="mt-4 grid gap-3">
            {workQueues.map((queue) => {
              const Icon = queue.icon
              return (
                <div key={queue.label} className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-gray-50 text-gray-600">
                    <Icon className="size-5" stroke={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-950">{queue.label}</div>
                    <div className="text-xs text-gray-500">Atualizado agora</div>
                  </div>
                  <div className="text-lg font-semibold text-gray-950">{queue.value}</div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

