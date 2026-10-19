'use client';

import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  ExternalLink, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Store, 
  User, 
  Phone, 
  CreditCard,
  Hash,
  Calendar,
  Code
} from 'lucide-react';

export default function TransactionDrawer({ 
  order, 
  merchant, 
  onClose, 
  onManualVerify, 
  onManualReject, 
  onResendWebhook,
  actionLoading = false,
  showToast
}) {
  if (!order) return null;

  const localTime = new Date(order.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  const verifiedTime = order.verified_at ? new Date(order.verified_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }) : null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${label} to clipboard!`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      {/* Slide-over backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slideInRight overflow-y-auto">
        
        {/* Top Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              order.status === 'verified' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : order.status === 'rejected'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              ● {order.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{order.id.slice(0, 8)}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Amount Hero */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction Amount</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
              ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              100% direct bank credit • 0% gateway commission
            </p>
          </div>

          {/* Core Lifecycle Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Transaction Lifecycle
            </h4>
            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2 text-xs">
              
              {/* Step 1: Created */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                <p className="font-bold text-slate-900">Order Initiated</p>
                <p className="text-slate-500">{localTime}</p>
              </div>

              {/* Step 2: UTR Match */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                  order.utr ? 'bg-emerald-600 ring-emerald-100' : 'bg-slate-300 ring-slate-100'
                }`} />
                <p className="font-bold text-slate-900">
                  {order.utr ? 'Bank Credit Verified (UTR Matched)' : 'Awaiting Bank Credit Alert'}
                </p>
                {order.utr && (
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                    UTR: {order.utr}
                  </p>
                )}
                {verifiedTime && (
                  <p className="text-slate-400 text-[10px]">{verifiedTime}</p>
                )}
              </div>

              {/* Step 3: Outbound Webhook */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                  order.status === 'verified' ? 'bg-indigo-600 ring-indigo-100' : 'bg-slate-300 ring-slate-100'
                }`} />
                <p className="font-bold text-slate-900">Merchant Webhook Dispatch</p>
                <p className="text-slate-500">
                  {order.status === 'verified' ? 'Signed HMAC-SHA256 payload sent' : 'Pending payment settlement'}
                </p>
              </div>

            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Transaction Metadata Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Payment Parameters
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Order ID</span>
                <span className="font-mono font-bold text-slate-800 break-all">{order.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Store / Merchant</span>
                <span className="font-bold text-slate-800">{merchant?.business_name || 'Primary Store'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Customer Name</span>
                <span className="font-bold text-slate-800">{order.customer_name || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Customer Phone</span>
                <span className="font-mono font-bold text-slate-800">{order.customer_phone || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                <span className="text-[10px] text-slate-400 block font-semibold">Bank UTR Reference</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-900 text-sm">{order.utr || 'Awaiting Match'}</span>
                  {order.utr && (
                    <button
                      onClick={() => handleCopy(order.utr, 'UTR')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {order.note && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                  <span className="text-[10px] text-slate-400 block font-semibold">Order Note / Purpose</span>
                  <span className="text-slate-700">{order.note}</span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Webhook Endpoint & Payload Viewer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Outbound Webhook
              </h4>
              <button
                onClick={() => onResendWebhook && onResendWebhook(order.id)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Re-send Webhook</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                <span>POST {merchant?.webhook_url || 'https://merchant.com/webhook'}</span>
                <span className="text-emerald-400 font-bold">HMAC-SHA256</span>
              </div>
              <pre className="text-[11px] overflow-x-auto text-slate-300 leading-relaxed">
{JSON.stringify({
  event: 'payment.verified',
  order_id: order.id,
  amount: Number(order.amount),
  utr: order.utr || 'PENDING',
  customer: {
    name: order.customer_name || null,
    phone: order.customer_phone || null
  },
  timestamp: order.verified_at || order.created_at
}, null, 2)}
              </pre>
            </div>
          </div>

        </div>

        {/* Drawer Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex items-center gap-3">
          {order.status !== 'verified' && (
            <button
              onClick={() => onManualVerify && onManualVerify(order)}
              disabled={actionLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Manual Reconcile &amp; Verify</span>
            </button>
          )}

          {order.status !== 'rejected' && (
            <button
              onClick={() => onManualReject && onManualReject(order.id)}
              disabled={actionLoading}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
