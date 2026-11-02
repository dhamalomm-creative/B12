'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Surface the error for monitoring tools without exposing details to the user
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Sorry about that. Your data is safe — please try again, and if it keeps happening, reload the page.
        </p>
        <button type="button" className="btn-primary" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}
