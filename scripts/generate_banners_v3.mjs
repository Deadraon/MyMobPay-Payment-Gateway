import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/linkedin-banners');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Download destinations
const downloadsBase = 'C:\\Users\\chauh\\Downloads';
const downloadsSub = path.join(downloadsBase, 'LinkedIn-Cover-Slideshow');
if (!fs.existsSync(downloadsSub)) {
  fs.mkdirSync(downloadsSub, { recursive: true });
}

// Read assets as base64
const logoWhitePath = path.resolve('public/logos/logo_horizontal_white.png');
const logoWhiteB64 = fs.existsSync(logoWhitePath)
  ? `data:image/png;base64,${fs.readFileSync(logoWhitePath).toString('base64')}`
  : '';

const markPath = path.resolve('public/logos/mymobpay_mark.png');
const markB64 = fs.existsSync(markPath)
  ? `data:image/png;base64,${fs.readFileSync(markPath).toString('base64')}`
  : '';

// Minimal, clean, sophisticated dark styling (Linear / Vercel aesthetic)
// Zero AI neon/rainbow blobs, large legible high-contrast typography,
// clean 470px left margin safe-zone for profile avatar.
const commonHead = `
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
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
    /* Subtle architectural grid on dark canvas */
    .subtle-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(circle at 75% 50%, black 30%, transparent 85%);
      pointer-events: none;
    }
    /* Master layout container with 470px left margin for profile avatar */
    .banner-container {
      width: 1584px;
      height: 396px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 42px 90px 40px 470px;
      position: relative;
      z-index: 2;
    }
    /* High contrast, large tag pills */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #D4D4D8;
    }
    .pill-active {
      background: #FFFFFF;
      border-color: #FFFFFF;
      color: #09090B;
    }
    .pill-brand {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #FFFFFF;
    }
    /* Large stat / feature badge */
    .feature-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #F4F4F5;
    }
    .feature-badge strong {
      color: #FFFFFF;
      font-weight: 700;
    }
    .dot-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22C55E;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }
  </style>
`;

