import { CheckCheck, FileText } from 'lucide-react'
import { Easing, Img, spring, staticFile } from 'remotion'

import { alpha, GRAY, INK, INK_MUTED, OttoIcon, p, Scene, TERRA, useFrame, WHITE } from './OttoContadoresReel'

/**
 * Illustrated hooks for the dark reels: the narration says the hook line, the scene *shows* the situation
 * (no typed headline). Each one uses a different illustration style so they can be compared.
 */

const draw = (frame: number, from: number, to: number) => 1 - p(frame, from, to, [0, 1], Easing.inOut(Easing.cubic))

function OttoBadge({ size }: { size: number }) {
  return (
    <span style={{ alignItems: 'center', background: TERRA, borderRadius: size * 0.26, display: 'flex', flex: 'none', height: size, justifyContent: 'center', width: size }}>
      <OttoIcon size={size * 0.62} />
    </span>
  )
}

// ─── Style 1 · Flat illustration — "cuida do financeiro. Sozinho." ────────────
// A phone on a desk at night lights up by itself and the notifications keep coming. Nobody is touching it.

const NIGHT_NOTES = [
  { sub: 'Aurora Tecnologia · R$ 4.000', title: 'Nota fiscal emitida' },
  { sub: '42 lançamentos conferidos', title: 'Banco conciliado' },
  { sub: 'Lume Comércio · R$ 2.480', title: 'Pix recebido' },
  { sub: '18 despesas novas', title: 'Despesas classificadas' },
]

export function NightDeskHook({ duration }: { duration: number }) {
  const frame = useFrame()
  const lit = p(frame, 10, 20)

  return (
    <Scene duration={duration}>
      {/* window + moon */}
      <div style={{ background: 'linear-gradient(#11152a, #1e2440)', border: `4px solid ${alpha(GRAY, 0x66)}`, borderRadius: 26, height: 380, left: 660, overflow: 'hidden', position: 'absolute', top: 230, width: 320 }}>
        <div style={{ background: '#ece6d3', borderRadius: 99, boxShadow: '0 0 60px rgba(236,230,211,0.45)', height: 92, left: 170, position: 'absolute', top: 64, width: 92 }} />
        {[[40, 60], [110, 150], [60, 250], [230, 230], [150, 40], [260, 320]].map(([x, y], i) => (
          <span key={i} style={{ background: '#fff', borderRadius: 99, height: 5, left: x, opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame + i * 9) / 12)), position: 'absolute', top: y, width: 5 }} />
        ))}
        <div style={{ background: alpha(GRAY, 0x66), height: '100%', left: '50%', position: 'absolute', top: 0, width: 4 }} />
        <div style={{ background: alpha(GRAY, 0x66), height: 4, left: 0, position: 'absolute', top: '50%', width: '100%' }} />
      </div>

      {/* desk */}
      <div style={{ background: '#241c17', borderTop: '8px solid #33281f', bottom: 0, left: 0, position: 'absolute', right: 0, top: 1300 }} />
      <div style={{ background: `radial-gradient(ellipse at center, rgba(228,136,107,${0.32 * lit}), transparent 70%)`, height: 360, left: 190, position: 'absolute', top: 1170, width: 700 }} />

      {/* mug with steam */}
      <div style={{ left: 120, position: 'absolute', top: 1080 }}>
        <svg height={150} style={{ left: 20, position: 'absolute', top: -150 }} viewBox="0 0 120 150" width={120}>
          {[0, 1, 2].map((k) => (
            <path d={`M${30 + k * 30} 140 C ${15 + k * 30} 110, ${45 + k * 30} 80, ${30 + k * 30} 50 S ${45 + k * 30} 10, ${30 + k * 30} 0`} fill="none" key={k} opacity={0.25 + 0.25 * Math.sin((frame + k * 10) / 10)} stroke="#d9cfc0" strokeLinecap="round" strokeWidth={5} transform={`translate(0 ${-((frame * 0.6 + k * 20) % 30)})`} />
          ))}
        </svg>
        <div style={{ background: TERRA, borderRadius: '10px 10px 34px 34px', height: 190, position: 'relative', width: 160 }}>
          <div style={{ border: `16px solid ${TERRA}`, borderRadius: 99, height: 90, position: 'absolute', right: -62, top: 40, width: 90 }} />
          <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 8, height: 18, left: 0, position: 'absolute', right: 0, top: 0 }} />
        </div>
      </div>

      {/* the phone */}
      <div style={{ background: '#050505', border: '3px solid #2c2c2a', borderRadius: 60, boxShadow: '0 50px 90px rgba(0,0,0,0.6)', height: 800, left: 360, padding: 12, position: 'absolute', top: 520, transform: 'rotate(-4deg)', width: 400 }}>
        <div style={{ background: '#0a0a0a', borderRadius: 48, height: '100%', overflow: 'hidden', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(160deg, #1b1d33, #2b1f1c 70%)', inset: 0, opacity: lit, position: 'absolute' }} />
          <div style={{ background: '#000', borderRadius: 99, height: 30, left: '50%', position: 'absolute', top: 16, transform: 'translateX(-50%)', width: 110 }} />
          <div style={{ color: '#fff', left: 0, opacity: lit, position: 'absolute', right: 0, textAlign: 'center', top: 74 }}>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 600, opacity: 0.75 }}>terça-feira, 21 de outubro</span>
            <span style={{ display: 'block', fontSize: 104, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05 }}>02:14</span>
          </div>
          {NIGHT_NOTES.map((note, i) => {
            const at = 24 + i * 14
            const s = spring({ config: { damping: 16, stiffness: 170 }, fps: 30, frame: frame - at })
            if (frame < at) return null
            return (
              <div key={note.title} style={{ alignItems: 'center', backdropFilter: 'blur(14px)', background: 'rgba(255,255,255,0.14)', borderRadius: 24, display: 'flex', gap: 12, left: 14, opacity: s, padding: '14px 16px', position: 'absolute', right: 14, top: 270 + i * 106, transform: `translateY(${(1 - s) * -40}px) scale(${0.94 + s * 0.06})` }}>
                <OttoBadge size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontSize: 19, fontWeight: 650 }}>{note.title}</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>agora</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.72)', display: 'block', fontSize: 16, marginTop: 2 }}>{note.sub}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Scene>
  )
}

