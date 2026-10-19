import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';

const DEFAULT_PLANS = [
  {
    id: 'plan_starter',
    name: 'Starter Flat SaaS',
    price_inr: 499,
    billing_period: 'monthly',
    txn_limit: 'Unlimited (0% MDR)',
    features: ['Direct VPA settlement', 'Instant UTR verification', 'Standard email support'],
    is_active: true
  },
  {
    id: 'plan_pro',
    name: 'Pro Business SaaS',
    price_inr: 1299,
    billing_period: 'monthly',
    txn_limit: 'Unlimited (0% MDR)',
    features: ['Direct VPA settlement', 'High-speed automated verification', 'Outbound Webhooks', 'Priority WhatsApp support'],
    is_active: true
  },
  {
    id: 'plan_annual',
    name: 'Annual Flat Sovereign',
    price_inr: 9999,
    billing_period: 'yearly',
    txn_limit: 'Unlimited (0% MDR)',
    features: ['All Pro features', '2 months complimentary', 'Custom API branding', 'Dedicated account manager'],
    is_active: true
  }
];

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const adminMerchant = await ensureAdminMerchant();
    const storedPlans = adminMerchant?.setup_progress?.admin_settings?.plans || DEFAULT_PLANS;

    return NextResponse.json({
      success: true,
      plans: storedPlans,
      tax_config: {
        sac_code: '998315',
        sac_description: 'Hosting and information technology (IT) infrastructure provisioning services',
        gst_rate: 18,
        cgst_rate: 9,
        sgst_rate: 9
      }
    });
  } catch (err) {
    console.error('Billing GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { action, plan, merchantId, reason, days } = body;
    const adminMerchant = await ensureAdminMerchant();
    const setupProgress = adminMerchant?.setup_progress || {};
    const adminSettings = setupProgress.admin_settings || {};
    let plans = adminSettings.plans || DEFAULT_PLANS;

    if (action === 'save_plan') {
      if (!plan || !plan.name || !plan.price_inr) {
        return NextResponse.json({ error: 'Plan name and price are required' }, { status: 400 });
      }

      const existingIdx = plans.findIndex(p => p.id === plan.id);
      if (existingIdx >= 0) {
        plans[existingIdx] = { ...plans[existingIdx], ...plan };
      } else {
        plans.push({
          id: `plan_${Date.now()}`,
          ...plan,
          is_active: true
        });
      }

      await supabaseAdmin
        .from('merchants')
        .update({
          setup_progress: {
            ...setupProgress,
            admin_settings: {
              ...adminSettings,
              plans
            }
          }
        })
        .eq('id', adminMerchant.id);

      await logAdminAction({
        action: 'billing.plan_saved',
        targetType: 'plan',
        targetId: plan.id,
        details: { planName: plan.name, price: plan.price_inr },
        request
      });

      return NextResponse.json({ success: true, plans });
    }

    if (action === 'grant_complimentary') {
      if (!merchantId || !reason || reason.trim().length < 5) {
        return NextResponse.json({ error: 'A justification reason of at least 5 characters is required for complimentary access.' }, { status: 400 });
      }

      const grantedDays = parseInt(days || 30, 10);
      const newExpiry = new Date(Date.now() + grantedDays * 24 * 60 * 60 * 1000).toISOString();

      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update({
          subscription_status: 'active',
          subscription_expires_at: newExpiry
        })
        .eq('id', merchantId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await logAdminAction({
        action: 'billing.complimentary_grant',
        targetType: 'merchant',
        targetId: merchantId,
        details: { merchantName: merchant.business_name, days: grantedDays, reason },
        request
      });

      return NextResponse.json({ success: true, newExpiry, merchant });
    }

    if (action === 'generate_invoice') {
      const { merchantName, merchantGstin, planName, amount } = body;
      const baseAmount = Math.round((parseFloat(amount) / 1.18) * 100) / 100;
      const gstAmount = Math.round((parseFloat(amount) - baseAmount) * 100) / 100;
      const halfGst = Math.round((gstAmount / 2) * 100) / 100;

      const invoiceData = {
        invoice_number: `INV-MMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        merchant_name: merchantName || 'Valued Partner',
        merchant_gstin: merchantGstin || 'URP (Unregistered Person)',
        sac_code: '998315',
        plan_name: planName || 'Flat-Fee Subscription',
        base_amount: baseAmount,
        cgst_amount: halfGst,
        sgst_amount: halfGst,
        total_amount: parseFloat(amount)
      };

      return NextResponse.json({ success: true, invoice: invoiceData });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Billing POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
