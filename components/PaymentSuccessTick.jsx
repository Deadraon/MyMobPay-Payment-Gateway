'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Web Audio API synthesizer for the iconic payment success chime.
 * Two-tone pleasant bell harmony (C6 1046.5Hz -> G6 1568Hz) with soft exponential decay.
 * Zero external audio files required, fails gracefully on restricted environments.
 */
export function playPaymentSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Second harmonic bell tone (G6 - bright confirmation note)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.11);
    gain2.gain.setValueAtTime(0, now + 0.11);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.00001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.66);
  } catch {
    // Autoplay or permission prevented audio, fail silently
  }
}

// Micro spark particles around the badge for subtle celebration
const PARTICLES = [
  { x: 0, y: -38, color: '#10b981', size: 5, delay: 0.28 },
  { x: 27, y: -27, color: '#34d399', size: 4, delay: 0.32 },
  { x: 38, y: 0, color: '#059669', size: 5, delay: 0.30 },
  { x: 27, y: 27, color: '#6ee7b7', size: 4, delay: 0.34 },
  { x: 0, y: 38, color: '#10b981', size: 5, delay: 0.29 },
  { x: -27, y: 27, color: '#34d399', size: 4, delay: 0.33 },
  { x: -38, y: 0, color: '#059669', size: 5, delay: 0.31 },
  { x: -27, y: -27, color: '#6ee7b7', size: 4, delay: 0.35 },
];

/**
 * Razorpay / PhonePe / Apple Pay signature animated Green Tick.
 * Features:
 * - Fluid scale & spring bounce entrance
 * - Dual expanding concentric ripple shockwaves
 * - SVG path stroke-dashoffset checkmark drawing
 * - Glass sheen sweep across the badge
 * - Subtle celebratory micro-particles
 * - Built-in optional harmonic audio confirmation
 */
export default function PaymentSuccessTick({
  size = 'lg',
  sound = true,
  showRipples = true,
  showParticles = true,
  showSheen = true,
  isCod = false,
  className = '',
}) {
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (sound && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      // Small timeout allows initial animation mount before playing
      const t = setTimeout(() => {
        playPaymentSuccessChime();
      }, 120);
      return () => clearTimeout(t);
    }
  }, [sound]);

  // Size variations
  const sizeMap = {
    sm: { container: 'w-12 h-12', badge: 'w-12 h-12', check: 'w-6 h-6', border: 'border-2' },
    md: { container: 'w-16 h-16', badge: 'w-16 h-16', check: 'w-8 h-8', border: 'border-[3px]' },
    lg: { container: 'w-24 h-24', badge: 'w-24 h-24', check: 'w-12 h-12', border: 'border-4' },
    xl: { container: 'w-28 h-28', badge: 'w-28 h-28', check: 'w-14 h-14', border: 'border-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  // Color schemes (Emerald Green for verified payments, Blue for COD orders)
  const colors = isCod
    ? {
        bg: 'from-blue-600 via-indigo-600 to-sky-500',
        shadow: 'shadow-[0_16px_36px_-6px_rgba(37,99,235,0.45)]',
        ripple1: 'bg-blue-400/30',
        ripple2: 'bg-blue-300/20',
        stroke: '#ffffff',
      }
    : {
        bg: 'from-[#059669] via-[#10b981] to-[#34d399]',
        shadow: 'shadow-[0_16px_36px_-6px_rgba(16,185,129,0.45)]',
        ripple1: 'bg-emerald-400/35',
        ripple2: 'bg-emerald-300/25',
        stroke: '#ffffff',
      };

  return (
    <div
      role="status"
      aria-label="Payment Successful"
      className={`relative flex items-center justify-center my-3 select-none ${className}`}
      style={{ minWidth: 96, minHeight: 96 }}
    >
      {/* ── Outer Shockwave Ripple 1 ── */}
      {showRipples && (
        <span
          className={`absolute rounded-full pointer-events-none ${colors.ripple1} ${currentSize.badge}`}
          style={{
            animation: 'successRippleWave 1.4s cubic-bezier(0, 0.2, 0.4, 1) forwards',
            animationDelay: '0.15s',
          }}
        />
      )}

      {/* ── Outer Shockwave Ripple 2 ── */}
      {showRipples && (
        <span
          className={`absolute rounded-full pointer-events-none ${colors.ripple2} ${currentSize.badge}`}
          style={{
            animation: 'successRippleWave 1.6s cubic-bezier(0, 0.2, 0.4, 1) forwards',
            animationDelay: '0.3s',
          }}
        />
      )}

      {/* ── Celebratory Micro Particles (Burst outward & fade) ── */}
      {showParticles && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {PARTICLES.map((p, idx) => (
            <span
              key={idx}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: isCod ? '#60a5fa' : p.color,
                '--pt-x': `${p.x}px`,
                '--pt-y': `${p.y}px`,
                animation: 'successParticleBurst 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                animationDelay: `${p.delay}s`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Main Green Badge (Elastic Pop Entrance) ── */}
      <div
        className={`relative ${currentSize.badge} rounded-full bg-gradient-to-tr ${colors.bg} flex items-center justify-center ${currentSize.border} border-white ${colors.shadow} overflow-hidden`}
        style={{
          animation: 'successBadgePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          transformOrigin: 'center center',
        }}
      >
        {/* Light Glass Sheen Sweep */}
        {showSheen && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              animation: 'successLightSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              animationDelay: '0.45s',
              opacity: 0,
            }}
          />
        )}

        {/* ── Razorpay Signature Animated SVG Checkmark ── */}
        <svg
          viewBox="0 0 52 52"
          className={`${currentSize.check} relative z-10`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated checkmark polyline with rounded caps */}
          <path
            d="M14 27 L22.5 35.5 L38 17"
            stroke={colors.stroke}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 42,
              strokeDashoffset: 42,
              animation: 'successCheckDraw 0.42s cubic-bezier(0.65, 0, 0.45, 1) forwards',
              animationDelay: '0.24s',
            }}
          />
        </svg>
      </div>
    </div>
  );
}
