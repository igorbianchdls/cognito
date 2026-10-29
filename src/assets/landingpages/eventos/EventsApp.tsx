'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Bell, Briefcase, Cake, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleCheck, CircleDot, Download, Plus, RotateCcw, Search, Sparkles, Star, Trash2, X, type LucideIcon } from 'lucide-react';
import { BouquetArt, CameraArt, ClipboardArt, GuestsArt, LotusLogo } from './Art';
import { addDays, brl, categories, costs, dateLabel, dayKey, initials, live, makeSeed, phaseStatus, phases, received, sources, stages, storageKey, types, uid, type Client, type Event, type EventType, type Phase, type PhaseStatus, type Rsvp, type Stage, type Store, type Supplier } from './data';
import { serif } from './fonts';
import s from './EventsApp.module.css';

type View = 'Visão Geral' | 'Eventos' | 'Clientes' | 'Fornecedores' | 'Financeiro' | 'Relatórios';
type Tab = 'Resumo' | 'Cronograma' | 'Fornecedores' | 'Convidados' | 'Financeiro' | 'Fotos';
type Modal = { kind: 'event'; id?: string; preset?: Partial<Event> } | { kind: 'client'; id?: string } | { kind: 'supplier'; id?: string } | null;
const views: View[] = ['Visão Geral', 'Eventos', 'Clientes', 'Fornecedores', 'Financeiro', 'Relatórios'];
const typeIcon: Record<EventType, LucideIcon> = { Casamento: Sparkles, Aniversário: Cake, Corporativo: Briefcase, Debutante: Star };
const stageTone: Record<Stage, string> = { Orçamento: s.tGray, Contratado: s.tBlue, 'Em planejamento': s.tAmber, Realizado: s.tGreen, Cancelado: s.tRed };
const statusIcon: Record<PhaseStatus, LucideIcon> = { Concluído: CircleCheck, 'Em andamento': CircleDot, Pendente: Circle };
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const pct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const longDate = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '').replace(/^./, c => c.toUpperCase());
const monthShort = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
const num = (v: string) => Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;

export default function EventsApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Visão Geral');
  const [modal, setModal] = useState<Modal>(null);
  const [drawer, setDrawer] = useState<{ id: string; tab: Tab } | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    let saved: Store | null = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) saved = JSON.parse(raw); } catch { /* falls back to the demo data */ }
    // Clock and storage are read only after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(saved?.events ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  if (!store) return <div className={`${s.app} ${serif.variable}`}><div className={s.loading}><LotusLogo className={s.logoMark} /></div></div>;

  const today = dayKey(now);
  const set = (fn: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...fn(prev) }); if (message) setToast(message); };
  const updateEvent = (id: string, fn: (e: Event) => Partial<Event>, message?: string) => set(st => ({ events: st.events.map(e => e.id === id ? { ...e, ...fn(e) } : e) }), message);
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const upcoming = store.events.filter(e => live(e) && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const ctx: Ctx = { store, today, set, go, setModal, updateEvent, upcoming, openEvent: (id, tab = 'Resumo') => setDrawer({ id, tab }), setToast, client: id => store.clients.find(c => c.id === id), supplier: id => store.suppliers.find(x => x.id === id) };
  const current = drawer && store.events.find(e => e.id === drawer.id);
  const overview = view === 'Visão Geral';

  return <div className={`${s.app} ${serif.variable} ${overview ? s.photoMode : s.dataMode}`}>
    {overview && <div className={s.backdrop} aria-hidden="true" />}
    <TopBar ctx={ctx} view={view} />
    <main className={s.main}>
      {overview && <Overview ctx={ctx} />}
      {view === 'Eventos' && <EventsView ctx={ctx} />}
      {view === 'Clientes' && <ClientsView ctx={ctx} />}
      {view === 'Fornecedores' && <SuppliersView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
    </main>
    {modal?.kind === 'event' && <EventForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} preset={modal.preset} onClose={() => setModal(null)} />}
    {modal?.kind === 'client' && <ClientForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'supplier' && <SupplierForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {current && <EventDrawer key={current.id} ctx={ctx} e={current} tab={drawer!.tab} onTab={tab => setDrawer({ id: current.id, tab })} onClose={() => setDrawer(null)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; today: string; set: (fn: (st: Store) => Partial<Store>, message?: string) => void; go: (v: View) => void; setModal: (m: Modal) => void; updateEvent: (id: string, fn: (e: Event) => Partial<Event>, message?: string) => void; upcoming: Event[]; openEvent: (id: string, tab?: Tab) => void; setToast: (t: string) => void; client: (id: string) => Client | undefined; supplier: (id: string) => Supplier | undefined };

function Pill({ tone, children }: { tone: string; children: ReactNode }) { return <em className={`${s.pill} ${tone}`}>{children}</em>; }
function Avatar({ name, size = 30 }: { name: string; size?: number }) { return <span className={s.avatar} style={{ width: size, height: size, fontSize: size * .38 }}>{initials(name)}</span>; }
function Cover({ e, className }: { e: Event; className?: string }) {
  const Icon = typeIcon[e.type];
  // eslint-disable-next-line @next/next/no-img-element
  return e.cover ? <img src={`/eventos-media/${e.cover}.webp`} alt={`${e.type} ${e.title}`} className={`${s.cover} ${className ?? ''}`} loading="lazy" /> : <span className={`${s.cover} ${s.coverArt} ${s[`cv${types.indexOf(e.type)}`]} ${className ?? ''}`} role="img" aria-label={`${e.type} ${e.title}`}><Icon size={28} strokeWidth={1.4} /></span>;
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

function TopBar({ ctx, view }: { ctx: Ctx; view: View }) {
  const { store, today } = ctx;
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'search' | 'bell' | 'user' | null>(null);
  const close = useMemo(() => () => setPanel(null), []);
  const ref = useOutside(!!panel, close);
  const q = query.trim();
  const results = q ? [
    ...store.events.filter(e => has(q, e.title, e.code, e.type, e.venue)).slice(0, 6).map(e => ({ key: e.id, label: `${e.type} · ${e.title}`, meta: `${dateLabel(e.date)} · ${e.venue} · ${e.stage}`, run: () => ctx.openEvent(e.id) })),
    ...store.clients.filter(c => has(q, c.name, c.email)).slice(0, 3).map(c => ({ key: c.id, label: c.name, meta: `Cliente · ${c.kind}`, run: () => ctx.go('Clientes') })),
    ...store.suppliers.filter(x => has(q, x.name, x.category)).slice(0, 3).map(x => ({ key: x.id, label: x.name, meta: `Fornecedor · ${x.category}`, run: () => ctx.go('Fornecedores') })),
  ] : [];
  const late = store.events.filter(e => live(e) && e.date >= today).flatMap(e => e.tasks.filter(t => !t.done && t.due < today).map(t => ({ e, t })));
  const dueSoon = store.events.filter(live).flatMap(e => e.installments.filter(i => !i.paid && i.due >= today && i.due <= addDays(today, 15)).map(i => ({ e, i })));
  const alerts = [
    ...late.map(({ e, t }) => ({ key: t.id, text: `${e.title}: “${t.title}” atrasada desde ${dateLabel(t.due)}`, run: () => ctx.openEvent(e.id, 'Cronograma') })),
    ...dueSoon.map(({ e, i }) => ({ key: i.id, text: `${e.title}: ${i.label} de ${brl(i.value)} vence em ${dateLabel(i.due)}`, run: () => ctx.openEvent(e.id, 'Financeiro') })),
  ];
  return <header className={s.topbar} ref={ref}>
    <button className={s.brand} onClick={() => ctx.go('Visão Geral')} aria-label="Vélia Eventos, ir para a visão geral"><LotusLogo className={s.logoMark} /><span>VÉLIA<small>EVENTOS</small></span></button>
    <nav className={s.tabs} aria-label="Seções">{views.map(v => <button key={v} className={view === v ? s.tabOn : ''} aria-current={view === v ? 'page' : undefined} onClick={() => ctx.go(v)}>{v}</button>)}</nav>
    <div className={s.tools}>
      <div className={s.search}>
        <Search size={19} />
        <input value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar eventos, clientes..." aria-label="Buscar eventos, clientes ou fornecedores" />
        {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.iconCircle} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={20} />{alerts.length > 0 && <i className={s.dot} />}</button>
        {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Tudo em dia.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.user} onClick={() => setPanel(panel === 'user' ? null : 'user')} aria-label="Menu do usuário" aria-expanded={panel === 'user'}><Avatar name={`${store.settings.owner} Vélia`} size={44} /><ChevronDown size={16} /></button>
        {panel === 'user' && <div className={`${s.popover} ${s.menuPop}`} role="menu"><p className={s.popTitle}>{store.settings.owner}<small>{store.settings.company}</small></p><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'event' }); setPanel(null); }}>Novo evento</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'client' }); setPanel(null); }}>Novo cliente</button><button role="menuitem" onClick={() => { ctx.go('Relatórios'); setPanel(null); }}>Configurações</button></div>}
      </div>
    </div>
  </header>;
}

