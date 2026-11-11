const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe';
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      width: 1584px;
      height: 396px;
      overflow: hidden;
      background: #0B0F19;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 { font-size: 48px; color: #10B981; }
  </style>
</head>
<body>
  <h1>Test Banner 1584x396</h1>
</body>
</html>
`;

fs.writeFileSync('public/linkedin-banners/test.html', html);
const inputUrl = 'file:///' + path.resolve('public/linkedin-banners/test.html').replace(/\/g, '/');
const outputPath = path.resolve('public/linkedin-banners/test.png');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1584,396 --screenshot="${outputPath}" "${inputUrl}"`, { stdio: 'inherit' });
console.log('Generated test.png, exists:', fs.existsSync(outputPath), 'size:', fs.statSync(outputPath).size);
