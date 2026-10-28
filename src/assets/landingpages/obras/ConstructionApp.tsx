'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDownRight, ArrowUpRight, Bell, Boxes, Building2, CalendarDays, Check, ChevronDown, ChevronRight, ClipboardCheck, Download, FileSpreadsheet, FileText, Flag, FolderOpen, HardHat, House, LayoutGrid, List, LocateFixed, Map as MapIcon, MapPin, MoreVertical, Package, Plus, RotateCcw, Search, ShoppingCart, SlidersHorizontal, Trash2, Truck, UserRound, Users, Wallet, X, type LucideIcon } from 'lucide-react';
import { BlocksArt, Building, CoinsArt, CraneArt, HelmetArt, MaterialIcon, RecifeMap } from './Art';
import { active, barColor, brl, cities, compact, contracted, dateLabel, dayKey, delivered, initials, makeSeed, stageColor, stages, stockStatus, storageKey, tones, uid, type Activity, type ActivityKind, type Doc, type Member, type Project, type Stage, type Store } from './data';
import s from './ConstructionApp.module.css';

type View = 'Início' | 'Obras' | 'Planejamento' | 'Orçamentos' | 'Financeiro' | 'Compras' | 'Estoque' | 'Fornecedores' | 'Clientes' | 'Documentos' | 'Relatórios';
type Tab = 'Resumo' | 'Cronograma' | 'Equipe' | 'Atividades' | 'Financeiro' | 'Documentos';
type Filter = 'Todas' | 'Em construção' | 'Lançamento' | 'Entregues' | 'Planejamento';
type Mode = 'Kanban' | 'Lista' | 'Mapa';
type FormKind = 'project' | 'activity' | 'entry' | 'purchase' | 'supplier' | 'client' | 'doc';
type Modal = { kind: FormKind; preset?: Record<string, string> } | { kind: 'team' } | null;
type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'time' | 'select'; options?: [string, string][]; required?: boolean; wide?: boolean };

