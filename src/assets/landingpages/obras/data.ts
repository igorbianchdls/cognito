export const stages = ['Planejamento', 'Em execução', 'Acabamento', 'Entrega'] as const;
export type Stage = (typeof stages)[number];
export type Phase = { id: string; name: string; start: string; end: string; progress: number };
export type Art = { floors: number; tone: string; wing: boolean; sky: 0 | 1 | 2 };
export type Project = {
  id: string; name: string; city: string; address: string; client: string; units: number; stage: Stage; launch: boolean;
  progress: number; revenue: number; cost: number; start: string; end: string; deliveredAt?: string; signedAt: string;
  team: string[]; x: number; y: number; art: Art; phases: Phase[]; createdAt: string;
};
export type Member = { id: string; name: string; role: string; status: 'Em obra' | 'Folga'; projectId: string; tone: string };
export type ActivityKind = 'Concretagem' | 'Entrega de materiais' | 'Vistoria' | 'Reunião';
export type Activity = { id: string; projectId: string; date: string; time: string; title: string; kind: ActivityKind; done: boolean };
export type Material = { id: string; name: string; supplier: string; quantity: number; unit: string; minimum: number; price: number; icon: 'cement' | 'steel' | 'brick' | 'pipe' | 'sand' | 'tile' };
export type Purchase = { id: string; materialId: string; projectId: string; quantity: number; date: string; status: 'Em trânsito' | 'Recebido'; value: number };
export type Entry = { id: string; projectId: string; date: string; type: 'Receita' | 'Custo'; category: string; description: string; value: number };
export type Supplier = { id: string; name: string; category: string; contact: string; phone: string };
export type Client = { id: string; name: string; email: string; phone: string; projectId: string; unit: string; value: number };
export type Doc = { id: string; name: string; kind: 'PDF' | 'XLSX'; size: string; date: string; projectId: string };
export type Store = { projects: Project[]; members: Member[]; activities: Activity[]; materials: Material[]; purchases: Purchase[]; entries: Entry[]; suppliers: Supplier[]; clients: Client[]; docs: Doc[] };

export const storageKey = 'atio-construtora-v2';
export const stageColor: Record<Stage, string> = { Planejamento: '#3b82f6', 'Em execução': '#f59e0b', Acabamento: '#22b573', Entrega: '#8b5cf6' };
export const barColor: Record<Stage, string> = { Planejamento: '#3b82f6', 'Em execução': '#f59e0b', Acabamento: '#22b573', Entrega: '#3b82f6' };
export const tones = ['#f1e4d3', '#e9d2b8', '#f3ede4', '#dfc9ad', '#efe0cc', '#e6d8c8'];
export const cities = ['Recife - PE', 'Olinda - PE', 'Jaboatão - PE', 'Paulista - PE', 'Camaragibe - PE'];
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const brl = (v: number, digits = 0) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
export const compact = (v: number) => v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : v >= 1e3 ? `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil` : brl(v);
export const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const dayKey = (d: Date | string) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const initials = (name: string) => name.split(' ').filter(p => p.length > 2 || p === name.split(' ')[0]).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const delivered = (p: Project) => p.progress >= 100;
export const active = (p: Project) => p.stage !== 'Planejamento' && !delivered(p);
export const stockStatus = (m: Material, purchases: Purchase[]) => purchases.some(p => p.materialId === m.id && p.status === 'Em trânsito') ? 'Em trânsito' : m.quantity < m.minimum ? 'Estoque baixo' : 'Em estoque';

/** Contract totals today and as they stood 30 days ago, for the KPI comparison. */
export function contracted(projects: Project[], now = Date.now()) {
  const before = projects.filter(p => now - new Date(p.signedAt).getTime() > 30 * DAY);
  const sum = (list: Project[], k: 'revenue' | 'cost') => list.reduce((v, p) => v + p[k], 0);
  const pct = (a: number, b: number) => b ? (a - b) / b * 100 : 0;
  const revenue = sum(projects, 'revenue'), cost = sum(projects, 'cost'), margin = revenue - cost;
  const r0 = sum(before, 'revenue'), c0 = sum(before, 'cost');
  return { revenue, cost, margin, share: revenue ? margin / revenue * 100 : 0, dRevenue: pct(revenue, r0), dCost: pct(cost, c0), dMargin: pct(margin, r0 - c0) };
}

