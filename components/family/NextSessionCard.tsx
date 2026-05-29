import styles from './NextSessionCard.module.css';

type Clinician = { first_name: string; last_name: string; credentials?: string | null };
type Concierge = { first_name: string; last_name: string };

type Props = {
  session: {
    scheduled_at: string;
    duration_min: number;
    zoom_link: string | null;
    clinician?: Clinician | null;
    concierge?: Concierge | null;
  };
};

export function NextSessionCard({ session }: Props) {
  const date = new Date(session.scheduled_at);
  const when = formatRelative(date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  return (
    <section className={styles.card}>
      <div className={styles.label}>Next Session</div>
      <div className={styles.content}>
        <div className={styles.when}>{when} · {timeStr} ET</div>
        <div className={styles.datetime}>{dateStr} · {session.duration_min}-min Zoom session (single link)</div>

        <div className={styles.details}>
          <div>
            <div className={styles.detailLabel}>Concierge (opens)</div>
            <div className={styles.detailVal}>
              {session.concierge
                ? `${session.concierge.first_name} ${session.concierge.last_name[0]}.`
                : '—'} · 10 min
            </div>
          </div>
          <div>
            <div className={styles.detailLabel}>Clinician (treats)</div>
            <div className={styles.detailVal}>
              {session.clinician
                ? `${session.clinician.first_name} ${session.clinician.last_name[0]}.${session.clinician.credentials ? `, ${session.clinician.credentials}` : ''}`
                : '—'} · 60 min
            </div>
          </div>
          <div>
            <div className={styles.detailLabel}>Format</div>
            <div className={styles.detailVal}>Zoom Healthcare</div>
          </div>
        </div>

        <div className={styles.actions}>
          {session.zoom_link && (
            <a href={session.zoom_link} target="_blank" rel="noreferrer" className={`${styles.btn} ${styles.btnPrimary}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Join Session
            </a>
          )}
          <button className={`${styles.btn} ${styles.btnSecondary}`}>Reschedule</button>
        </div>
      </div>
    </section>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
