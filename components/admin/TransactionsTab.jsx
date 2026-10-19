'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Copy, 
  RefreshCw, 
  Download, 
  SlidersHorizontal,
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Send,
  ExternalLink,
  Calendar,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 25;

export default function TransactionsTab({
  orders = [],
  merchants = [],
  loading = false,
  onSelectOrder,
  onManualVerify,
  onManualReject,
  onResendWebhook,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, verified, pending, rejected, replay_risk
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest'); // latest, amount_high, amount_low
  const [currentPage, setCurrentPage] = useState(1);

  // Duplicate UTR Map for Replay Detection
  const duplicateUtrMap = useMemo(() => {
    const counts = new Map();
    for (const o of orders) {
      if (o.utr && o.utr.trim().length >= 6) {
        const clean = o.utr.trim();
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    }
    return counts;
  }, [orders]);

  const duplicateCount = useMemo(() => {
    let count = 0;
    for (const [_, cnt] of duplicateUtrMap.entries()) {
      if (cnt > 1) count += cnt;
    }
    return count;
  }, [duplicateUtrMap]);

  // Filter & Search Engine
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status / Replay Risk Filter
      if (statusFilter === 'replay_risk') {
        const utrClean = (order.utr || '').trim();
        if (!utrClean || (duplicateUtrMap.get(utrClean) || 0) <= 1) return false;
      } else if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // 2. Merchant Store Filter
      if (merchantFilter !== 'all' && order.merchant_id !== merchantFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const utrMatch = (order.utr || '').toLowerCase().includes(q);
        const nameMatch = (order.customer_name || '').toLowerCase().includes(q);
        const phoneMatch = (order.customer_phone || '').toLowerCase().includes(q);
        const noteMatch = (order.note || '').toLowerCase().includes(q);
        const idMatch = (order.id || '').toLowerCase().includes(q);
        const refMatch = (order.external_ref || '').toLowerCase().includes(q);
        if (!utrMatch && !nameMatch && !phoneMatch && !noteMatch && !idMatch && !refMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_high') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'amount_low') return Number(a.amount) - Number(b.amount);
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [orders, statusFilter, merchantFilter, searchQuery, sortBy, duplicateUtrMap]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      if (showToast) showToast('No transactions to export with current filters', 'error');
      return;
    }

    const headers = ['Order ID', 'Date & Time', 'Store Name', 'Customer Name', 'Customer Phone', 'Amount (INR)', 'UTR Reference', 'Status', 'Note'];
    const rows = filteredOrders.map(o => {
      const merchantObj = merchants.find(m => m.id === o.merchant_id);
      const storeName = merchantObj ? merchantObj.business_name : 'Primary Store';
      const timeStr = new Date(o.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      return [
        `"${o.id}"`,
        `"${timeStr}"`,
        `"${storeName.replace(/"/g, '""')}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${o.customer_phone || ''}"`,
        o.amount,
        `"${o.utr || ''}"`,
        `"${o.status}"`,
        `"${(o.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) showToast(`Exported ${filteredOrders.length} transactions to CSV`, 'info');
  };

  const handleCopy = (e, text, label) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${label}!`, 'info');
  };

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-fadeIn">
      
      {/* Header & Quick Action Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Global Transaction Ledger
            </h2>
            {duplicateCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {duplicateCount} Replays Flagged
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Showing {paginatedOrders.length} of {filteredOrders.length} filtered ({orders.length} total orders across merchant VPAs)
          </p>
        </div>

        {/* CSV Export & Sort */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-650 font-bold outline-none cursor-pointer appearance-none pr-8"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="amount_high">Sort: Amount (High to Low)</option>
              <option value="amount_low">Sort: Amount (Low to High)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Download CSV report of filtered transactions"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by UTR, Customer, Phone, Note..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Merchant Store Selector */}
        <div className="relative min-w-[180px]">
          <select
            value={merchantFilter}
            onChange={(e) => {
              setMerchantFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs text-slate-650 font-bold outline-none cursor-pointer appearance-none"
          >
            <option value="all">All Stores / Accounts</option>
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.business_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'verified', label: 'Verified' },
            { id: 'pending', label: 'Pending' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'replay_risk', label: 'Replay Alert' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Transactions Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5 text-left">Store / Merchant</th>
              <th className="px-5 py-3.5 text-left">Order &amp; Customer</th>
              <th className="px-5 py-3.5 text-left">Date (IST)</th>
              <th className="px-5 py-3.5 text-left">Amount</th>
              <th className="px-5 py-3.5 text-left">Bank UTR Reference</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading global transaction logs...
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold">
                  No orders match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedOrders.map(order => {
                const merchantObj = merchants.find(m => m.id === order.merchant_id);
                const storeName = merchantObj ? merchantObj.business_name : 'Primary Store';
                const timeStr = new Date(order.created_at).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                });

                const cleanUtr = (order.utr || '').trim();
                const isDuplicateUtr = cleanUtr && (duplicateUtrMap.get(cleanUtr) || 0) > 1;

                return (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Store */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center">
                          {storeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{storeName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">#{order.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{order.customer_name || 'Walk-in Guest'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{order.customer_phone || 'No phone'}</p>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {timeStr}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-black text-slate-900 text-sm">
                      ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* UTR */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono">
                      {order.utr ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-xs">
                            {order.utr}
                          </span>
                          {isDuplicateUtr && (
                            <span 
                              className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-black"
                              title="Fraud Alert: This UTR was used on multiple orders!"
                            >
                              REPLAY
                            </span>
                          )}
                          <button
                            onClick={(e) => handleCopy(e, order.utr, 'UTR')}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy UTR"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          Awaiting Match
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'verified' ? 'bg-emerald-500' :
                          order.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <span>{order.status}</span>
                      </span>
                    </td>

                    {/* Quick Action Button */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder && onSelectOrder(order);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-650 hover:text-blue-600 transition-colors"
                        title="View Full Lifecycle Drawer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
          <p className="font-medium">
            Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-slate-800">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
