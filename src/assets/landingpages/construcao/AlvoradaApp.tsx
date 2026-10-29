'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, ArrowRight, Bell, Building2, CalendarCheck, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleCheck, CircleDot, Download, FileText, Hammer, Plus, RotateCcw, Search, Sofa, Trash2, Users, X, type LucideIcon } from 'lucide-react';
import { CalculatorArt, ChartArt, HelmetArt, HouseArt, HouseLogo } from './Art';
import { addDays, brl, categories, currentMilestone, dateLabel, dayKey, daysBetween, initials, live, makeMilestones, makeSeed, milestoneStatus, photoCovers, progress, purchaseStatuses, quoteStatuses, quoteTotal, received, roles, sources, spent, statuses, storageKey, types, uid, type Client, type MilestoneStatus, type Project, type ProjectType, type PurchaseStatus, type QuoteItem, type QuoteStatus, type Status, type Store, type Supplier } from './data';
import s from './AlvoradaApp.module.css';

type View = 'Visão Geral' | 'Projetos' | 'Orçamentos' | 'Clientes' | 'Fornecedores' | 'Financeiro' | 'Relatórios';
type Tab = 'Resumo' | 'Cronograma' | 'Compras' | 'Equipe' | 'Financeiro' | 'Diário';
type Modal = { kind: 'project'; id?: string } | { kind: 'quote'; id?: string } | { kind: 'client'; id?: string } | { kind: 'supplier'; id?: string } | null;
const views: View[] = ['Visão Geral', 'Projetos', 'Orçamentos', 'Clientes', 'Fornecedores', 'Financeiro', 'Relatórios'];
const typeIcon: Record<ProjectType, LucideIcon> = { Residencial: Building2, Reforma: Hammer, Comercial: Building2, Interiores: Sofa };
const statusTone: Record<Status, string> = { Planejamento: s.tBlue, 'Em execução': s.tAmber, Pausada: s.tGray, Concluída: s.tGreen };
const quoteTone: Record<QuoteStatus, string> = { Rascunho: s.tGray, Enviado: s.tBlue, Aprovado: s.tGreen, Recusado: s.tRed };
const purchaseTone: Record<PurchaseStatus, string> = { Cotação: s.tGray, Pedido: s.tBlue, Entregue: s.tGreen };
const msIcon: Record<MilestoneStatus, LucideIcon> = { Concluído: CircleCheck, 'Em andamento': CircleDot, Pendente: Circle, Atrasado: AlertTriangle };
const msClass: Record<MilestoneStatus, string> = { Concluído: s.stDone, 'Em andamento': s.stDoing, Pendente: s.stTodo, Atrasado: s.stLate };
const durations: Record<ProjectType, number> = { Residencial: 240, Reforma: 90, Comercial: 150, Interiores: 70 };
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const pct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const short = (key: string) => dateLabel(key).slice(0, 5);
const num = (v: string) => Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const compact = (v: number) => v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : `R$ ${Math.round(v / 1e3).toLocaleString('pt-BR')} mil`;

export default function AlvoradaApp() {
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
    setNow(Date.now()); setStore(saved?.projects ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  if (!store) return <div className={s.app}><div className={s.loading}><HouseLogo className={s.logoMark} /></div></div>;

  const today = dayKey(now);
  const set = (fn: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...fn(prev) }); if (message) setToast(message); };
  const updateProject = (id: string, fn: (p: Project) => Partial<Project>, message?: string) => set(st => ({ projects: st.projects.map(p => p.id === id ? { ...p, ...fn(p) } : p) }), message);
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const ctx: Ctx = { store, today, set, go, setModal, updateProject, openProject: (id, tab = 'Resumo') => setDrawer({ id, tab }), client: id => store.clients.find(c => c.id === id), supplier: id => store.suppliers.find(x => x.id === id) };
  const current = drawer && store.projects.find(p => p.id === drawer.id);
  const overview = view === 'Visão Geral';

  return <div className={`${s.app} ${overview ? s.photoMode : s.dataMode}`}>
    {overview && <div className={s.backdrop} aria-hidden="true" />}
    <TopBar ctx={ctx} view={view} />
    <main className={s.main}>
      {overview && <Overview ctx={ctx} />}
      {view === 'Projetos' && <ProjectsView ctx={ctx} />}
      {view === 'Orçamentos' && <QuotesView ctx={ctx} />}
      {view === 'Clientes' && <ClientsView ctx={ctx} />}
      {view === 'Fornecedores' && <SuppliersView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
    </main>
    {modal?.kind === 'project' && <ProjectForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'quote' && <QuoteForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'client' && <ClientForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'supplier' && <SupplierForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {current && <ProjectDrawer key={current.id} ctx={ctx} p={current} tab={drawer!.tab} onTab={tab => setDrawer({ id: current.id, tab })} onClose={() => setDrawer(null)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; today: string; set: (fn: (st: Store) => Partial<Store>, message?: string) => void; go: (v: View) => void; setModal: (m: Modal) => void; updateProject: (id: string, fn: (p: Project) => Partial<Project>, message?: string) => void; openProject: (id: string, tab?: Tab) => void; client: (id: string) => Client | undefined; supplier: (id: string) => Supplier | undefined };

function Pill({ tone, children }: { tone: string; children: ReactNode }) { return <em className={`${s.pill} ${tone}`}>{children}</em>; }
function Avatar({ name, size = 30 }: { name: string; size?: number }) { return <span className={s.avatar} style={{ width: size, height: size, fontSize: size * .38 }}>{initials(name)}</span>; }
function Bar({ value }: { value: number }) { return <span className={s.progress}><i><em style={{ width: `${value}%` }} /></i>{value}%</span>; }
function Cover({ p, className }: { p: Project; className?: string }) {
  const Icon = typeIcon[p.type];
  // eslint-disable-next-line @next/next/no-img-element
  return p.cover ? <img src={`/construcao-media/${p.cover}.webp`} alt={`Obra ${p.title}`} className={`${s.cover} ${className ?? ''}`} loading="lazy" /> : <span className={`${s.cover} ${s.coverArt} ${s[`cv${types.indexOf(p.type)}`]} ${className ?? ''}`} role="img" aria-label={`Obra ${p.title}`}><Icon size={28} strokeWidth={1.4} /></span>;
}
function MilestoneIcon({ status, size = 20 }: { status: MilestoneStatus; size?: number }) {
  const Icon = msIcon[status];
  return <Icon size={size} className={msClass[status]} fill={status === 'Concluído' ? 'currentColor' : 'none'} />;
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
/** Days left until the forecast date, or how late the project is. */
function deadline(p: Project, today: string) {
  if (p.status === 'Concluída') return `entregue em ${dateLabel(p.end)}`;
  const d = daysBetween(today, p.end);
  return d < 0 ? `${plural(-d, 'dia', 'dias')} de atraso` : d === 0 ? 'entrega hoje' : `faltam ${plural(d, 'dia', 'dias')}`;
}

function TopBar({ ctx, view }: { ctx: Ctx; view: View }) {
  const { store, today } = ctx;
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'search' | 'bell' | 'user' | null>(null);
  const close = useMemo(() => () => setPanel(null), []);
  const ref = useOutside(!!panel, close);
  const q = query.trim();
  const results = q ? [
    ...store.projects.filter(p => has(q, p.title, p.code, p.type, p.city, p.address)).slice(0, 6).map(p => ({ key: p.id, label: p.title, meta: `${p.type} · ${p.code} · ${p.status}`, run: () => ctx.openProject(p.id) })),
    ...store.quotes.filter(x => has(q, x.title, x.code)).slice(0, 3).map(x => ({ key: x.id, label: `${x.code} · ${x.title}`, meta: `Orçamento · ${x.status}`, run: () => ctx.setModal({ kind: 'quote', id: x.id }) })),
    ...store.clients.filter(c => has(q, c.name, c.email)).slice(0, 3).map(c => ({ key: c.id, label: c.name, meta: `Cliente · ${c.kind}`, run: () => ctx.setModal({ kind: 'client', id: c.id }) })),
    ...store.suppliers.filter(x => has(q, x.name, x.category)).slice(0, 3).map(x => ({ key: x.id, label: x.name, meta: `Fornecedor · ${x.category}`, run: () => ctx.setModal({ kind: 'supplier', id: x.id }) })),
  ] : [];
  const active = store.projects.filter(p => p.status === 'Em execução');
  const alerts = [
    ...active.flatMap(p => p.milestones.filter(m => milestoneStatus(m, today) === 'Atrasado').map(m => ({ key: m.id, text: `${p.title}: “${m.name}” deveria ter terminado em ${dateLabel(m.end)}`, run: () => ctx.openProject(p.id, 'Cronograma') }))),
    ...store.projects.filter(live).flatMap(p => p.installments.filter(i => !i.paid && i.due < today).map(i => ({ key: i.id, text: `${p.title}: ${i.label} de ${brl(i.value)} vencida em ${dateLabel(i.due)}`, run: () => ctx.openProject(p.id, 'Financeiro') }))),
    ...active.flatMap(p => p.purchases.filter(x => x.status === 'Pedido' && x.due <= addDays(today, 3)).map(x => ({ key: x.id, text: `${p.title}: entrega de ${x.item.toLowerCase()} prevista para ${dateLabel(x.due)}`, run: () => ctx.openProject(p.id, 'Compras') }))),
  ];
  return <header className={s.topbar} ref={ref}>
    <button className={s.brand} onClick={() => ctx.go('Visão Geral')} aria-label="Alvorada Construção e Reforma, ir para a visão geral"><HouseLogo className={s.logoMark} /><span>ALVORADA<small>CONSTRUÇÃO E REFORMA</small></span></button>
    <nav className={s.tabs} aria-label="Seções">{views.map(v => <button key={v} className={view === v ? s.tabOn : ''} aria-current={view === v ? 'page' : undefined} onClick={() => ctx.go(v)}>{v}</button>)}</nav>
    <div className={s.tools}>
      <div className={s.search}>
        <Search size={19} />
        <input value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar projetos, clientes..." aria-label="Buscar projetos, orçamentos, clientes ou fornecedores" />
        {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.iconCircle} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={20} />{alerts.length > 0 && <i className={s.dot} />}</button>
        {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Tudo em dia.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.user} onClick={() => setPanel(panel === 'user' ? null : 'user')} aria-label="Menu do usuário" aria-expanded={panel === 'user'}><Avatar name={`${store.settings.owner} Alvorada`} size={44} /><ChevronDown size={16} /></button>
        {panel === 'user' && <div className={`${s.popover} ${s.menuPop}`} role="menu"><p className={s.popTitle}>{store.settings.owner}<small>{store.settings.company}</small></p><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'project' }); setPanel(null); }}>Novo projeto</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'quote' }); setPanel(null); }}>Novo orçamento</button><button role="menuitem" onClick={() => { ctx.go('Relatórios'); setPanel(null); }}>Configurações</button></div>}
      </div>
    </div>
  </header>;
}

