import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { ReceiptText } from 'lucide-react'

export const MCP_SINGLE_ANIMATION_DURATION = 1080
export const MCP_OPERATIONS_DEMO_DURATION = MCP_SINGLE_ANIMATION_DURATION

const FONT_STACK = 'Geist, "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif'

type ClassificationDocumentItem = {
  vendor: string
  amount: string
  category: string
  confidence: string
  accent: string
  center: string
  date: string
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

function PremiumSceneShell({ children, status, footer }: { children: ReactNode; status: string; footer: string }) {
  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 46%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 60 }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
          <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          {status}
        </div>
      </header>
      {children}
      <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 55 }}>
        {footer}
      </div>
    </AbsoluteFill>
  )
}

function FloatingMiniCard({ index, kind = 'page' }: { index: number; kind?: 'page' | 'dashboard' | 'slide' }) {
  const frame = useCurrentFrame()
  const driftY = Math.sin((frame + index * 41) / 70) * 16
  const driftX = Math.cos((frame + index * 31) / 84) * 18
  const top = [150, 270, 420, 620, 770, 930, 1060, 1160][index % 8]
  const left = [80, 820, 160, 760, 38, 900, 250, 690][index % 8]
  const rotation = [-13, 10, -8, 15, 7, -12, 11, -6][index % 8]

  return (
    <div
      style={{
        background: kind === 'slide' ? (index % 2 === 0 ? 'rgba(34, 95, 66, 0.22)' : 'rgba(255, 255, 255, 0.48)') : 'rgba(255, 255, 255, 0.46)',
        border: '1px solid rgba(211, 224, 216, 0.72)',
        borderRadius: kind === 'dashboard' ? 18 : 16,
        boxShadow: '0 20px 48px rgba(20, 24, 22, 0.06)',
        display: 'grid',
        gap: 9,
        height: kind === 'slide' ? 150 : 190,
        left,
        opacity: 0.22,
        padding: 15,
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) perspective(700px) rotate(${rotation}deg) rotateY(${rotation * 1.8}deg) scale(0.62)`,
        width: kind === 'dashboard' ? 270 : kind === 'slide' ? 260 : 150,
      }}
    >
      <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 9, width: '48%' }} />
      <span style={{ background: '#d8e3dc', borderRadius: 999, display: 'block', height: 8, width: '82%' }} />
      <span style={{ background: '#d8e3dc', borderRadius: 999, display: 'block', height: 8, width: '66%' }} />
      {kind === 'dashboard' ? (
        <div style={{ alignItems: 'end', display: 'flex', gap: 5, height: 80, marginTop: 8 }}>
          {[36, 58, 44, 72, 52].map((height, bar) => (
            <span key={`${height}-${bar}`} style={{ background: bar === index % 5 ? '#225f42' : '#b8cbbf', borderRadius: 4, flex: 1, height }} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PremiumDashboardCard({ index, title }: { index: number; title: string }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 120 + index * 44, 190 + index * 44)
  const active = (Math.floor(frame / 160) + index) % 4 === 0
  const x = [-330, -110, 110, 330][index]
  const y = [56, -46, 40, -28][index]

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${active ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 26,
        boxShadow: active ? '0 42px 95px rgba(34, 95, 66, 0.20)' : '0 26px 72px rgba(20, 24, 22, 0.12)',
        display: 'grid',
        gap: 15,
        height: 370,
        left: '50%',
        opacity: p,
        padding: 20,
        position: 'absolute',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${[-4, 3, -2, 4][index]}deg) scale(${active ? 1.08 : 0.9})`,
        width: 430,
        zIndex: active ? 35 : 22 - index,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: '#0f1512', fontSize: 27, letterSpacing: 0 }}>{title}</strong>
        <span style={{ background: active ? '#225f42' : '#d8e3dc', borderRadius: 999, display: 'block', height: 28, width: 62 }} />
      </div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[0, 1, 2].map((item) => (
          <span key={item} style={{ background: '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 12, height: 58 }} />
        ))}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 8, height: 148 }}>
        {[54, 88, 63, 118, 94, 136, 76].map((height, bar) => (
          <span key={`${height}-${bar}`} style={{ background: bar === index + 2 ? '#225f42' : '#9bb5a4', borderRadius: 6, flex: 1, height }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <span style={{ background: '#d8e3dc', borderRadius: 999, display: 'block', height: 9, width: '86%' }} />
        <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 9, width: '62%' }} />
      </div>
    </div>
  )
}

