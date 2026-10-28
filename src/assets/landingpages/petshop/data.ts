export const statuses = ['Agendado', 'Em atendimento', 'Finalizando', 'Concluído'] as const;
export type Status = (typeof statuses)[number];
export const categories = ['Banho e tosa', 'Consultas', 'Vacinação', 'Outros'] as const;
export type Category = (typeof categories)[number];
export type Service = { id: string; name: string; category: Category; price: number; minutes: number };
export type Tutor = { id: string; name: string; phone: string; email: string; createdAt: string };
export type Vaccine = { id: string; name: string; date: string; next: string };
export type Pet = { id: string; name: string; species: 'Cão' | 'Gato'; breed: string; tutorId: string; tone: string; weight: number; birth: string; notes: string; vaccines: Vaccine[] };
export type Appointment = { id: string; date: string; time: string; petId: string; serviceId: string; staffId: string; status: Status; price: number; notes: string; logs: { at: string; text: string }[] };
export type ProductIcon = 'food' | 'shampoo' | 'pill' | 'treat' | 'litter' | 'toy';
export type Product = { id: string; name: string; detail: string; icon: ProductIcon; price: number; stock: number; minimum: number };
export type Sale = { id: string; date: string; tutorId: string; items: { productId: string; quantity: number; price: number }[] };
export type Staff = { id: string; name: string; role: string; tone: string };
export type Settings = { owner: string; business: string; opens: string; closes: string; staleDays: number };
export type Store = { appointments: Appointment[]; pets: Pet[]; tutors: Tutor[]; services: Service[]; products: Product[]; sales: Sale[]; settings: Settings };

export const storageKey = 'pata-petshop-v2';
export const staff: Staff[] = [
  { id: 'st0', name: 'Júlia Ramos', role: 'Banhista e tosadora', tone: '#f0647a' },
  { id: 'st1', name: 'Diego Prado', role: 'Tosador', tone: '#f59e0b' },
  { id: 'st2', name: 'Dra. Helena Couto', role: 'Médica-veterinária', tone: '#8b5cf6' },
  { id: 'st3', name: 'Caio Martins', role: 'Auxiliar', tone: '#14b8a6' },
];
export const categoryTone: Record<Category, string> = { 'Banho e tosa': 'rose', Consultas: 'purple', Vacinação: 'amber', Outros: 'gray' };
export const categoryColor: Record<Category, string> = { 'Banho e tosa': '#f25c6e', Consultas: '#a46cf0', Vacinação: '#f7b638', Outros: '#cfd2d9' };
export const statusColor: Record<Status, string> = { Agendado: '#f25c6e', 'Em atendimento': '#f5a524', Finalizando: '#5b8def', Concluído: '#22b573' };
export const petTones = ['#fde2c7', '#e9e1f7', '#fce1e4', '#dff1ea', '#fff0c9', '#e2ecfb', '#f6e3d3', '#ececec'];
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dayKey = (d: Date | string | number) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const dateLabel = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR');
export const initials = (name: string) => name.replace(/^Dra?\. /, '').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const saleTotal = (s: Sale) => s.items.reduce((v, i) => v + i.quantity * i.price, 0);
export const addDays = (key: string, n: number) => dayKey(new Date(`${key}T12:00`).getTime() + n * DAY);

/** Revenue of a day: concluded appointments plus product sales. */
export function revenueOn(store: Store, key: string) {
  return store.appointments.filter(a => a.date === key && a.status === 'Concluído').reduce((v, a) => v + a.price, 0) + store.sales.filter(s => dayKey(s.date) === key).reduce((v, s) => v + saleTotal(s), 0);
}

