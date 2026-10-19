'use client';

import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Store, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  IndianRupee, 
  Activity,
  Users,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Percent,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
        <p className="font-bold text-slate-400">{label}</p>
        <p className="text-sm font-black text-blue-400">
          ₹{Number(payload[0].value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
        {payload[0].payload?.count !== undefined && (
          <p className="text-[10px] text-slate-300">
            {payload[0].payload.count} orders processed
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function OverviewTab({
  platformMetrics,
  chartData = [],
  merchantLeaderboard = [],
  recentOrders = [],
  onSelectOrder,
  onSelectMerchant,
  onNavigateTab
}) {
  const successRate = platformMetrics.totalCount > 0
    ? Math.round((platformMetrics.verifiedCount / platformMetrics.totalCount) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. TOP EXECUTIVE KPI STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total GMV */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Volume (GMV)</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 flex items-baseline">
                <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                <span>{platformMetrics.totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{platformMetrics.verifiedCount} verified transactions</span>
            <span className="text-[11px] font-bold text-emerald-600">0% fees deducted</span>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Today&apos;s Revenue</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 flex items-baseline">
                <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                <span>{platformMetrics.today.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold">+{platformMetrics.today.count} checkouts today</span>
            <span className="text-[10px] text-slate-400 font-semibold">Real-time</span>
          </div>
        </div>

        {/* Active SaaS Merchants */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Merchants</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {platformMetrics.totalMerchants}
              </h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">{platformMetrics.activeMerchants} active plans</span>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('merchants')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View Directory &rarr;
            </button>
          </div>
        </div>

        {/* Awaiting Verification / Match */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Awaiting Match</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">
                {platformMetrics.pendingCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-semibold">Pending UTR or webhook</span>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('transactions')}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-800 transition-colors"
            >
              Review Logs &rarr;
            </button>
          </div>
        </div>

      </section>

      {/* 2. PLATFORM VOLUME TREND CHART */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Platform Volume Trend (Last 7 Days)
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Aggregate daily settled payments across all connected merchant UPI VPAs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Direct NPCI Rails
            </span>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAdminVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdminVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. SPLIT SECTION: TOP MERCHANTS & RECENT TRANSACTION PULSE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Merchants Leaderboard */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" /> Top Performing Merchants
              </h4>
              <p className="text-xs text-slate-400">Ranked by verified order volume</p>
            </div>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('merchants')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              All Merchants &rarr;
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-left">Rank &amp; Business</th>
                  <th className="px-4 py-3 text-left">UPI VPA</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {merchantLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                      No merchant transaction volume recorded yet.
                    </td>
                  </tr>
                ) : (
                  merchantLeaderboard.slice(0, 5).map((m, idx) => (
                    <tr 
                      key={m.id} 
                      onClick={() => onSelectMerchant && onSelectMerchant(m)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' :
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            idx === 2 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold">{m.businessName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {m.upiId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-slate-700">
                        {m.ordersCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-black text-blue-600">
                        ₹{Number(m.salesVolume || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Transaction Pulse */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Recent Activity
              </h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Live
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {recentOrders.slice(0, 5).map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => onSelectOrder && onSelectOrder(order)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {order.customer_name || 'Customer'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {order.utr ? `UTR: ${order.utr}` : 'Awaiting UTR match'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900">₹{order.amount}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase mt-0.5 ${
                      order.status === 'verified' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : order.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('transactions')}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
          >
            Open All Transaction Logs &rarr;
          </button>
        </div>

      </div>

    </div>
  );
}
