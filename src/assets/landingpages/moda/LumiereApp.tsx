'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowRight, ArrowUp, Bell, Check, ChevronDown, Download, LayoutGrid, List, MessageCircle, Minus, Plus, RotateCcw, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { BagArt, BlouseArt, BoxArt, GarmentArt, GrowthArt, LeafLogo, MegaphoneArt, PeopleArt } from './Art';
import { addDays, audiences, brl, campaignChannels, campaignStatus, categories, channels, dateLabel, dayKey, daysBetween, expenseCategories, initials, lowVariants, makeSeed, monthKey, palette, payments, saleTotal, sellers, sizesAll, stockOf, storageKey, uid, type Audience, type Campaign, type Category, type Channel, type Client, type Payment, type Product, type Sale, type Store } from './data';
import { serif } from './fonts';
import s from './LumiereApp.module.css';

type View = 'Visão Geral' | 'Produtos' | 'Clientes' | 'Estoque' | 'Marketing' | 'Financeiro' | 'Relatórios';
type Modal = { kind: 'product' | 'client' | 'sale' | 'campaign' | 'expense'; id?: string; preset?: string } | null;
type Drawer = { kind: 'product' | 'client'; id: string } | null;
const views: View[] = ['Visão Geral', 'Produtos', 'Clientes', 'Estoque', 'Marketing', 'Financeiro', 'Relatórios'];
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const pct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const num = (v: string) => Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;
const compact = (v: number) => v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : v >= 1e4 ? `R$ ${Math.round(v / 1e3).toLocaleString('pt-BR')} mil` : brl(v);
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const monthLabel = (key: string, style: 'short' | 'long' = 'short') => new Date(`${key}-01T12:00`).toLocaleDateString('pt-BR', { month: style }).replace('.', '');
const longDay = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '').replace(/^./, c => c.toUpperCase());
const whatsapp = (phone: string, text: string) => `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

type ClientStat = { count: number; total: number; last: string; first: string };
/** Purchase count, spend and first/last purchase per client, computed once per store change. */
function clientStats(sales: Sale[]) {
  const map = new Map<string, ClientStat>();
  for (const x of sales) {
    if (!x.clientId) continue;
    const d = x.date.slice(0, 10), cur = map.get(x.clientId);
    if (!cur) map.set(x.clientId, { count: 1, total: saleTotal(x), last: d, first: d });
    else { cur.count++; cur.total += saleTotal(x); if (d > cur.last) cur.last = d; if (d < cur.first) cur.first = d; }
  }
  return map;
}
function audienceOf(store: Store, stats: Map<string, ClientStat>, audience: Audience, today: string) {
  const vipLine = [...stats.values()].map(v => v.total).sort((a, b) => b - a)[Math.floor(stats.size * .1)] ?? Infinity;
  return store.clients.filter(c => {
    const st = stats.get(c.id);
    if (audience === 'Aniversariantes do mês') return c.birthday.slice(5, 7) === today.slice(5, 7);
    if (audience === 'Inativas há 60 dias') return !!st && st.last < addDays(today, -60);
    if (audience === 'Clientes VIP') return !!st && st.total >= vipLine;
    return true;
  });
}

export default function LumiereApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Visão Geral');
  const [modal, setModal] = useState<Modal>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    let saved: Store | null = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) saved = JSON.parse(raw); } catch { /* falls back to the demo data */ }
    // Clock and storage are read only after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(saved?.products ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);
  const stats = useMemo(() => clientStats(store?.sales ?? []), [store?.sales]);

  if (!store) return <div className={`${s.app} ${serif.variable}`}><div className={s.loading}><LeafLogo className={s.logoMark} /></div></div>;

  const today = dayKey(now);
  const set = (fn: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...fn(prev) }); if (message) setToast(message); };
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const ctx: Ctx = { store, today, stats, set, go, setModal, open: (kind, id) => setDrawer({ kind, id }), product: id => store.products.find(p => p.id === id), client: id => store.clients.find(c => c.id === id) };
  const overview = view === 'Visão Geral';
  const drawerProduct = drawer?.kind === 'product' ? ctx.product(drawer.id) : undefined;
  const drawerClient = drawer?.kind === 'client' ? ctx.client(drawer.id) : undefined;

  return <div className={`${s.app} ${serif.variable} ${overview ? s.photoMode : s.dataMode}`}>
    {overview && <div className={s.backdrop} aria-hidden="true" />}
    <TopBar ctx={ctx} view={view} />
    <main className={s.main}>
      {overview && <Overview ctx={ctx} />}
      {view === 'Produtos' && <ProductsView ctx={ctx} />}
      {view === 'Clientes' && <ClientsView ctx={ctx} />}
      {view === 'Estoque' && <StockView ctx={ctx} />}
      {view === 'Marketing' && <MarketingView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
    </main>
    {modal?.kind === 'product' && <ProductForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'client' && <ClientForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'sale' && <SaleForm ctx={ctx} preset={modal.preset} onClose={() => setModal(null)} />}
    {modal?.kind === 'campaign' && <CampaignForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'expense' && <ExpenseForm ctx={ctx} onClose={() => setModal(null)} />}
    {drawerProduct && <ProductDrawer key={drawerProduct.id} ctx={ctx} p={drawerProduct} onClose={() => setDrawer(null)} />}
    {drawerClient && <ClientDrawer key={drawerClient.id} ctx={ctx} c={drawerClient} onClose={() => setDrawer(null)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; today: string; stats: Map<string, ClientStat>; set: (fn: (st: Store) => Partial<Store>, message?: string) => void; go: (v: View) => void; setModal: (m: Modal) => void; open: (kind: 'product' | 'client', id: string) => void; product: (id: string) => Product | undefined; client: (id: string) => Client | undefined };

function Pill({ tone, children }: { tone: string; children: ReactNode }) { return <em className={`${s.pill} ${tone}`}>{children}</em>; }
function Avatar({ name, size = 30 }: { name: string; size?: number }) { return <span className={s.avatar} style={{ width: size, height: size, fontSize: size * .38 }}>{initials(name)}</span>; }
function Thumb({ p, className }: { p: Product; className?: string }) {
  const color = palette[p.variants[0]?.color] ?? '#e98fa3';
  return <span className={`${s.thumb} ${className ?? ''}`} role="img" aria-label={p.name}><GarmentArt category={p.category} name={p.name} color={color} /></span>;
}
function Delta({ value, unit = '%' }: { value: number; unit?: string }) {
  const up = value >= 0;
  return <span className={up ? s.up : s.down}>{up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}{Math.abs(Math.round(value))}{unit}</span>;
}
function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);
  return ref;
}
/** Units sold per product (or variant) since a given day. */
function soldSince(sales: Sale[], since: string) {
  const map = new Map<string, number>();
  for (const x of sales) if (x.date >= since) for (const i of x.items) { map.set(i.productId, (map.get(i.productId) ?? 0) + i.qty); map.set(i.variantId, (map.get(i.variantId) ?? 0) + i.qty); }
  return map;
}
const revenue = (sales: Sale[], from: string, to: string) => sales.filter(x => x.date.slice(0, 10) >= from && x.date.slice(0, 10) <= to).reduce((v, x) => v + saleTotal(x), 0);

function TopBar({ ctx, view }: { ctx: Ctx; view: View }) {
  const { store, today } = ctx;
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'search' | 'bell' | 'user' | null>(null);
  const close = useMemo(() => () => setPanel(null), []);
  const ref = useOutside(!!panel, close);
  const q = query.trim();
  const results = q ? [
    ...store.products.filter(p => has(q, p.name, p.sku, p.category, p.collection)).slice(0, 6).map(p => ({ key: p.id, label: p.name, meta: `${p.category} · ${p.sku} · ${stockOf(p)} un`, run: () => ctx.open('product', p.id) })),
    ...store.clients.filter(c => has(q, c.name, c.phone, c.email)).slice(0, 5).map(c => ({ key: c.id, label: c.name, meta: `Cliente · ${c.phone}`, run: () => ctx.open('client', c.id) })),
  ] : [];
  const low = store.products.filter(p => p.active && lowVariants(p).length);
  const overdue = store.expenses.filter(e => !e.paid && e.due < today);
  const birthdays = store.clients.filter(c => c.birthday.slice(5) === today.slice(5));
  const alerts = [
    ...birthdays.map(c => ({ key: c.id, text: `Hoje é aniversário de ${c.name}. Envie o cupom NIVER20.`, run: () => ctx.open('client', c.id) })),
    ...overdue.map(e => ({ key: e.id, text: `${e.desc}: ${brl(e.value)} venceu em ${dateLabel(e.due)}`, run: () => ctx.go('Financeiro') })),
    ...low.slice(0, 8).map(p => ({ key: p.id, text: `${p.name}: ${plural(lowVariants(p).length, 'variação', 'variações')} com estoque baixo`, run: () => ctx.open('product', p.id) })),
  ];
  return <header className={s.topbar} ref={ref}>
    <button className={s.brand} onClick={() => ctx.go('Visão Geral')} aria-label="Lumière Moda Feminina, ir para a visão geral"><LeafLogo className={s.logoMark} /><span><b className={s.serifText}>LUMIÈRE</b><small>MODA FEMININA</small></span></button>
    <nav className={s.tabs} aria-label="Seções">{views.map(v => <button key={v} className={view === v ? s.tabOn : ''} aria-current={view === v ? 'page' : undefined} onClick={() => ctx.go(v)}>{v}</button>)}</nav>
    <div className={s.tools}>
      <div className={s.search}>
        <Search size={19} />
        <input value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar clientes, produtos..." aria-label="Buscar clientes ou produtos" />
        {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.iconCircle} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={20} />{alerts.length > 0 && <i className={s.dot} />}</button>
        {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Tudo em dia.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.user} onClick={() => setPanel(panel === 'user' ? null : 'user')} aria-label="Menu do usuário" aria-expanded={panel === 'user'}><Avatar name={`${store.settings.owner} Lumière`} size={44} /><ChevronDown size={16} /></button>
        {panel === 'user' && <div className={`${s.popover} ${s.menuPop}`} role="menu"><p className={s.popTitle}>{store.settings.owner}<small>{store.settings.company}</small></p>
          <button role="menuitem" onClick={() => { ctx.setModal({ kind: 'sale' }); setPanel(null); }}>Registrar venda</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'product' }); setPanel(null); }}>Novo produto</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'client' }); setPanel(null); }}>Nova cliente</button><button role="menuitem" onClick={() => { ctx.go('Relatórios'); setPanel(null); }}>Configurações</button></div>}
      </div>
    </div>
  </header>;
}

function Overview({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const [range, setRange] = useState<6 | 12>(6);
  const mk = monthKey(today), prev = monthKey(today, -1);
  const day = Number(today.slice(8));
  const mtd = revenue(store.sales, `${mk}-01`, today);
  const prevSame = revenue(store.sales, `${prev}-01`, `${prev}-${String(Math.min(day, 28)).padStart(2, '0')}`);
  const activeSet = (end: string) => new Set(store.sales.filter(x => x.clientId && x.date.slice(0, 10) > addDays(end, -90) && x.date.slice(0, 10) <= end).map(x => x.clientId));
  const active = activeSet(today).size, activeBefore = activeSet(addDays(today, -30)).size;
  const recurringRate = (m: string) => { const buyers = new Set(store.sales.filter(x => x.clientId && x.date.startsWith(m)).map(x => x.clientId)); const back = [...buyers].filter(c => (stats.get(c)?.first ?? m) < `${m}-01`).length; return buyers.size ? back / buyers.size * 100 : 0; };
  const rec = recurringRate(mk), recPrev = recurringRate(prev);
  const inStock = store.products.filter(p => p.active && stockOf(p) > 0).length;
  const toRestock = store.products.filter(p => p.active && lowVariants(p).length).length;
  const sold = soldSince(store.sales, `${mk}-01`);
  const highlight = [...store.products].filter(p => p.active).sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0)).slice(0, 5);
  const birthdays = store.clients.filter(c => c.birthday.slice(5, 7) === today.slice(5, 7));
  const live = store.campaigns.filter(c => campaignStatus(c, today) === 'Ativa');
  const summary: { label: string; value: string; art: ReactNode; foot: ReactNode; run: () => void }[] = [
    { label: 'Clientes ativos', value: active.toLocaleString('pt-BR'), art: <BagArt />, foot: <Delta value={activeBefore ? (active - activeBefore) / activeBefore * 100 : 0} />, run: () => ctx.go('Clientes') },
    { label: 'Faturamento', value: brl(mtd), art: <GrowthArt />, foot: <Delta value={prevSame ? (mtd - prevSame) / prevSame * 100 : 0} />, run: () => ctx.go('Financeiro') },
    { label: 'Produtos em estoque', value: String(inStock), art: <BoxArt />, foot: <span className={toRestock ? s.warnText : s.up}>{toRestock ? `${toRestock} para repor` : 'Tudo em dia'}</span>, run: () => ctx.go('Estoque') },
    { label: 'Clientes recorrentes', value: pct(rec), art: <PeopleArt />, foot: <Delta value={rec - recPrev} unit=" p.p." />, run: () => ctx.go('Relatórios') },
  ];
  const modules: { title: string; subtitle: string; stat: string; art: ReactNode; run: () => void }[] = [
    { title: 'Produtos', subtitle: 'Estoque e coleções', stat: `${plural(store.products.filter(p => p.active).length, 'produto', 'produtos')} · ${new Set(store.products.map(p => p.collection)).size} coleções`, art: <BlouseArt />, run: () => ctx.go('Produtos') },
    { title: 'Clientes', subtitle: 'Histórico e preferências', stat: plural(birthdays.length, 'aniversariante no mês', 'aniversariantes no mês'), art: <PeopleArt />, run: () => ctx.go('Clientes') },
    { title: 'Estoque', subtitle: 'Controle e reposição', stat: plural(store.products.reduce((v, p) => v + lowVariants(p).length, 0), 'item para repor', 'itens para repor'), art: <BoxArt />, run: () => ctx.go('Estoque') },
    { title: 'Marketing', subtitle: 'Campanhas e redes', stat: plural(live.length, 'campanha ativa', 'campanhas ativas'), art: <MegaphoneArt />, run: () => ctx.go('Marketing') },
  ];
  // Below the fold: stock by category, revenue trend and today's sales.
  const byCat = categories.map(c => ({ c, units: store.products.filter(p => p.category === c).reduce((v, p) => v + stockOf(p), 0) }));
  const units = byCat.reduce((v, x) => v + x.units, 0);
  const months = Array.from({ length: range }, (_, i) => monthKey(today, i - range + 1)).map(m => ({ m, v: revenue(store.sales, `${m}-01`, `${m}-31`) }));
  const peak = Math.max(...months.map(x => x.v), 1);
  const todays = store.sales.filter(x => x.date.startsWith(today)).sort((a, b) => b.date.localeCompare(a.date));
  const todayTotal = todays.reduce((v, x) => v + saleTotal(x), 0);
  const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
  const dailyGoal = store.settings.goal / daysInMonth;
  return <>
    <section className={s.hero}>
      <div className={s.heroText}>
        <p className={s.welcome}>Bem-vindo de volta, <b>{store.settings.owner}</b>!</p>
        <h1 className={s.serifText}>Moda que<br />conecta<br /><span>pessoas.</span></h1>
        <p className={s.lead}>Gerencie sua loja, produtos, clientes <br />e marketing em um só lugar.</p>
        <button className={s.cta} onClick={() => ctx.setModal({ kind: 'product' })}><Plus size={22} />Novo produto</button>
      </div>
      <div className={s.heroSide}>
        <section className={`${s.glassLight} ${s.summary}`} aria-label="Resumo do mês">
          <header><h2>Resumo do mês</h2><button className={s.link} onClick={() => ctx.go('Relatórios')}>Ver relatório<ArrowRight size={15} /></button></header>
          <div className={s.summaryGrid}>{summary.map(x => <button key={x.label} onClick={x.run}><span className={s.summaryArt}>{x.art}</span><b>{x.value}</b><small>{x.label}</small>{x.foot}</button>)}</div>
        </section>
        <section className={`${s.glassLight} ${s.highlight}`} aria-label="Estoque em destaque">
          <header><h2>Estoque em destaque</h2><button className={s.link} onClick={() => ctx.go('Produtos')}>Ver todos<ArrowRight size={15} /></button></header>
          <div className={s.highlightGrid}>{highlight.map(p => <button key={p.id} onClick={() => ctx.open('product', p.id)}><Thumb p={p} /><b>{p.name}</b><small className={lowVariants(p).length ? s.warnText : ''}>{stockOf(p)} un</small></button>)}</div>
        </section>
      </div>
      <section className={s.modules} aria-label="Módulos">{modules.map(m => <button key={m.title} className={`${s.glassDark} ${s.module}`} onClick={m.run}>
        <span className={s.moduleArt}>{m.art}</span>
        <span className={s.moduleText}><b>{m.title}</b><small>{m.subtitle}</small><em>{m.stat}</em></span>
        <i className={s.arrow}><ArrowRight size={20} /></i>
      </button>)}</section>
    </section>
    <section className={s.below} aria-label="Indicadores">
      <div className={`${s.glassLight} ${s.panel}`}>
        <header><h2>Estoque por categoria</h2><button className={s.link} onClick={() => ctx.go('Estoque')}>Ver todos<ArrowRight size={15} /></button></header>
        <div className={s.donutWrap}><Donut parts={byCat.map(x => x.units)} label={units.toLocaleString('pt-BR')} sub="peças" />
          <ul className={s.legendList}>{byCat.map((x, i) => <li key={x.c}><i style={{ background: donutColors[i] }} />{x.c}<b>{units ? pct(x.units / units * 100) : '—'}</b></li>)}</ul></div>
      </div>
      <div className={`${s.glassLight} ${s.panel}`}>
        <header><h2>Evolução do faturamento</h2><select className={s.select} value={range} onChange={e => setRange(Number(e.target.value) as 6 | 12)} aria-label="Período"><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option></select></header>
        <div className={s.bars}>{months.map((x, i) => <div key={x.m} title={`${monthLabel(x.m, 'long')}: ${brl(x.v)}`}>{i === months.length - 1 && <em>{brl(x.v)}</em>}<span><i style={{ height: `${x.v / peak * 100}%` }} className={i === months.length - 1 ? s.barNow : ''} /></span><small>{monthLabel(x.m)}</small></div>)}</div>
      </div>
      <div className={`${s.glassLight} ${s.panel}`}>
        <header><h2>Hoje na loja</h2><button className={s.link} onClick={() => ctx.setModal({ kind: 'sale' })}>Registrar venda<Plus size={15} /></button></header>
        <p className={s.todayDate}>{longDay(today)}</p>
        <div className={s.todayStats}><span>Vendas<b>{todays.length}</b></span><span>Total<b>{brl(todayTotal)}</b></span><span>Ticket médio<b>{todays.length ? brl(todayTotal / todays.length) : '—'}</b></span></div>
        <div className={s.goal}><span>Meta do dia <b>{brl(dailyGoal)}</b></span><span className={s.meter}><i style={{ width: `${Math.min(100, todayTotal / dailyGoal * 100)}%` }} /></span><small>{pct(todayTotal / dailyGoal * 100)} atingido</small></div>
        <ul className={s.rowsList}>{todays.slice(0, 4).map(x => <li key={x.id}><span className={s.stackText}><b>{x.clientId ? ctx.client(x.clientId)?.name : 'Cliente não identificada'}</b><small>{x.date.slice(11, 16)} · {x.channel} · {x.seller}</small></span><strong>{brl(saleTotal(x))}</strong></li>)}{!todays.length && <li className={s.muted}>Nenhuma venda registrada hoje.</li>}</ul>
      </div>
    </section>
  </>;
}

const donutColors = ['#e9798f', '#f19aab', '#f5b6a4', '#f7cdbf', '#efa6b9', '#d9a19a'];
function Donut({ parts, label, sub }: { parts: number[]; label: string; sub: string }) {
  const total = parts.reduce((a, b) => a + b, 0) || 1;
  const r = 40, c = 2 * Math.PI * r;
  const lengths = parts.map(v => v / total * c);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return <svg viewBox="0 0 100 100" className={s.donut} role="img" aria-label={`${label} ${sub}`}>
    {lengths.map((len, i) => <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={donutColors[i % donutColors.length]} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 1)} ${c}`} strokeDashoffset={-starts[i]} transform="rotate(-90 50 50)" />)}
    <text x="50" y="50" textAnchor="middle" className={s.donutValue}>{label}</text><text x="50" y="62" textAnchor="middle" className={s.donutSub}>{sub}</text>
  </svg>;
}

