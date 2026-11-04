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
        className={`font-extrabold tracking-tight leading-none whitespace-nowrap ${textSize}`}
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

export default MyMobPayLogo;
