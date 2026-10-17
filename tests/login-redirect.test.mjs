import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoginRedirect } from '../lib/loginRedirect.js';

const origin = 'https://mymob.tech';
const query = value => `?redirect=${encodeURIComponent(value)}`;

test('login redirects reject executable schemes and external destinations after decoding', () => {
  const rejected = [
    'javascript:alert(document.domain)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    '\n javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'blob:https://mymob.tech/example',
    'https://attacker.example/dashboard',
    '//attacker.example/dashboard',
    '/\\attacker.example/dashboard',
    '\\\\attacker.example\\dashboard',
    'https://mymob.tech.attacker.example/',
    'https://mymob.tech@attacker.example/',
    'https://mymob.tech:444/dashboard',
    'http://mymob.tech/dashboard',
    'https://[invalid',
  ];

  for (const value of rejected) {
    assert.equal(getLoginRedirect(query(value), origin), '/dashboard', value);
  }
});

test('login redirects preserve same-origin paths, query strings and fragments', () => {
  const accepted = [
    ['/dashboard', `${origin}/dashboard`],
    ['/dashboard?tab=payments&filter=a%26b#recent', `${origin}/dashboard?tab=payments&filter=a%26b#recent`],
    ['dashboard/settings', `${origin}/dashboard/settings`],
    [`${origin}/dashboard#settings`, `${origin}/dashboard#settings`],
    ['//mymob.tech/dashboard', `${origin}/dashboard`],
    [`${origin}//attacker.example/path`, `${origin}//attacker.example/path`],
    ['/%2Fattacker.example/path', `${origin}/%2Fattacker.example/path`],
    ['%2F%2Fattacker.example/path', `${origin}/%2F%2Fattacker.example/path`],
  ];

  for (const [value, expected] of accepted) {
    const target = getLoginRedirect(query(value), origin);
    assert.equal(target, expected, value);
    assert.equal(new URL(target, origin).origin, origin, value);
  }

  assert.equal(
    getLoginRedirect(query('/dashboard?tab=payments'), 'http://localhost:3000'),
    'http://localhost:3000/dashboard?tab=payments'
  );
});

test('login redirects fall back for missing destinations and normalized login loops', () => {
  for (const search of ['', '?redirect=', '?other=/dashboard']) {
    assert.equal(getLoginRedirect(search, origin), '/dashboard');
  }

  for (const value of ['/login', '/login?mode=reset', '/login/verify', '/dashboard/../login', `${origin}/login`]) {
    assert.equal(getLoginRedirect(query(value), origin), '/dashboard', value);
  }
});
