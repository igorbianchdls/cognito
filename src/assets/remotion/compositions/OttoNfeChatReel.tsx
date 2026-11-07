import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion'

// Reel "Emita notas fiscais conversando com a IA" (1080×1920, ~60 s). The bottom part is the original video of the
// presenter, untouched (picture, captions and audio). Only the top band (1080×606) is new: a dark background with a
// faint grid and glowing flow lines, and one scene per sentence she says — a short headline plus one big card that
// acts out what is being said. Scene times come from the captions burned into the video. All data is made up.

export const OTTO_NFE_CHAT_REEL_DURATION = 1796
const FPS = 30
const BAND_H = 606

const C = {
  bg: '#060a15', card: '#0e1527', cardHi: '#131c33', line: 'rgb(255 255 255 / .09)', text: '#f2f5ff', muted: '#8d97b5',
  blue: '#4f7cff', blueSoft: '#9db5ff', green: '#34d399', amber: '#fbbf24', red: '#f87171',
}
const SANS = '"SF Pro Otto", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'
const sfWeights: Array<[string, number]> = [['Regular', 400], ['Medium', 500], ['Semibold', 600], ['Bold', 700]]
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = Easing.bezier(0.22, 1, 0.36, 1)
const prog = (f: number, start: number, len: number) => interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: ease })
const s = (seconds: number) => Math.round(seconds * FPS)
const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const card = (extra?: CSSProperties): CSSProperties => ({ background: C.card, borderRadius: 22, boxShadow: `0 0 0 1px ${C.line}, 0 24px 60px rgb(0 0 0 / .45)`, color: C.text, ...extra })
const check = (size = 26, on = 1) => (
  <span style={{ width: size, height: size, borderRadius: '50%', background: C.green, color: '#04281a', display: 'grid', placeItems: 'center', fontSize: size * 0.58, fontWeight: 900, transform: `scale(${on})`, flexShrink: 0 }}>✓</span>
)

// ---------- background: grid + flow lines ----------

function Backdrop({ f }: { f: number }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 90% at 50% 0%, #142252, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: '54px 54px', opacity: 0.45, maskImage: 'radial-gradient(ellipse 80% 90% at 50% 40%, black, transparent)' }} />
      <svg width={1080} height={BAND_H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="flow" x1="0" x2="1"><stop offset="0" stopColor={C.blue} stopOpacity={0} /><stop offset="0.5" stopColor={C.blueSoft} stopOpacity={0.9} /><stop offset="1" stopColor={C.blue} stopOpacity={0} /></linearGradient>
        </defs>
        {Array.from({ length: 7 }, (_, i) => {
          const y0 = 80 + i * 74, amp = 60 + i * 10, ph = f / 120 + i * 0.9
          const d = `M -40 ${y0 + Math.sin(ph) * 20} C 300 ${y0 - amp + Math.cos(ph) * 30}, 700 ${y0 + amp + Math.sin(ph * 1.3) * 30}, 1120 ${y0 + Math.cos(ph) * 20}`
          return <g key={i}>
            <path d={d} fill="none" stroke={C.blue} strokeOpacity={0.14} strokeWidth={1.2} />
            <path d={d} fill="none" stroke="url(#flow)" strokeWidth={1.6} pathLength={1} strokeDasharray="0.18 0.82" strokeDashoffset={-((f / (240 + i * 30) + i * 0.17) % 1)} />
          </g>
        })}
      </svg>
      {/* Seam with the video below. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)`, boxShadow: `0 0 18px ${C.blue}` }} />
    </AbsoluteFill>
  )
}

// ---------- shared pieces ----------

/** Headline that comes in word by word. `accent` words are painted blue. */
function Headline({ f, text, accent = [], sub, top = 44 }: { f: number; text: string; accent?: string[]; sub?: string; top?: number }) {
  const words = text.split(' ')
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, textAlign: 'center' }}>
      <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: -1.6, lineHeight: 1.05, color: C.text }}>
        {words.map((w, i) => {
          const p = prog(f, 2 + i * 3, 10)
          return <span key={i} style={{ display: 'inline-block', marginRight: 14, opacity: p, transform: `translateY(${(1 - p) * 18}px)`, color: accent.includes(w) ? C.blueSoft : undefined }}>{w}</span>
        })}
      </div>
      {sub ? <div style={{ marginTop: 10, fontSize: 26, color: C.muted, opacity: prog(f, 10, 12) }}>{sub}</div> : null}
    </div>
  )
}

