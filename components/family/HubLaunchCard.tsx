import styles from './HubLaunchCard.module.css';

// NOTE (debt): streak + last-session are static placeholders for the pilot.
// Not yet wired to real session data.
export function HubLaunchCard({ tierLabel, weekCurrent }: { tierLabel: string; weekCurrent: number }) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>NeuroSage Hub</div>
      <div className={styles.top}>
        <div className={styles.mark}>🧠</div>
        <div>
          <div className={styles.name}>Today&apos;s Session</div>
          <div className={styles.sub}>{tierLabel} · Week {weekCurrent}</div>
        </div>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statVal}>12</div>
          <div className={styles.statLbl}>Day streak</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statVal}>Yest.</div>
          <div className={styles.statLbl}>Last session</div>
        </div>
      </div>
      <a className={styles.btn} href="#">
        Launch NeuroSage Hub
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </a>
    </div>
  );
}