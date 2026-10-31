import test from 'node:test';
import assert from 'node:assert/strict';
import { askBackboard, MYMOBPAY_FINTECH_KNOWLEDGE } from '../lib/backboardAi.js';
import { generateInstagramAiReply } from '../lib/instagramAi.js';

test('--- Backboard AI & Instagram Automation Suite ---', async (t) => {
  await t.test('1. Knowledge Base: Contains official mymobpay.tech domain and 0% commission facts', () => {
    assert.ok(MYMOBPAY_FINTECH_KNOWLEDGE.includes('mymobpay.tech'));
    assert.ok(MYMOBPAY_FINTECH_KNOWLEDGE.includes('0% transaction fee'));
    assert.ok(MYMOBPAY_FINTECH_KNOWLEDGE.includes('support@mymobpay.tech'));
  });

  await t.test('2. Backboard Graceful Degradation: Handles missing API key cleanly without throwing uncaught exceptions', async () => {
    const originalKey = process.env.BACKBOARD_API_KEY;
    delete process.env.BACKBOARD_API_KEY;

    const result = await askBackboard({
      content: 'Hello, how does UPI settlement work?'
    });

    assert.equal(result.success, false);
    assert.match(result.error, /BACKBOARD_API_KEY/i);

    if (originalKey) process.env.BACKBOARD_API_KEY = originalKey;
  });

  await t.test('3. Instagram AI Engine: Smart fallback generates instant responses for pricing queries', async () => {
    const reply = await generateInstagramAiReply({
      senderId: 'ig_test_user_999',
      messageText: 'What is your commission or pricing fee?'
    });

    assert.ok(typeof reply === 'string' && reply.length > 20);
    assert.match(reply, /0%/);
    assert.match(reply, /mymobpay\.tech/);
  });

  await t.test('4. Instagram AI Engine: Smart fallback handles integration / developer questions', async () => {
    const reply = await generateInstagramAiReply({
      senderId: 'ig_test_user_999',
      messageText: 'How do I integrate your webhook API?'
    });

    assert.ok(typeof reply === 'string' && reply.length > 20);
    assert.match(reply, /api|webhook|sandbox/i);
    assert.match(reply, /mymobpay\.tech/);
  });
});
