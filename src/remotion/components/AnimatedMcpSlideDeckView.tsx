import { interpolate, useCurrentFrame } from 'remotion'

import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

type SlidePreview = {
  title: string
  eyebrow: string
  bullets: string[]
  value: string
}

export type SlideDeckPreviewData = {
  title: string
  subtitle: string
  slides: SlidePreview[]
}

export function AnimatedMcpSlideDeckView({ data, startFrame = 0 }: { data: SlideDeckPreviewData; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const activeSlide = Math.min(data.slides.length - 1, Math.floor(localFrame / 42))
  const progress = interpolate(localFrame, [0, 120], [0.22, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <section style={{ display: 'grid', gap: 12 }}>
        <header style={{ display: 'grid', gap: 4 }}>
          <span style={{ color: '#5f6963', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
            Apresentacao
          </span>
          <h1 style={{ color: '#0f1512', fontSize: 24, lineHeight: 1.08, margin: 0 }}>{data.title}</h1>
          <p style={{ color: '#5f6963', fontSize: 13, lineHeight: 1.35, margin: 0 }}>{data.subtitle}</p>
        </header>

        <div style={{ display: 'grid', gap: 10 }}>
          {data.slides.map((slide, index) => {
            const active = index === activeSlide
            return (
              <article
                key={slide.title}
                style={{
                  background: active ? '#225f42' : '#ffffff',
                  border: `1px solid ${active ? '#225f42' : '#e1e7e2'}`,
                  borderRadius: 8,
                  boxShadow: active ? '0 18px 32px rgba(34, 95, 66, 0.18)' : '0 10px 22px rgba(20, 24, 22, 0.08)',
                  color: active ? '#ffffff' : '#141816',
                  display: 'grid',
                  gap: 12,
                  minHeight: 150,
                  opacity: active ? 1 : 0.82,
                  padding: 16,
                  transform: active ? 'scale(1)' : 'scale(0.985)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: active ? 'rgba(255,255,255,0.72)' : '#5f6963', fontSize: 11, fontWeight: 800 }}>
                    {slide.eyebrow}
                  </span>
                  <strong style={{ fontSize: 19 }}>{slide.value}</strong>
                </div>
                <h2 style={{ fontSize: 21, lineHeight: 1.12, margin: 0 }}>{slide.title}</h2>
                <ul style={{ display: 'grid', gap: 5, margin: 0, paddingLeft: 18 }}>
                  {slide.bullets.map((bullet) => (
                    <li key={bullet} style={{ color: active ? 'rgba(255,255,255,0.84)' : '#52605a', fontSize: 12, lineHeight: 1.35 }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
                {active ? (
                  <span style={{ background: 'rgba(255,255,255,0.24)', borderRadius: 999, display: 'block', height: 5, overflow: 'hidden' }}>
                    <span style={{ background: '#ffffff', display: 'block', height: '100%', width: `${Math.round(progress * 100)}%` }} />
                  </span>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </McpMobileResultFrame>
  )
}
