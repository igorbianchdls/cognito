'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDownRight, ArrowUpRight, Bell, Box, CalendarDays, Cat, ChartColumn, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Dog, Download, House, LayoutGrid, List, Megaphone, Minus, MoreHorizontal, MoreVertical, PawPrint, Plus, RotateCcw, Scissors, Search, Settings, ShoppingCart, Stethoscope, Syringe, Trash2, UserRound, Wallet, X, type LucideIcon } from 'lucide-react';
import { BoxArt, ClientsArt, CoinsArt, PawArt, ProductArt } from './Art';
import { addDays, brl, categories, categoryColor, categoryTone, dateLabel, dayKey, initials, makeSeed, petTones, revenueOn, saleTotal, staff, statusColor, statuses, storageKey, uid, type Appointment, type Category, type Pet, type Product, type Status, type Store } from './data';
import { jakarta } from './fonts';
import s from './PataApp.module.css';

type View = 'Início' | 'Agenda' | 'Clientes' | 'Pets' | 'Serviços' | 'Estoque' | 'Vendas' | 'Financeiro' | 'Marketing' | 'Relatórios' | 'Configurações';
type Mode = 'Kanban' | 'Lista' | 'Calendário';
type FormKind = 'appointment' | 'client' | 'product' | 'service' | 'vaccine';
type Modal = { kind: FormKind; preset?: Record<string, string> } | null;
type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea'; options?: [string, string][]; required?: boolean; wide?: boolean };

