export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  return {
    rules: [{ userAgent: '*', allow: ['/', '/foods', '/privacy', '/terms', '/onboarding'], disallow: ['/dashboard', '/profile', '/checkin', '/progress', '/results', '/bmi'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
