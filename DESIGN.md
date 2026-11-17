---
version: alpha
name: mymobpay.tech
description: MyMobPay's design system — an enterprise financial gateway brand built on an electric cobalt blue, high-contrast crisp architectural grids, and direct-to-bank zero-custody infrastructure. The system pairs Anton and Barlow Condensed display typography with Plus Jakarta Sans body text and JetBrains Mono for financial tokens and API code. Interactive elements include sculpted 3D clay/titanium iPhone mockups, real-time volume savings calculators, a live REST API code terminal, and a classic editorial typewriter engine.

colors:
  primary: "#0F2BFF"
  primary-hover: "#081EC4"
  primary-press: "#061594"
  primary-soft: "#E8EDFF"
  primary-glow: "rgba(15, 43, 255, 0.35)"
  brand-dark-900: "#090A10"
  brand-navy-banner: "#211D8A"
  accent-orange: "#FF6D00"
  accent-amber: "#FF9614"
  success-green: "#10B981"
  success-deep: "#059669"
  success-soft: "#E6F4EA"
  danger-red: "#DC2626"
  danger-soft: "#FFF5F5"
  canvas: "#FFFFFF"
  canvas-secondary: "#F2F3FB"
  canvas-well: "#F7F8FD"
  canvas-elevated: "#FFFFFF"
  border-subtle: "#E2E5F4"
  border-phone: "#ECEEF8"
  text-primary: "#090A10"
  text-secondary: "#222533"
  text-muted: "#5A607A"
  dark-canvas: "#0B0E14"
  dark-canvas-secondary: "#101520"
  dark-canvas-elevated: "#161D2B"
  dark-canvas-well: "#0E131D"
  dark-border: "#232D42"
  dark-text-primary: "#F8FAFC"
  dark-text-secondary: "#CBD5E1"
  dark-text-muted: "#94A3B8"
  dark-accent-link: "#60A5FA"

typography:
  display-hero:
    fontFamily: "'Anton', 'Barlow Condensed', Impact, sans-serif"
    fontSize: 54px
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: 0.01em
    textTransform: uppercase
  display-section:
    fontFamily: "'Anton', 'Barlow Condensed', Impact, sans-serif"
    fontSize: 42px
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: 0.01em
    textTransform: uppercase
  display-card:
    fontFamily: "'Anton', 'Barlow Condensed', Impact, sans-serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 0.01em
    textTransform: uppercase
  stat-tabular:
    fontFamily: "'Barlow Condensed', 'Anton', sans-serif"
    fontSize: 36px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.01em
    fontFeature: tnum
    textTransform: uppercase
  heading-lg:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.02em
  heading-md:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: -0.01em
  body-lead:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: 0
  body-md:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: 13.5px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: 0
  code-mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: -0.02em
  code-micro:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  button-primary:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: 13.5px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0
  badge-eyebrow:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.08em
    textTransform: uppercase

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  phone: 50px
  pill: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 64px
  section: 96px

components:
  button-primary-pill:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.button-primary}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
  button-secondary-outline:
    backgroundColor: "transparent"
    borderColor: "{colors.border-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.button-primary}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
  nav-pill-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: 6px 12px
  card-bento:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border-subtle}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 24px
  card-pricing-standard:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border-subtle}"
    rounded: "{rounded.xl}"
    padding: 28px
  card-pricing-popular:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: 28px
  clay-iphone-chassis:
    backgroundColor: "#F5F6FC"
    borderColor: "rgba(255, 255, 255, 0.95)"
    rounded: "{rounded.phone}"
    width: 316px
    height: 610px
    padding: 14px
  api-terminal:
    backgroundColor: "#0F172A"
    borderColor: "#1E293B"
    rounded: "{rounded.xl}"
    padding: 20px
---
<!-- MIT licensed. Copyright and license: https://opendesignmd.com/licenses/ -->

# How mymobpay.tech is designed

## Overview

