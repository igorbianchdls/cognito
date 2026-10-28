'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Car as CarIcon, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Download, FilePenLine, Gauge, House, MoreVertical, Package, Plus, ReceiptText, RotateCcw, Search, Trash2, Users, Wrench, X, type LucideIcon } from 'lucide-react';
import { AlertArt, Car, CashArt, PartsArt } from './Art';
import { alertsFor, bodies, brl, code, colors, dateLabel, inspectionTemplate, isOpen, makeSeed, mechanic, mechanics, money, nextStage, partsTotal, rolling, stages, storageKey, total, uid, yearLabel, type Alert, type Body, type Check as CheckItem, type Item, type NewOrder, type Order, type QuoteStatus, type Stage, type Store } from './data';
import { jakarta } from './fonts';
import s from './TorqueApp.module.css';

type View = 'Painel' | 'Ordens de serviço' | 'Veículos' | 'Agenda' | 'Orçamentos' | 'Financeiro' | 'Clientes';
type Tab = 'Resumo' | 'Vistoria' | 'Orçamento' | 'Serviços' | 'Histórico';
const navigation: [View, LucideIcon][] = [['Painel', House], ['Ordens de serviço', ClipboardList], ['Veículos', CarIcon], ['Agenda', CalendarDays], ['Orçamentos', FilePenLine], ['Financeiro', ReceiptText], ['Clientes', Users]];
const stageIcons: Record<Stage, LucideIcon> = { Avaliação: Gauge, Orçamento: FilePenLine, Peças: Package, Execução: Wrench, Entrega: CarIcon, Finalizada: Check };
const stageTone: Record<Stage, string> = { Avaliação: s.toneGray, Orçamento: s.toneBlue, Peças: s.toneAmber, Execução: s.toneOrange, Entrega: s.toneGreen, Finalizada: s.toneGray };
const owner = 'Diego';
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const matches = (q: string, o: Order) => normalize([code(o.number), o.model, o.plate, o.client, o.year].join(' ')).includes(normalize(q.trim()));
const dateInput = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fromDateInput = (v: string) => new Date(`${v}T17:00:00`).toISOString();
const done = (list: CheckItem[]) => list.filter(c => c.done).length;
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };

