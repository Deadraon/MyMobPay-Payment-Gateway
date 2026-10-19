import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/adminSettings';
import { hasPermission, PERMISSIONS } from '@/lib/adminRbac';
import { logAdminAction } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { merchantId, field, reason } = body;

    if (!merchantId || !field) {
      return NextResponse.json({ error: 'merchantId and field are required' }, { status: 400 });
    }

    if (!reason || String(reason).trim().length < 5) {
      return NextResponse.json({ error: 'A justification reason of at least 5 characters is mandatory for unmasking sensitive data.' }, { status: 400 });
    }

    // Identify actor details from auth header
    let actorEmail = 'admin@mymob.tech';
    let actorRole = 'super_admin';

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token).catch(() => ({ data: { user: null } }));
      if (user?.email) {
        actorEmail = user.email;
        // Check role
        if (actorEmail === 'chauhankunal695@gmail.com' || actorEmail === 'deadraon@gmail.com') {
          actorRole = 'super_admin';
        } else {
          actorRole = 'operations';
        }
      }
    }

    // Enforce data.reveal permission
    if (!hasPermission(actorRole, PERMISSIONS.DATA_REVEAL)) {
      return NextResponse.json({ 
        error: `Permission Denied: Your role (${actorRole}) is not permitted to unmask sensitive financial credentials.`,
        code: 'INSUFFICIENT_PERMISSIONS'
      }, { status: 403 });
    }

    // Fetch the raw merchant record
    const { data: merchant, error: dbError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, api_key, bank_account_number, bank_ifsc, bank_name, phone_number, upi_id, gstin')
      .eq('id', merchantId)
      .single();

    if (dbError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    let unmaskedValue = null;
    switch (field) {
      case 'api_key':
        unmaskedValue = merchant.api_key;
        break;
      case 'bank_account_number':
        unmaskedValue = merchant.bank_account_number;
        break;
      case 'phone_number':
        unmaskedValue = merchant.phone_number;
        break;
      case 'upi_id':
        unmaskedValue = merchant.upi_id;
        break;
      case 'gstin':
        unmaskedValue = merchant.gstin;
        break;
      default:
        return NextResponse.json({ error: `Field '${field}' cannot be unmasked` }, { status: 400 });
    }

    // Record immutable audit entry
    await logAdminAction({
      actor: { email: actorEmail, role: actorRole },
      action: PERMISSIONS.DATA_REVEAL,
      targetType: 'merchant',
      targetId: merchant.id,
      details: {
        field,
        merchant_name: merchant.business_name,
        justification: reason.trim()
      },
      request
    });

    return NextResponse.json({
      success: true,
      field,
      unmaskedValue,
      message: `Sensitive field '${field}' revealed and recorded to immutable audit log.`
    });

  } catch (err) {
    console.error('Data reveal API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