function PageHead({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <div className={s.pageHead}><div><h1>{title}</h1><p>{subtitle}</p></div><div className={s.headActions}>{children}</div></div>;
}
function Stats({ items }: { items: [string, ReactNode, ReactNode?][] }) {
  return <div className={s.stats}>{items.map(([label, value, hint]) => <div key={label}><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</div>)}</div>;
}

function ProductsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [category, setCategory] = useState<Category | ''>('');
  const [collection, setCollection] = useState('');
  const [q, setQ] = useState('');
  const sold = soldSince(store.sales, addDays(today, -30));
  const collections = [...new Set(store.products.map(p => p.collection))];
  const list = store.products.filter(p => (!category || p.category === category) && (!collection || p.collection === collection) && has(q, p.name, p.sku)).sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0));
  const activeList = store.products.filter(p => p.active);
  return <div className={s.page}>
    <PageHead title="Produtos" subtitle="Catálogo, coleções e preços da loja."><button className={s.secondary} onClick={() => ctx.setModal({ kind: 'sale' })}><ShoppingBag size={16} />Registrar venda</button><button className={s.primary} onClick={() => ctx.setModal({ kind: 'product' })}><Plus size={17} />Novo produto</button></PageHead>
    <Stats items={[['Produtos ativos', activeList.length, `${collections.length} coleções`], ['Peças em estoque', activeList.reduce((v, p) => v + stockOf(p), 0).toLocaleString('pt-BR')], ['Preço médio', brl(activeList.reduce((v, p) => v + p.price, 0) / Math.max(1, activeList.length))], ['Margem média', pct(activeList.reduce((v, p) => v + (p.price - p.cost) / p.price, 0) / Math.max(1, activeList.length) * 100), 'sobre o preço de venda']]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}><button aria-pressed={mode === 'grid'} className={mode === 'grid' ? s.segOn : ''} onClick={() => setMode('grid')} aria-label="Grade"><LayoutGrid size={15} /></button><button aria-pressed={mode === 'list'} className={mode === 'list' ? s.segOn : ''} onClick={() => setMode('list')} aria-label="Lista"><List size={15} /></button></div>
        <select className={s.select} value={category} onChange={e => setCategory(e.target.value as Category | '')} aria-label="Categoria"><option value="">Todas as categorias</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
        <select className={s.select} value={collection} onChange={e => setCollection(e.target.value)} aria-label="Coleção"><option value="">Todas as coleções</option>{collections.map(c => <option key={c}>{c}</option>)}</select>
        <label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome ou código" aria-label="Filtrar produtos" /></label>
      </div>
      {mode === 'grid' ? <div className={s.productGrid}>{list.map(p => <button key={p.id} className={`${s.productCard} ${p.active ? '' : s.inactive}`} onClick={() => ctx.open('product', p.id)}>
        <Thumb p={p} /><span className={s.stackText}><b>{p.name}</b><small>{p.category} · {p.collection}</small></span>
        <span className={s.productFoot}><strong>{brl(p.price)}</strong>{!p.active ? <Pill tone={s.tGray}>Inativo</Pill> : stockOf(p) === 0 ? <Pill tone={s.tRed}>Esgotado</Pill> : lowVariants(p).length ? <Pill tone={s.tAmber}>{stockOf(p)} un · repor</Pill> : <Pill tone={s.tGreen}>{stockOf(p)} un</Pill>}</span>
        <small className={s.muted}>{plural(sold.get(p.id) ?? 0, 'vendida', 'vendidas')} em 30 dias</small>
      </button>)}</div> : <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Produto</th><th>Categoria</th><th>Coleção</th><th>Tamanhos</th><th className={s.num}>Estoque</th><th className={s.num}>Vendas 30d</th><th className={s.num}>Preço</th><th className={s.num}>Margem</th></tr></thead>
        <tbody>{list.map(p => <tr key={p.id} onClick={() => ctx.open('product', p.id)} tabIndex={0} onKeyDown={k => k.key === 'Enter' && ctx.open('product', p.id)}>
          <td><span className={s.cell}><Thumb p={p} className={s.thumbSm} /><span className={s.stackText}><b>{p.name}</b><small>{p.sku}</small></span></span></td><td>{p.category}</td><td>{p.collection}</td><td>{[...new Set(p.variants.map(v => v.size))].join(' · ')}</td>
          <td className={`${s.num} ${lowVariants(p).length ? s.warnText : ''}`}>{stockOf(p)}</td><td className={s.num}>{sold.get(p.id) ?? 0}</td><td className={s.num}>{brl(p.price)}</td><td className={s.num}>{pct((p.price - p.cost) / p.price * 100)}</td>
        </tr>)}</tbody>
      </table></div>}
      {!list.length && <p className={s.empty}>Nenhum produto com esses filtros.</p>}
    </section>
  </div>;
}

