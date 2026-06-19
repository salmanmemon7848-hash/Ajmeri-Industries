// Tiny CRUD store backed by localStorage.
// Supabase wrapper lives in ./supabase.js — when env vars are set, calls flow there.
// For V1 the localStorage path is the source of truth; Supabase can mirror later.

import { supa, hasSupabase } from './supabase';

const KEY = 'ajmeri.v2';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}
function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

const COLLECTIONS = [
  'buyers',
  'varieties',
  'godowns',
  'milling',           // milling batches
  'sales',
  'bills',             // sales invoices (legacy)
  'products',          // rice / by-products as sellable items
  'bardana',           // bag movements
  'payments',          // payment events to farmers / from buyers
  'cheques',           // post-dated cheques
  'workers',           // mill employees
  'workerPayments',    // advance & salary payments per worker
  'expenses',          // operational expenses
  'purchaseTracker',   // 5-stage purchase workflow
  'damageRecords',     // damage log per product
  'hrrTracking',       // head rice recovery per batch
  'bins',              // godown bin definitions
  'stockTransfers',    // inter-godown stock transfers
  'stockAdditions',    // manual quick-add stock (paddy/rice/by-products)
  'hamaliEntries',     // hamali labour expense log
  'paddyTransport',    // paddy transport (samiti → mill)
  'riceTransport',     // rice transport (mill → FCI/buyer)
  'otherTransport',    // other transport expenses
  'consumablePurchases', // mill consumables & supplies
  'deliveryOrders',    // DO (Delivery Order) records
  'doLiftings',        // per-trip DO lifting log
  'machinery',         // machines, AMC and service history
  'bagCuts',           // bag cut, repack and lot traceability ledger
];

export function getAll(collection) {
  const s = read();
  return s[collection] || [];
}

export function setAll(collection, items) {
  const s = read();
  s[collection] = items;
  write(s);
  if (hasSupabase()) supa.from(collection).upsert(items).then(() => {}, () => {});
  return items;
}

export function add(collection, item) {
  const items = getAll(collection);
  const next = { id: item.id || `${collection}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, createdAt: Date.now(), ...item };
  const out = [next, ...items];
  setAll(collection, out);
  return next;
}

export function update(collection, id, patch) {
  const items = getAll(collection);
  const next = items.map(x => x.id === id ? { ...x, ...patch } : x);
  setAll(collection, next);
  return next.find(x => x.id === id);
}

export function remove(collection, id) {
  const items = getAll(collection);
  setAll(collection, items.filter(x => x.id !== id));
}

export function getOne(collection, id) {
  return getAll(collection).find(x => x.id === id);
}

export const STORE_KEY = KEY;
export { COLLECTIONS };
