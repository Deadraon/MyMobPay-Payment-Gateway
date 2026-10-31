import { NextResponse } from 'next/server';
import { askBackboard, MYMOBPAY_FINTECH_KNOWLEDGE } from '@/lib/backboardAi';

export const dynamic = 'force-dynamic';

/**
 * Intelligent Merchant Copilot Fallback Engine:
 * Provides accurate, domain-specific answers about MyMobPay even without third-party API keys.
 */
function getFintechCopilotFallback(userMessage, merchantContext = {}) {
  const query = userMessage.toLowerCase().trim();
  const bName = merchantContext.businessName || 'Merchant';

  // 1. Payment Links & Invoicing
  if (query.includes('payment link') || query.includes('create link') || query.includes('invoice') || query.includes('send link')) {
    return `### Creating a Payment Link on MyMobPay 🔗\n\n1. Go to the **Payment Links** tab in your dashboard.\n2. Click **+ Create New Link**.\n3. Enter the payable amount (₹), customer name, phone number, and optional purpose note.\n4. Click **Generate Link**.\n\nYou'll receive a dynamic payment link (\`https://mymobpay.tech/pay/...\`) and QR code that auto-verifies customer UTRs and settles directly to your bank UPI (**${merchantContext.upiId || 'your linked UPI'}**).`;
  }

  // 2. Webhooks & API Verification
  if (query.includes('webhook') || query.includes('signature') || query.includes('hmac') || query.includes('verify')) {
    return `### Verifying MyMobPay Webhooks 🔒\n\nEvery webhook payload sent to your server is cryptographically signed using **HMAC-SHA256** with your Secret Key in the \`x-webhook-signature\` header.\n\n\`\`\`javascript\n// Node.js Verification Example\nconst crypto = require('crypto');\n\nfunction verifyMyMobPaySignature(rawBody, signatureHeader, secretKey) {\n  const expectedSignature = crypto\n    .createHmac('sha256', secretKey)\n    .update(rawBody)\n    .digest('hex');\n  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));\n}\n\`\`\`\n\nYou can configure and test your webhook URL in the **Developer Console** tab.`;
  }

  // 3. 0% Commission vs Traditional Gateways
  if (query.includes('0%') || query.includes('commission') || query.includes('fee') || query.includes('razorpay') || query.includes('cashfree') || query.includes('charges')) {
    return `### 0% Commission Explained ⚡\n\nTraditional gateways (Razorpay, Cashfree, Stripe) deduct **2% to 3% + 18% GST** on every single transaction and hold your money in escrow for 2 to 3 days (T+2 settlement).\n\n**MyMobPay differences:**\n- **0% Transaction Commission:** Keep 100% of your customer payments.\n- **Direct-to-Bank Settlement:** Funds move directly from the customer's UPI app into **${merchantContext.upiId || 'your bank UPI'}** instantly.\n- **Predictable SaaS Subscription:** You only pay a flat monthly or annual platform fee.`;
  }

  // 4. UTR & Settlement Troubleshooting
  if (query.includes('utr') || query.includes('pending') || query.includes('settle') || query.includes('bank') || query.includes('delay')) {
    return `### How Settlement & UTR Verification Work 🏦\n\n- Because MyMobPay uses direct peer-to-merchant UPI rails, money **never sits in an intermediate escrow account**.\n- When a customer pays, their bank generates a unique 12-digit **UTR (Unique Transaction Reference)** number.\n- Once verified, the order status flips to \`PAID\` and triggers an instant webhook to your system.\n- If a customer claims they paid but the order shows \`PENDING\`, check the **Verification Center** tab in your dashboard to inspect or manually resolve the 12-digit UTR.`;
  }

  // 5. API Keys & Sandbox Testing
  if (query.includes('api') || query.includes('key') || query.includes('sandbox') || query.includes('test') || query.includes('curl')) {
    return `### API Keys & Sandbox Access 💻\n\n- Head to **Developer Console** in your sidebar.\n- You will find your \`Public Key\` and \`Secret Key\`.\n- To create an order programmatically:\n\n\`\`\`bash\ncurl -X POST https://mymobpay.tech/api/orders \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_PUBLIC_KEY" \\\n  -d '{\n    "amount": 499,\n    "customer_name": "Kunal",\n    "customer_phone": "9876543210",\n    "purpose": "Pro Subscription"\n  }'\n\`\`\``;
  }

  // Default Assistant Response
  return `Hello ${bName}! 👋 I am your **MyMobPay AI Copilot**.\n\nI can help you with:\n- ⚡ **Payment Links:** Generating dynamic UPI links and QR codes.\n- 💻 **Developer APIs:** HMAC-SHA256 webhooks, API keys, and cURL requests.\n- 🏦 **UTR & Settlements:** Resolving pending orders and direct bank deposits.\n- 📈 **0% Fees:** How your platform plan saves 2-3% on every order.\n\nWhat would you like to explore?`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, threadId, merchantContext } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Valid message string is required.' },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim();
    const resolvedThreadId = threadId || `merchant_copilot_${merchantContext?.id || 'guest'}`;

    // Real-time merchant profile context for AI injection
    const merchantPromptContext = `
Current Logged-in Merchant Context:
- Business / Owner Name: ${merchantContext?.businessName || 'Merchant'}
- Settlement UPI ID: ${merchantContext?.upiId || 'Not Configured Yet'}
- Account Plan Tier: ${merchantContext?.tier || 'Standard Free Trial'}
- Merchant Email: ${merchantContext?.email || 'N/A'}
- Today's Transactions: ${merchantContext?.todayCount || 0} orders
`;

    // 1. Try Backboard AI (Primary Brain with Persistent Memory)
    if (process.env.BACKBOARD_API_KEY) {
      try {
        const backboardRes = await askBackboard({
          content: cleanMessage,
          threadId: resolvedThreadId,
          systemPrompt: `You are the MyMobPay Merchant Copilot embedded directly inside the merchant dashboard.\n${merchantPromptContext}`,
          modelName: 'gpt-4o-mini',
          memory: 'Auto'
        });

        if (backboardRes.success && backboardRes.content) {
          return NextResponse.json({
            success: true,
            reply: backboardRes.content,
            threadId: backboardRes.threadId || resolvedThreadId,
            provider: 'backboard'
          });
        }
      } catch (bbErr) {
        console.warn('[COPILOT API] Backboard error, falling back:', bbErr.message);
      }
    }

    // 2. Try Google Gemini (Secondary Fallback)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const fullPrompt = `${MYMOBPAY_FINTECH_KNOWLEDGE}\n\n${merchantPromptContext}\n\nMerchant Question: "${cleanMessage}"\nProvide a clear, formatted, helpful response:`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 600,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText && aiText.trim()) {
            return NextResponse.json({
              success: true,
              reply: aiText.trim(),
              threadId: resolvedThreadId,
              provider: 'gemini'
            });
          }
        }
      } catch (geminiErr) {
        console.warn('[COPILOT API] Gemini error, falling back:', geminiErr.message);
      }
    }

    // 3. Specialized Fintech Fallback Engine (Immediate, Zero-Lag, Always Online)
    const fallbackReply = getFintechCopilotFallback(cleanMessage, merchantContext);

    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      threadId: resolvedThreadId,
      provider: 'built-in'
    });

  } catch (err) {
    console.error('[COPILOT API] Handler error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal copilot service error' },
      { status: 500 }
    );
  }
}
