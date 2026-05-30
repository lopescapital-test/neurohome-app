import { createClient } from '@/lib/supabase/server';
import styles from '../resource.module.css';

function statusBadge(status: string): { cls: string; text: string } {
  switch (status) {
    case 'ready':    return { cls: styles.badgeReady, text: 'Ready' };
    case 'archived': return { cls: styles.badgeArchived, text: 'Archived' };
    default:         return { cls: styles.badgePending, text: 'Pending' };
  }
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function LabsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('parent_user_id', user!.id)
    .single();

  const { data: labs } = patient
    ? await supabase
        .from('documents')
        .select('id, title, status, file_path, generated_at')
        .eq('patient_id', patient.id)
        .eq('parent_visible', true)
        .eq('doc_type', 'lab_result')
        .order('generated_at', { ascending: false, nullsFirst: false })
    : { data: [] };

  return (
    <main className={styles.page}>
      <a className={styles.back} href="/dashboard">← Back to dashboard</a>
      <header className={styles.header}>
        <h1 className={styles.title}>Labs</h1>
        <p className={styles.subtitle}>Lab panels and results for your child.</p>
      </header>

      <div className={styles.card}>
        {labs && labs.length > 0 ? (
          <div className={styles.list}>
            {labs.map((l) => {
              const badge = statusBadge(l.status);
              const isReady = l.status === 'ready' && l.file_path;
              const Row = isReady ? 'a' : 'div';
              return (
                <Row
                  key={l.id}
                  className={styles.row}
                  {...(isReady ? { href: `/api/family/documents/${l.id}` } : {})}
                >
                  <div className={styles.rowIcon}>🧪</div>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{l.title}</div>
                    <div className={styles.rowMeta}>
                      {l.status === 'pending' ? 'Awaiting results' : fmtDate(l.generated_at)}
                    </div>
                  </div>
                  <span className={`${styles.badge} ${badge.cls}`}>{badge.text}</span>
                </Row>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>🧪</div>
            No labs yet. Results appear here once your panels are processed.
          </div>
        )}
      </div>
    </main>
  );
}