function ClientsView({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const [segment, setSegment] = useState<Audience>('Todas as clientes');
  const [q, setQ] = useState('');
  const base = audienceOf(store, stats, segment, today);
  const rows = base.filter(c => has(q, c.name, c.phone, c.email)).map(c => ({ c, st: stats.get(c.id) })).sort((a, b) => (b.st?.last ?? '').localeCompare(a.st?.last ?? ''));
  const mk = monthKey(today);
  return <div className={s.page}>
    <PageHead title="Clientes" subtitle="Histórico de compras, preferências e relacionamento."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'client' })}><Plus size={17} />Nova cliente</button></PageHead>
    <Stats items={[['Clientes cadastradas', store.clients.length.toLocaleString('pt-BR')], ['Compraram nos últimos 90 dias', [...stats.values()].filter(v => v.last > addDays(today, -90)).length], ['Novas neste mês', [...stats.values()].filter(v => v.first.startsWith(mk)).length], ['Aniversariantes do mês', store.clients.filter(c => c.birthday.slice(5, 7) === today.slice(5, 7)).length]]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{audiences.map(a => <button key={a} aria-pressed={segment === a} className={segment === a ? s.segOn : ''} onClick={() => setSegment(a)}>{a.replace(' as clientes', '').replace(' do mês', '').replace('Clientes ', '').replace('Inativas há 60 dias', 'Inativas')}</button>)}</div>
        <label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, telefone ou e-mail" aria-label="Filtrar clientes" /></label>
        <span className={s.muted}>{plural(rows.length, 'cliente', 'clientes')}</span>
      </div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Cliente</th><th>Contato</th><th>Tamanho</th><th>Aniversário</th><th>Última compra</th><th className={s.num}>Compras</th><th className={s.num}>Total gasto</th></tr></thead>
        <tbody>{rows.slice(0, 80).map(({ c, st }) => <tr key={c.id} onClick={() => ctx.open('client', c.id)} tabIndex={0} onKeyDown={k => k.key === 'Enter' && ctx.open('client', c.id)}>
          <td><span className={s.cell}><Avatar name={c.name} /><b>{c.name}</b></span></td><td><span className={s.stackText}>{c.phone}<small>{c.email}</small></span></td><td>{c.size}</td><td>{dateLabel(c.birthday).slice(0, 5)}</td>
          <td>{st ? <span className={s.stackText}>{dateLabel(st.last)}<small>há {daysBetween(st.last, today)} dias</small></span> : <span className={s.muted}>Nunca comprou</span>}</td><td className={s.num}>{st?.count ?? 0}</td><td className={s.num}>{st ? brl(st.total) : '—'}</td>
        </tr>)}</tbody>
      </table>{rows.length > 80 && <p className={s.hint}>Mostrando 80 de {rows.length}. Use a busca para encontrar uma cliente.</p>}{!rows.length && <p className={s.empty}>Nenhuma cliente neste filtro.</p>}</div>
    </section>
  </div>;
}

