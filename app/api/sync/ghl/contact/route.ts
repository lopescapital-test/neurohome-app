import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * GHL webhook receiver — fires when a contact reaches "Active Treatment" stage.
 *
 * Responsibilities:
 *   1. Verify HMAC signature (rejects spoofed webhooks)
 *   2. Upsert auth.users + profiles + patients in Supabase
 *   3. Send magic-link invite email (if new user)
 *   4. Reverse-sync the supabase_patient_id back to GHL custom field
 *
 * This uses the service-role key — it bypasses RLS by design.
 * Never call this from the browser.
 */
export async function POST(request: NextRequest) {
  // 1. Verify HMAC signature
  const signature = request.headers.get('x-ghl-signature');
  const body = await request.text();
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const { contact_id, email, first_name, last_name, custom_fields } = payload;

  // 2. Use service-role client (bypasses RLS — required for sync)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // 3. Upsert auth user
  //    TODO (engineer): use supabase.auth.admin.inviteUserByEmail for new users
  //    Then upsert profile (role='parent', ghl_contact_id=contact_id)
  //    Then upsert patient row with child info from custom_fields
  //
  // 4. Reverse-sync: PATCH GHL contact's supabase_patient_id custom field
  //    Use GHLClient from lib/ghl/client.ts

  return NextResponse.json({ ok: true, contact_id });
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', process.env.GHL_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
