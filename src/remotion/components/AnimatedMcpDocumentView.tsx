import type { CSSProperties } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

type DocumentMetric = {
  label: string
  value: string
}

type DocumentSection = {
  title: string
  body: string
}

export type DocumentPreviewData = {
  title: string
  subtitle: string
  metrics: DocumentMetric[]
  sections: DocumentSection[]
}

const pageStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e1e7e2',
  borderRadius: 8,
  boxShadow: '0 16px 34px rgba(20, 24, 22, 0.10)',
  color: '#141816',
  display: 'grid',
  gap: 14,
  padding: 18,
}

export function AnimatedMcpDocumentView({ data, startFrame = 0 }: { data: DocumentPreviewData; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const highlight = interpolate(localFrame, [20, 54], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <section style={{ display: 'grid', gap: 12 }}>
        <header style={{ display: 'grid', gap: 4 }}>
          <span style={{ color: '#5f6963', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
            Documento Word
          </span>
          <h1 style={{ color: '#0f1512', fontSize: 24, lineHeight: 1.08, margin: 0 }}>{data.title}</h1>
          <p style={{ color: '#5f6963', fontSize: 13, lineHeight: 1.35, margin: 0 }}>{data.subtitle}</p>
        </header>

        <article style={pageStyle}>
          <div style={{ borderBottom: '1px solid #e5ebe6', display: 'grid', gap: 5, paddingBottom: 12 }}>
            <span style={{ color: '#225f42', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              Relatorio gerencial
            </span>
            <h2 style={{ fontSize: 21, lineHeight: 1.1, margin: 0 }}>Resumo executivo</h2>
            <p style={{ color: '#52605a', fontSize: 13, lineHeight: 1.45, margin: 0 }}>
              Documento montado com dados financeiros, operacionais e comerciais consolidados.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            {data.metrics.map((metric, index) => (
              <div
                key={metric.label}
                style={{
                  background: index === 0 ? `rgba(34, 95, 66, ${0.08 + highlight * 0.08})` : '#f7faf7',
                  border: '1px solid #e1e7e2',
                  borderRadius: 8,
                  padding: '10px 11px',
                }}
              >
                <span style={{ color: '#5f6963', display: 'block', fontSize: 11 }}>{metric.label}</span>
                <strong style={{ color: '#0f1512', display: 'block', fontSize: 17, marginTop: 3 }}>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {data.sections.map((section) => (
              <section key={section.title} style={{ display: 'grid', gap: 4 }}>
                <h3 style={{ color: '#18211d', fontSize: 15, margin: 0 }}>{section.title}</h3>
                <p style={{ color: '#52605a', fontSize: 12, lineHeight: 1.45, margin: 0 }}>{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </McpMobileResultFrame>
  )
}
