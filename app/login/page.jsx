'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Lock, Mail, ArrowRight, ShieldCheck, 
  CheckCircle2, Building2, QrCode, Phone, Smartphone,
  Zap, Eye, EyeOff, AlertCircle, X, RefreshCw, MessageCircle,
  Link2, Check, UserPlus, ShieldAlert, ChevronLeft, Globe
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import InteractiveBackground from '@/components/InteractiveBackground';
import { useModalTransition } from '@/components/useModalTransition';
import { validateStrongPassword, getPasswordCriteria } from '@/lib/passwordValidation';

// ── Helper: Detect Bank Name & Styling from UPI ID ──
const getBankFromUpi = (upi) => {
  if (!upi || !upi.includes('@')) return null;
  const handle = upi.split('@')[1]?.toLowerCase();
  if (!handle) return null;
  if (handle.includes('hdfc')) return { name: 'HDFC Bank', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (handle.includes('sbi')) return { name: 'State Bank of India', color: 'text-sky-700 bg-sky-50 border-sky-200' };
  if (handle.includes('icici')) return { name: 'ICICI Bank', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (handle.includes('axis')) return { name: 'Axis Bank', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  if (handle.includes('paytm')) return { name: 'Paytm Payments Bank', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
  if (handle.includes('ybl') || handle.includes('ibl')) return { name: 'Yes Bank / PhonePe', color: 'text-purple-700 bg-purple-50 border-purple-200' };
  if (handle.includes('barodampay')) return { name: 'Bank of Baroda', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (handle.includes('kotak')) return { name: 'Kotak Mahindra Bank', color: 'text-red-700 bg-red-50 border-red-200' };
  return { name: `@${handle} UPI Network`, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
};

const MyMobPayLogo = ({ className = '', textColor = '#0d253d', markSize = 32 }) => {
  const resolvedColor = textColor === 'var(--text-primary)' ? '#0d253d' : textColor;
  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 transition-transform duration-300 hover:scale-[1.02] ${className}`}>
      <img
        src="/logos/mymobpay_mark.png"
        alt="MyMobPay Mark"
        width={markSize}
        height={markSize}
        className="object-contain shrink-0"
        style={{ width: `${markSize}px`, height: `${markSize}px` }}
      />
      <span
        className="font-extrabold tracking-tight leading-none text-xl sm:text-2xl"
        style={{
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: resolvedColor,
          letterSpacing: '-0.5px'
        }}
      >
        MyMobPay
      </span>
    </div>
  );
};

// ── Authentic Indian Tricolour Flag SVG (renders accurately across Windows and all platforms) ──
const IndianFlag = ({ className = 'w-4 h-3' }) => (
  <svg 
    className={`${className} rounded-[1.5px] shadow-[0_0_1px_rgba(0,0,0,0.4)] overflow-hidden shrink-0 inline-block`} 
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

// ── Translate developer/system errors to clear, customer-friendly English ──
function formatCustomerError(err) {
  if (!err) return '';
  const raw = (typeof err === 'string' ? err : err.message || err.error_description || String(err)).trim();
  const lower = raw.toLowerCase();

  // 1. Token / OTP code errors (e.g. "Token has expired or is invalid")
  if (
    lower.includes('token') || 
    lower.includes('otp') || 
    lower.includes('verification code')
  ) {
    if (lower.includes('expired')) {
      return 'Your verification code has expired. Please request a new code below.';
    }
    if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong')) {
      return 'The verification code you entered is incorrect. Please check the 6 digits in your email and try again.';
    }
    return 'Invalid verification code. Please check the 6 digits sent to your email and try again.';
  }

  // 2. Magic Link errors
  if (lower.includes('link') && (lower.includes('expired') || lower.includes('invalid') || lower.includes('already used'))) {
    return 'This sign-in link has expired or has already been used. Please request a new link.';
  }

  // 3. Credentials & Accounts
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password. Please double-check your details and try again.';
  }
  if (lower.includes('signups not allowed') || lower.includes('user not found')) {
    return 'No merchant account registered with this email. Please sign up below.';
  }
  if (lower.includes('already registered') || lower.includes('user already exists') || lower.includes('email already')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link to activate your account.';
  }

  // 4. Rate limits & Cooldowns
  if (
    lower.includes('rate limit') || 
    lower.includes('over_email_send_rate_limit') || 
    lower.includes('too many') || 
    lower.includes('security purposes')
  ) {
    return 'Too many attempts. For your security, please wait a minute before requesting another code.';
  }

  // 5. Supabase default email service limits / failures
  if (lower.includes('magic link email') || lower.includes('error sending') || lower.includes('error sending email')) {
    return 'Email OTP service requires Custom SMTP in Supabase. You can sign up directly with your password below, or log in via the Log In tab.';
  }

  // 6. Network / Server errors
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('load failed')) {
    return 'Connection issue. Please check your internet connection and try again.';
  }
  if (lower.includes('500') || lower.includes('server error') || lower.includes('internal error')) {
    return 'Our server is temporarily busy. Please wait a moment and try again.';
  }

  // 6. Generic cleanup: Strip any developer technical terms
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

// ── 6-digit OTP box input component ────────────────────────────────
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
          className={`h-12 w-full text-center font-bold text-[20px] rounded-lg border-2 transition-all outline-none ${
            d
              ? 'bg-white border-[#533afd] text-[#0d253d] ring-2 ring-[#533afd]/20 shadow-xs'
              : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder:text-[#64748d]'
          } focus:border-[#533afd] focus:bg-white focus:ring-2 focus:ring-[#533afd]/20 disabled:opacity-50`}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [authTab, setAuthTab] = useState('whatsapp'); // 'whatsapp' (WhatsApp OTP - DEFAULT) | 'email' (Email OTP) | 'password'

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
  const [oauthStep, setOauthStep] = useState(1); // 1: Password | 2: Business | 3: Website | 4: UPI | 5: Phone
  const [stepDirection, setStepDirection] = useState('forward'); // 'forward' | 'backward'

  // Real-time strong password criteria calculation
  const passwordCriteria = useMemo(() => getPasswordCriteria(password), [password]);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // QR Express Login Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTimer, setQrTimer] = useState(45);
  const [qrChallenge, setQrChallenge] = useState('mymob-auth-session');
  const { isMounted: isQrModalMounted, modalClass: qrModalClass, overlayClass: qrOverlayClass } = useModalTransition(showQrModal);

  // Refs to allow onAuthStateChange callback to access current UI state synchronously
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isRegistrationSubmittedRef = useRef(false);
  const isRedirectingRef = useRef(false);

  // Handle URL query parameters & password recovery hash on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('googleAuth') === 'true') {
        setMode('signup');
      }
      if (params.get('mode') === 'signup') {
        setMode('signup');
      } else if (params.get('mode') === 'reset' || window.location.hash.includes('type=recovery')) {
        setMode('reset');
      }
    }
  }, []);

  // Supabase Auth State Change Listener (for Google OAuth redirects & existing sessions)
  useEffect(() => {
    const handleAuthRedirect = async (session) => {
      if (!session?.user) return;
      if (isRedirectingRef.current) return;
      if (modeRef.current === 'reset') return;
      if (isRegistrationSubmittedRef.current) return;

      setLoading(true);
      setMessage('Verifying account status with Google Workspace...');

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

        // 1. If merchant is fully registered with complete details (phone, business name, upi)
        if (verifyData && verifyData.allowed && verifyData.registered && verifyData.isComplete) {
          isRedirectingRef.current = true;
          setMessage('Authenticated successfully! Launching merchant dashboard...');
          let target = '/dashboard';
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const red = params.get('redirect');
            if (red && !red.startsWith('/login')) target = red;
            window.location.href = target;
          } else {
            router.replace(target);
          }
          return;
        }

        // 2. If user authenticated via Google Workspace but needs to complete registration details
        if (verifyData && (verifyData.needsRegistration || !verifyData.isComplete)) {
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

        // If backend explicitly rejected with specific reason
        console.warn('[LOGIN] Account verification response:', verifyData);
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
        handleAuthRedirect(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && modeRef.current !== 'reset') {
        handleAuthRedirect(session);
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  // WhatsApp OTP Delivery Health Check & Dynamic Fallback Probe
  useEffect(() => {
    let isMounted = true;

    const probeWhatsAppHealth = async () => {
      // 1. Instant check against local device failure cooldown to prevent UI flash
      if (typeof window !== 'undefined') {
        try {
          const degradedUntil = localStorage.getItem('mmp_wa_degraded_until');
          if (degradedUntil && Date.now() < Number(degradedUntil)) {
            setIsWaDegraded(true);
            setAuthTab('email');
          }
        } catch (e) {}
      }

      // 2. Query global circuit breaker on backend
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
          // If server reports healthy and local timer expired, restore
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

  // Phone / OTP Handlers — wired to real API
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
        // Handle resend cooldown — server returns secondsLeft
        if (res.status === 429 && data.secondsLeft) {
          setOtpTimer(data.secondsLeft);
          setOtpSent(true); // show OTP input but with timer active
        }

        // WhatsApp delivery failure detected: auto-fallback to Email OTP
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

  // Email OTP Handler (Strictly OTP code, NO buttons/links)
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

      // If user typed a Merchant ID (MID-XXXX) or UUID instead of email, resolve to email
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

      // Pre-check email uniqueness before sending OTP in signup mode
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

    // If email state is not yet an email address, resolve it
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
      } catch (e) {
        // fallback
      }
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
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
            const red = params.get('redirect');
            if (red && !red.startsWith('/login')) target = red;
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
        // Clear OTP boxes on wrong attempt
        if (data.remaining !== undefined) setOtp('');
        return;
      }

      if (!data.accountExists) {
        // Phone verified but no account — prompt signup
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
          const { error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink',
          });
          if (sessionError) {
            console.warn('Session verification notice:', sessionError);
          }
        } catch (sessEx) {
          console.warn('verifyOtp error:', sessEx);
        }
      }
      setTimeout(() => {
        let target = '/dashboard';
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const red = params.get('redirect');
          if (red && !red.startsWith('/login')) target = red;
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

  // Dedicated Signup WhatsApp Phone OTP Handlers
  const handleSendPhoneOtp = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // In Sign Up mode, pre-check if mobile number is already registered
      const checkRes = await fetch('/api/auth/check-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok || checkData.available === false) {
        setError(checkData.error || 'This WhatsApp mobile number is already registered to another account. Please use a different number or log in.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'signup' }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.secondsLeft) {
          setPhoneTimer(data.secondsLeft);
          setPhoneOtpSent(true);
        }
        if (data.fallbackToEmail || res.status === 502) {
          setIsWaDegraded(true);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('mmp_wa_degraded_until', String(Date.now() + 15 * 60 * 1000));
            } catch (e) {}
          }
        }
        setError(data.error || 'Failed to send WhatsApp verification code.');
        return;
      }

      setPhoneOtpSent(true);
      setPhoneOtp('');
      setPhoneTimer(45);
      setMessage(data.message || `6-digit verification code sent to +91 ${cleanPhone} via WhatsApp. Please check your WhatsApp messages!`);
    } catch (err) {
      console.error('WhatsApp OTP send error:', err);
      setError(err?.message || 'Network error while sending WhatsApp verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setError('Please enter the complete 6-digit WhatsApp verification code.');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: phoneOtp.trim(), purpose: 'signup' }),
      });
      const data = await res.json();

      if (!res.ok || !data.verified) {
        setError(data.error || 'WhatsApp verification failed. Please check the 6 digits and try again.');
        setPhoneOtp('');
        return;
      }

      setIsPhoneVerified(true);
      setMessage(`WhatsApp number +91 ${cleanPhone} verified successfully!`);
    } catch (err) {
      console.error('WhatsApp OTP verify error:', err);
      setError(err?.message || 'Network error during WhatsApp verification.');
    } finally {
      setLoading(false);
    }
  };

  // Legacy alias kept for button onClick compatibility
  const handleWhatsAppOtp = () => triggerOtpFlow('whatsapp');

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your merchant email address in the field above to receive a reset link.');
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

  // Dedicated Google OAuth Step-by-Step Handlers
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
      // Step 3: Website URL (Optional / Can skip)
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
      // Step 4: Settlement UPI ID
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
        // proceed if check fails
      } finally {
        setLoading(false);
      }
      setStepDirection('forward');
      setOauthStep(5);
    } else if (oauthStep === 5) {
      // Step 5: Phone Number
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
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
    setMode('signin');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/login');
    }
  };

  // Main Form Submit Handler
  const handleAuth = async (action) => {
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
        setError('Please enter a valid Settlement UPI ID (e.g. store@upi, name@okaxis) where customer payments will route.');
        return;
      }

      // ── Pre-check all registration details before proceeding ──
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

      // ── Enforce Email OTP Verification (if not already verified via Google) ──
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

        // If not already in an OAuth session, sign in with password
        if (!isOAuthSignup) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (signInError) {
            setMessage('Account created! Please sign in with your credentials.');
            setMode('signin');
            return;
          }
        }

        setMessage('Account created successfully! Launching your merchant console...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 600);

      } else if (action === 'signin') {
        let loginEmail = email.trim();

        // If user typed a Merchant ID (MID-XXXX) or Business name instead of email
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
          const red = params.get('redirect');
          if (red && !red.startsWith('/login')) target = red;
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-[#f6f9fc] font-sohne text-[#0d253d] relative">
      <InteractiveBackground />
      
      {/* ────────────────────────────────────────────────────────
         LEFT PANE: DYNAMIC PRODUCT HERO SHOWCASE (Desktop only)
         ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#070913] relative z-10 flex-col justify-between p-8 xl:p-12 h-screen overflow-hidden border-r border-[#1a2035] shrink-0">
        
        {/* Soft Ambient Depth Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#533afd]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Deep Tech Grid Line Overlay - Subtle & Refined */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

        {/* Logo Wordmark header */}
        <Link href="/" className="inline-block relative z-10 shrink-0">
          <MyMobPayLogo className="w-40 xl:w-44 h-auto" textColor="#FFFFFF" />
        </Link>

        {/* Core Value Copy and Vector Terminal Simulator alignment */}
        <div className="grid grid-cols-12 gap-6 xl:gap-8 items-center relative z-10 my-auto">
          
          <div className="col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.06] border border-white/10 rounded-full text-[10px] font-semibold text-[#b9b9f9] uppercase tracking-wider">
              🟢 Direct P2P Settlements
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-light text-white leading-tight tracking-[-0.64px] font-sohne">
              Built for founders defying all odds
            </h2>
            
            <p className="text-xs xl:text-sm text-slate-400 leading-relaxed font-normal">
              Join thousands of businesses managing billing programmatically with flat-rate subscriptions and 0% gateway cuts.
            </p>

            <div className="pt-2 space-y-3.5 font-normal text-xs text-slate-300">
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-200">Zero transaction cuts on monthly volumes</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-200">HMAC-SHA256 signed developer webhooks</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-slate-200">Risk-free sandbox simulation active</span>
              </p>
            </div>
          </div>

          {/* Interactive Bezel Frame containing payment mockup */}
          <div className="col-span-5 flex justify-end">
            <div className="relative w-full max-w-[220px] xl:max-w-[240px] bg-[#030712] border-4 border-[#1e293b] rounded-[30px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden aspect-[9/18.5] flex flex-col transition-transform duration-500 hover:scale-[1.04]">
              
              {/* Speaker camera notch */}
              <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-30">
                <div className="bg-[#1e293b] w-20 h-2.5 rounded-b-xl" />
              </div>

              {/* simulated checkout screen content */}
              <div className="flex-1 bg-[#090d16] pt-6 px-3.5 pb-3.5 flex flex-col justify-between font-sans select-none text-white text-[10px]">
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 px-0.5">
                    <span>10:42 AM</span>
                    <span>LTE</span>
                  </div>

                  <div className="flex flex-col items-center pt-1">
                    <MyMobPayLogo className="w-22 h-auto" textColor="#FFFFFF" />
                    <p className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Direct Bank Checkout</p>
                  </div>

                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-2.5 shadow-sm space-y-1.5">
                    <div className="flex justify-between items-center text-[7px] text-slate-400 font-bold uppercase">
                      <span>Total Due</span>
                      <span className="text-[#a5b4fc] font-semibold bg-[#533afd]/25 px-1 py-0.2 rounded text-[5px] uppercase">P2P Route</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-[10px] font-bold text-slate-400 mr-0.5">₹</span>
                      <span className="text-xl font-black text-white tracking-tight leading-none">500.00</span>
                    </div>
                  </div>

                  {/* QR Vector preview with Animated Scanning Laser */}
                  <div className="bg-white border border-[#e3e8ee] rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center space-y-2 relative overflow-hidden group">
                    
                    {/* Laser Scanner Beam */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#533afd] to-transparent top-0 animate-laser" />

                    <svg viewBox="0 0 100 100" className="w-18 h-18 text-slate-800" fill="currentColor">
                      {/* Corner marks */}
                      <path d="M0,0 h24 v6 h-18 v18 h-6 z M76,0 h24 v24 h-6 v-18 h-18 z M0,76 h6 v18 h18 v6 h-24 z M76,100 h24 v-24 h-6 v18 h-18 z" fill="#533afd" opacity="0.2" />
                      
                      <rect x="10" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="17" width="6" height="6" fill="#3B82F6" />
                      
                      <rect x="70" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="74" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="77" y="17" width="6" height="6" fill="#3B82F6" />
                      
                      <rect x="10" y="70" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="77" width="6" height="6" fill="#3B82F6" />
                      
                      <path d="M40,10 h6 v6 h-6 z M50,15 h8 v4 h-8 z M45,25 h10 v4 h-10 z M35,35 h8 v8 h-8 z M55,35 h12 v4 h-12 z M35,50 h12 v4 h-12 z M50,50 h6 v6 h-6 z M10,40 h8 v8 h-8 z M25,45 h10 v4 h-10 z M70,40 h8 v6 h-8 z M82,45 h8 v4 h-8 z M70,55 h12 v4 h-12 z M10,55 h6 v6 h-6 z M80,70 h10 v8 h-10 z M80,85 h8 v8 h-8 z" fill="#0F172A" />
                      
                      <rect x="40" y="40" width="20" height="20" fill="#533afd" rx="3" />
                      <text x="50" y="54" fontFamily="'Orbitron', sans-serif" fontWeight="950" fontSize="13" fill="#FFFFFF" textAnchor="middle">M</text>
                    </svg>
                    
                    <span className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> Auto-Verify Active
                    </span>
                  </div>

                </div>

                <div className="space-y-2 pt-2.5 border-t border-slate-800 text-center text-[6px] font-bold text-slate-500 uppercase tracking-wide">
                  Secure checkout by MyMobPay
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Footer info in left panel */}
        <p className="text-[10px] text-slate-500 font-light relative z-10 shrink-0">
          © 2026 MyMobPay · Secure B2B Gateway Infrastructures
        </p>

      </div>

      {/* ────────────────────────────────────────────────────────
         RIGHT PANE: BRAND MATCHED AUTHENTICATION CONSOLE
         ──────────────────────────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-5 bg-[#f6f9fc] h-auto lg:h-screen lg:overflow-y-auto relative z-10 font-sohne">
        
        <div className="min-h-full w-full flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-10">
          
          <div className="w-full flex flex-col items-center max-w-md">

            {/* Top Branding & Institutional Mark */}
            <div className="flex flex-col items-center mb-5 text-center">
              <div className="flex items-center justify-center mb-2.5">
                <Link href="/" className="inline-block hover:opacity-95 transition-opacity">
                  <MyMobPayLogo className="w-40 sm:w-44 h-auto" textColor="#0d253d" />
                </Link>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e3e8ee] text-[#273951] text-[11px] font-medium shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009d6d] animate-pulse"></span>
                <span>mymob.tech • Unified Fintech Gateway &amp; Settlement Suite</span>
              </div>
            </div>

            {/* Centered Auth Card Container */}
            <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-[#e3e8ee]">
              
              {/* Card Header */}
              <div className="p-6 sm:p-8 bg-white">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-light text-[#0d253d] tracking-[-0.4px] mb-1 font-sohne">
                    {isOAuthSignup 
                      ? 'Complete Merchant Setup' 
                      : mode === 'signin' 
                      ? 'Log in to Dashboard' 
                      : mode === 'signup' 
                      ? 'Create Merchant Account' 
                      : 'Set New Password'}
                  </h1>
                  <p className="text-xs text-[#64748d] leading-relaxed font-light">
                    {isOAuthSignup
                      ? 'Quick 5-step profile setup to start collecting instant payments'
                      : mode === 'signin' 
                      ? 'Manage payments, instant settlements, and customer refunds' 
                      : mode === 'signup'
                      ? 'Start collecting instant 0% direct UPI payments in minutes'
                      : 'Choose a strong password with at least 6 characters'}
                  </p>
                </div>

                {error && (
                  <div className="mt-4 bg-rose-50/80 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-normal">{formatCustomerError(error)}</span>
                  </div>
                )}

                {message && (
                  <div className="mt-4 bg-emerald-50/80 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                {/* ── Primary Auth Mode Switcher: Log In vs Sign Up (hidden in reset mode & Google OAuth onboarding) ── */}
                {mode !== 'reset' && !isOAuthSignup && (
                  <div className="mt-5 p-1 bg-[#f0f2f5] rounded-full grid grid-cols-2 gap-1 border border-[#e3e8ee] shadow-2xs">
                    <button 
                      type="button" 
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                      className={`py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === 'signin' 
                          ? 'bg-white text-[#533afd] shadow-xs' 
                          : 'text-[#64748d] hover:text-[#0d253d]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Log In</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                      className={`py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === 'signup' 
                          ? 'bg-white text-[#533afd] shadow-xs' 
                          : 'text-[#64748d] hover:text-[#0d253d]'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}

                {/* In Sign In Mode ONLY: Sub-Tab Switcher (WhatsApp OTP vs Password) */}
                {mode === 'signin' && (
                  <div className="mt-4 p-1 bg-[#f6f9fc] rounded-lg grid grid-cols-2 gap-1 border border-[#e3e8ee]/70 shadow-xs">
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthTab(isWaDegraded ? 'email' : 'whatsapp');
                        setError('');
                        setMessage('');
                        setOtpSent(false);
                        setEmailOtpSent(false);
                      }}
                      className={`py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        authTab === 'whatsapp' || authTab === 'email'
                          ? 'bg-white text-[#533afd] shadow-sm' 
                          : 'text-[#64748d] hover:text-[#0d253d]'
                      }`}
                    >
                      {authTab === 'email' ? (
                        <>
                          <Mail className="w-3.5 h-3.5 text-[#533afd]" />
                          <span>Email OTP</span>
                          {isWaDegraded && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded ml-1">
                              Primary
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5 text-[#009d6d]" />
                          <span>WhatsApp OTP</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setAuthTab('password'); setError(''); setMessage(''); }}
                      className={`py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                        authTab === 'password' 
                          ? 'bg-white text-[#533afd] shadow-xs' 
                          : 'text-[#64748d] hover:text-[#0d253d]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Password</span>
                    </button>
                  </div>
                )}

                {/* Degraded Alert Banner when WhatsApp delivery is experiencing delays */}
                {mode === 'signin' && isWaDegraded && (
                  <div className="mt-3.5 p-3 rounded-lg bg-amber-50 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-[11px] leading-relaxed">
                      <div className="font-semibold text-amber-900 flex items-center justify-between">
                        <span>Email OTP Active</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                          Auto Fallback
                        </span>
                      </div>
                      <p className="text-amber-800 mt-0.5">
                        WhatsApp OTP delivery is experiencing delays. Login is defaulted to fast 6-digit Email OTP.
                      </p>
                      {authTab === 'email' ? (
                        <button
                          type="button"
                          onClick={() => { setAuthTab('whatsapp'); setError(''); setMessage(''); setOtpSent(false); }}
                          className="mt-1 font-semibold text-amber-950 underline hover:text-amber-800 cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Prefer WhatsApp? Try WhatsApp OTP anyway &rarr;</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setAuthTab('email'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                          className="mt-1 font-semibold text-blue-700 underline hover:text-blue-900 cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>&larr; Switch back to recommended Email OTP</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Sign In: WhatsApp OTP View (DEFAULT) ── */}
                {mode === 'signin' && authTab === 'whatsapp' && (
                  <div className="mt-6 flex flex-col space-y-4">
                    {!otpSent ? (
                      <>
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-xs font-medium text-[#64748d] flex items-center justify-between">
                            <span>WhatsApp Mobile Number</span>
                            <span className="text-[#009d6d] font-semibold text-[11px] flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              Instant WhatsApp OTP
                            </span>
                          </label>
                          <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all border border-[#e3e8ee] shadow-2xs">
                            <div className="flex items-center gap-1.5 pr-2.5 py-2 text-[#0d253d] text-sm font-semibold border-r border-[#e3e8ee] shrink-0 select-none">
                              <IndianFlag className="w-4 h-3" />
                              <span>+91</span>
                            </div>
                            <input
                              type="tel"
                              maxLength={10}
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                              onKeyDown={(e) => e.key === 'Enter' && phone.trim().replace(/\D/g, '').length === 10 && triggerOtpFlow('whatsapp')}
                              placeholder="10-digit WhatsApp number"
                              className="w-full bg-transparent py-2.5 pl-3 text-sm text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium font-sans tracking-normal"
                            />
                          </div>
                          <p className="text-[11px] text-[#64748d] leading-relaxed">
                            We will send a 6-digit verification code directly to your WhatsApp.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => triggerOtpFlow('whatsapp')}
                          disabled={loading || phone.trim().replace(/\D/g, '').length !== 10}
                          className="w-full h-11 bg-[#009d6d] hover:bg-[#007f58] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              <span>Send WhatsApp OTP</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Blue line at bottom to switch to Email OTP */}
                        <div className="text-center pt-2 border-t border-[#e3e8ee]/60">
                          <button
                            type="button"
                            onClick={() => { setAuthTab('email'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                            className="text-xs text-[#533afd] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Prefer email? Sign in with Email OTP &rarr;</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                          <div className="flex items-center gap-2 text-xs text-[#0d253d] font-medium">
                            <MessageCircle className="w-4 h-4 text-[#009d6d] shrink-0" />
                            <span>OTP sent to WhatsApp <strong className="text-emerald-700">+91 {phone}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(''); setError(''); setMessage(''); }}
                            className="text-[11px] text-[#533afd] font-semibold hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#64748d] text-center block">
                            Enter 6-digit WhatsApp Verification Code
                          </label>
                          <OtpBoxInput value={otp} onChange={setOtp} disabled={loading} />
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={loading || otp.length !== 6}
                          className="w-full h-11 bg-[#009d6d] hover:bg-[#007f58] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Verify OTP &amp; Enter Dashboard</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Resend button & blue line at bottom */}
                        <div className="text-center pt-2 space-y-2.5">
                          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/70 text-[11px] text-[#64748d]">
                            <MessageCircle className="w-3.5 h-3.5 text-[#009d6d] shrink-0" />
                            <span>Enter the 6-digit code received on your WhatsApp number.</span>
                          </div>

                          {otpTimer > 0 ? (
                            <span className="text-xs text-[#64748d] block">
                              Resend code in <strong className="text-[#0d253d]">{otpTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => triggerOtpFlow('whatsapp')}
                              disabled={loading}
                              className="text-xs font-semibold text-[#009d6d] hover:underline cursor-pointer"
                            >
                              Didn&apos;t receive WhatsApp code? Resend OTP
                            </button>
                          )}

                          {/* Blue line at bottom */}
                          <div className="pt-2 border-t border-[#e3e8ee]/60">
                            <button
                              type="button"
                              onClick={() => { setAuthTab('email'); setError(''); setMessage(''); setEmailOtpSent(false); }}
                              className="text-xs text-[#533afd] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                            >
                              <span>Prefer email? Sign in with Email OTP &rarr;</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Sign In: Email OTP View (Alternative via Blue Line) ── */}
                {mode === 'signin' && authTab === 'email' && (
                  <div className="mt-6 flex flex-col space-y-4">
                    {!emailOtpSent ? (
                      <>
                        <div className="flex flex-col space-y-1.5">
                          <label className="text-xs font-medium text-[#64748d] flex items-center justify-between">
                            <span>Merchant Email / ID</span>
                            <span className="text-[#533afd] font-semibold text-[11px]">
                              6-Digit OTP
                            </span>
                          </label>
                          <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                            <Mail className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                            <input
                              type="text"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && email.trim() && handleSendEmailOtp()}
                              placeholder="merchant@company.com or Merchant ID"
                              className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                            />
                          </div>
                          <p className="text-[11px] text-[#64748d] leading-relaxed">
                            We will send a 6-digit verification code to your registered email inbox.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={loading || !email.trim()}
                          className="w-full h-11 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Send Email OTP</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Blue line at bottom to switch to WhatsApp OTP */}
                        <div className="text-center pt-2 border-t border-[#e3e8ee]/60">
                          <button
                            type="button"
                            onClick={() => { setAuthTab('whatsapp'); setError(''); setMessage(''); setOtpSent(false); }}
                            className="text-xs text-[#533afd] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{isWaDegraded ? 'Prefer WhatsApp? Try WhatsApp OTP anyway \u2192' : 'Prefer WhatsApp? Sign in with WhatsApp OTP \u2192'}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f9fc]/60 border border-[#e3e8ee]">
                          <div className="flex items-center gap-2 text-xs text-[#0d253d] font-medium">
                            <Mail className="w-4 h-4 text-[#533afd] shrink-0" />
                            <span>Code sent to <strong className="text-[#533afd]">{email}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); setMessage(''); }}
                            className="text-[11px] text-[#533afd] font-semibold hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#64748d] text-center block">
                            Enter 6-digit Email Verification Code
                          </label>
                          <OtpBoxInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={loading || emailOtp.length !== 6}
                          className="w-full h-11 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Verify OTP &amp; Enter Dashboard</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Resend button & blue line at bottom */}
                        <div className="text-center pt-2 space-y-2.5">
                          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#f6f9fc]/50 border border-[#e3e8ee]/70 text-[11px] text-[#64748d]">
                            <Mail className="w-3.5 h-3.5 text-[#533afd] shrink-0" />
                            <span>Enter the 6-digit verification code from your email to sign in.</span>
                          </div>

                          {emailTimer > 0 ? (
                            <span className="text-xs text-[#64748d] block">
                              Resend code in <strong className="text-[#0d253d]">{emailTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={loading}
                              className="text-xs font-semibold text-[#533afd] hover:underline cursor-pointer"
                            >
                              Didn&apos;t receive email? Resend code
                            </button>
                          )}

                          {/* Blue line at bottom */}
                          <div className="pt-2 border-t border-[#e3e8ee]/60">
                            <button
                              type="button"
                              onClick={() => { setAuthTab('whatsapp'); setError(''); setMessage(''); setOtpSent(false); }}
                              className="text-xs text-[#533afd] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{isWaDegraded ? 'Prefer WhatsApp? Try WhatsApp OTP anyway \u2192' : 'Prefer WhatsApp? Sign in with WhatsApp OTP \u2192'}</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Sign In: Email / ID & Password View ── */}
                {mode === 'signin' && authTab === 'password' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleAuth('signin'); }} className="mt-6 flex flex-col space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-medium text-[#64748d]">Merchant Email / ID</label>
                      <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                        <Mail className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                        <input
                          type="text"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="merchant@company.com or Merchant ID"
                          className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#64748d]">Password</label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-semibold text-[#533afd] hover:underline"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                        <Lock className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="text-[#64748d] hover:text-[#0d253d] p-1 cursor-pointer"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <span className="t-icon-swap" data-state={showPassword ? 'b' : 'a'}>
                            <Eye className="t-icon t-icon--a w-4 h-4" aria-hidden={showPassword} />
                            <EyeOff className="t-icon t-icon--b w-4 h-4" aria-hidden={!showPassword} />
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Log In to Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ── Mode: Sign Up Form (Unified with Email OTP or Dedicated Google OAuth Onboarding) ── */}
                {mode === 'signup' && (
                  isOAuthSignup ? (
                    <div className="mt-5 flex flex-col">
                      {/* Google Connected Account Pill */}
                      <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] mb-5 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-white shadow-2xs border border-[#e3e8ee] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#0d253d] truncate max-w-[190px]">{email}</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                Verified
                              </span>
                            </div>
                            <span className="text-[10px] text-[#64748d] block font-medium">Google Workspace Verified</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSignOutToSwitchAccount}
                          className="text-[11px] font-semibold text-[#533afd] hover:underline cursor-pointer shrink-0 ml-2"
                        >
                          Change
                        </button>
                      </div>

                      {/* Stepper Progress Header */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#533afd] flex items-center gap-1.5">
                            <span>Step {oauthStep} of 5</span>
                            <span className="text-[#64748d] font-normal">•</span>
                            <span className="text-[#0d253d]">
                              {oauthStep === 1 && 'Create Password'}
                              {oauthStep === 2 && 'Business Details'}
                              {oauthStep === 3 && 'Website / Store'}
                              {oauthStep === 4 && 'Settlement UPI'}
                              {oauthStep === 5 && 'Mobile Number'}
                            </span>
                          </span>
                          <span className="text-[10px] text-[#64748d] font-semibold">
                            {oauthStep === 1 && '20%'}
                            {oauthStep === 2 && '40%'}
                            {oauthStep === 3 && '60%'}
                            {oauthStep === 4 && '80%'}
                            {oauthStep === 5 && '100%'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#533afd] rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${(oauthStep / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Form Step Container with transitions-dev Step Slide */}
                      <form 
                        onSubmit={(e) => { 
                          e.preventDefault(); 
                          handleNextOAuthStep(); 
                        }} 
                        className="flex flex-col"
                      >
                        <div 
                          key={oauthStep} 
                          className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'}`}
                        >
                          {/* ── STEP 1: Create Password ── */}
                          {oauthStep === 1 && (
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-sm font-semibold text-[#0d253d] mb-0.5">
                                  Create a strong password
                                </h2>
                                <p className="text-xs text-[#64748d] leading-relaxed">
                                  Set a secure password for direct login with your email address anytime.
                                </p>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                                    <span>New Password</span>
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <span className="text-[10px] text-[#64748d] font-medium">8+ chars required</span>
                                </div>
                                <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                                  <Lock className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoFocus
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="e.g. MyMobPay@2026"
                                    className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="text-[#64748d] hover:text-[#0d253d] p-1 cursor-pointer"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                  >
                                    <span className="t-icon-swap" data-state={showPassword ? 'b' : 'a'}>
                                      <Eye className="t-icon t-icon--a w-4 h-4" aria-hidden={showPassword} />
                                      <EyeOff className="t-icon t-icon--b w-4 h-4" aria-hidden={!showPassword} />
                                    </span>
                                  </button>
                                </div>

                                {/* Password criteria checklist */}
                                <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5 text-[11px] mt-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748d]">Password Requirements</div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasMinLength ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                        {passwordCriteria.hasMinLength ? '✓' : '·'}
                                      </span>
                                      8+ Characters
                                    </span>
                                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasUppercase ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                        {passwordCriteria.hasUppercase ? '✓' : '·'}
                                      </span>
                                      1 Uppercase (A-Z)
                                    </span>
                                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                        {passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? '✓' : '·'}
                                      </span>
                                      Number &amp; Symbol
                                    </span>
                                    <span className={`flex items-center gap-1.5 ${passwordCriteria.noSequenceOrRepeat ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.noSequenceOrRepeat ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                        {passwordCriteria.noSequenceOrRepeat ? '✓' : '·'}
                                      </span>
                                      No 123 / 111
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── STEP 2: Business / Brand Name ── */}
                          {oauthStep === 2 && (
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-sm font-semibold text-[#0d253d] mb-0.5">
                                  What is your business name?
                                </h2>
                                <p className="text-xs text-[#64748d] leading-relaxed">
                                  This name will be presented to your customers across checkout screens and payment receipts.
                                </p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                                  <span>Business / Brand Name</span>
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                                  <Building2 className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                                  <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="e.g. Acme Tech Studio"
                                    className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                                  />
                                </div>
                                <p className="text-[11px] text-[#64748d]">
                                  You can change your display branding anytime in your settings.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* ── STEP 3: Website URL (Optional / Can Skip) ── */}
                          {oauthStep === 3 && (
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <h2 className="text-sm font-semibold text-[#0d253d]">
                                    Do you have a website or app?
                                  </h2>
                                  <span className="text-[10px] font-semibold text-[#64748d] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                    Optional
                                  </span>
                                </div>
                                <p className="text-xs text-[#64748d] leading-relaxed">
                                  Add your storefront or product link to configure webhook callbacks and automated checkout redirects.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                                    <span>Website or Store URL</span>
                                  </label>
                                  {websiteUrl.trim() && (
                                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      Valid URL
                                    </span>
                                  )}
                                </div>

                                <div className={`flex items-center rounded-lg px-3 transition-all border ${
                                  noWebsite 
                                    ? 'bg-slate-50 border-slate-200 opacity-60' 
                                    : 'bg-white border-[#e3e8ee] focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] shadow-2xs'
                                }`}>
                                  <Globe className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                                  <span className="text-xs text-[#64748d] font-mono mr-1 select-none">https://</span>
                                  <input
                                    type="text"
                                    autoFocus={!noWebsite}
                                    disabled={noWebsite || loading}
                                    value={websiteUrl.replace(/^https?:\/\//i, '')}
                                    onChange={(e) => {
                                      setWebsiteUrl(e.target.value.trim());
                                      if (noWebsite) setNoWebsite(false);
                                    }}
                                    placeholder="acmestudio.com"
                                    className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium font-sans"
                                  />
                                </div>

                                {/* No website quick-toggle checkbox */}
                                <div className="pt-1">
                                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={noWebsite}
                                      onChange={(e) => {
                                        setNoWebsite(e.target.checked);
                                        if (e.target.checked) setWebsiteUrl('');
                                      }}
                                      className="w-3.5 h-3.5 rounded text-[#533afd] border-[#cbd5e1] focus:ring-[#533afd] cursor-pointer"
                                    />
                                    <span className="text-xs text-[#64748d] hover:text-[#0d253d]">
                                      I don&apos;t have a website yet (UPI links will work directly)
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── STEP 4: Settlement UPI ID ── */}
                          {oauthStep === 4 && (
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-sm font-semibold text-[#0d253d] mb-0.5">
                                  Where should settlements route?
                                </h2>
                                <p className="text-xs text-[#64748d] leading-relaxed">
                                  Enter your settlement UPI ID. All incoming customer payments route directly to your bank account with 0% gateway commission.
                                </p>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                                    <span>Settlement UPI ID</span>
                                    <span className="text-red-500">*</span>
                                  </label>
                                  {getBankFromUpi(upiId) ? (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBankFromUpi(upiId).color}`}>
                                      {getBankFromUpi(upiId).name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#533afd] font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                      Direct Bank Routing
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                                  <QrCode className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                                  <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                                    placeholder="e.g. merchant@okhdfcbank"
                                    className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium font-mono"
                                  />
                                </div>
                                <p className="text-[11px] text-[#64748d]">
                                  Supports all bank UPI handles: @okhdfcbank, @oksbi, @okicici, @paytm, @ybl, etc.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* ── STEP 5: Mobile Number (WhatsApp) ── */}
                          {oauthStep === 5 && (
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-sm font-semibold text-[#0d253d] mb-0.5">
                                  Enter your mobile number
                                </h2>
                                <p className="text-xs text-[#64748d] leading-relaxed">
                                  Indian mobile number for instant transaction alerts, high-value settlement notifications, and account recovery.
                                </p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0d253d] block">
                                  Mobile Number (WhatsApp)
                                </label>

                                <div className="flex items-center rounded-lg px-3 transition-all border bg-white border-[#e3e8ee] focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] shadow-2xs">
                                  <div className="flex items-center gap-1.5 pr-2.5 py-2.5 text-[#0d253d] text-xs font-semibold border-r border-[#e3e8ee] shrink-0 select-none">
                                    <IndianFlag className="w-4 h-3" />
                                    <span>+91</span>
                                  </div>
                                  <input
                                    type="tel"
                                    autoFocus
                                    maxLength={10}
                                    required
                                    disabled={loading}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="10-digit mobile number"
                                    className="w-full bg-transparent py-2.5 pl-3 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium font-sans tracking-normal"
                                  />
                                </div>
                              </div>

                              {/* Account Summary Mini-Card */}
                              <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5 text-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748d] block mb-1">
                                  Account Summary
                                </span>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#64748d]">Google Account</span>
                                  <span className="font-semibold text-[#0d253d] truncate max-w-[180px]">{email}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#64748d]">Business</span>
                                  <span className="font-semibold text-[#0d253d]">{businessName || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#64748d]">Website</span>
                                  <span className="font-semibold text-[#0d253d] truncate max-w-[180px]">
                                    {noWebsite || !websiteUrl.trim() ? 'Not provided (Can add later)' : websiteUrl.replace(/^https?:\/\//i, '')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#64748d]">Settlement UPI</span>
                                  <span className="font-mono font-semibold text-[#0d253d]">{upiId || '—'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation Buttons Row */}
                        <div className="mt-6 flex items-center gap-2.5">
                          {oauthStep > 1 && (
                            <button
                              type="button"
                              onClick={handlePrevOAuthStep}
                              disabled={loading}
                              className="h-11 px-4 rounded-full border border-[#e3e8ee] bg-white hover:bg-[#f6f9fc] text-[#0d253d] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                          )}

                          {oauthStep === 3 && !noWebsite && !websiteUrl.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                setNoWebsite(true);
                                setStepDirection('forward');
                                setOauthStep(4);
                              }}
                              disabled={loading}
                              className="h-11 px-4 rounded-full border border-dashed border-[#cbd5e1] hover:border-[#94a3b8] bg-[#f8fafc] text-[#64748d] hover:text-[#0d253d] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>Skip for now</span>
                            </button>
                          )}

                          <button
                            type="submit"
                            disabled={
                              loading ||
                              (oauthStep === 1 && !(passwordCriteria?.isValid || passwordCriteria?.allMet)) ||
                              (oauthStep === 2 && businessName.trim().length < 2) ||
                              (oauthStep === 3 && !noWebsite && websiteUrl.trim().length > 0 && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(websiteUrl.trim())) ||
                              (oauthStep === 4 && (!upiId.trim().includes('@') || upiId.trim().length < 5)) ||
                              (oauthStep === 5 && (phone.trim().length !== 10 || !/^[6-9]\d{9}$/.test(phone.trim())))
                            }
                            className="flex-1 h-11 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>{oauthStep === 5 ? 'Creating Merchant Account...' : 'Verifying...'}</span>
                              </>
                            ) : oauthStep === 5 ? (
                              <>
                                <span>Complete Setup &amp; Launch Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Continue</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-center mt-3">
                          <span className="text-[10px] text-[#64748d]">
                            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-semibold">↵ Enter</kbd> to continue
                          </span>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleAuth('signup'); }} className="mt-6 flex flex-col space-y-4">
                      {/* Merchant Email Address with inline OTP verification */}
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                            <span>Merchant Email Address</span>
                            <span className="text-red-500">*</span>
                          </label>
                          {isEmailVerified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center rounded-lg px-3 transition-all border ${
                          isEmailVerified 
                            ? 'bg-emerald-50/40 border-emerald-300' 
                            : 'bg-white border-[#e3e8ee] focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] shadow-2xs'
                        }`}>
                          <Mail className={`w-4 h-4 mr-2 shrink-0 ${isEmailVerified ? 'text-emerald-600' : 'text-[#64748d]'}`} />
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
                            className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium disabled:opacity-85"
                          />
                          {isEmailVerified ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEmailVerified(false);
                                setEmailOtpSent(false);
                                setEmailOtp('');
                              }}
                              className="text-[11px] text-[#533afd] font-medium hover:underline shrink-0 pl-2 cursor-pointer"
                            >
                              Change
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={loading || !email.trim() || !email.includes('@')}
                              className="shrink-0 ml-2 px-2.5 py-1.5 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] disabled:opacity-40 text-white rounded-full text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              {loading && !emailOtpSent ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : emailOtpSent ? (
                                'Resend OTP'
                              ) : (
                                'Verify'
                              )}
                            </button>
                          )}
                        </div>

                        {/* Inline OTP Verification Box */}
                        {emailOtpSent && !isEmailVerified && (
                          <div className="mt-2 p-3.5 rounded-xl bg-[#f6f9fc]/70 border border-[#e3e8ee] space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[11px] font-semibold text-[#0d253d] flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-[#533afd]" />
                                <span>Code sent to <strong className="text-[#533afd]">{email}</strong></span>
                              </span>
                              {emailTimer > 0 ? (
                                <span className="text-[10px] text-[#64748d]">
                                  Resend in <strong>{emailTimer}s</strong>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendEmailOtp}
                                  disabled={loading}
                                  className="text-[10px] font-bold text-[#533afd] hover:underline cursor-pointer"
                                >
                                  Resend Code
                                </button>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-[#64748d] block text-center">
                                Enter 6-Digit Email Verification Code
                              </label>
                              <OtpBoxInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={loading || emailOtp.length !== 6}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm 6-Digit OTP</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Create Strong Password */}
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                            <span>Create Password (8+ chars)</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] text-[#64748d] font-medium">1 Upper, 1 Number, 1 Symbol</span>
                        </div>
                        <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                          <Lock className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="e.g. MyMobPay@2026"
                            className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="text-[#64748d] hover:text-[#0d253d] p-1 cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            <span className="t-icon-swap" data-state={showPassword ? 'b' : 'a'}>
                              <Eye className="t-icon t-icon--a w-4 h-4" aria-hidden={showPassword} />
                              <EyeOff className="t-icon t-icon--b w-4 h-4" aria-hidden={!showPassword} />
                            </span>
                          </button>
                        </div>

                        {/* Real-time Password Strength Criteria Checklist */}
                        {password.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-[#f6f9fc] border border-[#e3e8ee] space-y-1 text-[11px] mt-1">
                            <div className="grid grid-cols-2 gap-1.5">
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasMinLength ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                  {passwordCriteria.hasMinLength ? '✓' : '·'}
                                </span>
                                8+ Characters
                              </span>
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasUppercase ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                  {passwordCriteria.hasUppercase ? '✓' : '·'}
                                </span>
                                1 Uppercase (A-Z)
                              </span>
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                  {passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? '✓' : '·'}
                                </span>
                                Number &amp; Symbol
                              </span>
                              <span className={`flex items-center gap-1.5 ${passwordCriteria.noSequenceOrRepeat ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.noSequenceOrRepeat ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                                  {passwordCriteria.noSequenceOrRepeat ? '✓' : '·'}
                                </span>
                                No 123 / 111
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Business / Brand Name */}
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                          <span>Business / Brand Name</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                          <Building2 className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Acme Tech Studio"
                            className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Settlement UPI ID */}
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-[#0d253d] flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span>Settlement UPI ID</span>
                            <span className="text-red-500">*</span>
                          </span>
                          <span className="text-[10px] text-[#533afd] font-medium">Direct Bank Routing</span>
                        </label>
                        <div className="flex items-center rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] transition-all border border-[#e3e8ee] shadow-2xs">
                          <QrCode className="w-4 h-4 text-[#64748d] mr-2 shrink-0" />
                          <input
                            type="text"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            onBlur={async () => {
                              const cleanUpi = upiId.trim().toLowerCase();
                              if (cleanUpi.includes('@') && cleanUpi.length >= 5) {
                                try {
                                  const checkRes = await fetch('/api/auth/check-details', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ upiId: cleanUpi }),
                                  });
                                  const checkData = await checkRes.json();
                                  if (!checkRes.ok || checkData.available === false) {
                                    setError(checkData.error || 'Settlement UPI ID is already registered by another merchant.');
                                  }
                                } catch (e) {
                                  // ignore
                                }
                              }
                            }}
                            placeholder="e.g. merchant@okhdfcbank"
                            className="w-full bg-transparent py-2.5 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-[#64748d]">
                          Direct settlement to your bank UPI address.
                        </p>
                      </div>

                      {/* Mobile Phone Number (Mandatory - Verification disabled for now) */}
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#0d253d] flex items-center gap-1">
                            <span>Mobile Number (WhatsApp)</span>
                            <span className="text-red-500">*</span>
                          </label>
                        </div>

                        <div className="flex items-center rounded-lg px-3 transition-all border bg-white border-[#e3e8ee] focus-within:ring-2 focus-within:ring-[#533afd]/20 focus-within:border-[#533afd] shadow-2xs">
                          <div className="flex items-center gap-1.5 pr-2.5 py-2.5 text-[#0d253d] text-xs font-semibold border-r border-[#e3e8ee] shrink-0 select-none">
                            <IndianFlag className="w-4 h-3" />
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            disabled={loading}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="10-digit mobile number"
                            className="w-full bg-transparent py-2.5 pl-3 text-xs text-[#0d253d] placeholder-[#64748d] focus:outline-none font-medium font-sans tracking-normal"
                          />
                        </div>
                        <p className="text-[11px] text-[#64748d]">
                          10-digit Indian mobile number for critical transaction alerts and account security.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading || !isEmailVerified || !(passwordCriteria?.isValid || passwordCriteria?.allMet) || !businessName.trim() || !upiId.trim() || phone.replace(/\D/g, '').length !== 10}
                        className={`w-full h-11 rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 mt-2 cursor-pointer disabled:cursor-not-allowed ${
                          isEmailVerified && (passwordCriteria?.isValid || passwordCriteria?.allMet) && businessName.trim() && upiId.trim() && phone.replace(/\D/g, '').length === 10
                            ? 'bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white shadow-sm'
                            : 'bg-slate-100 text-[#64748d] border border-[#e3e8ee] opacity-80'
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : !isEmailVerified ? (
                          <>
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>Verify Email to Continue</span>
                          </>
                        ) : (
                          <>
                            <span>Create Merchant Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )
                )}

                {/* ── Mode: Reset Password ── */}
                {mode === 'reset' && (
                  <form onSubmit={handleUpdateNewPassword} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          minLength={6}
                          className="w-full h-11 px-3.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all outline-hidden pr-10 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          <span className="t-icon-swap" data-state={showNewPassword ? 'b' : 'a'}>
                            <Eye className="t-icon t-icon--a w-4 h-4" aria-hidden={showNewPassword} />
                            <EyeOff className="t-icon t-icon--b w-4 h-4" aria-hidden={!showNewPassword} />
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        minLength={6}
                        className="w-full h-11 px-3.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all outline-hidden shadow-2xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-[#533afd] hover:bg-[#432bc9] text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Set New Password &amp; Continue</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Soft Divider */}
                {mode !== 'reset' && !isOAuthSignup && (
                  <div className="relative my-6 flex items-center justify-center">
                    <div className="w-full h-px bg-[#e3e8ee]"></div>
                    <span className="absolute px-3 bg-white text-[#64748d] text-[10px] font-bold uppercase tracking-wider">
                      OR
                    </span>
                  </div>
                )}

                {/* Google Workspace Login */}
                {mode !== 'reset' && !isOAuthSignup && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-11 bg-white hover:bg-[#f6f9fc] text-[#0d253d] rounded-full text-xs font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50 border border-[#e3e8ee] shadow-2xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" fill="#4285F4"></path>
                      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z" fill="#34A853"></path>
                      <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" fill="#FBBC05"></path>
                      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335"></path>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}

                {/* QR Code Express Login Bar (in Signin mode, desktop only) */}
                {mode === 'signin' && !isOAuthSignup && (
                  <div className="mt-4 p-3.5 rounded-lg bg-[#f6f9fc] items-center justify-between gap-3 border border-[#e3e8ee]/60 hidden lg:flex">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-[#000d21] shadow-xs">
                        <QrCode className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-[#0d253d]">QR Express Login</span>
                        <span className="text-[11px] text-[#64748d] leading-tight">Scan with mymobpay Merchant Mobile App</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-[#f6f9fc] text-[#533afd] text-xs font-bold transition-colors cursor-pointer shadow-xs border border-slate-200/80"
                    >
                      Show QR
                    </button>
                  </div>
                )}

              </div>

              {/* Card Promotional Footer: Registration / Signin Incentive */}
              <div className="px-6 py-4 bg-[#f6f9fc] text-center border-t border-[#e3e8ee]/70">
                {mode === 'reset' ? (
                  <p className="text-xs text-[#64748d]">
                    Remembered your password?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                      className="font-bold text-[#533afd] hover:underline cursor-pointer ml-1"
                    >
                      Log In to Dashboard
                    </button>
                  </p>
                ) : mode === 'signin' ? (
                  <p className="text-xs text-[#64748d]">
                    New to mymobpay?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                      className="font-bold text-[#533afd] hover:underline cursor-pointer ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-[#64748d]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                      className="font-bold text-[#533afd] hover:underline cursor-pointer ml-1"
                    >
                      Log In to Dashboard
                    </button>
                  </p>
                )}
              </div>

            </div>

            {/* Security & Institutional Compliance Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[#64748d] text-[11px] font-semibold">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#009d6d]" />
                <span>256-Bit SSL Encryption</span>
              </div>
              <span className="hidden sm:inline text-[#c4c6ce]">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#533afd]" />
                <span>NPCI UPI Standard</span>
              </div>
              <span className="hidden sm:inline text-[#c4c6ce]">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#009d6d]" />
                <span>Direct Bank Settlement</span>
              </div>
            </div>

            {/* Merchant Support Strip */}
            <div className="mt-3.5 text-center">
              <p className="text-xs text-[#64748d] flex items-center justify-center gap-1.5 flex-wrap">
                <span>Need assistance? Contact support:</span>
                <a 
                  className="font-semibold text-[#533afd] hover:underline inline-flex items-center gap-1" 
                  href="mailto:support@mymob.tech"
                >
                  <Mail className="w-3.5 h-3.5" />
                  support@mymob.tech
                </a>
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ── Interactive QR Code Modal (transitions-dev 06-modal.md) ── */}
      {isQrModalMounted && (
        <div 
          className={`fixed inset-0 z-50 bg-[#0d253d]/70 backdrop-blur-sm flex items-center justify-center p-4 ${qrOverlayClass}`}
          onClick={() => setShowQrModal(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center relative border border-slate-200 ${qrModalClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-[#0d253d]">Scan to Log in</span>
              <button 
                type="button" 
                onClick={() => setShowQrModal(false)}
                className="text-[#64748d] hover:text-[#0d253d] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-[#64748d] mb-4 leading-relaxed">
              Open the mymobpay Merchant App, tap on <strong>Profile &gt; Scan Web QR</strong> to instantly sign in.
            </p>

            {/* Dynamic QR Code */}
            <div className="mx-auto w-48 h-48 bg-[#f6f9fc] p-3.5 rounded-xl flex items-center justify-center relative border border-[#e3e8ee]">
              <QRCode 
                value={`mymobpay://web-login?challenge=${qrChallenge}`} 
                size={160} 
                level="M" 
                style={{ width: '100%', height: 'auto' }}
              />
              <div className="absolute w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#533afd]" />
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold text-[#64748d] flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#009d6d] animate-spin" style={{ animationDuration: '4s' }} />
              <span>QR refreshes in {qrTimer}s</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