// ─── Style 2 · Glass / 3D depth — "te dizer quanto sua empresa lucrou" ─────────
// A phone tilted in 3D answers "quanto eu lucrei?" while glass cards with the numbers float around it.

const AREA = 'M0 150 C 40 140, 70 120, 110 125 S 170 90, 210 80 S 270 40, 330 20 L 330 170 L 0 170 Z'
const LINE = 'M0 150 C 40 140, 70 120, 110 125 S 170 90, 210 80 S 270 40, 330 20'

export function GlassLucroHook({ duration }: { duration: number }) {
  const frame = useFrame()
  const tilt = p(frame, 0, duration, [-24, -10], Easing.inOut(Easing.quad))
  const ask = spring({ config: { damping: 15, stiffness: 160 }, fps: 30, frame: frame - 8 })
  const answer = spring({ config: { damping: 15, stiffness: 150 }, fps: 30, frame: frame - 24 })
  const value = 35250 * p(frame, 30, 62, [0, 1], Easing.out(Easing.quad))
  const chips = [
    { at: 44, label: 'Faturamento', value: 'R$ 96.480', x: 60, y: 560, z: 120 },
    { at: 54, label: 'Despesas', value: 'R$ 61.230', x: 690, y: 860, z: 160 },
    { at: 64, label: 'Margem', value: '36,5%', x: 90, y: 1240, z: 90 },
  ]

  return (
    <Scene duration={duration}>
      {[
        { c: 'rgba(228,136,107,0.55)', x: 120, y: 420 },
        { c: 'rgba(123,79,214,0.45)', x: 680, y: 1180 },
        { c: 'rgba(20,148,107,0.35)', x: 760, y: 380 },
      ].map((orb, i) => (
        <div key={i} style={{ background: `radial-gradient(circle, ${orb.c}, transparent 65%)`, filter: 'blur(40px)', height: 620, left: orb.x - 310 + Math.sin(frame / 25 + i * 2) * 40, position: 'absolute', top: orb.y - 310 + Math.cos(frame / 30 + i) * 40, width: 620 }} />
      ))}

      <div style={{ inset: 0, perspective: 1800, position: 'absolute' }}>
        <div style={{ background: '#0b0b0b', border: '3px solid #34342f', borderRadius: 66, boxShadow: '40px 60px 120px rgba(0,0,0,0.65)', height: 980, left: 300, padding: 14, position: 'absolute', top: 430, transform: `rotateY(${tilt}deg) rotateX(7deg)`, width: 480 }}>
          <div style={{ background: '#141413', borderRadius: 54, height: '100%', overflow: 'hidden', padding: '90px 26px 0', position: 'relative' }}>
            <span style={{ color: '#a6a59e', display: 'block', fontSize: 22, fontWeight: 600, textAlign: 'center' }}>ChatGPT</span>
            <div style={{ background: '#2a2a28', borderRadius: 26, color: '#f2f1ec', fontSize: 25, marginLeft: 'auto', marginTop: 40, opacity: ask, padding: '16px 20px', transform: `translateY(${(1 - ask) * 20}px)`, width: 'fit-content' }}>Quanto eu lucrei esse mês?</div>
            <div style={{ background: '#1d1d1b', border: '1px solid #33332f', borderRadius: 30, marginTop: 30, opacity: answer, padding: '22px 22px 18px', transform: `translateY(${(1 - answer) * 30}px)` }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
                <OttoBadge size={40} />
                <span style={{ color: '#a6a59e', fontSize: 20, fontWeight: 600 }}>Lucro de outubro</span>
              </div>
              <span style={{ color: '#f2f1ec', display: 'block', fontSize: 60, fontVariantNumeric: 'tabular-nums', fontWeight: 750, letterSpacing: '-0.02em', marginTop: 12 }}>
                {value.toLocaleString('pt-BR', { currency: 'BRL', maximumFractionDigits: 0, style: 'currency' })}
              </span>
              <svg height={170} style={{ display: 'block', marginTop: 10, width: '100%' }} viewBox="0 0 330 170">
                <defs>
                  <linearGradient id="lucroArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#e4886b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e4886b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={AREA} fill="url(#lucroArea)" opacity={p(frame, 50, 66)} />
                <path d={LINE} fill="none" pathLength={1} stroke="#e4886b" strokeDasharray={1} strokeDashoffset={draw(frame, 36, 64)} strokeLinecap="round" strokeWidth={5} />
              </svg>
              <span style={{ background: 'rgba(20,148,107,0.18)', borderRadius: 99, color: '#3ccf97', display: 'inline-block', fontSize: 19, fontWeight: 700, marginTop: 8, opacity: p(frame, 64, 72), padding: '6px 14px' }}>+18% vs setembro</span>
            </div>
            <div style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.10), transparent 38%)', inset: 0, pointerEvents: 'none', position: 'absolute' }} />
          </div>
        </div>

        {chips.map((chip, i) => {
          const s = spring({ config: { damping: 13, stiffness: 150 }, fps: 30, frame: frame - chip.at })
          if (frame < chip.at) return null
          return (
            <div key={chip.label} style={{ backdropFilter: 'blur(18px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 30, boxShadow: '0 30px 60px rgba(0,0,0,0.35)', left: chip.x, opacity: s, padding: '22px 28px', position: 'absolute', top: chip.y + Math.sin((frame + i * 20) / 14) * 10, transform: `translateZ(${chip.z}px) rotateY(${tilt * 0.6}deg) scale(${0.8 + s * 0.2})` }}>
              <span style={{ color: '#a6a59e', display: 'block', fontSize: 22, fontWeight: 600 }}>{chip.label}</span>
              <span style={{ color: '#f2f1ec', display: 'block', fontSize: 40, fontWeight: 750, marginTop: 4 }}>{chip.value}</span>
            </div>
          )
        })}
      </div>
    </Scene>
  )
}

// ─── Style 3 · Line-art / blueprint — "ser o sistema de gestão da sua empresa" ─
// Everything is drawn stroke by stroke: an old ERP on a laptop, the lid closes, the system "moves" into the phone.

export function BlueprintSistemaHook({ duration }: { duration: number }) {
  const frame = useFrame()
  const lid = 1 - p(frame, 42, 58, [0, 1], Easing.in(Easing.cubic)) * 0.97
  const phoneOn = p(frame, 62, 74)
  const stroke = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  return (
    <Scene duration={duration}>
      <svg height={1920} style={{ left: 0, position: 'absolute', top: 0 }} viewBox="0 0 1080 1920" width={1080}>
        {/* laptop */}
        <g transform={`translate(0 1100) scale(1 ${lid}) translate(0 -1100)`}>
          <rect height={340} pathLength={1} rx={18} stroke={INK} strokeDasharray={1} strokeDashoffset={draw(frame, 0, 16)} strokeWidth={5} width={520} x={80} y={760} {...stroke} />
          {/* legacy ERP inside the screen */}
          <rect height={290} pathLength={1} rx={6} stroke={GRAY} strokeDasharray={1} strokeDashoffset={draw(frame, 8, 20)} strokeWidth={3} width={110} x={104} y={786} {...stroke} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={`m${i}`} pathLength={1} stroke={GRAY} strokeDasharray={1} strokeDashoffset={draw(frame, 12 + i * 2, 20 + i * 2)} strokeWidth={3} x1={120} x2={190 - (i % 3) * 18} y1={812 + i * 42} y2={812 + i * 42} {...stroke} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <rect height={30} key={`t${i}`} pathLength={1} rx={6} stroke={GRAY} strokeDasharray={1} strokeDashoffset={draw(frame, 14 + i * 2, 22 + i * 2)} strokeWidth={3} width={78} x={232 + i * 88} y={786} {...stroke} />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={`r${i}`} pathLength={1} stroke={alpha(GRAY, 0xaa)} strokeDasharray={1} strokeDashoffset={draw(frame, 18 + i * 2, 28 + i * 2)} strokeWidth={3} x1={232} x2={576} y1={850 + i * 38} y2={850 + i * 38} {...stroke} />
          ))}
        </g>
        <path d="M40 1100 L640 1100 L600 1140 L80 1140 Z" pathLength={1} stroke={INK} strokeDasharray={1} strokeDashoffset={draw(frame, 4, 18)} strokeWidth={5} {...stroke} />

        {/* the hand-off arrow */}
        <path d="M340 730 C 470 560, 690 560, 830 680" pathLength={1} stroke={TERRA} strokeDasharray={1} strokeDashoffset={draw(frame, 48, 64)} strokeWidth={6} {...stroke} />
        <path d="M800 650 L 834 684 L 790 700" opacity={p(frame, 62, 66)} stroke={TERRA} strokeWidth={6} {...stroke} />

        {/* phone */}
        <rect height={540} pathLength={1} rx={40} stroke={INK} strokeDasharray={1} strokeDashoffset={draw(frame, 40, 60)} strokeWidth={5} width={270} x={715} y={700} {...stroke} />
        <rect fill={TERRA} height={510} opacity={phoneOn * 0.9} rx={30} width={240} x={730} y={715} />
        <line opacity={p(frame, 54, 60)} stroke={INK} strokeLinecap="round" strokeWidth={6} x1={820} x2={880} y1={724} y2={724} />
        {/* chat bubbles drawn on the lit screen */}
        <rect height={46} opacity={phoneOn} pathLength={1} rx={20} stroke={WHITE} strokeDasharray={1} strokeDashoffset={draw(frame, 70, 82)} strokeWidth={4} width={150} x={800} y={1020} {...stroke} />
        <rect height={46} opacity={phoneOn} pathLength={1} rx={20} stroke={WHITE} strokeDasharray={1} strokeDashoffset={draw(frame, 76, 88)} strokeWidth={4} width={170} x={750} y={1086} {...stroke} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', left: 715, opacity: phoneOn, position: 'absolute', top: 860, width: 270 }}>
        <Img src={staticFile('gptLogo.svg')} style={{ filter: 'brightness(0) invert(1)', height: 44 }} />
      </div>
    </Scene>
  )
}

