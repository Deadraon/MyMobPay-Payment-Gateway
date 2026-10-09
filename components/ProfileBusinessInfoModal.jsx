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
  X, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Lock,
  Landmark,
  BadgeCheck,
  AlertCircle
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

  if (!isOpen) return null;

  // Merchant ID formatting
  const rawId = profile?.id || user?.id || '';
  const shortMid = rawId ? `MID-${rawId.slice(0, 8).toUpperCase()}` : 'MID-MMP88492';
  const displayEmail = user?.email || profile?.email || 'merchant@mymob.tech';
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

  // Status Badge
  const isTrial = profile?.subscription_status === 'trial' || profile?.setup_progress?.plan_type === 'trial_3day';
  const isActive = profile?.subscription_status === 'active';
  const planBadgeText = isTrial ? '3-Day Free Trial' : isActive ? 'Active Pro' : 'Sandbox Active';

  return (
    // Solid dark overlay without backdrop-blur for clean performance and no visual noise
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 animate-fadeIn">
      <div 
        className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl overflow-hidden max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eff3ff] border border-[#dae2fd] flex items-center justify-center text-[#0045de]">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0c2340] leading-tight">Profile &amp; Business Info</h2>
              <p className="text-[11px] text-slate-500 font-medium">Merchant identity credentials and company settlement details</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Merchant Summary Card */}
        <div className="px-6 pt-5 pb-2">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            {/* Merchant Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#0c2340] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-700/30 shrink-0">
                {merchantInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[220px]">
                    {businessName || 'My Business'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <BadgeCheck className="w-3 h-3 text-emerald-600" />
                    <span>{planBadgeText}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1.5">
                  <span>{ownerName || 'Merchant Owner'}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{displayEmail}</span>
                </p>
              </div>
            </div>

            {/* Merchant ID Box with 1-Click Copy */}
            <div className="bg-white border border-slate-200/90 rounded-lg px-3 py-2 flex items-center justify-between sm:justify-start gap-2.5 shadow-2xs w-full sm:w-auto shrink-0">
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Merchant ID
                </span>
                <span className="text-xs font-mono font-bold text-[#0c2340]">
                  {shortMid}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(shortMid, 'mid-badge')}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Copy Merchant ID"
              >
                {copiedKey === 'mid-badge' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sleek Segmented Switcher */}
        <div className="px-6 pt-3 pb-1">
          <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'business'
                  ? 'bg-white text-[#0045de] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Business &amp; Contact Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'settlement'
                  ? 'bg-white text-[#0045de] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Settlement &amp; Bank Details</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Business details updated successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'business' ? (
            <div className="space-y-3.5">
              {/* Merchant ID Reference Field */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Account Merchant ID (MID)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {shortMid}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({rawId ? rawId.slice(0, 18) + '...' : ''})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Use this ID to log in via Email OTP or identify your account with support.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(shortMid, 'mid-field')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'mid-field' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedKey === 'mid-field' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(rawId, 'raw-id')}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                    title="Copy Full UUID"
                  >
                    {copiedKey === 'raw-id' ? 'Copied UUID' : 'Full UUID'}
                  </button>
                </div>
              </div>

              {/* Business Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Business / Brand Name</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech Studio"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Owner / Contact Person
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Kunal Chauhan"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Login Email (Locked) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Primary Login Email</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  </label>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={displayEmail}
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-600 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Primary Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Category & Support Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Business Category / Industry
                  </label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    <option value="Digital Services & SaaS">Digital Services &amp; SaaS</option>
                    <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                    <option value="Freelance & Consulting">Freelance &amp; Agency</option>
                    <option value="Gaming & Esports">Gaming &amp; Entertainment</option>
                    <option value="Education & Courses">Education &amp; EdTech</option>
                    <option value="Subscription Services">Subscription Services</option>
                    <option value="Other">Other Business Category</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Customer Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@company.com"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Website URL & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Business Website / Store URL
                  </label>
                  <input
                    type="url"
                    value={businessWebsite}
                    onChange={(e) => setBusinessWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    GSTIN / Tax Registration (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 uppercase"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Direct UPI Settlement Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">Instant Peer-to-Peer UPI Routing</span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                      0% Commission
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                    Customer payments via Google Pay, PhonePe, Paytm, and BHIM settle directly into your linked UPI VPA without platform hold periods.
                  </p>
                </div>
              </div>

              {/* Settlement UPI ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Settlement UPI ID (VPA)</span>
                  <span className="text-[10px] text-[#0045de] font-bold">Primary Payout Destination</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="merchant@okhdfcbank or business@upi"
                    className="w-full h-10 px-3 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(upiId, 'upi-vpa')}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-[#0045de] transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi-vpa' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Bank Settlement Info */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-slate-500" />
                    <span>Bank Account Information (Optional)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">For Direct IMPS Settlements</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Account Beneficiary Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium uppercase text-slate-800 focus:outline-none focus:border-[#0045de] focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
              className="text-xs font-semibold text-[#0045de] hover:text-[#0037b3] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Looking for API keys &amp; Webhooks? Open Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-[#0045de] hover:bg-[#0037b3] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
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
