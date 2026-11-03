import { ImageResponse } from 'next/og';

// Preview image shown when a link to the site is shared (WhatsApp, X, LinkedIn, Facebook…).
// Generated once at build time and cached. Mirrors the landing page: cream canvas,
// soft pastel glows, headline and a sample risk card.

export const alt = 'B12 Health Tracker — check your vitamin B12 risk in 4 minutes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const C = {
  bg: '#FAF6F0',
  primary: '#1E3A2B',
  text: '#1E3A2B',
  textSecondary: '#55685E',
  mint: '#E5EFE7',
  peach: '#FCECE3',
  yellow: '#FDF1D8',
};

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: C.bg,
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Soft background glows, like the landing page */}
        <div style={{ position: 'absolute', top: -220, left: -160, width: 640, height: 640, borderRadius: 9999, background: `radial-gradient(circle, ${C.mint} 0%, rgba(229,239,231,0) 70%)` }} />
        <div style={{ position: 'absolute', bottom: -260, right: -120, width: 700, height: 700, borderRadius: 9999, background: `radial-gradient(circle, ${C.peach} 0%, rgba(252,236,227,0) 70%)` }} />

        {/* Left: brand, headline, subline */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 640 }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: C.text }}>B12 Health Tracker</div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', fontSize: 22, color: C.textSecondary, background: C.yellow, padding: '8px 18px', borderRadius: 9999, marginBottom: 28 }}>
              Free · Private · About 4 minutes
            </div>
            <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, lineHeight: 1.08, color: C.text, letterSpacing: -1.5 }}>
              Tired lately? Check your vitamin B12 risk.
            </div>
            <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.4, color: C.textSecondary, marginTop: 24, maxWidth: 560 }}>
              A short, personalised check — then track how you feel and find B12 foods that fit your diet.
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 20, color: C.textSecondary }}>Educational tool · not a medical diagnosis</div>
        </div>

        {/* Right: sample result card */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 380, background: '#FFFFFF', borderRadius: 32, padding: 36, boxShadow: '0 20px 50px rgba(30,58,43,0.12)' }}>
            <div style={{ display: 'flex', fontSize: 22, color: C.textSecondary }}>Your B12 risk</div>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: C.text, marginTop: 6 }}>Low</div>
            <div style={{ display: 'flex', position: 'relative', height: 14, borderRadius: 9999, marginTop: 22, background: 'linear-gradient(90deg, #4CAF7A 0%, #E8C25A 55%, #E07A5F 100%)' }}>
              <div style={{ position: 'absolute', top: -7, left: 70, width: 28, height: 28, borderRadius: 9999, background: '#FFFFFF', border: `5px solid ${C.primary}` }} />
            </div>
            <div style={{ display: 'flex', marginTop: 34, padding: '18px 22px', borderRadius: 20, background: C.primary, color: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: 22, fontWeight: 700 }}>Today&apos;s check-in</div>
                <div style={{ display: 'flex', fontSize: 17, color: '#BED8CC', marginTop: 4 }}>Five quick taps</div>
              </div>
              <div style={{ display: 'flex' }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: 9999, marginLeft: 8, background: i < 3 ? '#7FD3A2' : '#3F7A5E' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
