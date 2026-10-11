import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/adminSettings';

// GET: Fetch all registered merchants (bypassing RLS)
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);

    // Verify admin access
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const { data: merchants, error } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const processedMerchants = merchants.map(m => {
       let isSubActive = m.subscription_status === 'active';
       if (isSubActive && m.subscription_expires_at) {
          if (new Date(m.subscription_expires_at) < new Date()) {
             m.subscription_status = 'expired';
          }
       }
       return m;
     });

    return NextResponse.json({ success: true, merchants: processedMerchants });
  } catch (err) {
    console.error('API admin merchants GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Administrative actions on merchants
export async function POST(request) {
  try {
    const body = await request.json();
    const { merchantId, action, status } = body;
    const isAuthorized = await verifyAdminAuth(request);

    // Verify admin access
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    if (action === 'toggleSubscription') {
      if (!['active', 'inactive'].includes(status)) {
        return NextResponse.json({ error: 'Status must be active or inactive' }, { status: 400 });
      }

      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update({ subscription_status: status })
        .eq('id', merchantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating merchant subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, merchant });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('API admin merchants POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
