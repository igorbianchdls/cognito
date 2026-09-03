import {ArrowUp, CheckCircle2, ChevronDown, Clock3, FileText, LoaderCircle, Mic, Plus, Share} from 'lucide-react'
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion'

import {CHATGPT_MOBILE_FONT_STACK} from '@/assets/remotion/compositions/ChatGptMobileBase'
import {OTTO_INVOICE_CHATGPT_NATIVE_DURATION} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH = 986.32
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT = 546.6

const GREEN = '#10a37f'
const TITLE_FONT_SIZE = 80
const invoices = [
  ['Ana Clara LTDA', 'R$ 1.250,00'],
  ['Bruno Serviços ME', 'R$ 980,00'],
  ['Clínica Viva Bem', 'R$ 2.300,00'],
  ['Lucas Consultoria', 'R$ 1.750,00'],
  ['Studio Design LTDA', 'R$ 1.100,00'],
  ['Marketing Digital SA', 'R$ 870,00'],
  ['Juliana Costa MEI', 'R$ 540,00'],
  ['Tech Solutions LTDA', 'R$ 1.990,00'],
]

function tween(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
}

function ChatGptMark({size = 18}: {size?: number}) {
  return (
    <span style={{display: 'block', flexShrink: 0, height: size, overflow: 'hidden', position: 'relative', width: size}}>
      <Img src={staticFile('gptLogo.svg')} style={{filter: 'brightness(0)', height: size, left: 0, maxWidth: 'none', position: 'absolute', top: 0, width: size * (407 / 120)}} />
    </span>
  )
}

function InvoiceRow({completed, frame, index}: {completed: number; frame: number; index: number}) {
  const done = index < completed
  const active = index === completed && completed < invoices.length
  const rowIn = tween(frame, 54 + index * 7, 65 + index * 7)

  return (
    <div style={{alignItems: 'center', borderTop: index === 0 ? 'none' : '1px solid #ececec', display: 'grid', gridTemplateColumns: '28px 1.35fr 1fr 78px', height: 24, opacity: rowIn, padding: '0 9px'}}>
      <FileText color="#60666c" size={12} />
      <div style={{lineHeight: 1.05}}><strong style={{display: 'block', fontSize: 9.5}}>{invoices[index][0]}</strong><span style={{color: '#555', fontSize: 8}}>{invoices[index][1]}</span></div>
      <div style={{alignItems: 'center', display: 'flex', gap: 6}}>
        {done ? <CheckCircle2 color={GREEN} size={13} /> : active ? <LoaderCircle color={GREEN} size={13} style={{transform: `rotate(${frame * 9}deg)`}} /> : <Clock3 color="#b6bbc0" size={13} />}
        <span style={{color: done ? GREEN : '#3d444a', fontSize: 9.5, fontWeight: 650}}>{done ? 'Emitida' : active ? 'Emitindo...' : 'Aguardando...'}</span>
      </div>
      <span style={{border: '1px solid #dedede', borderRadius: 12, color: done ? '#222' : '#aaa', fontSize: 8.5, padding: '4px 7px', textAlign: 'center'}}>Ver nota</span>
    </div>
  )
}

