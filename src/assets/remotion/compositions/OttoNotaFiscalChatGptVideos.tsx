import { ArrowUp, CheckCheck, ChevronDown, FileText, Plus, Search, SquarePen, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Easing, Img, random, spring, staticFile } from 'remotion'

import {
  Card,
  CtaScene,
  DISPLAY,
  ExpensesScene,
  GRAY,
  Headline,
  INK,
  INK_MUTED,
  OttoIcon,
  OttoNotification,
  p,
  PhoneFrame,
  ReconciliationScene,
  ReelRoot,
  type ReelScene,
  Scene,
  sceneDuration,
  syncToNarration,
  TERRA,
  typed,
  useFrame,
  useSpring,
  WA,
  WaBubble,
  WaChatHeader,
  WaInputBar,
  WaTyping,
  WhatsAppScene,
  WHITE,
  alpha,
  DANGER_SOFT,
  SURFACE,
} from './OttoContadoresReel'

const STATUS = {
  authorized: { background: '#ddf2ec', color: '#14946b', label: 'Autorizada' },
  queued: { background: 'transparent', color: GRAY, label: 'Na fila' },
  sending: { background: '#fcf0d6', color: '#c98a0c', label: 'Enviando' },
}

const CLIENTS = [
  'Aurora Tecnologia', 'Lume Comércio', 'Boa Vista Engenharia', 'Norte Logística', 'Café Serra Azul', 'Studio Prisma',
  'Clínica Vida Plena', 'Atlas Consultoria', 'Mar Aberto Turismo', 'Doce Lar Confeitaria', 'Pixel & Co.', 'Verde Campo Agro',
  'Rota Sul Transportes', 'Oficina do Pão', 'Brava Academia', 'Horizonte Imóveis', 'Lumen Arquitetura', 'Ponto Alto Eventos',
  'Nova Era Educação', 'Sabor da Casa', 'Faro Marketing', 'Ateliê Linho', 'Trilha Outdoor', 'Bem Estar Pilates',
  'Capital Seguros', 'Ilha Bela Pousada', 'Kairos Software', 'Mundo Pet', 'Solar Energia', 'Vértice Design',
]

const INVOICES = CLIENTS.map((name, i) => ({
  initials: name.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
  name,
  number: `000.${String(483 + i).padStart(3, '0')}`,
  value: Math.round((900 + random(`inv${i}`) * 6200) / 10) * 10,
}))
const BATCH_TOTAL = INVOICES.reduce((sum, invoice) => sum + invoice.value, 0)

export const money = (value: number) => value.toLocaleString('pt-BR', { currency: 'BRL', maximumFractionDigits: 0, style: 'currency' })

// ─── Shared bits ─────────────────────────────────────────────────────────────

export function Cursor({ click, from, to, travel }: { click: number; from: [number, number]; to: [number, number]; travel: [number, number] }) {
  const frame = useFrame()
  const t = p(frame, travel[0], travel[1], [0, 1], Easing.inOut(Easing.cubic))
  const x = from[0] + (to[0] - from[0]) * t
  const y = from[1] + (to[1] - from[1]) * t
  const press = frame >= click && frame < click + 6 ? 0.86 : 1
  const ring = p(frame, click, click + 14)

  if (frame < travel[0] - 4) return null

  return (
    <>
      {frame >= click ? <div style={{ border: `4px solid ${TERRA}`, borderRadius: 99, height: 40 + ring * 70, left: to[0] - (40 + ring * 70) / 2, opacity: 1 - ring, position: 'absolute', top: to[1] - (40 + ring * 70) / 2, width: 40 + ring * 70, zIndex: 20 }} /> : null}
      <svg height={58} style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))', left: x - 8, opacity: p(frame, travel[0] - 4, travel[0] + 4), position: 'absolute', top: y - 4, transform: `scale(${press})`, transformOrigin: '8px 4px', zIndex: 21 }} viewBox="0 0 24 30" width={46}>
        <path d="M2 2 L2 24 L8 18.5 L12.2 27.5 L16 25.8 L11.8 17 L20 17 Z" fill={INK} stroke={WHITE} strokeLinejoin="round" strokeWidth={1.8} />
      </svg>
    </>
  )
}

