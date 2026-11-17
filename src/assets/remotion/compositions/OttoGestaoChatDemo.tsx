import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { IconBrandOpenai } from '@tabler/icons-react'

// OttoGestão landing page: a ChatGPT- or Claude-style chat where the person asks Otto to classify the month's
// uncategorised expenses. Otto's card fills each expense's category, flags a possible duplicate for review and builds
// the month's DRE (expenses by group). Loops cleanly (starts and ends on the empty chat). 1440×960, 30 fps.
// All suppliers and values are made up.

export const OTTOGESTAO_CHAT_DURATION = 480
export const OTTOGESTAO_CHAT_WIDTH = 1440
export const OTTOGESTAO_CHAT_HEIGHT = 960

const opts = { subsets: ['latin'] as ['latin'] }
const UI = loadInter('normal', { ...opts, weights: ['400', '500', '600', '700'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const pop = (f: number, a: number) => interpolate(f, [a, a + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) })

export type ChatApp = 'chatgpt' | 'claude'
const THEMES = {
  chatgpt: { app: 'chatgpt' as ChatApp, sidebar: '#171717', main: '#212121', bubble: '#303030', composer: '#303030', txt: '#ececec', dim: '#9b9b9b', line: '#2f2f2f', card: '#171717', pill: '#2a2a2a', active: '#262626', name: 'ChatGPT', empty: 'Em que você está pensando hoje?', placeholder: 'Pergunte alguma coisa' },
  claude: { app: 'claude' as ChatApp, sidebar: '#1f1e1d', main: '#262624', bubble: '#141413', composer: '#30302e', txt: '#faf9f5', dim: '#a6a39a', line: '#3e3e38', card: '#1f1e1d', pill: '#30302e', active: '#30302e', name: 'Claude', empty: 'Como posso ajudar você hoje?', placeholder: 'Responder ao Claude…' },
}
type Theme = (typeof THEMES)['chatgpt']
const ThemeCtx = createContext<Theme>(THEMES.chatgpt)
const useT = () => useContext(ThemeCtx)
const VIOLET = '#7c4dff', GREEN = '#3ddc84'

const PROMPT = 'Classifica as despesas de novembro que estão sem categoria e me mostra como ficou o DRE.'

// ---------- timing ----------
const TYPE_FROM = 24, TYPE_TO = 100, SEND = 112, REPLY = 130, CARD = 150
const ROW_AT = (i: number) => 190 + i * 22
const READY = 372, FADE_OUT = OTTOGESTAO_CHAT_DURATION - 14

const GROUPS = {
  adm: { label: 'Despesas administrativas', color: '#4f8cff' },
  pes: { label: 'Despesas com pessoal', color: '#a78bfa' },
  com: { label: 'Despesas comerciais', color: '#ff5fa2' },
  imp: { label: 'Impostos sobre vendas', color: '#ff8a3d' },
  cst: { label: 'Custos dos serviços', color: '#38d6f5' },
} as const
type GroupId = keyof typeof GROUPS
const ROWS: { supplier: string; raw: string; cat: string; group: GroupId; value: number; dup?: boolean }[] = [
  { supplier: 'Enel Distribuição SP', raw: 'ENEL DISTRIB SP*FAT1026', cat: 'Energia elétrica', group: 'adm', value: 1482.4 },
  { supplier: 'Folha de pagamento', raw: 'FOLHA PGTO OUT/26', cat: 'Salários', group: 'pes', value: 38400 },
  { supplier: 'Meta Platforms', raw: 'FACEBK *ADS 8HJ2KQ', cat: 'Marketing e anúncios', group: 'com', value: 6200 },
  { supplier: 'Receita Federal', raw: 'DAS SIMPLES NAC 10/2026', cat: 'DAS · Simples Nacional', group: 'imp', value: 9860.15 },
  { supplier: 'Amazon Web Services', raw: 'AWS EMEA *HOSTING', cat: 'Infraestrutura cloud', group: 'cst', value: 4380 },
  { supplier: 'Imobiliária Lar', raw: 'BOLETO IMOB LAR ALUG 304', cat: 'Aluguel', group: 'adm', value: 7800 },
  { supplier: 'Kalunga', raw: 'KALUNGA LJ 112 SP', cat: 'Material de escritório', group: 'adm', value: 486, dup: true },
  { supplier: 'Unimed', raw: 'UNIMED PJ CONTR 7781', cat: 'Plano de saúde', group: 'pes', value: 5460 },
]
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Claude's mark: the left square of the wordmark file. */
function ClaudeMark({ size }: { size: number }) {
  return <span style={{ width: size, height: size, overflow: 'hidden', display: 'inline-block', flexShrink: 0 }}>
    <Img src={staticFile('claudeLogo.svg')} style={{ height: size, width: 'auto', maxWidth: 'none' }} />
  </span>
}

function Sidebar() {
  const T = useT()
  const item = (icon: ReactNode, label: string) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, padding: '0 12px', borderRadius: 10, color: T.txt, fontSize: 16 }}>{icon}{label}</div>
  const circle = <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.txt} strokeWidth={2}><circle cx={11} cy={11} r={7} /><path d="M20 20l-4-4" /></svg>
  return <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, background: T.sidebar, padding: '22px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
    {T.app === 'claude'
      ? <div style={{ display: 'flex', alignItems: 'center', padding: '4px 12px 22px' }}><Img src={staticFile('claudeLogo.svg')} style={{ height: 30 }} /></div>
      : <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 12px 22px' }}>
        <IconBrandOpenai size={34} color={T.txt} stroke={1.6} />
        <span style={{ fontSize: 24, fontWeight: 600, color: T.txt }}>ChatGPT</span>
      </div>}
    {item(T.app === 'claude' ? <span style={{ width: 18, textAlign: 'center', fontSize: 22, lineHeight: 1 }}>+</span> : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.txt} strokeWidth={2}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>, 'Novo chat')}
    {T.app === 'claude' ? <>
      {item(<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.txt} strokeWidth={2}><path d="M3 7h7l2 2h9v10H3z" /></svg>, 'Projetos')}
      {item(<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.txt} strokeWidth={2}><rect x={4} y={4} width={16} height={16} rx={2} /><path d="M8 9h8M8 13h5" /></svg>, 'Artefatos')}
    </> : <>
      {item(circle, 'Buscar chats')}
      {item(<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.txt} strokeWidth={2}><rect x={3} y={3} width={18} height={18} rx={3} /><circle cx={9} cy={9} r={2} /><path d="M21 15l-5-5L5 21" /></svg>, 'Imagens')}
    </>}
    <div style={{ margin: '18px 12px 8px', fontSize: 13, color: T.dim }}>{T.app === 'claude' ? 'Conectores' : 'Apps'}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, padding: '0 12px', borderRadius: 10, background: T.active, color: T.txt, fontSize: 16 }}><Logo size={22} />Otto</div>
    <div style={{ margin: '22px 12px 10px', fontSize: 13, color: T.dim }}>{T.app === 'claude' ? 'Recentes' : 'Chats'}</div>
    {[150, 190, 130, 170, 110].map((w, i) => <i key={i} style={{ display: 'block', height: 12, width: w, margin: '10px 12px', borderRadius: 6, background: T.pill }} />)}
  </div>
}