const services: Service[] = [
  { id: 'sv0', name: 'Banho e tosa', category: 'Banho e tosa', price: 110, minutes: 90 },
  { id: 'sv1', name: 'Tosa completa', category: 'Banho e tosa', price: 140, minutes: 120 },
  { id: 'sv2', name: 'Tosa higiênica', category: 'Banho e tosa', price: 60, minutes: 40 },
  { id: 'sv3', name: 'Banho e hidratação', category: 'Banho e tosa', price: 95, minutes: 75 },
  { id: 'sv4', name: 'Consulta veterinária', category: 'Consultas', price: 180, minutes: 40 },
  { id: 'sv5', name: 'Consulta', category: 'Consultas', price: 150, minutes: 30 },
  { id: 'sv6', name: 'Vacinação', category: 'Vacinação', price: 120, minutes: 20 },
  { id: 'sv7', name: 'Corte de unhas', category: 'Outros', price: 35, minutes: 15 },
  { id: 'sv8', name: 'Hospedagem (diária)', category: 'Outros', price: 90, minutes: 0 },
];
const products: Product[] = [
  { id: 'pr0', name: 'Ração Golden', detail: '15 kg', icon: 'food', price: 219.9, stock: 5, minimum: 8 },
  { id: 'pr1', name: 'Shampoo hipoalergênico', detail: '500 ml', icon: 'shampoo', price: 49.9, stock: 3, minimum: 6 },
  { id: 'pr2', name: 'Antipulgas Bravecto', detail: '1 un', icon: 'pill', price: 239.9, stock: 4, minimum: 5 },
  { id: 'pr3', name: 'Petisco natural', detail: '100 g', icon: 'treat', price: 24.9, stock: 8, minimum: 12 },
  { id: 'pr4', name: 'Areia higiênica', detail: '4 kg', icon: 'litter', price: 32.9, stock: 6, minimum: 10 },
  { id: 'pr5', name: 'Ração Premier Gatos', detail: '7,5 kg', icon: 'food', price: 189.9, stock: 14, minimum: 6 },
  { id: 'pr6', name: 'Bolinha de borracha', detail: '1 un', icon: 'toy', price: 19.9, stock: 22, minimum: 8 },
  { id: 'pr7', name: 'Condicionador pelos longos', detail: '500 ml', icon: 'shampoo', price: 54.9, stock: 11, minimum: 5 },
  { id: 'pr8', name: 'Vermífugo', detail: '4 comprimidos', icon: 'pill', price: 42.9, stock: 17, minimum: 6 },
  { id: 'pr9', name: 'Bifinho de frango', detail: '250 g', icon: 'treat', price: 29.9, stock: 25, minimum: 10 },
];
// [pet, species, breed, tutor, phone]
const people: [string, 'Cão' | 'Gato', string, string][] = [
  ['Mel', 'Cão', 'Golden Retriever', 'Carla Mendes'], ['Thor', 'Cão', 'Husky', 'Paulo Andrade'], ['Bella', 'Cão', 'Poodle', 'Fernanda Costa'], ['Luna', 'Cão', 'Shih Tzu', 'Beatriz Melo'],
  ['Luna', 'Gato', 'Siamês', 'Rafael Souza'], ['Nina', 'Cão', 'SRD', 'Amanda Lima'], ['Lola', 'Cão', 'Labrador', 'Ricardo Lima'], ['Max', 'Gato', 'SRD', 'Marcos Silva'],
  ['Tobby', 'Cão', 'Maltês', 'Juliana Alves'], ['Simba', 'Gato', 'Maine Coon', 'Lucas Rocha'], ['Chico', 'Cão', 'Yorkshire', 'Patrícia Gomes'], ['Mia', 'Cão', 'Spitz', 'Fernanda Lima'],
  ['Max', 'Cão', 'Golden Retriever', 'Gustavo Reis'], ['Bella', 'Cão', 'Poodle', 'Sofia Ribeiro'], ['Fred', 'Cão', 'Beagle', 'Henrique Dias'], ['Lola', 'Cão', 'Labrador', 'Camila Duarte'],
  ['Pipoca', 'Gato', 'Persa', 'Renata Vieira'], ['Bob', 'Cão', 'Bulldog Francês', 'Otávio Nunes'], ['Amora', 'Gato', 'SRD', 'Larissa Prado'], ['Zeca', 'Cão', 'Dachshund', 'Bruno Teixeira'],
];
// Today's board as in the approved reference: [personIndex, time, service, status, staff]
const today: [number, string, string, Status, string][] = [
  [0, '09:00', 'sv0', 'Agendado', 'st0'], [4, '10:30', 'sv4', 'Agendado', 'st2'], [8, '14:00', 'sv6', 'Agendado', 'st2'],
  [1, '09:15', 'sv1', 'Em atendimento', 'st1'], [5, '11:00', 'sv3', 'Em atendimento', 'st0'], [9, '15:20', 'sv4', 'Em atendimento', 'st2'],
  [2, '10:00', 'sv2', 'Finalizando', 'st0'], [6, '13:30', 'sv0', 'Finalizando', 'st3'], [10, '16:00', 'sv1', 'Finalizando', 'st1'],
  [3, '09:30', 'sv0', 'Concluído', 'st3'], [7, '12:00', 'sv5', 'Concluído', 'st2'], [11, '16:30', 'sv6', 'Concluído', 'st2'],
  [12, '17:30', 'sv4', 'Agendado', 'st2'], [13, '18:00', 'sv0', 'Agendado', 'st0'],
];

