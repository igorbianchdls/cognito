'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, BedDouble, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Cloud, CloudRain, CloudSun, Download, LogIn, LogOut, Plus, RotateCcw, Search, Sparkles, Trash2, Users, Wrench, X, type LucideIcon } from 'lucide-react';
import { active, addDays, brl, channels, conditions, covers, dateLabel, dayKey, extrasOf, initials, makeSeed, nightRevenue, nightsOf, occupancy, roomAvailable, shortDate, storageKey, totalOf, uid, type Channel, type Guest, type Housekeeping, type Reservation, type Room, type Status, type Store } from './data';
import s from './HotelApp.module.css';

type View = 'Visão Geral' | 'Reservas' | 'Hóspedes' | 'Quartos' | 'Financeiro' | 'Relatórios';
type Modal = { kind: 'reservation'; id?: string; preset?: Partial<Reservation> } | { kind: 'guest'; id?: string } | { kind: 'type'; id: string } | { kind: 'room'; id: string } | null;
const views: View[] = ['Visão Geral', 'Reservas', 'Hóspedes', 'Quartos', 'Financeiro', 'Relatórios'];
const statusTone: Record<Status, string> = { Confirmada: s.tBlue, Hospedado: s.tGreen, Finalizada: s.tGray, Cancelada: s.tRed };
const weatherIcon: Record<string, LucideIcon> = { 'Parcialmente nublado': CloudSun, Nublado: Cloud, Chuva: CloudRain };
/** Room photos by room type id; types without a photo show an illustrated placeholder. */
const roomPhotos: Record<string, string | undefined> = {};
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const pct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const longDate = (key: string) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '').replace(/^./, c => c.toUpperCase());

export default function HotelApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Visão Geral');
  const [modal, setModal] = useState<Modal>(null);
  const [drawer, setDrawer] = useState<{ kind: 'reservation' | 'guest'; id: string } | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    let saved: Store | null = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) saved = JSON.parse(raw); } catch { /* falls back to the demo data */ }
    // Clock and storage are read only after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(saved?.reservations ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  if (!store) return <div className={s.app}><div className={s.loading}><Logo /></div></div>;

  const today = dayKey(now);
  const set = (fn: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...fn(prev) }); if (message) setToast(message); };
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const updateReservation = (id: string, change: Partial<Reservation>, message?: string) => set(st => ({ reservations: st.reservations.map(r => r.id === id ? { ...r, ...change } : r) }), message);
  function checkIn(r: Reservation) {
    if (r.checkIn > today) { setToast('O check-in só pode ser feito a partir da data de chegada.'); return; }
    updateReservation(r.id, { status: 'Hospedado' }, `Check-in de ${guestName(r.guestId)} no quarto ${roomNumber(r.roomId)}.`);
  }
  function checkOut(r: Reservation) {
    // An early departure frees the remaining nights of the room.
    const early = r.checkOut > today;
    set(st => ({ reservations: st.reservations.map(x => x.id === r.id ? { ...x, status: 'Finalizada', checkOut: early ? (today > x.checkIn ? today : addDays(x.checkIn, 1)) : x.checkOut } : x), rooms: st.rooms.map(room => room.id === r.roomId ? { ...room, housekeeping: 'Sujo' } : room) }), `Check-out de ${guestName(r.guestId)}. Quarto ${roomNumber(r.roomId)} aguardando limpeza.`);
  }
  const cancel = (r: Reservation) => { if (confirm(`Cancelar a reserva ${r.code} de ${guestName(r.guestId)}?`)) updateReservation(r.id, { status: 'Cancelada' }, `Reserva ${r.code} cancelada.`); };
  const setHousekeeping = (id: string, housekeeping: Housekeeping) => set(st => ({ rooms: st.rooms.map(r => r.id === id ? { ...r, housekeeping } : r) }), `Quarto ${roomNumber(id)}: ${housekeeping.toLowerCase()}.`);
  const guestName = (id: string) => store.guests.find(g => g.id === id)?.name ?? 'Hóspede';
  const roomNumber = (id: string) => store.rooms.find(r => r.id === id)?.number ?? '—';
  const ctx: Ctx = { store, now, today, set, go, setModal, openReservation: id => setDrawer({ kind: 'reservation', id }), openGuest: id => setDrawer({ kind: 'guest', id }), checkIn, checkOut, cancel, setHousekeeping, guestName, roomNumber, setToast, updateReservation };
  const currentReservation = drawer?.kind === 'reservation' ? store.reservations.find(r => r.id === drawer.id) : undefined;
  const currentGuest = drawer?.kind === 'guest' ? store.guests.find(g => g.id === drawer.id) : undefined;
  const overview = view === 'Visão Geral';

  return <div className={`${s.app} ${overview ? s.photoMode : s.dataMode}`}>
    {overview && <div className={s.backdrop} aria-hidden="true" />}
    <TopBar ctx={ctx} view={view} />
    <main className={s.main}>
      {overview && <Overview ctx={ctx} />}
      {view === 'Reservas' && <ReservationsView ctx={ctx} />}
      {view === 'Hóspedes' && <GuestsView ctx={ctx} />}
      {view === 'Quartos' && <RoomsView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
    </main>
    {modal?.kind === 'reservation' && <ReservationForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} preset={modal.preset} onClose={() => setModal(null)} />}
    {modal?.kind === 'guest' && <GuestForm key={modal.id ?? 'new'} ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'type' && <TypeModal ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {modal?.kind === 'room' && <RoomModal ctx={ctx} id={modal.id} onClose={() => setModal(null)} />}
    {currentReservation && <ReservationDrawer key={currentReservation.id} ctx={ctx} r={currentReservation} onClose={() => setDrawer(null)} />}
    {currentGuest && <GuestDrawer key={currentGuest.id} ctx={ctx} g={currentGuest} onClose={() => setDrawer(null)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; now: number; today: string; set: (fn: (st: Store) => Partial<Store>, message?: string) => void; go: (v: View) => void; setModal: (m: Modal) => void; openReservation: (id: string) => void; openGuest: (id: string) => void; checkIn: (r: Reservation) => void; checkOut: (r: Reservation) => void; cancel: (r: Reservation) => void; setHousekeeping: (id: string, h: Housekeeping) => void; guestName: (id: string) => string; roomNumber: (id: string) => string; setToast: (t: string) => void; updateReservation: (id: string, change: Partial<Reservation>, message?: string) => void };

function Logo() {
  return <svg viewBox="0 0 40 40" className={s.logoMark} aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 14 C10 8 15 8 20 13 S30 18 35 12" /><path d="M5 22 C10 16 15 16 20 21 S30 26 35 20" /><path d="M5 30 C10 24 15 24 20 29 S30 34 35 28" /></g></svg>;
}
function SunArt() {
  return <svg viewBox="0 0 80 80" className={s.sunArt} aria-hidden="true">
    <defs><radialGradient id="lumen-sun" cx=".38" cy=".35" r=".7"><stop offset="0" stopColor="#fff6c2" /><stop offset=".45" stopColor="#ffd34d" /><stop offset="1" stopColor="#f5a614" /></radialGradient></defs>
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x="37" y="3" width="6" height="13" rx="3" fill="#ffc933" transform={`rotate(${i * 45} 40 40)`} />)}
    <circle cx="40" cy="40" r="19" fill="url(#lumen-sun)" />
  </svg>;
}
function Pill({ tone, children }: { tone: string; children: ReactNode }) { return <em className={`${s.pill} ${tone}`}>{children}</em>; }
function Avatar({ name, size = 30 }: { name: string; size?: number }) { return <span className={s.avatar} style={{ width: size, height: size, fontSize: size * .38 }}>{initials(name)}</span>; }
function RoomPhoto({ typeId, name, className }: { typeId: string; name: string; className?: string }) {
  const src = roomPhotos[typeId];
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={`Quarto ${name}`} className={`${s.roomPhoto} ${className ?? ''}`} loading="lazy" /> : <span className={`${s.roomPhoto} ${s.roomPlaceholder} ${s[`ph_${typeId}`] ?? ''} ${className ?? ''}`} role="img" aria-label={`Quarto ${name}`}><BedDouble size={30} strokeWidth={1.4} /></span>;
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
    ...store.reservations.filter(r => has(q, r.code, ctx.guestName(r.guestId), ctx.roomNumber(r.roomId))).sort((a, b) => b.checkIn.localeCompare(a.checkIn)).slice(0, 5).map(r => ({ key: r.id, label: `${r.code} · ${ctx.guestName(r.guestId)}`, meta: `Quarto ${ctx.roomNumber(r.roomId)} · ${shortDate(r.checkIn)} → ${shortDate(r.checkOut)} · ${r.status}`, run: () => ctx.openReservation(r.id) })),
    ...store.guests.filter(g => has(q, g.name, g.email, g.phone)).slice(0, 4).map(g => ({ key: g.id, label: g.name, meta: `Hóspede · ${g.city}`, run: () => ctx.openGuest(g.id) })),
    ...store.rooms.filter(r => r.number === q).map(r => ({ key: r.id, label: `Quarto ${r.number}`, meta: store.types.find(t => t.id === r.typeId)?.name ?? '', run: () => ctx.setModal({ kind: 'room', id: r.id }) })),
  ] : [];
  const pendingIn = store.reservations.filter(r => r.checkIn === today && r.status === 'Confirmada');
  const pendingOut = store.reservations.filter(r => r.checkOut === today && r.status === 'Hospedado');
  const dirty = store.rooms.filter(r => r.housekeeping === 'Sujo');
  const alerts = [
    ...(pendingIn.length ? [{ key: 'in', text: `${pendingIn.length} chegadas aguardando check-in hoje`, run: () => ctx.go('Visão Geral') }] : []),
    ...(pendingOut.length ? [{ key: 'out', text: `${pendingOut.length} saídas previstas para hoje`, run: () => ctx.go('Visão Geral') }] : []),
    ...(dirty.length ? [{ key: 'dirty', text: `${dirty.length} quartos aguardando limpeza`, run: () => ctx.go('Quartos') }] : []),
    ...store.rooms.filter(r => r.housekeeping === 'Manutenção').map(r => ({ key: r.id, text: `Quarto ${r.number} em manutenção`, run: () => ctx.setModal({ kind: 'room', id: r.id }) })),
  ];
  return <header className={s.topbar} ref={ref}>
    <button className={s.brand} onClick={() => ctx.go('Visão Geral')} aria-label="Lumen Hotel, ir para a visão geral"><Logo /><span>Lumen<small>HOTEL</small></span></button>
    <nav className={s.tabs} aria-label="Seções">{views.map(v => <button key={v} className={view === v ? s.tabOn : ''} aria-current={view === v ? 'page' : undefined} onClick={() => ctx.go(v)}>{v}</button>)}</nav>
    <div className={s.tools}>
      <div className={s.search}>
        <Search size={18} />
        <input value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar reservas, hóspedes..." aria-label="Buscar reservas, hóspedes ou quartos" />
        {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.iconCircle} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={20} />{alerts.length > 0 && <i className={s.dot} />}</button>
        {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Tudo em ordem por aqui.</p>}</div>}
      </div>
      <div className={s.rel}>
        <button className={s.user} onClick={() => setPanel(panel === 'user' ? null : 'user')} aria-label="Menu do usuário" aria-expanded={panel === 'user'}><Avatar name={`${store.settings.owner} Lumen`} size={42} /><ChevronDown size={16} /></button>
        {panel === 'user' && <div className={`${s.popover} ${s.menuPop}`} role="menu"><p className={s.popTitle}>{store.settings.owner}<small>{store.settings.hotel}</small></p><button role="menuitem" onClick={() => { ctx.go('Relatórios'); setPanel(null); }}>Configurações</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'guest' }); setPanel(null); }}>Novo hóspede</button><button role="menuitem" onClick={() => { ctx.setModal({ kind: 'reservation' }); setPanel(null); }}>Nova reserva</button></div>}
      </div>
    </div>
  </header>;
}

