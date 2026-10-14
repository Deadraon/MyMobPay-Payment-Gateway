'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'react-qr-code';
import {
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldCheck,
  Sparkles,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  X,
  Share2,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  Zap,
  QrCode as QrIcon,
  RotateCcw
} from 'lucide-react';
import { generateOrderId } from '@/lib/orderId';

// No default starter links — only show links the merchant actually created
const DEFAULT_INITIAL_LINKS = [];

export default function PaymentLinksRedesign({
  profile = {},
  orders = [],
  payLinkHistory = [],
  setPayLinkHistory,
  setActiveTab,
}) {
  // Form input states (clean and blank by default)
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [refCode, setRefCode] = useState(() => generateOrderId());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [allowPartial, setAllowPartial] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [railUpi, setRailUpi] = useState(true);
  const [railImps, setRailImps] = useState(true);
  const [railCrypto, setRailCrypto] = useState(false);
  const [linkType, setLinkType] = useState('shared');
  const [linkValidity, setLinkValidity] = useState('24h');
  const [customValidityMinutes, setCustomValidityMinutes] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [redirectUrl, setRedirectUrl]   = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileStudioTab, setMobileStudioTab] = useState('configure'); // 'configure' | 'preview'

  // Active generated preview link (null until user clicks generate)
  const [activeUrl, setActiveUrl] = useState('');
  const [activeLinkId, setActiveLinkId] = useState('');
  const [generatedLinkData, setGeneratedLinkData] = useState(null);

  // Filter and Search states
  const [statusFilter, setStatusFilter] = useState('All'); // All, Active, Paid, Expired, Cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Container ref for smooth scroll
  const createPanelRef = useRef(null);

  // Show Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Fetch database payment links
  const fetchDbLinks = async () => {
    if (!profile?.api_key && !profile?.id) return;
    try {
      const apiKey = profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : '';
      const res = await fetch('/api/payment-links?limit=100', {
        headers: { 'x-api-key': apiKey }
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json?.data)) {
        const mapped = json.data.map((l) => ({
          id: l.token,
          token: l.token,
          merchantId: profile?.id,
          orderId: l.order_id,
          purpose: l.title || 'Payment',
          ref: l.token,
          customerName: l.customer_name || 'Direct Customer',
          customerPhone: l.customer_phone || '--',
          amount: l.amount_in_rupees || (Number(l.amount) / 100).toFixed(2),
          status: l.status.charAt(0).toUpperCase() + l.status.slice(1),
          createdAt: l.created_at,
          expiresAt: l.expires_at,
          paidAt: l.paid_at,
          expiredAt: l.expired_at,
          cancelledAt: l.cancelled_at,
          remainingSeconds: l.remaining_seconds,
          linkType: l.link_type,
          url: l.payment_url
        }));
        if (setPayLinkHistory) setPayLinkHistory(mapped);
        return;
      }
    } catch (e) {
      console.warn('Error fetching DB links:', e);
    }
  };

  // Load merchant-scoped payment links (purge legacy un-scoped cross-account key)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('mymobpay_payment_links')) {
        localStorage.removeItem('mymobpay_payment_links');
      }

      if (!profile?.id) {
        if (setPayLinkHistory) setPayLinkHistory([]);
        return;
      }

      fetchDbLinks();
    }
  }, [profile?.id, profile?.api_key]);

  // Combine custom history with initial default links if needed (strictly merchant scoped)
  const allLinks = useMemo(() => {
    const list = Array.isArray(payLinkHistory) ? payLinkHistory : [];
    const merchantScoped = profile?.id
      ? list.filter((item) => item.merchantId === profile.id)
      : [];

    // Also include any real database orders that were created as Payment Links for this merchant
    const linkOrders = Array.isArray(orders)
      ? orders.filter(
          (o) =>
            o.merchant_id === profile?.id &&
            (o.method === 'LINK' || (o.external_ref && o.external_ref.startsWith('pl_')))
        )
      : [];

    const combined = [...merchantScoped];
    linkOrders.forEach((o) => {
      const linkId = (o.external_ref && o.external_ref.startsWith('pl_')) ? o.external_ref : `pl_${o.id}`;
      const exists = combined.some(
        (item) => item.id === linkId || item.orderId === o.id || item.ref === o.external_ref
      );
      if (!exists) {
        const host = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
        const apiKey = profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : '';
        combined.push({
          id: linkId,
          merchantId: profile?.id,
          orderId: o.id,
          purpose: o.note || 'Payment for Services',
          ref: o.external_ref || o.id,
          customerName: o.customer_name || 'Direct Customer',
          customerPhone: o.customer_phone || '--',
          amount: o.amount ? Number(o.amount).toFixed(2) : '0.00',
          status: (o.status === 'verified' || o.status === 'paid' || o.status === 'completed') ? 'Paid' : (o.status === 'failed' || o.status === 'expired') ? 'Expired' : 'Pending',
          createdAt: o.created_at || new Date().toISOString(),
          url: `${host}/pay?order_id=${encodeURIComponent(o.id)}&amount=${Number(o.amount || 0).toFixed(2)}&ref=${encodeURIComponent(o.external_ref || o.id)}&note=${encodeURIComponent(o.note || '')}`
        });
      }
    });

    // Harmonize status with real database orders if matching
    return combined.map((item) => {
      // ONLY match orders that belong specifically to this payment link by orderId or external_ref
      const matchingOrder = orders.find(
        (o) =>
          (item.orderId && o.id === item.orderId) ||
          (item.id && (o.external_ref === item.id || o.external_ref?.startsWith(item.id + ':'))) ||
          (item.ref && o.external_ref === item.ref)
      );

      if (matchingOrder) {
        const orderId = matchingOrder.id;
        let updatedUrl = item.url;
        try {
          if (updatedUrl && updatedUrl.includes('/pay?')) {
            const u = new URL(updatedUrl);
            if (!u.searchParams.has('order_id')) {
              u.searchParams.set('order_id', orderId);
              updatedUrl = u.toString();
            }
          }
        } catch {}

        if (matchingOrder.status === 'verified' || matchingOrder.status === 'completed' || matchingOrder.status === 'paid') {
          return { ...item, status: 'Paid', orderId, url: updatedUrl };
        }
        if (matchingOrder.status === 'failed' || matchingOrder.status === 'expired') {
          return { ...item, status: 'Expired', orderId, url: updatedUrl };
        }
        if (matchingOrder.status === 'pending') {
          return { ...item, status: 'Pending', orderId, url: updatedUrl };
        }
      }
      return item;
    });
  }, [payLinkHistory, profile?.id, profile?.api_key, profile?.sandbox_mode, orders]);

  // Expose global preview update helpers for compatibility with mock script
  useEffect(() => {
    window.updateLinkPreview = () => {
      const amtEl = document.getElementById('input-amount');
      const purEl = document.getElementById('input-purpose');
      const refEl = document.getElementById('input-ref');

      const amtVal = amtEl?.value || '0.00';
      const purVal = purEl?.value || 'Direct Payment';
      const refVal = refEl?.value || 'REF-GEN';

      const numAmt = parseFloat(amtVal);
      const formatted = isNaN(numAmt)
        ? '₹ 0.00'
        : '₹ ' + numAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const prevAmtEl = document.getElementById('preview-amount');
      const prevPurEl = document.getElementById('preview-purpose');
      const prevRefEl = document.getElementById('preview-ref');

      if (prevAmtEl) prevAmtEl.innerText = formatted;
      if (prevPurEl) prevPurEl.innerText = purVal;
      if (prevRefEl) prevRefEl.innerText = refVal;
    };

    window.generateMockLink = () => {
      const mockOrderId = generateOrderId();
      const host = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
      const mockAmt = amount ? parseFloat(amount) : 100;
      const mockPur = purpose.trim() || 'Payment for Services';
      const mockRef = refCode.trim() || mockOrderId;
      const newUrl = `${host}/pay?order_id=${mockOrderId}&amount=${mockAmt.toFixed(2)}&ref=${mockRef}`;
      
      setActiveUrl(newUrl);
      setActiveLinkId('pl_' + rand.slice(0, 8));
      setGeneratedLinkData({
        url: newUrl,
        id: 'pl_' + rand.slice(0, 8),
        orderId: mockOrderId,
        amount: mockAmt,
        purpose: mockPur,
        ref: mockRef,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });
      showToast('Quick demo payment link generated!');
    };
  }, []);

  // Filter links based on status tab and search query
  const filteredLinks = useMemo(() => {
    return allLinks.filter((link) => {
      // Status filter
      if (statusFilter === 'Active' && link.status !== 'Active' && link.status !== 'Pending' && link.status !== 'Processing') return false;
      if (statusFilter === 'Paid' && link.status !== 'Paid') return false;
      if (statusFilter === 'Pending' && link.status !== 'Pending' && link.status !== 'Partial') return false;
      if (statusFilter === 'Expired' && link.status !== 'Expired') return false;
      if (statusFilter === 'Cancelled' && link.status !== 'Cancelled') return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = link.id?.toLowerCase().includes(q);
        const matchesPurpose = link.purpose?.toLowerCase().includes(q);
        const matchesCustomer = link.customerName?.toLowerCase().includes(q) || link.customerPhone?.toLowerCase().includes(q);
        const matchesRef = link.ref?.toLowerCase().includes(q);
        const matchesAmt = link.amount?.toString().includes(q);
        if (!matchesId && !matchesPurpose && !matchesCustomer && !matchesRef && !matchesAmt) {
          return false;
        }
      }
      return true;
    });
  }, [allLinks, statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage) || 1;
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLinks.slice(start, start + itemsPerPage);
  }, [filteredLinks, currentPage]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    let totalAmt = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    allLinks.forEach((l) => {
      const amt = parseFloat(l.amount) || 0;
      if (l.status === 'Paid') {
        totalAmt += amt;
        paidCount++;
      } else if (l.status === 'Pending' || l.status === 'Partial') {
        pendingCount++;
      } else if (l.status === 'Expired') {
        expiredCount++;
      }
    });

    const totalLinks = paidCount + pendingCount + expiredCount;
    const avgTicket = paidCount > 0 ? Math.round(totalAmt / paidCount) : 0;
    const conversionRate = totalLinks > 0
      ? ((paidCount / totalLinks) * 100).toFixed(1)
      : '0.0';

    return {
      totalCollected: totalAmt,
      totalCount: paidCount,
      activeLinks: pendingCount,
      paidLinks: paidCount,
      expiredLinks: expiredCount,
      avgTicket,
      conversionRate,
    };
  }, [allLinks]);

  // Auto-generate random Order ID helper
  const generateRandomOrderId = () => generateOrderId();

  const handleRandomRef = () => {
    setRefCode(generateRandomOrderId());
  };

  // Copy to clipboard helper
  const copyText = (text, label = 'Link') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Share via WhatsApp
  const shareWhatsApp = (link) => {
    const text = encodeURIComponent(
      `Hello ${link.customerName || 'there'},\n\nPlease complete your payment of ₹${parseFloat(link.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for "${link.purpose}".\n\nDirect Payment Link: ${link.url}\n\nProcessed instantly via MyMobPay NPCI T+0 Direct Rails.`
    );
    const phone = link.customerPhone?.replace(/[^0-9]/g, '');
    const waUrl = phone && phone.length >= 10
      ? `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  // Handle Create Payment Link via API
  const handleCreateLink = async (e) => {
    if (e) e.preventDefault();
    setIsGenerating(true);

    const effectiveAmount = amount ? parseFloat(amount) : null;
    const effectivePurpose = purpose.trim() || 'Payment for Services';
    const finalCallbackUrl = redirectUrl.trim() || null;
    const apiKey = profile?.api_key
      ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key
      : 'live_mymob_demo_key';

    let expireInVal = linkValidity;
    if (linkValidity === 'custom') {
      const parsedCustom = parseInt(customValidityMinutes, 10);
      if (isNaN(parsedCustom) || parsedCustom < 5 || parsedCustom > 43200) {
        showToast('Custom expiry must be between 5 minutes and 30 days (43,200 min).');
        setIsGenerating(false);
        return;
      }
      expireInVal = parsedCustom;
    }

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          amount: effectiveAmount,
          title: effectivePurpose,
          customer_name: customerName || '',
          customer_phone: customerPhone || '',
          link_type: linkType,
          expire_in: expireInVal,
          redirect_url: finalCallbackUrl,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to generate link');
        setIsGenerating(false);
        return;
      }

      const generatedUrl = data.payment_url;
      const newToken = data.token;

      const newLinkItem = {
        id: newToken,
        token: newToken,
        merchantId: profile?.id || null,
        purpose: effectivePurpose,
        ref: newToken,
        customerName: customerName.trim() || 'Direct Customer',
        customerPhone: customerPhone.trim() || '--',
        amount: data.amount_in_rupees || (effectiveAmount ? effectiveAmount.toFixed(2) : '0.00'),
        status: 'Active',
        createdAt: data.created_at || new Date().toISOString(),
        expiresAt: data.expires_at,
        linkType: data.link_type,
        url: generatedUrl,
      };

      const updated = [newLinkItem, ...allLinks];
      if (setPayLinkHistory) setPayLinkHistory(updated);

      setActiveUrl(generatedUrl);
      setActiveLinkId(newToken);
      setMobileStudioTab('preview');
      setGeneratedLinkData({
        url: generatedUrl,
        id: newToken,
        amount: effectiveAmount,
        purpose: effectivePurpose,
        ref: newToken,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });
      setIsGenerating(false);
      showToast('Payment link generated with expiry timer! Ready to dispatch.');

      // Update DOM preview element if present
      const prevUrl = document.getElementById('preview-url');
      if (prevUrl) prevUrl.innerText = generatedUrl;
    } catch (err) {
      console.warn('API call failed:', err);
      showToast('Failed to create payment link: ' + err.message);
      setIsGenerating(false);
    }
  };

  // Handle Cancel Active Payment Link
  const handleCancelLink = async (link) => {
    const token = link?.token || link?.id;
    if (!token) return;
    setActionLoadingId(token);
    try {
      const apiKey = profile?.api_key
        ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key
        : '';
      const res = await fetch('/api/payment-links/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Payment link cancelled successfully.');
        fetchDbLinks();
      } else {
        showToast(data.error || 'Failed to cancel link');
      }
    } catch (e) {
      showToast('Error cancelling link: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Regenerate Expired Payment Link (creates a brand new token, keeps old dead)
  const handleRegenerateLink = async (link) => {
    const token = link?.token || link?.id;
    if (!token) return;
    setActionLoadingId(token);
    try {
      const apiKey = profile?.api_key
        ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key
        : '';
      const res = await fetch('/api/payment-links/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('New payment link generated! Original link remains expired.');
        if (data.payment_url) {
          setActiveUrl(data.payment_url);
          setActiveLinkId(data.token);
        }
        fetchDbLinks();
      } else {
        showToast(data.error || 'Failed to regenerate link');
      }
    } catch (e) {
      showToast('Error regenerating link: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLinks.length === 0) {
      showToast('No payment links to export');
      return;
    }

    const headers = ['Link ID', 'Purpose', 'Reference', 'Customer Name', 'Contact', 'Amount (INR)', 'Status', 'Created Date', 'Payment URL'];
    const rows = filteredLinks.map((l) => [
      l.id,
      `"${(l.purpose || '').replace(/"/g, '""')}"`,
      l.ref || '',
      `"${(l.customerName || '').replace(/"/g, '""')}"`,
      l.customerPhone || '',
      l.amount,
      l.status,
      new Date(l.createdAt).toLocaleString('en-IN'),
      l.url,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_payment_links_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment links exported successfully');
  };

  // Refresh data handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Payment links status refreshed');
    }, 600);
  };

  // Delete Link
  const handleDeleteLink = (id) => {
    const updated = allLinks.filter((item) => item.id !== id);
    if (setPayLinkHistory) setPayLinkHistory(updated);
    if (typeof window !== 'undefined' && profile?.id) {
      localStorage.setItem(`mymobpay_payment_links_${profile.id}`, JSON.stringify(updated));
    }
    showToast('Payment link deleted');
  };

  // Computed preview values
  const previewAmountFormatted = useMemo(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return '₹ 0.00';
    return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [amount]);

  const previewPurposeFormatted = purpose.trim() || 'Direct Payment';
  const previewRefFormatted = refCode.trim() || 'REF-GEN';

  const destBank = profile?.bank_name || profile?.settlement_bank || 'ICICI';
  const accNum = profile?.account_number || profile?.bank_account_number || '4092';
  const lastFour = accNum ? String(accNum).slice(-4) : '4092';

  const previewUrlDynamic = useMemo(() => {
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
    const cleanRef = refCode.trim() || '84920';
    return `${host}/pay/pl_${cleanRef.toLowerCase().replace(/[^a-z0-9]/g, '') || '84920'}`;
  }, [refCode]);

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full animate-fade-in text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          HEADER BLOCK
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Links</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-slate-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Direct Rails T+0
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Create, manage, and track instant payment links for your customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium active:scale-[0.98]"
            type="button"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setShowCreateModal((prev) => !prev);
              if (!showCreateModal) {
                setTimeout(() => {
                  createPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all text-sm font-semibold active:scale-[0.98]"
            type="button"
          >
            <Plus className="w-4 h-4" />
            {showCreateModal ? 'Close Generator' : 'Create Payment Link'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SUMMARY KPI CARDS (2x2 on Mobile, 4x1 on Desktop)
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Collected */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">
              Total Collected
            </span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col">
            <span className="text-lg sm:text-2xl text-slate-900 tracking-tight font-extrabold truncate">
              ₹ {metrics.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
              {metrics.totalCount > 0 ? `Across ${metrics.totalCount} paid link${metrics.totalCount !== 1 ? 's' : ''}` : 'No payments yet'}
            </span>
          </div>
        </div>

        {/* Card 2: Active Links */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">
              Active Links
            </span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col">
            <span className="text-lg sm:text-2xl text-slate-900 tracking-tight font-extrabold truncate">
              {metrics.activeLinks}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">Awaiting payment</span>
          </div>
        </div>

        {/* Card 3: Paid Links */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">
              Paid Links
            </span>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col">
            <span className="text-lg sm:text-2xl text-slate-900 tracking-tight font-extrabold truncate">
              {metrics.paidLinks}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-0.5 sm:mt-1 truncate">
              {metrics.conversionRate}% Conversion
            </span>
          </div>
        </div>

        {/* Card 4: Average Ticket */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">
              Average Ticket
            </span>
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col">
            <span className="text-lg sm:text-2xl text-slate-900 tracking-tight font-extrabold truncate">
              {metrics.avgTicket > 0 ? `₹ ${metrics.avgTicket.toLocaleString('en-IN')}` : '—'}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
              {metrics.paidLinks > 0 ? 'Per payment' : 'No paid links yet'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CREATE INSTANT PAYMENT LINK — STUDIO SPLIT PANEL
          ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div ref={createPanelRef} className="w-full animate-fade-up">
          {/* BEGIN: Studio Main Floating Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),0_0_1px_1px_rgba(15,23,42,0.05)] overflow-hidden">

            {/* Top Brand Header Banner */}
            <header className="px-6 py-5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* Logo Icon */}
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Create Instant Payment Link</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      {profile?.sandbox_mode !== false ? 'Test Rail' : 'Direct-to-Bank Escrow-Free Rail'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Settlement target: <span className="font-medium text-slate-700 font-mono">{profile?.business_name || 'Linked Business A/C'}</span> with instant T+0 direct passthrough.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="border border-emerald-300 bg-emerald-50/50 rounded-lg px-3 py-1.5 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 leading-tight">Zero Escrow</div>
                  <div className="text-[11px] font-semibold text-emerald-800 font-mono">Direct Settlement</div>
                </div>
              </div>
            </header>

            {/* Mobile Studio Tab Selector (Visible only on lg:hidden) */}
            <div className="lg:hidden flex border-b border-slate-100 bg-slate-50/70 p-2 gap-2">
              <button
                type="button"
                onClick={() => setMobileStudioTab('configure')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mobileStudioTab === 'configure'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Link</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileStudioTab('preview')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mobileStudioTab === 'preview'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
                {activeUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              </button>
            </div>

            {/* Main Split Studio Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">

              {/* ── LEFT COLUMN: Configuration Form ── */}
              <section className={`lg:col-span-7 p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100 ${mobileStudioTab === 'preview' ? 'hidden lg:block' : 'block'}`} data-purpose="builder-form">

                {/* 1. Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="payment-amount">Amount</label>
                    <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>INR (₹)</span>
                    </div>
                  </div>

                  {/* Big Amount Input */}
                  <div className="relative rounded-2xl bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-2xl font-bold text-slate-400">₹</span>
                    <input
                      className="block w-full pl-11 pr-20 py-3 bg-transparent text-2xl font-bold text-slate-900 border-0 focus:ring-0 font-mono tracking-tight outline-none"
                      id="payment-amount"
                      placeholder="0.00"
                      type="number"
                      step="any"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">0% MDR</span>
                    </span>
                  </div>

                  {/* Quick Add Denominations */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-medium mr-1">Quick Add:</span>
                    {[
                      { label: '+₹500', val: 500 },
                      { label: '+₹1,000', val: 1000 },
                      { label: '+₹2,500', val: 2500, highlight: true },
                      { label: '+₹5,000', val: 5000 },
                      { label: '+₹10,000', val: 10000 },
                    ].map((inc) => (
                      <button
                        key={inc.val}
                        type="button"
                        onClick={() => { const curr = parseFloat(amount) || 0; setAmount((curr + inc.val).toFixed(2)); }}
                        className={`text-xs font-medium font-mono px-2.5 py-1 rounded-md border transition-all ${inc.highlight ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold hover:bg-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50'}`}
                      >
                        {inc.label}
                      </button>
                    ))}
                  </div>

                  {/* Partial Payments Toggle */}
                  <div className="pt-2 flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input className="sr-only peer" type="checkbox" checked={allowPartial} onChange={(e) => setAllowPartial(e.target.checked)} />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="text-xs text-slate-600 select-none">Allow customer to make partial payments or installments</span>
                  </div>
                </div>

                {/* 2. Purpose / Description (Full width, single line) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block" htmlFor="payment-purpose">
                    Purpose / Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-900 py-2.5 px-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    id="payment-purpose"
                    type="text"
                    placeholder="Enter payment purpose or description (e.g. Services, Order #123)"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>

                {/* 3. Customer Contact Details */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Customer Details <span className="text-slate-400 font-normal normal-case">(Optional)</span></div>
                    <span className="text-[11px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">Instant notification &amp; receipt</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1" htmlFor="customer-name">Customer Name</label>
                      <input
                        className="w-full text-sm rounded-lg border border-slate-200 bg-white text-slate-900 py-1.5 px-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                        id="customer-name"
                        placeholder="Customer Name (optional)"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1" htmlFor="customer-contact">Customer Phone / Email</label>
                      <input
                        className="w-full text-sm rounded-lg border border-slate-200 bg-white text-slate-900 py-1.5 px-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                        id="customer-contact"
                        placeholder="+91 Phone or email (optional)"
                        type="text"
                        value={customerContact}
                        onChange={(e) => { setCustomerContact(e.target.value); setCustomerPhone(e.target.value); }}
                      />
                    </div>
                  </div>
                  <div className="pt-1">
                    <label className="inline-flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer select-none group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={notifyWhatsapp}
                          onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${
                            notifyWhatsapp
                              ? 'border-2 border-emerald-600 text-emerald-600 shadow-xs'
                              : 'border border-slate-300 group-hover:border-slate-400 shadow-xs'
                          }`}
                        >
                          {notifyWhatsapp && (
                            <svg className="w-3 h-3 text-emerald-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path></svg>
                        Share via WhatsApp
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. Accepted Rails & Validity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Accepted Rails &amp; Expiry</label>
                    <span className="text-[10px] font-mono text-slate-400">SELECT MULTIPLE</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* UPI Rail */}
                    <label className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${railUpi ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="absolute top-3.5 right-3.5">
                        <input
                          type="checkbox"
                          checked={railUpi}
                          onChange={(e) => setRailUpi(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${
                            railUpi
                              ? 'border-2 border-blue-600 text-blue-600 shadow-xs'
                              : 'border border-slate-300'
                          }`}
                        >
                          {railUpi && (
                            <svg className="w-3 h-3 text-blue-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-xs text-slate-900 pr-6">UPI QR (Instant)</span>
                      <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Zero MDR • 100% Instant</span>
                      <span className="text-[10px] text-slate-400 mt-2">GPay, PhonePe, Paytm, BHIM</span>
                    </label>

                    {/* Bank IMPS/NEFT Rail */}
                    <label className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${railImps ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="absolute top-3.5 right-3.5">
                        <input
                          type="checkbox"
                          checked={railImps}
                          onChange={(e) => setRailImps(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${
                            railImps
                              ? 'border-2 border-blue-600 text-blue-600 shadow-xs'
                              : 'border border-slate-300'
                          }`}
                        >
                          {railImps && (
                            <svg className="w-3 h-3 text-blue-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-xs text-slate-900 pr-6">Bank IMPS / NEFT</span>
                      <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Virtual A/C Direct</span>
                      <span className="text-[10px] text-slate-400 mt-2">RTGS &gt;₹2,00,000</span>
                    </label>

                    {/* Crypto USDT Rail */}
                    <label className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${railCrypto ? 'border-purple-500 bg-purple-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="absolute top-3.5 right-3.5">
                        <input
                          type="checkbox"
                          checked={railCrypto}
                          onChange={(e) => setRailCrypto(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${
                            railCrypto
                              ? 'border-2 border-purple-600 text-purple-600 shadow-xs'
                              : 'border border-slate-300'
                          }`}
                        >
                          {railCrypto && (
                            <svg className="w-3 h-3 text-purple-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-xs text-slate-900 pr-6">Crypto (USDT)</span>
                      <span className="text-[11px] text-purple-600 font-semibold mt-0.5">Polygon Mainnet</span>
                      <span className="text-[10px] text-slate-400 mt-2">Realtime conversion</span>
                    </label>
                  </div>

                  {/* Link Type Selector */}
                  <div className="pt-2">
                    <label className="text-xs text-slate-500 font-medium block mb-1.5">Link Mode / Type:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setLinkType('shared'); setLinkValidity('24h'); }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          linkType === 'shared'
                            ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-semibold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="block text-xs font-bold">Shared Link</span>
                        <span className="block text-[10px] text-slate-500">WhatsApp/SMS/Email • 24h Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLinkType('checkout'); setLinkValidity('15m'); }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          linkType === 'checkout'
                            ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-semibold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="block text-xs font-bold">Live QR / Checkout</span>
                        <span className="block text-[10px] text-slate-500">Live QR Session • 15m Default</span>
                      </button>
                    </div>
                  </div>

                  {/* Validity Presets & Custom Selector */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 font-medium">Expiry Duration:</span>
                      <span className="text-[10px] text-slate-400 font-mono">5 MINS - 30 DAYS</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {[
                        { label: '15 Min', val: '15m' },
                        { label: '1 Hour', val: '1h' },
                        { label: '24 Hours', val: '24h' },
                        { label: '7 Days', val: '7d' },
                        { label: 'Custom', val: 'custom' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setLinkValidity(opt.val)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            linkValidity === opt.val
                              ? 'bg-white text-blue-600 shadow-sm font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Minutes Input */}
                    {linkValidity === 'custom' && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          max="43200"
                          placeholder="Duration in minutes (e.g. 45)"
                          value={customValidityMinutes}
                          onChange={(e) => setCustomValidityMinutes(e.target.value)}
                          className="w-48 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="text-xs text-slate-500">minutes (Min 5m, Max 43,200m / 30d)</span>
                      </div>
                    )}
                  </div>

                  {/* Return / Redirect URL */}
                  <div className="pt-2">
                    <label className="text-xs text-slate-600 font-semibold block mb-1">
                      Return / Redirect URL <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-website.com/payment/success"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Where customers are redirected after clicking &quot;Done&quot;. Leave blank if you don&apos;t want to redirect.
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCreateLink}
                    disabled={isGenerating}
                    className={`flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none active:scale-[0.98] ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}
                    type="button"
                    id="create-link-cta"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Generating...</span></>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        <span>Create &amp; Share Payment Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Template saved successfully!')}
                    className="inline-flex items-center justify-center px-4 py-3.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Save as Template
                  </button>
                </div>
              </section>

              {/* ── RIGHT COLUMN: Live Customer Checkout Preview ── */}
              <section className={`lg:col-span-5 bg-slate-100/70 p-4 sm:p-6 lg:p-8 flex flex-col justify-between items-center relative overflow-hidden ${mobileStudioTab === 'configure' ? 'hidden lg:flex' : 'flex'}`} data-purpose="recipient-simulator">
                {/* Ambient glow blobs */}
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-200 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
                <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

                {/* Preview Header */}
                <div className="w-full flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Customer Checkout Preview</span>
                  </div>
                  <span className="text-[11px] bg-white/80 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-mono">Canvas Mode</span>
                </div>

                {/* Mobile Device Simulator */}
                <div className="w-full max-w-[340px] bg-white rounded-3xl border border-slate-200 shadow-[0_25px_40px_-15px_rgba(30,41,59,0.25),0_0_0_1px_rgba(148,163,184,0.2)] overflow-hidden transition-all duration-300 relative z-10">
                  {/* Status Bar */}
                  <div className="bg-slate-900 text-white px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Checkout Header */}
                  <div className="p-5 text-center border-b border-dashed border-slate-200 bg-gradient-to-b from-blue-50/50 to-white">
                    <div className="inline-flex items-center justify-center relative mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                        {(profile?.business_name || 'MB').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Paying to</div>
                    <h3 className="text-base font-bold text-slate-800">{profile?.business_name || 'My Business'}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto line-clamp-1">
                      {purpose.trim() || 'Direct Payment'}
                    </p>
                    <div className="mt-3">
                      <span className="text-xs text-slate-400 font-medium">Total Amount Due</span>
                      <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono mt-0.5">
                        ₹{' '}
                        {(() => { const v = parseFloat(amount); return isNaN(v) || v <= 0 ? '0.00' : v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); })()}
                      </div>
                    </div>
                  </div>

                  {/* QR Code & Settlement Info */}
                  <div className="p-5 flex flex-col items-center justify-center bg-white space-y-4">
                    {/* Live QR Code with Center Dual-Color M Logo */}
                    <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm cursor-pointer">
                      <QRCode
                        value={activeUrl || previewUrlDynamic}
                        size={140}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="Q"
                      />
                      {/* Centered QR Badge with Blue & Orange M Logo */}
                      <div className="absolute inset-0 m-auto w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100 p-1 pointer-events-none">
                        <svg width="20" height="18" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19" stroke="#0284C7" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5" stroke="#FF7800" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="text-center mt-1.5">
                        <span className="text-[10px] font-medium text-slate-400">Scan with any UPI App</span>
                      </div>
                    </div>

                    {/* UPI Brand Logos */}
                    <div className="flex items-center justify-center space-x-3 text-[11px] font-bold text-slate-500">
                      <span className="text-indigo-600">PhonePe</span>
                      <span>•</span>
                      <span className="text-blue-600">GPay</span>
                      <span>•</span>
                      <span className="text-cyan-600">Paytm</span>
                      <span>•</span>
                      <span className="text-orange-600">BHIM</span>
                    </div>

                    {/* Escrow Status Pill */}
                    <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center space-x-2 text-left">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-900 leading-tight">Direct Bank Credit</div>
                        <div className="text-[10px] text-emerald-700">Passthrough to {profile?.business_name || 'Merchant'} Bank A/C (0% Escrow Fee)</div>
                      </div>
                    </div>
                  </div>

                  {/* Device Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-500">
                      {linkValidity === '24h' ? 'Auto-expires in 24 hours' : linkValidity === '3d' ? 'Auto-expires in 3 days' : linkValidity === '7d' ? 'Auto-expires in 7 days' : linkValidity === '30d' ? 'Auto-expires in 30 days' : 'No expiry'}
                    </span>
                    <span className="text-blue-600 font-medium text-[11px] hover:underline cursor-pointer">Support</span>
                  </div>
                </div>

                {/* Live Generated Link Share Bar */}
                <div className="w-full mt-6 relative z-10">
                  {!generatedLinkData ? (
                    <div className="w-full bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-3 text-center flex items-center justify-center space-x-2 text-xs text-slate-400 font-medium">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                      <span>Click &quot;Create &amp; Share Payment Link&quot; to generate active URL</span>
                    </div>
                  ) : (
                    <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-2 animate-fade-in">
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shareable Payment URL</div>
                          <a
                            href={activeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono font-medium text-blue-600 hover:text-blue-700 hover:underline truncate block"
                            title={activeUrl}
                          >
                            {activeUrl}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={activeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                          title="Open Payment Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => shareWhatsApp(generatedLinkData)}
                          className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-2 rounded-xl transition-all"
                          title="Share on WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(activeUrl, 'Payment Link')}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${copiedId === activeUrl ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                          id="copy-link-btn"
                        >
                          {copiedId === activeUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === activeUrl ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security footnote */}
                <p className="text-[10px] font-mono text-center text-slate-400 mt-3 relative z-10">
                  © 2025 mymobpay (mymob.tech) • Direct Bank Settlement • 256-Bit SSL Encrypted Passthrough
                </p>
              </section>
            </div>
            {/* END: Main Split Studio Layout */}
          </div>
          {/* END: Studio Main Floating Card */}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DATA TABLE & FILTER PANEL
          ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/80">
        {/* Filter bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Status Tabs (Touch scrollable on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'All', label: 'All', count: allLinks.length },
              { id: 'Active', label: 'Active', count: allLinks.filter((l) => l.status === 'Active' || l.status === 'Pending').length },
              { id: 'Paid', label: 'Paid', count: allLinks.filter((l) => l.status === 'Paid').length },
              { id: 'Expired', label: 'Expired', count: allLinks.filter((l) => l.status === 'Expired').length },
              { id: 'Cancelled', label: 'Cancelled', count: allLinks.filter((l) => l.status === 'Cancelled').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 font-normal ${
                    statusFilter === tab.id ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Timeframe & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by ID, description or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option>Last 30 Days</option>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>This Month</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh Payment Links"
              type="button"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content (Desktop View) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Link ID
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Description &amp; Purpose
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Customer
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Amount
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Created Date
                </th>
                <th className="py-3.5 px-6 font-semibold" scope="col">
                  Status
                </th>
                <th className="py-3.5 px-6 font-semibold text-right" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LinkIcon className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No payment links found</p>
                      <p className="text-xs text-slate-400">
                        Try clearing your search query or generate a new link using the studio above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLinks.map((link) => {
                  const numAmt = parseFloat(link.amount);
                  const isFlex = isNaN(numAmt) || link.amount === 'Flexible';
                  const isCopied = copiedId === link.id || copiedId === link.url;

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Link ID */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-semibold text-blue-600 hover:text-blue-700 hover:underline text-xs"
                            title={link.id}
                          >
                            {link.id.length > 18 ? `${link.id.slice(0, 8)}…${link.id.slice(-6)}` : link.id}
                          </a>
                          <button
                            onClick={() => copyText(link.id, 'Link ID')}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded"
                            title="Copy Link ID"
                            type="button"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Description & Purpose */}
                      <td className="py-4 px-6 max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 truncate" title={link.purpose}>
                            {link.purpose}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 truncate" title={link.orderId || link.ref || link.id}>
                            {link.orderId || link.ref || link.id}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {link.customerName || 'Direct Customer'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {link.customerPhone || '--'}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {isFlex ? (
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                                Flexible
                              </span>
                            ) : (
                              `₹ ${numAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            )}
                          </span>
                          {link.partialAmount && (
                            <span className="text-[10px] text-slate-500">
                              ₹{parseFloat(link.partialAmount).toLocaleString('en-IN')} received
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-xs text-slate-500">
                          {new Date(link.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          {new Date(link.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Status & Expiry */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {link.status === 'Paid' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200/60 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Paid
                            </span>
                          )}
                          {(link.status === 'Active' || link.status === 'Pending') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Active
                            </span>
                          )}
                          {link.status === 'Processing' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin"></span>
                              Processing
                            </span>
                          )}
                          {link.status === 'Expired' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Expired
                            </span>
                          )}
                          {link.status === 'Cancelled' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Cancelled
                            </span>
                          )}

                          {/* Expiry countdown / timestamp with explicit Date and Time */}
                          {link.expiresAt && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono whitespace-nowrap">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              {new Date(link.expiresAt).getTime() > Date.now() ? (
                                link.status === 'Paid' ? (
                                  'Completed'
                                ) : (
                                  `Exp: ${new Date(link.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${new Date(link.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                                )
                              ) : (
                                `Expired: ${new Date(link.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap min-w-[150px]">
                        <div className="flex items-center justify-end gap-1">
                          {/* Cancel link button for Active links */}
                          {(link.status === 'Active' || link.status === 'Pending') && (
                            <button
                              onClick={() => handleCancelLink(link)}
                              disabled={actionLoadingId === (link.token || link.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Cancel Active Link"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {/* Regenerate button for Expired links (creates new token) */}
                          {(link.status === 'Expired' || link.status === 'Cancelled') && (
                            <button
                              onClick={() => handleRegenerateLink(link)}
                              disabled={actionLoadingId === (link.token || link.id)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Regenerate Link (Creates New Token)"
                              type="button"
                            >
                              <RotateCcw className={`w-4 h-4 ${actionLoadingId === (link.token || link.id) ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          <button
                            onClick={() => copyText(link.url, 'Payment Link')}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Copy Payment Link"
                            type="button"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => shareWhatsApp(link)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                            title="Share on WhatsApp"
                            type="button"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Open Checkout Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete Link"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Payment Links Card List (Visible only on md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedLinks.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <LinkIcon className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-slate-700 text-xs">No payment links found</p>
                <p className="text-[11px] text-slate-400">Create a link above or clear filters.</p>
              </div>
            </div>
          ) : (
            paginatedLinks.map((link) => {
              const numAmt = parseFloat(link.amount);
              const isFlex = isNaN(numAmt) || link.amount === 'Flexible';
              const isCopied = copiedId === link.id || copiedId === link.url;

              return (
                <div key={link.id} className="p-4 flex flex-col gap-3 bg-white hover:bg-slate-50/60 transition-colors">
                  {/* Top Bar: ID + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-blue-600 truncate max-w-[160px] sm:max-w-[200px]">
                        {link.id}
                      </span>
                      <button
                        onClick={() => copyText(link.id, 'Link ID')}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded-md shrink-0"
                        title="Copy Link ID"
                        type="button"
                      >
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {link.status === 'Paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Paid
                        </span>
                      )}
                      {(link.status === 'Active' || link.status === 'Pending') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Active
                        </span>
                      )}
                      {link.status === 'Processing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin"></span>
                          Processing
                        </span>
                      )}
                      {link.status === 'Expired' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-200">
                          Expired
                        </span>
                      )}
                      {link.status === 'Cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Purpose & Amount */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate" title={link.purpose}>
                        {link.purpose || 'Payment Link'}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        {link.customerName || 'Direct Customer'} {link.customerPhone ? `• ${link.customerPhone}` : ''}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {isFlex ? 'Flexible' : `₹ ${numAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-50">
                    <span>
                      Created: {new Date(link.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {link.expiresAt && (
                      <span className="text-slate-500">
                        {new Date(link.expiresAt).getTime() > Date.now()
                          ? `Exp: ${new Date(link.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${new Date(link.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Expired'}
                      </span>
                    )}
                  </div>

                  {/* Touch Action Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyText(link.url, 'Payment Link')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        copiedId === link.url
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {copiedId === link.url ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === link.url ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => shareWhatsApp(link)}
                      className="py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing{' '}
            <strong className="text-slate-900 font-semibold">
              {filteredLinks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredLinks.length)}
            </strong>{' '}
            of {filteredLinks.length} payment links
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  currentPage === num
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                type="button"
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DIRECT-TO-BANK INSTANT PAYOUT GUARANTEE CALLOUT BANNER
          ══════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-100/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Direct-to-Bank Instant Payout Guarantee (Zero Escrow Hold)
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                NPCI 2.0 IMPS
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Every payment collected via your custom payment links settles directly to your verified{' '}
              <strong className="text-slate-800 font-semibold">
                ICICI Bank Current Account (•••• {profile?.bank_account_number?.slice(-4) || '4092'})
              </strong>
              . Funds never route through intermediary holding wallets or aggregate escrow accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveTab?.('settlements')}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
          >
            Settlement Advices
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('developer')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20"
          >
            View Webhook Logs
          </button>
        </div>
      </div>
    </div>
  );
}
