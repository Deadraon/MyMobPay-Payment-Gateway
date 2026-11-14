'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Loader2, Lock, Mail, ArrowRight, ShieldCheck,
  CheckCircle2, Building2, QrCode, Phone, Smartphone,
  Zap, Eye, EyeOff, AlertCircle, X, RefreshCw, MessageCircle,
  Link2, Check, UserPlus, ShieldAlert, ChevronLeft, Globe,
  Scale, FileText
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';

import { useModalTransition } from '@/components/useModalTransition';
import { validateStrongPassword, getPasswordCriteria } from '@/lib/passwordValidation';
import LegalAgreementModal from '@/components/LegalAgreementModal';

// Dedicated crisp vector 3D ribbon mark with unique SVG gradient scopes
function MyMobPayLogoMark({ className = "w-6 h-6", id = "auth-logo" }) {
  return (
    <svg className={`overflow-visible shrink-0 ${className}`} viewBox="115 225 790 530" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MyMobPay Logo">
      <defs>
        <linearGradient id={`auth-g1-${id}`} x1="360" y1="280" x2="510" y2="660" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#004BFF" />
          <stop offset="100%" stopColor="#0033B5" />
        </linearGradient>
        <linearGradient id={`auth-g2-${id}`} x1="510" y1="630" x2="670" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E64400" />
          <stop offset="50%" stopColor="#FF6D00" />
          <stop offset="100%" stopColor="#FF9614" />
        </linearGradient>
        <linearGradient id={`auth-g3-${id}`} x1="170" y1="710" x2="420" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0044E5" />
          <stop offset="55%" stopColor="#0088FF" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
        <linearGradient id={`auth-g4-${id}`} x1="600" y1="280" x2="830" y2="710" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF9E1B" />
          <stop offset="55%" stopColor="#FF7300" />
          <stop offset="100%" stopColor="#F05A00" />
        </linearGradient>
      </defs>
      <path d="M 470 575 L 555 340 C 585 260, 680 260, 710 340 L 625 575 C 595 655, 500 655, 470 575 Z" fill={`url(#auth-g2-${id})`} />
      <path d="M 310 340 L 395 575 C 425 655, 520 655, 550 575 L 465 340 C 435 260, 340 260, 310 340 Z" fill={`url(#auth-g1-${id})`} />
      <path d="M 168 645 L 290 340 C 320 260, 425 260, 455 340 L 332 645 C 308 725, 192 725, 168 645 Z" fill={`url(#auth-g3-${id})`} />
      <path d="M 565 340 C 595 260, 700 260, 730 340 L 852 645 C 828 725, 712 725, 688 645 L 565 340 Z" fill={`url(#auth-g4-${id})`} />
    </svg>
  );
}

