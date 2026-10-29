export const types = ['Residencial', 'Reforma', 'Comercial', 'Interiores'] as const;
export type ProjectType = (typeof types)[number];
export const statuses = ['Planejamento', 'Em execução', 'Pausada', 'Concluída'] as const;
export type Status = (typeof statuses)[number];
export const quoteStatuses = ['Rascunho', 'Enviado', 'Aprovado', 'Recusado'] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];
export const purchaseStatuses = ['Cotação', 'Pedido', 'Entregue'] as const;
export type PurchaseStatus = (typeof purchaseStatuses)[number];
export type Milestone = { id: string; name: string; start: string; end: string; progress: number };
export type Purchase = { id: string; supplierId: string; item: string; value: number; status: PurchaseStatus; due: string; paid: boolean };
export type Installment = { id: string; label: string; due: string; value: number; paid: boolean };
export type Member = { id: string; name: string; role: string };
export type LogEntry = { id: string; date: string; text: string };
export type Project = {
  id: string; code: string; type: ProjectType; title: string; clientId: string; address: string; city: string; start: string; end: string;
  budget: number; status: Status; cover: string; manager: string; milestones: Milestone[]; purchases: Purchase[]; installments: Installment[];
  team: Member[]; log: LogEntry[]; notes: string; createdAt: string;
};
export type QuoteItem = { id: string; desc: string; qty: number; unit: string; price: number };
export type Quote = { id: string; code: string; type: ProjectType; title: string; clientId: string; city: string; items: QuoteItem[]; status: QuoteStatus; createdAt: string; validUntil: string; projectId?: string };
export type Client = { id: string; name: string; kind: 'Pessoa' | 'Empresa'; email: string; phone: string; source: string; createdAt: string };
export type Supplier = { id: string; name: string; category: string; contact: string; phone: string; rating: number };
export type Settings = { owner: string; company: string };
export type Store = { projects: Project[]; quotes: Quote[]; clients: Client[]; suppliers: Supplier[]; settings: Settings; next: number };

