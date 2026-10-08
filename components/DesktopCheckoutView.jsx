'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { MyMobPayLogo, MyMobPayMark } from '@/components/MyMobPayLogo';

/* ── Instant Inline Vector Icons (0ms render time, no font loading delays, no text ligatures) ── */
const IconVerifiedUser = ({ className = "w-[18px] h-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
  </svg>
);

const IconStorefront = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h16a1 1 0 011 1v2.5a3.5 3.5 0 01-3.5 3.5A3.5 3.5 0 0114 9.3 3.5 3.5 0 0110 9.3 3.5 3.5 0 016.5 11 3.5 3.5 0 013 7.5V5a1 1 0 011-1zm0 9.5a3.48 3.48 0 002 .63c1.07 0 2.05-.48 2.7-1.24.66.76 1.63 1.24 2.7 1.24s2.05-.48 2.7-1.24c.66.76 1.63 1.24 2.7 1.24a3.48 3.48 0 002-.63V19a1 1 0 01-1 1H5a1 1 0 01-1-1v-5.5zM13 14h-2v4h2v-4z"/>
  </svg>
);

const IconCheckCircle = ({ className = "w-[13px] h-[13px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const IconTranslate = ({ className = "w-[14px] h-[14px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8l6 0M4 14l6-6 2 3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6"/>
  </svg>
);

const IconClose = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconQrCodeScanner = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 7V3a1 1 0 011-1h4v2H4v3H2zm0 10v4a1 1 0 001 1h4v-2H4v-3H2zm18 0v3h-3v2h4a1 1 0 001-1v-4h-2zm-3-15v2h3v3h2V3a1 1 0 00-1-1h-4zM7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z"/>
  </svg>
);

const IconBolt = ({ className = "w-[12px] h-[12px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.35.05-.1.08-.15L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.13L11 21z"/>
  </svg>
);

const IconChevronRight = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const IconAccountBalance = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm9.5-20.5L2 6v2h19V6l-9.5-4.5z"/>
  </svg>
);

const IconBitcoin = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.06 11.57c.59-.69.94-1.59.94-2.57 0-1.86-1.27-3.43-3-3.87V3h-2v2h-2V3H9v2H6v2h2v10H6v2h3v2h2v-2h2c2.21 0 4-1.79 4-4 0-1.45-.78-2.73-1.94-3.43zM10 7h3c1.1 0 2 .9 2 2s-.9 2-2 2h-3V7zm4 10h-4v-4h4c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
  </svg>
);

