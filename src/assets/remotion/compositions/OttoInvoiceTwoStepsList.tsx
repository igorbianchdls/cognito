import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion'

export const OTTO_INVOICE_TWO_STEPS_LIST_DURATION = 360

const BLUE = '#0b67f0'
const GREEN = '#149653'
const NAVY = '#071329'
const STAGE_CHANGE = 168

const sales = [
  {customer: 'Fernanda Silva', company: 'Distribuidora FS', number: 'NFS-e 00005780', service: 'Suporte técnico', value: 'R$ 450,00'},
  {customer: 'Carlos Souza', company: 'Carlos Souza ME', number: 'NFS-e 00005781', service: 'Design gráfico', value: 'R$ 980,00'},
  {customer: 'Ana Martins', company: 'Otto Sistemas Ltda', number: 'NFS-e 00005782', service: 'Consultoria financeira', value: 'R$ 1.250,00'},
  {customer: 'Juliana Lima', company: 'Empresa XYZ Ltda', number: 'NFS-e 00005783', service: 'Treinamento empresarial', value: 'R$ 2.500,00'},
  {customer: 'Marcos Alves', company: 'Alves Comércio Ltda', number: 'NFS-e 00005784', service: 'Manutenção de sistemas', value: 'R$ 450,00'},
]

type Stage = 1 | 2

