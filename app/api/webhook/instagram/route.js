import { NextResponse } from 'next/server';
import { generateInstagramAiReply, sendInstagramDm } from '@/lib/instagramAi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhook/instagram
 * Handles Meta Webhook Verification (hub.challenge handshake)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const expectedVerifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'mymobpay_ig_secret_2026';

    if (mode === 'subscribe' && token === expectedVerifyToken) {
      console.log('[INSTAGRAM WEBHOOK] Verified successfully with Meta!');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[INSTAGRAM WEBHOOK] Token mismatch:', { received: token, expected: expectedVerifyToken });
    return new Response('Forbidden: Verification token mismatch', { status: 403 });
  } catch (err) {
    console.error('[INSTAGRAM WEBHOOK] GET error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/webhook/instagram
 * Receives incoming Instagram Direct Messages & comments from Meta
 */
export async function POST(req) {
  try {
    const body = await req.json();

    // Verify it is an Instagram event
    if (body.object !== 'instagram' && body.object !== 'page') {
      return NextResponse.json({ error: 'Not an instagram event' }, { status: 404 });
    }

    // Process entries asynchronously
    if (Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        // 1. Direct Messaging Events
        if (Array.isArray(entry.messaging)) {
          for (const event of entry.messaging) {
            const senderId = event?.sender?.id;
            const message = event?.message;

            // Skip echoes (messages sent by our own account) or empty text
            if (!senderId || !message || message.is_echo || !message.text) {
              continue;
            }

            console.log(`[INSTAGRAM WEBHOOK] Incoming DM from ${senderId}: "${message.text}"`);

            // Generate AI reply with MyMobPay context & Supabase DB integration
            generateInstagramAiReply({
              senderId,
              messageText: message.text,
            }).then(async (replyText) => {
              if (replyText) {
                console.log(`[INSTAGRAM WEBHOOK] Sending reply to ${senderId}: "${replyText}"`);
                await sendInstagramDm({
                  recipientId: senderId,
                  text: replyText,
                });
              }
            }).catch((err) => {
              console.error('[INSTAGRAM WEBHOOK] Async AI reply error:', err);
            });
          }
        }
      }
    }

    // Immediately return 200 OK to Meta to acknowledge receipt
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });

  } catch (err) {
    console.error('[INSTAGRAM WEBHOOK] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
