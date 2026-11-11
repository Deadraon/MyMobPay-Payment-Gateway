import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/linkedin-banners');
const markB64 = `data:image/png;base64,${fs.readFileSync('public/logos/mymobpay_mark.png').toString('base64')}`;

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
  <style>
    body { background: #09090B; padding: 40px; color: white; }
    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
  </style>
</head>
<body>
  <div style="margin-bottom: 30px;">
    <h3>Option A: Outfit 800 (Official Logo Font, perfectly unclipped)</h3>
    <div class="brand-logo" style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 8px;">
      <img src="${markB64}" style="height: 38px; width: auto; display: block;" />
      <span style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1;">MyMobPay</span>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h3>Option B: Plus Jakarta Sans 800</h3>
    <div class="brand-logo" style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 8px;">
      <img src="${markB64}" style="height: 38px; width: auto; display: block;" />
      <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 30px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.03em; line-height: 1;">MyMobPay</span>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h3>Original logo_horizontal_white.png (Notice clipped top on M):</h3>
    <div style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 8px;">
      <img src="data:image/png;base64,${fs.readFileSync('public/logos/logo_horizontal_white.png').toString('base64')}" style="height: 38px; display: block;" />
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'test_font_compare.html'), html);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
execSync(`"${chromePath}" --headless=new --screenshot="${path.join(outDir, 'test_font_compare.png')}" "file:///${path.join(outDir, 'test_font_compare.html').replace(/\\/g, '/')}"`);
console.log('Font comparison rendered to test_font_compare.png');
