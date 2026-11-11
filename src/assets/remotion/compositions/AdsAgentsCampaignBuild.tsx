import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto'

// "Agentes montando anúncios": an ads manager in the browser, built live by AI agents. First the editor (icon rail,
// campaign tree, breadcrumb with Editar/Revisar, form in the middle, summary or ad preview on the right): the
// campaign (budget strategy cards, daily budget, bid strategy, A/B test), the ad set (conversion, budget & schedule,
// audience) and the ad (format, media, primary text, headline, description, CTA, destination with URL parameters,
// feed and reels previews); then a burst through the other ads of the tree; then the campaigns, ad sets and ads
// tables with tags and drafts while "Revisar e publicar (n)" climbs. 1920×1080, 30 fps, 22 s.
// Account, product and numbers are made up; no third-party logos.

export const ADS_AGENTS_BUILD_DURATION = 720
const FONT = loadRoboto('normal', { subsets: ['latin'], weights: ['400', '500', '700'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const INK = '#1c2b33', MUTED = '#606770', LINE = '#cbd2d9', HAIR = '#e4e6eb', BG = '#f0f2f5', BLUE = '#0a78be', BRIGHT = '#1877f2', GREEN = '#20a33a', SEL = '#e7f3ff'
const T = (size: number, color = INK, weight = 400, extra?: CSSProperties): CSSProperties => ({ fontFamily: FONT, fontSize: size, color, fontWeight: weight, whiteSpace: 'nowrap', ...extra })

// ---------- timing ----------
const PH = { campaign: 0, adset: 150, ad: 250, burst: 400, table: 480 } as const
const TABLE_TAB = { campaigns: 480, adsets: 540, ads: 596 }
// Real-time sequence: the "create campaign" dialog, then the editor and the tables (sped up), the review of the
// draft items and, at the end, the published campaigns with their results.
const INTRO_END = 70, EDIT_SPEED = 1.3, TBL_START = 440, TBL_SPEED = 1.2
const REVIEW = { open: 575, publish: 618, results: 640 }
/** Frame of the build timeline (editor and tables) at real frame f. */
const buildFrame = (f: number) => f < INTRO_END ? 0 : f < TBL_START ? (f - INTRO_END) * EDIT_SPEED : 480 + (f - TBL_START) * TBL_SPEED
/** Real frame of a build-timeline frame. */
const realFrame = (b: number) => b < 480 ? INTRO_END + b / EDIT_SPEED : TBL_START + (b - 480) / TBL_SPEED

// ---------- tree (made up) ----------
type Kind = 'campaign' | 'adset' | 'ad'
type Node = { label: string; kind: Kind; at: number }
const CONCEPTS = ['C01 · TESTE DE SABOR', 'C02 · 4 BENEFÍCIOS', 'C03 · HISTÓRIA REAL', 'C04 · NA CORRERIA', 'C05 · AMIGOS · DOCE']
const TREE: Node[] = (() => {
  const n: Node[] = [{ label: 'TESTE · CBO · CONCEITOS · S45', kind: 'campaign', at: 4 }]
  CONCEPTS.forEach((c, i) => {
    const base = i === 0 ? 150 : 268 + i * 40
    n.push({ label: `${c} · AMPLO`, kind: 'adset', at: base })
    ;['V1', 'V2', 'V3'].forEach((v, k) => n.push({ label: `${c} · ${v}`, kind: 'ad', at: i === 0 ? 250 + k * 30 : base + 8 + k * 8 }))
  })
  return n
})()
/** The node selected in the editor at frame f (index in TREE). */
function selectedAt(f: number) {
  if (f < PH.adset) return 0
  if (f < PH.ad) return 1
  if (f < PH.burst) return 2
  const ads = TREE.map((x, i) => ({ x, i })).filter(({ x, i }) => x.kind === 'ad' && i > 2)
  return ads[Math.min(ads.length - 1, Math.floor((f - PH.burst) / 8))].i
}

// ---------- small pieces ----------
function typed(v: string, f: number, at: number, cps = 1.6) { return f < at ? '' : v.slice(0, Math.floor((f - at) * cps)) }
const Icon = ({ d, size = 14, color = MUTED, w = 1.5 }: { d: string; size?: number; color?: string; w?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: 'none' }}><path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></svg>
const I = { folder: 'M2 4h4l2 2h6v7H2z', grid: 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z', ad: 'M2 3h12v10H2zM5 10l2-2 2 2 3-3', search: 'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5', pencil: 'M3 13l1-3 7-7 2 2-7 7z', eye: 'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', x: 'M4 4l8 8M12 4l-8 8', chev: 'M6 4l4 4-4 4', down: 'M4 6l4 4 4-4', info: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 7v4M8 5v.1', refresh: 'M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3', plus: 'M8 3v10M3 8h10', copy: 'M5 5h8v8H5zM3 11V3h8', chart: 'M2 14h12M4 12V8M8 12V4M12 12V6', flask: 'M6 2h4M7 2v4l-4 7h10l-4-7V2', bell: 'M4 11V7a4 4 0 0 1 8 0v4l1 2H3zM7 14h2', gear: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', people: 'M6 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 7a2 2 0 1 0 0-4M12 10c1.6.4 2.8 1.8 2.8 4' }
function Toggle({ on, size = 1 }: { on: boolean; size?: number }) {
  const w = 30 * size, h = 16 * size
  return <span style={{ width: w, height: h, borderRadius: h / 2, background: on ? BRIGHT : '#bcc0c4', position: 'relative', display: 'inline-block', flex: 'none' }}><i style={{ position: 'absolute', top: 2, left: on ? w - h + 2 : 2, width: h - 4, height: h - 4, borderRadius: '50%', background: '#fff' }} /></span>
}
const Radio = ({ on }: { on: boolean }) => <i style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${on ? BRIGHT : '#8a8d91'}`, display: 'grid', placeItems: 'center', flex: 'none' }}>{on && <i style={{ width: 7, height: 7, borderRadius: '50%', background: BRIGHT }} />}</i>

function Input({ value, f, at, select, h = 30, multiline, active: forced, placeholder }: { value: string; f: number; at: number; select?: boolean; h?: number; multiline?: boolean; active?: boolean; placeholder?: string }) {
  const v = typed(value, f, at), typing = f >= at && v.length < value.length
  const active = forced ?? typing
  return <div style={{ minHeight: h, borderRadius: 6, border: `1px solid ${active ? BRIGHT : LINE}`, boxShadow: active ? '0 0 0 2px rgb(24 119 242 / .18)' : 'none', background: '#fff', display: 'flex', alignItems: multiline ? 'flex-start' : 'center', padding: multiline ? '7px 10px' : '0 10px', ...T(12.5, v ? INK : '#8a8d91', 400, { whiteSpace: multiline ? 'normal' : 'nowrap', lineHeight: 1.4 }) }}>
    <span style={{ flex: 1, overflow: 'hidden' }}>{v || placeholder || ''}{typing && <span style={{ color: BRIGHT }}>|</span>}</span>
    {select && <Icon d={I.down} size={12} />}
  </div>
}
function Label({ children, info }: { children: ReactNode; info?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, ...T(12, INK, 500) }}>{children}{info && <Icon d={I.info} size={11} color="#8a8d91" />}</div>
}
function Section({ title, children, link }: { title: string; children: ReactNode; link?: string }) {
  return <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .08)', padding: '14px 16px', marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Radio on={false} /><b style={T(14, INK, 700)}>{title}</b>{link && <span style={{ marginLeft: 'auto', ...T(12, BRIGHT, 500) }}>{link}</span>}</div>
    {children}
  </div>
}

/** The made-up product creative. */
function Creative({ w, h, variant = 0 }: { w: number; h: number; variant?: number }) {
  const bgs = ['linear-gradient(160deg, #ffe7c2, #ffd0a8)', 'linear-gradient(160deg, #d9f2e6, #b6e4cf)', 'linear-gradient(160deg, #e6e1ff, #cfc5ff)']
  const pw = w * 0.52, ph = Math.min(h * 0.58, w * 0.8)
  return <div style={{ position: 'relative', width: w, height: h, borderRadius: Math.max(2, w * 0.03), overflow: 'hidden', background: bgs[variant % 3], flex: 'none' }}>
    <div style={{ position: 'absolute', left: (w - pw) / 2, top: (h - ph) * 0.42, width: pw, height: ph, borderRadius: `${pw * 0.12}px ${pw * 0.12}px ${pw * 0.08}px ${pw * 0.08}px`, background: 'linear-gradient(180deg, #7ac943, #4e9a2a)', boxShadow: '0 4px 10px rgb(0 0 0 / .18)', transform: `rotate(${variant % 2 ? -6 : 5}deg)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.16, textAlign: 'center', ...T(pw * 0.2, '#fff', 700) }}>nutri</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.42, textAlign: 'center', ...T(pw * 0.13, '#eaffd8', 500) }}>gomas</div>
      {[0, 1, 2].map(k => <i key={k} style={{ position: 'absolute', left: pw * (0.22 + k * 0.2), top: ph * 0.7, width: pw * 0.15, height: pw * 0.15, borderRadius: '45%', background: ['#ff6b6b', '#ffd93d', '#ff9f43'][k] }} />)}
    </div>
    {h > w * 1.2 && w > 100 && <div style={{ position: 'absolute', left: 8, right: 8, bottom: h * 0.16, padding: '4px 6px', borderRadius: 4, background: 'rgb(255 255 255 / .92)', ...T(Math.max(8, w * 0.045), INK, 500, { whiteSpace: 'normal', lineHeight: 1.25 }) }}>Esse pacote salvou minha rotina de vitaminas</div>}
  </div>
}