/** Each scene fades/slides in and out on its own clock. */
function Scene({ f, dur, children }: { f: number; dur: number; children: ReactNode }) {
  const inP = prog(f, 0, 9), out = interpolate(f, [dur - 7, dur], [1, 0], clamp)
  return <AbsoluteFill style={{ opacity: Math.min(inP, out), transform: `translateY(${(1 - inP) * 16}px)` }}>{children}</AbsoluteFill>
}

const center = (top: number, width: number): CSSProperties => ({ position: 'absolute', top, left: (1080 - width) / 2, width })

function OttoMark({ size = 64 }: { size?: number }) {
  return <Img src={staticFile('logoOttoIcon.svg')} style={{ width: size, height: size, filter: 'invert(1)' }} />
}

// ---------- scenes ----------

// 0–4.8 "Agora você pode emitir notas fiscais diretamente pelo chat"
function SceneIntro({ f }: { f: number }) {
  const lift = prog(f, 12, 18)
  return <>
    <Headline f={f} text="Emita notas fiscais" accent={['notas', 'fiscais']} sub="conversando com a IA" />
    <div style={{ ...center(190, 700), ...card({ padding: '30px 36px', transform: `translateY(${(1 - lift) * 60}px) rotate(${(1 - lift) * -3}deg)`, opacity: lift }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: 16, color: C.muted, letterSpacing: 2 }}>NOTA FISCAL DE SERVIÇO</div><div style={{ fontSize: 42, fontWeight: 800, marginTop: 4 }}>NFS-e nº 02841</div></div>
        <span style={{ padding: '8px 14px', borderRadius: 999, background: 'rgb(52 211 153 / .14)', color: C.green, fontSize: 18, fontWeight: 700 }}>Autorizada</span>
      </div>
      {[0.8, 0.62, 0.7].map((w, i) => <div key={i} style={{ marginTop: i ? 12 : 22, height: 14, width: `${w * 100 * prog(f, 26 + i * 5, 14)}%`, borderRadius: 7, background: 'rgb(255 255 255 / .1)' }} />)}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 30 }}><span style={{ color: C.muted }}>Valor líquido</span><b>{brl(12400 * prog(f, 40, 50))}</b></div>
    </div>
  </>
}

// 4.8–9.2 "sem nenhuma complicação, sem precisar entrar no site da prefeitura"
function SceneNoPortal({ f }: { f: number }) {
  const cross = prog(f, 40, 10), chat = prog(f, 60, 14)
  return <>
    <Headline f={f} text="Sem site da prefeitura" accent={['prefeitura']} sub="sem senha, sem formulário, sem complicação" />
    <div style={{ position: 'absolute', top: 220, left: 70, width: 440, ...card({ padding: 0, overflow: 'hidden', filter: `grayscale(${cross})`, opacity: 1 - cross * 0.5 }) }}>
      <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#0a1020' }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map((c) => <i key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ marginLeft: 10, fontSize: 15, color: C.muted }}>nfse.prefeitura.gov.br</span>
      </div>
      <div style={{ padding: 22, display: 'grid', gap: 12 }}>
        {['Inscrição municipal', 'Código do serviço', 'Alíquota', 'Tomador'].map((l) => <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 17, color: C.muted }}>{l}</span><i style={{ width: 170, height: 26, borderRadius: 6, background: 'rgb(255 255 255 / .07)' }} /></div>)}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: cross }}>
        <span style={{ fontSize: 150, fontWeight: 300, color: C.red, transform: `scale(${0.6 + cross * 0.4})`, lineHeight: 1 }}>✕</span>
      </div>
    </div>
    <div style={{ position: 'absolute', top: 290, left: 560, width: 450, opacity: chat, transform: `translateX(${(1 - chat) * 40}px)` }}>
      <div style={{ ...card({ padding: '20px 24px', borderRadius: '22px 22px 6px 22px', background: C.blue, boxShadow: `0 20px 50px rgb(79 124 255 / .35)` }), fontSize: 26, fontWeight: 600 }}>Emite a nota da Aurora pra mim?</div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, color: C.green, opacity: prog(f, 84, 10) }}>{check(28)}Pronto, é só isso.</div>
    </div>
  </>
}

