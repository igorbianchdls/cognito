"use client"

import InsightsHeroCarousel, { type InsightHeroItem } from '@/components/widgets/InsightsHeroCarousel'

type HeroVariant = 'aurora' | 'blueNight' | 'neoLight' | 'report' | 'emberRed' | 'obsidianBlack' | 'sunsetOrange' | 'crimsonGlow' | 'roseDawn'

type PulseFeedProps = {
  items: InsightHeroItem[]
  variants?: HeroVariant[]
}

export function PulseFeed({ items, variants = ['neoLight', 'aurora', 'obsidianBlack'] }: PulseFeedProps) {
  return (
    <div className="mt-8 grid x grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {variants.map((v, idx) => (
        <InsightsHeroCarousel key={v + idx} items={items} variant={v} showArrows={v !== 'neoLight'} />
      ))}
    </div>
  )
}

export default PulseFeed