function Overview({ ctx }: { ctx: Ctx }) {
  const { store, today, upcoming } = ctx;
  const featured = upcoming.find(e => e.type === 'Casamento') ?? upcoming[0];
  const next = upcoming.filter(e => e.id !== featured?.id).slice(0, 3);
  const weekEnd = addDays(today, 7);
  const openTasks = upcoming.flatMap(e => e.tasks.filter(t => !t.done && t.due <= weekEnd).map(t => ({ e, t }))).sort((a, b) => a.t.due.localeCompare(b.t.due));
  const supplierDue = upcoming.flatMap(e => e.bookings.filter(b => !b.paid)).reduce((v, b) => v + b.value, 0);
  const confirmed = featured?.guests.filter(g => g.rsvp === 'Confirmado').length ?? 0;
  const pendingGalleries = store.events.filter(e => e.stage === 'Realizado' && !e.galleryDelivered);
  const receivables = store.events.filter(live).flatMap(e => e.installments.filter(i => !i.paid && i.due <= addDays(today, 30)).map(i => ({ e, i }))).sort((a, b) => a.i.due.localeCompare(b.i.due));
  const modules: { title: string; subtitle: string; stat: string; art: ReactNode; run: () => void }[] = [
    { title: 'Planejamento', subtitle: 'Cronograma e tarefas', stat: `${openTasks.length} tarefas até ${dateLabel(weekEnd).slice(0, 5)}`, art: <ClipboardArt />, run: () => featured ? ctx.openEvent(featured.id, 'Cronograma') : ctx.go('Eventos') },
    { title: 'Fornecedores', subtitle: 'Espaço, buffet, decoração', stat: `${brl(supplierDue)} a pagar`, art: <BouquetArt />, run: () => ctx.go('Fornecedores') },
    { title: 'Convidados', subtitle: 'RSVP e confirmações', stat: featured ? `${confirmed} de ${featured.guests.length} confirmados` : 'Sem evento próximo', art: <GuestsArt />, run: () => featured && ctx.openEvent(featured.id, 'Convidados') },
    { title: 'Fotos e vídeos', subtitle: 'Registros do evento', stat: `${pendingGalleries.length} ${pendingGalleries.length === 1 ? 'galeria para entregar' : 'galerias para entregar'}`, art: <CameraArt />, run: () => pendingGalleries[0] ? ctx.openEvent(pendingGalleries[0].id, 'Fotos') : ctx.go('Eventos') },
  ];
  return <>
    <section className={s.hero}>
      <div className={s.heroText}>
        <p className={s.welcome}>Bem-vindo de volta, <b>{store.settings.owner}</b>!</p>
        <h1 className={s.serifTitle}>Momentos<br />que ficam para<br />sempre.</h1>
        <p className={s.lead}>Organize, planeje e execute eventos <br />inesquecíveis em um só lugar.</p>
        <button className={s.cta} onClick={() => ctx.setModal({ kind: 'event' })}><Plus size={22} />Novo evento</button>
      </div>
      <div className={s.heroSide}>
        {featured && <section className={`${s.glassLight} ${s.featured}`} aria-label="Próximo evento">
          <button className={s.featuredHead} onClick={() => ctx.openEvent(featured.id)}><b>{featured.type} · {featured.title}</b><span>{longDate(featured.date)}<ChevronRight size={18} /></span></button>
          <div className={s.featuredBody}>
            <button className={s.featuredCover} onClick={() => ctx.openEvent(featured.id)} aria-label={`Abrir ${featured.title}`}><Cover e={featured} /></button>
            <ul className={s.phaseList}>{[...phases, 'Dia do evento' as const].map(p => { const st = phaseStatus(featured, p, today), Icon = statusIcon[st]; return <li key={p}><button onClick={() => ctx.openEvent(featured.id, p === 'Fornecedores' ? 'Fornecedores' : 'Cronograma')}><Icon size={20} className={st === 'Concluído' ? s.stDone : st === 'Em andamento' ? s.stDoing : s.stTodo} fill={st === 'Concluído' ? 'currentColor' : 'none'} /><b>{p}</b><span>{st}</span></button></li>; })}</ul>
          </div>
        </section>}
        <section className={`${s.glassLight} ${s.nextCard}`} aria-label="Próximos eventos">
          <header><h2>Próximos eventos</h2><button onClick={() => ctx.go('Eventos')}>Ver todos <ArrowRight size={16} /></button></header>
          <div className={s.nextGrid}>{next.map(e => <button key={e.id} className={s.nextItem} onClick={() => ctx.openEvent(e.id)}><Cover e={e} /><span><b>{e.date.slice(8)}</b><em>{monthShort(e.date)}</em><small>{e.type}<br />{e.title}</small></span></button>)}</div>
        </section>
      </div>
      <section className={s.modules} aria-label="Módulos">{modules.map(m => <button key={m.title} className={`${s.glassDark} ${s.module}`} onClick={m.run}>
        <span className={s.moduleArt}>{m.art}</span>
        <span className={s.moduleText}><b>{m.title}</b><small>{m.subtitle}</small><em>{m.stat}</em></span>
        <i className={s.arrow}><ArrowRight size={20} /></i>
      </button>)}</section>
    </section>
    <section className={s.below} aria-label="Agenda da semana">
      <div className={`${s.glassDark} ${s.panel}`}>
        <header><h2>Tarefas até {dateLabel(weekEnd).slice(0, 5)}</h2><span>{openTasks.length}</span></header>
        <ul>{openTasks.slice(0, 8).map(({ e, t }) => <li key={t.id}><button className={s.check} onClick={() => ctx.updateEvent(e.id, x => ({ tasks: x.tasks.map(y => y.id === t.id ? { ...y, done: true } : y) }), 'Tarefa concluída.')} aria-label={`Concluir ${t.title}`}><Check size={14} /></button><button className={s.rowBtn} onClick={() => ctx.openEvent(e.id, 'Cronograma')}><b>{t.title}</b><small>{e.title} · {t.due < today ? <span className={s.lateText}>atrasada desde {dateLabel(t.due)}</span> : dateLabel(t.due)}</small></button></li>)}{!openTasks.length && <li className={s.empty}>Nenhuma tarefa para esta semana.</li>}</ul>
      </div>
      <div className={`${s.glassDark} ${s.panel}`}>
        <header><h2>A receber em 30 dias</h2><span>{brl(receivables.reduce((v, r) => v + r.i.value, 0))}</span></header>
        <ul>{receivables.slice(0, 8).map(({ e, i }) => <li key={i.id}><button className={s.rowBtn} onClick={() => ctx.openEvent(e.id, 'Financeiro')}><b>{e.title} · {i.label}</b><small>{i.due < today ? <span className={s.lateText}>vencida em {dateLabel(i.due)}</span> : `vence em ${dateLabel(i.due)}`}</small></button><strong>{brl(i.value)}</strong></li>)}{!receivables.length && <li className={s.empty}>Nada a receber nos próximos 30 dias.</li>}</ul>
      </div>
      <div className={`${s.glassDark} ${s.panel}`}>
        <header><h2>Funil comercial</h2></header>
        <ul className={s.funnel}>{stages.map(st => { const list = store.events.filter(e => e.stage === st && (st !== 'Realizado' || e.date >= addDays(today, -90))); return <li key={st}><button className={s.rowBtn} onClick={() => ctx.go('Eventos')}><b>{st}{st === 'Realizado' && <small> · últimos 90 dias</small>}</b><small>{list.length} {list.length === 1 ? 'evento' : 'eventos'}</small></button><strong>{brl(list.reduce((v, e) => v + e.value, 0))}</strong></li>; })}</ul>
      </div>
    </section>
  </>;
}

