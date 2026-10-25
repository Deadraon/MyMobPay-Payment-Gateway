'use client';

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

/**
 * PremiumCrownMark — Bespoke jewel-faceted Crown Logo Emblem
 * Designed with dual-tone metallic gradients (Emerald Aurora & Champagne Gold),
 * faceted specular reflections, and royal apex jewels.
 */
export function PremiumCrownMark({ active = true, className = 'w-4 h-4' }) {
  const gradId = active ? 'emCrownGrad' : 'amCrownGrad';
  const gemGradId = active ? 'emGemGrad' : 'amGemGrad';
  const glowFilterId = active ? 'emCrownGlow' : 'amCrownGlow';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Emerald Aurora Gradient (Active State) */}
        <linearGradient id="emCrownGrad" x1="3" y1="5" x2="21" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="emGemGrad" x1="12" y1="2" x2="12" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Champagne Gold Gradient (Inactive / Upgrade State) */}
        <linearGradient id="amCrownGrad" x1="3" y1="5" x2="21" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="amGemGrad" x1="12" y1="2" x2="12" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>

        {/* Micro Drop Shadow Filter */}
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.2"
            floodColor={active ? '#10B981' : '#F59E0B'}
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      {/* Main Faceted Crown Body */}
      <path
        d="M3.5 17.5L5 9.2L9.2 13.2L12 5.5L14.8 13.2L19 9.2L20.5 17.5C20.5 18.3284 19.8284 19 19 19H5C4.17157 19 3.5 18.3284 3.5 17.5Z"
        fill={`url(#${gradId})`}
        stroke={active ? '#A7F3D0' : '#FEF3C7'}
        strokeWidth="0.75"
        strokeLinejoin="round"
        filter={`url(#${glowFilterId})`}
      />

      {/* Center Facet Specular Highlight */}
      <path
        d="M12 5.5L9.2 13.2H14.8L12 5.5Z"
        fill="#FFFFFF"
        fillOpacity={active ? '0.24' : '0.28'}
      />

      {/* Left Shading Facet */}
      <path
        d="M5 9.2L9.2 13.2L5.5 17H4L5 9.2Z"
        fill="#FFFFFF"
        fillOpacity="0.14"
      />

      {/* Right Shading Facet */}
      <path
        d="M19 9.2L14.8 13.2L18.5 17H20L19 9.2Z"
        fill="#000000"
        fillOpacity="0.15"
      />

      {/* Apex Crown Jewels */}
      <circle cx="12" cy="4.5" r="1.5" fill={`url(#${gemGradId})`} stroke="#FFFFFF" strokeWidth="0.65" />
      <circle cx="4.6" cy="8.4" r="1.2" fill={`url(#${gemGradId})`} stroke="#FFFFFF" strokeWidth="0.55" />
      <circle cx="19.4" cy="8.4" r="1.2" fill={`url(#${gemGradId})`} stroke="#FFFFFF" strokeWidth="0.55" />

      {/* Bottom Trim Bar with Royal Studs */}
      <path
        d="M5.5 17.4H18.5"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <circle cx="8" cy="17.4" r="0.6" fill="#FFFFFF" fillOpacity="0.9" />
      <circle cx="12" cy="17.4" r="0.75" fill="#FFFFFF" fillOpacity="0.95" />
      <circle cx="16" cy="17.4" r="0.6" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
}

/**
 * PremiumTierBadge — Redesigned Sidebar & Mobile Navigation Status Pill
 * Features glassmorphic backdrop, iridescent border glow, dual-tone typography,
 * animated radar beacon, and the bespoke PremiumCrownMark logo.
 */
