/**
 * Helper utilities for identifying, filtering, and parsing SaaS platform subscription orders.
 */

export function isSubscriptionOrder(order) {
  if (!order) return false;
  const note = String(order.note || '');
  const project = String(order.project || '');
  return (
    note.startsWith('Subscription_') ||
    note.includes('Subscription') ||
    project.includes('Platform License') ||
    note.includes('Trial_Setup') ||
    note.includes('Autopay_Setup')
  );
}

export function parseSubscriptionPlan(order) {
  if (!order) return 'Platform License';
  const note = String(order.note || '').toLowerCase();
  const isAnnual = note.includes('annual') || note.includes('year') || (order.amount && Number(order.amount) >= 2000);
  if (note.includes('pro') || note.includes('499') || note.includes('599') || note.includes('flagship') || note.includes('999')) {
    return isAnnual ? 'Pro Flagship (₹4,990/yr)' : 'Pro Flagship (₹499/mo)';
  }
  if (note.includes('growth') || note.includes('299')) {
    return isAnnual ? 'Growth Plan (₹2,990/yr)' : 'Growth Plan (₹299/mo)';
  }
  if (note.includes('starter') || note.includes('99')) return 'Starter Plan (₹99/mo)';
  if (note.includes('3month')) return '3 Months License (Quarterly)';
  if (note.includes('2month')) return '2 Months License';
  if (note.includes('1month')) return '1 Month License (Monthly)';
  if (order.project && order.project.includes('Platform License')) {
    return order.project.replace('MyMobPay ', '');
  }
  return String(order.note || '').replace('Subscription_', '') || 'Platform License';
}
