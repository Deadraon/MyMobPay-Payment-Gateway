'use client';

import React, { useState } from 'react';
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
  AlertTriangle,
  CreditCard,
  PhoneCall,
  Ban,
  Server,
  HelpCircle,
  ExternalLink,
  Lock,
  UserCheck,
  FileWarning,
  Building,
  Check,
  ChevronRight,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';

export default function TermsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'rules' | 'prohibited' | 'disputes'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#0EA5E9]/15 selection:text-[#0284C7]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <MyMobPayLogo markSize={28} />
          </Link>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Terms &amp; Legal Agreement
            </span>
            <Link
              href="/privacy"
              className="text-slate-600 hover:text-slate-900 transition-colors px-2.5 py-1"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors ml-2 pl-3 border-l border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Merchant Console
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
                <span>Legal Framework &amp; Merchant Operating Rules</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Terms of Service &amp; Legal Agreement
              </h1>
              <p className="text-sm text-slate-500 font-normal">
                Effective Version 2.5 • Mandatory rules, compliance standards, and guidelines for all merchants
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                ● Live &amp; Current: Nov 2026
              </span>
            </div>
          </div>

          <p className="mt-6 text-sm sm:text-base text-slate-650 leading-relaxed font-normal">
            Welcome to <strong>MyMobPay</strong> (accessible via <code>mymobpay.tech</code> and authorized application subdomains).
            Please review these Terms of Service, Acceptable Use Policy, and Merchant Guidelines carefully before creating an account, connecting your UPI VPA, or deploying our webhook endpoints.
            By registering, obtaining an API key, or routing transactions, you contractually agree to these terms in full.
          </p>

          {/* Quick-Filter Anchor Bar */}
          <div className="mt-6 pt-5 border-t border-slate-150 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Quick Focus:</span>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-650 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              All Sections
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-650 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              Merchant Rules &amp; Guidelines
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prohibited')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'prohibited'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Prohibited Businesses (AUP)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'disputes'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Refunds &amp; Disputes (0-Custody)
            </button>
          </div>
        </div>

        {/* Essential Rules for New Users Highlight Card */}
        <div className="mb-8 p-6 rounded-3xl bg-white border border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Core Rules &amp; Operational Checklist for New Merchants
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Every merchant must satisfy these primary compliance requirements prior to activating live payments:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900 block">1. Legitimate Business &amp; Valid Indian Bank</span>
                <span className="text-slate-600 block leading-relaxed">
                  Settlement UPI ID must belong directly to your registered bank account. Disposable or proxy VPAs are strictly rejected.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900 block">2. 0% Escrow &amp; Direct Settlements</span>
                <span className="text-slate-600 block leading-relaxed">
                  Funds settle 100% directly into your bank in 0 seconds. MyMobPay holds zero funds and cannot issue refunds on your behalf.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900 block">3. Mandatory Refund Responsibility</span>
                <span className="text-slate-600 block leading-relaxed">
                  Merchants are exclusively liable to issue customer refunds for canceled orders or delivery failures via their own banking app.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900 block">4. Zero Tolerance for Fraud or UTR Spoofing</span>
                <span className="text-slate-600 block leading-relaxed">
                  Tampering with UTRs or fabricating notifications violates Sections 43 &amp; 66 of the IT Act, 2000, triggering immediate account termination and police reporting.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Banner (RBI Non-Aggregator Disclaimer) */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 text-blue-900">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <h2 className="font-bold text-blue-950 text-sm sm:text-base">
                1. Statutory RBI Regulatory Notice &amp; Non-Custodial Architecture
              </h2>
              <p className="text-blue-900/90 leading-relaxed">
                <strong>MyMobPay operates strictly as a technology software routing provider</strong> and
                does <em>NOT</em> function as a payment aggregator (PA), payment gateway (PG) custodian, digital wallet, prepaid payment instrument (PPI) issuer, or escrow agent under the Reserve Bank of India (RBI) Payment and Settlement Systems Act, 2007 (PSSA 2007) or RBI Master Directions on Payment Aggregators.
              </p>
              <p className="text-blue-900/90 leading-relaxed">
                Our platform <strong>never collects, pools, holds, handles, or settles merchant or consumer funds</strong>. All monetary settlements occur peer-to-peer (P2P) or merchant-direct (P2M) directly across National Payments Corporation of India (NPCI) UPI 2.0 and IMPS rails from the payer&apos;s bank account directly into your verified bank account.
              </p>
            </div>
          </div>
        </div>

        {/* Core Terms Sections */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-10 text-sm sm:text-base leading-relaxed text-slate-700">

          {/* Section 2 */}
          {(activeTab === 'all' || activeTab === 'rules') && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <PhoneCall className="w-5 h-5 text-blue-600 shrink-0" />
                <span>2. Merchant Eligibility &amp; Mandatory Verification Standards</span>
              </h2>
              <p>
                To safeguard our routing ecosystem against spam, identity theft, and unauthorized transactions, all merchants must satisfy the following criteria:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
                <li>
                  <strong>Verified Indian Mobile Number (+91):</strong> As per our platform security protocol, merchant onboarding requires an active Indian mobile number verified via real-time One-Time Password (WhatsApp OTP or SMS). Accounts registered with VoIP numbers or disposable SIMs will be blocked.
                </li>
                <li>
                  <strong>Identity &amp; Account Binding:</strong> Social authentication options (e.g., Google OAuth) must be tied to an actively verified merchant account with verifiable business details. Multiple duplicate accounts by a single merchant to bypass quota limits are strictly prohibited.
                </li>
                <li>
                  <strong>Legitimate Indian Bank Account:</strong> The provided settlement UPI ID (VPA) must link to a valid Indian bank account legally owned by the merchant or their registered entity.
                </li>
                <li>
                  <strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your console credentials, API authorization keys, and webhook signing secrets. Any API invocation authenticated with your secret token is deemed authorized by you.
                </li>
              </ul>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 3: Merchant Code of Conduct & Operational Guidelines */}
          {(activeTab === 'all' || activeTab === 'rules') && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span>3. Merchant Code of Conduct &amp; Operational Guidelines</span>
              </h2>
              <p>
                As a merchant utilizing MyMobPay software to request customer UPI payments, you agree to uphold strict ethical and operational commerce standards:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 block">Transparent Pricing &amp; Order Details</span>
                  <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                    You must explicitly disclose the total payable amount, taxes, shipping fees, and accurate product or service descriptions on your checkout page prior to initiating the UPI intent request.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 block">Published Merchant Contact Details</span>
                  <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                    You must publish a working support email, phone number, and physical or registered address on your website or application so buyers can communicate directly regarding order inquiries.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 block">Order Fulfillment &amp; Delivery SLAs</span>
                  <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                    You must deliver goods or activate services within the stated timeline. Repeated fulfillment delays or ghost orders will lead to immediate middleware suspension.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 block">Clear Refund &amp; Cancellation Policy</span>
                  <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                    Your platform must host a clear, accessible Return, Refund, and Cancellation policy clearly outlining timelines and resolution procedures for disputed purchases.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 4: Acceptable Use Policy & Strictly Prohibited Goods */}
          {(activeTab === 'all' || activeTab === 'prohibited') && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-rose-700 flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                <span>4. Acceptable Use Policy (AUP) &amp; Strictly Prohibited Businesses</span>
              </h2>
              <p>
                Merchants must strictly comply with all relevant Indian statutes, including the Information Technology Act, 2000, the Consumer Protection Act, 2019, and the Prevention of Money Laundering Act (PMLA), 2002. <strong>You may not use MyMobPay software to accept payments for any of the following:</strong>
              </p>

              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950 text-xs sm:text-sm space-y-3 font-normal">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <strong className="text-rose-900 block font-semibold">Financial &amp; Gaming Prohibitions:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-rose-900/90">
                      <li>Unlawful gambling, betting, casinos, rummy/poker without statutory exemption, or lottery schemes.</li>
                      <li>Multi-level marketing (MLM), pyramid schemes, or unregistered chit funds.</li>
                      <li>High-yield investment programs (HYIP), unverified crypto pre-sales, or unauthorized forex trading.</li>
                      <li>Currency conversion or money laundering conduits.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <strong className="text-rose-900 block font-semibold">Illegal &amp; Hazardous Goods:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-rose-900/90">
                      <li>Narcotics, psychotropic substances, or prescription drugs without valid pharmacy licenses.</li>
                      <li>Firearms, ammunition, explosive materials, or toxic chemicals.</li>
                      <li>Stolen goods, counterfeit products, or pirated copyright media.</li>
                      <li>Illicit adult content, non-consensual media, or escort services.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <strong className="text-rose-900 block font-semibold">Deceptive &amp; Cyber-Threat Activities:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-rose-900/90">
                      <li>Phishing sites, malware distribution, hacking tools, or remote unauthorized access trojans.</li>
                      <li>Social media bot follower boosters, deceptive fake review generation, or identity cloning.</li>
                      <li>Impersonation of government agencies, banks, or established brands without explicit authorization.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <FileWarning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Enforcement Notice:</strong> Any merchant found violating this Acceptable Use Policy is subject to immediate and permanent API termination without refund of subscription fees, and transaction logs will be provided to the National Cyber Crime Reporting Portal (cybercrime.gov.in) and law enforcement authorities when mandated.
                </p>
              </div>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 5: Direct Settlement, Refunds & Dispute Liabilities */}
          {(activeTab === 'all' || activeTab === 'disputes') && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                <span>5. Direct Settlement, Consumer Refunds &amp; Dispute Liabilities</span>
              </h2>
              <p>
                Because settlements are executed directly across NPCI rails into your bank account in <strong>real-time (0-second settlement)</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-sm text-slate-650">
                <li>
                  <strong>No Escrow Holding:</strong> MyMobPay does not sit in the flow of funds and has no legal, contractual, or technical authority to freeze, hold, escrow, or reverse funds from your personal or business bank account.
                </li>
                <li>
                  <strong>Merchant Sole Refund Obligation:</strong> Since MyMobPay holds zero merchant funds, <em>all customer refunds, product returns, and chargeback cancellations must be issued directly by you (the merchant)</em> to the consumer using your own UPI banking application or net-banking portal.
                </li>
                <li>
                  <strong>Customer Dispute Resolution:</strong> You are exclusively responsible for customer service, warranty fulfillment, delivery confirmations, and dispute resolution. MyMobPay disclaims all liability regarding the underlying commercial transaction.
                </li>
                <li>
                  <strong>Cybercrime &amp; Bank Freeze Cooperation:</strong> If a customer lodges a cybercrime complaint or bank freeze notice against your UPI ID, you agree to handle all documentation with the investigating agency directly. MyMobPay may provide technical connection timestamps upon statutory subpoena.
                </li>
              </ul>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 6: Automated Notification Forwarder & Anti-Tampering Rules */}
          {(activeTab === 'all' || activeTab === 'rules') && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                <span>6. Android Forwarder, Bank Email Hooks &amp; Anti-Tampering Rules</span>
              </h2>
              <p>
                MyMobPay utilizes client-side notification listeners (such as the MyMobPay Android Forwarder app or bank email credit hooks) to detect successful UPI credits and trigger your webhooks:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
                <li>
                  <strong>Device Environment:</strong> The Android forwarder operates on the merchant&apos;s own physical smartphone. The merchant is responsible for maintaining device battery-saver exemptions, notification access permissions, and a stable internet connection.
                </li>
                <li>
                  <strong>Strict Prohibition on UTR Tampering:</strong> Falsifying bank SMS notifications, spoofing webhook payloads, fabricating Unique Transaction Reference (UTR) numbers, or injecting mock bank confirmations constitutes criminal cyber-fraud under <strong>Sections 43, 66, and 66D of the Information Technology Act, 2000</strong>.
                </li>
                <li>
                  <strong>Manual UTR Reconciliation:</strong> In the rare event of SMS telecommunication latency or bank system delays, merchants may verify customer UTRs through our authenticated reconciliation console. All manual verifications are logged with audit trails.
                </li>
              </ul>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 7: Zero Commission & Flat Subscription Billing */}
          {activeTab === 'all' && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>7. Zero-Commission Model &amp; Subscription Billing</span>
              </h2>
              <p>
                MyMobPay eliminates per-transaction percentage fees, enabling merchants to save substantial operating margins:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-xs font-bold text-blue-600 block mb-1">0% Transaction Fee Guarantee</span>
                  <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                    We deduct 0% commission from your payment volume. Every rupee paid by your customer settles 100% in full into your bank account.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-xs font-bold text-blue-600 block mb-1">Flat Subscription Billing</span>
                  <p className="text-xs sm:text-sm text-slate-650 leading-normal">
                    Platform access, notification forwarder bridges, webhook dispatchers, and merchant telemetry are billed as a recurring subscription.
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 pt-1">
                Subscription payments are non-refundable once the billing cycle commences. If a subscription lapses, live webhook routing pauses until reactivated.
              </p>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 8: DPDP Act 2023 & Customer Privacy */}
          {activeTab === 'all' && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-blue-600 shrink-0" />
                <span>8. Data Protection &amp; DPDP Act 2023 Compliance</span>
              </h2>
              <p>
                Under the Digital Personal Data Protection Act, 2023 (DPDP Act, 2023):
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
                <li>
                  <strong>Data Fiduciary Roles:</strong> The merchant operates as the Data Fiduciary for customer personal data collected during checkout. MyMobPay operates as a Data Processor solely to generate dynamic QR codes and relay verification status.
                </li>
                <li>
                  <strong>Non-Storage of Financial Secrets:</strong> MyMobPay never stores, logs, or transmits customer UPI PINs, bank account net-banking passwords, or debit card credentials.
                </li>
                <li>
                  <strong>Security in Transit:</strong> All communications between merchant servers, customer devices, and MyMobPay routing endpoints are secured via TLS 1.3 / 256-bit SSL encryption.
                </li>
              </ul>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 9: Limitation of Liability & Indemnification */}
          {activeTab === 'all' && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>9. Limitation of Liability &amp; Comprehensive Merchant Indemnity</span>
              </h2>
              <p className="text-sm text-slate-650">
                To the maximum extent permitted by applicable Indian law, MyMobPay, its founders, developers, and affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages, including loss of profits, downtime, or banking network failures.
              </p>
              <p className="text-sm text-slate-650">
                Our aggregate liability arising out of our software middleware shall not exceed the subscription fees paid by you to MyMobPay during the three (3) months preceding the incident. You agree to defend, indemnify, and hold harmless MyMobPay from any customer claims, consumer court orders, regulatory fines, or tax (GST) liabilities arising from your merchant operations.
              </p>
            </section>
          )}

          {activeTab === 'all' && <hr className="border-slate-150" />}

          {/* Section 10: Governing Law & Grievance Redressal */}
          {activeTab === 'all' && (
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <Building className="w-5 h-5 text-blue-600 shrink-0" />
                <span>10. Governing Law, Jurisdiction &amp; Grievance Redressal</span>
              </h2>
              <p className="text-sm text-slate-650">
                These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-700">
                <span className="font-bold text-slate-900 block text-sm">Statutory Grievance Redressal &amp; Compliance Office:</span>
                <p><strong>Designated Grievance Officer:</strong> Kunal Chauhan, Compliance Department</p>
                <p><strong>Merchant Legal Inquiries:</strong> legal@mymobpay.tech</p>
                <p><strong>Technical Support:</strong> support@mymobpay.tech</p>
                <p><strong>Platform Domain:</strong> https://mymobpay.tech</p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Complaints filed with the Grievance Officer are acknowledged within 48 hours and resolved within 15 working days as prescribed under the Information Technology (Intermediary Guidelines) Rules, 2021.
                </p>
              </div>
            </section>
          )}

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