function Overview({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [editingWeather, setEditingWeather] = useState(false);
  const arrivals = store.reservations.filter(r => r.checkIn === today && active(r)).sort((a, b) => a.status.localeCompare(b.status));
  const departures = store.reservations.filter(r => r.checkOut === today && active(r)).sort((a, b) => b.status.localeCompare(a.status));
  const dirty = store.rooms.filter(r => r.housekeeping !== 'Limpo');
  const WeatherIcon = weatherIcon[store.settings.condition];
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  return <>
    <section className={s.hero}>
      <div className={s.heroText}>
        <p className={s.welcome}>Bem-vindo de volta, {store.settings.owner}!</p>
        <h1>Seu hotel,<br /><span>sempre no controle.</span></h1>
        <p className={s.lead}>Acompanhe reservas, hóspedes, quartos<br />e toda a operação em tempo real.</p>
        <button className={s.cta} onClick={() => ctx.setModal({ kind: 'reservation' })}><Plus size={20} />Nova reserva</button>
      </div>
      <aside className={`${s.glass} ${s.today}`} aria-label="Hoje no hotel">
        <header><h2>Hoje no hotel</h2><time>{longDate(today)}</time></header>
        <button className={s.weather} onClick={() => setEditingWeather(!editingWeather)} aria-expanded={editingWeather} title="Ajustar clima exibido">{WeatherIcon ? <WeatherIcon size={64} className={s.weatherIcon} strokeWidth={1.6} /> : <SunArt />}<span><b>{store.settings.temperature}°C</b><small>{store.settings.condition}</small></span></button>
        {editingWeather && <div className={s.weatherEdit}>
          <label>Temperatura<input type="number" value={store.settings.temperature} onChange={e => ctx.set(st => ({ settings: { ...st.settings, temperature: Number(e.target.value) } }))} /></label>
          <label>Condição<select value={store.settings.condition} onChange={e => ctx.set(st => ({ settings: { ...st.settings, condition: e.target.value } }))}>{conditions.map(c => <option key={c}>{c}</option>)}</select></label>
          <small>Valor de demonstração, sem serviço de previsão do tempo.</small>
        </div>}
        <dl><div><dt>Ocupação hoje</dt><dd>{pct(occupancy(store, today))}</dd></div><div><dt>Check-ins</dt><dd>{arrivals.length}</dd></div><div><dt>Check-outs</dt><dd>{departures.length}</dd></div></dl>
      </aside>
      <ManagementKpis ctx={ctx} />
    </section>

    <section className={s.operation} aria-label="Operação de hoje">
      <div className={`${s.glass} ${s.opCard}`}>
        <header><h2><LogIn size={18} />Chegadas de hoje</h2><span>{arrivals.filter(r => r.status === 'Hospedado').length}/{arrivals.length}</span></header>
        <ul>{arrivals.map(r => <li key={r.id}><button className={s.opRow} onClick={() => ctx.openReservation(r.id)}><Avatar name={ctx.guestName(r.guestId)} /><span><b>{ctx.guestName(r.guestId)}</b><small>Quarto {ctx.roomNumber(r.roomId)} · {nightsOf(r)} noites · {r.adults + r.children} hósp.</small></span></button>{r.status === 'Confirmada' ? <button className={s.opAction} onClick={() => ctx.checkIn(r)}>Check-in</button> : <Pill tone={statusTone[r.status]}>{r.status}</Pill>}</li>)}{!arrivals.length && <li className={s.empty}>Nenhuma chegada hoje.</li>}</ul>
      </div>
      <div className={`${s.glass} ${s.opCard}`}>
        <header><h2><LogOut size={18} />Saídas de hoje</h2><span>{departures.filter(r => r.status === 'Finalizada').length}/{departures.length}</span></header>
        <ul>{departures.map(r => <li key={r.id}><button className={s.opRow} onClick={() => ctx.openReservation(r.id)}><Avatar name={ctx.guestName(r.guestId)} /><span><b>{ctx.guestName(r.guestId)}</b><small>Quarto {ctx.roomNumber(r.roomId)} · {brl(totalOf(r))}</small></span></button>{r.status === 'Hospedado' ? <button className={s.opAction} onClick={() => ctx.checkOut(r)}>Check-out</button> : <Pill tone={statusTone[r.status]}>{r.status}</Pill>}</li>)}{!departures.length && <li className={s.empty}>Nenhuma saída hoje.</li>}</ul>
      </div>
      <div className={`${s.glass} ${s.opCard}`}>
        <header><h2><Sparkles size={18} />Governança</h2><span>{dirty.length}</span></header>
        <ul>{dirty.map(r => <li key={r.id}><button className={s.opRow} onClick={() => ctx.setModal({ kind: 'room', id: r.id })}><span className={s.roomBadge}>{r.number}</span><span><b>{store.types.find(t => t.id === r.typeId)?.name}</b><small>{r.housekeeping === 'Sujo' ? 'Aguardando limpeza' : 'Em manutenção'}</small></span></button>{r.housekeeping === 'Sujo' ? <button className={s.opAction} onClick={() => ctx.setHousekeeping(r.id, 'Limpo')}>Marcar limpo</button> : <Pill tone={s.tAmber}><Wrench size={12} />Manutenção</Pill>}</li>)}{!dirty.length && <li className={s.empty}>Todos os quartos limpos.</li>}</ul>
      </div>
      <div className={`${s.glass} ${s.forecast}`}>
        <header><h2><CalendarDays size={18} />Ocupação nos próximos 14 dias</h2></header>
        <div className={s.bars}>{days.map(d => { const o = occupancy(store, d); return <div key={d} title={`${dateLabel(d)}: ${pct(o)}`}><span><i style={{ height: `${o}%` }} className={o >= 85 ? s.barHigh : ''} /></span><b>{pct(o)}</b><small>{shortDate(d)}</small></div>; })}</div>
      </div>
    </section>
  </>;
}

/** Room and extras revenue, room-nights sold and available room-nights between two days (inclusive). */
function period(store: Store, from: string, to: string) {
  let rooms = 0, extras = 0, sold = 0, days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    rooms += nightRevenue(store, d);
    sold += new Set(store.reservations.filter(r => covers(r, d)).map(r => r.roomId)).size;
    extras += store.reservations.filter(active).flatMap(r => r.extras).filter(e => e.date === d).reduce((v, e) => v + e.value, 0);
    days++;
  }
  return { revenue: rooms + extras, rooms, sold, available: store.rooms.length * days };
}

