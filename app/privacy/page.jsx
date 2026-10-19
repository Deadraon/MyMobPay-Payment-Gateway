'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  FileText, 
  CheckCircle2, 
  EyeOff, 
  Smartphone, 
  BellRing, 
  Server, 
  UserCheck, 
  Mail, 
  KeyRound,
  FileCheck2
} from 'lucide-react';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#533AFD]/15 selection:text-[#533AFD]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <MyMobPayLogo markSize={28} />
          </Link>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            <Link 
              href="/terms" 
              className="text-slate-650 hover:text-slate-900 transition-colors px-2.5 py-1"
            >
              Terms of Service
            </Link>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Privacy Policy
            </span>
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
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Data Protection &amp; DPDP Act 2023 Compliance</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-sm text-slate-500 font-normal">
                Version 2.4 • Effective for all merchants, visitors, and transaction routing users
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-block px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                ● Live &amp; Current: Oct 19, 2026
              </span>
            </div>
          </div>

          <p className="mt-6 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            At <strong>MyMobPay</strong> (<code>mymob.tech</code>), we treat data confidentiality and merchant isolation as core engineering principles. 
            This Privacy Policy details how we collect, process, isolate, and safeguard data in accordance with the 
            <strong> Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
        </div>

        {/* Security Highlight Banner (Zero Cardholder Data Guarantee) */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/80 text-emerald-950">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <h2 className="font-bold text-emerald-950 text-sm sm:text-base">
                1. Zero Sensitive Financial Data Guarantee (Non-Custodial Security)
              </h2>
              <p className="text-emerald-900 leading-relaxed">
                <strong>We NEVER request, collect, intercept, or store sensitive banking credentials</strong>. 
                This includes debit/credit card numbers, CVV codes, net banking passwords, UPI MPINs, or ATM PINs.
              </p>
              <p className="text-emerald-900 leading-relaxed">
                End-consumers authorize payments directly through official, NPCI-regulated UPI client applications 
                (such as Google Pay, PhonePe, Paytm, BHIM, or Cred). Consumer banking authentication happens entirely within the bank&apos;s encrypted sandbox, completely isolated from our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Core Privacy Policy Sections */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-10 text-sm sm:text-base leading-relaxed text-slate-700">
          
          {/* Section 2 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
              <span>2. Information We Collect (Strict Data Minimization)</span>
            </h2>
            <p>
              We practice strict data minimization. We only collect details that are essential for account verification, technical routing, and transaction validation:
            </p>
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  A. Merchant Profile &amp; Verified Contact Data
                </h3>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
                  Business name, business email address, verified Indian mobile phone number (+91), password cryptographic salt &amp; hash, and linked Google profile identifier (if opted).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  B. Settlement Configuration &amp; Technical Identifiers
                </h3>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
                  Merchant UPI Virtual Payment Address (VPA) / Bank Account details for direct buyer payments, and merchant-specified outbound webhook URLs with HMAC signing secrets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  C. Transactional Metadata
                </h3>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
                  Bill amount, merchant order reference ID, generated payment session token, 12-digit bank UTR reference number (upon credit), payment timestamp, and order status (Pending, Paid, Expired).
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-150" />

          {/* Section 3 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <BellRing className="w-5 h-5 text-blue-600 shrink-0" />
              <span>3. Automated Notification Forwarding &amp; SMS Parsing Mechanics</span>
            </h2>
            <p>
              To confirm direct bank credits without needing private bank API access, merchants utilize our automated notification listener forwarder (or incoming bank credit email forwarder):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
              <li>
                <strong>Targeted Extraction Only:</strong> Our verification middleware performs regex pattern parsing strictly for the credit amount and 12-digit UTR reference number matching the merchant&apos;s active orders.
              </li>
              <li>
                <strong>Instant In-Memory Processing:</strong> Unrelated notifications, personal SMS messages, or non-banking communications received by the forwarder are immediately ignored and purged from memory.
              </li>
              <li>
                <strong>No Log Retention of Private Text:</strong> Once an order transitions to <code>PAID</code>, raw SMS notification payloads are scrubbed. Only the numerical amount and matched UTR are preserved in the order ledger for audit trails.
              </li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 4 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>4. Purpose of Data Processing</span>
            </h2>
            <p>
              Data collected is utilized strictly for executing legitimate operational services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-650">
              <li>Generating dynamic, order-locked UPI QR codes and deep-link checkout intents.</li>
              <li>Matching incoming bank credits via automated UTR reconciliation.</li>
              <li>Dispatching cryptographically signed HMAC-SHA256 webhook notifications to your backend server.</li>
              <li>Delivering multi-channel security OTPs (WhatsApp, Telegram, SMS) for merchant phone verification and login access.</li>
              <li>Preventing unauthorized platform access, fraud attempts, and abuse of API limits.</li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 5 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <EyeOff className="w-5 h-5 text-rose-600 shrink-0" />
              <span>5. Absolute Non-Sale of Merchant &amp; Customer Data</span>
            </h2>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950 text-xs sm:text-sm font-normal leading-relaxed">
              <strong>We do not sell, rent, monetize, or trade your personal data or your customers&apos; transactional records to any third party, advertising network, or data broker.</strong>
            </div>
            <p className="text-sm text-slate-650">
              Data disclosure is strictly restricted to essential technical infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
              <li>Cloud hosting and database infrastructure adhering to ISO/IEC 27001 and SOC2 standards.</li>
              <li>Transactional messaging providers (such as Meta WhatsApp Cloud API / Telegram Bot API) used exclusively to deliver merchant OTPs.</li>
              <li>Law enforcement agencies only when compelled by lawful court orders, subpoenas, or statutory obligations under Indian law.</li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 6 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-600 shrink-0" />
              <span>6. Data Security, Encryption &amp; Storage Standards</span>
            </h2>
            <p>
              We implement enterprise security controls to ensure data integrity and confidentiality:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">TLS 1.3 In-Transit Encryption</span>
                <p className="text-xs text-slate-600 leading-normal">
                  All traffic across merchant browsers, payment links, and backend REST APIs is protected via modern 256-bit TLS encryption.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cryptographic Salt &amp; Hashing</span>
                <p className="text-xs text-slate-600 leading-normal">
                  Passwords and webhook secrets are cryptographically hashed using industry-standard hashing algorithms (bcrypt/HMAC).
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-150" />

          {/* Section 7 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>7. Merchant Rights under the DPDP Act, 2023</span>
            </h2>
            <p>
              As a merchant (Data Principal under Indian data protection law), you possess distinct rights regarding your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-650">
              <li><strong>Right to Access:</strong> Review your stored profile details and historical transaction logs directly within your Merchant Console.</li>
              <li><strong>Right to Correction:</strong> Update outdated mobile numbers, contact emails, or UPI VPAs through your profile settings.</li>
              <li><strong>Right to Erasure &amp; Termination:</strong> Request complete account deletion and data scrubbing by contacting our privacy desk (subject to legal retention requirements for tax and accounting audits).</li>
            </ul>
          </section>

          <hr className="border-slate-150" />

          {/* Section 8 */}
          <section className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-blue-600 shrink-0" />
              <span>8. Statutory Grievance Redressal Officer</span>
            </h2>
            <p className="text-sm text-slate-650">
              In accordance with the Information Technology Act, 2000, and rules made thereunder, as well as the DPDP Act 2023, the details of our designated Grievance Officer are provided below:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-1 text-slate-700">
              <p><strong>Grievance Officer:</strong> Legal &amp; Compliance Cell</p>
              <p><strong>Entity:</strong> MyMobPay Technology</p>
              <p><strong>Email:</strong> privacy@mymob.tech / grievance@mymob.tech</p>
              <p><strong>Response Turnaround:</strong> Within 48 hours on business days</p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs text-slate-400 font-medium space-y-2">
          <p>© 2026 MyMobPay Gateway. Secured by 256-bit TLS encryption.</p>
          <div className="flex items-center justify-center gap-4 text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-800 transition-colors font-semibold">Terms of Service</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-800 transition-colors">Merchant Console</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
