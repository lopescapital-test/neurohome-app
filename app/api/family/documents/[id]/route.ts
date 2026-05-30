import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Storage bucket holding document PDFs.
// TODO(verify): confirm this matches the actual Supabase Storage bucket name.
const DOCUMENTS_BUCKET = 'documents';

// Signed URL lifetime (seconds). Short-lived so the link can't be shared/cached.
const SIGNED_URL_TTL = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Require an authenticated session.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Resolve the requesting parent's patient.
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('parent_user_id', user.id)
    .single();
  if (!patient) {
    return NextResponse.json({ error: 'No patient record' }, { status: 403 });
  }

  // 3. Fetch the document and confirm it belongs to this patient,
  //    is parent-visible, and has a stored file.
  const { data: doc } = await supabase
    .from('documents')
    .select('id, patient_id, status, file_path, parent_visible')
    .eq('id', id)
    .single();

  if (
    !doc ||
    doc.patient_id !== patient.id ||
    !doc.parent_visible ||
    !doc.file_path
  ) {
    // Same response for "not found" and "not yours" — don't leak existence.
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (doc.status !== 'ready' && doc.status !== 'signed') {
    return NextResponse.json({ error: 'Document not ready' }, { status: 409 });
  }

  // 4. Generate a short-lived signed URL and redirect to it.
  const { data: signed, error } = await supabase
    .storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.file_path, SIGNED_URL_TTL);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
