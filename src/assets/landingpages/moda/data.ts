export const categories = ['Vestidos', 'Blusas', 'Calças', 'Conjuntos', 'Saias', 'Acessórios'] as const;
export type Category = (typeof categories)[number];
export const sizesAll = ['PP', 'P', 'M', 'G', 'GG', 'U'] as const;
export const channels = ['Loja', 'Instagram', 'WhatsApp', 'Site'] as const;
export type Channel = (typeof channels)[number];
export const payments = ['Pix', 'Crédito', 'Débito', 'Dinheiro'] as const;
export type Payment = (typeof payments)[number];
export const campaignChannels = ['Instagram', 'WhatsApp', 'E-mail'] as const;
export const audiences = ['Todas as clientes', 'Aniversariantes do mês', 'Inativas há 60 dias', 'Clientes VIP'] as const;
export type Audience = (typeof audiences)[number];
export const expenseCategories = ['Aluguel', 'Fornecedores', 'Salários', 'Marketing', 'Contas da loja', 'Impostos'];
export const sellers = ['Camila', 'Bruna', 'Letícia', 'Mariana', 'Júlia'];
export const palette: Record<string, string> = { Rosa: '#e98fa3', Nude: '#e6c3a8', Off: '#f4ede4', Preto: '#2c2a2e', Caramelo: '#c08a5a', Terracota: '#c9715a', Verde: '#8fa58a', Azul: '#8ea6c4', Vinho: '#8c3a4c', Bege: '#d8c3a5' };

export type Variant = { id: string; size: string; color: string; stock: number; min: number };
export type Product = { id: string; sku: string; name: string; category: Category; collection: string; price: number; cost: number; variants: Variant[]; active: boolean; createdAt: string };
export type SaleItem = { productId: string; variantId: string; qty: number; price: number };
export type Sale = { id: string; code: string; date: string; clientId: string; channel: Channel; payment: Payment; seller: string; items: SaleItem[]; discount: number; coupon: string };
export type Client = { id: string; name: string; phone: string; email: string; birthday: string; size: string; notes: string; createdAt: string };
export type Campaign = { id: string; name: string; channel: (typeof campaignChannels)[number]; audience: Audience; coupon: string; discountPct: number; start: string; end: string; budget: number; reach: number };
export type Expense = { id: string; desc: string; category: string; due: string; value: number; paid: boolean };
export type Settings = { owner: string; company: string; goal: number };
export type Store = { products: Product[]; clients: Client[]; sales: Sale[]; campaigns: Campaign[]; expenses: Expense[]; settings: Settings; next: number };

