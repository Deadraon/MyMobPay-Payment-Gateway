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

const targetEmail = process.argv[2] || 'chauhankunal695@gmail.com';

console.log('================================================================');
console.log('🌐 SERVER-LEVEL EMAIL DISPATCH TEST FOR ALL 3 PROVIDERS');
console.log(`🎯 Recipient Target: ${targetEmail}`);
console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
console.log('================================================================\n');

const results = {
  brevo: { name: 'Brevo SMTP', status: 'UNKNOWN', details: '' },
  sendpulse: { name: 'SendPulse SMTP', status: 'UNKNOWN', details: '' },
  resend: { name: 'Resend API', status: 'UNKNOWN', details: '' },
  liveServerApi: { name: 'Live Server Endpoint (https://www.mymob.tech)', status: 'UNKNOWN', details: '' }
};

// 1. TEST BREVO
async function testBrevo() {
  console.log('--- [PROVIDER 1/3] BREVO SMTP (smtp-relay.brevo.com:587) ---');
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS;

  if (!user || !pass) {
    results.brevo.status = 'NOT CONFIGURED';
    results.brevo.details = 'Missing BREVO_SMTP_USER or BREVO_SMTP_KEY in .env.local';
    console.log(`❌ ${results.brevo.details}\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
      secure: false,
      auth: { user, pass }
    });

    console.log('   Testing SMTP Handshake to smtp-relay.brevo.com:587...');
    await transporter.verify();
    console.log('   ✅ SMTP Handshake Successful!');

    console.log(`   Dispatching live verification email to ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: process.env.AUTH_FROM || 'MyMobPay Security <auth@mymob.tech>',
      to: targetEmail,
      subject: `✅ MyMobPay Server Verification • Brevo Live Test [${new Date().toLocaleTimeString('en-IN')}]`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #059669;">Brevo Email Service: OPERATIONAL ✓</h2>
          <p>This email confirms that the server is successfully connected to Brevo SMTP and able to deliver emails.</p>
          <p style="font-size: 12px; color: #64748b;">Delivered via Brevo Relay (smtp-relay.brevo.com:587)</p>
        </div>
      `
    });

    results.brevo.status = 'WORKING';
    results.brevo.details = `Delivered! Message ID: ${info.messageId}`;
    console.log(`   🎉 ${results.brevo.details}\n`);
  } catch (err) {
    results.brevo.status = 'FAILED';
    results.brevo.details = err.message;
    console.error(`   ❌ Brevo Error: ${err.message}\n`);
  }
}

// 2. TEST SENDPULSE
async function testSendPulse() {
  console.log('--- [PROVIDER 2/3] SENDPULSE SMTP (smtp-pulse.com:465) ---');
  const user = process.env.SENDPULSE_SMTP_USER;
  const pass = process.env.SENDPULSE_SMTP_PASS;

  if (!user || !pass) {
    results.sendpulse.status = 'NOT CONFIGURED';
    results.sendpulse.details = 'SENDPULSE_SMTP_USER and/or SENDPULSE_SMTP_PASS are empty in .env.local';
    console.log(`⚠️  ${results.sendpulse.details}`);
    console.log('   (SendPulse is designated for Subscription Tax Invoices & Monthly Statements)');
    console.log('   Action required: Add credentials to .env.local line 23-24.\n');
    return;
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

    console.log(`   Dispatching live invoice email to ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: process.env.SENDPULSE_FROM || 'MyMobPay Billing <trx@mymob.tech>',
      to: targetEmail,
      subject: `🧾 MyMobPay Server Verification • SendPulse Live Test [${new Date().toLocaleTimeString('en-IN')}]`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">SendPulse Email Service: OPERATIONAL ✓</h2>
          <p>This email confirms that SendPulse SMTP is connected and sending subscription invoices & monthly statements.</p>
        </div>
      `
    });

    results.sendpulse.status = 'WORKING';
    results.sendpulse.details = `Delivered! Message ID: ${info.messageId}`;
    console.log(`   🎉 ${results.sendpulse.details}\n`);
  } catch (err) {
    results.sendpulse.status = 'FAILED';
    results.sendpulse.details = err.message;
    console.error(`   ❌ SendPulse Error: ${err.message}\n`);
  }
}

// 3. TEST RESEND
async function testResend() {
  console.log('--- [PROVIDER 3/3] RESEND REST API (https://api.resend.com/emails) ---');
  const resendApiKey = process.env.RESEND_API_KEY || (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('re_') ? process.env.SMTP_PASS : null);

  if (!resendApiKey) {
    results.resend.status = 'NOT CONFIGURED';
    results.resend.details = 'RESEND_API_KEY is empty or missing in .env.local';
    console.log(`⚠️  ${results.resend.details}`);
    console.log('   (Resend is designated for Instant Auth OTPs & Merchant Welcome Emails)');
    console.log('   Action required: Add RESEND_API_KEY=re_... to .env.local.\n');
    return;
  }

  try {
    console.log('   Connecting to https://api.resend.com/emails...');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.AUTH_FROM || 'MyMobPay Security <auth@mymob.tech>',
        to: [targetEmail],
        subject: `⚡ MyMobPay Server Verification • Resend API Test [${new Date().toLocaleTimeString('en-IN')}]`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #7c3aed;">Resend API Service: OPERATIONAL ✓</h2>
            <p>This email confirms that Resend API is authenticated and sending instant OTPs.</p>
          </div>
        `
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Resend API Error HTTP ${res.status}: ${errData.message || res.statusText}`);
    }

    const data = await res.json();
    results.resend.status = 'WORKING';
    results.resend.details = `Delivered! Message ID: ${data.id}`;
    console.log(`   🎉 ${results.resend.details}\n`);
  } catch (err) {
    results.resend.status = 'FAILED';
    results.resend.details = err.message;
    console.error(`   ❌ Resend Error: ${err.message}\n`);
  }
}

// 4. TEST LIVE DEPLOYED WEB SERVER ENDPOINT
async function testLiveServerEndpoint() {
  console.log('--- [4] TESTING LIVE CLOUD PRODUCTION SERVER (https://www.mymob.tech) ---');
  try {
    const res = await fetch('https://www.mymob.tech/api/auth/email-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        type: 'otp',
        purpose: 'login'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      results.liveServerApi.status = 'WORKING';
      results.liveServerApi.details = `HTTP ${res.status}: ${data.message}`;
      console.log(`   ✅ Live Server Dispatch Succeeded! Message: "${data.message}"\n`);
    } else {
      results.liveServerApi.status = 'ERROR';
      results.liveServerApi.details = `HTTP ${res.status}: ${data.error || JSON.stringify(data)}`;
      console.log(`   ⚠️ Live Server Returned: ${results.liveServerApi.details}\n`);
    }
  } catch (e) {
    results.liveServerApi.status = 'UNREACHABLE';
    results.liveServerApi.details = e.message;
    console.error(`   ❌ Live Server Connection Error: ${e.message}\n`);
  }
}

async function run() {
  await testBrevo();
  await testSendPulse();
  await testResend();
  await testLiveServerEndpoint();

  console.log('================================================================');
  console.log('📋 FINAL SUMMARY REPORT FOR SERVER EMAIL SERVICES');
  console.log('================================================================');
  for (const [key, info] of Object.entries(results)) {
    console.log(`• ${info.name}: [${info.status}]`);
    console.log(`  Details: ${info.details}`);
  }
  console.log('================================================================\n');
}

run();
