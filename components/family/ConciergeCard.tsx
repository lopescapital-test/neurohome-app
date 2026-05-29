import Link from 'next/link';
import styles from './ConciergeCard.module.css';

type Props = {
  concierge: {
    first_name: string;
    last_name: string;
    last_active_at: string | null;
  } | null;
  latestMessage: {
    body: string;
    sent_at: string;
  } | null;
};

export function ConciergeCard({ concierge, latestMessage }: Props) {
  if (!concierge) {
    return (
      <section className={styles.card}>
        <div className={styles.empty}>No concierge assigned yet.</div>
      </section>
    );
  }

  const initials = `${concierge.first_name[0] ?? ''}${concierge.last_name[0] ?? ''}`;
  const isOnline = concierge.last_active_at
    ? Date.now() - new Date(concierge.last_active_at).getTime() < 15 * 60 * 1000
    : false;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>{initials}</div>
        <div>
          <div className={styles.name}>{concierge.first_name} · Your Concierge</div>
          <div className={isOnline ? styles.roleOnline : styles.roleOffline}>
            {isOnline ? 'Usually replies in under 5 min' : 'Available during business hours'}
          </div>
        </div>
      </div>

      {latestMessage && (
        <div className={styles.message}>&ldquo;{latestMessage.body}&rdquo;</div>
      )}

      <Link href="/dashboard/messages" className={styles.action}>
        Send a Message
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </section>
  );
}