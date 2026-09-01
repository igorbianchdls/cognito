import type { CSSProperties, ReactNode } from 'react'
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

export const OTTO_INVOICE_TWO_STEPS_DURATION = 360

const BLUE = '#0b67f0'
const NAVY = '#071329'
const MUTED = '#60708a'
const GREEN = '#149653'
const STAGE_DURATION = OTTO_INVOICE_TWO_STEPS_DURATION / 2

const sales = [
  {customer: 'Fernanda Silva', company: 'Distribuidora FS', value: 'R$ 450,00', tax: 'R$ 22,50', service: 'Suporte técnico', note: 'Atendimento avulso', number: '00005780'},
  {customer: 'Carlos Souza', company: 'Carlos Souza ME', value: 'R$ 980,00', tax: 'R$ 49,00', service: 'Design gráfico', note: 'Projeto de identidade visual', number: '00005781'},
  {customer: 'Ana Martins', company: 'Otto Sistemas Ltda', value: 'R$ 1.250,00', tax: 'R$ 62,50', service: 'Consultoria financeira', note: 'Prestação de serviço do mês', number: '00005782'},
  {customer: 'Juliana Lima', company: 'Empresa XYZ Ltda', value: 'R$ 2.500,00', tax: 'R$ 125,00', service: 'Treinamento empresarial', note: 'Treinamento presencial', number: '00005783'},
  {customer: 'Marcos Alves', company: 'Alves Comércio Ltda', value: 'R$ 450,00', tax: 'R$ 22,50', service: 'Manutenção de sistemas', note: 'Visita técnica', number: '00005784'},
]

type Sale = (typeof sales)[number]
type Stage = 1 | 2

