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

type Variant = 'aurora' | 'blueNight' | 'neoLight' | 'report' | 'emberRed' | 'obsidianBlack' | 'sunsetOrange' | 'crimsonGlow' | 'roseDawn'

type Props = {
  items: InsightHeroItem[]
  loop?: boolean
  autoplay?: boolean | { delay: number }
  variant?: Variant
  paginationStyle?: 'dashes' | 'segments'
  showArrows?: boolean
}

export default function InsightsHeroCarousel({
  items,
  loop = true,
  autoplay,
  variant = 'aurora',
  paginationStyle = 'dashes',
  showArrows = true,
}: Props) {
  const theme = getTheme(variant)
  return (
    <div className={`insights-swiper insights-swiper--${variant}`}>
      <Swiper
        modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
        navigation={showArrows}
        pagination={{ clickable: true }}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true }}
        loop={loop}
        autoplay={autoplay || false}
        slidesPerView={1}
        spaceBetween={0}
        className={theme.wrapperWidth}
      >
        {items.map((it) => (
          <SwiperSlide key={it.id}>
            <article
              role="region"
              aria-label={`Insight ${it.headline}`}
              className={`relative ${theme.height} ${theme.radius} ${theme.padding} ${theme.text} ${theme.shadow} overflow-hidden select-none border ${theme.border}`}
              style={theme.style}
            >
              {/* subtle radial glow */}
              {theme.glow && (
                <div className="pointer-events-none absolute -left-6 top-6 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
              )}
              {/* header */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${theme.headerText}`}>
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Insight</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full ${theme.pill} text-xs font-medium`}> 
                    {it.rangeLabel || 'This Week'}
                  </span>
                  <button aria-label="More options" className={`p-1 rounded-full ${theme.moreBtn}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* content */}
              <div className="mt-4">
                <div className={`${theme.headline}`}>{it.headline}</div>
                <p className={`mt-3 text-[15px] leading-relaxed ${theme.bodyStrong} max-w-[96%]`}>
                  {it.title}
                </p>
                {it.description && (
                  <p className={`mt-4 text-xs leading-5 ${theme.bodyMuted} max-w-[96%]`}>
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
        .insights-swiper .swiper { border-radius: 1rem; }
        .insights-swiper .swiper-horizontal>.swiper-pagination-bullets,
        .insights-swiper .swiper-pagination-bullets.swiper-pagination-horizontal {
          bottom: 12px; left: 50%; transform: translateX(-50%); width: auto;
        }
        /* base dash bullets */
        .insights-swiper .swiper-pagination-bullet {
          width: 18px; height: 4px; border-radius: 9999px; margin: 0 4px !important; opacity: 1;
        }
        /* dark variants */
        .insights-swiper--aurora .swiper-button-next,
        .insights-swiper--aurora .swiper-button-prev,
        .insights-swiper--blueNight .swiper-button-next,
        .insights-swiper--blueNight .swiper-button-prev,
        .insights-swiper--emberRed .swiper-button-next,
        .insights-swiper--emberRed .swiper-button-prev,
        .insights-swiper--obsidianBlack .swiper-button-next,
        .insights-swiper--obsidianBlack .swiper-button-prev,
        .insights-swiper--sunsetOrange .swiper-button-next,
        .insights-swiper--sunsetOrange .swiper-button-prev,
        .insights-swiper--crimsonGlow .swiper-button-next,
        .insights-swiper--crimsonGlow .swiper-button-prev,
        .insights-swiper--roseDawn .swiper-button-next,
        .insights-swiper--roseDawn .swiper-button-prev {
          color: #ffffff; width: 28px; height: 28px; top: auto; bottom: 10px;
        }
        .insights-swiper--aurora .swiper-button-prev,
        .insights-swiper--blueNight .swiper-button-prev,
        .insights-swiper--emberRed .swiper-button-prev,
        .insights-swiper--obsidianBlack .swiper-button-prev,
        .insights-swiper--sunsetOrange .swiper-button-prev { left: 8px; }
        .insights-swiper--aurora .swiper-button-next,
        .insights-swiper--blueNight .swiper-button-next,
        .insights-swiper--emberRed .swiper-button-next,
        .insights-swiper--obsidianBlack .swiper-button-next,
        .insights-swiper--sunsetOrange .swiper-button-next,
        .insights-swiper--crimsonGlow .swiper-button-next,
        .insights-swiper--roseDawn .swiper-button-next { right: 8px; }
        .insights-swiper--aurora .swiper-button-next:after,
        .insights-swiper--aurora .swiper-button-prev:after,
        .insights-swiper--blueNight .swiper-button-next:after,
        .insights-swiper--blueNight .swiper-button-prev:after,
        .insights-swiper--emberRed .swiper-button-next:after,
        .insights-swiper--emberRed .swiper-button-prev:after,
        .insights-swiper--obsidianBlack .swiper-button-next:after,
        .insights-swiper--obsidianBlack .swiper-button-prev:after,
        .insights-swiper--sunsetOrange .swiper-button-next:after,
        .insights-swiper--sunsetOrange .swiper-button-prev:after,
        .insights-swiper--crimsonGlow .swiper-button-next:after,
        .insights-swiper--crimsonGlow .swiper-button-prev:after,
        .insights-swiper--roseDawn .swiper-button-next:after,
        .insights-swiper--roseDawn .swiper-button-prev:after { font-size: 18px; }
        .insights-swiper--aurora .swiper-pagination-bullet,
        .insights-swiper--blueNight .swiper-pagination-bullet,
        .insights-swiper--emberRed .swiper-pagination-bullet,
        .insights-swiper--obsidianBlack .swiper-pagination-bullet,
        .insights-swiper--sunsetOrange .swiper-pagination-bullet,
        .insights-swiper--crimsonGlow .swiper-pagination-bullet,
        .insights-swiper--roseDawn .swiper-pagination-bullet { background: rgba(255,255,255,.35); }
        .insights-swiper--aurora .swiper-pagination-bullet-active,
        .insights-swiper--blueNight .swiper-pagination-bullet-active,
        .insights-swiper--emberRed .swiper-pagination-bullet-active,
        .insights-swiper--obsidianBlack .swiper-pagination-bullet-active,
        .insights-swiper--sunsetOrange .swiper-pagination-bullet-active,
        .insights-swiper--crimsonGlow .swiper-pagination-bullet-active,
        .insights-swiper--roseDawn .swiper-pagination-bullet-active { background: #ffffff; }
        /* neo light */
        .insights-swiper--neoLight .swiper-button-next,
        .insights-swiper--neoLight .swiper-button-prev { color: #111827; width: 26px; height: 26px; top: auto; bottom: 10px; }
        .insights-swiper--neoLight .swiper-button-prev { left: 8px; }
        .insights-swiper--neoLight .swiper-button-next { right: 8px; }
        .insights-swiper--neoLight .swiper-pagination-bullet { background: rgba(0,0,0,.18); }
        .insights-swiper--neoLight .swiper-pagination-bullet-active { background: rgba(0,0,0,.7); }
        /* report: segments, no arrows */
        .insights-swiper--report .swiper-pagination-bullet { width: 44px; height: 6px; background: rgba(16,185,129,.25); }
        .insights-swiper--report .swiper-pagination-bullet-active { background: rgb(16,185,129); }
      `}</style>
    </div>
  )
}

function getTheme(variant: Variant) {
  switch (variant) {
    case 'aurora':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/90',
        pill: 'bg-white/20 backdrop-blur border border-white/20',
        moreBtn: 'hover:bg-white/20',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/95',
        bodyMuted: 'text-white/85',
        glow: true,
        style: {
          background:
            'radial-gradient(120px 120px at 40px 40px, rgba(255,255,255,0.15), transparent 60%), linear-gradient(135deg, #16a34a 0%, #065f46 70%)',
        } as React.CSSProperties,
      }
    case 'blueNight':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/90',
        pill: 'bg-white/20 backdrop-blur border border-white/20',
        moreBtn: 'hover:bg-white/20',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/95',
        bodyMuted: 'text-white/80',
        glow: false,
        style: {
          background:
            'linear-gradient(135deg, #1d4ed8 0%, #0f172a 65%)',
        } as React.CSSProperties,
      }
    case 'neoLight':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-gray-900',
        shadow: 'shadow-[0_15px_50px_rgba(0,0,0,.08)]',
        border: 'border-[#e7e7ea]',
        headerText: 'text-gray-600',
        pill: 'bg-white border border-gray-200',
        moreBtn: 'hover:bg-gray-100',
        headline: 'text-5xl font-extrabold tracking-tight text-gray-800',
        bodyStrong: 'text-gray-800',
        bodyMuted: 'text-gray-500',
        glow: false,
        style: {
          background:
            'linear-gradient(180deg, #f7f7f8 0%, #f1f2f4 100%)',
        } as React.CSSProperties,
      }
    case 'report':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[360px]',
        radius: 'rounded-3xl',
        padding: 'p-6',
        text: 'text-gray-900',
        shadow: 'shadow-[0_20px_70px_rgba(0,0,0,.10)]',
        border: 'border-[#e6e8eb]',
        headerText: 'text-gray-700',
        pill: 'bg-white border border-emerald-500/30 text-gray-800',
        moreBtn: 'hover:bg-gray-100',
        headline: 'text-[42px] leading-none font-semibold tracking-tight text-gray-900',
        bodyStrong: 'text-gray-800',
        bodyMuted: 'text-gray-500',
        glow: false,
        style: {
          background: '#fcfcfd',
        } as React.CSSProperties,
      }
    case 'emberRed':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/90',
        pill: 'bg-white/20 backdrop-blur border border-white/20',
        moreBtn: 'hover:bg-white/20',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/95',
        bodyMuted: 'text-white/85',
        glow: true,
        style: {
          background:
            'radial-gradient(120px 120px at 40px 40px, rgba(255,255,255,0.12), transparent 60%), linear-gradient(135deg, #dc2626 0%, #111827 70%)',
        } as React.CSSProperties,
      }
    case 'obsidianBlack':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/80',
        pill: 'bg-white/15 backdrop-blur border border-white/15',
        moreBtn: 'hover:bg-white/10',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/90',
        bodyMuted: 'text-white/75',
        glow: false,
        style: {
          background:
            'linear-gradient(180deg, #0b0f19 0%, #111827 100%)',
        } as React.CSSProperties,
      }
    case 'sunsetOrange':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/90',
        pill: 'bg-white/20 backdrop-blur border border-white/20',
        moreBtn: 'hover:bg-white/20',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/95',
        bodyMuted: 'text-white/85',
        glow: true,
        style: {
          background:
            'radial-gradient(120px 120px at 40px 40px, rgba(255,255,255,0.12), transparent 60%), linear-gradient(135deg, #f97316 0%, #0f172a 70%)',
        } as React.CSSProperties,
      }
    case 'crimsonGlow':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/90',
        pill: 'bg-white/20 backdrop-blur border border-white/20',
        moreBtn: 'hover:bg-white/20',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/95',
        bodyMuted: 'text-white/85',
        glow: true,
        style: {
          background:
            'radial-gradient(120px 120px at 40px 40px, rgba(255,255,255,0.12), transparent 60%), linear-gradient(135deg, #ef4444 0%, #b91c1c 70%)',
        } as React.CSSProperties,
      }
    case 'roseDawn':
      return {
        wrapperWidth: 'w-full',
        height: 'h-[300px]',
        radius: 'rounded-2xl',
        padding: 'p-5',
        text: 'text-white',
        shadow: 'shadow-xl',
        border: 'border-transparent',
        headerText: 'text-white/90',
        pill: 'bg-white/20 backdrop-blur border border-white/20',
        moreBtn: 'hover:bg-white/20',
        headline: 'text-5xl font-extrabold tracking-tight',
        bodyStrong: 'text-white/95',
        bodyMuted: 'text-white/85',
        glow: true,
        style: {
          background:
            'radial-gradient(120px 120px at 40px 40px, rgba(255,255,255,0.12), transparent 60%), linear-gradient(135deg, #f43f5e 0%, #fb7185 70%)',
        } as React.CSSProperties,
      }
  }
}