function Overview({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const active = store.projects.filter(p => p.status === 'Em execução');
  const [pick, setPick] = useState(0);
  const featured = active[pick % Math.max(1, active.length)];
  const fp = featured ? progress(featured) : 0;
  const step = featured && currentMilestone(featured);
  const openQuotes = store.quotes.filter(q => q.status === 'Enviado' || q.status === 'Rascunho');
  const week = addDays(today, 7), month = addDays(today, 30);
  const deliveries = active.flatMap(p => p.purchases.filter(x => x.status === 'Pedido').map(x => ({ p, x }))).sort((a, b) => a.x.due.localeCompare(b.x.due));
  const inflow = store.projects.filter(live).flatMap(p => p.installments.filter(i => !i.paid && i.due <= month).map(i => ({ p, label: i.label, due: i.due, value: i.value, kind: 'in' as const, id: i.id })));
  const outflow = store.projects.filter(live).flatMap(p => p.purchases.filter(x => !x.paid && x.status !== 'Cotação' && x.due <= month).map(x => ({ p, label: x.item, due: x.due, value: x.value, kind: 'out' as const, id: x.id })));
  const cash = [...inflow, ...outflow].sort((a, b) => a.due.localeCompare(b.due));
  const watch = active.flatMap(p => p.milestones.filter(m => m.progress < 100 && (m.end < today || m.end <= addDays(today, 14))).map(m => ({ p, m }))).sort((a, b) => a.m.end.localeCompare(b.m.end));
  const modules: { title: string; subtitle: string; stat: string; art: ReactNode; run: () => void }[] = [
    { title: 'Projetos', subtitle: 'Acompanhe o progresso de todas as obras', stat: plural(active.length, 'obra em execução', 'obras em execução'), art: <HouseArt />, run: () => ctx.go('Projetos') },
    { title: 'Orçamentos', subtitle: 'Crie, envie e controle propostas', stat: `${plural(openQuotes.length, 'proposta', 'propostas')} · ${compact(openQuotes.reduce((v, q) => v + quoteTotal(q), 0))}`, art: <CalculatorArt />, run: () => ctx.go('Orçamentos') },
    { title: 'Fornecedores', subtitle: 'Compras, cotações e entregas', stat: plural(deliveries.filter(d => d.x.due <= week).length, 'entrega em 7 dias', 'entregas em 7 dias'), art: <HelmetArt />, run: () => ctx.go('Fornecedores') },
    { title: 'Financeiro', subtitle: 'Custos, pagamentos e lucratividade', stat: `${compact(inflow.reduce((v, x) => v + x.value, 0))} a receber (30 dias)`, art: <ChartArt />, run: () => ctx.go('Financeiro') },
  ];
  return <>
    <section className={s.hero}>
      <div className={s.heroText}>
        <p className={s.welcome}>Bem-vindo de volta, <b>{store.settings.owner}</b>!</p>
        <h1>Projetos que<br />transformam<br /><span>espaços em vidas.</span></h1>
        <p className={s.lead}>Planeje, acompanhe e entregue suas obras <br />com mais controle, produtividade e lucro.</p>
        <button className={s.cta} onClick={() => ctx.setModal({ kind: 'project' })}><Plus size={22} />Novo projeto</button>
      </div>
      <div className={s.heroSide}>
        {featured ? <>
          <section className={`${s.glassLight} ${s.featured}`} aria-label="Obra em destaque">
            <header className={s.featuredHead}>
              <h2>Obra {featured.title}</h2>
              <span>{active.length > 1 && <><button className={s.miniBtn} onClick={() => setPick(pick + active.length - 1)} aria-label="Obra anterior"><ChevronLeft size={16} /></button><button className={s.miniBtn} onClick={() => setPick(pick + 1)} aria-label="Próxima obra"><ChevronRight size={16} /></button></>}<button className={s.link} onClick={() => ctx.openProject(featured.id)}>{featured.status}<ChevronRight size={16} /></button></span>
            </header>
            <div className={s.featuredBody}>
              <button className={s.featuredCover} onClick={() => ctx.openProject(featured.id)} aria-label={`Abrir ${featured.title}`}><Cover p={featured} /></button>
              <div className={s.featuredStats}>
                <b className={s.bigPct}>{fp}%</b>
                <span className={s.bar} role="progressbar" aria-valuenow={fp} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da obra"><i style={{ width: `${fp}%` }} /></span>
                <small>Etapa atual</small>
                <span>{step?.name ?? 'Entrega final'}</span>
              </div>
            </div>
            <dl className={s.facts}>
              <div><CalendarDays size={22} strokeWidth={1.5} /><dt>Início</dt><dd>{dateLabel(featured.start)}</dd></div>
              <div><CalendarCheck size={22} strokeWidth={1.5} /><dt>Previsão</dt><dd>{dateLabel(featured.end)}</dd></div>
              <div><Users size={22} strokeWidth={1.5} /><dt>Equipe</dt><dd>{plural(featured.team.length, 'pessoa', 'pessoas')}</dd></div>
              <div><FileText size={22} strokeWidth={1.5} /><dt>Orçamento</dt><dd>{brl(featured.budget)}</dd></div>
            </dl>
          </section>
          <section className={`${s.glassLight} ${s.milestonesCard}`} aria-label="Próximos marcos">
            <header><h2>Próximos marcos</h2><button className={s.link} onClick={() => ctx.openProject(featured.id, 'Cronograma')}>Ver cronograma<ArrowRight size={15} /></button></header>
            <ul>{featured.milestones.map(m => { const st = milestoneStatus(m, today); return <li key={m.id}><button onClick={() => ctx.openProject(featured.id, 'Cronograma')}><MilestoneIcon status={st} /><b>{m.name}</b><span className={st === 'Atrasado' ? s.lateText : ''}>{st}</span><time>{short(m.end)}</time></button></li>; })}</ul>
          </section>
        </> : <section className={`${s.glassLight} ${s.featured}`}><p className={s.emptyDark}>Nenhuma obra em execução. Crie um projeto ou aprove um orçamento.</p></section>}
      </div>
      <section className={s.modules} aria-label="Módulos">{modules.map(m => <button key={m.title} className={`${s.glassDark} ${s.module}`} onClick={m.run}>
        <span className={s.moduleArt}>{m.art}</span>
        <span className={s.moduleText}><b>{m.title}</b><small>{m.subtitle}</small><em>{m.stat}</em></span>
        <i className={s.arrow}><ArrowRight size={20} /></i>
      </button>)}</section>
    </section>
    <section className={s.below} aria-label="Acompanhamento">
      <div className={`${s.glassDark} ${s.panel}`}>
        <header><h2>Etapas para acompanhar</h2><span>{watch.length}</span></header>
        <ul>{watch.slice(0, 8).map(({ p, m }) => <li key={m.id}><MilestoneIcon status={milestoneStatus(m, today)} size={18} /><button className={s.rowBtn} onClick={() => ctx.openProject(p.id, 'Cronograma')}><b>{m.name}</b><small>{p.title} · {m.end < today ? <span className={s.lateText}>prazo era {dateLabel(m.end)}</span> : `até ${dateLabel(m.end)}`}</small></button><strong>{m.progress}%</strong></li>)}{!watch.length && <li className={s.empty}>Nenhuma etapa vencendo nas próximas 2 semanas.</li>}</ul>
      </div>
      <div className={`${s.glassDark} ${s.panel}`}>
        <header><h2>Entregas de materiais</h2><span>{deliveries.length}</span></header>
        <ul>{deliveries.slice(0, 8).map(({ p, x }) => <li key={x.id}><button className={s.check} onClick={() => ctx.updateProject(p.id, y => ({ purchases: y.purchases.map(z => z.id === x.id ? { ...z, status: 'Entregue' } : z) }), 'Entrega recebida.')} aria-label={`Confirmar entrega de ${x.item}`}><Check size={14} /></button><button className={s.rowBtn} onClick={() => ctx.openProject(p.id, 'Compras')}><b>{x.item}</b><small>{p.title} · {ctx.supplier(x.supplierId)?.name} · {x.due < today ? <span className={s.lateText}>atrasada desde {dateLabel(x.due)}</span> : dateLabel(x.due)}</small></button></li>)}{!deliveries.length && <li className={s.empty}>Nenhum pedido aguardando entrega.</li>}</ul>
      </div>
      <div className={`${s.glassDark} ${s.panel}`}>
        <header><h2>Caixa nos próximos 30 dias</h2><span>{brl(inflow.reduce((v, x) => v + x.value, 0) - outflow.reduce((v, x) => v + x.value, 0))}</span></header>
        <ul>{cash.slice(0, 8).map(c => <li key={c.id}><button className={s.rowBtn} onClick={() => ctx.openProject(c.p.id, c.kind === 'in' ? 'Financeiro' : 'Compras')}><b>{c.p.title} · {c.label}</b><small>{c.due < today ? <span className={s.lateText}>vencido em {dateLabel(c.due)}</span> : dateLabel(c.due)}</small></button><strong className={c.kind === 'in' ? s.inflow : s.outflow}>{c.kind === 'in' ? '+' : '−'} {brl(c.value)}</strong></li>)}{!cash.length && <li className={s.empty}>Sem movimentos previstos.</li>}</ul>
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

function ProjectsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [mode, setMode] = useState<'Lista' | 'Quadro' | 'Cronograma'>('Lista');
  const [type, setType] = useState<ProjectType | ''>('');
  const [status, setStatus] = useState<Status | 'Ativas' | 'Todas'>('Ativas');
  const [q, setQ] = useState('');
  const match = (p: Project) => (!type || p.type === type) && has(q, p.title, p.code, p.city, p.address);
  const list = store.projects.filter(p => match(p) && (status === 'Todas' || (status === 'Ativas' ? live(p) : p.status === status))).sort((a, b) => a.end.localeCompare(b.end));
  const active = store.projects.filter(p => p.status === 'Em execução');
  const late = active.filter(p => p.milestones.some(m => milestoneStatus(m, today) === 'Atrasado'));
  return <div className={s.page}>
    <PageHead title="Projetos" subtitle="Todas as obras, do planejamento à entrega das chaves."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'project' })}><Plus size={17} />Novo projeto</button></PageHead>
    <Stats items={[['Em execução', active.length, brl(active.reduce((v, p) => v + p.budget, 0))], ['Em planejamento', store.projects.filter(p => p.status === 'Planejamento').length], ['Com etapa atrasada', late.length, late.map(p => p.title).slice(0, 2).join(', ') || 'Tudo no prazo'], ['Progresso médio', pct(active.reduce((v, p) => v + progress(p), 0) / Math.max(1, active.length))]]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{(['Lista', 'Quadro', 'Cronograma'] as const).map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? s.segOn : ''} onClick={() => setMode(m)}>{m}</button>)}</div>
        <select className={s.select} value={type} onChange={e => setType(e.target.value as ProjectType | '')} aria-label="Tipo"><option value="">Todos os tipos</option>{types.map(t => <option key={t}>{t}</option>)}</select>
        {mode === 'Lista' && <select className={s.select} value={status} onChange={e => setStatus(e.target.value as typeof status)} aria-label="Situação"><option>Ativas</option><option>Todas</option>{statuses.map(x => <option key={x}>{x}</option>)}</select>}
        <label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Obra, código ou endereço" aria-label="Filtrar projetos" /></label>
      </div>
      {mode === 'Lista' && <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Obra</th><th>Cliente</th><th>Prazo</th><th>Etapa atual</th><th>Progresso</th><th>Situação</th><th className={s.num}>Orçamento</th></tr></thead>
        <tbody>{list.map(p => { const lateStep = p.milestones.some(m => milestoneStatus(m, today) === 'Atrasado'); return <tr key={p.id} onClick={() => ctx.openProject(p.id)} tabIndex={0} onKeyDown={k => k.key === 'Enter' && ctx.openProject(p.id)}>
          <td><span className={s.cell}><Cover p={p} className={s.thumb} /><span className={s.stackText}><b>{p.title}</b><small>{p.type} · {p.code}</small></span></span></td>
          <td>{ctx.client(p.clientId)?.name}</td>
          <td><span className={s.stackText}>{dateLabel(p.start)} → {dateLabel(p.end)}<small className={p.status !== 'Concluída' && p.end < today ? s.lateText : ''}>{deadline(p, today)}</small></span></td>
          <td>{p.status === 'Concluída' ? <span className={s.muted}>—</span> : <span className={lateStep ? s.lateText : ''}>{currentMilestone(p)?.name ?? '—'}</span>}</td>
          <td><Bar value={progress(p)} /></td>
          <td><Pill tone={statusTone[p.status]}>{p.status}</Pill></td>
          <td className={s.num}>{brl(p.budget)}</td>
        </tr>; })}</tbody>
      </table>{!list.length && <p className={s.empty}>Nenhuma obra com esses filtros.</p>}</div>}
      {mode === 'Quadro' && <div className={s.board}>{statuses.map(st => { const items = store.projects.filter(p => p.status === st && match(p) && (st !== 'Concluída' || p.end >= addDays(today, -180))); return <div key={st} className={s.column}>
        <header><Pill tone={statusTone[st]}>{st}</Pill><span>{items.length} · {brl(items.reduce((v, p) => v + p.budget, 0))}</span></header>
        {items.map(p => <article key={p.id} className={s.dealCard}><button onClick={() => ctx.openProject(p.id)}><b>{p.title}</b><small>{p.type} · {p.city}</small><Bar value={progress(p)} /><small>Previsão {dateLabel(p.end)}</small></button>
          <select value={p.status} onChange={x => ctx.updateProject(p.id, () => ({ status: x.target.value as Status }), `${p.title}: ${x.target.value}.`)} aria-label={`Situação de ${p.title}`}>{statuses.map(o => <option key={o}>{o}</option>)}</select></article>)}
        {st === 'Concluída' && <p className={s.hint}>Mostrando os últimos 6 meses.</p>}
      </div>; })}</div>}
      {mode === 'Cronograma' && <Gantt ctx={ctx} projects={store.projects.filter(p => live(p) && match(p)).sort((a, b) => a.start.localeCompare(b.start))} />}
    </section>
  </div>;
}

