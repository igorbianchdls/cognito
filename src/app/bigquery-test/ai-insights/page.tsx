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
        <p className="text-gray-600 mb-8">Rota: <code>/bigquery-test/ai-insights</code>. Mostrando variações de design.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Aurora Dark</h2>
            <InsightsHeroCarousel items={items} autoplay={{ delay: 5000 }} variant="aurora" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Blue Night</h2>
            <InsightsHeroCarousel items={items} loop variant="blueNight" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Neo‑Light</h2>
            <InsightsHeroCarousel items={items} variant="neoLight" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Report Minimal</h2>
            <InsightsHeroCarousel items={items} variant="report" showArrows={false} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Ember Red</h2>
            <InsightsHeroCarousel items={items} variant="emberRed" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Obsidian Black</h2>
            <InsightsHeroCarousel items={items} variant="obsidianBlack" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Sunset Orange</h2>
            <InsightsHeroCarousel items={items} variant="sunsetOrange" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Crimson Glow</h2>
            <InsightsHeroCarousel items={items} variant="crimsonGlow" />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Rose Dawn</h2>
            <InsightsHeroCarousel items={items} variant="roseDawn" />
          </section>
        </div>
      </div>
    </div>
  )
}
