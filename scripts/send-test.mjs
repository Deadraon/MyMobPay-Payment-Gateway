import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'b5abea001@smtp-brevo.com',
    pass: process.env.SMTP_PASS || process.env.BREVO_API_KEY
  }
});

async function main() {
  const time = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const recipient = 'chauhankunal695@gmail.com';

  console.log(`🚀 Dispatching live test emails to: ${recipient}`);

  // Test 1: From auth@mymob.tech
  console.log('\n1. Sending OTP email from auth@mymob.tech...');
  const info1 = await transporter.sendMail({
    from: 'MyMobPay Security <auth@mymob.tech>',
    to: recipient,
    subject: `🔐 Your Verification Code: 492015 • MyMobPay [${time}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <div style="margin-bottom: 20px;">
          <span style="background: #eff6ff; color: #1d4ed8; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
            Official Security Notification
          </span>
        </div>
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Your Single-Use Passcode</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Use this code to sign in to your MyMobPay merchant account. Never share this code with anyone.</p>
        <div style="background: #f8fafc; border: 2px dashed #93c5fd; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #2563eb;">492015</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">Sent directly from: <strong>auth@mymob.tech</strong><br/>Delivery Rail: Verified Brevo SMTP<br/>Timestamp: ${time} IST</p>
      </div>
    `
  });
  console.log(`   ✅ Success! Delivered from auth@mymob.tech (ID: ${info1.messageId})`);

  // Test 2: From receipt@mymob.tech
  console.log('\n2. Sending Payment Receipt from receipt@mymob.tech...');
  const info2 = await transporter.sendMail({
    from: 'MyMobPay Billing <receipt@mymob.tech>',
    to: recipient,
    subject: `🧾 Payment Confirmation: Order #MMP_948210 • MyMobPay [${time}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <div style="margin-bottom: 20px;">
          <span style="background: #ecfdf5; color: #047857; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
            Payment Verified ✓
          </span>
        </div>
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Payment Confirmed</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
            <span style="color: #64748b;">Amount Paid:</span>
            <strong style="color: #0f172a; font-size: 16px;">₹499.00</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span style="color: #64748b;">Order ID:</span>
            <span style="color: #0f172a; font-family: monospace;">MMP_948210</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: #64748b;">UPI Rail:</span>
            <span style="color: #059669; font-weight: bold;">Instant Settlement (0% MDR)</span>
          </div>
        </div>
        <p style="color: #64748b; font-size: 12px;">Sent directly from: <strong>receipt@mymob.tech</strong><br/>Delivery Rail: Verified Brevo SMTP<br/>Timestamp: ${time} IST</p>
      </div>
    `
  });
  console.log(`   ✅ Success! Delivered from receipt@mymob.tech (ID: ${info2.messageId})`);

  console.log('\n🎉 Both emails sent successfully! Check your inbox now.');
}

main().catch(console.error);