export function CheckBadge({ size = 44 }: { size?: number }) {
  return (
    <span style={{ alignItems: 'center', background: TERRA, borderRadius: 99, display: 'flex', flex: 'none', height: size, justifyContent: 'center', width: size }}>
      <svg height={size * 0.55} viewBox="0 0 24 24" width={size * 0.55}>
        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={WHITE} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
      </svg>
    </span>
  )
}

function StatusPill({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status]
  return (
    <span style={{ alignItems: 'center', background: s.background, border: status === 'queued' ? `2px dashed ${GRAY}` : '2px solid transparent', borderRadius: 99, color: s.color, display: 'flex', flex: 'none', fontSize: 22, fontWeight: 700, gap: 6, justifyContent: 'center', padding: '8px 0', width: 170 }}>
      {status === 'authorized' ? <CheckCheck size={22} strokeWidth={2.6} /> : null}
      {s.label}
    </span>
  )
}

export const ChatGptLogo = ({ height = 64 }: { height?: number }) => <Img src={staticFile('gptLogo.svg')} style={{ filter: 'brightness(0)', height }} />

// ─── 1. Hook ─────────────────────────────────────────────────────────────────

export function makeHookScene(title: string, highlight: string[], size: number, subline = 'E quase ninguém sabe disso.') {
  return function HookScene({ duration }: { duration: number }) {
    const frame = useFrame()
    const logo = useSpring(2, { damping: 12, stiffness: 150 })

    return (
      <Scene duration={duration}>
        <Card style={{ alignItems: 'center', display: 'flex', height: 150, justifyContent: 'center', left: 320, top: 520, transform: `scale(${logo}) rotate(${(1 - logo) * -6}deg)`, width: 440 }}>
          <ChatGptLogo />
        </Card>
        <Headline highlight={highlight} size={size} start={8} text={title} style={{ top: 760 }} />
        <span style={{ color: INK_MUTED, fontFamily: DISPLAY, fontSize: 70, fontStyle: 'italic', left: 0, opacity: p(frame, 52, 66), position: 'absolute', right: 0, textAlign: 'center', top: 1360, transform: `translateY(${p(frame, 52, 68, [18, 0])}px)` }}>
          {subline}
        </span>
      </Scene>
    )
  }
}

// ─── 2. Pedido no ChatGPT ────────────────────────────────────────────────────

/** ChatGPT window: the prompt is typed in the composer, sent as a bubble, then `response` renders below it. */
export function ChatGptWindow({ prompt, response }: { prompt: string; response: (sendAt: number) => ReactNode }) {
  const frame = useFrame()
  const typeEnd = 12 + Math.min(44, prompt.length * 0.9)
  const sendAt = typeEnd + 6
  const sent = frame >= sendAt
  const bubble = spring({ config: { damping: 15, stiffness: 170 }, fps: 30, frame: frame - sendAt })
  const text = sent ? '' : typed(prompt, p(frame, 12, typeEnd, [0, 1], Easing.linear))

  return (
    <Card style={{ borderRadius: 44, display: 'flex', flexDirection: 'column', height: 860, left: 70, opacity: p(frame, 4, 14), overflow: 'hidden', right: 70, top: 560 }}>
      <div style={{ alignItems: 'center', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'space-between', padding: '30px 36px' }}>
        <span style={{ alignItems: 'center', display: 'flex', fontSize: 32, fontWeight: 600, gap: 8 }}>
          ChatGPT <ChevronDown color={INK_MUTED} size={28} strokeWidth={2.2} />
        </span>
        <SquarePen color={INK} size={32} strokeWidth={1.9} />
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 26, justifyContent: 'flex-end', padding: '30px 36px' }}>
        {sent ? (
          <div style={{ alignSelf: 'flex-end', background: SURFACE, borderRadius: 32, fontSize: 32, lineHeight: 1.3, maxWidth: '82%', opacity: bubble, padding: '22px 28px', transform: `translateY(${(1 - bubble) * 30}px)` }}>{prompt}</div>
        ) : null}
        {frame >= sendAt + 8 ? response(sendAt) : null}
      </div>
      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ alignItems: 'center', border: '2px solid #e3e3e3', borderRadius: 44, boxShadow: '0 6px 20px rgba(0,0,0,0.05)', display: 'flex', gap: 16, minHeight: 96, padding: '14px 16px 14px 24px' }}>
          <Plus color={INK} size={34} strokeWidth={1.9} />
          <span style={{ color: text ? INK : '#9b9b9b', flex: 1, fontSize: 30, lineHeight: 1.3 }}>
            {text || 'Pergunte alguma coisa'}
            {!sent && frame >= 12 && frame % 16 < 9 ? <span style={{ background: INK, display: 'inline-block', height: 32, marginLeft: 2, verticalAlign: 'middle', width: 3 }} /> : null}
          </span>
          <span style={{ alignItems: 'center', background: text || frame >= typeEnd ? INK : '#d9d9d9', borderRadius: 99, display: 'flex', flex: 'none', height: 64, justifyContent: 'center', transform: `scale(${frame >= sendAt - 2 && frame < sendAt + 2 ? 0.88 : 1})`, width: 64 }}>
            <ArrowUp color={WHITE} size={34} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </Card>
  )
}