const people: [string, string, string][] = [
  ['Marcos Silva', 'Eng. Civil', '#7c5a3a'], ['Carlos Andrade', 'Mestre de obras', '#4b6584'], ['João Ferreira', 'Encarregado', '#a0522d'], ['Lucas Mendes', 'Técnico de segurança', '#2d6a4f'],
  ['Ana Beatriz Lima', 'Arquiteta', '#9d4edd'], ['Paulo Rocha', 'Eng. Eletricista', '#386641'], ['Renata Alves', 'Compradora', '#bc6c25'], ['Diego Santos', 'Topógrafo', '#3a5a40'],
  ['Fernanda Costa', 'Eng. de Planejamento', '#6d597a'], ['Thiago Nunes', 'Encarregado', '#355070'], ['Bruna Melo', 'Almoxarife', '#b56576'], ['Rogério Pires', 'Mestre de obras', '#52796f'],
];
type Raw = [name: string, city: string, stage: Stage, progress: number, launch: boolean, revenue: number, cost: number, startMonths: number, endMonths: number, x: number, y: number, art: Art, team: number[], client: string];
const raws: Raw[] = [
  ['Residencial Vista Parque', 'Recife - PE', 'Planejamento', 15, true, 6_400_000, 4_380_000, -1, 26, 54, 48, { floors: 6, tone: '#f1e4d3', wing: true, sky: 0 }, [0, 4, 8, 5, 6], 'Vista Parque SPE Ltda.'],
  ['Condomínio Boa Viagem', 'Recife - PE', 'Planejamento', 8, true, 5_150_000, 3_420_000, 1, 28, 58, 70, { floors: 5, tone: '#efe0cc', wing: false, sky: 2 }, [8, 4, 7, 9], 'Boa Viagem Empreendimentos'],
  ['Vista Jardins', 'Jaboatão - PE', 'Em execução', 62, false, 4_900_000, 3_310_000, -10, 6, 40, 86, { floors: 7, tone: '#e9d2b8', wing: true, sky: 1 }, [1, 2, 3, 0, 9, 6, 10], 'Jardins Incorporações'],
  ['Edifício Horizonte', 'Olinda - PE', 'Em execução', 48, false, 3_850_000, 2_640_000, -7, 8, 70, 22, { floors: 8, tone: '#f3ede4', wing: false, sky: 0 }, [11, 3, 2, 7, 10, 5], 'Horizonte SPE'],
  ['Parque das Águas', 'Recife - PE', 'Em execução', 34, false, 3_400_000, 2_310_000, -5, 12, 44, 40, { floors: 5, tone: '#dfc9ad', wing: true, sky: 2 }, [9, 1, 3, 10], 'Águas Claras Ltda.'],
  ['Torre Capibaribe', 'Recife - PE', 'Em execução', 21, false, 5_600_000, 3_890_000, -3, 18, 50, 34, { floors: 10, tone: '#efe0cc', wing: false, sky: 1 }, [0, 2, 11, 7, 8], 'Capibaribe Incorporadora'],
  ['Residencial Mar Azul', 'Paulista - PE', 'Acabamento', 85, false, 4_200_000, 2_870_000, -14, 2, 66, 10, { floors: 6, tone: '#f1e4d3', wing: true, sky: 0 }, [1, 4, 3, 5, 6, 9, 10, 11], 'Mar Azul SPE'],
  ['Condomínio Villa Verde', 'Camaragibe - PE', 'Acabamento', 76, false, 3_100_000, 2_150_000, -12, 5, 20, 38, { floors: 5, tone: '#e6d8c8', wing: false, sky: 2 }, [11, 2, 7, 10, 3], 'Villa Verde Ltda.'],
  ['Edifício Atlântico', 'Recife - PE', 'Acabamento', 91, true, 3_950_000, 2_720_000, -16, 1, 62, 56, { floors: 9, tone: '#dfc9ad', wing: true, sky: 1 }, [0, 8, 6, 3], 'Atlântico SPE'],
  ['Torre Sol', 'Recife - PE', 'Entrega', 95, false, 3_600_000, 2_480_000, -19, 0, 48, 58, { floors: 9, tone: '#f3ede4', wing: false, sky: 0 }, [1, 2, 3, 9, 5, 10, 11], 'Torre Sol Incorporações'],
  ['Residencial das Acácias', 'Recife - PE', 'Entrega', 100, false, 2_700_000, 1_850_000, -22, -2, 36, 52, { floors: 6, tone: '#efe0cc', wing: true, sky: 2 }, [4, 7, 6, 8, 11], 'Acácias Empreendimentos'],
  ['Residencial Olinda Alta', 'Olinda - PE', 'Em execução', 55, false, 1_400_000, 1_150_000, -8, 7, 74, 28, { floors: 4, tone: '#e9d2b8', wing: false, sky: 1 }, [9, 2, 10], 'Olinda Alta Ltda.'],
];
const phaseNames = ['Fundação', 'Estrutura', 'Alvenaria', 'Instalações', 'Acabamento', 'Entrega'];

