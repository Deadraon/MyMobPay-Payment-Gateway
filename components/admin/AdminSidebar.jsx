'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Store, 
  UserCheck, 
  ShieldCheck,
  History,
  Users,
  Radio,
  FileCheck2,
  ShieldAlert,
  Terminal,
  BarChart3,
  LogIn,
  Mail,
  Layers,
  Shield,
  LogOut,
  X,
  Menu
} from 'lucide-react';

const MyMobPayLogo = ({ className = 'w-44 lg:w-48 h-auto', textColor = '#FFFFFF' }) => (
  <svg 
    viewBox="0 0 220 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className} transition-transform duration-300 hover:scale-[1.02]`}
  >
    {/* 3D Ribbon M Mark */}
    <image
      href="/logos/mymobpay_mark.png"
      x="2"
      y="2"
      width="38"
      height="36"
      preserveAspectRatio="xMidYMid meet"
    />
    <text
      x="44"
      y="27"
      fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="800"
      fontSize="26"
      fill={textColor}
      letterSpacing="-0.5"
    >
      MyMobPay
    </text>
  </svg>
);

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  pendingOrdersCount = 0,
  unonboardedSignupsCount = 0,
  activeMerchantsCount = 0,
  onBackToMerchant,
  onLogout,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen
}) {
  const navSections = [
    {
      title: 'Main',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'transactions',
          label: 'Transactions',
          icon: CreditCard,
          badge: pendingOrdersCount > 0 ? { 
            text: pendingOrdersCount, 
            color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
          } : null
        },
        {
          id: 'merchants',
          label: 'Merchants',
          icon: Store,
          badge: activeMerchantsCount > 0 ? { 
            text: activeMerchantsCount, 
            color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
          } : null
        }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'signups',
          label: 'Onboarding',
          icon: UserCheck,
          badge: unonboardedSignupsCount > 0 ? { 
            text: unonboardedSignupsCount, 
            color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
          } : null
        },
        {
          id: 'verification',
          label: 'Verification',
          icon: ShieldCheck,
          badge: null
        },
        {
          id: 'logins',
          label: 'Live Logins',
          icon: LogIn,
          badge: { 
            text: 'Live', 
            color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
          }
        },
        {
          id: 'emails',
          label: 'Outreach & Email',
          icon: Mail,
          badge: { 
            text: 'New', 
            color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
          }
        }
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        {
          id: 'reports',
          label: 'Reports & GST',
          icon: BarChart3,
          badge: null
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: History,
          badge: null
        }
      ]
    },
    {
      title: 'Platform SaaS',
      adminBadge: 'Admin',
      items: [
        {
          id: 'subscriptions',
          label: 'SaaS Subscriptions',
          icon: Layers,
          badge: null
        },
        {
          id: 'disputes',
          label: 'Claims & Disputes',
          icon: FileCheck2,
          badge: null
        },
        {
          id: 'risk',
          label: 'Risk & Rules',
          icon: ShieldAlert,
          badge: null
        }
      ]
    },
    {
      title: 'Others',
      items: [
        {
          id: 'developer',
          label: 'Developer Hub',
          icon: Terminal,
          badge: null
        },
        {
          id: 'team',
          label: 'Admin Team & RBAC',
          icon: Users,
          badge: null
        },
        {
          id: 'system',
          label: 'System & Security',
          icon: Shield,
          badge: null
        }
      ]
    }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.location.hash = tabId;
      sessionStorage.setItem('admin_active_tab', tabId);
    }
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const renderNavContent = () => (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Logo & Brand */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <MyMobPayLogo 
            className="w-44 lg:w-48 h-auto transition-transform hover:scale-[1.02]" 
            textColor="#FFFFFF" 
          />
          {setIsMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              type="button"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links with Identical Styling */}
        <nav className="flex-1 px-4 py-1 space-y-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Quick Return to Merchant Dashboard Switcher */}
          {onBackToMerchant && (
            <>
              <button
                onClick={() => {
                  onBackToMerchant();
                  if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all border font-bold cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs border-transparent group mb-2"
                title="Switch back to Merchant Dashboard"
              >
                <Store className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span className="flex-1 text-left font-black tracking-wide text-[11px] truncate">
                  Merchant Dashboard
                </span>
                <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 transition-colors">
                  Switch
                </span>
              </button>
              <div className="h-px bg-slate-800 my-2" />
            </>
          )}

          {/* Dynamic Navigation Sections */}
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className={section.adminBadge ? 'text-indigo-400' : ''}>{section.title}</span>
                {section.adminBadge && (
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 py-0.5 rounded font-mono font-bold">
                    {section.adminBadge}
                  </span>
                )}
              </p>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    type="button"
                    className={`t-sidebar-nav-item ${isActive ? 'is-active' : ''} justify-between`}
                  >
                    <span className="t-sidebar-indicator" />
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 t-sidebar-icon" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${item.badge.color}`}>
                        {item.badge.text}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer (Identical to Merchant Dashboard Sidebar) */}
      <div className="px-6 pb-6 pt-3 border-t border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-medium" style={{ color: '#ffffff' }}>API Live Rails</span>
          </div>
          <span className="text-[11px] font-mono text-slate-200 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md">
            v2.1
          </span>
        </div>
        <button
          onClick={() => {
            if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            if (onLogout) onLogout();
          }}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (Identical Fixed Navy Menubar Panel)
          ═══════════════════════════════════════════════════════════ */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0F172A] border-r border-slate-800 z-50 hidden md:flex flex-col justify-between shadow-[4px_0_24px_0_rgba(0,0,0,0.25)] select-none text-slate-100">
        {renderNavContent()}
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE NAVIGATION DRAWER (Slide-Out Responsive Menubar)
          ═══════════════════════════════════════════════════════════ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0F172A] border-r border-slate-800 z-50 flex flex-col justify-between shadow-2xl select-none text-slate-100 transition-transform duration-200 ease-out">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