/** Adds stock to a variant and books the purchase as a supplier bill due in 15 days. */
function restock(ctx: Ctx, p: Product, variantId: string, qty: number) {
  const v = p.variants.find(x => x.id === variantId);
  ctx.set(st => ({ products: st.products.map(x => x.id === p.id ? { ...x, variants: x.variants.map(y => y.id === variantId ? { ...y, stock: y.stock + qty } : y) } : x), expenses: [...st.expenses, { id: uid(), desc: `Reposição ${p.name} ${v?.size} ${v?.color}`, category: 'Fornecedores', due: addDays(ctx.today, 15), value: p.cost * qty, paid: false }] }), `${qty} un de ${p.name} (${v?.size} · ${v?.color}) adicionadas ao estoque.`);
}

function StockView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const sold = soldSince(store.sales, addDays(today, -30));
  const low = store.products.filter(p => p.active).flatMap(p => lowVariants(p).map(v => ({ p, v, sold: sold.get(v.id) ?? 0 }))).sort((a, b) => a.v.stock - b.v.stock || b.sold - a.sold);
  const byCat = categories.map(c => { const ps = store.products.filter(p => p.category === c); return { c, units: ps.reduce((v, p) => v + stockOf(p), 0), cost: ps.reduce((v, p) => v + stockOf(p) * p.cost, 0), retail: ps.reduce((v, p) => v + stockOf(p) * p.price, 0), sold: ps.reduce((v, p) => v + (sold.get(p.id) ?? 0), 0) }; });
  const units = byCat.reduce((v, x) => v + x.units, 0);
  return <div className={s.page}>
    <PageHead title="Estoque" subtitle="Peças por tamanho e cor, giro e reposição." />
    <Stats items={[['Peças em estoque', units.toLocaleString('pt-BR')], ['Valor em estoque (custo)', brl(byCat.reduce((v, x) => v + x.cost, 0)), `${brl(byCat.reduce((v, x) => v + x.retail, 0))} a preço de venda`], ['Variações para repor', low.length], ['Esgotadas', low.filter(x => x.v.stock === 0).length]]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Reposição sugerida</h2><span className={s.muted}>Sugestão = vendas dos últimos 30 dias ou o dobro do mínimo, o que for maior.</span></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Produto</th><th>Tamanho</th><th>Cor</th><th className={s.num}>Estoque</th><th className={s.num}>Mínimo</th><th className={s.num}>Vendas 30d</th><th className={s.num}>Custo</th><th /></tr></thead>
        <tbody>{low.slice(0, 40).map(({ p, v, sold: n }) => { const suggest = Math.max(v.min * 2, n) - v.stock; return <tr key={v.id} onClick={() => ctx.open('product', p.id)}>
          <td><span className={s.cell}><Thumb p={p} className={s.thumbSm} /><b>{p.name}</b></span></td><td>{v.size}</td><td><span className={s.swatchText}><i style={{ background: palette[v.color] }} />{v.color}</span></td>
          <td className={`${s.num} ${v.stock === 0 ? s.lateText : s.warnText}`}>{v.stock}</td><td className={s.num}>{v.min}</td><td className={s.num}>{n}</td><td className={s.num}>{brl(p.cost * suggest)}</td>
          <td><button className={s.chip} onClick={e => { e.stopPropagation(); restock(ctx, p, v.id, suggest); }}>Repor +{suggest}</button></td>
        </tr>; })}</tbody>
      </table>{!low.length && <p className={s.empty}>Nenhuma variação abaixo do mínimo.</p>}</div>
    </section>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Estoque por categoria</h2></div>
      <div className={s.donutRow}><Donut parts={byCat.map(x => x.units)} label={units.toLocaleString('pt-BR')} sub="peças" />
        <div className={s.tableWrap}><table className={`${s.table} ${s.tableStatic}`}>
          <thead><tr><th>Categoria</th><th className={s.num}>Peças</th><th className={s.num}>%</th><th className={s.num}>Vendas 30d</th><th className={s.num}>Custo</th><th className={s.num}>Preço de venda</th></tr></thead>
          <tbody>{byCat.map((x, i) => <tr key={x.c}><td><span className={s.swatchText}><i style={{ background: donutColors[i] }} />{x.c}</span></td><td className={s.num}>{x.units}</td><td className={s.num}>{units ? pct(x.units / units * 100) : '—'}</td><td className={s.num}>{x.sold}</td><td className={s.num}>{brl(x.cost)}</td><td className={s.num}>{brl(x.retail)}</td></tr>)}</tbody>
        </table></div></div>
    </section>
  </div>;
}

