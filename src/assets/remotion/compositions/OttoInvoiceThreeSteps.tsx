import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export const OTTO_INVOICE_THREE_STEPS_DURATION = 450

const BLUE = '#0b67f0'
const NAVY = '#071329'
const MUTED = '#60708a'
const GREEN = '#149653'

const records = [
  { customer: 'Fernanda Silva', company: 'Distribuidora FS', value: 'R$ 450,00', tax: 'R$ 22,50', service: 'Suporte técnico', note: 'Atendimento avulso', number: '00005780' },
  { customer: 'Carlos Souza', company: 'Carlos Souza ME', value: 'R$ 980,00', tax: 'R$ 49,00', service: 'Design gráfico', note: 'Projeto de identidade visual', number: '00005781' },
  { customer: 'Ana Martins', company: 'Otto Sistemas Ltda', value: 'R$ 1.250,00', tax: 'R$ 62,50', service: 'Consultoria financeira', note: 'Prestação de serviço do mês', number: '00005782' },
  { customer: 'Juliana Lima', company: 'Empresa XYZ Ltda', value: 'R$ 2.500,00', tax: 'R$ 125,00', service: 'Treinamento empresarial', note: 'Treinamento presencial', number: '00005783' },
  { customer: 'Marcos Alves', company: 'Alves Comércio Ltda', value: 'R$ 450,00', tax: 'R$ 22,50', service: 'Manutenção de sistemas', note: 'Visita técnica', number: '00005784' },
]

type RecordItem = (typeof records)[number]
type Stage = 1 | 2 | 3

function tween(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function wrap(value: number, size: number) {
  return ((value + size / 2) % size + size) % size - size / 2
}

function stageAt(frame: number): Stage {
  if (frame < 150) return 1
  if (frame < 300) return 2
  return 3
}

function stageOpacity(frame: number, stage: Stage) {
  if (stage === 1) return tween(frame, 142, 154, [1, 0])
  if (stage === 2) return Math.min(tween(frame, 142, 154), tween(frame, 292, 304, [1, 0]))
  return tween(frame, 292, 304)
}

function carouselProgress(frame: number) {
  const moves: Array<[number, number]> = [
    [22, 48], [68, 94], [112, 138],
    [168, 194], [214, 240], [258, 284],
    [318, 344], [364, 390], [408, 434],
  ]
  return moves.reduce((sum, [from, to]) => sum + tween(frame, from, to), 0)
}

function Header({ frame, stage }: { frame: number; stage: Stage }) {
  const copy = {
    1: ['Recebendo sua solicitação...', 'Entendendo o que você precisa'],
    2: ['Preparando notas fiscais...', 'Organizando os dados para emissão'],
    3: ['Emitindo notas fiscais...', 'Gerando e enviando a nota fiscal para o cliente'],
  }[stage]
  const opacity = stageOpacity(frame, stage)
  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', opacity, position: 'absolute', top: 20, transform: `translateY(${(1 - opacity) * 12}px)`, width: '100%', zIndex: 30 }}>
      <div style={{ alignItems: 'center', background: 'rgba(245,249,255,.95)', border: '1px solid #d8e4f5', borderRadius: 13, boxShadow: '0 6px 18px rgba(31,74,135,.06)', color: BLUE, display: 'flex', fontSize: 16, fontWeight: 800, gap: 10, padding: '8px 15px' }}>
        <span style={{ alignItems: 'center', background: BLUE, borderRadius: 999, color: '#fff', display: 'flex', fontSize: 12, height: 22, justifyContent: 'center', width: 22 }}>{stage}</span>ETAPA {stage} DE 3
      </div>
      <div style={{ color: '#05070d', fontSize: 62, fontWeight: 790, letterSpacing: '-.052em', lineHeight: 1, marginTop: 21 }}>{copy[0]}</div>
      <div style={{ color: '#405474', fontSize: 20, fontWeight: 500, marginTop: 15 }}>{copy[1]}</div>
      <div style={{ alignItems: 'center', display: 'flex', marginTop: 20 }}>
        {[1, 2, 3].map((dot, index) => <div key={dot} style={{ alignItems: 'center', display: 'flex' }}>{index > 0 ? <span style={{ background: '#aeb9ca', height: 2, width: 76 }} /> : null}<span style={{ background: dot === stage ? BLUE : '#8795aa', borderRadius: 999, boxShadow: dot === stage ? '0 0 0 5px #e5f0ff' : 'none', height: 13, width: 13 }} /></div>)}
      </div>
    </div>
  )
}