function DashboardStudioScene() {
  return (
    <PremiumSceneShell footer="Dashboards financeiros prontos para publicacao" status="BI workspace renderizando">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <FloatingMiniCard index={item} key={item} kind="dashboard" />
      ))}
      <div style={{ height: 720, left: '50%', position: 'absolute', top: '54%', transform: 'translate(-50%, -50%)', width: 980, zIndex: 20 }}>
        {['Financeiro Executivo', 'Caixa e Conciliação', 'Despesas por Centro', 'Fechamento Mensal'].map((title, index) => (
          <PremiumDashboardCard index={index} key={title} title={title} />
        ))}
      </div>
    </PremiumSceneShell>
  )
}

function ReconciliationRow({ index, side }: { index: number; side: 'bank' | 'erp' }) {
  const frame = useCurrentFrame()
  const active = (Math.floor(frame / 120) % 4) === index
  const y = 208 + index * 136
  const x = side === 'bank' ? 170 : 764
  const labels = side === 'bank' ? ['PIX Cliente Norte', 'Cartao Stone', 'Frete Sul', 'Tarifa pacote'] : ['NF-9031', 'Lote-552', 'CTR-210', 'Regra pendente']
  const values = side === 'bank' ? ['R$ 42.100', 'R$ 68.900', 'R$ 8.420', 'R$ 189'] : ['R$ 42.100', 'R$ 68.900', 'R$ 8.180', 'Sem titulo']

  return (
    <div
      style={{
        background: active ? '#ffffff' : 'rgba(255,255,255,0.70)',
        border: `1px solid ${active ? (index === 2 ? '#c28f2c' : '#225f42') : '#dfe7e1'}`,
        borderRadius: 22,
        boxShadow: active ? '0 26px 70px rgba(20, 24, 22, 0.16)' : '0 18px 44px rgba(20, 24, 22, 0.07)',
        display: 'grid',
        gap: 10,
        left: x,
        padding: 22,
        position: 'absolute',
        top: y,
        transform: `scale(${active ? 1.04 : 0.94})`,
        width: 360,
        zIndex: active ? 30 : 18,
      }}
    >
      <span style={{ color: '#65716a', fontSize: 19, fontWeight: 820, textTransform: 'uppercase' }}>{side === 'bank' ? 'Banco' : 'ERP'}</span>
      <strong style={{ color: '#0f1512', fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{labels[index]}</strong>
      <span style={{ color: index === 2 && side === 'erp' ? '#c28f2c' : '#225f42', fontSize: 25, fontWeight: 850 }}>{values[index]}</span>
    </div>
  )
}

function BankReconciliationScene() {
  const frame = useCurrentFrame()
  const active = Math.floor(frame / 120) % 4

  return (
    <PremiumSceneShell footer="Extrato e ERP pareados em tempo real" status="Conciliação automática">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <FloatingMiniCard index={item} key={item} />
      ))}
      <div style={{ background: 'linear-gradient(180deg, rgba(34,95,66,0), rgba(34,95,66,0.20), rgba(34,95,66,0))', bottom: 155, left: '50%', position: 'absolute', top: 160, transform: 'translateX(-50%)', width: 3, zIndex: 12 }} />
      {[0, 1, 2, 3].map((item) => (
        <div key={item}>
          <ReconciliationRow index={item} side="bank" />
          <ReconciliationRow index={item} side="erp" />
          <div
            style={{
              background: active === item ? (item === 2 ? '#c28f2c' : '#225f42') : '#cbd9cf',
              borderRadius: 999,
              boxShadow: active === item ? '0 0 34px rgba(34, 95, 66, 0.32)' : 'none',
              height: active === item ? 8 : 4,
              left: 535,
              opacity: active === item ? 1 : 0.42,
              position: 'absolute',
              top: 275 + item * 136,
              width: 230,
              zIndex: 24,
            }}
          />
        </div>
      ))}
      <div style={{ background: active === 2 ? '#fff8e6' : '#ffffff', border: `1px solid ${active === 2 ? '#e6c36f' : '#dfe7e1'}`, borderRadius: 999, bottom: 142, boxShadow: '0 24px 62px rgba(20, 24, 22, 0.12)', color: active === 2 ? '#8a6500' : '#225f42', fontSize: 27, fontWeight: 850, left: '50%', padding: '18px 26px', position: 'absolute', transform: 'translateX(-50%)', zIndex: 40 }}>
        {active === 2 ? 'Divergência detectada' : 'Match confirmado'}
      </div>
    </PremiumSceneShell>
  )
}

