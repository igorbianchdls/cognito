import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { ReceiptText } from 'lucide-react'

export const MCP_SINGLE_ANIMATION_DURATION = 1080
export const MCP_OPERATIONS_DEMO_DURATION = MCP_SINGLE_ANIMATION_DURATION

const FONT_STACK = 'Geist, "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif'

type IntegrationNode = {
  color: string
  label: string
  side: 'left' | 'right'
  x: number
  y: number
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

const newsCards = [
  { accent: '#225f42', eyebrow: 'FINANCAS', headline: 'IA reduz o tempo de fechamento mensal em 64%', source: 'Cognito Newsroom', time: '09:42' },
  { accent: '#3f6d91', eyebrow: 'MERCADO', headline: 'CFOs aceleram automacao de controles financeiros', source: 'Business Daily', time: '10:18' },
  { accent: '#c28f2c', eyebrow: 'OPERACOES', headline: 'Empresas revisam contratos com apoio de agentes de IA', source: 'Ops Review', time: '11:07' },
]

const tweetText = [
  'Fechamento financeiro nao precisa mais ser uma maratona manual.',
  'Quando classificacao, conciliacao, contratos e dashboards rodam em esteira,',
  'o time deixa de procurar dados e passa a decidir.',
]

const galleryItems = [
  { accent: '#225f42', label: 'Dashboard', title: 'Executive finance', value: '+18.4%' },
  { accent: '#3f6d91', label: 'Workflow', title: 'Bank reconciliation', value: '98%' },
  { accent: '#6f8f7b', label: 'Catalog', title: 'Data workspace', value: '42 fontes' },
  { accent: '#c28f2c', label: 'Report', title: 'Monthly close', value: 'Maio' },
  { accent: '#8b6f9d', label: 'Contract', title: 'Renewal alerts', value: '14 dias' },
  { accent: '#2b7ea5', label: 'AI Review', title: 'Expense controls', value: '96%' },
]

const integrationNodes: IntegrationNode[] = [
  { color: '#ffe01b', label: 'chimp', side: 'left', x: 175, y: 720 },
  { color: '#ffffff', label: 'G', side: 'left', x: 172, y: 960 },
  { color: '#635bff', label: 'S', side: 'left', x: 176, y: 1188 },
  { color: '#ffffff', label: '31', side: 'right', x: 904, y: 720 },
  { color: '#ffffff', label: 'cloud', side: 'right', x: 906, y: 960 },
  { color: '#ffffff', label: 'slack', side: 'right', x: 904, y: 1188 },
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

function IntegrationLogo({ node }: { node: IntegrationNode }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: node.color,
        borderRadius: 999,
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)',
        color: node.label === 'G' ? '#4285f4' : node.label === 'slack' ? '#36c5f0' : node.label === 'cloud' ? '#1683d8' : node.label === '31' ? '#1a73e8' : '#ffffff',
        display: 'flex',
        fontSize: node.label === 'chimp' ? 30 : 32,
        fontWeight: 900,
        height: 72,
        justifyContent: 'center',
        left: node.x - 36,
        position: 'absolute',
        top: node.y - 36,
        width: 72,
        zIndex: 8,
      }}
    >
      {node.label === 'chimp' ? (
        <span style={{ color: '#111111', fontSize: 28 }}>@</span>
      ) : node.label === 'cloud' ? (
        <span style={{ color: '#1683d8', fontSize: 34 }}>~</span>
      ) : node.label === 'slack' ? (
        <span style={{ color: '#e01e5a', fontSize: 34 }}>*</span>
      ) : (
        node.label
      )}
    </div>
  )
}

function AnimatedIntegrationPath({ node, index }: { node: IntegrationNode; index: number }) {
  const frame = useCurrentFrame()
  const centerX = 540
  const centerY = 960
  const joinX = node.side === 'left' ? 358 : 722
  const p = progress(frame, 40 + index * 14, 120 + index * 14)
  const dashOffset = -((frame * 4 + index * 18) % 60)
  const d = `M ${node.x + (node.side === 'left' ? 46 : -46)} ${node.y} C ${node.side === 'left' ? node.x + 110 : node.x - 110} ${node.y}, ${joinX} ${centerY}, ${joinX} ${centerY} L ${centerX} ${centerY}`

  return (
    <path
      d={d}
      fill="none"
      stroke="#1f74e8"
      strokeDasharray="18 22"
      strokeDashoffset={dashOffset}
      strokeLinecap="round"
      strokeWidth={8}
      style={{ opacity: p }}
    />
  )
}

function IntegrationHub() {
  const frame = useCurrentFrame()
  const pulse = 1 + Math.sin(frame / 18) * 0.035

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#eef0ff',
        border: '1px solid #d3d8ee',
        borderRadius: 18,
        boxShadow: '0 22px 58px rgba(31, 116, 232, 0.24)',
        display: 'flex',
        height: 96,
        justifyContent: 'center',
        left: 492,
        position: 'absolute',
        top: 912,
        transform: `scale(${pulse})`,
        width: 96,
        zIndex: 12,
      }}
    >
      <span
        style={{
          alignItems: 'center',
          background: '#1769ff',
          borderRadius: 16,
          color: '#ffffff',
          display: 'flex',
          fontSize: 48,
          fontWeight: 900,
          height: 70,
          justifyContent: 'center',
          width: 70,
        }}
      >
        z
      </span>
    </div>
  )
}