const navigation: [View, LucideIcon][] = [['Início', House], ['Agenda', CalendarDays], ['Clientes', UserRound], ['Pets', PawPrint], ['Serviços', Scissors], ['Estoque', Box], ['Vendas', ShoppingCart], ['Financeiro', Wallet], ['Marketing', Megaphone], ['Relatórios', ChartColumn], ['Configurações', Settings]];
const categoryIcon: Record<Category, LucideIcon> = { 'Banho e tosa': Scissors, Consultas: Stethoscope, Vacinação: Syringe, Outros: PawPrint };
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const pct = (v: number) => `${Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const change = (a: number, b: number) => b ? (a - b) / b * 100 : a ? 100 : 0;
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const weekday = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').replace(/^./, c => c.toUpperCase());
const when = (key: string, time: string, today: string) => `${key === today ? 'Hoje' : key === addDays(today, -1) ? 'Ontem' : key === addDays(today, 1) ? 'Amanhã' : dateLabel(key).slice(0, 5)}, ${time}`;
const num = (v: string) => Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;

export default function PataApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Início');
  const [modal, setModal] = useState<Modal>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);
  const [mode, setMode] = useState<Mode>('Kanban');

  useEffect(() => {
    let saved: Store | null = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) saved = JSON.parse(raw); } catch { /* falls back to the demo data */ }
    // Clock and storage are read only after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(saved?.appointments ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  if (!store) return <div className={`${s.app} ${jakarta.variable}`}><div className={s.loading}><Logo /></div></div>;

  const today = dayKey(now);
  const set = (fn: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...fn(prev) }); if (message) setToast(message); };
  const pet = (id: string) => store.pets.find(p => p.id === id);
  const tutor = (id: string) => store.tutors.find(t => t.id === id);
  const service = (id: string) => store.services.find(x => x.id === id);
  const log = (text: string) => ({ at: new Date().toISOString(), text });
  function updateAppointment(id: string, change: Partial<Appointment>, text?: string, message?: string) {
    set(st => ({ appointments: st.appointments.map(a => a.id === id ? { ...a, ...change, logs: text ? [...a.logs, log(text)] : a.logs } : a) }), message);
  }
  function move(id: string, status: Status) {
    const a = store!.appointments.find(x => x.id === id); if (!a || a.status === status) return;
    updateAppointment(id, { status }, `Status alterado para ${status}`, `${pet(a.petId)?.name}: ${status.toLowerCase()}.`);
  }
  function removeAppointment(id: string) {
    const a = store!.appointments.find(x => x.id === id); if (!a || !confirm(`Excluir o atendimento de ${pet(a.petId)?.name} às ${a.time}?`)) return;
    set(st => ({ appointments: st.appointments.filter(x => x.id !== id) }), 'Atendimento excluído.'); setAppointmentId(null);
  }
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const petOptions: [string, string][] = store.pets.map(p => [p.id, `${p.name} (${p.breed}) · ${tutor(p.tutorId)?.name ?? ''}`]);

  function submit(kind: FormKind, v: Record<string, string>) {
    if (kind === 'appointment') {
      const sv = service(v.serviceId)!;
      set(st => ({ appointments: [...st.appointments, { id: uid(), date: v.date, time: v.time, petId: v.petId, serviceId: v.serviceId, staffId: v.staffId, status: v.status as Status, price: sv.price, notes: v.notes, logs: [log('Atendimento agendado')] }] }), `Atendimento de ${pet(v.petId)?.name} agendado para ${when(v.date, v.time, today)}.`);
    }
    if (kind === 'client') {
      const tutorId = uid();
      set(st => ({ tutors: [...st.tutors, { id: tutorId, name: v.tutor, phone: v.phone, email: v.email, createdAt: new Date().toISOString() }], pets: [...st.pets, { id: uid(), name: v.pet, species: v.species as Pet['species'], breed: v.breed || 'SRD', tutorId, tone: petTones[st.pets.length % petTones.length], weight: num(v.weight), birth: v.birth || today, notes: '', vaccines: [] }] }), `${v.tutor} e ${v.pet} cadastrados.`);
    }
    if (kind === 'product') set(st => ({ products: [...st.products, { id: uid(), name: v.name, detail: v.detail, icon: v.icon as Product['icon'], price: num(v.price), stock: num(v.stock), minimum: num(v.minimum) }] }), 'Produto cadastrado.');
    if (kind === 'service') set(st => ({ services: [...st.services, { id: uid(), name: v.name, category: v.category as Category, price: num(v.price), minutes: num(v.minutes) }] }), 'Serviço cadastrado.');
    if (kind === 'vaccine') set(st => ({ pets: st.pets.map(p => p.id === v.petId ? { ...p, vaccines: [...p.vaccines, { id: uid(), name: v.name, date: v.date, next: v.next }] } : p) }), 'Vacina registrada.');
    setModal(null);
  }
  const forms: Record<FormKind, { title: string; fields: Field[]; initial: Record<string, string> }> = {
    appointment: { title: 'Novo atendimento', initial: { petId: store.pets[0]?.id ?? '', serviceId: store.services[0]?.id ?? '', staffId: staff[0].id, date: today, time: '10:00', status: 'Agendado', notes: '' }, fields: [{ key: 'petId', label: 'Pet', type: 'select', options: petOptions, wide: true }, { key: 'serviceId', label: 'Serviço', type: 'select', options: store.services.map(x => [x.id, `${x.name} · ${brl(x.price)}`]) }, { key: 'staffId', label: 'Profissional', type: 'select', options: staff.map(x => [x.id, x.name]) }, { key: 'date', label: 'Data', type: 'date', required: true }, { key: 'time', label: 'Horário', type: 'time', required: true }, { key: 'status', label: 'Status', type: 'select', options: statuses.map(x => [x, x]) }, { key: 'notes', label: 'Observações', type: 'textarea', wide: true }] },
    client: { title: 'Novo cliente e pet', initial: { tutor: '', phone: '', email: '', pet: '', species: 'Cão', breed: '', weight: '', birth: '' }, fields: [{ key: 'tutor', label: 'Nome do tutor', required: true, wide: true }, { key: 'phone', label: 'Telefone', required: true }, { key: 'email', label: 'E-mail' }, { key: 'pet', label: 'Nome do pet', required: true }, { key: 'species', label: 'Espécie', type: 'select', options: [['Cão', 'Cão'], ['Gato', 'Gato']] }, { key: 'breed', label: 'Raça' }, { key: 'weight', label: 'Peso (kg)', type: 'number' }, { key: 'birth', label: 'Nascimento', type: 'date' }] },
    product: { title: 'Novo produto', initial: { name: '', detail: '', icon: 'food', price: '', stock: '', minimum: '5' }, fields: [{ key: 'name', label: 'Produto', required: true, wide: true }, { key: 'detail', label: 'Embalagem (ex.: 15 kg)' }, { key: 'icon', label: 'Tipo', type: 'select', options: [['food', 'Ração'], ['shampoo', 'Higiene'], ['pill', 'Medicamento'], ['treat', 'Petisco'], ['litter', 'Areia'], ['toy', 'Brinquedo']] }, { key: 'price', label: 'Preço (R$)', type: 'number', required: true }, { key: 'stock', label: 'Estoque inicial', type: 'number', required: true }, { key: 'minimum', label: 'Estoque mínimo', type: 'number' }] },
    service: { title: 'Novo serviço', initial: { name: '', category: 'Banho e tosa', price: '', minutes: '60' }, fields: [{ key: 'name', label: 'Serviço', required: true, wide: true }, { key: 'category', label: 'Categoria', type: 'select', options: categories.map(c => [c, c]) }, { key: 'price', label: 'Preço (R$)', type: 'number', required: true }, { key: 'minutes', label: 'Duração (min)', type: 'number' }] },
    vaccine: { title: 'Registrar vacina', initial: { petId: '', name: '', date: today, next: addDays(today, 365) }, fields: [{ key: 'name', label: 'Vacina', required: true, wide: true }, { key: 'date', label: 'Aplicada em', type: 'date', required: true }, { key: 'next', label: 'Próxima dose', type: 'date', required: true }] },
  };
  const ctx: Ctx = { store, now, today, set, go, setModal, move, openAppointment: setAppointmentId, openPet: setPetId, pet, tutor, service, removeAppointment, setToast };
  const currentAppointment = appointmentId && store.appointments.find(a => a.id === appointmentId);
  const currentPet = petId && pet(petId);

  return <div className={`${s.app} ${jakarta.variable}`}>
    <aside className={s.sidebar} aria-label="Navegação principal">
      <button className={s.brand} onClick={() => go('Início')} aria-label="Pata Pet Shop, ir para o início"><Logo /><span>Pata<small>PET SHOP</small></span></button>
      <nav>{navigation.map(([name, Icon]) => <button key={name} className={view === name ? s.navActive : ''} onClick={() => go(name)} aria-current={view === name ? 'page' : undefined} title={name}><Icon size={20} strokeWidth={view === name ? 2.2 : 1.6} /><span>{name}</span></button>)}</nav>
      <div className={s.profile}><span className={s.profilePhoto}>{initials(store.settings.owner)}</span><span><b>{store.settings.owner}</b><small>Administradora</small></span></div>
    </aside>
    <main className={s.main}>
      <Header ctx={ctx} view={view} />
      {view === 'Início' && <>
        <Kpis ctx={ctx} />
        <div className={s.dashGrid}><TodaySection ctx={ctx} mode={mode} setMode={setMode} /><aside className={s.side}><NextCard ctx={ctx} /><DonutCard ctx={ctx} /></aside></div>
        <div className={s.bottomGrid}><WeekCard ctx={ctx} /><TopProducts ctx={ctx} /><StockAlert ctx={ctx} /><RecentClients ctx={ctx} /></div>
      </>}
      {view === 'Agenda' && <section className={s.card}><div className={s.cardHead}><h2>Agenda da semana</h2><button className={s.primarySm} onClick={() => setModal({ kind: 'appointment' })}><Plus size={15} />Novo atendimento</button></div><WeekCalendar ctx={ctx} /></section>}
      {view === 'Clientes' && <ClientsView ctx={ctx} />}
      {view === 'Pets' && <PetsView ctx={ctx} />}
      {view === 'Serviços' && <ServicesView ctx={ctx} />}
      {view === 'Estoque' && <StockView ctx={ctx} />}
      {view === 'Vendas' && <SalesView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Marketing' && <MarketingView ctx={ctx} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
      {view === 'Configurações' && <SettingsView ctx={ctx} />}
    </main>
    {modal && <FormModal key={modal.kind + (modal.preset?.petId ?? '')} {...forms[modal.kind]} preset={modal.preset} onClose={() => setModal(null)} onSubmit={v => submit(modal.kind, { ...forms[modal.kind].initial, ...modal.preset, ...v })} />}
    {currentAppointment && <AppointmentDrawer key={currentAppointment.id} ctx={ctx} a={currentAppointment} onClose={() => setAppointmentId(null)} onUpdate={(c, text, message) => updateAppointment(currentAppointment.id, c, text, message)} />}
    {currentPet && <PetDrawer key={currentPet.id} ctx={ctx} p={currentPet} onClose={() => setPetId(null)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; now: number; today: string; set: (fn: (st: Store) => Partial<Store>, message?: string) => void; go: (v: View) => void; setModal: (m: Modal) => void; move: (id: string, status: Status) => void; openAppointment: (id: string) => void; openPet: (id: string) => void; pet: (id: string) => Pet | undefined; tutor: (id: string) => Store['tutors'][number] | undefined; service: (id: string) => Store['services'][number] | undefined; removeAppointment: (id: string) => void; setToast: (t: string) => void };

function Logo() {
  return <svg viewBox="0 0 48 44" className={s.logo} aria-hidden="true"><defs><linearGradient id="pata-logo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff8a96" /><stop offset="1" stopColor="#ef4a5f" /></linearGradient></defs><path d="M24 22 C33 22 39 31 38 37 C37 42 31 42 24 40 C17 42 11 42 10 37 C9 31 15 22 24 22 Z" fill="url(#pata-logo)" />{[[9, 17, -20], [18, 9, -6], [30, 9, 6], [39, 17, 20]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx="5" ry="6.6" transform={`rotate(${r} ${x} ${y})`} fill="url(#pata-logo)" />)}</svg>;
}
function PetAvatar({ p, size = 56 }: { p?: Pet; size?: number }) {
  const Icon = p?.species === 'Gato' ? Cat : Dog;
  return <span className={s.petAvatar} style={{ width: size, height: size, background: p?.tone ?? '#eee' }} title={p ? `${p.name} · ${p.breed}` : ''}><Icon size={size * .46} strokeWidth={1.7} /><em>{p?.name.charAt(0)}</em></span>;
}
function Person({ name, size = 22 }: { name: string; size?: number }) { return <span className={s.person} style={{ width: size, height: size, fontSize: size * .4 }}>{initials(name)}</span>; }
function ServiceTag({ ctx, id }: { ctx: Ctx; id: string }) {
  const sv = ctx.service(id); if (!sv) return null;
  const Icon = categoryIcon[sv.category];
  return <em className={`${s.tag} ${s[categoryTone[sv.category]]}`}><Icon size={12} />{sv.name}</em>;
}
function Pill({ tone, children }: { tone: string; children: ReactNode }) { return <em className={`${s.pill} ${s[tone]}`}>{children}</em>; }
function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);
  return ref;
}

function alertsOf(ctx: Ctx) {
  const { store, today } = ctx;
  const low = store.products.filter(p => p.stock <= p.minimum);
  const due = store.pets.flatMap(p => p.vaccines.filter(v => v.next >= today && v.next <= addDays(today, 7)).map(v => ({ p, v })));
  const late = store.appointments.filter(a => a.date === today && a.status === 'Agendado' && a.time < new Date(ctx.now).toTimeString().slice(0, 5));
  return [
    ...late.map(a => ({ key: a.id, text: `${ctx.pet(a.petId)?.name}: agendado às ${a.time} e ainda não iniciado`, run: () => ctx.openAppointment(a.id) })),
    ...due.map(({ p, v }) => ({ key: v.id, text: `${p.name}: ${v.name} vence em ${dateLabel(v.next)}`, run: () => ctx.openPet(p.id) })),
    ...low.map(p => ({ key: p.id, text: `${p.name} com estoque baixo (${p.stock} un)`, run: () => ctx.go('Estoque') })),
  ];
}

function Header({ ctx, view }: { ctx: Ctx; view: View }) {
  const { store } = ctx;
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'search' | 'bell' | 'new' | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const close = useMemo(() => () => setPanel(null), []);
  const ref = useOutside(!!panel, close);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); setPanel('search'); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  const q = query.trim();
  const results = q ? [
    ...store.pets.filter(p => has(q, p.name, p.breed)).map(p => ({ key: p.id, label: `${p.name} · ${p.breed}`, meta: `Pet de ${ctx.tutor(p.tutorId)?.name ?? '—'}`, run: () => ctx.openPet(p.id) })),
    ...store.tutors.filter(t => has(q, t.name, t.phone)).map(t => ({ key: t.id, label: t.name, meta: `Cliente · ${t.phone}`, run: () => { const p = store.pets.find(x => x.tutorId === t.id); if (p) ctx.openPet(p.id); else ctx.go('Clientes'); } })),
    ...store.services.filter(x => has(q, x.name, x.category)).map(x => ({ key: x.id, label: x.name, meta: `Serviço · ${brl(x.price)}`, run: () => ctx.go('Serviços') })),
    ...store.products.filter(x => has(q, x.name, x.detail)).map(x => ({ key: x.id, label: x.name, meta: `Produto · ${x.stock} em estoque`, run: () => ctx.go('Estoque') })),
  ].slice(0, 8) : [];
  const alerts = alertsOf(ctx);
  const first = store.settings.owner.split(' ')[0];
  return <header className={s.header} ref={ref}>
    <div className={s.greeting}>{view === 'Início' ? <><h1>Olá, {first}! <span aria-hidden="true">👋</span></h1><p>Aqui está o resumo do seu pet shop hoje.</p></> : <><h1>{view}</h1><p>{store.settings.business}</p></>}</div>
    <div className={s.search}>
      <Search size={18} />
      <input ref={input} value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar cliente, pet, serviço ou produto..." aria-label="Buscar cliente, pet, serviço ou produto" />
      <kbd>⌘ K</kbd>
      {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
    </div>
    <div className={s.rel}>
      <button className={s.round} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={20} />{alerts.length > 0 && <i className={s.dot} />}</button>
      {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Tudo em dia por aqui.</p>}</div>}
    </div>
    <div className={`${s.split} ${s.rel}`}>
      <button className={s.primary} onClick={() => ctx.setModal({ kind: 'appointment' })}><Plus size={19} /><span>Novo atendimento</span></button>
      <button className={s.primary} onClick={() => setPanel(panel === 'new' ? null : 'new')} aria-label="Mais opções de cadastro" aria-expanded={panel === 'new'}><ChevronDown size={18} /></button>
      {panel === 'new' && <div className={`${s.popover} ${s.menuPop}`} role="menu">
        <button role="menuitem" onClick={() => { ctx.setModal({ kind: 'appointment' }); setPanel(null); }}>Novo atendimento</button>
        <button role="menuitem" onClick={() => { ctx.setModal({ kind: 'client' }); setPanel(null); }}>Novo cliente e pet</button>
        <button role="menuitem" onClick={() => { ctx.go('Vendas'); setPanel(null); }}>Nova venda</button>
        <button role="menuitem" onClick={() => { ctx.setModal({ kind: 'product' }); setPanel(null); }}>Novo produto</button>
      </div>}
    </div>
  </header>;
}

function MiniBars({ values }: { values: number[] }) {
  const peak = Math.max(...values, 1);
  return <span className={s.mini} aria-hidden="true">{values.map((v, i) => <i key={i} style={{ height: `${Math.max(12, v / peak * 100)}%`, opacity: .35 + i / values.length * .65 }} />)}</span>;
}
function Kpis({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const revenue = days.map(d => revenueOn(store, d));
  const count = days.map(d => store.appointments.filter(a => a.date === d).length);
  const newClients = days.map(d => store.tutors.filter(t => dayKey(t.createdAt) === d).length);
  const weekNew = store.tutors.filter(t => dayKey(t.createdAt) > addDays(today, -7)).length, prevNew = store.tutors.filter(t => dayKey(t.createdAt) > addDays(today, -14) && dayKey(t.createdAt) <= addDays(today, -7)).length;
  const units = store.products.reduce((v, p) => v + p.stock, 0), low = store.products.filter(p => p.stock <= p.minimum).length;
  const sold = days.map(d => store.sales.filter(x => dayKey(x.date) === d).reduce((v, x) => v + x.items.reduce((n, i) => n + i.quantity, 0), 0));
  const delta = (v: number, label: string) => <p className={v >= 0 ? s.up : s.down}>{v >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}<b>{pct(v)}</b>{label}</p>;
  return <section className={s.kpis} aria-label="Indicadores">
    <article className={s.kpi}><CoinsArt /><div><h2>Faturamento hoje</h2><strong>{brl(revenue[6])}</strong>{delta(change(revenue[6], revenue[5]), 'vs. ontem')}</div><MiniBars values={revenue} /><button className={s.kpiMore} onClick={() => ctx.go('Financeiro')} aria-label="Ver financeiro"><MoreVertical size={17} /></button></article>
    <article className={s.kpi}><PawArt /><div><h2>Atendimentos hoje</h2><strong>{count[6]}</strong>{delta(change(count[6], count[5]), 'vs. ontem')}</div><MiniBars values={count} /><button className={s.kpiMore} onClick={() => ctx.go('Agenda')} aria-label="Ver agenda"><MoreVertical size={17} /></button></article>
    <article className={s.kpi}><ClientsArt /><div><h2>Novos clientes</h2><strong>{weekNew}</strong>{delta(change(weekNew, prevNew), 'vs. semana passada')}</div><MiniBars values={newClients} /><button className={s.kpiMore} onClick={() => ctx.go('Clientes')} aria-label="Ver clientes"><MoreVertical size={17} /></button></article>
    <article className={s.kpi}><BoxArt /><div><h2>Produtos em estoque</h2><strong>{units}</strong><p className={low ? s.down : s.up}>{low ? <ArrowDownRight size={14} /> : <Check size={14} />}<b>{low}</b>{low === 1 ? 'item abaixo do mínimo' : 'itens abaixo do mínimo'}</p></div><MiniBars values={sold} /><button className={s.kpiMore} onClick={() => ctx.go('Estoque')} aria-label="Ver estoque"><MoreVertical size={17} /></button></article>
  </section>;
}

function TodaySection({ ctx, mode, setMode }: { ctx: Ctx; mode: Mode; setMode: (m: Mode) => void }) {
  const { store, today } = ctx;
  const [filter, setFilter] = useState<Category | 'Todos'>('Todos');
  const [more, setMore] = useState(false);
  const closeMore = useMemo(() => () => setMore(false), []);
  const ref = useOutside(more, closeMore);
  const todays = store.appointments.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const inCat = (a: Appointment, c: Category | 'Todos') => c === 'Todos' || ctx.service(a.serviceId)?.category === c;
  const list = todays.filter(a => inCat(a, filter));
  return <section className={s.today}>
    <div className={s.todayHead}>
      <h2>Atendimentos de hoje</h2>
      <div className={s.tabs} role="tablist">{(['Todos', ...categories] as const).map(c => <button key={c} role="tab" aria-selected={filter === c} className={filter === c ? s.tabOn : ''} onClick={() => setFilter(c)}>{c}<span>{todays.filter(a => inCat(a, c)).length}</span></button>)}</div>
      <div className={s.tools}>
        <div className={s.modes}>{([['Kanban', LayoutGrid], ['Lista', List], ['Calendário', CalendarDays]] as [Mode, LucideIcon][]).map(([m, Icon]) => <button key={m} aria-pressed={mode === m} className={mode === m ? s.modeOn : ''} onClick={() => setMode(m)}><Icon size={15} />{m}</button>)}</div>
        <div className={s.rel} ref={ref}><button className={s.roundSm} onClick={() => setMore(!more)} aria-label="Mais opções" aria-expanded={more}><MoreHorizontal size={17} /></button>
          {more && <div className={`${s.popover} ${s.menuPop}`} role="menu">
            <button role="menuitem" onClick={() => { download(`atendimentos-${today}.csv`, csv([['Horário', 'Pet', 'Raça', 'Tutor', 'Serviço', 'Profissional', 'Status', 'Valor'], ...todays.map(a => { const p = ctx.pet(a.petId); return [a.time, p?.name ?? '', p?.breed ?? '', ctx.tutor(p?.tutorId ?? '')?.name ?? '', ctx.service(a.serviceId)?.name ?? '', staff.find(x => x.id === a.staffId)?.name ?? '', a.status, a.price]; })]), 'text/csv'); setMore(false); }}>Exportar atendimentos do dia</button>
            <button role="menuitem" onClick={() => ctx.go('Agenda')}>Abrir agenda da semana</button>
          </div>}
        </div>
      </div>
    </div>
    {mode === 'Kanban' && <Board ctx={ctx} list={list} />}
    {mode === 'Lista' && <div className={s.card}><AppointmentTable ctx={ctx} list={list} /></div>}
    {mode === 'Calendário' && <div className={s.card}><WeekCalendar ctx={ctx} filter={filter} /></div>}
  </section>;
}

function Board({ ctx, list }: { ctx: Ctx; list: Appointment[] }) {
  const [dragging, setDragging] = useState<Appointment | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Status[]>([]);
  const closeMenu = useMemo(() => () => setMenu(null), []);
  const ref = useOutside(!!menu, closeMenu);
  function start(e: DragEvent<HTMLElement>, a: Appointment) {
    e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move';
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.classList.add(s.ghost); ghost.style.width = `${e.currentTarget.offsetWidth}px`;
    e.currentTarget.parentElement?.appendChild(ghost);
    const box = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setDragImage(ghost, e.clientX - box.left, e.clientY - box.top);
    setTimeout(() => ghost.remove());
    setDragging(a); setMenu(null);
  }
  return <div className={s.board} ref={ref}>{statuses.map(status => {
    const items = list.filter(a => a.status === status), open = expanded.includes(status), shown = open ? items : items.slice(0, 3), target = over === status && dragging && dragging.status !== status;
    return <div key={status} className={`${s.column} ${target ? s.columnOver : ''}`} style={{ '--tint': statusColor[status] } as React.CSSProperties} onDragOver={e => { e.preventDefault(); if (over !== status) setOver(status); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) ctx.move(id, status); setDragging(null); setOver(null); }}>
      <header><i /><b>{status}</b><span>{items.length}</span><button className={s.addCol} onClick={() => ctx.setModal({ kind: 'appointment', preset: { status } })} aria-label={`Novo atendimento em ${status}`}><Plus size={17} /></button></header>
      <div className={s.cards}>
        {target && <div className={s.dropZone} aria-hidden="true" />}
        {shown.map(a => <AppointmentCard key={a.id} ctx={ctx} a={a} dragging={dragging?.id === a.id} menuOpen={menu === a.id} onMenu={() => setMenu(menu === a.id ? null : a.id)} onDragStart={e => start(e, a)} onDragEnd={() => { setDragging(null); setOver(null); }} />)}
        {items.length > 3 && <button className={s.more} onClick={() => setExpanded(open ? expanded.filter(x => x !== status) : [...expanded, status])}>{open ? 'Mostrar menos' : `Ver mais ${items.length - 3}`}</button>}
        {!items.length && !target && <p className={s.emptyCol}>Arraste um atendimento para cá</p>}
      </div>
    </div>;
  })}</div>;
}

function AppointmentCard({ ctx, a, dragging, menuOpen, onMenu, onDragStart, onDragEnd }: { ctx: Ctx; a: Appointment; dragging: boolean; menuOpen: boolean; onMenu: () => void; onDragStart: (e: DragEvent<HTMLElement>) => void; onDragEnd: () => void }) {
  const p = ctx.pet(a.petId), t = ctx.tutor(p?.tutorId ?? '');
  const next = statuses[statuses.indexOf(a.status) + 1];
  return <article className={`${s.acard} ${dragging ? s.acardDragging : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <div className={s.acardTop}><time>{a.time}</time>
      <div className={s.rel}><button className={s.kebab} onClick={onMenu} aria-label={`Ações do atendimento de ${p?.name}`} aria-expanded={menuOpen}><MoreVertical size={16} /></button>
        {menuOpen && <div className={s.menuList} role="menu">
          <button role="menuitem" onClick={() => { onMenu(); ctx.openAppointment(a.id); }}>Abrir atendimento</button>
          {next && <button role="menuitem" onClick={() => { onMenu(); ctx.move(a.id, next); }}>Mover para {next}</button>}
          {p && <button role="menuitem" onClick={() => { onMenu(); ctx.openPet(p.id); }}>Ficha do pet</button>}
          <button role="menuitem" className={s.danger} onClick={() => { onMenu(); ctx.removeAppointment(a.id); }}>Excluir</button>
        </div>}
      </div>
    </div>
    <button className={s.acardBody} onClick={() => ctx.openAppointment(a.id)} aria-label={`Abrir atendimento de ${p?.name}`}>
      <PetAvatar p={p} size={64} />
      <span><b>{p?.name}</b><small>{p?.breed}</small><ServiceTag ctx={ctx} id={a.serviceId} /></span>
    </button>
    <div className={s.acardFoot}><Person name={t?.name ?? '?'} /><span>{t?.name}</span><button className={s.kebab} onClick={onMenu} aria-label={`Mais ações de ${p?.name}`}><MoreVertical size={16} /></button></div>
  </article>;
}

