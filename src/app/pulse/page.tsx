'use client'

import { useEffect, useMemo, useState } from 'react'
import { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'
import PulseHeader from '@/components/pulse/PulseHeader'
import PulseChips from '@/components/pulse/PulseChips'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import { useStore } from '@nanostores/react'
import { $titulo, $tabs, $layout, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import PulseFeed from '@/components/pulse/PulseFeed'

type Chip = 'unusual' | 'normal' | 'following' | 'all'
type Tab = 'following' | 'foryou' | 'allmetrics'

export default function PulsePage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const layout = useStore($layout)
  const [chip, setChip] = useState<Chip>('all')
  const counts = { unusual: 1, normal: 12, following: 6, all: 13 }

  // Mock hero items reused across cards
  const items: InsightHeroItem[] = useMemo(() => ([
    {
      id: 'r1',
      headline: '+78%',
      title: "increase in your revenue by end of this month is forecasted.",
      description: 'Asep is about to receive 15K new customers which results in 78% increase in revenue.',
      rangeLabel: 'This Week'
    },
    {
      id: 'r2',
      headline: '+24%',
      title: 'expected uplift in mobile conversion compared to last week.',
      description: 'Evening cohort 20–22h continues to outperform other slots.',
      rangeLabel: 'This Week'
    },
    {
      id: 'r3',
      headline: '–12%',
      title: 'drop in bounce rate after homepage UX update.',
      description: 'Engagement improved across organic traffic and returning users.',
      rangeLabel: 'This Month'
    },
  ]), [])

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'Pulse', subtitle: 'Insights rápidos, status e variações de desempenho', titleFontFamily: 'var(--font-crimson-text)' })
    moduleUiActions.setTabs({
      options: [
        { value: 'foryou', label: 'Para você' },
        { value: 'following', label: 'Seguindo' },
        { value: 'allmetrics', label: 'Todas métricas' },
      ],
      selected: 'foryou',
    })
  }, [])

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-auto" style={{ background: layout.contentBg }}>
        {/* Topo branco com título/subtítulo e chips abaixo */}
        <div style={{ background: 'white' }}>
          <div className="w-full px-4 md:px-6 pt-6">
            <PageHeader
              title={titulo.title}
              subtitle={titulo.subtitle}
              titleFontFamily={titulo.titleFontFamily}
              titleFontSize={titulo.titleFontSize}
              titleFontWeight={titulo.titleFontWeight}
              titleColor={titulo.titleColor}
              titleLetterSpacing={titulo.titleLetterSpacing}
            />
            <PulseHeader
              userName="Igor Bianch"
              summary={(
                <>
                  Vendas de eletrodomésticos caíram 8% vs. semana passada (fora da faixa esperada). Receita total +6% puxada por orgânico e CRM; ROI de campanhas subiu para 3,1×.
                </>
              )}
              lastUpdated={new Date(Date.now() - 5 * 60 * 1000)}
              avatarUrl="https://images.pexels.com/photos/17527940/pexels-photo-17527940.jpeg?cs=srgb&dl=pexels-rogeriosouzafotografia-17527940.jpg&fm=jpg"
            />
            <div className="pb-4">
              <PulseChips value={chip} counts={counts} onChange={setChip} />
            </div>
            {/* Tabs underline com borda logo abaixo do topo */}
            <TabsNav
              options={(tabs.options as Opcao[])}
              value={tabs.selected}
              onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
              fontFamily={tabs.fontFamily}
              fontSize={tabs.fontSize}
              fontWeight={tabs.fontWeight}
              color={tabs.color}
              letterSpacing={tabs.letterSpacing}
              iconSize={tabs.iconSize}
              startOffset={tabs.leftOffset}
              labelOffsetY={tabs.labelOffsetY}
              activeColor={tabs.activeColor}
              activeFontWeight={tabs.activeFontWeight}
              activeBorderColor={tabs.activeBorderColor}
            />
          </div>
        </div>

        {/* Conteúdo em cinza claro */}
        <div className="w-full px-4 md:px-6 py-4 flex-1">
          <PulseFeed
            items={items}
            variants={['aurora','blueNight','neoLight','emberRed','obsidianBlack','sunsetOrange','crimsonGlow','roseDawn','report']}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
