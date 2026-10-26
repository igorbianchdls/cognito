'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { PawPrint, Building2, GraduationCap, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Download, FileText, House, Image as ImageIcon, MessageSquare, Package, Plus, Search, Settings2, ShieldCheck, ShoppingBag, Truck, Users, Wallet, Wrench, X, type LucideIcon } from 'lucide-react';
import s from './Business.module.css';
export { s };
export type Entry = { id: string; title: string; type: 'Receita' | 'Despesa'; amount: number; date: string; paid: boolean; category: string; reference?: string };
export type Person = { id: string; name: string; contact: string; category: string };
export type Appointment = { id: string; title: string; reference: string; date: string; time: string; end: string };
export type Brand = { slug: string; name: string; subtitle: string; description: string; menus: string[]; primary: string; placeholder?: string };
export const today = '2026-10-26';
export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const day = (date: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', options);
export const uid = () => crypto.randomUUID();
export const contains = (query: string, ...values: (string | number)[]) => values.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
export const icons: Record<string, LucideIcon> = { 'Visão geral': House, 'Ordens de serviço': ClipboardList, Agenda: CalendarDays, Clientes: Users, Aparelhos: Package, Veículos: Truck, Técnicos: Users, Equipe: Users, 'Peças e estoque': Package, Orçamentos: FileText, Financeiro: Wallet, Garantias: ShieldCheck, Relatórios: FileText, Mensagens: MessageSquare, Vendas: ShoppingBag, Produtos: ShoppingBag, Coleções: ImageIcon, Estoque: Package, Compras: Truck, Fornecedores: Users, Trocas: ShieldCheck , Profissionais: Users, 'Comissões': Wallet, Pets: PawPrint, Tutores: Users, 'Produtos e estoque': Package, 'Imóveis': Building2, Oportunidades: FileText, Visitas: CalendarDays, Corretores: Users, Documentos: FileText, Turmas: GraduationCap, Cursos: GraduationCap, Alunos: Users, 'Matrículas': FileText, 'Presença': ClipboardList, Professores: Users, Mensalidades: Wallet, Contratos: FileText, Escalas: CalendarDays, Materiais: Package };

export function useLocalStore<T>(key: string, seed: T, required: string[]) {
  const [data, setData] = useState<T>(seed);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState(false);
  const requiredKey = required.join(',');
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) { const parsed = JSON.parse(raw); if (parsed && requiredKey.split(',').every(name => Array.isArray(parsed[name]))) setData(parsed); } } catch { setWarning(true); }
    setReady(true);
  }, [key, requiredKey]);
  useEffect(() => { if (ready) { try { localStorage.setItem(key, JSON.stringify(data)); } catch { setWarning(true); } } }, [key, data, ready]);
  return { data, setData, warning };
}
export function useNavigation(menus: string[]) {
  const [view, setView] = useState('Visão geral');
  const [selected, setSelected] = useState<string | null>(null);
  const key = menus.join('|');
  useEffect(() => {
    const read = () => { const p = new URLSearchParams(location.hash.slice(1)); const next = p.get('view') || 'Visão geral'; setView(key.split('|').includes(next) ? next : 'Visão geral'); setSelected(p.get('id')); };
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, [key]);
  const go = (name: string, id?: string) => { setView(name); setSelected(id || null); location.hash = new URLSearchParams({ view: name, ...(id ? { id } : {}) }).toString(); };
  return { view, selected, go };
}
export function useToast() {
  const [message, setMessage] = useState(''); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const notify = (value: string) => { setMessage(value); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMessage(''), 4000); };
  return { notify, toast: message ? <div className={s.toast} role="status"><Check size={16} />{message}</div> : null };
}
export function Photo({ slug, name, alt = '', className = '' }: { slug: string; name: string; alt?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={`/${slug}-media/${name}.jpg`} alt={alt} />;
}
export function Badge({ children }: { children: string }) {
  const style = /Pronto|Entregue|Disponível|Recebido|Pago|Concluíd[oa]|Em serviço|Em reparo|Livre|Confirmado|Ativo|Ativa/.test(children) ? s.green : /diagnóstico|inspeção|separação|Agendado|Planejada/.test(children) ? s.blue : /Aguard|baixo|Pendente|entrega|aprovação|atendimento|negociação/.test(children) ? s.gold : s.peach;
  return <span className={`${s.badge} ${style}`}>{children}</span>;
}
export function Panel({ title, action, onAction, children, className = '' }: { title: string; action?: string; onAction?: () => void; children: ReactNode; className?: string }) {
  return <section className={`${s.panel} ${className}`}><header className={s.panelHeader}><h2>{title}</h2>{action && <button className={s.textButton} onClick={onAction}>{action}<ArrowRight size={12} /></button>}</header>{children}</section>;
}
export function Table({ headings, rows }: { headings: string[]; rows: ReactNode[][] }) {
  return <div className={s.tableWrap}><table className={s.table}><thead><tr>{headings.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <div className={s.empty}>Nenhum resultado encontrado.</div>}</div>;
}
export function Field({ label, name, value, type = 'text', required = true, min, max, step }: { label: string; name: string; value?: string | number; type?: string; required?: boolean; min?: number; max?: number; step?: string }) {
  return <label className={s.field}>{label}<input name={name} defaultValue={value} type={type} required={required} min={type === 'number' ? min ?? 0 : undefined} max={max} step={type === 'number' ? step || '0.01' : undefined} /></label>;
}
export function Select({ label, name, value, options, required = true }: { label: string; name: string; value?: string; required?: boolean; options: (string | { value: string; label: string })[] }) {
  return <label className={s.field}>{label}<select name={name} defaultValue={value} required={required}>{options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option value={o.value} key={o.value}>{o.label}</option>)}</select></label>;
}
export function Modal({ open, title, onClose, onSubmit, children, footer = true }: { open: boolean; title: string; onClose: () => void; onSubmit?: (e: FormEvent<HTMLFormElement>) => void; children: ReactNode; footer?: boolean }) {
  return <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose(); }}><Dialog.Portal><Dialog.Overlay className={s.modalOverlay} /><Dialog.Content className={s.modal}><div className={s.modalHeading}><Dialog.Title>{title}</Dialog.Title><Dialog.Close className={s.iconButton} aria-label="Fechar"><X size={19} /></Dialog.Close></div><Dialog.Description className={s.modalDescription}>Demonstração local. As alterações ficam salvas neste navegador.</Dialog.Description><form onSubmit={onSubmit}><div className={s.formGrid}>{children}</div>{footer && <div className={s.modalFooter}><Dialog.Close className={s.secondaryButton}>Cancelar</Dialog.Close><button className={s.primaryButton} type="submit"><Check size={15} />Salvar</button></div>}</form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function download(name: string, text: string, type = 'text/plain;charset=utf-8') { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function csv(name: string, rows: (string | number)[][]) { download(name, '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\r\n'), 'text/csv;charset=utf-8'); }

