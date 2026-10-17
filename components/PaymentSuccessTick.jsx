'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Web Audio API synthesizer for the iconic payment success chime.
 * Multi-harmonic progression:
 * - 0.00s: Soft tactile resonant sub-pulse (220Hz -> 130Hz)
 * - 0.28s: Crystal bell note (C6 1046.5Hz)
 * - 0.40s: Pure confirmation harmonic bell (G6 1567.98Hz)
 * - 0.44s: Subtle high crystal shimmer (E7 2637Hz)
 * Zero external audio assets required, fails gracefully on restricted environments.
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

    // 1. Tactile soft sub-pulse (at badge lock)
    const oscSub = ctx.createOscillator();
    const gainSub = ctx.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(220, now);
    oscSub.frequency.exponentialRampToValueAtTime(130, now + 0.12);
    gainSub.gain.setValueAtTime(0, now);
    gainSub.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gainSub.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    oscSub.connect(gainSub);
    gainSub.connect(ctx.destination);
    oscSub.start(now);
    oscSub.stop(now + 0.15);

    // 2. First Harmonic Bell Tone (C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now + 0.24);
    gain1.gain.setValueAtTime(0, now + 0.24);
    gain1.gain.linearRampToValueAtTime(0.22, now + 0.26);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now + 0.24);
    osc1.stop(now + 0.66);

    // 3. Second Bright Bell Confirmation Tone (G6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.36);
    gain2.gain.setValueAtTime(0, now + 0.36);
    gain2.gain.linearRampToValueAtTime(0.26, now + 0.38);
    gain2.gain.exponentialRampToValueAtTime(0.00001, now + 1.05);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.36);
    osc2.stop(now + 1.06);

    // 4. Ultra-high crystal shimmer (E7)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2637, now + 0.40);
    gain3.gain.setValueAtTime(0, now + 0.40);
    gain3.gain.linearRampToValueAtTime(0.05, now + 0.42);
    gain3.gain.exponentialRampToValueAtTime(0.00001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.40);
    osc3.stop(now + 0.86);
  } catch {
    // Autoplay or permission prevented audio, fail silently
  }
}

// 16 Celebratory micro particles (dots, rotating stars, confetti shards)
const PARTICLES = [
  // Compass dots
  { x: 0, y: -52, color: '#10b981', size: 5, delay: 1.24, type: 'dot' },
  { x: 38, y: -38, color: '#34d399', size: 4, delay: 1.28, type: 'dot' },
  { x: 54, y: 0, color: '#059669', size: 5, delay: 1.26, type: 'dot' },
  { x: 38, y: 38, color: '#6ee7b7', size: 4, delay: 1.30, type: 'dot' },
  { x: 0, y: 52, color: '#10b981', size: 5, delay: 1.27, type: 'dot' },
  { x: -38, y: 38, color: '#34d399', size: 4, delay: 1.29, type: 'dot' },
  { x: -54, y: 0, color: '#059669', size: 5, delay: 1.26, type: 'dot' },
  { x: -38, y: -38, color: '#6ee7b7', size: 4, delay: 1.31, type: 'dot' },

  // Sparkle stars (✦)
  { x: 44, y: -24, color: '#fbbf24', size: 9, delay: 1.30, type: 'star' },
  { x: -44, y: -24, color: '#ffffff', size: 8, delay: 1.33, type: 'star' },
  { x: 26, y: 46, color: '#38bdf8', size: 9, delay: 1.32, type: 'star' },
  { x: -28, y: 46, color: '#f59e0b', size: 8, delay: 1.34, type: 'star' },

  // Confetti shards
  { x: 22, y: -48, color: '#34d399', size: 6, delay: 1.28, type: 'shard' },
  { x: -22, y: -46, color: '#10b981', size: 6, delay: 1.31, type: 'shard' },
  { x: 48, y: 20, color: '#a7f3d0', size: 5, delay: 1.32, type: 'shard' },
  { x: -48, y: 20, color: '#6ee7b7', size: 5, delay: 1.30, type: 'shard' },
];

