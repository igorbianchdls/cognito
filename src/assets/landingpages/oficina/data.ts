export const stages = ['Avaliação', 'Orçamento', 'Peças', 'Execução', 'Entrega'] as const;
export type Stage = (typeof stages)[number] | 'Finalizada';
export type Body = 'sedan' | 'hatch' | 'suv' | 'pickup' | 'sports' | 'classic';
export type QuoteStatus = 'Pendente' | 'Aprovado' | 'Recusado';
export type Item = { id: string; kind: 'Serviço' | 'Peça'; description: string; quantity: number; price: number };
export type Check = { id: string; label: string; done: boolean };
export type Log = { id: string; at: string; text: string };
export type Order = {
  id: string; number: number; model: string; year: number; plate: string; body: Body; color: string;
  client: string; phone: string; mechanicId: string; stage: Stage; quote: QuoteStatus; due: string;
  complaint: string; items: Item[]; inspection: Check[]; tasks: Check[]; logs: Log[];
  createdAt: string; updatedAt: string; closedAt?: string;
};
export type NewOrder = Omit<Order, 'id' | 'number' | 'stage' | 'quote' | 'items' | 'inspection' | 'tasks' | 'logs' | 'createdAt' | 'updatedAt'>;
export type Mechanic = { id: string; name: string; role: string; initials: string; tone: string };
export type Store = { orders: Order[]; next: number; read: string[] };

export const storageKey = 'torque-oficina-v2';
export const staleDays = 2;
export const mechanics: Mechanic[] = [
  { id: 'm1', name: 'Carlos Menezes', role: 'Mecânico chefe', initials: 'CM', tone: '#3d5a80' },
  { id: 'm2', name: 'Júlia Paiva', role: 'Elétrica e injeção', initials: 'JP', tone: '#9c4f96' },
  { id: 'm3', name: 'André Rocha', role: 'Suspensão e freios', initials: 'AR', tone: '#2a9d8f' },
  { id: 'm4', name: 'Bruno Tavares', role: 'Funilaria e pintura', initials: 'BT', tone: '#b5651d' },
];
export const bodies: [Body, string][] = [['sedan', 'Sedã'], ['hatch', 'Hatch'], ['suv', 'SUV'], ['pickup', 'Picape'], ['sports', 'Esportivo'], ['classic', 'Clássico']];
export const colors = ['#d72d2a', '#f2c230', '#f07a1a', '#1f5fa8', '#23262b', '#9aa1a9', '#f4f4f2', '#2f6b4f'];
export const inspectionTemplate = ['Inspeção visual e lataria', 'Nível de óleo e fluidos', 'Freios e suspensão', 'Teste de rodagem', 'Leitura do scanner'];

const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const code = (n: number) => `#OS-${String(n).padStart(4, '0')}`;
export const money = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const brl = (v: number) => `R$ ${money(v)}`;
export const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const yearLabel = (y: number) => `’${String(y).slice(-2)}`;
export const total = (o: Order) => o.items.reduce((v, i) => v + i.quantity * i.price, 0);
export const partsTotal = (o: Order) => o.items.filter(i => i.kind === 'Peça').reduce((v, i) => v + i.quantity * i.price, 0);
export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - new Date(iso).getTime()) / DAY);
export const isOpen = (o: Order) => o.stage !== 'Finalizada';
export const mechanic = (id: string) => mechanics.find(m => m.id === id);
export const nextStage = (s: Stage): Stage => s === 'Finalizada' ? s : s === 'Entrega' ? 'Finalizada' : stages[stages.indexOf(s) + 1];

export type Alert = { order: Order; kind: 'parada' | 'atrasada' | 'orçamento'; text: string };
export function alertsFor(o: Order, now = Date.now()): Alert[] {
  if (!isOpen(o)) return [];
  const list: Alert[] = [];
  const idle = daysSince(o.updatedAt, now);
  if (idle >= staleDays) list.push({ order: o, kind: 'parada', text: `OS há ${idle} dias sem atualização` });
  if (new Date(o.due).getTime() < startOfDay(now)) list.push({ order: o, kind: 'atrasada', text: `Entrega prevista para ${dateLabel(o.due)} já passou` });
  if (o.stage === 'Orçamento' && o.quote === 'Pendente' && idle >= 1) list.push({ order: o, kind: 'orçamento', text: 'Orçamento aguardando aprovação do cliente' });
  return list;
}
export const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Sum for the last 30 days and the 30 days before, for the KPI comparison. */
export function rolling(orders: Order[], value: (o: Order) => number, at: (o: Order) => string | undefined, now = Date.now()) {
  let current = 0, previous = 0;
  for (const o of orders) {
    const when = at(o); if (!when) continue;
    const age = now - new Date(when).getTime();
    if (age < 0) continue;
    if (age < 30 * DAY) current += value(o); else if (age < 60 * DAY) previous += value(o);
  }
  return { current, delta: previous ? (current - previous) / previous * 100 : 0 };
}