export function Shell({ brand, view, go, query, setQuery, month, setMonth, onPrimary, primary, warning, notifications, onExport, children, detail = false }: { brand: Brand; view: string; go: (view: string) => void; query: string; setQuery: (value: string) => void; month: Date; setMonth: (d: Date) => void; onPrimary: () => void; primary?: string; warning: boolean; notifications: ReactNode; onExport: () => void; children: ReactNode; detail?: boolean }) {
  const [showNotifications, setShowNotifications] = useState(false); const [profile, setProfile] = useState(false);
  return <div className={`${s.app} ${brand.slug === 'roupas' ? s.retail : ''}`}><a className={s.skipLink} href={`#${brand.slug}-main`} onClick={e=>{e.preventDefault();document.getElementById(`${brand.slug}-main`)?.focus();}}>Pular para o conteúdo</a><aside className={s.sidebar}><button className={s.brand} onClick={() => go('Visão geral')} aria-label={`${brand.name}, início`}><div>{brand.name}<small>{brand.subtitle}</small></div></button><nav aria-label="Navegação principal">{brand.menus.map(name => { const Icon = icons[name] || Settings2; return <button key={name} className={view === name ? s.navActive : ''} aria-current={view === name ? 'page' : undefined} onClick={() => { go(name); setShowNotifications(false); }}><Icon size={18} strokeWidth={1.5} fill={name === 'Visão geral' && view === name ? 'currentColor' : 'none'} /><span>{name}</span></button>; })}</nav><a href="/sistemas" className={s.directoryLink}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg><span>Todos os sistemas</span></a><button className={s.profile} onClick={() => setProfile(true)}><Photo slug={brand.slug} name="portrait" alt="Mariana Silva" /><span><b>Mariana Silva</b><small>Gerente</small></span><ChevronRight size={13} /></button></aside><main className={s.main} id={`${brand.slug}-main`} tabIndex={-1}><header className={s.topbar}><label className={s.search}><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={brand.placeholder || (brand.slug === 'roupas' ? 'Buscar produtos, clientes, pedidos...' : brand.slug === 'oficina' ? 'Buscar placa, cliente ou ordem...' : 'Buscar OS, clientes, aparelhos...')} aria-label="Buscar no sistema" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={13} /></button>}</label><div className={s.topActions}><div className={s.notificationWrap}><button className={s.notificationButton} aria-label="Notificações" aria-expanded={showNotifications} onClick={() => setShowNotifications(!showNotifications)}><Bell size={20} /><i /></button>{showNotifications && <div className={s.notifications}><header className={s.panelHeader}><h2>Acompanhamento</h2><button className={s.iconButton} onClick={() => setShowNotifications(false)} aria-label="Fechar notificações"><X size={15} /></button></header>{notifications}</div>}</div><label className={s.monthSelect}><span className={s.srOnly}>Mês do painel</span><select value={monthKey(month)} onChange={e => setMonth(new Date(`${e.target.value}-01T12:00:00`))}>{Array.from({ length: 18 }, (_, i) => new Date(2026, 4 + i, 1)).map(d => <option key={monthKey(d)} value={monthKey(d)}>{d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}</option>)}</select><ChevronDown size={13} /></label><button className={s.primaryButton} onClick={onPrimary}><Plus size={16} />{primary || brand.primary}</button></div></header>{warning && <p className={s.storageWarning}>O armazenamento local está indisponível. As alterações durarão apenas nesta sessão.</p>}{!detail && <div className={s.pageHeading}><span className={s.eyebrow}>{brand.name} {brand.subtitle}</span><h1>{view}</h1><p>{view === 'Visão geral' ? brand.description : 'Acompanhe os detalhes e mantenha sua operação organizada.'}</p></div>}{children}<footer className={s.appFooter}><span>{brand.name} · {brand.subtitle}</span><small>Demonstração · dados salvos neste navegador</small></footer></main><Modal open={profile} title="Seu espaço de trabalho" onClose={() => setProfile(false)} footer={false}><div className={s.profileContent}><Photo slug={brand.slug} name="portrait" alt="Mariana Silva" /><h3>Mariana Silva</h3><p>Gerente · {brand.name}</p><button className={s.secondaryButton} type="button" onClick={onExport}>Exportar backup<Download size={15} /></button></div></Modal></div>;
}

