'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import InsightsHeroCarousel, { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
        <div className="mx-auto max-w-7xl w-full px-6 md:px-10 py-8">
          {/* Top header area (no white boxes) */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Tableau Pulse</div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mt-1">
                  Hey, there. Here’s today’s pulse.
                </h1>
                <p className="mt-2 text-gray-600 max-w-3xl">
                  Appliance Sales is seeing an unusual spike, while <span className="text-blue-600 hover:underline cursor-pointer">Branch Revenue</span> and <span className="text-blue-600 hover:underline cursor-pointer">Campaign ROI</span> are steadily increasing. Of the 12 metrics you follow, 1 is unusual.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="pl-9 pr-3 py-2 w-full md:w-72 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Search for metrics"
                  />
                </div>
              </div>
            </div>

            {/* Chips + Tabs row */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChip('unusual')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur ring-1 transition ${
                    chip === 'unusual'
                      ? 'bg-emerald-100 text-emerald-900 ring-emerald-200'
                      : 'bg-emerald-50/60 text-emerald-700 ring-emerald-200/60 hover:bg-emerald-100'
                  }`}
                >
                  Unusual <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/70 text-emerald-700">{counts.unusual}</span>
                </button>
                <button
                  onClick={() => setChip('normal')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur ring-1 transition ${
                    chip === 'normal'
                      ? 'bg-indigo-100 text-indigo-900 ring-indigo-200'
                      : 'bg-indigo-50/60 text-indigo-700 ring-indigo-200/60 hover:bg-indigo-100'
                  }`}
                >
                  Normal <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/70 text-indigo-700">{counts.normal}</span>
                </button>
                <button
                  onClick={() => setChip('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur ring-1 transition ${
                    chip === 'all'
                      ? 'bg-gray-100 text-gray-900 ring-gray-200'
                      : 'bg-gray-50/60 text-gray-700 ring-gray-200/60 hover:bg-gray-100'
                  }`}
                >
                  All <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/70 text-gray-700">{counts.all}</span>
                </button>
              </div>

              {/* divider removed; tabs come below as full-width underline */}
            </div>
        </div>
        </div>

        {/* Full-width tabs underline band (like /workflows) */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
          <TabsList className="w-full h-12" variant="underline">
            <div className="w-full flex items-end gap-3">
              <TabsTrigger value="following" variant="underline" className="pb-2 px-2 md:px-3" activeBorderColor="#111827">
                Following
              </TabsTrigger>
              <TabsTrigger value="foryou" variant="underline" className="pb-2 px-2 md:px-3" activeBorderColor="#111827">
                For you
              </TabsTrigger>
              <TabsTrigger value="allmetrics" variant="underline" className="pb-2 px-2 md:px-3" activeBorderColor="#111827">
                All metrics
              </TabsTrigger>
            </div>
          </TabsList>
        </Tabs>

        {/* Feed: use insight cards directly (no white containers) */}
        <div className="mx-auto max-w-7xl w-full px-6 md:px-10">
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightsHeroCarousel items={items} variant="neoLight" showArrows={false} />
            <InsightsHeroCarousel items={items} variant="aurora" />
            <InsightsHeroCarousel items={items} variant="obsidianBlack" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
