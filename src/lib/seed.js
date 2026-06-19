// Seed demo data on first run so the UI never looks empty.
import { getAll, setAll } from './storage';
import { GODOWNS_SEED, todayISO } from '../data/constants';

const FLAG = 'ajmeri.v1.seeded';

const days = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export function seedIfEmpty() {
  // User chose to start with empty state in the redesign. No seeding.
  return;
  // eslint-disable-next-line no-unreachable
  if (localStorage.getItem(FLAG)) return;

  if (getAll('godowns').length === 0) setAll('godowns', GODOWNS_SEED);



  const buyers = [
    { id: 'b-1', name: 'Krishna Traders',  phone: '+91 99250 11221', gstin: '24ABCDE1234F1Z5', createdAt: Date.now() },
    { id: 'b-2', name: 'Maa Annapurna Rice', phone: '+91 90234 99001', gstin: '24XYZAB6789G2Z9', createdAt: Date.now() },
    { id: 'b-3', name: 'Patel Rice Mart',  phone: '+91 98765 43219', gstin: '24PQRST4567H3Z1', createdAt: Date.now() },
  ];
  if (getAll('buyers').length === 0) setAll('buyers', buyers);



  const milling = [
    { id: 'm-1', date: todayISO(), paddyQtl: 60, riceQtl: 39.6, brokenQtl: 4.2, branQtl: 4.8, huskQtl: 9.6, yieldPct: 66.0, createdAt: Date.now() },
    { id: 'm-2', date: days(1),    paddyQtl: 80, riceQtl: 53.2, brokenQtl: 5.6, branQtl: 6.0, huskQtl: 12.8, yieldPct: 66.5, createdAt: Date.now() - 86400000 },
    { id: 'm-3', date: days(2),    paddyQtl: 50, riceQtl: 32.5, brokenQtl: 3.0, branQtl: 4.0, huskQtl: 9.0, yieldPct: 65.0, createdAt: Date.now() - 86400000 * 2 },
    { id: 'm-4', date: days(3),    paddyQtl: 70, riceQtl: 46.9, brokenQtl: 4.5, branQtl: 5.2, huskQtl: 11.0, yieldPct: 67.0, createdAt: Date.now() - 86400000 * 3 },
    { id: 'm-5', date: days(4),    paddyQtl: 65, riceQtl: 42.3, brokenQtl: 4.6, branQtl: 5.0, huskQtl: 10.5, yieldPct: 65.1, createdAt: Date.now() - 86400000 * 4 },
    { id: 'm-6', date: days(5),    paddyQtl: 75, riceQtl: 49.8, brokenQtl: 5.0, branQtl: 5.5, huskQtl: 11.8, yieldPct: 66.4, createdAt: Date.now() - 86400000 * 5 },
    { id: 'm-7', date: days(6),    paddyQtl: 58, riceQtl: 38.3, brokenQtl: 3.8, branQtl: 4.2, huskQtl: 9.5, yieldPct: 66.0, createdAt: Date.now() - 86400000 * 6 },
  ];
  if (getAll('milling').length === 0) setAll('milling', milling);

  const sales = [
    { id: 's-1', date: todayISO(), buyerId: 'b-1', product: 'rice',   unit: 'qtl', qty: 50,  rate: 5800, amount: 290000, broker: 'Hitesh',  commission: 1450,  godownId: 'g-main', createdAt: Date.now() },
    { id: 's-2', date: todayISO(), buyerId: 'b-2', product: 'broken', unit: 'bag', qty: 100, rate: 1450, amount: 145000, broker: '',        commission: 0,     godownId: 'g-main', createdAt: Date.now() },
    { id: 's-3', date: days(1),    buyerId: 'b-3', product: 'rice',   unit: 'qtl', qty: 80,  rate: 5750, amount: 460000, broker: 'Jagdish', commission: 2300,  godownId: 'g-back', createdAt: Date.now() - 86400000 },
    { id: 's-4', date: days(2),    buyerId: 'b-1', product: 'bran',   unit: 'qtl', qty: 22,  rate: 1850, amount: 40700,  broker: '',        commission: 0,     godownId: 'g-main', createdAt: Date.now() - 86400000 * 2 },
  ];
  if (getAll('sales').length === 0) setAll('sales', sales);

  const cheques = [
    { id: 'c-2', partyKind: 'buyer',  partyId: 'b-3', number: '772188', bank: 'HDFC', dueDate: days(-7), amount: 460000, status: 'pending', createdAt: Date.now() },
  ];
  if (getAll('cheques').length === 0) setAll('cheques', cheques);

  const bardana = [
    { id: 'bd-1', date: todayISO(), kind: 'new',      qty: 200, party: 'Stock', createdAt: Date.now() },
    { id: 'bd-2', date: days(1),    kind: 'returned', qty: 80,  party: 'Krishna Traders', createdAt: Date.now() - 86400000 },
    { id: 'bd-3', date: days(2),    kind: 'old',      qty: 150, party: 'Stock', createdAt: Date.now() - 86400000 * 2 },
  ];
  if (getAll('bardana').length === 0) setAll('bardana', bardana);

  localStorage.setItem(FLAG, '1');
}
