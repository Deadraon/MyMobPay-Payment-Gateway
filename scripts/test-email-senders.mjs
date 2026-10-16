import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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

const targetEmail = process.argv[2] || process.env.SENDPULSE_SMTP_USER || process.env.BREVO_SMTP_USER || 'chauhankunal695@gmail.com';

console.log('====================================================');
console.log('🧪 MyMobPay Multi-Rail Email Diagnostic Suite');
console.log(`🎯 Test Target Recipient: ${targetEmail}`);
console.log('====================================================\n');

async function testSendPulse() {
  console.log('👉 [1/2] Testing SendPulse SMTP (OTPs & Login Links)...');
  const user = process.env.SENDPULSE_SMTP_USER;
  const pass = process.env.SENDPULSE_SMTP_PASS;

  if (!user || !pass) {
    console.log('⚠️  SendPulse is NOT yet configured in .env.local (SENDPULSE_SMTP_USER / SENDPULSE_SMTP_PASS missing).\n');
    return false;
  }

  try {
    const port = parseInt(process.env.SENDPULSE_SMTP_PORT || '465', 10);
    const host = process.env.SENDPULSE_SMTP_HOST || 'smtp-pulse.com';
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    console.log(`   Connecting to ${host}:${port}...`);
    await transporter.verify();
    console.log('   ✅ SMTP Handshake Successful!');

    console.log(`   Dispatching test OTP email to ${targetEmail}...`);
    const from = process.env.SENDPULSE_FROM || `"MyMobPay Security" <${user}>`;
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '🔐 Your MyMobPay Verification Code [Test]',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">MyMobPay Security Verification</h2>
          <p style="color: #64748b; font-size: 14px;">This test verifies that SendPulse SMTP is properly configured and operational.</p>
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7;">849201</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Dispatched via SendPulse High-Priority Auth Stream.</p>
        </div>
      `
    });

    console.log(`   🎉 Delivered! Message ID: ${info.messageId}\n`);
    return true;
  } catch (err) {
    console.error(`   ❌ SendPulse Error: ${err.message}\n`);
    return false;
  }
}

async function testBrevo() {
  console.log('👉 [2/2] Testing Brevo SMTP (Invoices & Receipts)...');
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS;

  if (!user || !pass) {
    console.log('⚠️  Brevo is NOT yet configured in .env.local (BREVO_SMTP_USER / BREVO_SMTP_KEY missing).\n');
    return false;
  }

  try {
    const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
    const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    console.log(`   Connecting to ${host}:${port}...`);
    await transporter.verify();
    console.log('   ✅ SMTP Handshake Successful!');

    console.log(`   Dispatching test receipt email to ${targetEmail}...`);
    const from = process.env.BREVO_FROM || `"MyMobPay Billing" <${user}>`;
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '🧾 Payment Confirmation: Order #MMP_TEST_9921 [Test]',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Payment Received Successfully</h2>
          <p style="color: #64748b; font-size: 14px;">This test verifies that Brevo SMTP is properly configured and operational.</p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #065f46; font-weight: bold;">
              <span>Amount Paid:</span>
              <span>₹499.00</span>
            </div>
            <div style="font-size: 12px; color: #047857; margin-top: 6px;">
              Status: Verified via UPI • Settlement: Instant
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Dispatched via Brevo Transactional Receipt Stream.</p>
        </div>
      `
    });

    console.log(`   🎉 Delivered! Message ID: ${info.messageId}\n`);
    return true;
  } catch (err) {
    console.error(`   ❌ Brevo Error: ${err.message}\n`);
    return false;
  }
}

async function testApplicationMailer() {
  console.log('👉 [3/3] Testing Full Application Mailer Routing (lib/mailer.js)...');
  try {
    const { sendOtpEmail, sendSubscriptionInvoiceEmail } = await import('../lib/mailer.js');
    
    console.log('   Sending live OTP via auth@mymob.tech...');
    const r1 = await sendOtpEmail({
      to: targetEmail,
      otp: '729401',
      businessName: 'MyMobPay Merchant',
      purpose: 'login'
    });
    console.log(`   ✅ OTP Result: Dispatched via ${r1.provider} (ID: ${r1.id || 'ok'})`);

    console.log('   Sending live Tax Invoice via receipt@mymob.tech...');
    const r2 = await sendSubscriptionInvoiceEmail({
      to: targetEmail,
      businessName: 'Kunal Chauhan',
      planName: 'Pro Merchant Gateway License',
      amount: 499,
      utr: 'MMP938482019'
    });
    console.log(`   ✅ Invoice Result: Dispatched via ${r2.provider} (ID: ${r2.id || 'ok'})\n`);
  } catch (err) {
    console.error(`   ❌ App Mailer Error: ${err.message}\n`);
  }
}

async function run() {
  await testSendPulse();
  await testBrevo();
  await testApplicationMailer();
}

run();