/**
 * Razorpay / PhonePe / Apple Pay Extended Cinematic Green Tick.
 * Choreographed Stages (~2.4s):
 *  1. [0.0s – 0.8s]  Glowing Orbital Pre-verification Radar Trace
 *  2. [0.65s – 1.4s] Solid Emerald Spring-pop Entrance + Tactile Audio Note
 *  3. [0.72s – 2.4s] Triple Concentric Expanding Shockwave Waves
 *  4. [0.92s – 1.6s] SVG Checkmark Path Deceleration Draw + Two-tone Bell Chime
 *  5. [1.25s – 2.3s] Radial Confetti Starburst & Sparkles
 *  6. [1.38s – 2.4s] Diagonal High-Gloss Reflection Sheen
 *  7. [2.0s+]        Continuous Ambient Emerald Glow Breathing Pulse
 */
export default function PaymentSuccessTick({
  size = 'lg',
  sound = true,
  showOrbit = true,
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
      // Triggers synchronously as the badge pops and check begins drawing
      const t = setTimeout(() => {
        playPaymentSuccessChime();
      }, 680);
      return () => clearTimeout(t);
    }
  }, [sound]);

  // Size variations
  const sizeMap = {
    sm: { container: 'w-16 h-16', badge: 'w-12 h-12', check: 'w-6 h-6', border: 'border-2', stroke: 3.8, orbitD: 60, minH: 64 },
    md: { container: 'w-22 h-22', badge: 'w-16 h-16', check: 'w-8 h-8', border: 'border-[3px]', stroke: 4.2, orbitD: 82, minH: 88 },
    lg: { container: 'w-32 h-32', badge: 'w-24 h-24', check: 'w-12 h-12', border: 'border-4', stroke: 4.8, orbitD: 118, minH: 120 },
    xl: { container: 'w-36 h-36', badge: 'w-28 h-28', check: 'w-14 h-14', border: 'border-4', stroke: 5.2, orbitD: 136, minH: 136 },
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  // Color schemes (Emerald Green for verified payments, Blue for COD orders)
  const colors = isCod
    ? {
        bg: 'from-blue-600 via-indigo-600 to-sky-500',
        shadow: 'shadow-[0_18px_40px_-6px_rgba(37,99,235,0.48)]',
        ripple1: 'bg-blue-400/35',
        ripple2: 'bg-blue-300/25',
        ripple3: 'bg-indigo-400/15',
        stroke: '#ffffff',
        orbitGradFrom: '#3b82f6',
        orbitGradMid: '#60a5fa',
        orbitGradTo: '#93c5fd',
      }
    : {
        bg: 'from-[#059669] via-[#10b981] to-[#34d399]',
        shadow: 'shadow-[0_18px_40px_-6px_rgba(16,185,129,0.48)]',
        ripple1: 'bg-emerald-400/35',
        ripple2: 'bg-emerald-300/25',
        ripple3: 'bg-teal-400/15',
        stroke: '#ffffff',
        orbitGradFrom: '#059669',
        orbitGradMid: '#10b981',
        orbitGradTo: '#6ee7b7',
      };

  return (
    <div
      role="status"
      aria-label="Payment Successful"
      className={`relative flex items-center justify-center my-3 select-none ${className}`}
      style={{ minWidth: currentSize.minH, minHeight: currentSize.minH }}
    >
      {/* ── 1. Orbital Pre-verification Radar Trace (0.0s – 0.85s) ── */}
      {showOrbit && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            animation: 'successOrbitFade 0.88s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          <svg
            style={{ width: currentSize.orbitD, height: currentSize.orbitD }}
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <linearGradient id={`orbitGrad_${isCod ? 'cod' : 'upi'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.orbitGradFrom} stopOpacity="0.05" />
                <stop offset="65%" stopColor={colors.orbitGradMid} stopOpacity="0.85" />
                <stop offset="100%" stopColor={colors.orbitGradTo} stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke={`url(#orbitGrad_${isCod ? 'cod' : 'upi'})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="276"
              style={{
                animation: 'successOrbitDraw 0.82s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                transformOrigin: '50px 50px',
              }}
            />
          </svg>
        </div>
      )}

      {/* ── 2. Concentric Shockwave Ripples (3 Waves) ── */}
      {showRipples && (
        <>
          {/* Wave 1 */}
          <span
            className={`absolute rounded-full pointer-events-none ${colors.ripple1} ${currentSize.badge}`}
            style={{
              animation: 'successRippleWave 1.4s cubic-bezier(0, 0.2, 0.4, 1) 0.72s both',
            }}
          />
          {/* Wave 2 */}
          <span
            className={`absolute rounded-full pointer-events-none ${colors.ripple2} ${currentSize.badge}`}
            style={{
              animation: 'successRippleWave 1.6s cubic-bezier(0, 0.2, 0.4, 1) 0.92s both',
            }}
          />
          {/* Wave 3 */}
          <span
            className={`absolute rounded-full pointer-events-none ${colors.ripple3} ${currentSize.badge}`}
            style={{
              animation: 'successRippleWave 1.8s cubic-bezier(0, 0.2, 0.4, 1) 1.14s both',
            }}
          />
        </>
      )}

      {/* ── 3. Celebratory Micro Particles & Confetti Sparkles ── */}
      {showParticles && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {PARTICLES.map((p, idx) => {
            const isStar = p.type === 'star';
            const isShard = p.type === 'shard';

            return (
              <span
                key={idx}
                className="absolute flex items-center justify-center"
                style={{
                  width: p.size,
                  height: p.size,
                  '--pt-x': `${p.x}px`,
                  '--pt-y': `${p.y}px`,
                  animation: 'successParticleBurst 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  animationDelay: `${p.delay}s`,
                  opacity: 0,
                }}
              >
                {isStar ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill={isCod ? '#60a5fa' : p.color}
                    className="w-full h-full drop-shadow-sm"
                  >
                    <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                  </svg>
                ) : isShard ? (
                  <span
                    className="block w-full h-1/2 rounded-[1px] rotate-45"
                    style={{ backgroundColor: isCod ? '#93c5fd' : p.color }}
                  />
                ) : (
                  <span
                    className="block w-full h-full rounded-full shadow-sm"
                    style={{ backgroundColor: isCod ? '#60a5fa' : p.color }}
                  />
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* ── 4. Main Badge (Spring Pop + Living Ambient Pulse) ── */}
      <div
        className={`relative ${currentSize.badge} rounded-full bg-gradient-to-tr ${colors.bg} flex items-center justify-center ${currentSize.border} border-white ${colors.shadow} overflow-hidden z-10`}
        style={{
          animation: `successBadgePop 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) 0.62s both, ${
            isCod ? 'successAmbientGlowCod' : 'successAmbientGlow'
          } 2.6s ease-in-out 1.9s infinite`,
          transformOrigin: 'center center',
        }}
      >
        {/* 3D Glass Radial Highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 50%, transparent 75%)',
          }}
        />

        {/* Diagonal High-Gloss Sheen Sweep */}
        {showSheen && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.65) 50%, transparent 80%)',
              animation: 'successLightSweep 1.1s cubic-bezier(0.4, 0, 0.2, 1) 1.38s both',
            }}
          />
        )}

        {/* ── 5. Razorpay Signature Animated SVG Checkmark ── */}
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
            strokeWidth={currentSize.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 52,
              strokeDashoffset: 52,
              animation: 'successCheckDraw 0.65s cubic-bezier(0.65, 0, 0.07, 1) 0.92s both',
            }}
          />
        </svg>
      </div>
    </div>
  );
}