type Raw = [model: string, year: number, plate: string, body: Body, color: string, client: string, stage: Stage, mech: string, quote: QuoteStatus, dueIn: number, idleDays: number, items: [string, number][], parts: [string, number][], tasks: number, done: number, inspected: boolean];
const raws: Raw[] = [
  ['BMW 320i', 2024, 'IAD-4512', 'sedan', '#23262b', 'Rafael Carvalho dos Santos', 'Avaliação', '', 'Pendente', 4, 0, [], [], 0, 0, false],
  ['Amarok', 2025, 'HQE-1412', 'pickup', '#1f5fa8', 'Gabriel Rodrigues', 'Avaliação', 'm3', 'Pendente', 5, 0, [], [], 0, 0, true],
  ['Scirocco', 2022, 'IYS-4908', 'hatch', '#f2c230', 'Pedro Lima', 'Avaliação', '', 'Pendente', 6, 0, [], [], 0, 0, false],
  ['Ford F-1000', 1995, '3GY-Z784', 'pickup', '#d72d2a', 'Paulo Andrade', 'Orçamento', 'm1', 'Pendente', 3, 1, [['Revisão do diferencial', 680]], [['Retentor do pinhão', 145], ['Óleo 80W90 (3 L)', 165]], 2, 0, true],
  ['Supra', 1994, '3NT-Q305', 'sports', '#f07a1a', 'Bruno Oliveira', 'Orçamento', 'm2', 'Aprovado', 6, 0, [['Diagnóstico de injeção', 350], ['Troca de bobinas', 420]], [['Jogo de bobinas', 2140], ['Velas de ignição (6)', 498]], 5, 0, true],
  ['Marea', 1996, 'MMX-1106', 'classic', '#9aa1a9', 'Pedro Valente', 'Peças', 'm1', 'Aprovado', -2, 3, [['Retífica do cabeçote', 1850]], [['Junta do cabeçote', 389], ['Jogo de válvulas', 1240], ['Correia dentada', 286]], 9, 1, true],
  ['Toro Volcano', 2023, 'MSS-3933', 'pickup', '#f4f4f2', 'Claudinei Mato Grosso', 'Peças', 'm3', 'Aprovado', 2, 0, [['Troca de amortecedores', 640]], [['Amortecedores dianteiros', 1580], ['Kit batente e coifa', 903]], 4, 0, true],
  ['Saveiro', 1994, 'KEX-2649', 'pickup', '#f2c230', 'Joel Alves', 'Peças', 'm4', 'Aprovado', 4, 0, [['Funilaria da caçamba', 1200]], [['Tinta e verniz', 950]], 3, 0, true],
  ['Impala', 1967, 'KAZ-2Y15', 'classic', '#23262b', 'Heitor Afraniano', 'Execução', 'm4', 'Aprovado', 5, 0, [['Restauração do carburador', 1480], ['Ajuste de freios', 690]], [['Kit reparo carburador', 1239], ['Lonas de freio', 1180]], 4, 1, true],
  ['SP2', 1976, 'JMR-1851', 'sports', '#d72d2a', 'Gabriel Rodrigues', 'Execução', 'm2', 'Aprovado', 3, 0, [['Revisão elétrica completa', 980]], [['Chicote principal', 874]], 4, 1, true],
  ['Golf GTI', 2019, 'QWE-7A21', 'hatch', '#f4f4f2', 'Larissa Mendes', 'Execução', 'm3', 'Aprovado', 2, 1, [['Troca de embreagem', 890]], [['Kit embreagem', 2240], ['Fluido de freio DOT4', 89]], 3, 1, true],
  ['Cooper JCW', 2020, 'LME-6565', 'hatch', '#d72d2a', 'Ricardo Jesus', 'Entrega', 'm1', 'Aprovado', 0, 0, [['Revisão de 60 mil km', 1240]], [['Filtros e óleo 5W30', 820], ['Pastilhas dianteiras', 500.35]], 3, 3, true],
  ['Volvo XC90', 2024, 'ABC-1D34', 'suv', '#9aa1a9', 'Thaís Mega', 'Entrega', 'm2', 'Aprovado', 1, 0, [['Atualização de software', 450]], [['Palhetas e filtro de cabine', 473]], 3, 3, true],
];
const serviceNames = ['Revisão completa', 'Troca de óleo e filtros', 'Alinhamento e balanceamento', 'Troca de pastilhas', 'Higienização do ar-condicionado', 'Troca de correia dentada', 'Diagnóstico eletrônico', 'Suspensão dianteira'];
const partNames = ['Kit de filtros', 'Pastilhas de freio', 'Correia dentada', 'Amortecedores', 'Óleo sintético', 'Bateria 60 Ah', 'Discos de freio', 'Velas de ignição'];
const history: [string, number, string, Body, string, string][] = [
  ['Onix', 2021, 'RTA-2B11', 'hatch', '#9aa1a9', 'Fernanda Luz'], ['Corolla', 2020, 'FJK-8C22', 'sedan', '#f4f4f2', 'Marcos Prado'],
  ['Compass', 2022, 'GHT-3D45', 'suv', '#23262b', 'Vanessa Rios'], ['Hilux', 2019, 'PLA-5E67', 'pickup', '#9aa1a9', 'Otávio Nunes'],
  ['HB20', 2023, 'MNB-1F89', 'hatch', '#1f5fa8', 'Juliana Freitas'], ['Civic', 2018, 'QAZ-4G10', 'sedan', '#d72d2a', 'Eduardo Sales'],
  ['T-Cross', 2022, 'WSX-6H32', 'suv', '#f4f4f2', 'Camila Duarte'], ['Strada', 2024, 'EDC-9J54', 'pickup', '#f4f4f2', 'Rogério Batista'],
];

