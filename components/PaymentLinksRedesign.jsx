'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { useModalTransition } from './useModalTransition';
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
  RotateCcw,
  Printer,
  Volume2,
  Palette,
  Lock
} from 'lucide-react';
import { generateOrderId } from '@/lib/orderId';
import { supabase } from '@/lib/supabase';

// ══════════════════════════════════════════════════════════════
// AUTHENTIC VECTOR ASSETS FOR RETAIL UPI STANDEE STUDIO
// ══════════════════════════════════════════════════════════════

function UpiShieldVector({ className = "h-4" }) {
  return (
    <svg viewBox="0 0 120 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 6L22 19L10 32H18L30 19L18 6H10Z" fill="#097939" />
      <path d="M23 6L35 19L23 32H31L43 19L31 6H23Z" fill="#ED7524" />
      <text x="48" y="26" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="900" fill="currentColor" letterSpacing="1">UPI</text>
    </svg>
  );
}

const drawUpiLogoCanvas = (ctx, x, y, scale = 1, textColor = '#ffffff') => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Green chevron
  ctx.fillStyle = '#097939';
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.lineTo(22, 19);
  ctx.lineTo(10, 32);
  ctx.lineTo(18, 32);
  ctx.lineTo(30, 19);
  ctx.lineTo(18, 6);
  ctx.closePath();
  ctx.fill();

  // Orange chevron
  ctx.fillStyle = '#ED7524';
  ctx.beginPath();
  ctx.moveTo(23, 6);
  ctx.lineTo(35, 19);
  ctx.lineTo(23, 32);
  ctx.lineTo(31, 32);
  ctx.lineTo(43, 19);
  ctx.lineTo(31, 6);
  ctx.closePath();
  ctx.fill();

  // UPI Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('UPI', 48, 27);

  ctx.restore();
};

function UpiCenterQrBadge() {
  return (
    <div className="w-9 h-9 rounded-xl bg-white shadow-md border-2 border-slate-900/10 flex flex-col items-center justify-center p-0.5 pointer-events-none">
      <svg viewBox="0 0 36 22" className="w-5 h-3" fill="none">
        <path d="M4 2L14 11L4 20H10L20 11L10 2H4Z" fill="#097939" />
        <path d="M14 2L24 11L14 20H20L30 11L20 2H14Z" fill="#ED7524" />
      </svg>
      <span className="text-[7px] font-black tracking-widest text-slate-800 leading-none mt-0.5">UPI</span>
    </div>
  );
}

function GPayVector() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
      <span className="text-[10px] font-extrabold text-slate-800 tracking-tight leading-none">GPay</span>
    </div>
  );
}

function PhonePeVector() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
      <div className="w-3.5 h-3.5 rounded-[4px] bg-[#5f259f] flex items-center justify-center text-white text-[9px] font-extrabold leading-none">
        पे
      </div>
      <span className="text-[10px] font-extrabold text-[#5f259f] tracking-tight leading-none">PhonePe</span>
    </div>
  );
}

function PaytmVector() {
  return (
    <div className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
      <span className="text-[10px] font-black text-[#002970] leading-none tracking-tight">Pay</span>
      <span className="text-[10px] font-black text-[#00baf2] leading-none tracking-tight">tm</span>
    </div>
  );
}

function BhimVector() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="none">
        <path d="M3 17L10 3L17 17H3Z" fill="#008080" />
        <path d="M6 15L10 7L14 15H6Z" fill="#ff9933" />
      </svg>
      <span className="text-[10px] font-black text-slate-800 tracking-tight leading-none">BHIM</span>
    </div>
  );
}

function CredVector() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-white shadow-2xs">
      <svg viewBox="0 0 16 16" className="w-3 h-3 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 1L2 3.5V8C2 11.5 4.5 14.5 8 15.5C11.5 14.5 14 11.5 14 8V3.5L8 1Z" strokeLinejoin="round" />
        <path d="M6 7.5L7.5 9L10 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[9px] font-black tracking-widest leading-none">CRED</span>
    </div>
  );
}