MyMobPay is an enterprise-grade Indian payment infrastructure platform enabling merchants to accept Direct-to-Bank UPI and IMPS collections with 0% platform commission, zero escrow custody, and instant T+0 NPCI rail settlement. The homepage design language blends high-velocity financial engineering with physical hardware craftsmanship and editorial boldness.

The design breaks away from muted fintech cliches by fusing an architectural blue grid backdrop (`48px x 48px`), high-contrast uppercase display typography (`Anton` and `Barlow Condensed`), tactile ceramic-clay and titanium 3D smartphone models, an interactive real-time 0% fee savings calculator, and a live REST API code terminal.

### Key Visual Signatures
1. **Architectural Blue Grid Canvas**: An ultra-subtle engineering graph (`linear-gradient(to right, rgba(15, 43, 255, 0.055) 1px, transparent 1px)`) laid across section headers and hero viewports, evoking blueprints, circuit diagrams, and banking switchboards.
2. **Kinetic Editorial Typewriter**: The hero headline delivers crisp value statements using the heavyweight `Anton` typeface, cycling through `OWN IT.`, `KEEP 100%.`, `ZERO FEES.`, and `SETTLE T+0.` in pure electric cobalt blue (`#0F2BFF`) with an animated pulsing caret.
3. **Sculpted 3D Clay & Titanium iPhone Chassis**: Custom-proportioned 316px by 610px ceramic device mockups with smooth rounded 50px corners, hardware buttons (silent rocker, volume rockers, power key), top speaker slit, camera sensor, and realistic soft drop-shadows. Inside, mobile checkouts showcase live payment feeds, dynamic QR codes, and simulated UTR reconciliation.
4. **Dual Light and Dark Polarity**: Seamless theme switching between clean ceramic light surfaces (`#FFFFFF`, `#F2F3FB`) and dark tactical operations surfaces (`#0B0E14`, `#101520`, `#161D2B`).
5. **Exact 0% Fee Calculator Slider**: A tactile volume range slider enabling merchants to calculate their exact savings compared to standard 2.0% gateway MDR + 18% GST on fees across monthly volumes from ₹50,000 to ₹1,00,00,000.
6. **Live Developer REST API Sandbox**: A dual-pane terminal featuring syntax-highlighted cURL requests and 200 OK JSON responses with real-time endpoint switching and clipboard triggers.

---

## Brand Identity & Logo Mark

The MyMobPay logo mark is a continuous 3D geometric ribbon forming an architectural "M" shape across 4 distinct gradient segments:
- **Segment 1 (Center-Left Blue Fold)**: `#004BFF` to `#0033B5`
- **Segment 2 (Center-Right Orange Arch)**: `#E64400` to `#FF9614`
- **Segment 3 (Left Outer Cyan Leg)**: `#0044E5` to `#00C8FF`
- **Segment 4 (Right Outer Amber Leg)**: `#FF9E1B` to `#F05A00`

The mark is accompanied by the logotype: **MyMobPay** (`MyMob` in ink primary `#090A10` or `#F8FAFC`, `Pay` in cobalt `#0F2BFF`) with the sub-badge `0% MDR ENTERPRISE`.

---

## Colors

### Primary Palette
- **Electric Cobalt** (`{colors.primary}` — `#0F2BFF`): The core brand anchor. Used for primary CTAs, active states, typewriter accents, and focus rings.
- **Cobalt Hover** (`{colors.primary-hover}` — `#081EC4`): Deepened cobalt for button hover feedback.
- **Cobalt Soft** (`{colors.primary-soft}` — `#E8EDFF`): Low-opacity blue fill for status badges and pill backgrounds.
- **Deep Navy Banner** (`{colors.brand-navy-banner}` — `#211D8A`): Deep operational container background used for the security protocol section.

