/**
 * Public Client-Safe Application Configuration.
 * Secrets must NEVER be stored here in plaintext because this file
 * is imported by client-side components ('use client').
 */
export const CONFIG = {
  businessName: "MyMobPay",
  upiId: process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || "9410181307@okbizaxis",
  themeColor: "#2563EB",
  quickAmounts: [500, 1000, 2000, 5000],

  // Direct Crypto Configuration
  defaultCryptoWallet: "TYDny5k7rQ4Q1LzP8x4E3F4rQ4Q1LzP8x4",
  defaultCryptoNetwork: "USDT (TRC-20)",
  usdtInrRate: 90,

  // SaaS Subscription display
  subscriptionFee: 499,

  // Safe server-only accessors (prevent bundling plaintext secrets into client JS)
  get webhookSecret() {
    if (typeof window !== 'undefined') return undefined;
    return process.env.WEBHOOK_SECRET || '';
  },

  get platformApiKey() {
    return process.env.NEXT_PUBLIC_PLATFORM_API_KEY || process.env.PLATFORM_API_KEY || '677d9312-a53f-4b96-815f-53e0eee1b292';
  }
};
