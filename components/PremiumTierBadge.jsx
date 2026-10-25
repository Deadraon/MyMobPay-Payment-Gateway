'use client';

import React from 'react';
import { Crown } from 'lucide-react';

/**
 * PremiumTierBadge
 * Clean system-designed subscription status button that strictly follows
 * the dashboard design system, theme, and geometry of the sidebar.
 * Pairs seamlessly with the Admin Console button directly below it.
 */
export default function PremiumTierBadge({
  profile,
  activeTab,
  onClick,
  className = ''
}) {
  const isSubExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now();
  const isActive = profile?.subscription_status === 'active' && !isSubExpired;
  const isSelected = activeTab === 'subscription';

  // Compute days left for hover tooltip
  let daysLeftText = '';
  if (isActive && profile?.subscription_expires_at) {
    const msLeft = new Date(profile.subscription_expires_at).getTime() - Date.now();
    const days = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    daysLeftText = days > 0 ? ` (${days}d left)` : '';
  }

  // 1. Selected State (activeTab === 'subscription')
  if (isSelected) {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-emerald-600 text-white shadow-md border-emerald-500 ring-2 ring-emerald-400/40 ${className}`}
        title={`Premium Subscription Active${daysLeftText} • Click to manage`}
      >
        <Crown className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2.2} />
        <span className="flex-1 text-left font-black tracking-wide text-[11px] truncate">
          {isActive ? 'Premium Active' : 'Premium Plan'}
        </span>
        <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
          {isActive ? 'PRO' : 'PLAN'}
        </span>
      </button>
    );
  }

  // 2. Unselected Active State (Subscribed)
  if (isActive) {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-200 border-emerald-500/30 hover:border-emerald-500/50 shadow-xs ${className}`}
        title={`Premium Subscription Active${daysLeftText} • Click to manage`}
      >
        <Crown className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.2} />
        <span className="flex-1 text-left font-black tracking-wide text-[11px] truncate text-emerald-100">
          Premium Active
        </span>
        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse shrink-0" />
          PRO
        </span>
      </button>
    );
  }

  // 3. Unselected Inactive / Free State
  return (
    <button
      onClick={onClick}
      type="button"
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:border-slate-600 shadow-xs ${className}`}
      title="Upgrade to Premium Subscription"
    >
      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2.2} />
      <span className="flex-1 text-left font-black tracking-wide text-[11px] truncate text-slate-200">
        Premium Plan
      </span>
      <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
        Upgrade
      </span>
    </button>
  );
}
