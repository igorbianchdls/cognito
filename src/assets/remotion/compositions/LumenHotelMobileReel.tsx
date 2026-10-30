import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { HotelIcon, SunHorizon } from '@/assets/landingpages/hotel/Art'

/*
 * Screen-recording style reel of the Lumen hotel app on a phone. The UI is rebuilt
 * with plain components at the phone's logical size (390 px wide) and scaled to
 * 1080×1920, so it matches the mobile layout of /hotel one to one.
 */

export const LUMEN_HOTEL_MOBILE_DURATION = 720

const W = 390
const H = 693
const SCALE = 1080 / W
const ease = Easing.inOut(Easing.cubic)

const C = {
  navy: '#0b2440', sky: '#8fd3ff', bg: '#f3f6fa', ink: '#0f1d2e', text: '#3b4a5c', muted: '#7a8899', line: '#e4eaf1',
  green: '#12935a', greenSoft: '#e2f6ec', blue: '#1f6fd1', blueSoft: '#e6f0fd',
}
const font: CSSProperties = { fontFamily: 'var(--font-geist-sans), Geist, system-ui, sans-serif', ['--ui-font-family' as string]: 'var(--font-geist-sans), Geist, system-ui, sans-serif' }

// Timeline (frames at 30 fps).
const T = {
  scroll1: [80, 140], scroll2: [175, 235], tapCheckIn: 268, scroll3: [345, 410], scroll4: [440, 485],
  tapReservas: 520, reservasScroll: [560, 620], tapInicio: 655,
} as const

