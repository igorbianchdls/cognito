export type Wedding = { id: string; couple: string; date: string; venue: string; guests: number; value: number; cost: number; status: string; image: string; email: string; phone: string };
export type Task = { id: string; weddingId: string; title: string; owner: string; due: string; done: boolean };
export type Appointment = { id: string; title: string; weddingId: string; date: string; time: string; end: string; type: string };
export type Supplier = { id: string; name: string; category: string; contact: string; price: number; status: string };
export type Entry = { id: string; weddingId: string; title: string; type: 'Receita' | 'Despesa'; category: string; value: number; date: string; paid: boolean };
export type Store = { weddings: Wedding[]; tasks: Task[]; appointments: Appointment[]; suppliers: Supplier[]; entries: Entry[]; notes: Record<string, string>; messages: { id: string; text: string; date: string }[] };
export const image = (name: string) => `/eventos-media/${name}.jpg`;
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', options);
export const stages = ['Primeiro contato', 'Proposta enviada', 'Contratado', 'Em produção', 'Realizado'];
export const seed: Store = {
  weddings: [
    { id: 'w1', couple: 'Marina e Pedro', date: '2026-10-31', venue: 'Fazenda Santa Helena', guests: 320, value: 148000, cost: 98000, status: 'Em produção', image: 'hero', email: 'marina.pedro@example.com', phone: '(85) 99912-3456' },
    { id: 'w2', couple: 'Ana e João', date: '2026-11-07', venue: 'Villa do Mar', guests: 180, value: 96000, cost: 62000, status: 'Contratado', image: 'wedding-1', email: 'ana.joao@example.com', phone: '(85) 99923-4567' },
    { id: 'w3', couple: 'Isabela e Lucas', date: '2026-11-12', venue: 'Casa das Palmeiras', guests: 250, value: 112000, cost: 74000, status: 'Proposta enviada', image: 'lounge', email: 'isabela.lucas@example.com', phone: '(85) 99934-5678' },
    { id: 'w4', couple: 'Julia e Rafael', date: '2026-11-21', venue: 'Jardim das Oliveiras', guests: 220, value: 84000, cost: 54000, status: 'Primeiro contato', image: 'wedding-2', email: 'julia.rafael@example.com', phone: '(85) 99945-6789' },
    { id: 'w5', couple: 'Beatriz e André', date: '2026-12-05', venue: 'Espaço Riviera', guests: 160, value: 72000, cost: 46000, status: 'Contratado', image: 'tables', email: 'beatriz.andre@example.com', phone: '(85) 99956-7890' },
    { id: 'w6', couple: 'Helena e Thiago', date: '2026-10-17', venue: 'Villa do Mar', guests: 200, value: 124000, cost: 79000, status: 'Realizado', image: 'wedding-1', email: 'helena.thiago@example.com', phone: '(85) 99967-8901' },
    { id: 'w7', couple: 'Laura e Henrique', date: '2026-10-10', venue: 'Casa das Palmeiras', guests: 150, value: 86000, cost: 55000, status: 'Realizado', image: 'wedding-2', email: 'laura.henrique@example.com', phone: '(85) 99978-9012' },
  ],
  tasks: [
    { id: 't1', weddingId: 'w1', title: 'Aprovar projeto floral e cenografia', owner: 'Mariana Silva', due: '2026-10-27', done: true },
    { id: 't2', weddingId: 'w1', title: 'Confirmar menu final com o buffet', owner: 'Ana Costa', due: '2026-10-28', done: false },
    { id: 't3', weddingId: 'w1', title: 'Finalizar mapa de mesas', owner: 'Mariana Silva', due: '2026-10-29', done: false },
    { id: 't4', weddingId: 'w1', title: 'Alinhar roteiro da cerimônia', owner: 'Julia Martins', due: '2026-10-30', done: false },
    { id: 't5', weddingId: 'w2', title: 'Agendar degustação do menu', owner: 'Ana Costa', due: '2026-10-29', done: false },
    { id: 't6', weddingId: 'w2', title: 'Conferir contratos dos fornecedores', owner: 'Julia Martins', due: '2026-10-30', done: true },
  ],
  appointments: [
    { id: 'a1', title: 'Reunião com o casal', weddingId: 'w1', date: '2026-10-26', time: '10:00', end: '11:00', type: 'Reunião' },
    { id: 'a2', title: 'Visita técnica', weddingId: 'w2', date: '2026-10-27', time: '14:00', end: '16:00', type: 'Visita' },
    { id: 'a3', title: 'Prova de menu', weddingId: 'w1', date: '2026-10-28', time: '15:00', end: '17:00', type: 'Degustação' },
    { id: 'a4', title: 'Conferência da montagem', weddingId: 'w1', date: '2026-10-29', time: '08:00', end: '18:00', type: 'Montagem' },
    { id: 'a5', title: 'Alinhamento de equipe', weddingId: 'w1', date: '2026-10-30', time: '09:00', end: '10:00', type: 'Equipe' },
  ],
  suppliers: [
    { id: 's1', name: 'Ateliê Flora', category: 'Decoração', contact: 'Lívia · (85) 99888-1200', price: 18000, status: 'Confirmado' },
    { id: 's2', name: 'Maison Buffet', category: 'Buffet', contact: 'Renato · (85) 99888-1300', price: 32000, status: 'Confirmado' },
    { id: 's3', name: 'Luz & Som', category: 'Audiovisual', contact: 'Lucas · (85) 99888-1400', price: 12000, status: 'Em negociação' },
    { id: 's4', name: 'Doce Memória', category: 'Bolo e doces', contact: 'Clara · (85) 99888-1500', price: 6800, status: 'Confirmado' },
    { id: 's5', name: 'Olhar Filmes', category: 'Foto e vídeo', contact: 'Bruno · (85) 99888-1600', price: 9800, status: 'Confirmado' },
    { id: 's6', name: 'Quarteto Allegro', category: 'Música', contact: 'Felipe · (85) 99888-1700', price: 4200, status: 'Em negociação' },
  ],
  entries: [
    { id: 'f1', weddingId: 'w1', title: 'Sinal do contrato', type: 'Receita', category: 'Contrato', value: 74000, date: '2026-10-02', paid: true },
    { id: 'f2', weddingId: 'w1', title: 'Parcela final do casamento', type: 'Receita', category: 'Contrato', value: 74000, date: '2026-10-30', paid: false },
    { id: 'f3', weddingId: 'w6', title: 'Contrato Helena e Thiago', type: 'Receita', category: 'Contrato', value: 124000, date: '2026-10-16', paid: true },
    { id: 'f4', weddingId: 'w7', title: 'Contrato Laura e Henrique', type: 'Receita', category: 'Contrato', value: 86000, date: '2026-10-09', paid: true },
    { id: 'f5', weddingId: 'w1', title: 'Buffet e bebidas', type: 'Despesa', category: 'Buffet', value: 32000, date: '2026-10-28', paid: false },
    { id: 'f6', weddingId: 'w1', title: 'Flores e cenografia', type: 'Despesa', category: 'Decoração', value: 18000, date: '2026-10-26', paid: true },
    { id: 'f7', weddingId: 'w1', title: 'Equipe de produção', type: 'Despesa', category: 'Equipe', value: 8000, date: '2026-10-31', paid: false },
    { id: 'f8', weddingId: 'w6', title: 'Custos de produção', type: 'Despesa', category: 'Produção', value: 79000, date: '2026-10-17', paid: true },
    { id: 'f9', weddingId: 'w7', title: 'Custos de produção', type: 'Despesa', category: 'Produção', value: 55000, date: '2026-10-10', paid: true },
    { id: 'f10', weddingId: 'w2', title: 'Sinal do contrato', type: 'Receita', category: 'Contrato', value: 48000, date: '2026-11-01', paid: false },
  ],
  notes: {}, messages: [],
};