function tween(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function stageOpacity(frame: number, stage: Stage) {
  return stage === 1 ? tween(frame, STAGE_CHANGE - 12, STAGE_CHANGE + 8, [1, 0]) : tween(frame, STAGE_CHANGE - 4, STAGE_CHANGE + 16)
}

function Avatar({index}: {index: number}) {
  return (
    <div style={{
      backgroundImage: `url(${staticFile('remotion/invoice-three-steps/avatar-sheet.png')})`,
      backgroundPosition: `${index * 25}% center`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '500% auto',
      border: '3px solid #ffffff',
      borderRadius: 999,
      boxShadow: '0 5px 15px rgba(15,23,42,.13)',
      height: 52,
      width: 52,
    }} />
  )
}

function FiscalInvoiceThumbnail({number}: {number: string}) {
  const shortNumber = number.replace('NFS-e ', '')
  return (
    <div style={{background: '#fff', border: '1px solid #bfc9d7', borderRadius: 4, boxShadow: '0 6px 15px rgba(15,23,42,.14)', height: 60, overflow: 'hidden', padding: '4px 4px 3px', position: 'relative', width: 52}}>
      <div style={{alignItems: 'flex-start', borderBottom: '1px solid #ccd4df', display: 'flex', height: 13, justifyContent: 'space-between', paddingBottom: 2}}>
        <div>
          <strong style={{color: '#1f2937', display: 'block', fontSize: 3.7, letterSpacing: '-.02em', lineHeight: 1}}>NOTA FISCAL</strong>
          <span style={{color: '#59677a', display: 'block', fontSize: 2.7, lineHeight: 1.2}}>DE SERVIÇOS · NFS-e</span>
        </div>
        <div style={{backgroundColor: '#fff', backgroundImage: 'repeating-linear-gradient(0deg,#111 0 1px,transparent 1px 2px),repeating-linear-gradient(90deg,#111 0 1px,transparent 1px 2px)', border: '1px solid #111', height: 9, width: 9}} />
      </div>
      <div style={{alignItems: 'center', borderBottom: '1px solid #d8dee7', display: 'flex', height: 8, justifyContent: 'space-between'}}><span style={{color: '#6b7280', fontSize: 2.6}}>NÚMERO</span><strong style={{color: '#111827', fontSize: 3.3}}>{shortNumber}</strong></div>
      {[['PRESTADOR', 'OTTO SISTEMAS LTDA'], ['TOMADOR', 'DADOS DO CLIENTE'], ['SERVIÇO', 'DESCRIÇÃO E VALORES']].map(([label, value]) => (
        <div key={label} style={{borderBottom: '1px solid #d8dee7', height: 8, paddingTop: 1}}><span style={{color: '#718096', display: 'block', fontSize: 2.2, lineHeight: 1}}>{label}</span><strong style={{color: '#263244', display: 'block', fontSize: 2.7, lineHeight: 1.2}}>{value}</strong></div>
      ))}
      <div style={{display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3,1fr)', marginTop: 2}}>{[0, 1, 2].map((cell) => <span key={cell} style={{background: cell === 2 ? '#dbeafe' : '#e7ebf0', borderRadius: 1, height: 5}} />)}</div>
      <span style={{background: GREEN, borderRadius: 99, bottom: 2, height: 3, position: 'absolute', right: 3, width: 11}} />
    </div>
  )
}

function Spinner({active, color}: {active: boolean; color: string}) {
  const frame = useCurrentFrame()
  return active ? (
    <span style={{border: '3px solid #d9e1ec', borderRadius: 999, borderRightColor: color, display: 'block', height: 25, transform: `rotate(${frame * 18}deg)`, width: 25}} />
  ) : (
    <span style={{alignItems: 'center', background: GREEN, borderRadius: 999, color: '#fff', display: 'flex', fontSize: 14, fontWeight: 900, height: 25, justifyContent: 'center', width: 25}}>✓</span>
  )
}

function SceneHeader({frame, stage}: {frame: number; stage: Stage}) {
  const opacity = stageOpacity(frame, stage)
  const copy = stage === 1
    ? ['Buscando suas vendas...', 'Localizando as vendas prontas para emissão']
    : ['Emitindo suas notas fiscais...', 'Gerando e enviando cada nota ao cliente']

  return (
    <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', opacity, position: 'absolute', top: 20, transform: `translateY(${(1 - opacity) * 12}px)`, width: '100%', zIndex: 20}}>
      <div style={{alignItems: 'center', background: 'rgba(245,249,255,.96)', border: '1px solid #d8e4f5', borderRadius: 13, boxShadow: '0 6px 18px rgba(31,74,135,.06)', color: BLUE, display: 'flex', fontSize: 16, fontWeight: 800, gap: 10, padding: '8px 15px'}}>
        <span style={{alignItems: 'center', background: BLUE, borderRadius: 999, color: '#fff', display: 'flex', fontSize: 12, height: 22, justifyContent: 'center', width: 22}}>{stage}</span>
        ETAPA {stage} DE 2
      </div>
      <div style={{color: '#05070d', fontSize: 58, fontWeight: 790, letterSpacing: '-.05em', lineHeight: 1, marginTop: 20}}>{copy[0]}</div>
      <div style={{color: '#405474', fontSize: 20, fontWeight: 500, marginTop: 14}}>{copy[1]}</div>
      <div style={{alignItems: 'center', display: 'flex', marginTop: 18}}>
        <span style={{background: stage === 1 ? BLUE : '#8795aa', borderRadius: 999, boxShadow: stage === 1 ? '0 0 0 5px #e5f0ff' : 'none', height: 13, width: 13}} />
        <span style={{background: '#aeb9ca', height: 2, width: 104}} />
        <span style={{background: stage === 2 ? BLUE : '#8795aa', borderRadius: 999, boxShadow: stage === 2 ? '0 0 0 5px #e5f0ff' : 'none', height: 13, width: 13}} />
      </div>
    </div>
  )
}

function StatusPill({background, color, label}: {background: string; color: string; label: string}) {
  return <span style={{background, border: `1px solid ${color}22`, borderRadius: 999, color, fontSize: 15, fontWeight: 760, minWidth: 144, padding: '9px 13px', textAlign: 'center', whiteSpace: 'nowrap'}}>{label}</span>
}

function ResultRow({frame, index}: {frame: number; index: number}) {
  const sale = sales[index]
  const rowIn = tween(frame, 30 + index * 13, 46 + index * 13)
  const stageTwo = stageOpacity(frame, 2)
  const stageTwoLocal = frame - STAGE_CHANGE
  const fiscalRowIn = index === 0 ? 1 : tween(stageTwoLocal, 18 + index * 28, 38 + index * 28)
  const visible = interpolate(stageTwo, [0, 1], [rowIn, fiscalRowIn])
  const searchDone = frame >= 78 + index * 13
  const issueFrame = frame - STAGE_CHANGE - index * 22
  const authorized = issueFrame >= 72
  const emitting = issueFrame >= 30 && !authorized
  const status = stageTwo < 0.5
    ? searchDone
      ? {background: '#ecfdf3', color: '#166534', label: 'Pronta para emitir'}
      : {background: '#eff6ff', color: BLUE, label: 'Localizando...'}
    : authorized
      ? {background: '#ecfdf3', color: '#166534', label: 'Autorizada'}
      : emitting
        ? {background: '#eff6ff', color: BLUE, label: 'Emitindo...'}
        : {background: '#fff7ed', color: '#c2410c', label: 'Preparando...'}

  return (
    <div style={{alignItems: 'center', background: '#ffffff', borderTop: '1px solid #edf0f4', display: 'grid', gap: 16, gridTemplateColumns: '52px minmax(0,1fr) 130px 158px 28px', height: 76, opacity: visible, padding: '0 26px', transform: `translateY(${(1 - visible) * 18}px)`}}>
      <div style={{height: 52, position: 'relative', width: 52}}>
        <div style={{inset: 0, opacity: 1 - stageTwo, position: 'absolute', transform: `scale(${1 - stageTwo * 0.12}) rotate(${-stageTwo * 6}deg)`}}><Avatar index={index} /></div>
        <div style={{inset: 0, opacity: stageTwo, position: 'absolute', transform: `scale(${0.88 + stageTwo * 0.12}) rotate(${(1 - stageTwo) * 5}deg)`}}><FiscalInvoiceThumbnail number={sale.number} /></div>
      </div>
      <div style={{display: 'grid', gap: 6, minWidth: 0, position: 'relative'}}>
        <strong style={{color: '#111827', fontSize: 20, fontWeight: 650, letterSpacing: '-.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{sale.customer}</strong>
        <div style={{height: 17, position: 'relative'}}>
          <span style={{color: '#7a8799', fontSize: 14, left: 0, opacity: 1 - stageTwo, overflow: 'hidden', position: 'absolute', textOverflow: 'ellipsis', top: 0, whiteSpace: 'nowrap'}}>{sale.company} · {sale.service}</span>
          <span style={{color: '#66758b', fontSize: 14, left: 0, opacity: stageTwo, overflow: 'hidden', position: 'absolute', textOverflow: 'ellipsis', top: 0, whiteSpace: 'nowrap'}}>{sale.number} · {sale.service}</span>
        </div>
      </div>
      <strong style={{color: '#111827', fontSize: 18, fontWeight: 620, textAlign: 'right', whiteSpace: 'nowrap'}}>{sale.value}</strong>
      <StatusPill {...status} />
      <Spinner active={stageTwo < 0.5 ? !searchDone : !authorized} color={status.color} />
    </div>
  )
}

function ListContainer({frame}: {frame: number}) {
  const show = tween(frame, 16, 34)
  const stageTwo = stageOpacity(frame, 2)
  const stageTwoLocal = frame - STAGE_CHANGE
  const searchProgress = Math.round(interpolate(tween(frame, 22, 125), [0, 1], [12, 100]))
  const headerHeight = interpolate(stageTwo, [0, 1], [104, 0])
  const fiscalRowsHeight = 76 * (1 + sales.slice(1).reduce((total, _, index) => total + tween(stageTwoLocal, 46 + index * 28, 66 + index * 28), 0))
  const containerHeight = interpolate(stageTwo, [0, 1], [104 + sales.length * 76, fiscalRowsHeight])

  return (
    <div style={{left: '50%', opacity: show, position: 'absolute', top: 272, transform: `translateX(-50%) translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})`, width: 1030}}>
      <div style={{background: '#fff', border: '1px solid #dfe5ed', borderRadius: 25, boxShadow: '0 28px 70px rgba(20,36,67,.13), 0 7px 20px rgba(20,36,67,.06)', height: containerHeight, overflow: 'hidden'}}>
        <div style={{alignItems: 'center', display: 'flex', height: headerHeight, justifyContent: 'space-between', opacity: 1 - stageTwo, overflow: 'hidden', padding: '0 28px'}}>
          <div style={{display: 'grid', gap: 6}}><strong style={{color: '#111827', fontSize: 24, fontWeight: 680}}>Vendas encontradas</strong><span style={{color: '#7b8798', fontSize: 16}}>Registros disponíveis para emissão fiscal</span></div>
          <span style={{background: searchProgress === 100 ? '#ecfdf3' : '#eff6ff', border: `1px solid ${searchProgress === 100 ? '#bbf7d0' : '#cfe2ff'}`, borderRadius: 999, color: searchProgress === 100 ? GREEN : BLUE, fontSize: 18, fontWeight: 750, padding: '10px 15px'}}>{searchProgress}%</span>
        </div>
        {sales.map((sale, index) => <ResultRow frame={frame} index={index} key={sale.number} />)}
      </div>
    </div>
  )
}

export function OttoInvoiceTwoStepsList() {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const opening = spring({config: {damping: 18, stiffness: 100}, fps, frame})
  const closing = tween(frame, OTTO_INVOICE_TWO_STEPS_LIST_DURATION - 12, OTTO_INVOICE_TWO_STEPS_LIST_DURATION - 1, [1, 0])

  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #fff 0%, #fbfcfe 56%, #f3f6fa 100%)', color: NAVY, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden'}}>
      {[1, 2].map((stage) => <SceneHeader frame={frame} key={stage} stage={stage as Stage} />)}
      <ListContainer frame={frame} />
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(1 - opening, 1 - closing), pointerEvents: 'none', zIndex: 200}} />
    </AbsoluteFill>
  )
}
