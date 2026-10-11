'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import QRCode from 'react-qr-code';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  Lock, 
  Unlock, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  LogOut, 
  User, 
  Phone, 
  FileText,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Activity,
  Check,
  Settings,
  ShieldAlert,
  Store,
  ArrowUpRight,
  ExternalLink,
  Menu,
  X,
  Shield,
  Key,
  Mail,
  Zap,
  CheckCircle,
  Gift,
  Tag,
  Calendar,
  Percent,
  Trash2,
  Plus,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = 'var(--text-primary)' }) => (
  <svg viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    {/* 3D Ribbon M Mark */}
    <image
      href="/logos/mymobpay_mark.png"
      x="2"
      y="2"
      width="38"
      height="36"
      preserveAspectRatio="xMidYMid meet"
    />
    <text
      x="44"
      y="27"
      fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="800"
      fontSize="26"
      fill={textColor}
      letterSpacing="-0.5"
    >
      MyMobPay
    </text>
  </svg>
);

export default function AdminConsole({ user, profile, onBackToMerchant }) {
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_google_logged_in') === 'true' || 
             !!sessionStorage.getItem('admin_token');
    }
    return false;
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: overview, transactions, merchants, subscriptions, config
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      const validTabs = ['overview', 'transactions', 'merchants', 'subscriptions', 'config'];
      if (validTabs.includes(hash)) return hash;
      const saved = sessionStorage.getItem('admin_active_tab');
      if (validTabs.includes(saved)) return saved;
    }
    return 'overview';
  });

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_active_tab', tab);
      window.history.replaceState(null, '', `${window.location.pathname}#${tab}`);
    }
  }, []);

  // Passwordless Login UI states
  const [loginMode, setLoginMode] = useState('totp'); // 'totp' | 'google'

  // Modern Toast notification state
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database Data states
  const [orders, setOrders] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState('all');

  // Revealed keys mapping
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Manual actions on orders
  const [actionLoading, setActionLoading] = useState(null);
  const [manualUtr, setManualUtr] = useState('');
  const [utrPromptId, setUtrPromptId] = useState(null);

  // Double Security & platform config states
  const [require2fa, setRequire2fa] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [adminUpi, setAdminUpi] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [qrCodeUri, setQrCodeUri] = useState('');
  
  // Verification states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Settings API states
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Platform Metrics
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  
  // Google User session
  const [googleUser, setGoogleUser] = useState(null);

  // Subscription & Gift Codes states
  const [subscriptionsList, setSubscriptionsList] = useState([]);
  const [giftCodesList, setGiftCodesList] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsSearchQuery, setSubsSearchQuery] = useState('');
  const [subsStatusFilter, setSubsStatusFilter] = useState('all');
  const [selectedMerchantForEdit, setSelectedMerchantForEdit] = useState(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [extendStatus, setExtendStatus] = useState('active');
  const [subsActionLoading, setSubsActionLoading] = useState(false);
  const [newGiftCode, setNewGiftCode] = useState({
    code: '',
    discountType: 'free',
    discountValue: 0,
    planDays: 30,
    maxUses: 10,
    description: ''
  });
  const [codeActionLoading, setCodeActionLoading] = useState(false);

  // Helper to dynamically build authorization headers (admin session token vs OAuth token)
  const getAuthHeaders = useCallback(async () => {
    const headers = {};
    const adminToken = sessionStorage.getItem('admin_token');
    const isGoogleLoggedIn = sessionStorage.getItem('admin_google_logged_in') === 'true';

    if (isGoogleLoggedIn) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
        headers['x-admin-token'] = adminToken;
      }
    } else if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      headers['x-admin-token'] = adminToken;
    }
    return headers;
  }, []);

  // Fetch Platform settings configurations
  const fetchSettings = useCallback(async (isSilent = false) => {
    if (!isLoggedIn) return;
    if (!isSilent) setSettingsLoading(true);
    setSettingsError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/settings', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');

      setAdminUpi(data.upi_id || '');
      setTotpEnabled(data.totp_enabled || false);
      setAdminEmail(data.admin_email || '');
      setTotalEarnings(data.total_earnings || 0);
      setSubscriptionOrders(data.subscription_orders || []);
    } catch (err) {
      console.error('fetchSettings error:', err);
      setSettingsError('Could not load platform payment configurations.');
    } finally {
      setSettingsLoading(false);
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Fetch Subscription Records & Gift Codes
  const fetchSubscriptions = useCallback(async (isSilent = false) => {
    if (!isLoggedIn) return;
    if (!isSilent && subscriptionsList.length === 0) {
      setSubsLoading(true);
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/subscriptions', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch subscriptions');
      const incMerchants = data.merchants || [];
      setSubscriptionsList(incMerchants.length > 0 ? incMerchants : (merchants.length > 0 ? merchants : []));
      setGiftCodesList(data.giftCodes || data.gift_codes || []);
    } catch (err) {
      console.error('fetchSubscriptions error:', err);
      setSubscriptionsList(prev => prev.length > 0 ? prev : (merchants.length > 0 ? merchants : []));
    } finally {
      setSubsLoading(false);
    }
  }, [isLoggedIn, getAuthHeaders, subscriptionsList.length, merchants]);

  // Create Gift Code
  const handleCreateGiftCode = async (e) => {
    e.preventDefault();
    if (!newGiftCode.code.trim()) {
      showToast('Please enter a coupon/gift code', 'error');
      return;
    }
    setCodeActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create_gift_code',
          code: newGiftCode.code.trim().toUpperCase(),
          discountType: newGiftCode.discountType,
          discountValue: Number(newGiftCode.discountValue) || 0,
          planDays: Number(newGiftCode.planDays) || 30,
          maxUses: Number(newGiftCode.maxUses) || 1,
          description: newGiftCode.description
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create gift code');
      setGiftCodesList(data.giftCodes || data.gift_codes || []);
      setNewGiftCode({ code: '', discountType: 'free', discountValue: 0, planDays: 30, maxUses: 10, description: '' });
      showToast('Gift code created successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Error creating gift code', 'error');
    } finally {
      setCodeActionLoading(false);
    }
  };

  // Delete Gift Code
  const handleDeleteGiftCode = async (code) => {
    if (!confirm(`Are you sure you want to delete gift code "${code}"?`)) return;
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'delete_gift_code',
          code
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete code');
      setGiftCodesList(data.giftCodes || data.gift_codes || []);
    } catch (err) {
      showToast(err.message || 'Error deleting gift code', 'error');
    }
  };

  // Extend or Grant Merchant Subscription
  const handleExtendSubscription = async (e) => {
    e.preventDefault();
    if (!selectedMerchantForEdit) return;
    setSubsActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'extend_subscription',
          merchantId: selectedMerchantForEdit.id,
          days: Number(extendDays) || 30,
          status: extendStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');
      
      setSubscriptionsList(prev => prev.map(m => m.id === selectedMerchantForEdit.id ? { ...m, ...data.merchant } : m));
      setIsExtendModalOpen(false);
      setSelectedMerchantForEdit(null);
      showToast('Subscription successfully updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update subscription', 'error');
    } finally {
      setSubsActionLoading(false);
    }
  };

  const verifyingRef = React.useRef(false);
  const lastVerifiedTokenRef = React.useRef(null);

  // Verify a Supabase Google session against backend admin authorization
  const verifyGoogleSession = useCallback(async (session) => {
    if (!session?.access_token) return;
    if (verifyingRef.current || lastVerifiedTokenRef.current === session.access_token) return;
    verifyingRef.current = true;
    lastVerifiedTokenRef.current = session.access_token;

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'google', 
          token: session.access_token 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_google_logged_in', 'true');
        if (data.token) {
          sessionStorage.setItem('admin_token', data.token);
        }
        setGoogleUser(session.user);
        setIsLoggedIn(true);
        setAuthError('');
        // Clean URL hash fragment if present from OAuth redirect while keeping tab
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
          const tab = sessionStorage.getItem('admin_active_tab') || 'overview';
          window.history.replaceState(null, '', `${window.location.pathname}#${tab}`);
        }
      } else {
        const errorMsg = data.error || 'Google account is not authorized as an administrator.';
        setAuthError(errorMsg);
        sessionStorage.removeItem('admin_google_logged_in');
        setGoogleUser(null);
        setIsLoggedIn(false);
        lastVerifiedTokenRef.current = null;
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Google verification error on mount:', e);
      setAuthError('Connection error during Google administrator verification.');
      lastVerifiedTokenRef.current = null;
    } finally {
      verifyingRef.current = false;
      setAuthLoading(false);
    }
  }, []);

  // Sync auth state from Google OAuth session on mount and on auth change
  useEffect(() => {
    // Check for error parameters in URL (e.g. user cancelled Google OAuth)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorMsg = urlParams.get('error_description') || urlParams.get('error') || hashParams.get('error_description') || hashParams.get('error');
      if (errorMsg) {
        setAuthError(decodeURIComponent(errorMsg));
      }
    }

    // Check existing active session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        verifyGoogleSession(session);
      }
    }).catch(() => {});

    // Subscribe to auth state changes for seamless OAuth redirect handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && session.user) {
        verifyGoogleSession(session);
      } else if (event === 'SIGNED_OUT') {
        if (sessionStorage.getItem('admin_google_logged_in')) {
          sessionStorage.removeItem('admin_google_logged_in');
          setIsLoggedIn(false);
          setGoogleUser(null);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [verifyGoogleSession]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Fetch all registered merchants (bypassing RLS via our secure API)
  const fetchMerchants = useCallback(async (isSilent = false) => {
    if (!isLoggedIn) return;
    if (!isSilent && merchants.length === 0) {
      setMerchantsLoading(true);
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/merchants', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch merchants');
      const list = data.merchants || [];
      setMerchants(list);
      // Seed subscriptionsList if empty
      setSubscriptionsList(prev => prev.length === 0 ? list : prev);
    } catch (err) {
      console.error('Error fetching merchants:', err);
      if (merchants.length === 0) {
        setError('Could not fetch merchant records from server.');
      }
    } finally {
      setMerchantsLoading(false);
    }
  }, [isLoggedIn, getAuthHeaders, merchants.length]);

  // Fetch all orders
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isLoggedIn) return;
    if (!isSilent && orders.length === 0) {
      setLoading(true);
    }
    try {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setOrders(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (orders.length === 0) {
        setError('Could not fetch transaction logs from database.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, orders.length]);

  // Unified Refresh
  const handleRefreshAll = useCallback((isSilent = false) => {
    fetchOrders(isSilent);
    fetchMerchants(isSilent);
    fetchSettings(isSilent);
    fetchSubscriptions(isSilent);
  }, [fetchOrders, fetchMerchants, fetchSettings, fetchSubscriptions]);

  // Trigger fetch on login and silent background refresh
  useEffect(() => {
    if (isLoggedIn) {
      handleRefreshAll(false);
      
      // Auto-refresh silently every 20 seconds without wiping UI or displaying loaders
      const interval = setInterval(() => {
        handleRefreshAll(true);
      }, 20000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, handleRefreshAll]);


  // Passwordless Authenticator App submission login (Option 2)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const cleanCode = String(totpCode || '').trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setAuthError('Please enter the 6-digit code shown in your Authenticator app.');
      return;
    }

    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'totp',
          totpCode: cleanCode
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token) {
        sessionStorage.setItem('admin_token', data.token);
      }
      setIsLoggedIn(true);
      setTotpCode('');
      showToast('Authenticated successfully with Google Authenticator', 'success');
    } catch (err) {
      setAuthError(err.message || 'Invalid 6-digit Authenticator code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setAuthError(err.message || 'An error occurred during Google authentication.');
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_google_logged_in');
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setRequire2fa(false);
    setTotpCode('');
    setOrders([]);
    setMerchants([]);
    setGoogleUser(null);
  };

  // Toggle Merchant subscription status
  const handleToggleSubscription = async (merchantId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          merchantId,
          action: 'toggleSubscription',
          status: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription status');

      // Update local state instantly
      setMerchants(prev => prev.map(m => m.id === merchantId ? data.merchant : m));
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  // Handle manual verify/reject actions on orders
  const handleOrderAction = async (orderId, action, utrVal = '') => {
    setActionLoading(orderId);
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId,
          action,
          utr: utrVal
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      // Update local state instantly
      setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      setUtrPromptId(null);
      setManualUtr('');
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger modal validation for settings changes
  const openVerification = (action) => {
    setPendingAction(action);
    setIsVerificationModalOpen(true);
    setSettingsError('');
    setSettingsSuccess('');
  };

  const handleVerifyAndConfirm = async (e) => {
    e.preventDefault();
    setIsVerificationModalOpen(false);
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: pendingAction.type,
          ...pendingAction.data
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action verification failed.');

      setSettingsSuccess(data.message || 'Configurations updated successfully.');
      await fetchSettings();
      
      if (pendingAction.type === 'enable_totp') {
        setTotpSecret('');
        setTotpVerifyCode('');
      }
    } catch (err) {
      setSettingsError(err.message || 'Failed to apply setting change.');
    } finally {
      setSettingsLoading(false);
      setPendingAction(null);
    }
  };

  const handleGenerateTotpSecret = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'generate_totp'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate 2FA token');

      setTotpSecret(data.secret);
      const uri = `otpauth://totp/MyMobPay%20Admin?secret=${data.secret}&issuer=MyMobPay`;
      setQrCodeUri(uri);
    } catch (err) {
      setSettingsError(err.message || 'Failed to retrieve 2FA key details.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Toggle API Key visibility
  const toggleKeyVisibility = (id) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy API key to clipboard
  const handleCopyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Calculations for Metrics Cards
  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVerifiedOrders = orders.filter(o => {
      if (o.status !== 'verified') return false;
      const orderDate = new Date(o.created_at);
      return orderDate >= today;
    });

    const revenue = todayVerifiedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const count = todayVerifiedOrders.length;

    return { revenue, count };
  };

  const platformMetrics = useMemo(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const verifiedCount = orders.filter(o => o.status === 'verified').length;
    const totalVolume = orders
      .filter(o => o.status === 'verified')
      .reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const activeMerchants = merchants.filter(m => m.subscription_status === 'active').length;
    
    const today = getTodayStats();

    return {
      pendingCount,
      verifiedCount,
      totalVolume,
      activeMerchants,
      totalMerchants: merchants.length,
      today
    };
  }, [orders, merchants]);

  // Compile Platform-Wide Sales Data for Super Admin Area Chart
  const chartData = useMemo(() => {
    const verified = orders.filter(o => o.status === 'verified');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      days.push({
        date: dateStr,
        rawDate: d,
        revenue: 0,
        orders: 0
      });
    }

    verified.forEach(order => {
      const orderDate = new Date(order.created_at);
      days.forEach(day => {
        const d1 = new Date(orderDate);
        d1.setHours(0, 0, 0, 0);
        const d2 = new Date(day.rawDate);
        d2.setHours(0, 0, 0, 0);
        
        if (d1.getTime() === d2.getTime()) {
          day.revenue += parseFloat(order.amount);
          day.orders += 1;
        }
      });
    });

    return days.map(({ date, revenue, orders }) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
      orders
    }));
  }, [orders]);

  const AdminCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl z-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-base font-black text-slate-900 mt-1.5 flex items-baseline">
            <span className="text-xs font-bold text-slate-400 mr-0.5">₹</span>
            {payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">
            {payload[0].payload.orders} {payload[0].payload.orders === 1 ? 'order' : 'orders'} processed
          </p>
        </div>
      );
    }
    return null;
  };

  // Compile Merchant Sales stats for Leaderboard
  const merchantLeaderboard = useMemo(() => {
    const leaderboard = merchants.map(m => {
      const merchantOrders = orders.filter(o => o.merchant_id === m.id && o.status === 'verified');
      const salesVolume = merchantOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
      return {
        id: m.id,
        businessName: m.business_name,
        upiId: m.upi_id,
        status: m.subscription_status,
        salesVolume,
        ordersCount: merchantOrders.length
      };
    });

    // Sort by sales volume descending
    return leaderboard.sort((a, b) => b.salesVolume - a.salesVolume).slice(0, 5);
  }, [merchants, orders]);

  // Filtering orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      // Merchant filter
      if (selectedMerchantFilter !== 'all' && o.merchant_id !== selectedMerchantFilter) return false;
      
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = o.id?.toLowerCase().includes(q);
        const matchName = o.customer_name?.toLowerCase().includes(q);
        const matchPhone = o.customer_phone?.toLowerCase().includes(q);
        const matchUtr = o.utr?.toLowerCase().includes(q);
        const matchNote = o.note?.toLowerCase().includes(q);
        const matchAmount = o.amount?.toString().includes(q);
        
        return matchId || matchName || matchPhone || matchUtr || matchNote || matchAmount;
      }
      
      return true;
    });
  }, [orders, statusFilter, selectedMerchantFilter, searchQuery]);

  // Filtering merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      if (merchantSearchQuery.trim()) {
        const q = merchantSearchQuery.toLowerCase().trim();
        const matchName = m.business_name?.toLowerCase().includes(q);
        const matchUpi = m.upi_id?.toLowerCase().includes(q);
        const matchId = m.id?.toLowerCase().includes(q);
        return matchName || matchUpi || matchId;
      }
      return true;
    });
  }, [merchants, merchantSearchQuery]);

  // Unified Subscriptions list: use subscriptionsList if loaded, fallback to merchants
  const activeSubscriptions = useMemo(() => {
    return subscriptionsList.length > 0 ? subscriptionsList : merchants;
  }, [subscriptionsList, merchants]);

  const brandColor = '#3B82F6'; // Unified Website Blue Brand Color

  if (!isLoggedIn) {
    /* Minimalist, Clean Enterprise Admin Console — Single Centered Card */
    return (
      <div className="min-h-screen bg-[#f4f6fb] text-[#131b2e] flex flex-col justify-center items-center px-4 py-12 font-sans relative">
        <div className="w-full flex flex-col items-center max-w-[380px] relative z-10">

          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <MyMobPayLogo className="h-9 w-auto" textColor="#0f1b2d" />
          </div>

          {/* Centered Auth Card */}
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-7 space-y-5">
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#131b2e] tracking-tight">
                Super Admin Console
              </h1>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="p-1 bg-[#eaedff] rounded-xl grid grid-cols-2 gap-1 border border-[#dae2fd]/70">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('totp');
                  setAuthError('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  loginMode === 'totp'
                    ? 'bg-white text-[#0045de] shadow-sm'
                    : 'text-[#44474d] hover:text-[#131b2e]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>Authenticator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('google');
                  setAuthError('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  loginMode === 'google'
                    ? 'bg-white text-[#0045de] shadow-sm'
                    : 'text-[#44474d] hover:text-[#131b2e]'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" width="14" height="14" viewBox="0 0 24 24">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.57h3.32c1.94,-1.78 3.05,-4.4 3.05,-7.47c0,-0.3 -0.03,-0.6 -0.08,-0.9Z" fill="#4285F4" />
                  <path d="M12,20.7c2.35,0 4.32,-0.78 5.76,-2.13l-3.32,-2.57c-0.92,0.62 -2.1,0.98 -3.44,0.98c-2.28,0 -4.21,-1.54 -4.9,-3.61H2.68v2.66c1.47,2.92 4.5,4.67 7.92,4.67Z" fill="#34A853" />
                  <path d="M7.1,13.38c-0.18,-0.52 -0.28,-1.09 -0.28,-1.68c0,-0.59 0.1,-1.16 0.28,-1.68V7.36H2.68C2.06,8.6 1.7,10.01 1.7,11.7c0,1.69 0.36,3.1 0.98,4.34l3.74,-2.91c-0.18,-0.52 -0.18,-0.75 -0.32,-1.75Z" fill="#FBBC05" />
                  <path d="M12,5.68c1.28,0 2.43,0.44 3.34,1.3l2.5,-2.5C16.31,3.07 14.34,2.7 12,2.7c-3.42,0 -6.45,1.75 -7.92,4.67l4.4,3.38C9.17,7.22 10.1,5.68 12,5.68Z" fill="#EA4335" />
                </svg>
                <span>Google SSO</span>
              </button>
            </div>

            {authLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-7 h-7 animate-spin text-[#2c60ff]" />
                <p className="text-xs font-semibold text-[#131b2e]">Authenticating...</p>
              </div>
            ) : loginMode === 'google' ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#2c60ff] text-[#131b2e] font-semibold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-3 text-xs active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" width="20" height="20" viewBox="0 0 24 24">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.57h3.32c1.94,-1.78 3.05,-4.4 3.05,-7.47c0,-0.3 -0.03,-0.6 -0.08,-0.9Z" fill="#4285F4" />
                    <path d="M12,20.7c2.35,0 4.32,-0.78 5.76,-2.13l-3.32,-2.57c-0.92,0.62 -2.1,0.98 -3.44,0.98c-2.28,0 -4.21,-1.54 -4.9,-3.61H2.68v2.66c1.47,2.92 4.5,4.67 7.92,4.67Z" fill="#34A853" />
                    <path d="M7.1,13.38c-0.18,-0.52 -0.28,-1.09 -0.28,-1.68c0,-0.59 0.1,-1.16 0.28,-1.68V7.36H2.68C2.06,8.6 1.7,10.01 1.7,11.7c0,1.69 0.36,3.1 0.98,4.34l3.74,-2.91c-0.18,-0.52 -0.18,-0.75 -0.32,-1.75Z" fill="#FBBC05" />
                    <path d="M12,5.68c1.28,0 2.43,0.44 3.34,1.3l2.5,-2.5C16.31,3.07 14.34,2.7 12,2.7c-3.42,0 -6.45,1.75 -7.92,4.67l4.4,3.38C9.17,7.22 10.1,5.68 12,5.68Z" fill="#EA4335" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="Enter 6-digit PIN"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#f8fafc] border border-slate-300 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono font-bold text-[#131b2e] focus:bg-white focus:border-[#2c60ff] focus:ring-2 focus:ring-[#2c60ff]/20 outline-none transition-all placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans placeholder:font-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || totpCode.trim().length !== 6}
                  className="w-full h-11 bg-[#2c60ff] hover:bg-[#0045de] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Code</span>
                </button>

                {onBackToMerchant && (
                  <div className="pt-2 text-center border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onBackToMerchant}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Return to Merchant Dashboard</span>
                    </button>
                  </div>
                )}
              </form>
            )}

          </div>

        </div>

      </div>
    );
  }

  /* LOGGED IN DASHBOARD */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans flex flex-col md:flex-row selection:bg-blue-500/10">
      
      {/* ═══════════════════════════════════════════════════════════
         VERTICAL SIDEBAR (Desktop: md:flex)
         ═══════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col justify-between w-64 xl:w-72 bg-white border-r border-slate-200/80 h-screen sticky top-0 z-30 shadow-[1px_0_10px_rgba(0,0,0,0.02)] select-none shrink-0">
        
        {/* Top: Logo & System Indicator */}
        <div className="p-5 border-b border-slate-100 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <MyMobPayLogo className="w-32 xl:w-36 h-auto" />
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-black text-[9px] uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Admin</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Gateway Management Console
          </p>
        </div>

        {/* Middle: Scrollable Menu Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Main Modules */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 pb-1">
              Platform Modules
            </p>

            {[
              { id: 'overview', label: 'Platform Stats', icon: Activity, count: null },
              { id: 'transactions', label: 'Global Orders', icon: FileText, count: orders.length > 0 ? orders.length : null },
              { id: 'merchants', label: 'Merchants (SaaS)', icon: Store, count: merchants.length > 0 ? merchants.length : null },
              { id: 'subscriptions', label: 'Subscriptions & Gifts', icon: Gift, count: giftCodesList.length > 0 ? `${giftCodesList.length} codes` : null },
              { id: 'config', label: 'System Config', icon: Settings, count: null },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== null && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 pb-1">
              Quick Portals
            </p>
            <button
              onClick={() => onBackToMerchant ? onBackToMerchant() : window.location.href = '/dashboard'}
              type="button"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Merchant Console</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
            </button>

            <a
              href="/pay?type=subscription"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <div className="flex items-center gap-3">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
                <span>Live Checkout Demo</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

        </div>

        {/* Bottom: User Card & Quick Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-blue-500/20 shrink-0">
              {googleUser?.email ? googleUser.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">
                {googleUser?.email || 'Platform Owner'}
              </p>
              <span className="inline-block text-[9px] font-extrabold uppercase text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                Super Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleRefreshAll(false)}
              disabled={loading || merchantsLoading || subsLoading}
              className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Refresh Platform Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading || merchantsLoading || subsLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-2 px-3 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ═══════════════════════════════════════════════════════════
         MOBILE TOP BAR (md:hidden)
         ═══════════════════════════════════════════════════════════ */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <MyMobPayLogo className="w-28 h-auto" />
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-extrabold uppercase">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRefreshAll(false)}
            disabled={loading || merchantsLoading || subsLoading}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || merchantsLoading || subsLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
         MOBILE DRAWER SLIDE-OVER (md:hidden)
         ═══════════════════════════════════════════════════════════ */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-start animate-fadeIn">
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-slideIn">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <MyMobPayLogo className="w-32 h-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Navigation Menu</p>
                {[
                  { id: 'overview', label: 'Platform Stats', icon: Activity },
                  { id: 'transactions', label: 'Global Orders', icon: FileText },
                  { id: 'merchants', label: 'Merchants (SaaS)', icon: Store },
                  { id: 'subscriptions', label: 'Subscriptions & Gifts', icon: Gift },
                  { id: 'config', label: 'System Config', icon: Settings },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold border border-slate-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Platform</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         MAIN WORKSPACE (Right Area)
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        
        {/* Desktop Top Workspace Title Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4.5 bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div>
            <h1 className="text-lg font-black text-slate-900">
              {activeTab === 'overview' && 'Platform Performance & Leaderboards'}
              {activeTab === 'transactions' && 'Global Transaction Logs'}
              {activeTab === 'merchants' && 'Registered Merchants Directory'}
              {activeTab === 'subscriptions' && 'Subscription & Gift Codes Manager'}
              {activeTab === 'config' && 'System Configuration & Security'}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              MyMobPay SaaS Platform Gateway • Live Operational Mode
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Gateway Active</span>
            </div>

            <button
              onClick={() => handleRefreshAll(false)}
              disabled={loading || merchantsLoading || subsLoading}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading || merchantsLoading || subsLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {onBackToMerchant && (
              <button
                onClick={onBackToMerchant}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 hover:bg-blue-100 text-blue-700 transition-all text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Merchant Console</span>
              </button>
            )}
          </div>
        </div>

      {/* Main Admin View */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* Error warning */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 1: OVERVIEW & PLATFORM LEADERBOARDS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Summary Metrics Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Platform volume */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Sales Volume</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-baseline">
                      <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                      <span>{platformMetrics.totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">{platformMetrics.verifiedCount} aggregate payments processed</p>
              </div>

              {/* Today's Sales */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Revenue</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-baseline">
                      <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                      <span>{platformMetrics.today.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold">+{platformMetrics.today.count} global checkouts today</p>
              </div>

              {/* Total SaaS Tenants */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Merchants</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">{platformMetrics.totalMerchants}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Store className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">{platformMetrics.activeMerchants} active subscriptions</p>
              </div>

              {/* Awaiting Match */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Verification</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">{platformMetrics.pendingCount}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-amber-500 font-bold animate-pulse">Pending automatic verification triggers</p>
              </div>

            </section>

            {/* Platform Performance Chart Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                    Platform Growth Curve
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Platform-wide aggregate daily sales and transaction frequency trends over the last 7 days.
                  </p>
                </div>
              </div>

              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAdminRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dx={-5}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip content={<AdminCustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorAdminRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Merchant Leaderboard & Platform Health split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Leaderboard Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Top Performing Merchants
                  </h4>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">SaaS STATS</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Business Name</th>
                        <th className="px-5 py-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">UPI ID Address</th>
                        <th className="px-5 py-3 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Verified Orders</th>
                        <th className="px-5 py-3 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Volume (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {merchantsLoading && merchantLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-5 py-6 text-center text-xs text-slate-500">
                            Loading leaderboards...
                          </td>
                        </tr>
                      ) : merchantLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-5 py-6 text-center text-xs text-slate-500 font-medium">
                            No verified merchant sales logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        merchantLeaderboard.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : idx === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-50 text-slate-500'}`}>
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-900">{m.businessName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-medium text-slate-600">
                              {m.upiId}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-center text-slate-700">
                              {m.ordersCount}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-black text-right text-blue-600 flex items-center justify-end gap-0.5">
                              <span className="text-[10px] text-slate-400 font-bold">₹</span>
                              <span>{m.salesVolume.toFixed(2)}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform Health / Webhook Diagnostics */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-blue-600" /> Platform Services
                </h4>

                <div className="space-y-4">
                  {[
                    { name: 'Supabase Database', desc: 'Secure PostgreSQL & RLS Core', status: 'operational', val: 'Connected' },
                    { name: 'Outbound Webhooks', desc: 'Outbound merchant signatures', status: 'operational', val: 'HMAC-SHA256' },
                    { name: 'Bank Notification Hub', desc: 'Gmail IMAP parsing system', status: 'operational', val: 'Active' },
                    { name: 'Platform Billing System', desc: 'Zero-Fee billing routers', status: 'operational', val: 'Active' }
                  ].map((service, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{service.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{service.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                          ✓ {service.val}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 2: GLOBAL TRANSACTION LOGS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
            
            {/* Filters and Searches */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 tracking-wide">Global Transaction Logs</h2>
                  <p className="text-xs text-slate-400">Total: {filteredOrders.length} filtered checkouts • Auto-refresh active</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative max-w-xs w-full sm:ml-4">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search UTR, Customer, Note..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 text-xs"
                    >
                      ✕
                  </button>
                  )}
                </div>

                {/* Merchant Selector Filter */}
                <div className="relative w-full sm:w-[180px]">
                  <select
                    value={selectedMerchantFilter}
                    onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-500 outline-none focus:border-blue-500 appearance-none font-bold cursor-pointer"
                  >
                    <option value="all">All Stores (SaaS)</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.business_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              {/* Filter by status */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {[
                  { id: 'all', label: 'All Logs' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'verified', label: 'Verified' },
                  { id: 'rejected', label: 'Rejected' },
                ].map(filt => (
                  <button
                    key={filt.id}
                    onClick={() => setStatusFilter(filt.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all flex-shrink-0 ${statusFilter === filt.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
                  >
                    {filt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant Store</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Note</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">UTR Reference</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading && orders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-xs text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        Fetching global transaction history...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-xs text-slate-500 font-semibold">
                        No transactions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const localTime = new Date(order.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      });

                      // Join with merchant name on the fly
                      const merchantObj = merchants.find(m => m.id === order.merchant_id);
                      const merchantName = merchantObj ? merchantObj.business_name : 'Primary Account';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Merchant name */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-slate-400" />
                              {merchantName}
                            </span>
                          </td>

                          {/* Order ID */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-500">
                            <span 
                              className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
                              onClick={() => {
                                navigator.clipboard.writeText(order.id);
                                showToast("Copied full Order ID!", "info");
                              }}
                              title="Copy full Order ID"
                            >
                              {order.id}
                              <Copy className="w-3 h-3 opacity-40 hover:opacity-100 flex-shrink-0" />
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-semibold">
                            {localTime}
                          </td>

                          {/* Customer */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-900">
                            {order.customer_name || order.customer_phone ? (
                              <div className="space-y-0.5">
                                <div className="font-bold flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{order.customer_name || 'N/A'}</span>
                                </div>
                                {order.customer_phone && (
                                  <div className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{order.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">Anonymous</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">
                            <div className="flex items-center gap-0.5 font-extrabold text-sm">
                              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                              <span>{parseFloat(order.amount).toFixed(2)}</span>
                            </div>
                          </td>

                           {/* Note */}
                          <td className="px-6 py-4 text-xs text-slate-500 font-bold max-w-[280px]" title={order.note}>
                            <div className="space-y-1">
                              <p className="truncate max-w-[240px]">{order.note || '-'}</p>
                              {(() => {
                                const hasCallback = !!order.callback_url;
                                
                                let domain = '';
                                if (hasCallback) {
                                  try {
                                    domain = new URL(order.callback_url).hostname.replace(/^www\./, '');
                                  } catch(e) {}
                                }
                                
                                // Don't label mymob.tech / mymobpay
                                const isMymob = domain && (domain.includes('mymob.tech') || domain.includes('mymobpay'));
                                const showDomainBadge = domain && !isMymob;

                                // Determine method labeling
                                const methodUpper = (order.method || '').toUpperCase();
                                const isLink = methodUpper === 'LINK' || !!order.external_ref;
                                const isApi = methodUpper === 'API' || (!isLink && !!order.callback_url);
                                
                                let methodLabel = 'UPI';
                                let methodColor = 'bg-slate-50 text-slate-600 border-slate-200';
                                
                                if (isLink) {
                                  methodLabel = 'Link';
                                  methodColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                } else if (isApi) {
                                  methodLabel = 'API';
                                  methodColor = 'bg-amber-50 text-amber-700 border-amber-200';
                                } else if (methodUpper && methodUpper !== 'GENERIC') {
                                  methodLabel = methodUpper;
                                }

                                return (
                                  <div className="flex flex-wrap gap-1.5 mt-1 select-none font-semibold">
                                    {/* External Domain Badge */}
                                    {showDomainBadge && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                                        🌐 {domain}
                                      </span>
                                    )}
                                    {/* Method Badge */}
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase border ${methodColor}`}>
                                      {isLink ? '🔗' : isApi ? '⚡' : '💳'} {methodLabel}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>

                          {/* UTR */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                            {order.utr ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                  {order.utr}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.utr);
                                    showToast("Copied UTR Reference!", "info");
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors"
                                  title="Copy UTR Reference"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                Awaiting Match
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            {order.status === 'verified' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Verified</span>
                              </span>
                            )}
                            {order.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                <span>Pending</span>
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Manual override action */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center">
                            {order.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {utrPromptId === order.id ? (
                                  <div className="flex items-center gap-1 animate-fadeIn">
                                    <input
                                      type="text"
                                      placeholder="Enter UTR"
                                      value={manualUtr}
                                      onChange={(e) => setManualUtr(e.target.value)}
                                      className="px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900 outline-none w-[110px] font-semibold focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => handleOrderAction(order.id, 'verify', manualUtr)}
                                      disabled={actionLoading === order.id}
                                      className="p-1 text-emerald-600 hover:bg-slate-100 rounded transition-colors font-bold"
                                      title="Confirm"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setUtrPromptId(null)}
                                      className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setUtrPromptId(order.id);
                                        setManualUtr(order.utr || `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`);
                                      }}
                                      disabled={actionLoading !== null}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                      Verify
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Reject this payment?")) {
                                          handleOrderAction(order.id, 'reject');
                                        }
                                      }}
                                      disabled={actionLoading !== null}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono font-medium truncate max-w-[100px] inline-block bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {order.utr || 'Matched'}
                              </span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 3: MERCHANTS DIRECTORY (SaaS ACCOUNT CONTROLS)
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'merchants' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
            
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide">SaaS Registered Merchants</h2>
                <p className="text-xs text-slate-400">Total Merchants: {merchants.length} • Manage subscriptions and API keys instantly</p>
              </div>

              {/* Search Merchants */}
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Merchant Name, UPI..."
                  value={merchantSearchQuery}
                  onChange={(e) => setMerchantSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                />
                {merchantSearchQuery && (
                  <button
                    onClick={() => setMerchantSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Merchants List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant Profile</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business UPI ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Key (Sensitive)</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered On</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Webhook Route</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">SaaS Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {merchantsLoading && filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        Fetching SaaS merchants database records...
                      </td>
                    </tr>
                  ) : filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-slate-500 font-semibold">
                        No registered merchants match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((merchant) => {
                      const regDate = new Date(merchant.created_at).toLocaleDateString('en-IN', {
                        dateStyle: 'medium'
                      });

                      const isKeyRevealed = revealedKeys[merchant.id];
                      const isKeyCopied = copiedKeyId === merchant.id;

                      return (
                        <tr key={merchant.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Business profile */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ backgroundColor: merchant.theme_color || '#3B82F6' }}>
                                {merchant.business_name ? merchant.business_name.charAt(0).toUpperCase() : 'B'}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{merchant.business_name}</p>
                                <p className="text-[9px] font-mono text-slate-400 tracking-tight mt-0.5">{merchant.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* UPI ID */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono font-bold text-slate-800">
                            {merchant.upi_id}
                          </td>

                          {/* API Key */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-[180px] justify-between">
                              <span className="font-semibold text-slate-600 select-all">
                                {isKeyRevealed ? merchant.api_key : '••••-••••-••••'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleKeyVisibility(merchant.id)}
                                  className="text-slate-400 hover:text-slate-900 transition-colors"
                                  title={isKeyRevealed ? "Hide Key" : "Show Key"}
                                >
                                  {isKeyRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleCopyKey(merchant.id, merchant.api_key)}
                                  className="text-slate-400 hover:text-slate-900 transition-colors"
                                  title="Copy Key"
                                >
                                  {isKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-up" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Reg Date */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-500 font-semibold">
                            {regDate}
                          </td>

                          {/* Webhook Url */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs font-mono max-w-[150px] truncate" title={merchant.webhook_url || 'Not configured'}>
                            {merchant.webhook_url ? (
                              <a href={merchant.webhook_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1.5">
                                <span>{merchant.webhook_url}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>

                          {/* Sub Status */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs text-center">
                            {merchant.subscription_status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-50 text-red-600 border border-red-100">
                                Suspended
                              </span>
                            )}
                          </td>

                          {/* Access Switch Actions */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs text-center">
                            <button
                              onClick={() => {
                                const actionStr = merchant.subscription_status === 'active' ? 'Suspend' : 'Activate';
                                if (confirm(`${actionStr} subscription for ${merchant.business_name}?`)) {
                                  handleToggleSubscription(merchant.id, merchant.subscription_status);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${merchant.subscription_status === 'active' ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
                            >
                              {merchant.subscription_status === 'active' ? 'SUSPEND' : 'ACTIVATE'}
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB: SUBSCRIPTION & GIFT CODES MANAGEMENT
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Top Stat Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Subscriptions</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      {activeSubscriptions.filter(m => m.subscription_status === 'active').length}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-2">Paying or granted merchants</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active 3-Day Trials</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      {activeSubscriptions.filter(m => m.subscription_status === 'trial').length}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-blue-600 font-bold mt-2">Currently in trial period</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expired / Inactive</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      {activeSubscriptions.filter(m => m.subscription_status === 'expired' || m.subscription_status === 'inactive').length}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 font-bold mt-2">Awaiting renewal or gift</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Gift Codes</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      {giftCodesList.length}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-purple-600 font-bold mt-2">Ready for redemption</p>
              </div>
            </div>

            {/* Section 1: Gift & Promo Code Generator */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Gift & Promo Code Generator</h3>
                      <p className="text-xs text-slate-400 font-medium">Create 100% free gift subscription codes or discount vouchers for merchants.</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                    setNewGiftCode(prev => ({ ...prev, code: `GIFT-${randomSuffix}` }));
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Random Code</span>
                </button>
              </div>

              {/* Code Creation Form */}
              <form onSubmit={handleCreateGiftCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIPGIFT30"
                    value={newGiftCode.code}
                    onChange={(e) => setNewGiftCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gift Type</label>
                  <select
                    value={newGiftCode.discountType}
                    onChange={(e) => setNewGiftCode(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="free">100% Free Subscription (Gift)</option>
                    <option value="flat">Flat ₹ Discount</option>
                  </select>
                </div>

                {newGiftCode.discountType === 'flat' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={newGiftCode.discountValue}
                      onChange={(e) => setNewGiftCode(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={newGiftCode.planDays}
                      onChange={(e) => setNewGiftCode(prev => ({ ...prev, planDays: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={newGiftCode.maxUses}
                    onChange={(e) => setNewGiftCode(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={codeActionLoading}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{codeActionLoading ? 'Creating...' : 'Create Code'}</span>
                  </button>
                </div>
              </form>

              {/* Active Gift Codes Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Code</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Type & Reward</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Redemptions</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Created</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {giftCodesList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-xs text-slate-400 font-semibold">
                          No gift codes created yet. Generate one above to gift free subscriptions!
                        </td>
                      </tr>
                    ) : (
                      giftCodesList.map((gc) => {
                        const isFree = (gc.discount_type || gc.discountType || 'free') === 'free';
                        const planDays = gc.plan_duration_days || gc.planDays || 30;
                        const discountVal = gc.discount_value ?? gc.discountValue ?? 0;
                        const used = gc.times_used ?? gc.timesUsed ?? gc.usedCount ?? 0;
                        const max = gc.max_uses ?? gc.maxUses ?? '∞';
                        const createdDate = gc.created_at || gc.createdAt;
                        return (
                          <tr key={gc.code} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-mono font-extrabold text-xs">
                                  {gc.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(gc.code);
                                    showToast(`Copied code ${gc.code} to clipboard!`, "info");
                                  }}
                                  className="text-slate-400 hover:text-slate-700 transition-colors"
                                  title="Copy Code"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-700">
                              {isFree ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  100% Free ({planDays} Days)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Percent className="w-3 h-3 text-blue-600" />
                                  ₹{discountVal} Flat Discount
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-slate-600">
                              {used} / {max} used
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                              {createdDate ? new Date(createdDate).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteGiftCode(gc.code)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Merchants Subscription Directory */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-6">
              
              {/* Header & Filters */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Merchants Subscription Console</h3>
                  <p className="text-xs text-slate-400 font-medium">Manage individual merchant access, grant free subscriptions, or extend renewal periods.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {['all', 'active', 'trial', 'expired', 'inactive'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setSubsStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${subsStatusFilter === st ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search business / UPI..."
                      value={subsSearchQuery}
                      onChange={(e) => setSubsSearchQuery(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:bg-white focus:border-blue-500 transition-all w-52"
                    />
                  </div>
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Merchant Business</th>
                      <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Receiving UPI ID</th>
                      <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Current Status</th>
                      <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Activated At</th>
                      <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expiry / Countdown</th>
                      <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {subsLoading && activeSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-xs text-slate-400 font-semibold">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                          Loading subscription records...
                        </td>
                      </tr>
                    ) : activeSubscriptions.filter(m => {
                      if (subsStatusFilter !== 'all' && m.subscription_status !== subsStatusFilter) return false;
                      if (subsSearchQuery) {
                        const q = subsSearchQuery.toLowerCase();
                        const bName = (m.business_name || '').toLowerCase();
                        const upi = (m.upi_id || '').toLowerCase();
                        const email = (m.email || '').toLowerCase();
                        if (!bName.includes(q) && !upi.includes(q) && !email.includes(q)) return false;
                      }
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-xs text-slate-400 font-semibold">
                          No merchants match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      activeSubscriptions
                        .filter(m => {
                          if (subsStatusFilter !== 'all' && m.subscription_status !== subsStatusFilter) return false;
                          if (subsSearchQuery) {
                            const q = subsSearchQuery.toLowerCase();
                            const bName = (m.business_name || '').toLowerCase();
                            const upi = (m.upi_id || '').toLowerCase();
                            const email = (m.email || '').toLowerCase();
                            if (!bName.includes(q) && !upi.includes(q) && !email.includes(q)) return false;
                          }
                          return true;
                        })
                        .map((m) => {
                          const status = m.subscription_status || 'inactive';
                          const statusColors = {
                            active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            trial: 'bg-blue-50 text-blue-700 border-blue-200',
                            expired: 'bg-amber-50 text-amber-700 border-amber-200',
                            inactive: 'bg-red-50 text-red-700 border-red-200'
                          };
                          const colorCls = statusColors[status] || statusColors.inactive;

                          let countdownText = 'No expiry date';
                          if (m.subscription_expires_at) {
                            const exp = new Date(m.subscription_expires_at);
                            const now = new Date();
                            const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                            if (diffDays > 0) {
                              countdownText = `${diffDays} days remaining`;
                            } else {
                              countdownText = `Expired ${Math.abs(diffDays)} days ago`;
                            }
                          }

                          return (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-xs border border-blue-100">
                                    {m.business_name ? m.business_name.charAt(0).toUpperCase() : 'M'}
                                  </div>
                                  <div>
                                    <p className="text-xs font-extrabold text-slate-900">{m.business_name || 'Unnamed Merchant'}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{m.email || m.id.substring(0, 8)}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700">
                                {m.upi_id || <span className="text-slate-400 italic">Not set</span>}
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${colorCls}`}>
                                  {status}
                                </span>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                                {m.subscription_activated_at ? new Date(m.subscription_activated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    {m.subscription_expires_at ? new Date(m.subscription_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                  </p>
                                  <p className={`text-[10px] font-bold mt-0.5 ${m.subscription_expires_at && new Date(m.subscription_expires_at) > new Date() ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {countdownText}
                                  </p>
                                </div>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMerchantForEdit(m);
                                    setExtendDays(30);
                                    setExtendStatus('active');
                                    setIsExtendModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold transition-all border border-blue-200 shadow-sm"
                                >
                                  Extend / Grant
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = status === 'active' ? 'inactive' : 'active';
                                    if (confirm(`Change subscription status to ${nextStatus.toUpperCase()} for ${m.business_name}?`)) {
                                      handleToggleSubscription(m.id, status);
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${status === 'active' ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-800 hover:text-white'}`}
                                >
                                  {status === 'active' ? 'SUSPEND' : 'ACTIVATE'}
                                </button>
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
        )}

        {/* ═══════════════════════════════════════════════════════════
           MODAL: EXTEND OR GRANT SUBSCRIPTION
           ═══════════════════════════════════════════════════════════ */}
        {isExtendModalOpen && selectedMerchantForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 animate-scale-up relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Extend / Grant Subscription</h3>
                    <p className="text-[11px] text-slate-400 font-medium">For {selectedMerchantForEdit.business_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExtendModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExtendSubscription} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duration Preset</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 30, 90, 365].map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setExtendDays(d)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${extendDays === d ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        +{d} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Days to Add</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Status</label>
                  <select
                    value={extendStatus}
                    onChange={(e) => setExtendStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="active">Active (Paid / Granted)</option>
                    <option value="trial">Trial (Free 3-Day or Extended Trial)</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-700 font-medium">
                  {selectedMerchantForEdit.subscription_expires_at && new Date(selectedMerchantForEdit.subscription_expires_at) > new Date() ? (
                    <span>Will extend current expiry by <strong>{extendDays} days</strong> from {new Date(selectedMerchantForEdit.subscription_expires_at).toLocaleDateString('en-IN')}.</span>
                  ) : (
                    <span>Will activate <strong>{extendDays} days</strong> starting from today.</span>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExtendModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subsActionLoading}
                    className="flex-grow py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
                  >
                    {subsActionLoading ? 'Saving...' : 'Apply Subscription'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           TAB 4: PLATFORM CONFIGURATION & DOUBLE SECURITY SETTINGS
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Global Success/Error Alerts */}
            {settingsError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold">{settingsError}</span>
              </div>
            )}
            {settingsSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs flex items-center gap-3 font-semibold">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold">{settingsSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* UPI ID Management Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <IndianRupee className="w-4.5 h-4.5 text-blue-600" /> Platform UPI Configuration
                  </h3>
                  <span className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">PAYMENTS</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Platform Subscriptions</p>
                    <p className="text-xl font-black text-slate-900 mt-1">₹{totalEarnings.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide">
                    {subscriptionOrders.length} Paid Subscriptions
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Receiving UPI ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="platform@upi"
                        value={adminUpi}
                        onChange={(e) => setAdminUpi(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={() => openVerification({ type: 'update_upi', data: { upi_id: adminUpi } })}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    💡 All merchant subscription payments (monthly, annual, custom term checkouts) will be dynamically routed and credited to this platform UPI ID.
                  </p>
                </div>
              </div>

              {/* Double Security (2FA & OAuth) Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-blue-600" /> Double Security & MFA
                  </h3>
                  <span className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">SECURITY</span>
                </div>

                {/* Google Authenticator Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Google Authenticator (2FA)</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Require a 6-digit verification code when logging in</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${totpEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {totpEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {totpEnabled ? (
                    <button
                      onClick={() => openVerification({ type: 'disable_totp' })}
                      className="w-full py-2.5 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" /> Deactivate Authenticator 2FA
                    </button>
                  ) : (
                    <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      {!totpSecret ? (
                        <button
                          onClick={handleGenerateTotpSecret}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Unlock className="w-4 h-4" /> Setup Authenticator 2FA
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-3 animate-fade-up animate-duration-200">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">Scan QR in Authenticator App</p>
                          <div className="bg-white p-3 rounded-2xl border border-slate-200">
                            <QRCode value={qrCodeUri} size={130} />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-[10px] font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg select-all font-bold">
                              Key: {totpSecret}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                              Scan this QR or copy the manual key to your Google/Microsoft Authenticator.
                            </p>
                          </div>
                          <div className="w-full space-y-2 pt-2 border-t border-slate-200 flex flex-col items-stretch text-xs">
                            <input
                              type="text"
                              maxLength="6"
                              placeholder="Enter 6-digit verify code"
                              value={totpVerifyCode}
                              onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-center font-bold tracking-[0.2em]"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setTotpSecret('')}
                                className="w-1/3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={totpVerifyCode.length !== 6}
                                onClick={() => openVerification({ 
                                  type: 'enable_totp', 
                                  data: { secret: totpSecret, code: totpVerifyCode } 
                                })}
                                className="flex-grow py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                              >
                                Confirm & Activate
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-3 font-semibold text-xs text-slate-700">
                  {/* Google OAuth Config */}
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Google OAuth Admin Email(s)</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Authorizes specific Google accounts or prefixes (separated by commas) for console access</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. chauhankuna, deadraon@"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        onClick={() => openVerification({ type: 'update_email', data: { admin_email: adminEmail } })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Platform Subscriptions Ledger */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-blue-600" /> Subscription Payments Ledger
                </h3>
                <span className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">LEDGER</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs font-semibold text-slate-700">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left">Order ID</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Subscriber Reference</th>
                      <th className="px-5 py-3 text-left">Billing Term</th>
                      <th className="px-5 py-3 text-right">Amount (INR)</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-xs">
                    {settingsLoading ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-6 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" /> Loading payment logs...
                        </td>
                      </tr>
                    ) : subscriptionOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-6 text-center text-slate-400">
                          No subscription renewals recorded on this platform.
                        </td>
                      </tr>
                    ) : (
                      subscriptionOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-slate-900">{order.id}</td>
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(order.created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </td>
                          <td className="px-5 py-3 font-mono text-[10px] text-slate-400" title={order.external_ref}>
                            {order.external_ref ? order.external_ref.slice(0, 18) + '...' : '—'}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              {order.note || 'Subscription'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-900">
                            ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Original variables and diagnostics split row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Variable Health */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Platform Key Credentials
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'NEXT_PUBLIC_SUPABASE_URL', status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Active' : 'Missing' },
                    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Active' : 'Missing' },
                    { name: 'ADMIN_TOTP_SECRET', status: 'Active (Passwordless 2FA)' },
                    { name: 'SUPABASE_SERVICE_KEY', status: 'Active (RLS Bypassed)' }
                  ].map((env, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0 text-xs">
                      <span className="font-mono text-slate-500 font-bold">{env.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${env.status.includes('Missing') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                        {env.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DLT Configuration */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> TRAI DLT Templates Configuration
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-start py-2 border-b border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">SMS Webhook Listener</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Listens for notifications from bank forwarders</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                      /api/webhook/sms
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Email Webhook Listener</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Receives transactional bank alerts via Cloudflare</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                      /api/webhook/email
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Action Verification Modal */}
        {isVerificationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6 animate-scale-up relative">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
              
              <div className="flex items-center gap-3 text-amber-600">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Authorize Platform Change</h3>
              </div>
              
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {googleUser ? (
                  <>You are authenticated as <span className="font-bold text-slate-800">{googleUser.email}</span>. Click confirm to authorize this platform update.</>
                ) : (
                  <>You are modifying sensitive platform-wide payment or credentials settings. Click confirm to authorize and apply this update.</>
                )}
              </p>
              
              <form onSubmit={handleVerifyAndConfirm} className="space-y-5 font-semibold text-xs text-slate-700">
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerificationModalOpen(false);
                      setPendingAction(null);
                    }}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Verify & Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 animate-fadeIn">
            <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'error' 
                ? 'bg-red-50/95 text-red-700 border-red-200 shadow-red-500/10' 
                : toast.type === 'info'
                ? 'bg-blue-50/95 text-blue-700 border-blue-200 shadow-blue-500/10'
                : 'bg-emerald-50/95 text-emerald-700 border-emerald-200 shadow-emerald-500/10'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
              <span>{toast.msg}</span>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white mt-12">
        <p className="font-medium">&copy; 2026 {CONFIG.businessName} SaaS Gateway Platform. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-400 font-mono">Protected Admin Console • Session ID: {Math.floor(1000000000 + Math.random() * 9000000000)}</p>
      </footer>

      </div>

    </div>
  );
}