function Gantt({ ctx, projects }: { ctx: Ctx; projects: Project[] }) {
  const { today } = ctx;
  const base = new Date(`${today}T12:00`); base.setDate(1); base.setMonth(base.getMonth() - 3);
  const from = dayKey(base);
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(base); d.setMonth(base.getMonth() + i); return { key: dayKey(d), label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') }; });
  const end = new Date(base); end.setMonth(base.getMonth() + 12);
  const span = daysBetween(from, dayKey(end));
  const pos = (key: string) => Math.min(100, Math.max(0, daysBetween(from, key) / span * 100));
  return <div className={s.ganttWrap}><div className={s.gantt}>
    <div className={s.ganttRow}><span className={s.ganttLabel}>Obra</span><div className={s.ganttTrack}>{months.map(m => <span key={m.key} className={s.ganttMonth} style={{ left: `${pos(m.key)}%` }}>{m.label}</span>)}</div></div>
    {projects.map(p => { const v = progress(p); return <div key={p.id} className={s.ganttRow}>
      <button className={s.ganttLabel} onClick={() => ctx.openProject(p.id, 'Cronograma')}><b>{p.title}</b><small>{p.type} · {v}%</small></button>
      <div className={s.ganttTrack}>
        {months.map(m => <i key={m.key} className={s.ganttLine} style={{ left: `${pos(m.key)}%` }} />)}
        <i className={s.ganttToday} style={{ left: `${pos(today)}%` }} />
        <button className={`${s.ganttBar} ${p.status === 'Pausada' ? s.ganttPaused : p.status === 'Planejamento' ? s.ganttPlan : ''}`} style={{ left: `${pos(p.start)}%`, width: `${Math.max(1.5, pos(p.end) - pos(p.start))}%` }} onClick={() => ctx.openProject(p.id, 'Cronograma')} title={`${p.title}: ${dateLabel(p.start)} a ${dateLabel(p.end)}`}><em style={{ width: `${v}%` }} /></button>
      </div>
    </div>; })}
    {!projects.length && <p className={s.empty}>Nenhuma obra ativa com esses filtros.</p>}
  </div><p className={s.hint}>A linha laranja marca hoje; o preenchimento de cada barra é o progresso da obra.</p></div>;
}

function QuotesView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [status, setStatus] = useState<QuoteStatus | 'Todos'>('Todos');
  const list = store.quotes.filter(q => status === 'Todos' || q.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = store.quotes.filter(q => q.status === 'Enviado' || q.status === 'Rascunho');
  const decided = store.quotes.filter(q => q.status === 'Aprovado' || q.status === 'Recusado');
  const approved = store.quotes.filter(q => q.status === 'Aprovado');
  return <div className={s.page}>
    <PageHead title="Orçamentos" subtitle="Crie, envie e acompanhe propostas até virarem obras."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'quote' })}><Plus size={17} />Novo orçamento</button></PageHead>
    <Stats items={[['Propostas em aberto', open.length, brl(open.reduce((v, q) => v + quoteTotal(q), 0))], ['Aguardando cliente', store.quotes.filter(q => q.status === 'Enviado').length], ['Taxa de aprovação', decided.length ? pct(approved.length / decided.length * 100) : '—', `${approved.length} de ${decided.length} decididas`], ['Ticket médio', brl(store.quotes.reduce((v, q) => v + quoteTotal(q), 0) / Math.max(1, store.quotes.length))]]} />
    <section className={s.card}>
      <div className={s.toolbar}><div className={s.segment}>{(['Todos', ...quoteStatuses] as const).map(x => <button key={x} aria-pressed={status === x} className={status === x ? s.segOn : ''} onClick={() => setStatus(x)}>{x}</button>)}</div></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Código</th><th>Proposta</th><th>Tipo</th><th>Criado</th><th>Validade</th><th>Situação</th><th className={s.num}>Total</th></tr></thead>
        <tbody>{list.map(q => <tr key={q.id} onClick={() => ctx.setModal({ kind: 'quote', id: q.id })} tabIndex={0} onKeyDown={k => k.key === 'Enter' && ctx.setModal({ kind: 'quote', id: q.id })}>
          <td><b>{q.code}</b></td><td><span className={s.stackText}><b>{q.title}</b><small>{ctx.client(q.clientId)?.name} · {q.city}</small></span></td><td>{q.type}</td><td>{dateLabel(q.createdAt)}</td>
          <td>{q.status === 'Enviado' && q.validUntil < today ? <span className={s.lateText}>{dateLabel(q.validUntil)} · vencida</span> : dateLabel(q.validUntil)}</td>
          <td><Pill tone={quoteTone[q.status]}>{q.status}</Pill></td><td className={s.num}>{brl(quoteTotal(q))}</td>
        </tr>)}</tbody>
      </table>{!list.length && <p className={s.empty}>Nenhum orçamento nesta situação.</p>}</div>
    </section>
  </div>;
}