export function Calendar({ month, events, onSelect, large = false }: { month: Date; events: { date: string; title: string }[]; onSelect: (date: string) => void; large?: boolean }) {
  const [display, setDisplay] = useState(month);
  useEffect(() => setDisplay(month), [month]);
  const year = display.getFullYear(), m = display.getMonth(), offset = new Date(year, m, 1).getDay(), count = new Date(year, m + 1, 0).getDate();
  const days = Array.from({ length: Math.ceil((count + offset) / 7) * 7 }, (_, i) => { const d = new Date(year, m, i - offset + 1); return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, day: d.getDate(), outside: d.getMonth() !== m }; });
  return <section className={`${s.panel} ${large ? s.bigCalendar : s.calendar}`}><header className={s.panelHeader}><h2>{display.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><div className={s.inline}><button className={s.squareButton} onClick={() => setDisplay(new Date(year, m - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={14} /></button><button className={s.squareButton} onClick={() => setDisplay(new Date(year, m + 1, 1))} aria-label="Próximo mês"><ChevronRight size={14} /></button></div></header><div className={s.calendarGrid}>{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(w => <span className={s.weekday} key={w}>{w}</span>)}{days.map(d => { const list = events.filter(e => e.date === d.date); return <button key={d.date} aria-label={day(d.date, { dateStyle: 'full' })} onClick={() => onSelect(d.date)} className={`${s.calendarDay} ${d.outside ? s.outside : ''} ${d.date === today ? s.activeDay : ''}`}><span>{d.day}</span>{large ? <div>{list.slice(0, 3).map((e, i) => <span className={s.calendarEvent} key={i}>{e.title}</span>)}{list.length > 3 && <small>+{list.length - 3}</small>}</div> : list.length > 0 && <i className={s.greenDot} />}</button>; })}</div></section>;
}
export function Finance({ entries, month, onDetails, summary = false }: { entries: Entry[]; month: Date; onDetails: () => void; summary?: boolean }) {
  const months = Array.from({ length: 6 }, (_, i) => new Date(month.getFullYear(), month.getMonth() - 5 + i, 1));
  const values = months.map(m => { const items = entries.filter(e => e.date.startsWith(monthKey(m))); return { revenue: items.filter(e => e.type === 'Receita').reduce((v, e) => v + e.amount, 0), costs: items.filter(e => e.type === 'Despesa').reduce((v, e) => v + e.amount, 0) }; });
  const max = Math.max(1, ...values.flatMap(v => [v.revenue, v.costs])); const current = values[5];
  return <Panel title={summary ? 'Vendas do mês' : 'Financeiro do mês'} action="Ver detalhes" onAction={onDetails}><div className={s.financeContent}><div className={s.financeChart}><strong>{money(current.revenue)}</strong><small>{summary ? 'vendas' : 'receita prevista'}</small><div className={s.bars}>{months.map((m, i) => <div key={monthKey(m)}><div className={s.barPair}><i style={{ height: `${Math.max(values[i].revenue / max * 100, 2)}%` }} />{!summary && <i style={{ height: `${Math.max(values[i].costs / max * 100, 2)}%` }} />}</div><span>{m.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div>)}</div></div><div className={s.legend}>{[['Receitas', current.revenue], ['Custos', current.costs], ['Resultado', current.revenue - current.costs]].map(([label, value], i) => <div key={label}><i style={{ background: ['#64735c', '#caa77e', '#423c2f'][i] }} /><span>{label}<b>{money(Number(value))}</b></span></div>)}</div></div></Panel>;
}
export function EntryTable({ entries, onEdit, onPaid }: { entries: Entry[]; onEdit: (id: string) => void; onPaid: (id: string) => void }) { return <Table headings={['Descrição', 'Categoria', 'Data', 'Valor', 'Situação']} rows={entries.map(e => [<button className={s.rowTitle} key="title" onClick={() => onEdit(e.id)}>{e.title}</button>, e.category, day(e.date), <span key="amount" className={e.type === 'Receita' ? s.income : s.outcome}>{e.type === 'Receita' ? '+' : '−'} {money(e.amount)}</span>, <button key="paid" onClick={() => onPaid(e.id)}><Badge>{e.paid ? 'Pago' : 'Pendente'}</Badge></button>])} />; }
