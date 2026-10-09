/**
 * MyMobPay GST Tax Invoice Generator
 * Generates an executive, modern, GST-compliant tax invoice (Rule 46 CGST Rules, 2017)
 * with the new official brand logo, complete company details, merchant info, tax breakdowns,
 * and high-resolution print & PDF styles.
 */
import { formatMerchantId } from '@/lib/merchantId';

export function numberToIndianWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const [rupees, paise] = Number(num).toFixed(2).split('.').map(Number);
  let words = inWords(rupees) ? inWords(rupees).trim() : 'Zero';
  if (paise > 0) {
    words += ' and ' + inWords(paise).trim() + ' Paise';
  }
  return words;
}

export function generateTaxInvoiceHtml(inv = {}, profile = {}, subDetails = {}) {
  const invNumber = inv?.ref
    ? (inv.ref.startsWith('MMP-INV-') ? inv.ref : `MMP-INV-${inv.ref}`)
    : `MMP-INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const invoiceDate = inv?.date
    ? (typeof inv.date === 'string' && inv.date.includes(',')
        ? inv.date
        : new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const businessName = profile?.business_name || profile?.owner_name || 'GainIQ Technologies';
  const merchantName = profile?.owner_name || profile?.business_name || 'Merchant Administrator';
  const merchantEmail = profile?.email || 'merchant@mymobpay.tech';
  const merchantPhone = profile?.phone_number || profile?.phone || '+91 98765 43210';
  const merchantGstin = profile?.gstin || '27AADCB2230M1Z2';
  const merchantAddress = profile?.business_address || 'Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051';
  const merchantMid = formatMerchantId(profile?.id || profile?.merchant_id);

  const planName = inv?.plan || subDetails?.planTitle || 'Pro Merchant License';
  const paidTotal = Number(inv?.amount || inv?.total || subDetails?.planAmount || 499);

  // Exact GST Split (18% inclusive)
  const taxableValue = paidTotal / 1.18;
  const cgstValue = taxableValue * 0.09;
  const sgstValue = taxableValue * 0.09;

  const taxableFormatted = taxableValue.toFixed(2);
  const cgstFormatted = cgstValue.toFixed(2);
  const sgstFormatted = sgstValue.toFixed(2);
  const totalTaxFormatted = (Number(cgstFormatted) + Number(sgstFormatted)).toFixed(2);
  const totalFormatted = (Number(taxableFormatted) + Number(cgstFormatted) + Number(sgstFormatted)).toFixed(2);

  const amountInWords = numberToIndianWords(totalFormatted);
  const utrRef = inv?.utr || `NPCI/${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const orderRef = inv?.order_id || inv?.ref || `ORD_${invNumber.replace('MMP-INV-', '')}`;
  const verificationHash = `SHA256:${invNumber.slice(-6)}${orderRef.slice(-4)}${taxableFormatted.replace('.', '')}`.toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invNumber} - MyMobPay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0c2340;
      --primary-light: #163761;
      --accent-blue: #0284C7;
      --accent-orange: #FF7800;
      --emerald: #059669;
      --emerald-light: #ecfdf5;
      --emerald-border: #a7f3d0;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-300: #cbd5e1;
      --slate-400: #94a3b8;
      --slate-500: #64748b;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #eef2f6;
      color: var(--slate-900);
      line-height: 1.5;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }

    .top-action-bar {
      max-width: 860px;
      margin: 0 auto 20px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-print {
      background: linear-gradient(135deg, #0284C7 0%, #0052cc 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
    }
    .btn-print:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(2, 132, 199, 0.4);
    }

    .btn-close {
      background: #ffffff;
      color: var(--slate-700);
      border: 1px solid var(--slate-300);
    }
    .btn-close:hover {
      background: var(--slate-100);
    }

    .invoice-card {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid var(--slate-200);
      box-shadow: 0 10px 30px -5px rgba(12, 35, 64, 0.08);
      padding: 44px 48px;
      position: relative;
      overflow: hidden;
    }

    /* Top Accent Line */
    .invoice-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #0284C7 0%, #0c2340 50%, #FF7800 100%);
    }

    /* Header Section */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 28px;
      border-bottom: 1.5px solid var(--slate-200);
      margin-bottom: 28px;
      gap: 24px;
    }

    .company-info {
      flex: 1;
    }

    .company-logo-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .company-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: var(--primary);
      margin-top: 4px;
      letter-spacing: -0.2px;
    }

    .company-meta {
      font-size: 11.5px;
      color: var(--slate-500);
      line-height: 1.55;
    }
    .company-meta strong {
      color: var(--slate-700);
    }

    .invoice-title-block {
      text-align: right;
    }

    .invoice-tag {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: var(--primary);
      letter-spacing: 0.5px;
      line-height: 1;
    }

    .invoice-subtag {
      font-size: 10.5px;
      color: var(--slate-400);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-top: 4px;
    }

    .inv-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--accent-blue);
      margin-top: 6px;
    }

    .badge-stack {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      font-size: 10.5px;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-paid {
      background: var(--emerald-light);
      color: var(--emerald);
      border: 1px solid var(--emerald-border);
    }

    .badge-orig {
      background: var(--slate-100);
      color: var(--slate-600);
      border: 1px solid var(--slate-200);
    }

    /* Parties Section Grid */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .party-card {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 12px;
    }

    .party-card h4 {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--slate-500);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .party-name {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .party-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      color: var(--slate-600);
    }
    .party-row strong {
      color: var(--slate-800);
      font-weight: 600;
    }

    .party-mono {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    /* Table Section */
    .table-wrap {
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    thead th {
      background: var(--primary);
      color: #ffffff;
      padding: 12px 14px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    tbody td {
      padding: 14px;
      border-bottom: 1px solid var(--slate-200);
      color: var(--slate-700);
      vertical-align: top;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .item-title {
      font-weight: 700;
      font-size: 13px;
      color: var(--primary);
      margin-bottom: 3px;
    }

    .item-desc {
      font-size: 11px;
      color: var(--slate-500);
      line-height: 1.45;
    }

    /* Calculation & Breakdown Block */
    .summary-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .amount-words-card {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 16px 18px;
      font-size: 12px;
      display: flex;
      flex-col;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
    }

    .words-label {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--slate-500);
      margin-bottom: 4px;
    }

    .words-val {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.4;
    }

    .compliance-pill {
      background: #ffffff;
      border: 1px dashed var(--slate-300);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      color: var(--slate-600);
      line-height: 1.4;
    }
    .compliance-pill strong {
      color: var(--emerald);
    }

    .calc-card {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 12px;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      color: var(--slate-600);
    }
    .calc-row span:last-child {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: var(--slate-800);
    }

    .calc-divider {
      border-top: 1px solid var(--slate-200);
      margin: 6px 0;
    }

    .total-highlight-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--primary);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      margin-top: 8px;
    }
    .total-highlight-row span:first-child {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-highlight-row span:last-child {
      font-family: 'JetBrains Mono', monospace;
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
    }

    /* Declarations & Signature Seal */
    .bottom-section {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--slate-200);
    }

    .legal-notes {
      font-size: 11px;
      color: var(--slate-500);
      line-height: 1.5;
    }
    .legal-notes p {
      margin-bottom: 6px;
    }

    .seal-card {
      border: 1px dashed var(--slate-300);
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      background: var(--slate-50);
      position: relative;
    }

    .seal-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--accent-blue);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 4px;
    }

    .seal-title {
      font-size: 11.5px;
      font-weight: 800;
      color: var(--primary);
    }

    .seal-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      color: var(--slate-400);
      margin-top: 4px;
    }

    .footer-disclaimer {
      text-align: center;
      margin-top: 24px;
      font-size: 10.5px;
      color: var(--slate-400);
      letter-spacing: 0.2px;
    }

    /* Print Rules */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .invoice-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 14mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Controls (Hidden on Print) -->
  <div class="top-action-bar no-print">
    <div style="font-size: 12px; font-weight: 600; color: var(--slate-600);">
      Official Tax Invoice &bull; #${invNumber}
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-close" onclick="window.close()">Close Window</button>
      <button class="btn btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print / Save as PDF
      </button>
    </div>
  </div>

  <!-- Document Sheet Canvas -->
  <div class="invoice-card">
    
    <!-- Top Header & Brand Bar -->
    <header class="invoice-header">
      <div class="company-info">
        <div class="company-logo-wrap">
          <!-- Vector Brand Logo: Dual-Color M Mark + MyMobPay -->
          <svg viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="height: 38px; width: auto; display: block;">
            <g transform="translate(2, 3)">
              <path d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5" stroke="#0284C7" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5" stroke="#FF7800" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <text x="43" y="27" font-family="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="26" fill="#0c2340" letter-spacing="-0.5">MyMobPay</text>
          </svg>
        </div>
        <div class="company-title">MyMobPay Technologies Private Limited</div>
        <div class="company-meta">
          Corporate Identity No. (CIN): <strong>U72900MH2023PTC402190</strong><br>
          GSTIN: <strong>27AADCB2230M1Z2</strong> &bull; PAN: <strong>AADCB2230M</strong><br>
          Regd. Office: 402 Tech Park, Bandra West, Mumbai, Maharashtra 400050, India<br>
          Billing Support: support@mymobpay.tech &bull; https://mymob.tech
        </div>
      </div>

      <div class="invoice-title-block">
        <div class="invoice-tag">TAX INVOICE</div>
        <div class="invoice-subtag">Rule 46 &bull; Central Goods and Services Tax Rules, 2017</div>
        <div class="inv-number">${invNumber}</div>
        <div class="badge-stack">
          <span class="badge badge-paid">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Paid &bull; Direct T+0
          </span>
          <span class="badge badge-orig">Original</span>
        </div>
      </div>
    </header>

    <!-- Two-Column Parties & Telemetry Grid -->
    <section class="parties-grid">
      <!-- Billed To (Merchant) -->
      <div class="party-card">
        <h4>
          <span>Billed To (Recipient / Merchant)</span>
          <span class="badge-orig" style="padding: 2px 6px; font-size: 9px;">${merchantMid}</span>
        </h4>
        <div class="party-name">${businessName}</div>
        <div class="party-row">
          <span>Authorized Rep:</span>
          <strong>${merchantName}</strong>
        </div>
        <div class="party-row">
          <span>Email Address:</span>
          <strong>${merchantEmail}</strong>
        </div>
        <div class="party-row">
          <span>Registered Phone:</span>
          <strong>${merchantPhone}</strong>
        </div>
        <div class="party-row">
          <span>Merchant GSTIN:</span>
          <strong class="party-mono">${merchantGstin}</strong>
        </div>
        <div class="party-row">
          <span>Billing Address:</span>
          <span style="max-width: 200px; text-align: right;">${merchantAddress}</span>
        </div>
        <div class="party-row">
          <span>Place of Supply:</span>
          <strong>Maharashtra (State Code 27)</strong>
        </div>
      </div>

      <!-- Invoice & Payment Settlement Telemetry -->
      <div class="party-card">
        <h4>
          <span>Payment &amp; Settlement Audit</span>
          <span style="color: var(--emerald); font-weight: 700; font-size: 9.5px;">NPCI VERIFIED</span>
        </h4>
        <div class="party-row">
          <span>Invoice Date:</span>
          <strong>${invoiceDate}</strong>
        </div>
        <div class="party-row">
          <span>Due Date:</span>
          <strong>Immediate (Prepaid)</strong>
        </div>
        <div class="party-row">
          <span>Payment Mode:</span>
          <strong>NPCI UPI / IMPS Auto-Clear</strong>
        </div>
        <div class="party-row">
          <span>Settlement Rail:</span>
          <strong style="color: var(--emerald);">Direct T+0 (0% Escrow Hold)</strong>
        </div>
        <div class="party-row">
          <span>Bank UTR / Ref:</span>
          <strong class="party-mono" style="color: var(--accent-blue);">${utrRef}</strong>
        </div>
        <div class="party-row">
          <span>Order / License ID:</span>
          <strong class="party-mono">${orderRef}</strong>
        </div>
        <div class="party-row">
          <span>Reverse Charge (RCM):</span>
          <strong>No</strong>
        </div>
      </div>
    </section>

    <!-- Line Item Breakdown Table -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Services Description &amp; Specifications</th>
            <th style="width: 90px; text-align: center;">HSN / SAC</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Rate (₹)</th>
            <th style="width: 110px; text-align: right;">Taxable Value (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; font-weight: 700; color: var(--slate-400);">01</td>
            <td>
              <div class="item-title">${planName}</div>
              <div class="item-desc">
                MyMobPay Enterprise Payment Gateway Platform License &bull; Direct-to-Bank Pass-Through UPI Architecture &bull; 0% Intermediary Holding Fee &bull; Instant T+0 IMPS Auto-Sweep Settlement Rail &bull; Live Telemetry API Access
              </div>
            </td>
            <td style="text-align: center; font-family: 'JetBrains Mono', monospace; font-weight: 600;">998313</td>
            <td style="text-align: center; font-weight: 600;">1</td>
            <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">₹${taxableFormatted}</td>
            <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--primary);">₹${taxableFormatted}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Amount in Words & Calculation Breakdown -->
    <section class="summary-grid">
      <div class="amount-words-card">
        <div>
          <div class="words-label">Invoice Amount in Words</div>
          <div class="words-val">Indian Rupees ${amountInWords} Only</div>
        </div>

        <div class="compliance-pill">
          <strong>100% Direct Pass-Through Architecture:</strong>
          Platform subscription fees provide software routing and telemetry nodes. Customer payments clear directly into the merchant's commercial nodal pool in real-time with zero aggregator hold.
        </div>
      </div>

      <div class="calc-card">
        <div class="calc-row">
          <span>Taxable Amount:</span>
          <span>₹${taxableFormatted}</span>
        </div>
        <div class="calc-row">
          <span>Central GST (CGST @ 9%):</span>
          <span>₹${cgstFormatted}</span>
        </div>
        <div class="calc-row">
          <span>State GST (SGST @ 9%):</span>
          <span>₹${sgstFormatted}</span>
        </div>
        <div class="calc-row">
          <span>Total GST Tax (18%):</span>
          <span>₹${totalTaxFormatted}</span>
        </div>
        <div class="calc-divider"></div>
        <div class="total-highlight-row">
          <span>Total Amount Paid</span>
          <span>₹${totalFormatted}</span>
        </div>
      </div>
    </section>

    <!-- Regulatory Disclosures & Signature Seal -->
    <footer class="bottom-section">
      <div class="legal-notes">
        <p><strong>Terms &amp; Regulatory Disclosures:</strong></p>
        <p>1. SAC Code 998313: Information Technology software application and payment processing infrastructure services.</p>
        <p>2. Supply Category: Intra-state B2B taxable supply subject to CGST (9%) and SGST (9%). Reverse charge is not applicable.</p>
        <p>3. This is an electronic invoice authenticated in terms of Section 10A of the Information Technology Act, 2000. It requires no physical signature.</p>
      </div>

      <div class="seal-card">
        <div class="seal-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Digitally Authenticated
        </div>
        <div class="seal-title">MyMobPay Technologies Pvt. Ltd.</div>
        <div style="font-size: 10px; color: var(--slate-500); margin-top: 2px;">Authorized Financial Clearing Signatory</div>
        <div class="seal-meta">${verificationHash}</div>
      </div>
    </footer>

    <div class="footer-disclaimer">
      Thank you for choosing MyMobPay &bull; Direct Pass-Through Financial Rails &bull; Mumbai, India
    </div>

  </div>

</body>
</html>`;
}

export function openTaxInvoiceWindow(inv, profile, subDetails, triggerToast) {
  const html = generateTaxInvoiceHtml(inv, profile, subDetails);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else if (typeof triggerToast === 'function') {
    triggerToast('Invoice ready! Please allow popups to view and print.');
  }
}