function MarketingView({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const birthdays = store.clients.filter(c => c.birthday.slice(5, 7) === today.slice(5, 7)).sort((a, b) => a.birthday.slice(8).localeCompare(b.birthday.slice(8)));
  const results = (c: Campaign) => { const list = store.sales.filter(x => x.coupon === c.coupon && x.date.slice(0, 10) >= c.start && x.date.slice(0, 10) <= c.end); return { uses: list.length, revenue: list.reduce((v, x) => v + saleTotal(x), 0) }; };
  const all = store.campaigns.map(c => ({ c, st: campaignStatus(c, today), ...results(c) })).sort((a, b) => b.c.start.localeCompare(a.c.start));
  const year = all.filter(x => x.c.start >= addDays(today, -365));
  return <div className={s.page}>
    <PageHead title="Marketing" subtitle="Campanhas, cupons e relacionamento com as clientes."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'campaign' })}><Plus size={17} />Nova campanha</button></PageHead>
    <Stats items={[['Campanhas ativas', all.filter(x => x.st === 'Ativa').length], ['Vendas com cupom (12 meses)', year.reduce((v, x) => v + x.uses, 0)], ['Receita atribuída', brl(year.reduce((v, x) => v + x.revenue, 0))], ['Investimento', brl(year.reduce((v, x) => v + x.c.budget, 0))]]} />
    <div className={s.campaignGrid}>{all.map(({ c, st, uses, revenue: rev }) => <button key={c.id} className={s.campaign} onClick={() => ctx.setModal({ kind: 'campaign', id: c.id })}>
      <header><Pill tone={st === 'Ativa' ? s.tGreen : st === 'Agendada' ? s.tBlue : s.tGray}>{st}</Pill><span>{c.channel}</span></header>
      <b>{c.name}</b><small>{dateLabel(c.start)} → {dateLabel(c.end)} · {c.audience} ({audienceOf(store, stats, c.audience, today).length})</small>
      <span className={s.coupon}>{c.coupon} · {c.discountPct}% off</span>
      <dl><div><dt>Usos</dt><dd>{uses}</dd></div><div><dt>Receita</dt><dd>{compact(rev)}</dd></div><div><dt>Retorno</dt><dd>{c.budget && st !== 'Agendada' ? `${(rev / c.budget).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×` : '—'}</dd></div></dl>
    </button>)}</div>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Aniversariantes de {monthLabel(today.slice(0, 7), 'long')}</h2><span className={s.muted}>Mensagem pronta com o cupom NIVER20 pelo WhatsApp.</span></div>
      <ul className={s.birthdayGrid}>{birthdays.slice(0, 24).map(c => <li key={c.id}><Avatar name={c.name} /><button className={s.stackText} onClick={() => ctx.open('client', c.id)}><b>{c.name}</b><small>{dateLabel(c.birthday).slice(0, 5)}{c.birthday.slice(5) === today.slice(5) ? ' · hoje!' : ''}</small></button><a className={s.iconBtn} href={whatsapp(c.phone, `Oi, ${c.name.split(' ')[0]}! Feliz aniversário 🎉 Use o cupom NIVER20 e ganhe 20% na Lumière este mês.`)} target="_blank" rel="noreferrer" aria-label={`Enviar WhatsApp para ${c.name}`}><MessageCircle size={17} /></a></li>)}</ul>
      {birthdays.length > 24 && <p className={s.hint}>E mais {birthdays.length - 24} aniversariantes neste mês.</p>}
    </section>
  </div>;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const mk = monthKey(today);
  const monthSales = store.sales.filter(x => x.date.startsWith(mk));
  const income = monthSales.reduce((v, x) => v + saleTotal(x), 0);
  const cogs = monthSales.reduce((v, x) => v + x.items.reduce((a, i) => a + i.qty * (ctx.product(i.productId)?.cost ?? 0), 0), 0);
  const expenses = store.expenses.filter(e => e.due.startsWith(mk)).reduce((v, e) => v + e.value, 0);
  const months = Array.from({ length: 12 }, (_, i) => monthKey(today, i - 11)).map(m => ({ m, in: revenue(store.sales, `${m}-01`, `${m}-31`), out: store.expenses.filter(e => e.due.startsWith(m)).reduce((v, e) => v + e.value, 0) }));
  const peak = Math.max(...months.flatMap(x => [x.in, x.out]), 1);
  const bills = store.expenses.filter(e => !e.paid).sort((a, b) => a.due.localeCompare(b.due));
  const recent = [...store.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  return <div className={s.page}>
    <PageHead title="Financeiro" subtitle="Vendas, despesas e resultado da loja.">
      <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'expense' })}><Plus size={16} />Nova despesa</button>
      <button className={s.primary} onClick={() => ctx.setModal({ kind: 'sale' })}><ShoppingBag size={16} />Registrar venda</button>
    </PageHead>
    <Stats items={[[`Faturamento de ${monthLabel(mk, 'long')}`, brl(income), `${pct(income / store.settings.goal * 100)} da meta de ${compact(store.settings.goal)}`], ['Ticket médio', brl(income / Math.max(1, monthSales.length)), plural(monthSales.length, 'venda', 'vendas')], ['Despesas do mês', brl(expenses)], ['Resultado estimado', brl(income - cogs - expenses), 'faturamento − custo das peças − despesas']]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Receitas e despesas (12 meses)</h2><span className={s.legend}><i className={s.lIn} />Vendas<i className={s.lOut} />Despesas</span></div>
      <div className={s.chart}>{months.map(x => <div key={x.m} title={`${monthLabel(x.m, 'long')}: vendas ${brl(x.in)} · despesas ${brl(x.out)}`} className={x.m === mk ? s.chartNow : ''}><span><i className={s.lIn} style={{ height: `${x.in / peak * 100}%` }} /><i className={s.lOut} style={{ height: `${x.out / peak * 100}%` }} /></span><small>{monthLabel(x.m)}</small></div>)}</div>
    </section>
    <div className={s.twoCol}>
      <section className={s.card}>
        <div className={s.cardHead}><h2>Vendas recentes</h2></div>
        <ul className={s.rowsList}>{recent.map(x => <li key={x.id}><span className={s.stackText}><b>{x.code} · {x.clientId ? ctx.client(x.clientId)?.name : 'Cliente não identificada'}</b><small>{dateLabel(x.date)} {x.date.slice(11, 16)} · {x.channel} · {x.payment} · {plural(x.items.reduce((v, i) => v + i.qty, 0), 'peça', 'peças')}{x.coupon ? ` · ${x.coupon}` : ''}</small></span><strong>{brl(saleTotal(x))}</strong></li>)}</ul>
      </section>
      <section className={s.card}>
        <div className={s.cardHead}><h2>Contas a pagar</h2><span className={s.muted}>{brl(bills.reduce((v, e) => v + e.value, 0))}</span></div>
        <ul className={s.rowsList}>{bills.map(e => <li key={e.id}><span className={s.stackText}><b>{e.desc}</b><small className={e.due < today ? s.lateText : ''}>{e.category} · {dateLabel(e.due)}{e.due < today ? ' · vencida' : ''}</small></span><strong>{brl(e.value)}</strong><button className={s.chip} onClick={() => ctx.set(st => ({ expenses: st.expenses.map(y => y.id === e.id ? { ...y, paid: true } : y) }), `${e.desc} paga.`)}>Pagar</button></li>)}{!bills.length && <li className={s.muted}>Nenhuma conta em aberto.</li>}</ul>
      </section>
    </div>
  </div>;
}

