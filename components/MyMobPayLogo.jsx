'use client';

import React from 'react';
import Image from 'next/image';

/**
 * MyMobPayMark — Standalone vector dual-color M logo
 * Left stroke: Electric / Azure Blue (#0284C7)
 * Right stroke: Vibrant Warm Orange (#FF7800)
 */
export function MyMobPayMark({ className = 'w-6 h-6', width = 24, height = 24, ...props }) {
  return (
    <Image
      src="/logos/mymobpay_mark.png"
      alt="MyMobPay Mark"
      width={width}
      height={height}
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
}

/**
 * MyMobPayLogo — Full Brand Logo with Blue/Orange M Ribbon Mark + "MyMobPay"
 */
export function MyMobPayLogo({
  className = '',
  textColor = 'var(--text-primary, #0f172a)',
  markSize = 32,
  textSize = 'text-xl sm:text-2xl',
  ...props
}) {
  const resolvedColor = textColor === 'var(--text-primary)' ? '#0d253d' : textColor;
  return (
    <div
      className={`inline-flex items-center gap-2 select-none shrink-0 transition-transform duration-200 ${className}`}
      {...props}
    >
      <Image
        src="/logos/mymobpay_mark.png"
        alt="MyMobPay Mark"
        width={markSize}
        height={markSize}
        className="object-contain shrink-0"
      />
      {/* Wordmark: MyMobPay */}
      <span
        className={`font-semibold tracking-tight leading-none whitespace-nowrap ${textSize}`}
        style={{
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: resolvedColor,
          letterSpacing: '-0.5px',
        }}
      >
        MyMobPay
      </span>
    </div>
  );
}

/**
 * MyMobPayQrBadge — Center logo badge overlay for UPI QR codes
 * Placed in the dead center of the QR code with white backing and soft shadow.
 */
export function MyMobPayQrBadge({ size = 32, markSize = 22, className = '' }) {
  return (
    <div
      className={`absolute inset-0 m-auto rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100/90 pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        padding: '3px',
      }}
    >
      <Image
        src="/logos/mymobpay_mark.png"
        alt="MyMobPay"
        width={markSize}
        height={markSize}
        className="object-contain"
      />
    </div>
  );
}

export function MyMobPayLogoMark({ className = "w-5 h-5", id = "mmp" }) {
  return (
    <svg className={`overflow-visible shrink-0 ${className}`} viewBox="115 225 790 530" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`mmp-g1-${id}`} x1="360" y1="280" x2="510" y2="660" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#004BFF" />
          <stop offset="100%" stopColor="#0033B5" />
        </linearGradient>
        <linearGradient id={`mmp-g2-${id}`} x1="510" y1="630" x2="670" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E64400" />
          <stop offset="50%" stopColor="#FF6D00" />
          <stop offset="100%" stopColor="#FF9614" />
        </linearGradient>
        <linearGradient id={`mmp-g3-${id}`} x1="170" y1="710" x2="420" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0044E5" />
          <stop offset="55%" stopColor="#0088FF" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
        <linearGradient id={`mmp-g4-${id}`} x1="600" y1="280" x2="830" y2="710" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF9E1B" />
          <stop offset="55%" stopColor="#FF7300" />
          <stop offset="100%" stopColor="#F05A00" />
        </linearGradient>
      </defs>
      <path d="M 470 575 L 555 340 C 585 260, 680 260, 710 340 L 625 575 C 595 655, 500 655, 470 575 Z" fill={`url(#mmp-g2-${id})`} />
      <path d="M 310 340 L 395 575 C 425 655, 520 655, 550 575 L 465 340 C 435 260, 340 260, 310 340 Z" fill={`url(#mmp-g1-${id})`} />
      <path d="M 168 645 L 290 340 C 320 260, 425 260, 455 340 L 332 645 C 308 725, 192 725, 168 645 Z" fill={`url(#mmp-g3-${id})`} />
      <path d="M 565 340 C 595 260, 700 260, 730 340 L 852 645 C 828 725, 712 725, 688 645 L 565 340 Z" fill={`url(#mmp-g4-${id})`} />
    </svg>
  );
}

export default MyMobPayLogo;
