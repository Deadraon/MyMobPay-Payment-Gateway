'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Send, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  MessageCircle, 
  RefreshCw,
  ExternalLink,
  Plus,
  Save,
  X
} from 'lucide-react';

export default function SignupsTab({
  allSignups = [],
  loading = false,
  onSendOutreachEmail,
  onUpdatePhone,
  actionLoading = false,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('missing_phone'); // missing_phone, pending_setup, ready, all
  const [editingUserId, setEditingUserId] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');

  // Partition signups into actionable buckets
  const missingPhoneUsers = useMemo(() => {
    return allSignups.filter(s => !s.phone_number || s.phone_number === 'Not set' || s.phone_number.trim() === '');
  }, [allSignups]);

  const awaitingVpaUsers = useMemo(() => {
    return allSignups.filter(s => s.phone_number && s.phone_number.trim() !== '' && (!s.upi_id || s.upi_id === 'Not configured' || s.upi_id === 'pending@upi'));
  }, [allSignups]);

  const fullyReadyUsers = useMemo(() => {
    return allSignups.filter(s => s.phone_number && s.upi_id && s.upi_id !== 'Not configured' && s.upi_id !== 'pending@upi');
  }, [allSignups]);

  const displayedSignups = useMemo(() => {
    let list = allSignups;
    if (pipelineFilter === 'missing_phone') list = missingPhoneUsers;
    else if (pipelineFilter === 'pending_setup') list = awaitingVpaUsers;
    else if (pipelineFilter === 'ready') list = fullyReadyUsers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        (s.business_name || '').toLowerCase().includes(q) ||
        (s.owner_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone_number || '').toLowerCase().includes(q) ||
        (s.upi_id || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [allSignups, pipelineFilter, missingPhoneUsers, awaitingVpaUsers, fullyReadyUsers, searchQuery]);

  const handleStartEditPhone = (signup) => {
    setEditingUserId(signup.id);
    setPhoneInput(signup.phone_number || '');
  };

  const handleSavePhone = async (userId) => {
    if (!phoneInput.trim()) {
      if (showToast) showToast('Please enter a phone number', 'error');
      return;
    }
    if (onUpdatePhone) {
      await onUpdatePhone(userId, phoneInput.trim());
      setEditingUserId(null);
    }
  };

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-fadeIn">
      
      {/* Top Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Onboarding &amp; Lead Outreach Pipeline
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Identify stalled onboarding accounts, input verified mobile numbers, and dispatch 1-click outreach emails
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search signup name, email, phone..."
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
      </div>

      {/* Actionable Pipeline Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Missing Phone (Priority 1) */}
        <button
          onClick={() => setPipelineFilter('missing_phone')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            pipelineFilter === 'missing_phone'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-rose-700 tracking-wider">Needs Phone</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-rose-950 mt-1">{missingPhoneUsers.length}</p>
          <p className="text-[10px] text-rose-800/80 font-medium mt-0.5">Send outreach email &rarr;</p>
        </button>

        {/* Awaiting VPA / Bank Setup */}
        <button
          onClick={() => setPipelineFilter('pending_setup')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            pipelineFilter === 'pending_setup'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">Awaiting VPA</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">{awaitingVpaUsers.length}</p>
          <p className="text-[10px] text-amber-800/80 font-medium mt-0.5">Phone verified, needs bank</p>
        </button>

        {/* Fully Ready */}
        <button
          onClick={() => setPipelineFilter('ready')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            pipelineFilter === 'ready'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Ready / Active</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">{fullyReadyUsers.length}</p>
          <p className="text-[10px] text-emerald-800/80 font-medium mt-0.5">VPA &amp; phone active</p>
        </button>

        {/* All Signups */}
        <button
          onClick={() => setPipelineFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            pipelineFilter === 'all'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">All Accounts</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-950 mt-1">{allSignups.length}</p>
          <p className="text-[10px] text-blue-800/80 font-medium mt-0.5">Total platform signups</p>
        </button>

      </div>

      {/* Signups List Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5 text-left">User Profile</th>
              <th className="px-5 py-3.5 text-left">Joined Via</th>
              <th className="px-5 py-3.5 text-left">Contact Number (+91)</th>
              <th className="px-5 py-3.5 text-left">Settlement UPI</th>
              <th className="px-5 py-3.5 text-right">Quick Outreach Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && allSignups.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading onboarding pipeline...
                </td>
              </tr>
            ) : displayedSignups.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-semibold">
                  No signups found in this category.
                </td>
              </tr>
            ) : (
              displayedSignups.map(signup => {
                const isEditingThis = editingUserId === signup.id;
                const cleanPhone = (signup.phone_number || '').replace(/\D/g, '');
                const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 10);
                const isGoogle = (signup.auth_provider || '').toLowerCase().includes('google');

                return (
                  <tr key={signup.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* User Profile */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                          {signup.owner_name ? signup.owner_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{signup.owner_name || signup.business_name || 'Merchant User'}</p>
                          <p className="text-[11px] text-blue-600 font-mono font-medium">{signup.email}</p>
                          <p className="text-[9px] text-slate-400 font-mono">
                            Registered: {new Date(signup.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Joined Via */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isGoogle ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isGoogle ? 'Google OAuth' : 'Email & Password'}
                      </span>
                    </td>

                    {/* Contact Number + Inline Editor */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="+91 9876543210"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="bg-white border border-blue-500 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none w-36"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePhone(signup.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Save Phone"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {hasPhone ? (
                            <span className="font-bold text-slate-800 text-xs">
                              {signup.phone_number}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                              Missing Phone
                            </span>
                          )}
                          <button
                            onClick={() => handleStartEditPhone(signup)}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit / Add Phone Number"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Settlement UPI */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                      {signup.upi_id && signup.upi_id !== 'Not configured' ? (
                        <span className="font-bold text-slate-700">{signup.upi_id}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not configured</span>
                      )}
                    </td>

                    {/* Quick Outreach Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* 1-Click Send Outreach Email Button */}
                        <button
                          onClick={() => onSendOutreachEmail && onSendOutreachEmail(signup.email, signup.owner_name)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Send registration assistance email asking for contact details"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Email</span>
                        </button>

                        {/* WhatsApp Button (if phone exists) */}
                        {hasPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Open WhatsApp chat"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

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
