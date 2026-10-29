import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — B12 Health Tracker',
  description: 'How B12 Health Tracker protects your personal and health information.',
};

export default function PrivacyPage() {
  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      padding: '48px 24px 80px',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-primary)',
      lineHeight: '1.7',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
          ← Back to B12 Health Tracker
        </Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
        Last updated: October 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '15px', color: 'var(--text-secondary)' }}>
        <section style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            🔒 1. Your Health Data Stays Private
          </h2>
          <p>
            B12 Health Tracker was built on a simple foundation: your health habits, questionnaire responses, and daily check-ins belong strictly to you. We never sell, rent, or trade your data to third-party brokers, advertisers, or insurance providers.
          </p>
        </section>

        <section style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            🛡️ 2. Encryption and Security
          </h2>
          <p>
            All network communication is encrypted using industry-standard TLS. Passwords are cryptographically salted and hashed before ever touching our database.
          </p>
        </section>

        <section style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            🗑️ 3. Account Deletion and Data Portability
          </h2>
          <p>
            You have the right to delete your account and all associated records at any moment. Upon account deletion, all questionnaire responses and daily logs are permanently purged from our systems.
          </p>
        </section>
      </div>
    </div>
  );
}
