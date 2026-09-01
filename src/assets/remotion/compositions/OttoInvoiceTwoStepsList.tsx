import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion'

export const OTTO_INVOICE_TWO_STEPS_LIST_DURATION = 360

const BLUE = '#0b67f0'
const GREEN = '#149653'
const NAVY = '#071329'
const STAGE_CHANGE = 168
const CONTAINER_BOTTOM_GAP = 16

const sales = [
  {company: 'Distribuidora FS', mark: 'FS', number: 'NFS-e 00005780', service: 'Suporte técnico', tone: '#2563eb', value: 'R$ 450,00'},
  {company: 'Carlos Souza ME', mark: 'CS', number: 'NFS-e 00005781', service: 'Design gráfico', tone: '#7c3aed', value: 'R$ 980,00'},
  {company: 'Otto Sistemas Ltda', mark: 'O', number: 'NFS-e 00005782', service: 'Consultoria financeira', tone: '#0f766e', value: 'R$ 1.250,00'},
  {company: 'Empresa XYZ Ltda', mark: 'XYZ', number: 'NFS-e 00005783', service: 'Treinamento empresarial', tone: '#ea580c', value: 'R$ 2.500,00'},
  {company: 'Alves Comércio Ltda', mark: 'AC', number: 'NFS-e 00005784', service: 'Manutenção de sistemas', tone: '#dc2626', value: 'R$ 450,00'},
  {company: 'Beta Digital Ltda', mark: 'B', number: 'NFS-e 00005785', service: 'Marketing digital', tone: '#0891b2', value: 'R$ 3.200,00'},
  {company: 'Costa Arquitetura', mark: 'CA', number: 'NFS-e 00005786', service: 'Projeto arquitetônico', tone: '#4f46e5', value: 'R$ 4.800,00'},
  {company: 'Mendes Tecnologia', mark: 'MT', number: 'NFS-e 00005787', service: 'Desenvolvimento de software', tone: '#0284c7', value: 'R$ 6.900,00'},
  {company: 'Rocha Consultoria', mark: 'RC', number: 'NFS-e 00005788', service: 'Assessoria empresarial', tone: '#9333ea', value: 'R$ 2.850,00'},
  {company: 'GL Comércio Ltda', mark: 'GL', number: 'NFS-e 00005789', service: 'Gestão comercial', tone: '#16a34a', value: 'R$ 5.300,00'},
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

function CompanyLogo({index}: {index: number}) {
  const sale = sales[index]
  return (
    <div style={{
      alignItems: 'center',
      background: `linear-gradient(145deg, ${sale.tone} 0%, ${sale.tone}d9 100%)`,
      border: '3px solid #ffffff',
      borderRadius: index % 3 === 0 ? 14 : index % 3 === 1 ? 999 : 11,
      boxShadow: `0 5px 15px ${sale.tone}2e`,
      color: '#ffffff',
      display: 'flex',
      fontSize: sale.mark.length > 2 ? 11 : 15,
      fontWeight: 850,
      height: 52,
      justifyContent: 'center',
      letterSpacing: '-.03em',
      width: 52,
    }}>{sale.mark}</div>
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

function Spinner({active, color, compact}: {active: boolean; color: string; compact?: boolean}) {
  const frame = useCurrentFrame()
  const size = compact ? 20 : 25
  return active ? (
    <span style={{border: compact ? '2px solid #d9e1ec' : '3px solid #d9e1ec', borderRadius: 999, borderRightColor: color, display: 'block', height: size, transform: `rotate(${frame * 18}deg)`, width: size}} />
  ) : (
    <span style={{alignItems: 'center', background: GREEN, borderRadius: 999, color: '#fff', display: 'flex', fontSize: compact ? 11 : 14, fontWeight: 900, height: size, justifyContent: 'center', width: size}}>✓</span>
  )
}

function SceneHeader({compact, frame, stage}: {compact?: boolean; frame: number; stage: Stage}) {
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
      <div style={{color: '#05070d', fontSize: compact ? 54 : 58, fontWeight: 790, letterSpacing: '-.05em', lineHeight: 1, marginTop: compact ? 17 : 20}}>{copy[0]}</div>
      {!compact ? <div style={{color: '#405474', fontSize: 20, fontWeight: 500, marginTop: 14}}>{copy[1]}</div> : null}
      <div style={{alignItems: 'center', display: 'flex', marginTop: compact ? 16 : 18}}>
        <span style={{background: stage === 1 ? BLUE : '#8795aa', borderRadius: 999, boxShadow: stage === 1 ? '0 0 0 5px #e5f0ff' : 'none', height: 13, width: 13}} />
        <span style={{background: '#aeb9ca', height: 2, width: 104}} />
        <span style={{background: stage === 2 ? BLUE : '#8795aa', borderRadius: 999, boxShadow: stage === 2 ? '0 0 0 5px #e5f0ff' : 'none', height: 13, width: 13}} />
      </div>
    </div>
  )
}

function StatusPill({background, color, compact, label}: {background: string; color: string; compact?: boolean; label: string}) {
  return <span style={{background, border: `1px solid ${color}22`, borderRadius: 999, color, fontSize: compact ? 12 : 15, fontWeight: 760, minWidth: compact ? 116 : 144, padding: compact ? '7px 10px' : '9px 13px', textAlign: 'center', whiteSpace: 'nowrap'}}>{label}</span>
}

function ResultRow({compact, frame, index}: {compact?: boolean; frame: number; index: number}) {
  const sale = sales[index]
  const rowHeight = compact ? 53 : 76
  const iconScale = compact ? 0.72 : 1
  const fiscalDelay = compact ? 14 : 28
  const issueDelay = compact ? 14 : 22
  const rowIn = tween(frame, 30 + index * 13, 46 + index * 13)
  const stageTwo = stageOpacity(frame, 2)
  const stageTwoLocal = frame - STAGE_CHANGE
  const fiscalRowIn = index === 0 ? 1 : tween(stageTwoLocal, 12 + index * fiscalDelay, 26 + index * fiscalDelay)
  const visible = interpolate(stageTwo, [0, 1], [rowIn, fiscalRowIn])
  const searchDone = frame >= 78 + index * 13
  const issueFrame = frame - STAGE_CHANGE - index * issueDelay
  const authorized = issueFrame >= (compact ? 64 : 72)
  const emitting = issueFrame >= (compact ? 24 : 30) && !authorized
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
    <div style={{alignItems: 'center', background: '#ffffff', borderTop: '1px solid #edf0f4', display: 'grid', gap: compact ? 11 : 16, gridTemplateColumns: compact ? '40px minmax(0,1fr) 105px 126px 22px' : '52px minmax(0,1fr) 130px 158px 28px', height: rowHeight, opacity: visible, padding: compact ? '0 20px' : '0 26px', transform: `translateY(${(1 - visible) * (compact ? 12 : 18)}px)`}}>
      <div style={{height: compact ? 40 : 52, position: 'relative', width: compact ? 40 : 52}}>
        <div style={{inset: 0, opacity: 1 - stageTwo, position: 'absolute', transform: `scale(${iconScale * (1 - stageTwo * 0.12)}) rotate(${-stageTwo * 6}deg)`, transformOrigin: 'top left'}}><CompanyLogo index={index} /></div>
        <div style={{inset: 0, opacity: stageTwo, position: 'absolute', transform: `scale(${iconScale * (0.88 + stageTwo * 0.12)}) rotate(${(1 - stageTwo) * 5}deg)`, transformOrigin: 'top left'}}><FiscalInvoiceThumbnail number={sale.number} /></div>
      </div>
      <div style={{display: 'grid', gap: compact ? 4 : 6, minWidth: 0, position: 'relative'}}>
        <strong style={{color: '#111827', fontSize: compact ? 16 : 20, fontWeight: 650, letterSpacing: '-.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{sale.company}</strong>
        <div style={{height: compact ? 13 : 17, position: 'relative'}}>
          <span style={{color: '#7a8799', fontSize: compact ? 11 : 14, left: 0, opacity: 1 - stageTwo, overflow: 'hidden', position: 'absolute', textOverflow: 'ellipsis', top: 0, whiteSpace: 'nowrap'}}>{sale.service}</span>
          <span style={{color: '#66758b', fontSize: compact ? 11 : 14, left: 0, opacity: stageTwo, overflow: 'hidden', position: 'absolute', textOverflow: 'ellipsis', top: 0, whiteSpace: 'nowrap'}}>{sale.number} · {sale.service}</span>
        </div>
      </div>
      <strong style={{color: '#111827', fontSize: compact ? 14 : 18, fontWeight: 620, textAlign: 'right', whiteSpace: 'nowrap'}}>{sale.value}</strong>
      <StatusPill {...status} compact={compact} />
      <Spinner active={stageTwo < 0.5 ? !searchDone : !authorized} color={status.color} compact={compact} />
    </div>
  )
}

function ListContainer({compact, frame, itemsCount}: {compact?: boolean; frame: number; itemsCount: number}) {
  const visibleSales = sales.slice(0, itemsCount)
  const rowHeight = compact ? 53 : 76
  const headerHeight = compact ? 72 : 104
  const bottomGap = compact ? 12 : CONTAINER_BOTTOM_GAP
  const issueDelay = compact ? 14 : 22
  const show = tween(frame, 16, 34)
  const stageTwo = stageOpacity(frame, 2)
  const stageTwoLocal = frame - STAGE_CHANGE
  const searchProgress = Math.round(interpolate(tween(frame, 22, 125), [0, 1], [12, 100]))
  const completedCount = visibleSales.filter((_, index) => frame - STAGE_CHANGE - index * issueDelay >= (compact ? 64 : 72)).length
  const issueProgress = Math.round((completedCount / visibleSales.length) * 100)
  const searchRowsHeight = rowHeight * (1 + visibleSales.slice(1).reduce((total, _, index) => total + tween(frame, 43 + index * 13, 59 + index * 13), 0))
  const fiscalRowsHeight = rowHeight * (1 + visibleSales.slice(1).reduce((total, _, index) => total + tween(stageTwoLocal, compact ? 26 + index * 14 : 46 + index * 28, compact ? 40 + index * 14 : 66 + index * 28), 0))
  const containerHeight = interpolate(stageTwo, [0, 1], [headerHeight + searchRowsHeight + bottomGap, headerHeight + fiscalRowsHeight + bottomGap])

  return (
    <div style={{left: '50%', opacity: show, position: 'absolute', top: compact ? 220 : 272, transform: `translateX(-50%) translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})`, width: compact ? 1040 : 1030}}>
      <div style={{background: '#fff', border: '1px solid #dfe5ed', borderRadius: compact ? 20 : 25, boxShadow: '0 28px 70px rgba(20,36,67,.13), 0 7px 20px rgba(20,36,67,.06)', height: containerHeight, overflow: 'hidden'}}>
        <div style={{alignItems: 'center', display: 'flex', height: headerHeight, justifyContent: 'space-between', overflow: 'hidden', padding: compact ? '0 22px' : '0 28px'}}>
          <div style={{height: compact ? 28 : 54, position: 'relative', width: 650}}>
            <div style={{display: 'grid', gap: 6, left: 0, opacity: 1 - stageTwo, position: 'absolute', top: 0}}><strong style={{color: '#111827', fontSize: compact ? 21 : 24, fontWeight: 680}}>Vendas encontradas</strong>{!compact ? <span style={{color: '#7b8798', fontSize: 16}}>Registros disponíveis para emissão fiscal</span> : null}</div>
            <div style={{display: 'grid', gap: 6, left: 0, opacity: stageTwo, position: 'absolute', top: 0}}><strong style={{color: '#111827', fontSize: compact ? 21 : 24, fontWeight: 680}}>{completedCount === visibleSales.length ? `${visibleSales.length} notas emitidas` : 'Emitindo notas fiscais'}</strong>{!compact ? <span style={{color: '#7b8798', fontSize: 16}}>{completedCount === visibleSales.length ? 'Notas autorizadas e enviadas aos clientes' : 'Gerando uma NFS-e para cada venda encontrada'}</span> : null}</div>
          </div>
          <div style={{height: 44, position: 'relative', width: 78}}>
            <span style={{background: searchProgress === 100 ? '#ecfdf3' : '#eff6ff', border: `1px solid ${searchProgress === 100 ? '#bbf7d0' : '#cfe2ff'}`, borderRadius: 999, color: searchProgress === 100 ? GREEN : BLUE, fontSize: 18, fontWeight: 750, opacity: 1 - stageTwo, padding: '10px 15px', position: 'absolute', right: 0, top: 0}}>{searchProgress}%</span>
            <span style={{background: issueProgress === 100 ? '#ecfdf3' : '#eff6ff', border: `1px solid ${issueProgress === 100 ? '#bbf7d0' : '#cfe2ff'}`, borderRadius: 999, color: issueProgress === 100 ? GREEN : BLUE, fontSize: 18, fontWeight: 750, opacity: stageTwo, padding: '10px 15px', position: 'absolute', right: 0, top: 0}}>{issueProgress}%</span>
          </div>
        </div>
        {visibleSales.map((sale, index) => <ResultRow compact={compact} frame={frame} index={index} key={sale.number} />)}
      </div>
    </div>
  )
}

export function OttoInvoiceTwoStepsList({compact = false, itemsCount = 5}: {compact?: boolean; itemsCount?: number} = {}) {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const opening = spring({config: {damping: 18, stiffness: 100}, fps, frame})
  const closing = tween(frame, OTTO_INVOICE_TWO_STEPS_LIST_DURATION - 12, OTTO_INVOICE_TWO_STEPS_LIST_DURATION - 1, [1, 0])

  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #fff 0%, #fbfcfe 56%, #f3f6fa 100%)', color: NAVY, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden'}}>
      {[1, 2].map((stage) => <SceneHeader compact={compact} frame={frame} key={stage} stage={stage as Stage} />)}
      <ListContainer compact={compact} frame={frame} itemsCount={itemsCount} />
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(1 - opening, 1 - closing), pointerEvents: 'none', zIndex: 200}} />
    </AbsoluteFill>
  )
}
