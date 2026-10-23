import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant, DEFAULT_ADMIN_EMAILS, PLATFORM_ADMIN_USER_ID } from '@/lib/adminSettings';
import { ADMIN_ROLES, hasPermission, PERMISSIONS } from '@/lib/adminRbac';
import { logAdminAction } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';

// Seed default platform administrators
const DEFAULT_ADMIN_USERS = [
  {
    id: 'dd45279e-7a2c-413c-9e24-24d88011b680',
    email: 'chauhankunal695@gmail.com',
    full_name: 'Kunal Chauhan',
    role: ADMIN_ROLES.SUPER_ADMIN,
    totp_enabled: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    last_login_at: new Date().toISOString()
  },
  {
    id: 'adm_deadraon_01',
    email: 'deadraon@gmail.com',
    full_name: 'Platform Operations Admin',
    role: ADMIN_ROLES.SUPER_ADMIN,
    totp_enabled: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    last_login_at: new Date().toISOString()
  },
  {
    id: 'adm_deadraon_02',
    email: 'deadraon1@gmail.com',
    full_name: 'Operations & Verification Lead',
    role: ADMIN_ROLES.OPERATIONS,
    totp_enabled: true,
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
    last_login_at: new Date().toISOString()
  }
];

// Helper to get stored admin team
async function getStoredAdminUsers() {
  try {
    // 1. Try public.admin_users table
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // Fallback
  }

  // 2. Fallback to platform admin JSONB setup_progress
  const adminMerchant = await ensureAdminMerchant();
  if (adminMerchant) {
    const stored = adminMerchant.setup_progress?.admin_settings?.admin_users;
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  }

  return DEFAULT_ADMIN_USERS;
}

// Helper to save stored admin team
async function saveAdminUsers(users) {
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
              admin_users: users
            }
          }
        })
        .eq('id', adminMerchant.id);
    }
  } catch (err) {
    console.error('saveAdminUsers error:', err);
  }
}

// GET: List all administrators
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const users = await getStoredAdminUsers();
    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error('Admin users GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Manage admin users (create, update role, toggle active, reset 2FA)
export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { action, email, fullName, role, userId, isActive } = body;

    let users = await getStoredAdminUsers();

    if (action === 'create_admin') {
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
      }

      if (users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
        return NextResponse.json({ error: 'An administrator with this email already exists' }, { status: 400 });
      }

      const newUser = {
        id: `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: email.toLowerCase().trim(),
        full_name: fullName || email.split('@')[0],
        role: role || ADMIN_ROLES.SUPPORT,
        totp_enabled: true,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login_at: null
      };

      users.push(newUser);
      await saveAdminUsers(users);

      await logAdminAction({
        action: 'admin_user.created',
        targetType: 'admin_user',
        targetId: newUser.id,
        details: { email: newUser.email, role: newUser.role },
        request
      });

      return NextResponse.json({ success: true, user: newUser, users });
    }

    if (action === 'update_role') {
      if (!userId || !role) {
        return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
      }

      const target = users.find(u => u.id === userId || u.email === userId);
      if (!target) return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });

      const prevRole = target.role;
      target.role = role;
      await saveAdminUsers(users);

      await logAdminAction({
        action: 'admin_user.role_updated',
        targetType: 'admin_user',
        targetId: target.id,
        details: { email: target.email, from_role: prevRole, to_role: role },
        request
      });

      return NextResponse.json({ success: true, user: target, users });
    }

    if (action === 'toggle_status') {
      if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

      const target = users.find(u => u.id === userId || u.email === userId);
      if (!target) return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });

      target.is_active = isActive !== undefined ? Boolean(isActive) : !target.is_active;
      await saveAdminUsers(users);

      await logAdminAction({
        action: target.is_active ? 'admin_user.activated' : 'admin_user.deactivated',
        targetType: 'admin_user',
        targetId: target.id,
        details: { email: target.email, active: target.is_active },
        request
      });

      return NextResponse.json({ success: true, user: target, users });
    }

    if (action === 'reset_2fa') {
      if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

      const target = users.find(u => u.id === userId || u.email === userId);
      if (!target) return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });

      target.totp_enabled = false;
      target.totp_secret = null;
      await saveAdminUsers(users);

      await logAdminAction({
        action: 'admin_user.2fa_reset',
        targetType: 'admin_user',
        targetId: target.id,
        details: { email: target.email },
        request
      });

      return NextResponse.json({ success: true, message: `2FA reset for ${target.email}`, users });
    }

    if (action === 'delete_admin') {
      if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

      const target = users.find(u => u.id === userId || u.email === userId);
      if (!target) return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });

      // Guard: Primary root platform administrators cannot be deleted
      const isRoot = 
        target.id === PLATFORM_ADMIN_USER_ID || 
        DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === target.email?.toLowerCase()?.trim());

      if (isRoot) {
        return NextResponse.json({ error: 'Primary root administrator cannot be deleted' }, { status: 403 });
      }

      users = users.filter(u => u.id !== target.id && u.email !== target.email);
      await saveAdminUsers(users);

      try {
        await supabaseAdmin.from('admin_users').delete().or(`id.eq.${target.id},email.eq.${target.email}`);
      } catch (e) {}

      await logAdminAction({
        action: 'admin_user.deleted',
        targetType: 'admin_user',
        targetId: target.id,
        details: { email: target.email, role: target.role },
        request
      });

      return NextResponse.json({ success: true, message: `Administrator ${target.email} removed`, users });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('Admin users POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
