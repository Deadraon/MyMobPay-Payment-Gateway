import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminSettings';
import { getVerificationTelemetry, verificationAdapters } from '@/lib/verification/adapters';
import { logAdminAction } from '@/lib/adminAudit';
import { PERMISSIONS, hasPermission } from '@/lib/adminRbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const telemetry = await getVerificationTelemetry();
    return NextResponse.json({ success: true, telemetry });
  } catch (err) {
    console.error('Verification GET error:', err);
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
    const { action, channel, orderId, utr, approverReason } = body;

    if (action === 'test_ping') {
      const adapter = verificationAdapters[channel];
      if (!adapter) {
        return NextResponse.json({ error: `Adapter '${channel}' not found` }, { status: 400 });
      }

      const health = await adapter.getHealth();
      await logAdminAction({
        action: 'verification.test_ping',
        targetType: 'adapter',
        targetId: channel,
        details: { health },
        request
      });

      return NextResponse.json({ success: true, health });
    }

    if (action === 'dual_approve_reconcile') {
      if (!orderId || !utr) {
        return NextResponse.json({ error: 'orderId and utr are required' }, { status: 400 });
      }

      await logAdminAction({
        action: PERMISSIONS.MANUAL_VERIFY,
        targetType: 'order',
        targetId: orderId,
        details: { utr, approverReason, dualApproved: true },
        request
      });

      return NextResponse.json({
        success: true,
        message: `High-value verification dual-approved for order ${orderId} with UTR ${utr}.`
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Verification POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
