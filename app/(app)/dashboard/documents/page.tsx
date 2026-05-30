import { createClient } from '@/lib/supabase/server';
import styles from '../resource.module.css';

const DOC_META: Record<string, { icon: string; label: string }> = {
  intake_packet:        { icon: '📋', label: 'Intake Packet' },
  baseline_atec_report: { icon: '📊', label: 'Baseline ATEC Report' },
  week_summary:         { icon: '🗓️', label: 'Week Summary' },
  mid_check_report:     { icon: '📈', label: 'Mid-Check Report' },
  final_report:         { icon: '🏁', label: 'Final Report' },
  soap_signed:          { icon: '✍️', label: 'Clinical Note' },
};

function statusBadge(status: string): { cls: string; text: string } {
  switch (status) {
    case 'ready':    return { cls: styles.badgeReady, text: 'Ready' };
    case 'signed':   return { cls: styles.badgeSigned, text: 'Signed' };
    case 'archived': return { cls: styles.badgeArchived, text: 'Archived' };
    default:         return { cls: styles.badgePending, text: 'Pending' };
  }
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: patient } = await supabase
    .from('patients')
    .select('id, first_name')
    .eq('parent_user_id', user!.id)
    .single();

  const { data: docs } = patient
    ? await supabase
        .from('documents')
        .select('id, doc_type, title, status, file_path, generated_at, signed_at')
        .eq('patient_id', patient.id)
        .eq('parent_visible', true)
        .neq('doc_type', 'lab_result')
        .order('generated_at', { ascending: false, nullsFirst: false })
    : { data: [] };

  return (
    <main className={styles.page}>
      <a className={styles.back} href="/dashboard">← Back to dashboard</a>
      <header className={styles.header}>
        <h1 className={styles.title}>Documents</h1>
        <p className={styles.subtitle}>Reports and signed paperwork for your program.</p>
      </header>

      <div className={styles.card}>
        {docs && docs.length > 0 ? (
          <div className={styles.list}>
            {docs.map((d) => {
              const meta = DOC_META[d.doc_type] ?? { icon: '📄', label: d.doc_type.replace(/_/g, ' ') };
              const badge = statusBadge(d.status);
              const dateLine = d.signed_at ? `Signed ${fmtDate(d.signed_at)}` : fmtDate(d.generated_at);
              const isReady = (d.status === 'ready' || d.status === 'signed') && d.file_path;
              const Row = isReady ? 'a' : 'div';
              return (
                <Row
                  key={d.id}
                  className={styles.row}
                  {...(isReady ? { href: `/api/family/documents/${d.id}` } : {})}
                >
                  <div className={styles.rowIcon}>{meta.icon}</div>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{d.title || meta.label}</div>
                    {dateLine && <div className={styles.rowMeta}>{dateLine}</div>}
                  </div>
                  <span className={`${styles.badge} ${badge.cls}`}>{badge.text}</span>
                </Row>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>📄</div>
            No documents yet. Reports appear here as your program progresses.
          </div>
        )}
      </div>
    </main>
  );
}