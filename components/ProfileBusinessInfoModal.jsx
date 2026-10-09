'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  Globe, 
  FileText, 
  MapPin, 
  ExternalLink, 
  X, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
      setBusinessCategory(profile.business_category || 'Digital Services & Software');
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

  if (!isOpen) return null;

  // Merchant ID formatting
  const rawId = profile?.id || user?.id || '';
  const shortMid = rawId ? `MID-${rawId.slice(0, 8).toUpperCase()}` : 'MID-MMP88492';
  const displayEmail = user?.email || profile?.email || 'merchant@mymob.tech';

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!businessName.trim()) {
      setErrorMessage('Business / Brand Name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const updatePayload = {
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        phone_number: phoneNumber.trim(),
        phone: phoneNumber.trim(),
        business_category: businessCategory,
        support_email: supportEmail.trim(),
        business_website: businessWebsite.trim(),
        gstin: gstin.trim(),
        business_address: businessAddress.trim(),
        upi_id: upiId.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_ifsc: bankIfsc.trim().toUpperCase(),
        bank_account_name: bankAccountName.trim(),
        bank_name: bankName.trim(),
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

  // Plan & Status Badge
  const isTrial = profile?.subscription_status === 'trial' || profile?.setup_progress?.plan_type === 'trial_3day';
  const isActive = profile?.subscription_status === 'active';
  const planBadgeText = isTrial ? '3-Day Free Trial' : isActive ? 'Active Pro' : 'Sandbox Active';

  // Created Date
  const joinedDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col w-full max-w-2xl overflow-hidden max-h-[90vh] relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Profile &amp; Business Info</h2>
              <p className="text-xs text-slate-500 font-medium">Merchant identity, credentials, and registered details</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Identity Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#0c2340] to-blue-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            {/* Business Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-md border border-white/20 shrink-0">
                {(businessName || 'M').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white truncate max-w-[240px]">
                    {businessName || 'My Business'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{planBadgeText}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate flex items-center gap-2 mt-0.5">
                  <span>{ownerName || 'Merchant Owner'}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{displayEmail}</span>
                </p>
              </div>
            </div>

            {/* Merchant ID Badge with 1-Click Copy */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center justify-between sm:justify-start gap-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Merchant ID
                </span>
                <span className="text-xs font-mono font-bold text-white tracking-wide">
                  {shortMid}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(shortMid, 'mid')}
                className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Copy Merchant ID"
              >
                {copiedKey === 'mid' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-200" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'business'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Business &amp; Contact Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settlement'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Settlement &amp; Routing</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Business details updated successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'business' ? (
            <div className="space-y-4">
              {/* Merchant ID Reference Field */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Account Merchant ID (MID)
                  </label>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                    {shortMid}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Use this ID to log in via Email OTP or verify with APIs.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(shortMid, 'mid-field')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedKey === 'mid-field' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedKey === 'mid-field' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(rawId, 'raw-id')}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Copy Full UUID"
                  >
                    {copiedKey === 'raw-id' ? 'Copied UUID' : 'Full UUID'}
                  </button>
                </div>
              </div>

              {/* Business Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Business / Brand Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <Building2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Tech Studio"
                      className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Owner / Contact Person
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <User className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Kunal Chauhan"
                      className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Login Email (Locked) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Primary Login Email</span>
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 px-3">
                    <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={displayEmail}
                      className="w-full bg-transparent py-2.5 text-xs text-slate-600 font-mono font-medium focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Primary Phone / WhatsApp
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Support Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Business Category / Industry
                  </label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Digital Services & Software">Digital Services &amp; SaaS</option>
                    <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                    <option value="Freelance & Consulting">Freelance &amp; Agency</option>
                    <option value="Gaming & Esports">Gaming &amp; Entertainment</option>
                    <option value="Education & Courses">Education &amp; EdTech</option>
                    <option value="Subscription Services">Subscription Services</option>
                    <option value="Other">Other Business Category</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Customer Support Email
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="support@company.com"
                      className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Website URL & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Business Website / Store URL
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <Globe className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="url"
                      value={businessWebsite}
                      onChange={(e) => setBusinessWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    GSTIN / Tax Registration (Optional)
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <FileText className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Settlement UPI Card */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Instant Direct Settlement Routing</span>
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    0% Commission
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Incoming payments from customer UPI apps (Google Pay, PhonePe, Paytm) settle directly into your linked VPA without holding periods.
                </p>
              </div>

              {/* Settlement UPI ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Settlement UPI ID (VPA)</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Primary Payout Destination</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                  <CreditCard className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="merchant@okhdfcbank or business@upi"
                    className="w-full bg-transparent py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono font-semibold"
                  />
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(upiId, 'upi-vpa')}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi-vpa' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Bank Account Details (Optional) */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bank Account Information (Optional)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Looking for API keys &amp; Webhooks? Open Merchant Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Details</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
