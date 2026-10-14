import { unstable_cache } from 'next/cache';
import type { SearchRequest } from './catalog';

/**
 * Cached YouTube Data API v3 search.
 *
 * Every `search.list` call costs 100 quota units (10,000/day free), so results are
 * cached per search request in Next.js' Data Cache via `unstable_cache`. The request
 * (query, relevance language, short-only) is derived from catalog-validated ids in
 * src/lib/catalog.ts, so callers cannot create arbitrary cache entries.
 * On Vercel that cache is shared by all function instances and survives redeploys.
 * Only the result list is cached; callers pick a random entry per request.
 */

export interface SearchVideo {
  id: string;
  title: string;
}

/** Thrown when YOUTUBE_API_KEY is missing. */
export class YouTubeConfigError extends Error {}
/** Thrown when YouTube answers with a non-2xx status (quota exceeded, bad key, ...). */
export class YouTubeApiError extends Error {}
/** Thrown when the search succeeds but returns no videos. Thrown, so it is never cached. */
export class NoVideosFoundError extends Error {}

/** Tag on every cached search, for manual invalidation with `revalidateTag`. */
export const YOUTUBE_SEARCH_CACHE_TAG = 'youtube-search';
const SEARCH_TTL_SECONDS = 60 * 60 * 24; // 24h; after that the stale list is served while refreshing
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
 * Thrown errors (API errors, empty results) are not cached.
 */
const searchVideosCached = unstable_cache(
  async (request: SearchRequest): Promise<SearchVideo[]> => {
    // Only runs on a cache miss / refresh: visible in logs as the quota spend.
    console.info(
      `YouTube search cache miss (100 quota units): "${request.query}" [${request.relevanceLanguage}${request.shortOnly ? ', short' : ''}]`,
    );
    const videos = await fetchYouTubeSearch(request);
    if (videos.length === 0) throw new NoVideosFoundError(`No videos for "${request.query}"`);
    return videos;
  },
  ['youtube-search', 'v2'],
  { revalidate: SEARCH_TTL_SECONDS, tags: [YOUTUBE_SEARCH_CACHE_TAG] },
);

export function searchVideos(request: SearchRequest): Promise<SearchVideo[]> {
  return searchVideosCached(request);
}