function check(labels: string[], done: number): Check[] { return labels.map((label, i) => ({ id: uid(), label, done: i < done })); }

export function makeSeed(now = Date.now()): Store {
  const at = (days: number, hour = 10) => { const d = new Date(now - days * DAY); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
  let n = 1;
  const orders: Order[] = [];
  // Closed orders over the last 60 days feed the revenue and parts comparisons.
  for (let i = 0; i < 46; i++) {
    const [model, year, plate, body, color, client] = history[i % history.length];
    const daysAgo = 2 + Math.floor(i * 57 / 46);
    const service = 380 + (i * 197) % 1400, part = 260 + (i * 331) % 1900 + (i % 3) * 0.45;
    orders.push({
      id: uid(), number: n++, model, year, plate, body, color, client, phone: `(11) 9812${i % history.length}-${String(4100 + (i % history.length) * 137)}`,
      mechanicId: mechanics[i % 4].id, stage: 'Finalizada', quote: 'Aprovado', due: at(daysAgo), complaint: '',
      items: [{ id: uid(), kind: 'Serviço', description: serviceNames[i % 8], quantity: 1, price: service }, { id: uid(), kind: 'Peça', description: partNames[(i * 3) % 8], quantity: 1, price: part }],
      inspection: check(inspectionTemplate, 5), tasks: check([serviceNames[i % 8]], 1),
      logs: [{ id: uid(), at: at(daysAgo), text: 'OS finalizada e veículo entregue' }],
      createdAt: at(daysAgo + 4), updatedAt: at(daysAgo), closedAt: at(daysAgo, 16),
    });
  }
  for (const [model, year, plate, body, color, client, stage, mech, quote, dueIn, idle, services, parts, taskCount, done, inspected] of raws) {
    const items: Item[] = [...services.map(([description, price]) => ({ id: uid(), kind: 'Serviço' as const, description, quantity: 1, price })), ...parts.map(([description, price]) => ({ id: uid(), kind: 'Peça' as const, description, quantity: 1, price }))];
    const taskLabels = [...services.map(s => s[0]), ...parts.map(p => `Instalar ${p[0].toLowerCase()}`), 'Teste final de rodagem', 'Lavagem de cortesia', 'Conferência de qualidade', 'Retorno do cliente', 'Registro fotográfico', 'Limpeza interna'].slice(0, taskCount);
    orders.push({
      id: uid(), number: n++, model, year, plate, body, color, client, phone: '(11) 98' + String(700 + n) + '-' + String(4000 + n * 17).slice(-4),
      mechanicId: mech, stage, quote, due: at(-dueIn, 17), complaint: stage === 'Avaliação' ? 'Cliente relata barulho na suspensão e luz de injeção acesa.' : '',
      items, inspection: check(inspectionTemplate, inspected ? 5 : 0), tasks: check(taskLabels, done),
      logs: [{ id: uid(), at: at(idle + 1), text: 'Veículo recebido na oficina' }, ...(idle ? [] : [{ id: uid(), at: at(0, 9), text: `Etapa atual: ${stage}` }])],
      createdAt: at(idle + 2), updatedAt: at(idle, 9),
    });
  }
  return { orders, next: n, read: [] };
}
