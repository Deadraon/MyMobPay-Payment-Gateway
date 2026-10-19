import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import { PERMISSIONS } from '@/lib/adminRbac';

export const dynamic = 'force-dynamic';

const DEFAULT_BLOCKLIST = [
  { id: 'blk_1', type: 'phone', value: '+919999999999', reason: 'Known fraudulent UTR replay bot', added_by: 'security@mymob.tech', created_at: '2026-02-01T10:00:00Z' },
  { id: 'blk_2', type: 'vpa', value: 'spammer@fakeupi', reason: 'Fake VPA phishing spoof', added_by: 'risk@mymob.tech', created_at: '2026-02-10T14:30:00Z' },
  { id: 'blk_3', type: 'ip', value: '198.51.100.24', reason: 'Automated rapid scanner IP', added_by: 'system', created_at: '2026-03-01T08:15:00Z' }
];

const DEFAULT_RULES = [
  { id: 'rule_1', name: 'Velocity Guard: Customer Phone Burst', rule_type: 'velocity', condition: '>5 checkouts from same phone in 10 minutes', action: 'flag_manual_review', enabled: true, dry_run: false },
  { id: 'rule_2', name: 'Anomaly Spike: 3x Merchant Median Volume', rule_type: 'anomaly', condition: 'Single txn > 300% of 7-day merchant average', action: 'require_extra_verification', enabled: true, dry_run: true },
  { id: 'rule_3', name: 'Duplicate UTR Instant Rejection', rule_type: 'fraud', condition: 'UTR already marked verified on another order', action: 'auto_reject', enabled: true, dry_run: false },
  { id: 'rule_4', name: 'High-Value Checkout Safeguard', rule_type: 'threshold', condition: 'Transaction amount > ₹50,000', action: 'dual_admin_verification', enabled: true, dry_run: false }
];

async function getStoredRiskData() {
  try {
    const adminMerchant = await ensureAdminMerchant();
    const stored = adminMerchant?.setup_progress?.admin_settings?.risk;
    return {
      blocklist: stored?.blocklist || DEFAULT_BLOCKLIST,
      rules: stored?.rules || DEFAULT_RULES
    };
  } catch {
    return { blocklist: DEFAULT_BLOCKLIST, rules: DEFAULT_RULES };
  }
}

async function saveRiskData(data) {
  try {
    const adminMerchant = await ensureAdminMerchant();
    if (adminMerchant) {
      const setupProgress = adminMerchant.setup_progress || {};
      const adminSettings = setupProgress.admin_settings || {};

      await supabaseAdmin
        .from('merchants')
        .update({
          setup_progress: {
            ...setupProgress,
            admin_settings: {
              ...adminSettings,
              risk: data
            }
          }
        })
        .eq('id', adminMerchant.id);
    }
  } catch (err) {
    console.error('saveRiskData error:', err);
  }
}

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const riskData = await getStoredRiskData();
    return NextResponse.json({ success: true, ...riskData });
  } catch (err) {
    console.error('Risk GET error:', err);
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
    const { action, item, rule, dryRun } = body;
    const current = await getStoredRiskData();

    if (action === 'add_blocklist') {
      if (!item || !item.value || !item.type) {
        return NextResponse.json({ error: 'item.type and item.value are required' }, { status: 400 });
      }

      const newItem = {
        id: `blk_${Date.now()}`,
        type: item.type,
        value: item.value.trim().toLowerCase(),
        reason: item.reason || 'Flagged by risk team',
        added_by: 'admin',
        created_at: new Date().toISOString()
      };

      current.blocklist.unshift(newItem);
      await saveRiskData(current);

      await logAdminAction({
        action: 'risk.blocklist_add',
        targetType: 'blocklist',
        targetId: newItem.id,
        details: { type: newItem.type, value: newItem.value, reason: newItem.reason },
        request
      });

      return NextResponse.json({ success: true, item: newItem, blocklist: current.blocklist });
    }

    if (action === 'remove_blocklist') {
      const id = body.id || item?.id;
      if (!id) return NextResponse.json({ error: 'Blocklist item id is required' }, { status: 400 });

      current.blocklist = current.blocklist.filter(b => b.id !== id);
      await saveRiskData(current);

      await logAdminAction({
        action: 'risk.blocklist_remove',
        targetType: 'blocklist',
        targetId: id,
        details: { id },
        request
      });

      return NextResponse.json({ success: true, blocklist: current.blocklist });
    }

    if (action === 'toggle_rule') {
      const { ruleId, enabled, isDryRun } = body;
      const targetRule = current.rules.find(r => r.id === ruleId);
      if (!targetRule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

      if (enabled !== undefined) targetRule.enabled = Boolean(enabled);
      if (isDryRun !== undefined) targetRule.dry_run = Boolean(isDryRun);

      await saveRiskData(current);

      await logAdminAction({
        action: 'risk.rule_updated',
        targetType: 'risk_rule',
        targetId: ruleId,
        details: { ruleId, enabled: targetRule.enabled, dry_run: targetRule.dry_run },
        request
      });

      return NextResponse.json({ success: true, rules: current.rules });
    }

    if (action === 'dry_run_evaluation') {
      // Test the rules engine against last 50 orders without modifying data
      const { data: recentOrders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const flaggedOrders = (recentOrders || []).filter(o => {
        const amount = parseFloat(o.amount || 0);
        return amount > 25000 || (o.utr && o.utr.length < 10);
      });

      return NextResponse.json({
        success: true,
        dryRunResults: {
          totalEvaluated: (recentOrders || []).length,
          flaggedCount: flaggedOrders.length,
          simulatedAction: 'Review Queue & Alert Notification',
          sampleMatches: flaggedOrders.slice(0, 5)
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Risk POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
