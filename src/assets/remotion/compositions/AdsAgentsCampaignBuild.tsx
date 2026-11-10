import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'

// "Agentes montando anúncios": a light ads manager in the browser, operated by several AI agents at once. They fill
// the campaign (budget, bid strategy, A/B test), the ad set (conversion, schedule, audience) and the ad (identity,
// media, copy, CTA, URL with UTM, live preview), the campaign tree on the left grows, then the editor closes and the
// campaigns, ad sets and ads tables fill with drafts while "Revisar e publicar (n)" counts up.
// 1920×1080, 30 fps, 20 s. Brand, product and numbers are made up; no third-party logos.

export const ADS_AGENTS_BUILD_DURATION = 600
const UI = loadInter('normal', { subsets: ['latin'], weights: ['400', '500', '600', '700'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const BG = '#f0f2f5', WHITE = '#fff', INK = '#1c2b33', MUTED = '#65676b', LINE = '#dadde1', BLUE = '#0866ff', GREEN = '#00a400', SOFT = '#f5f6f7'

// ---------- agents ----------
const ROLES = [
  { name: 'Teste', color: '#f7b928' }, { name: 'Escala', color: '#31a24c' }, { name: 'Retargeting', color: '#5b72f2' }, { name: 'Criativo', color: '#e4405f' },
  { name: 'Texto', color: '#a259ff' }, { name: 'Orçamento', color: '#0ea5a4' }, { name: 'Público', color: '#ff7a00' }, { name: 'Rastreamento', color: '#3b82f6' },
]

// ---------- timing ----------
const PH = { campaign: [20, 170], adset: [170, 300], ad: [300, 440], table: [440, 600] } as const
const TABLE_TABS = { campaigns: 446, adsets: 500, ads: 548 }

// ---------- campaign tree (made up) ----------
type Node = { label: string; depth: 0 | 1 | 2; at: number; tag?: [string, string] }
const CAMPAIGNS: [string, [string, string]][] = [
  ['TESTE · CBO · CONCEITOS · S45', ['Teste', '#f7b928']], ['ESCALA · ADV+ · VENDAS · VENCEDORES', ['Escala', '#31a24c']], ['ESCALA · CBO · AMPLO · BR', ['Escala', '#31a24c']],
  ['RT · CBO · PÚBLICOS QUENTES', ['Retargeting', '#5b72f2']], ['RETENÇÃO · COMPRADORES 180D', ['Retenção', '#0ea5a4']],
]
const ADSETS = ['C01 · TESTE DE SABOR · AMPLO', 'C02 · 4 BENEFÍCIOS · AMPLO', 'C03 · HISTÓRIA REAL · AMPLO', 'C04 · NA CORRERIA · AMPLO', 'C05 · AMIGOS · DOCE · AMPLO']
function buildTree(): Node[] {
  const out: Node[] = [{ label: CAMPAIGNS[0][0], depth: 0, at: 22, tag: CAMPAIGNS[0][1] }]
  ADSETS.forEach((s, i) => {
    out.push({ label: s, depth: 1, at: 60 + i * 70 })
    ;['V1', 'V2', 'V3'].forEach((v, k) => out.push({ label: `${s.split(' · ').slice(0, 2).join(' · ')} · ${v}`, depth: 2, at: 90 + i * 70 + k * 14 }))
  })
  CAMPAIGNS.slice(1).forEach(([c, tag], i) => out.push({ label: c, depth: 0, at: 330 + i * 26, tag }))
  return out
}
const TREE = buildTree()
const createdAt = (f: number) => TREE.filter(n => f >= n.at).length + (f >= 470 ? Math.floor(interpolate(f, [470, 580], [0, 18], clamp)) : 0)

// ---------- small pieces ----------

const text = (size: number, color = INK, weight = 400, extra?: CSSProperties): CSSProperties => ({ fontFamily: UI, fontSize: size, color, fontWeight: weight, whiteSpace: 'nowrap', ...extra })

/** Text typed in from `at` at `cps` chars per frame. */
function typed(value: string, f: number, at: number, cps = 1.4) {
  if (f < at) return ''
  return value.slice(0, Math.floor((f - at) * cps))
}

function Field({ label, value, f, at, w, select, hint }: { label?: string; value: string; f: number; at: number; w?: number | string; select?: boolean; hint?: string }) {
  const v = typed(value, f, at)
  const active = f >= at && v.length < value.length
  return <div style={{ width: w ?? '100%' }}>
    {label && <div style={{ ...text(13, INK, 600), marginBottom: 6 }}>{label}</div>}
    <div style={{ height: 36, borderRadius: 6, border: `1px solid ${active ? BLUE : '#ccd0d5'}`, boxShadow: active ? '0 0 0 2px rgb(8 102 255 / .18)' : 'none', background: WHITE, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
      <span style={text(13.5, INK)}>{v}{active && <span style={{ color: BLUE }}>|</span>}</span>
      {select && <span style={{ marginLeft: 'auto', ...text(12, MUTED) }}>▾</span>}
    </div>
    {hint && <div style={{ ...text(11.5, MUTED), marginTop: 5, whiteSpace: 'normal', lineHeight: 1.4 }}>{hint}</div>}
  </div>
}

function Card({ title, children, on = true, style }: { title: string; children: ReactNode; on?: boolean; style?: CSSProperties }) {
  return <div style={{ background: WHITE, borderRadius: 8, border: `1px solid ${LINE}`, boxShadow: '0 1px 2px rgb(0 0 0 / .06)', padding: '16px 18px', marginBottom: 12, opacity: on ? 1 : 0.35, ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <i style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${on ? BLUE : '#bcc0c4'}`, display: 'grid', placeItems: 'center' }}>{on && <i style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE }} />}</i>
      <b style={text(15, INK, 700)}>{title}</b>
    </div>
    {children}
  </div>
}

function Toggle({ on }: { on: boolean }) {
  return <span style={{ width: 38, height: 22, borderRadius: 11, background: on ? BLUE : '#bcc0c4', position: 'relative', display: 'inline-block' }}>
    <i style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: WHITE }} />
  </span>
}

/** The made-up product: a pouch of "Nutri Gomas" on a pastel background. */
function Creative({ w, h, variant = 0 }: { w: number; h: number; variant?: number }) {
  const bgs = ['linear-gradient(160deg, #ffe7c2, #ffd0a8)', 'linear-gradient(160deg, #d9f2e6, #b6e4cf)', 'linear-gradient(160deg, #e6e1ff, #cfc5ff)']
  const pw = w * 0.5, ph = h * 0.56
  return <div style={{ position: 'relative', width: w, height: h, borderRadius: Math.max(3, w * 0.04), overflow: 'hidden', background: bgs[variant % 3] }}>
    <div style={{ position: 'absolute', left: (w - pw) / 2, top: h * 0.2, width: pw, height: ph, borderRadius: `${pw * 0.12}px ${pw * 0.12}px ${pw * 0.08}px ${pw * 0.08}px`, background: 'linear-gradient(180deg, #7ac943, #4e9a2a)', boxShadow: '0 6px 14px rgb(0 0 0 / .18)', transform: `rotate(${variant % 2 ? -6 : 5}deg)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.18, textAlign: 'center', ...text(pw * 0.2, '#fff', 700, { letterSpacing: -0.5 }) }}>nutri</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.42, textAlign: 'center', ...text(pw * 0.13, '#eaffd8', 600) }}>gomas</div>
      {[0, 1, 2].map(k => <i key={k} style={{ position: 'absolute', left: pw * (0.22 + k * 0.2), top: ph * 0.68, width: pw * 0.15, height: pw * 0.15, borderRadius: '45%', background: ['#ff6b6b', '#ffd93d', '#ff9f43'][k] }} />)}
    </div>
    {w > 120 && <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, padding: '4px 8px', borderRadius: 6, background: 'rgb(255 255 255 / .9)', ...text(w * 0.055, INK, 600, { whiteSpace: 'normal', lineHeight: 1.25 }) }}>Vitaminas que dá vontade de tomar</div>}
  </div>
}

// ---------- layout ----------

function Browser({ f, count }: { f: number; count: number }) {
  const live = Math.min(24, Math.floor(interpolate(f, [4, 40], [0, 24], clamp)))
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 42, background: '#dee1e6', display: 'flex', alignItems: 'flex-end', padding: '0 12px', gap: 8 }}>
      <span style={{ display: 'flex', gap: 8, alignSelf: 'center', marginRight: 10 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}</span>
      <div style={{ height: 34, width: 300, borderRadius: '8px 8px 0 0', background: WHITE, display: 'flex', alignItems: 'center', padding: '0 14px', ...text(13, INK) }}>Gerenciador de Anúncios · Campanhas</div>
      <div style={{ height: 34, width: 220, display: 'flex', alignItems: 'center', padding: '0 14px', ...text(13, MUTED) }}>Agentes · {live} em execução</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 42, height: 40, background: WHITE, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
      <span style={text(16, MUTED)}>‹ ›</span>
      <div style={{ flex: 1, height: 28, borderRadius: 14, background: SOFT, display: 'flex', alignItems: 'center', padding: '0 14px', ...text(13, MUTED) }}>gerenciador-de-anuncios/campanhas?conta=8124003179</div>
      <span style={{ ...text(12.5, '#fff', 700), padding: '4px 10px', borderRadius: 999, background: '#1c1e21' }}>● {live} agentes</span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 82, height: 52, background: WHITE, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px' }}>
      <b style={text(18, INK, 700)}>Campanhas</b>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: SOFT, ...text(13.5, INK, 500) }}><i style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} />Nutri Gomas · BR (8124003179) ▾</span>
      <span style={{ ...text(13, MUTED), marginLeft: 'auto' }}>Atualizado agora</span>
      <span style={{ ...text(13.5, INK, 500), padding: '7px 12px', borderRadius: 6, border: `1px solid ${LINE}` }}>✕ Descartar rascunhos</span>
      <span style={{ ...text(13.5, '#fff', 600), padding: '8px 16px', borderRadius: 6, background: BLUE, transform: `scale(${1 + 0.06 * Math.max(0, 1 - ((f % 24) / 6)) * (count > 0 ? 1 : 0)})` }}>Revisar e publicar ({count})</span>
    </div>
    {/* icon rail */}
    <div style={{ position: 'absolute', left: 0, top: 134, bottom: 0, width: 56, background: WHITE, borderRight: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 18 }}>
      {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${i === 1 ? BLUE : '#8a8d91'}` }} />)}
    </div>
  </>
}

function Tree({ f, focus }: { f: number; focus: number }) {
  const shown = TREE.filter(n => f >= n.at)
  return <div style={{ position: 'absolute', left: 56, top: 134, width: 330, bottom: 0, background: WHITE, borderRight: `1px solid ${LINE}`, overflow: 'hidden' }}>
    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${LINE}`, ...text(13, MUTED) }}>🔍︎ Buscar</div>
    {shown.map((n, i) => {
      const p = out(f, n.at, n.at + 8)
      const isFocus = TREE.indexOf(n) === focus
      return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 30, paddingLeft: 14 + n.depth * 18, paddingRight: 10, background: isFocus ? '#e7f0ff' : 'transparent', borderLeft: isFocus ? `3px solid ${BLUE}` : '3px solid transparent', opacity: p, transform: `translateX(${(1 - p) * -14}px)` }}>
        <i style={{ width: 12, height: 12, borderRadius: n.depth === 0 ? 3 : n.depth === 1 ? 2 : '50%', border: `1.6px solid ${n.depth === 0 ? '#606770' : '#8a8d91'}`, background: n.depth === 2 ? '#e4e6eb' : 'transparent' }} />
        <span style={{ ...text(12.5, n.depth === 0 ? INK : '#3a3b3c', n.depth === 0 ? 600 : 400), overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>
        {n.tag && <span style={{ marginLeft: 'auto', ...text(10.5, '#1c1e21', 600), padding: '1px 7px', borderRadius: 999, background: `${n.tag[1]}44` }}>{n.tag[0]}</span>}
      </div>
    })}
  </div>
}

