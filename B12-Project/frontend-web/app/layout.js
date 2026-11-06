// Self-hosted Inter (no request to Google — better privacy and works offline/behind firewalls)
import '@fontsource-variable/inter';
// Devanagari text for Hindi and Marathi; only downloaded when that text is on screen
import '@fontsource-variable/noto-sans-devanagari';
import './globals.css';
import Providers from '@/components/Providers';
import SkipLink from '@/components/SkipLink';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'B12 Health Tracker — Check your vitamin B12 risk in 4 minutes',
    template: '%s · B12 Health Tracker',
  },
  description:
    'Free, private vitamin B12 deficiency risk check. Answer about 20 personalised questions, track daily energy and mood, and find B12-rich foods that fit your diet.',
  keywords: ['vitamin B12', 'B12 deficiency', 'B12 test', 'fatigue', 'vegan B12', 'health tracker', 'daily check-in'],
  applicationName: 'B12 Health Tracker',
  openGraph: {
    type: 'website',
    siteName: 'B12 Health Tracker',
    title: 'B12 Health Tracker — Check your vitamin B12 risk',
    description: 'A free, 4-minute B12 risk assessment with daily symptom tracking and food guidance.',
    url: SITE_URL,
  },
  twitter: {
    // Large preview card; the image itself comes from app/opengraph-image.js
    card: 'summary_large_image',
    title: 'B12 Health Tracker',
    description: 'A free, 4-minute B12 risk assessment with daily symptom tracking and food guidance.',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A2B',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <SkipLink />
          <div id="main-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