// 9.2–11.0 "Basta pedir para emitir a nota."
function SceneAsk({ f }: { f: number }) {
  const text = 'Emite uma nota de R$ 12.400 para a Aurora Tech'
  const typed = text.slice(0, Math.floor(interpolate(f, [6, 44], [0, text.length], clamp)))
  const send = prog(f, 46, 6)
  return <>
    <Headline f={f} text="Basta pedir" accent={['pedir']} />
    <div style={{ ...center(230, 940), ...card({ height: 124, borderRadius: 62, display: 'flex', alignItems: 'center', padding: '0 20px 0 40px', gap: 20, background: C.cardHi }) }}>
      <span style={{ flex: 1, fontSize: 34, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>{typed}<span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: C.blueSoft }}>|</span></span>
      <span style={{ width: 84, height: 84, borderRadius: '50%', background: C.blue, display: 'grid', placeItems: 'center', fontSize: 38, fontWeight: 800, transform: `scale(${1 + Math.sin(send * Math.PI) * 0.18})`, boxShadow: `0 0 ${send * 40}px ${C.blue}` }}>↑</span>
    </div>
    <div style={{ ...center(400, 940), textAlign: 'center', fontSize: 24, color: C.muted, opacity: prog(f, 20, 12) }}>Em português, do jeito que você fala.</div>
  </>
}

// 11.0–15.8 "A IA identifica o cliente, entende o serviço prestado e preenche os dados automaticamente."
function SceneFill({ f }: { f: number }) {
  const rows = [
    { label: 'Cliente', value: 'Aurora Tecnologia Ltda', at: 8 },
    { label: 'CNPJ', value: '12.345.678/0001-90', at: 26 },
    { label: 'Serviço', value: 'Consultoria em tecnologia', at: 54 },
    { label: 'Município · ISS', value: 'São Paulo – SP · 5%', at: 90 },
  ]
  return <>
    <Headline f={f} text="A IA preenche tudo" accent={['IA']} top={36} />
    <div style={{ ...center(150, 820), ...card({ padding: '14px 30px' }) }}>
      {rows.map((r, i) => {
        const p = prog(f, r.at, 10), done = prog(f, r.at + 10, 8)
        return <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 92, borderTop: i ? `1px solid ${C.line}` : 'none' }}>
          <span style={{ width: 210, fontSize: 21, color: C.muted }}>{r.label}</span>
          <span style={{ flex: 1, position: 'relative', height: 44, display: 'flex', alignItems: 'center' }}>
            <i style={{ position: 'absolute', inset: 0, borderRadius: 10, opacity: 1 - p, background: 'linear-gradient(90deg, rgb(255 255 255 / .05), rgb(255 255 255 / .12), rgb(255 255 255 / .05))', backgroundSize: '200% 100%', backgroundPosition: `${(f * 4) % 200}% 0` }} />
            <span style={{ fontSize: 30, fontWeight: 650, opacity: p, transform: `translateX(${(1 - p) * 14}px)` }}>{r.value}</span>
          </span>
          {check(30, done)}
        </div>
      })}
    </div>
  </>
}

