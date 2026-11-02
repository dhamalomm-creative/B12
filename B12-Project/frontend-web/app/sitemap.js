export default function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const now = new Date();
  return ['', '/onboarding', '/foods', '/privacy', '/terms'].map((p) => ({
    url: `${site}${p}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: p === '' ? 1 : 0.6,
  }));
}