export function Logo({ size }: { size: number }) {
  return <span style={{ width: size, height: size, borderRadius: size * 0.28, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
    <Img src={staticFile('logoOttoIcon.svg')} style={{ width: size * 0.66, height: size * 0.66 }} />
  </span>
}

function Composer({ f }: { f: number }) {
  const T = useT()
  const typed = Math.round(interpolate(f, [TYPE_FROM, TYPE_TO], [0, PROMPT.length], clamp))
  const sent = f >= SEND
  return <div style={{ position: 'absolute', left: 340, right: 40, bottom: 34, minHeight: 64, borderRadius: T.app === 'claude' ? 20 : 28, background: T.composer, padding: '12px 18px 12px 18px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: `0 0 0 1px ${T.line}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 26, color: T.txt, lineHeight: 1 }}>+</span>
      <span style={{ flex: 1, fontSize: 17, color: !sent && typed ? T.txt : T.dim, lineHeight: 1.4 }}>{!sent && typed ? <>{PROMPT.slice(0, typed)}<span style={{ opacity: f % 16 < 8 ? 1 : 0 }}>|</span></> : T.placeholder}</span>
      <span style={{ width: 38, height: 38, borderRadius: T.app === 'claude' ? 10 : '50%', background: !sent && typed ? (T.app === 'claude' ? '#c96442' : '#fff') : '#4a4a4a', display: 'grid', placeItems: 'center' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={!sent && typed ? (T.app === 'claude' ? '#fff' : '#000') : '#2a2a2a'} strokeWidth={2.6} strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </span>
    </div>
  </div>
}

function Expenses({ f }: { f: number }) {
  const T = useT()
  return <div style={{ flex: 1.25, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <b style={{ fontSize: 16, color: T.txt }}>Despesas de novembro</b>
      <span style={{ fontSize: 13, color: T.dim }}>{Math.min(ROWS.length, ROWS.filter((_, i) => f >= ROW_AT(i)).length) * 6} de 48 classificadas</span>
    </div>
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${T.line}` }}>
      {ROWS.map((r, i) => {
        const on = f >= ROW_AT(i), working = !on && f >= ROW_AT(i) - 22 && f >= CARD + 16
        const g = GROUPS[r.group], p = pop(f, ROW_AT(i))
        const flag = r.dup && f >= ROW_AT(i) + 30
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 44, borderBottom: `1px solid ${T.line}`, background: flag ? 'rgb(255 176 32 / .08)' : working ? 'rgb(255 255 255 / .03)' : 'transparent', padding: '0 6px' }}>
          <span style={{ width: 180, display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <b style={{ fontSize: 14, color: T.txt, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.supplier}</b>
            <span style={{ fontSize: 11, color: T.dim, fontFamily: 'monospace' }}>{r.raw}</span>
          </span>
          <span style={{ width: 100, textAlign: 'right', fontSize: 14, color: T.txt, fontVariantNumeric: 'tabular-nums' }}>{brl(r.value).replace('R$', '').trim()}</span>
          <span style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            {on ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 999, background: `${g.color}22`, border: `1px solid ${g.color}77`, color: T.txt, fontSize: 13, fontWeight: 600, transform: `scale(${0.7 + p * 0.3})`, opacity: p, whiteSpace: 'nowrap' }}>
              <i style={{ width: 7, height: 7, borderRadius: 2, background: g.color }} />{r.cat}{flag && <span style={{ color: '#ffb020', marginLeft: 4 }}>⚠ revisar</span>}
            </span>
              : working ? <span style={{ width: 150, height: 22, borderRadius: 999, border: `1px dashed ${VIOLET}`, background: 'rgb(124 77 255 / .12)', opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 5)) }} />
              : <span style={{ fontSize: 12, color: T.dim, border: `1px dashed ${T.line}`, borderRadius: 999, padding: '3px 9px' }}>sem categoria</span>}
          </span>
        </div>
      })}
    </div>
  </div>
}

function Dre({ f }: { f: number }) {
  const T = useT()
  const order: GroupId[] = ['pes', 'imp', 'adm', 'com', 'cst']
  const totals = Object.fromEntries(order.map(g => [g, ROWS.filter((r, i) => r.group === g && f >= ROW_AT(i)).reduce((s, r) => s + r.value, 0)])) as Record<GroupId, number>
  const max = Math.max(...order.map(g => ROWS.filter(r => r.group === g).reduce((s, r) => s + r.value, 0)))
  const sum = Object.values(totals).reduce((s, v) => s + v, 0)
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 26, borderLeft: `1px solid ${T.line}` }}>
    <b style={{ fontSize: 16, color: T.txt }}>DRE · despesas</b>
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {order.map(g => <div key={g}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.dim }}><span>{GROUPS[g].label}</span><span style={{ color: T.txt, fontVariantNumeric: 'tabular-nums' }}>{brl(totals[g])}</span></div>
        <div style={{ marginTop: 6, height: 8, borderRadius: 4, background: T.pill, overflow: 'hidden' }}><div style={{ width: `${(totals[g] / max) * 100}%`, height: '100%', borderRadius: 4, background: GROUPS[g].color }} /></div>
      </div>)}
    </div>
    <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${T.line}` }}>
      <span style={{ fontSize: 13, color: T.dim }}>Total classificado</span>
      <b style={{ fontSize: 24, color: f >= READY ? GREEN : T.txt, fontVariantNumeric: 'tabular-nums' }}>{brl(sum)}</b>
    </div>
  </div>
}

function Card({ f }: { f: number }) {
  const T = useT()
  const enter = ease(f, CARD, CARD + 14)
  const ready = f >= READY
  return <div style={{ marginTop: 18, width: 1000, borderRadius: 20, background: T.card, border: `1px solid ${T.line}`, padding: 24, opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}><Logo size={26} /><b style={{ fontSize: 19, color: T.txt }}>Otto · Classificação de despesas</b><span style={{ marginLeft: 'auto', fontSize: 13, color: ready ? GREEN : T.dim, fontWeight: 600 }}>{ready ? '● concluído' : '● classificando'}</span></div>
    <div style={{ display: 'flex', gap: 26 }}><Expenses f={f} /><Dre f={f} /></div>
    <div style={{ marginTop: 18, display: 'flex', gap: 10, opacity: ease(f, READY, READY + 10) }}>
      {['Aplicar no financeiro', 'Ver DRE completo'].map((l, i) => <span key={l} style={{ padding: '10px 18px', borderRadius: 999, background: i ? 'transparent' : '#fff', color: i ? T.txt : '#000', border: i ? `1px solid ${T.line}` : 'none', fontSize: 15, fontWeight: 600 }}>{l}</span>)}
    </div>
  </div>
}

export function OttoGestaoChatDemo({ app = 'chatgpt' }: { app?: ChatApp }) {
  return <ThemeCtx.Provider value={THEMES[app]}><ChatScene /></ThemeCtx.Provider>
}

function ChatScene() {
  const T = useT()
  const f = useCurrentFrame()
  const sent = f >= SEND
  const bubble = pop(f, SEND)
  const reply = ease(f, REPLY, REPLY + 10)
  const scroll = interpolate(f, [CARD, CARD + 30], [0, 70], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const out = interpolate(f, [FADE_OUT, OTTOGESTAO_CHAT_DURATION], [1, 0], clamp)
  const style: CSSProperties = { position: 'absolute', left: 300, right: 0, top: 0, bottom: 0, background: T.main, overflow: 'hidden' }
  return <AbsoluteFill style={{ background: T.main, fontFamily: UI }}>
    <Sidebar />
    <div style={style}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64, display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: 19, color: T.txt, fontWeight: 600, background: T.main, zIndex: 2 }}>{T.app === 'claude' ? 'Fechamento de novembro' : 'ChatGPT'} <span style={{ color: T.dim, marginLeft: 6 }}>⌄</span></div>
      {!sent && <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontSize: 30, color: T.txt, fontWeight: 500, opacity: out * interpolate(f, [0, 10], [0, 1], clamp), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, fontFamily: T.app === 'claude' ? 'Georgia, serif' : undefined }}>{T.app === 'claude' && <ClaudeMark size={34} />}{T.empty}</div>}
      {sent && <div style={{ position: 'absolute', left: 80, right: 80, top: 100 - scroll, opacity: out, display: 'flex', flexDirection: 'column' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: 620, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, opacity: bubble, transform: `translateY(${(1 - bubble) * 14}px)` }}>
          <div style={{ background: T.bubble, color: T.txt, fontSize: 17, lineHeight: 1.45, padding: '12px 18px', borderRadius: 22 }}>{PROMPT}</div>
        </div>
        <div style={{ marginTop: 26, opacity: reply }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: T.pill, color: T.dim, fontSize: 14 }}><Logo size={18} />{T.app === 'claude' ? 'Usando o Otto' : 'Usou o Otto'}</span>
          <div style={{ marginTop: 12, fontSize: 17, color: T.txt, lineHeight: 1.5 }}>{f >= READY ? 'Pronto! Classifiquei as 48 despesas de novembro. Uma da Kalunga parece duplicada e ficou para você revisar. Quer que eu concilie com o extrato do banco?' : 'Certo! Encontrei 48 despesas sem categoria em novembro. Classificando agora:'}</div>
          <Card f={f} />
        </div>
      </div>}
      <div style={{ opacity: f < FADE_OUT ? 1 : out }}><Composer f={f} /></div>
    </div>
  </AbsoluteFill>
}
