import styles from './FamilyResourcesNav.module.css';

const TILES = [
  { emoji: '📄', label: 'Documents', href: '/dashboard/documents' },
  { emoji: '🧪', label: 'Labs', href: '/dashboard/labs' },
  { emoji: '📦', label: 'Your Kit', href: '/dashboard/kit' },
  { emoji: '📚', label: 'Guides', href: '/dashboard/guides' },
];

export function FamilyResourcesNav() {
  return (
    <div className={styles.card}>
      <div className={styles.title}>Family Resources</div>
      <div className={styles.nav}>
        {TILES.map((t) => (
          <a key={t.label} className={styles.tile} href={t.href}>
            <div className={styles.emoji}>{t.emoji}</div>
            <div className={styles.tileLabel}>{t.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
}