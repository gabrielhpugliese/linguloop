import { NextResponse } from 'next/server';
import { buildSummary, parseSelectionParams, toFallbackSearchRequests, toSearchRequest } from '@/lib/catalog';
import { parseExcludedIds, pickFromRequests } from '@/lib/video-pick';
import {
  NoVideosFoundError,
  YouTubeApiError,
  YouTubeConfigError,
  searchVideos,
} from '@/lib/youtube-search';

/** Extra searches (each may cost 100 quota units) tried when everything found was already watched. */
const MAX_FALLBACK_SEARCHES = 2;

// Simple in-memory rate limiter (per serverless container)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // 15 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Clean up old timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function GET(request: Request) {
  // Extract IP address from headers
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip';
  
  if (isRateLimited(ip)) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json({ error: 'Too Many Requests. Please wait a minute.' }, { status: 429 });
  }

  // Every param is validated against the catalog; unknown ids are a client error.
  const parsed = parseSelectionParams(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const selection = parsed.selection;
  // Videos the client already has (history + current). Applied after the cached search, so it
  // never changes the cache key or costs quota; invalid ids are ignored, the count is capped.
  const excluded = parseExcludedIds(new URL(request.url).searchParams.getAll('exclude'));

  try {
    // Cached per search request, derived from validated ids (see src/lib/youtube-search.ts).
    const first = toSearchRequest(selection);
    // Only the "watch" goal has fallbacks: other content types for the same selection.
    const requests = [first, ...toFallbackSearchRequests(selection, first, MAX_FALLBACK_SEARCHES)];

    // Random pick happens outside the cache (minus excluded ids), so every request can get a
    // different video. Fallback searches only run if the previous list was fully excluded.
    const picked = await pickFromRequests(
      requests,
      async (searchRequest) => {
        try {
          return (await searchVideos(searchRequest)).videos;
        } catch (error) {
          // A fallback type without results just counts as "nothing new there".
          if (searchRequest !== first && error instanceof NoVideosFoundError) return [];
          throw error;
        }
      },
      excluded,
    );
    if (!picked) {
      return NextResponse.json(
        { code: 'ALL_SEEN', error: "You've watched all our picks for this topic. Try another topic or level." },
        { status: 404 },
      );
    }
    const randomVideo = picked.video;

    return NextResponse.json({
      id: randomVideo.id,
      title: randomVideo.title,
      language: selection.language,
      cefr: selection.level === 'all' ? 'Any' : selection.level,
      goal: selection.goal,
      option: selection.option,
      summary: buildSummary(selection),
    });
  } catch (error) {
    if (error instanceof NoVideosFoundError) {
      return NextResponse.json({ code: 'NO_RESULTS', error: 'No videos found' }, { status: 404 });
    }
    if (error instanceof YouTubeConfigError) {
      console.error('YOUTUBE_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    if (error instanceof YouTubeApiError) {
      console.error('YouTube API error:', error.message);
      return NextResponse.json({ error: 'YouTube API error' }, { status: 500 });
    }
    console.error('YouTube search failed:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
