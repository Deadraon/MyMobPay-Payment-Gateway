import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/linkedin-banners');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read assets as base64
const logoWhitePath = path.resolve('public/logos/logo_horizontal_white.png');
const logoWhiteB64 = fs.existsSync(logoWhitePath)
  ? `data:image/png;base64,${fs.readFileSync(logoWhitePath).toString('base64')}`
  : '';

// Minimal, clean, sophisticated styling (Linear / Vercel / Stripe inspired)
// Strict rules: NO neon colors, NO glowing blurred balls, NO bright rainbow gradients.
const commonHead = `
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1584px;
      height: 396px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #09090B;
      color: #FAFAFA;
      position: relative;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    /* Clean, ultra-subtle architectural grid */
    .subtle-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(circle at 65% 50%, black 20%, transparent 80%);
      pointer-events: none;
    }
    /* Minimal hairline badge */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #A1A1AA;
    }
    .pill-active {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.16);
      color: #F4F4F5;
    }
    .pill-accent {
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.25);
      color: #93C5FD;
    }
    /* Clean hairline card */
    .clean-card {
      background: rgba(18, 18, 22, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      backdrop-filter: blur(8px);
    }
  </style>
`;

const banners = [
  // ── SLIDE 1: MYMOBPAY MINIMAL PRODUCT BANNER ──────────────────────────────
  {
    filename: 'linkedin_banner_1_mymobpay_flagship.png',
    title: 'Slide 1 - MyMobPay Flagship Product (Minimal & Clean)',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
  <style>
    .layout-1 {
      width: 1584px;
      height: 396px;
      background: #0A0A0C;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 38px 64px 38px 340px;
      position: relative;
    }
    .accent-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.08) 80%, transparent 100%);
    }
  </style>
</head>
<body>
  <div class="accent-line"></div>
  <div class="subtle-grid"></div>
  <div class="layout-1">
    <!-- Top Row: Logo & Context -->
    <div style="display: flex; align-items: center; justify-content: space-between; z-index: 2;">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${logoWhiteB64 ? `<img src="${logoWhiteB64}" style="height: 32px; object-fit: contain;" alt="MyMobPay" />` : `<span style="font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: white;">MyMobPay</span>`}
        <div style="width: 1px; height: 18px; background: rgba(255,255,255,0.12);"></div>
        <span class="pill pill-active">Payment Infrastructure</span>
        <span class="pill">Direct-To-Bank UPI</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
        <span class="mono" style="font-size: 13px; color: #71717A;">mymobpay.tech</span>
      </div>
    </div>

    <!-- Main Headline & Subtitle -->
    <div style="z-index: 2; margin-top: 4px;">
      <h1 style="font-size: 40px; font-weight: 700; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF; max-width: 1050px;">
        Direct-to-Bank UPI Payments for Indian SaaS Founders
      </h1>
      <p style="font-size: 16.5px; color: #A1A1AA; font-weight: 400; margin-top: 10px; line-height: 1.45; max-width: 940px;">
        0% transaction fees. Instant UTR settlement directly to your UPI ID. No middleman hold or escrow delays.
      </p>
    </div>

    <!-- Bottom Feature Bar -->
    <div style="display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07);">
      <div style="display: flex; align-items: center; gap: 28px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="mono" style="color: #71717A; font-size: 13px;">01</span>
          <span style="font-size: 13px; font-weight: 500; color: #E4E4E7;">Zero Per-Txn Fees</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="mono" style="color: #71717A; font-size: 13px;">02</span>
          <span style="font-size: 13px; font-weight: 500; color: #E4E4E7;">Real-Time UTR Webhooks</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="mono" style="color: #71717A; font-size: 13px;">03</span>
          <span style="font-size: 13px; font-weight: 500; color: #E4E4E7;">Drop-in REST APIs</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 12px; color: #71717A;">Settlement Apps:</span>
        <span class="mono" style="font-size: 12px; color: #A1A1AA;">GPay • PhonePe • Paytm • CRED • BHIM</span>
      </div>
    </div>
  </div>
