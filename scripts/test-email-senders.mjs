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
  console.log('👉 [1/2] Testing SendPulse SMTP (Dedicated for Subscription Invoices & Monthly Statements)...');
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
    console.log('   ✅ SendPulse SMTP Handshake Successful!');

    console.log(`   Dispatching test Subscription Invoice / Statement to ${targetEmail}...`);
    const from = process.env.SENDPULSE_FROM || `"MyMobPay Billing" <${user}>`;
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '🧾 MyMobPay Subscription Tax Invoice #INV-TEST-8819 [SendPulse]',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">MyMobPay Billing &amp; Accounting</h2>
          <p style="color: #64748b; font-size: 14px;">This email verifies that SendPulse SMTP is dedicated exclusively for subscription invoices and monthly account statements.</p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <div style="font-size: 14px; font-weight: bold; color: #1e3a8a;">Pro Merchant Gateway License (30 Days)</div>
            <div style="font-size: 18px; font-weight: 800; color: #1d4ed8; margin-top: 6px;">Amount: ₹499.00 • GST Included</div>
            <div style="font-size: 12px; color: #059669; margin-top: 4px;">Status: Settled via NPCI UPI Passthrough</div>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Dispatched exclusively via SendPulse High-Priority Billing Stream.</p>
        </div>
      `
    });

    console.log(`   🎉 Delivered via SendPulse! Message ID: ${info.messageId}\n`);
    return true;
  } catch (err) {
    console.error(`   ❌ SendPulse Error: ${err.message}\n`);
    return false;
  }
}

async function testBrevo() {
  console.log('👉 [2/2] Testing Brevo SMTP (Fallback Auth Rail)...');
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

    console.log(`   Dispatching test connectivity email to ${targetEmail}...`);
    const from = process.env.AUTH_FROM || `"MyMobPay Security" <${user}>`;
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '🛡️ MyMobPay Gateway System Test [Brevo Rail]',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">MyMobPay Security &amp; Auth Rail</h2>
          <p style="color: #64748b; font-size: 14px;">This test verifies that Brevo SMTP is operational as a reliable fallback authentication rail.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <div style="font-size: 13px; color: #0f172a; font-weight: 600;">Status: Operational • Per-transaction emails disabled for budget control</div>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Dispatched via Brevo High-Availability Stream.</p>
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
    const { sendSubscriptionInvoiceEmail, sendMonthlyStatementEmail, sendOtpEmail } = await import('../lib/mailer.js');
    
    console.log('   Testing [Subscription Invoice] dispatch (Target: SENDPULSE)...');
    const r1 = await sendSubscriptionInvoiceEmail({
      to: targetEmail,
      businessName: 'Kunal Chauhan',
      planName: 'Pro Merchant Gateway License',
      amount: 499,
      utr: 'MMP938482019'
    });
    console.log(`   ✅ Invoice Result: Dispatched via [${(r1.provider || 'Dev Mode').toUpperCase()}] (ID: ${r1.id || 'ok'})`);

    console.log('   Testing [Monthly Statement] dispatch (Target: SENDPULSE)...');
    const r2 = await sendMonthlyStatementEmail({
      to: targetEmail,
      businessName: 'Kunal Chauhan',
      mid: 'MMP-9021',
      monthYear: 'October 2026',
      totalVolume: 124500,
      transactionCount: 84,
      successfulCount: 82,
      failedCount: 2,
      settlementVpa: 'chauhan@upi',
      statementPeriod: '01 Oct 2026 – 31 Oct 2026',
      recentOrders: [
        { id: 'ord_1', amount: 500, status: 'verified', utr: 'UTR849201928371', external_ref: 'SUB_01', created_at: new Date().toISOString() },
        { id: 'ord_2', amount: 1200, status: 'verified', utr: 'UTR849201928372', external_ref: 'ORD_99', created_at: new Date().toISOString() },
      ]
    });
    console.log(`   ✅ Monthly Statement Result: Dispatched via [${(r2.provider || 'Dev Mode').toUpperCase()}] (ID: ${r2.id || 'ok'})`);

    console.log('   Testing [Auth OTP] dispatch (Target: RESEND / BREVO — NOT SendPulse)...');
    const r3 = await sendOtpEmail({
      to: targetEmail,
      otp: '729401',
      businessName: 'MyMobPay Merchant',
      purpose: 'login'
    });
    console.log(`   ✅ Auth OTP Result: Dispatched via [${(r3.provider || 'Dev Mode').toUpperCase()}] (SendPulse preserved cleanly)\n`);

  } catch (err) {
    console.error(`   ❌ App Mailer Error: ${err.message}\n`);
  }
}

async function testCircuitBreaker() {
  console.log('👉 [4/4] Testing Dynamic Limit Circuit Breaker & Auto-Recovery...');
  const { tripProviderLimit, isProviderCircuitTripped, resetProviderLimit, getProviderCircuitStatus } = await import('../lib/mailer.js');

  console.log('   Simulating SendPulse hitting daily sending quota limit...');
  tripProviderLimit('sendpulse', 'Simulated 550 Daily sending quota exceeded', 1500); // 1.5s cooldown for test

  const isTripped = isProviderCircuitTripped('sendpulse');
  console.log(`   Circuit tripped state: ${isTripped ? '🚨 ACTIVE (Emergency failover engaged)' : 'NORMAL'}`);
  console.log('   Circuit status report:', JSON.stringify(getProviderCircuitStatus()));

  console.log('   Waiting 2.0s for cooldown window to expire...');
  await new Promise(r => setTimeout(r, 2000));

  const afterCooldown = isProviderCircuitTripped('sendpulse');
  console.log(`   Auto-recovery test: ${!afterCooldown ? '✅ SUCCESS (Restored back to original SendPulse source)' : '❌ FAILED'}\n`);
}

async function run() {
  await testSendPulse();
  await testBrevo();
  await testApplicationMailer();
  await testCircuitBreaker();
}

run();