const navigation: [View, LucideIcon][] = [['Início', House], ['Obras', Building2], ['Planejamento', CalendarDays], ['Orçamentos', FileText], ['Financeiro', Wallet], ['Compras', ShoppingCart], ['Estoque', Boxes], ['Fornecedores', Users], ['Clientes', UserRound], ['Documentos', FolderOpen], ['Relatórios', LayoutGrid]];
const filters: Filter[] = ['Todas', 'Em construção', 'Lançamento', 'Entregues', 'Planejamento'];
const filterFn: Record<Filter, (p: Project) => boolean> = { Todas: () => true, 'Em construção': p => p.stage !== 'Planejamento' && !delivered(p), Lançamento: p => p.launch, Entregues: delivered, Planejamento: p => p.stage === 'Planejamento' };
const kindStyle: Record<ActivityKind, [LucideIcon, string]> = { Concretagem: [HardHat, s.kRed], 'Entrega de materiais': [Truck, s.kAmber], Vistoria: [ClipboardCheck, s.kBlue], Reunião: [Users, s.kOrange] };
const cityCenter: Record<string, [number, number]> = { 'Recife - PE': [50, 50], 'Olinda - PE': [70, 24], 'Jaboatão - PE': [40, 86], 'Paulista - PE': [66, 10], 'Camaragibe - PE': [20, 38] };
const owner = { first: 'Rafael', name: 'Rafael Souza', role: 'Administrador' };
const DAY = 864e5;
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (q: string, ...values: (string | number)[]) => normalize(values.join(' ')).includes(normalize(q.trim()));
const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
const pct = (v: number) => `${Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
const relDay = (iso: string, now: number) => { const d = Math.round((new Date(dayKey(new Date(now))).getTime() - new Date(dayKey(iso)).getTime()) / DAY); return d === 0 ? 'Hoje' : d === 1 ? 'Ontem' : new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };

export default function ConstructionApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>('Início');
  const [drawer, setDrawer] = useState<{ id: string; tab: Tab } | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(0);
  const [mode, setMode] = useState<Mode>('Kanban');

  useEffect(() => {
    let saved: Store | null = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) saved = JSON.parse(raw); } catch { /* falls back to the demo data */ }
    // Clock and storage are read only after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now()); setStore(saved?.projects ? saved : makeSeed());
  }, []);
  useEffect(() => { if (store) try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* storage full or blocked */ } }, [store]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  if (!store) return <div className={s.app}><div className={s.loading}><Logo /></div></div>;

  const set = (change: (st: Store) => Partial<Store>, message?: string) => { setStore(prev => prev && { ...prev, ...change(prev) }); if (message) setToast(message); };
  const project = (id: string) => store.projects.find(p => p.id === id);
  const updateProject = (id: string, change: Partial<Project>, message?: string) => set(st => ({ projects: st.projects.map(p => p.id === id ? { ...p, ...change } : p) }), message);
  function move(id: string, stage: Stage) {
    const p = project(id); if (!p || p.stage === stage) return;
    updateProject(id, { stage }, `${p.name} movida para ${stage}.`);
  }
  function deliver(id: string) { const p = project(id)!; updateProject(id, { stage: 'Entrega', progress: 100, deliveredAt: new Date().toISOString(), phases: p.phases.map(ph => ({ ...ph, progress: 100 })) }, `${p.name} marcada como entregue.`); }
  function remove(id: string) {
    const p = project(id); if (!p || !confirm(`Excluir a obra ${p.name}? Atividades, documentos e lançamentos ligados a ela também serão removidos.`)) return;
    set(st => ({ projects: st.projects.filter(x => x.id !== id), activities: st.activities.filter(a => a.projectId !== id), docs: st.docs.filter(d => d.projectId !== id), entries: st.entries.filter(e => e.projectId !== id), purchases: st.purchases.filter(x => x.projectId !== id) }), `${p.name} excluída.`);
    setDrawer(null);
  }
  const openProject = (id: string, tab: Tab = 'Resumo') => setDrawer({ id, tab });
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const current = drawer && project(drawer.id);
  const projectOptions: [string, string][] = store.projects.map(p => [p.id, p.name]);

  function submit(kind: FormKind, v: Record<string, string>) {
    const n = (k: string) => Number(String(v[k]).replace(/\./g, '').replace(',', '.')) || 0;
    const iso = (k: string) => new Date(`${v[k]}T12:00:00`).toISOString();
    if (kind === 'project') {
      const [cx, cy] = cityCenter[v.city] ?? [50, 50], start = iso('start'), end = iso('end'), span = new Date(end).getTime() - new Date(start).getTime();
      const p: Project = { id: uid(), name: v.name, city: v.city, address: v.address, client: v.client, units: n('units'), stage: v.stage as Stage, launch: v.launch === 'sim', progress: 0, revenue: n('revenue'), cost: n('cost'), start, end, signedAt: new Date().toISOString(), createdAt: new Date().toISOString(), team: [], x: cx + (Math.random() * 10 - 5), y: cy + (Math.random() * 8 - 4), art: { floors: 4 + Math.floor(Math.random() * 6), tone: tones[Math.floor(Math.random() * tones.length)], wing: Math.random() > .5, sky: Math.floor(Math.random() * 3) as 0 | 1 | 2 }, phases: ['Fundação', 'Estrutura', 'Alvenaria', 'Instalações', 'Acabamento', 'Entrega'].map((name, k) => ({ id: uid(), name, start: new Date(new Date(start).getTime() + span * k / 6).toISOString(), end: new Date(new Date(start).getTime() + span * (k + 1) / 6).toISOString(), progress: 0 })) };
      set(st => ({ projects: [...st.projects, p] }), `${p.name} criada em ${p.stage}.`);
    }
    if (kind === 'activity') set(st => ({ activities: [...st.activities, { id: uid(), projectId: v.projectId, date: v.date, time: v.time, title: v.title, kind: v.kind as ActivityKind, done: false }] }), 'Atividade agendada.');
    if (kind === 'entry') set(st => ({ entries: [...st.entries, { id: uid(), projectId: v.projectId, date: iso('date'), type: v.type as 'Receita' | 'Custo', category: v.category, description: v.description, value: n('value') }] }), 'Lançamento registrado.');
    if (kind === 'purchase') set(st => ({ purchases: [...st.purchases, { id: uid(), materialId: v.materialId, projectId: v.projectId, quantity: n('quantity'), value: n('value'), date: iso('date'), status: 'Em trânsito' }], entries: [...st.entries, { id: uid(), projectId: v.projectId, date: iso('date'), type: 'Custo', category: 'Materiais', description: `Compra de ${st.materials.find(m => m.id === v.materialId)?.name}`, value: n('value') }] }), 'Compra registrada como em trânsito.');
    if (kind === 'supplier') set(st => ({ suppliers: [...st.suppliers, { id: uid(), name: v.name, category: v.category, contact: v.contact, phone: v.phone }] }), 'Fornecedor cadastrado.');
    if (kind === 'client') set(st => ({ clients: [...st.clients, { id: uid(), name: v.name, email: v.email, phone: v.phone, projectId: v.projectId, unit: v.unit, value: n('value') }] }), 'Cliente cadastrado.');
    if (kind === 'doc') set(st => ({ docs: [...st.docs, { id: uid(), name: v.name, kind: v.kind as Doc['kind'], size: v.kind === 'PDF' ? '1,2 MB' : '480 KB', date: new Date().toISOString(), projectId: v.projectId }] }), 'Documento adicionado.');
    setModal(null);
  }
  const forms: Record<FormKind, { title: string; fields: Field[]; initial: Record<string, string> }> = {
    project: { title: 'Nova obra', initial: { name: '', city: cities[0], address: '', client: '', units: '', revenue: '', cost: '', stage: 'Planejamento', launch: 'não', start: dayKey(new Date(now)), end: dayKey(new Date(now + 540 * DAY)) }, fields: [{ key: 'name', label: 'Nome do empreendimento', required: true, wide: true }, { key: 'city', label: 'Cidade', type: 'select', options: cities.map(c => [c, c]) }, { key: 'address', label: 'Endereço' }, { key: 'client', label: 'Incorporadora / cliente', required: true }, { key: 'units', label: 'Unidades', type: 'number' }, { key: 'revenue', label: 'Receita contratada (R$)', type: 'number', required: true }, { key: 'cost', label: 'Custo previsto (R$)', type: 'number', required: true }, { key: 'stage', label: 'Etapa', type: 'select', options: stages.map(x => [x, x]) }, { key: 'launch', label: 'Em lançamento (vendas)?', type: 'select', options: [['não', 'Não'], ['sim', 'Sim']] }, { key: 'start', label: 'Início', type: 'date', required: true }, { key: 'end', label: 'Entrega prevista', type: 'date', required: true }] },
    activity: { title: 'Nova atividade', initial: { title: '', projectId: store.projects[0]?.id ?? '', kind: 'Vistoria', date: dayKey(new Date(now)), time: '09:00' }, fields: [{ key: 'title', label: 'Atividade', required: true, wide: true }, { key: 'projectId', label: 'Obra', type: 'select', options: projectOptions }, { key: 'kind', label: 'Tipo', type: 'select', options: (Object.keys(kindStyle) as ActivityKind[]).map(k => [k, k]) }, { key: 'date', label: 'Data', type: 'date', required: true }, { key: 'time', label: 'Horário', type: 'time', required: true }] },
    entry: { title: 'Novo lançamento', initial: { type: 'Custo', projectId: store.projects[0]?.id ?? '', category: '', description: '', value: '', date: dayKey(new Date(now)) }, fields: [{ key: 'type', label: 'Tipo', type: 'select', options: [['Receita', 'Receita'], ['Custo', 'Custo']] }, { key: 'projectId', label: 'Obra', type: 'select', options: projectOptions }, { key: 'category', label: 'Categoria', required: true }, { key: 'value', label: 'Valor (R$)', type: 'number', required: true }, { key: 'description', label: 'Descrição', wide: true }, { key: 'date', label: 'Data', type: 'date', required: true }] },
    purchase: { title: 'Nova compra', initial: { materialId: store.materials[0]?.id ?? '', projectId: store.projects[0]?.id ?? '', quantity: '', value: '', date: dayKey(new Date(now + 3 * DAY)) }, fields: [{ key: 'materialId', label: 'Material', type: 'select', options: store.materials.map(m => [m.id, `${m.name} (${m.unit})`]) }, { key: 'projectId', label: 'Obra', type: 'select', options: projectOptions }, { key: 'quantity', label: 'Quantidade', type: 'number', required: true }, { key: 'value', label: 'Valor total (R$)', type: 'number', required: true }, { key: 'date', label: 'Previsão de entrega', type: 'date', required: true }] },
    supplier: { title: 'Novo fornecedor', initial: { name: '', category: '', contact: '', phone: '' }, fields: [{ key: 'name', label: 'Empresa', required: true }, { key: 'category', label: 'Categoria', required: true }, { key: 'contact', label: 'Contato' }, { key: 'phone', label: 'Telefone' }] },
    client: { title: 'Novo cliente', initial: { name: '', email: '', phone: '', projectId: store.projects[0]?.id ?? '', unit: '', value: '' }, fields: [{ key: 'name', label: 'Nome', required: true, wide: true }, { key: 'email', label: 'E-mail' }, { key: 'phone', label: 'Telefone' }, { key: 'projectId', label: 'Empreendimento', type: 'select', options: projectOptions }, { key: 'unit', label: 'Unidade', required: true }, { key: 'value', label: 'Valor do contrato (R$)', type: 'number' }] },
    doc: { title: 'Novo documento', initial: { name: '', kind: 'PDF', projectId: store.projects[0]?.id ?? '' }, fields: [{ key: 'name', label: 'Nome do documento', required: true, wide: true }, { key: 'kind', label: 'Formato', type: 'select', options: [['PDF', 'PDF'], ['XLSX', 'XLSX']] }, { key: 'projectId', label: 'Obra', type: 'select', options: projectOptions }] },
  };
  const docDownload = (d: Doc) => download(`${d.name}.txt`, `${d.name}\nObra: ${project(d.projectId)?.name ?? '—'}\nFormato original: ${d.kind} · ${d.size}\nData: ${dateLabel(d.date)}\n\nArquivo demonstrativo gerado pelo Átio. O documento original não está armazenado nesta demonstração.`, 'text/plain');
  const toggleMember = (m: Member) => set(st => ({ members: st.members.map(x => x.id === m.id ? { ...x, status: x.status === 'Em obra' ? 'Folga' : 'Em obra' } : x) }), `${m.name}: ${m.status === 'Em obra' ? 'folga' : 'em obra'}.`);
  const ctx = { store, now, openProject, move, remove, deliver, go, set, setModal, docDownload, toggleMember };

  return <div className={s.app}>
    <aside className={s.sidebar} aria-label="Navegação principal">
      <button className={s.brand} onClick={() => go('Início')} aria-label="Átio Construções, ir para o início"><Logo /><span>ÁTIO<small>CONSTRUÇÕES</small></span></button>
      <nav>{navigation.map(([name, Icon]) => <button key={name} className={view === name ? s.navActive : ''} onClick={() => go(name)} aria-current={view === name ? 'page' : undefined} title={name}><Icon size={19} strokeWidth={1.6} /><span>{name}</span></button>)}</nav>
      <div className={s.profile}><span className={s.profilePhoto}>{initials(owner.name)}</span><span><b>{owner.name}</b><small>{owner.role}</small></span></div>
    </aside>

    <main className={s.main}>
      <Header ctx={ctx} view={view} />
      {view === 'Início' && <>
        <Kpis ctx={ctx} />
        <div className={s.dashGrid}>
          <ProjectsSection ctx={ctx} mode={mode} setMode={setMode} compact />
          <aside className={s.side}><MapCard ctx={ctx} /><TodayCard ctx={ctx} /></aside>
        </div>
        <div className={s.bottomGrid}><FinanceChart ctx={ctx} /><StockCard ctx={ctx} /><TeamCard ctx={ctx} /><DocsCard ctx={ctx} /></div>
      </>}
      {view === 'Obras' && <ProjectsSection ctx={ctx} mode={mode} setMode={setMode} />}
      {view === 'Planejamento' && <PlanningView ctx={ctx} />}
      {view === 'Orçamentos' && <BudgetsView ctx={ctx} />}
      {view === 'Financeiro' && <FinanceView ctx={ctx} />}
      {view === 'Compras' && <PurchasesView ctx={ctx} />}
      {view === 'Estoque' && <StockView ctx={ctx} />}
      {view === 'Fornecedores' && <Table title="Fornecedores" action={['Novo fornecedor', () => setModal({ kind: 'supplier' })]} head={['Empresa', 'Categoria', 'Contato', 'Telefone', 'Materiais']} rows={store.suppliers.map(x => ({ key: x.id, cells: [<b key="n">{x.name}</b>, x.category, x.contact || '—', x.phone || '—', store.materials.filter(m => m.supplier === x.name).map(m => m.name).join(', ') || '—'] }))} />}
      {view === 'Clientes' && <Table title="Clientes" action={['Novo cliente', () => setModal({ kind: 'client' })]} head={['Cliente', 'Empreendimento', 'Unidade', 'Contato', 'Contrato']} numeric={[4]} rows={store.clients.map(c => ({ key: c.id, onClick: () => openProject(c.projectId), cells: [<span key="n" className={s.person}><Avatar name={c.name} tone="#c8642a" /><b>{c.name}</b></span>, project(c.projectId)?.name ?? '—', c.unit, <span key="c" className={s.stackText}>{c.email}<small>{c.phone}</small></span>, brl(c.value)] }))} />}
      {view === 'Documentos' && <Table title="Documentos" action={['Novo documento', () => setModal({ kind: 'doc' })]} head={['Documento', 'Obra', 'Formato', 'Data', '']} rows={[...store.docs].sort((a, b) => b.date.localeCompare(a.date)).map(d => ({ key: d.id, cells: [<span key="n" className={s.person}><DocIcon kind={d.kind} /><b>{d.name}</b></span>, project(d.projectId)?.name ?? '—', `${d.kind} · ${d.size}`, dateLabel(d.date), <button key="d" className={s.iconBtn} onClick={() => docDownload(d)} aria-label={`Baixar ${d.name}`}><Download size={16} /></button>] }))} />}
      {view === 'Relatórios' && <ReportsView ctx={ctx} />}
    </main>

    {modal && modal.kind !== 'team' && <FormModal key={modal.kind} {...forms[modal.kind]} preset={modal.preset} onClose={() => setModal(null)} onSubmit={v => submit(modal.kind, v)} />}
    {modal?.kind === 'team' && <TeamModal ctx={ctx} onClose={() => setModal(null)} />}
    {current && <ProjectDrawer key={current.id} ctx={ctx} project={current} tab={drawer!.tab} onTab={tab => setDrawer({ id: current.id, tab })} onClose={() => setDrawer(null)} onUpdate={(change, message) => updateProject(current.id, change, message)} />}
    {toast && <div className={s.toast} role="status"><Check size={15} />{toast}</div>}
  </div>;
}

type Ctx = { store: Store; now: number; openProject: (id: string, tab?: Tab) => void; move: (id: string, stage: Stage) => void; remove: (id: string) => void; deliver: (id: string) => void; go: (v: View) => void; set: (change: (st: Store) => Partial<Store>, message?: string) => void; setModal: (m: Modal) => void; docDownload: (d: Doc) => void; toggleMember: (m: Member) => void };

function Logo() {
  return <svg viewBox="0 0 40 40" className={s.logo} aria-hidden="true"><path d="M6 36 V16 L12 12 V36 M14 36 V8 L20 4 L26 8 V36 M28 36 V14 L34 18 V36" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /><path d="M17 14 h6 M17 20 h6 M17 26 h6" stroke="currentColor" strokeWidth="1.6" /><path d="M3 36 H37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>;
}
function Avatar({ name, tone, size = 26 }: { name: string; tone: string; size?: number }) {
  return <span className={s.avatar} style={{ background: tone, width: size, height: size, fontSize: size * .36 }} title={name}>{initials(name)}</span>;
}
function Avatars({ ids, members }: { ids: string[]; members: Member[] }) {
  const list = ids.map(id => members.find(m => m.id === id)).filter(Boolean) as Member[];
  return <span className={s.avatars}>{list.slice(0, 3).map(m => <Avatar key={m.id} name={m.name} tone={m.tone} />)}{list.length > 3 && <em>+{list.length - 3}</em>}{!list.length && <small>Sem equipe</small>}</span>;
}
function DocIcon({ kind }: { kind: Doc['kind'] }) { return <span className={kind === 'PDF' ? s.pdf : s.xlsx}>{kind === 'PDF' ? <FileText size={15} /> : <FileSpreadsheet size={15} />}</span>; }
function Pill({ tone, children }: { tone: 'green' | 'blue' | 'red' | 'amber' | 'gray' | 'purple'; children: ReactNode }) { return <em className={`${s.pill} ${s[tone]}`}>{children}</em>; }
function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);
  return ref;
}

function Header({ ctx, view }: { ctx: Ctx; view: View }) {
  const { store, now } = ctx;
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
    ...store.projects.filter(p => has(q, p.name, p.city, p.client)).map(p => ({ key: p.id, label: p.name, meta: `Obra · ${p.city}`, run: () => ctx.openProject(p.id) })),
    ...store.clients.filter(c => has(q, c.name, c.unit)).map(c => ({ key: c.id, label: c.name, meta: `Cliente · ${c.unit}`, run: () => ctx.go('Clientes') })),
    ...store.suppliers.filter(x => has(q, x.name, x.category)).map(x => ({ key: x.id, label: x.name, meta: `Fornecedor · ${x.category}`, run: () => ctx.go('Fornecedores') })),
    ...store.materials.filter(m => has(q, m.name, m.supplier)).map(m => ({ key: m.id, label: m.name, meta: `Material · ${m.supplier}`, run: () => ctx.go('Estoque') })),
  ].slice(0, 8) : [];
  const late = store.projects.filter(p => !delivered(p) && new Date(p.end).getTime() < now);
  const low = store.materials.filter(m => stockStatus(m, store.purchases) === 'Estoque baixo');
  const today = store.activities.filter(a => a.date === dayKey(new Date(now)) && !a.done);
  const alerts = [...late.map(p => ({ key: p.id, text: `${p.name}: entrega prevista para ${dateLabel(p.end)} já passou`, run: () => ctx.openProject(p.id) })), ...low.map(m => ({ key: m.id, text: `${m.name} abaixo do estoque mínimo (${m.quantity} ${m.unit})`, run: () => ctx.go('Estoque') })), ...(today.length ? [{ key: 'today', text: `${today.length} atividades programadas para hoje`, run: () => ctx.go('Planejamento') }] : [])];
  return <header className={s.header} ref={ref}>
    <div className={s.greeting}>{view === 'Início' ? <><h1>Olá, {owner.first}! <span aria-hidden="true">👋</span></h1><p>Aqui está o resumo das suas obras e da sua construtora hoje.</p></> : <><h1>{view}</h1><p>Átio Construções</p></>}</div>
    <div className={s.search}>
      <Search size={17} />
      <input ref={input} value={query} onChange={e => { setQuery(e.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} placeholder="Buscar obra, cliente, fornecedor..." aria-label="Buscar obra, cliente ou fornecedor" />
      <kbd>⌘ K</kbd>
      {panel === 'search' && q && <div className={`${s.popover} ${s.searchPop}`}>{results.map(r => <button key={r.key} onClick={() => { r.run(); setPanel(null); setQuery(''); }}><b>{r.label}</b><small>{r.meta}</small></button>)}{!results.length && <p className={s.empty}>Nada encontrado para “{q}”.</p>}</div>}
    </div>
    <div className={s.bellWrap}>
      <button className={s.round} onClick={() => setPanel(panel === 'bell' ? null : 'bell')} aria-label={`Notificações, ${alerts.length}`} aria-expanded={panel === 'bell'}><Bell size={19} />{alerts.length > 0 && <i className={s.dot} />}</button>
      {panel === 'bell' && <div className={s.popover}><p className={s.popTitle}>Notificações</p>{alerts.map(a => <button key={a.key} className={s.alert} onClick={() => { a.run(); setPanel(null); }}><i />{a.text}</button>)}{!alerts.length && <p className={s.empty}>Nenhum alerta no momento.</p>}</div>}
    </div>
    <div className={s.split}>
      <button className={s.primary} onClick={() => ctx.setModal({ kind: 'project' })}><Plus size={18} />Nova obra</button>
      <button className={s.primary} onClick={() => setPanel(panel === 'new' ? null : 'new')} aria-label="Mais opções de cadastro" aria-expanded={panel === 'new'}><ChevronDown size={17} /></button>
      {panel === 'new' && <div className={`${s.popover} ${s.menuPop}`} role="menu">{([['project', 'Nova obra'], ['activity', 'Nova atividade'], ['purchase', 'Nova compra'], ['entry', 'Novo lançamento'], ['doc', 'Novo documento']] as [FormKind, string][]).map(([k, l]) => <button role="menuitem" key={k} onClick={() => { ctx.setModal({ kind: k }); setPanel(null); }}>{l}</button>)}</div>}
    </div>
  </header>;
}

function Kpis({ ctx }: { ctx: Ctx }) {
  const { store, now } = ctx;
  const k = contracted(store.projects, now);
  const running = store.projects.filter(active).length;
  const delta = (v: number, good: boolean) => <p className={good ? s.up : s.down}>{v >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}<b>{pct(v)}</b> vs. 30 dias atrás</p>;
  return <section className={s.kpis} aria-label="Indicadores">
    <article className={s.kpi}><CoinsArt /><div><h2>Receita contratada</h2><strong><small>R$</small>{Math.round(k.revenue).toLocaleString('pt-BR')}</strong>{delta(k.dRevenue, k.dRevenue >= 0)}</div><KpiMenu ctx={ctx} view="Financeiro" /></article>
    <article className={s.kpi}><BlocksArt /><div><h2>Custo das obras</h2><strong><small>R$</small>{Math.round(k.cost).toLocaleString('pt-BR')}</strong>{delta(k.dCost, k.dCost <= 0)}</div><KpiMenu ctx={ctx} view="Orçamentos" /></article>
    <article className={s.kpi}><HelmetArt /><div><h2>Margem projetada</h2><strong><small>R$</small>{Math.round(k.margin).toLocaleString('pt-BR')}</strong>{delta(k.dMargin, k.dMargin >= 0)}</div><span className={s.ring} style={{ background: `conic-gradient(#c8803e ${k.share * 3.6}deg, #f1e3d2 0)` }} role="img" aria-label={`Margem de ${pct(k.share)}`}><b>{pct(k.share)}</b></span></article>
    <article className={s.kpi}><CraneArt /><div><h2>Obras em andamento</h2><strong>{running}</strong><p className={s.neutral}>de {store.projects.length} empreendimentos</p></div><KpiMenu ctx={ctx} view="Obras" /></article>
  </section>;
}
function KpiMenu({ ctx, view }: { ctx: Ctx; view: View }) { return <button className={s.kpiMore} onClick={() => ctx.go(view)} aria-label={`Ver ${view}`} title={`Ver ${view}`}><MoreVertical size={17} /></button>; }

