import React from 'react';
import Image from 'next/image';

const MyMobPayLogo = ({ className = 'h-10 w-auto', textColor = '#FFFFFF' }) => (
  <svg 
    viewBox="0 0 220 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className} select-none transition-transform duration-300 hover:scale-[1.02]`}
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

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070e17] text-white selection:bg-blue-500/20">
      {/* Background ambient glow */}
      <div className="absolute w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none -z-10" />

      <div className="flex flex-col items-center gap-6 animate-fade-up">
        {/* Animated Brand Ribbon Mark */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl shadow-blue-500/10 p-3">
            <Image
              src="/logos/mymobpay_mark.png"
              alt="MyMobPay"
              width={56}
              height={56}
              priority
              className="w-14 h-14 object-contain animate-pulse select-none"
            />
          </div>
          <div 
            className="absolute -inset-2.5 rounded-3xl border border-blue-500/20 animate-ping pointer-events-none" 
            style={{ animationDuration: '3s' }} 
          />
        </div>

        {/* Brand Wordmark & Loading Indicator */}
        <div className="flex flex-col items-center gap-3 text-center">
          <MyMobPayLogo className="h-9 w-auto" textColor="#FFFFFF" />

          {/* Micro loading spinner & label */}
          <div className="flex items-center gap-2 mt-1 text-slate-400">
            <svg
              className="w-3.5 h-3.5 text-blue-500 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase animate-pulse">
              Connecting secure session...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