### Accent & Secondary
- **Vibrant Orange** (`{colors.accent-orange}` — `#FF6D00`): Secondary brand energy derived from the ribbon mark.
- **Sun Amber** (`{colors.accent-amber}` — `#FF9614`): Highlight stop in decorative gradients and orbital rings.
- **Emerald Kept** (`{colors.success-green}` — `#10B981`): Represents 100% kept merchant revenue, settled UTR status, and HTTP 200 OK responses.
- **Emerald Soft** (`{colors.success-soft}` — `#E6F4EA`): Background pill fill for settled orders and zero-fee badges.
- **Crimson Drag** (`{colors.danger-red}` — `#DC2626`): Represents legacy gateway fee losses, commission deductions, and MDR drag.

### Surface Tones (Light Mode)
- **Canvas Primary** (`{colors.canvas}` — `#FFFFFF`): Clean crisp base for content containers and product cards.
- **Canvas Secondary** (`{colors.canvas-secondary}` — `#F2F3FB`): Slightly cool tinted off-white backing for grid-textured sections.
- **Canvas Well** (`{colors.canvas-well}` — `#F7F8FD`): Inset recesses and subtle input backgrounds.
- **Border Subtle** (`{colors.border-subtle}` — `#E2E5F4`): 1px structural hairbars separating cards, tables, and nav bars.

### Surface Tones (Dark Mode)
- **Dark Canvas Primary** (`{colors.dark-canvas}` — `#0B0E14`): Deep obsidian base surface.
- **Dark Canvas Secondary** (`{colors.dark-canvas-secondary}` — `#101520`): Deep blue-tinted secondary section background.
- **Dark Canvas Elevated** (`{colors.dark-canvas-elevated}` — `#161D2B`): Bento cards, navigation shells, and modal containers.
- **Dark Canvas Well** (`{colors.dark-canvas-well}` — `#0E131D`): Inset panels and code wells.
- **Dark Border** (`{colors.dark-border}` — `#232D42`): Crisp structural division lines in dark mode.

---

## Typography

### Font Families
1. **Anton** (`'Anton', Impact, sans-serif`): High-impact, condensed, heavyweight display font used exclusively for main section titles, hero punchlines, and the typewriter engine.
2. **Barlow Condensed** (`'Barlow Condensed', sans-serif`): High-density tabular numerics, currency figures, and financial statistics.
3. **JetBrains Mono** (`'JetBrains Mono', monospace`): Code payloads, API keys, UTR transaction numbers, and technical metadata.
4. **Plus Jakarta Sans** (`'Plus Jakarta Sans', system-ui, sans-serif`): Primary UI typeface for navigation, body text, buttons, and form labels.

### Typographic Hierarchy

| Role | Font Family | Size | Weight | Line Height | Tracking | Text Case |
|---|---|---|---|---|---|---|
| `display-hero` | Anton | 54px | 400 | 0.95 | 0.01em | Uppercase |
| `display-section` | Anton | 42px | 400 | 0.96 | 0.01em | Uppercase |
| `display-card` | Anton | 28px | 400 | 1.00 | 0.01em | Uppercase |
| `stat-tabular` | Barlow Condensed | 36px | 800 | 1.00 | -0.01em | Tabular Nums |
| `heading-lg` | Plus Jakarta Sans | 20px | 700 | 1.30 | -0.02em | Normal |
| `heading-md` | Plus Jakarta Sans | 16px | 700 | 1.35 | -0.01em | Normal |
| `body-lead` | Plus Jakarta Sans | 15px | 500 | 1.55 | 0.00em | Normal |
| `body-md` | Plus Jakarta Sans | 13.5px | 500 | 1.50 | 0.00em | Normal |
| `code-mono` | JetBrains Mono | 12px | 500 | 1.50 | -0.02em | Monospace |
| `badge-eyebrow`| JetBrains Mono | 10px | 700 | 1.20 | 0.08em | Uppercase |

---

## Layout & Spatial Geometry