// ─── Style 4 · Cinematic macro — "tudo o que o seu sistema faz. Só que conversando." ─
// A close-up of a conversation with Otto, slow push-in, shallow depth of field and a warm light leak.

const CINE_MSGS: { attach?: string; at: number; out: boolean; text: string }[] = [
  { at: 4, out: true, text: 'Emite as notas de hoje' },
  { at: 16, attach: 'NFS-e · 8 PDFs', out: false, text: 'Feito. 8 notas emitidas e enviadas' },
  { at: 30, out: true, text: 'Cobra quem tá atrasado' },
  { at: 42, out: false, text: 'Cobranças enviadas no WhatsApp · 6 clientes' },
  { at: 56, out: true, text: 'Quanto sobrou no caixa?' },
  { at: 68, out: false, text: 'R$ 48.920 em caixa hoje' },
]
const CINE_ROW = 150

export function CinematicChatHook({ duration }: { duration: number }) {
  const frame = useFrame()
  const shown = CINE_MSGS.filter((m) => frame >= m.at).length
  // keep the newest messages in frame: scroll one row per message after the third, easing into place
  const scroll = Math.max(0, shown - 3) * CINE_ROW
  const scrollSmooth = scroll - (shown > 3 ? (1 - p(frame, CINE_MSGS[shown - 1].at, CINE_MSGS[shown - 1].at + 10)) * CINE_ROW : 0)
  const zoom = p(frame, 0, duration, [1, 1.12], Easing.linear)

  return (
    <Scene duration={duration}>
      <div style={{ left: 120, position: 'absolute', right: 120, top: 560, transform: `translateY(${-scrollSmooth}px) scale(${zoom}) rotate(-3deg)`, transformOrigin: '50% 40%' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 16, marginBottom: 40 }}>
          <OttoBadge size={70} />
          <div>
            <span style={{ color: INK, display: 'block', fontSize: 34, fontWeight: 700 }}>Otto</span>
            <span style={{ alignItems: 'center', color: INK_MUTED, display: 'flex', fontSize: 22, gap: 8 }}>
              <span style={{ background: '#3ccf97', borderRadius: 99, height: 12, width: 12 }} /> online
            </span>
          </div>
        </div>
        {CINE_MSGS.map((m) => {
          const s = spring({ config: { damping: 15, stiffness: 170 }, fps: 30, frame: frame - m.at })
          if (frame < m.at) return null
          return (
            <div key={m.text} style={{ display: 'flex', justifyContent: m.out ? 'flex-end' : 'flex-start', marginBottom: 26, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ background: m.out ? TERRA : WHITE, border: m.out ? 'none' : `1px solid ${alpha(GRAY, 0x66)}`, borderRadius: m.out ? '30px 30px 8px 30px' : '30px 30px 30px 8px', color: m.out ? '#fff' : INK, fontSize: 32, fontWeight: 550, lineHeight: 1.25, maxWidth: '82%', padding: '20px 26px' }}>
                {m.text}
                {!m.out ? <CheckCheck color="#53bdeb" size={26} strokeWidth={2.6} style={{ marginLeft: 10, verticalAlign: 'middle' }} /> : null}
                {m.attach ? (
                  <div style={{ alignItems: 'center', background: alpha(GRAY, 0x33), borderRadius: 16, display: 'flex', fontSize: 24, gap: 10, marginTop: 12, padding: '10px 14px' }}>
                    <FileText size={26} /> {m.attach}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      {/* depth of field: soft blur at the top and bottom of the frame */}
      <div style={{ backdropFilter: 'blur(8px)', left: 0, maskImage: 'linear-gradient(#000 40%, transparent)', WebkitMaskImage: 'linear-gradient(#000 40%, transparent)', position: 'absolute', right: 0, top: 0, height: 560 }} />
      <div style={{ backdropFilter: 'blur(8px)', bottom: 0, height: 520, left: 0, maskImage: 'linear-gradient(transparent, #000 60%)', WebkitMaskImage: 'linear-gradient(transparent, #000 60%)', position: 'absolute', right: 0 }} />
      {/* warm light leak + vignette */}
      <div style={{ background: 'radial-gradient(circle at 85% 12%, rgba(228,136,107,0.35), transparent 45%)', inset: 0, opacity: 0.7 + 0.3 * Math.sin(frame / 18), pointerEvents: 'none', position: 'absolute' }} />
      <div style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))', inset: 0, pointerEvents: 'none', position: 'absolute' }} />
    </Scene>
  )
}
