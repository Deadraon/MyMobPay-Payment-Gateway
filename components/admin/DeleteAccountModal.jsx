'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  Search, 
  Check, 
  Copy, 
  Store, 
  Mail, 
  Phone, 
  Key, 
  Database,
  ArrowRight,
  RefreshCw,
  UserX
} from 'lucide-react';

export default function DeleteAccountModal({
  isOpen,
  onClose,
  targetAccount, // preset merchant or signup object, or null
  allAccounts = [], // full list of signups/merchants for instant lookup
  onConfirmDelete, // async function (identifier, metadata) => Promise
  actionLoading = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Synchronize when modal opens or targetAccount changes
  useEffect(() => {
    if (isOpen) {
      if (targetAccount && targetAccount.id && !targetAccount.isDirectLookup) {
        setSelectedAccount(targetAccount);
        setSearchTerm('');
      } else {
        setSelectedAccount(null);
        setSearchTerm('');
      }
      setConfirmInput('');
      setErrorMsg('');
      setCopiedId(false);
    }
  }, [isOpen, targetAccount]);

  // Instant autocomplete / matching if searching in direct mode
  const matchingAccounts = useMemo(() => {
    if (!searchTerm.trim() || selectedAccount) return [];
    const q = searchTerm.toLowerCase().trim();
    return allAccounts.filter(a => 
      (a.id && a.id.toLowerCase().includes(q)) ||
      (a.business_name && a.business_name.toLowerCase().includes(q)) ||
      (a.owner_name && a.owner_name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.phone_number && a.phone_number.includes(q))
    ).slice(0, 5);
  }, [searchTerm, selectedAccount, allAccounts]);

  if (!isOpen) return null;

  const currentTarget = selectedAccount || (
    searchTerm.trim() ? {
      id: searchTerm.trim(),
      business_name: 'Custom Identifier / Query',
      email: searchTerm.includes('@') ? searchTerm.trim() : 'Lookup by ID',
      isManualQuery: true
    } : null
  );

  const canExecute = confirmInput.trim().toUpperCase() === 'DELETE' && Boolean(currentTarget?.id);

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExecutePurge = async () => {
    if (!canExecute || !currentTarget?.id) return;
    setErrorMsg('');
    try {
      await onConfirmDelete(currentTarget.id, {
        email: currentTarget.email,
        businessName: currentTarget.business_name || currentTarget.owner_name
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-5 animate-scale-up text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight flex items-center gap-2">
                <span>Permanent Account Deletion</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                  Irreversible
                </span>
              </h3>
              <p className="text-xs text-rose-600 font-semibold mt-0.5">
                Completely erase account and all related database records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={actionLoading}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Display */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search / Target Selector if not preselected */}
        {!selectedAccount && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Search by Merchant UUID, User ID, Email, or Store Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Paste UUID (e.g. 550e8400-...) or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            {/* Instant matching list */}
            {matchingAccounts.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs mt-1">
                {matchingAccounts.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(acc);
                      setSearchTerm('');
                    }}
                    className="w-full text-left p-3 hover:bg-white transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {acc.business_name || acc.owner_name || 'Merchant Account'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">{acc.email || 'No email'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Target Account Preview Card */}
        {currentTarget && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Target Database Record
              </span>
              {!targetAccount?.id && selectedAccount && (
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Change Account
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                {currentTarget.business_name ? currentTarget.business_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 text-sm truncate">
                  {currentTarget.business_name || currentTarget.owner_name || 'Account'}
                </p>
                <p className="text-xs font-mono font-medium text-slate-600 truncate">
                  {currentTarget.email || 'No email address registered'}
                </p>
                {currentTarget.phone_number && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Phone: {currentTarget.phone_number}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500">
              <span className="truncate max-w-[280px]">ID: {currentTarget.id}</span>
              <button
                type="button"
                onClick={() => handleCopyId(currentTarget.id)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded"
                title="Copy ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Warning List: What will be deleted */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 space-y-2 text-xs">
          <p className="font-black text-rose-950 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>The following data will be permanently wiped from the database:</span>
          </p>
          <ul className="space-y-1 text-[11px] text-rose-900/80 pl-5 list-disc font-medium leading-relaxed">
            <li><strong>Supabase Auth Identity:</strong> Email, phone login &amp; Google OAuth session</li>
            <li><strong>Merchant Storefront:</strong> Business profile, API keys &amp; webhook routes</li>
            <li><strong>Financial Records:</strong> Orders, transaction ledger &amp; UTR verification logs</li>
            <li><strong>Active Rails:</strong> Payment links, checkout tokens &amp; QR configurations</li>
            <li><strong>Compliance:</strong> KYC documents, VPA audit history &amp; dispute tickets</li>
          </ul>
        </div>

        {/* Confirmation Typing Input */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-700 block">
            Type <span className="font-mono text-rose-600 font-black px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            placeholder="Type DELETE"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={actionLoading || !currentTarget?.id}
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono font-black text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 uppercase transition-all tracking-wider placeholder:font-normal placeholder:tracking-normal"
          />
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecutePurge}
            disabled={!canExecute || actionLoading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-xs shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {actionLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Purging Database...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account Completely</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