function ManagementKpis({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const monthStart = `${today.slice(0, 8)}01`;
  const prevStart = addDays(monthStart, -1).slice(0, 8) + '01', prevEnd = (() => { const d = addDays(prevStart, Number(today.slice(8)) - 1); return d.slice(0, 7) === prevStart.slice(0, 7) ? d : addDays(monthStart, -1); })();
  const now = period(store, monthStart, today), before = period(store, prevStart, prevEnd);
  const adr = now.sold ? now.rooms / now.sold : 0, adrBefore = before.sold ? before.rooms / before.sold : 0;
  const revpar = now.rooms / now.available, revparBefore = before.rooms / Math.max(1, before.available);
  const change = (a: number, b: number) => b ? (a - b) / b * 100 : 0;
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29)).map(d => nightRevenue(store, d));
  const next7 = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1)).map(d => ({ d, o: occupancy(store, d) }));
  const avg7 = next7.reduce((v, x) => v + x.o, 0) / 7, weak = next7.filter(x => x.o < 60);
  const kpis: { label: string; value: string; delta?: number; note?: ReactNode; chart: number[]; max?: number; go: View; hint: string }[] = [
    { label: 'Receita do mês', value: brl(now.revenue, 0), delta: change(now.revenue, before.revenue), chart: last30, go: 'Financeiro', hint: 'Diárias e extras até hoje' },
    { label: 'Diária média (ADR)', value: brl(adr, 0), delta: change(adr, adrBefore), chart: last30.map((v, i) => v / Math.max(1, new Set(ctx.store.reservations.filter(r => covers(r, addDays(today, i - 29))).map(r => r.roomId)).size)), go: 'Financeiro', hint: 'Receita por quarto vendido' },
    { label: 'RevPAR', value: brl(revpar, 0), delta: change(revpar, revparBefore), chart: last30.map(v => v / store.rooms.length), go: 'Financeiro', hint: 'Receita por quarto disponível' },
    { label: 'Ocupação 7 dias', value: pct(avg7), note: weak.length ? <span className={s.kpiWarn}>{weak.length} {weak.length === 1 ? 'noite' : 'noites'} abaixo de 60%</span> : <span className={s.kpiOk}>Todas as noites acima de 60%</span>, chart: next7.map(x => x.o), max: 100, go: 'Reservas', hint: 'Média prevista das próximas 7 noites' },
  ];
  return <section className={`${s.glass} ${s.types}`} aria-label="Indicadores de gestão">
    <header><h2>Indicadores do mês</h2><button onClick={() => ctx.go('Financeiro')}>Ver financeiro <ArrowRight size={16} /></button></header>
    <div className={s.typeGrid}>{kpis.map(k => { const peak = k.max ?? Math.max(...k.chart, 1); return <button key={k.label} className={s.kpiCard} onClick={() => ctx.go(k.go)} title={k.hint}>
      <span className={s.kpiLabel}>{k.label}</span>
      <b className={s.kpiValue}>{k.value}</b>
      {k.delta !== undefined ? <span className={k.delta >= 0 ? s.kpiUp : s.kpiDown}>{k.delta >= 0 ? '↑' : '↓'} {Math.abs(k.delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% <small>vs. mesmo período do mês passado</small></span> : k.note}
      <span className={s.spark} aria-hidden="true">{k.chart.map((v, i) => <i key={i} style={{ height: `${Math.max(6, v / peak * 100)}%` }} />)}</span>
      <i className={s.arrow}><ArrowRight size={20} /></i>
    </button>; })}</div>
  </section>;
}

function PageHead({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <div className={s.pageHead}><div><h1>{title}</h1><p>{subtitle}</p></div><div className={s.headActions}>{children}</div></div>;
}
function Stats({ items }: { items: [string, ReactNode, string?][] }) {
  return <div className={s.stats}>{items.map(([label, value, hint]) => <div key={label}><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</div>)}</div>;
}

function ReservationsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [mode, setMode] = useState<'Lista' | 'Mapa'>('Lista');
  const [status, setStatus] = useState<Status | 'Todas' | 'Ativas'>('Ativas');
  const [channel, setChannel] = useState<Channel | ''>('');
  const [q, setQ] = useState('');
  const list = store.reservations.filter(r => (status === 'Todas' || (status === 'Ativas' ? ['Confirmada', 'Hospedado'].includes(r.status) : r.status === status)) && (!channel || r.channel === channel) && has(q, r.code, ctx.guestName(r.guestId), ctx.roomNumber(r.roomId))).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const week = store.reservations.filter(r => active(r) && r.checkIn >= today && r.checkIn < addDays(today, 7)).length;
  const month = today.slice(0, 7), cancelled = store.reservations.filter(r => r.status === 'Cancelada' && r.checkIn.startsWith(month)).length;
  return <div className={s.page}>
    <PageHead title="Reservas" subtitle="Acompanhe chegadas, estadias e cancelamentos."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'reservation' })}><Plus size={17} />Nova reserva</button></PageHead>
    <Stats items={[['Hospedados agora', store.reservations.filter(r => r.status === 'Hospedado').length], ['Chegadas em 7 dias', week], ['Confirmadas futuras', store.reservations.filter(r => r.status === 'Confirmada' && r.checkIn > today).length], ['Canceladas no mês', cancelled]]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{(['Lista', 'Mapa'] as const).map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? s.segOn : ''} onClick={() => setMode(m)}>{m === 'Lista' ? 'Lista' : 'Mapa de quartos'}</button>)}</div>
        {mode === 'Lista' && <>
          <select className={s.select} value={status} onChange={e => setStatus(e.target.value as typeof status)} aria-label="Status"><option>Ativas</option><option>Todas</option>{(['Confirmada', 'Hospedado', 'Finalizada', 'Cancelada'] as Status[]).map(x => <option key={x}>{x}</option>)}</select>
          <select className={s.select} value={channel} onChange={e => setChannel(e.target.value as Channel | '')} aria-label="Canal"><option value="">Todos os canais</option>{channels.map(c => <option key={c}>{c}</option>)}</select>
          <label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Código, hóspede ou quarto" aria-label="Filtrar reservas" /></label>
        </>}
      </div>
      {mode === 'Lista' ? <ReservationTable ctx={ctx} list={list.slice(0, 200)} /> : <TapeChart ctx={ctx} />}
      {mode === 'Lista' && list.length > 200 && <p className={s.hint}>Mostrando 200 de {list.length}. Use os filtros para refinar.</p>}
    </section>
  </div>;
}

