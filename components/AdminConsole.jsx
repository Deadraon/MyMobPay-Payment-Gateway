'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';

// Modular Admin Sub-Components
import AdminHeader from './admin/AdminHeader';
import AdminSidebar from './admin/AdminSidebar';
import OverviewTab from './admin/OverviewTab';
import TransactionsTab from './admin/TransactionsTab';
import TransactionDrawer from './admin/TransactionDrawer';
import MerchantsTab from './admin/MerchantsTab';
import MerchantDrawer from './admin/MerchantDrawer';
import SignupsTab from './admin/SignupsTab';
import LoginsTab from './admin/LoginsTab';
import SubscriptionsTab from './admin/SubscriptionsTab';
import SystemTab from './admin/SystemTab';
import AuditTab from './admin/AuditTab';
import TeamTab from './admin/TeamTab';
import VerificationTab from './admin/VerificationTab';
import RiskTab from './admin/RiskTab';
import DisputesTab from './admin/DisputesTab';
import DeveloperTab from './admin/DeveloperTab';
import ReportsTab from './admin/ReportsTab';

import { 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Check,
  Smartphone
} from 'lucide-react';

export default function AdminConsole({ user, profile, onBackToMerchant }) {
  // ── Authentication States ──────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (user?.id || user?.email) return true;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_google_logged_in') === 'true' || 
             !!sessionStorage.getItem('admin_token');
    }
    return false;
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('admin_token') || '';
    return '';
  });

  // Ensure logged-in state stays synchronized if user prop is supplied
  useEffect(() => {
    if (user?.id || user?.email) {
      setIsLoggedIn(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_google_logged_in', 'true');
      }
    }
  }, [user]);

  // Active Navigation Tab
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      const valid = ['overview', 'transactions', 'merchants', 'signups', 'logins', 'subscriptions', 'system', 'audit', 'team', 'verification', 'risk', 'disputes', 'developer', 'reports'];
      if (valid.includes(hash)) return hash;
      return sessionStorage.getItem('admin_active_tab') || 'overview';
    }
    return 'overview';
  });

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    if (typeof window !== 'undefined') {
      window.location.hash = tabId;
      sessionStorage.setItem('admin_active_tab', tabId);
    }
  };

  // ── Core Data Collections ─────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [allSignups, setAllSignups] = useState([]);
  const [giftCodes, setGiftCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // System Settings States
  const [adminUpi, setAdminUpi] = useState('platform@upi');
  const [totalSubscriptionEarnings, setTotalSubscriptionEarnings] = useState(0);
  const [subscriptionOrdersCount, setSubscriptionOrdersCount] = useState(0);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');

  // ── Drawers & Modals ──────────────────────────────────────────────
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState(null);
  const [selectedMerchantForDrawer, setSelectedMerchantForDrawer] = useState(null);
  const [reconcileModalOrder, setReconcileModalOrder] = useState(null);
  const [manualUtrInput, setManualUtrInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // Toast Notification System
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Data Fetching Logic ───────────────────────────────────────────
  const fetchAllOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      showToast('Failed to load transaction ledger', 'error');
    }
  }, [showToast]);

  // Centralized Admin Authentication Headers Builder
  const getAuthHeaders = useCallback(async () => {
    const headers = {};
    let token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;

        // If we don't have a signed admin token in sessionStorage yet, exchange silently
        if (!token) {
          try {
            const loginRes = await fetch('/api/admin/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider: 'google', token: session.access_token })
            });
            if (loginRes.ok) {
              const loginData = await loginRes.json();
              if (loginData.token) {
                token = loginData.token;
                sessionStorage.setItem('admin_token', token);
                sessionStorage.setItem('admin_google_logged_in', 'true');
              }
            }
          } catch (e) {
            // continue with Bearer session.access_token
          }
        }
      }
    } catch (e) {
      // ignore
    }

    if (token) {
      headers['x-admin-token'] = token;
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }, []);

  const fetchMerchantsData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/merchants', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMerchants(data.merchants || []);
      setAllSignups(data.signups || data.all_signups || []);
    } catch (err) {
      console.error('Error fetching merchants & signups:', err);
    }
  }, [getAuthHeaders]);

  const fetchSubscriptionsAndGiftCodes = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/subscriptions', { headers });
      if (res.ok) {
        const data = await res.json();
        setGiftCodes(data.gift_codes || data.giftCodes || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  }, [getAuthHeaders]);

  const fetchSystemSettings = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/settings', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.upi_id) setAdminUpi(data.upi_id);
        if (data.totp_enabled !== undefined) setTotpEnabled(data.totp_enabled);
        if (data.total_earnings !== undefined) setTotalSubscriptionEarnings(data.total_earnings);
        if (data.subscription_orders) setSubscriptionOrdersCount(data.subscription_orders.length);
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
    }
  }, [getAuthHeaders]);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAllOrders(),
      fetchMerchantsData(),
      fetchSubscriptionsAndGiftCodes(),
      fetchSystemSettings()
    ]);
    setLoading(false);
  }, [fetchAllOrders, fetchMerchantsData, fetchSubscriptionsAndGiftCodes, fetchSystemSettings]);

  // Initial Load
  useEffect(() => {
    if (isLoggedIn) {
      refreshAllData();

      // Realtime listener on orders table
      const sub = supabase
        .channel('admin-orders-stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchAllOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(sub);
      };
    }
  }, [isLoggedIn, refreshAllData, fetchAllOrders]);

  // ── Executive Platform Metrics ────────────────────────────────────
  const platformMetrics = useMemo(() => {
    const verified = orders.filter(o => o.status === 'verified');
    const pending = orders.filter(o => o.status === 'pending');
    const rejected = orders.filter(o => o.status === 'rejected');

    const totalVolume = verified.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayVerified = verified.filter(o => new Date(o.created_at) >= todayStart);
    const todayRevenue = todayVerified.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    return {
      totalVolume,
      totalCount: orders.length,
      verifiedCount: verified.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalMerchants: merchants.length,
      activeMerchants: merchants.filter(m => m.subscription_status === 'active').length,
      today: {
        revenue: todayRevenue,
        count: todayVerified.length
      }
    };
  }, [orders, merchants]);

  // 7-Day Chart Data Compilation
  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startOfDay && orderDate <= endOfDay && o.status === 'verified';
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

      result.push({
        date: dateStr,
        revenue: Math.round(dayRevenue),
        count: dayOrders.length
      });
    }

    return result;
  }, [orders]);

  // Merchant Leaderboard Compilation
  const merchantLeaderboard = useMemo(() => {
    const merchantMap = new Map();

    for (const order of orders) {
      if (order.status !== 'verified') continue;
      const mId = order.merchant_id;
      if (!mId) continue;

      const current = merchantMap.get(mId) || { ordersCount: 0, salesVolume: 0 };
      current.ordersCount += 1;
      current.salesVolume += (parseFloat(order.amount) || 0);
      merchantMap.set(mId, current);
    }

    const leaderboard = [];
    for (const [mId, stats] of merchantMap.entries()) {
      const merchantObj = merchants.find(m => m.id === mId);
      if (merchantObj) {
        leaderboard.push({
          id: mId,
          businessName: merchantObj.business_name,
          upiId: merchantObj.upi_id,
          phone: merchantObj.phone_number,
          ordersCount: stats.ordersCount,
          salesVolume: stats.salesVolume,
          rawMerchant: merchantObj
        });
      }
    }

    return leaderboard.sort((a, b) => b.salesVolume - a.salesVolume);
  }, [orders, merchants]);

  // ── Administrative Action Handlers ────────────────────────────────
  
  // 1. Manual Order Verify
  const handleConfirmManualVerify = async () => {
    if (!reconcileModalOrder) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: reconcileModalOrder.id,
          action: 'verify',
          utr: manualUtrInput.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify');

      showToast(`Order #${reconcileModalOrder.id.slice(0, 8)} verified successfully!`, 'info');
      setReconcileModalOrder(null);
      setManualUtrInput('');
      setSelectedOrderForDrawer(null);
      fetchAllOrders();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Manual Order Reject
  const handleManualReject = async (orderId) => {
    if (!confirm('Are you sure you want to reject this order?')) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, action: 'reject' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject');

      showToast('Order marked as rejected', 'info');
      setSelectedOrderForDrawer(null);
      fetchAllOrders();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Re-send Webhook
  const handleResendWebhook = async (orderId) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, action: 'resend_webhook' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch webhook');

      showToast(data.message || 'Webhook dispatched successfully!', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Update Merchant Profile & Phone
  const handleUpdateMerchant = async (merchantId, payload) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({ merchantId, action: 'updateMerchant', payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      showToast('Merchant profile updated successfully!', 'info');
      setSelectedMerchantForDrawer(null);
      fetchMerchantsData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Rotate Merchant API Key
  const handleRotateApiKey = async (merchantId) => {
    if (!confirm('Are you sure you want to generate a new API key? Any existing backend integrations will need the new key.')) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({ merchantId, action: 'rotateApiKey' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rotate key');

      showToast('API Key rotated successfully!', 'info');
      fetchMerchantsData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Extend Subscription
  const handleExtendSubscription = async (merchantId, days, currentExpiry) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({ merchantId, action: 'extendSubscription', payload: { days, currentExpiry } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend subscription');

      showToast(`Extended subscription by +${days} days!`, 'info');
      fetchMerchantsData();
      fetchSubscriptionsAndGiftCodes();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Toggle Freeze / Status
  const handleToggleStatus = async (merchantId, newStatus) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({ merchantId, action: 'toggleSubscription', status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      showToast(`Merchant account set to ${newStatus}`, 'info');
      fetchMerchantsData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. 1-Click Send Outreach Email
  const handleSendOutreachEmail = async (email, name) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'sendOutreachEmail',
          payload: { to: email, recipientName: name }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');

      showToast(`Outreach email dispatched to ${email}!`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 9. Update Phone Directly
  const handleUpdatePhone = async (userId, phone) => {
    await handleUpdateMerchant(userId, { phone_number: phone });
  };

  // 10. Gift Code Operations
  const handleCreateGiftCode = async (codePayload) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create_gift_code', ...codePayload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create code');

      showToast(`Gift code "${codePayload.code}" created!`, 'info');
      fetchSubscriptionsAndGiftCodes();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGiftCode = async (code) => {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete_gift_code', code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete code');

      showToast('Promo code deleted', 'info');
      fetchSubscriptionsAndGiftCodes();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 11. System UPI & 2FA
  const handleUpdateAdminUpi = async (newUpi) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'update_upi', upi_id: newUpi })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update VPA');

      setAdminUpi(newUpi);
      showToast('Platform receiving UPI updated successfully!', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateTotp = async () => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate_totp' })
      });
      const data = await res.json();
      if (data.secret) {
        setTotpSecret(data.secret);
        setTotpQrUrl(`otpauth://totp/MyMobPay%20Admin?secret=${data.secret}&issuer=MyMobPay`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableTotp = async (code) => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'verify_totp', token: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid TOTP code');

      setTotpEnabled(true);
      setTotpSecret('');
      showToast('Google Authenticator 2FA activated!', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!confirm('Disable 2FA protection for the Master Console?')) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'disable_totp' })
      });
      if (res.ok) {
        setTotpEnabled(false);
        showToast('2FA protection disabled', 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_google_logged_in');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_active_tab');
    setIsLoggedIn(false);
    if (onBackToMerchant) onBackToMerchant();
  };

  // ── Render Master Console ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-600/15 selection:text-blue-600 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
          toast.type === 'error' ? 'bg-rose-900 text-white border-rose-800' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <AdminHeader
        user={user}
        profile={profile}
        onBackToMerchant={onBackToMerchant}
        onLogout={handleLogout}
        onRefresh={refreshAllData}
        loading={loading}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        totalPendingOrders={platformMetrics.pendingCount}
      />

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row items-start gap-6">
        
        {/* Navigation Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingOrdersCount={platformMetrics.pendingCount}
          unonboardedSignupsCount={allSignups.filter(s => !s.phone_number || s.phone_number.trim() === '').length}
          activeMerchantsCount={platformMetrics.activeMerchants}
        />

        {/* Tab Content Display Area */}
        <main className="flex-1 min-w-0">
          
          {activeTab === 'overview' && (
            <OverviewTab
              platformMetrics={platformMetrics}
              chartData={chartData}
              merchantLeaderboard={merchantLeaderboard}
              recentOrders={orders.slice(0, 10)}
              merchants={merchants}
              onSelectOrder={(order) => setSelectedOrderForDrawer(order)}
              onSelectMerchant={(m) => {
                const target = merchants.find(item => item.id === m.id) || m.rawMerchant;
                setSelectedMerchantForDrawer(target);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              orders={orders}
              merchants={merchants}
              loading={loading}
              onSelectOrder={(order) => setSelectedOrderForDrawer(order)}
              onManualVerify={(order) => {
                setReconcileModalOrder(order);
                setManualUtrInput(order.utr || '');
              }}
              onManualReject={handleManualReject}
              onResendWebhook={handleResendWebhook}
              showToast={showToast}
            />
          )}

          {activeTab === 'merchants' && (
            <MerchantsTab
              merchants={merchants}
              loading={loading}
              onSelectMerchant={(m) => setSelectedMerchantForDrawer(m)}
              onToggleStatus={handleToggleStatus}
              actionLoading={actionLoading}
              showToast={showToast}
            />
          )}

          {activeTab === 'signups' && (
            <SignupsTab
              allSignups={allSignups}
              loading={loading}
              onSendOutreachEmail={handleSendOutreachEmail}
              onUpdatePhone={handleUpdatePhone}
              actionLoading={actionLoading}
              showToast={showToast}
            />
          )}

          {activeTab === 'logins' && (
            <LoginsTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
              onSelectMerchant={setSelectedMerchantForDrawer}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsTab
              merchants={merchants}
              giftCodes={giftCodes}
              onExtendSubscription={handleExtendSubscription}
              onCreateGiftCode={handleCreateGiftCode}
              onDeleteGiftCode={handleDeleteGiftCode}
              actionLoading={actionLoading}
              showToast={showToast}
            />
          )}

          {activeTab === 'system' && (
            <SystemTab
              adminUpi={adminUpi}
              setAdminUpi={setAdminUpi}
              onUpdateAdminUpi={handleUpdateAdminUpi}
              totalSubscriptionEarnings={totalSubscriptionEarnings}
              subscriptionOrdersCount={subscriptionOrdersCount}
              totpEnabled={totpEnabled}
              totpSecret={totpSecret}
              totpQrUrl={totpQrUrl}
              onGenerateTotp={handleGenerateTotp}
              onEnableTotp={handleEnableTotp}
              onDisableTotp={handleDisableTotp}
              actionLoading={actionLoading}
              showToast={showToast}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'team' && (
            <TeamTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'verification' && (
            <VerificationTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'risk' && (
            <RiskTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'disputes' && (
            <DisputesTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'developer' && (
            <DeveloperTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              showToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          )}

        </main>

      </div>

      {/* Transaction Slide-Over Drawer */}
      {selectedOrderForDrawer && (
        <TransactionDrawer
          order={selectedOrderForDrawer}
          merchant={merchants.find(m => m.id === selectedOrderForDrawer.merchant_id)}
          onClose={() => setSelectedOrderForDrawer(null)}
          onManualVerify={(order) => {
            setReconcileModalOrder(order);
            setManualUtrInput(order.utr || '');
          }}
          onManualReject={handleManualReject}
          onResendWebhook={handleResendWebhook}
          actionLoading={actionLoading}
          showToast={showToast}
        />
      )}

      {/* Merchant Slide-Over Drawer */}
      {selectedMerchantForDrawer && (
        <MerchantDrawer
          merchant={selectedMerchantForDrawer}
          onClose={() => setSelectedMerchantForDrawer(null)}
          onUpdateMerchant={handleUpdateMerchant}
          onRotateApiKey={handleRotateApiKey}
          onExtendSubscription={handleExtendSubscription}
          actionLoading={actionLoading}
          showToast={showToast}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* Manual UTR Reconciliation Modal */}
      {reconcileModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Manual UTR Reconciliation
              </h3>
              <button 
                onClick={() => setReconcileModalOrder(null)} 
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Verify payment of <strong>₹{reconcileModalOrder.amount}</strong> for Order #{reconcileModalOrder.id.slice(0, 8)}. 
              This will update the order to <strong className="text-emerald-600">verified</strong>, notify the merchant webhook, and update their dashboard.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-500 font-semibold">12-Digit Bank UTR (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank for auto-generated manual reference"
                value={manualUtrInput}
                onChange={(e) => setManualUtrInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReconcileModalOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmManualVerify}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
              >
                Confirm Verification &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