export default function TorqueApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Painel');
  const [detail, setDetail] = useState<{ id: string; tab: Tab } | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let loaded: Store | null = null;
    try { const saved = localStorage.getItem(storageKey); if (saved) loaded = JSON.parse(saved); } catch { /* falls back to the demo data */ }
    // Reading the clock and storage only after mount keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(loaded?.orders ? loaded : makeSeed());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  if (!store) return <div className={`${s.app} ${jakarta.variable}`}><div className={s.loading}><span className={s.logo}><Gauge size={20} /></span></div></div>;

  const orders = store.orders;
  const open = orders.filter(isOpen);
  const alerts = open.flatMap(o => alertsFor(o, now));
  const unread = alerts.filter(a => !store.read.includes(`${a.order.id}:${a.kind}`));

  function update(id: string, change: (o: Order) => Partial<Order>, log?: string) {
    const at = new Date().toISOString();
    setNow(Date.now());
    setStore(prev => prev && { ...prev, orders: prev.orders.map(o => o.id !== id ? o : { ...o, ...change(o), updatedAt: at, logs: log ? [...o.logs, { id: uid(), at, text: log }] : o.logs }) });
  }
  function move(id: string, stage: Stage) {
    const order = orders.find(o => o.id === id);
    if (!order || order.stage === stage) return;
    const approve = stages.indexOf(stage as typeof stages[number]) > 1 && order.quote !== 'Aprovado';
    update(id, () => ({ stage, ...(approve ? { quote: 'Aprovado' as QuoteStatus } : {}), ...(stage === 'Finalizada' ? { closedAt: new Date().toISOString() } : { closedAt: undefined }) }), stage === 'Finalizada' ? 'OS finalizada e veículo entregue ao cliente' : `Movida de ${order.stage} para ${stage}${approve ? ' (orçamento aprovado)' : ''}`);
    setToast(stage === 'Finalizada' ? `${code(order.number)} finalizada. Valor somado ao faturamento.` : `${code(order.number)} movida para ${stage}.`);
  }
  function remove(id: string) {
    const order = orders.find(o => o.id === id);
    if (!order || !confirm(`Excluir ${code(order.number)} (${order.model})? Esta ação não pode ser desfeita.`)) return;
    setStore(prev => prev && { ...prev, orders: prev.orders.filter(o => o.id !== id) });
    setDetail(null); setToast(`${code(order.number)} excluída.`);
  }
  function create(data: NewOrder) {
    const at = new Date().toISOString(), id = uid(), number = store!.next;
    const order: Order = { ...data, id, number, stage: 'Avaliação', quote: 'Pendente', items: [], inspection: inspectionTemplate.map(label => ({ id: uid(), label, done: false })), tasks: [], logs: [{ id: uid(), at, text: 'Veículo recebido na oficina' }], createdAt: at, updatedAt: at };
    setStore(prev => prev && { ...prev, next: prev.next + 1, orders: [...prev.orders, order] });
    setCreating(false); setView('Painel'); setToast(`${code(number)} criada em Avaliação.`);
  }
  const openOrder = (id: string, tab: Tab = 'Resumo') => setDetail({ id, tab });
  const current = detail && orders.find(o => o.id === detail.id);

  return <div ref={root} className={`${s.app} ${jakarta.variable}`}>
    <aside className={s.sidebar} aria-label="Navegação principal">
      <button className={s.logo} onClick={() => setView('Painel')} aria-label="Torque, ir para o painel"><Gauge size={21} strokeWidth={2.4} /></button>
      <nav>{navigation.map(([name, Icon], i) => <span key={name} className={s.navItem}>
        {i === 4 && <i className={s.navDivider} />}
        <button className={view === name ? s.navActive : ''} onClick={() => setView(name)} aria-label={name} aria-current={view === name ? 'page' : undefined} title={name}><Icon size={17} strokeWidth={1.8} /></button>
      </span>)}</nav>
      <span className={s.me} title={`${owner} Martins · Gestor`}>DM<i /></span>
    </aside>

    <main className={s.main}>
      <Header view={view} orders={orders} alerts={alerts} unread={unread} onOpen={openOrder} onCreate={() => setCreating(true)} onRead={() => setStore(p => p && { ...p, read: [...new Set([...p.read, ...alerts.map(a => `${a.order.id}:${a.kind}`)])] })} />
      {view === 'Painel' && <>
        <Kpis orders={orders} alerts={alerts} now={now} onAlerts={() => alerts[0] && openOrder(alerts[0].order.id)} />
        <Board orders={open} now={now} root={root} onOpen={openOrder} onMove={move} onRemove={remove} onQuote={(id, quote) => update(id, () => ({ quote }), `Orçamento marcado como ${quote.toLowerCase()}`)} />
      </>}
      {view === 'Ordens de serviço' && <OrdersView orders={orders} now={now} onOpen={openOrder} onReset={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) { setStore(makeSeed()); setToast('Dados de exemplo restaurados.'); } }} />}
      {view === 'Veículos' && <VehiclesView orders={orders} onOpen={openOrder} />}
      {view === 'Agenda' && <AgendaView orders={orders} onOpen={openOrder} />}
      {view === 'Orçamentos' && <QuotesView orders={open} onOpen={openOrder} onQuote={(id, quote) => { update(id, () => ({ quote }), `Orçamento marcado como ${quote.toLowerCase()}`); setToast(`Orçamento ${quote.toLowerCase()}.`); }} />}
      {view === 'Financeiro' && <FinanceView orders={orders} now={now} onOpen={openOrder} />}
      {view === 'Clientes' && <ClientsView orders={orders} onOpen={openOrder} />}
    </main>

    {creating && <NewOrderDialog onClose={() => setCreating(false)} onCreate={create} />}
    {current && <OrderDrawer key={current.id} order={current} tab={detail!.tab} now={now} onTab={tab => setDetail({ id: current.id, tab })} onClose={() => setDetail(null)} onUpdate={(change, log) => update(current.id, change, log)} onMove={stage => move(current.id, stage)} onRemove={() => remove(current.id)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

function Header({ view, orders, alerts, unread, onOpen, onCreate, onRead }: { view: View; orders: Order[]; alerts: Alert[]; unread: Alert[]; onOpen: (id: string) => void; onCreate: () => void; onRead: () => void }) {
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'search' | 'bell' | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setPanel(null); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, []);
  const results = query.trim() ? orders.filter(o => matches(query, o)).slice(0, 6) : [];
  return <header className={s.header}>
    <div className={s.greeting}>{view === 'Painel' ? <><h1>Olá, {owner}! <span aria-hidden="true">👋</span></h1><p>Aqui está o resumo da sua oficina hoje</p></> : <><h1>{view}</h1><p>Torque · Centro automotivo</p></>}</div>
    <div className={s.actions} ref={ref}>
      <div className={`${s.searchBox} ${panel === 'search' ? s.searchOpen : ''}`}>
        <button className={s.round} onClick={() => setPanel(panel === 'search' ? null : 'search')} aria-label="Buscar OS, placa ou cliente" aria-expanded={panel === 'search'}><Search size={17} /></button>
        {panel === 'search' && <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar OS, placa ou cliente" aria-label="Buscar" />}
        {panel === 'search' && query.trim() && <div className={s.popover}>
          {results.map(o => <button key={o.id} className={s.result} onClick={() => { onOpen(o.id); setPanel(null); setQuery(''); }}><Car body={o.body} color={o.color} className={s.resultCar} /><span><b>{o.model} {yearLabel(o.year)}</b><small>{code(o.number)} · {o.plate} · {o.client}</small></span><em className={`${s.stagePill} ${stageTone[o.stage]}`}>{o.stage}</em></button>)}
          {!results.length && <p className={s.empty}>Nenhuma OS encontrada para “{query}”.</p>}
        </div>}
      </div>
      <div className={s.bellBox}>
        <button className={s.round} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${unread.length} não lidas`} aria-expanded={panel === 'bell'}><Bell size={17} />{unread.length > 0 && <b className={s.badge}>{unread.length}</b>}</button>
        {panel === 'bell' && <div className={`${s.popover} ${s.bellPanel}`}>
          <div className={s.popHead}><b>Alertas inteligentes</b>{unread.length > 0 && <button onClick={onRead}>Marcar como lidos</button>}</div>
          {alerts.map(a => <button key={`${a.order.id}${a.kind}`} className={`${s.alertRow} ${unread.includes(a) ? s.unread : ''}`} onClick={() => { onOpen(a.order.id); setPanel(null); }}><i className={s[a.kind === 'orçamento' ? 'dotAmber' : 'dotRed']} /><span><b>{code(a.order.number)} · {a.order.model}</b><small>{a.text}</small></span></button>)}
          {!alerts.length && <p className={s.empty}>Tudo em dia. Nenhuma OS precisa de atenção.</p>}
        </div>}
      </div>
      <button className={s.primary} onClick={onCreate}>Adicionar OS <Plus size={16} strokeWidth={2.4} /></button>
    </div>
  </header>;
}

function Kpis({ orders, alerts, now, onAlerts }: { orders: Order[]; alerts: Alert[]; now: number; onAlerts: () => void }) {
  const revenue = rolling(orders, total, o => o.closedAt, now);
  const parts = rolling(orders, partsTotal, o => o.createdAt, now);
  const flagged = [...new Set(alerts.map(a => a.order))];
  const risk = flagged.reduce((v, o) => v + total(o), 0);
  const delta = (d: number) => <p className={d >= 0 ? s.up : s.down}>{d >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}<b>{Math.abs(d).toFixed(0)}%</b> vs 30 dias anteriores</p>;
  return <section className={s.kpis} aria-label="Indicadores">
    <article className={s.kpi}><div><h2>Faturamento</h2><strong><small>R$</small>{money(revenue.current)}</strong>{delta(revenue.delta)}</div><CashArt /></article>
    <button className={s.kpi} onClick={onAlerts} disabled={!flagged.length}><div><h2>Alertas Inteligentes</h2><strong><small>R$</small>{money(risk)}</strong><p className={s.warn}><ArrowUpRight size={13} /><b>{flagged.length} OS</b> precisam de atenção</p></div><AlertArt /></button>
    <article className={s.kpi}><div><h2>Peças</h2><strong><small>R$</small>{money(parts.current)}</strong>{delta(parts.delta)}</div><PartsArt /></article>
  </section>;
}

function Board({ orders, now, root, onOpen, onMove, onRemove, onQuote }: { orders: Order[]; now: number; root: React.RefObject<HTMLDivElement | null>; onOpen: (id: string, tab?: Tab) => void; onMove: (id: string, stage: Stage) => void; onRemove: (id: string) => void; onQuote: (id: string, q: QuoteStatus) => void }) {
  const [dragging, setDragging] = useState<Order | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(`.${s.menu}`)) setMenu(null); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  function start(e: DragEvent<HTMLElement>, order: Order) {
    e.dataTransfer.setData('text/plain', order.id); e.dataTransfer.effectAllowed = 'move';
    // A tilted copy of the card follows the pointer, like a card lifted from the board.
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.classList.add(s.ghost); ghost.style.width = `${e.currentTarget.offsetWidth}px`;
    root.current?.appendChild(ghost);
    const box = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setDragImage(ghost, e.clientX - box.left, e.clientY - box.top);
    setTimeout(() => ghost.remove());
    setDragging(order); setMenu(null);
  }
  function drop(e: DragEvent, stage: Stage) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) onMove(id, stage);
    setDragging(null); setOver(null);
  }

  return <section className={s.board} aria-label="Quadro de ordens de serviço">
    {stages.map(stage => {
      const Icon = stageIcons[stage];
      const items = orders.filter(o => o.stage === stage).sort((a, b) => a.number - b.number);
      const target = over === stage && dragging && dragging.stage !== stage;
      return <div key={stage} className={`${s.column} ${target ? s.columnOver : ''}`} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== stage) setOver(stage); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }} onDrop={e => drop(e, stage)}>
        <header><h2><Icon size={15} strokeWidth={1.9} />{stage}</h2><span>{items.length}</span></header>
        <div className={s.cards}>
          {target && <div className={s.dropZone} aria-hidden="true" />}
          {items.map(o => <OrderCard key={o.id} order={o} now={now} dragging={dragging?.id === o.id} menuOpen={menu === o.id} onMenu={() => setMenu(menu === o.id ? null : o.id)} onDragStart={e => start(e, o)} onDragEnd={() => { setDragging(null); setOver(null); }} onOpen={tab => onOpen(o.id, tab)} onMove={st => { setMenu(null); onMove(o.id, st); }} onRemove={() => { setMenu(null); onRemove(o.id); }} onQuote={q => onQuote(o.id, q)} />)}
          {!items.length && !target && <p className={s.emptyColumn}>Arraste uma OS para cá</p>}
        </div>
      </div>;
    })}
  </section>;
}

function OrderCard({ order: o, now, dragging, menuOpen, onMenu, onDragStart, onDragEnd, onOpen, onMove, onRemove, onQuote }: { order: Order; now: number; dragging: boolean; menuOpen: boolean; onMenu: () => void; onDragStart: (e: DragEvent<HTMLElement>) => void; onDragEnd: () => void; onOpen: (tab?: Tab) => void; onMove: (s: Stage) => void; onRemove: () => void; onQuote: (q: QuoteStatus) => void }) {
  const stale = alertsFor(o, now).find(a => a.kind === 'parada');
  const late = alertsFor(o, now).some(a => a.kind === 'atrasada');
  const m = mechanic(o.mechanicId);
  const inspected = done(o.inspection) === o.inspection.length;
  const action: [string, () => void] = !inspected ? ['Realizar checklist', () => onOpen('Vistoria')] : !o.items.length ? ['Realizar orçamento', () => onOpen('Orçamento')] : ['Enviar orçamento', () => onMove('Orçamento')];
  const next = nextStage(o.stage);
  return <article className={`${s.card} ${stale || late ? s.cardAlert : ''} ${o.stage === 'Entrega' ? s.cardReady : ''} ${dragging ? s.cardDragging : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <div className={s.cardTop}>
      <span className={s.chip}>{code(o.number)}</span>
      {m && <span className={s.avatar} style={{ background: m.tone }} title={m.name}>{m.initials}</span>}
      {o.stage !== 'Avaliação' && o.tasks.length > 0 && <span className={`${s.count} ${done(o.tasks) === o.tasks.length ? s.countDone : ''}`} title="Serviços concluídos"><Wrench size={12} />{done(o.tasks)}/{o.tasks.length}</span>}
      <div className={s.menu}>
        <button className={s.kebab} onClick={onMenu} aria-label={`Ações de ${code(o.number)}`} aria-expanded={menuOpen}><MoreVertical size={15} /></button>
        {menuOpen && <div className={s.menuList} role="menu">
          <button role="menuitem" onClick={() => onOpen()}>Abrir OS</button>
          <button role="menuitem" onClick={() => onMove(next)}>{next === 'Finalizada' ? 'Finalizar entrega' : `Mover para ${next}`}</button>
          <button role="menuitem" className={s.danger} onClick={onRemove}>Excluir</button>
        </div>}
      </div>
    </div>
    <button className={s.cardBody} onClick={() => onOpen()} aria-label={`Abrir ${code(o.number)}, ${o.model}`}>
      <span><b>{o.model} {yearLabel(o.year)}</b><small>Placa: {o.plate}</small></span>
      <Car body={o.body} color={o.color} className={s.cardCar} />
    </button>
    <p className={s.client}><b>Cliente:</b> {o.client}</p>
    {o.stage === 'Avaliação' ? <button className={s.cardAction} onClick={action[1]}>{action[0]}</button> : <div className={s.cardFoot}>
      <span className={late ? s.red : ''}><CalendarDays size={13} />{dateLabel(o.due)}</span>
      {o.stage === 'Orçamento' ? <label className={`${s.quote} ${s['quote' + o.quote]}`}>{o.quote}<ChevronDown size={12} /><select value={o.quote} onChange={e => onQuote(e.target.value as QuoteStatus)} aria-label="Status do orçamento">{(['Pendente', 'Aprovado', 'Recusado'] as const).map(q => <option key={q}>{q}</option>)}</select></label>
        : <span className={stale || late ? s.red : o.stage === 'Entrega' ? s.green : ''}><ReceiptText size={13} />{brl(total(o))}</span>}
    </div>}
    {stale && <p className={s.staleNote}>{stale.text}</p>}
  </article>;
}

function OrderDrawer({ order: o, tab, now, onTab, onClose, onUpdate, onMove, onRemove }: { order: Order; tab: Tab; now: number; onTab: (t: Tab) => void; onClose: () => void; onUpdate: (change: (o: Order) => Partial<Order>, log?: string) => void; onMove: (s: Stage) => void; onRemove: () => void }) {
  const [form, setForm] = useState({ model: o.model, year: String(o.year), plate: o.plate, body: o.body, color: o.color, client: o.client, phone: o.phone, mechanicId: o.mechanicId, due: dateInput(o.due), complaint: o.complaint });
  const [item, setItem] = useState({ kind: 'Serviço' as Item['kind'], description: '', quantity: '1', price: '' });
  const [task, setTask] = useState('');
  const next = nextStage(o.stage);
  const services = o.items.filter(i => i.kind === 'Serviço').reduce((v, i) => v + i.quantity * i.price, 0);
  const notes = alertsFor(o, now);
  const toggle = (key: 'inspection' | 'tasks', id: string) => { const c = o[key].find(c => c.id === id)!; onUpdate(x => ({ [key]: x[key].map(c => c.id === id ? { ...c, done: !c.done } : c) }), `${c.done ? 'Desmarcado' : 'Concluído'}: ${c.label}`); };

  function save(e: FormEvent) {
    e.preventDefault();
    onUpdate(() => ({ ...form, year: Number(form.year) || o.year, plate: form.plate.toUpperCase(), due: fromDateInput(form.due) }), 'Dados da OS atualizados');
  }
  function addItem(e: FormEvent) {
    e.preventDefault();
    const price = Number(item.price.replace(',', '.')), quantity = Number(item.quantity) || 1;
    if (!item.description.trim() || !(price >= 0)) return;
    onUpdate(x => ({ items: [...x.items, { id: uid(), kind: item.kind, description: item.description.trim(), quantity, price }] }), `${item.kind} adicionado ao orçamento: ${item.description.trim()}`);
    setItem({ ...item, description: '', quantity: '1', price: '' });
  }

  return <Dialog.Root open onOpenChange={v => !v && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay className={s.overlay} />
      <Dialog.Content className={`${s.drawer} ${jakarta.variable}`} aria-describedby={undefined}>
        <header className={s.drawerHead}>
          <div><span className={s.chip}>{code(o.number)}</span><Dialog.Title>{o.model} {yearLabel(o.year)}</Dialog.Title><p>Placa {o.plate} · {o.client}</p></div>
          <Car body={o.body} color={o.color} className={s.drawerCar} />
          <Dialog.Close className={s.round} aria-label="Fechar"><X size={17} /></Dialog.Close>
        </header>
        <ol className={s.stepper} aria-label="Etapa da OS">{stages.map((st, i) => {
          const reached = o.stage === 'Finalizada' || stages.indexOf(o.stage as typeof st) >= i;
          return <li key={st}><button className={`${reached ? s.stepDone : ''} ${o.stage === st ? s.stepCurrent : ''}`} onClick={() => onMove(st)} aria-current={o.stage === st ? 'step' : undefined}><i>{reached ? <Check size={11} strokeWidth={3} /> : i + 1}</i>{st}</button></li>;
        })}</ol>
        {notes.length > 0 && <div className={s.notice}>{notes.map(n => <p key={n.kind}>{n.text}</p>)}</div>}
        <nav className={s.tabs} role="tablist">{(['Resumo', 'Vistoria', 'Orçamento', 'Serviços', 'Histórico'] as Tab[]).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? s.tabActive : ''} onClick={() => onTab(t)}>{t}{t === 'Vistoria' && <small>{done(o.inspection)}/{o.inspection.length}</small>}{t === 'Serviços' && o.tasks.length > 0 && <small>{done(o.tasks)}/{o.tasks.length}</small>}</button>)}</nav>

        <div className={s.drawerBody}>
          {tab === 'Resumo' && <form className={s.form} onSubmit={save}>
            <div className={s.grid2}>
              <Field label="Modelo"><input required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></Field>
              <Field label="Ano"><input required inputMode="numeric" value={form.year} onChange={e => setForm({ ...form, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></Field>
              <Field label="Placa"><input required value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase().slice(0, 8) })} /></Field>
              <Field label="Previsão de entrega"><input type="date" required value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} /></Field>
              <Field label="Cliente"><input required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></Field>
              <Field label="Telefone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Mecânico responsável"><select aria-label="Mecânico responsável" value={form.mechanicId} onChange={e => setForm({ ...form, mechanicId: e.target.value })}><option value="">Sem responsável</option>{mechanics.map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}</select></Field>
              <Field label="Carroceria"><select aria-label="Carroceria" value={form.body} onChange={e => setForm({ ...form, body: e.target.value as Body })}>{bodies.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            </div>
            <Field label="Cor"><Swatches value={form.color} onChange={color => setForm({ ...form, color })} /></Field>
            <Field label="Relato do cliente"><textarea rows={3} value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} placeholder="O que o cliente percebeu no veículo" /></Field>
            <div className={s.summary}><span>Serviços<b>{brl(services)}</b></span><span>Peças<b>{brl(partsTotal(o))}</b></span><span>Total<b>{brl(total(o))}</b></span></div>
            <button className={s.secondary} type="submit">Salvar alterações</button>
          </form>}

          {tab === 'Vistoria' && <div className={s.stack}>
            {o.complaint && <p className={s.complaint}><b>Relato do cliente</b>{o.complaint}</p>}
            <Progress value={done(o.inspection)} max={o.inspection.length} label="Checklist de entrada" />
            <Checklist items={o.inspection} onToggle={id => toggle('inspection', id)} />
          </div>}

          {tab === 'Orçamento' && <div className={s.stack}>
            <div className={s.segmented} role="radiogroup" aria-label="Status do orçamento">{(['Pendente', 'Aprovado', 'Recusado'] as const).map(q => <button key={q} role="radio" aria-checked={o.quote === q} className={o.quote === q ? s[`seg${q}`] : ''} onClick={() => onUpdate(() => ({ quote: q }), `Orçamento marcado como ${q.toLowerCase()}`)}>{q}</button>)}</div>
            <table className={s.items}><thead><tr><th>Item</th><th>Qtd.</th><th>Valor</th><th aria-label="Remover" /></tr></thead><tbody>
              {o.items.map(i => <tr key={i.id}><td><em className={i.kind === 'Peça' ? s.tagPart : s.tagService}>{i.kind}</em>{i.description}</td><td>{i.quantity}</td><td>{brl(i.quantity * i.price)}</td><td><button className={s.iconBtn} onClick={() => onUpdate(x => ({ items: x.items.filter(y => y.id !== i.id) }), `Item removido: ${i.description}`)} aria-label={`Remover ${i.description}`}><Trash2 size={14} /></button></td></tr>)}
              {!o.items.length && <tr><td colSpan={4} className={s.empty}>Nenhum item. Adicione serviços e peças abaixo.</td></tr>}
            </tbody><tfoot><tr><td colSpan={2}>Total</td><td colSpan={2}>{brl(total(o))}</td></tr></tfoot></table>
            <form className={s.addItem} onSubmit={addItem}>
              <select value={item.kind} onChange={e => setItem({ ...item, kind: e.target.value as Item['kind'] })} aria-label="Tipo"><option>Serviço</option><option>Peça</option></select>
              <input required value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} placeholder="Descrição" aria-label="Descrição" />
              <input value={item.quantity} onChange={e => setItem({ ...item, quantity: e.target.value.replace(/\D/g, '') })} aria-label="Quantidade" inputMode="numeric" />
              <input required value={item.price} onChange={e => setItem({ ...item, price: e.target.value.replace(/[^\d,.]/g, '') })} placeholder="Valor unit." aria-label="Valor unitário" inputMode="decimal" />
              <button className={s.secondary} type="submit"><Plus size={15} />Adicionar</button>
            </form>
          </div>}

          {tab === 'Serviços' && <div className={s.stack}>
            <Progress value={done(o.tasks)} max={o.tasks.length} label="Serviços concluídos" />
            <Checklist items={o.tasks} onToggle={id => toggle('tasks', id)} onRemove={id => onUpdate(x => ({ tasks: x.tasks.filter(c => c.id !== id) }))} />
            <form className={s.addTask} onSubmit={e => { e.preventDefault(); if (!task.trim()) return; onUpdate(x => ({ tasks: [...x.tasks, { id: uid(), label: task.trim(), done: false }] }), `Serviço adicionado: ${task.trim()}`); setTask(''); }}>
              <input value={task} onChange={e => setTask(e.target.value)} placeholder="Novo serviço, ex.: trocar pastilhas" aria-label="Novo serviço" /><button className={s.secondary} type="submit"><Plus size={15} />Adicionar</button>
            </form>
          </div>}

          {tab === 'Histórico' && <ol className={s.timeline}>{[...o.logs].reverse().map(l => <li key={l.id}><i /><span><b>{l.text}</b><small>{new Date(l.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></span></li>)}</ol>}
        </div>

        <footer className={s.drawerFoot}>
          <button className={s.ghostDanger} onClick={onRemove}><Trash2 size={15} />Excluir</button>
          {o.stage === 'Finalizada' ? <span className={s.closed}><Check size={15} />Finalizada em {dateLabel(o.closedAt!)}</span>
            : <button className={s.primary} onClick={() => onMove(next)}>{next === 'Finalizada' ? 'Finalizar e entregar' : `Avançar para ${next}`}<ChevronRight size={16} /></button>}
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function NewOrderDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (data: NewOrder) => void }) {
  const [form, setForm] = useState(() => ({ model: '', year: '', plate: '', body: 'sedan' as Body, color: colors[0], client: '', phone: '', mechanicId: '', due: dateInput(new Date(Date.now() + 3 * 864e5).toISOString()), complaint: '' }));
  return <Dialog.Root open onOpenChange={v => !v && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay className={s.overlay} />
      <Dialog.Content className={`${s.modal} ${jakarta.variable}`} aria-describedby={undefined}>
        <header className={s.modalHead}><Dialog.Title>Nova ordem de serviço</Dialog.Title><Dialog.Close className={s.round} aria-label="Fechar"><X size={17} /></Dialog.Close></header>
        <form className={s.form} onSubmit={e => { e.preventDefault(); onCreate({ ...form, year: Number(form.year), plate: form.plate.toUpperCase(), due: fromDateInput(form.due) }); }}>
          <div className={s.preview}><Car body={form.body} color={form.color} className={s.previewCar} /><span><b>{form.model || 'Modelo do veículo'} {form.year && yearLabel(Number(form.year))}</b><small>{form.plate || 'Placa'}</small></span></div>
          <div className={s.grid2}>
            <Field label="Modelo"><input required autoFocus value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Ex.: Onix" /></Field>
            <Field label="Ano"><input required inputMode="numeric" pattern="\d{4}" value={form.year} onChange={e => setForm({ ...form, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="2024" /></Field>
            <Field label="Placa"><input required value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase().slice(0, 8) })} placeholder="ABC-1D23" /></Field>
            <Field label="Carroceria"><select aria-label="Carroceria" value={form.body} onChange={e => setForm({ ...form, body: e.target.value as Body })}>{bodies.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Cliente"><input required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></Field>
            <Field label="Telefone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 90000-0000" /></Field>
            <Field label="Mecânico responsável"><select aria-label="Mecânico responsável" value={form.mechanicId} onChange={e => setForm({ ...form, mechanicId: e.target.value })}><option value="">Definir depois</option>{mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
            <Field label="Previsão de entrega"><input type="date" required value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} /></Field>
          </div>
          <Field label="Cor"><Swatches value={form.color} onChange={color => setForm({ ...form, color })} /></Field>
          <Field label="Relato do cliente"><textarea rows={3} value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} placeholder="Ex.: barulho ao frear, luz do motor acesa" /></Field>
          <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Criar OS <Plus size={16} /></button></footer>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function OrdersView({ orders, now, onOpen, onReset }: { orders: Order[]; now: number; onOpen: (id: string) => void; onReset: () => void }) {
  const [filter, setFilter] = useState<Stage | 'Abertas' | 'Todas'>('Abertas');
  const [query, setQuery] = useState('');
  const list = orders.filter(o => (filter === 'Todas' || (filter === 'Abertas' ? isOpen(o) : o.stage === filter)) && matches(query, o)).sort((a, b) => b.number - a.number);
  function csv() {
    const rows = [['OS', 'Veículo', 'Ano', 'Placa', 'Cliente', 'Mecânico', 'Etapa', 'Orçamento', 'Previsão', 'Serviços', 'Peças', 'Total'], ...list.map(o => [code(o.number), o.model, o.year, o.plate, o.client, mechanic(o.mechanicId)?.name ?? '', o.stage, o.quote, dateLabel(o.due), money(total(o) - partsTotal(o)), money(partsTotal(o)), money(total(o))])];
    download('torque-ordens.csv', '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
  }
  return <section className={s.panel}>
    <div className={s.toolbar}>
      <div className={s.filters}>{(['Abertas', ...stages, 'Finalizada', 'Todas'] as const).map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? s.filterOn : ''} onClick={() => setFilter(f)}>{f === 'Finalizada' ? 'Finalizadas' : f}</button>)}</div>
      <label className={s.inlineSearch}><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="OS, placa, modelo ou cliente" aria-label="Filtrar ordens" /></label>
      <button className={s.secondary} onClick={csv}><Download size={15} />CSV</button>
      <button className={s.secondary} onClick={() => download('torque-backup.json', JSON.stringify(orders, null, 2), 'application/json')}><Download size={15} />Backup</button>
      <button className={s.secondary} onClick={onReset} title="Restaurar dados de exemplo"><RotateCcw size={15} /></button>
    </div>
    <div className={s.tableWrap}><table className={s.table}>
      <thead><tr><th>OS</th><th>Veículo</th><th>Cliente</th><th>Responsável</th><th>Etapa</th><th>Previsão</th><th className={s.num}>Total</th></tr></thead>
      <tbody>{list.map(o => { const flagged = alertsFor(o, now).length > 0; return <tr key={o.id} onClick={() => onOpen(o.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen(o.id)}>
        <td><span className={s.chip}>{code(o.number)}</span></td>
        <td><span className={s.vehicleCell}><Car body={o.body} color={o.color} className={s.rowCar} /><span><b>{o.model} {yearLabel(o.year)}</b><small>{o.plate}</small></span></span></td>
        <td>{o.client}</td><td>{mechanic(o.mechanicId)?.name ?? <span className={s.muted}>—</span>}</td>
        <td><em className={`${s.stagePill} ${stageTone[o.stage]}`}>{o.stage}</em>{flagged && <i className={s.dotRed} title="Precisa de atenção" />}</td>
        <td>{dateLabel(o.due)}</td><td className={s.num}>{brl(total(o))}</td>
      </tr>; })}</tbody>
    </table>{!list.length && <p className={s.empty}>Nenhuma OS com esses filtros.</p>}</div>
  </section>;
}

function VehiclesView({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  const vehicles = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of orders) map.set(o.plate, [...(map.get(o.plate) ?? []), o]);
    return [...map.values()].map(list => list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))).sort((a, b) => Number(isOpen(b[0])) - Number(isOpen(a[0])) || b[0].createdAt.localeCompare(a[0].createdAt));
  }, [orders]);
  return <section className={s.vehicleGrid}>{vehicles.map(([last, ...rest]) => <button key={last.plate} className={s.vehicle} onClick={() => onOpen(last.id)}>
    <Car body={last.body} color={last.color} className={s.vehicleCar} />
    <span className={s.vehicleInfo}><b>{last.model} {yearLabel(last.year)}</b><small>Placa: {last.plate}</small><small>Cliente: {last.client}</small></span>
    <span className={s.vehicleFoot}><em className={`${s.stagePill} ${stageTone[last.stage]}`}>{isOpen(last) ? last.stage : 'Na garagem do cliente'}</em><small>{rest.length + 1} {rest.length ? 'visitas' : 'visita'}</small></span>
  </button>)}</section>;
}

