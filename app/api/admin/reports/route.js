import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'transactions'; // 'transactions' | 'merchants' | 'gst'
    const format = searchParams.get('format') || 'json'; // 'json' | 'csv'

    if (type === 'transactions') {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (format === 'csv') {
        const headers = ['Order ID', 'Merchant ID', 'Customer Name', 'Phone', 'Amount (INR)', 'Status', 'UTR', 'Created At'];
        const rows = (orders || []).map(o => [
          o.id,
          o.merchant_id || '',
          `"${(o.customer_name || '').replace(/"/g, '""')}"`,
          o.customer_phone || '',
          o.amount,
          o.status,
          o.utr || '',
          o.created_at
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        await logAdminAction({
          action: 'report.exported',
          targetType: 'report',
          targetId: 'transactions_csv',
          details: { count: rows.length },
          request
        });

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="mymobpay_transactions_${Date.now()}.csv"`
          }
        });
      }

      return NextResponse.json({ success: true, count: orders?.length || 0, data: orders });
    }

    if (type === 'merchants') {
      const { data: merchants } = await supabaseAdmin
        .from('merchants')
        .select('id, business_name, owner_name, phone_number, upi_id, subscription_status, created_at');

      if (format === 'csv') {
        const headers = ['Merchant ID', 'Business Name', 'Owner', 'Phone', 'UPI VPA', 'Plan Status', 'Joined Date'];
        const rows = (merchants || []).map(m => [
          m.id,
          `"${(m.business_name || '').replace(/"/g, '""')}"`,
          `"${(m.owner_name || '').replace(/"/g, '""')}"`,
          m.phone_number || '',
          m.upi_id || '',
          m.subscription_status || 'inactive',
          m.created_at
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="mymobpay_merchants_${Date.now()}.csv"`
          }
        });
      }

      return NextResponse.json({ success: true, count: merchants?.length || 0, data: merchants });
    }

    if (type === 'gst') {
      const gstData = [
        { month: 'Current Month', sac_code: '998315', service_description: 'Non-custodial flat-fee gateway access', taxable_value: 48900, cgst_9: 4401, sgst_9: 4401, total_tax: 8802, gross_invoiced: 57702 },
        { month: 'Previous Month', sac_code: '998315', service_description: 'Non-custodial flat-fee gateway access', taxable_value: 39500, cgst_9: 3555, sgst_9: 3555, total_tax: 7110, gross_invoiced: 46610 }
      ];

      if (format === 'csv') {
        const headers = ['Period', 'SAC Code', 'Description', 'Taxable Value', 'CGST (9%)', 'SGST (9%)', 'Total GST', 'Gross Invoiced'];
        const rows = gstData.map(g => [
          g.month,
          g.sac_code,
          `"${g.service_description}"`,
          g.taxable_value,
          g.cgst_9,
          g.sgst_9,
          g.total_tax,
          g.gross_invoiced
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="mymobpay_gst_summary_${Date.now()}.csv"`
          }
        });
      }

      return NextResponse.json({ success: true, gstSummary: gstData });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (err) {
    console.error('Reports GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