/** Scroll offset of the home screen at a given frame. */
function homeScroll(f: number) {
  const step = (from: number, to: number, [a, b]: readonly [number, number]) => interpolate(f, [a, b], [from, to], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  if (f < T.scroll2[0]) return step(0, 540, T.scroll1)
  if (f < T.scroll3[0]) return step(540, 960, T.scroll2)
  if (f < T.scroll4[0]) return step(960, 1360, T.scroll3)
  return step(1360, 1540, T.scroll4)
}

const count = (f: number, value: number, start = 8, end = 44) => Math.round(interpolate(f, [start, end], [0, value], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

/** Finger-tap marker: a soft circle that presses in and fades out. */
function Tap({ at, size = 46 }: { at: number; size?: number }) {
  const f = useCurrentFrame()
  if (f < at - 8 || f > at + 16) return null
  const press = interpolate(f, [at - 8, at, at + 16], [1.25, .82, 1.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity = interpolate(f, [at - 8, at - 3, at + 4, at + 16], [0, .9, .7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <span style={{ background: 'rgb(255 255 255 / .55)', border: '2px solid rgb(255 255 255 / .9)', borderRadius: '50%', boxShadow: '0 2px 12px rgb(0 0 0 / .25)', height: size, left: '50%', marginLeft: -size / 2, marginTop: -size / 2, opacity, pointerEvents: 'none', position: 'absolute', top: '50%', transform: `scale(${press})`, width: size, zIndex: 5 }} />
}

function Avatar({ name, size = 40, light = false }: { name: string; size?: number; light?: boolean }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  return <span style={{ alignItems: 'center', background: light ? 'linear-gradient(135deg, #8fd3ff, #2a7fc1)' : 'linear-gradient(135deg, #2b6aa6, #0b2440)', borderRadius: '50%', color: light ? C.navy : '#fff', display: 'inline-flex', flexShrink: 0, fontSize: size * .38, fontWeight: 600, height: size, justifyContent: 'center', lineHeight: 1, width: size }}>{initials}</span>
}

function Logo({ size = 34 }: { size?: number }) {
  return <svg viewBox="0 0 40 40" width={size} height={size} style={{ color: '#9fdcff', filter: 'drop-shadow(0 2px 8px rgb(0 0 0 / .25))' }}><g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 14 C10 8 15 8 20 13 S30 18 35 12" /><path d="M5 22 C10 16 15 16 20 21 S30 26 35 20" /><path d="M5 30 C10 24 15 24 20 29 S30 34 35 28" /></g></svg>
}

function Sun() {
  return <svg viewBox="0 0 80 80" width={50} height={50} style={{ filter: 'drop-shadow(0 6px 18px rgb(255 190 40 / .5))', flexShrink: 0 }}>
    <defs><radialGradient id="lumen-reel-sun" cx=".38" cy=".35" r=".7"><stop offset="0" stopColor="#fff6c2" /><stop offset=".45" stopColor="#ffd34d" /><stop offset="1" stopColor="#f5a614" /></radialGradient></defs>
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x="37" y="3" width="6" height="13" rx="3" fill="#ffc933" transform={`rotate(${i * 45} 40 40)`} />)}
    <circle cx="40" cy="40" r="19" fill="url(#lumen-reel-sun)" />
  </svg>
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const Icon = {
  bell: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  chevronDown: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>,
  chevronRight: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2}><path d="m9 18 6-6-6-6" /></svg>,
  arrowRight: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>,
  plus: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2}><path d="M5 12h14" /><path d="M12 5v14" /></svg>,
  check: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}><path d="M20 6 9 17l-5-5" /></svg>,
  search: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  house: (s = 22, w = 1.8) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={w}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  calendar: (s = 22, w = 1.8) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={w}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>,
  bed: (s = 22, w = 1.8) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={w}><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M12 4v6" /><path d="M2 18h20" /></svg>,
  menu: (s = 22, w = 1.8) => <svg width={s} height={s} viewBox="0 0 24 24" {...stroke} strokeWidth={w}><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
}

function StatusBar({ backdrop = 0 }: { backdrop?: number }) {
  const color = '#fff'
  // Once the page scrolls, content passes under a frosted strip, as in a home-screen web app.
  return <div style={{ alignItems: 'center', backdropFilter: backdrop ? `blur(${14 * backdrop}px)` : undefined, background: `rgb(8 26 48 / ${.55 * backdrop})`, color, display: 'flex', fontSize: 15, fontWeight: 600, height: 44, justifyContent: 'space-between', left: 0, padding: '0 26px 0 32px', position: 'absolute', right: 0, top: 0, zIndex: 30 }}>
    <span>9:41</span>
    <span style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
      <svg width="17" height="11" viewBox="0 0 17 11" fill={color}><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 4a9.5 9.5 0 0 1 13 0" /><path d="M4 6.6a6 6 0 0 1 8 0" /><circle cx="8" cy="9.2" r="1" fill={color} stroke="none" /></svg>
      <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke={color} opacity=".45" /><rect x="2" y="2" width="19" height="8" rx="2" fill={color} /><rect x="23.6" y="4" width="1.6" height="4" rx=".8" fill={color} opacity=".5" /></svg>
    </span>
  </div>
}

/** Top bar of the overview (photo mode): logo, bell and avatar. */
function HomeTopBar() {
  return <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 16px' }}>
    <div style={{ alignItems: 'center', color: '#fff', display: 'flex', gap: 10, textShadow: '0 2px 12px rgb(0 0 0 / .3)' }}><Logo /><span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}><b style={{ fontSize: 24, fontWeight: 600, letterSpacing: -.6 }}>Lumen</b><small style={{ color: '#e3f2fd', fontSize: 11, fontWeight: 500, letterSpacing: 2.6, marginTop: 4 }}>HOTEL</small></span></div>
    <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
      <span style={{ alignItems: 'center', background: 'rgb(12 32 56 / .38)', border: '1px solid rgb(255 255 255 / .14)', borderRadius: '50%', color: '#fff', display: 'flex', height: 44, justifyContent: 'center', position: 'relative', width: 44 }}>{Icon.bell()}<i style={{ background: '#ff5a6a', border: '2px solid #0b2440', borderRadius: '50%', height: 9, position: 'absolute', right: 12, top: 10, width: 9 }} /></span>
      <span style={{ alignItems: 'center', background: 'rgb(12 32 56 / .38)', border: '1px solid rgb(255 255 255 / .14)', borderRadius: 999, color: '#fff', display: 'flex', gap: 6, padding: '4px 12px 4px 4px' }}><Avatar name="Igor Lumen" size={38} light />{Icon.chevronDown()}</span>
    </div>
  </div>
}

const glassDark: CSSProperties = { backdropFilter: 'blur(22px) saturate(150%)', background: 'linear-gradient(160deg, rgb(58 84 112 / .55), rgb(24 44 70 / .5))', border: '1px solid rgb(255 255 255 / .16)', borderRadius: 26, boxShadow: '0 20px 60px rgb(4 16 32 / .3)', color: '#fff' }
const mCard: CSSProperties = { backdropFilter: 'blur(20px) saturate(150%)', background: 'rgb(250 252 255 / .9)', border: '1px solid rgb(255 255 255 / .7)', borderRadius: 22, boxShadow: '0 14px 34px rgb(4 16 32 / .2)', color: C.ink, padding: '16px 14px 8px' }
const rowBox: CSSProperties = { alignItems: 'center', background: 'rgb(255 255 255 / .75)', borderRadius: 14, display: 'flex', gap: 10, marginBottom: 6, padding: '9px 8px' }

function CardHeader({ title, link }: { title: string; link: string }) {
  return <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px' }}>
    <h2 style={{ color: C.ink, fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
    <span style={{ alignItems: 'center', color: C.text, display: 'inline-flex', fontSize: 13, gap: 2, textDecoration: 'underline', textUnderlineOffset: 3 }}>{link}{Icon.chevronRight()}</span>
  </div>
}

const arrivals = [['14:00', 'Juliana Costa', '203', 'Deluxe'], ['15:30', 'Rafael Mendes', '105', 'Standard'], ['16:00', 'Camila Torres', '301', 'Suíte Vista Mar']]
const departures = [['11:00', 'André Lima', '102', 'Standard'], ['12:00', 'Beatriz Souza', '210', 'Superior'], ['13:00', 'Thiago Nunes', '305', 'Suíte Vista Mar']]
const categories: [string, number, string, string][] = [
  ['Standard', 85, '12/14', 'linear-gradient(135deg, #d8b48c 0%, #a87b55 55%, #6e4a31 100%)'],
  ['Superior', 70, '7/10', 'linear-gradient(135deg, #e0c19b 0%, #b28457 55%, #7c5537 100%)'],
  ['Deluxe', 60, '6/10', 'linear-gradient(135deg, #d5ad80 0%, #9c6c45 55%, #5e3c27 100%)'],
  ['Suíte Vista Mar', 50, '4/8', 'linear-gradient(160deg, #f6b98a 0%, #e48a6b 35%, #4f86b8 75%, #1d4f80 100%)'],
]

function Row({ time, name, room, type, kind, done = false, tapAt }: { time: string; name: string; room: string; type: string; kind: 'in' | 'out'; done?: boolean; tapAt?: number }) {
  const btn: CSSProperties = done ? { background: C.greenSoft, color: C.green } : kind === 'in' ? { background: '#dff1ff', color: '#1a7cc7' } : { background: '#ffe4e8', color: '#d63a55' }
  return <div style={rowBox}>
    <time style={{ color: C.ink, flex: '0 0 42px', fontSize: 13.5, fontWeight: 600 }}>{time}</time>
    <span style={{ alignItems: 'center', display: 'flex', flex: 1, gap: 10, minWidth: 0 }}><Avatar name={name} /><span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}><b style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</b><small style={{ color: C.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Quarto {room} · {type}</small></span></span>
    <span style={{ ...btn, alignItems: 'center', borderRadius: 999, display: 'inline-flex', flexShrink: 0, fontSize: 12.5, fontWeight: 600, gap: 4, height: 32, padding: '0 12px', position: 'relative' }}>{done ? <>{Icon.check(13)}Hospedado</> : kind === 'in' ? 'Check-in' : 'Check-out'}{tapAt !== undefined && <Tap at={tapAt} />}</span>
  </div>
}

/** The overview screen content, laid out at fixed positions so the scroll targets are exact. */
function HomeContent({ f }: { f: number }) {
  const checkedIn = f >= T.tapCheckIn + 2
  const fill = (i: number) => interpolate(f, [370 + i * 8, 420 + i * 8], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const block = (top: number, children: ReactNode, extra: CSSProperties = {}) => <div style={{ left: 16, position: 'absolute', right: 16, top, ...extra }}>{children}</div>
  const modules: [string, string, Parameters<typeof HotelIcon>[0]['name']][] = [['Reservas', 'Gestão e disponibilidade', 'calendar'], ['Hóspedes', 'Check-in e histórico', 'people'], ['Quartos', 'Status e manutenção', 'bed'], ['Financeiro', 'Receitas e despesas', 'chart']]
  return <div style={{ height: 2250, position: 'relative' }}>
    <div style={{ left: 0, position: 'absolute', right: 0, top: 52 }}><HomeTopBar /></div>
    {block(128, <div style={{ color: '#fff' }}>
      <p style={{ fontSize: 19, fontWeight: 500, margin: '0 0 10px', textShadow: '0 1px 12px rgb(0 0 0 / .3)' }}>Bem-vindo de volta, <b style={{ fontWeight: 600 }}>Igor</b>!</p>
      <h1 style={{ color: '#fff', fontSize: 44, fontWeight: 600, letterSpacing: -1.6, lineHeight: 1.02, margin: 0, textShadow: '0 2px 24px rgb(0 0 0 / .35)' }}>Seu hotel,<br /><span style={{ color: C.sky }}>sempre no<br />controle.</span></h1>
      <p style={{ color: '#eaf3fb', fontSize: 15, lineHeight: 1.5, margin: '16px 0 0', textShadow: '0 1px 12px rgb(0 0 0 / .4)' }}>Acompanhe reservas, hóspedes, quartos e toda a operação em tempo real.</p>
      <span style={{ alignItems: 'center', background: 'linear-gradient(180deg, #b3e3ff, #86cdf8)', borderRadius: 999, boxShadow: '0 10px 30px rgb(76 182 242 / .35)', color: C.navy, display: 'inline-flex', fontSize: 15, fontWeight: 600, gap: 12, height: 52, marginTop: 22, padding: '0 28px 0 22px' }}>{Icon.plus()}Nova reserva</span>
    </div>)}
    {block(470, <div style={{ ...glassDark, padding: '18px 16px' }}>
      <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between' }}><h2 style={{ color: '#fff', fontSize: 17, fontWeight: 600, margin: 0 }}>Hoje no hotel</h2><time style={{ fontSize: 13 }}>Ter, 28 de out de 2026</time></div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 14, margin: '12px 0 14px' }}>
        <span style={{ alignItems: 'center', display: 'flex', gap: 10 }}><Sun /><span><b style={{ display: 'block', fontSize: 32, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>28°C</b><small style={{ color: '#e3eef8', fontSize: 13 }}>Ensolarado</small></span></span>
        <span style={{ borderLeft: '1px solid rgb(255 255 255 / .2)', display: 'grid', gap: 8, paddingLeft: 14 }}>
          {[['Nascer do sol', '05:26', false], ['Pôr do sol', '17:48', true]].map(([l, v, setting]) => <span key={l as string} style={{ alignItems: 'center', columnGap: 6, display: 'grid', gridTemplateColumns: '22px 1fr' }}><span style={{ gridRow: '1 / 3', height: 22, width: 22 }}><SunHorizon setting={setting as boolean} /></span><small style={{ color: '#e3eef8', fontSize: 11 }}>{l}</small><b style={{ fontSize: 15, fontWeight: 500 }}>{v}</b></span>)}
        </span>
      </div>
      <div style={{ borderTop: '1px solid rgb(255 255 255 / .18)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', paddingTop: 14 }}>
        {([['people', 'pink', `${count(f, 82)}%`, 'Ocupação'], ['bed', undefined, count(f, 48), 'Hóspedes'], ['calendar', 'green', count(f, 12), 'Check-ins'], ['calendar', 'orange', count(f, 8), 'Check-outs']] as const).map(([icon, tone, value, label], i) => <span key={label} style={{ alignItems: 'center', borderLeft: i ? '1px solid rgb(255 255 255 / .18)' : 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ filter: 'drop-shadow(0 3px 6px rgb(0 0 0 / .2))', height: 32, marginBottom: 4, width: 32 }}><HotelIcon name={icon} tone={tone} /></span><b style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.1 }}>{value}</b><small style={{ color: '#e3eef8', fontSize: 11.5 }}>{label}</small>
        </span>)}
      </div>
    </div>)}
    {block(720, <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>{modules.map(([title, sub, icon]) => <div key={title} style={{ ...glassDark, background: 'linear-gradient(160deg, rgb(70 98 128 / .5), rgb(30 52 80 / .5))', borderRadius: 22, display: 'flex', flexDirection: 'column', gap: 8, height: 150, justifyContent: 'flex-end', padding: '14px 14px 16px', position: 'relative' }}>
      <span style={{ filter: 'drop-shadow(0 8px 12px rgb(4 16 32 / .3))', height: 60, width: 60 }}><HotelIcon name={icon} /></span>
      <span><b style={{ display: 'block', fontSize: 18, fontWeight: 600 }}>{title}</b><small style={{ color: '#e3eef8', display: 'block', fontSize: 12.5, paddingRight: 34 }}>{sub}</small></span>
      <i style={{ alignItems: 'center', background: '#f4f8fc', borderRadius: '50%', bottom: 14, boxShadow: '0 6px 16px rgb(0 0 0 / .18)', color: C.navy, display: 'flex', height: 36, justifyContent: 'center', position: 'absolute', right: 12, width: 36 }}>{Icon.arrowRight(18)}</i>
    </div>)}</div>)}
    {block(1050, <div style={mCard}><CardHeader title="Próximas chegadas" link="Ver todas" />{arrivals.map(([time, name, room, type], i) => <Row key={name} time={time} name={name} room={room} type={type} kind="in" done={i === 0 && checkedIn} tapAt={i === 0 ? T.tapCheckIn : undefined} />)}</div>)}
    {block(1330, <div style={mCard}><CardHeader title="Próximas saídas" link="Ver todas" />{departures.map(([time, name, room, type]) => <Row key={name} time={time} name={name} room={room} type={type} kind="out" />)}</div>)}
    {block(1610, <div style={mCard}><CardHeader title="Ocupação por categoria" link="Ver relatório" />{categories.map(([name, v, frac, bg], i) => <div key={name} style={{ ...rowBox, display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) 40px 34px 16px' }}>
      <span style={{ alignItems: 'center', background: bg, borderRadius: 10, color: 'rgb(255 255 255 / .8)', display: 'flex', height: 44, justifyContent: 'center', width: 56 }}>{Icon.bed(20, 1.4)}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}><b style={{ fontWeight: 500 }}>{name}</b><i style={{ background: '#e6edf5', borderRadius: 3, display: 'block', height: 6, overflow: 'hidden' }}><em style={{ background: 'linear-gradient(90deg, #8fd3ff, #3d8be0)', borderRadius: 3, display: 'block', height: '100%', width: `${v * fill(i)}%` }} /></i></span>
      <strong style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>{Math.round(v * fill(i))}%</strong><small style={{ color: C.muted, fontSize: 12.5 }}>{frac}</small><span style={{ color: C.muted }}>{Icon.chevronRight()}</span>
    </div>)}</div>)}
    {block(1960, <div style={{ alignItems: 'flex-end', background: `linear-gradient(180deg, rgb(8 26 48 / .1) 10%, rgb(8 26 48 / .88)), url(${staticFile('hotel-media/hero.webp')}) 60% 40% / cover`, borderRadius: 22, boxShadow: '0 14px 34px rgb(4 16 32 / .25)', color: '#fff', display: 'flex', gap: 12, height: 150, justifyContent: 'space-between', padding: 18 }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 19, fontWeight: 600 }}>Manutenção</b><small style={{ color: '#e3eef8', fontSize: 13 }}>2 quartos em manutenção hoje</small></span>
      <i style={{ alignItems: 'center', backdropFilter: 'blur(10px)', background: 'rgb(255 255 255 / .2)', border: '1px solid rgb(255 255 255 / .35)', borderRadius: '50%', display: 'flex', flexShrink: 0, height: 44, justifyContent: 'center', width: 44 }}>{Icon.arrowRight()}</i>
    </div>)}
  </div>
}

const reservations: [string, string, string, 'Hospedado' | 'Confirmada', string][] = [
  ['Juliana Costa', '203 · Deluxe', '28 out → 31 out', 'Hospedado', 'R$ 2.370'],
  ['Rafael Mendes', '105 · Standard', '28 out → 30 out', 'Confirmada', 'R$ 980'],
  ['Camila Torres', '301 · Suíte Vista Mar', '28 out → 02 nov', 'Confirmada', 'R$ 5.150'],
  ['Marcos Pereira', '208 · Superior', '29 out → 01 nov', 'Confirmada', 'R$ 1.740'],
  ['Larissa Freire', '110 · Standard', '29 out → 31 out', 'Confirmada', 'R$ 960'],
  ['Eduardo Ramos', '402 · Deluxe', '30 out → 03 nov', 'Confirmada', 'R$ 3.160'],
  ['Helena Duarte', '306 · Suíte Vista Mar', '31 out → 04 nov', 'Confirmada', 'R$ 4.120'],
]

/** Reservations page in data mode, as the app shows it on a phone. */
function ReservasContent({ scroll }: { scroll: number }) {
  return <div style={{ background: C.bg, inset: 0, position: 'absolute' }}>
    <div style={{ alignItems: 'center', background: C.navy, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 2, boxShadow: '0 6px 24px rgb(11 36 64 / .18)', display: 'flex', justifyContent: 'space-between', padding: '50px 16px 12px' }}>
      <div style={{ alignItems: 'center', color: '#fff', display: 'flex', gap: 10 }}><Logo /><span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}><b style={{ fontSize: 24, fontWeight: 600, letterSpacing: -.6 }}>Lumen</b><small style={{ color: '#e3f2fd', fontSize: 11, fontWeight: 500, letterSpacing: 2.6, marginTop: 4 }}>HOTEL</small></span></div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
        <span style={{ alignItems: 'center', background: 'rgb(255 255 255 / .08)', border: '1px solid rgb(255 255 255 / .1)', borderRadius: '50%', color: '#fff', display: 'flex', height: 44, justifyContent: 'center', position: 'relative', width: 44 }}>{Icon.bell()}<i style={{ background: '#ff5a6a', border: '2px solid #0b2440', borderRadius: '50%', height: 9, position: 'absolute', right: 12, top: 10, width: 9 }} /></span>
        <span style={{ alignItems: 'center', background: 'rgb(255 255 255 / .08)', border: '1px solid rgb(255 255 255 / .1)', borderRadius: 999, color: '#fff', display: 'flex', gap: 6, padding: '4px 12px 4px 4px' }}><Avatar name="Igor Lumen" size={38} light />{Icon.chevronDown()}</span>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '128px 16px 120px', transform: `translateY(${-scroll}px)` }}>
      <div><h1 style={{ color: C.ink, fontSize: 26, fontWeight: 600, letterSpacing: -.8, margin: 0 }}>Reservas</h1><p style={{ color: C.muted, margin: '4px 0 0' }}>Chegadas, estadias e disponibilidade.</p></div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>{[['Chegadas hoje', '12', '1 com check-in feito'], ['Hospedados', '48', 'em 40 quartos'], ['Saídas hoje', '8', 'até 13h'], ['Ocupação hoje', '82%', '42 de 42 quartos ativos']].map(([l, v, h]) => <div key={l} style={{ background: '#fff', borderRadius: 18, borderTop: `3px solid ${C.sky}`, boxShadow: '0 1px 2px rgb(15 29 46 / .05), 0 6px 20px rgb(15 29 46 / .06)', display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px' }}><span style={{ color: C.text, fontSize: 13 }}>{l}</span><b style={{ color: C.navy, fontSize: 20, fontWeight: 600, letterSpacing: -.6 }}>{v}</b><small style={{ color: C.muted, fontSize: 12 }}>{h}</small></div>)}</div>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 1px 2px rgb(15 29 46 / .05), 0 6px 20px rgb(15 29 46 / .06)', padding: '8px 14px' }}>
        {reservations.map(([name, room, dates, status, value], i) => <div key={name} style={{ alignItems: 'center', borderBottom: i < reservations.length - 1 ? `1px solid ${C.line}` : 0, display: 'flex', gap: 10, padding: '11px 0' }}>
          <Avatar name={name} size={36} />
          <span style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}><b style={{ color: C.ink, fontWeight: 600 }}>{name}</b><small style={{ color: C.muted, fontSize: 12 }}>Quarto {room} · {dates}</small></span>
          <span style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 4 }}><em style={{ ...(status === 'Hospedado' ? { background: C.greenSoft, color: C.green } : { background: C.blueSoft, color: C.blue }), alignItems: 'center', borderRadius: 999, display: 'inline-flex', fontSize: 11.5, fontStyle: 'normal', fontWeight: 600, height: 22, padding: '0 9px' }}>{status}</em><small style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{value}</small></span>
        </div>)}
      </div>
    </div>
  </div>
}

function BottomNav({ f, active }: { f: number; active: 'Início' | 'Reservas' }) {
  const items: [string, (s?: number, w?: number) => ReactNode, number | undefined][] = [['Início', Icon.house, T.tapInicio], ['Reservas', Icon.calendar, T.tapReservas], ['Quartos', Icon.bed, undefined], ['Mais', Icon.menu, undefined]]
  return <>
    <div style={{ backdropFilter: 'blur(22px) saturate(160%)', background: 'rgb(250 252 255 / .92)', border: '1px solid rgb(255 255 255 / .8)', borderRadius: 24, bottom: 24, boxShadow: '0 12px 34px rgb(4 16 32 / .28)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', left: 12, padding: '8px 6px', position: 'absolute', right: 12, zIndex: 20 }}>
      {items.map(([label, icon, tapAt]) => { const on = label === active; return <span key={label} style={{ alignItems: 'center', color: on ? '#1f6fd1' : '#6a7a8c', display: 'flex', flexDirection: 'column', fontSize: 12, fontWeight: 500, gap: 3, padding: '6px 2px', position: 'relative' }}>{icon(22, on ? 2.4 : 1.8)}<span>{label}</span>{tapAt !== undefined && f >= tapAt - 10 && f <= tapAt + 18 && <Tap at={tapAt} />}</span> })}
    </div>
    <i style={{ background: '#0f1d2e', borderRadius: 3, bottom: 8, height: 5, left: '50%', marginLeft: -67, opacity: .85, position: 'absolute', width: 134, zIndex: 21 }} />
  </>
}

export function LumenHotelMobileReel() {
  const f = useCurrentFrame()
  const onReservas = f >= T.tapReservas + 4 && f < T.tapInicio + 4
  const scroll = f >= T.tapInicio + 4 ? 0 : homeScroll(f)
  const reservasScroll = interpolate(f, [...T.reservasScroll], [0, 180], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // Brief fade between screens, like a page change in the app.
  const swap = Math.max(interpolate(f, [T.tapReservas + 1, T.tapReservas + 4, T.tapReservas + 9], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), interpolate(f, [T.tapInicio + 1, T.tapInicio + 4, T.tapInicio + 9], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const toast = interpolate(f, [T.tapCheckIn + 4, T.tapCheckIn + 12, T.tapCheckIn + 70, T.tapCheckIn + 80], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ background: '#0a1f36', ...font }}>
    <div style={{ height: H, left: 0, overflow: 'hidden', position: 'absolute', top: 0, transform: `scale(${SCALE})`, transformOrigin: '0 0', width: W, fontSize: 13.5, lineHeight: 1.45, color: C.ink }}>
      {onReservas ? <ReservasContent scroll={reservasScroll} /> : <>
        <div style={{ background: `linear-gradient(90deg, rgb(8 26 48 / .78) 0%, rgb(8 26 48 / .45) 38%, rgb(8 26 48 / .12) 62%, rgb(8 26 48 / .25) 100%), linear-gradient(180deg, rgb(8 26 48 / .35) 0%, transparent 22%, transparent 55%, rgb(8 26 48 / .55) 100%), url(${staticFile('hotel-media/hero.webp')}) 62% 55% / cover no-repeat`, inset: 0, position: 'absolute' }} />
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)` }}><HomeContent f={f} /></div>
      </>}
      <StatusBar backdrop={onReservas ? 0 : interpolate(scroll, [0, 40], [0, 1], { extrapolateRight: 'clamp' })} />
      {toast > 0 && <div style={{ alignItems: 'center', background: C.navy, borderRadius: 999, bottom: 106, boxShadow: '0 12px 32px rgb(8 26 48 / .35)', color: '#fff', display: 'flex', fontWeight: 500, gap: 8, left: '50%', opacity: toast, padding: '11px 16px', position: 'absolute', transform: `translate(-50%, ${(1 - toast) * 10}px)`, whiteSpace: 'nowrap', zIndex: 25 }}><span style={{ color: '#6ee7a8', display: 'flex' }}>{Icon.check()}</span>Check-in de Juliana Costa no quarto 203.</div>}
      <BottomNav f={f} active={onReservas ? 'Reservas' : 'Início'} />
      {swap > 0 && <div style={{ background: '#fff', inset: 0, opacity: swap * .25, position: 'absolute', zIndex: 15 }} />}
    </div>
  </AbsoluteFill>
}