function SoundboxWaveVector() {
  return (
    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/90 px-3 py-1 rounded-xl border border-emerald-200/70 text-[10px] font-semibold">
      <Volume2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span className="flex items-center gap-0.5 h-3 shrink-0">
        <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="w-0.5 h-3 bg-emerald-600 rounded-full animate-pulse delay-75" />
        <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
        <span className="w-0.5 h-2.5 bg-emerald-600 rounded-full animate-pulse delay-100" />
      </span>
      <span>Instant Voice Notification Active</span>
    </div>
  );
}

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
  const [showMobileQr, setShowMobileQr] = useState(false);

  // Static / Permanent Counter QR State (transitions-dev: 06-modal.md)
  const [showStaticQrModal, setShowStaticQrModal] = useState(false);
  const { isMounted: isStaticQrModalMounted, modalClass: staticQrModalClass, overlayClass: staticQrOverlayClass } = useModalTransition(showStaticQrModal);
  const [staticQrAmountType, setStaticQrAmountType] = useState('any'); // 'any' | 'fixed'
  const [staticQrAmount, setStaticQrAmount] = useState('100');
  const [staticQrNote, setStaticQrNote] = useState('Store Counter Payment');
  const [standeeTheme, setStandeeTheme] = useState('ocean'); // 'ocean' | 'prism' | 'violet' | 'navy' | 'saffron'
  const [standeeStyle, setStandeeStyle] = useState('acrylic'); // 'acrylic' | 'poster' | 'minimal'
  const [standeeBusinessName, setStandeeBusinessName] = useState('');
  const [standeeDeskTag, setStandeeDeskTag] = useState('Counter 1 - Billing Desk');
  const [standeeUpiId, setStandeeUpiId] = useState('');
  const [standeeShowSoundbox, setStandeeShowSoundbox] = useState(true);
  const [standeeShowLogo, setStandeeShowLogo] = useState(true);

  // Portal mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background and html scrolling when static QR modal is open
  useEffect(() => {
    if (showStaticQrModal) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyTouchAction = document.body.style.touchAction;
      const prevHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setShowStaticQrModal(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.touchAction = prevBodyTouchAction;
        document.documentElement.style.overflow = prevHtmlOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showStaticQrModal]);

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

  // Real-time synchronization: Auto-refresh on mount, tab focus/wake, periodic 3s poll, and Supabase channel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('mymobpay_payment_links')) {
        localStorage.removeItem('mymobpay_payment_links');
      }

      if (!profile?.id) {
        if (setPayLinkHistory) setPayLinkHistory([]);
        return;
      }

      // 1. Initial fetch
      fetchDbLinks();

      // 2. High-responsiveness background polling: checks every 3.5s so merchant sees live state without manual reload
      const pollTimer = setInterval(() => {
        fetchDbLinks();
      }, 3500);

      // 3. Instant wake-up refresh when merchant switches back to this dashboard tab/window
      const handleTabFocus = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchDbLinks();
        }
      };

      window.addEventListener('focus', handleTabFocus);
      document.addEventListener('visibilitychange', handleTabFocus);

      // 4. Supabase Realtime channel subscription for instant push updates
      let channel = null;
      try {
        channel = supabase
          .channel(`pl-realtime-${profile.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'payment_links', filter: `merchant_id=eq.${profile.id}` },
            () => {
              fetchDbLinks();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `merchant_id=eq.${profile.id}` },
            () => {
              fetchDbLinks();
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime channel warning:', e);
      }

      return () => {
        clearInterval(pollTimer);
        window.removeEventListener('focus', handleTabFocus);
        document.removeEventListener('visibilitychange', handleTabFocus);
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
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
      // Robust order matching by orderId, full token, or pl_ tokenPrefix
      const token = item.token || item.id;
      const tokenPrefix = token ? token.slice(0, 12) : '';

      const matchingOrder = orders.find(
        (o) =>
          (item.orderId && o.id === item.orderId) ||
          (token && o.external_ref && (
            o.external_ref === token ||
            o.external_ref === `pl_${tokenPrefix}` ||
            o.external_ref.startsWith(`pl_${tokenPrefix}`) ||
            o.external_ref.includes(tokenPrefix)
          )) ||
          (item.id && (o.external_ref === item.id || o.external_ref?.startsWith(item.id + ':'))) ||
          (item.ref && o.external_ref === item.ref) ||
          (tokenPrefix && o.note && o.note.includes(tokenPrefix))
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
      
      const rand = Math.random().toString(36).substring(2);
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
      showToast('Quick payment link generated!');
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

  // High-Resolution Retail Standee PNG Generator (800x1060 HD Canvas)
  const handleDownloadStandee = () => {
    const qrSvg = document.getElementById('standee-real-qr-code') || document.querySelector('#standee-qr-frame svg');
    if (!qrSvg) {
      showToast('Standee QR code is not ready yet.');
      return;
    }

    let svgData = new XMLSerializer().serializeToString(qrSvg);
    if (!svgData.includes('xmlns=')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showToast('Canvas rendering context not available.');
      return;
    }

    const qrImg = new Image();
    qrImg.onload = () => {
      // 800 x 1060 px - High DPI retail standee card
      canvas.width = 800;
      canvas.height = 1060;

      const fillRoundedRect = (x, y, w, h, r, color) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, h, r);
        } else {
          ctx.rect(x, y, w, h);
        }
        ctx.fill();
        ctx.restore();
      };

      const strokeRoundedRect = (x, y, w, h, r, color, lineWidth = 1) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, h, r);
        } else {
          ctx.rect(x, y, w, h);
        }
        ctx.stroke();
        ctx.restore();
      };

      // 1. Standee Card Background with Rounded Corners & Subtle Border
      ctx.fillStyle = '#ffffff';
      fillRoundedRect(0, 0, canvas.width, canvas.height, 36, '#ffffff');
      strokeRoundedRect(0, 0, canvas.width, canvas.height, 36, '#e2e8f0', 2);

      // Clip canvas to rounded standee shape for top header
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, canvas.width, canvas.height, 36);
      } else {
        ctx.rect(0, 0, canvas.width, canvas.height);
      }
      ctx.clip();

      // 2. Theme Header Strip
      if (standeeTheme === 'prism') {
        // 4-Color Google-style Stripe
        ctx.fillStyle = '#4285F4'; ctx.fillRect(0, 0, 200, 10);
        ctx.fillStyle = '#EA4335'; ctx.fillRect(200, 0, 200, 10);
        ctx.fillStyle = '#FBBC05'; ctx.fillRect(400, 0, 200, 10);
        ctx.fillStyle = '#34A853'; ctx.fillRect(600, 0, 200, 10);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 10, canvas.width, 70);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 79, canvas.width, 1);

        // 4 dots
        ctx.fillStyle = '#4285F4'; ctx.beginPath(); ctx.arc(48, 48, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#EA4335'; ctx.beginPath(); ctx.arc(62, 48, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FBBC05'; ctx.beginPath(); ctx.arc(76, 48, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#34A853'; ctx.beginPath(); ctx.arc(90, 48, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('UPI PAYMENT', 110, 54);

        // UPI Logo Right
        drawUpiLogoCanvas(ctx, 670, 32, 0.9, '#0f172a');
      } else if (standeeTheme === 'ocean') {
        // Cyan Stripe
        ctx.fillStyle = '#00baf2';
        ctx.fillRect(0, 0, canvas.width, 8);

        ctx.fillStyle = '#002970';
        ctx.fillRect(0, 8, canvas.width, 72);

        fillRoundedRect(36, 26, 36, 36, 8, 'rgba(0, 186, 242, 0.25)');
        ctx.fillStyle = '#00baf2';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('UPI', 54, 49);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('DIRECT PAYMENT', 86, 50);

        drawUpiLogoCanvas(ctx, 670, 30, 0.9, '#ffffff');
      } else if (standeeTheme === 'violet') {
        // Amber Stripe
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(0, 0, canvas.width, 8);

        ctx.fillStyle = '#5f259f';
        ctx.fillRect(0, 8, canvas.width, 72);

        fillRoundedRect(36, 26, 36, 36, 8, 'rgba(255, 255, 255, 0.2)');
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR', 54, 49);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SCAN & PAY', 86, 50);

        drawUpiLogoCanvas(ctx, 670, 30, 0.9, '#ffffff');
      } else if (standeeTheme === 'saffron') {
        // Tricolor Stripe
        ctx.fillStyle = '#ea580c'; ctx.fillRect(0, 0, 267, 10);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(267, 0, 266, 10);
        ctx.fillStyle = '#16a34a'; ctx.fillRect(533, 0, 267, 10);

        const grad = ctx.createLinearGradient(0, 10, canvas.width, 10);
        grad.addColorStop(0, '#ea580c');
        grad.addColorStop(1, '#c2410c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 10, canvas.width, 70);

        fillRoundedRect(36, 27, 44, 36, 8, 'rgba(255, 255, 255, 0.2)');
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('भारत', 58, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('UPI COUNTER', 94, 50);

        drawUpiLogoCanvas(ctx, 670, 30, 0.9, '#ffffff');
      } else {
        // Midnight Gold Stripe
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(0, 0, canvas.width, 8);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 8, canvas.width, 72);

        ctx.fillStyle = '#d4af37';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('✦  PREMIUM COUNTER', 40, 50);

        drawUpiLogoCanvas(ctx, 670, 30, 0.9, '#d4af37');
      }
      ctx.restore();

      // 3. Store Monogram & Verification Check Badge
      const storeName = standeeBusinessName || profile?.business_name || profile?.owner_name || 'MyMobPay Store';
      const initial = storeName.charAt(0).toUpperCase();

      fillRoundedRect(368, 110, 64, 64, 20, '#f8fafc');
      strokeRoundedRect(368, 110, 64, 64, 20, '#e2e8f0', 1.5);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(initial, 400, 154);

      // Verified green check circle
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(424, 166, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Checkmark icon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(419, 166);
      ctx.lineTo(422, 169);
      ctx.lineTo(429, 162);
      ctx.stroke();

      // Store Name
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(storeName, 400, 208);

      // Desk Tag
      ctx.fillStyle = '#64748b';
      ctx.font = '500 15px sans-serif';
      ctx.fillText(`📍 ${standeeDeskTag || 'Billing Counter'}`, 400, 234);

      // Amount Acceptance Mode Pill
      if (staticQrAmountType === 'fixed' && parseFloat(staticQrAmount) > 0) {
        fillRoundedRect(280, 252, 240, 32, 16, '#eff6ff');
        strokeRoundedRect(280, 252, 240, 32, 16, '#bfdbfe', 1);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Fixed Amount: ₹${parseFloat(staticQrAmount).toFixed(2)}`, 400, 273);
      } else {
        fillRoundedRect(270, 252, 260, 32, 16, '#f0fdf4');
        strokeRoundedRect(270, 252, 260, 32, 16, '#bbf7d0', 1);
        // Green dot
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(295, 268, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Scan & Pay Any Amount', 405, 273);
      }

      // 4. Precision QR Code Frame & Viewfinder Brackets
      const frameX = 215;
      const frameY = 305;
      const frameSize = 370;

      fillRoundedRect(frameX, frameY, frameSize, frameSize, 24, '#ffffff');
      strokeRoundedRect(frameX, frameY, frameSize, frameSize, 24, '#e2e8f0', 2);

      // Corner Viewfinder Brackets in theme color
      const bracketColor =
        standeeTheme === 'ocean'   ? '#00baf2' :
        standeeTheme === 'violet'  ? '#a855f7' :
        standeeTheme === 'prism'   ? '#1a73e8' :
        standeeTheme === 'saffron' ? '#ea580c' : '#d4af37';

      ctx.strokeStyle = bracketColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const bLen = 22;
      const bPad = 12;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(frameX + bPad, frameY + bPad + bLen);
      ctx.lineTo(frameX + bPad, frameY + bPad);
      ctx.lineTo(frameX + bPad + bLen, frameY + bPad);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(frameX + frameSize - bPad - bLen, frameY + bPad);
      ctx.lineTo(frameX + frameSize - bPad, frameY + bPad);
      ctx.lineTo(frameX + frameSize - bPad, frameY + bPad + bLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(frameX + bPad, frameY + frameSize - bPad - bLen);
      ctx.lineTo(frameX + bPad, frameY + frameSize - bPad);
      ctx.lineTo(frameX + bPad + bLen, frameY + frameSize - bPad);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(frameX + frameSize - bPad - bLen, frameY + frameSize - bPad);
      ctx.lineTo(frameX + frameSize - bPad, frameY + frameSize - bPad);
      ctx.lineTo(frameX + frameSize - bPad, frameY + frameSize - bPad - bLen);
      ctx.stroke();

      // Draw the ACTUAL QR CODE
      const qrDrawPad = 26;
      ctx.drawImage(qrImg, frameX + qrDrawPad, frameY + qrDrawPad, frameSize - qrDrawPad * 2, frameSize - qrDrawPad * 2);

      // Center UPI Badge on QR (if enabled)
      if (standeeShowLogo) {
        const badgeSize = 64;
        const badgeX = 400 - badgeSize / 2;
        const badgeY = frameY + frameSize / 2 - badgeSize / 2;

        fillRoundedRect(badgeX, badgeY, badgeSize, badgeSize, 16, '#ffffff');
        strokeRoundedRect(badgeX, badgeY, badgeSize, badgeSize, 16, '#cbd5e1', 2);

        // Center mini UPI vectors
        drawUpiLogoCanvas(ctx, badgeX + 5, badgeY + 12, 0.55, '#1e293b');
      }

      // 5. Accepted UPI Apps Row
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ACCEPTED VIA ANY UPI APP', 400, 715);

      const apps = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'];
      const appWidth = 88;
      const appHeight = 32;
      const appGap = 10;
      const startX = 400 - (apps.length * appWidth + (apps.length - 1) * appGap) / 2;

      apps.forEach((app, idx) => {
        const x = startX + idx * (appWidth + appGap);
        const y = 730;
        if (app === 'CRED') {
          fillRoundedRect(x, y, appWidth, appHeight, 10, '#090d16');
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 12px sans-serif';
          ctx.fillText('CRED', x + appWidth / 2, y + 21);
        } else if (app === 'PhonePe') {
          fillRoundedRect(x, y, appWidth, appHeight, 10, '#ffffff');
          strokeRoundedRect(x, y, appWidth, appHeight, 10, '#e2e8f0', 1);
          ctx.fillStyle = '#5f259f';
          ctx.font = '900 12px sans-serif';
          ctx.fillText('PhonePe', x + appWidth / 2, y + 21);
        } else if (app === 'Paytm') {
          fillRoundedRect(x, y, appWidth, appHeight, 10, '#ffffff');
          strokeRoundedRect(x, y, appWidth, appHeight, 10, '#e2e8f0', 1);
          ctx.font = '900 12px sans-serif';
          ctx.fillStyle = '#002970';
          ctx.fillText('Pay', x + appWidth / 2 - 10, y + 21);
          ctx.fillStyle = '#00baf2';
          ctx.fillText('tm', x + appWidth / 2 + 13, y + 21);
        } else {
          fillRoundedRect(x, y, appWidth, appHeight, 10, '#ffffff');
          strokeRoundedRect(x, y, appWidth, appHeight, 10, '#e2e8f0', 1);
          ctx.fillStyle = '#1e293b';
          ctx.font = '900 12px sans-serif';
          ctx.fillText(app, x + appWidth / 2, y + 21);
        }
      });

      // 6. Receiving UPI ID Pill
      const upiIdStr = `UPI ID: ${standeeUpiId || profile?.upi_id || 'merchant@upi'}`;
      ctx.font = 'bold 16px monospace';
      const upiWidth = Math.max(340, ctx.measureText(upiIdStr).width + 60);

      fillRoundedRect(400 - upiWidth / 2, 785, upiWidth, 38, 14, '#f8fafc');
      strokeRoundedRect(400 - upiWidth / 2, 785, upiWidth, 38, 14, '#cbd5e1', 1.5);

      // Green dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(400 - upiWidth / 2 + 20, 804, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(upiIdStr, 400 + 10, 810);

      // 7. Instant Voice Notification Seal (if enabled)
      if (standeeShowSoundbox) {
        fillRoundedRect(220, 842, 360, 32, 12, '#ecfdf5');
        strokeRoundedRect(220, 842, 360, 32, 12, '#a7f3d0', 1);
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('🔊 Instant Voice Notification Active', 400, 863);
      }

      // 8. Direct Settlement Security Footer
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, 920);
      ctx.lineTo(720, 920);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px sans-serif';
      ctx.fillText('Direct Bank Settlement   •   0% MDR Fee   •   NPCI 2.0 Rails', 400, 955);

      // Trigger high-res PNG download
      const pngFile = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.download = `${(standeeBusinessName || 'mymobpay').toLowerCase().replace(/\s+/g, '_')}_retail_standee.png`;
      downloadLink.href = pngFile;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast('High-Res QR Standee image downloaded!');
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // 1-Page Isolated Retail Standee Print
  const handlePrintStandee = () => {
    const card = document.getElementById('printable-standee-card');
    if (!card) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.id = 'standee-print-iframe';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Collect all stylesheets from parent document
    let stylesHtml = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      stylesHtml += node.outerHTML;
    });

    const cardClone = card.cloneNode(true);
    cardClone.querySelectorAll('.no-print-area').forEach(el => el.remove());

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${(standeeBusinessName || 'MyMobPay').replace(/"/g, '&quot;')} - Retail Standee</title>
          ${stylesHtml}
          <style>
            @page {
              size: portrait;
              margin: 10mm;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-height: 100vh !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-standee-card {
              width: 380px !important;
              max-width: 100% !important;
              margin: auto !important;
              border: 1.5px solid #cbd5e1 !important;
              border-radius: 28px !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${cardClone.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 350);
  };

  // Computed preview values
  const previewAmountFormatted = useMemo(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return '₹ 0.00';
    return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [amount]);

  const previewPurposeFormatted = purpose.trim() || 'Direct Payment';
  const previewRefFormatted = refCode.trim() || 'REF-GEN';

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

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (!standeeBusinessName) setStandeeBusinessName(profile?.business_name || profile?.owner_name || 'My Store');
              if (!standeeUpiId) setStandeeUpiId(profile?.upi_id || 'merchant@upi');
              setShowStaticQrModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors text-sm font-semibold active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <QrIcon className="w-4 h-4 text-emerald-600" />
            Counter Static QR
          </button>

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
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-blue-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
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
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-amber-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
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
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-emerald-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
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
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-purple-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
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
            <header className="p-3.5 sm:px-6 sm:py-5 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 truncate">Create Payment Link</h2>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      Direct Rail
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Instant T+0 credit to <span className="font-medium text-slate-700">{profile?.business_name || 'Bank A/C'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] sm:text-xs font-bold font-mono">
                  0% MDR
                </span>
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

                  {/* Quick Add Denominations (Single horizontal row with smooth scroll on mobile) */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-0.5">Quick:</span>
                    {[
                      { label: '+₹100', val: 100 },
                      { label: '+₹500', val: 500 },
                      { label: '+₹1,000', val: 1000, highlight: true },
                      { label: '+₹2,500', val: 2500 },
                      { label: '+₹5,000', val: 5000 },
                      { label: '+₹10,000', val: 10000 },
                    ].map((inc) => (
                      <button
                        key={inc.val}
                        type="button"
                        onClick={() => { const curr = parseFloat(amount) || 0; setAmount((curr + inc.val).toFixed(2)); }}
                        className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border shrink-0 transition-all cursor-pointer ${inc.highlight ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-white'}`}
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

                {/* 3. Customer Contact Details (Streamlined & Compact for Mobile) */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Customer Details <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">Direct Receipt</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="customer-name">Name</label>
                      <input
                        className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 py-2 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                        id="customer-name"
                        placeholder="Customer Name (optional)"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="customer-contact">Phone / WhatsApp</label>
                      <input
                        className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 py-2 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                        id="customer-contact"
                        placeholder="+91 Mobile number (optional)"
                        type="tel"
                        value={customerContact}
                        onChange={(e) => { setCustomerContact(e.target.value); setCustomerPhone(e.target.value); }}
                      />
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <label className="inline-flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={notifyWhatsapp}
                        onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path></svg>
                        Pre-format WhatsApp share text with link
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. Accepted Rails & Validity (Streamlined with Mobile Collapsible) */}
                <div className="space-y-3">
                  {/* Mobile Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="lg:hidden w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showAdvanced ? 'Hide Advanced Options' : 'More Options (Rails, Expiry, Redirect)'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Mobile Rail Quick Selector (Always visible on mobile) */}
                  <div className="lg:hidden space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Accepted Rails</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRailUpi(!railUpi)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${railUpi ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        <div className="text-[11px] font-bold">UPI QR</div>
                        <div className="text-[9px] text-emerald-600 font-semibold">0% MDR</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRailImps(!railImps)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${railImps ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        <div className="text-[11px] font-bold">Bank IMPS</div>
                        <div className="text-[9px] text-slate-500 font-medium">Virtual A/C</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRailCrypto(!railCrypto)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${railCrypto ? 'bg-purple-50 border-purple-500 text-purple-800 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        <div className="text-[11px] font-bold">USDT</div>
                        <div className="text-[9px] text-purple-600 font-medium">Web3</div>
                      </button>
                    </div>
                  </div>

                  {/* Full Options: Always visible on Desktop, collapsible on mobile */}
                  <div className={`space-y-4 ${showAdvanced ? 'block' : 'hidden lg:block'}`}>
                    {/* Desktop Rich Rail Cards */}
                    <div className="hidden lg:block space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Accepted Rails &amp; Expiry</label>
                        <span className="text-[10px] font-mono text-slate-400">SELECT MULTIPLE</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {/* UPI Rail */}
                        <label className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${railUpi ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <div className="absolute top-3.5 right-3.5">
                            <input type="checkbox" checked={railUpi} onChange={(e) => setRailUpi(e.target.checked)} className="sr-only" />
                            <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${railUpi ? 'border-2 border-blue-600 text-blue-600 shadow-xs' : 'border border-slate-300'}`}>
                              {railUpi && <svg className="w-3 h-3 text-blue-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                          </div>
                          <span className="font-bold text-xs text-slate-900 pr-6">UPI QR (Instant)</span>
                          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Zero MDR • 100% Instant</span>
                          <span className="text-[10px] text-slate-400 mt-2">GPay, PhonePe, Paytm, BHIM</span>
                        </label>

                        {/* Bank IMPS/NEFT Rail */}
                        <label className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${railImps ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <div className="absolute top-3.5 right-3.5">
                            <input type="checkbox" checked={railImps} onChange={(e) => setRailImps(e.target.checked)} className="sr-only" />
                            <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${railImps ? 'border-2 border-blue-600 text-blue-600 shadow-xs' : 'border border-slate-300'}`}>
                              {railImps && <svg className="w-3 h-3 text-blue-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                          </div>
                          <span className="font-bold text-xs text-slate-900 pr-6">Bank IMPS / NEFT</span>
                          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Virtual A/C Direct</span>
                          <span className="text-[10px] text-slate-400 mt-2">RTGS &gt;₹2,00,000</span>
                        </label>

                        {/* Crypto USDT Rail */}
                        <label className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${railCrypto ? 'border-purple-500 bg-purple-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <div className="absolute top-3.5 right-3.5">
                            <input type="checkbox" checked={railCrypto} onChange={(e) => setRailCrypto(e.target.checked)} className="sr-only" />
                            <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center bg-white ${railCrypto ? 'border-2 border-purple-600 text-purple-600 shadow-xs' : 'border border-slate-300'}`}>
                              {railCrypto && <svg className="w-3 h-3 text-purple-600 stroke-[2.5]" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                          </div>
                          <span className="font-bold text-xs text-slate-900 pr-6">Crypto (USDT)</span>
                          <span className="text-[11px] text-purple-600 font-semibold mt-0.5">Polygon Mainnet</span>
                          <span className="text-[10px] text-slate-400 mt-2">Realtime conversion</span>
                        </label>
                      </div>
                    </div>

                    {/* Link Type Selector */}
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1.5">Link Mode / Type:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setLinkType('shared'); setLinkValidity('24h'); }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500 font-medium">Expiry Duration:</span>
                        <span className="text-[10px] text-slate-400 font-mono">5m - 30d</span>
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
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              linkValidity === opt.val
                                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

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
                          <span className="text-xs text-slate-500">minutes</span>
                        </div>
                      )}
                    </div>

                    {/* Return / Redirect URL */}
                    <div>
                      <label className="text-xs text-slate-600 font-semibold block mb-1">
                        Return / Redirect URL <span className="font-normal text-slate-400">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://your-website.com/payment/success"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons & Instant Active Link Card for Mobile */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <button
                      onClick={handleCreateLink}
                      disabled={isGenerating}
                      className={`flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md shadow-blue-500/20 transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none active:scale-[0.98] cursor-pointer ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}
                      type="button"
                      id="create-link-cta"
                    >
                      {isGenerating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating Payment Link...</span></>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Create &amp; Share Payment Link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Template saved successfully!')}
                      className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Save Template
                    </button>
                  </div>

                  {/* ── MOBILE INSTANT ACTIVE LINK RESULT CARD ── */}
                  {activeUrl && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-emerald-50/90 border-2 border-blue-500/30 shadow-md flex flex-col gap-3 animate-fade-in mt-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Payment Link Active &amp; Ready!
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                          {linkValidity === '15m' ? '15m Exp.' : linkValidity === '1h' ? '1h Exp.' : '24h Exp.'}
                        </span>
                      </div>

                      {/* URL Box */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 text-xs shadow-2xs">
                        <LinkIcon className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-mono text-slate-700 truncate flex-1 text-[11px] sm:text-xs select-all">{activeUrl}</span>
                        <button
                          type="button"
                          onClick={() => copyText(activeUrl, 'Payment Link')}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          aria-label={copiedId === activeUrl ? "Payment Link copied" : "Copy Payment Link"}
                        >
                          <span className="t-icon-swap" data-state={copiedId === activeUrl ? 'b' : 'a'}>
                            <Copy className="t-icon t-icon--a w-3.5 h-3.5" aria-hidden={copiedId === activeUrl} />
                            <Check className="t-icon t-icon--b w-3.5 h-3.5 text-emerald-400" aria-hidden={copiedId !== activeUrl} />
                          </span>
                          <span>{copiedId === activeUrl ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => shareWhatsApp(generatedLinkData || { url: activeUrl, amount, purpose })}
                          className="col-span-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path></svg>
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowMobileQr(!showMobileQr)}
                          className="col-span-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-blue-200 cursor-pointer active:scale-95"
                        >
                          <QrIcon className="w-4 h-4 shrink-0" />
                          <span>{showMobileQr ? 'Hide QR' : 'Show QR'}</span>
                        </button>

                        <a
                          href={activeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span>Open Checkout</span>
                        </a>
                      </div>

                      {/* Collapsible Mobile QR display */}
                      {showMobileQr && (
                        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-inner animate-fade-in gap-2">
                          <QRCode
                            value={activeUrl}
                            size={160}
                            bgColor="#ffffff"
                            fgColor="#0f172a"
                            level="Q"
                          />
                          <p className="text-[11px] font-bold text-slate-700 mt-1">Scan to Pay ₹{parseFloat(amount || 0).toLocaleString('en-IN')}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Instant IMPS/UPI Pass-Through</span>
                        </div>
                      )}
                    </div>
                  )}
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
                <div className="w-full max-w-full sm:max-w-[350px] bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-[0_25px_40px_-15px_rgba(30,41,59,0.25),0_0_0_1px_rgba(148,163,184,0.2)] overflow-hidden transition-all duration-300 relative z-10">
                  {/* Status Bar */}
                  <div className="hidden sm:flex bg-slate-900 text-white px-5 pt-3 pb-2 items-center justify-between text-[11px] font-mono">
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
                    <div
                      onClick={() => {
                        const url = activeUrl || previewUrlDynamic;
                        if (url) {
                          navigator.clipboard?.writeText(url);
                          showToast('Payment link copied to clipboard!');
                        }
                      }}
                      title="Tap to copy payment link URL"
                      className="relative p-3 bg-white hover:bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all"
                    >
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

                    {/* UPI Intent Quick-Pay Buttons (Mobile Tap-to-Pay) */}
                    <div className="w-full space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                        Tap to Pay with UPI Apps
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const upiUrl = `upi://pay?pa=${encodeURIComponent(profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(profile?.business_name || 'Merchant')}&am=${amount || '100'}&cu=INR&tn=${encodeURIComponent(purpose || 'Payment')}`;
                            navigator.clipboard?.writeText(upiUrl);
                            showToast('PhonePe UPI deep link copied!');
                          }}
                          className="h-8 rounded-lg bg-[#5f259f]/10 hover:bg-[#5f259f]/20 border border-[#5f259f]/20 text-[#5f259f] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#5f259f]" />
                          PhonePe
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const upiUrl = `gpay://upi/pay?pa=${encodeURIComponent(profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(profile?.business_name || 'Merchant')}&am=${amount || '100'}&cu=INR&tn=${encodeURIComponent(purpose || 'Payment')}`;
                            navigator.clipboard?.writeText(upiUrl);
                            showToast('Google Pay UPI deep link copied!');
                          }}
                          className="h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          Google Pay
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const upiUrl = `paytmmp://upi/pay?pa=${encodeURIComponent(profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(profile?.business_name || 'Merchant')}&am=${amount || '100'}&cu=INR&tn=${encodeURIComponent(purpose || 'Payment')}`;
                            navigator.clipboard?.writeText(upiUrl);
                            showToast('Paytm UPI deep link copied!');
                          }}
                          className="h-8 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-600" />
                          Paytm
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const upiUrl = `upi://pay?pa=${encodeURIComponent(profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(profile?.business_name || 'Merchant')}&am=${amount || '100'}&cu=INR&tn=${encodeURIComponent(purpose || 'Payment')}`;
                            navigator.clipboard?.writeText(upiUrl);
                            showToast('BHIM / Cred UPI deep link copied!');
                          }}
                          className="h-8 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-orange-600" />
                          BHIM / Any UPI
                        </button>
                      </div>
                    </div>

                    {/* Escrow Status Pill with Prominent Trust Message (Direct Peer-to-Peer) */}
                    <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center space-x-2 text-left">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-900 leading-tight">Payments go directly to your UPI account</div>
                        <div className="text-[10px] text-emerald-700">Funds land straight into {profile?.business_name || 'Merchant'} bank account (0% intermediary escrow)</div>
                      </div>
                    </div>
                  </div>

                  {/* Device Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-500">
                      {linkValidity === '24h' ? 'Auto-expires in 24 hours' : linkValidity === '3d' ? 'Auto-expires in 3 days' : linkValidity === '7d' ? 'Auto-expires in 7 days' : linkValidity === '30d' ? 'Auto-expires in 30 days' : 'No expiry'}
                    </span>
                    <a href="mailto:support@mymob.tech" className="text-blue-600 font-medium text-[11px] hover:underline cursor-pointer">Support</a>
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
                          <span className="t-icon-swap" data-state={copiedId === activeUrl ? 'b' : 'a'}>
                            <Copy className="t-icon t-icon--a w-3.5 h-3.5" aria-hidden={copiedId === activeUrl} />
                            <Check className="t-icon t-icon--b w-3.5 h-3.5" aria-hidden={copiedId !== activeUrl} />
                          </span>
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
                        className="text-slate-400 hover:text-blue-600 p-1 rounded-md shrink-0 flex items-center justify-center"
                        title="Copy Link ID"
                        aria-label="Copy Link ID"
                        type="button"
                      >
                        <span className="t-icon-swap" data-state={copiedId === link.id ? 'b' : 'a'}>
                          <span className="t-icon" data-icon="a" aria-hidden={copiedId === link.id}>
                            <Copy className="w-3.5 h-3.5" />
                          </span>
                          <span className="t-icon" data-icon="b" aria-hidden={copiedId !== link.id}>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        </span>
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
                      aria-label="Copy Payment Link"
                    >
                      <span className="t-icon-swap" data-state={copiedId === link.url ? 'b' : 'a'}>
                        <span className="t-icon" data-icon="a" aria-hidden={copiedId === link.url}>
                          <Copy className="w-3.5 h-3.5" />
                        </span>
                        <span className="t-icon" data-icon="b" aria-hidden={copiedId !== link.url}>
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </span>
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
                {profile?.bank_name
                  ? `${profile.bank_name} (•••• ${String(profile?.bank_account_number || '').slice(-4) || '••••'})`
                  : profile?.upi_id
                  ? `receiving UPI VPA (${profile.upi_id})`
                  : 'direct bank settlement rail'}
              </strong>
              . Funds never route through intermediary holding wallets or aggregate escrow accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveTab?.('verification')}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Verification Center
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('settings')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            API Settings
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          STATIC / COUNTER QR CODE MODAL — RETAIL STANDEE STUDIO (transitions-dev: 06-modal.md)
          ══════════════════════════════════════════════════════════ */}
      {mounted && isStaticQrModalMounted && typeof document !== 'undefined' && createPortal(
        <div
          id="standee-modal-backdrop"
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-md overscroll-contain select-none ${staticQrOverlayClass}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStaticQrModal(false);
            }
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          {/* Print Isolation Stylesheet — forces single clean page retail print */}
          <style>{`
            @media print {
              @page {
                size: portrait;
                margin: 10mm;
              }
              html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #standee-modal-backdrop {
                background: transparent !important;
                backdrop-filter: none !important;
                position: static !important;
                padding: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
              }
              #printable-standee-card,
              #printable-standee-card * {
                visibility: visible !important;
              }
              #printable-standee-card {
                position: relative !important;
                top: auto !important;
                left: auto !important;
                transform: none !important;
                width: 380px !important;
                max-width: 90% !important;
                margin: 20mm auto !important;
                box-shadow: none !important;
                border: 1.5px solid #cbd5e1 !important;
                border-radius: 24px !important;
                page-break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                z-index: 999999 !important;
              }
              .no-print-area {
                display: none !important;
              }
            }
          `}</style>

          <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden relative ${staticQrModalClass}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header — Pinned at Top, 100% visible, never cut off */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
                  <QrIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Static Counter QR Studio</h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      T+0 Direct NPCI
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">Design, customize, and print professional UPI payment standees for your retail counter</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStaticQrModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Customization Controls */}
                <div className="lg:col-span-6 space-y-4 text-xs pr-1">
                  
                  {/* 1. Colour Theme — clean swatch strip */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Colour Theme</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { id: 'ocean',   name: 'Ocean',    color: '#0051b3',  ring: 'ring-[#0051b3]'  },
                        { id: 'prism',   name: 'Prism',    color: '#1a73e8',  ring: 'ring-[#1a73e8]'  },
                        { id: 'violet',  name: 'Violet',   color: '#5f259f',  ring: 'ring-[#5f259f]'  },
                        { id: 'navy',    name: 'Midnight', color: '#090d16',  ring: 'ring-slate-900'   },
                        { id: 'saffron', name: 'Saffron',  color: '#ea580c',  ring: 'ring-[#ea580c]'  },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setStandeeTheme(t.id)}
                          title={t.name}
                          className={`group relative flex flex-col items-center gap-1.5 cursor-pointer transition-all`}
                        >
                          {/* Colour dot */}
                          <span
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center shadow-sm ${
                              standeeTheme === t.id
                                ? `border-transparent ring-2 ring-offset-2 ${t.ring}`
                                : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: t.color }}
                          >
                            {standeeTheme === t.id && (
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          {/* Label */}
                          <span className={`text-[10px] font-semibold transition-colors ${
                            standeeTheme === t.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                          }`}>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Standee Format — segmented control */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Format</p>
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                      {[
                        { id: 'acrylic', label: 'Tabletop',    icon: '🖥️' },
                        { id: 'poster',  label: 'Wall Poster', icon: '📋' },
                        { id: 'minimal', label: 'Pocket Card', icon: '💳' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setStandeeStyle(f.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            standeeStyle === f.id
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <span className="text-sm leading-none">{f.icon}</span>
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Business Name & Desk Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business / Store Name</label>
                      <input
                        type="text"
                        value={standeeBusinessName || profile?.business_name || profile?.owner_name || ''}
                        onChange={(e) => setStandeeBusinessName(e.target.value)}
                        placeholder="e.g. Deadraon Enterprise"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Counter / Desk Tag</label>
                      <input
                        type="text"
                        value={standeeDeskTag}
                        onChange={(e) => setStandeeDeskTag(e.target.value)}
                        placeholder="e.g. Counter 1 - Billing Desk"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 4. Receiving UPI VPA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Receiving UPI ID (Direct Settlement)</label>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> NPCI Verified
                      </span>
                    </div>
                    <input
                      type="text"
                      value={standeeUpiId || profile?.upi_id || 'merchant@upi'}
                      onChange={(e) => setStandeeUpiId(e.target.value)}
                      placeholder="yourname@okaxis"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* 5. Amount Acceptance Mode */}
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Amount Acceptance</label>
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setStaticQrAmountType('any')}
                          className={`px-3 py-1 cursor-pointer transition-colors ${staticQrAmountType === 'any' ? 'bg-[#0c2340] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          Any Amount
                        </button>
                        <button
                          type="button"
                          onClick={() => setStaticQrAmountType('fixed')}
                          className={`px-3 py-1 cursor-pointer transition-colors ${staticQrAmountType === 'fixed' ? 'bg-[#0c2340] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          Fixed Preset
                        </button>
                      </div>
                    </div>

                    {staticQrAmountType === 'fixed' ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-500 text-sm">₹</span>
                          <input
                            type="number"
                            value={staticQrAmount}
                            onChange={(e) => setStaticQrAmount(e.target.value)}
                            placeholder="100.00"
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-extrabold text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['50', '100', '200', '500', '1000'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setStaticQrAmount(val)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                staticQrAmount === val
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              ₹{val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Customer scans and enters any custom payment amount directly inside their UPI app. Ideal for billing counters and POS desks.
                      </p>
                    )}
                  </div>

                  {/* 6. Feature Toggles */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={standeeShowSoundbox}
                        onChange={(e) => setStandeeShowSoundbox(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>Show Soundbox Voice Wave Seal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={standeeShowLogo}
                        onChange={(e) => setStandeeShowLogo(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>Center UPI Badge on QR</span>
                    </label>
                  </div>

                </div>

                {/* Right Column: Live Retail Standee Preview */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-slate-100 via-slate-100/90 to-slate-200/80 rounded-3xl border border-slate-200/80 shadow-inner relative">
                  
                  {/* Format Badging */}
                  <div className="w-full flex items-center justify-between mb-3 text-[11px] text-slate-500 font-semibold px-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Tabletop Standee Preview
                    </span>
                    <span className="font-mono text-slate-400 uppercase text-[10px]">{standeeTheme.charAt(0).toUpperCase() + standeeTheme.slice(1)} • {standeeStyle}</span>
                  </div>

                  {/* STANDEE CONTAINER (PRINT TARGET) */}
                  <div className="w-full flex flex-col items-center">
                    
                    {/* Standee Body Card */}
                    <div
                      id="printable-standee-card"
                      className={`w-full max-w-[340px] sm:max-w-[350px] bg-white rounded-3xl shadow-xl border overflow-hidden relative transition-all duration-300 ${
                        standeeTheme === 'ocean'
                          ? 'border-[#002970]/30 shadow-blue-900/10'
                          : standeeTheme === 'prism'
                          ? 'border-slate-300 shadow-slate-900/10'
                          : standeeTheme === 'violet'
                          ? 'border-[#5f259f]/30 shadow-purple-900/10'
                          : standeeTheme === 'saffron'
                          ? 'border-orange-500/30 shadow-orange-950/10'
                          : 'border-slate-800 shadow-slate-950/20'
                      }`}
                    >
                      
                      {/* Retail Wall Poster: Hanging hole grommet */}
                      {standeeStyle === 'poster' && (
                        <div className="w-full flex justify-center pt-2.5 pb-1 bg-slate-50 border-b border-slate-100">
                          <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-400 shadow-inner flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          </div>
                        </div>
                      )}

                      {/* 1. TOP HEADER — Brand-neutral, design-led */}
                      {standeeTheme === 'prism' ? (
                        <div>
                          {/* Prism 4-Color Accent Bar */}
                          <div className="h-1.5 w-full flex">
                            <span className="flex-1 bg-[#4285F4]" />
                            <span className="flex-1 bg-[#EA4335]" />
                            <span className="flex-1 bg-[#FBBC05]" />
                            <span className="flex-1 bg-[#34A853]" />
                          </div>
                          {/* Prism Header Strip */}
                          <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                                <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
                                <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
                                <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                              </div>
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">UPI Payment</span>
                            </div>
                            <UpiShieldVector className="h-3.5 text-slate-900" />
                          </div>
                        </div>
                      ) : standeeTheme === 'ocean' ? (
                        <div>
                          {/* Ocean Cyan Accent Bar */}
                          <div className="h-1 w-full bg-[#00baf2]" />
                          {/* Ocean Navy Header Strip */}
                          <div className="px-4 py-2.5 bg-[#002970] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md bg-[#00baf2]/20 border border-[#00baf2]/40 flex items-center justify-center">
                                <span className="text-[8px] font-black text-[#00baf2]">UPI</span>
                              </div>
                              <span className="text-[10px] font-black text-blue-100 uppercase tracking-wider">Direct Payment</span>
                            </div>
                            <UpiShieldVector className="h-3.5 text-white" />
                          </div>
                        </div>
                      ) : standeeTheme === 'violet' ? (
                        <div>
                          {/* Violet Amber Accent Bar */}
                          <div className="h-1 w-full bg-[#f59e0b]" />
                          {/* Violet Header Strip */}
                          <div className="px-4 py-2.5 bg-[#5f259f] text-white flex items-center justify-between relative overflow-hidden">
                            <div className="flex items-center gap-2 relative z-10">
                              <div className="w-5 h-5 rounded-md bg-white/15 border border-white/20 flex items-center justify-center">
                                <span className="text-[8px] font-black text-white">QR</span>
                              </div>
                              <span className="text-[10px] font-black text-purple-100 uppercase tracking-wider">Scan & Pay</span>
                            </div>
                            <UpiShieldVector className="h-3.5 text-white relative z-10" />
                          </div>
                        </div>
                      ) : standeeTheme === 'saffron' ? (
                        <div>
                          {/* Tricolor Stripe */}
                          <div className="h-1.5 w-full flex">
                            <span className="flex-1 bg-[#ea580c]" />
                            <span className="flex-1 bg-[#ffffff]" />
                            <span className="flex-1 bg-[#16a34a]" />
                          </div>
                          {/* Saffron Header Strip */}
                          <div className="px-4 py-2.5 bg-gradient-to-r from-[#ea580c] to-[#c2410c] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md bg-white/15 border border-white/20 flex items-center justify-center">
                                <span className="text-[8px] font-black text-white">भारत</span>
                              </div>
                              <span className="text-[10px] font-black text-amber-100 uppercase tracking-wider">UPI Counter</span>
                            </div>
                            <UpiShieldVector className="h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Champagne Gold Stripe */}
                          <div className="h-1 w-full bg-[#d4af37]" />
                          {/* Midnight Header Strip */}
                          <div className="px-4 py-2.5 bg-[#090d16] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span className="text-[10px] font-black tracking-wider uppercase text-amber-200">Premium Counter</span>
                            </div>
                            <UpiShieldVector className="h-3.5 text-amber-200" />
                          </div>
                        </div>
                      )}

                      {/* 2. MERCHANT IDENTITY BLOCK (Minimalist White Background) */}
                      <div className="px-4 pt-3.5 pb-1 flex flex-col items-center text-center">
                        
                        {/* Business Avatar Monogram with Green Check Shield */}
                        <div className="relative">
                          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-base flex items-center justify-center shadow-xs">
                            {(standeeBusinessName || profile?.business_name || profile?.owner_name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        </div>

                        {/* Business Name */}
                        <h4 className="text-sm sm:text-base font-black tracking-tight text-slate-900 mt-2 line-clamp-1">
                          {standeeBusinessName || profile?.business_name || profile?.owner_name || 'MyMobPay Store'}
                        </h4>

                        {/* Counter Tag */}
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                          <span className="text-slate-400">📍</span>
                          <span>{standeeDeskTag || 'Billing Counter'}</span>
                        </p>

                        {/* Amount Acceptance Mode Pill */}
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold">
                          {staticQrAmountType === 'fixed' && parseFloat(staticQrAmount) > 0 ? (
                            <>
                              <Lock className="w-3 h-3 text-blue-600" />
                              <span>Fixed Amount:</span>
                              <span className="font-mono text-blue-700 font-extrabold">₹{parseFloat(staticQrAmount).toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Scan &amp; Pay Any Amount</span>
                            </>
                          )}
                        </div>

                        {/* 3. QR CODE PRECISION FRAME */}
                        <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-900/10 shadow-sm mt-3">
                          {/* Viewfinder Corner Registration Brackets */}
                          {(() => {
                            const cornerColor =
                              standeeTheme === 'ocean'   ? 'border-[#00baf2]' :
                              standeeTheme === 'violet'  ? 'border-[#a855f7]' :
                              standeeTheme === 'prism'   ? 'border-[#1a73e8]' :
                              standeeTheme === 'saffron' ? 'border-[#ea580c]' : 'border-amber-400';
                            return (
                              <>
                                <div className={`absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-sm pointer-events-none ${cornerColor}`} />
                                <div className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-sm pointer-events-none ${cornerColor}`} />
                                <div className={`absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-sm pointer-events-none ${cornerColor}`} />
                                <div className={`absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-sm pointer-events-none ${cornerColor}`} />
                              </>
                            );
                          })()}

                          <div className="relative" id="standee-qr-frame">
                            <QRCode
                              id="standee-real-qr-code"
                              value={
                                staticQrAmountType === 'fixed' && parseFloat(staticQrAmount) > 0
                                  ? `upi://pay?pa=${encodeURIComponent(standeeUpiId || profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(standeeBusinessName || profile?.business_name || profile?.owner_name || 'Merchant')}&am=${parseFloat(staticQrAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(standeeDeskTag || 'Store Counter')}`
                                  : `upi://pay?pa=${encodeURIComponent(standeeUpiId || profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(standeeBusinessName || profile?.business_name || profile?.owner_name || 'Merchant')}&cu=INR&tn=${encodeURIComponent(standeeDeskTag || 'Store Counter')}`
                              }
                              size={180}
                              level="H"
                            />
                            {standeeShowLogo && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <UpiCenterQrBadge />
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* 4. ACCEPTED APPS ROW (OFFICIAL VECTORS) */}
                      <div className="w-full px-4 pt-2.5 pb-3.5 space-y-2 text-center">
                        <p className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">
                          Accepted via Any UPI App
                        </p>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <GPayVector />
                          <PhonePeVector />
                          <PaytmVector />
                          <BhimVector />
                          <CredVector />
                        </div>

                        {/* Receiving UPI ID Pill */}
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800 bg-slate-100/90 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>UPI ID: {standeeUpiId || profile?.upi_id || 'merchant@upi'}</span>
                          </span>
                        </div>

                        {/* Instant Voice Notification Wave Seal */}
                        {standeeShowSoundbox && (
                          <div className="flex justify-center pt-0.5">
                            <SoundboxWaveVector />
                          </div>
                        )}

                        {/* Direct Settlement Security Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                          <span>Direct Bank Settlement</span>
                          <span className="font-bold text-slate-600">0% MDR Fee</span>
                          <span>NPCI 2.0 Rails</span>
                        </div>
                      </div>

                    </div>

                    {/* 3D Tabletop Acrylic Stand Base Illustration (Only shown on screen for Tabletop mode) */}
                    {standeeStyle === 'acrylic' && (
                      <div className="no-print-area flex flex-col items-center mt-[-3px] select-none pointer-events-none">
                        {/* Glass slot groove */}
                        <div className="w-[190px] h-2.5 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 rounded-sm shadow-inner border-t border-slate-400/50" />
                        {/* Acrylic pedestal base with glass reflection */}
                        <div className="w-[260px] h-4 bg-gradient-to-b from-white/90 via-slate-200/90 to-slate-300 rounded-b-xl shadow-lg border border-slate-300/80 relative overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest relative z-10">Acrylic Tabletop Display</span>
                        </div>
                        {/* Realistic drop shadow on counter */}
                        <div className="w-[280px] h-2 bg-slate-900/10 rounded-full blur-xs mt-1" />
                      </div>
                    )}

                  </div>

                  {/* Print Recommendation Note */}
                  <p className="no-print-area text-[11px] text-slate-500 text-center mt-3 max-w-xs leading-relaxed">
                    Tip: Use high-quality photo paper. A4 / A5 tabletop acrylic T-stand frames are available at any office stationery store.
                  </p>

                </div>

              </div>
            </div>

            {/* Modal Actions Footer — Pinned at Bottom, NEVER Cut Off */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const upiString = staticQrAmountType === 'fixed' && parseFloat(staticQrAmount) > 0
                      ? `upi://pay?pa=${encodeURIComponent(standeeUpiId || profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(standeeBusinessName || profile?.business_name || profile?.owner_name || 'Merchant')}&am=${parseFloat(staticQrAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(standeeDeskTag || 'Store Counter')}`
                      : `upi://pay?pa=${encodeURIComponent(standeeUpiId || profile?.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(standeeBusinessName || profile?.business_name || profile?.owner_name || 'Merchant')}&cu=INR&tn=${encodeURIComponent(standeeDeskTag || 'Store Counter')}`;
                    navigator.clipboard.writeText(upiString);
                    showToast('Static UPI URI copied to clipboard!');
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy UPI URI
                </button>

                <button
                  type="button"
                  onClick={handleDownloadStandee}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Image
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowStaticQrModal(false)}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handlePrintStandee}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Standee (1-Page Isolated)
                </button>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
