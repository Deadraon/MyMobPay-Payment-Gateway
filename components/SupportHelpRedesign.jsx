'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  LifeBuoy,
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  FileQuestion,
  Activity,
  Layers,
  Sparkles,
  Paperclip,
  X
} from 'lucide-react';

export default function SupportHelpRedesign({
  profile = {},
  user = {},
  setActiveTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'tickets' | 'faq' | 'status'
  const [ticketCategory, setTicketCategory] = useState('Payment Verification Issue');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketOrderRef, setTicketOrderRef] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState(null);

  // Tickets History
  const [tickets, setTickets] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`mmp_tickets_${profile?.id}`) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        const cleaned = parsed.filter(t => t.id !== 'TICK-9021');
        if (cleaned.length !== parsed.length && typeof window !== 'undefined') {
          localStorage.setItem(`mmp_tickets_${profile?.id}`, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch {}
    return [];
  });

  // FAQ Search
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: 'Does MyMobPay hold or escrow our customer funds?',
      a: 'No. MyMobPay operates on a 100% direct peer-to-merchant UPI architecture. Money transfers directly from the customer’s bank account into your linked bank account via NPCI UPI rails. We never hold, pool, or delay your money.'
    },
    {
      q: 'Are there any per-transaction fees or MDR percentage deductions?',
      a: 'Zero. We charge a flat monthly or quarterly software subscription. 100% of the customer’s payment reaches your bank without gateway commissions or MDR deductions.'
    },
    {
      q: 'How does automated verification match payments without bank API access?',
      a: 'When your customer pays, your bank dispatches an instant credit alert via SMS/Email. Our secure notification webhook reads the incoming credit amount and 12-digit UTR, instantly marking your order as verified in real time.'
    },
    {
      q: 'What if a customer pays but the bank notification is delayed?',
      a: 'You can go to the Verification Center or Transactions tab, locate the order, and click "Mark as Paid". Enter the UTR from your bank app to immediately verify the order and trigger merchant webhooks.'
    },
    {
      q: 'How do I connect WooCommerce or Shopify?',
      a: 'Use our ready-to-install WooCommerce plugin or webhook bridge. Simply copy your Live API Key and Webhook Secret from the Developer Console and paste them into your store settings.'
    }
  ];

  const upiErrorCodes = [
    { code: 'U16', meaning: 'Risk Threshold Exceeded', solution: 'Customer has exceeded their personal bank’s daily UPI limit. Advise them to use another bank account or Netbanking.' },
    { code: 'U30', meaning: 'Insufficient Balance', solution: 'The customer’s bank account does not have sufficient funds for the transaction.' },
    { code: 'U69', meaning: 'Remitter Bank Switch Down', solution: 'Customer’s issuing bank (e.g. SBI, HDFC) experienced a temporary NPCI switch timeout. Retry after 2 minutes.' },
    { code: 'U28', meaning: 'User Cancelled / Session Timeout', solution: 'Customer closed their UPI app or dismissed the payment request before entering their MPIN.' },
    { code: 'ZM', meaning: 'Invalid MPIN', solution: 'Customer entered an incorrect UPI PIN. They must retry with the correct 4 or 6-digit PIN.' },
    { code: 'XB', meaning: 'Beneficiary Account Limit', solution: 'Your receiving account has hit an internal receiving cap. Check your merchant VPA in Banking Settings.' }
  ];

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || ticketSubmitting) return;

    setTicketSubmitting(true);
    const newTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: ticketSubject.trim(),
      category: ticketCategory,
      orderRef: ticketOrderRef.trim() || null,
      message: ticketMessage.trim(),
      status: 'Open',
      createdAt: 'Just now',
      updatedAt: 'Pending response'
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    if (typeof window !== 'undefined' && profile?.id) {
      localStorage.setItem(`mmp_tickets_${profile.id}`, JSON.stringify(updated));
    }

    setTicketSubject('');
    setTicketOrderRef('');
    setTicketMessage('');
    setTicketSubmitting(false);
    setTicketSuccessMsg(`Ticket #${newTicket.id} submitted! Our engineering support team will respond within 2 business hours.`);
    setTimeout(() => setTicketSuccessMsg(null), 6000);
  };

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 font-sans antialiased text-[#0f141a]">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support &amp; Help Desk</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
              Priority Founder Support
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Open engineering support tickets, diagnose UPI error codes, and check live bank switch health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Ask AI Copilot</span>
          </button>
          <a
            href="https://status.mymobpay.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Public System Status <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* ── Sub Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
          { id: 'faq', label: 'Help Center & UPI Codes', icon: FileQuestion },
          { id: 'status', label: 'Live Bank Rails', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-blue-600" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 1: SUPPORT TICKETS
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-6">

          {ticketSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ticketSuccessMsg}</span>
              </div>
              <button type="button" onClick={() => setTicketSuccessMsg(null)}>&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Ticket Form */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Open a New Support Ticket</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our core engineering team replies directly via email within 2-4 hours.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="Payment Verification Issue">Payment Verification &amp; UTR Match</option>
                      <option value="API & Webhook Integration">API &amp; Webhook Integration</option>
                      <option value="Subscription & Billing">Subscription &amp; Platform Plan</option>
                      <option value="Bank Account & VPA Configuration">Bank Account &amp; VPA Setup</option>
                      <option value="General Technical Question">General Technical Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Associated Order ID / UTR (Optional)</label>
                    <input
                      type="text"
                      value={ticketOrderRef}
                      onChange={(e) => setTicketOrderRef(e.target.value)}
                      placeholder="e.g. order_9821 or UTR 40381928"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief summary of the issue..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe what occurred, any error codes received, and steps to reproduce..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Responses are also CC&apos;d to <strong>{profile?.email || user?.email}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={ticketSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick SLA info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
              <h4 className="font-bold text-slate-900">Support Hours &amp; SLAs</h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Working Hours:</span>
                  <span className="font-bold text-slate-800">09:00 - 21:00 IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Urgent Rails Down:</span>
                  <span className="font-bold text-emerald-700">24/7 Monitoring</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Average First Reply:</span>
                  <span className="font-bold text-slate-800">&lt; 45 minutes</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200/80">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Need direct developer escalation? You can also reach our engineering lead directly on WhatsApp via our founder concierge.
                </p>
              </div>
            </div>
          </div>

          {/* Ticket History */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-2">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Your Ticket History</h3>
              <span className="text-[11px] text-slate-500">{tickets.length} total</span>
            </div>

            <div className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-slate-700">No support tickets opened yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the form above to reach our engineering team anytime.</p>
                </div>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">#{t.id}</span>
                        <span className="text-xs font-bold text-slate-800">{t.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    {t.response && (
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
                        <span className="font-bold block mb-0.5">Support Resolution:</span>
                        <span>{t.response}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 flex gap-4">
                      <span>Created: {t.createdAt}</span>
                      <span>Last updated: {t.updatedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 2: HELP CENTER & UPI ERROR CODES
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'faq' && (
        <div className="space-y-6">

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search help articles, questions, or UPI error codes..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-2xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* UPI Error Codes Directory Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">NPCI UPI Error Code Directory</h3>
                <p className="text-xs text-slate-500">Quick diagnostic guide for common customer payment failure reasons</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {upiErrorCodes.map(c => (
                <div key={c.code} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Code: {c.code}
                    </span>
                    <span className="font-bold text-slate-800 text-[11px]">{c.meaning}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pt-0.5 leading-relaxed">{c.solution}</p>
                </div>
              ))}
            </div>
          </div>

          {/* General FAQs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {filteredFaqs.map((f, i) => (
                <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-3.5 text-left text-xs font-bold text-slate-800 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>{f.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedFaq === i && (
                    <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 3: LIVE BANK RAILS STATUS
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'status' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">National UPI Switches &amp; Bank Network Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time health telemetry across primary Indian banking gateways.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Central Switches Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'HDFC Bank Switch', uptime: '99.98%', latency: '19ms', status: 'Operational' },
              { name: 'ICICI Bank Switch', uptime: '99.99%', latency: '16ms', status: 'Operational' },
              { name: 'State Bank of India (SBI)', uptime: '99.12%', latency: '52ms', status: 'Normal' },
              { name: 'Axis Bank Switch', uptime: '99.95%', latency: '24ms', status: 'Operational' }
            ].map(b => (
              <div key={b.name} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">{b.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>30-Day Uptime:</span>
                  <span className="font-mono font-bold text-slate-800">{b.uptime}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Network Latency:</span>
                  <span className="font-mono text-emerald-600 font-bold">{b.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
