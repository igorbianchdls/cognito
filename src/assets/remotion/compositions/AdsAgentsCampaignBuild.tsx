import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto'

// "Agentes montando anúncios": an ads manager table (account bar, filters, folder tabs Visão geral da conta /
// Campanhas / Conjuntos de anúncios / Anúncios, actions bar, performance columns, dark side rail) operated by eight
// AI agents. They click "+ Criar" and "Duplicar", fill the edit drawer (campaign, ad set, ad with preview), the draft
// rows pile up in each tab, "Revisar e publicar (n)" counts up to 41 and, at the end, everything is published.
// 1920×1080, 30 fps, 20 s. Account, product and numbers are made up; no third-party logos.

export const ADS_AGENTS_BUILD_DURATION = 600
const FONT = loadRoboto('normal', { subsets: ['latin'], weights: ['400', '500', '700'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const INK = '#1c1e21', MUTED = '#606770', LINE = '#dddfe2', SOFT = '#f5f6f7', ROWALT = '#f9fafb', BLUE = '#1877f2', LINK = '#385898', GREEN = '#42b72a', RAIL = '#4b4f56'
const T = (size: number, color = INK, weight = 400, extra?: CSSProperties): CSSProperties => ({ fontFamily: FONT, fontSize: size, color, fontWeight: weight, whiteSpace: 'nowrap', ...extra })

// ---------- timing ----------
const TAB_AT = { campaigns: 0, adsets: 200, ads: 330 }
const DRAWER = { open: 34, close: 460 }
const REVIEW = { click: 476, modal: 482, publish: 540, done: 552 }

// ---------- data (made up) ----------
type Row = { name: string; at: number; bid: string; budget: string; budgetNote?: string; thumb?: number; live?: { res: string; resNote: string; reach: string; impr: string; cpr: string; spent: string; end: string } }
const EXISTING: Row[] = [
  { name: '[vendas] Coleção de inverno', at: -1, bid: 'Usando a estr…', budget: 'Usando orç…', live: { res: '312', resNote: 'Compras no site', reach: '48.920', impr: '121.334', cpr: 'R$ 14,22', spent: 'R$ 4.436,64', end: 'Contínuo' } },
  { name: 'Remarketing · Carrinho 14D', at: -1, bid: 'Menor custo', budget: 'R$ 120,00', budgetNote: 'Diariamente', live: { res: '87', resNote: 'Compras no site', reach: '9.410', impr: '38.207', cpr: 'R$ 18,90', spent: 'R$ 1.644,30', end: 'Contínuo' } },
  { name: 'Live de lançamento · Envolvimento', at: -1, bid: 'Usando a estr…', budget: 'Usando orç…', live: { res: '2.104', resNote: 'Engajamento', reach: '61.733', impr: '98.115', cpr: 'R$ 0,31', spent: 'R$ 652,24', end: '30 de nov.' } },
]
const NEW_CAMPAIGNS: Row[] = [
  { name: 'TESTE · CBO · CONCEITOS · S45', at: 44, bid: 'Maior volume', budget: 'R$ 300,00', budgetNote: 'Diariamente' },
  { name: 'ESCALA · ADV+ · VENDAS · VENCEDORES', at: 150, bid: 'Maior volume', budget: 'R$ 3.000,00', budgetNote: 'Diariamente' },
  { name: 'ESCALA · CBO · AMPLO · BR', at: 160, bid: 'Meta de custo', budget: 'R$ 1.500,00', budgetNote: 'Diariamente' },
  { name: 'RT · CBO · PÚBLICOS QUENTES', at: 170, bid: 'Maior volume', budget: 'R$ 600,00', budgetNote: 'Diariamente' },
  { name: 'RETENÇÃO · COMPRADORES 180D', at: 180, bid: 'Maior volume', budget: 'R$ 400,00', budgetNote: 'Diariamente' },
]
const ADSET_NAMES = ['C01 · TESTE DE SABOR · AMPLO', 'C02 · 4 BENEFÍCIOS · AMPLO', 'C03 · HISTÓRIA REAL · AMPLO', 'C04 · NA CORRERIA · AMPLO', 'C05 · AMIGOS · DOCE · AMPLO', 'ADV+ · VENCEDORES · POST ID', 'AMPLO · BR · 25–54', 'AMPLO · MULHERES · 25–44',
  'VISITANTES DO SITE · 30D', 'ADICIONOU AO CARRINHO · 14D', 'ENVOLVIMENTO IG · 60D', 'COMPRADORES · 180D', 'SEMELHANTE 1% · COMPRAS', 'INTERESSES · SAÚDE · 25–44']
const NEW_ADSETS: Row[] = ADSET_NAMES.map((n, i) => ({ name: n, at: 214 + i * 8, bid: i < 8 ? 'Maior volume' : 'Custo por resultado', budget: 'Usando orç…' }))
const AD_NAMES = ['C01 · TESTE DE SABOR', 'C02 · 4 BENEFÍCIOS', 'C03 · HISTÓRIA REAL', 'C04 · NA CORRERIA', 'C05 · AMIGOS · DOCE', 'VENCEDOR · TESTE DE SABOR', 'VENCEDOR · 4 BENEFÍCIOS', 'UGC · DEPOIMENTO']
const NEW_ADS: Row[] = Array.from({ length: 22 }, (_, i) => ({ name: `${AD_NAMES[i % AD_NAMES.length]} · V${(i % 3) + 1}`, at: 344 + i * 5, bid: 'Usando lance d…', budget: 'Usando orç…', thumb: i }))
const ALL_NEW = [...NEW_CAMPAIGNS, ...NEW_ADSETS, ...NEW_ADS]
const draftsAt = (f: number) => ALL_NEW.filter(r => f >= r.at).length

// ---------- small pieces ----------
function typed(v: string, f: number, at: number, cps = 1.5) { return f < at ? '' : v.slice(0, Math.floor((f - at) * cps)) }
function Toggle({ on, small }: { on: boolean; small?: boolean }) {
  const w = small ? 30 : 36, h = small ? 16 : 20
  return <span style={{ width: w, height: h, borderRadius: h / 2, background: on ? BLUE : '#ccd0d5', position: 'relative', display: 'inline-block', flex: 'none' }}><i style={{ position: 'absolute', top: 2, left: on ? w - h + 2 : 2, width: h - 4, height: h - 4, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgb(0 0 0 / .25)' }} /></span>
}
function Btn({ children, primary, green, disabled, caret, style }: { children: ReactNode; primary?: boolean; green?: boolean; disabled?: boolean; caret?: boolean; style?: CSSProperties }) {
  const bg = green ? GREEN : primary ? BLUE : '#f5f6f7', color = green || primary ? '#fff' : disabled ? '#bec3c9' : '#4b4f56'
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 4, background: bg, border: `1px solid ${green ? GREEN : primary ? BLUE : '#ccd0d5'}`, ...T(13, color, 700), ...style }}>
    {children}{caret && <span style={{ fontSize: 9, marginLeft: 2 }}>▼</span>}
  </span>
}
const Icon = ({ d, size = 16, color = '#606770' }: { d: string; size?: number; color?: string }) => <svg width={size} height={size} viewBox="0 0 16 16"><path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
const ICONS = { search: 'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5', filter: 'M2 3h12l-4.5 5.5V13l-3 1V8.5z', grid: 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z', folder: 'M2 4h4l2 2h6v7H2z', ad: 'M2 3h12v10H2zM2 6h12', copy: 'M5 5h8v8H5zM3 11V3h8', pencil: 'M3 13l1-3 7-7 2 2-7 7z', flask: 'M6 2h4M7 2v4l-4 7h10l-4-7V2', trash: 'M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10', refresh: 'M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3', gear: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3', chart: 'M2 14h12M4 12V8M8 12V4M12 12V6', clock: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 5v3l2 2', back: 'M10 3L5 8l5 5', info: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 7v4M8 5v.1' }

/** The made-up product: a pouch of "nutri gomas" on a pastel background. */
function Creative({ w, h, variant = 0 }: { w: number; h: number; variant?: number }) {
  const bgs = ['linear-gradient(160deg, #ffe7c2, #ffd0a8)', 'linear-gradient(160deg, #d9f2e6, #b6e4cf)', 'linear-gradient(160deg, #e6e1ff, #cfc5ff)']
  const pw = w * 0.52, ph = h * 0.58
  return <div style={{ position: 'relative', width: w, height: h, borderRadius: Math.max(2, w * 0.04), overflow: 'hidden', background: bgs[variant % 3], flex: 'none' }}>
    <div style={{ position: 'absolute', left: (w - pw) / 2, top: h * 0.18, width: pw, height: ph, borderRadius: `${pw * 0.12}px ${pw * 0.12}px ${pw * 0.08}px ${pw * 0.08}px`, background: 'linear-gradient(180deg, #7ac943, #4e9a2a)', boxShadow: '0 4px 10px rgb(0 0 0 / .18)', transform: `rotate(${variant % 2 ? -6 : 5}deg)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.18, textAlign: 'center', ...T(pw * 0.2, '#fff', 700) }}>nutri</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.44, textAlign: 'center', ...T(pw * 0.13, '#eaffd8', 500) }}>gomas</div>
      {[0, 1, 2].map(k => <i key={k} style={{ position: 'absolute', left: pw * (0.22 + k * 0.2), top: ph * 0.7, width: pw * 0.15, height: pw * 0.15, borderRadius: '45%', background: ['#ff6b6b', '#ffd93d', '#ff9f43'][k] }} />)}
    </div>
  </div>
}

// ---------- chrome ----------

const RAIL_X = 1872
function Chrome({ f }: { f: number }) {
  const n = f >= REVIEW.done ? 0 : draftsAt(f)
  const pulse = ALL_NEW.some(r => f >= r.at && f < r.at + 6) ? 1.06 : 1
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44, background: '#dee1e6', display: 'flex', alignItems: 'flex-end', padding: '0 14px', gap: 10 }}>
      <span style={{ display: 'flex', gap: 8, alignSelf: 'center', marginRight: 8 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}</span>
      <div style={{ height: 34, width: 260, borderRadius: '8px 8px 0 0', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', ...T(13, INK) }}>Gerenciador de Anúncios<span style={{ marginLeft: 'auto', color: MUTED }}>×</span></div>
      <span style={{ alignSelf: 'center', ...T(20, MUTED) }}>+</span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 44, height: 40, background: '#fff', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
      <span style={T(18, MUTED)}>←</span><span style={T(18, '#bcc0c4')}>→</span><Icon d={ICONS.refresh} />
      <div style={{ flex: 1, height: 28, borderRadius: 14, background: '#f1f3f4', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px' }}><span style={T(12, MUTED)}>🔒︎</span><span style={T(13, MUTED)}>gerenciador-de-anuncios/campanhas</span></div>
      <span style={T(16, MUTED)}>☆</span><i style={{ width: 22, height: 22, borderRadius: '50%', background: '#d0d3d8' }} /><span style={T(16, MUTED)}>⋮</span>
    </div>
    {/* right rail */}
    <div style={{ position: 'absolute', left: RAIL_X, top: 84, width: 48, bottom: 0, background: RAIL, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 12 }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.6px solid #fff', display: 'grid', placeItems: 'center' }}><Icon d={ICONS.back} size={12} color="#fff" /></span>
      <span style={{ width: 48, height: 40, background: '#e7f0fd', display: 'grid', placeItems: 'center' }}><Icon d={ICONS.chart} size={20} color={BLUE} /></span>
      {[ICONS.pencil, ICONS.clock, ICONS.search].map(d => <Icon key={d} d={d} size={20} color="#bec3c9" />)}
    </div>
    {/* account bar */}
    <div style={{ position: 'absolute', left: 0, width: RAIL_X, top: 84, height: 48, background: '#fff', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
      <div style={{ width: 300, height: 32, border: `1px solid #ccd0d5`, borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 10px', ...T(14, INK, 500) }}>nutrigomas.digital<span style={{ marginLeft: 'auto', fontSize: 10 }}>▼</span></div>
      <span style={{ marginLeft: 'auto', ...T(14, INK) }}>Atualizado {f < 40 ? 'há 1 minuto' : 'agora mesmo'}</span>
      <span style={{ width: 32, height: 32, border: `1px solid #ccd0d5`, borderRadius: 4, display: 'grid', placeItems: 'center' }}><Icon d={ICONS.refresh} /></span>
      <Btn>Descartar rascunhos</Btn>
      <Btn primary style={{ transform: `scale(${pulse})`, opacity: f >= REVIEW.done ? 0.5 : 1 }}>Revisar e publicar{n > 0 ? ` (${n})` : ''}</Btn>
      <span style={{ width: 32, height: 32, border: `1px solid #ccd0d5`, borderRadius: 4, display: 'grid', placeItems: 'center' }}><Icon d={ICONS.gear} /></span>
    </div>
    {/* filters */}
    <div style={{ position: 'absolute', left: 0, width: RAIL_X, top: 132, height: 50, background: SOFT, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
      <Btn caret style={{ background: '#fff' }}><Icon d={ICONS.search} size={14} />Pesquisar</Btn>
      <Btn caret style={{ background: '#fff' }}><Icon d={ICONS.filter} size={14} />Filtros</Btn>
      <span style={{ width: 30, height: 30, borderRadius: 4, background: '#e7f0fd', border: '1px solid #bcd3f7', display: 'grid', placeItems: 'center', ...T(18, BLUE) }}>+</span>
      <span style={{ ...T(14, '#90949c'), marginLeft: 8 }}>Adicione filtros para restringir os dados que você está vendo.</span>
      <Btn caret style={{ marginLeft: 'auto', background: '#fff', fontWeight: 500, color: INK }}>Este mês: 1 de nov. de 2026 – 10</Btn>
    </div>
  </>
}

const TABS = [['Visão geral da conta', ICONS.ad], ['Campanhas', ICONS.folder], ['Conjuntos de anúncios', ICONS.grid], ['Anúncios', ICONS.ad]] as const
function Tabs({ tab }: { tab: number }) {
  return <div style={{ position: 'absolute', left: 16, top: 196, display: 'flex', alignItems: 'flex-end' }}>
    {TABS.map(([label, d], i) => {
      const on = i === tab
      return <div key={label} style={{ width: 340, height: on ? 46 : 42, marginLeft: i ? -12 : 0, zIndex: on ? 3 : 2 - i * 0.1, background: on ? '#fff' : '#ebedf0', border: `1px solid ${LINE}`, borderBottom: on ? '1px solid #fff' : `1px solid ${LINE}`, borderRadius: '8px 8px 0 0', clipPath: 'polygon(0 100%, 3% 0, 97% 0, 100% 100%)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 34px', position: 'relative' }}>
        <Icon d={d} size={18} color={on ? BLUE : MUTED} /><span style={T(16, on ? INK : '#4b4f56', on ? 700 : 500)}>{label}</span>
      </div>
    })}
  </div>
}

// ---------- the table ----------

const COLS: [string, number][] = [['', 44], ['', 56], ['', 430], ['', 36], ['Estratégia de lance', 150], ['Orçamento', 140], ['Resultados', 150], ['Alcance', 120], ['Impressões', 130], ['Custo por resultado', 150], ['Valor gasto', 150], ['Término', 260]]
const TABLE_X = 16, TABLE_Y = 242, ROW_H = 48
function Table({ f, tab }: { f: number; tab: number }) {
  const published = f >= REVIEW.done
  const rows: Row[] = tab <= 1 ? [...NEW_CAMPAIGNS.filter(r => f >= r.at).reverse(), ...EXISTING] : tab === 2 ? NEW_ADSETS.filter(r => f >= r.at).reverse() : NEW_ADS.filter(r => f >= r.at).reverse()
  const nameCol = tab <= 1 ? 'Nome da campanha' : tab === 2 ? 'Nome do conjunto de anúncios' : 'Nome do anúncio'
  const total = tab <= 1 ? NEW_CAMPAIGNS.filter(r => f >= r.at).length + EXISTING.length : rows.length
  const kind = tab <= 1 ? 'campanhas' : tab === 2 ? 'conjuntos de anúncios' : 'anúncios'
  const visible = rows.slice(0, 13)
  return <div style={{ position: 'absolute', left: TABLE_X, top: TABLE_Y, width: RAIL_X - 32, bottom: 0, background: '#fff', border: `1px solid ${LINE}`, borderBottom: 'none' }}>
    {/* actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 6px' }}>
      <Btn green><span style={{ fontSize: 16 }}>+</span> Criar</Btn>
      <Btn caret disabled={f < 140 || tab === 0}><Icon d={ICONS.copy} size={14} color={f < 140 ? '#bec3c9' : '#4b4f56'} />Duplicar</Btn>
      <Btn caret disabled={f < 44}><Icon d={ICONS.pencil} size={14} color={f < 44 ? '#bec3c9' : '#4b4f56'} />Editar</Btn>
      <Btn disabled={f < 44}><Icon d={ICONS.flask} size={14} color={f < 44 ? '#bec3c9' : '#4b4f56'} />Teste A/B</Btn>
      <span style={{ width: 30, height: 30, borderRadius: 4, border: '1px solid #ccd0d5', background: SOFT, display: 'grid', placeItems: 'center' }}><Icon d={ICONS.trash} size={14} color="#bec3c9" /></span>
      <Btn caret>Mais</Btn><Btn caret>Regras</Btn>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '4px 12px 10px' }}>
      <span style={T(13, '#4b4f56')}>Ver configuração</span><Toggle on={false} small />
      <Btn caret>Colunas: <span style={{ fontWeight: 700 }}>Desempenho</span></Btn><Btn caret>Detalhamento</Btn><Btn caret>Relatórios</Btn>
    </div>
    {/* header */}
    <div style={{ display: 'flex', height: 46, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, background: '#fff' }}>
      {COLS.map(([c, w], i) => <div key={i} style={{ width: w, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: i >= 4 ? 'flex-end' : 'flex-start', padding: '0 10px', borderRight: i === 3 ? `1px solid ${LINE}` : 'none', ...T(13, INK, 700, { whiteSpace: 'normal', textAlign: i >= 4 ? 'right' : 'left', lineHeight: 1.2 }) }}>
        {i === 0 ? <i style={{ width: 14, height: 14, border: '1px solid #bec3c9', borderRadius: 2 }} /> : i === 2 ? <span style={{ display: 'flex', width: '100%' }}>{nameCol}<span style={{ marginLeft: 'auto', fontSize: 9, color: MUTED }}>▼</span></span> : i === 3 ? <span style={{ color: BLUE, fontSize: 11 }}>▲</span> : c}
      </div>)}
    </div>
    {visible.map((r, k) => {
      const p = r.at < 0 ? 1 : out(f, r.at, r.at + 8)
      const draft = r.at >= 0 && !published
      const fresh = r.at >= 0 && f - r.at < 14
      const L = r.live
      const name = tab <= 1 && r === NEW_CAMPAIGNS[0] && f < 120 ? typed(r.name, f, r.at, 1.2) : r.name
      const cell = (v: ReactNode, w: number, note?: string, i = 0) => <div key={i} style={{ width: w, flex: 'none', padding: '0 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', ...T(13, INK) }}>{v}{note && <span style={T(12, MUTED)}>{note}</span>}</div>
      return <div key={r.name + k} style={{ display: 'flex', height: ROW_H, borderBottom: `1px solid ${LINE}`, background: fresh ? '#fff8db' : k % 2 ? ROWALT : '#fff', opacity: p, transform: `translateY(${(1 - p) * -10}px)` }}>
        <div style={{ width: 44, flex: 'none', display: 'grid', placeItems: 'center' }}><i style={{ width: 14, height: 14, border: '1px solid #bec3c9', borderRadius: 2, background: fresh ? '#e7f0fd' : '#fff' }} /></div>
        <div style={{ width: 56, flex: 'none', display: 'grid', placeItems: 'center' }}><Toggle on={!draft} small /></div>
        <div style={{ width: 430, flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', overflow: 'hidden' }}>
          {r.thumb !== undefined && <Creative w={34} h={34} variant={r.thumb} />}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ ...T(13.5, LINK, 500), overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: draft ? 'italic' : 'normal' }}>{name}{fresh && name.length < r.name.length ? '|' : ''}</span>
            {draft && <span style={T(11.5, '#f7923b', 500)}>● Rascunho</span>}
            {r.at >= 0 && published && <span style={T(11.5, MUTED, 500)}>● Em análise</span>}
          </div>
        </div>
        <div style={{ width: 36, flex: 'none', borderRight: `1px solid ${LINE}` }} />
        {cell(r.bid, 150, undefined, 1)}
        {cell(r.budget, 140, r.budgetNote, 2)}
        {cell(L ? L.res : '—', 150, L?.resNote, 3)}
        {cell(L ? L.reach : '—', 120, undefined, 4)}
        {cell(L ? L.impr : '—', 130, undefined, 5)}
        {cell(L ? L.cpr : '—', 150, L ? 'Por compra' : undefined, 6)}
        {cell(L ? L.spent : 'R$ 0,00', 150, undefined, 7)}
        {cell(L ? L.end : 'Contínuo', 260, undefined, 8)}
      </div>
    })}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 54px', borderBottom: `1px solid ${LINE}`, ...T(13.5, INK, 700) }}>› Resultados de {total} {kind} <Icon d={ICONS.info} size={14} /></div>
  </div>
}

// ---------- edit drawer ----------

const DRAWER_X = 1060, DRAWER_W = RAIL_X - DRAWER_X
function Field({ label, value, f, at, select, w }: { label: string; value: string; f: number; at: number; select?: boolean; w?: string }) {
  const v = typed(value, f, at), active = f >= at && v.length < value.length
  return <div style={{ width: w ?? '100%' }}>
    <div style={{ ...T(12.5, INK, 700), marginBottom: 5 }}>{label}</div>
    <div style={{ height: 34, borderRadius: 4, border: `1px solid ${active ? BLUE : '#ccd0d5'}`, boxShadow: active ? '0 0 0 2px rgb(24 119 242 / .2)' : 'none', display: 'flex', alignItems: 'center', padding: '0 10px', ...T(13.5, INK) }}>{v}{active && <span style={{ color: BLUE }}>|</span>}{select && <span style={{ marginLeft: 'auto', fontSize: 9, color: MUTED }}>▼</span>}</div>
  </div>
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}><b style={{ ...T(15, INK, 700), display: 'block', marginBottom: 12 }}>{title}</b>{children}</div>
}
function Drawer({ f, tab }: { f: number; tab: number }) {
  const open = out(f, DRAWER.open, DRAWER.open + 12) * (1 - ease(f, DRAWER.close, DRAWER.close + 12))
  if (open <= 0) return null
  const t0 = tab <= 1 ? DRAWER.open : tab === 2 ? TAB_AT.adsets : TAB_AT.ads
  const title = tab <= 1 ? 'Campanha' : tab === 2 ? 'Conjunto de anúncios' : 'Anúncio'
  const crumb = tab <= 1 ? 'TESTE · CBO · CONCEITOS · S45' : tab === 2 ? 'TESTE · CBO · CONCEITOS · S45 › C01 · TESTE DE SABOR · AMPLO' : '… › C01 · TESTE DE SABOR · AMPLO › C01 · TESTE DE SABOR · V1'
  return <div style={{ position: 'absolute', left: DRAWER_X + (1 - open) * DRAWER_W, top: 84, width: DRAWER_W, bottom: 0, background: '#fff', boxShadow: '-8px 0 24px rgb(0 0 0 / .15)', borderLeft: `1px solid ${LINE}`, zIndex: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 18px', borderBottom: `1px solid ${LINE}` }}>
      <Icon d={ICONS.pencil} size={16} color={BLUE} /><b style={T(16, INK, 700)}>Editando {title.toLowerCase()}</b>
      <span style={{ ...T(12, '#f7923b', 500), marginLeft: 6 }}>● Rascunho</span>
      <span style={{ marginLeft: 'auto', ...T(13, MUTED) }}>{Math.floor(f / 12) % 3 === 0 ? 'Salvando…' : 'Salvo'}</span><span style={T(18, MUTED)}>×</span>
    </div>
    <div style={{ padding: '10px 18px', ...T(12.5, MUTED), borderBottom: `1px solid ${LINE}` }}>{crumb}</div>
    <div style={{ padding: 18, display: 'flex', gap: 16 }}>
      <div style={{ flex: 1 }}>
        {tab <= 1 && <>
          <Section title="Nome da campanha"><Field label="" value="TESTE · CBO · CONCEITOS · S45" f={f} at={t0 + 10} /></Section>
          <Section title="Detalhes da campanha"><div style={{ display: 'flex', gap: 12 }}><Field label="Tipo de compra" value="Leilão" f={f} at={t0 + 34} select w="50%" /><Field label="Objetivo" value="Vendas" f={f} at={t0 + 40} select w="50%" /></div></Section>
          <Section title="Orçamento da campanha">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><Toggle on={f >= t0 + 50} /><span style={T(13, INK)}>Orçamento da campanha Advantage</span></div>
            <div style={{ display: 'flex', gap: 12 }}><Field label="Orçamento diário" value="R$ 300,00" f={f} at={t0 + 58} w="50%" /><Field label="Estratégia de lance" value="Maior volume" f={f} at={t0 + 74} select w="50%" /></div>
          </Section>
          <Section title="Teste A/B"><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle on={f >= t0 + 96} /><span style={T(13, INK)}>Comparar conceitos criativos · um conjunto por conceito</span></div></Section>
        </>}
        {tab === 2 && <>
          <Section title="Conversão"><div style={{ display: 'flex', gap: 12 }}><Field label="Local da conversão" value="Site" f={f} at={t0 + 6} select w="33%" /><Field label="Pixel" value="nutrigomas · Pixel" f={f} at={t0 + 12} select w="34%" /><Field label="Evento" value="Compra" f={f} at={t0 + 24} select w="33%" /></div></Section>
          <Section title="Público"><div style={{ display: 'flex', gap: 12 }}><Field label="Localizações" value="Brasil" f={f} at={t0 + 36} w="40%" /><Field label="Idade" value="25 – 44" f={f} at={t0 + 46} select w="30%" /><Field label="Gênero" value="Todos" f={f} at={t0 + 54} select w="30%" /></div>
            <div style={{ marginTop: 12 }}><Field label="Excluir públicos personalizados" value="Compradores · 180 dias" f={f} at={t0 + 64} /></div></Section>
          <Section title="Posicionamentos"><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle on={f >= t0 + 86} /><span style={T(13, INK)}>Posicionamentos Advantage+ (recomendado)</span></div></Section>
          <Section title="Tamanho estimado do público"><span style={T(20, INK, 700)}>{(18.4 + Math.min(1, (f - t0) / 70) * 9.7).toFixed(1).replace('.', ',')} mi – {(21.6 + Math.min(1, (f - t0) / 70) * 11.4).toFixed(1).replace('.', ',')} mi</span></Section>
        </>}
        {tab === 3 && <>
          <Section title="Identidade"><div style={{ display: 'flex', gap: 12 }}><Field label="Página" value="nutri gomas" f={f} at={t0 + 4} select w="50%" /><Field label="Perfil do Instagram" value="@nutrigomas" f={f} at={t0 + 10} select w="50%" /></div></Section>
          <Section title="Criativo do anúncio">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>{[0, 1, 2].map(k => <div key={k} style={{ width: 70, height: 70, borderRadius: 4, border: f >= t0 + 22 + k * 6 ? 'none' : '1px dashed #bcc0c4', display: 'grid', placeItems: 'center', ...T(20, '#bcc0c4') }}>{f >= t0 + 22 + k * 6 ? <Creative w={70} h={70} variant={k} /> : '+'}</div>)}</div>
            <Field label="Texto principal" value="Gomas de vitaminas que dá vontade de tomar todo dia." f={f} at={t0 + 44} />
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}><Field label="Título" value="Saúde nunca foi tão gostosa" f={f} at={t0 + 70} w="50%" /><Field label="Chamada para ação" value="Comprar agora" f={f} at={t0 + 84} select w="50%" /></div>
            <div style={{ marginTop: 10 }}><Field label="Parâmetros de URL" value="utm_source=ads&utm_medium=pago&utm_campaign=c01" f={f} at={t0 + 96} /></div>
          </Section>
        </>}
      </div>
      {tab === 3 && <div style={{ width: 300, flex: 'none', border: `1px solid ${LINE}`, borderRadius: 6, padding: 12 }}>
        <b style={T(13, INK, 700)}>Prévia do anúncio</b>
        <div style={{ marginTop: 10, border: `1px solid ${LINE}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}><i style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} /><div><b style={T(12, INK, 700)}>nutri gomas</b><div style={T(10.5, MUTED)}>Patrocinado</div></div></div>
          <div style={{ ...T(11.5, INK, 400, { whiteSpace: 'normal', lineHeight: 1.35 }), padding: '0 8px 8px', minHeight: 32 }}>{typed('Gomas de vitaminas que dá vontade de tomar todo dia.', f, t0 + 44)}</div>
          <div style={{ opacity: f >= t0 + 22 ? 1 : 0.1 }}><Creative w={276} h={276} /></div>
          <div style={{ display: 'flex', alignItems: 'center', padding: 8, background: SOFT }}><b style={T(11.5, INK, 700)}>{typed('Saúde nunca foi tão gostosa', f, t0 + 70)}</b><span style={{ marginLeft: 'auto', ...T(11, INK, 700), padding: '5px 8px', borderRadius: 4, background: '#e4e6eb' }}>{f >= t0 + 84 ? 'Comprar agora' : 'Saiba mais'}</span></div>
        </div>
      </div>}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
      <Btn>Fechar</Btn><span style={{ marginLeft: 'auto' }} /><Btn>Descartar rascunho</Btn><Btn green>Publicar</Btn>
    </div>
  </div>
}

function ReviewModal({ f }: { f: number }) {
  if (f < REVIEW.modal || f >= REVIEW.done + 6) return null
  const a = out(f, REVIEW.modal, REVIEW.modal + 10) * (1 - ease(f, REVIEW.done - 4, REVIEW.done + 6))
  const publishing = f >= REVIEW.publish
  return <div style={{ position: 'absolute', inset: 0, background: `rgb(0 0 0 / ${0.4 * a})`, zIndex: 60, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: 640, background: '#fff', borderRadius: 8, boxShadow: '0 20px 60px rgb(0 0 0 / .3)', opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${LINE}`, ...T(18, INK, 700) }}>Revisar e publicar</div>
      <div style={{ padding: '16px 20px' }}>
        <div style={T(14, INK)}>Você está prestes a publicar 41 edições:</div>
        {[['Campanhas', 5], ['Conjuntos de anúncios', 14], ['Anúncios', 22]].map(([l, n]) => <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${LINE}`, ...T(14, INK) }}><span>✓ {l} criados</span><b>{n}</b></div>)}
        <div style={{ ...T(12.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 12 }}>Os anúncios passam por análise antes de começar a veiculação.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: `1px solid ${LINE}` }}><Btn>Cancelar</Btn><Btn primary>{publishing ? 'Publicando…' : 'Publicar'}</Btn></div>
    </div>
  </div>
}

// ---------- agents' cursors ----------

const ROLES = [['Teste', '#f7b928'], ['Escala', '#31a24c'], ['Retargeting', '#5b72f2'], ['Criativo', '#e4405f'], ['Texto', '#a259ff'], ['Orçamento', '#0ea5a4'], ['Público', '#ff7a00'], ['Rastreamento', '#3b82f6']] as const
const dx = DRAWER_X + 18
const TARGETS: [number, number, number][] = [
  [80, 258, 28], [dx + 200, 230, 44], [dx + 120, 330, 74], [dx + 450, 330, 80], [dx + 40, 410, 90], [dx + 120, 470, 98], [dx + 450, 470, 114], [dx + 40, 550, 136],
  [180, 258, 140], [180, 258, 150], [180, 258, 160], [180, 258, 170], [300, 330, 184],
  [800, 220, 200], [dx + 120, 230, 206], [dx + 350, 230, 212], [dx + 600, 230, 224], [dx + 120, 320, 236], [dx + 330, 320, 246], [dx + 520, 320, 254], [dx + 250, 390, 264], [dx + 40, 470, 286], [300, 400, 230], [300, 520, 270], [180, 258, 300],
  [1140, 220, 330], [dx + 200, 230, 334], [dx + 500, 230, 340], [dx + 40, 330, 352], [dx + 110, 330, 358], [dx + 180, 330, 364], [dx + 250, 420, 374], [dx + 1650 - DRAWER_X, 450, 380], [dx + 200, 480, 400], [dx + 450, 480, 414], [dx + 250, 540, 426], [300, 420, 360], [300, 560, 410], [180, 258, 440],
  [dx + 30, 1052, 458], [1730, 108, 476], [1180, 690, 540], [400, 400, 560], [700, 520, 580], [1000, 360, 590],
]
const routes: { f: number; x: number; y: number }[][] = ROLES.map(() => [])
TARGETS.forEach(([x, y, fr], i) => routes[i % ROLES.length].push({ f: fr, x: x + (random('jx' + i) - 0.5) * 24, y: y + (random('jy' + i) - 0.5) * 8 }))
routes.forEach(r => r.sort((a, b) => a.f - b.f))

function Cursor({ a, f }: { a: number; f: number }) {
  const r = routes[a]
  if (!r.length || f < r[0].f - 12) return null
  let k = 0
  while (k + 1 < r.length && r[k + 1].f - 10 <= f) k++
  const cur = r[k], next = r[k + 1]
  let x = cur.x, y = cur.y
  if (next) { const p = ease(f, next.f - 10, next.f); x += (next.x - cur.x) * p; y += (next.y - cur.y) * p }
  x += Math.sin((f + a * 13) / 10) * 3; y += Math.cos((f + a * 7) / 12) * 2
  const click = f >= cur.f && f < cur.f + 8 ? 1 - (f - cur.f) / 8 : 0
  const [name, color] = ROLES[a]
  return <div style={{ position: 'absolute', left: x, top: y, zIndex: 80, opacity: out(f, r[0].f - 12, r[0].f - 4) }}>
    {click > 0 && <div style={{ position: 'absolute', left: -12, top: -12, width: 24, height: 24, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={18} height={20} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' }}><path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" /></svg>
    <span style={{ position: 'absolute', left: 14, top: 16, padding: '2px 8px', borderRadius: 999, background: color, ...T(11, '#fff', 700) }}>{name}</span>
  </div>
}

function Toast({ f }: { f: number }) {
  if (f < REVIEW.done) return null
  const a = out(f, REVIEW.done, REVIEW.done + 10)
  return <div style={{ position: 'absolute', left: 30, bottom: 30, zIndex: 70, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 8, background: '#323436', color: '#fff', ...T(14, '#fff', 500), opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
    <span style={{ color: '#7dd56f' }}>✓</span> 41 edições publicadas · 5 campanhas, 14 conjuntos e 22 anúncios em análise
  </div>
}

export function AdsAgentsCampaignBuild() {
  const f = useCurrentFrame()
  const tab = f < TAB_AT.adsets ? 1 : f < TAB_AT.ads ? 2 : f < DRAWER.close + 30 ? 3 : 1
  return <AbsoluteFill style={{ background: '#e9ebee', overflow: 'hidden', fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, opacity: out(f, 0, 10) }}>
      <Chrome f={f} />
      <Tabs tab={tab} />
      <Table f={f} tab={tab} />
      <Drawer f={f} tab={tab} />
      <ReviewModal f={f} />
      <Toast f={f} />
      {ROLES.map((_, a) => <Cursor key={a} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}