### Spacing Scale
- `xxs`: 2px
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `xxl`: 32px
- `huge`: 64px
- `section`: 96px to 112px on desktop, 48px to 64px on mobile

### Containers & Responsive Grid
- Maximum content width: `1280px` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
- Bento cards arrange in 12-column responsive CSS grids (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6`).
- Pricing cards arrange in a 4-tier grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`).

---

## Elevation, Depth & Atmospheric Details

| Level | Styling | Usage |
|---|---|---|
| Level 0 | Flat surface | Page background |
| Level 1 | `box-shadow: 0 4px 16px -4px rgba(20, 24, 80, 0.05)` | Bento feature cards, nav pill |
| Level 2 | `box-shadow: 0 10px 30px -10px rgba(20, 24, 80, 0.08)` | Active pricing card, floating badges |
| Level 3 | `box-shadow: -24px 28px 54px rgba(20, 24, 80, 0.14)` | 3D Clay iPhone hardware chassis |

### Atmospheric Decor
- **Architectural Grid**: `48px x 48px` subtle linear graph overlaying secondary backgrounds.
- **Orbital Rings**: Dashed concentric orbital rings (`orbit-ring-cw`, `orbit-ring-ccw`) spinning in 28s and 20s opposite cycles behind device mockups.
- **Dot Matrix**: `24px x 24px` radial point field adding depth behind technical diagrams.
- **Vertical Grid Beams**: Glowing light pulses traveling downward through grid columns.

---

## Section Architecture of the Homepage

### 1. Sticky Navigation Header
- **Floating Pill Container**: Centered pill bar (`header-nav-pill`) with backdrop blur 14px.
- **Brand Identity**: Ribbon logo mark + "MyMobPay" wordmark.
- **Anchor Links**: Why 0% Fees, Direct Bank, Savings Calculator, Developer API, Pricing, FAQ.
- **Controls**: Dark / Light theme toggle, Sign In link, and "Get Started Free" primary CTA pill.

### 2. Hero Section (`#home-hero`)
- **Eyebrow Badge**: `DIRECT TO BANK NPCI RAILS • 0% MDR ENTERPRISE`.
- **Display Title**: Anton uppercase headline with integrated Cobalt Typewriter engine (`OWN IT.`, `KEEP 100%.`, `ZERO FEES.`, `SETTLE T+0.`).
- **Lead Copy**: Highlights zero platform custody, direct settlement to merchant bank accounts, and instant dynamic UPI QR generation.
- **Action Group**: Primary "Start Collecting Free" button paired with "Explore Developer API" outline pill.
- **Interactive Hero iPhone**: 3D ceramic chassis presenting live incoming UPI payment alerts, dynamic QR codes, and sub-150ms verification velocity.

### 3. "Own Your Money" Live Vault (`#own-your-money`)
- Demonstrates direct NPCI settlement routing.
- Visual flow: Buyer UPI App -> 0% Cut Direct Rail -> Merchant Current Account (IndusInd / HDFC).
- Interactive filter pills (All, UPI QR, IMPS) dynamically recalculating transaction volumes and fee savings.

### 4. 2% MDR Drag vs 0% Enterprise Drag (`#fees-drag`)
- Compares traditional aggregator escrow delays, 2.0% MDR commissions, and rolling reserves with MyMobPay's flat SaaS license model.

### 5. Settlement Velocity & Real-time Webhooks (`#settles-fast`)
- Visualizes instant webhook dispatch (`payment.settled`, `utr.matched`) with 142ms latency metrics and automated bank reconciliation.

### 6. Savings Calculator & Volume Slider (`#gateway-comparison`)
- Interactive range slider from ₹50,000 to ₹1,00,00,000 monthly volume.
- Real-time side-by-side computation:
  - **Legacy 2% Gateway**: ₹X,XX,XXX lost annually to gateway commission fees.
  - **MyMobPay 0% Model**: 100% net settlement retained, showing exact annual savings.