export function IntegrationFlowAnimation() {
  const frame = useCurrentFrame()
  const cardIn = progress(frame, 0, 34)

  return (
    <AbsoluteFill style={{ background: '#ffffff', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <section
        style={{
          background: '#f8f8f8',
          borderRadius: 26,
          bottom: 80,
          left: 42,
          opacity: cardIn,
          position: 'absolute',
          right: 42,
          top: 80,
          transform: `translateY(${(1 - cardIn) * 22}px)`,
        }}
      >
        <svg height="100%" style={{ left: 0, overflow: 'visible', position: 'absolute', top: 0 }} viewBox="0 0 1080 1920" width="100%">
          {integrationNodes.map((node, index) => (
            <AnimatedIntegrationPath index={index} key={`${node.label}-${index}`} node={node} />
          ))}
        </svg>
        {integrationNodes.map((node) => (
          <IntegrationLogo key={`${node.label}-${node.x}`} node={node} />
        ))}
        <IntegrationHub />
      </section>
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

function FloatingNewsCard({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const item = newsCards[index % newsCards.length]
  const driftY = Math.sin((frame + index * 43) / 62) * 16
  const driftX = Math.cos((frame + index * 31) / 70) * 12
  const left = [54, 730, 104, 790, 26, 690][index % 6]
  const top = [250, 180, 680, 810, 1120, 1220][index % 6]
  const rotation = [-10, 8, -6, 11, 7, -9][index % 6]

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.70)',
        border: '1px solid rgba(211, 224, 216, 0.74)',
        borderRadius: 24,
        boxShadow: '0 18px 46px rgba(20, 24, 22, 0.08)',
        filter: 'blur(1.3px)',
        height: 360,
        left,
        opacity: 0.24,
        padding: 28,
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) rotate(${rotation}deg) scale(0.62)`,
        width: 520,
      }}
    >
      <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, marginBottom: 24, width: 96 }} />
      <span style={{ color: '#65716a', display: 'block', fontSize: 18, fontWeight: 850, marginBottom: 16 }}>{item.eyebrow}</span>
      <strong style={{ color: '#0f1512', display: 'block', fontSize: 40, letterSpacing: 0, lineHeight: 1.04 }}>{item.headline}</strong>
    </div>
  )
}

function AnimatedNewsAnimationCard() {
  const frame = useCurrentFrame()
  const active = newsCards[Math.floor(frame / 150) % newsCards.length]
  const local = frame % 150
  const cardIn = progress(local, 0, 28)
  const headlineIn = progress(local, 20, 58)
  const imageIn = progress(local, 36, 78)
  const ticker = (frame * 5) % 760

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 44%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      {[0, 1, 2, 3, 4, 5].map((item) => <FloatingNewsCard index={item} key={item} />)}

      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 30 }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
          <span style={{ background: '#d64933', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          Breaking story animada
        </div>
      </header>

      <main
        style={{
          background: '#ffffff',
          border: '1px solid #dfe7e1',
          borderRadius: 34,
          boxShadow: '0 44px 110px rgba(20, 24, 22, 0.20)',
          left: 78,
          opacity: cardIn,
          overflow: 'hidden',
          position: 'absolute',
          right: 78,
          top: 274,
          transform: `translateY(${(1 - cardIn) * 36}px) scale(${0.97 + cardIn * 0.03})`,
          zIndex: 20,
        }}
      >
        <div style={{ alignItems: 'center', borderBottom: '1px solid #e5ece7', display: 'flex', height: 86, justifyContent: 'space-between', padding: '0 32px' }}>
          <strong style={{ color: '#0f1512', fontFamily: 'Georgia, serif', fontSize: 34, letterSpacing: 0 }}>The Finance Ledger</strong>
          <div style={{ alignItems: 'center', color: '#65716a', display: 'flex', fontSize: 18, fontWeight: 800, gap: 14 }}>
            <span>{active.source}</span>
            <span style={{ background: '#edf4ef', borderRadius: 999, color: active.accent, padding: '8px 12px' }}>{active.time}</span>
          </div>
        </div>

        <section style={{ display: 'grid', gap: 28, padding: '36px 38px 42px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 12, width: 12 }} />
            <span style={{ color: active.accent, fontSize: 22, fontWeight: 900, letterSpacing: 1.8 }}>{active.eyebrow}</span>
            <span style={{ background: '#dce6df', display: 'block', flex: 1, height: 1 }} />
          </div>

          <h1 style={{ color: '#0f1512', fontFamily: 'Georgia, serif', fontSize: 72, fontWeight: 800, letterSpacing: 0, lineHeight: 0.98, margin: 0, opacity: headlineIn, transform: `translateY(${(1 - headlineIn) * 24}px)` }}>
            {active.headline}
          </h1>

          <div style={{ borderRadius: 28, display: 'grid', gap: 0, gridTemplateColumns: '1.2fr 0.8fr', minHeight: 440, overflow: 'hidden' }}>
            <div style={{ background: '#102019', color: '#ffffff', display: 'grid', overflow: 'hidden', padding: 34, position: 'relative' }}>
              <div style={{ background: `linear-gradient(90deg, transparent, ${active.accent}, transparent)`, height: 3, left: -760 + ticker, opacity: 0.9, position: 'absolute', right: 0, top: 0, width: 760 }} />
              <strong style={{ alignSelf: 'end', fontSize: 38, letterSpacing: 0, lineHeight: 1.05, opacity: imageIn }}>Automacao financeira vira pauta de diretoria</strong>
              <div style={{ alignItems: 'end', display: 'flex', gap: 14, height: 210, marginTop: 28, opacity: imageIn }}>
                {[132, 188, 156, 248, 206, 290].map((height, index) => <span key={height} style={{ background: index === 5 ? active.accent : 'rgba(255,255,255,0.30)', borderRadius: 10, flex: 1, height }} />)}
              </div>
            </div>
            <aside style={{ background: '#f6f8f6', border: '1px solid #dfe7e1', display: 'grid', gap: 18, padding: 28 }}>
              {['Lead atualizado', 'Impacto para CFOs', 'Dados verificados'].map((label, index) => (
                <div key={label} style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, opacity: progress(local, 44 + index * 13, 82 + index * 13), padding: 18 }}>
                  <span style={{ color: active.accent, fontSize: 18, fontWeight: 850 }}>{label}</span>
                  <span style={{ background: '#dce6df', borderRadius: 999, display: 'block', height: 10, width: `${86 - index * 12}%` }} />
                  <span style={{ background: '#e7eee9', borderRadius: 999, display: 'block', height: 10, width: `${68 - index * 7}%` }} />
                </div>
              ))}
            </aside>
          </div>
        </section>
      </main>

      <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 35 }}>
        Noticia editorial com headline, imagem e atualizacoes em tempo real
      </div>
    </AbsoluteFill>
  )
}

function FloatingTweetPill({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const driftY = Math.sin((frame + index * 41) / 56) * 16
  const driftX = Math.cos((frame + index * 23) / 68) * 12
  const positions = [
    [82, 310],
    [720, 246],
    [56, 1030],
    [780, 1130],
    [140, 1380],
  ]
  const [left, top] = positions[index % positions.length]

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.78)',
        border: '1px solid rgba(211, 224, 216, 0.86)',
        borderRadius: 999,
        boxShadow: '0 18px 44px rgba(20, 24, 22, 0.08)',
        color: '#516057',
        fontSize: 20,
        fontWeight: 830,
        left,
        opacity: 0.42,
        padding: '16px 22px',
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) rotate(${[-7, 6, -5, 8, -4][index % 5]}deg)`,
      }}
    >
      {['+128 reposts', 'CFO thread', '4.8k views', 'AI finance', 'closing week'][index % 5]}
    </div>
  )
}

