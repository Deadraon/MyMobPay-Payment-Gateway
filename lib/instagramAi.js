import { supabaseAdmin } from './supabase.js';

// System prompt defining MyMobPay knowledge base
const MYMOBPAY_SYSTEM_PROMPT = `
You are the official AI Sales & Merchant Specialist for MyMobPay (@mymobpay) on Instagram.
Your job is to answer merchant, founder, and business queries friendly, concisely, and persuasively in Instagram Direct Messages (DMs).

Key Facts about MyMobPay (mymob.tech):
1. What is MyMobPay?
   - India's direct-to-bank P2P UPI payment gateway with 0% transaction commission.
   - Built specifically for SaaS founders, digital businesses, e-commerce, and indie makers.
2. Core Advantages over Razorpay / Cashfree:
   - 0% transaction cuts (save 2-3% on every payment).
   - Money settles directly and instantly into the merchant's own bank account via UPI.
   - Flat, predictable subscription instead of eating transaction profits.
   - Dynamic QR codes generated on the fly.
   - Automated UTR verification and instant HMAC-SHA256 signed developer webhooks.
   - WhatsApp OTP merchant onboarding in under 2 minutes.
   - Free sandbox environment for testing.
3. Official Links:
   - Website: https://www.mymob.tech
   - Merchant Signup / Login: https://www.mymob.tech/login
   - Support: support@mymob.tech

Instructions:
- Keep answers under 3-4 short sentences so they are easy to read in Instagram DMs.
- Be warm, professional, and Indian-founder friendly. Use a few tasteful emojis (⚡, 💳, 🚀).
- Always include the relevant link when appropriate (e.g. signup link for new users).
- Never make up fake pricing tiers or promise banking features beyond UPI.
`.trim();

/**
 * Intelligent Fallback Engine: Answers questions if GEMINI_API_KEY is not yet supplied.
 */
function getSmartFallbackReply(messageText, orderContext = null) {
  const lower = messageText.toLowerCase().trim();

  // 1. Order status check
  if (orderContext) {
    const statusEmoji = orderContext.status === 'paid' ? '✅' : orderContext.status === 'pending' ? '⏳' : '❌';
    return `${statusEmoji} Order #${orderContext.id.slice(0, 8)} status is: ${orderContext.status.toUpperCase()}.\nAmount: ₹${orderContext.amount}.\nSettlement to: ${orderContext.upi_id || 'Merchant UPI'}.\n\nNeed further help? Visit https://www.mymob.tech`;
  }

  // 2. Pricing / Fee queries
  if (lower.includes('price') || lower.includes('cost') || lower.includes('fee') || lower.includes('charge') || lower.includes('commission') || lower.includes('rate')) {
    return `⚡ MyMobPay has 0% transaction fees! Unlike traditional gateways that take 2-3% of your revenue, every rupee settles directly to your bank account with a flat subscription.\n\nStart collecting free at https://www.mymob.tech/login`;
  }

  // 3. How it works / Details
  if (lower.includes('how it work') || lower.includes('how does it work') || lower.includes('what is') || lower.includes('detail') || lower.includes('about')) {
    return `🚀 MyMobPay is a direct P2P UPI gateway. When your customer pays via UPI QR or intent, the funds route directly into your bank UPI with 0% gateway cuts. We auto-verify UTRs and trigger instant webhooks to your server!\n\nCheck out a live demo at https://www.mymob.tech`;
  }

  // 4. Registration / Sign up
  if (lower.includes('register') || lower.includes('sign up') || lower.includes('create account') || lower.includes('join') || lower.includes('login') || lower.includes('start')) {
    return `📲 You can create your merchant account in under 2 minutes!\n\nSimply log in with your WhatsApp OTP, connect your settlement UPI ID, and start collecting:\n👉 https://www.mymob.tech/login`;
  }

  // 5. Developers / Webhooks / API
  if (lower.includes('api') || lower.includes('webhook') || lower.includes('doc') || lower.includes('integrate') || lower.includes('code') || lower.includes('sdk')) {
    return `💻 We offer clean REST APIs with HMAC-SHA256 signed developer webhooks and a full sandbox testing suite.\n\nExplore our developer docs and console at https://www.mymob.tech/login`;
  }

  // 6. Security / NPCI / Trust
  if (lower.includes('safe') || lower.includes('secure') || lower.includes('legal') || lower.includes('npci') || lower.includes('fraud')) {
    return `🔒 100% Secure & Compliant. MyMobPay operates over standard NPCI UPI rails with 256-bit SSL encryption. All payments settle straight to your verified bank account without intermediaries holding your money.`;
  }

  // 7. Human Support / Contact
  if (lower.includes('support') || lower.includes('human') || lower.includes('help') || lower.includes('call') || lower.includes('email') || lower.includes('phone')) {
    return `👋 Our team is here to help! You can reach our dedicated merchant support anytime at support@mymob.tech or visit https://www.mymob.tech`;
  }

  // 8. General Greeting
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste') || lower === 'yo') {
    return `Hey there! 👋 Welcome to MyMobPay (@mymobpay) — India's 0% fee direct-to-bank UPI payment gateway.\n\nHow can I help you today? You can ask about our 0% fees, API integration, or create an account at https://www.mymob.tech/login`;
  }

  // 9. Default polite reply
  return `Thanks for reaching out to MyMobPay! ⚡ We help businesses accept direct UPI payments with 0% transaction fees and automated UTR verification.\n\nExplore features or create your free account here: https://www.mymob.tech/login\nOr tell me what questions you have!`;
}

