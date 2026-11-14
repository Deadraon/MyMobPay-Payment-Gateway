import { supabaseAdmin } from '../lib/supabase.js';
import { formatMerchantId } from '../lib/merchantId.js';
import { sendWelcomeEmail } from '../lib/mailer.js';

async function main() {
  const isLiveRun = process.argv.includes('--live');
  console.log(`\n=== Welcome Email Dispatcher [Mode: ${isLiveRun ? 'LIVE DISPATCH' : 'DRY RUN'}] ===\n`);

  const { data: usersData, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (userErr) {
    console.error('Failed to list auth users:', userErr);
    process.exit(1);
  }

  const { data: merchants, error: merchErr } = await supabaseAdmin
    .from('merchants')
    .select('id, business_name, upi_id, phone_number, setup_progress, created_at');

  if (merchErr) {
    console.error('Failed to list merchants:', merchErr);
    process.exit(1);
  }

  const merchantMap = new Map((merchants || []).map(m => [m.id, m]));
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const candidates = [];

  for (const u of (usersData?.users || [])) {
    const email = (u.email || '').toLowerCase().trim();
    const isBot = email.includes('blockaid-scan') || 
                  email.includes('invalid') || 
                  email.includes('example.com') || 
                  email.includes('test_check') || 
                  email.includes('verify_test') || 
                  email.includes('test_meta');

    if (!isBot && emailRegex.test(email)) {
      const m = merchantMap.get(u.id);
      const progress = m?.setup_progress || {};
      const alreadySent = Boolean(progress.welcome_email_sent || u.user_metadata?.welcome_email_sent);

      let bizName = m?.business_name && m.business_name !== 'My Business'
        ? m.business_name
        : (u.user_metadata?.business_name || u.user_metadata?.full_name || u.user_metadata?.name || 'Merchant Partner');

      let upi = (m?.upi_id && m.upi_id !== 'pending@upi' ? m.upi_id : u.user_metadata?.upi_id) || '';

      candidates.push({
        userId: u.id,
        email,
        businessName: bizName,
        upiId: upi,
        mid: formatMerchantId(u.id),
        alreadySent,
        merchantProgress: progress,
        userMetadata: u.user_metadata || {},
        created_at: u.created_at,
      });
    }
  }

  // Sort by creation date descending (most recent first)
  candidates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  console.log(`Found ${candidates.length} legitimate merchant accounts.\n`);

  let dispatchedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const prefix = `[${i + 1}/${candidates.length}] ${c.email}`;

    if (c.alreadySent) {
      console.log(`${prefix} -> SKIPPED (Already received welcome email)`);
      skippedCount++;
      continue;
    }

    if (!isLiveRun) {
      console.log(`${prefix} -> WOULD SEND to "${c.businessName}" | MID: ${c.mid} | UPI: ${c.upiId || 'Pending'} | Created: ${c.created_at}`);
      dispatchedCount++;
      continue;
    }

    console.log(`${prefix} -> Sending Apple-style welcome email to "${c.businessName}" (MID: ${c.mid})...`);
    try {
      const sendRes = await sendWelcomeEmail({
        to: c.email,
        businessName: c.businessName,
        upiId: c.upiId,
        mid: c.mid,
      });

      console.log(`   ✔ Sent successfully via ${sendRes.provider} (ID: ${sendRes.id || 'ok'})`);

      // Update merchant setup_progress in Supabase
      const updatedProgress = {
        ...(typeof c.merchantProgress === 'object' && c.merchantProgress !== null ? c.merchantProgress : {}),
        welcome_email_sent: true,
        welcome_email_sent_at: new Date().toISOString(),
        welcome_email_provider: sendRes.provider,
      };

      await supabaseAdmin
        .from('merchants')
        .upsert({
          id: c.userId,
          setup_progress: updatedProgress,
        }, { onConflict: 'id' });

      // Update auth user metadata
      await supabaseAdmin.auth.admin.updateUserById(c.userId, {
        user_metadata: {
          ...c.userMetadata,
          welcome_email_sent: true,
          welcome_email_sent_at: new Date().toISOString(),
        },
      }).catch(() => {});

      dispatchedCount++;
      // Polite 600ms pacing between dispatches to maintain pristine deliverability
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`   ✖ Failed to send:`, err.message);
      failedCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total Candidates: ${candidates.length}`);
  console.log(`Dispatched: ${dispatchedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