function AgendaView({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = new Date(month); first.setDate(1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  const today = dateInput(new Date().toISOString());
  const upcoming = orders.filter(o => isOpen(o)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8);
  return <section className={s.agenda}>
    <div className={s.panel}>
      <div className={s.calHead}><h2>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><div><button className={s.round} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={16} /></button><button className={s.round} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={16} /></button></div></div>
      <div className={s.calendar}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <b key={d}>{d}</b>)}
        {days.map(d => { const key = dateInput(d.toISOString()); const items = orders.filter(o => dateInput(o.due) === key); return <div key={key} className={`${s.day} ${d.getMonth() !== month.getMonth() ? s.dayOut : ''} ${key === today ? s.dayToday : ''}`}>
          <span>{d.getDate()}</span>
          {items.slice(0, 3).map(o => <button key={o.id} className={`${s.event} ${stageTone[o.stage]}`} onClick={() => onOpen(o.id)} title={`${code(o.number)} · ${o.model} · ${o.stage}`}>{o.model}</button>)}
          {items.length > 3 && <small>+{items.length - 3}</small>}
        </div>; })}
      </div>
    </div>
    <aside className={s.panel}><h2 className={s.panelTitle}>Próximas entregas</h2>{upcoming.map(o => <button key={o.id} className={s.result} onClick={() => onOpen(o.id)}><Car body={o.body} color={o.color} className={s.resultCar} /><span><b>{o.model} {yearLabel(o.year)}</b><small>{dateLabel(o.due)} · {o.client}</small></span><em className={`${s.stagePill} ${stageTone[o.stage]}`}>{o.stage}</em></button>)}</aside>
  </section>;
}

