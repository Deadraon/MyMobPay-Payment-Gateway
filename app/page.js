'use client';

import { useEffect, useRef } from 'react';

// Dedicated crisp vector 3D ribbon mark with unique SVG gradient scopes
function MyMobPayLogoMark({ className = "w-5 h-5", id = "mmp" }) {
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
      {/* Segment 2 (Center-Right Orange Upward Arch) */}
      <path d="M 470 575 L 555 340 C 585 260, 680 260, 710 340 L 625 575 C 595 655, 500 655, 470 575 Z" fill={`url(#mmp-g2-${id})`} />
      {/* Segment 1 (Center-Left Blue Downward Fold & U-Valley) */}
      <path d="M 310 340 L 395 575 C 425 655, 520 655, 550 575 L 465 340 C 435 260, 340 260, 310 340 Z" fill={`url(#mmp-g1-${id})`} />
      {/* Segment 3 (Left Outer Cyan-to-Blue Leg with Smooth Rounded Bottom Cap) */}
      <path d="M 168 645 L 290 340 C 320 260, 425 260, 455 340 L 332 645 C 308 725, 192 725, 168 645 Z" fill={`url(#mmp-g3-${id})`} />
      {/* Segment 4 (Right Outer Amber-to-Orange Leg with Smooth Rounded Bottom Cap) */}
      <path d="M 565 340 C 595 260, 700 260, 730 340 L 852 645 C 828 725, 712 725, 688 645 L 565 340 Z" fill={`url(#mmp-g4-${id})`} />
    </svg>
  );
}

const CSS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@700;800;900&family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Force Anton font on headlines, display titles, and typewriter words */
.hero-display-title,
.hero-display-title *,
.headline-anton,
.headline-anton *,
.headline-anton-white,
.headline-anton-white *,
.font-display,
.font-display *,
#hero-typewriter-word {
  font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif !important;
}

/* ONLY typewriter word gets blue color */
#hero-typewriter-word {
  color: #0F2BFF !important;
}

html.dark #hero-typewriter-word {
  color: #60A5FA !important;
}

.typewriter-caret {
  background-color: #0F2BFF !important;
}

html.dark .typewriter-caret {
  background-color: #60A5FA !important;
}

/* Force Barlow Condensed on stats */
.tabular-nums-stat,
.tabular-nums-stat *,
.font-condensed,
.font-condensed * {
  font-family: 'Barlow Condensed', 'Anton', sans-serif !important;
}

/* Force JetBrains Mono on monospace code & tokens */
.font-mono,
.font-mono *,
code,
pre {
  font-family: 'JetBrains Mono', monospace !important;
}