const banners = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. PERSONAL PROFILE: Kunal Chauhan — Full-Stack Systems Engineer & Founder
  // ──────────────────────────────────────────────────────────────────────────
  {
    filename: 'linkedin_banner_1_kunal_systems_engineer.png',
    title: 'Slide 1 - Personal Profile: Full-Stack Systems Engineer & Founder',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="banner-container">
    <!-- Top Pill Row with MyMobPay Mark -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <span class="pill pill-active">Kunal Chauhan</span>
      <span class="pill pill-brand" style="display: inline-flex; align-items: center; gap: 8px;">
        <img src="${markB64}" style="height: 16px; width: auto; vertical-align: middle;" />
        Founder @ MyMobPay
      </span>
      <span class="pill">Full-Stack Engineer</span>
      <span class="mono" style="font-size: 13px; color: #71717A; margin-left: 6px;">Najibabad, UP, India</span>
    </div>

    <!-- Main Hero Statement (Big, bold, high-contrast) -->
    <div style="margin-top: 8px;">
      <h1 style="font-size: 46px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF;">
        Building Scalable Systems & High-Impact Software
      </h1>
      <p style="font-size: 21px; color: #A1A1AA; font-weight: 500; margin-top: 12px; line-height: 1.35; max-width: 950px;">
        Architecting robust full-stack applications, distributed payment rails, and production-ready tools.
      </p>
    </div>

    <!-- Bottom Feature Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="display: flex; gap: 12px;">
        <span class="feature-badge"><span class="dot-indicator"></span> Next.js & React</span>
        <span class="feature-badge">Node.js & Systems</span>
        <span class="feature-badge">Fintech Architecture</span>
        <span class="feature-badge">Postgres & Supabase</span>
      </div>
      <span class="mono" style="font-size: 14px; font-weight: 600; color: #71717A;">linkedin.com/in/deadraon</span>
    </div>
  </div>
</body>
</html>`
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PERSONAL PROFILE: Product Engineering & 0 → 1 Builder Craft
  // ──────────────────────────────────────────────────────────────────────────
  {
    filename: 'linkedin_banner_2_kunal_product_builder.png',
    title: 'Slide 2 - Personal Profile: 0 to 1 Product Builder & Craft',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="banner-container">
    <!-- Top Pill Row -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <span class="pill pill-active">0 → 1 Builder</span>
      <span class="pill pill-brand" style="display: inline-flex; align-items: center; gap: 8px;">
        <img src="${markB64}" style="height: 16px; width: auto; vertical-align: middle;" />
        Building MyMobPay
      </span>
      <span class="pill">Product Engineering</span>
      <span class="mono" style="font-size: 13px; color: #71717A; margin-left: 6px;">Craft • Speed • Precision</span>
    </div>

    <!-- Main Hero Statement -->
    <div style="margin-top: 8px;">
      <h1 style="font-size: 46px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF;">
        From Idea to Production-Ready Architecture
      </h1>
      <p style="font-size: 21px; color: #A1A1AA; font-weight: 500; margin-top: 12px; line-height: 1.35; max-width: 950px;">
        Transforming complex backend logic into fast, intuitive software with zero engineering bloat.
      </p>
    </div>

    <!-- Bottom Feature Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="display: flex; gap: 12px;">
        <span class="feature-badge"><strong>Clean Code</strong> & Maintainability</span>
        <span class="feature-badge"><strong>Rapid</strong> Prototyping</span>
        <span class="feature-badge"><strong>Self-Hosted</strong> & Cloud Scalability</span>
      </div>
      <span class="mono" style="font-size: 14px; font-weight: 600; color: #71717A;">github.com/deadraon</span>
    </div>
  </div>
</body>
</html>`
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. BUSINESS (MyMobPay): 0% Fee UPI Infrastructure (Official Logo)
  // ──────────────────────────────────────────────────────────────────────────
  {
    filename: 'linkedin_banner_3_mymobpay_zero_fees.png',
    title: 'Slide 3 - Business (MyMobPay): Direct UPI & 0% Fees',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="banner-container">
    <!-- Top Row with Official MyMobPay Logo -->
    <div style="display: flex; align-items: center; gap: 16px;">
      <img src="${logoWhiteB64}" style="height: 38px; width: auto; object-fit: contain;" alt="MyMobPay" />
      <div style="width: 1px; height: 22px; background: rgba(255,255,255,0.15);"></div>
      <span class="pill pill-brand">Direct UPI Gateway</span>
      <span class="mono" style="font-size: 13px; color: #71717A;">For Indian SaaS & Founders</span>
    </div>

    <!-- Main Hero Statement -->
    <div style="margin-top: 6px;">
      <h1 style="font-size: 48px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF;">
        0% Transaction Fees. Direct to Your Bank.
      </h1>
      <p style="font-size: 21px; color: #A1A1AA; font-weight: 500; margin-top: 12px; line-height: 1.35; max-width: 950px;">
        Stop giving away 2% to 3% of revenue. Customer payments land directly in your UPI account instantly.
      </p>
    </div>

    <!-- Bottom Feature Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="display: flex; gap: 12px;">
        <span class="feature-badge"><strong>0% Commission</strong> Forever</span>
        <span class="feature-badge"><span class="dot-indicator"></span> <strong>Instant</strong> Settlement</span>
        <span class="feature-badge"><strong>Zero</strong> Hold Periods</span>
      </div>
      <span class="mono" style="font-size: 14px; font-weight: 600; color: #71717A;">mymobpay.tech</span>
    </div>
  </div>
</body>
</html>`
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. BUSINESS (MyMobPay): Developer-First Integration (Official Logo)
  // ──────────────────────────────────────────────────────────────────────────
  {
    filename: 'linkedin_banner_4_mymobpay_developer_first.png',
    title: 'Slide 4 - Business (MyMobPay): Simple 2-Minute Developer Integration',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="banner-container">
    <!-- Top Row with Official MyMobPay Logo -->
    <div style="display: flex; align-items: center; gap: 16px;">
      <img src="${logoWhiteB64}" style="height: 38px; width: auto; object-fit: contain;" alt="MyMobPay" />
      <div style="width: 1px; height: 22px; background: rgba(255,255,255,0.15);"></div>
      <span class="pill pill-brand">Developer API</span>
      <span class="mono" style="font-size: 13px; color: #71717A;">Simple REST & Webhooks</span>
    </div>

    <!-- Main Hero Statement -->
    <div style="margin-top: 6px;">
      <h1 style="font-size: 48px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF;">
        Accept UPI Payments in Under 2 Minutes
      </h1>
      <p style="font-size: 21px; color: #A1A1AA; font-weight: 500; margin-top: 12px; line-height: 1.35; max-width: 950px;">
        Drop-in payment links, dynamic QR generation, and real-time webhook confirmation with zero paperwork.
      </p>
    </div>

    <!-- Bottom Feature Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="display: flex; gap: 12px;">
        <span class="feature-badge"><strong>&lt; 2 min</strong> Setup</span>
        <span class="feature-badge"><strong>Clean</strong> REST API</span>
        <span class="feature-badge"><strong>Real-time</strong> Webhooks</span>
      </div>
      <span class="mono" style="font-size: 14px; font-weight: 600; color: #71717A;">docs.mymobpay.tech</span>
    </div>
  </div>
</body>
</html>`
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. HIRING, COLLABORATION & FUTURE SCOPE: Open for High-Impact Work
  // ──────────────────────────────────────────────────────────────────────────
  {
    filename: 'linkedin_banner_5_collaboration_future_scope.png',
    title: 'Slide 5 - Collaboration & Future Scope: Open to High-Impact Opportunities',
    html: `<!DOCTYPE html>
<html>
<head>
  ${commonHead}
</head>
<body>
  <div class="subtle-grid"></div>
  <div class="banner-container">
    <!-- Top Pill Row with MyMobPay Mark -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <span class="pill pill-active">Open to Collaborate</span>
      <span class="pill pill-brand" style="display: inline-flex; align-items: center; gap: 8px;">
        <img src="${markB64}" style="height: 16px; width: auto; vertical-align: middle;" />
        Founder & Engineer
      </span>
      <span class="pill">Fintech & Software</span>
      <span class="mono" style="font-size: 13px; color: #71717A; margin-left: 6px;">DMs Open</span>
    </div>

    <!-- Main Hero Statement -->
    <div style="margin-top: 8px;">
      <h1 style="font-size: 46px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: #FFFFFF;">
        Let’s Build Something Exceptional Together
      </h1>
      <p style="font-size: 21px; color: #A1A1AA; font-weight: 500; margin-top: 12px; line-height: 1.35; max-width: 950px;">
        Available for engineering roles, technical co-founding, and strategic software collaborations.
      </p>
    </div>

    <!-- Bottom Feature Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="display: flex; gap: 12px;">
        <span class="feature-badge"><span class="dot-indicator"></span> <strong>Engineering</strong> Leadership</span>
        <span class="feature-badge"><strong>Fintech & SaaS</strong> Architecture</span>
        <span class="feature-badge"><strong>Technical</strong> Advisory</span>
      </div>
      <span class="mono" style="font-size: 14px; font-weight: 600; color: #71717A;">Connect on LinkedIn</span>
    </div>
  </div>
</body>
</html>`
  }
];

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Rendering 5 high-legibility, minimalist LinkedIn slideshow banners with MyMobPay logo...');

for (let i = 0; i < banners.length; i++) {
  const b = banners[i];
  const htmlFile = path.join(outDir, `temp_clean_logo_${i + 1}.html`);
  const pngFile = path.join(outDir, b.filename);

  fs.writeFileSync(htmlFile, b.html, 'utf-8');
  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

  console.log(`[${i + 1}/5] Rendering ${b.title}...`);
  try {
    execSync(`"${chromePath}" --headless=new --disable-gpu --force-device-scale-factor=2 --window-size=1584,396 --screenshot="${pngFile}" "${fileUrl}"`, {
      stdio: 'pipe'
    });
    console.log(`  ✓ Generated: ${b.filename} (${fs.statSync(pngFile).size} bytes)`);

    // Copy to Downloads folder
    const targetSub = path.join(downloadsSub, b.filename);
    const targetRoot = path.join(downloadsBase, b.filename);
    fs.copyFileSync(pngFile, targetSub);
    fs.copyFileSync(pngFile, targetRoot);
    console.log(`  ✓ Copied to Downloads: ${b.filename}`);
  } catch (err) {
    console.error(`  ✗ Error rendering ${b.filename}:`, err?.message);
  } finally {
    try { fs.unlinkSync(htmlFile); } catch (e) {}
  }
}

console.log('\nAll 5 banners with MyMobPay logo successfully rendered and copied to Downloads!');
