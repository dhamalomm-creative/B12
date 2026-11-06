'use client';
import TabBar from './TabBar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        {/* The sidebar holds this on desktop; phones have no sidebar */}
        <div className={styles.mobileLanguage}><LanguageSwitcher /></div>
        {children}
      </main>
      <TabBar />
    </div>
  );
}