function TweetAnimationCard() {
  const frame = useCurrentFrame()
  const cardIn = progress(frame, 8, 42)
  const textIn = progress(frame, 48, 118)
  const mediaIn = progress(frame, 112, 154)
  const likeCount = Math.round(interpolate(progress(frame, 160, 320), [0, 1], [821, 12640]))
  const repostCount = Math.round(interpolate(progress(frame, 178, 340), [0, 1], [114, 2188]))

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(22, 105, 255, 0.14), rgba(244, 247, 244, 0) 56%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      {[0, 1, 2, 3, 4].map((item) => <FloatingTweetPill index={item} key={item} />)}

      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 30 }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
          <span style={{ background: '#111111', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          Tweet em destaque
        </div>
      </header>

      <main
        style={{
          background: '#ffffff',
          border: '1px solid #dfe7e1',
          borderRadius: 36,
          boxShadow: '0 44px 110px rgba(20, 24, 22, 0.20)',
          left: 96,
          opacity: cardIn,
          padding: 38,
          position: 'absolute',
          right: 96,
          top: 392,
          transform: `translateY(${(1 - cardIn) * 34}px) scale(${0.96 + cardIn * 0.04})`,
          zIndex: 20,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <span style={{ alignItems: 'center', background: '#225f42', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 34, fontWeight: 900, height: 74, justifyContent: 'center', width: 74 }}>C</span>
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
              <strong style={{ color: '#0f1512', fontSize: 27, letterSpacing: 0 }}>Cognito</strong>
              <span style={{ alignItems: 'center', background: '#1d9bf0', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 15, fontWeight: 900, height: 22, justifyContent: 'center', width: 22 }}>✓</span>
            </div>
            <span style={{ color: '#65716a', fontSize: 22, fontWeight: 760 }}>@cognito_ai · 12 min</span>
          </div>
          <span style={{ color: '#65716a', fontSize: 34, fontWeight: 900, marginLeft: 'auto' }}>...</span>
        </div>

        <div style={{ display: 'grid', gap: 16, marginTop: 34, opacity: textIn, transform: `translateY(${(1 - textIn) * 18}px)` }}>
          {tweetText.map((line) => (
            <p key={line} style={{ color: '#0f1512', fontSize: 42, fontWeight: 650, letterSpacing: 0, lineHeight: 1.14, margin: 0 }}>
              {line}
            </p>
          ))}
        </div>

        <div style={{ background: '#102019', borderRadius: 28, color: '#ffffff', display: 'grid', gap: 22, marginTop: 34, opacity: mediaIn, overflow: 'hidden', padding: 28, transform: `translateY(${(1 - mediaIn) * 20}px)` }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 28, letterSpacing: 0 }}>Fechamento automatizado</strong>
            <span style={{ background: '#225f42', borderRadius: 999, fontSize: 20, fontWeight: 850, padding: '10px 14px' }}>+64%</span>
          </div>
          <div style={{ alignItems: 'end', display: 'flex', gap: 14, height: 210 }}>
            {[70, 106, 132, 168, 224, 286].map((height, index) => <span key={height} style={{ background: index > 3 ? '#8aa895' : 'rgba(255,255,255,0.26)', borderRadius: 12, flex: 1, height }} />)}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5ece7', display: 'flex', justifyContent: 'space-between', marginTop: 34, paddingTop: 24 }}>
          {[
            ['Reply', '342'],
            ['Repost', repostCount.toLocaleString('en-US')],
            ['Like', likeCount.toLocaleString('en-US')],
            ['View', '482k'],
          ].map(([label, value], index) => (
            <div key={label} style={{ alignItems: 'center', color: index === 2 ? '#d72d72' : '#65716a', display: 'flex', fontSize: 22, fontWeight: 850, gap: 10 }}>
              <span style={{ border: `2px solid ${index === 2 ? '#d72d72' : '#9ca8a1'}`, borderRadius: index === 2 ? 999 : 6, display: 'block', height: 22, width: 22 }} />
              <span>{value}</span>
            </div>
          ))}
        </div>
      </main>

      <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 35 }}>
        Tweet animado com texto, midia e metricas de engajamento
      </div>
    </AbsoluteFill>
  )
}