/**
 * Searches Supabase for an order if the user provided an order ID in their text
 */
async function checkOrderContext(messageText) {
  try {
    // Match UUID format or ord_... or 8+ hex characters
    const uuidMatch = messageText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const ordMatch = messageText.match(/ord_[a-zA-Z0-9]+/i);
    const idToLookup = uuidMatch ? uuidMatch[0] : (ordMatch ? ordMatch[0] : null);

    if (idToLookup) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, amount, status, upi_id, created_at')
        .eq('id', idToLookup)
        .limit(1)
        .maybeSingle();

      return order || null;
    }
  } catch (err) {
    console.warn('[INSTAGRAM AI] Order context check error:', err);
  }
  return null;
}

/**
 * Generates an AI reply using Google Gemini API (or intelligent fallback)
 */
export async function generateInstagramAiReply({ senderId, messageText }) {
  if (!messageText || typeof messageText !== 'string') {
    return "Hey! Thanks for messaging MyMobPay. How can we help your business today?";
  }

  const cleanText = messageText.trim();
  const orderContext = await checkOrderContext(cleanText);

  // If Gemini API Key is provided, call Google Gemini 1.5 Flash
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      let promptWithContext = `${MYMOBPAY_SYSTEM_PROMPT}\n\n`;
      if (orderContext) {
        promptWithContext += `Customer provided Order Context from database:
- Order ID: ${orderContext.id}
- Amount: ₹${orderContext.amount}
- Status: ${orderContext.status}
- Settlement UPI: ${orderContext.upi_id || 'N/A'}\n\n`;
      }
      promptWithContext += `Customer Instagram Message: "${cleanText}"\nProvide your helpful, concise response:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptWithContext }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText && aiText.trim()) {
          return aiText.trim();
        }
      } else {
        console.warn('[INSTAGRAM AI] Gemini API returned status:', response.status);
      }
    } catch (aiErr) {
      console.error('[INSTAGRAM AI] Gemini generation error, using fallback:', aiErr);
    }
  }

  // Fallback engine
  return getSmartFallbackReply(cleanText, orderContext);
}

/**
 * Sends a direct message reply to an Instagram user via Meta Graph API
 */
export async function sendInstagramDm({ recipientId, text }) {
  const pageAccessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!pageAccessToken) {
    console.warn('[INSTAGRAM AI] INSTAGRAM_PAGE_ACCESS_TOKEN is not configured. Reply would have been:', text);
    return { success: false, reason: 'missing_token', text };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[INSTAGRAM AI] Meta Graph API send error:', data);
      return { success: false, error: data };
    }

    return { success: true, messageId: data.message_id || data.recipient_id };
  } catch (err) {
    console.error('[INSTAGRAM AI] Error sending DM to Instagram:', err);
    return { success: false, error: err.message };
  }
}