// ---------- browser chrome (shared) ----------

function Browser({ f }: { f: number }) {
  const live = Math.min(24, Math.floor(interpolate(f, [2, 30], [0, 24], clamp)))
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 40, background: '#dfe1e5', display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 10px' }}>
      <span style={{ display: 'flex', gap: 7, alignSelf: 'center', marginRight: 10 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}</span>
      <div style={{ height: 32, width: 250, borderRadius: '8px 8px 0 0', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', ...T(12, INK) }}><i style={{ width: 14, height: 14, borderRadius: 3, background: '#bcc0c4' }} />Gerenciador de Anúncios · Campanhas<span style={{ marginLeft: 'auto', color: MUTED }}>×</span></div>
      <div style={{ height: 32, width: 190, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', ...T(12, MUTED) }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />Agentes · {live} em execução</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 40, height: 36, background: '#fff', borderBottom: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
      <span style={T(15, MUTED)}>←</span><span style={T(15, '#bcc0c4')}>→</span><Icon d={I.refresh} size={13} />
      <div style={{ flex: 1, height: 26, borderRadius: 13, background: '#f1f3f4', display: 'flex', alignItems: 'center', padding: '0 12px', ...T(12, MUTED) }}>gerenciador-de-anuncios/campanhas?act=8124003179&amp;edit=1</div>
      <span style={{ ...T(11.5, '#fff', 700), padding: '3px 10px', borderRadius: 999, background: '#1c1e21' }}>● {live} agentes</span>
    </div>
  </>
}

// ---------- editor ----------

const TOP = 76, RAIL_W = 44, TREE_W = 300
const MAIN_X = RAIL_W + TREE_W, FORM_X = MAIN_X + 24, FORM_W = 640, SIDE_X = FORM_X + FORM_W + 22, SIDE_W = 1920 - SIDE_X - 24
const CONTENT_TOP = TOP + 48

function Rail() {
  return <div style={{ position: 'absolute', left: 0, top: TOP, width: RAIL_W, bottom: 0, background: '#fff', borderRight: `1px solid ${HAIR}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 10 }}>
    <span style={{ width: 28, height: 28, borderRadius: 6, background: '#1c2b33', display: 'grid', placeItems: 'center' }}><Icon d={I.x} size={12} color="#fff" w={2} /></span>
    {[I.folder, I.pencil, I.eye, I.chart, I.people, I.bell, I.gear].map((d, i) => <span key={i} style={{ width: 28, height: 28, borderRadius: 6, background: i === 1 ? SEL : 'transparent', display: 'grid', placeItems: 'center' }}><Icon d={d} size={15} color={i === 1 ? BRIGHT : '#65676b'} /></span>)}
  </div>
}

function Tree({ f, sel }: { f: number; sel: number }) {
  const shown = TREE.map((n, i) => ({ n, i })).filter(({ n }) => f >= n.at)
  const scroll = Math.max(0, shown.length - 26) * 30
  return <div style={{ position: 'absolute', left: RAIL_W, top: TOP, width: TREE_W, bottom: 0, background: '#fff', borderRight: `1px solid ${HAIR}`, overflow: 'hidden' }}>
    <div style={{ margin: 10, height: 30, borderRadius: 6, background: BG, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', ...T(12.5, '#8a8d91') }}><Icon d={I.search} size={12} />Pesquisar</div>
    <div style={{ transform: `translateY(${-scroll}px)` }}>
      {shown.map(({ n, i }) => {
        const p = out(f, n.at, n.at + 8), on = i === sel
        const depth = n.kind === 'campaign' ? 0 : n.kind === 'adset' ? 1 : 2
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 30, margin: '0 6px', paddingLeft: 8 + depth * 16, paddingRight: 8, borderRadius: 6, background: on ? SEL : 'transparent', opacity: p, transform: `translateX(${(1 - p) * -12}px)` }}>
          <Icon d={n.kind === 'campaign' ? I.folder : n.kind === 'adset' ? I.grid : I.ad} size={13} color={on ? BRIGHT : '#65676b'} />
          <span style={{ ...T(12, on ? BRIGHT : INK, n.kind === 'campaign' ? 500 : 400), overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>
        </div>
      })}
    </div>
  </div>
}

function Header({ f, sel }: { f: number; sel: number }) {
  const node = TREE[sel]
  const adset = node.kind === 'ad' ? [...TREE.slice(0, sel)].reverse().find(n => n.kind === 'adset') : node.kind === 'adset' ? node : undefined
  const crumbs: [string, string][] = [[I.folder, TREE[0].label]]
  if (adset) crumbs.push([I.grid, adset.label])
  if (node.kind === 'ad') crumbs.push([I.ad, node.label])
  return <div style={{ position: 'absolute', left: MAIN_X, right: 0, top: TOP, height: 48, background: '#fff', borderBottom: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' }}>
    {crumbs.map(([d, l], i) => <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{i > 0 && <Icon d={I.chev} size={11} />}<span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: i === crumbs.length - 1 ? SEL : 'transparent', ...T(12.5, i === crumbs.length - 1 ? BRIGHT : MUTED, 500) }}><Icon d={d} size={12} color={i === crumbs.length - 1 ? BRIGHT : MUTED} />{l}</span></span>)}
    <span style={{ marginLeft: 'auto', display: 'flex', gap: 2, padding: 2, borderRadius: 6, background: BG }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, background: '#fff', boxShadow: '0 1px 2px rgb(0 0 0 / .1)', ...T(12, BRIGHT, 500) }}><Icon d={I.pencil} size={11} color={BRIGHT} />Editar</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', ...T(12, MUTED, 500) }}><Icon d={I.eye} size={11} />Revisar</span>
    </span>
    <span style={{ ...T(12, MUTED), marginLeft: 14 }}>Edições não publicadas</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12, MUTED) }}><Toggle on={false} />Desativado</span>
    <span style={{ ...T(11, MUTED) }}>{f % 40 < 20 ? 'Salvando…' : ''}</span>
  </div>
}

function Footer({ f }: { f: number }) {
  return <div style={{ position: 'absolute', left: MAIN_X, right: 0, bottom: 0, height: 52, background: '#fff', borderTop: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
    <span style={{ ...T(13, INK, 500), padding: '6px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Fechar</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12, MUTED) }}><i style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${LINE}`, borderTopColor: MUTED, transform: `rotate(${f * 14}deg)` }} />Salvando…</span>
    <span style={{ marginLeft: 'auto', ...T(13, INK, 500), padding: '6px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Descartar rascunho</span>
    <span style={{ ...T(13, '#fff', 700), padding: '7px 18px', borderRadius: 6, background: GREEN }}>Publicar</span>
  </div>
}

function SideCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .08)', padding: '14px 16px', marginBottom: 10, ...style }}>{children}</div>
}
function Summary({ title }: { title: string }) {
  return <>
    <SideCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon d={I.folder} size={14} color={INK} /><b style={T(13.5, INK, 700)}>{title}</b></div>
      <div style={{ ...T(11.5, MUTED), margin: '4px 0 10px 22px' }}>● Desativado · Últimos 30 dias</div>
      <div style={{ display: 'flex', borderTop: `1px solid ${HAIR}`, paddingTop: 10 }}>
        {[['Custo por resultado', '—'], ['Valor usado', 'R$ 0,00']].map(([a, b]) => <div key={a} style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 4, ...T(11.5, MUTED) }}>{a}<Icon d={I.info} size={10} color="#8a8d91" /></div><div style={{ ...T(13, INK, 500), marginTop: 4 }}>{b}</div></div>)}
      </div>
    </SideCard>
  </>
}

function CampaignEditor({ f }: { f: number }) {
  const t = f - PH.campaign
  const cbo = t >= 34
  const cards: [string, string, string][] = [['Orçamento da campanha', '6,6% menor custo por resultado', 'Distribui o valor para as melhores oportunidades. 100% do orçamento compartilhado.'], ['Compartilhamento de orçamento', '3,2% menor custo', 'Distribui entre os conjuntos com limite. Até 20% compartilhado.'], ['Orçamento do conjunto', 'Valor fixo por conjunto', 'O valor de cada conjunto fica onde você definir.']]
  return <>
    <div style={{ position: 'absolute', left: FORM_X, top: CONTENT_TOP + 18, width: FORM_W }}>
      <Section title="Detalhes da campanha">
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Label info>Tipo de compra</Label><Input value="Leilão" f={f} at={6} select /></div>
          <div style={{ flex: 1 }}><Label>Objetivo da campanha</Label><Input value="Vendas" f={f} at={12} select /></div>
        </div>
        <div style={{ ...T(12, BRIGHT, 500), marginTop: 10 }}>Mostrar mais configurações ▾</div>
      </Section>
      <Section title="Orçamento" link="✦ Advantage+ ativado">
        <Label info>Estratégia de orçamento</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          {cards.map(([a, b, c], i) => {
            const on = i === 0 && cbo
            return <div key={a} style={{ flex: 1, borderRadius: 8, border: `1.5px solid ${on ? BRIGHT : LINE}`, background: on ? '#f5f9ff' : '#fff', padding: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}><b style={T(12, INK, 700, { whiteSpace: 'normal', lineHeight: 1.25 })}>{a}</b><span style={{ marginLeft: 'auto' }}><Radio on={on} /></span></div>
              <div style={{ ...T(11, GREEN, 500), marginTop: 4 }}>{b}</div>
              <div style={{ ...T(11, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.35 }), marginTop: 4 }}>{c}</div>
            </div>
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ width: 180 }}><Label>Orçamento diário</Label><Input value="Diário" f={f} at={46} select /></div>
          <div style={{ flex: 1 }}><Label>&nbsp;</Label><Input value="R$ 300,00" f={f} at={52} /></div>
        </div>
        <div style={{ ...T(11.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 6 }}>Você vai gastar em média R$ 300,00 por dia. O valor máximo por dia é R$ 525,00 e o máximo por semana é R$ 2.100,00.</div>
        <div style={{ marginTop: 10 }}><Label info>Estratégia de lance da campanha</Label><Input value="Maior volume" f={f} at={70} select /></div>
        {t >= 92 && <div style={{ display: 'inline-flex', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: SEL, ...T(11, BRIGHT, 500), opacity: out(f, 92, 98) }}>+ Teste A/B ativado · um conjunto por conceito</div>}
      </Section>
      <Section title="Teste A/B">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, ...T(12, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }) }}>Melhore o desempenho comparando versões para ver o que funciona melhor. <span style={{ color: BRIGHT }}>Sobre os testes A/B</span></span>
          <span style={T(12, MUTED)}>{t >= 88 ? 'Ativado' : 'Desativado'}</span><Toggle on={t >= 88} />
        </div>
      </Section>
    </div>
    <div style={{ position: 'absolute', left: SIDE_X, top: CONTENT_TOP + 18, width: SIDE_W }}>
      <Summary title={TREE[0].label} />
      <SideCard><b style={T(13, INK, 700)}>Recomendações da campanha</b><div style={{ ...T(12, BRIGHT, 500), marginTop: 10 }}>+ Campanha de vendas Advantage+</div><div style={{ ...T(11.5, MUTED), marginTop: 6 }}>Use IA para encontrar mais compradores com menos configuração.</div></SideCard>
      <SideCard><b style={T(13, INK, 700)}>Controles da conta</b><div style={{ ...T(12, MUTED), marginTop: 8 }}>Nenhum definido</div></SideCard>
    </div>
  </>
}

function AdSetEditor({ f }: { f: number }) {
  const t0 = PH.adset
  const g = Math.min(1, Math.max(0, (f - t0 - 60) / 40))
  return <>
    <div style={{ position: 'absolute', left: FORM_X, top: CONTENT_TOP + 18, width: FORM_W }}>
      <Section title="Conversão">
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Label info>Local da conversão</Label><Input value="Site" f={f} at={t0 + 4} select /></div>
          <div style={{ flex: 1 }}><Label>Pixel</Label><Input value="nutrigomas · Pixel" f={f} at={t0 + 10} select /></div>
          <div style={{ flex: 1 }}><Label>Evento de conversão</Label><Input value="Compra" f={f} at={t0 + 22} select /></div>
        </div>
      </Section>
      <Section title="Orçamento e programação">
        <div style={{ ...T(12, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }) }}>A campanha distribui automaticamente o orçamento diário de R$ 300,00 entre os conjuntos para gerar o melhor desempenho. <span style={{ color: BRIGHT }}>Sobre os gastos</span></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}><Label>Data de início</Label><Input value="11 de nov. de 2026" f={f} at={t0 + 32} /></div>
          <div style={{ width: 140 }}><Label>&nbsp;</Label><Input value="00:00" f={f} at={t0 + 42} /></div>
        </div>
      </Section>
      <Section title="Público" link="✦ Advantage+ ativado">
        <Label>Localizações</Label><Input value="Brasil" f={f} at={t0 + 50} />
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <div style={{ flex: 1 }}><Label>Idade</Label><Input value="25 – 44" f={f} at={t0 + 60} select /></div>
          <div style={{ flex: 1 }}><Label>Gênero</Label><Input value="Todos os gêneros" f={f} at={t0 + 66} select /></div>
        </div>
        <div style={{ marginTop: 10 }}><Label>Excluir estes públicos personalizados</Label><Input value="Compradores · 180 dias" f={f} at={t0 + 76} placeholder="Pesquisar públicos existentes" /></div>
        <div style={{ ...T(11.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 6 }}>Podemos alcançar pessoas além dessas configurações quando houver probabilidade de melhorar o desempenho.</div>
      </Section>
    </div>
    <div style={{ position: 'absolute', left: SIDE_X, top: CONTENT_TOP + 18, width: SIDE_W }}>
      <Summary title={TREE[1].label} />
      <SideCard>
        <b style={T(13, INK, 700)}>Tamanho estimado do público</b>
        <div style={{ ...T(22, INK, 700), marginTop: 8 }}>{(18.4 + g * 9.7).toFixed(1).replace('.', ',')} mi – {(21.6 + g * 11.4).toFixed(1).replace('.', ',')} mi</div>
        <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #f02849, #f7b928, #31a24c)', marginTop: 10, position: 'relative' }}><i style={{ position: 'absolute', top: -4, left: `${42 + g * 18}%`, width: 4, height: 16, borderRadius: 2, background: INK }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', ...T(11, MUTED), marginTop: 6 }}><span>Específico</span><span>Amplo</span></div>
        <div style={{ ...T(11.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 10 }}>As estimativas podem variar muito ao longo do tempo com base nas suas seleções e nos dados disponíveis.</div>
      </SideCard>
      <SideCard><b style={T(13, INK, 700)}>Resultados diários estimados</b><div style={{ ...T(12, MUTED), marginTop: 8 }}>Compras: 12 – 34</div></SideCard>
    </div>
  </>
}

const AD_COPY = [
  ['Gomas de vitaminas que dá vontade de tomar todo dia. Mais de 20 vitaminas e minerais, sem açúcar e com sabor de fruta de verdade.', 'Saúde nunca foi tão gostosa', 'Até 35% OFF + frete grátis'],
  ['4 benefícios em 1 goma por dia: imunidade, energia, pele e foco. Experimente por 30 dias.', '4 benefícios, 1 goma', 'Garantia de 30 dias'],
  ['“Eu nunca lembrava de tomar vitamina. Agora é a parte favorita da minha manhã.”', 'A rotina mais fácil do dia', 'Frete grátis no 1º pedido'],
] as const
function AdEditor({ f, sel }: { f: number; sel: number }) {
  const burst = f >= PH.burst
  const k = burst ? sel % 3 : 0
  // In the burst each ad is shown already filled in (as it was saved), right after the selection jumps to it.
  const t0 = burst ? PH.burst + Math.floor((f - PH.burst) / 8) * 8 - 200 : PH.ad
  const [text, headline, desc] = AD_COPY[k]
  const media = [t0 + 20, t0 + 26, t0 + 32]
  const shown = f >= t0 + 34
  return <>
    <div style={{ position: 'absolute', left: FORM_X, top: CONTENT_TOP + 18, width: FORM_W }}>
      <Section title="Identidade">
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Label>Página</Label><Input value="nutri gomas" f={f} at={t0 + 2} select /></div>
          <div style={{ flex: 1 }}><Label>Perfil do Instagram</Label><Input value="@nutrigomas" f={f} at={t0 + 8} select /></div>
        </div>
      </Section>
      <Section title="Criativo do anúncio">
        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>{[['Imagem ou vídeo único', true], ['Carrossel', false]].map(([l, on]) => <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12, INK) }}><Radio on={on as boolean} />{l as string}</span>)}</div>
        <Label>Mídia</Label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {media.map((at, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 70, height: 70, borderRadius: 6, border: f >= at ? '1px solid transparent' : `1px dashed ${LINE}`, display: 'grid', placeItems: 'center', ...T(18, '#bcc0c4') }}>{f >= at ? <div style={{ transform: `scale(${out(f, at, at + 6)})` }}><Creative w={70} h={70} variant={(i + k) % 3} /></div> : '+'}</div>
            <span style={T(10.5, MUTED)}>{['9:16', '4:5', '1:1'][i]}</span>
          </div>)}
          <span style={{ marginLeft: 8, ...T(12, BRIGHT, 500) }}>Editar mídia ▾</span>
        </div>
        <div style={{ marginTop: 12 }}><Label info>Texto principal</Label><Input value={text} f={f} at={t0 + 40} multiline h={52} /></div>
        <div style={{ marginTop: 10 }}><Label info>Título</Label><Input value={headline} f={f} at={t0 + 70} /></div>
        <div style={{ marginTop: 10 }}><Label info>Descrição</Label><Input value={desc} f={f} at={t0 + 84} /></div>
        <div style={{ marginTop: 10, width: 260 }}><Label>Chamada para ação</Label><Input value="Comprar agora" f={f} at={t0 + 96} select /></div>
      </Section>
      <Section title="Destino">
        <Label>URL do site</Label><Input value="https://nutrigomas.com.br/oferta-primeiro-pedido" f={f} at={t0 + 104} />
        <div style={{ marginTop: 10 }}><Label info>Parâmetros de URL</Label><Input value={`utm_source=ads&utm_medium=pago&utm_campaign=c0${(sel % 5) + 1}`} f={f} at={t0 + 116} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}><span style={T(12, BRIGHT, 500)}>Criar um parâmetro de URL</span><span style={{ marginLeft: 'auto', ...T(10.5, '#8a6d00', 700), padding: '1px 6px', borderRadius: 4, background: '#fff3c4' }}>UTM</span></div>
      </Section>
    </div>
    <div style={{ position: 'absolute', left: SIDE_X, top: CONTENT_TOP + 18, width: SIDE_W }}>
      <SideCard style={{ minHeight: 760 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Toggle on /><b style={T(13, INK, 700)}>Prévia do anúncio</b><span style={{ marginLeft: 'auto', ...T(12, BRIGHT, 500), padding: '4px 10px', borderRadius: 6, border: `1px solid ${LINE}` }}>Revisar padrões</span></div>
        <div style={{ display: 'flex', gap: 18, marginTop: 16, justifyContent: 'center' }}>
          {/* Feed */}
          <div style={{ width: 300, borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .1)', overflow: 'hidden', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10 }}><i style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} /><div><b style={T(12, INK, 700)}>nutri gomas</b><div style={T(10.5, MUTED)}>Patrocinado</div></div></div>
            <div style={{ ...T(11.5, INK, 400, { whiteSpace: 'normal', lineHeight: 1.35 }), padding: '0 10px 8px', height: 50, overflow: 'hidden' }}>{f >= t0 + 40 ? typed(text, f, t0 + 40) : ''}</div>
            <div style={{ opacity: shown ? out(f, t0 + 34, t0 + 42) : 0.06 }}><Creative w={300} h={300} variant={k} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0f2f5' }}>
              <div style={{ minWidth: 0 }}><div style={T(10, MUTED)}>NUTRIGOMAS.COM.BR</div><b style={{ ...T(12, INK, 700), display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typed(headline, f, t0 + 70)}</b></div>
              <span style={{ marginLeft: 'auto', ...T(11, INK, 700), padding: '6px 10px', borderRadius: 6, background: '#e4e6eb' }}>{f >= t0 + 96 ? 'Comprar agora' : 'Saiba mais'}</span>
            </div>
          </div>
          {/* Reels */}
          <div style={{ width: 250, height: 444, borderRadius: 10, overflow: 'hidden', background: '#000', position: 'relative' }}>
            <div style={{ opacity: shown ? out(f, t0 + 40, t0 + 48) : 0.08 }}><Creative w={250} h={444} variant={(k + 1) % 3} /></div>
            <div style={{ position: 'absolute', left: 10, bottom: 46, display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)', border: '1.5px solid #fff' }} /><b style={T(11, '#fff', 700)}>nutrigomas</b><span style={T(10, '#fff')}>· Patrocinado</span></div>
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: '6px 0', borderRadius: 6, background: 'rgb(255 255 255 / .9)', textAlign: 'center', ...T(11, INK, 700) }}>{f >= t0 + 96 ? 'Comprar agora' : 'Saiba mais'} ›</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>{[0, 1, 2, 3].map(i => <i key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? BRIGHT : '#ccd0d5' }} />)}</div>
        <div style={{ ...T(11, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 12 }}>A renderização e a interação do anúncio podem variar de acordo com o dispositivo, o formato e outros fatores.</div>
      </SideCard>
    </div>
  </>
}

function Editor({ f }: { f: number }) {
  const sel = selectedAt(f)
  const kind = TREE[sel].kind
  return <>
    <Rail />
    <Tree f={f} sel={sel} />
    <Header f={f} sel={sel} />
    <div style={{ position: 'absolute', left: MAIN_X, right: 0, top: CONTENT_TOP, bottom: 52, background: BG }} />
    {kind === 'campaign' && <CampaignEditor f={f} />}
    {kind === 'adset' && <AdSetEditor f={f} />}
    {kind === 'ad' && <AdEditor f={f} sel={sel} />}
    <Footer f={f} />
  </>
}

// ---------- tables ----------

type Tag = [string, string]
const TAGS: Record<string, Tag> = { test: ['Testando', '#f7b928'], scale: ['Escala', '#31a24c'], rt: ['Retargeting', '#5b72f2'], ret: ['Retenção', '#0ea5a4'] }
const CAMPAIGN_ROWS: { name: string; tag: Tag; bid: string; budget: string }[] = [
  { name: 'TESTE · CBO · CONCEITOS · S45', tag: TAGS.test, bid: 'Maior volume', budget: 'R$ 300,00' },
  { name: 'ESCALA · ADV+ · VENDAS · VENCEDORES', tag: TAGS.scale, bid: 'Maior volume', budget: 'R$ 3.000,00' },
  { name: 'ESCALA · CBO · AMPLO · BR', tag: TAGS.scale, bid: 'Meta de custo por resultado', budget: 'R$ 1.500,00' },
  { name: 'RT · CBO · PÚBLICOS QUENTES', tag: TAGS.rt, bid: 'Maior volume', budget: 'R$ 600,00' },
  { name: 'RETENÇÃO · COMPRADORES', tag: TAGS.ret, bid: 'Maior volume', budget: 'R$ 400,00' },
]
const ADSET_ROWS: { name: string; tag: Tag }[] = [
  ['C05 · AMIGOS · DOCE · AMPLO', TAGS.test], ['C06 · DIAS CORRIDOS · 60 FIBRAS', TAGS.test], ['ADV+ · VENCEDORES · POST ID', TAGS.scale], ['AMPLO · BR · 25–54', TAGS.scale], ['AMPLO · MULHERES · 25–44', TAGS.scale],
  ['VISITANTES DO SITE · 30D', TAGS.rt], ['ADICIONOU AO CARRINHO · 14D', TAGS.rt], ['ENVOLVIMENTO IG + FB · 60D', TAGS.rt], ['COMPRADORES · 180D', TAGS.ret],
].map(([n, t]) => ({ name: n as string, tag: t as Tag }))
const AD_ROWS = ['C05 · AMIGOS · DOCE · V3', 'C06 · DIAS CORRIDOS · V1', 'C06 · DIAS CORRIDOS · V2', 'C06 · DIAS CORRIDOS · V3', 'VENCEDOR · 4 BENEFÍCIOS · POST', 'VENCEDOR · TESTE DE SABOR · POST', 'AMPLO · 4 BENEFÍCIOS · V1', 'AMPLO · HISTÓRIA REAL · V2', 'RT · DEPOIMENTO · V1']
const RESULTS: [string, string, string, string][] = [
  ['R$ 1.512,40', '38', 'R$ 39,80', '2,31'], ['R$ 14.870,10', '412', 'R$ 36,09', '2,78'], ['R$ 7.210,55', '186', 'R$ 38,77', '2,54'], ['R$ 2.940,30', '121', 'R$ 24,30', '3,92'], ['R$ 1.988,00', '97', 'R$ 20,49', '4,47'],
]
const countUp = (v: string, p: number) => {
  const n = Number(v.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
  const x = n * p, money = v.startsWith('R$'), dec = v.includes(',') && !money
  return money ? `R$ ${x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : dec ? x.toFixed(2).replace('.', ',') : String(Math.round(x))
}
const reviewCount = (f: number) => f < PH.table ? Math.min(39, TREE.filter(n => f >= n.at).length + 18) : Math.min(41, 39 + Math.floor(interpolate(f, [600, 640], [0, 2.99], clamp)))

const COLS: [string, number, 'l' | 'r'][] = [['Desativ./Ativ.', 96, 'l'], ['Campanha', 520, 'l'], ['Veiculação', 150, 'l'], ['Estratégia de lance', 210, 'l'], ['Orçamento', 160, 'r'], ['Valor usado', 140, 'r'], ['Compras', 120, 'r'], ['Custo por compra', 150, 'r'], ['ROAS de compras', 150, 'r']]
function Tables({ f, mode = 'build', raw = 0 }: { f: number; mode?: 'empty' | 'build' | 'published'; raw?: number }) {
  const tab = mode !== 'build' || f < TABLE_TAB.adsets ? 0 : f < TABLE_TAB.ads ? 1 : 2
  const start = [TABLE_TAB.campaigns, TABLE_TAB.adsets, TABLE_TAB.ads][tab]
  const title = ['Campanhas', 'Conjuntos de anúncios', 'Anúncios'][tab]
  const nameCol = ['Campanha', 'Conjunto de anúncios', 'Anúncio'][tab]
  const rows = mode === 'empty' ? [] : tab === 0 ? CAMPAIGN_ROWS.map(r => ({ ...r, thumb: -1 })) : tab === 1 ? ADSET_ROWS.map(r => ({ ...r, bid: 'Usando o lance da campanha', budget: 'Usando orç. da campanha', thumb: -1 })) : AD_ROWS.map((n, i) => ({ name: n, tag: undefined as Tag | undefined, bid: 'Usando lance do conjunto', budget: 'Usando orç. da campanha', thumb: i }))
  const n = reviewCount(f)
  const res = mode === 'published' ? out(raw, REVIEW.results + 6, REVIEW.results + 50) : 0
  return <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, bottom: 0, background: BG, opacity: mode === 'build' ? out(f, PH.table, PH.table + 10) : 1 }}>
    <div style={{ height: 56, background: '#fff', borderBottom: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
      <b style={T(20, INK, 700)}>{title}</b>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: BG, ...T(12.5, INK, 500) }}><i style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} />nutri gomas · BR (8124003179) <Icon d={I.down} size={11} /></span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12.5, INK) }}><i style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${GREEN}`, borderRightColor: HAIR }} />Pontuação de oportunidade</span>
      <span style={{ marginLeft: 'auto', ...T(12.5, MUTED) }}>Atualizado agora</span><Icon d={I.refresh} size={13} />
      <span style={{ ...T(12.5, INK, 500), padding: '6px 12px', borderRadius: 6, border: `1px solid ${LINE}`, background: '#fff' }}>✕ Descartar rascunhos</span>
      <span style={{ ...T(12.5, '#fff', 700), padding: '7px 14px', borderRadius: 6, background: BRIGHT, transform: `scale(${mode === 'build' && f % 30 < 4 ? 1.05 : 1})`, opacity: mode === 'build' ? 1 : 0.55 }}>Revisar e publicar{mode === 'build' ? ` (${n})` : ''}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
      {['Todos os anúncios', 'Anúncios ativos', 'Tiveram veiculação', 'Ações'].map((t, i) => <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12.5, i === 0 ? BRIGHT : INK, 500), padding: '6px 12px', borderRadius: 6, background: i === 0 ? SEL : '#fff', boxShadow: '0 0 0 1px rgb(0 0 0 / .08)' }}>{t}</span>)}
      <span style={T(12.5, MUTED)}>+ Mais</span>
      <span style={{ marginLeft: 'auto', ...T(12.5, BRIGHT, 500) }}>Criar uma visualização</span>
    </div>
    <div style={{ margin: '0 20px', height: 34, borderRadius: 6, background: '#fff', boxShadow: '0 0 0 1px rgb(0 0 0 / .08)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', ...T(12.5, '#8a8d91') }}><Icon d={I.search} size={12} />Descreva o que você está procurando</div>
    <div style={{ margin: '12px 20px 0', background: '#fff', borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .08)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${HAIR}` }}>
        {[[I.folder, 'Campanhas'], [I.grid, 'Conjuntos de anúncios'], [I.ad, 'Anúncios']].map(([d, l], i) => <div key={l} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: i === tab ? `3px solid ${BRIGHT}` : '3px solid transparent', ...T(13.5, i === tab ? BRIGHT : INK, i === tab ? 700 : 500) }}><Icon d={d} size={14} color={i === tab ? BRIGHT : MUTED} />{l}{i === tab && <span style={{ ...T(11, '#fff', 700), padding: '1px 7px', borderRadius: 999, background: BRIGHT }}>{rows.length} selecionados</span>}</div>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${HAIR}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12.5, '#fff', 700), padding: '6px 12px', borderRadius: 6, background: GREEN }}><Icon d={I.plus} size={12} color="#fff" w={2} />Criar</span>
        {[[I.copy, 'Duplicar'], [I.pencil, 'Editar'], [I.chart, 'Analisar'], [I.flask, 'Teste A/B']].map(([d, l]) => <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(12.5, INK, 500), padding: '6px 12px', borderRadius: 6, border: `1px solid ${LINE}` }}><Icon d={d} size={12} />{l}</span>)}
        <span style={T(12.5, MUTED)}>Mais ▾</span>
        <span style={{ marginLeft: 'auto', ...T(12.5, INK) }}>{mode === 'published' ? 'Últimos 7 dias: 11 – 17 de nov. de 2026 ▾' : 'Hoje: 10 de nov. de 2026 ▾'}</span>
        <span style={{ ...T(12.5, INK, 500), padding: '6px 10px', borderRadius: 6, border: `1px solid ${LINE}` }}>Colunas ▾</span>
        <span style={{ ...T(12.5, INK, 500), padding: '6px 10px', borderRadius: 6, border: `1px solid ${LINE}` }}>Detalhamento ▾</span>
        <span style={{ ...T(12.5, INK, 500), padding: '6px 10px', borderRadius: 6, border: `1px solid ${LINE}` }}>Agrupamento ▾</span>
      </div>
      <div style={{ display: 'flex', height: 40, alignItems: 'center', borderBottom: `1px solid ${HAIR}`, background: '#fafbfc' }}>
        {COLS.map(([c, w, al], i) => <div key={c} style={{ width: w, flex: 'none', padding: '0 12px', textAlign: al === 'r' ? 'right' : 'left', ...T(12, INK, 700) }}>{i === 1 ? nameCol : c}{i > 0 && <span style={{ color: '#bcc0c4', marginLeft: 4 }}>↕</span>}</div>)}
      </div>
      {rows.map((r, i) => {
        const at = start + 6 + i * 5
        if (mode === 'build' && f < at) return null
        const p = mode === 'build' ? out(f, at, at + 8) : 1, fresh = mode === 'build' && f - at < 12
        const live = mode === 'published'
        return <div key={r.name} style={{ display: 'flex', height: 50, alignItems: 'center', borderBottom: `1px solid ${HAIR}`, background: fresh ? '#fff8e1' : '#fff', opacity: p, transform: `translateY(${(1 - p) * -8}px)` }}>
          <div style={{ width: 96, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}><i style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${live ? '#bcc0c4' : BRIGHT}`, background: live ? '#fff' : BRIGHT }} /><Toggle on={live} /></div>
          <div style={{ width: 520, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            {r.thumb >= 0 && <Creative w={34} h={34} variant={r.thumb} />}
            <span style={{ ...T(13, BLUE, 500), overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
            {r.tag && <span style={{ ...T(11, '#1c1e21', 700), padding: '2px 8px', borderRadius: 999, background: `${r.tag[1]}40`, flex: 'none' }}>{r.tag[0]}</span>}
          </div>
          <div style={{ width: 150, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, ...T(12.5, live ? INK : MUTED) }}>{live ? <><i style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />Ativa</> : <><Icon d={I.pencil} size={11} />Em rascunho</>}</div>
          <div style={{ width: 210, padding: '0 12px', ...T(12.5, INK) }}>{r.bid}</div>
          <div style={{ width: 160, padding: '0 12px', textAlign: 'right', ...T(12.5, INK) }}>{r.budget}{tab === 0 && <div style={T(11, MUTED)}>Diário</div>}</div>
          {(live ? RESULTS[i].map(v => countUp(v, res)) : ['R$ 0,00', '—', '—', '—']).map((v, k) => <div key={k} style={{ width: [140, 120, 150, 150][k], padding: '0 12px', textAlign: 'right', ...T(12.5, live ? INK : MUTED, live ? 500 : 400) }}>{v}{live && k === 2 && <div style={T(11, MUTED)}>Por compra</div>}</div>)}
        </div>
      })}
      <div style={{ display: 'flex', alignItems: 'center', height: 52 }}>
        <div style={{ width: 96 + 520 + 150 + 210 + 160, display: 'flex', alignItems: 'center', gap: 6, padding: '0 108px', ...T(12.5, INK, 700) }}>Resultados de {rows.length} {['campanhas', 'conjuntos de anúncios', 'anúncios'][tab]}<Icon d={I.info} size={12} /></div>
        {mode === 'published' && [['R$ 28.521,35', 'Total usado'], ['854', 'Total'], ['R$ 33,40', 'Por compra'], ['2,89', 'Média']].map(([v, l], k) => <div key={l} style={{ width: [140, 120, 150, 150][k], padding: '0 12px', textAlign: 'right' }}><div style={T(13, INK, 700)}>{countUp(v, res)}</div><div style={T(11, MUTED)}>{l}</div></div>)}
      </div>
    </div>
  </div>
}

