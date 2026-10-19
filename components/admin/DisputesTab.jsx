'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Building
} from 'lucide-react';

export default function DisputesTab({ showToast, getAuthHeaders }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/disputes', { headers });
      if (!res.ok) throw new Error('Failed to load disputes');
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch (err) {
      if (showToast) showToast('Failed to load disputes', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

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

  const filteredDisputes = disputes.filter(d => {
    const q = searchTerm.toLowerCase();
    return (
      (d.utr && d.utr.toLowerCase().includes(q)) ||
      (d.customer_name && d.customer_name.toLowerCase().includes(q)) ||
      (d.merchant_name && d.merchant_name.toLowerCase().includes(q)) ||
      (d.id && d.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Non-Custodial Protocol Notice */}
      <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 flex items-start justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-blue-900">Non-Custodial Dispute Protocol Active</h4>
            <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
              MyMobPay never touches, pools, or settles merchant funds. Disputes on this desk serve exclusively as a tamper-evident evidence intake and communication channel between customers and merchants. <strong>No merchant accounts are debited.</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Intake Claim</span>
        </button>
      </div>

      {/* Disputes Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <span>Customer Payment Claims &amp; Inquiries</span>
            </h3>
            <p className="text-xs text-slate-400">Total {disputes.length} active claims recorded</p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search UTR, payer, merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Claim ID &amp; UTR</th>
                <th className="px-4 py-3 text-left">Payer Details</th>
                <th className="px-4 py-3 text-left">Merchant Store</th>
                <th className="px-4 py-3 text-center">Claim Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">Loading dispute records...</td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No customer dispute claims recorded.</td>
                </tr>
              ) : (
                filteredDisputes.map(d => {
                  const statusColors = {
                    open: 'bg-rose-50 text-rose-700 border-rose-200',
                    evidence_requested: 'bg-amber-50 text-amber-700 border-amber-200',
                    merchant_responded: 'bg-blue-50 text-blue-700 border-blue-200',
                    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    escalated: 'bg-purple-50 text-purple-700 border-purple-200'
                  };

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-slate-900 block">{d.id}</span>
                        <span className="text-[10px] text-slate-500">UTR: {d.utr}</span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{d.customer_name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{d.customer_phone}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{d.merchant_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{d.merchant_email}</p>
                      </td>

                      <td className="px-4 py-3 text-center font-black font-mono text-slate-900">
                        ₹{d.amount}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[d.status] || 'bg-slate-100 text-slate-700'}`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setNewStatus(d.status);
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Review &rarr;
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

      {/* Review Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dispute Case #{selectedDispute.id}</h3>
                <p className="text-[10px] font-mono text-slate-400">UTR: {selectedDispute.utr} • Claim: ₹{selectedDispute.amount}</p>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Claim Summary:</span>
              <p className="text-slate-600 leading-relaxed">{selectedDispute.reason}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Transition Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="evidence_requested">Evidence Requested from Merchant</option>
                  <option value="merchant_responded">Merchant Responded with Proof</option>
                  <option value="resolved">Resolved (Evidence Verified)</option>
                  <option value="escalated">Escalated to Bank Direct</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Operational Note / Message to Merchant</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Please provide courier tracking proof or refund confirmation to payer."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyEmail"
                  checked={notifyMerchantEmail}
                  onChange={(e) => setNotifyMerchantEmail(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="notifyEmail" className="text-slate-700 font-semibold cursor-pointer">
                  Send notification email to {selectedDispute.merchant_email || 'merchant'}
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Updating...' : 'Update Dispute Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Intake Customer Payment Claim</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Banking UTR (12 digits)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 408912345678"
                  value={formUtr}
                  onChange={(e) => setFormUtr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1499"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Payer Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Payer Name</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Merchant Store</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TechStore India"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Merchant Contact Email</label>
                <input
                  type="email"
                  placeholder="merchant@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason / Description of Discrepancy</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Details of payer complaint..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Register Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
