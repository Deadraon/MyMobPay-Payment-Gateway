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

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Lock any dashboard overflow-y-auto containers behind the modal
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    const lockedContainers = [];
    scrollContainers.forEach((el) => {
      if (!el.closest('#profile-business-modal-card')) {
        lockedContainers.push({ el, prev: el.style.overflow });
        el.style.overflow = 'hidden';
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      lockedContainers.forEach(({ el, prev }) => {
        el.style.overflow = prev;
      });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Merchant ID formatting - single unified display format
  const shortMid = formatMerchantId(profile?.id || user?.id);
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
  const planBadgeText = isTrial ? '3-Day Trial' : isActive ? 'Active Pro' : 'Sandbox Active';

  return (
    // Overlay with minor backdrop blur to cleanly outstand the popup
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-[3px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="profile-business-modal-card"
        className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col w-full max-w-xl overflow-hidden max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Clean typography, zero extra svg icons) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Profile &amp; Business Info</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage your merchant identity and settlement credentials</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant Summary Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                {merchantInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                    {businessName || 'My Business'}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{planBadgeText}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  <span>{ownerName || 'Merchant Owner'}</span>
                  <span className="mx-1 text-slate-300">•</span>
                  <span className="font-mono text-slate-500">{displayEmail}</span>
                </p>
              </div>
            </div>

            {/* Merchant ID Pill */}
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shrink-0 shadow-2xs">
              <div className="text-left">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">
                  MID
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 leading-none">
                  {shortMid}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(shortMid, 'mid-badge')}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                title="Copy Merchant ID"
              >
                {copiedKey === 'mid-badge' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Minimalist Typography Switcher (No extra icons) */}
        <div className="px-6 pt-2 pb-1">
          <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'business'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business &amp; Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'settlement'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settlement &amp; Bank
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain">
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
              {/* Business Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Business / Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech Studio"
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
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
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Login Email (Locked) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Primary Login Email
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Primary • Locked
                    </span>
                  </div>
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
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
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
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
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
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
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
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
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
                    className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 uppercase"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Direct UPI Settlement Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Direct Bank Settlement</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    0% Fees • Instant T+0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  Customer payments via UPI settle instantly into your linked account with zero gateway hold periods.
                </p>
              </div>

              {/* Settlement UPI ID */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Settlement UPI ID (VPA)
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">Primary Payout</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="merchant@okhdfcbank or business@upi"
                    className="w-full h-10 px-3 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(upiId, 'upi-vpa')}
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi-vpa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Bank Settlement Info */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-800">
                    Bank Account Information (Optional)
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
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Account Beneficiary Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium uppercase text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
            >
              API Keys &amp; Webhooks →
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
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
