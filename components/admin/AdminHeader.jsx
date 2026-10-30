'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  LogOut, 
  Bell, 
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';

export default function AdminHeader({ 
  user, 
  profile, 
  onBackToMerchant, 
  onLogout,
  onRefresh,
  loading = false,
  globalSearch = '',
  setGlobalSearch,
  totalPendingOrders = 0,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] h-14 sm:h-16 md:h-20 flex items-center justify-between px-3 sm:px-6 lg:px-8">
      
      {/* Left: Mobile Toggle & Mobile Logo / Desktop Admin Badge */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          type="button"
          title="Toggle Navigation Menu"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Brand Logo */}
        <div className="md:hidden flex items-center shrink-0">
          <MyMobPayLogo className="w-28 sm:w-32 h-auto" textColor="#0c2340" />
        </div>

        {/* Desktop Super Admin Console Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/60 text-blue-900 text-xs font-bold tracking-tight shrink-0">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Super Admin Console</span>
          <span className="text-[9px] bg-blue-600 text-white font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
            ROOT
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-3 hidden md:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by UTR, Order ID, Phone, Merchant or Email..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 font-medium transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-xs"
          />
          {globalSearch && (
            <button 
              onClick={() => setGlobalSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Operational Health Pill, Refresh, Notification Bell & Exit */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Rails Active</span>
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          title="Refresh database records"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>

        {/* Admin Operations Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              isNotifOpen
                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 bg-white'
            }`}
            title="Admin Notifications & Activity"
            type="button"
          >
            <Bell className="w-4 h-4" />
            {totalPendingOrders > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {totalPendingOrders > 99 ? '99+' : totalPendingOrders}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div 
                className="fixed inset-0 z-[90] bg-transparent" 
                onClick={() => setIsNotifOpen(false)} 
              />
              <div 
                className="absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[460px] animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Ops Alerts &amp; Queue</span>
                    {totalPendingOrders > 0 && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                        {totalPendingOrders} pending
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsNotifOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-72">
                  {totalPendingOrders > 0 ? (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-2 text-xs text-amber-900">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>{totalPendingOrders} Unmatched Pending Checkouts</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1">
                        Orders are awaiting customer UTR or bank confirmation.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <span>All transaction queues reconciled. No pending disputes or alerts.</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">Live Master Rails Active</span>
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      window.location.hash = 'transactions';
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs"
                  >
                    View Ledger &rarr;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Exit to Merchant Portal */}
        {onBackToMerchant && (
          <button
            onClick={onBackToMerchant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 text-xs font-bold transition-all cursor-pointer"
            title="Return to standard merchant dashboard view"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Merchant View</span>
          </button>
        )}

        {/* Admin Signout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
          title="Lock & Exit Admin Console"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>

    </header>
  );
}
