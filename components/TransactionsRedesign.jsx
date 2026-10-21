'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Building2,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
  Plus,
  Loader2,
  ArrowUpRight,
  Eye,
  CreditCard,
  QrCode,
  Zap,
  Mail,
  HelpCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TransactionsRedesign({
  profile = {},
  orders = [],
  onRefresh,
  setActiveTab,
  onProfileUpdate
}) {
  // ── State Management ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'settled', 'processing', 'failed'
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', 'yesterday', '7days', 'mtd', 'all'
  const [railFilter, setRailFilter] = useState('all'); // 'all', 'upi', 'imps', 'web3'
  const [amountFilter, setAmountFilter] = useState('all'); // 'all', 'micro', 'standard', 'high'
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Popups
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Refund Tracker States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundUtr, setRefundUtr] = useState('');
  const [refundReason, setRefundReason] = useState('Customer requested cancellation');
  const [refundNotifyCustomer, setRefundNotifyCustomer] = useState(true);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState(null);
  const [refundError, setRefundError] = useState(null);
  const [refundNotes, setRefundNotes] = useState('');

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bank_name: profile?.bank_name || '',
    bank_account_number: profile?.bank_account_number || '',
    bank_account_number_confirm: profile?.bank_account_number || '',
    bank_ifsc: profile?.bank_ifsc || '',
    bank_account_name: profile?.bank_account_name || profile?.owner_name || profile?.business_name || ''
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankSuccess, setBankSuccess] = useState(false);

  // ── Copy Helper ───────────────────────────────────────────────
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Order Status Management (Mark as Paid / Unpaid) ─────────────
  const [orderStatusBusy, setOrderStatusBusy] = useState(false);
  const [orderStatusMsg, setOrderStatusMsg] = useState('');

  const handleUpdateOrderStatus = async (orderId, action) => {
    if (!orderId || orderStatusBusy) return;
    setOrderStatusBusy(true);
    setOrderStatusMsg('');
    try {
      const apiKey = profile?.api_key
        ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key
        : (profile?.api_key || '');

      const res = await fetch('/api/merchant/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          orderId,
          action,
          utr: selectedOrder?.customer_utr || selectedOrder?.utr
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setOrderStatusMsg(data.message || `Order marked as ${action === 'verify' ? 'Paid' : 'Unpaid'}`);
      if (data.order && selectedOrder) {
        setSelectedOrder(prev => ({
          ...prev,
          status: data.order.status,
          utr: data.order.utr,
          customer_utr: data.order.customer_utr || prev?.customer_utr,
          verified_at: data.order.verified_at
        }));
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setOrderStatusMsg(err.message);
    } finally {
      setOrderStatusBusy(false);
    }
  };

  // ── Outbound Refund Logging (Direct UPI Model) ───────────────
  const handleLogRefund = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!refundOrder || refundLoading) return;

    const cleanUtr = (refundUtr || '').trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setRefundError('Please enter a valid outbound 12-digit UPI / IMPS UTR from your bank app.');
      return;
    }

    setRefundLoading(true);
    setRefundError(null);
    setRefundSuccessMsg(null);

    try {
      const apiKey = profile?.api_key
        ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key
        : (profile?.api_key || '');

      const parsedAmount = parseFloat(refundAmount) || parseFloat(refundOrder.amount) || 0;

      const res = await fetch('/api/merchant/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          orderId: refundOrder.id,
          action: 'refund',
          refundAmount: parsedAmount,
          refundUtr: cleanUtr,
          refundReason: (refundReason + (refundNotes ? ` - Notes: ${refundNotes}` : '')).trim(),
          refundNotifyCustomer
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record refund');
      }

      setRefundSuccessMsg(data.message || `Refund logged successfully! Transaction marked as ${parsedAmount >= (refundOrder.amount || 0) ? 'Refunded' : 'Partially Refunded'}.`);

      if (selectedOrder && selectedOrder.id === refundOrder.id) {
        setSelectedOrder(prev => ({
          ...prev,
          status: data.order?.status || (parsedAmount >= (refundOrder.amount || 0) ? 'refunded' : 'partially_refunded'),
          refund_utr: cleanUtr,
          refund_reason: refundReason
        }));
      }

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => {
        setShowRefundModal(false);
        setRefundSuccessMsg(null);
        setRefundError(null);
      }, 1600);
    } catch (err) {
      setRefundError(err.message || 'Error recording refund');
    } finally {
      setRefundLoading(false);
    }
  };

  // ── Time Filter Helper ────────────────────────────────────────
  const isWithinTimeRange = (dateStr, range) => {
    if (!dateStr) return true;
    if (range === 'all') return true;

    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
      return date >= startOfToday;
    }
    if (range === 'yesterday') {
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      return date >= startOfYesterday && date < startOfToday;
    }
    if (range === '7days') {
      const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= sevenDaysAgo;
    }
    if (range === 'mtd') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth;
    }
    return true;
  };

  // ── Filtered Orders ───────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Time filter
      if (!isWithinTimeRange(order.created_at, timeFilter)) return false;

      // 2. Status tab filter
      if (statusTab === 'settled' && !(order.status === 'verified' || order.status === 'paid')) return false;
      if (statusTab === 'processing' && order.status !== 'pending') return false;
      if (statusTab === 'failed' && !(order.status === 'rejected' || order.status === 'failed' || order.status === 'expired')) return false;

      // 3. Rail filter
      if (railFilter !== 'all') {
        const app = (order.upi_app || order.method || '').toLowerCase();
        if (railFilter === 'upi' && (app.includes('imps') || app.includes('crypto') || app.includes('web3') || app.includes('bank'))) return false;
        if (railFilter === 'imps' && !app.includes('imps') && !app.includes('bank')) return false;
        if (railFilter === 'web3' && !app.includes('crypto') && !app.includes('web3') && !app.includes('polygon') && !app.includes('usdt')) return false;
      }

      // 4. Amount filter
      const amt = Number(order.amount) || 0;
      if (amountFilter === 'micro' && amt >= 1000) return false;
      if (amountFilter === 'standard' && (amt < 1000 || amt > 25000)) return false;
      if (amountFilter === 'high' && amt <= 25000) return false;

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const id = (order.id || '').toLowerCase();
        const orderId = (order.order_id || '').toLowerCase();
        const utr = (order.utr || '').toLowerCase();
        const name = (order.customer_name || '').toLowerCase();
        const phone = (order.customer_phone || '').toLowerCase();
        const vpa = (order.vpa || '').toLowerCase();
        const note = (order.note || '').toLowerCase();
        const app = (order.upi_app || '').toLowerCase();

        return (
          id.includes(q) ||
          orderId.includes(q) ||
          utr.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          vpa.includes(q) ||
          note.includes(q) ||
          app.includes(q)
        );
      }

      return true;
    });
  }, [orders, timeFilter, statusTab, railFilter, amountFilter, searchQuery]);

  // ── KPI Pillar Calculations ───────────────────────────────────
  const kpiMetrics = useMemo(() => {
    // Orders in current timeframe
    const timeScopedOrders = orders.filter(o => isWithinTimeRange(o.created_at, timeFilter));
    const verifiedOrders = timeScopedOrders.filter(o => o.status === 'verified' || o.status === 'paid');

    const totalVolume = verifiedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const successfulTxns = verifiedOrders.length;
    const totalTxns = timeScopedOrders.length;
    const conversionRate = totalTxns > 0 ? ((successfulTxns / totalTxns) * 100).toFixed(1) : '100';

    // Yesterday Volume calculation for delta
    const yesterdayOrders = orders.filter(o => isWithinTimeRange(o.created_at, 'yesterday'));
    const yesterdayVerified = yesterdayOrders.filter(o => o.status === 'verified' || o.status === 'paid');
    const yesterdayVolume = yesterdayVerified.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    let growthDelta = '+0.0%';
    if (yesterdayVolume > 0 && totalVolume > 0) {
      const pct = (((totalVolume - yesterdayVolume) / yesterdayVolume) * 100).toFixed(1);
      growthDelta = pct >= 0 ? `+${pct}%` : `${pct}%`;
    } else if (totalVolume > 0) {
      growthDelta = '+100%';
    }

    return {
      totalVolume,
      settledVolume: totalVolume, // 100% direct settlement
      successfulTxns,
      totalTxns,
      conversionRate,
      growthDelta
    };
  }, [orders, timeFilter]);

  // ── Status Counts for Tabs ────────────────────────────────────
  const statusCounts = useMemo(() => {
    const timeScoped = orders.filter(o => isWithinTimeRange(o.created_at, timeFilter));
    const all = timeScoped.length;
    const settled = timeScoped.filter(o => o.status === 'verified' || o.status === 'paid').length;
    const processing = timeScoped.filter(o => o.status === 'pending').length;
    const failed = timeScoped.filter(o => o.status === 'rejected' || o.status === 'failed' || o.status === 'expired').length;

    return { all, settled, processing, failed };
  }, [orders, timeFilter]);

  // ── Pagination Calculation ────────────────────────────────────
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusTab('all');
    setTimeFilter('all');
    setRailFilter('all');
    setAmountFilter('all');
    setCurrentPage(1);
  };

  // ── Export CSV Statement ──────────────────────────────────────
  const handleExportStatement = () => {
    if (filteredOrders.length === 0) {
      alert('No transactions found to export.');
      return;
    }

    const headers = [
      'Order / Transaction ID',
      'Merchant Ref',
      'Date',
      'Time',
      'Amount (INR)',
      'Customer Name',
      'Customer Phone',
      'Customer VPA',
      'Payment Rail',
      'Bank Ref / UTR',
      'Status'
    ];

    const rows = filteredOrders.map(o => {
      const dt = o.created_at ? new Date(o.created_at) : new Date();
      return [
        `"${(o.id || o.order_id || '').replace(/"/g, '""')}"`,
        `"${(o.external_ref || 'N/A').replace(/"/g, '""')}"`,
        dt.toLocaleDateString('en-IN'),
        dt.toLocaleTimeString('en-IN'),
        o.amount || '0',
        `"${(o.customer_name || 'Customer').replace(/"/g, '""')}"`,
        `"${(o.customer_phone || '').replace(/"/g, '""')}"`,
        `"${(o.vpa || '').replace(/"/g, '""')}"`,
        `"${(o.upi_app || 'UPI').replace(/"/g, '""')}"`,
        `"${(o.utr || 'N/A').replace(/"/g, '""')}"`,
        o.status || 'pending'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MyMobPay_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Email Monthly Statement via SendPulse Handler ─────────────
  const [emailingStatement, setEmailingStatement] = useState(false);

  const handleEmailStatement = async () => {
    if (!profile?.id) {
      alert('Merchant profile not found.');
      return;
    }
    setEmailingStatement(true);
    try {
      const res = await fetch('/api/merchant/statement/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: profile.id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          toEmail: profile.email || '',
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to email monthly statement');
      alert(`✅ Monthly statement successfully dispatched to ${data.recipientEmail || 'your email'} via SendPulse!`);
    } catch (err) {
      alert(`❌ Failed to send statement: ${err.message}`);
    } finally {
      setEmailingStatement(false);
    }
  };

  // ── Save Bank Account Handler ─────────────────────────────────
  const handleBankSave = async (e) => {
    if (e) e.preventDefault();
    setBankError(null);
    setBankSuccess(false);

    if (!bankForm.bank_name.trim()) return setBankError('Bank name is required.');
    if (!bankForm.bank_account_name.trim()) return setBankError('Account holder name is required.');
    if (!bankForm.bank_account_number.trim()) return setBankError('Account number is required.');
    if (bankForm.bank_account_number !== bankForm.bank_account_number_confirm) {
      return setBankError('Account numbers do not match.');
    }
    if (!bankForm.bank_ifsc.trim()) return setBankError('IFSC code is required.');
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.bank_ifsc.trim().toUpperCase())) {
      return setBankError('Invalid IFSC code format (e.g. HDFC0001234).');
    }

    setBankSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankForm.bank_name.trim(),
          bank_account_number: bankForm.bank_account_number.trim(),
          bank_account_name: bankForm.bank_account_name.trim(),
          bank_ifsc: bankForm.bank_ifsc.trim().toUpperCase(),
          enable_bank_transfer: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setBankSuccess(true);
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          bank_name: bankForm.bank_name.trim(),
          bank_account_number: bankForm.bank_account_number.trim(),
          bank_account_name: bankForm.bank_account_name.trim(),
          bank_ifsc: bankForm.bank_ifsc.trim().toUpperCase(),
          enable_bank_transfer: true
        });
      }
      setTimeout(() => {
        setShowAddBankModal(false);
        setBankSuccess(false);
      }, 1200);
    } catch (err) {
      setBankError(err.message || 'Failed to save bank details.');
    } finally {
      setBankSaving(false);
    }
  };

  // ── Helper to Get App Pill Info ───────────────────────────────
  const getAppPill = (order) => {
    const app = (order.upi_app || order.method || '').toLowerCase();
    if (app.includes('phonepe')) {
      return {
        label: 'UPI (PhonePe)',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: 'qr_code',
        identifier: order.vpa || 'customer@ybl'
      };
    }
    if (app.includes('gpay') || app.includes('google')) {
      return {
        label: 'UPI (Google Pay)',
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: 'contactless',
        identifier: order.vpa || 'customer@okaxis'
      };
    }
    if (app.includes('paytm')) {
      return {
        label: 'UPI QR (Paytm)',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        icon: 'qr_code_scanner',
        identifier: order.vpa || 'customer@paytm'
      };
    }
    if (app.includes('cred')) {
      return {
        label: 'UPI QR (CRED)',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        icon: 'qr_code',
        identifier: order.vpa || 'customer@axis'
      };
    }
    if (app.includes('imps') || app.includes('bank') || app.includes('neft')) {
      return {
        label: 'IMPS Direct Rail',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: 'swap_horiz',
        identifier: profile?.bank_name
          ? `${profile.bank_name}${profile?.bank_account_number ? ` ••••${profile.bank_account_number.slice(-4)}` : ''}`
          : 'Direct IMPS'
      };
    }
    if (app.includes('crypto') || app.includes('web3') || app.includes('polygon') || app.includes('usdt')) {
      return {
        label: 'Web3 Smart Collect',
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        icon: 'token',
        identifier: 'Polygon • 0x4b...392F'
      };
    }
    return {
      label: 'UPI Direct Rail',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'qr_code_2',
      identifier: order.vpa || profile?.upi_id || 'Instant Settlement'
    };
  };

  const hasBankAccount = !!(profile?.bank_account_number && profile?.bank_name);

  return (
    <div className="flex flex-col gap-6 max-w-[1520px] mx-auto w-full text-slate-800 animate-fadeIn">
      {/* ═══════════════════════════════════════════════════════════
         1. TOP CONTEXT & ACTION BAR
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0c2340] tracking-tight">
              Transactions
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Ingestion Rail
            </span>
          </div>
          <p className="text-xs lg:text-sm text-slate-500 max-w-2xl font-medium">
            Real-time payment audit trail across UPI QR, IMPS Direct, and Web3 rails with instant direct-to-bank settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            type="button"
            className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all duration-150 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            {showFilters ? 'Hide Rails Filter' : 'Filter Rails'}
          </button>
          <button
            onClick={handleEmailStatement}
            disabled={emailingStatement}
            type="button"
            className="bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 transition-all duration-150 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
            title="Dispatch monthly account statement to registered email via SendPulse"
          >
            {emailingStatement ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
            {emailingStatement ? 'Sending...' : 'Email Statement'}
          </button>
          <button
            onClick={handleExportStatement}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 transition-all duration-150 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Statement (CSV/XLS)
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         2. KPI METRIC STRIP (2x2 on Mobile, 4x1 on Desktop)
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Total Volume */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 truncate">
              Total Volume
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4 flex flex-col gap-0.5 sm:gap-1">
            <span className="text-lg sm:text-2xl font-extrabold text-[#0c2340] tracking-tight font-mono truncate">
              ₹ {kpiMetrics.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {kpiMetrics.growthDelta}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">vs T-1</span>
            </div>
          </div>
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-blue-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
        </div>

        {/* Metric 2: Settled Volume */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 truncate">
              Settled to Bank
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4 flex flex-col gap-0.5 sm:gap-1">
            <span className="text-lg sm:text-2xl font-extrabold text-[#0c2340] tracking-tight font-mono truncate">
              ₹ {kpiMetrics.settledVolume.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold truncate">
                Direct T+0
              </span>
            </div>
          </div>
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-emerald-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
        </div>

        {/* Metric 3: Successful Conversions */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 truncate">
              Successful Inflow
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4 flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-extrabold text-[#0c2340] tracking-tight font-mono truncate">
                {kpiMetrics.successfulTxns.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">txns</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold truncate">
                {kpiMetrics.conversionRate}% Conv.
              </span>
            </div>
          </div>
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-indigo-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
        </div>

        {/* Metric 4: Settlement Velocity */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 truncate">
              Credit Velocity
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4 flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-extrabold text-[#0c2340] tracking-tight font-mono truncate">
                142
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">ms</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold truncate">
                T+0 Direct
              </span>
            </div>
          </div>
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-amber-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         3. DYNAMIC FILTER CONTROL MATRIX
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4 relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-500/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
        {/* Status Selection Tabs & Time Quick Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/70 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => { setStatusTab('all'); setCurrentPage(1); }}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusTab === 'all'
                  ? 'bg-white text-[#0c2340] shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              All Logs
              <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                {statusCounts.all}
              </span>
            </button>

            <button
              onClick={() => { setStatusTab('settled'); setCurrentPage(1); }}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusTab === 'settled'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Auto-Settled
              <span className="bg-emerald-100/70 text-emerald-800 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                {statusCounts.settled}
              </span>
            </button>

            <button
              onClick={() => { setStatusTab('processing'); setCurrentPage(1); }}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusTab === 'processing'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Processing
              <span className="bg-blue-100/70 text-blue-800 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                {statusCounts.processing}
              </span>
            </button>

            <button
              onClick={() => { setStatusTab('failed'); setCurrentPage(1); }}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusTab === 'failed'
                  ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Failed
              <span className="bg-red-100/70 text-red-800 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                {statusCounts.failed}
              </span>
            </button>
          </div>

          {/* Time Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs font-bold text-[#0c2340] focus:outline-none cursor-pointer pr-1"
              >
                <option value="today">Today (Real-time)</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="mtd">Month to Date</option>
                <option value="all">All Time History</option>
              </select>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200/70 transition-colors"
                title="Refresh Transactions"
                type="button"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Deep Query Search & Rail/Amount Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-6 relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Txn ID (txn_8849...), Bank UTR / RRN, Customer VPA, Order ID..."
              type="text"
              className="w-full h-11 pl-10 pr-10 bg-slate-50 hover:bg-slate-100/50 text-[#0c2340] placeholder:text-slate-400 text-xs font-medium rounded-xl border border-slate-200/80 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <div className="h-11 px-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 w-full">
                <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs text-slate-400 font-medium shrink-0">Rail:</span>
                <select
                  value={railFilter}
                  onChange={(e) => { setRailFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs font-bold text-[#0c2340] focus:outline-none cursor-pointer w-full truncate"
                >
                  <option value="all">All Rails (UPI, IMPS, Web3)</option>
                  <option value="upi">UPI QR (PhonePe / GPay / Paytm)</option>
                  <option value="imps">IMPS Direct Transfer</option>
                  <option value="web3">Web3 Smart Collect (USDT Polygon)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <div className="h-11 px-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-slate-700 w-full">
                <span className="text-xs font-bold text-slate-400 shrink-0">₹</span>
                <span className="text-xs text-slate-400 font-medium shrink-0">Amount:</span>
                <select
                  value={amountFilter}
                  onChange={(e) => { setAmountFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs font-bold text-[#0c2340] focus:outline-none cursor-pointer w-full truncate"
                >
                  <option value="all">All Volumes</option>
                  <option value="micro">Micro (&lt; ₹1,000)</option>
                  <option value="standard">Standard (₹1,000 - ₹25,000)</option>
                  <option value="high">High Value (&gt; ₹25,000)</option>
                </select>
              </div>
            </div>

            <button
              onClick={resetFilters}
              title="Reset All Filters"
              type="button"
              className="h-11 w-11 flex-shrink-0 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200/80 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         4. SETTLEMENT INTEGRITY ASSURANCE STRIP
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-slate-100/80 border border-slate-200/80 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800 shadow-xs relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#0c2340] flex items-center gap-1.5">
              Direct Settlement Escrow-Free Rail
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {hasBankAccount ? (
                <>
                  All cleared collections are settled in real-time directly into <strong className="text-slate-800 font-bold">{profile.bank_name} A/C ending in {(profile.bank_account_number || '').slice(-4)}</strong> via NPCI IMPS rail. Escrow lockup: <span className="text-emerald-700 font-bold">0% (Pure Passthrough)</span>.
                </>
              ) : (
                <>
                  Direct settlement active via UPI ID: <strong className="text-slate-800 font-bold">{profile?.upi_id || 'Configured in Settings'}</strong>. Escrow lockup: <span className="text-emerald-700 font-bold">0% (Pure Passthrough)</span>.
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          {!hasBankAccount && (
            <button
              onClick={() => {
                setBankForm({
                  bank_name: profile?.bank_name || '',
                  bank_account_number: profile?.bank_account_number || '',
                  bank_account_number_confirm: profile?.bank_account_number || '',
                  bank_ifsc: profile?.bank_ifsc || '',
                  bank_account_name: profile?.bank_account_name || profile?.owner_name || profile?.business_name || ''
                });
                setShowAddBankModal(true);
              }}
              type="button"
              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bank Account
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            NPCI Validated
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         5. TRANSACTION LEDGER TABLE COMPONENT
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="bg-slate-50 border-b border-slate-200/80">
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-5 text-left font-extrabold">ORDER &amp; TRANSACTION ID</th>
                <th className="py-3.5 px-4 text-left font-extrabold">RAIL</th>
                <th className="py-3.5 px-4 text-left font-extrabold">CUSTOMER</th>
                <th className="py-3.5 px-4 text-left font-extrabold">BANK REF / UTR</th>
                <th className="py-3.5 px-4 text-right font-extrabold">AMOUNT RECEIVED</th>
                <th className="py-3.5 px-5 text-right font-extrabold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const pill = getAppPill(order);
                  const isSettled = order.status === 'verified' || order.status === 'paid';
                  const isProcessing = order.status === 'pending';
                  const isFailed = order.status === 'rejected' || order.status === 'failed' || order.status === 'expired';

                  const dateStr = order.created_at ? new Date(order.created_at) : new Date();
                  const timeFormatted = dateStr.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  const dateFormatted = dateStr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                  const canonicalId = order.id || order.order_id || '';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Order & Transaction ID */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#0c2340] group-hover:text-blue-600 transition-colors">
                            <span>{canonicalId}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(canonicalId, `id_${order.id}`);
                              }}
                              className="text-slate-300 hover:text-slate-600 p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy ID"
                              type="button"
                            >
                              {copiedKey === `id_${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {order.external_ref && order.external_ref !== canonicalId && !order.external_ref.startsWith('pl_') && (
                            <span className="text-[11px] font-mono text-slate-400 font-medium truncate max-w-[200px]" title={`Merchant Ref: ${order.external_ref}`}>
                              Ref: {order.external_ref}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {dateFormatted}, {timeFormatted}
                          </span>
                        </div>
                      </td>

                      {/* Rail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${pill.bg} ${pill.text} flex items-center justify-center font-bold text-xs flex-shrink-0 border border-slate-200/40 shadow-2xs`}>
                            <span className="material-symbols-outlined text-base">{pill.icon}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0c2340]">
                              {pill.label}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                              {pill.identifier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#0c2340] truncate max-w-[150px]">
                            {order.customer_name || 'Direct Customer'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {order.customer_phone ? `+91 ${order.customer_phone.slice(0, 5)} ••••${order.customer_phone.slice(-2)}` : order.customer_email || 'Verified Inflow'}
                          </span>
                        </div>
                      </td>

                      {/* Bank Ref / UTR */}
                      <td className="py-3.5 px-4">
                        {order.utr ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#0c2340]">
                            <span>UTR: {order.utr}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(order.utr, `utr_${order.id}`);
                              }}
                              className="text-slate-300 hover:text-slate-600 p-0.5 cursor-pointer"
                              title="Copy UTR"
                              type="button"
                            >
                              {copiedKey === `utr_${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : order.customer_utr ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-800 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200/90 w-fit">
                              <span>UTR: {order.customer_utr}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(order.customer_utr, `cust_utr_${order.id}`);
                                }}
                                className="text-amber-500 hover:text-amber-800 p-0.5 cursor-pointer"
                                title="Copy Customer Submitted UTR"
                                type="button"
                              >
                                {copiedKey === `cust_utr_${order.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              User Submitted UTR
                            </span>
                          </div>
                        ) : isProcessing ? (
                          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-mono font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                            <span>Awaiting Bank RRN</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono font-medium">—</span>
                        )}
                      </td>

                      {/* Amount Received */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-extrabold text-sm text-[#0c2340]">
                          ₹ {Number(order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-bold font-mono flex items-center justify-end gap-0.5 ${
                          isSettled ? 'text-emerald-600' : isProcessing ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                          {isSettled ? 'Direct (100%)' : isProcessing ? 'In-Flight' : 'Unpaid'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-right">
                        {isSettled && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Auto-Settled
                          </div>
                        )}
                        {isProcessing && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
                            <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                            Processing
                          </div>
                        )}
                        {isFailed && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/70 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Failed
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#0c2340] mb-1">No Transactions Found</p>
                      <p className="text-xs text-slate-400 mb-4 text-center">
                        No transactions match your current search and filter settings. Try clearing the filters or creating a payment link.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetFilters}
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Clear Filters
                        </button>
                        {setActiveTab && (
                          <button
                            onClick={() => setActiveTab('payment-links')}
                            type="button"
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            Create Payment Link
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Transactions Card View (Visible only on md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order) => {
              const pill = getAppPill(order);
              const isSettled = order.status === 'verified' || order.status === 'paid';
              const isProcessing = order.status === 'pending';
              const isFailed = order.status === 'rejected' || order.status === 'failed' || order.status === 'expired';
              const dateStr = order.created_at ? new Date(order.created_at) : new Date();
              const timeFormatted = dateStr.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const dateFormatted = dateStr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              const canonicalId = order.id || order.order_id || '';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="p-3.5 sm:p-4 flex flex-col gap-2.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                >
                  {/* Top Bar: Order ID + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#0c2340] truncate max-w-[160px] sm:max-w-[200px]">
                        {canonicalId}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(canonicalId, `id_${order.id}`);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md shrink-0"
                        title="Copy ID"
                        type="button"
                      >
                        {copiedKey === `id_${order.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isSettled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Auto-Settled
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                          <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                          Processing
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Customer + Method + Amount */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#0c2340] truncate">
                        {order.customer_name || 'Direct Customer'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {order.customer_phone ? `+91 ${order.customer_phone.slice(0, 5)} ••••${order.customer_phone.slice(-2)}` : (order.customer_email || 'Verified Inflow')}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-sm text-[#0c2340]">
                        ₹ {Number(order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Rail & Timestamps */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${pill.bg} ${pill.text}`}>
                        {pill.label}
                      </span>
                      {order.utr ? (
                        <span className="text-slate-600 font-bold truncate max-w-[120px]">
                          UTR: {order.utr}
                        </span>
                      ) : order.customer_utr ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded truncate max-w-[120px]">
                          UTR: {order.customer_utr}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-slate-400 shrink-0">
                      {dateFormatted}, {timeFormatted}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 px-4 text-center text-slate-400">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No transactions found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or changing dates.</p>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
           6. PAGINATION & LEDGER FOOTER CONTROLS
           ═══════════════════════════════════════════════════════════ */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>
              Showing <strong className="text-[#0c2340] font-bold">{filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
              <strong className="text-[#0c2340] font-bold">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> of{' '}
              <strong className="text-[#0c2340] font-bold">{filteredOrders.length}</strong> transactions
            </span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                currentPage === 1
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              type="button"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  type="button"
                  className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                currentPage >= totalPages
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              type="button"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         7. TRANSACTION DETAILS MODAL
         ═══════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-extrabold text-[#0c2340]">Transaction Audit Details</h3>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedOrder.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 flex flex-col gap-3.5 sm:gap-4 text-xs overflow-y-auto flex-1">
              {/* Amount & Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Received</span>
                  <span className="text-2xl font-extrabold text-[#0c2340] font-mono mt-0.5">
                    ₹ {Number(selectedOrder.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                  {selectedOrder.status === 'verified' || selectedOrder.status === 'paid' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auto-Settled
                    </span>
                  ) : selectedOrder.status === 'pending' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Processing
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/80 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Order ID</span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-1">
                    {selectedOrder.order_id || selectedOrder.id}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Bank UTR / Ref</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {selectedOrder.utr || 'Awaiting Bank UTR'}
                    </span>
                    {selectedOrder.utr && (
                      <button
                        onClick={() => handleCopy(selectedOrder.utr, 'modal_utr')}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        type="button"
                        title="Copy UTR"
                      >
                        {copiedKey === 'modal_utr' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  {selectedOrder.customer_utr && (
                    <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-[10px] text-amber-700 font-bold">Customer UTR:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-amber-800">{selectedOrder.customer_utr}</span>
                        <button
                          onClick={() => handleCopy(selectedOrder.customer_utr, 'modal_cust_utr')}
                          className="text-amber-500 hover:text-amber-800 p-0.5 cursor-pointer"
                          type="button"
                          title="Copy Customer UTR"
                        >
                          {copiedKey === 'modal_cust_utr' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Customer Name</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">
                    {selectedOrder.customer_name || 'Direct Payer'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Customer Phone</span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-1">
                    {selectedOrder.customer_phone || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Rail / App</span>
                  <span className="text-xs font-bold text-slate-800 mt-1">
                    {selectedOrder.upi_app || selectedOrder.method || 'Universal UPI'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Timestamp</span>
                  <span className="text-xs font-mono text-slate-700 mt-1">
                    {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Full Lifecycle Timeline & Verification Method */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Transaction Audit Timeline
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    (selectedOrder.status === 'verified' || selectedOrder.status === 'paid')
                      ? ((selectedOrder.utr || '').toUpperCase().startsWith('MANUAL_')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                      : selectedOrder.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {(selectedOrder.status === 'verified' || selectedOrder.status === 'paid')
                      ? ((selectedOrder.utr || '').toUpperCase().startsWith('MANUAL_') ? 'Manual Override' : 'Auto-Verified (Bank Rail)')
                      : selectedOrder.status === 'pending'
                      ? 'In-Flight'
                      : 'Closed'}
                  </span>
                </div>

                <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Order Created */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-800">Checkout Initiated</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Dynamic UPI checkout link &amp; QR generated</p>
                  </div>

                  {/* Step 2: Customer Activity */}
                  <div className="relative">
                    <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      selectedOrder.customer_utr || selectedOrder.utr ? 'bg-emerald-500' : 'bg-amber-400'
                    }`} />
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-800">Customer UPI Transfer</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedOrder.customer_vpa || 'Universal UPI'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {selectedOrder.customer_utr
                        ? `Customer entered reference: ${selectedOrder.customer_utr}`
                        : 'Customer scanned QR in UPI app (GPay/PhonePe/Paytm)'}
                    </p>
                  </div>

                  {/* Step 3: Reconciliation Status */}
                  <div className="relative">
                    <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      (selectedOrder.status === 'verified' || selectedOrder.status === 'paid')
                        ? 'bg-emerald-600'
                        : selectedOrder.status === 'pending'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`} />
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-800">
                        {(selectedOrder.status === 'verified' || selectedOrder.status === 'paid')
                          ? 'Settled into Bank Account'
                          : selectedOrder.status === 'pending'
                          ? 'Awaiting Bank Notification'
                          : 'Payment Terminated'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedOrder.verified_at
                          ? new Date(selectedOrder.verified_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                          : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {(selectedOrder.status === 'verified' || selectedOrder.status === 'paid')
                        ? ((selectedOrder.utr || '').toUpperCase().startsWith('MANUAL_')
                            ? 'Manually verified by merchant with bank confirmation'
                            : `Auto-matched via direct bank SMS/email notification with UTR ${selectedOrder.utr}`)
                        : selectedOrder.status === 'pending'
                        ? 'Listening for bank webhook/email credit alert'
                        : 'Session expired or cancelled by customer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settlement Routing */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Direct-to-Bank Pure Passthrough
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {hasBankAccount
                    ? `Payment routed in real-time to ${profile.bank_name} ending in ${(profile.bank_account_number || '').slice(-4)} via NPCI rail with zero intermediary escrow.`
                    : `Payment verified and confirmed directly to your primary UPI ID (${profile?.upi_id || 'merchant'}).`}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
              {orderStatusMsg && (
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-center ${
                  orderStatusMsg.toLowerCase().includes('failed') || orderStatusMsg.toLowerCase().includes('error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {orderStatusMsg}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    const receiptText = `MyMobPay Receipt\nOrder: ${selectedOrder.order_id || selectedOrder.id}\nAmount: ₹${selectedOrder.amount}\nUTR: ${selectedOrder.utr || selectedOrder.customer_utr || 'Pending'}\nStatus: ${selectedOrder.status}`;
                    handleCopy(receiptText, 'modal_receipt');
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  type="button"
                >
                  {copiedKey === 'modal_receipt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Trail
                </button>

                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'pending' ? (
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'verify')}
                      disabled={orderStatusBusy}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                      type="button"
                    >
                      {orderStatusBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Mark as Paid
                    </button>
                  ) : (selectedOrder.status === 'verified' || selectedOrder.status === 'paid') ? (
                    <>
                      <button
                        onClick={() => {
                          setRefundOrder(selectedOrder);
                          setRefundAmount(selectedOrder.amount || '');
                          setRefundUtr('');
                          setRefundReason('Customer requested cancellation');
                          setShowRefundModal(true);
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        type="button"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Log Refund
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'unpaid')}
                        disabled={orderStatusBusy}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                        type="button"
                      >
                        {orderStatusBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Mark as Unpaid
                      </button>
                    </>
                  ) : null}

                  <button
                    onClick={() => { setSelectedOrder(null); setOrderStatusMsg(''); }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         8. ADD BANK ACCOUNT MODAL
         ═══════════════════════════════════════════════════════════ */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-extrabold text-[#0c2340]">Add Bank Account</h3>
                  <span className="text-xs text-slate-400 font-medium">Enable IMPS/RTGS direct settlement rail</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBankSave} className="p-6 flex flex-col gap-4 text-xs">
              {bankError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {bankError}
                </div>
              )}
              {bankSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Bank account saved successfully!
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                  value={bankForm.bank_name}
                  onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Name as registered with bank"
                  value={bankForm.bank_account_name}
                  onChange={e => setBankForm({ ...bankForm, bank_account_name: e.target.value })}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Account Number</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter account number"
                    value={bankForm.bank_account_number}
                    onChange={e => setBankForm({ ...bankForm, bank_account_number: e.target.value })}
                    className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Confirm Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Re-enter account number"
                    value={bankForm.bank_account_number_confirm}
                    onChange={e => setBankForm({ ...bankForm, bank_account_number_confirm: e.target.value })}
                    className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Bank IFSC Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={bankForm.bank_ifsc}
                  onChange={e => setBankForm({ ...bankForm, bank_ifsc: e.target.value.toUpperCase() })}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Security Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero Escrow: Collections credit directly to this account via NPCI IMPS rails.</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {bankSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Bank Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          OUTBOUND REFUND TRACKER MODAL (DIRECT UPI MODEL)
          ══════════════════════════════════════════════════════════ */}
      {showRefundModal && refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 overflow-hidden max-h-[92vh] overflow-y-auto animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Record Outbound Refund</h3>
                  <p className="text-xs text-slate-500">Order #{refundOrder.id?.slice(0, 10)}... • Direct UPI Tracking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundError(null);
                  setRefundSuccessMsg(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct UPI Zero-Custody Disclaimer */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900">
                <span className="font-bold text-amber-950 block">Direct UPI Model (Zero Custody Platform)</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  MyMobPay never holds, pools, or automatically debits merchant funds. To process this refund, transfer the money directly from your UPI app (Google Pay, PhonePe, Paytm, or Netbanking) to the customer’s UPI ID. Then record your outbound bank UTR below for accounting and dispute protection.
                </p>
              </div>
            </div>

            {/* Original Order Summary Card */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Collection</span>
                <p className="font-bold text-slate-800 text-sm">₹{Number(refundOrder.amount || 0).toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500">
                  Customer: <span className="font-medium text-slate-700">{refundOrder.customer_name || refundOrder.payer_vpa || refundOrder.customer_phone || 'Direct Payer'}</span>
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inbound UTR</span>
                <p className="font-mono font-semibold text-slate-700 text-xs">{refundOrder.utr || refundOrder.customer_utr || 'Auto-Verified'}</p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Verified in Bank
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogRefund} className="space-y-3.5 text-xs">
              {refundError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{refundError}</span>
                </div>
              )}
              {refundSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{refundSuccessMsg}</span>
                </div>
              )}

              {/* Refund Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Refund Amount (₹)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {Number(refundAmount) < Number(refundOrder.amount) ? 'Partial Refund' : 'Full Refund'}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={refundOrder.amount}
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                    className="w-full h-10 pl-8 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Outbound UTR (Required) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Outbound Bank / UPI UTR (12 Digits) *</span>
                  <span className="text-[10px] text-rose-600 font-semibold">From your bank debit SMS/receipt</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 429188401923"
                  value={refundUtr}
                  onChange={(e) => setRefundUtr(e.target.value.toUpperCase())}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Reason for Refund</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Duplicate payment by customer">Duplicate payment by customer</option>
                  <option value="Product out of stock / service unavailable">Product out of stock / service unavailable</option>
                  <option value="Disputed transaction / quality issue">Disputed transaction / quality issue</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Internal Audit & Dispute Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="e.g. Transferred via PhonePe UPI to customer vpa buyer@okhdfcbank"
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              {/* Customer Notification Checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={refundNotifyCustomer}
                  onChange={(e) => setRefundNotifyCustomer(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Trigger webhook & customer notification (Email/SMS) for this refund
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading || !refundUtr}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm shadow-rose-500/20 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {refundLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Recording Refund...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Save & Record Refund
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