const IconLink = ({ className = "w-[12px] h-[12px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
  </svg>
);

const IconSecurity = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

const IconSchedule = ({ className = "w-[14px] h-[14px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
);

const IconVerified = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

const IconCopy = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
  </svg>
);

const IconCheck = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const IconInfo = ({ className = "w-[15px] h-[15px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

const IconLock = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

const IconHelp = ({ className = "w-[15px] h-[15px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
  </svg>
);

const IconArrowForward = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const IconCreditCard = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

const IconLocalShipping = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

const IconArrowBack = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const IconWallet = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

export default function DesktopCheckoutView({
  merchant,
  orderId,
  paramRef,
  paramCallback,
  activeId,
  displayAmt,
  amtWhole,
  amtFrac,
  bizName,
  bizInitial,
  upiId,
  upiQrValue,
  orderDate,
  timeLeft,
  mm,
  ss,
  activeOpt,
  setActiveOpt,
  copyFeedback,
  handleCopyUpi,
  isChecking,
  triggerChecking,
  checkMsg,
  handleReturn,
  bankName,
  bankAcc,
  bankIfsc,
  bankBranch,
  cryptoWallet,
  usdtAmt,
  curView,
  setCurView,
  okTime,
  orderMode,
  fmtInr,
  buildUpiLink,
  showUtr,
  setShowUtr,
  utr,
  setUtr,
  submitUtr,
  utrBusy,
  utrMsg,
  /* Optional card props */
  cardBrand,
  setCardBrand,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardHolder,
  setCardHolder,
  cardOtp,
  setCardOtp,
  cardBusy,
  cardMsg,
  submitCardPayment,
  /* Optional COD props */
  codName,
  setCodName,
  codPhone,
  setCodPhone,
  codAddress,
  setCodAddress,
  codPincode,
  setCodPincode,
  codCity,
  setCodCity,
  codBusy,
  codMsg,
  submitCodOrder,
}) {
  const [lang, setLang] = useState('en'); // 'en' | 'hi'
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [copiedField, setCopiedField] = useState(null); // 'upi' | 'acc' | 'ifsc' | 'crypto'
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [successCountdown, setSuccessCountdown] = useState(5);

  // Bank & UPI status assistance states
  const [bankTransferClicked, setBankTransferClicked] = useState(false);
  const [upiCheckCount, setUpiCheckCount] = useState(0);
  const [upiDelayed, setUpiDelayed] = useState(false);

  // Mark UPI as delayed if user stays on UPI screen for >45s without completing
  useEffect(() => {
    if (activeOpt !== 'upi') return;
    const t = setTimeout(() => {
      setUpiDelayed(true);
    }, 45000);
    return () => clearTimeout(t);
  }, [activeOpt]);

  const handleUpiCheckClick = (e) => {
    setUpiCheckCount(prev => prev + 1);
    if (triggerChecking) triggerChecking(e);
  };

  // Local card state fallbacks
  const [localCardBrand, setLocalCardBrand] = useState('visa');
  const [localCardNumber, setLocalCardNumber] = useState('');
  const [localCardExpiry, setLocalCardExpiry] = useState('');
  const [localCardCvv, setLocalCardCvv] = useState('');
  const [localCardHolder, setLocalCardHolder] = useState('');
  const [localCardOtp, setLocalCardOtp] = useState('');
  const [localCardBusy, setLocalCardBusy] = useState(false);
  const [localCardMsg, setLocalCardMsg] = useState('');

  const activeCardBrand = cardBrand !== undefined ? cardBrand : localCardBrand;
  const onCardBrandChange = setCardBrand || setLocalCardBrand;
  const activeCardNumber = cardNumber !== undefined ? cardNumber : localCardNumber;
  const onCardNumberChange = setCardNumber || setLocalCardNumber;
  const activeCardExpiry = cardExpiry !== undefined ? cardExpiry : localCardExpiry;
  const onCardExpiryChange = setCardExpiry || setLocalCardExpiry;
  const activeCardCvv = cardCvv !== undefined ? cardCvv : localCardCvv;
  const onCardCvvChange = setCardCvv || setLocalCardCvv;
  const activeCardHolder = cardHolder !== undefined ? cardHolder : localCardHolder;
  const onCardHolderChange = setCardHolder || setLocalCardHolder;
  const activeCardOtp = cardOtp !== undefined ? cardOtp : localCardOtp;
  const onCardOtpChange = setCardOtp || setLocalCardOtp;
  const activeCardBusy = cardBusy !== undefined ? cardBusy : localCardBusy;
  const activeCardMsg = cardMsg !== undefined ? cardMsg : localCardMsg;

  // Local COD state fallbacks
  const [localCodName, setLocalCodName] = useState('');
  const [localCodPhone, setLocalCodPhone] = useState('');
  const [localCodAddress, setLocalCodAddress] = useState('');
  const [localCodPincode, setLocalCodPincode] = useState('');
  const [localCodCity, setLocalCodCity] = useState('');
  const [localCodBusy, setLocalCodBusy] = useState(false);
  const [localCodMsg, setLocalCodMsg] = useState('');

  const activeCodName = codName !== undefined ? codName : localCodName;
  const onCodNameChange = setCodName || setLocalCodName;
  const activeCodPhone = codPhone !== undefined ? codPhone : localCodPhone;
  const onCodPhoneChange = setCodPhone || setLocalCodPhone;
  const activeCodAddress = codAddress !== undefined ? codAddress : localCodAddress;
  const onCodAddressChange = setCodAddress || setLocalCodAddress;
  const activeCodPincode = codPincode !== undefined ? codPincode : localCodPincode;
  const onCodPincodeChange = setCodPincode || setLocalCodPincode;
  const activeCodCity = codCity !== undefined ? codCity : localCodCity;
  const onCodCityChange = setCodCity || setLocalCodCity;
  const activeCodBusy = codBusy !== undefined ? codBusy : localCodBusy;
  const activeCodMsg = codMsg !== undefined ? codMsg : localCodMsg;

  // Fallback handlers if parent doesn't provide them
  const handleCardSubmit = async (e) => {
    if (typeof submitCardPayment === 'function') {
      return submitCardPayment(e);
    }
    if (e) e.preventDefault();
    if (orderMode !== 'test') {
      if (setCardMsg) setCardMsg('Direct card gateway is reserved for test mode. For live payments, please switch to UPI or Net Banking.');
      else setLocalCardMsg('Direct card gateway is reserved for test mode. For live payments, please switch to UPI or Net Banking.');
      return;
    }
    const cleanNum = activeCardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      if (setCardMsg) setCardMsg('Please enter a valid 16-digit card number.');
      else setLocalCardMsg('Please enter a valid 16-digit card number.');
      return;
    }
    setLocalCardBusy(true);
    setLocalCardMsg('');
    try {
      const res = await fetch('/api/orders/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: safeActiveId,
          card_brand: activeCardBrand,
          card_last4: cleanNum.slice(-4),
          cardholder_name: activeCardHolder.trim() || 'Valued Customer',
          otp: activeCardOtp.trim() || '123456'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Card processing failed');
      setLocalCardMsg('✓ Card payment verified! Redirecting…');
      if (typeof handleReturn === 'function') handleReturn();
    } catch (err) {
      setLocalCardMsg(err.message);
    } finally {
      setLocalCardBusy(false);
    }
  };

  const handleCodSubmit = async (e) => {
    if (typeof submitCodOrder === 'function') {
      return submitCodOrder(e);
    }
    if (e) e.preventDefault();
    if (!activeCodName.trim() || !activeCodPhone.trim() || !activeCodAddress.trim() || !activeCodPincode.trim()) {
      if (setCodMsg) setCodMsg('Please fill in Name, Phone, Address, and Pincode.');
      else setLocalCodMsg('Please fill in Name, Phone, Address, and Pincode.');
      return;
    }
    setLocalCodBusy(true);
    setLocalCodMsg('');
    try {
      const res = await fetch('/api/orders/confirm-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: safeActiveId,
          customer_name: activeCodName.trim(),
          customer_phone: activeCodPhone.trim(),
          delivery_address: activeCodAddress.trim(),
          pincode: activeCodPincode.trim(),
          city: activeCodCity.trim() || 'N/A'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm COD');
      setLocalCodMsg('✓ Cash on Delivery order confirmed! Redirecting…');
      if (typeof handleReturn === 'function') handleReturn();
    } catch (err) {
      setLocalCodMsg(err.message);
    } finally {
      setLocalCodBusy(false);
    }
  };

  // Auto-redirect immediately when payment is confirmed (bypass Screen 1 delay)
  React.useEffect(() => {
    if (curView !== 'vOk') return;
    if (typeof handleReturn === 'function') {
      handleReturn();
    }
  }, [curView, handleReturn]);

  // Safeguarded values
  const safeBizName = (bizName && bizName !== 'Demo Store') ? bizName : 'Merchant';
  const safeActiveId = activeId ? String(activeId) : (paramRef ? String(paramRef) : 'APX-98214');
  const safeUpiId = (!upiId || upiId === 'pending@upi' || !upiId.includes('@')) 
    ? '9410181307@okbizaxis' 
    : upiId;
  const orderRefDisplay = safeActiveId.startsWith('#')
    ? safeActiveId.replace('#', '')
    : safeActiveId;

  const sessionDisplay = safeActiveId;

  const numAmt = typeof displayAmt === 'number' && !isNaN(displayAmt)
    ? displayAmt
    : (parseFloat(displayAmt) || 1.0);

  const formattedAmount = numAmt.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const safeMm = mm != null ? String(mm).padStart(2, '0') : '07';
  const safeSs = ss != null ? String(ss).padStart(2, '0') : '35';

  // Bank transfer details
  const displayBankAcc = bankAcc || `MYMOB${orderRefDisplay}`;
  const displayBankIfsc = bankIfsc || 'YESB0CMSNOC';
  const displayBankName = bankName || safeBizName;

  // Crypto rates and addresses
  const cryptoRates = {
    USDT: {
      amount: `~ ${(numAmt / 87).toFixed(2)} USDT`,
      network: 'TRC20',
      address: cryptoWallet || 'TYsP8a3k8sLmQzK9vN2D6m4E9qB1wX2yZ7',
    },
    BTC: {
      amount: `~ ${(numAmt / 8000000).toFixed(6)} BTC`,
      network: 'Bitcoin network',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    ETH: {
      amount: `~ ${(numAmt / 280000).toFixed(4)} ETH`,
      network: 'Ethereum mainnet',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
    }
  };

  const announce = (msg) => {
    setLiveAnnouncement(msg);
    setTimeout(() => setLiveAnnouncement(''), 3000);
  };

  const handleCopyText = (text, fieldName) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        announce(`${fieldName} copied to clipboard.`);
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(() => {
        announce('Could not copy automatically.');
      });
    }
  };

  const handleAppClick = (appName, appId) => {
    announce(`Opening ${appName} to complete payment.`);
    if (typeof buildUpiLink === 'function') {
      const link = buildUpiLink(appId, numAmt, safeActiveId, merchant, false);
      if (typeof window !== 'undefined') {
        window.location.href = link;
      }
    }
  };

  /* ─────────────────────────────────────────────────────────────
     1. Success View (curView === 'vOk') - Animated Green Tick & Receipt
  ───────────────────────────────────────────────────────────── */
  if (curView === 'vOk') {
    return (
      <div className="w-full max-w-[620px] mx-auto my-8 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 text-center animate-fade-in font-sans">
        
        {/* Floating Trust Pill */}
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 rounded-full px-4 py-1.5 mb-5 border border-emerald-200 text-xs font-semibold">
          <IconVerifiedUser className="w-4 h-4 text-emerald-600" />
          <span>Payment Verified • <strong>mymob.tech</strong></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Success</span>
        </div>

        {/* Animated Green Tick Icon */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute w-28 h-28 rounded-full bg-emerald-100 animate-ping opacity-75"></div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white">
            <svg className="w-12 h-12 text-white stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        {/* Headline & Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
          Payment Successful!
        </h2>
        <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mt-2 leading-relaxed">
          ₹{formattedAmount} successfully paid to <strong>{safeBizName}</strong>. Your transaction has been verified by the bank.
        </p>

        {/* Green Verified Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
          <IconCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Instant Bank Settlement Confirmed</span>
        </div>

        {/* Receipt Details Card */}
        <div className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-5 mt-6 text-left space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-emerald-600">₹{formattedAmount}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                ✓ Paid
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Reference</span>
            <span className="font-mono text-xs font-bold text-slate-900">{orderRefDisplay}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant Name</span>
            <span className="text-xs font-bold text-slate-800">{safeBizName}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</span>
            <span className="text-xs font-bold text-slate-800 uppercase">
              {activeOpt === 'bank' ? 'Bank Transfer (IMPS/NEFT)' : activeOpt === 'crypto' ? 'Crypto Settlement' : activeOpt === 'card' ? 'Credit / Debit Card' : activeOpt === 'cod' ? 'Cash on Delivery (COD)' : 'UPI Instant Settlement'}
            </span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settlement Time</span>
            <span className="text-xs font-bold text-slate-800">{okTime || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Verified & Complete
            </span>
          </div>
        </div>

        {/* Countdown Progress Bar */}
        <div className="w-full mt-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Redirecting back in {successCountdown}s...</span>
            <span className="font-bold text-emerald-600">{Math.round(((5 - successCountdown) / 5) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${Math.min(100, Math.max(10, ((6 - successCountdown) / 5) * 100))}%` }}
            />
          </div>
        </div>

        {/* Action CTA Button */}
        <button
          type="button"
          onClick={handleReturn}
          className="focus-ring w-full mt-5 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
        >
          <span>Return to {safeBizName}</span>
          <IconArrowForward className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. Expired View (curView === 'vExp')
  ───────────────────────────────────────────────────────────── */
  if (curView === 'vExp') {
    return (
      <div className="w-full max-w-[500px] mx-auto my-12 bg-white rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-center animate-fade-in font-sans">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 text-amber-600">
          <IconSchedule className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Session Expired</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6 leading-relaxed">
          This payment session has timed out. Please start again to generate a fresh QR code and session.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              try {
                for (let i = sessionStorage.length - 1; i >= 0; i--) {
                  const k = sessionStorage.key(i);
                  if (k && k.startsWith('mmp_timer_')) {
                    sessionStorage.removeItem(k);
                  }
                }
              } catch {}
              if (setCurView) setCurView('vPay');
              window.location.reload();
            }
          }}
          className="focus-ring w-full py-3 bg-[#000d21] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <IconSchedule className="w-5 h-5" />
          <span>Start Again</span>
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     3. Active Checkout View: Exact 1:1 Match to MyMobPay Checkout.html
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Scoped CSS design tokens from MyMobPay Checkout.html */}
      <style jsx global>{`
        :root {
          --c-surface: #faf8ff;
          --c-surface-dim: #d2d9f4;
          --c-surface-container-lowest: #ffffff;
          --c-surface-container-low: #f2f3ff;
          --c-surface-container: #eaedff;
          --c-surface-container-high: #e2e7ff;
          --c-surface-container-highest: #dae2fd;
          --c-on-surface: #131b2e;
          --c-on-surface-variant: #44474d;
          --c-outline: #74777e;
          --c-outline-variant: #c4c6ce;
          --c-primary: #000d21;
          --c-primary-container: #0c2340;
          --c-on-primary: #ffffff;
          --c-primary-fixed: #d5e3ff;
          --c-primary-fixed-dim: #b3c7ec;
          --c-secondary: #0045de;
          --c-on-secondary: #ffffff;
          --c-secondary-container: #2c60ff;
          --c-secondary-hover: #0038b7;
          --c-tertiary-fixed: #6ffbbe;
          --c-on-tertiary-container: #009d6d;
          --c-on-tertiary-fixed-variant: #005236;
          --c-error: #ba1a1a;
          --c-on-error: #ffffff;
        }

        .focus-ring:focus-visible {
          outline: 2px solid var(--c-secondary);
          outline-offset: 2px;
          border-radius: 8px;
        }

        .bg-surface-container-lowest { background-color: var(--c-surface-container-lowest) !important; }
        .bg-surface-container-low { background-color: var(--c-surface-container-low) !important; }
        .bg-surface-container { background-color: var(--c-surface-container) !important; }
        .bg-surface-container-high { background-color: var(--c-surface-container-high) !important; }
        .bg-surface-container-highest { background-color: var(--c-surface-container-highest) !important; }
        .bg-primary-container { background-color: var(--c-primary-container) !important; }
        .bg-secondary-container { background-color: var(--c-secondary-container) !important; }
        .bg-tertiary-fixed { background-color: var(--c-tertiary-fixed) !important; }
        .bg-primary { background-color: var(--c-primary) !important; }

        .text-on-surface { color: var(--c-on-surface) !important; }
        .text-on-surface-variant { color: var(--c-on-surface-variant) !important; }
        .text-on-primary { color: var(--c-on-primary) !important; }
        .text-primary-fixed { color: var(--c-primary-fixed) !important; }
        .text-primary-fixed-dim { color: var(--c-primary-fixed-dim) !important; }
        .text-secondary { color: var(--c-secondary) !important; }
        .text-on-secondary { color: var(--c-on-secondary) !important; }
        .text-on-tertiary-container { color: var(--c-on-tertiary-container) !important; }
        .text-on-tertiary-fixed-variant { color: var(--c-on-tertiary-fixed-variant) !important; }
        .border-surface-container { border-color: var(--c-surface-container) !important; }

        .text-title-md { font-size: 16px !important; line-height: 24px !important; font-weight: 600 !important; }
        .text-body-md { font-size: 14px !important; line-height: 20px !important; font-weight: 400 !important; }
        .text-body-sm { font-size: 12px !important; line-height: 16px !important; font-weight: 400 !important; }
        .text-headline-sm { font-size: 18px !important; line-height: 26px !important; letter-spacing: -0.005em !important; font-weight: 600 !important; }
        .text-label-sm { font-size: 10px !important; line-height: 14px !important; letter-spacing: 0.02em !important; font-weight: 600 !important; }
        .text-label-md { font-size: 12px !important; line-height: 16px !important; letter-spacing: 0.01em !important; font-weight: 500 !important; }
        .text-label-lg { font-size: 14px !important; line-height: 20px !important; letter-spacing: 0.005em !important; font-weight: 500 !important; }
        .text-currency-display { font-size: 32px !important; line-height: 40px !important; letter-spacing: -0.02em !important; font-weight: 700 !important; }
      `}</style>

      {/* Screen Reader live region */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <main className="w-full flex-1 flex flex-col items-center p-4 sm:p-6 font-sans text-on-surface antialiased">
        <div className="flex flex-col w-full items-center py-6 px-3 sm:px-6">
          <div className="relative w-full max-w-[820px] flex flex-col items-center">

            {/* Test Mode Sandbox Banner */}
            {orderMode === 'test' && (
              <div className="w-full mb-3 bg-amber-50 border border-amber-300 rounded-xl p-2.5 px-4 text-xs font-bold text-amber-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Test mode &mdash; simulated sandbox transaction</span>
              </div>
            )}

            {/* 1. Floating Brand Logo & Encrypted Trust Pill on Top */}
            <div className="flex items-center justify-between w-full mb-4 px-1">
              <MyMobPayLogo className="h-7 w-auto" textColor="#0c2340" />
              <div className="flex items-center gap-2 bg-surface-container-lowest shadow-sm rounded-full px-3.5 py-1.5 border border-outline-variant/30">
                <IconVerifiedUser className="w-[18px] h-[18px] text-secondary flex-shrink-0" />
                <span className="text-label-md text-on-surface">
                  Encrypted checkout
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-label-sm text-emerald-700 font-semibold">Live</span>
              </div>
            </div>

            {/* 2. Main Hosted Modal Card */}
            <div className="w-full bg-surface-container-lowest shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-outline-variant/30">

              {/* Card Header (Navy Blue Dark) */}
              <div className="bg-primary-container text-on-primary p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shadow-md flex-shrink-0 text-on-primary">
                    <IconStorefront className="w-6 h-6 text-white flex-shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-headline-sm text-on-primary font-semibold">{safeBizName}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant gap-1 font-semibold">
                        <IconCheckCircle className="w-[13px] h-[13px] text-on-tertiary-fixed-variant flex-shrink-0" />
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-fixed-dim text-body-sm mt-0.5">
                      <span>Order {orderRefDisplay.startsWith('MMP_') ? orderRefDisplay : `#${orderRefDisplay}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t border-white/10 sm:border-0 pt-3 sm:pt-0 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      id="langToggle"
                      type="button"
                      onClick={() => setLang(l => (l === 'en' ? 'hi' : 'en'))}
                      className="focus-ring bg-white/10 hover:bg-white/20 text-primary-fixed rounded-lg px-2.5 py-1 text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <IconTranslate className="w-[14px] h-[14px] flex-shrink-0" />
                      <span id="currentLangLabel">
                        {lang === 'en' ? 'English / हिन्दी' : 'हिन्दी / English'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReturn}
                      className="focus-ring text-primary-fixed-dim hover:text-on-primary p-1 rounded transition-colors cursor-pointer"
                      title="Cancel and return"
                      aria-label="Cancel and return to store"
                    >
                      <IconClose className="w-5 h-5 flex-shrink-0" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-label-md text-primary-fixed-dim">
                      {lang === 'hi' ? 'देय राशि:' : 'Amount due:'}
                    </span>
                    <span className="text-currency-display text-on-primary tracking-tight font-bold">
                      ₹{formattedAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body (2 Columns: Left 5 cols, Right 7 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
                
                {/* ── LEFT COLUMN: Payment Methods ── */}
                <aside className="md:col-span-5 bg-surface-container-low p-3 sm:p-4 flex flex-col justify-between border-r border-surface-container">
                  <div className="space-y-1.5" role="tablist" aria-label="Payment method">
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider px-3 py-1 font-semibold">
                      {lang === 'hi' ? 'भुगतान विधियां' : 'Payment methods'}
                    </p>

                    {/* Method 1: UPI / QR code */}
                    <button
                      className={`payment-tab w-full text-left p-3 rounded-xl flex items-center justify-between gap-2 focus-ring cursor-pointer transition-all ${
                        activeOpt === 'upi'
                          ? 'bg-surface-container-lowest shadow-sm'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      id="tab-upi"
                      role="tab"
                      aria-selected={activeOpt === 'upi'}
                      aria-controls="pane-upi"
                      onClick={() => setActiveOpt('upi')}
                      type="button"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary flex-shrink-0">
                          <IconQrCodeScanner className="w-5 h-5 text-secondary flex-shrink-0" />
                        </span>
                        <span className="flex flex-col text-left min-w-0 flex-1">
                          <span className="text-title-md text-on-surface text-[14px] truncate block font-semibold">
                            UPI / QR code
                          </span>
                          <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-body-sm text-on-surface-variant text-[11px]">
                              GPay, PhonePe, Paytm
                            </span>
                            <span className="text-label-sm px-1.5 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-[10px] flex items-center gap-0.5 flex-shrink-0">
                              <IconBolt className="w-[10px] h-[10px] text-on-tertiary-fixed-variant flex-shrink-0" />
                              Fastest
                            </span>
                          </span>
                        </span>
                      </span>
                      <IconChevronRight
                        className={`w-4 h-4 flex-shrink-0 ${
                          activeOpt === 'upi' ? 'text-secondary' : 'text-outline-variant'
                        }`}
                      />
                    </button>

                    {/* Method 2: Direct bank transfer */}
                    <button
                      className={`payment-tab w-full text-left p-3 rounded-xl flex items-center justify-between gap-2 focus-ring cursor-pointer transition-all ${
                        activeOpt === 'bank'
                          ? 'bg-surface-container-lowest shadow-sm'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      id="tab-bank"
                      role="tab"
                      aria-selected={activeOpt === 'bank'}
                      aria-controls="pane-bank"
                      onClick={() => setActiveOpt('bank')}
                      type="button"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <IconAccountBalance className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                        </span>
                        <span className="flex flex-col text-left min-w-0 flex-1">
                          <span className="text-title-md text-on-surface text-[14px] truncate block font-semibold">
                            {lang === 'hi' ? 'सीधा बैंक ट्रांसफर' : 'Direct bank transfer'}
                          </span>
                          <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-body-sm text-on-surface-variant text-[11px]">
                              IMPS / NEFT / RTGS
                            </span>
                            <span className="text-label-sm px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary font-bold text-[10px] flex-shrink-0">
                              0% Fee
                            </span>
                          </span>
                        </span>
                      </span>
                      <IconChevronRight
                        className={`w-4 h-4 flex-shrink-0 ${
                          activeOpt === 'bank' ? 'text-secondary' : 'text-outline-variant'
                        }`}
                      />
                    </button>

                    {/* Method 3: Crypto currency */}
                    <button
                      className={`payment-tab w-full text-left p-3 rounded-xl flex items-center justify-between gap-2 focus-ring cursor-pointer transition-all ${
                        activeOpt === 'crypto'
                          ? 'bg-surface-container-lowest shadow-sm'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      id="tab-crypto"
                      role="tab"
                      aria-selected={activeOpt === 'crypto'}
                      aria-controls="pane-crypto"
                      onClick={() => setActiveOpt('crypto')}
                      type="button"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <IconBitcoin className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                        </span>
                        <span className="flex flex-col text-left min-w-0 flex-1">
                          <span className="text-title-md text-on-surface text-[14px] truncate block font-semibold">
                            {lang === 'hi' ? 'क्रिप्टो करेंसी' : 'Crypto currency'}
                          </span>
                          <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span className="text-body-sm text-on-surface-variant text-[11px]">
                              USDT, BTC, ETH
                            </span>
                            <span className="text-label-sm px-1.5 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-[10px] flex-shrink-0">
                              <IconLink className="w-[10px] h-[10px] text-on-tertiary-fixed-variant flex-shrink-0" />
                              Web3
                            </span>
                          </span>
                        </span>
                      </span>
                      <IconChevronRight
                        className={`w-4 h-4 flex-shrink-0 ${
                          activeOpt === 'crypto' ? 'text-secondary' : 'text-outline-variant'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Buyer Protection Footnote */}
                  <div className="mt-6 p-3 rounded-xl bg-surface-container-high/40 text-on-surface-variant text-center sm:text-left">
                    <div className="flex items-center gap-2 text-on-surface justify-center sm:justify-start">
                      <IconSecurity className="w-4 h-4 text-secondary flex-shrink-0" />
                      <span className="text-label-md font-semibold">MyMobPay Buyer Protection</span>
                    </div>
                    <p className="text-body-sm text-[11px] text-on-surface-variant mt-1 leading-normal">
                      100% money-back guarantee if your order isn&apos;t delivered or the item is counterfeit.
                    </p>
                  </div>
                </aside>

                {/* ── RIGHT COLUMN: Selected Method Detail Pane & Order Summary ── */}
                <section className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-surface-container-lowest overflow-y-auto">

                  {/* Top Bar: Change payment method button */}
                  {activeOpt && (
                    <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-surface-container">
                      <button
                        type="button"
                        onClick={() => setActiveOpt(null)}
                        className="focus-ring text-secondary hover:text-[#0038b7] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 -ml-2 rounded-lg hover:bg-surface-container-high/60"
                        id="changePaymentMethodDesktopBtn"
                      >
                        <IconArrowBack className="w-4 h-4 text-secondary" />
                        <span>← Change payment method</span>
                      </button>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Paying ₹{formattedAmount}
                      </span>
                    </div>
                  )}

                  {/* ── Order Full Details View (When no method is selected) ── */}
                  {!activeOpt && (
                    <div className="flex-1 flex flex-col justify-between py-1 animate-fade-in" id="pane-order-full-details">
                      
                      <div className="space-y-4">
                        {/* Order Header / Status Bar */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-surface-container">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                              {lang === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {lang === 'hi' ? 'भुगतान प्रतीक्षित' : 'Awaiting payment selection'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10.5px] font-medium text-on-surface-variant block">
                              {lang === 'hi' ? 'सत्र समाप्ति' : 'Session expires in'}
                            </span>
                            <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 inline-flex items-center gap-1 mt-0.5">
                              <IconSchedule className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              {safeMm}:{safeSs}
                            </span>
                          </div>
                        </div>

                        {/* Executive Order Receipt Card */}
                        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-2xs overflow-hidden">
                          
                          {/* Receipt Top: Merchant & Total */}
                          <div className="p-4 sm:p-5 bg-gradient-to-br from-surface-container-low/50 to-surface-container-lowest border-b border-surface-container flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                                {safeBizName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-on-surface text-[15px] truncate block">{safeBizName}</span>
                                  <IconCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                </div>
                                <span className="text-body-sm text-[11.5px] text-on-surface-variant truncate block">
                                  {orderMode === 'test' ? 'Sandbox Order' : 'Verified Merchant Settlement'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-[10.5px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                                {lang === 'hi' ? 'कुल देय' : 'Total Payable'}
                              </span>
                              <span className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight block">
                                ₹{formattedAmount}
                              </span>
                            </div>
                          </div>

                          {/* Itemized Specification Rows */}
                          <div className="p-4 sm:p-5 space-y-3 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                              <span className="text-on-surface-variant font-medium">
                                {lang === 'hi' ? 'ऑर्डर संदर्भ' : 'Order Reference'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <code className="font-mono font-bold text-on-surface bg-surface-container-low px-2 py-0.5 rounded text-[11.5px] select-all">
                                  {orderRefDisplay}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(orderRefDisplay, 'orderId')}
                                  className="focus-ring p-1 rounded hover:bg-surface-container text-secondary transition-colors cursor-pointer"
                                  title="Copy Order Reference"
                                  aria-label="Copy Order Reference"
                                >
                                  {copiedField === 'orderId' ? (
                                    <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <IconCopy className="w-3.5 h-3.5 text-on-surface-variant" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                              <span className="text-on-surface-variant font-medium">
                                {lang === 'hi' ? 'दिनांक एवं समय' : 'Order Date'}
                              </span>
                              <span className="font-medium text-on-surface">
                                {orderDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                              <span className="text-on-surface-variant font-medium">
                                {lang === 'hi' ? 'सुविधा शुल्क' : 'Convenience Fee'}
                              </span>
                              <span className="font-semibold text-emerald-600">
                                ₹0.00 (0% MDR Waived)
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                              <span className="text-on-surface-variant font-medium">
                                {lang === 'hi' ? 'लागू कर' : 'Applicable GST'}
                              </span>
                              <span className="font-medium text-on-surface">₹0.00</span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-on-surface-variant font-medium">
                                {lang === 'hi' ? 'सुरक्षा गारंटी' : 'Settlement Guarantee'}
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-secondary text-[11.5px]">
                                <IconSecurity className="w-3.5 h-3.5" />
                                Direct Bank Real-Time Settled
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════
                      PANE 1: UPI / QR CODE
                  ═══════════════════════════════════════════════════ */}
                  {activeOpt === 'upi' && (
                    <div className="pane-content space-y-6 flex-1" id="pane-upi" role="tabpanel" aria-labelledby="tab-upi">
                      
                      {/* Top UPI App Intents */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h3 className="text-title-md text-on-surface flex items-center gap-1.5 text-[15px] font-semibold">
                            {lang === 'hi' ? 'अपने UPI ऐप से तुरंत भुगतान करें' : 'Pay instantly with your UPI app'}
                          </h3>
                          <span className="text-label-sm text-on-surface-variant font-medium">Tap to open</span>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                          {/* Google Pay */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('Google Pay', 'gpay')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with Google Pay"
                          >
                            <span className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-1.5 p-2">
                              <svg className="w-full h-full" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                              </svg>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">GPay</span>
                          </button>

                          {/* PhonePe */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('PhonePe', 'phonepe')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with PhonePe"
                          >
                            <span className="w-10 h-10 rounded-full bg-[#5f259f] shadow-sm flex items-center justify-center mb-1.5 p-2 text-white font-bold text-sm leading-none">
                              पे
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">PhonePe</span>
                          </button>

                          {/* Paytm */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('Paytm', 'paytm')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with Paytm"
                          >
                            <span className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-1.5 p-1.5 border border-outline-variant/30">
                              <span className="flex flex-col items-center justify-center leading-none">
                                <span className="text-[10px] font-bold text-[#002e6e]">Pay</span>
                                <span className="text-[9px] font-bold text-[#00b9f5]">tm</span>
                              </span>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">Paytm</span>
                          </button>

                          {/* CRED */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('CRED', 'cred')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with CRED"
                          >
                            <span className="w-10 h-10 rounded-full bg-[#000d21] text-white shadow-sm flex items-center justify-center mb-1.5 p-2">
                              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
                              </svg>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">CRED</span>
                          </button>

                          {/* BHIM UPI */}
                          <button
                            type="button"
                            onClick={() => handleAppClick('BHIM UPI', 'bhim')}
                            className="focus-ring flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container text-center hover:border-secondary transition-colors cursor-pointer"
                            aria-label="Pay with BHIM UPI"
                          >
                            <span className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-1.5 p-2 border border-outline-variant/30">
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M4 3h10l6 9-6 9H4l6-9-6-9z" fill="#00a859"/>
                                <path d="M9 7h5l3.5 5-3.5 5H9l3.5-5L9 7z" fill="#ffffff"/>
                              </svg>
                            </span>
                            <span className="text-label-sm text-on-surface font-medium truncate w-full">BHIM</span>
                          </button>
                        </div>
                      </div>

                      {/* Themed Dynamic QR Code Box */}
                      <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                        
                        {/* Themed QR Viewfinder Frame */}
                        <div className="relative w-36 h-36 bg-white rounded-2xl p-2.5 shadow-md flex items-center justify-center flex-shrink-0 border border-slate-200">
                          {/* 4 Themed Scanner Viewfinder Corners in vibrant Orange */}
                          <span className="absolute -top-1 -left-1 w-4 h-4 border-t-[3px] border-l-[3px] border-[#ff7800] rounded-tl-sm pointer-events-none" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 border-t-[3px] border-r-[3px] border-[#ff7800] rounded-tr-sm pointer-events-none" />
                          <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-[3px] border-l-[3px] border-[#ff7800] rounded-bl-sm pointer-events-none" />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-[3px] border-r-[3px] border-[#ff7800] rounded-br-sm pointer-events-none" />

                          {upiQrValue ? (
                            <QRCode
                              value={upiQrValue}
                              size={124}
                              level="Q"
                              fgColor="#0c2340"
                              bgColor="#ffffff"
                              style={{ height: "auto", maxWidth: "100%", width: "100%", display: "block" }}
                              viewBox="0 0 124 124"
                            />
                          ) : (
                            <div className="text-xs text-slate-400 font-medium">Generating QR…</div>
                          )}

                          {/* Centered Branded Badge with Blue/Orange M Logo */}
                          <div className="absolute inset-0 m-auto w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100 p-1 pointer-events-none">
                            <MyMobPayMark className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                          {/* TOTAL amount banner matching reference layout */}
                          <div className="text-[12px] font-black tracking-wider uppercase text-slate-700 font-mono mb-1.5 flex items-center justify-center sm:justify-start gap-1.5">
                            <span className="text-slate-400 font-bold">TOTAL :</span>
                            <span className="text-slate-900 font-extrabold text-sm font-sans">₹{formattedAmount}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                            <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 text-[#0045de] px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
                              <IconSchedule className="w-3.5 h-3.5 text-[#0045de] flex-shrink-0" />
                              <span className="font-mono font-bold" id="qrTimer">
                                Expires in {safeMm}:{safeSs}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active UPI Gateway
                            </span>
                          </div>

                          <h4 className="text-slate-900 font-bold text-[15px] leading-snug">
                            Scan with any UPI app to pay ₹{formattedAmount}
                          </h4>
                          <p className="text-slate-500 text-[12px] mt-1 leading-relaxed">
                            Point camera from <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or <strong>CRED</strong> at the themed QR code.
                          </p>
                        </div>
                      </div>

                      {/* Payment Verification Advisory Notice (Desktop/PC) */}
                      <div className="flex items-center gap-3 p-3 px-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs shadow-2xs">
                        <div className="relative flex items-center justify-center flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100/90 border border-amber-300/60 text-amber-800">
                          <IconSchedule className="w-4 h-4 text-amber-800 flex-shrink-0" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-600" />
                        </div>
                        <div className="flex-1 leading-snug">
                          <span className="font-bold text-amber-950 block sm:inline">
                            {lang === 'hi' 
                              ? 'भुगतान सत्यापन में 60 सेकंड तक का समय लग सकता है।' 
                              : 'Payment verification may take up to 60 seconds.'}
                          </span>{' '}
                          <span className="text-amber-900/90 font-medium">
                            {lang === 'hi'
                              ? 'कृपया प्रतीक्षा करें और इस स्क्रीन को बंद या रीफ़्रेश न करें।'
                              : 'Please wait and do not close or refresh this screen.'}
                          </span>
                        </div>
                      </div>

                      {/* Pay directly to merchant VPA */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-title-md text-on-surface text-[14px] font-semibold flex items-center gap-1.5">
                            Pay directly to merchant VPA
                            <IconVerified className="w-4 h-4 text-secondary flex-shrink-0" />
                          </span>
                          <span className="text-label-sm text-on-tertiary-container font-semibold px-2 py-0.5 rounded-full bg-surface-container-high/60">
                            Instant verification
                          </span>
                        </div>
                        
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-semibold">
                              Merchant UPI ID / VPA
                            </span>
                            <span
                              className="font-mono font-bold text-on-surface text-base tracking-wide select-all"
                              id="merchantVpaText"
                            >
                              {safeUpiId}
                            </span>
                          </div>
                          
                          <button
                            className="focus-ring h-10 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/30 text-secondary text-label-md font-semibold flex items-center justify-center shadow-sm transition-all flex-shrink-0 gap-1.5 active:scale-95 cursor-pointer"
                            onClick={() => {
                              handleCopyUpi();
                              handleCopyText(safeUpiId, 'upi');
                            }}
                            type="button"
                          >
                            {copiedField === 'upi' || copyFeedback ? (
                              <IconCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <IconCopy className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="copy-label">
                              {copiedField === 'upi' || copyFeedback ? 'Copied!' : 'Copy UPI ID'}
                            </span>
                          </button>
                        </div>

                        <p className="text-body-sm text-on-surface-variant text-[12px] leading-relaxed flex items-start gap-1.5">
                          <IconInfo className="w-[15px] h-[15px] text-secondary flex-shrink-0" />
                          <span>
                            Copy this UPI ID into any UPI app to pay <strong className="text-on-surface">₹{formattedAmount}</strong>.
                          </span>
                        </p>

                        {/* Check Payment Status Button */}
                        <button
                          className="focus-ring w-full h-11 rounded-xl bg-secondary text-on-secondary text-title-md font-semibold shadow-sm hover:bg-[#0038b7] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99 mt-2"
                          type="button"
                          onClick={handleUpiCheckClick}
                          disabled={isChecking}
                          id="checkPaymentStatusDesktopBtn"
                        >
                          <IconCheck className={`w-4 h-4 flex-shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
                          <span>{isChecking ? 'Checking Payment Status…' : 'Check Payment Status'}</span>
                          {!isChecking && <IconArrowForward className="w-4 h-4 flex-shrink-0" />}
                        </button>

                        {/* UTR & Delayed Verification Assistance (Hidden by default; appears if payment takes >45s or user checks status) */}
                        {(upiDelayed || upiCheckCount >= 1 || showUtr) && (
                          <div className="mt-2 animate-fade-in">
                            {checkMsg && checkMsg.startsWith('✓') ? (
                              <div className="p-2.5 rounded-xl text-xs font-semibold text-center leading-relaxed bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                                {checkMsg}
                              </div>
                            ) : (
                              /* Compact Unified Verification Card */
                              <div className="p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                                    <span>Payment pending confirmation</span>
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-500">
                                    Verify with 12-digit UTR
                                  </span>
                                </div>

                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={16}
                                    placeholder="Enter 12-digit UTR / Ref Number"
                                    value={utr || ''}
                                    onChange={(e) => setUtr && setUtr(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && utr && utr.length >= 8 && !utrBusy) {
                                        submitUtr(e);
                                      }
                                    }}
                                    autoFocus
                                    style={{ backgroundColor: '#ffffff', color: '#0f172a', colorScheme: 'light' }}
                                    className="flex-1 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-colors"
                                    id="utrInputDesktop"
                                  />
                                  <button
                                    type="button"
                                    disabled={!utr || utr.length < 8 || utrBusy}
                                    onClick={submitUtr}
                                    className="h-9 px-3.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-[#0038b7] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                                    id="verifyUtrDesktopBtn"
                                  >
                                    {utrBusy ? '…' : 'Verify UTR'}
                                  </button>
                                </div>

                                {utrMsg && (
                                  <p className={`text-xs font-semibold ${utrMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {utrMsg}
                                  </p>
                                )}

                                <p className="text-[11px] text-slate-500 leading-tight">
                                  Found in your UPI app receipt (GPay, PhonePe, Paytm or BHIM).
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}



                  {/* ═══════════════════════════════════════════════════
                      PANE 3: DIRECT BANK TRANSFER
                  ═══════════════════════════════════════════════════ */}
                  {activeOpt === 'bank' && (
                    <div className="pane-content space-y-4 flex-1 animate-fade-in" id="pane-bank" role="tabpanel" aria-labelledby="tab-bank">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-title-md text-on-surface text-[15px] font-semibold">Direct bank-to-bank transfer</h3>
                          <p className="text-body-sm text-on-surface-variant text-[12px]">Direct settlement into the merchant&apos;s account</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold">Zero fees</span>
                      </div>

                      {/* Payment Verification Advisory Notice (Bank Transfer) */}
                      <div className="flex items-center gap-3 p-3 px-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs shadow-2xs">
                        <div className="relative flex items-center justify-center flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100/90 border border-amber-300/60 text-amber-800">
                          <IconSchedule className="w-4 h-4 text-amber-800 flex-shrink-0" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-600" />
                        </div>
                        <div className="flex-1 leading-snug">
                          <span className="font-bold text-amber-950 block sm:inline">
                            {lang === 'hi' 
                              ? 'भुगतान सत्यापन में 60 सेकंड तक का समय लग सकता है।' 
                              : 'Payment verification may take up to 60 seconds.'}
                          </span>{' '}
                          <span className="text-amber-900/90 font-medium">
                            {lang === 'hi'
                              ? 'कृपया प्रतीक्षा करें और इस स्क्रीन को बंद या रीफ़्रेश न करें।'
                              : 'Please wait and do not close or refresh this screen.'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-container-low space-y-3">
                        <div className="flex items-center justify-between border-b border-surface-container pb-2">
                          <span className="text-label-sm text-on-surface-variant">Beneficiary name</span>
                          <span className="text-body-md font-semibold text-on-surface">{displayBankName}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-surface-container pb-2">
                          <span className="text-label-sm text-on-surface-variant">Virtual account number</span>
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-on-surface text-sm">{displayBankAcc}</span>
                            <button
                              type="button"
                              className="focus-ring text-secondary cursor-pointer p-0.5 rounded"
                              aria-label="Copy virtual account number"
                              onClick={() => handleCopyText(displayBankAcc, 'acc')}
                            >
                              {copiedField === 'acc' ? (
                                <IconCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <IconCopy className="w-4 h-4 flex-shrink-0" />
                              )}
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-surface-container pb-2">
                          <span className="text-label-sm text-on-surface-variant">IFSC code</span>
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-on-surface text-sm">{displayBankIfsc}</span>
                            <button
                              type="button"
                              className="focus-ring text-secondary cursor-pointer p-0.5 rounded"
                              aria-label="Copy IFSC code"
                              onClick={() => handleCopyText(displayBankIfsc, 'ifsc')}
                            >
                              {copiedField === 'ifsc' ? (
                                <IconCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <IconCopy className="w-4 h-4 flex-shrink-0" />
                              )}
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">Transfer mode</span>
                          <span className="text-label-sm text-secondary font-semibold">IMPS / NEFT / RTGS (24x7)</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-surface-container text-on-surface-variant flex items-center gap-2">
                        <IconInfo className="w-5 h-5 text-secondary flex-shrink-0" />
                        <span className="text-body-sm text-[12px]">
                          We verify your transfer automatically once it&apos;s credited — usually within a couple of minutes.
                        </span>
                      </div>

                      <button
                        className="focus-ring w-full h-12 rounded-xl bg-secondary text-on-secondary text-title-md font-semibold shadow-sm hover:bg-[#0038b7] transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                        type="button"
                        onClick={(e) => {
                          setBankTransferClicked(true);
                          if (setShowUtr) setShowUtr(true);
                          if (triggerChecking) triggerChecking(e);
                        }}
                        id="bankMadeTransferDesktopBtn"
                      >
                        <span>{isChecking ? 'Checking status…' : "I've made the transfer"}</span>
                        <IconArrowForward className="w-5 h-5 flex-shrink-0" />
                      </button>

                      {checkMsg && (
                        <p className="text-center text-xs font-semibold text-on-surface-variant mt-1">
                          {checkMsg}
                        </p>
                      )}

                      {/* Bank UTR submission box — appears immediately after clicking "I've made the transfer" */}
                      {(bankTransferClicked || showUtr) && (
                        <div className="p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2 mt-3 animate-fade-in" id="bankCompactVerificationCard">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <IconVerified className="w-4 h-4 text-secondary flex-shrink-0" />
                              <span>Submit 12-Digit Bank UTR / IMPS Ref</span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">Bank receipt</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={16}
                              placeholder="Enter 12-digit UTR / Ref Number"
                              value={utr || ''}
                              onChange={(e) => setUtr && setUtr(e.target.value.replace(/\D/g, '').slice(0, 16))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && utr && utr.length >= 8 && !utrBusy) {
                                  submitUtr(e);
                                }
                              }}
                              autoFocus
                              style={{ backgroundColor: '#ffffff', color: '#0f172a', colorScheme: 'light' }}
                              className="flex-1 h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-colors"
                              id="utrInputBankDesktop"
                            />
                            <button
                              type="button"
                              disabled={!utr || utr.length < 8 || utrBusy}
                              onClick={submitUtr}
                              className="h-9 px-3.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-[#0038b7] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                              id="verifyUtrBankDesktopBtn"
                            >
                              {utrBusy ? '…' : 'Submit UTR'}
                            </button>
                          </div>
                          {utrMsg && (
                            <p className={`text-xs font-semibold ${utrMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {utrMsg}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 leading-tight">
                            Enter the 12-digit transaction reference number (UTR / IMPS Ref) provided by your bank receipt.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════
                      PANE 3: CRYPTO CURRENCY
                  ═══════════════════════════════════════════════════ */}
                  {activeOpt === 'crypto' && (
                    <div className="pane-content space-y-4 flex-1 animate-fade-in" id="pane-crypto" role="tabpanel" aria-labelledby="tab-crypto">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-title-md text-on-surface text-[15px] font-semibold">Crypto settlement</h3>
                          <p className="text-body-sm text-on-surface-variant text-[12px]">USDT, BTC, ETH — on-chain gateway</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-label-sm bg-surface-container-highest text-secondary font-bold">Web3 ready</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a cryptocurrency">
                        <button
                          type="button"
                          onClick={() => setSelectedCrypto('USDT')}
                          className={`crypto-choice focus-ring p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            selectedCrypto === 'USDT'
                              ? 'bg-surface-container-lowest border-2 border-secondary shadow-sm'
                              : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                          }`}
                          role="radio"
                          aria-checked={selectedCrypto === 'USDT'}
                        >
                          <span className="font-bold text-on-tertiary-container text-sm">USDT</span>
                          <span className="text-label-sm text-on-surface-variant mt-0.5 text-[11px]">TRC20 / ERC20</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedCrypto('BTC')}
                          className={`crypto-choice focus-ring p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            selectedCrypto === 'BTC'
                              ? 'bg-surface-container-lowest border-2 border-secondary shadow-sm'
                              : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                          }`}
                          role="radio"
                          aria-checked={selectedCrypto === 'BTC'}
                        >
                          <span className="font-bold text-[#f7931a] text-sm">BTC</span>
                          <span className="text-label-sm text-on-surface-variant mt-0.5 text-[11px]">Bitcoin network</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedCrypto('ETH')}
                          className={`crypto-choice focus-ring p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            selectedCrypto === 'ETH'
                              ? 'bg-surface-container-lowest border-2 border-secondary shadow-sm'
                              : 'bg-surface-container border-2 border-transparent hover:bg-surface-container-high'
                          }`}
                          role="radio"
                          aria-checked={selectedCrypto === 'ETH'}
                        >
                          <span className="font-bold text-[#627eea] text-sm">ETH</span>
                          <span className="text-label-sm text-on-surface-variant mt-0.5 text-[11px]">Ethereum mainnet</span>
                        </button>
                      </div>

                      {/* Payment Verification Advisory Notice (Crypto) */}
                      <div className="flex items-center gap-3 p-3 px-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs shadow-2xs">
                        <div className="relative flex items-center justify-center flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100/90 border border-amber-300/60 text-amber-800">
                          <IconSchedule className="w-4 h-4 text-amber-800 flex-shrink-0" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-600" />
                        </div>
                        <div className="flex-1 leading-snug">
                          <span className="font-bold text-amber-950 block sm:inline">
                            {lang === 'hi' 
                              ? 'भुगतान सत्यापन में 60 सेकंड तक का समय लग सकता है।' 
                              : 'Payment verification may take up to 60 seconds.'}
                          </span>{' '}
                          <span className="text-amber-900/90 font-medium">
                            {lang === 'hi'
                              ? 'कृपया प्रतीक्षा करें और इस स्क्रीन को बंद या रीफ़्रेश न करें।'
                              : 'Please wait and do not close or refresh this screen.'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">Pay amount</span>
                          <span className="font-mono font-bold text-on-surface text-sm" id="cryptoAmount">
                            {cryptoRates[selectedCrypto].amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">
                            Deposit address (<span id="cryptoNetwork">{cryptoRates[selectedCrypto].network}</span>)
                          </span>
                          <button
                            type="button"
                            className="focus-ring text-secondary cursor-pointer p-0.5 rounded"
                            aria-label="Copy deposit address"
                            onClick={() => handleCopyText(cryptoRates[selectedCrypto].address, 'crypto')}
                          >
                            {copiedField === 'crypto' ? (
                              <IconCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <IconCopy className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest rounded-lg font-mono text-[11px] text-on-surface truncate border border-outline-variant/30 select-all" id="cryptoAddress">
                          {cryptoRates[selectedCrypto].address}
                        </div>
                      </div>

                      <button
                        className="focus-ring w-full h-12 rounded-xl bg-secondary text-on-secondary text-title-md font-semibold shadow-sm hover:bg-[#0038b7] transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                        type="button"
                        onClick={() => announce('Web3 wallet connection will open in supported browser.')}
                      >
                        <IconWallet className="w-5 h-5 flex-shrink-0" />
                        <span>Connect Web3 wallet to pay</span>
                      </button>
                    </div>
                  )}

                  {/* Card Bottom Row (Secure Checkout) */}
                  <div className="pt-5 mt-auto flex items-center justify-between text-on-surface-variant border-t border-surface-container-low">
                    <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                      <IconLock className="w-4 h-4 text-on-tertiary-container flex-shrink-0" />
                      <span>Secure checkout</span>
                    </div>
                  </div>

                </section>
              </div>

              {/* Card Footer Bar */}
              <footer className="bg-surface-container-high/60 py-3 px-6 flex flex-wrap items-center justify-between gap-3 text-on-surface-variant">
                <div className="flex items-center gap-2 text-label-sm">
                  <IconVerified className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>Protected by <strong>mymob.tech</strong> 256-bit encryption</span>
                </div>
                <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                  <span className="font-bold text-on-surface">UPI</span><span>·</span>
                  <span className="font-bold text-on-surface">IMPS / NEFT</span><span>·</span>
                  <span className="font-bold text-on-surface">Web3 USDT</span>
                </div>
              </footer>
            </div>

            {/* Below Card Help & Session Bar */}
            <div className="w-full flex items-center justify-between mt-3 px-2 text-on-surface-variant">
              <button
                className="focus-ring text-label-sm hover:text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
                type="button"
                onClick={() => announce('Need help? Contact support@mymob.tech')}
              >
                <IconHelp className="w-[15px] h-[15px] flex-shrink-0" />
                <span>Need help with payment?</span>
              </button>
              <span className="text-label-sm font-mono text-[12px]">Session ID: {sessionDisplay}</span>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
