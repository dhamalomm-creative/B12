import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <p style={{ fontSize: 56, fontWeight: 800, color: 'var(--primary)', letterSpacing: -2 }}>404</p>
        <h1 style={{ fontSize: 26, margin: '8px 0' }}>We couldn&apos;t find that page</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          The link may be broken or the page may have moved.
        </p>
        <Link href="/" className="btn-primary">Back to home</Link>
      </div>
    </main>
  );
}
