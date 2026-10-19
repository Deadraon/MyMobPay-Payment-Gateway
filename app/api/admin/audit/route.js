import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminSettings';
import { getAuditLogs, logAdminAction } from '@/lib/adminAudit';
import { hasPermission, PERMISSIONS } from '@/lib/adminRbac';

export const dynamic = 'force-dynamic';

// GET: Fetch paginated audit trail
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const action = searchParams.get('action') || null;
    const actorEmail = searchParams.get('actor') || null;
    const targetType = searchParams.get('targetType') || null;

    const result = await getAuditLogs({ limit, offset, action, actorEmail, targetType });

    return NextResponse.json({
      success: true,
      logs: result.logs || [],
      total: result.total || 0,
      limit,
      offset
    });
  } catch (err) {
    console.error('Audit GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add custom manual audit note or operational record
export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { action, targetType, targetId, details } = body;

    const entry = await logAdminAction({
      actor: { email: 'admin@mymob.tech', role: 'super_admin' },
      action: action || 'note.created',
      targetType: targetType || 'system',
      targetId: targetId || null,
      details: details || {},
      request
    });

    return NextResponse.json({ success: true, log: entry });
  } catch (err) {
    console.error('Audit POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
