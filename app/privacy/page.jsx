'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert, ArrowLeft, Lock, FileText, CheckCircle } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 py-12 px-6 sm:px-12 lg:px-20 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8 animate-scale-up">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Previous Page
        </button>

        {/* Heading Header */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Last updated: May 25, 2026</p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-650">
          
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-blue-600" /> 1. Overview of Platform Commitments
            </h2>
            <p>
              At <strong>MyMobPay</strong>, we are committed to providing a secure, transparent, and robust peer-to-peer (P2P) UPI payment processing platform. This Privacy Policy details how we collect, store, isolate, and safeguard data relating to merchants, transactions, and end-consumers. 
            </p>
            <p>
              Our gateway utilizes bank-grade 256-bit encryption layers to prevent spoofing and data sniffing. We operate under strict zero-trust operational models to guarantee absolute transactional privacy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-blue-600" /> 2. Zero Cardholder Data & Non-Custodial Security
            </h2>
            <div className="p-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-2xl text-xs space-y-2 font-medium">
              <strong className="text-emerald-900 flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Non-Custodial Isolated Architecture
              </strong>
              <p>
                Our payment gateway is explicitly designed to handle transactions without collecting or retaining sensitive payment credentials (such as raw bank account passwords, debit card pins, or OTPs). All routing is processed using standard, public UPI Virtual Payment Addresses (VPAs).
              </p>
            </div>
            <p>
              Because peer-to-peer UPI payments operate directly from the customer&apos;s mobile device to the merchant&apos;s bank account via official UPI applications, no intermediary cards or sensitive customer banking details ever pass through our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-blue-600" /> 3. Data Collection & Usage Limits
            </h2>
            <p>
              We collect minimal data required to verify successful payments and maintain operational safety:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium text-xs text-slate-500">
              <li><strong>Merchant Profile Details:</strong> Business Name, UPI ID (VPA), and Webhook Outbound Callback URL to handle notifications.</li>
              <li><strong>Transactional Metadata:</strong> Transaction Amount, Order Reference ID, customer phone number (optional), and bank SMS UTR numbers to match and confirm deposits.</li>
              <li><strong>Authentication Data:</strong> Secure password hashes and API keys for merchant portal credentials.</li>
            </ul>
            <p>
              We strictly enforce a policy prohibiting the selling, renting, or leasing of merchant or customer databases to third-party marketing entities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-blue-600" /> 4. Automated Verification Mechanics
            </h2>
            <p>
              Our platform utilizes automatic matching of bank credit notification SMSs and routing updates. SMS contents parsed via our Android forwarders or routed bank emails are checked only for amount and UTR criteria. Once an order transitions to <strong>verified</strong>, raw logs are securely hashed to prevent secondary indexing or leakage.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
          <p>© 2026 MyMobPay Gateway. Secured by 256-bit TLS encryption.</p>
          <p className="mt-1">In case of queries regarding data security policies, reach out to security@mymobpay.tech.</p>
        </div>

      </div>
    </div>
  );
}