export default function PremiumTierBadge({
  profile,
  activeTab,
  onClick,
  className = ''
}) {
  const isSubExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now();
  const isActive = profile?.subscription_status === 'active' && !isSubExpired;
  const isSelected = activeTab === 'subscription';

  // Compute remaining days if expiry is present
  let subtitle = 'Unlock Live UPI Rails';
  if (isActive) {
    if (profile?.subscription_expires_at) {
      const msLeft = new Date(profile.subscription_expires_at).getTime() - Date.now();
      const days = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      subtitle = days > 0 ? `${days}d left • Live Production` : 'Live Production Active';
    } else {
      subtitle = 'Live Production Active';
    }
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={`group relative w-full overflow-hidden rounded-xl p-[1px] transition-all duration-300 cursor-pointer select-none text-left ${
        isSelected
          ? 'ring-2 ring-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.35)]'
          : isActive
          ? 'shadow-[0_0_16px_-2px_rgba(16,185,129,0.22)] hover:shadow-[0_0_24px_0_rgba(16,185,129,0.38)] hover:-translate-y-0.5'
          : 'shadow-[0_0_16px_-2px_rgba(245,158,11,0.2)] hover:shadow-[0_0_22px_0_rgba(245,158,11,0.35)] hover:-translate-y-0.5'
      } ${className}`}
      title={isActive ? 'Manage Premium Subscription' : 'Upgrade to Premium Subscription'}
    >
      {/* ── Iridescent Gradient Border Outer Layer ── */}
      <div
        className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
          isSelected
            ? 'bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 opacity-90'
            : isActive
            ? 'bg-gradient-to-r from-emerald-500/40 via-teal-400/30 to-emerald-500/40 group-hover:from-emerald-400/80 group-hover:via-teal-300/70 group-hover:to-emerald-400/80 opacity-80 group-hover:opacity-100'
            : 'bg-gradient-to-r from-amber-500/40 via-yellow-400/30 to-amber-500/40 group-hover:from-amber-400/80 group-hover:via-yellow-300/70 group-hover:to-amber-400/80 opacity-80 group-hover:opacity-100'
        }`}
      />

      {/* ── Glassmorphic Inner Container ── */}
      <div
        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-[11px] backdrop-blur-md transition-all ${
          isSelected
            ? 'bg-slate-900/95 text-blue-200'
            : isActive
            ? 'bg-gradient-to-r from-[#06241a]/90 via-[#0B1528]/95 to-[#06241a]/90 text-slate-100'
            : 'bg-gradient-to-r from-[#291705]/90 via-[#0B1528]/95 to-[#291705]/90 text-slate-100'
        }`}
      >
        {/* Top ambient micro light line */}
        <div
          className={`absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent ${
            isActive ? 'via-emerald-400/40' : 'via-amber-400/40'
          } to-transparent`}
        />

        {/* ── Redesigned Emblem Tile ── */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
            isActive
              ? 'bg-emerald-500/15 border-emerald-400/30 group-hover:bg-emerald-500/25 group-hover:border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
              : 'bg-amber-500/15 border-amber-400/30 group-hover:bg-amber-500/25 group-hover:border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
          }`}
        >
          <PremiumCrownMark active={isActive} className="w-4 h-4 transition-transform group-hover:scale-110" />
        </div>

        {/* ── Typography & Status Info ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black text-[11px] tracking-wide truncate ${
                isActive ? 'text-emerald-200 group-hover:text-white' : 'text-amber-200 group-hover:text-white'
              }`}
            >
              {isActive ? 'Premium Active' : 'Premium Subscription'}
            </span>
            <Sparkles
              className={`w-2.5 h-2.5 shrink-0 transition-opacity ${
                isActive
                  ? 'text-emerald-300 opacity-60 group-hover:opacity-100'
                  : 'text-amber-300 opacity-60 group-hover:opacity-100'
              }`}
            />
          </div>
          <p
            className={`text-[9px] font-medium tracking-tight truncate ${
              isActive ? 'text-emerald-400/85' : 'text-amber-400/85'
            }`}
          >
            {subtitle}
          </p>
        </div>

        {/* ── Live Radar Beacon Dot ── */}
        <div className="relative flex h-2 w-2 shrink-0 items-center justify-center mr-0.5">
          {isActive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34D399]" />
            </>
          ) : (
            <>
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_6px_#FBBF24]" />
            </>
          )}
        </div>
      </div>
    </button>
  );
}
