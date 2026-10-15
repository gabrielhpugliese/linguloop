import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Trailing slashes match the canonical URLs (next.config.ts sets `trailingSlash: true`).
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/about/', '/privacy/', '/contact/'].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
