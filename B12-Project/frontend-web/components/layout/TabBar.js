'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import styles from './TabBar.module.css';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/checkin',
    label: 'Daily check-in',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    path: '/progress',
    label: 'Progress',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: '/foods',
    label: 'Foods',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" />
      </svg>
    ),
    altIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    )
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { dispatch } = useApp();

  const handleBrandClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleSignOut = async () => {
    await logout();
    dispatch({ type: 'RESET' });
    router.replace('/auth?mode=login');
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className={styles.sidebar}>
        {/* Brand */}
        <div className={styles.brand} onClick={handleBrandClick}>
          <span className={styles.brandName}>B12 Health Tracker</span>
        </div>

        {/* Nav Items */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path + '/')) || (item.path === '/foods' && pathname === '/bmi');
            return (
              <button
                key={item.path}
                className={`${styles.navItem} ${active ? styles.navActive : ''}`}
                onClick={() => router.push(item.path)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navIcon}>{item.altIcon || item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={styles.sidebarFooter}>
          {isAuthenticated && (
            <button
              type="button"
              className={styles.signOutBtn}
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          )}
          <p className={styles.footerNote}>
            Educational tool, not a medical diagnosis.
          </p>
        </div>
      </aside>

      {/* ── Mobile Tab Bar ── */}
      <nav className={styles.mobileTabBar}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path + '/')) || (item.path === '/foods' && pathname === '/bmi');
          return (
            <button
              key={item.path}
              className={`${styles.mobileTab} ${active ? styles.mobileTabActive : ''}`}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
            >
              <span className={styles.mobileIcon}>{item.altIcon || item.icon}</span>
              <span className={styles.mobileLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
