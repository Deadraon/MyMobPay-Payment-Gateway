'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, X, AlertCircle, Plus, ArrowRight, ShieldCheck,
  Landmark, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Info, Inbox, ChevronRight, BarChart2, Zap, CircleDollarSign, ExternalLink,
  QrCode, RefreshCw, ArrowUpRight, ArrowDownLeft, Shield, Activity, Building2,
  Copy, Check, Search, Calendar, SlidersHorizontal, MoreVertical, Sliders,
  Eye, EyeOff, Printer, Trash2, ArrowUpDown, HelpCircle
} from 'lucide-react';
import { formatMerchantId } from '@/lib/merchantId';

// ── Status Badges (Sharp & Refined Reference Style) ─────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const isSettled = s === 'verified' || s === 'success' || s === 'paid' || s === 'completed' || s === 'settled';
  const isPending = s === 'pending' || s === 'processing' || s === 'in_progress';
  const isFailed = s === 'failed' || s === 'cancelled' || s === 'rejected' || s === 'declined';

  if (isSettled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
        Settled
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF4ED] text-[#D9531E] border border-[#FCD2C0] shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D9531E] animate-pulse"></span>
        Processing
      </span>
    );
  }
  if (isFailed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      {status || '—'}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
const IST_TZ = 'Asia/Kolkata';
function toIST(dateStr) { return new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: IST_TZ })); }
function todayIST() { const d = toIST(new Date().toISOString()); d.setHours(0,0,0,0); return d; }
function yesterdayIST() { const d = todayIST(); d.setDate(d.getDate()-1); return d; }
function formatINR(n) { return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatINRSlim(n) { return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }
function formatYAxis(n) {
  const val = Math.round(Number(n) || 0);
  if (val <= 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `₹${val}`;
}
function isVerified(o) { const s=(o.status||'').toLowerCase(); return s==='verified'||s==='success'||s==='paid'||s==='completed'||s==='settled'; }
function isPending(o)  { const s=(o.status||'').toLowerCase(); return s==='pending'||s==='processing'||s==='in_progress'; }
function isFailed(o)   { const s=(o.status||'').toLowerCase(); return s==='failed'||s==='cancelled'||s==='rejected'||s==='declined'; }
function fmtTime(d) { if(!d) return ''; return new Date(d).toLocaleTimeString('en-IN',{timeZone:IST_TZ,hour:'2-digit',minute:'2-digit',hour12:true}); }
function fmtDate(d) {
  if(!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: IST_TZ });
}

export default function DashboardOverviewRedesign({
  profile,
  user,
  stats = {},
  orders = [],
  analyticsTimeframe = 7,
  setAnalyticsTimeframe,
  setActiveTab,
  setSettingsCategory,
  onRefresh
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRange, setSelectedRange] = useState('Last 3 weeks');
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [isSettlementMenuOpen, setIsSettlementMenuOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState(null);
  const [hoveredChartBar, setHoveredChartBar] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Attached Primary Bank Account Resolution (from localStorage or profile)
  const attachedBank = useMemo(() => {
    // 1. Check localStorage if user saved custom accounts in Settings
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const saved = localStorage.getItem(`mymobpay_bank_accounts_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const primary = parsed.find(a => a.is_primary) || parsed[0];
            if (primary && primary.bank_name) {
              return primary;
            }
          }
        }
      } catch (e) {
        console.error('Error reading saved bank accounts:', e);
      }
    }

    // 2. Read directly from merchant profile (e.g. IndusInd Bank, 916396714325, INDB0001077)
    if (profile?.bank_name || profile?.bank_account_number) {
      return {
        id: 'primary_bank',
        bank_name: profile.bank_name || 'Attached Bank',
        bank_account_name: profile.bank_account_name || profile.business_name || profile.owner_name || 'Primary Beneficiary',
        bank_account_number: profile.bank_account_number || '',
        bank_ifsc: profile.bank_ifsc || '',
        account_type: 'Current Account',
        is_primary: true
      };
    }

    return null;
  }, [profile, user]);

  // Live IST Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: IST_TZ }); // YYYY-MM-DD
      const timeStr = now.toLocaleTimeString('en-GB', { timeZone: IST_TZ, hour: '2-digit', minute: '2-digit' });
      setCurrentTime(`${dateStr} ${timeStr}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Dismiss dropdowns on outside click
  useEffect(() => {
    const handleDocClick = () => {
      setIsRangeDropdownOpen(false);
      setIsSettlementMenuOpen(false);
    };
    if (isRangeDropdownOpen || isSettlementMenuOpen) {
      window.addEventListener('click', handleDocClick);
      return () => window.removeEventListener('click', handleDocClick);
    }
  }, [isRangeDropdownOpen, isSettlementMenuOpen]);

  // Calculations
  const todayStart = useMemo(() => todayIST(), []);
  const todayVerified = useMemo(() => orders.filter(o => isVerified(o) && toIST(o.created_at || '').getTime() >= todayStart.getTime()), [orders, todayStart]);
  const todayTotal = useMemo(() => todayVerified.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0), [todayVerified]);

  const thirtyDayVerified = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return orders.filter(o => isVerified(o) && new Date(o.created_at || 0).getTime() >= cutoff);
  }, [orders]);
  const thirtyDayTotal = useMemo(() => thirtyDayVerified.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0), [thirtyDayVerified]);

  const allTimeVerified = useMemo(() => orders.filter(isVerified), [orders]);
  const allTimeTotal = useMemo(() => allTimeVerified.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0), [allTimeVerified]);

  // Direct Inflow metrics (Non-Custodial: 0% Escrow Hold)
  const totalCollections = allTimeTotal;
  const recentSettledInflow = thirtyDayTotal > 0 ? thirtyDayTotal : allTimeTotal;
  const todayInflow = todayTotal;

  // Chart Data across 12 months computed directly from merchant's real verified orders
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Aggregate real collections and order counts per month
    const monthlyStats = months.map((month, idx) => {
      let incoming = 0;
      let ordersCount = 0;

      orders.forEach((o) => {
        if (!o?.created_at || !isVerified(o)) return;
        const d = toIST(o.created_at);
        // Match orders in the current calendar year for this month
        if (d.getFullYear() === currentYear && d.getMonth() === idx) {
          incoming += parseFloat(o.amount) || 0;
          ordersCount += 1;
        }
      });

      return {
        month,
        incoming,
        ordersCount,
      };
    });

    const maxIncoming = Math.max(...monthlyStats.map(m => m.incoming), 0);
    const maxOrders = Math.max(...monthlyStats.map(m => m.ordersCount), 0);
    const scaleVolume = maxIncoming > 0 ? maxIncoming : 10000;
    const scaleOrders = maxOrders > 0 ? maxOrders : 10;

    return monthlyStats.map((item) => ({
      ...item,
      inflowHeightPct: item.incoming > 0 
        ? Math.min(Math.max((item.incoming / scaleVolume) * 85, 10), 85)
        : 0,
      ordersHeightPct: item.ordersCount > 0 
        ? Math.min(Math.max((item.ordersCount / scaleOrders) * 65, 8), 65)
        : 0,
    }));
  }, [orders]);

  const chartMaxVolume = useMemo(() => {
    const maxVal = Math.max(...monthlyChartData.map(d => d.incoming), 0);
    if (maxVal === 0) return 10000;
    if (maxVal <= 1000) return 1000;
    if (maxVal <= 5000) return 5000;
    if (maxVal <= 10000) return 10000;
    if (maxVal <= 25000) return 25000;
    if (maxVal <= 50000) return 50000;
    if (maxVal <= 100000) return 100000;
    return Math.ceil(maxVal / 50000) * 50000;
  }, [monthlyChartData]);

  // Generate SVG spline points for the smooth line graph running over the dual bars
  const splinePath = useMemo(() => {
    const totalBars = monthlyChartData.length;
    if (totalBars === 0) return '';
    const hasAnyVolume = monthlyChartData.some(d => d.incoming > 0);
    if (!hasAnyVolume) return '';

    const maxIncoming = Math.max(...monthlyChartData.map(d => d.incoming), 1000);
    const points = monthlyChartData.map((d, i) => {
      const x = ((i + 0.5) / totalBars) * 100;
      const y = d.incoming > 0 
        ? 85 - (d.incoming / maxIncoming) * 65 
        : 88;
      return { x, y: Math.max(15, Math.min(y, 88)) };
    });

    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [monthlyChartData]);

  // Filtered Transactions list
  const filteredOrders = useMemo(() => {
    let list = orders.length > 0 ? orders : [];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(o =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        (o.utr || '').toLowerCase().includes(q) ||
        String(o.amount).includes(q)
      );
    }
    return list;
  }, [orders, searchFilter]);

  // Master Checkbox Toggle
  const toggleSelectAll = () => {
    if (selectedTxIds.size === filteredOrders.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedTxIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTxIds(next);
  };

  const copyVpa = () => {
    const vpa = profile?.upi_id || 'merchant@upi';
    navigator.clipboard?.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const copyBankField = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedBankField(key);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  return (
    <div className="w-full space-y-6 font-sans antialiased text-[#1E293B]">

      {/* ── TOP SECTION: BREADCRUMB & MASTER REVENUE HEADER ─────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Overview</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">Direct UPI Inflow</span>
          </div>

          {/* Section Title & Connection Badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Business Inflow &amp; Settlements
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Direct to Bank
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Real-time direct UPI settlement at <span className="font-mono text-slate-700 font-medium">{currentTime || '2026-10-25 15:30'}</span> • Zero platform custody / escrow
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            type="button"
            onClick={() => setActiveTab?.('payment-links')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Payment Link</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettlementModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Bank Rails</span>
          </button>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search transactions, UTR, orders..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all shadow-2xs"
            />
          </div>

          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRangeDropdownOpen(!isRangeDropdownOpen);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <span>{selectedRange}</span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isRangeDropdownOpen ? 'rotate-90' : ''}`} />
            </button>

            {isRangeDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-xs text-slate-700"
              >
                {['Today (24h)', 'Last 7 days', 'Last 3 weeks', 'This Month', 'All Time'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRange(r);
                      setIsRangeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between font-medium ${
                      selectedRange === r ? 'text-[#0D9488] font-bold bg-[#E6F4EA]/40' : ''
                    }`}
                  >
                    <span>{r}</span>
                    {selectedRange === r && <Check className="w-3.5 h-3.5 text-[#0D9488]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Date Range Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Right side: Bank Settings Button */}
        <button
          type="button"
          onClick={() => {
            setSettingsCategory?.('banking');
            setActiveTab?.('settings');
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Settlement Rules</span>
        </button>
      </div>

      {/* ── TWO HERO CARDS (Sharp & Non-Custodial Direct Architecture) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* ── CARD 1: DIRECT SETTLEMENT RAIL (Left 5 Cols) ─────────── */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAE7] rounded-2xl p-6 shadow-xs flex flex-col justify-between relative hover:border-slate-300 transition-all">
          <div>
            {/* Header: Direct Settlement Rail + Info + 3-Dots */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900">Direct Settlement Rail</span>
                <div className="group relative cursor-pointer" title="Direct-to-bank UPI settlement. MyMobPay holds 0% escrow funds.">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                </div>
              </div>

              {/* Three dots dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSettlementMenuOpen(!isSettlementMenuOpen);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isSettlementMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-xs text-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettlementMenuOpen(false);
                        setActiveTab?.('reports');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Download Statement</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettlementMenuOpen(false);
                        setSettingsCategory?.('banking');
                        setActiveTab?.('settings');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bank Account Settings</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Currency Symbol + Big Figure */}
            <div className="flex items-center gap-3.5 mt-4">
              {/* Attached Bank Emblem or Region Flag Badge */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-900 via-slate-900 to-slate-800 border border-slate-700/40 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 select-none relative">
                {attachedBank?.bank_name ? (
                  <span className="tracking-tight font-extrabold text-white text-xs">
                    {attachedBank.bank_name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </span>
                ) : (
                  <span className="text-base">🇮🇳</span>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-2xs" title="Direct Settlement Verified">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
              </div>

              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
                  {formatINR(totalCollections)}
                </span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  Total Settled Direct to {attachedBank?.bank_name || 'Bank'} (T+0 Real-Time)
                </span>
              </div>
            </div>

            {/* Attached Bank Account & Settlement Rail */}
            {attachedBank ? (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                {/* Bank Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 shrink-0">
                      <Landmark className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {attachedBank.bank_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {attachedBank.account_type || 'Current Account'}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Primary A/C
                  </span>
                </div>

                {/* Account Number & IFSC Grid */}
                <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      A/C Number
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-slate-800 text-[12px]">
                        {showFullAccount
                          ? attachedBank.bank_account_number
                          : `•••• •••• ${attachedBank.bank_account_number ? String(attachedBank.bank_account_number).slice(-4) : '••••'}`}
                      </span>
                      {attachedBank.bank_account_number && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowFullAccount(!showFullAccount)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title={showFullAccount ? "Mask account number" : "Show full account number"}
                            aria-label="Toggle account visibility"
                          >
                            {showFullAccount ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyBankField(attachedBank.bank_account_number, 'account')}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy Account Number"
                            aria-label="Copy account number"
                          >
                            {copiedBankField === 'account' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      IFSC Code
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-slate-800 text-[12px]">
                        {attachedBank.bank_ifsc || '—'}
                      </span>
                      {attachedBank.bank_ifsc && (
                        <button
                          type="button"
                          onClick={() => copyBankField(attachedBank.bank_ifsc, 'ifsc')}
                          className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                          title="Copy IFSC Code"
                          aria-label="Copy IFSC Code"
                        >
                          {copiedBankField === 'ifsc' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Beneficiary Name row */}
                {attachedBank.bank_account_name && (
                  <div className="pt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Beneficiary
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={attachedBank.bank_account_name}>
                      {attachedBank.bank_account_name}
                    </span>
                  </div>
                )}

                {/* Direct Instant UPI Rail footer */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="text-slate-600 truncate">
                      UPI Rail: <strong className="font-mono font-semibold text-slate-800">{profile?.upi_id || 'merchant@upi'}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyVpa}
                    className="font-bold text-teal-700 hover:text-teal-900 cursor-pointer ml-2 shrink-0 transition-colors"
                  >
                    {copiedVpa ? 'Copied VPA!' : 'Copy VPA'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600">No bank account linked yet</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsCategory?.('banking');
                    setActiveTab?.('settings');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  + Link Bank Account
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons: Create Payment Link & Counter Standee QR */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab?.('payment-links')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Link</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab?.('payment-links')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-300" />
              <span>Counter QR</span>
            </button>
          </div>
        </div>

        {/* ── CARD 2: INFLOW VELOCITY & DUAL BAR/LINE CHART (Right 7 Cols) ─ */}
        <div className="lg:col-span-7 bg-white border border-[#E5EAE7] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-stretch relative hover:border-slate-300 transition-all">

          {/* Sub-Column 1: Today & 30-Day Collections */}
          <div className="flex md:flex-col justify-between gap-3 w-full md:w-44 shrink-0">
            {/* Today Collections Stat */}
            <div className="flex-1 p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E5EAE7] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E6F4EA] text-[#137333] flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block">Today Inflow</span>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums block truncate">
                  {formatINR(todayInflow)}
                </span>
              </div>
            </div>

            {/* Settled Orders Stat */}
            <div className="flex-1 p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E5EAE7] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 block">Settled Orders</span>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums block truncate">
                  {allTimeVerified.length} Orders
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Column 2: Collections Dual Bar + Smooth Spline Chart */}
          <div className="flex-1 flex flex-col justify-between relative min-h-[170px] pt-1">
            {/* Y-Axis Reference Guide Lines */}
            <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-400">
                <span></span><span>{formatYAxis(chartMaxVolume)}</span>
              </div>
              <div className="border-b border-dashed border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-400">
                <span></span><span>{formatYAxis(chartMaxVolume * 0.66)}</span>
              </div>
              <div className="border-b border-dashed border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-400">
                <span></span><span>{formatYAxis(chartMaxVolume * 0.33)}</span>
              </div>
              <div className="border-b border-dashed border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-400">
                <span></span><span>₹0</span>
              </div>
            </div>

            {/* Dual Bars + Spline Layer */}
            <div className="relative h-32 w-full flex items-end justify-between px-2 pt-2">
              {/* Background SVG Spline Curve (only rendered when real volume exists) */}
              {splinePath ? (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path
                    d={splinePath}
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="opacity-70 transition-all duration-300"
                  />
                </svg>
              ) : null}

              {/* Dual Bar Pairs (Teal = Volume, Amber = Order count) */}
              {monthlyChartData.map((d) => (
                <div
                  key={d.month}
                  onMouseEnter={() => setHoveredChartBar(d)}
                  onMouseLeave={() => setHoveredChartBar(null)}
                  className="flex-1 flex items-end justify-center gap-1 h-full cursor-pointer group relative z-20"
                >
                  {/* Teal Bar (Collections Volume) */}
                  <div
                    className={`w-1.5 sm:w-2 rounded-t-full transition-all duration-150 ${
                      d.incoming > 0 
                        ? 'bg-[#14B8A6] group-hover:bg-[#0D9488]' 
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}
                    style={{ height: d.incoming > 0 ? `${d.inflowHeightPct}%` : '4px' }}
                  />
                  {/* Soft Amber Bar (Order frequency) */}
                  <div
                    className={`w-1.5 sm:w-2 rounded-t-full transition-all duration-150 ${
                      d.ordersCount > 0 
                        ? 'bg-[#F59E0B]/80 group-hover:bg-[#D97706]' 
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}
                    style={{ height: d.ordersCount > 0 ? `${d.ordersHeightPct}%` : '4px' }}
                  />

                  {/* Tooltip on Hover */}
                  {hoveredChartBar?.month === d.month && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap z-30 pointer-events-none animate-fade-in">
                      <p className="font-bold">{d.month}</p>
                      <p className="text-teal-300">Volume: {formatINR(d.incoming)}</p>
                      <p className="text-amber-300">Orders: {d.ordersCount}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* X-Axis Month Labels */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
              {monthlyChartData.map((d) => (
                <span key={d.month} className="flex-1 text-center">
                  {d.month}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── TRANSACTIONS TABLE SECTION ──────────────────────────── */}
      <div className="bg-white border border-[#E5EAE7] rounded-2xl shadow-xs overflow-hidden">
        {/* Table Card Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Transactions</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredOrders.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab?.('transactions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span>Explore Order Ledger</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 bg-white">
                <th className="py-3 px-6 w-10">
                  <input
                    type="checkbox"
                    checked={selectedTxIds.size > 0 && selectedTxIds.size === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="t-checkbox"
                    aria-label="Select all transactions"
                  />
                </th>
                <th className="py-3 px-4 font-medium">Dates</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Payment Mode</th>
                <th className="py-3 px-4 font-medium">Details</th>
                <th className="py-3 px-6 font-medium text-right">Settled Amount</th>
                <th className="py-3 px-6 font-medium text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-xs text-slate-700">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => {
                  const isChecked = selectedTxIds.has(o.id);
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-[#F8FAF9] transition-colors group ${isChecked ? 'bg-[#F4F7F6]/60' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-6">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(o.id)}
                          className="t-checkbox"
                          aria-label={`Select transaction ${o.id}`}
                        />
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {fmtDate(o.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={o.status} />
                      </td>

                      {/* Types */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {o.type || (o.vpa ? 'Direct UPI' : 'Web Checkout')}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="truncate max-w-[240px]">
                          {o.customer_name || `Order ${o.id?.slice(0, 14)}`}
                          {o.utr && <span className="block text-[10px] text-slate-400 font-mono">UTR: {o.utr}</span>}
                        </div>
                      </td>

                      {/* Amounts */}
                      <td className="py-3.5 px-6 font-bold tabular-nums text-slate-900 text-right whitespace-nowrap">
                        {formatINR(o.amount || 0)}
                      </td>

                      {/* Action Icons */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(o)}
                            className="p-1 rounded hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print?.()}
                            className="p-1 rounded hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Print / Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab?.('transactions')}
                            className="p-1 rounded hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Manage transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No matching transactions found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Direct customer payments will appear here in real-time.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-[#F8FAF9]/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredOrders.length} transactions</span>
          <button
            type="button"
            onClick={() => setActiveTab?.('transactions')}
            className="text-xs font-bold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MODAL: BANK SETTLEMENT RAILS & VPA ─────────────────────── */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsSettlementModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Direct Bank Settlement Rail</h3>
                  <p className="text-xs text-slate-500">Zero-escrow instant deposit architecture</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zero-Escrow Callout */}
            <div className="p-4 rounded-xl bg-[#E6F4EA]/50 border border-[#CEEAD6] space-y-1">
              <span className="text-xs font-bold text-[#137333] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 0% Platform Escrow Guarantee
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                MyMobPay never holds customer funds. Customer UPI payments credit directly to your receiving VPA and linked bank account in T+0 real time.
              </p>
            </div>

            {/* Linked Bank Account info */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Direct Deposit Destination</span>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {profile?.bank_name || 'HDFC Bank Ltd'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      A/C: •••• {profile?.bank_account_number?.slice(-4) || '8921'} • IFSC: {profile?.bank_ifsc || 'HDFC0000123'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettlementModalOpen(false);
                    setSettingsCategory?.('banking');
                    setActiveTab?.('settings');
                  }}
                  className="text-xs font-bold text-[#0D9488] hover:underline cursor-pointer"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSettlementModalOpen(false);
                  setActiveTab?.('payment-links');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-xs text-center cursor-pointer"
              >
                Create Payment Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSettlementModalOpen(false);
                  setActiveTab?.('reports');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
              >
                View Statements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TRANSACTION DETAIL ───────────────────────────── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedTx(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-5 h-5 text-[#0D9488]" />
                <h3 className="text-base font-bold text-slate-900">Transaction Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedTx.id}</span>
              </div>
              {selectedTx.utr && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Bank UTR</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.utr}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Settled Amount</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">{formatINR(selectedTx.amount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={selectedTx.status} />
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payer / Source</span>
                <span className="font-semibold text-slate-800">{selectedTx.customer_name || 'Customer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Timestamp</span>
                <span className="text-slate-700">{fmtDate(selectedTx.created_at)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all text-center cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function ReceiptIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17V7" />
    </svg>
  );
}