function QuotesView({ orders, onOpen, onQuote }: { orders: Order[]; onOpen: (id: string, tab?: Tab) => void; onQuote: (id: string, q: QuoteStatus) => void }) {
  const list = orders.filter(o => o.items.length).sort((a, b) => (a.quote === 'Pendente' ? 0 : 1) - (b.quote === 'Pendente' ? 0 : 1) || a.number - b.number);
  const pending = list.filter(o => o.quote === 'Pendente');
  return <section className={s.panel}>
    <div className={s.miniStats}><span>Aguardando aprovação<b>{pending.length}</b></span><span>Valor pendente<b>{brl(pending.reduce((v, o) => v + total(o), 0))}</b></span><span>Aprovados em aberto<b>{brl(list.filter(o => o.quote === 'Aprovado').reduce((v, o) => v + total(o), 0))}</b></span></div>
    <div className={s.tableWrap}><table className={s.table}>
      <thead><tr><th>OS</th><th>Veículo</th><th>Cliente</th><th>Itens</th><th className={s.num}>Valor</th><th>Status</th></tr></thead>
      <tbody>{list.map(o => <tr key={o.id} onClick={() => onOpen(o.id, 'Orçamento')}>
        <td><span className={s.chip}>{code(o.number)}</span></td>
        <td><span className={s.vehicleCell}><Car body={o.body} color={o.color} className={s.rowCar} /><span><b>{o.model} {yearLabel(o.year)}</b><small>{o.plate}</small></span></span></td>
        <td>{o.client}</td><td>{o.items.length}</td><td className={s.num}>{brl(total(o))}</td>
        <td onClick={e => e.stopPropagation()}><div className={s.segmented}>{(['Pendente', 'Aprovado', 'Recusado'] as const).map(q => <button key={q} aria-pressed={o.quote === q} className={o.quote === q ? s[`seg${q}`] : ''} onClick={() => onQuote(o.id, q)}>{q}</button>)}</div></td>
      </tr>)}</tbody>
    </table>{!list.length && <p className={s.empty}>Nenhum orçamento em aberto.</p>}</div>
  </section>;
}

