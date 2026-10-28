export const types = ['Casamento', 'Aniversário', 'Corporativo', 'Debutante'] as const;
export type EventType = (typeof types)[number];
export const stages = ['Orçamento', 'Contratado', 'Em planejamento', 'Realizado'] as const;
export type Stage = (typeof stages)[number] | 'Cancelado';
export const phases = ['Planejamento', 'Fornecedores', 'Checklist final'] as const;
export type Phase = (typeof phases)[number];
export type Rsvp = 'Confirmado' | 'Pendente' | 'Recusado';
export type Task = { id: string; phase: Phase; title: string; due: string; done: boolean };
export type Booking = { id: string; supplierId: string; service: string; value: number; paid: boolean };
export type Installment = { id: string; label: string; due: string; value: number; paid: boolean };
export type Guest = { id: string; name: string; group: string; rsvp: Rsvp; table: number };
export type Event = {
  id: string; code: string; type: EventType; title: string; clientId: string; date: string; time: string; venue: string; city: string;
  expected: number; value: number; stage: Stage; cover: string; tasks: Task[]; bookings: Booking[]; installments: Installment[]; guests: Guest[];
  galleryDelivered: boolean; notes: string; createdAt: string;
};
export type Client = { id: string; name: string; kind: 'Casal' | 'Pessoa' | 'Empresa'; email: string; phone: string; source: string; createdAt: string };
export type Supplier = { id: string; name: string; category: string; contact: string; phone: string; rating: number };
export type Settings = { owner: string; company: string };
export type Store = { events: Event[]; clients: Client[]; suppliers: Supplier[]; settings: Settings; next: number };

export const storageKey = 'velia-eventos-v1';
export const categories = ['Espaço', 'Buffet', 'Decoração', 'Fotografia e vídeo', 'Som e iluminação', 'Doces e bolo', 'Cerimonial'];
export const sources = ['Instagram', 'Indicação', 'Site', 'Feira de noivas', 'Google'];
export const weddingCovers = ['arch', 'aisle', 'sunset', 'guests'];
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const dayKey = (d: Date | string | number) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const addDays = (key: string, n: number) => dayKey(new Date(`${key}T12:00`).getTime() + n * DAY);
export const brl = (v: number, digits = 0) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });
export const dateLabel = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR');
export const initials = (name: string) => name.replace(/ & /g, ' ').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const received = (e: Event) => e.installments.filter(i => i.paid).reduce((v, i) => v + i.value, 0);
export const costs = (e: Event) => e.bookings.reduce((v, b) => v + b.value, 0);
export const live = (e: Event) => e.stage !== 'Cancelado' && e.stage !== 'Orçamento';

export type PhaseStatus = 'Concluído' | 'Em andamento' | 'Pendente';
export function phaseStatus(e: Event, phase: Phase | 'Dia do evento', today: string): PhaseStatus {
  if (phase === 'Dia do evento') return e.date < today || e.stage === 'Realizado' ? 'Concluído' : e.date === today ? 'Em andamento' : 'Pendente';
  const list = e.tasks.filter(t => t.phase === phase);
  const done = list.filter(t => t.done).length;
  return list.length && done === list.length ? 'Concluído' : done ? 'Em andamento' : 'Pendente';
}