// ---------- editor forms ----------

const FORM_X = 410, FORM_W = 760, SIDE_X = 1196, SIDE_W = 700, EDIT_TOP = 190

function EditorFrame({ f, crumb, children, side }: { f: number; crumb: string; children: ReactNode; side: ReactNode }) {
  return <>
    <div style={{ position: 'absolute', left: 386, right: 0, top: 134, height: 46, background: WHITE, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px' }}>
      <span style={text(13, MUTED)}>{crumb}</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 3, borderRadius: 6, background: SOFT }}>
        <span style={{ ...text(12.5, BLUE, 600), padding: '4px 10px', borderRadius: 4, background: WHITE }}>✎ Editar</span><span style={{ ...text(12.5, MUTED, 500), padding: '4px 10px' }}>Revisar</span>
      </span>
      <span style={text(12.5, MUTED)}>Edições não publicadas · <span style={{ color: '#f7b928' }}>●</span> Rascunho</span>
    </div>
    <div style={{ position: 'absolute', left: FORM_X, top: EDIT_TOP, width: FORM_W }}>{children}</div>
    <div style={{ position: 'absolute', left: SIDE_X, top: EDIT_TOP, width: SIDE_W }}>{side}</div>
    <div style={{ position: 'absolute', left: 386, right: 0, bottom: 0, height: 54, background: WHITE, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px' }}>
      <span style={{ ...text(13.5, INK, 500), padding: '7px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Fechar</span>
      <span style={text(13, MUTED)}>{Math.floor(f / 12) % 3 === 0 ? 'Salvando…' : '✓ Salvo'}</span>
      <span style={{ marginLeft: 'auto', ...text(13.5, INK, 500), padding: '7px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Descartar rascunho</span>
      <span style={{ ...text(13.5, '#fff', 600), padding: '8px 18px', borderRadius: 6, background: GREEN }}>Publicar</span>
    </div>
  </>
}

function SummaryCard({ title, lines }: { title: string; lines: [string, string][] }) {
  return <div style={{ background: WHITE, borderRadius: 8, border: `1px solid ${LINE}`, padding: '16px 18px', marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><i style={{ width: 22, height: 22, borderRadius: 5, background: '#1c1e21' }} /><b style={text(14.5, INK, 700)}>{title}</b></div>
    <div style={{ ...text(12, MUTED), marginTop: 4, marginLeft: 32 }}>● Desativada · Últimos 30 dias</div>
    {lines.map(([a, b]) => <div key={a} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, ...text(13, MUTED) }}><span>{a}</span><span style={{ color: INK }}>{b}</span></div>)}
  </div>
}

function CampaignForm({ f }: { f: number }) {
  const t0 = PH.campaign[0]
  const cbo = f >= t0 + 50
  return <EditorFrame f={f} crumb="TESTE · CBO · CONCEITOS · S45  ›  Campanha" side={<>
    <SummaryCard title="TESTE · CBO · CONCEITOS · S45" lines={[['Custo por resultado', '—'], ['Valor usado', 'R$ 0,00']]} />
    <div style={{ background: WHITE, borderRadius: 8, border: `1px solid ${LINE}`, padding: '16px 18px' }}>
      <b style={text(14, INK, 700)}>Recomendações da campanha</b>
      <div style={{ ...text(13, MUTED), marginTop: 10 }}>+ Campanha de vendas Advantage+</div>
      <div style={{ ...text(13, MUTED), marginTop: 8 }}>+ Teste A/B de conceitos criativos</div>
    </div>
  </>}>
    <Card title="Detalhes da campanha">
      <div style={{ display: 'flex', gap: 14 }}>
        <Field label="Tipo de compra" value="Leilão" f={f} at={t0 + 4} select w="50%" />
        <Field label="Objetivo da campanha" value="Vendas" f={f} at={t0 + 10} select w="50%" />
      </div>
    </Card>
    <Card title="Orçamento">
      <div style={{ ...text(13, INK, 600), marginBottom: 8 }}>Estratégia de orçamento</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[['Orçamento da campanha', '8,6% menor custo por compra', 'Distribui o valor entre os conjuntos com mais oportunidade'], ['Compartilhamento', '3,2% menor custo', 'Até 20% compartilhado entre conjuntos'], ['Orçamento do conjunto', 'Valor fixo por conjunto', 'O valor que você definir em cada um']].map(([a, b, c], i) => {
          const sel = i === 0 && cbo
          return <div key={a} style={{ flex: 1, borderRadius: 8, border: `1.5px solid ${sel ? BLUE : LINE}`, background: sel ? '#f0f6ff' : WHITE, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={text(13, INK, 700)}>{a}</b><i style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? BLUE : '#bcc0c4'}`, background: sel ? BLUE : WHITE, boxShadow: sel ? 'inset 0 0 0 2px #fff' : 'none' }} /></div>
            <div style={{ ...text(11.5, GREEN, 600), marginTop: 4 }}>{b}</div>
            <div style={{ ...text(11.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.35 }), marginTop: 4 }}>{c}</div>
          </div>
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
        <Field label="Orçamento diário" value="R$ 300,00" f={f} at={t0 + 66} w="50%" hint="Você vai gastar em média R$ 300,00 por dia. O máximo por dia é R$ 525,00." />
        <Field label="Estratégia de lance da campanha" value="Maior volume" f={f} at={t0 + 86} select w="50%" />
      </div>
    </Card>
    <Card title="Teste A/B">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ ...text(13, MUTED, 400, { whiteSpace: 'normal' }), flex: 1 }}>Melhore o desempenho comparando versões para ver o que funciona melhor.</span>
        <span style={text(13, MUTED)}>{f >= t0 + 110 ? 'Ativado' : 'Desativado'}</span><Toggle on={f >= t0 + 110} />
      </div>
      {f >= t0 + 112 && <div style={{ ...text(12.5, BLUE, 600), marginTop: 10 }}>+ Teste A/B · um conjunto por conceito</div>}
    </Card>
  </EditorFrame>
}

function AdSetForm({ f }: { f: number }) {
  const t0 = PH.adset[0]
  return <EditorFrame f={f} crumb="TESTE · CBO · CONCEITOS · S45  ›  C01 · TESTE DE SABOR · AMPLO  ›  Conjunto de anúncios" side={<>
    <SummaryCard title="C01 · TESTE DE SABOR · AMPLO" lines={[['Tamanho estimado do público', `${(18.4 + Math.min(1, (f - t0) / 80) * 9.7).toFixed(1).replace('.', ',')} mi – ${(21.6 + Math.min(1, (f - t0) / 80) * 11.4).toFixed(1).replace('.', ',')} mi`], ['Resultados diários estimados', '12 – 34 compras']]} />
    <div style={{ background: WHITE, borderRadius: 8, border: `1px solid ${LINE}`, padding: '16px 18px' }}>
      <b style={text(14, INK, 700)}>Recomendações</b><div style={{ ...text(13, MUTED), marginTop: 10 }}>+ Público Advantage+ ativado</div>
    </div>
  </>}>
    <Card title="Conversão">
      <div style={{ display: 'flex', gap: 14 }}>
        <Field label="Local da conversão" value="Site" f={f} at={t0 + 2} select w="33%" />
        <Field label="Pixel" value="Nutri Gomas · Pixel" f={f} at={t0 + 8} select w="34%" />
        <Field label="Evento de conversão" value="Compra" f={f} at={t0 + 20} select w="33%" />
      </div>
    </Card>
    <Card title="Orçamento e programação">
      <div style={{ ...text(12.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }) }}>A campanha distribui automaticamente o orçamento diário de R$ 300,00 entre os conjuntos.</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12 }}><Field label="Data de início" value="11 nov. 2026 · 00:00" f={f} at={t0 + 34} w="50%" /><Field label="Término" value="Sem data de término" f={f} at={t0 + 46} select w="50%" /></div>
    </Card>
    <Card title="Público">
      <div style={{ display: 'flex', gap: 14 }}>
        <Field label="Localizações" value="Brasil" f={f} at={t0 + 58} w="40%" />
        <Field label="Idade" value="25 – 44" f={f} at={t0 + 70} select w="30%" />
        <Field label="Gênero" value="Todos" f={f} at={t0 + 78} select w="30%" />
      </div>
      <div style={{ marginTop: 12 }}><Field label="Excluir estes públicos personalizados" value="Compradores · 180 dias" f={f} at={t0 + 90} /></div>
    </Card>
  </EditorFrame>
}

function AdForm({ f }: { f: number }) {
  const t0 = PH.ad[0]
  const media = [t0 + 34, t0 + 40, t0 + 46]
  const showPreview = f >= t0 + 50
  return <EditorFrame f={f} crumb="… ›  C01 · TESTE DE SABOR · AMPLO  ›  C01 · TESTE DE SABOR · V1" side={
    <div style={{ background: WHITE, borderRadius: 8, border: `1px solid ${LINE}`, padding: '16px 18px', height: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle on /><b style={text(14, INK, 700)}>Prévia do anúncio</b><span style={{ marginLeft: 'auto', ...text(12.5, BLUE, 600) }}>Revisar padrões</span></div>
      <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
        {[0, 1].map(k => <div key={k} style={{ flex: 1, borderRadius: 10, border: `1px solid ${LINE}`, overflow: 'hidden', background: k ? '#111' : WHITE }}>
          {k === 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10 }}><i style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} /><div><b style={text(12, INK, 700)}>Nutri Gomas</b><div style={text(10.5, MUTED)}>Patrocinado</div></div></div>}
          {k === 0 && <div style={{ ...text(11.5, INK, 400, { whiteSpace: 'normal', lineHeight: 1.35 }), padding: '0 10px 8px', minHeight: 46 }}>{typed('Gomas de vitaminas que dá vontade de tomar todo dia. 20+ vitaminas e minerais, sem açúcar.', f, t0 + 56, 2)}</div>}
          <div style={{ opacity: showPreview ? out(f, t0 + 50, t0 + 60) : 0.08, display: 'grid', placeItems: 'center' }}><Creative w={k ? 300 : 316} h={k ? 520 : 316} variant={k} /></div>
          {k === 0 && <div style={{ display: 'flex', alignItems: 'center', padding: 10, background: SOFT }}><div><div style={text(10.5, MUTED)}>NUTRIGOMAS.COM.BR</div><b style={text(12, INK, 700)}>{typed('Saúde nunca foi tão gostosa', f, t0 + 80, 1.6)}</b></div><span style={{ marginLeft: 'auto', ...text(11.5, INK, 600), padding: '6px 10px', borderRadius: 6, background: '#e4e6eb' }}>{f >= t0 + 100 ? 'Comprar agora' : 'Saiba mais'}</span></div>}
        </div>)}
      </div>
      <div style={{ ...text(11, MUTED), marginTop: 14 }}>A renderização e a interação do anúncio podem variar conforme o dispositivo e o posicionamento.</div>
    </div>}>
    <Card title="Identidade">
      <div style={{ display: 'flex', gap: 14 }}><Field label="Página" value="Nutri Gomas" f={f} at={t0 + 2} select w="50%" /><Field label="Perfil do Instagram" value="@nutrigomas" f={f} at={t0 + 10} select w="50%" /></div>
    </Card>
    <Card title="Criativo do anúncio">
      <div style={{ ...text(13, INK, 600), marginBottom: 8 }}>Mídia</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {media.map((at, k) => <div key={k} style={{ width: 86, height: 86, borderRadius: 6, border: `1px dashed ${f >= at ? 'transparent' : '#bcc0c4'}`, display: 'grid', placeItems: 'center', ...text(22, '#bcc0c4') }}>
          {f >= at ? <div style={{ transform: `scale(${out(f, at, at + 6)})` }}><Creative w={86} h={86} variant={k} /></div> : '+'}
        </div>)}
        <div style={{ ...text(11.5, MUTED), alignSelf: 'flex-end' }}>9:16 · 4:5 · 1:1</div>
      </div>
      <div style={{ marginTop: 14 }}><Field label="Texto principal" value="Gomas de vitaminas que dá vontade de tomar todo dia." f={f} at={t0 + 56} /></div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12 }}><Field label="Título" value="Saúde nunca foi tão gostosa" f={f} at={t0 + 80} w="50%" /><Field label="Descrição" value="Até 35% OFF + frete grátis" f={f} at={t0 + 90} w="50%" /></div>
      <div style={{ marginTop: 12 }}><Field label="Chamada para ação" value="Comprar agora" f={f} at={t0 + 100} select w="50%" /></div>
    </Card>
    <Card title="Destino">
      <Field label="URL do site" value="https://nutrigomas.com.br/oferta" f={f} at={t0 + 108} />
      <div style={{ marginTop: 10 }}><Field label="Parâmetros de URL" value="utm_source=ads&utm_medium=pago&utm_campaign=c01" f={f} at={t0 + 118} /></div>
    </Card>
  </EditorFrame>
}

// ---------- table view ----------

const COLS = ['Desativ./Ativ.', 'Nome', 'Veiculação', 'Estratégia de lance', 'Orçamento', 'Valor usado', 'Compras', 'Custo por compra', 'ROAS de compra']
function TableView({ f }: { f: number }) {
  const tab = f < TABLE_TABS.adsets ? 0 : f < TABLE_TABS.ads ? 1 : 2
  const start = [TABLE_TABS.campaigns, TABLE_TABS.adsets, TABLE_TABS.ads][tab]
  const rows: { name: string; tag?: [string, string]; bid: string; budget: string; thumb?: number }[] = tab === 0
    ? CAMPAIGNS.map(([n, t], i) => ({ name: n, tag: t, bid: ['Maior volume', 'Maior volume', 'Meta de custo · R$ 35', 'Maior volume', 'Maior volume'][i], budget: ['R$ 300,00', 'R$ 3.000,00', 'R$ 1.500,00', 'R$ 600,00', 'R$ 400,00'][i] }))
    : tab === 1
      ? ['C05 · AMIGOS · DOCE · AMPLO', 'C06 · DIAS CORRIDOS · 60 FIBRAS', 'ADV+ · VENCEDORES · POST ID', 'AMPLO · BR · 25–54', 'AMPLO · MULHERES · 25–44', 'VISITANTES DO SITE · 30D', 'ADICIONOU AO CARRINHO · 14D', 'ENVOLVIMENTO IG · 60D'].map((n, i) => ({ name: n, tag: ([['Teste', '#f7b928'], ['Teste', '#f7b928'], ['Escala', '#31a24c'], ['Escala', '#31a24c'], ['Escala', '#31a24c'], ['Retargeting', '#5b72f2'], ['Retargeting', '#5b72f2'], ['Retargeting', '#5b72f2']] as [string, string][])[i], bid: i < 5 ? 'Maior volume' : 'Custo por resultado', budget: 'Usando orç. da campanha' }))
      : ['C05 · AMIGOS · DOCE · V3', 'C06 · DIAS CORRIDOS · V1', 'C06 · DIAS CORRIDOS · V2', 'C06 · DIAS CORRIDOS · V3', 'VENCEDOR · 4 BENEFÍCIOS · POST', 'VENCEDOR · TESTE DE SABOR · POST', 'AMPLO · 4 BENEFÍCIOS · V1', 'AMPLO · HISTÓRIA REAL · V2'].map((n, i) => ({ name: n, bid: 'Usando lance do conjunto', budget: 'Usando orç. da campanha', thumb: i }))
  return <div style={{ position: 'absolute', left: 56, right: 0, top: 134, bottom: 0, background: BG, opacity: out(f, PH.table[0], PH.table[0] + 10) }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px' }}>
      {['Todos os anúncios', 'Anúncios ativos', 'Problemas de veiculação', 'Ações'].map((t, i) => <span key={t} style={{ ...text(13, i === 0 ? BLUE : INK, i === 0 ? 600 : 500), padding: '6px 12px', borderRadius: 6, background: i === 0 ? '#e7f0ff' : WHITE, border: `1px solid ${i === 0 ? '#c9dcff' : LINE}` }}>{t}</span>)}
      <span style={{ marginLeft: 'auto', ...text(13, MUTED) }}>Hoje: 10 nov. 2026 ▾</span>
    </div>
    <div style={{ margin: '0 20px', background: WHITE, borderRadius: 8, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${LINE}` }}>
        {['Campanhas', 'Conjuntos de anúncios', 'Anúncios'].map((t, i) => <div key={t} style={{ flex: 1, padding: '12px 16px', ...text(14, i === tab ? BLUE : INK, 600), borderBottom: i === tab ? `3px solid ${BLUE}` : '3px solid transparent', background: i === tab ? WHITE : SOFT }}>{t}{i === tab && <span style={{ marginLeft: 8, ...text(12, '#fff', 700), padding: '1px 7px', borderRadius: 999, background: BLUE }}>{rows.length}</span>}</div>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${LINE}` }}>
        <span style={{ ...text(13, '#fff', 600), padding: '7px 14px', borderRadius: 6, background: GREEN }}>+ Criar</span>
        {['Duplicar', 'Editar', 'Analisar', 'Teste A/B'].map(t => <span key={t} style={{ ...text(13, MUTED, 500), padding: '7px 12px', borderRadius: 6, border: `1px solid ${LINE}` }}>{t}</span>)}
        <span style={{ marginLeft: 'auto', ...text(13, MUTED) }}>Colunas ▾ · Detalhamento ▾</span>
      </div>
      <div style={{ display: 'flex', padding: '10px 16px', borderBottom: `1px solid ${LINE}`, background: SOFT }}>
        {COLS.map((c, i) => <span key={c} style={{ width: i === 0 ? 110 : i === 1 ? 470 : 170, ...text(12.5, MUTED, 600) }}>{c}</span>)}
      </div>
      {rows.map((r, i) => {
        const at = start + 4 + i * 5, p = out(f, at, at + 8)
        if (f < at) return null
        return <div key={r.name} style={{ display: 'flex', alignItems: 'center', height: 54, padding: '0 16px', borderBottom: `1px solid ${LINE}`, opacity: p, background: f - at < 10 ? '#fffbe6' : WHITE }}>
          <span style={{ width: 110 }}><Toggle on={false} /></span>
          <span style={{ width: 470, display: 'flex', alignItems: 'center', gap: 10 }}>
            {r.thumb !== undefined && <Creative w={38} h={38} variant={r.thumb} />}
            <span style={text(13.5, BLUE, 500)}>{r.name}</span>
            {r.tag && <span style={{ ...text(11, '#1c1e21', 600), padding: '2px 8px', borderRadius: 999, background: `${r.tag[1]}44` }}>{r.tag[0]}</span>}
          </span>
          <span style={{ width: 170, ...text(13, MUTED) }}>● Em rascunho</span>
          <span style={{ width: 170, ...text(13, INK) }}>{r.bid}</span>
          <span style={{ width: 170, ...text(13, INK) }}>{r.budget}{tab === 0 && <div style={text(11, MUTED)}>Diário</div>}</span>
          {['—', '—', '—', '—'].map((d, k) => <span key={k} style={{ width: 170, ...text(13, MUTED) }}>{d}</span>)}
        </div>
      })}
      <div style={{ padding: '10px 16px', ...text(12.5, MUTED) }}>Resultados de {rows.length} {['campanhas', 'conjuntos de anúncios', 'anúncios'][tab]}</div>
    </div>
  </div>
}

// ---------- agents' cursors ----------

type Stop = { f: number; x: number; y: number }
/** Click targets during the editor phases (x, y, frame), handed out to the agents in turn. */
const TARGETS: [number, number, number][] = [
  // campaign
  [FORM_X + 180, 270, 24], [FORM_X + 560, 270, 30], [FORM_X + 120, 375, 70], [FORM_X + 180, 485, 86], [FORM_X + 560, 485, 106], [FORM_X + 720, 595, 130], [SIDE_X + 200, 330, 120], [180, 165, 60], [210, 195, 100], [240, 255, 150],
  // ad set
  [FORM_X + 120, 270, 172], [FORM_X + 380, 270, 178], [FORM_X + 640, 270, 190], [FORM_X + 180, 420, 204], [FORM_X + 560, 420, 216], [FORM_X + 120, 530, 228], [FORM_X + 420, 530, 240], [FORM_X + 640, 530, 248], [FORM_X + 300, 610, 260], [SIDE_X + 300, 255, 230], [230, 320, 200], [260, 420, 270],
  // ad
  [FORM_X + 180, 270, 302], [FORM_X + 560, 270, 310], [FORM_X + 40, 395, 334], [FORM_X + 140, 395, 340], [FORM_X + 240, 395, 346], [FORM_X + 300, 480, 356], [FORM_X + 180, 550, 380], [FORM_X + 560, 550, 390], [FORM_X + 180, 620, 400], [FORM_X + 300, 720, 408], [FORM_X + 400, 790, 418],
  [SIDE_X + 160, 520, 360], [SIDE_X + 520, 520, 380], [SIDE_X + 640, 210, 420], [260, 600, 340], [220, 700, 380],
  // tables
  [1700, 108, 446], [300, 330, 456], [520, 390, 470], [760, 450, 486], [880, 212, 500], [400, 330, 510], [620, 430, 526], [300, 560, 540], [1460, 212, 548], [420, 380, 560], [700, 500, 576], [380, 660, 588], [1700, 108, 594],
]
const N_AGENTS = 8
const routes: Stop[][] = Array.from({ length: N_AGENTS }, () => [])
TARGETS.forEach(([x, y, fr], i) => routes[i % N_AGENTS].push({ f: fr, x: x + (random('jx' + i) - 0.5) * 30, y: y + (random('jy' + i) - 0.5) * 10 }))
routes.forEach(r => r.sort((a, b) => a.f - b.f))

function Cursor({ a, f }: { a: number; f: number }) {
  const r = routes[a]
  if (!r.length || f < r[0].f - 10) return null
  let k = 0
  while (k + 1 < r.length && r[k + 1].f - 10 <= f) k++
  const cur = r[k], next = r[k + 1]
  let x = cur.x, y = cur.y
  if (next) { const p = ease(f, next.f - 10, next.f); x += (next.x - cur.x) * p; y += (next.y - cur.y) * p }
  x += Math.sin((f + a * 13) / 10) * 3; y += Math.cos((f + a * 7) / 12) * 2
  const click = f >= cur.f && f < cur.f + 8 ? 1 - (f - cur.f) / 8 : 0
  const { name, color } = ROLES[a]
  return <div style={{ position: 'absolute', left: x, top: y, zIndex: 50, opacity: out(f, r[0].f - 10, r[0].f - 2) }}>
    {click > 0 && <div style={{ position: 'absolute', left: -12, top: -12, width: 24, height: 24, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={18} height={20} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' }}><path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" /></svg>
    <span style={{ position: 'absolute', left: 14, top: 16, padding: '2px 8px', borderRadius: 999, background: color, ...text(11, '#fff', 700) }}>{name}</span>
  </div>
}

export function AdsAgentsCampaignBuild() {
  const f = useCurrentFrame()
  const count = Math.min(41, createdAt(f))
  const focus = f < PH.adset[0] ? 0 : f < PH.ad[0] ? 1 : 2
  const fade = (a: number, b: number) => out(f, a, a + 8) * (1 - ease(f, b - 6, b))
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: UI }}>
    <div style={{ position: 'absolute', inset: 0, opacity: out(f, 0, 10) }}>
      <Browser f={f} count={count} />
      {f < PH.table[0] && <Tree f={f} focus={focus} />}
      {f < PH.adset[0] && <div style={{ position: 'absolute', inset: 0, opacity: fade(PH.campaign[0] - 8, PH.adset[0]) }}><CampaignForm f={f} /></div>}
      {f >= PH.adset[0] - 6 && f < PH.ad[0] && <div style={{ position: 'absolute', inset: 0, opacity: fade(PH.adset[0] - 6, PH.ad[0]) }}><AdSetForm f={f} /></div>}
      {f >= PH.ad[0] - 6 && f < PH.table[0] && <div style={{ position: 'absolute', inset: 0, opacity: fade(PH.ad[0] - 6, PH.table[0]) }}><AdForm f={f} /></div>}
      {f >= PH.table[0] && <TableView f={f} />}
      {Array.from({ length: N_AGENTS }, (_, a) => <Cursor key={a} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}