export const storageKey = 'alvorada-obras-v1';
export const categories = ['Materiais básicos', 'Concreto e aço', 'Elétrica', 'Hidráulica', 'Revestimentos', 'Esquadrias e vidros', 'Locação de equipamentos', 'Mão de obra terceirizada'];
export const sources = ['Indicação', 'Instagram', 'Site', 'Google', 'Arquiteto parceiro'];
export const roles = ['Mestre de obras', 'Pedreiro', 'Servente', 'Eletricista', 'Encanador', 'Carpinteiro', 'Pintor', 'Azulejista'];
export const photoCovers = ['house', 'terrace', 'view', 'team'];
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const dayKey = (d: Date | string | number) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const addDays = (key: string, n: number) => dayKey(new Date(`${key}T12:00`).getTime() + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T12:00`).getTime() - new Date(`${a}T12:00`).getTime()) / DAY);
export const brl = (v: number, digits = 0) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });
export const dateLabel = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR');
export const initials = (name: string) => name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const quoteTotal = (q: Quote) => q.items.reduce((v, i) => v + i.qty * i.price, 0);
export const received = (p: Project) => p.installments.filter(i => i.paid).reduce((v, i) => v + i.value, 0);
export const spent = (p: Project) => p.purchases.filter(x => x.status !== 'Cotação').reduce((v, x) => v + x.value, 0);
export const live = (p: Project) => p.status === 'Em execução' || p.status === 'Planejamento' || p.status === 'Pausada';

/** Overall progress weighted by the length of each milestone. */
export function progress(p: Project) {
  const total = p.milestones.reduce((v, m) => v + Math.max(1, daysBetween(m.start, m.end)), 0);
  return total ? Math.round(p.milestones.reduce((v, m) => v + Math.max(1, daysBetween(m.start, m.end)) * m.progress, 0) / total) : 0;
}
export type MilestoneStatus = 'Concluído' | 'Em andamento' | 'Pendente' | 'Atrasado';
export const milestoneStatus = (m: Milestone, today: string): MilestoneStatus => m.progress >= 100 ? 'Concluído' : m.end < today ? 'Atrasado' : m.progress > 0 ? 'Em andamento' : 'Pendente';
export const currentMilestone = (p: Project) => p.milestones.find(m => m.progress < 100);

const templates: Record<ProjectType, [string, number][]> = {
  Residencial: [['Fundação', 15], ['Estrutura', 30], ['Instalações elétricas e hidráulicas', 30], ['Revestimentos', 13], ['Acabamentos', 12]],
  Reforma: [['Demolição e retirada', 10], ['Instalações elétricas e hidráulicas', 25], ['Revestimentos', 25], ['Pintura', 20], ['Acabamentos', 20]],
  Comercial: [['Projeto e aprovações', 12], ['Fundação', 14], ['Estrutura', 24], ['Instalações', 26], ['Fachada e acabamentos', 24]],
  Interiores: [['Medição e projeto', 15], ['Marcenaria', 35], ['Iluminação', 15], ['Pintura e papel de parede', 15], ['Montagem final', 20]],
};
/** Spreads a template over the project's dates; each step's number is its % of the total duration. */
export function makeMilestones(type: ProjectType, start: string, end: string, today: string, lateIndex = -1): Milestone[] {
  const length = Math.max(10, daysBetween(start, end));
  let cursor = 0;
  return templates[type].map(([name, share], k) => {
    const s = addDays(start, Math.round(cursor * length / 100)); cursor += share;
    const e = addDays(start, Math.round(cursor * length / 100));
    const span = Math.max(1, daysBetween(s, e)), elapsed = daysBetween(s, today);
    // Progress follows the calendar, with one optional step running behind schedule.
    let pct = elapsed <= 0 ? 0 : elapsed >= span ? 100 : Math.round(elapsed / span * 100 / 5) * 5;
    if (k === lateIndex && pct === 100) pct = 80;
    return { id: uid(), name, start: s, end: e, progress: pct };
  });
}

const clientNames: [string, Client['kind']][] = [
  ['Família Almeida', 'Pessoa'], ['Renata Figueiredo', 'Pessoa'], ['Clínica Viva Mais', 'Empresa'], ['Marcos e Paula Lins', 'Pessoa'], ['Café Grão Nobre', 'Empresa'], ['Thiago Barreto', 'Pessoa'],
  ['Escritório Nunes & Prado', 'Empresa'], ['Beatriz Castanho', 'Pessoa'], ['Família Serrano', 'Pessoa'], ['Loja Casa Bela', 'Empresa'], ['Juliana Vasconcelos', 'Pessoa'], ['Restaurante Brasa', 'Empresa'],
  ['Eduardo Pires', 'Pessoa'], ['Condomínio Vista Alegre', 'Empresa'], ['Família Okada', 'Pessoa'], ['Carla Menezes', 'Pessoa'], ['Academia Fortis', 'Empresa'], ['Rafael Teixeira', 'Pessoa'],
  ['Família Moretti', 'Pessoa'], ['Patrícia Gomes', 'Pessoa'], ['Ótica Visão Clara', 'Empresa'], ['Daniel e Sofia Reis', 'Pessoa'], ['Família Cardoso', 'Pessoa'], ['Pet Center Amigo', 'Empresa'],
];
const titles: Record<ProjectType, string[]> = {
  Residencial: ['Residência Almeida', 'Casa Lins', 'Residência Serrano', 'Casa Okada', 'Residência Moretti', 'Casa Reis', 'Residência Cardoso'],
  Reforma: ['Reforma apto. Figueiredo', 'Reforma cobertura Barreto', 'Reforma casa Castanho', 'Reforma apto. Vasconcelos', 'Retrofit Vista Alegre', 'Reforma apto. Menezes', 'Reforma casa Teixeira'],
  Comercial: ['Clínica Viva Mais', 'Café Grão Nobre', 'Loja Casa Bela', 'Restaurante Brasa', 'Academia Fortis', 'Ótica Visão Clara'],
  Interiores: ['Escritório Nunes & Prado', 'Interiores apto. Pires', 'Interiores Gomes', 'Pet Center Amigo'],
};
const places: [string, string][] = [['Rua das Acácias, 120', 'Campinas - SP'], ['Al. dos Ipês, 48', 'Valinhos - SP'], ['Av. Brasil, 1500', 'Campinas - SP'], ['Rua Bento Lopes, 77', 'Vinhedo - SP'], ['Rua Itororó, 310', 'Indaiatuba - SP'], ['Estr. do Mirante, 9', 'Jundiaí - SP']];
const people = ['Carlos Souza', 'Mateus Lima', 'José Ribeiro', 'Antônio Pereira', 'Luiz Fernandes', 'Wagner Alves', 'Rogério Silva', 'Edson Costa', 'Fábio Rocha', 'Marcelo Dias', 'Sérgio Nunes', 'Paulo Henrique', 'Diego Martins', 'Renan Oliveira', 'Valdir Santos', 'Jonas Freitas'];
const managers = ['Eng. Ricardo Alves', 'Arq. Fernanda Lopes', 'Eng. Bruno Matos'];
const purchaseItems: [number, string, number][] = [
  [1, 'Concreto usinado e aço CA-50', 0.12], [0, 'Cimento, areia e blocos', 0.07], [2, 'Cabos, quadros e disjuntores', 0.05], [3, 'Tubos, conexões e registros', 0.04],
  [4, 'Porcelanato e argamassa', 0.08], [5, 'Esquadrias de alumínio e vidros', 0.09], [6, 'Locação de andaimes e betoneira', 0.02], [7, 'Equipe de gesso e drywall', 0.04],
];

export function makeSeed(now = Date.now()): Store {
  const today = dayKey(now);
  const suppliers: Supplier[] = [
    ['Depósito Central', 0], ['ConcreFort Usinados', 1], ['Elétrica Luz Forte', 2], ['Hidro Tubos', 3], ['Portobello Shop Campinas', 4], ['Alumax Esquadrias', 5], ['LocaMaq Equipamentos', 6], ['Gesso & Cia', 7], ['Aço Paulista', 1], ['Casa do Construtor', 0],
  ].map(([name, c], i) => ({ id: `s${i}`, name: name as string, category: categories[c as number], contact: ['Márcio', 'Sandra', 'Rui', 'Telma', 'Vanessa', 'Gilberto', 'Neusa', 'Odair', 'Celso', 'Rose'][i], phone: `(19) 9${8100 + i * 37}-${String(4100 + i * 163).slice(-4)}`, rating: [4, 5, 5, 4, 5, 4, 4, 5, 4, 3][i] }));
  const clients: Client[] = clientNames.map(([name, kind], i) => ({ id: `c${i}`, name, kind, email: `${name.split(' ').slice(-1)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com`, phone: `(19) 9${7200 + i * 59}-${String(2300 + i * 141).slice(-4)}`, source: sources[i % sources.length], createdAt: addDays(today, -400 + i * 13) }));
  // [type, start offset, duration in days, budget in thousands, status override]
  const plan: [ProjectType, number, number, number, Status?][] = [
    ['Residencial', -95, 130, 420], ['Reforma', -35, 90, 118], ['Comercial', -60, 150, 640], ['Residencial', -120, 200, 780], ['Interiores', -20, 75, 96], ['Reforma', -12, 60, 64],
    ['Comercial', -95, 140, 350], ['Residencial', -40, 220, 560, 'Pausada'], ['Reforma', 9, 70, 82, 'Planejamento'], ['Residencial', 18, 240, 690, 'Planejamento'], ['Interiores', 25, 60, 74, 'Planejamento'],
    ['Reforma', -150, 110, 135, 'Concluída'], ['Residencial', -330, 260, 610, 'Concluída'], ['Comercial', -260, 160, 410, 'Concluída'], ['Reforma', -205, 80, 92, 'Concluída'], ['Interiores', -190, 70, 88, 'Concluída'],
    ['Residencial', -420, 300, 720, 'Concluída'], ['Reforma', -110, 75, 70, 'Concluída'], ['Comercial', -365, 150, 380, 'Concluída'], ['Reforma', -300, 90, 105, 'Concluída'],
  ];
  const used: Record<ProjectType, number> = { Residencial: 0, Reforma: 0, Comercial: 0, Interiores: 0 };
  let n = 1;
  const projects: Project[] = plan.map(([type, offset, length, k, override], i) => {
    const start = addDays(today, offset), end = addDays(start, length);
    const title = titles[type][used[type]++ % titles[type].length];
    const client = clients.find(c => title.includes(c.name.replace('Família ', ''))) ?? clients[i % clients.length];
    const status: Status = override ?? 'Em execução';
    const budget = k * 1000 + (i % 3) * 2500;
    // The featured project (first) and two others carry a delayed step so alerts show up.
    let milestones = makeMilestones(type, start, end, status === 'Concluída' ? addDays(end, 1) : today, i === 2 || i === 6 ? 1 : -1);
    if (i === 0) milestones = milestones.map((m, j) => j === 2 ? { ...m, progress: 90 } : m);
    if (status === 'Pausada') milestones = milestones.map(m => m.progress > 0 && m.progress < 100 ? { ...m, progress: Math.min(m.progress, 40) } : m);
    const done = status === 'Concluída' ? 100 : progressOf(milestones);
    const purchases: Purchase[] = status === 'Planejamento' ? purchaseItems.slice(0, 2).map(([s, item, share]) => ({ id: uid(), supplierId: `s${s}`, item, value: Math.round(budget * share / 10) * 10, status: 'Cotação', due: addDays(start, 5), paid: false })) :
      purchaseItems.filter((_, j) => type !== 'Interiores' || j > 1).map(([s, item, share], j) => {
        const due = addDays(start, Math.round(length * (j + 1) / 10));
        const st: PurchaseStatus = due < today || status === 'Concluída' ? 'Entregue' : due < addDays(today, 30) ? 'Pedido' : 'Cotação';
        return { id: uid(), supplierId: `s${j === 0 && i % 2 ? 8 : j === 1 && i % 2 ? 9 : s}`, item, value: Math.round(budget * share * (0.92 + (i % 5) * 0.03) / 10) * 10, status: st, due, paid: st === 'Entregue' && (due < addDays(today, -20) || status === 'Concluída') };
      });
    const installments: Installment[] = ['Entrada', 'Medição 1', 'Medição 2', 'Medição 3', 'Entrega das chaves'].map((label, j) => {
      const due = addDays(start, j === 0 ? -7 : Math.round(length * j / 4));
      return { id: uid(), label, due, value: Math.round(budget * [0.2, 0.2, 0.2, 0.2, 0.2][j]), paid: due < today && !(i === 1 && j === 1) };
    });
    const team: Member[] = status === 'Concluída' ? [] : Array.from({ length: type === 'Interiores' ? 4 : type === 'Reforma' ? 5 : 8 }, (_, j) => ({ id: uid(), name: people[(i * 3 + j) % people.length], role: roles[j % roles.length] }));
    const log: LogEntry[] = status === 'Em execução' ? [
      { id: uid(), date: addDays(today, -1), text: i === 0 ? 'Passagem de tubulação hidráulica no 2º pavimento concluída. Aguardando teste de estanqueidade.' : 'Equipe completa no canteiro. Serviços seguindo o cronograma.' },
      { id: uid(), date: addDays(today, -4), text: i === 0 ? 'Chuva forte pela manhã; equipe focou nos serviços internos.' : 'Recebimento de material conferido com a nota fiscal.' },
      { id: uid(), date: addDays(today, -9), text: 'Visita técnica com o cliente para alinhamento de acabamentos.' },
    ] : [];
    const cover = type === 'Residencial' ? photoCovers[(used.Residencial - 1) % photoCovers.length] : '';
    return { id: `p${i}`, code: `AL-${String(1000 + n++)}`, type, title, clientId: client.id, address: places[i % places.length][0], city: places[i % places.length][1], start, end, budget, status, cover, manager: managers[i % managers.length], milestones: status === 'Concluída' ? milestones.map(m => ({ ...m, progress: 100 })) : milestones, purchases, installments: done === 100 ? installments.map(x => ({ ...x, paid: true })) : installments, team, log, notes: i === 0 ? 'Cliente pediu revisão do porcelanato da área gourmet antes da compra.' : '', createdAt: addDays(start, -30) };
  });
  const item = (desc: string, qty: number, unit: string, price: number): QuoteItem => ({ id: uid(), desc, qty, unit, price });
  const quote = (i: number, type: ProjectType, title: string, clientId: string, status: QuoteStatus, age: number, items: QuoteItem[], projectId?: string): Quote => ({ id: `q${i}`, code: `OR-${String(2040 + i)}`, type, title, clientId, city: places[i % places.length][1], items, status, createdAt: addDays(today, -age), validUntil: addDays(today, 30 - age), projectId });
  const quotes: Quote[] = [
    quote(0, 'Reforma', 'Reforma cozinha e área gourmet', 'c15', 'Enviado', 6, [item('Demolição e retirada de entulho', 1, 'vb', 4800), item('Instalações hidráulicas', 1, 'vb', 9600), item('Porcelanato 90x90 assentado', 46, 'm²', 310), item('Bancada em quartzo', 6.5, 'm', 2100)]),
    quote(1, 'Residencial', 'Casa térrea 180 m²', 'c17', 'Enviado', 11, [item('Fundação e estrutura', 180, 'm²', 980), item('Alvenaria e cobertura', 180, 'm²', 640), item('Instalações', 180, 'm²', 290), item('Acabamentos padrão alto', 180, 'm²', 860)]),
    quote(2, 'Comercial', 'Fit-out loja 90 m²', 'c20', 'Rascunho', 2, [item('Drywall e forro', 140, 'm²', 120), item('Elétrica e iluminação', 1, 'vb', 18500), item('Piso vinílico', 90, 'm²', 165)]),
    quote(3, 'Interiores', 'Home office e closet', 'c19', 'Enviado', 19, [item('Marcenaria sob medida', 1, 'vb', 38000), item('Iluminação em LED', 1, 'vb', 6400)]),
    quote(4, 'Reforma', 'Reforma banheiros (2)', 'c21', 'Recusado', 34, [item('Reforma completa de banheiro', 2, 'un', 21500)]),
    quote(5, 'Residencial', 'Sobrado 260 m²', 'c22', 'Rascunho', 1, [item('Estrutura e alvenaria', 260, 'm²', 1450), item('Instalações e acabamentos', 260, 'm²', 1120)]),
    quote(6, 'Comercial', 'Pet shop 120 m²', 'c23', 'Enviado', 4, [item('Adequação de layout', 120, 'm²', 520), item('Hidráulica para banho e tosa', 1, 'vb', 14800)]),
    quote(7, 'Reforma', 'Reforma apto. Figueiredo', 'c1', 'Aprovado', 50, [item('Reforma completa', 1, 'vb', 118000)], 'p1'),
    quote(8, 'Interiores', 'Interiores Escritório Nunes & Prado', 'c6', 'Aprovado', 40, [item('Projeto de interiores e execução', 1, 'vb', 96000)], 'p4'),
  ];
  return { projects, quotes, clients, suppliers, settings: { owner: 'Igor', company: 'Alvorada Construção e Reforma' }, next: n };
}
const progressOf = (milestones: Milestone[]) => progress({ milestones } as Project);