const taskTemplate: [Phase, string, number][] = [
  ['Planejamento', 'Reunião de briefing com o cliente', -180], ['Planejamento', 'Definir orçamento e lista de convidados', -160], ['Planejamento', 'Contratar espaço', -150], ['Planejamento', 'Aprovar conceito de decoração', -120],
  ['Fornecedores', 'Fechar buffet e degustação', -110], ['Fornecedores', 'Contratar fotografia e vídeo', -100], ['Fornecedores', 'Contratar som e iluminação', -80], ['Fornecedores', 'Encomendar bolo e doces', -60],
  ['Checklist final', 'Confirmar presença dos convidados', -21], ['Checklist final', 'Mapa de mesas', -14], ['Checklist final', 'Reunião final com fornecedores', -7], ['Checklist final', 'Ensaio da cerimônia', -2],
];
const couples = ['Juliana & Rafael', 'Mariana & Pedro', 'Beatriz & Lucas', 'Camila & Thiago', 'Larissa & Gabriel', 'Fernanda & Bruno', 'Isabela & Matheus', 'Carolina & André', 'Letícia & Gustavo', 'Amanda & Felipe', 'Natália & Diego', 'Gabriela & Vinícius', 'Bianca & Rodrigo', 'Luiza & Henrique', 'Sofia & Daniel', 'Helena & Arthur'];
const people = ['Camila Torres', 'Valentina Rocha', 'Laura Mendes', 'Manuela Costa', 'Alice Barros', 'Roberto Lima', 'Cecília Prado', 'Marina Duarte'];
const companies = ['Tech Summit', 'Grupo Atlântico', 'Nexa Saúde', 'Banco Aurora', 'Vale Verde Agro', 'Orion Software'];
const venues: [string, string][] = [['Villa Serena', 'Itu - SP'], ['Fazenda Santa Clara', 'Atibaia - SP'], ['Espaço Jardim das Águas', 'São Paulo - SP'], ['Casa Bosque', 'Campinas - SP'], ['Hotel Grand Paulista', 'São Paulo - SP'], ['Recanto do Lago', 'Ibiúna - SP']];
const firstNames = ['Ana', 'Bruno', 'Clara', 'Davi', 'Elisa', 'Fábio', 'Giovana', 'Hugo', 'Íris', 'Jonas', 'Karina', 'Leo', 'Melissa', 'Nicolas', 'Olívia', 'Paulo', 'Rita', 'Samuel', 'Tânia', 'Victor'];
const lastNames = ['Almeida', 'Borges', 'Cardoso', 'Dias', 'Esteves', 'Farias', 'Guimarães', 'Lopes', 'Moura', 'Nogueira', 'Pacheco', 'Ramos', 'Siqueira', 'Toledo'];
const groups = ['Família da noiva', 'Família do noivo', 'Amigos', 'Trabalho'];

