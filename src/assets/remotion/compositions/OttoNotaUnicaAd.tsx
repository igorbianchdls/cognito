import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { FONT_CSS, StatusBar, TopBar } from './ChatGptVendasCardReplica'
import { MentionBubble } from './ChatGptMention'
import { Danfse, danfseTotals, DANFSE_H, DANFSE_W, money, SAMPLE, SECTION_Y, type DanfseSection } from './danfse/Danfse'

// Ad (9:16): one invoice, asked in the chat. Hook on the invoice itself filling up; then the ChatGPT conversation
// with the Otto card and "Confirmar e emitir"; the DANFSe full screen with the camera going through it (client,
// service, taxes calculating, net value, access key and QR Code) until "Autorizada"; the PDF reaching the client
// on WhatsApp; and the Otto end card. 1080×1920, 30 fps, 15 s. All data are made up.

export const NOTA_UNICA_AD_DURATION = 450
const W = 1080, H = 1920
const INTER = loadInter('normal', { subsets: ['latin'], weights: ['500', '600', '700', '800'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
const track = (f: number, keys: number[], vals: number[]) => interpolate(f, keys, vals, { ...clamp, easing: Easing.inOut(Easing.cubic) })

const GREEN = '#16a34a', OTTO = '#111827', PAPER_BG = '#e9ebef'
const T = danfseTotals(SAMPLE)

// ---------- timing (frames) ----------
const HOOK_END = 58
const CHAT = { start: 54, bubble: 66, think: 80, text: 94, card: 116, tap: 158, end: 182 }
const DOC = { start: 178, end: 352 }
const WA = { start: 346, end: 410 }
const END = 404

/** When each section of the invoice fills in (frames), during the full-screen part. */
const FILL: Record<DanfseSection, [number, number]> = {
  header: [196, 206], emitente: [198, 212], tomador: [210, 230], intermediario: [228, 232], servico: [232, 252], municipal: [252, 270],
  federal: [266, 284], ibscbs: [278, 290], total: [286, 302], aproximados: [296, 304], info: [300, 310],
}
const COUNT: Partial<Record<DanfseSection, [number, number]>> = { municipal: [254, 274], federal: [268, 288], ibscbs: [280, 292], total: [288, 306], aproximados: [298, 308] }
const CHAVE: [number, number] = [308, 330]
const QR: [number, number] = [310, 332]
const AUTH = 334

// ---------- shared pieces ----------

function Headline({ lines, at, top, size = 92, color = '#fff', bg = OTTO, outAt }: { lines: ReactNode[]; at: number; top: number; size?: number; color?: string; bg?: string; outAt?: number }) {
  const f = useCurrentFrame()
  return <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 50 }}>
    {lines.map((l, i) => {
      const p = out(f, at + i * 5, at + i * 5 + 10), q = outAt ? 1 - ease(f, outAt, outAt + 8) : 1
      return <span key={i} style={{ fontFamily: INTER, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: -2.5, color, background: bg, padding: '6px 26px 10px', borderRadius: 18,
        opacity: p * q, transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + p * 0.06})`, boxShadow: '0 18px 40px rgb(0 0 0 / .18)' }}>{l}</span>
    })}
  </div>
}

function Tap({ x, y, at }: { x: number; y: number; at: number }) {
  const f = useCurrentFrame()
  const t = f - at
  if (t < -12 || t > 16) return null
  const come = out(f, at - 12, at), press = interpolate(t, [0, 3, 8], [1, 0.82, 1], clamp), ring = interpolate(t, [0, 14], [0, 1], clamp)
  return <div style={{ position: 'absolute', left: x - 34, top: y - 34, zIndex: 60, opacity: t > 10 ? 1 - (t - 10) / 6 : come }}>
    {t >= 0 && <div style={{ position: 'absolute', inset: -ring * 40, borderRadius: '50%', border: '4px solid rgb(0 0 0 / .25)', opacity: 1 - ring }} />}
    <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgb(30 30 30 / .32)', border: '3px solid rgb(255 255 255 / .9)', transform: `scale(${press})` }} />
  </div>
}

/** The DANFSe framed by a camera: zoom z, and the sheet point (cx, cy) placed at the screen point (sx, sy). */
function Sheet({ z, cx, cy, sx = W / 2, sy = 1000, children, shadow = true }: { z: number; cx: number; cy: number; sx?: number; sy?: number; children: ReactNode; shadow?: boolean }) {
  return <div style={{ position: 'absolute', left: sx - cx * z, top: sy - cy * z, width: DANFSE_W, height: DANFSE_H, transform: `scale(${z})`, transformOrigin: '0 0',
    boxShadow: shadow ? '0 30px 80px rgb(15 23 42 / .22), 0 2px 6px rgb(15 23 42 / .12)' : 'none' }}>{children}</div>
}
const mid = (s: DanfseSection) => SECTION_Y[s][0] + SECTION_Y[s][1] / 2

// ---------- scene A: hook ----------

function Hook({ f }: { f: number }) {
  const z = track(f, [0, HOOK_END], [2.3, 2.05])
  const cy = track(f, [0, HOOK_END], [430, 700])
  const fill = (s: DanfseSection) => {
    const order: DanfseSection[] = ['tomador', 'intermediario', 'servico', 'municipal', 'federal', 'ibscbs', 'total']
    const i = order.indexOf(s)
    return i < 0 ? 1 : interpolate(f, [4 + i * 6, 12 + i * 6], [0, 1], clamp)
  }
  return <AbsoluteFill style={{ background: PAPER_BG }}>
    <Sheet z={z} cx={330} cy={cy} sy={1060}><Danfse reveal={fill} count={fill} frame={f} /></Sheet>
    <Headline lines={['Pediu no chat.', 'A nota sai pronta.']} at={2} top={250} outAt={HOOK_END - 10} />
  </AbsoluteFill>
}

// ---------- scene B: chat ----------

const S = W / 828 // the ChatGPT replica is drawn at 828 px wide
function OttoCard({ f }: { f: number }) {
  const a = out(f, CHAT.card, CHAT.card + 10)
  const row = (i: number) => out(f, CHAT.card + 6 + i * 4, CHAT.card + 14 + i * 4)
  const pressed = f >= CHAT.tap && f < CHAT.tap + 6
  const sending = f >= CHAT.tap + 2
  const rows: [string, ReactNode][] = [
    ['Tomador', <span key="t">Aurora Tecnologia Ltda <span style={{ color: GREEN }}>✓</span></span>],
    ['CNPJ', '28.417.903/0001-62 · ativo'],
    ['Serviço', '17.01 · Consultoria em gestão'],
    ['Valor', money(SAMPLE.valor)],
    ['ISS (5%)', money(T.iss)],
    ['Retenções federais', money(T.federais)],
  ]
  return <div style={{ position: 'absolute', left: 30, right: 30, top: 560, borderRadius: 30, background: '#fff', border: '1.5px solid #e5e5e5', boxShadow: '0 10px 30px rgb(0 0 0 / .06)', padding: '26px 30px 28px', opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <Img src={staticFile('logoOttoIcon.svg')} style={{ width: 42, height: 42 }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <b style={{ fontSize: 27, color: '#0d0d0d' }}>Nota fiscal de serviço</b>
        <span style={{ fontSize: 21, color: '#8e8e8e' }}>Otto ERP · prévia</span>
      </div>
    </div>
    {rows.map(([k, v], i) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: '1px solid #efefef', fontSize: 25, opacity: row(i) }}>
      <span style={{ color: '#6b6b6b' }}>{k}</span><span style={{ color: '#0d0d0d', fontWeight: 500 }}>{v}</span>
    </div>)}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0 4px', borderTop: '1px solid #efefef', opacity: row(6) }}>
      <span style={{ fontSize: 26, color: '#0d0d0d', fontWeight: 600 }}>Valor líquido</span><span style={{ fontSize: 36, color: GREEN, fontWeight: 700 }}>{money(T.liquido)}</span>
    </div>
    <div style={{ marginTop: 20, height: 74, borderRadius: 37, background: '#0d0d0d', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 27, fontWeight: 600, opacity: row(7), transform: `scale(${pressed ? 0.96 : 1})` }}>
      {sending ? <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid rgb(255 255 255 / .3)', borderTopColor: '#fff', transform: `rotate(${f * 18}deg)` }} />Emitindo…</span> : 'Confirmar e emitir'}
    </div>
  </div>
}

function Chat({ f }: { f: number }) {
  const text = 'Pronto! Preparei a nota fiscal de serviço da Aurora Tecnologia. Confira e confirme:'
  const shown = Math.floor(interpolate(f, [CHAT.text, CHAT.text + 22], [0, text.length], clamp))
  const thinking = f >= CHAT.think && f < CHAT.text
  return <AbsoluteFill style={{ background: '#fff' }}>
    <style>{FONT_CSS}</style>
    <div className="chatgpt-replica" style={{ position: 'absolute', left: 0, top: 0, width: 828, height: H / S, transform: `scale(${S})`, transformOrigin: '0 0' }}>
      <StatusBar />
      <TopBar />
      <MentionBubble at={CHAT.bubble} frame={f} lines={['Emite uma nota de R$ 4.000', 'pra Aurora Tecnologia,', 'consultoria de outubro']} top={210} />
      {thinking && <div style={{ position: 'absolute', left: 40, top: 430, display: 'flex', gap: 10 }}>{[0, 1, 2].map(i => <i key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: '#0d0d0d', opacity: 0.3 + 0.7 * Math.abs(Math.sin((f + i * 4) / 5)) }} />)}</div>}
      {f >= CHAT.text && <div style={{ position: 'absolute', left: 40, right: 40, top: 420, fontSize: 31, lineHeight: '46px', color: '#0d0d0d' }}>{text.slice(0, shown)}</div>}
      {f >= CHAT.card && <OttoCard f={f} />}
      {/* Composer */}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 46, height: 104, borderRadius: 52, border: '1.5px solid #e3e3e3', background: '#fff', boxShadow: '0 6px 20px rgb(0 0 0 / .05)', display: 'flex', alignItems: 'center', padding: '0 30px', gap: 22, color: '#8e8e8e', fontSize: 30 }}>
        <span style={{ fontSize: 44, color: '#0d0d0d', fontWeight: 300 }}>+</span><span style={{ flex: 1 }}>Pergunte qualquer coisa</span>
        <span style={{ width: 62, height: 62, borderRadius: '50%', background: '#0d0d0d' }} />
      </div>
    </div>
    <Tap x={W / 2} y={1085 * S} at={CHAT.tap} />
    <Headline lines={['É só pedir.']} at={CHAT.bubble - 4} top={1530} size={80} outAt={CHAT.tap - 6} />
  </AbsoluteFill>
}

// ---------- scene C: the DANFSe full screen ----------

const CAM_KEYS = [DOC.start, 200, 212, 230, 250, 270, 288, 304, 316, 330, 344]
const CAM_Z = [1.05, 1.28, 2.0, 2.0, 2.0, 2.0, 2.05, 2.05, 1.34, 1.34, 1.28]
const CAM_CX = [397, 397, 300, 330, 330, 360, 420, 420, 397, 397, 397]
const CAM_CY = [561, 561, mid('tomador'), mid('servico'), mid('municipal'), mid('federal'), mid('total') - 10, mid('total') - 10, 400, 400, 561]
const focusAt = (f: number): DanfseSection | null =>
  f >= 210 && f < 232 ? 'tomador' : f >= 232 && f < 252 ? 'servico' : f >= 252 && f < 268 ? 'municipal' : f >= 268 && f < 286 ? 'federal' : f >= 286 && f < 306 ? 'total' : null

function Document({ f }: { f: number }) {
  const z = track(f, CAM_KEYS, CAM_Z), cx = track(f, CAM_KEYS, CAM_CX), cy = track(f, CAM_KEYS, CAM_CY)
  const reveal = (s: DanfseSection) => interpolate(f, FILL[s], [0, 1], clamp)
  const count = (s: DanfseSection) => COUNT[s] ? interpolate(f, COUNT[s]!, [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }) : 1
  const authorized = f >= AUTH
  const enter = out(f, DOC.start, DOC.start + 16)
  const totalPulse = f >= 300 && f < 312 ? 1 + 0.04 * Math.sin(((f - 300) / 12) * Math.PI) : 1
  return <AbsoluteFill style={{ background: PAPER_BG }}>
    <div style={{ position: 'absolute', inset: 0, opacity: enter, transform: `scale(${0.9 + enter * 0.1})` }}>
      <Sheet z={z * totalPulse} cx={cx} cy={cy}><Danfse reveal={reveal} count={count} chave={interpolate(f, CHAVE, [0, 1], clamp)} qr={interpolate(f, QR, [0, 1], clamp)} focus={focusAt(f)} frame={f} /></Sheet>
      {/* CNPJ check while the client fills in */}
      {f >= 222 && f < 252 && <div style={{ position: 'absolute', left: 120, top: 1000 - 70, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 999, background: GREEN, color: '#fff', fontFamily: INTER, fontWeight: 700, fontSize: 34, opacity: out(f, 222, 230), boxShadow: '0 10px 24px rgb(22 163 74 / .35)' }}>✓ CNPJ ativo na Receita</div>}
    </div>
    {/* Status at the top, as in the app */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', zIndex: 30, opacity: enter }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 34px', borderRadius: 999, background: authorized ? GREEN : '#fff', color: authorized ? '#fff' : OTTO, fontFamily: INTER, fontWeight: 700, fontSize: 36,
        boxShadow: '0 14px 34px rgb(15 23 42 / .16)', transform: `scale(${authorized ? 1 + 0.08 * Math.max(0, 1 - (f - AUTH) / 10) : 1})` }}>
        {authorized ? <>✓ NFS-e autorizada · nº {SAMPLE.numero}</> : <><span style={{ width: 28, height: 28, borderRadius: '50%', border: '4px solid #d1d5db', borderTopColor: OTTO, transform: `rotate(${f * 16}deg)` }} />{f < 304 ? 'Preenchendo a nota…' : 'Enviando à Receita…'}</>}
      </div>
    </div>
    <Headline lines={['Preenche sozinha']} at={212} top={1640} size={86} outAt={248} />
    <Headline lines={['Calcula os impostos']} at={254} top={1640} size={86} outAt={302} />
    <Headline lines={['Gera chave e QR Code']} at={306} top={1640} size={86} outAt={336} />
  </AbsoluteFill>
}

// ---------- scene D: WhatsApp ----------

function WhatsApp({ f }: { f: number }) {
  const t = f - WA.start
  const sheet = 1 - ease(f, WA.start, WA.start + 16) // the page shrinking into the file
  const bubble = out(f, WA.start + 14, WA.start + 24)
  const msg = out(f, WA.start + 24, WA.start + 32)
  const ticks = f >= WA.start + 34
  return <AbsoluteFill style={{ background: '#efeae2' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: 'radial-gradient(circle at 20px 20px, #d8d1c5 2px, transparent 2.5px)', backgroundSize: '56px 56px' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: '#f6f6f6', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'flex-end', padding: '0 40px 28px', gap: 24, fontFamily: INTER }}>
      <span style={{ fontSize: 56, color: '#007aff', lineHeight: 1 }}>‹</span>
      <span style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 36 }}>AT</span>
      <span style={{ display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 38, color: '#111' }}>Aurora Tecnologia</b><span style={{ fontSize: 26, color: '#8a8a8a' }}>online</span></span>
    </div>
    {/* the sheet flying into the chat */}
    {sheet > 0.01 && <Sheet z={0.3 + sheet * 0.98} cx={397} cy={561} sy={1000 + (1 - sheet) * 260}><Danfse frame={f} /></Sheet>}
    <div style={{ position: 'absolute', right: 34, top: 1060, width: 760, fontFamily: INTER, opacity: bubble, transform: `translateY(${(1 - bubble) * 40}px)` }}>
      <div style={{ background: '#d9fdd3', borderRadius: 24, padding: 14, boxShadow: '0 1px 1px rgb(0 0 0 / .12)' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgb(0 0 0 / .05)', borderRadius: 16, padding: 18 }}>
          <div style={{ width: 86, height: 108, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgb(0 0 0 / .2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: DANFSE_W, height: DANFSE_H, transform: `scale(${86 / DANFSE_W})`, transformOrigin: '0 0' }}><Danfse frame={f} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <b style={{ fontSize: 31, color: '#111' }}>NFSe_000000127.pdf</b>
            <span style={{ fontSize: 25, color: '#667781' }}>1 página · PDF · 84 kB</span>
          </div>
        </div>
        <div style={{ fontSize: 31, color: '#111', lineHeight: '42px', padding: '14px 8px 0', opacity: msg }}>Oi! Segue a nota fiscal de outubro. Qualquer dúvida, é só chamar.</div>
        <div style={{ textAlign: 'right', fontSize: 23, color: '#667781', padding: '2px 8px 0' }}>14:32 <span style={{ color: ticks ? '#53bdeb' : '#8696a0', fontWeight: 700 }}>✓✓</span></div>
      </div>
    </div>
    {t > 0 && <Headline lines={['E já envia pro cliente']} at={WA.start + 18} top={1560} size={84} outAt={WA.end - 6} />}
  </AbsoluteFill>
}

// ---------- scene E: end card ----------

function EndCard({ f }: { f: number }) {
  const a = out(f, END, END + 12), b = out(f, END + 8, END + 20), c = out(f, END + 16, END + 28)
  const s: CSSProperties = { fontFamily: INTER, textAlign: 'center' }
  return <AbsoluteFill style={{ background: '#fff', alignItems: 'center', justifyContent: 'center', gap: 46 }}>
    <Img src={staticFile('logoOtto.svg')} style={{ width: 380, opacity: a, transform: `scale(${0.9 + a * 0.1})` }} />
    <div style={{ ...s, fontSize: 82, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05, color: OTTO, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>Emita notas fiscais<br />conversando.</div>
    <div style={{ ...s, fontSize: 40, color: '#4b5563', opacity: b }}>Direto no ChatGPT, com o Otto.</div>
    <div style={{ ...s, marginTop: 20, padding: '28px 70px', borderRadius: 999, background: GREEN, color: '#fff', fontSize: 46, fontWeight: 800, opacity: c, transform: `scale(${0.9 + c * 0.1})`, boxShadow: '0 18px 40px rgb(22 163 74 / .35)' }}>Teste grátis</div>
  </AbsoluteFill>
}

export function OttoNotaUnicaAd() {
  const f = useCurrentFrame()
  const scene = f < HOOK_END ? 'hook' : f < CHAT.end ? 'chat' : f < DOC.end ? 'doc' : f < END ? 'wa' : 'end'
  // Short cross-fades between scenes.
  const fadeIn = (start: number) => out(f, start, start + 8)
  return <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
    {scene === 'hook' && <Hook f={f} />}
    {scene === 'chat' && <div style={{ position: 'absolute', inset: 0, opacity: fadeIn(HOOK_END) }}><Chat f={f} /></div>}
    {scene === 'doc' && <Document f={f} />}
    {scene === 'wa' && <WhatsApp f={f} />}
    {scene === 'end' && <EndCard f={f} />}
  </AbsoluteFill>
}
