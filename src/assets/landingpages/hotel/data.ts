export type Status = 'Confirmada' | 'Hospedado' | 'Finalizada' | 'Cancelada';
export type Channel = 'Direto' | 'Booking' | 'Airbnb' | 'Expedia' | 'Telefone';
export type Housekeeping = 'Limpo' | 'Sujo' | 'Manutenção';
export type RoomType = { id: string; name: string; price: number; capacity: number; beds: string; size: number; description: string; amenities: string[] };
export type Room = { id: string; number: string; floor: number; typeId: string; housekeeping: Housekeeping };
export type Guest = { id: string; name: string; email: string; phone: string; city: string; document: string; createdAt: string };
export type Extra = { id: string; description: string; value: number; date: string };
export type Reservation = { id: string; code: string; guestId: string; roomId: string; checkIn: string; checkOut: string; adults: number; children: number; status: Status; channel: Channel; rate: number; extras: Extra[]; notes: string; createdAt: string };
export type Settings = { owner: string; hotel: string; city: string; temperature: number; condition: string };
export type Store = { types: RoomType[]; rooms: Room[]; guests: Guest[]; reservations: Reservation[]; settings: Settings; next: number };

export const storageKey = 'lumen-hotel-v2';
export const channels: Channel[] = ['Direto', 'Booking', 'Airbnb', 'Expedia', 'Telefone'];
export const conditions = ['Ensolarado', 'Parcialmente nublado', 'Nublado', 'Chuva'];
const DAY = 864e5;
export const uid = () => globalThis.crypto.randomUUID();
export const dayKey = (d: Date | string | number) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const addDays = (key: string, n: number) => dayKey(new Date(`${key}T12:00`).getTime() + n * DAY);
export const nightsOf = (r: Pick<Reservation, 'checkIn' | 'checkOut'>) => Math.max(0, Math.round((new Date(`${r.checkOut}T12:00`).getTime() - new Date(`${r.checkIn}T12:00`).getTime()) / DAY));
export const extrasOf = (r: Reservation) => r.extras.reduce((v, e) => v + e.value, 0);
export const totalOf = (r: Reservation) => r.rate * nightsOf(r) + extrasOf(r);
export const brl = (v: number, digits = 2) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });
export const dateLabel = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR');
export const shortDate = (key: string) => new Date(`${key.slice(0, 10)}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
export const initials = (name: string) => name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export const active = (r: Reservation) => r.status !== 'Cancelada';
/** A reservation covers the nights from check-in up to the day before check-out. */
export const covers = (r: Reservation, key: string) => active(r) && r.checkIn <= key && key < r.checkOut;
export const overlaps = (a: Pick<Reservation, 'checkIn' | 'checkOut'>, b: Pick<Reservation, 'checkIn' | 'checkOut'>) => a.checkIn < b.checkOut && b.checkIn < a.checkOut;
export const roomAvailable = (store: Store, roomId: string, checkIn: string, checkOut: string, ignoreId?: string) =>
  !store.reservations.some(r => r.roomId === roomId && r.id !== ignoreId && active(r) && overlaps(r, { checkIn, checkOut }));
/** Room revenue of a night: the daily rate of every stay covering it. */
export const nightRevenue = (store: Store, key: string) => store.reservations.filter(r => covers(r, key)).reduce((v, r) => v + r.rate, 0);
export const occupancy = (store: Store, key: string) => {
  const sellable = store.rooms.filter(r => r.housekeeping !== 'Manutenção').length;
  return sellable ? new Set(store.reservations.filter(r => covers(r, key)).map(r => r.roomId)).size / sellable * 100 : 0;
};

const types: RoomType[] = [
  { id: 'std', name: 'Standard', price: 460, capacity: 2, beds: '1 cama casal ou 2 solteiro', size: 24, description: 'Conforto essencial com vista para o jardim e varanda privativa.', amenities: ['Ar-condicionado', 'Wi-Fi', 'Smart TV', 'Frigobar'] },
  { id: 'sup', name: 'Superior', price: 680, capacity: 3, beds: '1 cama queen + 1 solteiro', size: 30, description: 'Mais espaço, varanda com rede e vista parcial do mar.', amenities: ['Ar-condicionado', 'Wi-Fi', 'Smart TV', 'Frigobar', 'Varanda com rede'] },
  { id: 'dlx', name: 'Deluxe', price: 980, capacity: 3, beds: '1 cama king', size: 38, description: 'Andar alto, banheira e vista para o mar.', amenities: ['Ar-condicionado', 'Wi-Fi', 'Smart TV', 'Frigobar', 'Banheira', 'Vista mar'] },
  { id: 'ste', name: 'Suíte Vista Mar', price: 1250, capacity: 4, beds: '1 cama king + sofá-cama', size: 52, description: 'Frente para o mar, sala integrada e varanda com deck.', amenities: ['Ar-condicionado', 'Wi-Fi', 'Smart TV', 'Frigobar', 'Banheira', 'Vista mar', 'Deck privativo', 'Café na varanda'] },
];
const firstNames = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Larissa', 'Marcelo', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vanessa', 'Vitor', 'Beatriz', 'Caio', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Juliana', 'Leonardo', 'Mariana', 'Pedro'];
const lastNames = ['Albuquerque', 'Barros', 'Cavalcanti', 'Duarte', 'Freire', 'Gomes', 'Lima', 'Monteiro', 'Nunes', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Vasconcelos'];
const cities = ['Recife - PE', 'São Paulo - SP', 'Rio de Janeiro - RJ', 'Brasília - DF', 'Salvador - BA', 'Belo Horizonte - MG', 'Fortaleza - CE', 'Curitiba - PR', 'Porto Alegre - RS', 'Lisboa - PT'];
const extrasCatalog: [string, number][] = [['Frigobar', 48], ['Jantar no restaurante', 186], ['Passeio de buggy', 240], ['Massagem relaxante', 220], ['Late check-out', 150], ['Translado aeroporto', 130]];

export function makeSeed(now = Date.now()): Store {
  const today = dayKey(now);
  const rooms: Room[] = [];
  // 50 rooms: floors 1–2 Standard, 3 and half of 4 Superior, rest of 4 Deluxe, 5 Suites.
  const layout: [number, string, number][] = [[1, 'std', 10], [2, 'std', 10], [3, 'sup', 10], [4, 'sup', 5], [4, 'dlx', 5], [5, 'dlx', 5], [5, 'ste', 5]];
  const perFloor: Record<number, number> = {};
  for (const [floor, typeId, count] of layout) for (let i = 0; i < count; i++) {
    perFloor[floor] = (perFloor[floor] ?? 0) + 1;
    rooms.push({ id: `r${floor}${String(perFloor[floor]).padStart(2, '0')}`, number: `${floor}${String(perFloor[floor]).padStart(2, '0')}`, floor, typeId, housekeeping: 'Limpo' });
  }
  const guests: Guest[] = Array.from({ length: 1000 }, (_, i) => {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}${i >= firstNames.length * lastNames.length ? ` ${lastNames[(i * 5) % lastNames.length]}` : ''}`;
    return { id: `g${i}`, name, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${name.split(' ')[1].toLowerCase()}@email.com`, phone: `(81) 9${String(8100 + i * 37).slice(0, 4)}-${String(1000 + i * 113).slice(-4)}`, city: cities[(i * 3) % cities.length], document: `${String(100 + i * 7).slice(-3)}.${String(400 + i * 13).slice(-3)}.${String(700 + i * 29).slice(-3)}-${String(10 + i % 89).padStart(2, '0')}`, createdAt: new Date(now - (400 - (i * 0.39)) * DAY).toISOString() };
  });
  const reservations: Reservation[] = [];
  let n = 1, g = 0;
  const push = (room: Room, checkIn: string, checkOut: string, status: Status, k: number) => {
    const t = types.find(x => x.id === room.typeId)!;
    // Tarifas acompanham a temporada do litoral nordestino: alta no verão e em julho.
    const season = [1.18, 1.12, 1.04, .94, .9, .92, 1.06, .96, .9, .98, 1.04, 1.22][new Date(`${checkIn}T12:00`).getMonth()];
    const rate = Math.round(t.price * season * [1, 1, .92, 1.08, .95][k % 5]);
    const extras: Extra[] = status === 'Cancelada' || k % 3 ? [] : [extrasCatalog[k % extrasCatalog.length], extrasCatalog[(k + 2) % extrasCatalog.length]].slice(0, 1 + (k % 2)).map(([description, value]) => ({ id: uid(), description, value, date: checkIn }));
    reservations.push({ id: uid(), code: `LM-${String(2400 + n++)}`, guestId: `g${(g++ * 7) % 1000 < 870 ? (g * 7) % 1000 : (g * 13) % 120}`, roomId: room.id, checkIn, checkOut, adults: 2, children: k % 4 === 0 ? 1 : 0, status, channel: channels[[0, 1, 1, 0, 2, 3, 4, 1, 0, 2][(k * 7 + room.number.charCodeAt(2)) % 10]], rate, extras, notes: k % 7 === 0 ? 'Comemoração de aniversário de casamento.' : '', createdAt: new Date(new Date(`${checkIn}T12:00`).getTime() - (5 + k % 40) * DAY).toISOString() });
  };
  // Lay out back-to-back stays per room from 70 days ago to 45 days ahead.
  rooms.forEach((room, ri) => {
    let day = -70 + (ri * 3) % 5, k = ri;
    while (day < 45) {
      const len = 2 + (k * 5 + ri) % 5, gap = (k + ri) % 6 === 0 ? 2 : (k * 7 + ri) % 9 === 0 ? 1 : 0;
      const checkIn = addDays(today, day), checkOut = addDays(today, day + len);
      let status: Status = checkOut < today ? 'Finalizada' : checkIn > today ? 'Confirmada' : 'Hospedado';
      if (checkIn === today) status = ri % 3 === 0 ? 'Hospedado' : 'Confirmada';
      if (checkOut === today && ri % 4 === 0) status = 'Finalizada';
      if ((k * 13 + ri) % 23 === 0 && checkIn > today) status = 'Cancelada';
      // A tenth of the rooms stay empty tonight so occupancy looks realistic.
      const skipTonight = ri % 10 === 7 && checkIn <= today && today < checkOut;
      // Far-off nights are only partly sold, like a real booking curve.
      const ahead = day - 7, unsold = ahead > 0 && ((k * 37 + ri * 11) % 100) < ahead * 2.2;
      if (!skipTonight && !unsold) push(room, checkIn, checkOut, status, k);
      day += len + gap; k++;
    }
  });
  // Rooms whose guests left today wait for housekeeping; one room is under maintenance.
  for (const r of reservations) if (r.checkOut === today && r.status === 'Finalizada') { const room = rooms.find(x => x.id === r.roomId)!; room.housekeeping = 'Sujo'; }
  rooms[17].housekeeping = 'Manutenção';
  return { types, rooms, guests, reservations, settings: { owner: 'Igor', hotel: 'Lumen Hotel', city: 'Porto de Galinhas - PE', temperature: 28, condition: 'Ensolarado' }, next: n };
}
