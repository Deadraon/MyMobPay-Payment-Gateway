import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCallbackUrl, navigateToCallback } from '../lib/callbackUrl.js';

const origin = 'https://payments.example';
const unsafeCallbacks = [
  'javascript:alert(document.domain)',
  '  JaVaScRiPt:alert(1)',
  'java\nscript:alert(1)',
  'java\tscript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'intent://merchant/return',
  'https://[invalid',
  'http://',
  '',
  '   ',
  null,
  undefined,
  42,
  { toString: () => 'https://merchant.example' },
];

test('callbacks reject executable schemes, malformed URLs and non-string values', () => {
  for (const value of unsafeCallbacks) {
    assert.equal(parseCallbackUrl(value, origin), null, JSON.stringify(value));
  }
  const decoded = new URLSearchParams('callback=javascript%3Aalert%281%29').get('callback');
  assert.equal(parseCallbackUrl(decoded, origin), null);
});

test('callbacks preserve HTTP(S), legacy hostnames and relative returns', () => {
  for (const [value, expected] of [
    ['https://merchant.example/return?cart=123#receipt', 'https://merchant.example/return?cart=123#receipt'],
    [' HTTP://merchant.example/return ', 'http://merchant.example/return'],
    ['merchant.example/return', 'https://merchant.example/return'],
    ['/dashboard', `${origin}/dashboard`],
    ['//merchant.example/return', 'https://merchant.example/return'],
  ]) {
    assert.equal(parseCallbackUrl(value, origin)?.href, expected);
  }
  assert.equal(parseCallbackUrl('https://merchant.example/return')?.protocol, 'https:');
});

test('navigation blocks unsafe stored and query callbacks, and preserves receipt parameters', (t) => {
  const replacements = [];
  const location = { origin, href: `${origin}/pay`, replace: value => replacements.push(value) };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location } });

  for (const callback of unsafeCallbacks) {
    assert.equal(navigateToCallback(callback), false);
    assert.equal(navigateToCallback(callback, { status: 'failed' }, true), false);
    assert.equal(location.href, `${origin}/pay`);
    assert.deepEqual(replacements, []);
  }

  assert.equal(navigateToCallback('https://merchant.example/return?cart=123#receipt', {
    status: 'verified', order_id: 'order_123', utr: '123456789012', ref: null,
  }), true);
  const target = new URL(location.href);
  assert.equal(target.origin, 'https://merchant.example');
  assert.equal(target.searchParams.get('cart'), '123');
  assert.equal(target.searchParams.get('status'), 'verified');
  assert.equal(target.searchParams.get('order_id'), 'order_123');
  assert.equal(target.searchParams.get('utr'), '123456789012');
  assert.equal(target.searchParams.has('ref'), false);
  assert.equal(target.hash, '#receipt');

  assert.equal(navigateToCallback('/dashboard', { status: 'cancelled' }, true), true);
  assert.deepEqual(replacements, [`${origin}/dashboard?status=cancelled`]);
});

test('navigation does nothing outside the browser', () => {
  assert.equal(navigateToCallback('https://merchant.example/return'), false);
});
