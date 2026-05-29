import Link from 'next/link';
import styles from './ATECSparkline.module.css';

type ATECAssessment = {
  id: string;
  assessment_date: string;
  total_score: number;
  assessment_type: string;
};

type Props = {
  history: ATECAssessment[];
};

export function ATECSparkline({ history }: Props) {
  if (history.length === 0) {
    return (
      <Link href="/dashboard/atec" className={styles.card}>
        <div className={styles.labelRow}>
          <div className={styles.label}>Current ATEC Score</div>
          <span className={styles.detailLink}>View detail →</span>
        </div>
        <div className={styles.empty}>No assessments yet</div>
      </Link>
    );
  }

  const latest = history[history.length - 1];
  const baseline = history.find(a => a.assessment_type === 'baseline') ?? history[0];
  const delta = latest.total_score - baseline.total_score;

  // SVG path generation
  const W = 200;
  const padTop = 10;
  const padBottom = 40;
  const scores = history.map(a => a.total_score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = history.map((a, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * W;
    const y = padTop + ((max - a.total_score) / range) * (padBottom - padTop);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const areaD = `${pathD} L ${last.x} 50 L ${first.x} 50 Z`;

  const nextLabel = history.length < 6 ? 'Wk 6 mid-check' : 'Wk 12 final';

  return (
    <Link href="/dashboard/atec" className={styles.card}>
      <div className={styles.labelRow}>
        <div className={styles.label}>Current ATEC Score</div>
        <span className={styles.detailLink}>View detail →</span>
      </div>
      <div className={styles.scoreRow}>
        <div className={styles.score}>{latest.total_score}</div>
        {delta !== 0 && (
          <div className={delta < 0 ? styles.deltaGood : styles.deltaBad}>
            {delta < 0 ? '↓' : '↑'} {Math.abs(delta)} pts
          </div>
        )}
      </div>
      <svg className={styles.sparkline} viewBox="0 0 200 50" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00CEFD" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#00CEFD" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkGrad)"/>
        <path d={pathD} fill="none" stroke="#00CEFD" strokeWidth="2" strokeLinecap="round"/>
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 4 : 3}
              fill="#00CEFD"
              stroke={isLast ? '#fff' : undefined}
              strokeWidth={isLast ? 2 : 0}
            />
          );
        })}
      </svg>
      <div className={styles.footer}>
        <span>Baseline: <strong>{baseline.total_score}</strong></span>
        <span>Next: {nextLabel}</span>
      </div>
    </Link>
  );
}