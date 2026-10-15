import { unstable_cache } from 'next/cache';
import type { SearchRequest } from './catalog';
import { cacheBucket, isTooOld } from './cache-age';

/**
 * Cached YouTube Data API v3 search.
 *
 * Every `search.list` call costs 100 quota units (10,000/day free), so results are
 * cached per search request in Next.js' Data Cache via `unstable_cache`. The request
 * (query, relevance language, short-only) is derived from catalog-validated ids in
 * src/lib/catalog.ts, so callers cannot create arbitrary cache entries.
 * On Vercel that cache is shared by all function instances and survives redeploys.
 * Only the result list is cached; callers pick a random entry per request.
 *
 * Maximum age: YouTube's API policy requires refreshing or deleting stored data within
 * 30 days, so nothing older than 7 days is ever served (see src/lib/cache-age.ts). The
 * cache key contains a 7-day time bucket: stale-while-revalidate (24h) and stale-on-error
 * only ever apply to an entry of the current bucket, and an entry of an earlier bucket is
 * never read again, so after a bucket change a fresh search is required (and if YouTube
 * fails, the request fails instead of falling back to old data).
 */

export interface SearchVideo {
  id: string;
  title: string;
}

export interface SearchResult {
  videos: SearchVideo[];
  /** Epoch ms when YouTube was asked; stored with the cached list. */
  fetchedAt: number;
}

/** Thrown when YOUTUBE_API_KEY is missing. */
export class YouTubeConfigError extends Error {}
/** Thrown when YouTube answers with a non-2xx status (quota exceeded, bad key, ...). */
export class YouTubeApiError extends Error {}
/** Thrown when the search succeeds but returns no videos. Thrown, so it is never cached. */
export class NoVideosFoundError extends Error {}
/** Thrown if a cached list is somehow older than the 7-day maximum. Should be unreachable. */
export class CacheTooOldError extends Error {}

/** Tag on every cached search, for manual invalidation with `revalidateTag`. */
export const YOUTUBE_SEARCH_CACHE_TAG = 'youtube-search';
const SEARCH_TTL_SECONDS = 60 * 60 * 24; // 24h; after that the stale list is served while refreshing (within the 7-day bucket)
const MAX_RESULTS = 50; // same 100-unit cost as 20, more variety per cached query

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** YouTube snippets HTML-escape titles (`&#39;`, `&amp;`, ...). */
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(codePoint) && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    }
    return HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

interface YouTubeSearchResponse {
  items?: { id?: { videoId?: string }; snippet?: { title?: string } }[];
}

async function fetchYouTubeSearch({ query, relevanceLanguage, shortOnly }: SearchRequest): Promise<SearchVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new YouTubeConfigError('YOUTUBE_API_KEY is not set');

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(MAX_RESULTS));
  url.searchParams.set('q', query);
  // Non-embeddable videos would break the player (requires type=video).
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('relevanceLanguage', relevanceLanguage);
  url.searchParams.set('safeSearch', 'moderate');
  // Real short videos (under 4 minutes), not the unreliable #shorts hashtag.
  if (shortOnly) url.searchParams.set('videoDuration', 'short');
  // Trim the payload to what we use (does not change quota cost).
  url.searchParams.set('fields', 'items(id/videoId,snippet/title)');

  // The key goes in a header, not the URL, so it never shows up in logged URLs.
  // Inside unstable_cache, Next.js forces this fetch to no-store, so only our
  // parsed list is cached, never the raw response.
  const res = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey } });
  if (!res.ok) {
    throw new YouTubeApiError(`YouTube API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as YouTubeSearchResponse;
  return (data.items ?? []).flatMap((item) => {
    const id = item.id?.videoId;
    return id ? [{ id, title: decodeHtmlEntities(item.snippet?.title ?? '') }] : [];
  });
}

/**
 * Cache key = hash of (this function's source, key parts, JSON of the request).
 * The request is built from validated catalog ids only (including the query text, so
 * editing a catalog phrase starts a fresh entry); the API key is read from env inside
 * the function and is never part of the key, tags, or cached value.
 * `bucket` (see `cacheBucket`) is a function argument, hence part of the key: it is what
 * enforces the 7-day maximum age. Thrown errors (API errors, empty results) are not cached.
 */
const searchVideosCached = unstable_cache(
  async (request: SearchRequest, bucket: number): Promise<SearchResult> => {
    // Only runs on a cache miss / refresh: visible in logs as the quota spend.
    console.info(
      `YouTube search cache miss (100 quota units): "${request.query}" [${request.relevanceLanguage}${request.shortOnly ? ', short' : ''}] week-bucket ${bucket}`,
    );
    const videos = await fetchYouTubeSearch(request);
    if (videos.length === 0) throw new NoVideosFoundError(`No videos for "${request.query}"`);
    return { videos, fetchedAt: Date.now() };
  },
  ['youtube-search', 'v3'],
  { revalidate: SEARCH_TTL_SECONDS, tags: [YOUTUBE_SEARCH_CACHE_TAG] },
);

/** `now` is injectable for tests. */
export async function searchVideos(request: SearchRequest, now: number = Date.now()): Promise<SearchResult> {
  const result = await searchVideosCached(request, cacheBucket(now));
  // Defence in depth: the bucket already guarantees this; never serve old data even if it breaks.
  if (isTooOld(result.fetchedAt, now)) {
    throw new CacheTooOldError(`Cached search for "${request.query}" is older than the allowed maximum`);
  }
  return result;
}
