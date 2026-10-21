'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  FileSpreadsheet,
  Mail,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle,
  Info,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { formatMerchantId } from '@/lib/merchantId';

// ── Time & Formatting Helpers ─────────────────────────────────────
const IST_TZ = 'Asia/Kolkata';

function toIST(dateStr) {
  if (!dateStr) return new Date();
  return new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: IST_TZ }));
}

function startOfDayIST(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatINR(n) {
  const val = Number(n) || 0;
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isVerified(o) {
  const s = (o?.status || '').toLowerCase();
  return s === 'verified' || s === 'success' || s === 'paid' || s === 'completed';
}

function isPending(o) {
  const s = (o?.status || '').toLowerCase();
  return s === 'pending' || s === 'processing' || s === 'in_progress';
}

function isFailed(o) {
  const s = (o?.status || '').toLowerCase();
  return s === 'failed' || s === 'cancelled' || s === 'rejected' || s === 'declined';
}

function isExpired(o) {
  return (o?.status || '').toLowerCase() === 'expired';
}

export default function ReportsRedesign({
  profile = {},
  orders = [],
  onRefresh,
  setActiveTab
}) {
  const [timeRange, setTimeRange] = useState('7d'); // 'today' | 'yesterday' | '7d' | 'this_month' | 'last_month' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [gstRate, setGstRate] = useState(profile?.gstin ? 18 : 0); // default 18% if GST registered
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [emailNotificationScheduled, setEmailNotificationScheduled] = useState(true);

  // ── 1. Filter Orders by Timeframe ───────────────────────────────
  const { currentOrders, previousOrders, periodLabel, prevPeriodLabel } = useMemo(() => {
    const now = new Date();
    const today = startOfDayIST(now);

    let start = new Date(today);
    let end = new Date(now);
    let prevStart = new Date(today);
    let prevEnd = new Date(today);
    let pLabel = 'Selected Period';
    let prevLabel = 'Previous Period';

    if (timeRange === 'today') {
      start = today;
      end = now;
      prevStart = new Date(today);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(today);
      pLabel = 'Today';
      prevLabel = 'Yesterday';
    } else if (timeRange === 'yesterday') {
      start = new Date(today);
      start.setDate(start.getDate() - 1);
      end = new Date(today);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(start);
      pLabel = 'Yesterday';
      prevLabel = 'Day Before Yesterday';
    } else if (timeRange === '7d') {
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      end = now;
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(start);
      pLabel = 'Last 7 Days';
      prevLabel = 'Prior 7 Days';
    } else if (timeRange === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = now;
      prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      pLabel = 'This Month';
      prevLabel = 'Last Month';
    } else if (timeRange === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      prevStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0, 23, 59, 59);
      pLabel = 'Last Month';
      prevLabel = '2 Months Ago';
    } else if (timeRange === 'custom') {
      if (customStart) start = new Date(customStart);
      if (customEnd) {
        const d = new Date(customEnd);
        d.setHours(23, 59, 59, 999);
        end = d;
      }
      pLabel = 'Custom Range';
      prevLabel = 'Previous Period';
    }

    const cur = orders.filter(o => {
      const t = new Date(o.created_at || 0).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const prev = orders.filter(o => {
      const t = new Date(o.created_at || 0).getTime();
      return t >= prevStart.getTime() && t < prevEnd.getTime();
    });

    return {
      currentOrders: cur,
      previousOrders: prev,
      periodLabel: pLabel,
      prevPeriodLabel: prevLabel
    };
  }, [orders, timeRange, customStart, customEnd]);

  // ── 2. Primary KPI Calculations ─────────────────────────────────
  const metrics = useMemo(() => {
    const curVerified = currentOrders.filter(isVerified);
    const prevVerified = previousOrders.filter(isVerified);

    const curTotal = curVerified.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const prevTotal = prevVerified.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);

    const curCount = curVerified.length;
    const prevCount = prevVerified.length;

    const curAvgTicket = curCount > 0 ? curTotal / curCount : 0;
    const prevAvgTicket = prevCount > 0 ? prevTotal / prevCount : 0;

    const curSuccessRate = currentOrders.length > 0
      ? ((curCount / currentOrders.length) * 100).toFixed(1)
      : '0.0';

    const prevSuccessRate = previousOrders.length > 0
      ? ((prevCount / previousOrders.length) * 100).toFixed(1)
      : '0.0';

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    return {
      curTotal,
      prevTotal,
      totalGrowth: calcGrowth(curTotal, prevTotal),
      curCount,
      prevCount,
      countGrowth: calcGrowth(curCount, prevCount),
      curAvgTicket,
      prevAvgTicket,
      avgTicketGrowth: calcGrowth(curAvgTicket, prevAvgTicket),
      curSuccessRate,
      prevSuccessRate,
      rateDiff: (parseFloat(curSuccessRate) - parseFloat(prevSuccessRate)).toFixed(1),
      curVerified
    };
  }, [currentOrders, previousOrders]);

  // ── 3. Hourly Heatmap (00:00 - 23:00) ───────────────────────────
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
      volume: 0
    }));

    metrics.curVerified.forEach(o => {
      if (!o.created_at) return;
      const istDate = toIST(o.created_at);
      const h = istDate.getHours();
      hours[h].count += 1;
      hours[h].volume += (parseFloat(o.amount) || 0);
    });

    const maxCount = Math.max(...hours.map(h => h.count), 1);
    const peakHour = hours.reduce((best, h) => (h.count > best.count ? h : best), hours[0]);

    return { hours, maxCount, peakHour };
  }, [metrics.curVerified]);

  // ── 4. Failure Report & Drop-off Breakdown ─────────────────────
  const failureMetrics = useMemo(() => {
    const nonVerified = currentOrders.filter(o => !isVerified(o));
    const totalNonVerified = nonVerified.length;

    let expiredCount = 0;
    let cancelledCount = 0;
    let bankDeclinedCount = 0;
    let pendingCount = 0;

    nonVerified.forEach(o => {
      const s = (o.status || '').toLowerCase();
      const note = (o.note || '').toLowerCase();
      if (s === 'expired') {
        expiredCount++;
      } else if (s === 'cancelled' || s === 'rejected') {
        cancelledCount++;
      } else if (s === 'failed' || note.includes('decline') || note.includes('limit')) {
        bankDeclinedCount++;
      } else if (s === 'pending' || s === 'in_progress') {
        pendingCount++;
      } else {
        cancelledCount++;
      }
    });

    return {
      totalNonVerified,
      expiredCount,
      cancelledCount,
      bankDeclinedCount,
      pendingCount,
      expiredPct: totalNonVerified > 0 ? Math.round((expiredCount / totalNonVerified) * 100) : 0,
      cancelledPct: totalNonVerified > 0 ? Math.round((cancelledCount / totalNonVerified) * 100) : 0,
      declinedPct: totalNonVerified > 0 ? Math.round((bankDeclinedCount / totalNonVerified) * 100) : 0,
      pendingPct: totalNonVerified > 0 ? Math.round((pendingCount / totalNonVerified) * 100) : 0
    };
  }, [currentOrders]);

  // ── 5. GST & Accounting Export Formatter ────────────────────────
  const handleDownloadCsv = () => {
    const rows = [
      [
        'Date (IST)',
        'Time (IST)',
        'Order ID',
        'Customer VPA',
        'Customer / Description',
        'Bank UTR Number',
        'Gross Amount (INR)',
        'GST Rate %',
        'Estimated GST (INR)',
        'Net Amount (INR)',
        'Status',
        'Settlement Rail'
      ]
    ];

    currentOrders.forEach(o => {
      const istDate = toIST(o.created_at);
      const dStr = istDate.toLocaleDateString('en-IN', { timeZone: IST_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
      const tStr = istDate.toLocaleTimeString('en-IN', { timeZone: IST_TZ, hour12: false });

      const gross = parseFloat(o.amount) || 0;
      const rate = gstRate || 0;
      const estimatedGst = rate > 0 ? Number(((gross * rate) / (100 + rate)).toFixed(2)) : 0;
      const net = rate > 0 ? Number((gross - estimatedGst).toFixed(2)) : gross;

      rows.push([
        dStr,
        tStr,
        o.id,
        o.customer_vpa || 'Direct UPI',
        (o.note || 'Checkout Payment').replace(/,/g, ' '),
        o.utr || o.customer_utr || 'Pending_Settlement',
        gross.toFixed(2),
        rate.toString(),
        estimatedGst.toFixed(2),
        net.toFixed(2),
        o.status || 'unknown',
        'Direct UPI Account'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_gst_accounting_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    const summary = `MyMobPay Accounting Summary (${periodLabel})
Total Gross Collections: ${formatINR(metrics.curTotal)}
Verified Orders: ${metrics.curCount}
Average Ticket Size: ${formatINR(metrics.curAvgTicket)}
Success Rate: ${metrics.curSuccessRate}%
Applicable GST: ${gstRate}%
Estimated GST Component: ${formatINR(metrics.curTotal * (gstRate / (100 + gstRate)))}
Settlement: 100% Direct to Merchant UPI (Zero Gateway MDR)`;

    navigator.clipboard.writeText(summary);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  return (
    <div className="w-full space-y-6 font-sans antialiased text-[#0f141a]">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Analytics Reports</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Tax & CA Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Reconcile collections, export Indian CA/GST accounting journals, and analyze hourly UPI traffic.
          </p>
        </div>

        {/* Quick Period Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0c2340] hover:bg-[#143660] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CA CSV
          </button>
        </div>
      </div>

      {/* Custom Date Pickers (if custom selected) */}
      {timeRange === 'custom' && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* ── Core Summary KPI Cards with Comparisons ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Collections */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Collections</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              metrics.totalGrowth > 0 ? 'bg-emerald-50 text-emerald-700' : metrics.totalGrowth < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {metrics.totalGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : metrics.totalGrowth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(metrics.totalGrowth)}%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono">{formatINR(metrics.curTotal)}</p>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>{periodLabel}</span>
              <span>Prior: {formatINR(metrics.prevTotal)}</span>
            </div>
          </div>
        </div>

        {/* Total Verified Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verified Orders</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              metrics.countGrowth > 0 ? 'bg-emerald-50 text-emerald-700' : metrics.countGrowth < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {metrics.countGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : metrics.countGrowth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(metrics.countGrowth)}%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono">{metrics.curCount}</p>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>{metrics.curCount} paid</span>
              <span>Prior: {metrics.prevCount}</span>
            </div>
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Ticket Size</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              metrics.avgTicketGrowth > 0 ? 'bg-emerald-50 text-emerald-700' : metrics.avgTicketGrowth < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {metrics.avgTicketGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(metrics.avgTicketGrowth)}%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono">{formatINR(metrics.curAvgTicket)}</p>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>Per customer</span>
              <span>Prior: {formatINR(metrics.prevAvgTicket)}</span>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI Success Rate</span>
            <span className="text-[10px] font-bold text-slate-500">{currentOrders.length} attempts</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{metrics.curSuccessRate}%</span>
              <span className={`text-[11px] font-bold ${parseFloat(metrics.rateDiff) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {parseFloat(metrics.rateDiff) >= 0 ? `+${metrics.rateDiff}%` : `${metrics.rateDiff}%`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(metrics.curSuccessRate), 100)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── Hourly Traffic Heatmap ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hourly Payment Velocity Heatmap (IST)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies peak payment hours for timing flash sales, marketing campaigns, or support staffing.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              🔥 Peak Hour: {hourlyData.peakHour.label} ({hourlyData.peakHour.count} orders, {formatINR(hourlyData.peakHour.volume)})
            </span>
          </div>
        </div>

        {/* 24-Hour Bar Graph */}
        <div className="pt-2">
          <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-28 border-b border-slate-100 pb-2">
            {hourlyData.hours.map(h => {
              const heightPct = Math.round((h.count / hourlyData.maxCount) * 100);
              const isPeak = h.hour === hourlyData.peakHour.hour && h.count > 0;

              return (
                <div key={h.hour} className="flex flex-col items-center gap-1 group relative h-full justify-end">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isPeak
                        ? 'bg-emerald-600'
                        : h.count > 0
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                      {h.label}: {h.count} orders ({formatINR(h.volume)})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1.5 px-0.5">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* ── Failure Analysis & Drop-Off Breakdown ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Drop-Off Reason Analysis */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Checkout Drop-Off & Failure Diagnostics</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Understand where potential customers dropped off before completing UPI settlement.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {failureMetrics.totalNonVerified} incomplete attempt{failureMetrics.totalNonVerified !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Expired QR */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Expired QR / Session Timeout
                </span>
                <span className="text-slate-900 font-mono">
                  {failureMetrics.expiredCount} ({failureMetrics.expiredPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${failureMetrics.expiredPct}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Customer opened checkout page or scanned QR, but took longer than payment window.
              </p>
            </div>

            {/* User Cancelled */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                  User Cancelled / Exited UPI App
                </span>
                <span className="text-slate-900 font-mono">
                  {failureMetrics.cancelledCount} ({failureMetrics.cancelledPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${failureMetrics.cancelledPct}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Customer opened GPay/PhonePe and manually dismissed or closed without authorizing MPIN.
              </p>
            </div>

            {/* Bank Network / UPI Decline */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  Bank Decline / UPI Limit Exceeded
                </span>
                <span className="text-slate-900 font-mono">
                  {failureMetrics.bankDeclinedCount} ({failureMetrics.declinedPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${failureMetrics.declinedPct}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Bank server timeout or customer exceeded daily ₹1,00,000 NPCI UPI transfer limit.
              </p>
            </div>

            {/* Pending Confirmation */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  In-Flight / Awaiting Confirmation
                </span>
                <span className="text-slate-900 font-mono">
                  {failureMetrics.pendingCount} ({failureMetrics.pendingPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${failureMetrics.pendingPct}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Customer payment in flight or awaiting email/SMS match in Verification Center.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: CA & GST Preferences Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">CA / GST Export Config</h3>
            </div>
            <p className="text-xs text-slate-500">
              Generate formatted GST journals ready for GSTR-1 & balance sheet reconciliation.
            </p>

            <div className="space-y-3 mt-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Applicable GST Slab
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value={0}>0% (Exempted / Unregistered)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard SaaS & Digital)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Sales:</span>
                  <span className="font-bold font-mono">{formatINR(metrics.curTotal)}</span>
                </div>
                {gstRate > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>GST Component ({gstRate}%):</span>
                      <span className="font-mono">{formatINR(metrics.curTotal * (gstRate / (100 + gstRate)))}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Net Taxable Value:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(metrics.curTotal - (metrics.curTotal * (gstRate / (100 + gstRate))))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200/50">
                  <span>Gateway MDR / Fee:</span>
                  <span className="font-bold">₹0.00 (Zero MDR)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download GST CSV
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedCsv ? 'Copied to Clipboard!' : 'Copy Summary for CA'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Scheduled Reports & Email Preferences ───────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Scheduled Daily & Weekly Digest</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Receive automated morning collection digests directly to <strong>{profile?.email || 'your account email'}</strong> at 08:00 AM IST.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEmailNotificationScheduled(!emailNotificationScheduled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              emailNotificationScheduled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {emailNotificationScheduled ? '✓ Daily Email Active' : 'Enable Daily Email'}
          </button>
        </div>
      </div>

    </div>
  );
}