export const storageKey = 'lumiere-moda-v1';
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const dayKey = (d: Date | string | number) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const addDays = (key: string, n: number) => dayKey(new Date(`${key}T12:00`).getTime() + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T12:00`).getTime() - new Date(`${a}T12:00`).getTime()) / DAY);
export const brl = (v: number, digits = 0) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });
export const dateLabel = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR');
export const initials = (name: string) => name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const saleTotal = (s: Sale) => Math.max(0, s.items.reduce((v, i) => v + i.qty * i.price, 0) - s.discount);
export const stockOf = (p: Product) => p.variants.reduce((v, x) => v + x.stock, 0);
export const lowVariants = (p: Product) => p.variants.filter(v => v.stock <= v.min);
export const campaignStatus = (c: Campaign, today: string) => today < c.start ? 'Agendada' : today > c.end ? 'Encerrada' : 'Ativa';
/** Shifts a key by whole months, keeping the day inside the target month. */
export const monthKey = (key: string, delta = 0) => { const d = new Date(`${key.slice(0, 7)}-01T12:00`); d.setMonth(d.getMonth() + delta); return dayKey(d).slice(0, 7); };

const catalog: [Category, string, number, string[], string[]][] = [
  ['Vestidos', 'Vestido Clara', 289, ['P', 'M', 'G'], ['Rosa', 'Off']], ['Vestidos', 'Vestido Aurora midi', 349, ['P', 'M', 'G', 'GG'], ['Terracota', 'Preto']], ['Vestidos', 'Vestido Bia chemise', 259, ['PP', 'P', 'M', 'G'], ['Bege', 'Azul']],
  ['Vestidos', 'Vestido Helena longo', 429, ['P', 'M', 'G'], ['Vinho', 'Preto']], ['Vestidos', 'Vestido Lis tubinho', 239, ['PP', 'P', 'M', 'G'], ['Preto', 'Nude']], ['Vestidos', 'Vestido Rosa envelope', 319, ['P', 'M', 'G'], ['Rosa', 'Verde']],
  ['Vestidos', 'Vestido Malu linho', 379, ['P', 'M', 'G'], ['Off', 'Caramelo']], ['Vestidos', 'Vestido Nina plissado', 299, ['P', 'M', 'G'], ['Nude', 'Rosa']],
  ['Blusas', 'Top Basic', 89, ['PP', 'P', 'M', 'G'], ['Off', 'Preto', 'Rosa']], ['Blusas', 'Blusa Sofia seda', 199, ['P', 'M', 'G'], ['Off', 'Nude']], ['Blusas', 'Camisa Íris', 179, ['P', 'M', 'G', 'GG'], ['Off', 'Azul']],
  ['Blusas', 'Blusa Duda ombro a ombro', 149, ['P', 'M', 'G'], ['Rosa', 'Off']], ['Blusas', 'Regata Gabi', 79, ['P', 'M', 'G'], ['Preto', 'Off', 'Verde']], ['Blusas', 'Cropped Lara', 119, ['PP', 'P', 'M'], ['Rosa', 'Preto']],
  ['Blusas', 'Blazer Lina', 389, ['P', 'M', 'G'], ['Bege', 'Preto']], ['Blusas', 'Cardigã Vivi', 219, ['P', 'M', 'G'], ['Nude', 'Off']], ['Blusas', 'Body Nara', 129, ['P', 'M', 'G'], ['Preto', 'Nude']],
  ['Calças', 'Calça Alfaiataria', 279, ['36', '38', '40', '42', '44'], ['Rosa', 'Preto', 'Bege']], ['Calças', 'Calça Pantalona Ana', 259, ['36', '38', '40', '42'], ['Off', 'Terracota']], ['Calças', 'Jeans Reto Bela', 239, ['36', '38', '40', '42', '44'], ['Azul']],
  ['Calças', 'Calça Wide Leg Cris', 269, ['36', '38', '40', '42'], ['Caramelo', 'Preto']], ['Calças', 'Short Alfaiataria Lu', 169, ['36', '38', '40', '42'], ['Bege', 'Rosa']],
  ['Conjuntos', 'Conjunto Linho Mar', 459, ['P', 'M', 'G'], ['Off', 'Verde']], ['Conjuntos', 'Conjunto Tricô Inês', 399, ['P', 'M', 'G'], ['Nude', 'Rosa']], ['Conjuntos', 'Conjunto Alfaiataria Eva', 549, ['P', 'M', 'G'], ['Preto', 'Bege']],
  ['Conjuntos', 'Conjunto Cropped e Saia Lia', 329, ['P', 'M', 'G'], ['Rosa', 'Terracota']],
  ['Saias', 'Saia Midi Plissada', 219, ['P', 'M', 'G'], ['Rosa', 'Caramelo']], ['Saias', 'Saia Lápis Teca', 189, ['36', '38', '40', '42'], ['Preto', 'Vinho']], ['Saias', 'Saia Envelope Cora', 199, ['P', 'M', 'G'], ['Off', 'Verde']],
  ['Saias', 'Saia Jeans Mila', 169, ['36', '38', '40', '42'], ['Azul']],
  ['Acessórios', 'Bolsa Sofia', 349, ['U'], ['Rosa', 'Caramelo', 'Preto']], ['Acessórios', 'Bolsa Tote Ana', 299, ['U'], ['Bege', 'Preto']], ['Acessórios', 'Cinto Fivela Dourada', 99, ['P', 'M', 'G'], ['Caramelo', 'Preto']],
  ['Acessórios', 'Lenço de Seda Flor', 89, ['U'], ['Rosa', 'Azul']], ['Acessórios', 'Brinco Gota Dourado', 69, ['U'], ['Off']], ['Acessórios', 'Óculos Cat Eye', 159, ['U'], ['Preto', 'Caramelo']],
];
const firstNames = ['Ana', 'Beatriz', 'Carolina', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Mariana', 'Natália', 'Olívia', 'Patrícia', 'Rafaela', 'Sabrina', 'Tatiana', 'Valentina', 'Vitória', 'Luiza', 'Camila', 'Bianca', 'Renata', 'Paula', 'Clara', 'Lívia', 'Manuela', 'Alice', 'Cecília'];
const lastNames = ['Albuquerque', 'Barros', 'Cavalcanti', 'Duarte', 'Farias', 'Gusmão', 'Lins', 'Medeiros', 'Moura', 'Nogueira', 'Pessoa', 'Queiroz', 'Rocha', 'Siqueira', 'Teixeira', 'Vasconcelos', 'Andrade', 'Brandão'];

/** Small deterministic generator so the demo looks the same on every first load. */
function rng(seed: number) { let x = seed; return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296; }

export function makeSeed(now = Date.now()): Store {
  const today = dayKey(now);
  const r = rng(20261118);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  const collections = ['Verão 2027', 'Essenciais', 'Inverno 2026'];
  const products: Product[] = catalog.map(([category, name, price, sizes, colors], i) => ({
    id: `p${i}`, sku: `LM-${String(1001 + i)}`, name, category, collection: i % 5 === 0 ? collections[2] : i % 3 === 0 ? collections[1] : collections[0], price, cost: Math.round(price * (0.38 + (i % 4) * 0.03)), active: true, createdAt: addDays(today, -300 + i * 6),
    variants: colors.flatMap(color => sizes.map((size, k) => {
      const base = size === 'U' ? 10 : k === 0 || k === sizes.length - 1 ? 3 : 5;
      // A few variants run low so restock alerts have something to show.
      const stock = (i * 7 + k * 3 + color.length) % 17 === 0 ? 0 : (i * 3 + k) % 13 === 0 ? 1 : base + Math.floor(r() * 4);
      return { id: uid(), size, color, stock, min: size === 'U' ? 3 : 2 };
    })),
  }));
  const clients: Client[] = Array.from({ length: 560 }, (_, i) => {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 7 + Math.floor(i / firstNames.length)) % lastNames.length]}`;
    const month = String(1 + (i * 5) % 12).padStart(2, '0'), day = String(1 + (i * 7 + Math.floor(i / 12) * 3) % 28).padStart(2, '0');
    return { id: `c${i}`, name, phone: `(81) 9${String(8100 + i * 17).slice(-4)}-${String(1000 + i * 37).slice(-4)}`, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${i}@email.com`, birthday: `1990-${month}-${day}`.replace('1990', String(1972 + (i % 30))), size: pick(['P', 'M', 'M', 'G', 'P', 'GG']), notes: i % 23 === 0 ? 'Prefere peças em tons neutros. Avisar quando chegar linho.' : '', createdAt: addDays(today, -380 + Math.floor(i * .62)) };
  });
  // Loyal clients buy far more often, which gives a realistic recurring share.
  const weight = clients.map((_, i) => (i % 9 === 0 ? 4 : i % 4 === 0 ? 2 : 1));
  const totalWeight = weight.reduce((a, b) => a + b, 0);
  const chooseClient = () => { let t = r() * totalWeight; for (let i = 0; i < weight.length; i++) { t -= weight[i]; if (t <= 0) return clients[i]; } return clients[0]; };
  const popularity = products.map((p, i) => (['Vestido Clara', 'Blazer Lina', 'Top Basic', 'Calça Alfaiataria', 'Bolsa Sofia'].includes(p.name) ? 6 : 1 + (i % 3)));
  const popTotal = popularity.reduce((a, b) => a + b, 0);
  const chooseProduct = () => { let t = r() * popTotal; for (let i = 0; i < products.length; i++) { t -= popularity[i]; if (t <= 0) return products[i]; } return products[0]; };
  const sales: Sale[] = [];
  let n = 1;
  for (let d = -365; d <= 0; d++) {
    const date = addDays(today, d);
    const weekday = new Date(`${date}T12:00`).getDay();
    // Revenue grows over the year, with stronger Saturdays and December.
    const growth = 0.5 + (d + 365) / 365 * 0.62;
    // December and Mother's Day peak; the summer campaign (last 19 days) lifts sales too.
    const season = date.slice(5, 7) === '12' ? 1.5 : date.slice(5, 7) === '05' ? 1.25 : d > -19 ? 1.3 : 1;
    const expected = (weekday === 0 ? 1 : weekday === 6 ? 5.6 : 3.4) * growth * season;
    const count = d === 0 ? 4 : Math.max(0, Math.round(expected + (r() - 0.5) * 3));
    for (let k = 0; k < count; k++) {
      const lines = r() < 0.55 ? 1 : r() < 0.8 ? 2 : 3;
      const items: SaleItem[] = Array.from({ length: lines }, () => { const p = chooseProduct(), v = pick(p.variants); return { productId: p.id, variantId: v.id, qty: r() < 0.9 ? 1 : 2, price: p.price }; });
      const anonymous = r() < 0.18;
      const sub = items.reduce((v, x) => v + x.qty * x.price, 0);
      const coupon = d > -20 && r() < 0.18 ? 'VERAO10' : d > -45 && d < -25 && r() < 0.14 ? 'CLIENTE15' : d > -70 && d < -50 && r() < 0.1 ? 'VOLTEI' : '';
      sales.push({ id: uid(), code: `V${String(n++).padStart(5, '0')}`, date: `${date}T${String(10 + Math.floor(r() * 9)).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`, clientId: anonymous ? '' : chooseClient().id, channel: pick(['Loja', 'Loja', 'Loja', 'Instagram', 'WhatsApp', 'Site'] as const), payment: pick(['Pix', 'Crédito', 'Crédito', 'Débito', 'Dinheiro'] as const), seller: pick(sellers), items, discount: coupon ? Math.round(sub * ({ VERAO10: 0.1, CLIENTE15: 0.15, VOLTEI: 0.12 } as Record<string, number>)[coupon]) : 0, coupon });
    }
  }
  // This month's birthday clients often redeem the birthday coupon.
  const mk = today.slice(0, 7);
  for (const x of sales) {
    if (!x.date.startsWith(mk) || x.coupon || !x.clientId) continue;
    const c = clients[Number(x.clientId.slice(1))];
    if (c.birthday.slice(5, 7) === mk.slice(5) && r() < 0.6) { x.coupon = 'NIVER20'; x.discount = Math.round(x.items.reduce((v, i) => v + i.qty * i.price, 0) * 0.2); }
  }
  const campaigns: Campaign[] = [
    { id: 'm0', name: 'Coleção Verão 2027', channel: 'Instagram', audience: 'Todas as clientes', coupon: 'VERAO10', discountPct: 10, start: addDays(today, -19), end: addDays(today, 25), budget: 1800, reach: 14200 },
    { id: 'm1', name: 'Aniversariantes do mês', channel: 'WhatsApp', audience: 'Aniversariantes do mês', coupon: 'NIVER20', discountPct: 20, start: `${today.slice(0, 7)}-01`, end: addDays(`${monthKey(today, 1)}-01`, -1), budget: 0, reach: 0 },
    { id: 'm2', name: 'Esquenta Black Friday', channel: 'E-mail', audience: 'Clientes VIP', coupon: 'VIPBLACK', discountPct: 15, start: addDays(today, 12), end: addDays(today, 30), budget: 600, reach: 0 },
    { id: 'm3', name: 'Semana do Cliente', channel: 'Instagram', audience: 'Todas as clientes', coupon: 'CLIENTE15', discountPct: 15, start: addDays(today, -45), end: addDays(today, -25), budget: 2400, reach: 21800 },
    { id: 'm4', name: 'Volte para a Lumière', channel: 'WhatsApp', audience: 'Inativas há 60 dias', coupon: 'VOLTEI', discountPct: 12, start: addDays(today, -70), end: addDays(today, -50), budget: 0, reach: 0 },
  ];
  const expenses: Expense[] = [];
  for (let m = -5; m <= 1; m++) {
    const mk = monthKey(today, m);
    [['Aluguel da loja', 'Aluguel', 5, 6800], ['Folha de pagamento', 'Salários', 5, 11400], ['Fornecedor Têxtil Recife', 'Fornecedores', 12, 9200 + (m + 5) * 350], ['Ateliê Nordeste Confecções', 'Fornecedores', 20, 6100 + (m + 5) * 280], ['Energia e internet', 'Contas da loja', 15, 1350], ['Anúncios Instagram', 'Marketing', 10, 1500], ['Simples Nacional', 'Impostos', 20, 3100 + (m + 5) * 160]].forEach(([desc, category, day, value]) => {
      const due = `${mk}-${String(day).padStart(2, '0')}`;
      expenses.push({ id: uid(), desc: desc as string, category: category as string, due, value: value as number, paid: due < today && !(m === 0 && desc === 'Ateliê Nordeste Confecções') });
    });
  }
  return { products, clients, sales, campaigns, expenses, settings: { owner: 'Igor', company: 'Lumière Moda Feminina', goal: 52000 }, next: n };
}
