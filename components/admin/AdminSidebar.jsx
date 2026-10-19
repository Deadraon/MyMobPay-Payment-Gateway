'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Store, 
  UserCheck, 
  Zap, 
  ShieldCheck,
  History,
  Users,
  Radio,
  FileCheck2,
  ShieldAlert,
  Terminal,
  DownloadCloud
} from 'lucide-react';

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  pendingOrdersCount = 0,
  unonboardedSignupsCount = 0,
  activeMerchantsCount = 0
}) {
  const navSections = [
    {
      title: 'Platform Operations',
      items: [
        {
          id: 'overview',
          label: 'Pulse & Overview',
          icon: LayoutDashboard,
          badge: null,
          desc: 'Platform Volume & Metrics'
        },
        {
          id: 'transactions',
          label: 'Transaction Ledger',
          icon: ReceiptText,
          badge: pendingOrdersCount > 0 ? { text: pendingOrdersCount, color: 'bg-amber-100 text-amber-800 border-amber-200' } : null,
          desc: 'Global UPI Checkouts & UTRs'
        },
        {
          id: 'merchants',
          label: 'Merchant Central',
          icon: Store,
          badge: activeMerchantsCount > 0 ? { text: activeMerchantsCount, color: 'bg-blue-100 text-blue-800 border-blue-200' } : null,
          desc: 'SaaS Directory & Risk States'
        },
        {
          id: 'signups',
          label: 'Onboarding Pipeline',
          icon: UserCheck,
          badge: unonboardedSignupsCount > 0 ? { text: unonboardedSignupsCount, color: 'bg-rose-100 text-rose-800 border-rose-200' } : null,
          desc: 'Leads & Phone Verification'
        },
      ]
    },
    {
      title: 'Infrastructure & Rails',
      items: [
        {
          id: 'verification',
          label: 'Verification Center',
          icon: Radio,
          badge: null,
          desc: 'Telemetry & Ingest Queues'
        },
        {
          id: 'developer',
          label: 'Developer & Webhooks',
          icon: Terminal,
          badge: null,
          desc: 'Signed HMAC Webhook Logs'
        },
      ]
    },
    {
      title: 'Risk & Claims',
      items: [
        {
          id: 'risk',
          label: 'Risk & Fraud Rules',
          icon: ShieldAlert,
          badge: null,
          desc: 'Velocity & Blocklist Registry'
        },
        {
          id: 'disputes',
          label: 'Customer Claims Desk',
          icon: FileCheck2,
          badge: null,
          desc: 'Non-Custodial Evidence Tracker'
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: History,
          badge: null,
          desc: 'Tamper-Evident Ops Ledger'
        },
      ]
    },
    {
      title: 'Monetization & Reports',
      items: [
        {
          id: 'subscriptions',
          label: 'Plans & Monetization',
          icon: Zap,
          badge: null,
          desc: 'Subscriptions & Gift Codes'
        },
        {
          id: 'reports',
          label: 'Reports & Exports',
          icon: DownloadCloud,
          badge: null,
          desc: 'CSV Exports & GST Tax GSTR-1'
        },
      ]
    },
    {
      title: 'Security & Governance',
      items: [
        {
          id: 'team',
          label: 'Admin Team & RBAC',
          icon: Users,
          badge: null,
          desc: 'Roles & Staff Permissions'
        },
        {
          id: 'system',
          label: 'System & Security',
          icon: ShieldCheck,
          badge: null,
          desc: 'Platform UPI, 2FA & Health'
        },
      ]
    }
  ];

  return (
    <aside className="w-full lg:w-68 shrink-0 bg-white border border-slate-200/80 rounded-3xl p-3.5 shadow-xs flex flex-col gap-4 self-start">
      {navSections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-1">
          <div className="px-3 py-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {section.title}
            </p>
          </div>

          <nav className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (typeof window !== 'undefined') {
                      window.location.hash = item.id;
                      sessionStorage.setItem('admin_active_tab', item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`p-1.5 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </span>
                    <div className="truncate">
                      <p className="text-xs leading-none truncate">{item.label}</p>
                      <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ml-1.5 shrink-0 ${
                      isActive ? 'bg-white text-blue-700 border-white' : item.badge.color
                    }`}>
                      {item.badge.text}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Quick Platform Security Footnote */}
      <div className="mt-2 pt-3 border-t border-slate-100 px-3">
        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>NPCI Direct Rails v2.4</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
          Non-custodial 0% fee verification engine
        </p>
      </div>
    </aside>
  );
}