function Bars({ rows }: { rows: { k: string; v: number }[] }) {
  const max = Math.max(...rows.map(r => r.v), 1);
  return <ul className={s.hbars}>{rows.map(r => <li key={r.k}><span>{r.k}</span><span className={s.meter}><i style={{ width: `${r.v / max * 100}%` }} /></span><b>{compact(r.v)}</b></li>)}</ul>;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const [form, setForm] = useState({ ...store.settings, goal: String(store.settings.goal) });
  const year = store.sales.filter(x => x.date >= addDays(today, -365));
  const lines = year.flatMap(x => x.items.map(i => ({ x, i, p: ctx.product(i.productId) })));
  const group = <K extends string>(keys: readonly K[], key: (l: (typeof lines)[number]) => string) => keys.map(k => ({ k, v: lines.filter(l => key(l) === k).reduce((a, l) => a + l.i.qty * l.i.price, 0) }));
  const byCategory = group(categories, l => l.p?.category ?? '');
  const byChannel = channels.map(k => ({ k, v: year.filter(x => x.channel === k).reduce((a, x) => a + saleTotal(x), 0) }));
  const bySeller = sellers.map(k => ({ k, v: year.filter(x => x.seller === k).reduce((a, x) => a + saleTotal(x), 0) }));
  const top = [...stats.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  return <div className={s.page}>
    <PageHead title="Relatórios" subtitle="Últimos 12 meses, exportações e configurações." />
    <Stats items={[['Faturamento (12 meses)', brl(year.reduce((v, x) => v + saleTotal(x), 0))], ['Vendas', year.length.toLocaleString('pt-BR')], ['Peças por venda', (lines.reduce((v, l) => v + l.i.qty, 0) / Math.max(1, year.length)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })], ['Clientes que voltaram', pct([...stats.values()].filter(v => v.count > 1).length / Math.max(1, stats.size) * 100), 'compraram mais de uma vez']]} />
    <div className={s.twoCol}>
      <section className={s.card}><div className={s.cardHead}><h2>Vendas por categoria</h2></div><Bars rows={byCategory} /></section>
      <section className={s.card}><div className={s.cardHead}><h2>Vendas por canal</h2></div><Bars rows={byChannel} /></section>
      <section className={s.card}><div className={s.cardHead}><h2>Vendas por vendedora</h2></div><Bars rows={bySeller} /></section>
      <section className={s.card}><div className={s.cardHead}><h2>Melhores clientes</h2></div><ul className={s.rowsList}>{top.map(([id, st]) => { const c = ctx.client(id); return c && <li key={id}><Avatar name={c.name} /><button className={s.stackText} onClick={() => ctx.open('client', id)}><b>{c.name}</b><small>{plural(st.count, 'compra', 'compras')} · última em {dateLabel(st.last)}</small></button><strong>{brl(st.total)}</strong></li>; })}</ul></section>
    </div>
    <section className={s.card}><div className={s.cardHead}><h2>Exportações e dados</h2></div><div className={s.exportList}>
      <button className={s.secondary} onClick={() => download('lumiere-vendas.csv', csv([['Código', 'Data', 'Cliente', 'Canal', 'Pagamento', 'Vendedora', 'Peças', 'Desconto', 'Total', 'Cupom'], ...store.sales.map(x => [x.code, x.date.replace('T', ' '), ctx.client(x.clientId)?.name ?? '', x.channel, x.payment, x.seller, x.items.reduce((v, i) => v + i.qty, 0), x.discount, saleTotal(x), x.coupon])]), 'text/csv')}><Download size={16} />Vendas (CSV)</button>
      <button className={s.secondary} onClick={() => download('lumiere-estoque.csv', csv([['SKU', 'Produto', 'Categoria', 'Coleção', 'Tamanho', 'Cor', 'Estoque', 'Mínimo', 'Preço', 'Custo'], ...store.products.flatMap(p => p.variants.map(v => [p.sku, p.name, p.category, p.collection, v.size, v.color, v.stock, v.min, p.price, p.cost]))]), 'text/csv')}><Download size={16} />Estoque (CSV)</button>
      <button className={s.secondary} onClick={() => download('lumiere-backup.json', JSON.stringify(store), 'application/json')}><Download size={16} />Backup completo (JSON)</button>
      <button className={s.secondary} onClick={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) ctx.set(() => makeSeed(), 'Dados de exemplo restaurados.'); }}><RotateCcw size={16} />Restaurar dados de exemplo</button>
    </div></section>
    <section className={s.card}><div className={s.cardHead}><h2>Configurações</h2></div>
      <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(() => ({ settings: { owner: form.owner, company: form.company, goal: num(form.goal) || store.settings.goal } }), 'Configurações salvas.'); }}>
        <label className={s.field}><span>Nome da loja</span><input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
        <label className={s.field}><span>Responsável</span><input required value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
        <label className={s.field}><span>Meta de vendas mensal (R$)</span><input inputMode="decimal" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
        <div className={s.wide}><button className={s.primary} type="submit">Salvar</button></div>
      </form>
    </section>
  </div>;
}

