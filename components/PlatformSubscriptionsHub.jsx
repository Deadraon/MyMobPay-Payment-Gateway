'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Building2,
  Phone,
  Shield,
  RefreshCw,
  ExternalLink,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { parseSubscriptionPlan } from '@/lib/subscriptionOrders';

const IST_TZ = 'Asia/Kolkata';

function formatINR(n) {
  const val = Number(n) || 0;
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTimeIST(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export default function PlatformSubscriptionsHub({
  subscriptionOrders = [],
  onRefresh,
  setActiveTab
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | '1month' | '2months' | '3months'
  const [copiedId, setCopiedId] = useState(null);
  const [dbMerchants, setDbMerchants] = useState(null);

  // Fetch live merchant accounts to compute accurate platform subscriber statistics
  useEffect(() => {
    let isMounted = true;
    async function loadMerchants() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch('/api/admin/merchants', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && Array.isArray(data.merchants)) {
              setDbMerchants(data.merchants);
            }
          }
        }
      } catch (err) {
        // Fallback to subscription orders
      }
    }
    loadMerchants();
    return () => { isMounted = false; };
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics: Total Subs, Active Subs, Inactive Subs, Revenue, Today Inflow, Avg Value
  const metrics = useMemo(() => {
    const verified = subscriptionOrders.filter(o => o.status === 'verified' || o.status === 'paid');
    const pending = subscriptionOrders.filter(o => o.status === 'pending');
    const inactiveOrders = subscriptionOrders.filter(o => o.status !== 'verified' && o.status !== 'paid');
    const totalRevenue = verified.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayVerified = verified.filter(o => new Date(o.created_at) >= todayStart);
    const todayRevenue = todayVerified.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

    // Calculate subscriber counts based on database merchants if available, or subscription orders
    const totalSubs = dbMerchants && dbMerchants.length > 0 
      ? dbMerchants.length 
      : subscriptionOrders.length;

    const activeSubs = dbMerchants && dbMerchants.length > 0
      ? dbMerchants.filter(m => m.subscription_status === 'active' && (!m.subscription_expires_at || new Date(m.subscription_expires_at) > new Date())).length
      : verified.length;

    const inactiveSubs = dbMerchants && dbMerchants.length > 0
      ? dbMerchants.filter(m => m.subscription_status !== 'active' || (m.subscription_expires_at && new Date(m.subscription_expires_at) <= new Date())).length
      : inactiveOrders.length;

    return {
      totalRevenue,
      verifiedCount: verified.length,
      pendingCount: pending.length,
      inactiveOrdersCount: inactiveOrders.length,
      totalCount: subscriptionOrders.length,
      totalSubs,
      activeSubs,
      inactiveSubs,
      todayRevenue,
      todayCount: todayVerified.length,
      avgOrderValue: verified.length > 0 ? Math.round(totalRevenue / verified.length) : 499
    };
  }, [subscriptionOrders, dbMerchants]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return subscriptionOrders.filter(o => {
      // Status
      if (statusFilter === 'verified' && o.status !== 'verified' && o.status !== 'paid') return false;
      if (statusFilter === 'pending' && (o.status === 'verified' || o.status === 'paid')) return false;

      // Plan
      const note = (o.note || '').toLowerCase();
      if (planFilter !== 'all' && !note.includes(planFilter)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
        const refMatch = (o.external_ref || '').toLowerCase().includes(q);
        const utrMatch = (o.utr || o.customer_utr || '').toLowerCase().includes(q);
        const noteMatch = (o.note || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !refMatch && !utrMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [subscriptionOrders, statusFilter, planFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── TOP HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            SaaS Subscriptions
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            Platform Inflow
          </span>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('admin')}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Master Admin Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ── KPI METRICS CARDS (Total Subs, Active, Inactive, Revenue, Today, Avg Value) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {/* 1. Total Subs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Subs</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900 block mt-0.5 sm:mt-1 truncate">
                {metrics.totalSubs}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-indigo-700 font-semibold mt-2 sm:mt-2.5 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span className="truncate">Subscriber Base</span>
          </p>
        </div>

        {/* 2. Active Subs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Active Subs</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-600 block mt-0.5 sm:mt-1 truncate">
                {metrics.activeSubs}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold mt-2 sm:mt-2.5 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate">Live &amp; Verified</span>
          </p>
        </div>

        {/* 3. Inactive Subs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Inactive Subs</span>
              <span className="text-lg sm:text-2xl font-black text-amber-600 block mt-0.5 sm:mt-1 truncate">
                {metrics.inactiveSubs}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-amber-700 font-semibold mt-2 sm:mt-2.5 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="truncate">Pending / Expired</span>
          </p>
        </div>

        {/* 4. Total SaaS Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Total Revenue</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900 block mt-0.5 sm:mt-1 truncate">
                {formatINR(metrics.totalRevenue)}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-teal-700 font-semibold mt-2 sm:mt-2.5 truncate">
            {metrics.verifiedCount} verified orders
          </p>
        </div>

        {/* 5. Today's SaaS Inflow */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Today&apos;s Inflow</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900 block mt-0.5 sm:mt-1 truncate">
                {formatINR(metrics.todayRevenue)}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-2 sm:mt-2.5 truncate">
            {metrics.todayCount} renewals today
          </p>
        </div>

        {/* 6. Avg License Value */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Avg Plan Value</span>
              <span className="text-lg sm:text-2xl font-black text-purple-900 block mt-0.5 sm:mt-1 truncate">
                {formatINR(metrics.avgOrderValue)}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-purple-700 font-semibold mt-2 sm:mt-2.5 truncate">
            Across active tiers
          </p>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, merchant, UTR, note..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold overflow-x-auto max-w-full scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({subscriptionOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'verified' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active ({metrics.verifiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Inactive / Pending ({metrics.inactiveOrdersCount})
            </button>
          </div>

          {/* Plan Duration Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="1month">1 Month (₹499)</option>
            <option value="2month">2 Months (₹998)</option>
            <option value="3month">3 Months (₹1,497)</option>
          </select>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              type="button"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE: SUBSCRIPTION ORDERS ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-pan-x scrollbar-thin">
          <table className="w-full min-w-[720px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Subscriber Merchant</th>
                <th className="py-3.5 px-4">License Plan</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Bank Rail &amp; UTR</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Date &amp; Time (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No subscription orders match this filter.</p>
                      <p className="text-xs text-slate-400">When merchants purchase or renew platform licenses, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.status === 'verified' || order.status === 'paid';
                  const planTitle = parseSubscriptionPlan(order);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{order.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.id, `order-${order.id}`)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                            title="Copy Order ID"
                          >
                            {copiedId === `order-${order.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Subscriber */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-[140px]">
                          <span className="font-bold text-slate-900 truncate">
                            {order.customer_name || 'Subscribing Merchant'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            Ref: {order.external_ref ? `${order.external_ref.slice(0, 8)}...` : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Plan Duration */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 border border-indigo-200/70 text-indigo-700">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>{planTitle}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums">
                        {formatINR(order.amount)}
                      </td>

                      {/* Rail & UTR */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] text-slate-700 font-semibold">
                            {order.utr || order.customer_utr || 'Awaiting Bank UTR'}
                          </span>
                          <span className="text-[10px] text-slate-400">Direct IndusInd UPI Rail</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{isPaid ? 'Verified' : 'Pending'}</span>
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {formatDateTimeIST(order.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