function ProjectsSection({ ctx, mode, setMode, compact: isCompact = false }: { ctx: Ctx; mode: Mode; setMode: (m: Mode) => void; compact?: boolean }) {
  const { store } = ctx;
  const [filter, setFilter] = useState<Filter>('Todas');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState<'end' | 'progress' | 'name'>('end');
  const [showFilters, setShowFilters] = useState(false);
  const closeFilters = useMemo(() => () => setShowFilters(false), []);
  const ref = useOutside(showFilters, closeFilters);
  const list = store.projects.filter(p => filterFn[filter](p) && (!city || p.city === city)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'progress' ? b.progress - a.progress : a.end.localeCompare(b.end));
  return <section className={s.projects}>
    <div className={s.projectsHead}>
      <h2>Obras</h2>
      <div className={s.tabs} role="tablist">{filters.map(f => <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? s.tabOn : ''} onClick={() => setFilter(f)}>{f}<span>{store.projects.filter(filterFn[f]).length}</span></button>)}</div>
      <div className={s.tools}><div className={s.modes}>{([['Kanban', LayoutGrid], ['Lista', List], ['Mapa', MapIcon]] as [Mode, LucideIcon][]).map(([m, Icon]) => <button key={m} aria-pressed={mode === m} className={mode === m ? s.modeOn : ''} onClick={() => setMode(m)}><Icon size={15} />{m}</button>)}</div>
      <div className={s.filterWrap} ref={ref}>
        <button className={`${s.ghostBtn} ${city ? s.ghostOn : ''}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={15} />Filtros{city && <i className={s.countDot}>1</i>}</button>
        {showFilters && <div className={`${s.popover} ${s.filterPop}`}>
          <label className={s.field}><span>Cidade</span><select value={city} onChange={e => setCity(e.target.value)}><option value="">Todas as cidades</option>{cities.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className={s.field}><span>Ordenar por</span><select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="end">Entrega mais próxima</option><option value="progress">Maior avanço</option><option value="name">Nome</option></select></label>
          {city && <button className={s.link} onClick={() => setCity('')}>Limpar filtros</button>}
        </div>}
      </div></div>
    </div>
    {mode === 'Kanban' && <Kanban ctx={ctx} list={list} limit={isCompact ? 2 : 0} />}
    {mode === 'Lista' && <div className={s.card}><ProjectTable ctx={ctx} list={list} /></div>}
    {mode === 'Mapa' && <div className={`${s.card} ${s.bigMap}`}><MapCanvas ctx={ctx} list={list} callouts={list.length} /></div>}
  </section>;
}

function Kanban({ ctx, list, limit }: { ctx: Ctx; list: Project[]; limit: number }) {
  const [dragging, setDragging] = useState<Project | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const closeMenu = useMemo(() => () => setMenu(null), []);
  const ref = useOutside(!!menu, closeMenu);
  function start(e: DragEvent<HTMLElement>, p: Project) {
    e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move';
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.classList.add(s.ghost); ghost.style.width = `${e.currentTarget.offsetWidth}px`;
    e.currentTarget.parentElement?.appendChild(ghost);
    const box = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setDragImage(ghost, e.clientX - box.left, e.clientY - box.top);
    setTimeout(() => ghost.remove());
    setDragging(p); setMenu(null);
  }
  return <div className={s.kanban} ref={ref}>{stages.map(stage => {
    const items = list.filter(p => p.stage === stage), shown = limit ? items.slice(0, limit) : items, target = over === stage && dragging && dragging.stage !== stage;
    return <div key={stage} className={`${s.column} ${target ? s.columnOver : ''}`} style={{ '--tint': stageColor[stage] } as React.CSSProperties} onDragOver={e => { e.preventDefault(); if (over !== stage) setOver(stage); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) ctx.move(id, stage); setDragging(null); setOver(null); }}>
      <header><i style={{ background: stageColor[stage] }} /><span><b>{stage}</b><small>{items.length} {items.length === 1 ? 'obra' : 'obras'}</small></span><button className={s.addCol} onClick={() => ctx.setModal({ kind: 'project', preset: { stage } })} aria-label={`Nova obra em ${stage}`}><Plus size={17} /></button></header>
      <div className={s.colCards}>
        {target && <div className={s.dropZone} aria-hidden="true" />}
        {shown.map(p => <ProjectCard key={p.id} ctx={ctx} p={p} dragging={dragging?.id === p.id} menuOpen={menu === p.id} onMenu={() => setMenu(menu === p.id ? null : p.id)} onDragStart={e => start(e, p)} onDragEnd={() => { setDragging(null); setOver(null); }} />)}
        {limit > 0 && items.length > limit && <button className={s.more} onClick={() => ctx.go('Obras')}>Ver mais {items.length - limit}</button>}
        {!items.length && !target && <p className={s.emptyCol}>Arraste uma obra para cá</p>}
      </div>
    </div>;
  })}</div>;
}

function ProjectCard({ ctx, p, dragging, menuOpen, onMenu, onDragStart, onDragEnd }: { ctx: Ctx; p: Project; dragging: boolean; menuOpen: boolean; onMenu: () => void; onDragStart: (e: DragEvent<HTMLElement>) => void; onDragEnd: () => void }) {
  const done = delivered(p);
  const late = !done && new Date(p.end).getTime() < ctx.now;
  const next = stages[stages.indexOf(p.stage) + 1];
  return <article className={`${s.pcard} ${dragging ? s.pcardDragging : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <button className={s.cover} onClick={() => ctx.openProject(p.id)} aria-label={`Abrir ${p.name}`}><Building art={p.art} className={s.coverArt} /></button>
    <div className={s.menu}>
      <button className={s.coverMore} onClick={onMenu} aria-label={`Ações de ${p.name}`} aria-expanded={menuOpen}><MoreVertical size={15} /></button>
      {menuOpen && <div className={s.menuList} role="menu">
        <button role="menuitem" onClick={() => { onMenu(); ctx.openProject(p.id); }}>Abrir obra</button>
        {next && <button role="menuitem" onClick={() => { onMenu(); ctx.move(p.id, next); }}>Mover para {next}</button>}
        {p.stage === 'Entrega' && !done && <button role="menuitem" onClick={() => { onMenu(); ctx.deliver(p.id); }}>Marcar como entregue</button>}
        <button role="menuitem" onClick={() => { onMenu(); ctx.openProject(p.id, 'Equipe'); }}>Gerenciar equipe</button>
        <button role="menuitem" className={s.danger} onClick={() => { onMenu(); ctx.remove(p.id); }}>Excluir</button>
      </div>}
    </div>
    <button className={s.pbody} onClick={() => ctx.openProject(p.id)}>
      <b>{p.name}</b><small><MapPin size={13} />{p.city}</small>
      <span className={s.progress}><i><em style={{ width: `${p.progress}%`, background: done ? '#22b573' : barColor[p.stage] }} /></i><b>{p.progress}%</b></span>
    </button>
    {done ? <p className={s.deliveredTag}><CalendarDays size={14} />Entregue em {dateLabel(p.deliveredAt ?? p.end)}</p> : <div className={s.dates}>
      <span><CalendarDays size={16} /><span>Início<b>{dateLabel(p.start)}</b></span></span>
      <span className={late ? s.late : ''}><Flag size={16} /><span>Entrega<b>{dateLabel(p.end)}</b></span></span>
    </div>}
    <div className={s.pfoot}><Avatars ids={p.team} members={ctx.store.members} /><button className={s.iconBtn} onClick={onMenu} aria-label={`Mais ações de ${p.name}`}><MoreVertical size={16} /></button></div>
  </article>;
}

function ProjectTable({ ctx, list }: { ctx: Ctx; list: Project[] }) {
  return <div className={s.tableWrap}><table className={s.table}>
    <thead><tr><th>Obra</th><th>Cidade</th><th>Etapa</th><th>Avanço</th><th>Início</th><th>Entrega</th><th className={s.num}>Receita</th><th className={s.num}>Margem</th></tr></thead>
    <tbody>{list.map(p => <tr key={p.id} onClick={() => ctx.openProject(p.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && ctx.openProject(p.id)}>
      <td><span className={s.person}><Building art={p.art} className={s.thumb} /><b>{p.name}</b></span></td><td>{p.city}</td>
      <td><span className={s.stage}><i style={{ background: stageColor[p.stage] }} />{delivered(p) ? 'Entregue' : p.stage}</span></td>
      <td><span className={s.progress}><i><em style={{ width: `${p.progress}%`, background: delivered(p) ? '#22b573' : barColor[p.stage] }} /></i><b>{p.progress}%</b></span></td>
      <td>{dateLabel(p.start)}</td><td>{dateLabel(p.end)}</td><td className={s.num}>{brl(p.revenue)}</td><td className={s.num}>{pct((p.revenue - p.cost) / p.revenue * 100)}</td>
    </tr>)}</tbody>
  </table>{!list.length && <p className={s.empty}>Nenhuma obra com esses filtros.</p>}</div>;
}

function MapCanvas({ ctx, list, callouts }: { ctx: Ctx; list: Project[]; callouts: number }) {
  // Callouts go to the first projects in the list whose pins are far enough apart to keep labels readable.
  const labelled = new Set<string>();
  for (const p of list) {
    if (labelled.size >= callouts) break;
    if (list.every(q => !labelled.has(q.id) || Math.hypot(q.x - p.x, (q.y - p.y) * 1.4) > 22)) labelled.add(p.id);
  }
  return <div className={s.mapCanvas}>
    <RecifeMap className={s.mapArt} />
    {list.map(p => { const color = delivered(p) ? '#22b573' : stageColor[p.stage]; return <button key={p.id} className={`${s.pin} ${labelled.has(p.id) ? s.pinLabel : ''} ${p.x > 62 ? s.pinLeft : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => ctx.openProject(p.id)} aria-label={`${p.name}, ${p.stage}`}>
      <MapPin size={26} fill={color} color="#fff" strokeWidth={1.6} />
      {labelled.has(p.id) && <span><b>{p.name.replace(/^(Residencial|Condomínio|Edifício) /, '')}</b><small style={{ color }}>{delivered(p) ? 'Entregue' : p.stage}</small></span>}
    </button>; })}
  </div>;
}

function MapCard({ ctx }: { ctx: Ctx }) {
  const [order, setOrder] = useState<'recent' | 'running' | 'all'>('recent');
  const list = [...ctx.store.projects].filter(p => order !== 'running' || active(p)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Mapa das obras</h2><select className={s.chipSelect} value={order} onChange={e => setOrder(e.target.value as typeof order)} aria-label="Obras no mapa"><option value="recent">Mais recentes</option><option value="running">Em andamento</option><option value="all">Todas</option></select></div>
    <div className={s.mapBox}><MapCanvas ctx={ctx} list={order === 'all' ? list : list.slice(0, 6)} callouts={4} /><button className={s.locate} onClick={() => ctx.go('Obras')} aria-label="Abrir mapa completo"><LocateFixed size={16} /></button></div>
  </section>;
}

function TodayCard({ ctx }: { ctx: Ctx }) {
  const { store, now } = ctx;
  const today = store.activities.filter(a => a.date === dayKey(new Date(now))).sort((a, b) => a.time.localeCompare(b.time));
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Atividades de hoje</h2><button className={s.chipBtn} onClick={() => ctx.go('Planejamento')}>Ver todas</button></div>
    <ul className={s.activities}>{today.map(a => <ActivityRow key={a.id} ctx={ctx} a={a} />)}{!today.length && <li className={s.empty}>Nenhuma atividade para hoje. <button className={s.link} onClick={() => ctx.setModal({ kind: 'activity' })}>Agendar</button></li>}</ul>
  </section>;
}
function ActivityRow({ ctx, a, showDate = false }: { ctx: Ctx; a: Activity; showDate?: boolean }) {
  const [Icon, tone] = kindStyle[a.kind];
  const p = ctx.store.projects.find(x => x.id === a.projectId);
  return <li className={`${s.activity} ${a.done ? s.activityDone : ''}`}>
    <button className={`${s.kindIcon} ${tone}`} onClick={() => ctx.set(st => ({ activities: st.activities.map(x => x.id === a.id ? { ...x, done: !x.done } : x) }), a.done ? 'Atividade reaberta.' : 'Atividade concluída.')} aria-label={a.done ? `Reabrir ${a.title}` : `Concluir ${a.title}`} title={a.done ? 'Reabrir' : 'Marcar como concluída'}>{a.done ? <Check size={17} /> : <Icon size={17} />}</button>
    <time>{showDate && <small>{new Date(`${a.date}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small>}{a.time}</time>
    <button className={s.activityText} onClick={() => p && ctx.openProject(p.id, 'Atividades')}><b>{a.title}</b><small>{p?.name ?? '—'}</small><ChevronRight size={17} /></button>
  </li>;
}

function FinanceChart({ ctx }: { ctx: Ctx }) {
  const years = [...new Set(ctx.store.entries.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0] ?? new Date(ctx.now).getFullYear());
  const [hover, setHover] = useState<number | null>(null);
  const months = Array.from({ length: 12 }, (_, m) => {
    const list = ctx.store.entries.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === m; });
    const revenue = list.filter(e => e.type === 'Receita').reduce((v, e) => v + e.value, 0), cost = list.filter(e => e.type === 'Custo').reduce((v, e) => v + e.value, 0);
    return { label: new Date(year, m, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), revenue, cost, profit: revenue - cost };
  });
  const peak = Math.max(...months.map(m => Math.max(m.revenue, m.cost)), 1);
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Evolução financeira</h2><select className={s.chipSelect} value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Ano">{years.map(y => <option key={y}>{y}</option>)}</select></div>
    <div className={s.chart}>{months.map((m, i) => {
      const profit = Math.max(0, m.profit), cost = Math.min(m.cost, m.revenue || m.cost);
      return <div key={m.label} className={s.barCol} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={m.revenue || m.cost ? 0 : -1}>
        {hover === i && (m.revenue || m.cost) > 0 && <span className={s.tip}>Receita<b>{compact(m.revenue)}</b><small>Custo {compact(m.cost)} · Lucro {compact(m.profit)}</small></span>}
        <div className={s.bar} style={{ height: `${Math.max(m.revenue, m.cost) / peak * 100}%` }}>
          {m.revenue > 0 && <i className={s.barRevenue} />}
          <i className={s.barCost} style={{ flexGrow: cost }} /><i className={s.barProfit} style={{ flexGrow: profit }} />
        </div>
        <small>{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</small>
      </div>;
    })}</div>
    <div className={s.legend}><span><i className={s.lRevenue} />Receita</span><span><i className={s.lCost} />Custo</span><span><i className={s.lProfit} />Lucro</span></div>
  </section>;
}

function StockCard({ ctx }: { ctx: Ctx }) {
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Compras e estoque</h2><button className={s.chipBtn} onClick={() => ctx.go('Estoque')}>Ver todas</button></div>
    <ul className={s.rows}>{ctx.store.materials.slice(0, 4).map(m => { const st = stockStatus(m, ctx.store.purchases); return <li key={m.id}><span className={s.matIcon}><MaterialIcon icon={m.icon} /></span><span className={s.stackText}><b>{m.name}</b><small>{m.supplier}</small></span><small className={s.qty}>{m.quantity.toLocaleString('pt-BR')} {m.unit}</small><Pill tone={st === 'Em estoque' ? 'green' : st === 'Em trânsito' ? 'blue' : 'red'}>{st}</Pill></li>; })}</ul>
  </section>;
}
function TeamCard({ ctx }: { ctx: Ctx }) {
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Equipe em campo</h2><button className={s.chipBtn} onClick={() => ctx.setModal({ kind: 'team' })}>Ver todas</button></div>
    <ul className={s.rows}>{ctx.store.members.slice(0, 4).map(m => <li key={m.id}><Avatar name={m.name} tone={m.tone} size={32} /><span className={s.stackText}><b>{m.name}</b><small>{m.role}</small></span><button className={`${s.status} ${m.status === 'Em obra' ? s.statusOn : ''}`} onClick={() => ctx.toggleMember(m)} title="Alternar status"><i />{m.status}</button></li>)}</ul>
  </section>;
}
function DocsCard({ ctx }: { ctx: Ctx }) {
  return <section className={s.card}>
    <div className={s.cardHead}><h2>Documentos recentes</h2><button className={s.chipBtn} onClick={() => ctx.go('Documentos')}>Ver todas</button></div>
    <ul className={s.rows}>{[...ctx.store.docs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map(d => <li key={d.id}><DocIcon kind={d.kind} /><span className={s.stackText}><b>{d.name}</b><small>{d.kind} • {d.size}</small></span><small className={s.qty}>{relDay(d.date, ctx.now)}</small><button className={s.iconBtn} onClick={() => ctx.docDownload(d)} aria-label={`Baixar ${d.name}`}><Download size={16} /></button></li>)}</ul>
  </section>;
}

function TeamModal({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  return <Shell title="Equipe em campo" onClose={onClose}>
    <ul className={s.rows}>{ctx.store.members.map(m => <li key={m.id}><Avatar name={m.name} tone={m.tone} size={32} /><span className={s.stackText}><b>{m.name}</b><small>{m.role}</small></span>
      <select className={s.inlineSelect} value={m.projectId} onChange={e => ctx.set(st => ({ members: st.members.map(x => x.id === m.id ? { ...x, projectId: e.target.value } : x) }), `${m.name} alocado.`)} aria-label={`Obra de ${m.name}`}>{ctx.store.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <button className={`${s.status} ${m.status === 'Em obra' ? s.statusOn : ''}`} onClick={() => ctx.toggleMember(m)}><i />{m.status}</button></li>)}</ul>
  </Shell>;
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={s.modal} aria-describedby={undefined}>
      <header className={s.modalHead}><Dialog.Title>{title}</Dialog.Title><Dialog.Close className={s.round} aria-label="Fechar"><X size={17} /></Dialog.Close></header>
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
          : <input type={f.type === 'number' ? 'text' : f.type ?? 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} required={f.required} value={values[f.key]} onChange={e => setValues({ ...values, [f.key]: f.type === 'number' ? e.target.value.replace(/[^\d,.]/g, '') : e.target.value })} />}
      </label>)}
      <footer className={s.modalFoot}><Dialog.Close className={s.secondary} type="button">Cancelar</Dialog.Close><button className={s.primary} type="submit">Salvar</button></footer>
    </form>
  </Shell>;
}

function ProjectDrawer({ ctx, project: p, tab, onTab, onClose, onUpdate }: { ctx: Ctx; project: Project; tab: Tab; onTab: (t: Tab) => void; onClose: () => void; onUpdate: (change: Partial<Project>, message?: string) => void }) {
  const { store } = ctx;
  const [form, setForm] = useState({ name: p.name, city: p.city, address: p.address, client: p.client, units: String(p.units), revenue: String(p.revenue), cost: String(p.cost), start: dayKey(p.start), end: dayKey(p.end), launch: p.launch });
  const spent = store.entries.filter(e => e.projectId === p.id && e.type === 'Custo').reduce((v, e) => v + e.value, 0);
  const received = store.entries.filter(e => e.projectId === p.id && e.type === 'Receita').reduce((v, e) => v + e.value, 0);
  const done = delivered(p), next = stages[stages.indexOf(p.stage) + 1];
  const activities = store.activities.filter(a => a.projectId === p.id).sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
  return <Dialog.Root open onOpenChange={v => !v && onClose()}><Dialog.Portal><Dialog.Overlay className={s.overlay} />
    <Dialog.Content className={s.drawer} aria-describedby={undefined}>
      <div className={s.drawerCover}><Building art={p.art} className={s.coverArt} /><Dialog.Close className={`${s.round} ${s.drawerClose}`} aria-label="Fechar"><X size={17} /></Dialog.Close></div>
      <header className={s.drawerHead}>
        <span className={s.stage}><i style={{ background: done ? '#22b573' : stageColor[p.stage] }} />{done ? `Entregue em ${dateLabel(p.deliveredAt ?? p.end)}` : p.stage}{p.launch && <Pill tone="purple">Lançamento</Pill>}</span>
        <Dialog.Title>{p.name}</Dialog.Title>
        <p><MapPin size={13} />{p.address} · {p.city}</p>
        <span className={s.progress}><i><em style={{ width: `${p.progress}%`, background: done ? '#22b573' : barColor[p.stage] }} /></i><b>{p.progress}%</b></span>
      </header>
      <nav className={s.dTabs} role="tablist">{(['Resumo', 'Cronograma', 'Equipe', 'Atividades', 'Financeiro', 'Documentos'] as Tab[]).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? s.dTabOn : ''} onClick={() => onTab(t)}>{t}</button>)}</nav>
      <div className={s.drawerBody}>
        {tab === 'Resumo' && <form className={s.form} onSubmit={e => { e.preventDefault(); const num = (v: string) => Number(v.replace(/\./g, '').replace(',', '.')) || 0; onUpdate({ ...form, units: num(form.units), revenue: num(form.revenue), cost: num(form.cost), start: new Date(`${form.start}T12:00`).toISOString(), end: new Date(`${form.end}T12:00`).toISOString() }, 'Obra atualizada.'); }}>
          <div className={s.stats}><span>Receita contratada<b>{brl(p.revenue)}</b></span><span>Custo previsto<b>{brl(p.cost)}</b></span><span>Margem<b>{brl(p.revenue - p.cost)}</b><small>{pct((p.revenue - p.cost) / (p.revenue || 1) * 100)}</small></span></div>
          <label className={`${s.field} ${s.wide}`}><span>Avanço físico: {p.progress}%</span><input type="range" min="0" max="100" step="1" value={p.progress} onChange={e => onUpdate({ progress: Number(e.target.value), deliveredAt: Number(e.target.value) >= 100 ? p.deliveredAt ?? new Date().toISOString() : undefined })} /></label>
          <label className={`${s.field} ${s.wide}`}><span>Nome</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className={s.field}><span>Cidade</span><select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>{cities.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className={s.field}><span>Endereço</span><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label className={s.field}><span>Incorporadora / cliente</span><input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></label>
          <label className={s.field}><span>Unidades</span><input inputMode="numeric" value={form.units} onChange={e => setForm({ ...form, units: e.target.value.replace(/\D/g, '') })} /></label>
          <label className={s.field}><span>Receita contratada (R$)</span><input inputMode="decimal" value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
          <label className={s.field}><span>Custo previsto (R$)</span><input inputMode="decimal" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value.replace(/[^\d,.]/g, '') })} /></label>
          <label className={s.field}><span>Início</span><input type="date" required value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></label>
          <label className={s.field}><span>Entrega prevista</span><input type="date" required value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></label>
          <label className={`${s.check} ${s.wide}`}><input type="checkbox" checked={form.launch} onChange={e => setForm({ ...form, launch: e.target.checked })} />Empreendimento em lançamento (vendas abertas)</label>
          <div className={s.wide}><button className={s.secondary} type="submit">Salvar alterações</button></div>
        </form>}
        {tab === 'Cronograma' && <div className={s.stack}>
          <p className={s.hint}>O avanço de cada etapa é informado pela equipe; o avanço físico da obra é ajustado na aba Resumo.</p>
          {p.phases.map(ph => <div key={ph.id} className={s.phase}>
            <span><b>{ph.name}</b><small>{dateLabel(ph.start)} – {dateLabel(ph.end)}</small></span>
            <input type="range" min="0" max="100" value={ph.progress} onChange={e => onUpdate({ phases: p.phases.map(x => x.id === ph.id ? { ...x, progress: Number(e.target.value) } : x) })} aria-label={`Avanço de ${ph.name}`} />
            <em>{ph.progress}%</em>
          </div>)}
        </div>}
        {tab === 'Equipe' && <ul className={s.rows}>{store.members.map(m => { const on = p.team.includes(m.id); return <li key={m.id}><Avatar name={m.name} tone={m.tone} size={32} /><span className={s.stackText}><b>{m.name}</b><small>{m.role}</small></span><button className={`${s.toggle} ${on ? s.toggleOn : ''}`} onClick={() => onUpdate({ team: on ? p.team.filter(x => x !== m.id) : [...p.team, m.id] }, on ? `${m.name} saiu da equipe.` : `${m.name} adicionado à equipe.`)} aria-pressed={on}>{on ? <><Check size={14} />Na equipe</> : <><Plus size={14} />Adicionar</>}</button></li>; })}</ul>}
        {tab === 'Atividades' && <div className={s.stack}><button className={s.secondary} onClick={() => ctx.setModal({ kind: 'activity', preset: { projectId: p.id } })}><Plus size={15} />Nova atividade</button><ul className={s.activities}>{activities.map(a => <ActivityRow key={a.id} ctx={ctx} a={a} showDate />)}{!activities.length && <li className={s.empty}>Nenhuma atividade agendada.</li>}</ul></div>}
        {tab === 'Financeiro' && <div className={s.stack}>
          <div className={s.stats}><span>Recebido<b>{brl(received)}</b></span><span>Custo realizado<b>{brl(spent)}</b><small>{pct(spent / (p.cost || 1) * 100)} do previsto</small></span><span>Saldo<b>{brl(received - spent)}</b></span></div>
          <button className={s.secondary} onClick={() => ctx.setModal({ kind: 'entry', preset: { projectId: p.id } })}><Plus size={15} />Novo lançamento</button>
          <ul className={s.rows}>{store.entries.filter(e => e.projectId === p.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(e => <li key={e.id}><span className={s.stackText}><b>{e.description || e.category}</b><small>{e.category} · {dateLabel(e.date)}</small></span><b className={e.type === 'Receita' ? s.pos : s.neg}>{e.type === 'Receita' ? '+' : '−'} {brl(e.value)}</b></li>)}</ul>
        </div>}
        {tab === 'Documentos' && <div className={s.stack}><button className={s.secondary} onClick={() => ctx.setModal({ kind: 'doc', preset: { projectId: p.id } })}><Plus size={15} />Novo documento</button><ul className={s.rows}>{store.docs.filter(d => d.projectId === p.id).map(d => <li key={d.id}><DocIcon kind={d.kind} /><span className={s.stackText}><b>{d.name}</b><small>{d.kind} • {d.size} · {dateLabel(d.date)}</small></span><button className={s.iconBtn} onClick={() => ctx.docDownload(d)} aria-label={`Baixar ${d.name}`}><Download size={16} /></button></li>)}{!store.docs.some(d => d.projectId === p.id) && <li className={s.empty}>Nenhum documento.</li>}</ul></div>}
      </div>
      <footer className={s.drawerFoot}>
        <button className={s.dangerBtn} onClick={() => ctx.remove(p.id)}><Trash2 size={15} />Excluir</button>
        {done ? <span className={s.closed}><Check size={15} />Obra entregue</span> : next ? <button className={s.primary} onClick={() => ctx.move(p.id, next)}>Mover para {next}<ChevronRight size={16} /></button> : <button className={s.primary} onClick={() => ctx.deliver(p.id)}><Check size={16} />Marcar como entregue</button>}
      </footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

function Table({ title, head, rows, action, numeric = [], extra }: { title: string; head: string[]; rows: { key: string; cells: ReactNode[]; onClick?: () => void }[]; action?: [string, () => void]; numeric?: number[]; extra?: ReactNode }) {
  return <section className={s.card}>
    <div className={s.cardHead}><h2>{title}</h2><div className={s.headActions}>{extra}{action && <button className={s.primarySm} onClick={action[1]}><Plus size={15} />{action[0]}</button>}</div></div>
    <div className={s.tableWrap}><table className={s.table}><thead><tr>{head.map((h, i) => <th key={h + i} className={numeric.includes(i) ? s.num : ''}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(r => <tr key={r.key} onClick={r.onClick} className={r.onClick ? s.clickable : ''}>{r.cells.map((c, i) => <td key={i} className={numeric.includes(i) ? s.num : ''}>{c}</td>)}</tr>)}</tbody></table>
      {!rows.length && <p className={s.empty}>Nada por aqui ainda.</p>}</div>
  </section>;
}

function PlanningView({ ctx }: { ctx: Ctx }) {
  const { store, now } = ctx;
  const list = [...store.projects].sort((a, b) => a.start.localeCompare(b.start));
  const min = Math.min(...list.map(p => new Date(p.start).getTime()), now), max = Math.max(...list.map(p => new Date(p.end).getTime()), now);
  const x = (t: number) => (t - min) / (max - min || 1) * 100;
  const years: number[] = []; for (let y = new Date(min).getFullYear() + 1; y <= new Date(max).getFullYear(); y++) years.push(y);
  const upcoming = store.activities.filter(a => a.date >= dayKey(new Date(now - 7 * DAY))).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  return <div className={s.planning}>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Cronograma das obras</h2></div>
      <div className={s.gantt}>
        <div className={s.ganttScale}>{years.map(y => <span key={y} style={{ left: `${x(new Date(y, 0, 1).getTime())}%` }}>{y}</span>)}<i style={{ left: `${x(now)}%` }}><b>Hoje</b></i></div>
        {list.map(p => <button key={p.id} className={s.ganttRow} onClick={() => ctx.openProject(p.id, 'Cronograma')}>
          <span>{p.name}<small>{p.city}</small></span>
          <span className={s.ganttTrack}><i className={s.ganttNow} style={{ left: `${x(now)}%` }} /><em style={{ left: `${x(new Date(p.start).getTime())}%`, width: `${x(new Date(p.end).getTime()) - x(new Date(p.start).getTime())}%`, '--c': delivered(p) ? '#22b573' : stageColor[p.stage] } as React.CSSProperties}><u style={{ width: `${p.progress}%` }} /></em></span>
        </button>)}
      </div>
    </section>
    <section className={s.card}>
      <div className={s.cardHead}><h2>Agenda de atividades</h2><button className={s.primarySm} onClick={() => ctx.setModal({ kind: 'activity' })}><Plus size={15} />Nova atividade</button></div>
      <ul className={s.activities}>{upcoming.map(a => <ActivityRow key={a.id} ctx={ctx} a={a} showDate />)}</ul>
    </section>
  </div>;
}

function BudgetsView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  return <Table title="Orçamento por obra" head={['Obra', 'Receita contratada', 'Custo previsto', 'Custo realizado', 'Consumo', 'Margem prevista', 'Situação']} numeric={[1, 2, 3, 5]} rows={store.projects.map(p => {
    const spent = store.entries.filter(e => e.projectId === p.id && e.type === 'Custo').reduce((v, e) => v + e.value, 0), use = spent / (p.cost || 1) * 100;
    return { key: p.id, onClick: () => ctx.openProject(p.id, 'Financeiro'), cells: [<b key="n">{p.name}</b>, brl(p.revenue), brl(p.cost), brl(spent), <span key="u" className={s.progress}><i><em style={{ width: `${Math.min(100, use)}%`, background: use > 100 ? '#e5484d' : use > 90 ? '#f59e0b' : '#22b573' }} /></i><b>{pct(use)}</b></span>, brl(p.revenue - p.cost), use > 100 ? <Pill key="s" tone="red">Estourado</Pill> : use > 90 ? <Pill key="s" tone="amber">Atenção</Pill> : <Pill key="s" tone="green">Dentro do previsto</Pill>] };
  })} />;
}

function FinanceView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const [type, setType] = useState<'Todos' | 'Receita' | 'Custo'>('Todos');
  const year = new Date(ctx.now).getFullYear();
  const ofYear = store.entries.filter(e => new Date(e.date).getFullYear() === year);
  const revenue = ofYear.filter(e => e.type === 'Receita').reduce((v, e) => v + e.value, 0), cost = ofYear.filter(e => e.type === 'Custo').reduce((v, e) => v + e.value, 0);
  const list = store.entries.filter(e => type === 'Todos' || e.type === type).sort((a, b) => b.date.localeCompare(a.date));
  return <div className={s.stackBig}>
    <div className={s.stats}><span>Receitas em {year}<b>{brl(revenue)}</b></span><span>Custos em {year}<b>{brl(cost)}</b></span><span>Lucro em {year}<b className={revenue - cost >= 0 ? s.pos : s.neg}>{brl(revenue - cost)}</b></span></div>
    <div className={s.twoCol}><FinanceChart ctx={ctx} />
      <Table title="Lançamentos" action={['Novo lançamento', () => ctx.setModal({ kind: 'entry' })]} extra={<select className={s.chipSelect} value={type} onChange={e => setType(e.target.value as typeof type)} aria-label="Tipo"><option>Todos</option><option>Receita</option><option>Custo</option></select>} head={['Data', 'Descrição', 'Obra', 'Valor']} numeric={[3]} rows={list.slice(0, 60).map(e => ({ key: e.id, cells: [dateLabel(e.date), <span key="d" className={s.stackText}><b>{e.description || e.category}</b><small>{e.category}</small></span>, store.projects.find(p => p.id === e.projectId)?.name ?? '—', <b key="v" className={e.type === 'Receita' ? s.pos : s.neg}>{e.type === 'Receita' ? '+' : '−'} {brl(e.value)}</b>] }))} />
    </div>
  </div>;
}

function PurchasesView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const receive = (id: string) => ctx.set(st => { const pu = st.purchases.find(x => x.id === id)!; return { purchases: st.purchases.map(x => x.id === id ? { ...x, status: 'Recebido' } : x), materials: st.materials.map(m => m.id === pu.materialId ? { ...m, quantity: m.quantity + pu.quantity } : m) }; }, 'Compra recebida e estoque atualizado.');
  return <Table title="Compras" action={['Nova compra', () => ctx.setModal({ kind: 'purchase' })]} head={['Material', 'Obra', 'Quantidade', 'Entrega', 'Valor', 'Situação']} numeric={[4]} rows={[...store.purchases].sort((a, b) => b.date.localeCompare(a.date)).map(pu => { const m = store.materials.find(x => x.id === pu.materialId); return { key: pu.id, cells: [<span key="m" className={s.person}><span className={s.matIcon}>{m && <MaterialIcon icon={m.icon} />}</span><span className={s.stackText}><b>{m?.name ?? '—'}</b><small>{m?.supplier}</small></span></span>, store.projects.find(p => p.id === pu.projectId)?.name ?? '—', `${pu.quantity.toLocaleString('pt-BR')} ${m?.unit ?? ''}`, dateLabel(pu.date), brl(pu.value), pu.status === 'Recebido' ? <Pill key="s" tone="green">Recebido</Pill> : <button key="s" className={s.chipBtn} onClick={() => receive(pu.id)}><Package size={14} />Receber</button>] }; })} />;
}

