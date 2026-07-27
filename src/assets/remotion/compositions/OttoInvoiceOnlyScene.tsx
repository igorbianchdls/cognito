import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import { PromptOnly } from './OttoSyncOnlyScene'

loadSfProFonts()

export const OTTO_INVOICE_ONLY_SCENE_DURATION = 360

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function Spinner({ active }: { active: boolean }) {
  const frame = useCurrentFrame()

  if (!active) {
    return <span style={{ background: '#12b76a', borderRadius: 999, display: 'block', height: 11, width: 11 }} />
  }

  return (
    <span
      style={{
        border: '3px solid #d7d7d7',
        borderRadius: 999,
        borderRightColor: '#111111',
        display: 'block',
        height: 24,
        transform: `rotate(${frame * 20}deg)`,
        width: 24,
      }}
    />
  )
}

const invoiceSteps = [
  { completeAt: 58, detail: 'Cliente Norte', label: 'Tomador validado', status: 'OK', value: 'CNPJ conferido' },
  { completeAt: 76, detail: 'Servico aprovado', label: 'Dados da nota', status: 'OK', value: 'NFSe-2048' },
  { completeAt: 94, detail: 'ISS, PIS e COFINS', label: 'Impostos calculados', status: 'OK', value: 'R$ 248,00' },
  { completeAt: 116, detail: 'Prefeitura conectada', label: 'Envio municipal', status: 'Emitindo', value: 'Recife PE' },
  { completeAt: 136, detail: 'PDF e XML prontos', label: 'Nota emitida', status: 'Emitida', value: 'NFS-e 2048' },
]

function InvoiceResultRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = invoiceSteps[index]
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= item.completeAt

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '1fr 170px 118px 28px', height: 72, opacity: rowIn, padding: '0 28px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 23, fontWeight: 560, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 17, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.detail}</span>
      </div>
      <span style={{ color: '#111111', fontSize: 20, fontWeight: 520, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.status : 'Verificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function InvoiceEmissionResult({ frame, start = 104 }: { frame: number; start?: number }) {
  const localFrame = frame - start
  const show = p(frame, start, start + 20)
  const list = p(localFrame, 34, 64)
  const cardHeight = interpolate(list, [0, 1], [112, 492], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 14, 142), [0, 1], [12, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ marginTop: 22, opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>Emissao de nota fiscal</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>Validacao, impostos, envio e arquivos fiscais</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {invoiceSteps.map((_, index) => <InvoiceResultRow key={index} index={index} localFrame={localFrame} />)}
      </div>
    </div>
  )
}

export function OttoInvoiceOnlyScene() {
  const frame = useCurrentFrame()
  const prompt = 'Emita a nota fiscal do ultimo servico aprovado.'
  const cardIn = p(frame, 104, 126)

  return (
    <AbsoluteFill style={{ background: 'transparent', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <PromptOnly frame={frame} prompt={prompt} />
      <div style={{ left: 82, opacity: cardIn, position: 'absolute', right: 82, top: 650, transform: `translateY(${(1 - cardIn) * 18}px)` }}>
        <InvoiceEmissionResult frame={frame} start={104} />
      </div>
    </AbsoluteFill>
  )
}
