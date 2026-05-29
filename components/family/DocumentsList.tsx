import { createClient } from '@/lib/supabase/server';
import styles from './DocumentsList.module.css';

type Doc = {
  id: string;
  doc_type: string;
  title: string;
  status: 'pending' | 'ready' | 'signed' | 'archived';
  generated_at: string | null;
  signed_at: string | null;
};

// status -> icon bucket, glyph, and badge label
const STATUS: Record<string, { icon: string; glyph: string; label: string }> = {
  signed:  { icon: 'signed',  glyph: '✓', label: 'SIGNED' },
  ready:   { icon: 'report',  glyph: '📄', label: 'READY' },
  pending: { icon: 'pending', glyph: '!', label: 'UPCOMING' },
  archived:{ icon: 'report',  glyph: '📄', label: 'ARCHIVED' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function DocumentsList({ patientId }: { patientId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('documents')
    .select('id, doc_type, title, status, generated_at, signed_at')
    .eq('patient_id', patientId)
    .eq('parent_visible', true)
    .order('created_at', { ascending: true });

  const docs = (data ?? []) as Doc[];

  return (
    <div className={styles.card}>
      <div className={styles.title}>Documents &amp; Reports</div>
      <div className={styles.list}>
        {docs.map((d) => {
          const s = STATUS[d.status] ?? STATUS.ready;
          const meta =
            d.status === 'signed'
              ? `Signed · ${fmtDate(d.signed_at ?? d.generated_at)}`
              : d.status === 'pending'
              ? `Due · ${fmtDate(d.generated_at)}`
              : `Generated · ${fmtDate(d.generated_at)}`;
          const badgeCls = d.status === 'pending' ? styles.pending : styles.signed;
          return (
            <div key={d.id} className={styles.item}>
              <div className={`${styles.icon} ${styles[s.icon]}`}>{s.glyph}</div>
              <div className={styles.info}>
                <div className={styles.name}>{d.title}</div>
                <div className={styles.meta}>{meta}</div>
              </div>
              <div className={`${styles.status} ${badgeCls}`}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}