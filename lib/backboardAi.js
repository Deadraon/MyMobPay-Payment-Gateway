/**
 * Backboard AI Universal Client for MyMobPay
 * Documentation: https://docs.backboard.io
 * REST API: POST https://app.backboard.io/api/threads/messages
 */

const BACKBOARD_API_BASE = 'https://app.backboard.io/api';

/**
 * Standard fintech knowledge base for MyMobPay assistants
 */
export const MYMOBPAY_FINTECH_KNOWLEDGE = `
You are the official AI Specialist for MyMobPay (https://mymobpay.tech) — India's premier 0% transaction fee direct-to-bank UPI payment gateway infrastructure.

Core MyMobPay Architecture & Facts:
1. What is MyMobPay?
   - India's direct-to-bank peer-to-merchant UPI payment gateway with 0% transaction commission.
   - Built specifically for SaaS founders, digital businesses, e-commerce, freelancers, and indie makers.
2. Advantages over Razorpay, Cashfree & Stripe:
   - 0% transaction commission cuts (traditional gateways take 2-3% of merchant revenue).
   - Instant direct settlement into merchant's own bank account via NPCI UPI rails without 2-3 day escrow holding.
   - Flat, predictable platform subscription instead of eating transaction profits.
   - Automated 12-digit UTR verification engine.
   - Dynamic QR codes generated on the fly for every order.
   - Instant HMAC-SHA256 signed developer webhooks.
   - Free sandbox environment for instant local/staging testing.
3. Developer & Integration Guide:
   - REST API endpoints for creating orders, generating payment links, and verifying UTRs.
   - Webhook security: Signatures sent in 'x-webhook-signature' header using HMAC-SHA256 with the merchant's API secret.
   - WhatsApp Gateway runs 24/7 on wa.mymobpay.tech for instant login OTPs and transaction receipts.
4. Official Contact & Links:
   - Website: https://mymobpay.tech
   - Merchant Dashboard & Login: https://mymobpay.tech/login
   - Support Email: support@mymobpay.tech
   - Billing & Statements: trx@mymobpay.tech
   - Security & Auth: auth@mymobpay.tech

Tone & Guidelines:
- Be concise, helpful, friendly, and technically accurate.
- When answering developers, provide practical code snippets (JavaScript/Node.js, cURL, Python).
- When answering merchants/customers, be warm, professional, and reassuring.
`.trim();

/**
 * Sends a message to the Backboard AI API with persistent memory
 *
 * @param {Object} options
 * @param {string} options.content - The user message text
 * @param {string} [options.threadId] - Persistent thread ID (e.g. ig_12345 or merchant_uuid)
 * @param {string} [options.assistantId] - Backboard Assistant ID from dashboard
 * @param {string} [options.systemPrompt] - Custom turn instructions or additional context
 * @param {string} [options.modelName] - Target model (default: 'gpt-4o-mini' or 'gemini-1.5-flash')
 * @param {string} [options.llmProvider] - LLM provider (default: 'openai' or 'google')
 * @param {string} [options.memory] - Memory mode: 'Auto' | 'Readonly' | 'off' (default: 'Auto')
 * @returns {Promise<{success: boolean, content?: string, threadId?: string, assistantId?: string, error?: string}>}
 */
export async function askBackboard({
  content,
  threadId = null,
  assistantId = null,
  systemPrompt = null,
  modelName = 'gpt-4o-mini',
  llmProvider = 'openai',
  memory = 'Auto'
}) {
  const apiKey = process.env.BACKBOARD_API_KEY;
  const configuredAssistantId = assistantId || process.env.BACKBOARD_ASSISTANT_ID;

  if (!apiKey) {
    return {
      success: false,
      error: 'BACKBOARD_API_KEY is not configured in environment variables.'
    };
  }

  if (!content || typeof content !== 'string') {
    return {
      success: false,
      error: 'Message content is required.'
    };
  }

  try {
    const payload = {
      content: content.trim(),
      llm_provider: llmProvider,
      model_name: modelName,
      stream: false,
      memory: memory // Enables persistent thread memory
    };

    if (configuredAssistantId) {
      payload.assistant_id = configuredAssistantId;
    }

    if (threadId) {
      payload.thread_id = threadId;
    }

    // Combine knowledge base with turn-specific system prompt
    const fullSystemPrompt = systemPrompt
      ? `${MYMOBPAY_FINTECH_KNOWLEDGE}\n\nAdditional Real-time Context:\n${systemPrompt}`
      : MYMOBPAY_FINTECH_KNOWLEDGE;

    payload.system_prompt = fullSystemPrompt;

    const res = await fetch(`${BACKBOARD_API_BASE}/threads/messages`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[BACKBOARD AI] HTTP ${res.status}:`, errText);
      return {
        success: false,
        error: `Backboard API responded with status ${res.status}: ${errText}`
      };
    }

    const data = await res.json();

    // Extract message content defensively
    const replyText = data?.content || data?.message || data?.response || (Array.isArray(data?.messages) && data.messages[0]?.content);

    if (!replyText) {
      return {
        success: false,
        error: 'Empty response returned from Backboard AI.'
      };
    }

    return {
      success: true,
      content: replyText.trim(),
      threadId: data.thread_id || threadId,
      assistantId: data.assistant_id || configuredAssistantId
    };

  } catch (err) {
    console.error('[BACKBOARD AI] Fetch error:', err);
    return {
      success: false,
      error: err.message || 'Unknown network error connecting to Backboard AI.'
    };
  }
}
