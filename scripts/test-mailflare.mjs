import fs from 'fs';

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const apiKey = env.MAILFLARE_SMTP_PASS || env.MAILFLARE_API_KEY;
const baseUrl = `https://${env.MAILFLARE_SMTP_HOST || 'email.mymobpay.tech'}`;

async function run() {
  console.log('=== Mailflare Integration Diagnostic ===');
  console.log('Host:', baseUrl);
  console.log('API Key Present:', Boolean(apiKey));
  console.log('Mailbox ID Present:', Boolean(env.MAILFLARE_MAILBOX_ID));

  if (!apiKey) {
    console.error('❌ MAILFLARE_SMTP_PASS or MAILFLARE_API_KEY is missing from .env.local');
    return;
  }

  // 1. Test Key Authentication
  console.log('\nStep 1: Testing API Key Authentication with Mailflare...');
  try {
    const probe = await fetch(`${baseUrl}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({})
    });

    if (probe.status === 401) {
      console.error('❌ API Key was rejected (HTTP 401 Unauthorized). Please check your key at email.mymobpay.tech/settings/api-keys');
      return;
    } else if (probe.status === 400) {
      console.log('✅ API Key is AUTHENTICATED and VALID! (Schema validation active)');
    } else {
      console.log(`ℹ️ Endpoint responded with HTTP ${probe.status}`);
    }
  } catch (err) {
    console.error('❌ Network error connecting to Mailflare:', err.message);
    return;
  }

  // 2. Check Mailbox ID
  if (!env.MAILFLARE_MAILBOX_ID) {
    console.log('\n⚠️ ACTION REQUIRED:');
    console.log('To send emails, Mailflare requires a `MAILFLARE_MAILBOX_ID`.');
    console.log('How to get your Mailbox ID:');
    console.log('1. Go to https://email.mymobpay.tech and open your mailbox (e.g. noreply@mymobpay.tech)');
    console.log('2. Look at the URL in your address bar (e.g. https://email.mymobpay.tech/m/<MAILBOX_ID>)');
    console.log('3. Add to your .env.local: MAILFLARE_MAILBOX_ID=<MAILBOX_ID>');
    console.log('--------------------------------------------------');
    return;
  }

  // 3. Dispatch Test Email
  console.log('\nStep 2: Sending Test Email...');
  const payload = {
    mailboxId: env.MAILFLARE_MAILBOX_ID,
    from: env.MAILFLARE_FROM || 'MyMobPay <noreply@mymobpay.tech>',
    to: 'chauhankunal695@gmail.com',
    subject: `🚀 Live Test: Mailflare Connected [${new Date().toLocaleTimeString('en-IN')}]`,
    html: `<div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">🎉 Mailflare Connected Successfully!</h2>
      <p style="color: #334155; line-height: 1.6;">Your self-hosted Mailflare email engine (<strong>email.mymobpay.tech</strong>) is active and transmitting emails cleanly for <strong>MyMobPay</strong>.</p>
    </div>`,
    text: 'Mailflare is connected and sending emails successfully for MyMobPay.'
  };

  try {
    const res = await fetch(`${baseUrl}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload)
    });

    const body = await res.text();
    if (res.ok) {
      console.log('✅ Mailflare email delivered successfully!');
      console.log('Response:', body);
    } else {
      console.log('❌ Request returned error status:', res.status, body);
    }
  } catch (err) {
    console.error('❌ Network error sending email:', err.message);
  }
}

run();
