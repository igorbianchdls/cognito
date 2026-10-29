export const procedureCategories = ['Facial', 'Injetáveis', 'Corporal', 'Laser', 'Bem-estar'] as const;
export type ProcedureCategory = (typeof procedureCategories)[number];
export const statuses = ['Agendado', 'Confirmado', 'Realizado', 'Faltou', 'Cancelado'] as const;
export type Status = (typeof statuses)[number];
export const payments = ['Pix', 'Crédito', 'Débito', 'Dinheiro'] as const;
export type Payment = (typeof payments)[number];
export const sources = ['Instagram', 'Indicação', 'Google', 'Site', 'Retorno espontâneo'];
export const expenseCategories = ['Aluguel', 'Insumos', 'Salários e comissões', 'Marketing', 'Contas da clínica', 'Impostos', 'Equipamentos'];
export const OPEN = 8, CLOSE = 20;

export type Procedure = { id: string; name: string; category: ProcedureCategory; duration: number; price: number; cost: number; returnDays: number; active: boolean; art: string };
export type Professional = { id: string; name: string; role: string; color: string; commission: number };
export type Appointment = { id: string; date: string; time: string; clientId: string; procedureId: string; professionalId: string; status: Status; price: number; paid: boolean; payment: Payment | ''; notes: string };
export type Client = { id: string; name: string; phone: string; email: string; birthday: string; source: string; anamnesis: string; createdAt: string };
export type Product = { id: string; name: string; kind: 'Insumo' | 'Revenda'; unit: string; stock: number; min: number; cost: number; price: number };
export type Expense = { id: string; desc: string; category: string; due: string; value: number; paid: boolean };
export type Settings = { owner: string; company: string; goal: number };
export type Store = { procedures: Procedure[]; professionals: Professional[]; appointments: Appointment[]; clients: Client[]; products: Product[]; expenses: Expense[]; settings: Settings };

