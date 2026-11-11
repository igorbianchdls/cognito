import type { ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { Danfse, DANFSE_H, DANFSE_W, makeChave, money, SAMPLE, type DanfseData } from './danfse/Danfse'

// Ad (9:16): the month's invoices in one go, in the Otto app. Hook on a fan of invoices and the promise; the
// "Vendas a faturar" list, "Selecionar todas" and "Emitir 50 notas"; the statuses turning "Autorizada" in a
// cascade with the counter; the app opening into dozens of real-looking DANFSe around a giant counter; the
// clients being notified; and the Otto end card. 1080×1920, 30 fps, 15 s. All data are made up.

export const NOTAS_LOTE_AD_DURATION = 450
const W = 1080, H = 1920
const INTER = loadInter('normal', { subsets: ['latin'], weights: ['400', '500', '600', '700', '800'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const INK = '#111827', MUTED = '#6b7280', LINE = '#e5e7eb', SOFT = '#f6f7f9', GREEN = '#16a34a', AMBER = '#d97706'

// ---------- the month (made up) ----------

const CLIENTS = ['Aurora Tecnologia', 'Padaria Central', 'Studio Lume', 'Clínica Vita', 'Grupo Norte', 'Café Brasa', 'Orbe Digital', 'Mercado Sol', 'Atlas Engenharia', 'Bela Pet',
  'Rota Logística', 'Ateliê Flor', 'Prisma Educação', 'Vértice Consultoria', 'Horta Viva', 'Nexo Saúde', 'Lumen Hotel', 'Casa Moura', 'Farol Imóveis', 'Ponto Fit']
const SERVICES = ['Consultoria em gestão', 'Gestão financeira mensal', 'Implantação de BPO', 'Treinamento de equipe', 'Assessoria contábil']
const TOTAL = 50
const sales = Array.from({ length: TOTAL }, (_, i) => {
  const client = CLIENTS[(i * 7 + Math.floor(random('c' + i) * 3)) % CLIENTS.length]
  const value = Math.round((1500 + random('v' + i) * 5600) / 50) * 50
  return { n: 127 + i, client, service: SERVICES[Math.floor(random('s' + i) * SERVICES.length)], value }
})
const SUM = sales.reduce((s, x) => s + x.value, 0)
const cnpjOf = (i: number) => `${String(10 + Math.floor(random('a' + i) * 89))}.${String(100 + Math.floor(random('b' + i) * 899))}.${String(100 + Math.floor(random('d' + i) * 899))}/0001-${String(10 + Math.floor(random('e' + i) * 89))}`
function noteData(i: number): DanfseData {
  const s = sales[i]
  return { ...SAMPLE, numero: s.n, valor: s.value, chave: makeChave(SAMPLE.emitente.cnpj, s.n, '2611', 'k' + i),
    tomador: { ...SAMPLE.tomador, nome: `${s.client.toUpperCase()} LTDA`, cnpj: cnpjOf(i), email: `financeiro@${s.client.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.com.br` },
    servico: { ...SAMPLE.servico, descricao: `${s.service} referente ao mês de outubro/2026, conforme contrato vigente.` } }
}

// ---------- timing ----------
const HOOK_END = 52
const APP = { start: 48, selectTap: 82, checked: [86, 106], emitTap: 124, sheet: 128, confirmTap: 150, run: [158, 270] as [number, number], end: 282 }
const BURST = { start: 276, end: 366 }
const NOTIF = { start: 360, end: 410 }
const END = 404
/** How many invoices are authorized at frame f. */
const doneAt = (f: number) => Math.floor(interpolate(f, APP.run, [0, TOTAL], { ...clamp, easing: Easing.inOut(Easing.quad) }))

// ---------- shared pieces ----------

function Headline({ lines, at, top, size = 92, outAt, dark = true }: { lines: ReactNode[]; at: number; top: number; size?: number; outAt?: number; dark?: boolean }) {
  const f = useCurrentFrame()
  return <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 50 }}>
    {lines.map((l, i) => {
      const p = out(f, at + i * 5, at + i * 5 + 10), q = outAt ? 1 - ease(f, outAt, outAt + 8) : 1
      return <span key={i} style={{ fontFamily: INTER, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: -2.5, color: dark ? '#fff' : INK, background: dark ? INK : '#fff', padding: '6px 26px 10px', borderRadius: 18,
        opacity: p * q, transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + p * 0.06})`, boxShadow: '0 18px 40px rgb(0 0 0 / .18)' }}>{l}</span>
    })}
  </div>
}

function Tap({ x, y, at }: { x: number; y: number; at: number }) {
  const f = useCurrentFrame()
  const t = f - at
  if (t < -12 || t > 16) return null
  const press = interpolate(t, [0, 3, 8], [1, 0.82, 1], clamp), ring = interpolate(t, [0, 14], [0, 1], clamp)
  return <div style={{ position: 'absolute', left: x - 34, top: y - 34, zIndex: 60, opacity: t > 10 ? 1 - (t - 10) / 6 : out(f, at - 12, at) }}>
    {t >= 0 && <div style={{ position: 'absolute', inset: -ring * 40, borderRadius: '50%', border: '4px solid rgb(0 0 0 / .25)', opacity: 1 - ring }} />}
    <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgb(30 30 30 / .32)', border: '3px solid rgb(255 255 255 / .9)', transform: `scale(${press})` }} />
  </div>
}

function Paper({ i, scale, x, y, rot = 0, opacity = 1, frame }: { i: number; scale: number; x: number; y: number; rot?: number; opacity?: number; frame: number }) {
  return <div style={{ position: 'absolute', left: x - (DANFSE_W * scale) / 2, top: y - (DANFSE_H * scale) / 2, width: DANFSE_W, height: DANFSE_H, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: '0 0', opacity,
    boxShadow: '0 30px 60px rgb(15 23 42 / .22), 0 2px 6px rgb(15 23 42 / .12)' }}>
    <Danfse data={noteData(i)} frame={frame} />
    <div style={{ position: 'absolute', right: 26, top: 230, padding: '6px 16px', borderRadius: 999, background: GREEN, color: '#fff', fontFamily: INTER, fontWeight: 800, fontSize: 26 }}>✓ Autorizada</div>
  </div>
}

// ---------- scene A: hook ----------

function Hook({ f }: { f: number }) {
  const spread = out(f, 0, 30)
  const n = Math.round(interpolate(f, [4, 40], [1, 50], clamp))
  return <AbsoluteFill style={{ background: '#e9ebef' }}>
    {Array.from({ length: 7 }, (_, k) => {
      const a = (k - 3) * 11 * spread, dx = (k - 3) * 120 * spread
      return <Paper key={k} i={k} scale={0.62} x={W / 2 + dx} y={1180 + Math.abs(k - 3) * 30 * spread} rot={a} frame={f} />
    })}
    <Headline lines={['50 notas fiscais.', 'Em 12 segundos.']} at={2} top={230} outAt={HOOK_END - 10} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', fontFamily: INTER, fontWeight: 800, fontSize: 170, color: INK, letterSpacing: -6, opacity: 1 - ease(f, HOOK_END - 10, HOOK_END - 2) }}>{n}</div>
  </AbsoluteFill>
}

// ---------- scene B/C: the Otto app ----------

const ROW_H = 122, LIST_TOP = 560
function statusOf(i: number, f: number): 'faturar' | 'emitindo' | 'autorizada' {
  const n = doneAt(f)
  if (i < n) return 'autorizada'
  if (f >= APP.run[0] && i < n + 3) return 'emitindo'
  return 'faturar'
}

function App({ f }: { f: number }) {
  const n = doneAt(f)
  const running = f >= APP.run[0]
  // The list scrolls along with the cascade so the newest authorized rows stay in view.
  const scroll = running ? interpolate(n, [6, TOTAL], [0, (TOTAL - 9) * ROW_H], clamp) : 0
  const checkedAt = (i: number) => APP.checked[0] + Math.min(i, 12) * ((APP.checked[1] - APP.checked[0]) / 12)
  const selectedAll = f >= APP.selectTap + 2
  const bar = out(f, APP.checked[1] - 6, APP.checked[1] + 4)
  const sheet = f >= APP.sheet && f < APP.confirmTap + 8 ? out(f, APP.sheet, APP.sheet + 10) * (1 - ease(f, APP.confirmTap + 2, APP.confirmTap + 8)) : 0
  const pct = n / TOTAL
  return <AbsoluteFill style={{ background: SOFT, fontFamily: INTER }}>
    {/* App header */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 210, background: '#fff', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-end', padding: '0 48px 30px', gap: 20 }}>
      <Img src={staticFile('logoOttoIcon.svg')} style={{ width: 54, height: 54 }} />
      <b style={{ fontSize: 40, color: INK }}>Faturamento</b>
      <span style={{ marginLeft: 'auto', fontSize: 28, color: MUTED }}>Out/2026</span>
    </div>
    {/* Title + progress */}
    <div style={{ position: 'absolute', left: 48, right: 48, top: 250 }}>
      <div style={{ fontSize: 58, fontWeight: 800, color: INK, letterSpacing: -1.5 }}>{running ? (n >= TOTAL ? 'Notas emitidas' : 'Emitindo notas…') : 'Vendas a faturar'}</div>
      <div style={{ fontSize: 30, color: MUTED, marginTop: 6 }}>{TOTAL} vendas de serviço · {money(SUM)}</div>
      {running && <div style={{ marginTop: 26, background: '#fff', borderRadius: 22, border: `1px solid ${LINE}`, padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 30, color: INK, fontWeight: 600 }}>NFS-e autorizadas</span>
          <span style={{ fontSize: 46, fontWeight: 800, color: n >= TOTAL ? GREEN : INK, fontVariantNumeric: 'tabular-nums' }}>{n}<span style={{ color: MUTED, fontSize: 30 }}> / {TOTAL}</span></span>
        </div>
        <div style={{ marginTop: 14, height: 14, borderRadius: 7, background: '#eef0f3' }}><div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 7, background: GREEN }} /></div>
      </div>}
    </div>
    {/* Select all */}
    {!running && <div style={{ position: 'absolute', left: 48, right: 48, top: 430, height: 90, display: 'flex', alignItems: 'center', gap: 22, fontSize: 32, color: INK, fontWeight: 600 }}>
      <Check on={selectedAll} />Selecionar todas ({TOTAL})
    </div>}
    {/* List */}
    <div style={{ position: 'absolute', left: 32, right: 32, top: running ? LIST_TOP + 60 : LIST_TOP, bottom: 0, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-scroll}px)` }}>
        {sales.map((s, i) => {
          const st = statusOf(i, f)
          const checked = f >= checkedAt(i)
          return <div key={i} style={{ height: ROW_H - 12, marginBottom: 12, background: '#fff', borderRadius: 22, border: `1px solid ${st === 'autorizada' ? '#bbf7d0' : LINE}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px'}}>
            {!running && <Check on={checked} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 31, fontWeight: 600, color: INK, whiteSpace: 'nowrap' }}>{s.client}</div>
              <div style={{ fontSize: 24, color: MUTED, marginTop: 2 }}>{running && st === 'autorizada' ? `NFS-e nº ${s.n} · ${s.service}` : s.service}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{money(s.value)}</span>
              <Chip st={st} />
            </div>
          </div>
        })}
      </div>
    </div>
    {/* Bottom bar */}
    {!running && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, background: '#fff', borderTop: `1px solid ${LINE}`, transform: `translateY(${(1 - bar) * 240}px)`, display: 'flex', alignItems: 'center', padding: '0 48px 40px', gap: 24, boxShadow: '0 -14px 40px rgb(0 0 0 / .08)' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 32, color: INK }}>{TOTAL} selecionadas</b><span style={{ fontSize: 28, color: MUTED }}>{money(SUM)}</span></div>
      <div style={{ marginLeft: 'auto', padding: '30px 44px', borderRadius: 999, background: GREEN, color: '#fff', fontSize: 34, fontWeight: 800, transform: `scale(${f >= APP.emitTap && f < APP.emitTap + 6 ? 0.95 : 1})` }}>Emitir {TOTAL} notas</div>
    </div>}
    {/* Confirmation sheet */}
    {sheet > 0 && <>
      <div style={{ position: 'absolute', inset: 0, background: `rgb(0 0 0 / ${0.35 * sheet})` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '40px 40px 0 0', padding: '40px 48px 70px', transform: `translateY(${(1 - sheet) * 600}px)` }}>
        <div style={{ width: 90, height: 8, borderRadius: 4, background: '#d1d5db', margin: '0 auto 30px' }} />
        <div style={{ fontSize: 46, fontWeight: 800, color: INK }}>Emitir {TOTAL} NFS-e?</div>
        <div style={{ fontSize: 30, color: MUTED, marginTop: 12, lineHeight: 1.4 }}>Total {money(SUM)}. ISS e retenções calculados automaticamente para cada cliente.</div>
        <div style={{ marginTop: 36, height: 110, borderRadius: 55, background: INK, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 800, transform: `scale(${f >= APP.confirmTap && f < APP.confirmTap + 6 ? 0.96 : 1})` }}>Confirmar emissão</div>
      </div>
    </>}
    <Tap x={90} y={475} at={APP.selectTap} />
    <Tap x={W - 220} y={H - 140} at={APP.emitTap} />
    <Tap x={W / 2} y={H - 125} at={APP.confirmTap} />
    <Headline lines={['Seleciona o mês todo.']} at={APP.selectTap - 6} top={1250} size={76} outAt={APP.emitTap - 6} />
    <Headline lines={['Um toque.']} at={APP.emitTap - 4} top={1050} size={84} outAt={APP.confirmTap - 4} />
    <Headline lines={['Emitindo e autorizando…']} at={APP.run[0] + 10} top={1640} size={70} outAt={APP.end - 16} />
  </AbsoluteFill>
}

function Check({ on }: { on: boolean }) {
  return <span style={{ width: 46, height: 46, flex: 'none', borderRadius: 12, border: `3px solid ${on ? GREEN : '#cbd5e1'}`, background: on ? GREEN : '#fff', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 30, fontWeight: 800 }}>{on ? '✓' : ''}</span>
}
function Chip({ st }: { st: 'faturar' | 'emitindo' | 'autorizada' }) {
  const m = { faturar: ['A faturar', '#f3f4f6', MUTED], emitindo: ['Emitindo…', '#fef3c7', AMBER], autorizada: ['✓ Autorizada', '#dcfce7', GREEN] }[st]
  return <span style={{ fontSize: 23, fontWeight: 700, padding: '5px 14px', borderRadius: 999, background: m[1], color: m[2] }}>{m[0]}</span>
}

// ---------- scene D: the burst ----------

function Burst({ f }: { f: number }) {
  const t = f - BURST.start
  const app = 1 - ease(f, BURST.start, BURST.start + 14)
  const count = Math.round(interpolate(f, [BURST.start + 6, BURST.start + 40], [1, TOTAL], clamp))
  const total = interpolate(f, [BURST.start + 6, BURST.start + 40], [0, SUM], clamp)
  const papers = Array.from({ length: 14 }, (_, k) => {
    const ang = (k / 14) * Math.PI * 2 + 0.3, r = 400 + random('r' + k) * 140
    const p = out(f, BURST.start + 4 + k * 2, BURST.start + 26 + k * 2)
    return { k, x: W / 2 + Math.cos(ang) * r * p, y: 960 + Math.sin(ang) * r * 1.7 * p, rot: (random('rot' + k) - 0.5) * 36 * p, s: 0.2 + 0.12 * p }
  })
  return <AbsoluteFill style={{ background: '#e9ebef' }}>
    {app > 0.01 && <div style={{ position: 'absolute', inset: 0, opacity: app, transform: `scale(${0.7 + app * 0.3})` }}><App f={APP.end} /></div>}
    {papers.map(p => <Paper key={p.k} i={p.k + 10} scale={p.s} x={p.x} y={p.y} rot={p.rot} frame={f} />)}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: INTER, opacity: out(f, BURST.start + 4, BURST.start + 14), zIndex: 30 }}>
      <div style={{ background: '#fff', borderRadius: 48, padding: '40px 80px 46px', boxShadow: '0 40px 90px rgb(15 23 42 / .25)', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${t > 40 && t < 50 ? 1 + 0.04 * Math.sin(((t - 40) / 10) * Math.PI) : 1})` }}>
        <span style={{ fontSize: 230, fontWeight: 800, color: count >= TOTAL ? GREEN : INK, letterSpacing: -10, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
        <span style={{ fontSize: 46, fontWeight: 700, color: INK, marginTop: 6 }}>notas autorizadas</span>
        <span style={{ fontSize: 40, color: MUTED, marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>{money(total)} faturados</span>
      </div>
    </div>
  </AbsoluteFill>
}

// ---------- scene E: clients notified ----------

function Notifications({ f }: { f: number }) {
  const items: [string, string, string, string][] = [
    ['WhatsApp', '#25d366', 'Aurora Tecnologia', 'NFSe_000000127.pdf enviada ✓'],
    ['E-mail', '#2563eb', 'Padaria Central', 'Sua nota fiscal de outubro chegou'],
    ['WhatsApp', '#25d366', 'Studio Lume', 'NFSe_000000129.pdf enviada ✓'],
    ['E-mail', '#2563eb', 'Clínica Vita', 'NFS-e nº 130 · PDF e XML anexos'],
    ['WhatsApp', '#25d366', 'Grupo Norte', 'NFSe_000000131.pdf enviada ✓'],
  ]
  return <AbsoluteFill style={{ background: 'linear-gradient(180deg, #dfe4ec, #eef1f5)', fontFamily: INTER }}>
    {items.map(([app, color, who, msg], i) => {
      const p = out(f, NOTIF.start + i * 6, NOTIF.start + i * 6 + 10)
      return <div key={i} style={{ position: 'absolute', left: 50, right: 50, top: 300 + i * 190, height: 166, borderRadius: 38, background: 'rgb(255 255 255 / .92)', boxShadow: '0 14px 30px rgb(15 23 42 / .12)', display: 'flex', alignItems: 'center', gap: 26, padding: '0 32px',
        opacity: p, transform: `translateY(${(1 - p) * -60}px)` }}>
        <span style={{ width: 84, height: 84, borderRadius: 22, background: color, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 34 }}>{app === 'WhatsApp' ? 'W' : '@'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontSize: 30, color: INK }}>{app} · {who}</b><span style={{ fontSize: 24, color: MUTED }}>agora</span></div>
          <div style={{ fontSize: 30, color: '#374151', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</div>
        </div>
      </div>
    })}
    <Headline lines={['E envia pra cada cliente.']} at={NOTIF.start + 10} top={1340} size={76} outAt={NOTIF.end - 4} />
  </AbsoluteFill>
}

// ---------- scene F: end card ----------

function EndCard({ f }: { f: number }) {
  const a = out(f, END, END + 12), b = out(f, END + 8, END + 20), c = out(f, END + 16, END + 28)
  return <AbsoluteFill style={{ background: '#fff', alignItems: 'center', justifyContent: 'center', gap: 46, fontFamily: INTER, textAlign: 'center' }}>
    <Img src={staticFile('logoOtto.svg')} style={{ width: 380, opacity: a, transform: `scale(${0.9 + a * 0.1})` }} />
    <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, color: INK, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>50 notas em<br /><span style={{ color: GREEN }}>12 segundos.</span></div>
    <div style={{ fontSize: 40, color: '#4b5563', opacity: b }}>O fechamento do mês, num toque.</div>
    <div style={{ marginTop: 20, padding: '28px 70px', borderRadius: 999, background: GREEN, color: '#fff', fontSize: 46, fontWeight: 800, opacity: c, transform: `scale(${0.9 + c * 0.1})`, boxShadow: '0 18px 40px rgb(22 163 74 / .35)' }}>Teste grátis</div>
  </AbsoluteFill>
}

export function OttoNotasLoteAd() {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
    {f < HOOK_END && <Hook f={f} />}
    {f >= HOOK_END && f < BURST.start && <div style={{ position: 'absolute', inset: 0, opacity: out(f, HOOK_END, HOOK_END + 8) }}><App f={f} /></div>}
    {f >= BURST.start && f < NOTIF.start && <Burst f={f} />}
    {f >= NOTIF.start && f < END && <Notifications f={f} />}
    {f >= END && <EndCard f={f} />}
  </AbsoluteFill>
}