function Paper({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: '#fff', border: '1px solid #d7dee8', borderRadius: 10, boxShadow: '0 24px 55px rgba(30,45,72,.12), 0 4px 13px rgba(30,45,72,.07)', height: 470, overflow: 'hidden', position: 'relative', width: 430, ...style }}>{children}</div>
}

function Avatar({ index }: { index: number }) {
  return <div style={{ backgroundImage: `url(${staticFile('remotion/invoice-three-steps/avatar-sheet.png')})`, backgroundPosition: `${index * 25}% center`, backgroundRepeat: 'no-repeat', backgroundSize: '500% auto', border: '3px solid white', borderRadius: 999, boxShadow: '0 4px 13px rgba(15,23,42,.14)', height: 56, width: 56 }} />
}

function SaleRow({ label, value }: { label: string; value: string }) {
  return <div style={{ alignItems: 'center', borderBottom: '1px solid #e9edf3', display: 'flex', justifyContent: 'space-between', minHeight: 48 }}><span style={{ color: '#66758b', fontSize: 13 }}>{label}</span><strong style={{ color: '#101828', fontSize: 14, maxWidth: 245, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</strong></div>
}

function SaleCard({ data, index, frame }: { data: RecordItem; index: number; frame: number }) {
  const pulse = tween(frame % 46, 0, 30)
  return (
    <Paper>
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ alignItems: 'center', borderBottom: '1px solid #e5eaf1', display: 'flex', justifyContent: 'space-between', paddingBottom: 14 }}><div style={{ alignItems: 'center', color: BLUE, display: 'flex', fontSize: 17, fontWeight: 750, gap: 10 }}><span style={{ border: `2px solid ${BLUE}`, borderRadius: 6, fontSize: 14, padding: '2px 5px' }}>↗</span>Nova solicitação</div><span style={{ background: '#edf5ff', borderRadius: 7, color: BLUE, fontSize: 12, fontWeight: 700, padding: '7px 10px' }}>Analisando...</span></div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 15, padding: '16px 0 10px' }}><Avatar index={index} /><div><strong style={{ color: '#101828', display: 'block', fontSize: 19 }}>{data.customer}</strong><span style={{ color: '#66758b', fontSize: 12 }}>{data.customer.toLowerCase().replace(' ', '.')}@email.com</span></div></div>
        <div style={{ marginTop: 4 }}><SaleRow label="Tipo de solicitação" value="Emitir nota fiscal" /><SaleRow label="Cliente" value={data.company} /><SaleRow label="Valor" value={data.value} /><SaleRow label="Serviço" value={data.service} /><SaleRow label="Data da venda" value="17/05/2025" /><SaleRow label="Observação" value={data.note} /></div>
      </div>
      <div style={{ bottom: 15, left: 24, position: 'absolute', right: 24 }}><div style={{ color: '#66758b', fontSize: 12 }}>⌕ &nbsp;Lendo e entendendo os detalhes...</div><div style={{ background: '#e6ebf1', borderRadius: 99, height: 5, marginTop: 9, overflow: 'hidden' }}><div style={{ background: BLUE, height: '100%', width: `${35 + pulse * 35}%` }} /></div></div>
    </Paper>
  )
}

function TinyQr() {
  return <div style={{ backgroundColor: '#fff', backgroundImage: 'repeating-linear-gradient(0deg,#111 0 2px,transparent 2px 4px),repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 5px)', border: '3px solid #111', height: 38, width: 38 }} />
}