// 15.8–17.6 "Você só precisa confirmar o valor."
function SceneConfirm({ f }: { f: number }) {
  const press = interpolate(f, [30, 34, 40], [0, 1, 0], clamp), cursor = prog(f, 10, 20)
  return <>
    <Headline f={f} text="Você só confirma" accent={['confirma']} />
    <div style={{ ...center(170, 640), ...card({ padding: '30px 36px', textAlign: 'center' }) }}>
      <div style={{ fontSize: 22, color: C.muted }}>Valor da nota</div>
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, margin: '6px 0 22px', fontVariantNumeric: 'tabular-nums' }}>{brl(12400)}</div>
      <div style={{ height: 86, borderRadius: 18, background: f > 34 ? C.green : C.blue, display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 800, color: f > 34 ? '#04281a' : '#fff', transform: `scale(${1 - press * 0.05})` }}>{f > 34 ? '✓ Confirmado' : 'Confirmar e emitir'}</div>
    </div>
    <svg width={44} height={50} viewBox="0 0 22 24" style={{ position: 'absolute', left: interpolate(cursor, [0, 1], [900, 600]), top: interpolate(cursor, [0, 1], [560, 470]), filter: 'drop-shadow(0 4px 8px rgb(0 0 0 / .5))', transform: `scale(${1 - press * 0.15})` }}>
      <path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill="#fff" stroke="#111" strokeWidth={1.2} />
    </svg>
  </>
}

// 17.6–22.2 "Depois, ele emite a nota, envia para o cliente e atualiza o financeiro da sua empresa."
function SceneIssue({ f }: { f: number }) {
  const stamp = prog(f, 8, 8), fly = prog(f, s(1.6), 22), money = prog(f, s(3.0), 16)
  const head = f < s(1.6) ? 'Nota emitida' : f < s(3.0) ? 'Enviada ao cliente' : 'Financeiro atualizado'
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', fontSize: 58, fontWeight: 800, letterSpacing: -1.6, color: C.text }} key={head}>{head}</div>
    <div style={{ position: 'absolute', top: 170, left: 70, width: 510, ...card({ padding: '26px 28px' }) }}>
      <div style={{ fontSize: 16, color: C.muted, letterSpacing: 2 }}>NFS-E Nº 02841</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>Aurora Tecnologia</div>
      <div style={{ marginTop: 16, fontSize: 40, fontWeight: 800 }}>{brl(12400)}</div>
      <div style={{ position: 'absolute', right: 22, bottom: 26, padding: '8px 16px', border: `3px solid ${C.green}`, borderRadius: 10, color: C.green, fontSize: 24, fontWeight: 900, letterSpacing: 2, transform: `rotate(-8deg) scale(${2 - stamp})`, opacity: stamp }}>EMITIDA</div>
    </div>
    <div style={{ position: 'absolute', top: interpolate(fly, [0, 1], [250, 210]), left: interpolate(fly, [0, 1], [460, 610]), opacity: fly, transform: `rotate(${(1 - fly) * -12}deg)` }}>
      <div style={{ ...card({ padding: '20px 24px', width: 400, display: 'flex', gap: 16, alignItems: 'center' }) }}>
        <span style={{ width: 58, height: 58, borderRadius: 16, background: 'rgb(79 124 255 / .18)', display: 'grid', placeItems: 'center', fontSize: 30 }}>✉</span>
        <div><div style={{ fontSize: 24, fontWeight: 700 }}>Nota enviada</div><div style={{ fontSize: 19, color: C.muted }}>financeiro@aurora.com.br</div></div>
      </div>
    </div>
    <div style={{ position: 'absolute', top: 420, left: 610, width: 400, opacity: money, transform: `translateY(${(1 - money) * 30}px)` }}>
      <div style={{ ...card({ padding: '18px 24px', background: 'rgb(52 211 153 / .1)', boxShadow: '0 0 0 1px rgb(52 211 153 / .35)' }), display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: C.green }}>+</span>
        <div><div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>{brl(12400)}</div><div style={{ fontSize: 18, color: C.muted }}>em contas a receber</div></div>
      </div>
    </div>
  </>
}

// 22.2–27.2 "O sistema por trás, que permite tudo isso, se chama Otto, mas não faz só isso."
function SceneOtto({ f }: { f: number }) {
  const pop = prog(f, s(1.6), 16), glow = 0.5 + 0.5 * Math.sin(f / 10)
  const turn = s(3.8)
  if (f >= turn) {
    const p = prog(f, turn, 10)
    return <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: p, transform: `scale(${0.9 + p * 0.1})` }}><div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -2, color: C.text }}>Mas não faz <span style={{ color: C.blueSoft }}>só isso.</span></div></div>
  }
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontSize: 30, color: C.muted, opacity: prog(f, 0, 12) }}>O sistema por trás de tudo isso</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, opacity: pop, transform: `scale(${0.8 + pop * 0.2})` }}>
      <div style={{ width: 170, height: 170, borderRadius: 44, background: C.blue, display: 'grid', placeItems: 'center', boxShadow: `0 0 ${50 + glow * 40}px rgb(79 124 255 / .6)` }}><OttoMark size={104} /></div>
      <span style={{ fontSize: 150, fontWeight: 800, letterSpacing: -6, color: C.text }}>Otto</span>
    </div>
  </>
}

