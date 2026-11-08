'use client';

import { useEffect, useState, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   DiwaliOverlay
   • Shows only on Diwali day (Nov 8 2026, adjustable via DIWALI_DATE)
   • Falling diyas / petals, animated candle flames, subtle gold
     banner at the top — all via CSS/SVG, zero extra deps
   • Cleans itself up completely after the day passes
──────────────────────────────────────────────────────────────── */

const DIWALI_DATE = { month: 10, day: 8 }; // JS month = 10 → November

function isDiwaliToday() {
  const now = new Date();
  return now.getMonth() === DIWALI_DATE.month && now.getDate() === DIWALI_DATE.day;
}

/* ── small helpers ── */
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

/* ── Diya SVG (inline, so no img requests) ── */
function DiyaSVG({ size = 28, flameColor = '#fff700' }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* flame */}
      <ellipse cx="14" cy="7" rx="4" ry="8" fill={flameColor} opacity="0.95"/>
      <ellipse cx="14" cy="9" rx="2.2" ry="5" fill="#ffffff" opacity="0.7"/>
      {/* bowl */}
      <path d="M4 16 Q5 13 14 13 Q23 13 24 16 L22 23 Q18 26 14 26 Q10 26 6 23 Z" fill="#c56200"/>
      <path d="M4 16 Q5 13 14 13 Q23 13 24 16" stroke="#e07a00" strokeWidth="1.5" fill="none"/>
      {/* oil shine */}
      <ellipse cx="11" cy="19" rx="3" ry="1.2" fill="rgba(255,200,80,0.25)" transform="rotate(-15 11 19)"/>
    </svg>
  );
}

/* ── Falling particle ── */
function Particle({ type, style }) {
  if (type === 'diya') {
    return (
      <span className="diwali-particle" style={style}>
        <DiyaSVG size={randInt(18, 30)} flameColor={['#fff700','#ff8c00','#ffcc00'][randInt(0,2)]} />
      </span>
    );
  }
  if (type === 'petal') {
    const colors = ['#ff6b00','#ffd700','#ff4500','#ffaa00','#ff1493','#ffc0cb'];
    const color = colors[randInt(0, colors.length - 1)];
    return (
      <span className="diwali-particle" style={{
        ...style,
        width: randInt(8, 14) + 'px',
        height: randInt(14, 22) + 'px',
        background: `radial-gradient(ellipse at top, ${color} 0%, ${color}88 100%)`,
        borderRadius: '50% 50% 50% 0%',
        transform: `rotate(${randInt(-60, 60)}deg)`,
      }} />
    );
  }
  // spark
  const sparkColors = ['#ffd700','#ff8c00','#fff700','#ff6b00'];
  return (
    <span className="diwali-particle" style={{
      ...style,
      width: randInt(3, 7) + 'px',
      height: randInt(3, 7) + 'px',
      borderRadius: '50%',
      background: sparkColors[randInt(0, sparkColors.length - 1)],
      boxShadow: `0 0 ${randInt(4,10)}px rgba(255,180,0,0.8)`,
    }} />
  );
}

/* ── Top banner ── */
function DiwaliBanner({ onClose }) {
  return (
    <div className="diwali-banner" aria-label="Happy Diwali">
      <div className="diwali-banner-inner">
        {/* left diyas */}
        <span className="diwali-banner-diya" style={{ animationDelay: '0s' }}>
          <DiyaSVG size={22} />
        </span>
        <span className="diwali-banner-diya" style={{ animationDelay: '0.4s' }}>
          <DiyaSVG size={18} flameColor="#ff8c00" />
        </span>
        <span className="diwali-banner-diya" style={{ animationDelay: '0.8s' }}>
          <DiyaSVG size={22} flameColor="#ffcc00" />
        </span>

        <span className="diwali-banner-text">
          🪔&nbsp;&nbsp;Wishing you a bright &amp; joyful&nbsp;
          <strong>Diwali 2026</strong>
          &nbsp;&nbsp;— Team MyMobPay&nbsp;&nbsp;🪔
        </span>

        {/* right diyas */}
        <span className="diwali-banner-diya" style={{ animationDelay: '0.2s' }}>
          <DiyaSVG size={22} flameColor="#ffcc00" />
        </span>
        <span className="diwali-banner-diya" style={{ animationDelay: '0.6s' }}>
          <DiyaSVG size={18} flameColor="#ff8c00" />
        </span>
        <span className="diwali-banner-diya" style={{ animationDelay: '1s' }}>
          <DiyaSVG size={22} />
        </span>
      </div>

      <button
        className="diwali-banner-close"
        onClick={onClose}
        aria-label="Dismiss Diwali banner"
      >
        ×
      </button>
    </div>
  );
}

