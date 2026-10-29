import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'B12 Health Tracker',
  description: 'Understand your Vitamin B12 health with personalized assessments, daily check-ins, and actionable insights.',
  keywords: 'B12, vitamin, health tracker, wellness, daily check-in',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