// ---------- dialogs ----------

const OBJECTIVES = ['Reconhecimento', 'Tráfego', 'Engajamento', 'Cadastros', 'Promoção do app', 'Vendas']
function CreateCampaignModal({ f }: { f: number }) {
  if (f < 6 || f >= INTRO_END + 4) return null
  const a = out(f, 6, 16) * (1 - ease(f, INTRO_END - 6, INTRO_END + 4))
  const chosen = f >= 36
  return <div style={{ position: 'absolute', inset: 0, top: TOP, background: `rgb(0 0 0 / ${0.35 * a})`, zIndex: 40, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: 760, background: '#fff', borderRadius: 10, boxShadow: '0 20px 60px rgb(0 0 0 / .3)', opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 18px', borderBottom: `1px solid ${HAIR}` }}>
        <span style={{ ...T(13, BRIGHT, 700), padding: '5px 10px', borderRadius: 6, background: SEL }}>Criar nova campanha</span><span style={{ ...T(13, MUTED, 500), padding: '5px 10px' }}>Novo conjunto ou anúncio</span>
        <span style={{ marginLeft: 'auto' }}><Icon d={I.x} size={14} /></span>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <Label info>Escolha um tipo de compra</Label>
        <div style={{ width: 320 }}><Input value="Leilão" f={f} at={14} select /></div>
        <b style={{ ...T(14, INK, 700), display: 'block', margin: '18px 0 10px' }}>Escolha um objetivo da campanha</b>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ width: 300 }}>{OBJECTIVES.map((o, i) => {
            const on = chosen && i === 5
            return <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 42, padding: '0 10px', borderRadius: 6, background: on ? SEL : 'transparent' }}><Radio on={on} /><span style={{ width: 28, height: 28, borderRadius: 6, background: BG, display: 'grid', placeItems: 'center' }}><Icon d={[I.eye, I.chev, I.people, I.ad, I.grid, I.folder][i]} size={14} /></span><span style={T(13.5, INK, on ? 700 : 400)}>{o}</span></div>
          })}</div>
          <div style={{ flex: 1, padding: 14, borderRadius: 8, background: '#fafbfc', opacity: chosen ? 1 : 0.5 }}>
            {chosen ? <><b style={T(14, INK, 700)}>Vendas</b><div style={{ ...T(12.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }), marginTop: 6 }}>Encontre pessoas com probabilidade de comprar seu produto ou serviço.</div>
              <b style={{ ...T(12.5, INK, 700), display: 'block', marginTop: 12 }}>Indicado para:</b>
              {['Conversões', 'Vendas do catálogo', 'Messenger, Instagram e WhatsApp', 'Ligações'].map(x => <div key={x} style={{ ...T(12.5, MUTED), marginTop: 4 }}>{x}</div>)}</>
              : <div style={T(12.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 })}>O objetivo da campanha é o resultado que você quer gerar com os anúncios.</div>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderTop: `1px solid ${HAIR}` }}>
        <span style={T(12, BRIGHT, 500)}>Sobre os objetivos da campanha</span>
        <span style={{ marginLeft: 'auto', ...T(13, INK, 500), padding: '6px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Cancelar</span>
        <span style={{ ...T(13, '#fff', 700), padding: '7px 16px', borderRadius: 6, background: chosen ? BRIGHT : '#a4c8f7', transform: `scale(${f >= 54 && f < 60 ? 0.95 : 1})` }}>Continuar</span>
      </div>
    </div>
  </div>
}

function ReviewDraftsModal({ f }: { f: number }) {
  if (f < REVIEW.open || f >= REVIEW.results + 6) return null
  const a = out(f, REVIEW.open, REVIEW.open + 10) * (1 - ease(f, REVIEW.results - 4, REVIEW.results + 6))
  const publishing = f >= REVIEW.publish
  return <div style={{ position: 'absolute', inset: 0, top: TOP, background: `rgb(0 0 0 / ${0.35 * a})`, zIndex: 40, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: 860, background: '#fff', borderRadius: 10, boxShadow: '0 20px 60px rgb(0 0 0 / .3)', opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${HAIR}` }}><b style={T(16, INK, 700)}>Revisar itens de rascunho</b><span style={{ marginLeft: 'auto' }}><Icon d={I.x} size={14} /></span></div>
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px 0' }}>
        {[[I.folder, 'Campanhas', 5], [I.grid, 'Conjuntos de anúncios', 14], [I.ad, 'Anúncios', 22]].map(([d, l, n], i) => <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: i === 0 ? SEL : 'transparent', ...T(12.5, i === 0 ? BRIGHT : INK, 500) }}><Icon d={d as string} size={12} color={i === 0 ? BRIGHT : MUTED} />{l as string} · {n as number}</span>)}
      </div>
      <div style={{ margin: '12px 20px', border: `1px solid ${HAIR}`, borderRadius: 6 }}>
        <div style={{ display: 'flex', padding: '8px 12px', background: '#fafbfc', borderBottom: `1px solid ${HAIR}`, ...T(12, INK, 700) }}><span style={{ width: 30 }} /><span style={{ flex: 1 }}>Nome da campanha</span><span style={{ width: 120 }}>Alteração</span><span style={{ width: 80 }}>Erros</span></div>
        {CAMPAIGN_ROWS.map((r, i) => <div key={r.name} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderBottom: i < 4 ? `1px solid ${HAIR}` : 'none', ...T(12.5, INK) }}>
          <span style={{ width: 30 }}><i style={{ display: 'grid', placeItems: 'center', width: 14, height: 14, borderRadius: 3, background: BRIGHT, color: '#fff', fontSize: 10 }}>✓</i></span>
          <span style={{ flex: 1 }}>{r.name}</span><span style={{ width: 120, color: MUTED }}>Novo</span><span style={{ width: 80, color: MUTED }}>—</span>
        </div>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderTop: `1px solid ${HAIR}` }}>
        <span style={{ ...T(11.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), maxWidth: 520 }}>Ao clicar em Publicar, você confirma que o uso das ferramentas de anúncios segue os Termos e Condições.</span>
        <span style={{ marginLeft: 'auto', ...T(13, INK, 500), padding: '6px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Cancelar</span>
        <span style={{ ...T(13, '#fff', 700), padding: '7px 18px', borderRadius: 6, background: GREEN, transform: `scale(${f >= REVIEW.publish && f < REVIEW.publish + 6 ? 0.95 : 1})` }}>{publishing ? 'Publicando…' : 'Publicar'}</span>
      </div>
    </div>
  </div>
}

// ---------- agents' cursors ----------

const ROLES: [string, string][] = [['Testando', '#f7b928'], ['Escala', '#31a24c'], ['Retargeting', '#5b72f2'], ['Criativo', '#e4405f'], ['Texto', '#a259ff'], ['Orçamento', '#0ea5a4'], ['Público', '#ff7a00'], ['Rastreamento', '#3b82f6']]
const FX = FORM_X, SX = SIDE_X, CY = CONTENT_TOP + 18
const TARGETS: [number, number, number][] = [
  // campaign
  [FX + 150, CY + 60, 6], [FX + 470, CY + 60, 12], [FX + 100, CY + 210, 34], [FX + 90, CY + 330, 46], [FX + 380, CY + 330, 52], [FX + 300, CY + 405, 70], [FX + 590, CY + 520, 88], [SX + 200, CY + 160, 96], [150, TOP + 74, 10], [180, TOP + 104, 110], [FX + 200, CY + 220, 120], [SX + 120, CY + 60, 130],
  // ad set
  [210, TOP + 104, 150], [FX + 100, CY + 60, 154], [FX + 320, CY + 60, 160], [FX + 540, CY + 60, 172], [FX + 150, CY + 180, 182], [FX + 560, CY + 180, 192], [FX + 200, CY + 270, 200], [FX + 120, CY + 330, 210], [FX + 420, CY + 330, 216], [FX + 280, CY + 390, 226], [SX + 260, CY + 160, 220], [240, TOP + 134, 236],
  // ad
  [230, TOP + 134, 250], [FX + 150, CY + 60, 252], [FX + 460, CY + 60, 258], [FX + 40, CY + 185, 270], [FX + 120, CY + 185, 276], [FX + 200, CY + 185, 282], [FX + 300, CY + 255, 290], [SX + 150, CY + 200, 296], [FX + 250, CY + 330, 320], [SX + 560, CY + 260, 324], [FX + 300, CY + 385, 334], [FX + 130, CY + 445, 346], [FX + 300, CY + 520, 354], [FX + 360, CY + 580, 366], [FX + 600, CY + 610, 378], [SX + 700, CY + 18, 386], [250, TOP + 164, 280], [250, TOP + 194, 310],
  // burst
  [220, TOP + 220, 404], [FX + 200, CY + 255, 410], [SX + 300, CY + 300, 416], [220, TOP + 280, 424], [FX + 300, CY + 330, 430], [FX + 200, CY + 520, 438], [220, TOP + 370, 444], [SX + 600, CY + 260, 450], [FX + 120, CY + 185, 456], [220, TOP + 460, 462], [MAIN_X + 60, 1052, 472],
  // tables
  [1700, TOP + 28, 486], [420, TOP + 290, 494], [700, TOP + 340, 506], [560, TOP + 196, 540], [380, TOP + 290, 552], [800, TOP + 390, 566], [900, TOP + 196, 596], [420, TOP + 290, 606], [700, TOP + 430, 620], [1720, TOP + 28, 640], [600, TOP + 520, 650],
]
const EXTRA: [number, number, number][] = [
  // the create dialog
  [960, 300, 10], [700, 270, 16], [620, 640, 30], [640, 690, 36], [900, 520, 44], [1290, 820, 56],
  // review drafts and results
  [1700, TOP + 28, 566], [600, 520, 584], [900, 560, 596], [700, 600, 606], [1260, 760, 618], [1100, 560, 650], [800, 620, 668], [1300, 520, 690], [500, 700, 706],
]
const routes: { f: number; x: number; y: number }[][] = ROLES.map(() => [])
;[...TARGETS.map(([x, y, fr]) => [x, y, Math.round(realFrame(fr))] as [number, number, number]), ...EXTRA].forEach(([x, y, fr], i) => routes[i % ROLES.length].push({ f: fr, x: x + (random('jx' + i) - 0.5) * 20, y: y + (random('jy' + i) - 0.5) * 6 }))
routes.forEach(r => r.sort((a, b) => a.f - b.f))

function Cursor({ a, f }: { a: number; f: number }) {
  const r = routes[a]
  if (!r.length || f < r[0].f - 12) return null
  let k = 0
  while (k + 1 < r.length && r[k + 1].f - 10 <= f) k++
  const cur = r[k], next = r[k + 1]
  let x = cur.x, y = cur.y
  if (next) { const p = ease(f, next.f - 10, next.f); x += (next.x - cur.x) * p; y += (next.y - cur.y) * p }
  x += Math.sin((f + a * 13) / 10) * 2.5; y += Math.cos((f + a * 7) / 12) * 2
  const click = f >= cur.f && f < cur.f + 8 ? 1 - (f - cur.f) / 8 : 0
  const [name, color] = ROLES[a]
  return <div style={{ position: 'absolute', left: x, top: y, zIndex: 80, opacity: out(f, r[0].f - 12, r[0].f - 4) }}>
    {click > 0 && <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={16} height={18} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' }}><path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill="#1c1e21" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" /></svg>
    <span style={{ position: 'absolute', left: 12, top: 14, padding: '1px 7px', borderRadius: 999, background: color, ...T(10.5, '#fff', 700) }}>{name}</span>
  </div>
}

export function AdsAgentsCampaignBuild() {
  const f = useCurrentFrame()
  const b = buildFrame(f)
  const toEditor = ease(f, INTRO_END - 6, INTRO_END + 4)
  const toTable = ease(b, PH.table - 6, PH.table + 6)
  const published = f >= REVIEW.results
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, opacity: out(f, 0, 8) }}>
      <Browser f={f} />
      {f < INTRO_END + 4 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - toEditor }}><Tables f={0} mode="empty" /></div>}
      {f >= INTRO_END - 6 && b < PH.table + 6 && <div style={{ position: 'absolute', inset: 0, opacity: toEditor * (1 - toTable) }}><Editor f={b} /></div>}
      {b >= PH.table - 6 && !published && <Tables f={Math.min(b, 640)} />}
      {published && <Tables f={640} mode="published" raw={f} />}
      <CreateCampaignModal f={f} />
      <ReviewDraftsModal f={f} />
      {ROLES.map((_, a) => <Cursor key={a} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}