function StockView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const [out, setOut] = useState<Record<string, string>>({});
  const consume = (id: string) => { const q = Number(out[id]); const m = store.materials.find(x => x.id === id)!; if (!(q > 0) || q > m.quantity) { alert(`Informe uma quantidade entre 1 e ${m.quantity}.`); return; } ctx.set(st => ({ materials: st.materials.map(x => x.id === id ? { ...x, quantity: x.quantity - q } : x) }), `Baixa de ${q} ${m.unit} de ${m.name}.`); setOut({ ...out, [id]: '' }); };
  return <Table title="Estoque de materiais" action={['Nova compra', () => ctx.setModal({ kind: 'purchase' })]} head={['Material', 'Em estoque', 'Mínimo', 'Valor em estoque', 'Situação', 'Dar baixa']} numeric={[3]} rows={store.materials.map(m => { const st = stockStatus(m, store.purchases); return { key: m.id, cells: [<span key="m" className={s.person}><span className={s.matIcon}><MaterialIcon icon={m.icon} /></span><span className={s.stackText}><b>{m.name}</b><small>{m.supplier}</small></span></span>, `${m.quantity.toLocaleString('pt-BR')} ${m.unit}`, `${m.minimum.toLocaleString('pt-BR')} ${m.unit}`, brl(m.quantity * m.price), <Pill key="s" tone={st === 'Em estoque' ? 'green' : st === 'Em trânsito' ? 'blue' : 'red'}>{st}</Pill>, <span key="b" className={s.consume}><input inputMode="numeric" value={out[m.id] ?? ''} onChange={e => setOut({ ...out, [m.id]: e.target.value.replace(/\D/g, '') })} placeholder="Qtd." aria-label={`Quantidade a baixar de ${m.name}`} /><button className={s.chipBtn} onClick={() => consume(m.id)}>Baixar</button></span>] }; })} />;
}