// 27.2–29.2 "Ele também concilia movimentações bancárias,"
function SceneReconcile({ f }: { f: number }) {
  const rows = [['Pix recebido · Aurora', '+ 12.400,00', 'Venda #1042'], ['Boleto · Energia', '− 860,40', 'Conta de luz'], ['Tarifa bancária', '− 32,90', 'Despesas bancárias']]
  return <>
    <Headline f={f} text="Concilia o banco" accent={['banco']} top={36} />
    <div style={{ ...center(160, 960), display: 'grid', gap: 16 }}>
      {rows.map((r, i) => {
        const p = prog(f, 8 + i * 12, 10), ok = prog(f, 16 + i * 12, 8)
        return <div key={r[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', opacity: p }}>
          <div style={{ ...card({ padding: '18px 22px', borderRadius: 16 }), display: 'flex', justifyContent: 'space-between', fontSize: 22 }}><span>{r[0]}</span><b style={{ color: r[1].startsWith('+') ? C.green : C.text }}>{r[1]}</b></div>
          <div style={{ position: 'relative', height: 4, margin: '0 8px', background: C.line }}><i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ok * 100}%`, background: C.green, boxShadow: `0 0 10px ${C.green}` }} /><span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>{check(30, ok)}</span></div>
          <div style={{ ...card({ padding: '18px 22px', borderRadius: 16, boxShadow: `0 0 0 1px ${ok > 0.5 ? 'rgb(52 211 153 / .45)' : C.line}` }), fontSize: 22 }}>{r[2]}</div>
        </div>
      })}
    </div>
  </>
}

// 29.2–31.0 "classifica despesas,"
function SceneClassify({ f }: { f: number }) {
  const items = [['Uber', 'Transporte', 0], ['AWS', 'Software', 1], ['Café da equipe', 'Alimentação', 2], ['Aluguel', 'Ocupação', 3]] as const
  return <>
    <Headline f={f} text="Classifica despesas" accent={['despesas']} top={36} />
    <div style={{ ...center(170, 960), display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
      {items.map(([name, cat, i]) => {
        const drop = prog(f, 6 + i * 8, 14)
        return <div key={name} style={{ position: 'relative', height: 300 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: interpolate(drop, [0, 1], [0, 150]), ...card({ padding: '14px 12px', borderRadius: 14, textAlign: 'center', background: C.cardHi }), fontSize: 21, fontWeight: 700 }}>{name}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, borderRadius: 16, border: `2px dashed ${drop > 0.9 ? C.green : 'rgb(255 255 255 / .18)'}`, display: 'grid', placeItems: 'end center', paddingBottom: 14, fontSize: 19, color: drop > 0.9 ? C.green : C.muted, fontWeight: 600 }}>{cat}</div>
        </div>
      })}
    </div>
  </>
}

// 31.0–34.6 "controla contas a pagar e a receber, envia cobranças,"
function ScenePayables({ f }: { f: number }) {
  const n = prog(f, 4, 40), toast = prog(f, s(1.7), 12)
  return <>
    <Headline f={f} text="Contas a pagar e a receber" accent={['pagar', 'receber']} top={36} />
    <div style={{ ...center(160, 900), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
      {[['A receber', 48610, C.green], ['A pagar', 24730, C.amber]].map(([label, value, color]) => (
        <div key={label as string} style={{ ...card({ padding: '24px 28px' }) }}>
          <div style={{ fontSize: 22, color: C.muted }}>{label}</div>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.5, color: color as string, fontVariantNumeric: 'tabular-nums' }}>{brl(Number(value) * n)}</div>
          <div style={{ marginTop: 14, height: 8, borderRadius: 4, background: C.line }}><i style={{ display: 'block', height: '100%', width: `${(label === 'A receber' ? 72 : 46) * n}%`, borderRadius: 4, background: color as string }} /></div>
        </div>
      ))}
    </div>
    <div style={{ ...center(410, 640), opacity: toast, transform: `translateY(${(1 - toast) * 30}px)` }}>
      <div style={{ ...card({ padding: '16px 22px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }) }}>
        <span style={{ fontSize: 28 }}>✉</span><div style={{ flex: 1 }}><b style={{ fontSize: 22 }}>Cobrança enviada</b><div style={{ fontSize: 18, color: C.muted }}>Bruno Lima · vence amanhã · R$ 1.249,00</div></div>{check(28)}
      </div>
    </div>
  </>
}

// 34.6–37.2 "acompanha clientes em atraso e verifica as obrigações fiscais."
function SceneLate({ f }: { f: number }) {
  const late = [['Carla Mendes', '12 dias', 'R$ 219,50'], ['Diego Rocha', '8 dias', 'R$ 740,00'], ['Elisa Prado', '3 dias', 'R$ 512,30']]
  const tasks = ['DAS do Simples', 'ISS do mês', 'DCTFWeb']
  return <>
    <Headline f={f} text="Atrasos e obrigações em dia" accent={['obrigações']} top={36} />
    <div style={{ position: 'absolute', top: 160, left: 60, width: 500, ...card({ padding: '14px 24px' }) }}>
      <div style={{ fontSize: 18, color: C.muted, padding: '6px 0 8px' }}>Clientes em atraso</div>
      {late.map((r, i) => <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 74, borderTop: `1px solid ${C.line}`, opacity: prog(f, 6 + i * 6, 10) }}>
        <span style={{ flex: 1, fontSize: 23, fontWeight: 600 }}>{r[0]}</span><span style={{ fontSize: 22 }}>{r[2]}</span>
        <span style={{ padding: '5px 12px', borderRadius: 999, background: 'rgb(248 113 113 / .15)', color: C.red, fontSize: 17, fontWeight: 700 }}>{r[1]}</span>
      </div>)}
    </div>
    <div style={{ position: 'absolute', top: 160, left: 590, width: 430, ...card({ padding: '14px 24px' }) }}>
      <div style={{ fontSize: 18, color: C.muted, padding: '6px 0 8px' }}>Obrigações fiscais</div>
      {tasks.map((t, i) => { const ok = prog(f, s(1.2) + i * 8, 8); return <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 74, borderTop: `1px solid ${C.line}` }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, border: `2px solid ${ok > 0.5 ? C.green : 'rgb(255 255 255 / .25)'}`, display: 'grid', placeItems: 'center' }}>{ok > 0.1 ? <span style={{ color: C.green, fontWeight: 900, transform: `scale(${ok})` }}>✓</span> : null}</span>
        <span style={{ fontSize: 23, fontWeight: 600, color: ok > 0.5 ? C.text : C.muted }}>{t}</span>
      </div> })}
    </div>
  </>
}

// 37.2–41.8 "E até mesmo identifica se a empresa pode pagar menos imposto, sempre dentro da lei."
function SceneTax({ f }: { f: number }) {
  const bars = prog(f, s(1.8), 24), shield = prog(f, s(3.6), 12)
  return <>
    <Headline f={f} text="Pague menos imposto" accent={['menos']} sub={undefined} top={36} />
    <div style={{ ...center(160, 900), ...card({ padding: '26px 34px' }) }}>
      {[['Hoje', 6200, C.muted], ['Com o regime ideal', 4360, C.blue]].map(([label, value, color], i) => (
        <div key={label as string} style={{ marginTop: i ? 22 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 23 }}><span style={{ color: C.muted }}>{label}</span><b>{brl(Number(value))}<span style={{ color: C.muted, fontWeight: 400 }}> /mês</span></b></div>
          <div style={{ marginTop: 10, height: 26, borderRadius: 13, background: C.line }}><i style={{ display: 'block', height: '100%', borderRadius: 13, width: `${(Number(value) / 6200) * 100 * bars}%`, background: color as string }} /></div>
        </div>
      ))}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: C.green, opacity: bars }}>Economia de {brl(1840 * bars)}/mês</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: 'rgb(52 211 153 / .14)', color: C.green, fontSize: 21, fontWeight: 700, opacity: shield, transform: `scale(${0.8 + shield * 0.2})` }}>🛡 Dentro da lei</span>
      </div>
    </div>
  </>
}

// 41.8–45.8 "E tudo isso funciona diretamente dentro do seu chat de IA."
function SceneChat({ f }: { f: number }) {
  const q = prog(f, 8, 12), typing = f > 30 && f < 56, a = prog(f, 56, 12)
  return <>
    <Headline f={f} text="Tudo numa conversa" accent={['conversa']} top={36} />
    <div style={{ ...center(160, 900), display: 'grid', gap: 18 }}>
      <div style={{ justifySelf: 'end', maxWidth: 620, padding: '18px 26px', borderRadius: '24px 24px 6px 24px', background: C.blue, fontSize: 28, fontWeight: 600, color: '#fff', opacity: q, transform: `translateY(${(1 - q) * 20}px)` }}>Como está o caixa este mês?</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <span style={{ width: 62, height: 62, borderRadius: 18, background: C.blue, display: 'grid', placeItems: 'center', flexShrink: 0, opacity: f > 26 ? 1 : 0 }}><OttoMark size={38} /></span>
        {typing ? <div style={{ ...card({ padding: '22px 26px', borderRadius: '24px 24px 24px 6px' }), display: 'flex', gap: 8 }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: C.muted, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5 + i)) }} />)}</div> : null}
        {a > 0 ? <div style={{ ...card({ padding: '18px 26px', borderRadius: '24px 24px 24px 6px' }), fontSize: 26, lineHeight: 1.35, maxWidth: 720, opacity: a }}>Saldo de <b style={{ color: C.green }}>R$ 23.880</b>. Três contas vencem esta semana — quer que eu agende?</div> : null}
      </div>
    </div>
  </>
}

// 45.8–53.2 "O Otto é o sistema completo de gestão e contabilidade, centralizando vendas, financeiro, contabilidade e emissão de nota fiscal."
function SceneModules({ f }: { f: number }) {
  const mods = [['Vendas', '🛒', s(4.0)], ['Financeiro', '💰', s(4.6)], ['Contabilidade', '📊', s(5.2)], ['Nota fiscal', '🧾', s(5.8)]] as const
  const pos = [[80, 150], [750, 150], [80, 400], [750, 400]]
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontSize: 50, fontWeight: 800, letterSpacing: -1.4, color: C.text, opacity: prog(f, 0, 12) }}>Gestão e contabilidade <span style={{ color: C.blueSoft }}>num só lugar</span></div>
    <svg width={1080} height={BAND_H} style={{ position: 'absolute', inset: 0 }}>
      {pos.map(([x, y], i) => { const on = prog(f, mods[i][2], 12); return <line key={i} x1={540} y1={330} x2={x + 125} y2={y + 45} stroke={on > 0.5 ? C.blue : 'rgb(255 255 255 / .12)'} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-f} /> })}
    </svg>
    <div style={{ position: 'absolute', left: 540 - 85, top: 330 - 85, width: 170, height: 170, borderRadius: 46, background: C.blue, display: 'grid', placeItems: 'center', boxShadow: `0 0 70px rgb(79 124 255 / .55)`, transform: `scale(${0.8 + prog(f, 6, 14) * 0.2})` }}><OttoMark size={100} /></div>
    {mods.map(([label, icon, at], i) => {
      const on = prog(f, at, 12)
      return <div key={label} style={{ position: 'absolute', left: pos[i][0], top: pos[i][1], width: 250, height: 90, whiteSpace: 'nowrap', ...card({ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', boxShadow: on > 0.5 ? `0 0 0 2px ${C.blue}, 0 0 40px rgb(79 124 255 / .4)` : `0 0 0 1px ${C.line}` }), opacity: 0.35 + on * 0.65, transform: `scale(${0.94 + on * 0.06})` }}>
        <span style={{ fontSize: 34 }}>{icon}</span><b style={{ fontSize: 25 }}>{label}</b>
      </div>
    })}
  </>
}

// 53.2–end "Tudo integrado ao seu chat de IA, para que você administre a empresa apenas conversando com a IA."
function SceneOutro({ f }: { f: number }) {
  const logo = prog(f, 4, 18), words = 'Administre sua empresa conversando com a IA.'.split(' ')
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: logo, transform: `scale(${0.85 + logo * 0.15})` }}>
      <div style={{ width: 130, height: 130, borderRadius: 34, background: C.blue, display: 'grid', placeItems: 'center', boxShadow: `0 0 ${60 + Math.sin(f / 10) * 20}px rgb(79 124 255 / .6)` }}><OttoMark size={80} /></div>
      <span style={{ fontSize: 120, fontWeight: 800, letterSpacing: -5, color: C.text }}>Otto</span>
    </div>
    <div style={{ position: 'absolute', left: 60, right: 60, top: 330, textAlign: 'center', fontSize: 50, fontWeight: 750, letterSpacing: -1.2, lineHeight: 1.15, color: C.text }}>
      {words.map((w, i) => { const p = prog(f, s(1.6) + i * 4, 10); return <span key={i} style={{ display: 'inline-block', marginRight: 13, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, color: ['conversando', 'IA.'].includes(w) ? C.blueSoft : undefined }}>{w}</span> })}
    </div>
  </>
}

// Times in seconds, from the captions.
const scenes: Array<[number, number, (props: { f: number }) => ReactNode]> = [
  [0, 4.8, SceneIntro], [4.8, 9.2, SceneNoPortal], [9.2, 11.0, SceneAsk], [11.0, 15.8, SceneFill], [15.8, 17.6, SceneConfirm],
  [17.6, 22.2, SceneIssue], [22.2, 27.2, SceneOtto], [27.2, 29.2, SceneReconcile], [29.2, 31.0, SceneClassify], [31.0, 34.6, ScenePayables],
  [34.6, 37.2, SceneLate], [37.2, 41.8, SceneTax], [41.8, 45.8, SceneChat], [45.8, 53.2, SceneModules], [53.2, OTTO_NFE_CHAT_REEL_DURATION / FPS, SceneOutro],
]

function Band() {
  const f = useCurrentFrame()
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: BAND_H, overflow: 'hidden' }}>
      <Backdrop f={f} />
      {scenes.map(([from, to, Body]) => {
        const start = s(from), dur = s(to) - start
        return <Sequence key={from} from={start} durationInFrames={dur} layout="none">
          <SceneClock dur={dur} Body={Body} />
        </Sequence>
      })}
    </div>
  )
}

function SceneClock({ dur, Body }: { dur: number; Body: (props: { f: number }) => ReactNode }) {
  // Inside a Sequence the frame already starts at 0.
  const f = useCurrentFrame()
  return <Scene f={f} dur={dur}><Body f={f} /></Scene>
}

/** Loads SF Pro from the project before the first frame, so renders outside the app use the same type. */
function useSfPro() {
  const [handle] = useState(() => delayRender('SF Pro'))
  useEffect(() => {
    const faces = sfWeights.map(([name, weight]) => new FontFace('SF Pro Otto', `url("${staticFile(`remotion/fonts/sf-pro/SF-Pro-Text-${name}.otf`)}") format("opentype")`, { weight: String(weight) }))
    const heavy = new FontFace('SF Pro Otto', `url("${staticFile('remotion/fonts/sf-pro/SF-Pro-Display-Heavy.otf')}") format("opentype")`, { weight: '800' })
    const all = [...faces, heavy]
    all.forEach((face) => document.fonts.add(face))
    Promise.all(all.map((face) => face.load())).catch(() => undefined).finally(() => continueRender(handle))
  }, [handle])
}

export function OttoNfeChatReel() {
  useSfPro()
  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: SANS }}>
      {/* The presenter, captions and audio, exactly as recorded. */}
      <OffthreadVideo src={staticFile('remotion/otto-reels/nfe-chat-ia.mp4')} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920 }} />
      <Band />
    </AbsoluteFill>
  )
}