</body>
</html>`
  },

  // ── SLIDE 2: THE BUILDER & ENGINEER (Clean Developer / Linear Style) ──────
  {
    filename: 'linkedin_banner_2_builder_engineer.png',
    title: 'Slide 2 - Full-Stack & Fintech Engineering (Clean)',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
  <style>
    .layout-2 {
      width: 1584px;
      height: 396px;
      background: #09090B;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 38px 64px 38px 340px;
      position: relative;
    }
  </style>
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="layout-2">
    <!-- Left Column: Bio / Headline / Tech Stack -->
    <div style="flex: 1; max-width: 680px; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="pill pill-active">Kunal Chauhan</span>
          <span class="mono" style="font-size: 12px; color: #71717A;">Founder & Product Engineer</span>
        </div>

        <h1 style="font-size: 38px; font-weight: 700; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF; margin-top: 14px;">
          Engineering Resilient Payment Systems & Modern SaaS
        </h1>

        <p style="font-size: 16px; color: #A1A1AA; font-weight: 400; margin-top: 10px; line-height: 1.45;">
          From core database schemas to high-conversion UI. Building software that scales simply and reliably.
        </p>
      </div>

      <!-- Tech Stack Minimal Pills -->
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="mono" style="font-size: 11.5px; color: #D4D4D8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 6px;">Next.js 14</span>
        <span class="mono" style="font-size: 11.5px; color: #D4D4D8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 6px;">Node.js</span>
        <span class="mono" style="font-size: 11.5px; color: #D4D4D8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 6px;">PostgreSQL</span>
        <span class="mono" style="font-size: 11.5px; color: #D4D4D8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 6px;">Supabase</span>
        <span class="mono" style="font-size: 11.5px; color: #D4D4D8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 6px;">Tailwind CSS</span>
        <span class="mono" style="font-size: 11.5px; color: #D4D4D8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 6px;">REST APIs</span>
      </div>
    </div>

    <!-- Right Column: Clean Minimal Code Block -->
    <div class="clean-card" style="width: 460px; padding: 18px 22px; z-index: 2;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="display: flex; gap: 6px;">
          <div style="width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
          <div style="width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
          <div style="width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
        </div>
        <span class="mono" style="font-size: 11px; color: #71717A;">mymobpay.createOrder()</span>
      </div>
      <pre class="mono" style="font-size: 12.5px; line-height: 1.65; color: #D4D4D8;">
<span style="color: #A1A1AA;">const</span> order = <span style="color: #A1A1AA;">await</span> mymobpay.<span style="color: #FAFAFA;">createOrder</span>({
  amount: <span style="color: #FAFAFA;">499</span>,
  customer: <span style="color: #A1A1AA;">"founder@indiesaas.com"</span>,
  settleTo: <span style="color: #A1A1AA;">"founder@upi"</span>,
  fees: <span style="color: #FAFAFA;">0</span> <span style="color: #71717A;">// 0% platform fee</span>
});

<span style="color: #71717A;">// Verified via real-time UTR webhook</span>
<span style="color: #A1A1AA;">return</span> order.paymentUrl;</pre>
    </div>
  </div>
</body>
</html>`
  },

  // ── SLIDE 3: VALUE PROP & NUMBERS (Clean Monochrome Metric Tiles) ──────────
  {
    filename: 'linkedin_banner_3_zero_fee_advantage.png',
    title: 'Slide 3 - Value Proposition & Metrics (Clean & Minimal)',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
  <style>
    .layout-3 {
      width: 1584px;
      height: 396px;
      background: #09090B;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 38px 64px 38px 340px;
      position: relative;
    }
    .tile {
      flex: 1;
      background: rgba(18, 18, 22, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 16px 20px;
    }
  </style>
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="layout-3">
    <!-- Header -->
    <div style="z-index: 2;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="pill pill-active">Why MyMobPay</span>
        <span style="font-size: 12px; color: #71717A; font-weight: 500;">FINANCIAL EFFICIENCY FOR BOOTSTRAPPERS</span>
      </div>
      <h1 style="font-size: 38px; font-weight: 700; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF; margin-top: 10px;">
        SaaS Payments Shouldn't Cost 2% to 3% of Your Revenue
      </h1>
      <p style="font-size: 16px; color: #A1A1AA; font-weight: 400; margin-top: 8px;">
        Keep 100% of your customer payments. No aggregator hold periods. Direct to your bank account.
      </p>
    </div>

    <!-- 3 Clean Metric Tiles -->
    <div style="display: flex; gap: 18px; z-index: 2;">
      <div class="tile">
        <div style="font-size: 34px; font-weight: 700; color: #FAFAFA; letter-spacing: -0.02em;">0%</div>
        <div style="font-size: 13px; font-weight: 600; color: #D4D4D8; margin-top: 6px;">Transaction Fees</div>
        <div style="font-size: 12px; color: #71717A; margin-top: 3px;">Keep 100% of every order you charge</div>
      </div>

      <div class="tile">
        <div style="font-size: 34px; font-weight: 700; color: #FAFAFA; letter-spacing: -0.02em;">0s</div>
        <div style="font-size: 13px; font-weight: 600; color: #D4D4D8; margin-top: 6px;">Settlement Delay</div>
        <div style="font-size: 12px; color: #71717A; margin-top: 3px;">Funds land directly in your UPI account</div>
      </div>

      <div class="tile">
        <div style="font-size: 34px; font-weight: 700; color: #FAFAFA; letter-spacing: -0.02em;">&lt; 2 min</div>
        <div style="font-size: 13px; font-weight: 600; color: #D4D4D8; margin-top: 6px;">Integration Time</div>
        <div style="font-size: 12px; color: #71717A; margin-top: 3px;">Drop-in checkout links & simple webhook</div>
      </div>
    </div>

    <!-- Bottom Footer Note -->
    <div style="display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);">
      <span style="font-size: 13px; color: #71717A; font-weight: 400;">
        Built for indie hackers, micro-SaaS founders, and digital product builders in India.
      </span>
      <span class="mono" style="font-size: 12px; color: #A1A1AA;">https://mymobpay.tech</span>
    </div>
  </div>
</body>
</html>`
  },

  // ── SLIDE 4: PERSONAL VISION & INDIE HACKING (Clean Editorial) ────────────
  {
    filename: 'linkedin_banner_4_indie_hacker_mindset.png',
    title: 'Slide 4 - Personal Vision & Indie Hacking (Clean Editorial)',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
  <style>
    .layout-4 {
      width: 1584px;
      height: 396px;
      background: #09090B;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 38px 64px 38px 340px;
      position: relative;
    }
    .value-box {
      flex: 1;
      padding: 14px 18px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="layout-4">
    <!-- Top Row -->
    <div style="z-index: 2;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="pill pill-active">Indie Hacker</span>
        <span class="pill">Building in Public</span>
        <span class="mono" style="font-size: 12px; color: #71717A;">from Uttar Pradesh, India</span>
      </div>

      <h1 style="font-size: 38px; font-weight: 700; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF; margin-top: 14px; max-width: 1080px;">
        Craft Over Bloat. Speed Over Bureaucracy.
      </h1>

      <p style="font-size: 16.5px; color: #A1A1AA; font-weight: 400; margin-top: 10px; line-height: 1.45; max-width: 960px;">
        I believe in self-sustainable software, transparent engineering, and building tools that give independent founders complete autonomy.
      </p>
    </div>

    <!-- 3 Values Row -->
    <div style="display: flex; gap: 16px; z-index: 2;">
      <div class="value-box">
        <div style="font-size: 13.5px; font-weight: 600; color: #FAFAFA;">0 → 1 Execution</div>
        <div style="font-size: 12px; color: #71717A; margin-top: 3px;">Rapidly taking ideas from prototype to production.</div>
      </div>

      <div class="value-box">
        <div style="font-size: 13.5px; font-weight: 600; color: #FAFAFA;">Indie SaaS Autonomy</div>
        <div style="font-size: 12px; color: #71717A; margin-top: 3px;">Sustainable businesses powered by real utility.</div>
      </div>

      <div class="value-box">
        <div style="font-size: 13.5px; font-weight: 600; color: #FAFAFA;">Full-Stack Craft</div>
        <div style="font-size: 12px; color: #71717A; margin-top: 3px;">Fast queries, tight interfaces, zero superfluous bloat.</div>
      </div>
    </div>

    <!-- Bottom Quote -->
    <div style="display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);">
      <span style="font-size: 13px; color: #A1A1AA; font-style: italic;">
        "Great products are born when technical craft meets direct empathy for the user."
      </span>
      <span class="mono" style="font-size: 12px; color: #71717A;">Kunal Chauhan</span>
    </div>
  </div>
</body>
</html>`
  },

  // ── SLIDE 5: CONNECT & COLLABORATE (Clean Minimal Networking) ─────────────
  {
    filename: 'linkedin_banner_5_connect_collaborate.png',
    title: 'Slide 5 - Network, Advisory & Collaboration (Clean & Minimal)',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
  <style>
    .layout-5 {
      width: 1584px;
      height: 396px;
      background: #09090B;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 38px 64px 38px 340px;
      position: relative;
    }
    .connect-tile {
      flex: 1;
      padding: 16px 20px;
      background: rgba(18, 18, 22, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="layout-5">
    <!-- Top Row -->
    <div style="z-index: 2;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="pill pill-active">Open to Connect</span>
        <span class="mono" style="font-size: 12px; color: #71717A;">Founder & Engineering Network</span>
      </div>

      <h1 style="font-size: 38px; font-weight: 700; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF; margin-top: 12px;">
        Let's Connect and Build Together
      </h1>

      <p style="font-size: 16px; color: #A1A1AA; font-weight: 400; margin-top: 8px;">
        Always interested in exchanging ideas with founders, product engineers, and fellow indie builders.
      </p>
    </div>

    <!-- 3 Connect Tiles -->
    <div style="display: flex; gap: 16px; z-index: 2;">
      <div class="connect-tile">
        <div style="font-size: 14px; font-weight: 600; color: #FAFAFA; margin-bottom: 4px;">Founder Discussions</div>
        <div style="font-size: 12.5px; color: #71717A; line-height: 1.45;">
          SaaS pricing, direct UPI payment flows, and bootstrapping models in India.
        </div>
      </div>

      <div class="connect-tile">
        <div style="font-size: 14px; font-weight: 600; color: #FAFAFA; margin-bottom: 4px;">Technical Collaborations</div>
        <div style="font-size: 12.5px; color: #71717A; line-height: 1.45;">
          Architecture reviews, full-stack Next.js systems, and webhook integrations.
        </div>
      </div>

      <div class="connect-tile">
        <div style="font-size: 14px; font-weight: 600; color: #FAFAFA; margin-bottom: 4px;">Explore MyMobPay</div>
        <div style="font-size: 12.5px; color: #71717A; line-height: 1.45;">
          Visit mymobpay.tech — test instant checkout and direct-to-bank settlements.
        </div>
      </div>
    </div>

    <!-- Bottom Status Bar -->
    <div style="display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 12.5px; color: #D4D4D8; font-weight: 500;">
          DMs are always open on LinkedIn
        </span>
        <span style="color: rgba(255,255,255,0.2);">•</span>
        <span style="font-size: 12.5px; color: #71717A;">Based in Najibabad, Uttar Pradesh, India</span>
      </div>
      <span class="mono" style="font-size: 12px; color: #A1A1AA;">linkedin.com/in/deadraon</span>
    </div>
  </div>
</body>
</html>`
  }
];

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (let i = 0; i < banners.length; i++) {
  const b = banners[i];
  const htmlFile = path.join(outDir, `temp_${i + 1}.html`);
  const pngFile = path.join(outDir, b.filename);

  fs.writeFileSync(htmlFile, b.html, 'utf-8');
  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

  console.log(`[${i + 1}/5] Rendering ${b.title}...`);
  try {
    execSync(`"${chromePath}" --headless=new --disable-gpu --force-device-scale-factor=2 --window-size=1584,396 --screenshot="${pngFile}" "${fileUrl}"`, {
      stdio: 'pipe'
    });
    console.log(`  ✓ Generated: ${b.filename} (${fs.statSync(pngFile).size} bytes)`);
  } catch (err) {
    console.error(`  ✗ Error rendering ${b.filename}:`, err?.message);
  } finally {
    try { fs.unlinkSync(htmlFile); } catch (e) {}
  }
}

console.log('\nAll 5 minimal & clean LinkedIn slideshow banners successfully generated in public/linkedin-banners/ !');