function FiscalLine({ label, value }: { label: string; value: string }) {
  return <div><span style={{ color: '#718096', display: 'inline-block', fontSize: 8, textTransform: 'uppercase', width: 115 }}>{label}</span><strong style={{ color: '#111827', fontSize: 10 }}>{value}</strong></div>
}

function FiscalSection({ children, title, visible = 1 }: { children: ReactNode; title: string; visible?: number }) {
  return <div style={{ borderTop: '1px solid #dce2e9', opacity: visible, padding: '9px 13px 7px', transform: `translateY(${(1 - visible) * 7}px)` }}><div style={{ color: '#56657a', fontSize: 8, fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>{children}</div>
}

function Skeleton({ width }: { width: string }) {
  return <span style={{ background: '#d9e0e9', borderRadius: 99, display: 'block', height: 6, marginTop: 6, width }} />
}

function DraftLabel({ children }: { children: ReactNode }) {
  return <span style={{ color: '#65758b', display: 'block', fontSize: 8, marginBottom: 4 }}>{children}</span>
}

function DraftInvoiceCard({ data, fieldFrame, focused }: { data: RecordItem; fieldFrame: number; focused: boolean }) {
  const reveal = (delay: number) => !focused ? 1 : interpolate(tween(fieldFrame, delay, delay + 12), [0, 1], [.2, 1])
  const activePulse = focused ? interpolate(fieldFrame % 30, [0, 15, 30], [.25, .7, .25]) : .32
  const progress = interpolate(fieldFrame, [0, 130], [18, 88], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Paper style={{ background: 'linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%)', borderColor: '#ced9e8' }}>
      <div style={{ alignItems: 'center', borderBottom: '1px solid #dbe3ee', display: 'flex', justifyContent: 'space-between', padding: '14px 15px 12px' }}>
        <strong style={{ color: '#1b2738', fontSize: 11 }}>NOTA FISCAL DE SERVIÇO ELETRÔNICA — NFS-e</strong>
        <span style={{ background: '#eaf3ff', borderRadius: 7, color: BLUE, fontSize: 8, fontWeight: 800, padding: '6px 9px' }}>Preparando...</span>
      </div>

      <div style={{ opacity: reveal(6), padding: '11px 15px 9px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}><strong style={{ color: '#294e85', fontSize: 9 }}>DADOS DO PRESTADOR</strong><span style={{ background: '#cfd8e5', height: 1, flex: 1 }} /></div>
        <div style={{ marginTop: 8 }}><DraftLabel>Nome / Razão Social</DraftLabel><strong style={{ fontSize: 11 }}>OTTO SISTEMAS LTDA</strong></div>
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr', marginTop: 9 }}><div><DraftLabel>CNPJ</DraftLabel><strong style={{ fontSize: 10 }}>25.638.123/0001-45</strong></div><div><DraftLabel>Município</DraftLabel><strong style={{ fontSize: 10 }}>Recife · PE</strong></div></div>
      </div>

      <div style={{ borderTop: '1px solid #dbe3ee', opacity: reveal(26), padding: '9px 15px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}><strong style={{ color: '#294e85', fontSize: 9 }}>DADOS DO CLIENTE</strong><span style={{ background: '#cfd8e5', height: 1, flex: 1 }} /></div>
        <div style={{ marginTop: 7 }}><DraftLabel>Nome / Razão Social</DraftLabel><strong style={{ fontSize: 11 }}>{data.customer.toUpperCase()}</strong></div>
        <div style={{ marginTop: 7 }}><DraftLabel>CPF / CNPJ</DraftLabel><Skeleton width="46%" /></div>
      </div>

      <div style={{ borderTop: '1px solid #dbe3ee', opacity: reveal(48), padding: '9px 15px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}><strong style={{ color: '#294e85', fontSize: 9 }}>SERVIÇO</strong><span style={{ background: '#cfd8e5', height: 1, flex: 1 }} /></div>
        <div style={{ border: `1px solid rgba(11,103,240,${activePulse})`, borderRadius: 6, boxShadow: `0 0 0 3px rgba(11,103,240,${activePulse * .08})`, marginTop: 7, padding: '6px 8px' }}><DraftLabel>Descrição do serviço</DraftLabel><strong style={{ fontSize: 11 }}>{data.service}</strong></div>
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}><div><DraftLabel>Código do serviço</DraftLabel><Skeleton width="64%" /></div><div><DraftLabel>Município da prestação</DraftLabel><strong style={{ fontSize: 10 }}>Recife · PE</strong></div></div>
      </div>

      <div style={{ borderTop: '1px solid #dbe3ee', opacity: reveal(72), padding: '9px 15px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}><strong style={{ color: '#294e85', fontSize: 9 }}>VALORES E TRIBUTOS</strong><span style={{ background: '#cfd8e5', height: 1, flex: 1 }} /></div>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4,1fr)', marginTop: 8 }}><div><DraftLabel>Valor do serviço</DraftLabel><strong style={{ fontSize: 10 }}>{data.value}</strong></div><div><DraftLabel>Base de cálculo</DraftLabel><Skeleton width="74%" /></div><div><DraftLabel>Alíquota ISS</DraftLabel><Skeleton width="70%" /></div><div><DraftLabel>Valor do ISS</DraftLabel><Skeleton width="72%" /></div></div>
      </div>

      <div style={{ background: '#fbfdff', borderTop: '1px solid #dbe3ee', bottom: 0, left: 0, padding: '8px 15px 10px', position: 'absolute', right: 0 }}><div style={{ color: '#65758b', display: 'flex', fontSize: 8, justifyContent: 'space-between' }}><span>Validando dados fiscais...</span><strong style={{ color: BLUE }}>{Math.round(progress)}%</strong></div><div style={{ background: '#dfe6ef', borderRadius: 99, height: 5, marginTop: 7, overflow: 'hidden' }}><div style={{ background: BLUE, borderRadius: 99, height: '100%', width: `${progress}%` }} /></div></div>
    </Paper>
  )
}

function InvoiceCard({ authorized, data, fieldFrame, focused }: { authorized: boolean; data: RecordItem; fieldFrame: number; focused: boolean }) {
  if (!authorized) return <DraftInvoiceCard data={data} fieldFrame={fieldFrame} focused={focused} />
  const reveal = (delay: number) => authorized || !focused ? 1 : tween(fieldFrame, delay, delay + 12)
  const progress = authorized ? 100 : interpolate(fieldFrame, [0, 130], [14, 92], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const authorizedIn = authorized ? tween(fieldFrame, 8, 24) : 0
  return (
    <Paper>
      <div style={{ padding: '13px 14px 0' }}><div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}><div><strong style={{ color: '#161b24', display: 'block', fontSize: 11 }}>NOTA FISCAL DE SERVIÇO ELETRÔNICA — NFS-e</strong><div style={{ alignItems: 'center', display: 'flex', gap: 8, marginTop: 7 }}><strong style={{ fontSize: 10 }}>NFS-e Nº {data.number}</strong><span style={{ background: authorized ? '#e8f8ef' : '#edf5ff', borderRadius: 99, color: authorized ? GREEN : BLUE, fontSize: 8, fontWeight: 800, padding: '4px 7px' }}>{authorized ? '✓ Autorizada' : 'Preparando...'}</span></div><span style={{ color: '#5e6c80', display: 'block', fontSize: 9, marginTop: 6 }}>17/05/2025 · 10:{data.number.slice(-2)}</span></div><div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 5 }}><TinyQr /><span style={{ color: '#6b7280', fontSize: 6 }}>CÓDIGO DE VERIFICAÇÃO</span></div></div></div>
      <div style={{ borderTop: '1px solid #dce2e9', display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', marginTop: 10 }}>{[['COMPETÊNCIA', '05/2025'], ['MUNICÍPIO DE INCIDÊNCIA', 'Recife · PE'], ['NATUREZA DA OPERAÇÃO', 'Tributação no município']].map(([label, value], i) => <div key={label} style={{ borderRight: i < 2 ? '1px solid #dce2e9' : 'none', opacity: reveal(6), padding: '8px 11px' }}><span style={{ color: '#718096', display: 'block', fontSize: 7 }}>{label}</span><strong style={{ fontSize: 9 }}>{value}</strong></div>)}</div>
      <FiscalSection title="Prestador de serviços" visible={reveal(18)}><FiscalLine label="Nome / Razão social" value="OTTO SISTEMAS LTDA" /><FiscalLine label="CNPJ" value="25.638.123/0001-45" /><FiscalLine label="Inscrição municipal" value="123.456-7" /></FiscalSection>
      <FiscalSection title="Tomador de serviços" visible={reveal(38)}><FiscalLine label="Nome / Razão social" value={data.customer.toUpperCase()} /><FiscalLine label="CPF / CNPJ" value="234.567.890-11" /><FiscalLine label="Município" value="Recife · PE" /></FiscalSection>
      <FiscalSection title="Descrição dos serviços" visible={reveal(58)}><strong style={{ color: '#111827', fontSize: 10 }}>{data.service}</strong><div style={{ color: '#657287', fontSize: 8, marginTop: 4 }}>{data.note}</div></FiscalSection>
      <div style={{ borderTop: '1px solid #dce2e9', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', opacity: reveal(78) }}>{[['VALOR DO SERVIÇO', data.value], ['BASE DE CÁLCULO', data.value], ['ALÍQUOTA ISS', '5,00%'], ['VALOR DO ISS', data.tax]].map(([label, value], i) => <div key={label} style={{ borderRight: i < 3 ? '1px solid #dce2e9' : 'none', padding: '8px 7px' }}><span style={{ color: '#718096', display: 'block', fontSize: 6 }}>{label}</span><strong style={{ fontSize: 9 }}>{value}</strong></div>)}</div>
      <div style={{ alignItems: 'center', background: '#fff', borderTop: '1px solid #dce2e9', bottom: authorized ? 52 : 35, display: 'flex', justifyContent: 'space-between', left: 0, opacity: reveal(94), padding: '7px 13px', position: 'absolute', right: 0, zIndex: 2 }}><span style={{ fontSize: 9, fontWeight: 800 }}>VALOR TOTAL DA NOTA</span><strong style={{ fontSize: 17 }}>{data.value}</strong></div>
      <div style={{ background: '#fff', borderTop: '1px solid #e2e7ed', bottom: 0, left: 0, padding: authorized ? '9px 13px' : '7px 13px 9px', position: 'absolute', right: 0, zIndex: 3 }}>{authorized ? <div style={{ alignItems: 'center', display: 'flex', opacity: authorizedIn }}><span style={{ alignItems: 'center', background: GREEN, borderRadius: 99, color: '#fff', display: 'flex', fontSize: 11, fontWeight: 900, height: 22, justifyContent: 'center', width: 22 }}>✓</span><div style={{ flex: 1, marginLeft: 8 }}><strong style={{ color: GREEN, display: 'block', fontSize: 10 }}>Nota fiscal autorizada com sucesso</strong><span style={{ color: '#6b7280', fontSize: 7 }}>Enviada para {data.customer.toLowerCase().replace(' ', '.')}@email.com</span></div><span style={{ background: BLUE, borderRadius: 6, boxShadow: '0 6px 14px rgba(11,103,240,.22)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '9px 12px' }}>Ver DANFS-e ↗</span></div> : <><div style={{ color: '#6b7280', display: 'flex', fontSize: 8, justifyContent: 'space-between' }}><span>Validando dados fiscais...</span><strong style={{ color: BLUE }}>{Math.round(progress)}%</strong></div><div style={{ background: '#e5eaf0', borderRadius: 99, height: 5, marginTop: 7, overflow: 'hidden' }}><div style={{ background: BLUE, height: '100%', width: `${progress}%` }} /></div></>}</div>
    </Paper>
  )
}

function CarouselCard({ frame, index, progress }: { frame: number; index: number; progress: number }) {
  const relative = wrap(index - 2 - progress, records.length)
  const distance = Math.abs(relative)
  const side = Math.sign(relative)
  const xMagnitude = interpolate(distance, [0, 1, 2, 2.5], [0, 410, 685, 860], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const x = side * xMagnitude
  const scale = interpolate(distance, [0, 1, 2, 2.5], [1, .88, .73, .64], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity = interpolate(distance, [0, 1, 2, 2.5], [1, .84, .52, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const blur = interpolate(distance, [0, 1, 2, 2.5], [0, 1.5, 4, 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const rotateY = -side * interpolate(distance, [0, 1, 2, 2.5], [0, 8, 15, 18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const rotateX = interpolate(distance, [0, 1, 2, 2.5], [0, -.8, -1.6, -2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const translateZ = interpolate(distance, [0, 1, 2, 2.5], [0, -70, -150, -220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const shadowOpacity = interpolate(distance, [0, 1, 2], [.16, .085, .035], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const stage = stageAt(frame)
  const stageLocal = frame - (stage - 1) * 150
  return (
    <div style={{ filter: `blur(${blur}px)`, height: 470, left: '50%', opacity, position: 'absolute', top: 0, transform: `translateX(calc(-50% + ${x}px)) translateY(${distance * 9}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`, transformOrigin: 'center center', transformStyle: 'preserve-3d', width: 430, willChange: 'transform, filter, opacity', zIndex: Math.round(100 - distance * 20) }}>
      <div style={{ opacity: stageOpacity(frame, 1), position: 'absolute' }}><SaleCard data={records[index]} frame={frame} index={index} /></div>
      <div style={{ opacity: stageOpacity(frame, 2), position: 'absolute' }}><InvoiceCard authorized={false} data={records[index]} fieldFrame={stageLocal} focused={distance < .24} /></div>
      <div style={{ opacity: stageOpacity(frame, 3), position: 'absolute' }}><InvoiceCard authorized data={records[index]} fieldFrame={stageLocal} focused={distance < .24} /></div>
      <div style={{ borderRadius: 10, boxShadow: `0 28px 62px rgba(20,36,67,${shadowOpacity})`, inset: 0, pointerEvents: 'none', position: 'absolute' }} />
    </div>
  )
}

function Carousel({ frame }: { frame: number }) {
  const progress = carouselProgress(frame)
  return <div style={{ height: 500, left: 0, perspective: 1600, perspectiveOrigin: '50% 44%', position: 'absolute', right: 0, top: 300, transformStyle: 'preserve-3d' }}>{records.map((record, index) => <CarouselCard frame={frame} index={index} key={record.number} progress={progress} />)}</div>
}

export function OttoInvoiceThreeSteps() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opening = spring({ config: { damping: 18, stiffness: 100 }, fps, frame })
  const closing = tween(frame, 438, 449, [1, 0])
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #fff 0%, #fbfcfe 55%, #f4f7fb 100%)', color: NAVY, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
      {[1, 2, 3].map((stage) => <Header frame={frame} key={stage} stage={stage as Stage} />)}
      <Carousel frame={frame} />
      <div style={{ bottom: 18, color: '#4f6484', fontSize: 14, left: 0, opacity: tween(frame, 12, 26), position: 'absolute', textAlign: 'center', width: '100%' }}>ⓘ &nbsp; Isso pode levar alguns instantes. Fique tranquilo, já estamos terminando.</div>
      <AbsoluteFill style={{ background: '#fff', opacity: Math.max(1 - opening, 1 - closing), pointerEvents: 'none', zIndex: 200 }} />
    </AbsoluteFill>
  )
}
