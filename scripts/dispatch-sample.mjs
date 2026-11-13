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

// Target email
const targetEmail = process.argv[2] || 'chauhankunal695@gmail.com';
process.env.ADMIN_ALERT_EMAIL = targetEmail;
process.env.PRIMARY_ADMIN_NOTIFY_EMAIL = targetEmail;

console.log('================================================================');
console.log('🍎 DISPATCHING APPLE-STYLED REDESIGNED EMAILS');
console.log(`🎯 Recipient Target: ${targetEmail}`);
console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
console.log('================================================================\n');

async function main() {
  const mailer = await import('../lib/mailer.js');

  console.log('1. Dispatching: Apple-Style Verification Code OTP...');
  try {
    const otpResult = await mailer.sendOtpEmail({
      to: targetEmail,
      otp: '749210',
      recipientName: 'Kunal Chauhan',
      businessName: 'MyMobPay',
      purpose: 'login'
    });
    console.log('   ✅ OTP Email Result:', otpResult);
  } catch (err) {
    console.error('   ❌ OTP Email Error:', err.message);
  }

  console.log('\n2. Dispatching: Apple Pay Merchant Payment Inflow Alert...');
  try {
    const merchantResult = await mailer.sendPaymentLinkMerchantNotificationEmail({
      to: targetEmail,
      businessName: 'MyMobPay Store',
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'aarav@example.com',
      amount: '2,499.00',
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      utr: '631984719204',
      linkTitle: 'Pro Annual Membership',
      merchantUpi: 'mymobpay@icici',
      paidAt: new Date().toISOString()
    });
    console.log('   ✅ Merchant Notification Result:', merchantResult);
  } catch (err) {
    console.error('   ❌ Merchant Notification Error:', err.message);
  }

  console.log('\n3. Dispatching: Apple Store Customer Tax Receipt...');
  try {
    const customerResult = await mailer.sendPaymentLinkCustomerReceiptEmail({
      to: targetEmail,
      customerName: 'Kunal Chauhan',
      businessName: 'MyMobPay Cloud',
      merchantPhone: '+91 98765 43210',
      amount: '2,499.00',
      orderId: 'MMP-' + Math.floor(100000 + Math.random() * 900000),
      utr: '631984719204',
      linkTitle: 'Pro Annual Membership',
      paidAt: new Date().toISOString()
    });
    console.log('   ✅ Customer Receipt Result:', customerResult);
  } catch (err) {
    console.error('   ❌ Customer Receipt Error:', err.message);
  }

  console.log('\n4. Dispatching: Apple Services Subscription Tax Invoice...');
  try {
    const invoiceResult = await mailer.sendSubscriptionInvoiceEmail({
      to: targetEmail,
      businessName: 'Kunal Chauhan',
      mid: 'MMP-SUPERADMIN',
      planName: 'Enterprise Zero-MDR Direct Bank Rails',
      amount: 4999,
      durationDays: 365,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      invoiceRef: 'INV-2026-APL1',
      paymentMethod: 'Direct Bank UPI Settlement (NPCI)',
      utr: '631984719204'
    });
    console.log('   ✅ Subscription Invoice Result:', invoiceResult);
  } catch (err) {
    console.error('   ❌ Subscription Invoice Error:', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL APPLE REDESIGNED EMAILS DISPATCHED SUCCESSFULLY TO:', targetEmail);
  console.log('================================================================');
}

main().catch(err => {
  console.error('\n❌ Fatal error in dispatch script:', err);
  process.exit(1);
});
