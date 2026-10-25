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
  const note = String(order.note || '');
  if (note.includes('3month')) return '3 Months License (Quarterly)';
  if (note.includes('2month')) return '2 Months License';
  if (note.includes('1month')) return '1 Month License (Monthly)';
  if (order.project && order.project.includes('Platform License')) {
    return order.project.replace('MyMobPay ', '');
  }
  return note.replace('Subscription_', '') || 'Platform License';
}
