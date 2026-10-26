import { saleGross, saleTotal, type RetailStore, type Sale } from './retail-data';
import type { ServiceStore } from './service-data';

export function checkout(store: RetailStore, input: { id: string; client: string; contact: string; date: string; time: string; payment: string; seller: string; discount: number; cart: { productId: string; variantId: string; quantity: number }[] }): RetailStore {
  if (!input.cart.length) throw new Error('Adicione pelo menos um produto.');
  if (store.sales.some(s => s.id === input.id)) return store;
  const quantities = new Map<string, number>();
  const lines = input.cart.map(line => {
    const product = store.products.find(p => p.id === line.productId);
    const variant = product?.variants.find(v => v.id === line.variantId);
    if (!product || !variant) throw new Error('Produto ou variação não encontrado.');
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error('Informe quantidades inteiras maiores que zero.');
    quantities.set(variant.id, (quantities.get(variant.id) || 0) + line.quantity);
    return { ...line, price: product.price, returned: 0 };
  });
  for (const [id, quantity] of quantities) {
    const variant = store.products.flatMap(p => p.variants).find(v => v.id === id)!;
    if (quantity > variant.stock) throw new Error('Uma das variações não tem estoque suficiente.');
  }
  const gross = lines.reduce((n, line) => n + line.price * line.quantity, 0);
  if (!Number.isFinite(input.discount) || input.discount < 0 || input.discount > gross) throw new Error('O desconto precisa estar entre zero e o subtotal.');
  const sale: Sale = { id: input.id, number: String(Math.max(1000, ...store.sales.map(s => Number(s.number))) + 1), client: input.client, contact: input.contact, date: input.date, time: input.time, payment: input.payment, seller: input.seller, discount: input.discount, status: 'Novo pedido', lines };
  return { ...store, sales: [sale, ...store.sales], products: store.products.map(p => ({ ...p, variants: p.variants.map(v => ({ ...v, stock: v.stock - (quantities.get(v.id) || 0) })) })), entries: [...store.entries, { id: `sale-${sale.id}`, title: `Venda #${sale.number} · ${sale.client}`, type: 'Receita', category: 'Vendas', amount: saleTotal(sale), date: sale.date, paid: true, reference: sale.id }] };
}
export function refund(store: RetailStore, input: { id: string; saleId: string; lineIndex: number; quantity: number; date: string }): RetailStore {
  if (store.returns.some(r => r.id === input.id)) return store;
  const sale = store.sales.find(s => s.id === input.saleId), line = sale?.lines[input.lineIndex];
  if (!sale || !line || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > line.quantity - line.returned) throw new Error('Confira o item e a quantidade disponível para devolução.');
  const gross = saleGross(sale), ratio = gross ? saleTotal(sale) / gross : 0;
  // Difference of cumulative rounded amounts keeps split returns equal to a full return.
  const proposed = (Math.round((line.returned + input.quantity) * line.price * ratio * 100) - Math.round(line.returned * line.price * ratio * 100)) / 100;
  const previous = store.returns.filter(r => r.saleId === sale.id).reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(0, Math.round((saleTotal(sale) - previous) * 100) / 100);
  const completed = sale.lines.every((l, i) => l.returned + (i === input.lineIndex ? input.quantity : 0) === l.quantity);
  const amount = completed ? remaining : Math.min(remaining, proposed);
  const product = store.products.find(p => p.id === line.productId);
  return { ...store, sales: store.sales.map(s => s.id === sale.id ? { ...s, lines: s.lines.map((l, i) => i === input.lineIndex ? { ...l, returned: l.returned + input.quantity } : l) } : s), products: store.products.map(p => p.id === line.productId ? { ...p, variants: p.variants.map(v => v.id === line.variantId ? { ...v, stock: v.stock + input.quantity } : v) } : p), returns: [...store.returns, { id: input.id, saleId: sale.id, product: product?.name || 'Produto', quantity: input.quantity, amount, date: input.date }], entries: [...store.entries, { id: `refund-${input.id}`, title: `Devolução pedido #${sale.number}`, type: 'Despesa', category: 'Devoluções', amount, date: input.date, paid: true, reference: sale.id }] };
}
export function receivePurchase(store: RetailStore, id: string): RetailStore {
  const purchase = store.purchases.find(p => p.id === id);
  if (!purchase || purchase.status === 'Recebido') return store;
  return { ...store, purchases: store.purchases.map(p => p.id === id ? { ...p, status: 'Recebido' } : p), products: store.products.map(p => p.id === purchase.productId ? { ...p, variants: p.variants.map(v => v.id === purchase.variantId ? { ...v, stock: v.stock + purchase.quantity } : v) } : p) };
}
export function allocatePart(store: ServiceStore, input: { id: string; orderId: string; partId: string; quantity: number }): ServiceStore {
  if (store.allocations.some(a => a.id === input.id)) return store;
  const part = store.parts.find(p => p.id === input.partId);
  if (!store.orders.some(o => o.id === input.orderId) || !part || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > part.quantity) throw new Error('Verifique a peça e a quantidade disponível em estoque.');
  return { ...store, parts: store.parts.map(p => p.id === part.id ? { ...p, quantity: p.quantity - input.quantity } : p), allocations: [...store.allocations, { ...input, price: part.price }] };
}
export function releasePart(store: ServiceStore, id: string): ServiceStore {
  const allocation = store.allocations.find(a => a.id === id);
  if (!allocation) return store;
  return { ...store, parts: store.parts.map(p => p.id === allocation.partId ? { ...p, quantity: p.quantity + allocation.quantity } : p), allocations: store.allocations.filter(a => a.id !== id) };
}
