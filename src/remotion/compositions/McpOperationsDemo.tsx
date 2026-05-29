import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { CheckCircle2, FileText, LayoutDashboard, PenLine, Presentation, ReceiptText, RefreshCcw, ShieldCheck } from 'lucide-react'

export const MCP_SINGLE_ANIMATION_DURATION = 1080
export const MCP_OPERATIONS_DEMO_DURATION = MCP_SINGLE_ANIMATION_DURATION

const FONT_STACK = 'Geist, "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif'

type Metric = {
  label: string
  value: string
}

type ArtifactKind = 'reconciliation' | 'dashboard' | 'report' | 'slide' | 'contract' | 'entry'

type ArtifactItem = {
  title: string
  eyebrow: string
  metric: string
}

type ClassificationDocumentItem = {
  vendor: string
  amount: string
  category: string
  confidence: string
  accent: string
  center: string
  date: string
}

type ProductAnimationShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  icon: ReactNode
  metrics: Metric[]
  children: ReactNode
  footer: string
}

const classificationPipelineDocs: ClassificationDocumentItem[] = [
  {
    vendor: 'Google Ads BR',
    amount: 'R$ 18.400',
    category: 'Marketing',
    confidence: '96%',
    accent: '#225f42',
    center: 'Growth',
    date: '24 mai',
  },
  {
    vendor: 'Prime Fornecedores',
    amount: 'R$ 31.280',
    category: 'Fornecedores',
    confidence: '94%',
    accent: '#3f6d91',
    center: 'Operacoes',
    date: '25 mai',
  },
  {
    vendor: 'AWS Brasil',
    amount: 'R$ 12.790',
    category: 'Infraestrutura',
    confidence: '97%',
    accent: '#6f8f7b',
    center: 'Tecnologia',
    date: '26 mai',
  },
  {
    vendor: 'Frete Sul',
    amount: 'R$ 8.420',
    category: 'Logistica',
    confidence: '91%',
    accent: '#c28f2c',
    center: 'Fulfillment',
    date: '27 mai',
  },
  {
    vendor: 'Hotel Evento SP',
    amount: 'R$ 6.900',
    category: 'Viagens',
    confidence: '88%',
    accent: '#8b6f9d',
    center: 'Comercial',
    date: '28 mai',
  },
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function appear(frame: number, start: number, distance = 28) {
  const p = progress(frame, start, start + 28)
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
  }
}

