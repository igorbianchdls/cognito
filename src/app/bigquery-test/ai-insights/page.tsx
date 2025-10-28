'use client'

import InsightsHeroCarousel, { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'

export default function AiInsightsPage() {
  const items: InsightHeroItem[] = [
    {
      id: 'i1',
      headline: '+78%',
      title: 'increase in your revenue by end of this month is forecasted.',
      description:
        'Asep is about to receive 15K new customers which results in 78% increase in revenue.',
      rangeLabel: 'This Week',
    },
    {
      id: 'i2',
      headline: '+24%',
      title: 'expected uplift in mobile conversion compared to last week.',
      description: 'Evening cohort 20–22h continues to outperform other slots.',
      rangeLabel: 'This Week',
    },
    {
      id: 'i3',
      headline: '–12%',
      title: 'drop in bounce rate after homepage UX update.',
      description: 'Engagement improved across organic traffic and returning users.',
      rangeLabel: 'This Month',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">AI Insights Card (Swiper)</h1>
        <p className="text-gray-600 mb-8">
          Subrota: <code>/bigquery-test/ai-insights</code>. Abaixo está o componente de card
          com slider, inspirado na referência enviada.
        </p>

        <InsightsHeroCarousel items={items} autoplay={{ delay: 5000 }} />
      </div>
    </div>
  )
}

