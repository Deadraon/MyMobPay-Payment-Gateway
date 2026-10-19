import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaymentReturnUrl } from '../lib/paymentReturnUrl.js';

const checkoutUrl = 'https://pay.example/pay?order_id=test';

test('merchant returns preserve HTTP/HTTPS destinations and relative URLs', () => {
  for (const [callback, expected] of [
    ['https://merchant.example/done?order=123#receipt', 'https://merchant.example/done?order=123#receipt'],
    ['http://merchant.example/done', 'http://merchant.example/done'],
    [' HTTPS://merchant.example/done ', 'https://merchant.example/done'],
    ['/done?order=123', 'https://pay.example/done?order=123'],
    ['done', 'https://pay.example/done'],
    ['//merchant.example/done', 'https://merchant.example/done'],
  ]) {
    assert.equal(getPaymentReturnUrl(callback, checkoutUrl)?.href, expected);
  }
});

test('merchant returns reject executable and other non-web protocols after query decoding', () => {
  for (const payload of [
    'javascript:void(window.__returnUrlXss=1)',
    'JaVaScRiPt:alert(1)',
    ' \tjavascript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://merchant.example/done',
    'intent://merchant.example/done',
  ]) {
    for (const alias of ['callback', 'callback_url', 'redirect_url', 'return_url', 'redirect']) {
      const query = new URLSearchParams(`${alias}=${encodeURIComponent(payload)}`);
      assert.equal(getPaymentReturnUrl(query.get(alias), checkoutUrl), null, `${alias}: ${JSON.stringify(payload)}`);
    }
  }
});

test('merchant returns reject missing and malformed URLs without throwing', () => {
  for (const callback of [null, undefined, '', '  ', 123, {}, 'https://', 'http://[invalid', 'https://merchant.example:invalid/done']) {
    assert.equal(getPaymentReturnUrl(callback, checkoutUrl), null);
  }
});
