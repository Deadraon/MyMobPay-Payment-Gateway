'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  LogOut, 
  SlidersHorizontal,
  Bell,
  Activity,
  CheckCircle2,
  ExternalLink
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
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Role Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <MyMobPayLogo markSize={30} className="hover:opacity-95" />
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold tracking-tight shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Master Console</span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
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

        {/* Right: Operational Health Pill, Refresh, Exit & Logout */}
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

      </div>
    </header>
  );
}