function FinanceView({ orders, now, onOpen }: { orders: Order[]; now: number; onOpen: (id: string) => void }) {
  const closed = orders.filter(o => o.closedAt).sort((a, b) => b.closedAt!.localeCompare(a.closedAt!));
  const revenue = rolling(orders, total, o => o.closedAt, now), parts = rolling(orders, partsTotal, o => o.closedAt, now);
  const recent = closed.filter(o => now - new Date(o.closedAt!).getTime() < 30 * 864e5);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * 864e5, start = end - 7 * 864e5;
    return { label: new Date(end).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: closed.filter(o => { const t = new Date(o.closedAt!).getTime(); return t > start && t <= end; }).reduce((v, o) => v + total(o), 0) };
  });
  const peak = Math.max(...weeks.map(w => w.value), 1);
  return <section className={s.finance}>
    <div className={s.miniStats}><span>Faturamento (30 dias)<b>{brl(revenue.current)}</b></span><span>Ticket médio<b>{brl(recent.length ? revenue.current / recent.length : 0)}</b></span><span>OS entregues<b>{recent.length}</b></span><span>Peças vendidas<b>{brl(parts.current)}</b></span></div>
    <div className={s.panel}><h2 className={s.panelTitle}>Faturamento semanal</h2><div className={s.bars}>{weeks.map(w => <div key={w.label} title={brl(w.value)}><i style={{ height: `${Math.max(3, w.value / peak * 100)}%` }} /><small>{w.label}</small></div>)}</div></div>
    <div className={s.panel}><div className={s.toolbar}><h2 className={s.panelTitle}>Entregas finalizadas</h2><button className={s.secondary} onClick={() => download('torque-financeiro.csv', '﻿' + [['OS', 'Veículo', 'Cliente', 'Finalizada em', 'Serviços', 'Peças', 'Total'], ...closed.map(o => [code(o.number), `${o.model} ${o.year}`, o.client, dateLabel(o.closedAt!), money(total(o) - partsTotal(o)), money(partsTotal(o)), money(total(o))])].map(r => r.map(v => `"${v}"`).join(';')).join('\n'), 'text/csv')}><Download size={15} />CSV</button></div>
      <div className={s.tableWrap}><table className={s.table}><thead><tr><th>OS</th><th>Veículo</th><th>Cliente</th><th>Finalizada</th><th className={s.num}>Peças</th><th className={s.num}>Total</th></tr></thead>
        <tbody>{closed.slice(0, 30).map(o => <tr key={o.id} onClick={() => onOpen(o.id)}><td><span className={s.chip}>{code(o.number)}</span></td><td>{o.model} {yearLabel(o.year)}</td><td>{o.client}</td><td>{dateLabel(o.closedAt!)}</td><td className={s.num}>{brl(partsTotal(o))}</td><td className={s.num}>{brl(total(o))}</td></tr>)}</tbody></table></div>
    </div>
  </section>;
}