export function makeSeed(now = Date.now()): Store {
  const months = (m: number, day = 10) => { const d = new Date(now); d.setDate(day); d.setMonth(d.getMonth() + m); d.setHours(9, 0, 0, 0); return d.toISOString(); };
  const days = (n: number) => new Date(now + n * DAY).toISOString();
  const members: Member[] = people.map(([name, role, tone], i) => ({ id: `m${i}`, name, role, tone, status: i === 2 || i === 7 ? 'Folga' : 'Em obra', projectId: '' }));
  const projects: Project[] = raws.map(([name, city, stage, progress, launch, revenue, cost, sm, em, x, y, art, team, client], i) => {
    const start = months(sm, 1 + (i * 7) % 27), end = months(em, 1 + (i * 11) % 27);
    const span = new Date(end).getTime() - new Date(start).getTime();
    const phases = phaseNames.map((phase, k) => {
      const ps = new Date(new Date(start).getTime() + span * k / 6).toISOString(), pe = new Date(new Date(start).getTime() + span * (k + 1) / 6).toISOString();
      const p = Math.max(0, Math.min(100, Math.round((progress - k * 100 / 6) * 6)));
      return { id: uid(), name: phase, start: ps, end: pe, progress: p };
    });
    return { id: `p${i}`, name, city, address: `Rua ${['das Flores', 'do Sol', 'da Aurora', 'Real da Torre', 'dos Navegantes', 'Amélia'][i % 6]}, ${120 + i * 37}`, client, units: 24 + (i * 13) % 96, stage, launch, progress, revenue, cost, start, end, deliveredAt: progress >= 100 ? months(-1, 12) : undefined, signedAt: i === 0 || i === 1 ? days(-12 - i * 6) : months(sm - 3), team: team.map(t => `m${t}`), x, y, art, phases, createdAt: months(sm - 3) };
  });
  members.forEach(m => { m.projectId = projects.find(p => p.team.includes(m.id) && active(p))?.id ?? projects[0].id; });

  const at = (d: number, time: string) => ({ date: dayKey(days(d)), time });
  const activities: Activity[] = [
    { id: uid(), projectId: 'p0', ...at(0, '08:00'), title: 'Concretagem - Torre A', kind: 'Concretagem', done: false },
    { id: uid(), projectId: 'p3', ...at(0, '10:00'), title: 'Entrega de materiais', kind: 'Entrega de materiais', done: false },
    { id: uid(), projectId: 'p6', ...at(0, '14:00'), title: 'Vistoria da prefeitura', kind: 'Vistoria', done: false },
    { id: uid(), projectId: 'p2', ...at(0, '16:00'), title: 'Reunião com cliente', kind: 'Reunião', done: false },
    { id: uid(), projectId: 'p5', ...at(1, '07:30'), title: 'Concretagem da laje 4', kind: 'Concretagem', done: false },
    { id: uid(), projectId: 'p7', ...at(1, '09:00'), title: 'Entrega de esquadrias', kind: 'Entrega de materiais', done: false },
    { id: uid(), projectId: 'p9', ...at(2, '11:00'), title: 'Vistoria de entrega das unidades', kind: 'Vistoria', done: false },
    { id: uid(), projectId: 'p4', ...at(3, '15:00'), title: 'Reunião de medição', kind: 'Reunião', done: false },
    { id: uid(), projectId: 'p8', ...at(-1, '10:00'), title: 'Vistoria do Corpo de Bombeiros', kind: 'Vistoria', done: true },
  ];
  const suppliers: Supplier[] = [['Votorantim', 'Cimento e concreto', 'Juliana Prado'], ['Gerdau', 'Aço', 'Ricardo Lins'], ['Cerâmica União', 'Blocos e cerâmicos', 'Márcia Leal'], ['Tigre', 'Hidráulica', 'Felipe Moura'], ['Areal São João', 'Agregados', 'Sérgio Bezerra'], ['Portobello', 'Revestimentos', 'Clara Ventura']].map(([name, category, contact], i) => ({ id: `s${i}`, name, category, contact, phone: `(81) 3${(2241 + i * 113)}-${(4100 + i * 271)}` }));
  const materials: Material[] = [
    { id: 'c0', name: 'Cimento CP-II', supplier: 'Votorantim', quantity: 200, unit: 'sacos', minimum: 120, price: 38, icon: 'cement' },
    { id: 'c1', name: 'Aço CA-50', supplier: 'Gerdau', quantity: 2, unit: 'toneladas', minimum: 4, price: 6900, icon: 'steel' },
    { id: 'c2', name: 'Blocos cerâmicos', supplier: 'Cerâmica União', quantity: 3000, unit: 'un', minimum: 8000, price: 1.6, icon: 'brick' },
    { id: 'c3', name: 'Tubos PVC 100mm', supplier: 'Tigre', quantity: 500, unit: 'un', minimum: 150, price: 42, icon: 'pipe' },
    { id: 'c4', name: 'Areia média', supplier: 'Areal São João', quantity: 85, unit: 'm³', minimum: 40, price: 140, icon: 'sand' },
    { id: 'c5', name: 'Porcelanato 60x60', supplier: 'Portobello', quantity: 900, unit: 'm²', minimum: 600, price: 79, icon: 'tile' },
  ];
  const purchases: Purchase[] = [
    { id: uid(), materialId: 'c1', projectId: 'p3', quantity: 5, date: days(2), status: 'Em trânsito', value: 34500 },
    { id: uid(), materialId: 'c0', projectId: 'p2', quantity: 150, date: days(-6), status: 'Recebido', value: 5700 },
    { id: uid(), materialId: 'c5', projectId: 'p6', quantity: 400, date: days(-12), status: 'Recebido', value: 31600 },
  ];
  // Each project spends and receives in proportion to its progress, spread monthly from its start until today.
  const entries: Entry[] = [];
  const spendFactor = [.9, .95, 1.02, .96, .97, .93, 1.1, .98, .94, .97, .99, .95];
  projects.forEach((p, i) => {
    const from = new Date(p.start), until = new Date(Math.min(now, new Date(p.end).getTime()));
    const monthList: Date[] = [];
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= until; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) monthList.push(d);
    if (!monthList.length) monthList.push(new Date(from.getFullYear(), from.getMonth(), 1));
    const spent = p.cost * Math.max(.02, p.progress / 100) * spendFactor[i % spendFactor.length];
    const received = p.revenue * Math.min(1, Math.max(.05, p.progress / 100 * 1.05));
    const weights = monthList.map((_, k) => 1 + Math.sin(k * 1.7 + i) * .35), sum = weights.reduce((a, b) => a + b, 0);
    monthList.forEach((m, k) => {
      const share = weights[k] / sum, at = (day: number) => new Date(m.getFullYear(), m.getMonth(), day, 12).toISOString();
      entries.push({ id: uid(), projectId: p.id, date: at(5), type: 'Receita', category: 'Venda de unidades', description: 'Parcelas de clientes', value: Math.round(received * share) });
      entries.push({ id: uid(), projectId: p.id, date: at(18), type: 'Custo', category: 'Materiais', description: 'Compras do mês', value: Math.round(spent * share * .58) });
      entries.push({ id: uid(), projectId: p.id, date: at(25), type: 'Custo', category: 'Mão de obra', description: 'Folha e empreiteiros', value: Math.round(spent * share * .42) });
    });
  });
  const cutoff = dayKey(new Date(now));
  for (let k = entries.length - 1; k >= 0; k--) if (dayKey(entries[k].date) > cutoff) entries.splice(k, 1);
  const clients: Client[] = [['Patrícia Gouveia', 'p9', 'Apto 702'], ['Henrique Bastos', 'p10', 'Apto 301'], ['Larissa Cavalcanti', 'p6', 'Apto 504'], ['Eduardo Maciel', 'p2', 'Apto 1101'], ['Sofia Albuquerque', 'p0', 'Apto 203'], ['Gustavo Arruda', 'p8', 'Cobertura 902'], ['Camila Freire', 'p3', 'Apto 605'], ['Rafael Moraes', 'p7', 'Casa 12'], ['Isabela Torres', 'p1', 'Apto 404'], ['Vinícius Barros', 'p5', 'Apto 1502']].map(([name, projectId, unit], i) => ({ id: uid(), name, projectId, unit, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com`, phone: `(81) 9${8100 + i * 37}-${2200 + i * 131}`, value: 420_000 + i * 38_500 }));
  const docs: Doc[] = [
    { id: uid(), name: 'Projeto Executivo - Torre A', kind: 'PDF', size: '12 MB', date: days(0), projectId: 'p0' },
    { id: uid(), name: 'Alvará de Construção', kind: 'PDF', size: '2,3 MB', date: days(-1), projectId: 'p5' },
    { id: uid(), name: 'Orçamento Revisado', kind: 'XLSX', size: '1,1 MB', date: days(-5), projectId: 'p2' },
    { id: uid(), name: 'Cronograma Físico-Financeiro', kind: 'XLSX', size: '850 KB', date: days(-7), projectId: 'p3' },
    { id: uid(), name: 'Habite-se', kind: 'PDF', size: '640 KB', date: days(-30), projectId: 'p10' },
    { id: uid(), name: 'Memorial Descritivo', kind: 'PDF', size: '3,8 MB', date: days(-41), projectId: 'p6' },
  ];
  return { projects, members, activities, materials, purchases, entries, suppliers, clients, docs };
}