// Helper: Detect Bank Name & Styling from UPI ID
const getBankFromUpi = (upi) => {
  if (!upi || !upi.includes('@')) return null;
  const handle = upi.split('@')[1]?.toLowerCase();
  if (!handle) return null;
  if (handle.includes('hdfc')) return { name: 'HDFC Bank', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' };
  if (handle.includes('sbi')) return { name: 'State Bank of India', color: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' };
  if (handle.includes('icici')) return { name: 'ICICI Bank', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
  if (handle.includes('axis')) return { name: 'Axis Bank', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
  if (handle.includes('paytm')) return { name: 'Paytm Payments Bank', color: 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800' };
  if (handle.includes('ybl') || handle.includes('ibl')) return { name: 'Yes Bank / PhonePe', color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' };
  if (handle.includes('barodampay')) return { name: 'Bank of Baroda', color: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' };
  if (handle.includes('kotak')) return { name: 'Kotak Mahindra Bank', color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' };
  return { name: `@${handle} UPI Network`, color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' };
};

// Authentic Indian Tricolour Flag SVG
const IndianFlag = ({ className = 'w-4 h-3' }) => (
  <svg 
    className={`${className} rounded-[1.5px] overflow-hidden shrink-0 inline-block`} 
    viewBox="0 0 640 480" 
    aria-label="India Flag"
  >
    <path fill="#FF9933" d="M0 0h640v160H0z" />
    <path fill="#FFFFFF" d="M0 160h640v160H0z" />
    <path fill="#138808" d="M0 320h640v160H0z" />
    <circle cx="320" cy="240" r="40" fill="none" stroke="#000080" strokeWidth="6" />
    <circle cx="320" cy="240" r="8" fill="#000080" />
    <g stroke="#000080" strokeWidth="2.5">
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="320"
          y1="240"
          x2={320 + 38 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={240 + 38 * Math.sin((i * 15 * Math.PI) / 180)}
        />
      ))}
    </g>
  </svg>
);

// Open-Redirect Prevention: Strict sanitization of client-provided redirect URLs
function getSafeRedirectUrl(rawUrl, defaultUrl = '/dashboard') {
  if (!rawUrl || typeof rawUrl !== 'string') return defaultUrl;
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }
  if (trimmed.startsWith('/login') || trimmed.startsWith('/signup')) {
    return defaultUrl;
  }
  return trimmed;
}

// Translate developer/system errors to clear, customer-friendly English
function formatCustomerError(err) {
  if (!err) return '';
  const raw = (typeof err === 'string' ? err : err.message || err.error_description || String(err)).trim();
  const lower = raw.toLowerCase();

  if (
    lower.includes('token') || 
    lower.includes('otp') || 
    lower.includes('verification code')
  ) {
    if (lower.includes('expired')) {
      return 'Your verification code has expired. Please request a new code below.';
    }
    if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong')) {
      return 'The verification code you entered is incorrect. Please check the 6 digits and try again.';
    }
    return 'Invalid verification code. Please check the 6 digits sent to your device and try again.';
  }

  if (lower.includes('link') && (lower.includes('expired') || lower.includes('invalid') || lower.includes('already used'))) {
    return 'This sign-in link has expired or has already been used. Please request a new link.';
  }

  if (lower.includes('settlement upi') || lower.includes('upi id') || (lower.includes('upi') && lower.includes('registered'))) {
    return raw;
  }
  if (lower.includes('whatsapp') || lower.includes('mobile number') || (lower.includes('phone') && lower.includes('registered'))) {
    return raw;
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password. Please double-check your details and try again.';
  }
  if (lower.includes('signups not allowed') || lower.includes('user not found')) {
    return 'No merchant account registered with this email. Please sign up below.';
  }
  if (
    lower.includes('email is already') || 
    lower.includes('email address is already') || 
    lower.includes('email already') || 
    (lower.includes('account with this email') && lower.includes('exists')) ||
    (lower.includes('user already exists') && !lower.includes('upi') && !lower.includes('phone'))
  ) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link to activate your account.';
  }

  if (
    lower.includes('rate limit') || 
    lower.includes('over_email_send_rate_limit') || 
    lower.includes('too many') || 
    lower.includes('security purposes')
  ) {
    return 'Too many attempts. For your security, please wait a minute before requesting another code.';
  }

  if (lower.includes('magic link email') || lower.includes('error sending') || lower.includes('error sending email')) {
    return 'Email OTP service requires Custom SMTP in Supabase. You can sign up directly with your password below, or log in via the Log In tab.';
  }

  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('load failed')) {
    return 'Connection issue. Please check your internet connection and try again.';
  }
  if (lower.includes('500') || lower.includes('server error') || lower.includes('internal error')) {
    return 'Our server is temporarily busy. Please wait a moment and try again.';
  }

  return raw
    .replace(/\btoken\b/gi, 'verification code')
    .replace(/\bcredentials\b/gi, 'login details')
    .replace(/\bcredential\b/gi, 'login detail')
    .replace(/\bauthenticate\b/gi, 'sign in')
    .replace(/\bauthentication\b/gi, 'sign in')
    .replace(/\bunauthorized\b/gi, 'access denied')
    .replace(/\bjwt\b/gi, 'session')
    .replace(/\bpayload\b/gi, 'information')
    .replace(/\bendpoint\b/gi, 'service');
}

// 6-digit OTP Box Input
function OtpBoxInput({ value, onChange, disabled }) {
  const digits = Array.from({ length: 6 }, (_, i) => (value || '')[i] || '');
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleKey = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = (value || '').split('');
      if (chars[index]) {
        chars[index] = '';
        onChange(chars.join(''));
      } else if (index > 0) {
        chars[index - 1] = '';
        onChange(chars.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleInput = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      const chars = (value || '').split('');
      chars[index] = '';
      onChange(chars.join(''));
      return;
    }

    if (raw.length > 1) {
      const pasted = raw.slice(0, 6);
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    const char = raw.slice(-1);
    const chars = (value || '').split('');
    chars[index] = char;
    const next = chars.join('').slice(0, 6);
    onChange(next);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="grid grid-cols-6 gap-2 w-full">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onClick={e => e.target.select()}
          placeholder={d ? '' : '·'}
          className={`auth-input h-11 sm:h-12 w-full text-center font-mono font-extrabold text-[17px] sm:text-[19px] rounded-xl transition-all ${
            d
              ? 'border-[#0F2BFF] dark:border-[#60A5FA] bg-white dark:bg-[#161D2B] text-[#0F2BFF] dark:text-[#60A5FA]'
              : 'theme-bg-well theme-text-primary'
          } disabled:opacity-50`}
        />
      ))}
    </div>
  );
}

// Scoped Redesign Styles (Semantic variables, Anton, Barlow, JetBrains, ceramic phone, animations)
const REDESIGN_CSS = `
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #EEF1FB;
  --bg-elevated: #FFFFFF;
  --bg-well: #F7F8FD;
  --bg-left-panel: #EAEEFA;
  --text-primary: #090A10;
  --text-secondary: #222533;
  --text-muted: #5A607A;
  --accent-link: #0F2BFF;
  --border-color: #DCE2F2;
  --card-shadow: 0 18px 44px -12px rgba(15, 23, 42, 0.08), 0 4px 14px -4px rgba(15, 43, 255, 0.04);
  --phone-screen-bg: #FFFFFF;
  --phone-card-bg: #F4F6FC;
  --phone-card-border: #E2E6F4;
}

html.dark {
  --bg-primary: #101624;
  --bg-secondary: #161F30;
  --bg-elevated: #182235;
  --bg-well: #0E1420;
  --bg-left-panel: #0A0E17;
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --accent-link: #60A5FA;
  --border-color: #243049;
  --card-shadow: 0 22px 54px -12px rgba(0, 0, 0, 0.65);
  --phone-screen-bg: #0D1322;
  --phone-card-bg: #151E32;
  --phone-card-border: #24324F;
}

.left-showcase-panel {
  background-color: var(--bg-left-panel);
  color: var(--text-primary);
  background-size: 48px 48px;
  background-image:
    linear-gradient(to right, rgba(15, 43, 255, 0.055) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 43, 255, 0.055) 1px, transparent 1px);
  transition: background-color 0.25s ease, color 0.25s ease;
}
html.dark .left-showcase-panel {
  background-image:
    linear-gradient(to right, rgba(96, 165, 250, 0.07) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(96, 165, 250, 0.07) 1px, transparent 1px);
}

.theme-bg-primary { background-color: var(--bg-primary); }
.theme-bg-secondary { background-color: var(--bg-secondary); }
.theme-bg-elevated { background-color: var(--bg-elevated); }
.theme-bg-well { background-color: var(--bg-well); }
.theme-text-primary { color: var(--text-primary); }
.theme-text-secondary { color: var(--text-secondary); }
.theme-text-muted { color: var(--text-muted); }
.theme-link { color: var(--accent-link); }
.theme-border { border-color: var(--border-color); }
.theme-card-shadow { box-shadow: var(--card-shadow); }

.headline-anton {
  font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif !important;
  font-weight: 400;
  text-transform: uppercase;
  line-height: 0.96;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

.tabular-nums-stat {
  font-family: 'Barlow Condensed', 'Anton', sans-serif !important;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

@keyframes gridBeamTravel {
  0%   { transform: translateY(-100%); opacity: 0; }
  30%  { opacity: 0.85; }
  70%  { opacity: 0.85; }
  100% { transform: translateY(600%); opacity: 0; }
}
.grid-beam-v {
  animation: gridBeamTravel 6s linear infinite;
}

@keyframes spinOrbitSlow {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes spinOrbitReverse {
  from { transform: translate(-50%, -50%) rotate(360deg); }
  to   { transform: translate(-50%, -50%) rotate(0deg); }
}
.orbit-ring-cw {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 9999px;
  border: 1.5px dashed rgba(15, 43, 255, 0.22);
  animation: spinOrbitSlow 28s linear infinite;
  pointer-events: none;
}
.orbit-ring-ccw {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 9999px;
  border: 1px solid rgba(255, 110, 0, 0.22);
  animation: spinOrbitReverse 20s linear infinite;
  pointer-events: none;
}
html.dark .orbit-ring-cw { border-color: rgba(96, 165, 250, 0.25); }
html.dark .orbit-ring-ccw { border-color: rgba(255, 158, 27, 0.25); }

.clay-iphone-auth {
  position: relative;
  width: 284px;
  height: 552px;
  background-color: #F6F7FD;
  border-radius: 46px;
  padding: 13px;
  box-shadow:
    inset 0 2px 4px #FFFFFF,
    inset 0 -3px 6px rgba(160, 168, 200, 0.38),
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.96),
    -22px 26px 50px rgba(20, 24, 80, 0.14),
    0 10px 24px rgba(20, 24, 80, 0.06);
  user-select: none;
  flex-shrink: 0;
  will-change: transform;
  transform-style: preserve-3d;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, background-color 0.3s ease;
}
html.dark .clay-iphone-auth {
  background-color: #1C2334;
  box-shadow:
    inset 0 1.5px 3px rgba(255, 255, 255, 0.25),
    inset 0 -3px 6px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.12),
    -22px 26px 52px rgba(0, 0, 0, 0.72),
    0 10px 24px rgba(0, 0, 0, 0.52);
}

@keyframes clayFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-8px) rotate(0.4deg); }
}
.clay-float {
  animation: clayFloat 5.8s ease-in-out infinite;
}

.clay-side-silent,
.clay-side-vol-up,
.clay-side-vol-down {
  position: absolute;
  left: -3px;
  width: 3px;
  background-color: #DDE1F0;
  border-radius: 3px 0 0 3px;
}
.clay-side-silent { top: 88px; height: 22px; }
.clay-side-vol-up { top: 124px; height: 40px; }
.clay-side-vol-down { top: 174px; height: 40px; }

.clay-side-power {
  position: absolute;
  right: -3px;
  top: 140px;
  width: 3px;
  height: 58px;
  background-color: #DDE1F0;
  border-radius: 0 3px 3px 0;
}
html.dark .clay-side-silent,
html.dark .clay-side-vol-up,
html.dark .clay-side-vol-down,
html.dark .clay-side-power {
  background-color: #334155;
}

.clay-screen-auth {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--phone-screen-bg);
  border-radius: 35px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.clay-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 21px;
  background-color: var(--phone-screen-bg);
  border-radius: 0 0 14px 14px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.clay-speaker {
  width: 32px;
  height: 3.5px;
  background: #CBD5E1;
  border-radius: 99px;
}
html.dark .clay-speaker { background: #334155; }

.clay-camera {
  width: 5.5px;
  height: 5.5px;
  background: #94A3B8;
  border-radius: 99px;
}
html.dark .clay-camera { background: #475569; }

@keyframes qrScanLine {
  0%, 100% { top: 10%; opacity: 0.25; }
  50%      { top: 86%; opacity: 0.95; }
}
.qr-laser-line {
  position: absolute;
  left: 8%;
  right: 8%;
  height: 2px;
  background-color: #0F2BFF;
  box-shadow: 0 0 8px rgba(15, 43, 255, 0.6);
  animation: qrScanLine 3.2s ease-in-out infinite;
  pointer-events: none;
}

.btn-editorial {
  position: relative;
  overflow: hidden;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, background-color 0.2s ease;
}
.btn-editorial::after {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 65%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  transform: skewX(-20deg);
  transition: left 0.55s ease;
  pointer-events: none;
}
.btn-editorial:hover:not(:disabled)::after {
  left: 135%;
}
.btn-editorial:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px -6px rgba(15, 43, 255, 0.48);
}
.btn-editorial:active:not(:disabled) {
  transform: translateY(0px) scale(0.99);
}

.btn-arrow-icon {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-editorial:hover .btn-arrow-icon {
  transform: translateX(4px);
}

.auth-input {
  background-color: var(--bg-well);
  border: 1.5px solid var(--border-color);
  color: var(--text-primary);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}
.auth-input:focus {
  outline: none;
  border-color: #0F2BFF;
  background-color: var(--bg-elevated);
  box-shadow: 0 0 0 3.5px rgba(15, 43, 255, 0.13);
}
html.dark .auth-input:focus {
  border-color: #60A5FA;
  box-shadow: 0 0 0 3.5px rgba(96, 165, 250, 0.18);
}

@keyframes popInBanner {
  0%   { opacity: 0; transform: translateY(-6px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.banner-enter {
  animation: popInBanner 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes spinLoader {
  to { transform: rotate(360deg); }
}
.spinner-ring {
  width: 18px;
  height: 18px;
  border: 2.4px solid rgba(255, 255, 255, 0.35);
  border-top-color: #FFFFFF;
  border-radius: 9999px;
  animation: spinLoader 0.7s linear infinite;
}
`;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [authTab, setAuthTab] = useState('whatsapp'); // 'whatsapp' | 'email' | 'password'
  const [theme, setTheme] = useState('light');

  // WhatsApp OTP Health & Dynamic Fallback
  const [isWaDegraded, setIsWaDegraded] = useState(false);
  const [waDegradedReason, setWaDegradedReason] = useState('');

  // Email OTP
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailTimer, setEmailTimer] = useState(45);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Phone / WhatsApp OTP (Default login method)
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMethod, setOtpMethod] = useState('whatsapp');
  const [otpTimer, setOtpTimer] = useState(45);

  // Dedicated Signup WhatsApp Phone OTP
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneTimer, setPhoneTimer] = useState(45);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Recovery / Reset Mode
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Registration Fields (Signup only)
  const [businessName, setBusinessName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [noWebsite, setNoWebsite] = useState(false);
  const [isOAuthSignup, setIsOAuthSignup] = useState(false);
  const [oauthUserId, setOauthUserId] = useState(null);
  const [oauthStep, setOauthStep] = useState(1);
  const [stepDirection, setStepDirection] = useState('forward');

  // Real-time strong password criteria calculation
  const passwordCriteria = useMemo(() => getPasswordCriteria(password), [password]);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Left Panel Phone Simulation State
  const [phoneVerifiedText, setPhoneVerifiedText] = useState('Auto-Verify Active');

  // QR Express Login Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTimer, setQrTimer] = useState(45);
  const [qrChallenge, setQrChallenge] = useState('mymob-auth-session');
  const { isMounted: isQrModalMounted, modalClass: qrModalClass, overlayClass: qrOverlayClass } = useModalTransition(showQrModal);

  // Legal Agreement & Operational Guidelines Acceptance (Mandatory Explicit Consent)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('direct');

  // Synchronous refs
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isRegistrationSubmittedRef = useRef(false);
  const isRedirectingRef = useRef(false);
  const isOAuthSignupRef = useRef(isOAuthSignup);
  isOAuthSignupRef.current = isOAuthSignup;
  const isEmailOtpVerifyingRef = useRef(false);

  // Handle URL query parameters & recovery hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'signup') {
        setMode('signup');
      } else if (params.get('mode') === 'reset' || window.location.hash.includes('type=recovery')) {
        setMode('reset');
      }

      // Sync theme with localStorage
      try {
        const savedTheme = localStorage.getItem('mymobpay_theme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    }
  }, []);

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('mymobpay_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  // Supabase Auth State Change Listener
  useEffect(() => {
    const handleAuthRedirect = async (session, isExplicitOAuthRedirect = false) => {
      if (!session?.user) return;
      if (isRedirectingRef.current) return;
      if (modeRef.current === 'reset') return;
      if (isRegistrationSubmittedRef.current) return;

      const hasUrlGoogleFlag = typeof window !== 'undefined' && window.location.search.includes('googleAuth=true');

      setLoading(true);
      setError('');

      try {
        const verifyRes = await fetch('/api/auth/verify-registration-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
          }),
        });

        const verifyData = await verifyRes.json();

        const isAlreadyRegistered = Boolean(
          verifyData &&
          verifyData.allowed &&
          (
            verifyData.isAdmin ||
            verifyData.registered ||
            (verifyData.isComplete || !verifyData.needsRegistration)
          )
        );

        if (isAlreadyRegistered) {
          isRedirectingRef.current = true;
          setMessage(modeRef.current === 'signup' 
            ? 'Account already registered with this email. Launching your merchant dashboard...' 
            : 'Authenticated successfully! Launching merchant dashboard...');
          let target = '/dashboard';
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            target = getSafeRedirectUrl(params.get('redirect'), '/dashboard');
            if (window.location.search.includes('googleAuth=true')) {
              window.history.replaceState({}, '', '/login');
            }
            window.location.href = target;
          } else {
            router.replace(target);
          }
          return;
        }

        if (verifyData && !verifyData.isAdmin && (verifyData.needsRegistration === true || !verifyData.registered)) {
          if (!hasUrlGoogleFlag && !isExplicitOAuthRedirect) {
            if (modeRef.current === 'signup' && !isOAuthSignupRef.current) {
              setIsEmailVerified(true);
              setLoading(false);
              setMessage('');
              setError('');
              isRedirectingRef.current = false;
              return;
            }

            // Do not discard authentic sessions; let them enter signup wizard or dashboard
            setMode('signup');
            setIsOAuthSignup(true);
            setOauthStep(1);
            setOauthUserId(session.user.id);
            setEmail(session.user.email || '');
            setIsEmailVerified(true);
            setLoading(false);
            setMessage('');
            setError('');
            isRedirectingRef.current = false;
            return;
          }

          setMode('signup');
          setIsOAuthSignup(true);
          setOauthStep(1);
          setOauthUserId(session.user.id);
          setEmail(session.user.email || '');
          setIsEmailVerified(true);
          if (verifyData.businessName) setBusinessName(verifyData.businessName);
          if (verifyData.phoneNumber) setPhone(verifyData.phoneNumber);
          if (verifyData.upiId && verifyData.upiId !== 'pending@upi') setUpiId(verifyData.upiId);
          if (verifyData.websiteUrl) setWebsiteUrl(verifyData.websiteUrl);
          setMessage('');
          setError('');
          setLoading(false);
          isRedirectingRef.current = false;
          if (typeof window !== 'undefined' && window.location.search.includes('googleAuth=true')) {
            window.history.replaceState({}, '', '/login');
          }
          return;
        }

        setError(verifyData?.error || 'Could not verify merchant account. Please try again.');
        setLoading(false);
        isRedirectingRef.current = false;
      } catch (checkErr) {
        console.error('Registration verification error:', checkErr);
        setError('Could not verify account authorization. Please try signing in again.');
        setLoading(false);
        isRedirectingRef.current = false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        return;
      }
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        const isExplicit = typeof window !== 'undefined' && window.location.search.includes('googleAuth=true');
        handleAuthRedirect(session, isExplicit);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && modeRef.current !== 'reset') {
        const isExplicit = typeof window !== 'undefined' && window.location.search.includes('googleAuth=true');
        handleAuthRedirect(session, isExplicit);
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  // WhatsApp OTP Delivery Health Check & Dynamic Fallback Probe
  useEffect(() => {
    let isMounted = true;

    const probeWhatsAppHealth = async () => {
      if (typeof window !== 'undefined') {
        try {
          const degradedUntil = localStorage.getItem('mmp_wa_degraded_until');
          if (degradedUntil && Date.now() < Number(degradedUntil)) {
            setIsWaDegraded(true);
            setAuthTab('email');
          }
        } catch (e) {}
      }

      try {
        const res = await fetch('/api/auth/whatsapp-otp/status');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.isDegraded || data.primaryOption === 'email') {
          setIsWaDegraded(true);
          setWaDegradedReason(data.reason || 'WhatsApp delivery experiencing service interruption');
          setAuthTab('email');
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('mmp_wa_degraded_until', String(Date.now() + 15 * 60 * 1000));
            } catch (e) {}
          }
        } else {
          if (typeof window !== 'undefined') {
            const degradedUntil = localStorage.getItem('mmp_wa_degraded_until');
            if (!degradedUntil || Date.now() >= Number(degradedUntil)) {
              localStorage.removeItem('mmp_wa_degraded_until');
              setIsWaDegraded(false);
            }
          }
        }
      } catch (err) {
        console.warn('WhatsApp health check warning:', err);
      }
    };

    probeWhatsAppHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-dismiss transient feedback messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Email OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (emailOtpSent && emailTimer > 0) {
      interval = setInterval(() => setEmailTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [emailOtpSent, emailTimer]);

  // WhatsApp OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // WhatsApp Phone OTP countdown timer (Signup)
  useEffect(() => {
    let interval = null;
    if (phoneOtpSent && phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneOtpSent, phoneTimer]);

  // QR refresh timer
  useEffect(() => {
    let interval = null;
    if (showQrModal) {
      interval = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            setQrChallenge('mymob-auth-' + crypto.randomUUID());
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setQrTimer(45);
    }
    return () => clearInterval(interval);
  }, [showQrModal]);

  // Interactive Phone QR Simulation in Left Panel
  const handleSimulatePhoneQrScan = () => {
    setPhoneVerifiedText('UTR #4391882014 Verified ✓');
    setMessage('Live P2P QR Checkout verified! Zero gateway fee deducted.');
    setTimeout(() => {
      setPhoneVerifiedText('Auto-Verify Active');
    }, 2800);
  };

  const handlePhoneMouseMove = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    const phoneEl = e.currentTarget;
    const rect = phoneEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    phoneEl.style.animationPlayState = 'paused';
    phoneEl.style.transform = `perspective(950px) rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg) translateY(-5px)`;
  };

  const handlePhoneMouseLeave = (e) => {
    const phoneEl = e.currentTarget;
    phoneEl.style.transform = '';
    phoneEl.style.animationPlayState = 'running';
  };

  // WhatsApp OTP Flow
  const triggerOtpFlow = useCallback(async (method = otpMethod) => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    setOtpMethod(method);

    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.secondsLeft) {
          setOtpTimer(data.secondsLeft);
          setOtpSent(true);
        }

        if (data.fallbackToEmail || res.status === 502) {
          setIsWaDegraded(true);
          setWaDegradedReason(data.error || 'WhatsApp delivery unavailable');
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('mmp_wa_degraded_until', String(Date.now() + 15 * 60 * 1000));
            } catch (e) {}
          }
          setAuthTab('email');
          if (data.suggestedEmail) {
            setEmail(data.suggestedEmail);
          }
          setError(data.error || 'WhatsApp delivery is currently delayed. Automatically switched to Email OTP.');
          return;
        }

        setError(data.error || 'Failed to send OTP.');
        return;
      }

      setOtpSent(true);
      setOtp('');
      setOtpTimer(45);
      setIsWaDegraded(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('mmp_wa_degraded_until');
        } catch (e) {}
      }
      setMessage(data.message || `OTP sent to +91 ${cleanPhone} via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`);
    } catch (err) {
      console.error('WhatsApp OTP send error:', err);
      setError(err?.message || 'Network error. Please check your connection or switch to Email OTP.');
    } finally {
      setLoading(false);
    }
  }, [phone, otpMethod]);

  // Email OTP Flow
  const handleSendEmailOtp = async () => {
    let rawIdentifier = email.trim();
    if (!rawIdentifier) {
      setError('Please enter your merchant email or Merchant ID.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      let cleanEmail = rawIdentifier.toLowerCase();

      if (!cleanEmail.includes('@')) {
        const resolveRes = await fetch('/api/auth/resolve-identifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: rawIdentifier }),
        });
        const resolveData = await resolveRes.json();
        if (!resolveRes.ok || !resolveData?.email) {
          throw new Error(resolveData?.error || `No merchant account found for ID "${rawIdentifier}". Please check your ID or enter your registered email.`);
        }
        cleanEmail = resolveData.email.toLowerCase();
        setEmail(cleanEmail);
      }

      if (mode === 'signup') {
        const checkRes = await fetch('/api/auth/check-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok || checkData.available === false) {
          setError(checkData.error || 'This email address is already registered. Please log in instead.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          type: 'otp',
          purpose: mode === 'signup' ? 'signup' : 'login',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send verification code. Please try again.');
      }

      const finalEmail = data.email || cleanEmail;
      setEmail(finalEmail);
      setEmailOtpSent(true);
      setEmailOtp('');
      setEmailTimer(45);
      setMessage(data.message || `6-digit verification code sent to ${finalEmail}. Check your inbox!`);
    } catch (err) {
      console.error('Email OTP send error:', err);
      setError(formatCustomerError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    let cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@')) {
      try {
        const resolveRes = await fetch('/api/auth/resolve-identifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email.trim() }),
        });
        const resolveData = await resolveRes.json();
        if (resolveData?.email) {
          cleanEmail = resolveData.email.toLowerCase();
          setEmail(cleanEmail);
        }
      } catch (e) {}
    }

    setError('');
    setMessage('');
    setLoading(true);
    isEmailOtpVerifyingRef.current = true;

    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: emailOtp.trim(),
        type: 'email',
      });

      if (verifyErr) {
        setError(formatCustomerError(verifyErr));
        setEmailOtp('');
        return;
      }

      if (mode === 'signup') {
        setIsEmailVerified(true);
        setMessage('Email verified successfully! Complete the form below to finish registration.');
      } else {
        setMessage('Email verified! Opening your merchant dashboard...');
        setTimeout(() => {
          let target = '/dashboard';
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            target = getSafeRedirectUrl(params.get('redirect'), '/dashboard');
            window.location.href = target;
          } else {
            router.push(target);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Email OTP verify error:', err);
      setError(formatCustomerError(err));
    } finally {
      isEmailOtpVerifyingRef.current = false;
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'OTP verification failed.');
        if (data.remaining !== undefined) setOtp('');
        return;
      }

      if (!data.accountExists) {
        setError('');
        setMessage('Phone verified! No merchant account found. Please sign up below.');
        setOtpSent(false);
        setOtp('');
        setMode('signup');
        return;
      }

      setMessage('WhatsApp OTP verified! Signing you in...');
      if (data.tokenHash) {
        try {
          await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink',
          });
        } catch (sessEx) {
          console.warn('verifyOtp error:', sessEx);
        }
      }
      setTimeout(() => {
        let target = '/dashboard';
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          target = getSafeRedirectUrl(params.get('redirect'), '/dashboard');
          window.location.href = target;
        } else {
          router.push(target);
        }
      }, 500);
    } catch (err) {
      setError(err?.message || 'Network error during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setAuthTab('email');
      setError('Switched to Email OTP. Enter your email above to receive a login code.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=reset`,
      });
      if (resetErr) throw resetErr;
      setMessage('Password reset link dispatched! Please check your email inbox.');
    } catch (err) {
      setError(err.message || 'Could not send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNewPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      setMessage('Password updated successfully! Launching your merchant dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err?.message || 'Could not update password. Please try requesting a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Multi-Step Handlers
  const handleNextOAuthStep = async () => {
    setError('');
    if (oauthStep === 1) {
      const pwdCheck = validateStrongPassword(password);
      if (!pwdCheck.valid) {
        setError(pwdCheck.error);
        return;
      }
      setStepDirection('forward');
      setOauthStep(2);
    } else if (oauthStep === 2) {
      if (!businessName.trim() || businessName.trim().length < 2) {
        setError('Please enter a valid Business or Brand name (at least 2 characters).');
        return;
      }
      setStepDirection('forward');
      setOauthStep(3);
    } else if (oauthStep === 3) {
      const cleanWeb = websiteUrl.trim();
      if (!noWebsite && cleanWeb) {
        const domainPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
        if (!domainPattern.test(cleanWeb)) {
          setError('Please enter a valid website URL (e.g. acmestudio.com) or click "Skip for now".');
          return;
        }
      }
      setStepDirection('forward');
      setOauthStep(4);
    } else if (oauthStep === 4) {
      const cleanUpi = upiId.trim().toLowerCase();
      if (!cleanUpi.includes('@') || cleanUpi.length < 5) {
        setError('Please enter a valid Settlement UPI ID (e.g. store@okhdfcbank).');
        return;
      }
      setLoading(true);
      try {
        const checkRes = await fetch('/api/auth/check-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upiId: cleanUpi, userId: oauthUserId || undefined }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok || checkData.available === false) {
          setError(checkData.error || 'Settlement UPI ID is already registered by another merchant.');
          setLoading(false);
          return;
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
      setStepDirection('forward');
      setOauthStep(5);
    } else if (oauthStep === 5) {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
        return;
      }
      if (!termsAccepted) {
        setError('Please review and accept the Terms of Service, Legal Agreement, and Merchant Operating Rules to continue.');
        return;
      }
      handleAuth('signup');
    }
  };

  const handlePrevOAuthStep = () => {
    setError('');
    if (oauthStep > 1) {
      setStepDirection('backward');
      setOauthStep(prev => prev - 1);
    }
  };

  const handleSignOutToSwitchAccount = async () => {
    const discardingUserId = oauthUserId;
    const discardingEmail = email;
    setLoading(true);

    if (discardingUserId || discardingEmail) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          await fetch('/api/auth/cleanup-incomplete-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: discardingUserId, email: discardingEmail }),
          });
        }
      } catch (cleanErr) {
        console.warn('Cleanup incomplete signup notice:', cleanErr);
      }
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {}

    setIsOAuthSignup(false);
    setOauthUserId(null);
    setEmail('');
    setPassword('');
    setBusinessName('');
    setWebsiteUrl('');
    setNoWebsite(false);
    setPhone('');
    setUpiId('');
    setOauthStep(1);
    setIsEmailVerified(false);
    setMode('signup');
    setError('');
    setMessage('');
    setLoading(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/login');
    }
  };

  // Main Form Submit Handler
  const handleAuth = async (action) => {
    if (loading || isRedirectingRef.current || (action === 'signup' && isRegistrationSubmittedRef.current)) {
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (action === 'signup') {
      const pwdCheck = validateStrongPassword(password);
      if (!pwdCheck.valid) {
        setError(pwdCheck.error);
        return;
      }

      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
        return;
      }

      if (!businessName.trim()) {
        setError('Please enter your Business / Brand Name to complete your merchant registration.');
        return;
      }

      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid Settlement UPI ID (e.g. store@upi, name@okhdfcbank) where customer payments will route.');
        return;
      }

      if (!termsAccepted) {
        isRegistrationSubmittedRef.current = false;
        setError('Please review and accept the Terms of Service, Legal Agreement, and Merchant Operating Rules to continue.');
        return;
      }

      try {
        const checkRes = await fetch('/api/auth/check-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            phone: cleanPhone,
            upiId: upiId.trim().toLowerCase(),
            userId: oauthUserId || undefined,
          }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok || checkData.available === false) {
          isRegistrationSubmittedRef.current = false;
          setError(checkData.error || 'Some details are already registered. Please check email, mobile number, or UPI ID.');
          return;
        }
      } catch (checkErr) {
        console.warn('Registration pre-check error:', checkErr);
      }

      if (!isEmailVerified && !isOAuthSignup) {
        if (emailOtpSent && emailOtp.length === 6) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: emailOtp.trim(),
            type: 'email',
          });
          if (verifyErr) {
            isRegistrationSubmittedRef.current = false;
            setError(formatCustomerError(verifyErr));
            return;
          }
          setIsEmailVerified(true);
        } else {
          isRegistrationSubmittedRef.current = false;
          setError('Please verify your merchant email address with the 6-digit OTP code before creating your account.');
          return;
        }
      }

      isRegistrationSubmittedRef.current = true;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (action === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            businessName: businessName.trim(),
            upiId: upiId.trim(),
            phone: phone.trim(),
            websiteUrl: noWebsite ? '' : websiteUrl.trim(),
            userId: oauthUserId || null,
            termsAccepted: Boolean(termsAccepted),
            termsVersion: '2026-v2.5',
            termsAcceptedAt: new Date().toISOString(),
          }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch (jsonErr) {
          throw new Error(`Server returned status ${res.status} (${res.statusText || 'No status text'})`);
        }

        if (!res.ok || data.error) {
          throw new Error(data.error || `Registration failed (HTTP ${res.status})`);
        }

        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.warn('[REGISTER] Signout notice after registration:', signOutErr);
        }

        isRedirectingRef.current = false;
        isRegistrationSubmittedRef.current = false;
        setIsOAuthSignup(false);
        setOauthStep(1);
        setOauthUserId(null);

        setPassword('');
        setConfirmPassword('');
        setBusinessName('');
        setWebsiteUrl('');
        setPhone('');
        setUpiId('');
        setNoWebsite(false);
        setIsEmailVerified(false);
        setEmailOtp('');
        setEmailOtpSent(false);

        setMode('signin');
        setAuthTab('password');
        setError('');
        setMessage('Signup successful! Please login.');

        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/login');
        }
        try {
          router.replace('/login');
        } catch (rErr) {}
        return;

      } else if (action === 'signin') {
        let loginEmail = email.trim();

        if (!loginEmail.includes('@')) {
          try {
            const res = await fetch('/api/auth/resolve-identifier', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: loginEmail }),
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData?.email) {
                loginEmail = resData.email;
              }
            }
          } catch (resErr) {
            console.warn('Could not resolve merchant ID to email:', resErr);
          }
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Invalid email/merchant ID or password. If you are new, click "Sign Up" above.');
          }
          throw new Error(authError.message || 'Invalid login credentials.');
        }

        setMessage('Welcome back! Launching your merchant dashboard...');
        let target = '/dashboard';
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          target = getSafeRedirectUrl(params.get('redirect'), '/dashboard');
        }
        setTimeout(() => {
          window.location.href = target;
        }, 500);
      }
    } catch (err) {
      isRegistrationSubmittedRef.current = false;
      console.error('Auth handler error:', err);
      const exactMessage = err?.message || err?.toString() || 'Could not sign in. Please try again.';
      setError(formatCustomerError(exactMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login?googleAuth=true`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(formatCustomerError(err?.message || 'Could not sign in with Google. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col selection:bg-[#0F2BFF] selection:text-white theme-bg-primary theme-text-secondary">
      <style dangerouslySetInnerHTML={{ __html: REDESIGN_CSS }} />

      {/* ===================================================================== */}
      {/* SPLIT-SCREEN AUTHENTICATION WORKSPACE (STATIC LEFT, SCROLLABLE RIGHT) */}
      {/* ===================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen lg:h-screen lg:overflow-hidden">

        {/* =================================================================== */}
        {/* LEFT PANEL (7 COLS ON DESKTOP): LAVENDER-ICE SHOWCASE + 3D PHONE    */}
        {/* =================================================================== */}
        <section className="hidden lg:flex lg:col-span-7 h-screen overflow-hidden relative left-showcase-panel border-r theme-border px-8 xl:px-14 py-7 flex-col justify-between order-2 lg:order-1">

          {/* Traveling Blueprint Grid Light Beams */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="grid-beam-v absolute left-[18%] top-0 w-[1.5px] h-28 bg-[#0F2BFF]/25"></div>
            <div className="grid-beam-v absolute left-[82%] top-0 w-[1.5px] h-28 bg-[#0F2BFF]/20" style={{ animationDelay: '2.8s' }}></div>
          </div>

          {/* Top Row: Single Brand Logo (Left Panel) */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group focus:outline-none">
              <span className="w-10 h-10 rounded-xl bg-white dark:bg-[#161D2B] border theme-border shadow-xs flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                <MyMobPayLogoMark className="w-full h-full" id="left-logo" />
              </span>
              <span className="font-sans font-extrabold text-[19px] tracking-tight theme-text-primary">
                MyMob<span className="text-[#0F2BFF] dark:text-[#60A5FA]">Pay</span>
              </span>
            </Link>
          </div>

          {/* Center Content: Editorial Copy (Left) + Sculpted 3D QR iPhone (Right) */}
          <div className="relative z-10 my-auto py-2 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">

            {/* Left Copy Column */}
            <div className="xl:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full theme-bg-elevated border theme-border shadow-2xs mb-5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] theme-text-primary">
                  DIRECT P2P SETTLEMENTS &bull; 0% FEE
                </span>
              </div>

              <h1 className="headline-anton text-[42px] xl:text-[50px] tracking-[0.01em] select-none space-y-0.5">
                <span className="block theme-text-primary">BUILT FOR</span>
                <span className="block theme-text-primary">FOUNDERS</span>
                <span className="block text-[#0F2BFF] dark:text-[#60A5FA]">DEFYING ALL ODDS.</span>
              </h1>

              <p className="mt-4 max-w-[400px] text-[14px] xl:text-[14.5px] theme-text-secondary leading-relaxed">
                Join thousands of businesses managing billing programmatically with flat-rate subscriptions and <strong className="font-bold theme-text-primary">0% gateway cuts</strong>.
              </p>

              {/* 3 Clean Feature Checkpoints */}
              <ul className="mt-6 space-y-3 text-[13px] font-semibold theme-text-primary">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Zero transaction cuts on monthly volumes</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0F2BFF]/12 text-[#0F2BFF] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>HMAC-SHA256 signed developer webhooks</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FF6E00]/15 text-[#FF6E00] flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Risk-free sandbox simulation active</span>
                </li>
              </ul>
            </div>

            {/* Right 3D iPhone Column */}
            <div className="xl:col-span-6 flex justify-center relative">
              <div className="relative flex items-center justify-center">

                {/* Counter-Rotating Orbital Payment Rings */}
                <div className="orbit-ring-cw hidden sm:block w-[320px] h-[320px]">
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#0F2BFF]"></span>
                </div>
                <div className="orbit-ring-ccw hidden sm:block w-[360px] h-[360px]">
                  <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FF6E00]"></span>
                </div>

                {/* Sculpted 3D Ceramic / Titanium iPhone */}
                <div 
                  className="clay-iphone-auth clay-float relative z-10 cursor-pointer" 
                  onMouseMove={handlePhoneMouseMove}
                  onMouseLeave={handlePhoneMouseLeave}
                  onClick={handleSimulatePhoneQrScan}
                  title="Click to simulate instant UTR verification"
                >
                  <div className="clay-side-silent"></div>
                  <div className="clay-side-vol-up"></div>
                  <div className="clay-side-vol-down"></div>
                  <div className="clay-side-power"></div>

                  <div className="clay-screen-auth">
                    <div className="clay-notch">
                      <div className="clay-speaker"></div>
                      <div className="clay-camera"></div>
                    </div>

                    {/* Top Bar & Checkout Header */}
                    <div className="relative z-10">
                      <div className="pt-2 px-5 flex items-center justify-between text-[9.5px] font-bold theme-text-primary">
                        <span>10:42 AM</span>
                        <span className="font-mono text-[9px] theme-text-muted">5G &bull; 100%</span>
                      </div>

                      <div className="mt-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full theme-bg-well border theme-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                          <span className="font-mono text-[9px] font-bold uppercase tracking-wider theme-text-primary">
                            Direct Bank Checkout
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center Total Due + Dynamic QR Card */}
                    <div className="relative z-10 px-3.5 space-y-2.5">
                      <div className="rounded-2xl p-3 theme-bg-well border theme-border">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold theme-text-muted">Total Due</span>
                          <span className="font-mono text-[8.5px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#0F2BFF]/12 text-[#0F2BFF] dark:text-[#60A5FA]">
                            P2P Route
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-baseline justify-between">
                          <div className="tabular-nums-stat text-[26px] leading-none theme-text-primary">
                            &#8377;500.00
                          </div>
                          <span className="font-mono text-[9px] text-[#10B981] font-bold">
                            &#8377;0.00 Fee
                          </span>
                        </div>
                      </div>

                      {/* Dynamic QR Code Container */}
                      <div className="rounded-2xl bg-white border border-[#E2E5F4] p-3 text-center shadow-xs relative">
                        <div className="relative w-[156px] h-[156px] mx-auto p-2 rounded-xl bg-white border border-[#E2E5F4] flex items-center justify-center group">
                          {/* Corner Framing Brackets */}
                          <span className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#0F2BFF] rounded-tl"></span>
                          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#0F2BFF] rounded-tr"></span>
                          <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#0F2BFF] rounded-bl"></span>
                          <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#0F2BFF] rounded-br"></span>

                          {/* Animated Laser Scan Line */}
                          <div className="qr-laser-line"></div>

                          {/* Crisp Vector QR Matrix */}
                          <svg className="w-full h-full text-[#090A10]" viewBox="0 0 120 120" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M8 8h32v32H8V8zm6 6v20h20V14H14z"/>
                            <rect x="18" y="18" width="12" height="12" rx="1.5"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M80 8h32v32H80V8zm6 6v20h20V14H86z"/>
                            <rect x="90" y="18" width="12" height="12" rx="1.5"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M8 80h32v32H8V80zm6 6v20h20V86H14z"/>
                            <rect x="18" y="90" width="12" height="12" rx="1.5"/>
                            <rect x="48" y="10" width="6" height="6" rx="1"/>
                            <rect x="60" y="10" width="10" height="6" rx="1"/>
                            <rect x="48" y="22" width="10" height="6" rx="1"/>
                            <rect x="64" y="22" width="6" height="12" rx="1"/>
                            <rect x="10" y="48" width="12" height="6" rx="1"/>
                            <rect x="28" y="48" width="6" height="12" rx="1"/>
                            <rect x="10" y="62" width="6" height="10" rx="1"/>
                            <rect x="22" y="66" width="12" height="6" rx="1"/>
                            <rect x="82" y="48" width="10" height="6" rx="1"/>
                            <rect x="98" y="48" width="12" height="6" rx="1"/>
                            <rect x="86" y="60" width="6" height="12" rx="1"/>
                            <rect x="102" y="62" width="8" height="8" rx="1"/>
                            <rect x="48" y="82" width="12" height="6" rx="1"/>
                            <rect x="66" y="82" width="6" height="12" rx="1"/>
                            <rect x="48" y="96" width="6" height="14" rx="1"/>
                            <rect x="60" y="102" width="14" height="8" rx="1"/>
                            <rect x="82" y="82" width="14" height="6" rx="1"/>
                            <rect x="102" y="82" width="8" height="14" rx="1"/>
                            <rect x="82" y="96" width="12" height="14" rx="1"/>
                            <rect x="100" y="102" width="10" height="8" rx="1"/>
                          </svg>

                          {/* Center UPI Badge */}
                          <div className="absolute w-8 h-8 rounded-lg bg-[#0F2BFF] text-white shadow-md flex items-center justify-center font-mono text-[9px] font-extrabold tracking-tight border-2 border-white group-hover:scale-110 transition-transform">
                            UPI
                          </div>
                        </div>

                        {/* Auto-Verify Status Pill */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#10B981]/12 text-[#059669] font-mono text-[9px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                          <span>{phoneVerifiedText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Phone Footer */}
                    <div className="relative z-10 pb-2 pt-1 text-center">
                      <div className="font-mono text-[8px] theme-text-muted">
                        Direct Bank Settlement &bull; <strong className="theme-text-primary">0% Fee</strong>
                      </div>
                      <div className="w-16 h-1 rounded-full bg-[#CBD5E1] dark:bg-[#334155] mx-auto mt-1"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Row: Clean Copyright Footer */}
          <div className="relative z-10 flex items-center justify-between gap-2 pt-3 border-t theme-border text-[11px] font-mono theme-text-muted">
            <span>&copy; 2026 MyMobPay &bull; Secure B2B Gateway Infrastructures</span>
            <span className="theme-link font-bold">0% COMMISSION RAIL</span>
          </div>
        </section>

        {/* =================================================================== */}
        {/* RIGHT PANEL (5 COLS ON DESKTOP): INDEPENDENTLY SCROLLABLE AUTH      */}
        {/* =================================================================== */}
        <section className="col-span-1 lg:col-span-5 h-auto lg:h-screen lg:overflow-y-auto theme-bg-primary px-4 sm:px-8 xl:px-11 py-4 sm:py-8 pb-10 sm:pb-8 flex flex-col justify-between transition-colors order-1 lg:order-2">

          {/* Top Utility Bar: Back Link + Theme Toggle (Mobile shows Brand Logo) */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Only: Top Brand Logo */}
              <Link href="/" className="lg:hidden inline-flex items-center gap-2 group">
                <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#161D2B] border theme-border shadow-xs flex items-center justify-center p-0.5">
                  <MyMobPayLogoMark className="w-full h-full" id="mobile-top-logo" />
                </span>
                <span className="font-sans font-bold text-base theme-text-primary">
                  MyMob<span className="text-[#0F2BFF] dark:text-[#60A5FA]">Pay</span>
                </span>
              </Link>

              {/* Desktop Back Link */}
              <Link
                href="/"
                className="hidden lg:inline-flex items-center gap-1.5 text-[12px] font-bold theme-text-muted hover:theme-text-primary transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to mymobpay.tech</span>
              </Link>
            </div>

            {/* Segmented Light / Dark Switcher */}
            <div className="inline-flex items-center p-0.5 rounded-full theme-bg-secondary border theme-border" role="group" aria-label="Appearance">
              <button
                type="button"
                onClick={() => handleSetTheme('light')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-[#0F2BFF] text-white shadow-2xs'
                    : 'theme-text-muted hover:theme-text-primary'
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('dark')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  theme === 'dark'
                    ? 'bg-[#0F2BFF] text-white shadow-2xs'
                    : 'theme-text-muted hover:theme-text-primary'
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Center Auth Card Container */}
          <div className="my-auto py-2.5 sm:py-5 max-w-[440px] w-full mx-auto">

            {/* Domain Status Pill */}
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full theme-bg-secondary border theme-border text-[11px] font-medium theme-text-secondary">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span><strong className="font-bold theme-text-primary">mymobpay.tech</strong> &bull; Unified Fintech Gateway &amp; Settlement Suite</span>
              </div>
            </div>

            {/* Main Elevated Auth Card */}
            <div className="theme-bg-elevated rounded-2xl border theme-border theme-card-shadow overflow-hidden">
              <div className="p-4 sm:p-7">

                {/* Card Header */}
                <div className="text-center">
                  <h2 className="headline-anton text-[30px] sm:text-[34px] tracking-wide">
                    {isOAuthSignup 
                      ? 'COMPLETE MERCHANT SETUP' 
                      : mode === 'signin' 
                      ? 'LOG IN TO DASHBOARD' 
                      : mode === 'signup' 
                      ? 'CREATE MERCHANT ACCOUNT' 
                      : 'SET NEW PASSWORD'}
                  </h2>
                  <p className="mt-1 text-[12px] sm:text-[12.5px] theme-text-muted">
                    {isOAuthSignup
                      ? 'Quick profile setup to start collecting instant payments'
                      : mode === 'signin' 
                      ? 'Manage payments, instant settlements, and customer refunds' 
                      : mode === 'signup'
                      ? 'Start collecting instant 0% direct UPI payments in minutes'
                      : 'Choose a strong password with at least 6 characters'}
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start justify-between gap-2 banner-enter">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{formatCustomerError(error)}</span>
                    </div>
                    <button type="button" onClick={() => setError('')} className="p-0.5 text-rose-500 hover:text-rose-700 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Success / Feedback Status Banner */}
                {message && (
                  <div className="mt-4 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#10B981]/40 px-3.5 py-2.5 flex items-center justify-between gap-2.5 banner-enter">
                    <div className="flex items-center gap-2.5 text-left">
                      <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <span className="text-[12px] font-semibold text-[#065F46] dark:text-[#6EE7B7] leading-snug">
                        {message}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessage('')}
                      className="text-[#065F46] dark:text-[#6EE7B7] hover:opacity-75 p-1 shrink-0"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Primary Segmented Mode Switcher: Log In | Sign Up (High Contrast & Tap-Friendly) */}
                {mode !== 'reset' && !isOAuthSignup && (
                  <div className="mt-4 sm:mt-5 grid grid-cols-2 p-1.5 rounded-2xl bg-[#E2E8F0]/80 dark:bg-[#0A0F18] border border-slate-300/90 dark:border-[#1E293B] shadow-inner">
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                      className={`py-2.5 px-3 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        mode === 'signin'
                          ? 'bg-[#0F2BFF] text-white shadow-[0_4px_14px_rgba(15,43,255,0.45)] ring-1 ring-blue-400/30'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Lock className="w-4 h-4 stroke-[2.4]" />
                      <span>Log In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                      className={`py-2.5 px-3 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        mode === 'signup'
                          ? 'bg-[#0F2BFF] text-white shadow-[0_4px_14px_rgba(15,43,255,0.45)] ring-1 ring-blue-400/30'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 stroke-[2.4]" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}

                {/* ======================================================= */}
                {/* VIEW 1: LOG IN CONTAINER                                */}
                {/* ======================================================= */}
                {mode === 'signin' && (
                  <div className="mt-4">
                    {/* Secondary Method Switcher: WhatsApp OTP | Password */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100/90 dark:bg-[#0C121D] border border-slate-200 dark:border-[#1F2C3F]">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab(isWaDegraded ? 'email' : 'whatsapp');
                          setError('');
                          setMessage('');
                          setOtpSent(false);
                          setEmailOtpSent(false);
                        }}
                        className={`py-2 px-3 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          authTab === 'whatsapp' || authTab === 'email'
                            ? 'bg-white dark:bg-[#162235] text-[#059669] dark:text-[#34D399] border border-emerald-500/25 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {authTab === 'email' ? (
                          <>
                            <Mail className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA]" />
                            <span>Email OTP</span>
                            {isWaDegraded && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded ml-1">
                                Primary
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                            <span>WhatsApp OTP</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('password'); setError(''); setMessage(''); }}
                        className={`py-2 px-3 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          authTab === 'password'
                            ? 'bg-white dark:bg-[#162235] text-[#0F2BFF] dark:text-[#60A5FA] border border-blue-500/25 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Password</span>
                      </button>
                    </div>

                    {/* Degraded Alert Banner */}
                    {isWaDegraded && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 text-[11.5px] leading-relaxed">
                          <div className="font-semibold text-amber-900 dark:text-amber-100 flex items-center justify-between">
                            <span>Email OTP Active</span>
                            <span className="text-[9px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded">
                              Auto Fallback
                            </span>
                          </div>
                          <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                            WhatsApp delivery experiencing delays. Login is defaulted to fast 6-digit Email OTP.
                          </p>
                          {authTab === 'email' ? (
                            <button
                              type="button"
                              onClick={() => { setAuthTab('whatsapp'); setError(''); setMessage(''); setOtpSent(false); }}
                              className="mt-1 font-semibold text-amber-950 dark:text-amber-200 underline hover:opacity-80 inline-flex items-center gap-1"
                            >
                              <span>Prefer WhatsApp? Try WhatsApp OTP anyway &rarr;</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setAuthTab('email'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                              className="mt-1 font-semibold text-[#0F2BFF] dark:text-[#60A5FA] underline hover:opacity-80 inline-flex items-center gap-1"
                            >
                              <span>&larr; Switch back to recommended Email OTP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* METHOD 1: WHATSAPP OTP */}
                    {authTab === 'whatsapp' && (
                      <div className="mt-5 space-y-4">
                        {!otpSent ? (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[12px] font-bold theme-text-primary">
                                  WhatsApp Mobile Number
                                </label>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] dark:text-[#34D399]">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Instant WhatsApp OTP</span>
                                </span>
                              </div>

                              <div className="flex items-stretch rounded-xl overflow-hidden border-[1.5px] theme-border focus-within:border-[#0F2BFF] dark:focus-within:border-[#60A5FA] transition-all">
                                <div className="px-3.5 py-2.5 theme-bg-secondary border-r theme-border flex items-center gap-2 shrink-0 select-none">
                                  <IndianFlag className="w-4 h-3" />
                                  <span className="font-mono text-[13px] font-bold theme-text-primary">+91</span>
                                </div>
                                <input
                                  type="tel"
                                  maxLength={10}
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                  onKeyDown={(e) => e.key === 'Enter' && phone.trim().replace(/\D/g, '').length === 10 && triggerOtpFlow('whatsapp')}
                                  placeholder="10-digit WhatsApp number"
                                  className="w-full px-3.5 py-2.5 theme-bg-well text-[13.5px] font-mono font-semibold theme-text-primary focus:outline-none"
                                />
                              </div>

                              <p className="mt-1.5 text-[11.5px] theme-text-muted">
                                We will send a 6-digit verification code directly to your WhatsApp.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => triggerOtpFlow('whatsapp')}
                              disabled={loading || phone.trim().replace(/\D/g, '').length !== 10}
                              className="btn-editorial w-full h-12 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                            >
                              {loading ? (
                                <span className="spinner-ring" aria-hidden="true"></span>
                              ) : (
                                <>
                                  <span>Send WhatsApp OTP</span>
                                  <ArrowRight className="btn-arrow-icon w-4 h-4" />
                                </>
                              )}
                            </button>

                            <div className="mt-4 text-center">
                              <button
                                type="button"
                                onClick={() => { setAuthTab('email'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                                className="text-[12.5px] font-bold theme-link hover:underline inline-flex items-center gap-1"
                              >
                                <span>Prefer email? Sign in with Email OTP &rarr;</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#10B981]/40">
                              <div className="flex items-center gap-2 text-xs theme-text-primary font-medium">
                                <MessageCircle className="w-4 h-4 text-[#059669] shrink-0" />
                                <span>Code sent to WhatsApp <strong className="text-[#059669] dark:text-[#34D399] font-mono">+91 {phone}</strong></span>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setOtpSent(false); setOtp(''); setError(''); setMessage(''); }}
                                className="text-[11px] font-bold theme-link hover:underline"
                              >
                                Change
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold theme-text-primary">Enter 6-Digit WhatsApp OTP</span>
                                {otpTimer > 0 ? (
                                  <span className="font-mono text-[11px] font-semibold theme-text-muted">
                                    Resend in {otpTimer}s
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => triggerOtpFlow('whatsapp')}
                                    disabled={loading}
                                    className="font-mono text-[11px] font-bold text-[#059669] dark:text-[#34D399] hover:underline"
                                  >
                                    Resend OTP
                                  </button>
                                )}
                              </div>
                              <OtpBoxInput value={otp} onChange={setOtp} disabled={loading} />
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={loading || otp.length !== 6}
                              className="btn-editorial w-full h-12 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                            >
                              {loading ? (
                                <span className="spinner-ring" aria-hidden="true"></span>
                              ) : (
                                <>
                                  <span>Verify OTP &amp; Enter Dashboard</span>
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* METHOD 2: PASSWORD */}
                    {authTab === 'password' && (
                      <form onSubmit={(e) => { e.preventDefault(); handleAuth('signin'); }} className="mt-5 space-y-4">
                        <div>
                          <label className="block text-[12px] font-bold theme-text-primary mb-1.5">
                            Merchant Email / ID
                          </label>
                          <input
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="merchant@company.com or Merchant ID"
                            className="auth-input w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold theme-text-primary">
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="text-[11px] font-bold theme-link hover:underline"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="auth-input w-full pl-3.5 pr-10 py-2.5 rounded-xl text-[13px] font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(prev => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-primary p-1"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-editorial w-full h-12 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <span className="spinner-ring" aria-hidden="true"></span>
                          ) : (
                            <>
                              <span>Log In to Dashboard</span>
                              <ArrowRight className="btn-arrow-icon w-4 h-4" />
                            </>
                          )}
                        </button>

                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            onClick={() => { setAuthTab('email'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                            className="text-[12.5px] font-bold theme-link hover:underline inline-flex items-center gap-1"
                          >
                            <span>Prefer passwordless? Sign in with Email OTP &rarr;</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* METHOD 3: EMAIL OTP */}
                    {authTab === 'email' && (
                      <div className="mt-5 space-y-4">
                        {!emailOtpSent ? (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[12px] font-bold theme-text-primary">
                                  Merchant Email Address
                                </label>
                                <span className="font-mono text-[10.5px] font-bold text-[#0F2BFF] dark:text-[#60A5FA]">
                                  Instant 6-Digit Email OTP
                                </span>
                              </div>
                              <input
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && email.trim() && handleSendEmailOtp()}
                                placeholder="merchant@company.com or Merchant ID"
                                className="auth-input w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium"
                              />
                              <p className="mt-1.5 text-[11.5px] theme-text-muted">
                                We will send a 6-digit verification code directly to your email.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={loading || !email.trim()}
                              className="btn-editorial w-full h-12 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                            >
                              {loading ? (
                                <span className="spinner-ring" aria-hidden="true"></span>
                              ) : (
                                <>
                                  <span>Send 6-Digit Email OTP</span>
                                  <ArrowRight className="btn-arrow-icon w-4 h-4" />
                                </>
                              )}
                            </button>

                            <div className="mt-4 text-center">
                              <button
                                type="button"
                                onClick={() => { setAuthTab('whatsapp'); setError(''); setMessage(''); setOtpSent(false); }}
                                className="text-[12.5px] font-bold theme-link hover:underline inline-flex items-center gap-1"
                              >
                                <span>&larr; Back to WhatsApp OTP</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl theme-bg-secondary border theme-border">
                              <div className="flex items-center gap-2 text-xs theme-text-primary font-medium">
                                <Mail className="w-4 h-4 text-[#0F2BFF] shrink-0" />
                                <span>Code sent to <strong className="font-mono text-[#0F2BFF]">{email}</strong></span>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); setMessage(''); }}
                                className="text-[11px] font-bold theme-link hover:underline"
                              >
                                Change
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold theme-text-primary">Enter 6-Digit Email OTP</span>
                                {emailTimer > 0 ? (
                                  <span className="font-mono text-[11px] font-semibold theme-text-muted">
                                    Resend in {emailTimer}s
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleSendEmailOtp}
                                    disabled={loading}
                                    className="font-mono text-[11px] font-bold theme-link hover:underline"
                                  >
                                    Resend OTP
                                  </button>
                                )}
                              </div>
                              <OtpBoxInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={loading || emailOtp.length !== 6}
                              className="btn-editorial w-full h-12 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                            >
                              {loading ? (
                                <span className="spinner-ring" aria-hidden="true"></span>
                              ) : (
                                <>
                                  <span>Verify OTP &amp; Enter Dashboard</span>
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================= */}
                {/* VIEW 2: SIGN UP CONTAINER (Standard or OAuth Wizard)   */}
                {/* ======================================================= */}
                {mode === 'signup' && (
                  isOAuthSignup ? (
                    <div className="mt-5 flex flex-col">
                      {/* Google Connected Account Pill */}
                      <div className="flex items-center justify-between p-2.5 px-3 rounded-xl theme-bg-secondary border theme-border mb-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-white dark:bg-[#161D2B] shadow-2xs border theme-border flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold theme-text-primary truncate block max-w-[190px]">{email}</span>
                            <span className="text-[10px] theme-text-muted">Google Workspace Verified</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSignOutToSwitchAccount}
                          className="text-[11px] font-bold theme-link hover:underline shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      {/* Stepper Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#0F2BFF] dark:text-[#60A5FA]">
                            Step {oauthStep} of 5 &bull; {
                              oauthStep === 1 ? 'Password' :
                              oauthStep === 2 ? 'Business Name' :
                              oauthStep === 3 ? 'Website / App' :
                              oauthStep === 4 ? 'Settlement UPI' : 'Mobile Number'
                            }
                          </span>
                          <span className="font-mono text-[10px] font-semibold theme-text-muted">
                            {oauthStep * 20}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 theme-bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0F2BFF] rounded-full transition-all duration-300"
                            style={{ width: `${(oauthStep / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* OAuth Step Inputs */}
                      <form onSubmit={(e) => { e.preventDefault(); handleNextOAuthStep(); }} className="space-y-4">
                        {oauthStep === 1 && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[12px] font-bold theme-text-primary block mb-1">
                                Create a Strong Password <span className="text-[#E11D48]">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  required
                                  minLength={8}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Create a password"
                                  className="auth-input w-full pl-3.5 pr-10 py-2.5 rounded-xl text-[13px] font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(prev => !prev)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-primary p-1"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Password requirements */}
                            <div className="p-3 rounded-xl theme-bg-well border theme-border space-y-1.5 text-[11px]">
                              <div className="font-bold theme-text-muted text-[10px]">PASSWORD CRITERIA</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <span className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                  <span>{passwordCriteria.hasMinLength ? '✓' : '·'}</span> 8+ Characters
                                </span>
                                <span className={`flex items-center gap-1.5 ${passwordCriteria.hasUppercase ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                  <span>{passwordCriteria.hasUppercase ? '✓' : '·'}</span> 1 Uppercase (A-Z)
                                </span>
                                <span className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                  <span>{passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? '✓' : '·'}</span> Number &amp; Symbol
                                </span>
                                <span className={`flex items-center gap-1.5 ${passwordCriteria.noSequenceOrRepeat ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                  <span>{passwordCriteria.noSequenceOrRepeat ? '✓' : '·'}</span> No 123 / 111
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {oauthStep === 2 && (
                          <div className="space-y-3">
                            <label className="text-[12px] font-bold theme-text-primary block mb-1">
                              Business / Brand Name <span className="text-[#E11D48]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              placeholder="e.g. Acme Tech Studio"
                              className="auth-input w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium"
                            />
                            <p className="text-[11.5px] theme-text-muted">
                              This name will appear on customer payment screens and receipts.
                            </p>
                          </div>
                        )}

                        {oauthStep === 3 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] font-bold theme-text-primary">
                                Website or Store URL
                              </label>
                              <span className="text-[10px] font-semibold theme-text-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                Optional
                              </span>
                            </div>
                            <input
                              type="text"
                              disabled={noWebsite}
                              value={websiteUrl}
                              onChange={(e) => setWebsiteUrl(e.target.value.trim())}
                              placeholder="e.g. acmestudio.com"
                              className="auth-input w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-50"
                            />
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={noWebsite}
                                onChange={(e) => {
                                  setNoWebsite(e.target.checked);
                                  if (e.target.checked) setWebsiteUrl('');
                                }}
                                className="w-3.5 h-3.5 rounded text-[#0F2BFF]"
                              />
                              <span className="text-xs theme-text-muted">
                                I don&apos;t have a website yet (UPI links will work directly)
                              </span>
                            </label>
                          </div>
                        )}

                        {oauthStep === 4 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] font-bold theme-text-primary">
                                Settlement UPI ID <span className="text-[#E11D48]">*</span>
                              </label>
                              {getBankFromUpi(upiId) ? (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBankFromUpi(upiId).color}`}>
                                  {getBankFromUpi(upiId).name}
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold theme-link">Direct Bank Routing</span>
                              )}
                            </div>
                            <input
                              type="text"
                              required
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                              placeholder="e.g. merchant@okhdfcbank"
                              className="auth-input w-full px-3.5 py-2.5 rounded-xl text-[13px] font-mono font-medium"
                            />
                            <p className="text-[11px] theme-text-muted">
                              Supports all bank UPI handles: @okhdfcbank, @oksbi, @okicici, @paytm, @ybl, etc.
                            </p>
                          </div>
                        )}

                        {oauthStep === 5 && (
                          <div className="space-y-3">
                            <label className="text-[12px] font-bold theme-text-primary block mb-1">
                              Mobile Number (WhatsApp) <span className="text-[#E11D48]">*</span>
                            </label>
                            <div className="flex items-stretch rounded-xl overflow-hidden border-[1.5px] theme-border focus-within:border-[#0F2BFF] dark:focus-within:border-[#60A5FA] transition-all">
                              <div className="px-3.5 py-2.5 theme-bg-secondary border-r theme-border flex items-center gap-2 shrink-0 select-none">
                                <IndianFlag className="w-4 h-3" />
                                <span className="font-mono text-[13px] font-bold theme-text-primary">+91</span>
                              </div>
                              <input
                                type="tel"
                                maxLength={10}
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="10-digit mobile number"
                                className="w-full px-3.5 py-2.5 theme-bg-well text-[13px] font-mono font-semibold theme-text-primary focus:outline-none"
                              />
                            </div>

                            {/* Legal Agreement */}
                            <div className="p-3 rounded-xl theme-bg-well border theme-border">
                              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={termsAccepted}
                                  onChange={(e) => setTermsAccepted(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-[#0F2BFF]"
                                />
                                <span className="text-[11.5px] leading-relaxed theme-text-secondary">
                                  I agree to the{' '}
                                  <button
                                    type="button"
                                    onClick={() => { setLegalModalTab('direct'); setShowLegalModal(true); }}
                                    className="font-bold theme-link hover:underline"
                                  >
                                    Terms of Service &amp; Legal Agreement
                                  </button>
                                  , and confirm compliance with{' '}
                                  <button
                                    type="button"
                                    onClick={() => { setLegalModalTab('prohibited'); setShowLegalModal(true); }}
                                    className="font-bold theme-link hover:underline"
                                  >
                                    Acceptable Use Rules
                                  </button>
                                  .
                                </span>
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2.5 pt-2">
                          {oauthStep > 1 && (
                            <button
                              type="button"
                              onClick={handlePrevOAuthStep}
                              className="h-11 px-4 rounded-xl border theme-border theme-bg-elevated theme-text-primary text-xs font-bold flex items-center gap-1 hover:theme-bg-secondary"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={loading || (oauthStep === 5 && !termsAccepted)}
                            className="btn-editorial flex-1 h-11 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                          >
                            {loading ? (
                              <span className="spinner-ring" aria-hidden="true"></span>
                            ) : oauthStep === 5 ? (
                              <>
                                <span>Complete Setup &amp; Launch Dashboard</span>
                                <ArrowRight className="btn-arrow-icon w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Continue</span>
                                <ArrowRight className="btn-arrow-icon w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* STANDARD SIGNUP FORM */
                    <form onSubmit={(e) => { e.preventDefault(); handleAuth('signup'); }} className="mt-5 space-y-4 text-left">
                      {/* 1. Merchant Email Address * + Inline Verify Button */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[12px] font-bold theme-text-primary">
                            Merchant Email Address <span className="text-[#E11D48]">*</span>
                          </label>
                          {isEmailVerified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 theme-text-muted pointer-events-none">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            required
                            disabled={isEmailVerified || loading}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (isEmailVerified) setIsEmailVerified(false);
                              if (emailOtpSent) setEmailOtpSent(false);
                            }}
                            placeholder="merchant@company.com"
                            className="auth-input w-full pl-10 pr-24 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-85"
                          />
                          {isEmailVerified ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEmailVerified(false);
                                setEmailOtpSent(false);
                                setEmailOtp('');
                              }}
                              className="absolute right-2 text-[11px] font-bold theme-link hover:underline px-2 py-1"
                            >
                              Change
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={loading || !email.trim() || !email.includes('@')}
                              className="absolute right-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#0F2BFF] text-white shadow-2xs hover:bg-[#081EC4] transition-all disabled:opacity-50"
                            >
                              {loading && !emailOtpSent ? 'Sending...' : emailOtpSent ? 'Resend' : 'Verify'}
                            </button>
                          )}
                        </div>

                        {/* Inline OTP Drawer */}
                        {emailOtpSent && !isEmailVerified && (
                          <div className="mt-2.5 p-3.5 rounded-xl theme-bg-secondary border theme-border banner-enter space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold theme-text-primary text-[11.5px]">
                                Code sent to <strong className="font-mono text-[#0F2BFF]">{email}</strong>
                              </span>
                              {emailTimer > 0 ? (
                                <span className="font-mono text-[10.5px] theme-text-muted">
                                  Resend in {emailTimer}s
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendEmailOtp}
                                  disabled={loading}
                                  className="font-mono text-[10.5px] font-bold theme-link hover:underline"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold theme-text-muted block text-center">
                                Enter 6-Digit Email Verification Code
                              </label>
                              <OtpBoxInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={loading || emailOtp.length !== 6}
                              className="btn-editorial w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {loading ? (
                                <span className="spinner-ring" aria-hidden="true"></span>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Confirm 6-Digit OTP</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. Create Password (8+ chars) * */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label className="text-[12px] font-bold theme-text-primary">
                            Create Password (8+ chars) <span className="text-[#E11D48]">*</span>
                          </label>
                          <span className="text-[10.5px] font-medium theme-text-muted">
                            1 Upper, 1 Number, 1 Symbol
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 theme-text-muted pointer-events-none">
                            <Lock className="w-4 h-4" />
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            className="auth-input w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-3 theme-text-muted hover:theme-text-primary p-1"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Real-time Password Strength Criteria Checklist */}
                        {password.length > 0 && (
                          <div className="p-2.5 rounded-xl theme-bg-well border theme-border space-y-1 text-[11px] mt-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                <span>{passwordCriteria.hasMinLength ? '✓' : '·'}</span> 8+ Characters
                              </span>
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.hasUppercase ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                <span>{passwordCriteria.hasUppercase ? '✓' : '·'}</span> 1 Uppercase (A-Z)
                              </span>
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                <span>{passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? '✓' : '·'}</span> Number &amp; Symbol
                              </span>
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.noSequenceOrRepeat ? 'text-[#10B981] font-bold' : 'theme-text-muted'}`}>
                                <span>{passwordCriteria.noSequenceOrRepeat ? '✓' : '·'}</span> No 123 / 111
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Business / Brand Name * */}
                      <div>
                        <label className="block text-[12px] font-bold theme-text-primary mb-1.5">
                          Business / Brand Name <span className="text-[#E11D48]">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 theme-text-muted pointer-events-none">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Acme Tech Studio"
                            className="auth-input w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-medium"
                          />
                        </div>
                      </div>

                      {/* 4. Settlement UPI ID * + Direct Bank Routing */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label className="text-[12px] font-bold theme-text-primary">
                            Settlement UPI ID <span className="text-[#E11D48]">*</span>
                          </label>
                          {getBankFromUpi(upiId) ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBankFromUpi(upiId).color}`}>
                              {getBankFromUpi(upiId).name}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold theme-link">Direct Bank Routing</span>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 theme-text-muted pointer-events-none">
                            <QrCode className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. merchant@okhdfcbank"
                            className="auth-input w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-mono font-medium"
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] theme-text-muted">
                          Direct settlement to your bank UPI address.
                        </p>
                      </div>

                      {/* 5. Mobile Number (WhatsApp) * */}
                      <div>
                        <label className="block text-[12px] font-bold theme-text-primary mb-1.5">
                          Mobile Number (WhatsApp) <span className="text-[#E11D48]">*</span>
                        </label>
                        <div className="flex items-stretch rounded-xl overflow-hidden border-[1.5px] theme-border focus-within:border-[#0F2BFF] dark:focus-within:border-[#60A5FA] transition-all">
                          <div className="px-3.5 py-2.5 theme-bg-secondary border-r theme-border flex items-center gap-2 shrink-0 select-none">
                            <IndianFlag className="w-4 h-3" />
                            <span className="font-mono text-[13px] font-bold theme-text-primary">+91</span>
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="10-digit mobile number"
                            className="w-full px-3.5 py-2.5 theme-bg-well text-[13px] font-mono font-semibold theme-text-primary focus:outline-none"
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] theme-text-muted leading-relaxed">
                          10-digit Indian mobile number for critical transaction alerts and account security.
                        </p>
                      </div>

                      {/* 6. Legal & Non-Custodial Compliance Card */}
                      <div className="rounded-xl p-3.5 theme-bg-well border theme-border">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#0F2BFF] focus:ring-[#0F2BFF]"
                          />
                          <span className="text-[11.5px] leading-relaxed theme-text-secondary">
                            I have read and agree to the{' '}
                            <button
                              type="button"
                              onClick={() => { setLegalModalTab('direct'); setShowLegalModal(true); }}
                              className="font-bold theme-link hover:underline"
                            >
                              Terms of Service &amp; Legal Agreement
                            </button>
                            , and confirm compliance with{' '}
                            <button
                              type="button"
                              onClick={() => { setLegalModalTab('prohibited'); setShowLegalModal(true); }}
                              className="font-bold theme-link hover:underline"
                            >
                              Acceptable Use Rules
                            </button>
                            .
                            <span className="block mt-1.5 font-mono text-[10px] theme-text-muted">
                              RBI PSS Act 2007 (Non-Custodial) &bull; 0% Escrow &bull; Direct Settlement
                            </span>
                          </span>
                        </label>
                      </div>

                      {/* 7. Sign Up Submit Button */}
                      <button
                        type="submit"
                        disabled={loading || !isEmailVerified || !(passwordCriteria?.isValid || passwordCriteria?.allMet) || !businessName.trim() || !upiId.trim() || phone.replace(/\D/g, '').length !== 10 || !termsAccepted}
                        className={`w-full h-12 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all ${
                          isEmailVerified && (passwordCriteria?.isValid || passwordCriteria?.allMet) && businessName.trim() && upiId.trim() && phone.replace(/\D/g, '').length === 10 && termsAccepted
                            ? 'btn-editorial bg-[#0F2BFF] hover:bg-[#081EC4] text-white shadow-md'
                            : 'bg-[#E2E8F0] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] cursor-not-allowed opacity-80'
                        }`}
                      >
                        {loading ? (
                          <span className="spinner-ring" aria-hidden="true"></span>
                        ) : !isEmailVerified ? (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Verify Email to Continue</span>
                          </>
                        ) : !termsAccepted ? (
                          <>
                            <Scale className="w-4 h-4" />
                            <span>Accept Agreement to Continue</span>
                          </>
                        ) : (
                          <>
                            <span>Create Merchant Account</span>
                            <ArrowRight className="btn-arrow-icon w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )
                )}

                {/* ======================================================= */}
                {/* VIEW 3: RESET PASSWORD CONTAINER                        */}
                {/* ======================================================= */}
                {mode === 'reset' && (
                  <form onSubmit={handleUpdateNewPassword} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold theme-text-primary mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="auth-input w-full pl-3.5 pr-10 py-2.5 rounded-xl text-[13px] font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-primary p-1"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold theme-text-primary mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="auth-input w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-editorial w-full h-12 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="spinner-ring" aria-hidden="true"></span>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Set New Password &amp; Continue</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Shared Divider: OR */}
                {mode !== 'reset' && !isOAuthSignup && (
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 theme-border border-t"></div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest theme-text-muted">OR</span>
                    <div className="h-px flex-1 theme-border border-t"></div>
                  </div>
                )}

                {/* Shared Continue with Google Button */}
                {mode !== 'reset' && !isOAuthSignup && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="btn-editorial w-full py-2.5 px-4 rounded-xl theme-bg-well border theme-border hover:border-[#0F2BFF] text-[12.5px] font-bold theme-text-primary flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}

                {/* QR Express Login Bar */}
                {mode === 'signin' && !isOAuthSignup && (
                  <div className="mt-3.5 p-3 rounded-xl theme-bg-well border theme-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg theme-bg-elevated border theme-border flex items-center justify-center text-[#0F2BFF] shadow-2xs">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold theme-text-primary block leading-tight">QR Express Login</span>
                        <span className="text-[10.5px] theme-text-muted">Scan with MyMobPay merchant app</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="px-2.5 py-1 rounded-lg theme-bg-elevated border theme-border text-xs font-bold theme-link hover:border-[#0F2BFF] transition-all shrink-0 whitespace-nowrap"
                    >
                      Show QR
                    </button>
                  </div>
                )}

              </div>

              {/* Card Bottom Switch Strip */}
              <div className="px-5 py-3.5 theme-bg-secondary border-t theme-border text-center text-[12.5px] theme-text-secondary">
                {mode === 'reset' ? (
                  <>
                    <span>Remembered your password?</span>
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                      className="ml-1.5 font-extrabold text-[#0F2BFF] dark:text-[#60A5FA] hover:underline cursor-pointer"
                    >
                      Log In to Dashboard &rarr;
                    </button>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <span>New to MyMobPay?</span>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                      className="ml-1.5 font-extrabold text-[#0F2BFF] dark:text-[#60A5FA] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Create Merchant Account</span>
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account?</span>
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                      className="ml-1.5 font-extrabold text-[#0F2BFF] dark:text-[#60A5FA] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Log In to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Trust Badges, Support Email & Legal Links Below Card */}
            <div className="mt-5 text-center space-y-2.5">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] font-semibold theme-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>256-Bit SSL Encryption</span>
                </span>
                <span className="theme-text-muted">&bull;</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>NPCI UPI Standard</span>
                </span>
                <span className="theme-text-muted">&bull;</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Direct Bank Settlement</span>
                </span>
              </div>

              <div className="text-[11.5px] theme-text-muted">
                Need assistance? Contact support:
                <a href="mailto:support@mymobpay.tech" className="font-bold theme-link hover:underline inline-flex items-center gap-1 ml-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>support@mymobpay.tech</span>
                </a>
              </div>

              <div className="flex items-center justify-center gap-2.5 text-[11px] font-semibold theme-text-muted">
                <Link href="/terms" className="hover:underline">Terms of Service</Link>
                <span>&bull;</span>
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => { setLegalModalTab('prohibited'); setShowLegalModal(true); }}
                  className="hover:underline cursor-pointer"
                >
                  Acceptable Use Rules
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Spacer */}
          <div className="text-center text-[10.5px] font-mono theme-text-muted pt-2">
            mymobpay.tech &bull; Non-Custodial Direct UPI &amp; IMPS Gateway
          </div>

        </section>

      </div>

      {/* QR Code Express Login Modal */}
      {isQrModalMounted && (
        <div 
          className={`fixed inset-0 z-50 bg-[#090A10]/70 backdrop-blur-sm flex items-center justify-center p-4 ${qrOverlayClass}`}
          onClick={() => setShowQrModal(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-sm theme-bg-elevated rounded-2xl shadow-2xl p-6 text-center relative border theme-border ${qrModalClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="headline-anton text-xl tracking-wide theme-text-primary">SCAN TO LOG IN</span>
              <button 
                type="button" 
                onClick={() => setShowQrModal(false)}
                className="theme-text-muted hover:theme-text-primary p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs theme-text-muted mb-4 leading-relaxed">
              Open the MyMobPay Merchant App, tap on <strong>Profile &gt; Scan Web QR</strong> to instantly sign in.
            </p>

            <div className="mx-auto w-48 h-48 bg-white p-3.5 rounded-xl flex items-center justify-center relative border theme-border shadow-xs">
              <QRCode 
                value={`mymobpay://web-login?challenge=${qrChallenge}`} 
                size={160} 
                level="M" 
                style={{ width: '100%', height: 'auto' }}
              />
              <div className="absolute w-8 h-8 rounded-full bg-[#0F2BFF] text-white shadow-md flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <p className="mt-4 text-xs font-mono font-bold theme-text-muted flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#10B981] animate-spin" style={{ animationDuration: '4s' }} />
              <span>QR refreshes in {qrTimer}s</span>
            </p>
          </div>
        </div>
      )}

      {/* Merchant Legal Agreement & Guidelines Modal */}
      <LegalAgreementModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowLegalModal(false);
        }}
        initialTab={legalModalTab}
      />

    </div>
  );
}
