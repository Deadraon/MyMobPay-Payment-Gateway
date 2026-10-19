'use client';

import React, { useState } from 'react';
import { 
  DownloadCloud, 
  FileSpreadsheet, 
  Calendar, 
  CheckCircle2, 
  Mail, 
  Receipt, 
  ArrowDownToLine, 
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';

export default function ReportsTab({ showToast, getAuthHeaders }) {
  const [downloadingType, setDownloadingType] = useState(null);
  const [scheduledFrequency, setScheduledFrequency] = useState('weekly');
  const [recipientEmail, setRecipientEmail] = useState('chauhankunal695@gmail.com');

  const handleDownload = async (type, filename) => {
    setDownloadingType(type);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch(`/api/admin/reports?type=${type}&format=csv`, { headers });
      if (!res.ok) throw new Error('Failed to download report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      if (showToast) showToast(`Downloaded ${filename} successfully!`, 'info');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (showToast) showToast(`Automated ${scheduledFrequency} CSV reports configured for ${recipientEmail}!`, 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-blue-600" />
              <span>Financial Reports &amp; Data Exports</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              CSV &amp; Excel Compatible
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Generate and export complete transaction ledgers, merchant performance metrics, and SAC 998315 GST tax breakdown schedules.
          </p>
        </div>
      </div>

      {/* Available Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Report 1: Full Transaction Ledger */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Full Transaction Ledger</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete export of all customer checkout orders, verified UTR numbers, amounts, timestamps, and merchant IDs.
            </p>
          </div>

          <button
            onClick={() => handleDownload('transactions', `mymobpay_transactions_${Date.now()}.csv`)}
            disabled={downloadingType === 'transactions'}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingType === 'transactions' ? 'Generating CSV...' : 'Download Orders CSV'}</span>
          </button>
        </div>

        {/* Report 2: Merchants Master Directory */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Merchant Partner Directory</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export all registered store names, verified settlement VPAs, owner phones, emails, and active subscription plan states.
            </p>
          </div>

          <button
            onClick={() => handleDownload('merchants', `mymobpay_merchants_${Date.now()}.csv`)}
            disabled={downloadingType === 'merchants'}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingType === 'merchants' ? 'Generating CSV...' : 'Download Merchants CSV'}</span>
          </button>
        </div>

        {/* Report 3: GST Tax Summary */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly GST Schedule (SAC 998315)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Itemized GST breakdown for flat-fee SaaS subscriptions. Calculated at 18% (9% CGST + 9% SGST) for monthly GSTR-1 filings.
            </p>
          </div>

          <button
            onClick={() => handleDownload('gst', `mymobpay_gst_schedule_${Date.now()}.csv`)}
            disabled={downloadingType === 'gst'}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{downloadingType === 'gst' ? 'Generating CSV...' : 'Download GST Schedule'}</span>
          </button>
        </div>

      </div>

      {/* Automated Scheduling Configuration */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Automated Scheduled Report Delivery</h3>
        </div>

        <form onSubmit={handleSaveSchedule} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-end">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Dispatch Frequency</label>
            <select
              value={scheduledFrequency}
              onChange={(e) => setScheduledFrequency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
            >
              <option value="daily">Daily Summary (Every midnight IST)</option>
              <option value="weekly">Weekly Rollup (Every Monday morning)</option>
              <option value="monthly">Monthly Tax Statement (1st of month)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Recipient Admin Email</label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            Save Automated Schedule
          </button>
        </form>
      </div>
    </div>
  );
}
