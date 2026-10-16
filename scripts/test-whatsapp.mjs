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

const targetPhone = process.argv[2] || '6396714325';

console.log('====================================================');
console.log('📱 MyMobPay WhatsApp Gateway Service Diagnostic');
console.log(`🎯 Target Phone: +91 ${targetPhone}`);
console.log(`🔗 Gateway URL: ${process.env.WHATSAPP_GATEWAY_URL}`);
console.log(`🔑 Session ID: ${process.env.WHATSAPP_GATEWAY_SESSION_ID}`);
console.log('====================================================\n');

async function test() {
  const { sendWhatsAppOtp, sendWhatsAppPaymentReceipt } = await import('../lib/whatsapp.js');

  // 1. Test WhatsApp OTP
  console.log('1. Dispatching live WhatsApp OTP code...');
  try {
    const res1 = await sendWhatsAppOtp({
      toPhone: targetPhone,
      otp: '849203',
      expiryMinutes: 5
    });
    console.log('   ✅ OTP Sent Successfully via WhatsApp!', res1);
  } catch (err) {
    console.error('   ❌ OTP WhatsApp Delivery Failed:', err.message);
  }

  // 2. Test WhatsApp Payment Receipt
  console.log('\n2. Dispatching live WhatsApp Payment Receipt...');
  try {
    const res2 = await sendWhatsAppPaymentReceipt({
      toPhone: targetPhone,
      orderId: 'MMP_WA_TEST_01',
      amount: 499,
      utr: '948201839201',
      businessName: 'MyMobPay'
    });
    console.log('   ✅ Payment Receipt Sent Successfully via WhatsApp!', res2);
  } catch (err) {
    console.error('   ❌ Receipt WhatsApp Delivery Failed:', err.message);
  }
}

test();
