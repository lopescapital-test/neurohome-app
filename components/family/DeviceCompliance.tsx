import styles from './DeviceCompliance.module.css';

type Props = {
  completedThisWeek: number;
  totalThisWeek: number;
};

export function DeviceCompliance({ completedThisWeek, totalThisWeek }: Props) {
  const pct = totalThisWeek > 0
    ? Math.round((completedThisWeek / totalThisWeek) * 100)
    : 0;

  const status: 'green' | 'yellow' | 'red' =
    pct >= 85 ? 'green' :
    pct >= 60 ? 'yellow' :
    'red';

  const statusLabel =
    status === 'green'  ? 'Green status' :
    status === 'yellow' ? 'Watch'        :
    'Needs attention';

  const statusClass =
    status === 'green'  ? styles.statusGreen :
    status === 'yellow' ? styles.statusYellow :
    styles.statusRed;

  return (
    <section className={styles.card}>
      <div className={styles.label}>Device Compliance</div>

      <div className={styles.status}>
        <div className={styles.icon}>🔬</div>
        <div>
          <div className={styles.title}>All 4 pillars ✓</div>
          <div className={styles.detail}>NeuroSage · Reflex · Laser/LED · Motor</div>
        </div>
      </div>

      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>

      <div className={styles.footer}>
        <span>{pct}% adherence this week</span>
        <strong className={statusClass}>{statusLabel}</strong>
      </div>
    </section>
  );
}