function PageHead({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <div className={s.pageHead}><div><h1>{title}</h1><p>{subtitle}</p></div><div className={s.headActions}>{children}</div></div>;
}
function Stats({ items }: { items: [string, ReactNode, string?][] }) {
  return <div className={s.stats}>{items.map(([label, value, hint]) => <div key={label}><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</div>)}</div>;
}

function EventsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [mode, setMode] = useState<'Lista' | 'Funil' | 'Calendário'>('Lista');
  const [type, setType] = useState<EventType | ''>('');
  const [stage, setStage] = useState<Stage | 'Ativos' | 'Todos'>('Ativos');
  const [q, setQ] = useState('');
  const list = store.events.filter(e => (!type || e.type === type) && (stage === 'Todos' || (stage === 'Ativos' ? e.stage !== 'Cancelado' && e.stage !== 'Realizado' : e.stage === stage)) && has(q, e.title, e.code, e.venue, e.city)).sort((a, b) => (stage === 'Realizado' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  const month = today.slice(0, 7);
  return <div className={s.page}>
    <PageHead title="Eventos" subtitle="Do orçamento ao grande dia: acompanhe cada celebração."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'event' })}><Plus size={17} />Novo evento</button></PageHead>
    <Stats items={[['Em planejamento', store.events.filter(e => e.stage === 'Em planejamento').length], ['Eventos neste mês', store.events.filter(e => live(e) && e.date.startsWith(month)).length], ['Orçamentos abertos', store.events.filter(e => e.stage === 'Orçamento').length, brl(store.events.filter(e => e.stage === 'Orçamento').reduce((v, e) => v + e.value, 0))], ['Convidados esperados (90 dias)', ctx.upcoming.filter(e => e.date <= addDays(today, 90)).reduce((v, e) => v + e.expected, 0).toLocaleString('pt-BR')]]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{(['Lista', 'Funil', 'Calendário'] as const).map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? s.segOn : ''} onClick={() => setMode(m)}>{m}</button>)}</div>
        <select className={s.select} value={type} onChange={e => setType(e.target.value as EventType | '')} aria-label="Tipo"><option value="">Todos os tipos</option>{types.map(t => <option key={t}>{t}</option>)}</select>
        {mode === 'Lista' && <select className={s.select} value={stage} onChange={e => setStage(e.target.value as typeof stage)} aria-label="Etapa"><option>Ativos</option><option>Todos</option>{[...stages, 'Cancelado'].map(x => <option key={x}>{x}</option>)}</select>}
        <label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Evento, código ou local" aria-label="Filtrar eventos" /></label>
      </div>
      {mode === 'Lista' && <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Evento</th><th>Data</th><th>Local</th><th>Convidados</th><th>Etapa</th><th>Andamento</th><th className={s.num}>Valor</th></tr></thead>
        <tbody>{list.map(e => { const done = e.tasks.filter(t => t.done).length; return <tr key={e.id} onClick={() => ctx.openEvent(e.id)} tabIndex={0} onKeyDown={k => k.key === 'Enter' && ctx.openEvent(e.id)}>
          <td><span className={s.cell}><Cover e={e} className={s.thumb} /><span className={s.stackText}><b>{e.title}</b><small>{e.type} · {e.code}</small></span></span></td>
          <td>{dateLabel(e.date)}<small className={s.muted}> {e.time}</small></td><td><span className={s.stackText}>{e.venue}<small>{e.city}</small></span></td><td>{e.expected}</td>
          <td><Pill tone={stageTone[e.stage]}>{e.stage}</Pill></td>
          <td>{e.tasks.length ? <span className={s.progress}><i><em style={{ width: `${done / e.tasks.length * 100}%` }} /></i>{done}/{e.tasks.length}</span> : <span className={s.muted}>—</span>}</td>
          <td className={s.num}>{brl(e.value)}</td>
        </tr>; })}</tbody>
      </table>{!list.length && <p className={s.empty}>Nenhum evento com esses filtros.</p>}</div>}
      {mode === 'Funil' && <div className={s.board}>{[...stages, 'Cancelado' as const].map(st => { const items = store.events.filter(e => e.stage === st && (!type || e.type === type) && has(q, e.title, e.venue) && (st !== 'Realizado' || e.date >= addDays(today, -90))).sort((a, b) => a.date.localeCompare(b.date)); return <div key={st} className={s.column}>
        <header><Pill tone={stageTone[st]}>{st}</Pill><span>{items.length} · {brl(items.reduce((v, e) => v + e.value, 0))}</span></header>
        {items.map(e => <article key={e.id} className={s.dealCard}><button onClick={() => ctx.openEvent(e.id)}><b>{e.title}</b><small>{e.type} · {dateLabel(e.date)}</small><small>{e.expected} convidados · {brl(e.value)}</small></button>
          <select value={e.stage} onChange={x => ctx.updateEvent(e.id, () => ({ stage: x.target.value as Stage }), `${e.title}: ${x.target.value}.`)} aria-label={`Etapa de ${e.title}`}>{[...stages, 'Cancelado'].map(o => <option key={o}>{o}</option>)}</select></article>)}
        {st === 'Realizado' && <p className={s.hint}>Mostrando os últimos 90 dias.</p>}
      </div>; })}</div>}
      {mode === 'Calendário' && <MonthCalendar ctx={ctx} filter={e => (!type || e.type === type) && has(q, e.title, e.venue)} />}
    </section>
  </div>;
}

