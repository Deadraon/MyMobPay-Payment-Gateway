'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Gift, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Copy, 
  Plus, 
  Sparkles, 
  Calendar, 
  Check, 
  Store,
  ChevronDown
} from 'lucide-react';

export default function SubscriptionsTab({
  merchants = [],
  giftCodes = [],
  orders = [],
  onExtendSubscription,
  onCreateGiftCode,
  onDeleteGiftCode,
  actionLoading = false,
  showToast
}) {
  // Grant state
  const [selectedMerchantId, setSelectedMerchantId] = useState(merchants[0]?.id || '');
  const [grantDays, setGrantDays] = useState(30);

  // New Code state
  const [codeString, setCodeString] = useState('');
  const [codeDays, setCodeDays] = useState(30);
  const [codeMaxUses, setCodeMaxUses] = useState(1);
  const [codeNote, setCodeNote] = useState('');

  const activeCount = merchants.filter(m => m.subscription_status === 'active').length;
  const trialCount = merchants.filter(m => m.subscription_status === 'trial').length;
  const expiredCount = merchants.filter(m => m.subscription_status === 'expired' || m.subscription_status === 'inactive').length;

  // Subscription Orders (separated from standard store transactions)
  const subOrders = (orders || []).filter(o => {
    const note = String(o?.note || '');
    const proj = String(o?.project || '');
    return note.startsWith('Subscription_') || note.includes('Subscription') || proj.includes('Platform License') || note.includes('Trial_Setup') || note.includes('Autopay_Setup');
  });

  const totalSubRevenue = subOrders
    .filter(o => o.status === 'verified' || o.status === 'paid')
    .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${label}!`, 'info');
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    const finalCode = codeString.trim() || `PROMO${Math.floor(1000 + Math.random() * 9000)}`;
    if (onCreateGiftCode) {
      await onCreateGiftCode({
        code: finalCode.toUpperCase(),
        days: codeDays,
        maxUses: codeMaxUses,
        note: codeNote.trim()
      });
      setCodeString('');
      setCodeNote('');
    }
  };

  const handleGrant = async () => {
    if (!selectedMerchantId) {
      if (showToast) showToast('Please select a merchant', 'error');
      return;
    }
    const target = merchants.find(m => m.id === selectedMerchantId);
    if (onExtendSubscription) {
      await onExtendSubscription(selectedMerchantId, grantDays, target?.subscription_expires_at);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Active Plans</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{activeCount}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-700 font-bold mt-2">Paying or active partners</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total SaaS Inflow</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">₹{totalSubRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-blue-700 font-bold mt-2">{subOrders.length} subscription orders</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Expired / Inactive</p>
              <h3 className="text-3xl font-black text-amber-900 mt-2">{expiredCount}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-700 font-bold mt-2">Awaiting renewal or grant</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Gift &amp; Promo Codes</p>
              <h3 className="text-3xl font-black text-purple-900 mt-2">{giftCodes.length}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-purple-700 font-bold mt-2">Available for redemption</p>
        </div>

      </div>

      {/* 2. SPLIT SECTION: 1-CLICK GRANT & PROMO GENERATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1-Click Plan Grant & Extension */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" /> Grant or Extend Merchant Plan
            </h3>
            <p className="text-xs text-slate-400">Select any merchant and extend their validity instantly</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Select Merchant</label>
              <div className="relative">
                <select
                  value={selectedMerchantId}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold outline-none cursor-pointer appearance-none pr-8"
                >
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.business_name} ({m.phone_number || m.email || m.id.slice(0, 6)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Validity Period</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 7, label: '+7 Days' },
                  { days: 30, label: '+30 Days' },
                  { days: 90, label: '+90 Days' },
                  { days: 365, label: '+1 Year' },
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setGrantDays(opt.days)}
                    className={`py-2 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                      grantDays === opt.days ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGrant}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs mt-2"
            >
              Grant Validity &rarr;
            </button>
          </div>
        </div>

        {/* Promo Code Generator */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-600" /> Generate Promo / Gift Code
            </h3>
            <p className="text-xs text-slate-400">Merchants can redeem this code inside their billing portal</p>
          </div>

          <form onSubmit={handleCreateCode} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Code String (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SPECIAL30"
                  value={codeString}
                  onChange={(e) => setCodeString(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Plan Duration</label>
                <select
                  value={codeDays}
                  onChange={(e) => setCodeDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value={7}>7 Days Extension</option>
                  <option value={30}>30 Days Standard</option>
                  <option value={90}>90 Days Quarterly</option>
                  <option value={365}>365 Days Annual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Max Redemptions</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={codeMaxUses}
                  onChange={(e) => setCodeMaxUses(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Campaign Note</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Partner Offer"
                  value={codeNote}
                  onChange={(e) => setCodeNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs mt-2"
            >
              Create Gift Code &rarr;
            </button>
          </form>
        </div>

      </div>

      {/* 3. ACTIVE GIFT CODES TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-600" /> Active Platform Gift &amp; Promo Codes
            </h3>
            <p className="text-xs text-slate-400">Total {giftCodes.length} active codes available</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5 text-left">Code String</th>
                <th className="px-5 py-3.5 text-left">Duration Granted</th>
                <th className="px-5 py-3.5 text-center">Usage Limit</th>
                <th className="px-5 py-3.5 text-left">Campaign Note</th>
                <th className="px-5 py-3.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {giftCodes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    No promo or gift codes created yet.
                  </td>
                </tr>
              ) : (
                giftCodes.map((gc, idx) => (
                  <tr key={gc.code || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-purple-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                          {gc.code}
                        </span>
                        <button
                          onClick={() => handleCopy(gc.code, 'Promo Code')}
                          className="p-1 text-slate-400 hover:text-slate-800"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 font-semibold">
                      +{gc.days || 30} Days Validity
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center font-bold text-slate-800">
                      {gc.used_count || 0} / {gc.max_uses || 1}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {gc.note || 'General promotion'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => onDeleteGiftCode && onDeleteGiftCode(gc.code)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DEDICATED SAAS SUBSCRIPTIONS & LICENSE INFLOW LEDGER */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" /> Platform SaaS Subscription Payments Ledger
            </h3>
            <p className="text-xs text-slate-400">Total {subOrders.length} subscription orders collected across all merchants</p>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
            Total Revenue: ₹{totalSubRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5 text-left">Order ID</th>
                <th className="px-5 py-3.5 text-left">Subscriber Merchant</th>
                <th className="px-5 py-3.5 text-left">Plan / Note</th>
                <th className="px-5 py-3.5 text-left">Amount</th>
                <th className="px-5 py-3.5 text-left">UTR / Rail</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {subOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No SaaS subscription payments recorded yet.
                  </td>
                </tr>
              ) : (
                subOrders.map((ord) => {
                  const isPaid = ord.status === 'verified' || ord.status === 'paid';
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{ord.id}</span>
                          <button
                            onClick={() => handleCopy(ord.id, 'Order ID')}
                            className="p-1 text-slate-400 hover:text-slate-800"
                            title="Copy Order ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-800">
                        {ord.customer_name || 'Merchant Owner'}
                        {ord.external_ref && (
                          <span className="block text-[10px] font-mono text-slate-400">
                            Ref: {ord.external_ref.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-blue-700 font-bold">
                        {ord.note || ord.project || 'Subscription'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900 tabular-nums">
                        ₹{Number(ord.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {ord.utr || ord.customer_utr || 'Awaiting UTR'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{isPaid ? 'Verified' : 'Pending'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-slate-500 font-mono text-[11px]">
                        {ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
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
  );
}

