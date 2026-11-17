import PricingClient from './PricingClient';

const BASE_URL = 'https://www.mymobpay.tech';

export const metadata = {
  title: 'Pricing Plans — Flat Subscription, 0% Commission | MyMobPay',
  description:
    'Accept direct-to-bank UPI & IMPS payments with 0% transaction commission. Free link starter plan & flat monthly plans starting at ₹99/mo up to ₹499/mo unlimited.',
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    title: 'MyMobPay Pricing Plans — 0% Commission Payment Gateway',
    description:
      'Flat subscription pricing for direct UPI & IMPS payments. Keep 100% of your customer collections with zero percentage gateway tax. Plans from ₹99 to ₹499/mo.',
    url: `${BASE_URL}/pricing`,
    siteName: 'MyMobPay',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'MyMobPay Pricing Plans — 0% Commission',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyMobPay Pricing — 0% Commission UPI Gateway',
    description: 'Keep 100% of UPI & IMPS payments under flat monthly plans. Zero per-transaction cut. Plans from ₹99 to ₹499/mo.',
    images: ['/og-banner.png'],
  },
};

export default function PricingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'MyMobPay Payment Gateway Subscription',
    image: `${BASE_URL}/og-banner.png`,
    description:
      'Direct-to-bank UPI and IMPS payment gateway software with 0% transaction fees under flat monthly subscription.',
    brand: {
      '@type': 'Brand',
      name: 'MyMobPay',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: '0',
      highPrice: '499',
      offerCount: '4',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Link Starter',
          price: '0',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${BASE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Starter Plan',
          price: '99',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${BASE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Growth Plan',
          price: '299',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${BASE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Pro Flagship Plan',
          price: '499',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          url: `${BASE_URL}/pricing`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingClient />
    </>
  );
}
