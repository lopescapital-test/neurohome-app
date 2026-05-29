import styles from './ProgressRing.module.css';

type Props = {
  weekCurrent: number;
  weekTotal: number;
  tier: string;
  phase: string;
};

export function ProgressRing({ weekCurrent, weekTotal, tier, phase }: Props) {
  const pct = Math.round((weekCurrent / weekTotal) * 100);
  const circumference = 2 * Math.PI * 60; // r=60
  const dashOffset = circumference * (1 - pct / 100);

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1).replace(/_/g, ' ');
  const phaseLabel = phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <section className={styles.card}>
      <div className={styles.label}>Program Progress</div>
      <div className={styles.ringWrap}>
        <div className={styles.ring}>
          <svg viewBox="0 0 140 140" width="140" height="140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="#F0F0F5" strokeWidth="10"/>
            <circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00CEFD"/>
                <stop offset="100%" stopColor="#2D6FD9"/>
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.ringCenter}>
            <div className={styles.ringVal}>{pct}%</div>
            <div className={styles.ringLabel}>Complete</div>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.week}>Week {weekCurrent} of {weekTotal}</div>
        <div className={styles.weekSub}>{tierLabel} · {phaseLabel}</div>
      </div>
    </section>
  );
}