import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ArtifactCatalogPage, type ArtifactCatalogItem } from '@/products/artifacts/core/catalog/ArtifactCatalogPage'

const REPORT_ITEMS: ArtifactCatalogItem[] = [
  {
    id: 'report-executive-brief',
    title: 'Executive Revenue Brief',
    summary: 'Resumo executivo com KPIs, canais e highlights financeiros.',
    status: 'draft',
    updatedAt: '2026-05-04T14:20:00.000Z',
    href: '/report',
  },
  {
    id: 'report-monthly-review',
    title: 'Monthly Performance Review',
    summary: 'Visão mensal de receita, pedidos e evolução por canal.',
    status: 'published',
    updatedAt: '2026-05-03T10:15:00.000Z',
    href: '/report',
  },
  {
    id: 'report-channel-analysis',
    title: 'Channel Mix Analysis',
    summary: 'Análise editorial da concentração de receita e qualidade do mix.',
    status: 'archived',
    updatedAt: '2026-04-29T18:40:00.000Z',
    href: '/report',
  },
]

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ArtifactsReportsPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto bg-white">
        <ArtifactCatalogPage
          title="Reports"
          description="Navegue por relatórios editoriais e abra o workspace para ajustar narrativa, layout e exportação."
          primaryActionLabel="Novo Report"
          primaryActionHref="/report"
          emptyTitle="No reports yet"
          emptyDescription="Reports disponíveis no workspace aparecerão aqui assim que a persistência dessa biblioteca for conectada."
          kind="report"
          items={REPORT_ITEMS}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
