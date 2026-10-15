/**
 * Picking a video the user has not seen yet. Pure logic (no Next.js imports), so it can
 * be tested in isolation. The exclusion list never reaches the YouTube cache: it is
 * applied to the cached list afterwards (see src/app/api/videos/route.ts).
 */

import type { SearchRequest } from './catalog';

export interface PickableVideo {
  id: string;
  title: string;
}

/** Max number of excluded ids honoured per request (history is capped at 50 + current). */
export const MAX_EXCLUDED_IDS = 100;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parses `exclude=id1,id2,...` (the param may also be repeated). Invalid ids are ignored,
 * duplicates collapsed, and at most `MAX_EXCLUDED_IDS` valid ids are kept (the first ones;
 * the client sends the most relevant first).
 */
export function parseExcludedIds(values: readonly string[]): Set<string> {
  const ids = new Set<string>();
  for (const value of values) {
    for (const part of value.split(',')) {
      const id = part.trim();
      if (!YOUTUBE_ID.test(id)) continue;
      ids.add(id);
      if (ids.size >= MAX_EXCLUDED_IDS) return ids;
    }
  }
  return ids;
}

/** Uniformly random video not in `excluded`, or null when every video is excluded. */
export function pickUnseen<T extends PickableVideo>(
  videos: readonly T[],
  excluded: ReadonlySet<string>,
  random: () => number = Math.random,
): T | null {
  const pool = excluded.size === 0 ? videos : videos.filter((video) => !excluded.has(video.id));
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/**
 * Tries each request in order and returns the first unseen video with the request that
 * produced it, or null if all of them are fully excluded. A search is only started when
 * the previous one had nothing left, so the fallbacks cost quota only when needed.
 * Errors from `search` propagate.
 */
export async function pickFromRequests<T extends PickableVideo>(
  requests: readonly SearchRequest[],
  search: (request: SearchRequest) => Promise<readonly T[]>,
  excluded: ReadonlySet<string>,
  random: () => number = Math.random,
): Promise<{ video: T; request: SearchRequest } | null> {
  for (const request of requests) {
    const video = pickUnseen(await search(request), excluded, random);
    if (video) return { video, request };
  }
  return null;
}