function ReservationTable({ ctx, list }: { ctx: Ctx; list: Reservation[] }) {
  return <div className={s.tableWrap}><table className={s.table}>
    <thead><tr><th>Reserva</th><th>Hóspede</th><th>Quarto</th><th>Chegada</th><th>Saída</th><th>Noites</th><th>Canal</th><th>Status</th><th className={s.num}>Total</th></tr></thead>
    <tbody>{list.map(r => { const room = ctx.store.rooms.find(x => x.id === r.roomId); return <tr key={r.id} onClick={() => ctx.openReservation(r.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && ctx.openReservation(r.id)}>
      <td><b>{r.code}</b></td><td><span className={s.cell}><Avatar name={ctx.guestName(r.guestId)} size={28} />{ctx.guestName(r.guestId)}</span></td>
      <td>{room?.number} <small className={s.muted}>{ctx.store.types.find(t => t.id === room?.typeId)?.name}</small></td>
      <td>{dateLabel(r.checkIn)}</td><td>{dateLabel(r.checkOut)}</td><td>{nightsOf(r)}</td><td>{r.channel}</td><td><Pill tone={statusTone[r.status]}>{r.status}</Pill></td><td className={s.num}>{brl(totalOf(r))}</td>
    </tr>; })}</tbody>
  </table>{!list.length && <p className={s.empty}>Nenhuma reserva com esses filtros.</p>}</div>;
}

function TapeChart({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [start, setStart] = useState(addDays(today, -2));
  const span = 14, days = Array.from({ length: span }, (_, i) => addDays(start, i)), end = addDays(start, span);
  return <div>
    <div className={s.tapeHead}><button className={s.iconBtn} onClick={() => setStart(addDays(start, -7))} aria-label="Semana anterior"><ChevronLeft size={18} /></button><b>{dateLabel(start)} – {dateLabel(addDays(end, -1))}</b><button className={s.iconBtn} onClick={() => setStart(addDays(start, 7))} aria-label="Próxima semana"><ChevronRight size={18} /></button><button className={s.chip} onClick={() => setStart(addDays(today, -2))}>Hoje</button><span className={s.legend}><i className={s.tBlue} />Confirmada<i className={s.tGreen} />Hospedado<i className={s.tGray} />Finalizada</span></div>
    <div className={s.tapeWrap}><div className={s.tape} style={{ '--days': span } as React.CSSProperties}>
      <div className={s.tapeRow}><span className={s.tapeLabel}>Quarto</span><div className={s.tapeDays}>{days.map(d => <span key={d} className={d === today ? s.tapeToday : ''}>{new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}<b>{d.slice(8)}</b></span>)}</div></div>
      {store.rooms.map(room => <div key={room.id} className={s.tapeRow}>
        <button className={s.tapeLabel} onClick={() => ctx.setModal({ kind: 'room', id: room.id })}><b>{room.number}</b><small>{store.types.find(t => t.id === room.typeId)?.name}</small></button>
        <div className={s.tapeDays}>
          {days.map(d => <button key={d} className={`${s.tapeCell} ${d === today ? s.tapeToday : ''}`} onClick={() => roomAvailable(store, room.id, d, addDays(d, 1)) && ctx.setModal({ kind: 'reservation', preset: { roomId: room.id, checkIn: d, checkOut: addDays(d, 2) } })} aria-label={`Quarto ${room.number}, ${dateLabel(d)}`} />)}
          {store.reservations.filter(r => r.roomId === room.id && active(r) && r.checkIn < end && r.checkOut > start).map(r => {
            const from = nightsOf({ checkIn: start, checkOut: r.checkIn }), to = Math.min(span, nightsOf({ checkIn: start, checkOut: r.checkOut }));
            return <button key={r.id} className={`${s.tapeBar} ${statusTone[r.status]}`} style={{ left: `calc(${from} * 100% / ${span} + 2px)`, width: `calc(${to - from} * 100% / ${span} - 4px)` }} onClick={() => ctx.openReservation(r.id)} title={`${r.code} · ${ctx.guestName(r.guestId)} · ${dateLabel(r.checkIn)} → ${dateLabel(r.checkOut)}`}>{ctx.guestName(r.guestId)}</button>;
          })}
        </div>
      </div>)}
    </div></div>
  </div>;
}

function GuestsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [q, setQ] = useState('');
  const rows = store.guests.filter(g => has(q, g.name, g.email, g.phone, g.city)).map(g => {
    const stays = store.reservations.filter(r => r.guestId === g.id && active(r));
    const done = stays.filter(r => r.checkIn <= today);
    return { g, stays: stays.length, nights: done.reduce((v, r) => v + nightsOf(r), 0), spent: done.reduce((v, r) => v + totalOf(r), 0), last: done.map(r => r.checkIn).sort().pop(), here: stays.some(r => r.status === 'Hospedado') };
  }).sort((a, b) => Number(b.here) - Number(a.here) || b.spent - a.spent);
  return <div className={s.page}>
    <PageHead title="Hóspedes" subtitle="Cadastro, histórico de estadias e valor de cada cliente."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'guest' })}><Plus size={17} />Novo hóspede</button></PageHead>
    <Stats items={[['Hóspedes cadastrados', store.guests.length], ['Hospedados agora', rows.filter(r => r.here).length], ['Recorrentes', rows.filter(r => r.stays > 1).length, 'mais de uma estadia'], ['Ticket médio', brl(rows.reduce((v, r) => v + r.spent, 0) / Math.max(1, rows.reduce((v, r) => v + r.stays, 0)), 0), 'por estadia']]} />
    <section className={s.card}>
      <div className={s.toolbar}><label className={s.inlineSearch}><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, e-mail, telefone ou cidade" aria-label="Filtrar hóspedes" /></label></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Hóspede</th><th>Contato</th><th>Cidade</th><th>Estadias</th><th>Noites</th><th>Última chegada</th><th className={s.num}>Total gasto</th></tr></thead>
        <tbody>{rows.map(({ g, stays, nights, spent, last, here }) => <tr key={g.id} onClick={() => ctx.openGuest(g.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && ctx.openGuest(g.id)}>
          <td><span className={s.cell}><Avatar name={g.name} size={30} /><b>{g.name}</b>{here && <Pill tone={s.tGreen}>Hospedado</Pill>}</span></td>
          <td><span className={s.stackText}>{g.email}<small>{g.phone}</small></span></td><td>{g.city}</td><td>{stays}</td><td>{nights}</td><td>{last ? dateLabel(last) : '—'}</td><td className={s.num}>{brl(spent)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function RoomsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [type, setType] = useState('');
  const [filter, setFilter] = useState<'Todos' | 'Livres' | 'Ocupados' | 'Sujos' | 'Manutenção'>('Todos');
  const state = (room: Room) => {
    const tonight = store.reservations.find(r => r.roomId === room.id && covers(r, today));
    const arriving = store.reservations.find(r => r.roomId === room.id && active(r) && r.checkIn === today);
    const leaving = store.reservations.find(r => r.roomId === room.id && r.status === 'Hospedado' && r.checkOut === today);
    return { tonight, arriving, leaving };
  };
  const matches = (room: Room) => {
    const st = state(room);
    return (!type || room.typeId === type) && (filter === 'Todos' || (filter === 'Livres' && !st.tonight && room.housekeeping !== 'Manutenção') || (filter === 'Ocupados' && !!st.tonight) || (filter === 'Sujos' && room.housekeeping === 'Sujo') || (filter === 'Manutenção' && room.housekeeping === 'Manutenção'));
  };
  const floors = [...new Set(store.rooms.map(r => r.floor))];
  const occupied = store.rooms.filter(r => state(r).tonight).length;
  return <div className={s.page}>
    <PageHead title="Quartos" subtitle="Mapa por andar, governança e tarifas por tipo de quarto."><button className={s.primary} onClick={() => ctx.setModal({ kind: 'reservation' })}><Plus size={17} />Nova reserva</button></PageHead>
    <Stats items={[['Ocupados hoje', `${occupied}/${store.rooms.length}`, pct(occupancy(store, today))], ['Livres', store.rooms.filter(r => !state(r).tonight && r.housekeeping !== 'Manutenção').length], ['Aguardando limpeza', store.rooms.filter(r => r.housekeeping === 'Sujo').length], ['Em manutenção', store.rooms.filter(r => r.housekeeping === 'Manutenção').length]]} />
    <section className={s.card}>
      <div className={s.toolbar}>
        <div className={s.segment}>{(['Todos', 'Livres', 'Ocupados', 'Sujos', 'Manutenção'] as const).map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? s.segOn : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
        <select className={s.select} value={type} onChange={e => setType(e.target.value)} aria-label="Tipo de quarto"><option value="">Todos os tipos</option>{store.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <span className={s.legend}><i className={s.tGreen} />Ocupado<i className={s.tBlue} />Chega hoje<i className={s.tAmber} />Sai hoje<i className={s.tRed} />Sujo</span>
      </div>
      {floors.map(f => { const rooms = store.rooms.filter(r => r.floor === f && matches(r)); return rooms.length ? <div key={f} className={s.floor}><h3>{f}º andar</h3><div className={s.roomGrid}>{rooms.map(room => {
        const st = state(room), t = store.types.find(x => x.id === room.typeId);
        const label = room.housekeeping === 'Manutenção' ? 'Manutenção' : st.leaving ? 'Sai hoje' : st.arriving && st.arriving.status === 'Confirmada' ? 'Chega hoje' : st.tonight ? 'Ocupado' : 'Livre';
        const tone = room.housekeeping === 'Manutenção' ? s.roomMaint : st.leaving ? s.roomLeaving : st.arriving && st.arriving.status === 'Confirmada' ? s.roomArriving : st.tonight ? s.roomBusy : s.roomFree;
        return <button key={room.id} className={`${s.roomTile} ${tone}`} onClick={() => ctx.setModal({ kind: 'room', id: room.id })}>
          <span><b>{room.number}</b>{room.housekeeping === 'Sujo' && <i className={s.dirtyDot} title="Aguardando limpeza" />}</span>
          <small>{t?.name}</small><em>{label}</em>{st.tonight && <small className={s.tileGuest}>{ctx.guestName(st.tonight.guestId)}</small>}
        </button>;
      })}</div></div> : null; })}
    </section>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Tipos de quarto e tarifas</h2></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Tipo</th><th>Quartos</th><th>Capacidade</th><th>Camas</th><th>Área</th><th>Tarifa base</th><th className={s.num}>Ocupação hoje</th></tr></thead>
        <tbody>{store.types.map(t => { const rooms = store.rooms.filter(r => r.typeId === t.id), busy = rooms.filter(r => state(r).tonight).length; return <tr key={t.id} className={s.noHover}>
          <td><button className={s.linkCell} onClick={() => ctx.setModal({ kind: 'type', id: t.id })}>{t.name}</button></td><td>{rooms.length}</td><td>{t.capacity} pessoas</td><td>{t.beds}</td><td>{t.size} m²</td>
          <td><span className={s.priceEdit}>R$ <input defaultValue={t.price} inputMode="numeric" aria-label={`Tarifa de ${t.name}`} onBlur={e => { const v = Number(e.target.value.replace(/\D/g, '')); if (v && v !== t.price) ctx.set(st => ({ types: st.types.map(x => x.id === t.id ? { ...x, price: v } : x) }), `Tarifa base de ${t.name}: ${brl(v, 0)}.`); }} /></span></td>
          <td className={s.num}>{pct(busy / rooms.length * 100)}</td>
        </tr>; })}</tbody>
      </table></div>
    </section>
  </div>;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [offset, setOffset] = useState(0);
  const base = new Date(`${today}T12:00`); base.setDate(1); base.setMonth(base.getMonth() + offset);
  const month = dayKey(base).slice(0, 7);
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const elapsed = days.filter(d => d <= today);
  const extrasByDay = (d: string) => store.reservations.filter(r => active(r)).flatMap(r => r.extras).filter(e => e.date === d).reduce((v, e) => v + e.value, 0);
  const rows = days.map(d => ({ d, rooms: d <= today ? nightRevenue(store, d) : 0, extras: d <= today ? extrasByDay(d) : 0, sold: d <= today ? new Set(store.reservations.filter(r => covers(r, d)).map(r => r.roomId)).size : 0, forecast: d > today ? nightRevenue(store, d) : 0 }));
  const roomRevenue = rows.reduce((v, r) => v + r.rooms, 0), extras = rows.reduce((v, r) => v + r.extras, 0), sold = rows.reduce((v, r) => v + r.sold, 0), forecast = rows.reduce((v, r) => v + r.forecast, 0);
  const available = store.rooms.length * Math.max(1, elapsed.length);
  const peak = Math.max(...rows.map(r => r.rooms + r.extras + r.forecast), 1);
  const byChannel = channels.map(c => { const list = store.reservations.filter(r => active(r) && r.channel === c && r.checkIn.startsWith(month)); return { c, count: list.length, value: list.reduce((v, r) => v + totalOf(r), 0) }; });
  const label = base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return <div className={s.page}>
    <PageHead title="Financeiro" subtitle="Receita de diárias e extras, diária média e RevPAR.">
      <div className={s.monthNav}><button className={s.iconBtn} onClick={() => setOffset(offset - 1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button><b>{label.charAt(0).toUpperCase() + label.slice(1)}</b><button className={s.iconBtn} onClick={() => setOffset(offset + 1)} aria-label="Próximo mês"><ChevronRight size={18} /></button></div>
      <button className={s.secondary} onClick={() => download(`lumen-financeiro-${month}.csv`, csv([['Data', 'Quartos vendidos', 'Diárias', 'Extras', 'Total'], ...rows.filter(r => r.d <= today).map(r => [dateLabel(r.d), r.sold, r.rooms.toFixed(2), r.extras.toFixed(2), (r.rooms + r.extras).toFixed(2)])]), 'text/csv')}><Download size={16} />CSV</button>
    </PageHead>
    <Stats items={[['Receita realizada', brl(roomRevenue + extras, 0), `${brl(roomRevenue, 0)} em diárias`], ['Extras', brl(extras, 0), 'restaurante, passeios e serviços'], ['Diária média (ADR)', brl(sold ? roomRevenue / sold : 0, 0)], ['RevPAR', brl(roomRevenue / available, 0), 'receita por quarto disponível'], ['Ocupação no mês', pct(sold / available * 100)], ['A realizar no mês', brl(forecast, 0), 'reservas confirmadas']]} />
    <section className={s.card}>
      <div className={s.cardHead}><h2>Receita por dia</h2><span className={s.legend}><i className={s.lRooms} />Diárias<i className={s.lExtras} />Extras<i className={s.lForecast} />Previsto</span></div>
      <div className={s.chart}>{rows.map(r => <div key={r.d} title={`${dateLabel(r.d)}: ${brl(r.rooms + r.extras + r.forecast)}`} className={r.d === today ? s.chartToday : ''}><span><i className={s.lForecast} style={{ height: `${r.forecast / peak * 100}%` }} /><i className={s.lExtras} style={{ height: `${r.extras / peak * 100}%` }} /><i className={s.lRooms} style={{ height: `${r.rooms / peak * 100}%` }} /></span><small>{r.d.slice(8)}</small></div>)}</div>
    </section>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Reservas por canal (chegadas no mês)</h2></div>
      <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Canal</th><th>Reservas</th><th>Participação</th><th className={s.num}>Valor</th></tr></thead>
        <tbody>{byChannel.map(({ c, count, value }) => { const total = byChannel.reduce((v, x) => v + x.value, 0) || 1; return <tr key={c} className={s.noHover}><td><b>{c}</b></td><td>{count}</td><td><span className={s.meter}><i style={{ width: `${value / total * 100}%` }} /></span> {pct(value / total * 100)}</td><td className={s.num}>{brl(value, 0)}</td></tr>; })}</tbody></table></div>
    </section>
  </div>;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store, today } = ctx;
  const [form, setForm] = useState({ ...store.settings, temperature: String(store.settings.temperature) });
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const byType = store.types.map(t => { const rooms = store.rooms.filter(r => r.typeId === t.id).map(r => r.id); const sold = last30.reduce((v, d) => v + new Set(store.reservations.filter(r => covers(r, d) && rooms.includes(r.roomId)).map(r => r.roomId)).size, 0); return { t, value: sold / (rooms.length * 30) * 100 }; });
  const leadTimes = store.reservations.filter(r => active(r) && r.checkIn >= addDays(today, -30) && r.checkIn <= today).map(r => (new Date(`${r.checkIn}T12:00`).getTime() - new Date(r.createdAt).getTime()) / 864e5);
  const avgStay = (() => { const list = store.reservations.filter(r => active(r) && r.checkIn >= addDays(today, -30) && r.checkIn <= today); return list.reduce((v, r) => v + nightsOf(r), 0) / Math.max(1, list.length); })();
  const exportReservations = () => download('lumen-reservas.csv', csv([['Código', 'Hóspede', 'Quarto', 'Tipo', 'Chegada', 'Saída', 'Noites', 'Canal', 'Status', 'Diária', 'Extras', 'Total'], ...store.reservations.map(r => { const room = store.rooms.find(x => x.id === r.roomId); return [r.code, ctx.guestName(r.guestId), room?.number ?? '', store.types.find(t => t.id === room?.typeId)?.name ?? '', dateLabel(r.checkIn), dateLabel(r.checkOut), nightsOf(r), r.channel, r.status, r.rate.toFixed(2), extrasOf(r).toFixed(2), totalOf(r).toFixed(2)]; })]), 'text/csv');
  return <div className={s.page}>
    <PageHead title="Relatórios" subtitle="Indicadores dos últimos 30 dias, exportações e configurações." />
    <Stats items={[['Ocupação média (30 dias)', pct(last30.reduce((v, d) => v + occupancy(store, d), 0) / 30)], ['Estadia média', `${avgStay.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} noites`], ['Antecedência média', `${Math.round(leadTimes.reduce((a, b) => a + b, 0) / Math.max(1, leadTimes.length))} dias`, 'entre reserva e chegada'], ['Reservas no histórico', store.reservations.length]]} />
    <div className={s.twoCol}>
      <section className={s.card}><div className={s.cardHead}><h2>Ocupação por tipo (30 dias)</h2></div>
        <ul className={s.hbars}>{byType.map(({ t, value }) => <li key={t.id}><span>{t.name}</span><span className={s.meter}><i style={{ width: `${value}%` }} /></span><b>{pct(value)}</b></li>)}</ul>
      </section>
      <section className={s.card}><div className={s.cardHead}><h2>Exportações e dados</h2></div>
        <div className={s.exportList}>
          <button className={s.secondary} onClick={exportReservations}><Download size={16} />Reservas (CSV)</button>
          <button className={s.secondary} onClick={() => download('lumen-hospedes.csv', csv([['Nome', 'E-mail', 'Telefone', 'Cidade', 'Documento'], ...store.guests.map(g => [g.name, g.email, g.phone, g.city, g.document])]), 'text/csv')}><Download size={16} />Hóspedes (CSV)</button>
          <button className={s.secondary} onClick={() => download('lumen-backup.json', JSON.stringify(store, null, 2), 'application/json')}><Download size={16} />Backup completo (JSON)</button>
          <button className={s.secondary} onClick={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) ctx.set(() => makeSeed(), 'Dados de exemplo restaurados.'); }}><RotateCcw size={16} />Restaurar dados de exemplo</button>
        </div>
      </section>
    </div>
    <section className={s.card}><div className={s.cardHead}><h2>Configurações</h2></div>
      <form className={s.form} onSubmit={e => { e.preventDefault(); ctx.set(() => ({ settings: { ...form, temperature: Number(form.temperature) || 0 } }), 'Configurações salvas.'); }}>
        <label className={s.field}><span>Nome do hotel</span><input required value={form.hotel} onChange={e => setForm({ ...form, hotel: e.target.value })} /></label>
        <label className={s.field}><span>Responsável</span><input required value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
        <label className={s.field}><span>Cidade</span><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
        <label className={s.field}><span>Temperatura exibida (°C)</span><input inputMode="numeric" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value.replace(/[^\d-]/g, '') })} /></label>
        <label className={s.field}><span>Condição do tempo</span><select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>{conditions.map(c => <option key={c}>{c}</option>)}</select></label>
        <div className={s.formEnd}><button className={s.primary} type="submit">Salvar configurações</button></div>
      </form>
      <p className={s.hint}>O clima da visão geral é um valor de demonstração: não há serviço de previsão do tempo conectado.</p>
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

function ReservationForm({ ctx, id, preset, onClose }: { ctx: Ctx; id?: string; preset?: Partial<Reservation>; onClose: () => void }) {
  const { store, today } = ctx;
  const editing = id ? store.reservations.find(r => r.id === id) : undefined;
  const presetRoom = store.rooms.find(r => r.id === (editing?.roomId ?? preset?.roomId));
  const [f, setF] = useState(() => ({
    guestId: editing?.guestId ?? preset?.guestId ?? '', newName: '', newPhone: '', newEmail: '',
    checkIn: editing?.checkIn ?? preset?.checkIn ?? today, checkOut: editing?.checkOut ?? preset?.checkOut ?? addDays(today, 3),
    typeId: presetRoom?.typeId ?? store.types[0].id, roomId: presetRoom?.id ?? '',
    adults: String(editing?.adults ?? 2), children: String(editing?.children ?? 0), channel: editing?.channel ?? 'Direto' as Channel,
    rate: String(editing?.rate ?? store.types.find(t => t.id === (presetRoom?.typeId ?? store.types[0].id))!.price), notes: editing?.notes ?? '',
  }));
  const validDates = f.checkOut > f.checkIn;
  const free = validDates ? store.rooms.filter(r => r.typeId === f.typeId && r.housekeeping !== 'Manutenção' && roomAvailable(store, r.id, f.checkIn, f.checkOut, editing?.id)) : [];
  const roomId = free.some(r => r.id === f.roomId) ? f.roomId : free[0]?.id ?? '';
  const nights = validDates ? nightsOf(f) : 0;
  const type = store.types.find(t => t.id === f.typeId)!;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!validDates) return ctx.setToast('A saída precisa ser depois da chegada.');
    if (!roomId) return ctx.setToast('Não há quarto livre desse tipo no período.');
    if (Number(f.adults) + Number(f.children) > type.capacity) return ctx.setToast(`${type.name} comporta até ${type.capacity} pessoas.`);
    let guestId = f.guestId;
    const newGuest: Guest | null = !guestId ? { id: uid(), name: f.newName.trim(), phone: f.newPhone, email: f.newEmail, city: '', document: '', createdAt: new Date().toISOString() } : null;
    if (newGuest) { if (!newGuest.name) return ctx.setToast('Informe o hóspede.'); guestId = newGuest.id; }
    const data = { guestId, roomId, checkIn: f.checkIn, checkOut: f.checkOut, adults: Number(f.adults) || 1, children: Number(f.children) || 0, channel: f.channel, rate: Number(f.rate.replace(/\D/g, '')) || type.price, notes: f.notes };
    if (editing) ctx.set(st => ({ reservations: st.reservations.map(r => r.id === editing.id ? { ...r, ...data } : r), guests: newGuest ? [...st.guests, newGuest] : st.guests }), `Reserva ${editing.code} atualizada.`);
    else ctx.set(st => ({ next: st.next + 1, guests: newGuest ? [...st.guests, newGuest] : st.guests, reservations: [...st.reservations, { id: uid(), code: `LM-${2400 + st.next}`, status: 'Confirmada', extras: [], createdAt: new Date().toISOString(), ...data }] }), `Reserva criada no quarto ${ctx.roomNumber(roomId)}.`);
    onClose();
  }
  return <Shell title={editing ? `Editar reserva ${editing.code}` : 'Nova reserva'} onClose={onClose} wide>
    <form className={s.form} onSubmit={submit}>
      <label className={`${s.field} ${s.wide}`}><span>Hóspede</span><select value={f.guestId} onChange={e => setF({ ...f, guestId: e.target.value })}><option value="">+ Novo hóspede</option>{[...store.guests].sort((a, b) => a.name.localeCompare(b.name)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      {!f.guestId && <><label className={s.field}><span>Nome do novo hóspede</span><input required value={f.newName} onChange={e => setF({ ...f, newName: e.target.value })} /></label><label className={s.field}><span>Telefone</span><input value={f.newPhone} onChange={e => setF({ ...f, newPhone: e.target.value })} /></label><label className={`${s.field} ${s.wide}`}><span>E-mail</span><input type="email" value={f.newEmail} onChange={e => setF({ ...f, newEmail: e.target.value })} /></label></>}
      <label className={s.field}><span>Chegada</span><input type="date" required value={f.checkIn} onChange={e => setF({ ...f, checkIn: e.target.value })} /></label>
      <label className={s.field}><span>Saída</span><input type="date" required value={f.checkOut} min={addDays(f.checkIn, 1)} onChange={e => setF({ ...f, checkOut: e.target.value })} /></label>
      <label className={s.field}><span>Tipo de quarto</span><select value={f.typeId} onChange={e => { const t = store.types.find(x => x.id === e.target.value)!; setF({ ...f, typeId: t.id, roomId: '', rate: String(t.price) }); }}>{store.types.map(t => <option key={t.id} value={t.id}>{t.name} · {brl(t.price, 0)}</option>)}</select></label>
      <label className={s.field}><span>Quarto ({free.length} livres no período)</span><select value={roomId} onChange={e => setF({ ...f, roomId: e.target.value })} disabled={!free.length}>{free.map(r => <option key={r.id} value={r.id}>{r.number} · {r.floor}º andar</option>)}{!free.length && <option>Nenhum quarto livre</option>}</select></label>
      <label className={s.field}><span>Adultos</span><input inputMode="numeric" value={f.adults} onChange={e => setF({ ...f, adults: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={s.field}><span>Crianças</span><input inputMode="numeric" value={f.children} onChange={e => setF({ ...f, children: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={s.field}><span>Canal</span><select value={f.channel} onChange={e => setF({ ...f, channel: e.target.value as Channel })}>{channels.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className={s.field}><span>Diária (R$)</span><input inputMode="numeric" value={f.rate} onChange={e => setF({ ...f, rate: e.target.value.replace(/\D/g, '') })} /></label>
      <label className={`${s.field} ${s.wide}`}><span>Observações</span><textarea rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Pedidos especiais, horário de chegada, ocasião..." /></label>
      <div className={`${s.summary} ${s.wide}`}><span>{nights} {nights === 1 ? 'noite' : 'noites'} × {brl(Number(f.rate) || 0, 0)}</span><b>{brl(nights * (Number(f.rate) || 0))}</b></div>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit" disabled={!roomId}>{editing ? 'Salvar alterações' : 'Confirmar reserva'}</button></footer>
    </form>
  </Shell>;
}

function GuestForm({ ctx, id, onClose }: { ctx: Ctx; id?: string; onClose: () => void }) {
  const g = id ? ctx.store.guests.find(x => x.id === id) : undefined;
  const [f, setF] = useState({ name: g?.name ?? '', email: g?.email ?? '', phone: g?.phone ?? '', city: g?.city ?? '', document: g?.document ?? '' });
  return <Shell title={g ? 'Editar hóspede' : 'Novo hóspede'} onClose={onClose}>
    <form className={s.form} onSubmit={e => { e.preventDefault(); if (g) ctx.set(st => ({ guests: st.guests.map(x => x.id === g.id ? { ...x, ...f } : x) }), 'Hóspede atualizado.'); else ctx.set(st => ({ guests: [...st.guests, { id: uid(), createdAt: new Date().toISOString(), ...f }] }), `${f.name} cadastrado.`); onClose(); }}>
      <label className={`${s.field} ${s.wide}`}><span>Nome completo</span><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className={s.field}><span>E-mail</span><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
      <label className={s.field}><span>Telefone</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label>
      <label className={s.field}><span>Cidade</span><input value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></label>
      <label className={s.field}><span>Documento</span><input value={f.document} onChange={e => setF({ ...f, document: e.target.value })} /></label>
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function TypeModal({ ctx, id, onClose }: { ctx: Ctx; id: string; onClose: () => void }) {
  const t = ctx.store.types.find(x => x.id === id)!;
  const rooms = ctx.store.rooms.filter(r => r.typeId === id);
  const freeTonight = rooms.filter(r => r.housekeeping !== 'Manutenção' && roomAvailable(ctx.store, r.id, ctx.today, addDays(ctx.today, 1))).length;
  return <Shell title={t.name} onClose={onClose}>
    <RoomPhoto typeId={t.id} name={t.name} className={s.typeHero} />
    <p className={s.typeDesc}>{t.description}</p>
    <div className={s.typeFacts}><span><b>{brl(t.price, 0)}</b>diária base</span><span><b>{t.size} m²</b>área</span><span><b>{t.capacity}</b>pessoas</span><span><b>{freeTonight}/{rooms.length}</b>livres hoje</span></div>
    <p className={s.muted}>{t.beds}</p>
    <div className={s.amenities}>{t.amenities.map(a => <span key={a}>{a}</span>)}</div>
    <footer className={s.modalFoot}><button className={s.secondary} onClick={() => { onClose(); ctx.go('Quartos'); }}>Ver quartos</button><button className={s.primary} onClick={() => ctx.setModal({ kind: 'reservation', preset: { roomId: rooms.find(r => r.housekeeping !== 'Manutenção' && roomAvailable(ctx.store, r.id, ctx.today, addDays(ctx.today, 3)))?.id } })}><Plus size={16} />Reservar {t.name}</button></footer>
  </Shell>;
}

function RoomModal({ ctx, id, onClose }: { ctx: Ctx; id: string; onClose: () => void }) {
  const { store, today } = ctx;
  const room = store.rooms.find(r => r.id === id)!, t = store.types.find(x => x.id === room.typeId)!;
  const current = store.reservations.find(r => r.roomId === id && covers(r, today));
  const upcoming = store.reservations.filter(r => r.roomId === id && active(r) && r.checkIn > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 4);
  return <Shell title={`Quarto ${room.number}`} onClose={onClose}>
    <p className={s.muted}>{t.name} · {room.floor}º andar · {t.size} m² · até {t.capacity} pessoas</p>
    <div className={s.block}><h3>Governança</h3><div className={s.segment}>{(['Limpo', 'Sujo', 'Manutenção'] as Housekeeping[]).map(h => <button key={h} aria-pressed={room.housekeeping === h} className={room.housekeeping === h ? s.segOn : ''} onClick={() => ctx.setHousekeeping(id, h)}>{h}</button>)}</div></div>
    <div className={s.block}><h3>Hoje</h3>{current ? <button className={s.resRow} onClick={() => { onClose(); ctx.openReservation(current.id); }}><Avatar name={ctx.guestName(current.guestId)} /><span><b>{ctx.guestName(current.guestId)}</b><small>{dateLabel(current.checkIn)} → {dateLabel(current.checkOut)} · {current.code}</small></span><Pill tone={statusTone[current.status]}>{current.status}</Pill></button> : <p className={s.muted}>Livre esta noite.</p>}</div>
    <div className={s.block}><h3>Próximas reservas</h3>{upcoming.map(r => <button key={r.id} className={s.resRow} onClick={() => { onClose(); ctx.openReservation(r.id); }}><Avatar name={ctx.guestName(r.guestId)} /><span><b>{ctx.guestName(r.guestId)}</b><small>{dateLabel(r.checkIn)} → {dateLabel(r.checkOut)} · {r.code}</small></span><Pill tone={statusTone[r.status]}>{r.status}</Pill></button>)}{!upcoming.length && <p className={s.muted}>Nenhuma reserva futura.</p>}</div>
    <footer className={s.modalFoot}><button className={s.primary} disabled={room.housekeeping === 'Manutenção'} onClick={() => { const from = current ? current.checkOut : today; ctx.setModal({ kind: 'reservation', preset: { roomId: id, checkIn: from, checkOut: addDays(from, 2) } }); }}><Plus size={16} />Nova reserva neste quarto</button></footer>
  </Shell>;
}

function ReservationDrawer({ ctx, r, onClose }: { ctx: Ctx; r: Reservation; onClose: () => void }) {
  const { store, today } = ctx;
  const guest = store.guests.find(g => g.id === r.guestId), room = store.rooms.find(x => x.id === r.roomId), t = store.types.find(x => x.id === room?.typeId);
  const [extra, setExtra] = useState({ description: '', value: '' });
  const [notes, setNotes] = useState(r.notes);
  const steps: Status[] = ['Confirmada', 'Hospedado', 'Finalizada'];
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={s.drawer} aria-describedby={undefined}>
      <header className={s.drawerHead}>
        <div><small>{r.code} · {r.channel}</small><Dialog.Title>{guest?.name}</Dialog.Title><p>Quarto {room?.number} · {t?.name}</p></div>
        <Dialog.Close className={s.iconBtn} aria-label="Fechar"><X size={18} /></Dialog.Close>
      </header>
      {r.status === 'Cancelada' ? <div className={s.cancelled}>Reserva cancelada</div> : <ol className={s.steps}>{steps.map((st, i) => { const reached = steps.indexOf(r.status) >= i; return <li key={st} className={`${reached ? s.stepDone : ''} ${r.status === st ? s.stepNow : ''}`}><i>{reached ? <Check size={12} strokeWidth={3} /> : i + 1}</i>{st}</li>; })}</ol>}
      <div className={s.drawerBody}>
        <div className={s.factGrid}>
          <span>Chegada<b>{dateLabel(r.checkIn)}</b></span><span>Saída<b>{dateLabel(r.checkOut)}</b></span><span>Noites<b>{nightsOf(r)}</b></span>
          <span>Hóspedes<b>{r.adults} adultos{r.children ? ` + ${r.children}` : ''}</b></span><span>Diária<b>{brl(r.rate, 0)}</b></span><span>Total<b>{brl(totalOf(r))}</b></span>
        </div>
        <section className={s.block}><h3>Hóspede</h3><button className={s.resRow} onClick={() => guest && ctx.openGuest(guest.id)}><Avatar name={guest?.name ?? '?'} /><span><b>{guest?.name}</b><small>{guest?.email} · {guest?.phone}</small></span><ArrowRight size={16} /></button></section>
        <section className={s.block}><h3>Extras e consumo</h3>
          <ul className={s.extraList}>{r.extras.map(e => <li key={e.id}><span>{e.description}<small>{dateLabel(e.date)}</small></span><b>{brl(e.value)}</b>{r.status !== 'Finalizada' && r.status !== 'Cancelada' && <button className={s.iconBtn} onClick={() => ctx.updateReservation(r.id, { extras: r.extras.filter(x => x.id !== e.id) }, 'Extra removido.')} aria-label={`Remover ${e.description}`}><Trash2 size={15} /></button>}</li>)}{!r.extras.length && <li className={s.muted}>Nenhum extra lançado.</li>}</ul>
          {r.status === 'Hospedado' && <form className={s.extraForm} onSubmit={e => { e.preventDefault(); const value = Number(extra.value.replace(',', '.')); if (!extra.description.trim() || !(value > 0)) return; ctx.updateReservation(r.id, { extras: [...r.extras, { id: uid(), description: extra.description.trim(), value, date: today }] }, 'Extra lançado na conta.'); setExtra({ description: '', value: '' }); }}>
            <input value={extra.description} onChange={e => setExtra({ ...extra, description: e.target.value })} placeholder="Ex.: frigobar, jantar" aria-label="Descrição do extra" /><input value={extra.value} onChange={e => setExtra({ ...extra, value: e.target.value.replace(/[^\d,.]/g, '') })} placeholder="Valor" inputMode="decimal" aria-label="Valor do extra" /><button className={s.secondary} type="submit"><Plus size={15} />Lançar</button>
          </form>}
        </section>
        <section className={s.block}><h3>Observações</h3><textarea className={s.notes} rows={3} value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => notes !== r.notes && ctx.updateReservation(r.id, { notes }, 'Observações salvas.')} placeholder="Pedidos do hóspede, preferências..." /></section>
      </div>
      <footer className={s.drawerFoot}>
        {(r.status === 'Confirmada' || r.status === 'Hospedado') && <button className={s.dangerBtn} onClick={() => ctx.cancel(r)}>Cancelar reserva</button>}
        {r.status === 'Confirmada' && <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'reservation', id: r.id })}>Editar</button>}
        {r.status === 'Confirmada' && <button className={s.primary} onClick={() => ctx.checkIn(r)} disabled={r.checkIn > today} title={r.checkIn > today ? 'Disponível a partir da data de chegada' : undefined}><LogIn size={16} />Fazer check-in</button>}
        {r.status === 'Hospedado' && <button className={s.primary} onClick={() => ctx.checkOut(r)}><LogOut size={16} />Fazer check-out · {brl(totalOf(r), 0)}</button>}
        {r.status === 'Finalizada' && <span className={s.closed}><Check size={16} />Estadia finalizada</span>}
      </footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

function GuestDrawer({ ctx, g, onClose }: { ctx: Ctx; g: Guest; onClose: () => void }) {
  const stays = ctx.store.reservations.filter(r => r.guestId === g.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const spent = stays.filter(r => active(r) && r.checkIn <= ctx.today).reduce((v, r) => v + totalOf(r), 0);
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={s.drawer} aria-describedby={undefined}>
      <header className={s.drawerHead}><Avatar name={g.name} size={52} /><div><Dialog.Title>{g.name}</Dialog.Title><p>{g.city || 'Cidade não informada'}</p></div><Dialog.Close className={s.iconBtn} aria-label="Fechar"><X size={18} /></Dialog.Close></header>
      <div className={s.drawerBody}>
        <div className={s.factGrid}><span>E-mail<b>{g.email || '—'}</b></span><span>Telefone<b>{g.phone || '—'}</b></span><span>Documento<b>{g.document || '—'}</b></span><span>Estadias<b>{stays.filter(active).length}</b></span><span>Total gasto<b>{brl(spent)}</b></span><span>Cliente desde<b>{dateLabel(g.createdAt)}</b></span></div>
        <section className={s.block}><h3>Estadias</h3>{stays.map(r => <button key={r.id} className={s.resRow} onClick={() => ctx.openReservation(r.id)}><span className={s.roomBadge}>{ctx.roomNumber(r.roomId)}</span><span><b>{dateLabel(r.checkIn)} → {dateLabel(r.checkOut)}</b><small>{r.code} · {nightsOf(r)} noites · {brl(totalOf(r), 0)}</small></span><Pill tone={statusTone[r.status]}>{r.status}</Pill></button>)}{!stays.length && <p className={s.muted}>Nenhuma estadia ainda.</p>}</section>
      </div>
      <footer className={s.drawerFoot}><button className={s.secondary} onClick={() => ctx.setModal({ kind: 'guest', id: g.id })}><Users size={16} />Editar dados</button><button className={s.primary} onClick={() => ctx.setModal({ kind: 'reservation', preset: { guestId: g.id } })}><Plus size={16} />Nova reserva</button></footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
