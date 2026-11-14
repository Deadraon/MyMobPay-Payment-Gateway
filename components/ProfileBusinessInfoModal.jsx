'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMerchantId } from '@/lib/merchantId';
import { useModalTransition } from './useModalTransition';

export default function ProfileBusinessInfoModal({ 
  isOpen, 
  onClose, 
  profile, 
  user, 
  onProfileUpdated, 
  onOpenSettings 
}) {
  const [activeTab, setActiveTab] = useState('business'); // 'business' | 'settlement'
  const [copiedKey, setCopiedKey] = useState(null);
  const { isMounted, modalClass, overlayClass } = useModalTransition(isOpen);

  // Editable Form State
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [gstin, setGstin] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');

  // Status
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when modal opens or profile changes
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setOwnerName(profile.owner_name || '');
      setPhoneNumber(profile.phone_number || profile.phone || '');
      setBusinessCategory(profile.business_category || 'Digital Services & SaaS');
      setSupportEmail(profile.support_email || user?.email || '');
      setBusinessWebsite(profile.business_website || '');
      setGstin(profile.gstin || '');
      setBusinessAddress(profile.business_address || '');
      setUpiId(profile.upi_id || '');
      setBankAccountNumber(profile.bank_account_number || '');
      setBankIfsc(profile.bank_ifsc || '');
      setBankAccountName(profile.bank_account_name || '');
      setBankName(profile.bank_name || '');
    }
    setSaveSuccess(false);
    setErrorMessage('');
  }, [profile, user, isOpen]);

  // Handle Escape key while modal is open (background scroll locking managed safely by dashboard)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  // Merchant ID formatting - single unified display format
  const shortMid = formatMerchantId(profile?.id || user?.id);
  const displayEmail = user?.email || profile?.email || 'merchant@mymobpay.tech';
  const merchantInitials = (businessName || ownerName || 'M').slice(0, 2).toUpperCase();

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!businessName.trim()) {
      setErrorMessage('Business / Brand Name is required.');
      return;
    }

    const cleanPhone = (phoneNumber || '').trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (starting with 6-9, cannot be dummy 0000000000).');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const existingProgress = profile?.setup_progress || {};
      const updatePayload = {
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        phone_number: cleanPhone,
        business_category: businessCategory,
        gstin: gstin.trim(),
        business_address: businessAddress.trim(),
        upi_id: upiId.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_ifsc: bankIfsc.trim().toUpperCase(),
        bank_account_name: bankAccountName.trim(),
        bank_name: bankName.trim(),
        setup_progress: {
          ...(typeof existingProgress === 'object' && existingProgress !== null ? existingProgress : {}),
          website_url: businessWebsite.trim(),
          business_website: businessWebsite.trim(),
          support_email: supportEmail.trim(),
        },
      };

      const { data, error } = await supabase
        .from('merchants')
        .update(updatePayload)
        .eq('id', profile?.id || user?.id)
        .select()
        .single();

      if (error) throw error;

      if (onProfileUpdated && data) {
        onProfileUpdated(data);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMessage(err.message || 'Failed to update business details.');
    } finally {
      setSaving(false);
    }
  };

  // Status Badge
  const isActive = profile?.subscription_status === 'active';
  const planBadgeText = isActive ? 'Active Pro' : 'Sandbox Active';

  return (
    // Overlay with transitions-dev modal transition
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs ${overlayClass}`}
      onClick={onClose}
    >
      <div 
        id="profile-business-modal-card"
        className={`bg-[var(--theme-bg-elevated,#FFFFFF)] border border-[var(--theme-border-color,#DCE2F2)] rounded-2xl shadow-2xl flex flex-col w-full max-w-xl overflow-hidden max-h-[92vh] text-[var(--theme-text-primary,#090D18)] transition-colors duration-200 ${modalClass}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Clean typography, theme adaptive) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border-color,#DCE2F2)] bg-[var(--theme-bg-elevated,#FFFFFF)]">
          <div>
            <h2 className="text-base font-bold text-[var(--theme-text-primary,#090D18)] leading-tight">Profile &amp; Business Info</h2>
            <p className="text-xs text-[var(--theme-text-muted,#5E6782)] mt-0.5">Manage your merchant identity and settlement credentials</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--theme-text-muted,#5E6782)] hover:text-[var(--theme-text-primary,#090D18)] hover:bg-[var(--theme-bg-secondary,#EAEEFA)] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant Summary Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="p-3.5 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#090D18] dark:bg-[#0F2BFF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {merchantInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--theme-text-primary,#090D18)] truncate max-w-[200px]">
                    {businessName || 'My Business'}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{planBadgeText}</span>
                  </span>
                </div>
                <p className="text-[11px] text-[var(--theme-text-muted,#5E6782)] truncate mt-0.5">
                  <span>{ownerName || 'Merchant Owner'}</span>
                  <span className="mx-1 opacity-50">•</span>
                  <span className="font-mono text-[var(--theme-text-muted,#5E6782)]">{displayEmail}</span>
                </p>
              </div>
            </div>

            {/* Merchant ID Pill */}
            <div className="bg-[var(--theme-bg-elevated,#FFFFFF)] border border-[var(--theme-border-color,#DCE2F2)] rounded-lg px-2.5 py-1.5 flex items-center gap-2 shrink-0 shadow-2xs">
              <div className="text-left">
                <span className="text-[9px] font-semibold text-[var(--theme-text-muted,#5E6782)] block leading-none mb-0.5">
                  MID
                </span>
                <span className="text-xs font-mono font-bold text-[var(--theme-text-primary,#090D18)] leading-none">
                  {shortMid}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(shortMid, 'mid-badge')}
                className="p-1 rounded-md hover:bg-[var(--theme-bg-secondary,#EAEEFA)] text-[var(--theme-text-muted,#5E6782)] transition-colors cursor-pointer"
                title="Copy Merchant ID"
              >
                <span className="t-icon-swap" data-state={copiedKey === 'mid-badge' ? 'b' : 'a'}>
                  <Copy className="t-icon t-icon--a w-3.5 h-3.5 text-[var(--theme-text-muted,#5E6782)]" aria-hidden={copiedKey === 'mid-badge'} />
                  <Check className="t-icon t-icon--b w-3.5 h-3.5 text-emerald-500" aria-hidden={copiedKey !== 'mid-badge'} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Minimalist Typography Switcher (Theme-Adaptive) */}
        <div className="px-6 pt-2 pb-1">
          <div className="p-1 bg-[var(--theme-bg-secondary,#EAEEFA)] rounded-xl grid grid-cols-2 gap-1 border border-[var(--theme-border-color,#DCE2F2)]">
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'business'
                  ? 'bg-[var(--theme-bg-elevated,#FFFFFF)] text-[#0F2BFF] dark:text-[#60A5FA] shadow-xs'
                  : 'text-[var(--theme-text-muted,#5E6782)] hover:text-[var(--theme-text-primary,#090D18)]'
              }`}
            >
              Business &amp; Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'settlement'
                  ? 'bg-[var(--theme-bg-elevated,#FFFFFF)] text-[#0F2BFF] dark:text-[#60A5FA] shadow-xs'
                  : 'text-[var(--theme-text-muted,#5E6782)] hover:text-[var(--theme-text-primary,#090D18)]'
              }`}
            >
              Settlement &amp; Bank
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Business details updated successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'business' ? (
            <div className="space-y-3.5">
              {/* Business Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Business / Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech Studio"
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Owner / Contact Person
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Kunal Chauhan"
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                </div>
              </div>

              {/* Login Email (Locked) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                      Primary Login Email
                    </label>
                    <span className="text-[10px] text-[var(--theme-text-muted,#5E6782)] font-medium">
                      Primary • Locked
                    </span>
                  </div>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={displayEmail}
                    className="h-10 px-3 bg-[var(--theme-bg-secondary,#EAEEFA)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-mono font-medium text-[var(--theme-text-muted,#5E6782)] focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Primary Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                </div>
              </div>

              {/* Category & Support Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Business Category / Industry
                  </label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors cursor-pointer"
                  >
                    <option value="Digital Services & SaaS" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">Digital Services &amp; SaaS</option>
                    <option value="E-Commerce & Retail" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">E-Commerce &amp; Retail</option>
                    <option value="Freelance & Consulting" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">Freelance &amp; Agency</option>
                    <option value="Gaming & Esports" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">Gaming &amp; Entertainment</option>
                    <option value="Education & Courses" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">Education &amp; EdTech</option>
                    <option value="Subscription Services" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">Subscription Services</option>
                    <option value="Other" className="bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100">Other Business Category</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Customer Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@company.com"
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                </div>
              </div>

              {/* Website URL & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Business Website / Store URL
                  </label>
                  <input
                    type="url"
                    value={businessWebsite}
                    onChange={(e) => setBusinessWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    GSTIN / Tax Registration (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-mono font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Direct UPI Settlement Notice */}
              <div className="p-3.5 rounded-xl bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--theme-text-primary,#090D18)]">Direct Bank Settlement</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    0% Fees • Instant T+0
                  </span>
                </div>
                <p className="text-[11px] text-[var(--theme-text-muted,#5E6782)] leading-relaxed mt-1">
                  Customer payments via UPI settle instantly into your linked account with zero gateway hold periods.
                </p>
              </div>

              {/* Settlement UPI ID */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)]">
                    Settlement UPI ID (VPA)
                  </label>
                  <span className="text-[10px] text-[#0F2BFF] dark:text-[#60A5FA] font-semibold">Primary Payout</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="merchant@okhdfcbank or business@upi"
                    className="w-full h-10 px-3 pr-10 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                  />
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(upiId, 'upi-vpa')}
                      className="absolute right-2.5 top-2.5 p-1 text-[var(--theme-text-muted,#5E6782)] hover:text-[#0F2BFF] dark:hover:text-[#60A5FA] transition-colors cursor-pointer flex items-center justify-center"
                      title="Copy UPI ID"
                      aria-label="Copy UPI ID"
                    >
                      <span className="t-icon-swap" data-state={copiedKey === 'upi-vpa' ? 'b' : 'a'}>
                        <span className="t-icon" data-icon="a" aria-hidden={copiedKey === 'upi-vpa'}>
                          <Copy className="w-3.5 h-3.5" />
                        </span>
                        <span className="t-icon" data-icon="b" aria-hidden={copiedKey !== 'upi-vpa'}>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Bank Settlement Info */}
              <div className="pt-2 border-t border-[var(--theme-border-color,#DCE2F2)]">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-[var(--theme-text-primary,#090D18)]">
                    Bank Account Information (Optional)
                  </h4>
                  <span className="text-[10px] text-[var(--theme-text-muted,#5E6782)]">For Direct IMPS Settlements</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--theme-text-secondary,#2A3147)]">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--theme-text-secondary,#2A3147)]">Account Beneficiary Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--theme-text-secondary,#2A3147)]">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-mono font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--theme-text-secondary,#2A3147)]">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="h-10 px-3 bg-[var(--theme-bg-well,#F7F9FE)] border border-[var(--theme-border-color,#DCE2F2)] rounded-xl text-xs font-mono font-medium text-[var(--theme-text-primary,#090D18)] focus:outline-none focus:border-[#0F2BFF] focus:ring-2 focus:ring-[#0F2BFF]/10 transition-colors placeholder:text-[var(--theme-text-muted,#5E6782)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-[var(--theme-border-color,#DCE2F2)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
              className="text-xs font-bold text-[#0F2BFF] dark:text-[#60A5FA] hover:underline cursor-pointer transition-colors"
            >
              API Keys &amp; Webhooks →
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border border-[var(--theme-border-color,#DCE2F2)] text-xs font-semibold text-[var(--theme-text-secondary,#2A3147)] hover:bg-[var(--theme-bg-secondary,#EAEEFA)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
