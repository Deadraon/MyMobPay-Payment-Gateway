import { NextResponse } from 'next/server';
import { getWhatsAppHealthStatus, resetWhatsAppHealth } from '@/lib/whatsappHealth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '';
    const reset = searchParams.get('reset');

    if (reset === 'true') {
      resetWhatsAppHealth();
      return NextResponse.json({ success: true, message: 'Health state reset.' });
    }

    const health = getWhatsAppHealthStatus(phone);
    return NextResponse.json({
      success: true,
      ...health,
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      operational: true,
      isDegraded: false,
      primaryOption: 'whatsapp',
    });
  }
}
