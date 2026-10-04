'use client';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/UI/ThemeToggle';
import styles from './TabBar.module.css';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/checkin',
    label: 'Daily Check-in',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    path: '/progress',
    label: 'Progress',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: '/foods',
    label: 'Foods',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z" /><path d="M7 10v2a5 5 0 0010 0v-2" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className={styles.sidebar}>
        {/* Branding */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className={styles.brandName}>B12 Vitality</span>
        </div>

        {/* Nav label */}
        <p className={styles.navSection}>Navigation</p>

        {/* Nav items */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                className={`${styles.navItem} ${active ? styles.navActive : ''}`}
                onClick={() => router.push(item.path)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {active && <span className={styles.navIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div className={styles.sidebarFooter}>
          <ThemeToggle />
          <div className={styles.sidebarFooterStatus}>
            <div className={styles.statusDot} />
            <span className={styles.statusText}>Health Active</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className={styles.mobileBar}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              className={`${styles.mobileTab} ${active ? styles.mobileTabActive : ''}`}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
            >
              <span className={styles.mobileIcon}>{item.icon}</span>
              <span className={styles.mobileLabel}>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
