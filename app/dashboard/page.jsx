'use client';







import { useEffect, useState, useMemo, useRef } from 'react';



import { useRouter } from 'next/navigation';



import { supabase } from '@/lib/supabase';



import { CONFIG } from '@/lib/config';
import { generateOrderId } from '@/lib/orderId';



import { 
  Building2, LogOut, Save, Key, User, Briefcase, Link as LinkIcon, 



  Loader2, Copy, CheckCircle, CreditCard, Mail, X, 



  LayoutDashboard, Search, Download, RefreshCw, IndianRupee,



  Clock, CheckCircle2, XCircle, Code, ChevronRight, BookOpen,



  Menu, TrendingUp, AlertCircle, Star, Crown, Shield, Calendar, Zap, ChevronDown,



  QrCode, Share2, Trash2, Plus, ExternalLink, Sparkles, Check, ArrowRight, Lock



} from 'lucide-react';



import QRCode from 'react-qr-code';
import ConsoleActivationPaywall from '@/components/ConsoleActivationPaywall';
import DashboardOverviewRedesign from '@/components/DashboardOverviewRedesign';
import PaymentLinksRedesign from '@/components/PaymentLinksRedesign';
import TransactionsRedesign from '@/components/TransactionsRedesign';
import SubscriptionRedesign from '@/components/SubscriptionRedesign';
import SettingsRedesign from '@/components/SettingsRedesign';
import AdminConsole from '@/components/AdminConsole';

import ProfileBusinessInfoModal from '@/components/ProfileBusinessInfoModal';
import { formatMerchantId } from '@/lib/merchantId';



import { 



  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 



} from 'recharts';







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