function Shell({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.modal} ${serif.variable} ${wide ? s.modalWide : ''}`} aria-describedby={undefined}>
      <header className={s.modalHead}><Dialog.Title>{title}</Dialog.Title><Dialog.Close className={s.iconBtn} aria-label="Fechar"><X size={18} /></Dialog.Close></header>
      {children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

function ProductForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const { store, today } = ctx;
  const editing = id ? ctx.product(id) : undefined;
  const [f, setF] = useState(() => ({ name: editing?.name ?? '', category: (editing?.category ?? 'Vestidos') as Category, collection: editing?.collection ?? 'Verão 2027', price: String(editing?.price ?? ''), cost: String(editing?.cost ?? ''), sizes: editing ? [...new Set(editing.variants.map(v => v.size))] : ['P', 'M', 'G'], colors: editing ? [...new Set(editing.variants.map(v => v.color))] : ['Rosa'], stock: '3', min: '2' }));
  const toggle = (list: string[], v: string) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];
  const sizeOptions = f.category === 'Calças' || f.category === 'Saias' ? ['36', '38', '40', '42', '44', ...sizesAll] : sizesAll;
  return <Shell title={editing ? 'Editar produto' : 'Novo produto'} onClose={onClose} wide>
    <form className={s.form} onSubmit={e => {
      e.preventDefault(); if (!f.sizes.length || !f.colors.length) return;
      // Keeps the stock of variants that still exist; new size/colour pairs start with the initial stock.
      const variants = f.colors.flatMap(color => f.sizes.map(size => editing?.variants.find(v => v.size === size && v.color === color) ?? { id: uid(), size, color, stock: num(f.stock), min: num(f.min) }));
      const data = { name: f.name.trim(), category: f.category, collection: f.collection.trim() || 'Essenciais', price: num(f.price), cost: num(f.cost), variants };
      if (editing) ctx.set(st => ({ products: st.products.map(p => p.id === editing.id ? { ...p, ...data } : p) }), 'Produto atualizado.');
      else ctx.set(st => ({ products: [{ id: uid(), sku: `LM-${1001 + st.products.length}`, active: true, createdAt: today, ...data }, ...st.products] }), `${data.name} cadastrado com ${plural(variants.length, 'variação', 'variações')}.`);
      onClose();
    }}>
      <label className={s.field}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Vestido Clara" /></label>
      <label className={s.field}><span>Categoria</span><select value={f.category} onChange={e => setF({ ...f, category: e.target.value as Category })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className={s.field}><span>Coleção</span><input list="lm-collections" value={f.collection} onChange={e => setF({ ...f, collection: e.target.value })} /><datalist id="lm-collections">{[...new Set(store.products.map(p => p.collection))].map(c => <option key={c} value={c} />)}</datalist></label>
      <span />
      <label className={s.field}><span>Preço de venda (R$)</span><input inputMode="decimal" required value={f.price} onChange={e => setF({ ...f, price: e.target.value.replace(/[^\d,]/g, '') })} /></label>
      <label className={s.field}><span>Custo (R$)</span><input inputMode="decimal" required value={f.cost} onChange={e => setF({ ...f, cost: e.target.value.replace(/[^\d,]/g, '') })} />{num(f.price) > 0 && num(f.cost) > 0 && <small className={s.muted}>Margem de {pct((num(f.price) - num(f.cost)) / num(f.price) * 100)}</small>}</label>
      <fieldset className={`${s.field} ${s.wide}`}><span>Tamanhos</span><div className={s.chips}>{sizeOptions.map(z => <button type="button" key={z} aria-pressed={f.sizes.includes(z)} className={`${s.chip} ${f.sizes.includes(z) ? s.chipOn : ''}`} onClick={() => setF({ ...f, sizes: toggle(f.sizes, z) })}>{z}</button>)}</div></fieldset>
      <fieldset className={`${s.field} ${s.wide}`}><span>Cores</span><div className={s.chips}>{Object.keys(palette).map(c => <button type="button" key={c} aria-pressed={f.colors.includes(c)} className={`${s.chip} ${f.colors.includes(c) ? s.chipOn : ''}`} onClick={() => setF({ ...f, colors: toggle(f.colors, c) })}><i className={s.swatch} style={{ background: palette[c] }} />{c}</button>)}</div></fieldset>
      {!editing && <><label className={s.field}><span>Estoque inicial por variação</span><input inputMode="numeric" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value.replace(/\D/g, '') })} /></label>
        <label className={s.field}><span>Estoque mínimo</span><input inputMode="numeric" value={f.min} onChange={e => setF({ ...f, min: e.target.value.replace(/\D/g, '') })} /></label></>}
      <p className={`${s.hint} ${s.wide}`}>{plural(f.sizes.length * f.colors.length, 'variação será criada', 'variações serão criadas')} ({f.sizes.length} tamanhos × {f.colors.length} cores).</p>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit" disabled={!f.sizes.length || !f.colors.length}>{editing ? 'Salvar alterações' : 'Cadastrar produto'}</button></footer>
    </form>
  </Shell>;
}

function ClientForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const c = id ? ctx.client(id) : undefined;
  const [f, setF] = useState({ name: c?.name ?? '', phone: c?.phone ?? '', email: c?.email ?? '', birthday: c?.birthday ?? '', size: c?.size ?? 'M', notes: c?.notes ?? '' });
  return <Shell title={c ? 'Editar cliente' : 'Nova cliente'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (c) ctx.set(st => ({ clients: st.clients.map(x => x.id === c.id ? { ...x, ...f } : x) }), 'Cliente atualizada.'); else ctx.set(st => ({ clients: [{ id: uid(), createdAt: ctx.today, ...f }, ...st.clients] }), `${f.name} cadastrada.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>WhatsApp</span><input required value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="(81) 9..." /></label>
      <label className={s.field}><span>E-mail</span><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
      <label className={s.field}><span>Aniversário</span><input type="date" value={f.birthday} onChange={e => setF({ ...f, birthday: e.target.value })} /></label>
      <label className={s.field}><span>Tamanho</span><select value={f.size} onChange={e => setF({ ...f, size: e.target.value })}>{['PP', 'P', 'M', 'G', 'GG'].map(z => <option key={z}>{z}</option>)}</select></label>
      <label className={`${s.field} ${s.wide}`}><span>Preferências e observações</span><textarea rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function SaleForm({ ctx, preset, onClose }: { ctx: Ctx; preset?: string; onClose: () => void }) {
  const { store, today } = ctx;
  const available = store.products.filter(p => p.active && stockOf(p) > 0).sort((a, b) => a.name.localeCompare(b.name));
  const firstLine = () => { const p = available[0]; const v = p?.variants.find(x => x.stock > 0); return { key: uid(), productId: p?.id ?? '', variantId: v?.id ?? '', qty: 1 }; };
  const [lines, setLines] = useState(() => [firstLine()]);
  const [f, setF] = useState({ clientId: preset ?? '', channel: 'Loja' as Channel, payment: 'Pix' as Payment, seller: sellers[0], coupon: '' });
  const campaign = store.campaigns.find(c => c.coupon && c.coupon === f.coupon.trim().toUpperCase() && campaignStatus(c, today) === 'Ativa');
  const sub = lines.reduce((v, l) => v + l.qty * (ctx.product(l.productId)?.price ?? 0), 0);
  const discount = campaign ? Math.round(sub * campaign.discountPct / 100) : 0;
  const over = lines.some(l => { const v = ctx.product(l.productId)?.variants.find(x => x.id === l.variantId); return !v || l.qty > v.stock; });
  const setLine = (key: string, patch: Partial<(typeof lines)[number]>) => setLines(lines.map(l => l.key === key ? { ...l, ...patch } : l));
  const clients = useMemo(() => [...store.clients].sort((a, b) => a.name.localeCompare(b.name)), [store.clients]);
  return <Shell title="Registrar venda" onClose={onClose} wide>
    <form className={s.form} onSubmit={e => {
      e.preventDefault(); if (over || !lines.length) return;
      const now = new Date();
      const sale: Sale = { id: uid(), code: `V${String(store.next).padStart(5, '0')}`, date: `${today}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, clientId: f.clientId, channel: f.channel, payment: f.payment, seller: f.seller, discount, coupon: campaign?.coupon ?? '', items: lines.map(l => ({ productId: l.productId, variantId: l.variantId, qty: l.qty, price: ctx.product(l.productId)?.price ?? 0 })) };
      ctx.set(st => ({ next: st.next + 1, sales: [...st.sales, sale], products: st.products.map(p => ({ ...p, variants: p.variants.map(v => { const taken = lines.filter(l => l.variantId === v.id).reduce((a, l) => a + l.qty, 0); return taken ? { ...v, stock: v.stock - taken } : v; }) })) }), `Venda ${sale.code} de ${brl(saleTotal(sale))} registrada.`);
      onClose();
    }}>
      <label className={s.field}><span>Cliente</span><select value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}><option value="">Cliente não identificada</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className={s.field}><span>Vendedora</span><select value={f.seller} onChange={e => setF({ ...f, seller: e.target.value })}>{sellers.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>Canal</span><select value={f.channel} onChange={e => setF({ ...f, channel: e.target.value as Channel })}>{channels.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>Pagamento</span><select value={f.payment} onChange={e => setF({ ...f, payment: e.target.value as Payment })}>{payments.map(x => <option key={x}>{x}</option>)}</select></label>
      <div className={`${s.wide} ${s.items}`}>
        {lines.map(l => { const p = ctx.product(l.productId); const v = p?.variants.find(x => x.id === l.variantId); return <div key={l.key} className={s.itemRow}>
          <select value={l.productId} onChange={e => { const np = ctx.product(e.target.value); setLine(l.key, { productId: e.target.value, variantId: np?.variants.find(x => x.stock > 0)?.id ?? '', qty: 1 }); }} aria-label="Produto">{available.map(x => <option key={x.id} value={x.id}>{x.name} · {brl(x.price)}</option>)}</select>
          <select value={l.variantId} onChange={e => setLine(l.key, { variantId: e.target.value, qty: 1 })} aria-label="Tamanho e cor">{p?.variants.map(x => <option key={x.id} value={x.id} disabled={x.stock === 0}>{x.size} · {x.color} ({x.stock})</option>)}</select>
          <span className={s.stepper}><button type="button" onClick={() => setLine(l.key, { qty: Math.max(1, l.qty - 1) })} aria-label="Menos uma"><Minus size={14} /></button><b>{l.qty}</b><button type="button" onClick={() => setLine(l.key, { qty: l.qty + 1 })} disabled={!!v && l.qty >= v.stock} aria-label="Mais uma"><Plus size={14} /></button></span>
          <b className={s.num}>{brl(l.qty * (p?.price ?? 0))}</b>
          <button type="button" className={s.iconBtn} disabled={lines.length === 1} onClick={() => setLines(lines.filter(x => x.key !== l.key))} aria-label="Remover peça"><Trash2 size={15} /></button>
        </div>; })}
        <div className={s.itemsFoot}><button type="button" className={s.chip} onClick={() => setLines([...lines, firstLine()])}><Plus size={14} /> Adicionar peça</button>
          <label className={s.couponField}><span>Cupom</span><input value={f.coupon} onChange={e => setF({ ...f, coupon: e.target.value.toUpperCase() })} placeholder="Ex.: VERAO10" />{f.coupon && <small className={campaign ? s.up : s.lateText}>{campaign ? `${campaign.discountPct}% de desconto` : 'Cupom inválido ou fora do período'}</small>}</label>
          <span className={s.totals}>{discount > 0 && <small>Subtotal {brl(sub)} · desconto −{brl(discount)}</small>}Total <b>{brl(sub - discount)}</b></span></div>
      </div>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit" disabled={over}><Check size={16} />Finalizar venda</button></footer>
    </form>
  </Shell>;
}

function CampaignForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const { store, today, stats } = ctx;
  const c = id ? store.campaigns.find(x => x.id === id) : undefined;
  const [f, setF] = useState({ name: c?.name ?? '', channel: c?.channel ?? 'Instagram', audience: (c?.audience ?? 'Todas as clientes') as Audience, coupon: c?.coupon ?? '', discountPct: String(c?.discountPct ?? 10), start: c?.start ?? today, end: c?.end ?? addDays(today, 14), budget: String(c?.budget ?? ''), reach: c?.reach ?? 0 });
  const size = audienceOf(store, stats, f.audience, today).length;
  return <Shell title={c ? 'Editar campanha' : 'Nova campanha'} onClose={onClose} wide>
    <form className={s.form} onSubmit={e => { e.preventDefault(); const data = { ...f, coupon: f.coupon.trim().toUpperCase(), discountPct: num(f.discountPct), budget: num(f.budget), channel: f.channel as Campaign['channel'], end: f.end < f.start ? f.start : f.end }; if (c) ctx.set(st => ({ campaigns: st.campaigns.map(x => x.id === c.id ? { ...x, ...data } : x) }), 'Campanha atualizada.'); else ctx.set(st => ({ campaigns: [{ id: uid(), ...data }, ...st.campaigns] }), `Campanha ${data.name} criada.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Lançamento coleção Outono" /></label>
      <label className={s.field}><span>Canal</span><select value={f.channel} onChange={e => setF({ ...f, channel: e.target.value as Campaign['channel'] })}>{campaignChannels.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>Público</span><select value={f.audience} onChange={e => setF({ ...f, audience: e.target.value as Audience })}>{audiences.map(x => <option key={x}>{x}</option>)}</select><small className={s.muted}>{plural(size, 'cliente', 'clientes')} neste público</small></label>
      <label className={s.field}><span>Cupom</span><input required value={f.coupon} onChange={e => setF({ ...f, coupon: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="Ex.: OUTONO10" /></label>
      <label className={s.field}><span>Desconto (%)</span><input inputMode="numeric" value={f.discountPct} onChange={e => setF({ ...f, discountPct: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></label>
      <label className={s.field}><span>Início</span><input type="date" required value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /></label>
      <label className={s.field}><span>Fim</span><input type="date" required value={f.end} min={f.start} onChange={e => setF({ ...f, end: e.target.value })} /></label>
      <label className={s.field}><span>Investimento (R$)</span><input inputMode="decimal" value={f.budget} onChange={e => setF({ ...f, budget: e.target.value.replace(/[^\d,]/g, '') })} placeholder="0" /></label>
      <footer className={s.modalFoot}>{c && <button type="button" className={s.dangerBtn} onClick={() => { ctx.set(st => ({ campaigns: st.campaigns.filter(x => x.id !== c.id) }), 'Campanha excluída.'); onClose(); }}>Excluir</button>}<Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function ExpenseForm({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const [f, setF] = useState({ desc: '', category: expenseCategories[1], due: ctx.today, value: '' });
  return <Shell title="Nova despesa" onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(st => ({ expenses: [...st.expenses, { id: uid(), desc: f.desc.trim(), category: f.category, due: f.due, value: num(f.value), paid: false }] }), 'Despesa lançada.'); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Descrição</span><input required value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></label>
      <label className={s.field}><span>Categoria</span><select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{expenseCategories.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>Vencimento</span><input type="date" required value={f.due} onChange={e => setF({ ...f, due: e.target.value })} /></label>
      <label className={s.field}><span>Valor (R$)</span><input inputMode="decimal" required value={f.value} onChange={e => setF({ ...f, value: e.target.value.replace(/[^\d,]/g, '') })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Lançar</button></footer>
    </form>
  </Shell>;
}

function DrawerShell({ title, kicker, sub, art, onClose, children }: { title: string; kicker: string; sub: ReactNode; art: ReactNode; onClose: () => void; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={o => !o && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.drawer} ${serif.variable}`} aria-describedby={undefined}>
      <div className={s.drawerHead}>{art}<div><small>{kicker}</small><Dialog.Title className={s.serifText}>{title}</Dialog.Title><p>{sub}</p></div><Dialog.Close className={s.iconBtn} aria-label="Fechar"><X size={18} /></Dialog.Close></div>
      <div className={s.drawerBody}>{children}</div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

function ProductDrawer({ ctx, p, onClose }: { ctx: Ctx; p: Product; onClose: () => void }) {
  const { store, today } = ctx;
  const sold30 = soldSince(store.sales, addDays(today, -30));
  const sizes = [...new Set(p.variants.map(v => v.size))], colors = [...new Set(p.variants.map(v => v.color))];
  const history = store.sales.filter(x => x.items.some(i => i.productId === p.id)).sort((a, b) => b.date.localeCompare(a.date));
  const units90 = history.filter(x => x.date >= addDays(today, -90)).reduce((v, x) => v + x.items.filter(i => i.productId === p.id).reduce((a, i) => a + i.qty, 0), 0);
  const setStock = (vid: string, stock: number) => ctx.set(st => ({ products: st.products.map(x => x.id === p.id ? { ...x, variants: x.variants.map(v => v.id === vid ? { ...v, stock: Math.max(0, stock) } : v) } : x) }));
  return <DrawerShell title={p.name} kicker={`${p.category} · ${p.sku}`} sub={`${p.collection} · ${brl(p.price)}`} art={<Thumb p={p} className={s.drawerThumb} />} onClose={onClose}>
    <div className={s.stack}>
      <div className={s.factGrid}><span>Em estoque<b>{stockOf(p)} un</b></span><span>Vendidas em 30 dias<b>{sold30.get(p.id) ?? 0}</b></span><span>Vendidas em 90 dias<b>{units90}</b></span><span>Preço<b>{brl(p.price)}</b></span><span>Custo<b>{brl(p.cost)}</b></span><span>Margem<b>{pct((p.price - p.cost) / p.price * 100)}</b></span></div>
      <section className={s.block}><h3>Grade de estoque</h3>
        <div className={s.tableWrap}><table className={s.gridTable}><thead><tr><th />{sizes.map(z => <th key={z}>{z}</th>)}</tr></thead>
          <tbody>{colors.map(c => <tr key={c}><th><span className={s.swatchText}><i style={{ background: palette[c] }} />{c}</span></th>{sizes.map(z => { const v = p.variants.find(x => x.size === z && x.color === c); return <td key={z}>{v ? <input className={v.stock <= v.min ? s.lowInput : ''} inputMode="numeric" value={v.stock} onChange={e => setStock(v.id, Number(e.target.value.replace(/\D/g, '')) || 0)} aria-label={`Estoque ${c} ${z}`} /> : '—'}</td>; })}</tr>)}</tbody></table></div>
        <p className={s.hint}>Células em rosa estão no mínimo ou abaixo dele. Edite o número para ajustar o estoque.</p>
      </section>
      <section className={s.block}><h3>Últimas vendas</h3>
        <ul className={s.rowsList}>{history.slice(0, 8).map(x => { const items = x.items.filter(i => i.productId === p.id); return <li key={x.id}><span className={s.stackText}><b>{x.clientId ? ctx.client(x.clientId)?.name : 'Cliente não identificada'}</b><small>{dateLabel(x.date)} · {items.map(i => { const v = p.variants.find(y => y.id === i.variantId); return `${i.qty}× ${v?.size ?? ''} ${v?.color ?? ''}`; }).join(', ')} · {x.channel}</small></span><strong>{brl(items.reduce((a, i) => a + i.qty * i.price, 0))}</strong></li>; })}{!history.length && <li className={s.muted}>Ainda sem vendas.</li>}</ul>
      </section>
      <div className={s.drawerActions}>
        <button className={s.primary} disabled={!stockOf(p) || !p.active} onClick={() => { onClose(); ctx.setModal({ kind: 'sale' }); }}><ShoppingBag size={16} />Vender</button>
        <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'product', id: p.id })}>Editar produto</button>
        <button className={s.secondary} onClick={() => ctx.set(st => ({ products: st.products.map(x => x.id === p.id ? { ...x, active: !x.active } : x) }), p.active ? 'Produto inativado.' : 'Produto reativado.')}>{p.active ? 'Inativar' : 'Reativar'}</button>
      </div>
    </div>
  </DrawerShell>;
}

function ClientDrawer({ ctx, c, onClose }: { ctx: Ctx; c: Client; onClose: () => void }) {
  const { store, today, stats } = ctx;
  const st = stats.get(c.id);
  const history = store.sales.filter(x => x.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const cats = categories.map(k => ({ k, n: history.reduce((v, x) => v + x.items.filter(i => ctx.product(i.productId)?.category === k).reduce((a, i) => a + i.qty, 0), 0) })).filter(x => x.n).sort((a, b) => b.n - a.n);
  const [notes, setNotes] = useState(c.notes);
  return <DrawerShell title={c.name} kicker={`Cliente desde ${dateLabel(c.createdAt)}`} sub={`${c.phone}${c.email ? ` · ${c.email}` : ''}`} art={<Avatar name={c.name} size={64} />} onClose={onClose}>
    <div className={s.stack}>
      <div className={s.factGrid}><span>Compras<b>{st?.count ?? 0}</b></span><span>Total gasto<b>{st ? brl(st.total) : '—'}</b></span><span>Ticket médio<b>{st ? brl(st.total / st.count) : '—'}</b></span><span>Última compra<b>{st ? `há ${daysBetween(st.last, today)} dias` : '—'}</b></span><span>Tamanho<b>{c.size}</b></span><span>Aniversário<b>{c.birthday ? dateLabel(c.birthday).slice(0, 5) : '—'}</b></span></div>
      {cats.length > 0 && <section className={s.block}><h3>Categorias favoritas</h3><div className={s.chips}>{cats.map(x => <span key={x.k} className={`${s.chip} ${s.chipStatic}`}>{x.k} · {x.n}</span>)}</div></section>}
      <label className={s.field}><span>Preferências e observações</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => notes !== c.notes && ctx.set(x => ({ clients: x.clients.map(y => y.id === c.id ? { ...y, notes } : y) }), 'Observações salvas.')} placeholder="Estilo, cores preferidas, peças desejadas..." /></label>
      <section className={s.block}><h3>Histórico de compras</h3>
        <ul className={s.rowsList}>{history.slice(0, 12).map(x => <li key={x.id}><span className={s.stackText}><b>{x.items.map(i => `${i.qty > 1 ? `${i.qty}× ` : ''}${ctx.product(i.productId)?.name ?? 'Produto removido'}`).join(', ')}</b><small>{dateLabel(x.date)} · {x.channel} · {x.seller}{x.coupon ? ` · ${x.coupon}` : ''}</small></span><strong>{brl(saleTotal(x))}</strong></li>)}{!history.length && <li className={s.muted}>Nenhuma compra registrada.</li>}</ul>
      </section>
      <div className={s.drawerActions}>
        <button className={s.primary} onClick={() => { onClose(); ctx.setModal({ kind: 'sale', preset: c.id }); }}><ShoppingBag size={16} />Nova venda</button>
        <a className={s.secondary} href={whatsapp(c.phone, `Oi, ${c.name.split(' ')[0]}! Tudo bem? Aqui é da Lumière.`)} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>
        <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'client', id: c.id })}>Editar</button>
      </div>
    </div>
  </DrawerShell>;
}