function CognitoBrand() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 15 }}>
      <span style={{ display: 'grid', gap: 5, gridTemplateColumns: 'repeat(2, 18px)' }}>
        <span style={{ background: '#225f42', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
        <span style={{ background: '#8aa895', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
        <span style={{ background: '#c9d8ce', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
        <span style={{ background: '#225f42', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
      </span>
      <div style={{ display: 'grid', gap: 2 }}>
        <strong style={{ color: '#0f1512', fontSize: 39, letterSpacing: 0, lineHeight: 1 }}>Cognito</strong>
        <span style={{ color: '#65716a', fontSize: 19, fontWeight: 700, letterSpacing: 0 }}>Operations OS</span>
      </div>
    </div>
  )
}

function MetricTile({ metric, active = false }: { metric: Metric; active?: boolean }) {
  return (
    <div
      style={{
        background: active ? '#225f42' : '#f7faf7',
        border: `1px solid ${active ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 16,
        color: active ? '#ffffff' : '#17201b',
        display: 'grid',
        gap: 6,
        minHeight: 92,
        padding: '15px 17px',
      }}
    >
      <span style={{ color: active ? 'rgba(255,255,255,0.72)' : '#65716a', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        {metric.label}
      </span>
      <strong style={{ fontSize: 30, letterSpacing: 0, lineHeight: 1 }}>{metric.value}</strong>
    </div>
  )
}

function FinalBadge({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 850, 910)

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #dbe5dd',
        borderRadius: 999,
        bottom: 48,
        boxShadow: '0 16px 34px rgba(20, 24, 22, 0.10)',
        color: '#225f42',
        display: 'flex',
        fontSize: 25,
        fontWeight: 800,
        gap: 10,
        left: 52,
        opacity: p,
        padding: '16px 22px',
        position: 'absolute',
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      <CheckCircle2 size={28} strokeWidth={2.5} />
      {text}
    </div>
  )
}

function ProductAnimationShell({ eyebrow, title, subtitle, icon, metrics, children, footer }: ProductAnimationShellProps) {
  const frame = useCurrentFrame()
  const headerStyle = appear(frame, 8)
  const heroStyle = appear(frame, 44)
  const resultStyle = appear(frame, 210, 34)

  return (
    <AbsoluteFill
      style={{
        background: '#f6f8f5',
        color: '#0f1512',
        fontFamily: FONT_STACK,
        overflow: 'hidden',
      }}
    >
      <header style={{ alignItems: 'center', display: 'flex', height: 128, justifyContent: 'space-between', padding: '36px 52px 0', ...headerStyle }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 18, color: '#314139', display: 'flex', fontSize: 22, fontWeight: 800, gap: 10, height: 58, justifyContent: 'center', padding: '0 18px' }}>
          <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          Live
        </div>
      </header>

      <main style={{ display: 'grid', gap: 24, padding: '88px 52px 0' }}>
        <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 22px 52px rgba(20, 24, 22, 0.10)', display: 'grid', gap: 22, padding: '30px 32px', ...heroStyle }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
            <span style={{ alignItems: 'center', background: '#225f42', borderRadius: 24, color: '#ffffff', display: 'flex', flex: '0 0 auto', height: 80, justifyContent: 'center', width: 80 }}>
              {icon}
            </span>
            <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
              <span style={{ color: '#65716a', fontSize: 22, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase' }}>
                {eyebrow}
              </span>
              <h1 style={{ color: '#0f1512', fontSize: 55, fontWeight: 780, letterSpacing: 0, lineHeight: 1.02, margin: 0 }}>
                {title}
              </h1>
            </div>
          </div>

          <p style={{ color: '#3d4a43', fontSize: 30, lineHeight: 1.3, margin: 0 }}>{subtitle}</p>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {metrics.map((metric, index) => (
              <MetricTile active={index === 0} key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <section style={{ background: '#ffffff', border: '1px solid #dde6df', borderRadius: 24, boxShadow: '0 24px 55px rgba(20, 24, 22, 0.12)', overflow: 'hidden', ...resultStyle }}>
          {children}
        </section>
      </main>

      <div style={{ bottom: 62, color: '#65716a', fontSize: 24, fontWeight: 700, position: 'absolute', right: 52 }}>
        {footer}
      </div>
      <FinalBadge text="Entrega pronta" />
    </AbsoluteFill>
  )
}

function PipelineDocument({ doc, index, muted = false }: { doc: ClassificationDocumentItem; index: number; muted?: boolean }) {
  return (
    <div
      style={{
        background: muted ? 'rgba(255, 255, 255, 0.62)' : '#ffffff',
        border: '1px solid rgba(211, 224, 216, 0.96)',
        borderRadius: muted ? '38px 28px 44px 30px' : 26,
        boxShadow: muted ? '0 16px 42px rgba(20, 24, 22, 0.07)' : '0 38px 92px rgba(20, 24, 22, 0.22)',
        clipPath: muted ? 'polygon(7% 0, 100% 4%, 93% 100%, 0 96%)' : undefined,
        display: 'grid',
        gap: muted ? 16 : 22,
        height: muted ? 520 : 780,
        overflow: 'hidden',
        padding: muted ? 24 : 34,
        position: 'relative',
        width: muted ? 390 : 610,
      }}
    >
      <span style={{ background: doc.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={{ color: '#77837b', fontSize: 19, fontWeight: 760, letterSpacing: 0, textTransform: 'uppercase' }}>Documento financeiro</span>
          <strong style={{ color: '#101713', fontSize: 33, letterSpacing: 0, lineHeight: 1 }}>{doc.vendor}</strong>
        </div>
        <span style={{ alignItems: 'center', background: '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 16, color: '#45524a', display: 'flex', fontSize: 20, fontWeight: 800, height: 56, justifyContent: 'center', width: 84 }}>
          {doc.date}
        </span>
      </div>

      <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, padding: 18 }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#65716a', fontSize: 21, fontWeight: 760 }}>Valor</span>
          <strong style={{ color: '#0f1512', fontSize: 34, letterSpacing: 0 }}>{doc.amount}</strong>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#65716a', fontSize: 21, fontWeight: 760 }}>Centro</span>
          <strong style={{ color: '#314139', fontSize: 24, letterSpacing: 0 }}>{doc.center}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {[88, 76, 94, 62, 82].map((width, lineIndex) => (
          <span
            key={`${width}-${lineIndex}`}
            style={{
              background: lineIndex === index % 5 ? doc.accent : '#dce6df',
              borderRadius: 999,
              display: 'block',
              height: lineIndex === index % 5 ? 13 : 10,
              opacity: lineIndex === index % 5 ? 0.95 : 0.78,
              width: `${width}%`,
            }}
          />
        ))}
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: 10, marginTop: 'auto' }}>
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            style={{
              background: item === index % 3 ? doc.accent : '#eef4ef',
              border: '1px solid #dfe7e1',
              borderRadius: 999,
              display: 'block',
              height: 38,
              width: item === index % 3 ? 112 : 50,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FloatingFinancialSheet({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const doc = classificationPipelineDocs[index % classificationPipelineDocs.length]
  const driftY = Math.sin((frame + index * 37) / 64) * 18
  const driftX = Math.cos((frame + index * 29) / 72) * 14
  const top = [130, 220, 360, 540, 690, 830, 1010, 1180][index % 8]
  const left = [64, 790, 142, 730, 34, 850, 210, 690][index % 8]
  const rotation = [-14, 9, -7, 15, 6, -11, 12, -5][index % 8]
  const bend = [-32, 28, -24, 34, 22, -30, 32, -20][index % 8]
  const tilt = [13, -16, 18, -12, 15, -14, 17, -11][index % 8]

  return (
    <div
      style={{
        filter: 'blur(2.1px)',
        left,
        opacity: 0.2,
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) perspective(620px) rotate(${rotation}deg) rotateY(${bend}deg) rotateX(${tilt}deg) skewY(${bend / 6}deg) scale(0.20)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <PipelineDocument doc={doc} index={index} muted />
    </div>
  )
}

function CategoryTag({ doc, opacity }: { doc: ClassificationDocumentItem; opacity: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `1px solid ${doc.accent}`,
        borderRadius: 999,
        boxShadow: '0 20px 48px rgba(20, 24, 22, 0.14)',
        color: '#0f1512',
        display: 'flex',
        gap: 12,
        left: '50%',
        opacity,
        padding: '16px 21px 16px 17px',
        position: 'absolute',
        top: '50%',
        transform: `translate(190px, -94px) scale(${0.94 + opacity * 0.06})`,
        zIndex: 30,
      }}
    >
      <span style={{ background: doc.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
      <span style={{ color: '#65716a', fontSize: 20, fontWeight: 780 }}>Categoria</span>
      <strong style={{ color: doc.accent, fontSize: 28, letterSpacing: 0 }}>{doc.category}</strong>
      <span style={{ background: '#f2f6f3', borderRadius: 999, color: '#516057', fontSize: 20, fontWeight: 800, padding: '7px 10px' }}>
        {doc.confidence}
      </span>
    </div>
  )
}

function ExpenseClassificationPipeline() {
  const frame = useCurrentFrame()
  const cycle = 138
  const activeIndex = Math.floor(frame / cycle) % classificationPipelineDocs.length
  const local = (frame % cycle) / cycle
  const scan = progress(frame % cycle, 34, 78)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at center, rgba(34, 95, 66, 0.18), rgba(246, 248, 245, 0) 54%)', bottom: -160, left: -120, position: 'absolute', right: -120, top: -160 }} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((sheet) => (
        <FloatingFinancialSheet index={sheet} key={sheet} />
      ))}

      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 40 }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
          <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          IA financeira processando
        </div>
      </header>

      <section style={{ display: 'grid', gap: 12, position: 'absolute', right: 58, top: 226, width: 246, zIndex: 25 }}>
        {[
          ['Docs/min', '184'],
          ['Automacao', '98%'],
          ['Revisao', '12 itens'],
        ].map(([label, value], index) => (
          <div
            key={label}
            style={{
              background: index === 0 ? '#225f42' : 'rgba(255,255,255,0.90)',
              border: `1px solid ${index === 0 ? '#225f42' : '#dfe7e1'}`,
              borderRadius: 20,
              boxShadow: '0 18px 42px rgba(20, 24, 22, 0.09)',
              color: index === 0 ? '#ffffff' : '#0f1512',
              display: 'grid',
              gap: 7,
              padding: '18px 20px',
            }}
          >
            <span style={{ color: index === 0 ? 'rgba(255,255,255,0.76)' : '#65716a', fontSize: 19, fontWeight: 780 }}>{label}</span>
            <strong style={{ fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{value}</strong>
          </div>
        ))}
      </section>

      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 780, zIndex: 20 }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(34,95,66,0), rgba(34,95,66,0.18), rgba(34,95,66,0))', bottom: 0, left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 2 }} />
        <div style={{ background: '#225f42', borderRadius: 999, boxShadow: '0 0 34px rgba(34, 95, 66, 0.36)', height: 5, left: 66, opacity: 0.78, position: 'absolute', right: 66, top: 486, transform: `translateY(${scan * 86}px)` }} />

        {[-2, -1, 0, 1, 2].map((slot) => {
          const unit = local + slot * 0.39
          if (unit < -0.06 || unit > 1.08) return null

          const docIndex = (activeIndex + slot + classificationPipelineDocs.length) % classificationPipelineDocs.length
          const doc = classificationPipelineDocs[docIndex]
          const centerScore = 1 - Math.min(Math.abs(unit - 0.5) / 0.5, 1)
          const y = interpolate(unit, [0, 0.28, 0.5, 0.74, 1], [-840, -405, 0, 430, 850], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const scale = 0.7 + centerScore * 0.34
          const opacity = 0.28 + centerScore * 0.72
          const rotation = (docIndex % 2 === 0 ? -1 : 1) * (1.8 - centerScore * 1.2)
          const tagOpacity = interpolate(unit, [0.36, 0.45, 0.64, 0.73], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={`${slot}-${doc.vendor}`}
              style={{
                filter: centerScore > 0.72 ? 'blur(0)' : 'blur(0.7px)',
                left: '50%',
                opacity,
                position: 'absolute',
                top: '50%',
                transform: `translate(-50%, -50%) translateY(${y}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: Math.round(centerScore * 20) + 10,
              }}
            >
              <PipelineDocument doc={doc} index={docIndex} />
              <CategoryTag doc={doc} opacity={tagOpacity} />
            </div>
          )
        })}
      </div>

      <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 35 }}>
        <ReceiptText size={28} strokeWidth={2.4} />
        Entrada continua de comprovantes, notas e faturas
      </div>
    </AbsoluteFill>
  )
}

function ReconciliationVisual({ index }: { index: number }) {
  const highlight = index === 2 ? '#c28f2c' : '#225f42'

  return (
    <div
      style={{
        background: '#f7faf7',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 42px 1fr' }}>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, display: 'grid', gap: 7, padding: 10 }}>
          {[76, 58, 86].map((width, row) => (
            <span key={`${width}-${row}`} style={{ background: row === index % 3 ? highlight : '#d8e3dc', borderRadius: 999, display: 'block', height: 9, width: `${width}%` }} />
          ))}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: highlight, borderRadius: 999, display: 'block', height: 7, width: 42 }} />
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, display: 'grid', gap: 7, padding: 10 }}>
          {[62, 84, 70].map((width, row) => (
            <span key={`${width}-${row}`} style={{ background: row === index % 3 ? highlight : '#d8e3dc', borderRadius: 999, display: 'block', height: 9, width: `${width}%` }} />
          ))}
        </div>
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        {[0, 1, 2, 3].map((dot) => (
          <span
            key={dot}
            style={{
              background: dot <= index ? highlight : '#d8e3dc',
              borderRadius: 999,
              display: 'block',
              height: 13,
              width: dot <= index ? 44 : 13,
            }}
          />
        ))}
      </div>
      <div style={{ background: index === 2 ? '#fff7e5' : '#edf6f0', border: `1px solid ${index === 2 ? '#ecd8a7' : '#cfe0d4'}`, borderRadius: 10, height: 48 }} />
    </div>
  )
}

function DashboardVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8faf8 0%, #edf4ef 100%)',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 10,
        minHeight: 184,
        padding: 13,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 16, width: 92 }} />
        <span style={{ background: '#c9d8ce', borderRadius: 999, display: 'block', height: 16, width: 42 }} />
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, height: 42 }} />
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, height: 42 }} />
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 6, height: 70 }}>
        {[44, 62, 38, 72, 54, 84].map((height, barIndex) => (
          <span
            key={`${height}-${barIndex}`}
            style={{
              background: barIndex === index % 6 ? '#225f42' : '#9bb5a4',
              borderRadius: 5,
              display: 'block',
              flex: 1,
              height,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        <span style={{ background: '#d7e2da', borderRadius: 999, display: 'block', height: 9, width: '86%' }} />
        <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 9, width: '64%' }} />
      </div>
    </div>
  )
}

function ReportVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 12, width: index === 0 ? 118 : 88 }} />
      <span style={{ background: '#0f1512', borderRadius: 999, display: 'block', height: 15, width: '72%' }} />
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[0, 1, 2].map((item) => (
          <span key={item} style={{ background: '#f0f5f1', border: '1px solid #dfe7e1', borderRadius: 8, height: 36 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {[88, 72, 94, 64].map((width, lineIndex) => (
          <span key={`${width}-${lineIndex}`} style={{ background: '#d9e4dc', borderRadius: 999, display: 'block', height: 8, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 7, height: 42 }}>
        {[18, 29, 24, 38, 31].map((height, barIndex) => (
          <span key={`${height}-${barIndex}`} style={{ background: barIndex === index ? '#225f42' : '#b9cbbf', borderRadius: 4, flex: 1, height }} />
        ))}
      </div>
    </div>
  )
}

function SlideVisual({ index }: { index: number }) {
  const dark = index % 2 === 0

  return (
    <div
      style={{
        background: dark ? '#225f42' : '#f7faf7',
        border: `1px solid ${dark ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 14,
        color: dark ? '#ffffff' : '#0f1512',
        display: 'grid',
        gap: 13,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: dark ? 'rgba(255,255,255,0.75)' : '#225f42', borderRadius: 999, display: 'block', height: 12, width: 82 }} />
        <span style={{ background: dark ? 'rgba(255,255,255,0.28)' : '#c9d8ce', borderRadius: 999, display: 'block', height: 12, width: 38 }} />
      </div>
      <strong style={{ fontSize: 25, lineHeight: 1.06 }}>{index === 0 ? 'Fechamento' : index === 1 ? 'Indicadores' : index === 2 ? 'Riscos' : 'Plano'}</strong>
      <div style={{ display: 'grid', gap: 7 }}>
        {[82, 66, 74].map((width, lineIndex) => (
          <span
            key={`${width}-${lineIndex}`}
            style={{
              background: dark ? 'rgba(255,255,255,0.28)' : '#d8e3dc',
              borderRadius: 999,
              display: 'block',
              height: 8,
              width: `${width}%`,
            }}
          />
        ))}
      </div>
      <div style={{ alignItems: 'center', display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: dark ? 'rgba(255,255,255,0.18)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 10, height: 48 }} />
        <span style={{ background: dark ? 'rgba(255,255,255,0.18)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 10, height: 48 }} />
      </div>
    </div>
  )
}

function ContractVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: '#fffefa',
        border: '1px solid #dedbd4',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 13, width: 76 }} />
        <span style={{ border: '2px solid #c6d4ca', borderRadius: 999, display: 'block', height: 30, width: 30 }} />
      </div>
      <span style={{ background: '#141816', borderRadius: 999, display: 'block', height: 14, width: '70%' }} />
      <div style={{ display: 'grid', gap: 7 }}>
        {[86, 91, 62, 78].map((width, lineIndex) => (
          <span key={`${width}-${lineIndex}`} style={{ background: '#d9d6cf', borderRadius: 999, display: 'block', height: 8, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: index === 1 ? '#fff4d8' : '#eef4ef', border: '1px solid #dfe7e1', borderRadius: 8, height: 34 }} />
        <span style={{ background: '#eef4ef', border: '1px solid #dfe7e1', borderRadius: 8, height: 34 }} />
      </div>
    </div>
  )
}

function EntryVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: '#f8faf8',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 14, width: 92 }} />
        <span style={{ background: index === 3 ? '#225f42' : '#d8e3dc', borderRadius: 999, display: 'block', height: 28, width: 58 }} />
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, display: 'grid', gap: 8, padding: 11 }}>
        {[0, 1, 2].map((item) => (
          <div key={item} style={{ alignItems: 'center', display: 'grid', gap: 9, gridTemplateColumns: '58px 1fr' }}>
            <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 8 }} />
            <span style={{ background: item === index % 3 ? '#225f42' : '#b8cbbf', borderRadius: 999, display: 'block', height: 9 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 8, height: 36 }} />
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 8, height: 36 }} />
      </div>
    </div>
  )
}

function ArtifactVisual({ kind, index }: { kind: ArtifactKind; index: number }) {
  if (kind === 'reconciliation') return <ReconciliationVisual index={index} />
  if (kind === 'report') return <ReportVisual index={index} />
  if (kind === 'slide') return <SlideVisual index={index} />
  if (kind === 'contract') return <ContractVisual index={index} />
  if (kind === 'entry') return <EntryVisual index={index} />
  return <DashboardVisual index={index} />
}

function ArtifactCard({ item, index, kind }: { item: ArtifactItem; index: number; kind: ArtifactKind }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 230 + index * 28, 290 + index * 28)
  const active = frame > 430 + index * 25

  return (
    <article
      style={{
        background: '#ffffff',
        border: `1px solid ${active ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 18,
        boxShadow: active ? '0 22px 38px rgba(34, 95, 66, 0.18)' : '0 16px 34px rgba(20, 24, 22, 0.10)',
        display: 'grid',
        gap: 12,
        opacity: p,
        overflow: 'hidden',
        padding: 14,
        transform: `translateY(${(1 - p) * 28}px) scale(${active ? 1.02 : 1})`,
      }}
    >
      <ArtifactVisual index={index} kind={kind} />
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={{ color: '#65716a', fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>{item.eyebrow}</span>
        <strong style={{ color: '#0f1512', fontSize: 22, lineHeight: 1.1 }}>{item.title}</strong>
        <span style={{ color: '#65716a', fontSize: 18, fontWeight: 700 }}>{item.metric}</span>
      </div>
    </article>
  )
}

function ArtifactGallery({ items, kind }: { items: ArtifactItem[]; kind: ArtifactKind }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', padding: 24 }}>
      {items.map((item, index) => (
        <ArtifactCard item={item} key={item.title} kind={kind} index={index} />
      ))}
    </div>
  )
}

export function ExpenseClassificationAnimation() {
  return <ExpenseClassificationPipeline />
}

export function BankReconciliationAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Bank matching"
      footer="Conciliação bancária"
      icon={<RefreshCcw size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Matches', value: '4' },
        { label: 'Status', value: 'Conciliado' },
        { label: 'Diverg.', value: '1' },
      ]}
      subtitle="Pacote visual de conciliação: extratos, títulos, matches automáticos, pendências e divergências para revisão."
      title="Conciliação bancária"
    >
      <ArtifactGallery
        kind="reconciliation"
        items={[
          { eyebrow: 'Match 01', title: 'PIX Cliente Norte', metric: 'NF-9031 conciliada' },
          { eyebrow: 'Match 02', title: 'Cartão Stone', metric: 'Lote-552 conciliado' },
          { eyebrow: 'Alerta 01', title: 'Pagamento Frete Sul', metric: 'Divergência aberta' },
          { eyebrow: 'Pendente 01', title: 'Tarifa bancária', metric: 'Aguardando regra' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function DashboardsAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="BI workspace"
      footer="Dashboards"
      icon={<LayoutDashboard size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Dashboards', value: '4' },
        { label: 'Status', value: 'Pronto' },
        { label: 'Publicados', value: '2' },
      ]}
      subtitle="Galeria de dashboards operacionais renderizados como imagens. Nesta versão, o mesmo mock visual simula múltiplos dashboards."
      title="Dashboards"
    >
      <ArtifactGallery
        kind="dashboard"
        items={[
          { eyebrow: 'Dashboard 01', title: 'Financeiro Executivo', metric: 'Receita, margem e caixa' },
          { eyebrow: 'Dashboard 02', title: 'Caixa e Conciliação', metric: 'Extrato, ERP e pendências' },
          { eyebrow: 'Dashboard 03', title: 'Despesas por Centro', metric: 'Categorias e responsáveis' },
          { eyebrow: 'Dashboard 04', title: 'Fechamento Mensal', metric: 'DRE, fluxo e variações' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function ManagementReportAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Management report"
      footer="Relatório gerencial Word"
      icon={<FileText size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Formato', value: 'Word' },
        { label: 'Status', value: 'Gerado' },
        { label: 'Revisão', value: '97%' },
      ]}
      subtitle="Pacote de relatórios gerenciais em páginas visuais: capa, KPIs, variações e recomendações para diretoria."
      title="Relatório gerencial"
    >
      <ArtifactGallery
        kind="report"
        items={[
          { eyebrow: 'Página 01', title: 'Resumo executivo', metric: 'Receita e EBITDA' },
          { eyebrow: 'Página 02', title: 'Variações do mês', metric: 'Custos e despesas' },
          { eyebrow: 'Página 03', title: 'Plano de ação', metric: '8 recomendações' },
          { eyebrow: 'Página 04', title: 'Anexo financeiro', metric: 'DRE e caixa' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function ClosingSlidesAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Closing deck"
      footer="Apresentação de fechamento"
      icon={<Presentation size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Slides', value: '3' },
        { label: 'Status', value: 'Criado' },
        { label: 'Ações', value: '8' },
      ]}
      subtitle="Deck de fechamento com vários slides prontos: capa, KPIs, riscos e plano de ação para diretoria."
      title="Apresentação de fechamento"
    >
      <ArtifactGallery
        kind="slide"
        items={[
          { eyebrow: 'Slide 01', title: 'Capa executiva', metric: 'Maio 2026' },
          { eyebrow: 'Slide 02', title: 'Indicadores', metric: '4 KPIs' },
          { eyebrow: 'Slide 03', title: 'Riscos', metric: '3 alertas' },
          { eyebrow: 'Slide 04', title: 'Próximos passos', metric: '8 ações' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function ContractManagementAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Contract ops"
      footer="Gestão de contrato"
      icon={<ShieldCheck size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Contratos', value: '4' },
        { label: 'Status', value: 'Ativo' },
        { label: 'Pausados', value: '1' },
      ]}
      subtitle="Coleção de contratos monitorados como documentos: vencimentos, reajustes, responsáveis e alertas de risco."
      title="Gestão de contrato"
    >
      <ArtifactGallery
        kind="contract"
        items={[
          { eyebrow: 'Contrato 01', title: 'Frete Sul', metric: 'Vence em 18 dias' },
          { eyebrow: 'Contrato 02', title: 'ERP Omie', metric: 'Reajuste anual' },
          { eyebrow: 'Contrato 03', title: 'Cloud AWS', metric: 'Crédito contratado' },
          { eyebrow: 'Contrato 04', title: 'Software BI', metric: 'Renovação pendente' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function AccountingEntryAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="ERP actions"
      footer="Fazer lançamento"
      icon={<PenLine size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Lançamento', value: 'Criado' },
        { label: 'Status', value: 'Pendente' },
        { label: 'Origem', value: 'Banco' },
      ]}
      subtitle="Vários artefatos de lançamento gerados: preview contábil, validação fiscal, registro no ERP e comprovante."
      title="Fazer lançamento"
    >
      <ArtifactGallery
        kind="entry"
        items={[
          { eyebrow: 'Etapa 01', title: 'Preview contábil', metric: 'Débito e crédito' },
          { eyebrow: 'Etapa 02', title: 'Validação fiscal', metric: 'Centro de custo' },
          { eyebrow: 'Etapa 03', title: 'Registro no ERP', metric: 'LAN-0184' },
          { eyebrow: 'Etapa 04', title: 'Comprovante', metric: 'Pendente aprovação' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}