export function makeSeed(now = Date.now()): Store {
  const at = (days: number) => new Date(now - days * DAY).toISOString();
  const key = (days: number) => dayKey(now - days * DAY);
  const tutors: Tutor[] = people.map(([, , , name], i) => ({ id: `t${i}`, name, phone: `(11) 9${8400 + i * 37}-${String(1200 + i * 211).slice(-4)}`, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com`, createdAt: at(i < 5 ? i + 1 : i < 8 ? 9 + i : 40 + i * 9) }));
  const pets: Pet[] = people.map(([name, species, breed], i) => ({
    id: `p${i}`, name, species, breed, tutorId: `t${i}`, tone: petTones[i % petTones.length], weight: species === 'Gato' ? 4 + (i % 3) : 5 + (i * 3) % 28, birth: key(400 + i * 170), notes: i % 4 === 0 ? 'Sensível a barulho de secador.' : '',
    vaccines: [{ id: uid(), name: species === 'Gato' ? 'V4 felina' : 'V10', date: key(330 - i * 9), next: key(i % 9 === 3 ? 12 : -(4 + (i * 23) % 320)) }, { id: uid(), name: 'Antirrábica', date: key(200 + i * 5), next: key(-(120 + i * 11)) }],
  }));
  const price = (id: string) => services.find(s => s.id === id)!.price;
  const appointments: Appointment[] = today.map(([p, time, serviceId, status, staffId]) => ({ id: uid(), date: key(0), time, petId: `p${p}`, serviceId, staffId, status, price: price(serviceId), notes: '', logs: [{ at: at(2), text: 'Atendimento agendado' }] }));
  // Next days and the past two months, used by the agenda, charts and history.
  [[14, 1, '08:30', 'sv6'], [15, 1, '10:00', 'sv2'], [16, 2, '09:00', 'sv0'], [17, 2, '14:00', 'sv5'], [18, 3, '11:00', 'sv7'], [19, 4, '15:00', 'sv1']].forEach(([p, d, time, sv]) => appointments.push({ id: uid(), date: key(-(d as number)), time: time as string, petId: `p${p}`, serviceId: sv as string, staffId: sv === 'sv5' || sv === 'sv6' ? 'st2' : 'st0', status: 'Agendado', price: price(sv as string), notes: '', logs: [{ at: at(1), text: 'Atendimento agendado' }] }));
  for (let d = 1; d <= 62; d++) {
    const count = 6 + ((d * 7) % 6) + (new Date(now - d * DAY).getDay() === 6 ? 4 : 0) - (new Date(now - d * DAY).getDay() === 0 ? 4 : 0);
    for (let k = 0; k < count; k++) {
      const p = (d * 3 + k * 7) % people.length, sv = services[(d + k * 5) % 7 === 6 && k % 2 ? 6 : (d * k + k) % 9 === 8 ? 7 : (d + k * 3) % 7];
      appointments.push({ id: uid(), date: key(d), time: `${String(8 + (k * 5) % 10).padStart(2, '0')}:${k % 2 ? '30' : '00'}`, petId: `p${p}`, serviceId: sv.id, staffId: sv.category === 'Consultas' || sv.category === 'Vacinação' ? 'st2' : `st${k % 2}`, status: 'Concluído', price: sv.price, notes: '', logs: [{ at: at(d), text: 'Atendimento concluído' }] });
    }
  }
  const sales: Sale[] = [];
  for (let d = 0; d <= 62; d++) for (let k = 0; k < 3 + (d % 4); k++) {
    const pr = products[(d * 5 + k * 3) % products.length];
    const sale: Sale = { id: uid(), date: new Date(now - d * DAY - k * 3600e3).toISOString(), tutorId: `t${(d + k) % people.length}`, items: [{ productId: pr.id, quantity: 1 + ((d + k) % 3 === 0 ? 1 : 0), price: pr.price }] };
    if (d === 0 && k > 1) continue;
    sales.push(sale);
  }
  return { appointments, pets, tutors, services, products, sales, settings: { owner: 'Mariana Silva', business: 'Pata Pet Shop', opens: '08:00', closes: '19:00', staleDays: 60 } };
}
