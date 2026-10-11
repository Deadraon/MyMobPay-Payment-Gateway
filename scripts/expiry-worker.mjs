/**
 * MyMobPay Background Payment Link Expiry Worker
 * Suitable for VPS / PM2 / systemd / Docker
 * 
 * Usage:
 *   node scripts/expiry-worker.mjs
 *   or via PM2: pm2 start scripts/expiry-worker.mjs --name mymobpay-expiry-worker
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, '../.env.local');
const envPath = resolve(__dirname, '../.env');

// Simple .env parser for standalone Node process
function loadEnvFile(path) {
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnvFile(envLocalPath);
loadEnvFile(envPath);

// Import domain processor
const { processExpiredPaymentLinks } = await import('../lib/paymentLinks.js');
const { processPendingWebhookRetries } = await import('../lib/webhook.js');

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

console.log('----------------------------------------------------');
console.log('🚀 MyMobPay Payment Link Expiry Worker Started');
console.log(`⏱️  Polling Interval: ${POLL_INTERVAL_MS / 1000}s`);
console.log('----------------------------------------------------');

let isRunning = false;

async function runWorkerIteration() {
  if (isRunning) {
    console.log('[Worker] Previous iteration still running. Skipping cycle.');
    return;
  }

  isRunning = true;
  const start = Date.now();

  try {
    const expiryResult = await processExpiredPaymentLinks(100);
    const retryResult = await processPendingWebhookRetries();

    const elapsed = Date.now() - start;
    if (expiryResult.expiredCount > 0 || expiryResult.recoveredCount > 0 || retryResult.retried > 0) {
      console.log(`[Worker ${new Date().toISOString()}] Expired: ${expiryResult.expiredCount}, Recovered: ${expiryResult.recoveredCount}, Webhooks Retried: ${retryResult.retried} (${elapsed}ms)`);
    }
  } catch (err) {
    console.error(`[Worker Error ${new Date().toISOString()}]:`, err);
  } finally {
    isRunning = false;
  }
}

// Initial execution
runWorkerIteration();

// Recurring cron interval
setInterval(runWorkerIteration, POLL_INTERVAL_MS);

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Worker received SIGINT. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Worker received SIGTERM. Shutting down gracefully.');
  process.exit(0);
});
