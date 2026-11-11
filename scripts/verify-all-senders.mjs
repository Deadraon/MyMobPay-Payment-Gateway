import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(relPath) {
  const fullPath = resolve(__dirname, relPath);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (val) process.env[key] = val;
      }
    });
  }
}

loadEnvFile('../.env.local');

const {
  isUnitpostConfigured,
  isMailerooConfigured,
  isSendpulseConfigured,
  isBrevoConfigured,
  getProviderCircuitStatus,
  sendOtpEmail,
  sendSubscriptionInvoiceEmail
} = await import('../lib/mailer.js');

console.log('=== MULTI-PROVIDER INTEGRATION VERIFICATION ===');
console.log('Unitpost Configured:', isUnitpostConfigured());
console.log('Maileroo Configured:', isMailerooConfigured());
console.log('SendPulse Configured:', isSendpulseConfigured());
console.log('Brevo Configured:', isBrevoConfigured());
console.log('Circuit Breaker Status:', getProviderCircuitStatus());

console.log('\nTesting Auth OTP Delivery through Smart Failover Chain (Target: chauhankunal695@gmail.com)...');
try {
  const otpResult = await sendOtpEmail({
    to: 'chauhankunal695@gmail.com',
    otp: '948210',
    type: 'login'
  });
  console.log('✅ OTP Send Result:', otpResult);
} catch (err) {
  console.error('❌ OTP Send Error:', err.message);
}

console.log('\nTesting Subscription Invoice Delivery through Smart Failover Chain (Target: chauhankunal695@gmail.com)...');
try {
  const invoiceResult = await sendSubscriptionInvoiceEmail({
    to: 'chauhankunal695@gmail.com',
    merchantName: 'Kunal Chauhan',
    planName: 'Pro Merchant Monthly (30 Days)',
    amount: '499.00',
    invoiceId: 'INV-LIVE-TEST-001',
    period: 'Nov 2026'
  });
  console.log('✅ Invoice Send Result:', invoiceResult);
} catch (err) {
  console.error('❌ Invoice Send Error:', err.message);
}