export function makeSeed(now = Date.now()): Store {
  const today = dayKey(now);
  const suppliers: Supplier[] = [
    ['Villa Serena', 'Espaço'], ['Fazenda Santa Clara', 'Espaço'], ['Sabor & Arte Buffet', 'Buffet'], ['Buffet Dona Flor', 'Buffet'], ['Atelier Florescer', 'Decoração'], ['Casa Ramos Decor', 'Decoração'],
    ['Lumi Fotografia', 'Fotografia e vídeo'], ['Studio Eterno', 'Fotografia e vídeo'], ['Sonora Eventos', 'Som e iluminação'], ['Doce Encanto', 'Doces e bolo'], ['Marta Cerimonial', 'Cerimonial'],
  ].map(([name, category], i) => ({ id: `s${i}`, name, category, contact: ['Paula', 'Renato', 'Sílvia', 'Jorge', 'Lívia', 'Caio', 'Tati', 'Beto', 'Igor', 'Nara', 'Marta'][i], phone: `(11) 9${8200 + i * 41}-${String(3300 + i * 179).slice(-4)}`, rating: [5, 4, 5, 4, 5, 4, 5, 5, 4, 5, 5][i] }));
  const clients: Client[] = [];
  const events: Event[] = [];
  let n = 1;
  // Upcoming events first so the overview has a clear "next event"; the first one is the featured wedding.
  const plan: [EventType, number, number][] = [
    ['Casamento', 21, 240], ['Aniversário', 35, 90], ['Corporativo', 43, 320], ['Casamento', 58, 180], ['Debutante', 72, 150], ['Casamento', 86, 200], ['Corporativo', 101, 120], ['Casamento', 118, 260], ['Aniversário', 132, 60], ['Casamento', 150, 220], ['Casamento', 176, 160], ['Debutante', 205, 130],
    ['Casamento', -6, 210], ['Corporativo', -13, 280], ['Aniversário', -20, 80], ['Casamento', -34, 190], ['Casamento', -48, 230], ['Debutante', -62, 140], ['Corporativo', -75, 200], ['Casamento', -91, 170], ['Aniversário', -104, 70], ['Casamento', -120, 250], ['Casamento', -146, 180], ['Corporativo', -170, 150], ['Casamento', -199, 210], ['Debutante', -226, 120], ['Casamento', -258, 190], ['Aniversário', -290, 100], ['Casamento', -320, 240],
  ];
  let ci = 0, pi = 0, co = 0;
  plan.forEach(([type, offset, expected], i) => {
    const date = addDays(today, offset);
    const title = type === 'Casamento' ? couples[ci++ % couples.length] : type === 'Corporativo' ? companies[co++ % companies.length] : people[pi++ % people.length];
    const client: Client = { id: `c${i}`, name: title, kind: type === 'Casamento' ? 'Casal' : type === 'Corporativo' ? 'Empresa' : 'Pessoa', email: `${title.split(/[ &]/)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com`, phone: `(11) 9${7100 + i * 53}-${String(2100 + i * 137).slice(-4)}`, source: sources[i % sources.length], createdAt: addDays(date, -210 - (i % 4) * 20) };
    clients.push(client);
    const [venue, city] = venues[i % venues.length];
    const value = Math.round((type === 'Casamento' ? 380 : type === 'Corporativo' ? 260 : type === 'Debutante' ? 300 : 220) * expected / 10) * 10 + (i % 3) * 1500;
    const stage: Stage = offset < 0 ? 'Realizado' : offset > 190 ? 'Orçamento' : offset > 140 ? 'Contratado' : 'Em planejamento';
    const tasks: Task[] = stage === 'Orçamento' ? [] : taskTemplate.map(([phase, t, rel], k) => {
      const due = addDays(date, rel);
      // Tasks before today are done, except a couple of late ones on the featured event to make the overview realistic.
      const done = due < today && !(i === 0 && (k === 9 || k === 10)) || (i === 0 && k === 8);
      return { id: uid(), phase, title: t, due, done };
    });
    const bookingCats = type === 'Casamento' ? [0, 2, 4, 6, 8, 9, 10] : type === 'Corporativo' ? [0, 3, 8, 6] : [1, 2, 5, 9, 6];
    const bookings: Booking[] = stage === 'Orçamento' ? [] : bookingCats.map((s, k) => ({ id: uid(), supplierId: `s${s}`, service: suppliers[s].category, value: Math.round(value * [0.16, 0.22, 0.12, 0.08, 0.06, 0.04, 0.05][k % 7] / 10) * 10, paid: offset < 0 || k % 3 === 0 }));
    const installments: Installment[] = stage === 'Orçamento' ? [] : ['Sinal', '2ª parcela', '3ª parcela', 'Saldo final'].map((label, k) => {
      const due = addDays(date, [-200, -120, -60, -10][k]);
      return { id: uid(), label, due, value: Math.round(value * [0.3, 0.25, 0.25, 0.2][k]), paid: due < today && !(i === 3 && k === 2) };
    });
    let guests: Guest[] = [];
    if (offset >= 0 && offset < 120 && stage !== 'Orçamento') guests = Array.from({ length: expected }, (_, g) => {
      const r = (g * 37 + i * 11) % 100;
      return { id: uid(), name: `${firstNames[(g + i) % firstNames.length]} ${lastNames[(g * 3 + i) % lastNames.length]}`, group: groups[g % groups.length], rsvp: r < (offset < 30 ? 76 : 48) ? 'Confirmado' : r < 91 ? 'Pendente' : 'Recusado', table: 1 + Math.floor(g / 10) };
    });
    events.push({ id: `e${i}`, code: `VL-${String(300 + n++)}`, type, title, clientId: client.id, date, time: type === 'Corporativo' ? '19:00' : type === 'Casamento' ? '17:00' : '20:00', venue, city, expected, value, stage, cover: type === 'Casamento' ? weddingCovers[i % weddingCovers.length] : '', tasks, bookings, installments, guests, galleryDelivered: offset < -30 || (offset < 0 && i % 2 === 0), notes: i === 0 ? 'Cerimônia ao pôr do sol à beira do lago. Noiva entra às 17h15.' : '', createdAt: client.createdAt });
  });
  // A couple of open quotes and one cancelled event for the commercial funnel.
  [['Orçamento', 'Casamento', 240, 'Rafaela & João'], ['Orçamento', 'Corporativo', 300, 'Prisma Engenharia'], ['Cancelado', 'Aniversário', 50, 'Sérgio Teles']].forEach(([stage, type, offset, title], k) => {
    const i = plan.length + k, date = addDays(today, offset as number);
    clients.push({ id: `c${i}`, name: title as string, kind: type === 'Casamento' ? 'Casal' : type === 'Corporativo' ? 'Empresa' : 'Pessoa', email: `contato${i}@email.com`, phone: `(11) 9${6100 + i * 31}-${String(1700 + i * 97).slice(-4)}`, source: sources[(i + 2) % sources.length], createdAt: addDays(today, -12 - k * 9) });
    events.push({ id: `e${i}`, code: `VL-${String(300 + n++)}`, type: type as EventType, title: title as string, clientId: `c${i}`, date, time: '18:00', venue: venues[k][0], city: venues[k][1], expected: type === 'Corporativo' ? 180 : 160, value: type === 'Corporativo' ? 52000 : 68000, stage: stage as Stage, cover: type === 'Casamento' ? 'aisle' : '', tasks: [], bookings: [], installments: [], guests: [], galleryDelivered: false, notes: '', createdAt: addDays(today, -12 - k * 9) });
  });
  return { events, clients, suppliers, settings: { owner: 'Igor', company: 'Vélia Eventos' }, next: n };
}
