'use client';

import React from 'react';

/**
 * MyMobPayMark — Standalone vector dual-color M logo
 * Left stroke: Electric / Azure Blue (#0284C7)
 * Right stroke: Vibrant Warm Orange (#FF7800)
 */
export function MyMobPayMark({ className = 'w-6 h-6', ...props }) {
  return (
    <img
      src="/logos/mymobpay_mark.png"
      alt="MyMobPay Mark"
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
}

/**
 * MyMobPayLogo — Full Brand Logo with Blue/Orange M Ribbon Mark + "MyMobPay"
 */
export function MyMobPayLogo({
  className = 'w-48 h-auto',
  textColor = 'var(--text-primary)',
  ...props
}) {
  return (
    <svg
      viewBox="0 0 220 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 select-none ${className}`}
      {...props}
    >
      <image
        href="/logos/mymobpay_mark.png"
        x="2"
        y="2"
        width="38"
        height="36"
        preserveAspectRatio="xMidYMid meet"
      />
      {/* Wordmark: MyMobPay */}
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
      <img
        src="/logos/mymobpay_mark.png"
        alt="MyMobPay"
        style={{
          width: `${markSize}px`,
          height: `${markSize}px`,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

export default MyMobPayLogo;