function tween(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function wrap(value: number, size: number) {
  return ((value + size / 2) % size + size) % size - size / 2
}

function stageAt(frame: number): Stage {
  return frame < STAGE_DURATION ? 1 : 2
}

function stageOpacity(frame: number, stage: Stage) {
  return stage === 1
    ? tween(frame, STAGE_DURATION - 15, STAGE_DURATION + 5, [1, 0])
    : tween(frame, STAGE_DURATION - 5, STAGE_DURATION + 15)
}

function carouselProgress(frame: number) {
  const moves: Array<[number, number]> = [
    [26, 55],
    [78, 107],
    [130, 159],
    [202, 231],
    [254, 283],
    [306, 335],
  ]
  return moves.reduce((total, [from, to]) => total + tween(frame, from, to), 0)
}

function Header({frame, stage}: {frame: number; stage: Stage}) {
  const copy = {
    1: ['Buscando suas vendas...', 'Localizando as vendas prontas para emissão'],
    2: ['Emitindo suas notas fiscais...', 'Gerando e enviando cada nota ao cliente'],
  }[stage]
  const opacity = stageOpacity(frame, stage)

  return (
    <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', opacity, position: 'absolute', top: 20, transform: `translateY(${(1 - opacity) * 12}px)`, width: '100%', zIndex: 30}}>
      <div style={{alignItems: 'center', background: 'rgba(245,249,255,.96)', border: '1px solid #d8e4f5', borderRadius: 13, boxShadow: '0 6px 18px rgba(31,74,135,.06)', color: BLUE, display: 'flex', fontSize: 16, fontWeight: 800, gap: 10, padding: '8px 15px'}}>
        <span style={{alignItems: 'center', background: BLUE, borderRadius: 999, color: '#fff', display: 'flex', fontSize: 12, height: 22, justifyContent: 'center', width: 22}}>{stage}</span>
        ETAPA {stage} DE 2
      </div>
      <div style={{color: '#05070d', fontSize: 62, fontWeight: 790, letterSpacing: '-.052em', lineHeight: 1, marginTop: 21}}>{copy[0]}</div>
      <div style={{color: '#405474', fontSize: 20, fontWeight: 500, marginTop: 15}}>{copy[1]}</div>
      <div style={{alignItems: 'center', display: 'flex', marginTop: 20}}>
        {[1, 2].map((dot, index) => (
          <div key={dot} style={{alignItems: 'center', display: 'flex'}}>
            {index > 0 ? <span style={{background: '#aeb9ca', height: 2, width: 104}} /> : null}
            <span style={{background: dot === stage ? BLUE : '#8795aa', borderRadius: 999, boxShadow: dot === stage ? '0 0 0 5px #e5f0ff' : 'none', height: 13, width: 13}} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Paper({children, style}: {children: ReactNode; style?: CSSProperties}) {
  return (
    <div style={{background: '#fff', border: '1px solid #d7dee8', borderRadius: 11, boxShadow: '0 24px 55px rgba(30,45,72,.12), 0 4px 13px rgba(30,45,72,.07)', height: 470, overflow: 'hidden', position: 'relative', width: 430, ...style}}>
      {children}
    </div>
  )
}

function Avatar({index}: {index: number}) {
  return <div style={{backgroundImage: `url(${staticFile('remotion/invoice-three-steps/avatar-sheet.png')})`, backgroundPosition: `${index * 25}% center`, backgroundRepeat: 'no-repeat', backgroundSize: '500% auto', border: '3px solid white', borderRadius: 999, boxShadow: '0 4px 13px rgba(15,23,42,.14)', height: 56, width: 56}} />
}

function SaleRow({label, value}: {label: string; value: string}) {
  return (
    <div style={{alignItems: 'center', borderBottom: '1px solid #e9edf3', display: 'flex', justifyContent: 'space-between', minHeight: 48}}>
      <span style={{color: '#66758b', fontSize: 13}}>{label}</span>
      <strong style={{color: '#101828', fontSize: 14, maxWidth: 245, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{value}</strong>
    </div>
  )
}

function SaleCard({data, index, localFrame}: {data: Sale; index: number; localFrame: number}) {
  const scan = interpolate(localFrame % 50, [0, 36, 50], [34, 82, 34], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

  return (
    <Paper>
      <div style={{padding: '20px 24px 0'}}>
        <div style={{alignItems: 'center', borderBottom: '1px solid #e5eaf1', display: 'flex', justifyContent: 'space-between', paddingBottom: 14}}>
          <div style={{alignItems: 'center', color: BLUE, display: 'flex', fontSize: 17, fontWeight: 750, gap: 10}}><span style={{border: `2px solid ${BLUE}`, borderRadius: 6, fontSize: 14, padding: '2px 5px'}}>↗</span>Venda encontrada</div>
          <span style={{background: '#edf5ff', borderRadius: 7, color: BLUE, fontSize: 12, fontWeight: 700, padding: '7px 10px'}}>Pronta para emitir</span>
        </div>
        <div style={{alignItems: 'center', display: 'flex', gap: 15, padding: '16px 0 10px'}}>
          <Avatar index={index} />
          <div><strong style={{color: '#101828', display: 'block', fontSize: 19}}>{data.customer}</strong><span style={{color: '#66758b', fontSize: 12}}>{data.customer.toLowerCase().replace(' ', '.')}@email.com</span></div>
        </div>
        <div style={{marginTop: 4}}>
          <SaleRow label="Cliente" value={data.company} />
          <SaleRow label="Valor da venda" value={data.value} />
          <SaleRow label="Serviço" value={data.service} />
          <SaleRow label="Data da venda" value="17/05/2025" />
          <SaleRow label="Observação" value={data.note} />
        </div>
      </div>
      <div style={{bottom: 15, left: 24, position: 'absolute', right: 24}}>
        <div style={{color: '#66758b', fontSize: 12}}>⌕ &nbsp;Buscando vendas prontas para emissão...</div>
        <div style={{background: '#e6ebf1', borderRadius: 99, height: 5, marginTop: 9, overflow: 'hidden'}}><div style={{background: BLUE, borderRadius: 99, height: '100%', width: `${scan}%`}} /></div>
      </div>
    </Paper>
  )
}

function TinyQr() {
  return <div style={{backgroundColor: '#fff', backgroundImage: 'repeating-linear-gradient(0deg,#111 0 2px,transparent 2px 4px),repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 5px)', border: '3px solid #111', height: 38, width: 38}} />
}

function FiscalLine({label, value}: {label: string; value: string}) {
  return <div><span style={{color: '#718096', display: 'inline-block', fontSize: 8, textTransform: 'uppercase', width: 115}}>{label}</span><strong style={{color: '#111827', fontSize: 10}}>{value}</strong></div>
}

function FiscalSection({children, title}: {children: ReactNode; title: string}) {
  return <div style={{borderTop: '1px solid #dce2e9', padding: '9px 13px 7px'}}><div style={{color: '#56657a', fontSize: 8, fontWeight: 800, marginBottom: 6, textTransform: 'uppercase'}}>{title}</div>{children}</div>
}

function InvoiceCard({data, localFrame}: {data: Sale; localFrame: number}) {
  const cycleFrame = localFrame % 52
  const authorized = tween(cycleFrame, 24, 38)
  const status = authorized > 0.5 ? '✓ Autorizada' : 'Emitindo...'

  return (
    <Paper>
      <div style={{padding: '13px 14px 0'}}>
        <div style={{alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <strong style={{color: '#161b24', display: 'block', fontSize: 11}}>NOTA FISCAL DE SERVIÇO ELETRÔNICA — NFS-e</strong>
            <div style={{alignItems: 'center', display: 'flex', gap: 8, marginTop: 7}}><strong style={{fontSize: 10}}>NFS-e Nº {data.number}</strong><span style={{background: authorized > 0.5 ? '#e8f8ef' : '#edf5ff', borderRadius: 99, color: authorized > 0.5 ? GREEN : BLUE, fontSize: 8, fontWeight: 800, padding: '4px 7px'}}>{status}</span></div>
            <span style={{color: '#5e6c80', display: 'block', fontSize: 9, marginTop: 6}}>17/05/2025 · 10:{data.number.slice(-2)}</span>
          </div>
          <div style={{alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 5}}><TinyQr /><span style={{color: '#6b7280', fontSize: 6}}>CÓDIGO DE VERIFICAÇÃO</span></div>
        </div>
      </div>
      <div style={{borderTop: '1px solid #dce2e9', display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', marginTop: 10}}>
        {[['COMPETÊNCIA', '05/2025'], ['MUNICÍPIO DE INCIDÊNCIA', 'Recife · PE'], ['NATUREZA DA OPERAÇÃO', 'Tributação no município']].map(([label, value], index) => <div key={label} style={{borderRight: index < 2 ? '1px solid #dce2e9' : 'none', padding: '8px 11px'}}><span style={{color: '#718096', display: 'block', fontSize: 7}}>{label}</span><strong style={{fontSize: 9}}>{value}</strong></div>)}
      </div>
      <FiscalSection title="Prestador de serviços"><FiscalLine label="Razão social" value="OTTO SISTEMAS LTDA" /><FiscalLine label="CNPJ" value="25.638.123/0001-45" /><FiscalLine label="Inscrição municipal" value="123.456-7" /></FiscalSection>
      <FiscalSection title="Tomador de serviços"><FiscalLine label="Nome / Razão social" value={data.customer.toUpperCase()} /><FiscalLine label="CPF / CNPJ" value="234.567.890-11" /><FiscalLine label="Município" value="Recife · PE" /></FiscalSection>
      <FiscalSection title="Descrição dos serviços"><strong style={{color: '#111827', fontSize: 10}}>{data.service}</strong><div style={{color: '#657287', fontSize: 8, marginTop: 4}}>{data.note}</div></FiscalSection>
      <div style={{borderTop: '1px solid #dce2e9', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)'}}>
        {[['VALOR DO SERVIÇO', data.value], ['BASE DE CÁLCULO', data.value], ['ALÍQUOTA ISS', '5,00%'], ['VALOR DO ISS', data.tax]].map(([label, value], index) => <div key={label} style={{borderRight: index < 3 ? '1px solid #dce2e9' : 'none', padding: '8px 7px'}}><span style={{color: '#718096', display: 'block', fontSize: 6}}>{label}</span><strong style={{fontSize: 9}}>{value}</strong></div>)}
      </div>
      <div style={{alignItems: 'center', background: '#fff', borderTop: '1px solid #dce2e9', bottom: 52, display: 'flex', justifyContent: 'space-between', left: 0, padding: '7px 13px', position: 'absolute', right: 0}}><span style={{fontSize: 9, fontWeight: 800}}>VALOR TOTAL DA NOTA</span><strong style={{fontSize: 17}}>{data.value}</strong></div>
      <div style={{background: '#fff', borderTop: '1px solid #e2e7ed', bottom: 0, left: 0, padding: '9px 13px', position: 'absolute', right: 0}}>
        <div style={{alignItems: 'center', display: 'flex'}}>
          <span style={{alignItems: 'center', background: authorized > 0.5 ? GREEN : BLUE, borderRadius: 99, color: '#fff', display: 'flex', fontSize: 11, fontWeight: 900, height: 22, justifyContent: 'center', width: 22}}>{authorized > 0.5 ? '✓' : '↻'}</span>
          <div style={{flex: 1, marginLeft: 8}}><strong style={{color: authorized > 0.5 ? GREEN : BLUE, display: 'block', fontSize: 10}}>{authorized > 0.5 ? 'Nota fiscal autorizada com sucesso' : 'Emitindo nota fiscal...'}</strong><span style={{color: '#6b7280', fontSize: 7}}>{authorized > 0.5 ? `Enviada para ${data.customer.toLowerCase().replace(' ', '.')}@email.com` : 'Validando dados junto à prefeitura'}</span></div>
          <span style={{background: authorized > 0.5 ? BLUE : '#edf5ff', borderRadius: 6, boxShadow: authorized > 0.5 ? '0 6px 14px rgba(11,103,240,.22)' : 'none', color: authorized > 0.5 ? '#fff' : BLUE, fontSize: 9, fontWeight: 800, padding: '9px 12px'}}>{authorized > 0.5 ? 'Ver DANFS-e ↗' : 'Processando'}</span>
        </div>
      </div>
    </Paper>
  )
}

function CarouselCard({frame, index, progress}: {frame: number; index: number; progress: number}) {
  const relative = wrap(index - 2 - progress, sales.length)
  const distance = Math.abs(relative)
  const side = Math.sign(relative)
  const xMagnitude = interpolate(distance, [0, 1, 2, 2.5], [0, 410, 685, 860], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const x = side * xMagnitude
  const scale = interpolate(distance, [0, 1, 2, 2.5], [1, 0.88, 0.73, 0.64], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const opacity = interpolate(distance, [0, 1, 2, 2.5], [1, 0.84, 0.52, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const blur = interpolate(distance, [0, 1, 2, 2.5], [0, 1.5, 4, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const rotateY = -side * interpolate(distance, [0, 1, 2, 2.5], [0, 8, 15, 18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const rotateX = interpolate(distance, [0, 1, 2, 2.5], [0, -0.8, -1.6, -2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const translateZ = interpolate(distance, [0, 1, 2, 2.5], [0, -70, -150, -220], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const shadowOpacity = interpolate(distance, [0, 1, 2], [0.16, 0.085, 0.035], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const localFrame = frame - (stageAt(frame) - 1) * STAGE_DURATION

  return (
    <div style={{filter: `blur(${blur}px)`, height: 470, left: '50%', opacity, position: 'absolute', top: 0, transform: `translateX(calc(-50% + ${x}px)) translateY(${distance * 9}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`, transformOrigin: 'center center', transformStyle: 'preserve-3d', width: 430, willChange: 'transform, filter, opacity', zIndex: Math.round(100 - distance * 20)}}>
      <div style={{opacity: stageOpacity(frame, 1), position: 'absolute'}}><SaleCard data={sales[index]} index={index} localFrame={localFrame} /></div>
      <div style={{opacity: stageOpacity(frame, 2), position: 'absolute'}}><InvoiceCard data={sales[index]} localFrame={localFrame} /></div>
      <div style={{borderRadius: 11, boxShadow: `0 28px 62px rgba(20,36,67,${shadowOpacity})`, inset: 0, pointerEvents: 'none', position: 'absolute'}} />
    </div>
  )
}

function Carousel({frame}: {frame: number}) {
  const progress = carouselProgress(frame)
  return <div style={{height: 500, left: 0, perspective: 1600, perspectiveOrigin: '50% 44%', position: 'absolute', right: 0, top: 300, transformStyle: 'preserve-3d'}}>{sales.map((sale, index) => <CarouselCard frame={frame} index={index} key={sale.number} progress={progress} />)}</div>
}

export function OttoInvoiceTwoSteps() {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const opening = spring({config: {damping: 18, stiffness: 100}, fps, frame})
  const closing = tween(frame, OTTO_INVOICE_TWO_STEPS_DURATION - 12, OTTO_INVOICE_TWO_STEPS_DURATION - 1, [1, 0])

  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #fff 0%, #fbfcfe 55%, #f4f7fb 100%)', color: NAVY, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden'}}>
      {[1, 2].map((stage) => <Header frame={frame} key={stage} stage={stage as Stage} />)}
      <Carousel frame={frame} />
      <div style={{bottom: 18, color: MUTED, fontSize: 14, left: 0, opacity: tween(frame, 12, 26), position: 'absolute', textAlign: 'center', width: '100%'}}>ⓘ &nbsp; As vendas são localizadas e as notas emitidas automaticamente.</div>
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(1 - opening, 1 - closing), pointerEvents: 'none', zIndex: 200}} />
    </AbsoluteFill>
  )
}
