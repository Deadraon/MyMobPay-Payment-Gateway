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

export function detectSubscriptionTier(orderOrPlanStr, fallbackAmount = 0) {
  const str = String(
    (typeof orderOrPlanStr === 'object'
      ? (orderOrPlanStr?.note || orderOrPlanStr?.project || orderOrPlanStr?.plan_type || '')
      : orderOrPlanStr) || ''
  ).toLowerCase();

  const amt = Number(typeof orderOrPlanStr === 'object' ? (orderOrPlanStr?.amount || fallbackAmount) : fallbackAmount) || 0;

  if (str.includes('pro') || str.includes('flagship') || str.includes('499') || amt === 499 || amt === 4990) {
    return {
      tierIndex: 3,
      id: 'pro',
      name: 'Pro Flagship',
      title: 'Pro Flagship Plan (Unlimited)',
      tierLabel: 'Pro Flagship Tier',
      price: 499,
      isAnnual: str.includes('annual') || str.includes('year') || amt >= 2000
    };
  }
  if (str.includes('growth') || str.includes('299') || amt === 299 || amt === 2990) {
    return {
      tierIndex: 2,
      id: 'growth',
      name: 'Growth',
      title: 'Growth Plan (REST API)',
      tierLabel: 'Growth Tier',
      price: 299,
      isAnnual: str.includes('annual') || str.includes('year') || amt >= 2000
    };
  }
  if (str.includes('starter') || str.includes('99') || amt === 99 || amt === 990) {
    return {
      tierIndex: 1,
      id: 'starter',
      name: 'Starter',
      title: 'Starter Plan (Payment Links)',
      tierLabel: 'Starter Tier',
      price: 99,
      isAnnual: str.includes('annual') || str.includes('year') || amt >= 500
    };
  }
  return null;
}
