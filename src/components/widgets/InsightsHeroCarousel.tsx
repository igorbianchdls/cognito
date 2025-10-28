'use client'

import React from 'react'
import { MoreHorizontal, Sparkles } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export type InsightHeroItem = {
  id: string
  headline: string // ex: "+78%"
  title: string // ex: "increase in your revenue..."
  description?: string
  rangeLabel?: string // ex: "This Week"
}

type Props = {
  items: InsightHeroItem[]
  loop?: boolean
  autoplay?: boolean | { delay: number }
}

export default function InsightsHeroCarousel({ items, loop = true, autoplay }: Props) {
  return (
    <div className="insights-swiper">
      <Swiper
        modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true }}
        loop={loop}
        autoplay={autoplay || false}
        slidesPerView={1}
        spaceBetween={0}
        className="max-w-[340px]"
      >
        {items.map((it) => (
          <SwiperSlide key={it.id}>
            <article
              role="region"
              aria-label={`Insight ${it.headline}`}
              className="relative h-[300px] rounded-2xl p-5 text-white shadow-xl overflow-hidden select-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16,185,129,1) 0%, rgba(5,150,105,1) 70%)',
              }}
            >
              {/* subtle radial glow */}
              <div className="pointer-events-none absolute -left-6 top-6 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
              {/* header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Insight</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-medium">
                    {it.rangeLabel || 'This Week'}
                  </span>
                  <button aria-label="More options" className="p-1 rounded-full hover:bg-white/20">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* content */}
              <div className="mt-4">
                <div className="text-5xl font-extrabold tracking-tight">{it.headline}</div>
                <p className="mt-3 text-[15px] leading-relaxed text-white/95 max-w-[96%]">
                  {it.title}
                </p>
                {it.description && (
                  <p className="mt-4 text-xs leading-5 text-white/85 max-w-[96%]">
                    {it.description}
                  </p>
                )}
              </div>

              {/* bottom area keeps space for nav/pagination (styled via CSS below) */}
              <div className="absolute inset-x-0 bottom-0 h-9" />
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Scoped styling for Swiper controls to match the reference */}
      <style jsx global>{`
        .insights-swiper .swiper {
          border-radius: 1rem;
        }
        /* arrows at bottom corners */
        .insights-swiper .swiper-button-next,
        .insights-swiper .swiper-button-prev {
          color: #ffffff;
          width: 28px;
          height: 28px;
          top: auto;
          bottom: 10px;
        }
        .insights-swiper .swiper-button-prev { left: 8px; }
        .insights-swiper .swiper-button-next { right: 8px; }
        .insights-swiper .swiper-button-next:after,
        .insights-swiper .swiper-button-prev:after {
          font-size: 18px;
        }
        /* center pagination with dash style */
        .insights-swiper .swiper-horizontal>.swiper-pagination-bullets,
        .insights-swiper .swiper-pagination-bullets.swiper-pagination-horizontal {
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
        }
        .insights-swiper .swiper-pagination-bullet {
          width: 18px;
          height: 4px;
          border-radius: 9999px;
          background: rgba(255,255,255,.35);
          opacity: 1;
          margin: 0 4px !important;
        }
        .insights-swiper .swiper-pagination-bullet-active {
          background: #ffffff;
        }
      `}</style>
    </div>
  )
}

