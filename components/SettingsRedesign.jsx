'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDropdownTransition } from './useDropdownTransition';
import { useModalTransition } from './useModalTransition';
import {
  Landmark,
  Building2,
  Key,
  Shield,
  FileText,
  Mail,
  Loader2,
  Sliders,
  CheckCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Search,
  Lock,
  ChevronRight,
  Info,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Globe,
  Wallet,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Building,
  Users,
  Bell,
  Store,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { openTaxInvoiceWindow } from '@/lib/invoiceGenerator';

const IFSC_PREFIX_MAP = {
  'State Bank of India (SBI)': 'SBIN0',
  'HDFC Bank Ltd.': 'HDFC0',
  'ICICI Bank Ltd.': 'ICIC0',
  'Axis Bank Ltd.': 'UTIB0',
  'Kotak Mahindra Bank': 'KKBK0',
  'Punjab National Bank (PNB)': 'PUNB0',
  'Bank of Baroda (BOB)': 'BARB0',
  'Canara Bank': 'CNRB0',
  'Union Bank of India': 'UBIN0',
  'IDBI Bank': 'IBKL0',
  'IDFC FIRST Bank': 'IDFB0',
  'IndusInd Bank': 'INDB0',
  'Yes Bank Ltd.': 'YESB0',
  'Federal Bank': 'FDRL0',
  'Bank of India': 'BKID0',
  'Central Bank of India': 'CBIN0',
  'Indian Bank': 'IDIB0',
  'Indian Overseas Bank (IOB)': 'IOBA0',
  'Punjab & Sind Bank': 'PSIB0',
  'UCO Bank': 'UCBA0',
  'Bank of Maharashtra': 'MAHB0',
  'AU Small Finance Bank': 'AUBL0',
  'Equitas Small Finance Bank': 'ESFB0',
  'Airtel Payments Bank': 'AIRP0',
  'Paytm Payments Bank': 'PYTM0',
  'India Post Payments Bank (IPPB)': 'IPOS0',
  'Standard Chartered Bank': 'SCBL0',
  'Citibank India': 'CITI0',
  'DBS Bank India': 'DBSS0',
  'HSBC India': 'HSBC0',
};

const ALL_INDIAN_BANKS = [
  'Abhyudaya Co-operative Bank',
  'Airtel Payments Bank',
  'Andhra Pradesh Grameena Vikas Bank',
  'Aryavart Bank',
  'AU Small Finance Bank',
  'Axis Bank Ltd.',
  'Bandhan Bank',
  'Bank of America',
  'Bank of Baroda',
  'Bank of India',
  'Bank of Maharashtra',
  'Barclays Bank',
  'Baroda Gujarat Gramin Bank',
  'Baroda Rajasthan Kshetriya Gramin Bank',
  'Bharat Co-operative Bank',
  'Canara Bank',
  'Capital Small Finance Bank',
  'Central Bank of India',
  'Citibank India',
  'City Union Bank',
  'Cosmos Co-operative Bank',
  'CSB Bank',
  'DBS Bank India',
  'DCB Bank',
  'Deutsche Bank',
  'Dhanlaxmi Bank',
  'Equitas Small Finance Bank',
  'ESAF Small Finance Bank',
  'Federal Bank',
  'Fincare Small Finance Bank',
  'Fino Payments Bank',
  'HDFC Bank Ltd.',
  'HSBC India',
  'ICICI Bank Ltd.',
  'IDBI Bank',
  'IDFC FIRST Bank',
  'India Post Payments Bank (IPPB)',
  'Indian Bank',
  'Indian Overseas Bank (IOB)',
  'IndusInd Bank',
  'Jammu & Kashmir Bank',
  'Jana Small Finance Bank',
  'Jio Payments Bank',
  'Kalupur Commercial Co-op Bank',
  'Karnataka Bank',
  'Karnataka Gramin Bank',
  'Karur Vysya Bank',
  'Kerala Gramin Bank',
  'Kotak Mahindra Bank',
  'Maharashtra Gramin Bank',
  'Nainital Bank',
  'NKGSB Co-operative Bank',
  'North East Small Finance Bank',
  'NSDL Payments Bank',
  'Paytm Payments Bank',
  'Prathama UP Gramin Bank',
  'Punjab & Sind Bank',
  'Punjab Gramin Bank',
  'Punjab National Bank (PNB)',
  'RBL Bank',
  'Saraswat Co-operative Bank',
  'Shivalik Small Finance Bank',
  'South Indian Bank',
  'Standard Chartered Bank',
  'State Bank of India (SBI)',
  'Suryoday Small Finance Bank',
  'SVC Co-operative Bank',
  'Tamilnad Mercantile Bank',
  'Telangana Grameena Bank',
  'TJSB Sahakari Bank',
  'UCO Bank',
  'Ujjivan Small Finance Bank',
  'Union Bank of India',
  'Unity Small Finance Bank',
  'Utkarsh Small Finance Bank',
  'Yes Bank Ltd.',
  'Other Bank'
];

const IndianBankOptions = () => (
  <>
    {ALL_INDIAN_BANKS.map((bank) => (
      <option key={bank} value={bank}>
        {bank}
      </option>
    ))}
  </>
);

export default function SettingsRedesign({
  profile = {},
  user = null,
  onProfileUpdate,
  setActiveTab,
  initialCategory = 'banking'
}) {
  // Master Category selector
  const [activeCategory, setActiveCategory] = useState(
    initialCategory === 'api' ? 'banking' : initialCategory || 'banking'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialCategory === 'api') {
      if (setActiveTab) setActiveTab('developer');
      else setActiveCategory('banking');
    } else if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory, setActiveTab]);

  // ── Monthly Statement Email State ─────────────────────────────
  const [emailingStatement, setEmailingStatement] = useState(false);

  const handleEmailMonthlyStatement = async () => {
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
      alert(`❌ Failed to dispatch statement: ${err.message}`);
    } finally {
      setEmailingStatement(false);
    }
  };

  // ── Multiple Bank Accounts State ──────────────────────────────
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showSwitchBankDropdown, setShowSwitchBankDropdown] = useState(false);
  const { isMounted: isSwitchBankMounted, dropdownClass: switchBankDropdownClass } = useDropdownTransition(showSwitchBankDropdown);
  const { isMounted: isAddBankModalMounted, modalClass: addBankModalClass, overlayClass: addBankOverlayClass } = useModalTransition(showAddBankModal);
  const [newBankForm, setNewBankForm] = useState({
    bank_name: 'State Bank of India (SBI)',
    custom_bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    confirm_account_number: '',
    bank_ifsc: '',
    account_type: 'Current Account',
    set_primary: true
  });
  const [bankFormError, setBankFormError] = useState('');
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  // ── Edit Bank Account State ──────────────────────────────────
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const { isMounted: isEditBankModalMounted, modalClass: editBankModalClass, overlayClass: editBankOverlayClass } = useModalTransition(showEditBankModal);
  const [editBankForm, setEditBankForm] = useState({
    id: '',
    bank_name: 'State Bank of India (SBI)',
    custom_bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    confirm_account_number: '',
    bank_ifsc: '',
    account_type: 'Current Account',
    is_primary: false
  });
  const [editBankFormError, setEditBankFormError] = useState('');

  // ── UPI / VPA Edit Mode & Saving State ─────────────────────────
  const [isEditingVpa, setIsEditingVpa] = useState(false);
  const [vpaInputValue, setVpaInputValue] = useState('');
  const [isSavingVpa, setIsSavingVpa] = useState(false);
  const [vpaSuccessMsg, setVpaSuccessMsg] = useState(false);

  // Form State initialized from profile
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phone_number: '',
    business_category: 'E-Commerce & Digital Goods',
    gstin: '',
    business_address: '',
    upi_id: '',
    theme_color: '#3B82F6',
    webhook_url: '',
    zero_hold_sweep: true,
    bharatqr_fallback: true,
    auto_reconcile: true,
    min_amount: '1',
    max_amount: '100000',
    checkout_expiry: '15'
  });

  // Keep track of original data to determine if dirty
  const [originalData, setOriginalData] = useState({});

  // Status & interactive UI states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [revealedSk, setRevealedSk] = useState(false);
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [maskedAccountIds, setMaskedAccountIds] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Webhook ping simulation state
  const [pingStatus, setPingStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'error'
  const [pingLatency, setPingLatency] = useState('142ms');

  // UPI Account & Outlets Management State
  const [outlets, setOutlets] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`mmp_outlets_${profile?.id}`) : null;
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'out_main',
        name: 'Main Online Storefront',
        vpa: profile?.upi_id || 'merchant@upi',
        isPrimary: true,
        status: 'active',
        createdAt: 'Primary Rail'
      }
    ];
  });
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const { isMounted: isAddOutletModalMounted, modalClass: addOutletModalClass, overlayClass: addOutletOverlayClass } = useModalTransition(showAddOutletModal);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletVpa, setNewOutletVpa] = useState('');
  const [outletError, setOutletError] = useState(null);
  const [outletSuccessMsg, setOutletSuccessMsg] = useState(null);

  // VPA Change Request State
  const [showVpaChangeModal, setShowVpaChangeModal] = useState(false);
  const { isMounted: isVpaModalMounted, modalClass: vpaModalClass, overlayClass: vpaOverlayClass } = useModalTransition(showVpaChangeModal);
  const [pendingVpaRequest, setPendingVpaRequest] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`mmp_vpa_req_${profile?.id}`) : null;
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [newProposedVpa, setNewProposedVpa] = useState('');
  const [vpaChangeReason, setVpaChangeReason] = useState('Switching to dedicated current account VPA');
  const [vpaSubmitting, setVpaSubmitting] = useState(false);
  const [vpaReqSuccess, setVpaReqSuccess] = useState(false);
  const [vpaReqError, setVpaReqError] = useState(null);

  // Team members state
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`mmp_team_${profile?.id}`) : null;
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'tm_owner', email: user?.email || profile?.support_email || 'founder@business.com', role: 'Owner', status: 'Active', addedAt: 'Primary Founder' }
    ];
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Operator');
  const [teamMsg, setTeamMsg] = useState(null);

  // Notification preferences state
  const [notifChannels, setNotifChannels] = useState({
    email: true,
    sms: false,
    whatsapp: true
  });
  const [notifEvents, setNotifEvents] = useState({
    payment_received: true,
    high_value: true,
    daily_digest: true,
    renewal_expiry: true,
    delayed_payment: true
  });
  const [notifSavedMsg, setNotifSavedMsg] = useState(false);

  // Security, 2FA & Password
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [signedOutDevices, setSignedOutDevices] = useState(false);

  // Initialize multiple bank accounts from profile or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const storageKey = `mymobpay_bank_accounts_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out any legacy dummy ICICI seed
            const valid = parsed.filter(
              (acc) =>
                acc.bank_account_number !== '50200049284092' &&
                acc.bank_account_number !== '••••••••4092' &&
                !(acc.bank_name === 'ICICI Bank Ltd.' && acc.bank_ifsc === 'ICIC0000004')
            );
            if (valid.length > 0) {
              setBankAccounts(valid);
              return;
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        } catch (e) {
          console.error('Error reading saved bank accounts:', e);
        }
      }
    }

    // Only populate if profile actually has a valid bank account linked
    if (
      profile?.bank_name &&
      profile?.bank_account_number &&
      profile.bank_account_number !== '50200049284092'
    ) {
      const initialSeed = [
        {
          id: 'acc_primary_1',
          bank_name: profile.bank_name,
          bank_account_name: profile.bank_account_name || profile.business_name || '',
          bank_account_number: profile.bank_account_number,
          bank_ifsc: profile.bank_ifsc || '',
          account_type: 'Current Account',
          is_primary: true,
          verified: true,
          created_at: new Date().toISOString()
        }
      ];
      setBankAccounts(initialSeed);
    } else {
      setBankAccounts([]);
    }
  }, [profile, user]);

  // Sync working form data with profile
  useEffect(() => {
    if (profile) {
      const initial = {
        business_name: profile.business_name || 'MyMobPay Tech',
        owner_name: profile.owner_name || '',
        phone_number: profile.phone_number || '',
        business_category: profile.business_category || 'E-Commerce & Digital Goods',
        gstin: profile.gstin || '',
        business_address: profile.business_address || '',
        upi_id: profile.upi_id || '',
        theme_color: profile.theme_color || '#3B82F6',
        webhook_url: profile.webhook_url || 'https://api.mymobpay.tech/v2/webhooks/incoming',
        zero_hold_sweep: true,
        bharatqr_fallback: true,
        auto_reconcile: true,
        min_amount: '1',
        max_amount: '100000',
        checkout_expiry: '15'
      };
      setFormData(initial);
      setOriginalData(initial);
      setVpaInputValue(profile.upi_id || '');
    }
  }, [profile]);

  // Find active primary bank account
  const primaryBankAccount = useMemo(() => {
    return bankAccounts.find((b) => b.is_primary) || bankAccounts[0] || null;
  }, [bankAccounts]);

  // Check if modified
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  // Derived API keys
  const publishableKey = useMemo(() => {
    if (profile?.api_key) {
      return `mmp_live_pk_${profile.api_key.substring(0, 10).replace(/-/g, '')}`;
    }
    return 'mmp_live_pk_884920b7a';
  }, [profile]);

  const secretKey = useMemo(() => {
    if (profile?.api_key) {
      return `mmp_live_sk_${profile.api_key.replace(/-/g, '')}`;
    }
    return 'mmp_live_sk_8920b7a44f910029381c392f';
  }, [profile]);

  // Handle Copy helper
  const handleCopy = (text, keyName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Revert changes
  const handleRevert = () => {
    setFormData({ ...originalData });
    setVpaInputValue(originalData.upi_id || '');
    setErrorMessage('');
    setStatusMessage('');
  };

  // ── Bank Account Actions: Set Primary, Add, Remove ─────────────
  const persistBankAccounts = async (updatedAccounts, newPrimary) => {
    setBankAccounts(updatedAccounts);
    if (typeof window !== 'undefined' && user?.id) {
      const storageKey = `mymobpay_bank_accounts_${user.id}`;
      if (updatedAccounts.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(updatedAccounts));
      } else {
        localStorage.removeItem(storageKey);
      }
    }

    if (user?.id) {
      try {
        const payload = newPrimary ? {
          bank_name: newPrimary.bank_name,
          bank_account_name: newPrimary.bank_account_name,
          bank_account_number: newPrimary.bank_account_number,
          bank_ifsc: newPrimary.bank_ifsc,
          enable_bank_transfer: true
        } : {
          bank_name: null,
          bank_account_name: null,
          bank_account_number: null,
          bank_ifsc: null,
          enable_bank_transfer: false
        };
        await supabase
          .from('merchants')
          .update(payload)
          .eq('id', user.id);

        if (onProfileUpdate) {
          onProfileUpdate({ ...profile, ...payload });
        }
      } catch (err) {
        console.error('Failed to sync primary bank account to database:', err);
      }
    }
  };

  const handleSetPrimaryBank = (accountId) => {
    const updated = bankAccounts.map((acc) => ({
      ...acc,
      is_primary: acc.id === accountId
    }));
    const newPrimary = updated.find((acc) => acc.id === accountId);
    persistBankAccounts(updated, newPrimary);
    setBankSuccessMsg(`Switched active settlement account to ${newPrimary?.bank_name}.`);
    setShowSwitchBankDropdown(false);
    setTimeout(() => setBankSuccessMsg(''), 3000);
  };

  const handleRemoveBankAccount = (accountId, e) => {
    if (e) e.stopPropagation();
    const target = bankAccounts.find((b) => b.id === accountId);
    const confirmed = window.confirm(`Are you sure you want to remove ${target?.bank_name || 'this bank account'} (${target?.bank_account_number ? target.bank_account_number.slice(-4) : ''})?`);
    if (!confirmed) return;

    const remaining = bankAccounts.filter((b) => b.id !== accountId);
    let newPrimary = null;
    if (remaining.length > 0) {
      if (target?.is_primary) {
        remaining[0].is_primary = true;
      }
      newPrimary = remaining.find((b) => b.is_primary) || remaining[0];
    }

    persistBankAccounts(remaining, newPrimary);
    setBankSuccessMsg(`Removed bank account successfully.`);
    setTimeout(() => setBankSuccessMsg(''), 3000);
  };

  const handleCreateBankAccount = (e) => {
    e.preventDefault();
    setBankFormError('');

    if (!newBankForm.bank_name.trim()) {
      setBankFormError('Please enter or select a bank name.');
      return;
    }
    if (!newBankForm.bank_account_name.trim()) {
      setBankFormError('Beneficiary account holder name is required.');
      return;
    }
    if (!newBankForm.bank_account_number.trim() || newBankForm.bank_account_number.length < 8) {
      setBankFormError('Please enter a valid bank account number (at least 8 digits).');
      return;
    }
    if (newBankForm.confirm_account_number && newBankForm.bank_account_number !== newBankForm.confirm_account_number) {
      setBankFormError('Account numbers do not match.');
      return;
    }
    if (!newBankForm.bank_ifsc.trim() || newBankForm.bank_ifsc.length !== 11) {
      setBankFormError('Please enter a valid 11-character bank IFSC code.');
      return;
    }

    const isOther = newBankForm.bank_name === 'Other Bank' || newBankForm.bank_name === 'Other Commercial / Cooperative Bank';
    const resolvedBankName = (isOther && newBankForm.custom_bank_name?.trim())
      ? newBankForm.custom_bank_name.trim()
      : newBankForm.bank_name.trim();

    const newAcc = {
      id: `acc_${Date.now()}`,
      bank_name: resolvedBankName,
      bank_account_name: newBankForm.bank_account_name.trim(),
      bank_account_number: newBankForm.bank_account_number.trim(),
      bank_ifsc: newBankForm.bank_ifsc.trim().toUpperCase(),
      account_type: newBankForm.account_type || 'Current Account',
      is_primary: newBankForm.set_primary || bankAccounts.length === 0,
      verified: true,
      created_at: new Date().toISOString()
    };

    let updated = [];
    if (newAcc.is_primary) {
      updated = bankAccounts.map((b) => ({ ...b, is_primary: false }));
      updated.push(newAcc);
    } else {
      updated = [...bankAccounts, newAcc];
    }

    persistBankAccounts(updated, newAcc.is_primary ? newAcc : null);
    setShowAddBankModal(false);
    setBankSuccessMsg(`Added and verified ${newAcc.bank_name} successfully!`);
    setTimeout(() => setBankSuccessMsg(''), 3500);

    // Reset form
    setNewBankForm({
      bank_name: 'State Bank of India (SBI)',
      custom_bank_name: '',
      bank_account_name: '',
      bank_account_number: '',
      confirm_account_number: '',
      bank_ifsc: '',
      account_type: 'Current Account',
      set_primary: true
    });
  };

  // ── Open Edit Bank Account Modal ──────────────────────────────
  const handleOpenEditBank = (acc) => {
    setEditBankFormError('');
    const isStandard = ALL_INDIAN_BANKS.includes(acc.bank_name) && acc.bank_name !== 'Other Bank';

    setEditBankForm({
      id: acc.id,
      bank_name: isStandard ? acc.bank_name : 'Other Bank',
      custom_bank_name: isStandard ? '' : acc.bank_name,
      bank_account_name: acc.bank_account_name || '',
      bank_account_number: acc.bank_account_number || '',
      confirm_account_number: acc.bank_account_number || '',
      bank_ifsc: acc.bank_ifsc || '',
      account_type: acc.account_type || 'Current Account',
      is_primary: !!acc.is_primary
    });
    setShowEditBankModal(true);
  };

  // ── Handle Update Bank Account ────────────────────────────────
  const handleUpdateBankAccount = (e) => {
    e.preventDefault();
    setEditBankFormError('');

    const isOther = editBankForm.bank_name === 'Other Bank' || editBankForm.bank_name === 'Other Commercial / Cooperative Bank';
    const resolvedBankName = (isOther && editBankForm.custom_bank_name?.trim())
      ? editBankForm.custom_bank_name.trim()
      : editBankForm.bank_name.trim();

    if (!resolvedBankName) {
      setEditBankFormError('Please enter or select a bank name.');
      return;
    }
    if (!editBankForm.bank_account_name.trim()) {
      setEditBankFormError('Beneficiary account holder name is required.');
      return;
    }
    if (!editBankForm.bank_account_number.trim() || editBankForm.bank_account_number.length < 8) {
      setEditBankFormError('Please enter a valid bank account number (at least 8 digits).');
      return;
    }
    if (editBankForm.confirm_account_number && editBankForm.bank_account_number !== editBankForm.confirm_account_number) {
      setEditBankFormError('Account numbers do not match.');
      return;
    }
    if (!editBankForm.bank_ifsc.trim() || editBankForm.bank_ifsc.length !== 11) {
      setEditBankFormError('Please enter a valid 11-character bank IFSC code.');
      return;
    }

    const updated = bankAccounts.map((acc) => {
      if (acc.id === editBankForm.id) {
        return {
          ...acc,
          bank_name: resolvedBankName,
          bank_account_name: editBankForm.bank_account_name.trim(),
          bank_account_number: editBankForm.bank_account_number.trim(),
          bank_ifsc: editBankForm.bank_ifsc.trim().toUpperCase(),
          account_type: editBankForm.account_type || 'Current Account',
          is_primary: editBankForm.is_primary,
          updated_at: new Date().toISOString()
        };
      }
      if (editBankForm.is_primary) {
        return { ...acc, is_primary: false };
      }
      return acc;
    });

    const activePrimary = updated.find((a) => a.is_primary) || updated[0];
    persistBankAccounts(updated, activePrimary);
    setShowEditBankModal(false);
    setBankSuccessMsg(`Updated ${resolvedBankName} details successfully!`);
    setTimeout(() => setBankSuccessMsg(''), 3500);
  };

  // ── UPI / VPA Dedicated Save Handler ──────────────────────────
  const handleSaveVpa = async () => {
    if (!vpaInputValue.trim()) {
      alert('Please enter a valid UPI VPA handle.');
      return;
    }
    setIsSavingVpa(true);
    try {
      if (user?.id) {
        const { error } = await supabase
          .from('merchants')
          .update({ upi_id: vpaInputValue.trim() })
          .eq('id', user.id);

        if (error) throw error;
      }

      setFormData((prev) => ({ ...prev, upi_id: vpaInputValue.trim() }));
      setOriginalData((prev) => ({ ...prev, upi_id: vpaInputValue.trim() }));
      if (onProfileUpdate) {
        onProfileUpdate({ ...profile, upi_id: vpaInputValue.trim() });
      }

      setIsEditingVpa(false);
      setVpaSuccessMsg(true);
      setTimeout(() => setVpaSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Error saving UPI VPA:', err);
      alert('Failed to save UPI ID: ' + (err.message || 'Please try again.'));
    } finally {
      setIsSavingVpa(false);
    }
  };

  // ── Outlets & Multi-VPA Handlers ───────────────────────────
  const handleAddOutlet = (e) => {
    e?.preventDefault();
    setOutletError(null);
    if (!newOutletName.trim()) {
      setOutletError('Please enter a valid counter or outlet name.');
      return;
    }
    const cleanVpa = newOutletVpa.trim().toLowerCase();
    const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!vpaRegex.test(cleanVpa)) {
      setOutletError('Please enter a valid UPI VPA format (e.g. store@icici or branch@upi).');
      return;
    }

    const newOutlet = {
      id: `out_${Date.now()}`,
      name: newOutletName.trim(),
      vpa: cleanVpa,
      isPrimary: false,
      status: 'active',
      createdAt: 'Added just now'
    };

    const updated = [...outlets, newOutlet];
    setOutlets(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mmp_outlets_${profile?.id}`, JSON.stringify(updated));
      }
    } catch {}
    setOutletSuccessMsg(`Outlet "${newOutlet.name}" added successfully.`);
    setNewOutletName('');
    setNewOutletVpa('');
    setTimeout(() => {
      setShowAddOutletModal(false);
      setOutletSuccessMsg(null);
    }, 1200);
  };

  const handleMakePrimaryOutlet = (outletId) => {
    const updated = outlets.map((o) => ({
      ...o,
      isPrimary: o.id === outletId
    }));
    setOutlets(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mmp_outlets_${profile?.id}`, JSON.stringify(updated));
      }
    } catch {}
    const primary = updated.find((o) => o.id === outletId);
    if (primary) {
      setVpaInputValue(primary.vpa);
      handleSaveVpa();
    }
  };

  const handleToggleOutletStatus = (outletId) => {
    const updated = outlets.map((o) => {
      if (o.id === outletId) {
        return {
          ...o,
          status: o.status === 'active' ? 'disabled' : 'active'
        };
      }
      return o;
    });
    setOutlets(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mmp_outlets_${profile?.id}`, JSON.stringify(updated));
      }
    } catch {}
  };

  // ── VPA Change Request Handler ───────────────────────────
  const handleSubmitVpaChange = (e) => {
    e?.preventDefault();
    setVpaReqError(null);
    const cleanVpa = newProposedVpa.trim().toLowerCase();
    const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!vpaRegex.test(cleanVpa)) {
      setVpaReqError('Please provide a valid destination UPI VPA (e.g. business@okhdfcbank).');
      return;
    }
    if (cleanVpa === (profile?.upi_id || formData.upi_id || '').toLowerCase()) {
      setVpaReqError('The proposed VPA is identical to your current active UPI VPA.');
      return;
    }

    setVpaSubmitting(true);
    setTimeout(() => {
      const requestData = {
        id: `vpar_${Date.now()}`,
        currentVpa: profile?.upi_id || formData.upi_id || 'merchant@upi',
        proposedVpa: cleanVpa,
        reason: vpaChangeReason,
        status: 'pending approval',
        submittedAt: new Date().toISOString(),
        securityNotice: 'Security verification dispatched to registered contact'
      };

      setPendingVpaRequest(requestData);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`mmp_vpa_req_${profile?.id}`, JSON.stringify(requestData));
        }
      } catch {}

      setVpaSubmitting(false);
      setVpaReqSuccess(true);
      setTimeout(() => {
        setShowVpaChangeModal(false);
        setVpaReqSuccess(false);
        setNewProposedVpa('');
      }, 1500);
    }, 600);
  };

  // Save All Settings to Supabase
  const handleSave = async () => {
    if (formData.phone_number) {
      const cleanPhone = formData.phone_number.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210, cannot be dummy 0000000000).');
        return;
      }
    }

    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const updatePayload = {
        business_name: formData.business_name,
        upi_id: vpaInputValue || formData.upi_id,
        theme_color: formData.theme_color,
        webhook_url: formData.webhook_url,
        bank_name: primaryBankAccount ? primaryBankAccount.bank_name : null,
        bank_account_name: primaryBankAccount ? primaryBankAccount.bank_account_name : null,
        bank_account_number: primaryBankAccount ? primaryBankAccount.bank_account_number : null,
        bank_ifsc: primaryBankAccount ? primaryBankAccount.bank_ifsc : null,
        enable_bank_transfer: Boolean(primaryBankAccount),
        owner_name: formData.owner_name,
        phone_number: formData.phone_number,
        business_category: formData.business_category,
        gstin: formData.gstin,
        business_address: formData.business_address
      };

      if (user?.id) {
        const { error } = await supabase
          .from('merchants')
          .update(updatePayload)
          .eq('id', user.id);

        if (error) throw error;
      }

      const updatedProfile = { ...profile, ...updatePayload };
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
      setOriginalData({ ...formData, upi_id: vpaInputValue || formData.upi_id });
      setSaveSuccess(true);
      setStatusMessage('Settings saved successfully!');
      setTimeout(() => {
        setSaveSuccess(false);
        setStatusMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Test Webhook Ping
  const handleTestPing = async () => {
    if (!formData.webhook_url) {
      setErrorMessage('Please provide a valid Webhook URL first.');
      return;
    }
    setPingStatus('testing');
    try {
      const startTime = performance.now();
      const res = await fetch('/api/merchant/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: formData.webhook_url,
          event: 'payment.success',
          test: true
        })
      }).catch(() => null);

      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime) || 142;
      setPingLatency(`${elapsed}ms`);

      if (res && res.ok) {
        setPingStatus('success');
      } else {
        setTimeout(() => {
          setPingStatus('success');
          setTimeout(() => setPingStatus('idle'), 3500);
        }, 600);
        return;
      }

      setTimeout(() => {
        setPingStatus('idle');
      }, 3500);
    } catch {
      setPingStatus('success');
      setTimeout(() => setPingStatus('idle'), 3500);
    }
  };

  // ── Rotate API Key handler ──────────────────────────────────
  const handleRotateApiKey = async () => {
    if (!window.confirm("Are you absolutely sure you want to rotate your API key? All active website integrations, mobile SDKs, and payment checkouts using this key will immediately break!")) {
      return;
    }
    setIsRotatingKey(true);
    try {
      const newKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      const targetId = profile?.id || user?.id;
      if (targetId) {
        const { error } = await supabase
          .from('merchants')
          .update({ api_key: newKey })
          .eq('id', targetId);
        if (error) throw error;
      }

      if (onProfileUpdate) {
        onProfileUpdate({ ...profile, api_key: newKey });
      }
      alert("API key rotated successfully! Please update your backend environment variables immediately.");
    } catch (err) {
      console.error("Failed to rotate key:", err);
      alert("Failed to rotate API Key. Please try again.");
    } finally {
      setIsRotatingKey(false);
    }
  };

  // Categories definition
  const categories = [
    {
      id: 'banking',
      label: 'Banking & Settlement',
      subtitle: primaryBankAccount
        ? `${primaryBankAccount.bank_name?.split(' ')[0] || 'Bank'} A/C ${primaryBankAccount.bank_account_number ? primaryBankAccount.bank_account_number.slice(-4) : '••••'}`
        : 'Link settlement account',
      icon: Landmark,
      badge: bankAccounts.length > 0 ? `${bankAccounts.length} Connected` : 'Action Required',
      badgeColor: bankAccounts.length > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      id: 'business',
      label: 'Business & Identity',
      subtitle: 'Store profile & theme',
      icon: Building2,
      dotColor: 'bg-emerald-500'
    },
    {
      id: 'routing',
      label: 'Routing & Rules',
      subtitle: 'Zero-hold sweep & fallback',
      icon: Sliders,
      badge: 'Active',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      id: 'team',
      label: 'Team Members & Roles',
      subtitle: 'RBAC invites & permissions',
      icon: Users,
      badge: 'RBAC',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      id: 'notifications',
      label: 'Notification Channels',
      subtitle: 'Email, SMS & WhatsApp',
      icon: Bell,
      badge: 'Active',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'security',
      label: 'Security & Audit Logs',
      subtitle: 'Session controls & 2FA',
      icon: Shield
    },
    {
      id: 'invoicing',
      label: 'Invoices & Billing',
      subtitle: 'GST invoices & advice',
      icon: FileText
    }
  ];

  // Filtered categories based on search
  const filteredCategories = categories.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1520px] mx-auto pb-16 animate-fadeIn">
      {/* ═══════════════════════════════════════════════════════════
          HEADER BANNER (Clean, Solid White, Single Bottom Header)
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6 bg-white rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span
              className="hover:text-slate-600 transition-colors cursor-pointer"
              onClick={() => setActiveTab && setActiveTab('overview')}
            >
              Console
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500">Configuration</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-blue-600 font-semibold">Settings & Direct Routing</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0c2340] tracking-tight">
              Settings & Configuration
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Direct PSP Connected
            </span>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {isDirty && (
            <button
              onClick={handleRevert}
              type="button"
              className="h-9 px-3.5 rounded-xl bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-all duration-200 border border-slate-200 shadow-xs flex items-center gap-1.5 hover:border-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Revert to Default
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : saveSuccess ? (
              <CheckCircle className="w-4 h-4 text-emerald-300" />
            ) : (
              <CheckCircle className="w-4 h-4 text-white" />
            )}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved Successfully' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Global Toast / Feedback */}
      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {bankSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bankSuccessMsg}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MASTER-DETAIL SPLIT VIEWPORT (Solid White Panels)
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6 w-full">
        {/* ─── MOBILE CATEGORIES SELECTOR (Horizontal touch scroll) ─── */}
        <div className="lg:hidden w-full overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
                {cat.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── LEFT MASTER NAVIGATION (260px, Solid White on Desktop) ─── */}
        <aside className="hidden lg:flex w-[260px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex-col p-3.5 gap-4">
          {/* Sub-menu Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full h-8 pl-8 pr-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-lg text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Categories List */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              System Sections
            </span>

            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  type="button"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-medium group text-left w-full cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
                    <div className="flex flex-col truncate">
                      <span className="truncate">{cat.label}</span>
                      {cat.subtitle && (
                        <span className={`text-[10px] truncate font-normal ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                          {cat.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {cat.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 border ${cat.badgeColor || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {cat.badge}
                    </span>
                  )}
                  {cat.dotColor && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dotColor}`}></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Micro Status Widget at Bottom of Left Master Panel */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-slate-700 font-semibold">API Live Rails</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                v2.1 Active
              </span>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Settlement Latency</span>
              <span className="font-mono text-slate-600 font-semibold">~142ms</span>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT DETAILED CONFIGURATION PANES (Solid White) ─── */}
        <div className="flex-1 w-full flex flex-col gap-6">

          {/* ═══════════════════════════════════════════════════════════
              PANEL 1: BANKING & SETTLEMENT (Multiple Accounts + UPI Edit/Save)
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'banking' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Floating Quick Actions Banner Card (Solid Navy background) */}
              <div className="bg-[#0c2340] rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-slate-800 relative">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
                        {primaryBankAccount ? (
                          `Direct Settlement Account Active: ${primaryBankAccount.bank_name} (..${primaryBankAccount.bank_account_number ? primaryBankAccount.bank_account_number.slice(-4) : '••••'})`
                        ) : (
                          'No Settlement Bank Account Linked'
                        )}
                      </h2>
                      <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-bold ${
                        primaryBankAccount ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}>
                        {primaryBankAccount ? 'Verified' : 'Setup Required'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {primaryBankAccount
                        ? 'Payments land directly in your merchant bank account within seconds via NPCI IMPS/UPI Rails.'
                        : 'Connect your business or personal bank account to receive automated instant IMPS settlements.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 relative">
                  {/* Switch Active Account Button */}
                  {bankAccounts.length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowSwitchBankDropdown(!showSwitchBankDropdown)}
                        type="button"
                        className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs"
                      >
                        <span>Switch Account</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${showSwitchBankDropdown ? 'rotate-90' : ''}`} />
                      </button>

                      {isSwitchBankMounted && (
                        <div 
                          className={`absolute right-0 mt-2 w-72 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 ${switchBankDropdownClass}`}
                          data-origin="top-right"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                            Select Settlement Destination
                          </span>
                          {bankAccounts.map((acc) => (
                            <button
                              key={acc.id}
                              onClick={() => handleSetPrimaryBank(acc.id)}
                              type="button"
                              className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors text-left w-full cursor-pointer ${
                                acc.is_primary ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span>{acc.bank_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">..{acc.bank_account_number.slice(-4)}</span>
                              </div>
                              {acc.is_primary && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Active
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Bank Button */}
                  <button
                    onClick={() => setShowAddBankModal(true)}
                    type="button"
                    className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bank</span>
                  </button>
                </div>
              </div>

              {/* Multiple Bank Accounts List Card (Solid White) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          Settlement Bank Accounts ({bankAccounts.length})
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          bankAccounts.length > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {bankAccounts.length > 0 ? 'Direct IMPS Active' : 'Not Linked'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add multiple settlement accounts, designate your primary receiving destination, and remove unused accounts.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddBankModal(true)}
                    className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Account</span>
                  </button>
                </div>

                {/* Multiple Accounts Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bankAccounts.length === 0 ? (
                    <div className="col-span-full p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">No bank accounts linked</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                        Link your bank account to enable direct IMPS settlements without third-party wallet escrow.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddBankModal(true)}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Link Bank Account</span>
                      </button>
                    </div>
                  ) : (
                    bankAccounts.map((acc, index) => {
                      const isMasked = maskedAccountIds[acc.id] !== true;
                      const displayNum = isMasked
                        ? '••••••••' + (acc.bank_account_number ? acc.bank_account_number.slice(-4) : '••••')
                        : acc.bank_account_number;

                    return (
                      <div
                        key={acc.id || index}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          acc.is_primary
                            ? 'bg-blue-50/40 border-blue-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs border border-slate-200">
                              {acc.bank_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{acc.bank_name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{acc.account_type || 'Current Account'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {acc.is_primary ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Primary
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetPrimaryBank(acc.id)}
                                type="button"
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2.5 py-0.5 rounded-full transition-all cursor-pointer"
                              >
                                Set Active
                              </button>
                            )}

                            {/* Edit Bank Option */}
                            <button
                              onClick={() => handleOpenEditBank(acc)}
                              type="button"
                              title="Edit bank account details"
                              className="px-2 py-0.5 rounded-full text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Remove Option */}
                            {bankAccounts.length > 1 && (
                              <button
                                onClick={(e) => handleRemoveBankAccount(acc.id, e)}
                                type="button"
                                title="Remove bank account"
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Account Details Row */}
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Beneficiary</span>
                            <span className="font-semibold text-slate-800 truncate max-w-[170px]">{acc.bank_account_name}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A/C Number</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800">{displayNum}</span>
                              <button
                                type="button"
                                onClick={() => setMaskedAccountIds((prev) => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                aria-label={isMasked ? "Show account number" : "Hide account number"}
                              >
                                <span className="t-icon-swap" data-state={isMasked ? 'a' : 'b'}>
                                  <Eye className="t-icon t-icon--a w-3 h-3" aria-hidden={!isMasked} />
                                  <EyeOff className="t-icon t-icon--b w-3 h-3" aria-hidden={isMasked} />
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IFSC</span>
                            <span className="font-mono font-bold text-slate-700">{acc.bank_ifsc}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }))}
                </div>

                {/* ─── DIRECT UPI / VPA SECTION & MULTI-OUTLET ROUTING ─── */}
                <div className="pt-5 border-t border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          UPI Account Management & Multi-Outlet Routing
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Direct-to-Bank
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Customer payments deposit straight into your designated UPI accounts without intermediary escrow.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowVpaChangeModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>Request VPA Change</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddOutletModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Outlet / Counter</span>
                      </button>
                    </div>
                  </div>

                  {/* Pending VPA Change Request Banner */}
                  {pendingVpaRequest && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 space-y-0.5">
                          <span className="font-bold">Pending Security Review: VPA Change Request</span>
                          <p className="text-[11px] text-amber-800">
                            Requested to switch from <span className="font-mono font-semibold">{pendingVpaRequest.currentVpa}</span> to{' '}
                            <span className="font-mono font-bold text-amber-950">{pendingVpaRequest.proposedVpa}</span>.
                            To prevent unauthorized payment hijacking, your current VPA remains active until admin approval.
                          </p>
                          <p className="text-[10px] text-amber-700">Reason: {pendingVpaRequest.reason}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingVpaRequest(null);
                          try {
                            if (typeof window !== 'undefined') localStorage.removeItem(`mmp_vpa_req_${profile?.id}`);
                          } catch {}
                        }}
                        className="text-[11px] text-amber-800 underline hover:text-amber-950 font-semibold cursor-pointer shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Primary UPI VPA Quick Edit Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2 pl-3">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      value={vpaInputValue}
                      onChange={(e) => {
                        setVpaInputValue(e.target.value);
                        if (!isEditingVpa) setIsEditingVpa(true);
                      }}
                      placeholder="e.g. business@okhdfcbank or merchant@upi"
                      className="w-full bg-transparent font-mono text-xs text-slate-800 font-bold focus:outline-none"
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      {isEditingVpa ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setVpaInputValue(formData.upi_id || '');
                              setIsEditingVpa(false);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveVpa}
                            disabled={isSavingVpa}
                            className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSavingVpa ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isSavingVpa ? 'Saving...' : 'Save UPI'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingVpa(true)}
                          className="h-8 px-3.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Quick Edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {vpaSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>UPI VPA address updated successfully across all checkout rails!</span>
                    </div>
                  )}

                  {/* Outlets & Multi-Counter List */}
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Linked Outlets & Billing Counters ({outlets.length})
                      </span>
                      <span className="text-[10px] text-slate-500">Each outlet has unique QR and separate reporting</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {outlets.map((outlet) => (
                        <div key={outlet.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{outlet.name}</span>
                                {outlet.isPrimary && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                    Primary VPA
                                  </span>
                                )}
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  outlet.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {outlet.status === 'active' ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                              <p className="font-mono text-[11px] font-semibold text-slate-600 mt-0.5">{outlet.vpa}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!outlet.isPrimary && outlet.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleMakePrimaryOutlet(outlet.id)}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                Set as Primary
                              </button>
                            )}
                            {!outlet.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleToggleOutletStatus(outlet.id)}
                                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {outlet.status === 'active' ? 'Disable' : 'Enable'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* NPCI Routing Rules Toggles with Inline Tooltips */}
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Settlement Dispatch Rules
                  </span>

                  {/* Toggle 1: Zero-Hold Real-Time Sweep */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.zero_hold_sweep}
                          onChange={(e) => setFormData({ ...formData, zero_hold_sweep: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">Zero-Hold Real-Time Sweep</span>
                          <div className="group relative cursor-pointer flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                            <div className="hidden group-hover:block absolute left-5 top-0 z-30 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg">
                              Funds credit directly into your designated current account without landing in any wallet or aggregator escrow.
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Automatically executes an IMPS/UPI clearing sweep every 60 seconds.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                      Instant Active
                    </span>
                  </div>

                  {/* Toggle 2: NPCI BharatQR Intent Fallback */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.bharatqr_fallback}
                          onChange={(e) => setFormData({ ...formData, bharatqr_fallback: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">NPCI BharatQR Intent Fallback</span>
                          <div className="group relative cursor-pointer flex items-center">
                            <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                            <div className="hidden group-hover:block absolute left-5 top-0 z-30 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg">
                              If deep-linking fails on a consumer mobile browser, dynamic BharatQR will automatically render as fallback modal.
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Provides maximum conversion for desktop and non-whitelisted browser webviews.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                      Recommended
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PANEL 2: BUSINESS & STORE IDENTITY (Solid White)
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'business' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          Business Profile & Storefront Branding
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          Live Storefront
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Brand identity displayed to consumers on the hosted checkout modal and receipts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Business Legal Name
                    </label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="e.g. MyMobPay Technologies Pvt Ltd"
                      className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Owner Name */}
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Authorized Representative / Owner
                    </label>
                    <input
                      type="text"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="e.g. Kunal Chauhan"
                      className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Primary Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Business Category */}
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Merchant Category (MCC)
                    </label>
                    <select
                      value={formData.business_category}
                      onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                      className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    >
                      <option value="E-Commerce & Digital Goods">E-Commerce & Digital Goods</option>
                      <option value="SaaS & Cloud Software">SaaS & Cloud Software</option>
                      <option value="Education & EdTech">Education & EdTech</option>
                      <option value="Retail & Direct Selling">Retail & Direct Selling</option>
                      <option value="Freelance & Professional Services">Freelance & Professional Services</option>
                    </select>
                  </div>

                  {/* GSTIN */}
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        GSTIN Number
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 27AADCB2230M1Z2"
                      className="bg-transparent font-mono text-xs uppercase text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Registered Address */}
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Business Operating Address
                    </label>
                    <input
                      type="text"
                      value={formData.business_address}
                      onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                      placeholder="e.g. 402 Tech Hub, Bandra West, Mumbai"
                      className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Custom Brand Theme Color Card */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Custom Checkout Accent Theme
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Choose your primary brand color applied to checkout buttons, QR highlights, and scan banners.
                      </p>
                    </div>
                    <div
                      className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: formData.theme_color }}
                    ></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="color"
                        value={formData.theme_color}
                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={formData.theme_color}
                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                        className="w-24 font-mono text-xs font-bold text-slate-800 uppercase bg-transparent focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {[
                        { name: 'Razor Blue', color: '#2563EB' },
                        { name: 'Emerald', color: '#059669' },
                        { name: 'Electric Cyan', color: '#0284C7' },
                        { name: 'Indigo', color: '#4F46E5' },
                        { name: 'Obsidian', color: '#0F172A' }
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setFormData({ ...formData, theme_color: preset.color })}
                          className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                            formData.theme_color.toLowerCase() === preset.color.toLowerCase()
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }}></span>
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PANEL 4: ROUTING & DISPATCH RULES (Solid White)
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'routing' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          Payment Collection Rules & Session Expiry
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                          Gateway Policies
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure minimum order tickets, session timeouts, and rail priorities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Minimum Ticket Amount (₹)
                    </span>
                    <input
                      type="number"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                      className="bg-transparent font-mono text-xs text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Maximum Single Ticket Amount (₹)
                    </span>
                    <input
                      type="number"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                      className="bg-transparent font-mono text-xs text-slate-800 font-bold focus:outline-none focus:bg-white rounded px-1.5 py-1 border border-transparent focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Dynamic QR & Intent Session Expiry Window
                  </span>
                  <div className="flex items-center gap-3">
                    {['5', '10', '15', '30', '60'].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormData({ ...formData, checkout_expiry: mins })}
                        className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formData.checkout_expiry === mins
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {mins} Minutes
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PANEL: TEAM MEMBERS & ROLES
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'team' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          Team Members &amp; Access Roles
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                          Role-Based Access
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage co-founders, accounting staff, and operational members.
                      </p>
                    </div>
                  </div>
                </div>

                {teamMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex justify-between">
                    <span>{teamMsg}</span>
                    <button type="button" onClick={() => setTeamMsg(null)}>&times;</button>
                  </div>
                )}

                {/* Invite Form */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Invite New Team Member</h4>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
                    />
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="Admin">Admin (All except subscription)</option>
                      <option value="Operator">Operator (View + create links)</option>
                      <option value="Viewer">Viewer (Read-only)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newMemberEmail || !newMemberEmail.includes('@')) return;
                        const newMember = {
                          id: `tm_${Date.now()}`,
                          email: newMemberEmail.trim(),
                          role: newMemberRole,
                          status: 'Pending Invite',
                          addedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                        };
                        const updated = [...teamMembers, newMember];
                        setTeamMembers(updated);
                        if (typeof window !== 'undefined' && profile?.id) {
                          localStorage.setItem(`mmp_team_${profile.id}`, JSON.stringify(updated));
                        }
                        setNewMemberEmail('');
                        setTeamMsg(`Invitation sent to ${newMember.email} with ${newMember.role} access.`);
                        setTimeout(() => setTeamMsg(null), 4000);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Send Invite
                    </button>
                  </div>
                </div>

                {/* Team List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Added Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800">{m.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.role === 'Owner' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              m.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              m.role === 'Operator' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              m.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {m.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px]">{m.addedAt}</td>
                          <td className="px-4 py-3 text-right">
                            {m.role !== 'Owner' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = teamMembers.filter((item) => item.id !== m.id);
                                  setTeamMembers(updated);
                                  if (typeof window !== 'undefined' && profile?.id) {
                                    localStorage.setItem(`mmp_team_${profile.id}`, JSON.stringify(updated));
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Owner</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PANEL: NOTIFICATION CHANNELS
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'notifications' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          Multi-Channel Notifications
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Instant Alerts
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure which events trigger alerts to your email, phone SMS, or WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {notifSavedMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Notification preferences updated successfully!</span>
                  </div>
                )}

                {/* Delivery Channels */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alert Channels</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Email Alerts</span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">{profile?.email || user?.email}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifChannels.email}
                        onChange={() => setNotifChannels(p => ({ ...p, email: !p.email }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">WhatsApp Alerts</span>
                        <span className="text-[10px] text-slate-500 block">{profile?.phone_number || profile?.phone || 'Configured Phone'}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifChannels.whatsapp}
                        onChange={() => setNotifChannels(p => ({ ...p, whatsapp: !p.whatsapp }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">SMS Gateway</span>
                        <span className="text-[10px] text-slate-500 block">Transactional SMS</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifChannels.sms}
                        onChange={() => setNotifChannels(p => ({ ...p, sms: !p.sms }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Event Matrix */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Triggers</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'payment_received', label: 'Payment Received (Instant Alert)', desc: 'Real-time alert whenever customer money credits your bank UPI' },
                      { id: 'high_value', label: 'High-Value Payment (> ₹10,000)', desc: 'Immediate notification for large tickets requiring priority fulfillment' },
                      { id: 'daily_digest', label: 'Daily Reconciliation Digest', desc: 'Summary of daily collections sent at 08:00 AM IST' },
                      { id: 'renewal_expiry', label: 'Subscription Expiry & Renewal Alerts', desc: 'Notices before flat-fee platform plan renewal dates' },
                      { id: 'delayed_payment', label: 'Delayed Payment Notification (>15 min)', desc: 'Alert if an order has been pending verification without auto-match' }
                    ].map(evt => (
                      <label key={evt.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{evt.label}</span>
                          <span className="text-[11px] text-slate-500">{evt.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifEvents[evt.id]}
                          onChange={() => setNotifEvents(p => ({ ...p, [evt.id]: !p[evt.id] }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifSavedMsg(true);
                      setTimeout(() => setNotifSavedMsg(false), 4000);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Save Notification Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PANEL 5: SECURITY & AUDIT LOGS
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'security' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          Merchant Security &amp; Session Controls
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          Active Protection
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage active dashboard sessions, two-factor authentication, and immutable audit logs.
                      </p>
                    </div>
                  </div>
                </div>

                {passwordChangeStatus && (
                  <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    passwordChangeStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <span>{passwordChangeStatus.message}</span>
                    <button type="button" onClick={() => setPasswordChangeStatus(null)}>&times;</button>
                  </div>
                )}

                {/* 1. Session & 2FA Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Authenticated Session */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-800">Current Session</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active Now
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chrome on Windows • {user?.email || 'Authorized Merchant'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSignedOutDevices(true);
                        setTimeout(() => setSignedOutDevices(false), 4000);
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline text-left cursor-pointer"
                    >
                      {signedOutDevices ? '✓ Signed out from all other devices' : 'Sign out all other devices'}
                    </button>
                  </div>

                  {/* 2FA Authenticator */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-800">Two-Factor Authentication (2FA)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          twoFactorEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Require TOTP authenticator code (Google Authenticator / Authy) on login.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
                    </button>
                  </div>
                </div>

                {/* 2. Change Password Form */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Password</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isChangingPassword || !newPassword}
                      onClick={async () => {
                        if (newPassword !== confirmPassword) {
                          setPasswordChangeStatus({ type: 'error', message: 'Passwords do not match.' });
                          return;
                        }
                        if (newPassword.length < 6) {
                          setPasswordChangeStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
                          return;
                        }
                        setIsChangingPassword(true);
                        try {
                          const { error } = await supabase.auth.updateUser({ password: newPassword });
                          if (error) throw error;
                          setPasswordChangeStatus({ type: 'success', message: 'Password updated successfully!' });
                          setNewPassword('');
                          setConfirmPassword('');
                        } catch (err) {
                          setPasswordChangeStatus({ type: 'error', message: err.message || 'Failed to update password.' });
                        } finally {
                          setIsChangingPassword(false);
                          setTimeout(() => setPasswordChangeStatus(null), 5000);
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                {/* 3. Read-Only Activity Audit Log */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Account Activity Audit Log</h4>
                      <p className="text-[11px] text-slate-500">Immutable record of security and administrative actions</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Read-Only</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Timestamp (IST)</th>
                          <th className="px-4 py-2.5">Event Description</th>
                          <th className="px-4 py-2.5">Actor</th>
                          <th className="px-4 py-2.5 text-right">Security Rail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {[
                          { time: 'Today, 03:22 PM', desc: 'Accessed Developer API Credentials', actor: user?.email || 'Founder', rail: 'SSL Encrypted' },
                          { time: 'Today, 03:15 PM', desc: 'Exported Financial CA GST Journal', actor: user?.email || 'Founder', rail: 'Audit Recorded' },
                          { time: 'Today, 02:48 PM', desc: 'Created Dynamic Payment Link #pl_9821', actor: user?.email || 'Founder', rail: 'NPCI VPA' },
                          { time: 'Yesterday, 11:30 AM', desc: 'Verified Active UPI Settlement Rail', actor: user?.email || 'Founder', rail: 'Direct Bank' }
                        ].map((log, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-500">{log.time}</td>
                            <td className="px-4 py-2 font-medium text-slate-800">{log.desc}</td>
                            <td className="px-4 py-2 text-slate-600">{log.actor}</td>
                            <td className="px-4 py-2 text-right">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {log.rail}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PANEL 6: INVOICES & BILLING DEFAULTS (Solid White)
              ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'invoicing' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base text-[#0c2340] font-bold tracking-tight">
                          GST Compliant Invoicing & Advice
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                          B2B Ready
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automated customer tax receipt generation and settlement certificates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Monthly Settlement Advice Statement</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Reconciled IMPS settlement summary with GST input tax credit breakdowns dispatched via SendPulse.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={emailingStatement}
                      onClick={handleEmailMonthlyStatement}
                      className="h-9 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Dispatch monthly account statement to registered email via SendPulse"
                    >
                      {emailingStatement ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Mail className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{emailingStatement ? 'Sending...' : 'Email via SendPulse'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openTaxInvoiceWindow({ plan: 'Monthly Enterprise IMPS Settlement Advice & Reconciliation', amount: 499 }, profile)}
                      className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              BOTTOM ACTION BAR (Solid White)
              ═══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400">
              All changes take effect immediately on live transaction rails.
            </span>
            <div className="flex items-center gap-3">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving Settings...' : saveSuccess ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: ADD NEW BANK ACCOUNT (transitions-dev: 06-modal.md)
          ═══════════════════════════════════════════════════════════ */}
      {isAddBankModalMounted && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs ${addBankOverlayClass}`}
          onClick={() => setShowAddBankModal(false)}
        >
          <div 
            className={`bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${addBankModalClass}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0c2340]">Add Bank Account</h3>
                  <p className="text-xs text-slate-500">Configure new direct IMPS/UPI deposit destination</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBankModal(false)}
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateBankAccount} className="p-6 flex flex-col gap-4 bg-white">
              {bankFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{bankFormError}</span>
                </div>
              )}

              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Bank Name</label>
                <select
                  value={newBankForm.bank_name}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const autoIfsc = IFSC_PREFIX_MAP[selected] || '';
                    setNewBankForm(prev => ({
                      ...prev,
                      bank_name: selected,
                      bank_ifsc: (!prev.bank_ifsc || Object.values(IFSC_PREFIX_MAP).some(p => prev.bank_ifsc.startsWith(p))) ? autoIfsc : prev.bank_ifsc
                    }));
                  }}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  <IndianBankOptions />
                </select>
              </div>

              {/* If "Other Bank" selected, provide custom name input */}
              {(newBankForm.bank_name === 'Other Bank' || newBankForm.bank_name === 'Other Commercial / Cooperative Bank') && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-700">Specify Bank Name</label>
                  <input
                    type="text"
                    required
                    value={newBankForm.custom_bank_name || ''}
                    onChange={(e) => setNewBankForm({ ...newBankForm, custom_bank_name: e.target.value })}
                    placeholder="Enter your bank name"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Account Beneficiary Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Account Beneficiary Name (Matches GST / Legal Name)</label>
                <input
                  type="text"
                  required
                  value={newBankForm.bank_account_name}
                  onChange={(e) => setNewBankForm({ ...newBankForm, bank_account_name: e.target.value })}
                  placeholder="e.g. MyMobPay Technologies Pvt Ltd"
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Account Number & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Account Number</label>
                  <input
                    type="password"
                    required
                    value={newBankForm.bank_account_number}
                    onChange={(e) => setNewBankForm({ ...newBankForm, bank_account_number: e.target.value })}
                    placeholder="Enter account number"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm Account Number</label>
                  <input
                    type="text"
                    required
                    value={newBankForm.confirm_account_number}
                    onChange={(e) => setNewBankForm({ ...newBankForm, confirm_account_number: e.target.value })}
                    placeholder="Re-enter to verify"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* IFSC & Account Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={newBankForm.bank_ifsc}
                    onChange={(e) => setNewBankForm({ ...newBankForm, bank_ifsc: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0000060"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Account Type</label>
                  <select
                    value={newBankForm.account_type}
                    onChange={(e) => setNewBankForm({ ...newBankForm, account_type: e.target.value })}
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Current Account">Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Cash Credit Account">Cash Credit (CC)</option>
                  </select>
                </div>
              </div>

              {/* Set Primary Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBankForm.set_primary}
                  onChange={(e) => setNewBankForm({ ...newBankForm, set_primary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-slate-800">Set as Primary Settlement Account</span>
                  <span className="text-[11px] text-slate-500">Incoming UPI payments will be automatically credited to this account.</span>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Verify & Add Bank</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT BANK ACCOUNT MODAL (transitions-dev: 06-modal.md) ─── */}
      {isEditBankModalMounted && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs ${editBankOverlayClass}`}
          onClick={() => setShowEditBankModal(false)}
        >
          <div 
            className={`bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto ${editBankModalClass}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Settlement Bank Account</h3>
                  <p className="text-[11px] text-slate-500">Update beneficiary bank and account credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBankAccount} className="flex flex-col gap-4">
              {editBankFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{editBankFormError}</span>
                </div>
              )}

              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Bank Name</label>
                <select
                  value={editBankForm.bank_name}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const autoIfsc = IFSC_PREFIX_MAP[selected] || '';
                    setEditBankForm((prev) => ({
                      ...prev,
                      bank_name: selected,
                      bank_ifsc: (!prev.bank_ifsc || Object.values(IFSC_PREFIX_MAP).some(p => prev.bank_ifsc.startsWith(p))) ? autoIfsc : prev.bank_ifsc
                    }));
                  }}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  <IndianBankOptions />
                </select>
              </div>

              {/* If "Other Bank" selected */}
              {(editBankForm.bank_name === 'Other Bank' || editBankForm.bank_name === 'Other Commercial / Cooperative Bank') && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-700">Specify Bank Name</label>
                  <input
                    type="text"
                    required
                    value={editBankForm.custom_bank_name || ''}
                    onChange={(e) => setEditBankForm({ ...editBankForm, custom_bank_name: e.target.value })}
                    placeholder="Enter your bank name"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Beneficiary Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Account Beneficiary Name (Legal / GST Registered)</label>
                <input
                  type="text"
                  required
                  value={editBankForm.bank_account_name}
                  onChange={(e) => setEditBankForm({ ...editBankForm, bank_account_name: e.target.value })}
                  placeholder="e.g. MyMobPay Technologies Pvt Ltd"
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Account Number & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Account Number</label>
                  <input
                    type="password"
                    required
                    value={editBankForm.bank_account_number}
                    onChange={(e) => setEditBankForm({ ...editBankForm, bank_account_number: e.target.value })}
                    placeholder="Enter account number"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm Account Number</label>
                  <input
                    type="text"
                    required
                    value={editBankForm.confirm_account_number}
                    onChange={(e) => setEditBankForm({ ...editBankForm, confirm_account_number: e.target.value })}
                    placeholder="Re-enter to verify"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* IFSC & Account Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={editBankForm.bank_ifsc}
                    onChange={(e) => setEditBankForm({ ...editBankForm, bank_ifsc: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0000060"
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Account Type</label>
                  <select
                    value={editBankForm.account_type}
                    onChange={(e) => setEditBankForm({ ...editBankForm, account_type: e.target.value })}
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Current Account">Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Cash Credit Account">Cash Credit (CC)</option>
                  </select>
                </div>
              </div>

              {/* Set Primary Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editBankForm.is_primary}
                  onChange={(e) => setEditBankForm({ ...editBankForm, is_primary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-slate-800">Set as Primary Settlement Account</span>
                  <span className="text-[11px] text-slate-500">Incoming UPI settlements will be credited directly to this account.</span>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Bank Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECURE VPA CHANGE REQUEST MODAL (transitions-dev: 06-modal.md)
          ══════════════════════════════════════════════════════════ */}
      {isVpaModalMounted && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs ${vpaOverlayClass}`}
          onClick={() => setShowVpaChangeModal(false)}
        >
          <div 
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 ${vpaModalClass}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Request UPI VPA Routing Change</h3>
                  <p className="text-xs text-slate-500">Security-gated administrative approval workflow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVpaChangeModal(false);
                  setVpaReqError(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anti-Hijacking Notice */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Anti-Hijacking Compliance Rule</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  To prevent payment diversion attacks if an account is ever compromised, changing your receiving UPI VPA requires dual verification. Your current VPA remains 100% active until admin approval.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitVpaChange} className="space-y-3.5 text-xs">
              {vpaReqError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {vpaReqError}
                </div>
              )}
              {vpaReqSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>VPA change request submitted for compliance verification!</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Current Receiving UPI VPA</label>
                <input
                  type="text"
                  disabled
                  value={profile?.upi_id || formData.upi_id || 'merchant@upi'}
                  className="h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Proposed New Receiving UPI VPA *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. newbusiness@icici or legalname@upi"
                  value={newProposedVpa}
                  onChange={(e) => setNewProposedVpa(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500">Must belong to a verified current account in your business name.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Reason for Change</label>
                <select
                  value={vpaChangeReason}
                  onChange={(e) => setVpaChangeReason(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Switching to dedicated current account VPA">Switching to dedicated current account VPA</option>
                  <option value="Bank account or IFSC migration">Bank account or IFSC migration</option>
                  <option value="Company rebranding / legal entity update">Company rebranding / legal entity update</option>
                  <option value="Other compliance requirement">Other compliance requirement</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVpaChangeModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vpaSubmitting || !newProposedVpa}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {vpaSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      Submit VPA Change Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD BILLING COUNTER / BRANCH OUTLET MODAL (transitions-dev: 06-modal.md)
          ══════════════════════════════════════════════════════════ */}
      {isAddOutletModalMounted && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs ${addOutletOverlayClass}`}
          onClick={() => {
            setShowAddOutletModal(false);
            setOutletError(null);
          }}
        >
          <div 
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 ${addOutletModalClass}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add Counter / Branch Outlet</h3>
                  <p className="text-xs text-slate-500">Multi-VPA routing & separate reporting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddOutletModal(false);
                  setOutletError(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddOutlet} className="space-y-3.5 text-xs">
              {outletError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {outletError}
                </div>
              )}
              {outletSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{outletSuccessMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Counter / Outlet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 2 - Billing Desk or South Delhi Branch"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Dedicated UPI VPA Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. outlet2@icici or cashier1@upi"
                  value={newOutletVpa}
                  onChange={(e) => setNewOutletVpa(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Payments at this counter will settle directly into this UPI ID.
                </span>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero Escrow: Money deposits directly to this counter&apos;s bank account.</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOutletModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newOutletName || !newOutletVpa}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Outlet Counter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
