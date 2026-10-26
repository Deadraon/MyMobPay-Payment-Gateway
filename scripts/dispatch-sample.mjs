import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, '../.env.local');

if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// Ensure recipient
const targetEmail = process.argv[2] || 'chauhankunal695@gmail.com';
process.env.ADMIN_ALERT_EMAIL = targetEmail;
process.env.PRIMARY_ADMIN_NOTIFY_EMAIL = targetEmail;

console.log('================================================================');
console.log('🚀 DISPATCHING SAMPLE REDESIGNED FINTECH EMAIL');
console.log(`🎯 Recipient Target: ${targetEmail}`);
console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
console.log('================================================================\n');

async function main() {
  const mailer = await import('../lib/mailer.js');

  console.log('Dispatching sample "Admin New Signup Alert" (Redesigned Fintech layout)...');
  const result = await mailer.sendAdminNewSignupNotification({
    userEmail: 'merchant.partner@pixelcraft.in',
    userName: 'Kunal Chauhan',
    businessName: 'Pixelcraft Studio LLP',
    upiId: 'pixelcraft@okhdfcbank',
    phone: '+91 98765 43210',
    provider: 'Google Auth & WhatsApp Verified',
    userId: `usr_${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    bankDetails: {
      bank_name: 'HDFC Bank Ltd',
      bank_account_number: '•••• •••• 8819',
      bank_ifsc: 'HDFC0001234'
    }
  });

  console.log('\n[SIGNUP ALERT RESULT]:', JSON.stringify(result, null, 2));

  console.log('\nDispatching sample "Subscription Tax Invoice & Receipt" (SendPulse)...');
  const invoiceResult = await mailer.sendSubscriptionInvoiceEmail({
    to: targetEmail,
    businessName: 'Pixelcraft Studio LLP',
    mid: 'MMP-772910',
    planName: 'Annual Pro Merchant License',
    amount: 4999,
    durationDays: 365,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    invoiceRef: 'INV-2026-9901',
    paymentMethod: 'Direct Bank UPI Settlement (NPCI)',
    utr: '629104881920'
  });

  console.log('\n[INVOICE RESULT]:', JSON.stringify(invoiceResult, null, 2));
}

main().catch(err => {
  console.error('\n❌ Fatal error in dispatch script:', err);
  process.exit(1);
});
