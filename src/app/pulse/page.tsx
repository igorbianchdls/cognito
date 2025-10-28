'use client'

import { useMemo, useState } from 'react'
import { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PulseHeader from '@/components/pulse/PulseHeader'
import PulseChips from '@/components/pulse/PulseChips'
import PulseTabs from '@/components/pulse/PulseTabs'
import PulseFeed from '@/components/pulse/PulseFeed'

type Chip = 'unusual' | 'normal' | 'following' | 'all'
type Tab = 'following' | 'foryou' | 'allmetrics'

export default function PulsePage() {
  const [chip, setChip] = useState<Chip>('all')
  const [tab, setTab] = useState<Tab>('foryou')
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

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-auto bg-white">
        <div className="w-full px-4 md:px-6 py-8">
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

          <PulseChips value={chip} counts={counts} onChange={setChip} />
        </div>

        {/* Full-width tabs underline band (like /workflows) */}
        <PulseTabs value={tab} onChange={setTab} />

        {/* Feed: use insight cards directly (no white containers) */}
        <div className="w-full px-4 md:px-6">
          <PulseFeed
            items={items}
            variants={[
              'aurora',
              'blueNight',
              'neoLight',
              'emberRed',
              'obsidianBlack',
              'sunsetOrange',
              'crimsonGlow',
              'roseDawn',
              'report',
            ]}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
