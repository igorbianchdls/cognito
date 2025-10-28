'use client'

import { useMemo, useState } from 'react'
import { Search, UserCircle2 } from 'lucide-react'
import InsightsHeroCarousel, { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'

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
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm">
          <div className="p-6 md:p-8 grid grid-cols-1 gap-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Pulse</div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mt-1">
                  Hey, there. Here's today’s pulse.
                </h1>
                <p className="mt-3 text-gray-600 max-w-2xl">
                  Appliance Sales is seeing an unusual spike, while <span className="text-blue-600 hover:underline cursor-pointer">Branch Revenue</span> and <span className="text-blue-600 hover:underline cursor-pointer">Campaign ROI</span> are steadily increasing. Of the 12 metrics you follow, 1 is unusual.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="pl-9 pr-3 py-2 w-64 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Search for metrics"
                  />
                </div>
                <div className="h-8 w-[1px] bg-gray-200" />
                <UserCircle2 className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Chips */}
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

            {/* Tabs */}
            <div className="flex items-center gap-5 text-sm">
              {([
                { id: 'following', label: 'Following' },
                { id: 'foryou', label: 'For you' },
                { id: 'allmetrics', label: 'All metrics' },
              ] as { id: Tab; label: string }[]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative pb-2 transition-colors ${tab === t.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <InsightsHeroCarousel items={items} variant="neoLight" showArrows={false} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <InsightsHeroCarousel items={items} variant="aurora" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <InsightsHeroCarousel items={items} variant="obsidianBlack" />
          </div>
        </div>
      </div>
    </div>
  )
}

