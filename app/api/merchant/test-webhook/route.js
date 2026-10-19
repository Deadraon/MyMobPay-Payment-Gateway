import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { isSafeWebhookUrl } from '@/lib/webhook';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // 0. Rate limiting to prevent webhook spam/flooding
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`test_webhook_${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many test webhook requests. Please wait a moment.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const body = await request.json();
    const { api_key, webhook_url, amount, note, payload } = body;

    if (!api_key) {
      return NextResponse.json({ error: 'Merchant API Key is required to authorize the test webhook.' }, { status: 400 });
    }

    if (!webhook_url) {
      return NextResponse.json({ error: 'Outbound Webhook URL is required.' }, { status: 400 });
    }

    // SSRF Guard: Strictly validate webhook target URL to block local network, loopback, and cloud metadata probes
    if (!isSafeWebhookUrl(webhook_url)) {
      console.warn(`[SSRF Block] Blocked dangerous test-webhook URL probe: ${webhook_url} from IP: ${clientIp}`);
      return NextResponse.json({
        error: 'Forbidden Webhook URL: Private networks, localhost, and cloud metadata addresses are strictly blocked.',
        code: 'SSRF_PROBE_BLOCKED'
      }, { status: 400 });
    }

    // Standard raw API key configuration
    let rawApiKey = api_key;
    if (api_key.startsWith('test_')) {
      rawApiKey = api_key.replace('test_', '');
    } else if (api_key.startsWith('live_')) {
      rawApiKey = api_key.replace('live_', '');
    }

    // Authenticate the merchant key against Supabase
    const { data: merchant, error: mErr } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('api_key', rawApiKey)
      .single();

    if (mErr || !merchant) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Merchant API Key.' }, { status: 401 });
    }

    // Generate simulated checkout verification payload
    const mockPayload = payload || {
      event: 'payment.verified',
      orderId: 'O_TEST_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      amount: parseFloat(amount) || 500.00,
      note: note || 'Test_Simulation_Order',
      utr: 'TS_MOCK_' + Math.floor(100000000000 + Math.random() * 900000000000),
      mode: 'test',
      created_at: new Date().toISOString()
    };

    const payloadString = JSON.stringify(mockPayload);

    // Compute secure cryptographic HMAC signature using API Key as secret
    const signature = crypto
      .createHmac('sha256', rawApiKey)
      .update(payloadString)
      .digest('hex');

    const startTime = Date.now();
    let responseStatus = 0;
    let responseStatusText = '';
    let responseText = '';
    let latency = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout guard

      const response = await fetch(webhook_url, {
        method: 'POST',
        redirect: 'manual', // Never follow redirects past the SSRF URL guard.
        headers: {
          'Content-Type': 'application/json',
          'X-MyMobPay-Signature': signature,
          'X-MyMobPay-Event': 'payment.verified',
          'User-Agent': 'MyMobPay-Webhook-Tester/2.0'
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      latency = Date.now() - startTime;
      responseStatus = response.status;
      responseStatusText = response.statusText;
      responseText = await response.text();
    } catch (fetchError) {
      latency = Date.now() - startTime;
      responseStatusText = fetchError.name === 'AbortError' ? 'Connection Timeout' : fetchError.message;
      responseText = 'Failed to execute outbound HTTP POST. Make sure your webhook server is online and accepting connections.';
    }

    return NextResponse.json({
      success: responseStatus >= 200 && responseStatus < 300,
      status: responseStatus,
      statusText: responseStatusText,
      latency,
      response: responseText.slice(0, 1000), // Truncate large payloads safely
      payload: mockPayload,
      signature
    }, { status: 200 });

  } catch (err) {
    console.error('Test webhook api error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
