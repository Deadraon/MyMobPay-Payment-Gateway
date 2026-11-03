'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log unexpected runtime errors for diagnostics
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070e17] text-white px-6 py-12 selection:bg-rose-500/20">
      {/* Background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-rose-600/10 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 animate-scale-up">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-900/20">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            System Notice
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            An unexpected error occurred while processing this page. Your payment sessions and merchant account remain secure.
          </p>
        </div>

        {/* Error digest if present */}
        {error?.digest && (
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 select-all">
            Error ID: {error.digest}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-[0.98]"
          >
            <Home className="w-3.5 h-3.5" />
            Return Home
          </Link>
        </div>

        {/* Footer help */}
        <div className="pt-4 border-t border-slate-800/80 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Need assistance? Contact support at support@mymobpay.tech</span>
        </div>
      </div>
    </div>
  );
}