export default function DashboardPage() {



  const router = useRouter();



  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Detect if logged-in user is an authorized platform administrator
  const isAdminUser = useMemo(() => {
    if (!user && !profile) return false;
    const adminEmails = ['chauhankunal695@gmail.com', 'deadraon@gmail.com', 'deadraon1@gmail.com'];
    const email = user?.email?.toLowerCase().trim();
    const isPlatformAdminId = user?.id === 'dd45279e-7a2c-413c-9e24-24d88011b680' || profile?.id === 'dd45279e-7a2c-413c-9e24-24d88011b680';
    const isPlatformKey = profile?.api_key === '677d9312-a53f-4b96-815f-53e0eee1b292';
    return Boolean(isPlatformAdminId || isPlatformKey || (email && adminEmails.includes(email)));
  }, [user, profile]);



  const [loading, setLoading] = useState(true);



  const [saving, setSaving] = useState(false);



  const [message, setMessage] = useState('');

  // Track subscription activation transition to ensure payment confirmation screen is shown
  const [activationDismissed, setActivationDismissed] = useState(false);

  const wasInactiveOnMount = useRef(null);

  useEffect(() => {
    if (profile && wasInactiveOnMount.current === null) {
      const expired = profile.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now();
      wasInactiveOnMount.current = (profile.subscription_status !== 'active' || expired);
    }
  }, [profile]);



  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      if (['overview', 'payment-links', 'transactions', 'subscription', 'settings', 'admin'].includes(hash)) {
        return hash;
      }
    }
    return 'overview';
  });
  const [settingsCategory, setSettingsCategory] = useState('banking');



  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



  const [manageTab, setManageTab] = useState('renew');



  const [historyOrders, setHistoryOrders] = useState([]);



  const [historyLoading, setHistoryLoading] = useState(false);



  const [selectedMonths, setSelectedMonths] = useState(1);



  const [customMonths, setCustomMonths] = useState('');



  const [showManageSection, setShowManageSection] = useState(false);
  const [copiedGuideUrl, setCopiedGuideUrl] = useState(false);
  const [copiedGuideKey, setCopiedGuideKey] = useState(false);



  const [statusChecking, setStatusChecking] = useState(false);







  // Transaction States



  const [orders, setOrders] = useState([]);



  const [ordersLoading, setOrdersLoading] = useState(false);



  const [emailLogs, setEmailLogs] = useState([]);



  const [emailLogsLoading, setEmailLogsLoading] = useState(false);



  const [searchQuery, setSearchQuery] = useState('');



  const [statusFilter, setStatusFilter] = useState('all');







  // Interactive Payment Link Builder State



  const [linkAmount, setLinkAmount] = useState('500');



  const [linkNote, setLinkNote] = useState('Order_123');



  const [copiedLink, setCopiedLink] = useState(false);



  const [copiedSnippet, setCopiedSnippet] = useState(null);







  // Dedicated Payment Links Panel States



  const [payLinkAmount, setPayLinkAmount] = useState('');



  const [payLinkPurpose, setPayLinkPurpose] = useState('');



  const [payLinkCustomerName, setPayLinkCustomerName] = useState('');



  const [payLinkCustomerPhone, setPayLinkCustomerPhone] = useState('');



  const [payLinkRef, setPayLinkRef] = useState('');



  const [payLinkProject, setPayLinkProject] = useState('');



  const [payLinkGeneratedUrl, setPayLinkGeneratedUrl] = useState('');



  const [payLinkHistory, setPayLinkHistory] = useState([]);



  const [payLinkSearch, setPayLinkSearch] = useState('');



  const [payLinkCopied, setPayLinkCopied] = useState(false);



  const [showOptionalDetails, setShowOptionalDetails] = useState(false);







  // Error Banner



  const [dbError, setDbError] = useState(null);



  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);







  // SaaS Analytics & Playground States



  const [analyticsTimeframe, setAnalyticsTimeframe] = useState(7);



  // Diagnostics States



  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);



  const [diagnosticsResult, setDiagnosticsResult] = useState(null);







  // Setup Wizard & Webhook Simulator States



  const [integrationTarget, setIntegrationTarget] = useState('website');



  const [mobileSdk, setMobileSdk] = useState('flutter');



  const [apiLang, setApiLang] = useState('curl');



  const [testingWebhook, setTestingWebhook] = useState(false);



  const [webhookLogs, setWebhookLogs] = useState([]);



  const [wizardStep, setWizardStep] = useState(0);



  const [selectedDiagnostic, setSelectedDiagnostic] = useState('cors');







  // Real-time step test states



  const [stepTestResult, setStepTestResult] = useState(null); // null | 'testing' | 'pass' | 'fail'



  const [stepTestMsg, setStepTestMsg] = useState('');



  const [stepTestDetail, setStepTestDetail] = useState('');



  const [wizardWebhookUrl, setWizardWebhookUrl] = useState('');



  const [rerunWizard, setRerunWizard] = useState(false);







  // Staff Verification Setup States



  const [staffGateway, setStaffGateway] = useState(null);



  const [staffLoading, setStaffLoading] = useState(false);



  const [staffError, setStaffError] = useState(null);



  const [staffProvider, setStaffProvider] = useState('gpay');







  // Connections Tab Sub-tab Selection State



  const [connectionSubTab, setConnectionSubTab] = useState('email');



  const [selectedWebsite, setSelectedWebsite] = useState(null);







  // Central Profile Settings Modal & Dropdown States



  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBusinessInfoModalOpen, setIsBusinessInfoModalOpen] = useState(false);



  const [profileModalTab, setProfileModalTab] = useState('profile');



  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Unified modal/drawer open flag for scroll lock and background freezing
  const isAnyModalOrDrawerOpen = Boolean(
    isNotificationOpen ||
    isMobileMenuOpen ||
    isProfileDropdownOpen ||
    isBusinessInfoModalOpen ||
    isProfileModalOpen
  );

  // Prevent background scrolling when any mobile drawer, notification flyout, or modal is active
  useEffect(() => {
    if (isAnyModalOrDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isAnyModalOrDrawerOpen]);



  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);



  const [paletteSearchQuery, setPaletteSearchQuery] = useState('');



  const [theme, setTheme] = useState('dark');







  // Edit States for Modal Inputs



  const [editOwnerName, setEditOwnerName] = useState('');



  const [editPhoneNumber, setEditPhoneNumber] = useState('');



  const [editBusinessName, setEditBusinessName] = useState('');



  const [editUpiId, setEditUpiId] = useState('');



  const [editWebhookUrl, setEditWebhookUrl] = useState('');



  const [editThemeColor, setEditThemeColor] = useState('#3B82F6');



  const [editGstin, setEditGstin] = useState('');



  const [editBusinessAddress, setEditBusinessAddress] = useState('');



  const [editBusinessCategory, setEditBusinessCategory] = useState('');

  // Bank Transfer (IMPS/NEFT) Settings States
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editBankIfsc, setEditBankIfsc] = useState('');
  const [editBankAccountName, setEditBankAccountName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editEnableBankTransfer, setEditEnableBankTransfer] = useState(true);







  // Password Reset States



  const [currentPassword, setCurrentPassword] = useState('');



  const [showCurrentPassword, setShowCurrentPassword] = useState(false);



  const [showNewPassword, setShowNewPassword] = useState(false);



  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  const [newPassword, setNewPassword] = useState('');



  const [confirmPassword, setConfirmPassword] = useState('');



  const [passwordResetLoading, setPasswordResetLoading] = useState(false);



  const [passwordResetError, setPasswordResetError] = useState(null);



  const [passwordResetSuccess, setPasswordResetSuccess] = useState(null);



  const [profileSaving, setProfileSaving] = useState(false);



  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);



  const [profileErrorMsg, setProfileErrorMsg] = useState(null);







    const merchantInitials = useMemo(() => {
    const name = profile?.business_name || profile?.owner_name || user?.email || 'MyMobPay';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [profile, user]);

  const allShortcuts = [



    { name: 'Go to Overview Dashboard', tab: 'overview', icon: LayoutDashboard },



    { name: 'Go to Transactions Logs', tab: 'transactions', icon: CreditCard },









    { name: 'Go to Settings Panel', tab: 'settings', icon: Briefcase },



    { name: 'Edit Profile & Business Info', action: 'profile', icon: User },



    { name: 'Reset Account Security Password', action: 'security', icon: Key }



  ];







  // Dynamic Web Application Detection



  const detectedWebsites = useMemo(() => {



    const sites = {};



    



    // 1. Seed from profile registered webhook url if present



    if (profile?.webhook_url) {



      try {



        const url = new URL(profile.webhook_url);



        const domain = url.hostname.replace(/^www\./, '');



        const name = domain.split('.')[0];



        sites[domain] = {



          domain,



          name: name.charAt(0).toUpperCase() + name.slice(1),



          webhookUrl: profile.webhook_url,



          source: 'webhook_config'



        };



      } catch (e) {



        console.error("Error parsing profile webhook_url:", e);



      }



    }



    



    // 2. Parse from historical checkout records



    if (Array.isArray(orders)) {



      orders.forEach(order => {



        let domain = '';



        let name = '';



        



        if (order.callback_url) {



          try {



            const url = new URL(order.callback_url);



            domain = url.hostname.replace(/^www\./, '');



          } catch (e) {}



        }



        



        if (order.project) {



          name = order.project;



        }



        



        // Use domain or formatted name as uniqueness key



        if (domain || name) {



          const key = domain || name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.dev';



          if (!sites[key]) {



            sites[key] = {



              domain: domain || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.dev`,



              name: name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),



              webhookUrl: order.callback_url || '',



              source: 'transaction_history'



            };



          } else {



            // Keep webhook URL and name updated if missing in previous records



            if (!sites[key].webhookUrl && order.callback_url) {



              sites[key].webhookUrl = order.callback_url;



            }



            if ((!sites[key].name || sites[key].name === sites[key].domain.split('.')[0]) && order.project) {



              sites[key].name = order.project;



            }



          }



        }



      });



    }



    



    return Object.values(sites).filter(site => {



      const d = site.domain.toLowerCase();



      const n = site.name.toLowerCase();



      return !d.includes('mymob.tech') && 



             !d.includes('mymobpay') && 



             !d.includes('localhost') &&



             !n.includes('mymob') &&



             !n.includes('mymobpay') &&



             n !== 'my business';



    });



  }, [profile?.webhook_url, orders]);







  const matchedShortcuts = useMemo(() => {



    if (!paletteSearchQuery.trim()) return allShortcuts;



    const query = paletteSearchQuery.toLowerCase();



    return allShortcuts.filter(s => s.name.toLowerCase().includes(query));



  }, [paletteSearchQuery]);







  const matchedOrders = useMemo(() => {



    if (!paletteSearchQuery.trim()) return [];



    const query = paletteSearchQuery.toLowerCase();



    return orders.filter(o => 



      (o.id && o.id.toLowerCase().includes(query)) ||



      (o.amount && String(o.amount).includes(query)) ||



      (o.status && o.status.toLowerCase().includes(query)) ||



      (o.external_ref && o.external_ref.toLowerCase().includes(query))



    ).slice(0, 5);



  }, [paletteSearchQuery, orders]);







  const openProfileModal = (tabName = 'profile') => {



    if (profile) {



      setEditOwnerName(profile.owner_name || '');



      setEditPhoneNumber(profile.phone_number || '');



      setEditBusinessName(profile.business_name || '');



      setEditUpiId(profile.upi_id || '');



      setEditWebhookUrl(profile.webhook_url ? profile.webhook_url.replace(/\/api\/webhook$/, '') : '');



      setEditThemeColor(profile.theme_color || '#3B82F6');



      setEditGstin(profile.gstin || '');



      setEditBusinessAddress(profile.business_address || '');



      setEditBusinessCategory(profile.business_category || '');

      setEditBankAccountNumber(profile.bank_account_number || '');
      setEditBankIfsc(profile.bank_ifsc || '');
      setEditBankAccountName(profile.bank_account_name || '');
      setEditBankName(profile.bank_name || '');
      setEditEnableBankTransfer(profile.enable_bank_transfer !== false);

    }



    setNewPassword('');



    setConfirmPassword('');



    setPasswordResetError(null);



    setPasswordResetSuccess(null);



    setProfileSuccessMsg(null);



    setProfileErrorMsg(null);



    setProfileModalTab(tabName);



    setIsProfileModalOpen(true);



    setIsProfileDropdownOpen(false);



  };







  const fetchStaffDetails = async (providerName) => {



    setStaffLoading(true);



    setStaffError(null);



    try {



      const { data: { session } } = await supabase.auth.getSession();



      const headers = {};



      if (session) {



        headers['Authorization'] = `Bearer ${session.access_token}`;



      }



      



      const providerParam = providerName ? `&provider=${providerName}` : '';



      const res = await fetch(`/api/merchant/staff?api_key=${profile?.api_key}${providerParam}`, { headers });



      const data = await res.json();



      if (!res.ok) {



        throw new Error(data.error || 'Failed to fetch staff details');



      }



      



      if (data.gateway) {



        setStaffGateway(data.gateway);



        setStaffProvider(data.gateway.provider);



      }



      



      if (data.status) {



        setProfile(prev => ({ ...prev, staff_connection_status: data.status, verification_method: data.method }));



      }



    } catch (err) {



      console.error(err);



      setStaffError(err.message);



    } finally {



      setStaffLoading(false);



    }



  };







  const handleConfirmStaffConnected = async () => {



    setStaffLoading(true);



    try {



      const { data: { session } } = await supabase.auth.getSession();



      const headers = { 'Content-Type': 'application/json' };



      if (session) {



        headers['Authorization'] = `Bearer ${session.access_token}`;



      }



      



      const res = await fetch('/api/merchant/staff', {



        method: 'POST',



        headers,



        body: JSON.stringify({ action: 'confirm_connected', api_key: profile?.api_key })



      });



      const data = await res.json();



      if (!res.ok) {



        throw new Error(data.error || 'Failed to confirm connection');



      }



      



      setProfile(prev => ({ ...prev, staff_connection_status: 'connected' }));



    } catch (err) {



      alert(err.message);



    } finally {



      setStaffLoading(false);



    }



  };







  const handleDisconnectStaff = async () => {



    if (!confirm('Are you sure you want to disconnect your business staff verification?')) return;



    setStaffLoading(true);



    try {



      const { data: { session } } = await supabase.auth.getSession();



      const headers = { 'Content-Type': 'application/json' };



      if (session) {



        headers['Authorization'] = `Bearer ${session.access_token}`;



      }



      



      const res = await fetch('/api/merchant/staff', {



        method: 'POST',



        headers,



        body: JSON.stringify({ action: 'disconnect', api_key: profile?.api_key })



      });



      const data = await res.json();



      if (!res.ok) {



        throw new Error(data.error || 'Failed to disconnect');



      }



      



      setProfile(prev => ({ ...prev, staff_connection_status: 'disconnected', verification_method: 'sms_forwarder' }));



      setStaffGateway(null);



    } catch (err) {



      alert(err.message);



    } finally {



      setStaffLoading(false);



    }



  };







  useEffect(() => {
    setWizardStep(integrationTarget === 'email_forwarding' ? 0 : 1);
    setTestingWebhook(false);
    setWebhookLogs([]);
    setStepTestResult(null);
    setStepTestMsg('');
    setStepTestDetail('');
    setRerunWizard(false);
  }, [integrationTarget, mobileSdk]);







  // Reset test result when step changes



  useEffect(() => {



    setStepTestResult(null);



    setStepTestMsg('');



    setStepTestDetail('');



  }, [wizardStep]);







  useEffect(() => {



    const fetchSession = async () => {



      // getUser() performs a cryptographic server-side JWT verification (not just a localStorage read)
      const { data: { user }, error: userError } = await supabase.auth.getUser();




      if (!user || userError) {



        router.push('/login');



        return;



      }




      setUser(user);

      await fetchProfile(user.id);
      fetchSubscriptionHistory(user.id);

      // Handle redirect from payment gateway (e.g. ?status=success&gateway_id=...)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const pStatus = urlParams.get('status');
        const pOrderId = urlParams.get('orderId') || urlParams.get('gateway_id');
        if (pStatus === 'success' || pOrderId) {
          // Re-fetch profile and subscription history
          setTimeout(() => {
            fetchProfile(user.id);
            fetchSubscriptionHistory(user.id);
          }, 600);
          setTimeout(() => {
            fetchProfile(user.id);
            fetchSubscriptionHistory(user.id);
          }, 2000);
          // Clean URL parameters smoothly without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

    };

    fetchSession();

  }, [router]);

  // Real-time Order updates and subscription updates
  useEffect(() => {
    if (!user) return;

    // 1. Regular customer orders for this merchant
    const channel = supabase.channel(`dashboard-orders-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `merchant_id=eq.${user.id}` 
      }, () => {
        fetchOrders(user.id);
      })
      .subscribe();

    // 2. Subscription/Trial orders where external_ref is this merchant
    const subOrdersChannel = supabase.channel(`dashboard-sub-orders-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `external_ref=eq.${user.id}`
      }, () => {
        fetchProfile(user.id);
        fetchSubscriptionHistory(user.id);
      })
      .subscribe();

    // 3. Realtime merchant profile updates (instant unlock when subscription_status becomes active)
    const merchantChannel = supabase.channel(`dashboard-merchant-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'merchants',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new) {
          setProfile(payload.new);
        }
      })
      .subscribe();

    // 4. Realtime payment links updates (re-fetch orders whenever links status changes)
    const plChannel = supabase.channel(`dashboard-pl-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payment_links',
        filter: `merchant_id=eq.${user.id}`
      }, () => {
        fetchOrders(user.id);
      })
      .subscribe();

    // 5. Instant wake-up re-fetch when merchant switches back to this dashboard tab
    const handleWakeup = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders(user.id);
        fetchProfile(user.id);
      }
    };

    window.addEventListener('focus', handleWakeup);
    document.addEventListener('visibilitychange', handleWakeup);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(subOrdersChannel);
      supabase.removeChannel(merchantChannel);
      supabase.removeChannel(plChannel);
      window.removeEventListener('focus', handleWakeup);
      document.removeEventListener('visibilitychange', handleWakeup);
    };
  }, [user]);
  // Mobile menu scroll lock handled by unified isAnyModalOrDrawerOpen effect








  // Command Palette Keyboard Listener



  useEffect(() => {



    const handleKeyDown = (e) => {



      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {



        e.preventDefault();



        setIsCommandPaletteOpen(prev => !prev);



      }



    };



    window.addEventListener('keydown', handleKeyDown);



    return () => window.removeEventListener('keydown', handleKeyDown);



  }, []);







  // Theme Sync and Toggling Hooks



  useEffect(() => {



    const savedTheme = localStorage.getItem('theme') || 'dark';



    setTheme(savedTheme);



  }, []);







  useEffect(() => {



    if (theme === 'light') {



      document.documentElement.classList.add('light-theme');



    } else {



      document.documentElement.classList.remove('light-theme');



    }



  }, [theme]);







  // Load Payment Links History



  useEffect(() => {
    // Purge legacy global key if present to prevent cross-account leak
    if (typeof window !== 'undefined' && localStorage.getItem('mymobpay_payment_links')) {
      localStorage.removeItem('mymobpay_payment_links');
    }

    if (!profile?.id) {
      setPayLinkHistory([]);
      return;
    }

    const merchantKey = `mymobpay_payment_links_${profile.id}`;
    const history = localStorage.getItem(merchantKey);

    if (history) {
      try {
        const parsed = JSON.parse(history);
        if (Array.isArray(parsed)) {
          const merchantLinks = parsed.filter(item => item.merchantId === profile.id);
          setPayLinkHistory(merchantLinks);
          return;
        }
      } catch (e) {
        console.error("Error loading payment links history:", e);
      }
    }

    setPayLinkHistory([]);
  }, [profile?.id]);







  const toggleTheme = () => {



    const nextTheme = theme === 'dark' ? 'light' : 'dark';



    setTheme(nextTheme);



    localStorage.setItem('theme', nextTheme);



  };







  // Safe UUID generator



  const generateUUID = () => {



    if (typeof crypto !== 'undefined' && crypto.randomUUID) {



      return crypto.randomUUID();



    }



    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {



      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);



      return v.toString(16);



    });



  };







  const fetchProfile = async (userId) => {



    try {



      setDbError(null);



      const { data, error } = await supabase



        .from('merchants')



        .select('*')



        .eq('id', userId)



        .single();



      if (error) throw error;







      // Auto-fix missing api_key



      if (!data.api_key) {



        const newKey = generateUUID();



        await supabase.from('merchants').update({ api_key: newKey }).eq('id', userId);



        data.api_key = newKey;



      }







      // Auto-expire check
      if (data.subscription_status === 'active' && data.subscription_expires_at) {
        const isExpired = new Date(data.subscription_expires_at) < new Date();
        if (isExpired) {
          data.subscription_status = 'expired';
          await supabase.from('merchants').update({ subscription_status: 'expired' }).eq('id', userId);
        }
      }

      // Safety auto-activation: if user has a verified trial or subscription order in the orders table, ensure status is active!
      if (data.subscription_status !== 'active') {
        const { data: verifiedOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('external_ref', userId)
          .eq('status', 'verified')
          .order('created_at', { ascending: false })
          .limit(1);

        if (verifiedOrders && verifiedOrders.length > 0) {
          const ord = verifiedOrders[0];
          const isTrial = ord.note === 'Trial_Setup_3Day' || ord.note === 'Autopay_Setup_3DayTrial';
          const orderDate = new Date(ord.verified_at || ord.created_at);
          const durationDays = isTrial ? 3 : 30;
          const expiryDate = new Date(orderDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

          if (expiryDate > new Date()) {
            data.subscription_status = 'active';
            data.subscription_expires_at = expiryDate.toISOString();
            const currProg = data.setup_progress || {};
            const updatedProg = {
              ...currProg,
              trial_activated_at: isTrial ? orderDate.toISOString() : (currProg.trial_activated_at || null),
              trial_expires_at: isTrial ? expiryDate.toISOString() : (currProg.trial_expires_at || null),
              subscription_activated_at: !isTrial ? orderDate.toISOString() : (currProg.subscription_activated_at || null),
              plan_type: isTrial ? 'trial_3day' : 'subscription',
              last_payment_at: orderDate.toISOString(),
              last_order_id: ord.id
            };
            data.setup_progress = updatedProg;
            await supabase.from('merchants').update({
              subscription_status: 'active',
              subscription_expires_at: expiryDate.toISOString(),
              setup_progress: updatedProg
            }).eq('id', userId);
          } else {
            data.subscription_status = 'expired';
            data.subscription_expires_at = expiryDate.toISOString();
            const currProg = data.setup_progress || {};
            const updatedProg = {
              ...currProg,
              trial_activated_at: isTrial ? orderDate.toISOString() : (currProg.trial_activated_at || null),
              trial_expires_at: isTrial ? expiryDate.toISOString() : (currProg.trial_expires_at || null),
              trial_expired: isTrial ? true : (currProg.trial_expired || false),
              plan_type: isTrial ? 'trial_3day' : (currProg.plan_type || 'subscription'),
              last_order_id: ord.id
            };
            data.setup_progress = updatedProg;
            await supabase.from('merchants').update({
              subscription_status: 'expired',
              subscription_expires_at: expiryDate.toISOString(),
              setup_progress: updatedProg
            }).eq('id', userId);
          }
        }
      }

      setProfile(data);



      // Pre-fill wizard webhook URL from saved profile



      if (data.webhook_url) setWizardWebhookUrl(data.webhook_url);



      // Fetch orders for this merchant



      fetchOrders(userId);



      fetchEmailLogs(userId);



      fetchSubscriptionHistory(userId);



    } catch (error) {



      console.error('Error fetching profile:', error);



      



      if (error.code === 'PGRST116') {



         const newKey = generateUUID();



         const newProfile = { id: userId, business_name: 'My Business', upi_id: 'pending@upi', api_key: newKey, subscription_status: 'inactive', subscription_expires_at: null };



         const { data: insertedData, error: insertErr } = await supabase.from('merchants').insert(newProfile).select().single();



         if (insertErr) {



            setDbError(`Insert Error: ${insertErr.message} (Code: ${insertErr.code})`);



         } else {



            setProfile(insertedData);



            fetchOrders(userId);



            fetchEmailLogs(userId);



            fetchSubscriptionHistory(userId);



         }



      } else {



         setDbError(error.message);



      }



    } finally {



      setLoading(false);



    }



  };







  const fetchOrders = async (userId) => {



    setOrdersLoading(true);



    try {



      const { data, error } = await supabase



        .from('orders')



        .select('*')



        .eq('merchant_id', userId)



        .order('created_at', { ascending: false });







      if (error) throw error;



      setOrders(data || []);



    } catch (err) {



      console.error('Error fetching orders:', err);



    } finally {



      setOrdersLoading(false);



    }



  };







  const fetchEmailLogs = async (userId) => {



    setEmailLogsLoading(true);



    try {



      const { data, error } = await supabase



        .from('email_logs')



        .select('*')



        .eq('merchant_id', userId)



        .order('created_at', { ascending: false });







      if (error) throw error;



      setEmailLogs(data || []);



    } catch (err) {



      console.error('Error fetching email logs:', err);



    } finally {



      setEmailLogsLoading(false);



    }



  };







  const handleRunDiagnostics = () => {



    setDiagnosticsRunning(true);



    setDiagnosticsResult(null);



    setTimeout(() => {



      const dbOnline = !!supabase;



      const vpaStatus = profile?.upi_id && profile.upi_id !== 'pending@upi' ? 'configured' : 'pending';



      const webhookStatus = profile?.webhook_url ? 'configured' : 'missing';



      const forwardingStatus = profile?.gmail_forwarding_verified ? 'active' : 'pending';



      



      setDiagnosticsResult({



        db: dbOnline ? 'ONLINE' : 'OFFLINE',



        vpa: vpaStatus === 'configured' ? 'ACTIVE' : 'WARNING',



        vpaValue: profile?.upi_id || 'pending@upi',



        webhook: webhookStatus === 'configured' ? 'ACTIVE' : 'NOT_CONFIGURED',



        webhookValue: profile?.webhook_url || '—',



        forwarding: forwardingStatus === 'active' ? 'ACTIVE' : 'PENDING'



      });



      setDiagnosticsRunning(false);



    }, 1500);



  };







  const fetchSubscriptionHistory = async (userId) => {



    setHistoryLoading(true);



    try {



      const { data, error } = await supabase



        .from('orders')



        .select('*')



        .eq('external_ref', userId)



        .order('created_at', { ascending: false });







      if (error) throw error;



      setHistoryOrders(data || []);



    } catch (err) {



      console.error('Error fetching subscription history:', err);



    } finally {



      setHistoryLoading(false);



    }



  };







  const handleScrollToSubscription = () => {



    setActiveTab('subscription');



    setShowManageSection(true);



  };







  const handleRefreshOrders = () => {



    if (user) {



      fetchOrders(user.id);



    }



  };







  const handleSave = async () => {



    setSaving(true);



    setMessage('');



    try {



      const { error } = await supabase



        .from('merchants')



        .update({



          business_name: profile.business_name,



          upi_id: profile.upi_id,



          webhook_url: profile.webhook_url,



          theme_color: profile.theme_color || '#3B82F6'



        })



        .eq('id', user.id);



      



      if (error) throw error;



      setMessage('Settings saved successfully!');



      setTimeout(() => setMessage(''), 3000);



    } catch (error) {



      console.error('Error saving:', error);



      setMessage('Failed to save settings.');



    } finally {



      setSaving(false);



    }



  };







  const toggleSandboxMode = async () => {



    if (!user || !profile) return;

    const currentSandbox = profile.sandbox_mode !== false;
    const nextSandbox = !currentSandbox;

    // Lock Live Mode if subscription is not active
    if (!nextSandbox) {
      const isExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now();
      const isSubActive = profile?.subscription_status === 'active' && !isExpired;
      const isAdmin = profile?.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || profile?.api_key === CONFIG.platformApiKey;

      if (!isSubActive && !isAdmin) {
        setActiveTab('subscription');
        alert('🔒 Live Production Mode is locked.\n\nPlease start your 3-Day Free Trial or activate a subscription plan to accept live customer payments and unlock your Live API Key!');
        return;
      }
    }

    try {



      const { error } = await supabase



        .from('merchants')



        .update({ sandbox_mode: nextSandbox })



        .eq('id', user.id);



      



      if (error) throw error;



      setProfile({ ...profile, sandbox_mode: nextSandbox });



    } catch (err) {



      console.error("Failed to switch modes:", err);



      alert("Failed to change environment mode.");



    }



  };







  const handleSignOut = async () => {



    await supabase.auth.signOut();



    router.push('/login');



  };







  const handleSaveProfileModal = async () => {



    setProfileSaving(true);



    setProfileSuccessMsg(null);



    setProfileErrorMsg(null);







    // Form validation



    if (!editOwnerName.trim()) {



      setProfileErrorMsg('Owner Name is required.');



      setProfileSaving(false);



      return;



    }



    if (!editPhoneNumber.trim()) {



      setProfileErrorMsg('Primary Phone Number is required.');



      setProfileSaving(false);



      return;



    }



    if (!editBusinessName.trim()) {



      setProfileErrorMsg('Business name is required.');



      setProfileSaving(false);



      return;



    }



    if (!editBusinessCategory) {



      setProfileErrorMsg('Business Category selection is required.');



      setProfileSaving(false);



      return;



    }



    if (!editUpiId.trim() || editUpiId.trim() === 'pending@upi') {



      setProfileErrorMsg('A valid UPI deposit address (VPA) is required.');



      setProfileSaving(false);



      return;



    }







    // Format webhook URL



    let finalWebhook = editWebhookUrl.trim();



    if (finalWebhook && !finalWebhook.endsWith('/api/webhook')) {



      try {



        const url = new URL(finalWebhook);



        if (url.pathname === '/' || url.pathname === '') {



          finalWebhook = finalWebhook.replace(/\/$/, '') + '/api/webhook';



        }



      } catch (e) {



        if (profile?.webhook_url?.endsWith('/api/webhook')) {



          finalWebhook = finalWebhook.replace(/\/$/, '') + '/api/webhook';



        }



      }



    }







    try {



      const { error } = await supabase



        .from('merchants')



        .update({



          owner_name: editOwnerName.trim(),



          phone_number: editPhoneNumber.trim(),



          business_name: editBusinessName.trim(),



          upi_id: editUpiId.trim(),



          webhook_url: finalWebhook,



          theme_color: editThemeColor.trim(),



          gstin: editGstin.trim(),



          business_address: editBusinessAddress.trim(),



          business_category: editBusinessCategory,



          bank_account_number: editBankAccountNumber.trim(),



          bank_ifsc: editBankIfsc.trim().toUpperCase(),



          bank_account_name: editBankAccountName.trim(),



          bank_name: editBankName.trim(),



          enable_bank_transfer: editEnableBankTransfer



        })



        .eq('id', user.id);







      if (error) throw error;







      // Update active profile state dynamically



      setProfile(prev => ({



        ...prev,



        owner_name: editOwnerName.trim(),



        phone_number: editPhoneNumber.trim(),



        business_name: editBusinessName.trim(),



        upi_id: editUpiId.trim(),



        webhook_url: finalWebhook,



        theme_color: editThemeColor.trim(),



        gstin: editGstin.trim(),



        business_address: editBusinessAddress.trim(),



        business_category: editBusinessCategory,



        bank_account_number: editBankAccountNumber.trim(),



        bank_ifsc: editBankIfsc.trim().toUpperCase(),



        bank_account_name: editBankAccountName.trim(),



        bank_name: editBankName.trim(),



        enable_bank_transfer: editEnableBankTransfer



      }));







      setProfileSuccessMsg('Profile settings updated successfully!');



      setTimeout(() => setProfileSuccessMsg(null), 4000);



    } catch (err) {



      console.error('Error updating merchant profile:', err);



      setProfileErrorMsg(err.message || 'Failed to save merchant settings.');



    } finally {



      setProfileSaving(false);



    }



  };







  const handleChangePassword = async () => {



    setPasswordResetError(null);



    setPasswordResetSuccess(null);







    // Password validations



    if (!currentPassword) {



      setPasswordResetError('Current password is required.');



      return;



    }



    if (!newPassword) {



      setPasswordResetError('Password field cannot be empty.');



      return;



    }



    if (newPassword.length < 8) {



      setPasswordResetError('Password must be at least 8 characters.');



      return;



    }



    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {



      setPasswordResetError('Password must contain at least one uppercase letter, one number, and one special character.');



      return;



    }



    if (newPassword !== confirmPassword) {



      setPasswordResetError('Passwords do not match.');



      return;



    }



    setPasswordResetLoading(true);



    try {



      // 1. Verify current password by attempting sign in



      const { error: signInError } = await supabase.auth.signInWithPassword({



        email: user.email,



        password: currentPassword



      });



      



      if (signInError) {



        throw new Error('Incorrect current password. Please try again.');



      }







      // 2. Proceed with updating the password



      const { error } = await supabase.auth.updateUser({



        password: newPassword



      });







      if (error) throw error;







      setPasswordResetSuccess('Your account password was updated successfully!');



      setNewPassword('');



      setConfirmPassword('');



      setCurrentPassword('');



      setTimeout(() => setPasswordResetSuccess(null), 4000);



    } catch (err) {



      console.error('Error resetting password:', err);



      setPasswordResetError(err.message || 'Failed to update account password.');



    } finally {



      setPasswordResetLoading(false);



    }



  };;







  const copyApiKey = () => {
    if (!profile?.api_key) return;
    const isSandbox = profile.sandbox_mode !== false;
    const prefix = isSandbox ? 'test_' : 'live_';
    navigator.clipboard.writeText(prefix + profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateApiKey = async () => {
    if (!confirm("Are you absolutely sure you want to rotate your API key? All active website integrations, mobile SDKs, and payment checkouts using this key will immediately break!")) {
      return;
    }
    try {
      setSaving(true);
      const newKey = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const { error } = await supabase.from('merchants').update({ api_key: newKey }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, api_key: newKey });
      alert("API key rotated successfully. Please update your backend environment variables immediately.");
    } catch (err) {
      console.error("Failed to rotate key:", err);
      alert("Failed to rotate API Key. Please try again.");
    } finally {
      setSaving(false);
    }
  };







  const handleTestWebhook = async (fromWizard = false) => {



    const webhookTarget = fromWizard ? (wizardWebhookUrl || profile?.webhook_url) : (profile?.webhook_url || wizardWebhookUrl);



    if (!webhookTarget) {



      if (fromWizard) {



        setStepTestResult('fail');



        setStepTestMsg('No webhook URL entered');



        setStepTestDetail('Enter your server webhook URL in the field above to test delivery.');



      } else {



        alert("Please configure an Outbound Webhook URL in your Settings tab first!");



      }



      return;



    }



    if (fromWizard) {



      setStepTestResult('testing');



      setStepTestMsg('Dispatching signed HMAC event to your webhook URL...');



      setStepTestDetail('');



    }



    setTestingWebhook(true);



    try {



      const res = await fetch('/api/merchant/test-webhook', {



        method: 'POST',



        headers: { 'Content-Type': 'application/json' },



        body: JSON.stringify({



          api_key: profile.api_key,



          webhook_url: webhookTarget,



          amount: linkAmount,



          note: linkNote



        })



      });



      const data = await res.json();



      



      const newLog = {



        id: Date.now(),



        timestamp: new Date().toLocaleTimeString(),



        url: webhookTarget,



        status: data.status,



        statusText: data.statusText,



        latency: data.latency,



        success: data.success,



        response: data.response



      };



      



      setWebhookLogs(prev => [newLog, ...prev].slice(0, 10));







      if (fromWizard) {



        if (data.success) {



          // Save the tested webhook URL to profile automatically



          if (wizardWebhookUrl && wizardWebhookUrl !== profile?.webhook_url) {



            await supabase.from('merchants').update({ webhook_url: wizardWebhookUrl }).eq('id', user.id);



            setProfile(prev => ({ ...prev, webhook_url: wizardWebhookUrl }));



          }



          setStepTestResult('pass');



          setStepTestMsg(`\u2713 Webhook delivered \u2192 HTTP ${data.status} in ${data.latency}ms`);



          setStepTestDetail('Your server responded correctly. HMAC signature delivery confirmed. URL saved to your profile.');



        } else {



          setStepTestResult('fail');



          setStepTestMsg(`\u2717 Webhook failed \u2192 HTTP ${data.status || 'ERR'} (${data.latency}ms)`);



          setStepTestDetail('Your endpoint returned an error. Check that the URL is publicly reachable and your server is running.');



        }



      }



    } catch (err) {



      console.error("Webhook test dispatch failed:", err);



      if (fromWizard) {



        setStepTestResult('fail');



        setStepTestMsg('✗ Connection failed — endpoint unreachable');



        setStepTestDetail('Use ngrok to expose your local server: ngrok http <port>');



      } else {



        alert("Failed to send webhook test event: " + err.message);



      }



    } finally {



      setTestingWebhook(false);



    }



  };







  // Step-specific live tests



  const runStepTest = async () => {



    setStepTestResult('testing');



    setStepTestMsg('');



    setStepTestDetail('');







    if (integrationTarget === 'email_forwarding') {



      if (wizardStep === 1) {



        setStepTestResult('pass');



        setStepTestMsg('✓ Target email format validated');



        setStepTestDetail('Your unique forwarding address is correctly mapped to your merchant profile API key.');



      } else if (wizardStep === 2) {



        setStepTestResult('pass');



        setStepTestMsg('✓ Gmail configuration initialized');



        setStepTestDetail('Follow Gmail instructions to send the verification mail.');



      } else if (wizardStep === 3) {



        if (profile?.gmail_verification_code) {



          setStepTestResult('pass');



          setStepTestMsg('✓ Gmail forwarding confirmed & verified');



          setStepTestDetail('Google confirmation link has been intercepted and verified.');



        } else {



          try {



            const { data } = await supabase.from('merchants').select('gmail_verification_code').eq('id', user.id).single();



            if (data?.gmail_verification_code) {



              setProfile(prev => ({ ...prev, gmail_verification_code: data.gmail_verification_code }));



              setStepTestResult('pass');



              setStepTestMsg('✓ Gmail forwarding confirmed & verified');



              setStepTestDetail('Google confirmation link has been intercepted and verified.');



            } else {



              setStepTestResult('fail');



              setStepTestMsg('✗ Gmail forwarding link not yet received');



              setStepTestDetail('Google has not sent the email to the forwarding address yet. Please click the Proceed button in Gmail.');



            }



          } catch (e) {



            setStepTestResult('fail');



            setStepTestMsg('✗ Fetch error: ' + e.message);



            setStepTestDetail('Failed to check database for verification code.');



          }



        }



      } else if (wizardStep === 4) {



        setStepTestResult('pass');



        setStepTestMsg('✓ Gmail bank alerts routing rule created');



        setStepTestDetail('Congratulations! Email alerts from your bank will now auto-verify payments.');



      }



      return;



    }







    // Step 1: Verify API key is valid by hitting /api/merchant



    if (wizardStep === 1) {



      setStepTestMsg('Validating API key against gateway...');



      try {



        const isSandbox = profile?.sandbox_mode !== false;



        // /api/merchant expects the RAW uuid (no prefix) since DB stores it without prefix



        const rawKey = profile?.api_key || '';



        const res = await fetch(`/api/merchant?key=${encodeURIComponent(rawKey)}`);



        const data = await res.json();



        if (res.ok && data.business_name) {



          setStepTestResult('pass');



          setStepTestMsg(`\u2713 API key verified \u2014 merchant: "${data.business_name}"`);



          setStepTestDetail(`Environment: ${isSandbox ? 'Sandbox' : 'Live'} \u00b7 UPI: ${data.upi_id}`);



        } else {



          setStepTestResult('fail');



          setStepTestMsg(`\u2717 Key validation failed: ${data.error || 'Unknown error'}`);



          setStepTestDetail('Check your API key prefix matches the active environment toggle.');



        }



      } catch (e) {



        setStepTestResult('fail');



        setStepTestMsg('\u2717 Network error: ' + e.message);



        setStepTestDetail('Could not reach the gateway API. Check your connection.');



      }



      return;



    }







    // Step 2: Fire a real test order creation



    if (wizardStep === 2) {



      setStepTestMsg('Creating live test order via POST /api/orders...');



      try {



        const isSandbox = profile?.sandbox_mode !== false;



        const prefix = isSandbox ? 'test_' : 'live_';



        const res = await fetch('/api/orders', {



          method: 'POST',



          headers: { 'Content-Type': 'application/json' },



          body: JSON.stringify({



            api_key: prefix + profile.api_key,



            amount: parseFloat(linkAmount) || 500,



            customer_name: 'Wizard Test',



            customer_phone: '9000000000',



            note: linkNote || 'wizard_test',



          })



        });



        const data = await res.json();



        if (res.ok && data.orderId) {



          setStepTestResult('pass');



          setStepTestMsg(`✓ Order created — ID: ${data.orderId.slice(0, 18)}...`);



          setStepTestDetail(`Amount: ₹${data.orderAmount} · Mode: ${data.mode} · Use this orderId in the redirect URL.`);



        } else {



          setStepTestResult('fail');



          setStepTestMsg(`✗ Order creation failed: ${data.error || 'Unknown'}`);



          setStepTestDetail('Make sure your API key is correct and your merchant account is active.');



        }



      } catch (e) {



        setStepTestResult('fail');



        setStepTestMsg('✗ Network error: ' + e.message);



        setStepTestDetail('Could not reach /api/orders endpoint.');



      }



      return;



    }







    // Step 3: Fetch latest order status from /api/orders



    if (wizardStep === 3) {



      setStepTestMsg('Fetching latest order status from /api/orders...');



      try {



        const latestOrder = orders[0];



        if (!latestOrder) {



          setStepTestResult('fail');



          setStepTestMsg('\u2717 No orders found to poll');



          setStepTestDetail('Complete Step 2 first to create a test order, then come back to test polling.');



          return;



        }



        const res = await fetch(`/api/orders?id=${latestOrder.id}`);



        const data = await res.json();



        if (res.ok && data.orderId) {



          setStepTestResult('pass');



          setStepTestMsg(`\u2713 Status polled \u2014 order is: "${data.status}"`);



          setStepTestDetail(`Order ID: ${data.orderId} \u00b7 Amount: \u20b9${data.amount} \u00b7 Polling endpoint confirmed working.`);



        } else {



          setStepTestResult('fail');



          setStepTestMsg(`\u2717 Status fetch failed: ${data.error || 'Unknown'}`);



          setStepTestDetail('The /api/orders?id= endpoint returned an error. Check your API and database connection.');



        }



      } catch (e) {



        setStepTestResult('fail');



        setStepTestMsg('\u2717 Network error: ' + e.message);



        setStepTestDetail('Could not reach /api/orders endpoint.');



      }



      return;



    }







    // Step 4: Test webhook dispatch



    if (wizardStep === 4) {



      await handleTestWebhook(true);



      return;



    }



  };







  const handleDismissVerification = async () => {



    try {



      await supabase



        .from('merchants')



        .update({ gmail_verification_code: null })



        .eq('id', user.id);



      



      setProfile({ ...profile, gmail_verification_code: null });



    } catch (error) {



      console.error('Failed to dismiss banner', error);



    }



  };







  // Filter Transactions list



  const filteredOrders = useMemo(() => {



    return orders.filter(o => {



      // Separator filter based on environment mode



      const isTestOrder = o.mode === 'test';



      const activeSandbox = profile?.sandbox_mode !== false;



      if (isTestOrder !== activeSandbox) return false;







      // Status filter



      if (statusFilter !== 'all' && o.status !== statusFilter) return false;



      



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



  }, [orders, searchQuery, statusFilter, profile]);







  // Calculations for Metrics Cards



  const stats = useMemo(() => {



    const activeSandbox = profile?.sandbox_mode !== false;



    const modeFiltered = orders.filter(o => (o.mode === 'test') === activeSandbox);



    



    // Filter by timeframe



    const cutoffDate = new Date();



    cutoffDate.setDate(cutoffDate.getDate() - analyticsTimeframe);



    const timeframeFiltered = modeFiltered.filter(o => new Date(o.created_at) >= cutoffDate);



    



    const verified = timeframeFiltered.filter(o => o.status === 'verified');



    const totalVolume = verified.reduce((sum, o) => sum + parseFloat(o.amount), 0);



    



    // Success Rate



    const totalCount = timeframeFiltered.length;



    const verifiedCount = verified.length;



    const successRate = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;



    



    // Average Verification Time



    const verificationTimes = verified



      .filter(o => o.verified_at && o.created_at)



      .map(o => (new Date(o.verified_at) - new Date(o.created_at)) / 1000); // in seconds



    const avgSecs = verificationTimes.length > 0



      ? verificationTimes.reduce((sum, t) => sum + t, 0) / verificationTimes.length



      : 0;



      



    let avgSettlementText = 'Instant P2P';



    if (avgSecs > 0) {



      if (avgSecs < 60) {



        avgSettlementText = `${avgSecs.toFixed(1)}s (Avg)`;



      } else {



        avgSettlementText = `${(avgSecs / 60).toFixed(1)} min (Avg)`;



      }



    }







    // Today's counts



    const today = new Date();



    today.setHours(0, 0, 0, 0);



    const todayVerified = verified.filter(o => new Date(o.created_at) >= today);



    const todayVolume = todayVerified.reduce((sum, o) => sum + parseFloat(o.amount), 0);







    const pendingCount = modeFiltered.filter(o => o.status === 'pending').length;







    return {



      totalVolume,



      totalCount: verifiedCount,



      successRate,



      avgSettlementText,



      todayVolume,



      todayCount: todayVerified.length,



      pendingCount



    };



  }, [orders, profile, analyticsTimeframe]);







  // Compile Time-Series Data for Area Chart over selected timeframe



  const chartData = useMemo(() => {



    const activeSandbox = profile?.sandbox_mode !== false;



    const modeFiltered = orders.filter(o => (o.mode === 'test') === activeSandbox);



    const verified = modeFiltered.filter(o => o.status === 'verified');



    const days = [];



    for (let i = analyticsTimeframe - 1; i >= 0; i--) {



      const d = new Date();



      d.setDate(d.getDate() - i);



      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });



      days.push({



        date: dateStr,



        rawDate: d,



        sales: 0,



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



          day.sales += parseFloat(order.amount);



          day.orders += 1;



        }



      });



    });







    return days.map(({ date, sales, orders }) => ({



      date,



      sales: parseFloat(sales.toFixed(2)),



      orders



    }));



  }, [orders, profile, analyticsTimeframe]);







  const CustomTooltip = ({ active, payload, label }) => {



    if (active && payload && payload.length) {



      return (



        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl z-50">



          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>



          <p className="text-base font-black text-slate-900 mt-1.5 flex items-baseline">



            <span className="text-xs font-bold text-slate-400 mr-0.5">₹</span>



            {payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}



          </p>



          <p className="text-[10px] text-blue-600 font-bold mt-0.5">



            {payload[0].payload.orders} {payload[0].payload.orders === 1 ? 'order' : 'orders'} verified



          </p>



        </div>



      );



    }



    return null;



  };







  // Client-side CSV Download



  const downloadCSV = () => {



    const headers = ['Order ID', 'Date & Time', 'Customer Name', 'Customer Phone', 'Amount (INR)', 'Note', 'UTR Reference', 'Status'];



    const rows = filteredOrders.map(o => [



      o.id,



      new Date(o.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),



      o.customer_name || 'Anonymous',



      o.customer_phone || 'N/A',



      parseFloat(o.amount).toFixed(2),



      o.note || '',



      o.utr || 'N/A',



      o.status



    ]);







    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');



    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });



    const url = URL.createObjectURL(blob);



    const link = document.createElement('a');



    link.setAttribute('href', url);



    link.setAttribute('download', `mymobpay_report_${new Date().toISOString().split('T')[0]}.csv`);



    document.body.appendChild(link);



    link.click();



    document.body.removeChild(link);



  };







  // Interactive link builder



  const generatedPaymentLink = useMemo(() => {



    if (typeof window === 'undefined') return '';



    const host = window.location.origin;



    const key = profile?.api_key || 'YOUR_API_KEY';



    const project = profile?.business_name ? encodeURIComponent(profile.business_name) : '';
    return `${host}/pay?project=${project}&amount=${linkAmount}&note=${encodeURIComponent(linkNote)}`;



  }, [profile, linkAmount, linkNote]);







  const copyPaymentLink = () => {



    navigator.clipboard.writeText(generatedPaymentLink);



    setCopiedLink(true);



    setTimeout(() => setCopiedLink(false), 2000);



  };







  const copySnippet = (id, text) => {



    navigator.clipboard.writeText(text);



    setCopiedSnippet(id);



    setTimeout(() => setCopiedSnippet(null), 2000);



  };







  // REST API and SDK code snippets



  const snippets = {



    js: `// 1. Create a payment order via Node.js/Javascript



const createOrder = async () => {



  const response = await fetch('https://your-domain.com/api/orders', {



    method: 'POST',



    headers: { 'Content-Type': 'application/json' },



    body: JSON.stringify({



      api_key: "${profile?.api_key || 'YOUR_API_KEY'}",



      amount: ${parseFloat(linkAmount) || 500.00},



      customer_name: "CUSTOMER_NAME",



      customer_phone: "CUSTOMER_PHONE",



      note: "${linkNote}",



      callback_url: "https://your-website.com/api/callback"



    })



  });



  const data = await response.json();



  console.log("MyMobPay Order Created:", data.orderId);



  // Redirect customer to: \`https://your-domain.com/pay?order_id=\${data.orderId}\`



};`,



    python: `# 2. Create a payment order via Python Requests



import requests







payload = {



    "api_key": "${profile?.api_key || 'YOUR_API_KEY'}",



    "amount": ${parseFloat(linkAmount) || 500.00},



    "customer_name": "CUSTOMER_NAME",



    "customer_phone": "CUSTOMER_PHONE",



    "note": "${linkNote}",



    "callback_url": "https://your-website.com/api/callback"



}







res = requests.post("https://your-domain.com/api/orders", json=payload)



data = res.json()



print("Order ID:", data.get("orderId"))`,



    php: `<?php



// 3. Create a payment order via PHP cURL



$payload = [



    "api_key" => "${profile?.api_key || 'YOUR_API_KEY'}",



    "amount" => ${parseFloat(linkAmount) || 500.00},



    "customer_name" => "CUSTOMER_NAME",



    "customer_phone" => "CUSTOMER_PHONE",



    "note" => "${linkNote}",



    "callback_url" => "https://your-website.com/api/callback"



];







$ch = curl_init("https://your-domain.com/api/orders");



curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);



curl_setopt($ch, CURLOPT_POST, true);



curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));



curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);







$response = curl_exec($ch);



$data = json_decode($response, true);



echo "Order Created: " . $data['orderId'];



?>`



  };







  if (loading) {



    return (



      <div className="min-h-screen bg-slate-50 flex items-center justify-center">



        <div className="flex flex-col items-center gap-4">



          <MyMobPayLogo className="w-48 h-auto mb-1" textColor="#0c2340" />
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />



          <p className="text-sm text-slate-500 font-medium">Loading merchant console...</p>



        </div>



      </div>



    );



  }



  



  const renderPaywallBlocker = () => {
    return (
      <ConsoleActivationPaywall
        profile={profile}
        user={user}
        fetchProfile={fetchProfile}
        fetchSubscriptionHistory={fetchSubscriptionHistory}
        historyOrders={historyOrders}
        historyLoading={historyLoading}
        handleSignOut={handleSignOut}
        onActivationComplete={() => {
          setActivationDismissed(true);
        }}
      />
    );
  };

  const isAdminMerchant = profile?.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || profile?.api_key === CONFIG.platformApiKey;

  const isSubExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now();
  const isInactiveNow = profile?.subscription_status !== 'active' || isSubExpired;

  // Paywall blocker removed: Merchants have immediate access to dashboard with Test API key!
  // Live mode and Live API keys are locked behind subscription/trial.







  // Helper: Get comprehensive subscription and trial details
  const getSubscriptionDetails = () => {
    if (!profile) return null;
    const isSubActive = profile.subscription_status === 'active';
    const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    const isValidExpiry = expiresAt && !isNaN(expiresAt.getTime());
    const isExpired = isValidExpiry && expiresAt.getTime() < Date.now();
    const active = isSubActive && isValidExpiry && !isExpired;

    const setupProg = profile.setup_progress || {};
    const isTrial = setupProg.plan_type === 'trial_3day' || 
                    setupProg.plan_type === 'autopay_trial' || 
                    Boolean(setupProg.trial_activated_at) ||
                    Boolean(historyOrders.find(o => o.status === 'verified' && (o.note === 'Trial_Setup_3Day' || o.note === 'Autopay_Setup_3DayTrial')));

    let activatedAt = null;
    if (setupProg.trial_activated_at) {
      activatedAt = new Date(setupProg.trial_activated_at);
    } else if (setupProg.subscription_activated_at) {
      activatedAt = new Date(setupProg.subscription_activated_at);
    } else {
      const verifiedSub = historyOrders.find(o => o.status === 'verified' && (o.note?.includes('Trial') || o.note?.startsWith('Subscription_')));
      if (verifiedSub) {
        activatedAt = new Date(verifiedSub.verified_at || verifiedSub.created_at);
      } else if (expiresAt) {
        const daysToSubtract = isTrial ? 3 : 30;
        activatedAt = new Date(expiresAt.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
      } else {
        activatedAt = profile.created_at ? new Date(profile.created_at) : null;
      }
    }

    const now = Date.now();
    const msLeft = isValidExpiry ? expiresAt.getTime() - now : 0;
    const daysLeft = isValidExpiry ? Math.max(0, Math.ceil(msLeft / 86400000)) : null;
    const hoursLeft = isValidExpiry ? Math.max(0, Math.floor((msLeft % 86400000) / 3600000)) : null;

    return {
      active,
      isTrial,
      planName: isTrial ? '3-Day Free Trial' : 'Premium Subscription Tier',
      activatedAt,
      expiresAt,
      daysLeft,
      hoursLeft,
      rawStatus: profile.subscription_status
    };
  };

  const getDaysLeft = () => {
    const sub = getSubscriptionDetails();
    return sub?.daysLeft ?? null;
  };







  const renderSubscriptionPanel = () => {



    const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;



    const isValidExpiry = expiresAt && !isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now();



    const daysLeft = isValidExpiry ? Math.ceil((expiresAt - new Date()) / 86400000) : null;



    const isActive = profile?.subscription_status === 'active';



    const isUrgent = daysLeft !== null && daysLeft <= 7;



    const months = customMonths ? parseInt(customMonths) || 1 : selectedMonths;



    const total = CONFIG.subscriptionFee * months;



    const payUrl = `/pay?api_key=${CONFIG.platformApiKey}&amount=${total}&ref=${profile?.id}&note=Subscription_${months}Month&order_id=${generateOrderId('order')}`;







    const handleRefreshStatus = async () => {



      setStatusChecking(true);



      if (user?.id) await fetchProfile(user.id);



      setStatusChecking(false);



    };







    return (



      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full animate-fade-up">



        {/* Title */}



        <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-5">



          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">



            <Star className="w-5 h-5 text-violet-500 fill-violet-400" />



            API License & Subscription



          </h3>



          <p className="text-xs text-slate-500 font-semibold">



            Monitor API operational status, extend runtime license, and retrieve historical transactions.



          </p>



        </div>







        {/* ── HIGH CONTRAST HERO STATUS CARD ── */}



        <div className="relative rounded-3xl bg-[#090D1A] text-white-pure border border-[#1E293B] overflow-hidden p-8 shadow-xl">



          {/* decorative blobs */}



          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />



          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />







          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">



            {/* Left Info: 8 cols */}



            <div className="md:col-span-8 flex flex-col gap-4">



              <div className="flex items-center gap-2">



                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 ${



                  isActive ? 'text-emerald-400' : 'text-rose-400'



                }`}>



                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />



                  {isActive ? 'API LICENSE ACTIVE' : 'LICENSE EXPIRED'}



                </span>



                



                <span className="text-white-pure/60 text-[10px] font-bold uppercase tracking-wider font-mono bg-white/5 px-2.5 py-0.5 rounded-md">



                  UID: {profile?.id ? profile.id.substring(0, 8) + '...' : 'N/A'}



                </span>



              </div>







              <div>



                <h4 className="text-2xl font-black tracking-tight leading-tight">



                  {daysLeft !== null ? (



                    <>{daysLeft} <span className="text-slate-400 text-lg font-bold">days remaining</span></>



                  ) : isActive ? (



                    'Developer Access Active'



                  ) : (



                    'License Inactive'



                  )}



                </h4>



                



                <p className="text-white-pure/70 text-xs mt-2 font-medium leading-relaxed max-w-md">
                  {isActive 
                    ? `Your payment gateway operates fully. Next billing on ${expiresAt ? expiresAt.toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Not configured'}.`
                    : 'Your API routing is locked. Renew your monthly license to restore webhook relays and bank deposits matches.'
                  }
                </p>

                {/* Activation & Expiry Date Highlight Cards */}
                {(() => {
                  const sub = getSubscriptionDetails();
                  if (!sub || !sub.active) return null;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Activation Date</span>
                          <span className="text-xs font-black text-white truncate block">
                            {sub.activatedAt ? sub.activatedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Expiry Date</span>
                          <span className="text-xs font-black text-amber-300 truncate block">
                            {sub.expiresAt ? sub.expiresAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}



              </div>



            </div>







            {/* Right Action: 4 cols */}



            <div className="md:col-span-4 flex flex-col gap-2.5 w-full shrink-0">



              <button



                onClick={() => setShowManageSection(!showManageSection)}



                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl transition-all text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"



              >



                {showManageSection ? 'Close Renewal Drawer' : 'Extend API License'}



                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showManageSection ? 'rotate-180' : ''}`} />



              </button>



              



              <button



                onClick={handleRefreshStatus}



                disabled={statusChecking}



                className="w-full py-2.5 bg-[#121829] hover:bg-[#1A233A] border border-[#1E293B] text-slate-300 hover:text-white-pure rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"



              >



                {statusChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}



                Sync Database Status



              </button>



            </div>



          </div>







          {/* Urgent Warning Banner */}



          {isUrgent && (



            <div className="relative z-10 mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-400/20 rounded-2xl px-4 py-3">



              <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />



              <div className="text-xs">



                <p className="text-amber-200 font-bold uppercase tracking-wider text-[10px]">Action Required</p>



                <p className="text-amber-300/80 font-medium mt-0.5">Your subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Renew your license to avoid sandbox or live API blocks.</p>



              </div>



            </div>



          )}



        </div>







        {/* ── RENEWAL DRAWER (expandable) ── */}



        {showManageSection && (



          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm flex flex-col gap-6 animate-fade-up">



            <div>



              <h3 className="text-sm font-black text-slate-900">Select Renewal Plan</h3>



              <p className="text-xs text-slate-500 font-medium mt-0.5">Choose a license duration to extend gateway run-time. Billed at flat ₹{CONFIG.subscriptionFee}/mo.</p>



            </div>







            {/* Renewal Packages Grid */}



            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">



              {[



                { months: 1, title: '1 Month Standard', label: 'Basic', badge: null },



                { months: 2, title: '2 Months Passage', label: 'Standard', badge: null },



                { months: 3, title: '3 Months Quarterly', label: 'Popular', badge: 'POPULAR' },



              ].map(pkg => {



                const isSelected = selectedMonths === pkg.months && !customMonths;



                return (



                  <button



                    key={pkg.months}



                    onClick={() => { setSelectedMonths(pkg.months); setCustomMonths(''); }}



                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-[115px] cursor-pointer relative ${



                      isSelected



                        ? 'border-blue-600 bg-blue-50/20 text-slate-900 shadow-sm'



                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 text-slate-700'



                    }`}



                  >



                    {pkg.badge && (



                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-indigo-650 text-white text-[8px] font-black uppercase tracking-widest shadow-sm">



                        {pkg.badge}



                      </span>



                    )}



                    <div>



                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">{pkg.label}</span>



                      <span className="text-xs font-black text-slate-900 block mt-1">{pkg.title}</span>



                    </div>



                    <div className="flex items-baseline gap-0.5">



                      <span className="text-xs font-bold text-slate-400">₹</span>



                      <span className="text-lg font-black text-slate-900">{(CONFIG.subscriptionFee * pkg.months).toLocaleString('en-IN')}</span>



                    </div>



                  </button>



                );



              })}







              {/* Custom Input Package */}



              <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-[115px] relative ${



                customMonths



                  ? 'border-blue-600 bg-blue-50/20'



                  : 'border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-slate-300'



              }`}>



                <div>



                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Flexible</span>



                  <span className="text-xs font-black text-slate-900 block mt-1">Custom Months</span>



                </div>



                



                <div className="relative flex items-center mt-2">



                  <input



                    type="number"



                    min="1"



                    max="24"



                    placeholder="Enter"



                    value={customMonths}



                    onChange={e => { setCustomMonths(e.target.value); setSelectedMonths(0); }}



                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-black text-slate-900 focus:outline-none focus:border-blue-500 pr-10 placeholder:text-slate-400 placeholder:font-bold"



                  />



                  <span className="absolute right-2 text-[9px] font-bold text-slate-400 font-mono">Mos</span>



                </div>



              </div>



            </div>







            {/* Receipt Summary Box */}



            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mt-2">



              <div className="space-y-1">



                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">ORDER DETAILS</span>



                <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5">



                  <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-400" />



                  Premium Developer Gateway — {months} Month{months > 1 ? 's' : ''} Extension



                </p>



                <div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono pt-1">



                  <span>Rate: ₹{CONFIG.subscriptionFee}/mo</span>



                  <span>Surcharge: ₹0.00</span>



                </div>



              </div>







              <div className="flex sm:flex-row items-center gap-5 shrink-0 self-end sm:self-auto">



                <div className="text-right sm:text-right flex flex-col sm:items-end">



                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NET AMOUNT DUE</span>



                  <span className="text-xl font-black text-slate-900 tracking-tight font-mono leading-none mt-1">



                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}



                  </span>



                </div>







                <button



                  onClick={() => window.open(payUrl, '_blank')}



                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer active:scale-98"



                >



                  <QrCode className="w-4 h-4" />



                  Activate via UPI



                </button>



              </div>



            </div>



            



            {/* VPA and security notice */}



            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-bold select-none uppercase tracking-wider">



              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Secured B2B P2P checkout transaction</span>



              <div className="flex gap-2">



                <span className="px-1.5 py-0.5 bg-slate-100 rounded">GPAY</span>



                <span className="px-1.5 py-0.5 bg-slate-100 rounded">PHONEPE</span>



                <span className="px-1.5 py-0.5 bg-slate-100 rounded">PAYTM</span>



                <span className="px-1.5 py-0.5 bg-slate-100 rounded">BHIM</span>



              </div>



            </div>



          </div>



        )}







        {/* ── PAYMENT HISTORY ── */}



        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">



          <div className="flex items-center justify-between">



            <div>



              <h3 className="text-sm font-black text-slate-900">Payment History</h3>



              <p className="text-xs text-slate-500 font-medium mt-0.5">Your past subscription renewals</p>



            </div>



            <Clock className="w-4 h-4 text-slate-400" />



          </div>







          {historyLoading ? (



            <div className="py-10 flex flex-col items-center gap-2">



              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />



              <p className="text-xs text-slate-400 font-semibold">Loading history...</p>



            </div>



          ) : historyOrders.length === 0 ? (



            <div className="py-10 flex flex-col items-center gap-2 bg-slate-50 rounded-2xl">



              <Calendar className="w-8 h-8 text-slate-400" />



              <p className="text-xs text-slate-400 font-semibold">No payment history yet</p>



            </div>



          ) : (



            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">



              {historyOrders.map(order => {



                const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });



                const statusStyles = {



                  verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',



                  pending:  'bg-amber-50  text-amber-700  border-amber-100',



                };



                const style = statusStyles[order.status] || 'bg-red-50 text-red-700 border-red-100';



                return (



                  <div key={order.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl transition-all">



                    <div>



                      <p className="text-sm font-black text-slate-800">₹{parseFloat(order.amount).toLocaleString('en-IN')}</p>



                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{dateStr} · #{order.id}</p>



                    </div>



                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide border ${style}`}>



                      {order.status}



                    </span>



                  </div>



                );



              })}



            </div>



          )}



        </div>







        <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 justify-center pb-2">



          <Shield className="w-3.5 h-3.5 text-emerald-500" /> Active accounts process transactions in real-time.



        </p>



      </div>



    );



  };







  const renderPaymentLinksPanel = () => {



    // Helper to calculate status of payment link



    const getLinkPaymentStatus = (link) => {



      const matchingOrders = orders.filter(o => {



        if (o.external_ref) {



          if (o.external_ref === link.id || o.external_ref.startsWith(link.id + ":")) {



            return true;



          }



        }



        const isFlexible = link.amount === 'Flexible';



        const orderAmt = parseFloat(o.amount);



        const linkAmt = parseFloat(link.amount);



        const amtMatches = isFlexible || (Math.abs(orderAmt - linkAmt) < 2.0);



        const purposeMatches = o.note === link.purpose;



        return amtMatches && purposeMatches;



      });







      const isPaid = matchingOrders.some(o => o.status === 'verified');



      return isPaid ? 'Paid' : 'Pending';



    };







    // Generate URL dynamically on form input changes or when "Generate" is clicked



    const generateUrl = (linkId) => {



      if (typeof window === 'undefined') return '';



      const host = window.location.origin;



      const key = profile?.api_key || 'YOUR_API_KEY';



      



      const params = new URLSearchParams();



      params.append('key', key);



      if (payLinkAmount) params.append('amount', payLinkAmount);



      if (payLinkPurpose) params.append('note', payLinkPurpose);



      if (payLinkRef) params.append('ref', payLinkRef);



      if (payLinkProject) params.append('project', payLinkProject);



      if (payLinkCustomerName) params.append('name', payLinkCustomerName);



      if (payLinkCustomerPhone) params.append('phone', payLinkCustomerPhone);



      if (linkId) params.append('lid', linkId);



      



      return `${host}/pay?${params.toString()}`;



    };







    const handleCreateLink = async (e) => {



      e.preventDefault();



      const linkId = Math.random().toString(36).substr(2, 9);



      



      let url = '';



      let isPreGenerated = false;



      let dbOrderId = '';



      



      // Pre-generate order in database immediately if amount is specified



      if (payLinkAmount && parseFloat(payLinkAmount) > 0) {



        try {



          const res = await fetch('/api/orders', {



            method: 'POST',



            headers: { 'Content-Type': 'application/json' },



            body: JSON.stringify({



              api_key: profile?.api_key ? (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key : 'YOUR_API_KEY',



              amount: parseFloat(payLinkAmount),



              note: payLinkPurpose || 'Payment',



              customer_name: payLinkCustomerName || '',



              customer_phone: payLinkCustomerPhone || '',



              external_ref: linkId, // store linkId for tracking



              project: payLinkProject || undefined,



              method: 'LINK'



            })



          });



          const data = await res.json();



          if (res.ok && data.orderId) {



            dbOrderId = data.orderId;



            // Include api_key + amount so the checkout page shows the right merchant
            // and amount immediately (without waiting for the order API fetch)
            const preParams = new URLSearchParams();
            preParams.set('order_id', data.orderId);
            if (profile?.api_key) preParams.set('key', (profile.sandbox_mode !== false ? 'test_' : 'live_') + profile.api_key);
            if (payLinkAmount) preParams.set('amount', payLinkAmount);
            url = `${window.location.origin}/pay?${preParams.toString()}`;



            isPreGenerated = true;



          } else {



            console.error('Failed to pre-generate order:', data.error);



          }



        } catch (err) {



          console.error('Error pre-generating order:', err);



        }



      }



      



      // Fallback to client-side URL if amount is flexible or API call fails



      if (!isPreGenerated) {



        url = generateUrl(linkId);



      }



      



      setPayLinkGeneratedUrl(url);







      const newLink = {



        id: linkId,



        orderId: dbOrderId || null,



        amount: payLinkAmount ? parseFloat(payLinkAmount).toFixed(2) : 'Flexible',



        purpose: payLinkPurpose || 'Payment',



        url: url,



        createdAt: new Date().toISOString(),



        ref: payLinkRef || '',



      };







      const linkWithMerchant = { ...newLink, merchantId: profile?.id };
      const updatedHistory = [linkWithMerchant, ...payLinkHistory];
      setPayLinkHistory(updatedHistory);
      if (profile?.id) {
        localStorage.setItem(`mymobpay_payment_links_${profile.id}`, JSON.stringify(updatedHistory));
      }
    };

    const copyToClipboard = (url) => {
      navigator.clipboard.writeText(url);
      setPayLinkCopied(true);
      setTimeout(() => setPayLinkCopied(false), 2000);
    };

    const handleDeleteLink = (id) => {
      const updatedHistory = payLinkHistory.filter(item => item.id !== id);
      setPayLinkHistory(updatedHistory);
      if (profile?.id) {
        localStorage.setItem(`mymobpay_payment_links_${profile.id}`, JSON.stringify(updatedHistory));
      }
    };







    const handleResetForm = () => {



      setPayLinkAmount('');



      setPayLinkPurpose('');



      setPayLinkCustomerName('');



      setPayLinkCustomerPhone('');



      setPayLinkRef('');



      setPayLinkProject('');



      setPayLinkGeneratedUrl('');



    };







    const filteredLinks = payLinkHistory.filter(link => 



      link.purpose.toLowerCase().includes(payLinkSearch.toLowerCase()) ||



      link.amount.toLowerCase().includes(payLinkSearch.toLowerCase()) ||



      link.url.toLowerCase().includes(payLinkSearch.toLowerCase())



    );







    const activeBusinessName = payLinkProject || profile?.business_name || 'Business';







    return (



      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-up">



        



        {/* TOP: Form & Preview grid */}



        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">



          



          {/* LEFT: Premium Link Builder Form (3 cols) */}



          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-7 shadow-sm flex flex-col justify-between">



            <div className="space-y-6">



              <div>



                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">



                  <Sparkles className="w-5 h-5 text-blue-500" />



                  Link Generator



                </h3>



                <p className="text-xs text-slate-550 font-medium mt-1">Configure checkout parameters to request secure payments via UPI.</p>



              </div>







              <form onSubmit={handleCreateLink} className="space-y-5">



                {/* Main Big Box: Amount Input */}



                <div className="bg-slate-50 border border-slate-250 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl p-5 space-y-2 transition-all shadow-sm">



                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider select-none">Amount to Request (INR)</label>



                  <div className="relative">



                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 font-black text-3xl select-none">₹</span>



                    <input 



                      type="number"



                      step="0.01"



                      min="1"



                      placeholder="Enter amount..."



                      value={payLinkAmount}



                      onChange={e => setPayLinkAmount(e.target.value)}



                      className="w-full bg-transparent border-0 focus:outline-none py-1 pl-8 pr-2 text-3xl font-black text-slate-900 placeholder:text-slate-350 placeholder:text-xl placeholder:font-semibold tabular-nums"



                    />



                  </div>



                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Leave empty to let the customer decide their own transfer amount.</span>



                </div>







                {/* Optional parameters toggle */}



                <div className="flex justify-start">



                  <button



                    type="button"



                    onClick={() => setShowOptionalDetails(!showOptionalDetails)}



                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-900 transition-colors tracking-wider select-none cursor-pointer">
                    <span>{showOptionalDetails ? 'Hide optional details' : 'Add note, customer info & advanced parameters (optional)'}</span>



                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showOptionalDetails ? 'rotate-180' : ''}`} />



                  </button>



                </div>







                {/* Collapsible details drawer */}



                {showOptionalDetails && (



                  <div className="space-y-5 pt-2 animate-fade-up animate-duration-200">



                    



                    {/* Note / Purpose */}



                    <div>



                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Payment Note / Purpose</label>



                      <input 



                        type="text"



                        placeholder="e.g. Services, Donation, Invoice payment"



                        value={payLinkPurpose}



                        onChange={e => setPayLinkPurpose(e.target.value)}



                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3.5 text-xs font-semibold text-slate-900 rounded-xl"



                      />



                    </div>







                    {/* Customer Details */}



                    <div className="border-t border-slate-100 pt-4">



                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Information</p>



                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">



                        <div>



                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Customer Name</label>



                          <input 



                            type="text"



                            placeholder="Enter name"



                            value={payLinkCustomerName}



                            onChange={e => setPayLinkCustomerName(e.target.value)}



                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3.5 text-xs font-semibold text-slate-900 rounded-xl"



                          />



                        </div>



                        <div>



                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Customer Phone</label>



                          <input 



                            type="text"



                            placeholder="Enter mobile number"



                            value={payLinkCustomerPhone}



                            onChange={e => setPayLinkCustomerPhone(e.target.value)}



                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3.5 text-xs font-semibold text-slate-900 rounded-xl"



                          />



                        </div>



                      </div>



                    </div>







                    {/* Advanced Parameters */}



                    <div className="border-t border-slate-100 pt-4">



                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Advanced Parameters</p>



                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">



                        <div>



                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Custom Reference / Order ID</label>



                          <input 



                            type="text"



                            placeholder="Enter reference ID"



                            value={payLinkRef}



                            onChange={e => setPayLinkRef(e.target.value)}



                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3.5 text-xs font-semibold text-slate-900 rounded-xl"



                          />



                        </div>



                        <div>



                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Project / Brand Name Override</label>



                          <input 



                            type="text"



                            placeholder="Enter brand override name"



                            value={payLinkProject}



                            onChange={e => setPayLinkProject(e.target.value)}



                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3.5 text-xs font-semibold text-slate-900 rounded-xl"



                          />



                        </div>



                      </div>



                    </div>







                  </div>



                )}







                <button



                  type="submit"



                  className="w-fit mx-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white-pure rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 mt-3 cursor-pointer"



                >



                  <Plus className="w-4 h-4" />



                  Generate Payment Link



                </button>



              </form>



            </div>



          </div>







          {/* RIGHT: Live Interactive Preview / Success Screen (2 cols) */}



          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-7 shadow-sm flex flex-col justify-between items-center min-h-[480px] relative overflow-hidden">



            



            {!payLinkGeneratedUrl ? (



              /* MOCKUP SIMULATOR PREVIEW STATE */



              <div className="w-full h-full flex flex-col justify-between items-center animate-fade-in flex-1">



                <div className="w-full text-center">



                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 justify-center">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>



                    Live Checkout Preview



                  </span>



                  <p className="text-[10px] text-slate-500 font-semibold mt-2">Updates in real-time as you fill the generator</p>



                </div>







                {/* Smartphone Bezel */}



                <div className="my-6 relative w-full max-w-[210px] bg-slate-950 border-4 border-slate-800 rounded-[32px] shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col select-none">



                  {/* Notch */}



                  <div className="absolute top-0 inset-x-0 h-3 flex justify-center z-30">



                    <div className="bg-slate-850 w-14 h-2 rounded-b-md" />



                  </div>







                  {/* Screen Content */}



                  <div className="flex-1 bg-[#0B192C] pt-4 px-3 pb-3 flex flex-col justify-between font-sans text-white-pure text-[9px]">



                    <div className="space-y-2">



                      {/* Top Bar */}



                      <div className="flex justify-between items-center text-[5.5px] font-extrabold text-slate-400 px-0.5">



                        <span>12:45 PM</span>



                        <span className="flex items-center gap-0.5">



                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> LTE



                        </span>



                      </div>







                      {/* Header */}



                      <div className="flex flex-col items-center pt-0.5 border-b border-[#1D2D44] pb-2">



                        <MyMobPayLogo className="w-20 h-auto" textColor="#FFFFFF" />



                      </div>







                      {/* Paying To */}



                      <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2.5 shadow-sm space-y-1">



                        <div className="flex justify-between items-center text-[5px] text-slate-400 font-bold uppercase">



                          <span>Paying To</span>



                          <span className="text-[#3395FF] font-extrabold bg-[#0B2447] px-1 py-0.2 rounded text-[4.5px]">VERIFIED</span>



                        </div>



                        <p className="text-[8.5px] font-black text-white-pure truncate">{activeBusinessName}</p>



                        <p className="text-[6px] text-slate-400 font-semibold truncate -mt-0.5">UPI: {profile?.upi_id || ''}</p>



                      </div>







                      {/* Amount and Note */}



                      <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2.5 shadow-sm space-y-1.5">



                        <div className="flex justify-between items-center text-[5px] text-slate-400 font-bold uppercase">



                          <span>Total Due</span>



                        </div>



                        <div className="flex items-baseline gap-0.5">



                          <span className="text-[8px] font-bold text-slate-400">₹</span>



                          {payLinkAmount ? (



                            <span className="text-sm font-black text-white-pure tracking-tight leading-none">



                              {parseFloat(payLinkAmount) ? parseFloat(payLinkAmount).toFixed(2) : '0.00'}



                            </span>



                          ) : (



                            <span className="text-[9px] font-semibold text-slate-400 italic">Enter Amount on Pay</span>



                          )}



                        </div>



                        



                        <div className="flex justify-between items-center text-[5.5px] text-slate-400 pt-1.5 border-t border-[#1D2D44] font-medium">



                          <span className="truncate">Note: <span className="font-extrabold text-white-pure/80">{payLinkPurpose || ''}</span></span>



                        </div>



                      </div>







                      {/* UPI Selection Mockup */}



                      <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2 shadow-sm space-y-1">



                        <span className="text-[5px] text-slate-400 font-extrabold uppercase tracking-wider block">Scan QR or Tap UPI App</span>



                        <div className="grid grid-cols-2 gap-1 pt-0.5">



                          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (



                            <div key={app} className="p-1 bg-[#0B192C] border border-[#1D2D44] rounded flex items-center gap-1">



                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />



                              <span className="font-extrabold text-[5px] text-slate-400">{app}</span>



                            </div>



                          ))}



                        </div>



                      </div>







                    </div>







                    <div className="pt-2 border-t border-[#1D2D44] text-center text-[5.5px] font-bold text-slate-400 uppercase tracking-wider">



                      🔒 Secured by MyMobPay



                    </div>



                  </div>



                </div>







                <div className="text-[10px] text-slate-400 font-semibold px-4">



                  Fill in the details on the left and click Generate to secure this payment link.



                </div>



              </div>



            ) : (



              /* SUCCESS STATE: QR CODE & SHARING ACTION */



              <div className="w-full h-full flex flex-col justify-between items-center animate-fade-in flex-1">



                <div className="w-full text-center">



                  <div className="inline-flex p-2 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600 mb-2">



                    <CheckCircle className="w-6 h-6 animate-scale-up" />



                  </div>



                  <h3 className="text-sm font-black text-slate-900">Payment Link Generated</h3>



                  <p className="text-xs text-slate-500 font-medium mt-0.5">UPI link &amp; QR are active and live</p>



                </div>







                {/* QR Code Container */}



                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-inner flex flex-col items-center justify-center my-4 transition-transform hover:scale-[1.01]">



                  <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <QRCode value={payLinkGeneratedUrl} size={150} level="H" fgColor="#0f172a" bgColor="#FFFFFF" />
                    <div className="absolute inset-0 m-auto w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100 p-1 pointer-events-none">
                      <svg width="22" height="20" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19" stroke="#0284C7" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5" stroke="#FF7800" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>



                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-3">Scan to Pay via UPI</span>



                </div>







                {/* Sharing Options */}



                <div className="w-full space-y-2 mt-2">



                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">



                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Payment URL</p>



                    <p className="text-[11px] font-mono font-bold text-slate-700 break-all select-all">{payLinkGeneratedUrl}</p>



                  </div>







                  <div className="flex gap-2">



                    <button



                      onClick={() => copyToClipboard(payLinkGeneratedUrl)}



                      className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"



                    >



                      {payLinkCopied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}



                      <span>{payLinkCopied ? 'Copied URL' : 'Copy Link'}</span>



                    </button>



                    <a



                      href={`https://wa.me/?text=${encodeURIComponent("Please make the payment here: " + payLinkGeneratedUrl)}`}



                      target="_blank"



                      rel="noreferrer"



                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"



                    >



                      <Share2 className="w-4 h-4" />



                      <span>WhatsApp</span>



                    </a>



                  </div>







                  <div className="flex gap-2">



                    <a



                      href={payLinkGeneratedUrl}



                      target="_blank"



                      rel="noreferrer"



                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 block cursor-pointer shadow-sm"



                    >



                      <ExternalLink className="w-4 h-4" />



                      Open checkout



                    </a>



                    <button



                      onClick={handleResetForm}



                      className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm"



                    >



                      Create New



                    </button>



                  </div>



                </div>



              </div>



            )}







          </div>







        </div>







        {/* BOTTOM: History Log Directory Section */}



        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">



          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">



            <div>



              <h3 className="text-sm font-black text-slate-900">Generated Links Directory</h3>



              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage and track previously built payment collection links.</p>



            </div>



            



            {/* Search Input */}



            <div className="relative">



              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />



              <input 



                type="text"



                placeholder="Search history..."



                value={payLinkSearch}



                onChange={e => setPayLinkSearch(e.target.value)}



                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 w-full sm:w-60"



              />



            </div>



          </div>







          {payLinkHistory.length === 0 ? (



            <div className="py-12 flex flex-col items-center gap-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">



              <Calendar className="w-8 h-8 text-slate-350" />



              <p className="text-xs text-slate-405 font-bold">No generated payment links yet</p>



            </div>



          ) : filteredLinks.length === 0 ? (



            <div className="py-12 flex flex-col items-center gap-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">



              <Search className="w-8 h-8 text-slate-350" />



              <p className="text-xs text-slate-405 font-bold">No matching links found</p>



            </div>



          ) : (



            <div className="overflow-x-auto">



              <table className="w-full text-left text-xs border-collapse">



                <thead>



                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider select-none font-semibold">



                    <th className="pb-3">Created At</th>



                    <th className="pb-3">Purpose / Note</th>



                    <th className="pb-3 text-right">Amount</th>



                    <th className="pb-3 text-center">Status</th>



                    <th className="pb-3 pl-6">Actions</th>



                  </tr>



                </thead>



                 <tbody className="divide-y divide-slate-100">



                  {filteredLinks.map(link => {



                    const dateStr = new Date(link.createdAt).toLocaleDateString('en-IN', {



                      day: '2-digit', month: 'short', year: 'numeric',



                      hour: '2-digit', minute: '2-digit'



                    });



                    const isFlexible = link.amount === 'Flexible';



                    



                    const matchingVerifiedOrder = orders.find(o => {



                      if (o.status !== 'verified') return false;



                      if (o.external_ref) {



                        if (o.external_ref === link.id || o.external_ref.startsWith(link.id + ":")) {



                          return true;



                        }



                      }



                      const isFlex = link.amount === 'Flexible';



                      const orderAmt = parseFloat(o.amount);



                      const linkAmt = parseFloat(link.amount);



                      const amtMatches = isFlex || (Math.abs(orderAmt - linkAmt) < 2.0);



                      const purposeMatches = o.note === link.purpose;



                      return amtMatches && purposeMatches;



                    });







                    return (



                      <tr 



                        key={link.id} 



                        onClick={() => {



                          if (matchingVerifiedOrder) {



                            setSelectedHistoryOrder(matchingVerifiedOrder);



                          }



                        }}



                        className={`transition-colors ${matchingVerifiedOrder ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'}`}



                      >



                        <td className="py-3.5 font-semibold text-slate-500">{dateStr}</td>



                        <td className="py-3.5 font-bold text-slate-800">{link.purpose}</td>



                        <td className="py-3.5 font-black text-slate-900 text-right">



                          {isFlexible ? <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-650 px-2 py-0.5 rounded-lg font-mono">Flexible</span> : `₹${parseFloat(link.amount).toLocaleString('en-IN')}`}



                        </td>



                        <td className="py-3.5 text-center">



                          {matchingVerifiedOrder ? (



                            <button



                              onClick={(e) => {



                                e.stopPropagation();



                                setSelectedHistoryOrder(matchingVerifiedOrder);



                              }}



                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"



                            >



                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />



                              Paid



                            </button>



                          ) : (



                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-200 select-none">



                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />



                              Pending



                            </span>



                          )}



                        </td>



                        <td className="py-3.5 pl-6 flex items-center gap-2">



                          <button



                            onClick={(e) => {



                              e.stopPropagation();



                              setPayLinkGeneratedUrl(link.url);



                              // Copy it automatically for convenience



                              copyToClipboard(link.url);



                            }}



                            className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-500 hover:text-blue-600 transition-all flex items-center gap-1 font-bold text-[10px] cursor-pointer shadow-xs"



                            title="Load Link & Copy"



                          >



                            <Copy className="w-3.5 h-3.5" />



                            <span>Copy</span>



                          </button>



                          <a



                            href={link.url}



                            target="_blank"



                            rel="noreferrer"



                            onClick={(e) => e.stopPropagation()}



                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-550 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer shadow-xs"



                            title="Open Link"



                          >



                            <ExternalLink className="w-3.5 h-3.5" />



                          </a>



                          <button



                            onClick={(e) => {



                              e.stopPropagation();



                              handleDeleteLink(link.id);



                            }}



                            className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg text-slate-500 hover:text-red-650 transition-all flex items-center justify-center cursor-pointer shadow-xs"



                            title="Delete Link"



                          >



                            <Trash2 className="w-3.5 h-3.5" />



                          </button>



                        </td>



                      </tr>



                    );



                  })}



                </tbody>



              </table>



            </div>



          )}



        </div>







      </div>



    );



  };















  if (activeTab === 'admin' && isAdminUser) {
    return (
      <AdminConsole
        user={user}
        profile={profile}
        onBackToMerchant={() => setActiveTab('overview')}
      />
    );
  }

  const renderSetupGuidePanel = () => {
    const isUpiConnected = Boolean(profile?.upi_id && profile?.upi_id !== 'pending@upi');
    const isEmailForwardingActive = Boolean(profile?.setup_progress?.email_forwarding);
    const hasBankLinked = Boolean(profile?.bank_name || profile?.bank_account_number);
    const isWebhookActive = Boolean(profile?.webhook_url);

    return (
      <div className="space-y-6 animate-fadeIn font-sans">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#0c2340] via-[#102d54] to-[#1a3a60] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Zero-Fee Setup Blueprint</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                0 to 100 Production Setup Guide
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Connect your receiving UPI handle and bank account to collect instant customer payments with 0% gateway fees. Every payment settles straight to your account in T+0 real time.
              </p>
            </div>

          </div>
        </div>

        {/* 5-Phase Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phase 1: Direct Bank & UPI Settlement */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Phase 1: Receiving Node
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUpiConnected || hasBankLinked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {isUpiConnected || hasBankLinked ? 'Connected' : 'Action Required'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Direct UPI ID &amp; Bank Settlement Rail
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Specify your commercial or personal UPI handle (e.g. yourname@okaxis). Customer UPI payments credit directly to this account with zero intermediary hold.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsCategory('banking');
                setActiveTab('settings');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isUpiConnected ? 'Manage Receiving UPI / Bank' : 'Configure UPI Receiving Handle'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phase 2: Notification Listener */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Phase 2: Auto-Verification
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isEmailForwardingActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {isEmailForwardingActive ? 'Verified' : 'Setup Required'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Bank Email Auto-Forwarding Listener
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Set up an auto-forwarding rule in your Gmail so bank deposit notifications match orders in under 500ms without requiring expensive aggregators.
              </p>
            </div>

          </div>

          {/* Phase 3: Instant Payment Links */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Phase 3: No-Code Collection
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Ready
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-600" />
                Create One-Click UPI Payment Links
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate instant checkout links and QR codes to share on WhatsApp, email, or invoices. Customers scan with any UPI app to complete checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('payment-links')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Launch Payment Links Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phase 4: API & Webhooks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Phase 4: Developer Integration
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWebhookActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {isWebhookActive ? 'Webhook Configured' : 'Optional'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-violet-600" />
                REST APIs &amp; HMAC Webhooks
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Plug our REST API into your Node.js, Python, or Next.js app. Receive instant cryptographic webhook events as soon as UPI payments settle.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsCategory('api');
                setActiveTab('settings');
              }}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage API Keys &amp; Webhooks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Phase 5 Banner: Instant Payment Link */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Phase 5: Create Instant Payment Links</h4>
            </div>
            <p className="text-xs text-slate-600">
              Generate one-click payment URLs or QR codes to collect custom payments with instant direct-to-bank settlement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('payment-links')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Create Payment Link</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

















  return (



    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300 light-theme bg-[var(--bg-base)] text-[var(--text-primary)]">



      



                  {/* ═══════════════════════════════════════════════════════════
         DESKTOP SIDEBAR (Original Menu Items with Modern Design)
         ═══════════════════════════════════════════════════════════ */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200/80 z-50 hidden md:flex flex-col justify-between shadow-[1px_0_4px_0_rgba(0,0,0,0.02)] select-none">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Logo & Brand (Bigger & Aligned) */}
          <div className="px-6 pt-7 pb-4 flex items-center">
            <MyMobPayLogo className="w-44 lg:w-48 h-auto transition-transform hover:scale-[1.02]" textColor="#0c2340" />
          </div>

          {/* Navigation Links with Original Categories */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {/* Pinned: Subscription Console */}
            <button
              onClick={handleScrollToSubscription}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all border font-bold ${
                activeTab === 'subscription'
                  ? 'bg-blue-600/15 text-blue-700 border-blue-500/30 shadow-xs'
                  : profile?.subscription_status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 hover:bg-emerald-500/15'
                  : 'bg-amber-500/10 text-amber-700 border-amber-500/25 hover:bg-amber-500/15'
              }`}
            >
              <Crown className={`w-4 h-4 shrink-0 ${
                activeTab === 'subscription'
                  ? 'text-blue-600'
                  : profile?.subscription_status === 'active'
                  ? 'text-emerald-600'
                  : 'text-amber-500'
              }`} />
              <span className="flex-1 text-left font-black tracking-wide text-[11px] truncate">
                {profile?.subscription_status === 'active' ? 'Premium Active' : 'Premium Subscription'}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                profile?.subscription_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`} />
            </button>

            {/* Pinned: Admin Console (Super Admin) */}
            {isAdminUser && (
              <button
                onClick={() => setActiveTab('admin')}
                type="button"
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all border font-bold cursor-pointer mt-1 ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-md border-blue-500 ring-2 ring-blue-300'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs border-transparent'
                }`}
                title="Access SaaS Super Admin Console"
              >
                <Shield className="w-3.5 h-3.5 text-blue-200" />
                <span className="flex-1 text-left font-black tracking-wide text-[11px]">Admin Console</span>
                <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">Root</span>
              </button>
            )}

            <div className="h-px bg-slate-100 my-2" />

            {/* Category: General */}
            <p className="px-3 pt-1 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              General
            </p>

            <button
              onClick={() => setActiveTab('overview')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400'}`} />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('payment-links')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                activeTab === 'payment-links'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LinkIcon className={`w-4 h-4 shrink-0 ${activeTab === 'payment-links' ? 'text-blue-600' : 'text-slate-400'}`} />
              Payment Links
            </button>

            {/* Category: Reports */}
            <p className="px-3 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Reports
            </p>

            <button
              onClick={() => setActiveTab('transactions')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                activeTab === 'transactions'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`} />
              Transactions
            </button>

            {/* Category: Settings */}
            <p className="px-3 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Settings
            </p>

            <button
              onClick={() => {
                setSettingsCategory('banking');
                setActiveTab('settings');
              }}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`} />
              Settings
            </button>

            <button
              onClick={() => setActiveTab('setup-guide')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                activeTab === 'setup-guide'
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'setup-guide' ? 'text-blue-600' : 'text-slate-400'}`} />
              0 to 100 Setup Guide
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Live Rails</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">v2.1</span>
          </div>
          <button
            onClick={handleSignOut}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>







      {/* Main Content View */}



      <main className="md:pl-64 flex-1 flex flex-col min-w-0 min-h-screen bg-[#f8fafc] pt-14 sm:pt-16 md:pt-20">



        



                        {/* ═══════════════════════════════════════════════════════════
           HEADER (Unified Single Top Bar with Notifications Flyout)
           ═══════════════════════════════════════════════════════════ */}
        <header className="fixed top-0 left-0 md:left-64 right-0 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] h-14 sm:h-16 md:h-20">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
              type="button"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Brand Logo */}
            <div className="md:hidden flex items-center shrink-0">
              <MyMobPayLogo className="w-28 sm:w-32 h-auto" textColor="#0c2340" />
            </div>

            {/* Live Mode / Test Mode Switcher (Desktop) */}
            <div className="hidden sm:flex items-center bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/70 shadow-inner">
              <button
                onClick={() => {
                  if (profile?.sandbox_mode !== false) toggleSandboxMode();
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  profile?.sandbox_mode === false
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                type="button"
                title={profile?.subscription_status !== 'active' ? 'Live Mode locked - Activate trial or subscribe' : 'Live Mode'}
              >
                {profile?.subscription_status === 'active' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Live Mode</span>
                {profile?.subscription_status !== 'active' && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                    Locked
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  if (profile?.sandbox_mode === false) toggleSandboxMode();
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  profile?.sandbox_mode !== false
                    ? 'bg-white text-amber-600 shadow-sm border border-slate-200/60 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                type="button"
              >
                {profile?.sandbox_mode !== false && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                Test Mode
              </button>
            </div>

            {/* Live Interactive Search Bar */}
            <div className="relative hidden sm:flex items-center w-60 md:w-72 lg:w-96">
              <Search className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transactions, UTR, orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'transactions' && e.target.value.trim().length > 0) {
                    setActiveTab('transactions');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveTab('transactions');
                  }
                }}
                className="h-10 w-full pl-10 pr-12 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-xs"
              />
              <kbd
                onClick={() => setIsCommandPaletteOpen(true)}
                className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs cursor-pointer hover:bg-slate-50 hover:text-slate-700"
                title="Open Command Palette (⌘K)"
              >
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 shrink-0">
            {/* Mobile Mode Switcher Pill */}
            <button
              onClick={toggleSandboxMode}
              className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all shrink-0 ${
                profile?.sandbox_mode === false
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs'
                  : 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs'
              }`}
              type="button"
              title={profile?.sandbox_mode === false ? 'Live Mode Active' : 'Test Sandbox Mode Active'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${profile?.sandbox_mode === false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{profile?.sandbox_mode === false ? 'Live' : 'Test'}</span>
            </button>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Notification Bell with Real Dropdown Flyout */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`relative p-2.5 rounded-xl border transition-all ${
                    isNotificationOpen
                      ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200/80 bg-white'
                  }`}
                  title="Notifications & Activity"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">notifications</span>
                  {orders.filter(o => o.status === 'verified').length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Flyout Panel */}
                {isNotificationOpen && (
                  <>
                    {/* Mobile backdrop to dismiss on outside tap and block background touch scrolling */}
                    <div
                      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs sm:bg-transparent"
                      onClick={() => setIsNotificationOpen(false)}
                      onTouchMove={(e) => e.preventDefault()}
                    />
                    <div 
                      className="fixed left-2.5 right-2.5 top-[62px] sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-80 md:w-96 w-auto max-w-[calc(100vw-20px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[500px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Panel Header */}
                      <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0c2340]">Activity &amp; Notifications</span>
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                            {orders.slice(0, 8).length}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                          type="button"
                          aria-label="Close notifications"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Scrollable list with explicit iOS touch scrolling */}
                      <div 
                        className="flex-1 overflow-y-auto overscroll-contain divide-y divide-slate-100 touch-pan-y"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {orders.slice(0, 8).map((order) => {
                          const isPaid = order.status === 'verified' || order.status === 'paid';
                          return (
                            <div
                              key={order.id}
                              onClick={() => {
                                setActiveTab('transactions');
                                setIsNotificationOpen(false);
                              }}
                              className="p-3.5 hover:bg-slate-50 active:bg-blue-50/50 transition-colors cursor-pointer flex items-start gap-3"
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {isPaid ? `Payment Received: ₹${order.amount}` : `Pending Checkout: ₹${order.amount}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {order.customer_name || 'Customer'} • {order.utr ? `UTR: ${order.utr}` : (order.order_id || 'Awaiting verification')}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {orders.length === 0 && (
                          <div className="p-8 text-center text-xs text-slate-400">
                            No recent activity or notifications.
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="shrink-0 p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            setActiveTab('transactions');
                            setIsNotificationOpen(false);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer py-1"
                          type="button"
                        >
                          <span>View all transactions</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">Rails Operational</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Docs / Help Icon */}
              <button
                onClick={() => setActiveTab('setup-guide')}
                className="hidden sm:flex items-center justify-center p-2.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                title="Documentation & Setup Guide"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">help_outline</span>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-0.5 sm:mx-1"></div>

            {/* Profile Dropdown */}
            <div className="relative select-none">
              <div
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-2.5 sm:gap-3 pl-1 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0c2340] to-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-slate-900/10 border border-slate-700/30">
                  {merchantInitials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-900 font-bold leading-tight group-hover:text-blue-600 transition-colors truncate max-w-[120px]">
                      {profile?.business_name || profile?.owner_name || 'MyMobPay'}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {formatMerchantId(profile?.id)}
                  </span>
                </div>
              </div>

              {/* Dropdown Menu Modal */}
              {isProfileDropdownOpen && (
                <>
                  {/* Mobile backdrop */}
                  <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs sm:bg-transparent"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    onTouchMove={(e) => e.preventDefault()}
                  />
                  <div 
                    className="fixed right-2.5 top-[62px] sm:absolute sm:right-0 sm:top-full sm:mt-2.5 w-[calc(100vw-20px)] sm:w-64 max-w-xs bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {profile?.business_name || profile?.owner_name || 'Merchant'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {user?.email || 'merchant@mymob.tech'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsBusinessInfoModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile &amp; Business Info
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setSettingsCategory('settlement');
                        setActiveTab('settings');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      Bank Settlement Account
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setSettingsCategory('api');
                        setActiveTab('settings');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-slate-400" />
                      API Keys &amp; Webhooks
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab('security');
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-slate-400" />
                      Security &amp; Password
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          >
            <div 
              className="w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-5 sm:p-6 select-none overflow-hidden animate-slide-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4 min-h-0 flex-1">
                {/* Drawer Header: Logo + Close */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <MyMobPayLogo className="w-36 h-auto" textColor="#0c2340" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                    type="button"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Card Quick Access */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsBusinessInfoModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 rounded-2xl transition-all text-left cursor-pointer group shrink-0"
                  title="View Profile and Settings"
                  type="button"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: profile?.theme_color || '#3B82F6' }}
                  >
                    {merchantInitials || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {profile?.business_name || profile?.owner_name || 'My Business'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">{user?.email || 'merchant@mymob.tech'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Navigation Links */}
                <nav className="flex-1 px-1 py-1 space-y-1 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {/* Pinned: Subscription */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleScrollToSubscription();
                    }}
                    type="button"
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all border font-bold ${
                      activeTab === 'subscription'
                        ? 'bg-blue-600/15 text-blue-700 border-blue-500/30 shadow-xs'
                        : profile?.subscription_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 hover:bg-emerald-500/15'
                        : 'bg-amber-500/10 text-amber-700 border-amber-500/25 hover:bg-amber-500/15'
                    }`}
                  >
                    <Crown className={`w-4 h-4 shrink-0 ${
                      activeTab === 'subscription'
                        ? 'text-blue-600'
                        : profile?.subscription_status === 'active'
                        ? 'text-emerald-600'
                        : 'text-amber-500'
                    }`} />
                    <span className="flex-1 text-left font-black tracking-wide text-[11px] truncate">
                      {profile?.subscription_status === 'active' ? 'Premium Active' : 'Premium Subscription'}
                    </span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      profile?.subscription_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                    }`} />
                  </button>

                  {/* Pinned: Super Admin Console (if Super Admin) */}
                  {isAdminUser && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all border font-bold cursor-pointer mt-1 ${
                        activeTab === 'admin'
                          ? 'bg-blue-600 text-white shadow-md border-blue-500 ring-2 ring-blue-300'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs border-transparent'
                      }`}
                      title="Access SaaS Super Admin Console"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-200" />
                      <span className="flex-1 text-left font-black tracking-wide text-[11px]">Admin Console</span>
                      <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">Root</span>
                    </button>
                  )}

                  <div className="h-px bg-slate-100 my-2" />

                  {/* Category: General */}
                  <p className="px-3 pt-1 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    General
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('overview');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                      activeTab === 'overview'
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400'}`} />
                    Overview
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('payment-links');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                      activeTab === 'payment-links'
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className={`w-4 h-4 shrink-0 ${activeTab === 'payment-links' ? 'text-blue-600' : 'text-slate-400'}`} />
                    Payment Links
                  </button>

                  {/* Category: Reports */}
                  <p className="px-3 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Reports
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('transactions');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                      activeTab === 'transactions'
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`} />
                    Transactions
                  </button>

                  {/* Category: Settings */}
                  <p className="px-3 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Settings &amp; Guides
                  </p>
                  <button
                    onClick={() => {
                      setSettingsCategory('banking');
                      setActiveTab('settings');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                      activeTab === 'settings'
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`} />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('setup-guide');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left font-medium ${
                      activeTab === 'setup-guide'
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'setup-guide' ? 'text-blue-600' : 'text-slate-400'}`} />
                    0 to 100 Setup Guide
                  </button>
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3.5 pb-8 sm:pb-3.5 border-t border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>API Live Rails</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">v2.1</span>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100/60"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}



        <div className={`flex-1 p-3.5 sm:p-6 md:p-10 pb-8 md:pb-10 ${isAnyModalOrDrawerOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}>



          <div className={`${(activeTab === 'overview' || activeTab === 'payment-links' || activeTab === 'transactions' || activeTab === 'subscription' || activeTab === 'settings') ? 'max-w-[1520px]' : 'max-w-5xl'} mx-auto space-y-6`}>
            {/* Activation Success Celebration Banner */}
            {activationDismissed && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">Console Activated Successfully!</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        Active & Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">Welcome to your dashboard! All UPI payment collections, API keys, and webhooks are active and operational.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActivationDismissed(false)}
                  className="self-end sm:self-center px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  type="button"
                >
                  Dismiss
                </button>
              </div>
            )}



            



            {/* Header section with active tab label and sandbox toggle */}



            {activeTab !== 'overview' && activeTab !== 'payment-links' && activeTab !== 'transactions' && activeTab !== 'subscription' && activeTab !== 'settings' && (
            <div className="mb-6 pt-2 md:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">



              <div>



                <h2 className="text-3xl font-black text-slate-900 capitalize">{activeTab === 'setup-guide' ? '0 to 100 Setup Guide' : activeTab === 'api' ? 'API Credentials' : activeTab === 'subscription' ? 'Subscription Console' : activeTab === 'payment-links' ? 'Payment Links' : activeTab}</h2>



                <p className="text-sm text-slate-500 font-medium mt-1">



                  {activeTab === 'setup-guide' && 'Follow the 5-phase master blueprint to configure direct settlement, notification listeners, and webhooks for 100% automated payment receiving.'}

                  {activeTab === 'overview' && 'Real-time overview of business revenue and platform subscription details.'}



                  {activeTab === 'payment-links' && 'Generate one-click payment URLs or QR codes to collect custom payments from customers.'}



                  {activeTab === 'subscription' && 'Monitor subscription status, calculate renewals, and extend your active platform plan.'}



                  {activeTab === 'transactions' && 'Monitor and filter payment orders. Export history instantly.'}












                  {activeTab === 'settings' && 'Customize your business metadata, direct UPI deposit addresses, and brand colors.'}



                  {activeTab === 'api' && 'Secret credential tokens for creating programmatic checkouts.'}



                </p>



              </div>







            {activeTab === 'transactions' && (



              <div className="flex gap-2">



                <button 



                  onClick={handleRefreshOrders}



                  disabled={ordersLoading}



                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-55"



                  title="Refresh Transactions"



                >



                  <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />



                </button>



                <button 



                  onClick={downloadCSV}



                  disabled={filteredOrders.length === 0}



                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white-pure rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"



                >



                  <Download className="w-4 h-4" /> Export CSV Report



                </button>



              </div>



            )}



          </div>
        )}







            {/* Gmail Forwarding Banner */}



            {profile?.gmail_verification_code && (



              <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 shadow-sm relative pr-12">



                <button 



                  onClick={handleDismissVerification}



                  className="absolute top-4 right-4 p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"



                  title="Dismiss"



                >



                  <X className="w-5 h-5" />



                </button>



                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">



                  <div>



                    <strong className="text-blue-700 flex items-center gap-2 text-sm"><Mail className="w-4 h-4"/> Gmail Forwarding Verification</strong>



                    <p className="text-xs mt-1 text-blue-600 font-medium">Google sent a verification link to confirm your bank email forwarding rule.</p>



                  </div>



                  <a 



                    href={profile.gmail_verification_code} 



                    target="_blank" 



                    rel="noreferrer"



                    onClick={handleDismissVerification}



                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white-pure font-bold text-sm rounded-xl whitespace-nowrap transition-all shadow-sm shadow-blue-500/20"



                  >



                    Click Here to Verify



                  </a>



                </div>



              </div>



            )}







            {/* DB Error Banner */}



            {dbError && (



              <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-900 shadow-sm">



                <strong className="text-sm text-red-700">Database Connection Error:</strong>



                <p className="font-mono text-xs mt-1 text-red-600">{dbError}</p>



                <p className="text-[10px] mt-2 text-red-500 font-medium">Make sure the `merchants` and `orders` tables are configured inside Supabase SQL Editor.</p>



              </div>



            )}







            {/* ═══════════════════════════════════════════════════════════



               TAB: PAYMENT LINKS



               ═══════════════════════════════════════════════════════════ */}





            {activeTab === 'setup-guide' && renderSetupGuidePanel()}

            {activeTab === 'payment-links' && (
              <PaymentLinksRedesign
                profile={profile}
                orders={orders}
                payLinkHistory={payLinkHistory}
                setPayLinkHistory={setPayLinkHistory}
                setActiveTab={setActiveTab}
              />
            )}







            {/* ═══════════════════════════════════════════════════════════



               TAB: OVERVIEW



               ═══════════════════════════════════════════════════════════ */}



            {activeTab === 'overview' && (
              <DashboardOverviewRedesign
                profile={profile}
                stats={stats}
                orders={orders}
                analyticsTimeframe={analyticsTimeframe}
                setAnalyticsTimeframe={setAnalyticsTimeframe}
                setActiveTab={setActiveTab}
                user={user}
                setSettingsCategory={setSettingsCategory}
              />
            )}







            {/* ═══════════════════════════════════════════════════════════



               TAB: SUBSCRIPTION



               ═══════════════════════════════════════════════════════════ */}



            {activeTab === 'subscription' && (



              <div className="space-y-6">



                <SubscriptionRedesign
                profile={profile}
                historyOrders={historyOrders}
                orders={orders}
                onRefreshProfile={() => fetchProfile(user?.id)}
                onProfileUpdate={setProfile}
                setActiveTab={setActiveTab}
              />



              </div>



            )}















            {/* ═══════════════════════════════════════════════════════════
               TAB: TRANSACTIONS LOGS (User Design System)
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'transactions' && (
              <TransactionsRedesign
                profile={profile}
                orders={orders}
                onRefresh={fetchOrders}
                setActiveTab={setActiveTab}
                onProfileUpdate={setProfile}
              />
            )}







            {/* ═══════════════════════════════════════════════════════════



               TAB: API KEYS



               ═══════════════════════════════════════════════════════════ */}



            {activeTab === 'api' && (
              <SettingsRedesign
                profile={profile}
                user={user}
                onProfileUpdate={setProfile}
                setActiveTab={setActiveTab}
                initialCategory="api"
              />
            )}







            {/* ═══════════════════════════════════════════════════════════



               TAB: SETTINGS



               ═══════════════════════════════════════════════════════════ */}



            {activeTab === 'settings' && (
              <SettingsRedesign
                profile={profile}
                user={user}
                onProfileUpdate={setProfile}
                setActiveTab={setActiveTab}
                initialCategory={settingsCategory}
              />
            )}







          </div>



        </div>



      </main>







      {/* Premium Glassmorphic Centralized Settings Modal Overlay */}



      {isProfileModalOpen && (



        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">



          <div className="bg-white border border-slate-200/80 rounded-[32px] shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden max-h-[85vh] relative animate-scaleUp">



            



            {/* Close Button */}



            <button 



              onClick={() => setIsProfileModalOpen(false)}



              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 z-10"



              title="Close Settings"



            >



              <X className="w-4 h-4" />



            </button>







            {/* Left Panel: Sidebar Navigation */}



            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200/80 p-6 flex flex-col shrink-0 gap-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Merchant Settings</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wide">Control Dashboard & Profile</p>
              </div>

              <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setProfileModalTab('profile')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all border whitespace-nowrap ${
                    profileModalTab === 'profile' 
                      ? 'bg-[#EEF2FF] text-blue-750 border-slate-250 shadow-xs border-l-[3.5px] border-l-[#3b5bdb] font-black' 
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Owner Profile</span>
                </button>

                <button
                  onClick={() => setProfileModalTab('business')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all border whitespace-nowrap ${
                    profileModalTab === 'business' 
                      ? 'bg-[#FEF3C7] text-amber-900 border-amber-250 shadow-xs border-l-[3.5px] border-l-[#d97706] font-black' 
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Business Details</span>
                </button>

                <button
                  onClick={() => setProfileModalTab('payment')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all border whitespace-nowrap ${
                    profileModalTab === 'payment' 
                      ? 'bg-[#ECFDF5] text-emerald-950 border-emerald-250 shadow-xs border-l-[3.5px] border-l-[#059669] font-black' 
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Payment & Gateway</span>
                </button>

                <button
                  onClick={() => setProfileModalTab('security')}
                  className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all border whitespace-nowrap ${
                    profileModalTab === 'security' 
                      ? 'bg-[#EEF2FF] text-indigo-950 border-indigo-250 shadow-xs border-l-[3.5px] border-l-[#4f46e5] font-black' 
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Account Security</span>
                </button>
              </div>
            </div>







            {/* Right Panel: Content Pane */}



            <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">



              



              {/* Tab: OWNER PROFILE */}



              {profileModalTab === 'profile' && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-base font-black text-slate-900">Owner Profile Details</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Update your account identity and primary notification phone number.</p>
                  </div>

                  <div className="space-y-4 font-semibold text-xs text-slate-700">
                    <div>
                      <label className="block mb-1.5">Owner / Contact Name <span className="text-rose-500 font-black">*</span></label>
                      <input
                        type="text"
                        value={editOwnerName}
                        onChange={(e) => setEditOwnerName(e.target.value)}
                        className={`w-full border focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 ${!editOwnerName.trim() ? 'border-rose-350 bg-rose-50/20 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        placeholder="e.g. Kunal Chauhan"
                      />
                      {!editOwnerName.trim() && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1 animate-fadeIn flex items-center gap-1 select-none">
                          ⚠️ Owner / Contact Name is a required field.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5">Primary Phone Number <span className="text-rose-500 font-black">*</span></label>
                      <input
                        type="tel"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value)}
                        className={`w-full border focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 font-mono ${!editPhoneNumber.trim() ? 'border-rose-350 bg-rose-50/20 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        placeholder="e.g. +91 98765 43210"
                      />
                      {!editPhoneNumber.trim() && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1 animate-fadeIn flex items-center gap-1 select-none">
                          ⚠️ Primary Phone Number is a required field.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5 flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5" /> Login Account Email <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-250 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-1">🔒 LOCKED</span>
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-slate-100/60 border border-slate-200 text-slate-500 rounded-xl py-3 px-4 text-sm font-semibold cursor-not-allowed select-none font-mono"
                      />
                      <p className="text-[12.5px] text-[#6b7280] mt-2 font-bold leading-normal">Account emails cannot be updated directly for security purposes. Please contact administration support to initiate a transfer.</p>
                    </div>
                  </div>
                </div>
              )}







              {/* Tab: BUSINESS INFO */}



              {profileModalTab === 'business' && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-base font-black text-slate-900">Business Registry Information</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Manage your registered company details, merchant category classification, and tax credentials.</p>
                  </div>

                  <div className="space-y-4 font-semibold text-xs text-slate-700">
                    <div>
                      <label className="block mb-1.5">Registered Business Name <span className="text-rose-500 font-black">*</span></label>
                      <input
                        type="text"
                        value={editBusinessName}
                        onChange={(e) => setEditBusinessName(e.target.value)}
                        className={`w-full border focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 ${!editBusinessName.trim() ? 'border-rose-350 bg-rose-50/20 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        placeholder="e.g. Vyapar Gateway Corp"
                      />
                      {!editBusinessName.trim() && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1 animate-fadeIn flex items-center gap-1 select-none">
                          ⚠️ Registered Business Name is a required field.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5">Business Category <span className="text-rose-500 font-black">*</span></label>
                      <select
                        value={editBusinessCategory}
                        onChange={(e) => setEditBusinessCategory(e.target.value)}
                        className={`w-full border focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 cursor-pointer ${!editBusinessCategory ? 'border-rose-350 bg-rose-50/20 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                      >
                        <option value="" disabled>Select category...</option>
                        <option value="Retail">Retail Store / Kirana</option>
                        <option value="Services">Professional Services</option>
                        <option value="E-commerce">E-Commerce & SaaS</option>
                        <option value="Food & Beverage">Food & Beverage / Restaurant</option>
                        <option value="Healthcare">Healthcare & Pharmacy</option>
                        <option value="Education">Education & Tutoring</option>
                        <option value="Logistics">Logistics & Transport</option>
                        <option value="Others">Others</option>
                      </select>
                      {!editBusinessCategory && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1 animate-fadeIn flex items-center gap-1 select-none">
                          ⚠️ Business Category selection is required.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5">GSTIN / Tax ID <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">Optional</span></label>
                      <input
                        type="text"
                        value={editGstin}
                        onChange={(e) => setEditGstin(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 font-mono"
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        maxLength={15}
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5">Business Address</label>
                      <textarea
                        value={editBusinessAddress}
                        onChange={(e) => setEditBusinessAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 leading-normal resize-none min-h-[90px]"
                        placeholder="Complete business storefront or corporate address details..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}







              {/* Tab: PAYMENT & WEBHOOK */}



              {profileModalTab === 'payment' && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-base font-black text-slate-900">Deposit UPI & Outbound Webhook</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Configure where customer funds are settled and webhook callbacks are dispatched.</p>
                  </div>

                  <div className="space-y-4 font-semibold text-xs text-slate-700">
                    <div>
                      <label className="block mb-1.5">UPI ID (VPA) for Direct Settlements <span className="text-rose-500 font-black">*</span></label>
                      <input
                        type="text"
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value)}
                        className={`w-full border focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 font-mono ${(!editUpiId.trim() || editUpiId.trim() === 'pending@upi') ? 'border-rose-350 bg-rose-50/20 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        placeholder="e.g. yourshop@paytm"
                      />
                      {(!editUpiId.trim() || editUpiId.trim() === 'pending@upi') && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1 animate-fadeIn flex items-center gap-1 select-none">
                          ⚠️ A valid settlement UPI ID (VPA) is required.
                        </p>
                      )}
                      
                      <div className="p-3.5 bg-amber-50/70 border border-amber-250/80 rounded-xl text-[11px] text-amber-900 font-semibold mt-2.5 leading-relaxed flex items-start gap-2.5 select-none">
                        <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                        <span>
                          <strong>Important VPA Settlement Routing:</strong> Transactions are directly deposited into this bank VPA account in real-time. Double check to avoid settlement redirection issues.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1.5">Custom Webhook Integration URL <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">Optional</span></label>
                      <input
                        type="url"
                        value={editWebhookUrl}
                        onChange={(e) => setEditWebhookUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 font-mono"
                        placeholder="https://your-server.com/api/webhook"
                      />
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">We fire signed HMAC payload POST calls to this destination receiver when checkouts are successfully matched.</p>
                    </div>

                    <div>
                      <label className="block mb-1.5">Custom Brand Theme Color</label>
                      <div 
                        className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl transition-all hover:bg-slate-100 group relative w-full"
                        title="Click custom swatch color box to change brand theme color"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300 cursor-pointer flex-shrink-0">
                          <input 
                            type="color" 
                            value={editThemeColor} 
                            onChange={(e) => setEditThemeColor(e.target.value)}
                            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={editThemeColor} 
                            onChange={(e) => setEditThemeColor(e.target.value)}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm font-bold text-slate-900"
                            placeholder="#3B82F6"
                          />
                          <span className="block text-[9px] text-slate-400 font-bold uppercase select-none group-hover:text-slate-650 transition-colors">
                            Click swatch to pick color • Hex Code
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">This brand accent color is active across your scanning checkout UI.</p>
                    </div>

                    {/* Direct Bank Transfer (IMPS/NEFT) Section */}
                    <div className="pt-4 border-t border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span className="text-emerald-600 font-bold">🏛️</span> Direct Bank Transfer (IMPS / NEFT)
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded-md uppercase">0% MDR</span>
                          </label>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Enable buyers to pay via high-value bank transfers verified automatically via bank email.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editEnableBankTransfer} 
                            onChange={(e) => setEditEnableBankTransfer(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {editEnableBankTransfer && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                          <div>
                            <label className="block mb-1 text-[11px]">Bank Name</label>
                            <input
                              type="text"
                              value={editBankName}
                              onChange={(e) => setEditBankName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400"
                              placeholder="e.g. HDFC Bank, SBI, ICICI Bank"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[11px]">Beneficiary / Account Name</label>
                            <input
                              type="text"
                              value={editBankAccountName}
                              onChange={(e) => setEditBankAccountName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400"
                              placeholder="e.g. Acme Enterprises"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[11px]">Bank Account Number</label>
                            <input
                              type="text"
                              value={editBankAccountNumber}
                              onChange={(e) => setEditBankAccountNumber(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder-slate-400"
                              placeholder="e.g. 50100234567890"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[11px]">IFSC Code</label>
                            <input
                              type="text"
                              value={editBankIfsc}
                              onChange={(e) => setEditBankIfsc(e.target.value.toUpperCase())}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all py-2.5 px-3 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder-slate-400 uppercase"
                              placeholder="e.g. HDFC0001234"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}







              {/* Tab: ACCOUNT SECURITY */}



              {profileModalTab === 'security' && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-base font-black text-slate-900">Account Security</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Modify your secret login credentials or change your account password instantly.</p>
                  </div>

                  {/* Info Notice Box */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-2xl flex gap-3 text-blue-750 select-none">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold leading-normal text-blue-800">Direct Password Change Requirements</p>
                      <p className="text-[10px] text-blue-600/90 font-bold leading-normal mt-0.5">
                        You can safely reset your login credentials in real-time. To maintain Fintech-grade security compliance, your new password must be at least **8 characters** in length and contain at least **one uppercase letter, one number, and one special character** (e.g. @, #, $, etc.).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 font-semibold text-xs text-slate-700">
                    <div>
                      <label className="block mb-1.5">Current Password <span className="text-rose-500 font-black">*</span></label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-3 pl-4 pr-12 rounded-xl text-sm font-semibold text-slate-900 font-mono"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showCurrentPassword ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1.5">New Password <span className="text-rose-500 font-black">*</span></label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-3 pl-4 pr-12 rounded-xl text-sm font-semibold text-slate-900 font-mono"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showNewPassword ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator Bar */}
                      {newPassword && (() => {
                        const strength = (() => {
                          let score = 0;
                          if (newPassword.length >= 8) score++;
                          if (/[A-Z]/.test(newPassword)) score++;
                          if (/[0-9]/.test(newPassword)) score++;
                          if (/[^A-Za-z0-9]/.test(newPassword)) score++;
                          
                          if (score <= 1) return { percent: '25%', label: 'Weak (Requires 8+ chars, upper, number, symbol)', color: 'bg-rose-500' };
                          if (score === 2) return { percent: '50%', label: 'Medium (Add symbol/number for security)', color: 'bg-amber-500' };
                          if (score === 3) return { percent: '75%', label: 'Strong / Safe', color: 'bg-blue-500' };
                          return { percent: '100%', label: 'Fintech-grade Secure / Perfect!', color: 'bg-emerald-500' };
                        })();
                        return (
                          <div className="mt-2.5 space-y-1.5 animate-fadeIn select-none">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase">Password Strength:</span>
                              <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full ${strength.color} transition-all duration-500`}
                                style={{ width: strength.percent }}
                              />
                            </div>
                          </div>
                        ); 
                      })()}
                    </div>

                    <div>
                      <label className="block mb-1.5">Confirm New Password <span className="text-rose-500 font-black">*</span></label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all py-3 pl-4 pr-12 rounded-xl text-sm font-semibold text-slate-900 font-mono"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1.5 animate-fadeIn flex items-center gap-1 select-none">
                          ⚠️ New passwords do not match.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}







              {/* Modal Footer Controls */}



              {profileModalTab !== 'security' ? (



                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">



                  <div className="flex-1 min-w-0">



                    {profileSuccessMsg && (



                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">



                        <CheckCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{profileSuccessMsg}</span>



                      </span>



                    )}



                    {profileErrorMsg && (



                      <span className="text-xs font-bold text-red-500 flex items-center gap-1.5 animate-fadeIn">



                        <AlertCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{profileErrorMsg}</span>



                      </span>



                    )}



                  </div>



                  <div className="flex items-center gap-2 shrink-0">



                    <button



                      onClick={() => setIsProfileModalOpen(false)}



                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"



                    >



                      Cancel



                    </button>



                    <button



                      onClick={handleSaveProfileModal}



                      disabled={profileSaving}



                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white-pure rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/10"



                    >



                      {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}



                      <span>{profileSaving ? 'Saving...' : 'Save Details'}</span>



                    </button>



                  </div>



                </div>



              ) : (



                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">



                  <div className="flex-1 min-w-0">



                    {passwordResetSuccess && (



                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">



                        <CheckCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{passwordResetSuccess}</span>



                      </span>



                    )}



                    {passwordResetError && (



                      <span className="text-xs font-bold text-red-500 flex items-center gap-1.5 animate-fadeIn">



                        <AlertCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{passwordResetError}</span>



                      </span>



                    )}



                  </div>



                  <div className="flex items-center gap-2 shrink-0">



                    <button



                      onClick={() => setIsProfileModalOpen(false)}



                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"



                    >



                      Cancel



                    </button>



                    <button



                      onClick={handleChangePassword}



                      disabled={passwordResetLoading}



                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white-pure rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/10"



                    >



                      {passwordResetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}



                      <span>{passwordResetLoading ? 'Updating...' : 'Update Password'}</span>



                    </button>



                  </div>



                </div>



              )}







            </div>



          </div>



        </div>



      )}

      {/* Dedicated Profile & Business Info Panel */}
      <ProfileBusinessInfoModal
        isOpen={isBusinessInfoModalOpen}
        onClose={() => setIsBusinessInfoModalOpen(false)}
        profile={profile}
        user={user}
        onProfileUpdated={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
        onOpenSettings={() => {
          setSettingsCategory('general');
          setActiveTab('settings');
        }}
      />







      {/* Command Palette Working Search Panel Overlay */}



      {isCommandPaletteOpen && (



        <div 



          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"



          onClick={() => {



            setIsCommandPaletteOpen(false);



            setPaletteSearchQuery('');



          }}



        >



          <div 



            className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] animate-scaleUp"



            onClick={(e) => e.stopPropagation()}



          >



            {/* Input Bar */}



            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">



              <Search className="w-5 h-5 text-slate-400 shrink-0" />



              <input 



                type="text" 



                placeholder="Search transaction ID, customer, amount or command..." 



                value={paletteSearchQuery}



                onChange={(e) => setPaletteSearchQuery(e.target.value)}



                className="bg-transparent border-none text-sm font-semibold text-slate-800 outline-none w-full placeholder-slate-400"



                autoFocus



              />



              <button 



                onClick={() => {



                  setIsCommandPaletteOpen(false);



                  setPaletteSearchQuery('');



                }}



                className="px-2.5 py-1.5 bg-slate-200/85 hover:bg-slate-350 text-slate-500 rounded-lg text-[10px] font-black transition-all shrink-0 uppercase tracking-wider"



              >



                ESC



              </button>



            </div>







            {/* Results Container */}



            <div className="flex-1 overflow-y-auto p-4 space-y-4">



              



              {/* Category 1: Navigation Actions */}



              {matchedShortcuts.length > 0 && (



                <div className="space-y-1.5">



                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2.5">Dashboard Actions</p>



                  <div className="space-y-1">



                    {matchedShortcuts.map((shortcut, idx) => {



                      const IconComponent = shortcut.icon;



                      return (



                        <button



                          key={idx}



                          onClick={() => {



                            if (shortcut.tab) {



                              setActiveTab(shortcut.tab);



                            } else if (shortcut.action) {



                              if (shortcut.action === 'profile') {
                                setIsBusinessInfoModalOpen(true);
                              } else {
                                openProfileModal(shortcut.action);
                              }



                            }



                            setIsCommandPaletteOpen(false);



                            setPaletteSearchQuery('');



                          }}



                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/60 rounded-xl text-left transition-colors cursor-pointer group"



                        >



                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100/60 group-hover:text-blue-600 transition-colors shrink-0">



                            <IconComponent className="w-4 h-4" />



                          </div>



                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-800 transition-colors">{shortcut.name}</span>



                        </button>



                      );



                    })}



                  </div>



                </div>



              )}







              {/* Category 2: Transaction Records */}



              {matchedOrders.length > 0 && (



                <div className="space-y-1.5">



                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2.5">Matched Checkout Orders</p>



                  <div className="space-y-1">



                    {matchedOrders.map((order) => {



                      const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {



                        day: '2-digit',



                        month: 'short',



                        hour: '2-digit',



                        minute: '2-digit'



                      });



                      return (



                        <button



                          key={order.id}



                          onClick={() => {



                            navigator.clipboard.writeText(order.id);



                            alert(`Copied Order ID: ${order.id}`);



                            setIsCommandPaletteOpen(false);



                            setPaletteSearchQuery('');



                          }}



                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group"



                          title="Click to copy Order ID"



                        >



                          <div className="flex items-center gap-3 min-w-0">



                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">



                              <CreditCard className="w-4 h-4" />



                            </div>



                            <div className="min-w-0">



                              <p className="text-xs font-bold text-slate-800 truncate">₹{parseFloat(order.amount).toLocaleString('en-IN')}</p>



                              <p className="text-[9px] font-semibold text-slate-400 mt-0.5 truncate">{dateStr} · Ref: {order.id.slice(0, 8)}</p>



                            </div>



                          </div>







                          <div className="flex items-center gap-2 shrink-0">



                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${



                              order.status === 'verified'



                                ? 'bg-emerald-100 text-emerald-700'



                                : order.status === 'pending'



                                  ? 'bg-amber-100 text-amber-700'



                                  : 'bg-red-100 text-red-700'



                            }`}>



                              {order.status}



                            </span>



                            <span className="text-[8px] font-bold text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all font-mono">Copy Ref</span>



                          </div>



                        </button>



                      );



                    })}



                  </div>



                </div>



              )}







              {/* No matches */}



              {paletteSearchQuery.trim() && matchedShortcuts.length === 0 && matchedOrders.length === 0 && (



                <div className="py-8 text-center space-y-2">



                  <p className="text-xs font-bold text-slate-500">No matching search query found.</p>



                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Try searching for generic terms like &quot;Settings&quot;, &quot;Overview&quot;, or transaction reference numbers.</p>



                </div>



              )}



            </div>







            {/* Visual Instructions Footer */}



            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 select-none">



              <span>Press enter to select · Click to copy Ref</span>



              <span className="font-mono bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-500">ESC to close</span>



            </div>



          </div>



        </div>



      )}







      {/* Transaction Details Modal Overlay */}



      {selectedHistoryOrder && (



        <div 



          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn"



          onClick={() => setSelectedHistoryOrder(null)}



        >



          <div 



            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-scaleUp"



            onClick={(e) => e.stopPropagation()}



          >



            <div className="h-1.5 bg-emerald-500 w-full" />



            



            <div className="p-5 border-b border-slate-100 flex items-center justify-between">



              <div>



                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Payment Receipt</h3>



                <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Transaction Verified Successfully</p>



              </div>



              <button 



                onClick={() => setSelectedHistoryOrder(null)} 



                className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"



              >



                <X className="w-4 h-4" />



              </button>



            </div>



            



            <div className="px-5 py-3 divide-y divide-slate-100">



              <div className="flex justify-between items-center py-2.5">



                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Order ID</span>



                <span className="text-xs font-mono font-bold text-slate-800 tracking-wide select-all">{selectedHistoryOrder.id}</span>



              </div>



              



              <div className="flex justify-between items-center py-2.5">



                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Amount</span>



                <span className="text-xs font-black text-emerald-500 font-bold">₹{parseFloat(selectedHistoryOrder.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>



              </div>



              



              <div className="flex justify-between items-center py-2.5">



                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Method</span>



                <span className="text-xs font-bold text-slate-800">{selectedHistoryOrder.method || 'UPI'}</span>



              </div>



              



              <div className="flex justify-between items-center py-2.5">



                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Status</span>



                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">



                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Verified



                </span>



              </div>



              



              <div className="flex justify-between items-center py-2.5">



                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">UTR / Ref No.</span>



                <span className="text-xs font-mono font-bold text-slate-800 tracking-wide select-all">{selectedHistoryOrder.utr || 'Auto-verified'}</span>



              </div>



              



              {selectedHistoryOrder.note && (



                <div className="flex justify-between items-center py-2.5">



                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Purpose / Note</span>



                  <span className="text-xs font-bold text-slate-700 max-w-[60%] truncate" title={selectedHistoryOrder.note}>{selectedHistoryOrder.note}</span>



                </div>



              )}



              



              {selectedHistoryOrder.customer_name && (



                <div className="flex justify-between items-center py-2.5">



                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Customer</span>



                  <span className="text-xs font-bold text-slate-800">{selectedHistoryOrder.customer_name}</span>



                </div>



              )}



              



              {selectedHistoryOrder.customer_phone && (



                <div className="flex justify-between items-center py-2.5">



                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Phone</span>



                  <span className="text-xs font-bold font-mono text-slate-800">{selectedHistoryOrder.customer_phone}</span>



                </div>



              )}



              



              <div className="flex justify-between items-center py-2.5">



                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Created</span>



                <span className="text-xs font-bold text-slate-700">



                  {new Date(selectedHistoryOrder.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}



                </span>



              </div>



              



              {selectedHistoryOrder.verified_at && (



                <div className="flex justify-between items-center py-2.5">



                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Verified At</span>



                  <span className="text-xs font-bold text-slate-700">



                    {new Date(selectedHistoryOrder.verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}



                  </span>



                </div>



              )}



            </div>



            



            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">



              <button 



                onClick={() => {



                  navigator.clipboard.writeText(selectedHistoryOrder.id);



                  alert("Copied Order ID!");



                }}



                className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"



              >



                <Copy className="w-3.5 h-3.5" />



                <span>Copy ID</span>



              </button>



              <button 



                onClick={() => setSelectedHistoryOrder(null)} 



                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white-pure font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"



              >



                Close Receipt



              </button>



            </div>



          </div>



        </div>



      )}





      

    </div>



  );



}



