'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, X, AlertCircle, Plus, ArrowRight, ShieldCheck,
  Landmark, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Info, Inbox, ChevronRight, BarChart2, Zap, CircleDollarSign, ExternalLink,
} from 'lucide-react';
import { formatMerchantId } from '@/lib/merchantId';

// ── Status badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'verified' || s === 'success' || s === 'paid' || s === 'completed')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>;
  if (s === 'pending' || s === 'processing' || s === 'in_progress')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
  if (s === 'failed' || s === 'cancelled' || s === 'rejected' || s === 'declined')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Failed</span>;
  if (s === 'expired')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Expired</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{status || '—'}</span>;
}

// ── Helpers ───────────────────────────────────────────────────────
const IST_TZ = 'Asia/Kolkata';
function toIST(dateStr) { return new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: IST_TZ })); }
function todayIST() { const d = toIST(new Date().toISOString()); d.setHours(0,0,0,0); return d; }
function yesterdayIST() { const d = todayIST(); d.setDate(d.getDate()-1); return d; }
function formatINR(n) { return `\u20b9${Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
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
  setAnalyticsTimeframe, setActiveTab, setSettingsCategory,
}) {
  const [chartRange, setChartRange]       = useState('7d');
  const [successPeriod, setSuccessPeriod] = useState('today');
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
  const successRate = periodTotalCount>0 ? ((periodVerifiedCount/periodTotalCount)*100).toFixed(1) : '0.0';

  // Stale pending (>5 min)
  const stalePending = useMemo(()=>{
    const thr=Date.now()-5*60*1000;
    return orders.filter(o=>isPending(o)&&new Date(o.created_at||0).getTime()<thr).slice(0,5);
  },[orders]);

  // Chart data
  const chartData = useMemo(()=>{
    if(chartRange==='today'){
      const b=Array.from({length:24},(_,h)=>({label:`${h}h`,value:0}));
      orders.forEach(o=>{ if(!isVerified(o))return; const d=toIST(o.created_at||''); const day=toIST(o.created_at||''); day.setHours(0,0,0,0); if(day.getTime()!==todayStart.getTime())return; b[d.getHours()].value+=parseFloat(o.amount)||0; });
      return b;
    }
    const days=chartRange==='7d'?7:30;
    const b=Array.from({length:days},(_,i)=>{ const d=new Date(todayStart.getTime()-(days-1-i)*86400000); return {label:d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:IST_TZ}),value:0,day:d.getTime()}; });
    orders.forEach(o=>{ if(!isVerified(o))return; const d=toIST(o.created_at||''); d.setHours(0,0,0,0); const bk=b.find(x=>x.day===d.getTime()); if(bk)bk.value+=parseFloat(o.amount)||0; });
    return b;
  },[orders,chartRange,todayStart]);
  const chartMax=Math.max(...chartData.map(d=>d.value),1);

  // Recent 10
  const recentOrders=useMemo(()=>[...orders].slice(0,10),[orders]);

  // Notices
  const notices=useMemo(()=>{
    const list=[];
    if(!profile?.gstin&&!profile?.kyc_verified&&!profile?.is_verified)
      list.push({id:'kyc',type:'warning',title:'KYC Incomplete',message:'Submit your PAN/GST/ID documents to unlock higher limits and full verification.',action:{label:'Complete KYC \u2192',onClick:()=>{setSettingsCategory?.('business');setActiveTab?.('settings');}}});
    if(profile?.subscription_expires_at){
      const exp=new Date(profile.subscription_expires_at);
      const dl=Math.ceil((exp.getTime()-Date.now())/86400000);
      if(dl>0&&dl<=7) list.push({id:'expiry',type:'warning',title:`Subscription expires in ${dl} day${dl!==1?'s':''}`,message:`Renew before ${exp.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} to avoid interruption.`,action:{label:'Renew Plan \u2192',onClick:()=>setActiveTab?.('subscription')}});
      if(dl<=0) list.push({id:'expired',type:'error',title:'Subscription Expired',message:'Your plan has expired. Live payments are paused until you renew.',action:{label:'Renew Now \u2192',onClick:()=>setActiveTab?.('subscription')}});
    }
    if(!profile?.upi_id||profile?.upi_id==='pending@upi')
      list.push({id:'upi',type:'info',title:'UPI ID Not Configured',message:'Add your UPI VPA so customers can pay directly into your account.',action:{label:'Add UPI ID \u2192',onClick:()=>{setSettingsCategory?.('banking');setActiveTab?.('settings');}}});
    if(stalePending.length>=3)
      list.push({id:'stale',type:'warning',title:`${stalePending.length} Payments Awaiting Confirmation`,message:'Multiple payments pending verification >5 min. Check your verification setup.',action:{label:'View Pending \u2192',onClick:()=>setActiveTab?.('transactions')}});
    return list.filter(n=>!dismissedNotices.includes(n.id));
  },[profile,stalePending,dismissedNotices,setActiveTab,setSettingsCategory]);

  const dismissNotice=(id)=>{ const next=[...dismissedNotices,id]; setDismissedNotices(next); try{localStorage.setItem('mmp_dismissed_notices',JSON.stringify(next));}catch{} };

  // Bank helper
  const activeBankAccount=useMemo(()=>{
    if(typeof window!=='undefined'&&user?.id){
      try{ const s=JSON.parse(localStorage.getItem(`mymobpay_bank_accounts_${user.id}`)||'null'); if(Array.isArray(s)&&s.length>0){const p=s.find(a=>a.is_primary)||s[0]; if(p?.bank_account_number||p?.bank_name)return p;} }catch{}
    }
    if(profile?.bank_account_number&&profile?.bank_name) return {bank_name:profile.bank_name,bank_account_number:profile.bank_account_number,bank_ifsc:profile.bank_ifsc||''};
    return null;
  },[user?.id,profile]);

  const navigateToBankSettings=()=>{ setSettingsCategory?.('banking'); setActiveTab?.('settings'); };

  const noticeIcon=(t)=> t==='error'?<AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>:t==='warning'?<AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>:<Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/>;
  const noticeBg=(t)=> t==='error'?'bg-red-50 border-red-200':t==='warning'?'bg-amber-50 border-amber-200':'bg-blue-50 border-blue-200';

  return (
    <div className="w-full space-y-6 font-sans antialiased text-[#0f141a]">

      {/* TRUST BANNER */}
      <div className="flex items-center gap-3.5 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-950">Payments go directly to your UPI account</p>
          <p className="text-xs text-emerald-700 font-medium mt-0.5 leading-relaxed">MyMobPay never holds or pools your money. Every payment settles instantly via NPCI UPI. Flat subscription — zero per-transaction fees.</p>
        </div>
        {activeBankAccount&&(
          <button type="button" onClick={navigateToBankSettings} className="shrink-0 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer hidden sm:block">
            {activeBankAccount.bank_name} •••• {activeBankAccount.bank_account_number?.slice(-4)}
          </button>
        )}
      </div>

      {/* NOTICES */}
      {notices.length>0&&(
        <div className="space-y-3">
          {notices.map(n=>(
            <div key={n.id} className={`flex items-start gap-3.5 px-5 py-4 border rounded-2xl ${noticeBg(n.type)} relative pr-10`}>
              {noticeIcon(n.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                {n.action&&<button type="button" onClick={n.action.onClick} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer inline-flex items-center gap-1">{n.action.label}</button>}
              </div>
              <button type="button" onClick={()=>dismissNotice(n.id)} className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 cursor-pointer" aria-label="Dismiss"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      )}

      {/* TOP ROW — Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Today's collections */}
        <div className="xl:col-span-2 bg-[#0c2340] text-white rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Received in your account — Today</p>
              <p className="text-3xl sm:text-4xl font-extrabold mt-2 font-mono tracking-tight text-white">{formatINR(todayTotal)}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 mt-1 ${parseFloat(todayChange)>0?'bg-emerald-500/20 text-emerald-300':parseFloat(todayChange)<0?'bg-red-500/20 text-red-300':'bg-white/10 text-slate-300'}`}>
              {parseFloat(todayChange)>0?<TrendingUp className="w-3.5 h-3.5"/>:parseFloat(todayChange)<0?<TrendingDown className="w-3.5 h-3.5"/>:<Minus className="w-3.5 h-3.5"/>}
              {Math.abs(parseFloat(todayChange))}% vs yesterday
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-blue-100 font-medium pt-3.5 border-t border-white/15">
            <span>{todayVerified.length} payment{todayVerified.length!==1?'s':''} verified today</span>
            <span>Yesterday: {formatINR(yesterdayTotal)}</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-400/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"/>
        </div>

        {/* Success rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Success Rate</p>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
              {['today','7d','30d'].map(p=>(
                <button key={p} type="button" onClick={()=>setSuccessPeriod(p)} className={`px-2.5 py-1 cursor-pointer transition-colors ${successPeriod===p?'bg-[#0c2340] text-white':'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {p==='today'?'Today':p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3.2"/>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke={parseFloat(successRate)>=80?'#059669':parseFloat(successRate)>=50?'#f59e0b':'#ef4444'} strokeWidth="3.2" strokeDasharray={`${successRate} 100`} strokeLinecap="round"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-900">{successRate}%</span>
            </div>
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Verified</span><span className="font-bold text-slate-900">{periodVerifiedCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>Pending</span><span className="font-bold text-slate-900">{periodPendingCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Failed</span><span className="font-bold text-slate-900">{periodFailedCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block"/>Expired</span><span className="font-bold text-slate-900">{periodExpiredCount}</span></div>
            </div>
          </div>
        </div>

        {/* All-time count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">All Time</p>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono mt-2">{orders.length}</p>
            <p className="text-sm text-slate-500 mt-1">Total payment attempts</p>
          </div>
          <button type="button" onClick={()=>setActiveTab?.('transactions')} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
            View all transactions <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* PENDING CONFIRMATIONS WIDGET */}
      {stalePending.length>0&&(
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-200/60 bg-amber-100/50">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-700"/>
              <span className="text-sm font-bold text-amber-950">{stalePending.length} Payment{stalePending.length!==1?'s':''} Awaiting Confirmation</span>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Action needed</span>
            </div>
            <button type="button" onClick={()=>setActiveTab?.('transactions')} className="text-xs font-bold text-amber-800 hover:text-amber-950 cursor-pointer">View all →</button>
          </div>
          <div className="divide-y divide-amber-200/50">
            {stalePending.map(o=>{
              const ageMin=Math.floor((Date.now()-new Date(o.created_at||0).getTime())/60000);
              return (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 font-mono">{o.id?.slice(0,16)}…</span>
                      <span className="text-xs text-amber-700 font-semibold">{ageMin}m ago</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-1">{o.customer_name||'Customer'} · {formatINR(o.amount||0)}</p>
                  </div>
                  <button type="button" onClick={()=>setActiveTab?.('transactions')} className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">Review</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REVENUE CHART */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-5 h-5 text-[#0c2340]"/>
            <h3 className="text-base font-bold text-slate-900">Collection Trend</h3>
            <span className="text-xs text-slate-400 font-medium">(Verified payments only)</span>
          </div>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
            {[{key:'today',label:'Today'},{key:'7d',label:'7 Days'},{key:'30d',label:'30 Days'}].map(({key,label})=>(
              <button key={key} type="button" onClick={()=>setChartRange(key)} className={`px-3.5 py-1.5 cursor-pointer transition-colors ${chartRange===key?'bg-[#0c2340] text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {chartData.every(d=>d.value===0)?(
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
              <Inbox className="w-9 h-9 text-slate-300"/>
              <p className="text-sm font-medium text-slate-500">No verified payments in this period</p>
            </div>
          ):(
            <>
              <div className="flex items-end gap-[3px] h-32 w-full">
                {chartData.map((d,i)=>{
                  const pct=chartMax>0?(d.value/chartMax)*100:0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative" title={`${d.label}: ${formatINR(d.value)}`}>
                      <div className="w-full rounded-t-sm bg-[#0c2340] hover:bg-blue-600 transition-colors duration-150 min-h-[3px] cursor-pointer" style={{height:`${Math.max(pct,2)}%`}}/>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                <span>{chartData[0]?.label}</span>
                {chartData.length>4&&<span>{chartData[Math.floor(chartData.length/2)]?.label}</span>}
                <span>{chartData[chartData.length-1]?.label}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                <span className="text-slate-600">Total Collections: <span className="font-bold text-slate-900">{formatINR(chartData.reduce((s,d)=>s+d.value,0))}</span></span>
                <span className="text-slate-500 font-medium">{chartData.filter(d=>d.value>0).length} active {chartRange==='today'?'hours':'days'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RECENT 10 TRANSACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[#0c2340]"/>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">Last 10</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 hidden sm:block">IST {currentTime}</span>
            <button type="button" onClick={()=>setActiveTab?.('transactions')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
              View all <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Order / UTR</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.length>0?recentOrders.map((o,i)=>(
                <tr key={o.id||i} className="hover:bg-blue-50/40 transition-colors cursor-pointer group" onClick={()=>setActiveTab?.('transactions')}>
                  <td className="py-3.5 px-5">
                    <p className="font-mono font-medium text-slate-900 truncate max-w-[160px]" title={o.id}>{o.id?.slice(0,14)}…</p>
                    {o.utr&&<p className="text-xs text-slate-400 font-mono mt-0.5">UTR: {o.utr}</p>}
                  </td>
                  <td className="py-3.5 px-4"><span className="text-slate-800 font-medium truncate max-w-[130px] block">{o.customer_name||o.customer_phone||'Customer'}</span></td>
                  <td className="py-3.5 px-4"><span className="text-slate-500 text-xs whitespace-nowrap">{fmtDate(o.created_at)}</span></td>
                  <td className="py-3.5 px-4 text-right"><span className="font-bold font-mono text-slate-900">{formatINR(o.amount||0)}</span></td>
                  <td className="py-3.5 px-5 text-center"><StatusBadge status={o.status}/></td>
                  <td className="py-3.5 px-4 text-center"><ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors"/></td>
                </tr>
              )):(
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2.5"/>
                    <p className="text-sm font-semibold text-slate-600">No transactions yet</p>
                    <p className="text-xs text-slate-400 mt-1">Incoming payments will appear here in real-time.</p>
                    <button type="button" onClick={()=>setActiveTab?.('payment-links')} className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c2340] hover:bg-blue-900 text-white text-xs font-bold cursor-pointer shadow-xs">
                      <Plus className="w-4 h-4"/> Create First Payment
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {recentOrders.length>0?recentOrders.slice(0,6).map((o,i)=>(
            <div key={o.id||i} onClick={()=>setActiveTab?.('transactions')} className="flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50/40 cursor-pointer">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isVerified(o)?'bg-emerald-100 text-emerald-600':isPending(o)?'bg-amber-100 text-amber-600':'bg-red-100 text-red-500'}`}>
                <CircleDollarSign className="w-5 h-5"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{formatINR(o.amount||0)}</span>
                  <StatusBadge status={o.status}/>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs text-slate-600 truncate">{o.customer_name||'Customer'}</span>
                  <span className="text-xs text-slate-400 font-mono shrink-0">{fmtTime(o.created_at)}</span>
                </div>
              </div>
            </div>
          )):(
            <div className="py-10 text-center">
              <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2"/>
              <p className="text-sm font-medium text-slate-500">No transactions yet</p>
            </div>
          )}
          {recentOrders.length>6&&(
            <div className="p-3 bg-slate-50">
              <button type="button" onClick={()=>setActiveTab?.('transactions')} className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                View All {orders.length} Transactions <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Showing {Math.min(recentOrders.length,10)} of {orders.length} transactions</span>
          <button type="button" onClick={()=>setActiveTab?.('transactions')} className="font-bold text-[#0c2340] hover:text-blue-600 flex items-center gap-1 cursor-pointer">
            Full Ledger <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          {label:'Create Payment',icon:Plus,tab:'payment-links',color:'bg-[#0c2340] text-white hover:bg-[#1a3a60]'},
          {label:'All Transactions',icon:BarChart2,tab:'transactions',color:'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'},
          {label:'API Keys',icon:ShieldCheck,tab:'settings',cat:'api',color:'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'},
          {label:'Subscription',icon:Zap,tab:'subscription',color:'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'},
        ].map(({label,icon:Icon,tab,cat,color})=>(
          <button key={label} type="button" onClick={()=>{cat&&setSettingsCategory?.(cat);setActiveTab?.(tab);}} className={`${color} rounded-2xl p-4 flex items-center gap-3 text-sm font-bold transition-all shadow-xs cursor-pointer`}>
            <Icon className="w-4 h-4 shrink-0"/>{label}
          </button>
        ))}
      </div>

    </div>
  );
}