export function OttoInvoiceChatGptTvContent() {
  const frame = useCurrentFrame()
  const cardIn = tween(frame, 38, 54)
  const rawProgress = tween(frame, 60, 316, [0, invoices.length])
  const completed = Math.min(invoices.length, Math.floor(rawProgress))
  const progress = Math.min(1, rawProgress / invoices.length)
  const allDone = completed === invoices.length

  return (
    <AbsoluteFill style={{background: '#fff', color: '#171717', fontFamily: CHATGPT_MOBILE_FONT_STACK, overflow: 'hidden'}}>
      <aside style={{background: '#f9f9f9', bottom: 0, left: 0, padding: '14px 12px', position: 'absolute', top: 0, width: 145}}>
        <ChatGptMark size={20} />
        <div style={{fontSize: 10.5, lineHeight: 2.45, marginTop: 18}}>Novo chat<br />Buscar chats<br />Biblioteca<br />Explorar GPTs</div>
        <div style={{color: '#777', fontSize: 8.5, marginTop: 18}}>Chats</div>
        <div style={{background: '#ececec', borderRadius: 6, fontSize: 10, marginTop: 7, padding: '7px 8px'}}>Emitir notas fiscais</div>
        <div style={{fontSize: 9.5, lineHeight: 2.5, paddingLeft: 8}}>Resumo de vendas<br />Fluxo de caixa semanal<br />Clientes inadimplentes</div>
      </aside>

      <main style={{bottom: 0, left: 145, position: 'absolute', right: 0, top: 0}}>
        <header style={{alignItems: 'center', display: 'flex', height: 34, padding: '0 18px'}}>
          <strong style={{fontSize: 12}}>ChatGPT 5.6 Sol</strong><ChevronDown color="#686e73" size={11} style={{marginLeft: 4}} />
          <span style={{alignItems: 'center', border: '1px solid #ddd', borderRadius: 14, display: 'flex', fontSize: 9, gap: 5, marginLeft: 'auto', padding: '5px 10px'}}><Share size={10} /> Compartilhar</span>
        </header>

        <div style={{left: 18, position: 'absolute', right: 18, top: 34}}>
          <div style={{display: 'flex', justifyContent: 'flex-end', opacity: tween(frame, 4, 19)}}><div style={{background: '#f4f4f4', borderRadius: 14, fontSize: 9.5, lineHeight: 1.35, padding: '7px 11px', width: 245}}>Chat, emita as notas fiscais das vendas de hoje.</div></div>
          <p style={{fontSize: 9.5, margin: '7px 0 6px', opacity: tween(frame, 22, 38)}}>Perfeito! Vou emitir as notas fiscais para cada cliente.</p>

          <div style={{background: '#fff', border: '1px solid #dedede', borderRadius: 13, boxShadow: '0 2px 9px rgba(0,0,0,.07)', height: 386, opacity: cardIn, overflow: 'hidden', transform: `translateY(${(1 - cardIn) * 7}px)`}}>
            <div style={{alignItems: 'center', display: 'flex', height: 29, padding: '0 11px'}}>
              <span style={{alignItems: 'center', border: '1px solid #ddd', borderRadius: 5, display: 'flex', height: 17, justifyContent: 'center', width: 17}}><FileText size={10} /></span>
              <strong style={{fontSize: 9.5, marginLeft: 7}}>Otto · Emitir notas fiscais</strong>
              <span style={{color: allDone ? GREEN : '#666', fontSize: 8.5, marginLeft: 10}}>{allDone ? 'Concluído' : 'Executando...'}</span>
              <ChevronDown size={11} style={{marginLeft: 'auto', transform: 'rotate(180deg)'}} />
            </div>
            <div style={{padding: '4px 11px 0'}}>
              <h1 style={{fontSize: TITLE_FONT_SIZE, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.95, margin: 0, whiteSpace: 'nowrap'}}>Emitindo nota fiscal</h1>
              <div style={{fontSize: 9, fontWeight: 650, marginTop: 4}}>{completed} de {invoices.length} notas emitidas</div>
              <div style={{background: '#eceeed', borderRadius: 99, height: 4, marginTop: 4, overflow: 'hidden'}}><div style={{background: GREEN, height: '100%', width: `${progress * 100}%`}} /></div>
              <div style={{border: '1px solid #dedede', borderRadius: 8, marginTop: 7, overflow: 'hidden'}}>{invoices.map((_, index) => <InvoiceRow completed={completed} frame={frame} index={index} key={invoices[index][0]} />)}</div>
              <div style={{display: 'flex', fontSize: 8.5, marginTop: 5}}><strong>Total: {invoices.length} notas fiscais</strong><span style={{color: '#666', marginLeft: 'auto'}}>{completed} de {invoices.length} concluídas</span></div>
            </div>
          </div>
        </div>

        <div style={{alignItems: 'center', border: '1px solid #d6d6d6', borderRadius: 20, bottom: 6, display: 'flex', height: 34, left: 90, padding: '0 5px 0 8px', position: 'absolute', right: 90}}>
          <Plus size={14} /><span style={{color: '#888', flex: 1, fontSize: 9.5, marginLeft: 7}}>Pergunte ao ChatGPT</span><Mic size={12} /><span style={{alignItems: 'center', background: '#aaa', borderRadius: 99, color: '#fff', display: 'flex', height: 24, justifyContent: 'center', marginLeft: 5, width: 24}}><ArrowUp size={13} /></span>
        </div>
      </main>
    </AbsoluteFill>
  )
}
