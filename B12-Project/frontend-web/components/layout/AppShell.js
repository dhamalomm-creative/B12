'use client';
import TabBar from './TabBar';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>{children}</main>
      <TabBar />
    </div>
  );
}
