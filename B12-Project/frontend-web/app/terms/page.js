import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — B12 Health Tracker',
  description: 'Terms and conditions for using B12 Health Tracker.',
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
        Last updated: October 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '15px', color: 'var(--text-secondary)' }}>
        <section style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            1. Informational & Educational Use Only
          </h2>
          <p>
            B12 Health Tracker provides self-assessment tools, educational nutritional insights, and wellness tracking. The content provided is not intended to be a substitute for professional medical advice, diagnosis, or clinical treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </section>

        <section style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            2. Account Security
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            3. Disclaimer of Warranties
          </h2>
          <p>
            The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
        </section>
      </div>
    </div>
  );
}
