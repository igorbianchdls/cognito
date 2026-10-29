'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowRight, ArrowUp, Bell, CalendarPlus, Check, ChevronDown, ChevronLeft, ChevronRight, Download, MessageCircle, Minus, Plus, RotateCcw, Search, X } from 'lucide-react';
import { BottlesArt, CalendarArt, ChartArt, LotusArt, LotusLogo, PeopleArt, ProcedureArt, StarArt } from './Art';
import { addDays, brl, busy, CLOSE, dateLabel, dayKey, daysBetween, expenseCategories, initials, makeSeed, monthKey, OPEN, payments, procedureCategories, sources, statuses, storageKey, toMin, toTime, uid, type Appointment, type Client, type Payment, type Procedure, type ProcedureCategory, type Product, type Status, type Store } from './data';
import { serif } from './fonts';
import s from './EsteticaApp.module.css';

type View = 'Visão Geral' | 'Agendamentos' | 'Clientes' | 'Procedimentos' | 'Produtos' | 'Financeiro' | 'Relatórios';
type Modal = { kind: 'appointment'; id?: string; preset?: Partial<Appointment> } | { kind: 'client' | 'procedure' | 'product' | 'expense'; id?: string } | null;
const views: View[] = ['Visão Geral', 'Agendamentos', 'Clientes', 'Procedimentos', 'Produtos', 'Financeiro', 'Relatórios'];
const statusTone: Record<Status, string> = { Agendado: s.tGray, Confirmado: s.tBlue, Realizado: s.tGreen, Faltou: s.tAmber, Cancelado: s.tRed };
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const pct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const num = (v: string) => Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;
const compact = (v: number) => v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : v >= 1e4 ? `R$ ${Math.round(v / 1e3).toLocaleString('pt-BR')} mil` : brl(v);
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const monthLabel = (key: string, style: 'short' | 'long' = 'short') => new Date(`${key.slice(0, 7)}-01T12:00`).toLocaleDateString('pt-BR', { month: style }).replace('.', '');
const longDay = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase());
const weekdayShort = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
const whatsapp = (phone: string, text: string) => `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
const closeOf = (date: string) => new Date(`${date}T12:00`).getDay() === 6 ? 14 * 60 : CLOSE * 60;

type ClientStat = { visits: number; total: number; last: string; first: string; lastProc: string; next: string; missed: number };
/** Visits, spend, last/next visit and no-shows per client. */
function clientStats(appts: Appointment[], today: string) {
  const map = new Map<string, ClientStat>();
  for (const a of appts) {
    let st = map.get(a.clientId);
    if (!st) { st = { visits: 0, total: 0, last: '', first: '', lastProc: '', next: '', missed: 0 }; map.set(a.clientId, st); }
    if (a.status === 'Realizado') { st.visits++; st.total += a.price; if (a.date >= st.last) { st.last = a.date; st.lastProc = a.procedureId; } if (!st.first || a.date < st.first) st.first = a.date; }
    if (a.status === 'Faltou') st.missed++;
    if ((a.status === 'Agendado' || a.status === 'Confirmado') && a.date >= today && (!st.next || a.date < st.next)) st.next = a.date;
  }
  return map;
}

export default function EsteticaApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Visão Geral');
  const [modal, setModal] = useState<Modal>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    let saved: Store | null = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) saved = JSON.parse(raw); } catch { /* falls back to the demo data */ }
    // Clock and storage are read only after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(saved?.appointments ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);
  const today = now ? dayKey(now) : '';
  const stats = useMemo(() => clientStats(store?.appointments ?? [], today), [store?.appointments, today]);

  if (!store) return <div className={`${s.app} ${serif.variable}`}><div className={s.loading}><LotusLogo className={s.logoMark} /></div></div>;

  const set = (fn: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...fn(prev) }); if (message) setToast(message); };
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const ctx: Ctx = { store, today, stats, set, go, setModal, openClient: setDrawer, procedure: id => store.procedures.find(p => p.id === id), professional: id => store.professionals.find(p => p.id === id), client: id => store.clients.find(c => c.id === id), updateAppt: (id, patch, message) => set(st => ({ appointments: st.appointments.map(a => a.id === id ? { ...a, ...patch } : a) }), message) };
  const overview = view === 'Visão Geral';
  const drawerClient = drawer ? ctx.client(drawer) : undefined;

  return <div className={`${s.app} ${serif.variable} ${overview ? s.photoMode : s.dataMode}`}>
    {overview && <div className={s.backdrop} aria-hidden="true" />}
    <TopBar ctx={ctx} view={view} />
    <main className={s.main}>
      {overview && <Overview ctx={ctx} />}
      {view === 'Agendamentos' && <AgendaView ctx={ctx} />}
      {view === 'Clientes' && <ClientsView ctx={ctx} />}
      {view === 'Procedimentos' && <ProceduresView ctx={ctx} />}
      {view === 'Produtos' && <ProductsView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
    </main>
    {modal?.kind === 'appointment' && <AppointmentForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} preset={modal.preset} onClose={() => setModal(null)} />}
    {modal?.kind === 'client' && <ClientForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'procedure' && <ProcedureForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'product' && <ProductForm ctx={ctx} onClose={() => setModal(null)} />}
    {modal?.kind === 'expense' && <ExpenseForm ctx={ctx} onClose={() => setModal(null)} />}
    {drawerClient && <ClientDrawer key={drawerClient.id} ctx={ctx} c={drawerClient} onClose={() => setDrawer(null)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; today: string; stats: Map<string, ClientStat>; set: (fn: (st: Store) => Partial<Store>, message?: string) => void; go: (v: View) => void; setModal: (m: Modal) => void; openClient: (id: string) => void; procedure: (id: string) => Procedure | undefined; professional: (id: string) => Store['professionals'][number] | undefined; client: (id: string) => Client | undefined; updateAppt: (id: string, patch: Partial<Appointment>, message?: string) => void };

function Pill({ tone, children }: { tone: string; children: ReactNode }) { return <em className={`${s.pill} ${tone}`}>{children}</em>; }
function Avatar({ name, size = 30, color }: { name: string; size?: number; color?: string }) { return <span className={s.avatar} style={{ width: size, height: size, fontSize: size * .38, background: color }}>{initials(name)}</span>; }
function Thumb({ p, className }: { p: Procedure; className?: string }) { return <span className={`${s.thumb} ${className ?? ''}`} role="img" aria-label={p.name}><ProcedureArt art={p.art} /></span>; }
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
const revenue = (appts: Appointment[], from: string, to: string) => appts.filter(a => a.status === 'Realizado' && a.date >= from && a.date <= to).reduce((v, a) => v + a.price, 0);
/** Clients whose recommended return date is due (or due within a week) and who have nothing booked. */
function returnsDue(ctx: Ctx) {
  const { store, stats, today } = ctx;
  return store.clients.map(c => ({ c, st: stats.get(c.id) })).filter(({ st }) => st?.last && !st.next).map(({ c, st }) => { const p = ctx.procedure(st!.lastProc); return { c, p, due: addDays(st!.last, p?.returnDays ?? 30) }; })
    .filter(x => x.p && x.due <= addDays(today, 7) && x.due >= addDays(today, -30)).sort((a, b) => a.due.localeCompare(b.due));
}
/** Share of each professional's open hours already booked on a day. */
function occupancy(store: Store, date: string) {
  if (new Date(`${date}T12:00`).getDay() === 0) return 0;
  const open = (closeOf(date) - OPEN * 60) * store.professionals.length;
  const used = store.appointments.filter(a => a.date === date && busy(a)).reduce((v, a) => v + (store.procedures.find(p => p.id === a.procedureId)?.duration ?? 30), 0);
  return Math.min(100, used / open * 100);
}

function TopBar({ ctx, view }: { ctx: Ctx; view: View }) {
  const { store, today } = ctx;
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'search' | 'bell' | 'user' | null>(null);
  const close = useMemo(() => () => setPanel(null), []);
  const ref = useOutside(!!panel, close);
  const q = query.trim();
  const results = q ? [
    ...store.clients.filter(c => has(q, c.name, c.phone, c.email)).slice(0, 6).map(c => ({ key: c.id, label: c.name, meta: `Cliente · ${c.phone}`, run: () => ctx.openClient(c.id) })),
    ...store.procedures.filter(p => has(q, p.name, p.category)).slice(0, 4).map(p => ({ key: p.id, label: p.name, meta: `Procedimento · ${p.category} · ${brl(p.price)}`, run: () => ctx.setModal({ kind: 'procedure', id: p.id }) })),
  ] : [];
  const unconfirmed = store.appointments.filter(a => a.date === addDays(today, 1) && a.status === 'Agendado');
  const low = store.products.filter(p => p.stock <= p.min);
  const unpaid = store.appointments.filter(a => a.status === 'Realizado' && !a.paid);
  const alerts = [
    ...(unconfirmed.length ? [{ key: 'conf', text: `${plural(unconfirmed.length, 'atendimento', 'atendimentos')} de amanhã ainda sem confirmação`, run: () => ctx.go('Agendamentos') }] : []),
    ...(unpaid.length ? [{ key: 'pay', text: `${plural(unpaid.length, 'atendimento realizado', 'atendimentos realizados')} aguardando pagamento`, run: () => ctx.go('Financeiro') }] : []),
    ...low.map(p => ({ key: p.id, text: `${p.name}: ${p.stock} ${p.unit} em estoque (mínimo ${p.min})`, run: () => ctx.go('Produtos') })),
  ];
  return <header className={s.topbar} ref={ref}>
    <button className={s.brand} onClick={() => ctx.go('Visão Geral')} aria-label="Lumière Estética Avançada, ir para a visão geral"><LotusLogo className={s.logoMark} /><span><b className={s.serifText}>LUMIÈRE</b><small>ESTÉTICA AVANÇADA</small></span></button>
    <nav className={s.tabs} aria-label="Seções">{views.map(v => <button key={v} className={view === v ? s.tabOn : ''} aria-current={view === v ? 'page' : undefined} onClick={() => ctx.go(v)}>{v}</button>)}</nav>
    <div className={s.tools}>
      <div className={s.search}>
        <Search size={19} />
        <input value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar clientes, procedimentos..." aria-label="Buscar clientes ou procedimentos" />
        {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.iconCircle} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={20} />{alerts.length > 0 && <i className={s.dot} />}</button>
        {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Tudo em dia.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.user} onClick={() => setPanel(panel === 'user' ? null : 'user')} aria-label="Menu do usuário" aria-expanded={panel === 'user'}><Avatar name={`${store.settings.owner} Lumière`} size={44} /><span className={s.userName}><b>{store.settings.owner}</b><small>Administrador</small></span><ChevronDown size={16} /></button>
        {panel === 'user' && <div className={`${s.popover} ${s.menuPop}`} role="menu"><p className={s.popTitle}>{store.settings.owner}<small>{store.settings.company}</small></p>
          <button role="menuitem" onClick={() => { ctx.setModal({ kind: 'appointment' }); setPanel(null); }}>Novo agendamento</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'client' }); setPanel(null); }}>Novo cliente</button><button role="menuitem" onClick={() => { ctx.go('Relatórios'); setPanel(null); }}>Configurações</button></div>}
      </div>
    </div>
  </header>;
}

function Overview({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const mk = monthKey(today), prev = monthKey(today, -1), day = Number(today.slice(8));
  const mtd = revenue(store.appointments, `${mk}-01`, today);
  const prevSame = revenue(store.appointments, `${prev}-01`, `${prev}-${String(Math.min(day, 28)).padStart(2, '0')}`);
  const activeIn = (end: string) => new Set(store.appointments.filter(a => a.status === 'Realizado' && a.date > addDays(end, -90) && a.date <= end).map(a => a.clientId)).size;
  const active = activeIn(today), activeBefore = activeIn(addDays(today, -30));
  const firsts = [...stats.values()].map(v => v.first);
  const newNow = firsts.filter(f => f >= `${mk}-01` && f <= today).length, newPrev = firsts.filter(f => f >= `${prev}-01` && f <= `${prev}-${String(Math.min(day, 28)).padStart(2, '0')}`).length;
  const returnRate = (m: string) => { const ids = new Set(store.appointments.filter(a => a.status === 'Realizado' && a.date.startsWith(m)).map(a => a.clientId)); const back = [...ids].filter(id => (stats.get(id)?.first ?? m) < `${m}-01`).length; return ids.size ? back / ids.size * 100 : 0; };
  const rate = returnRate(mk), ratePrev = returnRate(prev);
  const monthDone = store.appointments.filter(a => a.status === 'Realizado' && a.date.startsWith(mk));
  const top = store.procedures.map(p => ({ p, n: monthDone.filter(a => a.procedureId === p.id).length })).sort((a, b) => b.n - a.n).slice(0, 5);
  const todays = store.appointments.filter(a => a.date === today && a.status !== 'Cancelado').sort((a, b) => a.time.localeCompare(b.time));
  const due = returnsDue(ctx);
  const receivable = store.appointments.filter(a => a.status === 'Realizado' && !a.paid).reduce((v, a) => v + a.price, 0);
  const summary: { label: string; value: string; art: ReactNode; foot: ReactNode; run: () => void }[] = [
    { label: 'Clientes ativos', value: active.toLocaleString('pt-BR'), art: <PeopleArt />, foot: <Delta value={activeBefore ? (active - activeBefore) / activeBefore * 100 : 0} />, run: () => ctx.go('Clientes') },
    { label: 'Faturamento', value: brl(mtd), art: <ChartArt />, foot: <Delta value={prevSame ? (mtd - prevSame) / prevSame * 100 : 0} />, run: () => ctx.go('Financeiro') },
    { label: 'Novos clientes', value: String(newNow), art: <CalendarArt />, foot: <Delta value={newPrev ? (newNow - newPrev) / newPrev * 100 : 0} />, run: () => ctx.go('Clientes') },
    { label: 'Taxa de retorno', value: pct(rate), art: <StarArt />, foot: <Delta value={rate - ratePrev} unit=" p.p." />, run: () => ctx.go('Relatórios') },
  ];
  const modules: { title: string; subtitle: string; stat: string; art: ReactNode; run: () => void }[] = [
    { title: 'Agendamentos', subtitle: 'Agenda e atendimentos', stat: plural(todays.length, 'atendimento hoje', 'atendimentos hoje'), art: <LotusArt />, run: () => ctx.go('Agendamentos') },
    { title: 'Clientes', subtitle: 'Histórico e preferências', stat: plural(due.length, 'retorno a agendar', 'retornos a agendar'), art: <PeopleArt />, run: () => ctx.go('Clientes') },
    { title: 'Produtos', subtitle: 'Controle e estoque', stat: plural(store.products.filter(p => p.stock <= p.min).length, 'item para repor', 'itens para repor'), art: <BottlesArt />, run: () => ctx.go('Produtos') },
    { title: 'Financeiro', subtitle: 'Receitas e despesas', stat: `${compact(receivable)} a receber`, art: <ChartArt />, run: () => ctx.go('Financeiro') },
  ];
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i)).filter(d => new Date(`${d}T12:00`).getDay() !== 0).slice(0, 6);
  return <>
    <section className={s.hero}>
      <div className={s.heroText}>
        <p className={s.welcome}>Bem-vindo de volta, <b>{store.settings.owner}</b>!</p>
        <h1 className={s.serifText}>Beleza que<br />conecta<br /><span>pessoas.</span></h1>
        <p className={s.lead}>Gerencie sua clínica, clientes, <br />procedimentos e equipe em um só lugar.</p>
        <button className={s.cta} onClick={() => ctx.setModal({ kind: 'appointment' })}><Plus size={22} />Novo agendamento</button>
      </div>
      <div className={s.heroSide}>
        <section className={`${s.glassLight} ${s.summary}`} aria-label="Resumo do mês">
          <header><h2>Resumo do mês</h2><button className={s.link} onClick={() => ctx.go('Relatórios')}>Ver relatório<ArrowRight size={15} /></button></header>
          <div className={s.summaryGrid}>{summary.map(x => <button key={x.label} onClick={x.run}><span className={s.summaryArt}>{x.art}</span><b>{x.value}</b><small>{x.label}</small>{x.foot}</button>)}</div>
        </section>
        <section className={`${s.glassLight} ${s.highlight}`} aria-label="Procedimentos em destaque">
          <header><h2>Procedimentos em destaque</h2><button className={s.link} onClick={() => ctx.go('Procedimentos')}>Ver todos<ArrowRight size={15} /></button></header>
          <div className={s.highlightGrid}>{top.map(({ p, n }) => <button key={p.id} onClick={() => ctx.setModal({ kind: 'procedure', id: p.id })}><Thumb p={p} /><b>{p.name}</b><small>{plural(n, 'sessão', 'sessões')}</small></button>)}</div>
        </section>
      </div>
      <section className={s.modules} aria-label="Módulos">{modules.map(m => <button key={m.title} className={`${s.glassDark} ${s.module}`} onClick={m.run}>
        <span className={s.moduleArt}>{m.art}</span>
        <span className={s.moduleText}><b>{m.title}</b><small>{m.subtitle}</small><em>{m.stat}</em></span>
        <i className={s.arrow}><ArrowRight size={20} /></i>
      </button>)}</section>
    </section>
    <section className={s.below} aria-label="Acompanhamento">
      <div className={`${s.glassLight} ${s.panel}`}>
        <header><h2>Agenda de hoje</h2><button className={s.link} onClick={() => ctx.go('Agendamentos')}>Abrir agenda<ArrowRight size={15} /></button></header>
        <p className={s.todayDate}>{longDay(today)}</p>
        <ul className={s.rowsList}>{todays.slice(0, 7).map(a => { const p = ctx.procedure(a.procedureId), c = ctx.client(a.clientId); return <li key={a.id}><time className={s.timeBadge}>{a.time}</time><button className={s.stackText} onClick={() => ctx.setModal({ kind: 'appointment', id: a.id })}><b>{c?.name}</b><small>{p?.name} · {ctx.professional(a.professionalId)?.name}</small></button>
          {a.status === 'Agendado' ? <button className={s.chip} onClick={() => ctx.updateAppt(a.id, { status: 'Confirmado' }, `${c?.name} confirmada.`)}>Confirmar</button> : a.status === 'Confirmado' ? <button className={s.chip} onClick={() => ctx.setModal({ kind: 'appointment', id: a.id })}>Concluir</button> : <Pill tone={statusTone[a.status]}>{a.status}</Pill>}</li>; })}
          {!todays.length && <li className={s.muted}>Nenhum atendimento hoje.</li>}</ul>
        {todays.length > 7 && <button className={s.link} onClick={() => ctx.go('Agendamentos')}>Mais {todays.length - 7} na agenda de hoje<ArrowRight size={15} /></button>}
      </div>
      <div className={`${s.glassLight} ${s.panel}`}>
        <header><h2>Ocupação da semana</h2><span className={s.muted}>agenda das profissionais</span></header>
        <div className={s.bars}>{week.map((d, i) => { const v = occupancy(store, d); return <button key={d} onClick={() => ctx.go('Agendamentos')} title={`${dateLabel(d)}: ${pct(v)} ocupado`}><span><em>{pct(v)}</em><i style={{ height: `${Math.max(3, v)}%` }} className={i === 0 ? s.barNow : ''} /></span><small>{i === 0 ? 'Hoje' : weekdayShort(d)}</small></button>; })}</div>
        <p className={s.hint}>Horários livres podem receber os retornos ao lado.</p>
      </div>
      <div className={`${s.glassLight} ${s.panel}`}>
        <header><h2>Retornos a agendar</h2><span className={s.countBadge}>{due.length}</span></header>
        <ul className={s.rowsList}>{due.slice(0, 6).map(({ c, p, due: d }) => <li key={c.id}><Avatar name={c.name} /><button className={s.stackText} onClick={() => ctx.openClient(c.id)}><b>{c.name}</b><small className={d < today ? s.lateText : ''}>{p?.name} · {d < today ? `retorno desde ${dateLabel(d)}` : `retorno em ${dateLabel(d)}`}</small></button>
          <a className={s.iconBtn} href={whatsapp(c.phone, `Oi, ${c.name.split(' ')[0]}! Está na hora do seu retorno de ${p?.name?.toLowerCase()} na Lumière. Vamos agendar?`)} target="_blank" rel="noreferrer" aria-label={`WhatsApp para ${c.name}`}><MessageCircle size={17} /></a>
          <button className={s.iconBtn} onClick={() => ctx.setModal({ kind: 'appointment', preset: { clientId: c.id, procedureId: p?.id } })} aria-label={`Agendar ${c.name}`}><CalendarPlus size={17} /></button></li>)}
          {!due.length && <li className={s.muted}>Nenhum retorno pendente.</li>}</ul>
      </div>
    </section>
  </>;
}

function PageHead({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <div className={s.pageHead}><div><h1>{title}</h1><p>{subtitle}</p></div><div className={s.headActions}>{children}</div></div>;
}
function Stats({ items }: { items: [string, ReactNode, ReactNode?][] }) {
  return <div className={s.stats}>{items.map(([label, value, hint]) => <div key={label}><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</div>)}</div>;
}

function AgendaView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<'Dia' | 'Próximos dias'>('Dia');
  const dayAppts = store.appointments.filter(a => a.date === date && a.status !== 'Cancelado');
  const mk = monthKey(today);
  const monthPast = store.appointments.filter(a => a.date.startsWith(mk) && a.date <= today && (a.status === 'Realizado' || a.status === 'Faltou'));
  const close = closeOf(date), closed = new Date(`${date}T12:00`).getDay() === 0;
  const slots = Array.from({ length: (close - OPEN * 60) / 30 }, (_, i) => OPEN * 60 + i * 30);
  const upcoming = store.appointments.filter(a => a.date >= today && a.date <= addDays(today, 14) && (a.status === 'Agendado' || a.status === 'Confirmado')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return <div className={s.page}>
    <PageHead title="Agendamentos" subtitle="Agenda das profissionais, confirmações e atendimentos."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'appointment', preset: { date } })}><Plus size={17} />Novo agendamento</button></PageHead>
    <Stats items={[['Atendimentos no dia', dayAppts.length, `${dayAppts.filter(a => a.status === 'Confirmado').length} confirmados`], ['Ocupação do dia', pct(occupancy(store, date))], ['Próximos 14 dias', upcoming.length, `${upcoming.filter(a => a.status === 'Agendado').length} sem confirmação`], ['Faltas no mês', pct(monthPast.length ? monthPast.filter(a => a.status === 'Faltou').length / monthPast.length * 100 : 0), 'dos atendimentos previstos']]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{(['Dia', 'Próximos dias'] as const).map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? s.segOn : ''} onClick={() => setMode(m)}>{m}</button>)}</div>
        {mode === 'Dia' && <div className={s.dateNav}><button className={s.iconBtn} onClick={() => setDate(addDays(date, -1))} aria-label="Dia anterior"><ChevronLeft size={18} /></button><input type="date" className={s.select} value={date} onChange={e => e.target.value && setDate(e.target.value)} aria-label="Data" /><button className={s.iconBtn} onClick={() => setDate(addDays(date, 1))} aria-label="Próximo dia"><ChevronRight size={18} /></button>{date !== today && <button className={s.chip} onClick={() => setDate(today)}>Hoje</button>}<b>{longDay(date)}</b></div>}
        <span className={s.legend}>{statuses.filter(x => x !== 'Cancelado').map(x => <span key={x}><i className={statusTone[x]} />{x}</span>)}</span>
      </div>
      {mode === 'Dia' ? closed ? <p className={s.empty}>A clínica não abre aos domingos.</p> : <div className={s.dayWrap}><div className={s.dayGrid} style={{ gridTemplateColumns: `64px repeat(${store.professionals.length}, minmax(170px, 1fr))` }}>
        <span />{store.professionals.map(p => <header key={p.id}><Avatar name={p.name} size={28} color={p.color} /><span className={s.stackText}><b>{p.name}</b><small>{p.role}</small></span></header>)}
        <div className={s.hours}>{slots.map(m => <span key={m}>{m % 60 === 0 ? toTime(m) : ''}</span>)}</div>
        {store.professionals.map(pro => <div key={pro.id} className={s.lane} style={{ height: slots.length * 28 }}>
          {slots.map(m => <button key={m} className={s.slot} style={{ top: (m - OPEN * 60) / 30 * 28 }} onClick={() => ctx.setModal({ kind: 'appointment', preset: { date, time: toTime(m), professionalId: pro.id } })} aria-label={`Agendar ${toTime(m)} com ${pro.name}`} />)}
          {dayAppts.filter(a => a.professionalId === pro.id).map(a => { const p = ctx.procedure(a.procedureId), top = (toMin(a.time) - OPEN * 60) / 30 * 28, h = Math.max(26, (p?.duration ?? 30) / 30 * 28 - 3); return <button key={a.id} className={`${s.event} ${statusTone[a.status]}`} style={{ top, height: h, borderLeftColor: pro.color }} onClick={() => ctx.setModal({ kind: 'appointment', id: a.id })}><b>{a.time} · {ctx.client(a.clientId)?.name}</b>{h > 40 && <small>{p?.name}</small>}</button>; })}
        </div>)}
      </div></div>
        : <div className={s.tableWrap}><table className={s.table}>
          <thead><tr><th>Data</th><th>Horário</th><th>Cliente</th><th>Procedimento</th><th>Profissional</th><th>Situação</th><th className={s.num}>Valor</th><th /></tr></thead>
          <tbody>{upcoming.map(a => { const c = ctx.client(a.clientId); return <tr key={a.id} onClick={() => ctx.setModal({ kind: 'appointment', id: a.id })}>
            <td>{dateLabel(a.date)} <small className={s.muted}>{weekdayShort(a.date)}</small></td><td>{a.time}</td><td><b>{c?.name}</b></td><td>{ctx.procedure(a.procedureId)?.name}</td><td>{ctx.professional(a.professionalId)?.name}</td><td><Pill tone={statusTone[a.status]}>{a.status}</Pill></td><td className={s.num}>{brl(a.price)}</td>
            <td>{a.status === 'Agendado' && <button className={s.chip} onClick={e => { e.stopPropagation(); ctx.updateAppt(a.id, { status: 'Confirmado' }, `${c?.name} confirmada.`); }}>Confirmar</button>}</td>
          </tr>; })}</tbody></table>{!upcoming.length && <p className={s.empty}>Nenhum agendamento nos próximos 14 dias.</p>}</div>}
      {mode === 'Dia' && !closed && <p className={s.hint}>Clique num horário vazio para agendar com aquela profissional.</p>}
    </section>
  </div>;
}

function ClientsView({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const [segment, setSegment] = useState<'Todas' | 'Retorno pendente' | 'Aniversariantes' | 'Inativas'>('Todas');
  const [q, setQ] = useState('');
  const dueIds = new Set(returnsDue(ctx).map(x => x.c.id));
  const base = store.clients.filter(c => { const st = stats.get(c.id); return segment === 'Retorno pendente' ? dueIds.has(c.id) : segment === 'Aniversariantes' ? c.birthday.slice(5, 7) === today.slice(5, 7) : segment === 'Inativas' ? !!st?.last && st.last < addDays(today, -90) && !st.next : true; });
  const rows = base.filter(c => has(q, c.name, c.phone, c.email)).map(c => ({ c, st: stats.get(c.id) })).sort((a, b) => (b.st?.last ?? '').localeCompare(a.st?.last ?? ''));
  const mk = monthKey(today);
  return <div className={s.page}>
    <PageHead title="Clientes" subtitle="Histórico de procedimentos, anamnese e retornos."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'client' })}><Plus size={17} />Novo cliente</button></PageHead>
    <Stats items={[['Clientes cadastrados', store.clients.length.toLocaleString('pt-BR')], ['Atendidos em 90 dias', [...stats.values()].filter(v => v.last > addDays(today, -90)).length], ['Novos neste mês', [...stats.values()].filter(v => v.first.startsWith(mk)).length], ['Retornos a agendar', dueIds.size]]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{(['Todas', 'Retorno pendente', 'Aniversariantes', 'Inativas'] as const).map(x => <button key={x} aria-pressed={segment === x} className={segment === x ? s.segOn : ''} onClick={() => setSegment(x)}>{x}</button>)}</div>
        <label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, telefone ou e-mail" aria-label="Filtrar clientes" /></label>
        <span className={s.muted}>{plural(rows.length, 'cliente', 'clientes')}</span>
      </div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Cliente</th><th>Contato</th><th>Último procedimento</th><th>Última visita</th><th>Próxima visita</th><th className={s.num}>Visitas</th><th className={s.num}>Total</th></tr></thead>
        <tbody>{rows.slice(0, 80).map(({ c, st }) => <tr key={c.id} onClick={() => ctx.openClient(c.id)} tabIndex={0} onKeyDown={k => k.key === 'Enter' && ctx.openClient(c.id)}>
          <td><span className={s.cell}><Avatar name={c.name} /><b>{c.name}</b></span></td><td><span className={s.stackText}>{c.phone}<small>{c.email}</small></span></td><td>{st?.lastProc ? ctx.procedure(st.lastProc)?.name : <span className={s.muted}>—</span>}</td>
          <td>{st?.last ? <span className={s.stackText}>{dateLabel(st.last)}<small>há {daysBetween(st.last, today)} dias</small></span> : <span className={s.muted}>Sem visitas</span>}</td><td>{st?.next ? dateLabel(st.next) : <span className={s.muted}>—</span>}</td><td className={s.num}>{st?.visits ?? 0}</td><td className={s.num}>{st?.total ? brl(st.total) : '—'}</td>
        </tr>)}</tbody>
      </table>{rows.length > 80 && <p className={s.hint}>Mostrando 80 de {rows.length}. Use a busca para encontrar um cliente.</p>}{!rows.length && <p className={s.empty}>Nenhum cliente neste filtro.</p>}</div>
    </section>
  </div>;
}

function ProceduresView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [category, setCategory] = useState<ProcedureCategory | ''>('');
  const done30 = store.appointments.filter(a => a.status === 'Realizado' && a.date > addDays(today, -30));
  const list = store.procedures.filter(p => !category || p.category === category).map(p => ({ p, n: done30.filter(a => a.procedureId === p.id).length })).sort((a, b) => b.n - a.n);
  const active = store.procedures.filter(p => p.active);
  return <div className={s.page}>
    <PageHead title="Procedimentos" subtitle="Catálogo, preços, duração e retorno recomendado."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'procedure' })}><Plus size={17} />Novo procedimento</button></PageHead>
    <Stats items={[['Procedimentos ativos', active.length], ['Sessões em 30 dias', done30.length], ['Ticket médio', brl(done30.reduce((v, a) => v + a.price, 0) / Math.max(1, done30.length))], ['Margem média', pct(active.reduce((v, p) => v + (p.price - p.cost) / p.price, 0) / Math.max(1, active.length) * 100), 'descontando insumos']]} />
    <section className={s.card}>
      <div className={s.toolbar}><div className={s.segment}><button aria-pressed={!category} className={!category ? s.segOn : ''} onClick={() => setCategory('')}>Todos</button>{procedureCategories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? s.segOn : ''} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
      <div className={s.procGrid}>{list.map(({ p, n }) => <button key={p.id} className={`${s.procCard} ${p.active ? '' : s.inactive}`} onClick={() => ctx.setModal({ kind: 'procedure', id: p.id })}>
        <Thumb p={p} /><span className={s.stackText}><b>{p.name}</b><small>{p.category} · {p.duration} min · retorno em {p.returnDays} dias</small></span>
        <span className={s.procFoot}><strong>{brl(p.price)}</strong>{p.active ? <Pill tone={s.tGreen}>{plural(n, 'sessão', 'sessões')} / 30d</Pill> : <Pill tone={s.tGray}>Inativo</Pill>}</span>
        <small className={s.muted}>Insumos {brl(p.cost)} · margem {pct((p.price - p.cost) / p.price * 100)}</small>
      </button>)}</div>
    </section>
  </div>;
}

function ProductsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [kind, setKind] = useState<'Todos' | Product['kind']>('Todos');
  const list = store.products.filter(p => kind === 'Todos' || p.kind === kind).sort((a, b) => a.stock / Math.max(1, a.min) - b.stock / Math.max(1, b.min));
  const change = (p: Product, delta: number) => ctx.set(st => ({ products: st.products.map(x => x.id === p.id ? { ...x, stock: Math.max(0, x.stock + delta) } : x) }));
  const restock = (p: Product) => { const qty = Math.max(p.min * 2 - p.stock, 1); ctx.set(st => ({ products: st.products.map(x => x.id === p.id ? { ...x, stock: x.stock + qty } : x), expenses: [...st.expenses, { id: uid(), desc: `Reposição ${p.name}`, category: 'Insumos', due: addDays(today, 15), value: qty * p.cost, paid: false }] }), `${qty} ${p.unit} de ${p.name} adicionados. Conta lançada no financeiro.`); };
  return <div className={s.page}>
    <PageHead title="Produtos" subtitle="Insumos dos procedimentos e produtos para revenda."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'product' })}><Plus size={17} />Novo produto</button></PageHead>
    <Stats items={[['Itens cadastrados', store.products.length], ['Valor em estoque', brl(store.products.reduce((v, p) => v + p.stock * p.cost, 0)), 'a preço de custo'], ['Abaixo do mínimo', store.products.filter(p => p.stock <= p.min).length], ['Itens de revenda', store.products.filter(p => p.kind === 'Revenda').length]]} />
    <section className={s.card}>
      <div className={s.toolbar}><div className={s.segment}>{(['Todos', 'Insumo', 'Revenda'] as const).map(x => <button key={x} aria-pressed={kind === x} className={kind === x ? s.segOn : ''} onClick={() => setKind(x)}>{x === 'Insumo' ? 'Insumos' : x}</button>)}</div></div>
      <div className={s.tableWrap}><table className={`${s.table} ${s.tableStatic}`}>
        <thead><tr><th>Produto</th><th>Tipo</th><th className={s.num}>Estoque</th><th className={s.num}>Mínimo</th><th className={s.num}>Custo</th><th className={s.num}>Preço de venda</th><th /></tr></thead>
        <tbody>{list.map(p => <tr key={p.id}>
          <td><b>{p.name}</b></td><td>{p.kind}</td>
          <td className={s.num}><span className={s.stepper}><button onClick={() => change(p, -1)} aria-label={`Retirar 1 ${p.name}`}><Minus size={13} /></button><b className={p.stock <= p.min ? s.lateText : ''}>{p.stock} {p.unit}</b><button onClick={() => change(p, 1)} aria-label={`Adicionar 1 ${p.name}`}><Plus size={13} /></button></span></td>
          <td className={s.num}>{p.min}</td><td className={s.num}>{brl(p.cost)}</td><td className={s.num}>{p.price ? brl(p.price) : '—'}</td>
          <td>{p.stock <= p.min && <button className={s.chip} onClick={() => restock(p)}>Repor +{Math.max(p.min * 2 - p.stock, 1)}</button>}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const mk = monthKey(today);
  const done = store.appointments.filter(a => a.status === 'Realizado' && a.date.startsWith(mk));
  const income = done.reduce((v, a) => v + a.price, 0);
  const expenses = store.expenses.filter(e => e.due.startsWith(mk)).reduce((v, e) => v + e.value, 0);
  const unpaid = store.appointments.filter(a => a.status === 'Realizado' && !a.paid).sort((a, b) => b.date.localeCompare(a.date));
  const months = Array.from({ length: 12 }, (_, i) => monthKey(today, i - 11)).map(m => ({ m, in: revenue(store.appointments, `${m}-01`, `${m}-31`), out: store.expenses.filter(e => e.due.startsWith(m)).reduce((v, e) => v + e.value, 0) }));
  const peak = Math.max(...months.flatMap(x => [x.in, x.out]), 1);
  const bills = store.expenses.filter(e => !e.paid).sort((a, b) => a.due.localeCompare(b.due));
  return <div className={s.page}>
    <PageHead title="Financeiro" subtitle="Atendimentos, recebimentos, despesas e resultado da clínica."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'expense' })}><Plus size={17} />Nova despesa</button></PageHead>
    <Stats items={[[`Faturamento de ${monthLabel(mk, 'long')}`, brl(income), `${pct(income / store.settings.goal * 100)} da meta de ${compact(store.settings.goal)}`], ['Ticket médio', brl(income / Math.max(1, done.length)), plural(done.length, 'atendimento', 'atendimentos')], ['Despesas do mês', brl(expenses)], ['Resultado estimado', brl(income - expenses), `${brl(unpaid.reduce((v, a) => v + a.price, 0))} ainda a receber`]]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Receitas e despesas (12 meses)</h2><span className={s.legend}><span><i className={s.lIn} />Atendimentos</span><span><i className={s.lOut} />Despesas</span></span></div>
      <div className={s.chart}>{months.map(x => <div key={x.m} title={`${monthLabel(x.m, 'long')}: receitas ${brl(x.in)} · despesas ${brl(x.out)}`} className={x.m === mk ? s.chartNow : ''}><span><i className={s.lIn} style={{ height: `${x.in / peak * 100}%` }} /><i className={s.lOut} style={{ height: `${x.out / peak * 100}%` }} /></span><small>{monthLabel(x.m)}</small></div>)}</div>
    </section>
    <div className={s.twoCol}>
      <section className={s.card}>
        <div className={s.cardHead}><h2>Pagamentos pendentes</h2><span className={s.muted}>{brl(unpaid.reduce((v, a) => v + a.price, 0))}</span></div>
        <ul className={s.rowsList}>{unpaid.map(a => <li key={a.id}><button className={s.stackText} onClick={() => ctx.openClient(a.clientId)}><b>{ctx.client(a.clientId)?.name}</b><small>{ctx.procedure(a.procedureId)?.name} · {dateLabel(a.date)}</small></button><strong>{brl(a.price)}</strong><button className={s.chip} onClick={() => ctx.updateAppt(a.id, { paid: true, payment: a.payment || 'Pix' }, 'Pagamento recebido.')}>Receber</button></li>)}{!unpaid.length && <li className={s.muted}>Nenhum pagamento pendente.</li>}</ul>
      </section>
      <section className={s.card}>
        <div className={s.cardHead}><h2>Contas a pagar</h2><span className={s.muted}>{brl(bills.reduce((v, e) => v + e.value, 0))}</span></div>
        <ul className={s.rowsList}>{bills.map(e => <li key={e.id}><span className={s.stackText}><b>{e.desc}</b><small className={e.due < today ? s.lateText : ''}>{e.category} · {dateLabel(e.due)}{e.due < today ? ' · vencida' : ''}</small></span><strong>{brl(e.value)}</strong><button className={s.chip} onClick={() => ctx.set(st => ({ expenses: st.expenses.map(y => y.id === e.id ? { ...y, paid: true } : y) }), `${e.desc} paga.`)}>Pagar</button></li>)}{!bills.length && <li className={s.muted}>Nenhuma conta em aberto.</li>}</ul>
      </section>
    </div>
  </div>;
}

function Bars({ rows }: { rows: { k: string; v: number; label?: string }[] }) {
  const max = Math.max(...rows.map(r => r.v), 1);
  return <ul className={s.hbars}>{rows.map(r => <li key={r.k}><span>{r.k}</span><span className={s.meter}><i style={{ width: `${r.v / max * 100}%` }} /></span><b>{r.label ?? compact(r.v)}</b></li>)}</ul>;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store, today, stats } = ctx;
  const [form, setForm] = useState({ ...store.settings, goal: String(store.settings.goal) });
  const year = store.appointments.filter(a => a.date > addDays(today, -365) && a.date <= today);
  const done = year.filter(a => a.status === 'Realizado');
  const byCategory = procedureCategories.map(k => ({ k, v: done.filter(a => ctx.procedure(a.procedureId)?.category === k).reduce((x, a) => x + a.price, 0) }));
  const mk = monthKey(today), monthDone = store.appointments.filter(a => a.status === 'Realizado' && a.date.startsWith(mk));
  const byPro = store.professionals.map(p => { const v = monthDone.filter(a => a.professionalId === p.id).reduce((x, a) => x + a.price, 0); return { k: p.name, v, label: `${compact(v)} · comissão ${compact(v * p.commission)}` }; });
  const bySource = sources.map(k => ({ k, v: store.clients.filter(c => c.source === k).length, label: String(store.clients.filter(c => c.source === k).length) }));
  const top = [...stats.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  const missed = year.filter(a => a.status === 'Faltou').length, planned = year.filter(a => a.status === 'Realizado' || a.status === 'Faltou').length;
  return <div className={s.page}>
    <PageHead title="Relatórios" subtitle="Últimos 12 meses, comissões, exportações e configurações." />
    <Stats items={[['Faturamento (12 meses)', brl(done.reduce((v, a) => v + a.price, 0))], ['Atendimentos realizados', done.length.toLocaleString('pt-BR')], ['Taxa de faltas', pct(planned ? missed / planned * 100 : 0)], ['Clientes que voltaram', pct([...stats.values()].filter(v => v.visits > 1).length / Math.max(1, [...stats.values()].filter(v => v.visits).length) * 100), 'mais de uma visita']]} />
    <div className={s.twoCol}>
      <section className={s.card}><div className={s.cardHead}><h2>Faturamento por categoria</h2></div><Bars rows={byCategory} /></section>
      <section className={s.card}><div className={s.cardHead}><h2>Produção por profissional ({monthLabel(mk, 'long')})</h2></div><Bars rows={byPro} /></section>
      <section className={s.card}><div className={s.cardHead}><h2>Origem dos clientes</h2></div><Bars rows={bySource} /></section>
      <section className={s.card}><div className={s.cardHead}><h2>Melhores clientes</h2></div><ul className={s.rowsList}>{top.map(([id, st]) => { const c = ctx.client(id); return c && <li key={id}><Avatar name={c.name} /><button className={s.stackText} onClick={() => ctx.openClient(id)}><b>{c.name}</b><small>{plural(st.visits, 'visita', 'visitas')} · última em {dateLabel(st.last)}</small></button><strong>{brl(st.total)}</strong></li>; })}</ul></section>
    </div>
    <section className={s.card}><div className={s.cardHead}><h2>Exportações e dados</h2></div><div className={s.exportList}>
      <button className={s.secondary} onClick={() => download('lumiere-atendimentos.csv', csv([['Data', 'Horário', 'Cliente', 'Procedimento', 'Profissional', 'Situação', 'Valor', 'Pago', 'Pagamento'], ...store.appointments.map(a => [dateLabel(a.date), a.time, ctx.client(a.clientId)?.name ?? '', ctx.procedure(a.procedureId)?.name ?? '', ctx.professional(a.professionalId)?.name ?? '', a.status, a.price, a.paid ? 'Sim' : 'Não', a.payment])]), 'text/csv')}><Download size={16} />Atendimentos (CSV)</button>
      <button className={s.secondary} onClick={() => download('lumiere-clientes.csv', csv([['Nome', 'Telefone', 'E-mail', 'Aniversário', 'Origem', 'Visitas', 'Total gasto'], ...store.clients.map(c => [c.name, c.phone, c.email, dateLabel(c.birthday), c.source, stats.get(c.id)?.visits ?? 0, stats.get(c.id)?.total ?? 0])]), 'text/csv')}><Download size={16} />Clientes (CSV)</button>
      <button className={s.secondary} onClick={() => download('lumiere-estetica-backup.json', JSON.stringify(store), 'application/json')}><Download size={16} />Backup completo (JSON)</button>
      <button className={s.secondary} onClick={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) ctx.set(() => makeSeed(), 'Dados de exemplo restaurados.'); }}><RotateCcw size={16} />Restaurar dados de exemplo</button>
    </div></section>
    <section className={s.card}><div className={s.cardHead}><h2>Configurações</h2></div>
      <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(() => ({ settings: { owner: form.owner, company: form.company, goal: num(form.goal) || store.settings.goal } }), 'Configurações salvas.'); }}>
        <label className={s.field}><span>Nome da clínica</span><input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
        <label className={s.field}><span>Responsável</span><input required value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
        <label className={s.field}><span>Meta de faturamento mensal (R$)</span><input inputMode="decimal" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value.replace(/[^\d,]/g, '') })} /></label>
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

function AppointmentForm({ ctx, id, preset, onClose }: { ctx: Ctx; id?: string; preset?: Partial<Appointment>; onClose: () => void }) {
  const { store, today } = ctx;
  const editing = id ? store.appointments.find(a => a.id === id) : undefined;
  const first = { ...preset, ...editing };
  const [f, setF] = useState({ clientId: first.clientId ?? '', newClient: '', phone: '', procedureId: first.procedureId ?? store.procedures[0].id, professionalId: first.professionalId ?? store.professionals[0].id, date: first.date ?? addDays(today, 1), time: first.time ?? '10:00', notes: first.notes ?? '' });
  const [payment, setPayment] = useState<Payment>(editing?.payment || 'Pix');
  const proc = ctx.procedure(f.procedureId)!;
  const start = toMin(f.time), end = start + proc.duration;
  const conflict = store.appointments.find(a => a.id !== editing?.id && busy(a) && a.date === f.date && a.professionalId === f.professionalId && toMin(a.time) < end && toMin(a.time) + (ctx.procedure(a.procedureId)?.duration ?? 30) > start);
  const close = closeOf(f.date), sunday = new Date(`${f.date}T12:00`).getDay() === 0;
  const outside = sunday || start < OPEN * 60 || end > close;
  const slots = Array.from({ length: (close - OPEN * 60) / 30 }, (_, i) => OPEN * 60 + i * 30).filter(m => m + proc.duration <= close && !store.appointments.some(a => a.id !== editing?.id && busy(a) && a.date === f.date && a.professionalId === f.professionalId && toMin(a.time) < m + proc.duration && toMin(a.time) + (ctx.procedure(a.procedureId)?.duration ?? 30) > m));
  const clients = useMemo(() => [...store.clients].sort((a, b) => a.name.localeCompare(b.name)), [store.clients]);
  const locked = editing && (editing.status === 'Realizado' || editing.status === 'Cancelado' || editing.status === 'Faltou');
  const save = (patch: Partial<Appointment> = {}, message?: string) => {
    const newClient: Client | null = !f.clientId ? { id: uid(), name: f.newClient.trim(), phone: f.phone, email: '', birthday: '', source: 'Instagram', anamnesis: '', createdAt: today } : null;
    const data = { clientId: newClient?.id ?? f.clientId, procedureId: f.procedureId, professionalId: f.professionalId, date: f.date, time: f.time, notes: f.notes, price: editing?.price && editing.procedureId === f.procedureId ? editing.price : proc.price };
    ctx.set(st => ({ clients: newClient ? [newClient, ...st.clients] : st.clients, appointments: editing ? st.appointments.map(a => a.id === editing.id ? { ...a, ...data, ...patch } : a) : [...st.appointments, { id: uid(), status: 'Agendado', paid: false, payment: '', ...data, ...patch }] }), message ?? (editing ? 'Agendamento atualizado.' : `Agendado: ${proc.name} em ${dateLabel(f.date)} às ${f.time}.`));
    onClose();
  };
  const canSave = (!!f.clientId || !!f.newClient.trim()) && !conflict && !outside;
  const c = ctx.client(f.clientId), cs = f.clientId ? ctx.stats.get(f.clientId) : undefined;
  return <Shell title={editing ? 'Atendimento' : 'Novo agendamento'} onClose={onClose} wide>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (canSave) save(); }}>
      {editing && <p className={`${s.wide} ${s.apptMeta}`}><Pill tone={statusTone[editing.status]}>{editing.status}</Pill>{brl(editing.price)}{editing.status === 'Realizado' && <span>{editing.paid ? `pago · ${editing.payment}` : 'aguardando pagamento'}</span>}{c && <button type="button" className={s.linkDark} onClick={() => { onClose(); ctx.openClient(c.id); }}>Ficha do cliente <ArrowRight size={14} /></button>}</p>}
      <label className={s.field}><span>Cliente</span><select disabled={!!locked} value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}><option value="">+ Novo cliente</option>{clients.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>{c?.anamnesis && <small className={s.warnText}>Anamnese: {c.anamnesis}</small>}{cs?.last && <small className={s.muted}>{plural(cs.visits, 'visita', 'visitas')} · última em {dateLabel(cs.last)}</small>}</label>
      {!f.clientId ? <div className={s.pair}><label className={s.field}><span>Nome</span><input required value={f.newClient} onChange={e => setF({ ...f, newClient: e.target.value })} /></label><label className={s.field}><span>WhatsApp</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="(81) 9..." /></label></div> : <span />}
      <label className={s.field}><span>Procedimento</span><select disabled={!!locked} value={f.procedureId} onChange={e => setF({ ...f, procedureId: e.target.value })}>{store.procedures.filter(p => p.active || p.id === f.procedureId).map(p => <option key={p.id} value={p.id}>{p.name} · {p.duration} min · {brl(p.price)}</option>)}</select></label>
      <label className={s.field}><span>Profissional</span><select disabled={!!locked} value={f.professionalId} onChange={e => setF({ ...f, professionalId: e.target.value })}>{store.professionals.map(p => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</select></label>
      <label className={s.field}><span>Data</span><input disabled={!!locked} type="date" required value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
      <label className={s.field}><span>Horário</span><input disabled={!!locked} type="time" step={1800} required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /><small className={s.muted}>Término às {toTime(end)}</small></label>
      {!locked && <div className={`${s.wide} ${s.slots}`}><span>Horários livres com {ctx.professional(f.professionalId)?.name.split(' ').slice(0, 2).join(' ')}</span>{sunday ? <small className={s.muted}>A clínica não abre aos domingos.</small> : <div className={s.chips}>{slots.slice(0, 16).map(m => <button type="button" key={m} className={`${s.chip} ${toTime(m) === f.time ? s.chipOn : ''}`} onClick={() => setF({ ...f, time: toTime(m) })}>{toTime(m)}</button>)}{!slots.length && <small className={s.muted}>Sem horários livres neste dia.</small>}</div>}</div>}
      {(conflict || (outside && !sunday)) && !locked && <p className={`${s.wide} ${s.warnBox}`}>{conflict ? `Conflito: ${ctx.client(conflict.clientId)?.name} às ${conflict.time} com a mesma profissional.` : 'Fora do horário de funcionamento.'}</p>}
      <label className={`${s.field} ${s.wide}`}><span>Observações</span><textarea rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Ex.: retorno do botox, região da testa" /></label>
      <footer className={s.modalFoot}>
        {editing && !locked && <><button type="button" className={s.dangerBtn} onClick={() => save({ status: 'Cancelado' }, 'Agendamento cancelado.')}>Cancelar horário</button>
          {editing.date <= today && <button type="button" className={s.secondary} onClick={() => save({ status: 'Faltou' }, 'Falta registrada.')}>Faltou</button>}
          {editing.status === 'Agendado' && <button type="button" className={s.secondary} onClick={() => save({ status: 'Confirmado' }, 'Presença confirmada.')}>Confirmar</button>}
          <button className={s.secondary} type="submit" disabled={!canSave}>Salvar</button>
          {editing.date <= today && <span className={s.finish}><select value={payment} onChange={e => setPayment(e.target.value as Payment)} aria-label="Forma de pagamento">{payments.map(p => <option key={p}>{p}</option>)}</select><button type="button" className={s.primary} onClick={() => save({ status: 'Realizado', paid: true, payment }, 'Atendimento concluído e pago.')}><Check size={16} />Concluir e receber</button></span>}</>}
        {editing?.status === 'Realizado' && !editing.paid && <button type="button" className={s.primary} onClick={() => save({ paid: true, payment }, 'Pagamento recebido.')}>Receber {brl(editing.price)}</button>}
        {locked && <Dialog.Close className={s.secondary} type="button">Fechar</Dialog.Close>}
        {!editing && <><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit" disabled={!canSave}>Agendar</button></>}
      </footer>
    </form>
  </Shell>;
}

function ClientForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const c = id ? ctx.client(id) : undefined;
  const [f, setF] = useState({ name: c?.name ?? '', phone: c?.phone ?? '', email: c?.email ?? '', birthday: c?.birthday ?? '', source: c?.source ?? sources[0], anamnesis: c?.anamnesis ?? '' });
  return <Shell title={c ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (c) ctx.set(st => ({ clients: st.clients.map(x => x.id === c.id ? { ...x, ...f } : x) }), 'Cliente atualizado.'); else ctx.set(st => ({ clients: [{ id: uid(), createdAt: ctx.today, ...f }, ...st.clients] }), `${f.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>WhatsApp</span><input required value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="(81) 9..." /></label>
      <label className={s.field}><span>E-mail</span><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
      <label className={s.field}><span>Data de nascimento</span><input type="date" value={f.birthday} onChange={e => setF({ ...f, birthday: e.target.value })} /></label>
      <label className={s.field}><span>Como conheceu</span><select value={f.source} onChange={e => setF({ ...f, source: e.target.value })}>{sources.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={`${s.field} ${s.wide}`}><span>Anamnese (alergias, medicamentos, cuidados)</span><textarea rows={3} value={f.anamnesis} onChange={e => setF({ ...f, anamnesis: e.target.value })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function ProcedureForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const p = id ? ctx.procedure(id) : undefined;
  const [f, setF] = useState({ name: p?.name ?? '', category: (p?.category ?? 'Facial') as ProcedureCategory, duration: String(p?.duration ?? 60), price: String(p?.price ?? ''), cost: String(p?.cost ?? ''), returnDays: String(p?.returnDays ?? 30), active: p?.active ?? true });
  const artFor: Record<ProcedureCategory, string> = { Facial: 'face', Injetáveis: 'syringe', Corporal: 'body', Laser: 'laser', 'Bem-estar': 'lotus' };
  return <Shell title={p ? p.name : 'Novo procedimento'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); const data = { name: f.name.trim(), category: f.category, duration: num(f.duration) || 30, price: num(f.price), cost: num(f.cost), returnDays: num(f.returnDays) || 30, active: f.active }; if (p) ctx.set(st => ({ procedures: st.procedures.map(x => x.id === p.id ? { ...x, ...data } : x) }), 'Procedimento atualizado.'); else ctx.set(st => ({ procedures: [...st.procedures, { id: uid(), art: artFor[data.category], ...data }] }), `${data.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>Categoria</span><select value={f.category} onChange={e => setF({ ...f, category: e.target.value as ProcedureCategory })}>{procedureCategories.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>Duração (min)</span><input inputMode="numeric" value={f.duration} onChange={e => setF({ ...f, duration: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={s.field}><span>Preço (R$)</span><input inputMode="decimal" required value={f.price} onChange={e => setF({ ...f, price: e.target.value.replace(/[^\d,]/g, '') })} /></label>
      <label className={s.field}><span>Custo de insumos (R$)</span><input inputMode="decimal" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value.replace(/[^\d,]/g, '') })} /></label>
      <label className={s.field}><span>Retorno recomendado (dias)</span><input inputMode="numeric" value={f.returnDays} onChange={e => setF({ ...f, returnDays: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={`${s.field} ${s.checkField}`}><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /><span>Disponível para agendamento</span></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function ProductForm({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const [f, setF] = useState({ name: '', kind: 'Insumo' as Product['kind'], unit: 'un', stock: '0', min: '2', cost: '', price: '' });
  return <Shell title="Novo produto" onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(st => ({ products: [...st.products, { id: uid(), name: f.name.trim(), kind: f.kind, unit: f.unit || 'un', stock: num(f.stock), min: num(f.min), cost: num(f.cost), price: f.kind === 'Revenda' ? num(f.price) : 0 }] }), `${f.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>Tipo</span><select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as Product['kind'] })}><option>Insumo</option><option>Revenda</option></select></label>
      <label className={s.field}><span>Unidade</span><input value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} placeholder="un, frasco, caixa..." /></label>
      <label className={s.field}><span>Estoque atual</span><input inputMode="numeric" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={s.field}><span>Estoque mínimo</span><input inputMode="numeric" value={f.min} onChange={e => setF({ ...f, min: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={s.field}><span>Custo (R$)</span><input inputMode="decimal" required value={f.cost} onChange={e => setF({ ...f, cost: e.target.value.replace(/[^\d,]/g, '') })} /></label>
      {f.kind === 'Revenda' ? <label className={s.field}><span>Preço de venda (R$)</span><input inputMode="decimal" value={f.price} onChange={e => setF({ ...f, price: e.target.value.replace(/[^\d,]/g, '') })} /></label> : <span />}
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
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

function ClientDrawer({ ctx, c, onClose }: { ctx: Ctx; c: Client; onClose: () => void }) {
  const { store, today, stats } = ctx;
  const st = stats.get(c.id);
  const history = store.appointments.filter(a => a.clientId === c.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const next = history.filter(a => a.date >= today && (a.status === 'Agendado' || a.status === 'Confirmado')).at(-1);
  const [anamnesis, setAnamnesis] = useState(c.anamnesis);
  return <Dialog.Root open onOpenChange={o => !o && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.drawer} ${serif.variable}`} aria-describedby={undefined}>
      <div className={s.drawerHead}><Avatar name={c.name} size={64} /><div><small>Cliente desde {dateLabel(c.createdAt)} · {c.source}</small><Dialog.Title className={s.serifText}>{c.name}</Dialog.Title><p>{c.phone}{c.email ? ` · ${c.email}` : ''}</p></div><Dialog.Close className={s.iconBtn} aria-label="Fechar"><X size={18} /></Dialog.Close></div>
      <div className={s.drawerBody}><div className={s.stack}>
        <div className={s.factGrid}><span>Visitas<b>{st?.visits ?? 0}</b></span><span>Total gasto<b>{st?.total ? brl(st.total) : '—'}</b></span><span>Ticket médio<b>{st?.visits ? brl(st.total / st.visits) : '—'}</b></span><span>Última visita<b>{st?.last ? `há ${daysBetween(st.last, today)} dias` : '—'}</b></span><span>Faltas<b>{st?.missed ?? 0}</b></span><span>Aniversário<b>{c.birthday ? dateLabel(c.birthday).slice(0, 5) : '—'}</b></span></div>
        {next ? <button className={s.nextBox} onClick={() => ctx.setModal({ kind: 'appointment', id: next.id })}><CalendarPlus size={18} /><span className={s.stackText}><b>Próxima visita: {dateLabel(next.date)} às {next.time}</b><small>{ctx.procedure(next.procedureId)?.name} · {ctx.professional(next.professionalId)?.name} · {next.status}</small></span></button> : <p className={s.muted}>Sem visita agendada.</p>}
        <label className={s.field}><span>Anamnese</span><textarea rows={3} value={anamnesis} onChange={e => setAnamnesis(e.target.value)} onBlur={() => anamnesis !== c.anamnesis && ctx.set(x => ({ clients: x.clients.map(y => y.id === c.id ? { ...y, anamnesis } : y) }), 'Anamnese salva.')} placeholder="Alergias, medicamentos em uso, cuidados..." /></label>
        <section className={s.block}><h3>Histórico</h3>
          <ul className={s.rowsList}>{history.slice(0, 14).map(a => <li key={a.id}><button className={s.stackText} onClick={() => ctx.setModal({ kind: 'appointment', id: a.id })}><b>{ctx.procedure(a.procedureId)?.name}</b><small>{dateLabel(a.date)} {a.time} · {ctx.professional(a.professionalId)?.name}</small></button><Pill tone={statusTone[a.status]}>{a.status}</Pill><strong>{brl(a.price)}</strong></li>)}{!history.length && <li className={s.muted}>Nenhum atendimento ainda.</li>}</ul>
        </section>
        <div className={s.drawerActions}>
          <button className={s.primary} onClick={() => ctx.setModal({ kind: 'appointment', preset: { clientId: c.id, procedureId: st?.lastProc || undefined } })}><CalendarPlus size={16} />Agendar</button>
          <a className={s.secondary} href={whatsapp(c.phone, `Oi, ${c.name.split(' ')[0]}! Tudo bem? Aqui é da Lumière Estética.`)} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>
          <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'client', id: c.id })}>Editar</button>
        </div>
      </div></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
