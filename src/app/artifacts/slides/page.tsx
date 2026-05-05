import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ArtifactCatalogPage, type ArtifactCatalogItem } from '@/products/artifacts/core/catalog/ArtifactCatalogPage'

const SLIDE_ITEMS: ArtifactCatalogItem[] = [
  {
    id: 'slide-commercial-review',
    title: 'Executive Commercial Review',
    summary: 'Deck executivo para performance comercial, canais e próximos passos.',
    status: 'draft',
    updatedAt: '2026-05-04T16:30:00.000Z',
    href: '/slide',
  },
  {
    id: 'slide-board-update',
    title: 'Board Update Deck',
    summary: 'Apresentação para diretoria com síntese de KPIs e riscos.',
    status: 'published',
    updatedAt: '2026-05-02T09:10:00.000Z',
    href: '/slide',
  },
  {
    id: 'slide-growth-mix',
    title: 'Growth Channel Story',
    summary: 'Narrativa visual sobre expansão, eficiência e concentração de canais.',
    status: 'archived',
    updatedAt: '2026-04-28T13:50:00.000Z',
    href: '/slide',
  },
]

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ArtifactsSlidesPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto bg-white">
        <ArtifactCatalogPage
          title="Slides"
          description="Explore decks e apresentações em um catálogo visual antes de abrir o editor de narrativa."
          primaryActionLabel="Novo Slide"
          primaryActionHref="/slide"
          emptyTitle="No slides yet"
          emptyDescription="Os slides disponíveis no workspace aparecerão aqui assim que a camada de persistência da biblioteca for conectada."
          kind="slide"
          items={SLIDE_ITEMS}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