function SaaSScreenshotCard({ active = false, item, scale = 1 }: { active?: boolean; item: (typeof galleryItems)[number]; scale?: number }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dfe7e1',
        borderRadius: 26 * scale,
        boxShadow: active ? '0 38px 92px rgba(20, 24, 22, 0.20)' : '0 18px 46px rgba(20, 24, 22, 0.10)',
        display: 'grid',
        gap: 20 * scale,
        height: 430 * scale,
        overflow: 'hidden',
        padding: 24 * scale,
        width: 570 * scale,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 6 * scale }}>
          <span style={{ color: '#65716a', fontSize: 18 * scale, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
          <strong style={{ color: '#0f1512', fontSize: 32 * scale, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
        </div>
        <span style={{ background: '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 16 * scale, color: item.accent, fontSize: 24 * scale, fontWeight: 900, padding: `${11 * scale}px ${14 * scale}px` }}>{item.value}</span>
      </div>
      <div style={{ display: 'grid', gap: 13 * scale, gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[0, 1, 2].map((tile) => (
          <span key={tile} style={{ background: tile === 0 ? item.accent : '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 16 * scale, height: 76 * scale }} />
        ))}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 10 * scale, height: 160 * scale }}>
        {[72, 112, 88, 148, 124, 178, 106].map((height, index) => (
          <span key={`${height}-${index}`} style={{ background: index === 4 ? item.accent : '#dce6df', borderRadius: 8 * scale, flex: 1, height: height * scale }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 * scale }}>
        {[88, 64, 78].map((width, index) => <span key={width} style={{ background: index === 1 ? item.accent : '#e5ece7', borderRadius: 999, display: 'block', height: 10 * scale, width: `${width}%` }} />)}
      </div>
    </div>
  )
}

function GallerySceneHeader({ status }: { status: string }) {
  return (
    <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 40 }}>
      <CognitoBrand />
      <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
        <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
        {status}
      </div>
    </header>
  )
}

function GalleryFooter({ children }: { children: ReactNode }) {
  return (
    <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 45 }}>
      {children}
    </div>
  )
}

function SaaSCarouselGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 118) % galleryItems.length
  const local = (frame % 118) / 118

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Carousel de produto" />
      <div style={{ height: 760, left: '50%', opacity: sceneIn, position: 'absolute', top: 520, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 1030 }}>
        {[-2, -1, 0, 1, 2].map((slot) => {
          const itemIndex = (activeIndex + slot + galleryItems.length) % galleryItems.length
          const item = galleryItems[itemIndex]
          const unit = slot - local
          const centerScore = 1 - Math.min(Math.abs(unit) / 2.2, 1)
          const x = unit * 345
          const scale = 0.72 + centerScore * 0.34
          const opacity = 0.28 + centerScore * 0.72
          const rotation = unit * -3.2

          return (
            <div
              key={`${slot}-${item.title}`}
              style={{
                left: '50%',
                opacity,
                position: 'absolute',
                top: 110,
                transform: `translateX(-50%) translateX(${x}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: Math.round(centerScore * 20) + 5,
              }}
            >
              <SaaSScreenshotCard active={Math.abs(unit) < 0.5} item={item} />
            </div>
          )
        })}
      </div>
      <div style={{ bottom: 168, display: 'flex', gap: 12, justifyContent: 'center', left: 0, position: 'absolute', right: 0, zIndex: 40 }}>
        {galleryItems.map((item, index) => (
          <span key={item.title} style={{ background: index === activeIndex ? item.accent : '#cad8cf', borderRadius: 999, display: 'block', height: 12, width: index === activeIndex ? 46 : 12 }} />
        ))}
      </div>
      <GalleryFooter>Galeria carousel com profundidade, foco central e troca continua</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSBentoGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63, 109, 145, 0.14), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Bento gallery gerando" />
      <section
        style={{
          display: 'grid',
          gap: 18,
          gridTemplateColumns: '1.15fr 0.85fr',
          gridTemplateRows: '370px 270px 270px',
          left: 74,
          opacity: sceneIn,
          position: 'absolute',
          right: 74,
          top: 300,
          transform: `translateY(${(1 - sceneIn) * 32}px)`,
          zIndex: 20,
        }}
      >
        {galleryItems.slice(0, 5).map((item, index) => {
          const p = progress(frame, 28 + index * 16, 76 + index * 16)
          const large = index === 0
          const tall = index === 1
          return (
            <div
              key={item.title}
              style={{
                background: index === 0 ? '#102019' : '#ffffff',
                border: `1px solid ${index === 0 ? '#102019' : '#dfe7e1'}`,
                borderRadius: 30,
                boxShadow: '0 28px 72px rgba(20, 24, 22, 0.14)',
                color: index === 0 ? '#ffffff' : '#0f1512',
                display: 'grid',
                gap: 20,
                gridColumn: large ? '1 / 2' : undefined,
                gridRow: large ? '1 / 3' : tall ? '1 / 2' : undefined,
                opacity: p,
                overflow: 'hidden',
                padding: 30,
                position: 'relative',
                transform: `translateY(${(1 - p) * 34}px) scale(${0.96 + p * 0.04})`,
              }}
            >
              <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
              <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <span style={{ color: index === 0 ? 'rgba(255,255,255,0.68)' : '#65716a', fontSize: 19, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                  <strong style={{ color: index === 0 ? '#ffffff' : '#0f1512', fontSize: large ? 48 : 32, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                </div>
                <span style={{ background: index === 0 ? 'rgba(255,255,255,0.14)' : '#f3f7f4', borderRadius: 16, color: index === 0 ? '#ffffff' : item.accent, fontSize: 22, fontWeight: 900, padding: '11px 14px' }}>{item.value}</span>
              </div>
              <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: large ? 280 : 112, marginTop: 'auto' }}>
                {[82, 136, 104, 196, 152, 236].map((height, bar) => <span key={height} style={{ background: bar === index ? item.accent : index === 0 ? 'rgba(255,255,255,0.26)' : '#dce6df', borderRadius: 10, flex: 1, height: large ? height : height * 0.48 }} />)}
              </div>
            </div>
          )
        })}
      </section>
      <GalleryFooter>Bento grid SaaS com cards modulares entrando em sequencia</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSWallGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const offset = (frame * 2.6) % 360

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(194, 143, 44, 0.13), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Wall de screenshots" />
      <div
        style={{
          height: 1240,
          left: -170,
          opacity: sceneIn,
          position: 'absolute',
          top: 260,
          transform: `rotate(-8deg) translateY(${-offset}px)`,
          width: 1420,
          zIndex: 10,
        }}
      >
        {Array.from({ length: 18 }).map((_, index) => {
          const item = galleryItems[index % galleryItems.length]
          const row = Math.floor(index / 3)
          const column = index % 3
          const p = progress(frame, 10 + index * 5, 58 + index * 5)

          return (
            <div
              key={`${item.title}-${index}`}
              style={{
                left: column * 430 + (row % 2) * 90,
                opacity: p,
                position: 'absolute',
                top: row * 315,
                transform: `scale(${0.64 + p * 0.08})`,
              }}
            >
              <SaaSScreenshotCard item={item} scale={0.72} />
            </div>
          )
        })}
      </div>
      <div style={{ background: 'linear-gradient(180deg, #f4f7f4 0%, rgba(244,247,244,0) 24%, rgba(244,247,244,0) 72%, #f4f7f4 100%)', inset: 0, position: 'absolute', zIndex: 30 }} />
      <div style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 32px 90px rgba(20, 24, 22, 0.18)', left: 120, padding: 34, position: 'absolute', right: 120, top: 690, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Product gallery</span>
        <h2 style={{ color: '#0f1512', fontSize: 64, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Todos os artefatos em movimento continuo</h2>
      </div>
      <GalleryFooter>Wall animado de screenshots, comum em hero sections SaaS</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSStackGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 110) % galleryItems.length
  const local = (frame % 110) / 110

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 47%, rgba(139, 111, 157, 0.14), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Stack gallery" />
      <div style={{ height: 1040, left: '50%', opacity: sceneIn, position: 'absolute', top: 310, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 32}px)`, width: 880, zIndex: 20 }}>
        {galleryItems.map((_, stackIndex) => {
          const itemIndex = (activeIndex + stackIndex) % galleryItems.length
          const item = galleryItems[itemIndex]
          const outgoing = stackIndex === 0 ? progress(local, 0.72, 1) : 0
          const depth = stackIndex
          const y = depth * 44 - outgoing * 520
          const x = depth * 20 - outgoing * 180
          const scale = 1 - depth * 0.045 + outgoing * 0.04
          const rotation = depth * -2.5 - outgoing * 12
          const opacity = depth > 4 ? 0 : 1 - depth * 0.12 - outgoing * 0.35

          return (
            <div
              key={`${item.title}-${stackIndex}`}
              style={{
                left: '50%',
                opacity,
                position: 'absolute',
                top: 115,
                transform: `translateX(-50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: 30 - depth,
              }}
            >
              <SaaSScreenshotCard active={stackIndex === 0} item={item} scale={1.18} />
            </div>
          )
        })}
      </div>
      <div style={{ bottom: 190, display: 'grid', gap: 12, left: 84, position: 'absolute', right: 84, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Layered product story</span>
        <strong style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 1 }}>Cards empilhados revelando telas uma a uma</strong>
      </div>
      <GalleryFooter>Galeria stack com troca de camadas, comum em videos de produto</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSMarqueeGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const offsetA = (frame * 3.2) % 450
  const offsetB = (frame * 2.6) % 450

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 47%, rgba(43, 126, 165, 0.14), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Marquee gallery" />
      <div style={{ left: -260, opacity: sceneIn, position: 'absolute', right: -260, top: 310, transform: `rotate(-5deg) translateY(${(1 - sceneIn) * 32}px)`, zIndex: 10 }}>
        {[0, 1, 2].map((row) => {
          const reverse = row % 2 === 1
          const offset = reverse ? offsetB : offsetA

          return (
            <div
              key={row}
              style={{
                display: 'flex',
                gap: 28,
                marginBottom: 32,
                transform: `translateX(${reverse ? -160 + offset : -offset}px)`,
              }}
            >
              {Array.from({ length: 8 }).map((_, index) => {
                const item = galleryItems[(index + row * 2) % galleryItems.length]
                return (
                  <div key={`${row}-${index}-${item.title}`} style={{ flex: '0 0 auto' }}>
                    <SaaSScreenshotCard item={item} scale={0.72} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div style={{ background: 'linear-gradient(180deg, #f4f7f4 0%, rgba(244,247,244,0) 20%, rgba(244,247,244,0) 72%, #f4f7f4 100%)', inset: 0, position: 'absolute', zIndex: 30 }} />
      <div style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid #dfe7e1', borderRadius: 32, boxShadow: '0 32px 90px rgba(20, 24, 22, 0.18)', left: 94, padding: 36, position: 'absolute', right: 94, top: 690, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Infinite interface reel</span>
        <h2 style={{ color: '#0f1512', fontSize: 66, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Uma biblioteca inteira passando em loop</h2>
      </div>
      <GalleryFooter>Galeria marquee com fileiras paralelas e movimento infinito</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSSpotlightGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 132) % galleryItems.length
  const active = galleryItems[activeIndex]
  const local = frame % 132
  const calloutIn = progress(local, 30, 72)
  const pulse = 1 + Math.sin(frame / 16) * 0.035

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 47%, ${active.accent}26, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Spotlight gallery" />
      <div
        style={{
          left: '50%',
          opacity: sceneIn,
          position: 'absolute',
          top: 350,
          transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`,
          width: 820,
          zIndex: 20,
        }}
      >
        <div style={{ background: '#102019', border: '1px solid #102019', borderRadius: 36, boxShadow: '0 44px 110px rgba(20, 24, 22, 0.22)', color: '#ffffff', overflow: 'hidden', padding: 36, position: 'relative' }}>
          <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
          <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.66)', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>{active.label}</span>
              <strong style={{ color: '#ffffff', fontSize: 64, letterSpacing: 0, lineHeight: 0.98 }}>{active.title}</strong>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: 18, color: '#ffffff', fontSize: 26, fontWeight: 900, padding: '13px 17px' }}>{active.value}</span>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 28, display: 'grid', gap: 18, marginTop: 36, padding: 24 }}>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[0, 1, 2].map((item) => <span key={item} style={{ background: item === 1 ? active.accent : '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 18, height: 108 }} />)}
            </div>
            <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 260 }}>
              {[96, 146, 118, 210, 164, 286, 230].map((height, index) => <span key={height} style={{ background: index === activeIndex % 7 ? active.accent : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[86, 72, 92, 58].map((width, index) => <span key={width} style={{ background: index === 2 ? active.accent : '#e5ece7', borderRadius: 999, display: 'block', height: 12, width: `${width}%` }} />)}
            </div>
          </div>
        </div>
        {[
          { label: 'Insight', left: -32, top: 330, value: active.value },
          { label: 'Sync', left: 584, top: 520, value: 'Live' },
          { label: 'Quality', left: 516, top: 156, value: '99%' },
        ].map((callout, index) => (
          <div
            key={callout.label}
            style={{
              background: '#ffffff',
              border: `1px solid ${active.accent}`,
              borderRadius: 22,
              boxShadow: '0 24px 60px rgba(20, 24, 22, 0.16)',
              display: 'grid',
              gap: 8,
              left: callout.left,
              opacity: calloutIn,
              padding: '18px 22px',
              position: 'absolute',
              top: callout.top,
              transform: `scale(${0.9 + calloutIn * 0.1}) translateY(${Math.sin((frame + index * 18) / 24) * 7}px)`,
              width: 220,
              zIndex: 30,
            }}
          >
            <span style={{ color: '#65716a', fontSize: 18, fontWeight: 850 }}>{callout.label}</span>
            <strong style={{ color: active.accent, fontSize: 34, letterSpacing: 0 }}>{callout.value}</strong>
          </div>
        ))}
        <span style={{ border: `4px solid ${active.accent}`, borderRadius: 28, display: 'block', height: 164, left: 272, opacity: 0.84, position: 'absolute', top: 380, transform: `scale(${pulse})`, width: 248, zIndex: 28 }} />
      </div>
      <GalleryFooter>Galeria spotlight com zoom em uma tela e detalhes flutuantes</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSBeforeAfterAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const slider = interpolate(Math.sin(frame / 34), [-1, 1], [0.22, 0.78])
  const reveal = progress(frame, 42, 92)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Before / after" />
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #dfe7e1',
          borderRadius: 36,
          boxShadow: '0 44px 110px rgba(20, 24, 22, 0.20)',
          height: 940,
          left: 74,
          opacity: sceneIn,
          overflow: 'hidden',
          position: 'absolute',
          right: 74,
          top: 330,
          transform: `translateY(${(1 - sceneIn) * 34}px)`,
          zIndex: 20,
        }}
      >
        <div style={{ background: '#f7faf7', bottom: 0, left: 0, padding: 36, position: 'absolute', top: 0, width: '100%' }}>
          <span style={{ color: '#8a6f2f', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Antes</span>
          <h2 style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 0.98, margin: '16px 0 28px' }}>Fechamento manual e fragmentado</h2>
          <div style={{ display: 'grid', gap: 18 }}>
            {['Planilhas duplicadas', 'Conciliação por amostra', 'Contratos sem alerta', 'Dashboards atrasados'].map((label, index) => (
              <div key={label} style={{ background: '#ffffff', border: '1px solid #eadfcb', borderRadius: 18, display: 'flex', gap: 14, padding: 18 }}>
                <span style={{ background: '#c28f2c', borderRadius: 999, display: 'block', flex: '0 0 auto', height: 18, marginTop: 4, width: 18 }} />
                <span style={{ color: '#4a3f2b', fontSize: 28, fontWeight: 800 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: '#102019',
            bottom: 0,
            clipPath: `inset(0 0 0 ${slider * 100}%)`,
            color: '#ffffff',
            left: 0,
            padding: 36,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          <span style={{ color: '#8aa895', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Depois</span>
          <h2 style={{ color: '#ffffff', fontSize: 58, letterSpacing: 0, lineHeight: 0.98, margin: '16px 0 28px' }}>Operação financeira em esteira</h2>
          <div style={{ display: 'grid', gap: 18 }}>
            {[
              ['Classificacao IA', '96%'],
              ['Conciliação automática', '98%'],
              ['Alertas contratuais', 'Live'],
              ['Dashboards publicados', '+18.4%'],
            ].map(([label, value], index) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 18, display: 'flex', justifyContent: 'space-between', padding: 18, opacity: reveal }}>
                <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 800 }}>{label}</span>
                <strong style={{ color: '#8aa895', fontSize: 30, letterSpacing: 0 }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#ffffff', bottom: 0, boxShadow: '0 0 34px rgba(20,24,22,0.18)', left: `${slider * 100}%`, position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 5 }} />
        <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 999, boxShadow: '0 18px 48px rgba(20,24,22,0.16)', color: '#225f42', display: 'flex', fontSize: 24, fontWeight: 900, height: 82, justifyContent: 'center', left: `${slider * 100}%`, position: 'absolute', top: 430, transform: 'translateX(-50%)', width: 82 }}>AI</span>
      </section>
      <GalleryFooter>Comparacao before/after mostrando ganho visualmente</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSTimelineAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const steps = [
    ['Ingestao', 'Dados chegam de ERP, banco e contratos', '#3f6d91'],
    ['Classificacao', 'IA organiza despesas e centros', '#225f42'],
    ['Conciliacao', 'Transacoes sao pareadas', '#6f8f7b'],
    ['Publicacao', 'Dashboards e relatorios ficam prontos', '#c28f2c'],
  ]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63, 109, 145, 0.15), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Timeline animada" />
      <div style={{ left: 88, opacity: sceneIn, position: 'absolute', right: 88, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <h2 style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.98, margin: '0 0 54px' }}>Do dado bruto ao board pack</h2>
        <div style={{ background: '#dce6df', borderRadius: 999, height: 8, left: 48, position: 'absolute', right: 48, top: 240 }} />
        <div style={{ background: '#225f42', borderRadius: 999, height: 8, left: 48, position: 'absolute', top: 240, width: `${progress(frame, 44, 260) * 82}%` }} />
        <div style={{ display: 'grid', gap: 22 }}>
          {steps.map(([title, description, color], index) => {
            const p = progress(frame, 42 + index * 42, 92 + index * 42)
            return (
              <div
                key={title}
                style={{
                  alignItems: 'center',
                  display: 'grid',
                  gap: 26,
                  gridTemplateColumns: '94px 1fr',
                  opacity: p,
                  transform: `translateX(${(1 - p) * -34}px)`,
                }}
              >
                <span style={{ alignItems: 'center', background: color, border: '8px solid #f4f7f4', borderRadius: 999, boxShadow: `0 18px 48px ${color}40`, color: '#ffffff', display: 'flex', fontSize: 28, fontWeight: 900, height: 82, justifyContent: 'center', width: 82 }}>{index + 1}</span>
                <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 28, boxShadow: '0 24px 64px rgba(20,24,22,0.12)', display: 'grid', gap: 14, padding: 28 }}>
                  <strong style={{ color: '#0f1512', fontSize: 40, letterSpacing: 0 }}>{title}</strong>
                  <span style={{ color: '#65716a', fontSize: 27, fontWeight: 760 }}>{description}</span>
                  <span style={{ background: color, borderRadius: 999, display: 'block', height: 10, width: `${56 + index * 10}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <GalleryFooter>Timeline SaaS para explicar processo e automacao ponta a ponta</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSOrbitAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const centerX = 540
  const centerY = 930

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.18), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Orbit gallery" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 5 }} viewBox="0 0 1080 1920" width="100%">
        {[210, 330, 450].map((radius) => (
          <circle cx={centerX} cy={centerY} fill="none" key={radius} r={radius} stroke="rgba(34,95,66,0.14)" strokeWidth="3" />
        ))}
      </svg>
      <div style={{ opacity: sceneIn, position: 'absolute', zIndex: 20 }}>
        {galleryItems.map((item, index) => {
          const angle = frame / 58 + index * ((Math.PI * 2) / galleryItems.length)
          const radius = index % 2 === 0 ? 360 : 285
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          const scale = 0.58 + ((Math.sin(angle) + 1) / 2) * 0.18

          return (
            <div
              key={item.title}
              style={{
                left: x,
                position: 'absolute',
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.round(scale * 100),
              }}
            >
              <SaaSScreenshotCard item={item} scale={0.64} />
            </div>
          )
        })}
      </div>
      <div style={{ alignItems: 'center', background: '#102019', border: '1px solid #102019', borderRadius: 42, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 14, height: 290, justifyItems: 'center', left: '50%', padding: 32, position: 'absolute', top: centerY, transform: `translate(-50%, -50%) scale(${0.94 + sceneIn * 0.06})`, width: 360, zIndex: 40 }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 18, width: 18 }} />
        <strong style={{ color: '#ffffff', fontSize: 48, letterSpacing: 0, lineHeight: 0.98, textAlign: 'center' }}>Cognito hub</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 23, fontWeight: 760, textAlign: 'center' }}>Todos os artefatos orbitando a operacao</span>
      </div>
      <GalleryFooter>Orbit gallery com telas circulando um hub central</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSCommandCenterAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const active = galleryItems[Math.floor(frame / 120) % galleryItems.length]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Command center" />
      <section style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 292, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#102019', border: '1px solid #102019', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 26, minHeight: 880, padding: 34 }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#8aa895', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Live operations</span>
              <strong style={{ color: '#ffffff', fontSize: 58, letterSpacing: 0, lineHeight: 0.98 }}>Finance command center</strong>
            </div>
            <span style={{ background: '#225f42', borderRadius: 999, color: '#ffffff', fontSize: 24, fontWeight: 900, padding: '14px 18px' }}>{active.value}</span>
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {galleryItems.slice(0, 3).map((item, index) => (
              <div key={item.title} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, display: 'grid', gap: 14, padding: 22 }}>
                <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                <strong style={{ color: '#ffffff', fontSize: 30, letterSpacing: 0, lineHeight: 1 }}>{item.value}</strong>
                <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 10, width: `${58 + index * 14}%` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 0.8fr' }}>
            <div style={{ background: '#ffffff', borderRadius: 28, color: '#0f1512', display: 'grid', gap: 22, padding: 26 }}>
              <strong style={{ color: '#0f1512', fontSize: 36, letterSpacing: 0 }}>{active.title}</strong>
              <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 250 }}>
                {[96, 146, 118, 210, 164, 286, 230].map((height, index) => <span key={height} style={{ background: index === 5 ? active.accent : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {galleryItems.slice(3, 6).map((item, index) => {
                const p = progress(frame, 48 + index * 22, 96 + index * 22)
                return (
                  <div key={item.title} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, display: 'grid', gap: 10, opacity: p, padding: 22, transform: `translateX(${(1 - p) * 24}px)` }}>
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 17, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                    <strong style={{ color: '#ffffff', fontSize: 28, letterSpacing: 0 }}>{item.title}</strong>
                    <span style={{ color: item.accent, fontSize: 24, fontWeight: 900 }}>{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
      <GalleryFooter>Command center agregando multiplas telas em uma visao executiva</GalleryFooter>
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

export function NewsAnimation() {
  return <AnimatedNewsAnimationCard />
}

export function TweetAnimation() {
  return <TweetAnimationCard />
}

export function SaaSCarouselGalleryAnimation() {
  return <SaaSCarouselGalleryAnimationCard />
}

export function SaaSBentoGalleryAnimation() {
  return <SaaSBentoGalleryAnimationCard />
}

export function SaaSWallGalleryAnimation() {
  return <SaaSWallGalleryAnimationCard />
}

export function SaaSStackGalleryAnimation() {
  return <SaaSStackGalleryAnimationCard />
}

export function SaaSMarqueeGalleryAnimation() {
  return <SaaSMarqueeGalleryAnimationCard />
}

export function SaaSSpotlightGalleryAnimation() {
  return <SaaSSpotlightGalleryAnimationCard />
}

export function SaaSBeforeAfterAnimation() {
  return <SaaSBeforeAfterAnimationCard />
}

export function SaaSTimelineAnimation() {
  return <SaaSTimelineAnimationCard />
}

export function SaaSOrbitAnimation() {
  return <SaaSOrbitAnimationCard />
}

export function SaaSCommandCenterAnimation() {
  return <SaaSCommandCenterAnimationCard />
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}
