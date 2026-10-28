import type { Appointment, Brand, Entry, Person } from './common';
export type Order = { id: string; number: string; title: string; client: string; contact: string; identifier: string; issue: string; diagnosis: string; amount: number; cost: number; status: string; photo: string; due: string; time: string; tech: string; progress: number; delivered: string; warranty: number };
export type Part = { id: string; name: string; category: string; quantity: number; minimum: number; cost: number; price: number; photo: string };
export type Allocation = { id: string; orderId: string; partId: string; quantity: number; price: number };
export type ServiceStore = { orders: Order[]; parts: Part[]; entries: Entry[]; appointments: Appointment[]; suppliers: Person[]; allocations: Allocation[]; messages: { id: string; text: string; date: string }[]; notes: Record<string, string> };
export type ServiceConfig = Brand & { stages: string[]; team: string[]; seed: ServiceStore };

export function makeServiceConfig(): ServiceConfig {
  const slug = 'assistencia';
  const stages = ['Recebido', 'Em diagnóstico', 'Aguardando aprovação', 'Aguardando peças', 'Em reparo', 'Pronto para retirada', 'Entregue'];
  const titles = ['iPhone 14 Pro', 'MacBook Air M2', 'Samsung S23', 'Notebook Dell'];
  const clients = ['Ana Costa', 'Lucas Martins', 'Camila Rocha', 'Rafael Lima', 'Pedro Almeida', 'Juliana Nunes'];
  const issues = ['Troca de tela', 'Diagnóstico de placa', 'Troca de bateria', 'Limpeza e revisão'];
  const photos = ['iphone', 'macbook', 'samsung', 'notebook'];
  const team = ['Lucas Martins', 'André Santos', 'Marina Costa'];
  const order = (i: number, status: string): Order => ({ id: `os-${i}`, number: String((1048) + i), title: titles[i % 4], client: clients[i % clients.length], contact: '(85) 99912-3456', identifier: `SN-${104800 + i}`, issue: issues[i % 4], diagnosis: i % 3 ? '' : 'Recebimento conferido. Testes iniciais realizados; serviço aguardando execução e validação final.', amount: [1450, 980, 390, 280][i % 4], cost: [780, 420, 170, 70][i % 4], status, photo: photos[i % 4], due: `2026-10-${String(26 + i % 5).padStart(2, '0')}`, time: ['17:00', '16:00', '15:30', '14:00'][i % 4], tech: team[i % 3], progress: status === stages[5] || status === 'Entregue' ? 100 : status === stages[4] ? 65 : 30, delivered: status === 'Entregue' ? '2026-10-20' : '', warranty: 90 });
  const orders = [order(0, stages[4]), order(1, stages[1]), order(2, stages[2]), order(3, stages[5])];
  const targetApproval = 12, targetReady = 8, targetOpen = 38;
  while (orders.filter(o => o.status === stages[2]).length < targetApproval) orders.push(order(orders.length, stages[2]));
  while (orders.filter(o => o.status === stages[5]).length < targetReady) orders.push(order(orders.length, stages[5]));
  while (orders.length < targetOpen) orders.push(order(orders.length, [stages[0], stages[1], stages[4]][orders.length % 3]));
  orders.push(order(orders.length, 'Entregue'), order(orders.length + 1, 'Entregue'));
  const totalRevenue = 42800, totalCost = 25600;
  const entries: Entry[] = [{ id: 'income-1', title: 'Serviços e vendas de outubro', type: 'Receita', amount: totalRevenue - (6800), date: '2026-10-20', paid: true, category: 'Serviços' }, { id: 'income-2', title: 'Serviços previstos para fechamento', type: 'Receita', amount: 6800, date: '2026-10-30', paid: false, category: 'Serviços' }, { id: 'cost-1', title: 'Peças e insumos', type: 'Despesa', amount: Math.round(totalCost * .65), date: '2026-10-25', paid: true, category: 'Peças' }, { id: 'cost-2', title: 'Equipe e operação', type: 'Despesa', amount: totalCost - Math.round(totalCost * .65), date: '2026-10-30', paid: false, category: 'Operação' }];
  for (let m = 5; m <= 9; m++) { entries.push({ id: `h-${m}-r`, title: 'Receitas consolidadas', type: 'Receita', amount: Math.round(totalRevenue * (.45 + (m - 5) * .09)), date: `2026-0${m}-15`, paid: true, category: 'Serviços' }, { id: `h-${m}-d`, title: 'Custos consolidados', type: 'Despesa', amount: Math.round(totalCost * (.45 + (m - 5) * .09)), date: `2026-0${m}-20`, paid: true, category: 'Operação' }); }
  const parts: Part[] = [{ id: 'p1', name: 'Tela OLED iPhone 14', category: 'Telas', quantity: 2, minimum: 3, cost: 690, price: 1100, photo: 'part-1' }, { id: 'p2', name: 'Bateria Samsung S23', category: 'Baterias', quantity: 8, minimum: 3, cost: 120, price: 240, photo: 'part-2' }, { id: 'p3', name: 'Conector USB-C', category: 'Conectores', quantity: 15, minimum: 5, cost: 20, price: 65, photo: 'part-3' }];
  const appointments: Appointment[] = ['Recebimento e diagnóstico', 'Diagnóstico técnico', 'Aprovação de orçamento', 'Testes e verificação', 'Retirada de aparelho'].map((title, i) => ({ id: `a${i}`, title, reference: orders[i].id, date: '2026-10-26', time: ['09:00', '10:30', '13:00', '15:00', '17:00'][i], end: ['10:00', '11:30', '14:00', '16:00', '18:00'][i] }));
  return { slug, name: 'NEXO', subtitle: 'ASSISTÊNCIA TÉCNICA', description: 'Cada aparelho acompanhado. Cada entrega no prazo.', stages, team, primary: 'Nova ordem', menus: ['Visão geral', 'Ordens de serviço', 'Agenda', 'Aparelhos', 'Clientes', 'Técnicos', 'Peças e estoque', 'Orçamentos', 'Financeiro', 'Garantias', 'Relatórios', 'Mensagens'], seed: { orders, parts, entries, appointments, allocations: [], suppliers: [{ id: 's1', name: 'Peças & Componentes', category: 'Peças', contact: 'Paulo · (85) 99888-1200' }, { id: 's2', name: 'Tech Distribuidora', category: 'Distribuição', contact: 'Ana · (85) 99888-1300' }], messages: [], notes: {} } };
}
