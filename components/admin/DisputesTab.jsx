'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileCheck2, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Send, 
  Plus, 
  MessageCircle, 
  ShieldAlert, 
  Search, 
  ChevronRight,
  RefreshCw,
  Mail,
  UserCheck,
  Building,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Filter,
  X
} from 'lucide-react';

const FALLBACK_DISPUTES = [];

export default function DisputesTab({ showToast, getAuthHeaders }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, open, evidence_requested, merchant_responded, resolved
  const [copiedUtr, setCopiedUtr] = useState('');

  // Selected dispute modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [newStatus, setNewStatus] = useState('evidence_requested');
  const [statusNote, setStatusNote] = useState('');
  const [notifyMerchantEmail, setNotifyMerchantEmail] = useState(true);

  // New dispute modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formUtr, setFormUtr] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formName, setFormName] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formReason, setFormReason] = useState('');

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      let headers = {};
      try {
        if (getAuthHeaders) {
          headers = await Promise.race([
            getAuthHeaders(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
          ]);
        }
      } catch (authErr) {
        console.warn('Auth header retrieval warning:', authErr);
      }

      const res = await fetch('/api/admin/disputes', { 
        headers,
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.disputes) && data.disputes.length > 0) {
        setDisputes(data.disputes);
      } else {
        setDisputes(FALLBACK_DISPUTES);
      }
    } catch (err) {
      console.warn('Disputes fetch notice, using fallback records:', err);
      setDisputes((prev) => (prev.length > 0 ? prev : FALLBACK_DISPUTES));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const copyToClipboard = (text, type = 'UTR') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    if (showToast) showToast(`${type} copied to clipboard`, 'info');
    setTimeout(() => setCopiedUtr(''), 2000);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'update_status',
          disputeId: selectedDispute.id,
          status: newStatus,
          note: statusNote.trim(),
          notifyMerchant: notifyMerchantEmail
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update dispute');

      if (showToast) showToast(`Dispute #${selectedDispute.id} updated!`, 'info');
      setSelectedDispute(null);
      setStatusNote('');
      fetchDisputes();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create_dispute',
          utr: formUtr.trim(),
          amount: formAmount,
          customerPhone: formPhone.trim(),
          customerName: formName.trim(),
          merchantName: formMerchant.trim(),
          merchantEmail: formEmail.trim(),
          reason: formReason.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register dispute');

      if (showToast) showToast('Dispute ticket registered in operations queue', 'info');
      setIsCreateOpen(false);
      setFormUtr('');
      setFormAmount('');
      setFormPhone('');
      setFormName('');
      setFormMerchant('');
      setFormEmail('');
      setFormReason('');
      fetchDisputes();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations
  const counts = useMemo(() => {
    const total = disputes.length;
    const open = disputes.filter(d => d.status === 'open').length;
    const evidence = disputes.filter(d => d.status === 'evidence_requested').length;
    const responded = disputes.filter(d => d.status === 'merchant_responded').length;
    const resolved = disputes.filter(d => d.status === 'resolved').length;
    return { total, open, evidence, responded, resolved };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      // Status filter
      if (statusFilter !== 'all' && d.status !== statusFilter) {
        return false;
      }
      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (d.utr && d.utr.toLowerCase().includes(q)) ||
        (d.customer_name && d.customer_name.toLowerCase().includes(q)) ||
        (d.customer_phone && d.customer_phone.toLowerCase().includes(q)) ||
        (d.merchant_name && d.merchant_name.toLowerCase().includes(q)) ||
        (d.merchant_email && d.merchant_email.toLowerCase().includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.reason && d.reason.toLowerCase().includes(q))
      );
    });
  }, [disputes, statusFilter, searchTerm]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Open Claim
          </span>
        );
      case 'evidence_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Evidence Requested
          </span>
        );
      case 'merchant_responded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            Merchant Responded
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Resolved &amp; Closed
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertCircle className="w-3 h-3 text-purple-600" />
            Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Top Header & Security Banner ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Customer Claims &amp; Inquiries Desk</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized non-custodial inquiry channel for customer payment verification and proof exchange.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDisputes}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh disputes"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Intake New Claim</span>
          </button>
        </div>
      </div>

      {/* ── Compact Non-Custodial Protocol Strip ───────────────────────── */}
      <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-[11.5px] leading-snug">
            <strong className="text-slate-900 font-bold">Non-Custodial Dispute Protocol Active:</strong> MyMobPay operates on direct bank pass-through rails. This desk records tamper-evident communication and proof. <span className="text-slate-500">Merchant bank accounts are never automatically debited.</span>
          </p>
        </div>
        <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
          Direct Settlement Intact
        </span>
      </div>

      {/* ── 4 KPI Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' 
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Claims</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{counts.total}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">All customer inquiries</div>
        </div>

        <div 
          onClick={() => setStatusFilter('open')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'open' 
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Open Tickets</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">{counts.open}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-0.5">Needs ops or merchant action</div>
        </div>

        <div 
          onClick={() => setStatusFilter('evidence_requested')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'evidence_requested' 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Evidence Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">{counts.evidence}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting store fulfillment proof</div>
        </div>

        <div 
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'resolved' 
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved &amp; Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{counts.resolved}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Payment verified or settled</div>
        </div>
      </div>

      {/* ── Main Disputes Workspace ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Workspace Toolbar: Status Tabs + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              All Claims ({counts.total})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'open'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
              }`}
            >
              Open ({counts.open})
            </button>
            <button
              onClick={() => setStatusFilter('evidence_requested')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'evidence_requested'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
              }`}
            >
              Evidence Requested ({counts.evidence})
            </button>
            <button
              onClick={() => setStatusFilter('merchant_responded')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'merchant_responded'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              Responded ({counts.responded})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
              }`}
            >
              Resolved ({counts.resolved})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search UTR, payer, merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium transition-all shadow-2xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Disputes Table ─────────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5 text-left">Claim ID &amp; UTR</th>
                <th className="px-4 py-3.5 text-left">Payer / Customer</th>
                <th className="px-4 py-3.5 text-left">Merchant Store</th>
                <th className="px-4 py-3.5 text-center">Claim Amount</th>
                <th className="px-4 py-3.5 text-left">Desk Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                // Animated Skeleton Loading State
                [1, 2, 3].map((i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1.5" />
                      <div className="h-3 bg-slate-100 rounded w-32" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded w-28 mb-1.5" />
                      <div className="h-3 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded w-28 mb-1.5" />
                      <div className="h-3 bg-slate-100 rounded w-36" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-5 bg-slate-200 rounded w-16 mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-slate-100 rounded-full w-28" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-7 bg-slate-100 rounded-xl w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No dispute records matching query</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        {searchTerm ? `No claims match "${searchTerm}" in status filter "${statusFilter}".` : 'No customer payment inquiries are currently logged in this queue.'}
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDisputes.map(d => {
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Claim ID & UTR */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 block">{d.id}</span>
                          <span className="text-[10px] text-slate-400 font-sans">({d.order_id || 'N/A'})</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-600 font-semibold">UTR: {d.utr}</span>
                          <button
                            onClick={() => copyToClipboard(d.utr, 'UTR')}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            title="Copy UTR"
                          >
                            {copiedUtr === d.utr ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{d.customer_name || 'Direct Payer'}</p>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{d.customer_phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Merchant Store */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800">{d.merchant_name || 'Store Merchant'}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">
                          {d.merchant_email || 'No email registered'}
                        </p>
                      </td>

                      {/* Claim Amount */}
                      <td className="px-4 py-3.5 text-center font-black font-mono text-slate-900 text-sm">
                        ₹{parseFloat(d.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Desk Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(d.status)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setNewStatus(d.status || 'evidence_requested');
                            setStatusNote('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer border border-transparent hover:border-blue-200"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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

      {/* ── Selected Dispute Modal (Manage & Update Evidence) ─────────── */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Dispute Operations Ticket</span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <span>Claim #{selectedDispute.id}</span>
                  {getStatusBadge(selectedDispute.status)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Claim Highlights Summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">UTR / Order ID</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedDispute.utr}</p>
                <p className="font-mono text-[10px] text-slate-400">{selectedDispute.order_id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Claimed Amount</p>
                <p className="font-mono font-black text-slate-900 text-sm mt-0.5">₹{selectedDispute.amount}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Payer Contact</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedDispute.customer_name}</p>
                <p className="font-mono text-[10px] text-slate-500">{selectedDispute.customer_phone}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Target Merchant Store</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedDispute.merchant_name}</p>
                <p className="font-mono text-[10px] text-slate-500 truncate">{selectedDispute.merchant_email}</p>
              </div>
            </div>

            {/* Customer Reason / Complaint */}
            <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-2xl text-xs">
              <span className="font-bold text-rose-900 block mb-1">Customer Statement / Inquiry Reason:</span>
              <p className="text-rose-800 leading-relaxed">{selectedDispute.reason || 'No statement provided by customer.'}</p>
            </div>

            {/* Timeline Audit */}
            {selectedDispute.timeline && selectedDispute.timeline.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Claim Activity Log</span>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 max-h-36 overflow-y-auto">
                  {selectedDispute.timeline.map((item, idx) => (
                    <div key={idx} className="text-[11px] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-slate-700">{item.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update Status Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-3.5 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Update Investigation Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="evidence_requested">Evidence Requested (Ask merchant for order/dispatch proof)</option>
                  <option value="merchant_responded">Merchant Responded (Proof attached by merchant)</option>
                  <option value="resolved">Resolved &amp; Closed (Transaction verified &amp; settled)</option>
                  <option value="escalated">Escalated (Manual bank or operations review required)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Operator Note (Will be added to timeline)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Enter notes, verification feedback, or customer resolution details..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyMerchantEmail}
                    onChange={(e) => setNotifyMerchantEmail(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-slate-600 font-medium">Send email update to merchant store</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Dispute Intake Modal ───────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-fadeIn my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Intake Customer Claim / Inquiry</span>
                </h3>
                <p className="text-[11px] text-slate-500">Record an inquiry submitted by a payer or bank inquiry.</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank UTR Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 408912345678"
                    value={formUtr}
                    onChange={(e) => setFormUtr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Claim Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1499.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer / Payer Name</label>
                  <input
                    type="text"
                    placeholder="Amit Verma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9811122334"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Merchant Store Name</label>
                  <input
                    type="text"
                    placeholder="e.g. TechStore India"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Merchant Email</label>
                  <input
                    type="email"
                    placeholder="merchant@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispute Statement / Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detail the issue: e.g. Customer bank debited, store order not updated..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Claim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
