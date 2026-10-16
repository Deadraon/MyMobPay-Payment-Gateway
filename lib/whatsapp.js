/**
 * MyMobPay WhatsApp Gateway Service
 * Integrates with WebotApp WhatsGateway (or fallback Meta Cloud API)
 */

const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001';
const WHATSAPP_GATEWAY_SESSION_ID = process.env.WHATSAPP_GATEWAY_SESSION_ID || 'irn8se';
const WHATSAPP_GATEWAY_API_KEY = process.env.WHATSAPP_GATEWAY_API_KEY || 'wag_TsxCT2R_ExyNxgcOwF6KsfGQtghtw7H0';

// Meta Cloud API Fallback
const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Format any Indian phone number into standard international digits (e.g. 916396714325)
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length > 10) {
    return digits;
  }
  return null;
}

/**
 * Check if WhatsApp Gateway is configured and ready
 */
export function isWhatsAppConfigured() {
  return Boolean((WHATSAPP_GATEWAY_URL && WHATSAPP_GATEWAY_SESSION_ID) || (WA_ACCESS_TOKEN && WA_PHONE_ID));
}

/**
 * Send a WhatsApp text message via WhatsGateway with automatic retry & fallback
 */
export async function sendWhatsAppMessage({ toPhone, message }) {
  const cleanPhone = formatWhatsAppPhone(toPhone);
  if (!cleanPhone) {
    throw new Error(`Invalid phone number for WhatsApp delivery: ${toPhone}`);
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  // 1. Primary: WebotApp WhatsGateway
  if (WHATSAPP_GATEWAY_URL && WHATSAPP_GATEWAY_SESSION_ID) {
    try {
      const endpoint = `${WHATSAPP_GATEWAY_URL.replace(/\/+$/, '')}/api/messages/${WHATSAPP_GATEWAY_SESSION_ID}/${encodeURIComponent(jid)}/send`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': WHATSAPP_GATEWAY_API_KEY,
        },
        body: JSON.stringify({
          message: { text: message }
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.status === true || data.success === true)) {
        return { success: true, provider: 'whats-gateway', messageId: data.data?.key?.id || data.messageId };
      }

      console.warn(`[WHATSAPP GATEWAY] Non-200 or failure from gateway:`, data);
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    } catch (gwErr) {
      console.warn(`[WHATSAPP GATEWAY] Primary dispatch error: ${gwErr.message}. Checking Meta fallback...`);
      if (!WA_ACCESS_TOKEN || !WA_PHONE_ID) {
        throw gwErr;
      }
    }
  }

  // 2. Fallback: Meta Cloud API (if configured)
  if (WA_ACCESS_TOKEN && WA_PHONE_ID) {
    const metaUrl = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;
    const res = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message }
      }),
    });

    const metaData = await res.json().catch(() => ({}));
    if (!res.ok || metaData.error) {
      throw new Error(metaData.error?.message || `Meta API error (${res.status})`);
    }

    return { success: true, provider: 'meta-cloud', messageId: metaData.messages?.[0]?.id };
  }

  throw new Error('No WhatsApp messaging service is configured');
}

/**
 * Dispatch an official 6-digit OTP via WhatsApp
 */
export async function sendWhatsAppOtp({ toPhone, otp, expiryMinutes = 5 }) {
  const message = 
`🔐 *MyMobPay Verification Code*

Your single-use sign in code is: *${otp}*

⏱️ Valid for ${expiryMinutes} minutes.
⚠️ Never share this code or your UPI PIN with anyone.

🌐 https://mymob.tech`;

  return sendWhatsAppMessage({ toPhone, message });
}

/**
 * Dispatch an official Payment Confirmation Receipt via WhatsApp
 */
export async function sendWhatsAppPaymentReceipt({
  toPhone,
  orderId,
  amount,
  utr,
  businessName = 'MyMobPay Merchant'
}) {
  const formattedAmt = parseFloat(amount || 0).toFixed(2);
  const message =
`🧾 *Payment Confirmation • MyMobPay*

Hello! Your payment has been received and verified successfully.

💰 *Amount:* ₹${formattedAmt}
🔖 *Order ID:* ${orderId}
⚡ *UPI UTR / Ref:* ${utr}
🏢 *Merchant:* ${businessName}
📅 *Settlement Rail:* Instant Direct-to-Bank

Thank you for paying with MyMobPay!
🌐 https://mymob.tech`;

  return sendWhatsAppMessage({ toPhone, message });
}
