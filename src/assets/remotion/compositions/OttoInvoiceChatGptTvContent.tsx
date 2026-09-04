import type {ReactNode} from 'react'
import {ArrowUp, CheckCircle2, ChevronDown, CircleHelp, Clock3, Grid2X2, Library, LoaderCircle, Mic, MoreHorizontal, PanelLeft, Plus, Search, SquarePen} from 'lucide-react'
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion'

import {CHATGPT_MOBILE_FONT_STACK} from '@/assets/remotion/compositions/ChatGptMobileBase'
import {OTTO_INVOICE_CHATGPT_NATIVE_DURATION} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'
import {IOS_REMOTION_DISPLAY_FONT_STACK} from '@/assets/remotion/fonts/sfPro'

const TV_CONTENT_INTRO_DURATION = 78
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION + TV_CONTENT_INTRO_DURATION
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_NO_INTRO_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH = 986.32
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT = 546.6

const GREEN = '#10a37f'
const ROYAL_BLUE = '#4169e1'
const SIDEBAR = 164
const invoices = [
  ['Ana Clara LTDA', 'R$ 1.250,00'], ['Bruno Serviços ME', 'R$ 980,00'], ['Clínica Viva Bem', 'R$ 2.300,00'], ['Lucas Consultoria', 'R$ 1.750,00'],
  ['Studio Design LTDA', 'R$ 1.100,00'], ['Marketing Digital SA', 'R$ 870,00'], ['Juliana Costa MEI', 'R$ 540,00'], ['Tech Solutions LTDA', 'R$ 1.990,00'],
]
const tween = (frame: number, from: number, to: number, output: [number, number] = [0, 1]) => interpolate(frame, [from, to], output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

function ExternalLinkIcon() {
  return <svg fill="none" height="10" style={{display: 'block', flexShrink: 0}} viewBox="0 0 24 24" width="10" xmlns="http://www.w3.org/2000/svg"><path d="M14 5h5v5M19 5l-8 8M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
}

function InvoiceIcon({color = 'currentColor', size}: {color?: string; size: number}) {
  return <svg fill="none" height={size} style={{display: 'block', flexShrink: 0}} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 13h6M9 17h6" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
}

function ShareIcon() {
  return <svg fill="none" height="10" style={{display: 'block', flexShrink: 0}} viewBox="0 0 24 24" width="10" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
}

function SideRow({active, icon, label}: {active?: boolean; icon?: ReactNode; label: string}) {
  return <div style={{alignItems: 'center', background: active ? '#e9e9e9' : 'transparent', borderRadius: 7, display: 'flex', height: 30, padding: '0 9px'}}>{icon ? <span className="tv-sidebar-item-icon" style={{display: 'flex', marginRight: 9}}>{icon}</span> : null}<span style={{fontSize: 9, fontWeight: active ? 600 : 450, letterSpacing: '-0.01em'}}>{label}</span>{active ? <MoreHorizontal size={13} style={{marginLeft: 'auto'}} /> : null}</div>
}

function Row({completed, frame, index}: {completed: number; frame: number; index: number}) {
  const done = index < completed
  const active = index === completed && completed < 8
  return <div style={{alignItems: 'center', borderTop: index ? '1px solid #e9e9e9' : 'none', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '22px 38px 1.2fr 1.15fr 66px', minHeight: 28, padding: '6px 10px'}}>
    <InvoiceIcon color="#60666c" size={12} /><span style={{fontSize: 9}}>NFS-e</span>
    <div style={{lineHeight: 1.12}}><strong style={{display: 'block', fontSize: 9.2}}>{invoices[index][0]}</strong><span style={{color: '#555', fontSize: 7.6}}>{invoices[index][1]}</span></div>
    <div style={{alignItems: 'center', display: 'flex', gap: 5}}>{done ? <CheckCircle2 color={GREEN} size={13} /> : active ? <LoaderCircle color={GREEN} size={13} style={{transform: `rotate(${frame * 9}deg)`}} /> : <Clock3 color="#b8bec4" size={13} />}<div style={{lineHeight: 1.12}}><strong style={{color: done ? GREEN : '#333', display: 'block', fontSize: 8.7}}>{done ? 'Emitida' : active ? 'Emitindo...' : 'Aguardando...'}</strong><span style={{color: '#666', fontSize: 7.2}}>{done ? 'Enviada por WhatsApp' : active ? 'Gerando XML' : 'Na fila para emissão'}</span></div></div>
    <span style={{alignItems: 'center', border: '1px solid #ddd', borderRadius: 12, color: done ? '#222' : '#aaa', display: 'flex', fontSize: 7.8, gap: 3, justifyContent: 'center', padding: '4px'}}>Ver nota <ExternalLinkIcon /></span>
  </div>
}

export function OttoInvoiceChatGptTvContent({titleFontSize = 140, withIntro = true}: {titleFontSize?: number; withIntro?: boolean} = {}) {
  const absoluteFrame = useCurrentFrame()
  const frame = withIntro ? Math.max(0, absoluteFrame - TV_CONTENT_INTRO_DURATION) : absoluteFrame
  const introPrompt = 'Chat, emita as notas fiscais das vendas de hoje e envie por WhatsApp.'
  const typedCharacters = Math.floor(tween(absoluteFrame, 16, 58, [0, introPrompt.length]))
  const typedPrompt = introPrompt.slice(0, typedCharacters)
  const introOpacity = withIntro ? tween(absoluteFrame, 64, 76, [1, 0]) : 0
  const conversationOpacity = withIntro ? tween(absoluteFrame, 72, 82) : 1
  const cardIn = tween(frame, 38, 54)
  const raw = tween(frame, 60, 316, [0, 8])
  const completed = Math.min(8, Math.floor(raw))
  const progress = Math.min(1, raw / 8)
  const isResponding = frame >= 19 && completed < 8
  const conversationLift = tween(raw, 5.25, 7.5, [0, -38])
  const revealRow = (index: number) => index === 0 ? 1 : interpolate(raw, [index, index + 0.22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

  return <AbsoluteFill style={{background: '#fff', color: '#171717', fontFamily: CHATGPT_MOBILE_FONT_STACK, overflow: 'hidden'}}>
    <style>{`.tv-sidebar-item-icon .lucide { width: 12px !important; height: 12px !important; }.tv-sidebar-header-icon .lucide { width: 12px !important; height: 12px !important; }.tv-prompt-input .lucide { width: 14px !important; height: 14px !important; }`}</style>
    <aside style={{background: '#f9f9f9', borderRight: '1px solid #ededed', bottom: 0, left: 0, padding: '12px 8px', position: 'absolute', top: 0, width: SIDEBAR}}>
      <div style={{alignItems: 'center', display: 'flex', height: 24, padding: '0 8px'}}><strong style={{fontSize: 12.5, fontWeight: 650}}>ChatGPT</strong><span className="tv-sidebar-header-icon" style={{color: '#8f8f8f', display: 'flex', gap: 11, marginLeft: 'auto'}}><Search /><PanelLeft /></span></div>
      <div style={{marginTop: 14}}><SideRow icon={<SquarePen size={14} />} label="Novo chat" /><SideRow icon={<Search size={14} />} label="Buscar chats" /><SideRow icon={<Library size={14} />} label="Biblioteca" /><SideRow icon={<Grid2X2 size={14} />} label="Explorar GPTs" /></div>
      <div style={{color: '#666', fontSize: 8.3, margin: '16px 9px 6px'}}>Chats</div><SideRow active label="Emitir notas fiscais" /><SideRow label="Resumo de vendas" /><SideRow label="Fluxo de caixa semanal" /><SideRow label="Clientes inadimplentes" />
      <div style={{color: '#666', fontSize: 8.3, margin: '13px 9px 5px'}}>7 dias anteriores</div><SideRow label="Relatório financeiro" /><SideRow label="Análise de estoque" />
      <div style={{alignItems: 'center', bottom: 9, display: 'flex', left: 12, position: 'absolute', right: 12}}><span style={{background: '#687785', borderRadius: 99, color: '#fff', display: 'grid', fontSize: 7.5, height: 23, placeItems: 'center', width: 23}}>VO</span><strong style={{fontSize: 9.5, marginLeft: 8}}>Você</strong><MoreHorizontal size={13} style={{marginLeft: 'auto'}} /></div>
    </aside>
    <main style={{bottom: 0, left: SIDEBAR, position: 'absolute', right: 0, top: 0}}>
      <header style={{alignItems: 'center', background: '#fff', display: 'flex', height: 38, padding: '0 18px', position: 'relative', zIndex: 20}}><strong style={{fontSize: 12}}>ChatGPT 5.6 Sol</strong><ChevronDown size={11} style={{marginLeft: 4}} /><span style={{alignItems: 'center', border: '1px solid #ddd', borderRadius: 15, display: 'flex', fontSize: 9, fontWeight: 600, gap: 5, marginLeft: 'auto', padding: '6px 10px'}}><ShareIcon /> Compartilhar</span><span style={{background: '#687785', borderRadius: 99, color: '#fff', display: 'grid', fontSize: 7.5, height: 25, marginLeft: 11, placeItems: 'center', width: 25}}>VO</span></header>

      {withIntro ? <div style={{left: '50%', opacity: introOpacity, position: 'absolute', top: '48%', transform: `translate(-50%, -50%) translateY(${(1 - introOpacity) * -8}px)`, width: '60%', zIndex: 5}}>
        <div style={{fontSize: 20, fontWeight: 450, marginBottom: 20, textAlign: 'center'}}>O que tem na agenda de hoje?</div>
        <div className="tv-prompt-input" style={{alignItems: 'center', background: '#fff', border: '1px solid #d4d4d4', borderRadius: 20, boxShadow: '0 5px 20px rgba(0,0,0,.07)', display: 'flex', minHeight: 38, padding: '0 6px 0 10px'}}><Plus size={15} /><span style={{color: typedPrompt ? '#333' : '#888', flex: 1, fontSize: 9.5, marginLeft: 8}}>{typedPrompt || 'Pergunte ao ChatGPT'}{typedCharacters > 0 && typedCharacters < introPrompt.length ? <span style={{borderRight: '1px solid #444', marginLeft: 1, opacity: Math.floor(absoluteFrame / 7) % 2 ? 0.25 : 1}} /> : null}</span><Mic size={12} /><span style={{background: typedPrompt ? ROYAL_BLUE : '#aaa', borderRadius: 99, color: '#fff', display: 'grid', height: 24, marginLeft: 5, placeItems: 'center', transform: `scale(${typedCharacters === introPrompt.length ? tween(absoluteFrame, 58, 64, [1, 0.88]) : 1})`, width: 24}}><ArrowUp size={14} /></span></div>
      </div> : null}

      <section style={{bottom: 52, left: 0, opacity: conversationOpacity, overflow: 'hidden', position: 'absolute', right: 0, top: 38}}>
        <div style={{left: '50%', position: 'absolute', top: 8, transform: `translateX(-50%) translateY(${conversationLift}px)`, width: '60%'}}>
          <div style={{display: 'flex', justifyContent: 'flex-end', opacity: tween(frame, 4, 19)}}><div style={{background: '#f4f4f4', borderRadius: 15, fontSize: 9.2, lineHeight: 1.35, padding: '7px 11px', width: 230}}>Chat, emita as notas fiscais das vendas de hoje e envie por WhatsApp.</div></div>
          <p style={{fontSize: 9.2, margin: '6px 0', opacity: tween(frame, 22, 38)}}>Perfeito! Vou emitir as notas fiscais para cada cliente.</p>
          <div style={{background: '#fff', border: '1px solid #dedede', borderRadius: 13, boxShadow: '0 3px 12px rgba(0,0,0,.08)', opacity: cardIn, overflow: 'hidden', transform: `translateY(${(1 - cardIn) * 7}px)`}}>
            <div style={{alignItems: 'center', display: 'flex', height: 29, padding: '0 11px'}}><span style={{border: '1px solid #ddd', borderRadius: 5, display: 'grid', height: 17, placeItems: 'center', width: 17}}><InvoiceIcon size={10} /></span><strong style={{fontSize: 9.3, marginLeft: 7}}>Otto · Emitir notas fiscais</strong><span style={{color: completed === 8 ? GREEN : '#666', fontSize: 8.3, marginLeft: 10}}>{completed === 8 ? 'Concluído' : 'Executando...'}</span><ChevronDown size={11} style={{marginLeft: 'auto', transform: 'rotate(180deg)'}} /></div>
                       <div style={{padding: '3px 11px 9px'}}><div style={{overflow: 'hidden'}}><h1 style={{fontFamily: IOS_REMOTION_DISPLAY_FONT_STACK, fontSize: titleFontSize, fontWeight: 700, letterSpacing: 0, lineHeight: 0.95, margin: '0 0 12px', whiteSpace: 'nowrap'}}>Emitindo múltiplas notas fiscais</h1></div><div style={{fontSize: 9, fontWeight: 650, marginTop: 0}}>{completed} de 8 notas emitidas</div><div style={{background: '#eceeed', borderRadius: 99, height: 4, marginTop: 5, overflow: 'hidden'}}><div style={{background: GREEN, height: '100%', width: `${progress * 100}%`}} /></div><div style={{border: '1px solid #ddd', borderRadius: 8, marginTop: 8, overflow: 'hidden'}}>{invoices.map((invoice, index) => { const reveal = revealRow(index); return <div key={invoice[0]} style={{maxHeight: reveal * 64, opacity: reveal, overflow: 'hidden', transform: `translateY(${(1 - reveal) * 5}px)`}}><Row completed={completed} frame={frame} index={index} /></div> })}</div><div style={{display: 'flex', fontSize: 8.5, marginTop: 7}}><strong>Total: 8 notas fiscais</strong><span style={{color: '#666', marginLeft: 'auto'}}>{completed} de 8 concluídas</span></div></div>
          </div>
        </div>
      </section>
      <div className="tv-prompt-input" style={{alignItems: 'center', background: '#fff', border: '1px solid #d4d4d4', borderRadius: 18, bottom: 7, boxShadow: '0 1px 5px rgba(0,0,0,.05)', display: 'flex', height: 32, left: '50%', opacity: conversationOpacity, padding: '0 5px 0 8px', position: 'absolute', transform: 'translateX(-50%)', width: '60%', zIndex: 10}}><Plus size={14} /><span style={{color: '#888', flex: 1, fontSize: 9.5, marginLeft: 7}}>Pergunte ao ChatGPT</span><Mic size={12} /><span style={{background: isResponding ? ROYAL_BLUE : '#aaa', borderRadius: 99, color: '#fff', display: 'grid', height: 22, marginLeft: 4, placeItems: 'center', width: 22}}>{isResponding ? <span style={{background: '#fff', borderRadius: 1, height: 6, width: 6}} /> : <ArrowUp size={13} />}</span></div>
      <CircleHelp color="#777" size={15} style={{bottom: 11, opacity: conversationOpacity, position: 'absolute', right: 10}} />
    </main>
  </AbsoluteFill>
}