function AppointmentTable({ ctx, list }: { ctx: Ctx; list: Appointment[] }) {
  return <div className={s.tableWrap}><table className={s.table}>
    <thead><tr><th>Horário</th><th>Pet</th><th>Tutor</th><th>Serviço</th><th>Profissional</th><th>Status</th><th className={s.num}>Valor</th></tr></thead>
    <tbody>{list.map(a => { const p = ctx.pet(a.petId); return <tr key={a.id} className={s.clickable} onClick={() => ctx.openAppointment(a.id)}>
      <td><b>{a.time}</b></td><td><span className={s.cell}><PetAvatar p={p} size={34} /><span className={s.stackText}><b>{p?.name}</b><small>{p?.breed}</small></span></span></td>
      <td>{ctx.tutor(p?.tutorId ?? '')?.name}</td><td><ServiceTag ctx={ctx} id={a.serviceId} /></td><td>{staff.find(x => x.id === a.staffId)?.name}</td>
      <td><span className={s.status}><i style={{ background: statusColor[a.status] }} />{a.status}</span></td><td className={s.num}>{brl(a.price)}</td>
    </tr>; })}</tbody>
  </table>{!list.length && <p className={s.empty}>Nenhum atendimento.</p>}</div>;
}

function WeekCalendar({ ctx, filter = 'Todos' }: { ctx: Ctx; filter?: Category | 'Todos' }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(`${ctx.today}T12:00`); const monday = addDays(ctx.today, -((base.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return <div>
    <div className={s.calHead}><button className={s.roundSm} onClick={() => setOffset(offset - 1)} aria-label="Semana anterior"><ChevronLeft size={17} /></button><b>{dateLabel(days[0]).slice(0, 5)} – {dateLabel(days[6])}</b><button className={s.roundSm} onClick={() => setOffset(offset + 1)} aria-label="Próxima semana"><ChevronRight size={17} /></button>{offset !== 0 && <button className={s.chipBtn} onClick={() => setOffset(0)}>Hoje</button>}</div>
    <div className={s.week}>{days.map(d => { const items = ctx.store.appointments.filter(a => a.date === d && (filter === 'Todos' || ctx.service(a.serviceId)?.category === filter)).sort((a, b) => a.time.localeCompare(b.time)); return <div key={d} className={`${s.day} ${d === ctx.today ? s.dayToday : ''}`}>
      <header><b>{weekday(d)}</b><span>{dateLabel(d).slice(0, 5)}</span><small>{items.length}</small></header>
      <div>{items.map(a => { const p = ctx.pet(a.petId), sv = ctx.service(a.serviceId); return <button key={a.id} className={s.event} style={{ borderLeftColor: sv ? categoryColor[sv.category] : '#ccc' }} onClick={() => ctx.openAppointment(a.id)}><b>{a.time} · {p?.name}</b><small>{sv?.name}</small></button>; })}
        <button className={s.addEvent} onClick={() => ctx.setModal({ kind: 'appointment', preset: { date: d } })} aria-label={`Agendar em ${dateLabel(d)}`}><Plus size={14} /></button></div>
    </div>; })}</div>
  </div>;
}

function NextCard({ ctx }: { ctx: Ctx }) {
  const nowTime = new Date(ctx.now).toTimeString().slice(0, 5);
  const list = ctx.store.appointments.filter(a => a.status === 'Agendado' && (a.date > ctx.today || (a.date === ctx.today && a.time >= nowTime))).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 4);
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Próximos atendimentos</h2><button className={s.chipBtn} onClick={() => ctx.go('Agenda')}>Ver todos</button></div>
    <ul className={s.rows}>{list.map(a => { const p = ctx.pet(a.petId); return <li key={a.id}><button className={s.nextRow} onClick={() => ctx.openAppointment(a.id)}>
      <time>{a.time}{a.date !== ctx.today && <small>{a.date === addDays(ctx.today, 1) ? 'Amanhã' : dateLabel(a.date).slice(0, 5)}</small>}</time>
      <PetAvatar p={p} size={44} /><span className={s.stackText}><b>{p?.name}</b><small>{p?.breed}</small></span><ServiceTag ctx={ctx} id={a.serviceId} /><ChevronRight size={17} className={s.chev} />
    </button></li>; })}{!list.length && <li className={s.empty}>Nenhum atendimento agendado.</li>}</ul>
  </section>;
}

function DonutCard({ ctx }: { ctx: Ctx }) {
  const [month, setMonth] = useState<0 | 1>(0);
  const d = new Date(`${ctx.today}T12:00`); d.setDate(1); d.setMonth(d.getMonth() - month);
  const prefix = dayKey(d).slice(0, 7);
  const list = ctx.store.appointments.filter(a => a.date.startsWith(prefix) && a.date <= ctx.today);
  const counts = categories.map(c => list.filter(a => ctx.service(a.serviceId)?.category === c).length), totalCount = counts.reduce((a, b) => a + b, 0);
  const R = 52, C = 2 * Math.PI * R;
  const lengths = counts.map(c => totalCount ? c / totalCount * C : 0), offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Pets por serviço (mês)</h2><select className={s.chipSelect} value={month} onChange={e => setMonth(Number(e.target.value) as 0 | 1)} aria-label="Período"><option value={0}>Este mês</option><option value={1}>Mês passado</option></select></div>
    <div className={s.donutBox}>
      <svg viewBox="0 0 140 140" className={s.donut} role="img" aria-label={`${totalCount} atendimentos no mês`}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f3eeee" strokeWidth="20" />
        {lengths.map((len, i) => <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={categoryColor[categories[i]]} strokeWidth="20" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-offsets[i]} transform="rotate(-90 70 70)" />)}
        <text x="70" y="70" textAnchor="middle" className={s.donutValue}>{totalCount}</text><text x="70" y="86" textAnchor="middle" className={s.donutLabel}>atendimentos</text>
      </svg>
      <ul className={s.legend}>{categories.map((c, i) => <li key={c}><i style={{ background: categoryColor[c] }} /><span>{c}</span><b>{counts[i]}</b><small>{totalCount ? pct(counts[i] / totalCount * 100) : '0%'}</small></li>)}</ul>
    </div>
  </section>;
}

function WeekCard({ ctx }: { ctx: Ctx }) {
  const base = new Date(`${ctx.today}T12:00`), monday = addDays(ctx.today, -((base.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const values = days.map(d => d <= ctx.today ? revenueOn(ctx.store, d) : 0), totalNow = values.reduce((a, b) => a + b, 0);
  const prev = days.filter(d => d <= ctx.today).reduce((v, d) => v + revenueOn(ctx.store, addDays(d, -7)), 0), delta = change(totalNow, prev);
  const peak = Math.max(...values, 1);
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Faturamento da semana</h2><button className={s.chipBtn} onClick={() => ctx.go('Financeiro')}>Ver detalhes</button></div>
    <strong className={s.bigValue}>{brl(totalNow)}</strong>
    <p className={delta >= 0 ? s.up : s.down}>{delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}<b>{pct(delta)}</b>vs. mesmo período da semana anterior</p>
    <div className={s.weekBars}>{days.map((d, i) => <div key={d} title={`${weekday(d)}: ${brl(values[i])}`}><span><i style={{ height: `${values[i] / peak * 100}%` }} className={d === ctx.today ? s.barToday : ''} /></span><small>{weekday(d)}</small></div>)}</div>
  </section>;
}

function TopProducts({ ctx }: { ctx: Ctx }) {
  const prefix = ctx.today.slice(0, 7);
  const qty = new Map<string, number>();
  for (const sale of ctx.store.sales) if (dayKey(sale.date).startsWith(prefix)) for (const i of sale.items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);
  const list = [...qty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, q]) => ({ p: ctx.store.products.find(x => x.id === id), q })).filter(x => x.p) as { p: Product; q: number }[];
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Produtos mais vendidos</h2><button className={s.chipBtn} onClick={() => ctx.go('Vendas')}>Ver todos</button></div>
    <ul className={s.rows}>{list.map(({ p, q }) => <li key={p.id}><span className={s.prodIcon}><ProductArt icon={p.icon} /></span><span className={s.stackText}><b>{p.name}</b><small>{p.detail}</small></span><b>{q}</b></li>)}{!list.length && <li className={s.empty}>Nenhuma venda neste mês.</li>}</ul>
  </section>;
}
function StockAlert({ ctx }: { ctx: Ctx }) {
  const list = ctx.store.products.filter(p => p.stock <= p.minimum).sort((a, b) => a.stock / a.minimum - b.stock / b.minimum).slice(0, 5);
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Estoque em atenção</h2><button className={s.chipBtn} onClick={() => ctx.go('Estoque')}>Ver todos</button></div>
    <ul className={s.rows}>{list.map(p => <li key={p.id}><span className={s.prodIcon}><ProductArt icon={p.icon} /></span><span className={s.stackText}><b>{p.name}</b><small>Mínimo: {p.minimum} un</small></span><b className={s.redText}>{p.stock} un</b></li>)}{!list.length && <li className={s.empty}>Nenhum produto abaixo do mínimo.</li>}</ul>
  </section>;
}
function RecentClients({ ctx }: { ctx: Ctx }) {
  const nowTime = new Date(ctx.now).toTimeString().slice(0, 5);
  const list = ctx.store.appointments.filter(a => a.date < ctx.today || (a.date === ctx.today && (a.status !== 'Agendado' || a.time <= nowTime))).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const seen = new Set<string>(), rows: Appointment[] = [];
  for (const a of list) { const t = ctx.pet(a.petId)?.tutorId ?? ''; if (!seen.has(t)) { seen.add(t); rows.push(a); } if (rows.length === 5) break; }
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Clientes recentes</h2><button className={s.chipBtn} onClick={() => ctx.go('Clientes')}>Ver todos</button></div>
    <ul className={s.rows}>{rows.map(a => { const p = ctx.pet(a.petId), t = ctx.tutor(p?.tutorId ?? ''); return <li key={a.id}><button className={s.nextRow} onClick={() => p && ctx.openPet(p.id)}><Person name={t?.name ?? '?'} size={34} /><span className={s.stackText}><b>{t?.name}</b><small>{p?.name}</small></span><small className={s.muted}>{when(a.date, a.time, ctx.today)}</small><ChevronRight size={16} className={s.chev} /></button></li>; })}</ul>
  </section>;
}

function Shell({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.modal} ${wide ? s.modalWide : ''} ${jakarta.variable}`} aria-describedby={undefined}>
      <header className={s.modalHead}><Dialog.Title>{title}</Dialog.Title><Dialog.Close className={s.roundSm} aria-label="Fechar"><X size={17} /></Dialog.Close></header>
      {children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
function FormModal({ title, fields, initial, preset, onClose, onSubmit }: { title: string; fields: Field[]; initial: Record<string, string>; preset?: Record<string, string>; onClose: () => void; onSubmit: (v: Record<string, string>) => void }) {
  const [values, setValues] = useState({ ...initial, ...preset });
  return <Shell title={title} onClose={onClose}>
    <form className={s.form} onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(values); }}>
      {fields.map(f => <label key={f.key} className={`${s.field} ${f.wide ? s.wide : ''}`}><span>{f.label}</span>
        {f.type === 'select' ? <select value={values[f.key]} onChange={e => setValues({ ...values, [f.key]: e.target.value })}>{f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          : f.type === 'textarea' ? <textarea rows={3} value={values[f.key]} onChange={e => setValues({ ...values, [f.key]: e.target.value })} />
            : <input type={f.type === 'number' ? 'text' : f.type ?? 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} required={f.required} value={values[f.key]} onChange={e => setValues({ ...values, [f.key]: f.type === 'number' ? e.target.value.replace(/[^\d,.]/g, '') : e.target.value })} />}
      </label>)}
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function AppointmentDrawer({ ctx, a, onClose, onUpdate }: { ctx: Ctx; a: Appointment; onClose: () => void; onUpdate: (c: Partial<Appointment>, text?: string, message?: string) => void }) {
  const p = ctx.pet(a.petId), t = ctx.tutor(p?.tutorId ?? '');
  const [form, setForm] = useState({ serviceId: a.serviceId, staffId: a.staffId, date: a.date, time: a.time, price: String(a.price).replace('.', ','), notes: a.notes });
  const history = ctx.store.appointments.filter(x => x.petId === a.petId && x.id !== a.id && x.date <= ctx.today).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);
  const next = statuses[statuses.indexOf(a.status) + 1];
  const nextVaccine = p?.vaccines.filter(v => v.next >= ctx.today).sort((x, y) => x.next.localeCompare(y.next))[0];
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.drawer} ${jakarta.variable}`} aria-describedby={undefined}>
      <header className={s.drawerHead}>
        <PetAvatar p={p} size={72} />
        <div><Dialog.Title>{p?.name}</Dialog.Title><p>{p?.breed} · {p?.species} · {p?.weight} kg</p><p className={s.muted}>Tutor: {t?.name} · {t?.phone}</p></div>
        <Dialog.Close className={s.roundSm} aria-label="Fechar"><X size={17} /></Dialog.Close>
      </header>
      <ol className={s.stepper} aria-label="Status do atendimento">{statuses.map((st, i) => { const reached = statuses.indexOf(a.status) >= i; return <li key={st}><button className={`${reached ? s.stepDone : ''} ${a.status === st ? s.stepCurrent : ''}`} onClick={() => ctx.move(a.id, st)} aria-current={a.status === st ? 'step' : undefined}><i style={reached ? { background: statusColor[st] } : undefined}>{reached ? <Check size={11} strokeWidth={3} /> : i + 1}</i>{st}</button></li>; })}</ol>
      <div className={s.drawerBody}>
        <form className={s.form} onSubmit={e => { e.preventDefault(); onUpdate({ ...form, price: num(form.price) }, 'Dados do atendimento atualizados', 'Atendimento atualizado.'); }}>
          <label className={s.field}><span>Serviço</span><select value={form.serviceId} onChange={e => { const sv = ctx.service(e.target.value); setForm({ ...form, serviceId: e.target.value, price: sv ? String(sv.price).replace('.', ',') : form.price }); }}>{ctx.store.services.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className={s.field}><span>Profissional</span><select value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}>{staff.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className={s.field}><span>Data</span><input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
          <label className={s.field}><span>Horário</span><input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label>
          <label className={s.field}><span>Valor (R$)</span><input inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
          <span className={s.field}><span>Situação</span><span className={s.status}><i style={{ background: statusColor[a.status] }} />{a.status}{a.status === 'Concluído' && ' · valor somado ao faturamento'}</span></span>
          <label className={`${s.field} ${s.wide}`}><span>Observações</span><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Comportamento, pedidos do tutor, produtos usados..." /></label>
          <div className={s.wide}><button className={s.secondary} type="submit">Salvar alterações</button></div>
        </form>
        <div className={s.infoGrid}>
          <div><h3>Ficha do pet</h3><p>{p?.notes || 'Sem observações.'}</p><p className={s.muted}>Próxima vacina: {nextVaccine ? `${nextVaccine.name} em ${dateLabel(nextVaccine.next)}` : '—'}</p>{p && <button className={s.link} onClick={() => { onClose(); ctx.openPet(p.id); }}>Abrir ficha completa</button>}</div>
          <div><h3>Últimas visitas</h3><ul className={s.mini2}>{history.map(h => <li key={h.id}><span>{dateLabel(h.date)}</span><b>{ctx.service(h.serviceId)?.name}</b></li>)}{!history.length && <li className={s.muted}>Primeira visita.</li>}</ul></div>
          <div className={s.wide}><h3>Histórico</h3><ul className={s.mini2}>{[...a.logs].reverse().map((l, i) => <li key={i}><span>{new Date(l.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><b>{l.text}</b></li>)}</ul></div>
        </div>
      </div>
      <footer className={s.drawerFoot}>
        <button className={s.dangerBtn} onClick={() => ctx.removeAppointment(a.id)}><Trash2 size={15} />Excluir</button>
        {next ? <button className={s.primary} onClick={() => ctx.move(a.id, next)}>Mover para {next}<ChevronRight size={16} /></button> : <span className={s.done}><Check size={15} />Atendimento concluído</span>}
      </footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

function PetDrawer({ ctx, p, onClose }: { ctx: Ctx; p: Pet; onClose: () => void }) {
  const t = ctx.tutor(p.tutorId);
  const [form, setForm] = useState({ name: p.name, species: p.species, breed: p.breed, weight: String(p.weight), birth: p.birth, notes: p.notes });
  const visits = ctx.store.appointments.filter(a => a.petId === p.id).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const save = (e: FormEvent) => { e.preventDefault(); ctx.set(st => ({ pets: st.pets.map(x => x.id === p.id ? { ...x, ...form, weight: num(form.weight) } : x) }), 'Ficha do pet atualizada.'); };
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={`${s.drawer} ${jakarta.variable}`} aria-describedby={undefined}>
      <header className={s.drawerHead}><PetAvatar p={p} size={72} /><div><Dialog.Title>{p.name}</Dialog.Title><p>{p.breed} · {p.species}</p><p className={s.muted}>Tutor: {t?.name} · {t?.phone}</p></div><Dialog.Close className={s.roundSm} aria-label="Fechar"><X size={17} /></Dialog.Close></header>
      <div className={s.drawerBody}>
        <form className={s.form} onSubmit={save}>
          <label className={s.field}><span>Nome</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className={s.field}><span>Espécie</span><select value={form.species} onChange={e => setForm({ ...form, species: e.target.value as Pet['species'] })}><option>Cão</option><option>Gato</option></select></label>
          <label className={s.field}><span>Raça</span><input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} /></label>
          <label className={s.field}><span>Peso (kg)</span><input inputMode="decimal" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
          <label className={s.field}><span>Nascimento</span><input type="date" value={form.birth} onChange={e => setForm({ ...form, birth: e.target.value })} /></label>
          <label className={`${s.field} ${s.wide}`}><span>Observações</span><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          <div className={`${s.wide} ${s.rowBtns}`}><button className={s.secondary} type="submit">Salvar ficha</button><button type="button" className={s.primarySm} onClick={() => { onClose(); ctx.setModal({ kind: 'appointment', preset: { petId: p.id } }); }}><Plus size={15} />Agendar atendimento</button></div>
        </form>
        <section className={s.subsection}><div className={s.cardHead}><h3>Vacinas</h3><button className={s.chipBtn} onClick={() => ctx.setModal({ kind: 'vaccine', preset: { petId: p.id } })}><Plus size={14} />Registrar</button></div>
          <ul className={s.mini2}>{p.vaccines.map(v => <li key={v.id}><span>{v.name}</span><b>Aplicada {dateLabel(v.date)}</b>{v.next < ctx.today ? <Pill tone="redPill">Vencida em {dateLabel(v.next)}</Pill> : v.next <= addDays(ctx.today, 30) ? <Pill tone="amber">Próxima {dateLabel(v.next)}</Pill> : <Pill tone="green">Próxima {dateLabel(v.next)}</Pill>}</li>)}{!p.vaccines.length && <li className={s.muted}>Nenhuma vacina registrada.</li>}</ul>
        </section>
        <section className={s.subsection}><h3>Atendimentos ({visits.length})</h3><ul className={s.mini2}>{visits.slice(0, 12).map(a => <li key={a.id}><span>{dateLabel(a.date)} {a.time}</span><b>{ctx.service(a.serviceId)?.name}</b><span className={s.status}><i style={{ background: statusColor[a.status] }} />{a.status}</span></li>)}</ul></section>
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

function Table({ title, head, rows, action, numeric = [], extra }: { title: string; head: string[]; rows: { key: string; cells: ReactNode[]; onClick?: () => void }[]; action?: [string, () => void]; numeric?: number[]; extra?: ReactNode }) {
  return <section className={s.card}>
    <div className={s.cardHead}><h2>{title}</h2><div className={s.rowBtns}>{extra}{action && <button className={s.primarySm} onClick={action[1]}><Plus size={15} />{action[0]}</button>}</div></div>
    <div className={s.tableWrap}><table className={s.table}><thead><tr>{head.map((h, i) => <th key={h + i} className={numeric.includes(i) ? s.num : ''}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(r => <tr key={r.key} onClick={r.onClick} className={r.onClick ? s.clickable : ''}>{r.cells.map((c, i) => <td key={i} className={numeric.includes(i) ? s.num : ''}>{c}</td>)}</tr>)}</tbody></table>
      {!rows.length && <p className={s.empty}>Nada por aqui ainda.</p>}</div>
  </section>;
}

function ClientsView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const [q, setQ] = useState('');
  const rows = store.tutors.filter(t => has(q, t.name, t.phone, t.email, ...store.pets.filter(p => p.tutorId === t.id).map(p => p.name))).map(t => {
    const pets = store.pets.filter(p => p.tutorId === t.id), ids = new Set(pets.map(p => p.id));
    const visits = store.appointments.filter(a => ids.has(a.petId) && a.status === 'Concluído');
    const spent = visits.reduce((v, a) => v + a.price, 0) + store.sales.filter(x => x.tutorId === t.id).reduce((v, x) => v + saleTotal(x), 0);
    const last = visits.map(a => a.date).sort().pop();
    return { t, pets, visits: visits.length, spent, last };
  }).sort((a, b) => (b.last ?? '').localeCompare(a.last ?? ''));
  return <Table title={`Clientes (${store.tutors.length})`} action={['Novo cliente e pet', () => ctx.setModal({ kind: 'client' })]} extra={<label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, telefone ou pet" aria-label="Filtrar clientes" /></label>} head={['Cliente', 'Contato', 'Pets', 'Visitas', 'Última visita', 'Total gasto']} numeric={[5]} rows={rows.map(({ t, pets, visits, spent, last }) => ({ key: t.id, onClick: () => pets[0] && ctx.openPet(pets[0].id), cells: [<span key="n" className={s.cell}><Person name={t.name} size={32} /><b>{t.name}</b></span>, <span key="c" className={s.stackText}>{t.phone}<small>{t.email}</small></span>, pets.map(p => p.name).join(', ') || '—', visits, last ? dateLabel(last) : '—', brl(spent)] }))} />;
}

function PetsView({ ctx }: { ctx: Ctx }) {
  const [q, setQ] = useState('');
  const [species, setSpecies] = useState<'Todos' | 'Cão' | 'Gato'>('Todos');
  const list = ctx.store.pets.filter(p => (species === 'Todos' || p.species === species) && has(q, p.name, p.breed, ctx.tutor(p.tutorId)?.name ?? ''));
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Pets ({list.length})</h2><div className={s.rowBtns}><div className={s.modes}>{(['Todos', 'Cão', 'Gato'] as const).map(x => <button key={x} className={species === x ? s.modeOn : ''} aria-pressed={species === x} onClick={() => setSpecies(x)}>{x}</button>)}</div><label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, raça ou tutor" aria-label="Filtrar pets" /></label><button className={s.primarySm} onClick={() => ctx.setModal({ kind: 'client' })}><Plus size={15} />Novo pet</button></div></div>
    <div className={s.petGrid}>{list.map(p => { const v = p.vaccines.filter(x => x.next >= ctx.today).sort((a, b) => a.next.localeCompare(b.next))[0], overdue = p.vaccines.some(x => x.next < ctx.today); return <button key={p.id} className={s.petCard} onClick={() => ctx.openPet(p.id)}>
      <PetAvatar p={p} size={64} /><b>{p.name}</b><small>{p.breed} · {p.weight} kg</small><small>Tutor: {ctx.tutor(p.tutorId)?.name}</small>
      {overdue ? <Pill tone="redPill">Vacina vencida</Pill> : v && v.next <= addDays(ctx.today, 30) ? <Pill tone="amber">Vacina em {dateLabel(v.next).slice(0, 5)}</Pill> : <Pill tone="green">Vacinas em dia</Pill>}
    </button>; })}</div>
  </section>;
}

function ServicesView({ ctx }: { ctx: Ctx }) {
  const prefix = ctx.today.slice(0, 7);
  return <Table title="Serviços" action={['Novo serviço', () => ctx.setModal({ kind: 'service' })]} head={['Serviço', 'Categoria', 'Duração', 'Preço', 'No mês', 'Receita no mês']} numeric={[5]} rows={ctx.store.services.map(sv => {
    const month = ctx.store.appointments.filter(a => a.serviceId === sv.id && a.date.startsWith(prefix) && a.status === 'Concluído');
    const Icon = categoryIcon[sv.category];
    return { key: sv.id, cells: [<b key="n">{sv.name}</b>, <em key="c" className={`${s.tag} ${s[categoryTone[sv.category]]}`}><Icon size={12} />{sv.category}</em>, sv.minutes ? `${sv.minutes} min` : '—',
      <span key="p" className={s.priceEdit}>R$ <input defaultValue={sv.price.toFixed(2).replace('.', ',')} inputMode="decimal" aria-label={`Preço de ${sv.name}`} onBlur={e => { const v = num(e.target.value); if (v && v !== sv.price) ctx.set(st => ({ services: st.services.map(x => x.id === sv.id ? { ...x, price: v } : x) }), `Preço de ${sv.name} atualizado para ${brl(v)}.`); }} /></span>,
      month.length, brl(month.reduce((v, a) => v + a.price, 0))] };
  })} />;
}

function StockView({ ctx }: { ctx: Ctx }) {
  const adjust = (id: string, d: number) => ctx.set(st => ({ products: st.products.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + d) } : p) }));
  return <Table title="Estoque" action={['Novo produto', () => ctx.setModal({ kind: 'product' })]} head={['Produto', 'Preço', 'Em estoque', 'Mínimo', 'Situação', 'Valor em estoque']} numeric={[5]} rows={ctx.store.products.map(p => ({ key: p.id, cells: [
    <span key="n" className={s.cell}><span className={s.prodIcon}><ProductArt icon={p.icon} /></span><span className={s.stackText}><b>{p.name}</b><small>{p.detail}</small></span></span>, brl(p.price),
    <span key="q" className={s.stepperQty}><button onClick={() => adjust(p.id, -1)} aria-label={`Diminuir ${p.name}`}><Minus size={14} /></button><b>{p.stock}</b><button onClick={() => adjust(p.id, 1)} aria-label={`Aumentar ${p.name}`}><Plus size={14} /></button></span>,
    <input key="m" className={s.smallInput} defaultValue={p.minimum} inputMode="numeric" aria-label={`Mínimo de ${p.name}`} onBlur={e => { const v = Number(e.target.value.replace(/\D/g, '')); if (v !== p.minimum) ctx.set(st => ({ products: st.products.map(x => x.id === p.id ? { ...x, minimum: v } : x) }), 'Estoque mínimo atualizado.'); }} />,
    p.stock === 0 ? <Pill key="s" tone="redPill">Sem estoque</Pill> : p.stock <= p.minimum ? <Pill key="s" tone="amber">Repor</Pill> : <Pill key="s" tone="green">Ok</Pill>, brl(p.stock * p.price)] }))} />;
}

function SalesView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const [cart, setCart] = useState<Record<string, number>>({});
  const [tutorId, setTutorId] = useState('');
  const items = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ p: store.products.find(x => x.id === id)!, q })).filter(x => x.p);
  const total = items.reduce((v, i) => v + i.q * i.p.price, 0);
  const add = (p: Product, d: number) => setCart(c => ({ ...c, [p.id]: Math.max(0, Math.min(p.stock, (c[p.id] ?? 0) + d)) }));
  function finish() {
    if (!items.length) return;
    ctx.set(st => ({ sales: [...st.sales, { id: uid(), date: new Date().toISOString(), tutorId, items: items.map(i => ({ productId: i.p.id, quantity: i.q, price: i.p.price })) }], products: st.products.map(p => cart[p.id] ? { ...p, stock: p.stock - cart[p.id] } : p) }), `Venda de ${brl(total)} registrada.`);
    setCart({}); setTutorId('');
  }
  const recent = [...store.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  return <div className={s.salesGrid}>
    <section className={s.card}><div className={s.cardHead}><h2>Nova venda</h2></div>
      <div className={s.productGrid}>{store.products.map(p => <button key={p.id} className={s.productBtn} onClick={() => add(p, 1)} disabled={p.stock <= (cart[p.id] ?? 0)}><span className={s.prodIcon}><ProductArt icon={p.icon} /></span><b>{p.name}</b><small>{p.detail} · {brl(p.price)}</small><small className={p.stock <= p.minimum ? s.redText : s.muted}>{p.stock} em estoque</small>{cart[p.id] ? <em>{cart[p.id]}</em> : null}</button>)}</div>
    </section>
    <section className={s.card}><div className={s.cardHead}><h2>Carrinho</h2></div>
      <ul className={s.rows}>{items.map(({ p, q }) => <li key={p.id}><span className={s.stackText}><b>{p.name}</b><small>{brl(p.price)} cada</small></span><span className={s.stepperQty}><button onClick={() => add(p, -1)} aria-label={`Remover um ${p.name}`}><Minus size={14} /></button><b>{q}</b><button onClick={() => add(p, 1)} aria-label={`Adicionar um ${p.name}`}><Plus size={14} /></button></span><b>{brl(p.price * q)}</b></li>)}{!items.length && <li className={s.empty}>Toque nos produtos para adicionar.</li>}</ul>
      <label className={s.field}><span>Cliente</span><select value={tutorId} onChange={e => setTutorId(e.target.value)}><option value="">Cliente avulso</option>{store.tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <div className={s.cartTotal}><span>Total</span><b>{brl(total)}</b></div>
      <button className={s.primary} onClick={finish} disabled={!items.length}><Check size={17} />Finalizar venda</button>
    </section>
    <div className={s.salesList}><Table title="Últimas vendas" head={['Data', 'Cliente', 'Itens', 'Total']} numeric={[3]} rows={recent.map(x => ({ key: x.id, cells: [new Date(x.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), ctx.tutor(x.tutorId)?.name ?? 'Cliente avulso', x.items.map(i => `${i.quantity}× ${store.products.find(p => p.id === i.productId)?.name ?? 'Produto removido'}`).join(', '), brl(saleTotal(x))] }))} /></div>
  </div>;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const rows = days.map(d => { const svc = store.appointments.filter(a => a.date === d && a.status === 'Concluído'); const products = store.sales.filter(x => dayKey(x.date) === d).reduce((v, x) => v + saleTotal(x), 0); return { d, count: svc.length, services: svc.reduce((v, a) => v + a.price, 0), products }; });
  const services = rows.reduce((v, r) => v + r.services, 0), products = rows.reduce((v, r) => v + r.products, 0), count = rows.reduce((v, r) => v + r.count, 0);
  const peak = Math.max(...rows.map(r => r.services + r.products), 1);
  return <div className={s.stack}>
    <div className={s.stats}><span>Faturamento (30 dias)<b>{brl(services + products)}</b></span><span>Serviços<b>{brl(services)}</b></span><span>Produtos<b>{brl(products)}</b></span><span>Ticket médio por atendimento<b>{brl(count ? services / count : 0)}</b></span></div>
    <section className={s.card}><div className={s.cardHead}><h2>Faturamento diário</h2><div className={s.rowBtns}><span className={s.legendInline}><i className={s.lServices} />Serviços<i className={s.lProducts} />Produtos</span><button className={s.chipBtn} onClick={() => download('pata-financeiro.csv', csv([['Data', 'Atendimentos', 'Serviços', 'Produtos', 'Total'], ...rows.map(r => [dateLabel(r.d), r.count, r.services.toFixed(2), r.products.toFixed(2), (r.services + r.products).toFixed(2)])]), 'text/csv')}><Download size={14} />CSV</button></div></div>
      <div className={s.daily}>{rows.map(r => <div key={r.d} title={`${dateLabel(r.d)}: ${brl(r.services + r.products)}`}><span><i className={s.lProducts} style={{ height: `${r.products / peak * 100}%` }} /><i className={s.lServices} style={{ height: `${r.services / peak * 100}%` }} /></span><small>{r.d.slice(8)}</small></div>)}</div>
    </section>
    <Table title="Resumo por dia" head={['Data', 'Atendimentos', 'Serviços', 'Produtos', 'Total']} numeric={[2, 3, 4]} rows={[...rows].reverse().map(r => ({ key: r.d, cells: [`${weekday(r.d)}, ${dateLabel(r.d)}`, r.count, brl(r.services), brl(r.products), <b key="t">{brl(r.services + r.products)}</b>] }))} />
  </div>;
}

function MarketingView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const copy = (text: string) => { navigator.clipboard?.writeText(text).then(() => ctx.setToast('Mensagem copiada.'), () => ctx.setToast('Não foi possível copiar.')); };
  const due = store.pets.flatMap(p => p.vaccines.filter(v => v.next <= addDays(today, 30)).map(v => ({ p, v }))).sort((a, b) => a.v.next.localeCompare(b.v.next));
  const lastVisit = (tutorId: string) => { const ids = new Set(store.pets.filter(p => p.tutorId === tutorId).map(p => p.id)); return store.appointments.filter(a => ids.has(a.petId) && a.date <= today).map(a => a.date).sort().pop(); };
  const inactive = store.tutors.map(t => ({ t, last: lastVisit(t.id) })).filter(x => !x.last || x.last < addDays(today, -store.settings.staleDays));
  const month = today.slice(5, 7), birthdays = store.pets.filter(p => p.birth.slice(5, 7) === month);
  const biz = store.settings.business;
  return <div className={s.marketing}>
    <Table title="Vacinas a vencer (30 dias)" head={['Pet', 'Tutor', 'Vacina', 'Vencimento', '']} rows={due.map(({ p, v }) => { const t = ctx.tutor(p.tutorId); return { key: v.id, cells: [<span key="p" className={s.cell}><PetAvatar p={p} size={30} /><b>{p.name}</b></span>, t?.name, v.name, v.next < today ? <Pill key="d" tone="redPill">{dateLabel(v.next)}</Pill> : dateLabel(v.next), <button key="b" className={s.chipBtn} onClick={() => copy(`Olá, ${t?.name.split(' ')[0]}! A vacina ${v.name} do ${p.name} vence em ${dateLabel(v.next)}. Quer agendar a aplicação aqui na ${biz}? 🐾`)}><Copy size={13} />Copiar lembrete</button>] }; })} />
    <Table title={`Clientes sem visita há ${store.settings.staleDays}+ dias`} head={['Cliente', 'Telefone', 'Última visita', '']} rows={inactive.map(({ t, last }) => ({ key: t.id, cells: [<span key="n" className={s.cell}><Person name={t.name} size={30} /><b>{t.name}</b></span>, t.phone, last ? dateLabel(last) : 'Nunca', <button key="b" className={s.chipBtn} onClick={() => copy(`Olá, ${t.name.split(' ')[0]}! Estamos com saudade de vocês aqui na ${biz}. Que tal agendar um banho esta semana? 🐶`)}><Copy size={13} />Copiar convite</button>] }))} />
    <Table title="Aniversariantes do mês" head={['Pet', 'Tutor', 'Aniversário', '']} rows={birthdays.map(p => { const t = ctx.tutor(p.tutorId); return { key: p.id, cells: [<span key="p" className={s.cell}><PetAvatar p={p} size={30} /><b>{p.name}</b></span>, t?.name, dateLabel(p.birth).slice(0, 5), <button key="b" className={s.chipBtn} onClick={() => copy(`Parabéns ao ${p.name}! 🎂 A ${biz} preparou um mimo especial para o aniversariante. Passe aqui para buscar!`)}><Copy size={13} />Copiar parabéns</button>] }; })} />
  </div>;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const exportAppointments = () => download('pata-atendimentos.csv', csv([['Data', 'Horário', 'Pet', 'Tutor', 'Serviço', 'Profissional', 'Status', 'Valor'], ...[...store.appointments].sort((a, b) => b.date.localeCompare(a.date)).map(a => { const p = ctx.pet(a.petId); return [dateLabel(a.date), a.time, p?.name ?? '', ctx.tutor(p?.tutorId ?? '')?.name ?? '', ctx.service(a.serviceId)?.name ?? '', staff.find(x => x.id === a.staffId)?.name ?? '', a.status, a.price.toFixed(2)]; })]), 'text/csv');
  const exportSales = () => download('pata-vendas.csv', csv([['Data', 'Cliente', 'Produto', 'Quantidade', 'Preço', 'Total'], ...store.sales.flatMap(x => x.items.map(i => [new Date(x.date).toLocaleString('pt-BR'), ctx.tutor(x.tutorId)?.name ?? 'Cliente avulso', store.products.find(p => p.id === i.productId)?.name ?? '', i.quantity, i.price.toFixed(2), (i.quantity * i.price).toFixed(2)]))]), 'text/csv');
  const byStaff = staff.map(x => { const list = store.appointments.filter(a => a.staffId === x.id && a.status === 'Concluído' && a.date > addDays(ctx.today, -30)); return { x, count: list.length, value: list.reduce((v, a) => v + a.price, 0) }; });
  return <div className={s.stack}>
    <section className={s.card}><div className={s.cardHead}><h2>Exportações</h2></div><div className={s.rowBtns}>
      <button className={s.secondary} onClick={exportAppointments}><Download size={15} />Atendimentos (CSV)</button>
      <button className={s.secondary} onClick={exportSales}><Download size={15} />Vendas (CSV)</button>
      <button className={s.secondary} onClick={() => download('pata-backup.json', JSON.stringify(store, null, 2), 'application/json')}><Download size={15} />Backup completo (JSON)</button>
      <button className={s.secondary} onClick={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) ctx.set(() => makeSeed(), 'Dados de exemplo restaurados.'); }}><RotateCcw size={15} />Restaurar dados de exemplo</button>
    </div></section>
    <Table title="Produção por profissional (30 dias)" head={['Profissional', 'Função', 'Atendimentos', 'Valor']} numeric={[3]} rows={byStaff.map(({ x, count, value }) => ({ key: x.id, cells: [<span key="n" className={s.cell}><Person name={x.name} size={30} /><b>{x.name}</b></span>, x.role, count, brl(value)] }))} />
  </div>;
}

function SettingsView({ ctx }: { ctx: Ctx }) {
  const [form, setForm] = useState({ ...ctx.store.settings, staleDays: String(ctx.store.settings.staleDays) });
  return <section className={`${s.card} ${s.narrow}`}><div className={s.cardHead}><h2>Configurações do pet shop</h2></div>
    <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(() => ({ settings: { ...form, staleDays: Number(form.staleDays) || 60 } }), 'Configurações salvas.'); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome do pet shop</span><input required value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} /></label>
      <label className={`${s.field} ${s.wide}`}><span>Responsável</span><input required value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
      <label className={s.field}><span>Abre às</span><input type="time" value={form.opens} onChange={e => setForm({ ...form, opens: e.target.value })} /></label>
      <label className={s.field}><span>Fecha às</span><input type="time" value={form.closes} onChange={e => setForm({ ...form, closes: e.target.value })} /></label>
      <label className={`${s.field} ${s.wide}`}><span>Considerar cliente inativo após (dias)</span><input inputMode="numeric" value={form.staleDays} onChange={e => setForm({ ...form, staleDays: e.target.value.replace(/\D/g, '') })} /></label>
      <div className={s.wide}><button className={s.primary} type="submit">Salvar configurações</button></div>
    </form>
  </section>;
}
