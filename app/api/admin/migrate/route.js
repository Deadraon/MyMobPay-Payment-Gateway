export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/adminSettings';

// Protected migration endpoint
// GET /api/admin/migrate
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }
    // Add new columns for universal gateway support
    const migrations = [
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS project text`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS callback_url text`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_ref text`,
    ];

    const results = [];
    for (const sql of migrations) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql }).single();
      if (error) {
        // Try raw SQL via postgres URL if rpc not available
        results.push({ sql: sql.slice(0, 40), error: error.message });
      } else {
        results.push({ sql: sql.slice(0, 40), ok: true });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
