import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--next-font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--next-font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'B12 Health — Track Your Vitamin B12',
  description: 'Understand your Vitamin B12 health with personalized assessments, daily check-ins, and AI-powered insights.',
  keywords: 'B12, vitamin, health tracker, wellness, daily check-in',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
