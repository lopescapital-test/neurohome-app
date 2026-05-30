import styles from '../resource.module.css';

// Guides are static educational content — no DB table backs this yet.
// Update hrefs once guide content/routes exist.
const GUIDES: { icon: string; title: string; desc: string; href: string }[] = [
  {
    icon: '🧠',
    title: 'The Brain Development Pyramid',
    desc: 'How the foundation builds up to speech and learning.',
    href: '/dashboard/guides/brain-pyramid',
  },
  {
    icon: '👃',
    title: 'The 3 Hidden Gateways to the Brain',
    desc: 'Nose, gut, and sensory pathways most doctors overlook.',
    href: '/dashboard/guides/gateways',
  },
  {
    icon: '🌙',
    title: 'Your Daily Routine at Home',
    desc: 'Making the most of treatment between sessions.',
    href: '/dashboard/guides/daily-routine',
  },
  {
    icon: '💊',
    title: 'Understanding Your Supplements',
    desc: 'What each supplement does and when to take it.',
    href: '/dashboard/guides/supplements',
  },
];

export default function GuidesPage() {
  return (
    <main className={styles.page}>
      <a className={styles.back} href="/dashboard">← Back to dashboard</a>
      <header className={styles.header}>
        <h1 className={styles.title}>Guides</h1>
        <p className={styles.subtitle}>Plain-language education to help you support your child.</p>
      </header>

      <div className={styles.card}>
        <div className={styles.list}>
          {GUIDES.map((g) => (
            <a key={g.title} className={styles.row} href={g.href}>
              <div className={styles.rowIcon}>{g.icon}</div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>{g.title}</div>
                <div className={styles.rowMeta}>{g.desc}</div>
              </div>
              <span className={styles.rowMeta} aria-hidden>→</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