/* Base typography for homepage root: Plus Jakarta Sans with standard inheritance */
.homepage-root,
.homepage-root input,
.homepage-root textarea,
.homepage-root select,
.font-sans,
footer {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

/* Explicit pure white utilities to prevent Tailwind var(--bg-card) opacity syntax bugs */
.bg-white { background-color: #FFFFFF !important; }
.bg-white\/5 { background-color: rgba(255, 255, 255, 0.05) !important; }
.bg-white\/10 { background-color: rgba(255, 255, 255, 0.10) !important; }
.bg-white\/15 { background-color: rgba(255, 255, 255, 0.15) !important; }
.bg-white\/20 { background-color: rgba(255, 255, 255, 0.20) !important; }
.bg-white\/25 { background-color: rgba(255, 255, 255, 0.25) !important; }
.bg-white\/95 { background-color: rgba(255, 255, 255, 0.95) !important; }

.text-white { color: #FFFFFF !important; }
.text-white\/70 { color: rgba(255, 255, 255, 0.70) !important; }
.text-white\/75 { color: rgba(255, 255, 255, 0.75) !important; }
.text-white\/80 { color: rgba(255, 255, 255, 0.80) !important; }
.text-white\/85 { color: rgba(255, 255, 255, 0.85) !important; }
.text-white\/90 { color: rgba(255, 255, 255, 0.90) !important; }

.border-white\/10 { border-color: rgba(255, 255, 255, 0.10) !important; }

.shadow-2xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.backdrop-blur-xs {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* ===================================================================== */
    /* 1. SEMANTIC LIGHT & DARK THEME ENGINE                                 */
    /* ===================================================================== */
    :root {
      --bg-primary: #FFFFFF;
      --bg-secondary: #F2F3FB;
      --bg-elevated: #FFFFFF;
      --bg-well: #F7F8FD;
      --bg-header: rgba(242, 243, 251, 0.90);
      --bg-pill-nav: rgba(255, 255, 255, 0.92);
      --text-primary: #090A10;
      --text-secondary: #222533;
      --text-muted: #5A607A;
      --accent-link: #0F2BFF;
      --border-color: #E2E5F4;
      --card-shadow: 0 10px 30px -10px rgba(20, 24, 80, 0.07);
      --phone-screen-bg: #FFFFFF;
      --phone-hero-screen-bg: #F7F8FD;
      --phone-card-bg: #FFFFFF;
      --phone-card-border: #ECEEF8;
      --phone-Watermark: #E5E8F6;
      --comp-legacy-bg: #FFF5F5;
      --comp-legacy-border: #FECACA;
      --comp-mymob-bg: #F0F4FF;
      --comp-mymob-border: #0F2BFF;
    }

    html.dark {
      --bg-primary: #0B0E14;
      --bg-secondary: #101520;
      --bg-elevated: #161D2B;
      --bg-well: #0E131D;
      --bg-header: rgba(11, 14, 20, 0.90);
      --bg-pill-nav: rgba(22, 29, 43, 0.95);
      --text-primary: #F8FAFC;
      --text-secondary: #CBD5E1;
      --text-muted: #94A3B8;
      --accent-link: #60A5FA;
      --border-color: #232D42;
      --card-shadow: 0 16px 38px -10px rgba(0, 0, 0, 0.55);
      --phone-screen-bg: #0E131F;
      --phone-hero-screen-bg: #0E131F;
      --phone-card-bg: #182132;
      --phone-card-border: #28354E;
      --phone-Watermark: rgba(255, 255, 255, 0.04);
      --comp-legacy-bg: rgba(127, 29, 29, 0.16);
      --comp-legacy-border: rgba(248, 113, 113, 0.35);
      --comp-mymob-bg: rgba(15, 43, 255, 0.14);
      --comp-mymob-border: #3B82F6;
    }

    html, body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-secondary);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
      transition: background-color 0.25s ease, color 0.25s ease;
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

    /* ===================================================================== */
    /* 2. EDITORIAL TYPOGRAPHY & CLASSIC TYPEWRITER                          */
    /* ===================================================================== */
    .headline-anton {
      font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif;
      font-weight: 400;
      text-transform: uppercase;
      line-height: 0.96;
      letter-spacing: 0.01em;
      color: var(--text-primary);
    }

    .headline-anton-white {
      font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif;
      font-weight: 400;
      text-transform: uppercase;
      line-height: 0.96;
      letter-spacing: 0.01em;
      color: #FFFFFF;
    }

    .hero-display-title {
      font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif;
      font-weight: 400;
      text-transform: uppercase;
      line-height: 0.95;
      letter-spacing: 0.01em;
      color: var(--text-primary);
    }

    .tabular-nums-stat {
      font-family: 'Barlow Condensed', 'Anton', sans-serif;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
    }

    @keyframes blinkCaret {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    .typewriter-caret {
      display: inline-block;
      width: 5px;
      height: 0.82em;
      margin-left: 6px;
      border-radius: 2px;
      background-color: var(--accent-link);
      vertical-align: -0.04em;
      animation: blinkCaret 0.9s steps(1) infinite;
    }

    /* ===================================================================== */
    /* 3. STICKY HEADER & NAVIGATION PILL                                    */
    /* ===================================================================== */
    .site-header {
      background-color: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .header-nav-pill {
      background-color: var(--bg-pill-nav);
      border: 1px solid var(--border-color);
    }

    .nav-pill-item {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 9999px;
      white-space: nowrap;
      transition: all 0.18s ease;
    }
    .nav-pill-item:hover {
      color: var(--accent-link);
      background-color: rgba(15, 43, 255, 0.07);
    }
    html.dark .nav-pill-item:hover {
      background-color: rgba(96, 165, 250, 0.12);
    }

    /* ===================================================================== */
    /* 4. SCULPTED 3D CERAMIC (LIGHT) & BRUSHED TITANIUM (DARK) iPHONES      */
    /* ===================================================================== */
    .clay-iphone {
      position: relative;
      width: 316px;
      height: 636px;
      background-color: #F5F6FC;
      border-radius: 50px;
      padding: 14px;
      box-shadow:
        inset 0 2px 4px #FFFFFF,
        inset 0 -3px 6px rgba(160, 168, 200, 0.35),
        inset 0 0 0 1.5px rgba(255, 255, 255, 0.95),
        -24px 28px 54px rgba(20, 24, 80, 0.14),
        0 10px 24px rgba(20, 24, 80, 0.06);
      user-select: none;
      flex-shrink: 0;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, box-shadow 0.3s ease;
    }

    html.dark .clay-iphone {
      background-color: #1C2334;
      box-shadow:
        inset 0 1.5px 3px rgba(255, 255, 255, 0.25),
        inset 0 -3px 6px rgba(0, 0, 0, 0.65),
        inset 0 0 0 1.5px rgba(255, 255, 255, 0.12),
        -24px 28px 56px rgba(0, 0, 0, 0.7),
        0 10px 26px rgba(0, 0, 0, 0.5);
    }

    .clay-iphone-hero {
      position: relative;
      width: 316px;
      height: 610px;
      background-color: #F5F6FC;
      border-radius: 50px;
      padding: 14px;
      box-shadow:
        inset 0 2px 4px #FFFFFF,
        inset 0 -3px 6px rgba(160, 168, 200, 0.35),
        inset 0 0 0 1.5px rgba(255, 255, 255, 0.95),
        -24px 28px 54px rgba(20, 24, 80, 0.16),
        0 12px 28px rgba(20, 24, 80, 0.08);
      user-select: none;
      flex-shrink: 0;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, box-shadow 0.3s ease;
    }

    html.dark .clay-iphone-hero {
      background-color: #1C2334;
      box-shadow:
        inset 0 1.5px 3px rgba(255, 255, 255, 0.25),
        inset 0 -3px 6px rgba(0, 0, 0, 0.65),
        inset 0 0 0 1.5px rgba(255, 255, 255, 0.12),
        -24px 28px 56px rgba(0, 0, 0, 0.72),
        0 12px 28px rgba(0, 0, 0, 0.52);
    }

    /* Mobile Fluid Scaling so 3D iPhones never overflow compact viewports */
    @media (max-width: 639px) {
      .clay-iphone {
        width: min(306px, calc(100vw - 32px));
        height: 612px;
      }
      .clay-iphone-hero {
        width: min(306px, calc(100vw - 32px));
        height: 584px;
      }
      input[type="text"],
      input[type="number"],
      input[type="email"],
      input[type="password"] {
        font-size: 16px !important;
      }
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
    .clay-side-silent { top: 96px; height: 24px; }
    .clay-side-vol-up { top: 136px; height: 44px; }
    .clay-side-vol-down { top: 190px; height: 44px; }

    .clay-side-power {
      position: absolute;
      right: -3px;
      top: 152px;
      width: 3px;
      height: 64px;
      background-color: #DDE1F0;
      border-radius: 0 3px 3px 0;
    }

    html.dark .clay-side-silent,
    html.dark .clay-side-vol-up,
    html.dark .clay-side-vol-down,
    html.dark .clay-side-power {
      background-color: #334155;
    }

    .clay-screen {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: var(--phone-screen-bg);
      border-radius: 38px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .clay-screen-hero {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: var(--phone-hero-screen-bg);
      border-radius: 38px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .clay-notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 132px;
      height: 23px;
      background-color: var(--phone-screen-bg);
      border-radius: 0 0 15px 15px;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .clay-speaker {
      width: 36px;
      height: 4px;
      background: #CBD5E1;
      border-radius: 99px;
    }
    html.dark .clay-speaker { background: #334155; }

    .clay-camera {
      width: 6px;
      height: 6px;
      background: #94A3B8;
      border-radius: 99px;
    }
    html.dark .clay-camera { background: #475569; }

    .phone-bubble-card {
      background-color: var(--phone-card-bg);
      border: 1px solid var(--phone-card-border);
      color: var(--text-primary);
    }

    .ios-home-bar {
      width: 96px;
      height: 4px;
      border-radius: 99px;
      background: currentColor;
      opacity: 0.35;
      margin: 6px auto 8px auto;
    }

    /* ===================================================================== */
    /* 5. ARCHITECTURAL GRID LINES, ORBITAL RINGS & FLOATING ANIMATIONS      */
    /* ===================================================================== */
    .bg-arch-grid {
      background-size: 48px 48px;
      background-image:
        linear-gradient(to right, rgba(15, 43, 255, 0.055) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 43, 255, 0.055) 1px, transparent 1px);
    }
    html.dark .bg-arch-grid {
      background-image:
        linear-gradient(to right, rgba(96, 165, 250, 0.075) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(96, 165, 250, 0.075) 1px, transparent 1px);
    }

    .bg-dot-matrix {
      background-image: radial-gradient(rgba(15, 43, 255, 0.14) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    html.dark .bg-dot-matrix {
      background-image: radial-gradient(rgba(96, 165, 250, 0.16) 1px, transparent 1px);
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
      top: 52%;
      border-radius: 9999px;
      border: 1.5px dashed rgba(15, 43, 255, 0.22);
      animation: spinOrbitSlow 28s linear infinite;
      pointer-events: none;
    }
    .orbit-ring-ccw {
      position: absolute;
      left: 50%;
      top: 52%;
      border-radius: 9999px;
      border: 1px solid rgba(255, 110, 0, 0.22);
      animation: spinOrbitReverse 20s linear infinite;
      pointer-events: none;
    }
    html.dark .orbit-ring-cw {
      border-color: rgba(96, 165, 250, 0.26);
    }
    html.dark .orbit-ring-ccw {
      border-color: rgba(255, 158, 27, 0.26);
    }

    @keyframes floatBadgeSlow {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-8px); }
    }
    .float-badge-1 {
      animation: floatBadgeSlow 4.2s ease-in-out infinite;
    }
    .float-badge-2 {
      animation: floatBadgeSlow 5.1s ease-in-out 1.2s infinite;
    }

    @keyframes clayFloat {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(-9px) rotate(-0.6deg); }
    }
    .clay-float {
      animation: clayFloat 5.6s ease-in-out infinite;
    }

    /* New In-Screen & Chassis Phone Animations */
    @keyframes heroPhoneFloat {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(-8px) rotate(0.5deg); }
    }
    .hero-phone-animate {
      animation: heroPhoneFloat 6s ease-in-out infinite;
    }

    @keyframes cloudDrift {
      0%, 100% { transform: translateX(0px) translateY(0px); }
      50%      { transform: translateX(6px) translateY(-3px); }
    }
    .phone-cloud-left {
      animation: cloudDrift 4.5s ease-in-out infinite;
    }
    .phone-cloud-right {
      animation: cloudDrift 5.2s ease-in-out 1.2s infinite reverse;
    }

    @keyframes mascotBob {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%      { transform: translateY(-4px) scale(1.04); }
    }
    .phone-mascot-animate {
      animation: mascotBob 3.2s ease-in-out infinite;
    }

    @keyframes crownPulse {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50%      { transform: scale(1.1) rotate(5deg); }
    }
    .phone-crown-animate {
      animation: crownPulse 3.6s ease-in-out infinite;
    }

    @keyframes flameWave {
      0%, 100% { transform: scaleY(1) translateY(0px); }
      50%      { transform: scaleY(1.06) translateY(-6px); }
    }
    .phone-flame-back {
      transform-origin: bottom center;
      animation: flameWave 3.8s ease-in-out infinite;
    }
    .phone-flame-front {
      transform-origin: bottom center;
      animation: flameWave 2.7s ease-in-out 0.9s infinite;
    }

    @keyframes statusRingPulse {
      0%   { box-shadow: 0 0 0 0 rgba(70, 21, 255, 0.45); }
      70%  { box-shadow: 0 0 0 7px rgba(70, 21, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(70, 21, 255, 0); }
    }
    .phone-pill-pulse {
      animation: statusRingPulse 2.4s infinite;
    }

    @keyframes cardBreath {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-3px); }
    }
    .phone-card-breath-1 {
      animation: cardBreath 4s ease-in-out infinite;
    }
    .phone-card-breath-2 {
      animation: cardBreath 4.4s ease-in-out 1.5s infinite;
    }

    .clay-iphone,
    .clay-iphone-hero {
      will-change: transform;
      transform-style: preserve-3d;
    }

    @keyframes gridBeamTravel {
      0%   { transform: translateY(-100%); opacity: 0; }
      30%  { opacity: 0.85; }
      70%  { opacity: 0.85; }
      100% { transform: translateY(500%); opacity: 0; }
    }
    .grid-beam-v {
      animation: gridBeamTravel 5.5s linear infinite;
    }

    @keyframes marqueeScroll {
      0%   { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
    .marquee-track {
      display: flex;
      width: max-content;
      animation: marqueeScroll 28s linear infinite;
    }
    .marquee-track:hover {
      animation-play-state: paused;
    }

    @keyframes bubblePop {
      0%   { opacity: 0; transform: translateY(8px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .bubble-enter {
      animation: bubblePop 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Custom Flat Editorial Range Slider (Zero Gradients) */
    input[type="range"].mmp-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background-color: #DCE0F4;
      outline: none;
    }
    html.dark input[type="range"].mmp-slider {
      background-color: #232D42;
    }
    input[type="range"].mmp-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #0F2BFF;
      border: 3px solid #FFFFFF;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(15, 43, 255, 0.35);
    }

    .btn-editorial {
      transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
    }
    .btn-editorial:hover {
      transform: translateY(-1.5px);
      box-shadow: 0 8px 20px -6px rgba(15, 43, 255, 0.42);
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`;

// Static data stores
const walletTransactions = [
  { name: 'UPI QR Collection', rail: 'UPI', amount: '+₹2,499.00', color: '#4615FF', tag: 'U' },
  { name: 'IMPS Bank Transfer', rail: 'IMPS', amount: '+₹14,500.00', color: '#0F2BFF', tag: 'I' },
  { name: 'UPI Intent Checkout', rail: 'UPI', amount: '+₹999.00', color: '#10B981', tag: 'U' },
  { name: 'Direct IMPS Settlement', rail: 'IMPS', amount: '+₹8,900.00', color: '#FF7686', tag: 'I' }
];

const walletScenarios = [
  { tier: 'SUBSCRIPTION PLAN • 0% FEE', bal: '₹1,00,000', sub: '₹2,000 saved vs 2% gateway fees' },
  { tier: 'SUBSCRIPTION PLAN • 0% FEE', bal: '₹5,00,000', sub: '₹10,000 saved vs 2% gateway fees' },
  { tier: 'SUBSCRIPTION PLAN • 0% FEE', bal: '₹10,00,000', sub: '₹20,000 saved vs 2% gateway fees' }
];

const sandboxPayloads = {
  create: {
    req: 'POST https://mymob.tech/api/v1/payments/create\nContent-Type: application/json\n\n{\n  "amount": 2499.00,\n  "currency": "INR",\n  "rails": ["UPI", "IMPS"],\n  "webhook_url": "https://mymob.tech/webhooks/payment"\n}',
    res: '{\n  "status": "CREATED",\n  "currency": "INR",\n  "amount": 2499.00,\n  "commission_fee": 0.00\n}'
  },
  status: {
    req: 'GET https://mymob.tech/api/v1/payments/{payment_id}\nAuthorization: Bearer <API_KEY>',
    res: '{\n  "status": "SETTLED",\n  "rail": "UPI",\n  "gross_amount": 2499.00,\n  "commission_deducted": 0.00,\n  "net_settled": 2499.00\n}'
  },
  webhook: {
    req: '// Verify Signed Webhook Payload\nconst crypto = require("crypto");\nconst signature = crypto\n  .createHmac("sha256", WEBHOOK_SECRET)\n  .update(rawBody)\n  .digest("hex");',
    res: '{\n  "event": "payment.settled",\n  "rail": "UPI",\n  "amount": 2499.00,\n  "commission_fee": 0.00,\n  "verified": true\n}'
  }
};

const secData = {
  tls: {
    heading: 'End-to-End HTTPS / TLS 1.3 Transport',
    copy: 'All checkout sessions, merchant API keys, and settlement callbacks transit exclusively over encrypted TLS channels.'
  },
  hmac: {
    heading: 'Cryptographically Signed HMAC-SHA256 Webhooks',
    copy: 'Every payment.settled event carries a verifiable signature header so your backend confirms authentic UTR notifications.'
  },
  iso: {
    heading: 'Strict Merchant Workspace Isolation',
    copy: 'Role-protected merchant workspaces with idempotent order keys prevent duplicate settlement replay.'
  }
};

const twPhrases = ['OWN IT.', 'KEEP 100%.', 'ZERO FEES.', 'SETTLE T+0.'];

export default function HomePage() {
  const twTimerRef = useRef(null);

  // 2. Light / Dark Mode Switcher (Default: Light Mode)
  function setThemeMode(mode) {
    if (typeof document === 'undefined') return;
    var root = document.documentElement;
    var isDark = (mode === 'dark');
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('mymobpay_theme', isDark ? 'dark' : 'light');
    } catch (e) {}

    var btnLight = document.getElementById('theme-btn-light');
    var btnDark = document.getElementById('theme-btn-dark');
    if (btnLight && btnDark) {
      if (isDark) {
        btnDark.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all bg-[#0F2BFF] text-white shadow-2xs';
        btnLight.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all theme-text-muted hover:theme-text-primary';
      } else {
        btnLight.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all bg-[#0F2BFF] text-white shadow-2xs';
        btnDark.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all theme-text-muted hover:theme-text-primary';
      }
    }

    var mobLight = document.getElementById('mob-theme-light');
    var mobDark = document.getElementById('mob-theme-dark');
    if (mobLight && mobDark) {
      if (isDark) {
        mobDark.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-[#0F2BFF] text-white';
        mobLight.className = 'px-3 py-1 rounded-full text-[11px] font-bold theme-text-muted';
      } else {
        mobLight.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-[#0F2BFF] text-white';
        mobDark.className = 'px-3 py-1 rounded-full text-[11px] font-bold theme-text-muted';
      }
    }
  }

  function toggleMobileNav() {
    if (typeof document === 'undefined') return;
    var nav = document.getElementById('mobile-nav');
    if (nav) nav.classList.toggle('hidden');
  }

  // 3. Classic Hero Typewriter Engine (Clean Cobalt Accent with Anton font)
  let twPhraseIdx = 0;
  let twCharIdx = twPhrases[0].length;
  let twDeleting = false;

  function stepHeroTypewriter() {
    if (typeof document === 'undefined') return;
    var wordEl = document.getElementById('hero-typewriter-word');
    if (!wordEl) return;

    var currentPhrase = twPhrases[twPhraseIdx];
    var nextDelay = 80;

    if (!twDeleting) {
      twCharIdx++;
      wordEl.textContent = currentPhrase.slice(0, twCharIdx);
      if (twCharIdx >= currentPhrase.length) {
        twDeleting = true;
        nextDelay = 1900;
      } else {
        nextDelay = 75;
      }
    } else {
      twCharIdx--;
      wordEl.textContent = currentPhrase.slice(0, Math.max(0, twCharIdx));
      if (twCharIdx <= 0) {
        twDeleting = false;
        twPhraseIdx = (twPhraseIdx + 1) % twPhrases.length;
        nextDelay = 240;
      } else {
        nextDelay = 42;
      }
    }
    twTimerRef.current = setTimeout(stepHeroTypewriter, nextDelay);
  }

  function cycleHeroTypewriterNow() {
    if (typeof document === 'undefined') return;
    if (twTimerRef.current) clearTimeout(twTimerRef.current);
    twPhraseIdx = (twPhraseIdx + 1) % twPhrases.length;
    twCharIdx = twPhrases[twPhraseIdx].length;
    twDeleting = true;
    var wordEl = document.getElementById('hero-typewriter-word');
    if (wordEl) {
      wordEl.textContent = twPhrases[twPhraseIdx];
    }
    twTimerRef.current = setTimeout(stepHeroTypewriter, 1600);
  }

  // 4. Hero Phone 1 Chat Interactions
  function appendHeroChatTurn(userMsg, botReply) {
    if (typeof document === 'undefined') return;
    var feed = document.getElementById('hero-chat-feed');
    if (!feed) return;
    var rightBubble = document.createElement('div');
    rightBubble.className = 'flex justify-end bubble-enter';
    rightBubble.innerHTML = '<div class="bg-[#4615FF] text-white font-semibold px-3 py-1.5 rounded-2xl rounded-tr-xs shadow-2xs">' + userMsg + '</div>';
    feed.appendChild(rightBubble);

    var leftBubble = document.createElement('div');
    leftBubble.className = 'phone-bubble-card rounded-2xl rounded-tl-xs p-2.5 shadow-2xs max-w-[90%] bubble-enter';
    leftBubble.innerHTML = botReply;
    feed.appendChild(leftBubble);
    feed.scrollTop = feed.scrollHeight;
  }

  function triggerHeroChip(type) {
    var userMsg = '';
    var botReply = '';

    if (type === 'upi999') {
      userMsg = 'Test ₹999 UPI QR';
      botReply = 'UPI QR payment verified. <strong>₹999.00</strong> settled directly. Commission: <strong class="text-[#10B981]">₹0.00</strong>.';
    } else if (type === 'imps4999') {
      userMsg = 'Test ₹4,999 IMPS';
      botReply = 'IMPS transfer verified. <strong>₹4,999.00</strong> settled to bank. Saved <strong>₹99.98</strong> vs 2% gateways.';
    } else {
      userMsg = 'Compare 0% Math';
      botReply = 'On ₹5,00,000 monthly volume, a 2% gateway deducts <strong>₹10,000/mo</strong>. With MyMobPay subscription, commission deducted is <strong>₹0.00</strong>.';
    }

    appendHeroChatTurn(userMsg, botReply);
  }

  function triggerCustomHeroAmount() {
    if (typeof document === 'undefined') return;
    var input = document.getElementById('hero-custom-inr');
    if (!input) return;
    var val = parseFloat(input.value);
    if (!val || val <= 0) val = 1850;
    var saved = (val * 0.02).toFixed(2);
    appendHeroChatTurn(
      'Collect ₹' + val.toLocaleString('en-IN'),
      'Payment verified. <strong>₹' + val.toLocaleString('en-IN') + '</strong> settled to bank. Saved <strong>₹' + saved + '</strong> (0% commission).'
    );
    input.value = '';
  }

  // 6. Phone 2 ("OWN YOUR MONEY") Filter & Tier Switcher
  function filterWalletRows(railFilter) {
    if (typeof document === 'undefined') return;
    var list = document.getElementById('wallet-tx-list');
    if (!list) return;
    var filtered = walletTransactions.filter(function(tx) {
      return railFilter === 'ALL' || tx.rail === railFilter;
    });

    var ids = ['upi', 'imps', 'all'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById('circle-btn-' + ids[i]);
      if (!el) continue;
      if (ids[i] === railFilter.toLowerCase()) {
        el.className = 'w-9 h-9 rounded-full bg-[#0F2BFF] text-white flex items-center justify-center transition-colors';
      } else {
        el.className = 'w-9 h-9 rounded-full theme-bg-well border theme-border flex items-center justify-center theme-link transition-colors';
      }
    }

    list.innerHTML = filtered.map(function(tx) {
      return '<div class="py-2 flex items-center justify-between bubble-enter">' +
        '<div class="flex items-center gap-2">' +
          '<span class="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style="background:' + tx.color + '">' + tx.tag + '</span>' +
          '<div>' +
            '<div class="font-bold theme-text-primary leading-tight">' + tx.name + '</div>' +
            '<div class="font-mono text-[9px] theme-text-muted">' + tx.rail + ' Direct • ₹0 Fee</div>' +
          '</div>' +
        '</div>' +
        '<span class="font-mono font-bold text-[#10B981]">' + tx.amount + '</span>' +
      '</div>';
    }).join('');
  }

  let walletScenarioIdx = 0;

  function cycleWalletScenario() {
    if (typeof document === 'undefined') return;
    walletScenarioIdx = (walletScenarioIdx + 1) % walletScenarios.length;
    var s = walletScenarios[walletScenarioIdx];
    var badge = document.getElementById('wallet-tier-badge');
    var bal = document.getElementById('wallet-balance-val');
    var sub = document.getElementById('wallet-saved-sub');
    if (badge) badge.textContent = s.tier;
    if (bal) bal.textContent = s.bal;
    if (sub) sub.textContent = s.sub;
  }

  // 7. Phone 3 ("YUM, 0% FEES.") Highlight Pulse
  function toggleYumHighlight(which) {
    if (typeof document === 'undefined') return;
    var p = document.getElementById('yum-card-purple');
    var m = document.getElementById('yum-card-mint');
    if (!p || !m) return;
    if (which === 'purple') {
      p.classList.add('ring-2', 'ring-[#0F2BFF]');
      m.classList.remove('ring-2', 'ring-[#0F2BFF]');
    } else {
      m.classList.add('ring-2', 'ring-[#0F2BFF]');
      p.classList.remove('ring-2', 'ring-[#0F2BFF]');
    }
  }

  function pulseYumCards() {
    toggleYumHighlight('purple');
    setTimeout(function() { toggleYumHighlight('mint'); }, 450);
  }

  // 8. Phone 4 (Flame Screen) Webhook Trigger
  function fireFlameWebhook() {
    if (typeof document === 'undefined') return;
    var feed = document.getElementById('flame-feed');
    var status = document.getElementById('flame-status-line');
    if (!feed) return;

    var card = document.createElement('div');
    card.className = 'bg-white/95 rounded-2xl p-2.5 shadow-md text-[#090A10] max-w-[90%] bubble-enter';
    card.innerHTML = '<span class="font-mono text-[9.5px] font-bold text-[#059669]">200 OK</span> • Webhook callback verified (₹0.00 commission)';
    feed.appendChild(card);
    feed.scrollTop = feed.scrollHeight;
    if (status) status.textContent = 'Webhook callback verified (200 OK)';
  }

  // 9. Section G: Exact 2% vs 0% Range Slider Calculator
  function updateComparisonSlider(val) {
    if (typeof document === 'undefined') return;
    var vol = parseInt(val, 10) || 500000;
    var legacyCutMonth = Math.round(vol * 0.02);
    var legacyNet = vol - legacyCutMonth;
    var annualSaved = legacyCutMonth * 12;

    var dVol = document.getElementById('comp-vol-display');
    var dAnn = document.getElementById('comp-annual-saved');
    var dLoss = document.getElementById('comp-legacy-loss');
    var dLNet = document.getElementById('comp-legacy-net');
    var dMNet = document.getElementById('comp-mymob-net');
    var dBar = document.getElementById('bar-label-legacy');

    if (dVol) dVol.textContent = '₹' + vol.toLocaleString('en-IN');
    if (dAnn) dAnn.textContent = '₹' + annualSaved.toLocaleString('en-IN') + ' / yr';
    if (dLoss) dLoss.textContent = '-₹' + legacyCutMonth.toLocaleString('en-IN') + ' / mo';
    if (dLNet) dLNet.textContent = '₹' + legacyNet.toLocaleString('en-IN');
    if (dMNet) dMNet.textContent = '₹' + vol.toLocaleString('en-IN') + ' (100%)';
    if (dBar) dBar.textContent = '+₹' + legacyCutMonth.toLocaleString('en-IN') + '/mo kept';
  }

  function selectPlanVolume(vol, btnEl) {
    if (typeof document === 'undefined') return;
    var pills = document.querySelectorAll('.vol-pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].className = 'vol-pill px-4 py-1.5 rounded-full text-xs font-bold theme-text-secondary hover:theme-text-primary transition-colors';
    }
    if (btnEl) {
      btnEl.className = 'vol-pill px-4 py-1.5 rounded-full text-xs font-bold bg-[#0F2BFF] text-white shadow-2xs transition-colors';
    }
    var saved = Math.round(vol * 0.02);
    var callout = document.getElementById('plan-savings-callout');
    if (callout) {
      callout.textContent = 'At ₹' + vol.toLocaleString('en-IN') + '/mo: Save ₹' + saved.toLocaleString('en-IN') + '/mo in 2% gateway fees • MyMobPay Commission: ₹0.00';
    }
  }

  // 11. Section I: Developer REST API Sandbox
  let currentSandboxKey = 'create';

  function switchSandboxTab(key) {
    if (typeof document === 'undefined') return;
    currentSandboxKey = key;
    var keys = ['create', 'status', 'webhook'];
    for (var i = 0; i < keys.length; i++) {
      var tab = document.getElementById('sb-tab-' + keys[i]);
      if (!tab) continue;
      if (keys[i] === key) {
        tab.className = 'px-3 py-1.5 rounded-md font-mono text-[11px] font-bold bg-[#0F2BFF] text-white';
      } else {
        tab.className = 'px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold bg-white/5 text-white/70 hover:text-white';
      }
    }
    var reqCode = document.getElementById('sb-req-code');
    var resCode = document.getElementById('sb-res-code');
    if (reqCode) reqCode.textContent = sandboxPayloads[key].req;
    if (resCode) resCode.textContent = sandboxPayloads[key].res;
  }

  function runSandboxRequest() {
    if (typeof document === 'undefined') return;
    var badge = document.getElementById('sb-res-badge');
    var resEl = document.getElementById('sb-res-code');
    if (badge) badge.textContent = '200 OK';
    if (resEl) {
      resEl.textContent = sandboxPayloads[currentSandboxKey].res;
    }
  }

  function copySandboxCode() {
    if (typeof document === 'undefined') return;
    var text = sandboxPayloads[currentSandboxKey].req;
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      var btn = document.getElementById('sb-copy-btn');
      if (btn) {
        btn.innerHTML = '<span>Copied!</span>';
        setTimeout(function() {
          btn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy JSON</span>';
        }, 1300);
      }
    } catch (e) {}
    document.body.removeChild(ta);
  }

  // 12. Section J: Security Tabs
  function switchSecTab(key) {
    if (typeof document === 'undefined') return;
    var keys = ['tls', 'hmac', 'iso'];
    for (var i = 0; i < keys.length; i++) {
      var pill = document.getElementById('sec-pill-' + keys[i]);
      if (!pill) continue;
      if (keys[i] === key) {
        pill.className = 'px-2.5 py-1 rounded text-[10px] font-bold bg-[#0F2BFF] text-white';
      } else {
        pill.className = 'px-2.5 py-1 rounded text-[10px] font-semibold bg-[#F2F3FB] text-[#222533]';
      }
    }
    var head = document.getElementById('sec-card-heading');
    var copy = document.getElementById('sec-card-copy');
    if (head) head.textContent = secData[key].heading;
    if (copy) copy.textContent = secData[key].copy;
  }

  // 13. FAQ Accordion
  function toggleFaq(num) {
    if (typeof document === 'undefined') return;
    var body = document.getElementById('faq-body-' + num);
    var icon = document.getElementById('faq-icon-' + num);
    if (!body) return;
    var isHidden = body.classList.contains('hidden');
    if (isHidden) {
      body.classList.remove('hidden');
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      body.classList.add('hidden');
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }

  // 14. Slide-Over API Drawer & Auth Modal
  let currentDrawerKey = 'create';

  function openApiDrawer(key) {
    if (typeof document === 'undefined') return;
    var drawer = document.getElementById('api-drawer-backdrop');
    if (drawer) drawer.classList.remove('hidden');
    switchDrawerEndpoint(key || 'create');
  }

  function closeApiDrawer() {
    if (typeof document === 'undefined') return;
    var drawer = document.getElementById('api-drawer-backdrop');
    if (drawer) drawer.classList.add('hidden');
  }

  function switchDrawerEndpoint(key) {
    if (typeof document === 'undefined') return;
    currentDrawerKey = key;
    var keys = ['create', 'status', 'webhook'];
    for (var i = 0; i < keys.length; i++) {
      var btn = document.getElementById('drawer-tab-' + keys[i]);
      if (!btn) continue;
      btn.className = (keys[i] === key)
        ? 'px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#0F2BFF] text-white'
        : 'px-3 py-1.5 rounded text-xs font-mono font-semibold bg-white/10 text-white/80';
    }
    var pre = document.getElementById('drawer-code-pre');
    if (pre) pre.textContent = sandboxPayloads[key].res;
  }

  function copyDrawerCode() {
    if (typeof document === 'undefined') return;
    var text = sandboxPayloads[currentDrawerKey].res;
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      var btn = document.getElementById('drawer-copy-btn');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy JSON'; }, 1300);
      }
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function openAuthModal(mode) {
    if (typeof document === 'undefined') return;
    var modal = document.getElementById('auth-modal');
    var title = document.getElementById('auth-modal-title');
    var btn = document.getElementById('auth-submit-btn');
    var fb = document.getElementById('auth-feedback');
    if (fb) fb.classList.add('hidden');
    if (mode === 'login') {
      if (title) title.textContent = 'MERCHANT LOG IN';
      if (btn) btn.textContent = 'Log In to Dashboard';
    } else {
      if (title) title.textContent = 'GET STARTED FREE';
      if (btn) btn.textContent = 'Create Merchant Account';
    }
    if (modal) modal.classList.remove('hidden');
  }

  function closeAuthModal() {
    if (typeof document === 'undefined') return;
    var modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  function handleAuthSubmit() {
    if (typeof document === 'undefined') return;
    var fb = document.getElementById('auth-feedback');
    if (fb) {
      fb.textContent = 'Session verified. Redirecting to mymob.tech merchant console...';
      fb.classList.remove('hidden');
    }
  }

  // 15. Interactive 3D Hover Tilt & Ambient Live Activity Across All 4 Phones
  function initPhoneAnimations() {
    if (typeof document === 'undefined') return () => {};
    var phones = document.querySelectorAll('[data-tilt-phone]');
    var handlers = [];
    for (var i = 0; i < phones.length; i++) {
      (function(phone) {
        var onMouseMove = function(e) {
          if (window.innerWidth < 768) return;
          var rect = phone.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          phone.style.animationPlayState = 'paused';
          phone.style.transform = 'perspective(950px) rotateY(' + (x * 10).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg) translateY(-6px)';
        };
        var onMouseLeave = function() {
          phone.style.transform = '';
          phone.style.animationPlayState = 'running';
        };
        phone.addEventListener('mousemove', onMouseMove);
        phone.addEventListener('mouseleave', onMouseLeave);
        handlers.push({ phone: phone, move: onMouseMove, leave: onMouseLeave });
      })(phones[i]);
    }

    var walletInterval = setInterval(function() {
      cycleWalletScenario();
    }, 4800);

    var yumToggleState = false;
    var yumInterval = setInterval(function() {
      yumToggleState = !yumToggleState;
      toggleYumHighlight(yumToggleState ? 'purple' : 'mint');
    }, 3600);

    return function() {
      handlers.forEach(function(h) {
        h.phone.removeEventListener('mousemove', h.move);
        h.phone.removeEventListener('mouseleave', h.leave);
      });
      clearInterval(walletInterval);
      clearInterval(yumInterval);
    };
  }

  // Mount effect
  useEffect(() => {
    // Bind functions to window for global access
    window.setThemeMode = setThemeMode;
    window.toggleMobileNav = toggleMobileNav;
    window.cycleHeroTypewriterNow = cycleHeroTypewriterNow;
    window.triggerHeroChip = triggerHeroChip;
    window.triggerCustomHeroAmount = triggerCustomHeroAmount;
    window.filterWalletRows = filterWalletRows;
    window.cycleWalletScenario = cycleWalletScenario;
    window.toggleYumHighlight = toggleYumHighlight;
    window.pulseYumCards = pulseYumCards;
    window.fireFlameWebhook = fireFlameWebhook;
    window.updateComparisonSlider = updateComparisonSlider;
    window.selectPlanVolume = selectPlanVolume;
    window.switchSandboxTab = switchSandboxTab;
    window.runSandboxRequest = runSandboxRequest;
    window.copySandboxCode = copySandboxCode;
    window.switchSecTab = switchSecTab;
    window.toggleFaq = toggleFaq;
    window.openApiDrawer = openApiDrawer;
    window.closeApiDrawer = closeApiDrawer;
    window.switchDrawerEndpoint = switchDrawerEndpoint;
    window.copyDrawerCode = copyDrawerCode;
    window.openAuthModal = openAuthModal;
    window.closeAuthModal = closeAuthModal;
    window.handleAuthSubmit = handleAuthSubmit;

    var savedTheme = null;
    try { savedTheme = localStorage.getItem('mymobpay_theme'); } catch (e) {}
    setThemeMode(savedTheme === 'dark' ? 'dark' : 'light');
    filterWalletRows('ALL');
    switchSandboxTab('create');
    const cleanupPhone = initPhoneAnimations();
    twTimerRef.current = setTimeout(stepHeroTypewriter, 1800);

    const handleKeyDown = (e) => {
      var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'd' || e.key === 'D') {
        var isDark = document.documentElement.classList.contains('dark');
        setThemeMode(isDark ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (twTimerRef.current) clearTimeout(twTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      if (cleanupPhone) cleanupPhone();
    };
  }, []);

  return (
    <div className="homepage-root min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] pb-16 md:pb-0 selection:bg-[#0F2BFF] selection:text-white transition-colors duration-200">
      {/* Google Fonts: Anton, Barlow Condensed, Plus Jakarta Sans, JetBrains Mono */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@700;800;900&family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Scoped and Global Visual Styles */}
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

{/* ===================================================================== */}
  {/* A. STICKY 3-ZONE HEADER MENUBAR                                       */}
  {/* ===================================================================== */}
  <header className="site-header sticky top-0 z-40 w-full transition-colors">
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3">

      {/* Zone 1 (Left): Original MyMobPay 3D Blue & Orange Folded Ribbon "M" Logo (Uncropped Rounded Bottom Feet) */}
      <a href="#" className="flex items-center gap-2.5 shrink-0 focus:outline-none group" aria-label="MyMobPay Home">
        <span className="w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <MyMobPayLogoMark className="w-full h-full" id="master-header" />
        </span>
        <span className="font-sans font-extrabold text-[20px] tracking-tight theme-text-primary">
          MyMob<span className="text-[#0F2BFF]">Pay</span>
        </span>
      </a>

      {/* Zone 2 (Center): Floating Navigation Pill */}
      <nav className="hidden lg:flex items-center header-nav-pill px-2 py-1 rounded-full shadow-2xs" aria-label="Primary Navigation">
        <a href="#own-your-money" className="nav-pill-item">Product</a>
        <a href="#fees-drag" className="nav-pill-item">0% Model</a>
        <a href="#gateway-comparison" className="nav-pill-item">Calculator</a>
        <a href="#pick-plan" className="nav-pill-item">Pricing</a>
        <a href="#clean-apis" className="nav-pill-item">Developers</a>
        <a href="#faq-section" className="nav-pill-item">FAQ</a>
      </nav>

      {/* Zone 3 (Right): Segmented Light/Dark Switcher + Auth CTAs */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* Segmented Theme Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-full theme-bg-elevated border theme-border" role="group" aria-label="Theme Mode">
          <button
            type="button"
            id="theme-btn-light"
            onClick={() => setThemeMode('light')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all bg-[#0F2BFF] text-white shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            <span>Light</span>
          </button>
          <button
            type="button"
            id="theme-btn-dark"
            onClick={() => setThemeMode('dark')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all theme-text-muted hover:theme-text-primary"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <span>Dark</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="text-[13px] font-bold theme-link hover:underline px-2 py-1"
        >
          Log in
        </button>

        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="btn-editorial bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-[12.5px] font-bold px-4 py-2 rounded-full"
        >
          Get started
        </button>
      </div>

      {/* Mobile Right Controls */}
      <div className="flex md:hidden items-center gap-2">
        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="bg-[#0F2BFF] text-white text-[11.5px] font-bold px-3 py-1.5 rounded-full"
        >
          Start free
        </button>
        <button
          type="button"
          onClick={toggleMobileNav}
          className="p-2 rounded-lg theme-bg-elevated border theme-border theme-text-primary"
          aria-label="Toggle Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </div>

    {/* Mobile Navigation Drawer */}
    <div id="mobile-nav" className="hidden md:hidden theme-bg-elevated border-b theme-border px-4 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
        <a href="#own-your-money" onClick={toggleMobileNav} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Product</a>
        <a href="#fees-drag" onClick={toggleMobileNav} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">0% Fee Model</a>
        <a href="#gateway-comparison" onClick={toggleMobileNav} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">0% Calculator</a>
        <a href="#pick-plan" onClick={toggleMobileNav} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Pricing Plans</a>
        <a href="#clean-apis" onClick={toggleMobileNav} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Developers</a>
        <a href="#faq-section" onClick={toggleMobileNav} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Merchant FAQ</a>
      </div>

      <div className="flex items-center justify-between pt-2 border-t theme-border">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider theme-text-muted">Appearance</span>
        <div className="inline-flex items-center p-0.5 rounded-full theme-bg-well border theme-border">
          <button type="button" id="mob-theme-light" onClick={() => setThemeMode('light')} className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#0F2BFF] text-white">Light</button>
          <button type="button" id="mob-theme-dark" onClick={() => setThemeMode('dark')} className="px-3 py-1 rounded-full text-[11px] font-bold theme-text-muted">Dark</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button type="button" onClick={() => { toggleMobileNav(); openAuthModal('login'); }} className="py-2.5 rounded-lg border border-[#0F2BFF] theme-link text-xs font-bold">Log in</button>
        <button type="button" onClick={() => { toggleMobileNav(); openAuthModal('signup'); }} className="py-2.5 rounded-lg bg-[#0F2BFF] text-white text-xs font-bold">Get started free</button>
      </div>
    </div>
  </header>

  <main>
    {/* =================================================================== */}
    {/* B. HOME / HERO SECTION (#home-hero)                                 */}
    {/* =================================================================== */}
    <section id="home-hero" className="relative theme-bg-secondary bg-arch-grid pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 overflow-hidden transition-colors">
      {/* Subtle Animated Vertical Grid Light Beams */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="grid-beam-v absolute left-[18%] top-0 w-[1.5px] h-28 bg-[#0F2BFF]/30"></div>
        <div className="grid-beam-v absolute left-[82%] top-0 w-[1.5px] h-28 bg-[#0F2BFF]/25" style={{ animationDelay: '2.8s' }}></div>
      </div>

      <div className="relative z-10 max-w-[1120px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Clean Editorial Headline + Classic Typewriter */}
          <div className="md:col-span-6 lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full theme-bg-elevated border theme-border shadow-2xs mb-5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] theme-text-primary">
                DIRECT-TO-BANK UPI & IMPS • 0% COMMISSION
              </span>
            </div>

            {/* Classic Anton Uppercase Display Headline + Typewriter */}
            <h1 className="hero-display-title text-[52px] sm:text-[68px] lg:text-[78px] select-none space-y-1">
              <span className="block theme-text-primary">IT&apos;S YOUR</span>
              <span className="block theme-text-primary">REVENUE.</span>
              <span
                onClick={cycleHeroTypewriterNow}
                title="Click to cycle headline"
                className="inline-flex items-baseline cursor-pointer pt-0.5"
              >
                <span id="hero-typewriter-word" className="text-[#0F2BFF]">OWN IT.</span>
                <span className="typewriter-caret" aria-hidden="true"></span>
              </span>
            </h1>

            {/* Single Concise Subcopy Paragraph */}
            <p className="mt-5 max-w-[460px] text-[15px] sm:text-[16px] theme-text-secondary leading-relaxed font-normal">
              Payment infrastructure without the complexity. Collect via UPI & IMPS directly into your merchant bank account with <strong className="font-bold theme-text-primary">0% transaction commission</strong> under flat subscription plans.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="btn-editorial bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-[13.5px] font-bold px-6 py-3.5 rounded-lg inline-flex items-center gap-2"
              >
                <span>Get started free</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>

              <a
                href="#own-your-money"
                className="btn-editorial theme-bg-elevated border theme-border theme-text-primary text-[13.5px] font-bold px-5 py-3.5 rounded-lg inline-flex items-center gap-2"
              >
                <span>Explore product</span>
              </a>
            </div>
          </div>

          {/* Right Column: Unobstructed Detached 3D Hero iPhone + Subtle Orbit Rings */}
          <div className="md:col-span-6 lg:col-span-5 flex justify-center relative scale-[0.92] sm:scale-100 origin-top">
            <div className="relative flex items-center justify-center">

              {/* Counter-Rotating Orbital Payment Rings Behind Phone */}
              <div className="orbit-ring-cw hidden sm:block w-[370px] h-[370px]">
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#0F2BFF]"></span>
              </div>
              <div className="orbit-ring-ccw hidden sm:block w-[420px] h-[420px]">
                <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FF6E00]"></span>
              </div>

              {/* Floating Badge 1 (Left of Hero Phone) */}
              <div className="float-badge-1 hidden sm:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl theme-bg-elevated border theme-border shadow-lg absolute -left-12 lg:-left-16 top-24 z-20">
                <span className="w-7 h-7 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <div className="text-left leading-tight">
                  <div className="text-[11px] font-extrabold theme-text-primary">T+0 Direct Bank</div>
                  <div className="font-mono text-[9.5px] theme-text-muted">Zero nodal holding</div>
                </div>
              </div>

              {/* Floating Badge 2 (Right of Hero Phone) */}
              <div className="float-badge-2 hidden sm:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl theme-bg-elevated border theme-border shadow-lg absolute -right-10 lg:-right-14 top-64 z-20">
                <span className="w-7 h-7 rounded-full bg-[#0F2BFF]/12 text-[#0F2BFF] dark:text-[#60A5FA] font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                  0%
                </span>
                <div className="text-left leading-tight">
                  <div className="text-[11px] font-extrabold theme-text-primary">₹0.00 Commission</div>
                  <div className="font-mono text-[9.5px] theme-text-muted">100% revenue kept</div>
                </div>
              </div>

              {/* Detached Full 4-Corner Sculpted 3D iPhone 1 */}
              <div className="clay-iphone-hero hero-phone-animate relative z-10" data-tilt-phone>
                <div className="clay-side-silent"></div>
                <div className="clay-side-vol-up"></div>
                <div className="clay-side-vol-down"></div>
                <div className="clay-side-power"></div>

                <div className="clay-screen-hero justify-between">
                  <div className="clay-notch">
                    <div className="clay-speaker"></div>
                    <div className="clay-camera"></div>
                  </div>

                  {/* Subtle Background Watermark Text Inside Hero Phone Screen */}
                  <div className="pointer-events-none select-none absolute inset-x-0 top-20 flex flex-col items-center justify-center z-0 overflow-hidden" aria-hidden="true">
                    <span className="font-display uppercase text-[68px] leading-[0.86] tracking-tight" style={{ color: 'var(--phone-Watermark)' }}>OWN IT</span>
                    <span className="font-display uppercase text-[68px] leading-[0.86] tracking-tight mt-20" style={{ color: 'var(--phone-Watermark)' }}>0% FEE</span>
                  </div>

                  {/* iOS Status Bar + MyMobPay App Bar */}
                  <div className="relative z-10">
                    <div className="pt-2 px-5 flex items-center justify-between text-[10px] font-bold theme-text-primary">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor"><rect x="1" y="8" width="2" height="4" rx="0.5"/><rect x="5" y="6" width="2" height="6" rx="0.5"/><rect x="9" y="3" width="2" height="9" rx="0.5"/><rect x="13" y="1" width="2" height="11" rx="0.5"/></svg>
                        <svg className="w-4 h-2.5" viewBox="0 0 20 10" fill="currentColor"><rect x="1" y="1" width="15" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="3" width="11" height="4" rx="1"/></svg>
                      </div>
                    </div>

                    <div className="mt-3 px-4 pb-2.5 border-b theme-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MyMobPayLogoMark className="w-5 h-5 object-contain" id="badge-1" />
                        <span className="font-extrabold text-xs theme-text-primary">MyMob<span className="text-[#0F2BFF] dark:text-[#60A5FA]">Pay</span></span>
                      </div>
                      <span className="phone-pill-pulse bg-[#4615FF] text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                        <span>0% Fee Live</span>
                      </span>
                    </div>
                  </div>

                  {/* Interactive Live Settlement Chat Feed */}
                  <div id="hero-chat-feed" className="px-3.5 py-2.5 space-y-2.5 flex-1 overflow-y-auto no-scrollbar text-[11px] relative z-10">
                    <div className="phone-bubble-card rounded-2xl rounded-tl-xs p-2.5 shadow-2xs max-w-[90%]">
                      Incoming UPI payment request for <strong>Order #MMP-8492 — ₹2,499.00</strong>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-[#4615FF] text-white font-semibold px-3 py-1.5 rounded-2xl rounded-tr-xs shadow-2xs">
                        Settle direct to bank
                      </div>
                    </div>

                    <div className="phone-bubble-card rounded-2xl rounded-tl-xs p-2.5 shadow-2xs max-w-[92%]">
                      UTR <span className="font-mono text-[#0F2BFF] dark:text-[#60A5FA]">#431988210492</span> verified via UPI. <strong>₹2,499.00 settled</strong>. Commission deducted: <strong className="text-[#10B981]">₹0.00</strong>.
                    </div>

                    <div className="phone-bubble-card rounded-2xl rounded-tl-xs p-2.5 shadow-2xs max-w-[92%]">
                      Standard 2% gateways would have taken <strong>₹49.98</strong>. You kept <strong>100%</strong>.
                    </div>
                  </div>

                  {/* Interactive Amount Input & Quick Action Chips */}
                  <div className="relative z-10 p-3 theme-bg-elevated border-t theme-border">
                    <form onSubmit={(e) => { e.preventDefault(); triggerCustomHeroAmount(); }} className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold theme-text-muted">₹</span>
                        <input
                          id="hero-custom-inr"
                          type="number"
                          min="1"
                          max="500000"
                          placeholder="Enter amount (e.g. 1850)"
                          className="w-full pl-6 pr-2.5 py-1.5 rounded-full theme-bg-well border theme-border text-[10.5px] font-semibold theme-text-primary focus:outline-none focus:border-[#0F2BFF]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-7 h-7 rounded-full bg-[#0F2BFF] hover:bg-[#081EC4] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95"
                        aria-label="Simulate payment"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    </form>

                    <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() => triggerHeroChip('upi999')}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-[#FF7686] text-white text-[10px] font-extrabold"
                      >
                        ₹999 UPI QR
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerHeroChip('imps4999')}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-[#4615FF] text-white text-[10px] font-extrabold"
                      >
                        ₹4,999 IMPS
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerHeroChip('math')}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-[#E0E4FF] text-[#1D1868] text-[10px] font-extrabold"
                      >
                        0% Math
                      </button>
                    </div>

                    <div className="ios-home-bar mt-2"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* B2. SIMPLE CLEAN RUNNING TEXT RAIL (MARQUEE TICKER)                 */}
    {/* =================================================================== */}
    <div className="theme-bg-elevated border-y theme-border py-3 overflow-hidden select-none transition-colors">
      <div className="marquee-track items-center gap-10 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] theme-text-muted">
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
          <span>0% TRANSACTION COMMISSION</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0F2BFF]"></span>
          <span>FLAT SUBSCRIPTION PLANS</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FF6E00]"></span>
          <span>UPI & IMPS PAYMENT RAILS</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
          <span>REAL-TIME WEBHOOK NOTIFICATIONS</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0F2BFF]"></span>
          <span>CLEAN REST API INTEGRATION</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FF6E00]"></span>
          <span>CRYPTO SUPPORT ON ROADMAP</span>
        </span>

        {/* Duplicate Set for Seamless Infinite Scroll */}
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
          <span>0% TRANSACTION COMMISSION</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0F2BFF]"></span>
          <span>FLAT SUBSCRIPTION PLANS</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FF6E00]"></span>
          <span>UPI & IMPS PAYMENT RAILS</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
          <span>REAL-TIME WEBHOOK NOTIFICATIONS</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0F2BFF]"></span>
          <span>CLEAN REST API INTEGRATION</span>
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FF6E00]"></span>
          <span>CRYPTO SUPPORT ON ROADMAP</span>
        </span>
      </div>
    </div>

    {/* =================================================================== */}
    {/* D. "OWN YOUR MONEY" SPLIT (3D PHONE 2 LEFT, COPY RIGHT)             */}
    {/* =================================================================== */}
    <section id="own-your-money" className="theme-bg-secondary bg-arch-grid py-12 sm:py-28 border-b theme-border transition-colors">
      <div className="max-w-[1060px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Sculpted 3D iPhone 2 */}
          <div className="md:col-span-6 flex justify-center">
            <div className="clay-iphone clay-float" data-tilt-phone>
              <div className="clay-side-silent"></div>
              <div className="clay-side-vol-up"></div>
              <div className="clay-side-vol-down"></div>
              <div className="clay-side-power"></div>

              <div className="clay-screen">
                <div className="clay-notch">
                  <div className="clay-speaker"></div>
                  <div className="clay-camera"></div>
                </div>

                {/* Status Bar */}
                <div className="pt-2 px-5 flex items-center justify-between text-[10px] font-bold theme-text-primary">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor"><rect x="1" y="8" width="2" height="4" rx="0.5"/><rect x="5" y="6" width="2" height="6" rx="0.5"/><rect x="9" y="3" width="2" height="9" rx="0.5"/><rect x="13" y="1" width="2" height="11" rx="0.5"/></svg>
                    <svg className="w-4 h-2.5" viewBox="0 0 20 10" fill="currentColor"><rect x="1" y="1" width="15" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="3" width="11" height="4" rx="1"/></svg>
                  </div>
                </div>

                {/* App Header */}
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <MyMobPayLogoMark className="w-5 h-5 object-contain" id="badge-2" />
                  <span className="font-extrabold text-xs theme-text-primary">MyMob<span className="text-[#0F2BFF] dark:text-[#60A5FA]">Pay</span></span>
                </div>

                {/* Coral-Pink & Deep Navy Ledger Card */}
                <div className="mx-3.5 mt-3 rounded-2xl overflow-hidden shadow-md border border-[#FFE0E5] dark:border-[#3A2434]">
                  <div className="bg-[#141068] text-white px-3.5 py-2 flex items-center justify-between">
                    <span id="wallet-tier-badge" className="font-mono text-[8.5px] tracking-wider uppercase text-[#B5B9FF]">
                      SUBSCRIPTION PLAN • 0% FEE
                    </span>
                    <svg className="w-3.5 h-3.5 text-[#FFD166] phone-crown-animate" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>

                  <div className="relative bg-[#FF7888] px-4 py-4 text-center overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-[#141068] text-[#FF7888] mx-auto flex items-center justify-center shadow-xs phone-crown-animate">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>
                    </div>
                    <div className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#141068]">
                      MERCHANT VOLUME SETTLED
                    </div>
                    <div id="wallet-balance-val" className="tabular-nums-stat text-[28px] leading-tight text-[#141068] mt-1">
                      ₹1,00,000
                    </div>
                    <div id="wallet-saved-sub" className="mt-1 text-[10px] font-semibold text-[#141068]/90">
                      ₹0.00 commission deducted
                    </div>
                  </div>
                </div>

                {/* 3 Filter Buttons (SVG Icons) */}
                <div className="mt-3.5 flex items-center justify-center gap-6">
                  <button type="button" onClick={() => filterWalletRows('UPI')} className="group flex flex-col items-center gap-1 focus:outline-none">
                    <div id="circle-btn-upi" className="w-9 h-9 rounded-full theme-bg-well border theme-border flex items-center justify-center theme-link transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h7v7h-7z"/></svg>
                    </div>
                    <span className="text-[9.5px] font-bold theme-text-primary">UPI QR</span>
                  </button>

                  <button type="button" onClick={() => filterWalletRows('IMPS')} className="group flex flex-col items-center gap-1 focus:outline-none">
                    <div id="circle-btn-imps" className="w-9 h-9 rounded-full theme-bg-well border theme-border flex items-center justify-center theme-link transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 10l5-5 5 5M17 14l-5 5-5-5"/></svg>
                    </div>
                    <span className="text-[9.5px] font-bold theme-text-primary">IMPS Rail</span>
                  </button>

                  <button type="button" onClick={() => filterWalletRows('ALL')} className="group flex flex-col items-center gap-1 focus:outline-none">
                    <div id="circle-btn-all" className="w-9 h-9 rounded-full bg-[#0F2BFF] text-white flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
                    </div>
                    <span className="text-[9.5px] font-bold theme-text-primary">All Feed</span>
                  </button>
                </div>

                {/* Live Merchant Transactions List */}
                <div className="mt-3 px-4 flex-1 overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between text-[10px] font-bold theme-text-muted pb-1.5 border-b theme-border">
                    <span>Recent Settlements</span>
                    <span className="font-mono text-[9px] text-[#10B981]">0% Fee</span>
                  </div>
                  <div id="wallet-tx-list" className="divide-y theme-border text-[11px]"></div>
                </div>

                {/* Bottom SVG Tab Bar */}
                <div className="border-t theme-border pt-2 px-6 theme-bg-elevated">
                  <div className="flex items-center justify-between theme-text-muted">
                    <svg className="w-4 h-4 theme-link" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </div>
                  <div className="ios-home-bar"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Block */}
          <div className="md:col-span-6 flex justify-center md:justify-start">
            <div className="max-w-[390px]">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
                ZERO COMMISSION MODEL
              </div>
              <h2 className="headline-anton text-[40px] sm:text-[48px] mt-1.5">
                OWN YOUR<br />
                MONEY
              </h2>
              <p className="mt-3.5 text-[14.5px] theme-text-secondary leading-[1.65]">
                Take full control of your merchant cash flow. Under MyMobPay&apos;s flat subscription model, your UPI and IMPS collections settle with 0% transaction commission deducted.
              </p>
              <button
                type="button"
                onClick={cycleWalletScenario}
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold theme-link hover:underline"
              >
                <span>Cycle volume example on phone</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* E. "PAYING 2% FEES IS A DRAG" (COPY LEFT, 3D PHONE 3 RIGHT)         */}
    {/* =================================================================== */}
    <section id="fees-drag" className="theme-bg-primary py-12 sm:py-28 border-b theme-border transition-colors">
      <div className="max-w-[1060px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Editorial Block */}
          <div className="md:col-span-6 flex justify-center md:justify-end order-2 md:order-1">
            <div className="max-w-[390px]">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
                SUBSCRIPTION INFRASTRUCTURE
              </div>
              <h2 className="headline-anton text-[40px] sm:text-[48px] mt-1.5">
                PAYING 2% FEES<br />
                IS A DRAG
              </h2>
              <p className="mt-3.5 text-[14.5px] theme-text-secondary leading-[1.65]">
                Percentage-based gateways tax your revenue on every single checkout. Switch to a flat subscription, accept UPI and IMPS payments, and keep 100% of every transaction.
              </p>
              <button
                type="button"
                onClick={pulseYumCards}
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold theme-link hover:underline"
              >
                <span>Inspect payment rail cards</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Right Column: Sculpted 3D iPhone 3 ("YUM, 0% FEES.") */}
          <div className="hidden md:flex md:col-span-6 justify-center order-1 md:order-2">
            <div className="clay-iphone clay-float" style={{ animationDelay: '1.4s' }} data-tilt-phone>
              <div className="clay-side-silent"></div>
              <div className="clay-side-vol-up"></div>
              <div className="clay-side-vol-down"></div>
              <div className="clay-side-power"></div>

              <div className="clay-screen">
                <div className="clay-notch">
                  <div className="clay-speaker"></div>
                  <div className="clay-camera"></div>
                </div>

                {/* Midnight Navy Header + Scalloped Wave Divider */}
                <div className="relative bg-[#0E0A52] text-white pt-2 pb-7 px-5 text-center">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor"><rect x="1" y="8" width="2" height="4" rx="0.5"/><rect x="5" y="6" width="2" height="6" rx="0.5"/><rect x="9" y="3" width="2" height="9" rx="0.5"/><rect x="13" y="1" width="2" height="11" rx="0.5"/></svg>
                      <svg className="w-4 h-2.5" viewBox="0 0 20 10" fill="currentColor"><rect x="1" y="1" width="15" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="3" width="11" height="4" rx="1"/></svg>
                    </div>
                  </div>

                  <svg className="phone-cloud-left absolute left-3 top-11 w-10 h-6 text-[#FF9EBB]" viewBox="0 0 48 28" fill="currentColor"><path d="M12 24h26a8 8 0 000-16 11 11 0 00-21-2A7 7 0 0012 24z"/></svg>
                  <svg className="phone-cloud-right absolute right-3 top-12 w-10 h-6 text-[#9AD9FF]" viewBox="0 0 48 28" fill="currentColor"><path d="M12 24h26a8 8 0 000-16 11 11 0 00-21-2A7 7 0 0012 24z"/></svg>

                  <div className="mt-5 font-display uppercase text-[36px] leading-[0.88] text-[#8CD6FF] tracking-wide">
                    YUM,<br />
                    0% FEES.
                  </div>

                  {/* Theme-Matched Scalloped Wave SVG */}
                  <svg className="absolute bottom-0 left-0 w-full h-4" style={{ color: 'var(--phone-screen-bg)' }} viewBox="0 0 288 18" preserveAspectRatio="none" fill="currentColor">
                    <path d="M0 18V8c12 0 12-8 24-8s12 8 24 8 12-8 24-8 12 8 24 8 12-8 24-8 12 8 24 8 12-8 24-8 12 8 24 8 12-8 24-8 12 8 24 8 12-8 24-8 12 8 24 8v10H0z"/>
                  </svg>
                </div>

                {/* Screen Body */}
                <div className="px-4 pt-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="font-mono text-[9px] font-bold uppercase tracking-wider theme-text-primary mb-1 flex items-center gap-1">
                        <span>SUBSCRIPTION POWER</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                      <div
                        id="yum-card-purple"
                        onClick={() => toggleYumHighlight('purple')}
                        className="phone-card-breath-1 cursor-pointer relative bg-[#5014FF] text-white rounded-2xl p-3.5 pr-16 shadow-md transition-transform hover:scale-[1.02]"
                      >
                        <div className="text-[11.5px] font-extrabold leading-snug">Zero Commission Tier</div>
                        <p className="text-[10px] text-white/85 mt-1 leading-relaxed">
                          Keep 100% of UPI & IMPS collections under flat monthly billing.
                        </p>
                        <div className="mt-2 inline-block font-mono text-[9px] bg-white/20 px-2 py-0.5 rounded-full">
                          ₹0.00 Gateway Tax
                        </div>
                        <svg className="phone-mascot-animate absolute right-2 bottom-0 w-14 h-16" viewBox="0 0 64 74" fill="none" aria-hidden="true">
                          <path d="M22 74V46c0-4 3-7 7-7h14c4 0 7 3 7 7v28H22z" fill="#FF85A1"/>
                          <rect x="21" y="14" width="8" height="28" rx="4" fill="#FF85A1" stroke="#2D088A" strokeWidth="1.5"/>
                          <rect x="43" y="18" width="8" height="25" rx="4" fill="#FF85A1" stroke="#2D088A" strokeWidth="1.5"/>
                          <rect x="29" y="30" width="7" height="14" rx="3.5" fill="#F06A8B" stroke="#2D088A" strokeWidth="1.5"/>
                          <rect x="36" y="31" width="7" height="14" rx="3.5" fill="#F06A8B" stroke="#2D088A" strokeWidth="1.5"/>
                          <path d="M15 39c0-3 3-5 6-5h11c3 0 5 2 5 5s-2 5-5 5H21c-3 0-6-2-6-5z" fill="#FF9BB3" stroke="#2D088A" strokeWidth="1.5"/>
                        </svg>
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-[9px] font-bold uppercase tracking-wider theme-text-primary mb-1 flex items-center gap-1">
                        <span>MULTI-RAIL ENGINE</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                      <div
                        id="yum-card-mint"
                        onClick={() => toggleYumHighlight('mint')}
                        className="phone-card-breath-2 cursor-pointer relative bg-[#6BF5BC] text-[#0E0A52] rounded-2xl p-3.5 pr-16 shadow-xs transition-transform hover:scale-[1.02]"
                      >
                        <div className="text-[11.5px] font-extrabold leading-snug">Native UPI, IMPS & Crypto</div>
                        <p className="text-[10px] text-[#0E0A52]/80 mt-1 leading-relaxed">
                          Instant Indian rails live today + planned crypto capabilities.
                        </p>
                        <div className="mt-2 inline-block font-mono text-[9px] bg-[#0E0A52]/10 px-2 py-0.5 rounded-full font-bold">
                          Active + Roadmap
                        </div>
                        <svg className="phone-mascot-animate absolute right-2.5 bottom-1.5 w-12 h-12" style={{ animationDelay: '0.8s' }} viewBox="0 0 52 52" fill="none" aria-hidden="true">
                          <circle cx="26" cy="28" r="18" fill="#8B5CF6" stroke="#0E0A52" strokeWidth="1.8"/>
                          <circle cx="20" cy="25" r="2.5" fill="#FFFFFF"/>
                          <circle cx="20" cy="25" r="1.2" fill="#0E0A52"/>
                          <circle cx="32" cy="25" r="2.5" fill="#FFFFFF"/>
                          <circle cx="32" cy="25" r="1.2" fill="#0E0A52"/>
                          <path d="M21 33c2.5 2.5 7.5 2.5 10 0" stroke="#0E0A52" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="border-t theme-border pt-2 px-4 theme-bg-elevated">
                    <div className="flex items-center justify-between theme-text-muted">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                      <svg className="w-4 h-4 theme-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <div className="ios-home-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* F. "GET YOU A GATEWAY THAT SETTLES FAST" (3D PHONE 4 + COPY)        */}
    {/* =================================================================== */}
    <section id="settles-fast" className="theme-bg-secondary bg-arch-grid py-12 sm:py-28 border-b theme-border transition-colors">
      <div className="max-w-[1060px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Sculpted 3D iPhone 4 (Flame & Ember Telemetry Screen) */}
          <div className="hidden md:flex md:col-span-6 justify-center">
            <div className="clay-iphone clay-float" style={{ animationDelay: '2.6s' }} data-tilt-phone>
              <div className="clay-side-silent"></div>
              <div className="clay-side-vol-up"></div>
              <div className="clay-side-vol-down"></div>
              <div className="clay-side-power"></div>

              <div className="clay-screen relative">
                <div className="clay-notch">
                  <div className="clay-speaker"></div>
                  <div className="clay-camera"></div>
                </div>

                <div
                  className="relative flex-1 flex flex-col justify-between overflow-hidden"
                  style={{ background: 'linear-gradient(175deg, #FF3D00 0%, #FF6D00 48%, #FFB700 100%)' }}
                >
                  <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-45" viewBox="0 0 300 600" preserveAspectRatio="none" fill="none">
                    <path className="phone-flame-back" d="M-20 600C20 470 80 520 110 380c30 90 90 30 120-60 25 110 70 140 90 280H-20z" fill="#FF1E00"/>
                    <path className="phone-flame-front" d="M0 600c40-90 95-40 135-160 35 70 85 40 115-40 20 85 50 110 60 200H0z" fill="#FFD600"/>
                  </svg>

                  {/* Top Bar Over Flame Canvas */}
                  <div className="relative z-10 pt-2 px-5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor"><rect x="1" y="8" width="2" height="4" rx="0.5"/><rect x="5" y="6" width="2" height="6" rx="0.5"/><rect x="9" y="3" width="2" height="9" rx="0.5"/><rect x="13" y="1" width="2" height="11" rx="0.5"/></svg>
                        <svg className="w-4 h-2.5" viewBox="0 0 20 10" fill="currentColor"><rect x="1" y="1" width="15" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="3" width="11" height="4" rx="1"/></svg>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-xs">
                        <MyMobPayLogoMark className="w-4 h-4 object-contain" id="badge-3" />
                        <span className="font-extrabold text-[11px] text-[#090A10]">MyMob<span className="text-[#0F2BFF]">Pay</span></span>
                      </div>
                      <span className="phone-pill-pulse bg-[#4615FF] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                        <span>Webhook Live</span>
                      </span>
                    </div>
                  </div>

                  {/* Floating Telemetry Cards */}
                  <div id="flame-feed" className="relative z-10 px-3.5 py-2 space-y-2.5 overflow-y-auto no-scrollbar text-[10.5px]">
                    <div className="bg-white/95 rounded-2xl p-3 shadow-md text-[#090A10] max-w-[90%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded bg-[#FFF0ED] text-[#FF3D00] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 1 1-8 0c0-1.5.5-3 1.5-4.5C9.5 9 11 10 12 10c0-3-.5-5.5 0-8z"/></svg>
                        </span>
                        <span className="font-mono text-[9px] font-bold uppercase text-[#FF3D00]">0% COMMISSION</span>
                      </div>
                      <div className="font-semibold leading-snug text-[#090A10]">
                        Subscription active: <strong>100% of UPI & IMPS collections</strong> settled with zero percentage cut.
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-[#4615FF] text-white font-semibold px-3 py-1.5 rounded-2xl rounded-tr-xs shadow-xs">
                        Fire live webhook
                      </div>
                    </div>

                    <div className="bg-white/95 rounded-2xl p-2.5 shadow-md text-[#090A10] max-w-[88%]">
                      <span className="font-mono text-[9.5px] font-bold text-[#0F2BFF]">POST /api/v1/webhooks/payment</span> — <strong>200 OK</strong> verified.
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={fireFlameWebhook}
                        className="bg-[#4615FF] hover:bg-[#3409D6] text-white font-bold px-3.5 py-1.5 rounded-full shadow-md inline-flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <span>Trigger test webhook</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Status Strip */}
                  <div className="relative z-10 theme-bg-elevated pt-2 px-4">
                    <div className="mb-1.5 px-3 py-1.5 rounded-full theme-bg-well text-[9.5px] theme-text-muted flex items-center justify-between">
                      <span id="flame-status-line">Webhook listener ready (200 OK)</span>
                      <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    </div>
                    <div className="ios-home-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Block */}
          <div className="md:col-span-6 flex justify-center md:justify-start">
            <div className="max-w-[390px]">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
                INSTANT TELEMETRY
              </div>
              <h2 className="headline-anton text-[40px] sm:text-[48px] mt-1.5">
                GET YOU A GATEWAY<br />
                THAT SETTLES FAST
              </h2>
              <p className="mt-3.5 text-[14.5px] theme-text-secondary leading-[1.65]">
                Monitor real-time UPI and IMPS collections from a unified merchant dashboard with instant signed webhook notifications.
              </p>
              <button
                type="button"
                onClick={fireFlameWebhook}
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold theme-link hover:underline"
              >
                <span>Trigger a live test webhook</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* G. CLEAN 2% VS 0% COMMISSION CALCULATOR & MERCHANT WORKFLOWS        */}
    {/* =================================================================== */}
    <section id="gateway-comparison" className="theme-bg-primary py-12 sm:py-28 border-b theme-border transition-colors">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-8">
        <div className="text-center max-w-[640px] mx-auto">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
            0% COMMISSION MATHEMATICS
          </div>
          <h2 className="headline-anton text-[38px] sm:text-[50px] mt-2">
            MYMOBPAY VS. 2%<br />
            GATEWAYS
          </h2>
          <p className="mt-3 text-[14.5px] sm:text-[15.5px] theme-text-secondary leading-relaxed">
            Drag the monthly volume slider to compare a standard 2% transaction fee against MyMobPay&apos;s 0% commission subscription model.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 7 Cols: Clean Exact 2% vs 0% Volume Slider Card */}
          <div className="lg:col-span-7 rounded-2xl theme-bg-elevated border theme-border theme-card-shadow p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b theme-border">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider theme-text-muted">
                    MONTHLY MERCHANT VOLUME
                  </div>
                  <div id="comp-vol-display" className="tabular-nums-stat text-4xl sm:text-5xl theme-text-primary mt-1">
                    ₹5,00,000
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                    ANNUAL SAVINGS KEPT
                  </div>
                  <div id="comp-annual-saved" className="tabular-nums-stat text-3xl sm:text-4xl text-[#10B981] mt-1">
                    ₹1,20,000 / YR
                  </div>
                </div>
              </div>

              {/* Flat Solid Slider Track */}
              <div className="my-6">
                <input
                  id="comp-vol-slider"
                  type="range"
                  min="50000"
                  max="5000000"
                  step="50000"
                  value="500000"
                  onInput={(e) => updateComparisonSlider(e.target.value)} onChange={(e) => updateComparisonSlider(e.target.value)}
                  className="mmp-slider"
                  aria-label="Monthly Payment Volume"
                />
                <div className="mt-2.5 flex justify-between font-mono text-[10.5px] theme-text-muted">
                  <span>₹50K/mo</span>
                  <span>₹10L/mo</span>
                  <span>₹25L/mo</span>
                  <span>₹50L/mo</span>
                </div>
              </div>

              {/* 2 Side-by-Side Comparison Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 theme-bg-well border theme-border">
                  <div className="font-mono text-[10px] font-bold uppercase text-[#DC2626]">
                    2% GATEWAY FEE CUT
                  </div>
                  <div id="comp-legacy-loss" className="tabular-nums-stat text-3xl text-[#DC2626] mt-1.5">
                    -₹10,000 / MO
                  </div>
                  <div className="mt-3 pt-2.5 border-t theme-border flex items-center justify-between text-xs font-semibold">
                    <span className="theme-text-muted">Net Settled:</span>
                    <span id="comp-legacy-net" className="font-mono theme-text-primary">₹4,90,000</span>
                  </div>
                </div>

                <div className="rounded-xl p-4 theme-bg-well border-2 border-[#0F2BFF]">
                  <div className="flex items-center gap-1.5">
                    <MyMobPayLogoMark className="w-4 h-4 object-contain" id="badge-4" />
                    <span className="font-mono text-[10px] font-bold uppercase theme-link">
                      MYMOBPAY (0% COMMISSION)
                    </span>
                  </div>
                  <div className="tabular-nums-stat text-3xl text-[#10B981] mt-1.5">
                    ₹0 / MO FEE
                  </div>
                  <div className="mt-3 pt-2.5 border-t theme-border flex items-center justify-between text-xs font-semibold">
                    <span className="theme-text-muted">Net Settled:</span>
                    <span id="comp-mymob-net" className="font-mono text-[#10B981]">₹5,00,000 (100%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flat Solid Bar Comparison */}
            <div className="mt-6 pt-5 border-t theme-border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="theme-text-primary">MyMobPay Net Payout (100% Kept)</span>
                <span id="bar-label-legacy" className="font-mono text-[#10B981]">+₹10,000/mo kept</span>
              </div>
              <div className="w-full h-2.5 rounded-full theme-bg-well overflow-hidden">
                <div className="h-full bg-[#0F2BFF] rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Clean Factual Platform Summary */}
          <div className="lg:col-span-5 rounded-2xl theme-bg-elevated border theme-border theme-card-shadow p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider theme-link">
                PLATFORM OVERVIEW
              </div>
              <h3 className="headline-anton text-3xl mt-1">
                BUILT FOR 0%<br />
                COMMISSION
              </h3>

              <div className="mt-5 divide-y theme-border text-[13px]">
                <div className="py-3.5 flex items-center justify-between gap-3">
                  <span className="font-semibold theme-text-secondary">Transaction Commission</span>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#10B981]/15 text-[#10B981]">0% Fee</span>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-3">
                  <span className="font-semibold theme-text-secondary">Billing Model</span>
                  <span className="font-mono text-xs font-bold theme-text-primary">Flat Subscription</span>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-3">
                  <span className="font-semibold theme-text-secondary">Active Payment Rails</span>
                  <span className="font-mono text-xs font-bold theme-text-primary">UPI & IMPS</span>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-3">
                  <span className="font-semibold theme-text-secondary">Upcoming Rails</span>
                  <span className="font-mono text-xs font-bold theme-link">Crypto (Roadmap)</span>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-3">
                  <span className="font-semibold theme-text-secondary">Developer Integration</span>
                  <span className="font-mono text-xs font-bold theme-text-primary">REST API & Webhooks</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="mt-6 w-full py-3 rounded-lg bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold transition-colors"
            >
              Get Started with 0% Commission
            </button>
          </div>
        </div>

        {/* Restored "IMAGINE REVIEWING YOUR GATEWAY LIKE THIS" 5-Card Merchant Workflows Section */}
        <div className="mt-20 pt-16 border-t theme-border text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-text-muted">
            MERCHANT WORKFLOWS (ILLUSTRATIVE)
          </div>
          <h3 className="headline-anton text-[34px] sm:text-[44px] mt-1.5">
            IMAGINE REVIEWING YOUR<br />
            GATEWAY LIKE THIS
          </h3>
          <p className="mt-2.5 text-[13.5px] theme-text-secondary max-w-[460px] mx-auto">
            See how Indian SaaS builders and digital product merchants simplify payment operations with flat subscription pricing.
          </p>

          {/* 5-Card Horizontal Row */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
            <div className="theme-bg-elevated rounded-xl p-5 border theme-border theme-card-shadow flex flex-col justify-between min-h-[168px]">
              <p className="text-[11px] leading-[1.55] theme-text-secondary">
                “Switched our SaaS checkout to flat subscription billing. Keeping 100% of every UPI payment changed our unit economics overnight.”
              </p>
              <div className="mt-4 pt-2.5 border-t theme-border flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="text-[10px] font-bold theme-text-muted">SaaS Subscription Flow</span>
              </div>
            </div>

            <div className="theme-bg-elevated rounded-xl p-5 border theme-border theme-card-shadow flex flex-col justify-between min-h-[168px]">
              <p className="text-[11px] leading-[1.55] theme-text-secondary">
                “Dynamic UPI QR and IMPS collection in one clean dashboard without paying 2% on high-ticket annual invoices.”
              </p>
              <div className="mt-4 pt-2.5 border-t theme-border flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="text-[10px] font-bold theme-text-muted">High-Ticket IMPS Flow</span>
              </div>
            </div>

            <div className="theme-bg-elevated rounded-xl p-5 border theme-border theme-card-shadow flex flex-col justify-between min-h-[168px]">
              <p className="text-[11px] leading-[1.55] theme-text-secondary">
                “Integration took a single afternoon. Create session, render QR or intent link, and verify the signed webhook.”
              </p>
              <div className="mt-4 pt-2.5 border-t theme-border flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="text-[10px] font-bold theme-text-muted">REST API Integration</span>
              </div>
            </div>

            <div className="theme-bg-elevated rounded-xl p-5 border theme-border theme-card-shadow flex flex-col justify-between min-h-[168px]">
              <p className="text-[11px] leading-[1.55] theme-text-secondary">
                “Predictable monthly software cost instead of unpredictable percentage taxes every time we run a product launch.”
              </p>
              <div className="mt-4 pt-2.5 border-t theme-border flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="text-[10px] font-bold theme-text-muted">Digital Creator Launch</span>
              </div>
            </div>

            <div className="theme-bg-elevated rounded-xl p-5 border theme-border theme-card-shadow flex flex-col justify-between min-h-[168px] sm:col-span-2 lg:col-span-1">
              <p className="text-[11px] leading-[1.55] theme-text-secondary">
                “Clean transaction ledger with instant status tracking and planned crypto settlement on the roadmap.”
              </p>
              <div className="mt-4 pt-2.5 border-t theme-border flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="text-[10px] font-bold theme-text-muted">Unified Ledger View</span>
              </div>
            </div>
          </div>

          {/* Capability Wordmark Bar (Uniform Muted Lavender-Slate Display Typography & Exact 2-Row Position) */}
          <div className="mt-12 max-w-[760px] mx-auto flex flex-col items-center justify-center gap-y-5 select-none text-[#BDC3DC] dark:text-[#475569]">
            <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-3">
              <span className="font-display text-[20px] sm:text-[23px] tracking-[0.04em] uppercase">
                UPI INTENT
              </span>
              <span className="font-display text-[20px] sm:text-[23px] tracking-[0.04em] uppercase">
                IMPS DIRECT
              </span>
              <span className="font-display text-[20px] sm:text-[23px] tracking-[0.04em] uppercase">
                0% COMMISSION
              </span>
              <span className="font-display text-[20px] sm:text-[23px] tracking-[0.04em] uppercase">
                SIGNED WEBHOOKS
              </span>
            </div>
            <div className="flex items-center justify-center">
              <span className="font-display text-[20px] sm:text-[23px] tracking-[0.04em] uppercase">
                CRYPTO ROADMAP
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* H. SUBSCRIPTION PRICING & POSTER CARDS (#pick-plan)                 */}
    {/* =================================================================== */}
    <section id="pick-plan" className="theme-bg-secondary py-12 sm:py-28 border-b theme-border transition-colors">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 text-center">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
          SUBSCRIPTION-BASED PRICING
        </div>
        <h2 className="headline-anton text-[38px] sm:text-[50px] mt-2">
          KEEP 100% OF YOUR REVENUE.<br />
          PICK YOUR PLAN.
        </h2>
        <p className="mt-2.5 text-[14px] theme-text-secondary">
          Select your monthly payment volume to see how much 2% gateway commission you save:
        </p>

        {/* Interactive Monthly Volume Pill Bar */}
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 theme-bg-elevated p-1.5 rounded-full border theme-border">
          <button
            type="button"
            onClick={(e) => selectPlanVolume(100000, e.currentTarget)}
            className="vol-pill px-4 py-1.5 rounded-full text-xs font-bold theme-text-secondary hover:theme-text-primary transition-colors"
          >
            ₹1L/mo
          </button>
          <button
            type="button"
            onClick={(e) => selectPlanVolume(500000, e.currentTarget)}
            className="vol-pill px-4 py-1.5 rounded-full text-xs font-bold bg-[#0F2BFF] text-white shadow-2xs transition-colors"
          >
            ₹5L/mo
          </button>
          <button
            type="button"
            onClick={(e) => selectPlanVolume(1500000, e.currentTarget)}
            className="vol-pill px-4 py-1.5 rounded-full text-xs font-bold theme-text-secondary hover:theme-text-primary transition-colors"
          >
            ₹15L/mo
          </button>
          <button
            type="button"
            onClick={(e) => selectPlanVolume(2500000, e.currentTarget)}
            className="vol-pill px-4 py-1.5 rounded-full text-xs font-bold theme-text-secondary hover:theme-text-primary transition-colors"
          >
            ₹25L/mo
          </button>
        </div>

        <div id="plan-savings-callout" className="mt-3 font-mono text-xs font-semibold theme-link">
          At ₹5,00,000/mo: Save ₹10,000/mo in 2% gateway fees • MyMobPay Commission: ₹0.00
        </div>

        {/* 3 Iconic Square Graphic Poster Cards (330px x 330px) */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          {/* Square Card 1: Acid Lime (#D8FF66) + 3D Stepped Magenta Bars */}
          <div
            onClick={() => openAuthModal('signup')}
            className="cursor-pointer group relative w-full max-w-[330px] h-[330px] bg-[#D8FF66] rounded-xl overflow-hidden p-6 flex flex-col justify-between text-left shadow-xs hover:-translate-y-1.5 transition-transform"
          >
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#090A10]/70">
                STARTER SUBSCRIPTION • 0% COMMISSION
              </div>
              <div className="mt-1 font-bold text-sm text-[#090A10]">
                Direct UPI QR & IMPS Links
              </div>
            </div>

            <svg className="absolute bottom-0 left-0 w-full h-56" viewBox="0 0 330 220" fill="none" aria-hidden="true">
              <polygon points="38,220 38,162 84,162 84,220" fill="#E03E96" stroke="#090A10" strokeWidth="1.5"/>
              <polygon points="38,162 52,150 98,150 84,162" fill="#F472B6" stroke="#090A10" strokeWidth="1.5"/>
              <polygon points="84,162 98,150 98,220 84,220" fill="#090A10"/>
              <text x="46" y="182" fill="#090A10" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700">0% FEE</text>

              <polygon points="116,220 116,112 166,112 166,220" fill="#E03E96" stroke="#090A10" strokeWidth="1.5"/>
              <polygon points="116,112 132,98 182,98 166,112" fill="#F472B6" stroke="#090A10" strokeWidth="1.5"/>
              <polygon points="166,112 182,98 182,220 166,220" fill="#090A10"/>
              <text x="124" y="134" fill="#090A10" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700">UPI+IMPS</text>

              <polygon points="198,220 198,58 252,58 252,220" fill="#E03E96" stroke="#090A10" strokeWidth="1.5"/>
              <polygon points="198,58 216,42 270,42 252,58" fill="#F472B6" stroke="#090A10" strokeWidth="1.5"/>
              <polygon points="252,58 270,42 270,220 252,220" fill="#090A10"/>
              <text x="206" y="82" fill="#090A10" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700">100% KEPT</text>
            </svg>
          </div>

          {/* Square Card 2: Royal Cobalt (#0B28D8) + Centered Crisp White Floating Modal */}
          <div className="relative w-full max-w-[330px] h-[330px] bg-[#0B28D8] rounded-xl overflow-hidden p-6 flex items-center justify-center shadow-xs hover:-translate-y-1.5 transition-transform">
            <div className="relative z-10 bg-white rounded-xl p-5 w-full max-w-[250px] text-left shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F2F3FB] p-1 flex items-center justify-center">
                    <MyMobPayLogoMark className="w-full h-full object-contain" id="badge-5" />
                  </div>
                  <div>
                    <div className="text-[11.5px] font-extrabold text-[#090A10] flex items-center gap-1">
                      <span>MyMobPay</span>
                      <span className="w-2 h-2 rounded-full bg-[#0EA5E9]"></span>
                    </div>
                    <div className="text-[9.5px] text-[#6E748C]">mymob.tech</div>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-bold bg-[#F2F3FB] text-[#0F2BFF] px-2 py-0.5 rounded">
                  GROWTH
                </span>
              </div>

              <p className="mt-3 text-[11.5px] text-[#222533] leading-relaxed">
                Growth Plan — <strong>0% commission</strong> UPI & IMPS collections + real-time webhooks.
              </p>

              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="mt-3.5 w-full py-2 rounded-lg bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-[11px] font-bold text-center transition-colors"
              >
                Explore Growth Plan
              </button>
            </div>
          </div>

          {/* Square Card 3: Solid Deep Crimson/Aubergine (#521828) Poster Card */}
          <div
            onClick={() => openAuthModal('signup')}
            className="cursor-pointer relative w-full max-w-[330px] h-[330px] bg-[#521828] rounded-xl overflow-hidden p-6 flex flex-col items-center justify-center text-center shadow-xs hover:-translate-y-1.5 transition-transform"
          >
            <div className="font-mono text-[9.5px] uppercase tracking-widest text-white/75 mb-3">
              SCALE SUBSCRIPTION TIER
            </div>

            <div className="space-y-1.5">
              <div className="inline-block bg-white/15 px-3 py-0.5 text-white font-display text-[24px] leading-none uppercase tracking-wide">
                SCALE VOLUME
              </div><br />
              <div className="inline-block bg-white/15 px-3 py-0.5 text-white font-display text-[24px] leading-none uppercase tracking-wide">
                WITH ZERO
              </div><br />
              <div className="inline-block bg-white/25 px-3 py-0.5 text-[#D8FF66] font-display text-[24px] leading-none uppercase tracking-wide">
                PERCENTAGE
              </div><br />
              <div className="inline-block bg-white/15 px-3 py-0.5 text-white font-display text-[24px] leading-none uppercase tracking-wide">
                GATEWAY TAX
              </div>
            </div>

            <div className="mt-4 text-[11px] font-semibold text-white/85 underline">
              View plans in Merchant Portal
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* I. INTERACTIVE DEVELOPER REST API SANDBOX (#clean-apis)             */}
    {/* =================================================================== */}
    <section id="clean-apis" className="theme-bg-primary py-12 sm:py-28 border-b theme-border transition-colors">
      <div className="max-w-[1060px] mx-auto px-5 sm:px-8">
        <div className="text-center max-w-[640px] mx-auto">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
            DEVELOPER EXPERIENCE
          </div>
          <h2 className="headline-anton text-[38px] sm:text-[50px] mt-2">
            CLEAN, MODERN REST APIS
          </h2>
          <p className="mt-3 text-[14.5px] theme-text-secondary">
            Integrate MyMobPay with standard REST endpoints, JSON payloads, and signed webhooks.
          </p>
        </div>

        {/* Interactive Dual-Pane API Sandbox */}
        <div className="mt-10 rounded-2xl bg-[#0D111A] border border-[#232D42] shadow-2xl overflow-hidden text-white">
          <div className="px-4 sm:px-6 py-3 bg-[#141B29] border-b border-[#232D42] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="sb-tab-create"
                onClick={() => switchSandboxTab('create')}
                className="px-3 py-1.5 rounded-md font-mono text-[11px] font-bold bg-[#0F2BFF] text-white"
              >
                POST /v1/payments/create
              </button>
              <button
                type="button"
                id="sb-tab-status"
                onClick={() => switchSandboxTab('status')}
                className="px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold bg-white/5 text-white/70 hover:text-white"
              >
                GET /v1/payments/{'{id}'}
              </button>
              <button
                type="button"
                id="sb-tab-webhook"
                onClick={() => switchSandboxTab('webhook')}
                className="px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold bg-white/5 text-white/70 hover:text-white"
              >
                Webhook HMAC Verify
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="sb-copy-btn"
                onClick={copySandboxCode}
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 font-mono text-[11px] font-bold text-white inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy JSON</span>
              </button>
              <button
                type="button"
                onClick={runSandboxRequest}
                className="px-3.5 py-1.5 rounded-md bg-[#10B981] hover:bg-[#059669] font-mono text-[11px] font-bold text-[#090A10] inline-flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Run Live Request</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#232D42]">
            <div className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-2">REQUEST PAYLOAD</div>
              <pre id="sb-req-code" className="font-mono text-xs text-[#E2E8F0] overflow-x-auto leading-relaxed"></pre>
            </div>
            <div className="p-5 bg-[#090C12]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">LIVE RESPONSE</span>
                <span id="sb-res-badge" className="font-mono text-[10px] font-bold text-[#10B981]">200 OK</span>
              </div>
              <pre id="sb-res-code" className="font-mono text-xs text-[#6EE7B7] overflow-x-auto leading-relaxed"></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* J. ROYAL INDIGO SECURITY BAND (#211D8A)                             */}
    {/* =================================================================== */}
    <section className="bg-[#211D8A] py-20 sm:py-24 text-white">
      <div className="max-w-[1040px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* Left Column: Flat Editorial Security Studio Frame */}
          <div className="md:col-span-6 flex justify-center">
            <div className="w-full max-w-[380px] rounded-2xl bg-[#EAE6DF] p-5 flex flex-col justify-between text-[#090A10] shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#090A10]/15 pb-3">
                <div className="flex items-center gap-1.5">
                  <MyMobPayLogoMark className="w-5 h-5 object-contain" id="badge-6" />
                  <span className="font-extrabold text-xs text-[#090A10]">MyMobPay Security</span>
                </div>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider bg-[#211D8A] text-white px-2.5 py-1 rounded">
                  VERIFIED RAIL
                </span>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-[#090A10]/10">
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <button type="button" id="sec-pill-tls" onClick={() => switchSecTab('tls')} className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#0F2BFF] text-white">HTTPS / TLS</button>
                  <button type="button" id="sec-pill-hmac" onClick={() => switchSecTab('hmac')} className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#F2F3FB] text-[#222533]">Signed Webhooks</button>
                  <button type="button" id="sec-pill-iso" onClick={() => switchSecTab('iso')} className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#F2F3FB] text-[#222533]">Isolation</button>
                </div>
                <div id="sec-card-heading" className="font-bold text-xs text-[#090A10]">
                  End-to-End HTTPS / TLS Encryption
                </div>
                <p id="sec-card-copy" className="mt-1 text-[11.5px] text-[#222533] leading-relaxed">
                  All checkout sessions, merchant API keys, and webhook callbacks transit over encrypted HTTPS/TLS channels.
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-[#090A10]/80">
                <span>MERCHANT WORKSPACE PROTECTION</span>
                <span className="text-[#059669]">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Security Copy */}
          <div className="md:col-span-6">
            <h2 className="headline-anton-white text-[40px] sm:text-[48px]">
              YOUR SECURITY,<br />
              OUR PRIORITY
            </h2>
            <p className="mt-4 text-[14.5px] text-white/85 leading-[1.65] max-w-[400px]">
              Every MyMobPay session runs over encrypted HTTPS/TLS channels with merchant workspace isolation and signed webhook payloads.
            </p>
            <button
              type="button"
              onClick={() => openApiDrawer('webhook')}
              className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-[#D8FF66] hover:underline"
            >
              <span>Inspect webhook verification spec</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* K. MERCHANT FAQ ACCORDION (#faq-section)                            */}
    {/* =================================================================== */}
    <section id="faq-section" className="theme-bg-secondary py-12 sm:py-24 border-b theme-border transition-colors">
      <div className="max-w-[820px] mx-auto px-5 sm:px-8">
        <div className="text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] theme-link">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="headline-anton text-[38px] sm:text-[48px] mt-2">
            QUESTIONS? ANSWERED.
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {/* FAQ 1 */}
          <div className="rounded-2xl theme-bg-elevated border theme-border overflow-hidden">
            <button type="button" onClick={() => toggleFaq(1)} className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm theme-text-primary">
              <span>How does MyMobPay offer 0% transaction commission?</span>
              <svg id="faq-icon-1" className="w-4 h-4 shrink-0 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div id="faq-body-1" className="px-5 pb-4 text-xs sm:text-[13.5px] theme-text-secondary leading-relaxed">
              Instead of deducting a percentage fee from every transaction, MyMobPay operates on a flat subscription model so merchants keep 100% of their UPI and IMPS collections under active plans.
            </div>
          </div>

          {/* FAQ 2 */}
          <div className="rounded-2xl theme-bg-elevated border theme-border overflow-hidden">
            <button type="button" onClick={() => toggleFaq(2)} className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm theme-text-primary">
              <span>Which payment rails are supported?</span>
              <svg id="faq-icon-2" className="w-4 h-4 shrink-0 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div id="faq-body-2" className="hidden px-5 pb-4 text-xs sm:text-[13.5px] theme-text-secondary leading-relaxed">
              MyMobPay supports UPI and IMPS payment collections today, with Crypto payment support planned on the product roadmap.
            </div>
          </div>

          {/* FAQ 3 */}
          <div className="rounded-2xl theme-bg-elevated border theme-border overflow-hidden">
            <button type="button" onClick={() => toggleFaq(3)} className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm theme-text-primary">
              <span>How do I integrate MyMobPay with my website or app?</span>
              <svg id="faq-icon-3" className="w-4 h-4 shrink-0 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div id="faq-body-3" className="hidden px-5 pb-4 text-xs sm:text-[13.5px] theme-text-secondary leading-relaxed">
              You can create payment sessions and verify payment statuses using the MyMobPay REST API endpoints and receive real-time signed webhook callbacks on your server.
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* L. FINAL LAUNCH CTA SECTION                                         */}
    {/* =================================================================== */}
    <section className="theme-bg-primary py-20 sm:py-24 text-center">
      <div className="max-w-[760px] mx-auto px-5">
        <div className="w-16 h-16 rounded-2xl theme-bg-elevated border theme-border shadow-md mx-auto mb-5 p-2 flex items-center justify-center">
          <MyMobPayLogoMark className="w-full h-full object-contain" id="badge-7" />
        </div>
        <h2 className="headline-anton text-[42px] sm:text-[56px]">
          READY TO KEEP 100%?<br />
          LAUNCH MYMOBPAY.
        </h2>
        <p className="mt-3 text-sm theme-text-secondary">
          0% transaction commission under active subscription plans.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="btn-editorial bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-[13px] font-bold px-8 py-3.5 rounded-lg"
          >
            Get started free
          </button>
          <button
            type="button"
            onClick={() => openApiDrawer('create')}
            className="btn-editorial theme-bg-elevated border theme-border theme-text-primary text-[13px] font-bold px-6 py-3.5 rounded-lg"
          >
            Read JSON API Docs
          </button>
        </div>
      </div>
    </section>
  </main>

  {/* ===================================================================== */}
  {/* M. CLEAN 3-COLUMN EDITORIAL FOOTER                                    */}
  {/* ===================================================================== */}
  <footer className="theme-bg-secondary pt-14 pb-12 text-[12px] theme-text-muted border-t theme-border">
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-10 border-b theme-border">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 flex items-center justify-center shrink-0">
            <MyMobPayLogoMark className="w-full h-full object-contain" id="badge-8" />
          </span>
          <span className="font-sans font-extrabold text-lg theme-text-primary">
            MyMob<span className="text-[#0F2BFF]">Pay</span>
          </span>
        </div>
        <div className="font-mono text-[11px] theme-text-muted">
          DIRECT-TO-BANK UPI & IMPS GATEWAY • MYMOB.TECH
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-10">
        <div>
          <h3 className="font-bold theme-text-primary mb-3">Product</h3>
          <ul className="space-y-2">
            <li><a href="#own-your-money" className="hover:underline">Zero-Commission Model</a></li>
            <li><a href="#fees-drag" className="hover:underline">Direct UPI & IMPS Rails</a></li>
            <li><a href="#gateway-comparison" className="hover:underline">0% vs 2% Savings Calculator</a></li>
            <li><a href="#pick-plan" className="hover:underline">Subscription Plans</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold theme-text-primary mb-3">Developers</h3>
          <ul className="space-y-2">
            <li><button type="button" onClick={() => openApiDrawer('create')} className="hover:underline">REST API Reference</button></li>
            <li><button type="button" onClick={() => openApiDrawer('webhook')} className="hover:underline">Signed HMAC Webhooks</button></li>
            <li><button type="button" onClick={() => openApiDrawer('status')} className="hover:underline">UTR Verification Spec</button></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold theme-text-primary mb-3">Merchant Portal</h3>
          <ul className="space-y-2">
            <li><a href="https://mymob.tech/login" target="_blank" rel="noopener noreferrer" className="hover:underline">Merchant Login (/login)</a></li>
            <li><a href="https://mymob.tech/signup" target="_blank" rel="noopener noreferrer" className="hover:underline">Get Started (/signup)</a></li>
            <li><a href="https://mymob.tech/dashboard" target="_blank" rel="noopener noreferrer" className="hover:underline">Dashboard (/dashboard)</a></li>
          </ul>
        </div>
      </div>

      <div className="pt-6 border-t theme-border text-center text-[11px] theme-text-muted">
        © 2026 MyMobPay (mymob.tech). All rights reserved.
      </div>
    </div>
  </footer>

  {/* ===================================================================== */}
  {/* STICKY MOBILE BOTTOM CONVERSION BAR                                   */}
  {/* ===================================================================== */}
  <div className="md:hidden fixed bottom-0 inset-x-0 z-30 theme-bg-elevated border-t theme-border px-4 py-2.5 flex items-center justify-between gap-3 backdrop-blur-md">
    <div className="flex items-center gap-2">
      <MyMobPayLogoMark className="w-5 h-5 object-contain" id="badge-9" />
      <div>
        <div className="text-xs font-extrabold theme-text-primary leading-none">MyMobPay</div>
        <div className="font-mono text-[9.5px] text-[#10B981] mt-0.5">0% Commission • UPI & IMPS</div>
      </div>
    </div>
    <button
      type="button"
      onClick={() => openAuthModal('signup')}
      className="bg-[#0F2BFF] text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0"
    >
      Get Started Free
    </button>
  </div>

  {/* ===================================================================== */}
  {/* DEVELOPER REST API SLIDE-OVER DRAWER                                  */}
  {/* ===================================================================== */}
  <div
    id="api-drawer-backdrop"
    className="hidden fixed inset-0 z-50 bg-[#090A10]/60 backdrop-blur-xs flex justify-end"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-lg bg-[#0D1017] text-white h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <MyMobPayLogoMark className="w-6 h-6 object-contain" id="badge-10" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#D8FF66]">
              REST API SPECIFICATION
            </span>
          </div>
          <button type="button" onClick={closeApiDrawer} className="text-white/70 hover:text-white p-1" aria-label="Close drawer">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" id="drawer-tab-create" onClick={() => switchDrawerEndpoint('create')} className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#0F2BFF] text-white">POST /v1/payments/create</button>
          <button type="button" id="drawer-tab-status" onClick={() => switchDrawerEndpoint('status')} className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-white/10 text-white/80">GET /v1/payments/{'{id}'}</button>
          <button type="button" id="drawer-tab-webhook" onClick={() => switchDrawerEndpoint('webhook')} className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-white/10 text-white/80">Webhook JSON</button>
        </div>

        <div className="mt-4 bg-[#07090E] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span id="drawer-endpoint-label" className="font-mono text-[11px] text-[#94A3B8]">POST https://mymob.tech/api/v1/payments/create</span>
            <button type="button" id="drawer-copy-btn" onClick={copyDrawerCode} className="font-mono text-[11px] font-bold text-[#D8FF66] hover:underline">Copy JSON</button>
          </div>
          <pre id="drawer-code-pre" className="font-mono text-xs text-[#E2E8F0] overflow-x-auto leading-relaxed"></pre>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
        <span>0% Commission Subscription API</span>
        <button type="button" onClick={() => { closeApiDrawer(); openAuthModal('signup'); }} className="bg-[#0F2BFF] text-white font-bold px-4 py-2 rounded">
          Get API Keys
        </button>
      </div>
    </div>
  </div>

  {/* ===================================================================== */}
  {/* MERCHANT AUTH MODAL                                                   */}
  {/* ===================================================================== */}
  <div
    id="auth-modal"
    className="hidden fixed inset-0 z-50 bg-[#090A10]/60 backdrop-blur-xs flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="theme-bg-elevated rounded-2xl max-w-md w-full p-6 shadow-2xl border theme-border">
      <div className="flex items-center justify-between pb-3 border-b theme-border">
        <div className="flex items-center gap-2">
          <MyMobPayLogoMark className="w-6 h-6 object-contain" id="badge-11" />
          <span id="auth-modal-title" className="headline-anton text-2xl">GET STARTED FREE</span>
        </div>
        <button type="button" onClick={closeAuthModal} className="theme-text-muted hover:theme-text-primary p-1" aria-label="Close modal">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="mt-4 space-y-3.5">
        <a
          href="https://mymob.tech/login"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-lg border theme-border hover:border-[#0F2BFF] text-xs font-bold theme-text-primary flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
          </svg>
          <span>Continue with Google OAuth</span>
        </a>

        <form onSubmit={(e) => { e.preventDefault(); handleAuthSubmit(); }} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold theme-text-secondary mb-1">Merchant Work Email</label>
            <input
              type="email"
              required
              placeholder="founder@saas.in"
              className="w-full px-3 py-2 text-xs rounded-lg theme-bg-well border theme-border theme-text-primary focus:outline-none focus:border-[#0F2BFF]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold theme-text-secondary mb-1">Password or 6-Digit OTP</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-lg theme-bg-well border theme-border theme-text-primary focus:outline-none focus:border-[#0F2BFF]"
            />
          </div>
          <button
            type="submit"
            id="auth-submit-btn"
            className="btn-editorial w-full py-2.5 rounded-lg bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold"
          >
            Continue to Merchant Console
          </button>
        </form>

        <div id="auth-feedback" className="hidden p-3 rounded-lg bg-[#10B981]/15 text-[#10B981] text-xs font-semibold"></div>
      </div>
    </div>
  </div>

  {/* ===================================================================== */}
  {/* APPLICATION JAVASCRIPT                                                */}
  {/* ===================================================================== */}
    </div>
  );
}
