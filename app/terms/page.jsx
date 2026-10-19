'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Landmark, 
  FileText, 
  CheckCircle2, 
  Scale, 
  AlertCircle, 
  CreditCard, 
  PhoneCall, 
  Ban, 
  Server, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#533AFD]/15 selection:text-[#533AFD]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <MyMobPayLogo markSize={28} className="w-28 sm:w-32 h-auto" />
          </Link>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Terms of Service
            </span>
            <Link 
              href="/privacy" 
              className="text-slate-600 hover:text-slate-900 transition-colors px-2.5 py-1"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/" 
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors ml-2 pl-3 border-l border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Document Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Legal Framework &amp; Merchant Agreement</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Terms of Service
              </h1>
              <p className="text-sm text-slate-500 font-normal">
                Effective Version 2.4 • Applicable to all registered merchants and API integrators
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                ● Live &amp; Current: Oct 19, 2026
              </span>
            </div>
          </div>

          <p className="mt-6 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Welcome to <strong>MyMobPay</strong> (accessible via <code>mymob.tech</code> and authorized application subdomains). 
            Please review these Terms of Service carefully before creating a merchant profile, generating payment links, or utilizing our direct settlement verification APIs. 
            By registering, connecting your UPI VPA, or deploying our webhook endpoints, you contractually agree to these terms in full.
          </p>
        </div>

        {/* Regulatory Banner (RBI Non-Aggregator Disclaimer) */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 text-blue-900">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <h2 className="font-bold text-blue-950 text-sm sm:text-base">
                1. Statutory RBI Regulatory Notice &amp; Non-Custodial Architecture
              </h2>
              <p className="text-blue-900/90 leading-relaxed">
                <strong>MyMobPay operates strictly as a technology software routing provider</strong> and 
                does <em>NOT</em> function as a payment aggregator (PA), digital wallet, prepaid payment instrument (PPI) issuer, or escrow custodian under the Reserve Bank of India (RBI) Payment and Settlement Systems Act, 2007.
              </p>
              <p className="text-blue-900/90 leading-relaxed">
                Our platform <strong>never collects, pools, deposits, or holds merchant or consumer funds</strong>. All monetary settlements occur peer-to-peer (P2P) or merchant-direct (P2M) directly across National Payments Corporation of India (NPCI) UPI 2.0 and IMPS infrastructure from the customer&apos;s bank account directly into your verified bank account.
              </p>
            </div>
          </div>
        </div>

        {/* Core Terms Sections */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-10 text-sm sm:text-base leading-relaxed text-slate-700">
          
          {/* Section 2 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <PhoneCall className="w-5 h-5 text-blue-600 shrink-0" />
              <span>2. Merchant Eligibility &amp; Mandatory Phone Verification</span>
            </h2>
            <p>
              To safeguard our routing ecosystem against spam and unauthorized transactions, all merchants must satisfy the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
              <li>
                <strong>Verified Indian Mobile Number (+91):</strong> As per our platform security protocol, merchant onboarding requires an active Indian mobile number verified via real-time One-Time Password (WhatsApp OTP, Telegram OTP, or SMS).
              </li>
              <li>
                <strong>Identity &amp; Account Binding:</strong> Social authentication options (e.g., Google OAuth) must be tied to an actively verified merchant account. You may not register via disposable numbers or VoIP proxies.
              </li>
              <li>
                <strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your console credentials, API authorization keys, and webhook signing secrets. Any API invocation authenticated with your secret token is deemed authorized by you.
              </li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 3 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
              <span>3. Zero-Commission Model &amp; Subscription Billing</span>
            </h2>
            <p>
              MyMobPay delivers significant cost savings compared to traditional payment aggregators by eliminating per-transaction percentage fees:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">0% Per-Transaction Fee</span>
                <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                  We deduct zero percentage commission (0%) from your sales volume. Every rupee sent by your buyer settles 100% in full into your bank account.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Flat Subscription Service</span>
                <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                  Fees are charged as a recurring monthly or annual platform subscription. This fee covers automated UTR matching, Android/Email notification forwarders, webhooks, and dashboard infrastructure.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 pt-1">
              Subscription renewals are billed in advance. If a subscription lapses without renewal, automated webhook dispatching and payment link resolution will pause until the subscription is reactivated.
            </p>
          </section>

          <hr className="border-slate-150" />

          {/* Section 4 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>4. Direct Settlement, Refunds &amp; Dispute Responsibility</span>
            </h2>
            <p>
              Because settlements are executed directly across NPCI rails into your bank account in <strong>real-time (0-second settlement)</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
              <li>
                <strong>No Escrow Holding:</strong> MyMobPay does not sit in the flow of funds and has no legal or technical authority to freeze, hold, or debit funds from your personal or business bank account.
              </li>
              <li>
                <strong>Consumer Refunds:</strong> Since MyMobPay holds zero merchant funds, <em>all refunds, order cancellations, and product returns must be issued directly by you (the merchant)</em> to the consumer using your own UPI banking application or net-banking portal.
              </li>
              <li>
                <strong>Customer Disputes &amp; Chargebacks:</strong> You are exclusively responsible for customer service, delivery fulfillment, warranty claims, and resolving consumer disputes. MyMobPay disclaims all liability regarding merchant goods or services.
              </li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 5 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <span>5. Acceptable Use &amp; Strictly Prohibited Businesses</span>
            </h2>
            <p>
              Merchants must strictly comply with all relevant Indian statutes, including the Information Technology Act, 2000, and Prevention of Money Laundering Act (PMLA). You may not use MyMobPay for:
            </p>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950 text-xs sm:text-sm space-y-2 font-normal">
              <ul className="list-disc pl-5 space-y-1 text-rose-900">
                <li>Unlawful gambling, sports betting, lotteries, or chance-based wagering games prohibited under Indian law.</li>
                <li>Sale of illegal narcotics, prescription drugs without licensed fulfillment, or banned substances.</li>
                <li>Unauthorized multi-level marketing (MLM), pyramid schemes, or unverified high-yield investment programs (HYIP).</li>
                <li>Illicit adult content, non-consensual media, or copyright-infringing digital assets.</li>
                <li>Fraudulent impersonation, phished banking credentials, or deceptive merchant solicitations.</li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Accounts found violating the Acceptable Use Policy are subject to immediate termination without refund of platform subscription fees, and will be reported to appropriate law enforcement authorities when mandated.
            </p>
          </section>

          <hr className="border-slate-150" />

          {/* Section 6 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-600 shrink-0" />
              <span>6. Service Availability, UTR Matching &amp; Technical SLA</span>
            </h2>
            <p>
              Our verification engine relies on receiving notification triggers from your configured devices (such as Android notification forwarders or bank credit email alerts):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
              <li>
                <strong>Third-Party Dependencies:</strong> While MyMobPay strives for 99.9% middleware server uptime, we cannot be held responsible for verification delays caused by telecommunication SMS bottlenecks, merchant phone battery-saver kills, or downtime at the customer&apos;s or merchant&apos;s issuing bank.
              </li>
              <li>
                <strong>Manual UTR Verification:</strong> In the rare event an automated notification is delayed by an external bank, our merchant portal provides a manual UTR reconciliation facility to verify genuine bank credits safely.
              </li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 7 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>7. Limitation of Liability &amp; Indemnification</span>
            </h2>
            <p className="text-sm text-slate-650">
              To the maximum extent permitted by applicable Indian law, MyMobPay, its directors, developers, and affiliates shall not be liable for any indirect, punitive, or consequential damages, including loss of profits or business interruption.
            </p>
            <p className="text-sm text-slate-650">
              Our aggregate liability arising out of or related to our software services shall not exceed the subscription fees paid by you to MyMobPay during the three (3) months preceding the incident. You agree to defend and indemnify MyMobPay against any claims arising from your merchant offerings, tax non-compliance (such as GST liability), or breach of these Terms.
            </p>
          </section>

          <hr className="border-slate-150" />

          {/* Section 8 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <span>8. Governing Law, Jurisdiction &amp; Legal Inquiries</span>
            </h2>
            <p className="text-sm text-slate-650">
              These Terms of Service are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-1 text-slate-700">
              <p><strong>Merchant Legal Inquiries:</strong> legal@mymob.tech</p>
              <p><strong>Technical Support:</strong> support@mymob.tech</p>
              <p><strong>Platform Domain:</strong> https://mymob.tech</p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs text-slate-400 font-medium space-y-2">
          <p>© 2026 MyMobPay Gateway. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-800 transition-colors font-semibold">Privacy Policy</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-800 transition-colors">Merchant Console</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