export function OttoWorking({ doneText, sendAt }: { doneText: string; sendAt: number }) {
  const frame = useFrame()
  const found = frame >= sendAt + 34

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 16, opacity: p(frame, sendAt + 8, sendAt + 16) }}>
      <span style={{ alignItems: 'center', background: WHITE, border: `2px solid ${alpha(GRAY, 0x88)}`, borderRadius: 99, display: 'flex', flex: 'none', height: 58, justifyContent: 'center', width: 58 }}>
        <OttoIcon size={34} />
      </span>
      <span style={{ color: found ? INK : INK_MUTED, fontSize: 28, fontWeight: 600, opacity: found ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(frame / 6)) }}>
        {found ? doneText : 'Otto · buscando dados…'}
      </span>
      {found ? <CheckBadge size={40} /> : null}
    </div>
  )
}

export function makePromptScene(title: string, prompt: string, doneText = 'Cliente, serviço e impostos encontrados') {
  return function PromptScene({ duration }: { duration: number }) {
    return (
      <Scene duration={duration}>
        <Headline size={80} start={0} text={title} style={{ top: 200 }} />
        <ChatGptWindow prompt={prompt} response={(sendAt) => <OttoWorking doneText={doneText} sendAt={sendAt} />} />
      </Scene>
    )
  }
}

// ─── 3A. Nota preenchida + confirmar ─────────────────────────────────────────

const NOTE_FIELDS = [
  ['Tomador', 'Aurora Tecnologia Ltda'],
  ['Serviço', 'Consultoria financeira'],
  ['Valor do serviço', 'R$ 4.000,00'],
  ['ISS (2%)', 'R$ 80,00'],
]

function InvoiceConfirmScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const confirmed = frame >= 70
  const stamp = spring({ config: { damping: 10, stiffness: 170 }, fps: 30, frame: frame - 100 })

  return (
    <Scene duration={duration}>
      <Headline highlight={['confirma']} size={84} start={0} text="Ele preenche tudo. Você só confirma." style={{ top: 190 }} />
      <Card style={{ left: 110, opacity: p(frame, 4, 16), padding: '40px 48px', right: 110, top: 480, transform: `translateY(${p(frame, 4, 20, [40, 0])}px)` }}>
        <div style={{ alignItems: 'baseline', borderBottom: `2px solid ${alpha(GRAY, 0x55)}`, display: 'flex', justifyContent: 'space-between', paddingBottom: 22 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 62 }}>NFS-e</span>
          <span style={{ color: INK_MUTED, fontSize: 26, fontWeight: 600 }}>Nº 000.482</span>
        </div>
        {NOTE_FIELDS.map(([label, value], i) => (
          <div key={label} style={{ borderBottom: `2px dashed ${alpha(GRAY, 0x55)}`, padding: '20px 0' }}>
            <span style={{ color: INK_MUTED, display: 'block', fontSize: 23, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ display: 'block', fontSize: 36, fontWeight: i === 2 ? 700 : 560, marginTop: 6, minHeight: 44 }}>{typed(value, p(frame, 12 + i * 8, 24 + i * 8, [0, 1], Easing.linear))}</span>
          </div>
        ))}
        <div style={{ alignItems: 'center', background: confirmed ? TERRA : INK, borderRadius: 26, color: WHITE, display: 'flex', fontSize: 34, fontWeight: 700, gap: 14, justifyContent: 'center', marginTop: 32, opacity: p(frame, 44, 54), padding: '28px 0', transform: `scale(${frame >= 68 && frame < 72 ? 0.96 : 1 + (frame > 54 && !confirmed ? Math.sin(frame / 4) * 0.012 : 0)})` }}>
          {confirmed ? <CheckBadge size={40} /> : null}
          {confirmed ? 'Confirmado' : 'Confirmar emissão'}
        </div>
      </Card>
      <Cursor click={68} from={[900, 1700]} to={[560, 1135]} travel={[50, 66]} />
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 1310 }}>
        {['Validando', 'Enviando', 'Autorizada'].map((step, i) => {
          const active = frame >= 76 + i * 9
          return (
            <span key={step} style={{ alignItems: 'center', color: active ? INK : GRAY, display: 'flex', fontSize: 28, fontWeight: 650, gap: 10, opacity: p(frame, 72, 80) }}>
              <span style={{ background: active ? TERRA : WHITE, border: `3px solid ${active ? TERRA : GRAY}`, borderRadius: 99, height: 26, width: 26 }} />
              {step}
            </span>
          )
        })}
      </div>
      {frame >= 100 ? (
        <div style={{ border: `6px solid ${TERRA}`, borderRadius: 18, color: TERRA, fontSize: 66, fontWeight: 800, left: 560, letterSpacing: '0.06em', opacity: Math.min(1, stamp * 1.4), padding: '8px 30px', position: 'absolute', top: 640, transform: `rotate(-9deg) scale(${2.2 - stamp * 1.2})` }}>
          EMITIDA
        </div>
      ) : null}
    </Scene>
  )
}