function ReportsView({ ctx }: { ctx: Ctx }) {
  const { store } = ctx;
  const k = contracted(store.projects, ctx.now);
  const exportProjects = () => download('atio-obras.csv', csv([['Obra', 'Cidade', 'Etapa', 'Avanço (%)', 'Início', 'Entrega', 'Receita', 'Custo previsto', 'Margem'], ...store.projects.map(p => [p.name, p.city, delivered(p) ? 'Entregue' : p.stage, p.progress, dateLabel(p.start), dateLabel(p.end), p.revenue, p.cost, p.revenue - p.cost])]), 'text/csv');
  const exportEntries = () => download('atio-financeiro.csv', csv([['Data', 'Tipo', 'Categoria', 'Descrição', 'Obra', 'Valor'], ...store.entries.map(e => [dateLabel(e.date), e.type, e.category, e.description, store.projects.find(p => p.id === e.projectId)?.name ?? '', e.value])]), 'text/csv');
  return <div className={s.stackBig}>
    <div className={s.stats}><span>Receita contratada<b>{brl(k.revenue)}</b></span><span>Custo previsto<b>{brl(k.cost)}</b></span><span>Margem projetada<b>{brl(k.margin)}</b><small>{pct(k.share)}</small></span><span>Avanço médio<b>{pct(store.projects.reduce((v, p) => v + p.progress, 0) / (store.projects.length || 1))}</b></span></div>
    <section className={s.card}><div className={s.cardHead}><h2>Exportações</h2></div><div className={s.exports}>
      <button className={s.secondary} onClick={exportProjects}><Download size={15} />Obras (CSV)</button>
      <button className={s.secondary} onClick={exportEntries}><Download size={15} />Financeiro (CSV)</button>
      <button className={s.secondary} onClick={() => download('atio-backup.json', JSON.stringify(store, null, 2), 'application/json')}><Download size={15} />Backup completo (JSON)</button>
      <button className={s.secondary} onClick={() => { if (confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) ctx.set(() => makeSeed(), 'Dados de exemplo restaurados.'); }}><RotateCcw size={15} />Restaurar dados de exemplo</button>
    </div></section>
    <section className={s.card}><div className={s.cardHead}><h2>Obras por etapa</h2></div><ProjectTable ctx={ctx} list={store.projects} /></section>
  </div>;
}