function MonthCalendar({ ctx, filter }: { ctx: Ctx; filter: (e: Event) => boolean }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(`${ctx.today}T12:00`); base.setDate(1); base.setMonth(base.getMonth() + offset);
  const first = new Date(base); first.setDate(1 - base.getDay());
  const days = Array.from({ length: 42 }, (_, i) => dayKey(new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, 12)));
  const label = base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return <div>
    <div className={s.calHead}><button className={s.iconBtn} onClick={() => setOffset(offset - 1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button><b>{label.charAt(0).toUpperCase() + label.slice(1)}</b><button className={s.iconBtn} onClick={() => setOffset(offset + 1)} aria-label="Próximo mês"><ChevronRight size={18} /></button>{offset !== 0 && <button className={s.chip} onClick={() => setOffset(0)}>Hoje</button>}</div>
    <div className={s.calendar}>{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <b key={d}>{d}</b>)}
      {days.map(d => { const items = ctx.store.events.filter(e => e.date === d && e.stage !== 'Cancelado' && filter(e)); return <div key={d} className={`${s.day} ${d.slice(5, 7) !== dayKey(base).slice(5, 7) ? s.dayOut : ''} ${d === ctx.today ? s.dayToday : ''}`}>
        <span>{Number(d.slice(8))}</span>
        {items.map(e => <button key={e.id} className={`${s.event} ${stageTone[e.stage]}`} onClick={() => ctx.openEvent(e.id)} title={`${e.type} · ${e.title}`}>{e.time} {e.title}</button>)}
      </div>; })}
    </div>
  </div>;
}

function ClientsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [q, setQ] = useState('');
  const rows = store.clients.filter(c => has(q, c.name, c.email, c.phone)).map(c => { const evs = store.events.filter(e => e.clientId === c.id); return { c, evs, total: evs.filter(live).reduce((v, e) => v + e.value, 0), next: evs.filter(e => live(e) && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] }; }).sort((a, b) => (a.next?.date ?? '9').localeCompare(b.next?.date ?? '9'));
  return <div className={s.page}>
    <PageHead title="Clientes" subtitle="Casais, famílias e empresas que confiam na Vélia."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'client' })}><Plus size={17} />Novo cliente</button></PageHead>
    <Stats items={[['Clientes', store.clients.length], ['Com evento futuro', rows.filter(r => r.next).length], ['Casais', store.clients.filter(c => c.kind === 'Casal').length], ['Empresas', store.clients.filter(c => c.kind === 'Empresa').length]]} />
    <section className={s.card}>
      <div className={s.toolbar}><label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, e-mail ou telefone" aria-label="Filtrar clientes" /></label></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Cliente</th><th>Tipo</th><th>Contato</th><th>Origem</th><th>Próximo evento</th><th className={s.num}>Total contratado</th></tr></thead>
        <tbody>{rows.map(({ c, evs, total, next }) => <tr key={c.id} onClick={() => evs[0] ? ctx.openEvent((next ?? evs[0]).id) : ctx.setModal({ kind: 'client', id: c.id })}>
          <td><span className={s.cell}><Avatar name={c.name} /><b>{c.name}</b></span></td><td>{c.kind}</td><td><span className={s.stackText}>{c.email}<small>{c.phone}</small></span></td><td>{c.source}</td>
          <td>{next ? <span className={s.stackText}>{next.type}<small>{dateLabel(next.date)}</small></span> : <span className={s.muted}>—</span>}</td><td className={s.num}>{brl(total)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function SuppliersView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [category, setCategory] = useState('');
  const rows = store.suppliers.filter(x => !category || x.category === category).map(x => {
    const bookings = store.events.filter(live).flatMap(e => e.bookings.filter(b => b.supplierId === x.id).map(b => ({ e, b })));
    return { x, count: bookings.length, open: bookings.filter(({ b }) => !b.paid).reduce((v, { b }) => v + b.value, 0), next: bookings.filter(({ e }) => e.date >= today).sort((a, b) => a.e.date.localeCompare(b.e.date))[0]?.e };
  });
  return <div className={s.page}>
    <PageHead title="Fornecedores" subtitle="Parceiros de espaço, buffet, decoração, fotografia e mais."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'supplier' })}><Plus size={17} />Novo fornecedor</button></PageHead>
    <Stats items={[['Fornecedores', store.suppliers.length], ['A pagar (eventos futuros)', brl(rows.reduce((v, r) => v + r.open, 0))], ['Avaliação média', (store.suppliers.reduce((v, x) => v + x.rating, 0) / Math.max(1, store.suppliers.length)).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' ★']]} />
    <section className={s.card}>
      <div className={s.toolbar}><select className={s.select} value={category} onChange={e => setCategory(e.target.value)} aria-label="Categoria"><option value="">Todas as categorias</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Fornecedor</th><th>Categoria</th><th>Contato</th><th>Avaliação</th><th>Eventos</th><th>Próximo evento</th><th className={s.num}>A pagar</th></tr></thead>
        <tbody>{rows.map(({ x, count, open, next }) => <tr key={x.id} onClick={() => ctx.setModal({ kind: 'supplier', id: x.id })}>
          <td><b>{x.name}</b></td><td>{x.category}</td><td><span className={s.stackText}>{x.contact}<small>{x.phone}</small></span></td><td className={s.stars}>{'★'.repeat(x.rating)}<span>{'★'.repeat(5 - x.rating)}</span></td><td>{count}</td>
          <td>{next ? <span className={s.stackText}>{next.title}<small>{dateLabel(next.date)}</small></span> : '—'}</td><td className={s.num}>{open ? brl(open) : '—'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const year = Number(today.slice(0, 4));
  const evs = store.events.filter(live);
  const all = evs.flatMap(e => e.installments.map(i => ({ e, i })));
  const receivedTotal = all.filter(x => x.i.paid).reduce((v, x) => v + x.i.value, 0);
  const open = all.filter(x => !x.i.paid).sort((a, b) => a.i.due.localeCompare(b.i.due));
  const overdue = open.filter(x => x.i.due < today);
  const months = Array.from({ length: 12 }, (_, m) => { const key = `${year}-${String(m + 1).padStart(2, '0')}`; const list = evs.filter(e => e.date.startsWith(key)); return { key, label: new Date(year, m, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), revenue: list.reduce((v, e) => v + e.value, 0), cost: list.reduce((v, e) => v + costs(e), 0) }; });
  const peak = Math.max(...months.map(m => m.revenue), 1);
  const yearList = evs.filter(e => e.date.startsWith(String(year)));
  const yearRevenue = yearList.reduce((v, e) => v + e.value, 0), yearCost = yearList.reduce((v, e) => v + costs(e), 0);
  return <div className={s.page}>
    <PageHead title="Financeiro" subtitle="Contratos, parcelas, custos com fornecedores e margem.">
      <button className={s.secondary} onClick={() => download('velia-financeiro.csv', csv([['Evento', 'Data do evento', 'Parcela', 'Vencimento', 'Valor', 'Situação'], ...all.map(({ e, i }) => [e.title, dateLabel(e.date), i.label, dateLabel(i.due), i.value.toFixed(2), i.paid ? 'Recebida' : i.due < today ? 'Vencida' : 'A receber'])]), 'text/csv')}><Download size={16} />CSV</button>
    </PageHead>
    <Stats items={[[`Contratado em ${year}`, brl(yearRevenue), `${yearList.length} eventos`], ['Recebido', brl(receivedTotal)], ['A receber', brl(open.reduce((v, x) => v + x.i.value, 0)), `${overdue.length} parcelas vencidas`], [`Margem prevista ${year}`, brl(yearRevenue - yearCost), yearRevenue ? pct((yearRevenue - yearCost) / yearRevenue * 100) : '—']]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Contratos por mês do evento ({year})</h2><span className={s.legend}><i className={s.lRev} />Contrato<i className={s.lCost} />Custos</span></div>
      <div className={s.chart}>{months.map(m => <div key={m.key} title={`${m.label}: ${brl(m.revenue)} · custos ${brl(m.cost)}`} className={m.key === today.slice(0, 7) ? s.chartNow : ''}><span><i className={s.lRev} style={{ height: `${m.revenue / peak * 100}%` }}><u className={s.lCost} style={{ height: `${m.revenue ? m.cost / m.revenue * 100 : 0}%` }} /></i></span><small>{m.label}</small></div>)}</div>
    </section>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Parcelas a receber</h2></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Evento</th><th>Parcela</th><th>Vencimento</th><th>Situação</th><th className={s.num}>Valor</th><th /></tr></thead>
        <tbody>{open.slice(0, 40).map(({ e, i }) => <tr key={i.id} onClick={() => ctx.openEvent(e.id, 'Financeiro')}>
          <td><span className={s.stackText}><b>{e.title}</b><small>{e.type} · {dateLabel(e.date)}</small></span></td><td>{i.label}</td><td>{dateLabel(i.due)}</td><td>{i.due < today ? <Pill tone={s.tRed}>Vencida</Pill> : <Pill tone={s.tGray}>A receber</Pill>}</td><td className={s.num}>{brl(i.value)}</td>
          <td><button className={s.chip} onClick={x => { x.stopPropagation(); ctx.updateEvent(e.id, ev => ({ installments: ev.installments.map(y => y.id === i.id ? { ...y, paid: true } : y) }), `${i.label} de ${e.title} recebida.`); }}>Marcar recebida</button></td>
        </tr>)}</tbody>
      </table>{!open.length && <p className={s.empty}>Nenhuma parcela em aberto.</p>}</div>
    </section>
  </div>;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [form, setForm] = useState(store.settings);
  const done = store.events.filter(e => e.stage === 'Realizado' && e.date >= addDays(today, -365));
  const byType = types.map(t => ({ t, list: done.filter(e => e.type === t) }));
  const bySource = sources.map(src => ({ src, n: store.clients.filter(c => c.source === src).length }));
  const maxType = Math.max(...byType.map(x => x.list.length), 1), maxSource = Math.max(...bySource.map(x => x.n), 1);
  return <div className={s.page}>
    <PageHead title="Relatórios" subtitle="Últimos 12 meses, exportações e configurações." />
    <Stats items={[['Eventos realizados (12 meses)', done.length], ['Ticket médio', brl(done.reduce((v, e) => v + e.value, 0) / Math.max(1, done.length))], ['Convidados atendidos', done.reduce((v, e) => v + e.expected, 0).toLocaleString('pt-BR')], ['Margem média', pct(done.reduce((v, e) => v + (e.value - costs(e)) / e.value, 0) / Math.max(1, done.length) * 100)]]} />
    <div className={s.twoCol}>
      <section className={s.card}><div className={s.cardHead}><h2>Eventos por tipo</h2></div><ul className={s.hbars}>{byType.map(({ t, list }) => <li key={t}><span>{t}</span><span className={s.meter}><i style={{ width: `${list.length / maxType * 100}%` }} /></span><b>{list.length}</b></li>)}</ul></section>
      <section className={s.card}><div className={s.cardHead}><h2>Origem dos clientes</h2></div><ul className={s.hbars}>{bySource.map(({ src, n }) => <li key={src}><span>{src}</span><span className={s.meter}><i style={{ width: `${n / maxSource * 100}%` }} /></span><b>{n}</b></li>)}</ul></section>
    </div>
    <section className={s.card}><div className={s.cardHead}><h2>Exportações e dados</h2></div><div className={s.exportList}>
      <button className={s.secondary} onClick={() => download('velia-eventos.csv', csv([['Código', 'Tipo', 'Evento', 'Data', 'Local', 'Convidados', 'Etapa', 'Valor', 'Recebido', 'Custos'], ...store.events.map(e => [e.code, e.type, e.title, dateLabel(e.date), e.venue, e.expected, e.stage, e.value, received(e), costs(e)])]), 'text/csv')}><Download size={16} />Eventos (CSV)</button>
      <button className={s.secondary} onClick={() => download('velia-backup.json', JSON.stringify(store, null, 2), 'application/json')}><Download size={16} />Backup completo (JSON)</button>
      <button className={s.secondary} onClick={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) ctx.set(() => makeSeed(), 'Dados de exemplo restaurados.'); }}><RotateCcw size={16} />Restaurar dados de exemplo</button>
    </div></section>
    <section className={s.card}><div className={s.cardHead}><h2>Configurações</h2></div>
      <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(() => ({ settings: form }), 'Configurações salvas.'); }}>
        <label className={s.field}><span>Nome da empresa</span><input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
        <label className={s.field}><span>Responsável</span><input required value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
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

