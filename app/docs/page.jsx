import DocsClient from './DocsClient';

const BASE_URL = 'https://www.mymobpay.tech';

export const metadata = {
  title: 'Developer REST API & Webhook Documentation | MyMobPay',
  description:
    'Complete REST API documentation, JSON request payloads, and HMAC-SHA256 signed webhook integration guides for MyMobPay direct UPI payments.',
  alternates: {
    canonical: `${BASE_URL}/docs`,
  },
  openGraph: {
    title: 'Developer REST API & Webhooks — MyMobPay',
    description:
      'Integrate direct UPI and IMPS collections with standard JSON endpoints, dynamic QR generation, and real-time bank settlement callbacks.',
    url: `${BASE_URL}/docs`,
    siteName: 'MyMobPay',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'MyMobPay Developer REST API Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer REST API & Webhooks — MyMobPay',
    description: 'Integrate direct UPI payments in minutes with MyMobPay REST API.',
    images: ['/og-banner.png'],
  },
};

export default function DocsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'MyMobPay Developer REST API & Webhook Specification',
    image: `${BASE_URL}/og-banner.png`,
    author: {
      '@type': 'Organization',
      name: 'MyMobPay',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MyMobPay',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-banner.png`,
      },
    },
    description:
      'Developer guide for integrating direct UPI payment collections and HMAC-SHA256 signed webhooks.',
    mainEntityOfPage: `${BASE_URL}/docs`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocsClient />
    </>
  );
}