function ClientsView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const [q, setQ] = useState('');
  const rows = store.clients.filter(c => has(q, c.name, c.email, c.phone)).map(c => { const ps = store.projects.filter(p => p.clientId === c.id); return { c, ps, total: ps.reduce((v, p) => v + p.budget, 0), active: ps.find(live) }; }).sort((a, b) => b.total - a.total);
  return <div className={s.page}>
    <PageHead title="Clientes" subtitle="Famílias e empresas atendidas pela Alvorada."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'client' })}><Plus size={17} />Novo cliente</button></PageHead>
    <Stats items={[['Clientes', store.clients.length], ['Com obra ativa', rows.filter(r => r.active).length], ['Pessoas', store.clients.filter(c => c.kind === 'Pessoa').length], ['Empresas', store.clients.filter(c => c.kind === 'Empresa').length]]} />
    <section className={s.card}>
      <div className={s.toolbar}><label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, e-mail ou telefone" aria-label="Filtrar clientes" /></label></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Cliente</th><th>Tipo</th><th>Contato</th><th>Origem</th><th>Obra ativa</th><th>Obras</th><th className={s.num}>Total contratado</th></tr></thead>
        <tbody>{rows.map(({ c, ps, total, active }) => <tr key={c.id} onClick={() => active ? ctx.openProject(active.id) : ctx.setModal({ kind: 'client', id: c.id })}>
          <td><span className={s.cell}><Avatar name={c.name} /><b>{c.name}</b></span></td><td>{c.kind}</td><td><span className={s.stackText}>{c.email}<small>{c.phone}</small></span></td><td>{c.source}</td>
          <td>{active ? <span className={s.stackText}>{active.title}<small>{active.status} · {progress(active)}%</small></span> : <span className={s.muted}>—</span>}</td><td>{ps.length}</td><td className={s.num}>{total ? brl(total) : '—'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function SuppliersView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [category, setCategory] = useState('');
  const all = store.projects.filter(live).flatMap(p => p.purchases.map(x => ({ p, x })));
  const pending = all.filter(({ x }) => x.status !== 'Entregue').sort((a, b) => a.x.due.localeCompare(b.x.due));
  const rows = store.suppliers.filter(x => !category || x.category === category).map(x => { const mine = all.filter(a => a.x.supplierId === x.id); return { x, orders: mine.filter(a => a.x.status === 'Pedido').length, open: mine.filter(a => a.x.status !== 'Cotação' && !a.x.paid).reduce((v, a) => v + a.x.value, 0), total: mine.filter(a => a.x.status !== 'Cotação').reduce((v, a) => v + a.x.value, 0) }; });
  const advance = (p: Project, id: string, to: PurchaseStatus) => ctx.updateProject(p.id, y => ({ purchases: y.purchases.map(z => z.id === id ? { ...z, status: to } : z) }), to === 'Pedido' ? 'Pedido enviado ao fornecedor.' : 'Entrega recebida.');
  return <div className={s.page}>
    <PageHead title="Fornecedores" subtitle="Compras, cotações e entregas de materiais e serviços."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'supplier' })}><Plus size={17} />Novo fornecedor</button></PageHead>
    <Stats items={[['Cotações abertas', all.filter(a => a.x.status === 'Cotação').length], ['Pedidos a receber', all.filter(a => a.x.status === 'Pedido').length, brl(all.filter(a => a.x.status === 'Pedido').reduce((v, a) => v + a.x.value, 0))], ['Entregas em 7 dias', all.filter(a => a.x.status === 'Pedido' && a.x.due <= addDays(today, 7)).length], ['A pagar', brl(rows.reduce((v, r) => v + r.open, 0))]]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Compras em andamento</h2></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Item</th><th>Obra</th><th>Fornecedor</th><th>Entrega</th><th>Situação</th><th className={s.num}>Valor</th><th /></tr></thead>
        <tbody>{pending.slice(0, 30).map(({ p, x }) => <tr key={x.id} onClick={() => ctx.openProject(p.id, 'Compras')}>
          <td><b>{x.item}</b></td><td>{p.title}</td><td>{ctx.supplier(x.supplierId)?.name}</td><td className={x.status === 'Pedido' && x.due < today ? s.lateText : ''}>{dateLabel(x.due)}</td><td><Pill tone={purchaseTone[x.status]}>{x.status}</Pill></td><td className={s.num}>{brl(x.value)}</td>
          <td><button className={s.chip} onClick={e => { e.stopPropagation(); advance(p, x.id, x.status === 'Cotação' ? 'Pedido' : 'Entregue'); }}>{x.status === 'Cotação' ? 'Fazer pedido' : 'Receber'}</button></td>
        </tr>)}</tbody>
      </table>{!pending.length && <p className={s.empty}>Nenhuma compra em andamento.</p>}</div>
    </section>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Cadastro de fornecedores</h2><select className={s.select} value={category} onChange={e => setCategory(e.target.value)} aria-label="Categoria"><option value="">Todas as categorias</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Fornecedor</th><th>Categoria</th><th>Contato</th><th>Avaliação</th><th>Pedidos abertos</th><th className={s.num}>Comprado</th><th className={s.num}>A pagar</th></tr></thead>
        <tbody>{rows.map(({ x, orders, open, total }) => <tr key={x.id} onClick={() => ctx.setModal({ kind: 'supplier', id: x.id })}>
          <td><b>{x.name}</b></td><td>{x.category}</td><td><span className={s.stackText}>{x.contact}<small>{x.phone}</small></span></td><td className={s.stars}>{'★'.repeat(x.rating)}<span>{'★'.repeat(5 - x.rating)}</span></td><td>{orders || '—'}</td><td className={s.num}>{total ? brl(total) : '—'}</td><td className={s.num}>{open ? brl(open) : '—'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const year = Number(today.slice(0, 4));
  const ps = store.projects;
  const ins = ps.flatMap(p => p.installments.map(i => ({ p, i })));
  const outs = ps.flatMap(p => p.purchases.filter(x => x.status !== 'Cotação').map(x => ({ p, x })));
  const receivable = ins.filter(a => !a.i.paid).sort((a, b) => a.i.due.localeCompare(b.i.due));
  const payable = outs.filter(a => !a.x.paid).sort((a, b) => a.x.due.localeCompare(b.x.due));
  const months = Array.from({ length: 12 }, (_, m) => { const key = `${year}-${String(m + 1).padStart(2, '0')}`; return { key, label: new Date(year, m, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), in: ins.filter(a => a.i.due.startsWith(key)).reduce((v, a) => v + a.i.value, 0), out: outs.filter(a => a.x.due.startsWith(key)).reduce((v, a) => v + a.x.value, 0) }; });
  const peak = Math.max(...months.flatMap(m => [m.in, m.out]), 1);
  const activeBudget = store.projects.filter(live).reduce((v, p) => v + p.budget, 0), activeSpent = store.projects.filter(live).reduce((v, p) => v + spent(p), 0);
  return <div className={s.page}>
    <PageHead title="Financeiro" subtitle="Medições, compras, pagamentos e lucratividade das obras.">
      <button className={s.secondary} onClick={() => download('alvorada-financeiro.csv', csv([['Obra', 'Tipo', 'Descrição', 'Vencimento', 'Valor', 'Situação'], ...ins.map(({ p, i }) => [p.title, 'Entrada', i.label, dateLabel(i.due), i.value.toFixed(2), i.paid ? 'Recebido' : 'Em aberto']), ...outs.map(({ p, x }) => [p.title, 'Saída', x.item, dateLabel(x.due), (-x.value).toFixed(2), x.paid ? 'Pago' : 'Em aberto'])]), 'text/csv')}><Download size={16} />CSV</button>
    </PageHead>
    <Stats items={[['Contratado em obras ativas', brl(activeBudget), plural(store.projects.filter(live).length, 'obra', 'obras')], ['A receber', brl(receivable.reduce((v, a) => v + a.i.value, 0)), `${receivable.filter(a => a.i.due < today).length} vencidas`], ['A pagar', brl(payable.reduce((v, a) => v + a.x.value, 0)), `${payable.filter(a => a.x.due < today).length} vencidas`], ['Margem prevista (ativas)', brl(activeBudget - activeSpent), activeBudget ? pct((activeBudget - activeSpent) / activeBudget * 100) + ' sobre compras lançadas' : '—']]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Entradas e saídas por mês ({year})</h2><span className={s.legend}><i className={s.lIn} />Medições<i className={s.lOut} />Compras</span></div>
      <div className={s.chart}>{months.map(m => <div key={m.key} title={`${m.label}: entradas ${brl(m.in)} · saídas ${brl(m.out)}`} className={m.key === today.slice(0, 7) ? s.chartNow : ''}><span><i className={s.lIn} style={{ height: `${m.in / peak * 100}%` }} /><i className={s.lOut} style={{ height: `${m.out / peak * 100}%` }} /></span><small>{m.label}</small></div>)}</div>
    </section>
    <div className={s.twoCol}>
      <section className={s.card}>
        <div className={s.cardHead}><h2>Medições a receber</h2></div>
        <ul className={s.rowsList}>{receivable.slice(0, 12).map(({ p, i }) => <li key={i.id}><button className={s.stackText} onClick={() => ctx.openProject(p.id, 'Financeiro')}><b>{p.title} · {i.label}</b><small className={i.due < today ? s.lateText : ''}>{dateLabel(i.due)}{i.due < today ? ' · vencida' : ''}</small></button><strong>{brl(i.value)}</strong><button className={s.chip} onClick={() => ctx.updateProject(p.id, y => ({ installments: y.installments.map(z => z.id === i.id ? { ...z, paid: true } : z) }), `${i.label} de ${p.title} recebida.`)}>Receber</button></li>)}{!receivable.length && <li className={s.muted}>Nada a receber.</li>}</ul>
      </section>
      <section className={s.card}>
        <div className={s.cardHead}><h2>Contas a pagar</h2></div>
        <ul className={s.rowsList}>{payable.slice(0, 12).map(({ p, x }) => <li key={x.id}><button className={s.stackText} onClick={() => ctx.openProject(p.id, 'Compras')}><b>{x.item}</b><small className={x.due < today ? s.lateText : ''}>{ctx.supplier(x.supplierId)?.name} · {p.title} · {dateLabel(x.due)}</small></button><strong>{brl(x.value)}</strong><button className={s.chip} onClick={() => ctx.updateProject(p.id, y => ({ purchases: y.purchases.map(z => z.id === x.id ? { ...z, paid: true } : z) }), 'Pagamento registrado.')}>Pagar</button></li>)}{!payable.length && <li className={s.muted}>Nada a pagar.</li>}</ul>
      </section>
    </div>
  </div>;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [form, setForm] = useState(store.settings);
  const done = store.projects.filter(p => p.status === 'Concluída' && p.end >= addDays(today, -365));
  const byType = types.map(t => ({ t, n: store.projects.filter(p => p.type === t && p.status !== 'Concluída').length + done.filter(p => p.type === t).length }));
  const bySource = sources.map(src => ({ src, n: store.clients.filter(c => c.source === src).length }));
  const maxType = Math.max(...byType.map(x => x.n), 1), maxSource = Math.max(...bySource.map(x => x.n), 1);
  return <div className={s.page}>
    <PageHead title="Relatórios" subtitle="Últimos 12 meses, exportações e configurações." />
    <Stats items={[['Obras entregues (12 meses)', done.length], ['Faturamento entregue', brl(done.reduce((v, p) => v + p.budget, 0))], ['Duração média', `${Math.round(done.reduce((v, p) => v + daysBetween(p.start, p.end), 0) / Math.max(1, done.length))} dias`], ['Margem média', pct(done.reduce((v, p) => v + (p.budget - spent(p)) / p.budget, 0) / Math.max(1, done.length) * 100), 'sobre compras de materiais']]} />
    <div className={s.twoCol}>
      <section className={s.card}><div className={s.cardHead}><h2>Obras por tipo</h2></div><ul className={s.hbars}>{byType.map(({ t, n }) => <li key={t}><span>{t}</span><span className={s.meter}><i style={{ width: `${n / maxType * 100}%` }} /></span><b>{n}</b></li>)}</ul></section>
      <section className={s.card}><div className={s.cardHead}><h2>Origem dos clientes</h2></div><ul className={s.hbars}>{bySource.map(({ src, n }) => <li key={src}><span>{src}</span><span className={s.meter}><i style={{ width: `${n / maxSource * 100}%` }} /></span><b>{n}</b></li>)}</ul></section>
    </div>
    <section className={s.card}><div className={s.cardHead}><h2>Exportações e dados</h2></div><div className={s.exportList}>
      <button className={s.secondary} onClick={() => download('alvorada-obras.csv', csv([['Código', 'Tipo', 'Obra', 'Cliente', 'Início', 'Previsão', 'Situação', 'Progresso', 'Orçamento', 'Recebido', 'Compras'], ...store.projects.map(p => [p.code, p.type, p.title, ctx.client(p.clientId)?.name ?? '', dateLabel(p.start), dateLabel(p.end), p.status, `${progress(p)}%`, p.budget, received(p), spent(p)])]), 'text/csv')}><Download size={16} />Obras (CSV)</button>
      <button className={s.secondary} onClick={() => download('alvorada-backup.json', JSON.stringify(store, null, 2), 'application/json')}><Download size={16} />Backup completo (JSON)</button>
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
    <Dialog.Content className={`${s.modal} ${wide ? s.modalWide : ''}`} aria-describedby={undefined}>
      <header className={s.modalHead}><Dialog.Title>{title}</Dialog.Title><Dialog.Close className={s.iconBtn} aria-label="Fechar"><X size={18} /></Dialog.Close></header>
      {children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

/** Builds a new project with the default schedule and five equal payments. */
function newProject(st: Store, today: string, data: Pick<Project, 'type' | 'title' | 'clientId' | 'address' | 'city' | 'start' | 'end' | 'budget' | 'status' | 'manager' | 'notes'>): Project {
  const residential = st.projects.filter(p => p.type === 'Residencial').length;
  const length = Math.max(10, daysBetween(data.start, data.end));
  return { id: uid(), code: `AL-${1000 + st.next}`, cover: data.type === 'Residencial' ? photoCovers[residential % photoCovers.length] : '', milestones: makeMilestones(data.type, data.start, data.end, today), purchases: [], team: [], log: [], createdAt: today,
    installments: ['Entrada', 'Medição 1', 'Medição 2', 'Medição 3', 'Entrega das chaves'].map((label, j) => ({ id: uid(), label, due: addDays(data.start, j === 0 ? 0 : Math.round(length * j / 4)), value: Math.round(data.budget / 5), paid: false })), ...data };
}

function ProjectForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const { store, today } = ctx;
  const editing = id ? store.projects.find(p => p.id === id) : undefined;
  const [f, setF] = useState(() => ({ type: (editing?.type ?? 'Residencial') as ProjectType, title: editing?.title ?? '', clientId: editing?.clientId ?? '', newClient: '', address: editing?.address ?? '', city: editing?.city ?? '', start: editing?.start ?? addDays(today, 15), end: editing?.end ?? addDays(today, 15 + durations.Residencial), budget: String(editing?.budget ?? ''), status: (editing?.status ?? 'Planejamento') as Status, manager: editing?.manager ?? 'Eng. Ricardo Alves', notes: editing?.notes ?? '' }));
  function submit(e: FormEvent) {
    e.preventDefault();
    const newClient: Client | null = !f.clientId ? { id: uid(), name: f.newClient.trim() || f.title.trim(), kind: f.type === 'Comercial' ? 'Empresa' : 'Pessoa', email: '', phone: '', source: 'Indicação', createdAt: today } : null;
    const data = { type: f.type, title: f.title.trim(), clientId: newClient?.id ?? f.clientId, address: f.address, city: f.city, start: f.start, end: f.end < f.start ? f.start : f.end, budget: num(f.budget), status: f.status, manager: f.manager, notes: f.notes };
    const clients = (st: Store) => newClient ? [...st.clients, newClient] : st.clients;
    if (editing) ctx.set(st => ({ clients: clients(st), projects: st.projects.map(p => p.id === editing.id ? { ...p, ...data } : p) }), 'Projeto atualizado.');
    else ctx.set(st => ({ next: st.next + 1, clients: clients(st), projects: [...st.projects, newProject(st, today, data)] }), `Projeto ${data.title} criado.`);
    onClose();
  }
  return <Shell title={editing ? 'Editar projeto' : 'Novo projeto'} onClose={onClose} wide>
    <form className={s.form} onSubmit={submit}>
      <label className={s.field}><span>Tipo</span><select value={f.type} onChange={e => { const type = e.target.value as ProjectType; setF({ ...f, type, end: editing ? f.end : addDays(f.start, durations[type]) }); }}>{types.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className={s.field}><span>Nome da obra</span><input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={f.type === 'Reforma' ? 'Ex.: Reforma apto. Souza' : 'Ex.: Residência Souza'} /></label>
      <label className={s.field}><span>Cliente</span><select value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}><option value="">+ Novo cliente</option>{[...store.clients].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {!f.clientId ? <label className={s.field}><span>Nome do novo cliente</span><input value={f.newClient} onChange={e => setF({ ...f, newClient: e.target.value })} placeholder="Usa o nome da obra se vazio" /></label> : <span />}
      <label className={s.field}><span>Endereço</span><input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></label>
      <label className={s.field}><span>Cidade</span><input value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></label>
      <label className={s.field}><span>Início</span><input type="date" required value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /></label>
      <label className={s.field}><span>Previsão de entrega</span><input type="date" required value={f.end} min={f.start} onChange={e => setF({ ...f, end: e.target.value })} /></label>
      <label className={s.field}><span>Orçamento (R$)</span><input inputMode="decimal" required value={f.budget} onChange={e => setF({ ...f, budget: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
      <label className={s.field}><span>Situação</span><select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Status })}>{statuses.map(x => <option key={x}>{x}</option>)}</select></label>
      <label className={s.field}><span>Responsável técnico</span><input value={f.manager} onChange={e => setF({ ...f, manager: e.target.value })} /></label>
      <span />
      <label className={`${s.field} ${s.wide}`}><span>Observações</span><textarea rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></label>
      {!editing && <p className={`${s.hint} ${s.wide}`}>O cronograma padrão de {f.type.toLowerCase()} e cinco medições iguais são criados automaticamente.</p>}
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">{editing ? 'Salvar alterações' : 'Criar projeto'}</button></footer>
    </form>
  </Shell>;
}

function QuoteForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const { store, today } = ctx;
  const editing = id ? store.quotes.find(q => q.id === id) : undefined;
  const locked = editing?.status === 'Aprovado';
  const [f, setF] = useState(() => ({ type: (editing?.type ?? 'Reforma') as ProjectType, title: editing?.title ?? '', clientId: editing?.clientId ?? '', newClient: '', city: editing?.city ?? '', validUntil: editing?.validUntil ?? addDays(today, 30) }));
  // Quantities and prices stay as typed text (Brazilian decimal comma) until saved.
  const toRow = (i: QuoteItem) => ({ ...i, qty: String(i.qty).replace('.', ','), price: String(i.price).replace('.', ',') });
  const [items, setItems] = useState(() => (editing?.items ?? [{ id: uid(), desc: '', qty: 1, unit: 'vb', price: 0 }]).map(toRow));
  const parsed: QuoteItem[] = items.map(i => ({ ...i, qty: num(i.qty), price: num(i.price) }));
  const total = parsed.reduce((v, i) => v + i.qty * i.price, 0);
  const setItem = (iid: string, patch: Partial<(typeof items)[number]>) => setItems(items.map(i => i.id === iid ? { ...i, ...patch } : i));
  function save(status: QuoteStatus) {
    const newClient: Client | null = !f.clientId ? { id: uid(), name: f.newClient.trim() || f.title.trim(), kind: f.type === 'Comercial' ? 'Empresa' : 'Pessoa', email: '', phone: '', source: 'Site', createdAt: today } : null;
    const clean = parsed.filter(i => i.desc.trim());
    const data = { type: f.type, title: f.title.trim(), clientId: newClient?.id ?? f.clientId, city: f.city, validUntil: f.validUntil, items: clean, status };
    ctx.set(st => {
      const clients = newClient ? [...st.clients, newClient] : st.clients;
      let projects = st.projects, next = st.next, projectId: string | undefined;
      if (status === 'Aprovado') {
        const start = addDays(today, 14), project = newProject({ ...st, next }, today, { type: data.type, title: data.title, clientId: data.clientId, address: '', city: data.city, start, end: addDays(start, durations[data.type]), budget: Math.round(clean.reduce((v, i) => v + i.qty * i.price, 0)), status: 'Planejamento', manager: 'Eng. Ricardo Alves', notes: `Criada a partir do orçamento ${editing?.code ?? ''}.`.replace(' .', '.') });
        projects = [...projects, project]; next += 1; projectId = project.id;
      }
      const quotes = editing ? st.quotes.map(q => q.id === editing.id ? { ...q, ...data, projectId } : q) : [...st.quotes, { id: uid(), code: `OR-${2040 + st.quotes.length}`, createdAt: today, ...data, projectId }];
      return { clients, quotes, projects, next };
    }, status === 'Aprovado' ? `Orçamento aprovado: obra ${data.title} criada em Planejamento.` : status === 'Enviado' ? 'Orçamento enviado ao cliente.' : status === 'Recusado' ? 'Orçamento marcado como recusado.' : 'Rascunho salvo.');
    onClose();
  }
  const valid = f.title.trim() && parsed.some(i => i.desc.trim() && i.qty * i.price > 0);
  return <Shell title={editing ? `Orçamento ${editing.code}` : 'Novo orçamento'} onClose={onClose} wide>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (valid) save(editing?.status === 'Enviado' ? 'Enviado' : 'Rascunho'); }}>
      {editing && <p className={`${s.wide} ${s.quoteMeta}`}><Pill tone={quoteTone[editing.status]}>{editing.status}</Pill>Criado em {dateLabel(editing.createdAt)}{editing.projectId && <button type="button" className={s.linkDark} onClick={() => { onClose(); ctx.openProject(editing.projectId!); }}>Abrir obra <ArrowRight size={14} /></button>}</p>}
      <label className={s.field}><span>Tipo</span><select disabled={locked} value={f.type} onChange={e => setF({ ...f, type: e.target.value as ProjectType })}>{types.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className={s.field}><span>Título da proposta</span><input disabled={locked} required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Ex.: Reforma de cozinha" /></label>
      <label className={s.field}><span>Cliente</span><select disabled={locked} value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}><option value="">+ Novo cliente</option>{[...store.clients].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {!f.clientId ? <label className={s.field}><span>Nome do novo cliente</span><input value={f.newClient} onChange={e => setF({ ...f, newClient: e.target.value })} /></label> : <span />}
      <label className={s.field}><span>Cidade</span><input disabled={locked} value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></label>
      <label className={s.field}><span>Validade</span><input disabled={locked} type="date" value={f.validUntil} onChange={e => setF({ ...f, validUntil: e.target.value })} /></label>
      <div className={`${s.wide} ${s.items}`}>
        <div className={s.itemsHead}><span>Descrição</span><span>Qtd.</span><span>Un.</span><span>Preço unit.</span><span className={s.num}>Total</span><span /></div>
        {items.map(i => <div key={i.id} className={s.itemRow}>
          <input disabled={locked} value={i.desc} onChange={e => setItem(i.id, { desc: e.target.value })} placeholder="Serviço ou material" aria-label="Descrição" />
          <input disabled={locked} inputMode="decimal" value={i.qty} onChange={e => setItem(i.id, { qty: e.target.value.replace(/[^\d,]/g, '') })} aria-label="Quantidade" />
          <select disabled={locked} value={i.unit} onChange={e => setItem(i.id, { unit: e.target.value })} aria-label="Unidade">{['vb', 'm²', 'm', 'un', 'h'].map(u => <option key={u}>{u}</option>)}</select>
          <input disabled={locked} inputMode="decimal" value={i.price} onChange={e => setItem(i.id, { price: e.target.value.replace(/[^\d,]/g, '') })} aria-label="Preço unitário" />
          <b className={s.num}>{brl(num(i.qty) * num(i.price))}</b>
          <button type="button" disabled={locked || items.length === 1} className={s.iconBtn} onClick={() => setItems(items.filter(x => x.id !== i.id))} aria-label="Remover item"><Trash2 size={15} /></button>
        </div>)}
        <div className={s.itemsFoot}>{!locked ? <button type="button" className={s.chip} onClick={() => setItems([...items, { id: uid(), desc: '', qty: '1', unit: 'vb', price: '' }])}><Plus size={14} /> Adicionar item</button> : <span />}<span>Total <b>{brl(total)}</b></span></div>
      </div>
      {!locked && <footer className={s.modalFoot}>
        {editing?.status === 'Enviado' && <button type="button" className={s.dangerBtn} onClick={() => save('Recusado')}>Cliente recusou</button>}
        <button className={s.secondary} type="submit" disabled={!valid}>Salvar</button>
        {editing?.status !== 'Enviado' ? <button type="button" className={s.primary} disabled={!valid} onClick={() => save('Enviado')}>Enviar ao cliente</button> : <button type="button" className={s.primary} disabled={!valid} onClick={() => save('Aprovado')}><Check size={16} />Aprovar e criar obra</button>}
      </footer>}
    </form>
  </Shell>;
}

function ClientForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const c = id ? ctx.store.clients.find(x => x.id === id) : undefined;
  const [f, setF] = useState({ name: c?.name ?? '', kind: c?.kind ?? 'Pessoa' as Client['kind'], email: c?.email ?? '', phone: c?.phone ?? '', source: c?.source ?? sources[0] });
  return <Shell title={c ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (c) ctx.set(st => ({ clients: st.clients.map(x => x.id === c.id ? { ...x, ...f } : x) }), 'Cliente atualizado.'); else ctx.set(st => ({ clients: [...st.clients, { id: uid(), createdAt: ctx.today, ...f }] }), `${f.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>Tipo</span><select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as Client['kind'] })}><option>Pessoa</option><option>Empresa</option></select></label>
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

function ProjectDrawer({ ctx, p, tab, onTab, onClose }: { ctx: Ctx; p: Project; tab: Tab; onTab: (t: Tab) => void; onClose: () => void }) {
  const { store, today } = ctx;
  const client = ctx.client(p.clientId);
  const update = (fn: (x: Project) => Partial<Project>, message?: string) => ctx.updateProject(p.id, fn, message);
  const [step, setStep] = useState({ name: '', start: today, end: addDays(today, 14) });
  const [buy, setBuy] = useState({ supplierId: store.suppliers[0]?.id ?? '', item: '', value: '', due: addDays(today, 7) });
  const [member, setMember] = useState({ name: '', role: roles[1] });
  const [inst, setInst] = useState({ label: '', due: addDays(today, 30), value: '' });
  const [note, setNote] = useState('');
  const v = progress(p), cost = spent(p), got = received(p);
  const lateSteps = p.milestones.filter(m => milestoneStatus(m, today) === 'Atrasado').length;
  return <Dialog.Root open onOpenChange={o => !o && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={s.drawer} aria-describedby={undefined}>
      <div className={s.drawerCover}><Cover p={p} /><Dialog.Close className={`${s.iconBtn} ${s.drawerClose}`} aria-label="Fechar"><X size={18} /></Dialog.Close>
        <div><small>{p.type} · {p.code}</small><Dialog.Title>{p.title}</Dialog.Title><p>{p.address}{p.address && p.city ? ' · ' : ''}{p.city}</p></div></div>
      <div className={s.drawerMeta}><Pill tone={statusTone[p.status]}>{p.status}</Pill><Bar value={v} /><span className={p.status !== 'Concluída' && p.end < today ? s.lateText : ''}>{deadline(p, today)}</span><span>{client?.name}{client?.phone ? ` · ${client.phone}` : ''}</span></div>
      <nav className={s.dTabs} role="tablist">{(['Resumo', 'Cronograma', 'Compras', 'Equipe', 'Financeiro', 'Diário'] as Tab[]).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? s.dTabOn : ''} onClick={() => onTab(t)}>{t}</button>)}</nav>
      <div className={s.drawerBody}>
        {tab === 'Resumo' && <div className={s.stack}>
          <div className={s.factGrid}><span>Progresso<b>{v}%</b></span><span>Orçamento<b>{brl(p.budget)}</b></span><span>Recebido<b>{brl(got)}</b></span><span>Compras<b>{brl(cost)}</b></span><span>Saldo previsto<b>{brl(p.budget - cost)}</b></span><span>Equipe<b>{plural(p.team.length, 'pessoa', 'pessoas')}</b></span></div>
          <ul className={s.phaseRows}>{p.milestones.map(m => { const st = milestoneStatus(m, today); return <li key={m.id}><MilestoneIcon status={st} size={18} /><b>{m.name}</b><span className={st === 'Atrasado' ? s.lateText : ''}>{st} · {short(m.end)}</span></li>; })}</ul>
          {lateSteps > 0 && <p className={s.warn}><AlertTriangle size={16} />{plural(lateSteps, 'etapa passou', 'etapas passaram')} do prazo. Atualize o cronograma.</p>}
          <label className={s.field}><span>Situação</span><select value={p.status} onChange={x => update(() => ({ status: x.target.value as Status }), `Situação: ${x.target.value}.`)}>{statuses.map(o => <option key={o}>{o}</option>)}</select></label>
          <p className={s.muted}>Responsável técnico: {p.manager} · Início {dateLabel(p.start)} · Previsão {dateLabel(p.end)}</p>
          {p.notes && <p className={s.notes}>{p.notes}</p>}
          <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'project', id: p.id })}>Editar dados da obra</button>
        </div>}
        {tab === 'Cronograma' && <div className={s.stack}>
          <ul className={s.stepList}>{p.milestones.map(m => { const st = milestoneStatus(m, today); return <li key={m.id}>
            <header><MilestoneIcon status={st} size={18} /><b>{m.name}</b><span className={st === 'Atrasado' ? s.lateText : s.muted}>{dateLabel(m.start)} → {dateLabel(m.end)}</span><button className={s.iconBtn} onClick={() => update(x => ({ milestones: x.milestones.filter(y => y.id !== m.id) }))} aria-label={`Remover ${m.name}`}><Trash2 size={15} /></button></header>
            <label className={s.slider}><input type="range" min={0} max={100} step={5} value={m.progress} onChange={e => update(x => ({ milestones: x.milestones.map(y => y.id === m.id ? { ...y, progress: Number(e.target.value) } : y) }))} aria-label={`Progresso de ${m.name}`} style={{ backgroundSize: `${m.progress}% 100%` }} /><b>{m.progress}%</b></label>
          </li>; })}{!p.milestones.length && <li className={s.muted}>Nenhuma etapa cadastrada.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); if (!step.name.trim()) return; update(ev => ({ milestones: [...ev.milestones, { id: uid(), name: step.name.trim(), start: step.start, end: step.end < step.start ? step.start : step.end, progress: 0 }].sort((a, b) => a.start.localeCompare(b.start)) }), 'Etapa adicionada.'); setStep({ ...step, name: '' }); }}>
            <input value={step.name} onChange={x => setStep({ ...step, name: x.target.value })} placeholder="Nova etapa" aria-label="Nova etapa" /><input type="date" value={step.start} onChange={x => setStep({ ...step, start: x.target.value })} aria-label="Início" /><input type="date" value={step.end} onChange={x => setStep({ ...step, end: x.target.value })} aria-label="Fim" /><button className={s.secondary} type="submit" aria-label="Adicionar etapa"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Compras' && <div className={s.stack}>
          <div className={s.factGrid}><span>Comprado<b>{brl(cost)}</b></span><span>Pago<b>{brl(p.purchases.filter(x => x.paid).reduce((a, x) => a + x.value, 0))}</b></span><span>Em cotação<b>{brl(p.purchases.filter(x => x.status === 'Cotação').reduce((a, x) => a + x.value, 0))}</b></span></div>
          <ul className={s.rowsList}>{p.purchases.map(x => <li key={x.id}><span className={s.stackText}><b>{x.item}</b><small className={x.status === 'Pedido' && x.due < today ? s.lateText : ''}>{ctx.supplier(x.supplierId)?.name ?? 'Fornecedor removido'} · entrega {dateLabel(x.due)}</small></span><strong>{brl(x.value)}</strong>
            <select className={s.miniSelect} value={x.status} onChange={e => update(y => ({ purchases: y.purchases.map(z => z.id === x.id ? { ...z, status: e.target.value as PurchaseStatus } : z) }))} aria-label={`Situação de ${x.item}`}>{purchaseStatuses.map(o => <option key={o}>{o}</option>)}</select>
            <button className={`${s.chip} ${x.paid ? s.chipOn : ''}`} disabled={x.status === 'Cotação'} onClick={() => update(y => ({ purchases: y.purchases.map(z => z.id === x.id ? { ...z, paid: !z.paid } : z) }))}>{x.paid ? 'Pago' : 'Pagar'}</button></li>)}{!p.purchases.length && <li className={s.muted}>Nenhuma compra lançada.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); const sup = ctx.supplier(buy.supplierId); if (!sup || !buy.item.trim() || !num(buy.value)) return; update(ev => ({ purchases: [...ev.purchases, { id: uid(), supplierId: sup.id, item: buy.item.trim(), value: num(buy.value), status: 'Cotação', due: buy.due, paid: false }] }), 'Cotação registrada.'); setBuy({ ...buy, item: '', value: '' }); }}>
            <input value={buy.item} onChange={x => setBuy({ ...buy, item: x.target.value })} placeholder="Material ou serviço" aria-label="Material ou serviço" /><select value={buy.supplierId} onChange={x => setBuy({ ...buy, supplierId: x.target.value })} aria-label="Fornecedor">{store.suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><input value={buy.value} onChange={x => setBuy({ ...buy, value: x.target.value.replace(/[^\d,.]/g, '') })} placeholder="Valor" inputMode="decimal" aria-label="Valor" /><input type="date" value={buy.due} onChange={x => setBuy({ ...buy, due: x.target.value })} aria-label="Entrega" /><button className={s.secondary} type="submit" aria-label="Adicionar compra"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Equipe' && <div className={s.stack}>
          <p className={s.muted}>Responsável técnico: <b>{p.manager}</b></p>
          <ul className={s.rowsList}>{p.team.map(m => <li key={m.id}><Avatar name={m.name} /><span className={s.stackText}><b>{m.name}</b><small>{m.role}</small></span><button className={s.iconBtn} onClick={() => update(x => ({ team: x.team.filter(y => y.id !== m.id) }), `${m.name} removido da equipe.`)} aria-label={`Remover ${m.name}`}><Trash2 size={15} /></button></li>)}{!p.team.length && <li className={s.muted}>Nenhuma pessoa alocada.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); if (!member.name.trim()) return; update(ev => ({ team: [...ev.team, { id: uid(), name: member.name.trim(), role: member.role }] }), `${member.name.trim()} alocado na obra.`); setMember({ ...member, name: '' }); }}>
            <input value={member.name} onChange={x => setMember({ ...member, name: x.target.value })} placeholder="Nome" aria-label="Nome" /><select value={member.role} onChange={x => setMember({ ...member, role: x.target.value })} aria-label="Função">{roles.map(r => <option key={r}>{r}</option>)}</select><button className={s.secondary} type="submit" aria-label="Adicionar pessoa"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Financeiro' && <div className={s.stack}>
          <div className={s.factGrid}><span>Orçamento<b>{brl(p.budget)}</b></span><span>Recebido<b>{brl(got)}</b></span><span>A receber<b>{brl(p.budget - got)}</b></span><span>Compras<b>{brl(cost)}</b></span><span>Saldo previsto<b>{brl(p.budget - cost)}</b></span><span>Margem %<b>{p.budget ? pct((p.budget - cost) / p.budget * 100) : '—'}</b></span></div>
          <ul className={s.rowsList}>{p.installments.map(i => <li key={i.id}><span className={s.stackText}><b>{i.label}</b><small className={!i.paid && i.due < today ? s.lateText : ''}>{dateLabel(i.due)}{!i.paid && i.due < today ? ' · vencida' : ''}</small></span><strong>{brl(i.value)}</strong><button className={`${s.chip} ${i.paid ? s.chipOn : ''}`} onClick={() => update(ev => ({ installments: ev.installments.map(y => y.id === i.id ? { ...y, paid: !y.paid } : y) }), i.paid ? 'Medição reaberta.' : 'Medição recebida.')}>{i.paid ? 'Recebida' : 'Receber'}</button></li>)}{!p.installments.length && <li className={s.muted}>Nenhuma medição lançada.</li>}</ul>
          <form className={s.inlineForm} onSubmit={x => { x.preventDefault(); if (!inst.label.trim() || !num(inst.value)) return; update(ev => ({ installments: [...ev.installments, { id: uid(), label: inst.label.trim(), due: inst.due, value: num(inst.value), paid: false }] }), 'Medição lançada.'); setInst({ ...inst, label: '', value: '' }); }}>
            <input value={inst.label} onChange={x => setInst({ ...inst, label: x.target.value })} placeholder="Medição ou aditivo" aria-label="Descrição" /><input type="date" value={inst.due} onChange={x => setInst({ ...inst, due: x.target.value })} aria-label="Vencimento" /><input value={inst.value} onChange={x => setInst({ ...inst, value: x.target.value.replace(/[^\d,.]/g, '') })} placeholder="Valor" inputMode="decimal" aria-label="Valor" /><button className={s.secondary} type="submit" aria-label="Lançar medição"><Plus size={15} /></button>
          </form>
        </div>}
        {tab === 'Diário' && <div className={s.stack}>
          <form className={s.logForm} onSubmit={x => { x.preventDefault(); if (!note.trim()) return; update(ev => ({ log: [{ id: uid(), date: today, text: note.trim() }, ...ev.log] }), 'Registro adicionado ao diário.'); setNote(''); }}>
            <textarea rows={3} value={note} onChange={x => setNote(x.target.value)} placeholder="O que aconteceu na obra hoje?" aria-label="Registro do dia" /><button className={s.primary} type="submit" disabled={!note.trim()}>Registrar</button>
          </form>
          <ul className={s.timeline}>{p.log.map(l => <li key={l.id}><time>{dateLabel(l.date)}</time><p>{l.text}</p></li>)}{!p.log.length && <li className={s.muted}>Nenhum registro no diário de obra.</li>}</ul>
        </div>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