function EventForm({ ctx, id, preset, onClose }: { ctx: Ctx; id?: string; preset?: Partial<Event>; onClose: () => void }) {
  const { store, today } = ctx;
  const editing = id ? store.events.find(e => e.id === id) : undefined;
  const [f, setF] = useState(() => ({ type: (editing?.type ?? preset?.type ?? 'Casamento') as EventType, title: editing?.title ?? '', clientId: editing?.clientId ?? '', newClient: '', phone: '', date: editing?.date ?? addDays(today, 180), time: editing?.time ?? '17:00', venue: editing?.venue ?? '', city: editing?.city ?? '', expected: String(editing?.expected ?? 150), value: String(editing?.value ?? ''), stage: (editing?.stage ?? 'Orçamento') as Stage, notes: editing?.notes ?? '' }));
  function submit(e: FormEvent) {
    e.preventDefault();
    let clientId = f.clientId;
    const newClient: Client | null = !clientId ? { id: uid(), name: f.newClient.trim() || f.title.trim(), kind: f.type === 'Casamento' ? 'Casal' : f.type === 'Corporativo' ? 'Empresa' : 'Pessoa', email: '', phone: f.phone, source: 'Site', createdAt: today } : null;
    if (newClient) clientId = newClient.id;
    const data = { type: f.type, title: f.title.trim(), clientId, date: f.date, time: f.time, venue: f.venue, city: f.city, expected: num(f.expected), value: num(f.value), stage: f.stage, notes: f.notes };
    if (editing) ctx.set(st => ({ events: st.events.map(x => x.id === editing.id ? { ...x, ...data } : x), clients: newClient ? [...st.clients, newClient] : st.clients }), 'Evento atualizado.');
    else ctx.set(st => ({ next: st.next + 1, clients: newClient ? [...st.clients, newClient] : st.clients, events: [...st.events, { id: uid(), code: `VL-${300 + st.next}`, cover: f.type === 'Casamento' ? 'arch' : '', tasks: [], bookings: [], installments: [], guests: [], galleryDelivered: false, createdAt: today, ...data }] }), `${f.type} ${data.title} criado em ${f.stage}.`);
    onClose();
  }
  return <Shell title={editing ? 'Editar evento' : 'Novo evento'} onClose={onClose} wide>
    <form className={s.form} onSubmit={submit}>
      <label className={s.field}><span>Tipo</span><select value={f.type} onChange={e => setF({ ...f, type: e.target.value as EventType })}>{types.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className={s.field}><span>Nome do evento</span><input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={f.type === 'Casamento' ? 'Ex.: Ana & Pedro' : f.type === 'Corporativo' ? 'Ex.: Convenção anual' : 'Ex.: 15 anos da Laura'} /></label>
      <label className={s.field}><span>Cliente</span><select value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}><option value="">+ Novo cliente</option>{[...store.clients].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {!f.clientId ? <label className={s.field}><span>Telefone do novo cliente</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label> : <span />}
      <label className={s.field}><span>Data</span><input type="date" required value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
      <label className={s.field}><span>Horário</span><input type="time" required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></label>
      <label className={s.field}><span>Local</span><input value={f.venue} onChange={e => setF({ ...f, venue: e.target.value })} /></label>
      <label className={s.field}><span>Cidade</span><input value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></label>
      <label className={s.field}><span>Convidados esperados</span><input inputMode="numeric" value={f.expected} onChange={e => setF({ ...f, expected: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={s.field}><span>Valor do contrato (R$)</span><input inputMode="decimal" required value={f.value} onChange={e => setF({ ...f, value: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
      <label className={s.field}><span>Etapa</span><select value={f.stage} onChange={e => setF({ ...f, stage: e.target.value as Stage })}>{[...stages, 'Cancelado'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={`${s.field} ${s.wide}`}><span>Observações</span><textarea rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">{editing ? 'Salvar alterações' : 'Criar evento'}</button></footer>
    </form>
  </Shell>;
}

function ClientForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const c = id ? ctx.store.clients.find(x => x.id === id) : undefined;
  const [f, setF] = useState({ name: c?.name ?? '', kind: c?.kind ?? 'Casal' as Client['kind'], email: c?.email ?? '', phone: c?.phone ?? '', source: c?.source ?? sources[0] });
  return <Shell title={c ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (c) ctx.set(st => ({ clients: st.clients.map(x => x.id === c.id ? { ...x, ...f } : x) }), 'Cliente atualizado.'); else ctx.set(st => ({ clients: [...st.clients, { id: uid(), createdAt: ctx.today, ...f }] }), `${f.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Ana & Pedro" /></label>
      <label className={s.field}><span>Tipo</span><select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as Client['kind'] })}><option>Casal</option><option>Pessoa</option><option>Empresa</option></select></label>
      <label className={s.field}><span>Origem</span><select value={f.source} onChange={e => setF({ ...f, source: e.target.value })}>{sources.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>E-mail</span><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
      <label className={s.field}><span>Telefone</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function SupplierForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const x = id ? ctx.store.suppliers.find(y => y.id === id) : undefined;
  const [f, setF] = useState({ name: x?.name ?? '', category: x?.category ?? categories[0], contact: x?.contact ?? '', phone: x?.phone ?? '', rating: String(x?.rating ?? 5) });
  return <Shell title={x ? 'Editar fornecedor' : 'Novo fornecedor'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); const data = { ...f, rating: Number(f.rating) }; if (x) ctx.set(st => ({ suppliers: st.suppliers.map(y => y.id === x.id ? { ...y, ...data } : y) }), 'Fornecedor atualizado.'); else ctx.set(st => ({ suppliers: [...st.suppliers, { id: uid(), ...data }] }), `${f.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Empresa</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>Categoria</span><select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className={s.field}><span>Avaliação</span><select value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{'★'.repeat(r)}</option>)}</select></label>
      <label className={s.field}><span>Contato</span><input value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} /></label>
      <label className={s.field}><span>Telefone</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function EventDrawer({ ctx, e, tab, onTab, onClose }: { ctx: Ctx; e: Event; tab: Tab; onTab: (t: Tab) => void; onClose: () => void }) {
  const { store, today } = ctx;
  const client = ctx.client(e.clientId);
  const update = (fn: (x: Event) => Partial<Event>, message?: string) => ctx.updateEvent(e.id, fn, message);
  const [task, setTask] = useState({ phase: 'Planejamento' as Phase, title: '', due: addDays(today, 7) });
  const [booking, setBooking] = useState({ supplierId: store.suppliers[0]?.id ?? '', value: '' });
  const [guest, setGuest] = useState({ name: '', group: 'Amigos' });
  const [inst, setInst] = useState({ label: '', due: addDays(today, 30), value: '' });
  const [rsvp, setRsvp] = useState<Rsvp | 'Todos'>('Todos');
  const confirmed = e.guests.filter(g => g.rsvp === 'Confirmado').length, pending = e.guests.filter(g => g.rsvp === 'Pendente').length;
  const margin = e.value - costs(e);
  const daysTo = Math.round((new Date(`${e.date}T12:00`).getTime() - new Date(`${today}T12:00`).getTime()) / 864e5);
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.drawer} ${serif.variable}`} aria-describedby={undefined}>
      <div className={s.drawerCover}><Cover e={e} /><Dialog.Close className={`${s.iconBtn} ${s.drawerClose}`} aria-label="Fechar"><X size={18} /></Dialog.Close>
        <div><small>{e.type} · {e.code}</small><Dialog.Title className={s.serifTitle}>{e.title}</Dialog.Title><p>{longDate(e.date)} · {e.time} · {e.venue}</p></div></div>
      <div className={s.drawerMeta}><Pill tone={stageTone[e.stage]}>{e.stage}</Pill><span>{daysTo > 0 ? `faltam ${daysTo} dias` : daysTo === 0 ? 'é hoje!' : `realizado há ${-daysTo} dias`}</span><span>{client?.name}{client?.phone ? ` · ${client.phone}` : ''}</span></div>
      <nav className={s.dTabs} role="tablist">{(['Resumo', 'Cronograma', 'Fornecedores', 'Convidados', 'Financeiro', 'Fotos'] as Tab[]).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? s.dTabOn : ''} onClick={() => onTab(t)}>{t}</button>)}</nav>
      <div className={s.drawerBody}>
        {tab === 'Resumo' && <div className={s.stack}>
          <div className={s.factGrid}><span>Convidados<b>{e.guests.length ? `${confirmed}/${e.guests.length}` : e.expected}</b></span><span>Contrato<b>{brl(e.value)}</b></span><span>Recebido<b>{brl(received(e))}</b></span><span>Fornecedores<b>{brl(costs(e))}</b></span><span>Margem<b>{brl(margin)}</b></span><span>Tarefas<b>{e.tasks.filter(t => t.done).length}/{e.tasks.length}</b></span></div>
          <ul className={s.phaseRows}>{[...phases, 'Dia do evento' as const].map(p => { const st = phaseStatus(e, p, today), Icon = statusIcon[st]; return <li key={p}><Icon size={18} className={st === 'Concluído' ? s.stDone : st === 'Em andamento' ? s.stDoing : s.stTodo} fill={st === 'Concluído' ? 'currentColor' : 'none'} /><b>{p}</b><span>{st}</span></li>; })}</ul>
          <label className={s.field}><span>Etapa comercial</span><select value={e.stage} onChange={x => update(() => ({ stage: x.target.value as Stage }), `Etapa: ${x.target.value}.`)}>{[...stages, 'Cancelado'].map(o => <option key={o}>{o}</option>)}</select></label>
          {e.notes && <p className={s.notes}>{e.notes}</p>}
          <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'event', id: e.id })}>Editar dados do evento</button>
        </div>}
        {tab === 'Cronograma' && <div className={s.stack}>
          {phases.map(p => { const list = e.tasks.filter(t => t.phase === p).sort((a, b) => a.due.localeCompare(b.due)); return <section key={p} className={s.block}><h3>{p} <small>{list.filter(t => t.done).length}/{list.length}</small></h3>
            <ul className={s.taskList}>{list.map(t => <li key={t.id} className={t.done ? s.taskDone : ''}><button className={s.checkBox} onClick={() => update(x => ({ tasks: x.tasks.map(y => y.id === t.id ? { ...y, done: !y.done } : y) }))} role="checkbox" aria-checked={t.done} aria-label={t.title}>{t.done && <Check size={13} strokeWidth={3} />}</button><span>{t.title}<small className={!t.done && t.due < today ? s.lateText : ''}>{dateLabel(t.due)}{!t.done && t.due < today ? ' · atrasada' : ''}</small></span><button className={s.iconBtn} onClick={() => update(x => ({ tasks: x.tasks.filter(y => y.id !== t.id) }))} aria-label={`Remover ${t.title}`}><Trash2 size={15} /></button></li>)}{!list.length && <li className={s.muted}>Nenhuma tarefa.</li>}</ul></section>; })}
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); if (!task.title.trim()) return; update(ev => ({ tasks: [...ev.tasks, { id: uid(), phase: task.phase, title: task.title.trim(), due: task.due, done: false }] }), 'Tarefa adicionada.'); setTask({ ...task, title: '' }); }}>
            <select value={task.phase} onChange={x => setTask({ ...task, phase: x.target.value as Phase })} aria-label="Etapa">{phases.map(p => <option key={p}>{p}</option>)}</select><input value={task.title} onChange={x => setTask({ ...task, title: x.target.value })} placeholder="Nova tarefa" aria-label="Nova tarefa" /><input type="date" value={task.due} onChange={x => setTask({ ...task, due: x.target.value })} aria-label="Prazo" /><button className={s.secondary} type="submit"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Fornecedores' && <div className={s.stack}>
          <ul className={s.rowsList}>{e.bookings.map(b => { const x = ctx.supplier(b.supplierId); return <li key={b.id}><span className={s.stackText}><b>{x?.name ?? 'Fornecedor removido'}</b><small>{b.service}</small></span><strong>{brl(b.value)}</strong><button className={`${s.chip} ${b.paid ? s.chipOn : ''}`} onClick={() => update(ev => ({ bookings: ev.bookings.map(y => y.id === b.id ? { ...y, paid: !y.paid } : y) }))}>{b.paid ? 'Pago' : 'A pagar'}</button><button className={s.iconBtn} onClick={() => update(ev => ({ bookings: ev.bookings.filter(y => y.id !== b.id) }))} aria-label="Remover"><Trash2 size={15} /></button></li>; })}{!e.bookings.length && <li className={s.muted}>Nenhum fornecedor contratado.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); const sup = ctx.supplier(booking.supplierId); if (!sup || !num(booking.value)) return; update(ev => ({ bookings: [...ev.bookings, { id: uid(), supplierId: sup.id, service: sup.category, value: num(booking.value), paid: false }] }), `${sup.name} contratado.`); setBooking({ ...booking, value: '' }); }}>
            <select value={booking.supplierId} onChange={x => setBooking({ ...booking, supplierId: x.target.value })} aria-label="Fornecedor">{store.suppliers.map(x => <option key={x.id} value={x.id}>{x.name} · {x.category}</option>)}</select><input value={booking.value} onChange={x => setBooking({ ...booking, value: x.target.value.replace(/[^\d,.]/g, '') })} placeholder="Valor" inputMode="decimal" aria-label="Valor" /><button className={s.secondary} type="submit"><Plus size={15} />Contratar</button>
          </form>
        </div>}
        {tab === 'Convidados' && <div className={s.stack}>
          <div className={s.factGrid}><span>Convidados<b>{e.guests.length}</b></span><span>Confirmados<b>{confirmed}</b></span><span>Pendentes<b>{pending}</b></span></div>
          <div className={s.segment}>{(['Todos', 'Confirmado', 'Pendente', 'Recusado'] as const).map(r => <button key={r} aria-pressed={rsvp === r} className={rsvp === r ? s.segOn : ''} onClick={() => setRsvp(r)}>{r}</button>)}</div>
          <ul className={s.rowsList}>{e.guests.filter(g => rsvp === 'Todos' || g.rsvp === rsvp).slice(0, 120).map(g => <li key={g.id}><span className={s.stackText}><b>{g.name}</b><small>{g.group} · mesa {g.table}</small></span><select className={s.rsvp} value={g.rsvp} onChange={x => update(ev => ({ guests: ev.guests.map(y => y.id === g.id ? { ...y, rsvp: x.target.value as Rsvp } : y) }))} aria-label={`Presença de ${g.name}`}><option>Confirmado</option><option>Pendente</option><option>Recusado</option></select></li>)}{!e.guests.length && <li className={s.muted}>Lista de convidados ainda não cadastrada.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); if (!guest.name.trim()) return; update(ev => ({ guests: [...ev.guests, { id: uid(), name: guest.name.trim(), group: guest.group, rsvp: 'Pendente', table: 1 + Math.floor(ev.guests.length / 10) }] }), 'Convidado adicionado.'); setGuest({ ...guest, name: '' }); }}>
            <input value={guest.name} onChange={x => setGuest({ ...guest, name: x.target.value })} placeholder="Nome do convidado" aria-label="Nome do convidado" /><select value={guest.group} onChange={x => setGuest({ ...guest, group: x.target.value })} aria-label="Grupo">{['Família da noiva', 'Família do noivo', 'Amigos', 'Trabalho', 'Família'].map(g => <option key={g}>{g}</option>)}</select><button className={s.secondary} type="submit"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Financeiro' && <div className={s.stack}>
          <div className={s.factGrid}><span>Contrato<b>{brl(e.value)}</b></span><span>Recebido<b>{brl(received(e))}</b></span><span>A receber<b>{brl(e.value - received(e))}</b></span><span>Fornecedores<b>{brl(costs(e))}</b></span><span>Margem<b>{brl(margin)}</b></span><span>Margem %<b>{e.value ? pct(margin / e.value * 100) : '—'}</b></span></div>
          <ul className={s.rowsList}>{e.installments.map(i => <li key={i.id}><span className={s.stackText}><b>{i.label}</b><small className={!i.paid && i.due < today ? s.lateText : ''}>{dateLabel(i.due)}{!i.paid && i.due < today ? ' · vencida' : ''}</small></span><strong>{brl(i.value)}</strong><button className={`${s.chip} ${i.paid ? s.chipOn : ''}`} onClick={() => update(ev => ({ installments: ev.installments.map(y => y.id === i.id ? { ...y, paid: !y.paid } : y) }), i.paid ? 'Parcela reaberta.' : 'Parcela recebida.')}>{i.paid ? 'Recebida' : 'Receber'}</button></li>)}{!e.installments.length && <li className={s.muted}>Nenhuma parcela lançada.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); if (!inst.label.trim() || !num(inst.value)) return; update(ev => ({ installments: [...ev.installments, { id: uid(), label: inst.label.trim(), due: inst.due, value: num(inst.value), paid: false }] }), 'Parcela lançada.'); setInst({ ...inst, label: '', value: '' }); }}>
            <input value={inst.label} onChange={x => setInst({ ...inst, label: x.target.value })} placeholder="Parcela" aria-label="Descrição da parcela" /><input type="date" value={inst.due} onChange={x => setInst({ ...inst, due: x.target.value })} aria-label="Vencimento" /><input value={inst.value} onChange={x => setInst({ ...inst, value: x.target.value.replace(/[^\d,.]/g, '') })} placeholder="Valor" inputMode="decimal" aria-label="Valor da parcela" /><button className={s.secondary} type="submit"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Fotos' && <div className={s.stack}>
          {e.stage === 'Realizado' ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className={s.gallery}>{(e.cover ? ['arch', 'aisle', 'sunset', 'guests'] : []).map(c => <img key={c} src={`/eventos-media/${c}.webp`} alt={`Registro de ${e.title}`} loading="lazy" />)}{!e.cover && <p className={s.muted}>As fotos deste evento ainda não foram enviadas.</p>}</div>
            <button className={`${s.secondary} ${e.galleryDelivered ? s.chipOn : ''}`} onClick={() => update(x => ({ galleryDelivered: !x.galleryDelivered }), e.galleryDelivered ? 'Galeria marcada como pendente.' : 'Galeria entregue ao cliente.')}><Check size={16} />{e.galleryDelivered ? 'Galeria entregue' : 'Marcar galeria como entregue'}</button>
          </> : <p className={s.muted}>Fotos e vídeos ficam disponíveis depois do evento. A fotografia contratada é {e.bookings.filter(b => b.service === 'Fotografia e vídeo').map(b => ctx.supplier(b.supplierId)?.name).join(', ') || 'ainda não definida'}.</p>}
        </div>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