// ─── 4A. Envio no WhatsApp ───────────────────────────────────────────────────

function PdfAttachment({ name }: { name: string }) {
  return (
    <div style={{ alignItems: 'center', background: '#cbf3c3', borderRadius: 14, display: 'flex', gap: 16, marginBottom: 4, padding: '16px 18px' }}>
      <span style={{ alignItems: 'center', background: '#e5252a', borderRadius: 8, color: WHITE, display: 'flex', flex: 'none', fontSize: 17, fontWeight: 800, height: 60, justifyContent: 'center', width: 48 }}>PDF</span>
      <div>
        <span style={{ display: 'block', fontSize: 26, fontWeight: 600 }}>{name}</span>
        <span style={{ color: WA.meta, display: 'block', fontSize: 20 }}>1 página · PDF · 84 kB</span>
      </div>
    </div>
  )
}

export function WhatsAppDeliveryScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const read = frame >= 40
  const typing = frame >= 44 && frame < 56

  return (
    <Scene duration={duration}>
      <Headline highlight={['whatsapp']} size={80} start={0} text="E já manda pro seu cliente no WhatsApp." style={{ top: 170 }} />
      <PhoneFrame style={{ opacity: p(frame, 4, 16), top: 470, transform: `translateY(${p(frame, 4, 20, [60, 0])}px)` }}>
        <WaChatHeader initials="AT" name="Aurora Tecnologia" status={typing ? 'digitando…' : 'online'} />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8, justifyContent: 'flex-end', padding: '18px 30px' }}>
          <span style={{ alignSelf: 'center', background: WA.incoming, borderRadius: 12, color: WA.meta, fontSize: 19, fontWeight: 500, marginBottom: 'auto', padding: '7px 16px' }}>Hoje</span>
          <WaBubble at={10} out read={read} tail time="10:42">
            Olá! Segue a nota fiscal do serviço de consultoria financeira.
          </WaBubble>
          <WaBubble at={20} out read={read} time="10:42">
            <PdfAttachment name="NFS-e 000482.pdf" />
          </WaBubble>
          {typing ? <WaTyping /> : null}
          {frame >= 56 ? <div style={{ height: 8 }} /> : null}
          <WaBubble at={56} tail time="10:43">
            Recebido, obrigado!
          </WaBubble>
        </div>
        <WaInputBar />
        <OttoNotification at={68} text="NFS-e 000.482 emitida e enviada para Aurora Tecnologia." />
      </PhoneFrame>
    </Scene>
  )
}

// ─── Lote: 30 notas em cascata ───────────────────────────────────────────────

const ROW_H = 98