function ClientsView({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  const clients = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of orders) map.set(o.client, [...(map.get(o.client) ?? []), o]);
    return [...map.entries()].map(([name, list]) => ({ name, list: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), spent: list.filter(o => o.closedAt).reduce((v, o) => v + total(o), 0) })).sort((a, b) => b.spent - a.spent);
  }, [orders]);
  return <section className={s.panel}><div className={s.tableWrap}><table className={s.table}>
    <thead><tr><th>Cliente</th><th>Telefone</th><th>Veículos</th><th>Ordens</th><th>Última visita</th><th className={s.num}>Total gasto</th></tr></thead>
    <tbody>{clients.map(c => <tr key={c.name} onClick={() => onOpen(c.list[0].id)}>
      <td><span className={s.clientCell}><i>{c.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</i><b>{c.name}</b></span></td>
      <td>{c.list[0].phone || '—'}</td><td>{[...new Set(c.list.map(o => `${o.model} ${yearLabel(o.year)}`))].join(', ')}</td><td>{c.list.length}{c.list.some(isOpen) && <em className={`${s.stagePill} ${s.toneOrange}`}>em aberto</em>}</td>
      <td>{dateLabel(c.list[0].createdAt)}</td><td className={s.num}>{brl(c.spent)}</td>
    </tr>)}</tbody>
  </table></div></section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={s.field}><span>{label}</span>{children}</label>; }
function Swatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return <div className={s.swatches} role="radiogroup">{colors.map(c => <button type="button" key={c} role="radio" aria-checked={value === c} aria-label={`Cor ${c}`} className={value === c ? s.swatchOn : ''} style={{ background: c }} onClick={() => onChange(c)} />)}</div>;
}
function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className={s.progress}><span><b>{label}</b>{value}/{max}</span><i><em style={{ width: `${max ? value / max * 100 : 0}%` }} /></i></div>;
}
function Checklist({ items, onToggle, onRemove }: { items: CheckItem[]; onToggle: (id: string) => void; onRemove?: (id: string) => void }) {
  return <ul className={s.checklist}>{items.map(c => <li key={c.id}><button className={c.done ? s.checked : ''} onClick={() => onToggle(c.id)} role="checkbox" aria-checked={c.done}><i>{c.done && <Check size={12} strokeWidth={3} />}</i>{c.label}</button>{onRemove && <button className={s.iconBtn} onClick={() => onRemove(c.id)} aria-label={`Remover ${c.label}`}><X size={14} /></button>}</li>)}{!items.length && <li className={s.empty}>Nenhum item ainda.</li>}</ul>;
}

