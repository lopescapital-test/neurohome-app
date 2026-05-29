'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Topbar.module.css';

type Props = {
  profile: { first_name: string; last_name: string; role: string } | null;
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/schedule', label: 'Schedule' },
  { href: '/dashboard/atec', label: 'Progress' },
  { href: '/dashboard/messages', label: 'Messages' }
];

export function Topbar({ profile }: Props) {
  const pathname = usePathname();
  const initials = profile ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}` : '';

  return (
    <header className={styles.topbar}>
      <Link href="/dashboard" className={styles.brand}>
        <svg className={styles.mark} viewBox="0 0 52 52" fill="none" aria-hidden="true">
          <rect x="8" y="22" width="36" height="27" rx="3" stroke="#1D2939" strokeWidth="2.2" fill="none"/>
          <path d="M 4 24 L 26 5 L 48 24" stroke="#1D2939" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="20" y="34" width="12" height="15" rx="1.5" stroke="#1D2939" strokeWidth="1.5" fill="rgba(0,206,253,0.06)"/>
          <circle cx="8" cy="22" r="3" fill="#00CEFD"/>
          <circle cx="44" cy="22" r="3" fill="#00CEFD"/>
          <circle cx="8" cy="49" r="3" fill="#00CEFD"/>
          <circle cx="44" cy="49" r="3" fill="#00CEFD"/>
          <circle cx="26" cy="5" r="3" fill="#00CEFD"/>
        </svg>
        <span className={styles.brandText}>Neuro<span>Home</span></span>
      </Link>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.userZone}>
        {profile && (
          <>
            <span className={styles.userAvatar}>{initials}</span>
            <span className={styles.userName}>{profile.first_name} {profile.last_name[0]}.</span>
          </>
        )}
      </div>
    </header>
  );
}
