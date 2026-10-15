import { ADSENSE_CLIENT } from '@/lib/site';

const HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' };

/**
 * Authorised Digital Sellers file for AdSense, built from NEXT_PUBLIC_ADSENSE_CLIENT
 * (`ca-pub-123...` becomes `pub-123...`). 404 while ads are not configured.
 */
export function GET() {
  if (!ADSENSE_CLIENT) {
    return new Response('Not found\n', { status: 404, headers: HEADERS });
  }
  const publisherId = ADSENSE_CLIENT.replace(/^ca-/, '');
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, { headers: HEADERS });
}
