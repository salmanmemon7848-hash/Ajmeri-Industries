// Mill-specific constants. Edit freely as ops change.

export const PADDY_VARIETIES = [
  { id: '1121',       name: 'Basmati 1121',       group: 'basmati' },
  { id: '1509',       name: 'Basmati 1509',       group: 'basmati' },
  { id: 'pusa',       name: 'Pusa Basmati',       group: 'basmati' },
  { id: 'sharbati',   name: 'Sharbati',           group: 'non-basmati' },
  { id: 'ir64',       name: 'IR-64',              group: 'non-basmati' },
  { id: 'sonamasuri', name: 'Sona Masuri',        group: 'non-basmati' },
  { id: 'sella',      name: 'Parboiled / Sella',  group: 'parboiled' },
];

export const BY_PRODUCTS = [
  { id: 'rice',        name: 'Rice',               unit: 'qtl' },
  { id: 'broken',      name: 'Broken Rice',        unit: 'qtl' },
  { id: 'rafi',        name: 'Rafi (Fine Broken)', unit: 'qtl' },
  { id: 'bran',        name: 'Rice Bran',          unit: 'qtl' },
  { id: 'husk',        name: 'Husk',               unit: 'qtl' },
  { id: 'bold_broken', name: 'Bold Broken',        unit: 'qtl' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'electricity',  name: 'Electricity / Diesel' },
  { id: 'maintenance',  name: 'Maintenance / Repair' },
  { id: 'labour',       name: 'Labour / Daily Wages' },
  { id: 'silai_dhaga',  name: 'Silai Dhaga (Thread)' },
  { id: 'color_dye',    name: 'Color / Dye' },
  { id: 'rubber_roll',  name: 'Rubber Roll' },
  { id: 'machinery',    name: 'Machinery Parts' },
  { id: 'consumables',  name: 'Other Consumables' },
  { id: 'misc',         name: 'Misc / Other' },
];

export const PURCHASE_PRODUCTS = [
  { id: 'paddy',       name: 'Paddy' },
  { id: 'rice',        name: 'Rice' },
  { id: 'broken',      name: 'Broken' },
  { id: 'bold_broken', name: 'Bold Broken' },
];

export const STOCK_PRODUCTS = [
  { id: 'paddy_sarna',  label: 'Paddy (Sarna)',  group: 'paddy' },
  { id: 'paddy_mota',   label: 'Paddy (Mota)',   group: 'paddy' },
  { id: 'paddy_patla',  label: 'Paddy (Patla)',  group: 'paddy' },
  { id: 'rice',         label: 'Rice',           group: 'rice' },
  { id: 'broken',       label: 'Broken',         group: 'byproduct' },
  { id: 'rafi',         label: 'Rafi',           group: 'byproduct' },
  { id: 'bran',         label: 'Bran',           group: 'byproduct' },
  { id: 'bardana',      label: 'Bardana',        group: 'bardana' },
  { id: 'husk',         label: 'Husk',           group: 'byproduct' },
  { id: 'bold_broken',  label: 'Bold Broken',    group: 'byproduct' },
];

export const PAYMENT_MODES = [
  { id: 'cash',    name: 'Cash',       hint: 'Full settlement on delivery' },
  { id: 'udhaari', name: 'Udhaari',    hint: 'Partial / outstanding balance' },
  { id: 'cheque',  name: 'Cheque',     hint: 'Bearer / PDC' },
  { id: 'upi',     name: 'UPI / Bank', hint: 'Digital transfer' },
];

export const GODOWNS_SEED = [
  { id: 'g-main', name: 'Main Godown' },
  { id: 'g-back', name: 'Back Godown' },
];

export const UNITS = [
  { id: 'qtl', name: 'Quintal',    factor: 1 },
  { id: 'bag', name: 'Bag (50kg)', factor: 0.5 },
  { id: 'kg',  name: 'Kilogram',   factor: 0.01 },
];

export const CONSUMABLE_UNITS = [
  { id: 'kg',    name: 'kg' },
  { id: 'piece', name: 'Piece' },
  { id: 'roll',  name: 'Roll' },
  { id: 'litre', name: 'Litre' },
  { id: 'set',   name: 'Set' },
];

export const HAMALI_TYPES = [
  { id: 'samiti', name: 'Hamali Samiti' },
  { id: 'fci',    name: 'Hamali FCI' },
  { id: 'other',  name: 'Other Expense' },
];

export const TRANSPORT_PRODUCTS = [
  { id: 'rice',        name: 'Rice' },
  { id: 'broken',      name: 'Broken' },
  { id: 'bold_broken', name: 'Bold Broken' },
  { id: 'rafi',        name: 'Rafi' },
  { id: 'bran',        name: 'Bran' },
  { id: 'husk',        name: 'Husk' },
];

export const NAV = [
  { id: 'dashboard',       path: '/dashboard',        label: 'Dashboard',       section: 'Daily Ledger' },
  { id: 'milling',         path: '/milling',          label: 'Milling',         section: 'Operations' },
  { id: 'sales',           path: '/sales',            label: 'Sales',           section: 'Operations' },
  { id: 'purchasetracker', path: '/purchase-tracker', label: 'Purchases',       section: 'Operations' },
  { id: 'do',              path: '/do',               label: 'DO Management',   section: 'Operations' },
  { id: 'hamali',          path: '/hamali',           label: 'Hamali',          section: 'Operations' },
  { id: 'transport',       path: '/transport',        label: 'Transport',       section: 'Operations' },
  { id: 'bagcut',          path: '/bag-cut',          label: 'Bag Cut & Lots',  section: 'Operations' },
  { id: 'customers',       path: '/customers',        label: 'Buyers',          section: 'Parties' },
  { id: 'stock',           path: '/stock',            label: 'Stock',           section: 'Stock' },
  { id: 'godown',          path: '/godown',           label: 'Godown Stock',    section: 'Stock' },
  { id: 'payments',        path: '/payments',         label: 'Udhaari & Cheques', section: 'Finance' },
  { id: 'workers',         path: '/workers',          label: 'Workers',         section: 'HR & Finance' },
  { id: 'expenses',        path: '/expenses',         label: 'Expenses',        section: 'HR & Finance' },
  { id: 'reports',         path: '/reports',          label: 'Reports',         section: 'Insight' },
  { id: 'damage',          path: '/damage',           label: 'Damage',          section: 'Insight' },
  { id: 'machinery',       path: '/machinery',        label: 'Machinery',       section: 'Maintenance' },
];

export const BOTTOM_NAV = [
  { id: 'dashboard', path: '/dashboard', label: 'Ledger' },
  { id: 'purchasetracker', path: '/purchase-tracker', label: 'Buy' },
  { id: 'add',       path: '__add',    label: 'Add', center: true },
  { id: 'bagcut',    path: '/bag-cut', label: 'Bags' },
  { id: 'more',      path: '/more',    label: 'More' },
];

// Formatting helpers
export const fmtINR = (n, opts = {}) => {
  if (n == null || isNaN(n)) return '—';
  const num = Number(n);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (opts.short && abs >= 100000) {
    if (abs >= 10000000) return `${sign}₹${(abs/10000000).toFixed(2)} Cr`;
    return `${sign}₹${(abs/100000).toFixed(2)} L`;
  }
  return sign + '₹' + abs.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const fmtQtl = (n, dp = 2) => {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: dp });
};

export const todayISO = () => new Date().toISOString().slice(0,10);

export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateLong = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};
