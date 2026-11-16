import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { MyMobPayLogoMark } from '@/components/MyMobPayLogo';

const BASE_URL = 'https://www.mymobpay.tech';

export const metadata = {
  title: 'Blog & Payment Engineering Guides | MyMobPay',
  description:
    'In-depth guides, tutorials, and comparisons on UPI payment gateways, direct-to-bank settlement, Next.js integration, and 0% commission architecture.',
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: 'MyMobPay Blog — Payment Engineering & Guides',
    description:
      'Tutorials and insights for developers and founders building payment infrastructure in India with 0% gateway commission.',
    url: `${BASE_URL}/blog`,
    siteName: 'MyMobPay',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'MyMobPay Engineering Blog & Payment Guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyMobPay Blog — Payment Engineering & Guides',
    description: 'In-depth tutorials and guides on direct UPI integrations and 0% gateway fees.',
    images: ['/og-banner.png'],
  },
};

const ARTICLES = [
  {
    slug: 'uapi-integration-guide',
    title: 'How to Integrate UPI Payments in Next.js — Step-by-Step Guide',
    description:
      'Add UPI payment collections to your Next.js application in under 15 minutes. Includes complete code examples in Node.js, Python, and cURL with automated webhook verification.',
    category: 'Tutorial',
    date: 'Nov 2026',
    readTime: '10 min read',
    tags: ['Next.js', 'UPI', 'API', 'Webhooks'],
  },
  {
    slug: 'direct-bank-settlement-vs-aggregator',
    title: 'Direct Bank Settlement vs. Aggregators (Razorpay / Cashfree)',
    description:
      'Compare direct bank P2P settlement with traditional nodal escrow aggregators. Learn how T+0 instant credit and 0% commission change software margins.',
    category: 'Architecture',
    date: 'Nov 2026',
    readTime: '8 min read',
    tags: ['Fintech', 'Settlement', 'NPCI', 'Escrow'],
  },
  {
    slug: 'payment-gateway-for-saas',
    title: 'Payment Gateway for SaaS Founders: Why 0% Fees Matter',
    description:
      'Analyzing the compounding impact of 2% payment gateway fees on ARR, gross margins, and customer lifetime value for high-ticket Indian SaaS builders.',
    category: 'SaaS Economics',
    date: 'Nov 2026',
    readTime: '7 min read',
    tags: ['SaaS', 'Economics', 'Unit Economics', 'Zero Fee'],
  },
];

export default function BlogIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'MyMobPay Engineering & Payment Blog',
    description:
      'Guides and architectural breakdowns for direct-to-bank UPI payment infrastructure and 0% gateway fees.',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'MyMobPay',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-banner.png`,
      },
    },
    blogPost: ARTICLES.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.description,
      url: `${BASE_URL}/blog/${a.slug}`,
      datePublished: '2026-11-01',
      author: {
        '@type': 'Person',
        name: 'Kunal Chauhan',
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B0E17]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex items-center justify-center shrink-0">
              <MyMobPayLogoMark className="w-full h-full" id="blog-nav-logo" />
            </span>
            <span className="font-sans font-extrabold text-xl tracking-tight text-white">
              MyMob<span className="text-[#0F2BFF]">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Developers</Link>
            <Link href="/blog" className="text-white font-bold">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-200 hover:text-white px-3 py-1.5">
              Log in
            </Link>
            <Link href="/login?mode=signup" className="bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Blog Content */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2BFF]/15 text-[#60A5FA] font-mono text-xs font-bold uppercase">
            ENGINEERING & GUIDES
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black text-white tracking-tight">
            MyMobPay Blog
          </h1>
          <p className="mt-3 text-base text-slate-400">
            Technical tutorials, architectural comparisons, and payment engineering insights for modern builders.
          </p>
        </div>

        <div className="mt-14 space-y-6">
          {ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="rounded-2xl bg-[#0E131F] border border-white/10 p-6 sm:p-8 hover:border-white/20 transition-all shadow-xl group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mb-3">
                <span className="px-2.5 py-1 rounded-md bg-[#0F2BFF]/20 text-[#60A5FA] font-mono font-bold">
                  {article.category}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{article.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.readTime}</span>
                  </span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#60A5FA] transition-colors leading-snug">
                <Link href={`/blog/${article.slug}`}>
                  {article.title}
                </Link>
              </h2>

              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                {article.description}
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-slate-400 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F2BFF] group-hover:text-[#60A5FA] transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Comparison Callout */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#0F2BFF]/15 to-[#10B981]/15 border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Compare with Traditional Gateways</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Read how MyMobPay compares directly against Razorpay, Cashfree, and standard aggregators.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/compare/razorpay"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
            >
              vs Razorpay
            </Link>
            <Link
              href="/compare/cashfree"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
            >
              vs Cashfree
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07090E] py-12 text-xs text-slate-500 mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MyMobPayLogoMark className="w-5 h-5" id="blog-footer-logo" />
            <span className="font-bold text-slate-300">MyMobPay</span>
            <span>&bull; Payment Engineering Blog</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
