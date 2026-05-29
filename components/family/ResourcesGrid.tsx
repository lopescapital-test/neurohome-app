import styles from './ResourcesGrid.module.css';

type Resource = {
  emoji: string;
  title: string;
  desc: string;
  href?: string;
};

// Static config. Swap href values for real URLs as they come online.
const RESOURCES: Resource[] = [
  { emoji: '🧠', title: 'NeuroSage Hub',   desc: 'Launch platform' },
  { emoji: '📹', title: 'Exercise Videos', desc: '12 walkthroughs' },
  { emoji: '📖', title: 'Parent Guide',    desc: 'Week-by-week' },
  { emoji: '🔬', title: 'Laser Protocol',  desc: 'Safety + usage' },
  { emoji: '💬', title: 'Community',        desc: 'Family forum' },
  { emoji: '💰', title: 'ESA Status',       desc: 'View claims' },
];

export function ResourcesGrid() {
  return (
    <div className={styles.card}>
      <div className={styles.title}>Family Resources</div>
      <div className={styles.grid}>
        {RESOURCES.map((r) => (
          <div key={r.title} className={styles.item}>
            <div className={styles.emoji}>{r.emoji}</div>
            <div className={styles.itemTitle}>{r.title}</div>
            <div className={styles.desc}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}