function DocumentArtifact({ index, kind, title }: { index: number; kind: 'report' | 'contract' | 'entry'; title: string }) {
  const frame = useCurrentFrame()
  const active = (Math.floor(frame / 150) + index) % 4 === 0
  const x = [-270, -88, 92, 270][index]
  const y = [40, -64, 34, -42][index]
  const accent = kind === 'contract' ? '#8b6f3f' : kind === 'entry' ? '#3f6d91' : '#225f42'

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${active ? accent : '#dfe7e1'}`,
        borderRadius: kind === 'contract' ? '34px 24px 38px 26px' : 26,
        boxShadow: active ? '0 42px 98px rgba(20, 24, 22, 0.20)' : '0 22px 62px rgba(20, 24, 22, 0.10)',
        clipPath: kind === 'contract' ? 'polygon(4% 0, 100% 2%, 96% 100%, 0 97%)' : undefined,
        display: 'grid',
        gap: 17,
        height: 560,
        left: '50%',
        padding: 28,
        position: 'absolute',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) perspective(900px) rotate(${[-6, 3, -2, 6][index]}deg) rotateY(${active ? 0 : [-16, 10, -9, 14][index]}deg) scale(${active ? 1.05 : 0.82})`,
        width: 410,
        zIndex: active ? 34 : 18 - index,
      }}
    >
      <span style={{ background: accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <span style={{ color: '#65716a', fontSize: 20, fontWeight: 820, textTransform: 'uppercase' }}>{kind === 'entry' ? 'Lançamento' : kind === 'contract' ? 'Contrato' : 'Relatório'}</span>
      <strong style={{ color: '#0f1512', fontSize: 34, letterSpacing: 0, lineHeight: 1.05 }}>{title}</strong>
      <div style={{ display: 'grid', gap: 9 }}>
        {[88, 76, 94, 63, 82, 70].map((width, line) => (
          <span key={`${width}-${line}`} style={{ background: line === index ? accent : '#dce6df', borderRadius: 999, display: 'block', height: line === index ? 13 : 9, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginTop: 'auto' }}>
        <span style={{ background: '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 14, height: 70 }} />
        <span style={{ background: active ? accent : '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 14, height: 70 }} />
      </div>
    </div>
  )
}

function ArtifactDocumentScene({ kind, status, footer, titles }: { kind: 'report' | 'contract' | 'entry'; status: string; footer: string; titles: string[] }) {
  return (
    <PremiumSceneShell footer={footer} status={status}>
      {[0, 1, 2, 3, 4, 5, 6].map((item) => (
        <FloatingMiniCard index={item} key={item} />
      ))}
      <div style={{ height: 780, left: '50%', position: 'absolute', top: '54%', transform: 'translate(-50%, -50%)', width: 920, zIndex: 20 }}>
        {titles.map((title, index) => (
          <DocumentArtifact index={index} key={title} kind={kind} title={title} />
        ))}
      </div>
    </PremiumSceneShell>
  )
}

function SlideArtifact({ index, title }: { index: number; title: string }) {
  const frame = useCurrentFrame()
  const active = (Math.floor(frame / 140) + index) % 4 === 0
  const x = [-300, -100, 110, 310][index]
  const y = [42, -72, 36, -34][index]
  const dark = index % 2 === 0

  return (
    <div
      style={{
        background: dark ? '#225f42' : '#ffffff',
        border: `1px solid ${dark ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 28,
        boxShadow: active ? '0 42px 98px rgba(20, 24, 22, 0.22)' : '0 22px 62px rgba(20, 24, 22, 0.10)',
        color: dark ? '#ffffff' : '#0f1512',
        display: 'grid',
        gap: 18,
        height: 385,
        left: '50%',
        padding: 30,
        position: 'absolute',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) perspective(900px) rotate(${[-5, 3, -2, 5][index]}deg) rotateY(${active ? 0 : [-18, 12, -10, 16][index]}deg) scale(${active ? 1.13 : 0.86})`,
        width: 600,
        zIndex: active ? 36 : 18 - index,
      }}
    >
      <span style={{ background: dark ? 'rgba(255,255,255,0.62)' : '#225f42', borderRadius: 999, display: 'block', height: 12, width: 104 }} />
      <strong style={{ fontSize: 46, letterSpacing: 0, lineHeight: 1.04 }}>{title}</strong>
      <div style={{ display: 'grid', gap: 11 }}>
        {[78, 62, 86].map((width, line) => (
          <span key={`${width}-${line}`} style={{ background: dark ? 'rgba(255,255,255,0.27)' : '#dce6df', borderRadius: 999, display: 'block', height: 10, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 'auto' }}>
        <span style={{ background: dark ? 'rgba(255,255,255,0.16)' : '#f3f7f4', border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 16, height: 80 }} />
        <span style={{ background: dark ? 'rgba(255,255,255,0.16)' : '#f3f7f4', border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 16, height: 80 }} />
      </div>
    </div>
  )
}

function SlideDeckScene() {
  return (
    <PremiumSceneShell footer="Deck executivo montado com narrativa de fechamento" status="Slides gerando">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <FloatingMiniCard index={item} key={item} kind="slide" />
      ))}
      <div style={{ height: 650, left: '50%', position: 'absolute', top: '54%', transform: 'translate(-50%, -50%)', width: 1080, zIndex: 20 }}>
        {['Fechamento Maio', 'Indicadores', 'Riscos', 'Plano de ação'].map((title, index) => (
          <SlideArtifact index={index} key={title} title={title} />
        ))}
      </div>
    </PremiumSceneShell>
  )
}

export function ExpenseClassificationAnimation() {
  return <ExpenseClassificationPipeline />
}

export function BankReconciliationAnimation() {
  return <BankReconciliationScene />
}

export function DashboardsAnimation() {
  return <DashboardStudioScene />
}

export function ManagementReportAnimation() {
  return (
    <ArtifactDocumentScene
      footer="Relatorio Word gerado em paginas executivas"
      kind="report"
      status="Relatorio gerencial escrevendo"
      titles={['Resumo executivo', 'Variacoes do mes', 'Plano de acao', 'Anexo financeiro']}
    />
  )
}

export function ClosingSlidesAnimation() {
  return <SlideDeckScene />
}

export function ContractManagementAnimation() {
  return (
    <ArtifactDocumentScene
      footer="Contratos monitorados por risco, vencimento e reajuste"
      kind="contract"
      status="Gestao contratual ativa"
      titles={['Frete Sul', 'ERP Omie', 'Cloud AWS', 'Software BI']}
    />
  )
}

export function AccountingEntryAnimation() {
  return (
    <ArtifactDocumentScene
      footer="Lancamento preparado, validado e enviado ao ERP"
      kind="entry"
      status="ERP actions executando"
      titles={['Preview contabil', 'Validacao fiscal', 'Registro no ERP', 'Comprovante']}
    />
  )
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}
