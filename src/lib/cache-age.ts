/**
 * Hard maximum age of cached YouTube search data.
 *
 * YouTube API policy requires refreshing or deleting stored API data within 30 days;
 * we never serve anything older than 7 days, which leaves a wide margin.
 *
 * Mechanism: the cache key contains a time bucket (see `cacheBucket`), so an entry
 * written in an earlier bucket is simply never looked up again. Within a bucket,
 * Next.js' normal 24h stale-while-revalidate applies. Pure functions, no Next.js imports.
 */

export const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fixed 7-day window (aligned to the Unix epoch, UTC) containing `now`. Everything cached
 * under bucket N was fetched during window N, so when it is read in window N it is
 * younger than 7 days; once window N+1 starts it can no longer be reached.
 */
export function cacheBucket(now: number): number {
  return Math.floor(now / MAX_CACHE_AGE_MS);
}

/** True when `fetchedAt` is missing/invalid or at least 7 days before `now`. */
export function isTooOld(fetchedAt: unknown, now: number): boolean {
  if (typeof fetchedAt !== 'number' || !Number.isFinite(fetchedAt)) return true;
  return now - fetchedAt >= MAX_CACHE_AGE_MS;
}
