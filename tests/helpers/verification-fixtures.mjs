// In-memory query adapter for exercising route decisions without external services.
export const state = { tables: {}, effects: [], reads: [] };

export function reset(tables) {
  state.tables = structuredClone({ orders: [], merchants: [], payment_links: [], email_logs: [], sms_logs: [], ...tables });
  state.effects = [];
  state.reads = [];
}

class Query {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.maxRows = Infinity;
  }
  select() { return this; }
  eq(key, value) { this.filters.push(row => row[key] === value); return this; }
  neq(key, value) { this.filters.push(row => row[key] !== value); return this; }
  gte(key, value) { this.filters.push(row => row[key] >= value); return this; }
  ilike(key, pattern) {
    const expression = pattern.split('').map(char => char === '%' ? '.*' : char === '_' ? '.' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
    this.filters.push(row => new RegExp(`^${expression}$`, 'i').test(row[key] || ''));
    return this;
  }
  in(key, values) { this.filters.push(row => values.includes(row[key])); return this; }
  order(key, { ascending }) { this.sort = { key, ascending }; return this; }
  limit(count) { this.maxRows = count; return this; }
  insert(values) { this.inserted = Array.isArray(values) ? values : [values]; return this; }
  update(values) { this.updated = values; return this; }
  single() { this.one = true; return this; }
  maybeSingle() { this.one = true; return this; }
  then(resolve, reject) {
    try {
      const table = state.tables[this.table];
      if (!table) throw new Error(`Unexpected table: ${this.table}`);
      let rows;
      if (this.inserted) {
        rows = structuredClone(this.inserted);
        table.push(...rows);
      } else {
        rows = table.filter(row => this.filters.every(matches => matches(row)));
        if (this.sort) {
          const { key, ascending } = this.sort;
          rows.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (ascending ? 1 : -1));
        }
        rows = rows.slice(0, this.maxRows);
        if (this.updated) rows.forEach(row => Object.assign(row, this.updated));
        else state.reads.push(this.table);
      }
      return Promise.resolve({ data: structuredClone(this.one ? rows[0] || null : rows), error: null }).then(resolve, reject);
    } catch (error) {
      return Promise.reject(error).then(resolve, reject);
    }
  }
}

export const supabaseAdmin = { from: table => new Query(table) };
export const supabase = supabaseAdmin;
export const checkRateLimit = () => ({ allowed: true });
export const getClientIp = () => '127.0.0.1';
export const triggerMerchantWebhook = async (...args) => { state.effects.push(['webhook', ...args]); };
export const checkAndProcessSubscription = async (...args) => { state.effects.push(['subscription', ...args]); };
export const syncOrderVerificationToPaymentLink = async (...args) => { state.effects.push(['payment-link', ...args]); };