/* ── Main overlay component ── */
export default function DiwaliOverlay() {
  const [active, setActive] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [particles, setParticles] = useState([]);
  const raf = useRef(null);
  const ticker = useRef(0);

  useEffect(() => {
    if (!isDiwaliToday()) return;

    // Check if user already dismissed banner this session
    const dismissed = sessionStorage.getItem('diwali_banner_dismissed');
    if (dismissed) setBannerVisible(false);

    // Mark <html> so global CSS selectors work
    document.documentElement.classList.add('diwali-active');
    setActive(true);

    /* spawn particles at an interval */
    const types = ['diya', 'petal', 'petal', 'spark', 'spark', 'spark'];

    const spawn = () => {
      ticker.current += 1;
      // spawn every ~600ms effectively (called every frame, gate by ticker)
      setParticles(prev => {
        const next = prev.filter(p => Date.now() - p.born < p.life);
        if (ticker.current % 36 === 0) { // ~36 frames @ 60fps ≈ 0.6s
          const type = types[randInt(0, types.length - 1)];
          next.push({
            id: Date.now() + Math.random(),
            type,
            born: Date.now(),
            life: rand(5000, 9000),
            left: rand(0, 98),
            delay: rand(0, 0.5),
            duration: rand(5, 9),
            size: type === 'diya' ? randInt(18, 30) : randInt(6, 16),
          });
        }
        // cap particles to keep perf fine
        return next.slice(-40);
      });
      raf.current = requestAnimationFrame(spawn);
    };

    raf.current = requestAnimationFrame(spawn);
    return () => {
      cancelAnimationFrame(raf.current);
      document.documentElement.classList.remove('diwali-active');
    };
  }, []);

  if (!active) return null;

  const handleDismissBanner = () => {
    setBannerVisible(false);
    sessionStorage.setItem('diwali_banner_dismissed', '1');
  };

  return (
    <>
      {/* Inject styles once */}
      <style>{`
        /* ── Banner ─────────────────────────────── */
        .diwali-banner {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 99999;
          background: linear-gradient(90deg,
            #1a0800 0%,
            #3d1200 15%,
            #6b2800 30%,
            #8b3e00 50%,
            #6b2800 70%,
            #3d1200 85%,
            #1a0800 100%
          );
          border-bottom: 1px solid rgba(255, 180, 50, 0.35);
          padding: 7px 48px 7px 16px;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 20px rgba(200,80,0,0.35), 0 1px 0 rgba(255,215,0,0.15) inset;
          animation: diwali-banner-slide-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes diwali-banner-slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .diwali-banner-inner {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .diwali-banner-text {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.3px;
          background: linear-gradient(to right, #ffeaa0, #ffd700, #ff8c00, #ffd700, #ffeaa0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .diwali-banner-text strong {
          background: linear-gradient(to right, #ffffff, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .diwali-banner-diya {
          display: inline-flex;
          animation: diwali-flame-pulse 1.8s ease-in-out infinite alternate;
          flex-shrink: 0;
        }

        @keyframes diwali-flame-pulse {
          0%   { transform: scaleX(1)    scaleY(1)    rotate(-2deg); filter: brightness(1);   }
          50%  { transform: scaleX(0.88) scaleY(1.06) rotate(1deg);  filter: brightness(1.15);}
          100% { transform: scaleX(1.08) scaleY(0.96) rotate(-1deg); filter: brightness(0.95);}
        }

        .diwali-banner-close {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: rgba(255,200,80,0.7);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: color 0.2s, background 0.2s;
        }
        .diwali-banner-close:hover {
          color: #ffd700;
          background: rgba(255,180,0,0.12);
        }

        /* ── Particles ──────────────────────────── */
        .diwali-particles-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 99990;
          overflow: hidden;
        }

        .diwali-particle {
          position: absolute;
          top: -60px;
          display: inline-flex;
          will-change: transform, opacity;
          animation: diwali-fall linear forwards;
        }

        @keyframes diwali-fall {
          0%   { transform: translateY(0)    rotate(0deg)   scale(0.6); opacity: 0; }
          8%   { opacity: 1; }
          80%  { opacity: 0.85; }
          100% { transform: translateY(105vh) rotate(360deg) scale(1);  opacity: 0; }
        }

        /* ── Corner lanterns ─────────────────────── */
        .diwali-lantern {
          position: fixed;
          z-index: 99991;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: diwali-sway 4s ease-in-out infinite alternate;
          transform-origin: top center;
        }
        .diwali-lantern-tl { top: 40px; left: 16px; }
        .diwali-lantern-tr { top: 40px; right: 16px; }

        @keyframes diwali-sway {
          from { transform: rotate(-6deg); }
          to   { transform: rotate(6deg); }
        }

        .diwali-lantern-string {
          width: 1.5px;
          height: 36px;
          background: linear-gradient(to bottom, rgba(200,150,50,0.6), rgba(200,150,50,0.2));
        }

        .diwali-lantern-body {
          width: 28px;
          height: 44px;
          border-radius: 3px 3px 6px 6px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 16px 4px rgba(255,140,0,0.5);
        }

        .diwali-lantern-cap {
          width: 34px;
          height: 8px;
          background: #8b2000;
          border-radius: 3px;
          margin: 0 auto;
          box-shadow: 0 -2px 6px rgba(200,80,0,0.4);
        }

        .diwali-lantern-foot {
          width: 34px;
          height: 8px;
          background: #8b2000;
          border-radius: 3px;
          margin: 0 auto;
        }

        .diwali-lantern-tassel {
          width: 2px;
          height: 24px;
          background: linear-gradient(to bottom, #cc0000, transparent);
          margin: 0 auto;
        }

        .diwali-lantern-glow {
          position: absolute;
          inset: 0;
          animation: diwali-lantern-flicker 2.2s ease-in-out infinite alternate;
        }

        @keyframes diwali-lantern-flicker {
          0%   { opacity: 0.85; }
          33%  { opacity: 1;    }
          66%  { opacity: 0.9;  }
          100% { opacity: 0.8;  }
        }

        /* push page content down so banner doesn't overlap */
        .diwali-page-offset {
          padding-top: 38px !important;
        }
      `}</style>

      {/* Banner */}
      {bannerVisible && <DiwaliBanner onClose={handleDismissBanner} />}

      {/* Corner Lanterns */}
      <Lantern side="left" />
      <Lantern side="right" />

      {/* Falling particles layer */}
      <div className="diwali-particles-layer" aria-hidden="true">
        {particles.map(p => (
          <Particle
            key={p.id}
            type={p.type}
            style={{
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ── Lantern component ── */
function Lantern({ side }) {
  const posClass = side === 'left' ? 'diwali-lantern diwali-lantern-tl' : 'diwali-lantern diwali-lantern-tr';
  const delay = side === 'left' ? '0s' : '1.5s';
  const gradient = side === 'left'
    ? 'linear-gradient(135deg, #cc3300 0%, #ff6600 50%, #cc3300 100%)'
    : 'linear-gradient(135deg, #8b0000 0%, #cc2200 50%, #ff5500 100%)';

  return (
    <div className={posClass} style={{ animationDelay: delay }}>
      <div className="diwali-lantern-string" />
      <div className="diwali-lantern-cap" />
      <div className="diwali-lantern-body" style={{ background: gradient }}>
        <div className="diwali-lantern-glow" style={{
          background: 'radial-gradient(ellipse at center, rgba(255,200,80,0.55) 0%, transparent 75%)',
        }} />
      </div>
      <div className="diwali-lantern-foot" />
      <div className="diwali-lantern-tassel" />
    </div>
  );
}
