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

type VerticalPipelineKind = 'reconciliation' | 'dashboard' | 'report' | 'slide' | 'contract' | 'entry'

type VerticalPipelineItem = {
  kind: VerticalPipelineKind
  eyebrow: string
  title: string
  metric: string
  status: string
  accent: string
  secondary: string
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

const reconciliationPipelineItems: VerticalPipelineItem[] = [
  { kind: 'reconciliation', eyebrow: 'Match 01', title: 'PIX Cliente Norte', metric: 'NF-9031', status: 'Match confirmado', accent: '#225f42', secondary: 'R$ 42.100' },
  { kind: 'reconciliation', eyebrow: 'Match 02', title: 'Cartao Stone', metric: 'Lote-552', status: 'Conciliado', accent: '#225f42', secondary: 'R$ 68.900' },
  { kind: 'reconciliation', eyebrow: 'Alerta 01', title: 'Pagamento Frete Sul', metric: 'CTR-210', status: 'Divergencia', accent: '#c28f2c', secondary: 'R$ 8.420' },
  { kind: 'reconciliation', eyebrow: 'Pendente 01', title: 'Tarifa bancaria', metric: 'Regra pendente', status: 'Aguardando regra', accent: '#3f6d91', secondary: 'R$ 189' },
]

const dashboardPipelineItems: VerticalPipelineItem[] = [
  { kind: 'dashboard', eyebrow: 'Dashboard 01', title: 'Financeiro Executivo', metric: 'Receita, margem e caixa', status: 'Publicado', accent: '#225f42', secondary: '+18.4%' },
  { kind: 'dashboard', eyebrow: 'Dashboard 02', title: 'Caixa e Conciliacao', metric: 'Extrato, ERP e pendencias', status: 'Atualizado', accent: '#3f6d91', secondary: '98%' },
  { kind: 'dashboard', eyebrow: 'Dashboard 03', title: 'Despesas por Centro', metric: 'Categorias e responsaveis', status: 'Gerado', accent: '#6f8f7b', secondary: '12 areas' },
  { kind: 'dashboard', eyebrow: 'Dashboard 04', title: 'Fechamento Mensal', metric: 'DRE, fluxo e variacoes', status: 'Pronto', accent: '#c28f2c', secondary: 'Maio' },
]

const reportPipelineItems: VerticalPipelineItem[] = [
  { kind: 'report', eyebrow: 'Pagina 01', title: 'Resumo executivo', metric: 'Receita e EBITDA', status: 'Escrito', accent: '#225f42', secondary: 'Word' },
  { kind: 'report', eyebrow: 'Pagina 02', title: 'Variacoes do mes', metric: 'Custos e despesas', status: 'Revisado', accent: '#3f6d91', secondary: '97%' },
  { kind: 'report', eyebrow: 'Pagina 03', title: 'Plano de acao', metric: '8 recomendacoes', status: 'Aprovado', accent: '#6f8f7b', secondary: '8 acoes' },
  { kind: 'report', eyebrow: 'Pagina 04', title: 'Anexo financeiro', metric: 'DRE e caixa', status: 'Gerado', accent: '#c28f2c', secondary: 'PDF' },
]

const slidePipelineItems: VerticalPipelineItem[] = [
  { kind: 'slide', eyebrow: 'Slide 01', title: 'Fechamento Maio', metric: 'Capa executiva', status: 'Montado', accent: '#225f42', secondary: '16:9' },
  { kind: 'slide', eyebrow: 'Slide 02', title: 'Indicadores', metric: '4 KPIs principais', status: 'Renderizado', accent: '#3f6d91', secondary: '4 KPIs' },
  { kind: 'slide', eyebrow: 'Slide 03', title: 'Riscos', metric: '3 alertas criticos', status: 'Destacado', accent: '#c28f2c', secondary: '3 riscos' },
  { kind: 'slide', eyebrow: 'Slide 04', title: 'Plano de acao', metric: 'Proximos passos', status: 'Pronto', accent: '#6f8f7b', secondary: '8 acoes' },
]

const contractPipelineItems: VerticalPipelineItem[] = [
  { kind: 'contract', eyebrow: 'Contrato 01', title: 'Frete Sul', metric: 'Vence em 18 dias', status: 'Monitorado', accent: '#8b6f3f', secondary: 'Risco medio' },
  { kind: 'contract', eyebrow: 'Contrato 02', title: 'ERP Omie', metric: 'Reajuste anual', status: 'Renovacao', accent: '#225f42', secondary: '+7.8%' },
  { kind: 'contract', eyebrow: 'Contrato 03', title: 'Cloud AWS', metric: 'Credito contratado', status: 'Ativo', accent: '#3f6d91', secondary: 'Cloud' },
  { kind: 'contract', eyebrow: 'Contrato 04', title: 'Software BI', metric: 'Renovacao pendente', status: 'Pendente', accent: '#c28f2c', secondary: '14 dias' },
]

const entryPipelineItems: VerticalPipelineItem[] = [
  { kind: 'entry', eyebrow: 'Etapa 01', title: 'Preview contabil', metric: 'Debito e credito', status: 'Preparado', accent: '#3f6d91', secondary: 'D/C' },
  { kind: 'entry', eyebrow: 'Etapa 02', title: 'Validacao fiscal', metric: 'Centro de custo', status: 'Validado', accent: '#225f42', secondary: 'OK' },
  { kind: 'entry', eyebrow: 'Etapa 03', title: 'Registro no ERP', metric: 'LAN-0184', status: 'Enviado', accent: '#6f8f7b', secondary: 'ERP' },
  { kind: 'entry', eyebrow: 'Etapa 04', title: 'Comprovante', metric: 'Pendente aprovacao', status: 'Gerado', accent: '#c28f2c', secondary: 'PDF' },
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

function VerticalPipelineVisual({ item, index }: { item: VerticalPipelineItem; index: number }) {
  const darkSlide = item.kind === 'slide' && index % 2 === 0
  const lineColor = darkSlide ? 'rgba(255,255,255,0.28)' : '#dce6df'
  const panelColor = darkSlide ? 'rgba(255,255,255,0.16)' : '#f3f7f4'

  if (item.kind === 'dashboard') {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[0, 1, 2].map((tile) => (
            <span key={tile} style={{ background: panelColor, border: '1px solid #dfe7e1', borderRadius: 16, height: 82 }} />
          ))}
        </div>
        <div style={{ alignItems: 'end', display: 'flex', gap: 10, height: 210 }}>
          {[76, 126, 92, 168, 134, 198, 110].map((height, bar) => (
            <span key={`${height}-${bar}`} style={{ background: bar === index + 2 ? item.accent : '#9bb5a4', borderRadius: 8, flex: 1, height }} />
          ))}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <span style={{ background: '#d8e3dc', borderRadius: 999, display: 'block', height: 11, width: '86%' }} />
          <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 11, width: '62%' }} />
        </div>
      </div>
    )
  }

  if (item.kind === 'reconciliation') {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 58px 1fr' }}>
          <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, padding: 18 }}>
            <span style={{ color: '#65716a', fontSize: 20, fontWeight: 820, textTransform: 'uppercase' }}>Banco</span>
            <strong style={{ color: '#0f1512', fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
            <span style={{ color: item.accent, fontSize: 27, fontWeight: 850 }}>{item.secondary}</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
            <span style={{ background: item.accent, borderRadius: 999, boxShadow: `0 0 34px ${item.accent}55`, display: 'block', height: 8, width: 58 }} />
          </div>
          <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, padding: 18 }}>
            <span style={{ color: '#65716a', fontSize: 20, fontWeight: 820, textTransform: 'uppercase' }}>ERP</span>
            <strong style={{ color: '#0f1512', fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{item.metric}</strong>
            <span style={{ color: item.accent, fontSize: 27, fontWeight: 850 }}>{item.secondary}</span>
          </div>
        </div>
        <div style={{ background: item.status === 'Divergencia' ? '#fff8e6' : '#edf6f0', border: `1px solid ${item.status === 'Divergencia' ? '#e6c36f' : '#cfe0d4'}`, borderRadius: 18, height: 82 }} />
      </div>
    )
  }

  if (item.kind === 'slide') {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <strong style={{ color: darkSlide ? '#ffffff' : '#0f1512', fontSize: 64, letterSpacing: 0, lineHeight: 1.02 }}>{item.title}</strong>
        <div style={{ display: 'grid', gap: 12 }}>
          {[78, 62, 86].map((width, line) => (
            <span key={`${width}-${line}`} style={{ background: lineColor, borderRadius: 999, display: 'block', height: 12, width: `${width}%` }} />
          ))}
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
          <span style={{ background: panelColor, border: `1px solid ${darkSlide ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 18, height: 118 }} />
          <span style={{ background: panelColor, border: `1px solid ${darkSlide ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 18, height: 118 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ background: panelColor, border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 13, padding: 20 }}>
        <span style={{ color: '#65716a', fontSize: 21, fontWeight: 780 }}>{item.metric}</span>
        <strong style={{ color: item.accent, fontSize: 32, letterSpacing: 0 }}>{item.secondary}</strong>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {[88, 76, 94, 63, 82, 70].map((width, line) => (
          <span key={`${width}-${line}`} style={{ background: line === index ? item.accent : lineColor, borderRadius: 999, display: 'block', height: line === index ? 14 : 10, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 'auto' }}>
        <span style={{ background: panelColor, border: '1px solid #dfe7e1', borderRadius: 16, height: 84 }} />
        <span style={{ background: item.accent, border: '1px solid #dfe7e1', borderRadius: 16, height: 84 }} />
      </div>
    </div>
  )
}

function VerticalPipelineArtifact({ item, index, muted = false }: { item: VerticalPipelineItem; index: number; muted?: boolean }) {
  const isSlide = item.kind === 'slide'
  const isDashboard = item.kind === 'dashboard'
  const isReconciliation = item.kind === 'reconciliation'
  const isContract = item.kind === 'contract'
  const height = muted ? 520 : isSlide ? 560 : isDashboard ? 680 : isReconciliation ? 620 : 760
  const width = muted ? 390 : isSlide ? 760 : isDashboard ? 650 : isReconciliation ? 680 : 590
  const darkSlide = isSlide && index % 2 === 0

  return (
    <div
      style={{
        background: muted ? 'rgba(255,255,255,0.54)' : darkSlide ? item.accent : '#ffffff',
        border: `1px solid ${muted ? 'rgba(211, 224, 216, 0.70)' : darkSlide ? item.accent : '#dfe7e1'}`,
        borderRadius: muted ? '38px 28px 44px 30px' : isContract ? '34px 24px 38px 26px' : 28,
        boxShadow: muted ? '0 16px 42px rgba(20, 24, 22, 0.07)' : '0 38px 92px rgba(20, 24, 22, 0.22)',
        clipPath: muted || isContract ? 'polygon(5% 0, 100% 3%, 95% 100%, 0 97%)' : undefined,
        color: darkSlide ? '#ffffff' : '#0f1512',
        display: 'grid',
        gap: 22,
        height,
        overflow: 'hidden',
        padding: isSlide ? 38 : 34,
        position: 'relative',
        width,
      }}
    >
      <span style={{ background: darkSlide ? 'rgba(255,255,255,0.65)' : item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between', gap: 18 }}>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <span style={{ color: darkSlide ? 'rgba(255,255,255,0.72)' : '#65716a', fontSize: 21, fontWeight: 820, letterSpacing: 0, textTransform: 'uppercase' }}>{item.eyebrow}</span>
          <strong style={{ color: darkSlide ? '#ffffff' : '#0f1512', fontSize: isSlide ? 38 : 42, letterSpacing: 0, lineHeight: 1.02 }}>{item.title}</strong>
        </div>
        <span style={{ alignItems: 'center', background: darkSlide ? 'rgba(255,255,255,0.16)' : '#f3f7f4', border: `1px solid ${darkSlide ? 'rgba(255,255,255,0.20)' : '#dfe7e1'}`, borderRadius: 18, color: darkSlide ? '#ffffff' : item.accent, display: 'flex', flex: '0 0 auto', fontSize: 23, fontWeight: 850, height: 64, justifyContent: 'center', padding: '0 18px' }}>
          {item.secondary}
        </span>
      </div>
      <VerticalPipelineVisual index={index} item={item} />
    </div>
  )
}

function VerticalPipelineTag({ item, opacity }: { item: VerticalPipelineItem; opacity: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `1px solid ${item.accent}`,
        borderRadius: 999,
        boxShadow: '0 20px 48px rgba(20, 24, 22, 0.14)',
        color: '#0f1512',
        display: 'flex',
        gap: 12,
        left: '50%',
        opacity,
        padding: '16px 22px 16px 17px',
        position: 'absolute',
        top: '50%',
        transform: `translate(210px, -94px) scale(${0.94 + opacity * 0.06})`,
        zIndex: 32,
      }}
    >
      <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
      <span style={{ color: '#65716a', fontSize: 20, fontWeight: 780 }}>Status</span>
      <strong style={{ color: item.accent, fontSize: 28, letterSpacing: 0 }}>{item.status}</strong>
    </div>
  )
}

function FloatingPipelineArtifact({ index, items }: { index: number; items: VerticalPipelineItem[] }) {
  const frame = useCurrentFrame()
  const item = items[index % items.length]
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
        opacity: 0.18,
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) perspective(620px) rotate(${rotation}deg) rotateY(${bend}deg) rotateX(${tilt}deg) skewY(${bend / 6}deg) scale(0.20)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <VerticalPipelineArtifact index={index} item={item} muted />
    </div>
  )
}

function VerticalArtifactPipelineScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const cycle = 138
  const activeIndex = Math.floor(frame / cycle) % items.length
  const local = (frame % cycle) / cycle
  const scan = progress(frame % cycle, 34, 78)

  return (
    <PremiumSceneShell footer={footer} status={status}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
        <FloatingPipelineArtifact index={item} items={items} key={item} />
      ))}
      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 860, zIndex: 20 }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(34,95,66,0), rgba(34,95,66,0.18), rgba(34,95,66,0))', bottom: 0, left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 2 }} />
        <div style={{ background: '#225f42', borderRadius: 999, boxShadow: '0 0 34px rgba(34, 95, 66, 0.36)', height: 5, left: 66, opacity: 0.78, position: 'absolute', right: 66, top: 486, transform: `translateY(${scan * 86}px)` }} />

        {[-2, -1, 0, 1, 2].map((slot) => {
          const unit = local + slot * 0.39
          if (unit < -0.06 || unit > 1.08) return null

          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const centerScore = 1 - Math.min(Math.abs(unit - 0.5) / 0.5, 1)
          const y = interpolate(unit, [0, 0.28, 0.5, 0.74, 1], [-840, -405, 0, 430, 850], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const scale = 0.68 + centerScore * 0.34
          const opacity = 0.26 + centerScore * 0.74
          const rotation = (itemIndex % 2 === 0 ? -1 : 1) * (1.8 - centerScore * 1.2)
          const tagOpacity = interpolate(unit, [0.36, 0.45, 0.64, 0.73], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={`${slot}-${item.title}`}
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
              <VerticalPipelineArtifact index={itemIndex} item={item} />
              <VerticalPipelineTag item={item} opacity={tagOpacity} />
            </div>
          )
        })}
      </div>
    </PremiumSceneShell>
  )
}

export function ExpenseClassificationAnimation() {
  return <ExpenseClassificationPipeline />
}

export function BankReconciliationAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Extrato e ERP pareados em esteira continua"
      items={reconciliationPipelineItems}
      status="Conciliação automática"
    />
  )
}

export function DashboardsAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Dashboards financeiros renderizados em sequencia"
      items={dashboardPipelineItems}
      status="BI workspace renderizando"
    />
  )
}

export function ManagementReportAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Relatorio Word gerado em paginas executivas"
      items={reportPipelineItems}
      status="Relatorio gerencial escrevendo"
    />
  )
}

export function ClosingSlidesAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Deck executivo montado em esteira vertical"
      items={slidePipelineItems}
      status="Slides gerando"
    />
  )
}

export function ContractManagementAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Contratos monitorados por risco, vencimento e reajuste"
      items={contractPipelineItems}
      status="Gestao contratual ativa"
    />
  )
}

export function AccountingEntryAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Lancamento preparado, validado e enviado ao ERP"
      items={entryPipelineItems}
      status="ERP actions executando"
    />
  )
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}