### 7. Merchant Use Cases & Workflows
- 5 Cards illustrating production setups:
  1. Billing Counter Standee QR
  2. E-Commerce Checkout APIs
  3. Branded Payment Links
  4. SaaS Recurring Invoicing
  5. Automated 12-Digit UTR Matcher

### 8. Transparent SaaS Platform Licenses (`#pick-plan`)
- Interactive Monthly / Annual billing toggle (with 20% annual discount badge).
- 4 Tiers:
  - **Free Link Starter (₹0/forever)**: For creators, up to 100 txns/mo.
  - **Starter (₹99/mo)**: For small businesses, up to 300 txns/mo, unlimited links.
  - **Growth (₹299/mo)**: Featured card, full REST API, 5 webhooks, 1,000 verified txns/mo.
  - **Pro Flagship (₹499/mo)**: High-volume enterprise, unlimited txns, 24/7 WhatsApp VIP support.

### 9. Developer REST API Sandbox (`#clean-apis`)
- Dual-column code terminal with interactive tabs:
  - `POST /payments/create`
  - `GET /payments/{id}`
  - `POST /webhooks/payment`
- Syntax-highlighted code with instant copy buttons and 200 OK simulated response payload.

### 10. Security & Infrastructure Deep-Dive
- High-contrast deep navy banner (`#211D8A`) covering TLS 1.3 Transport, HMAC-SHA256 cryptographically signed webhooks, and strict merchant workspace isolation.

### 11. Merchant FAQ Accordion (`#faq-section`)
- Interactive expandable questions addressing NPCI compliance, bank account linking, zero escrow safety, and dispute resolution.

### 12. Final Launch CTA & Site-wide Footer
- Bold closing call-to-action with the 3D logo ribbon mark and multi-column sitemap navigation (Product, Developers, Company, Legal, Security).

---

## Design Tokens & CSS Variables Reference

```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F2F3FB;
  --bg-elevated: #FFFFFF;
  --bg-well: #F7F8FD;
  --bg-header: rgba(242, 243, 251, 0.90);
  --bg-pill-nav: rgba(255, 255, 255, 0.92);
  --text-primary: #090A10;
  --text-secondary: #222533;
  --text-muted: #5A607A;
  --accent-link: #0F2BFF;
  --border-color: #E2E5F4;
  --card-shadow: 0 10px 30px -10px rgba(20, 24, 80, 0.07);
}

html.dark {
  --bg-primary: #0B0E14;
  --bg-secondary: #101520;
  --bg-elevated: #161D2B;
  --bg-well: #0E131D;
  --bg-header: rgba(11, 14, 20, 0.90);
  --bg-pill-nav: rgba(22, 29, 43, 0.95);
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --accent-link: #60A5FA;
  --border-color: #232D42;
  --card-shadow: 0 16px 38px -10px rgba(0, 0, 0, 0.55);
}
```

---

## Do's and Don'ts

### Do
- Always use the `Anton` font for high-impact display headlines and the typewriter word.
- Maintain high-contrast electric cobalt (`#0F2BFF`) for primary buttons and interactive accents.
- Display tabular numerics using `Barlow Condensed` with `font-feature-settings: "tnum"` for currency amounts and settlement metrics.
- Keep 3D ceramic iPhone mockups proportional (316px width) with smooth rounded 50px corners and hardware chassis details.
- Preserve the architectural grid background (`48px x 48px`) across marketing hero sections and feature headers.
- Strictly maintain zero emojis across all product UI elements, typography, and documentation.

### Don't
- Never use generic low-contrast sans-serif fonts for primary display headlines.
- Do not introduce non-system accent colors outside the defined brand palette (Cobalt, Orange, Amber, Emerald, Navy).
- Do not remove the physical chassis styling from the mobile preview mockups.
- Avoid flat un-shadowed cards on pure white canvases without subtle hairlines (`#E2E5F4`).
- Do not allow interactive sliders to stutter or omit the exact 0% commission savings comparison.
