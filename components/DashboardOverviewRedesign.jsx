'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, X, AlertCircle, Plus, ArrowRight, ShieldCheck,
  Landmark, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Info, Inbox, ChevronRight, BarChart2, Zap, CircleDollarSign, ExternalLink,
  QrCode, RefreshCw, ArrowUpRight, Shield, Activity, Building2, Copy, Check
} from 'lucide-react';
import { formatMerchantId } from '@/lib/merchantId';

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'verified' || s === 'success' || s === 'paid' || s === 'completed')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Verified
      </span>
    );
  if (s === 'pending' || s === 'processing' || s === 'in_progress')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Pending
      </span>
    );
  if (s === 'failed' || s === 'cancelled' || s === 'rejected' || s === 'declined')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Failed
      </span>
    );
  if (s === 'expired')
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
        Expired
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
      {status || '—'}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
const IST_TZ = 'Asia/Kolkata';
function toIST(dateStr) { return new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: IST_TZ })); }
function todayIST() { const d = toIST(new Date().toISOString()); d.setHours(0,0,0,0); return d; }
function yesterdayIST() { const d = todayIST(); d.setDate(d.getDate()-1); return d; }
function formatINR(n) { return `₹${Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
function formatINRSlim(n) { return `₹${Number(n).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0})}`; }
function isVerified(o) { const s=(o.status||'').toLowerCase(); return s==='verified'||s==='success'||s==='paid'||s==='completed'; }
function isPending(o)  { const s=(o.status||'').toLowerCase(); return s==='pending'||s==='processing'||s==='in_progress'; }
function isFailed(o)   { const s=(o.status||'').toLowerCase(); return s==='failed'||s==='cancelled'||s==='rejected'||s==='declined'; }
function isExpired(o)  { return (o.status||'').toLowerCase()==='expired'; }
function fmtTime(d) { if(!d) return ''; return new Date(d).toLocaleTimeString('en-IN',{timeZone:IST_TZ,hour:'2-digit',minute:'2-digit',hour12:true}); }
function fmtDate(d) {
  if(!d) return '';
  const orderDay = toIST(d); orderDay.setHours(0,0,0,0);
  const diff = Math.round((todayIST()-orderDay)/86400000);
  if(diff===0) return `Today, ${fmtTime(d)}`;
  if(diff===1) return `Yesterday, ${fmtTime(d)}`;
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:IST_TZ})+', '+fmtTime(d);
}

// ── Main Component ────────────────────────────────────────────────
export default function DashboardOverviewRedesign({
  profile, user, stats={}, orders=[], analyticsTimeframe=7,
  setAnalyticsTimeframe, setActiveTab, setSettingsCategory, onRefresh
}) {
  const [chartRange, setChartRange]       = useState('7d');
  const [successPeriod, setSuccessPeriod] = useState('today');
  const [copiedVpa, setCopiedVpa]         = useState(false);
  const [dismissedNotices, setDismissedNotices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mmp_dismissed_notices')||'[]'); } catch { return []; }
  });

  // Live IST clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-IN',{timeZone:IST_TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}));
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  }, []);

  const todayStart     = useMemo(()=>todayIST(),    []);
  const yesterdayStart = useMemo(()=>yesterdayIST(),[]);

  // Today collections
  const todayVerified     = useMemo(()=>orders.filter(o=>{ if(!isVerified(o))return false; const d=toIST(o.created_at||''); d.setHours(0,0,0,0); return d.getTime()===todayStart.getTime(); }),[orders,todayStart]);
  const yesterdayVerified = useMemo(()=>orders.filter(o=>{ if(!isVerified(o))return false; const d=toIST(o.created_at||''); d.setHours(0,0,0,0); return d.getTime()===yesterdayStart.getTime(); }),[orders,yesterdayStart]);
  const todayTotal     = useMemo(()=>todayVerified.reduce((s,o)=>s+(parseFloat(o.amount)||0),0),[todayVerified]);
  const yesterdayTotal = useMemo(()=>yesterdayVerified.reduce((s,o)=>s+(parseFloat(o.amount)||0),0),[yesterdayVerified]);
  const todayChange    = useMemo(()=>{ if(yesterdayTotal===0) return todayTotal>0?100:0; return (((todayTotal-yesterdayTotal)/yesterdayTotal)*100).toFixed(1); },[todayTotal,yesterdayTotal]);

  // Last 30-Day Collections
  const thirtyDayVerified = useMemo(()=>{
    const cutoff = Date.now() - 30 * 86400000;
    return orders.filter(o => isVerified(o) && new Date(o.created_at||0).getTime() >= cutoff);
  }, [orders]);
  const thirtyDayTotal = useMemo(()=>thirtyDayVerified.reduce((s,o)=>s+(parseFloat(o.amount)||0),0), [thirtyDayVerified]);

  // All-time collections
  const allTimeVerified = useMemo(()=>orders.filter(isVerified), [orders]);
  const allTimeTotal    = useMemo(()=>allTimeVerified.reduce((s,o)=>s+(parseFloat(o.amount)||0),0), [allTimeVerified]);

  // Success rate
  const periodOrders = useMemo(()=>{
    const now=Date.now();
    const cutoff = successPeriod==='today' ? todayStart.getTime() : successPeriod==='7d' ? now-7*86400000 : now-30*86400000;
    return orders.filter(o=>new Date(o.created_at||0).getTime()>=cutoff);
  },[orders,successPeriod,todayStart]);
  const periodVerifiedCount = useMemo(()=>periodOrders.filter(isVerified).length,[periodOrders]);
  const periodPendingCount  = useMemo(()=>periodOrders.filter(isPending).length, [periodOrders]);
  const periodFailedCount   = useMemo(()=>periodOrders.filter(isFailed).length,  [periodOrders]);
  const periodExpiredCount  = useMemo(()=>periodOrders.filter(isExpired).length,  [periodOrders]);
  const periodTotalCount    = periodOrders.length;
  const successRate = periodTotalCount>0 ? ((periodVerifiedCount/periodTotalCount)*100).toFixed(1) : '100.0';

  // Stale pending (>5 min)
  const stalePending = useMemo(()=>{
    const thr=Date.now()-5*60*1000;
    return orders.filter(o=>isPending(o)&&new Date(o.created_at||0).getTime()<thr).slice(0,5);
  },[orders]);

  // Chart data
  const chartData = useMemo(()=>{
    if(chartRange==='today'){
      const b=Array.from({length:24},(_,h)=>({label:`${h}:00`,value:0,count:0}));
      orders.forEach(o=>{
        if(!isVerified(o)) return;
        const d=toIST(o.created_at||'');
        const day=toIST(o.created_at||'');
        day.setHours(0,0,0,0);
        if(day.getTime()!==todayStart.getTime()) return;
        b[d.getHours()].value+=parseFloat(o.amount)||0;
        b[d.getHours()].count+=1;
      });
      return b;
    }
    const days=chartRange==='7d'?7:30;
    const b=Array.from({length:days},(_,i)=>{
      const d=new Date(todayStart.getTime()-(days-1-i)*86400000);
      return {label:d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:IST_TZ}),value:0,count:0,day:d.getTime()};
    });
    orders.forEach(o=>{
      if(!isVerified(o)) return;
      const d=toIST(o.created_at||'');
      d.setHours(0,0,0,0);
      const bk=b.find(x=>x.day===d.getTime());
      if(bk) {
        bk.value+=parseFloat(o.amount)||0;
        bk.count+=1;
      }
    });
    return b;
  },[orders,chartRange,todayStart]);
  const chartMax=Math.max(...chartData.map(d=>d.value),1);

  // Recent 8 orders
  const recentOrders=useMemo(()=>[...orders].slice(0,8),[orders]);

  // Notices
  const notices=useMemo(()=>{
    const list=[];
    if(!profile?.gstin&&!profile?.kyc_verified&&!profile?.is_verified)
      list.push({id:'kyc',type:'warning',title:'KYC Verification Pending',message:'Submit your business documents to unlock unrestricted volume and enterprise features.',action:{label:'Complete KYC',onClick:()=>{setSettingsCategory?.('business');setActiveTab?.('settings');}}});
    if(profile?.subscription_expires_at){
      const exp=new Date(profile.subscription_expires_at);
      const dl=Math.ceil((exp.getTime()-Date.now())/86400000);
      if(dl>0&&dl<=7) list.push({id:'expiry',type:'warning',title:`Flat Subscription Renews in ${dl} day${dl!==1?'s':''}`,message:`Your 0% MDR flat plan renewal date is ${exp.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}.`,action:{label:'Manage Plan',onClick:()=>setActiveTab?.('subscription')}});
      if(dl<=0) list.push({id:'expired',type:'error',title:'Subscription Inactive',message:'Your flat-fee platform plan has lapsed. Renew to keep customer checkout live.',action:{label:'Renew Now',onClick:()=>setActiveTab?.('subscription')}});
    }
    if(!profile?.upi_id||profile?.upi_id==='pending@upi')
      list.push({id:'upi',type:'info',title:'Direct Receiving VPA Required',message:'Configure your primary merchant UPI ID so customer payments deposit directly into your bank.',action:{label:'Configure UPI',onClick:()=>{setSettingsCategory?.('banking');setActiveTab?.('settings');}}});
    if(stalePending.length>=3)
      list.push({id:'stale',type:'warning',title:`${stalePending.length} Payments Awaiting Reconciliation`,message:'Multiple payments have been pending for over 5 minutes. Check auto-verification queue.',action:{label:'Open Verification Desk',onClick:()=>setActiveTab?.('verification')}});
    return list.filter(n=>!dismissedNotices.includes(n.id));
  },[profile,stalePending,dismissedNotices,setActiveTab,setSettingsCategory]);

  const dismissNotice=(id)=>{ const next=[...dismissedNotices,id]; setDismissedNotices(next); try{localStorage.setItem('mmp_dismissed_notices',JSON.stringify(next));}catch{} };

  // Active Bank
  const activeBankAccount=useMemo(()=>{
    if(typeof window!=='undefined'&&user?.id){
      try{ const s=JSON.parse(localStorage.getItem(`mymobpay_bank_accounts_${user.id}`)||'null'); if(Array.isArray(s)&&s.length>0){const p=s.find(a=>a.is_primary)||s[0]; if(p?.bank_account_number||p?.bank_name)return p;} }catch{}
    }
    if(profile?.bank_account_number&&profile?.bank_name) return {bank_name:profile.bank_name,bank_account_number:profile.bank_account_number,bank_ifsc:profile.bank_ifsc||''};
    return null;
  },[user?.id,profile]);

  const navigateToBankSettings=()=>{ setSettingsCategory?.('banking'); setActiveTab?.('settings'); };

  const copyVpa = () => {
    const vpa = profile?.upi_id || 'merchant@upi';
    navigator.clipboard?.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const businessTitle = profile?.business_name || profile?.company_name || 'Merchant';

  return (
    <div className="w-full space-y-6 font-sans antialiased text-slate-800">

      {/* ── TOP HEADER / GREETING BAR ───────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live NPCI Direct Inflow
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-700 font-semibold">{businessTitle}</strong>. Real-time direct UPI inflow and settlement telemetry.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab?.('payment-links')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Payment Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('payment-links')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Counter Standee QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('reports')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-slate-500" />
            <span>Reports & GST</span>
          </button>
        </div>
      </div>

      {/* ── DIRECT BANK SETTLEMENT TRUST BANNER ──────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/90 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Direct UPI Settlement
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200/80">
                0% Escrow Hold
              </span>
            </div>
            <p className="text-xs text-emerald-800/90 mt-0.5 truncate">
              Payments credit directly to your UPI ID without escrow delay. Zero per-transaction fees.
            </p>
          </div>
        </div>

        {/* Bank Account Pill */}
        {activeBankAccount && (
          <button
            type="button"
            onClick={navigateToBankSettings}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Click to view Bank Settings"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activeBankAccount.bank_name} •••• {activeBankAccount.bank_account_number?.slice(-4)}</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        )}
      </div>

      {/* ── OPERATIONAL NOTICES ─────────────────────────────────── */}
      {notices.length > 0 && (
        <div className="space-y-2.5">
          {notices.map(n => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 px-4 py-3 border rounded-xl relative transition-all ${
                n.type === 'error'
                  ? 'bg-red-50/80 border-red-200 text-red-900'
                  : n.type === 'warning'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {n.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : n.type === 'warning' ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold block">{n.title}</span>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  {n.action && (
                    <button
                      type="button"
                      onClick={n.action.onClick}
                      className="mt-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer inline-flex items-center gap-1 hover:underline"
                    >
                      {n.action.label} →
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissNotice(n.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-white/60 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 4 BALANCED KPI METRIC CARDS ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

        {/* Card 1: Today's Received Inflow */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-blue-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Today Collections
            </span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              parseFloat(todayChange) > 0 ? 'bg-emerald-50 text-emerald-700' : parseFloat(todayChange) < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {parseFloat(todayChange) > 0 ? <TrendingUp className="w-3 h-3" /> : parseFloat(todayChange) < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(parseFloat(todayChange))}% vs T-1
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block truncate">
              {formatINR(todayTotal)}
            </span>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{todayVerified.length} verified order{todayVerified.length !== 1 ? 's' : ''}</span>
              <span className="text-slate-400">Yday: {formatINRSlim(yesterdayTotal)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: 30-Day Collections */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-emerald-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Last 30 Days
            </span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <CircleDollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block truncate">
              {formatINR(thirtyDayTotal)}
            </span>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{thirtyDayVerified.length} orders settled</span>
              <span className="text-emerald-600 font-bold">100% Direct</span>
            </div>
          </div>
        </div>

        {/* Card 3: Real-Time Success Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-bold">
              {['today', '7d', '30d'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSuccessPeriod(p)}
                  className={`px-2 py-0.5 transition-colors cursor-pointer ${
                    successPeriod === p ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p === 'today' ? 'Today' : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
                {successRate}%
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {periodVerifiedCount} paid of {periodTotalCount} attempts
              </p>
            </div>
            {/* Circular Mini Gauge */}
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={parseFloat(successRate) >= 80 ? '#10b981' : parseFloat(successRate) >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3.2"
                  strokeDasharray={`${successRate} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                UPI
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Lifetime Inflow & Transactions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-purple-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              All-Time Volume
            </span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block truncate">
              {formatINR(allTimeTotal)}
            </span>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{orders.length} total attempts</span>
              <button
                type="button"
                onClick={() => setActiveTab?.('transactions')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Ledger →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── ACTION NEEDED: PENDING CONFIRMATIONS RIBBON ───────────── */}
      {stalePending.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/30 border border-amber-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-3 border-b border-amber-200/60 bg-amber-100/40">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                {stalePending.length} Payment{stalePending.length !== 1 ? 's' : ''} Awaiting Reconciliation (&gt;5m)
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Action Recommended
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab?.('verification')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
            >
              Open Verification Desk →
            </button>
          </div>
          <div className="divide-y divide-amber-200/50">
            {stalePending.map(o => {
              const ageMin = Math.floor((Date.now() - new Date(o.created_at || 0).getTime()) / 60000);
              return (
                <div key={o.id} className="flex items-center justify-between px-5 py-3 gap-4 hover:bg-amber-100/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">{o.id?.slice(0, 18)}</span>
                      <span className="text-[11px] text-amber-700 font-semibold">({ageMin}m ago)</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {o.customer_name || 'Customer'} · <span className="font-bold tabular-nums text-slate-800">{formatINR(o.amount || 0)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab?.('verification')}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    Match & Verify
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2-COLUMN SECTION: REVENUE VELOCITY CHART + LIVE DIRECT RAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left (2 cols): Collection Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Collection Velocity Trend</h3>
                <p className="text-[11px] text-slate-500">Verified direct bank payments (IST)</p>
              </div>
            </div>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold self-start sm:self-auto">
              {[
                { key: 'today', label: 'Today (24h)' },
                { key: '7d', label: '7 Days' },
                { key: '30d', label: '30 Days' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChartRange(key)}
                  className={`px-3 py-1.5 cursor-pointer transition-colors ${
                    chartRange === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="p-6">
            {chartData.every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
                <Inbox className="w-9 h-9 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">No verified payments in this timeframe</p>
                <button
                  type="button"
                  onClick={() => setActiveTab?.('payment-links')}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  Send a payment link
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-1 sm:gap-2 h-36 w-full pt-4">
                  {chartData.map((d, i) => {
                    const pct = chartMax > 0 ? (d.value / chartMax) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      >
                        <div
                          className="w-full rounded-t-md bg-blue-600 group-hover:bg-blue-700 transition-all duration-150 min-h-[4px] cursor-pointer"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-slate-900 text-white text-[10px] font-medium py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                            <span className="font-bold">{d.label}</span>: {formatINR(d.value)} ({d.count} orders)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 border-t border-slate-100 pt-2 px-1">
                  <span>{chartData[0]?.label}</span>
                  {chartData.length > 4 && <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>}
                  <span>{chartData[chartData.length - 1]?.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Chart Footer summary */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Window Total: <strong className="text-slate-900 tabular-nums">{formatINR(chartData.reduce((s, d) => s + d.value, 0))}</strong>
            </span>
            <span className="text-slate-500 text-[11px]">
              {chartData.filter(d => d.value > 0).length} active collection periods
            </span>
          </div>
        </div>

        {/* Right (1 col): Live Direct Rails Telemetry */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Direct Settlement Rails</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                T+0 Direct
              </span>
            </div>

            {/* Merchant VPA routing block */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Primary Receiving VPA
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {profile?.upi_id || 'merchant@upi'}
                </span>
                <button
                  type="button"
                  onClick={copyVpa}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer shrink-0"
                  title="Copy VPA"
                >
                  {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Funds deposit directly into {activeBankAccount?.bank_name || 'your linked bank account'}.
              </p>
            </div>

            {/* Bank switch health status */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                National UPI Network Switches
              </span>
              <div className="space-y-1.5 text-xs">
                {[
                  { name: 'HDFC Bank Switch', uptime: '99.99%', status: 'Operational' },
                  { name: 'SBI UPI Switch', uptime: '99.95%', status: 'Operational' },
                  { name: 'ICICI Bank Gateway', uptime: '100%', status: 'Operational' },
                  { name: 'NPCI Central Switch', uptime: '99.98%', status: 'Operational' },
                ].map(sw => (
                  <div key={sw.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 border border-slate-100 text-[11px]">
                    <span className="text-slate-700 font-medium">{sw.name}</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {sw.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab?.('settings')}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
          >
            Manage Banking & VPAs →
          </button>
        </div>

      </div>

      {/* ── RECENT 8 TRANSACTIONS AUDIT ──────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Inflow Ledger</h3>
              <p className="text-[11px] text-slate-500">Direct customer transactions and auto-reconciliation statuses</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">IST {currentTime}</span>
            <button
              type="button"
              onClick={() => setActiveTab?.('transactions')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              View all transactions <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Transaction ID / UTR</th>
                <th className="py-3 px-4">Payer / Customer</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-6 text-right">Settled Amount</th>
                <th className="py-3 px-6 text-center">Desk Status</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentOrders.length > 0 ? (
                recentOrders.map((o, i) => (
                  <tr
                    key={o.id || i}
                    onClick={() => setActiveTab?.('transactions')}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-6">
                      <p className="font-mono font-bold text-slate-900 truncate max-w-[170px]" title={o.id}>
                        {o.id?.slice(0, 16)}…
                      </p>
                      {o.utr && <p className="text-[11px] text-slate-500 mt-0.5">UTR: {o.utr}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-semibold truncate max-w-[140px] block">
                        {o.customer_name || o.customer_phone || 'Direct Customer'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {fmtDate(o.created_at)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="font-extrabold tabular-nums text-slate-900 text-sm">
                        {formatINR(o.amount || 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No transactions recorded yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Direct customer payments will populate here in real-time.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab?.('payment-links')}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Generate Payment Link
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Feed */}
        <div className="sm:hidden divide-y divide-slate-100">
          {recentOrders.length > 0 ? (
            recentOrders.slice(0, 5).map((o, i) => (
              <div
                key={o.id || i}
                onClick={() => setActiveTab?.('transactions')}
                className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
              >
                <div>
                  <span className="font-extrabold tabular-nums text-slate-900 text-sm block">
                    {formatINR(o.amount || 0)}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">
                    {o.customer_name || 'Customer'} · {fmtTime(o.created_at)}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No transactions recorded yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing {Math.min(recentOrders.length, 8)} of {orders.length} transactions
          </span>
          <button
            type="button"
            onClick={() => setActiveTab?.('transactions')}
            className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            Full Ledger <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}