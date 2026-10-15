import type { Metadata } from 'next';

/** Site-wide constants. Pure data: safe to import from server and client components. */

export const SITE_URL = 'https://linguloop.com';
export const SITE_NAME = 'LinguLoop';
export const SITE_TAGLINE = 'Learn languages with videos picked for your level';
export const SITE_DESCRIPTION =
  'Get a YouTube video picked for your level and goal in German, English, Spanish or Brazilian Portuguese. Free, no sign-up, with private notes in your browser.';

export const CONTACT_EMAIL = 'hello@linguloop.com';
export const FEEDBACK_HREF = `mailto:${CONTACT_EMAIL}?subject=LinguLoop%20feedback`;

export const PRIVACY_LAST_UPDATED = 'October 15, 2026';

// ---------------------------------------------------------------------------
// AdSense (inactive until NEXT_PUBLIC_ADSENSE_CLIENT is set; see env.example)
// ---------------------------------------------------------------------------
// NEXT_PUBLIC_* values are inlined at build time, so they must be read with the literal
// `process.env.NEXT_PUBLIC_...` form and a change needs a rebuild/redeploy. Values that do
// not look right are treated as unset, so nothing odd ever reaches the HTML or ads.txt.

function readEnv(value: string | undefined, pattern: RegExp): string | undefined {
  const trimmed = value?.trim();
  return trimmed && pattern.test(trimmed) ? trimmed : undefined;
}

/** Publisher ID like `ca-pub-1234567890123456`, or undefined when ads are not configured. */
export const ADSENSE_CLIENT = readEnv(process.env.NEXT_PUBLIC_ADSENSE_CLIENT, /^ca-pub-\d{10,20}$/);
export const ADSENSE_SLOT_TOP = readEnv(process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP, /^\d{5,20}$/);
export const ADSENSE_SLOT_SIDEBAR = readEnv(process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR, /^\d{5,20}$/);

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

/**
 * Metadata for a content page. `path` is the canonical path with a trailing slash
 * (the site uses `trailingSlash: true`). Page metadata replaces the root `openGraph` object
 * (shallow merge), so everything needed is repeated here.
 */
const OG_ALT = `${SITE_NAME}: ${SITE_TAGLINE}`;

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: OG_ALT }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: OG_ALT }],
    },
  };
}