export const storageKey = 'lumiere-estetica-v1';
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const dayKey = (d: Date | string | number) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const addDays = (key: string, n: number) => dayKey(new Date(`${key}T12:00`).getTime() + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T12:00`).getTime() - new Date(`${a}T12:00`).getTime()) / DAY);
export const monthKey = (key: string, delta = 0) => { const d = new Date(`${key.slice(0, 7)}-01T12:00`); d.setMonth(d.getMonth() + delta); return dayKey(d).slice(0, 7); };
export const brl = (v: number, digits = 0) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });
export const dateLabel = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR');
export const initials = (name: string) => name.replace(/^(Dra?\.) /, '').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const busy = (a: Appointment) => a.status !== 'Cancelado' && a.status !== 'Faltou';

const catalog: [string, ProcedureCategory, number, number, number, number, string][] = [
  // name, category, minutes, price, cost of supplies, days until the recommended return, illustration
  ['Limpeza de Pele', 'Facial', 60, 220, 38, 30, 'face'], ['Peeling Químico', 'Facial', 45, 320, 60, 30, 'face'], ['Microagulhamento', 'Facial', 60, 480, 70, 30, 'roller'], ['Hidratação Facial', 'Facial', 45, 180, 30, 21, 'drop'],
  ['Botox', 'Injetáveis', 30, 1200, 420, 120, 'syringe'], ['Preenchimento', 'Injetáveis', 45, 1500, 520, 180, 'lips'], ['Skinbooster', 'Injetáveis', 40, 1100, 380, 90, 'syringe'], ['Bioestimulador de Colágeno', 'Injetáveis', 50, 1900, 760, 120, 'syringe'],
  ['Laser', 'Laser', 30, 280, 25, 30, 'laser'], ['Depilação a Laser (pernas)', 'Laser', 40, 260, 20, 45, 'laser'], ['Lavieen', 'Laser', 40, 690, 60, 30, 'laser'],
  ['Drenagem Linfática', 'Corporal', 60, 160, 12, 7, 'hands'], ['Criolipólise', 'Corporal', 70, 890, 210, 60, 'body'], ['Radiofrequência Corporal', 'Corporal', 50, 240, 18, 14, 'body'],
  ['Massagem Relaxante', 'Bem-estar', 60, 190, 14, 21, 'hands'], ['Day Spa', 'Bem-estar', 150, 520, 60, 60, 'lotus'],
];
const firstNames = ['Ana', 'Beatriz', 'Carolina', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Mariana', 'Natália', 'Olívia', 'Patrícia', 'Rafaela', 'Sabrina', 'Tatiana', 'Valentina', 'Vitória', 'Luiza', 'Camila', 'Bianca', 'Renata', 'Paula', 'Clara', 'Lívia', 'Marcela', 'Alice', 'Cecília', 'Ricardo', 'Felipe'];
const lastNames = ['Albuquerque', 'Barros', 'Cavalcanti', 'Duarte', 'Farias', 'Gusmão', 'Lins', 'Medeiros', 'Moura', 'Nogueira', 'Pessoa', 'Queiroz', 'Rocha', 'Siqueira', 'Teixeira', 'Vasconcelos', 'Andrade', 'Brandão', 'Costa'];

/** Small deterministic generator so the demo looks the same on every first load. */
function rng(seed: number) { let x = seed >>> 0; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; }

export function makeSeed(now = Date.now()): Store {
  const today = dayKey(now);
  const r = rng(424242);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  const procedures: Procedure[] = catalog.map(([name, category, duration, price, cost, returnDays, art], i) => ({ id: `t${i}`, name, category, duration, price, cost, returnDays, active: true, art }));
  const professionals: Professional[] = [
    { id: 'pr0', name: 'Dra. Paula Moreira', role: 'Biomédica esteta', color: '#e9798f', commission: 0.35 },
    { id: 'pr1', name: 'Dra. Renata Lacerda', role: 'Dermatologista', color: '#b07cc6', commission: 0.4 },
    { id: 'pr2', name: 'Camila Rocha', role: 'Esteticista', color: '#e8a76c', commission: 0.3 },
    { id: 'pr3', name: 'Júlia Santana', role: 'Fisioterapeuta dermatofuncional', color: '#6fae9a', commission: 0.3 },
  ];
  // Who performs what: injectables with the doctors, facials and body care with the therapists.
  const canDo = (p: Procedure) => p.category === 'Injetáveis' ? ['pr0', 'pr1'] : p.category === 'Laser' ? ['pr0', 'pr2'] : p.category === 'Facial' ? ['pr2', 'pr0'] : ['pr3', 'pr2'];
  const clients: Client[] = Array.from({ length: 460 }, (_, i) => {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 7 + Math.floor(i / firstNames.length)) % lastNames.length]}`;
    const month = String(1 + (i * 5) % 12).padStart(2, '0'), day = String(1 + (i * 7 + Math.floor(i / 12) * 3) % 28).padStart(2, '0');
    return { id: `c${i}`, name, phone: `(81) 9${String(8300 + i * 13).slice(-4)}-${String(2000 + i * 41).slice(-4)}`, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${i}@email.com`, birthday: `${1968 + (i % 32)}-${month}-${day}`, source: sources[i % sources.length], anamnesis: i % 11 === 0 ? 'Alergia a lidocaína. Pele sensível, evitar ácidos fortes.' : i % 7 === 0 ? 'Usa isotretinoína até o próximo mês.' : '', createdAt: addDays(today, -420 + Math.floor(i * .8)) };
  });
  const weight = clients.map((_, i) => (i % 8 === 0 ? 5 : i % 3 === 0 ? 2 : 1));
  const totalWeight = weight.reduce((a, b) => a + b, 0);
  const chooseClient = () => { let t = r() * totalWeight; for (let i = 0; i < weight.length; i++) { t -= weight[i]; if (t <= 0) return clients[i]; } return clients[0]; };
  const popularity = procedures.map(p => ({ 'Limpeza de Pele': 8, Botox: 3, Preenchimento: 2, Laser: 5, Skinbooster: 2, 'Drenagem Linfática': 7, 'Massagem Relaxante': 4, 'Hidratação Facial': 4, 'Depilação a Laser (pernas)': 3, 'Radiofrequência Corporal': 3 } as Record<string, number>)[p.name] ?? 1);
  const popTotal = popularity.reduce((a, b) => a + b, 0);
  const chooseProcedure = () => { let t = r() * popTotal; for (let i = 0; i < procedures.length; i++) { t -= popularity[i]; if (t <= 0) return procedures[i]; } return procedures[0]; };
  const appointments: Appointment[] = [];
  for (let d = -365; d <= 21; d++) {
    const date = addDays(today, d), weekday = new Date(`${date}T12:00`).getDay();
    if (weekday === 0) continue;
    const growth = 0.55 + Math.min(1, (d + 365) / 365) * 0.55;
    const future = d > 0 ? Math.max(0.25, 1 - d / 24) : 1;
    // Slots per professional; Saturdays are half days.
    const taken: Record<string, [number, number][]> = Object.fromEntries(professionals.map(p => [p.id, []]));
    const close = weekday === 6 ? 14 * 60 : CLOSE * 60;
    // October campaign (last four weeks) brings a visible lift over the previous month.
    const lift = d > -29 && d <= 0 ? 1.15 : 1;
    const target = Math.round((weekday === 6 ? 6 : 9) * growth * future * lift + (r() - 0.5) * 3);
    for (let k = 0; k < target; k++) {
      const proc = chooseProcedure();
      const proId = pick(canDo(proc)), pro = professionals.find(p => p.id === proId)!;
      // Random free half-hour slot across the day, so the agenda is spread like a real one.
      const options = Array.from({ length: (close - OPEN * 60) / 30 }, (_, j) => OPEN * 60 + j * 30).filter(m => m + proc.duration <= close && !taken[pro.id].some(([a, b]) => a < m + proc.duration && b > m));
      if (!options.length) continue;
      const start = pick(options);
      taken[pro.id].push([start, start + proc.duration]);
      const client = chooseClient();
      const past = d < 0 || (d === 0 && start + proc.duration < 13 * 60);
      const roll = r();
      const status: Status = past ? (roll < 0.06 ? 'Faltou' : roll < 0.1 ? 'Cancelado' : 'Realizado') : d <= 2 && roll < 0.7 ? 'Confirmado' : 'Agendado';
      appointments.push({ id: uid(), date, time: toTime(start), clientId: client.id, procedureId: proc.id, professionalId: pro.id, status, price: proc.price, paid: status === 'Realizado' && !(d > -6 && roll > 0.85), payment: status === 'Realizado' ? pick(payments) : '', notes: '' });
    }
  }
  const products: Product[] = [
    ['Toxina botulínica 100U', 'Insumo', 'frasco', 6, 3, 980, 0], ['Ácido hialurônico 1ml', 'Insumo', 'seringa', 9, 4, 420, 0], ['Skinbooster 1ml', 'Insumo', 'seringa', 3, 4, 360, 0], ['Bioestimulador (Sculptra)', 'Insumo', 'frasco', 2, 2, 1450, 0],
    ['Ácido glicólico 70%', 'Insumo', 'frasco', 4, 2, 120, 0], ['Máscara de argila verde', 'Insumo', 'pote', 7, 3, 45, 0], ['Gel condutor', 'Insumo', 'litro', 1, 3, 38, 0], ['Agulhas 30G', 'Insumo', 'caixa', 5, 2, 89, 0], ['Luvas nitrílicas', 'Insumo', 'caixa', 12, 6, 42, 0],
    ['Protetor solar FPS 60', 'Revenda', 'un', 18, 8, 52, 119], ['Sérum vitamina C', 'Revenda', 'un', 6, 6, 78, 189], ['Hidratante pós-procedimento', 'Revenda', 'un', 11, 5, 41, 98], ['Água micelar', 'Revenda', 'un', 14, 6, 28, 69],
  ].map(([name, kind, unit, stock, min, cost, price], i) => ({ id: `m${i}`, name: name as string, kind: kind as Product['kind'], unit: unit as string, stock: stock as number, min: min as number, cost: cost as number, price: price as number }));
  const expenses: Expense[] = [];
  for (let m = -11; m <= 1; m++) {
    const mk = monthKey(today, m);
    [['Aluguel da clínica', 'Aluguel', 5, 9800], ['Folha e comissões', 'Salários e comissões', 5, 17500 + (m + 11) * 420], ['Distribuidora Dermo Med', 'Insumos', 12, 7200 + (m + 11) * 260], ['Energia, água e internet', 'Contas da clínica', 15, 2100], ['Anúncios Instagram', 'Marketing', 10, 2400], ['Simples Nacional', 'Impostos', 20, 4200 + (m + 11) * 150], ['Leasing do laser', 'Equipamentos', 25, 3900]].forEach(([desc, category, day, value]) => {
      const due = `${mk}-${String(day).padStart(2, '0')}`;
      expenses.push({ id: uid(), desc: desc as string, category: category as string, due, value: value as number, paid: due < today && !(m === 0 && desc === 'Distribuidora Dermo Med') });
    });
  }
  return { procedures, professionals, appointments, clients, products, expenses, settings: { owner: 'Igor', company: 'Lumière Estética Avançada', goal: 80000 } };
}
