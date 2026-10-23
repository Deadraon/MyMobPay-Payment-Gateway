'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Store, 
  Phone, 
  Mail, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  MoreVertical,
  Plus,
  Trash2
} from 'lucide-react';

export default function MerchantsTab({
  merchants = [],
  loading = false,
  onSelectMerchant,
  onToggleStatus,
  onRequestDelete,
  actionLoading = false,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, trial, frozen, expired

  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      // Status filter
      if (statusFilter !== 'all') {
        const sub = (m.subscription_status || '').toLowerCase();
        if (statusFilter === 'active' && sub !== 'active') return false;
        if (statusFilter === 'trial' && sub !== 'trial') return false;
        if (statusFilter === 'frozen' && sub !== 'frozen') return false;
        if (statusFilter === 'expired' && sub !== 'expired' && sub !== 'inactive') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (m.business_name || '').toLowerCase().includes(q);
        const ownerMatch = (m.owner_name || '').toLowerCase().includes(q);
        const emailMatch = (m.email || '').toLowerCase().includes(q);
        const phoneMatch = (m.phone_number || '').toLowerCase().includes(q);
        const upiMatch = (m.upi_id || '').toLowerCase().includes(q);
        const idMatch = (m.id || '').toLowerCase().includes(q);
        if (!nameMatch && !ownerMatch && !emailMatch && !phoneMatch && !upiMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [merchants, statusFilter, searchQuery]);

  const activeCount = merchants.filter(m => m.subscription_status === 'active').length;
  const frozenCount = merchants.filter(m => m.subscription_status === 'frozen').length;
  const trialCount = merchants.filter(m => m.subscription_status === 'trial').length;

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-fadeIn">
      
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Merchant Central &amp; Directory
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Total {merchants.length} businesses • {activeCount} active • {trialCount} in trial • {frozenCount} frozen
          </p>
        </div>

        {/* Search & Direct Purge */}
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search store, owner, phone, email, VPA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => onRequestDelete && onRequestDelete({ isDirectLookup: true })}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Purge any account completely from database by ID or email"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Purge Account</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Merchants', count: merchants.length },
          { id: 'active', label: 'Active Plans', count: activeCount },
          { id: 'trial', label: 'Trial Mode', count: trialCount },
          { id: 'frozen', label: 'Frozen / Suspend', count: frozenCount },
          { id: 'expired', label: 'Expired / Inactive', count: Math.max(0, merchants.length - activeCount - trialCount - frozenCount) },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === f.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-650 hover:bg-slate-200/70'
            }`}
          >
            <span>{f.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Merchants Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5 text-left">Merchant &amp; Store</th>
              <th className="px-5 py-3.5 text-left">Contact Info</th>
              <th className="px-5 py-3.5 text-left">Settlement UPI VPA</th>
              <th className="px-5 py-3.5 text-left">Plan Status</th>
              <th className="px-5 py-3.5 text-center">State Toggle</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && merchants.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  Fetching merchant records...
                </td>
              </tr>
            ) : filteredMerchants.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
                  No merchants found matching your query.
                </td>
              </tr>
            ) : (
              filteredMerchants.map(m => {
                const isFrozen = m.subscription_status === 'frozen';
                const isActive = m.subscription_status === 'active';
                const isTrial = m.subscription_status === 'trial';
                const cleanPhone = (m.phone_number || '').replace(/\D/g, '');

                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMerchant && onSelectMerchant(m)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Merchant & Store */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {m.business_name ? m.business_name.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{m.business_name || 'My Business'}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {m.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {m.phone_number ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                          <span>{m.phone_number}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-600 hover:text-emerald-800 p-0.5"
                              title="Open WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium italic">Missing phone</span>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.email || 'No email'}</p>
                    </td>

                    {/* Settlement VPA */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-700">
                      {m.upi_id || 'Not configured'}
                    </td>

                    {/* Plan Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isFrozen
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isTrial
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isFrozen ? 'bg-rose-500' : isActive ? 'bg-emerald-500' : isTrial ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        <span>{m.subscription_status || 'inactive'}</span>
                      </span>
                    </td>

                    {/* State Toggle (Freeze / Activate) */}
                    <td className="px-5 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleStatus && onToggleStatus(m.id, isFrozen ? 'active' : 'frozen')}
                        disabled={actionLoading}
                        className={`px-3 py-1 rounded-xl text-[10px] font-extrabold border transition-colors cursor-pointer disabled:opacity-50 ${
                          isFrozen 
                            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isFrozen ? 'Click to unfreeze merchant account' : 'Click to freeze merchant account'}
                      >
                        {isFrozen ? '❄️ Frozen' : 'Active'}
                      </button>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMerchant && onSelectMerchant(m);
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-650 hover:text-blue-600 transition-colors font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          title="Manage Store Profile"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete && onRequestDelete(m);
                          }}
                          disabled={actionLoading}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete Account Completely from Database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

    </section>
  );
}
