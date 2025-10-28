'use client'

import { useMemo, useState } from 'react'
import { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PulseHeader from '@/components/pulse/PulseHeader'
import PulseChips from '@/components/pulse/PulseChips'
import PulseTabs from '@/components/pulse/PulseTabs'
import PulseFeed from '@/components/pulse/PulseFeed'

type Chip = 'unusual' | 'normal' | 'all'
type Tab = 'following' | 'foryou' | 'allmetrics'

export default function PulsePage() {
  const [chip, setChip] = useState<Chip>('all')
  const [tab, setTab] = useState<Tab>('foryou')
  const counts = { unusual: 1, normal: 12, all: 13 }

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
        <div className="w-full px-0 py-8">
          <PulseHeader
            title="Hey, there. Here’s today’s pulse."
            subtitle={(
              <>
                Appliance Sales is seeing an unusual spike, while <span className="text-blue-600 hover:underline cursor-pointer">Branch Revenue</span> and <span className="text-blue-600 hover:underline cursor-pointer">Campaign ROI</span> are steadily increasing. Of the 12 metrics you follow, 1 is unusual.
              </>
            )}
          />

          <PulseChips value={chip} counts={counts} onChange={setChip} />
        </div>

        {/* Full-width tabs underline band (like /workflows) */}
        <PulseTabs value={tab} onChange={setTab} />

        {/* Feed: use insight cards directly (no white containers) */}
        <div className="w-full px-0">
          <PulseFeed items={items} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
