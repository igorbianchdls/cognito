export type Project = { id: string; name: string; client: string; date: string; start: string; venue: string; area: number; value: number; cost: number; status: string; progress: number; health: 'No prazo' | 'Em atenção'; image: string; email: string; phone: string };
export type Task = { id: string; projectId: string; title: string; owner: string; due: string; done: boolean; phase: string };
export type Appointment = { id: string; title: string; projectId: string; date: string; time: string; end: string; type: string };
export type Supplier = { id: string; name: string; category: string; contact: string; price: number; status: string };
export type Entry = { id: string; projectId: string; title: string; type: 'Receita' | 'Despesa'; category: string; value: number; date: string; paid: boolean };
export type Purchase = { id: string; projectId: string; title: string; quantity: number; unit: string; supplier: string; date: string; status: string; image: string };
export type Store = { projects: Project[]; tasks: Task[]; appointments: Appointment[]; suppliers: Supplier[]; entries: Entry[]; purchases: Purchase[]; notes: Record<string, string>; messages: { id: string; text: string; date: string }[] };
export const image = (name: string) => `/obras-media/${name}.jpg`;
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', options);
export const stages = ['Novo contato', 'Orçamento enviado', 'Contratada', 'Em execução', 'Concluída'];
export const phases = ['Projeto e aprovações', 'Fundação e estrutura', 'Instalações', 'Revestimentos', 'Acabamentos', 'Vistoria e entrega'];
const project = (id: string, name: string, client: string, date: string, venue: string, progress: number, imageName: string, value: number, status = 'Em execução', health: Project['health'] = 'No prazo'): Project => ({ id, name, client, date, start: '2026-08-03', venue, area: 320, value, cost: Math.round(value * .68), status, progress, health, image: imageName, email: `${id}@example.com`, phone: '(85) 99912-3456' });
export const seed: Store = {
  projects: [
    project('p1', 'Casa da Praia', 'Mariana e Fernando', '2026-12-18', 'Condomínio Enseada · Fortaleza, CE', 68, 'hero', 950000),
    project('p2', 'Reforma Apartamento 402', 'Camila Rocha', '2026-12-04', 'Meireles · Fortaleza, CE', 42, 'apartment', 180000, 'Em execução', 'Em atenção'),
    project('p3', 'Clínica Essencial', 'Clínica Essencial Ltda.', '2026-11-20', 'Aldeota · Fortaleza, CE', 81, 'clinic', 290000),
    project('p4', 'Residência das Palmeiras', 'Ricardo e Paula', '2027-02-12', 'Eusébio, CE', 24, 'residence', 720000),
    project('p5', 'Reforma Casa Borges', 'João Borges', '2026-12-11', 'Parquelândia · Fortaleza, CE', 55, 'apartment', 220000),
    project('p6', 'Apartamento 301', 'Beatriz Alves', '2026-11-27', 'Meireles · Fortaleza, CE', 73, 'apartment', 150000),
    project('p7', 'Escritório Horizonte', 'Horizonte Consultoria', '2027-01-15', 'Cocó · Fortaleza, CE', 36, 'clinic', 310000),
    project('p8', 'Casa Jardim do Sol', 'Lucas Martins', '2027-03-05', 'Porto das Dunas, CE', 18, 'residence', 840000),
    project('p9', 'Casa Jardim das Dunas', 'Ana Lima', '2027-05-20', 'Dunas · Fortaleza, CE', 0, 'residence', 180000, 'Novo contato'),
    project('p10', 'Reforma Escritório Bravo', 'Bravo Arquitetura', '2027-02-15', 'Aldeota · Fortaleza, CE', 0, 'apartment', 140000, 'Novo contato'),
    ...['Residência Lagoa', 'Reforma Cobertura 501', 'Casa dos Ipês', 'Clínica Bem Viver', 'Loja Conceito', 'Apartamento Mirante'].map((name, i) => project(`q${i}`, name, ['Fernanda Costa', 'Pedro Melo', 'Julia Andrade', 'Bem Viver Ltda.', 'Luiza Freitas', 'Marcos Nunes'][i], `2027-0${i < 3 ? 3 : 4}-15`, 'Fortaleza, CE', 0, i % 2 ? 'apartment' : 'residence', [220000, 180000, 340000, 160000, 98000, 125000][i], 'Orçamento enviado')),
    project('p11', 'Residência do Parque', 'Sofia e Daniel', '2027-06-10', 'Eusébio, CE', 0, 'residence', 650000, 'Contratada'),
    project('p12', 'Reforma Studio 208', 'Gabriela Gomes', '2027-01-29', 'Meireles · Fortaleza, CE', 0, 'apartment', 98000, 'Contratada'),
    project('c1', 'Casa das Oliveiras', 'Maria Oliveira', '2026-10-15', 'Eusébio, CE', 100, 'residence', 420000, 'Concluída'),
    project('c2', 'Apartamento 601', 'André Santos', '2026-10-09', 'Meireles · Fortaleza, CE', 100, 'apartment', 180000, 'Concluída'),
    project('c3', 'Consultório Alameda', 'Dra. Laura Mendes', '2026-09-25', 'Aldeota · Fortaleza, CE', 100, 'clinic', 260000, 'Concluída'),
    project('c4', 'Casa Varanda', 'Paulo e Helena', '2026-09-11', 'Fortaleza, CE', 100, 'hero', 260000, 'Concluída'),
  ],
  tasks: [
    { id: 't1', projectId: 'p1', title: 'Aprovar projeto executivo', owner: 'Mariana Silva', due: '2026-08-10', done: true, phase: phases[0] },
    { id: 't2', projectId: 'p1', title: 'Conferir estrutura e impermeabilização', owner: 'Rafael Lima', due: '2026-09-18', done: true, phase: phases[1] },
    { id: 't3', projectId: 'p1', title: 'Vistoriar instalações elétricas', owner: 'Rafael Lima', due: '2026-10-28', done: false, phase: phases[2] },
    { id: 't4', projectId: 'p1', title: 'Conferir entrega de porcelanato', owner: 'Ana Costa', due: '2026-10-29', done: false, phase: phases[3] },
    { id: 't5', projectId: 'p1', title: 'Aprovar pintura e marcenaria', owner: 'Mariana Silva', due: '2026-11-20', done: false, phase: phases[4] },
    { id: 't6', projectId: 'p1', title: 'Realizar vistoria final com cliente', owner: 'Rafael Lima', due: '2026-12-18', done: false, phase: phases[5] },
    { id: 't7', projectId: 'p2', title: 'Revisar medição de serviços', owner: 'Rafael Lima', due: '2026-10-27', done: false, phase: phases[2] },
    { id: 't8', projectId: 'p3', title: 'Conferir esquadrias de alumínio', owner: 'Ana Costa', due: '2026-10-28', done: false, phase: phases[4] },
    { id: 't9', projectId: 'p4', title: 'Programar concretagem da laje', owner: 'Rafael Lima', due: '2026-10-30', done: false, phase: phases[1] },
  ],
  appointments: [
    { id: 'a1', title: 'Visita técnica', projectId: 'p1', date: '2026-10-26', time: '09:00', end: '10:00', type: 'Visita técnica' },
    { id: 'a2', title: 'Medição de serviços', projectId: 'p2', date: '2026-10-27', time: '14:00', end: '15:00', type: 'Medição' },
    { id: 'a3', title: 'Entrega de materiais', projectId: 'p3', date: '2026-10-28', time: '08:00', end: '10:00', type: 'Entrega' },
    { id: 'a4', title: 'Reunião com cliente', projectId: 'p4', date: '2026-10-29', time: '15:00', end: '16:00', type: 'Reunião' },
    { id: 'a5', title: 'Vistoria de acabamento', projectId: 'p1', date: '2026-10-30', time: '10:00', end: '11:00', type: 'Vistoria' },
  ],
  suppliers: [
    { id: 's1', name: 'Casa dos Revestimentos', category: 'Revestimentos', contact: 'Paulo · (85) 99888-1200', price: 18500, status: 'Confirmado' },
    { id: 's2', name: 'Depósito Construir', category: 'Materiais básicos', contact: 'Renato · (85) 99888-1300', price: 9200, status: 'Confirmado' },
    { id: 's3', name: 'Alumínio Prime', category: 'Esquadrias', contact: 'Lucas · (85) 99888-1400', price: 24000, status: 'Em negociação' },
    { id: 's4', name: 'Elétrica Fortaleza', category: 'Elétrica', contact: 'Clara · (85) 99888-1500', price: 6800, status: 'Confirmado' },
    { id: 's5', name: 'Marcenaria Nativa', category: 'Marcenaria', contact: 'Bruno · (85) 99888-1600', price: 32000, status: 'Confirmado' },
  ],
  entries: [
    { id: 'f1', projectId: 'p1', title: 'Medição de outubro · Casa da Praia', type: 'Receita', category: 'Medição', value: 180000, date: '2026-10-10', paid: true },
    { id: 'f2', projectId: 'p2', title: 'Parcela de execução · Apartamento 402', type: 'Receita', category: 'Contrato', value: 60000, date: '2026-10-15', paid: true },
    { id: 'f3', projectId: 'p3', title: 'Medição de acabamento · Clínica', type: 'Receita', category: 'Medição', value: 95000, date: '2026-10-28', paid: false },
    { id: 'f4', projectId: 'p4', title: 'Parcela de estrutura · Palmeiras', type: 'Receita', category: 'Contrato', value: 85000, date: '2026-10-30', paid: false },
    { id: 'f5', projectId: 'p1', title: 'Materiais de construção', type: 'Despesa', category: 'Materiais', value: 120330, date: '2026-10-26', paid: true },
    { id: 'f6', projectId: 'p1', title: 'Folha de mão de obra', type: 'Despesa', category: 'Mão de obra', value: 100275, date: '2026-10-30', paid: false },
    { id: 'f7', projectId: 'p3', title: 'Serviços terceirizados', type: 'Despesa', category: 'Terceirizados', value: 42975, date: '2026-10-28', paid: false },
    { id: 'f8', projectId: 'p2', title: 'Fretes e despesas de apoio', type: 'Despesa', category: 'Outros', value: 22920, date: '2026-10-20', paid: true },
    ...[5, 6, 7, 8, 9].flatMap((month, i) => [
      { id: `h${month}r`, projectId: 'p1', title: 'Medições consolidadas', type: 'Receita' as const, category: 'Medição', value: [160000, 220000, 275000, 340000, 405000][i], date: `2026-0${month}-15`, paid: true },
      { id: `h${month}d`, projectId: 'p1', title: 'Custos consolidados', type: 'Despesa' as const, category: 'Materiais', value: [106000, 145000, 183000, 227000, 275000][i], date: `2026-0${month}-20`, paid: true },
    ]),
  ],
  purchases: [
    { id: 'm1', projectId: 'p1', title: 'Porcelanato natural', quantity: 120, unit: 'm²', supplier: 'Casa dos Revestimentos', date: '2026-10-29', status: 'Em entrega', image: 'porcelain' },
    { id: 'm2', projectId: 'p4', title: 'Cimento CP II', quantity: 80, unit: 'sacos', supplier: 'Depósito Construir', date: '2026-10-26', status: 'Entregue', image: 'cement' },
    { id: 'm3', projectId: 'p3', title: 'Esquadrias de alumínio', quantity: 12, unit: 'unidades', supplier: 'Alumínio Prime', date: '2026-11-03', status: 'A confirmar', image: 'windows' },
  ],
  notes: {}, messages: [],
};
