'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ShieldCheck, Lock, CheckCircle2, Zap, ArrowRight,
  Landmark, Bell, Copy, Check, QrCode, CreditCard,
  Smartphone, ChevronRight, Pause, Play, Sparkles
} from 'lucide-react';
import QRCode from 'react-qr-code';

const STAGE_DURATIONS = [4200, 3200, 3600, 4200]; // Duration per stage in ms

export default function AnimatedPhoneMockup({ demoAmount = '500' }) {
  // 4 Core Stages of the UPI Checkout Journey:
  // 0: QR Scan (Dynamic QR with live sweeping laser and reticle)
  // 1: Authorizing / PIN entry (Customer UPI PIN entering on direct IMPS rail)
  // 2: Payment Done / Settled (Cinematic Green Tick, 0% Fee, UTR generation)
  // 3: Bank SMS & Webhook Notifications (Realistic slide-down bank push notifications)
  const [stage, setStage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pinCount, setPinCount] = useState(0);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [progress, setProgress] = useState(0);

  // Stage cycle timer
  useEffect(() => {
    if (isPaused) return;

    const currentDuration = STAGE_DURATIONS[stage];
    const intervalMs = 50;
    const increment = (intervalMs / currentDuration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setStage(curr => (curr + 1) % 4);
          return 0;
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [stage, isPaused]);

  // Stage 1: Sequential UPI PIN digits fill-in simulation
  useEffect(() => {
    if (stage === 1) {
      setPinCount(0);
      const timeouts = [
        setTimeout(() => setPinCount(1), 300),
        setTimeout(() => setPinCount(2), 650),
        setTimeout(() => setPinCount(3), 1000),
        setTimeout(() => setPinCount(4), 1350),
        setTimeout(() => setPinCount(5), 1700),
        setTimeout(() => setPinCount(6), 2050),
      ];
      return () => timeouts.forEach(t => clearTimeout(t));
    } else {
      setPinCount(0);
    }
  }, [stage]);

  const handleCopyUtr = (e) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText('431908249102');
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  const formattedAmount = parseFloat(demoAmount || '500').toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className="phone-glow-container w-full max-w-[340px] relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Premium Phone Frame displaying Actual MyMobPay checkout screen */}
      <div className="relative w-full bg-slate-900 border-8 border-slate-800 rounded-[44px] premium-phone-shadow overflow-hidden aspect-[9/18.5] flex flex-col">

        {/* Dynamic Island Notch - Expands smoothly in notification stage */}
        <div className="absolute top-0 inset-x-0 flex justify-center z-40 pointer-events-none transition-all duration-300">
          {stage === 3 ? (
            <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700 w-[88%] mt-2 rounded-2xl px-3 py-2 flex items-center gap-2.5 shadow-2xl animate-fade-down">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white">Bank Alert • UPI</span>
                  <span className="text-[8px] text-emerald-400 font-mono">Just now</span>
                </div>
                <p className="text-[9px] text-slate-300 truncate">
                  ₹{formattedAmount} credited to A/c ••4892
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 w-28 h-4 rounded-b-2xl flex items-center justify-between px-3">
              <span className="w-2 h-2 rounded-full bg-slate-900/80" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>
          )}
        </div>

        {/* Internal Screen Content */}
        <div className="flex-1 bg-[#0B192C] pt-7 px-4 pb-4 flex flex-col justify-between font-sans text-white relative overflow-hidden">

          {/* Top Status Bar */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 pt-0.5 z-20">
            <div className="flex items-center gap-1.5">
              <span>10:42 AM</span>
              <span className="text-[9px] text-emerald-400 font-mono font-medium flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] tracking-wide text-slate-400">5G</span>
              <div className="w-4 h-2 border border-slate-400/80 rounded-xs p-0.5 flex items-center">
                <div className="bg-slate-400 w-full h-full rounded-2xs" />
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════
             STAGE 0: DYNAMIC QR CODE SCANNER (Scanning Phase)
             ═════════════════════════════════════════════════════════ */}
          {stage === 0 && (
            <div className="flex-1 flex flex-col justify-between py-2 animate-fade-in">
              {/* Header Info */}
              <div className="space-y-3">
                {/* Brand Header */}
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="inline-flex items-center gap-1.5">
                    <Image
                      src="/logos/mymobpay_mark.png"
                      alt="MyMobPay"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                    <span className="font-extrabold tracking-tight text-lg text-white">
                      MyMobPay
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium tracking-wide">
                    Direct bank checkout
                  </p>
                </div>

                {/* Due amount card */}
                <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-3 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>Total due</span>
                    <span className="text-[#3395FF] font-semibold bg-[#0B2447] px-2 py-0.5 rounded text-[9px] flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-[#3395FF]" />
                      Direct bank rail
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-xs font-bold text-slate-400 mr-0.5">₹</span>
                    <span className="text-2xl font-bold text-white tracking-tight leading-none">
                      {formattedAmount}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-[#1D2D44] flex justify-between text-[10px] font-medium text-slate-400">
                    <span>Paying to:</span>
                    <span className="font-semibold text-slate-200">Merchant Store</span>
                  </div>
                </div>

                {/* QR Code Container with Active Laser Sweep */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center space-y-2 relative overflow-hidden group">
                  {/* Glowing Laser Beam scanning vertically */}
                  <div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#3395FF] to-transparent shadow-[0_0_12px_2px_rgba(51,149,255,0.9)] z-20 pointer-events-none"
                    style={{
                      animation: 'laserSweep 2.2s ease-in-out infinite'
                    }}
                  />

                  {/* Corner Scanner Reticles */}
                  <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#3395FF] rounded-tl-xs pointer-events-none" />
                  <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#3395FF] rounded-tr-xs pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#3395FF] rounded-bl-xs pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#3395FF] rounded-br-xs pointer-events-none" />

                  {/* Top Indicator bar */}
                  <div className="absolute inset-x-0 h-0.5 bg-slate-200 top-0" />

                  {/* Real Dynamic UPI QR Code */}
                  <div className="p-1.5 bg-white rounded-xl border border-slate-100 flex items-center justify-center shadow-inner">
                    <QRCode
                      value={`upi://pay?pa=merchant@okaxis&pn=MyMobPay&am=${demoAmount || '500'}&cu=INR&tn=OrderDemo`}
                      size={110}
                      bgColor="#FFFFFF"
                      fgColor="#0F172A"
                      level="M"
                    />
                  </div>

                  <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-1.5 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Instant UTR auto-verification</span>
                  </span>
                </div>
              </div>

              {/* Footer Section */}
              <div className="space-y-2 pt-2 border-t border-[#1D2D44]">
                <p className="text-[10px] text-slate-300 font-medium text-center">
                  Scan with any UPI application
                </p>
                <div className="grid grid-cols-4 gap-1">
                  <span className="bg-[#0F1E36] border border-[#1D2D44] text-white text-[9px] font-bold py-1 px-1 rounded-md text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                    GPay
                  </span>
                  <span className="bg-[#0F1E36] border border-[#1D2D44] text-white text-[9px] font-bold py-1 px-1 rounded-md text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5f259f]"></span>
                    PhonePe
                  </span>
                  <span className="bg-[#0F1E36] border border-[#1D2D44] text-white text-[9px] font-bold py-1 px-1 rounded-md text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00baf2]"></span>
                    Paytm
                  </span>
                  <span className="bg-[#0F1E36] border border-[#1D2D44] text-white text-[9px] font-bold py-1 px-1 rounded-md text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    BHIM
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
             STAGE 1: UPI APP AUTHORIZATION / PIN ENTRY SCREEN
             ═════════════════════════════════════════════════════════ */}
          {stage === 1 && (
            <div className="flex-1 flex flex-col justify-between py-2 animate-fade-up">
              <div className="space-y-3.5">
                {/* Header Intent */}
                <div className="flex items-center justify-between border-b border-[#1D2D44] pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[#3395FF]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">UPI Direct Intent</p>
                      <p className="text-[9px] text-slate-400 font-mono">NPCI Payment Rail</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Auto-Matched
                  </span>
                </div>

                {/* Merchant & Amount Box */}
                <div className="text-center bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-4 shadow-sm space-y-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#533afd] to-[#3395FF] flex items-center justify-center mx-auto text-white font-bold text-base shadow-sm">
                    M
                  </div>
                  <p className="text-xs font-semibold text-slate-200 pt-1">Merchant Store</p>
                  <p className="text-[10px] text-slate-400 font-mono">merchant@okaxis</p>
                  <div className="pt-2">
                    <span className="text-2xl font-black text-white font-mono tracking-tight">
                      ₹{formattedAmount}
                    </span>
                  </div>
                </div>

                {/* Bank Account Selector Card */}
                <div className="bg-[#0B1F38] border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#3395FF]">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">HDFC Bank •••• 4892</p>
                      <p className="text-[9px] text-emerald-400 font-semibold font-mono">Direct IMPS Passthrough</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>

                {/* 6-Digit UPI PIN Simulation Box */}
                <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-4 text-center space-y-2.5">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    <Lock className="w-3 h-3 text-[#3395FF]" />
                    <span>Enter 6-Digit UPI PIN</span>
                  </div>

                  {/* PIN Dots */}
                  <div className="flex justify-center items-center gap-3 py-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => {
                      const isFilled = pinCount >= i;
                      return (
                        <div
                          key={i}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                            isFilled
                              ? 'bg-[#3395FF] shadow-[0_0_8px_#3395FF] scale-110'
                              : 'bg-slate-700 border border-slate-600'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <p className="text-[9px] text-slate-400">
                    {pinCount >= 6 ? (
                      <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3 fill-emerald-400" />
                        Verifying directly on NPCI rail...
                      </span>
                    ) : (
                      'Simulating customer bank authorization'
                    )}
                  </p>
                </div>
              </div>

              {/* Security Banner */}
              <div className="text-center pt-2 border-t border-[#1D2D44]">
                <p className="text-[9px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>NPCI 256-bit Direct Bank Encryption</span>
                </p>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
             STAGE 2: PAYMENT SETTLED / PAYMENT DONE (Celebration)
             ═════════════════════════════════════════════════════════ */}
          {stage === 2 && (
            <div className="flex-1 flex flex-col justify-between py-2 animate-scale-up">
              <div className="space-y-4 pt-1">
                {/* Celebratory Checkmark Icon */}
                <div className="flex flex-col items-center justify-center space-y-2.5 pt-2">
                  <div className="relative">
                    {/* Concentric Glow Ripples */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping opacity-60" />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.6)]">
                      <Check className="w-9 h-9 text-white stroke-[3.5]" />
                    </div>
                  </div>

                  <div className="text-center space-y-0.5">
                    <p className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                      Payment Settled
                    </p>
                    <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                      ₹{formattedAmount}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-medium">
                      Credited directly to merchant account
                    </p>
                  </div>
                </div>

                {/* Settlement Details Breakdown Card */}
                <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-3.5 space-y-2 text-xs">
                  {/* UTR Copy Row */}
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[#1D2D44]">
                    <span className="text-slate-400">Bank UTR Ref</span>
                    <button
                      onClick={handleCopyUtr}
                      className="flex items-center gap-1 font-mono font-bold text-[#3395FF] hover:text-white transition-colors bg-[#0B2447] px-2 py-0.5 rounded cursor-pointer"
                      title="Copy UTR"
                    >
                      <span>431908249102</span>
                      {copiedUtr ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Fee comparison pill */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Gateway Fee Deducted</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₹0.00 (0%)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Settlement Speed</span>
                    <span className="font-mono text-white font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      T+0 Real-time
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Route</span>
                    <span className="font-mono text-slate-200">
                      Direct IMPS / Bank
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Badge */}
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No 2% Intermediary Fee Deducted</span>
                </p>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
             STAGE 3: NOTIFICATIONS SLIDE-DOWN (Bank SMS & Webhook)
             ═════════════════════════════════════════════════════════ */}
          {stage === 3 && (
            <div className="flex-1 flex flex-col justify-between py-2 animate-fade-in relative">
              {/* Floating Slide-down Push Notifications */}
              <div className="space-y-2.5 pt-1">
                {/* Notification 1: Real Bank Credit SMS / Notification */}
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.4)] animate-fade-up space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white">
                        <Landmark className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-white">HDFC Bank Alert</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">Just now</span>
                  </div>
                  <p className="text-[10px] text-slate-200 leading-snug">
                    <strong className="text-emerald-400 font-semibold">Cr: ₹{formattedAmount}</strong> in A/c XX4892 on 06-NOV via UPI Ref <span className="font-mono text-slate-300">431908249102</span>. 0% gateway deduction.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px] text-slate-400 font-mono">
                    <span>Avail Bal: ₹1,43,350.00</span>
                    <span className="text-emerald-400 font-semibold">T+0 IMPS</span>
                  </div>
                </div>

                {/* Notification 2: Real-time Developer Webhook */}
                <div className="bg-[#0F1E36]/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.4)] animate-fade-up delay-150 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#533afd] flex items-center justify-center text-white">
                        <Zap className="w-3 h-3 fill-white" />
                      </div>
                      <span className="font-bold text-white">MyMobPay Webhook</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">14ms latency</span>
                  </div>
                  <p className="text-[10px] text-slate-200 leading-snug font-mono">
                    <span className="text-[#3395FF]">event:</span> &quot;payment.settled&quot;<br />
                    <span className="text-emerald-400">signature:</span> &quot;sha256=9b7f...verified&quot;
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1D2D44] text-[9px] text-slate-400 font-mono">
                    <span>Target: https://api.store.com/webhook</span>
                    <span className="text-emerald-400">200 OK</span>
                  </div>
                </div>
              </div>

              {/* Bottom Explanation Banner */}
              <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-xl p-2.5 text-center space-y-1">
                <p className="text-[10px] font-bold text-white flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant Verification & Payout</span>
                </p>
                <p className="text-[9px] text-slate-400 leading-tight">
                  No escrow holds, no 3-day payout delays, direct bank settlement.
                </p>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
             STEPPER CONTROLS & TIMELINE PROGRESS
             ═════════════════════════════════════════════════════════ */}
          <div className="pt-2 z-20 space-y-1.5">
            {/* Smooth Progress Bar */}
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#533afd] via-[#3395FF] to-emerald-400 h-full rounded-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Clickable 4-Stage Pill Steppers */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {[
                { label: 'Scan', icon: QrCode },
                { label: 'PIN', icon: Lock },
                { label: 'Settled', icon: CheckCircle2 },
                { label: 'Alert', icon: Bell },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                const isActive = stage === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setStage(idx);
                      setProgress(0);
                    }}
                    className={`flex items-center justify-center gap-1 py-1 rounded-md text-[9px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#3395FF] text-white shadow-xs font-bold'
                        : 'bg-[#0F1E36] hover:bg-[#152a4a] text-slate-400 hover:text-slate-200 border border-[#1D2D44]'
                    }`}
                  >
                    <IconComponent className="w-2.5 h-2.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
