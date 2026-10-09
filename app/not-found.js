'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, ArrowLeft, Home, FileWarning } from 'lucide-react';

const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = '#1a2332' }) => (
  <svg viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
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

export default function NotFound() {
  const router = useRouter();

  const mockErrorJson = `{
  "status": 404,
  "error": "NOT_FOUND",
  "message": "The requested URL or payment endpoint does not exist.",
  "timestamp": "${new Date().toISOString()}",
  "path": "/unknown-route",
  "solution": "Verify the endpoint parameters, sandbox credentials, or return home."
}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-500/10 selection:text-blue-600 font-sans">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full filter blur-[100px] pointer-events-none -z-10 animate-mesh-rotate" />
      <div className="absolute bottom-10 left-0 w-[300px] h-[300px] bg-indigo-200/15 rounded-full filter blur-[90px] pointer-events-none -z-10 animate-mesh-rotate" style={{ animationDelay: '-5s' }} />

      {/* Header */}
      <header className="w-full px-6 md:px-10 h-20 flex items-center justify-between border-b border-slate-200 bg-white">
        <Link href="/" className="flex items-center gap-2 select-none">
          <MyMobPayLogo className="w-40 h-auto" />
        </Link>
        <Link 
          href="/login" 
          className="text-xs font-bold text-slate-650 hover:text-slate-900 border border-slate-250 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 transition-all"
        >
          Merchant Console
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center space-y-8 animate-fade-up">
        
        {/* Error Code Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-bold text-red-600">
          <FileWarning className="w-3.5 h-3.5" />
          <span>HTTP Error: 404</span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Oops! This Route is Unreachable
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
            The page you&apos;re searching for might have been relocated, deleted, or was never integrated into the sandbox router.
          </p>
        </div>

        {/* Developer Console Code Block Mockup */}
        <div className="w-full bg-[#0B192C] border border-[#1D2D44] rounded-3xl overflow-hidden shadow-2xl text-left font-mono">
          <div className="bg-[#07111F] px-4 py-3 border-b border-[#1D2D44] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase">mymobpay-terminal.log</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
          </div>
          <pre className="p-5 text-[11px] sm:text-xs text-[#F8FAFC]/90 overflow-x-auto leading-relaxed bg-[#07111F]/80">
            <code>{mockErrorJson}</code>
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
          <button 
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 border border-slate-250 text-slate-700 bg-white hover:bg-slate-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          
          <Link 
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 text-sm"
          >
            <Home className="w-4 h-4 text-white" /> Return Home
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-slate-200/60 bg-white text-center text-xs font-semibold text-slate-400">
        <p>© 2026 MyMobPay · B2B Payments Gateway · All Rights Reserved.</p>
      </footer>

    </div>
  );
}
