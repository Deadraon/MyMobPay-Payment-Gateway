import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/linkedin-banners');
const html = `<!DOCTYPE html>
<html>
<body style="background: #09090B; padding: 40px; font-family: sans-serif; color: white;">
  <div style="margin-bottom: 30px;">
    <h3>logo_horizontal_white.png (height: 48px)</h3>
    <div style="background: rgba(255,255,255,0.05); padding: 10px; display: inline-block; border: 1px dashed red;">
      <img src="data:image/png;base64,${fs.readFileSync('public/logos/logo_horizontal_white.png').toString('base64')}" style="height: 48px;" />
    </div>
  </div>
  <div style="margin-bottom: 30px;">
    <h3>mymobpay_mark.png (height: 48px) + Text "MyMobPay"</h3>
    <div style="background: rgba(255,255,255,0.05); padding: 10px; display: inline-flex; align-items: center; gap: 12px; border: 1px dashed red;">
      <img src="data:image/png;base64,${fs.readFileSync('public/logos/mymobpay_mark.png').toString('base64')}" style="height: 36px;" />
      <span style="font-size: 32px; font-weight: 800; color: white; letter-spacing: -0.02em;">MyMobPay</span>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'test_logos.html'), html);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
execSync(`"${chromePath}" --headless=new --screenshot="${path.join(outDir, 'test_logos.png')}" "file:///${path.join(outDir, 'test_logos.html').replace(/\\/g, '/')}"`);
console.log('Test rendered to test_logos.png');