function makeBatchScene(title: string, highlight: string[]) {
  return function BatchScene({ duration }: { duration: number }) {
    const frame = useFrame()
    const start = 26
    const step = (duration - 56) / INVOICES.length
    const progress = Math.max(0, Math.min(INVOICES.length, (frame - start) / step))
    const authorized = INVOICES.filter((_, i) => frame >= start + i * step + 6).length
    const visibleRows = 780 / ROW_H
    const offset = Math.min(Math.max(0, progress - 5), INVOICES.length - visibleRows) * ROW_H

    return (
      <Scene duration={duration}>
        <Headline highlight={highlight} size={80} start={0} text={title} style={{ top: 190 }} />
        <div style={{ alignItems: 'baseline', display: 'flex', gap: 22, justifyContent: 'center', left: 0, opacity: p(frame, 14, 24), position: 'absolute', right: 0, top: 520 }}>
          <span style={{ color: TERRA, fontFamily: DISPLAY, fontSize: 190, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums', lineHeight: 0.9, minWidth: 190, textAlign: 'right' }}>{authorized}</span>
          <span style={{ color: INK_MUTED, fontSize: 34, fontWeight: 600, lineHeight: 1.2 }}>
            de {INVOICES.length} notas
            <br />
            autorizadas
          </span>
        </div>
        <Card style={{ height: 780, left: 70, opacity: p(frame, 10, 22), overflow: 'hidden', padding: '0 34px', right: 70, top: 760 }}>
          <div style={{ transform: `translateY(${-offset}px)` }}>
            {INVOICES.map((invoice, i) => {
              const at = start + i * step
              const status = frame >= at + 6 ? 'authorized' : frame >= at ? 'sending' : 'queued'
              return (
                <div key={invoice.number} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${alpha(GRAY, 0x33)}`, display: 'flex', gap: 20, height: ROW_H }}>
                  <span style={{ alignItems: 'center', background: SURFACE, borderRadius: 16, color: INK_MUTED, display: 'flex', flex: 'none', fontSize: 21, fontWeight: 700, height: 60, justifyContent: 'center', width: 60 }}>{invoice.initials}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 28, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoice.name}</span>
                    <span style={{ color: INK_MUTED, display: 'block', fontSize: 21 }}>NFS-e {invoice.number} · {money(invoice.value)}</span>
                  </div>
                  <StatusPill status={status} />
                </div>
              )
            })}
          </div>
        </Card>
      </Scene>
    )
  }
}

// ─── 3B. Revisão em lista + confirmar ────────────────────────────────────────

function ReviewListScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const confirmed = frame >= 88

  return (
    <Scene duration={duration}>
      <Headline highlight={['lista']} size={76} start={0} stagger={2} text="Ele encontra cada cliente e te mostra tudo numa lista." style={{ top: 180 }} />
      <Card style={{ height: 760, left: 70, opacity: p(frame, 6, 16), overflow: 'hidden', padding: '0 34px', right: 70, top: 520 }}>
        <div style={{ alignItems: 'center', borderBottom: `2px solid ${alpha(GRAY, 0x55)}`, display: 'flex', justifyContent: 'space-between', padding: '28px 0 22px' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 52 }}>Vendas de outubro</span>
          <span style={{ color: INK_MUTED, fontSize: 26, fontWeight: 600 }}>{INVOICES.length} vendas</span>
        </div>
        {INVOICES.slice(0, 7).map((invoice, i) => {
          const o = p(frame, 14 + i * 4, 24 + i * 4)
          return (
            <div key={invoice.number} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${alpha(GRAY, 0x33)}`, display: 'flex', gap: 20, height: 88, opacity: o, transform: `translateX(${(1 - o) * 30}px)` }}>
              <span style={{ alignItems: 'center', background: SURFACE, borderRadius: 16, color: INK_MUTED, display: 'flex', flex: 'none', fontSize: 21, fontWeight: 700, height: 56, justifyContent: 'center', width: 56 }}>{invoice.initials}</span>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 28, fontWeight: 600 }}>{invoice.name}</span>
                <span style={{ color: INK_MUTED, display: 'block', fontSize: 21 }}>Serviço identificado · ISS calculado</span>
              </div>
              <span style={{ fontSize: 28, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{money(invoice.value)}</span>
            </div>
          )
        })}
        <div style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff 70%)', bottom: 0, color: INK_MUTED, fontSize: 26, fontWeight: 600, left: 0, padding: '60px 0 22px', position: 'absolute', right: 0, textAlign: 'center' }}>
          + {INVOICES.length - 7} vendas
        </div>
      </Card>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', left: 90, opacity: p(frame, 44, 54), position: 'absolute', right: 90, top: 1320 }}>
        <span style={{ color: INK_MUTED, fontSize: 28, fontWeight: 600 }}>Total</span>
        <span style={{ fontSize: 40, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{money(BATCH_TOTAL)}</span>
      </div>
      <div style={{ alignItems: 'center', background: confirmed ? TERRA : INK, borderRadius: 26, color: WHITE, display: 'flex', fontSize: 34, fontWeight: 700, gap: 14, justifyContent: 'center', left: 70, opacity: p(frame, 50, 60), padding: '30px 0', position: 'absolute', right: 70, top: 1400, transform: `scale(${frame >= 86 && frame < 90 ? 0.96 : 1 + (frame > 60 && !confirmed ? Math.sin(frame / 4) * 0.012 : 0)})` }}>
        {confirmed ? <CheckBadge size={40} /> : null}
        {confirmed ? 'Emitindo 30 notas…' : `Confirmar e emitir ${INVOICES.length} notas`}
      </div>
      <Cursor click={86} from={[920, 1780]} to={[560, 1452]} travel={[66, 84]} />
    </Scene>
  )
}

// ─── Lista de conversas do WhatsApp (envio em massa) ─────────────────────────

const CHAT_ROW_H = 112

export type ChatListRow = { initials: string; line: string; name: string }

export function makeChatListScene({ badge, highlight, icon, notification, rows: allRows, title }: { badge: (count: number) => string; highlight: string[]; icon: ReactNode; notification: string; rows: ChatListRow[]; title: string }) {
  return function ChatListScene({ duration }: { duration: number }) {
    const frame = useFrame()
    const every = Math.max(2.2, 60 / allRows.length)
    const arrived = Math.max(0, Math.min(allRows.length, Math.floor((frame - 14) / every) + 1))
    const slide = spring({ config: { damping: 18, stiffness: 220 }, fps: 30, frame: frame - (14 + (arrived - 1) * every) })
    const rows = Array.from({ length: Math.min(arrived, 8) }, (_, j) => ({ ...allRows[arrived - 1 - j], index: arrived - 1 - j }))

    return (
      <Scene duration={duration}>
        <Headline highlight={highlight} size={80} start={0} text={title} style={{ top: 170 }} />
        <PhoneFrame background={WHITE} style={{ opacity: p(frame, 4, 14), top: 470, transform: `translateY(${p(frame, 4, 20, [60, 0])}px)` }}>
          <div style={{ background: WA.bar, flex: 'none', padding: '6px 30px 18px' }}>
            <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: WA.text, fontSize: 54, fontWeight: 750, letterSpacing: '-0.01em' }}>Conversas</span>
              <span style={{ background: '#d9fdd3', borderRadius: 99, color: '#14946b', fontSize: 22, fontWeight: 700, padding: '6px 16px' }}>{badge(arrived)}</span>
            </div>
            <div style={{ alignItems: 'center', background: '#ececec', borderRadius: 18, color: WA.meta, display: 'flex', fontSize: 25, gap: 10, marginTop: 14, padding: '14px 18px' }}>
              <Search size={26} strokeWidth={2} /> Pesquisar
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {rows.map((row, j) => (
              <div
                key={row.index}
                style={{
                  alignItems: 'center',
                  background: j === 0 ? `rgba(217, 253, 211, ${0.6 * (1 - slide)})` : WHITE,
                  display: 'flex',
                  gap: 18,
                  height: CHAT_ROW_H,
                  left: 0,
                  opacity: j === 0 ? slide : 1,
                  padding: '0 26px',
                  position: 'absolute',
                  right: 0,
                  top: (j - (1 - slide)) * CHAT_ROW_H,
                }}
              >
                <span style={{ alignItems: 'center', background: '#dfe5e7', borderRadius: 99, color: '#54656f', display: 'flex', flex: 'none', fontSize: 23, fontWeight: 700, height: 72, justifyContent: 'center', width: 72 }}>{row.initials}</span>
                <div style={{ borderBottom: `1px solid ${WA.divider}`, flex: 1, minWidth: 0, padding: '22px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: WA.text, fontSize: 27, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                    <span style={{ color: WA.meta, flex: 'none', fontSize: 20 }}>10:4{Math.min(9, Math.floor((row.index * every) / 8))}</span>
                  </div>
                  <span style={{ alignItems: 'center', color: WA.meta, display: 'flex', fontSize: 23, gap: 6, marginTop: 4, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <CheckCheck color={WA.tickRead} size={22} strokeWidth={2.4} style={{ flex: 'none' }} />
                    {icon}
                    {row.line}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <OttoNotification at={84} text={notification} />
        </PhoneFrame>
      </Scene>
    )
  }
}

// ─── "E não para…" (cenas completas do reel dos contadores) ──────────────────

/** A big statement ("E não para na nota.") followed by full-length feature scenes. */
export function makeMoreScenes(intro: string, highlight: string[], scenes: ReelScene[]): ReelScene[] {
  function MoreIntroScene({ duration }: { duration: number }) {
    return (
      <Scene duration={duration}>
        <Headline highlight={highlight} size={110} start={0} text={intro} style={{ top: 780 }} />
      </Scene>
    )
  }
  return [{ Component: MoreIntroScene, duration: 50 }, ...scenes]
}

const MORE_TASKS = ['Conciliação bancária', 'Despesas', 'Cobrança no WhatsApp']

const MORE_SCENES = makeMoreScenes('E não para na nota.', ['nota'], [
  { Component: ({ duration }) => <ReconciliationScene duration={duration} index={0} tasks={MORE_TASKS} title="Faz a conciliação bancária." />, duration: 100 },
  { Component: ({ duration }) => <ExpensesScene duration={duration} index={1} tasks={MORE_TASKS} title="Classifica suas despesas." />, duration: 95 },
  { Component: ({ duration }) => <WhatsAppScene duration={duration} index={2} tasks={MORE_TASKS} title="Cobra quem tá te devendo no WhatsApp." />, duration: 105 },
])

// ─── Revelação do Otto ───────────────────────────────────────────────────────

export function makeRevealScene(chips: string[], prefix = 'Isso é o', text = 'Um sistema de gestão que funciona dentro do seu ChatGPT.', highlight = ['chatgpt']) {
  return function RevealScene({ duration }: { duration: number }) {
    const frame = useFrame()
    const reveal = p(frame, 10, 32, [0, 1], Easing.inOut(Easing.cubic))
    const top = chips.length ? 0 : 140

    return (
      <Scene duration={duration}>
        <span style={{ color: INK_MUTED, fontFamily: DISPLAY, fontSize: 84, left: 0, opacity: p(frame, 0, 10), position: 'absolute', right: 0, textAlign: 'center', top: 360 + top }}>{prefix}</span>
        <div style={{ display: 'flex', justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 470 + top }}>
          <Img src={staticFile('logoOtto.svg')} style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`, height: 250, width: 590 }} />
        </div>
        <Headline highlight={highlight} size={70} start={30} stagger={2} text={text} style={{ top: 800 + top }} />
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 18, left: 0, position: 'absolute', right: 0, top: 1170 }}>
          {chips.map((chip, i) => {
            const s = spring({ config: { damping: 14, stiffness: 170 }, fps: 30, frame: frame - 66 - i * 8 })
            return (
              <span key={chip} style={{ alignItems: 'center', background: WHITE, border: `2px solid ${alpha(GRAY, 0x66)}`, borderRadius: 99, display: 'flex', fontSize: 34, fontWeight: 600, gap: 16, opacity: s, padding: '18px 34px 18px 18px', transform: `translateY(${(1 - s) * 30}px)` }}>
                <span style={{ alignItems: 'center', background: DANGER_SOFT, borderRadius: 99, color: TERRA, display: 'flex', height: 50, justifyContent: 'center', width: 50 }}>
                  <X size={30} strokeWidth={2.8} />
                </span>
                {chip}
              </span>
            )
          })}
        </div>
      </Scene>
    )
  }
}

// ─── Também no Claude ────────────────────────────────────────────────────────

export function makeClaudeAlsoScene(title = 'E funciona no Claude também.') {
  return function ClaudeAlsoScene({ duration }: { duration: number }) {
    const frame = useFrame()
    const claude = spring({ config: { damping: 11, stiffness: 150 }, fps: 30, frame: frame - 22 })

    return (
      <Scene duration={duration}>
        <Headline highlight={['claude']} size={96} start={0} text={title} style={{ top: 520 }} />
        <Card style={{ alignItems: 'center', display: 'flex', height: 170, justifyContent: 'center', left: 90, opacity: p(frame, 6, 16), top: 980, width: 420 }}>
          <ChatGptLogo height={60} />
        </Card>
        <Card style={{ alignItems: 'center', border: `3px solid ${TERRA}`, display: 'flex', height: 170, justifyContent: 'center', left: 570, top: 980, transform: `scale(${claude}) rotate(${(1 - claude) * 8}deg)`, width: 420 }}>
          <Img src={staticFile('claudeLogo.svg')} style={{ height: 56 }} />
        </Card>
      </Scene>
    )
  }
}

const ClaudeAlsoScene = makeClaudeAlsoScene()

// ─── CTA ─────────────────────────────────────────────────────────────────────

export function makeCta(title: string, { comment = 'Nota', highlight = ['assim'], keyword = 'NOTA' }: { comment?: string; highlight?: string[]; keyword?: string } = {}) {
  return function ReelCta({ duration }: { duration: number }) {
    return <CtaScene comment={comment} duration={duration} highlight={highlight} keyword={keyword} title={title} titleSize={84} />
  }
}

// ─── Timelines ───────────────────────────────────────────────────────────────

const SINGLE_SCENES: ReelScene[] = syncToNarration([
  { Component: makeHookScene('O ChatGPT agora emite nota fiscal.', ['nota', 'fiscal'], 104), duration: 105 },
  { Component: makePromptScene('Você só escreve:', 'Emite uma nota de R$ 4.000 pra Aurora Tecnologia'), duration: 110 },
  { Component: InvoiceConfirmScene, duration: 130 },
  { Component: WhatsAppDeliveryScene, duration: 100 },
  { Component: makeBatchScene('Trinta vendas? Uma mensagem só e ele emite todas.', ['todas']), duration: 110 },
  ...MORE_SCENES,
  { Component: makeRevealScene(['Sem entrar no site da prefeitura', 'Sem sistema complicado', 'Sem perder tempo']), duration: 140 },
  { Component: ClaudeAlsoScene, duration: 75 },
  { Component: makeCta('Quer emitir sua próxima nota assim?'), duration: 120 },
], [0, 5.2, 9.75, 17.9, 20.85, 25.6, 26.95, 28.85, 30.1, 33.2, 42.5, 44.25], 49)

const BATCH_SCENES: ReelScene[] = syncToNarration([
  { Component: makeHookScene('O ChatGPT agora emite todas as suas notas fiscais de uma vez.', ['todas'], 88), duration: 115 },
  { Component: makePromptScene('Trinta vendas pra faturar? Você só escreve:', 'Emite as notas de todas as vendas de outubro'), duration: 110 },
  { Component: ReviewListScene, duration: 120 },
  { Component: makeBatchScene('Trinta notas emitidas em menos de um minuto.', ['minuto']), duration: 140 },
  {
    Component: makeChatListScene({
      badge: (count) => `${count} enviadas`,
      highlight: ['whatsapp'],
      icon: <FileText size={22} strokeWidth={2.2} style={{ flex: 'none' }} />,
      notification: `${INVOICES.length} notas enviadas no WhatsApp. Contas a receber atualizado.`,
      rows: INVOICES.map((invoice) => ({ initials: invoice.initials, line: `NFS-e ${invoice.number}.pdf`, name: invoice.name })),
      title: 'E cada cliente já recebe a sua no WhatsApp.',
    }),
    duration: 105,
  },
  ...MORE_SCENES,
  { Component: makeRevealScene(['Sem emitir nota por nota', 'Sem entrar no site da prefeitura', 'Sem perder o dia']), duration: 140 },
  { Component: ClaudeAlsoScene, duration: 75 },
  { Component: makeCta('Quer emitir as notas do mês assim?'), duration: 120 },
], [0, 6.45, 12.65, 20.3, 23.8, 26.4, 27.7, 29.8, 31, 34, 43.3, 45], 49.5)

export const OTTO_NOTA_CHATGPT_SINGLE_DURATION = sceneDuration(SINGLE_SCENES)
export const OTTO_NOTA_CHATGPT_BATCH_DURATION = sceneDuration(BATCH_SCENES)

export function OttoNotaChatGptSingleReel() {
  return <ReelRoot audio="remotion/otto-reels/nota-single-narracao.mp3" scenes={SINGLE_SCENES} />
}

export function OttoNotaChatGptBatchReel() {
  return <ReelRoot audio="remotion/otto-reels/nota-batch-narracao.mp3" scenes={BATCH_SCENES} />
}
